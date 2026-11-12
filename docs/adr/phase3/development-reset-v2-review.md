# Development reset V2 — exact retry review

Target remains development project `kstxwoitiistmvivwixd`. All account UUIDs, record counts, backup requirements, Auth API operations and recovery limitations remain those in the [original review](development-reset-review.md).

## Original attempt

The approved original application file (SHA-256 236c4fd7e3e898e2bad9d3114b44399b111d9ab5e6b8d9725019607f510f8cf3) failed before commit with PostgreSQL **55006**, because it attempted to re-enable the revisions trigger while deferred constraint events were still pending. The transaction rolled back. All 521 application rows retained their original counts/digests. Ten Auth identities and thirteen obsolete flows remain. Roles, memberships, schemas, table permissions/RLS, policies, functions, triggers and all three migration-ledger fingerprints matched the saved pre-attempt baseline. No flow cleanup or Auth deletion ran.

The waiting Auth worker was cancelled. No secret values were persisted; credential entry will be needed again before an approved retry.

## Exact correction

[development-data-reset-v2.sql](../../../database/operations/development-data-reset-v2.sql), SHA-256 **dbe7c13afaf8addcbe1cb326bdca8625cabe46db93f8a019bafd290d72c23609**.

Only ordering changes: `SET CONSTRAINTS ALL IMMEDIATE` moves before the eight immutable user triggers are re-enabled, so pending FK events are drained before ALTER TABLE. It remains inside the same bounded transaction. No constraint, RLS, grant or ownership is disabled or broadened. Record/UUID/digest guards and trigger-state verification are unchanged. The original file remains for audit; it must not be retried.

The separately approved flow cleanup is unchanged: `development-auth-flow-reset.sql`, SHA-256 **97e49d760e10911a0c57ff6d2718884de20406236276877c6ec6b2c999f2aec7**. No new deletion scope or privileged identity is proposed.

## Executed verification

- A focused PGlite test runs under a table-owning **non-superuser, NO BYPASSRLS** role. It reproduces the original 55006 error, verifies rollback, executes the corrected ordering, rolls back and verifies immutable protection still denies ordinary DELETE: PASS.
- The exact V2 statements were parameterized with the privately verified UUID set and executed **only on the existing disposable restored PostgreSQL instance**, under `SET LOCAL ROLE postgres`, with final `COMMIT` changed to `ROLLBACK`: PASS.
- All **53 source-restored tables** matched their archived counts and row digests both before and after that rehearsal: PASS. No hosted connection was made by the rehearsal.
- Local rehearsal record timestamp: 2026-11-12T17:09:50.559Z (22:39:50 IST). No new source backup/export was necessary; both encrypted copies remain intact.

## Approval gate

The original owner approval was checksum-specific. Applying V2 to the hosted project therefore requires separate approval of its new checksum, while retaining the exact previously approved reset scope and unchanged flow-file approval. Before retrying, revalidate the two backup copies, recovery passphrase, Auth Admin authorization, ten UUIDs, record digests and maintenance state. If any prerequisite fails, stop before deletion. SQL and Auth API phases are not globally atomic; report any later partial failure immediately.

Pending approval. No hosted records were deleted. Fresh account registration and administrator bootstrap remain paused.
