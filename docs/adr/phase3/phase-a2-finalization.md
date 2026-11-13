# Phase A2 — immutable owner finalization

Status: implemented and locally verified; hosted application/activation pending exact SQL approval. No professional privileges or hosted migrations were changed.

## Transaction boundary

The existing shared completeness validator remains authoritative in the API and PostgreSQL repository. Finalization acquires the **same owner:case transaction advisory lock** as append_revision, reads the latest stored snapshot under that lock, checks expectedRevision and validator readiness, then invokes finalize_case in the same transaction. The SQL also validates required values, dates, numeric bounds, options, initials, contact and chronology from a reviewed copy of the intake field definitions. Unknown optional fields remain permitted; ongoing reactions do not require stop dates.

One owner-scoped finalizations row is simultaneously the immutable lifecycle record, finalization audit event and idempotency receipt. It references the existing immutable revision, records actor/time/command and a database-computed SHA-256 of canonical snapshot JSON. Replays with the same owner/key/case/revision return that original row. Stale revisions, reused keys and separately repeated finalization conflict safely. An insert/audit failure leaves no finalized state. Case updates and revision insert triggers prevent legacy draft RPCs from modifying finalized content. Existing historical read and PDF contracts remain available.

## SQL review and deployment

Only proposed new migration: `supabase/migrations/20261113192624_adr_patient_finalization.sql`.

SHA-256: `79db2c496a18bf34713240e20f6e48e94c5e49a9da5241cb25817423ef6ed8c4`.

Target: development project `kstxwoitiistmvivwixd` only. Do not apply without separate exact-checksum owner approval.

Dependency order: existing ADR revisions/receipts, restricted writer, existing identity and direct consented-sharing migrations, then this migration. Hosted direct-sharing ledger version is `20261108134740`; do not replay the repository's earlier timestamp as another migration. Hosted account binding is recorded as `20261112155836`; preserve it. The pool migration remains pending and is **not** part of this approval. The new SQL works without a pool; if a pool already exists it installs the same exact-finalization insertion guard there. A later pool installation MUST install/review that guard before pool activation. Do not turn on the future pool flag without that separate approved integration.

New objects: one forced-RLS finalizations table; one non-login, NOINHERIT, non-superuser, non-BYPASSRLS executor; four fixed-empty-search-path functions (finalize_case and three trigger guards); immutable-history and content/sharing guards; owner SELECT policies. The executor owns functions, not patient tables. It can read owner-scoped cases/revisions and finalization metadata, and insert finalization records. Its metadata-only SELECT policy permits the sharing trigger to verify an assigned patient's finalized revision; it provides no patient snapshot access for a specialist.

PUBLIC, anon and authenticated have no privileged EXECUTE; runtime writer receives only finalize_case EXECUTE and owner-only SELECT on finalizations, with no direct INSERT/UPDATE/DELETE. It cannot SET ROLE to the executor. Grants/revokes occur while the migration operator still owns the functions, before ownership handoff. Temporary operator SET membership is disabled afterward. Existing patient ownership policies and sharing function bodies are unchanged.

Preflight refuses missing direct-sharing schema or any existing direct/pool sharing records: such a state requires a separately reviewed legacy-consent transition, not an automatic backfill or silent privilege change. Read-only hosted checks on 2026-11-13 found finalizations absent, pool absent and zero existing/active direct review requests. Recheck immediately before execution.

Rollback before commit is transactional, including role/function/trigger creation; a rollback-only rehearsal passed. After committed finalizations exist, **do not drop guards, delete receipts or unfinalize data as rollback**. Disable new API finalization with the server flag while retaining history/guards; any schema/data reversal requires a separate reviewed operation. No destructive rollback is authorized by this task.

## Activation and UI

Server-only `APIP_ADR_FINALIZATION_ENABLED=1` is required in addition to the deployed schema. Default is disabled. Apply approved SQL, verify ledger/ownership/RLS/grants and restricted-writer operations, then restart through the existing secure launcher with this flag. Do not enable based on frontend state or schema presence alone.

Readiness returns stored revision, required corrections, setup availability and any immutable finalization. The Material Web confirmation dialog warns that this exact revision becomes read-only and is not shared. Dirty/unsaved answers prevent confirmation; no browser-only final status is trusted. On success the questionnaire becomes a read-only confirmed-answer view and retains original-form preview/download. Finalized cases disappear from resumable drafts; My ADR Reports shows finalized status, an explicit finalized filter, no Continue reporting, and owner-scoped report/history access. Correction/addendum creation is not implemented, so no overwrite path is offered.

Send for specialist review opens the existing exact-revision disclosure/recipient/unchecked-consent workflow on the report page, only for the finalized revision. The SQL refuses new sharing rows for unfinished/different revisions. UI says Forwarded for specialist review only for server-returned active/pending_claim/claimed records. Missing pool/provider/eligible recipients leave the report finalized but unshared with existing errors; no automatic submission occurs. Authorship by a SPECIALIST portal user follows the same owner rules; no professional authorization or self-review approval is granted.

## Evidence and limits

- Non-superuser fixture migration, populated upgrade preservation and rollback rehearsal pass.
- PostgreSQL wire/API tests pass incomplete, complete, stale, duplicate, cross-owner, racing duplicate requests, failed audit rollback, post-finalization writes, saved reads, native PDF export and draft/finalized list checks.
- Direct SQL invalid-age finalization denied; browser-role function and raw writer mutation denial pass. Actual prior identity/direct/pool schema compatibility passes without rewriting sharing operations. Sharing triggers reject an unfinalized exact revision.
- Full local unit/PostgreSQL suite: **70 passed**. PDF API suite: **11 passed**. TypeScript, build and secret scan passed. Native PDF template/data mapping are unchanged.
- Browser: built UI plus disposable PostgreSQL/restricted writer and **explicitly mocked Auth**, PATIENT and SPECIALIST actors, 1440/375px. Confirmation, finalized heading, no Save controls and no overflow pass. Screenshots are private fixture evidence, not hosted approval.
- The hosted backend was restarted with secure TLS and reports database/PDF/Auth ready through the single 3602 origin. Its new readiness route is installed, but no authenticated hosted readiness/finalization/forwarding PASS is claimed. Schema and activation are absent; privileged/hosted browser tests await approval and existing-account private sign-in.
- Fixture socket transactions serialize, so request races demonstrate conflict/idempotency correctness, not measured managed PostgreSQL concurrency capacity. English initials/date parity is checked; complex-script acceptance and rendered clinical wording remain separate validation limits.
- Future pooled-schema activation, follow-up/addendum policy and professional review UI remain outside this phase. Hosted consent/forwarding remains unverified. Phase B has not begun.

Additional real-schema fixture verification: the actual direct-sharing operation now passes explicit-consent denial, unfinalized-report denial, pending-recipient denial, finalized consented creation, identical-key replay and approved specialist report access. Approved professional state was seeded only inside disposable PostgreSQL. No hosted account was approved or restored. Finalized-list browser Download PDF actions passed for both fixture roles after including the existing historical receipt migration in that fixture.
