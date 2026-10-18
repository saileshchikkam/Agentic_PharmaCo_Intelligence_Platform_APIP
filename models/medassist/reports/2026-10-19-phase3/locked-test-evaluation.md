# Locked-test evaluation — all frozen families

Completed once on 2026-10-19. Full confusion matrices, per-class precision/recall, raw/calibrated reliability bins, weighted descriptions, sparse subgroup supports and abstention diagnostics are in [test-results.json](test-results.json). [Verification](verification.json) independently reconciles cached prediction membership/error counts and reproduces thresholds from development records without calling any model again.

**All results are retrospective recorded US ED acuity. Patient-facing/clinical use remains NO-GO.** Primary misses mean true IMMEDR 1/2 predicted negative; primary Immediate misses are true class 1 predicted negative. Secondary Immediate misses mean failure to predict exact class 1; prediction of class 2 is still an exact-class error even though it remains within the high-acuity group. Secondary high-acuity misses require prediction of class 3–5.

## Primary age/sex reference

Predeclared CV winner: **LR**. No reselection using the numbers below.

### LR

Threshold 0.14; AP **0.282551**, ROC-AUC 0.616112, balanced accuracy 0.564970. High-acuity recall **81.75%**, misses **75/411**; Immediate recall 69.23%, misses **8/26**.

Precision 23.65%, specificity 31.24%, F2 0.548124; false positives 1085/1,578. Brier 0.161790, log loss 0.503226. PATWT-weighted eligible-cohort high recall 81.86%; weighted balanced accuracy 0.578764. Counts remain unweighted.

Abstention coverage **100.00%**, abstained 0, including 0 high-acuity cases. Unconditional high-acuity detection after abstention **81.75%**; 75 high cases missed or abstained. Selective error 58.32%.

### RF

Threshold 0.14; AP **0.255531**, ROC-AUC 0.596763, balanced accuracy 0.545676. High-acuity recall **86.13%**, misses **57/411**; Immediate recall 80.77%, misses **5/26**.

Precision 22.56%, specificity 23.00%, F2 0.550887; false positives 1215/1,578. Brier 0.163525, log loss 0.508076. PATWT-weighted eligible-cohort high recall 86.21%; weighted balanced accuracy 0.551244. Counts remain unweighted.

Abstention coverage **100.00%**, abstained 0, including 0 high-acuity cases. Unconditional high-acuity detection after abstention **86.13%**; 57 high cases missed or abstained. Selective error 63.95%.

### HGB

Threshold 0.14; AP **0.255859**, ROC-AUC 0.594720, balanced accuracy 0.550632. High-acuity recall **85.16%**, misses **61/411**; Immediate recall 76.92%, misses **6/26**.

Precision 22.82%, specificity 24.97%, F2 0.550661; false positives 1184/1,578. Brier 0.163535, log loss 0.508135. PATWT-weighted eligible-cohort high recall 85.41%; weighted balanced accuracy 0.557260. Counts remain unweighted.

Abstention coverage **100.00%**, abstained 0, including 0 high-acuity cases. Unconditional high-acuity detection after abstention **85.16%**; 61 high cases missed or abstained. Selective error 62.59%.

## Primary age/sex plus initial vitals

Predeclared CV winner: **RF**. No reselection using the numbers below.

### LR

Threshold 0.15; AP **0.337314**, ROC-AUC 0.655200, balanced accuracy 0.605203. High-acuity recall **74.21%**, misses **106/411**; Immediate recall 73.08%, misses **7/26**.

Precision 26.66%, specificity 46.83%, F2 0.546987; false positives 839/1,578. Brier 0.158498, log loss 0.493400. PATWT-weighted eligible-cohort high recall 72.33%; weighted balanced accuracy 0.600922. Counts remain unweighted.

Abstention coverage **99.65%**, abstained 7, including 4 high-acuity cases. Unconditional high-acuity detection after abstention **73.24%**; 110 high cases missed or abstained. Selective error 47.53%.

### RF

Threshold 0.12; AP **0.369420**, ROC-AUC 0.661103, balanced accuracy 0.592462. High-acuity recall **79.08%**, misses **86/411**; Immediate recall 73.08%, misses **7/26**.

Precision 25.37%, specificity 39.42%, F2 0.555556; false positives 956/1,578. Brier 0.154051, log loss 0.483691. PATWT-weighted eligible-cohort high recall 76.72%; weighted balanced accuracy 0.587505. Counts remain unweighted.

Abstention coverage **95.02%**, abstained 99, including 48 high-acuity cases. Unconditional high-acuity detection after abstention **67.40%**; 134 high cases missed or abstained. Selective error 52.43%.

### HGB

Threshold 0.08; AP **0.355697**, ROC-AUC 0.657353, balanced accuracy 0.541881. High-acuity recall **93.67%**, misses **26/411**; Immediate recall 96.15%, misses **1/26**.

Precision 22.24%, specificity 14.70%, F2 0.570370; false positives 1346/1,578. Brier 0.154905, log loss 0.486460. PATWT-weighted eligible-cohort high recall 91.72%; weighted balanced accuracy 0.545646. Counts remain unweighted.

Abstention coverage **95.53%**, abstained 89, including 44 high-acuity cases. Unconditional high-acuity detection after abstention **82.97%**; 70 high cases missed or abstained. Selective error 69.84%.

## Secondary symptom features

Predeclared CV winner: **HGB**. No reselection using the numbers below.

### LR

Uncalibrated argmax: macro F1 **0.311250**, balanced accuracy 0.306744. High-acuity misses **228/289**; exact Immediate misses **10/10**. Immediate confusion row for predicted classes 1–5: `[0, 3, 6, 1, 0]`.

Under-triage 342/1593 (21.47%); gaps of at least two levels 19/1593 (1.19%). Uncalibrated multiclass Brier 0.506735, log loss 0.902703. PATWT-weighted eligible-cohort macro F1 0.305447; weighted high recall 18.65%.

Abstention coverage 98.68%, high cases abstained 3; unconditional high detection 21.11%. Sparse subgroup comparisons are suppressed according to the frozen support rules.

### RF

Uncalibrated argmax: macro F1 **0.273706**, balanced accuracy 0.270353. High-acuity misses **243/289**; exact Immediate misses **10/10**. Immediate confusion row for predicted classes 1–5: `[0, 1, 9, 0, 0]`.

Under-triage 295/1593 (18.52%); gaps of at least two levels 15/1593 (0.94%). Uncalibrated multiclass Brier 0.514305, log loss 0.910748. PATWT-weighted eligible-cohort macro F1 0.277692; weighted high recall 14.55%.

Abstention coverage 98.68%, high cases abstained 3; unconditional high detection 15.92%. Sparse subgroup comparisons are suppressed according to the frozen support rules.

### HGB

Uncalibrated argmax: macro F1 **0.324978**, balanced accuracy 0.317476. High-acuity misses **202/289**; exact Immediate misses **10/10**. Immediate confusion row for predicted classes 1–5: `[0, 3, 7, 0, 0]`.

Under-triage 327/1593 (20.53%); gaps of at least two levels 23/1593 (1.44%). Uncalibrated multiclass Brier 0.516829, log loss 0.923675. PATWT-weighted eligible-cohort macro F1 0.329440; weighted high recall 31.34%.

Abstention coverage 98.68%, high cases abstained 3; unconditional high detection 30.10%. Sparse subgroup comparisons are suppressed according to the frozen support rules.

## Secondary symptom features plus initial vitals

Predeclared CV winner: **HGB**. No reselection using the numbers below.

### LR

Uncalibrated argmax: macro F1 **0.333253**, balanced accuracy 0.325267. High-acuity misses **198/289**; exact Immediate misses **10/10**. Immediate confusion row for predicted classes 1–5: `[0, 4, 5, 1, 0]`.

Under-triage 308/1593 (19.33%); gaps of at least two levels 17/1593 (1.07%). Uncalibrated multiclass Brier 0.503032, log loss 0.895774. PATWT-weighted eligible-cohort macro F1 0.321938; weighted high recall 27.84%.

Abstention coverage 98.68%, high cases abstained 3; unconditional high detection 31.49%. Sparse subgroup comparisons are suppressed according to the frozen support rules.

### RF

Uncalibrated argmax: macro F1 **0.257605**, balanced accuracy 0.261053. High-acuity misses **256/289**; exact Immediate misses **10/10**. Immediate confusion row for predicted classes 1–5: `[0, 2, 8, 0, 0]`.

Under-triage 299/1593 (18.77%); gaps of at least two levels 12/1593 (0.75%). Uncalibrated multiclass Brier 0.512190, log loss 0.912419. PATWT-weighted eligible-cohort macro F1 0.260072; weighted high recall 10.60%.

Abstention coverage 98.68%, high cases abstained 3; unconditional high detection 11.42%. Sparse subgroup comparisons are suppressed according to the frozen support rules.

### HGB

Uncalibrated argmax: macro F1 **0.332538**, balanced accuracy 0.325136. High-acuity misses **189/289**; exact Immediate misses **10/10**. Immediate confusion row for predicted classes 1–5: `[0, 3, 6, 1, 0]`.

Under-triage 316/1593 (19.84%); gaps of at least two levels 23/1593 (1.44%). Uncalibrated multiclass Brier 0.506020, log loss 0.903592. PATWT-weighted eligible-cohort macro F1 0.336133; weighted high recall 32.21%.

Abstention coverage 98.68%, high cases abstained 3; unconditional high detection 34.60%. Sparse subgroup comparisons are suppressed according to the frozen support rules.

## References, uncertainty and subgroup limits

Fit-prevalence binary reference: AP 0.206637, Brier 0.166213; fixed 0.5 predicts no high cases and misses all 411. Five-class majority reference macro F1 0.142649 and Immediate recall zero. These references use fitting prevalence only.

The actual primary test has **three singleton strata**, secondary **two**. Frozen rules therefore suppress full-cohort cluster intervals and paired interval estimates: requested 1,000 replicates, generated zero because variance is unsupported. No IID fallback, stratum merging, naive confidence interval or statistical-significance claim is supplied. The non-singleton bootstrap code path is covered by a 1,000-replicate synthetic paired-draw regression.

Subgroup checks cover age, nonimputed sex, original race/ethnicity, vital missingness and symptom-module coverage. Below 30 rows or ten relevant positives, comparative scores are suppressed while supports/misses remain visible. PATWT rates describe the eligible test cohort only; they do not estimate national home-triage performance. Raw miss/support counts in weighted sections remain unweighted integers. All six secondary models have exact class-1 recall zero on ten cases; some predict class 2, as the confusion rows show. No all-age or clinical safety inference is supported.
