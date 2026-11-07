# Specialist identity boundary

Phase 3B manages fictional professional identity only. It does not grant patient-case access. See the [delivery report](../../docs/adr/phase3/3b-implementation-and-verification.md).

`domain.ts` defines approved categories, bounded profile validation, transitions and capabilities. `repository.ts` is the storage contract. `postgresRepository.ts` sets the verified subject transaction-locally and calls one restricted database function. `router.ts` checks the existing authenticated principal, account consistency, exact command shape and bounded errors. `fixtureRepository.ts` is test-only and is never selected by application configuration.

## HTTP contracts

All requests require the existing verified bearer session and matching `X-APIP-Account`. Mutations also require a UUID `Idempotency-Key`. No response is cacheable. A selected workspace, role field or JWT metadata is not authority.

- `GET /api/account/capabilities`: current specialist and identity-administration booleans, authorization version, authorization expiry; professional case access/export/assignment always false.
- `GET /api/specialist/applications/current`: own application or null.
- `POST /api/specialist/applications`: `{profile}` with exactly the nine documented string fields. Creates an owned draft; request key is its stable identity.
- `POST /api/specialist/applications/:id/commands`: `{expectedVersion,command:{type:"save_draft",profile}}` or `{expectedVersion,command:{type:"submit"}}`.
- `GET /api/admin/specialist-applications`: optional state, limit 1–50, UUID before cursor; only submitted/non-draft applications. Current console shows 25 with a status filter.
- `GET /api/admin/specialist-applications/:id`: current authorized administrator only, excludes private drafts.
- `POST /api/admin/specialist-applications/:id/decisions`: `{expectedVersion,command:{action,reason,evidenceReference,policyVersion}}`. Current policy version is `private-fictional-3b-v1`.

Errors include 401 SIGN_IN_REQUIRED, 403 FORBIDDEN/SELF_APPROVAL_DENIED, 404 NOT_FOUND, 409 ACCOUNT_CHANGED/REVISION_CONFLICT/IDEMPOTENCY_CONFLICT/INVALID_TRANSITION, 400 invalid input, 422 missing verification evidence and bounded 503 setup/unavailability. Database details and submitted profiles are not logged.

## Authorization and transactions

The SQL function reads current database capabilities on every request. A stale receipt or token cannot restore an old approval. Actor advisory locks, row locks, expected versions and fingerprints serialize decisions and enforce idempotency. Application, immutable decision, receipt and audit writes are one transaction. The application writer cannot directly edit identity approvals. The non-login function owner is not a table owner and has no BYPASSRLS or ADR grants.

Production requires the existing cloud repository. Ordinary SQLite mode returns an explicit setup-unavailable response for specialist features. The separately invoked browser fixture uses disposable PostgreSQL and existing local test authentication, with a visible banner and a separate API prefix. It is never a production fallback.
