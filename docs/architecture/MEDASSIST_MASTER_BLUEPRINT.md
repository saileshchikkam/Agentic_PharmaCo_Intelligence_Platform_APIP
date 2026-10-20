# MedAssist master blueprint

Preserved 2026-10-21 for **APIP — Agentic Pharma Co-intelligence Platform**. This is the durable MedAssist product and architecture reference, not a clinical approval, implementation claim or permission to execute future tasks. ADR reporting remains APIP's core; MedAssist is optional and must never prevent direct reporting.

**Current decision:** CONDITIONAL GO for the local fictional Model A research demo; NO-GO for clinical assessment, autonomous guidance or public clinical deployment. Model B is untrained and disabled. The official Model A locked test remains separately gated.

## 1. Product vision and scope

The intended MedAssist lives inside the original APIP website. A natural conversation collects structured symptom evidence, supports clinically grounded assessment research, presents reviewed source-grounded precautions, and helps people navigate to relevant hospitals when warranted. It preserves what the person actually said and makes uncertainty visible.

The full vision is retained even where implementation is blocked. A working research demonstration is a legitimate delivery outcome; it is not evidence that real-world clinical advice is safe. No diagnosis, treatment, medication recommendation or home-care clearance may be enabled merely because the conversation or a model appears convincing.

The [product vision](../product.md), [application architecture](../architecture.md) and [MedAssist layer guide](../layers/medassist.md) own shared APIP concerns. This blueprint records the specific MedAssist direction and its readiness gates. If older low/medium/high sketches differ, the current requested research direction is four intended urgency levels plus a separate unable-to-assess outcome; this is not an approved label mapping.

## 2. User experience

The planned product presents one simple chat: describe symptoms, answer understandable follow-ups through quick controls or supported text, review collected facts and uncertainty, and optionally permit location use. Hide technical evidence IDs, model internals and research jargon from the eventual product interface. Retain corrections and confirmation separately from extracted suggestions and professional conclusions.

Use existing Material 3/Material Web components, responsive phone/tablet/desktop layouts, accessible labels, keyboard operation and reduced motion. Evaluate supported languages separately; an English fictional demo does not establish Telugu, transliteration or mixed-language clinical validity. Child/caregiver and other population coverage require their own evidence.

Keep the existing developer question lab isolated. Its coded fixtures and evidence inspection are useful research tools, not the planned patient-facing conversational experience. The older fictional MedAssist preview is also separate; its existence does not prove Model A integration.

## 3. Model A: preserved adaptive question selector

Model A is the existing trained, sealed synthetic DDXPlus adaptive-question ranker. It selects eligible follow-up questions to recover encoded evidence. It does not diagnose or predict severity, urgency, medical importance or safe disposition.

Preserve the [frozen protocol](../../models/medassist_v2/adaptive-questioning-protocol.md), implementation, selected weights, metadata, source membership and 17 sealed artifacts. The selected SGD alpha is `0.00001`. The task exposes 218 eligible definitions from 223 total, with five unresolved children quarantined. Fourteen supported children require an explicitly true disclosed parent. UNKNOWN, false and unasked parents do not unlock them. Asked questions are not repeated; stopping has no medical safety meaning.

The [Task 5A FastAPI adapter](../../models/medassist_v2/research_adapter/README.md) loads only a trusted hash-verified local artifact and reuses frozen encoding, eligibility and inference. Keep training/evaluation separate from application serving. No new fitting, validation replay, retuning or locked-test execution is implied by integration work.

## 4. Constrained LLM layer

The proposed language layer maps permitted language into structured evidence, asks clarification when mapping is uncertain, and explains approved content. It must not invent evidence, model outputs, severity classifications, unrestricted clinical questions, treatment advice or unsupported precautions. Validate extracted IDs and typed values deterministically; require clarification/confirmation before accepted observations change. Missing text remains unspecified.

Model A chooses the eligible evidence question; any language presentation must retain its meaning and allowed answers. Do not let generated wording bypass exclusions or dependency rules. Keep raw user statements, extracted suggestions, confirmed evidence and professional conclusions distinct.

Evaluate open-weight medical candidates, including **MedGemma**, against smaller practical alternatives. No model is selected by this document. Before acquisition or use, check current licence/access terms, permitted deployment, hardware and privacy requirements. Use a bounded, prospectively specified fictional extraction set: ID/value accuracy, unsupported additions, negation, UNKNOWN, contradictions, structured-output validity, latency, memory and external-data disclosure. Medical branding is not validation. Do not start downloads, benchmarks or training as part of this documentation task.

## 5. Evidence contract

Preserve **`model-a-to-b.evidence.v1`** and its existing [JSON Schema](../../models/medassist_v2/research_adapter/handoff.schema.json) and [projection](../../models/medassist_v2/research_adapter/handoff.py). This blueprint does not redefine or silently extend the contract.

- `observed_positive`: explicit supported binary true.
- `observed_negative`: explicit supported binary false, never inferred from absence.
- `observed_value`: exact typed categorical or multichoice evidence, including explicit default/empty values. Numeric and string values remain distinct; unselected members are not automatically negative.
- `unknown`: asked/disclosed UNKNOWN with null value, distinct from false.
- `not_asked`: no answer obtained; pending questions remain here.
- `unsupported`: known quarantined definition with null value and exclusion reason. Out-of-vocabulary ingress abstains without an accepted handoff.
- `contradiction`: unresolved supplied conflict, retained with provenance and no automatic clinical resolution.

The current projection enumerates 223 definitions, including five unsupported exclusions, with source/disclosure/turn provenance, versioned context, fictional origin, `human_clinical_review: false` and `model_b_status: not_enabled`. Missing fields in a partial external representation mean unspecified, not negative. Structural validation does not establish semantic eligibility or clinical truth. A future clinical contract needs separate design/version review rather than quietly relabelling the fictional contract.

## 6. Model B: planned, untrained and disabled

The intended research target is a clinically evaluated **four-level severity/urgency classifier**, plus a separate **unable-to-assess** state. The four labels, thresholds, action meanings, prediction time, population, intended users and deployment setting must be prospectively agreed by qualified reviewers. Severity and urgency are not interchangeable targets. Do not invent their definitions or derive clinical labels from Model A utility.

Before training, establish data rights and ethical provenance, a clinically defensible rubric, compatible pre-assessment features, qualified adjudication and sufficient support for rare/high-acuity and relevant age groups. Prevent patient-, family-, encounter-, source- and template-level leakage as applicable; freeze grouped splits and keep an independent evaluation untouched. Exclude post-assessment measurements or treatment/disposition proxies unavailable at intended use time.

Predefine calibration, high-acuity sensitivity, false-reassurance risk, abstention/coverage, uncertainty and subgroup acceptance criteria with clinicians. Inspect misses and failure modes, not aggregate accuracy alone. External and intended-population validation are required before clinical claims. A probability or confidence score is not proof of safe disposition.

The [Day 1 dataset review](../../models/medassist_v2/research_adapter/day1-review.md) found existing NHAMCS ED 2022 material conditionally usable for bounded statistical research, not a ready Model B cohort. ED nursing-triage immediacy is not conversation-time disease severity or home-care safety. Existing NHAMCS baselines are a separate research track and remain clinical NO-GO. DDXPlus supplies synthetic evidence-collection targets, not independently validated clinical urgency labels. No task-matched, rights-cleared local severity cohort was established by that bounded review. Do not invent labels, remap ED classes to product guidance, acquire restricted data or start training without these gates.

## 7. Independent safety engine

A future safety engine must apply clinician-reviewable, versioned red-flag and escalation checks independently of the LLM and Model B. Neither can suppress a validated escalation. For possible emergencies, the reviewed flow must not delay urgent help to complete more questions.

No clinical rule set is supplied or approved here. Obtain qualified review of rule sources, thresholds, populations, wording, uncertainty paths and escalation behaviour before enabling guidance. Mahesh P is the identified pharmacy reviewer with limited availability; review scope and additional suitable clinical expertise must be established. AI-assisted engineering checks cannot substitute for human clinical sign-off.

## 8. Precautions and guidance

Separate approved-source retrieval from urgency prediction. A future guidance response must cite the specific reviewed source/version, retain uncertainty and relevant scope limits, and abstain when supporting material is absent or inapplicable. Record reviewer approval and source expiry/update handling. A retrieved passage is not automatically safe individual advice.

No autonomous medication, treatment or home-care clearance. Do not use an LLM to fill missing clinical guidance. Until approval exists, demonstrate retrieval/presentation using clearly fictional or explicitly nonclinical material and keep clinical guidance disabled.

## 9. Hospital navigation

The planned flow asks optional, revocable location permission, offers a manual-location alternative and uses a bounded Maps/Places provider. Share only the minimum location/context needed, after appropriate consent; avoid sending symptom narratives to a map provider by default.

Filter for relevant capabilities only when those capabilities are verified and current. When a reviewed pathway calls for emergency-capable facilities, do not infer that capability, specialist availability, opening hours or acceptance from a facility name. Show source/freshness, uncertainty and provider failures; navigation is not a confirmed referral, capacity guarantee or substitute for emergency help.

The existing application has a location-only Maps search handoff. Verified capability filtering, emergency routing and clinically relevant hospital navigation are not implemented. A map link is not evidence that this vision has been delivered.

## 10. Security and privacy

Keep research and production isolated. The current Model A lab is DEV-only, loopback-bound and opt-in; its proxy keeps the private token server-side. Protect model artifacts outside Git and application-served directories. Load only the approved verified local pickle; never accept uploads or arbitrary model paths. Hashes detect changes but are not authenticity signatures. Preserve trusted provenance and exact environment compatibility.

Use data minimization, explicit consent for future storage/provider sharing/location, safe logging, access controls and documented retention/deletion rules. Keep credentials, private machine paths, raw research records and patient narratives out of Git, browser payloads, telemetry and error responses. Fictional lab state is page-memory only, with explicit export. Do not automatically import account histories or real patient data into research.

Before any wider deployment, verify authentication/authorization, origin/network restrictions, secret management, request limits, transport/storage protection, auditability and provider egress. The local research boundary is not a public-service security certification. Keep clinical endpoints disabled until separately approved; do not create public tunnels as a preview workaround.

## 11. Current implementation and evidence

The following are **previously reported results**, read from existing local documentation/receipts for this blueprint. No tests, benchmarks, source/ledger scans or seal verification were newly executed for this documentation task.

- **Task 4B completed and pre-test sealed:** original process exited `pre_test_sealed`, code 0. [Validation report](../../models/medassist_v2/task4b-validation.md), [aggregate results](../../models/medassist_v2/task4b-aggregate.json) and [verification receipt](../../models/medassist_v2/task4b-verification.json) record 132,448 validation interviews and 529,792 policy trajectories. Selected-ranker macro recall@20 was 77.1866%, versus frequency 59.5172%, random 7.0668% and lexical 3.9442%. Ranker 95% cluster interval: 77.0729–77.2999%; paired advantage over frequency: 17.6695 percentage points, interval 17.5166–17.8224. These are synthetic evidence-recovery metrics, not clinical accuracy.
- **Sensitivity and uncertainty:** excluding training overlap, 129,496 interviews gave ranker recall@20 77.0260% versus frequency 60.1301%. Subgroup support/intervals and evidence-type differences are in the report/aggregate. Empty age/SEX strata remain no-cases; source age/SEX support does not establish clinical coverage, fairness, pregnancy coverage or India-specific validity. UNKNOWN answers occurred 52.5769% of the time and all policies used the full 20-question budget. Validation includes selection cases; narrow intervals do not remove selection, template or source dependence.
- **Task 5A implemented:** separate opt-in FastAPI adapter; [receipt](../../models/medassist_v2/research_adapter/verification.json) reports 18 focused tests passed, median 85.7 ms/p95 111.5 ms historical adapter latency. This is not a new measurement or a production guarantee.
- **Day 1 reviewed:** [review](../../models/medassist_v2/research_adapter/day1-review.md) and [receipt](../../models/medassist_v2/research_adapter/day1-review.json) report 28 focused tests passed, versioned evidence handoff, dataset blockers and a 12-file Day 1 inventory.
- **Day 2 implemented:** [run guide](../../src/features/model-a-research/README.md) and [receipt](../../models/medassist_v2/research_adapter/day2-verification.json) report 35 Python and 23 Node tests passed, zero final failures/skips, successful type/build checks and a fictional browser lifecycle. The real selected Model A supplies questions; no Model B is connected. The lab operates locally when its adapter and frontend servers run. Earlier verification stopped its temporary services; a later preview restoration is session operation, not an always-on service guarantee.
- **Protected research:** the prior receipts report all 17 sealed artifacts and frozen code/protocol/environment unchanged, official locked test unopened, stable ledger empty and test markers absent. These statements are as last verified, not a fresh inspection of private assets. The independent Model A locked test still requires separate explicit authorization and the existing one-use/integrity gates; no execution command is included here.
- **Not implemented:** clinical Model B, clinical LLM integration, the integrated patient-facing Model A conversational experience, validated safety guidance, capability-aware hospital navigation and approved clinical deployment. The older fictional chat/quote helper/Maps handoff remain limited previews, not these completed capabilities.

Task 5A/Day 1/Day 2 work is present as an uncommitted patch on `codex/medassist-v2-task5a-adapter` at this inspection. A documentation commit does not publish or approve that implementation. Some evidence links therefore require this preserved working tree until those files receive separate review and commitment.

## 12. Delivery plan and deadlines

The MedAssist research/demo sprint ends **October 25, 2026**. The broader APIP planning deadline is **November 14, 2026**, as requested here; neither date grants clinical readiness. The [roadmap sprint section](../roadmap.md#medassist-five-day-researchdemo-sprint) owns the detailed actionable backlog. Preserve its six-hour days and October 25 review buffer; do not restart completed days or add a competing task queue.

- **Day 1, October 20:** reviewed research adapter, evidence contract, dataset readiness and safe fallback; completed as previously reported.
- **Day 2, October 21 (user target October 22):** local fictional Model A question workflow, evidence export and bounded checks; completed pending review as previously reported.
- **Day 3, October 22:** finish broader browser B/C/M/default/UNKNOWN/contradiction/budget/failure coverage plus tablet, keyboard and accessibility checks. Retain the existing lab rather than rebuild it.
- **Day 4, October 23:** bounded robustness/privacy checks, measured small-fixture latency/memory if separately authorized, and protected-artifact verification. Report limitations rather than retune frozen inference to meet a target.
- **Day 5, October 24:** rehearse authored fictional end-to-end scenarios, verify startup/stop/export/reset, prepare reviewer handoff and record failures. Use October 25 for review/defect resolution.

Fallback: keep Model B and clinical guidance explicitly unavailable. A fictional evidence-collection demo can be complete without a clinical classifier. If trusted Model A cannot load in a review environment, a labelled fixture replay may illustrate the UI but must never be presented as live trained inference. Further product integration and clinical research follow gated work after this sprint, not deadline-driven invented labels or unnecessary training, repeated evaluations, background jobs or deployment.

## 13. Acceptance criteria and decision gates

Each gate requires recorded evidence and an owner/reviewer before enabling the corresponding capability:

- **Conversational interface:** authored fictional scenarios complete intake → supported clarification → adaptive follow-up → correction/uncertainty → end/export/reset. Technical IDs stay out of the eventual product view; the research lab stays separate. Passing the existing coded lab does not satisfy natural-language integration.
- **Model A correctness:** read-only trusted loading, frozen encoder/reference parity, deterministic disclosed-state inference where applicable, correct eligibility/exclusions, duplicate prevention and unavailable/corrupt-artifact abstention. Preserve all 17 hashes and original protocol/implementation; do not rerun official evaluation to demonstrate the UI.
- **Evidence integrity:** schema/version checks, exact typed values, explicit negative versus missing/UNKNOWN, chronological dependencies, unresolved contradiction retention, provenance and disabled Model B. No unsupported ingress produces accepted evidence. A stopped interview makes no safety claim.
- **Model B data readiness — BLOCKED:** approved intended use/labels, rights/ethics, compatible inputs, grouped leakage controls, untouched evaluation, suitable population/high-acuity support and qualified clinical review. Only then authorize prospective training/evaluation; clinical claims remain blocked pending accepted calibration, sensitivity, abstention and external-validation results.
- **LLM extraction — NOT ESTABLISHED:** prospectively specified fictional structured-extraction checks and clinician-reviewed wording; no invented evidence/questions or clinical output, measured latency/memory/privacy, and a deterministic unsupported-input path. Select a model only after comparative evidence and licence review.
- **Clinical safety and guidance — BLOCKED:** named qualified approval of escalation rules, source scope, wording, retrieval citations and failure paths; demonstrate that neither model nor LLM overrides escalation or delays urgent help for more questions. No AI-generated sign-off.
- **Location/navigation — PARTIAL PREVIEW ONLY:** denied/revoked/unavailable location has a manual fallback; provider egress is explicit; capability claims have verified provenance/freshness and uncertainty. Test Maps failures without implying referral or availability.
- **Accessibility/privacy/end-to-end:** phone/tablet/desktop, keyboard, labels, focus and reduced motion; no credentials/paths/real records in browser/logs/exports; production research routes absent/disabled; fictional state resets predictably. Record actual checks and known gaps rather than claim certification.

Research-demo acceptance can pass while clinical gates remain blocked. No patient pilot, autonomous assessment or clinical training is authorized by this document.

## 14. Known limitations and next actions

The frozen local protocol uses CRLF bytes matching its pinned digest; Git stores an LF-normalized counterpart. A fresh LF checkout fails the exact-byte gate. Preserve both the truthful caveat and the sealed campaign: do not normalize frozen files, replace checksums or claim portable reconstruction. Resolve reconstruction only in separately authorized, reviewed work with provenance and cross-environment parity evidence.

Trusted pickle and preserved scientific-package versions remain constraints. Hash verification is necessary but does not establish authenticity or make arbitrary pickle safe. Clean-environment installation, public security, clinical question validity and real-world generalization are not established.

Immediate next work is the existing Day 3 backlog and review of the uncommitted implementation. Separately resolve Model B cohort/label rights, clinical reviewer scope, constrained language extraction benchmarks and deployment/privacy safeguards. Do not treat the previously opened NHAMCS research test as the unopened Model A test; they are different research tracks. No reuse of test outcomes for tuning is permitted.

### Preservation record for this documentation task

On 2026-10-21, reviewed repository status/branch, architecture/layer/roadmap documentation, frozen protocol description, Task 4B aggregate/report/receipt and Task 5A/Day 1/Day 2 reports/contract. Created this blueprint and a documentation-index link only. Checks are limited to documentation links, structure, privacy and Git scope. No implementation, models, sealed assets, ledger or running preview services were changed; no application tests, training, official evaluation or deployment ran. Existing unrelated work remains preserved. This record is kept here because the requested commit explicitly excludes the already-uncommitted dated history files. Future implementation/history updates remain separately scoped.
