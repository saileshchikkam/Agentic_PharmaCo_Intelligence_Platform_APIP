# Development data reset — consolidated review

Status: **ORIGINAL SCOPE APPROVED; ORIGINAL SQL ATTEMPT ROLLED BACK; V2 RETRY NEEDS NEW CHECKSUM APPROVAL.** Target only development project `kstxwoitiistmvivwixd`.

## Verified backup and recovery evidence

Source operator authentication succeeded with a fresh private password entry. Connection: the owner-supplied Session pooler, port 5432, username `postgres.kstxwoitiistmvivwixd`. Passwords were raw fields, never URI-encoded or logged. No conclusion is drawn about whether the earlier rejected value was stale or mistyped. The client verified its CA, certificate and hostname under TLS 1.3. Pooler-to-database `pg_stat_ssl` was false; it was not used as evidence of the client's transport. The actual authenticated client certificate/hostname callback passed.

AES-256-GCM encrypted exports were taken under a shared read-only repeatable-read snapshot. The owner supplied and retains the recovery passphrase. Archives and temporary local restore clusters are in a private access-restricted directory outside Git. No plaintext SQL dump was written. No off-device copy is verified.

The isolated PostgreSQL 18.6 restoration of the PostgreSQL 17.11 source completed. **53 tables** matched source row counts and canonical whole-row digests. Auth users, identities, password-hash fields, ownership references, ADR revisions, export metadata, sharing and specialist records were covered. Constraint validation and orphan-case checks passed. Storage had zero objects, buckets and multipart uploads: there are no object payloads to copy or delete.

Archive ciphertext SHA-256 values:

| File | Bytes | SHA-256 |
|---|---:|---|
| `database.aes` | 503965 | `c4f3e8fa673d417d80c9c640259ddc7479e4caf1a44cd52a91ef5b4da67c898c` |
| `inventory.aes` | 23341 | `641c3a65029be660100b679af26b948369dc554119b3cf4585a5bf56815e5dbf` |
| `roles.aes` | 7168 | `96a77f9bba13f837b5f2c65597b3d15cc256675e12e1320dc990283ba8368195` |

The verification-summary SHA-256 is `74928e4d119faf4f915d7153f6a360a58f51250f5715c0a0c1ef2344fec28420`.

### Limits

- Vanilla PostgreSQL could not replay managed grantor attribution. Only the disposable fixture's `GRANTED BY` clauses were attributed to its own superuser. Effective membership options were retained; the original encrypted role dump is unchanged. Reset itself preserves all hosted database roles.
- Exact Auth database records were restored; a running managed Supabase Auth service and restored-login test were **not** rehearsed. Same-project recovery retains provider configuration and encryption roots, which this reset does not change. Operator INSERT privileges on Auth users/identities were checked read-only. This is database recovery evidence, not a successful hosted Auth failover claim.
- Existing refresh sessions should not be reactivated on recovery. Old access-token bytes cannot be recalled. Provider deletion and API authorization must be verified after the approved operation.
- Role passwords are intentionally excluded from the global role archive; this reset does not remove PostgreSQL roles or change their passwords.
- No verified off-device recovery copy exists. Keep the archive and the owner-retained passphrase separately.

## Exact account scope

All **ten Auth subject UUIDs** enumerated in the authenticated `inventory.aes` archive above, with their dependent development data. That fixed encrypted manifest is the authoritative private account list. Public Git documentation omits UUIDs, emails and medical contents. No subsequently created identity is included. The SQL requires the supplied UUID set to equal the current source set and stops if it differs.

This includes the existing sole identity administrator and both specialist applications. Reset leaves **no identity administrator** and no approved specialist. A new administrator bootstrap and independent specialist approval will require separate explicit approval; no fresh privileges are included here.

## Table-by-table proposed application deletion

| Table | Rows |
|---|---:|
| apip_adr.cases | 38 |
| apip_adr.revisions | 220 |
| apip_adr.pdf_exports | 61 |
| apip_identity.account_roles | 0 |
| apip_identity.administrator_capabilities | 1 |
| apip_identity.applications | 2 |
| apip_identity.audit_events | 10 |
| apip_identity.command_receipts | 10 |
| apip_identity.decisions | 5 |
| apip_identity.provisioning_events | 1 |
| apip_sharing.audit | 117 |
| apip_sharing.directory | 1 |
| apip_sharing.receipts | 27 |
| apip_sharing.requests | 27 |
| public.patient_profiles | 1 |

Total: **521 application records**. No pooled-queue/review-assessment/message tables exist in the inspected hosted schema; none are invented, migrated or reset.

## Auth and ephemeral scope

Hard-delete only the ten manifest UUIDs through the supported Auth Admin API: `DELETE /auth/v1/admin/users/{approved_uuid}`, body `{"should_soft_delete":false}`. Never issue blanket SQL deletion against auth.users. Snapshot-linked rows: 10 users, 10 identities, 28 sessions, 60 refresh tokens, 28 MFA authentication-method claims and 6 one-time tokens. Their recorded foreign keys cascade from the approved users/sessions. All other inspected MFA, WebAuthn, SCIM and OAuth user-dependent tables are empty. Abort if affected counts/scope change; do not silently widen approval.

Additionally, thirteen obsolete `auth.flow_state` records have no user FK. Proposed separate SQL deletes only that whole-row-digest-guarded archived set (digest `c01d789b084342bd2a0e33ea182a6bed`) after confirming exactly thirteen rows and zero SAML relay states. Any difference aborts. Provider/SSO/client configuration is preserved.

## Exact operations and hashes

1. Verify archive hashes, retained recovery passphrase, manifest subjects and restore evidence. Enter a controlled maintenance window; pause APIP mutation traffic. Obtain existing server-only Auth Admin API authorization privately before any phase starts. A publishable key and the restricted runtime writer are insufficient.
2. Execute [application reset SQL](../../../database/operations/development-data-reset.sql), SHA-256 `236c4fd7e3e898e2bad9d3114b44399b111d9ab5e6b8d9725019607f510f8cf3`, with the approved project and exact manifest UUIDs. It locks the fifteen application tables, checks account scope and all application row counts/digests, temporarily disables only the eight named immutable user triggers, deletes dependents before parents, defers the existing deferrable FK, re-enables triggers and forces constraints before commit. It compares trigger definitions/states and RLS flags with their baseline. No RLS, grant, function, schema, migration, foreign-key or global replication-role change is proposed.
3. Execute [obsolete flow cleanup SQL](../../../database/operations/development-auth-flow-reset.sql), SHA-256 `97e49d760e10911a0c57ff6d2718884de20406236276877c6ec6b2c999f2aec7`, only if its exact count/digest still match. It uses a bounded transaction and no trigger bypass.
4. Perform the ten explicitly scoped Auth Admin API deletions, then verify the old UUIDs and all approved dependent records are absent. API failures stop further operations and produce a factual partial-completion report. SQL and Auth Admin API calls are not one atomic transaction.
5. Verify hosted schemas, policies, grants, triggers, functions, provider settings and all migration ledgers are unchanged. Storage deletion scope is **zero objects**. Auth audit_log_entries and Supabase-managed platform logs are not purged. Their retention is not controlled by this reset.
6. Only after reset completion may fresh Patient and Specialist registration begin. No registration, professional privilege or new administrator grant is authorized by this review document.

## Recovery and irreversibility

Application SQL errors roll back within their transaction, including exceptional trigger changes. Auth API deletion cannot be undone by re-registering the same email; UUID-preserving recovery requires the verified archive and an explicitly authorized operator restore to the retained schema. The original source schemas and roles must remain intact. Do not overwrite new accounts or writes with an old archive. Preserve old audit evidence in the encrypted archive, while acknowledging that restoring record bytes is not proof of hosted service/session restoration.

## Approval gate and execution prerequisites

One consolidated owner approval must identify the project, fixed encrypted subject manifest, both SQL hashes, table counts, exceptional trigger handling, ten hard-delete API operations and the stated recovery limits. The owner approved the exact original scope and both original SQL checksums. Both encrypted copies, the owner recovery passphrase, Auth Admin read authorization and the exact ten account UUIDs passed private preflight. The original application SQL then failed with PostgreSQL 55006 before commit. All 521 application records and every captured schema/security/migration fingerprint were verified unchanged after rollback. No flow SQL or Auth deletion was executed. The Auth worker was cancelled and its credentials cleared. The revised application SQL requires a new exact-checksum approval; see the V2 review. No new users or professional grants have been created.
