# Authentication and hosted sharing closure — 2026-11-09

## Current result

**Authentication PARTIAL. Google OAuth BLOCKED. Real hosted sharing BLOCKED. Phase 3C-C NO-GO.** Visual, unit and disposable integration results below do not establish real Google login, email delivery or completed hosted sharing.

Baseline: draft PR #12, `antigravity/apip-auth-3cb-final-gate`, `d49d2f8eb83b90568cfcd23e192df4778128bfa8`. Continuation branch: `codex/apip-auth-3cb-final-closure`, in a separate linked worktree. The original dirty Codex checkout and Antigravity worktrees are preserved; no reset, stash, branch switch, commit or overwrite was performed in those checkouts during this continuation.

## Implemented corrections

- Authentication card maximum width is 552px. An authentication-only override removes the inherited 84px Back rail that squeezed mobile content. Back aligns with the centered card; other page layouts and the glass header remain unchanged.
- Workspace selectors expose pressed state and stable accessible names. Local SVG icons avoid dependence on remotely downloaded icon fonts. The Google action uses the existing official Material Web outlined button and icon slot. Semantic segmented controls follow Material color/state roles where the wrapper lacks an official component.
- Comfortable interaction targets, focus outlines, theme surface roles and reduced motion are preserved. The duplicate footer rule is removed. Production developer navigation and its sign-in route are development-gated; authorized development access remains.
- Route props synchronize sign-in/sign-up/recovery mode, including browser Back/Forward. Workspace changes clear entered credentials. Forgot-password uses a reloadable route. A synchronous guard prevents duplicate concurrent submissions.
- Signup retains its intended continuation before confirmation. Password visibility remains accessible. The retired twelve-character rule is absent; existing eight-character new-password UI and provider requirements remain.
- A demonstrated local restoration defect called nonexistent `/api/account/user`; it now uses the existing `/api/account/session` contract.
- Simulated PKCE checks exposed lost task destinations and cancellation routed away from the error screen. A known-route allowlist rejects external returns; callbacks return through sign-in so errors remain visible and the saved task is consumed after authentication. Recovery callbacks retain their dedicated route.
- Local recovery no-ops reject instead of implying a password changed. Hosted password updates continue through Supabase.

Existing Supabase Auth, server JWT verification, patient ownership, professional approval, PDF mapping and MedAssist are reused. No alternative identity database or professional privilege is created by a workspace selector.

## Actual runtime

Private frontend: `http://127.0.0.1:3602/#/sign-in/patient`.

- Specialist sign-in: `#/sign-in/specialist`.
- Recovery: `#/forgot-password/patient`.
- Patient cases: `#/patient/adr/cases`.
- Specialist assigned inbox: `#/specialist/reviews`.

The [local verification adapter](../../../scripts/closure-preview.mjs) serves this checkout's production `dist` and proxies `/api` to the existing hosted application at `http://127.0.0.1:3601`. This is a new frontend with the existing backend, not evidence that a new restricted-writer connection was provisioned. Both are laptop-only. The adapter binds loopback, validates Host/backend configuration, forwards existing authentication and stores no credentials. Keep the 3601 backend running. After a build using approved publishable settings, run `node scripts/closure-preview.mjs`. No server secret belongs in VITE variables.

## Hosted database checkpoint

The separately approved sharing SQL was applied earlier as hosted migration `20261108134740`; its single ledger statement SHA-256 is `e6b5247b5e8519b5344429fa50695fc419cc137a1c7c3e0af9088089489cbb63`. It was not reapplied during this continuation.

That hosted verification recorded four RLS sharing tables, a NOLOGIN/NOBYPASSRLS executor, no PUBLIC EXECUTE, writer RPC access and no writer direct-table privileges. Existing patient/identity policy digest and counts remained unchanged at installation: 8 cases and 160 revisions. Later authorized fictional tests may add records. Earlier migrations and administrator bootstrap remain untouched.

Security advisors reported the existing identity-provisioning table's deny-by-default RLS/no-policy INFO and disabled leaked-password-protection WARN. No provider setting or policy was silently changed. See [RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Executed evidence and remaining gates

- **PASS — real applicant session and persistence:** the owner-entered, separately selected synthetic account opened its professional profile, saved fictional details and submitted the application. Hosted read-only metadata confirmed SUBMITTED, version 2, confirmed email and no administrator capability. Direct review-inbox navigation returned to onboarding without exposing reports. Patient login was not repeated.
- **APPROVED, NOT YET EXECUTED — exact professional capability:** the owner separately approved this exact applicant for a thirty-day fictional Pharmacovigilance Associate capability. The operation must use the existing dedicated administrator and audited decision API. The last hosted check still showed SUBMITTED, zero decisions and no validity date. The administrator worker had not reached its review heading. No SQL grant or repeated bootstrap was attempted.
- **PASS — affected tests:** twelve Node/disposable PostgreSQL/Auth/security/ADR/PDF tests passed. Strict frontend and server/fixture TypeScript and production build were executed. The focused simulated-provider Chrome suite passed PKCE/cancellation, email login, restoration, refresh failure and cross-tab changes. Mocked-provider results are not real Google verification.
- **PASS — disposable reporting UI:** consent, assignment, exact original PDF and withdrawal denial passed at 320/360/820/1440px after restoration was repaired; generated PDFs independently reopened with expected fictional values. The two expected post-withdrawal 404s appear in browser console output. A fixture-only disconnected-request parser warning was repaired by stopping middleware after abortion; its affected 1440px check passed.
- **PASS — production visual checks:** actual Chrome at 320/360/820/1024/1440/1920px, 552px desktop card, responsive width, keyboard password visibility, pressed workspace state, route history/recovery reload, dark theme, no horizontal scrolling and no production developer link. These checks type fictional text; they do not establish valid-account login.
- **BLOCKED — remaining hosted acceptance:** exact administrator execution, eligible directory opt-in, real patient consent/assigned revision/PDF/withdrawal sequence, real Google login and a complete recovery-inbox/password-replacement journey. Last provider settings check returned HTTP 200: email enabled, Google and phone disabled. Readiness alone is not acceptance.

Screenshots: [before desktop](evidence/auth-closure/before-desktop.png), [after desktop](evidence/auth-closure/signin-1440.png), [320px](evidence/auth-closure/signin-320.png), [360px](evidence/auth-closure/signin-360.png), [820px](evidence/auth-closure/signin-820.png), [1024px](evidence/auth-closure/signin-1024.png), [1920px](evidence/auth-closure/signin-1920.png), [dark](evidence/auth-closure/dark-1440.png), [measurements](evidence/auth-closure/layout-results.json). Only anonymous fictional-input evidence is suitable for publication; private candidate files and browser storage must never be committed.

## Required private setup

Google provider enablement is owner-approved, but configuration and real browser consent remain separate. Google's exact provider redirect is `https://kstxwoitiistmvivwixd.supabase.co/auth/v1/callback`. Supabase's application allowlist separately needs `http://127.0.0.1:3602/?apip_auth=1` and recovery return `http://127.0.0.1:3602/?apip_auth=1&type=recovery`. Use the approved testing audience; no wildcard redirects. Follow [official Google instructions](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) and [password recovery](https://supabase.com/docs/guides/auth/passwords). Passwords, secrets, tokens and recovery links stay out of chat and Git. The owner enters and submits new recovery passwords privately.

The exact applicant approval is recorded separately. Verify the existing administrator identity and the selected applicant before acting. The previously revoked applicant stays revoked. Administrator identity alone must not expose clinical reports. No completed real sharing result is claimed until the real workflow passes.

## Educational walkthrough

- `src/features/account/AccountSignIn.tsx`: route-mode synchronization, credential clearing, accessible selectors/password visibility, official Google button, continuation and duplicate-submission guard.
- `src/features/account/account.css`: auth-only dimensions, Back-rail correction and Material token/focus/touch/theme rules.
- `src/features/access/AccessPreview.tsx`: production developer-route/navigation gating; patient and specialist routes preserved.
- `src/features/account/authCallback.ts`: explicit known-route return validation and recovery callback parsing.
- `src/features/account/client.ts`: existing SDK/session implementation, corrected local session endpoint, safe task/cancellation return handling and honest local recovery failure.
- `scripts/closure-preview.mjs`: loopback frontend adapter to the unchanged hosted API; no credentials, role grants or fallback database.
- `scripts/auth-sharing-hosted.browser.mjs`: six-width UI phase followed by manual real sessions and an exact-account approval stop before consent/PDF/withdrawal checks. Bearer headers stay in memory.
- `scripts/approve-selected-hosted.browser.mjs`: separately approved subject fingerprint, existing administrator identity comparison, audited versioned decisions and thirty-day expiry checks. It neither bootstraps an administrator nor uses SQL to grant capabilities.
- `scripts/cloud-auth.test.ts` and `scripts/cloud-auth.browser.mjs`: recovery/redirect/cancellation and simulated-provider regression contracts.
- Existing reporting/specialist browser scripts: compatible Email selectors and bounded failure diagnostics. `specialist-fixture-runtime.ts` avoids parsing a request already aborted during navigation; authorization is unchanged.

## Safe continuation prompt

**Latest concrete blocker:** the administrator test stopped and its native Chrome window was no longer present. Read-only hosted verification still showed SUBMITTED, version 2, no validity date and zero decisions. One confirmed active administrator still exists. The exact thirty-day applicant approval remains recorded but unexecuted. No administrator was created and the revoked applicant was not restored. Resume through a usable session for the existing administrator; do not substitute privileged SQL or repeatedly request patient/applicant login. Google and real recovery remain separately unverified.

Continue this isolated branch and current patient/applicant sessions. Finish only the approved exact applicant's audited administrator decision after verifying the existing administrator. Do not grant another identity, restore the revoked applicant, reapply migrations or repeat patient login. Refresh capabilities, explicitly opt into the directory and verify real patient consent to a saved revision, assigned inbox/count, exact original PDF, later-revision privacy and withdrawal followed by denied report/PDF requests. Separately finish privately configured Google OAuth and approved-inbox recovery; distinguish real evidence from mocks. Update the factual report and draft PR. Do not merge, deploy, alter MedAssist or begin Phase 3C-C. Prepare its implementation prompt only after both required milestones pass and the owner authorizes that next scope.
