# RAG, LLM and governed agent boundaries

Proposed 3F and Phase 4. No inference, indexing, training or agent is enabled. [Master](../../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md), P19–P21 and current case permissions apply.

## 3F approved public retrieval

Allowlist publisher, document type, version, jurisdiction, rights and review status before ingestion. Public availability does not establish suitability or reuse permission.

Pipeline is approved registry → immutable document/checksum → versioned chunks → reviewed corpus release → scoped retrieval → exact source/version/location/excerpt → human assessment. Withdrawn or stale sources follow an approved exclusion policy while retaining required provenance.

Proposed objects are evidence_sources, corpus_releases, evidence_documents, evidence_chunks, retrieval_receipts and source_review_events. An embedding/vector index requires a separately measured design decision; no vector table is created by this plan.

Proposed POST /api/specialist/reviews/:submissionId/evidence-search verifies active specialist, assignment, consent and revision before constructing a minimized query. Only approved public evidence enters the corpus. Private cases, review notes and reports never become trusted evidence automatically.

## Specialist-approved LLM questions

Input is the minimum approved confirmed projection plus selected public evidence. Exclude identifiers, reporter contacts and unrelated history. No external provider receives case content before explicit hosting, purpose, privacy/logging/retention, jurisdiction, cost and consent approval.

Bind requests to actor, assignment, consent, source revision, corpus release and model/prompt version. Output is a bounded list of proposed questions, rationale, field references and valid citations, or abstention. Validate structure and citation membership; a citation alone is not clinical validation.

Store proposals separately with original output and approve/edit/reject disposition. Only an approved human clarification command can publish a question to a patient. Patient answers remain patient-authored immutable revisions.

Proposed routes are POST /api/specialist/reviews/:submissionId/question-suggestions and POST /suggestions/:suggestionId/dispositions. Recheck current permission and versions before saving or publication.

Manual review remains usable when retrieval/inference is disabled, unavailable, unsupported or over budget. No automatic causality, diagnosis, prescription or patient advice is produced.

## Threats, tests and acceptance

Treat documents/model output as untrusted data. Use fixed instructions/tool allowlists, escaped rendering, bounded schemas and approved-release citation checks. Retrieved text cannot authorize actions or expand scope.

Test injection, cross-case leakage, fabricated citations, wrong jurisdiction, stale/missing/contradictory evidence, quota/timeouts, refusal, consent withdrawal mid-request and rejection of every proposal. Fixture tests precede any separately authorized live evaluation.

Screens are evidence/provenance drawer and suggestion disposition panel in the existing review workspace. Accept approved sources/provider policy, citations or abstention, human disposition and a manual fallback at all four widths. Exclude automatic messaging, training on reports and clinical causality decisions.

## Phase 4 bounded orchestration

A workflow is an approved versioned finite definition using previously approved tools. Potential steps may retrieve public evidence, run deterministic checks or prepare a human-reviewed draft. Agents cannot grant consent/approval, assign themselves cases, finalize professional decisions, fill reserved fields or submit to government systems.

Each run carries actor/case/revision/consent scope, allowlisted tools, budgets, deadlines, cancellation and idempotency keys. Recheck authority at each step and before any write/output. A new patient revision does not silently retarget a run. Consequential actions require a human checkpoint.

Proposed objects are governed_workflow_definitions, workflow_runs, workflow_steps, approval_checkpoints and cancellation_events. Private run/status/cancel/approve APIs enforce current capability. Long jobs stay outside synchronous HTTP handlers; queue/worker selection requires measurement and separate implementation authorization.

Screens are private run activity, provenance, human approval and cancellation outcome. Test crash/restart, duplicate steps, budget exhaustion, malicious tool output, revoked scope, stale revisions and approval/cancel races. Compensation never erases immutable medical/audit history.

Accept bounded resources, durable replay safety, attributable actions and a verified cancel path. Exclude unrestricted tools, cross-case memory, autonomous clinical conclusions, automatic retraining, regulator submission and MedAssist changes.
