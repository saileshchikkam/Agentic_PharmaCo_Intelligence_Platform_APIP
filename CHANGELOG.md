# Changelog

## MedAssist Symptom Assessment v2 foundation — 2026-10-19

- Added an isolated research directory with verified English DDXPlus v2 provenance, structured interview and separate proposed urgency-label contracts.
- Added source/evidence/provenance checks, aggregate quality and group-split feasibility, external storage guards and synthetic regressions. Original Phase 1–4A artifacts and application behavior remain unchanged; no training or patient-data download occurred.

## MedAssist Phase 4A error audit and validation design — 2026-10-19

- Added a read-only cached-prediction auditor with preservation checks and synthetic regression tests; frozen Phase 3 models, thresholds, assignments and protocol remain unchanged.
- Documented development versus opened-test error patterns, feature/target mismatch, nine-source feasibility, a clinician-reviewable independent study and research risks. No training, clinical rules or application inference changed.

## Profile editability and hospital requirements — 2026-10-18

- Fixed Material controls staying disabled after profile loading by controlling each field and checkbox explicitly. Added a browser regression fixture.
- Recorded Mahesh-attributed hospital ADR requirements, current module gaps, source uncertainties and phased integration without enabling clinical workflows or changing the database schema.

## Local database and authentication — 2026-10-18

- Connected development signup/sign-in, server-side cookie sessions and durable SQLite health profiles without Docker or cloud services.
- Added real HTTP integration checks for ownership, persistence across restart, validation, expiry, logout and rate limits; retained the optional Supabase adapter.

## Account/profile foundation — 2026-10-18

- Added configuration-gated patient signup/sign-in, Google provider integration, shared health-profile editing/deletion, per-layer sharing choices and owner-enforced PostgreSQL bootstrap with local isolation tests. Hosted connection remains pending.
- Switched active MedAssist/ADR interfaces to English only. Preserved existing saved draft text and historical evaluation records.
- Recorded zero-paid-service and all-age/caregiver scope, replacing earlier bilingual/budget assumptions.

Notable product and developer-facing changes. Entries describe completed work; plans belong in the [roadmap](docs/roadmap.md). An unreleased entry does not imply a release or clinical readiness.

## Unreleased

### Guided MedAssist symptom conversation and local AI — 2026-10-17

- Added English/Telugu symptom follow-ups, explicit unknown answers, review/edit, stable question-level Back, and discard protection.
- Connected a local Ollama source-quote helper after explicit fictional-case consent, with bounded requests, strict quote validation, cancellation, and preserved originals on failure. Two live fictional source/unknown checks passed; clinical urgency remains unassessed.
- Added location-only Google Maps hospital-search handoff with manual entry and optional permission-based location, without sending symptom statements.
- Corrected the next model research task to symptom/urgency data, documented primary dataset candidates, and retained clinical assessment/precautions as pending review/evaluation.

### MedAssist conversation design preview — 2026-10-17

- Added a responsive Material 3 conversation shell with English/Telugu interface text and consistent Back/ADR navigation.
- Marked the experience as a design preview: fictional messages remain in page memory and no model, persistence, or clinical guidance is connected.
- Documented that public pharmacovigilance datasets do not supply symptom-urgency labels, and recorded current openFDA/VigiBase access limitations.

### Delete saved fictional ADR drafts — 2026-10-17

- Added a per-draft Delete action with a centered confirmation dialog, cancel support, accessible focus restoration, and English/Telugu copy.
- Persisted confirmed deletions to the browser-local draft collection; failures keep the draft and report the storage error.
- Added an empty-list message after the last draft is removed and documented that browser-profile users share these fictional drafts.

### Shared navigation and stable page layout — 2026-10-17

- Added text-style Home, For patients, and Log in links to a shared header, including the developer reference.
- Kept Back in one fixed page row, connected ADR Back to its review/editor steps, and reserved scrollbar space so routes do not shift horizontally.
- Shared Google Sans Flex typography and inline appearance controls; prevented duplicate history entries and preserved modified-link behaviour.
- Added navigation regression checks and corrected the reference workflow tracker overflowing at tablet widths.

### Page-level back control placement — 2026-10-17

- Moved the shared Back action out of the app header and into a left-aligned page navigation row beneath it, reducing header crowding across preview pages.
- Restored centered welcome, patient, sign-in, and ADR layouts after adding the page wrapper; aligned the Back row to each screen's content width.

### Consistent back navigation — 2026-10-17

- Added a shared in-app Back control that follows the previous APIP screen and uses a safe parent route when a page is opened directly.
- Added ADR step/list back actions and a discard confirmation for unsaved draft edits; updated preview route links to retain browser history behavior.

### Multiple fictional ADR drafts — 2026-10-17

- Added an in-page Material 3 list to open saved fictional drafts or start another, with each draft retaining its own review/confirmation state.
- Migrated existing single-draft browser storage into the list in memory; new saves use a validated versioned collection.
- Clearly disclosed that drafts are shared by users of the same browser profile because sign-in is not implemented.

### ADR draft review and confirmation — 2026-10-17

- Split fictional ADR entry into a two-step flow: enter details, review reporter-originated values with unknowns preserved, then explicitly confirm and save in this browser.
- Added draft schema v2 with a user-confirmed status and timestamp; legacy v1 drafts migrate as unconfirmed.
- Kept professional review, authentication, server persistence, AI, and report submission out of the preview.

### Fictional ADR intake preview — 2026-10-17

- Mounted the existing English/Telugu fictional draft form at `#/preview/adr-report`, lazy-loaded it from the selected ADR sign-in preview, and added a clear return to patient home.
- Kept draft storage in this browser only and the explicit fictional-use notice; no authentication, AI, submission, or professional review was added.
- Updated the app route title, keyboard focus, and layer/architecture documentation.

### Appearance palette and header spacing — 2026-10-17

- Replaced the blue/black/green accent choices with familiar Google-inspired blue, red, yellow, and green highlights; only primary roles change with the selected accent.
- Lifted dark surfaces to readable Chrome-like charcoal greys and tuned the patient-home Help button's Material icon spacing.
- Preserved existing green and dark-mode preferences; retired black preferences return to the default blue.

### Patient home UI preview — 2026-10-17

- Added a responsive patient home with MedAssist and direct suspected-ADR reporting choices, plus patient-oriented header help and a clear preview label.
- Centered the Help dialog in the viewport on desktop and phones.
- Linked the patient sign-in view to the home preview without simulating authentication; task actions explain their implementation status.
- Corrected the shared button wrapper to place trailing icons in Material Web's supported icon slot and trailing-icon state.
- Added visible patient-home Help in the header and task-specific sign-in navigation that carries the requested destination while clearly stating authentication is unavailable.

### Access header refinements — 2026-10-17

- Restored Material Web capsule-button spacing and clarified the welcome header action as **Log in**.
- Moved access-page appearance controls into the existing header with a short, reduced-motion-aware transition, accessible theme toggles, and no page displacement.

### Welcome and sign-in interface — 2026-10-17

- Added a simple main-page sign-in action and shared Material 3 Patient, Specialist, and Developer sign-in views.
- Preserved the developer component library through an explicit preview route; no authentication or authorization is implied.
- Added responsive one/two-column layouts, local field feedback, password visibility, short reduced-motion-aware transitions, and licensed self-hosted Google Sans Flex assets.
- Kept credentials ephemeral and unsubmitted; preview submission honestly reports that sign-in is pending.


### Developer design reference and appearance — 2026-10-17

- Restored the component/token showcase as the running developer reference and removed the product-prototype tabs from its navigation.
- Replaced the teal palette with white neutral surfaces and default blue highlights; settings offer blue, black, green, and optional dark mode with browser persistence.
- Centralized colour roles in the shared tokens, kept the token inspector aligned, and honoured reduced-motion preferences.
- Fixed Material Web button boolean handling so enabled buttons are no longer disabled by a serialized `false` attribute.
- Recorded the developer-only access requirement as pending; no login or authorization is claimed.
- Updated the phase handoff sequence before further product/model work.


### Fictional ADR draft prototype — 2026-10-17

- Replaced the misleading simulated report submission with a bilingual local draft flow using the existing Material Web wrappers.
- Preserved reporter-entered medicine, dose, reaction, and timing statements in a versioned browser-local draft; omitted optional values remain unknown.
- Kept the prototype separate from mock professional records and explicitly limited it to fictional evaluation.
- Corrected the displayed APIP expansion to Agentic Pharma Co-intelligence Platform.
- Marked the shared interface as a design demo and removed unverified clinical/regulatory claims from its header and footer.
- Added root ignore rules for dependencies, generated output, environment files, and common machine artifacts.
- The draft is not authenticated, user-isolated, server-persisted, reviewed, or submitted. Frozen dependency installation, frontend lint, and the production build passed; Vite reported a 741 kB JavaScript chunk above its 500 kB advisory threshold.

### Free-tier medical-model availability — 2026-10-17

- Recorded Groq free-tier evaluation as approved direction and distinguished its general models from medical specialists.
- Verified Ollama medical candidates, Hugging Face model/provider status, a community ZeroGPU demo, and author repositories.
- Corrected the earlier Hugging Face USD 0.10 credit assumption: its live pricing page now lists no included credits for free users.
- Updated catalogues and references without enabling providers, installing models, or changing application routing.

### Model and dataset research — 2026-10-16

- Inventoried five installed Ollama models and added separate local/API catalogues without changing application model routing.
- Added a dependency-free local diagnostic and saved four fictional English/Telugu extraction observations, including one incorrect Telugu medicine field.
- Recorded model/provider candidates, free-tier limitations, dataset rights/task suitability, and a likely MALADE reference.
- Confirmed the INR 500 monthly planning budget and recorded Mahesh's reported pharmacy-reviewer role with limited availability; AI checks remain distinct from human clinical sign-off.

### Detailed implementation planning — 2026-10-16

- Expanded the milestone roadmap with indicative working-day windows, first-day steps, proposed responsibilities, inputs needed, review gates, and fallback scope.
- Added a linked guide for local/API model comparison, custom ML training/evaluation, bilingual RAG, and four-agent implementation.
- Recorded the selected English/Telugu fictional-case scope and provisional INR 500 monthly planning ceiling.
- Kept model/architecture choices proposed and clinical/public deployment dependent on evidence; no application behavior or dependency changed.

### Repository automation — 2026-10-16

- Added a task-completion helper that commits explicitly selected files with a required dated history update.
- Added an installed checkout-local post-commit hook for automatic ordinary pushes to the matching branch of the reviewed origin.
- Preserved unrelated work and local commits on push failure; destination changes and existing custom hooks require review.
- Recorded standing user authorization for routine completed-work commits and GitHub sync without repeated confirmation.
- Verified the workflow with ten integration tests against isolated local Git repositories and remotes.

### Documentation — 2026-10-16

- Established the canonical product name, vision, connected layers, and four-agent direction.
- Rewrote the README to explain the demonstration baseline and guide contributors.
- Consolidated incomplete and repeated planning files into architecture, setup, layer, milestone, decision, research, and validation documentation.
- Established dated development history and required documentation updates alongside code.
- Preserved useful origin, research, future ideas, prior findings, and dependencies without publishing local chat/workspace identifiers.
- Replaced calendar-bound planning with ongoing milestones and acceptance gates.

Application code and dependency versions are unchanged. See [dated history](docs/history/2026-10-16.md) for scope and verification.

## Earlier repository history

- [`5400696`](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP/commit/54006967a0325acdae83e46f04a84b4ce1ad4f92): Material 3 component views and shared tokens.
- `4b0e6e3`: initial pharmacovigilance prototype and documentation, as recorded in Git.

Earlier templates did not establish a reliable release history. No version tags or completion dates are invented for that work.

## 2026-10-18 — Local account ADR persistence

- Added owner-isolated fictional ADR drafts with unfinished save, reopen/edit, explicit user confirmation and revision-checked deletion.
- Preserved legacy browser drafts in a separate demo; no automatic import or cloud provision.
- Added HTTP persistence/ownership/migration checks and a separate UI failure regression fixture. Hospital review/submission remains unimplemented.

## 2026-10-18 — Restrict legacy agents and startup exposure

- Disabled legacy APIs by default and permanently in production; trusted local opt-in precedes parsing/provider work and adds non-clinical metadata.
- Removed global permissive CORS; development HTTP/HMR bind to loopback.
- Added explicit Windows-compatible mode launchers, validated bind configuration and focused security tests.

## 2026-10-19 — Open-access MedAssist dataset strategy

- Verified NHAMCS 2022 IMMEDR labels, published class/missingness marginals, source terms and leakage risks.
- Added a pinned metadata manifest and separate real-acuity/synthetic-question experiment plan with three structured-model candidates and explicit uncertainty/evaluation gates.
- Kept MIMIC-IV-ED Demo smoke-only; no restricted data, training or patient-facing changes.

## 2026-10-19 — MedAssist ML Phase 1 data engineering

- Implemented isolated Python acquisition, Stata decoding, missingness/provenance audits and deterministic group-disjoint candidate partitions, with 14 passing synthetic tests.
- Acquired official NHAMCS 2022 outside Git; actual 16,025 visits/913 columns and all IMMEDR counts reconcile exactly. Committed safe aggregate reports/receipt summaries only.
- Verified supporting DDXPlus/MIMIC demo metadata without patient archives. Documented sparse Immediate support, symptom-filter selection, age provenance and timing blockers requiring Phase 1 review before training.
- Preserved application/ADR behavior and unrelated untracked work; no estimator training or clinical deployment.

## 2026-10-19 — MedAssist Phase 2 baseline protocol freeze

- Froze primary binary all-labelled and exploratory five-class symptom tasks, preserving existing group-disjoint outer partitions and matched vitals comparisons.
- Added no-RFV initial-vitals features, explicit zero/provenance cleaning, saved-assignment/source checks and fit-only CV/support preflight.
- Fixed LR/RF/HGB grids, primary-only calibration/threshold procedures and locked evaluation/rare-class safeguards. Twenty-three focused synthetic tests passed with warnings treated as errors.
- Recorded offline-only training readiness; no models trained or patient-facing MedAssist/ADR behavior changed.

## 2026-10-19 — MedAssist Phase 3 offline training and locked evaluation

- Implemented fold-local LR/RF/HGB pipelines, bounded candidate workers, convergence/failure logs, primary frozen-base calibration, development-only thresholds and all-task pre-test hashing/sealing.
- Completed all 60 configurations/180 CV fold fits, 12 final models and six calibrators under unchanged v1, then evaluated each frozen model once. No recorded training warnings/failures.
- Added 15 synthetic regressions (38 total), actual cached-result/threshold verification, aggregate comparisons/calibration/evaluation reports, four research model cards and reproducibility hashes. Raw data, private predictions and fitted artifacts remain external.
- Recorded material negative findings: primary vitals CV winner missed 86/411 high and 7/26 Immediate cases; every five-class variant missed exact Immediate class on all ten cases. Singleton strata suppress intervals. No clinical/app/ADR integration or safety behavior changed.
