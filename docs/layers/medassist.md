# MedAssist AI

**Current consolidated scope, 2026-10-25:** [checkpoint and verification](../../models/medassist_ai/docs/checkpoint-2026-10-25.md). The DEV-only conversation integrates sealed Model A, 30 constrained language concepts, confirmation, UNKNOWN/context preservation, eight topical questions and versioned export. Optional Groq extraction remains experimental beyond its narrow historical qualification. Independent safety is provisional with known heart-attack/stroke declaration misses; Maps is consent-based external search with no facility verification. Live four-level Model B and personalized clinical precautions remain disabled. Earlier entries below retain their dated evidence and coverage counts.

**Latest natural-conversation refinement, 2026-10-25:** [current scope and evidence](../../models/medassist_ai/docs/natural-conversation.md) add document scrolling, confirmed rich sparse proposals, 28 anchored language concepts and an eight-question topical wrapper around unchanged sealed inference. The original research lab and frozen protocol retain their study behavior. Broader language accuracy and clinical question relevance remain unqualified; severity/guidance stay disabled. Earlier same-day notes below describe the preceding implementation.

**Conversational update, 2026-10-25:** the [main-site fictional chatbot](../../src/features/medassist-conversation/README.md#current-conversational-experience--2026-10-25) now collects required fictional context through chat and confirms extracted suggestions before real Model A questioning. An unassessed severity-status panel, one composer, contextual location-only Maps handoff and unchanged independent emergency precedence are verified separately from clinical capabilities. [Evidence receipt](../../models/medassist_ai/docs/chat-verification.json) includes actual inference; L2 remains partial and L3–L5 clinical gates stay blocked.

**Safety/navigation update, 2026-10-25:** [independent provisional emergency guards](../../models/medassist_ai/docs/safety-navigation.md) now interrupt both fictional previews and backend extraction before model work, including pending/offline states. Explicit location consent prepares the existing Maps search only; no facilities, availability or emergency suitability are verified. Clinical review remains outstanding and Model B stays disabled. [Check receipt](../../models/medassist_ai/docs/safety-navigation-verification.json) records engineering evidence without clinical approval.

**Status:** English-only guided symptom intake, editable review, optional local-model quote selection, and a Google Maps search handoff are implemented for fictional evaluation. Custom urgency ML, adaptive clinical questioning, approved RAG guidance, tailored precautions, and clinical evaluation remain pending. Jayanth originated this part of APIP. See the [implementation/API guide](../../src/features/medassist/README.md).

## Responsibility

Provide an understandable conversation about symptoms/context and help a person find an appropriate care destination. Education and navigation must not promise a diagnosis, cure, prescription, or medicine/dose change.

## Intended journey

1. Gather relevant context with reviewed questions.
2. Assess urgency as low, medium, or high, with an explicit uncertain/insufficient-information outcome. These are the user's intended clinical categories, not implemented predictions.
3. Provide reviewed educational information and care-navigation guidance.
4. Request location permission or accept manual location; show relevant facilities and a user-selected navigation route.
5. Offer deliberate reuse of confirmed episode information in a later ADR report.

Urgent-care interruptions must also be available in reporting. Do not require a lengthy interview, map selection, or report animation before displaying reviewed urgent guidance.

## Model research

**Controlled ED follow-up, 2026-10-24:** [Experiment 2](../../models/medassist_ai/model_b/docs/nhamcs_ed_experiment2.md) excludes the previously exposed test from development/scoring and compares two fixed Extra Trees candidates using training-only weights. Neither qualifies: validation macro-F1 and severe recalls worsen. Source-imputed sex was masked because the codebook describes diagnosis/triage-based imputation; age flags are corrected in an addendum while Experiment 1 remains unchanged. No clinical provider is enabled.

**Five-class ED statistical experiment, 2026-10-24:** the [NHAMCS baseline report](../../models/medassist_ai/model_b/docs/real_data_training.md) records one real-data source-label logistic-regression fit and held-out evaluation. Test accuracy 45.84%, macro-F1 0.3342 and immediate recall 17.86% do not support clinical use. The isolated research runner has no patient-route registration; four-class conversational Model B remains disabled and unapproved. Patient-independent testing, task-matched data and independent clinical review remain unresolved.

**Intelligence integration check, 2026-10-21:** [frozen extraction suite and actual local evidence](../../models/medassist_intelligence/README.md) preserve the UI and live contract. Real Model A passed bounded interview/integrity checks. Two installed Qwen candidates failed a short predeclared screen; Qwen3 1.7B/MedGemma acquisition requirements are explicit and no provider was enabled. Model B remains untrained without approved four-level urgency data. Separate unavailable safety/guidance/navigation ports define review and consent boundaries without enabling clinical functions.

**L2 implementation 1, 2026-10-21:** the [main-site fictional conversation](../../src/features/medassist-conversation/README.md) adds a DEV-only APIP route with three metadata-verified initial symptoms, exact limited phrase matching, explicit mapping confirmation and existing actual Model A follow-ups. No language model is configured; unsupported/ambiguous input clarifies rather than guessing. Evidence and disabled Model B semantics remain unchanged, and the developer lab stays separate. This is a partial language/integration capability, not clinical questioning or completed L2.

**Day 2, 2026-10-21:** [fictional Model A question lab](../../src/features/model-a-research/README.md) implements a separate developer-only structured interview, with typed B/C/M choices, UNKNOWN, declared conflict, stop/reset and versioned evidence export. It reuses the actual selected ranker via a local development proxy. The patient MedAssist preview, ADR and clinical behavior are unchanged; Model B stays not enabled. This is software-demo evidence, not clinical assessment or an approved patient questionnaire.

**Task 5A, 2026-10-20:** a separate [Model A research adapter](../../models/medassist_v2/research_adapter/README.md) now demonstrates read-only use of the selected v2 question ranker with versioned fictional-input/evidence schemas and measured local inference. It does not interpret free text, assess urgency, provide clinical guidance or connect to the patient application. Source AGE/SEX and coded answers are mandatory; unknown context is not guessed. Clinical question review, domain mapping and any future Model B remain separate gates. The uncommitted prototype is awaiting review.

The current `#/preview/medassist` flow asks fixed questions about concern, duration, activity impact, and changes, retaining exact user statements and null unknowns. Only after explicit fictional-case consent does a local Ollama model select source quotes for user confirmation. Answers remain in page memory; no urgency model, clinical RAG, hosted inference, training, or clinical conclusion is connected. Care search is available throughout, with manual location or deliberately requested geolocation and an external Google Maps link. A two-day target cannot establish clinical effectiveness or authorize real-patient use.

A custom model trained from scratch is an aspiration, not a selected algorithm. Define a bounded task, permitted dataset, clinically meaningful labels, baseline, and held-out evaluation before training. ADR reports do not automatically provide valid medical-urgency labels.

Separate training from live care guidance. Record per-class errors, urgent-case misses, calibration, dataset coverage, and uncertainty. Synthetic cases can exercise software, not establish clinical effectiveness. If evidence/review is inadequate, keep model-driven urgency disabled and document the gap.

See the [custom ML implementation sequence](../ai-implementation.md#custom-ml-from-scratch) for task/label definition, permitted data, leakage-safe splits, baseline/candidate training, language-specific evaluation, and packaging. English/Telugu fictional-case scope does not itself supply clinical training data.

Pharmacovigilance data and MedAssist symptom guidance are different tasks. Public openFDA FAERS records can support bounded ADR data-processing and descriptive pharmacovigilance experiments; FDA says spontaneous reports are not scientifically verified for cause and effect and cannot estimate incidence. WHO-UMC's public VigiAccess gives aggregated statistics. Case-level VigiBase access requires an access request, review, and use conditions. These datasets do not by themselves provide clinician-reviewed symptom-to-urgency labels. This is an engineering inference from their published scope and access rules. See [openFDA limitations](https://open.fda.gov/apis/drug/event/) and the [WHO-UMC VigiBase FAQ](https://who-umc.org/vigibase-data-access/vigibase-faq/).

Kaggle is a hosting platform, not a blanket reuse licence. Audit each candidate's exact dataset page, upstream source, licence, intended-use restrictions, label definitions, language, and provenance before downloading or training; Kaggle's [dataset guidance](https://www.kaggle.com/docs/datasets) exposes a per-dataset licence field, and its [licence disclaimer](https://www.kaggle.com/page/license-disclaimer) says the user must check the actual terms.

Before any real-patient pilot, the institution must determine intended use, data permissions, privacy/security conditions, reviewer responsibilities, and applicable regulatory requirements. CDSCO's [2026 Medical Device Software guidance under MDR-2017](https://www.cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/Guidance-document-on-Medical-Device-Software-under-MDR-2017.pdf) defines scope by intended medical purpose; APIP's status is not determined here. WHO calls for healthcare-provider, patient, and other stakeholder engagement and oversight through development and deployment ([WHO guidance](https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models)).

## Navigation and data boundaries

Show the basis for facility results: location, relevant listed services, and available travel information. Ratings are not proof of clinical quality or live appointment availability. Verify the actual receiving/referral process with the pilot institution.

Maps receive only necessary location/search information, not patient narratives. Handle permission refusal and provider failure. Cross-layer imports retain source and require confirmation; an AI guess must not become a patient-stated fact.

## Acceptance evidence

- Reviewed in-scope, urgent, uncertain, and out-of-scope scenarios.
- No unsupported diagnostic certainty or medication instructions.
- Safe behavior when location or model/map providers are unavailable.
- Reproducible model evaluation, or an explicit decision to keep inference disabled.
- Confirmed data import into ADR intake without requiring MedAssist for direct reports.

## Revised model and profile scope

The user now requires English-only data/interface and no paid service dependency, with all-age product intent. Appropriate adult and paediatric data and separate evaluation are still needed. ML is the intended urgency engine; a local LLM supports follow-up questions. The current quote-selection tool is not that trained model. The [shared account profile](../../database/README.md) can provide opted-in age/history context, visibly separate from conversation statements. It is not automatically sent to the model.

## Open-access research decision — 2026-10-19

**Current Phase 3 status:** [offline models and actual results](../../models/medassist/reports/2026-10-19-phase3/README.md) now exist under unchanged v1, with one-time locked evaluation after pre-test sealing. They are separate from the application, with substantial missed cases and zero exact Immediate recall across the secondary models. Clinical inference remains NO-GO. The following Phase 1/2 notes are dated history; no ADR/UI/backend or clinical safety behavior changed.

**Current Phase 2 status:** [baseline protocol v1](../../models/medassist/baseline-protocol.md) freezes primary binary all-labelled and secondary exploratory five-class symptom research. [Preflight](../../models/medassist/reports/2026-10-19-phase2/README.md) verifies unchanged assignments, matched profiles and fit-only CV; it is GO for a later offline baseline task only. No training or patient-facing behavior changed. The following records describe the earlier selection and Phase 1 findings.

Use the [separate NHAMCS/DDXPlus experiment plan](../../models/medassist/experiment-plan.md) and [verified manifest](../../models/medassist/open-access-manifest.json). IMMEDR supports recorded ED-acuity research, not validated home triage. DDXPlus severity is not an acuity label; MIMIC-IV-ED Demo is smoke-only. No restricted downloads, training, model deployment or new clinical behavior is authorized by this plan.

The subsequently authorized [Phase 1 implementation and findings](../../models/medassist/reports/2026-10-19-phase1/README.md) now provide external NHAMCS acquisition, actual quality/provenance audits and candidate grouped partitions. Fourteen synthetic data-engineering tests passed. Training remains unperformed: review rare Immediate support, symptom-cohort selection and timing before a separate baseline task. Supporting datasets remain metadata-only; application behavior is unchanged.


## Local extraction reliability — 2026-10-21

[Measured comparison](../../models/medassist_intelligence/reliability-v1/README.md): 120 real local requests across three installed models/two fixed variants; no candidate met correctness, safety and latency requirements. Natural-language proposals now fail closed with prompt structured clarification, without waiting for unqualified generation. This does not improve model accuracy. Explicit structured symptom selection/confirmation continues to use real sealed Model A, with UNKNOWN and handoff semantics preserved. UI is unchanged; Model B and clinical output remain disabled. Prior results and official test protections remain intact.

## Qualified hosted fictional extraction — 2026-10-23

The explicitly enabled development conversation can use backend-only Groq Qwen extraction after a hash-bound 20-case gate. Proposals remain unaccepted until explicit confirmation, and frozen Model A retains question selection. Multiple/unresolved/unsupported details clarify. See [measured results, privacy and limits](../../models/medassist_intelligence/groq-v1/README.md). No clinical capability or production route was enabled.

## Modular research composition — 2026-10-23

[MedAssist AI package](../../models/medassist_ai/README.md) adds injectable component boundaries and an opt-in composition flag inside the existing backend. The real preserved Model A parity/UNKNOWN/export smoke and seal checks passed; no new cloud comparison or UI change occurred. Jayanth contribution provenance and duplicate-leakage concerns are documented; canonical binaries are absent locally and execution remains disabled. Model B always abstains.
