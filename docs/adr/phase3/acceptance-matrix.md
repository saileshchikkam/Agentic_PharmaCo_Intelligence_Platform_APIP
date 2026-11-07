# ADR stage acceptance matrix

All criteria are proposed and unrun. [Master](../../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md) owns scope. [Contracts](roles-consent-and-revisions.md) owns the data/API details.

## Common gate

Obtain explicit stage authorization and policy decisions. Preserve worktrees, private configuration, SQLite and original template. Test additive migrations in disposable fixtures before an explicitly authorized development apply. Keep actor/resource authorization, RLS, transaction identity, idempotency, immutable history, audit and revocation enforceable.

For each code stage run affected Node/PostgreSQL/Auth/PDF regressions, both TypeScript checks and production build. Verify actual Chrome at 320/360/820/1440px, keyboard, themes, reduced motion, account switching and refresh/Back. Leave a working private preview URL/backend mode or report its exact blocker. No generated mockup counts as runtime evidence.

## 3A — Patient management

- Scope/screens are owner list/filter/detail, historical view, current guided edit and approved lifecycle confirmations.
- Dependencies are baseline backend and P01/P08/P09/P17 for the relevant writes.
- Data/API are management, ready receipts, summary/search projections, deletion requests and owner /adr-cases facade with explicit historical snapshot/PDF routes.
- Risks are IDOR, summary drift, cursor leakage, stale readiness and archive confused with erasure.
- Test two owners/anonymous, pre-3A cases, Unknowns, pagination/filter ordering, tampered cursors, save/ready/archive races and independent current/historical PDF reopening.
- Accept owner-only results, immutable history, exact revision exports and atomic approved metadata. No hard delete, specialist grants, AI or submission.
- Preview must demonstrate list → edit → history → original PDF at all four widths.

## 3B — Specialist foundation

- Scope/screens are own application/status, private approval queue/detail and current capability display.
- Dependencies are stable 3A and P02/P03/P11/P12/P13.
- Data/API are applications, approval events, effective authorizations, controlled administrator grants and specialist/admin decision endpoints.
- Risks are self-approval, forged metadata, stale JWT roles and broad administrator narrative access.
- Test applicant/patient/specialist/approver/anonymous, captured-token role revocation, expiry, direct SQL/Data API and audit rollback.
- Accept independent approval and immediate future-request revocation; approved identity without assignment sees zero cases.
- Exclude case sharing/review and autonomous credential verification. Private preview demonstrates application → human decision → capability → revocation.

## 3C — Assignment and human review

- Scope/screens are disclosure/recipient confirmation, patient review timeline, assigned inbox, guided left review/right actual PDF, clarification and final human review.
- Dependencies are 3A/3B and applicable P04–P16/P22.
- Data/API are consent events, submissions, assignments, exact revision grants, draft/final professional records, clarification and audited review/PDF commands.
- Risks are private queue leakage, unshared revisions, confused authorship and revocation races.
- Test two patients/two specialists, nested IDs, direct raw snapshot denial, new edits, withdrawal/reassignment during PDF generation, concurrent finalize/publish and audit failure.
- Accept consent AND approval AND assignment AND exact grant; preserve patient facts and original form. No government submission, autonomous causality or medication recommendation.
- Private preview demonstrates consent through review/clarification and withdrawal at all four widths.

## 3D — Integration gate

- Scope is verification of implemented 3A–3C screens/contracts, with repairs only for demonstrated defects.
- Dependencies are approved policies and preceding stage evidence; no new schema/API is proposed by default.
- Risks are incomplete audit, missed direct-database access and mock results presented as hosted evidence.
- Test full actor/action/resource matrix, current/revoked sessions, immutable snapshots, restart, test-client interruption, identity cleanup, receipts, audit rollback and fixture backup/restore where schema changed.
- Accept all required PASS evidence with actual screenshots and independent PDF checks. Separate fixture/hosted and client/managed-outage claims.
- Exclude new features, clinical approval and public release. Both private previews remain available.

## 3E — Analytics

- Scope/screens are operational dashboard, approved internal cohorts, external explorer and source/release details.
- Dependencies are 3D and P18/P19.
- Data/API are source/release/ingestion/deduplication/metric/cohort/query records and separate internal/external analytics namespaces.
- Risks are private-draft inclusion, reidentification/differencing, duplicate/follow-up counts and unsupported incidence.
- Test deterministic fixtures, denominator/units, source drift, ingestion replay/rollback, permissions, export/suppression and four-width displays.
- Accept approved cohorts/rights and reproducible metrics with provenance/limitations. No LLM arithmetic, global patient drill-through or public private-data dashboards.
- Preview must show source separation and forbidden access cases.

## 3F — Evidence and suggestions

- Scope/screens are reviewed public evidence drawer and specialist approve/edit/reject suggestions.
- Dependencies are 3D, approved corpus, P19/P20 and valid case grants; reuse 3E registry where appropriate.
- Data/API are versioned corpus/documents/chunks, retrieval receipts, suggestion/disposition records and authorized evidence/question endpoints.
- Risks are injection, fabricated citations, stale evidence, exfiltration and unreviewed advice.
- Test scope leakage, evidence absence, wrong jurisdiction, citation membership, provider failure/limits and revocation mid-request.
- Accept approved evidence or abstention, minimized inputs, human approval before clarification publication and manual fallback.
- Exclude direct AI-to-patient messages, automatic training and clinical decisions. Private preview shows provenance and every disposition at all four widths.

## Phase 4 — Governed orchestration

- Scope/screens are approved finite runs, activity/provenance, human checkpoints and cancellation.
- Dependencies are validated underlying stages and P21.
- Data/API are versioned definitions, bounded runs/steps, receipts, approvals and private run/status/cancel commands.
- Risks are confused-deputy access, cross-case memory, unbounded retries and execution after withdrawal.
- Test duplicate execution, crash/restart, budgets/deadlines, denied tools, revocation and approval/cancel races.
- Accept current actor/case/revision/consent scope, human control, durable replay and a verified cancel path.
- Exclude unrestricted agents, autonomous clinical decisions, regulator submission and retraining. Supply a private run/checkpoint/cancel preview.

## Evidence format

Each gate records approved policies, source commit, migration/role checks, exact executed commands/results, fixture versus hosted scope, screenshots, PDF/source hashes where relevant, preview URL/mode and failures. Outcomes are PASS, FAIL or BLOCKED with reasons. Engineering checks do not establish clinical or public-release approval.
