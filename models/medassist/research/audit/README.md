# Phase 4A read-only cached error auditor

This package reads the existing completed Phase 3 run, verifies frozen provenance and emits count-only error views. It never loads fitted estimators, predicts, trains, calibrates, chooses thresholds, regenerates outer splits, downloads data or touches application storage. The code lives in a subpackage so the original Phase 3 top-level Python source hash set remains unchanged.

Read the [Phase 4A findings/design](../../reports/2026-10-19-phase4a/README.md), [Phase 3 runner](../training.md) and frozen protocol first. Reuse the external pinned research venv and explicitly select the original research root; do not create a replacement dataset or environment merely to run this audit.

```powershell
# Use your existing unsynced research directory from Phase 1/3.
$env:APIP_RESEARCH_ROOT = Join-Path $env:LOCALAPPDATA 'APIP\research\medassist-phase1-20261019'
$researchPython = Join-Path $env:APIP_RESEARCH_ROOT 'venv\Scripts\python.exe'
$env:PYTHONDONTWRITEBYTECODE = '1'
& $researchPython -W error -m unittest discover -s models/medassist/research/tests -v
& $researchPython -m pip check
& $researchPython -W error -m models.medassist.research.audit.cli --phase3-run phase3-baseline-v1-20261019 --output models/medassist/reports/new-phase4a-audit/error-audit.json
```

Check each exit status. If the app or shell virtualizes LOCALAPPDATA, select the **actual pre-existing root** recorded in your environment rather than creating a new one; private machine paths do not belong in Git documentation. The output must be a new JSON under the MedAssist reports directory; existing outputs are refused. Source/run names must identify the existing completed Phase 3 run, not copied or new assignments.

`cli.py` checks the unchanged protocol, source and requirements hashes, saved assignments, connected groups, CV digests, all sealed artifact hashes, completion/test-report checksum and equality to the published Phase 3 test report. It validates cached membership/order/labels and reconciles FN/FP/Immediate/abstention counts. It hashes raw-source, completed Phase 1 run and Phase 3 run files before/after, refusing publication if any content/membership changes. It reads only trusted locally generated joblib dictionaries containing arrays, never base/calibrated model or job objects. Joblib is not safe for foreign artifacts; do not point this utility at downloaded/untrusted pickles. Before/after inventories detect this audit's changes, not historical tampering before the first snapshot or malicious code execution inside an untrusted pickle.

`errors.py` computes fixed-threshold binary errors, uncalibrated five-class argmax errors, arithmetic BP-order flags and single-attribute source/decoded-missingness/provenance/coverage counts. The BP flag is an internal consistency screen, not a clinical-validity rule. It does not invent physiological thresholds or alter v1 decoding. Rates/intervals and causal conclusions are intentionally absent. Sparse supports are flagged. Cache membership joins stay in memory; no row IDs, record examples, group identifiers or private paths enter outputs.

Development views use six primary calibration/threshold caches at their frozen thresholds; no development abstention mask exists, so those fields are absent. Fitting views are input-quality only. Fit/OOF and secondary development errors cannot be reconstructed without new predictions, which this task does not perform. Opened-test views are descriptive and cannot optimize thresholds, replace CV winners or certify home triage.

The regression suite adds synthetic checks for binary/ordinal/Immediate distinctions, abstention unions, absent-cache semantics, invalid scores/masks, sparse/source-provenance output, alignment, file mutation/addition/deletion, estimator-load refusal and exact cache membership. No real records are test fixtures. The [dated history](../../../../docs/history/2026-10-19.md) records actual checks, including the Windows sandbox fixture failure and successful retry; no application build or new clinical evaluation is claimed.
