-- Proposed focused Phase 3B repair. Separate exact hosted approval required.
-- No patient schema, role inheritance, approval grants or administrator bootstrap.
begin;
do $$begin
 if (select md5(prosrc) from pg_proc where oid='apip_identity.identity_operation(text,uuid,integer,jsonb,uuid)'::regprocedure)<>'af796bc0ffc6ffff291f56809d1e06af' then raise exception 'IDENTITY_FUNCTION_CHANGED'; end if;
 if exists(select 1 from pg_roles where rolname='apip_identity_executor' and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then raise exception 'UNEXPECTED_EXECUTOR_PRIVILEGES'; end if;
end;$$;
-- Invoker helper reads only the subject set transaction-locally by verified Express Auth.
create function apip_identity.request_subject() returns uuid language sql stable security invoker set search_path='' as $$
 select nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
revoke all on function apip_identity.request_subject() from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_identity.request_subject() to apip_identity_executor;
alter policy identity_admin_lookup on apip_identity.administrator_capabilities using(subject=(select apip_identity.request_subject()));
alter policy identity_application_access on apip_identity.applications using(owner_id=(select apip_identity.request_subject()) or exists(select 1 from apip_identity.administrator_capabilities where subject=(select apip_identity.request_subject()) and active))
 with check(owner_id=(select apip_identity.request_subject()) or exists(select 1 from apip_identity.administrator_capabilities where subject=(select apip_identity.request_subject()) and active));
alter policy identity_decision_write on apip_identity.decisions with check(actor=(select apip_identity.request_subject()) and exists(select 1 from apip_identity.administrator_capabilities where subject=(select apip_identity.request_subject()) and active));
alter policy identity_receipt_access on apip_identity.command_receipts using(actor=(select apip_identity.request_subject())) with check(actor=(select apip_identity.request_subject()));
alter policy identity_audit_read on apip_identity.audit_events using(actor=(select apip_identity.request_subject()) or exists(select 1 from apip_identity.administrator_capabilities where subject=(select apip_identity.request_subject()) and active));
alter policy identity_audit_write on apip_identity.audit_events with check(actor=(select apip_identity.request_subject()));
-- Existing RPC owner remains unchanged. Permit replacement only inside this transaction.
grant apip_identity_executor to current_user with set true;
grant apip_identity_executor to current_user with inherit false;
grant create on schema apip_identity to apip_identity_executor;
set local role apip_identity_executor;
create or replace function apip_identity.identity_operation(p_op text,p_id uuid,p_expected integer,p_body jsonb,p_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
<<identity_ctx>>
declare actor uuid:=apip_identity.request_subject(); is_admin boolean; a apip_identity.applications;
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
reset role;
revoke create on schema apip_identity from apip_identity_executor;
grant apip_identity_executor to current_user with set false;
commit;
