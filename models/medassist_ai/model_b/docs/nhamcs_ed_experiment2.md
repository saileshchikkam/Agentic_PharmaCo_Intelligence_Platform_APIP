# NHAMCS ED Experiment 2: bounded nonlinear comparison

Completed 2026-10-24. **Neither nonlinear candidate qualifies; no model was promoted.** This is an AI-assisted statistical/software investigation of source-recorded five-class ED immediacy. It provides no clinical sign-off, community-urgency mapping or patient-care recommendation. Live Model B remains `unable_to_assess`.

The [frozen plan, actual metrics, lineage, audits and artifact hashes](nhamcs_ed_experiment2_results.json) accompany the isolated [runner](../ed_experiment2.py). Experiment 1's external artifacts, [results](nhamcs_ed_research_v1_results.json), implementation and [original report](real_data_training.md) are preserved unchanged, including unsuccessful results. The corrections below supersede specific interpretations in that historical report without rewriting it.

## Feature audit and corrections before fitting

The [CDC 2022 codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf), printed pages 16 and 54, establishes two important findings:

- **Source-imputed sex is a target-leakage risk:** the imputation uses primary diagnosis and triage level, among other variables. Experiment 2 masks `SEX` to explicit UNKNOWN whenever `SEXFL != 0` (8 training visits, 1 validation visit). Flags are audit-only, never predictors. Experiment 1 retained these source values; its small affected count does not erase the design flaw or establish its effect on performance.
- **Correction to Experiment 1's age interpretation:** `AGEFL=1` means age directly reported without birth date; it does not mean imputed age. `AGEFL=-9` means age derived from imputed birth date, not a blank flag. We conservatively mask age when `AGEFL` is not 0/1 or `BDATEFL != 0`. This removes 5 training age values, including four reported ages with imputed birth dates, and no validation ages. It should not be described as five proven imputed ages. Source mask rules were frozen before any tree fit.

Predictor allowlist remains age, sex, five categorical reasons for visit, initial temperature/pulse/respirations/blood pressure/oxygen saturation and pain. The same explicit-state and one-hot algorithms are reused, now fitted exclusively on cleaned training rows. Source temperature scaling, reported zero values, UNKNOWN, unrecorded and unsupported special-code handling are preserved. No diagnosis, treatment, discharge/outcome, hospital ID, survey weight, source flag or target becomes a predictor. No fabricated or duplicated severe visits are added.

Reasons for visit are retrospective source codes; reliable point-in-time availability of every complaint and measurement relative to triage assignment is unresolved. Missingness can encode hospital workflow. The initial-vital designation does not prove exact chronology. Age top coding and binary source sex coding limit interpretation; source reasons are not a validated crosswalk to Model A's confirmed evidence. These unresolved concerns preclude a clean prospective triage claim.

Development-only missingness audit: training pain has 1,604 UNKNOWN and 203 unrecorded values; validation has 521 UNKNOWN and 80 unrecorded. Training RFV5 is unrecorded in 5,134/6,123 visits, validation in 1,699/2,042. All predictor state counts and source flags are in the results JSON. Missing features never become clinically negative evidence. NCHS [public-use restrictions](https://www.cdc.gov/nchs/policy/data-user-agreement.html) continue to limit this work to statistical analysis/reporting, without identification or linkage to identifiable data.

## Fixed development design

Original split membership is reused exactly: **6,123 training**, **2,042 validation** (`calibration` in the original private manifest). Training class counts 1–5 are 83/957/3204/1696/183; validation 28/319/1068/565/62. No resplitting, seed search, record oversampling or new labels. The shared Stata archive must be decoded to recover the original eligible-row index. Protected test positions are removed before observation/feature construction, missingness/group audits, fitting, predictions or scoring. Software tests place poison values in protected rows to verify that boundary. No new test predictions, metrics or model selection use the previously exposed test. This is not a new independent evaluation.

The cleaned development audit covers 8,165 visits, 7,670 age/sex/order-independent complaint groups, 495 repeated-pattern excess rows and 181 mixed-label groups. **Zero training/validation group overlap** after masking. No patient or hospital independence is established. Protected test groups are not re-audited under the new masks; no new full-split independence claim is made.

Two configurations of [ExtraTreesClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.ExtraTreesClassifier.html) were fixed before fitting. It accepts the existing sparse one-hot representation, avoiding arbitrary ordinal encoding or high-cardinality binning of complaint IDs. Shared parameters:

```text
n_estimators=200, max_depth=16, max_features=0.5,
bootstrap=False, criterion=gini, n_jobs=1,
random_state=20261024, class_weight=None
leaf2: min_samples_leaf=2
leaf5: min_samples_leaf=5
```

Other parameters use the defaults of recorded scikit-learn 1.9.1; full resolved parameters are retained in each saved estimator. Training-only weights are `N/(5*n_class)`: 14.7542 / 1.2796 / 0.3822 / 0.7221 / 6.6918 for classes 1–5. These are balancing weights, not survey weights. No tuning of calibration, confidence threshold, features or sample weights occurred after results were observed. Tree fit times: leaf2 **16.947 seconds**, leaf5 **12.209 seconds**.

Predeclared selection required higher validation macro-F1 than both original and source-masked frozen-logistic references, no decrease in either severe-class recall, and no increase in either severe-class under-classification count. Eligible candidates would be ranked by validation macro-F1, with leaf5 winning an exact tie. Neither is eligible. `frozen-selection.json` records **selected_id=null**; leaf2 is merely the highest-macro-F1 diagnostic candidate, not a promoted model.

The original logistic model was not retrained. Hash-checked raw validation inference reproduced its original report exactly; it was also scored on cleaned training/validation inputs. Masking changed the frozen logistic probabilities slightly but no validation class predictions. Its original training fit still included source imputations: the masked-reference rescore is a sensitivity check, not a freshly leakage-clean trained comparator. Tree differences therefore combine model-family and necessary source-cleanup effects; they are not a pure causal estimate of nonlinear learning benefit.

## Actual training and validation performance

| Model | Training accuracy | Training macro-F1 | Validation accuracy | Validation macro-F1 | Validation class 1 recall | Validation class 2 recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frozen logistic, masked inputs | 63.71% | 0.5526 | 47.01% | 0.3458 | 25.00% | 47.96% |
| Extra Trees leaf2 | 60.61% | 0.6065 | 44.12% | 0.3265 | 14.29% | 31.03% |
| Extra Trees leaf5 | 53.52% | 0.4869 | 41.67% | 0.3131 | 21.43% | 36.05% |

Leaf2 captures 83/83 immediate training visits but only 4/28 immediate validation visits, evidence of poor generalization for this bounded configuration. Leaf5 captures 82/83 training and 6/28 validation immediate visits. Severe validation support is small: one immediate visit changes recall by 3.57 percentage points. No statistical significance or independent improvement is claimed.

Validation precision / recall / F1 (full training and reference metrics remain in JSON):

| Class | leaf2 precision / recall / F1 | leaf5 precision / recall / F1 |
| --- | --- | --- |
| 1 Immediate | 0.1905 / 0.1429 / 0.1633 | 0.0896 / 0.2143 / 0.1263 |
| 2 Emergent | 0.4041 / 0.3103 / 0.3511 | 0.3859 / 0.3605 / 0.3728 |
| 3 Urgent | 0.6231 / 0.4148 / 0.4980 | 0.6324 / 0.3689 / 0.4660 |
| 4 Semi-urgent | 0.3801 / 0.5947 / 0.4638 | 0.3872 / 0.5558 / 0.4564 |
| 5 Nonurgent | 0.1050 / 0.3065 / 0.1564 | 0.0905 / 0.3548 / 0.1443 |

Validation matrices, rows actual and columns predicted, class order 1–5:

```text
Frozen logistic reference        leaf2                     leaf5
 7  11   8   1  1                4   9   8   5  2            6   8   7   4   3
23 153  92  35 16                4  99 105  84 27           16 115  87  68  33
54 235 497 219 63               11 119 443 425 70           32 149 394 391 102
15  53 128 281 88                2  17 147 336 63           13  24 131 314  83
 1   3   9  27 22                0   1   8  34 19            0   2   4  34  22
```

| Validation source-label errors | Frozen logistic | leaf2 | leaf5 |
| --- | ---: | ---: | ---: |
| Immediate predicted less acute /28 | 21 | 24 | 22 |
| Immediate under-classified at least 2 levels | 10 | 15 | 14 |
| Emergent predicted less acute /319 | 143 | 216 | 188 |
| Emergent under-classified at least 2 levels | 51 | 111 | 101 |

Leaf2 improves immediate precision (19.05% versus 7.00%) and semi-urgent recall (59.47% versus 49.73%) while worsening severe-class recall and under-classification. Those trade-offs are rejected, not treated as improvement or corrected by choosing higher accuracy.

## Calibration and abstention

| Validation diagnostic | Masked logistic | leaf2 | leaf5 |
| --- | ---: | ---: | ---: |
| Multiclass Brier | 0.6643 | 0.6836 | 0.6921 |
| NLL | 1.2180 | 1.3229 | 1.3423 |
| Top-label ECE, 10 bins | 0.0925 | 0.1096 | 0.0877 |
| Coverage at fixed confidence >=0.60 | 37.46% | 11.31% | 11.21% |
| Abstention | 62.54% | 88.69% | 88.79% |
| Error among accepted predictions | 43.92% | 33.77% | 34.93% |

Leaf5's slightly lower ECE does not establish better probabilities: Brier/NLL are worse. Both trees' lower selective error comes with far lower coverage. Each tree still accepts five less-acute predictions among immediate visits and 14 among emergent visits. Neither abstention nor a confidence value certifies safety. No recalibration or clinical cutoff was fitted.

## Preservation, reproducibility and next action

Separate private run artifacts comprise frozen plan, source/leakage audits, both model files/evaluations, reference-validation report, frozen rejection decision, comparison and receipt. Data and private split positions were not copied into Git. Source archive/member, prior files, current implementation and all new output files are hash-bound. The saved models were hash-checked and reloaded in a new process; both exactly reproduced training/validation reports without refitting. Environment: Python 3.12.2, scikit-learn 1.9.1, NumPy 2.2.2, SciPy 1.16.1, pandas 3.0.0, joblib 1.6.0, threadpoolctl 3.6.0. Exact hashes and parameters appear in the aggregate results.

Explicit reproduction (new private output only; it repeats training/validation, never scores test):

```sh
python -B -m models.medassist_ai.model_b.ed_experiment2 --archive <private-nhamcs.zip> --prior <experiment1-run> --output <new-experiment2-run>
```

**25 focused tests passed with warnings as errors.** All seven Experiment 1 external files remain unchanged. Model A's 17 sealed artifacts, seal receipt, frozen implementation and exact protocol bytes matched before and after; the existing CRLF-local/LF-Git portability caveat is preserved. Model A locked test/ledger, Jayanth, Groq, UI and clinical routes were untouched. No dependencies installed, commits or pushes.

**Decision: no meaningful improvement demonstrated; no nonlinear model selected.** Stop this bounded experiment. Obtain qualified clinical/statistical review of imputation leakage, predictor timing, missing-target selection, severe support and validation reuse before defining another experiment. A new independently acquired evaluation cohort with compatible source labels, clean prediction-time features and patient/group controls is required for independent confirmation; the already exposed original test cannot supply it. Four-level community use additionally needs separately justified data/labels, mapping, clinical review and safety validation. Neither classifier is ready for patient-facing use.
