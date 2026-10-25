# APIP - Agentic Pharma Intelligence Platform

APIP aims to make suspected adverse drug reaction (ADR) reporting simple for patients and useful for the professionals who review it. It connects medical assistance, guided reporting, and evidence-based professional review in one platform.

**Current status:** the running app offers welcome, patient-home, sign-in, fictional ADR drafts and a development-only MedAssist conversation using sealed Model A for adaptive questions. Constrained deterministic English understanding and optional backend-only Groq extraction propose evidence for explicit confirmation. UNKNOWN, negatives, unmentioned evidence and source context stay distinct; up to eight topical follow-ups produce a versioned fictional export. Independent provisional safety rules and consent-based external Maps search are implemented, but known heart-attack/stroke declaration misses remain unresolved. Model B, diagnosis and personalized clinical precautions stay disabled. Fictional ADR drafts save to local accounts with revision checks; local signup, cookie sessions and SQLite profiles work in development. Cloud/clinical workflows remain pending. This is not clinically validated or production-ready. See the [checkpoint and limitations](models/medassist_ai/docs/checkpoint-2026-10-25.md) and [roadmap](docs/roadmap.md).

## The product

- **MedAssist AI:** conversational assistance and care navigation, with a proposed custom-ML research component. Approximately 20â€“30% of intended scope.
- **ADR reporting and professional intelligence:** guided intake, user-confirmed reports, PDF export, follow-up, professional review, evidence retrieval, and descriptive analytics. Approximately 70â€“80% of intended scope.
- **Four coordinated agents:** Reporting, Validation, Knowledge, and Analysis. Their production workflow is planned; experimental endpoints do not establish validated capability.

ADR reporting must work directly, without requiring MedAssist first. Important decisions remain reviewable by people. Read the [product vision](docs/product.md) for origin, team, journeys, and scope.

**Current direction:** English only, no required paid services, and all-age scope with caregiver-managed child profiles. Clinical model coverage is not established.

## Start here

- [MedAssist Symptom Assessment v2](models/medassist_v2/README.md): Task 4B official training/validation completed with a verified pre-test seal. All 132,448 synthetic validation interviews were evaluated; selected ranker recall@20 is 77.1866%. This is evidence collection, not clinical accuracy. Locked testing and clinical integration remain unexecuted; five questions remain quarantined and read-only checksum portability is covered by the [authenticated compatibility verifier](docs/model-a-protocol-portability.md); frozen study commands retain their strict original gate.
- [Model A research adapter](models/medassist_v2/research_adapter/README.md): opt-in local FastAPI reuses the preserved ranker through the fictional lab and DEV-only conversation. Frozen scoring/encoding and the A-to-B contract are unchanged; this is not a clinical route.
- [Fictional Model A question lab](src/features/model-a-research/README.md): Day 2 adds a development-only loopback workflow with typed answer controls, explicit UNKNOWN/conflict/stop states and unchanged versioned evidence export. Model B stays disabled; the screen is excluded from the production client and has no patient-navigation link.

- [MedAssist Phase 4A error audit and validation plan](models/medassist/reports/2026-10-19-phase4a/README.md): preserved benchmark, cached error patterns, dataset feasibility and independent-study gates. Offline research only.

- [MedAssist Phase 3 actual ML results](models/medassist/reports/2026-10-19-phase3/README.md): completed offline training, locked evaluation, error findings and model cards. Clinical inference remains disabled.

- [MedAssist Phase 2 baseline protocol](models/medassist/baseline-protocol.md): frozen offline binary/secondary tasks and split reuse. Its freeze-time readiness evidence precedes the completed Phase 3 training.

- [MedAssist ML Phase 1](models/medassist/reports/2026-10-19-phase1/README.md): acquired/profiled NHAMCS offline, reproducible Python pipeline and actual quality/split blockers. No model training or clinical integration.

- [Documentation guide](docs/README.md): where to find information and how to maintain it.
- [Account and shared-profile setup](database/README.md): working local signup/storage, optional Google/cloud setup, ownership rules and limitations.
- [Development setup](docs/development.md): commands, configuration, and verification limits.
- [Architecture](docs/architecture.md): actual code and proposed application design.
- [Layer guides](docs/layers/README.md): responsibilities, boundaries, and acceptance criteria.
- [Roadmap](docs/roadmap.md): sequenced milestones, blockers, and future ideas.
- [AI implementation guide](docs/ai-implementation.md): custom ML, local/API models, evidence-backed RAG, agents, and budget-aware evaluation.
- [Model catalogue and local checks](models/README.md): installed Ollama inventory, hosted-provider candidates, and reproducible fictional diagnostics.
- [Decisions](docs/decisions.md): confirmed direction versus engineering proposals.
- [Research and validation](docs/research-and-validation.md): evidence, datasets, experiments, and release gates.
- [Development history](docs/history/README.md): dated records of actual work and checks.
- [Changelog](CHANGELOG.md): concise notable changes.
- [Contributor and agent instructions](AGENTS.md): mandatory working and documentation rules.

## Existing demonstration

The declared stack includes React, TypeScript, Vite, Tailwind CSS, Material Web, Node.js/Express, and Google GenAI. The repository includes a Bun lockfile.

With Bun available, the intended local workflow is:

```sh
bun install --frozen-lockfile
bun run dev
```

Development uses loopback port `3000`; legacy APIs default off and cannot run in production. `dev` and `start` explicitly select runtime modes. See [runtime configuration](docs/development.md#legacy-api-security-boundary). In the current checkout, the frozen Bun install, frontend lint, and production build passed on 2026-10-17; a clean-clone setup and deployment remain unverified. See [development setup](docs/development.md). The optional AI key is server-side, and the current startup script does not automatically load `.env`.

Open the main page and choose **Sign in**. Patient signup/sign-in uses development-only local account storage when hosted configuration is absent; specialist and developer forms remain previews without role enforcement. Use fictional credentials and details only. See the [welcome/sign-in guide](src/features/access/README.md) and [account setup](database/README.md).

The Developer view includes an explicit **Open developer reference preview** link to the preserved Domain Components, Core Components, and Design Tokens. Appearance settings remain available throughout. The ADR intake can be previewed from the patient sign-in route after selecting ADR reporting; it is fictional-only and supports local account storage or an explicitly separate browser demo. Earlier patient/report/records experiments remain separate. See the [design-system guide](src/design-system/README.md).

## Design direction

All future interfaces must follow [Material Design 3](https://m3.material.io/components) and use [Material Web](https://github.com/material-components/material-web) where available. Preserve the current showcase as reference. Verify responsive behavior, accessibility, interaction states, typography, color roles, and motion rather than assuming the demo already meets every requirement.

## How progress is recorded

Every meaningful change includes relevant documentation and verification results in the same commit. Codex has standing authorization to commit and sync completed APIP work automatically; the repository's post-commit hook performs GitHub sync. See [automatic workflow setup and recovery](scripts/README.md). We use milestones and dated history rather than a fixed-duration project label. Completed work, plans, experiments, and unverified claims remain distinct.

Use fictional cases during development. No official reporting integration, public clinical deployment, or permission to publish patient records is established.

## Team and licence

The team is Sailesh, Jayanth, Mitravind, and Mahesh P; see the [product overview](docs/product.md).

See [LICENSE](LICENSE) for the repository licence. Third-party components, datasets, templates, and terminology retain their own terms.

MedAssist engineering: [modular research composition](models/medassist_ai/README.md) preserves sealed Model A, confirmed evidence and separate language/safety/navigation boundaries. The narrow Groq benchmark does not qualify the broader experimental conversation. Jayanth disease execution and live urgency remain disabled. Provisional safety is incomplete and unreviewed; Maps hands off only consented location, with no verified facility suitability or availability. [Latest understanding evidence](models/medassist_ai/docs/symptom-understanding.md) distinguishes development checks from clinical evaluation.

## Contributor backend and main-branch reconciliation

APIP combines MedAssist with direct ADR reporting and the planned Reporting, Validation, Knowledge and Analysis agents; their production coordination and professional review remain unfinished. The standalone FastAPI/PostgreSQL disease-classifier contribution under `app/` is preserved alongside the APIP React/Express application, not activated as clinical Model B. Its original documentation is [preserved separately](docs/contributors/jayanth-medassist-backend.md) with current safety and execution caveats. Do not use its import-time model/database startup as the APIP preview command. Root `requirements.txt` belongs to that isolated contributor backend; it is not a replacement for the frozen Model A environment. [Reconciliation evidence and remaining limits](docs/reconciliation-2026-10-26.md).

Read-only Model A protocol portability: [verified repair and fresh-checkout results](docs/model-a-protocol-portability.md). This does not authorize training/locked testing or qualify clinical use. The seventeen sealed artifacts and historical evidence remain unchanged.
