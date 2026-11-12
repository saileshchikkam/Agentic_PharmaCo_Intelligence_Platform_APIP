-- PROPOSAL ONLY: not applied. Existing accounts deliberately remain unbound.
BEGIN;
CREATE TABLE apip_identity.account_roles (
 subject uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 role text NOT NULL CHECK(role IN ('PATIENT','SPECIALIST')),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE apip_identity.account_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apip_identity.account_roles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON apip_identity.account_roles FROM PUBLIC,anon,authenticated,apip_adr_writer;
GRANT SELECT ON apip_identity.account_roles TO apip_adr_writer;
CREATE POLICY account_role_owner_read ON apip_identity.account_roles FOR SELECT TO apip_adr_writer
 USING(subject = nullif(current_setting('request.jwt.claim.sub',true),'')::uuid);
-- Registration metadata is consumed once at INSERT only. It grants no professional capability.
CREATE FUNCTION apip_identity.bind_registration_role() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.raw_user_meta_data->>'apip_registration_role' IN ('PATIENT','SPECIALIST') THEN
  INSERT INTO apip_identity.account_roles(subject,role)
  VALUES(NEW.id,NEW.raw_user_meta_data->>'apip_registration_role');
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION apip_identity.bind_registration_role() FROM PUBLIC,anon,authenticated,apip_adr_writer;
CREATE TRIGGER apip_bind_registration_role AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION apip_identity.bind_registration_role();
COMMIT;
