-- Phase 3C-B policy v1. Hosted execution requires separate exact-SQL approval.
-- Private exact-revision consent/assignment; no changes to patient ownership policies.
begin;
create schema apip_sharing;
revoke all on schema apip_sharing from public,anon,authenticated;
create role apip_sharing_executor nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole;
grant usage on schema apip_sharing to apip_sharing_executor;
create function apip_sharing.subject() returns uuid language sql stable security invoker set search_path='' as $$
 select nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function apip_sharing.eligible(p_subject uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from apip_identity.applications where owner_id=p_subject and state='APPROVED' and valid_until>now())
$$;
create table apip_sharing.directory (
 specialist uuid primary key references auth.users(id),
 opted_in boolean not null default false,
 display_name text not null check(length(display_name) between 1 and 300),
 category text not null check(category in ('Pharmacovigilance Associate','Pharmacist','Clinical Reviewer','Pharmacovigilance Coordinator')),
 organization text not null check(length(organization)<=300),
 version integer not null check(version>0)
);
create table apip_sharing.requests (
 id uuid primary key,patient uuid not null,specialist uuid not null references auth.users(id),
 case_id uuid not null,revision integer not null,
 state text not null check(state in ('active','withdrawn','declined')),
 version integer not null check(version>0),
 policy_version text not null check(policy_version='phase3c-b-v1'),
 snapshot jsonb not null,
 disclosure jsonb not null check(jsonb_typeof(disclosure)='object'),
 disclosure_digest text not null check(disclosure_digest ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 check(patient<>specialist),
 foreign key(patient,case_id,revision) references apip_adr.revisions(owner_id,case_id,revision)
);
create unique index sharing_one_active_case on apip_sharing.requests(patient,case_id) where state='active';
create index sharing_patient_page on apip_sharing.requests(patient,created_at desc,id);
create index sharing_recipient_page on apip_sharing.requests(specialist,state,created_at desc,id);
create table apip_sharing.audit (
 id uuid primary key,request_id uuid references apip_sharing.requests(id),
 actor uuid not null references auth.users(id),action text not null,
 command_id uuid not null,occurred_at timestamptz not null default now(),
 unique(actor,command_id,action)
);
create table apip_sharing.receipts (
 actor uuid not null references auth.users(id),command_id uuid not null,
 request_hash text not null check(request_hash ~ '^[a-f0-9]{64}$'),
 request_id uuid not null references apip_sharing.requests(id),
 primary key(actor,command_id)
);
alter table apip_sharing.directory enable row level security;
alter table apip_sharing.requests enable row level security;
alter table apip_sharing.audit enable row level security;
alter table apip_sharing.receipts enable row level security;
revoke all on all tables in schema apip_sharing from public,anon,authenticated,apip_adr_writer;
grant select,insert on apip_sharing.directory,apip_sharing.requests to apip_sharing_executor;
grant update(opted_in,display_name,category,organization,version) on apip_sharing.directory to apip_sharing_executor;
grant update(state,version) on apip_sharing.requests to apip_sharing_executor;
grant select,insert on apip_sharing.audit,apip_sharing.receipts to apip_sharing_executor;
create policy sharing_directory_read on apip_sharing.directory for select to apip_sharing_executor
 using(specialist=(select apip_sharing.subject()) or (opted_in and apip_sharing.eligible(specialist)));
create policy sharing_directory_insert on apip_sharing.directory for insert to apip_sharing_executor
 with check(specialist=(select apip_sharing.subject()) and apip_sharing.eligible(specialist));
create policy sharing_directory_update on apip_sharing.directory for update to apip_sharing_executor
 using(specialist=(select apip_sharing.subject())) with check(specialist=(select apip_sharing.subject()));
create policy sharing_requests_read on apip_sharing.requests for select to apip_sharing_executor
 using(patient=(select apip_sharing.subject()) or (specialist=(select apip_sharing.subject()) and state='active' and apip_sharing.eligible(specialist)));
create policy sharing_requests_insert on apip_sharing.requests for insert to apip_sharing_executor
 with check(patient=(select apip_sharing.subject()) and apip_sharing.eligible(specialist));
create policy sharing_requests_update on apip_sharing.requests for update to apip_sharing_executor
 using(patient=(select apip_sharing.subject()) or (specialist=(select apip_sharing.subject()) and state='active' and apip_sharing.eligible(specialist)))
 with check(patient=(select apip_sharing.subject()) or (specialist=(select apip_sharing.subject()) and state in ('active','declined') and apip_sharing.eligible(specialist)));
create policy sharing_audit_read on apip_sharing.audit for select to apip_sharing_executor
 using(actor=(select apip_sharing.subject()) or exists(select 1 from apip_sharing.requests r where r.id=request_id and r.patient=(select apip_sharing.subject())));
create policy sharing_audit_insert on apip_sharing.audit for insert to apip_sharing_executor with check(actor=(select apip_sharing.subject()));
create policy sharing_receipt_read on apip_sharing.receipts for select to apip_sharing_executor using(actor=(select apip_sharing.subject()));
create policy sharing_receipt_insert on apip_sharing.receipts for insert to apip_sharing_executor with check(actor=(select apip_sharing.subject()));
create function apip_sharing.immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'IMMUTABLE_SHARING_HISTORY';end;$$;
create trigger sharing_audit_immutable before update or delete on apip_sharing.audit for each row execute function apip_sharing.immutable();
create trigger sharing_receipts_immutable before update or delete on apip_sharing.receipts for each row execute function apip_sharing.immutable();
revoke all on all functions in schema apip_sharing from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_sharing.subject(),apip_sharing.eligible(uuid) to apip_sharing_executor;
-- Private owner-checked bridge: no specialist raw-table SELECT privilege.
create function apip_sharing.owner_snapshot(p_case uuid,p_revision integer) returns jsonb language sql stable security definer set search_path='' as $$
 select snapshot from apip_adr.revisions where owner_id=apip_sharing.subject() and case_id=p_case and revision=p_revision
$$;
create function apip_sharing.own_directory_profile() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('display_name',profile->>'fullName','category',profile->>'category','organization',profile->>'organization') from apip_identity.applications where owner_id=apip_sharing.subject() and state='APPROVED' and valid_until>now()
$$;
revoke all on function apip_sharing.owner_snapshot(uuid,integer),apip_sharing.own_directory_profile() from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_sharing.owner_snapshot(uuid,integer),apip_sharing.own_directory_profile() to apip_sharing_executor;
create function apip_sharing.decline_owned_assignment(p_id uuid,p_expected integer,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=apip_sharing.subject();r apip_sharing.requests;
begin
 select * into r from apip_sharing.requests where id=p_id and specialist=actor and state='active' for update;
 if not found or actor is null or not apip_sharing.eligible(actor) then raise exception 'NOT_FOUND';end if;
 if r.version<>p_expected or p_expected is null then raise exception 'REVISION_CONFLICT';end if;
 update apip_sharing.requests set state='declined',version=version+1 where id=r.id;
 insert into apip_sharing.audit values(gen_random_uuid(),r.id,actor,'specialist_decline',p_key,now());
 return jsonb_build_object('id',r.id,'state','declined','version',r.version+1);
end;$$;
revoke all on function apip_sharing.decline_owned_assignment(uuid,integer,uuid) from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_sharing.decline_owned_assignment(uuid,integer,uuid) to apip_sharing_executor;
create function apip_sharing.operation(p_op text,p_id uuid,p_body jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
<<sharing_ctx>>
declare actor uuid:=apip_sharing.subject();r apip_sharing.requests;receipt apip_sharing.receipts;snap jsonb;profile jsonb;fingerprint text;answer jsonb;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:'||actor::text,7342));
 if p_op='directory' then return coalesce((select jsonb_agg(jsonb_build_object('id',specialist,'name',display_name,'category',category,'organization',organization) order by specialist) from (select * from apip_sharing.directory where opted_in and specialist<>actor and apip_sharing.eligible(specialist) order by specialist limit 50) d),'[]');end if;
 if p_op in ('inbox','count') and not apip_sharing.eligible(actor) then raise exception 'FORBIDDEN';end if;
 if p_op='count' then return jsonb_build_object('count',(select count(*) from apip_sharing.requests where specialist=actor and state='active'));end if;
 if p_op in ('inbox','patient_list') then return coalesce((select jsonb_agg(jsonb_build_object('id',id,'caseId',case_id,'revision',revision,'state',state,'version',version,'assignedAt',created_at) order by created_at desc,id) from (select * from apip_sharing.requests where (p_op='inbox' and specialist=actor and state='active') or (p_op='patient_list' and patient=actor) order by created_at desc,id limit 50) t),'[]');end if;
 if p_op='directory_status' then return jsonb_build_object('optedIn',coalesce((select opted_in from apip_sharing.directory where specialist=actor),false),'version',coalesce((select version from apip_sharing.directory where specialist=actor),0));end if;
 if p_op='opt_in' then
  if exists(select 1 from apip_sharing.audit where audit.actor=sharing_ctx.actor and command_id=p_key) then
   if not exists(select 1 from apip_sharing.audit where audit.actor=sharing_ctx.actor and command_id=p_key and action='directory_opt_in:'||(p_body->>'optedIn')) then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   return jsonb_build_object('optedIn',(select opted_in from apip_sharing.directory where specialist=actor));end if;
  if p_body->'optedIn'='false'::jsonb then
   update apip_sharing.directory set opted_in=false,version=version+1 where specialist=actor;
   insert into apip_sharing.audit values(gen_random_uuid(),null,actor,'directory_opt_in:false',p_key,now());return jsonb_build_object('optedIn',false);end if;
  profile:=apip_sharing.own_directory_profile();if profile is null or jsonb_typeof(p_body->'optedIn')<>'boolean' then raise exception 'FORBIDDEN';end if;
  insert into apip_sharing.directory values(actor,(p_body->>'optedIn')::boolean,profile->>'display_name',profile->>'category',coalesce(profile->>'organization',''),1)
   on conflict(specialist) do update set opted_in=excluded.opted_in,display_name=excluded.display_name,category=excluded.category,organization=excluded.organization,version=directory.version+1;
  insert into apip_sharing.audit values(gen_random_uuid(),null,actor,'directory_opt_in:'||(p_body->>'optedIn'),p_key,now());return jsonb_build_object('optedIn',(p_body->>'optedIn')::boolean);end if;
 if p_op='create' then
  if p_body->>'policyVersion' is distinct from 'phase3c-b-v1' or p_body->'consent' is distinct from 'true'::jsonb then raise exception 'EXPLICIT_CONSENT_REQUIRED';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-case:'||actor::text||(p_body->>'caseId'),7344));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:'||(p_body->>'specialist'),7342));
  if actor=(p_body->>'specialist')::uuid or not exists(select 1 from apip_sharing.directory where specialist=(p_body->>'specialist')::uuid and opted_in and apip_sharing.eligible(specialist)) then raise exception 'RECIPIENT_UNAVAILABLE';end if;
  snap:=apip_sharing.owner_snapshot((p_body->>'caseId')::uuid,(p_body->>'revision')::integer);
  if snap is null then raise exception 'NOT_FOUND';end if;
  if snap is distinct from p_body->'snapshot' then raise exception 'DISCLOSURE_MISMATCH';end if;
  fingerprint:=encode(sha256(convert_to(p_body::text,'UTF8')),'hex');
  select * into receipt from apip_sharing.receipts where receipts.actor=sharing_ctx.actor and command_id=p_key;
  if found then
   if receipt.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   select * into r from apip_sharing.requests where id=receipt.request_id;return to_jsonb(r)-'snapshot';end if;
  insert into apip_sharing.requests(id,patient,specialist,case_id,revision,state,version,policy_version,snapshot,disclosure,disclosure_digest)
   values(p_id,actor,(p_body->>'specialist')::uuid,(p_body->>'caseId')::uuid,(p_body->>'revision')::integer,'active',1,'phase3c-b-v1',snap,p_body->'disclosure',p_body->>'digest') returning * into r;
  insert into apip_sharing.audit values(gen_random_uuid(),r.id,actor,'consent_and_assignment',p_key,now());
  insert into apip_sharing.receipts values(actor,p_key,fingerprint,r.id);return to_jsonb(r)-'snapshot';end if;
 if p_op='decline' then return apip_sharing.decline_owned_assignment(p_id,(p_body->>'expectedVersion')::integer,p_key);end if;
 select * into r from apip_sharing.requests where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if p_op in ('report','pdf_snapshot','check') then
  if actor<>r.specialist or r.state<>'active' or not apip_sharing.eligible(actor) then raise exception 'NOT_FOUND';end if;
  insert into apip_sharing.audit values(gen_random_uuid(),r.id,actor,p_op,p_key,now());
  return case when p_op='pdf_snapshot' then r.snapshot when p_op='check' then jsonb_build_object('version',r.version) else jsonb_build_object('id',r.id,'revision',r.revision,'disclosure',r.disclosure) end;end if;
 if p_op='withdraw' then
  if actor<>r.patient then raise exception 'NOT_FOUND';end if;
  if r.state='withdrawn' then return to_jsonb(r)-'snapshot';end if;
  if r.version<>(p_body->>'expectedVersion')::integer then raise exception 'REVISION_CONFLICT';end if;
  update apip_sharing.requests set state='withdrawn',version=version+1 where id=r.id returning * into r;
  insert into apip_sharing.audit values(gen_random_uuid(),r.id,actor,'withdrawal',p_key,now());return to_jsonb(r)-'snapshot';end if;
 raise exception 'INVALID_REQUEST';
end;$$;
revoke all on function apip_sharing.operation(text,uuid,jsonb,uuid) from public,anon,authenticated;
grant usage on schema apip_sharing to apip_adr_writer;
grant execute on function apip_sharing.operation(text,uuid,jsonb,uuid) to apip_adr_writer;
grant apip_sharing_executor to current_user with set true;
grant apip_sharing_executor to current_user with inherit false;
grant create on schema apip_sharing to apip_sharing_executor;
alter function apip_sharing.operation(text,uuid,jsonb,uuid) owner to apip_sharing_executor;
revoke create on schema apip_sharing from apip_sharing_executor;
grant apip_sharing_executor to current_user with set false;
commit;
