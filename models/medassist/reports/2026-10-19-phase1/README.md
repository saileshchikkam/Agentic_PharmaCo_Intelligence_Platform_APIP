# MedAssist Phase 1 — acquisition and feasibility

Completed 2026-10-19 (Asia/Kolkata), offline research only. Actual NHAMCS Stata records were loaded and profiled; no models were trained, patient-facing behavior changed or ADR data touched. The [implementation/setup](../../research/README.md) and [approved experiment plan](../../experiment-plan.md) own reproducibility and proposed future evaluation respectively.

## Deliverables

- [Acquisition receipt summary](acquisition.json): exact source, UTC retrieval time, headers, bytes, hashes, member and parser versions. The full receipt and data remain outside Git.
- [Data-quality report](data-quality.md) and [machine-readable results](data-quality.json): actual labels, exclusions, missingness by target, age/sex/cohort summaries and published reconciliation.
- [Feature provenance/leakage report](feature-provenance.md), [ledger](feature-provenance.json) and [913-column inventory](column-inventory.json).
- [Split feasibility report](split-feasibility.md) and [full counts/CV/assignment digests](split-feasibility.json).
- [Reproducibility hashes](reproducibility.json): source manifest, research code and five aggregate report hashes. Row assignments remain private.
- [Supporting metadata verification](supporting-metadata.json): DDXPlus v2/CC BY 4.0 and five pinned file metadata records; two MIMIC demo publisher digests. No supporting patient archive was downloaded.

## Source and acquisition result

Exact downloaded source: [CDC NHAMCS ED 2022 Stata ZIP](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/stata/ed2022-stata.zip). The [official codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf) supplies interpretation and reference marginals. Source terms/limitations remain those in the [manifest](../../open-access-manifest.json): statistical analysis/reporting only, no identification/linkage; no blanket Creative Commons grant. Multum drug data are excluded from this experiment.

- ZIP: **2,311,045 bytes**; SHA-256 `aa32e635ef9564b1c8e03cea16c87ec2ed02e9a928d22a257df18100a38ad683`.
- Sole member `ed2022-stata.dta`: **37,720,094 bytes**; SHA-256 `0e00cd5aea4511cd619f7af1e0dc2f6825f111b7c87d3ebbb1358410a4c881c2`; CRC32 `ff16ca67`.
- **16,025 visits × 913 columns**. Actual published target reconciliation passes for all nine observed codes.

These are computed integrity hashes, not a CDC-published checksum or clinical endorsement. UTC receipts fall on 2026-10-18; the work's user-local date is 2026-10-19. No publisher content was silently substituted.

## Executed verification

Commands were run from the repository root using the external Python 3.12.2 venv described in the implementation README. `$researchPython` refers to that venv, never the application runtime.

```powershell
& $researchPython -m models.medassist.research.cli acquire
& $researchPython -m models.medassist.research.cli profile --run-id phase1-20261019 --publish-dir models/medassist/reports/2026-10-19-phase1
& $researchPython -m models.medassist.research.cli metadata --run-id metadata-20261019
& $researchPython -m unittest discover -s models/medassist/research/tests -v
& $researchPython -m pip check
& $researchPython -m models.medassist.research.cli profile --run-id phase1-final-20261019
```

The final private run regenerated the reports after clarifying the age-provenance ledger; only the explicitly allowlisted aggregate files were refreshed in this task's public report folder. Both actual runs produced identical partition-assignment digests. Reproduction should use fresh run/publication names because the CLI refuses overwrites.

Results: 14 synthetic tests passed; `pip check` reported no broken requirements; source parse/reconciliation and group-disjointness checks passed. The cached archive was reverified rather than downloaded again. No application build, Ollama test, estimator fit, accuracy metric or clinical validation was run for this research-only change.

An initial acquisition attempt ran before environment installation finished and failed before receipt creation. Its files were preserved in a separate external failed-attempt folder, then acquisition was retried successfully. Environment validation now precedes download and has a regression test. This failure is not represented as a successful profiling run.

## Readiness and next step

**Data engineering is reproducible; unchanged five-class training/calibration is not cleared.** The symptom restriction retains only 70 of 139 Immediate cases, and candidate calibration/threshold partitions have as few as 10/5 Immediate cases. Precise initial-feature timing is unresolved; several zero vitals and demographic provenance need review. These limitations affect sample selection, calibration, subgroup uncertainty and eventual home use.

Next safe task: review the cohort/feature ledger and candidate split, then explicitly revise/freeze a support-aware offline baseline protocol. Consider an all-labelled no-RFV initial-vitals research profile and a separately defined high-acuity endpoint, with clear limits on five-class calibration. These are proposals, not adopted changes. Preserve group isolation and a held-out test; do not search seeds for flattering support or translate ED acuity into home-care recommendations. Only after this phase is reviewed should baseline training be separately authorized.
