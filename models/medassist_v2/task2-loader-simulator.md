# Task 2 — read-only loader and staged simulator

Implemented 2026-10-19 from commit 1e132194b77f89f9d4d2a2ff3864086b3df9002e. No acquisition, training, LLM, urgency inference, API or application integration. [Task 2 readiness](task2-readiness.md) records actual local availability; [verification](task2-verification.json) records checks and changed files. Task 1's source manifest and verification receipt remain unchanged historical inputs.

## Local loader

`DatasetLoader(root, served_roots=())` accepts only the exact Task 1 English v2 manifest, checked against its recorded SHA-256. `records('train'|'validation'|'test')` binds each stream to its pinned archive. `validate` is never treated as an additional partition or used to reshuffle membership. No combined/default patient stream, extraction, network request, file write or assignment generation exists.

Supply every configured served root. The existing external-path guard rejects repository ancestors/descendants, OneDrive and common served folders. Files must be direct regular local files under that resolved root; source-file symlinks are refused. Use trusted read-only local storage without concurrent writers. The loader holds the verified file descriptor and checks size/mtime/ctime during reading; this detects ordinary mutation, not an adversary controlling the process/filesystem. Arbitrary web-server configurations cannot be discovered automatically.

Source bytes are hashed in 64 KiB blocks, checked against exact published sizes and pinned publisher MD5 values, and also SHA-256 hashed. Any supplied pinned local SHA-256 is enforced; current manifest local SHA-256 values are null because no dataset files were acquired. Newly observed SHA-256 is provenance, not publisher authentication. MD5/source metadata pinning is not a cryptographic guarantee against a malicious publisher; never silently replace checksums to accept changed files.

ZIP preflight reads at most the 65,557-byte end window and bounds the central directory before ZipFile allocates it. Only one flat regular CSV member is accepted. Traversal, absolute/drive/backslash paths, symlinks, extra entries, multipart/ZIP64/encrypted/unsupported archives and excessive expansion are refused. Limits are 2 GiB expanded data, expansion ratio 500, 64 KiB central directory and 1 MiB cumulative physical-line bytes per CSV record, including quoted multiline fields. These are engineering limits, not observed DDXPlus sizes. ZIP CRC is checked by the stream on complete consumption; callers that stop early do not establish full CSV/CRC validation. All source archives are size/hash checked before yielding records.

Metadata loading is bounded to 1 MiB and uses duplicate-key rejection. Normalisation uses documented `is_antecedent`, `data_type`, `question_en`, `possible-values` fields. Conditions are evaluator-only. Records have an exact six-column header, safe literal decoding and Task 1 evidence/differential validation, with source-condition membership checks. Malformed/unrecognized records stop the stream without printing their values. One record plus bounded metadata is retained; no corpus list or row-ID/hash set is accumulated. Actual source schema/performance/limit compatibility remains unverified until the pinned files are available.

## Oracle and selector boundary

The trusted harness constructs `OfflineCase(raw, catalogue, partition)`. Its diagnostic references are retained only by `evaluator_data()`, a deliberate evaluator-only capability. The `HiddenOracle` contains evidence answers but **no diagnosis or differential labels**. `case.start()` creates an interview that has no evaluator reference. Do not pass the case, loader record iterator, evaluator or oracle to a selector, logger, prompt or RAG system.

The selector receives only detached JSON-compatible `view()` dictionaries: initial evidence, explicitly disclosed context, the same public question catalogue for every case, asked questions, disclosed current/history answers, unknowns, contradictions and stopping reason. Source partitions, row IDs, full source evidence, generation defaults, condition maps, future answers and diagnostic references are absent. Initial disclosure is only INITIAL_EVIDENCE's answer. Age/source SEX remain hidden unless the harness explicitly sets `disclose_demographics=True`; pregnancy/postpartum/history are not inferred. Public question wording can mention medical history; that does not disclose the particular patient's hidden diagnostic label.

`ask(evidence_id)` validates a public catalogue question and reveals only that answer. Categorical values retain source types; a multichoice question reveals its encoded list. Repeated/initial questions are idempotent and do not query the oracle again; invalid questions fail with value-free codes. **Evidence absent from the source oracle returns unknown, not false/default.** This conservative Task 2 policy avoids inventing negative patient answers, but differs from a generator-default-complete DDXPlus benchmark. Negative/default/NA semantics require an independently specified review before learning or comparing results.

`observe` is a trusted scripted-disclosure hook for already revealed evidence, used to test contradictions. Conflicting values retain history, mark the current answer contradictory, and cannot silently resolve themselves. It never fetches an undisclosed value. `stop` records selector request, insufficient information or unresolved contradiction; question budget/all-catalogue disclosure are deterministic software stops, not clinical thresholds. No clinical stopping rule is supplied.

`run(selector)` passes only public copies, terminating on None, repeated questions or the budget. No selector/model is implemented. Redacted repr and forbidden pickle state reduce accidental logging/serialization. This is a capability/API boundary for **trusted local code**, not a sandbox against malicious Python introspection or a selector deliberately closing over the case. Separate-process isolation would be additional work before executing untrusted selectors. Hidden-answer noninterference, detached mutation, repeated questions and deterministic replay are synthetic-tested.

Task 2's minimal versioned selector view is separate from the fuller Task 1 archival interview schema. No persistent snapshot/export converter is claimed. All real case state/evaluator outputs would remain external and private; only fictional tests and aggregate readiness belong in Git.

## Checks

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python -W error -m unittest discover -s models/medassist_v2/tests -p test_loader_simulator.py -v
python -W error -m models.medassist_v2 verify-fixtures
python -W error -m models.medassist_v2 readiness
```

Readiness exits 2 when missing/blocked, zero only after all five pinned files and all three source streams complete. No configured root was present in this task; consequently no actual dataset statistics were generated. A positive synthetic bundle check establishes software behavior only. Old full research suites, clinical benchmarks and application builds were not rerun for this isolated change.
