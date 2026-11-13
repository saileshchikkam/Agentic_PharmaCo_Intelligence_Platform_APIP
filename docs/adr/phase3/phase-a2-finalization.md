# Phase A2 — immutable owner finalization

Status: implemented, locally verified and applied to the approved development project. Development finalization is enabled after post-deployment checks. Real authenticated Patient and Specialist own-report finalization passes. Forwarding remains BLOCKED; no personal professional or administrator privileges were granted.

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
- Initial pre-approval hosted readiness succeeded, with finalization disabled. The approved deployment and actual authenticated results below supersede that initial activation blocker; forwarding remains separately blocked.
- Fixture socket transactions serialize, so request races demonstrate conflict/idempotency correctness, not measured managed PostgreSQL concurrency capacity. English initials/date parity is checked; complex-script acceptance and rendered clinical wording remain separate validation limits.
- Future pooled-schema activation, follow-up/addendum policy and professional review UI remain outside this phase. Hosted consent/forwarding remains unverified. No new Phase B implementation was performed.

Additional real-schema fixture verification: the actual direct-sharing operation now passes explicit-consent denial, unfinalized-report denial, pending-recipient denial, finalized consented creation, identical-key replay and approved specialist report access. Approved professional state was seeded only inside disposable PostgreSQL. No hosted account was approved or restored. Finalized-list browser Download PDF actions passed for both fixture roles after including the existing historical receipt migration in that fixture.

## Approved development deployment — 2026-11-13

The owner approved only the SQL/checksum above. Immediately before application, the project/dependency checks found two accounts, six cases, seventeen revisions, forty-one PDF receipts, zero sharing requests and no partial finalization objects. The migration was applied once through the supported migration operation. Its actual hosted ledger version is **20261113144504**, name `adr_patient_finalization`; the recorded statement is byte-for-byte equal to the approved file. Preserve this ledger version instead of replaying the source filename timestamp.

Post-application counts and complete-row fingerprints of the existing accounts, cases, revisions and PDF receipts matched the preflight. Every pre-existing policy was unchanged; four narrowly scoped policies were added. FORCE RLS, all four enabled guards, non-login/non-BYPASSRLS executor ownership, fixed empty function search paths and restricted grants were checked against the actual catalog. PUBLIC/anon/authenticated cannot execute the new functions; browser roles cannot access the new table. The writer cannot mutate finalization rows or become the executor; the executor owns no patient table and cannot create schema objects. Temporary operator membership has SET and INHERIT disabled.

The actual restricted runtime writer connected with strict client-to-pooler TLS verification and denied a finalization call without a verified subject. `pg_stat_ssl` reports the separate pooler-to-database hop, so it was not used as proof of client TLS. The existing backend was restarted with `APIP_ADR_FINALIZATION_ENABLED=1`; the unified `/api/ready` returned 200 with database/PDF/Auth ready. No other migration was applied, no data reset occurred and no account privileges changed. There are zero administrator grants and zero approved specialists; forwarding has no currently approved destination. The pool remains absent and disabled.

Security advisors reported no finalization-specific notice. Existing notices remain: deny-by-default RLS without a policy on identity provisioning events (INFO), and leaked-password protection disabled (WARN). Neither was changed by this approval.

`scripts/adr-finalization-hosted.browser.mjs` is an explicit bounded acceptance runner for existing accounts. It creates only new fictional reports, uses browser-held sessions without logging credentials, and distinguishes hosted results from the fixture evidence above.

### Real hosted acceptance

Both existing synthetic accounts passed with independently verified PATIENT/SPECIALIST server roles and distinct authenticated subjects. One new fictional report was created for each account; pre-existing reports were not edited or finalized.

- Incomplete finalization: **422 INCOMPLETE_REPORT**. Ready saved report: **200**, finalized through the actual Material Web confirmation dialog.
- Stale revision: **409 REVISION_CONFLICT**. Same-command replay: **200**, identical immutable receipt. New repeat command: **409 ALREADY_FINALIZED**. Subsequent draft command: **409 REPORT_FINALIZED**.
- Foreign case/read/finalization/historical PDF: **404**. Unknown optional weight and reaction stop date remained unknown. No professional approval was required or granted for specialist-owned reporting.
- Reload retained the finalized read-only view, no Save controls, and the exact revision. Finalized search returned the report; resumable-draft pagination excluded it. The real list rendered View finalized report actions.
- Chrome at **1440px and 375px**, both roles: finalized UI, visible original-form canvas and no horizontal overflow passed. Mobile screenshots show rendered original forms. The desktop full-page capture shows a preparing-preview state despite the earlier canvas assertion, so that capture alone is **not** rendered-preview evidence.
- The actual preview blob and downloaded PDF bytes matched for each role. Both downloaded PDFs contain two original-form pages and the expected fictional initials/age; independent native rendering with form appearances enabled was visually inspected on a representative output. Template and PDF-generation code were unchanged.
- Actual restricted-writer rollback-only tests rejected the legacy append RPC with **REPORT_FINALIZED** and denied direct finalization/audit mutation. The managed operator could not SET ROLE to the writer; no membership was granted to work around this. Verification instead used the existing runtime writer connection and rolled back every diagnostic transaction.

After testing, both accounts and all original six cases, seventeen revisions and forty-one PDF receipts still matched their preflight fingerprints. Exactly two new finalizations exist; zero shares were created. Existing-account/browser windows were closed after the bounded checks; no credentials or tokens were written to evidence files.

**Forwarding: BLOCKED.** The current development sharing endpoint returns **503 SHARING_NOT_ENABLED**, and the database has zero approved specialist destinations and no administrator grant. The existing flag was preserved. No pool/professional-review migration or personal privilege activation is included. A separately authorized destination/configuration is required before any real consented-forwarding PASS can be claimed.

Earlier 70 unit/PostgreSQL and 11 PDF tests, TypeScript/build and fixture evidence remain applicable because no application or PDF code changed during deployment. This follow-up adds the explicit hosted runner and deployment evidence only. The prior pushed implementation's push CI passed; PR verification is independently blocked by existing merge conflicts and must not be described as green PR CI.
