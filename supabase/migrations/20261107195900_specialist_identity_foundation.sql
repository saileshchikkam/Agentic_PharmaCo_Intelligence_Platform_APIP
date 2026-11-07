-- Phase 3B private fictional prototype. Hosted apply requires explicit SQL approval.
-- Identity tables only; no grants on apip_adr or patient_profiles.
begin;
create schema apip_identity;
revoke all on schema apip_identity from public,anon,authenticated;
create role apip_identity_executor nologin nosuperuser nobypassrls nocreatedb nocreaterole noinherit;
grant usage on schema apip_identity,auth to apip_identity_executor;

create table apip_identity.administrator_capabilities (
  subject uuid not null references auth.users(id) on delete restrict,
  capability text not null check(capability='specialist.identity.admin'),
  active boolean not null default true,
  version bigint not null default 1 check(version>0),
  provisioned_at timestamptz not null default now(),
  provisioning_reference text not null check(length(provisioning_reference) between 1 and 200),
  primary key(subject,capability)
);
create table apip_identity.applications (
  id uuid primary key,
  owner_id uuid not null unique references auth.users(id) on delete restrict,
  version integer not null check(version>0),
  state text not null check(state in ('DRAFT','SUBMITTED','PENDING_VERIFICATION','APPROVED','REJECTED','SUSPENDED','REVOKED')),
  profile jsonb not null check(jsonb_typeof(profile)='object' and pg_column_size(profile)<=8192),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(state<>'APPROVED' or valid_until is not null)
);
create table apip_identity.provisioning_events (
 id uuid primary key,subject uuid not null references auth.users(id) on delete restrict,
 action text not null check(action in ('BOOTSTRAP','REVOKE')),
 operator_reference text not null check(length(operator_reference) between 1 and 200),
 approval_reference text not null check(length(approval_reference) between 1 and 200),
 occurred_at timestamptz not null default now()
);
alter table apip_identity.provisioning_events enable row level security;
create index specialist_applications_page on apip_identity.applications(state,id);
create table apip_identity.decisions (
  id uuid primary key,
  application_id uuid not null references apip_identity.applications(id) on delete restrict,
  actor uuid not null references auth.users(id) on delete restrict,
  action text not null check(action in ('begin_verification','approve','reject','suspend','revoke','renew')),
  reason text not null check(length(reason) between 1 and 300),
  evidence_reference text not null check(length(evidence_reference)<=200),
  policy_version text not null,
  occurred_at timestamptz not null default now()
);
create table apip_identity.command_receipts (
  actor uuid not null references auth.users(id) on delete restrict,
  command_id uuid not null,
  operation text not null,
  request_hash text not null check(request_hash ~ '^[0-9a-f]{64}$'),
  application_id uuid not null references apip_identity.applications(id) on delete restrict,
  result jsonb not null,
  primary key(actor,command_id,operation)
);
create table apip_identity.audit_events (
  id uuid primary key,
  actor uuid not null references auth.users(id) on delete restrict,
  application_id uuid references apip_identity.applications(id) on delete restrict,
  action text not null,
  command_id uuid not null,
  occurred_at timestamptz not null default now(),
  unique(actor,command_id,action)
);
alter table apip_identity.administrator_capabilities enable row level security;
alter table apip_identity.applications enable row level security;
alter table apip_identity.decisions enable row level security;
alter table apip_identity.command_receipts enable row level security;
alter table apip_identity.audit_events enable row level security;
revoke all on all tables in schema apip_identity from public,anon,authenticated,apip_adr_writer;
grant select on apip_identity.administrator_capabilities to apip_identity_executor;
grant select,insert,update on apip_identity.applications to apip_identity_executor;
grant select,insert on apip_identity.decisions,apip_identity.command_receipts,apip_identity.audit_events to apip_identity_executor;
create policy identity_admin_lookup on apip_identity.administrator_capabilities for select to apip_identity_executor using(subject=(select auth.uid()));
create policy identity_application_access on apip_identity.applications to apip_identity_executor
 using(owner_id=(select auth.uid()) or exists(select 1 from apip_identity.administrator_capabilities where subject=(select auth.uid()) and active))
 with check(owner_id=(select auth.uid()) or exists(select 1 from apip_identity.administrator_capabilities where subject=(select auth.uid()) and active));
create policy identity_decision_read on apip_identity.decisions for select to apip_identity_executor
 using(exists(select 1 from apip_identity.applications a where a.id=application_id));
create policy identity_decision_write on apip_identity.decisions for insert to apip_identity_executor
 with check(actor=(select auth.uid()) and exists(select 1 from apip_identity.administrator_capabilities where subject=(select auth.uid()) and active));
create policy identity_receipt_access on apip_identity.command_receipts to apip_identity_executor
 using(actor=(select auth.uid())) with check(actor=(select auth.uid()));
create policy identity_audit_read on apip_identity.audit_events for select to apip_identity_executor
 using(actor=(select auth.uid()) or exists(select 1 from apip_identity.administrator_capabilities where subject=(select auth.uid()) and active));
create policy identity_audit_write on apip_identity.audit_events for insert to apip_identity_executor with check(actor=(select auth.uid()));

create function apip_identity.application_json(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',a.id,'owner',a.owner_id,'version',a.version,
   'state',case when a.state='APPROVED' and a.valid_until<=now() then 'EXPIRED' else a.state end,
   'profile',a.profile,'validUntil',a.valid_until,'decisions',coalesce((select jsonb_agg(jsonb_build_object(
     'id',d.id,'actor',d.actor,'action',d.action,'reason',d.reason,'evidenceReference',d.evidence_reference,
     'policyVersion',d.policy_version,'at',d.occurred_at) order by d.occurred_at,d.id)
     from apip_identity.decisions d where d.application_id=a.id),'[]'::jsonb))
 from apip_identity.applications a where a.id=p_id
$$;

create function apip_identity.identity_operation(p_op text,p_id uuid,p_expected integer,p_body jsonb,p_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
<<identity_ctx>>
declare actor uuid:=auth.uid(); is_admin boolean; a apip_identity.applications;
 prior apip_identity.command_receipts; result jsonb; fingerprint text; action text; target_state text; profile jsonb;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 -- Out-of-band administrator grant changes must acquire this same actor lock.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:'||actor::text,7342));
 perform 1 from apip_identity.administrator_capabilities where subject=actor and active;
 is_admin:=found;
 if p_op like 'admin_%' and not is_admin then raise exception 'FORBIDDEN'; end if;
 if p_op='identity' then
   select * into a from apip_identity.applications where owner_id=actor;
   return jsonb_build_object('applicationState',case when a.state='APPROVED' and a.valid_until<=now() then 'EXPIRED' else a.state end,
     'identityAdministrator',is_admin,'authorizationVersion',coalesce(a.version,0)::text,'validUntil',a.valid_until);
 elsif p_op='current' then
   select * into a from apip_identity.applications where owner_id=actor;
   return apip_identity.application_json(a.id);
 elsif p_op='admin_list' then
   if jsonb_typeof(p_body) is distinct from 'object' or (p_body->>'limit' ~ '^[0-9]{1,2}$') is not true or (p_body->>'limit')::integer not between 1 and 50
     or p_body-array['state','limit','before']<>'{}'::jsonb
     or (p_body->>'state' is not null and p_body->>'state' not in ('DRAFT','SUBMITTED','PENDING_VERIFICATION','APPROVED','REJECTED','SUSPENDED','REVOKED','EXPIRED')) then raise exception 'INVALID_REQUEST'; end if;
   return coalesce((select jsonb_agg(apip_identity.application_json(t.id) order by t.id desc) from (
     select id from apip_identity.applications where state<>'DRAFT' and (p_body->>'state' is null or
       case when state='APPROVED' and valid_until<=now() then 'EXPIRED' else state end=p_body->>'state')
       and (p_body->>'before' is null or id<(p_body->>'before')::uuid) order by id desc limit (p_body->>'limit')::integer) t),'[]'::jsonb);
 elsif p_op='admin_get' then
   if not exists(select 1 from apip_identity.applications where id=p_id and state<>'DRAFT') then return null; end if;
   return apip_identity.application_json(p_id);
 end if;
 if p_op not in ('create','command','admin_decide') or p_key is null or p_id is null or p_expected is null
   or (p_op<>'create' and p_expected not between 1 and 2147483646) then raise exception 'INVALID_REQUEST'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,7341));
 if p_op<>'create' then
   select * into a from apip_identity.applications where id=p_id for update;
   if not found or (p_op='command' and a.owner_id<>actor) then raise exception 'NOT_FOUND'; end if;
   if p_op='admin_decide' and a.owner_id=actor then raise exception 'SELF_APPROVAL_DENIED'; end if;
 end if;
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('id',p_id,'version',p_expected,'body',p_body)::text,'UTF8')),'hex');
 select * into prior from apip_identity.command_receipts where command_id=p_key and command_receipts.actor=identity_ctx.actor and operation=p_op;
 if found then
   if prior.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   -- Replay returns current state, never a stale approved capability after revocation.
   return apip_identity.application_json(prior.application_id);
 end if;
 if p_op<>'create' and a.version<>p_expected then raise exception 'REVISION_CONFLICT'; end if;
 if p_op='create' or (p_op='command' and p_body->>'type'='save_draft') then
   profile:=p_body->'profile';
   if jsonb_typeof(profile) is distinct from 'object' or
     (select array_agg(key order by key) from jsonb_object_keys(profile) key) is distinct from
       array['category','department','experience','fullName','jurisdiction','organization','qualification','registration','specialization']::text[]
     or exists(select 1 from jsonb_each(profile) v where jsonb_typeof(v.value)<>'string' or length(v.value#>>'{}')>300)
     or length(trim(profile->>'fullName'))=0 or length(trim(profile->>'qualification'))=0
     or profile->>'category' not in ('Pharmacovigilance Associate','Pharmacist','Clinical Reviewer','Pharmacovigilance Coordinator') then raise exception 'INVALID_PROFILE'; end if;
 end if;
 if p_op='create' then
   if p_body-array['profile']<> '{}'::jsonb or p_expected<>0 then raise exception 'INVALID_REQUEST'; end if;
   if exists(select 1 from apip_identity.applications where owner_id=actor) then raise exception 'REVISION_CONFLICT'; end if;
   insert into apip_identity.applications(id,owner_id,version,state,profile) values(p_id,actor,1,'DRAFT',profile) returning * into a;
 elsif p_op='command' then
   if a.state<>'DRAFT' then raise exception 'INVALID_TRANSITION'; end if;
   if p_body->>'type'='save_draft' and p_body-array['type','profile']='{}'::jsonb then
     update apip_identity.applications set profile=identity_ctx.profile,version=version+1,updated_at=now() where id=p_id returning * into a;
   elsif p_body='{"type":"submit"}'::jsonb then
     update apip_identity.applications set state='SUBMITTED',version=version+1,updated_at=now() where id=p_id returning * into a;
   else raise exception 'INVALID_REQUEST'; end if;
 else
   if p_body-array['action','reason','evidenceReference','policyVersion']<>'{}'::jsonb
     or exists(select 1 from jsonb_each(p_body) v where jsonb_typeof(v.value)<>'string')
     or coalesce(p_body->>'policyVersion','')<>'private-fictional-3b-v1'
     or coalesce(length(trim(p_body->>'reason')),0) not between 1 and 300
     or coalesce(length(p_body->>'evidenceReference'),201)>200 then raise exception 'INVALID_DECISION'; end if;
   action:=p_body->>'action';
   target_state:=case
     when action='begin_verification' and a.state='SUBMITTED' then 'PENDING_VERIFICATION'
     when action='approve' and a.state='PENDING_VERIFICATION' then 'APPROVED'
     when action='reject' and a.state in ('SUBMITTED','PENDING_VERIFICATION') then 'REJECTED'
     when action='suspend' and a.state='APPROVED' and a.valid_until>now() then 'SUSPENDED'
     when action='revoke' and a.state in ('APPROVED','SUSPENDED') then 'REVOKED'
     when action='renew' and a.state='APPROVED' and a.valid_until<=now() then 'APPROVED' end;
   if target_state is null then raise exception 'INVALID_TRANSITION'; end if;
   if action in ('approve','renew') and coalesce(length(trim(p_body->>'evidenceReference')),0)=0 then raise exception 'VERIFICATION_REQUIRED'; end if;
   insert into apip_identity.decisions values(gen_random_uuid(),p_id,actor,action,p_body->>'reason',p_body->>'evidenceReference',p_body->>'policyVersion',now());
   update apip_identity.applications set state=target_state,version=version+1,updated_at=now(),
     valid_until=case when action in ('approve','renew') then now()+interval '30 days' else valid_until end where id=p_id returning * into a;
 end if;
 insert into apip_identity.audit_events values(gen_random_uuid(),actor,a.id,coalesce(action,p_op),p_key,now());
 result:=apip_identity.application_json(a.id);
 insert into apip_identity.command_receipts values(actor,p_key,p_op,fingerprint,a.id,result);
 return result;
end;
$$;
create function apip_identity.reject_change() returns trigger language plpgsql set search_path='' as $$begin raise exception 'IMMUTABLE_IDENTITY_HISTORY'; end;$$;
create trigger identity_decisions_immutable before update or delete on apip_identity.decisions for each row execute function apip_identity.reject_change();
create trigger identity_audit_immutable before update or delete on apip_identity.audit_events for each row execute function apip_identity.reject_change();
create trigger identity_receipts_immutable before update or delete on apip_identity.command_receipts for each row execute function apip_identity.reject_change();
create trigger identity_provisioning_immutable before update or delete on apip_identity.provisioning_events for each row execute function apip_identity.reject_change();
-- Managed PostgreSQL migration operators may create roles without SET membership.
-- Permit only this transaction's ownership handoff, then remove SET capability.
grant apip_identity_executor to current_user with set true;
grant apip_identity_executor to current_user with inherit false;
revoke all on all functions in schema apip_identity from public,anon,authenticated,apip_adr_writer;
grant usage on schema apip_identity to apip_adr_writer;
grant execute on function apip_identity.identity_operation(text,uuid,integer,jsonb,uuid) to apip_adr_writer;
grant create on schema apip_identity to apip_identity_executor;
alter function apip_identity.application_json(uuid) owner to apip_identity_executor;
alter function apip_identity.identity_operation(text,uuid,integer,jsonb,uuid) owner to apip_identity_executor;
revoke create on schema apip_identity from apip_identity_executor;
grant apip_identity_executor to current_user with set false;
commit;
