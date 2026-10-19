# Separate research-only care-urgency label contract v2.1

**Proposed annotation vocabulary only. Not an approved triage rubric, classification algorithm, prescription or patient-facing care pathway.** This contract is independent of DDXPlus diagnosis/differential/condition severity and every NHAMCS IMMEDR label. There is no conversion table or automatic labeller. The executable schema is [urgency-annotation.schema.json](schemas/urgency-annotation.schema.json).

## Vocabulary pending qualified review

- `emergency_evaluation`: proposed category for reviewer-judged emergency evaluation; no trigger or maximum delay is encoded here.
- `prompt_clinician_review`: professional review considered time-sensitive; timing/setting require an independently agreed rubric.
- `routine_clinician_review`: professional evaluation without the proposed prompt/emergency designation; not a guarantee of safety while waiting.
- `general_non_prescriptive_information`: a reviewer-supported information response without an immediate referral conclusion; never automatic reassurance or medication instructions.
- `insufficient_information`: available disclosures cannot yet support a care action; preserve relevant unknowns and potential clarifications. It is not the lowest urgency class.
- `abstain`: the system/reference process cannot responsibly assign an in-scope action (for example unsupported context or unresolved conflicting evidence). It is not a negative or a successful urgent detection.

These meanings are research proposals. No numeric Low/Medium/High mapping, clinical signs, time cutoffs, calibrated probabilities or threshold optimization is introduced. `recommended_care_settings` and optional `maximum_delay_minutes` are separate reviewer annotations, never derived from the label name. Insufficient-information/abstention annotations cannot simultaneously specify a disposition or delay; a future safety escalation action would need its own reviewed representation.

## Storage and review gates

Store annotations separately from interview/model inputs and join only by opaque `record_id` for evaluation. `scope=research_only` and `clinical_use_approved=false` are mandatory even for reviewed references. `reference_status` is one of:

- `unlabelled`: null label, no reviewers/rubric/disposition; the expected state for the current fixture and DDXPlus interviewing corpus.
- `proposed`: an explicit research/fixture proposal, with a stated basis. It does not count as an independent reference in quality reports.
- `independently_reviewed`: a future, separately sourced clinician-authored or real deidentified symptom case, with a rubric version and at least two distinct qualified, model-independent reviewer attestations. Reviewer disagreement requires an adjudication reference; otherwise the reference label must agree with the reviewers. These are structural attestations, not software verification of credentials, consent, medical correctness or independence.

Task 1 refuses to treat DDXPlus or software-fixture records as independent clinical urgency references. It also rejects diagnosis/severity/IMMEDR as annotation bases and does not estimate labels from source fields. Testing fictional reviewer metadata exercises validation only; no reviewer is appointed and no sign-off is claimed. Pregnancy, postpartum, infants/children and older-adult scope each need appropriately qualified review and enough independent cases. Mahesh's pharmacy review can contribute within verified scope; other clinical expertise and institutional requirements remain unresolved.

## Missing data before future urgency-model work

A future study needs permitted symptom narratives and staged answers, explicit negation/onset/duration/change and functional context, relevant voluntarily reported history, reliable age/caregiver/reproductive context, measurement provenance where applicable, and labels defined **at each information state**. It also needs a reviewed urgency/time/setting rubric, independently rated and adjudicated reference cases, source/patient/family separation, representative and rare-warning-sign support, subgroup uncertainty and a new untouched evaluation set.

DDXPlus is synthetic interviewing/diagnostic research data; it does not establish these clinical references, home-care outcomes, real missing-answer behavior, Indian transportability or all-age safety. No actual urgency-label distribution or training feasibility is claimed here. The [Phase 4A study design](../medassist/reports/2026-10-19-phase4a/validation-study.md) remains the broader review framework; the next research specification must be agreed before acquisition, training or evaluation. Application clinical inference stays disabled.
