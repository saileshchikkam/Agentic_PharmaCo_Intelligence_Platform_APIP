-- Development proposal only. Exact checksum/project approval required before hosting.
-- Order: existing Phase A finalization -> pooled queue -> professional review -> this file.
begin;
do $$begin
 if to_regclass('apip_adr.finalizations') is null or to_regclass('apip_review.assessment_versions') is null or not exists(select 1 from pg_trigger where tgname='pool_finalization_guard') then raise exception 'PHASE_B_DEPENDENCY_REQUIRED';end if;
 if exists(select 1 from storage.buckets where id='apip-completed-adr') then raise exception 'ARCHIVE_BUCKET_REVIEW_REQUIRED';end if;
 -- Managed Storage owns this table; the project operator cannot CREATE POLICY.
 -- Require its existing RLS/default-deny state rather than widening permissions.
 if not (select relrowsecurity from pg_class where oid='storage.objects'::regclass) or exists(select 1 from pg_policies where schemaname='storage' and tablename='objects') then raise exception 'STORAGE_POLICY_REVIEW_REQUIRED';end if;
end;$$;
create schema apip_archive;
revoke all on schema apip_archive from public,anon,authenticated;
create role apip_archive_executor nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole;
grant usage on schema apip_archive,apip_review,apip_identity,apip_sharing to apip_archive_executor;
grant execute on function apip_review.subject(),apip_review.assignment(uuid) to apip_archive_executor;
do $handoff$declare operator name:=current_user;begin
 execute format('grant apip_review_executor to %I with set true',operator);
 set local role apip_review_executor;
 grant execute on function apip_review.eligible(uuid) to apip_archive_executor;
 grant execute on function apip_review.eligible(uuid) to apip_sharing_executor;
 execute format('grant execute on function apip_review.eligible(uuid) to %I',operator);
 execute format('set local role %I',operator);
 execute format('grant apip_review_executor to %I with set false',operator);
end;$handoff$;

-- Existing sharing eligibility additionally requires the immutable portal binding.
create or replace function apip_sharing.eligible(p_subject uuid) returns boolean language sql stable security definer set search_path='' as $$
 select apip_review.eligible(p_subject)
$$;
grant usage on schema apip_review to apip_sharing_executor;

create table apip_archive.entitlements(
 subject uuid primary key references auth.users(id),approved_email text not null check(approved_email=lower(approved_email) and approved_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 active boolean not null default true,valid_until timestamptz not null,approval_reference text not null check(length(trim(approval_reference)) between 1 and 200),unique(approved_email)
);
create table apip_archive.consent_versions(
 assignment_id uuid not null references apip_sharing.requests(id),version integer not null check(version>0),
 patient uuid not null references auth.users(id),allowed boolean not null,command_id uuid not null,created_at timestamptz not null default clock_timestamp(),
 primary key(assignment_id,version),unique(patient,command_id)
);
create unique index archive_one_active_developer on apip_archive.entitlements(active) where active;
create table apip_archive.artifacts(
 assignment_id uuid not null references apip_sharing.requests(id),assessment_version integer not null,
 case_id uuid not null,patient_revision integer not null,reviewer uuid not null references auth.users(id),finalized_at timestamptz not null,
 storage_key text not null unique,sha256 text not null check(sha256~'^[a-f0-9]{64}$'),byte_count integer not null check(byte_count between 1 and 10485760),
 archived_at timestamptz not null default now(),primary key(assignment_id,assessment_version),
 foreign key(assignment_id,assessment_version) references apip_review.assessment_versions(assignment_id,version)
);
create table apip_archive.audit(
 id uuid primary key default gen_random_uuid(),assignment_id uuid references apip_sharing.requests(id),actor uuid references auth.users(id),
 action text not null,command_id uuid not null,operator text,target uuid references auth.users(id),details jsonb not null default '{}',occurred_at timestamptz not null default clock_timestamp(),unique(actor,command_id,action)
);
alter table apip_archive.entitlements enable row level security;
alter table apip_archive.entitlements force row level security;
alter table apip_archive.consent_versions enable row level security;
alter table apip_archive.consent_versions force row level security;
alter table apip_archive.artifacts enable row level security;
alter table apip_archive.artifacts force row level security;
alter table apip_archive.audit enable row level security;
alter table apip_archive.audit force row level security;
revoke all on all tables in schema apip_archive from public,anon,authenticated,apip_adr_writer;
grant select on apip_archive.entitlements to apip_archive_executor;
grant select,insert on apip_archive.consent_versions,apip_archive.artifacts,apip_archive.audit to apip_archive_executor;
create policy archive_entitlement_self on apip_archive.entitlements for select to apip_archive_executor using(subject=(select apip_review.subject()));
do $$begin
 execute format('create policy archive_operator_entitlement_read on apip_archive.entitlements for select to %I using (true)',current_user);
 execute format('create policy archive_operator_entitlement_insert on apip_archive.entitlements for insert to %I with check (true)',current_user);
 execute format('create policy archive_operator_entitlement_update on apip_archive.entitlements for update to %I using (true) with check (true)',current_user);
end;$$;
create function apip_archive.developer_allowed() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from apip_archive.entitlements where subject=apip_review.subject() and active and valid_until>now() and approved_email=lower(current_setting('request.jwt.claim.email',true)) and current_setting('request.jwt.claim.email_verified',true)='true')
$$;
create policy archive_consent_read on apip_archive.consent_versions for select to apip_archive_executor using(patient=(select apip_review.subject()) or apip_archive.developer_allowed() or (apip_review.assignment(assignment_id)->>'specialist'=(select apip_review.subject())::text and apip_review.eligible((select apip_review.subject()))));
create policy archive_consent_insert on apip_archive.consent_versions for insert to apip_archive_executor with check(patient=(select apip_review.subject()) and apip_review.assignment(assignment_id)->>'patient'=patient::text);
create function apip_archive.allowed(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select allowed from apip_archive.consent_versions where assignment_id=p_id order by version desc limit 1),false)
 and apip_review.assignment(p_id)->>'state'='active' and apip_review.eligible((apip_review.assignment(p_id)->>'specialist')::uuid)
$$;
create policy archive_artifact_read on apip_archive.artifacts for select to apip_archive_executor using((reviewer=(select apip_review.subject()) or apip_archive.developer_allowed()) and apip_archive.allowed(assignment_id));
create policy archive_artifact_insert on apip_archive.artifacts for insert to apip_archive_executor with check(reviewer=(select apip_review.subject()) and apip_archive.allowed(assignment_id) and apip_review.assignment(assignment_id)->>'specialist'=reviewer::text);
create policy archive_audit_read on apip_archive.audit for select to apip_archive_executor using(actor=(select apip_review.subject()));
create policy archive_audit_insert on apip_archive.audit for insert to apip_archive_executor with check(actor=(select apip_review.subject()));

grant select on apip_review.assessment_versions to apip_archive_executor;
grant select(id,patient,specialist,state,case_id,revision,snapshot) on apip_sharing.requests to apip_archive_executor;
create policy archive_source_assessment on apip_review.assessment_versions for select to apip_archive_executor using(specialist=(select apip_review.subject()) and apip_review.eligible(specialist) and apip_review.assignment(assignment_id)->>'state'='active');
create policy archive_source_request on apip_sharing.requests for select to apip_archive_executor using(specialist=(select apip_review.subject()) and patient<>specialist and state='active' and apip_review.eligible(specialist));
-- Only an explicitly assigned shared snapshot; no raw patient-table/Auth grants.
create function apip_archive.review_source(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('snapshot',r.snapshot,'assessment',a.content-'reviewerNotes','assessmentVersion',a.version,'reviewer',a.specialist,'finalizedAt',a.created_at,'patientRevision',r.revision,'caseId',r.case_id)
 from apip_sharing.requests r join apip_review.assessment_versions a on a.assignment_id=r.id and a.state='final'
 where r.id=p_id and r.state='active' and r.specialist=apip_review.subject() and r.patient<>r.specialist and apip_review.eligible(r.specialist)
$$;

create function apip_archive.operation(p_op text,p_id uuid,p_body jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
<<archive_ctx>> declare actor uuid:=apip_review.subject();r jsonb;prior apip_archive.consent_versions;previous integer;source jsonb;artifact apip_archive.artifacts;wanted_version integer;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED';end if;
 if p_op='capabilities' then return jsonb_build_object('completedArchive',apip_archive.developer_allowed());end if;
 if p_op='list' then
  if not apip_archive.developer_allowed() then raise exception 'FORBIDDEN';end if;
  insert into apip_archive.audit(actor,action,command_id) values(actor,'archive_list_checked',p_key);
  return coalesce((select jsonb_agg(to_jsonb(t)-'storage_key' order by archived_at desc,assignment_id) from (select * from apip_archive.artifacts order by archived_at desc,assignment_id limit 100) t),'[]'::jsonb);
 end if;
 if p_id is null then raise exception 'INVALID_REQUEST';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:'||actor::text,7342));
 r:=apip_review.assignment(p_id);if r is null then raise exception 'NOT_FOUND';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-case:'||(r->>'patient')||(r->>'caseId'),7344));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('professional-review:'||p_id::text,7352));
 r:=apip_review.assignment(p_id);
 if r is null then raise exception 'NOT_FOUND';end if;
 if p_op in ('consent_status','consent') then
  if r->>'patient'<>actor::text then raise exception 'NOT_FOUND';end if;
  select * into prior from apip_archive.consent_versions where assignment_id=p_id order by version desc limit 1;
  if p_op='consent_status' then return jsonb_build_object('version',coalesce(prior.version,0),'allowed',coalesce(prior.allowed,false));end if;
  if p_key is null or jsonb_typeof(p_body->'allowed') is distinct from 'boolean' or p_body->>'confirmed'<>'true' or p_body->>'policyVersion'<>'phase-b-archive-v1' then raise exception 'EXPLICIT_CONSENT_REQUIRED';end if;
  if (p_body->>'allowed')::boolean and r->>'state'<>'active' then raise exception 'NOT_FOUND';end if;
  previous:=coalesce(prior.version,0);
  select * into prior from apip_archive.consent_versions where patient=actor and command_id=p_key;
  if found then
   if prior.assignment_id<>p_id or prior.allowed is distinct from (p_body->>'allowed')::boolean or prior.version is distinct from (p_body->>'expectedVersion')::integer+1 then raise exception 'IDEMPOTENCY_CONFLICT';end if;return to_jsonb(prior);
  end if;
  if previous is distinct from (p_body->>'expectedVersion')::integer then raise exception 'REVISION_CONFLICT';end if;
  insert into apip_archive.consent_versions values(p_id,previous+1,actor,(p_body->>'allowed')::boolean,p_key,clock_timestamp()) returning * into prior;
  insert into apip_archive.audit(assignment_id,actor,action,command_id) values(p_id,actor,'archive_consent',p_key);
  return to_jsonb(prior);
 end if;
 if not apip_archive.allowed(p_id) then
  if p_op in ('source','artifact','complete') and actor::text=r->>'specialist' and apip_review.eligible(actor) then raise exception 'ARCHIVE_CONSENT_REQUIRED';end if;
  raise exception 'NOT_FOUND';
 end if;
 if p_op='metadata' then
  if not apip_archive.developer_allowed() then raise exception 'FORBIDDEN';end if;
  select * into artifact from apip_archive.artifacts where assignment_id=p_id;
  if not found then raise exception 'NOT_FOUND';end if;
  insert into apip_archive.audit(assignment_id,actor,action,command_id) values(p_id,actor,'archive_access_checked',p_key);return to_jsonb(artifact);
 end if;
 if actor::text<>r->>'specialist' or not apip_review.eligible(actor) then raise exception 'NOT_FOUND';end if;
 source:=apip_archive.review_source(p_id);if source is null then raise exception 'ASSESSMENT_REQUIRED';end if;
 if p_op='source' then return source;end if;
 if p_op='artifact' then select * into artifact from apip_archive.artifacts where assignment_id=p_id;if not found then return null;end if;return to_jsonb(artifact);end if;
 if p_op<>'complete' or p_key is null then raise exception 'INVALID_REQUEST';end if;
 wanted_version:=(p_body->>'assessmentVersion')::integer;
 if wanted_version is distinct from (source->>'assessmentVersion')::integer or coalesce(p_body->>'sha256','')!~'^[a-f0-9]{64}$' or coalesce((p_body->>'bytes')::integer,0) not between 1 and 10485760 then raise exception 'INVALID_REQUEST';end if;
 select * into artifact from apip_archive.artifacts where assignment_id=p_id;
 if found then if artifact.sha256<>p_body->>'sha256' or artifact.assessment_version<>wanted_version then raise exception 'ARCHIVE_CONFLICT';end if;return to_jsonb(artifact);end if;
 insert into apip_archive.artifacts(assignment_id,assessment_version,case_id,patient_revision,reviewer,finalized_at,storage_key,sha256,byte_count)
 values(p_id,wanted_version,(source->>'caseId')::uuid,(source->>'patientRevision')::integer,actor,(source->>'finalizedAt')::timestamptz,'completed/'||p_id::text||'/'||wanted_version::text||'.pdf',p_body->>'sha256',(p_body->>'bytes')::integer) returning * into artifact;
 insert into apip_archive.audit(assignment_id,actor,action,command_id) values(p_id,actor,'archive_completed',p_key);
 return to_jsonb(artifact);
end;$$;

create trigger archive_consent_immutable before update or delete on apip_archive.consent_versions for each row execute function apip_review.immutable();
create trigger archive_artifact_immutable before update or delete on apip_archive.artifacts for each row execute function apip_review.immutable();
create trigger archive_audit_immutable before update or delete on apip_archive.audit for each row execute function apip_review.immutable();
-- Out-of-band entitlement edits cannot avoid a provisioning/revocation audit write.
create function apip_archive.audit_entitlement() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='UPDATE' then
  if new.subject<>old.subject or new.approved_email<>old.approved_email then raise exception 'IMMUTABLE_DEVELOPER_IDENTITY';end if;
  if new.approval_reference=old.approval_reference then raise exception 'NEW_APPROVAL_REFERENCE_REQUIRED';end if;
 end if;
 insert into apip_archive.audit(actor,action,command_id,operator,target,details) values(null,'developer_entitlement_'||lower(tg_op),gen_random_uuid(),session_user::text,new.subject,jsonb_build_object('approvalReference',new.approval_reference,'validUntil',new.valid_until,'active',new.active));return new;end;$$;
create trigger archive_entitlement_audit after insert or update on apip_archive.entitlements for each row execute function apip_archive.audit_entitlement();
do $$begin execute format('create policy archive_operator_audit on apip_archive.audit for insert to %I with check(actor is null and operator is not null)',current_user);end;$$;

revoke all on all functions in schema apip_archive from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_archive.developer_allowed(),apip_archive.allowed(uuid),apip_archive.review_source(uuid) to apip_archive_executor;
grant usage on schema apip_archive to apip_adr_writer;
grant execute on function apip_archive.operation(text,uuid,jsonb,uuid) to apip_adr_writer;
grant apip_archive_executor to current_user with set true;
grant apip_archive_executor to current_user with inherit false;
grant create on schema apip_archive to apip_archive_executor;
alter function apip_archive.developer_allowed() owner to apip_archive_executor;
alter function apip_archive.allowed(uuid) owner to apip_archive_executor;
alter function apip_archive.operation(text,uuid,jsonb,uuid) owner to apip_archive_executor;
alter function apip_archive.review_source(uuid) owner to apip_archive_executor;
revoke create on schema apip_archive from apip_archive_executor;
grant apip_archive_executor to current_user with set false;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('apip-completed-adr','apip-completed-adr',false,10485760,array['application/pdf']);
-- No browser Storage policies are created. Default deny is an activation prerequisite.
-- Future Storage policies MUST exclude this bucket and receive separate review.
commit;
