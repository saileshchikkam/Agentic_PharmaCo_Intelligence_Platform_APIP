-- Guided professional assessment and essential messaging for existing active assignments.
-- Hosted execution requires exact-SQL owner approval.
begin;
create schema apip_review;
revoke all on schema apip_review from public,anon,authenticated;
create role apip_review_executor nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole;
grant usage on schema apip_review,apip_identity,apip_sharing,apip_adr to apip_review_executor;
-- Metadata-only bridges: no raw patient snapshot or professional-profile grant.
grant select(subject,role) on apip_identity.account_roles to apip_review_executor;
grant select(owner_id,state,valid_until) on apip_identity.applications to apip_review_executor;
grant select(id,patient,specialist,state,case_id,revision,disclosure,created_at) on apip_sharing.requests to apip_review_executor;
grant select(owner_id,case_id,revision) on apip_adr.finalizations to apip_review_executor;
create policy review_role_lookup on apip_identity.account_roles for select to apip_review_executor using(true);
create policy review_approval_lookup on apip_identity.applications for select to apip_review_executor using(true);
create policy review_finalization_lookup on apip_adr.finalizations for select to apip_review_executor using(true);
do $$begin execute format('create policy review_operator_finalization_metadata on apip_adr.finalizations for select to %I using(true)',current_user);end;$$;
create function apip_review.subject() returns uuid language sql stable security invoker set search_path='' as $$select nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function apip_review.eligible(p_subject uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from apip_identity.applications a join apip_identity.account_roles r on r.subject=a.owner_id where a.owner_id=p_subject and a.state='APPROVED' and a.valid_until>now() and r.role='SPECIALIST')$$;
create function apip_review.assignment(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',r.id,'patient',r.patient,'specialist',r.specialist,'state',r.state,'caseId',r.case_id,'revision',r.revision) from apip_sharing.requests r join apip_adr.finalizations f on (f.owner_id,f.case_id,f.revision)=(r.patient,r.case_id,r.revision) where r.id=p_id and r.patient<>r.specialist$$;
create policy review_assignment_lookup on apip_sharing.requests for select to apip_review_executor using(patient=(select apip_review.subject()) or (specialist=(select apip_review.subject()) and apip_review.eligible(specialist)));
create table apip_review.assessment_versions(
 assignment_id uuid not null references apip_sharing.requests(id),version integer not null check(version>0),
 specialist uuid not null references auth.users(id),state text not null check(state in('draft','final')),
 content jsonb not null check(jsonb_typeof(content)='object'),created_at timestamptz not null default now(),
 primary key(assignment_id,version)
);
create table apip_review.messages(
 id uuid primary key,assignment_id uuid not null references apip_sharing.requests(id),sender uuid not null references auth.users(id),
 body text not null check(length(trim(body)) between 1 and 4000),created_at timestamptz not null default now()
);
create index review_messages_page on apip_review.messages(assignment_id,created_at,id);
create table apip_review.audit(
 id uuid primary key,assignment_id uuid not null references apip_sharing.requests(id),actor uuid not null references auth.users(id),
 action text not null,command_id uuid not null,occurred_at timestamptz not null default now(),unique(actor,command_id,action)
);
create table apip_review.receipts(
 actor uuid not null references auth.users(id),command_id uuid not null,request_hash text not null check(request_hash~'^[a-f0-9]{64}$'),
 assignment_id uuid not null references apip_sharing.requests(id),primary key(actor,command_id)
);
alter table apip_review.assessment_versions enable row level security;
alter table apip_review.messages enable row level security;
alter table apip_review.audit enable row level security;
alter table apip_review.receipts enable row level security;
alter table apip_review.assessment_versions force row level security;
alter table apip_review.messages force row level security;
alter table apip_review.audit force row level security;
alter table apip_review.receipts force row level security;
revoke all on all tables in schema apip_review from public,anon,authenticated,apip_adr_writer;
grant select,insert on apip_review.assessment_versions,apip_review.messages,apip_review.audit,apip_review.receipts to apip_review_executor;
create policy review_assessment_select on apip_review.assessment_versions for select to apip_review_executor using(
 specialist=(select apip_review.subject()) and apip_review.eligible(specialist) and apip_review.assignment(assignment_id)->>'state'='active' and apip_review.assignment(assignment_id)->>'specialist'=specialist::text);
create policy review_assessment_insert on apip_review.assessment_versions for insert to apip_review_executor with check(
 specialist=(select apip_review.subject()) and apip_review.eligible(specialist) and apip_review.assignment(assignment_id)->>'state'='active' and apip_review.assignment(assignment_id)->>'specialist'=specialist::text);
create policy review_messages_select on apip_review.messages for select to apip_review_executor using(apip_review.assignment(assignment_id)->>'state'='active' and
 ((apip_review.assignment(assignment_id)->>'patient')::uuid=(select apip_review.subject()) or ((apip_review.assignment(assignment_id)->>'specialist')::uuid=(select apip_review.subject()) and apip_review.eligible((select apip_review.subject())))));
create policy review_messages_insert on apip_review.messages for insert to apip_review_executor with check(sender=(select apip_review.subject()) and apip_review.assignment(assignment_id)->>'state'='active' and
 ((apip_review.assignment(assignment_id)->>'patient')::uuid=sender or ((apip_review.assignment(assignment_id)->>'specialist')::uuid=sender and apip_review.eligible(sender))));
create policy review_audit_select on apip_review.audit for select to apip_review_executor using(actor=(select apip_review.subject()));
create policy review_audit_insert on apip_review.audit for insert to apip_review_executor with check(actor=(select apip_review.subject()));
create policy review_receipts_select on apip_review.receipts for select to apip_review_executor using(actor=(select apip_review.subject()));
create policy review_receipts_insert on apip_review.receipts for insert to apip_review_executor with check(actor=(select apip_review.subject()));
create function apip_review.immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'IMMUTABLE_REVIEW_HISTORY';end;$$;
create trigger review_assessment_immutable before update or delete on apip_review.assessment_versions for each row execute function apip_review.immutable();
create trigger review_message_immutable before update or delete on apip_review.messages for each row execute function apip_review.immutable();
create trigger review_audit_immutable before update or delete on apip_review.audit for each row execute function apip_review.immutable();
create trigger review_receipts_immutable before update or delete on apip_review.receipts for each row execute function apip_review.immutable();
revoke all on all functions in schema apip_review from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_review.subject(),apip_review.eligible(uuid),apip_review.assignment(uuid) to apip_review_executor;
create function apip_review.operation(p_op text,p_id uuid,p_expected integer,p_body jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
<<review_ctx>> declare actor uuid:=apip_review.subject();r jsonb;prior apip_review.receipts;fingerprint text;next_version integer;k text;v jsonb;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:'||actor::text,7342));
 if p_op='overview' then
  if not apip_review.eligible(actor) then raise exception 'FORBIDDEN';end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'caseRef',left(t.case_id::text,8),'revision',t.revision,'assignedAt',t.created_at,'status',case when t.review_state='final' then 'Professionally finalized' when t.review_state='draft' then 'Under professional review' else 'Assigned to me' end,'initials',t.disclosure#>>'{fields,0,value}','fields',t.disclosure->'fields') order by t.created_at desc) from (select r.id,r.case_id,r.revision,r.created_at,r.disclosure, (select a.state from apip_review.assessment_versions a where a.assignment_id=r.id order by version desc limit 1) review_state from apip_sharing.requests r where r.specialist=actor and r.state='active' and exists(select 1 from apip_adr.finalizations f where (f.owner_id,f.case_id,f.revision)=(r.patient,r.case_id,r.revision)) order by r.created_at desc limit 50) t),'[]'::jsonb);
 end if;
 r:=apip_review.assignment(p_id);
 if r is null then raise exception 'NOT_FOUND';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-case:'||(r->>'patient')||(r->>'caseId'),7344));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('professional-review:'||p_id::text,7352));
 r:=apip_review.assignment(p_id);
 if r is null or r->>'state'<>'active' or (actor<>(r->>'patient')::uuid and (actor<>(r->>'specialist')::uuid or not apip_review.eligible(actor))) then raise exception 'NOT_FOUND';end if;
 if p_op='messages' then return coalesce((select jsonb_agg(jsonb_build_object('id',id,'sender',sender,'body',body,'createdAt',created_at) order by created_at,id) from apip_review.messages where assignment_id=p_id),'[]'::jsonb);end if;
 if p_op='assessments' then
  if actor<>(r->>'specialist')::uuid or not apip_review.eligible(actor) then raise exception 'NOT_FOUND';end if;
  return coalesce((select jsonb_agg(jsonb_build_object('version',version,'state',state,'content',content,'createdAt',created_at) order by version) from apip_review.assessment_versions where assignment_id=p_id),'[]'::jsonb);end if;
 if p_key is null then raise exception 'INVALID_REQUEST';end if;
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('op',p_op,'id',p_id,'expected',p_expected,'body',p_body)::text,'UTF8')),'hex');
 select * into prior from apip_review.receipts where receipts.actor=review_ctx.actor and command_id=p_key;
 if found then if prior.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT';end if;return jsonb_build_object('assignmentId',prior.assignment_id,'replayed',true);end if;
 if p_op='assessment' then
  if exists(select 1 from apip_review.assessment_versions where assignment_id=p_id and state='final') then raise exception 'ASSESSMENT_FINALIZED';end if;
  if actor<>(r->>'specialist')::uuid or not apip_review.eligible(actor) or p_body->>'state' not in('draft','final') or jsonb_typeof(p_body->'content')<>'object' then raise exception 'FORBIDDEN';end if;
  if octet_length((p_body->'content')::text)>20000 then raise exception 'INVALID_REQUEST';end if;
  for k,v in select * from jsonb_each(p_body->'content') loop
   if k not in ('clinicalAssessment','investigations','medicineVerification','seriousness','outcome','causality','causalityReasoning','observations','reviewerNotes') or jsonb_typeof(v)<>'string' or length(v#>>'{}')>4000 then raise exception 'INVALID_REQUEST';end if;
  end loop;
  if p_body->>'state'='final' then
   foreach k in array array['clinicalAssessment','medicineVerification','seriousness','outcome','causality','causalityReasoning'] loop
    if length(trim(coalesce(p_body->'content'->>k,'')))=0 then raise exception 'ASSESSMENT_REQUIRED';end if;
   end loop;
  end if;
  next_version:=coalesce((select max(version)+1 from apip_review.assessment_versions where assignment_id=p_id),1);
  if p_expected is distinct from next_version-1 then raise exception 'REVISION_CONFLICT';end if;
  insert into apip_review.assessment_versions values(p_id,next_version,actor,p_body->>'state',p_body->'content',now());
 elsif p_op='message' then
  if jsonb_typeof(p_body->'body')<>'string' or length(trim(p_body->>'body')) not between 1 and 4000 then raise exception 'INVALID_REQUEST';end if;
  insert into apip_review.messages values(gen_random_uuid(),p_id,actor,trim(p_body->>'body'),now());
 else raise exception 'INVALID_REQUEST';end if;
 insert into apip_review.audit values(gen_random_uuid(),p_id,actor,p_op,p_key,now());
 insert into apip_review.receipts values(actor,p_key,fingerprint,p_id);
 return jsonb_build_object('assignmentId',p_id,'replayed',false,'version',next_version);
end;$$;
revoke all on function apip_review.operation(text,uuid,integer,jsonb,uuid) from public,anon,authenticated;
grant usage on schema apip_review to apip_adr_writer;
grant execute on function apip_review.operation(text,uuid,integer,jsonb,uuid) to apip_adr_writer;
grant apip_review_executor to current_user with set true;
grant apip_review_executor to current_user with inherit false;
grant create on schema apip_review to apip_review_executor;
alter function apip_review.operation(text,uuid,integer,jsonb,uuid) owner to apip_review_executor;
alter function apip_review.eligible(uuid) owner to apip_review_executor;
revoke create on schema apip_review from apip_review_executor;
grant apip_review_executor to current_user with set false;
commit;
