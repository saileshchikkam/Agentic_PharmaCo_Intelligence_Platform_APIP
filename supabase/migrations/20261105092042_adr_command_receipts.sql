create function apip_adr.find_command_receipt(p_case uuid, p_expected integer, p_command uuid, p_kind text, p_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  prior apip_adr.revisions%rowtype;
begin
  if actor is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  select * into prior from apip_adr.revisions
    where owner_id = actor and case_id = p_case and command_id = p_command;
  if not found then return null; end if;
  if prior.request_hash is distinct from p_hash or prior.command_kind is distinct from p_kind
    or prior.revision - 1 is distinct from p_expected
  then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return prior.snapshot;
end;
$$;
revoke all on function apip_adr.find_command_receipt(uuid,integer,uuid,text,text) from public, anon, authenticated;
