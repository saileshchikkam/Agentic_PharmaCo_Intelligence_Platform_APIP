# Phase 3A — patient case management implementation and evidence

2026-11-07. Implemented the independently authorized owner dashboard, history and exact-revision export subset. Lifecycle writes remain policy-gated. This is private fictional-data engineering evidence, not clinical approval or a public release.

## Source and scope

Started clean on `codex/adr-phase3-master-blueprint` at `7c2db5ec8e09c4461f10205ed3166a34affc3f76`, a descendant of backend `5c20ede3b9a2548646674e15a3d22914f4865a4e`. Work is isolated on `codex/adr-phase3a-patient-case-management`. Backend draft PR 6 remains open, draft and unmerged; it was not edited. The final delivery identifies the verified implementation commit and its separate draft PR.

Implemented:

- My ADR Reports from the existing patient dashboard; real owner-scoped data, search, medicine/type/intake/date filters, deterministic sorting and bounded cursor pagination.
- Detail, current guided edit/resume, paginated revision history and immutable historical content. Original statements, confirmation provenance and unconfirmed suggestions remain distinct.
- Explicit historical PDF generation/download using the unchanged native original-form generator. Current live preview retains latest-revision conflict semantics.
- Account-keyed screens, aborted stale requests and revoked PDF object URLs; direct case/revision/editor destinations survive sign-in through a constrained internal return path.
- Native browser Back/Forward consults the existing unsaved-answer guard; declining departure preserves the answer. Enter saves single-line answers; Enter inserts a textarea newline and Ctrl+Enter submits it.
- Material Web controls, shared glass header, themes, normal scrolling, keyboard interaction, responsive cards and mobile PDF toggle. The case screens avoid inheriting the wide Back gutter.

No readiness, archive, restore, deletion, consent, specialist, review, analytics or AI functionality was enabled. All cases remain Draft. An `intakeComplete` indicator describes the existing minimum intake checklist and does not imply Ready for Review. Review status is null, rather than a fabricated review outcome.

## Data and query design

No new case, summary, management or lifecycle tables are needed for this subset. Both adapters derive summaries directly from each case's current saved snapshot; existing cases need no backfill and no summary projection can drift. Search uses confirmed case-reference/medicine summaries, never reaction narratives, profile history or unconfirmed proposals. SQL filters execute before ordering/limit, in one collection query rather than one load per card.

PostgreSQL uses the existing owner/created/id index and composite revision key. The existing caps remain 100 cases per owner, 500 revisions per case and 20 medicines. JSON/date/medicine filtering and updated-time sorting examine the bounded owner's current snapshots. No large-scale throughput claim is made; a separately tested projection/index migration is appropriate if those caps are ever raised. SQLite uses its existing owner index and JSON functions. Neither adapter mixes records or falls back to the other backend.

Unknown or unanswered values remain distinct in snapshots and read-only views. Unknown medicine/type/report-date values are not guessed or indexed as supplied facts. The optional status filter `intake_complete` uses the same required-field predicate as `missing`: case type, initials, reaction, reporter name, a suspected medicine and every included medicine name must be provided. Optional omissions do not become completion requirements.

## Live API contract

All routes below require the existing verified session and matching `X-APIP-Account`. Cloud authorization uses the existing remote Supabase user verification; local development uses its existing cookie/Host/Origin boundary. Owner IDs in bodies or filters do not confer access.

- `GET /api/account/adr-cases`: `{cases,nextCursor}`. Parameters: `limit` 1–50 (default 12), `cursor`, `q`/`medicine` up to 100 characters, `status=all|draft|intake_complete`, `caseType=all|Initial|Follow-up`, `dateField=created|updated|reported`, ISO `from`/`to`, `sort=created|updated`, `direction=asc|desc`, and `archived=exclude` only. Unknown keys, array values, invalid dates and inverted ranges are rejected.
- Cards contain id, revision, created/updated times, confirmed medicines/type, checklist completeness, Draft status and null review status; no full narrative or profile data.
- `GET /api/account/adr-cases/:id`: current case, summary and disabled lifecycle capabilities with P01/P08/P09/P17 blockers. Creation in detail uses the first immutable snapshot's save time; the PostgreSQL collection uses the database case creation time. These timestamps can differ slightly at creation; neither is a reported reaction date.
- `GET /api/account/adr-cases/:id/revisions?limit=25&before=501`: `{versions:[{revision,savedAt}],nextBefore}`. Limit 1–50; revision boundary 1–501. PostgreSQL descriptors use database `saved_at`; SQLite descriptors use the snapshot's saved `updatedAt`.
- `GET /api/account/adr-cases/:id/revisions/:revision`: exact `{case,savedAt,readOnly:true}`. Selected-view `savedAt` is the snapshot's persisted `updatedAt`; it does not mutate history.
- `POST /api/account/adr-cases/:id/revisions/:revision/pdf`, body `{}`: PDF for the explicitly selected immutable revision. Returns `X-APIP-Revision`, attachment filename and private/no-store. Identity and owned revision are checked before generation; session/ownership are checked again, the required cloud export receipt is recorded, and identity is revalidated before bytes are sent. A failed required receipt returns no PDF.
- `POST .../:id/lifecycle` and `POST .../:id/deletion-requests`: owned resource check then 403 `POLICY_NOT_APPROVED`. Foreign resources return 404. There is no new DELETE or restore-history command.

The existing `/api/account/adr-guided` create/command/PDF contracts, idempotency and revision conflict behavior remain available. Historical export deliberately does not require the selected revision to equal the latest; the existing current PDF route still does.

Cursors contain a sort position and id with an HMAC bound to actor, canonical filters, limit and sort. They contain no bearer token or owner identity. Tampering, owner reuse and filter mismatch return 400. The signing key is process-local: restart invalidates cursors, and the UI can return to page one without changing filters. Lists are current-data keyset pages, not a frozen multi-page database snapshot; concurrent edits can move a case in updated-time ordering.

## Approved migration and hosted security

Only the historical PDF receipt migration was authorized and applied to development project `kstxwoitiistmvivwixd`. No other migration was applied.

The CLI initially generated `20261107151726_adr_historical_pdf_receipts.sql`. Supabase's migration tool recorded the exact approved SQL under version `20261107152504`; the repository filename was renamed to [20261107152504_adr_historical_pdf_receipts.sql](../../../supabase/migrations/20261107152504_adr_historical_pdf_receipts.sql). Applied history was not rewritten. SQL SHA-256 is `32d3690ba26ecc5599c9fb64c049772813c68189636ca2fd758ea343ae618fb7`.

The only addition is `apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer)`. It has the existing migration owner's ownership, fixed empty search_path, fully qualified objects and no dynamic SQL. As a SECURITY DEFINER function it deliberately uses an explicit `auth.uid()`/owner/case/revision check before inserting the existing composite-FK-linked export record. It accepts no actor/owner override. Trusted server identity propagation remains necessary; possession of writer credentials is a trusted-backend boundary.

Pre/post hosted metadata confirms:

- `anon` execution false; `authenticated` execution false; PUBLIC execution grants zero; `apip_adr_writer` execution true.
- Cases, revisions and PDF-export table grants, all three ADR RLS policies and restricted writer non-superuser/non-BYPASSRLS/non-createrole attributes are unchanged.
- Existing latest-only PDF function definition MD5 remains `53cc10c2428a1da5442d7bd18ad06277`.
- Ledger has the original four versions plus the one historical receipt version.
- Security advisor reported no database findings, but one Auth warning: leaked-password protection disabled. Auth settings were not changed by this task. Google remains a separate pending gate.

Fresh baseline plus additive migration, populated-schema compatibility, transactional failed duplicate-create rollback, writer execution, PUBLIC/browser denial, direct mutation denial and foreign/empty-actor failures were exercised in disposable PostgreSQL. Existing immutable history/rollback/backup-restore and identity-cleanup regressions also pass. The migration is ledger-managed, not repeatedly run SQL. Recovery disables the new API/UI while preserving receipts; do not drop populated records or falsify the ledger.

## Executed evidence

PASS — 15 focused Node tests across `adr-cases`, `adr-guided`, `adr-cloud-wire`, `adr-postgres`, `adr-connection-loss`, `cloud-auth` and `adr-pdf-runtime`. Three new case tests also passed after strengthening upgrade/grant assertions. PostgreSQL wire tests use disposable PGlite and mocked Auth, not hosted identity.

PASS — 14 applicable account/profile/navigation/legacy-security regressions. PASS — four native Python PDF groups including all medicine rows, 19 checkbox categories, widget/appearance agreement, unchanged instructions, reserved fields, overflow and regeneration. No sealed research suite or model inference was run.

PASS — existing complete guided browser workflow at all four widths, including Unknowns, medicine collection, editing/reload and downloaded PDF/regeneration. Its first desktop run was interrupted by Vite reloading documentation during the check; the already-passed three widths were retained and desktop was rerun successfully using the new optional `ADR_BROWSER_WIDTHS` selector in `scripts/adr-guided.browser.mjs`. PASS — existing mocked cloud Auth browser checks for Google PKCE/cancellation, email, reload, refresh failure and cross-tab changes. That Google result is simulated, not hosted verification.

PASS — frontend TypeScript, `tsconfig.node.json` and an additional strict check over the actual server entry/server/new test. The node config by itself includes Vite configuration, so it is not reported as comprehensive server checking. Production build passes with the pre-existing large-chunk warning.

PASS — actual Chrome at 320/360/820/1440 in isolated SQLite: Home → signup → patient dashboard → My ADR Reports → search → detail → guided edit → history → selected historical PDF/download → list. Verified Enter/Ctrl+Enter/newline, declined native Back with unsaved input, read-only history, reload, filter restoration, light/dark, reduced motion, no horizontal scrolling, logout and a different account's denial of the protected historical deep link. Actual source screenshots and PDFs were generated, not mockups. Full-page capture can reset the responsive preview while taking a screenshot; the final desktop PDF-ready capture uses the normal viewport.

PASS — real hosted Supabase sign-in with two existing confirmed synthetic accounts, restricted writer TLS preflight and readiness. Real owner-scoped create/filter/history/persistence, duplicate retry and revision conflict; stale latest-PDF denial; two-way foreign detail/history/revision/current-PDF/historical-PDF/edit/search denial; anonymous 401. These are separate from the mocked tests.

PASS — real hosted native historical revision 16 and edited current revision 18 for both synthetic cases. Historical download independently reopened as three pages because the long fictional medicine name genuinely overflowed; after shortening the medicine name, current export reopened as exactly two pages. The historical PDF regenerated after editing retained identical field values and page count. Both have 147 fields, correct old/new reaction values, original instructions and untouched professional-only fields. Independent PDFium rendering requires `init_forms()` to draw native form annotations; the final inspection used it. Initial uninitialized rendering and unconditional two-page test assertions were inspection/test mistakes, not mapping changes.

PASS — hosted PDF.js visibility and no horizontal scrolling at four widths; real session restoration and the saved revision after reload. The first readiness probe returned database=true/pdf=true/auth=false; later probes on 3100 and 3101 returned all true without changing TLS or Auth settings. No new natural-expiry, controlled restart or managed-outage claims are made; prior [backend lifecycle evidence](../../../database/hosted-verification-2026-11-07.md) remains applicable and was not unnecessarily repeated.

BLOCKED BY POLICY — ready confirmation, archive/restore, deletion requests and retention/hold handling require P01/P08/P09/P17 decisions. No new SQLite management schema or management writes were enabled. Read/list/history/export adapters work independently of those decisions.

PENDING — Google OAuth remains disabled/separate; no new test or change. No public/shared preview is provisioned, no real patient data is authorized, and no specialist capability has been enabled.

## Screenshots and preview

Selected actual local-fixture screenshots are in [evidence](evidence/README.md). The delivery also links local hosted PDF captures and independently rendered pages; the original template and generated PDFs are not committed. The evidence-generation scripts can regenerate fictional captures. Native/in-app computer-use helpers failed to initialize with a missing kernel-assets path; installed Chrome/Playwright checks succeeded.

- New hosted implementation: `http://127.0.0.1:3101/#/patient/adr/cases` (sign-in at `#/sign-in/patient`). Real PostgreSQL and Supabase Auth, isolated from 3100.
- New independent SQLite implementation: `http://127.0.0.1:3200/#/patient/adr/cases`, with its own fictional development database.
- Preserved SQLite preview: `http://[::1]:3000/#/`. Its existing server process/database were not restarted or reconfigured; old guided endpoints remain available. It is not the new Phase 3A backend instance.
- Preserved hosted baseline: `http://127.0.0.1:3100/#/sign-in/patient`. Not replaced or restarted.

These links are accessible on the user's Windows laptop while the processes run. They are loopback-only, not links to another computer. No shared forwarding/public hosting was configured. Private writer credentials remain only in the masked launcher's process environment; a restart may require private re-entry.

## Files and educational walkthrough

1. `src/features/adr/cases/contracts.ts` defines cards, filters and the supplied-value summary. A status is a factual Draft plus a checklist indicator, not a professional judgment.
2. `server/adr/caseQuery.ts` parses an explicit parameter allowlist and signs/verifies owner/filter-bound cursor positions. SQL column expressions come from fixed code, not user SQL.
3. `server/adr/repository.ts` adds SQLite search, exact snapshot and timestamped revision methods to the existing interface, retaining its save/revision behavior.
4. `server/adr/postgresRepository.ts` implements the same read methods through existing bounded, transaction-local owner identity and RLS. The new receipt method hashes bytes and calls only the separately granted function.
5. `server/adr/cases.ts` is the owner facade. It validates requests, orchestrates exact snapshots/PDFs, rechecks session/ownership and keeps unapproved lifecycle writes denied. `server/adr/guided.ts` shares existing error classification; its current-PDF conflict checks are retained.
6. `server/cloud-account.ts` registers both namespaces behind the same existing authenticated principal/concurrency/error boundary. It skips unrelated account paths. `server/local-account.ts` registers the facade behind its existing cookie/Origin controls and rejects a foreign bearer credential.
7. `src/features/adr/cases/CaseWorkspace.tsx` separates list from keyed detail/history views. `useResource` aborts obsolete requests; filters live in the browser history state, bound to the matching owner. Read-only answers reuse `DraftPreview`; the current editor is not duplicated. `cases.css` scopes responsive layouts to these screens.
8. `AccessPreview.tsx`, `PreviewLayout.tsx`, `AccountSignIn.tsx`, `AccountProvider.tsx` and `App.tsx` add connected routes, a constrained internal login return, account remount/cleanup and native history guarding. The header's dimensions and navigation positions are unchanged.
9. `GuidedWorkspace.tsx` accepts an initial case id and a read-only presentation flag. Current edits still go through its existing commands, confirmations, revision checks and retry handling. `LiveFormPreview.tsx` chooses between latest and explicit historical endpoints, validates the revision header, clears blob URLs and reuses the existing PDF.js renderer/full viewer/download.
10. The one SQL migration adds only the historical receipt function. `scripts/adr-cases.test.ts` tests adapters, APIs and grants; `scripts/adr-cases.browser.mjs` tests the actual local app and can serve an isolated preview. `.gitignore` excludes CLI temporary state.

Documentation changed with this delivery: `CHANGELOG.md`; `docs/README.md`, `docs/architecture.md`, `docs/architecture/ADR_PHASE3_MASTER_BLUEPRINT.md`, `docs/decisions.md`, `docs/history/2026-11-07.md`, `docs/layers/adr-reporting.md`, `docs/roadmap.md`; `docs/adr/README.md`, `docs/adr/09-adr-1a-checkpoint.md`; this report and `docs/adr/phase3/README.md`, `acceptance-matrix.md`, `implementation-prompts.md`, plus `evidence/README.md` and its eight actual screenshots. No earlier checkpoint events were removed.

Data flow: a patient chooses a case → account headers carry a verified session and consistency hint → server derives identity → repository sets transaction-local subject → RLS and owner predicates load exact data → deterministic PDF service reads confirmed values → final identity/ownership checks precede private bytes. Opening an older revision never invokes a save command.

Run checks with the tracked Bun lockfile and Node 24. Set `APIP_PDF_PYTHON` to an isolated interpreter containing `server/adr/requirements-pdf.txt`; install PDFium only for independent render tests. Supply the authorized original template privately at its documented location.

```powershell
bun run lint
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.node.json --tsBuildInfoFile "$env:TEMP/apip-phase3a.tsbuildinfo"
node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --esModuleInterop --target ES2022 --module ESNext --moduleResolution bundler server-entry.ts server.ts scripts/adr-cases.test.ts
node --import tsx --test scripts/adr-cases.test.ts scripts/adr-guided.test.ts scripts/adr-cloud-wire.test.ts scripts/adr-postgres.test.ts scripts/adr-connection-loss.test.ts scripts/cloud-auth.test.ts scripts/adr-pdf-runtime.test.ts
& $env:APIP_PDF_PYTHON scripts/adr-pdf.test.py
node --import tsx scripts/adr-cases.browser.mjs
bun run build
```

`ADR_PLAYWRIGHT_MODULE` can identify an installed Playwright module and `APIP_CASE_EVIDENCE_DIR` an external evidence directory. `APIP_CASE_WIDTHS` optionally selects a bounded subset for capture debugging. To leave a separate SQLite preview running, use `node --import tsx scripts/adr-cases.browser.mjs --serve`; it binds loopback 3200, preserves its own external database, disables inference and does not use hosted credentials. Use the existing secure server-only cloud launcher for PostgreSQL, never a database URL in VITE variables.

## Decision and next action

GO for the implemented private owner-management/history/PDF subset. The full policy-dependent lifecycle remains incomplete by design. NO-GO for enabling specialist privileges until separately approved P02/P03/P11/P12/P13 and an authorized Phase 3B task. [Copy-ready Phase 3B prompt](implementation-prompts.md#phase-3b) is a handoff, not permission to start it.
