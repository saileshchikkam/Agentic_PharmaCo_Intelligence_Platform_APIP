# MedAssist Symptom Assessment v2 — research foundation

**Day 2, 2026-10-21:** the [local fictional question lab](../../src/features/model-a-research/README.md) now connects the existing selected Model A through a development-only proxy, with B/C/M/UNKNOWN controls, stop/reset, evidence summary and unchanged `model-a-to-b.evidence.v1` export. [Actual verification/inventory](research_adapter/day2-verification.json). Research-only, opt-in, no patient route or clinical Model B; review remains required before commit/merge/push.

**Task 5A prototype for review, 2026-10-20:** [isolated Model A FastAPI adapter](research_adapter/README.md) loads the existing selected ranker read-only, validates fictional coded disclosures with frozen semantics, and returns a pending question plus versioned evidence. Focused tests and a measured local benchmark support a CONDITIONAL GO for developer research only. It is separate from application routes; no Model B, patient-facing inference, clinical review or locked-test evaluation is implemented. The patch remains uncommitted pending user review.

**Task 4B completed 2026-10-20:** [official training, validation and verified pre-test seal](task4b-validation.md), [safe aggregate results/hashes](task4b-aggregate.json). All three frozen SGD fits completed; validation selected alpha 0.00001. All 132,448 validation interviews and 529,792 policy trajectories were reported, including sensitivity/subgroup/cluster uncertainty. Full-validation ranker recall@20 is 77.1866%, a synthetic collection measure, not clinical accuracy. Original process exited 0; all 17 sealed artifacts and five sources were independently verified. Locked test remains unopened and requires separate authorisation. Preserve the sealed run; do not repeat fitting. Fresh-checkout CRLF/LF checksum portability remains unresolved.

**Task 4A runner/software preflight completed:** [actual checks and remaining gates](task4a-preflight.md), [runner stages and exact commands](training/README.md). The frozen pipeline is implemented and fictional end-to-end checks passed with a non-learning stand-in. Official source/environment preflight decoded zero patient rows and performed no fitting/evaluation. Real support, convergence, resource and pre-test gates remain unexecuted; no v2 model or clinical service is claimed.

**Task 3.5: [adaptive-questioning protocol v1 frozen](adaptive-questioning-protocol.md)** with [JSON settings](adaptive-questioning-protocol.json), [integrity checksum](adaptive-questioning-protocol.sha256) and pure validation/leakage references. The restricted 218-question task quarantines five unresolved history questions, preserves UNKNOWN/default distinctions and official partitions, and predeclares training-overlap sensitivity, capped prefixes, three baselines, one SGD ranking family and locked evaluation. This is a protocol GO, not a trained model or clinical approval. [Task 3.5 checks](task35-verification.json); training requires separate authorisation and pre-fit/parity gates.

**Task 3 completed:** [official-source acquisition, full audit and next-study gates](task3-readiness.md), [aggregate statistics](task3-aggregate.json), [observed checksums](task3-source-verification.json), [verification receipt](task3-verification.json). All five pinned files are verified externally; 1,292,579 source records passed validation. Cross-partition duplicates require a frozen overlap policy before any independent-evaluation claim; source defaults/dependencies also need an explicit experiment design. No training or application inference occurred. Task 4 is not started.

**Historical Task 2:** [read-only local loader and staged simulator](task2-loader-simulator.md), [then-missing data and acquisition commands](task2-readiness.md), [Task 2 checks](task2-verification.json). No real dataset statistics were produced in Task 2. Task 1/2 implementation and then-next-step statements below are historical context; unchanged receipts describe their respective task, not current source/documentation bytes. Current availability and findings are owned by Task 3.

**Task 1: implemented software contracts and synthetic checks, 2026-10-19.** This is a separate English-only research track for symptom interviewing and future adaptive question selection. It is not the NHAMCS ED-acuity task, an urgency model, a clinical algorithm or an application service. No model training, dataset archive download, LLM integration or inference endpoint is included. Required services cost zero.

The [Phase 4A findings](../medassist/reports/2026-10-19-phase4a/README.md) and all earlier NHAMCS artifacts remain unchanged. No APIP frontend, backend, API route, ADR, account or patient-facing behavior is modified. This package imports no legacy research or application code. The existing unrelated manifest under models/medassist is not its input.

## Contracts and navigation

- [Dataset provenance/licence manifest](dataset-manifest.json): official English DDXPlus **v2**, DOI 10.6084/m9.figshare.22687585.v2, CC BY 4.0, observed metadata digest, documentation, five exact public file references and publisher MD5 values. Historical Task 1 local hashes remain null; actual acquisition hashes are in the separate Task 3 source receipt.
- [Interview schema](schemas/interview.schema.json) and [data contract](data-contract.md): current disclosed facts, context, evidence types, answer history, confirmation, unknowns, contradictions and question candidates. Supports ages in days/months/years, caregivers, pregnancy and postpartum without inferring clinical context from sex or age.
- [Separate research urgency schema](schemas/urgency-annotation.schema.json) and [label specification](urgency-labels.md): proposed labels, explicit insufficient-information/abstention, no clinical approval or source-label mapping. Stored separately from interview inputs.
- `validation.py`: schema, provenance, typed evidence, source-record and cross-field checks; fixed error codes exclude record values.
- `quality.py`: aggregate missingness, duplicate-content screening, class coverage and connected-group split feasibility. It creates no assignments and keeps source partitions unchanged.
- `storage.py`: read-only guard for external storage paths and declared served roots; creates no data directories.
- `fixtures/`, `tests/`: small project-authored fictional software fixtures. **Passing tests is not evidence of clinical accuracy**, label validity or all-age coverage.
- [Verification receipt](verification.json): actual commands, dependency versions, preservation checks and safe task-file hashes.

## Run focused checks

Python 3.12 was used. The five [pinned packages](requirements.txt) already existed in the local Python environment; none was installed or changed for Task 1. New installations should use a **separate external v2 environment**, never install into the frozen Phase 1–4A venv. From the repository root:

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python -W error -m unittest discover -s models/medassist_v2/tests -v
python -W error -m models.medassist_v2 verify-fixtures
```

Check each exit status. The fixture command validates one fictional interview and a separately held DDXPlus-shaped fictional oracle, then prints only aggregate software diagnostics. It does not convert the oracle into interview answers, choose questions or score urgency. No clinical benchmark is executed. To prepare another machine, create a new unsynced v2 venv outside the repository/served directories and install `-r models/medassist_v2/requirements.txt`; a clean-machine installation was not exercised here.

## Storage and next gate

Any future raw data, case snapshots, annotations, membership maps, profiles with identifiers, caches and fitted artifacts belong in a dedicated external unsynced research root. Use `storage.external_path` before future I/O and supply every configured served root. The guard resolves paths, rejects repository ancestors/descendants, common served folders and OneDrive paths; it cannot discover every web-server configuration. No dataset I/O/acquisition command is provided in Task 1. Ignore rules are secondary protection, not permission to place sensitive data in Git.

Next separately scoped task: review source metadata and normalisation against real permitted files, pin actual SHA-256 and original memberships, then implement an external loader and staged-answer simulator with strict hidden-oracle separation. Assess source classes, duplicate/group leakage, missingness and performance before freezing a questioning experiment. This is a proposal, not an implemented importer or authorization to train. Independently reviewed symptom-to-care labels, sufficient information and population coverage are still required for a future urgency study; DDXPlus does not supply them.
