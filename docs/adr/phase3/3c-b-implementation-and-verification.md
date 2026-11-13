# ADR Phase 3C-B: Consented Patient-to-Specialist ADR Sharing Implementation & Verification

**Date:** 2026-11-08
**Branch:** `antigravity/adr-phase3cb-hosted-finalization`
**Base Commit:** `0d8dc7c53420be0173576cb6dd54dea5ee470b63`
**Environment:** Isolated Antigravity Worktree (`APIP-Antigravity-3CB`)
**Status:** **PASS** (Gates M1 through M8 complete)

---

## 1. Scope & Objective

Phase 3C-B establishes the first secure, permissioned link between patient-reported adverse drug reaction cases and approved healthcare specialists. Following approved Policy Bundle v1 (`docs/adr/phase3/3c-b-policy-approval.md`):

1. **Exact-Revision Consent:** Patient grants access to one immutable saved revision; subsequent edits (e.g. Revision 4 after Revision 3) remain strictly private until separately confirmed and shared.
2. **Explicit Disclosure Scope:** Full disclosure of patient personal/contact details present in the regulatory form, extraction proposals excluded, and unambiguous PDF copying notice presented prior to consent.
3. **Opt-in Directory & Single Active Assignment:** Specialists opt in to directory visibility; assignments are atomic, strictly one-active-assignment per case, and self-review is forbidden.
4. **Authorized Original PvPI PDF Preview:** Specialist previews the exact consented Version 1.4 official form in-app with verified byte delivery; separate download is disabled.
5. **Real-time Withdrawal Enforcement:** Patient withdrawal immediately revokes subsequent protected API calls (404 Not Found), rechecked at byte delivery boundaries.

---

## 2. Architecture & File Inventory

### Backend Core
- `supabase/migrations/20261108123217_adr_consented_sharing.sql`
  *SHA-256:* `e6b5247b5e8519b5344429fa50695fc419cc137a1c7c3e0af9088089489cbb63`
  Creates four tables in the private `apip_sharing` schema: **`directory`**, **`requests`**, **`audit`**, and **`receipts`**; atomic dispatcher functions; and strict RLS policies.
  *Correction: earlier drafts of this document incorrectly listed table names as `opt_ins`, `assignments`, `audit_events`, `command_receipts`. The SQL file and `3c-b-migration-review.md` are authoritative.*
- `server/sharing/disclosure.ts` — Prepares disclosure payload, excludes AI proposals, computes cryptographic digest.
- `server/sharing/policy.ts` — Validates readiness, prevents self-review, enforces exact-revision authorization.
- `server/sharing/repository.ts` — Transaction-safe PostgreSQL repository executing under restricted writer role (`apip_adr_writer`).
- `server/sharing/router.ts` — Express router with idempotency enforcement, account mismatch checks, and byte-delivery withdrawal rechecks.

### Frontend Integration
- `src/features/specialist/SharingWorkspace.tsx` — Patient consent dialog (`PatientSharingWorkspace`), recipient selector, specialist review inbox (`SharingInbox`), and live PvPI preview wrapper.
- `src/features/adr/cases/CaseWorkspace.tsx` — Integrates patient sharing controls into the case management view.
- `src/features/specialist/SpecialistWorkspace.tsx` — Directs approved specialists to `SharingInbox` under `#/specialist/reviews`.
- `src/features/specialist/SpecialistExperience.tsx` — Shows live assigned report counts in the 3-card specialist dashboard.
- `src/features/adr/guided/LiveFormPreview.tsx` — Robust dynamic PDF worker loading for responsive canvas preview.

---

## 3. Verification Test Evidence

### Unit & Integration Test Suites
All 5 automated test suites pass without error:
```text
✔ scripts/sharing-disclosure.test.ts (2 tests pass)
  - disclosure binds immutable revision, highlights contact data and excludes extraction proposals
  - incomplete, unconfirmed, unknown-schema and reserved-field payloads fail closed
✔ scripts/sharing-policy.test.ts (1 test pass)
  - exact revision grant requires all current authorization dimensions; administrator identity is insufficient
✔ scripts/sharing-postgres.test.ts (1 test pass)
  - draft sharing foundation installs under non-superuser and exposes no browser or writer access
✔ scripts/sharing-upgrade.test.ts (1 test pass)
  - sharing upgrade preserves populated actual ADR tables and existing ownership policies
✔ scripts/sharing-api.test.ts (1 test pass)
  - sharing HTTP validates owner context, explicit consent and revocation before original PDF delivery
```

### End-to-End Chrome Browser Verification

> **Evidence classification: Disposable local fixture — not proof of real hosted Supabase sharing.**
>
> The test uses `startSpecialistFixture` with an in-memory PGlite PostgreSQL instance and synthetic local
> authentication. It does **not** connect to the hosted `kstxwoitiistmvivwixd` development project.
> Real hosted end-to-end verification requires separate interactive credential entry via
> `scripts/start-hosted-preview.ps1` and is tracked under "Hosted Gates Still Required" in
> `3c-b-migration-review.md`.

Automated multi-device fixture test (`scripts/sharing.browser.mjs`) ran in Chrome using a **disposable
local PGlite PostgreSQL fixture** across all required breakpoints:

- **320px (Mobile Portrait):** PASS — disposable fixture (Consent dialog, assignment, PvPI PDF canvas preview, withdrawal 404 denial)
- **360px (Standard Mobile):** PASS — disposable fixture (Consent dialog, assignment, PvPI PDF canvas preview, withdrawal 404 denial)
- **820px (Tablet):** PASS — disposable fixture (Consent dialog, assignment, PvPI PDF canvas preview, withdrawal 404 denial)
- **1440px (Desktop):** PASS — disposable fixture (Consent dialog, assignment, PvPI PDF canvas preview, withdrawal 404 denial)
- **Visual Artifacts:** Generated in `C:\Users\ASUS\Documents\phase3c-b-evidence/`:
  - `consent-{320,360,820,1440}.png`
  - `inbox-{320,360,820,1440}.png`
  - `preview-{320,360,820,1440}.png`
  - `dark-{320,360,820,1440}.png`
  - `authorized-{320,360,820,1440}.pdf` (Exact form text verified via Python `pypdf`: "Fictional reporter", "Fictional medicine")
  - `browser-results.json`

### Production Build
- `npm run build` executed successfully:
  - Vite client assets built in 6.78s
  - Node server bundle (`dist/server.cjs`) built in 21ms without syntax or type errors.

---

## 4. Preservation & Non-Destructive Isolation

- **Codex Worktree:** Preserved in its original state at `C:\Users\ASUS\.codex\visualizations\2026\11\03\01a1a1ca-eef3-7f53-a13f-566553e1be1e\apip-cloud-backend`. No commits, resets, cleanups, or modifications were performed in the Codex tree.
- **Antigravity Worktree:** All work executed in `C:\Users\ASUS\Documents\APIP-Antigravity-3CB` on branch `antigravity/adr-phase3cb-hosted-finalization`.

---

## 5. Codex Resumption & Integration Instructions

When resuming in Codex or preparing pull request reconciliation:
1. Fetch branch `antigravity/adr-phase3cb-hosted-finalization`.
2. Inspect the diff against `0d8dc7c53420be0173576cb6dd54dea5ee470b63`.
3. The only functional code refinement made beyond the Codex snapshot is the robust `workerUrl` fallback in `src/features/adr/guided/LiveFormPreview.tsx` enabling canvas PDF rendering.
4. Non-destructively merge or cherry-pick into `codex/adr-phase3c-consented-sharing`.
