# Research, data, and validation

**Current scope (user revision, 2026-10-17): English only; no required paid services; all-age product intent with caregiver-managed child profiles. This supersedes earlier Telugu/bilingual and INR 500 planning references below. Clinical coverage for each age group still needs suitable data and evaluation.**

This register records preliminary source research and linked acquisition evidence, not a systematic literature review or clinical validation. Sailesh identifies Mahesh P as the pharmacy reviewer with limited availability; agreed scope and clinical review are still needed. The pharmacy dean's reported permission remains institutional context, not a blanket data/study permission. A tiny fictional model smoke check is recorded separately in [models](../models/README.md); it is not clinical evaluation.

## Questions and hypothesis

Investigate current Indian ADR reporting routes, reporting barriers, commonly missing information, professional case-review workflows, existing AI/ML approaches, LLM/RAG work, agent-based workflows, and remaining evidence-supported gaps.

**Hypothesis:** guided, AI-assisted reporting can reduce friction and improve completeness/usability relative to a conventional form. Test it; do not assume novelty, accuracy, clinical superiority, or adoption.

Compare manual reporting, guided questions, and guided questions with extraction where feasible. Evaluate MedAssist separately from reporting so gains in reporting do not conceal care-guidance errors.

The user selected English and Telugu with fictional cases for initial testing. Include Telugu script, transliterated Telugu, and mixed English/Telugu slices in extraction, retrieval, UI/PDF, and MedAssist checks. Preserve original language and review translations/labels with an appropriate bilingual reviewer. Translated or paraphrased copies of one case must stay in the same ML split; a small bilingual demonstration is not evidence of population-wide performance.

## Data and source governance

Before using a source/dataset, record its owner, URL/version/date, licence/permitted purpose, geography, population/coverage, labels, personal-data risks, access rules, review status, and limitations. Retrieval access does not establish a licence or clinical endorsement.

- Use fictional cases for software work by default.
- Separate patient operations, de-identified analytics, medical-source retrieval, and research/training collections.
- Confirm permitted external model/embedding processing and map disclosure.
- New reports do not automatically become training data or approved evidence.
- Check terminology licensing, including MedDRA/WHODrug, before treating a demo field as an integration.
- Any public dataset release needs separate permission and re-identification-risk review.

## Candidate data and evidence sources

**Phase 4A, 2026-10-19:** [error audit and independent study design](../models/medassist/reports/2026-10-19-phase4a/README.md) now separate cached development investigations from post-hoc opened-test descriptions. The linked feature ledger, nine-source feasibility matrix, source manifest, reviewable study and risk register own the next research gates. No new dataset archives, training, threshold tuning or clinical behavior were introduced. No candidate is approved as independent all-age home-triage ground truth.

**Research checked 2026-10-16; no dataset was downloaded or approved for ingestion by this pass.** Sources serve different tasks. Do not combine them into a single supposed clinical training set. Before adoption, complete the governance fields above, select a snapshot/version, inspect quality and rights, and document the actual ingestion.

### First evidence and reporting research

- **openFDA drug labels — RAG candidate.** The official API provides manufacturer/distributor Structured Product Labeling with sections such as adverse reactions. Use a small selected, versioned corpus and preserve exact product/ingredient/source mapping. US labels need relevance review for Indian products; they are not a complete India-specific medicine catalogue. FDA notes that content is reformatted and not verified by FDA and may not match currently distributed or approved labelling. API access is not clinical endorsement or proof that all source text is freely redistributable. [Official overview](https://open.fda.gov/apis/drug/label/)
- **openFDA drug-event reports — descriptive analytics research.** Useful for studying report structure, missingness, follow-ups/duplicates, and aggregate queries. Follow source identifiers/version fields and counting rules rather than assuming each row is an independent person. Multi-drug/multi-event reports do not identify a validated causal pair, and counts cannot estimate incidence. They do not provide ground-truth MedAssist urgency labels. Verify snapshot and API/source terms before importing. [Official overview and limitations](https://open.fda.gov/apis/drug/event/)
- **ADE Corpus V2 — extraction/classification candidate, rights unresolved.** Its card describes English ADE-related sentence classification and drug–event/drug–dose relation annotations, potentially useful for a narrow supervised extraction baseline. The inspected distribution marks its licence **unknown**, with incomplete provenance/licensing fields. Confirm original rights/permission before training or redistribution; public hosting alone is insufficient. Group repeated sentences/related source documents when splitting. [Dataset card](https://huggingface.co/datasets/ade-benchmark-corpus/ade_corpus_v2)
- **CADECv2 / MultiADE — patient-language extraction candidate.** The authors' benchmark is relevant to extracting ADEs across genres and includes annotated forum language. The publisher's page required JavaScript in this research tool, so exact downloadable artifact/version/licence was not independently established here. Keep it pending verification, not an approved training corpus. [CSIRO collection](https://data.csiro.au/collection/csiro:62387), [authors' MultiADE paper](https://arxiv.org/abs/2405.18015)

### Supporting QA and bilingual evaluation

- **MedQuAD — reference retrieval/QA research.** The authors supply medical QA derived from NIH sites and state CC BY 4.0. Their README explicitly removes answers from three MedlinePlus subsets for copyright reasons. Do not recover/rehost those removed answers merely because URLs remain. Check currency and source permissions for the subset used; these are reference QA, not patient triage labels. [Author repository and licence notes](https://github.com/abachaa/MedQuAD)
- **MedMCQA — optional medical knowledge benchmark.** English medical entrance-exam questions can compare a limited QA capability; the author repository lists MIT licensing. Verify rights for the actual selected artifact and preserve authors' split protocol. Exam performance is not evidence of safe conversations, Telugu capability, ADR extraction, or urgency prediction. Keep public benchmark contamination in mind when interpreting pretrained-model scores. [Author repository](https://github.com/medmcqa/medmcqa)
- **AI4Bharat IN22-Gen — optional language evaluation.** The card lists CC BY 4.0, includes Telugu within its Indic-language benchmark, and requires acceptance/contact sharing for file access. No conditions were accepted and no account details shared here. Use it for general translation/language checks, not clinical ground truth; maintain a separate clinically reviewed APIP Telugu/mixed-language set. [Publisher card](https://huggingface.co/datasets/ai4bharat/IN22-Gen)

### MedAssist symptom/urgency candidates — checked 2026-10-17

The initial shortlist is superseded for MedAssist by the **open-access-only strategy verified 2026-10-19**. The [technical experiment plan](../models/medassist/experiment-plan.md) and [verified manifest](../models/medassist/open-access-manifest.json) own target, feature-time, split and evaluation details. Subsequent authorized [Phase 1 acquisition/profiling](../models/medassist/reports/2026-10-19-phase1/README.md) acquired NHAMCS Stata records outside Git and reconciled 16,025 visits/10,207 labels. DDXPlus and MIMIC demo remain metadata-only. No models were trained during that Phase 1 task; subsequent Phase 3 evidence is recorded below.

- **Primary: CDC NHAMCS 2022 public-use ED.** Official codebook IMMEDR records five nursing-triage levels (Immediate through Nonurgent), with explicit missing/no-triage codes. Feasible for bounded offline US ED acuity research, not validated home triage. NCHS permits statistical analysis/reporting under its public-use agreement; no credentials/fee required. Exclude post-triage fields, diagnosis-informed demographic imputations and drug/Multum features. Published class support/missingness and survey constraints are recorded in the plan. [CDC source](https://www.cdc.gov/nchs/nhamcs/documentation/index.html).
- **Supporting: DDXPlus English v2.** Official Figshare metadata confirms CC BY 4.0 and public downloads. Use synthetic symptom representation and adaptive question research separately, preserving official splits and revealed-answer boundaries. Diagnosis, differential and condition severity must never become real acuity labels. [Pinned release](https://figshare.com/articles/dataset/DDXPlus_Dataset_English_/22687585/2).
- **Smoke only: MIMIC-IV-ED Demo v2.2.** Public under ODbL 1.0; attribution/share-alike/produced-work conditions apply as relevant. Use only for schema/join/unit/leakage checks, not training, calibration or performance estimates. [Official demo](https://physionet.org/content/mimic-iv-ed-demo/2.2/).
- **Excluded from this MedAssist strategy:** credentialed full MIMIC-IV-ED and all other restricted datasets. Publicly accessible is not unrestricted, and source terms do not establish clinical use permission.

**Phase 2 review/freeze, 2026-10-19:** the [baseline protocol](../models/medassist/baseline-protocol.md) and [actual preflight](../models/medassist/reports/2026-10-19-phase2/README.md) retain both existing split digests. Binary high acuity on all labelled visits is primary; five-class symptom research is exploratory and uncalibrated. Matched cohorts, explicit zero/provenance handling, fit-only CV and separate primary calibration/threshold roles are frozen. Engineering readiness is GO for a later baseline task only; timing and home/India/paediatric transportability remain unresolved. Current MedAssist clinical behavior is unchanged; no models trained.

**Phase 3 actual evidence, 2026-10-19:** [offline baseline results/model cards](../models/medassist/reports/2026-10-19-phase3/README.md) now exist under unchanged frozen v1. Training, calibration, all-task pre-test sealing and one-time testing completed; no care inference was connected. The predeclared primary vitals RF missed 86/411 high-acuity and 7/26 Immediate cases; all five-class variants missed exact class 1 for all ten Immediate cases. High false-positive load and abstention-aware misses are reported. Singleton strata prevent the requested test intervals, with no IID substitute. Further error/label review and independent validation are required; this opened test cannot support fresh confirmatory claims after retuning. DDXPlus/MIMIC remain separate and metadata-only.

### Deferred or missing

- **MIMIC-IV:** consider only for a later justified research task after credentialing, required training, and the data use agreement. Do not send its restricted data through general hosted LLM APIs; PhysioNet has explicit online-service restrictions. This is unnecessary for the initial fictional reporting workflow. [Access requirements](https://mimic.mit.edu/docs/faq/how-to-get-access.html), [online-service policy](https://physionet.org/news/post/gpt-responsible-use/)
- **SIDER:** potentially relevant drug–effect reference, but its download page returned an access challenge; licence/version were not verified during this pass. Do not import or describe it as unrestricted. [Publisher](https://sideeffects.embl.de/)
- **MedAssist training:** NHAMCS recorded ED acuity is now verified for offline research; suitable independently validated home-triage labels and all-age transportability remain unestablished. Agree the target and label rubric with appropriate reviewers, then assess permitted data. Neither medical MCQs nor automatically translated/LLM-labelled ADR sentences close this gap.

**Recommended order:** build fictional reporting fixtures; assess a small label/reference corpus for RAG; resolve annotated extraction-corpus rights; use a small event-report snapshot for analytics research only when its ingestion is justified. Keep QA/language benchmarks separate. Custom urgency training waits for task-matched data and reviewed labels, while application work continues.

## MALADE reference candidate

Sailesh identifies MALADE as inspiration and plans to share the exact paper/repository. A likely match is [the authors' repository](https://github.com/jihyechoi77/malade) and [MLHC 2024 paper](https://proceedings.mlr.press/v252/choi24a.html). The abstract and repository README were inspected; this was not a full code audit or paper reproduction.

MALADE studies drug/category–outcome associations using drug-label evidence, LLM agents, and RAG. Its README uses Langroid, OpenFDA, and an OMOP association reference; MIMIC-IV is optional for selecting representative drugs. Its authors' results do not establish APIP performance.

Use it to study evidence flow, critic/review stages, source grounding, and experimental evaluation. APIP also needs patient intake, bilingual confirmation, PDF/version persistence, access controls, and independently evaluated MedAssist. Do not describe MALADE as a complete implementation of that broader product. Exact user reference confirmation, code/data licensing, dependency review, resource costs, and a bounded reproduction remain open; no code, prompts, weights, or data were copied or connected here.

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

Official model/runtime/method references checked for the proposed technical approach are linked in the [AI implementation guide](ai-implementation.md). Model cards and provider documentation establish interfaces and candidates, not APIP clinical accuracy or successful local operation.
