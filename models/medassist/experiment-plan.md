# MedAssist open-access technical experiment plan

Verified 2026-10-19. This is the experiment specification; subsequent authorized [Phase 1 acquisition/profiling](reports/2026-10-19-phase1/README.md) now supplies actual NHAMCS evidence. No training, inference integration or patient-facing behavior change has occurred. The [machine-readable manifest](open-access-manifest.json) owns exact source versions, URLs, target codes, published counts and artifact metadata; observed hashes belong to the acquisition receipt. Proposed methods below are APIP engineering choices, not publisher recommendations or achieved model results.

**Phase 1 gate:** actual symptom restriction retains 7,657 labelled visits and 70/139 Immediate cases; calibration/threshold partitions contain 10/5 Immediate cases. Review the [split findings](reports/2026-10-19-phase1/split-feasibility.md) and [feature ledger](reports/2026-10-19-phase1/feature-provenance.md) before implementing the model protocol below. No alternative cohort, label merge or calibration procedure has been adopted automatically.

## Research questions and hard boundaries

1. **NHAMCS:** can structured information associated with initial ED presentation predict recorded nursing-triage acuity on held-out survey groups? This is retrospective US ED research. It is not validated home triage, diagnosis, a causal model or proof of applicability to Indian patients.
2. **DDXPlus English:** can a simulated question policy collect symptom/antecedent evidence accurately and economically? Synthetic diagnosis/severity is never converted to NHAMCS acuity or APIP low/medium/high urgency.
3. **MIMIC-IV-ED Demo:** can parsers, joins, units, nulls and feature-denial checks handle a second ED schema? Use only for smoke tests, never training, calibration or performance estimation.

Keep separate dataset IDs, loaders, split manifests, run directories and reports. Do not concatenate cases, pool labels, join people or use synthetic labels to fill NHAMCS missing targets. No research output is displayed as a patient care recommendation. Model planning does not authorize later clinical use.

## Source feasibility, access and permitted use

### NHAMCS 2022 public-use ED

The [CDC gateway](https://www.cdc.gov/nchs/nhamcs/documentation/index.html) links the [268-page codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf), [Stata directory](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/stata/) and [SAS directory](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/sas/). Exact archive URLs are in the manifest; public HEAD requests returned 200. Phase 1 used Stata, avoiding paid SAS software, and records observed bytes/hashes in the [receipt summary](reports/2026-10-19-phase1/acquisition.json).

The [NCHS agreement](https://www.cdc.gov/nchs/policy/data-user-agreement.html) permits statistical analysis/reporting and prohibits identifying people/establishments, identifiable linkage and re-identification-method research. Use signifies agreement. No credential application or fee is needed for these public files. This is not a blanket CC licence or operational clinical-use permission. The [CDC materials policy](https://www.cdc.gov/other/agencymaterials.html) requires attribution/no endorsement and identifies third-party and international copyright exceptions. The codebook's Multum terms (printed pp246–249) are separate; this experiment excludes drug/Multum features and drug-master reuse. Link to the original materials rather than redistributing them under APIP's repository licence.

Feasibility: suitable for a bounded offline recorded-acuity comparison, with substantial selection, timing and label limitations. It cannot supply natural patient conversations or definitive home-care labels.

### DDXPlus English

The [authors' repository](https://github.com/mila-iqia/ddxplus) links the English release. Pin [Figshare article 22687585 version 2](https://figshare.com/articles/dataset/DDXPlus_Dataset_English_/22687585/2), DOI `10.6084/m9.figshare.22687585.v2`. The [official API metadata](https://api.figshare.com/v2/articles/22687585/versions/2) was read directly and confirms CC BY 4.0, file IDs, sizes and publisher MD5s. The web text tool could not render Figshare; the API was verified instead. No patient archives were fetched.

Public downloads need no clinical-data credentials. Preserve attribution, licence link/notices and change indications; do not imply endorsement. Use English `question_en` and English value meanings. Source data are synthetic simulator cases, not observations of real conversations or clinical prevalence. `PATHOLOGY`, `DIFFERENTIAL_DIAGNOSIS` and condition-level `severity` do not supply per-person ED acuity.

### MIMIC-IV-ED Demo v2.2

The [official demo](https://physionet.org/content/mimic-iv-ed-demo/2.2/) explicitly allows public access under [ODbL 1.0](https://physionet.org/content/mimic-iv-ed-demo/view-license/2.2/). This is distinct from credentialed full MIMIC-IV-ED. Preserve attribution/notices; public derivative databases and produced works have applicable share-alike/notice obligations. Content/privacy rights are not waived. The licence must be reviewed before any future redistribution; do not assume the repository licence replaces it.

The demo represents 100 selected patients from one Boston centre. Only `edstays` and `triage` files are proposed for future parser smoke tests. Published SHA-256 values were read from the official checksum file and recorded as publisher digests, not locally verified bytes. No row-level demo data downloaded. Full MIMIC downloads and cross-dataset patient linkage are excluded.

## NHAMCS target and published distribution

Printed codebook p36 defines **IMMEDR**, based on PRF nursing triage: 1 Immediate; 2 Emergent; 3 Urgent; 4 Semi-urgent; 5 Nonurgent. It is not imputed in 2022. It is a recorded clinical workflow target, not an independently adjudicated outcome or necessarily a single uniform triage instrument.

Exclude `-9` blank, `-8` unknown, `0` no triage at this visit and `7` no nursing triage in that emergency service area. Never infer these labels from diagnosis, admission, outcome, LLMs or DDXPlus. Keep them in a separate missing-label audit cohort.

Printed p95 publishes 16,025 records: 139 Immediate, 1,595 Emergent, 5,340 Urgent, 2,826 Semi-urgent and 307 Nonurgent; excluded codes contain 364 blank, 3,788 unknown, 587 no-visit-triage and 1,079 no-ESA-triage records. Thus 10,207 are label-eligible and 5,818 (36.31%, arithmetic from published counts) are excluded. Levels 1–2 contain 1,734 records. These are published marginal counts, not a fresh microdata profile; later source reconciliation is required.

The primary task retains five classes. A separate secondary high-acuity endpoint compares `{1,2}` with `{3,4,5}` and reports level-1 performance independently. Do not silently rename these groups home-care urgency levels. Only 139 level-1 records exist before further filtering, so subgroup and calibration evidence may be sparse.

## Prediction-time and feature contract

The hypothetical prediction point is initial presentation assessment before the triage decision and subsequent investigations. Every candidate needs a provenance/timing ledger. Public-use retrospective abstraction does not prove an exact timestamp ordering: an earlier-concept field is not automatically prospectively available.

**Presentation proxy:** reported/calculated `AGE`, nonimputed recorded `SEX`, and a categorical symptom-only `RFV1`. `AGE=94` is top-coded; `AGE=0` represents under one year. Inspect `AGEFL`/`BDATEFL`; do not use imputed age as observed. Mask imputed `SEX` (`SEXFL=1`) back to unknown, or omit SEX entirely in an ablation. Metadata flags are audit-only, not predictors.

RFV is a coded abstraction, not raw pre-triage text. Use only symptom-module codes (prefix 1 after format-normalized decoding); exclude disease, treatment, test-result, administrative and other modules in the primary proxy. Do not turn excluded modules into a predictive missingness flag. Audit or restrict the symptom cohort separately and publish its new denominator. Do not put full free-text dictionaries or diagnosis labels into the model input. RFV inclusion remains conditional on provenance review; an age/sex-only reference is possible when timing cannot be defended. More detailed RFV codes must be treated as categories, never continuous measurements.

**ED initial-observation comparison:** add only `TEMPF`, `PULSE`, `RESPR`, `BPSYS`, `BPDIAS`, `POPCT`, and `PAINSCALE`, which the codebook identifies as initial observations. Their exact ordering relative to the assigned label is not established by the PUF. If the timing gate cannot be met, describe this as retrospective initial-assessment proxy research and do not claim a strict prospective pre-triage predictor. Never assume a person at home has these measured values. Report a no-vitals ablation separately. `ARREMS` and `SEEN72` are arrival-context sensitivity analyses only; they are not part of the home symptom input.

**Deny by default:** all diagnoses, discharge diagnoses, tests, procedures, medications, treatments, providers seen, disposition/admission/ICU/death/observation, `WAITTIME`, `LOV`, boarding/elapsed outcome times and all after-triage observations (`VITALSD`, `TEMPDF`, `PULSED`, `RESPRD`, `BPSYSD`, `BPDIASD`). Exclude injury recodes derived using diagnoses. Do not backfill initial measurements from later measurements. Exclude label/label transforms, hospital capacity/workflow, payment/geography/calendar in primary models and all survey/record identifiers from X. Unknown columns fail the allowlist check.

**Hidden leakage:** printed p16 states that sex imputation uses diagnosis and triage; race/ethnicity imputation also uses triage, wait time and diagnosis. Exclude imputed `SEX`, `RACER`, `RACERETH`, `ETHIM` from predictors. Race/ethnicity are not primary predictors; original `RACEUN`/`ETHUN` can support retrospective subgroup audits, with missing groups retained. Do not convert imputation-derived attributes into reliable subgroup truth.

## Missingness and survey limitations

Printed p12 reports nonresponse: temperature 5.9%, pulse 6.0%, respiratory rate 5.3%, systolic BP 10.8%, diastolic BP 10.9%, oxygen saturation 6.1% and pain 44.0%. IMMEDR nonresponse is 27.8% among visits to ESAs conducting nursing triage; this denominator differs from all 5,818 excluded records. These rates are for publisher-defined populations, not the future filtered model cohort.

The future profile must recompute each missing/sentinel rate by target, age, sex, survey group and labelled/unlabelled status; tabulate every exclusion and compare included/excluded cohorts. Do not assume missing-at-random or impute missing labels. Decode variable-specific `-9`, `-8`, `-7`, special Doppler codes and units before preprocessing. For fixed-width temperature an implied decimal applies; Stata/SAS may already encode scaling. Confirm the source format before dividing, preserving units. Zero/outlying values require an explicit plausibility audit; do not silently reinterpret every zero or use the published sample range as a physiological rule.

NHAMCS is a three-stage probability sample of US ED visits in nonfederal general/short-stay hospitals, including children; it is not a sample of all illness or care-seeking in India. Records represent visits, not unique longitudinal patients. Nonresponse, care-seeking selection, hospital coding variation, masking and age top-coding limit transportability. The codebook warns against seasonal estimates and notes possible variance understatement.

Keep `PATWT`, `CSTRATM`, `CPSUM`, `HOSPCODE`, `PATCODE` outside predictors. Report both unweighted sample performance and survey-weighted descriptive performance, explicitly limited to the eligible cohort. National estimates require weights and survey-design-aware uncertainty; a weighted percentage alone does not provide that. Masked hospital codes do not correspond perfectly to original hospitals; PATCODE identifies a visit only together with HOSPCODE. Grouping cannot guarantee longitudinal patient independence. Do not identify facilities or link identifiable records.

## Reproducible NHAMCS pipeline and model comparison

1. **Acquisition/profile task, next:** explicitly authorized public download into research storage outside Git/served/app paths; save exact version/URL/time/headers, source terms, SHA-256, archive members and parser versions. Null manifest hashes mean not downloaded. Reject mismatching existing snapshots; never silently refresh. Reconcile target marginals and make an exclusion/missingness/timing report before training.
2. **Split before learning:** seed 42; aim for 60% fit, 10% calibration, 10% threshold selection and 20% locked test. Co-locate masked `(CSTRATM,CPSUM)` groups and connected HOSPCODE overlaps conservatively; audit class support and achieved fractions. Save local row IDs, group assignments, seed and manifest hash. No identities are reconstructed. If rare classes/group counts make the partition unworkable, report the blocker and revise the protocol before fitting; do not replace grouped testing with a flattering random visit split.
3. **Preprocess within training folds:** fixed codebook decoding precedes learning; fit vocabularies, rare-category grouping, imputers, scaling and feature selection on fit folds only. Use the same eligible rows, feature profiles, group folds and evaluation sets for every candidate. Run a majority-prior reference. No synthetic augmentation or oversampling across partitions.
4. **LogisticRegression:** multinomial probabilities with L2-style regularization; median numeric imputation, allowed missing indicators, numeric standardization and one-hot categories with unknown handling. Proposed C values 0.1, 1, 10; bounded convergence checks.
5. **RandomForestClassifier:** same decoded features and fold-fitted category handling; median/indicator preprocessing for a comparable baseline. Proposed 300 trees, max depth 12/unlimited, minimum leaf 5/20; bound CPU/memory. Do not interpret arbitrary RFV codes as ordinal numbers.
6. **HistGradientBoostingClassifier:** bounded native categorical encoding after training-only rare grouping, with cardinality below `max_bins` (255); unknown categories/missing numeric values remain missing. Proposed learning rates 0.05/0.1, 15/31 leaves, 200 iterations and L2 0/1. Set `early_stopping=False` so its automatic random holdout cannot defeat the grouped split. Do not send sparse one-hot matrices into this estimator without an explicit supported representation.
7. **Selection/weighting:** use grouped cross-validation within fit, at most three folds when class support permits; record the same bounded tuning budget. Compare unweighted fitting with fit-normalized PATWT sample weights as declared sensitivity analyses. Class balancing is separate from survey weights; record their combination if used, and calibrate against the held-out prevalence rather than presenting reweighted probabilities as natural risk.
8. **Calibration:** freeze the fitted model; fit sigmoid calibration on the separate calibration partition, without retraining its preprocessing. Isotonic is optional only with sufficient class/event support. Report inability to calibrate rare classes. Freeze all thresholds on the threshold partition. Test remains unopened for selection; pin Python/scikit-learn/numpy/pandas/reader versions in the later implementation environment before training.

References for supported behavior: [LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html), [RandomForestClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html), [HistGradientBoostingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.HistGradientBoostingClassifier.html), [calibration](https://scikit-learn.org/stable/modules/calibration.html). No model has been chosen as the winner or trained.

## Evaluation, uncertainty and release boundary

Report per-class counts/confusion, precision/recall, macro F1 and balanced accuracy. Prioritize level-1 recall and level-1/2 high-acuity recall; also show precision/false-positive load and PR-AUC rather than optimizing ordinary accuracy.

Define multiclass under-triage as predicted numeric class greater than recorded class; report any under-triage and gaps of at least two levels. Define high-acuity miss rate as the fraction of true `{1,2}` cases predicted `{3,4,5}`. A secondary frozen threshold on `p(1)+p(2)` is a research operating point, not a care instruction. Publish denominators and severe misses, not just aggregate scores.

Measure multiclass log loss, explicitly defined multiclass Brier score, class/binary reliability curves and ECE with declared bins/sample counts; compare raw/calibrated probabilities. Show cluster-aware bootstrap confidence intervals, preserving strata/cluster structure; do not treat ordinary IID intervals as survey-correct national uncertainty. Report unstable/sparse groups without superiority claims.

Abstain in research for invalid/missing required inputs, unseen/unsupported categories, out-of-domain inputs or inadequate calibrated certainty; choose thresholds on development only. Report coverage, risk-versus-coverage, abstention rate and high-acuity abstentions. Always report unconditional high-acuity recall as well: abstentions are not counted as correctly detected cases. Selective recall alone must not conceal urgent cases routed to uncertainty. Threshold acceptability needs review, not an invented 95% release target.

Audit age bands (<1, 1–4, 5–17, 18–44, 45–64, 65+), recorded sex, unimputed race/ethnicity with unknown groups, presentation groups and missing-vitals patterns. Publish support, high-acuity misses, calibration and coverage per subgroup. Retrospective audit attributes never enter prediction. All-age intent does not establish paediatric validity; sparse subgroups remain unsupported. No claim of home triage, Indian external validation or clinical safety follows from this study.

## Separate DDXPlus conversation pipeline

Preserve the official train/validation/test split. Check duplicate symptom profiles across splits and co-locate or exclude leakage families using a documented policy; all paraphrases and turn variants stay with their source case. Record exclusions rather than silently changing benchmark denominators.

Parse B/C/M evidence types, defaults, possible values and related-question groups. Start a simulated episode from `INITIAL_EVIDENCE` plus permitted age/sex. The policy sees only already revealed answers. Unrevealed `EVIDENCES` form a simulator oracle; pathology/differential/severity metadata may be offline benchmark annotations but are never exposed to the acting policy or used to manufacture acuity labels. Unasked evidence is unknown; simulator defaults are not evidence that a real patient denied a symptom.

Compare a fixed question order, training-only evidence-frequency order and bounded information-gain questioning over synthetic symptom patterns. Use English questions from metadata with source IDs and review wording separately. Evaluate evidence reconstruction precision/recall, questions per episode, repeated/invalid-question rate, invalid-value handling, unknown/negation fidelity and stop/abstain behavior. Report only synthetic task performance. No LLM-generated transcript or synthetic diagnosis-severity score is independent clinical ground truth.

## MIMIC demo smoke pipeline and handoff

Only verify archive/checksum handling, schema types, stay joins, original complaint preservation, initial measurement units, nulls, rejected diagnosis/disposition/later-vital inputs and patient/stay grouping. Do not train, tune, calibrate or estimate generalization on the demo. A passing smoke test proves parser compatibility only.

Future experiment outputs must include an acquisition receipt, feature-time ledger, exclusion/EDA report, split manifest, configuration/environment lock, model/preprocessor version/checksum, held-out predictions kept private, error/calibration/subgroup report and model card. Phase 1 now supplies acquisition, profiling, leakage assertions, candidate assignments and a pinned Python environment. Model artifacts, predictions, error/calibration reports and model cards do not exist. Review Phase 1 and explicitly freeze a revised support-aware protocol before baseline training; application integration remains outside this research task.
