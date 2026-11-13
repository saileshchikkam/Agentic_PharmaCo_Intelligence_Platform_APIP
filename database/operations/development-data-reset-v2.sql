-- DEVELOPMENT DATA RESET PREPARATION ONLY. NOT EXECUTED.
-- Exact source project, archive manifest and this file checksum require owner approval.
-- Auth users are removed afterward through the Auth Admin API, never with this SQL.
\set ON_ERROR_STOP on
\if :{?approved_subjects}
\else
 \echo 'STOP: exact approved UUID manifest is required.'
 \quit 3
\endif
\if :{?approved_project}
\else
 \echo 'STOP: exact development project is required.'
 \quit 3
\endif
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='60s';
SELECT set_config('apip.reset.project', :'approved_project',true);
CREATE TEMP TABLE reset_targets(subject uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO reset_targets SELECT value::uuid FROM jsonb_array_elements_text(:'approved_subjects'::jsonb);
LOCK TABLE apip_sharing.receipts,apip_sharing.audit,apip_sharing.requests,apip_sharing.directory,
 apip_identity.command_receipts,apip_identity.audit_events,apip_identity.decisions,apip_identity.provisioning_events,
 apip_identity.administrator_capabilities,apip_identity.applications,apip_identity.account_roles,
 apip_adr.pdf_exports,apip_adr.revisions,apip_adr.cases,public.patient_profiles IN ACCESS EXCLUSIVE MODE;
DO $$
DECLARE r record; actual bigint; fingerprint text;
BEGIN
 IF current_setting('apip.reset.project')<>'kstxwoitiistmvivwixd' OR current_user<>'postgres' THEN RAISE EXCEPTION 'WRONG_RESET_TARGET';END IF;
 IF (SELECT count(*) FROM reset_targets)<>10 OR EXISTS(SELECT id FROM auth.users EXCEPT SELECT subject FROM reset_targets)
 OR EXISTS(SELECT subject FROM reset_targets EXCEPT SELECT id FROM auth.users) THEN RAISE EXCEPTION 'ACCOUNT_SCOPE_CHANGED';END IF;
 FOR r IN SELECT * FROM (VALUES
  ('apip_adr.cases',38,'2afbbda0495ecb0a001f2a7d084dd879'),
  ('apip_adr.pdf_exports',61,'3f93283deba961c4665db3086764c6cd'),
  ('apip_adr.revisions',220,'40ed83dbba48fbc2cbc5792423d65ff3'),
  ('apip_identity.account_roles',0,'d41d8cd98f00b204e9800998ecf8427e'),
  ('apip_identity.administrator_capabilities',1,'12e1af94024ba7a69ec954ffd9956695'),
  ('apip_identity.applications',2,'2a7742afd82573256c8cd9232831efb7'),
  ('apip_identity.audit_events',10,'8a378e632739dcf6dd69c786fa0e6db5'),
  ('apip_identity.command_receipts',10,'c0b3de70fe95e10b0d21d1a8e896d810'),
  ('apip_identity.decisions',5,'8a9b98c017b6e4d7a170d218d838c3ae'),
  ('apip_identity.provisioning_events',1,'df1c00e13e596f9925f07a8c843c0d08'),
  ('apip_sharing.audit',117,'5cfed1d2ccf1bb768e5e0061ed943f55'),
  ('apip_sharing.directory',1,'6af9da8c6f8fc4242176ca66e9ac75d9'),
  ('apip_sharing.receipts',27,'2a8cb7b53bf274427842c5c4fc38ad42'),
  ('apip_sharing.requests',27,'0c180201001e9036e1a3a8026dfa66ac'),
  ('public.patient_profiles',1,'ed3769028809ed04659d74f465c80528')) v(name,expected,digest)
 LOOP
  EXECUTE format($query$SELECT count(*),md5(coalesce(string_agg(h,'' ORDER BY h),'')) FROM (SELECT md5(to_jsonb(t)::text) h FROM %s t) x$query$,r.name) INTO actual,fingerprint;
  IF actual<>r.expected OR fingerprint<>r.digest THEN RAISE EXCEPTION 'RECORD_SCOPE_CHANGED';END IF;
 END LOOP;
 IF (SELECT count(*) FROM storage.objects)<>0 THEN RAISE EXCEPTION 'STORAGE_SCOPE_CHANGED';END IF;
END $$;
-- Baseline guards: this transaction must preserve every trigger definition and RLS setting.
CREATE TEMP TABLE reset_trigger_baseline ON COMMIT DROP AS
 SELECT t.oid,t.tgenabled,pg_get_triggerdef(t.oid) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname LIKE 'apip_%' OR (n.nspname='public' AND c.relname='patient_profiles');
CREATE TEMP TABLE reset_rls_baseline ON COMMIT DROP AS
 SELECT c.oid,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname LIKE 'apip_%' OR (n.nspname='public' AND c.relname='patient_profiles');
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reset_trigger_baseline WHERE tgenabled<>'O') THEN RAISE EXCEPTION 'UNEXPECTED_TRIGGER_STATE';END IF;END $$;
-- Exceptional owner-approved maintenance: ONLY these eight user triggers, inside this transaction.
-- No session_replication_role changes; no RLS changes; no constraint disabling; no TRUNCATE.
ALTER TABLE apip_sharing.receipts DISABLE TRIGGER sharing_receipts_immutable;
ALTER TABLE apip_sharing.audit DISABLE TRIGGER sharing_audit_immutable;
ALTER TABLE apip_identity.command_receipts DISABLE TRIGGER identity_receipts_immutable;
ALTER TABLE apip_identity.audit_events DISABLE TRIGGER identity_audit_immutable;
ALTER TABLE apip_identity.decisions DISABLE TRIGGER identity_decisions_immutable;
ALTER TABLE apip_identity.provisioning_events DISABLE TRIGGER identity_provisioning_immutable;
ALTER TABLE apip_adr.pdf_exports DISABLE TRIGGER adr_immutable_exports;
ALTER TABLE apip_adr.revisions DISABLE TRIGGER adr_immutable_revisions;
SET CONSTRAINTS ALL DEFERRED;
DELETE FROM apip_sharing.receipts WHERE actor IN (SELECT subject FROM reset_targets) OR request_id IN (SELECT id FROM apip_sharing.requests WHERE patient IN (SELECT subject FROM reset_targets) OR specialist IN (SELECT subject FROM reset_targets));
DELETE FROM apip_sharing.audit WHERE actor IN (SELECT subject FROM reset_targets) OR request_id IN (SELECT id FROM apip_sharing.requests WHERE patient IN (SELECT subject FROM reset_targets) OR specialist IN (SELECT subject FROM reset_targets));
DELETE FROM apip_sharing.requests WHERE patient IN (SELECT subject FROM reset_targets) OR specialist IN (SELECT subject FROM reset_targets);
DELETE FROM apip_sharing.directory WHERE specialist IN (SELECT subject FROM reset_targets);
DELETE FROM apip_identity.command_receipts WHERE actor IN (SELECT subject FROM reset_targets) OR application_id IN (SELECT id FROM apip_identity.applications WHERE owner_id IN (SELECT subject FROM reset_targets));
DELETE FROM apip_identity.audit_events WHERE actor IN (SELECT subject FROM reset_targets) OR application_id IN (SELECT id FROM apip_identity.applications WHERE owner_id IN (SELECT subject FROM reset_targets));
DELETE FROM apip_identity.decisions WHERE actor IN (SELECT subject FROM reset_targets) OR application_id IN (SELECT id FROM apip_identity.applications WHERE owner_id IN (SELECT subject FROM reset_targets));
DELETE FROM apip_identity.provisioning_events WHERE subject IN (SELECT subject FROM reset_targets);
DELETE FROM apip_identity.administrator_capabilities WHERE subject IN (SELECT subject FROM reset_targets);
DELETE FROM apip_identity.applications WHERE owner_id IN (SELECT subject FROM reset_targets);
DELETE FROM apip_identity.account_roles WHERE subject IN (SELECT subject FROM reset_targets);
DELETE FROM apip_adr.pdf_exports WHERE owner_id IN (SELECT subject FROM reset_targets);
DELETE FROM apip_adr.revisions WHERE owner_id IN (SELECT subject FROM reset_targets);
DELETE FROM apip_adr.cases WHERE owner_id IN (SELECT subject FROM reset_targets);
DELETE FROM public.patient_profiles WHERE user_id IN (SELECT subject FROM reset_targets);
-- Drain deferred FK events before restoring table triggers (PostgreSQL 55006).
SET CONSTRAINTS ALL IMMEDIATE;
ALTER TABLE apip_sharing.receipts ENABLE TRIGGER sharing_receipts_immutable;
ALTER TABLE apip_sharing.audit ENABLE TRIGGER sharing_audit_immutable;
ALTER TABLE apip_identity.command_receipts ENABLE TRIGGER identity_receipts_immutable;
ALTER TABLE apip_identity.audit_events ENABLE TRIGGER identity_audit_immutable;
ALTER TABLE apip_identity.decisions ENABLE TRIGGER identity_decisions_immutable;
ALTER TABLE apip_identity.provisioning_events ENABLE TRIGGER identity_provisioning_immutable;
ALTER TABLE apip_adr.pdf_exports ENABLE TRIGGER adr_immutable_exports;
ALTER TABLE apip_adr.revisions ENABLE TRIGGER adr_immutable_revisions;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM reset_trigger_baseline b JOIN pg_trigger t ON t.oid=b.oid WHERE t.tgenabled<>b.tgenabled OR pg_get_triggerdef(t.oid)<>b.definition)
 OR EXISTS(SELECT 1 FROM reset_rls_baseline b JOIN pg_class c ON c.oid=b.oid WHERE c.relrowsecurity<>b.relrowsecurity OR c.relforcerowsecurity<>b.relforcerowsecurity) THEN RAISE EXCEPTION 'SECURITY_STATE_CHANGED';END IF;
END $$;
COMMIT;
-- STOP: This does not remove Auth users. Supported, separately approved Auth Admin API deletion follows.
