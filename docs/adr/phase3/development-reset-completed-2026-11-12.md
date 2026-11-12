# Approved development reset — completion evidence

**PASS**, 2026-11-12 IST. Target: `kstxwoitiistmvivwixd` only.

## Approval and preflight

The owner separately approved application V2 SHA-256 `dbe7c13afaf8addcbe1cb326bdca8625cabe46db93f8a019bafd290d72c23609` and retained flow SQL SHA-256 `97e49d760e10911a0c57ff6d2718884de20406236276877c6ec6b2c999f2aec7`. The approved scope remained the exact ten Auth UUIDs in the authenticated private inventory, 521 application records and thirteen obsolete flow rows.

Before any committed deletion, actual file hashes matched; both access-restricted encrypted backup copies matched their approved hashes and authenticated decryption passed using the owner-entered recovery passphrase. Both copies remain on the same laptop, with no off-device copy claimed. Private Auth Admin read authorization and exact account-list equality passed. The fifteen application counts/row digests, Auth dependency counts, flow digest and zero Storage objects matched the approved snapshot. No secret values were logged or committed.

The previously completed backup restore evidence remains valid: all 53 tables matched counts/digests and integrity checks. Fixture-only grantor attribution adaptation and the lack of a restored managed Auth login test remain documented limitations.

## Executed operations

1. Applied the approved V2 statements with only the fixed project and privately verified UUID parameters instantiated. The owner-checked application transaction committed successfully. Deferred FK checks drained before the eight immutable user triggers were restored.
2. Verified all fifteen targeted application tables empty and schema/security/migration fingerprints unchanged.
3. Applied the unchanged, count/digest-guarded flow cleanup; verified zero flow rows and still exactly the ten approved Auth users before API deletion.
4. Released the verified SQL-completion gate. The server-only worker rechecked the exact subject set and made ten `auth.admin.deleteUser(subject,false)` calls. All ten succeeded. The SDK account list then returned empty; public Auth settings hash remained unchanged.
5. Independently verified hosted database counts and metadata after all API calls.

No additional migration, schema/function/grant/RLS change, user creation or professional privilege grant was performed. No global trigger bypass was used. Source SQL was executed through the existing authorized operator connection; the Auth key remained only in the private live process and was cleared at completion.

## Final record counts

| Target | Before | After |
|---|---:|---:|
| Auth users | 10 | 0 |
| Auth identities | 10 | 0 |
| Auth sessions | 28 | 0 |
| Auth refresh tokens | 60 | 0 |
| Auth AMR claims | 28 | 0 |
| Auth one-time tokens | 6 | 0 |
| Auth obsolete flow rows | 13 | 0 |
| All fifteen approved application tables | 521 | 0 |
| Storage objects | 0 | 0 |

Individual application before/after counts follow the exact [approved review](development-reset-review.md); every one of its fifteen tables was independently checked as zero. This includes all 38 cases, 220 revisions, 61 PDF export records, both specialist applications and the sole identity-administrator capability.

Captured before/after fingerprints match for: relevant schemas, relation ownership/ACL/RLS flags, policies, function definitions/owners/security/config/ACL, triggers and enabled states, database roles, memberships, and Supabase/Auth/Storage migration-ledger contents. Public Auth settings also match. Auth audit_log_entries remains zero; no operation purged that table or Supabase-managed platform logs. External platform log retention is not controlled by this reset.

Private backup, scope and deletion receipts remain outside Git. The exact UUID list, emails, credentials, session tokens and clinical narratives are omitted from this report. The original encrypted archives remain intact. Previously issued access-token bytes are not recalled by account deletion; no token-expiry or token-recall claim is made.

## Preview and next authorization boundary

`http://127.0.0.1:3602/` returned HTTP 200. `http://127.0.0.1:3602/api/ready` returned HTTP 200 with database, PDF and Auth checks true. An actual in-app browser opened the patient sign-in dialog with enabled controls. The preview is laptop-local, not a public deployment. Readiness is not a fresh authentication test.

No fresh Patient, Specialist or administrator account was created. [Fresh verification and administrator-bootstrap preparation](fresh-account-verification-plan.md) records email-confirmation settings and the required separate authorizations. Email signup remains enabled, email confirmation remains required, and no repeated delivery tests or configuration changes were made. A new privileged identity requires owner approval of its exact verified subject and audited bootstrap operation. Registration/profile submission alone cannot authorize professional review.
