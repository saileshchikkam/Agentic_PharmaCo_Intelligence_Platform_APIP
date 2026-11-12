# Authentication recovery — 2026-11-12

## Confirmed cause

Read-only hosted inspection returned role_table=null and writer_schema_access=true. Commit 52ab750 requires account_roles while the role migration is unapplied. Valid Supabase authentication therefore does not establish a portal role. Existing identities also predate the registration trigger and remain unbound. Readiness is not authentication acceptance.

## Changes

Canonical SQL is ../../../supabase/migrations/20261112155338_account_portal_binding.sql (relative repository path: supabase/migrations/20261112155338_account_portal_binding.sql). SHA-256: 0bcf9e2b16b1a1e5ea96ce6f491c9747c0e3d813ba44cd5fe21c4367f5650c4d. Hosted application awaits exact owner approval. The trigger consumes signup role selection once on auth.users INSERT. Subsequent editable metadata is never used for role authorization. Role assignment grants no professional capability. Existing identities receive no inferred role.

The sign-in client checks verified server capabilities after Supabase sign-in and awaits local sign-out on wrong portal, missing role or failed lookup. Redirect waits until submission completes. Errors distinguish wrong portal, missing role, schema setup and service outage. Sensitive APIs retain verified-principal, role, professional approval and consent checks. Backend cannot infer which login form a caller opened; the immutable database role determines permitted resources.

## Storage boundary

Cloud application records remain PostgreSQL-backed. This is NOT yet full requested cookie/BFF compliance: Supabase SDK sessions still use JavaScript-accessible browser storage. A same-origin HttpOnly cookie session boundary, CSRF, rotation and refresh custody require additional implementation and verification before claiming compliance. Existing local SQLite development code has not been deleted or migrated; no existing database was overwritten. Browser redirect preferences are navigation hints, never role authority. PDFs currently use the existing generation pipeline, not a new private Storage archive.

## Reset inventory and safety

Read-only counts: 10 auth users; 1 patient profile; 38 cases; 220 revisions; 61 PDF export records; 2 specialist applications; 5 decisions; 10 identity audit events; 27 sharing requests; 117 sharing audit events; zero Storage objects. Restrictive Auth/ADR/identity foreign keys and immutable history prohibit a blind reset. No users have been established as disposable. No recoverable backup or Auth restoration rehearsal has been completed. Approved deletion scope: NONE. A destructive approval request is not ready. Preserve all existing accounts/history while preparing three fresh synthetic registration journeys after role-schema activation. Exact per-subject classification and backup must precede any reset. Supabase platform logs are outside this reset scope.

## Verification boundary

Disposable PostgreSQL checks pass: registration binding, metadata-update resistance, owner RLS, transaction subject cleanup, writer write denial and anon/authenticated read/execute denial. Focused auth/API checks are local fixtures, not real hosted sign-in acceptance. Fresh patient/specialist, wrong-portal, onboarding and switching acceptance are BLOCKED pending schema approval and approved synthetic browser credentials. No hosted account or approval state changed. No clinical or ADR features added.
