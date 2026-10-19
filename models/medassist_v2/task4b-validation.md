# Task 4B — official fitting and validation

**2026-10-19: IN PROGRESS, not pre-test sealed.** Started once from `6dbcf43401255f414df14cdac31d11231df55722` under the [unchanged frozen protocol](adaptive-questioning-protocol.md), using the [documented official fit command](training/README.md). This report records completed evidence only. No locked-test command has been invoked; no official test patient rows or outcomes have been opened.

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

## Pending gates

Validation-only alpha comparison is still running. No selected alpha, validation score, baseline comparison, full/sensitivity aggregate, subgroup interval or pre-test seal is available yet. Do not infer any of these from successful fitting. The original process/run must be inspected to continue; do not rerun `fit` or replace its artifacts. If it fails, preserve the run and report the actual gate rather than retrying.

Resource observations so far: approximately 171–190 MiB current working set in sampled preparation/validation snapshots, with a reported process peak of approximately 205 MiB. These are partial-run observations, not final peak RAM or total campaign duration. Validation is CPU-active and takes longer than fitting. Full-validation caching and clustered uncertainty reporting remain unmeasured.

Repository reproducibility caveat: the existing on-disk frozen JSON has 344 CRLF line endings and matches the required `734050...` digest. Git stores its LF-normalised counterpart (SHA-256 `569169b5c119c01beb408fe35e20139b0e9e932a92e8c31fccc20468a19da076`); contents are identical after newline normalisation. A fresh LF checkout will therefore fail the current exact-byte protocol gate. A documentation verification initially failed when comparing raw working bytes with that Git blob; checking unchanged Git content and the actual frozen on-disk digest separately resolves that check, not the portability defect. Neither representation nor the frozen checksum was rewritten. Resolve portable reconstruction under a separately authorised change before claiming fresh-checkout reproducibility; do not alter this running/sealed campaign to conceal it.

**Decision: NO-GO for locked testing while validation/report/seal gates are pending.** A separately authorised test step is required even after a valid seal. The existing benchmark, all original partitions, frozen implementation, application, ADR and NHAMCS artifacts remain unchanged. Synthetic evidence collection is not home-triage validation, medical usefulness or India-specific/all-age clinical coverage. Five orphan histories remain quarantined; training-overlap sensitivity does not establish complete population/template independence.
