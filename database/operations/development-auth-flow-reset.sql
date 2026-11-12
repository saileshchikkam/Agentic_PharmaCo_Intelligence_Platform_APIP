-- DEVELOPMENT-ONLY AUTH FLOW CLEANUP PROPOSAL. NOT EXECUTED.
-- Separate exact owner approval is required with the main reset scope.
\set ON_ERROR_STOP on
\if :{?approved_project}
\else
 \echo 'STOP: explicit development project is required.'
 \quit 3
\endif
BEGIN;
SET LOCAL lock_timeout='10s';
SET LOCAL statement_timeout='30s';
SELECT set_config('apip.reset.project', :'approved_project',true);
LOCK TABLE auth.flow_state,auth.saml_relay_states IN SHARE ROW EXCLUSIVE MODE;
DO $$ DECLARE n bigint; fingerprint text; BEGIN
 IF current_user<>'postgres' OR current_setting('apip.reset.project')<>'kstxwoitiistmvivwixd' THEN RAISE EXCEPTION 'WRONG_RESET_TARGET';END IF;
 SELECT count(*),md5(coalesce(string_agg(h,'' order by h),'')) INTO n,fingerprint FROM (SELECT md5(to_jsonb(t)::text) h FROM auth.flow_state t) x;
 IF n<>13 OR fingerprint<>'c01d789b084342bd2a0e33ea182a6bed' OR (SELECT count(*) FROM auth.saml_relay_states)<>0 THEN RAISE EXCEPTION 'FLOW_SCOPE_CHANGED';END IF;
END $$;
-- Exactly the thirteen archived obsolete login-flow rows, guarded by whole-row digest.
DELETE FROM auth.flow_state;
COMMIT;
