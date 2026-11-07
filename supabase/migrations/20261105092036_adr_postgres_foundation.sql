-- Apply after the existing database/account-schema.sql bootstrap.
create schema apip_adr;
revoke all on schema apip_adr from public, anon, authenticated;
grant usage on schema apip_adr to authenticated;

create table apip_adr.cases (
  owner_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  revision integer not null check (revision between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);
create index adr_cases_page on apip_adr.cases (owner_id, created_at desc, id desc);

create table apip_adr.revisions (
  owner_id uuid not null,
  case_id uuid not null,
  revision integer not null check (revision between 1 and 500),
  command_id uuid not null,
  command_kind text not null check (command_kind in ('create','confirm','add_medication','describe','proposal')),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  saved_at timestamptz not null default now(),
  snapshot jsonb not null,
  primary key (owner_id, case_id, revision),
  unique (owner_id, case_id, command_id),
  foreign key (owner_id, case_id) references apip_adr.cases (owner_id, id),
  check ( (snapshot @> jsonb_build_object('schemaVersion', 1, 'fictionalOnly', true,
    'id', case_id::text, 'revision', revision)
    and jsonb_typeof(snapshot->'values') = 'object'
    and jsonb_typeof(snapshot->'medications') = 'array'
    and jsonb_array_length(snapshot->'medications') between 1 and 20
    and jsonb_typeof(snapshot->'statements') = 'array'
    and jsonb_typeof(snapshot->'proposals') = 'array'
    and jsonb_typeof(snapshot->'providerStatus') = 'string'
    and jsonb_typeof(snapshot->'updatedAt') = 'string') is true )
);
alter table apip_adr.cases add constraint adr_current_revision
  foreign key (owner_id, id, revision) references apip_adr.revisions (owner_id, case_id, revision)
  deferrable initially deferred;

create table apip_adr.pdf_exports (
  owner_id uuid not null,
  case_id uuid not null,
  revision integer not null,
  export_id uuid not null,
  template_sha256 text not null check (template_sha256 ~ '^[0-9a-f]{64}$'),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  byte_count integer not null check (byte_count between 1 and 10485760),
  created_at timestamptz not null default now(),
  primary key (owner_id, case_id, revision, export_id),
  foreign key (owner_id, case_id, revision) references apip_adr.revisions (owner_id, case_id, revision)
);

alter table apip_adr.cases enable row level security;
alter table apip_adr.revisions enable row level security;
alter table apip_adr.pdf_exports enable row level security;
revoke all on all tables in schema apip_adr from public, anon, authenticated;
grant select (owner_id, id, revision, created_at) on apip_adr.cases to authenticated;
grant select (owner_id, case_id, revision, saved_at, snapshot, command_kind) on apip_adr.revisions to authenticated;
grant select on apip_adr.pdf_exports to authenticated;
create policy adr_read_own_cases on apip_adr.cases for select to authenticated using (owner_id = (select auth.uid()));
create policy adr_read_own_revisions on apip_adr.revisions for select to authenticated using (owner_id = (select auth.uid()));
create policy adr_read_own_exports on apip_adr.pdf_exports for select to authenticated using (owner_id = (select auth.uid()));

create function apip_adr.reject_history_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE_ADR_HISTORY';
end;
$$;
create trigger adr_immutable_revisions before update or delete on apip_adr.revisions
  for each row execute function apip_adr.reject_history_change();
create trigger adr_immutable_exports before update or delete on apip_adr.pdf_exports
  for each row execute function apip_adr.reject_history_change();

-- Grant execution only to the trusted Express database role at environment setup.
-- The application verifies the session and sets the authenticated subject transaction-locally.
create function apip_adr.append_revision(
  p_case uuid, p_expected integer, p_command uuid, p_kind text, p_hash text, p_snapshot jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  current_revision integer;
  prior apip_adr.revisions%rowtype;
begin
  if actor is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  if p_expected is null or p_expected not between 0 and 499
    or p_kind is null or ((p_expected = 0) <> (p_kind = 'create'))
  then raise exception 'INVALID_REVISION'; end if;

  -- Serialize creations for the owner so concurrent cases cannot exceed the cap.
  if p_expected = 0 then
    perform pg_catalog.pg_advisory_xact_lock(73419, pg_catalog.hashtext(actor::text));
  end if;
  -- Serialize per case, including the first write where no row exists yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || ':' || p_case::text, 0));
  select * into prior from apip_adr.revisions
    where owner_id = actor and case_id = p_case and command_id = p_command;
  if found then
    if prior.request_hash is distinct from p_hash or prior.command_kind is distinct from p_kind
      or prior.revision <> p_expected + 1
    then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return prior.snapshot;
  end if;

  select revision into current_revision from apip_adr.cases
    where owner_id = actor and id = p_case for update;
  if p_expected = 0 and current_revision is null then
    if (select count(*) from apip_adr.cases where owner_id = actor) >= 100 then
      raise exception 'CASE_LIMIT';
    end if;
    insert into apip_adr.cases (owner_id, id, revision) values (actor, p_case, 1);
  elsif current_revision is distinct from p_expected then
    raise exception 'REVISION_CONFLICT';
  else
    update apip_adr.cases set revision = p_expected + 1 where owner_id = actor and id = p_case;
  end if;
  insert into apip_adr.revisions (owner_id, case_id, revision, command_id, command_kind, request_hash, snapshot)
    values (actor, p_case, p_expected + 1, p_command, p_kind, p_hash, p_snapshot);
  return p_snapshot;
end;
$$;

create function apip_adr.record_pdf_export(
  p_case uuid, p_revision integer, p_export uuid, p_template text, p_content text, p_bytes integer
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  current_revision integer;
begin
  if actor is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  select revision into current_revision from apip_adr.cases
    where owner_id = actor and id = p_case for update;
  if not found or current_revision is distinct from p_revision then
    raise exception 'REVISION_CONFLICT';
  end if;
  insert into apip_adr.pdf_exports
    (owner_id, case_id, revision, export_id, template_sha256, content_sha256, byte_count)
    values (actor, p_case, p_revision, p_export, p_template, p_content, p_bytes);
end;
$$;
revoke all on all functions in schema apip_adr from public, anon, authenticated;
