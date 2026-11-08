# Phase 3B — Focused hosted specialist repair

**Latest gate closure, 2026-11-08:** [separately approved administrator bootstrap and actual two-account hosted approval/revocation/patient-denial checks PASS](3b-hosted-administrator-gate.md). Earlier blocked statements below describe prior checkpoints and are superseded by that report. No Phase 3C authorization follows.

Date: 2026-11-08. Starting commit `3dce84c7182e22f938f6dacabfef84867e071eb6`, branch `codex/adr-phase3b-specialist-identity`. This closes the hosted applicant API/UI failure, not the administrator bootstrap gate. No Phase 3C work, application restart, patient PDF change or public deployment occurred.

## Failure and root cause

The real signed-in Chrome session captured `GET /api/account/capabilities` returning **503 SPECIALIST_UNAVAILABLE**. The shared authenticated router reached the PostgreSQL identity repository, which intentionally returned a bounded error rather than exposing database details.

Read-only hosted metadata established:

- `apip_adr_writer` could execute the identity RPC.
- The RPC remained owned by the intended non-login `apip_identity_executor`, without BYPASSRLS.
- That executor **could not use the managed `auth` schema**, although the RPC actor initializer and identity RLS policies called `auth.uid()`.
- The migration operator `postgres` also lacked USAGE WITH GRANT OPTION on `auth` and could not assume its managed owner. The original grant therefore did not establish the intended executor access.
- The original migration remained applied at `20261107195900`; it was not replayed or edited.

The original fixture supplied the migration operator with an Auth-schema grant option that the managed project does not have. The new realistic non-superuser fixture omits that grant option and reproduces the repository failure with **SQLSTATE 42501, permission denied for schema auth**. The live API exposed only its bounded 503; a read-only provider-log aggregate returned no matching entries, so no live raw driver SQLSTATE is claimed as captured. The fixture SQLSTATE plus hosted ACL inspection identify the defect; the subsequent real successful request verifies the repair.

Read-only operator attempts to assume the runtime writer or call its restricted RPC were themselves denied. Those operator errors are not mislabeled as runtime errors, and no diagnostic privileges were granted to work around them.

## Exact approved repair

The owner separately approved proposed file `20261107205724_specialist_verified_subject_boundary.sql`, SHA-256:

`0a3aa18cb30657f877edeaa8e26c379aaf8f19a49c90ae3b64efa6612c56e658`

Supabase recorded the successful additive repair as **20261107210206**. The repository file was reconciled to [20261107210206_specialist_verified_subject_boundary.sql](../../../supabase/migrations/20261107210206_specialist_verified_subject_boundary.sql) without changing approved bytes. Applied statement text was independently compared with the approved SQL. The earlier applied migration and ledger were preserved.

The repair adds an invoker-only private `apip_identity.request_subject()` helper that reads the same transaction-local `request.jwt.claim.sub` already installed by verified Express authentication. It substitutes that helper for `auth.uid()` in the RPC initializer and affected identity RLS expressions. Ownership predicates, administrator checks, decisions, audit, revision/idempotency behavior and patient permissions are otherwise unchanged. This follows the existing direct-PostgreSQL verified-context boundary; it does not trust a browser-supplied identity.

There is no managed-Auth schema grant, authenticated-role inheritance, table access expansion or RLS bypass. The helper uses an empty search_path, is SECURITY INVOKER and is executable only by the identity executor (apart from its database owner). PUBLIC, anon, authenticated and the runtime writer cannot call it directly. The RPC remains SECURITY DEFINER with its existing owner and writer-only execution. Temporary ownership-maintenance SET/CREATE privileges are bounded to the repair transaction and removed before commit, with SET/INHERIT false afterward. A source-body checksum guard stops on unexpected RPC drift.

Post-apply checks confirmed helper privileges, unchanged RPC owner/writer execution, zero broad SET/INHERIT memberships, no remaining identity-policy dependency on `auth.uid()`, no managed Auth-schema access for the executor and **zero administrator grants**.

## Actual hosted browser evidence

The same private Chrome session was retained across the repair; no password/token was copied into a script, report or log. The normal capability refresh recovered after SQL application without restarting the application.

- **PASS:** authenticated capabilities changed from 503 SPECIALIST_UNAVAILABLE to **200**.
- **PASS:** a fictional application was created, its department/profile saved, then submitted as saved version **3**.
- **PASS:** the actual profile and SUBMITTED status survived reload; the same Supabase session restored and authorized subsequent API calls.
- **PASS:** the applicant remained denied identity administration. No administrator was bootstrapped.
- **PASS:** unavailable-services text was absent after recovery.

The browser helper initially raced with automatic recovery: Retry had already disappeared. A later assertion also matched both a visible notice and hidden dialog text. These were test synchronization/locator defects; the helper now tolerates automatic refresh and scopes the denial assertion to the visible notice. The already-created application and same browser were reused rather than requesting another sign-in or resetting data. A temporary loopback debugger attached only to the owned test worker to resume its page handle in memory; it was closed afterward. The APIP server and authentication material were not inspected through it.

Actual screenshots (account email masked; all professional details fictional):

- [Before: hosted unavailable-services error](evidence/3b-repair/before.png)
- [After: hosted saved profile and submitted status, 1440px](evidence/3b-repair/after-1440.png)
- [After: hosted submitted status, 360px](evidence/3b-repair/after-360.png)

## Focused verification and evidence reuse

- **7 focused tests PASS:** realistic managed-schema failure/repair, domain rules, verified API contracts and the existing PostgreSQL security workflow now using the repaired SQL. This covers own profile save/submit, foreign application denial, administrator denial, missing subject, unchanged grants, duplicate commands, stale revisions, failed audit rollback, concurrent decisions, expiry and immediate revocation.
- **PASS:** representative 1440px Chrome administrator/applicant fixture workflow against the repaired schema, without granting a live administrator.
- **PASS:** strict TypeScript over the affected tests/repositories and JavaScript syntax validation.
- Reused unchanged frontend build/TypeScript, 320/360/820/1440 layout, native PDF and authentication-lifetime evidence from the [Phase 3B delivery](3b-implementation-and-verification.md). No application component, Express authentication code, PDF mapping, dependency or runtime bundle changed, so no hour-long expiry test, full PDF suite or unrelated research tests were repeated.

## Changed files

- The additive approved SQL migration and `.gitattributes` exact-byte rule.
- `scripts/specialist-hosted-permissions.test.ts`: realistic missing-grant reproduction and narrow repair assertions.
- `scripts/specialist-postgres.test.ts`: full existing decision/security checks against the repaired SQL.
- `scripts/specialist-fixture-runtime.ts`: fixture database applies the additive repair.
- `scripts/specialist-repair.browser.mjs`: retained-session before/after hosted verification with bounded output and masked screenshots.
- This report, delivery/policy/evidence indexes, development history and changelog: factual updated gate status.

## Preview and remaining gate

Verified hosted PostgreSQL URL: `http://127.0.0.1:3301/#/specialist`. Authentication is required; it is accessible on the development laptop only. The separate SQLite preview remains independent. No existing preview process was stopped or reconfigured.

The hosted applicant gate is **PASS**. Exact administrator subject selection and one-time bootstrap remain **NOT AUTHORIZED / NOT EXECUTED**. Live approval/revocation therefore remains blocked, despite passed disposable workflow checks. PRs 6, 7 and 8 remain draft and unmerged. Do not begin Phase 3C.

Post-repair Supabase security advisors show only the same intentional provisioning-events RLS/no-policy INFO and pre-existing disabled leaked-password protection WARN. No new advisory class was introduced.
