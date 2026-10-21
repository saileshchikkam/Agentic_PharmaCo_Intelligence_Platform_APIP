# Task 4B — official fitting and validation

**Completed 2026-10-20: official fitting, validation and independently verified pre-test sealing.** Started once from `6dbcf43401255f414df14cdac31d11231df55722` under the [unchanged frozen protocol](adaptive-questioning-protocol.md), using the [documented official fit command](training/README.md). The original process exited with code **0** and status **`pre_test_sealed`**. No locked-test command was invoked; no official test patient rows or outcomes were opened. [Safe aggregate results and hashes](task4b-aggregate.json); [verification receipt](task4b-verification.json).

## Verified preparation

All five pinned source sizes, publisher MD5 values and SHA-256 hashes matched. Frozen JSON SHA-256 remains `734050555cb9c42e4bc0b47884cf4bac27ec20da5b531c3457685b86dc2c899a`. Python 3.12.2, scikit-learn 1.9.1, NumPy 2.2.2, SciPy 1.16.1 and jsonschema 4.23.0 matched; execution pools were restricted to one thread. Synthetic reference parity passed 640 token vectors and 256 prefix pairs. All 22 focused runner regression tests passed in 64.603 seconds.

Persistent source, new run and empty stable locked-test ledger directories were verified disjoint, outside Git, OneDrive and application-served directories. Limited system-drive capacity led to placing the run and separate ledger on another local drive; source files were not moved. Private paths, records, memberships, fingerprints, pairs, models and predictions are not published here.

Training preparation streamed 1,025,602 original rows into 1,005,107 distinct active-profile groups. The training-only reference was sealed before validation access. Earliest-row deduplication and frozen hash sampling selected 4,096 fitting groups. All 132,448 original validation rows remain represented; selection uses 4,096 unique non-training-overlap validation groups. Official test rows opened: zero.

Prefix generation produced exactly 32,768 prefixes and 1,048,576 candidate pairs: 1,006,794 negative and 41,782 positive targets. All 4,096 validation selection cases had a positive recovery denominator. These are synthetic evidence-recovery targets, not diagnoses or urgency labels.

## Completed fitting

- Alpha `0.00001`: complete, 108.328 seconds, three epochs, 1,536 updates, no recorded warnings; model SHA-256 `6c87e366993561aff6ada22617a71033f83a68e2aeab1fc794f7303b8d289137`.
- Alpha `0.0001`: complete, 87.187 seconds, three epochs, 1,536 updates, no recorded warnings; model SHA-256 `c032418397451ba8e689f83794aa2cf8533dcb3f616e9db36acdbfa124183ee1`.
- Alpha `0.001`: complete, 85.016 seconds, three epochs, 1,536 updates, no recorded warnings; model SHA-256 `943eae7b13adb96050c6cc3d73933aa00a161b0a073e800b19459eb3b54f1f51`.

The frozen runner's finite-coefficient/intercept checks passed. No numerical failure receipt was produced. Fixed-epoch incremental fitting with no warnings does not establish statistical convergence or clinical validity. No second campaign, refit, grid change or validation-driven retuning has occurred.

## Validation-only selection

The frozen non-training-overlap selection cohort contains 4,096 positive-denominator cases. Selection completed on 2026-10-19 at 22:17:32 IST, with no refit:

- Alpha `0.00001`: macro recall@10 **56.1852%**, recall@20 **76.5951%**, useful yield@20 **45.7593%**; selected by the frozen ranking rule.
- Alpha `0.0001`: macro recall@10 **51.3540%**, recall@20 **65.9034%**, useful yield@20 **40.5383%**.
- Alpha `0.001`: macro recall@10 **48.4578%**, recall@20 **60.5281%**, useful yield@20 **37.1472%**.

The chosen model is the existing `model-1e-05.pkl`, whose hash is recorded above and in the seal. These are synthetic encoded-evidence collection scores. No diagnosis, urgency, clinical accuracy or patient benefit is measured.

## Full validation and sensitivity

Completed **132,448 original validation interviews**, with **529,792 cached policy trajectories** across the selected ranker and three baselines. Full results retain 132,270 fingerprint clusters and 132,423 positive-denominator interviews; 25 zero-denominator interviews remain in support/cost reporting. Every policy used 20 questions per interview and had zero invalid/repeated-question rates or conflict/empty/invalid stopping events. This clean synthetic result does not establish robustness to contradictory real answers.

Full-partition macro recall@20, with 95% fingerprint-cluster percentile intervals:

- Selected ranker: **77.1866%**, interval **77.0729–77.2999%**; recall@10 **56.3544%**, micro recall@20 **74.5379%**, useful yield@20 **45.4027%**.
- Training-frequency baseline: **59.5172%**, interval **59.4023–59.6391%**; useful yield@20 **37.4052%**.
- Random-eligible baseline: **7.0668%**, interval **7.0202–7.1135%**.
- Lexical baseline: **3.9442%**, interval **3.9093–3.9794%**.

The paired ranker-minus-training-frequency recall@20 difference is **17.6695 percentage points**, interval **17.5166–17.8224 points**. All reported overall recall@20 intervals and paired differences have 1,000 valid frozen bootstrap replicates. Validation includes cases used for selection: these are validation results, not independent locked-test generalisation estimates.

The training-overlap-excluded sensitivity view reuses the same cache: **129,496 interviews**, **129,365 clusters**, **129,484 positive-denominator cases**. It excludes 2,952 original validation rows from this separate view without changing source memberships. Ranker macro recall@20 is **77.0260%**, interval **76.9138–77.1416%**; frequency **60.1301%**, random **7.0108%**, lexical **3.9572%**. Ranker useful yield@20 is **45.9092%**. Its paired advantage over frequency is **16.8959 points**, interval **16.7464–17.0506**. Neither fingerprint sensitivity nor narrow intervals remove synthetic/template dependence.

## Subgroups, uncertainty and limitations

The complete safe aggregate receipt contains support, fixed-budget metrics, overall intervals and paired differences for both views, plus selected-ranker subgroup results. Empty unknown-age and unknown-SEX strata remain explicitly `no_cases`. All nonempty selected-ranker strata passed frozen support gates; unsupported baseline/type rates remain suppressed in the private full report.

Full-validation selected-ranker recall@20 examples:

- Under one year: **74.2757%**, 2,057 cases; adults 18–64: **77.1746%**, 88,607 cases; 65-plus: **77.3796%**, 19,765 cases. These are source synthetic age bands, not verified clinical population coverage.
- Source SEX F: **76.9144%**, 68,133 cases; M: **77.4750%**, 64,315 cases. This is not a fairness/clinical equivalence finding and supplies no pregnancy/postpartum labels.
- Unencoded-evidence fraction below 0.90: **56.2315%**, 17,107 cases; fraction 0.90–0.95: **80.8442%**, 91,586 cases; 0.95–1: **78.1768%**, 23,755 cases. This oracle-only missingness stratum is retrospective evaluator information, not a selector input.
- Binary/categorical/multichoice recall@20: **66.2293% / 90.7505% / 93.2051%** with distinct denominators. These are evidence types, not medical priority categories.

The ranker still asks UNKNOWN answers **52.5769%** of the time in full validation; explicit default answers are **2.0204%**. All cases consume the full question budget, so no question-cost reduction or real-world early-stopping benefit is established. Five unresolved histories remain quarantined; no urgency labels, India-specific validation, real clinical assessment or application integration is supplied.

## Runtime, resources and pre-test integrity

Recorded milestones (Asia/Kolkata): original process started 2026-10-19 at 19:47:29; final cache write 2026-10-20 at **20:15:32.981**; aggregate receipt at **20:24:44.646**; seal/hash receipt at **20:24:59.526**. End-to-seal elapsed time is approximately **24 h 37 min 30 s**. Selection took approximately 2 h 2 min after fitting; full trajectory generation approximately 21 h 58 min. Final cache write to aggregate receipt took **9 min 11.7 s**, including cache hashing and reporting; aggregate receipt to seal took **14.9 s**. These are receipt-based timings, not isolated stage profiler measurements.

Preparation/validation snapshots were approximately 146–205 MiB; a reporting snapshot reached **1,332,584,448 bytes (1.24 GiB)**. The final process peak was not captured. The private cache occupies **2,533,289,984 bytes**; the preserved private run totals **3,630,661,930 bytes**. Windows Modern Standby events occurred, but sampled CPU deltas and cache writes showed continuing activity; no campaign restart or sustained processing suspension was established.

Read-only `verify_seal` passed against all **17 sealed artifact hashes**, unchanged implementation/protocol and all five reverified source-size/MD5/SHA gates. Seal SHA-256: **`bd93cb1716b4780b3cdefe26bb197fa402f3d46b237dd9971f2cadfb750fece7`**. Failed-fit and test-start/cache/report markers are absent; the stable locked-test ledger is empty. Neither original artifacts nor the seal were rewritten. The existing monitor was paused after terminal success was verified; no replacement campaign or monitor was created.

Repository reproducibility caveat: the existing on-disk frozen JSON has 344 CRLF line endings and matches the required `734050...` digest. Git stores its LF-normalised counterpart (SHA-256 `569169b5c119c01beb408fe35e20139b0e9e932a92e8c31fccc20468a19da076`); contents are identical after newline normalisation. A fresh LF checkout will therefore fail the current exact-byte protocol gate. A documentation verification initially failed when comparing raw working bytes with that Git blob; checking unchanged Git content and the actual frozen on-disk digest separately resolves that check, not the portability defect. Neither representation nor the frozen checksum was rewritten. Resolve portable reconstruction under a separately authorised change before claiming fresh-checkout reproducibility; do not alter this running/sealed campaign to conceal it.

**Decision: GO for completed offline training/validation and preserved pre-test benchmark.** Locked-test execution still requires separate explicit authorisation and all existing integrity/one-use gates. Fresh-checkout portability remains a documented blocker to claiming portable reconstruction; no frozen checksum was changed to conceal it. Clinical use/integration remains NO-GO. Preserve this run, do not repeat fitting or retune against validation, and do not open the locked test automatically.
