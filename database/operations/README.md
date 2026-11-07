# Controlled identity administration operations

The [Phase 3B migration](../../supabase/migrations/20261107195900_specialist_identity_foundation.sql) creates no administrator. Its approved application to the development project is separate from administrator bootstrap authorization.

`bootstrap-specialist-admin.sql` is an out-of-band, one-time operator procedure. It is not an HTTP endpoint, startup migration or browser function. Do not run it with the restricted application writer.

Before execution, privately select the exact confirmed, non-anonymous synthetic Supabase subject in the named development project. Use a dedicated account without a specialist application. Obtain separate explicit approval for that UUID, target, reviewed SQL checksum and bootstrap operation. Record an operator reference and approval reference. Do not choose by email matching or editable metadata. Do not place subject selections or private configuration in Git.

An approved database operator supplies the four psql variables privately: `approved_subject`, `operator_reference`, `approval_reference`, `approval_confirmation`. The last must be exactly `APPROVE IDENTITY ADMIN BOOTSTRAP`. Execute the reviewed file in a controlled session without query/parameter logging. It uses a transaction and locks, refuses an existing administrator grant, verifies the Auth subject and writes both the capability and immutable provisioning event atomically.

After separately approved execution, verify only the selected subject has the intended active capability and its provisioning event. Verify ordinary/applicant sessions remain denied. Do not expose patient tables to the administrator or create specialist privileges as part of bootstrap. Revoking an administrator capability requires a separately authorized operator action with an auditable event; no public self-service bootstrap or general role editor is provided.

Current live bootstrap status: **NOT AUTHORIZED / NOT EXECUTED**. Disposable tests exercise this exact procedure without granting a live identity.

## Migration recovery

The first approved Phase 3B SQL failed its managed-role ownership handoff and rolled back completely. The separately approved revision uses a bounded SET ROLE membership for handoff and disables SET/INHERIT before commit. Preserve its existing hosted ledger entry; do not replay the older timestamp or falsify migration history.

On a migration error, inspect transaction rollback and ledger before retrying. After a successful migration, do not drop identity tables or delete decision/audit evidence as a rollback shortcut. Disable application routing if necessary and prepare a reviewed additive repair with separate hosted approval. Back up using the existing [PostgreSQL runbook](../README.md); retain access controls and verify a disposable restore before a real recovery.
