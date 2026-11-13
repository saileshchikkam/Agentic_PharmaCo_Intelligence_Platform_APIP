# CI and same-window account-switch recovery — 2026-11-13

## Root causes

1. `specialist-hosted-permissions.test.ts` installed the identity foundation and subject-boundary repair but not the existing account-role migration. The new repository's role lookup therefore raised SQLSTATE 42P01, mapped to ACCOUNT_ROLE_SETUP_REQUIRED. The original managed Auth permission-denial test still runs before repair; the fix does not give the identity executor USAGE on managed Auth.
2. `specialist-postgres.test.ts` had the same missing table after its approved-state operation. The fixture now includes explicit SPECIALIST roles for applicants and the fixture administrator, independent of professional approval. The identity-table inventory correctly increases from six to seven.
3. `p0-isolation-security.test.ts` used the old schema, so its capabilities JSON was an error response without specialistWorkspace. It now asserts HTTP 200 and each actor's real PATIENT/SPECIALIST binding, plus patient denial on specialist/admin APIs. Once that was fixed, a stale revoked-actor expectation surfaced: the current early professional guard returns 403 before resource lookup, rather than the former 404. Withdrawal for an otherwise approved actor still expects 404.

All role setup is confined to disposable fixtures. `fixture-portal-roles.ts` runs the unchanged existing migration and explicit fixture-operator bindings for legacy synthetic subjects. It adds registration-metadata column support without widening managed Auth privileges. Runtime/browser roles cannot seed bindings. No hosted migrations were run.

## Vite warning

The failed GitHub log includes vite:dep-scan resolution work after the disposable fixture starts shutting down. The API-only sharing-upgrade test starts `specialist-fixture-runtime.ts`, which formerly launched a whole-app optimizer scan despite making no page requests. Its fixture-only optimizer now has no discovery/scan entries, avoiding that unnecessary startup/shutdown race. Application Vite configuration is unchanged. The full clean local run had no dep-scan/server-shutdown warning. This warning was separate from the three assertion failures, not an Auth delivery problem.

## Browser root cause and actual result

The former helper created a response-wait promise before clicking logout. If the click/navigation failed first, its later rejection could escape as unhandled. It also had indefinite retry and final keep-alive promises, and hash-only login transitions could race Material dialog state initialization. These are harness lifecycle defects; they do not prove an application defect.

The replacement has 20-second actions, 12-second API calls, a 10-minute private-login limit and a 15-minute overall limit. Response wait rejections are handled immediately, known-origin document navigation and Material animation completion precede credential entry, and finally always closes contexts/browser and clears retained credentials. There are no automatic retries or polling files. Tokens/passwords remain only in browser/worker memory and are never reported. Existing account sessions were initially checked in separate contexts; final acceptance used one context throughout.

Actual real hosted sequence: PASS Patient dashboard and server PATIENT role/subject → PASS provider logout and empty browser session → PASS same-context Specialist login with different verified subject and SPECIALIST server role → PASS specialist dashboard, patient-only route denial and pending review restriction → PASS provider logout/session cleanup → PASS same-context Patient return with original subject/role → PASS old owner ADR read and other account ADR 404 → PASS specialist/admin route and API denial → PASS reload and session persistence. No authentication application code needed changing. Browser worker exited successfully and cleaned up its own windows.

## Verification

- Three targeted files: four test cases passed, including the separate fail-closed pool fixture.
- Full existing unit/PostgreSQL suite: 65 passed, zero failed/skipped.
- Full PDF suite with configured original interpreter/template: 11 passed, zero failed/skipped.
- Frontend lint/TypeScript, targeted TypeScript for affected fixture tests/helpers, production build, helper syntax and secret scan passed. Existing large frontend chunk warning remains.
- An initial full local run failed one legacy test because this machine inherited incomplete cloud configuration. The CI-equivalent rerun removed cloud settings only in its test process and passed; running hosted services were not reconfigured.
- `http://127.0.0.1:3602/` returned 200; same-origin `/api/ready` returned ready=true with database, PDF and Auth true. Backend stays internal on 3601. Localhost is laptop-only, not a published preview.
- Push and PR workflows are deliberately unchanged. Their remote conclusions must be checked for the pushed commit, separately from local results.

No account registration, reset, role mutation, administrator bootstrap, professional approval, hosted SQL, MedAssist changes or unrelated ADR feature was performed. Google and administrator provisioning remain separate gates. GitHub failure emails concern these workflow runs, not Supabase email delivery.
