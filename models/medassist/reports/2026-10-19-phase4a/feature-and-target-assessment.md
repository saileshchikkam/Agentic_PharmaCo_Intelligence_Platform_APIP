# Feature availability and target suitability

## Prediction-time contract for a future conversation

The intended time is **before professional assessment**, at each patient disclosure. Only information actually supplied so far may enter an assessment. Missing, declined, unknown, contradictory and not-yet-asked are distinct states. A model must not infer that an unanswered danger-sign question means absence. The following is a research input ledger, not an approved care algorithm.

| Information class | Examples and available provenance | Research consequence |
| --- | --- | --- |
| Home-reportable symptoms | Patient's own words, onset, duration, change, functional impact, reported pain | Appropriate prospective conversation inputs; these are not NHAMCS RFV codes or independently observed signs. Preserve source text and uncertainty. |
| Patient-reported context | Age/date of birth, caregiver role, pregnancy where relevant and voluntarily shared, prior conditions, surgery, medicines, allergies | Available only when supplied/confirmed and shared with MedAssist. Record source/time; account history may be stale. Survey SEX and current gender/context are not interchangeable. |
| Optional home measurements | Temperature, pulse, respiratory count, oximeter reading, cuff BP | Record unit, time, method/device, repeated/disputed value and who measured it. Absence must be supported. ED-measured distributions do not establish accuracy or availability at home. Never require devices as an unstated eligibility condition. |
| Hospital-observed inputs | NHAMCS initial vital measurements and staff-assessed pain | Available during an ED workflow; not guaranteed before ED triage or reproducible remotely. Do not substitute post-treatment or later measurements. |
| Retrospective coding | RFV1, RFV2–5; diagnosis codes; imputed fields/flags | RFV records a coded reason for visit, not raw conversational language. Diagnosis/treatment/disposition stay excluded; audit/provenance flags cannot leak into predictors. |
| Uncertain timing | “Initial” vital collection relative to nursing triage; when the RFV abstraction was finalized | No established precise pre-label availability. The no-RFV profile reduces coding dependence, but does not resolve vital timing. Record as unresolved, not verified leakage-free clinical inputs. |

The [CDC 2022 codebook](https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/doc22-ed-508.pdf), printed pages 36–37, defines initial measurements, RFV fields and IMMEDR. IMMEDR is the unimputed nursing-triage item, with 1 Immediate, 2 Emergent, 3 Urgent, 4 Semi-urgent, 5 Nonurgent; other encodings are not five-class targets. The codebook warns of collection/processing changes across years. Site-specific clinical agreement is not established by these codes. “Initial” alone does not prove input availability before the label. The frozen masks, including zero measurements, Doppler encodings and demographic quarantine, remain unchanged.

## Why ED IMMEDR does not validate MedAssist care navigation

NHAMCS observes people who **already reached US emergency departments**. It does not sample community members choosing among self-care, primary care, a specialist and emergency services. IMMEDR describes ED immediacy, not an independently adjudicated home disposition, eventual disease severity, treatment benefit or harm from delay. The binary research endpoint combines levels 1/2 for support; a level-3 ED visit is a negative in that experiment, not a low-risk person who may safely remain home.

The labelled cohort omits 5,818/16,025 visits with unknown/blank/no-triage/no-nursing-triage encodings. Nursing-triage availability and missingness can select both patients and sites. RFV symptom restriction loses about half the Immediate cases. Masked survey design, unidentifiable repeat patients, imputation provenance and rare subgroups limit certainty. Additional vitals may proxy documentation practices. Low binary recall, false positives or five-class errors cannot establish appropriate home actions either way.

Therefore there is **no automatic 1–5 to Low/Medium/High/Very High mapping**, nor a binary probability-to-navigation rule. A new task needs separately reviewed labels specifying information sufficiency, acceptable urgency/time ranges, acceptable care settings, and uncertainty. Geography, transport availability, language/health literacy, paediatric and pregnancy contexts require independent assessment. The future all-age product intent is not demonstrated coverage. Current English-only, no-paid-service development remains feasible for software fixtures; that does not supply a clinical reference standard.
