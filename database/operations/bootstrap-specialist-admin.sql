-- Reviewed OUT-OF-BAND procedure only. Never run on startup or with browser credentials.
-- Requires separately approved exact confirmed synthetic Auth subject, target project,
-- operation and operator/approval references. Provide psql variables privately, not in Git.
-- This file does not contain or create a password, Auth user or service-role key.
begin;
select set_config('apip.bootstrap.subject', :'approved_subject', true),
 set_config('apip.bootstrap.operator', :'operator_reference', true),
 set_config('apip.bootstrap.reference', :'approval_reference', true),
 set_config('apip.bootstrap.confirmation', :'approval_confirmation', true);
do $$
declare target uuid:=current_setting('apip.bootstrap.subject')::uuid;
begin
 if current_setting('apip.bootstrap.confirmation')<>'APPROVE IDENTITY ADMIN BOOTSTRAP' then raise exception 'EXPLICIT_APPROVAL_REQUIRED'; end if;
 if length(trim(current_setting('apip.bootstrap.operator'))) not between 1 and 200
   or length(trim(current_setting('apip.bootstrap.reference'))) not between 1 and 200 then raise exception 'APPROVAL_REFERENCE_REQUIRED'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-bootstrap',7343));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity-grant:'||target::text,7342));
 if exists(select 1 from apip_identity.administrator_capabilities) then raise exception 'ALREADY_BOOTSTRAPPED'; end if;
 if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'CONFIRMED_SYNTHETIC_SUBJECT_REQUIRED'; end if;
 if exists(select 1 from apip_identity.applications where owner_id=target) then raise exception 'SEPARATE_ADMINISTRATOR_ACCOUNT_REQUIRED'; end if;
 insert into apip_identity.administrator_capabilities(subject,capability,provisioning_reference)
 values(target,'specialist.identity.admin',current_setting('apip.bootstrap.reference'));
 insert into apip_identity.provisioning_events values(gen_random_uuid(),target,'BOOTSTRAP',
   current_setting('apip.bootstrap.operator'),current_setting('apip.bootstrap.reference'),now());
end;
$$;
commit;
