# MedAssist Phase 1 data engineering

For the subsequently authorized offline baseline runner, see [Phase 3 training and test-lock instructions](training.md). Phase 1/2 findings below remain dated evidence; training outcomes are reported separately.

For the completed read-only cached error audit and independent-study design, see [Phase 4A auditor](audit/README.md) and [findings](../reports/2026-10-19-phase4a/README.md). It adds no model fitting, prediction replay or patient-facing behavior.

Implemented and checked 2026-10-19. Acquisition, deterministic decoding, aggregate profiling and split feasibility only. There are no estimators, training calls, application routes or clinical predictions here. Read the [approved experiment plan](../experiment-plan.md), [pinned source manifest](../open-access-manifest.json) and [actual Phase 1 findings](../reports/2026-10-19-phase1/README.md) first.

## Windows setup

Run from the repository root with Python 3.11 or 3.12. Choose a **new**, unsynced local research directory outside Git, application storage and web-served folders. The setup below refuses to overwrite an environment. This task used Python 3.12.2; the [dependency lock](../requirements-phase1.txt) pins runtime and transitive packages. Installing needs access to official PyPI; acquisition needs official CDC access. No paid service is required.

```powershell
$env:APIP_RESEARCH_ROOT = Join-Path $env:LOCALAPPDATA 'APIP\research\medassist-new-run'
if (Test-Path -LiteralPath $env:APIP_RESEARCH_ROOT) { throw 'Choose a new directory or deliberately reuse the documented existing environment.' }
python -m venv (Join-Path $env:APIP_RESEARCH_ROOT 'venv')
if ($LASTEXITCODE -ne 0) { throw 'Virtual environment creation failed' }
$researchPython = Join-Path $env:APIP_RESEARCH_ROOT 'venv\Scripts\python.exe'
& $researchPython -m pip install --only-binary=:all: --no-deps -r models/medassist/requirements-phase1.txt
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
& $researchPython -m pip check
if ($LASTEXITCODE -ne 0) { throw 'Dependency check failed' }
```

For later shells, set `APIP_RESEARCH_ROOT` to the deliberately selected existing environment and recompute `researchPython`; do not recreate it. The CLI rejects non-venv interpreters and unsupported Python minor versions. Root validation rejects repository paths/ancestors, configured OneDrive roots and obvious application roots. It cannot detect every possible web server configuration: never configure Express, Vite or another server to serve this research directory.

```powershell
& $researchPython -m models.medassist.research.cli acquire
& $researchPython -m models.medassist.research.cli profile --run-id unique-profile-name --publish-dir models/medassist/reports/unique-profile-name
& $researchPython -m models.medassist.research.cli metadata --run-id unique-metadata-name
& $researchPython -m unittest discover -s models/medassist/research/tests -v
```

Check each command's exit status before proceeding. Reusing a verified acquisition checks archive CRC/SHA-256 and extracted-member SHA-256 without downloading again. Profile and metadata run names and publication directories must be new; existing runs are never overwritten. Omitting `--publish-dir` keeps all outputs external. The metadata command fetches versioned Figshare metadata, PhysioNet demo checksum metadata and source terms only; it never downloads supporting patient archives.

## Storage and reproducibility

Under `APIP_RESEARCH_ROOT`:

- `venv/`: dedicated Python dependencies.
- `raw/nhamcs-ed-2022/`: exact ZIP, extracted Stata file and `acquisition-receipt.json` with URL/version, times, HTTP headers, SHA-256/CRC/bytes and parser versions.
- `runs/<run>/`: aggregate reports, external `*-private-assignments.json` containing source row/partition only, and a run receipt with source-code/report hashes.
- `metadata/<run>/`: supporting source metadata, terms snapshots and verification receipt.

Only explicit aggregate output objects can be published. No raw rows, RFV narratives, hospital/cluster IDs or row-level split assignments are exported into Git. Public acquisition and reproducibility summaries are copies of selected safe receipt fields, not a replacement for external provenance. Source hashes are computed locally; CDC did not supply a SHA-256 to authenticate this archive. TLS/source pinning, fixed size and ZIP integrity do not prove immutable publisher content. Recheck reported hashes before reusing another acquisition.

The pinned source manifest remains the approved specification; acquisition receipts hold observed local hashes. Do not edit the unrelated `dataset-manifest.json` or treat it as this utility's input. No research code imports application databases or serves datasets. Ignore rules are a secondary safeguard, not a substitute for external storage and explicit staged-file review.

New Python files and aggregate JSON use Git-pinned LF endings so their byte hashes survive Windows checkout. The pre-existing specification's recorded hash is its exact local bytes at acquisition (including existing line endings); another checkout's line-ending conversion can change that hash without changing parsed JSON. Compare the parsed approved manifest and retain the original acquisition receipt rather than replacing observed provenance with a new hash.

## Failure behavior

Environment validation runs before acquisition. A lock prevents concurrent acquisition. Downloads use a bounded `.part` file, exact URL/status/size checks, one allowlisted top-level Stata member, CRC and per-file hashes. Unsafe paths, extra members, encryption and symlinks are rejected. Receipt creation follows successful extraction; failures retain partial artifacts and a failure record without manufacturing a success receipt.

A stale lock or unreceipted artifact blocks retry. Inspect it manually; preserve the failed attempt under a different verified external path before retrying. Never delete or overwrite unrelated research environments. A parse failure may occur after successful archive verification: the acquisition receipt attests archive/file integrity, while the profile receipt attests successful schema loading and profiling. No receipt attests clinical validity.

## Components and checks

- `acquire.py`: source pinning, external-root guards, hashes, ZIP verification, cache and receipts.
- `data.py`: raw numeric Stata labels, missing-reason audit, temperature units, target exclusions, fixed feature profiles and provenance masks.
- `splits.py`: connected masked-cluster/hospital groups, seed-42 candidate partitions, overlap checks and three-fold grouped-CV support inspection.
- `profile.py`: actual marginals, missingness by target/cohort, column inventory, feature ledger, aggregate reports and private assignments.
- `cli.py`: venv checks, commands and aggregate publication boundary.
- `tests/test_phase1.py`: 14 synthetic tests; no real patient fixtures. Covers hashes/CRC, unsafe ZIPs, Stata raw labels, exclusions, missing encodings/units, feature leakage and provenance, deterministic connected groups, overlap detection, cache corruption/reuse, environment-first validation, truncation and network failure.

The [Phase 1 report](../reports/2026-10-19-phase1/README.md) records historical commands/results and known limitations. Its support flags are engineering warnings, not clinically reviewed minimum sample sizes. Source metadata checks require network; synthetic tests do not. The user subsequently reviewed the Phase 1 findings and selected the Phase 2 protocol below.

## Phase 2 baseline protocol preflight

The [frozen baseline protocol](../baseline-protocol.md) and [settings/digest](../baseline-protocol.json) define the next offline experiment. `protocol.py` implements target/feature contracts, Phase 2 zero handling, saved-assignment verification, within-fit CV and support guards. It does not call acquisition, outer split generation or any estimator fit. This adds `all_labelled_initial_vitals` to the allowlist; Phase 1's original decoding remains unchanged. Old Phase 1 aggregate reports/code hashes remain historical snapshots at their recorded commit.

With the existing research venv/root set, read the completed external Phase 1 run and choose a new aggregate output file:

```powershell
& $researchPython -m models.medassist.research.protocol --phase1-run phase1-final-20261019 --output models/medassist/reports/new-phase2-run/preflight.json
& $researchPython -W error -m unittest discover -s models/medassist/research/tests -v
& $researchPython -m pip check
```

Substitute your actual completed Phase 1 run name; both private assignment files and its run receipt must already exist. A missing file, changed source/protocol/assignment hash, mismatched dependency pins, changed cohort/support, group overlap or inadequate primary binary support stops preflight. It cannot repair these by generating another split. No raw data or row IDs are published. Existing output files are never overwritten by the CLI.

`test_phase2.py` adds nine synthetic tests (23 total across both phases), including matched cohorts, binary/original label separation, zero/provenance policy, leakage/nonfinite rejection, frozen-assignment mutation failures, fit-only CV, model-fit refusal during CV, calibration/rare-class guards, protocol checksum failure and absent-data refusal. The [Phase 2 report](../reports/2026-10-19-phase2/README.md) records actual preflight/reproducibility checks. Model pipeline fitting, calibration, scoring and deployment are future work; a protocol GO is engineering scope, not measured accuracy or clinical sign-off.
