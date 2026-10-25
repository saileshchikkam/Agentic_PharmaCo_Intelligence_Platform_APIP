# Model B real-data baseline: NHAMCS ED research

Updated 2026-10-24 after explicit authorization of a separate five-class statistical research task. **One real-data logistic-regression model was trained and evaluated.** The live four-class Model B remains disabled and returns `unable_to_assess`. No clinical approval or home-care prediction is claimed. The [source access manifest](nhamcs_2022_access_manifest.json) preserves the earlier audit's no-training status; the current [research configuration, results and verification](nhamcs_ed_research_v1_results.json) record this subsequent experiment. Data, split membership and weights remain privately outside Git.

## Completed five-class experiment

The [offline runner](../ed_research.py) reuses `Observation`, `FeatureSchema`, `NumericEvidenceEncoder`, `ResearchFit`, `Split`, `symptom_key` and `LeakageAuditor`. A separate `EDResearchEvaluator` supplies five-class diagnostics. The original four-class clinical schema, `DatasetValidator.require_clinical`, `ModelTrainer`, `ModelEvaluator`, registry and live provider gates are unchanged. The research configuration does not assert clinical label approval or independent adjudication.

- Source: the verified 2022 public-use archive/member in the access manifest. 10,207 of 16,025 visits retain source `IMMEDR` 1–5, without remapping; 5,818 missing/unknown/no-triage targets are excluded.
- Predictors: `AGE`, `SEX`, five categorical `RFV` slots, `TEMPF`, `PULSE`, `RESPR`, `BPSYS`, `BPDIAS`, `POPCT`, `PAINSCALE`. No hospital IDs, imputation flags, survey weights, diagnoses, treatment or discharge/outcomes enter the predictor matrix. Reasons for visit are retrospectively coded source complaints; exact ordering relative to target assignment is not established.
- Encoding: source temperature is divided by ten into Fahrenheit; zeros stay recorded numeric values. Blank (`-9`) uses the existing `not_asked` channel **only as source-unrecorded**, not proof the question was not asked. `-8` stays UNKNOWN. Special Doppler codes and out-of-range values use unsupported/null. Missing numeric values receive train-only medians while all state channels remain explicit; no missing field becomes a negative clinical observation. Categorical codes use train-only one-hot vocabulary; unseen categories have no fitted category coefficient. Source-imputed AGE (5 records) and SEX (15) remain source-provided values, not independently observed patient facts; one age imputation flag is blank. No Model A evidence crosswalk is implied.
- Split fixed before fitting: seed **20261024**, five stratified group folds; fold 0 test, fold 1 validation, remaining folds train. Group key is age/sex plus order-independent RFV values/missing states, ignoring vitals. No seed search. Train **6,123**, validation **2,042**, test **2,042**. Class counts 1–5: train **83/957/3204/1696/183**; each held-out partition **28/319/1068/565/62**.
- Duplicate audit: 5 full-predictor duplicate excess rows; 9,585 near-duplicate groups, 622 repeated-pattern excess rows and 226 mixed-label groups. Those groups never cross partitions. Mixed labels are not assumed annotation errors. No patient or hospital independence is established. Complaint patterns with differing demographics can still repeat across splits.
- Algorithm: one L2 multinomial logistic regression, `C=1`, `lbfgs`, balanced class weights, tolerance `1e-4`, maximum 2,000 iterations, one numerical thread. **251 iterations; no convergence warning; 0.820 seconds fit/preprocessing time.** No tree model, hyperparameter search, probability recalibration or test-based selection. Metrics are unweighted visit-level results, not national survey estimates.

### Held-out results

| Partition | Accuracy | Macro-F1 | Balanced accuracy | Majority-class accuracy |
| --- | ---: | ---: | ---: | ---: |
| Validation | 47.01% | 0.3458 | 40.94% | 52.30% |
| Test | 45.84% | 0.3342 | 39.35% | 52.30% |

The balanced model's accuracy is below always predicting the majority class. Full validation per-class metrics are in the results JSON. Test class metrics are:

| Source class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| 1 Immediate | 0.0500 | 0.1786 | 0.0781 | 28 |
| 2 Emergent | 0.3440 | 0.5047 | 0.4091 | 319 |
| 3 Urgent | 0.6767 | 0.4429 | 0.5354 | 1,068 |
| 4 Semi-urgent | 0.4885 | 0.4867 | 0.4876 | 565 |
| 5 Nonurgent | 0.1038 | 0.3548 | 0.1606 | 62 |

Test confusion matrix: rows actual, columns predicted, order 1–5:

```text
       1    2    3    4    5
1      5   11    4    6    2
2     30  161   79   38   11
3     49  241  473  226   79
4     14   52  126  275   98
5      2    3   17   18   22
```

Immediate-class test cases: **23/28 predicted less acute**, including 12 by at least two levels. Emergent cases: **128/319 predicted less acute**, including 49 by at least two levels. These are source-label under-classification counts, not validated clinical miss rates. Severe-class support is too small to establish safety; class 3 has 38.42 times the class-1 support overall.

Test multiclass Brier score **0.6695**, NLL **1.2410**, top-label ECE **0.0988** (10 equal-width confidence bins). Validation equivalents are 0.6643 / 1.2180 / 0.0925. Probabilities are not certified calibrated; balanced training changes the effective class prior. A fixed, predeclared **0.60** research confidence threshold accepts **36.34%** of test visits, abstains on **63.66%**, and still makes errors on **45.28%** of accepted visits. It accepts six less-acute predictions among immediate cases and 37 among emergent cases. This threshold provides no clinical clearance or safety guarantee.

### Reproducibility, artifacts and checks

Run explicitly offline, using an existing permitted private source archive and a **new** external output directory:

```sh
python -B -m models.medassist_ai.model_b.ed_research --archive <private-archive.zip> --output <new-private-research-run>
```

The exclusive output contains `configuration.json`, `split-membership.private.json`, `source-audit.json`, `leakage-audit.json`, `evaluation.json`, `research-only-model.joblib` and `artifact-receipt.json`. Configuration and split membership are written before fitting. Python **3.12.2**, scikit-learn **1.9.1**, NumPy **2.2.2**, SciPy **1.16.1**, pandas **3.0.0**, joblib **1.6.0** were used; exact environment/implementation hashes are in the results JSON. Weights SHA-256: `095be678cfe0629a0ce2d28f57797a79b1e6bf941d41aed8e64858957aa85928`. This locally-created pickle is trusted code, not an upload format or deployment artifact. Hash-checked reload in a new process exactly reproduced validation and test reports without refitting.

**19 focused tests passed with warnings treated as errors**; fixture tests exercise software behavior only. All 17 Model A artifact hashes, seal receipt, implementation and exact frozen protocol bytes matched before and after. The preexisting CRLF-working versus LF-Git protocol portability caveat remains; no normalization occurred. No Model A locked-test or ledger access, cloud LLM calls, UI/Groq/Jayanth changes, dependency installs, staging, commits or pushes.

### Current decision and next step

**GO for a completed descriptive ED research baseline; NO-GO for clinical use or live integration.** First obtain independent clinical/statistical review of target construction, feature timing, missing-target selection bias, source imputation and repeated-patient uncertainty. Freeze a distinct follow-up experiment and independent evaluation source before additional fitting; retain this test as observed and do not tune against it. The intended four-class conversational task still requires its own permitted, adjudicated data, reviewed mapping and independent safety/calibration/abstention evidence. NHAMCS ED labels do not establish safe home care, Indian/Telugu applicability or Model A-to-B feature compatibility.

## Initial source audit (before this experiment)

The following audit was completed earlier on the same date before the separate five-class experiment was explicitly requested. Its clinical-admission blockers still apply to the four-class interface.

## Access decisions from official sources

1. **Tamil Nadu 108 Ambulance:** the [TNHSP release page](https://www.tnhsp.org/pages/view/108_Application) calls the operational dataset internal and describes a curated anonymized extract for public non-commercial research. Its links open a **data download request form**, not a directly accessible data file. Listed fields include `triage`, `is_critical`, emergency type, age, gender and remarks, but neither their actual values, code definitions, timestamp of assignment, row count, patient linkage nor adjudication was available for inspection. `is_critical` is not a four- or five-level target. `triage` cannot be qualified from its name alone. **No records obtained.** Next access step: a formal request to TNHSP and written confirmation of release/version, research rights, target definitions and field timing; no form was submitted on the user's behalf.
2. **Tamil Nadu TAEI:** the [TNHSP trauma registry page](https://tnhsp.org/pages/view/TAEI_Application) limits its modified public-use extract to research/learning and non-operational analytics; linked files also lead to request forms. It lists complaint, age, triage-time vitals/GCS and an anonymized patient code, but no independently defined urgency scale. `Emergency_Type` is a category, while disposition, diagnosis, imaging, surgery and outcomes occur after triage and cannot become prediction-time features or automatic urgency labels. **No records obtained.** Formal access and label review are needed.
3. **MIMIC-IV-Ext Triage Instruction Corpus v1.0.0:** [PhysioNet](https://physionet.org/content/mietic/1.0.0/) describes 9,629 MIMIC-derived cases with five-level ESI, complaints, vitals, demographics and history. It also describes LLM-generated presentations and a 50-case expert-validated subset; the full corpus is not established as independently adjudicated raw patient evidence. Access requires credentialing, CITI training and a resource DUA under the PhysioNet Credentialed Health Data License 1.5.0. These were not established for this project, so no records were accessed. Parent-data overlap would preclude calling MIMIC-IV-ED an independent external test.
4. **CDC NHAMCS ED 2022:** [CDC lists](https://www.cdc.gov/nchs/nhamcs/documentation/index.html) an official public-use archive. The [NCHS data user agreement](https://www.cdc.gov/nchs/policy/data-user-agreement.html) permits statistical reporting and analysis only and prohibits identification and linkage to individually identifiable data. We obtained only that official public-use archive for a bounded offline research audit, not clinical/product operation. Exact version, source URL and SHA-256 are in the [manifest](nhamcs_2022_access_manifest.json). The actual Stata member was read in memory; no source rows or identifiers were printed, committed or sent to a model provider.

The previously [qualified MIMIC-IV-ED lead](dataset_qualification.md#1-mimic-iv-ed-v22--conditional-preferred-ed-research-candidate) also remains credentialed and inaccessible here. Its larger size does not remove the five-to-four target and setting mismatch.

## Actual NHAMCS record and column audit

The archive contains one Stata data member: **16,025 visit records and 913 columns**, consistent with the [CDC 2022 codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf). The recorded `IMMEDR` field is **ED immediacy of being seen**, with codes 1 immediate, 2 emergent, 3 urgent, 4 semi-urgent and 5 nonurgent. Its exact unweighted counts in the acquired release are:

| Code | Source meaning | Records |
| --- | --- | ---: |
| 1 | Immediate | 139 |
| 2 | Emergent | 1,595 |
| 3 | Urgent | 5,340 |
| 4 | Semi-urgent | 2,826 |
| 5 | Nonurgent | 307 |

These five codes cover **10,207 visits**. The other **5,818** are distinct source states: `-8` unknown 3,788; `-9` blank 364; `0` no triage for that visit 587; `7` service does not conduct nursing triage 1,079. None is a sixth acuity class, a safe-home decision or a supervised abstention label. Code 1 is just **1.36%** of five-level visits; class balance and rare-class sensitivity need explicit scrutiny. This is a survey sample with visit weights; the unweighted counts above are model-development support, not estimates of national incidence.

Arrival-time candidate fields present in the actual file are `AGE`, `SEX`, `RFV1`–`RFV5` (coded reasons for visit), initial temperature, pulse, respiratory rate, blood pressure, oxygen saturation and pain. Among the 10,207 coded visits, `AGE` and `SEX` are present on all; `RFV1` has 10,201 nonblank values, `RFV2` 7,063, pain 7,223, and initial systolic pressure 9,379. These totals account for documented sentinel codes, not just software nulls. Vitals require source-unit and invalid/special-code handling. Absent `RFV2`–`RFV5` is not an explicit patient denial. `DIAG1` and other post-assessment services/outcomes were excluded from the candidate feature set. Whether any candidate field precedes the exact target assignment requires source-timing review.

Of coded visits, 2,046 were under 18 and 8,161 were 18 or older. This is neither child-specific adequacy nor Indian/Telugu transport evidence. A record-level Model A crosswalk was **not** approved; source reasons and vitals cannot be counted as coverage of the 223 confirmed-evidence definitions. No source field establishes explicit negative, UNKNOWN, unsupported and contradictory Model A states by default.

## Leakage and evaluation feasibility

The [CDC codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf) defines `PATCODE` as a sequential **visit-record** number within `HOSPCODE`, not a longitudinal patient identifier. All 10,207 coded visits have distinct code pairs, which does **not** prove patient independence. There are 147 published hospital codes among coded visits; source masking means these are not a verified patient-group key. No train/calibration/test partition was created or scored.

For a duplicate-risk diagnostic, the five reason-for-visit fields form 6,366 distinct signatures among coded visits: 3,841 rows repeat a signature and 453 signatures span more than one acuity code. Adding age and sex yields 9,627 signatures, 580 repeated rows and 209 mixed-label signatures. These are **similar complaint patterns, not proven duplicate people or mislabeled cases**. A future split must keep matching patterns together and independently address unavailable patient linkage. With 139 immediate cases, each held-out partition needs prospective class-support checks. Hospital-code grouping may reduce within-hospital leakage but cannot certify different patients, real geographic transport or an external validation cohort. It also must respect the survey design and survey nonresponse limits in the codebook.

## Why the initial audit stopped before training

- NHAMCS public-use terms support this offline statistical audit. They do not establish permission to run an operational or patient-facing model.
- The source supplies **five ED-immediacy labels**. [Model B's frozen active schema](../label-schema.v1.json) has four undefined, unapproved technical slots and separate `unable_to_assess`. Relabeling or dropping a class to make the existing code fit would fabricate a task mapping.
- The [trainer](../training.py) requires an approved clinical label schema, documented intended-use alignment, qualified record-level adjudication, reviewed features/grouping and explicit clinical training authorization before fitting. None was supplied. Its evaluator is fixed to four target probabilities. This source's recorded triage level is provenance, not the required independent adjudication.
- No stable person identifier in this public-use release permits a verified patient-separated test. The observed rare-class and repeated-pattern counts make a casual row-random split especially misleading.

At that earlier audit, no estimator had been fitted and no metrics or weights existed. The subsequent explicitly requested five-class statistical experiment is recorded above. Its use of source-recorded targets does not approve a four-class clinical cohort or weaken the clinical trainer's admission gates.

## Initial recommendation (superseded for the separate statistical experiment)

For a **separate ED-acuity research baseline**, obtain qualified approval of five-level target definitions, source field timing, legal purpose and source-label provenance; define how missing labels and unverified patient grouping constrain evaluation; then add a reviewed five-class research schema/evaluator that reuses the existing ingestor, encoder and leakage controls without changing the four-class live interface. Freeze predictor allowlist and split/evaluation plan before fitting. If APIP's intended task remains four-level community care-seeking urgency, seek a rights-cleared, independently adjudicated cohort for that task rather than promote NHAMCS ED classes. Human review of clinical action meanings and independently validated safety remain separate release gates.

## Initial audit verification scope

Official public-use source URL and archive/member SHA-256 verified; actual field names and aggregate counts inspected. The [access manifest](nhamcs_2022_access_manifest.json) contains no private local path or row-level records. Documentation and repository-scope checks are recorded in the dated history. Model A sealed assets, the locked test/ledger, Groq, Jayanth and the UI were not accessed or changed for this analysis. No dependency installation, cloud LLM calls, training, staging, commit or push.
