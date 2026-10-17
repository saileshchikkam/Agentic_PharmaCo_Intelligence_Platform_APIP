# Changelog

Notable product and developer-facing changes. Entries describe completed work; plans belong in the [roadmap](docs/roadmap.md). An unreleased entry does not imply a release or clinical readiness.

## Unreleased

### Patient home UI preview — 2026-10-17

- Added a responsive patient home with MedAssist and direct suspected-ADR reporting choices, plus patient-oriented header help and a clear preview label.
- Linked the patient sign-in view to the home preview without simulating authentication; task actions explain their implementation status.
- Corrected the shared button wrapper to place trailing icons in Material Web's supported icon slot and trailing-icon state.

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
