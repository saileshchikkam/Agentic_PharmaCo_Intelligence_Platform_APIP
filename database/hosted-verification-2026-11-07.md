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
## Reliability and comprehensive PDF follow-up — 2026-11-07

### Executed against managed PostgreSQL

A separate strict-TLS client authenticated as apip_adr_writer with max 1 client connection and named prepared statements disabled. The current subject was empty before the checks and after every commit and deliberately thrown rollback. Twelve alternating-owner transactions returned no rows belonging to the other owner. An attempted direct case insert failed with PostgreSQL 42501. Closing the test client and opening a fresh client reconnected successfully with no residual subject. Supavisor may choose different backend connections between transactions; this checks observable isolation through the pooler, without claiming a pinned database backend.

### Hosted comprehensive form and refresh checks

A new fictional case populated patient details, reaction dates and management, history/investigations, seriousness and outcome, reporter details, four suspected medicine rows and three concomitant rows. Revision 98 exported three pages. The additional page contained four manufacturer values that exceeded their narrow single-line cells, with linked A1-A4 references; it did not duplicate the case.

Revision 115 added suspected medicine 5, concomitant medicine 4 and a long reaction narrative. Its four-page PDF retained the final narrative marker, all extra medicine details and the original instruction page. Revision 116 changed the reporter name and regenerated the four-page PDF with the updated value.

Independent pypdf assertions verified 147 native fields, all seven original medication name rows, dates in dd/mm/yyyy, selected checkbox values and appearance states, checked reserved professional widgets empty, exact instruction-page content and saved revision consistency. PDFium with form rendering enabled rendered every page. Page 1 and continuation pages were visually inspected for fitting text and retained excess content. The hosted PDF.js preview passed at 320, 360, 820 and 1440 pixels without horizontal overflow. Four existing native PDF regression groups passed. No application code changed, so unchanged TypeScript/build suites were not repeated in this follow-up.

A real refresh-token request returned HTTP 200. At that point the original access token still had 3446 seconds until expiration. Natural expiration, unavailable-refresh denial and use of a captured token after revocation were not verified. A helper immediately checking local storage after clicking sign-out raced the asynchronous operation and was inconclusive; it is not evidence of an application defect. The prior completed sign-out and unauthenticated API test remains recorded above.

### Remaining reliability gates

Client close/reconnect passed. No managed database interruption was performed. Application process restart with the existing private runtime credentials and restore was not exercised. Real token expiry, captured-token revocation and unavailable-refresh tests still require a live synthetic session held through its configured expiry. Google OAuth remains separately pending. The Backend Automation milestone remains NO-GO pending these evidence gaps. No RLS, Auth settings, database schema, clinical behavior or application functionality was modified.

## Interrupted transaction crash repair — 2026-11-07

The initial custom-socket interruption helper and the subsequent transparent local proxy both exposed an uncaught Postgres.js 3.4.9 exception in nextWrite: socket was null when rollback attempted a write after connection loss. This was not a credential failure. A disposable PGlite TCP/proxy reproduction crashed with 3.4.9 and passed with the official 4.1.0 release. Upstream reports the same transaction-close failure in issue 1248.

Pinned postgres to 4.1.0 in package.json and bun.lock. Added scripts/adr-connection-loss.test.ts, which uses a child process to make an uncaught driver crash fail the test and verifies reconnection with cleared transaction context. No dependency source patches or security bypasses were added. The v4 parameter inference change was reviewed; the ADR repository uses strings and explicit casts. CommonJS startup is checked on Node 24; upstream requires Node 20.19 or 22.12 and later for require interoperability.

Passed five focused tests including connection loss, PostgreSQL wire behavior with native PDF reopening, migrations/RLS and Auth gates. Frontend and server TypeScript and production build passed. The first compatibility run omitted the existing PDF interpreter environment and failed its PDF assertion; the configured rerun passed. Vite retains its existing bundle-size warning. Local launch helpers were adjusted for the official driver's default module export. Hosted interruption/restart and natural expiry results are still pending; the existing servers remained available during the local repair.

References: [upstream disconnect issue](https://github.com/porsager/postgres/issues/1248), [v4 migration notes](https://github.com/porsager/postgres/releases/tag/v4.0.0), [4.1.0 release](https://github.com/porsager/postgres/releases/tag/v4.1.0).
