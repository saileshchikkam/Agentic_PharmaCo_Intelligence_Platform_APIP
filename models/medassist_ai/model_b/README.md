# Model B: gated offline training/evaluation foundation

Implemented 2026-10-24. **A separate five-class NHAMCS ED research baseline is trained; no four-class clinical urgency model is approved or enabled.** The unchanged live `DisabledModelB` always returns `unable_to_assess`, null urgency and no model-version/validation claim. This package never imports Jayanth's classifier, disease labels, datasets or weights. No new application route, UI or dependency installation was added.

## Implemented components

- [Experiment 2 report](docs/nhamcs_ed_experiment2.md), [frozen results](docs/nhamcs_ed_experiment2_results.json) and [validation-only runner](ed_experiment2.py): two fixed Extra Trees candidates, source-imputation leakage masking and severe-first rejection gates. Neither qualifies; validation macro-F1 0.3265/0.3131 versus 0.3458 for frozen logistic. Original test is excluded from development/scoring and is already exposed. The report corrects Experiment 1's age-flag interpretation and records diagnosis/triage-based sex-imputation leakage without rewriting Experiment 1 artifacts or results. Live Model B remains disabled.

- [label-schema.v1.json](label-schema.v1.json): versioned four-slot unapproved configuration. `level_1`–`level_4` have no clinical definitions/actions; `unable_to_assess` is separate abstention, not a fifth invented training target. Emergency mapping is unset.
- [data.py](data.py): `LabelSchema`, `FeatureSchema`, `DatasetManifest`, `DatasetIngestor`, `DatasetValidator`, review/document provenance and read-only `EvidenceProjector`.
- [splitting.py](splitting.py): `GroupSafeSplitter`, immutable split receipts and `LeakageAuditor`.
- [training.py](training.py): `NumericEvidenceEncoder`, gated `ModelTrainer`, `TrainingPipeline`, `ResearchFit` and `ArtifactRegistry`.
- [evaluation.py](evaluation.py): `ModelEvaluator` with per-class precision/recall/F1, confusion matrix, calibration diagnostics, abstention and gated emergency analysis.
- [Synthetic tests](tests/test_foundation.py), [verification/inventory](verification.json), [preservation](preservation.json).

The clinical-gated trainer defaults to logistic regression with seed-bound random state and maximum 1,000 iterations. Those clinical fitting gates remain blocked. The separately authorized [five-class statistical runner](ed_research.py) reuses explicit-state encoding, leakage auditing and `ResearchFit`, with a separate evaluator and no clinical-provider connection. Existing scientific packages remain unchanged.

## Clinical-data admission requirements

See the [dataset qualification review](docs/dataset_qualification.md) (2026-10-24) for ranked official sources, verified access terms, evidence gaps and exact training blockers. MIMIC-IV-ED is a conditional candidate for a separately approved ED-acuity study; no reviewed source is ready for the current four-level conversational task. Model B remains disabled.

The [real-data report](docs/real_data_training.md) records a completed source-label ED experiment on 10,207 visits: 6,123 train, 2,042 validation and 2,042 test, with stratified duplicate-group separation. One balanced multinomial logistic regression achieved test accuracy 45.84%, macro-F1 0.3342 and immediate-class recall 17.86%; clinical use is NO-GO. Configuration, actual metrics, hashes and checks are in the [aggregate results](docs/nhamcs_ed_research_v1_results.json). The [access manifest](docs/nhamcs_2022_access_manifest.json) preserves the preceding audit. Data, row-level splits and weights are external/private. Patient-independent validation and community-task compatibility are unestablished. Run instructions and limitations are in the report; 19 focused tests pass.

The checked-in label schema must remain unapproved until qualified reviewers prospectively define all four targets, population, prediction time, intended use/setting and action meanings. Approved schemas require reviewer identity, qualification, scope/date and hash-bound review document. Emergency analysis additionally requires an explicit approved mapping; `level_1` is not assumed to mean emergency.

A clinical `medassist.model-b.dataset.v1` manifest requires dataset identity, governed relative data path and SHA-256; source/usage-rights documentation; intended-population/use alignment; approved label-schema hash; adjudication documentation and record-level references bound to it; grouping/identity-coverage review; prediction-time feature review; clinical reviewer scope and explicit training authorization.

Documents must be nonempty unchanged files inside the governance root, up to 1 MiB each. Data is UTF-8 JSONL, at most 64 MiB/100,000 lines. Hash changes, duplicate JSON keys, extra fields, nonfinite values, duplicate record IDs, unknown targets/features and path escapes fail closed. Clinical records require `qualified_adjudication` and `clinical_source` origins. Disease labels and fictional Model A exports cannot become clinical ground truth. All synthetic fixtures are rejected by the trainer before estimator construction.

These checks establish metadata consistency, not professional credential authentication, legal permission or clinical adequacy. Authorized humans must substantively establish those facts; no approval was supplied by this task.

## Evidence contract

Rows contain a stable ID, optional pseudonymous patient/encounter/source grouping IDs, target code, label/adjudication provenance and allowlisted structured observations. States distinguish observed positive/negative/numeric value, UNKNOWN, not asked, unsupported and contradiction. Missing entries become not asked, never negative. Encoding uses a numeric value plus seven explicit state channels, so a missing numeric zero is distinguishable from an observed negative.

This initial Model B schema accepts binary/numeric evidence. Categorical/multichoice values require a separately reviewed versioned mapping and are rejected rather than assigned guessed ordinal values. `EvidenceProjector` reads the unchanged `model-a-to-b.evidence.v1` and preserves its fictional provenance. Model A's 223-item export and protocol are untouched.

## Group-safe splitting and training

Connected records sharing duplicate symptom signatures, patient IDs, encounter IDs or configured source groups stay together transitively. Signatures exclude labels and normalize equivalent numeric formatting. Identifier whitespace is normalized; source namespaces and missing identities still need human grouping review.

Seeded train/calibration/test group partitions bind dataset, record-content and feature-schema hashes. Audits reject changed content, duplicate assignments and cross-partition identity/symptom leakage; report class imbalance/support, conflicting group labels and missing identifiers. Insufficient groups fail. The trainer rejects partitions missing any class: a technical coverage check, not proof of sufficient rare-class support. It does not search seeds for favorable metrics.

Training rereads the governed, hash-bound original and compares canonical records before fitting. Only train indices enter fitting. Calibration/test partitions receive separately labelled diagnostics. This v1 does not fit a probability calibrator, optimize abstention or select models. Any caller-supplied research threshold must be prospectively specified/developed on calibration data, never selected from test results. No threshold is a clinical action rule. With no threshold supplied, all predictions abstain.

## Evaluation and artifact registration

Metrics require explicit synthetic/clinical scope and always report `clinical_validation: false`. Synthetic numbers are software functionality checks only. Outputs include per-class support/precision/recall/F1, a 4×5 confusion matrix including abstention, coverage/selective error, multiclass Brier score, negative log likelihood and top-label ECE. Absent class support yields null recall; no predicted positives yields null precision. Abstentions count as unrecalled cases; selective error is null when all abstain. Probability diagnostics use all cases before abstention and do not certify calibration.

Emergency diagnostics stay blocked until approved mapping exists. Once mapped, they separately count emergency cases assigned a non-emergency class, abstentions and recall/support. No clinical miss-rate limit or escalation guidance is invented. Its approved-flag unit test is explicitly a fictional software simulation, not clinician sign-off.

`ArtifactRegistry` exclusively writes a research-only JSON receipt with source/label/feature/split metadata, implementation/environment hashes, optional artifact digest and evaluation. It never overwrites, loads weights or enables the live provider. No trained weights or persistent model registration were produced here. Trusted persistence, independent validation, privacy/security review and release authorization remain separate gates.

## Run checks and future training API

Use the existing adapter environment, without installing/upgrading frozen Model A dependencies:

```sh
python -B -m unittest discover -s models/medassist_ai/model_b/tests -t .
```

The future offline entry point is `TrainingPipeline.run(path, manifest, labels, features, governance_root=...)`. It rejects the current provisional schema and synthetic fixtures. There is no auto-training startup hook or default dataset.

Before legitimate training: supply permitted task-matched clinical data; qualified definitions/adjudication and any emergency mapping; reviewed prediction-time features; identity/grouping and rare-class support evidence; immutable group-safe partitions; and prospective evaluation, calibration/abstention, subgroup and safety criteria. NHAMCS ED acuity, Jayanth disease labels, symptom weights and Model A utility are not substitutes. Clinical operation additionally needs independent held-out/external validation and explicit release review. Official Model A test/ledger untouched; no cloud calls, training, UI changes, commits or pushes.
