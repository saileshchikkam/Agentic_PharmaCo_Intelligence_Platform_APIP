# Phase 2 — frozen baseline protocol and preflight

Date: 2026-10-19. **GO for later offline baseline training under [protocol v1](../../baseline-protocol.md); NO-GO for clinical or patient-facing inference.** No model was trained, calibrated or scored. No acquisition, outer split regeneration, application/database/ADR changes or patient data entry occurred.

The user approved approximate 80% development/20% locked testing with separate fit/calibration/threshold partitions and unchanged Phase 1 group-disjoint assignments. [Settings](../../baseline-protocol.json) and [digest](../../baseline-protocol.sha256) freeze the numerical protocol. [Actual preflight JSON](preflight-final.json) records source/protocol/code/environment/assignment hashes, matched feature shapes/missingness, target counts and within-fit CV supports.

## Verified readiness

- Source Stata hash unchanged: `0e00cd5aea4511cd619f7af1e0dc2f6825f111b7c87d3ebbb1358410a4c881c2`.
- Primary binary cohort: **10,207** visits, **1,734 high / 8,473 other**. Both age/sex and no-RFV initial-vitals variants retain every eligible row.
- Primary fit/calibration/threshold/test counts remain **5,933 / 1,107 / 1,178 / 1,989**. Assignment digest remains `9c1a7393ab205aee97b6e0ab75dbfd5948e2ff796087f5c70b70714c2e431f96`.
- Secondary five-class cohort: **7,657** symptom-coded visits. Class 1–5 counts **70 / 1,158 / 4,229 / 2,024 / 176**. With/without-vitals variants share all rows and assignments.
- Secondary partition counts remain **4,184 / 1,012 / 868 / 1,593**. Digest remains `4735d16049130a9b7e346721e1393d922aff96b9f6fac65d10de7c78d681b90e`.
- Neither experiment has connected-component, hospital-code or masked-cluster overlap between outer partitions. Both private assignment files also match the original completed run's **file hashes**, not just the semantic assignment digests.
- Three-fold fit-only CV retains all five recorded classes in each train/validation fold and matches Phase 1 support. The two matched variants within each experiment use identical folds; CV digests are in the JSON.
- Primary calibration has **180 positive / 927 negative**, threshold selection **200 / 978**, ten connected groups each. Both pass frozen engineering guards (50 positive, 50 negative, five groups). This is not a clinical power or safety claim.
- Sparse secondary Immediate counts remain **10 calibration / 5 threshold / 10 test**. Five-class/class-1 calibration and tuned class thresholds are therefore deferred; secondary remains explicitly exploratory and uncalibrated.

The frozen protocol specifies LR/RF/HGB grids, no automatic HGB holdout, within-fold preprocessing, primary-only sigmoid calibration and a separate F2 threshold search. Numeric sentinels/Doppler, zero vitals, retained zero pain/age and demographic quarantine are explicit. Rare-class errors, subgroup limits, abstention-aware recall and uncertainty reporting remain mandatory in the later training report.

## Actual verification commands/results

With the existing external Python 3.12.2 research venv and `APIP_RESEARCH_ROOT` set:

```powershell
& $researchPython -W error -m unittest discover -s models/medassist/research/tests -v
& $researchPython -m pip check
& $researchPython -m models.medassist.research.protocol --phase1-run phase1-final-20261019 --output models/medassist/reports/2026-10-19-phase2/preflight-final.json
```

Results: **23 tests passed with warnings treated as errors**; dependency check reported no broken requirements; actual source/assignment/preflight checks returned `GO_OFFLINE_BASELINE_ONLY`, `training_performed=false`, `split_regenerated=false`. An additional actual-data repeat **passed** result equality and Phase 1 CV support checks while all three estimator fit methods and outer GroupShuffleSplit were patched to fail. A draft preflight was run while writing the freeze; only the final frozen result is retained in this directory. The CLI refuses to overwrite existing results; use a fresh output path when reproducing.

Model/preprocessor/calibrator fitting, threshold search and performance evaluation are specified **but not implemented/executed in this phase**. No frontend/server build was needed or run; application behavior was not changed. The Phase 1 reports remain unchanged historical evidence.

## Next action and limits

Implement a separate offline baseline runner under this freeze, with fit-only preprocessing, all three family comparisons, explicit failure logs and pre-test artifact locking. Do not feed experimental predictions to MedAssist. Any failed fitting/calibration guard makes that run incomplete rather than authorizing a silent fallback.

Precise feature timing, real-world home inputs, US-to-India transportability, paediatric adequacy and clinical validation remain unresolved. Passing preflight guarantees neither accuracy nor model convergence. Primary/secondary cohort roles differ; all choices across both tasks must be frozen before either test is scored. No clinical operating point, release threshold or clinical sign-off is supplied.
