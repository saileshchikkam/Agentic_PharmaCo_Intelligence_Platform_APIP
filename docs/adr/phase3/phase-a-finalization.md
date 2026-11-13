# Phase A — finalization and specialist sharing

Status: **PARTIAL implementation, not a finalization/forwarding release.** No new hosted SQL, privilege or lifecycle transition has been applied.

## Official form specification

Source: [IPC original PvPI version 1.4 and its page-two instructions](https://www.ipc.gov.in/images/ADR_Reporting_Form_1.4_Version.pdf), inspected 2026-11-13. The mandatory-field list identifies initials, age at reaction onset, reaction terms, onset date, suspected medications and reporter information. APIP's prototype contact rule below is an application policy, not a quoted additional IPC requirement. This is not official regulatory submission.

- 1 Patient initials: patient source; required for finalization. Do not infer initials from a full name or overwrite stored answers.
- 2 Age or DOB: patient source; at least one valid answer required. Age refers to event onset.
- 3 Gender and 4 Weight: patient source; optional Unknown permitted.
- 5 Reaction onset: required valid date; 6 Stop: optional/Unknown for ongoing events.
- 7 Reaction description/management: description required, management optional patient narrative. Professional conclusions remain distinct.
- 8 Suspected medicines: at least one confirmed name required. Other medicine details may be Unknown; causality column is professional-only and remains blank for patient export.
- 9 Action after reaction and 10 Reintroduction: patient-reported facts only, optional Unknown; no invented rechallenge or recommendations.
- 11 Concomitant medicines: optional confirmed patient history.
- 12 Investigations and 13 History: optional patient information, not automatically verified clinical evidence.
- 14 Seriousness and 15 Outcome: retain existing patient selections/Unknown semantics; these are not professional adjudication.
- 16 Reporter: confirmed name plus one usable email, phone or address is the current conservative APIP readiness rule. No unrelated account profile is silently substituted. Professional credentials/signature remain reserved for authorized personnel.
- 17 Report date: existing date mapping, not a substitute for onset date.
- AMC/NCC report, registration, worldwide identifiers, receiving-personnel and official signature fields remain reserved. Never fabricate values.

Only confirmed patient fields in an exact saved revision may later be consented; extraction proposals and future edits remain private. Professional notes and assessments must remain separate. The existing direct/pool policies remain unchanged in this foundation.

## Implemented foundation

`patientCompleteness` is a shared deterministic validator returning ready, revision, completedRequired, missingRequired, invalidValues and optionalUnknownFields. Corrections carry questionnaire keys and zero-based stages. It handles age/DOB alternatives, named suspect medicine, required Unknown denial, optional Unknown allowance, ongoing reactions, date order and basic initials/contact constraints. The initials syntax is a prototype heuristic and is not proof of patient identity. No stored data is normalized or overwritten.

GET `/api/account/adr-guided/:id/completeness` uses the verified principal and existing owner-scoped repository to inspect the authoritative latest snapshot. A completion panel beneath the existing layout fetches this result, rejects a mismatched revision, shows required corrections and uses existing edit navigation. Finalize remains disabled with an explicit implementation/setup explanation. This does not lock, finalize or share anything.

Five focused readiness/Auth tests, frontend TypeScript and production build passed. These are local tests, not hosted finalization/browser acceptance. The active backend has not been restarted or hosted route-verified for the added endpoint. Preview/API use of the new readiness route therefore remains unverified.

## Remaining required implementation — not an owner-approval request yet

No migration file/checksum is ready for application. Next implement and security-test an additive immutable finalization record linked by owner/case/revision, actor/time, transactionally atomic audit/idempotency records, and a database-enforced mutation guard. Do not disable the guard through existing command functions or allow commands to create new draft revisions after finalization. Lock the case consistently for finalization, edits and consent to handle races.

Implement repository/API finalization with latest-revision revalidation, explicit confirmation, conflicts and retry receipts. Add filtered draft/finalized lists and read-only editing behavior without breaking historical PDFs. New corrections require an explicit linked addendum design rather than overwriting originals. Reconcile existing direct/pool operations so **only finalized exact revisions** can enter new sharing requests; preserve withdrawals and recipient approval/revocation on each access. Do not represent pre-existing shares as newly consented finalizations or silently backfill them.

Test realistic non-superuser roles, RLS and EXECUTE grants, audit rollback, race/idempotency, cross-owner denial and populated upgrades in disposable PostgreSQL. Prepare exact SQL checksum, deployment ordering, recovery and rollback review, then request separate owner approval for the development project. Only afterward may hosted SQL be applied. Full Patient/Specialist fixtures and real 1440/375 browser checks, actual preview/download equivalence and CI remain required. No live forwarding PASS or Phase A completion is claimed.
