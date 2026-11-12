-- ADR professional review queue. Hosted execution requires exact-SQL owner approval.
-- The queue exposes only non-identifying metadata until an eligible specialist claims it.
begin;

create schema apip_review;
revoke all on schema apip_review from public, anon, authenticated;
create role apip_review_executor nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole;
grant usage on schema apip_review to apip_review_executor;

create function apip_review.subject() returns uuid language sql stable security invoker set search_path='' as $$
  select nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create function apip_review.eligible(p_subject uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from apip_identity.applications where owner_id=p_subject and state='APPROVED' and valid_until>now())
     and exists(select 1 from apip_sharing.directory where specialist=p_subject and opted_in)
$$;

create table apip_review.queue (
  id uuid primary key,
  patient uuid not null references auth.users(id),
  case_id uuid not null,
  revision integer not null check(revision>0),
  specialist uuid references auth.users(id),
  state text not null check(state in ('open','claimed','withdrawn','completed')),
  version integer not null check(version>0),
  policy_version text not null check(policy_version='phase3c-review-v1'),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  disclosure jsonb not null check(jsonb_typeof(disclosure)='object'),
  disclosure_digest text not null check(disclosure_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(patient,case_id,revision) references apip_adr.revisions(owner_id,case_id,revision),
  check(patient is distinct from specialist),
  check((state='open' and specialist is null) or (state<>'open')),
  check((state='claimed' and specialist is not null) or state<>'claimed')
);
create unique index review_one_active_case on apip_review.queue(patient,case_id) where state in ('open','claimed');
create index review_open_page on apip_review.queue(created_at,id) where state='open';
create index review_specialist_page on apip_review.queue(specialist,state,updated_at desc,id);
create index review_patient_page on apip_review.queue(patient,updated_at desc,id);

create table apip_review.assessment_versions (
  queue_id uuid not null references apip_review.queue(id),
  version integer not null check(version>0),
  specialist uuid not null references auth.users(id),
  state text not null check(state in ('draft','final')),
  content jsonb not null check(jsonb_typeof(content)='object'),
  created_at timestamptz not null default now(),
  primary key(queue_id,version)
);
create table apip_review.messages (
  id uuid primary key,
  queue_id uuid not null references apip_review.queue(id),
  sender uuid not null references auth.users(id),
  body text not null check(length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index review_message_page on apip_review.messages(queue_id,created_at,id);
create table apip_review.audit (
  id uuid primary key, queue_id uuid references apip_review.queue(id), actor uuid not null references auth.users(id),
  action text not null, command_id uuid not null, occurred_at timestamptz not null default now(),
  unique(actor,command_id,action)
);
create table apip_review.receipts (
  actor uuid not null references auth.users(id), command_id uuid not null,
  request_hash text not null check(request_hash ~ '^[a-f0-9]{64}$'), queue_id uuid not null references apip_review.queue(id),
  primary key(actor,command_id)
);

alter table apip_review.queue enable row level security;
alter table apip_review.assessment_versions enable row level security;
alter table apip_review.messages enable row level security;
alter table apip_review.audit enable row level security;
alter table apip_review.receipts enable row level security;
revoke all on all tables in schema apip_review from public,anon,authenticated,apip_adr_writer;
grant select,insert on apip_review.queue to apip_review_executor;
grant update(state,specialist,version,updated_at) on apip_review.queue to apip_review_executor;
grant select,insert on apip_review.assessment_versions,apip_review.messages,apip_review.audit,apip_review.receipts to apip_review_executor;

create policy review_queue_select on apip_review.queue for select to apip_review_executor using(
  patient=(select apip_review.subject()) or
  (state='open' and apip_review.eligible((select apip_review.subject()))) or
  (specialist=(select apip_review.subject()) and state in ('claimed','completed') and apip_review.eligible(specialist))
);
create policy review_queue_insert on apip_review.queue for insert to apip_review_executor with check(patient=(select apip_review.subject()));
create policy review_queue_update on apip_review.queue for update to apip_review_executor
 using(patient=(select apip_review.subject()) or specialist=(select apip_review.subject()) or (state='open' and apip_review.eligible((select apip_review.subject()))))
 with check(patient=(select apip_review.subject()) or specialist=(select apip_review.subject()) or
   (state='open' and specialist is null and apip_review.eligible((select apip_review.subject()))));
create policy review_assessment_select on apip_review.assessment_versions for select to apip_review_executor using(
  exists(select 1 from apip_review.queue q where q.id=queue_id and (q.patient=(select apip_review.subject()) or
    (q.specialist=(select apip_review.subject()) and q.state in ('claimed','completed') and apip_review.eligible(q.specialist))))
);
create policy review_assessment_insert on apip_review.assessment_versions for insert to apip_review_executor with check(
  specialist=(select apip_review.subject()) and exists(select 1 from apip_review.queue q where q.id=queue_id and q.specialist=specialist and q.state='claimed' and apip_review.eligible(specialist))
);
create policy review_message_select on apip_review.messages for select to apip_review_executor using(
  exists(select 1 from apip_review.queue q where q.id=queue_id and (q.patient=(select apip_review.subject()) or
    (q.specialist=(select apip_review.subject()) and q.state in ('claimed','completed') and apip_review.eligible(q.specialist))))
);
create policy review_message_insert on apip_review.messages for insert to apip_review_executor with check(
  sender=(select apip_review.subject()) and exists(select 1 from apip_review.queue q where q.id=queue_id and q.state='claimed' and
    (q.patient=sender or (q.specialist=sender and apip_review.eligible(sender))))
);
create policy review_audit_select on apip_review.audit for select to apip_review_executor using(actor=(select apip_review.subject()));
create policy review_audit_insert on apip_review.audit for insert to apip_review_executor with check(actor=(select apip_review.subject()));
create policy review_receipt_select on apip_review.receipts for select to apip_review_executor using(actor=(select apip_review.subject()));
create policy review_receipt_insert on apip_review.receipts for insert to apip_review_executor with check(actor=(select apip_review.subject()));

create function apip_review.immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'IMMUTABLE_REVIEW_HISTORY';end;$$;
create trigger review_assessment_immutable before update or delete on apip_review.assessment_versions for each row execute function apip_review.immutable();
create trigger review_message_immutable before update or delete on apip_review.messages for each row execute function apip_review.immutable();
create trigger review_audit_immutable before update or delete on apip_review.audit for each row execute function apip_review.immutable();
create trigger review_receipt_immutable before update or delete on apip_review.receipts for each row execute function apip_review.immutable();

revoke all on all functions in schema apip_review from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_review.subject(),apip_review.eligible(uuid) to apip_review_executor;
-- Owner-only bridge. The executor receives no raw ADR table privilege.
create function apip_review.owner_snapshot(p_case uuid,p_revision integer) returns jsonb language sql stable security definer set search_path='' as $$
 select snapshot from apip_adr.revisions where owner_id=apip_review.subject() and case_id=p_case and revision=p_revision
$$;
revoke all on function apip_review.owner_snapshot(uuid,integer) from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_review.owner_snapshot(uuid,integer) to apip_review_executor;

create function apip_review.operation(p_op text,p_id uuid,p_expected integer,p_body jsonb,p_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
<<review_ctx>>
declare actor uuid:=apip_review.subject(); q apip_review.queue; receipt apip_review.receipts; snap jsonb;
 fingerprint text; next_version integer; message_id uuid;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 if p_op in ('pool','inbox') and not apip_review.eligible(actor) then raise exception 'FORBIDDEN'; end if;
 if p_op='pool' then
   return coalesce((select jsonb_agg(jsonb_build_object('id',id,'caseRef',right(case_id::text,8),'revision',revision,'createdAt',created_at) order by created_at,id)
     from (select * from apip_review.queue where state='open' order by created_at,id limit 50) t),'[]'::jsonb);
 elsif p_op='inbox' then
   return coalesce((select jsonb_agg(jsonb_build_object('id',id,'caseRef',right(case_id::text,8),'revision',revision,'state',state,'version',version,'updatedAt',updated_at) order by updated_at desc,id)
     from (select * from apip_review.queue where specialist=actor and state in ('claimed','completed') order by updated_at desc,id limit 50) t),'[]'::jsonb);
 elsif p_op='patient_list' then
   return coalesce((select jsonb_agg(jsonb_build_object('id',id,'caseId',case_id,'revision',revision,'state',state,'version',version,'specialist',specialist,'updatedAt',updated_at) order by updated_at desc,id)
     from (select * from apip_review.queue where patient=actor order by updated_at desc,id limit 50) t),'[]'::jsonb);
 end if;
 if p_key is null or p_id is null then raise exception 'INVALID_REQUEST'; end if;
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('op',p_op,'id',p_id,'expected',p_expected,'body',p_body)::text,'UTF8')),'hex');
 select * into receipt from apip_review.receipts where receipts.actor=review_ctx.actor and command_id=p_key;
 if found then
   if receipt.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   select * into q from apip_review.queue where id=receipt.queue_id;
   return jsonb_build_object('id',q.id,'state',q.state,'version',q.version,'specialist',q.specialist);
 end if;
 if p_op='create' then
   if p_body->>'policyVersion' is distinct from 'phase3c-review-v1' or p_body->'consent' is distinct from 'true'::jsonb then raise exception 'EXPLICIT_CONSENT_REQUIRED'; end if;
   snap:=apip_review.owner_snapshot((p_body->>'caseId')::uuid,(p_body->>'revision')::integer);
   if snap is null or snap is distinct from p_body->'snapshot' then raise exception 'DISCLOSURE_MISMATCH'; end if;
   insert into apip_review.queue(id,patient,case_id,revision,state,version,policy_version,snapshot,disclosure,disclosure_digest)
    values(p_id,actor,(p_body->>'caseId')::uuid,(p_body->>'revision')::integer,'open',1,'phase3c-review-v1',snap,p_body->'disclosure',p_body->>'digest') returning * into q;
 elsif p_op='claim' then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('review-queue:'||p_id::text,7351));
   if not apip_review.eligible(actor) then raise exception 'FORBIDDEN'; end if;
   update apip_review.queue set state='claimed',specialist=actor,version=version+1,updated_at=now()
    where id=p_id and state='open' and patient<>actor and version=p_expected returning * into q;
   if not found then raise exception 'REVISION_CONFLICT'; end if;
 elsif p_op='release' then
   update apip_review.queue set state='open',specialist=null,version=version+1,updated_at=now()
    where id=p_id and specialist=actor and state='claimed' and version=p_expected and apip_review.eligible(actor) returning * into q;
   if not found then raise exception 'REVISION_CONFLICT'; end if;
 elsif p_op='withdraw' then
   update apip_review.queue set state='withdrawn',version=version+1,updated_at=now()
    where id=p_id and patient=actor and state in ('open','claimed') and version=p_expected returning * into q;
   if not found then raise exception 'REVISION_CONFLICT'; end if;
 else
   select * into q from apip_review.queue where id=p_id for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   if p_op in ('detail','messages') then
     if actor<>q.patient and (actor is distinct from q.specialist or q.state not in ('claimed','completed') or not apip_review.eligible(actor)) then raise exception 'NOT_FOUND'; end if;
     if p_op='messages' then return coalesce((select jsonb_agg(jsonb_build_object('id',id,'sender',sender,'body',body,'createdAt',created_at) order by created_at,id) from apip_review.messages where queue_id=q.id),'[]'::jsonb); end if;
     return jsonb_build_object('id',q.id,'caseId',q.case_id,'revision',q.revision,'state',q.state,'version',q.version,'disclosure',q.disclosure,
       'snapshot',q.snapshot,'assessments',coalesce((select jsonb_agg(jsonb_build_object('version',version,'state',state,'content',content,'createdAt',created_at) order by version) from apip_review.assessment_versions where queue_id=q.id),'[]'::jsonb));
   elsif p_op='assessment' then
     if actor is distinct from q.specialist or q.state<>'claimed' or not apip_review.eligible(actor) then raise exception 'NOT_FOUND'; end if;
     next_version:=coalesce((select max(version)+1 from apip_review.assessment_versions where queue_id=q.id),1);
     insert into apip_review.assessment_versions(queue_id,version,specialist,state,content) values(q.id,next_version,actor,p_body->>'state',p_body->'content');
   elsif p_op='message' then
     if q.state<>'claimed' or (actor<>q.patient and (actor is distinct from q.specialist or not apip_review.eligible(actor))) then raise exception 'NOT_FOUND'; end if;
     message_id=gen_random_uuid(); insert into apip_review.messages values(message_id,q.id,actor,p_body->>'body',now());
   elsif p_op='complete' then
     if actor is distinct from q.specialist or q.state<>'claimed' or q.version<>p_expected or not apip_review.eligible(actor) then raise exception 'REVISION_CONFLICT'; end if;
     if not exists(select 1 from apip_review.assessment_versions where queue_id=q.id and state='final') then raise exception 'ASSESSMENT_REQUIRED'; end if;
     update apip_review.queue set state='completed',version=version+1,updated_at=now() where id=q.id returning * into q;
   else raise exception 'INVALID_REQUEST'; end if;
 end if;
 insert into apip_review.audit values(gen_random_uuid(),q.id,actor,p_op,p_key,now());
 insert into apip_review.receipts values(actor,p_key,fingerprint,q.id);
 return jsonb_build_object('id',q.id,'state',q.state,'version',q.version,'specialist',q.specialist);
end;$$;
revoke all on function apip_review.operation(text,uuid,integer,jsonb,uuid) from public,anon,authenticated;
grant usage on schema apip_review to apip_adr_writer;
grant execute on function apip_review.operation(text,uuid,integer,jsonb,uuid) to apip_adr_writer;

grant apip_review_executor to current_user with set true;
grant apip_review_executor to current_user with inherit false;
grant create on schema apip_review to apip_review_executor;
alter function apip_review.operation(text,uuid,integer,jsonb,uuid) owner to apip_review_executor;
revoke create on schema apip_review from apip_review_executor;
grant apip_review_executor to current_user with set false;
commit;
