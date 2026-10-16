# Decisions

**Confirmed** means directly established by the user, not implemented or clinically validated. Engineering recommendations stay proposed until selected.

## DEC-001 — Mission and name

**Confirmed 2026-10-16; origin described as September 2024.** APIP means Agentic Pharma Co-intelligence Platform. Easy suspected-ADR reporting is the core; technology serves the workflow. This supersedes older APP/Pharma Intelligence naming. Original mission notes lacked reliable dates; none are invented.

## DEC-002 — Connected layers and audiences

**Confirmed 2026-10-16.** MedAssist supports the care journey; reporting/professional intelligence remains most of the scope. Direct reporting must work. Shared context retains provenance and confirmation. Manufacturers/researchers receive information only through appropriate permissions.

## DEC-003 — Strict Material 3

**Confirmed 2026-10-16.** Follow Material Design 3 and Material Web. Preserve the existing demo as design reference, not implemented product. Verify accessibility and responsive behavior.

## DEC-004 — Progressive AI and human review

**Confirmed direction 2026-10-16.** Build useful functions before coordinating Reporting, Validation, Knowledge, and Analysis agents. Preserve MedAssist's custom-ML goal while selecting the task/data before training. RAG retrieves evidence; code calculates statistics. Human confirmation/review stays explicit.

## DEC-005 — Documentation with code

**Confirmed 2026-10-16.** Keep concise, useful docs, a navigable README, layer specifications, and dated history. Update docs with meaningful code changes and commit together. Use milestones rather than a fixed-duration label; consolidate duplicate templates after preserving useful content.

## DEC-006 — Automatic completion commits and cloud backup

**Confirmed 2026-10-16.** The user authorizes routine commits and GitHub pushes after completed, checked APIP changes without repeated requests. Task-owned files and their documentation are committed together. A repository-local completion helper and post-commit hook implement the workflow; they preserve unrelated work and report blocked sync. No background file-save watcher, force-push, destructive conflict resolution, or approval bypass is authorized. See [workflow setup](../scripts/README.md).

## DEC-007 — Bilingual fictional-case evaluation

**Confirmed 2026-10-16.** The user selected English plus Telugu, using fictional cases, for the first version. Include Telugu script, transliteration, and mixed-language behavior in evaluation; do not infer Telugu capability from English results. A named pharmacy reviewer and qualified bilingual review remain open.

The user supplied a budget of `500`. Planning assumes INR 500 per month; currency is not explicitly confirmed. Prefer local development and limited measured API comparisons. This is not approval for a paid subscription, deployment, or real-data processing.

## Open engineering proposals

- Modular TypeScript application, PostgreSQL, possible pgvector index, private storage, and durable jobs: see [architecture](architecture.md).
- Restricted synthetic-data evaluation pilot as first release; final real-data/launch scope is unselected.
- Intended population, Telugu clinical wording/review, hosting region, providers, confirmed budget currency, runtime/package manager, retention, and review responsibilities.
- Small local Qwen instruction model, hosted Gemini Flash comparison, multilingual E5 embeddings, and a scikit-learn ML baseline: candidates in the [AI implementation guide](ai-implementation.md), not selected or benchmarked production dependencies.
- Dataset licences, labels, training/evaluation protocol, and conditions for model-driven urgency.
- Official destinations, form versions, terminology rights, and external integrations.

## Recording future decisions

Append ID, actual date, status, concrete decision, rationale, material tradeoffs, and affected docs/commit/issue links. Mark superseded entries explicitly. A recommendation in a plan does not become accepted by repetition.
