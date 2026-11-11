# APIP P0 Storage Inventory & Pooled Queue Migration Audit

- **Date:** 2026-11-11
- **Scope:** Integration branch `codex/apip-landing-v2` (Supabase project `kstxwoitiistmvivwixd`)
- **Status:** Storage hardening implemented and checked locally; hosted pooled-queue migration (`20261111000000_adr_pooled_sharing_queue.sql`) **audited, hardened, verified on PGlite, and awaiting explicit project-owner SQL approval**.

---

## 1. Stage 2.1 Storage Inventory (Inspected Read-Only)

No existing SQLite files were deleted or modified during stabilization. Hosted cloud runtimes have been isolated from opening on-disk SQLite files.

### Local & Host SQLite Databases

| Location | Contents & Row Counts (Inspected 2026-11-11) | Role / Remediation |
| --- | --- | --- |
| APIP main & closure worktrees | 0 `.sqlite` / `.sqlite3` / `.db` files | Repository clean of database artifacts. |
| User home `.apip/sharing-pool.sqlite` (53,248 B) | `pooled_requests`: `0`, `pool_audit`: `0`, `pool_receipts`: `0` | Was silently opened when `APIP_POOL_POSTGRES !== '1'`. Disconnected from cloud/production runtime (`server/cloud-account.ts`, `server/sharing/pool.ts`, `server/sharing/router.ts`); pooled endpoints now fail closed with HTTP `503 POOL_MIGRATION_REQUIRED`. |
| Local AppData `APIP/accounts.sqlite` (+ `-shm`/`-wal`) | `local_users`: `0`, `local_sessions`: `0`, `local_profiles`: `0`, `local_adr_drafts`: `0`, `adr_guided_cases`: `0`, `adr_guided_versions`: `0` | Development-only local fixture (`NODE_ENV === 'production'` throws in `server/local-account.ts`; unused when `APIP_ACCOUNT_MODE=cloud`). |

### Browser Storage Audit

| Key | Storage | Purpose & Lifecycle |
| --- | --- | --- |
| `apip.cloud.auth` | `localStorage` | Supabase Auth JS session (`persistSession: true`; cross-tab sync via Supabase Auth channel, `storage` events, and app sync channel `BroadcastChannel('apip.cloud.auth.sync')`). |
| `apip.cloud.auth-code-verifier` | `sessionStorage` | Single-tab PKCE verifier for email/OAuth callback verification. |
| `apip.account.continue`, `apip.account.return`, `apip.last.role` | `sessionStorage` | Temporary post-login UI navigation/continuation state; cleared on `signOut` and restored on failed signup. |
| `apip.appearance.v1` | `localStorage` | Theme mode/accent preference (non-clinical UI setting). |
| `apip.fictionalAdrDraft.v1`, `apip.fictionalAdrDraft.v2`, `apip.fictionalAdrDrafts.v1` | `localStorage` | **Removed from hosted/Supabase runtime:** legacy demo buttons in [GuidedWorkspace](../../src/features/adr/guided/GuidedWorkspace.tsx) and [AdrWorkspace](../../src/features/adr/AdrWorkspace.tsx) are now gated to `import.meta.env.DEV && accountClient?.kind !== 'supabase'`, and [AccountProvider](../../src/features/account/AccountProvider.tsx) clears legacy draft keys on Supabase startup and `signOut`. |

### Hosted Supabase Auth & PostgreSQL (`kstxwoitiistmvivwixd`)

Read-only verification on `kstxwoitiistmvivwixd`:

- **Supabase Auth (`/auth/v1/settings`):** `external.email = true`, `external.google = false`, `disable_signup = false`, `mailer_autoconfirm = false` (email confirmation required for newly registered accounts), `saml_enabled = false`, `passkeys_enabled = false`.
- **PostgreSQL schemas/objects (`apip_adr_writer` connection):**
  - `public.patient_profiles` (RLS `user_id = auth.uid()`).
  - `apip_adr.{cases,revisions,pdf_exports,command_receipts}` (`20261105*`–`20261107*`).
  - `apip_identity.applications` (`20261107*`, independent specialist review/expiry/revocation).
  - `apip_sharing.{directory,requests,audit,receipts}` + `apip_sharing.operation(...)` (`20261108123217`, Phase 3C-B direct sharing).
  - `apip_sharing.pooled_requests`: **absent (`42P01 undefined_table`)** — migration `20261111000000_adr_pooled_sharing_queue.sql` is not yet applied on hosted Supabase.
  - `apip_medassist`: does not exist (contract only; see [MedAssist integration contract](../collaboration/medassist-integration-contract.md)).
- **Parallel MedAssist branch (`origin/feat/medassist-jayanth`, untouched):** separate FastAPI + Alembic (`alembic/versions/68ad8f9063cf_create_users_table.py`) local stack; credential rotation note from prior commit `a561155` / `alembic.ini` line 89 stays flagged `NEEDS HUMAN`.

---

## 2. Hosted Fail-Closed Behavior Implemented

1. **No silent SQLite fallback:** [cloud-account.ts](../../server/cloud-account.ts) passes `null` for the pool repository unless `APIP_SHARING_ENABLED === '1' && APIP_POOL_POSTGRES === '1'`. [createSharingPoolRepository](../../server/sharing/pool.ts) throws `POOL_MIGRATION_REQUIRED` / `POOL_SQLITE_FORBIDDEN_IN_CLOUD` if invoked without Postgres in cloud/production mode.
2. **Explicit `503 POOL_MIGRATION_REQUIRED` boundary:** [sharingRouter](../../server/sharing/router.ts) returns HTTP `503 { error: 'POOL_MIGRATION_REQUIRED' }` on `/api/sharing/queue`, `/api/sharing/requests` (`target: 'pool'`), `/api/sharing/queue/:id/claim`, and `/api/sharing/queue/:id/release` while direct Phase 3C-B sharing remains online.
3. **Production startup & API 404 boundaries:** [server.ts](../../server.ts) rejects production server startup unless cloud Supabase authentication is registered (when `APIP_ACCOUNT_MODE !== 'disabled'`), and unmatched `/api/*` paths return JSON `404 { error: 'NOT_FOUND' }` instead of `index.html`.
4. **Readiness check:** `/api/ready` checks `has_function_privilege(current_user, 'apip_sharing.pool_operation(text,uuid,jsonb,uuid)', 'EXECUTE')` whenever `APIP_POOL_POSTGRES === '1'`.

---

## 3. Migration Audit: `supabase/migrations/20261111000000_adr_pooled_sharing_queue.sql`

Audited against hosted schema prerequisites (`20261105*`–`20261108123217`) and hardened before owner application:

- **Privilege model:** `apip_sharing.pooled_requests`, `pool_audit`, and `pool_receipts` enable RLS and revoke all privileges from `public`, `anon`, `authenticated`, and `apip_adr_writer`. Only `apip_sharing_executor` (`nologin noinherit nosuperuser nobypassrls`) receives scoped table/column grants; only `apip_sharing.pool_operation(text, uuid, jsonb, uuid)` is granted `EXECUTE` to `apip_adr_writer`.
- **Hardening edits applied in this stabilization pass:**
  1. Added explicit `if p_id is null then raise exception 'INVALID_REQUEST'; end if;` guards in `pool_get`, `pool_claim`, `pool_release`, and `pool_withdraw` before computing advisory locks or querying rows.
  2. Added `apip_sharing.prevent_pool_direct_overlap()` + `BEFORE INSERT` trigger `sharing_requests_prevent_pool_overlap` on `apip_sharing.requests` (serialized under the `sharing-case:` advisory xact lock). If a case currently has a `'pending_claim'` row in `pooled_requests`, direct patient `operation('create', ...)` (`apip_sharing.subject() = new.patient`) is rejected with `ACTIVE_ASSIGNMENT_CONFLICT` (`409`), while specialist `insert_claimed_assignment(...)` (`apip_sharing.subject() <> new.patient`) succeeds atomically.
- **Data preservation check:** Existing `apip_sharing.requests`, `directory`, `audit`, `receipts`, `apip_adr.*`, `apip_identity.*`, and `public.patient_profiles` rows are preserved; no existing tables or rows are dropped or truncated.
- **PGlite verification:** Full 9-migration chain verified under non-superuser `migration_operator` (`nologin createrole`) across 8 actors, concurrent claims, release/reclaim, withdrawal, trigger overlap block, null-ID guards, and immutable audit triggers via [p0-isolation-security.test.ts](../../scripts/p0-isolation-security.test.ts) and [sharing-pool-postgres.test.ts](../../scripts/sharing-pool-postgres.test.ts).

---

## 4. Project-Owner Approval & Execution Checklist (Do Not Auto-Run Without Approval)

1. Confirm backup / pre-migration row counts on hosted project `kstxwoitiistmvivwixd` (`apip_sharing.requests`, `apip_sharing.audit`).
2. Review and execute [20261111000000_adr_pooled_sharing_queue.sql](../../supabase/migrations/20261111000000_adr_pooled_sharing_queue.sql) in Supabase SQL Editor (or tracked Supabase CLI migration flow) as database migration owner.
3. Verify `apip_adr_writer` holds `EXECUTE` on `apip_sharing.pool_operation(text, uuid, jsonb, uuid)`.
4. Set `APIP_POOL_POSTGRES=1` in server environment and restart; confirm `GET /api/ready` returns `200 { ready: true }`.

### Verified Rollback Plan (If Pooled Sharing Must Be Reverted)

Execute inside a single transaction only after disabling `APIP_POOL_POSTGRES` (`unset APIP_POOL_POSTGRES`):

```sql
begin;
drop trigger if exists sharing_requests_prevent_pool_overlap on apip_sharing.requests;
drop function if exists apip_sharing.prevent_pool_direct_overlap();
drop function if exists apip_sharing.pool_operation(text, uuid, jsonb, uuid);
drop function if exists apip_sharing.insert_claimed_assignment(uuid, uuid, uuid, uuid);
drop function if exists apip_sharing.pool_row_state(uuid);
drop table if exists apip_sharing.pool_receipts;
drop table if exists apip_sharing.pool_audit;
drop table if exists apip_sharing.pooled_requests;
commit;
```

*(Note: Any active assignments already claimed into `apip_sharing.requests` remain valid Phase 3C-B direct sharing assignments and are unaffected by rolling back the queue tables.)*
