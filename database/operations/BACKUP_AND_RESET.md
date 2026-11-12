# APIP development backup and reset preparation

These tools back up only the named development project and rehearse restoration locally. They do not execute a hosted reset. Database passwords, archive recovery passphrases, Auth contents and clinical narratives must never be committed or printed.

- `start-backup-rehearsal.ps1`: private masked input, one source authentication attempt, clears failed credentials. Uses Session pooler port 5432 and `postgres.<project-ref>`, with the exact hostname copied from Connect. No URI parsing or password escaping is involved.
- `backup-tls.mjs`: credential-free PostgreSQL SSL negotiation and certificate/hostname verification. Authenticated client validation also remains mandatory. Pooler `pg_stat_ssl` is recorded separately because it describes the pooler-to-database leg.
- `backup-rehearsal.mjs`: read-only repeatable-read snapshot, encrypted role/inventory/custom-format database archives. Verified CA, `rejectUnauthorized: true` and libpq `verify-full` remain required. Storage payload backup is explicitly blocked if objects exist.
- `backup-crypto.mjs`: scrypt-derived AES-256-GCM streaming encryption. Decryption must authenticate before data is used. The owner retains the recovery passphrase separately. No off-device copy is claimed.
- `start-restore-rehearsal.ps1`, `restore-rehearsal.mjs`, `restore-attempt.mjs`: recovery-passphrase-only offline restore. No hosted connection. A private local PostgreSQL instance uses a random password and loopback binding. An engineer may signal a retry only after a targeted correction; there are no automatic failed hosted-auth retries.
- `development-data-reset.sql`: unexecuted, approval-gated maintenance proposal. This is not a migration. Exact subjects, record counts, project, archive evidence and SQL checksum must be reviewed before use. It does not delete Auth users.

Archives remain outside the repository in an access-restricted private directory. The only plaintext temporary secret is a randomly generated disposable-fixture initialization password, in that private directory, removed immediately after `initdb`. No plaintext SQL dump is written. The isolated database itself is a protected temporary restored copy, not a production database.

## Restore boundary

All archived table counts and canonical row digests, Auth identities, application ownership and integrity constraints must match before declaring database recovery verified. A local PostgreSQL restore does not verify a running managed Supabase Auth service, Google configuration or delivery of existing private PDFs. Database backups do not include Storage payloads; the current preparation explicitly requires zero objects.

Managed role grantor attribution may need a documented fixture-only adaptation in vanilla PostgreSQL. The original encrypted role archive remains unchanged. In-place recovery to the existing project preserves managed provider configuration and existing database roles; role passwords are deliberately absent from the role archive.

## Reset sequence for owner review

1. Verify encrypted archives, owner recovery-key retention, restore evidence and exact manifest. Pause APIP mutation traffic and invalidate sessions using an approved provider mechanism. Stop if subjects/counts/dependencies/storage scope changed.
2. On the development project only, acquire bounded locks. Verify exact account UUID set and table counts. Temporarily suspend only the eight named immutable user triggers within one transaction, delete approved dependent application records, restore those triggers, and force deferred constraints before commit. Do not change RLS, grants, foreign keys, functions, schemas or migration history. No global replication-role bypass is proposed for reset.
3. Use the supported Auth Admin API to hard-delete each approved UUID, never a blanket SQL `auth.users` delete. This requires separately available server-side administrative authorization. If any account operation fails, stop and report partial completion. This phase cannot be atomic with the earlier SQL transaction.
4. Verify approved old UUIDs and all approved application records are gone, triggers/policies unchanged, Storage empty and migrations intact. Managed platform logs are retained according to Supabase policy, not erased by this operation.
5. Fresh registration remains paused until reset is approved and verified. Removing all old identities also removes the sole identity administrator; a replacement administrator and approved specialist require separate explicit authorization. Registration alone never grants review privileges.

No destructive approval request is valid until the backup and restoration evidence actually exist. Auth runtime restoration, off-device recovery and any unavailable Admin API credentials must be reported separately.
