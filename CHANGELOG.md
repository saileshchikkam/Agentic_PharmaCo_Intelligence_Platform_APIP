# Changelog

## P0 Unified Auth, Fail-Closed Postgres Persistence & Multi-Actor Isolation - 2026-11-11

### Changed

- Enforced Supabase PostgreSQL fail-closed persistence in hosted/cloud runtime (`server/cloud-account.ts`, `server/sharing/pool.ts`, `server/sharing/router.ts`, `server/sharing/repository.ts`): removed automatic SQLite pool fallback (`503 POOL_MIGRATION_REQUIRED` / `503 POOL_SQLITE_FORBIDDEN_IN_CLOUD`), verified `apip_sharing.pool_operation` execute privilege on `/api/ready` when `APIP_POOL_POSTGRES=1`, and mapped PostgreSQL `ACTIVE_ASSIGNMENT_CONFLICT` errors to HTTP `409`.
- Hardened single-origin API behavior (`server.ts`): production startup now fails if `APIP_ACCOUNT_MODE !== 'disabled'` without Supabase configuration, and unmatched `/api` / `/api/*` routes return JSON `404` instead of SPA HTML.
- Fixed same-tab session drop after sign-in (`src/features/account/client.ts`): separated APIP's cross-tab notification channel (`apip.cloud.auth.sync`) from Supabase `GoTrueClient`'s internal `apip.cloud.auth` channel, added `storage` cross-tab listeners, and cleared legacy `localStorage` ADR draft keys on Supabase init and `signOut` (`AccountProvider.tsx`).
- Tightened cloud auth dialog & workspace behavior (`APIPAuthDialog.tsx`, `AdrWorkspace.tsx`, `GuidedWorkspace.tsx`, `SharingWorkspace.tsx`): locked Google sign-in outside `supabase`, cleaned up password-reset timers, restored previous return paths on signup errors, expanded auth error banner detection, hid `localStorage` ADR fallback buttons in cloud builds, and handled `503 POOL_MIGRATION_REQUIRED` cleanly in Specialist Review Workspace.
- Hardened pooled queue SQL migration (`supabase/migrations/20261111000000_adr_pooled_sharing_queue.sql`) with null-UUID guards and `apip_sharing.prevent_pool_direct_overlap()` overlap trigger.

### Added

- Multi-actor PGlite + HTTP isolation security suite ([scripts/p0-isolation-security.test.ts](scripts/p0-isolation-security.test.ts)) integrated into `npm test`.
- Authoritative P0 storage/migration audit ([docs/architecture/p0-storage-and-migration-audit.md](docs/architecture/p0-storage-and-migration-audit.md)) and MedAssist integration boundary contract ([docs/collaboration/medassist-integration-contract.md](docs/collaboration/medassist-integration-contract.md)), indexed in [docs/README.md](docs/README.md).

## Platform Stabilization, Unified Portal, Secret Hygiene & ADR Phase 3C-C1 Security Remediation - 2026-11-11

- **Authentication UX, Session Isolation & Navigation (`G01`–`G07`)**:
  - Added `src/features/account/authError.ts` mapping Supabase Auth error codes and local errors cleanly instead of showing generic `"Request failed"` alerts; updated Google OAuth button state using live `/auth/v1/settings`; aligned signup/reset password minimum to 12 characters in `APIPAuthDialog.tsx` and `AccountSignIn.tsx`.
  - Stabilized `M3TextField` input change listeners (`onChangeRef`), guarded post-auth redirect / modal close races and role-scoped `apip.account.return`, fixed `CaseWorkspace.tsx` `date()` handling on missing/invalid timestamps, keyed `SpecialistWorkspace` by authenticated user ID, added `Open review workspace` on `/specialist/profile`, normalized non-hash deep links synchronously inside `readPreviewRoute()`, and added `For specialists` plus safe `#/` sign-out transition in `PreviewLayout.tsx`.
  - Rewrote `scripts/closure-preview.mjs` as the unified single-origin gateway (`http://127.0.0.1:3602` / `http://localhost:3602`) serving built `dist/` assets with SPA fallback and `/api/*` proxying to `127.0.0.1:3601`.
- **ADR Phase 3C-C1 Security & Architecture Remediation (`G08`–`G12`)**:
  - Authored `supabase/migrations/20261111000000_adr_pooled_sharing_queue.sql` and `postgresSharingPoolRepository(sql)` in `server/sharing/pool.ts` (activated when `APIP_POOL_POSTGRES=1`) to eliminate SQLite queue persistence and server-side patient impersonation on claim; hardened SQLite fallback (`pool_receipts`, per-key serialization, release by `poolRequestId` or `assignmentId`, fresh assignment IDs on reclaim).
  - Hardened `extractSafeMetadata()` PII redaction (`server/sharing/policy.ts`), `/requests` deduplication and `Withdraw future access` rendering for `claimed` pool items (`server/sharing/router.ts`, `SharingWorkspace.tsx`), and connected `/inbox/:id/decline` back to `pool.release`.
- **Secret Hygiene, CI & Risk Governance (`G13`–`G15`)**:
  - Added `findSecretViolations()` in `scripts/git-workflow.mjs` and standalone `scripts/scan-secrets.mjs`; scrubbed a hardcoded local database password in `alembic.ini` line 89; added `scan:secrets`, `test`, and `test:pdf` npm scripts plus `.github/workflows/ci.yml`; documented Claude Audit Risk Register in `docs/history/2026-11-11.md`.
- **Verified**: `npm run scan:secrets` (`0` findings across `883` files), `npm run lint`, `npm run build`, `npm test` (`62/62`), `npm run test:pdf` (`9/9`), hosted `verify-hosted-phase3cb-workflow.ts` (`10/10`) & `verify-phase3cc1-shared-queue.ts` (`13/13`), live multi-viewport E2E on `http://127.0.0.1:3602` (`8/8` viewports, `15/15` routes, `0` console/page/5xx errors), and mocked session-isolation E2E. Hosted SQL DDL application (`20261111000000`) and credential rotation remain pending explicit owner action.

## ADR Phase 3C-C1: Shared Specialist Review Queue & Atomic Case Assignment Foundation - 2026-11-10

- Implemented shared specialist ADR review queue and atomic case assignment foundation:
  - Added patient-controlled explicit consent for the Approved Specialist Review Pool (`target: 'pool'`, policy `'phase3c-c1-v1'`) in `PatientSharing`, including disclosure of minimal queue metadata visibility, single-specialist claim rule, and withdrawal restrictions.
  - Implemented `SharingPoolRepository` with SQLite persistence and PostgreSQL-level advisory transaction lock (`pg_advisory_xact_lock`) concurrency serialization in `server/sharing/pool.ts`.
  - Added `GET /api/sharing/queue` endpoint delivering minimal safe display metadata (caseRef, reactionSnippet, suspectMedicineClass, createdAt) to approved, active specialists only; patient names and contact details strictly withheld.
  - Added atomic `POST /api/sharing/queue/:id/claim` endpoint with conflict of interest rejection (`CONFLICT_OF_INTEREST`) prohibiting self-assignment, database assignment creation in `apip_sharing.requests`, and 409 `ACTIVE_ASSIGNMENT_CONFLICT` rejection on simultaneous claim races.
  - Added `POST /api/sharing/queue/:id/release` allowing claimed specialists to return cases to `pending_claim` in the pool.
  - Enhanced `SharingInbox` with Material Design 3 tabbed navigation between "Available Review Queue" and "My Assigned Reviews", 10-second polling synchronization, and manual refresh controls.
- Verified test suite: clean TypeScript (`npm run lint`), production build (`npm run build`), all 6 unit and HTTP sharing suites passed, and all 13/13 gates passed in `scripts/verify-phase3cc1-shared-queue.ts` against live Supabase PostgreSQL (`kstxwoitiistmvivwixd`) and PDF engine.


## Removal of temporary guest demonstration mode & restoration of real Supabase authentication - 2026-11-10

- Completely decommissioned temporary fictional guest authentication system:
  - Purged `GUEST_PATIENT`, `GUEST_SPECIALIST`, `GUEST_PATIENT_PROFILE`, and `GUEST_SPECIALIST_PROFILE` constants and mock state from `AccountProvider.tsx`.
  - Added session cleanup in `AccountProvider.tsx` to clear legacy `apip.guest.role` keys.
  - Removed "Reviewer & Guest Preview" card and guest exploration buttons ("Explore as Patient", "Explore as Specialist") from `APIPAuthDialog.tsx` and removed corresponding CSS.
  - Restored strict fail-closed route enforcement in `AccessPreview.tsx`; accessing protected routes (`#/patient/home`, `#/patient/adr/cases`, `#/preview/medassist`, `#/specialist`) unauthenticated now redirects directly to the appropriate sign-in dialog and preserves the return URL.
  - Removed client-side mock handlers from `CaseWorkspace.tsx`, `GuidedWorkspace.tsx`, and `SharingWorkspace.tsx`; all ADR case creation, revision persistence, and specialist sharing strictly query authentic Supabase-connected endpoints.
  - Restored fail-closed identity administration check in `DeveloperReference.tsx`.
- Verified test suite: clean TypeScript (`npm run lint`), production build (`npm run build` in 20.35s), leak guard check passed, 10/10 hosted Phase 3C-B workflow gates passed against live Supabase database, and 12/12 authentication dialog browser suites passed.

## Complete website demonstration, subpage navigation repair, and guest fixture isolation - 2026-11-10

- Resolved subpage navigation blocker and infinite redirect loop:
  - Added dedicated client-side fictional guest entities (`GUEST_PATIENT`, `GUEST_SPECIALIST`) in `AccountProvider.tsx` enabling full visual and interactive exploration across all subpages (`#/patient/home`, `#/preview/adr-report`, `#/patient/adr/cases`, `#/preview/medassist`, `#/specialist`, `#/specialist/profile`, `#/developer-reference`).
  - Corrected `APIPAuthDialog` post-authentication redirect guard (`open && user && !isGuest && ready && mode !== 'reset'`) and conditionally mounted it in `AccessPreview.tsx` only during active sign-in views (`isSignIn`), eliminating recursive navigation resets.
  - Added in-memory mock handlers in `GuidedWorkspace.tsx` and `CaseWorkspace.tsx` for `fictional-` owners, allowing live 5-stage ADR report creation, revision updates, and draft case listing without remote API calls.
  - Added guest exploration triggers ("Explore as Patient", "Explore as Specialist") to the Material 3 horizontal authentication dialog.
  - Enabled developer design reference inspection in development and guest preview modes.
- Verified test suite: clean TypeScript (`npm run lint`), production build (`npm run build` in 4.82s), leak guard checks pass, and end-to-end multi-viewport route verification (11/11 routes pass).


## Protected route navigation repair, keyboard event forwarding, port consolidation, and full website review - 2026-11-09

- Repaired unauthenticated navigation and eliminated the "Checking your account..." blank white screen defect:
  - Removed top-level unstyled return in `AccessPreview.tsx` that previously replaced the application shell and styling with raw text on unauthenticated protected route access.
  - Protected routes now gracefully maintain the application shell (`PreviewHeader`, `LandingBody`, `LandingFooter`) and open `APIPAuthDialog` with `open={isSignIn || (protectedRoute && !account.user)}`.
  - Updated "For patients" header link to route directly to `#/sign-in/patient` when unauthenticated, avoiding unneeded protected route transitions.
  - Wrapped `SpecialistWorkspace` loading fallback in a styled Material 3 container.
- Repaired keyboard event handling and form responsiveness:
  - Enhanced `discreetDeveloperAccess.ts` to support `event.code === 'KeyD'` across all keyboard layouts, and added shadow DOM inspection via `event.composedPath()` to prevent intercepting keystrokes during text field editing.
  - Added `'change'` event listener and `onKeyDown` prop forwarding to `M3TextField.tsx` for autofill and keyboard submission compatibility.
- Cleared unused ports: killed orphaned dev process on port 3000; consolidated active verification on preview port 3602 and backend on 3601.
- Executed comprehensive multi-viewport visual review and captured 22 responsive screenshots across Desktop, Tablet, and Mobile in Light and Dark modes.
- Verified test suite: clean TypeScript (`npm run lint`), production build (`npm run build`), navigation unit tests (6/6 pass), and leak guard tests (11/11 pass).

## Material Design 3 Web authentication dialog centering, soft blur, animations, and button repair - 2026-11-09

- Repaired visual centering of the horizontal authentication dialog: resolved left-alignment bug by enforcing outer margin: auto !important; position: fixed !important; inset: 0 !important; and background scroll/gutter lock (overflow: hidden; scrollbar-gutter: auto;), achieving exact 0px horizontal and vertical offsets across 1024px, 1440px, 1536px, and 1920px viewports.
- Applied polished soft background blur: injected backdrop-filter: blur(6px) onto the shadow DOM scrim, leaving modal dialog content completely crisp while softly blurring the background landing page and header.
- Implemented natural Material Design 3 opening and closing animations (280ms entry with 0.97->1.0 scale and 10px->0px vertical translation; 200ms graceful exit with 1.0->0.97 scale and 0px->8px vertical translation) with full prefers-reduced-motion support.
- Repaired authentication controls:
  - Fixed Close X button by eliminating disabled="false" attribute on <md-icon-button> that caused pointer-events suppression.
  - Enabled Enter-key submission from password/email text fields by capturing composed keydown events on the form.
  - Ensured primary Sign in button triggers submission directly on click.
  - Added truthful unavailable-state feedback for Continue with Google when unconfigured on the hosted project.
- Verified test suite: clean TypeScript (npm run lint), production build (npm run build), leak guard (11/11 pass), navigation unit tests (6/6 pass), and automated Chrome browser acceptance (12/12 test suites pass).

## Material Design 3 Web horizontal authentication dialog and private developer access - 2026-11-09

- Replaced standalone patient, specialist, and mock developer login pages with a wide, landscape-oriented Material Design 3 Web modal dialog (`APIPAuthDialog`) using official `@material/web` `<md-dialog>`.
- Two-column horizontal desktop composition (840px x 560px): left column provides product context (APIP brand, welcoming headline, 1-sentence workspace description, Material Symbol, research prototype label); right column provides authentication form (role switcher, text fields, password visibility, Google sign-in check, forgot-password, account creation, and validation notices).
- Fully responsive across 320px, 360px, 768px, 1024px, 1440px viewports with zero horizontal overflow in light and dark themes.
- Preserved complete route compatibility: direct URL navigation, refresh, back/forward, and task continuation across `/#/sign-in/patient`, `/#/sign-in/specialist`, `/#/sign-up/patient`, `/#/sign-up/specialist`, `/#/forgot-password/patient`, `/#/forgot-password/specialist`, and `/#/reset-password`.
- Removed all public developer entry points: removed "Developer" from public role selector, removed visible "Developer sign-in" footer links, and removed mock developer login forms.
- Added discreet owner developer entrance: 5-click gesture on footer brand element within 3 seconds, plus `Ctrl+Shift+D` keyboard shortcut.
- Implemented real developer authorization for `DeveloperReference`: permits access in local development; production builds verify identity administration capability (`/api/account/capabilities`) and fail closed with "Access Denied" and redirect to home if unauthorized. Preserved `CoreComponentsView`, `DomainComponentsView`, `DesignFoundationView`, and `MaterialNavTabs`.
- Preserved existing APIP header layout, structure, dimensions, and styling 100% unchanged across all viewports.
- Verified test suite: clean TypeScript (`npm run lint`), production build (`npm run build`), navigation unit tests (6/6 pass), and Chrome browser acceptance (12/12 pass).

## Master repository audit, safe branch consolidation, and shared development workflow - 2026-11-09

- Audited 21 remote branches and 16 PRs; proved that PRs #6 through #14 are linear ancestors strictly preserved inside `codex/apip-landing-v2` (`faf5c8a`, PR #16).
- Merged `origin/main` commit `b66ea03` ("Add diagram badge to README") cleanly into `codex/apip-landing-v2` with zero conflicts. Retargeted PR #16 to `main` as the consolidated integration PR.
- Safely deleted 4 obsolete remote branches (`codex/apip-signal`, `feat/adr-1a-guided-reporting`, `feat/adr-1b-ui-foundation`, `codex/adr-phase3-master-blueprint`) after confirming zero unique unmerged work and resolved PR status.
- Strictly preserved all MedAssist branches (`feat/medassist-jayanth`, `codex/medassist-v2-task5a-adapter`, `codex/medassist-emergency-recognition`) and all active worktrees.
- Authored canonical collaboration handoff in `docs/collaboration/codex-antigravity-handoff.md` establishing permanent operating rules for OpenAI Codex and Google Antigravity.
- Verified test suite: clean TypeScript (`npm run lint`), production build (`npm run build`), leak guard (11/11 pass), hosted database/PDF gates (10/10 pass), and full responsive M3 Web layout verification (12/12 combinations pass with byte-for-byte identical header).

## Material Design 3 public homepage - 2026-11-09

- Reworked the homepage body and footer with a fictional reporting walkthrough, prototype and planned capability labels, patient and specialist journeys, and consent and withdrawal information.
- Reused APIP's Material Web components and appearance system. The shared header and other routes retain their existing layout and behavior.



## Priority 0 credential remediation and hosted browser sharing diagnostics - 2026-11-09

- Remediated database credentials leak by replacing hardcoded connection strings with fail-closed user environment variable APIP_ADR_DATABASE_URL in verify-hosted-phase3cb-workflow.ts.
- Rotated apip_adr_writer password on hosted Supabase PostgreSQL, verifying old password rejection (28P01) and pooler port 6543 connectivity.
- Implemented automated pre-commit secret leak guard in git-workflow.mjs, verified by comprehensive test suite (11/11 pass).
- Verified all ten automated Phase 3C-B workflow gates against hosted Supabase: capability verification, revoked exclusion, directory opt-in, case creation, consented sharing, inbox retrieval, original PvPI PDF preview, negative denials, newer-revision privacy, and consent withdrawal.
- Diagnosed two-account browser runner (auth-sharing-hosted.browser.mjs): isolated contexts timed out awaiting active sessions as invalid credentials returned HTTP 400 invalid_credentials from Supabase Auth; interactive browser acceptance remains gated pending credential verification.

## Phase 3C-B hosted verification and administrator capability decision - 2026-11-09

- Completed audited administrator capability decisions for the owner-approved synthetic applicant (`Fictional APIP Sharing Reviewer`), recording `begin_verification` and `approve` with a bounded 30-day validity window under confirmed identity administrator. The previously revoked specialist remains strictly revoked.
- Verified all ten hosted Phase 3C-B workflow gates against the development Supabase project: patient consent, specialist assignment, directory opt-in, Pending Review Reports, original PvPI PDF preview generation with `pypdf` field assertions, cross-patient and unauthorized denial, newer-revision privacy, and consent withdrawal.
- Preserved target application deep links during authentication redirects in `SpecialistWorkspace.tsx`.

## Authentication layout and session corrections - 2026-11-09

- Improved responsive Material 3 authentication, accessible controls and route/history behavior; repaired local session restoration and simulated OAuth continuation/cancellation. Real Google, recovery and hosted-sharing acceptance remain gated. [Evidence](docs/adr/phase3/auth-and-hosted-closure.md).

## Specialist identity and controlled administration - 2026-11-08

- Added fictional specialist applications, status/profile, private administrator decisions and database-backed per-request capabilities with 30-day expiry, atomic audit and immediate future-request revocation. No patient-sharing privileges. Applied the separately approved development migration; live administrator bootstrap remains blocked. Added strict-TLS preview preflight and responsive Chrome evidence. [Delivery](docs/adr/phase3/3b-implementation-and-verification.md).

## Patient ADR case management - 2026-11-07

- Added owner-filtered case lists, connected guided editing, immutable saved-revision views and exact historical original-form PDF export. Real hosted two-account checks and responsive fictional browser/PDF regressions pass. Lifecycle writes remain policy-gated. [Delivery and walkthrough](docs/adr/phase3/3a-implementation-and-verification.md).

## PostgreSQL disconnect recovery - 2026-11-07

- Updated the pinned PostgreSQL driver to prevent an uncaught rollback crash after connection loss, with a disposable connection-loss regression. See [verification evidence](database/hosted-verification-2026-11-07.md).

## ADR-1B Phase 2 - 2026-11-04

- Added the original PvPI form preview and saved intake progress. Shared Back now sits beneath the logo beside the content. [Verification](docs/adr/09-adr-1a-checkpoint.md#adr-1b-phase-2--original-form-preview-and-intake-progress).

## ADR-1B Phase 1 - 2026-11-04

- Added a shared sticky header and research disclaimer, and improved responsive spacing and appearance controls.
- Added the ADR reporting introduction, a pausable process illustration and saved draft cards. [Scope and verification](docs/adr/11-adr-1b-phase-1.md).

## ADR-1A final corrections - 2026-11-04

- Fitting PvPI exports now contain the original two pages. Referenced continuations carry only excess confirmed information.
- Guided reporting uses clearer question text, keyboard progression and grouped review. Login and signup lead to the dashboard. [Verification and limits](docs/adr/10-adr-1a-final-corrections.md).

## ADR-1A official PDF recovery - 2026-11-03

- Added deterministic native filling of the original PvPI Version 1.4 AcroForm, complete widget inventory, explicit text/checkbox appearances, medication rows and continuation pages.
- Added owner/revision-checked download, editable review/regeneration and an accessible top-to-bottom reveal with Skip and reduced-motion support.
- English fictional PDF, ownership, responsive browser, TypeScript and build checks pass. Unsupported scripts and multiple seriousness selections remain explicit export limits; ADR-1B was not started. [Results and remaining gate](docs/adr/09-adr-1a-checkpoint.md).

## ADR-1A guided intake checkpoint - 2026-11-03

- Added six-stage Material Web fictional intake, explicit field confirmation, repeatable medicines, structured live preview and corrections.
- Added owner-isolated SQLite cases/history and configurable local extraction with deterministic manual fallback.
- Official PvPI template/PDF checkpoint blocked by missing supplied `ADRRF_2.pdf`; no official form or PDF fidelity claim. [Details and tests](docs/adr/09-adr-1a-checkpoint.md).

## Authenticated read-only Model A protocol compatibility — 2026-10-26

- Accept only authenticated CRLF/LF protocol representations, preserving original pins, frozen study code and exact binary/implementation hashes.
- Add tampering tests and migrate read-only adapter/fixture/smoke entry points. Fresh-checkout verification remains a separate readiness gate. [Guarantees](docs/model-a-protocol-portability.md).

## Main reconciliation prepared; merge blocked — 2026-10-26

- Resolved README and ignore-rule conflicts in an isolated integration branch; preserved contributor documentation and both commit histories.
- Preserved canonical contributor file bytes with scoped attributes; no model/provider or frozen-study changes.
- TypeScript/HTTP, types/build and responsive regressions pass, but fresh-checkout Python fails the existing protocol checksum gate. Main remains unmerged pending a separately reviewed integrity-preserving repair. [Evidence and next action](docs/reconciliation-2026-10-26.md).

## MedAssist verified checkpoint consolidation — 2026-10-25

- Synchronized current README, setup, architecture, capability gates and safety status with the implemented fictional conversation, without rewriting historical verification receipts.
- Preserved byte hashes for newly tracked research sources/reports using scoped Git attributes, and excluded Python caches. Frozen Model A protocol portability remains unresolved.
- Consolidated pending adapter, modular research, language/reliability, evidence, UI and evaluation work for a reviewed feature-branch checkpoint. Recovered contributor data/weights remain local and already available in the cited remote-main history. See [scope, checks and exclusions](models/medassist_ai/docs/checkpoint-2026-10-25.md).

## MedAssist symptom understanding and evidence integrity — 2026-10-25

- Added exact schema/language/question-target inventory, deterministic supported-English normalization and source/context provenance without new model features.
- Added typed/anatomical question compatibility, bounded clarification outside the eight-question budget, full-source polarity validation and explicit v2 conversation export with unchanged v1 evidence handoff.
- Preserved actual sealed Model A ranking, disabled clinical Model B and the existing UI. Fictional development/mocked checks and real-model integration are separated; two unchanged emergency-rule misses remain blockers. [Evidence and limitations](models/medassist_ai/docs/symptom-understanding.md).

## MedAssist P0 submission and provider recovery — 2026-10-25

- Prevented duplicate description bubbles, confirmations and question transitions through stable request IDs and bounded local replay.
- Replaced permanent temporary-rate blocking with categorized failures, Retry-After recovery, bounded transient retries and sanitized development diagnostics.
- Preserved strict evidence validation, explicit confirmation, unsupported wording and independent emergency help. Live/recorded integration and confirmed Groq TPM limits are separated in the [verification report](models/medassist_ai/docs/p0-reliability.md). No UI redesign or clinical activation.

## MedAssist symptom recognition and bounded fallback — 2026-10-25

- Added the existing general-pain field to the constrained language catalogue; actual stomach-pain/headache cases now reach confirmation and real Model A pain questions without inventing anatomical codes.
- Added bounded, phase-aware clarification for repeated/equivalent wording and already-recorded facts; separated provider/quota, timeout, invalid-output, mapping and question-service failures.
- Display trusted source labels for encoded answer choices while preserving original values and UNKNOWN. Preserved the eight-question stop, independent safety, disabled Model B and all sealed research protections. [Actual evidence and limitations](models/medassist_ai/docs/recognition-fix.md).

## MedAssist natural conversation and topical questions — 2026-10-25

- Reused the existing Material 3 chat with document scrolling, an accessible sticky composer, neutral progress and a concise natural summary.
- Added a separate experimental Groq sparse-language profile, explicit rich-reply confirmation and traceable session export; actual coverage is 28 anchors, not universal symptom understanding.
- Added an eight-routine-question topical wrapper around unchanged sealed Model A, preserving original research endpoints, frozen protocol and evidence contract. Verified real-model sequences, UNKNOWN, emergency precedence, responsive layout and consent/failure navigation. Clinical use remains blocked. See [current evidence and limitations](models/medassist_ai/docs/natural-conversation.md).

## MedAssist conversational experience — 2026-10-25

- Replaced research-form controls with a Material 3 chat, one animated/reduced-motion greeting, inline confirmation and explicit fictional-context questions, typed answers, retry, summary and unchanged evidence export.
- Added neutral desktop/mobile assessment status without enabling Model B; made Maps contextual while preserving immediate independent emergency help. Fixed shared-preview CSS height collision and offscreen-focus page growth.
- Verified five responsive widths, 20-question history, safety/failure behavior, four actual Model A conversations and one fictional live qualified Groq integration. Preserved all 17 sealed artifacts and frozen implementation/protocol. See [exact evidence and limitations](models/medassist_ai/docs/chat-verification.json).

## Provisional MedAssist safety and navigation — 2026-10-25

- Added independent emergency-statement precedence across both fictional previews and backend extraction, including pending/offline models. Shared rules remain provisional and unreviewed; no clinical clearance or urgency prediction is enabled.
- Added separately consented location-only Maps search with permission/network failure handling and explicit unverified-facility semantics. Existing layout, confirmed evidence and Model A question authority are preserved.
- Completed 43 TypeScript and 15 Python tests, responsive safety and 20-question browser regressions, actual Model A smoke and fresh verification of all 17 sealed artifacts/frozen code and protocol. See [scope and release blockers](models/medassist_ai/docs/safety-navigation.md).

## NHAMCS ED Experiment 2 — 2026-10-24

- Compared two fixed, training-weighted Extra Trees configurations on the existing training/validation partitions, excluding the previously exposed test from prediction and scoring. Neither improved macro-F1 or severe recall; no model was selected.
- Documented source-imputation leakage, corrected age-flag interpretation and preserved Experiment 1 artifacts/results. Four-class Model B stays disabled; all 17 Model A sealed artifact hashes and frozen code/protocol matched before and after.

## NHAMCS five-class ED research baseline — 2026-10-24

- Trained one isolated real-data multinomial logistic-regression baseline with explicit missing states and stratified duplicate-group separation; documented held-out errors, calibration, abstention, source limitations and reproducible artifact hashes.
- Test accuracy 45.84%, macro-F1 0.3342 and immediate-class recall 17.86% keep clinical integration NO-GO. Four-class Model B remains disabled; all 17 sealed Model A artifacts and frozen code/protocol matched before and after.

## MedAssist extraction qualification and bounded comparison — 2026-10-21

- Compared three installed local models on 20 identical fictional cases using two fixed variants; preserved baseline and all failures. No candidate qualified.
- Added hash/digest-bound qualification, stricter uncertainty/negative validation and fast rejection of unqualified live language requests. Explicit structured Model A interviews and the existing UI are preserved.
- Verified actual Model A, 17 sealed artifacts and untouched official test/ledger protections. No training, downloads or Git publication.

## Explicit local MedGemma fictional integration — 2026-10-21

- Added an opt-in installed-only loopback Ollama provider, constrained extraction guards and existing-chat confirmation bridge to real Model A; preserved UI layout and frozen contracts.
- Preserved both 20-case development runs and disclosed failed extraction-quality gates, latency, memory limits and strengthened hallucination guards. No clinical enablement, downloads, training or Git publication.

## MedAssist intelligence evidence and governed boundaries — 2026-10-21

- Froze a 48-case fictional extraction benchmark, strict evaluation-only contract and promotion gates; implemented a capped local-only installed-model evaluator and preserved failed screen results without provider enablement.
- Verified actual sealed Model A over 20 follow-ups, UNKNOWN/dependency/duplicate/export behaviour and all 17 artifact hashes; froze the UI and existing evidence contract.
- Recorded blocked Model B label/data readiness and defined unavailable clinician-review/precautions/consented-navigation interfaces. No training, official test/ledger access, downloads or Git publication.

## MedAssist compact conversation UI correction — 2026-10-21

- Kept the normal conversation within a responsive viewport shell, with bounded scrollable history, one accessible composer and optional summary/privacy details; developer evidence remains exclusive to the separate inspector.
- Verified 20-turn layouts at 390/820/1440px, keyboard replies/history navigation, unchanged evidence semantics and focused tests. No frozen/research data changes or Git publication.


## MedAssist L2 implementation 1 — limited fictional conversation — 2026-10-21

- Added a DEV-only conversational page in the existing APIP shell and navigation, separate from the developer lab; confirmed supported symptoms feed actual preserved Model A follow-ups and unchanged evidence semantics.
- Added an exact metadata-verified initial vocabulary and strict candidate-extraction boundary. No language model is configured or selected; ambiguous/unsupported text clarifies, and clinical capabilities remain unavailable.
- Verified focused tests, local actual-model/browser behaviour and preservation gates; no training, official test/ledger access or Git publication. Full L2 remains open pending comparative language evaluation and clinical wording review.

## MedAssist sprint Day 2 — fictional adaptive question lab — 2026-10-21

- Added a DEV-only Material Web workflow using the preserved actual Model A: authored fixture start, typed B/C/M answers, UNKNOWN/conflict handling, stop/reset, evidence summary and unchanged versioned evidence export.
- Added a development-only guarded loopback proxy with server-side token, bounded validated transport and no production/patient inference integration. Fixed overlapping fixture startup reads discovered in browser smoke; inference remains serialized.
- Verified focused lifecycle/isolation tests and short real-model loopback/browser checks. Model B remains disabled; no training, official locked test, ledger claim or commit/merge/push.

## MedAssist sprint Day 1 review and evidence contract — 2026-10-20

- Reviewed the preserved 21-file Task 5A patch; fixed unsupported false binary initial complaints while preserving explicit negative follow-up answers and frozen ranker behavior.
- Defined a separate versioned research evidence handoff with positive/negative/value/unknown/not-asked/unsupported/conflict provenance; 28 focused tests passed. No Model B or clinical output was enabled.
- Verified existing NHAMCS availability without parsing records; clinical Model B data readiness remains NO-GO. Planned Days 2–5 around a nonclinical fallback; no commit, merge or push.

## Model A research integration prototype for review — 2026-10-20

- Added an isolated, opt-in loopback FastAPI adapter using the existing sealed selected v2 ranker and frozen features/eligibility, with versioned fictional request/response/evidence contracts and safe abstention.
- Added focused contract/safety/parity tests and local latency/memory measurements; no production routes, model fitting, validation replay, official patient decoding or locked-test access. Frozen assets remain unchanged; the patch is uncommitted pending review.

## MedAssist v2 official validation and verified pre-test seal — 2026-10-20

- Completed the original single campaign with 132,448 validation interviews and 529,792 cached policy trajectories; selected alpha 0.00001 using the frozen validation rule without refitting.
- Recorded full/sensitivity baseline comparisons, subgroup support and paired cluster-bootstrap uncertainty; full-validation synthetic recall@20 is 77.1866% versus 59.5172% training frequency.
- Independently verified all 17 sealed artifacts and five sources; original process exited 0, locked test/ledger remained unopened, and existing monitor was paused. Preserved the unresolved fresh-checkout CRLF/LF protocol-digest caveat. No application or clinical functionality changed.

## MedAssist v2 official fitting milestone — 2026-10-19

- Verified sources/environment/parity and prepared frozen training/validation cohorts and 1,048,576 training pairs; all three real SGD alpha fits completed without recorded warnings or numerical failures.
- Validation-only selection remains in progress. No winner, baseline comparison, full uncertainty report, pre-test seal or locked-test result is claimed; the original campaign is preserved without retraining.

## MedAssist v2 frozen runner and software preflight — 2026-10-19

- Implemented frozen training-reference/prefix/grid/selection/seal/test-cache/report stages with durable one-use test governance and aggregate subgroup/paired-bootstrap calculations.
- Passed 22 distinct focused tests, fictional end-to-end dry runs with a non-learning estimator and source/environment-only official preflight. No DDXPlus fitting, official validation/test outcomes, protocol change or application integration occurred.

## MedAssist v2 adaptive-questioning protocol freeze — 2026-10-19

- Froze the restricted 218-question synthetic collection task, unknown/default/conditional semantics, training-only overlap reference, prefix sampling, three baselines, lightweight ranking grid and one-time test design.
- Added checksum/metadata/protocol validation and synthetic leakage tests. Five unresolved history questions remain quarantined; no model training, corpus rescan or application behavior changed.

## MedAssist v2 official data acquisition and audit — 2026-10-19

- Verified all five pinned English v2 sources externally and audited 1,292,579 records without changing official partitions; published aggregate checksums, duplicate/coverage findings and Task 4 design gates.
- Fixed the official extensionless CSV-member format without relaxing archive/record/oracle checks; added acquisition/audit tooling and ten focused regressions. No model training or application behavior changed.

## MedAssist v2 read-only loader and simulator — 2026-10-19

- Added pinned source-size/hash verification, safe bounded CSV-in-ZIP streaming and deterministic staged answers with separate hidden oracle/evaluator data.
- Added 19 Task 2 synthetic regressions and a truthful missing-data report with manual acquisition commands. No source files downloaded, models trained or application behavior changed.

## MedAssist Symptom Assessment v2 foundation — 2026-10-19

- Added an isolated research directory with verified English DDXPlus v2 provenance, structured interview and separate proposed urgency-label contracts.
- Added source/evidence/provenance checks, aggregate quality and group-split feasibility, external storage guards and synthetic regressions. Original Phase 1–4A artifacts and application behavior remain unchanged; no training or patient-data download occurred.

## MedAssist Phase 4A error audit and validation design — 2026-10-19

- Added a read-only cached-prediction auditor with preservation checks and synthetic regression tests; frozen Phase 3 models, thresholds, assignments and protocol remain unchanged.
- Documented development versus opened-test error patterns, feature/target mismatch, nine-source feasibility, a clinician-reviewable independent study and research risks. No training, clinical rules or application inference changed.

## Profile editability and hospital requirements — 2026-10-18

- Fixed Material controls staying disabled after profile loading by controlling each field and checkbox explicitly. Added a browser regression fixture.
- Recorded Mahesh-attributed hospital ADR requirements, current module gaps, source uncertainties and phased integration without enabling clinical workflows or changing the database schema.

## Local database and authentication — 2026-10-18

- Connected development signup/sign-in, server-side cookie sessions and durable SQLite health profiles without Docker or cloud services.
- Added real HTTP integration checks for ownership, persistence across restart, validation, expiry, logout and rate limits; retained the optional Supabase adapter.

## Account/profile foundation — 2026-10-18

- Added configuration-gated patient signup/sign-in, Google provider integration, shared health-profile editing/deletion, per-layer sharing choices and owner-enforced PostgreSQL bootstrap with local isolation tests. Hosted connection remains pending.
- Switched active MedAssist/ADR interfaces to English only. Preserved existing saved draft text and historical evaluation records.
- Recorded zero-paid-service and all-age/caregiver scope, replacing earlier bilingual/budget assumptions.

Notable product and developer-facing changes. Entries describe completed work; plans belong in the [roadmap](docs/roadmap.md). An unreleased entry does not imply a release or clinical readiness.

## Unreleased

### Guided MedAssist symptom conversation and local AI — 2026-10-17

- Added English/Telugu symptom follow-ups, explicit unknown answers, review/edit, stable question-level Back, and discard protection.
- Connected a local Ollama source-quote helper after explicit fictional-case consent, with bounded requests, strict quote validation, cancellation, and preserved originals on failure. Two live fictional source/unknown checks passed; clinical urgency remains unassessed.
- Added location-only Google Maps hospital-search handoff with manual entry and optional permission-based location, without sending symptom statements.
- Corrected the next model research task to symptom/urgency data, documented primary dataset candidates, and retained clinical assessment/precautions as pending review/evaluation.

### MedAssist conversation design preview — 2026-10-17

- Added a responsive Material 3 conversation shell with English/Telugu interface text and consistent Back/ADR navigation.
- Marked the experience as a design preview: fictional messages remain in page memory and no model, persistence, or clinical guidance is connected.
- Documented that public pharmacovigilance datasets do not supply symptom-urgency labels, and recorded current openFDA/VigiBase access limitations.

### Delete saved fictional ADR drafts — 2026-10-17

- Added a per-draft Delete action with a centered confirmation dialog, cancel support, accessible focus restoration, and English/Telugu copy.
- Persisted confirmed deletions to the browser-local draft collection; failures keep the draft and report the storage error.
- Added an empty-list message after the last draft is removed and documented that browser-profile users share these fictional drafts.

### Shared navigation and stable page layout — 2026-10-17

- Added text-style Home, For patients, and Log in links to a shared header, including the developer reference.
- Kept Back in one fixed page row, connected ADR Back to its review/editor steps, and reserved scrollbar space so routes do not shift horizontally.
- Shared Google Sans Flex typography and inline appearance controls; prevented duplicate history entries and preserved modified-link behaviour.
- Added navigation regression checks and corrected the reference workflow tracker overflowing at tablet widths.

### Page-level back control placement — 2026-10-17

- Moved the shared Back action out of the app header and into a left-aligned page navigation row beneath it, reducing header crowding across preview pages.
- Restored centered welcome, patient, sign-in, and ADR layouts after adding the page wrapper; aligned the Back row to each screen's content width.

### Consistent back navigation — 2026-10-17

- Added a shared in-app Back control that follows the previous APIP screen and uses a safe parent route when a page is opened directly.
- Added ADR step/list back actions and a discard confirmation for unsaved draft edits; updated preview route links to retain browser history behavior.

### Multiple fictional ADR drafts — 2026-10-17

- Added an in-page Material 3 list to open saved fictional drafts or start another, with each draft retaining its own review/confirmation state.
- Migrated existing single-draft browser storage into the list in memory; new saves use a validated versioned collection.
- Clearly disclosed that drafts are shared by users of the same browser profile because sign-in is not implemented.

### ADR draft review and confirmation — 2026-10-17

- Split fictional ADR entry into a two-step flow: enter details, review reporter-originated values with unknowns preserved, then explicitly confirm and save in this browser.
- Added draft schema v2 with a user-confirmed status and timestamp; legacy v1 drafts migrate as unconfirmed.
- Kept professional review, authentication, server persistence, AI, and report submission out of the preview.

### Fictional ADR intake preview — 2026-10-17

- Mounted the existing English/Telugu fictional draft form at `#/preview/adr-report`, lazy-loaded it from the selected ADR sign-in preview, and added a clear return to patient home.
- Kept draft storage in this browser only and the explicit fictional-use notice; no authentication, AI, submission, or professional review was added.
- Updated the app route title, keyboard focus, and layer/architecture documentation.

### Appearance palette and header spacing — 2026-10-17

- Replaced the blue/black/green accent choices with familiar Google-inspired blue, red, yellow, and green highlights; only primary roles change with the selected accent.
- Lifted dark surfaces to readable Chrome-like charcoal greys and tuned the patient-home Help button's Material icon spacing.
- Preserved existing green and dark-mode preferences; retired black preferences return to the default blue.

### Patient home UI preview — 2026-10-17

- Added a responsive patient home with MedAssist and direct suspected-ADR reporting choices, plus patient-oriented header help and a clear preview label.
- Centered the Help dialog in the viewport on desktop and phones.
- Linked the patient sign-in view to the home preview without simulating authentication; task actions explain their implementation status.
- Corrected the shared button wrapper to place trailing icons in Material Web's supported icon slot and trailing-icon state.
- Added visible patient-home Help in the header and task-specific sign-in navigation that carries the requested destination while clearly stating authentication is unavailable.

### Access header refinements — 2026-10-17

- Restored Material Web capsule-button spacing and clarified the welcome header action as **Log in**.
- Moved access-page appearance controls into the existing header with a short, reduced-motion-aware transition, accessible theme toggles, and no page displacement.

### Welcome and sign-in interface — 2026-10-17

- Added a simple main-page sign-in action and shared Material 3 Patient, Specialist, and Developer sign-in views.
- Preserved the developer component library through an explicit preview route; no authentication or authorization is implied.
- Added responsive one/two-column layouts, local field feedback, password visibility, short reduced-motion-aware transitions, and licensed self-hosted Google Sans Flex assets.
- Kept credentials ephemeral and unsubmitted; preview submission honestly reports that sign-in is pending.


### Developer design reference and appearance — 2026-10-17

- Restored the component/token showcase as the running developer reference and removed the product-prototype tabs from its navigation.
- Replaced the teal palette with white neutral surfaces and default blue highlights; settings offer blue, black, green, and optional dark mode with browser persistence.
- Centralized colour roles in the shared tokens, kept the token inspector aligned, and honoured reduced-motion preferences.
- Fixed Material Web button boolean handling so enabled buttons are no longer disabled by a serialized `false` attribute.
- Recorded the developer-only access requirement as pending; no login or authorization is claimed.
- Updated the phase handoff sequence before further product/model work.


### Fictional ADR draft prototype — 2026-10-17

- Replaced the misleading simulated report submission with a bilingual local draft flow using the existing Material Web wrappers.
- Preserved reporter-entered medicine, dose, reaction, and timing statements in a versioned browser-local draft; omitted optional values remain unknown.
- Kept the prototype separate from mock professional records and explicitly limited it to fictional evaluation.
- Corrected the displayed APIP expansion to Agentic Pharma Co-intelligence Platform.
- Marked the shared interface as a design demo and removed unverified clinical/regulatory claims from its header and footer.
- Added root ignore rules for dependencies, generated output, environment files, and common machine artifacts.
- The draft is not authenticated, user-isolated, server-persisted, reviewed, or submitted. Frozen dependency installation, frontend lint, and the production build passed; Vite reported a 741 kB JavaScript chunk above its 500 kB advisory threshold.

### Free-tier medical-model availability — 2026-10-17

- Recorded Groq free-tier evaluation as approved direction and distinguished its general models from medical specialists.
- Verified Ollama medical candidates, Hugging Face model/provider status, a community ZeroGPU demo, and author repositories.
- Corrected the earlier Hugging Face USD 0.10 credit assumption: its live pricing page now lists no included credits for free users.
- Updated catalogues and references without enabling providers, installing models, or changing application routing.

### Model and dataset research — 2026-10-16

- Inventoried five installed Ollama models and added separate local/API catalogues without changing application model routing.
- Added a dependency-free local diagnostic and saved four fictional English/Telugu extraction observations, including one incorrect Telugu medicine field.
- Recorded model/provider candidates, free-tier limitations, dataset rights/task suitability, and a likely MALADE reference.
- Confirmed the INR 500 monthly planning budget and recorded Mahesh's reported pharmacy-reviewer role with limited availability; AI checks remain distinct from human clinical sign-off.

### Detailed implementation planning — 2026-10-16

- Expanded the milestone roadmap with indicative working-day windows, first-day steps, proposed responsibilities, inputs needed, review gates, and fallback scope.
- Added a linked guide for local/API model comparison, custom ML training/evaluation, bilingual RAG, and four-agent implementation.
- Recorded the selected English/Telugu fictional-case scope and provisional INR 500 monthly planning ceiling.
- Kept model/architecture choices proposed and clinical/public deployment dependent on evidence; no application behavior or dependency changed.

### Repository automation — 2026-10-16

- Added a task-completion helper that commits explicitly selected files with a required dated history update.
- Added an installed checkout-local post-commit hook for automatic ordinary pushes to the matching branch of the reviewed origin.
- Preserved unrelated work and local commits on push failure; destination changes and existing custom hooks require review.
- Recorded standing user authorization for routine completed-work commits and GitHub sync without repeated confirmation.
- Verified the workflow with ten integration tests against isolated local Git repositories and remotes.

### Documentation — 2026-10-16

- Established the canonical product name, vision, connected layers, and four-agent direction.
- Rewrote the README to explain the demonstration baseline and guide contributors.
- Consolidated incomplete and repeated planning files into architecture, setup, layer, milestone, decision, research, and validation documentation.
- Established dated development history and required documentation updates alongside code.
- Preserved useful origin, research, future ideas, prior findings, and dependencies without publishing local chat/workspace identifiers.
- Replaced calendar-bound planning with ongoing milestones and acceptance gates.

Application code and dependency versions are unchanged. See [dated history](docs/history/2026-10-16.md) for scope and verification.

## Earlier repository history

- [`5400696`](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP/commit/54006967a0325acdae83e46f04a84b4ce1ad4f92): Material 3 component views and shared tokens.
- `4b0e6e3`: initial pharmacovigilance prototype and documentation, as recorded in Git.

Earlier templates did not establish a reliable release history. No version tags or completion dates are invented for that work.

## 2026-10-18 — Local account ADR persistence

- Added owner-isolated fictional ADR drafts with unfinished save, reopen/edit, explicit user confirmation and revision-checked deletion.
- Preserved legacy browser drafts in a separate demo; no automatic import or cloud provision.
- Added HTTP persistence/ownership/migration checks and a separate UI failure regression fixture. Hospital review/submission remains unimplemented.

## 2026-10-18 — Restrict legacy agents and startup exposure

- Disabled legacy APIs by default and permanently in production; trusted local opt-in precedes parsing/provider work and adds non-clinical metadata.
- Removed global permissive CORS; development HTTP/HMR bind to loopback.
- Added explicit Windows-compatible mode launchers, validated bind configuration and focused security tests.

## 2026-10-19 — Open-access MedAssist dataset strategy

- Verified NHAMCS 2022 IMMEDR labels, published class/missingness marginals, source terms and leakage risks.
- Added a pinned metadata manifest and separate real-acuity/synthetic-question experiment plan with three structured-model candidates and explicit uncertainty/evaluation gates.
- Kept MIMIC-IV-ED Demo smoke-only; no restricted data, training or patient-facing changes.

## 2026-10-19 — MedAssist ML Phase 1 data engineering

- Implemented isolated Python acquisition, Stata decoding, missingness/provenance audits and deterministic group-disjoint candidate partitions, with 14 passing synthetic tests.
- Acquired official NHAMCS 2022 outside Git; actual 16,025 visits/913 columns and all IMMEDR counts reconcile exactly. Committed safe aggregate reports/receipt summaries only.
- Verified supporting DDXPlus/MIMIC demo metadata without patient archives. Documented sparse Immediate support, symptom-filter selection, age provenance and timing blockers requiring Phase 1 review before training.
- Preserved application/ADR behavior and unrelated untracked work; no estimator training or clinical deployment.

## 2026-10-19 — MedAssist Phase 2 baseline protocol freeze

- Froze primary binary all-labelled and exploratory five-class symptom tasks, preserving existing group-disjoint outer partitions and matched vitals comparisons.
- Added no-RFV initial-vitals features, explicit zero/provenance cleaning, saved-assignment/source checks and fit-only CV/support preflight.
- Fixed LR/RF/HGB grids, primary-only calibration/threshold procedures and locked evaluation/rare-class safeguards. Twenty-three focused synthetic tests passed with warnings treated as errors.
- Recorded offline-only training readiness; no models trained or patient-facing MedAssist/ADR behavior changed.

## 2026-10-19 — MedAssist Phase 3 offline training and locked evaluation

- Implemented fold-local LR/RF/HGB pipelines, bounded candidate workers, convergence/failure logs, primary frozen-base calibration, development-only thresholds and all-task pre-test hashing/sealing.
- Completed all 60 configurations/180 CV fold fits, 12 final models and six calibrators under unchanged v1, then evaluated each frozen model once. No recorded training warnings/failures.
- Added 15 synthetic regressions (38 total), actual cached-result/threshold verification, aggregate comparisons/calibration/evaluation reports, four research model cards and reproducibility hashes. Raw data, private predictions and fitted artifacts remain external.
- Recorded material negative findings: primary vitals CV winner missed 86/411 high and 7/26 Immediate cases; every five-class variant missed exact Immediate class on all ten cases. Singleton strata suppress intervals. No clinical/app/ADR integration or safety behavior changed.


### 2026-10-21 — MedAssist conversational refinement (uncommitted)

- Removed duplicate initial confirmation bubbles and duplicate follow-up headings; added a shared exact-answer composer, retry locking and client replay rejection.
- Kept the provider disabled; added a validated suggestion-only evaluation seam and current candidate feasibility notes. L2 remains partial with clinical features unavailable.
- Verified 15 Node and 18 authored Python tests, type/build checks and three-width Chrome lifecycle with response stubs; actual-model/LLM benchmarking remains open.

### MedAssist Groq fictional extraction — 2026-10-23

Added a backend-only, explicitly enabled, hash-qualified Groq provider with sparse evidence validation and confirmation before frozen Model A inference. Qwen passed the bounded 20-case gate; real browser smoke passed. See [evaluation and limitations](models/medassist_intelligence/groq-v1/README.md). Clinical functions remain disabled; no UI layout redesign.

### Modular MedAssist research architecture — 2026-10-23

Added injectable component registry/orchestrator, canonical Model A adapter, qualified Groq OOP wrapper and safe operational metadata, evidence boundaries, pinned disabled Jayanth adapter, and disabled urgency/safety/hospital interfaces. Existing routes/UI and frozen assets remain preserved. [Implementation and checks](models/medassist_ai/README.md).

### Jayanth canonical artifact recovery — 2026-10-24

Verified remote merge ancestry and restored 16 missing canonical ML/data/dependency files from pinned remote main without merging or overwriting work. Adapter integrity now checks Git blob identity and SHA-256; Joblib execution stays disabled. [Recovery evidence](models/medassist_ai/docs/artifact-recovery.md).

### Jayanth compatibility and leakage validation — 2026-10-24

Reproduced declared dependencies in an isolated hash-locked environment, added literal-only vocabulary inspection and deterministic explicit-unknown normalization, and audited duplicate-group leakage. Disease execution and clinical guidance remain disabled. [Evidence and limitations](models/medassist_ai/docs/jayanth-technical-validation.md).

### Model B gated readiness foundation — 2026-10-24

Added provisional urgency schema, provenance-gated ingestion, group-safe splits, offline trainer/evaluator and research-only registration. Synthetic checks do not train or clinically validate Model B; the active provider remains disabled. [Implementation and gates](models/medassist_ai/model_b/README.md).

## Hosted specialist verified-subject repair - 2026-11-08

- Repaired the private identity function and RLS subject lookup for managed PostgreSQL without granting broader Auth-schema or patient access. Real hosted capabilities, saved profile/submission and session restoration pass; administrator bootstrap remains blocked. [Evidence](docs/adr/phase3/3b-hosted-specialist-repair.md).

## Phase 3B hosted administrator verification - 2026-11-08

- Completed separately approved one-time identity-administrator bootstrap and real hosted two-account approval/revocation plus foreign patient/PDF denial. No clinical permissions or sharing enabled. [Evidence](docs/adr/phase3/3b-hosted-administrator-gate.md).

## Specialist experience redesign (3C-A) - 2026-11-08

- Added a cohesive specialist profile, compact verification status and three-card home connected to existing MedAssist/owned ADR tools. Real hosted revoked-state screenshots and four-width regressions pass. Review inbox remains explicitly restricted/unconnected; no sharing, database or privilege changes. [Delivery](docs/adr/phase3/3c-a-implementation-and-verification.md).
