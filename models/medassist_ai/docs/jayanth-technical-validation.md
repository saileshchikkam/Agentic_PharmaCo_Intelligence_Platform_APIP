# Jayanth compatibility and validation — 2026-10-24

**Outcome: declared dependencies reproduced; normalization and audits implemented; disease-model execution remains disabled.** No fitting, model conversion, clinical output, cloud request or UI change occurred. Canonical recovered files were not modified.

## Reproduced dependency environment

Created ignored `venv/jayanth-compat` with CPython 3.12.2, without system-site packages or user-site access. It contains the exact five contributor pins: scikit-learn 1.9.0, Joblib 1.5.3, NumPy 2.5.1, pandas 3.0.5 and SciPy 1.18.0. Ten packages including transitive dependencies were installed as PyPI binary wheels; `pip check` passed. APIP's existing `.venv` and its scientific versions were unchanged. This reproduces declared requirements, not an attested original model-build environment.

[Direct pins](../jayanth_model/requirements-compat.txt), [complete Windows/CPython-3.12 wheel hash lock](../jayanth_model/requirements-compat.lock), [selected installer report fields](compat-install-report.json) and [environment receipt](jayanth-compat-environment.json) make the resolution reviewable. For a new separately chosen empty environment, use its interpreter with:

```sh
python -m pip install --only-binary=:all: --require-hashes --index-url https://pypi.org/simple -r models/medassist_ai/jayanth_model/requirements-compat.lock
python -m pip check
```

Do not run these commands against the preserved application/Model A environment. The original root requirements remain byte-exact UTF-16. No scientific-package upgrade/downgrade was performed there.

## Artifact integrity and trust decision

All 16 canonical source/data/dependency files, including the three Joblib files, still match the recovered source Git blob IDs and SHA-256 digests. The repository/author/merge provenance is established by the prior audit. It does not independently bind binary contents to a reviewed build with known Python/runtime, preprocessing and training membership.

The 2,307-byte symptom vocabulary is exactly an allowlisted literal string-list grammar. A bounded, non-executing opcode reader extracts its 131 strings, rejects object-construction instructions, duplicates, malformed framing and trailing bytes, and verifies exact CSV feature ordering. **No `pickle.load(s)` or `joblib.load` was called.** The model and label encoder contain object-construction instructions; a generic pickle-opcode pass stops at a nested STOP with additional Joblib stream bytes remaining (21,592,684 model bytes; 39 encoder bytes). This is a limitation of the inspection, not evidence of malware or corruption. It is not a complete executable-payload review.

[Trust assessment](jayanth-trust-assessment.json) therefore keeps loading blocked: no reviewed/reproducible binary-build binding or separate constrained execution boundary has been established. A virtual environment isolates packages, not arbitrary pickle execution. [Joblib documents arbitrary-code execution on loading](https://joblib.readthedocs.io/en/stable/generated/joblib.load.html); [scikit-learn requires trusted sources and compatible build environments](https://scikit-learn.org/stable/model_persistence.html). Signature absence alone is not treated as proof of unsafe content. No unsafe load was attempted to discover compatibility. Serialized estimator internals and LabelEncoder classes remain unverified; controlled disease inference was **not run**.

## Implemented adapter behavior

`JayanthDiseaseModelAdapter.normalize_symptoms` first verifies canonical artifact integrity and uses only the literal vocabulary reader. `SymptomVocabulary` preserves exact trained-column spelling/order while deterministically applying Unicode NFKC, case folding, trim and whitespace/underscore normalization to matching keys. It rejects colliding normalized features and invalid input types; it does not guess synonyms, translate clinical terms or use fuzzy matching.

The result separately reports supported present features, every unsupported supplied string and not-observed features. Duplicate inputs do not alter ordering. `observed_vector` requires explicit positive/negative coverage, rejecting unsupported input, contradictions or missing features; it never silently makes missing/UNKNOWN symptoms negative. This is a conservative interface, not validation of the original model's zero-fill assumptions. The existing DDXPlus crosswalk remains separate and requires reviewed mapping; matching names alone is not clinical equivalence.

`predict` continues to return unavailable, with an explicit serialization-trust/crosswalk reason. No new HTTP or patient-facing route was added. Disease descriptions and precautions remain unavailable: their CSVs contain no traceable URL citations/source/review metadata, and upstream rights/reviewer approval remain unestablished. Symptom weights are not urgency labels or calibrated confidence. Model B remains disabled.

## Dataset and evaluation findings

[Deterministic audit](jayanth-dataset-validation.json) found 4,920 rows, 131 binary features, 41 labels and 304 unique symptom vectors. There are 4,616 repeated vectors and no conflicting labels for identical vectors. All labels have 120 rows, but only 5–10 unique symptom groups each: apparent row balance overstates independent support.

Reconstructing the original source's stratified 80/20 seed-42 **indices only** found that all 984 test rows have symptom groups present in training. No predictions or accuracy were computed. This undermines the original random-split evaluation as independent evidence.

A seed-42 `GroupShuffleSplit`, grouped by symptom vector without disease label, produces 3,828/1,092 rows across 243/61 groups with zero overlap. The test partition contains only 32/41 labels; that limitation is recorded rather than hidden by selecting another seed. This is a prospective partition diagnostic, **not a new independent test for the already-trained artifact**. Post-hoc splitting cannot remove prior training exposure; do not score this model on these groups and claim held-out accuracy. Further validation needs an independently documented untouched cohort or a separately authorized future group-safe experiment; no retraining was performed here.

## Checks and remaining blockers

Final tests: 20 modular Python tests and 14 existing evidence/workflow tests passed; the dataset audit also passed in the isolated declared-version environment. All 39 affected JavaScript integration tests passed with mocked cloud transport. No failures/skips in final runs. A test patches `joblib.load` to fail and confirms the audit never calls it.

[Preservation](jayanth-validation-preservation.json) verifies all 17 sealed Model A hashes, seal digest, 13 frozen code/protocol/evidence files, recovered canonical files and unchanged application scientific versions. Official locked test/ledger were not accessed. No fresh browser/cloud end-to-end or trained disease inference is claimed. Existing trusted Model A pickle/environment and CRLF-local/LF-Git portability caveats remain.

Next technical requirement: a reviewed source-to-binary build/runtime attestation or an appropriately isolated, explicitly trusted model-loading process, followed by estimator/encoder/feature parity and controlled fictional inference. That does not remove the separate rights, reviewed crosswalk, independent-validation, calibration and clinical-source blockers. No commits, pushes or stage changes.

[Exact task inventory and verification](jayanth-validation-verification.json).
