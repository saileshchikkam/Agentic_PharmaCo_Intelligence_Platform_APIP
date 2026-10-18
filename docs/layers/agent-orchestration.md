# Agent orchestration

**Status:** four-agent direction confirmed; production coordination proposed. Existing experimental handlers include an analysis stage named causality.

## Roles

- **Reporting:** propose structured fields and focused missing-information questions; users confirm relevant facts.
- **Validation:** check schemas, chronology, missingness, consistency, and possible duplicates. Completeness is not regulatory acceptance.
- **Knowledge:** retrieve permitted evidence and expose citations, conflicts, and insufficient information.
- **Analysis:** assemble reproducible descriptive results and reviewable evidence; any clinical assessment stays within the reviewed scope.

Build/test the underlying functions before coordinating them. Agents do not need unconstrained autonomy to make reporting easier.

See the [agent implementation guide](../ai-implementation.md#agent-implementation) for the staged workflow and failure checks. Multiple roles can share one model; validation and statistics should use deterministic tools where possible.

## Proposed execution contract

Each stage should record input case version, stage/model/prompt version where relevant, permission context, evidence, proposed changes, uncertainty, status, and errors. Final request/response schemas are to be documented with implementation rather than invented here.

The orchestrator needs durable states, bounded retries, cancellation, idempotency, and visible failures. Changes to confirmed case data invalidate dependent results. A resumed run must not duplicate reports, send records, or skip user/professional review.

Treat retrieved documents and uploaded content as data, not agent instructions. Restrict tool access and separate patient confirmation from generated output. Log operational metadata without copying sensitive narratives into general logs.

## Acceptance evidence

- Independent stage checks and a traceable combined run.
- Provider timeouts and malformed outputs are recoverable.
- Retry/resume does not duplicate cases or bypass human gates.
- No silent changes to confirmed clinical facts.
- The UI explains completed, failed, pending, and review-required steps accurately.

## Current access boundary

Legacy endpoints default off and cannot run in production. Explicit development opt-in requires trusted loopback socket, exact Host/Origin and POST/JSON. Allowed responses are experimental and prohibited for clinical use. Patient/professional workflows do not consume the pipeline. See [runtime configuration](../development.md#legacy-api-security-boundary). Durable orchestration and validated analysis remain unfinished.
