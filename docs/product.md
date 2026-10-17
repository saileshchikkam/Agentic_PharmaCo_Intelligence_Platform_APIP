# Product vision

## Mission

**APIP — Agentic Pharma Co-intelligence Platform** aims to make suspected ADR reporting easy for ordinary people and useful for professional review. Technology follows purpose: ML, LLMs, RAG, and agents serve the workflow rather than existing solely as a technology showcase.

## Origin and team

According to Sailesh, the idea began in September 2024 when he and Mahesh P joined a multidisciplinary university event he calls Pharma Cognizance Week. Coming from B.Tech rather than pharmacy, Sailesh noticed that unwanted medicine effects can go unreported after a patient's original problem improves.

Wearable hardware and an initial SaaS direction were explored and dropped. The ADR Reporting System grew into Sailesh's final-year engineering project and the broader APIP vision.

- **Sailesh:** product vision and generative-AI experience.
- **Jayanth:** originated MedAssist AI.
- **Mitravind:** backend engineer.
- **Mahesh P:** co-originator of the initial ADR concept and pharmacy reviewer, as identified by Sailesh. Routine availability and agreed review scope are not established.

Sailesh reports consultation with and permission from the college pharmacy dean. Mahesh may be available for targeted/final checks; exact availability, review scope, and patient-data/study/dataset permissions remain to be established. Codex can prepare and check engineering/evidence work but does not provide human clinical validation. No additional qualifications are inferred for team members.

## Two connected product layers

### MedAssist AI

Approximately 20–30% of intended scope. A friendly conversation gathers symptoms/context, supports reviewed care guidance, and helps locate appropriate nearby facilities. A custom ML model is a research goal; its task, labels, dataset, and evaluation are not selected. LLM support may be used where justified.

The intended experience offers education and navigation rather than a cure or autonomous prescription. Low/medium/high urgency is an initial concept; uncertain/insufficient-information outcomes must also be possible. See [MedAssist](layers/medassist.md).

### ADR reporting and professional intelligence

Approximately 70–80% of scope and the platform's heart. Short questions, choices, free text, and optional medicine photos support reporting. The system proposes details; the user corrects/confirms them before a versioned report is reviewed, downloaded, followed up, or deliberately shared.

Professionals need review queues, clarification requests, evidence, decisions, and useful aggregate information. See [reporting](layers/adr-reporting.md) and [professional intelligence](layers/professional-intelligence.md).

These proportions express product priority, not measured effort. MedAssist is optional; direct reporting must work.

## Connected journey

1. Optional MedAssist conversation and care navigation.
2. Consultation and medication outside APIP unless a future integration is established.
3. Direct or linked suspected-ADR intake.
4. User confirmation, saved report, PDF, and controlled sharing.
5. Professional review, clarification, evidence, and follow-up.
6. Authorized descriptive analysis and expert-reviewed investigation of patterns.

Reporting, Validation, Knowledge, and Analysis agents coordinate supported steps. They do not independently authorize clinical conclusions or data distribution.

## Audiences

- Patients/caregivers and healthcare professionals: understandable intake, less effort, editable facts, and a useful report.
- Pharmacovigilance professionals and hospitals: complete cases, evidence provenance, review, and follow-up.
- Pharmaceutical safety teams/manufacturers and researchers: appropriately permissioned summaries and possible future research access, not automatic identifiable-record access.

## Confirmed constraints

- Reporting remains directly accessible and can retain drafts during optional-AI failure.
- Aim for 5–10 short steps in straightforward cases; ask more rather than fabricate facts.
- Keep user statements, AI suggestions, confirmations, and professional conclusions separate.
- Follow strict Material 3 across phones, tablets, and desktop.
- Treat the current build as a design demo, not delivered product functionality.
- The first test version uses English and Telugu with fictional cases, as selected by the user on 2026-10-16. This does not establish live-patient deployment permission.
- Sharing, public datasets, official submissions, and training reuse need the appropriate permissions.

## Success to demonstrate

Test whether guided, AI-assisted reporting reduces effort and improves completeness relative to a conventional form. Accurate exports, traceable evidence, reliable review, and safe uncertainty handling matter alongside interface quality.

Novelty, patentability, accuracy, superiority, adoption, and clinical readiness are not established. See [research and validation](research-and-validation.md).

## Developer design reference

**Clarified by Sailesh on 2026-10-17:** the existing showcase is the reusable UI reference for Sailesh and the development team, not the patient application. Preserve its component families and establish the rough application framework before continuing product workflows. The default appearance is clean white with blue highlights; users can select Google's familiar blue, red, yellow, or green highlights through appearance settings. Dark mode remains optional and uses charcoal grey surfaces.

Developer-only sign-in and role enforcement are required before making this reference available as a restricted hosted environment. The current local screen has no authentication; its label does not enforce access. The public patient/professional application must be separated from the developer reference.

## Initial sign-in framework

**Selected 2026-10-17:** design the front end first, with a simple main-page sign-in action and three shared-layout sign-in views: personal/patient, pharmacovigilance specialist, and developer design reference intended for Sailesh. Authentication is explicitly deferred. The UI must use Material 3, clear typography, white surfaces, responsive spacing, rounded shapes, and restrained accessible motion. A visible role selection is not proof of permission; server-enforced roles are still required later.

Patient task links should remember the selected destination through sign-in and return only after the session is verified. This is a product requirement for a future authentication integration; the current preview merely demonstrates the intended route and does not establish a session or unlock patient features.
