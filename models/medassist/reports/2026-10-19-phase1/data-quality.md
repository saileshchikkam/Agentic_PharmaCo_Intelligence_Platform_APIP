# NHAMCS 2022 — actual data quality

Computed from the verified Stata member, 2026-10-19. [Full aggregate results](data-quality.json) contain per-target missingness and cohort denominators; [receipt](acquisition.json) identifies exact bytes/parser. No target labels were imputed or forced to match reference counts.

## Target reconciliation

Raw numeric `IMMEDR` and Stata value labels are kept separately. Actual counts exactly match the codebook:

- 1 Immediate: **139**.
- 2 Emergent: **1,595**.
- 3 Urgent: **5,340**.
- 4 Semi-urgent: **2,826**.
- 5 Nonurgent: **307**.
- -9 Blank: **364**; -8 Unknown: **3,788**; 0 No triage this visit: **587**; 7 No nursing triage in ESA: **1,079**.

Total **16,025**; eligible classes 1–5 **10,207**; excluded **5,818** (36.31%). High acuity `{1,2}` has **1,734** eligible visits. Largest/smallest valid-class ratio is **38.42:1** (Urgent/Immediate). Unlabelled/no-triage records remain separate audit cohorts, never pseudo-labelled examples. Unexpected target codes stop processing.

## Candidate missingness

All-source denominator is 16,025 visits. Blank/unknown/not-applicable/refused/system-missing are audited separately before masking; Doppler code 998 is unusable as numeric PULSE/BPDIAS. The selected raw fields have no system NaN in this file; numeric sentinel missingness is substantial.

- AGE: **8** unusable under the conservative provenance rule; SEX: **22** publisher-imputed values masked.
- RFV1: **25** blank (0.16%); a recorded RFV1 outside the symptom module is a cohort exclusion, not a missing symptom.
- TEMPF: **937** (5.85%); PULSE: **1,053** (6.57%); RESPR: **856** (5.34%).
- BPSYS: **1,722** (10.75%); BPDIAS: **1,754** (10.95%); POPCT: **969** (6.05%).
- PAINSCALE: **7,055** (44.03%): 780 blank plus 6,275 unknown.
- Audit-only ARREMS: **495** (3.09%); SEEN72: **1,717** (10.71%).

The published pulse nonresponse percentage rounds 965 blanks to 6.0%; the numeric-analysis unusable count also includes **88 Doppler codes**, hence 6.57%. This is a different definition, not a discrepancy in the source. BPDIAS has one additional Doppler code. Raw TEMPF stores Fahrenheit tenths (e.g. 986); sentinel masking precedes division by ten. Values must not be scaled twice.

AGEFL explicitly flags two ages with -9; BDATEFL flags eight imputed birth dates. Six records have AGEFL=0 and BDATEFL=1. The pipeline conservatively quarantines all eight from age inputs; it does **not** claim eight proven imputed ages. These flags need review before changing that policy. SEX is the source's recorded sex, not a proxy for gender identity.

Zero vitals are retained and flagged, not silently converted to missing: PULSE 2, RESPR 2, BPSYS 1, BPDIAS 1, POPCT 13, PAINSCALE 2,842. Zero pain can be meaningful; questionable other measurements need explicit domain review. No physiological cutoffs were invented and no imputation was fitted.

## Population and selection

All-source age counts after provenance masking: <1 **428**; 1–4 **1,057**; 5–17 **1,942**; 18–44 **5,673**; 45–64 **3,699**; 65+ **3,218**; unknown/quarantined **8**. Age is year-coded/top-coded and these are descriptive bands, not proven paediatric coverage. Median usable age is 38 overall, 40 labelled and 36 excluded.

All seven initial vitals are recorded for **7,930/16,025**; six excluding pain for **13,079/16,025**. Labelled visits have all seven in **6,529/10,207 (63.97%)**, versus **1,401/5,818 (24.08%)** excluded. Six excluding pain are recorded in 8,865 labelled and 4,214 excluded visits. Different target availability and measurement patterns can bias modelling; complete-case deletion would add selection bias. Per-class and per-cohort details remain in the JSON.

The symptom-only RFV1 cohort contains **7,657** eligible visits, dropping **2,550** otherwise labelled visits and **69/139 Immediate** visits. Codes outside the first symptom module include disease, diagnostic/screening, treatment and other reasons; they cannot be reintroduced as symptoms simply to improve model scores.

These are unweighted sample counts. NHAMCS samples US hospital ED visits with a complex survey design, not longitudinal patients, all home symptoms or Indian care-seeking. Target nonresponse, masking, initial-measurement timing, age top-coding and hospital variation remain limitations. Survey weights are retained outside feature matrices for later declared analyses; no national prevalence, incidence, clinical accuracy or transportability was estimated.
