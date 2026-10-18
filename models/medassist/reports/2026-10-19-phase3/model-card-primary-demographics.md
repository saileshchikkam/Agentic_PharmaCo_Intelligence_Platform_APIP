# Research model card — Primary age/sex reference

Version: frozen baseline v1; training/evaluation 2026-10-19. Status: **offline research only; NO-GO for patient-facing use**. This card covers the three trained families for this matched feature variant; the reference below was selected by CV before test, not promoted after seeing test results.

## Identity and intended use

Task `primary_binary`, profile `demographic_reference`. Predeclared CV winner `LogisticRegression`, selected grid parameters `{"C": 10.0}`; mean CV score 0.225800. Fixed parameters, preprocessing, target and evaluation definitions are owned by [protocol v1](../../baseline-protocol.md). Other family-best configurations/results are in [model comparison](model-comparison.md) and [locked evaluation](locked-test-evaluation.md).

Intended use: retrospective supervised research predicting recorded nursing-triage acuity in the pinned 2022 US ED sample. No diagnosis, prescription, patient counselling, APIP urgency mapping, home triage or autonomous clinical decision use. No human clinical sign-off is claimed; checks are AI-assisted engineering checks.

## Data, features and fitting

NHAMCS 2022 public-use Stata source; exact hash `0e00cd5aea4511cd619f7af1e0dc2f6825f111b7c87d3ebbb1358410a4c881c2`. See the [source manifest](../../open-access-manifest.json) and [Phase 1 audit](../2026-10-19-phase1/README.md) for NCHS statistical-use terms, original distributions/missingness and source restrictions. Raw data and all fitted artifacts remain outside Git; no weights are released by this card.

Cohort: 10,207 labelled visits; binary IMMEDR 1/2 versus 3/4/5; 5,933 fit, 1,107 calibration, 1,178 threshold, 1,989 test.

Features: `demographic_reference` from the fixed allowlist. AGE provenance and nonimputed SEX only; initial vitals absent; RFV excluded. Mask specified zero vitals, retain zero pain/age, preserve missing inputs and raw records. No target-derived features, diagnoses, outcomes, weights or IDs enter X. Fold-only transformations and grouped three-fold CV are checked. Final fit used only 5933 fitting rows; fit-row digest `28c6f9ca6950204e840980a4356de60cf55d128d4804b2da75a865913c66bdb5`.

Calibration/threshold: binary sigmoid on separate calibration with frozen base; threshold 0.14 selected by F2 on threshold records only.

## Actual evaluation and errors

Test AP 0.282551; high recall 81.75%; high misses 75/411; Immediate misses 8/26; precision 23.65%; specificity 31.24%; F2 0.548124.

Abstention coverage 100.00%; unconditional high detection counting abstentions as not detected 81.75%. High-acuity abstentions 0. Full reliability, confusion, weighted eligible-cohort descriptions and guarded subgroup findings are in [test JSON](test-results.json). Do not hide errors using selective scores.

## Limitations and restrictions

Recorded ED workflow labels are not independently adjudicated outcomes or validated home-triage labels. Exact initial-feature timing is unresolved. Target nonresponse, missing vitals, source imputation provenance, survey masking, visit rather than longitudinal-patient records and US care-seeking selection can bias results. Neither primary variant contains a symptom narrative or RFV code; measured ED vitals are not routinely available at home.

No India/home/paediatric transportability or clinical calibration is established. Bootstrap intervals are suppressed because the held-out design has three singleton strata; no IID substitute or significance claim is made. Sparse subgroup scores are withheld. These observed error rates and false-positive load do not support clinical use.

## Provenance and next review

Pre-test seal `c226785bdda4fa6f756f468a8f82f551bc2c97fc82a9db3516808ff6e81d9ec4`; source/protocol/split/CV/code/environment and each model artifact SHA-256 are in [pre-test manifest](pretest-manifest.json). Private cached prediction digest for this family is recorded in test-results.json. The [verification receipt](verification.json) checks chronology and membership without model replay. See [training instructions](../../research/training.md).

Next: review development errors, missingness and label/feature suitability with domain expertise; define any new experiment prospectively and obtain independent validation data. Do not retune on this opened test or deploy/integrate these artifacts.
