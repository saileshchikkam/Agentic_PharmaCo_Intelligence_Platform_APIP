# Account and shared-profile foundation

## Current local connection

**Connected 2026-10-18:** development now uses persistent SQLite and same-origin cookie authentication when Supabase configuration is empty. See the [local setup, API and verification guide](local-development.md). Signup, login, profile save/reload/edit/delete and logout run without Docker or cloud services. The database lives outside the repository. Google and email verification/recovery remain unconfigured. Existing fictional ADR drafts remain browser-local and are not account-isolated.

## Supabase foundation status (hosted path deferred)

The client implements configuration-gated email/password signup and sign-in, Google OAuth through Supabase, tab-scoped sessions, sign-out, and an editable account health profile. No configured service means no signup, profile upload, or save. On 2026-10-18 the user chose to keep database setup local after a zero-monthly-cost cloud quote. No project, paid resource, Google client, or hosted table was created. Live provider login and durable account persistence remain unverified.

[account-schema.sql](account-schema.sql) is a fresh-project bootstrap, not an applied migration. Its ownership rules were executed and tested with local PGlite PostgreSQL using test equivalents of Supabase's `auth.uid()` and roles. This tests SQL enforcement, not a hosted authentication integration or production privacy certification.

## Connect a development database

**Current selection: local SQLite authentication and profile storage.** The earlier schema tests still run in local in-memory PostgreSQL for the future hosted path; they are not a running Supabase Auth/Data API service. Docker and the Supabase CLI were not available on the inspected command path. A local Supabase runtime would still need installation/configuration before selecting the Supabase adapter; it is no longer needed for the current SQLite path. This task does not install Docker or download its container stack. The hosted instructions below are retained for a future explicit connection decision; do not provision automatically.

1. Create or select a Supabase development project on the Free plan. Verify the account's actual plan and limits before provisioning; do not enable billing or paid add-ons. Free hosting is capacity-limited, not a guarantee of indefinite public operation.
2. Review and run the bootstrap once in the project's SQL Editor. Do not run it over existing tables. Future deployed changes need tracked migrations and review.
3. Copy the project URL and **publishable** `sb_publishable_…` key into `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in local `.env`. Never put secret/service-role keys or Google client secrets in browser configuration, chat, or Git. The browser intentionally accepts only publishable keys.
4. Enable email/password auth with email confirmation and configure password policy to require at least 12 characters. The UI enforces that length only for new passwords; enforce policy at the service too. Configure development Site URL and redirect allowlist for `http://localhost:3000/`; use the exact deployed HTTPS origin later. Supabase's limited default email service is for development; verify delivery restrictions and rate limits before inviting testers.
5. For Google, create a Google OAuth web client, add the exact callback URL shown in Supabase, and enable the Google provider with credentials stored in the provider dashboard. The app requests normal identity scopes only, not medical records. Google may require consent-screen/test-user setup. Use the official [Google integration instructions](https://supabase.com/docs/guides/auth/social-login/auth-google).
6. Restart Vite, open `#/sign-in/patient`, create a fictional test account, verify its email, and finish `#/account/profile`. OAuth uses PKCE; the redirect returns to the profile on the same browser tab. Profile continuation remembers only the selected APIP task in session storage, never health answers.
7. Before real data, run hosted advisors and repeat two-account isolation checks with actual signed-in clients: owner create/reload/edit/delete; other account cannot select/update/delete/impersonate; anonymous access denied; stale revisions cannot overwrite. Also test OAuth cancellation, email verification, refresh/expiry, sign-out and network failure. These hosted checks are **not completed** yet.

## Data contract

One login owns one care-recipient profile in this version. A parent/caregiver can manage a child's profile; separate family/dependent profiles and verified guardian authority are future work. All-age product intent does not establish all-age clinical model coverage.

- Required: care recipient's name, date of birth and self/caregiver relationship. Age is calculated at use time, including infants (age 0). Under-18 profiles require caregiver mode in both UI validation and SQL.
- Optional: conditions, surgeries, current medicines, allergies and additional history (2,000 characters each). Empty UI answers become SQL null, not a claim of no conditions.
- Sharing: `share_medassist` and `share_adr` default false and can be changed independently. Stored profile details remain user statements. User confirmation precedes saving; no AI edits or diagnosis extraction are implemented here.
- Versioning: server-assigned revision and update time; edits/deletes match the fetched revision to avoid silent concurrent overwrites. Network failures leave the edit form available.
- Deletion: owner can delete the profile after confirmation. This keeps the authentication account. Account deletion, backups/retention erasure and data export need separate implementation.

Both task previews can show an expandable, consent-enabled profile-context panel. Context excludes name, birth date and account ID, and includes calculated age, history and source revision. The previews **do not automatically prefill reports or send profiles to models**. Existing ADR drafts remain shared browser-local fictional drafts, separate from account profiles, even after sign-in. Do not describe them as protected account records.

## Supabase access and session boundaries

Postgres RLS checks authenticated `auth.uid() = user_id` on every operation. Anonymous users receive no table privileges. Column grants prevent changing ownership or system revision/time. No user-editable metadata grants specialist/developer roles; those screens remain unrestricted design previews.

In the optional Supabase adapter, Supabase handles passwords, verification and OAuth. Sessions/PKCE state use this tab's `sessionStorage`; health profiles are held in React memory and Supabase, not copied to local/browser storage by this subsystem. Session storage remains readable by same-origin scripts: XSS protection, deployment headers, dependency review and suitable session policies still matter. Sign-out clears the account/profile state; SDK token refresh does not intentionally reset profile edits. History is not logged by this feature or placed in URLs. Administrators and infrastructure operators can have privileged access: no promise of absolute invisibility or end-to-end encryption is made.

Use fictional records while hosting/data permissions, child/guardian handling, retention/backups, incident response, password recovery UX, account deletion and real-patient readiness remain unresolved. No medical AI analysis, model training or clinical triage is added by this foundation.

## Local checks

```sh
node --import tsx --test scripts/account-profile.test.ts scripts/medassist.test.ts scripts/preview-navigation.test.mjs
bun run lint
bun run build
```

The SQL test uses in-memory PGlite and fictional records, then closes the database. It checks owner CRUD, anonymous/cross-account denial, owner/revision tampering, optimistic conflicts, and child constraints. It does not sign into Google or a hosted Supabase project.

Implementation: [account UI/client](../src/features/account), [profile contract](../src/features/account/profile.ts), [SQL checks](../scripts/account-profile.test.ts). Sources: [React Auth](https://supabase.com/docs/guides/auth/quickstarts/react), [signup](https://supabase.com/docs/reference/javascript/auth-signup), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
