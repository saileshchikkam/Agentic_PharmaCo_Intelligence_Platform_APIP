# Frozen v1 offline runner

This package implements the [unchanged adaptive-questioning protocol](../adaptive-questioning-protocol.md). It is independent of APIP application code, ADR and NHAMCS research. Importing it does not fit a model or open data. [Task 4A preflight](../task4a-preflight.md) owns actual results and limits; the protocol JSON owns settings.

- `data.py`: source-size/MD5/SHA gates, version checks, bounded SQLite training reference, earliest-source deduplication, capped sampling, read-only cohort access and external storage guards.
- `flow.py`: public-view feature parity, two fixed training trajectories, separated feature/target/lineage streams, target/support gates, the three frozen baselines, streaming SGD grid and one private trajectory per policy/case.
- `metrics.py`: fixed-budget recovery/cost/coverage/unknown/failure metrics, original row multiplicity, support suppression and paired cluster-bootstrap intervals/differences.
- `campaign.py`: validation-only selection, full/sensitivity reports from identical caches, artifact integrity, pre-test seal and a durable one-use test ledger.
- `runner.py`, `__main__.py`: explicit stage commands, synthetic parity gate and official preflight. No default training action.
- `fictional.py`: project-authored software fixture and **non-learning** estimator. It cannot supply clinical accuracy or a real model result. Official mode refuses factory overrides and fictional seals.

## Stages and permissions

`preflight` reads and hashes the five compressed source files, validates metadata and the installed frozen environment, constructs model API objects without fitting, and checks authored synthetic parity. It decodes **zero official patient records**. It writes no data. The explicit `fit` command, if separately authorised later, creates a **new** external run, builds its training-only reference, prepares validation membership, generates training-only pairs, fits exactly three configurations, selects on the prespecified non-overlap validation cohort, caches full validation trajectories/reports and seals. It does not open test rows. `test` requires a separate explicit switch, matching official sources/mode, unchanged run path/code/protocol/artifacts and an unopened durable ledger.

Source/official counts are checked during future streaming; a preflight hash success does not establish new active-profile duplicate counts, target support, convergence or model quality. Every original partition row remains in full reports. Fitting deduplication is a private sampling decision, not source mutation. Training-overlap sensitivity does not remove every validation/test or template dependence.

All raw cases, fingerprints, memberships, JSONL pairs/targets, private SQLite trajectory caches, fitted pickle artifacts, source receipts and seals live outside Git/OneDrive/served paths. Files are exclusively created, never overwritten. The run directory must be disjoint from the source tree. The stable ledger directory must be disjoint from both. A global source+protocol+mode claim is exclusively created **before the first test row**; interruption consumes the attempt. The claim blocks a second run using the same stable ledger. Preserve that ledger across runs and back it up privately; choosing/deleting another ledger could defeat the gate. This is trusted local governance, not an adversarial storage/authentication system.

Hashed models are unpickled only as trusted artifacts produced by this runner. SHA-256 detects ordinary corruption/mutation; it does not authenticate arbitrary downloaded pickle files. Do not supply them. Changed source, feature, cohort, reference, model, seal or code hashes block execution. Do not erase evidence of failed/consumed runs to bypass a gate. A failed model prevents pre-test sealing, with category-only warnings/failure types and completed-model durations recorded privately.

## Exact commands

Run from the repository root in the **independent** Python environment matching the frozen JSON versions, never an NHAMCS environment. Set these variables deliberately; do not copy private machine paths into public docs:

- `APIP_MEDASSIST_V2_ROOT`: existing verified five-file source bundle.
- `APIP_MEDASSIST_V2_RUN`: new persistent unsynced external run directory, outside the source tree.
- `APIP_MEDASSIST_V2_LEDGER`: persistent external ledger directory, outside both trees; reuse this ledger for future runs of this benchmark.
- For fiction only, choose separate `APIP_MEDASSIST_V2_FICTIONAL_RUN` and `APIP_MEDASSIST_V2_FICTIONAL_LEDGER`. Do not point them at official runs or a shared production ledger.

Check every exit status. Ordinary shell LOCALAPPDATA can be virtualized; explicitly verify the persistent location. No directory should be in Git, OneDrive or an application-served path.

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python -W error -m models.medassist_v2.training preflight --data-root $env:APIP_MEDASSIST_V2_ROOT
python -W error -m unittest models.medassist_v2.tests.test_training_runner -v
python -W error -m models.medassist_v2.training fictional-dry-run --run-root $env:APIP_MEDASSIST_V2_FICTIONAL_RUN --ledger-root $env:APIP_MEDASSIST_V2_FICTIONAL_LEDGER
```

**Future real commands below were not executed in Task 4A.** They require separate authorisation. The first intentionally performs actual DDXPlus fitting/validation and stops at the pre-test seal; the second consumes the official test attempt. There are no model/grid/threshold override flags:

```powershell
python -W error -m models.medassist_v2.training fit --data-root $env:APIP_MEDASSIST_V2_ROOT --run-root $env:APIP_MEDASSIST_V2_RUN --execute-official-fitting
python -W error -m models.medassist_v2.training test --data-root $env:APIP_MEDASSIST_V2_ROOT --run-root $env:APIP_MEDASSIST_V2_RUN --ledger-root $env:APIP_MEDASSIST_V2_LEDGER --execute-locked-test
```

## Reporting details

The selected ranker and three baselines share paired fingerprint-cluster bootstrap draws (NumPy PCG64 via default_rng, frozen seed 2718, 1,000 replicates). All official rows remain within resampled clusters. Full and training-overlap-excluded sensitivity views and synthetic age/SEX/missingness/type strata derive only from a private trajectory cache. Reporting never replays selectors. Empty sensitivity/strata and undefined denominators stay null with support counts. Subgroup rates/intervals suppress below 50 interviews or 20 positive-denominator cases; type rate support additionally requires 50 interviews actually asking that type. Percentiles need 950 defined replicates. Paired ranker-minus-baseline differences use the same replicate weights. These are synthetic collection metrics, not clinical accuracy/uncertainty.

Yield is useful recovered IDs divided by actual answered questions at each fixed budget. Unknown/default rates divide by actual questions; invalid/repeat rates divide by answered questions plus invalid attempts. Invalid output ends the trajectory without a retry and is retained in every later-budget denominator. Missing future questions carry the final disclosed state forward. Question-type reports include source denominator support and asked-interview/question counts. No clinical labels, severity, hidden utility, fingerprints or partition IDs enter selector features or RNG.

Source-scale runtime, peak RAM and real convergence remain unmeasured. References use file-backed SQLite with an 8 MiB page-cache setting and 5,000-row commits; fit/sample caps remain exactly frozen. The report accumulates **cluster aggregate vectors**, not raw corpus records, for bootstrap; memory grows with evaluated unique groups and policies. This is designed for the stated laptop, not a measured 16 GB guarantee. Any scale/parity failure must be reported before test, with no silent protocol change.
