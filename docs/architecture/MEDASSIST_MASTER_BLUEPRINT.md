# MedAssist master blueprint

Preserved 2026-10-21 for **APIP — Agentic Pharma Co-intelligence Platform**. This is the durable MedAssist product and architecture reference, not a clinical approval, implementation claim or permission to execute future tasks. ADR reporting remains APIP's core; MedAssist is optional and must never prevent direct reporting.

**Current decision:** CONDITIONAL GO for the local fictional Model A research demo; NO-GO for clinical assessment, autonomous guidance or public clinical deployment. The live four-level Model B remains disabled and unvalidated; separate five-class NHAMCS ED research experiments do not qualify it. The official Model A locked test remains separately gated.

**Checkpoint, 2026-10-25:** [consolidated implementation and evidence boundaries](../../models/medassist_ai/docs/checkpoint-2026-10-25.md). Sealed Model A selects follow-ups; constrained deterministic/Groq language proposals require confirmation. Provisional independent safety remains incomplete, including missed heart-attack/stroke declarations; personalized precautions are unavailable. Navigation is a consented external Maps search, with no verified facilities, suitability or availability. Capability gates below remain evidence requirements, not clinical approvals.

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

**Symptom-understanding evidence, 2026-10-25 (latest):** [exact inventory](../../models/medassist_ai/docs/symptom-coverage.md) records 223 definitions, 218 active, 96 initial schema symptoms, 30 mapped language fields and 55 topical question targets. [Contextual normalization and compatibility checks](../../models/medassist_ai/docs/symptom-understanding.md) preserve confirmation, source/proposal/accepted evidence, UNKNOWN/negatives, bounded clarification and the unchanged handoff. Model A remains sealed and responsible for ranking; the unsealed filter adds significant breathing difficulty to its respiratory pool. Development/mocked and actual-model evidence are separated. Two literal emergency declarations remain missed by the unchanged provisional rules. L2 remains partial; no clinical/Model B qualification or activation is authorized. Earlier dated counts/results below are historical.

**Natural conversation refinement, 2026-10-25 (latest):** [versioned conversational wrapper and evidence](../../models/medassist_ai/docs/natural-conversation.md) add full-page scrolling, 28 anchored sparse language concepts, explicit rich-reply confirmation, and an eight-question topical candidate pool ranked by unchanged sealed Model A. Original research endpoints, 20-disclosure protocol and evidence contract remain intact. Six real-model scenarios, bounded live Groq checks and responsive/safety regressions establish engineering integration, not broader extraction qualification or clinical relevance. L2 remains partial; independent clinical wording/safety review, comprehensive language evaluation, validated Model B and verified facility data remain required. Earlier same-day conversational notes below describe the previous snapshot.

**Conversational experience, 2026-10-25:** [current chat](../../src/features/medassist-conversation/README.md#current-conversational-experience--2026-10-25) now has a single animated welcome, explicit fictional age/source-sex context, validated proposal confirmation, actual frozen Model A follow-ups/export and contextual location-only Maps. The right-side/mobile assessment panel never selects severity; Model B remains disabled. [Four real conversations](../../models/medassist_ai/docs/chat-model-a-observations.json) and [one qualified Groq integration](../../models/medassist_ai/docs/chat-live-integration.json) are software evidence, not independent accuracy or clinical approval. The restricted ingress, broad synthetic question wording, provisional safety rules and missing verified facilities keep L2 partial and clinical L3–L5 gates open. See [current checks/inventory](../../models/medassist_ai/docs/chat-verification.json); older dated provider/UI statuses below remain historical.

**Accelerated intelligence check, 2026-10-21:** [separate intelligence evidence](../../models/medassist_intelligence/README.md) verifies one actual 20-question Model A interview and unchanged 17-artifact seal, freezes 48 fictional extraction cases/acceptance gates and records a 22-second screen of two installed Qwen candidates. Neither passed; no LLM provider was connected. Model B still lacks authorized, independently adjudicated four-level conversation-time urgency labels. Independently governed safety/guidance/navigation seams exist but return unavailable. The UI and live evidence contract remain unchanged; these checks do not complete L2–L5 or establish clinical validity.

**L2 implementation 1 update, 2026-10-21:** the [main-site conversational research slice](../../src/features/medassist-conversation/README.md) now provides a DEV-only simple conversation in the original APIP shell using metadata-verified limited initial phrases, explicit confirmation, actual Model A follow-ups and the unchanged internal evidence contract. The developer lab remains separate. No language model is configured or evaluated; clinical Model B, precautions and hospital navigation remain disabled/unavailable. This is a fictional software slice, not the complete patient-facing clinical experience. Its [separate verification receipt](../../models/medassist_v2/research_adapter/level2-verification.json) records current checks; the older results below remain historical.

The following are **previously reported results**, read from existing local documentation/receipts for this blueprint. No tests, benchmarks, source/ledger scans or seal verification were newly executed for this documentation task.

- **Task 4B completed and pre-test sealed:** original process exited `pre_test_sealed`, code 0. [Validation report](../../models/medassist_v2/task4b-validation.md), [aggregate results](../../models/medassist_v2/task4b-aggregate.json) and [verification receipt](../../models/medassist_v2/task4b-verification.json) record 132,448 validation interviews and 529,792 policy trajectories. Selected-ranker macro recall@20 was 77.1866%, versus frequency 59.5172%, random 7.0668% and lexical 3.9442%. Ranker 95% cluster interval: 77.0729–77.2999%; paired advantage over frequency: 17.6695 percentage points, interval 17.5166–17.8224. These are synthetic evidence-recovery metrics, not clinical accuracy.
- **Sensitivity and uncertainty:** excluding training overlap, 129,496 interviews gave ranker recall@20 77.0260% versus frequency 60.1301%. Subgroup support/intervals and evidence-type differences are in the report/aggregate. Empty age/SEX strata remain no-cases; source age/SEX support does not establish clinical coverage, fairness, pregnancy coverage or India-specific validity. UNKNOWN answers occurred 52.5769% of the time and all policies used the full 20-question budget. Validation includes selection cases; narrow intervals do not remove selection, template or source dependence.
- **Task 5A implemented:** separate opt-in FastAPI adapter; [receipt](../../models/medassist_v2/research_adapter/verification.json) reports 18 focused tests passed, median 85.7 ms/p95 111.5 ms historical adapter latency. This is not a new measurement or a production guarantee.
- **Day 1 reviewed:** [review](../../models/medassist_v2/research_adapter/day1-review.md) and [receipt](../../models/medassist_v2/research_adapter/day1-review.json) report 28 focused tests passed, versioned evidence handoff, dataset blockers and a 12-file Day 1 inventory.
- **Day 2 implemented:** [run guide](../../src/features/model-a-research/README.md) and [receipt](../../models/medassist_v2/research_adapter/day2-verification.json) report 35 Python and 23 Node tests passed, zero final failures/skips, successful type/build checks and a fictional browser lifecycle. The real selected Model A supplies questions; no Model B is connected. The lab operates locally when its adapter and frontend servers run. Earlier verification stopped its temporary services; a later preview restoration is session operation, not an always-on service guarantee.
- **Protected research:** the prior receipts report all 17 sealed artifacts and frozen code/protocol/environment unchanged, official locked test unopened, stable ledger empty and test markers absent. These statements are as last verified, not a fresh inspection of private assets. The independent Model A locked test still requires separate explicit authorization and the existing one-use/integrity gates; no execution command is included here.
- **Not implemented:** clinical Model B, clinical LLM integration, the integrated patient-facing Model A conversational experience, validated safety guidance, capability-aware hospital navigation and approved clinical deployment. The older fictional chat/quote helper/Maps handoff remain limited previews, not these completed capabilities.

Task 5A/Day 1/Day 2 work is present as an uncommitted patch on `codex/medassist-v2-task5a-adapter` at this inspection. A documentation commit does not publish or approve that implementation. Some evidence links therefore require this preserved working tree until those files receive separate review and commitment.

## 12. Capability-based development levels

Development advances through verified functionality and evidence gates, not elapsed days, sprint milestones or a fixed MedAssist completion date. The earlier five-day schedule is superseded as an active plan. Historical Day 1/Day 2 reports and their actual results remain unchanged. The [roadmap capability entry](../roadmap.md#medassist-capability-based-development) points here as the single source for MedAssist capability definitions and acceptance criteria.

- **L1 — Foundation and adaptive questioning:** preserve the existing trained sealed Model A, research FastAPI adapter, `model-a-to-b.evidence.v1` and fictional question lab. These are implemented with previously reported checks; patch review, remaining robustness/accessibility verification and safe integration remain. Do not mark the whole level complete from model training alone.
- **L2 — Conversational intelligence:** integrate a simple user-facing chat into the original APIP website, with an evaluated medical-language model, validated structured extraction, clarification and Model A orchestration. Keep the developer research lab separate. The first limited structured-input conversational slice is implemented for fictional local use; no medical LLM has been selected/evaluated and general language extraction remains unestablished. The older quote helper is separate.
- **L3 — Severity intelligence:** develop clinically grounded Model B only after authorized-data and prospective evaluation gates. Intended targets are four clinically defined urgency levels plus an independent unable-to-assess state. Model B is currently untrained and disabled; suitable labels, held-out evaluation, calibration and abstention are prerequisites, not inferred capabilities.
- **L4 — Independent safety and precautions:** establish clinician-reviewed red flags and escalation, vetted source guidance and bounded source-grounded explanations. Safety checks cannot be overridden by the LLM or Model B. Clinical rules/guidance are not yet approved.
- **L5 — Hospital navigation:** add optional consent-based location, Maps/Places integration, relevant verified facility capabilities and safe emergency-navigation handling. The current location-only Maps search is a limited preview, not completion of this level.
- **L6 — Complete APIP integration:** connect MedAssist to the Reporting, Validation, Knowledge and Analysis agents only through reviewed contracts, with privacy, access control, testing, accessibility, operational monitoring and reproducible end-to-end fictional demonstrations. Existing experimental handlers do not establish complete connectivity or clinical readiness.

Levels describe capabilities and dependencies, not permission to implement them automatically or a requirement to wait before preparing independent prerequisites. L4 safety design and L3 data/reviewer preparation can proceed alongside L2 engineering when separately authorized. Never enable a dependent clinical capability while its safety/data gates remain unmet. Record partial capability evidence explicitly; completing a fictional demo is not completing L3–L6 clinical functions.

ADR reporting remains the core APIP priority and independently accessible. Retain the broader APIP roadmap and November 14, 2026 planning target as project context, not an artificial MedAssist sprint or proof of readiness. Scope and reviewer/data availability determine what is deliverable; no date waives evidence, privacy or clinical review.

Fallback: keep Model B and clinical guidance explicitly unavailable while developing a useful fictional evidence-collection workflow. If trusted Model A cannot load in a review environment, clearly labelled fixture replay may illustrate the UI but must never be presented as live inference or satisfy its correctness gate. Do not invent labels, guidance or performance to close a level. No unnecessary retraining, repeated heavy evaluation, background jobs or deployment is authorized by this plan.

## 13. Evidence-based acceptance and decision gates

A level is complete only when its observable checks have dated evidence, actual results, known limitations and an accountable reviewer/owner. Agree task-specific acceptance thresholds prospectively; do not fabricate performance or select flattering thresholds after seeing results. Prior reported test counts remain historical evidence, not newly executed checks. Failures block the affected capability; partial functionality must stay labelled partial.

### L1 gate — foundation and adaptive questioning

Verify read-only trusted Model A loading and frozen encoder/reference parity, deterministic disclosed-state inference where applicable, eligible questions/dependencies, all five exclusions, duplicate prevention and safe unavailable/corrupt-artifact abstention. Exercise binary/categorical/multichoice controls, exact scalar types, explicit defaults/empty sets, UNKNOWN versus false/not asked, unresolved contradictions, budget/user stops and reset/export. Confirm `model-a-to-b.evidence.v1` provenance, no accepted handoff for unsupported ingress and no clinical meaning attached to stopping.

Review the existing patch and record focused browser/proxy failure, cancellation/stale-response, tablet/keyboard/focus/labels/reduced-motion checks still missing from prior evidence. Demonstrate startup, fictional interview, export and reset in the preserved environment. Preserve all 17 sealed hashes, frozen code/protocol/environment and the unchanged ledger; locked-test execution remains separately unauthorized. Keep the CRLF/LF and trusted-pickle limits visible. **Status: implemented foundation, completion/review gate still open.**

### L2 gate — conversational intelligence

Demonstrate authored fictional free-text intake → validated structured suggestions → user clarification/confirmation → actual Model A follow-up → correction/uncertainty → end/export/reset in the original APIP website. Hide technical evidence IDs in that user-facing chat while retaining the separate developer lab. Preserve statements, extraction suggestions, confirmed observations and conclusions separately; missing/UNKNOWN never becomes negative. Unsupported or ambiguous mappings must clarify or abstain without invented evidence or questions.

Compare permitted medical-language candidates, including MedGemma and smaller practical alternatives, on a prospectively specified bounded extraction set. Record licence/privacy review, structured-output and typed-ID/value validity, negation/contradiction handling, unsupported additions, latency and memory, plus qualified review of clinical wording. The LLM handles language, not autonomous clinical decisions. **Status: limited fictional structured-input conversation/Model A orchestration implemented; evaluated medical LLM selection, general extraction and clinical wording review remain open. L2 is partial.**

### L3 gate — severity intelligence

**Training gate — BLOCKED:** approve intended use, population, prediction time and four urgency targets with a separate unable-to-assess state; establish data permission/ethical provenance, a clinician-reviewed rubric, compatible pre-assessment inputs, adjudication, adequate rare/high-acuity/age support, grouped patient/family/source leakage controls and untouched held-out evaluation. ED-acuity records do not establish home-care safety; do not invent clinical labels or silently remap them. Only then separately authorize prospective Model B research/training.

**Clinical-use gate — BLOCKED:** report held-out performance and uncertainty against prospectively accepted criteria, including calibration, high-acuity sensitivity, false-reassurance errors, abstention/coverage and subgroup support; obtain external/intended-population validation and qualified review. Model confidence is not a disposition guarantee. No validation/test-driven retuning of frozen studies. **Model B remains untrained and disabled until its prerequisites and separate enablement decision are satisfied.**

### L4 gate — independent safety and precautions

Obtain named qualified clinical approval of versioned source-backed red flags, thresholds, wording, population limits, uncertainty paths and escalation behaviour; no invented rules or AI-generated sign-off. Demonstrate that neither the LLM nor Model B can suppress escalation or delay urgent help for more questions. Separately verify vetted guidance retrieval, source/version citations, applicability, freshness and abstention when evidence is missing. No autonomous medication, treatment or home-care clearance. **Status: clinical safety/guidance approval blocked.**

### L5 gate — hospital navigation

Test granted/denied/revoked/unavailable location, manual-location fallback, explicit provider consent and minimized data egress. Facility specialist/emergency capability claims require verified provenance and freshness, not name inference. Demonstrate relevant facility selection and safe uncertainty/provider-outage handling under the reviewed escalation pathway; navigation must not imply a confirmed referral, capacity or guaranteed acceptance. Emergency-specific behaviour depends on the L4 safety review. **Status: location-only preview exists; capability-aware navigation not established.**

### L6 gate — complete APIP integration

Demonstrate reviewed connections to all four agents with versioned data/provenance, validation, explicit user confirmation/sharing and failure recovery; retain direct ADR access and prevent automatic retraining or promotion of new reports into trusted evidence. Test end-to-end authored fictional cases, timeouts/cancellation, access denial, provider outages and reset/export while disabled clinical functions stay visibly disabled. A fictional integration demonstration can pass its software subset without satisfying clinical gates.

Verify privacy/retention/consent, server-side credentials, safe logging, research/production isolation, authorized access, and phone/tablet/desktop accessibility including keyboard, labels, focus and reduced motion. Define operational health/error monitoring, incident ownership and recovery before deployment; this document starts no monitoring job or service. Record enabled versus blocked capabilities, measured results and reviewer decisions. **Complete product/clinical integration cannot be claimed while required L2–L5 gates remain open; public release and real-patient use require separate approval.**

Across all levels, preserve Model A, its frozen artifacts/protocol and the stable locked-test ledger; no official test access follows from a level transition. Clinical training and real-world clinical claims remain blocked until their specific prerequisites are met. Software verification is not clinical certification.

## 14. Known limitations and next actions

The frozen local protocol uses CRLF bytes matching its pinned digest; Git stores an LF-normalized counterpart. A fresh LF checkout fails the exact-byte gate. Preserve both the truthful caveat and the sealed campaign: do not normalize frozen files, replace checksums or claim portable reconstruction. Resolve reconstruction only in separately authorized, reviewed work with provenance and cross-environment parity evidence.

Trusted pickle and preserved scientific-package versions remain constraints. Hash verification is necessary but does not establish authenticity or make arbitrary pickle safe. Clean-environment installation, public security, clinical question validity and real-world generalization are not established.

Immediate next work is the open L1 review/robustness gate, with separately scoped L2 language-integration and L3 data-readiness preparation. Separately resolve Model B cohort/label rights, clinical reviewer scope, constrained language extraction benchmarks and deployment/privacy safeguards. Do not treat the previously opened NHAMCS research test as the unopened Model A test; they are different research tracks. No reuse of test outcomes for tuning is permitted.

### Preservation record for this documentation task

On 2026-10-21, reviewed repository status/branch, architecture/layer/roadmap documentation, frozen protocol description, Task 4B aggregate/report/receipt and Task 5A/Day 1/Day 2 reports/contract. Created this blueprint and a documentation-index link only. Checks are limited to documentation links, structure, privacy and Git scope. No implementation, models, sealed assets, ledger or running preview services were changed; no application tests, training, official evaluation or deployment ran. Existing unrelated work remains preserved. This record is kept here because the requested commit explicitly excludes the already-uncommitted dated history files. Future implementation/history updates remain separately scoped.

### Capability-planning revision — 2026-10-21

Replaced the active day/sprint plan with L1–L6 capabilities and observable evidence gates. Preserved the original product vision, reported Day 1/Day 2 outcomes and frozen-research constraints; updated the roadmap pointer without committing prior implementation work. No new capability, test, seal verification or clinical approval is claimed by this documentation revision.


### Local MedGemma evidence update — 2026-10-21

Explicitly enabled local fictional MedGemma extraction now connects through constrained proposals and user confirmation to the existing trained Model A, preserving the chat layout and frozen handoff. The revised 20-case development subset achieved only 30% semantic agreement and showed unsupported/polarity errors; final literal guards were tightened and separately checked. Broad L2 promotion remains blocked on extraction reliability, independent evaluation, latency and qualified wording/provenance review. Multiple/duration/conflicting initial input is clarification-only. See [measured results](../../models/medassist_intelligence/README.md#local-medgemma-integration--2026-10-21). No L3–L6 clinical capability or official test access was enabled.


### Extraction reliability gate update — 2026-10-21

A [120-request local comparison](../../models/medassist_intelligence/reliability-v1/README.md) on the same 20 fictional cases found no qualifying MedGemma/Qwen provider: highest semantic agreement 45%, with remaining unsupported/polarity failures and excessive latency. Compact output was faster but less correct. L2 remains partial and blocked; live language proposals are withheld behind a hash/digest-bound qualification gate. Explicit structured user confirmation still drives real Model A. UI and all frozen research assets are preserved. No Model B training, clinical capability, downloads or official test access follows from this result.

### L2 engineering evidence — 2026-10-23

The [Groq fictional extraction evaluation](../../models/medassist_intelligence/groq-v1/README.md) qualifies one provider on 20 reviewed English cases and verifies actual Model A orchestration. Broader independent bilingual reliability, cloud privacy/operational governance and end-to-end latency remain open; this evidence does not complete L2 or enable clinical decisions. L3 Model B remains disabled.

### Modular component evidence — 2026-10-23

[Implemented modular composition](../../models/medassist_ai/README.md) reuses the canonical Groq transport and Model A service with dependency injection, a registry, evidence validators and isolated disabled disease/urgency/safety/navigation seams. The existing API/UI contracts remain unchanged. Jayanth remote artifacts are manifested but not downloaded/deserialized; provenance, licence, serialization compatibility and duplicate-safe evaluation remain blockers. This is engineering organization, not a new clinical capability or level promotion.
