# MedAssist Symptom Assessment v2 — research foundation

**Task 2 now implemented:** [read-only local loader and staged simulator](task2-loader-simulator.md), [actual readiness/blockers and acquisition commands](task2-readiness.md), [Task 2 checks](task2-verification.json). Pinned real files are not locally configured; no real dataset statistics were produced. The Task 1 implementation and then-next-step statements below are historical context. Its unchanged verification receipt describes the Task 1 commit, not subsequent source/documentation bytes.

**Task 1: implemented software contracts and synthetic checks, 2026-10-19.** This is a separate English-only research track for symptom interviewing and future adaptive question selection. It is not the NHAMCS ED-acuity task, an urgency model, a clinical algorithm or an application service. No model training, dataset archive download, LLM integration or inference endpoint is included. Required services cost zero.

The [Phase 4A findings](../medassist/reports/2026-10-19-phase4a/README.md) and all earlier NHAMCS artifacts remain unchanged. No APIP frontend, backend, API route, ADR, account or patient-facing behavior is modified. This package imports no legacy research or application code. The existing unrelated manifest under models/medassist is not its input.

## Contracts and navigation

- [Dataset provenance/licence manifest](dataset-manifest.json): official English DDXPlus **v2**, DOI 10.6084/m9.figshare.22687585.v2, CC BY 4.0, observed metadata digest, documentation, five exact public file references and publisher MD5 values. Local data hashes remain null because no source files were acquired.
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
