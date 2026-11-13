# Phase 3C-B exact SQL approval sheet

Status: **awaiting owner approval; not applied**. Development target only: `kstxwoitiistmvivwixd`.

- File: [20261108123217_adr_consented_sharing.sql](../../../supabase/migrations/20261108123217_adr_consented_sharing.sql).
- SHA-256: `e6b5247b5e8519b5344429fa50695fc419cc137a1c7c3e0af9088089489cbb63`.
- Approved product policy: [v1](3c-b-policy-approval.md). This SQL approval does not approve new specialist identities, restore the revoked account, or authorize Phase 3C-C.

## Additive objects and privileges

The private `apip_sharing` schema contains four RLS tables: `directory`, `requests`, `audit`, and `receipts`. Requests reference an existing owner/case/revision tuple. A partial unique index permits one active assignment per patient case. Only state/version can be updated on requests by the executor; audit and receipt updates/deletes are rejected by triggers. Consent source snapshots and disclosure are immutable through application permissions.

`apip_sharing_executor` is NOLOGIN, NOINHERIT, NOSUPERUSER and NOBYPASSRLS. It does not own the tables and receives no raw patient-table grant. It owns only the bounded `operation(text,uuid,jsonb,uuid)` dispatcher. The restricted `apip_adr_writer` receives schema USAGE and EXECUTE on that dispatcher, not direct sharing-table writes. PUBLIC, anon and authenticated receive no sharing-table access or sharing-function EXECUTE.

All functions have an empty fixed search path. `subject()` reads the existing verified transaction-local subject. Private, operator-owned definer helpers perform explicitly scoped operations: eligibility boolean, the caller's minimal approved directory profile, the caller's own immutable source snapshot, and decline of the caller's active assignment. These helpers intentionally execute with operator privileges but are callable only by the non-login executor, never browser/runtime roles directly. The decline helper explicitly checks assignment recipient, current eligibility, expected version and atomic audit; it does not return clinical contents. The executor dispatcher remains governed by RLS.

The migration temporarily permits the operator to SET ROLE for function ownership transfer, then removes schema CREATE and SET/INHERIT membership options before commit. It grants no administrator identity, professional approval, assignment or patient access. It alters no existing patient or identity tables, functions or policies.

## Executed disposable evidence

- Installation by a realistic non-superuser migration operator; four RLS tables with separate table/executor ownership; no PUBLIC EXECUTE; denied browser/writer direct access and helper execution; column-restricted updates.
- Exact revision ownership, assigned versus unassigned recipients, expired/revoked denial, foreign patient and administrator denial, later-revision privacy, withdrawal and decline denial.
- Duplicate creation replay, conflicting active creation, two independent connection race, stale withdrawal version and controlled audit-failure rollback.
- Upgrade of a populated actual Phase 3A fixture preserves saved snapshot bytes and existing ADR/identity policies.
- API rejects forged owner fields, mismatched account headers, unchecked consent and changed disclosure digest. Revocation during PDF generation prevents PDF delivery.
- Ten affected Node tests pass. Frontend and strict server/fixture TypeScript pass; production build passes. Actual Chrome consent → assignment → original PDF → withdrawal flow passes at 320/360/820/1440px using disposable PostgreSQL and synthetic local authentication. Generated PDF independently reopened with expected fictional reporter and medicine values.

These are disposable/local checks, not evidence that hosted sharing works. Earlier hosted authentication/PDF evidence is reused only for unchanged boundaries.

## Installation and recovery procedure

After explicit approval, recheck these exact bytes and target, inspect the current hosted ledger read-only, and apply only this SQL through the approved operator migration mechanism. Verify ledger statements/checksum, ownership, RLS and ACLs; compare existing schema/policy definitions and record counts without reading patient contents. Run security advisors. Record the actual hosted migration version if the provider assigns one; do not rewrite earlier ledger history.

The SQL is transactional: installation failure must roll back. It is intentionally not rerunnable after success. On application problems, disable `APIP_SHARING_ENABLED` and keep existing patient routes operational. Do not drop retained consent/audit records or run a destructive rollback. Any corrective hosted DDL requires separate exact-SQL approval. Keep database backup/restore under the existing operator procedure.

## Hosted gates still required

1. Owner approval of this exact SQL and named development project.
2. Verified installation and restricted-writer checks on that project.
3. Separately approved eligible synthetic specialist identities and their directory opt-in; the previously revoked applicant stays revoked.
4. Private sign-in and actual two-account sharing/preview/withdrawal checks on an isolated hosted preview. No hosted GO is claimed before these pass.
