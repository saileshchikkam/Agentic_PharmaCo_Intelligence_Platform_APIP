# Product vision

## Mission

**APIP — Agentic Pharma Co-intelligence Platform** aims to make suspected ADR reporting easy for ordinary people and useful for professional review. Technology follows purpose: ML, LLMs, RAG, and agents serve the workflow rather than existing solely as a technology showcase.

## Origin and team

According to Sailesh, the idea began in September 2024 when he and Mahesh P joined a multidisciplinary university event he calls Pharma Cognizance Week. Coming from B.Tech rather than pharmacy, Sailesh noticed that unwanted medicine effects can go unreported after a patient's original problem improves.

Wearable hardware and an initial SaaS direction were explored and dropped. The ADR Reporting System grew into Sailesh's final-year engineering project and the broader APIP vision.

- **Sailesh:** product vision and generative-AI experience.
- **Jayanth:** originated MedAssist AI.
- **Mitravind:** backend engineer.
- **Mahesh P:** co-originator of the initial ADR concept.

Sailesh reports consultation with and permission from the college pharmacy dean. Named reviewers and the scope of patient-data, study, and dataset permissions remain to be established. Do not infer clinical qualifications for team members.

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
- Sharing, public datasets, official submissions, and training reuse need the appropriate permissions.

## Success to demonstrate

Test whether guided, AI-assisted reporting reduces effort and improves completeness relative to a conventional form. Accurate exports, traceable evidence, reliable review, and safe uncertainty handling matter alongside interface quality.

Novelty, patentability, accuracy, superiority, adoption, and clinical readiness are not established. See [research and validation](research-and-validation.md).
