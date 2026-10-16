# APIP documentation

The [root README](../README.md) introduces the repository. [AGENTS.md](../AGENTS.md) contains mandatory contributor/agent instructions.

## Read in this order

1. [Product](product.md): purpose, origin, team, audiences, and confirmed scope.
2. [Architecture](architecture.md): actual code, proposed structure, and limitations.
3. [Development](development.md): setup, environment, and checks.
4. [Layer guides](layers/README.md): MedAssist, reporting, professional intelligence, and agents.
5. [Roadmap](roadmap.md): milestones, dependencies, gates, and future ideas.
6. [Decisions](decisions.md): accepted direction and unresolved choices.
7. [Research and validation](research-and-validation.md): evidence, data rights, and evaluation.
8. [History](history/README.md) and [changelog](../CHANGELOG.md): actual work and notable changes.
9. [Automatic commit and sync](../scripts/README.md): checkout setup, task completion, checks, and failure recovery.

For the practical build sequence, start with the [roadmap's first working day](roadmap.md#first-working-day). The [AI implementation guide](ai-implementation.md) explains the ML training workflow, model/provider choices, English/Telugu RAG, and agent implementation without creating another task queue.

## One home for each concern

Requirements live in the product/layer guides. The roadmap tracks work, not duplicated specifications. Architecture separates implemented from proposed systems. Decisions explain rationale. Research records evidence. Dated history records actual events; the changelog supplies the short summary.

Do not add parallel root TODO, bug, idea, meeting, or recovery files. Put actionable findings in the roadmap or a linked GitHub issue, durable meeting decisions in the decision log, and work/meeting outcomes in dated history. Add experiment or subsystem documentation when substantive content exists.

## Update documentation with the change

For each meaningful development session:

1. Identify the affected layer and milestone.
2. Update behavior, setup, API, migration, configuration, and data-flow docs as applicable with the implementation.
3. Append a history entry: what/why, affected paths, validation/result, limits, and next action.
4. Add durable decisions and notable changelog entries when warranted.
5. Change milestone status only when acceptance evidence exists. Check links and staged scope, then use the automatic completion workflow to commit the task's explicit files and sync them. The user does not need to repeat a routine commit/push request.

Documentation-only changes need link/structure/scope checks, not a claimed application build. Code changes require checks appropriate to their behavior. Failed and unrun checks must remain visible.

## Status and naming

Use **confirmed requirement**, **implemented and checked**, **experimental**, **proposed**, or **unverified** when ambiguity matters. A mock screen or endpoint name does not prove capability.

Use milestones and actual ISO dates, not a fixed-duration project identity. History uses the user's local date (currently Asia/Kolkata). Never invent dates, attendees, metrics, approvals, or outcomes.

## Readability and privacy

Prefer concise pages and links over repetition. Add READMEs for substantial directories needing navigation, not every component. Date evidence checks and distinguish source retrieval from clinical review.

Do not publish secrets, patient narratives, private chat/account IDs, or workstation-specific paths. Use repository-relative links and fictional examples.
