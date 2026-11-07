# Phase 3B private prototype policy and implementation checkpoint

2026-11-08. **In progress, not a completed delivery.** Starting clean baseline is Phase 3A `86920c097c0b02dfb63270713922039161f58cd6`; isolated branch is `codex/adr-phase3b-specialist-identity`. PRs 6 and 7 must remain draft and unmerged.

## Explicit policy approval

The project owner approved one independent, manually authorized administrator for fictional applications only. That administrator must use an existing confirmed synthetic Auth account separate from applicants. The exact verified subject UUID and auditable bootstrap operation require a separate private selection and explicit approval. No bootstrap identity has been selected or granted by this task.

P03 categories are Pharmacovigilance Associate, Pharmacist, Clinical Reviewer and Pharmacovigilance Coordinator. Qualification and organization information is synthetic and manually checked. Self-declaration never proves professional status. Other categories are not approved.

Authorization lasts 30 days. Expiry denies specialist capabilities; renewal requires an explicit administrator operation, never automatic renewal. P11 denies self-approval. Dual-role administration does not confer patient access. P12 requires current database authorization on every privileged request and immediate denial of subsequent requests after committed suspension/revocation. Approval, denial, suspension, revocation and necessary audit records must commit atomically. P13 limits administrators to identity administration.

Approved specialists with no assignment receive no patient case, revision, narrative or PDF access. Registration, email and user_metadata confer no privilege. Phase 3C assignments, review and sharing remain excluded.

## Separate approvals still required

- Hosted migration approval was separately obtained and applied successfully as 20261107195900. No further migration is authorized by this checkpoint.
- Private choice of exact existing confirmed synthetic administrator subject UUID and approval of its one-time bootstrap operation.
- No live privileges may be inferred from disposable fixtures.

## Reconciled implementation checkpoint — 2026-11-08

The initial partial implementation described in the interrupted session is now superseded by the [actual delivery report](3b-implementation-and-verification.md). It preserves the approved policy above and records completed UI/API/PostgreSQL/fixture/security/browser work, exact applied migration checksum and version, launcher correction, test results, file walkthrough and remaining live gates.

Administrator bootstrap remains unauthorized. Hosted application readiness and the applicant browser workflow now pass after the [focused approved repair](3b-hosted-specialist-repair.md). Fixture approvals do not activate live privileges. Phase 3C is unstarted.
