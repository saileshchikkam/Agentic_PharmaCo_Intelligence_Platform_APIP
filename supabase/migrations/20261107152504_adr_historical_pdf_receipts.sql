-- Additive 3A exact-revision export receipt. Existing latest-only function is unchanged.
begin;
create function apip_adr.record_historical_pdf_export(
  p_case uuid,p_revision integer,p_export uuid,p_template text,p_content text,p_bytes integer
) returns void language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  if not exists(select 1 from apip_adr.revisions
    where owner_id=actor and case_id=p_case and revision=p_revision) then
    raise exception 'NOT_FOUND';
  end if;
  insert into apip_adr.pdf_exports(owner_id,case_id,revision,export_id,template_sha256,content_sha256,byte_count)
    values(actor,p_case,p_revision,p_export,p_template,p_content,p_bytes);
end;
$$;
revoke all on function apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer) to apip_adr_writer;
commit;
