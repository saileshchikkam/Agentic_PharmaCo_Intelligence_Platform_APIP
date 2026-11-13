# APIP — Canonical Codex & Google Antigravity Development Handoff

This document defines the permanent shared development workflow between **OpenAI Codex** and **Google Antigravity** on `saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP`.

Both agents must follow this specification strictly to avoid divergent branches, duplicate implementations, credential leaks, or unintentional clinical regressions.

---

## 1. Canonical Repository & Current Integration Baseline

- **Repository**: `https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP`
- **Primary Integration Branch**: `codex/apip-landing-v2`
- **Active Integration Pull Request**: [PR #16](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP/pull/16) (Targets `main`, State: `DRAFT`, Mergeable: `MERGEABLE`)
- **Relationship to `main`**: 0 commits behind `origin/main`; cleanly integrates `origin/main` commit `b66ea03` ("Add diagram badge to README") with zero conflicts.
- **Production Baseline Branch**: `main` (SHA `b66ea03e357abe3eba94fa6dbfa8788244ed11e3`)

---

## 2. Integrated Feature Lineage (Commits Preserved in Baseline)

The canonical integration branch incorporates all 39 cumulative commits from the stacked development lineage:

1. **Shared Foundation (Phase 1 & 1B)**: Accessible M3 shell, navigation rail, intake forms (`75d1261` .. `c4a518c`).
2. **PostgreSQL & Cloud Auth Foundation (PR #6)**: Restricted writer grants, migration version reconciliation (`e4e96b3` .. `5c20ede`).
3. **Patient Case Management & Exact-Revision PDF (PR #7)**: Revision tracking, immutable snapshots, pypdf integration (`86920c0`).
4. **Specialist Identity & Audited Administration (PR #8 & PR #14)**: Verification boundary, audited 30-day approval for synthetic specialist (`3dce84c` .. `672bca7`, `a561155`).
5. **Specialist Experience (PR #9)**: Specialist profile, three-card workspace, intake navigation (`146a8f4` .. `0d8dc7c`).
6. **Consented Specialist Sharing (PR #10 & PR #12)**: `apip_sharing` schema, consent digests, directory opt-in, newer-revision privacy, withdrawal denial (`6ed8801` .. `d49d2f8`).
7. **Minimalist Authentication Redesign (PR #11 & PR #13)**: 552px centered card, session restoration, Google OAuth status clarity (`8d9c072` .. `613e6c5`).
8. **Security Remediation & Pre-Commit Leak Guard (PR #14)**: Database password rotation, hardcoded credential removal, automated pre-commit secret leak guard (`862ce88`, `7968cdf`).
9. **Material Design 3 Web Landing Page V2 (PR #16)**: Standard M3 Web body & footer, 4-step walkthrough, capability cards, patient & specialist journeys, byte-for-byte identical protected header (`faf5c8a`).

---

## 3. Non-Negotiable Protection Rules

1. **Protect MedAssist Development & Research**:
   - Never merge, delete, rewrite, or reset any MedAssist branch:
     - `feat/medassist-jayanth`
     - `codex/medassist-v2-task5a-adapter`
     - `codex/medassist-emergency-recognition` (PR #2)
   - Do not merge emergency-recognition research into the core application while its independent safety gates remain unresolved.
2. **Protect Local Development Environments & Worktrees**:
   - Never reset, stash, or overwrite the dirty Codex worktree (`C:/Users/ASUS/Documents/APIP` on `codex/medassist-v2-task5a-adapter` and `C:/Users/ASUS/.codex/worktrees/...`).
   - Work only in dedicated worktrees or clean checkouts.
3. **Preserve Existing Architecture & Visual Identity**:
   - Material Design 3 Web UI is required (not M3 Expressive).
   - Application header is strictly protected across all viewports.
   - Separate patient drafts, confirmed fields, AI suggestions, and professional conclusions.
   - Maintain least-privilege database roles: `apip_adr_writer` has zero access to `auth.users`.
4. **Zero Credentials in Git**:
   - Never commit connection strings, passwords, service role keys, or private paths.
   - All commits must pass `scripts/git-workflow.mjs` leak checks (11/11 tests).

---

## 4. Environment Variables Reference (Names Only — Never Values)

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `APIP_ADR_DATABASE_URL` | User Environment / Server | Hosted Supabase PostgreSQL connection string (pooler port 6543) |
| `APIP_SUPABASE_URL` | Client / Server | Hosted Supabase project URL (`https://kstxwoitiistmvivwixd.supabase.co`) |
| `APIP_SUPABASE_PUBLISHABLE_KEY` | Client / Server | Hosted Supabase anon/publishable key |
| `APIP_PDF_PYTHON` | Server Environment | Path to Python interpreter with `pypdf` installed (`.venv/Scripts/python.exe`) |
| `NODE_EXTRA_CA_CERTS` | Node Environment | Path to Supabase SSL CA certificate (`supabase-prod-ca-2021.crt`) |
| `ADR_PLAYWRIGHT_MODULE` | Test Environment | Path to Playwright module (`npm-cache/_npx/.../node_modules/playwright/index.mjs`) |
| `APIP_LANDING_URL` | Test Environment | Frontend URL for Playwright tests (`http://127.0.0.1:3602` or `http://127.0.0.1:3000`) |
| `APIP_LANDING_EVIDENCE` | Test Environment | Output directory for responsive UI screenshots |

---

## 5. Working Preview Commands & URLs

### Start Cloud-Connected Backend (Port 3601)
```powershell
$env:NODE_ENV = 'production'
$env:APIP_HOST = '127.0.0.1'
$env:APIP_PORT = '3601'
$env:APIP_PDF_PYTHON = 'C:\Users\ASUS\Documents\APIP\.venv\Scripts\python.exe'
$env:APIP_SUPABASE_URL = 'https://kstxwoitiistmvivwixd.supabase.co'
$env:APIP_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oSiQq7ye49R5jfsUmZQz8g_ZutwLBq1'
$env:APIP_ACCOUNT_MODE = 'cloud'
$env:APIP_SHARING_ENABLED = '1'
$env:APIP_ADR_DATABASE_URL = [System.Environment]::GetEnvironmentVariable('APIP_ADR_DATABASE_URL', 'User')
$env:NODE_EXTRA_CA_CERTS = 'C:\Users\ASUS\Documents\APIP-Antigravity-Closure\supabase-prod-ca-2021.crt'
node dist/server.cjs
```
- Health Check: `GET http://127.0.0.1:3601/api/ready` -> returns `{"ready": true, "checks": {"database": true, "pdf": true, "auth": true}}`.

### Start Frontend Proxy (Port 3602)
```powershell
$env:APIP_CLOSURE_PORT = '3602'
$env:APIP_CLOSURE_BACKEND = 'http://127.0.0.1:3601'
node scripts/closure-preview.mjs
```
- Web Application URL: `http://127.0.0.1:3602/#/`
- Patient Sign-In: `http://127.0.0.1:3602/#/sign-in/patient`
- Specialist Sign-In: `http://127.0.0.1:3602/#/sign-in/specialist`
- ADR Guided Intake: `http://127.0.0.1:3602/#/preview/adr-report`

---

## 6. Required Verification Protocol for Any Change

Before submitting or handing off work, both Codex and Antigravity must execute and record:

1. **Frontend Typecheck**:
   ```bash
   npm run lint
   ```
   *Expected*: Zero errors (`tsc --noEmit`).

2. **Production Bundle Build**:
   ```bash
   npm run build
   ```
   *Expected*: Successful client build in `dist/` and server bundle `dist/server.cjs`.

3. **Pre-Commit Secret Leak Guard**:
   ```bash
   node scripts/git-workflow.test.mjs
   ```
   *Expected*: 11/11 tests pass.

4. **Hosted Database & PDF Verification**:
   ```bash
   npx tsx scripts/verify-hosted-phase3cb-workflow.ts
   ```
   *Expected*: 10/10 automated gates pass (`approvedSpecialist`, `revokedRemainsRevoked`, `directoryOptIn`, `patientCase`, `consentedSharing`, `specialistInboxReport`, `originalPdfPvPI`, `negativeAuthorization`, `newerRevisionPrivacy`, `consentWithdrawal`).

5. **Responsive M3 Web Layout & Header Pixel Regression**:
   ```bash
   node scripts/landing-v2.browser.mjs
   ```
   *Expected*: 12/12 combinations pass across 320px, 360px, 768px, 1024px, 1440px, and 1920px viewports (light & dark modes) with byte-for-byte identical header hashes.

---

## 7. Operating Rules for Continuous Agent Collaboration

1. **Always Fetch Origin First**:
   ```bash
   git fetch origin --prune
   ```
   Never assume a local branch or worktree is up to date. Verify HEAD SHA against `origin/codex/apip-landing-v2`.

2. **Work Sequentially on the Same Verified Lineage**:
   Do not spawn competing feature branches. Rebase or merge cleanly on top of `codex/apip-landing-v2`.

3. **Separate Database Automation from Browser Auth Acceptance**:
   - Automated database tests verify backend schema, RLS, cryptographic digests, and PDF generation (currently **10/10 PASS**).
   - Interactive browser sign-in requires confirmed owner credentials; do not enter automated sign-in retry loops if GoTrue returns `HTTP 400 invalid_credentials`.

4. **Update Documentation in the Same Commit**:
   Update `docs/history/YYYY-MM-DD.md`, `CHANGELOG.md`, and this handoff document with exact SHAs, test results, and next actions.

---

## 8. Specialist Profile Configuration & `SPECIALIST_SETUP_REQUIRED` Resolution

The `SPECIALIST_SETUP_REQUIRED` error (HTTP 503) occurs when the application queries `/api/account/capabilities` under the local SQLite backend:
- **Local Development Mode**: `server/local-account.ts` provides offline SQLite storage for patient accounts and drafts. It intentionally does not implement PostgreSQL specialist identity tables (`apip_identity` schema) and returns `503 { error: 'SPECIALIST_SETUP_REQUIRED' }`.
- **Cloud Hosted Mode**: When `APIP_ACCOUNT_MODE='cloud'` and `APIP_ADR_DATABASE_URL` are configured, `server/cloud-account.ts` activates `postgresSpecialistRepository`. This queries the hosted Supabase PostgreSQL database where the `apip_identity` schema is installed and operational.
- **Verification**: Querying specialist identity for approved subject `da312f4f-cbcf-400b-8a81-b0e13f7efc42` against hosted Supabase returns `applicationState: 'APPROVED'`, `authorizationVersion: '4'`, and `specialistWorkspace: true` with zero blockers.

---

## 9. Local vs Supabase-Hosted Authentication Architecture

| Dimension | Local Account Architecture | Supabase Cloud Architecture |
| :--- | :--- | :--- |
| **Storage Engine** | SQLite WAL file (`accounts.sqlite`) | Hosted PostgreSQL pooler (AWS ap-south-1) |
| **Authentication Service** | In-process PBKDF2/scrypt cookies (`apip.local.session`) | Supabase GoTrue PKCE (`localStorage: apip.cloud.auth`) |
| **Supported Workspaces** | Patient drafts, guided reporting | Patient cases, Specialist identity, Consented sharing |
| **Production Enforcement** | Strictly rejected in production (`NODE_ENV === 'production'`) | Standard production & hosted staging configuration |
| **Browser Acceptance Status** | Fully operational for local development | Automated database gates **10/10 PASS**; browser sign-in **BLOCKED** on manual credential alignment (GoTrue `400 invalid_credentials`). |

---

## 10. Integration Promotion Assessment for PR #16

- **Status**: **READY FOR OWNER-REVIEWED PROMOTION TO `main`**.
- **Mergeability**: Clean, conflict-free mergeable PR targeting `origin/main`.
- **Core Stability**: All 39 cumulative feature commits preserved in unbroken linear history.
- **Visual Stability**: Material Design 3 Web UI, protected header, and responsive viewports (320px–1920px) verified in real Chrome.
- **Security Stability**: Hardcoded credentials removed, password rotated, leak guard active (11/11 tests pass).
- **MedAssist Safety**: All MedAssist branches and worktrees 100% untouched.
- **Action**: Do not auto-merge; await explicit owner sign-off.

---

## 11. Material Design 3 Web Authentication Dialog & Private Developer Access

### Authentication Dialog Architecture (`APIPAuthDialog`)
- **Official Component**: Implemented using `@material/web` `<md-dialog>` with controlled React state, focus trapping, Escape dismissal, scrim dismissal, and accessible aria attributes.
- **Landscape Horizontal Layout**: Desktop viewports (>=768px) render a wide two-column grid (840px x 560px, width > height):
  - **Left Column (~38%)**: APIP Brand identity, contextual headline ("Welcome to APIP" / "Specialist Portal"), workspace description, Material Symbol icon (`person` / `clinical_notes`), and subtle "Research Prototype" badge.
  - **Right Column (~62%)**: Patient vs Specialist segmented role tabs (Developer removed), mode title and subtitle, credentials inputs with password visibility toggle, confirm password in reset mode, forgot-password link, specialist signup note, Google OAuth button (with accurate availability messaging), and primary submit button.
- **Responsive Layout**: Adapts gracefully to single-column layout on mobile viewports (<768px) with compact padding, vertical scrolling, and zero horizontal overflow across 320px, 360px, 768px, 1024px, 1440px viewports in both light and dark themes.
- **Route Compatibility**: Preserves all established authentication hash routes (`/#/sign-in/patient`, `/#/sign-in/specialist`, `/#/sign-up/patient`, `/#/sign-up/specialist`, `/#/forgot-password/patient`, `/#/forgot-password/specialist`, `/#/reset-password`). When visited directly, the dialog mounts above the underlying base page (`LandingBody`) with the requested role and mode. Dismissing the dialog restores browser focus and returns safely to base without reloads or infinite navigation loops.

### Public Developer UI Removal
- Removed "Developer" from the public Patient/Specialist selector tabs.
- Removed visible "Developer sign-in" links from `LandingFooter` and `PreviewFooter`.
- Removed mock developer email/password login forms and sample credential notices.

### Private Owner Developer Access & Authorization
- **Discreet Discovery**: Implemented `useDiscreetDeveloperAccess` (`src/features/access/discreetDeveloperAccess.ts`):
  1. **Multi-activation gesture**: Clicking the footer Brand element 5 times within 3 seconds navigates to `/#/developer-reference`.
  2. **Keyboard shortcut**: `Ctrl+Shift+D` (or `Cmd+Shift+D`) navigates to `/#/developer-reference` when focus is not inside an editable input element.
- **Real Authorization & Fail-Closed Security**: `DeveloperReference.tsx` enforces strict authorization boundaries:
  - **Local Development**: When `import.meta.env.DEV === true`, local development access to the component reference is permitted.
  - **Production Builds**: Queries `/api/account/capabilities` for the authenticated actor. If unauthenticated or lacking `identityAdministration: true`, access fails closed immediately: displays "Access Denied", shields all private components, and redirects to home.
- **Preserved Developer Workspace**: Completely preserved `CoreComponentsView`, `DomainComponentsView`, `DesignFoundationView`, and `MaterialNavTabs`. Updated the workspace Back action to return safely to `/` (not the deleted mock developer login).

### Test Evidence
- Automated Chrome acceptance suite (`scripts/verify-auth-dialog.browser.mjs`): 12/12 checks passed.
- Visual captures recorded in `preview-captures/auth-dialog/` across 320px, 360px, 768px, 1024px, and 1440px in light and dark themes.
- APIP header visual integrity verified 100% identical and unchanged across all viewports.

### Visual & Event Repair Update (2026-11-09)
- **Dialog Centering**: Repaired left-alignment root cause (omitted outer `margin: auto` overrode shadow `:host` margin default; `scrollbar-gutter: stable` introduced 7.5px scrollbar bias). Applied `margin: auto !important; position: fixed !important; inset: 0 !important;` and locked background scrolling (`html:has(md-dialog.apip-auth-dialog[open]) { overflow: hidden !important; scrollbar-gutter: auto !important; }`). Verified `diffX = 0px` and `diffY = 0px` across 1024px, 1440px, 1536px, and 1920px desktop viewports.
- **Soft Background Blur**: Injected `backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);` into `<md-dialog>` shadow DOM `.scrim`. Modal text remains 100% sharp; background landing page and header receive soft blur and translucent scrim.
- **Smooth Animations**: Configured `getOpenAnimation` (280ms, 0.97->1.0 scale, 10px->0px translateY) and `getCloseAnimation` (200ms, 1.0->0.97 scale, 0px->8px translateY) using Material 3 deceleration and acceleration curves. Tested exit duration in browser (364ms total transition). Supported `prefers-reduced-motion`.
- **Button & Form Event Fixes**:
  - Eliminated `disabled="false"` on `<md-icon-button class="apip-auth-close-button">` (changed to `disabled={busy || undefined}`), restoring pointer events.
  - Added `handleCloseRequest` to run `dialog.close()` before unmounting so exit animations complete cleanly.
  - Added `onKeyDown` form listener to capture composed Enter keydown events bubbling from shadow DOM inputs.
  - Attached explicit `onClick={(e) => void submit(e)}` on submit button and enabled `class` attribute reflection in `M3Button.tsx`.
  - Handled Continue with Google truthfully when OAuth is unconfigured on hosted Supabase.
- **Verification Evidence**: Automated Chrome suite `scripts/verify-auth-dialog-v2.browser.mjs` passed 12/12 checks. All visual artifacts saved in `preview-captures/auth-dialog/`.

### Protected Route Navigation & Event Forwarding Repair Update (2026-11-09)
- **Eliminated Blank "Checking your account..." Screen**:
  - Removed top-level unstyled return in `src/features/access/AccessPreview.tsx` that previously replaced the application shell and styling with raw `<p>` text on unauthenticated navigation.
  - Protected routes now gracefully maintain the application shell (`access-app`, `PreviewHeader`, `LandingBody`, `LandingFooter`) and open `APIPAuthDialog` (`open={isSignIn || (protectedRoute && !account.user)}`).
  - Updated "For patients" header link in `PreviewLayout.tsx` to route directly to `#/sign-in/patient` when unauthenticated, avoiding unneeded protected route transitions.
  - Wrapped `SpecialistWorkspace` loading fallback in a styled Material 3 container.
- **Enhanced Keyboard Handling**:
  - Supported `event.code === 'KeyD'` in `discreetDeveloperAccess.ts` and added shadow DOM inspection via `event.composedPath()` to prevent intercepting keystrokes while users type in text fields.
  - Added `'change'` event listener and `onKeyDown` prop forwarding in `M3TextField.tsx` for autofill and keyboard submission compatibility.
- **Port Consolidation**: Terminated orphaned dev process on port 3000; consolidated active verification on preview port 3602 (proxied to backend 3601).
- **Comprehensive Visual Review**: Verified and captured 22 responsive screenshots across Desktop, Tablet, and Mobile in Light and Dark modes. All screenshots preserved in `final-review/` artifact directory.
- **Verification Gates**: TypeScript (`npm run lint`), production build (`npm run build`), navigation unit tests (6/6 pass), and leak guard tests (11/11 pass) all confirmed clean PASS.
