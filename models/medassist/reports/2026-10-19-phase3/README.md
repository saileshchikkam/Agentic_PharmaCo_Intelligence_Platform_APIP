# Phase 3 — offline baseline training and locked evaluation

Completed 2026-10-19 (Asia/Kolkata). **Training and the one-time locked test completed; clinical/patient-facing use remains NO-GO.** No frontend, backend, ADR, clinical safety behavior or application inference changed. No frozen setting or outer assignment changed.

## Actual work and artifacts

All **60 grid configurations / 180 candidate fold fits / 12 final pipelines / six sigmoid calibrators** completed with **zero recorded warnings, convergence failures or timeouts**. Primary uses all 10,207 labelled visits; secondary the existing 7,657 symptom-coded visits. Dedicated Python 3.12.2, original dependency pins, one CPU/BLAS/OpenMP thread, no paid or network inference service.

- [Model comparison](model-comparison.md): all family-best configurations, CV scores and predeclared winners.
- [Calibration/threshold report](calibration-and-thresholds.md): six primary calibrators, sealed development thresholds and raw/calibrated test diagnostics.
- [Locked-test report](locked-test-evaluation.md) and [complete aggregate JSON](test-results.json): all 12 comparisons, misses, reliability, abstention, weighted descriptions and guarded subgroups.
- Model cards: [primary demographics](model-card-primary-demographics.md), [primary vitals](model-card-primary-vitals.md), [secondary symptoms](model-card-secondary-symptoms.md), [secondary vitals](model-card-secondary-vitals.md).
- [Preflight](preflight.json), [all candidates/training outcomes](training-results.json), [pre-test manifest](pretest-manifest.json), [independent pre-test verification](pretest-verification.json), [test-start marker](test-started.json), [completion receipt](completed.json), [cached-results verification](verification.json), [reproducibility manifest](reproducibility-manifest.json).
- [Runner and exact Windows commands](../../research/training.md); [unchanged frozen protocol](../../baseline-protocol.md).

Raw records, source row assignments, jobs/private logs, development/test predictions and fitted artifacts stay outside Git/web/app storage. Aggregate publication contains no patient rows or model files. The unrelated pre-existing dataset-manifest.json remains unchanged/untracked.

## Principal findings

The predeclared primary vitals winner was RF: CV AP **0.358169**, test AP **0.369420**. At its development-selected threshold **0.12**, it missed **86/411 high-acuity** and **7/26 Immediate** cases, with precision **25.37%**, specificity **39.42%**, and **956 false positives**. Abstention withheld 48 high-acuity cases; unconditional high detection falls from 79.08% raw recall to **67.40%** with abstentions treated as not detected. These tradeoffs do not support a clinical operating point.

Secondary HGB with vitals was selected by CV macro F1 **0.322904**; test macro F1 **0.332538**, high misses **189/289**, exact Immediate misses **10/10**. Every secondary family/profile had zero exact class-1 recall. These are important negative findings, not a reason to retune on the test. Clinical deployment and mapping outputs to APIP urgency categories remain excluded.

## Pre-test freeze and reproducibility

Protocol SHA-256 `c9445327a349b193f29af121d4bbb9c26208c34d32a9868a3b2380d9d7dc013c`; source Stata SHA-256 `0e00cd5aea4511cd619f7af1e0dc2f6825f111b7c87d3ebbb1358410a4c881c2`. Both Phase 1 split and Phase 2 CV digests were verified before fitting and evaluation. No outer split was regenerated.

Pre-test seal `c226785bdda4fa6f756f468a8f82f551bc2c97fc82a9db3516808ff6e81d9ec4`. Training began UTC `2026-10-18T20:07:10.690077+00:00`, sealed UTC `2026-10-18T20:16:27.931768+00:00`; independent verification passed before test-start UTC `2026-10-18T20:17:51.767732+00:00`; evaluation completed UTC `2026-10-18T20:18:05.920541+00:00`. UTC dates are 2026-10-18; user-local date is 2026-10-19. The manifest's test_predictions_performed=false describes its pre-test state; later test/completion receipts record the completed evaluation. Its base Git commit predates this task; exact fitting/evaluation source bytes are recorded by SHA-256 and committed with this report.

## Checks and executed commands

**38 synthetic tests passed with warnings treated as errors.** An initial fixture omitted race/ethnicity audit fields; the fixture was completed before any actual training. No protocol setting was changed. Actual-data verification independently reconciled all 12 cached memberships/error counts, all six original development thresholds and source/split/CV/model hashes without replaying predictions. No application build was needed or run.

```powershell
& $researchPython -W error -m unittest discover -s models/medassist/research/tests -v
& $researchPython -m models.medassist.research.train train --run-id phase3-baseline-v1-20261019 --phase1-run phase1-final-20261019
& $researchPython -m models.medassist.research.train evaluate --run-id phase3-baseline-v1-20261019
& $researchPython -m models.medassist.research.train publish --run-id phase3-baseline-v1-20261019 --publish-dir models/medassist/reports/2026-10-19-phase3
```

Use the linked setup instructions and **new** run/publication names for reproduction. Model prediction replay is blocked by an exclusive test-start marker; cached verification did not call models. This test is now opened and cannot become fresh confirmatory evidence after a test-informed revision.

## Limitations and next research recommendation

Source labels are recorded ED workflow categories, not independently adjudicated clinical outcomes. Initial-feature timing, substantial target nonresponse, missing vitals, imputation-associated missingness, survey masking and US ED selection remain unresolved biases. Repeated patients cannot be reliably identified. Home symptoms, Indian transportability and paediatric validity are unestablished; structured baselines do not implement a symptom-language model.

Three/two singleton test strata prevent valid requested cluster intervals; these are suppressed without IID substitution. Sparse subgroup scores are withheld. Point-score differences are descriptive, not superiority or safety evidence. Calibration improves some metrics but is not uniformly better on Brier; rare Immediate failures and false-positive burden remain material.

Next: review the development error/missingness/label analysis with domain expertise, assess task-matched independently reviewed data and initial-feature availability, then prospectively define a new study and external/temporal validation. Preserve this negative baseline and its opened-test boundary. DDXPlus conversation experiments stay separate; synthetic severity must not become real acuity labels. Do not integrate these artifacts into patient care or silently revise v1.
