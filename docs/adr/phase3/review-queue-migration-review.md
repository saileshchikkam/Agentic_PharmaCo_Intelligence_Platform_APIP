# ADR professional assessment migration review

## Approval boundary

Hosted ledger checked on 2026-11-12: pooled queue `20261111000000` and professional review `20261112103000` are both pending. Apply the pooled queue first, then professional review, after separate exact-SQL approval. Existing sharing is recorded as `20261108134740`; do not replay the repository's earlier sharing filename.

Assessment writes now serialize by assignment, reject stale versions, return HTTP 409 for database concurrency conflicts, and reject every new assessment version after finalization. An identical retry remains idempotent.

Real hosted schema review confirms sharing requests and specialist applications exist, are owned by postgres, and have RLS enabled. The new executor owns no tables, has no BYPASSRLS, and receives no direct patient/sharing/identity table grants. Fixed-search-path helper functions remain operator-owned and expose only assignment metadata and eligibility to the executor. Hosted application and resulting grants remain unverified until approval/application.

`20261112103000_adr_professional_review.sql` is locally verified but is not applied to a hosted project. Hosted execution requires the owner's approval of the exact file and checksum.

## Scope

The additive `apip_review` schema provides:

- immutable, versioned professional assessment drafts and conclusions;
- immutable patient-specialist messages;
- immutable audit events and idempotency receipts.

It builds on the existing pooled queue and active exact-revision assignments instead of creating a second queue.

The migration does not change existing ADR, identity, sharing, profile, or Auth tables or policies. It does not grant specialist or administrator capabilities.

## Security model

- `anon`, `authenticated`, and `PUBLIC` receive no schema, table, or privileged-function access.
- `apip_adr_writer` can execute only `apip_review.operation`; it receives no direct table access.
- The non-login, non-inheriting, non-BYPASSRLS executor owns the operation function.
- Every operation uses the verified transaction-local subject.
- Specialists must be currently approved and unexpired on every protected request.
- Assessment content is visible only to the currently assigned eligible specialist; patients and other specialists cannot read private professional notes.
- Messages are visible only to the patient and currently assigned eligible specialist.
- Assignment withdrawal/release and specialist revocation block subsequent reads.

## Local evidence

`scripts/review-postgres.test.ts` installs the migration with a realistic non-superuser migration role and verifies narrow grants, RLS, idempotent assessment versions, patient exclusion from private notes, cross-specialist and administrator denial, shared messages, revocation, withdrawal, and history immutability.

Passing checks on 2026-11-12:

- `node --import tsx --test scripts/review-postgres.test.ts`
- `npm run lint`
- `npx tsc -p tsconfig.node.json --noEmit`
- `npm run build`

The build retains the existing large-chunk warning; this milestone does not alter bundling.
