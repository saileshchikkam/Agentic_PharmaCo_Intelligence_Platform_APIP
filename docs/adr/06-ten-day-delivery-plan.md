# Dependency-aware ten-day ADR delivery plan

Status: **estimate/proposal, not a record of completed development**. ADR-0 is the only completed phase. Do not start ADR-1 without separate authorization. No phase may infer that its predecessor passed from a date, file's existence or this plan.

## Capacity and critical path

Planning assumption: one primary implementer with 8 focused hours/day for 10 calendar days, 80 hours total; 60 hours (75%) ADR and 20 hours (25%) MedAssist in a separate conversation. These are capacity assumptions, not a guarantee of availability. If fewer hours are available, re-estimate or accept a reduced demonstration. Parallel conversations do not multiply one person's capacity. Clinical reviewer availability is not assumed.

Relative Day 1 is ADR-0. If the current date is accepted as Day 1, the illustrative window is **2026-11-03 through 2026-11-12 inclusive** (Asia/Kolkata); these are targets, not future history entries. Starting implementation later without moving the deadline reduces remaining time.

Critical path: **ADR-0 contracts → ADR-1 session/policy + atomic versioned storage → ADR-2 confirmed proposals/validation → ADR-3 permitted-corpus retrieval → ADR-4 grounded artifacts/restart-safe orchestration → ADR-5 human review/export/dashboard → ADR-6 integrated regression/demo**. Source rights/clinical-relevance review begins as an operator task at ADR-1, in parallel with engineering; do not wait until Day 5 to discover no usable source exists.

The UI skeleton/client can be designed after ADR-1 contracts stabilize, but no screen may pretend future APIs work. Existing wrappers, account forms and intake make the estimate possible; rebuilding the design system, auth stack or MedAssist is outside it. The schedule is **high risk** and has no full spare day; protect Days 9–10 as integration/contingency rather than adding features.

All target paths below are **proposed future files**, unless labeled existing. Group migrations follow [database strategy](02-domain-and-database-design.md). Phase checks use fictional temporary databases and injected providers, never official/heldout MedAssist evaluations.

## ADR-0 — Day 1, 6 ADR hours

Dependencies: repository access and actual inspected source. Deliverables: the ten files in this directory and [dated documentation outcome](../history/2026-11-03.md). Acceptance: statuses distinguish implemented/experimental/planned; module, DB/API, retry/access, RAG, screen and phase contracts reconcile; links/format/scope checked; no code/provider/data/Git mutation.

Integration evidence: static trace from existing account/draft contracts to proposed APIs; PR #2 metadata and runtime FTS capability only. No application test pass claimed. Risk: inherited outdated documentation; mitigate with source inspection and explicit conflicts. Rollback: remove only new ADR-0 documents if rejected; preserve pre-existing work. Next: user decides whether to authorize ADR-1.

## ADR-1 — Days 2–3, 12 ADR hours

Entry gates: recheck dirty/staged state and selected integration baseline; verify Node 24, account schema version 2 and existing account tests against disposable data; confirm local-only/fictional scope; coordinate shared file owner; inspect this architecture against any intervening changes. Decide operator bootstrap account and reviewer provisioning mechanism without inventing a real clinician role.

Exact target files:

- New `shared/adr/domain.ts`, `shared/adr/schemas.ts`, `shared/adr/errors.ts`, `shared/adr/README.md` for strict case/missingness/command schemas.
- New `database/adr/README.md`, `database/adr/migrations/001-foundation.sql`, `server/adr/migrate.ts`, `server/adr/repository.ts`, `server/adr/cases.ts`, `server/adr/policy.ts`, `server/adr/audit.ts`, `server/adr/idempotency.ts`, `server/adr/router.ts`, `server/adr/README.md`.
- New `server/account-session.ts` (controlled extraction of session verification), `scripts/adr-provision-role.ts`, `scripts/adr-foundation.test.ts`, `scripts/adr-access.test.ts`.
- Shared-owner changes to existing `server/local-account.ts`, `server.ts`, `package.json`, `bun.lock`, `tsconfig.node.json`; only enough to register router/session seam, pin runtime schema validator and check shared/backend types. Inspect actual server type configuration before extending it.
- Existing guides `database/local-development.md`, `docs/architecture.md`, `docs/development.md`, `docs/README.md`, `docs/history/README.md`, `CHANGELOG.md`, and current-date history; update this directory's status after real evidence. Later phases similarly update affected subsystem docs/history with implementation, not plans as completed events.

Deliverables: create/list/retrieve/patch cases, exact source ledger, normalized medicine/event projections, archive/reopen policy, role/grant seam, idempotency/audit transactions and additive migration runner. Legacy draft APIs unchanged; explicit import mapping/receipt can land here if within 12 hours, otherwise defer migration UI while preserving old drafts. No automatic import.

Acceptance/integration tests: two-owner HTTP create/save/read/edit isolation; fake header/role cannot authenticate; active grant+reviewer role required; unauthorized nested IDs denied; exact whitespace/Unicode/null/false/age-zero; revision race; response-loss replay/conflicting key; audit-failure rollback; empty/version-2 upgrade/too-new refusal; restart and consistent backup/restore; account/profile tests remain passing. Ensure cookie actually reaches `/api/account/adr` and production route disabled.

Risk: largest foundational change, auth refactor/shared-file conflict and SQLite migration mistakes. Cut import convenience first. Rollback: disable new ADR router/flag, keep additive tables and old account/drafts; verified backup restore only with writers stopped. Stop before ADR-2 if persistence/access fails.

## ADR-2 — Day 4, 6 ADR hours

Dependencies: verified ADR-1 API/storage/policy; schema dependency installed and checked. Target files: `shared/adr/agents.ts`, `server/adr/reporting.ts`, `server/adr/validation.ts`, `server/adr/proposals.ts`, `server/adr/providers/types.ts`, `server/adr/providers/unavailable.ts`, `server/adr/providers/ollama.ts`, `server/adr/prompts/reporting.v1.txt`, `server/adr/prompts/registry.ts`, `database/adr/migrations/002-agent-executions.sql`, `scripts/adr-reporting.test.ts`, `scripts/adr-validation.test.ts`, `tests/adr/extraction-fixtures.json`. Extend ADR router/repository only, via ADR owner.

Deliverables: source-span-validated proposals and manual fallback; atomic owner accept/edit/reject; version-bound deterministic findings; persisted execution journal usable by later worker. Local provider adapter remains off until model availability/licence and ADR-specific fixtures are verified. No live hosted calls assumed.

Acceptance: provider-injected tests reject invented fields/quotes/paths, unsupported language and malformed output; accepted proposal never becomes confirmed without owner action; stale proposals rejected; missingness/partial-date chronology checks deterministic; English/Telugu-script/transliteration/mixed fixture results separate; manual workflow complete with unavailable provider. Integration: original → proposal → decision → new version → validation, with audit on each transition and cross-owner denial.

Risk: model semantic quality and late schema expansion. Cut optional model adapter activation before source/confirmation controls. Rollback: disable reporting provider, retain manual entry/deterministic validation and immutable artifacts. No clinical assertions.

## ADR-3 — Day 5, 6 ADR hours

Dependencies: verified ADR-1 isolation and ADR-2 confirmed input contract; selected source rights and review status. Target files: `knowledge/adr/README.md`, `knowledge/adr/manifest.v1.json`, `knowledge/adr/documents/` (only individually permitted small source text files named by content hash), `server/adr/corpus.ts`, `server/adr/knowledge.ts`, `server/adr/chunking.ts`, `database/adr/migrations/003-knowledge.sql`, `scripts/adr-index-corpus.ts`, `scripts/adr-knowledge.test.ts`, `tests/adr/retrieval-fixtures.json`.

Deliverables: versioned registry/chunks/FTS5, deterministic literal queries/top-k, citations with exact hashes/sections, no-evidence state and withdrawal handling. No download/indexing during ADR-0. Nonclinical fixture files, if used, belong under `tests/adr/corpus/` with explicit fixture status, not approved medical documents.

Acceptance: 12 query fixtures resolve expected chunks or abstain, empty query never picks a drug, combination products not conflated, ranking stable, every citation resolves correct version/hash/quote, pending/withdrawn sources excluded, injected source instructions inert, no case narratives indexed. Integration: confirmed case → scoped retrieval → authorized citations endpoint → source withdrawal invalidates result.

Risk: source permission and qualified review availability. If not ready, demonstrate fixture-only RAG and record medically grounded scope as **incomplete**; never call it a fully medically grounded MVP. Rollback: deactivate corpus version and rebuild index from previous approved manifest; preserve immutable citation history.

## ADR-4 — Day 6, 6 ADR hours

Dependencies: verified ADR-2 execution/proposal/validation and ADR-3 retrieval/citation contracts. Target files: `server/adr/analysis.ts`, `server/adr/orchestrator.ts`, `server/adr/worker.ts`, `server/adr/prompts/analysis.v1.txt`, `scripts/adr-orchestration.test.ts`, `scripts/adr-analysis.test.ts`, `tests/adr/grounding-fixtures.json`. Extend execution migration before first application if still unapplied, otherwise add `database/adr/migrations/004-workflow.sql`; never rewrite an applied checksum. Shared owner registers worker startup/shutdown in `server.ts`.

Deliverables: direct function orchestration, bounded queue/lease/retry/cancel, stale-result rejection, deterministic extractive analysis and optional provider preview; restart recovery and visible execution history. No self-HTTP calls, unconstrained agent tools or legacy causality.

Acceptance: 12 grounding/outage/injection cases, unknown citation rejection, no clinicalConclusion, exact source excerpts, deterministic fallback, max two attempts, Retry-After bounded, edit/revoke/cancel/withdraw during run prevents publish; DB failure cannot leave succeeded artifact without audit. Integration: save/confirm → validate → retrieve → analyze → restart and inspect artifacts, with manual continuation when provider off.

Risk: asynchronous failure modes. Cut optional paraphrase/generative analysis first; extractive summary and execution correctness stay required. Rollback: stop worker, mark interrupted jobs visibly, retain manual deterministic endpoints and artifacts; never falsely mark failed runs complete.

## ADR-5 — Days 7–8, 12 ADR hours

Dependencies: verified API contract and ADR-4 current/stale/error behavior. Target files: `src/features/adr/workspace/README.md`, `AdrApplication.tsx`, `client.ts`, `CaseList.tsx`, `CaseEditor.tsx`, `CaseDetail.tsx`, `ProposalPanel.tsx`, `ValidationPanel.tsx`, `CitationsPanel.tsx`, `ExecutionPanel.tsx`, `ReviewPanel.tsx`, `ExportPanel.tsx`, `Overview.tsx`, `adr.css` (all in that directory); `server/adr/review.ts`, `server/adr/export.ts`, `server/adr/statistics.ts`, `database/adr/migrations/005-review-export.sql`, `scripts/adr-review-export.test.ts`, `scripts/adr-statistics.test.ts`, `scripts/adr-workspace.browser.mjs`. Shared owner updates existing `src/App.tsx` and only required global styles/routes. Reuse existing Material components; do not rewrite ReportReactionView into a combined research dashboard.

Deliverables: all ten screens/sections in [dashboard workflows](05-dashboard-workflows.md), explicit reviewer grants/decisions, faithful JSON and escaped printable HTML, deterministic scoped overview. UI may begin in spare ADR time after Day 3 contract freeze, but its acceptance depends on actual backend integration.

Acceptance: real HTTP-backed browser flow from empty account to reviewed fictional export; unauthorized reviewer/self-review blocked; edits invalidate approval; long/multiple/unknown/Telugu records survive JSON round-trip and printable layout; HTML injection inert; source/confirmation/reviewer data separate; cohort counts match independently computed fixtures; keyboard/focus/reduced-motion at 360/820/1440 plus 320 overflow check. Integration: owner and separate assigned reviewer sessions, revocation and account change mid-request.

Risk: highest UI breadth and custom-element/browser test effort. Cut chart embellishment, import UI and generated PDF before any required workflow; show count summaries rather than elaborate analytics. Rollback: retain legacy draft route, disable new navigation entry, keep API records; no hard deletion of cases.

## ADR-6 — Days 9–10, 12 ADR hours (includes contingency)

Dependencies: demonstrated ADR-1–5 checks, selected demo corpus status and feature matrix, shared-owner integration checkpoint with the other conversation. Target files: `scripts/adr-integration.test.ts`, `scripts/adr-demo-smoke.mjs`, `tests/adr/demo-cases.json`, `docs/adr/demo-runbook.md`, `docs/adr/verification.md`; phase/status docs, actual-date history and changelog. Fix only failures in ADR-owned code; shared fixes go through owner. No release/deployment action implied.

Deliverables: clean setup/runbook, seeded fictional scenarios, feature/limitation inventory, measured latency/failed-run evidence, recorded UI coverage, offline provider-outage mode and repeatable demo with consistent database backup. An optional confirmed MedAssist handoff can be shown only if separately authorized and its contract tests pass; direct ADR remains sufficient.

Acceptance: relevant account/legacy-boundary regression, strict frontend+backend/shared type checks, production build, ADR unit/HTTP/integration/browser suites; restore demo database and rerun user workflow; no unexpected provider calls; unchanged sealed artifacts/default extractor/Model B/emergency files verified against agreed baseline. Do not reread or rerun protected heldout evaluations. Inspect [PR #2](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP/pull/2) status read-only; leave draft/unmerged. No public/clinical readiness claim.

Risk: compressed integration and machine/setup failures. Rollback: use last verified local fictional demo snapshot with a visible reduced feature inventory; record failures. Do not present a prerecorded mock as a functioning workflow.

## Check strategy for implementation phases

Current commands include `bun run lint`, `bun run build`, and focused `node --import tsx --test ...` scripts from [development setup](../development.md). Frontend lint is not whole-server checking. Establish an explicit strict backend/shared type check in ADR-1 and record its exact command after inspecting compiler configuration. Run only relevant nonprovider tests and fictional ADR fixtures; never invoke broad training/qualification runners by glob. Browser checks use installed available browser tooling without a large download. API tests inject providers to guarantee no network inference.

For every phase, record actual check commands/results, temporary database setup, provider mode, evidence files, failures and limitations in `docs/adr/verification.md` once created. Missing predecessors mean stop that dependent phase. Documentation, whitespace/links/staged-scope checks accompany changes. Future commits follow task-specific authorization; ADR-0's no-commit restriction is not permission for an implementation phase to push automatically.

## Delay triggers and cuts

- End Day 3: if access/persistence/restart fails, stop agents/UI expansion and repair ADR-1. A dashboard over unsafe storage is not acceptable.
- End Day 4: if provider quality/latency fails, keep provider off; manual confirmed entry plus visibly unavailable extraction. This preserves workflow but report the AI feature gap.
- End Day 5: if no approved corpus, use explicit nonclinical fixtures/no-evidence and mark medically grounded acceptance incomplete. Do not invent references to meet the deadline.
- End Day 6: freeze contract additions; use extractive analysis. Cut paraphrase and all stretch integrations.
- End Day 8: stop feature work; fix only end-to-end/privacy/data-loss/demo blockers. JSON export, review versioning and deterministic statistics cannot be cut while claiming the requested minimum workflow complete.

Cut order: visual effects/charts → OCR/photos/terminology → vector search → custom PDF → automatic legacy import → optional MedAssist handoff → optional hosted/local generation. Never cut ownership/role checks, original/proposal separation, human confirmation/review, versioned persistence/audit, citation truthfulness or explicit reduced-scope disclosure. If required MVP behavior is still missing, call the result an incomplete/reduced academic demo and document it honestly.
