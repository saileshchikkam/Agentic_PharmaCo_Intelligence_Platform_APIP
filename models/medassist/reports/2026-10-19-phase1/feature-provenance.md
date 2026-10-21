# NHAMCS feature provenance and leakage

See the [machine-readable ledger](feature-provenance.json), [column inventory](column-inventory.json) and [implementation](../../research/data.py). Approval here means an implemented **offline research allowlist**, not clinical approval or proof of prediction-time availability.

## Accepted research matrices

- `demographic_reference`: AGE and nonimputed SEX; **10,207** labelled visits. This is a descriptive/reference baseline, not a sufficient symptom assessment.
- `presentation_symptom_proxy`: AGE, nonimputed SEX and symptom-only RFV1; **7,657** labelled visits.
- `ed_initial_symptom_proxy`: the same cohort/three columns plus TEMPF, PULSE, RESPR, BPSYS, BPDIAS, POPCT and PAINSCALE; **7,657** visits, ten columns.

AGE requires AGEFL in `{0,1}` and BDATEFL=0; unknown or ambiguous provenance stays missing. SEX requires SEXFL=0. Explicitly diagnosis-informed demographic imputations must not enter X. RFV1 is categorical, retaining only integral raw codes 10000–19999 (symptom module). It is a coded encounter abstraction, not a directly available home text field. No language-to-code mapper is implemented or validated.

Initial ED measurements may be available during presentation but lack a proven exact timestamp before IMMEDR assignment. They are **retrospective proxies only**. A home user may lack devices, clinician measurements and valid pain scoring. The implementation therefore marks timing unestablished and prospective/home-triage profiles unapproved. Initial-only names are necessary but insufficient proof of absence of temporal leakage.

## Denied from X

Target/derivatives; discharge diagnoses; tests/procedures/treatment/medicines; providers seen; admission/disposition/ICU/death/observation; waiting/visit/boarding durations; after-triage vitals (`VITALSD`, `TEMPDF`, `PULSED`, `RESPRD`, `BPSYSD`, `BPDIASD`); diagnosis-derived injury recodes; target-informed imputations; survey weights and patient/hospital/design identifiers. All other source columns are denied by default.

ARREMS and SEEN72 remain audit-only/sensitivity candidates, absent from the three primary matrices. AGEFL/BDATEFL/SEXFL serve provenance checks only. RACEUN/ETHUN and additional RFV fields remain audit-only; their availability does not authorize input expansion. CSTRATM/CPSUM/HOSPCODE form split groups; PATCODE/PATWT are retained outside X for research administration/declared weighted analyses. No identities are reconstructed.

The raw loader intentionally reads the complete public-use source for inventory/audit. The feature builder selects fixed columns and rejects extra requested features; the matrix validator rejects injected, missing or reordered columns. An allowed raw source field cannot silently become a predictor. No scaling, imputation, category learning, feature selection or model fitting occurs in Phase 1.

## Blockers and review decisions needed

1. Establish permissible timing or retain the retrospective-only interpretation; do not call this a prospective home-feature set.
2. Review the six AGEFL=0/BDATEFL=1 records' provenance without reconstructing identities; current quarantine remains.
3. Review zero/extreme vital-sign treatment before defining training transforms.
4. Decide whether the symptom-module restriction is defensible given loss of 69 Immediate cases. Consider a separately specified all-labelled initial-vitals profile without RFV; it is **not** currently implemented/approved.
5. Compare with/without vitals on identical rows and partitions. Comparing the full demographic cohort against the symptom-restricted cohort cannot isolate a feature effect.
6. Preserve a later training-only preprocessing boundary. A new profile or target needs an explicit protocol update, not an ad hoc matrix change.
