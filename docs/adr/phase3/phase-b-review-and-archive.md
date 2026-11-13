# Phase B — specialist review and private completed archive

Status: independent implementation and disposable verification complete; **hosted workflow BLOCKED** by pending SQL and personal privilege/configuration approvals. Branch `codex/apip-landing-v2`, baseline `720bc349869a9c98fda6a15e160f5e7fb538ad31`. No Phase A implementation was repeated, no hosted accounts/data were changed, and PR #16 remains unmerged with existing main conflicts.

## Application behavior

The existing three specialist cards are preserved. Patient ADR Reviews opens the existing 60:40 review/own-reports workspace, with mobile switching. Queue rows show a case reference/date and structural counts before claim; free-text narratives, medication names and initials appear only after an authorized assignment. Current portal binding and independent approval remain separate. Draft/unshared/self-authored cases cannot become the actor's own professional assignment.

Case-specific `/specialist/reviews/:assignment` displays immutable confirmed patient information and the original form alongside human assessment controls. Save/resume, version history and finalization use the existing backend with strict expected versions and immutable final history. Causality/seriousness/outcome are explicit human entries; no clinical decision is computed. Finalization attempts private PDF generation when patient consent/configuration allow; failed archival does not undo assessment finalization. A separate retry action remains. Busy original-form previews show a retry action rather than treating the assessment as lost. Existing specialist-owned ADR reporting and its 50:50 layout are reused unchanged.

The completed PDF preserves original PvPI pages/fields and appends separately labeled fictional assessment pages. AMC/NCC identifiers are not invented. Private notes are excluded. Unsupported PDF scripts fail explicitly; the current font/runtime remains English/WinAnsi. No independent human clinical validation is claimed.

The unlisted developer route is `/internal/completed-adr`. Existing sign-in is reused; route secrecy/email alone grant nothing. Server/database checks require a separate exact-subject entitlement and matching provider-verified email, current patient archive consent and assignment/reviewer authorization. View/download routes recheck after file retrieval; missing/corrupt files fail explicitly. Browser copies already delivered cannot be recalled. No public URL is issued.

## API contracts

- `GET /api/review/assignments`: authorized assignment summaries and real assessment status.
- Existing `GET/POST /api/review/:id/assessments`: immutable draft/final versions; invalid final readiness 422, stale/finalized conflict 409.
- `GET /api/archive/capabilities`, `GET /api/archive/completed`: exact developer capability and bounded accessible archive list.
- `GET/POST /api/archive/:id/consent`: patient-only separate consent history/current state. Mutations require expectedVersion, allowed, confirmed=true, policyVersion=`phase-b-archive-v1` and a UUID Idempotency-Key.
- `POST /api/archive/:id/generate`: assigned approved specialist only, empty body plus UUID key; requires a final assessment and separate current archive consent.
- `GET /api/archive/:id/pdf[?download=1]`: separately entitled developer, integrity verification and authorization recheck before response.

All use existing verified bearer principals and X-APIP-Account. Verified email comes from provider getUser, not request fields or editable user metadata. GET audit checks receive server-generated nonces, independent of caller-supplied idempotency headers. Sharing/claim/release/withdrawal endpoints are reused.

## Technical walkthrough

- `server/review/router.ts` and the pending professional migration implement assessment validation, versioning, assignment summaries and current authorization. The existing repository maps concurrency to 409; assessment readiness is now 422.
- `server/review/archive.ts` implements PostgreSQL archive commands, the fixed private-bucket adapter, deterministic object paths, integrity checks and pre-delivery revalidation. Postgres metadata/audit commit atomically; Storage and PostgreSQL are not one distributed transaction. Retries retain existing bytes and never overwrite an archive object.
- `server/review/pdf.ts` and `pdf_review.py` append a separate human assessment through the existing configured native PDF interpreter. Original forms are cloned, not redesigned.
- `ProfessionalReview.tsx`, `ArchiveConsent.tsx`, `DeveloperArchive.tsx` and `reviewClient.ts` reuse Material Web controls and shared authenticated requests. `SpecialistWorkspace`, `SharingWorkspace` and access routes connect them without changing the header, existing portal roles or dashboard cards. New styles are scoped in `specialist.css`.
- `server/cloud-account.ts` passes provider-verified email and registers the new routes; default-off `APIP_ARCHIVE_ENABLED` and server-only `APIP_ARCHIVE_STORAGE_KEY` gate hosting. Existing sharing/pool/review flags remain independent and off in the current hosted preview.
- The pending pool migration adds Phase A-compatible guarding and assignment release metadata. `server/sharing/policy.ts` removes free-text queue snippets; row detail is available after authorization. No patient table ownership policy is widened.
- `scripts/phase-b-fixture.ts`, security/API tests and `phase-b.browser.ts` use isolated actual migrations and non-superuser repositories. Auth approvals and Storage are deliberately fictional fixtures. `review-pdf.test.py/.ts` verify native appendix preservation, private-note exclusion and unsupported-script failure. Bootstrap templates are never called on application startup.

## Verification and remaining gates

Full local unit/PostgreSQL/security suite: 74 PASS. PDF suite: 12 PASS (including native appendix tests); frontend/affected backend TypeScript and production build PASS. Chrome fixture at 1440/375 PASS for the complete consent/claim/release/assessment/archive/withdrawal journey, no horizontal overflow, preserved three cards and mobile switching. Actual native archived PDF was downloaded and screenshots recorded locally. Storage API integration itself is mocked, not a hosted Supabase Storage PASS. Socket fixture races validate conflicts/receipts, not managed PostgreSQL concurrency capacity.

Read-only hosted preflight still has two accounts, two Phase A finalizations, zero shares, zero approved specialists and zero administrators. Pending objects and archive bucket are absent. [Exact migration scope, hashes/order, security and rollback](phase-b-migration-review.md). Real hosted acceptance, live Storage and personal entitlements remain BLOCKED until separately approved. Existing preview is the unified laptop-only 3602 origin; hosted Phase B stays disabled. Existing PR merge conflicts independently block PR verification; push CI status must be verified on the final commit.
