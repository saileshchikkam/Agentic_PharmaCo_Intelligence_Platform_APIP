# MedAssist AI

**Status:** English-only guided symptom intake, editable review, optional local-model quote selection, and a Google Maps search handoff are implemented for fictional evaluation. Custom urgency ML, adaptive clinical questioning, approved RAG guidance, tailored precautions, and clinical evaluation remain pending. Jayanth originated this part of APIP. See the [implementation/API guide](../../src/features/medassist/README.md).

## Responsibility

Provide an understandable conversation about symptoms/context and help a person find an appropriate care destination. Education and navigation must not promise a diagnosis, cure, prescription, or medicine/dose change.

## Intended journey

1. Gather relevant context with reviewed questions.
2. Assess urgency as low, medium, or high, with an explicit uncertain/insufficient-information outcome. These are the user's intended clinical categories, not implemented predictions.
3. Provide reviewed educational information and care-navigation guidance.
4. Request location permission or accept manual location; show relevant facilities and a user-selected navigation route.
5. Offer deliberate reuse of confirmed episode information in a later ADR report.

Urgent-care interruptions must also be available in reporting. Do not require a lengthy interview, map selection, or report animation before displaying reviewed urgent guidance.

## Model research

The current `#/preview/medassist` flow asks fixed questions about concern, duration, activity impact, and changes, retaining exact user statements and null unknowns. Only after explicit fictional-case consent does a local Ollama model select source quotes for user confirmation. Answers remain in page memory; no urgency model, clinical RAG, hosted inference, training, or clinical conclusion is connected. Care search is available throughout, with manual location or deliberately requested geolocation and an external Google Maps link. A two-day target cannot establish clinical effectiveness or authorize real-patient use.

A custom model trained from scratch is an aspiration, not a selected algorithm. Define a bounded task, permitted dataset, clinically meaningful labels, baseline, and held-out evaluation before training. ADR reports do not automatically provide valid medical-urgency labels.

Separate training from live care guidance. Record per-class errors, urgent-case misses, calibration, dataset coverage, and uncertainty. Synthetic cases can exercise software, not establish clinical effectiveness. If evidence/review is inadequate, keep model-driven urgency disabled and document the gap.

See the [custom ML implementation sequence](../ai-implementation.md#custom-ml-from-scratch) for task/label definition, permitted data, leakage-safe splits, baseline/candidate training, language-specific evaluation, and packaging. English/Telugu fictional-case scope does not itself supply clinical training data.

Pharmacovigilance data and MedAssist symptom guidance are different tasks. Public openFDA FAERS records can support bounded ADR data-processing and descriptive pharmacovigilance experiments; FDA says spontaneous reports are not scientifically verified for cause and effect and cannot estimate incidence. WHO-UMC's public VigiAccess gives aggregated statistics. Case-level VigiBase access requires an access request, review, and use conditions. These datasets do not by themselves provide clinician-reviewed symptom-to-urgency labels. This is an engineering inference from their published scope and access rules. See [openFDA limitations](https://open.fda.gov/apis/drug/event/) and the [WHO-UMC VigiBase FAQ](https://who-umc.org/vigibase-data-access/vigibase-faq/).

Kaggle is a hosting platform, not a blanket reuse licence. Audit each candidate's exact dataset page, upstream source, licence, intended-use restrictions, label definitions, language, and provenance before downloading or training; Kaggle's [dataset guidance](https://www.kaggle.com/docs/datasets) exposes a per-dataset licence field, and its [licence disclaimer](https://www.kaggle.com/page/license-disclaimer) says the user must check the actual terms.

Before any real-patient pilot, the institution must determine intended use, data permissions, privacy/security conditions, reviewer responsibilities, and applicable regulatory requirements. CDSCO's [2026 Medical Device Software guidance under MDR-2017](https://www.cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/Guidance-document-on-Medical-Device-Software-under-MDR-2017.pdf) defines scope by intended medical purpose; APIP's status is not determined here. WHO calls for healthcare-provider, patient, and other stakeholder engagement and oversight through development and deployment ([WHO guidance](https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models)).

## Navigation and data boundaries

Show the basis for facility results: location, relevant listed services, and available travel information. Ratings are not proof of clinical quality or live appointment availability. Verify the actual receiving/referral process with the pilot institution.

Maps receive only necessary location/search information, not patient narratives. Handle permission refusal and provider failure. Cross-layer imports retain source and require confirmation; an AI guess must not become a patient-stated fact.

## Acceptance evidence

- Reviewed in-scope, urgent, uncertain, and out-of-scope scenarios.
- No unsupported diagnostic certainty or medication instructions.
- Safe behavior when location or model/map providers are unavailable.
- Reproducible model evaluation, or an explicit decision to keep inference disabled.
- Confirmed data import into ADR intake without requiring MedAssist for direct reports.

## Revised model and profile scope

The user now requires English-only data/interface and no paid service dependency, with all-age product intent. Appropriate adult and paediatric data and separate evaluation are still needed. ML is the intended urgency engine; a local LLM supports follow-up questions. The current quote-selection tool is not that trained model. The [shared account profile](../../database/README.md) can provide opted-in age/history context, visibly separate from conversation statements. It is not automatically sent to the model.
