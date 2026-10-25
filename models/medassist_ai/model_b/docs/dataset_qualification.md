# Model B dataset qualification

Assessed 2026-10-24. **Decision: Conditional; training cannot begin.** This is an AI-assisted engineering/source review, not legal clearance or human clinical sign-off. Public documentation was reviewed; no patient-level files were acquired or inspected, credentials tested, training run, or dataset admitted. The live Model B remains disabled.

## Recommendation and target boundary

**Prioritize MIMIC-IV-ED v2.2 for an access/clinical feasibility review of a bounded ED-acuity research study. No reviewed candidate is approved for the current four-level MedAssist task.** MIMIC's scale, features and setting cannot be silently repurposed as community care dispositions. If the intended task remains conversational community urgency, obtain a rights-cleared, independently adjudicated cohort matching that task; an ED proxy alone will not resolve the blocker.

The [blueprint](../../../../docs/architecture/MEDASSIST_MASTER_BLUEPRINT.md#6-model-b-planned-untrained-and-disabled) requires prospective definitions of population, setting, prediction time, users and action meanings. [label-schema.v1.json](../label-schema.v1.json) still has four undefined technical slots, `approved: false`, no emergency mapping, and separate `unable_to_assess`. Therefore even a dataset with exactly four categories would not establish alignment.

These outcomes must remain distinct:

- **ED acuity:** prioritization after arrival, often using measured vital signs and examination. A low ED priority or discharge home does not establish that staying home would have been safe before assessment.
- **Referral urgency:** priority/timeframe for a particular service or clinician inbox; relative message ordering does not supply absolute community disposition classes.
- **Diagnosis:** a condition label, not urgency. Neither Jayanth's disease predictions nor diagnosis codes may generate Model B targets.
- **Symptom-checker disposition:** advice about care seeking. Vendor advice is a prediction; only independently reviewed reference decisions could be candidate labels.

No five-to-four collapse, invented threshold, automatic disease mapping, or new clinical ground truth is proposed here. Abstention is an outcome of insufficient/rejected evidence, not an invented fifth supervised class or a renaming of every missing source label.

## Ranked serious candidates

Rank reflects research utility and auditability, **not approval for clinical training**. Sizes below are source-reported, not locally counted. Exact class counts, duplicate rates and Model A coverage percentages were not measured.

### 1. MIMIC-IV-ED v2.2 — Conditional, preferred ED research candidate

[Official release](https://physionet.org/content/mimic-iv-ed/2.2/): approximately 425,000 BIDMC ED stays, 2011–2019. Recorded acuity has five ordered levels, 1 highest and 5 lowest. Triage includes complaint, pain and vital signs; demographics and patient/stay identifiers support feature and grouping review. Age requires a linked MIMIC-IV resource. Discharge diagnosis, disposition and later measurements must not enter a triage-time predictor. Repeated stays share `subject_id`; split by patient, not row. Dates are shifted per patient: cross-patient raw timestamp ordering is not a valid calendar holdout. Single-center coverage does not establish pediatric, Indian or Telugu applicability. Class support and label reliability require authorized inspection; recorded clinician acuity is not automatically independent adjudication.

[Verified license: PhysioNet Credentialed Health Data License 1.5.0](https://physionet.org/content/mimic-iv-ed/view-license/2.2/). Access requires credentialing, CITI Data or Specimens Only Research training and project DUA. Terms restrict use to lawful scientific research, prohibit access sharing/reidentification and require data security. Project access and downstream product-use permission are **not established**. Do not put restricted records in Git, cloud LLM requests or public demos. Any linked resource needs its own applicable authorization.

**Blockers:** permissions, target/setting mismatch, reviewed feature crosswalk, label adjudication, rare-class and external evaluation evidence. Preserve the original five-level endpoint in any separately approved ED study; do not fit it into the current four-slot trainer by relabeling.

### 2. Moon et al. KTAS study — Conditional, smaller public-source pilot

[Official PLOS study and supporting-information links](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0216972): 1,267 included records from two Korean urban academic EDs, 2016–2017; eligibility was age over 15. Five-level KTAS labels include nurse and expert assessments. Three selected experts reviewed initial nursing records; insufficient records were excluded. Complaint/history, vitals, mental state and pain are relevant inputs. Nurse KTAS and error indicators are not predictors of expert KTAS; exclude outcomes and post-assessment fields. The published work is CC BY, with S1 data and S2 coding guidance openly linked. This review did not acquire supplements or independently verify their separate landing-page license metadata; do not infer rights from Kaggle mirrors.

**Blockers:** confirm supplement terms/version and patient grouping identifiers; measure class support/duplicates. Small, selected, mostly adult ED coverage and exclusion of insufficient records limit abstention assessment. Expert ED labels still do not directly establish four community dispositions. Site-held-out feasibility depends on usable identifiers and support. Obtain qualified alignment/adjudication and feature review before any admission.

### 3. NHAMCS ED 2022 — Conditional statistical comparator; unsuitable as direct product labels

[CDC summary](https://www.cdc.gov/nchs/data/nhamcs/web_tables/2022-nhamcs-ed-web-tables.pdf) reports 16,025 submitted visit forms in a multistage US ED survey. National weighted totals are not independent training examples. [Official public-use codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf), printed pages 36–37: `IMMEDR` 1 immediate, 2 emergent, 3 urgent, 4 semi-urgent, 5 nonurgent; -9 blank, -8 unknown, 0 no triage for that visit in a triaging service, 7 service does not conduct nursing triage. These are not four community classes. Initial vitals, demographics and up to five reason-for-visit fields offer partial coverage; diagnoses, tests and discharge information risk leakage. Reasons not listed are not explicit negative symptoms. Survey design and changing year-specific coding need review; public fields do not establish longitudinal patient separation. Class/support and subgroup feasibility remain unmeasured here.

[Verified NCHS public-use terms](https://www.cdc.gov/nchs/policy/data-user-agreement.html): statistical reporting/analysis only; no identification or linkage to individually identifiable data. Public access is not unrestricted operational-use permission. **Blockers:** intended-use/legal review, target alignment, grouping limitations and survey-aware evaluation. Existing APIP NHAMCS work remains a separate research track; no prior results or held-out records were reused.

### 4. Fraser et al. real-patient symptom-checker study — Conditional acquisition lead, not a training cohort

[Official JMIR study](https://mhealth.jmir.org/2022/9/e38364): 40 consenting adults, 37 with triage data, at one US ED. Patient-reported adaptive answers were reviewed by three emergency physicians, initially without vital signs and then with them. This separation is methodologically closer to conversational evidence. The article is CC BY 4.0 and links selected supplementary case information, but this review did not establish a reusable full answer-level dataset, its usage permissions or four approved reference classes. Vendor advice itself is not ground truth. Tiny subgroup/class support and ED-only recruitment preclude treating this as a sufficient development/independent-validation cohort. **Next prerequisite:** verify with the data controller what governed, adjudicated answer-level data can lawfully be reused; do not infer access from the article license or download case appendices for this task.

## Other sources screened, not promoted to clinical training data

- [Schmieding symptom-checker benchmark documentation](https://search.r-project.org/CRAN/refmans/symptomcheckR/html/symptomcheckRdata.html) describes 45 vignettes and app outputs in three disposition categories, with separate reference solutions and repeated vignette IDs. It links the [author deposit](https://doi.org/10.5281/zenodo.6054092). Deposit access/license could not be verified through this review's browser; no dataset license is inferred from an R package license. **Not suitable as real clinical training ground truth**; potentially a separately licensed challenge benchmark. Group by vignette, not app-output row; keep app predictions separate from references. Three categories do not resolve four targets.
- [PMR-Bench primary preprint](https://arxiv.org/abs/2601.13178) describes 1,569 unique outpatient portal messages and over 2,000 test pairs with relative urgency judgments. **Not suitable as direct four-class labels.** Shared messages/patients across pairs require grouping. Exact reuse license/access, population coverage and feature rights were not established, so this is a screened referral-priority lead, not a qualified acquisition recommendation.
- [MIMIC-IV-Ext Triage Instruction Corpus v1.0.0](https://physionet.org/content/mietic/1.0.0/) is derived from MIMIC resources and credentialed under PhysioNet's health-data terms. **Not selected:** instruction construction/label provenance would need separate review; it is not independent external validation of its parent cohort. An instruction-tuning release does not itself supply approved conversation-time urgency targets.
- DDXPlus synthetic disease/evidence records, Jayanth disease labels, web-generated triage examples and undocumented reuploads are not substitutes for clinically justified urgency ground truth. No new synthetic labels were generated.

## Compatibility with confirmed Model A evidence

The existing [foundation](../README.md#evidence-contract) and unchanged `model-a-to-b.evidence.v1` distinguish positive, explicit negative, typed value, UNKNOWN, not asked, unsupported and contradiction. That is useful transport, not a ready clinical cohort. Current Model A exports are fictional and have `human_clinical_review: false`; the trainer correctly rejects those as clinical origins.

The source-feature lists above establish only **partial conceptual overlap**, not a validated crosswalk to the 223 Model A definitions. No candidate demonstrated complete feature/state coverage in this review. Before admission:

1. Review each source field against a frozen evidence ID, units, coding, provenance and actual availability at the declared prediction time. Do not equate source gender, age bins, pain scores or measured vitals with superficially similar evidence fields without review. Unavailable essential examination/vital data cannot be supplied by an LLM.
2. Map only explicitly documented observations to positive/negative/value. A complaint list is incomplete ascertainment; absent text or a zero-filled symptom matrix does not prove denial.
3. Preserve a source's explicit unknown separately from uncollected/missing information. Use the appropriate not-asked/unspecified representation and retain collection provenance; if the distinction cannot be established, document the gap rather than manufacturing it. Source missingness does not train the abstention target automatically.
4. Quarantine unsupported terms and incompatible units; preserve contradictions and their source statements for adjudication. Never resolve conflict by choosing positive. The v1 trainer's binary/numeric feature schema does not silently encode categories or multichoice as ordinal values.
5. Obtain approved urgency reference decisions based on the intended information set. A clinician using examination/labs to label a case creates an information gap for a symptom-only model; an acceptable residual-risk/abstention policy needs evidence, not a guessed translation.

## Exact gates still blocking training

All candidates remain **Conditional** for a suitably scoped research question or **Not suitable** for the direct substitutions identified above. None is **Ready for approved training**.

1. **Clinical target approval:** define the four classes, relevant care actions/time horizon, population, prediction time, setting and separately governed emergency mapping. Approve any mapping prospectively or obtain independently adjudicated labels directly matching the task. Reviewer availability is not sign-off.
2. **Rights and acquisition approval:** pin the selected release, source/license/DUA, permitted purpose, access holders, secure storage and derived-model/distribution restrictions. Verify institutional/ethical requirements and actual project permission; document gaps rather than treating public discovery as permission.
3. **Feature and label provenance:** qualified review of source-to-evidence crosswalk, unavailable features, label process, ambiguity and conflicts. Preserve disease/diagnosis separation; no target leakage from triage codes, outcomes or post-prediction data.
4. **Authorized cohort audit:** count source and retained classes, missing labels, contradictory labels, duplicate symptom groups, patient/encounter overlap and grouping-identifier coverage. Report support after exclusions/splitting. No balance, emergency recall or cohort sufficiency has been established by this metadata review.
5. **Prospective independent evaluation:** keep duplicate/patient/encounter-connected groups together across train/calibration/test, with stable source namespaces. Missing patient identifiers are a residual risk, not proof of independence. Plan held-out sites/time only where deidentification supports them; a different dataset becomes external validation only after label/feature comparability is established. Freeze adjudication and evaluate rare-class sensitivity, precision/F1, calibration, abstention, under-triage and uncertainty before release. Choose thresholds on development/calibration data, not test results.
6. **Subgroups and transport:** establish age, sex, race/ethnicity where appropriate, complaint and missingness support. No reviewed source establishes Indian community or English/Telugu conversational validity. Pediatric use, Telugu script/transliteration/mixed language and sparse evidence require separate justified evaluation; do not fill these gaps with fabricated cases or claim vignette tests are clinical validation.
7. **Foundation admission receipt:** supply the existing manifest's hash-bound source, rights, intended-use, adjudication, grouping and feature-review documents, qualified clinical review and explicit training authorization. Current size limits require a documented cohort if a large source exceeds them; do not silently truncate or refactor the pipeline to accept it. Registration must not enable the live provider.

## Verification and scope

Documentation-only qualification: no model fitting/scoring, patient-level data review, new dependency, cloud inference, application code change or provider enablement. Official Model A test/ledger and archived models were not opened. No full seal re-verification or application tests were needed or claimed by this document; preservation was checked against a pre-edit repository-file hash snapshot. Links and document scope were checked locally. No staging, commit or push.

**Next action:** qualified clinical review of the intended four-target information/setting definition, alongside MIMIC access feasibility. If that review retains community care-seeking targets, seek an authorized adjudicated community cohort rather than begin training on ED labels.
