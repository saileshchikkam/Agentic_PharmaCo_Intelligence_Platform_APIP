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

**Confirmed 2026-10-16.** The user selected English plus Telugu, using fictional cases, for the first version. Include Telugu script, transliteration, and mixed-language behavior in evaluation; do not infer Telugu capability from English results. Mahesh is subsequently identified as the pharmacy reviewer; agreed review scope and qualified bilingual review remain open.

The initial budget reply was `500`; the user subsequently confirmed rupees. See DEC-008 for the current spending/model policy.

## DEC-008 — Local-first models and bounded provider evaluation

**Confirmed direction 2026-10-16.** Use local models for development/testing and support optional hosted APIs where needed, with API-based deployment preferred subject to evaluation, budget, and readiness. The planning ceiling is INR 500 monthly. Keep model/provider settings and evaluation records under `models/`; Ollama weights and credentials stay outside Git. Compare models by task/evidence rather than quantity. Do not assume a free model download or consumer service includes unlimited API inference.

Five installed models were inventoried and two received tiny fictional extraction checks; these observations are not clinical validation or an overall benchmark. No additional weights, provider accounts, purchases, or live application adapters were established. See the [model catalogue](../models/README.md).

## DEC-009 — Review responsibilities with limited availability

**User clarification 2026-10-16.** Sailesh identifies Mahesh P as the pharmacy reviewer and may arrange targeted/final checks; routine availability is limited. Codex performs engineering/evidence checks and prepares review packets, but does not provide human clinical sign-off. Fictional-case software work can proceed while review is arranged. Clinical labels/guidance and live inference require appropriate qualified review; model agreement or AI critique does not replace it.

Sailesh identifies MALADE as project inspiration and plans to share exact references. A likely matching author repository/paper was located and recorded in [research](research-and-validation.md#malade-reference-candidate); no code was copied or integration adopted.

## DEC-010 — Groq free-tier evaluation

**Confirmed direction 2026-10-17.** The user approved Groq's free tier as an APIP option and requested medical-model availability research. Prioritize a bounded Groq evaluation after account access is established; no account/key or live adapter was enabled by the research task. Exact model selection remains proposed. Current public Groq models are general-purpose, not verified dedicated medical specialists.

The live Hugging Face pricing page now lists no included free-user Inference Providers credits; this supersedes the earlier USD 0.10 planning assumption. Keep free local weights, limited hosted demos, and metered routed APIs distinct. See [dated access findings](../models/README.md#medical-models-and-free-access--checked-2026-10-17). No additional model download or paid hosting is selected by this decision.

## DEC-011 — Browser-local drafts are fictional-only

**Implementation boundary 2026-10-17.** The first ADR draft slice uses versioned browser `localStorage` to demonstrate save/reload behavior with fictional cases. It has no identity, access control, server copy, or APIP-managed encryption and must not hold real patient data. Replace it with authenticated, audited server persistence and user-level isolation before any real patient workflow.

## Open engineering proposals

- Modular TypeScript application, PostgreSQL, possible pgvector index, private storage, and durable jobs: see [architecture](architecture.md).
- Restricted synthetic-data evaluation pilot as first release; final real-data/launch scope is unselected.
- Intended population, Telugu clinical wording/review, hosting region, selected providers, runtime/package manager, retention, and agreed reviewer availability/scope.
- Small local Qwen instruction model, hosted Gemini Flash comparison, multilingual E5 embeddings, and a scikit-learn ML baseline: candidates in the [AI implementation guide](ai-implementation.md), not selected or benchmarked production dependencies.
- Dataset licences, labels, training/evaluation protocol, and conditions for model-driven urgency.
- Official destinations, form versions, terminology rights, and external integrations.

## Recording future decisions

Append ID, actual date, status, concrete decision, rationale, material tradeoffs, and affected docs/commit/issue links. Mark superseded entries explicitly. A recommendation in a plan does not become accepted by repetition.

## DEC-012 — Developer reference and appearance before product expansion

**User clarification and implementation 2026-10-17.** The current screen is the development team's reusable Material 3 reference. Show component/token tabs, and retain earlier product prototypes outside the mounted shell. Default to clean white surfaces and blue highlights, with blue/black/green accents in settings and optional dark mode. Persist appearance locally without storing clinical data. Use the same colour source in components and the token inspector.

Developer-only login is a confirmed requirement and remains unimplemented. Define the rough application framework and access boundaries next, then continue backend/model contracts and connected product workflows phase by phase. Ask for the next selected task at each phase handoff; do not treat the roadmap as blanket permission.

## DEC-013 — Sign-in interface before authentication

**User-selected 2026-10-17.** Build a simple main-page entry and consistent Material 3 sign-in views for patient, specialist, and developer audiences. Preserve the developer reference as an explicitly unrestricted preview. Authentication, account creation/recovery, sessions, and verified roles are deferred; local form feedback must not claim account access. Use sample credentials only and do not send, log, or persist them in APIP. Ask the user which page to design after this sign-in task.

The access composition uses official Material Web controls, shared palette roles, responsive logical CSS sizing, and licensed self-hosted Google Sans Flex static cuts. Relevant sources and implementation choices are recorded in the [access guide](../src/features/access/README.md); full Pixel/M3 Expressive parity is not claimed.

## DEC-014 — Restrained Google-inspired appearance palette

**User-selected 2026-10-17.** Offer the familiar Google blue, red, yellow, and green as user-selectable primary highlights. Keep secondary, tertiary, and error roles independent so one choice does not turn the whole interface into a multicolour palette. Use charcoal grey surfaces in dark mode for comfortable viewing, and preserve old green/dark-mode preferences while migrating the retired black accent to blue.

This decision supersedes DEC-012's black accent and near-black dark surface treatment.


## DEC-015 — Shared preview navigation and page geometry

**User-selected 2026-10-17.** Keep a visible text-style Home link beside Log in and use the same page-level Back slot below the header throughout the website. Share one header, typography source, page width/gutters, and stable scrollbar allocation across patient/access and developer-reference routes. The Back slot has fixed dimensions even on the welcome page, where it contains no action. Readable inner form widths may vary without moving navigation. ADR Back resolves internal steps before route exits; native browser history continues to represent routes. Use official Material Web controls where provided and specification-based HTML links/page composition where there is no matching library primitive; retain accessible focus and reduced-motion support.

## DEC-016 — Confirm before deleting a saved draft

**User-selected 2026-10-17.** Give patients a way to remove an unwanted saved ADR draft, and ask them to confirm before deleting it. If deletion cannot be persisted, keep the draft and explain the error. The current design preview applies this behavior only to fictional drafts in the shared browser profile; account-level ownership and server deletion require the future authenticated backend.

## DEC-017 — MedAssist symptom scope and first local-model boundary

**User-selected scope, engineering implementation 2026-10-17.** MedAssist starts with current symptoms and follow-up context, then ultimately reviewed urgency, precautions, and facility navigation. It is a separate task from ADR extraction. The first connected fictional slice uses fixed follow-up questions and a local model only to select source quotes, preserving originals and requiring user confirmation; it cannot generate an urgency level or treatment advice. Keep the output contract and failure/cancellation behavior checked before expanding model responsibilities. Train/evaluate a narrow symptom-urgency model only with suitable permitted labels and review; a successful local LLM request is not that model. Maps receives only deliberately selected location information, never symptom narratives, and selection/directions occur in Maps until a verified facility API is implemented.

## DEC-018 — English-only, zero-paid-service scope and shared signup profile

**User-selected 2026-10-17.** Replace the earlier bilingual/INR 500 direction with English-only data/interface and no required paid services. All-age product intent includes parent/caregiver-managed child profiles and requires suitable per-population model evaluation. One account-backed, user-confirmed profile stores name/date of birth and optional health history, with per-layer sharing choices. Age is calculated at use time. Do not auto-train on records or promote profile text into clinical conclusions.

The implementation foundation uses Supabase Auth/Postgres with PKCE, publishable browser configuration and owner RLS, prepared without provisioning a paid resource. Live setup remains pending. Existing browser-local ADR previews remain separate; profile availability is not permission to transmit to AI, share externally or import into reports automatically.

## DEC-019 — SQLite accounts for zero-cost local development

**User-authorized 2026-10-18.** Connect local database and authentication without provisioning cloud resources. Because Docker/Supabase CLI are unavailable, use Node 24 SQLite with server-verified HttpOnly cookie sessions and scrypt password hashes. Share one profile contract with the optional Supabase adapter; do not silently synchronize databases. Restrict local routes to loopback development and disable them in production. Keep the database outside Git and synced project directories. No real-patient readiness, email verification or Google setup is implied.

## DEC-020 — Owner-isolated local fictional ADR drafts

**Implemented 2026-10-18.** Use the verified local account session for ADR ownership, additive SQLite schema v2 and server-controlled revisions/timestamps. Permit unfinished saves and separately confirmed drafts. Preserve reporter text and unknown values. Keep legacy browser drafts behind an explicit separate demo, with no automatic transfer or fallback on account failures. Supabase ADR storage, clinical case history, confirmed profile imports and hospital workflow remain pending. See the [ADR storage guide](../src/features/adr/README.md).

## DEC-021 — Explicit modes and closed legacy agent APIs

**User-requested 2026-10-18.** Disable legacy agents by default and prohibit them in production regardless of opt-in. Explicit local development experiments require loopback socket, exact Host/Origin and POST/JSON checks before providers/logic. Use same-origin requests and loopback development HTTP/HMR. Startup selects its mode explicitly, rejects ambiguity and permits deliberately configured production bind IP/port. Preserve experimental algorithms with non-clinical metadata; no validation is implied.

## DEC-022 — Open-access MedAssist experiments with separate labels

**User-selected 2026-10-19.** Use CDC NHAMCS 2022 public-use ED as the primary offline recorded-acuity candidate, DDXPlus English for separate synthetic symptom/questioning experiments and MIMIC-IV-ED Demo v2.2 only for schema/pipeline smoke checks. Exclude restricted datasets. Verify actual target/terms/timing; do not pool synthetic pathology severity with real acuity or claim ED predictions are validated home triage. Compare structured Logistic Regression, Random Forest and HistGradientBoostingClassifier with high-acuity/under-triage, calibration, uncertainty and subgroup evaluation. See the [plan](../models/medassist/experiment-plan.md). No acquisition, training or clinical integration was performed by this documentation task.

**Subsequent implementation evidence, 2026-10-19:** authorized [Phase 1](../models/medassist/reports/2026-10-19-phase1/README.md) now supplies actual NHAMCS acquisition/profiling outside Git and supporting metadata verification. Keep original target codes, unknowns and group isolation; rare-class and symptom-selection findings require review before training. Alternatives in that report remain proposals, not accepted label merges or clinical thresholds.

## DEC-023 — Frozen offline baseline tasks and existing partitions

**User-approved 2026-10-19.** Preserve both existing deterministic NHAMCS group-disjoint assignment files; approximate 80% development/20% test with separate fitting/calibration/threshold roles, never regenerate for exact row fractions. Make binary IMMEDR {1,2} versus {3,4,5} primary on all 10,207 labelled visits, with a no-RFV initial-vitals profile and matched age/sex ablation. Keep five-class prediction exploratory on the existing 7,657 symptom-coded visits, with matched vitals/no-vitals comparisons and no five-class/Immediate-specific calibration or class thresholds. Preserve original labels and Phase 1 evidence.

The [frozen protocol](../models/medassist/baseline-protocol.md) and versioned JSON/digest define cleaning/provenance, fit-only grouped CV, fixed LR/RF/HGB comparison, primary-only sigmoid calibration and separate threshold choice, uncertainty and test-lock rules. Model fitting is a later task; the current offline-only GO is engineering readiness, not clinical validation or authorization for patient-facing use. Different experiment split roles prohibit cross-task selection/transfer; freeze both tasks before scoring either test.

**Subsequent execution evidence, 2026-10-19:** user-authorized [Phase 3](../models/medassist/reports/2026-10-19-phase3/README.md) completed training and one-time testing without changing v1. All-task choices were sealed before predictions. Significant misses, zero exact Immediate recall across secondary variants and unavailable cluster intervals keep clinical use NO-GO. This is now an opened research test; any test-informed revision needs a prospectively defined new study/independent validation, not a fresh confirmatory claim using the same test.

## DEC-024 — Preserve ED benchmark and separate independent conversation validation

**User-authorized research boundary, 2026-10-19.** [Phase 4A](../models/medassist/reports/2026-10-19-phase4a/README.md) analyzes existing caches without fitting, prediction replay or threshold/model replacement. Development calibration/threshold errors are selection-affected; opened-test strata remain descriptive. Missing fit/OOF and secondary development predictions are documented gaps, not regenerated outcomes. Frozen v1, original assignments and all fitted/prediction artifacts remain unchanged.

The proposed next study defines symptom information sufficiency, care urgency/time and care setting separately, with independent qualified review and new untouched cases. ED IMMEDR, synthetic diagnoses/severity, knowledge-graph node urgency and reconstructed conversation labels are not automatically interchangeable clinical truth. Source access/terms and reviewer/task scope are gates before future acquisition/evaluation. The design is not an approved clinical algorithm, a clinical sign-off or permission to recruit patients. Additional bounded offline research is GO; home/clinical inference remains NO-GO.

## DEC-025 — Isolated symptom-interview v2 data contracts

**User-authorized Task 1, 2026-10-19.** [MedAssist Symptom Assessment v2](../models/medassist_v2/README.md) lives separately from the unchanged NHAMCS/Phase 1–4A track and application. DDXPlus English v2 is a synthetic interviewing/question-collection source under its verified CC BY 4.0 terms; no archive was acquired. Complete evidence, diagnostic references and synthetic severity must remain outside model-visible interview state. Confirmed, unknown, declined, unavailable, not-asked and contradictory information retain distinct meanings. Age/caregiver/pregnancy/postpartum context is representable without inferred clinical coverage.

Urgency annotations are stored separately under a proposed research vocabulary with insufficient-information and abstention outcomes, never derived from DDXPlus or NHAMCS labels. Software fixtures/proposals cannot count as independent clinical references. Group/duplicate/source-partition checks establish necessary structural conditions only, never training readiness or clinical power. The schema and validator are not approved clinical rules. External data/annotation/artifact storage, a separately scoped loader/simulator and future qualified reference review remain required; no training, LLM, API or clinical changes occur in this task.

## DEC-026 — Pinned local streams and selector-only disclosed state

**Task 2, 2026-10-19.** The MedAssist v2 loader reads the unchanged English v2 manifest and official archive partitions without extraction, acquisition or reassignment. Source-size/publisher-hash checks precede streaming; observed SHA-256 is not a publisher-authentication claim. Archive/record/metadata bounds limit memory. Source records and diagnostic references remain evaluator capabilities, never selector inputs. Selectors receive detached allowlisted views; this trusted-code API boundary is not a hostile-code process sandbox.

Absent encoded evidence is conservatively unknown, not an invented false/default answer. Generator defaults/negative-answer semantics require review before learning. Budgets, repeats, explicit stops and scripted contradictions are software state, not clinical rules. Five real local files remain unconfigured; actual schema compatibility, corpus runtime, duplicate/family independence and clinical validity remain unverified. No model, LLM, API or clinical behavior is enabled.

## DEC-027 — Verified v2 sources do not establish independent clinical evaluation

**Task 3, 2026-10-19.** [Verified external acquisition and full audit](../models/medassist_v2/task3-readiness.md) preserve the original five-file pin and train/validate/test memberships. Actual cross-partition exact-content and eventual-interview-content overlap means the official split cannot be labelled group-independent. Source records have no trustworthy patient/family/site identifiers establishing wider independence. Do not silently deduplicate, move records or regenerate partitions. A future separately frozen question-collection study must specify overlap/dependence reporting, source defaults/unknowns, conditional eligibility and unresolved metadata roots before training; any overlap-free evaluation stratum must be predeclared without test-outcome tuning.

DDXPlus remains synthetic interviewing evidence, not home-urgency or India/all-age clinical validation. No synthetic diagnosis/severity or NHAMCS target supplies care-setting/urgency ground truth. GO is limited to gated synthetic research design; training is not performed or automatically authorised, and clinical integration remains NO-GO. The original Task 1 manifest/Task 1–2 receipts and all Phase 1–4A artifacts remain unchanged; observed acquisition hashes belong in a separate Task 3 receipt.

## DEC-028 — Freeze a restricted evidence-collection task without repairing unknown semantics

**Task 3.5, 2026-10-19.** [Adaptive-questioning protocol v1](../models/medassist_v2/adaptive-questioning-protocol.md) quarantines E_69/E_37/E_118/E_123/E_87 because their code_question roots lack definitions. Do not fabricate root meanings or aliases. Fourteen children with known binary parents require an explicitly disclosed true parent; absence remains UNKNOWN. Explicit default/NA values stay confirmed and distinct, with zero nondefault collection utility rather than a negative clinical assertion. The 218-ID task is a declared narrower computational scope, not resolution of all original source semantics or a validated clinical questionnaire.

Active-interview fingerprints are private governance/evaluator capabilities; only a sealed training-derived reference defines overlap exclusions. Full original partitions remain separate from sensitivity aggregates and no rows move. Residual validation/test/template dependence prevents a complete independence claim. Selector randomness and candidate subsampling use disclosed-transcript hashes only, never hidden full-case fingerprints. Train-only bounded prefix generation and one lightweight streaming family are frozen before validation selection and one locked test campaign. All clinical/urgency uses remain NO-GO. Training/runner implementation requires separate authorisation and parity/source/support gates; Task 3.5 performs no fitting or application changes.

## DEC-029 — Separate software preflight, fitting and consumed test campaigns

**Task 4A, 2026-10-19.** The [offline v1 runner](../models/medassist_v2/training/README.md) implements the frozen protocol without changing it. Default preflight only verifies source bytes/metadata/environment and authored synthetic parity; it never decodes official patient records or fits a model. Fictional mode uses a non-learning stand-in and cannot satisfy official-mode seal checks. Real fitting and locked test execution require distinct explicit commands; the fit stage stops at an immutable pre-test seal.

Training reference/cohorts/prefixes/models/source/code hashes are sealed; failures or mismatches block test. An exclusive stable external ledger claim keyed to protocol/source/mode is consumed before any test row and survives failure; root-bound seals and shared-ledger checks block ordinary copied-run/retry attempts. Retain the same ledger across runs: this is trusted local governance, not protection against deliberate local ledger deletion. Full/sensitivity/subgroup/paired-uncertainty reports reuse one private trajectory cache and never replay selectors. No official outcomes or real fitting were executed in Task 4A; synthetic checks are not clinical validation or evidence of full-scale convergence/resources.

## DEC-030 — Model A remains a separate fictional research question selector

**Task 5A prototype, 2026-10-20; pending patch review.** Reuse the preserved alpha 0.00001 model through existing frozen feature encoding, eligibility and scoring; do not create an alternate encoder, refit or normalize frozen files. An opt-in token-protected loopback FastAPI process accepts structured fictional disclosures only. It separates pending model-selected questions from supplied evidence and labels its versioned evidence object as developer-fictional, without human clinical review. Unsupported context/IDs/dependencies abstain; unobserved evidence never becomes a negative. Source metadata supplies research question/answer definitions, not reviewed clinical appropriateness.

No production/patient router imports this component. Free-text mapping, clinical wording/safety review, real-world missingness and correction workflows, future Model B and deployment controls require separately scoped work. No clinical rule, red-flag mechanism, diagnosis or care recommendation is inferred from question-selection scores. Existing official test authorization/ledger gates and the unresolved fresh-checkout CRLF/LF defect are unaffected.

## DEC-031 — Keep evidence handoff separate from unvalidated severity

**Sprint Day 1, 2026-10-20; pending review.** [Model A-to-B evidence v1](../models/medassist_v2/research_adapter/day1-review.md#minimal-model-a-to-b-evidence-contract) explicitly separates observed binary true/false, observed categorical/multichoice values, unknown answers, not-asked items, quarantined/unsupported definitions and unresolved contradictions. Per-item disclosure/turn provenance is retained; pending questions are not observations. Missing/default values never imply an observed negative. The pure projection is not yet connected to HTTP v1 or a Model B; clinical fields are forbidden.

Already-present NHAMCS supports limited statistical ED-acuity research, not a clinical severity/home-urgency mapping of the Model A vocabulary. No compatible independently reviewed local Model B training/evaluation dataset was established. Use an explicit disabled-Model-B nonclinical fallback for the five-day demo; do not invent labels or treat a deadline as evidence. Later dataset availability would require a separate rights/task/validation decision, not automatic training.

## DEC-032 — Keep browser demo transport separate from model credentials and patient routes

**Day 2, 2026-10-21; pending review.** Reuse the current React/Material Web frontend behind a DEV-only research hash, without patient navigation or AccountProvider. A development-only proxy validates socket/Host/Origin and forwards only structured disclosures to a fixed loopback adapter, with the token supplied through server environment. No browser token, CORS relaxation, file/path endpoint, uploaded pickle or model fallback is introduced. Production denies the namespace and does not contact the adapter; the research screen is removed from production client output.

Separate `model-a.demo.v1` endpoints wrap existing selection and the unchanged `model-a-to-b.evidence.v1` handoff rather than silently extending either contract. Accepted evidence remains distinct from pending questions and from any future clinical assessment; Model B is not enabled. Page-memory state resets on reload. Explicit export is a fictional coded evidence object with provenance, not patient data or clinical clearance. Clinical integration, free-text mapping, deployment and portability remain separate gates.

## 2026-10-23 — MedAssist component ownership

Keep the qualified Groq HTTP transport in the existing TypeScript backend; Python modular composition receives injected ports and never duplicates cloud credentials, prompts or a competing service. The optional modular flag wraps the existing Model A endpoint with unchanged canonical evidence contracts. Disease classification is an isolated opt-in research seam with execution disabled until canonical artifact trust, compatibility, rights and mapping are established. Missing evidence cannot become a zero-filled classifier negative. Four Model B technical slots do not authorize invented clinical target definitions; active Model B remains unable-to-assess. See [component evidence](../models/medassist_ai/docs/integration_status.md).

## 2026-10-25 — Conversational context and unassessed severity presentation

Collect the frozen ranker's required age and source-sex values explicitly in fictional chat rather than using default demographics or importing account context. Unsupported/missing context blocks inference. Keep the existing fictional evidence contract and original replies/proposals/acceptance distinct; changing presentation does not authorize clinical provenance or a broader extraction bridge.

The requested severity categories reserve future colour semantics but remain neutral/unassessed. Gathering information describes interview progress only; no LLM, question ranker, keyword guard or NHAMCS/disease model may populate an assessed category. Keep independent emergency warnings separate and immediately accessible. Contextual Maps remains location-only until a separately reviewed specialty/facility capability contract exists; symptom text is not added to external search queries. See [current implementation](../src/features/medassist-conversation/README.md#current-conversational-experience--2026-10-25).

## DEC-033 — Separate conversational filtering from frozen research inference

**Implemented for fictional demonstration, 2026-10-25.** A versioned conversational wrapper may restrict the frozen eligible candidate pool using explicit auditable topic membership, then reuse the sealed ranker and feature function. It stops at eight routine questions, below the ten-question upper bound. The original research protocol, 20-disclosure study endpoint and evidence contract remain unchanged. Language proposals require confirmation; volunteered disclosures, original narratives, unmapped text and routine turns remain separately traceable. This is an integration change, not increased trained-model accuracy or clinical screening approval. Earlier conflicts block interpretation and require clarification/restart rather than silently rewriting accepted evidence. See [scope and evidence](../models/medassist_ai/docs/natural-conversation.md).

## DEC-034 — Preserve hash-bound research receipt bytes

Preserve the reviewed current bytes under `models/medassist_ai/`, `models/medassist_intelligence/` and the unsealed `models/medassist_v2/research_adapter/` with scoped `-text` Git attributes. Qualification and provenance receipts hash exact bytes; implicit CRLF/LF conversion could invalidate them. Scoped whitespace attributes recognize CRLF line endings while retaining blank-at-eol, blank-at-eof and space-before-tab checks. This does not normalize or change the frozen Model A implementation/protocol, resolve its preexisting portability defect, or authorize model/data redistribution. Recovered Jayanth blobs already exist in remote-main history and are excluded from this feature checkpoint, with their disabled-execution boundary retained. See the [checkpoint record](../models/medassist_ai/docs/checkpoint-2026-10-25.md).


## DEC-035 — Independent emergency evaluation cannot be replaced by regression parity

**Implemented and evaluated, 2026-10-26.** Keep emergency recognition independent of language providers and Model A, with no-match meaning not assessed and explicit ambiguity blocking ordinary inference when recognized. Established emergency state cannot be cleared by provider replies or corrections. Use separately authored, frozen fictional evaluation before clinical review; disclose failed gates without tuning against final cases. The first 100-case v2 evaluation fails and blocks advancement beyond the safety milestone and automatic merge. AI-authored expectations and public sources do not supply human clinical approval. [Evidence](../models/medassist_ai/docs/emergency-recognition.md).


## DEC-036 — Preserve failed evaluation denominators and independent utterance scope

**Implemented/evaluated 2026-10-26.** Prior/current free-text statements receive independent safety context checks; no educational/history scope or later denial can clear another recognized trigger. Fresh heldout failures, including omitted emergency categories and correction-rubric conflicts, remain in prospective denominators. Do not claim paired improvement across differently composed case sets or tune final sets repeatedly. The Phase 2 matcher fails independent gates despite passing regressions; PR remains draft and clinical Model B stays disabled. [Evidence](../models/medassist_ai/docs/emergency-phase2.md).
