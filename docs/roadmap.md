# Milestone roadmap

**Emergency repair Phase 2, 2026-10-26: NO-GO.** The fresh 120-case evaluation has 24 emergency misses, seven false escalations and five ambiguous routine continuations (65.71% recall;86.79% precision on 102 binary cases). [Repair, exact evidence and review blockers](../models/medassist_ai/docs/emergency-phase2.md). PR #2 remains draft; Model B stays disabled. Earlier checkpoint entries retain their historical evidence.

**Latest safety milestone, 2026-10-26: NO-GO.** The original heart-attack/stroke declarations now escalate, but the separately authored 100-case evaluation has 25 emergency misses, five false escalations and three ambiguous routine continuations. [Results, state boundaries and blockers](../models/medassist_ai/docs/emergency-recognition.md). Rules remain provisional and clinically unreviewed; keep Model B disabled and the change in draft review. Earlier dated statements below describe historical checkpoints.
**Current scope (user revision, 2026-10-17): English only; no required paid services; all-age product intent with caregiver-managed child profiles. This supersedes earlier Telugu/bilingual and INR 500 planning references below. Clinical coverage for each age group still needs suitable data and evaluation.**

This is the single work-planning entry point. It is organized by deliverables and acceptance evidence, not a fixed calendar or a completed-feature claim. Individual implementation tasks still require the current user's authorization. Read the [AI implementation guide](ai-implementation.md) for how local models, APIs, custom ML, RAG, and agents will be built and evaluated; it is not a second task queue.

## Current position

**MedAssist L2 conversational refinement, 2026-10-25:** [current evidence and blockers](../models/medassist_ai/docs/natural-conversation.md) support a local fictional demo with full-page chat, confirmed broader sparse descriptions and eight topical routine questions. These engineering gates do not establish clinical completeness or improved model accuracy. Next work requires separate authorization: freeze/evaluate broader language coverage, review topic exclusions/question wording and improve earlier-conflict correction. Model B and clinical guidance remain disabled; ADR remains the core priority. Older implementation snapshots below are historical.

**MedAssist Day 2 implemented 2026-10-21 (user target October 22):** [fictional question lab and run guide](../src/features/model-a-research/README.md) connect the existing actual Model A through a guarded local development proxy, with typed answers, UNKNOWN/conflict/stop/reset and unchanged Day 1 evidence export. [Actual checks/inventory](../models/medassist_v2/research_adapter/day2-verification.json). Model B stays unavailable; no production/patient workflow or frozen study behavior changed. Commit/merge/push remain blocked pending review; Day 3 now focuses on browser/control/accessibility robustness, not rebuilding the completed basic loop.

**MedAssist five-day demo sprint, Day 1 (2026-10-20):** the [adapter review and dataset-readiness findings](../models/medassist_v2/research_adapter/day1-review.md) preserve Task 5A's original 21-file patch, fix one invalid-initial adapter defect and define a research-only Model A-to-B evidence handoff. Model B clinical training is not ready. The [Days 2–5 backlog](#medassist-five-day-researchdemo-sprint) selects a nonclinical fallback, with no severity prediction or test access. Stop after Day 1; later entries are acceptance targets, not completed work or automatic authorization.

**MedAssist v2 Task 5A prototype for review, 2026-10-20:** [isolated local Model A adapter](../models/medassist_v2/research_adapter/README.md) reuses the sealed alpha 0.00001 ranker with unchanged features/masks, structured fictional disclosures and versioned evidence. Parity tests and measured latency/memory support CONDITIONAL GO for developer research only; no application routes, clinical behavior, fitting/validation or locked test were enabled. Next: review the uncommitted patch, then separately scope input mapping/question review/Model B contracts. The original frozen CRLF/LF portability defect remains unresolved.

**MedAssist v2 Task 4B completed 2026-10-20:** [actual results and verified seal](../models/medassist_v2/task4b-validation.md) record all three frozen fits, validation-selected alpha 0.00001, 132,448 interviews/529,792 trajectories, full/sensitivity/baseline/subgroup/bootstrap reports and exit 0. All 17 sealed artifacts, implementation/protocol and five source hashes passed independent read-only verification; locked test remains unopened. Synthetic ranker recall@20 is 77.1866%, versus 59.5172% training frequency; this is not clinical validity. Next step requires separate explicit locked-test authorisation and unchanged integrity/one-use gates, with the fresh-checkout CRLF/LF portability caveat addressed explicitly. Do not rerun fitting, retune or alter the seal. Clinical deployment remains NO-GO. The following v2 task entries retain historical completion evidence.

**Security foundation completed 2026-10-18:** legacy agent APIs default off, cannot run in production and require trusted local development opt-in. Explicit modes and loopback HTTP/HMR replace ambiguous startup and global permissive CORS. This is a bounded security task, not completed M1 or release readiness. MedAssist task/data planning remains next.

The [hospital requirements register](hospital-requirements.md) is the source for hospital ADR document/intake/review requirements and their implementation gaps. Confirm the applicable form, SOP, role matrix and escalation protocol before clinical or mandatory hospital workflow behavior. Versioned account-isolated local fictional ADR drafts are now implemented. Confirmed profile imports and refined, reviewed intake remain next; legacy browser drafts stay separate. This does not replace the separate MedAssist ML research track.

The app offers welcome/sign-in, patient-home, guided MedAssist symptom questions/review, fictional ADR drafts, and the preserved developer reference. MedAssist now optionally selects source quotes through local Ollama and offers location-only Google Maps search. It has no persistent patient storage, urgency classifier, approved clinical RAG, or tailored precautions. ADR drafts now support local account isolation and revision checks, but are not submitted. Appearance and shared Back navigation continue across previews. Clinical validation and the connected product workflow remain incomplete.

The account/shared-profile client and owner-RLS schema are now prepared and locally tested. On 2026-10-18 the user deferred cloud provisioning. Local SQLite authentication and durable profiles are now connected and exercised with real HTTP integration tests. The in-memory PostgreSQL tests remain separate from application storage. Google/cloud configuration and clinical task records remain pending; local fictional ADR account drafts are connected. See [account setup](../database/README.md).

### Current phase and next handoff

**MedAssist v2 Task 4A software preflight completed 2026-10-19:** [frozen runner and actual checks](../models/medassist_v2/task4a-preflight.md) cover 22 focused regressions and fictional end-to-end execution with a non-learning stand-in; official preflight verified five source hashes/environment without decoding patient rows. Protocol/reference remain unchanged. **Next separately authorised step: real training/validation only after active-reference/count/target-support/parity gates; official test remains a separate locked command.** No real v2 fitting, official outcomes or clinical behavior were enabled by Task 4A execution.

**MedAssist v2 Task 3.5 protocol frozen 2026-10-19:** [restricted adaptive-questioning v1](../models/medassist_v2/adaptive-questioning-protocol.md) fixes five orphan exclusions, 14 disclosed-parent dependencies, UNKNOWN/default handling, training-reference overlap sensitivity, bounded train-only prefixes, three baselines and a lightweight SGD ranker grid. GO is for the protocol, with pre-fit/parity/support gates before separately authorised implementation/training; clinical use remains NO-GO. No model fit, full-corpus rescan or application change occurred. Earlier statuses below are historical.

**MedAssist v2 Task 3 completed 2026-10-19:** [verified acquisition/full audit](../models/medassist_v2/task3-readiness.md) covers 1,292,579 original records, five matching pinned sources and 32 training-only replay checks; all 61 v2 tests pass. Cross-partition exact/interview-content duplicates, generator defaults and five unresolved question-group roots block an independence claim or unqualified training readiness. **Next separately authorised Task 4: freeze a synthetic question-collection experiment, overlap reporting and answer/dependency semantics.** No training, urgency mapping or application changes occurred. Historical entries below retain their then-current evidence.

**MedAssist v2 Task 2 completed 2026-10-19:** [read-only pinned loader/staged simulator](../models/medassist_v2/task2-loader-simulator.md) and 19 focused synthetic regressions are implemented. [Readiness](../models/medassist_v2/task2-readiness.md) is blocked by five unconfigured local files; no real statistics or training readiness is claimed. Official partitions are preserved; selectors receive only disclosed copies, separate from hidden oracles/evaluators. Task stops here. A future separately scoped step would acquire/verify permitted files externally and review actual source/default/group semantics. No training, API, LLM, urgency or application change occurred.

**Symptom Assessment v2 Task 1 completed 2026-10-19:** the [new isolated track](../models/medassist_v2/README.md) supplies DDXPlus English v2 provenance, interview and separate research urgency contracts, validation/quality/storage utilities and fictional regression fixtures. All original Phase 1–4A artifacts and application code remain unchanged. This is a symptom-interview foundation, not ED-acuity training. **Next bounded task, pending separate scope: verify permitted source files/metadata and actual hashes, then build an external loader and staged-answer simulator.** No model training, urgency derivation, source-data acquisition or clinical behavior is enabled by Task 1. Source question coverage and independent clinician-reviewed care labels remain unresolved gates. The following entries retain prior-track completion evidence.

**Phase 4A completed 2026-10-19:** [cached error audit and independent-validation design](../models/medassist/reports/2026-10-19-phase4a/README.md) preserve v1 and all external benchmark files. Development error caches and descriptive opened-test strata are separate. Nine candidate resources have documented evidence/access/label limitations; no task-matched Indian all-age clinical ground truth is approved. **Next bounded Phase 4B: agree clinician-reviewable task/rubric and source rights, then specify an isolated synthetic conversation-evaluation harness and independent case study.** The linked report owns detailed dependencies and acceptance gates. No retraining, test retuning, clinical rules or patient-facing integration occurred; clinical use remains NO-GO. The following Phase 3 paragraph records historical completion evidence and its then-next task.

**Phase 3 offline baselines completed 2026-10-19:** [actual reports/model cards](../models/medassist/reports/2026-10-19-phase3/README.md) and [runner instructions](../models/medassist/research/training.md) record 60 configurations/180 fold fits, 12 final pipelines and six primary calibrators under unchanged v1, with zero recorded training warnings/failures. Both existing outer splits/CV digests were verified; selections/calibrators/thresholds/artifact hashes were sealed before one-time testing. The CV-selected primary vitals RF missed 86/411 high and 7/26 Immediate cases; all secondary variants had zero exact class-1 recall on ten Immediate cases. Singleton test strata suppress cluster intervals. All 38 synthetic tests passed. **Next bounded task: review development error/missingness/label findings and plan independent validation/new prospectively defined research; do not retune v1 on its opened test.** Clinical integration remains NO-GO; no app, ADR or clinical safety behavior changed.

Sailesh selected MedAssist as the current feature and corrected a planning drift toward ADR NLP. Its goal is symptoms → follow-up questions → low/medium/high urgency or uncertainty → reviewed precautions/care navigation. The current fictional slice implements intake/review/local quote selection/Maps handoff only. It does not complete clinical triage or authorize a real-patient pilot.

1. **Completed UI foundation task:** preserve reusable component examples, label the reference, change the default palette, and add appearance settings. This does not finish M1.
2. **Rough framework — sign-in and patient task screens:** welcome-page sign-in action, Patient/Specialist/Developer views, patient home, and a two-step fictional ADR intake/review preview are implemented as local interface previews. Local authentication and account ADR storage are now connected. Use fictional cases only; the explicitly separate browser demo remains shared.
3. **Current MedAssist handoff — symptom urgency model:** select a symptom/triage dataset with suitable rights and labels, define the intended population and reviewed mapping to low/medium/high plus uncertainty, then build an offline baseline and held-out evaluation. Start from the [symptom-data candidates](research-and-validation.md#medassist-symptomurgency-candidates--checked-2026-10-17), not an ADR extraction task. The local quote helper is infrastructure evidence, not an urgency model. Clinical guidance stays disabled until data, safety pathways, evidence, and review gates are met.
4. **Then — backend/model contracts:** establish storage/identity and a local-first model adapter with explicit inputs, outputs, unknowns, and fictional evaluation cases. Groq is optional under the existing budget policy; custom ML training needs a selected task and suitable data.
5. **Then — connected product slices:** implement and check the real reporting journey and progressively connect the selected model. Continue M2–M7 using their existing gates.

At each handoff, report what was completed, what remains open, and propose one concrete next task for Sailesh to select. The sequence above guides discussion; it does not authorize implementing every future phase without a selected task.

The user selected **English and Telugu, using fictional cases** and confirmed a budget of **INR 500 per month**. The proposed first delivery is a restricted evaluation pilot. Develop with installed local models and optionally evaluate hosted providers; API-based deployment is the user's preferred direction, subject to measured cost and readiness. Mahesh P is the pharmacy reviewer identified by Sailesh, with limited availability. Final population, agreed review scope/availability, data rights, and team hours remain open.

## How to follow this plan

After the current UI foundation and rough framework are agreed, build a complete, persistent ADR reporting journey as the first product workflow. Develop its interface and server together in small working slices. Begin reviewer/data preparation alongside that work; do not wait for custom ML to make reporting useful. Add grounded evidence, bounded MedAssist, and then agent coordination to functions already checked independently.

The following windows are an **aggressive first-month planning example**, assuming steady team participation and timely review. They are not a promise that all features or clinical validation fit into 30 working days. Continue a milestone until its gate is met; reduce optional scope when dependencies slip. Use actual dates in history, not invented future completion dates.

1. **M0: working days 1–2.** Confirm scope and prepare examples; dataset/reviewer work continues throughout.
2. **M1: days 3–5.** Reproducible app, first persisted draft, and access foundation.
3. **M2: days 6–11.** Complete bilingual ADR intake, confirmation, saved report, and PDF; introduce structured extraction after the manual path works.
4. **M3: days 12–16.** Professional review, a small approved RAG corpus, and reconciled descriptive analytics.
5. **M4: days 17–21.** Bounded MedAssist and an offline ML experiment, only as data/review permit.
6. **M5: days 22–24.** Coordinate the four checked functions with observable, resumable agent stages.
7. **M6: days 25–28.** Integrated, bilingual, failure, access, and usability evaluation; fix release blockers.
8. **M7: days 29–30.** Restricted demonstration/pilot, recovery check, and handover; paid staging is conditional on budget and approval.

**Scope cut line:** a checked bilingual ADR journey, accurate PDF, traceable review, and honest limitations take priority. If time/data/budget are insufficient, defer photo OCR, maps integration, broader ML inference, sophisticated signal methods, and extra agent autonomy. Document disabled work. A working local fictional-case pilot is a valid engineering outcome; it does not establish a public patient service.

## Responsibilities and decisions needed

- **Sailesh:** set product priorities; explain the intended patient experience; review each demonstration; provide a spending ceiling and team availability. Learning RAG coding in advance is not a prerequisite.
- **Codex:** implement the selected task, explain the concepts as they appear, run relevant checks, document actual results, and commit/sync completed work under the established workflow. Clinical labels, permissions, and acceptance cannot be invented by code.
- **Mitravind, proposed:** review backend/data/access decisions and pair on deployment/recovery. Agree ownership with him; no work has been assigned externally.
- **Jayanth, proposed:** clarify MedAssist conversations and collect reviewed in-scope/out-of-scope examples.
- **Mahesh P:** pharmacy reviewer as identified by Sailesh; proposed targeted checks of report mapping, example labels, consequential errors, and final clinical wording. Confirm availability and scope; do not assume continuous access or that every question is within one reviewer's expertise.
- **Clinical review:** Codex prepares evidence/checks and a concise review packet. Mahesh or another appropriately qualified reviewer confirms clinical content within their agreed scope before it is enabled. Qualified Telugu review is needed for clinically meaningful Telugu wording/examples. AI-assisted checks are not human sign-off.

**Needed first:** confirm intended population and when Mahesh can review a focused packet; bring the current blank reporting form or official link and the institution's receiving workflow; describe existing datasets by name/licence/labels without sending patient records; confirm hours/team availability. Missing data or reviewer availability does not prevent fictional-case application development. Keep unreviewed clinical inference disabled.

**Needed later:** create provider/hosting accounts only when a selected integration needs them. Put keys in the agreed secret store or local environment, never in chat or Git. Before any real-data pilot, establish its separate permissions, reviewed intended use, retention, hosting, and data-processing arrangements.

## First working day

1. Record the bilingual fictional-case scope, open decisions, demo boundary, and selected first implementation task.
2. Check Mahesh's availability for targeted review through the team; gather one blank form and outline the actual handoff route. Continue fictional software work while scheduling review.
3. Prepare 10 fictional reporting stories covering straightforward, missing/contradictory, multiple-medicine, and follow-up cases across English, Telugu script, and mixed/transliterated input. These are software examples, not clinical training data.
4. Verify the runtime/package manager against the existing lockfile, install reproducibly, and run the current frontend/server checks and build. Record failures before fixing them; preserve the Material showcase.
5. Agree the first report fields and origin/confirmation/unknown states. Specify the smallest vertical slice: enter a fictional report, save a draft, restart/reload, and retrieve those exact fields with user isolation.
6. End with a demonstrated result or recorded blocker, the next bounded task, updated docs/history, relevant checks, and an automatic task commit/sync.

Steps that change the application belong to the selected implementation task. The current planning update does not claim they have run. Do not require a cloud account, patient record, or model download to begin the first-day scope work.

## M0 — Scope, reviewers, and data readiness

- [ ] Confirm pilot audience, institution, language, intended use, team responsibilities, availability, and budget.
- [ ] Confirm Mahesh's review scope/availability and clarify institutional permission.
- [ ] Review official consumer/professional form mapping and the actual receiving route.
- [ ] Register dataset rights, labels, population coverage, and evidence-source permissions.
- [ ] Decide the MedAssist ML experiment's task and whether suitable evaluation data exists.

**Build/review session:** map the direct reporting journey and optional MedAssist entry; define the fictional-case pilot and English/Telugu acceptance examples. Review sources and datasets before copying them into the project.

**From the user/team:** intended population, blank form/workflow, dataset descriptions, team hours, and targeted reviewer availability. Dean consultation, Mahesh's reported role, and the spending ceiling are recorded; clarify scope rather than requesting the same decisions again. See the [dataset shortlist](research-and-validation.md#candidate-data-and-evidence-sources) and [model catalogue](../models/README.md).

**Acceptance:** written scope, mapped forms, source/data register, fictional reporting cases, and explicit clinical/data boundaries. Missing clinical review limits work to synthetic evaluation.

## M1 — Reproducible engineering foundation

- [x] Install the tracked dependencies with Bun v1.4.3 in this checkout; frontend lint and production build pass. The build warning and limits are recorded in [dated history](history/2026-10-17.md).
- [ ] Validate a clean-clone setup and add backend-specific checking; the current `lint` script checks frontend TypeScript only.
- [ ] Establish CI, environment validation, secret protection, and development/staging separation.
- [ ] Implement identity, role/object access, database migrations, cases/versions, drafts, and audit records.
- [ ] Create the actual accessible Material 3 application shell, separate from the showcase.

**Build/review session:** first verify the demonstration can run. Then implement a thin draft-saving slice, extend its schema through migrations, and prove one user's records/files are inaccessible to another. Introduce shared English/Telugu message keys and fonts early; preserve the original narrative language. Do not build all screens before the first saved journey works.

**From the user/team:** review the first phone/desktop flow; confirm team access and the local environment. No paid infrastructure is necessary for this local milestone.

**Acceptance:** repeatable baseline, isolated user data, restart-safe drafts, idempotent operations, and checked phone/tablet/desktop/keyboard flows.

## M2 — Complete ADR reporting

- [ ] Build narrative/choice intake, confirmation, unknown states, and a non-LLM fallback.
- [ ] Add schema-validated extraction with provenance and adaptive follow-up questions.
- [ ] Add private medicine-photo upload/OCR only with validation and confirmation.
- [ ] Generate versioned, template-aligned PDFs supporting long text and multiple medicines.
- [ ] Add user-controlled download/sharing, review state, and linked follow-ups.
- [ ] Conduct pharmacy workflow review.

**Build/review session:** deliver manual choices/text → draft → confirmation → immutable confirmed version → PDF → follow-up. Add local/hosted extraction through the same output contract and compare it with reviewed fields. Test unknowns, contradictory dates, Telugu/mixed input, long text, restart, and provider failure. Start a small API compatibility test here rather than changing provider only at release.

**From the user/team:** feedback on question wording/effort, a reviewer-approved field/template mapping, and bilingual corrections. An optional photo must never silently determine medicine identity or dose.

**Acceptance:** intake → confirmation → saved version → accurate PDF → clarification/follow-up preserves the same facts. Optional-provider failure does not lose the report.

**Dependency:** do not expand optional features while this core path remains unreliable.

## M3 — Professional review and grounded intelligence

- [ ] Implement reviewer queues, notes, clarification, decisions, and attribution.
- [ ] Ingest a small approved corpus with source versions and resolvable citations.
- [ ] Produce duplicate-aware descriptive analytics with explicit denominators.
- [ ] Verify generated explanations against actual evidence/query results.

**Build/review session:** start with a small reviewed corpus and a known-answer question set, not an entire scraped medical library. Trace every answer back to retrieved passages. Provide a reviewer queue and exact, fixture-checked counts before producing generated summaries. Keep professional analysis behind the intended access controls.

**From the user/team:** permitted reference sources, a reviewer for answer/citation checks, and feedback on the case-review workflow. Patient reports remain separate from approved medical knowledge.

**Acceptance:** permissioned review, honest insufficient-evidence responses, and independently reconciled dashboard values. No simulated statistics or unsupported compliance labels.

## M4 — Bounded MedAssist and connected context

- [ ] Implement clinically reviewed educational/care-navigation flows, including uncertainty and urgent interruption.
- [ ] Add facility search, manual-location fallback, honest attributes, and provider navigation.
- [ ] Run the permitted ML baseline/candidate experiment with reproducible splits and error analysis.
- [ ] Import only user-selected, confirmed episode context into reporting.

**Build/review session:** implement reviewed questions/education and explicit uncertainty first. Complete the [custom ML sequence](ai-implementation.md#custom-ml-from-scratch) offline; compare to a simple baseline. A safe research outcome can be a documented failed/limited experiment. Add maps only after budget/terms/location handling are decided; manual location and facility information can support the initial fictional demonstration.

**From the user/team:** agreed ML task and label definitions, suitable permitted data, clinical label/error review, and Telugu review. Source data and evaluation coverage determine whether the model may be enabled; the calendar does not.

**Acceptance:** reviewed scope, provider-failure handling, documented experiment, and safe context reuse. Keep model-driven urgency disabled when data/review criteria are unmet.

## M5 — Four-agent coordination

- [ ] Establish typed contracts for Reporting, Validation, Knowledge, and Analysis.
- [ ] Add durable orchestration, case-version invalidation, bounded retries, cancellation, and human gates.
- [ ] Test malicious/untrusted source content, failure/resume, and duplicate prevention.

**Build/review session:** wrap the existing checked reporting/validation/retrieval/analysis functions in a durable orchestrator. Demonstrate stage status, human confirmation, timeout/retry, restart/resume, and invalidation when a case changes. Four agents may share one LLM; deterministic validation/statistics do not need model calls.

**From the user/team:** review what each agent may propose, what the patient must confirm, and what the professional must decide. Unrequested external submission or sharing is outside this milestone.

**Acceptance:** observable stage results, safe resumptions, and no unauthorized fact changes, disclosures, or submissions.

## M6 — Evidence-based evaluation

- [ ] Run reporting, PDF, retrieval, and reviewed MedAssist scenario sets.
- [ ] Test access controls, uploads, timeouts, quotas, malformed outputs, and redacted logs.
- [ ] Check accessibility/responsiveness and conduct any institutionally approved fictional-case usability comparison.
- [ ] Record actual metrics, failures, confidence/uncertainty limits, and unresolved risks.

**Build/review session:** rerun the exact full journey with fictional English/Telugu cases, compare manual/local/API modes, inspect PDFs, and test denied access/provider outage/restart. Use the separately defined research gates rather than choosing a flattering overall accuracy. Record sample sizes and language-specific failures.

**From the user/team:** scheduled reviewer time, Telugu feedback, and any authorized usability participants. Correct critical errors before improving animations or adding features.

**Acceptance:** the [validation requirements](research-and-validation.md) have evidence. Critical safety/privacy/integrity failures block the affected release.

## M7 — Operable pilot and handover

- [ ] Deploy the restricted pilot with migrations, secrets, monitoring, and an incident owner.
- [ ] Prove backup restore and rollback, and document the runbooks.
- [ ] Obtain pharmacy/workflow acceptance and resolve release blockers.
- [ ] Publish internal release notes, measured results, enabled/disabled features, limitations, and the next validation work.

**Build/review session:** demonstrate from a fresh account, restore a backup, and rehearse a failed-provider/restart scenario. If the budget cannot support suitable hosted operation, hand over a reproducible local pilot and deployment cost/options; do not label an unreliable free instance production-ready.

**From the user/team:** accept the demonstrated scope and limitations; nominate an operational owner if hosting is selected. A public launch or real-patient study requires a separate readiness decision.

**Acceptance:** a reviewer reproduces the complete journey from a clean account; recovery works; release claims match the evidence. Real-patient/public expansion is a separate decision.

## MedAssist capability-based development

**2026-10-25 symptom-understanding gate:** [current inventory and context-integrity evidence](../models/medassist_ai/docs/symptom-understanding.md) advance the fictional L2 ingress: deterministic supported English, strict contextual validation, anatomical/typed clarification, traceable confirmation/export and unchanged sealed Model A. The 115-case development suite and supplementary/mock checks are not independent clinical qualification. Two explicit emergency declarations remain missed under unchanged provisional rules. Next gates are independent unseen-language/anatomical evaluation, qualified wording/safety review and separately authorized rule remediation; clinical Model B remains disabled. No training or broader clinical functionality follows automatically.

**2026-10-25 evidence update:** [conversational UI and real-model verification](../src/features/medassist-conversation/README.md#current-conversational-experience--2026-10-25) advance the existing fictional L2 slice: confirmation/context, one qualified Groq integration, frozen Model A and responsive status/navigation presentation work. This does not complete L2 or authorize clinical severity, guidance or verified-facility claims. Next: qualified question-wording review and a separately reviewed broader sparse-evidence ingress; no automatic retraining. Older dated status notes below are historical.

**Intelligence evidence:** the [bounded integration report](../models/medassist_intelligence/README.md) records actual Model A integrity/20-follow-up checks, the frozen 48-case extraction set and failed installed-candidate screens. Next L2 gate is a reviewed extraction/acquisition/diagnostic decision, not UI work or repeated model fitting. No provider qualifies for connection. L3 remains blocked on permitted intended-population urgency labels; new L4/L5 governance seams remain unavailable, with no invented rules or location disclosure.

**L2 implementation 1:** the [main-site fictional conversation](../src/features/medassist-conversation/README.md) now reuses actual Model A from the original APIP shell with a limited metadata-verified phrase/confirmation path and unchanged evidence semantics. It does not complete L2: no medical LLM is configured/evaluated and general language extraction/clinical wording review remain open. Model B, safety guidance and capability-aware navigation remain unavailable. Continue by the blueprint evidence gates, not the historical sprint schedule.

<a id="medassist-five-day-researchdemo-sprint"></a>

The [MedAssist master blueprint, sections 12–13](architecture/MEDASSIST_MASTER_BLUEPRINT.md#12-capability-based-development-levels) is the source of truth for L1 foundation/adaptive questioning, L2 conversational intelligence, L3 severity intelligence, L4 independent safety/precautions, L5 hospital navigation and L6 complete APIP integration, with observable evidence gates and current blockers.

This replaces the active five-day MedAssist schedule. Earlier Day 1/Day 2 reports and completed-work receipts remain historical records; their old schedule links resolve here for continuity. Do not interpret their next-day instructions as the current plan. Advance by verified capabilities, not dates or an hourly sprint budget. The immediate open gate is L1 patch review and robustness/accessibility evidence; evaluated L2 language integration is not established, and Model B remains untrained/disabled pending L3 data/evaluation prerequisites. L4 clinical approval and L5 verified facility capabilities remain open; L6 requires reviewed four-agent connectivity, privacy, accessibility, monitoring design and end-to-end fictional tests.

ADR remains APIP's core priority, independently accessible. Keep broader APIP milestones visible without imposing a MedAssist deadline. Preserve frozen Model A assets/protocol and the stable locked-test ledger; no training, test access, guidance, background service or deployment is automatically authorized. Do not invent data, labels, guidance or performance to pass a gate.

## Future candidates

These are preserved ideas, not current commitments:

- Regional-language and voice reporting.
- QR-based entry from hospitals/pharmacies/awareness campaigns.
- Permissioned similar-case retrieval.
- Expanded MedAssist custom ML and more reviewed populations.
- Manufacturer-facing summaries and institution-to-authority integrations.
- Privacy-reviewed public research datasets.
- Statistical signal methods after suitable reference data and expert review.
- Wider deployment/tenancy and further agent capabilities after measured need.

## Tracking practice

Put new actionable defects or research blockers here under the affected milestone, or link a focused GitHub issue when one exists. Include observed behavior, impact, evidence, and the condition for resolution. Demo placeholders are not automatically product bugs. Completion boxes change only with linked history/check evidence.

## Checkpoint evidence — 2026-10-25

The [consolidation record](../models/medassist_ai/docs/checkpoint-2026-10-25.md) records the reviewed fictional MedAssist pipeline and fresh software checks. It does not advance clinical gates: incomplete provisional emergency coverage, independent language/wording review, Model B data/validation, personalized precautions and verified facilities remain blockers. Existing real-data ED experiments are research-only and cannot qualify the four-level community interface. Capability-based progression in the [master blueprint](architecture/MEDASSIST_MASTER_BLUEPRINT.md) remains the development source of truth; historical day/sprint receipts stay intact.

## P0 main reconciliation — 2026-10-26

[Integration branch evidence](reconciliation-2026-10-26.md) records resolved README/ignore conflicts, preserved contributor history and passing frontend/HTTP/browser checks. **Main merge is blocked** by the preexisting fresh-checkout frozen-protocol checksum failure in Python; do not count integration as completed on main or bypass its integrity gate. Next: separately reviewed byte-portability remediation, affected Python verification and required PR checks before a history-preserving merge. Clinical gates remain unchanged.

## P0 read-only protocol portability verified — 2026-10-26

[Authenticated LF/CRLF compatibility](model-a-protocol-portability.md) passes clean-checkout Python, actual-model/HTTP/seal, TypeScript and build verification. The previous reconciliation portability blocker is resolved for read-only inference without changing frozen study evidence or locked-test behavior. PR readiness/main merge still require actual GitHub state confirmation. Legacy study commands remain strict; clinical and data-governance gates are unchanged.
