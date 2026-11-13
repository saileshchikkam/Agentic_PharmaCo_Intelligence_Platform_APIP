# Phase 3B — Hosted administrator gate closure

Date: 2026-11-08. Baseline 85742d56317ea52f5639dab6e4a54128bc079932, branch codex/adr-phase3b-specialist-identity. Private fictional prototype only.

## Separately approved bootstrap

The owner privately selected an existing confirmed non-anonymous synthetic Auth subject in development project kstxwoitiistmvivwixd. Read-only verification found no specialist application, administrator grant or provisioning event. The owner separately approved this exact selected subject and reviewed operator procedure SHA-256 887e8414e1f48d61d3f98fe797d1a6ff83ec6a06e960b4eaa645ac5c1aed7361.

The existing database/operations/bootstrap-specialist-admin.sql ran once through the authorized database operator, not the runtime writer. Post-checks confirmed exactly one active specialist.identity.admin capability, exactly one matching immutable BOOTSTRAP event and no specialist application for the administrator. Approval reference: phase3b-owner-approved-bootstrap-2026-11-08. No migration, password change, patient privilege or specialist approval was bundled into bootstrap. The private UUID and credentials are excluded from Git and evidence.

## Actual real hosted browser results

Two separate Chrome contexts signed in through real Supabase Auth. The administrator subject was compared in memory against the exact private selection; the applicant was a different existing synthetic account with a submitted application.

- PASS: administrator opened the submitted professional profile, began verification, recorded synthetic evidence/reason and approved through the actual two-step Material Web dialog.
- PASS: applicant capabilities returned HTTP 200 with specialistWorkspace=true, patientCaseAccess=false and specialistPdfExport=false. Reload displayed APPROVED.
- PASS: administrator revoked through the actual console. With the same captured bearer retained in memory, the next applicant capability request returned HTTP 200 with specialistWorkspace=false. Reload displayed REVOKED. No JWT lifetime change or natural-expiry wait was used.
- PASS: the revoked applicant's administrator request returned HTTP 403.
- PASS: a new fictional patient draft was created by the applicant through the existing owner-scoped API. Administrator requests for that other owner's case and original-form PDF both returned HTTP 404. The administrator capability remained identity-only, with patientCaseAccess=false. Own-patient rights remain independent; this does not imply administrators cannot access their own reports.
- PASS: no specialist clinical operation or assignment was introduced. Phase 3B has no clinical specialist endpoint to exercise; immediate revocation was proved at the current authorization boundary, not misrepresented as testing a Phase 3C review endpoint.

[Machine-readable results](evidence/3b-admin/results.json), [approved state](evidence/3b-admin/approved.png), [revoked state](evidence/3b-admin/revoked.png). Email is masked in screenshots; professional details are fictional. Tokens stayed in worker memory and were never logged or written to evidence.

## Runtime, scope and evidence reuse

Port 3301 was initially no longer listening. The existing strict-TLS launcher was reopened and the user privately supplied its writer credentials. Readiness then returned HTTP 200 with database/PDF/Auth all true. No other preview was stopped or reconfigured. Hosted preview: http://127.0.0.1:3301/#/admin/specialist-applications (authorized administrator only) and #/specialist (applicant). These URLs are development-laptop-only.

The new optional scripts/specialist-admin-hosted.browser.mjs contains the focused two-session checks and no credentials. Existing bootstrap security, migration, SQL permission, JWT expiry, PDF and unchanged regression evidence was reused; no production application source changed. The new worker received JavaScript syntax validation.

## Assessment and next step

PASS: the remaining Phase 3B administrator bootstrap and real hosted identity approval/revocation gates are closed. The tested applicant is intentionally left REVOKED; the separately approved administrator remains active for identity administration only. No FAIL or BLOCKED result remains for this focused gate. Google OAuth remains separately pending and outside this task.

GO for the private Phase 3B identity milestone. Phase 3C still requires separate scope/access-policy approval and implementation authorization; none was started. The [complete copy-ready Phase 3C prompt](3c-next-implementation-prompt.md) remains the next-stage handoff. PRs 6, 7 and 8 stay draft and unmerged; no public deployment.
