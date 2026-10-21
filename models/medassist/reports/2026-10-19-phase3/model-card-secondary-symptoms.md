# Research model card — Secondary symptom features

Version: frozen baseline v1; training/evaluation 2026-10-19. Status: **offline research only; NO-GO for patient-facing use**. This card covers the three trained families for this matched feature variant; the reference below was selected by CV before test, not promoted after seeing test results.

## Identity and intended use

Task `secondary_five_class`, profile `presentation_symptom_proxy`. Predeclared CV winner `HistGradientBoostingClassifier`, selected grid parameters `{"learning_rate": 0.05, "max_leaf_nodes": 15, "l2_regularization": 1.0}`; mean CV score 0.306698. Fixed parameters, preprocessing, target and evaluation definitions are owned by [protocol v1](../../baseline-protocol.md). Other family-best configurations/results are in [model comparison](model-comparison.md) and [locked evaluation](locked-test-evaluation.md).

Intended use: retrospective supervised research predicting recorded nursing-triage acuity in the pinned 2022 US ED sample. No diagnosis, prescription, patient counselling, APIP urgency mapping, home triage or autonomous clinical decision use. No human clinical sign-off is claimed; checks are AI-assisted engineering checks.

## Data, features and fitting

NHAMCS 2022 public-use Stata source; exact hash `0e00cd5aea4511cd619f7af1e0dc2f6825f111b7c87d3ebbb1358410a4c881c2`. See the [source manifest](../../open-access-manifest.json) and [Phase 1 audit](../2026-10-19-phase1/README.md) for NCHS statistical-use terms, original distributions/missingness and source restrictions. Raw data and all fitted artifacts remain outside Git; no weights are released by this card.

Cohort: 7,657 symptom-coded labelled visits; original five classes; 4,184 fit, 1,012 reserved calibration, 868 reserved threshold, 1,593 test. Secondary calibration/threshold records were not used for fitting.

Features: `presentation_symptom_proxy` from the fixed allowlist. AGE provenance and nonimputed SEX only; initial vitals absent; RFV symptom module only. Mask specified zero vitals, retain zero pain/age, preserve missing inputs and raw records. No target-derived features, diagnoses, outcomes, weights or IDs enter X. Fold-only transformations and grouped three-fold CV are checked. Final fit used only 4184 fitting rows; fit-row digest `5e7ba7a1822f1874d7295d742008d24d0f017109655ae8c787b721cbcdd50a8e`.

Calibration/threshold: none; five-class probabilities uncalibrated and argmax only. No Immediate-specific calibration or threshold.

## Actual evaluation and errors

Test macro F1 0.324978; high misses 202/289; exact Immediate misses 10/10; under-triage 327/1593; severe gaps 23/1593.

Abstention coverage 98.68%; unconditional high detection counting abstentions as not detected 30.10%. High-acuity abstentions 3. Full reliability, confusion, weighted eligible-cohort descriptions and guarded subgroup findings are in [test JSON](test-results.json). Do not hide errors using selective scores.

## Limitations and restrictions

Recorded ED workflow labels are not independently adjudicated outcomes or validated home-triage labels. Exact initial-feature timing is unresolved. Target nonresponse, missing vitals, source imputation provenance, survey masking, visit rather than longitudinal-patient records and US care-seeking selection can bias results. Symptom restriction removes 69 of 139 Immediate visits. All secondary models missed all ten held-out Immediate cases as exact class-1 predictions.

No India/home/paediatric transportability or clinical calibration is established. Bootstrap intervals are suppressed because the held-out design has two singleton strata; no IID substitute or significance claim is made. Sparse subgroup scores are withheld. These observed error rates and false-positive load do not support clinical use.

## Provenance and next review

Pre-test seal `c226785bdda4fa6f756f468a8f82f551bc2c97fc82a9db3516808ff6e81d9ec4`; source/protocol/split/CV/code/environment and each model artifact SHA-256 are in [pre-test manifest](pretest-manifest.json). Private cached prediction digest for this family is recorded in test-results.json. The [verification receipt](verification.json) checks chronology and membership without model replay. See [training instructions](../../research/training.md).

Next: review development errors, missingness and label/feature suitability with domain expertise; define any new experiment prospectively and obtain independent validation data. Do not retune on this opened test or deploy/integrate these artifacts.
