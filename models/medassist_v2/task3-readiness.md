# Task 3 — official DDXPlus English v2 acquisition and audit

Date: 2026-10-19. Starting commit: 9e625f1290b51a896e9080cc6336bdc71e9363ef. This is synthetic symptom-interview research, separate from the frozen NHAMCS benchmark and the APIP application. No model fitting, LLM, API or clinical inference is part of this task.

**Decision: GO for designing a bounded synthetic adaptive-question experiment; NO-GO for claiming independent official-split evaluation or beginning training before a frozen overlap/default/dependency policy. Clinical urgency training and patient integration remain NO-GO.** Acquisition and full-source audit completed successfully; no filesystem or network blocker remains. Task 4 is a proposal only.

## Actual aggregate results

The [full aggregate output](task3-aggregate.json) records **1,292,579** validated synthetic records in **800.94 seconds**, with zero schema/condition/evidence/CRC failures:

- Original train: **1,025,602**; validation (source validate): **132,448**; test: **134,529**. No memberships regenerated or moved.
- All three partitions contain all **49 synthetic diagnostic classes**, all **223 evidence IDs**, and **96 distinct initial-evidence IDs**. Diagnostic class support ranges from 261–64,368 training rows, 28–8,656 validation rows, and 36–8,743 test rows. Class support is not urgency-label coverage.
- Six required source fields have **zero empty/missing entries** among all records. There are nevertheless **268,358,263 unencoded evidence slots**, not confirmed negative answers. There are **2,775,684 explicitly encoded categorical/multichoice default tokens**; those must not be conflated with absent evidence.
- Source AGE ranges **0–109** in every partition. Training age-band counts: under 1 **16,960**; 1–4 **36,173**; 5–17 **135,004**; 18–64 **685,319**; 65+ **152,146**. Training source SEX counts are M **497,804**, F **527,798**; validation M **64,315**, F **68,133**; test M **65,187**, F **69,342**. All validation/test age-band counts are in the JSON. These generator strata are not representative population sampling or clinical subgroup validation.
- Canonical exact content: **12,314 duplicate groups**, **13,913 extra rows**, **3,551 cross-partition groups**, comprising **7,695 rows**. Pairwise shared groups: train–validation **1,625**, train–test **1,802**, validation–test **172**.
- Eventual interview content, excluding diagnostic references: **14,266 duplicate groups**, **17,324 extra rows**, **3,861 cross-partition groups**, comprising **8,705 rows**. Pairwise shared groups: train–validation **1,788**, train–test **1,965**, validation–test **172**. Pairwise counts are not additive because some groups span all three partitions. No cases were removed or reassigned.
- **32 training-only cases**, **two identical replays per case**, eight questions each: **256 requested answers**, **251 unknown answers**, all stopping at the question budget. Disclosure/allowlist checks passed at every turn. These totals describe one replay per case; replay consistency was checked separately. The high unknown count reflects lexical probing under the conservative oracle, not model performance or a representative estimate of question quality.

All five size/MD5 checks passed and observed SHA-256 values were recorded before audit. The complete streams reverified source hashes, and final verification rechecked all five sources against the acquisition receipt. One mid-run OS sample showed a 47,190,016-byte working set and a reported 46,120 KiB peak so far; final peak memory was not measured.

## Sources, verification and compatibility

Dataset attribution: **Arsene Fansi Tchango, Rishab Goel, Zhi Wen, Julien Martel and Joumana Ghosn**, *DDXPlus Dataset (English)*, DOI 10.6084/m9.figshare.22687585.v2, CC BY 4.0. Names are from the verified publisher metadata. APIP adds schema normalisation, integrity checks and aggregate auditing; the source files are unchanged.

The [official versioned publisher metadata](https://api.figshare.com/v2/articles/22687585/versions/2) was rechecked before acquisition: DOI **10.6084/m9.figshare.22687585.v2**, English version **2**, **CC BY 4.0**, exactly five matching file IDs/names/URLs/sizes/MD5 values. [Dataset landing page](https://figshare.com/articles/dataset/DDXPlus_Dataset_English_/22687585/2), [licence](https://creativecommons.org/licenses/by/4.0/), [author documentation](https://github.com/mila-iqia/ddxplus), [paper](https://arxiv.org/abs/2205.09148). Attribute the DDXPlus authors and source DOI, link the licence and indicate APIP normalisation/audit changes; no endorsement is implied. Public files require no credential or restricted-data agreement. The author documentation describes synthetic patients generated from a proprietary knowledge base and commercial rule-based system; this does not establish access to that underlying system.

The unchanged [Task 1 manifest](dataset-manifest.json) remains the source pin. Its downloaded=false/null SHA fields describe Task 1, not current availability. [Task 3 source receipt](task3-source-verification.json) records actual bytes, publisher MD5 and locally observed SHA-256 for each downloaded file. Publisher metadata UTF-8 SHA-256 also matches the historical observation. MD5/HTTPS/source pinning are integrity checks, not independent cryptographic authentication of the publisher.

All five files were acquired into a newly created, dedicated unsynced local research root outside Git, OneDrive and served directories. No original Phase 1–4A research data was used or written. Private SQLite fingerprints, metadata snapshot and acquisition receipt remain external. ZIPs are streamed without extraction. Do not publish rows, per-case traces, diagnostic references or fingerprints.

Actual archive members are single flat **extensionless CSVs**, named release_train_patients, release_validate_patients and release_test_patients. Expanded sizes are respectively **670,584,506**, **87,371,169**, **88,582,473** bytes; all use deflate and fit the existing safety limits. The exact six-column header appears in a different order from the fictional fixture, which the loader already supports. A narrow archive fix admits the exact partition-specific extensionless basename; unrelated extensionless names, traversal, symlinks, multiple members and expansion limits remain rejected.

Catalogue normalisation and six-field record contracts remain unchanged. Streamed records reuse definitions already validated once per stream; every previous per-record constraint is retained, avoiding revalidation of all 223 definitions for each row. The simulator still validates its own records normally. The full corpus audit establishes complete stream consumption/CRC and checks record/schema/evidence/condition membership; an early sample alone would not establish that.

## Interpretation and remaining gaps

There are **223** metadata evidences: **208 binary, 10 categorical, 5 multichoice**, comprising **110 symptoms and 113 antecedents**. The 49 condition definitions, differential diagnoses and synthetic severity are evaluator-only; severity is never converted to urgency. Required source-field completeness does not mean a full medical history or all 223 answers were observed. Unencoded evidence remains **unknown** under Task 2; explicit encoded default/NA values remain distinguishable from absence. Binary metadata defaults are 0, but are not silently converted into negative patient answers.

Source code_question groups are not automatically a safe adaptive-question graph: 19 entries refer to a different root, with **five distinct referenced roots absent from the evidence catalogue** (E_117, E_122, E_36, E_68, E_85). Freeze a justified dependency/NA/unknown policy before comparing selectors. The current selector catalogue intentionally omits defaults, generation structure and condition-to-evidence maps. It also omits English value_meaning labels; future researcher-facing question rendering needs a reviewed public-metadata mapping rather than making up meanings for opaque V codes.

AGE and SEX are generator fields, not verified self-reported context. Numeric age bands are descriptive source-age strata, not validation of infant, paediatric, older-adult or gender-specific interviewing. AGE zero does not supply age in days/months. One metadata question explicitly asks about pregnancy; no question contains the word postpartum. This limited wording check does not establish coverage of pregnancy, postpartum complications or any population. There is no country/site field proving India relevance, no native free-text symptom narratives, no longitudinal user history and no independently reviewed care-setting/time/urgency labels. None of the proposed research urgency classes has source ground truth.

Exact-content and eventual-interview fingerprints screen obvious duplicate content without source reassignment. Eventual-interview keys comprise AGE, SEX, INITIAL_EVIDENCE and sorted EVIDENCES, excluding diagnoses/differentials. Exact keys additionally include canonical diagnostic references. These are not patient IDs or known generator family IDs: same-source dependence, near duplicates and template families can remain even if exact overlap is zero. All source memberships stay attached to their original archives.

The bounded simulation uses only the first 32 original training rows, eight lexicographically chosen public-catalogue questions and two replays per case. It is a deterministic software probe, not a representative efficacy sample or learned policy. At each turn, detached selector views are allowlisted; answer/history IDs must equal only the initial and already-asked evidence. No oracle, evaluator, source partition or record identity is passed to question selection. Question text is public and can mention a condition; that is distinct from disclosing a case's diagnosis. Existing synthetic noninterference tests vary undisclosed answers/labels and verify identical initial views. This trusted Python API boundary is not a hostile-code sandbox.

## Reproduce without overwriting

From the repository root, set APIP_MEDASSIST_V2_ROOT to a deliberately chosen **new**, absolute, persistent unsynced external directory. Do not substitute a repository, OneDrive or web root. These commands acquire only the pinned public files and require network/write permission:

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python -m models.medassist_v2.acquire --root $env:APIP_MEDASSIST_V2_ROOT
python -W error -m models.medassist_v2.audit --root $env:APIP_MEDASSIST_V2_ROOT --output (Join-Path $env:APIP_MEDASSIST_V2_ROOT 'audit-task3') --sample 32
python -W error -m unittest discover -s models/medassist_v2/tests -v
python -W error -m models.medassist_v2 verify-fixtures
```

Check each exit status; stop on a failure. Acquisition rechecks publisher metadata and refuses existing roots. Partial failures retain .part files for investigation and never publish a success receipt or silently overwrite/re-pin. Audit requires a new child output directory, rechecks receipt SHA-256/publisher pins and preserves source archives. SQLite batches are bounded to 5,000 records with an 8 MiB page-cache setting and file-backed temporary work; disk usage grows with unique fingerprints. These are implementation bounds, not measured whole-process peak-memory guarantees. Only completed aggregate JSON may be copied into Git after publication review.

## Recommended Task 4 design — proposal only

1. Freeze a **synthetic adaptive evidence-collection** task, not diagnosis, urgency or home triage. Define encoded-evidence recovery/question efficiency under the documented unknown policy. Decide whether generator-default simulation merits a separate, explicitly named experiment; do not change Task 2 semantics implicitly.
2. Resolve the five missing group roots, conditional question eligibility, public answer meanings and categorical/multichoice NA semantics. Keep illness maps, diagnosis labels, hidden source answers and future targets outside selector inputs/logs/prompts. Maintain oracle/evaluator capabilities separately.
3. Preserve official partitions. Generate disclosed-prefix training examples only from training rows; fit preprocessing, frequency statistics and any learned selector there. Oracle-derived supervised next-question targets must be held separately from disclosed input features. Never use validation/test answers to build candidate features or question priors.
4. Compare reproducible random-eligible, lexical and train-frequency baselines before a simple disclosed-state ranking model. Select settings on validation only and freeze before one final test evaluation. Predeclare budgets, unknown handling, stopping criteria, seeds and exact train-time information access.
5. Freeze duplicate/dependence handling before outcomes: retain source memberships, report full official-partition results and a separately prespecified overlap-free evaluation stratum if needed; do not move cases between partitions or certify unknown family independence. No test-informed optimisation.
6. Evaluate encoded evidence recovered per question, coverage at fixed budgets, unknown/invalid/repeated-question rates, contradiction handling, answer-type strata and source-age/SEX strata with support and uncertainty. Do not call these clinical accuracy, diagnosis performance or patient benefit. Train-only simulation is not clinical validation.
7. Add adversarial hidden-answer/label noninterference and deterministic replay gates before training. A separate independently reviewed, licensed, task-matched, India-relevant case study remains necessary for urgency/care navigation. No synthetic severity, diagnosis or NHAMCS label mapping is admissible.

Task 3 stops after the audit, focused checks and safe Git sync. Task 4 is not started or automatically authorised by this design.

## Focused verification

`python -W error -m unittest discover -s models/medassist_v2/tests -q` passed **61 tests** (32 foundation, 19 loader/simulator, 10 new acquisition/actual-format/duplicate/probe regressions). `python -W error -m models.medassist_v2 verify-fixtures` passed. `python -m pip check` found no broken requirements. Initial test setup/import/spy/header-order mistakes were corrected before this final pass; they are not unresolved parser failures. No legacy full suite, application build, clinical accuracy evaluation or training was run. [Task 3 verification receipt](task3-verification.json) records scoped files, checks and reproducibility hashes; earlier task receipts remain historical and unchanged.
