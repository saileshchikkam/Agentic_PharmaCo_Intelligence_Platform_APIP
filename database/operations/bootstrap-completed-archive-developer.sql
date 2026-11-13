-- TEMPLATE ONLY. Separate approval of exact UUID, confirmed email, project,
-- expiry and this operation is mandatory. No API or application startup use.
-- Supply psql variables privately using the approved database operator.
begin;
select set_config('apip.archive.subject', :'approved_subject',true),
 set_config('apip.archive.email', :'approved_email',true),
 set_config('apip.archive.reference', :'approval_reference',true),
 set_config('apip.archive.confirmation', :'approval_confirmation',true);
do $$declare target uuid:=current_setting('apip.archive.subject')::uuid;v_email text:=lower(current_setting('apip.archive.email'));begin
 if current_setting('apip.archive.confirmation')<>'APPROVE PRIVATE ARCHIVE DEVELOPER FOR 30 DAYS' then raise exception 'EXPLICIT_APPROVAL_REQUIRED';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('archive-developer-bootstrap',7353));
 if exists(select 1 from apip_archive.entitlements) then raise exception 'ALREADY_BOOTSTRAPPED';end if;
 if not exists(select 1 from auth.users where id=target and lower(auth.users.email)=v_email and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'EXACT_CONFIRMED_SUBJECT_EMAIL_REQUIRED';end if;
 if exists(select 1 from apip_identity.applications where owner_id=target) then raise exception 'SEPARATE_DEVELOPER_IDENTITY_REQUIRED';end if;
 insert into apip_archive.entitlements(subject,approved_email,valid_until,approval_reference) values(target,v_email,now()+interval '30 days',current_setting('apip.archive.reference'));
 -- The immutable audit is inserted atomically by archive_entitlement_audit.
end;$$;
commit;
