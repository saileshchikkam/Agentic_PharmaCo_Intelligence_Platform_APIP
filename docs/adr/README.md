# ADR-0 — Architecture and delivery blueprint

**2026-11-07 implementation update:** [Phase 3A owner management/history/PDF](phase3/3a-implementation-and-verification.md) is implemented and verified separately from the historical ADR-0/1A notes below. Lifecycle and professional privileges remain policy-gated.

**Current planning source.** The [ADR Phase 3–4 master blueprint](../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md) and [package index](phase3/README.md) reconcile the interrupted Phase 3 drafts. New stage scope is proposed and unimplemented; the older ADR-0 plan below remains historical.

Status: **ADR-0 planning complete; ADR-1A guided intake and native PDF/reveal checked for English fictional cases, with explicit export limits**. Inspected 2026-11-03 (Asia/Kolkata). APIP means **Agentic Pharma Co-intelligence Platform**. This directory is the canonical ADR prototype architecture and phase tracker, subordinate to the [product](../product.md), [contributor instructions](../../AGENTS.md) and [hospital requirements register](../hospital-requirements.md).

Current implementation: [ADR-1A checkpoint](09-adr-1a-checkpoint.md), including [original template and widget inventory](templates/README.md). The user authorized the narrower guided-intake/PDF slice. Unsupported scripts and multiple seriousness selections remain explicit limits; unconditional ADR-1B progression remains NO-GO. No commits, pushes, merges or deployment.

## Read in order

1. [Repository audit](00-repository-audit.md): current evidence, reusable code and inspection gaps.
2. [System architecture](01-system-architecture.md): scope, module boundaries, sequence and state diagrams.
3. [Domain and database](02-domain-and-database-design.md): versioned facts, ownership, tables and migration design.
4. [API and agent contracts](03-api-and-agent-contracts.md): proposed typed interfaces, endpoints and authorization.
5. [LLM and RAG](04-llm-rag-design.md): provider isolation, reference corpus, grounding and fallback.
6. [Dashboard workflows](05-dashboard-workflows.md): responsive Material 3 intake, review and export.
7. [Ten-day delivery plan](06-ten-day-delivery-plan.md): dependencies, exact target files, estimates and cuts.
8. [Parallel development protocol](07-parallel-development-protocol.md): ownership and integration checkpoints.
9. [Risks and acceptance](08-risks-and-acceptance-criteria.md): release gates and ADR-1 decision.

All new types, tables, paths and endpoints described as proposed are **contracts to implement**, not available services. Existing behavior is identified explicitly in the audit. This is an academic software prototype, not clinical validation or regulatory readiness.

## Phase tracker

- ADR-0: documentation complete; static inspection, documentation checks and an in-memory runtime capability query only. No application tests rerun.
- ADR-1A: intake backend and guided UI implemented; official-template/PDF checkpoint blocked. See the current checkpoint; the broader ADR-1 architecture remains a proposal.
- ADR-2: not started; requires verified ADR-1. Reporting proposals and deterministic validation.
- ADR-3: not started; requires verified ADR-1/2 contracts. Approved-source retrieval.
- ADR-4: not started; requires verified ADR-2/3. Grounded analysis and durable bounded orchestration.
- ADR-5: not started; requires stable ADR-1 through ADR-4 contracts. Integrated review, export and dashboard.
- ADR-6: not started; requires verified ADR-5 and preserved MedAssist boundaries. Integration and demonstration gates.

Only this tracker owns ADR phase status. The main roadmap remains the platform-wide tracker; reconcile its navigation in the next authorized documentation edit rather than create another task list.

## ADR-0 scope and instruction reconciliation (historical)

The ADR-0 request permitted **new planning/architecture documents only** and forbids commits/pushes/branches. That overrides the standing automatic completion workflow for this task. Existing source, root README, main documentation index, changelog, decisions and roadmap are unchanged. A new [dated history entry](../history/2026-11-03.md) records the documentation outcome; adding its link to the existing history index is deferred under the same restriction.

Older product/model notes describe English-only/no-paid-service preferences; current AGENTS instructions specify English and Telugu fictional testing and an INR 500 monthly ceiling. Use the current instructions: no spending needed for this plan, local-first implementation, separately labeled English, Telugu-script, transliterated and mixed-language fixtures. English can be the assessed demonstration path; Telugu interpretation/clinical wording is not qualified and must fall back to exact-text manual entry. Do not quietly claim bilingual extraction readiness. Record any later scope change explicitly.

Data defaults to **fictional only**. De-identified real narratives are not automatically safe or authorized; omit them from this ten-day prototype. Mahesh P's clinical review is a separate human gate, not supplied by these AI-assisted engineering checks.

## ADR-0 decision (historical)

**GO for the proposed ADR-1 fictional, loopback-only engineering scope after separate authorization; NO-GO for clinical guidance, public deployment or official submission.** Architecture readiness is distinct from implementation acceptance. Verify the ADR-1 entry gates in [risks and acceptance](08-risks-and-acceptance-criteria.md) before editing code. No automatic transition to ADR-1 is authorized.
