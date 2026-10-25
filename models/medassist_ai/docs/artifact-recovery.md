# Jayanth branch audit and artifact recovery — 2026-10-24

## Exact branch and ancestry findings

Live `git ls-remote --heads origin` returned two branches:

- `refs/heads/MedAssist-Jay` → `54006967a0325acdae83e46f04a84b4ce1ad4f92`.
- `refs/heads/main` → `6965b204bbc70eac91fccad5669a8a1c384c6844`.

There is no live branch literally named `Medassist - jayanth`. The locally retained `origin/JAYANTH` ref also points to `5400696` but is absent from the live remote listing; it is stale and was not pruned. The live `MedAssist-Jay` branch is an older APIP component commit, contains no `app/ml` or `app/data` files and is 48 commits behind current remote main.

After the explicitly requested fetch, `origin/main` contains both `357906c45945e9e42fcd0dabe234f9c178ad2ec3` (original ML contribution) and `6965b204bbc70eac91fccad5669a8a1c384c6844` (merge). Merge parents, in recorded Git order, are `357906c...` and `7618d4e63df4ef12615f264cddcf8320237cb2cd`. The original contribution is a separate root history that has already been merged remotely.

Local `main` remains `7618d4e...`, two commits behind remote main. The active `codex/medassist-v2-task5a-adapter` remains `389b18523863131d26aaa2421472c2af8a2f7b00`, with two local documentation commits not on remote main and the two remote contribution/merge commits absent from its ancestry. Neither cited Jayanth commit is reachable from local main, the active branch, `origin/MedAssist-Jay` or the stale `origin/JAYANTH`; both are reachable from `origin/main`.

## Cause and safe scope

The missing files were caused by outdated local branch ancestry and a stale pre-fetch `origin/main`, **not an unmerged ML contribution**. Sparse checkout/skip-worktree and partial-clone configuration were not enabled; target paths were not ignored; all recovered entries were regular Git blobs, not LFS pointers. The selected paths were absent both from the active Git tree and filesystem. No tracked-file deletion was being repaired.

A blind update/merge was inappropriate: remote changes include `.gitignore`, `README.md`, authentication, database/migration and service code outside this task; the local README already has user work. No conflict resolution was attempted. Instead all 16 selected targets were preflighted together, their source blob identity/size checked against the pinned commit, and exact raw Git bytes written with exclusive creation. Existing files and symlinks would have stopped recovery. No filters, newline conversion, checkout, branch switch, fast-forward, merge, stage or commit occurred.

## Recovered paths

All paths below are canonical, not duplicate copies:

```text
app/ml/model.joblib
app/ml/label_encoder.joblib
app/ml/symptom_columns.joblib
app/ml/train.py
app/ml/predict.py
app/ml/model_loader.py
app/ml/preprocessing.py
app/ml/evaluation.py
app/ml/feature_engineering.py
app/data/dataset.csv
app/data/processed/processed_dataset.csv
app/data/symptom_precaution.csv
app/data/symptom_Description.csv
app/data/Symptom-severity.csv
app/data/disease_specialization.py
requirements.txt
```

Total restored: **23,618,309 bytes**. All 16 raw Git blob identities and sizes matched, and all files have recorded SHA-256 digests. The canonical `evaluation.py` and `feature_engineering.py` are empty, not fabricated implementations. Requirements retain their original UTF-16 bytes; no dependency installation or source normalization occurred.

[Per-file recovery hashes](artifact-recovery.json) and the updated [adapter manifest](../jayanth_model/manifest.json) record the full source commit, sizes, Git blob IDs and SHA-256. The adapter checks both hashes but unconditionally retains `trusted_to_deserialize: false` and `execution_enabled: false`. Restored files are untracked on the unchanged active branch because their containing commit is not in that branch's ancestry; they already exist in remote main. Do not confuse recovery with a merge or a new artifact training run.

## Compatibility, tests and preservation

[Safe static inspection](recovery-compatibility.json) confirms 4,920 processed rows, 131 unique binary features, 41 labels and CSV feature order matching the source-derived sorted vocabulary. This does not verify serialized estimator dimensions, feature names or LabelEncoder classes. Source AST confirms 300 Random Forest trees, fixed random state 42 and a stratified random 80/20 row split. The original import-time Joblib loader was never imported, and no recovered source was executed.

Declared versus preserved installed dependencies differ: scikit-learn 1.9.0/1.9.1, Joblib 1.5.3/1.6.0, NumPy 2.5.1/2.2.2, pandas 3.0.5/3.0.0 and SciPy 1.18.0/1.16.1. No version was changed. Training source expects `data/processed/processed_dataset.csv` whereas the canonical repository file is under `app/data/processed/`; that runtime-path issue remains unresolved.

All 15 modular Python tests and 14 existing evidence/workflow tests passed, no skips or failures. [Model A preservation](recovery-model-a-preservation.json) matched all 17 sealed artifacts, the seal digest and 13 frozen code/protocol/evidence files. No official locked-test data or ledger access, model inference, training, UI changes or background service starts occurred during recovery.

Remaining blockers: trusted build/deserialization approval, actual binary/runtime parity, reviewed evidence crosswalk, dataset origin/licence and intended-use permissions, group-safe evaluation (4,616 repeated disease/symptom sets among 4,920 rows), calibration, traceable clinical precaution sources and qualified review. Disease inference stays disabled; it is neither a diagnosis nor Model B urgency. The existing Model A trusted-pickle/environment and CRLF-local/LF-Git protocol caveats are unchanged.

[Final verification and exact task inventory](recovery-verification.json) distinguishes intentional manifest/test/documentation updates from preserved preexisting work. No commit or push was performed.
