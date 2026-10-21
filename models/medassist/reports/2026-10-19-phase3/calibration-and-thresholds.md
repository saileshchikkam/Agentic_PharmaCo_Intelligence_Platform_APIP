# Calibration and threshold report

Six primary sigmoid calibrators were fitted on calibration only, with FrozenEstimator preserving all base pipeline/preprocessor state. The threshold partition alone selected F2 on the frozen 0.00–1.00 grid. No class-specific/Immediate calibration or thresholds were fitted for the secondary task. [Pre-test manifest](pretest-manifest.json) preserves coefficients, all 101 threshold-grid results, selected thresholds and artifact hashes.

Calibration-fit and threshold-search scores are development diagnostics, not unbiased evaluation. The subsequent test comparisons below were computed once after the choices were sealed; they did not change the choices. Brier/log loss use binary probabilities. ECE uses ten fixed equal-width bins.

## Primary age/sex reference — LR

Selected threshold **0.14**; threshold-development F2 0.514940, recall 81.00%, TP 162, FN 38, FP 611. Sigmoid coefficients a=-0.663099, b=0.489708; base object digests before/after match.

Locked-test raw → calibrated Brier: 0.161746 → 0.161790; log loss: 0.504942 → 0.503226; ECE: 0.046400 → 0.038390. Raw threshold diagnostics use fixed 0.5; calibrated test metrics use the sealed threshold.

## Primary age/sex reference — RF

Selected threshold **0.14**; threshold-development F2 0.526316, recall 89.00%, TP 178, FN 22, FP 713. Sigmoid coefficients a=-3.096966, b=2.130976; base object digests before/after match.

Locked-test raw → calibrated Brier: 0.163381 → 0.163525; log loss: 0.509990 → 0.508076; ECE: 0.048790 → 0.041012. Raw threshold diagnostics use fixed 0.5; calibrated test metrics use the sealed threshold.

## Primary age/sex reference — HGB

Selected threshold **0.14**; threshold-development F2 0.525210, recall 87.50%, TP 175, FN 25, FP 691. Sigmoid coefficients a=-0.370076, b=0.981157; base object digests before/after match.

Locked-test raw → calibrated Brier: 0.164513 → 0.163535; log loss: 0.515546 → 0.508135; ECE: 0.051523 → 0.042472. Raw threshold diagnostics use fixed 0.5; calibrated test metrics use the sealed threshold.

## Primary age/sex plus initial vitals — LR

Selected threshold **0.15**; threshold-development F2 0.531186, recall 77.50%, TP 155, FN 45, FP 504. Sigmoid coefficients a=-0.558425, b=0.670692; base object digests before/after match.

Locked-test raw → calibrated Brier: 0.157234 → 0.158498; log loss: 0.495504 → 0.493400; ECE: 0.045267 → 0.040878. Raw threshold diagnostics use fixed 0.5; calibrated test metrics use the sealed threshold.

## Primary age/sex plus initial vitals — RF

Selected threshold **0.12**; threshold-development F2 0.555919, recall 85.00%, TP 170, FN 30, FP 559. Sigmoid coefficients a=-5.765417, b=2.636810; base object digests before/after match.

Locked-test raw → calibrated Brier: 0.154496 → 0.154051; log loss: 0.488115 → 0.483691; ECE: 0.042379 → 0.036338. Raw threshold diagnostics use fixed 0.5; calibrated test metrics use the sealed threshold.

## Primary age/sex plus initial vitals — HGB

Selected threshold **0.08**; threshold-development F2 0.536894, recall 97.50%, TP 195, FN 5, FP 821. Sigmoid coefficients a=-0.683112, b=0.411185; base object digests before/after match.

Locked-test raw → calibrated Brier: 0.157432 → 0.154905; log loss: 0.501014 → 0.486460; ECE: 0.056359 → 0.037141. Raw threshold diagnostics use fixed 0.5; calibrated test metrics use the sealed threshold.

## Findings and limits

Calibration reduced observed test log loss and ten-bin ECE across the six primary variants; Brier changes were mixed, including small deteriorations for demographic LR/RF and vitals LR. This does not establish clinical calibration or superiority. The low F2-selected thresholds produce substantial false positives. The HGB vitals threshold of 0.08 achieves higher raw recall but only 14.70% specificity; it was not the CV-selected primary vitals winner and is not promoted using test results. No threshold is an accepted clinical operating point. There was no post-test recalibration, threshold adjustment or model reselection.
