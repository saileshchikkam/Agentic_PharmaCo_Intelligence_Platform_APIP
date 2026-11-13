# Fresh account authentication verification — 2026-11-13

The owner authorized fresh nonprivileged registration after the approved development reset. The two existing synthetic accounts were reused for this verification; no reset, registration, migration or role changes were repeated during recovery.

## Actual hosted evidence

Development project: `kstxwoitiistmvivwixd`. Public Auth settings returned email authentication enabled and `mailer_autoconfirm=true` after the owner disabled confirmation privately. Exactly one PATIENT and one SPECIALIST binding were previously verified. No Management API token was requested again.

Real isolated Chrome contexts against the unified port 3602 site verified:

- PASS: existing Patient and Specialist password login, authenticated capabilities HTTP 200 with the correct permanent role, and session restoration after reload.
- PASS: Patient dashboard/navigation and denial of specialist application/admin APIs; specialist redirect away from the patient dashboard.
- PASS: fictional specialist profile save/submission, SUBMITTED state, redesigned three-card dashboard, and restricted patient-review action. No professional approval was granted.
- PASS: wrong-portal password login denial in both directions with partial-session cleanup.
- PASS: completed logout and correct re-login for each account; their previously saved ADR revision remained readable afterward.
- PASS: fictional owner ADR creation/update, reload persistence and cross-owner GET denial (404) in both directions.
- PASS: Patient and Specialist screenshots at 1440px and 375px; three desktop specialist cards, mobile stacking, no horizontal overflow. Screenshot inspection confirmed pending status and disabled review action.
- PASS (bounded follow-up): Patient to completed logout to Specialist to completed logout to Patient in one browser context. Verified actual subjects, permanent server roles, logout cleanup, protected route denial, own saved ADR, foreign ADR 404 and final reload. The earlier crash was a harness failure; no application switching defect was reproduced. See [recovery evidence](2026-11-13-ci-switch-recovery.md).

Local-only screenshots and sanitized result JSON remain in the private verification output, not Git. No tokens, passwords, email addresses or Auth subjects are included in this report.

## Findings and fixes

The earlier reload failure was not reproduced: real capability responses were HTTP 200 and both sessions survived reload. The historical failing worker did not retain enough diagnostics to prove its original cause. The replacement waits on the actual capability response before asserting the role/dashboard, rather than a premature state snapshot.

A genuine authorization-order issue was found: a submitted but unapproved Specialist could receive a disabled-service 503 on the inbox route. The shared protected-route guard now checks current professional capability as well as permanent SPECIALIST role before reaching sharing/review services. The real pending applicant now receives 403 FORBIDDEN. Fixture checks also deny an identity administrator without professional authorization. Ownership and database policies were not widened.

A stale list assertion was corrected: an ADR created through an independent API request requires reloading the already-open report list before expecting its card. Dialog checks now wait for Material opening animations and use a known-origin document navigation between portal attempts. The helper also attaches rejection handling immediately to response waits; the bounded replacement subsequently passed against the existing two accounts.

An intermittent specialist-current 503 disappeared after the controlled backend restart; the same writer's read-only operation and subsequent hosted application calls passed. Its original underlying error was not captured. Bounded repository diagnostics now log only operation, SQLSTATE, error type and a connection-failure boolean, never the raw error message or identity.

## Checks and preview

Seven focused authentication/API/diagnostic tests passed. The role-binding PostgreSQL fixture passed registration binding, immutable assignment, metadata-change resistance, owner RLS, transaction cleanup and browser/runtime mutation denial. Frontend TypeScript (`npm run lint`), targeted server TypeScript, production build, helper syntax and diff checks passed. Build retains the existing large-chunk warning. Unchanged PDF fidelity and natural JWT-expiry suites were not repeated.

The existing unified site returned HTTP 200 at `http://127.0.0.1:3602/`; `/api/ready` returned ready=true with database, PDF and Auth true. Backend remains internal on 3601 with verified TLS. This is laptop-only localhost, not a shared/public deployment. Browser login/dashboard checks used this real origin, not fixtures. Google provider verification remains separate and pending.

## Independent administrator bootstrap — still approval-gated

No administrator was recreated. Select a dedicated confirmed synthetic identity with a compatible SPECIALIST portal binding and no specialist application; neither the ordinary Patient nor the submitted applicant should be repurposed.

Reviewed operator SQL: `database/operations/bootstrap-specialist-admin.sql`, SHA-256 `8b371734e24b0dcfcac481c6fa2b9ca716c31bf164d1537abababc1abe9138ac`. Privately verify the exact candidate subject, confirmation, absence of an application and existing capability, then request separate approval binding that subject, file checksum and development target. Only the approved operator may execute the atomic identity-administration grant and provisioning audit. The restricted runtime writer cannot bootstrap. This grants neither professional approval nor patient-record access. No exact candidate has been selected or authorized in this fresh dataset.

The same-context switch gate is now closed by the bounded follow-up. Administrator bootstrap and Google remain independently gated. No further ADR feature is authorized by this report.
