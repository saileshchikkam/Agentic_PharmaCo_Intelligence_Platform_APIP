# APIP research integrity, safety and evaluation-defense framework

**Status:** Project-wide engineering policy and proposed release gates, recorded 2026-10-20. **Not** a security certification, clinical approval, independent audit or assertion that all controls are implemented.

## Purpose and scope

APIP (Agentic Pharma Co-intelligence Platform) prioritizes suspected adverse drug reaction (ADR) reporting; MedAssist is an optional research component, never a prerequisite to reporting. This framework applies to datasets, models, prompts, retrieval, agents, ADR workflows, APIs, interfaces, documentation and presentations. The goal is an **auditable, leakage-resistant, safety-first** system, not an unprovable “100% leak-proof” claim.

**Two separate threats:** (1) *research leakage*—train/test overlap, future-answer or label contamination, tuning on held-out outcomes; and (2) *security/privacy disclosure*—patient data, credentials, unauthorized access, logs and third-party transmission. Passing tests for one does not prove the other.

## Non-negotiable engineering rules

1. **Claim–evidence traceability.** Every performance, security, clinical, readiness or deployment claim must name the task, dataset/population, split, metric, protocol revision, evidence artifact, limitations and reviewer. Unverified claims are explicitly labeled *proposed*, *untested* or *unknown*.
2. **Data provenance and rights.** Maintain source URLs/DOIs, licenses and permitted uses, author attribution, immutable file hashes, schema/default semantics, provenance, consent/permission boundaries and data minimization. Quarantine sources of uncertain provenance or unsafe labels. Never put private records, model weights, tokens or raw fingerprints in Git.
3. **No train/evaluation contamination.** Freeze feature contracts, partition rules, candidate grids, metrics and test-access policy before final testing. Enforce train-only statistics, duplicate/group/template-dependence audits, future-answer/label isolation, deterministic sampling and explicit support thresholds. Preserve failed experiments and report full and sensitivity views. A single locked test is not permission to tune on its outcome.
4. **Truthful unknowns and uncertainty.** UNKNOWN is not negative, false, default or normal. Preserve original statements, AI suggestions, confirmed data and professional judgments separately. Support abstention and insufficient-information states; never force certainty from absent evidence.
5. **Independent safety controller.** Medical red flags, escalation, contraindication and vulnerable-population handling require qualified clinical design and review, deterministic enforcement, tests and human escalation. Neither an LLM nor a learned ranker may override a validated safety rule. A prompt alone is not a safety control. Do not claim rules are clinically validated before review.
6. **Constrained LLMs, agents and RAG.** Treat user text, retrieved documents and tool outputs as untrusted; test prompt injection and unsafe instructions. Use least-privilege, allowlisted tools, typed outputs, bounded execution, provenance-carrying retrieval, source-quality gates and human confirmation for consequential actions. RAG citations do not prove clinical correctness. Do not let new ADR reports automatically become trusted evidence or training labels.
7. **Security/privacy by design.** Protect identity, authorization, account/role isolation, input validation, rate limits, encryption in transit/at rest where appropriate, retention/deletion, secret handling, audit trails, safe error messages and dependency/supply-chain integrity. Use fictional records by default. Existing browser-local demos and unfinished integrations are not authorized for real patient records. Conduct threat modeling and security testing before external access.
8. **Human oversight and independent validation.** Engineering checks by Codex or LLMs are not clinical sign-off. Qualified reviewers must assess intended use, red flags, clinical content, language/age applicability, failure cases and risk acceptance. Synthetic results do not establish real-patient safety or Indian clinical validity.
9. **No silent changes.** Log protocol, data, code, model, dependency and deployment revisions; require a new protocol/review for material post-freeze changes. Do not erase failed runs, bypass test ledgers, fabricate missing labels, or hide unfavorable results.
10. **Fail closed on missing evidence.** An unverified source, broken integrity check, unsupported subgroup, unresolved contradiction, missing reviewer or failed safety gate blocks the relevant claim/release, not necessarily all isolated fictional research.

## Threat register and expected evidence

| Threat / hazard | Required mitigation and evidence | Status |
|---|---|---|
| Exact/near-duplicate, generator/template or cross-partition dependence | Canonical overlap audit, grouping rationale, train-overlap-excluded sensitivity, residual-dependence disclosure | Partially evidenced for MedAssist v2; complete independence **not established** |
| Oracle/future-answer, diagnosis or evaluation-label leakage | Selector input allowlist, deterministic disclosed-only masks/RNG, reference-parity and adversarial leakage tests | MedAssist v2 software tests passed; broader system audit pending |
| Test-set reuse, result cherry-picking | Frozen protocols, test-access ledger, pre-test artifact seal, one authorized locked evaluation, preserved failures | v2 protocol/runner implemented; Task 4B seal and test **pending** at time of writing |
| Synthetic labels mistaken for clinical urgency | Separate evidence-recovery metrics from clinical outcomes; independent clinician-adjudicated cases | Clinical urgency validation **not established** |
| Unsafe advice, missed red flags, false reassurance | Clinician-reviewed rules, abstention, emergency escalation tests, age-specific and language-specific audits | **Not clinically validated** |
| ADR causality inflation or report distortion | Preserve reporter words, distinguish suspected from confirmed ADR, professional review, deterministic aggregation | End-to-end clinical workflow **not validated** |
| Prompt injection, RAG poisoning, agent/tool abuse | Adversarial test suite, trusted-source allowlist, permission boundaries, human confirmation | Project-wide verification **pending** |
| Patient data/credential exposure or cross-account access | Privacy inventory, access-control tests, retention/deletion plan, logging redaction, secret scanning | Real-patient use **not authorized** |
| Reproducibility or supply-chain drift | Pinned sources/dependencies, raw-byte hashes, clean-checkout tests, signed/verified releases as appropriate | **Open:** MedAssist v2 frozen JSON CRLF/LF checkout digest portability caveat |

## Claim-to-evidence register (update per milestone)

| Claim | Current evidence | Permitted statement / limitation |
|---|---|---|
| DDXPlus source authenticity | [Task 3 readiness](../models/medassist_v2/task3-readiness.md) | Five official synthetic source files verified; not real-world patient validation |
| Frozen question-selection research protocol | [Protocol v1](../models/medassist_v2/adaptive-questioning-protocol.md) | Restricted 218-question task; five unresolved roots quarantined |
| Training runner isolation | [Task 4A preflight](../models/medassist_v2/task4a-preflight.md) | Focused fictional parity/security-boundary tests passed; not a clinical safety audit |
| Real model fitting and validation | [Task 4B results](../models/medassist_v2/task4b-validation.md), [aggregate/hash receipt](../models/medassist_v2/task4b-aggregate.json) | Three SGD configurations completed; 132,448 synthetic validation interviews reported; 17 sealed artifact hashes and five sources independently verified on 2026-10-20. Locked test remains unopened; no clinical/generalisation claim |
| Clinical accuracy, safe triage or patient deployment | No independent clinical evaluation/approval evidence | **Do not claim** |
| Overall leak-proof or secure system | No independent end-to-end penetration/security assessment | **Do not claim** |

Later stage updates must be supported by new receipts, not inferred from a running process or chat status. Preserve the completed Task 4B run, frozen protocol, sealed artifacts and stable test ledger; locked-test execution requires separate explicit authorisation. Validation/pre-test completion does not satisfy the separately authorised locked-test part of G1 below.

## Release and evaluation gates

- **G0 — Documentation/research:** provenance, rights, threat register, reproducible experiment plan and explicit limitations; fictional/offline use only.
- **G1 — Offline ML evaluation:** frozen splits and protocol, leakage checks, meaningful baselines, uncertainty/subgroup support, integrity receipts, validation then separately authorized locked test. Results describe only the evaluated task.
- **G2 — Integrated fictional-system verification:** end-to-end ADR/MedAssist isolation, API/authz tests, privacy/security reviews, injection and tool-boundary tests, failure handling, traceable citations and user-facing uncertainty.
- **G3 — Clinical study readiness:** independently adjudicated representative cases, qualified clinician-approved escalation/safety content, population/language coverage, ethics/privacy/legal/regulatory assessment and prospective study protocol. No real-patient pilot until applicable approvals.
- **G4 — Patient-facing release:** independently verified safety case, monitored operations, incident/rollback plan, security and privacy sign-off, governance and required approvals. Neither G3 nor G4 is currently satisfied.

No milestone is achieved merely because it appears in this document.

## Evaluator challenge questions and defensible responses

**“Is your model medically accurate?”** The current v2 ranker measures *synthetic nondefault evidence recovery*, not diagnosis, home urgency or treatment safety. We will not conflate them.

**“How did you prevent leakage?”** Show the exact feature allowlist, disclosed-only masking/RNG, source-hash and split receipts, duplicate/fingerprint sensitivity, frozen selection rule, sealed artifacts and test ledger; also disclose residual synthetic-generator dependence.

**“Can you prove zero leakage?”** No. We can show bounded controls/tests and unresolved risks; an absolute zero-leakage claim would be unjustified.

**“Why trust the advice or agent output?”** Do not trust it by default. Consequential clinical content requires independent rules, reviewed sources, human oversight and external validation; the research prototype is not authorized for real-patient advice.

**“Are ADR reports verified causal events?”** No. A suspected ADR report is not proof of causation; preserve provenance and distinguish reporter observations from professional assessments.

**“Is the system ready for Indian patients of all ages?”** No. All-age product intent is not demonstrated clinical applicability; India-relevant, age-specific, and language-specific independent evidence and approvals remain outstanding.

**“Can someone reproduce the result?”** Provide pinned code, protocol, source hashes, dependencies, split and artifact receipts and permitted reproduction steps; disclose the current CRLF/LF byte-checkout portability issue until independently fixed.

## Maintenance and ownership

For every significant milestone: update the claim register and threat register, link actual receipts, record what was tested and *not* tested, obtain reviewer sign-off where applicable, and include limitations in demos, reports and README claims. The project owner coordinates engineering; named clinical reviewers sign off only on explicitly reviewed materials. No automated assistant can sign on their behalf.

**Standing principle:** *Evidence before claims; privacy before convenience; clinical review before clinical deployment; locked tests before performance announcements; honest limitations throughout.*
