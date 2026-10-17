# Milestone roadmap

This is the single work-planning entry point. It is organized by deliverables and acceptance evidence, not a fixed calendar or a completed-feature claim. Individual implementation tasks still require the current user's authorization. Read the [AI implementation guide](ai-implementation.md) for how local models, APIs, custom ML, RAG, and agents will be built and evaluated; it is not a second task queue.

## Current position

The main entry now offers welcome/sign-in, patient-home, and fictional ADR-intake interface previews plus an explicit link to the preserved developer design reference. Appearance uses white surfaces, selectable blue/red/yellow/green primary highlights, and optional charcoal-grey dark mode. The ADR preview reuses the browser-local fictional draft and is not authenticated or submitted. Developer login, authenticated server persistence, the product workflow, and clinical validation remain incomplete.

### Current phase and next handoff

Sailesh clarified on 2026-10-17 that the developer UI foundation comes first; the earlier draft implementation moved ahead of his intended screen sequence. On 2026-10-17, he approved continuing with the fictional ADR intake design preview. This is a presentation slice only, not authorization for clinical guidance, real-data intake, or report submission.

1. **Completed UI foundation task:** preserve reusable component examples, label the reference, change the default palette, and add appearance settings. This does not finish M1.
2. **Rough framework — sign-in and patient task screens:** welcome-page sign-in action, Patient/Specialist/Developer views, patient home, and a fictional ADR intake preview are implemented as local interface previews. Authentication remains deferred. The intake preview may only use fictional cases and browser-local draft storage; enforce access before claiming patient content is private.
3. **Then — backend/model contracts:** establish storage/identity and a local-first model adapter with explicit inputs, outputs, unknowns, and fictional evaluation cases. Groq is optional under the existing budget policy; custom ML training needs a selected task and suitable data.
4. **Then — connected product slices:** implement and check the real reporting journey and progressively connect the selected model. Continue M2–M7 using their existing gates.

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
