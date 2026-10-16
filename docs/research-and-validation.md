# Research, data, and validation

No formal literature review, clinical validation, licensed dataset access, or completed evaluation is established by this documentation. The pharmacy dean's reported permission is institutional context; its exact scope and named reviewers remain open.

## Questions and hypothesis

Investigate current Indian ADR reporting routes, reporting barriers, commonly missing information, professional case-review workflows, existing AI/ML approaches, LLM/RAG work, agent-based workflows, and remaining evidence-supported gaps.

**Hypothesis:** guided, AI-assisted reporting can reduce friction and improve completeness/usability relative to a conventional form. Test it; do not assume novelty, accuracy, clinical superiority, or adoption.

Compare manual reporting, guided questions, and guided questions with extraction where feasible. Evaluate MedAssist separately from reporting so gains in reporting do not conceal care-guidance errors.

## Data and source governance

Before using a source/dataset, record its owner, URL/version/date, licence/permitted purpose, geography, population/coverage, labels, personal-data risks, access rules, review status, and limitations. Retrieval access does not establish a licence or clinical endorsement.

- Use fictional cases for software work by default.
- Separate patient operations, de-identified analytics, medical-source retrieval, and research/training collections.
- Confirm permitted external model/embedding processing and map disclosure.
- New reports do not automatically become training data or approved evidence.
- Check terminology licensing, including MedDRA/WHODrug, before treating a demo field as an integration.
- Any public dataset release needs separate permission and re-identification-risk review.

## Clinical and analytical boundaries

Use suspected-report language. Counts/proportions of submitted reports do not establish population incidence or prove a drug caused an event. Keep current urgency, symptom intensity, regulatory seriousness, and causality distinct.

Choose the appropriate consumer/professional reporting form with a reviewer, record its version, and distinguish document generation from official acceptance. Verify receiving institutions and integration rights.

MedAssist's intended urgency/care functions need clinical and regulatory assessment. Project/dean permission alone is not patient recruitment approval, data permission, or clinical validation. Relevant Indian data-protection applicability and phased commencement need qualified review before real-data use.

## Proposed evaluation gates

These are planning targets, not results or universally validated thresholds. Confirm them with reviewers and record actual denominators/errors.

- **Reporting:** 100 curated fictional or explicitly permitted de-identified scenarios, including missing dates, multiple medicines, contradictions, and follow-ups. Critical facts must be supported or explicitly unknown; compare extraction to source and confirmed versions.
- **PDF:** 20 edge-case fixtures. Reconcile all mapped fields and visually inspect every page for long text, medicine lists, and follow-ups.
- **Retrieval:** at least 40 reviewed answerable, conflicting, and unanswerable questions. Measure relevance, citation support, and unsupported statements; retain insufficient-evidence behavior.
- **MedAssist:** at least 30 clinically reviewed urgent/uncertain boundary vignettes plus routine/out-of-scope scenarios. No missed urgent trigger in a small regression set is a minimum engineering gate, not proof of real-world sensitivity or safety. Report confusion counts, calibration, coverage, and uncertainty. No adequate review means no live urgency-model release.
- **Custom ML:** document task, lawful data, labels, baseline/candidate, patient/source/time-aware splits, leakage prevention, held-out results, and reproducibility. Do not publish an invented accuracy number when data is unavailable.
- **Usability:** subject to institutional permission, compare fictional-case tasks with 8–12 adult volunteers using counterbalanced order. Measure time, omissions, corrections, and perceived ease. A 25% median-time reduction is an exploratory target, not an established outcome.
- **Access/integrity:** required role/object/file-isolation checks, audit attribution, idempotency, and stale-result invalidation pass.
- **Reliability:** measure a pilot baseline at 25 concurrent fictional users; initially target non-model API p95 under one second. Measure provider latency separately; verify cancellation and failure recovery. Adjust targets to the measured environment.
- **Operations:** prove restore/rollback. Proposed pilot recovery goals are at most 24 hours of data loss and four hours to restore, subject to hosting and a successful drill.
- **Release:** no unresolved critical safety/privacy/data-loss defect; disabled features and failed gates remain visible. A synthetic evaluation pilot does not establish public clinical readiness.

## Reference register

The following official references were checked on 2026-10-16 during planning. Recheck applicability/version before implementation; source retrieval is not clinical review.

- [IPC ADRMS launch](https://www.ipc.gov.in/news-highlights/1315-launch-of-the-adverse-drug-monitoring-system-adrms-online-portal.html): official digital reporting already exists; APIP's value needs to be tested as improved usability and information quality.
- [IPC reporting tools](https://www.ipc.gov.in/PvPI/adr.html): consumer/professional materials and monitoring-centre information; this page includes older material, so confirm current routes with IPC/institutional reviewers.
- [IPC professional form, Version 1.4](https://www.ipc.gov.in/images/ADR_Reporting_Form_1.4_Version.pdf): verified reference, not a claim it is the latest required version.
- [FDA AEMS dashboard limitations](https://www.fda.gov/drugs/fda-adverse-event-monitoring-system-aems/fda-adverse-event-monitoring-system-aems-public-dashboard): submitted reports alone do not establish causation or occurrence rates.
- [openFDA drug-event API](https://open.fda.gov/apis/drug/event/): potential reference data; document chosen snapshot, limitations, and permitted use.
- [WHO AI-for-health guidance](https://www.who.int/publications-detail-redirect/9789240084759): governance reference for evaluation and appropriate health-AI use.
- [WHO international drug-monitoring programme](https://www.who.int/teams/regulation-prequalification/regulation-and-safety/pharmacovigilance/networks/pidm): national-programme context, not an APIP submission integration.
- [CDSCO software guidance](https://www.cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/Guidance-document-on-Medical-Device-Software-under-MDR-2017.pdf): intended-use assessment; no APIP device classification is asserted here.
- [MeitY DPDP Rules 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf): review provision-specific applicability before real-data use.
- [Google Places Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search): candidate facility integration; verify terms, costs, storage, attribution, and disclosure before implementation.
- [Material Web](https://github.com/material-components/material-web): required component source; upstream notes maintenance mode, so isolate wrappers and review dependencies.
- [Material 3 components](https://m3.material.io/components): required design specification; the dynamic page's detailed contents were not retrievable in the planning text tool, so consult component guidance during implementation.

Add papers, datasets, reviewers' findings, and experiment results only when actually obtained. Keep source claims separate from project assumptions and measured results.
