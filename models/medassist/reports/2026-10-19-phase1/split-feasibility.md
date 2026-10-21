# Grouped partition feasibility

Actual deterministic support inspection, **no models trained**. Full class counts and three-fold support are in [split-feasibility.json](split-feasibility.json); the [original plan](../../experiment-plan.md) defines proposed 60/10/10/20 fit/calibration/threshold/test roles.

## Grouping and reproducibility

Across all 16,025 source visits, masked `(CSTRATM,CPSUM)` combinations number **122**, HOSPCODE values **188**, and connected components linking either key number **122** (largest 648 visits). These are masked analysis groups, not established true hospital identities or longitudinal patient linkage. Missing/nonpositive grouping fields cause failure rather than an IID fallback.

Candidate partitions use fixed sequential GroupShuffleSplit with seed 42. Allocate 20% of groups to test, 12.5% of remaining groups to thresholds, then 1/7 of remaining groups to calibration; remaining groups fit. Group fractions approximate row fractions; unequal cluster sizes prevent exact 60/10/10/20 visits. All components are built on the full source before eligibility restriction. Each partition pair has **zero shared connected components, hospital codes or masked cluster keys**. Same grouping protects within-fit CV.

The nominal locked-test designation reserves it for future evaluation: Phase 1 inspected its **class support**, as explicitly requested, but computed no predictions or scores. Do not tune choices to future test performance. Assignment hashes match across two actual profile runs:

- Full eligible: `9c1a7393ab205aee97b6e0ab75dbfd5948e2ff796087f5c70b70714c2e431f96`.
- Symptom cohort: `4735d16049130a9b7e346721e1393d922aff96b9f6fac65d10de7c78d681b90e`.

Row-level assignment files remain external. No random-row fallback, seed search, rebalancing or training was performed.

## Full eligible demographic reference

Total 10,207 visits in 98 eligible groups. Counts below list rows, achieved fraction, five classes in order **Immediate/Emergent/Urgent/Semi-urgent/Nonurgent**, and high-acuity `{1,2}` support.

- Fit: **5,933 (58.13%)**; **80 / 863 / 3,098 / 1,662 / 230**; high **943**; 58 groups.
- Calibration: **1,107 (10.85%)**; **16 / 164 / 600 / 302 / 25**; high **180**; 10 groups.
- Threshold selection: **1,178 (11.54%)**; **17 / 183 / 598 / 365 / 15**; high **200**; 10 groups.
- Test: **1,989 (19.49%)**; **26 / 385 / 1,044 / 497 / 37**; high **411**; 20 groups.

Three-fold StratifiedGroupKFold within fit is structurally possible with every class in each training/validation fold. Validation Immediate counts are **32 / 17 / 31** and high-acuity counts **326 / 287 / 330**. Sparse support still prevents strong five-class calibration/subgroup conclusions.

## Symptom-only presentation and initial-vitals profiles

Total 7,657 visits in 96 eligible groups; both feature profiles share these rows/partitions.

- Fit: **4,184 (54.64%)**; **45 / 631 / 2,237 / 1,145 / 126**; high **676**; 56 groups.
- Calibration: **1,012 (13.22%)**; **10 / 127 / 580 / 275 / 20**; high **137**; 10 groups.
- Threshold selection: **868 (11.34%)**; **5 / 121 / 529 / 202 / 11**; high **126**; 10 groups.
- Test: **1,593 (20.80%)**; **10 / 279 / 883 / 402 / 19**; high **289**; 20 groups.

Three grouped fit folds contain all classes. Validation Immediate counts are **14 / 12 / 19**; high-acuity counts **200 / 274 / 202**. This proves only structural fold construction, not adequate statistical power. Subgroup intersections shrink support further.

## Blocker and proposed alternative

Both cohorts flag fewer than **30 Immediate** cases in calibration/threshold sets. Thirty is an explicitly declared engineering warning for this inspection, **not** a power calculation, clinical threshold or promise that 30 is enough. The symptom fit fraction also misses the nominal fraction by over five percentage points. No reviewed minimum event/group support or calibration acceptability rule exists yet. Ten Immediate test visits in the symptom cohort would make any recall estimate particularly unstable.

**Do not execute the original full five-class calibration protocol unchanged.** Review these findings first. Proposed options: predefine a distinct binary high-acuity research endpoint while retaining class-1 error reporting; assess an all-labelled no-RFV initial-vitals profile to avoid symptom-filter selection; defer class-specific calibration/threshold claims or specify reviewed grouped cross-fitting with strict held-out boundaries. None is adopted here. Do not silently merge labels, weaken group isolation, recycle the test for tuning or select a seed that looks better.

Later uncertainty reporting needs design-aware resampling and explicit weighted/unweighted estimands; these splits alone do not implement survey-correct inference or account for repeated patients whose IDs are unavailable. NHAMCS labels do not establish home-triage ground truth, paediatric validity or applicability in India. Current readiness is **acquired/profiled, pending protocol review**, not trained or clinically validated.
