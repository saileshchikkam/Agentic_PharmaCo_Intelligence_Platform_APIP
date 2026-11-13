# Account portal binding correction — 2026-11-12

Status: implementation in progress; hosted activation and browser acceptance BLOCKED.

The previous account provider inferred specialist portal membership from an application or identity-administrator capability. The current implementation reads an explicit accountRole returned by the verified account capabilities API. Registration requests PATIENT or SPECIALIST; the proposed auth.users INSERT trigger consumes this only once. Later user-metadata changes cannot change the binding. Registration never grants professional approval. Legacy accounts are not automatically backfilled.

SQL proposal: database/proposals/account-portal-binding.sql. Not applied and not yet a versioned hosted migration. Supabase CLI invocation did not produce a migration file. Hosted approval must follow final migration packaging and security review. Existing approved specialist accounts will need separately approved explicit role backfill; no identities have been changed.

API guards deny patient/unbound specialist operations; administrative checks still require independent authoritative capability. Review endpoints also require the specialist binding in addition to their existing professional approval and consent checks. Frontend routes use the server role and show an unresolved-account notice rather than inferring a specialist identity.

Specialist dashboard changes: centered Pharmacovigilance Workspace heading and requested description, top-row workspace label/profile action, no visible development-environment label, larger icons and existing spacious responsive three-card grid. Earlier C2 changes are preserved.

Executed checks: disposable PostgreSQL registration trigger, metadata-update resistance, owner-scoped SELECT RLS, transaction-subject cleanup, denied writer mutation and denied trigger execution PASS. Focused authentication/API tests: 3 PASS (local fixture verification, not hosted). Frontend TypeScript PASS. Final production build PASS. Explicit server type check fails in existing adr/guided.ts and review/router.ts type errors; these files were not changed. Browser runner BLOCKED by unavailable playwright package; responsive and authenticated browser acceptance remain unverified. Unified port 3602 was not responding at the final HTTP check; no working preview claimed.

Read-only hosted dependency inspection confirms Auth references from ADR cases, specialist applications, administrator grants, decisions, audit, command receipts, provisioning events, sharing directory/requests/audit/receipts and patient profiles. ADR cases and identity/audit records use restrictive deletion dependencies. No user has been classified as safely disposable. No backup/restore has been verified. Proposed destructive scope is EMPTY: no deletions or resets are authorized or prepared. Prefer three additional synthetic demonstration accounts after role migration approval, preserving all existing history. Approved-specialist provisioning remains an independent audited owner approval.

Remaining: final SQL packaging, realistic upgrade/security checks, exact hosted approval, reviewed legacy role mapping, configured backend restoration, browser acceptance at 1440/tablet/375, backup and per-subject reset inventory if deletion is still desired, final regression and Git completion. No claim of completion or hosted verification.

## Recovery follow-up

Unified frontend HTTP 200 and proxied readiness HTTP 200 confirmed outside restricted runner network; database, PDF and Auth checks all true. Actual in-app browser opens enabled sign-in fields. Authenticated dashboard/responsive acceptance remains pending role migration. Frontend TypeScript and explicit server type check pass after narrowing the validated pagination cursor and annotating the review command ID string. Hosted SQL remains unapplied. SQL proposal checksum: E1BE4C65165177EB42F6258853525521B4A30634CB53AEF28D3FE66A9B2F1DF9. Earlier server-error and preview-down observations above describe the prior checkpoint.
