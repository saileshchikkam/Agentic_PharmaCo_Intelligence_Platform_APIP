# Hosted verification evidence — 2026-11-07

The private Supabase development rehearsal uses the existing Express API and restricted writer through the transaction pooler, with certificate and hostname verification. The local launcher supplies the independently downloaded Supabase Root 2021 CA through NODE_EXTRA_CA_CERTS. No credentials are recorded here.

## Executed hosted checks

- Readiness returned HTTP 200 with database, PDF and Auth all true.
- Two distinct confirmed synthetic users signed in through the real email/password provider. Both sessions restored after reload. Sign-out and subsequent unauthenticated API denial passed for the second account.
- Each user created a fictional case. Repeated concurrent create requests with the same idempotency key returned the same case.
- Duplicate answer commands returned the same revision. A conflicting reuse returned 409. Two concurrent edits against one revision produced one 200 and one 409.
- Revision history returned revisions 3, 2 and 1. Reload and owner retrieval preserved the case and revision.
- Both directions denied cross-account read, history, edit and PDF export with 404, and owner lists excluded the other case. DELETE returned 404 because no deletion route is implemented. This is not a deletion-policy test.
- The native original PvPI PDF exported from saved revisions 3 and 4 with matching revision headers. Independent pypdf parsing verified two pages, changed reaction values and empty checked reserved widgets. PDFium with form rendering enabled visibly rendered the revision 4 reaction in its designated area and preserved page 2 instructions.
- The actual owner workspace rendered the original first page in PDF.js. Final catalog counts were two cases across two owners, five immutable revision records and three export metadata records. These are fictional fixtures retained for resume checks.

The hosted sample confirmed a reaction narrative only. It does not establish comprehensive hosted checkbox, medication-row or overflow coverage.

## Supporting local checks

Thirteen focused Node tests passed, including disposable PostgreSQL wire/RLS/ownership/retry/conflict/outage fixtures with mocked identities, Auth gates, ADR intake and PDF runtime handling. Frontend and server TypeScript and the production build passed. The simulated Auth browser test passed. The isolated SQLite ADR browser test passed at 320, 360, 820 and 1440 pixels, including edit, resume and independent PDF download validation. These fixture results do not establish the equivalent hosted failure behavior.

## Remaining gates

Real access-token expiry, writer transaction identity cleanup after rollback and pooled connection reuse, managed database interruption/reconnect, application restart persistence, and comprehensive hosted report data remain untested. Google OAuth remains pending separately. NO-GO for the Backend Automation Mega Phase until the required hosted recovery and identity checks pass. PR 6 remains draft.

The first browser helper omitted the required account header. It was corrected outside the repository and rerun successfully. No application, schema or security-policy repair was required.
