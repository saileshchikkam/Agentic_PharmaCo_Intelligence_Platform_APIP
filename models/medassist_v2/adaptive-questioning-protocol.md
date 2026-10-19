# MedAssist v2 — frozen adaptive-questioning protocol v1

**Task 3.5, 2026-10-19. Decision: GO for this restricted offline synthetic evidence-collection protocol.** No model is trained. Future training requires separately authorised implementation, reference-function parity, verified sources/memberships and the pre-fit gates below. Clinical use remains NO-GO.

Authoritative settings: [frozen JSON](adaptive-questioning-protocol.json), [SHA-256](adaptive-questioning-protocol.sha256), [pure integrity/semantic references](questioning_protocol.py), [focused tests](tests/test_questioning_protocol.py). A change to the JSON invalidates its checksum; changing scope, labels, masking, sampling, budgets, model grid or outcome rules requires a new protocol version and explicit review, never an overwritten v1 after test access. [Verification receipt](task35-verification.json) records actual checks and files. The protocol is a research specification, not a trained model, training runner, clinician-approved questionnaire or deployed selector.

## Task, source and scope

Recover **useful explicitly encoded evidence IDs** through staged questions using only previously disclosed state. “Useful” means **synthetic nondefault encoded content**, not clinical importance, symptom severity, diagnosis or patient benefit. One B=true, one C value not typed-equal to its publisher default, or an M set containing at least one nondefault value earns one unit for that evidence ID. The initial disclosed evidence is free and excluded from recovery numerators/denominators. Multiple M tokens do not earn multiple question units.

Use exactly the five [Task 3 verified files](task3-source-verification.json), DOI 10.6084/m9.figshare.22687585.v2, CC BY 4.0; keep the [original manifest](dataset-manifest.json), official memberships and original files unchanged. Source sizes/MD5/SHA-256 and manifest digest are pinned in JSON. Source authors, licence and attribution/change notice are in [Task 3 readiness](task3-readiness.md). [Author documentation at the inspected revision](https://github.com/mila-iqia/ddxplus/blob/4f5ec677099ef99f7cc1dc0bfe2378bb29a29bda/README.md) describes related evidence through code_question and generation defaults. This protocol adopts a conservative **collection** interpretation rather than reconstructing the proprietary generator or reproducing its published diagnostic benchmark. The README UTF-8 digest is pinned. An inspected upstream BASD dataset module did not define code_question/default_value resolution; it does not establish missing parent meanings.

Task 3 found 1,025,602 train / 132,448 validation / 134,529 test records; 3,861 eventual-interview groups crossed source partitions. These are historical **full-source** observations, not the new active-profile overlap counts. Task 3.5 reads only verified evidence metadata, the cached aggregate report and source receipts; **no new full-corpus scan or new overlap count is claimed**.

## Answer semantics and the five unresolved roots

- **Absent evidence is UNKNOWN with null value**, never false, negative, normal or a publisher default. An asked unknown remains asked; do not ask it again.
- B: only a bare encoded evidence token supplies true. A separately scripted false is distinct from unknown, but no false answer is synthesised from source absence.
- C: reveal one exact typed source value. Numeric 0 and explicit NA/default codes remain confirmed values, not null. They earn zero nondefault utility but remain features and count toward all-encoded coverage.
- M: one question reveals the entire encoded typed set, including any explicit default/NA member. Preserve a mixed default/nondefault set literally; do not interpret it as a clinical contradiction, delete its default or infer unlisted options are negative. An explicit empty set is confirmed and distinct from UNKNOWN, with zero utility. The source adapter does not invent empty answers when no token was encoded.
- An unresolved **history contradiction** stops the trajectory and preserves both observations; no automatic resolution or additional oracle fetch. Mixed M tokens alone are not such a history contradiction.

Actual metadata references, inspected under the pinned evidence SHA-256:

- **E_69 → missing E_68**: binary antecedent; public wording asks about diabetes.
- **E_37 → missing E_36**: binary antecedent; public wording asks about metastatic cancer.
- **E_118 → missing E_117**: binary antecedent; public wording asks about past pneumonia.
- **E_123 → missing E_122**: binary antecedent; public wording asks about COPD.
- **E_87 → missing E_85**: binary antecedent; public wording asks about family history of asthma.

Each missing root has exactly one referencing entry. All five children have their own definition, but the root definitions and activation meanings are absent. Similar wording does not establish an alias or replacement parent. **Quarantine all five children globally**: they are never eligible, never training candidates, excluded from v1 recovery denominators, and retained unchanged in external source/oracle records. Report their encoded counts separately during future execution. Do not fabricate the five parents or promote the children to unconditional roots. This declared scope restriction makes the **218-question** task defensible without claiming the semantic defect was repaired. It is not a complete 223-question benchmark.

Fourteen other children have existing binary parents, pinned exactly in JSON: E_54–E_59 depend on E_53; E_130–E_136 depend on E_129; E_152 depends on E_151. A self-root is eligible when unasked. A child becomes eligible only after its parent is explicitly **confirmed boolean true** in the disclosed state. Unasked, UNKNOWN, false or conflicting parents block it. Any changed graph, parent type, source hash, unsupported chain or unexpected initial question fails preflight; do not invent a fallback. No raw oracle answer is inspected to compute an eligibility mask.

Encoded useful children with unknown/missing activation can be unreachable. Retain them in the active useful-content denominator and report unreachable content separately; do not silently drop hard cases or claim 100% recovery is always attainable. Initial evidence must be the original in-scope symptom; unsupported/quarantined initials fail execution with a recorded source-gate error.

## Information boundary

The harness explicitly discloses original source AGE and SEX at setup, plus only INITIAL_EVIDENCE. AGE zero is valid; SEX is the generator's M/F construct, not gender identity or pregnancy. This is one fixed research-context profile, not consent or data sharing in the APIP app. No optional hidden-profile variant is tuned in v1.

Selectors receive detached Task 2 allowlisted views only. Model inputs are the initial ID, disclosed source context, already disclosed answer states/typed values, asked IDs/turns, candidate ID/type and an eligibility mask computed from public metadata plus disclosed state. **Kind is omitted from model tokens** because the existing selector view does not expose it; do not infer it from an ID. Exact feature token grammar is the compact JSON-array strings returned by feature_tokens, followed by the fixed FeatureHasher settings in JSON. Unknown states have no value token; confirmed numeric/default/false/empty values remain distinct. An M answer supplies a state token and one value token per disclosed member.

Full EVIDENCES and next-question utility targets belong only to the training oracle/evaluator. PATHOLOGY and DIFFERENTIAL_DIAGNOSIS remain evaluator-only; diagnoses, synthetic severity, condition-to-evidence maps, urgency/NHAMCS labels, hidden/future answers and source/case/group/partition identities must never enter features, policy prompts, logs, masks or RAG. There are no LLMs/prompts/RAG in this experiment. Sampled candidate lists must not depend on hidden utility labels.

**Randomness is also an information path.** Policy RNG and candidate subsampling are seeded from a canonical digest of **disclosed transcript only** (initial/context/asked order/current ID-state-values/contradictions), with fixed phase/policy/turn salts. They never use a full-case/oracle fingerprint, row ordinal, label or partition. Consequently, identical disclosed views with different hidden answers produce identical masks, random choices, sampled candidates and feature tokens. Governance fingerprints below are separate capabilities and never go to selectors.

## Partitions, fingerprints and overlap

Preserve official train/validate/test membership; validation is only the normalized name for validate. The new **active-interview-v1** fingerprint is SHA-256 of the exact canonical projection implemented by active_fingerprint: profile name, AGE cast to float, SEX, INITIAL_EVIDENCE, and sorted active ID/typed-answer pairs. M member order is canonicalized by typed JSON. Keep explicit default/NA values, remove only the five quarantined IDs, and exclude all diagnoses/differentials. Canonical JSON is sorted-key, compact, ASCII-escaped UTF-8 with nonfinite numbers forbidden. This differs from the Task 3 all-evidence fingerprint; do not reuse its counts as active-profile counts.

A future single necessary preprocessing pass seals an **external training-only fingerprint dictionary** before validation/test outcomes. Deduplicate fitting examples by active fingerprint using the earliest source ordinal as representative, while preserving every original row/source assignment in the underlying files and full reports. No cross-partition row movement is permitted.

Report two views from the **same cached trajectories**:

1. **Full original partition:** all official source rows, including overlap/duplicates, with an explicit dependence warning.
2. **Training-overlap-excluded sensitivity:** validation/test rows whose active fingerprint is absent from the sealed training dictionary. No exclusion depends on model results, diagnosis, age, utility outcome or test performance. Keep counts/reasons external and publish aggregates only. No new v1 counts exist yet.

Validation/test overlap not shared with training remains in this sensitivity analysis. The rule deliberately does not create a validation-derived training reference or outcome-dependent test exclusion. Report residual validation–test overlap descriptively, with no independence claim. Fingerprints cannot establish absent template, generator-family, site or clinical dependence. Full-source results are not replaced by the sensitivity results.

## Training-only prefixes and resource limits

Future fitting uses at most **4,096 unique training active-fingerprint groups**, ordered by SHA256(1729|fit|fingerprint); the earliest source row represents each group. Governance sampling is label/outcome-independent and its private membership map is sealed; its keys are not model inputs.

Generate two eligible-question trajectories per fitting case, in JSON order: random-eligible and lexical. Both begin with only initial evidence and explicit source context. Run to at most 20 questions, saving prefixes **before questions at turns 0, 2, 5, 10**, only if the trajectory reached that turn. A prefix has at most 32 eligible candidates selected by the frozen disclosed-transcript hash order, without inspecting utility targets. Retain zero-positive prefixes. Never sample a positive candidate from the hidden oracle merely to ensure a target, stop when all hidden useful evidence is recovered, pad oracle-dependent trajectory lengths or build prefixes from validation/test.

Oracle target for each sampled eligible candidate: 1 if explicitly encoded nondefault content is obtainable for that ID, otherwise 0. **Zero is a collection-utility target, not a negative clinical answer**; unknown/default answers retain their original state. Class counts, targets and full oracle references remain external and separate from feature matrices. Abort future fitting if both target classes are not supported globally.

Maximum 32,768 saved prefixes and 1,048,576 candidate pairs per pass; stream batches of 2,048 pairs. Fixed order: sampled cases, declared policy order, saved turn, candidate hash/ID order. Do not materialise a dense corpus or all candidate-state combinations. Dataset lookup/reference hashes may require one future source pass; Task 3.5 does not execute it. Memory/runtime of actual training are unmeasured; 16 GB suitability is an engineering design constraint, not a measured benchmark or speed promise.

## Baselines, model and stopping

Predeclared baselines: **lexical** smallest eligible ID; **random-eligible** uniform index into sorted eligible IDs using the exact SHA-seeded random.Random rule; **training-frequency** descending useful-encoded frequency from the same capped training representatives, with lexical ties. No validation/test frequency statistics enter priors.

One lightweight model family: **pointwise logistic SGDClassifier**, ranking candidates by its utility score; l2 alpha grid **1e-5, 1e-4, 1e-3**, three streaming partial_fit passes, average=true, shuffle=false, classes [0,1], one thread, seed 1729, no class weighting, calibration or early stopping. Exact settings and **65,536-column float32 FeatureHasher** are in JSON; API references are the official [SGDClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.SGDClassifier.html) and [FeatureHasher](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.FeatureHasher.html) documentation, inspected as version 1.9.1. No learned vocabulary, imputation/scaling, pretrained embeddings or LLM is used. Hash collisions are a limitation. Streaming/score caching optimisations must preserve the reference token/mask math and pass parity tests before execution.

Evaluate fixed budgets **5, 10, 20**, one cost per question ID, including M. Initial evidence costs zero. There is no learned stop/score threshold: continue to 20 if questions remain eligible. Other stops are no eligible question, unresolved contradiction, or invalid/repeated/ineligible policy output. Preserve the last valid state and count failed trajectories; no hidden retry, oracle-based completion stop or silent fallback. Unknown alone does not stop. Nonfinite scores/fits abort execution before a valid campaign is claimed.

## Selection, test lock and reporting

Model selection uses at most 4,096 unique **non-training-overlap validation** groups, ordered by SHA256(1729|select|active fingerprint), with earliest-source representatives. This prespecified validation sample is not fitting data. Rank the three configurations by **macro useful recall@20** among positive-denominator cases; ties within 1e-12 use recall@10, useful yield@20, then larger alpha. No test outcome participates. Abort selection if references/memberships cannot be verified or no supported positive-denominator cases exist. Retain the selected training-only estimator; do not refit on validation or expand its fitting cohort.

Before test policy execution, seal source/protocol/reference/membership/prefix/feature/model/frequency hashes, all validation scores, selected alpha, masks, versions, warnings and failures in an external immutable pre-test manifest. Test outcome files must not already exist; future runners must reject an opened campaign rather than overwrite/retry it silently. One final locked campaign evaluates the **three baselines and selected ranker** on the original test partition. Candidate grid models never run on test. Full/sensitivity/subgroup/uncertainty reports are derived from the same private cached trajectories, not repeat evaluations or test-informed tuning.

Report macro and micro useful recall at all budgets, useful yield per actual question, all-encoded coverage including defaults, unknown/default/invalid/repeat rates, actual cost and stops, and mean useful-recall curve over turns 1–20. Carry the final state after early stops to subsequent budgets. Useful denominator is all active useful IDs excluding initial, including unreachable content; all-encoded denominator also includes explicit defaults. Zero useful denominators have null recall, are counted/excluded from macro recall, and remain in cost/unknown/failure metrics. Do not replace undefined rates with zero or drop policy failures.

Synthetic subgroup support: source age under 1 / 1–4 / 5–17 / 18–64 / 65+ / unknown, source SEX M/F/unknown, B/C/M questions, and oracle unencoded-active fraction [0,.90), [.90,.95), [.95,1]. That fraction is evaluator-only: 1 minus encoded active IDs/218. Per-type reporting includes asked questions, supporting interviews and useful-denominator support. Always report n; suppress rates/intervals below 50 cases or 20 positive-denominator cases. Post-run observed unknown rates are descriptive, not future-aware model inputs. Age zero provides no infant day/month resolution; SEX supplies no inferred reproductive context.

Use 1,000 paired percentile cluster-bootstrap replicates, seed **2718**, sampling active-fingerprint clusters with replacement and retaining original row multiplicity within each selected cluster; report 2.5/97.5 percentiles, full and sensitivity separately. Freeze identical resamples across policies; undefined resample metrics remain null with valid-replicate counts, never zero. Compute percentiles only from defined replicates and suppress intervals below 950 valid replicates. Do not claim this captures unknown generator-family dependence or clinical uncertainty. Diagnosis labels may supply aggregate descriptive support only, never ranking or urgency truth.

## Verification and next gate

Observed environment pins: Python 3.12.2, scikit-learn 1.9.1, NumPy 2.2.2, SciPy 1.16.1, jsonschema 4.23.0. No dependency/environment was installed or changed. Future execution must verify the pinned external environment and record platform/BLAS/thread details; numerical equivalence across machines is not guaranteed merely by matching versions. This protocol pins algorithm/data/seeds; future artifact hashes pin actual fitted results.

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python -W error -m models.medassist_v2.questioning_protocol
python -W error -m models.medassist_v2.questioning_protocol --root $env:APIP_MEDASSIST_V2_ROOT
python -W error -m unittest models.medassist_v2.tests.test_questioning_protocol -v
```

The optional root command reads only the existing 120,263-byte evidence metadata, verifies publisher MD5/local SHA and exact graph/default constraints, and creates no files. It does not re-read the patient archives. Tests use authored fictional records, never clinical accuracy evidence.

Actual Task 3.5 checks: **19 focused tests passed**; checksum-only and external-metadata validation commands passed (223 definitions, 218 active, 14 known dependencies, five quarantined). No full v2/legacy suite, training, model evaluation, application build or corpus rescan ran. Reference parity is checked for pure mask/RNG/feature/fingerprint semantics; no future training runner or actual performance is claimed.

**No unresolved semantics are filled in to obtain GO.** Missing parent meanings remain unknown and the five children remain explicitly out of scope. Extending to them, interpreting source defaults as real negatives, defining medical usefulness, claiming fully independent data, or predicting urgency requires new evidence and a different approved task. The restricted computational task above can be frozen now; implementation parity, all source hashes/memberships, sealed training-only reference and label/support gates must still pass before separately authorised training. Any incomplete/failed required alpha experiment blocks pre-test sealing; no replacement grid/family or test access is allowed. The existing Task 2 simulator is unchanged and does not itself enforce the new mask: future runners must enforce it and pass reference parity tests. India-specific, all-age and real clinical validation remain absent. No APIP/NHAMCS/ADR behavior is changed. Stop after this protocol task.
