# ADR-1B Phase 3 copy-ready stage prompts

**2026-11-08 implementation update:** [Phase 3B delivery and remaining live gates](3b-implementation-and-verification.md) records the actual identity/application/admin contracts, approved 30-day fictional policy, applied migration and fixture evidence. Administrator bootstrap and privileged hosted browser verification remain blocked. Earlier proposal text below does not override the implemented contracts or authorize Phase 3C. [Gated Phase 3C prompt](3c-next-implementation-prompt.md).

Reconciled supporting source from the interrupted planning session. The [master blueprint](../../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md) owns the expanded stage boundaries.

**Planning artifacts only, prepared 2026-11-07.**
Use a prompt only after the user separately authorizes that implementation stage and supplies its required policy decisions. Creating this document does not authorize application changes, migrations, privileged accounts, commits, merges or deployment.

Read [the requirements and P01-P17 approval register](requirements-and-stages.md) and [the proposed contracts](roles-consent-and-revisions.md). These prompts implement one stage at a time.

## Phase 3A

Copy the complete block below into the separately authorized implementation task.

```text
APIP ADR-1B Phase 3A — Patient ADR Case Dashboard and Lifecycle

Implement Phase 3A only after this task is explicitly authorized. Start from the reviewed codex/adr-phase3-master-blueprint documentation branch,
a descendant of backend 5c20ede3b9a2548646674e15a3d22914f4865a4e.
Read docs/architecture/ADR_PHASE3_MASTER_BLUEPRINT.md first. PR 6 remains draft and unmerged.

Read AGENTS.md, docs/product.md, docs/architecture.md,
docs/layers/adr-reporting.md, docs/development.md,
database/hosted-verification-2026-11-07.md and:
- docs/adr/phase3/requirements-and-stages.md
- docs/adr/phase3/roles-consent-and-revisions.md

Inspect Git/worktrees, active server process identity, migrations, current routes,
account handling and repository boundaries first. Preserve dirty work, SQLite
databases, ignored configuration, the original template and research artifacts.
Use an isolated approved Phase 3 feature branch/worktree when needed. Do not
merge PR 6, recreate existing branches or move another developer's checkout.

Approval inputs
Obtain the recorded P01 readiness/confirmation decision, P08 archive/request
decision, P09 retention/hold handling and P17 SQLite parity decision before the
corresponding writes. Ask only for missing concrete decisions. Read-only patient
dashboard work can be scoped independently. Unapproved actions stay disabled
at API and UI. Do not infer consent, implement hard deletion or enable review.

Outcome
An authenticated patient can list, search, sort, filter and page through their
own ADR cases; open detail; resume/edit the latest intake in the existing guided
experience; view immutable historical revisions; and preview/regenerate/download
an explicitly selected original PvPI revision. Implement approved readiness,
archive/restore and deletion-request metadata without modifying intake history.

Implementation sequence
1. Record the approved 3A subset and map acceptance criteria to existing code.
2. Keep AccountProvider, the current auth/session adapter and server identity
   verification. Keep X-APIP-Account guards in clients/tests; derive ownership
   from the verified server principal.
3. Extend the existing case repository/service using focused list, snapshot
   and management methods. Preserve existing guided API compatibility.
4. Prepare additive versioned migrations for approved metadata, summaries,
   confirmations, receipts and audit. Do not edit applied migrations or run DDL
   at startup. Test fresh apply, existing-schema upgrade, rollback and restore
   using disposable fixtures. Hosted application requires separate explicit
   development-project approval.
5. Make list filters run server-side before cursor pagination. Index owner and
   selected sort keys; normalize only approved confirmed summary fields.
   Preserve null/Unknown values and the existing 100-case/500-revision/20-medicine
   limits. Validate cursor/filter/sort combinations and enforce ownership again.
6. Add owner-only historical snapshot and explicit historical PDF contracts.
   Keep the existing current-revision PDF endpoint's stale-revision protection.
   Generate from the selected immutable revision with the original template,
   existing mapping, reserved-field rules and bounded private PDF runtime.
7. Implement approved lifecycle commands with management versions, idempotency
   and atomic audit. Bind readiness confirmation to the exact intake revision.
   Archive is reversible metadata. A deletion request is a pending request,
   never deletion completion. No permanent DELETE route is added.
8. Backfill existing cases conservatively. No existing report becomes ready,
   submitted, consented, reviewed or archived by inference. Keep summary updates
   consistent for old and new intake callers.
9. Build My ADR Reports, case detail and read-only revision screens using
   PreviewLayout and current Material Web components. Reuse AdrLanding,
   GuidedWorkspace, live PDF preview and reveal. Keep current deep links.
10. Preserve the glass header, logo alignment, Back, footer, themes, keyboard
    behavior and reduced motion. At 320/360px use readable cards and an explicit
    preview toggle; no horizontal scrolling is needed to finish a task.
11. Preserve local SQLite development independently, with approved versioned
    metadata migrations if those writes are included. Cloud failures never
    fall back silently to SQLite. No specialist grants or workspace APIs ship.

Tests and acceptance
- Two owners and anonymous access; foreign IDs and malformed cursors fail.
- Search/filter/sort/paging includes pre-3A cases and leaks no foreign counts.
- Latest edits create a new immutable revision through the existing guided path.
- An explicitly selected historical snapshot stays read-only; historical PDF
  fields and revision match it exactly, while current PDF stale checks remain.
- Explicit Unknown and original statements survive save/resume and backfill.
- Stale ready/archive/restore commands fail atomically and exact retries do not
  repeat events. A new intake save invalidates old ready confirmation.
- Archive/restore preserves history and revives no permission. Hard deletion
  remains unavailable.
- Session switching clears selected cases, PDF URLs and transient answer state.
- Test migration upgrade and rollback; check RLS, role/function/column grants.
- Test Chrome at 320, 360, 820 and 1440px, keyboard, dark/light, reduced motion,
  browser history, failures and long medicine names.
- Independently reopen official PDFs, checking native fields/appearances,
  instruction page, reserved blanks and genuine overflow.

Run stage-specific tests plus relevant existing ADR/Auth/ownership/PDF tests.
Use the configured Python environment. Use node --import tsx --test with explicit
relevant files, including adr-guided.test.ts, adr-cloud-wire.test.ts,
adr-postgres.test.ts, adr-connection-loss.test.ts and cloud-auth.test.ts.
Run bun run lint, backend TypeScript using tsconfig.node.json with build metadata
outside the checkout, and bun run build. Do not discover/run protected model
research suites or invoke live inference.

Preview requirement
Preserve SQLite on port 3000 and the hosted preview on port 3100. Identify any
listener before touching it. Use the verified worktree and an isolated private
runtime. Show actual Home → Sign-in → Dashboard → ADR Cases → Guided edit →
History → Original PDF. Capture desktop/mobile evidence. Report actual URLs
and backend modes, or the precise access blocker.

Delivery
List changed files, migrations, approved policy IDs, actual tests, screenshots,
sample PDF and unresolved issues. Update stage evidence and dated history.
Follow the current task's Git authorization; do not commit/push without stage
authorization. Keep PR 6 draft/unmerged. Stop before 3B.

Do not change MedAssist research/safety, Google OAuth, intake semantics, template
mappings, professional fields or clinical behavior. Do not add RAG, agents,
causality scoring, recommendations, hospital integrations or public deployment.
```

## Phase 3B

Current handoff: [implemented 3A subset and actual hosted evidence](3a-implementation-and-verification.md). The prompt below requires a new explicit implementation task and the listed policy approvals. It does not authorize activation now.

```text
APIP ADR-1B Phase 3B — Approved Specialist Identity and Access Foundations

Implement only the separately authorized Phase 3B stage. Start from the reviewed
codex/adr-phase3a-patient-case-management delivery commit, verifying remote SHA
and lineage from blueprint 7c2db5ec8e09c4461f10205ed3166a34affc3f76. Preserve any
unpublished work; use a dedicated codex/adr-phase3b-specialist-identity branch.
Read docs/adr/phase3/3a-implementation-and-verification.md, including its working
private hosted/SQLite previews and unapplied policy decisions. Read the Phase 3 plan,
contracts, current AGENTS/product/architecture/layer guides and verified 3A
checkpoint. Verify the starting branch/commit and preserve all existing work.
Keep PR 6 draft and unmerged.

Before privileged activation, require explicit P02/P03/P11/P12/P13 decisions:
named approval authority, independent professional verification procedure,
self-approval/conflict rules, immediate revocation behavior and administrator
scope. Do not create an initial administrator or real specialist grant without
the approved provisioning procedure. Missing policy input is a blocker for that
privilege, not permission to infer a role.

Ask only for the missing concrete decisions: named bootstrap/approval authority
and independent approver count; accepted professions/jurisdictions and human
evidence checks/recheck/appeal policy; conflicts/dual-role restrictions; online
revocation and in-flight ordering; administrator scope without patient access.
Do not infer that approved 3A reads/exports approved P01/P08/P09/P17 lifecycle writes.
Keep unapproved privilege mutations disabled while completing independent work.

Reuse Supabase Auth and the existing account/session adapter. Workspace selection,
confirmed email, display name and user_metadata confer no professional privilege.
Build only own application/status screens, approved private administrator
application/decision screens and current capability checks.

Propose/review additive migrations for applications, immutable approval events,
effective authorization records, administrator capabilities and audit. Use
private schemas, RLS, narrow function-owner roles, fixed search_path, exact
EXECUTE grants and transaction-scoped verified identity. Keep the API writer
non-admin and without BYPASSRLS. Browser roles cannot write approvals. Bootstrap
administrator UUIDs out of band with explicit approval and audit; never match
by email or create a second authentication system.

Implement a server capability service that consults current database state on
every privileged request. Reject pending/rejected/suspended/revoked/expired roles
and self-approval. Role changes must apply to existing sessions without waiting
for JWT refresh. Permission events and effective state update atomically.

Approved specialists with no assignment get no patient case or PDF access.
This stage does not create assignments, sharing or review records. Preserve all
owner-only patient reporting and PDF behavior. Keep privileged specialist access
unavailable in SQLite mode, with no cloud-to-local identity fallback.

Test patient/applicant/specialist/approver/anonymous actor boundaries, crafted
metadata, self-approval, privilege revocation with captured active tokens,
authorization expiry, direct Data API/SQL writes, nested application IDs,
audit rollback and existing patient regressions. Synthetic approval fixtures
must be labeled and must not claim real professional verification.

Use additive CLI-generated migrations and disposable fresh/populated-schema
fixtures first. Do not modify or replay the five applied development migrations.
Request approval for exact SQL and development target before any hosted DDL.
Preserve the restricted writer, strict verified TLS, transaction-local actor,
immutable patient revisions, 147-widget original form and current-vs-historical
PDF semantics. Test hostile owner/application IDs, self-approval, untrusted role
metadata, anonymous/direct browser execution, current-token revocation and
required audit failure with no partial approval. No specialist may read a case.

Run affected frontend/backend TypeScript, builds and regressions. Test actual
Chrome at 320/360/820/1440px, keyboard, reduced motion and both themes. Demonstrate
pending → authorized approval → specialist capability → revocation in separate
private sessions without exposing clinical data. Preserve both existing previews
and report their exact backend modes.

Deliver file/migration inventory, policy decisions, actual tests/screenshots,
privilege/RLS evidence and remaining blockers. Document history and respect
the implementation task's commit/push authorization. Stop before 3C. Do not
merge, deploy, add case access, Google changes, RAG, clinical agents or MedAssist
research changes.

Provide an exact branch/commit/PR state, working local URLs with backend modes,
per-gate PASS/FAIL/BLOCKED (fixture versus real hosted), remaining decisions,
educational walkthrough and a copy-ready 3C prompt. Commit/push only validated
stage files under the repository workflow and this new task's authorization.
Keep PR 6 and the separate 3A PR unmerged. Do not begin 3C automatically.
```

## Phase 3C

```text
APIP ADR-1B Phase 3C — Consented Assignment and Human Specialist Review

Implement only a separately authorized 3C stage from verified 3A/3B evidence.
Read the current Phase 3 requirements/contracts and preserve all existing UI,
patient snapshots, auth, migration history, original PDFs and worktrees.
Keep PR 6 draft and unmerged.

Require recorded P04/P05/P06/P07/P09/P10/P14/P15/P16/P22 decisions before sharing:
recipient selection, consent wording/scope, caregiver authority, withdrawal,
reassignment, retention, note visibility, download permission, audit visibility
and human review completion wording. Do not decide unresolved access policies
through code defaults.

Implement recipient-specific consent/disclosure preview, pinned submission,
bounded assignment, patient status tracking and a specialist inbox/workspace.
A specialist needs active approval AND current assignment AND active consent
AND an explicit revision grant for every requested resource.

Use additive versioned objects for consents/events, submissions, assignments,
revision grants, clarification records, draft/final review records, review
exports, audit and actor-scoped idempotency receipts. Apply composite ownership
FKs, RLS, immutable final records and narrow function grants. Do not widen raw
patient tables into a blanket specialist read policy. Use audited shared
projections and no patient-identity impersonation in database transactions.

Patient edits create immutable new intake revisions and remain unshared until
explicit publish-update consent. A specialist sees only granted revisions and
confirmed fields. Exclude unrelated profiles, rejected/unconfirmed proposals
and raw statements outside approved scope. Explain reporter contact exposure
in the original PDF. Keep professional notes separate from patient facts.

Reuse the original hash-verified PvPI generator and current private resource
limits. Bind specialist preview/export to assignment epoch, consent scope,
source revision and current authorization. Recheck before response bytes.
Record specialist export metadata separately using the real specialist actor.
Do not populate reserved signatures or causality fields automatically.

Implement structured plain-text review drafts, bounded information requests,
explicit patient update sharing and human finalization. Finalized records are
immutable; approved amendments append a superseding record. No prescribing,
autonomous decisions, RAG or automated causality assessment is added.

Use one tested lock order for authorization, case, submission, assignment and
draft changes. Withdrawal/reassignment/revocation, audit and receipts are atomic.
Recheck current permission before idempotent replay. Never return a stale cached
response to a revoked recipient. Required audit persistence failure prevents
sensitive delivery. No email/SMS integration or public storage is assumed.

Test two patients, two approved specialists, an unapproved applicant and an
approver. Cover nested IDOR, raw snapshot/profile leakage, unshared future
edits, multiple historical revisions, stale capabilities, self-review, role
revocation, withdrawn/reassigned access, replay after revocation, concurrent
finalize/withdraw/publish, PDF generation races and audit rollback. Verify
forbidden direct SQL/Data API access under actual restricted roles.

Preserve the Phase 2 shell, guided interface, themes and preview. Test Chrome
320/360/820/1440px, keyboard, reduced motion, account switching and failure states.
Show a real private patient request → specialist review → clarification →
patient update → human completion → withdrawal/revocation walkthrough.
Independently reopen generated PDFs and verify exact revision and template.

Deliver approved policy IDs, files/migrations, authorization matrices, audit
evidence, actual tests, screenshots and preview URLs/modes. Update history and
respect stage-specific commit/push permission. Stop before 3D and do not merge,
deploy, introduce clinical automation or alter MedAssist research.
```

## Phase 3D

```text
APIP ADR-1B Phase 3D — End-to-End Security, Audit and Integration Verification

Verify only the approved 3A-3C scope. Read their checkpoints, current policy
approval records and Phase 3 requirements/contracts. Inspect branch/worktrees,
active processes and dependency modes. Preserve both working previews,
fictional records, immutable histories, original template and research assets.
Keep PR 6 draft and unmerged.

Do not add new product features. Fix only demonstrated in-scope defects with
reviewable additive migrations when needed. Never weaken TLS, RLS, revocation,
JWT verification, actor binding or audit to force a pass.

Run the complete approved actor/action/resource matrix through the API, DB
functions and direct Data API/SQL attempts. Include pending/revoked/expired
specialist roles, metadata spoofing, self-approval, self-review, foreign nested
IDs, unshared revisions, consent withdrawal, assignment changes and cached
idempotent responses after revocation. Verify administrator approval powers
do not imply narrative access.

Test transaction rollback, duplicate commands, concurrent approval/assignment/
finalization, controlled application restart and test-client-only network
interruption. Verify no identity leakage, lost committed revision or duplicate
workflow event. Do not interrupt the managed project for other users.

Verify audit completeness and required-audit failure behavior without logging
clinical text or credentials. Test retention/hold/archive/request behavior only
against approved policy and isolated fixtures; permanent deletion remains
excluded. Rehearse backup/restore on disposable fixtures if schema changes
require it.

Verify patient dashboard → guided edit → confirmation → consent → assigned
specialist → clarification → explicit update share → human review →
withdrawal/revocation. Test Chrome at 320/360/820/1440px, keyboard, light/dark,
reduced motion, history/refresh, long content, unsaved notes and account switching.
Capture real screenshots, not generated designs.

Independently reopen original PvPI exports. Check template hash, canonical field
values, widget appearances, dates, medication rows, reserved blanks, original
instructions, readable linked overflow and exact patient/review source revisions.

Run affected Node, PostgreSQL, Auth, PDF, frontend/server TypeScript and production
build checks. Keep mocked/disposable tests separate from real hosted evidence.
Run real session expiry/refresh/revocation checks where auth behavior changed;
use private input and memory-only captured tokens, bounded diagnostics/retries
and no JWT lifetime reduction. Keep Google OAuth separately pending while disabled.

Deliver per-gate PASS/FAIL/BLOCKED, exact errors/fixes, actor-policy matrix,
audit samples containing only approved metadata, migration evidence, screenshots,
sample PDFs, preview URLs/modes and exact branch/commit/PR status. Respect current
commit/push authorization; no merge or public deployment. Give a scoped
engineering GO/NO-GO and preserve all clinical/human approval boundaries.
Stop after verification. Do not begin backend automation, RAG or agents.
```
