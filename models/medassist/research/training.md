# Offline baseline runner — Phase 3

This implementation executes [frozen protocol v1](../baseline-protocol.md); it does not expose an inference API or alter the application. Raw data, private row assignments/predictions, worker inputs/logs and fitted joblib artifacts remain under the existing external `APIP_RESEARCH_ROOT`. Only explicitly selected aggregate JSON/Markdown reports belong in Git.

## Run on Windows

Use the existing Phase 1 Python 3.12 research venv and completed `phase1-final-20261019` run. Run from the repository root. Do not create another dataset, change the protocol JSON/checksum, install different dependencies, move data into the repository or regenerate outer partitions.

```powershell
$env:APIP_RESEARCH_ROOT = Join-Path $env:LOCALAPPDATA 'APIP\research\medassist-phase1-20261019'
$researchPython = Join-Path $env:APIP_RESEARCH_ROOT 'venv\Scripts\python.exe'
$runId = 'baseline-v1-new-run'
& $researchPython -m pip check
if ($LASTEXITCODE -ne 0) { throw 'Dependency check failed' }
& $researchPython -W error -m unittest discover -s models/medassist/research/tests -v
if ($LASTEXITCODE -ne 0) { throw 'Regression checks failed' }
& $researchPython -m models.medassist.research.train train --run-id $runId --phase1-run phase1-final-20261019
if ($LASTEXITCODE -ne 0) { throw 'Incomplete training: do not open the test partitions' }
& $researchPython -m models.medassist.research.train evaluate --run-id $runId
if ($LASTEXITCODE -ne 0) { throw 'Evaluation failed: preserve the run and inspect its state; do not retune or silently retest' }
& $researchPython -m models.medassist.research.train publish --run-id $runId --publish-dir models/medassist/reports/new-baseline-run
```

Replace only run/output names with fresh names. The existing research root and completed Phase 1 run are deliberate local selections. No network/provider service or paid account is used. Scripts refuse unsupported/non-venv Python, changed dependency pins, changed source/protocol/split/CV digests, existing run/output paths, incomplete candidates and tampered artifacts. Desktop sandbox permission may be needed to write the already-authorized external research directory; an ordinary local terminal does not need a cloud account.

Use `publish` after a blocked training run to export actual aggregate failures without test results. Do not call `evaluate` when `blocked.json` exists or no pre-test seal exists. Publishing failures does not turn the run into completed training. A new run is not permission for repeated test-based model selection; later confirmatory research needs an appropriate new evaluation design.

## Implementation and data boundaries

- `estimators.py`: grid enumeration in JSON key order, fold-local preprocessing, fixed-family construction, deterministic CV selection and the exact F2 threshold grid/tie rules.
- `train_worker.py`: one candidate's three-fold run or one family-best final fit per subprocess. Captures warnings/durations/failures; convergence warnings block the candidate. Receives fit data only for CV, plus calibration/threshold data only for primary final fitting. **No worker receives test rows.** FrozenEstimator calibration must leave the base pipeline's serialized object digest unchanged.
- `train.py`: verifies Phase 2 preflight/fingerprints before fitting, generates only within-fit CV indices, executes all declared candidates, saves results/artifacts, seals all-task selections and performs one-shot test prediction. Then computes metrics from cached probabilities; bootstrap/subgroup calculations never call the model again.
- `metrics.py`: unweighted/weighted retrospective metrics, reliability bins, ordinal errors, abstention, sparse subgroup guards and paired stratified-cluster uncertainty. Weighted sections retain raw integer support/miss counts alongside weighted rates/confusion totals; weights describe the eligible ED cohort, not national home-triage performance.
- `tests/test_phase3.py`: synthetic-only regressions for preprocessing leakage/shape, unknown/rare categories, frozen grids/ties, calibration non-refitting, convergence failure, candidate execution, metric denominators, subgroup/cluster rules, all-candidate sealing, tampering and prediction replay.

Numeric/categorical transformations are learned independently within each CV training fold and on fit only for final pipelines. Medians retain entirely empty numeric columns using the specified zero constant; fixed vital indicators are separate from demographic inputs. HGB categories use descending fit frequency with lexical tie order; known rare values map to the rare bucket, unseen values to NaN. Unknown observations remain unchanged in source data. CPU/BLAS/OpenMP threads are bounded to one, and every candidate subprocess has the frozen 20-minute budget. Timed-out/nonconverged/failed candidates remain recorded; no silent grid shrinkage or substitute models are allowed.

The runner computes all 60 candidate configurations (180 fold fits), then up to 12 family-best fits and six primary calibrators. Model selection uses fit-CV only. All three families remain in the test comparison; any overall CV winner is declared before testing. The secondary task never calibrates class probabilities or tunes class thresholds.

## Private run layout and pre-test seal

Under `APIP_RESEARCH_ROOT/runs/<run-id>/`:

- `preflight.json`: current input/fold verification.
- `jobs/`: trusted local joblib inputs, aggregate worker results and private error/process logs. Never load foreign joblib/pickle files.
- `artifacts/<task--profile--family>/`: frozen base pipeline, primary calibrated pipeline and private development predictions where applicable.
- `training-results.json`: all candidate scores/configurations/timing/warnings, final selections and calibration/threshold diagnostics.
- `blocked.json`: explicit incomplete state, when applicable; no test predictions are authorized.
- `pretest-manifest.json` plus `.sha256`: exclusively created all-task selection manifest and seal, written only after complete unique grid coverage and artifact validation. Contains source/protocol/code/environment/split/CV/artifact hashes and predeclared winners. The runner never modifies these files after sealing. This is application-enforced append-only provenance with integrity verification, not a claim of external WORM storage or independently timestamped attestation.
- `test-started.json`: exclusive marker created **before any test prediction**. Even a failed evaluation cannot silently replay test prediction.
- `private-test-predictions/`: source row IDs, original labels, raw/calibrated scores and abstention masks, outside Git.
- `test-results.json` and `completed.json`: aggregate evaluation plus completion/hash receipt, only after successful evaluation.

Code changes between training, sealing and evaluation invalidate the seal. Protocol settings are unchanged. A failed evaluation after its marker must be investigated with preserved cached outputs; removing the marker to retune/retest is not a recovery procedure. Artifact/selection hashes and timestamps establish the internal sequence; they do not independently establish clinical validity.

## Reading the research outputs

CV average precision and macro F1 are different endpoints on different cohorts. Calibration-fit diagnostics and threshold-search scores are development results, not unbiased test performance. Raw binary probabilities use a fixed 0.5 descriptive reference; calibrated scores are evaluated at both 0.5 and the development-selected threshold. Secondary scores are explicitly uncalibrated.

Test evaluation reports every declared family/profile, missed high-acuity/Immediate cases, uncertainty/abstention, support-aware subgroups and PATWT descriptions. A singleton stratum suppresses the affected cluster interval; no IID bootstrap or stratum merging is substituted. Sparse subgroup scores are withheld while denominators/miss counts remain visible. A higher aggregate score cannot establish safe handling of rare Immediate cases or clinical suitability.

Results and model cards belong in a dated report directory linked from the [MedAssist research index](../README.md). Patient-facing care guidance, mapping to APIP urgency categories, clinical deployment and automatic retraining remain outside this runner.
