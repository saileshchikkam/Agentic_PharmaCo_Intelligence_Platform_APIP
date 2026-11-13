# Phase 3C-A — Specialist profile and three-card workspace

Date: 2026-11-08. Baseline `672bca78645e674bba1eaf9376d0f43e5e4e02f5`, verified clean Phase 3B branch. Implementation branch: `codex/adr-phase3c-specialist-experience`. The user's attached stage brief authorizes the presentation/navigation redesign first. Sharing, consent, assignment, specialist PDF access and clinical review remain policy-gated; no 3C-B/C/D functionality or database migration was implemented.

## Delivered experience

One professional profile now has a short heading, compact current-status surface and six primary fields: name, category, qualification, registration reference, organization and department. Jurisdiction, experience and specialization remain in an optional disclosure. All nine existing fields persist through the unchanged APIs. Applicant claims are never labeled professionally verified. Submitted profiles remain read-only under the existing lifecycle policy.

The profile removes the old large revision/status/history documents, repeated synthetic wording and future-module list. One development/test indicator remains. Historical decisions are retained server-side and available through an optional compact application-activity disclosure; no audit data was removed. Admin decision screens retain their existing independent verification safeguards.

Save uses the same expected-version/idempotent commands. Submit waits for actual server success before navigating to the specialist home. No local role, selected route or profile completion grants professional authorization. The dedicated dashboard presents exactly three primary cards: Medical Assistant AI, ADR Reporting and Pending Review Reports. The first two reuse the existing permitted MedAssist route and own-patient reporting workspace. The third is restricted for inactive identities; approved identities can open a clearly unconnected review inbox. It does not report invented zero counts, query patient drafts or imply case sharing exists.

## Route and authorization map

- `#/sign-in/specialist`: existing shared Supabase/local-test Auth. No new identity service.
- `#/specialist`: backward-compatible entry; reads current capabilities and own application, then selects profile for new/draft applicants or home for submitted and later states.
- `#/specialist/profile`: dedicated professional profile, editable only before submission.
- `#/specialist/home`: three-card dashboard with current server-derived status. Draft/no-profile users return to the profile.
- `#/specialist/reviews`: dedicated nonclinical inbox shell. Pending, rejected, suspended, revoked and expired users see restricted access; current approved users see that consent/assignment is not connected. Neither state fetches patient records.
- Existing identity-administration routes and patient/MedAssist destinations remain unchanged. Safe sign-in return destinations now allow the three exact specialist routes, not arbitrary URLs.

Status text covers new, draft, submitted, verification in progress, approved, rejected, suspended, revoked and expired. An APPROVED application without current capability is conservatively unavailable. Owner-key remounting, stale response checks, focus/visibility refresh, mutation locks and dirty-profile navigation guards are reused. The home page has no raw patient counts. Specialist approval never expands another patient's record access.

## Actual verification

- **PASS — real hosted read-only Chrome:** 320/360/820/1440px, single profile and exactly three dashboard cards, HTTP 200 capabilities, actual **Review access revoked** state and session restoration after reload. The worker reports **mutations: none**. No database records were changed, privileges restored or consent/sharing enabled.
- **PASS — disposable PostgreSQL Chrome:** profile create/save/submit, optional field persistence, confirmed submit-to-home navigation, cards and routing, browser Back, pending/approved/rejected/suspended/revoked/expired states, direct restricted inbox, sign-out/sign-in/reload, account-switch cleanup, light/dark and reduced motion at all four widths. Desktop cards share one row; narrower cards fit without horizontal overflow.
- **PASS — focused mobile guard check:** cancelled unsaved-profile navigation preserves entered data, keyboard Save/Submit works and pending-verification presentation remains restricted.
- **PASS — preserved patient regression:** all four widths, case listing/search, guided editing, immutable history, original current/historical PDF generation/reopening, dark mode, logout and foreign-owner denial. Initial runs were interrupted by test/source hot reloads during development; final stable-source run passes. The harness now ignores unrelated documentation/test changes.
- **PASS — 11 focused Node tests:** shared navigation, unsaved navigation cancellation and identity/API contracts. No unchanged long-lived-token, full migration or Python fidelity suite was repeated.
- **PASS — frontend TypeScript, Vite configuration TypeScript, strict actual server TypeScript and production build.** Actual backend services and dependencies were not changed.

The first hosted login was in a different browser session. Read-only inspection confirmed the worker remained on Sign in without an error; its existing tab was focused/labeled and the user signed in there. The same worker then completed automatically. Temporary loopback debugging of that owned worker was closed. Tokens/passwords were not extracted or included in evidence.

## Real screenshots and preview

Before redesign: [Phase 3B original workspace](evidence/3b/approved-1440.png), a disposable example retained with its original label.

After redesign, actual hosted revoked account:

- [1440px dashboard](evidence/3c-a/hosted-dashboard-1440.png) and [profile](evidence/3c-a/hosted-profile-1440.png).
- [820px dashboard](evidence/3c-a/hosted-dashboard-820.png) and [profile](evidence/3c-a/hosted-profile-820.png).
- [360px dashboard](evidence/3c-a/hosted-dashboard-360.png) and [profile](evidence/3c-a/hosted-profile-360.png).
- [320px dashboard](evidence/3c-a/hosted-dashboard-320.png) and [profile](evidence/3c-a/hosted-profile-320.png).
- [Disposable dark theme](evidence/3c-a/dark-1440.png) and [verification summary](evidence/3c-a/verification.json).

Verified hosted PostgreSQL URL: `http://127.0.0.1:3301/#/specialist/home`; profile: `http://127.0.0.1:3301/#/specialist/profile`. Sign-in is required; new/draft accounts go to profile. This is accessible only on the development laptop, not a public preview. The running backend remains the verified unchanged Phase 3B API; its existing static runtime serves the rebuilt Phase 3C-A frontend. New hashed assets were added without deleting prior assets or restarting the backend. Existing worktrees, databases and private configuration were preserved.

## File-by-file walkthrough

- `src/features/specialist/SpecialistExperience.tsx`: presentation-only profile, status language, three-card dashboard and explicitly restricted/unconnected inbox. Material Web fields/buttons are reused. Native details disclosures and semantic surface cards cover components without stable Material Web equivalents, styled to the repository's Material 3 tokens.
- `SpecialistWorkspace.tsx`: retains all existing authenticated fetching, mutation, version/idempotency and account cleanup; passes data/actions to the presenter and redirects only from confirmed server application state. The separate existing administrator renderer is preserved.
- `specialist.css`: responsive profile/cards, compact status, restrained surfaces, focus/hover/reduced-motion styles. Global glass header and MedAssist CSS are unchanged.
- `src/features/access/AccessPreview.tsx`: exact specialist profile/home/reviews hash routes plus legacy entry.
- `src/features/account/AccountSignIn.tsx`: extends the existing safe internal return-path allowlist only.
- `scripts/specialist-experience.browser.mjs`: actual Chrome with disposable PostgreSQL/local-test Auth; fictional profiles and controlled fixture states, no hosted mutations.
- `scripts/specialist-experience-hosted.browser.mjs`: private manual real sign-in, read-only profile/dashboard screenshots and current capability/reload checks.
- `scripts/adr-cases.browser.mjs`: prevents unrelated docs/test edits from interrupting patient browser checks; patient assertions remain intact.
- Stage report, specialist journey, authorization/acceptance index, history/changelog/roadmap and next prompt: factual scope and remaining approvals, with no new migration or backend endpoint.

## Remaining gates and next substage

**PASS: 3C-A. BLOCKED by unapproved policy: 3C-B/C/D sharing and review.** No new scope was silently enabled. The review inbox intentionally has no assignment API, count, review editor or export action. No real credential verification or clinical readiness is claimed.

Resolve recipient/directory disclosure, exact revision/data consent, withdrawal and in-flight export checks, reassignment, retention/deletion, conflicts, note visibility and audit policy before sharing writes. Exact new SQL would require separate hosted approval. [Complete copy-ready 3C-B prompt](3c-b-next-prompt.md) contains these gates and the bounded proposed work. Do not start it automatically.
