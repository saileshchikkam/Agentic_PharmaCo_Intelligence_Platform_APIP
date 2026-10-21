# MedAssist open-access technical experiment plan

Verified 2026-10-19. This is the experiment specification; subsequent authorized [Phase 1 acquisition/profiling](reports/2026-10-19-phase1/README.md) now supplies actual NHAMCS evidence. Subsequent [Phase 3](reports/2026-10-19-phase3/README.md) trained/evaluated the frozen baselines offline; no inference integration or patient-facing behavior changed. The [machine-readable manifest](open-access-manifest.json) owns exact source versions, URLs, target codes, published counts and artifact metadata; observed hashes belong to the acquisition receipt. Proposed methods below are APIP engineering choices, not publisher recommendations or achieved model results.

**Current NHAMCS protocol:** the user-reviewed [Phase 2 baseline freeze](baseline-protocol.md) supersedes the former five-class-primary proposal. Binary high acuity on all 10,207 labelled visits is primary; five-class prediction on 7,657 symptom-coded visits is exploratory. The existing assignments remain fixed. See the [actual preflight](reports/2026-10-19-phase2/README.md) for the offline-only GO decision. Phase 3 has completed offline training/evaluation under that freeze; no patient-facing inference was enabled.

## Research questions and hard boundaries

1. **NHAMCS:** can structured initial ED observations predict recorded binary high acuity on all labelled held-out survey groups, with a separate exploratory five-class symptom-cohort comparison? This is retrospective US ED research. It is not validated home triage, diagnosis, a causal model or proof of applicability to Indian patients.
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

Printed p95 publishes 16,025 records: 139 Immediate, 1,595 Emergent, 5,340 Urgent, 2,826 Semi-urgent and 307 Nonurgent; excluded codes contain 364 blank, 3,788 unknown, 587 no-visit-triage and 1,079 no-ESA-triage records. Thus 10,207 are label-eligible and 5,818 (36.31%, arithmetic from published counts) are excluded. Levels 1–2 contain 1,734 records. Phase 1 subsequently reconciled these marginals exactly against the acquired Stata file; see its dated data-quality report.

The frozen primary task compares `{1,2}` with `{3,4,5}` on all labelled visits and reports level-1 performance independently. The original five classes remain intact for auditing and the separate exploratory symptom-coded task. Do not silently rename these groups home-care urgency levels. Only 139 level-1 records exist before further filtering, so subgroup and calibration evidence may be sparse.

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

## Frozen NHAMCS baseline implementation and evaluation

The [baseline protocol v1](baseline-protocol.md) is the single current source for NHAMCS tasks, fixed profiles, cleaning, matched cohorts, existing split reuse, within-fit grouped CV, model grids, selection, calibration, threshold choice and locked evaluation. Its [JSON settings](baseline-protocol.json) and [digest](baseline-protocol.sha256) freeze machine-readable parameters. Earlier proposed grids/evaluation language is superseded there rather than maintained as a second specification.

The [implemented Phase 2 preflight](research/protocol.py) reads and verifies existing assignments without acquisition or split generation. It supplies feature/target builders and fit-only CV support checks, not model fitting/calibration/inference. The subsequent [Phase 3 runner](research/training.md) executes fitting and one-time testing separately. Phase 1/2 findings remain historical evidence; [Phase 3 reports](reports/2026-10-19-phase3/README.md) own actual results. Clinical review and external validation remain absent.

## Separate DDXPlus conversation pipeline

Preserve the official train/validation/test split. Check duplicate symptom profiles across splits and co-locate or exclude leakage families using a documented policy; all paraphrases and turn variants stay with their source case. Record exclusions rather than silently changing benchmark denominators.

Parse B/C/M evidence types, defaults, possible values and related-question groups. Start a simulated episode from `INITIAL_EVIDENCE` plus permitted age/sex. The policy sees only already revealed answers. Unrevealed `EVIDENCES` form a simulator oracle; pathology/differential/severity metadata may be offline benchmark annotations but are never exposed to the acting policy or used to manufacture acuity labels. Unasked evidence is unknown; simulator defaults are not evidence that a real patient denied a symptom.

Compare a fixed question order, training-only evidence-frequency order and bounded information-gain questioning over synthetic symptom patterns. Use English questions from metadata with source IDs and review wording separately. Evaluate evidence reconstruction precision/recall, questions per episode, repeated/invalid-question rate, invalid-value handling, unknown/negation fidelity and stop/abstain behavior. Report only synthetic task performance. No LLM-generated transcript or synthetic diagnosis-severity score is independent clinical ground truth.

## MIMIC demo smoke pipeline and handoff

Only verify archive/checksum handling, schema types, stay joins, original complaint preservation, initial measurement units, nulls, rejected diagnosis/disposition/later-vital inputs and patient/stay grouping. Do not train, tune, calibrate or estimate generalization on the demo. A passing smoke test proves parser compatibility only.

Future experiment outputs must include an acquisition receipt, feature-time ledger, exclusion/EDA report, split manifest, configuration/environment lock, model/preprocessor version/checksum, held-out predictions kept private, error/calibration/subgroup report and model card. Phase 1 now supplies acquisition, profiling, leakage assertions, candidate assignments and a pinned Python environment. Phase 3 now supplies private fitted artifacts/predictions and safe aggregate error/calibration reports/model cards. The frozen protocol and opened-test boundary are preserved; review findings and obtain independent validation before defining another study. Application integration remains excluded.
