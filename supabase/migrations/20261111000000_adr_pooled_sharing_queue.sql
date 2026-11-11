-- Phase 3C-C1 PostgreSQL-authoritative pooled specialist review queue.
-- Hosted execution in kstxwoitiistmvivwixd requires separate explicit project-owner SQL approval.
begin;

create table apip_sharing.pooled_requests (
  id uuid primary key,
  patient uuid not null,
  case_id uuid not null,
  revision integer not null,
  state text not null check (state in ('pending_claim', 'claimed', 'withdrawn')),
  version integer not null check (version > 0),
  policy_version text not null check (policy_version = 'phase3c-c1-v1'),
  created_at timestamptz not null default now(),
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  active_assignment_id uuid references apip_sharing.requests(id),
  safe_metadata jsonb not null check (jsonb_typeof(safe_metadata) = 'object'),
  snapshot jsonb not null,
  disclosure jsonb not null check (jsonb_typeof(disclosure) = 'object'),
  disclosure_digest text not null check (disclosure_digest ~ '^[a-f0-9]{64}$'),
  check (patient <> claimed_by),
  check (
    (state = 'claimed' and claimed_by is not null and claimed_at is not null and active_assignment_id is not null)
    or (state in ('pending_claim', 'withdrawn') and claimed_by is null and claimed_at is null and active_assignment_id is null)
  ),
  foreign key (patient, case_id, revision) references apip_adr.revisions(owner_id, case_id, revision)
);

create unique index sharing_pool_one_active_case
  on apip_sharing.pooled_requests(patient, case_id)
  where state in ('pending_claim', 'claimed');
create index sharing_pool_queue_page
  on apip_sharing.pooled_requests(state, created_at desc, id);
create index sharing_pool_patient_page
  on apip_sharing.pooled_requests(patient, created_at desc, id);
create unique index sharing_pool_active_assignment
  on apip_sharing.pooled_requests(active_assignment_id)
  where active_assignment_id is not null;

create table apip_sharing.pool_audit (
  id uuid primary key,
  request_id uuid not null references apip_sharing.pooled_requests(id),
  actor uuid not null references auth.users(id),
  action text not null,
  command_id uuid not null,
  occurred_at timestamptz not null default now(),
  unique (actor, command_id, action)
);

create table apip_sharing.pool_receipts (
  actor uuid not null references auth.users(id),
  command_id uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  request_id uuid not null references apip_sharing.pooled_requests(id),
  primary key (actor, command_id)
);

alter table apip_sharing.pooled_requests enable row level security;
alter table apip_sharing.pool_audit enable row level security;
alter table apip_sharing.pool_receipts enable row level security;

revoke all on apip_sharing.pooled_requests, apip_sharing.pool_audit, apip_sharing.pool_receipts
  from public, anon, authenticated, apip_adr_writer;

grant select, insert on apip_sharing.pooled_requests to apip_sharing_executor;
grant update(state, version, claimed_by, claimed_at, active_assignment_id) on apip_sharing.pooled_requests to apip_sharing_executor;
grant select, insert on apip_sharing.pool_audit, apip_sharing.pool_receipts to apip_sharing_executor;

create policy sharing_pool_read on apip_sharing.pooled_requests
  for select to apip_sharing_executor
  using (
    patient = (select apip_sharing.subject())
    or (
      apip_sharing.eligible((select apip_sharing.subject()))
      and patient <> (select apip_sharing.subject())
      and (state = 'pending_claim' or claimed_by = (select apip_sharing.subject()))
    )
  );

create policy sharing_pool_insert on apip_sharing.pooled_requests
  for insert to apip_sharing_executor
  with check (patient = (select apip_sharing.subject()));

create policy sharing_pool_update on apip_sharing.pooled_requests
  for update to apip_sharing_executor
  using (
    patient = (select apip_sharing.subject())
    or (
      apip_sharing.eligible((select apip_sharing.subject()))
      and patient <> (select apip_sharing.subject())
      and (state = 'pending_claim' or claimed_by = (select apip_sharing.subject()))
    )
  )
  with check (
    patient = (select apip_sharing.subject())
    or (
      apip_sharing.eligible((select apip_sharing.subject()))
      and patient <> (select apip_sharing.subject())
      and (state = 'pending_claim' or claimed_by = (select apip_sharing.subject()))
    )
  );

create policy sharing_pool_audit_read on apip_sharing.pool_audit
  for select to apip_sharing_executor
  using (
    actor = (select apip_sharing.subject())
    or exists (
      select 1 from apip_sharing.pooled_requests pr
      where pr.id = request_id and pr.patient = (select apip_sharing.subject())
    )
  );

create policy sharing_pool_audit_insert on apip_sharing.pool_audit
  for insert to apip_sharing_executor
  with check (actor = (select apip_sharing.subject()));

create policy sharing_pool_receipt_read on apip_sharing.pool_receipts
  for select to apip_sharing_executor
  using (actor = (select apip_sharing.subject()));

create policy sharing_pool_receipt_insert on apip_sharing.pool_receipts
  for insert to apip_sharing_executor
  with check (actor = (select apip_sharing.subject()));

create trigger sharing_pool_audit_immutable
  before update or delete on apip_sharing.pool_audit
  for each row execute function apip_sharing.immutable();

create trigger sharing_pool_receipts_immutable
  before update or delete on apip_sharing.pool_receipts
  for each row execute function apip_sharing.immutable();

-- Controlled table-owner bridge: creates the active assignment row in apip_sharing.requests
-- as the claiming specialist without ever impersonating the patient subject.
create function apip_sharing.insert_claimed_assignment(
  p_pool_id uuid,
  p_assignment_id uuid,
  p_specialist uuid,
  p_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pr apip_sharing.pooled_requests;
  req apip_sharing.requests;
begin
  if p_specialist is null or p_specialist <> apip_sharing.subject() or not apip_sharing.eligible(p_specialist) then
    raise exception 'FORBIDDEN';
  end if;
  select * into pr from apip_sharing.pooled_requests where id = p_pool_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if pr.patient = p_specialist then
    raise exception 'CONFLICT_OF_INTEREST';
  end if;
  if pr.state = 'withdrawn' then
    raise exception 'NOT_FOUND';
  end if;
  if pr.state <> 'pending_claim' then
    raise exception 'ACTIVE_ASSIGNMENT_CONFLICT';
  end if;
  if exists (
    select 1 from apip_sharing.requests r
    where r.patient = pr.patient and r.case_id = pr.case_id and r.state = 'active'
  ) then
    raise exception 'ACTIVE_ASSIGNMENT_CONFLICT';
  end if;

  insert into apip_sharing.requests(
    id, patient, specialist, case_id, revision, state, version, policy_version, snapshot, disclosure, disclosure_digest
  ) values (
    p_assignment_id, pr.patient, p_specialist, pr.case_id, pr.revision, 'active', 1, 'phase3c-b-v1',
    pr.snapshot, pr.disclosure, pr.disclosure_digest
  ) returning * into req;

  insert into apip_sharing.audit(id, request_id, actor, action, command_id, occurred_at)
  values (gen_random_uuid(), req.id, p_specialist, 'pool_claim_assignment', p_key, now());

  return jsonb_build_object(
    'id', req.id,
    'caseId', req.case_id,
    'revision', req.revision,
    'state', req.state,
    'version', req.version,
    'assignedAt', req.created_at
  );
end;
$$;

revoke all on function apip_sharing.insert_claimed_assignment(uuid, uuid, uuid, uuid)
  from public, anon, authenticated, apip_adr_writer;
grant execute on function apip_sharing.insert_claimed_assignment(uuid, uuid, uuid, uuid)
  to apip_sharing_executor;

create function apip_sharing.pool_row_state(p_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from apip_sharing.pooled_requests where id = p_id) then 'NOT_FOUND'
    when exists (select 1 from apip_sharing.pooled_requests where id = p_id and patient = apip_sharing.subject()) then 'CONFLICT_OF_INTEREST'
    when exists (select 1 from apip_sharing.pooled_requests where id = p_id and state = 'withdrawn') then 'WITHDRAWN'
    when exists (select 1 from apip_sharing.pooled_requests where id = p_id and state = 'claimed') then 'ACTIVE_ASSIGNMENT_CONFLICT'
    else 'PENDING'
  end
$$;

revoke all on function apip_sharing.pool_row_state(uuid)
  from public, anon, authenticated, apip_adr_writer;
grant execute on function apip_sharing.pool_row_state(uuid)
  to apip_sharing_executor;

create function apip_sharing.pool_operation(
  p_op text,
  p_id uuid,
  p_body jsonb,
  p_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
<<pool_ctx>>
declare
  actor uuid := apip_sharing.subject();
  pr apip_sharing.pooled_requests;
  receipt apip_sharing.pool_receipts;
  snap jsonb;
  v_assigned jsonb;
  v_assignment_id uuid;
  v_req_ver integer;
  v_expected integer;
  v_fingerprint text;
  v_limit integer;
begin
  if actor is null then
    raise exception 'SIGN_IN_REQUIRED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:' || actor::text, 7342));

  if p_op = 'pool_list' then
    if not apip_sharing.eligible(actor) then
      raise exception 'FORBIDDEN';
    end if;
    v_limit := least(greatest(coalesce((p_body->>'limit')::integer, 50), 1), 100);
    return coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'caseId', q.case_id,
            'caseRef', coalesce(q.safe_metadata->>'caseRef', left(q.case_id::text, 8)),
            'revision', q.revision,
            'state', 'pending_claim',
            'createdAt', q.created_at,
            'safeMetadata', q.safe_metadata
          )
          order by q.created_at desc, q.id
        )
        from (
          select id, case_id, revision, created_at, safe_metadata
          from apip_sharing.pooled_requests
          where state = 'pending_claim' and patient <> actor
          order by created_at desc, id
          limit v_limit
        ) q
      ),
      '[]'::jsonb
    );
  end if;

  if p_op = 'pool_patient_list' then
    return coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'caseId', r.case_id,
            'revision', r.revision,
            'patient', r.patient,
            'state', r.state,
            'version', r.version,
            'policyVersion', r.policy_version,
            'createdAt', r.created_at,
            'claimedBy', null,
            'claimedAt', r.claimed_at,
            'activeAssignmentId', r.active_assignment_id,
            'safeMetadata', r.safe_metadata,
            'disclosure', r.disclosure,
            'disclosureDigest', r.disclosure_digest
          )
          order by r.created_at desc, r.id
        )
        from (
          select * from apip_sharing.pooled_requests
          where patient = actor
          order by created_at desc, id
          limit 50
        ) r
      ),
      '[]'::jsonb
    );
  end if;

  if p_op = 'pool_get' then
    select * into pr from apip_sharing.pooled_requests where id = p_id or active_assignment_id = p_id;
    if not found then
      return null;
    end if;
    if pr.patient <> actor and not (apip_sharing.eligible(actor) and pr.claimed_by = actor and pr.state = 'claimed') then
      return null;
    end if;
    return jsonb_build_object(
      'id', pr.id,
      'caseId', pr.case_id,
      'revision', pr.revision,
      'patient', pr.patient,
      'state', pr.state,
      'version', pr.version,
      'policyVersion', pr.policy_version,
      'createdAt', pr.created_at,
      'claimedBy', case when pr.claimed_by = actor then pr.claimed_by else null end,
      'claimedAt', pr.claimed_at,
      'activeAssignmentId', pr.active_assignment_id,
      'safeMetadata', pr.safe_metadata,
      'snapshot', pr.snapshot,
      'disclosure', pr.disclosure,
      'disclosureDigest', pr.disclosure_digest
    );
  end if;

  if p_op = 'pool_create' then
    if p_id is null or p_body->>'policyVersion' is distinct from 'phase3c-c1-v1' or p_body->'consent' is distinct from 'true'::jsonb then
      raise exception 'EXPLICIT_CONSENT_REQUIRED';
    end if;
    if jsonb_typeof(p_body->'safeMetadata') <> 'object' then
      raise exception 'INVALID_REQUEST';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-case:' || actor::text || (p_body->>'caseId'), 7344));
    v_fingerprint := encode(sha256(convert_to(p_body::text, 'UTF8')), 'hex');

    select * into receipt from apip_sharing.pool_receipts where pool_receipts.actor = pool_ctx.actor and command_id = p_key;
    if found then
      if receipt.request_hash <> v_fingerprint then
        raise exception 'IDEMPOTENCY_CONFLICT';
      end if;
      select * into pr from apip_sharing.pooled_requests where id = receipt.request_id;
      return jsonb_build_object(
        'id', pr.id,
        'caseId', pr.case_id,
        'revision', pr.revision,
        'patient', pr.patient,
        'state', pr.state,
        'version', pr.version,
        'policyVersion', pr.policy_version,
        'createdAt', pr.created_at,
        'claimedBy', null,
        'claimedAt', pr.claimed_at,
        'activeAssignmentId', pr.active_assignment_id,
        'safeMetadata', pr.safe_metadata,
        'disclosure', pr.disclosure,
        'disclosureDigest', pr.disclosure_digest
      );
    end if;

    snap := apip_sharing.owner_snapshot((p_body->>'caseId')::uuid, (p_body->>'revision')::integer);
    if snap is null then
      raise exception 'NOT_FOUND';
    end if;
    if snap is distinct from p_body->'snapshot' then
      raise exception 'DISCLOSURE_MISMATCH';
    end if;
    if exists (
      select 1 from apip_sharing.requests r
      where r.patient = actor and r.case_id = (p_body->>'caseId')::uuid and r.state = 'active'
    ) then
      raise exception 'ACTIVE_ASSIGNMENT_CONFLICT';
    end if;

    insert into apip_sharing.pooled_requests(
      id, patient, case_id, revision, state, version, policy_version,
      safe_metadata, snapshot, disclosure, disclosure_digest
    ) values (
      p_id, actor, (p_body->>'caseId')::uuid, (p_body->>'revision')::integer, 'pending_claim', 1, 'phase3c-c1-v1',
      p_body->'safeMetadata', snap, p_body->'disclosure', p_body->>'digest'
    ) returning * into pr;

    insert into apip_sharing.pool_audit(id, request_id, actor, action, command_id, occurred_at)
    values (gen_random_uuid(), pr.id, actor, 'pool_consent_created', p_key, now());
    insert into apip_sharing.pool_receipts(actor, command_id, request_hash, request_id)
    values (actor, p_key, v_fingerprint, pr.id);

    return jsonb_build_object(
      'id', pr.id,
      'caseId', pr.case_id,
      'revision', pr.revision,
      'patient', pr.patient,
      'state', pr.state,
      'version', pr.version,
      'policyVersion', pr.policy_version,
      'createdAt', pr.created_at,
      'claimedBy', null,
      'claimedAt', pr.claimed_at,
      'activeAssignmentId', pr.active_assignment_id,
      'safeMetadata', pr.safe_metadata,
      'disclosure', pr.disclosure,
      'disclosureDigest', pr.disclosure_digest
    );
  end if;

  if p_op = 'pool_claim' then
    if not apip_sharing.eligible(actor) then
      raise exception 'FORBIDDEN';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-pool:' || p_id::text, 7345));
    select * into pr from apip_sharing.pooled_requests where id = p_id for update;
    if not found then
      v_fingerprint := apip_sharing.pool_row_state(p_id);
      if v_fingerprint = 'ACTIVE_ASSIGNMENT_CONFLICT' then
        raise exception 'ACTIVE_ASSIGNMENT_CONFLICT';
      elsif v_fingerprint = 'CONFLICT_OF_INTEREST' then
        raise exception 'CONFLICT_OF_INTEREST';
      else
        raise exception 'NOT_FOUND';
      end if;
    end if;
    if pr.patient = actor then
      raise exception 'CONFLICT_OF_INTEREST';
    end if;
    if pr.state = 'withdrawn' then
      raise exception 'NOT_FOUND';
    end if;

    v_fingerprint := encode(sha256(convert_to('pool_claim:' || pr.id::text, 'UTF8')), 'hex');
    select * into receipt from apip_sharing.pool_receipts where pool_receipts.actor = pool_ctx.actor and command_id = p_key;
    if found then
      if receipt.request_hash <> v_fingerprint then
        raise exception 'IDEMPOTENCY_CONFLICT';
      end if;
      if pr.state = 'claimed' and pr.claimed_by = actor then
        return jsonb_build_object(
          'request', jsonb_build_object(
            'id', pr.active_assignment_id,
            'poolRequestId', pr.id,
            'caseId', pr.case_id,
            'revision', pr.revision,
            'state', 'active',
            'version', pr.version,
            'assignedAt', pr.claimed_at
          )
        );
      end if;
      raise exception 'ACTIVE_ASSIGNMENT_CONFLICT';
    end if;

    if pr.state = 'claimed' then
      if pr.claimed_by = actor then
        return jsonb_build_object(
          'request', jsonb_build_object(
            'id', pr.active_assignment_id,
            'poolRequestId', pr.id,
            'caseId', pr.case_id,
            'revision', pr.revision,
            'state', 'active',
            'version', pr.version,
            'assignedAt', pr.claimed_at
          )
        );
      end if;
      raise exception 'ACTIVE_ASSIGNMENT_CONFLICT';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-case:' || pr.patient::text || pr.case_id::text, 7344));
    v_assignment_id := gen_random_uuid();
    v_assigned := apip_sharing.insert_claimed_assignment(pr.id, v_assignment_id, actor, p_key);

    update apip_sharing.pooled_requests
    set state = 'claimed',
        claimed_by = actor,
        claimed_at = now(),
        active_assignment_id = v_assignment_id,
        version = version + 1
    where id = pr.id and state = 'pending_claim'
    returning * into pr;

    insert into apip_sharing.pool_audit(id, request_id, actor, action, command_id, occurred_at)
    values (gen_random_uuid(), pr.id, actor, 'specialist_claim', p_key, now());
    insert into apip_sharing.pool_receipts(actor, command_id, request_hash, request_id)
    values (actor, p_key, v_fingerprint, pr.id);

    return jsonb_build_object(
      'request', jsonb_build_object(
        'id', v_assignment_id,
        'poolRequestId', pr.id,
        'caseId', pr.case_id,
        'revision', pr.revision,
        'state', 'active',
        'version', pr.version,
        'assignedAt', pr.claimed_at,
        'details', v_assigned
      )
    );
  end if;

  if p_op = 'pool_release' then
    if not apip_sharing.eligible(actor) then
      raise exception 'FORBIDDEN';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-pool:' || p_id::text, 7345));
    select * into pr from apip_sharing.pooled_requests
    where id = p_id or active_assignment_id = p_id
    for update;
    if not found then
      raise exception 'NOT_FOUND';
    end if;

    if exists (
      select 1 from apip_sharing.pool_audit a
      where a.request_id = pr.id and a.actor = pool_ctx.actor and a.command_id = p_key and a.action = 'specialist_release_to_pool'
    ) then
      return jsonb_build_object(
        'request', jsonb_build_object(
          'id', pr.id,
          'caseId', pr.case_id,
          'revision', pr.revision,
          'state', pr.state,
          'version', pr.version
        )
      );
    end if;

    if pr.claimed_by <> actor or pr.state <> 'claimed' or pr.active_assignment_id is null then
      raise exception 'FORBIDDEN';
    end if;

    select version into v_req_ver from apip_sharing.requests
    where id = pr.active_assignment_id and specialist = actor and state = 'active'
    for update;
    if not found then
      raise exception 'NOT_FOUND';
    end if;

    v_expected := (p_body->>'expectedVersion')::integer;
    if v_expected is null or (p_id = pr.id and pr.version <> v_expected) or (p_id = pr.active_assignment_id and v_req_ver <> v_expected) then
      raise exception 'REVISION_CONFLICT';
    end if;

    perform apip_sharing.decline_owned_assignment(pr.active_assignment_id, v_req_ver, p_key);

    update apip_sharing.pooled_requests
    set state = 'pending_claim',
        claimed_by = null,
        claimed_at = null,
        active_assignment_id = null,
        version = version + 1
    where id = pr.id
    returning * into pr;

    insert into apip_sharing.pool_audit(id, request_id, actor, action, command_id, occurred_at)
    values (gen_random_uuid(), pr.id, actor, 'specialist_release_to_pool', p_key, now());

    return jsonb_build_object(
      'request', jsonb_build_object(
        'id', pr.id,
        'caseId', pr.case_id,
        'revision', pr.revision,
        'state', 'pending_claim',
        'version', pr.version
      )
    );
  end if;

  if p_op = 'pool_withdraw' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sharing-pool:' || p_id::text, 7345));
    select * into pr from apip_sharing.pooled_requests where id = p_id for update;
    if not found or pr.patient <> actor then
      raise exception 'NOT_FOUND';
    end if;
    if pr.state = 'withdrawn' then
      return jsonb_build_object(
        'request', jsonb_build_object(
          'id', pr.id,
          'caseId', pr.case_id,
          'revision', pr.revision,
          'state', 'withdrawn',
          'version', pr.version
        )
      );
    end if;
    v_expected := (p_body->>'expectedVersion')::integer;
    if v_expected is null or pr.version <> v_expected then
      raise exception 'REVISION_CONFLICT';
    end if;

    if pr.state = 'claimed' and pr.active_assignment_id is not null then
      select version into v_req_ver from apip_sharing.requests
      where id = pr.active_assignment_id and patient = actor and state = 'active'
      for update;
      if found then
        perform apip_sharing.operation(
          'withdraw',
          pr.active_assignment_id,
          jsonb_build_object('expectedVersion', v_req_ver),
          p_key
        );
      end if;
    end if;

    update apip_sharing.pooled_requests
    set state = 'withdrawn',
        claimed_by = null,
        claimed_at = null,
        active_assignment_id = null,
        version = version + 1
    where id = pr.id
    returning * into pr;

    insert into apip_sharing.pool_audit(id, request_id, actor, action, command_id, occurred_at)
    values (gen_random_uuid(), pr.id, actor, 'pool_withdrawal', p_key, now());

    return jsonb_build_object(
      'request', jsonb_build_object(
        'id', pr.id,
        'caseId', pr.case_id,
        'revision', pr.revision,
        'state', 'withdrawn',
        'version', pr.version
      )
    );
  end if;

  raise exception 'INVALID_REQUEST';
end;
$$;

revoke all on function apip_sharing.pool_operation(text, uuid, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function apip_sharing.pool_operation(text, uuid, jsonb, uuid)
  to apip_adr_writer;

grant apip_sharing_executor to current_user with set true;
grant create on schema apip_sharing to apip_sharing_executor;
alter function apip_sharing.pool_operation(text, uuid, jsonb, uuid) owner to apip_sharing_executor;
revoke create on schema apip_sharing from apip_sharing_executor;
grant apip_sharing_executor to current_user with set false;

commit;
