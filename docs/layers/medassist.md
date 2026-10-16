# MedAssist AI

**Status:** confirmed product direction; implementation and clinical evaluation pending. Jayanth originated this part of APIP.

## Responsibility

Provide an understandable conversation about symptoms/context and help a person find an appropriate care destination. Education and navigation must not promise a diagnosis, cure, prescription, or medicine/dose change.

## Intended journey

1. Gather relevant context with reviewed questions.
2. Support an urgency pathway with an explicit uncertain/insufficient-information outcome.
3. Provide reviewed educational information and care-navigation guidance.
4. Request location permission or accept manual location; show relevant facilities and a user-selected navigation route.
5. Offer deliberate reuse of confirmed episode information in a later ADR report.

Urgent-care interruptions must also be available in reporting. Do not require a lengthy interview, map selection, or report animation before displaying reviewed urgent guidance.

## Model research

A custom model trained from scratch is an aspiration, not a selected algorithm. Define a bounded task, permitted dataset, clinically meaningful labels, baseline, and held-out evaluation before training. ADR reports do not automatically provide valid medical-urgency labels.

Separate training from live care guidance. Record per-class errors, urgent-case misses, calibration, dataset coverage, and uncertainty. Synthetic cases can exercise software, not establish clinical effectiveness. If evidence/review is inadequate, keep model-driven urgency disabled and document the gap.

## Navigation and data boundaries

Show the basis for facility results: location, relevant listed services, and available travel information. Ratings are not proof of clinical quality or live appointment availability. Verify the actual receiving/referral process with the pilot institution.

Maps receive only necessary location/search information, not patient narratives. Handle permission refusal and provider failure. Cross-layer imports retain source and require confirmation; an AI guess must not become a patient-stated fact.

## Acceptance evidence

- Reviewed in-scope, urgent, uncertain, and out-of-scope scenarios.
- No unsupported diagnostic certainty or medication instructions.
- Safe behavior when location or model/map providers are unavailable.
- Reproducible model evaluation, or an explicit decision to keep inference disabled.
- Confirmed data import into ADR intake without requiring MedAssist for direct reports.
