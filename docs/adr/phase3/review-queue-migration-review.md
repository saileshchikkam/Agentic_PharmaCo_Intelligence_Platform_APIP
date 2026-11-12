# ADR professional review queue migration review

## Approval boundary

`20261112103000_adr_review_queue.sql` is locally verified but is not applied to a hosted project. Hosted execution requires the owner's approval of the exact file and checksum.

## Scope

The additive `apip_review` schema provides:

- an explicit, exact-revision patient consent queue;
- non-identifying open-queue metadata;
- atomic specialist claim and release;
- patient withdrawal;
- immutable, versioned professional assessment drafts and conclusions;
- immutable patient-specialist messages;
- immutable audit events and idempotency receipts.

The migration does not change existing ADR, identity, sharing, profile, or Auth tables or policies. It does not grant specialist or administrator capabilities.

## Security model

- `anon`, `authenticated`, and `PUBLIC` receive no schema, table, or privileged-function access.
- `apip_adr_writer` can execute only `apip_review.operation`; it receives no direct table access.
- The non-login, non-inheriting, non-BYPASSRLS executor owns the operation function.
- Every operation uses the verified transaction-local subject.
- Specialists must be currently approved, unexpired, and opted into the directory on every protected request.
- Open queue responses contain only a short non-identifying case reference, revision, and creation time.
- Full snapshots are available only to the owner or the currently assigned eligible specialist.
- Withdrawal and specialist revocation block subsequent specialist reads.

## Local evidence

`scripts/review-postgres.test.ts` installs the migration with a realistic non-superuser migration role and verifies narrow grants, RLS, exact-revision consent, idempotent creation, claim/release, cross-specialist denial, messages, assessment immutability, withdrawal denial, and administrator separation.

Passing checks on 2026-11-12:

- `node --import tsx --test scripts/review-postgres.test.ts`
- `npm run lint`
- `npx tsc -p tsconfig.node.json --noEmit`
- `npm run build`

The build retains the existing large-chunk warning; this milestone does not alter bundling.
