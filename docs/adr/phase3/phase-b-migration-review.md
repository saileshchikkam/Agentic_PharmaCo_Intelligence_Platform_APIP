# Phase B migration review — pending owner approval

Target: **development project `kstxwoitiistmvivwixd` only**. No Phase B hosted SQL has been applied.

## Exact application order

Existing Phase A ledger `20261113144504` and account-role binding must remain installed. Do not replay earlier migrations.

1. `supabase/migrations/20261111000000_adr_pooled_sharing_queue.sql`

   SHA-256: `33542e73487af97c00b269ad19ea7d79f2c4ce6189a7bde978c99e894840e7b5`

2. `supabase/migrations/20261112103000_adr_professional_review.sql`

   SHA-256: `8e023eb1fbe5527c3095b92777b4f5a1cef6c40d96638d8ae1e82506161dcb7b`

3. `supabase/migrations/20261113152850_adr_completed_review_archive.sql`

   SHA-256: `06dd1096ba6215cd5c28eaeb851b8dd8cc0d2bc5cff752a962a56abc883d9ddf`

The pending pool SQL adds three private tables and audited claim/release operations. Its Phase A compatibility branch installs an exact-finalization guard through the non-login finalization executor. Temporary ownership-handoff SET/CREATE powers are removed before commit. Assignment release uses the pool ID/version pair, not a mismatched assignment version.

The pending professional-review SQL adds four forced-RLS tables, immutable assessment/message/audit/receipt history, a non-login executor, current SPECIALIST role plus independent unexpired approval, exact finalized-revision assignment checks, and identity/case/assessment locks. The private operator-owned assignment bridge exposes only assignment metadata. Other executor lookups are limited to role/approval/finalization metadata and the actor's assigned disclosure. No raw ADR case/revision read grant is added. Final assessment cannot be reopened as a new draft. Finalization requires explicit human assessment fields, including reasoning/limitations; it is not an independent second-person approval or official submission.

The archive SQL adds four forced-RLS tables (entitlements, consent versions, artifacts, audit), a non-login executor, narrowly granted operations, one private `apip-completed-adr` bucket and audit of archive access checks. It hardens existing sharing eligibility to require the immutable SPECIALIST role as well as current approval. No browser-exposed SQL, raw patient table access, person entitlement or professional approval is granted. Every new private function revokes PUBLIC/anon/authenticated EXECUTE; the writer receives operation functions only and cannot modify tables or assume executors. New executors own functions, not tables, and have no login/superuser/BYPASSRLS.

## Managed Storage preflight

Read-only hosted inspection found `storage.objects` RLS enabled and no policies, but the project operator is not its owner and cannot SET ROLE to `supabase_storage_admin`. The final archive migration therefore **does not attempt Storage policy DDL or grant ownership**. It refuses installation if Storage RLS is disabled or any policy exists, and retains the current default-deny browser state. It refuses an existing archive bucket instead of overwriting it. Future Storage policies must exclude this private bucket and receive separate review. Only the server-side Storage adapter may access bytes; no public/signed URLs are created. A server-only Storage key remains a separate runtime prerequisite.

## Consent, access and retention

Original specialist-review consent does not authorize developer access. A separate unchecked patient confirmation is required for the exact assignment/revision, with personal/contact disclosure, human-assessment purpose and copying limitations. Withdrawal, inactive assignment and expired/revoked reviewer approval block future protected archive access; retained bytes/audit are not automatically erased. Private reviewer notes never enter the developer PDF. Pre-claim rows expose structural counts, not potentially identifying free-text narratives; assigned reviewers receive authorized medicine/reaction/initials summaries.

Only one active developer entitlement is possible. Every request requires the exact authenticated subject, provider-verified email matching the operator-approved email, active unexpired entitlement, and current archive consent. Identity administration does not confer this capability. The migration creates **zero** entitlement rows.

## Evidence

Actual-schema disposable PostgreSQL: non-superuser installation, populated Phase A preservation, transactional rollback, RLS/grants, failed-audit rollback, owner isolation, role expiry/revocation, stale/conflicting commands, immutable assessment, consent withdrawal and browser Storage denial pass. API tests exercise real repositories over PostgreSQL wire, using explicitly mocked Auth and private Storage. Full local suite: 74 tests; PDF suite: 12 tests. Frontend and affected server/test TypeScript and production build pass. Chrome fixture at 1440/375 passes consent, 60:40 workspace/mobile switching, claim/release/reclaim, draft resume, finalization, native PDF archive, developer download and withdrawal denial. These are not hosted privileged results.

## Rollback and activation

Each file is transactional. On any failure stop and verify rollback/ledger; never retry modified bytes under this approval. Apply in the listed order, compare exact SQL/checksums and retain the actual hosted ledger versions. Capture existing account/ADR fingerprints and verify unchanged data/policies. No resets, prior-migration replay, personal grants or destructive rollback are authorized. Before meaningful data exists, isolated rollback rehearsals remove all new objects. After deployed history/archives exist, use feature flags to disable new operations; any schema/data removal needs separate review. Failed cross-service upload/metadata commit may leave a private orphan; safe retries reuse the deterministic object path. Do not auto-delete orphans.

Keep sharing/pool/review/archive flags OFF until each dependency/security gate passes. Phase A finalization stays ON. Real hosted acceptance additionally needs separately approved administrator provisioning, independent specialist approval, separate developer subject/email entitlement, private Storage configuration and actual patient archive consent. No new hosted privilege may be inferred from this SQL approval.

Administrator plan: reuse `database/operations/bootstrap-specialist-admin.sql` after private exact confirmed subject selection and separate approval; do not reuse any old pre-reset UUID. Developer plan: `database/operations/bootstrap-completed-archive-developer.sql` proposes one-time 30-day access for an exact confirmed subject/email, no professional application and atomic audit. This is a template, not an executed or approved grant. Both require their own checksum/target/account approval. No automatic renewal.
