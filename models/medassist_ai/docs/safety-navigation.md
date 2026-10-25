# Provisional emergency guard and hospital navigation

**Checkpoint warning, 2026-10-25:** the later [symptom-understanding development audit](symptom-understanding.md#safety-findings-that-remain-unresolved) finds that the unchanged literal rules miss “I am having a heart attack” and “I am having a stroke”; only one of three emergency-positive examples is recognized. Passing regressions for recognized statements do not resolve these misses. No-match is not clearance. No rules were changed by consolidation, and qualified review plus separately authorized remediation remain mandatory before clinical use. Navigation still provides only a consent-based external Maps search, not verified facility suitability or availability.

Completed 2026-10-25, continuing the interrupted 2026-10-24 implementation. This is fictional-demo software evidence, not clinical validation. Model B remains disabled and returns `unable_to_assess`. The [verification receipt](safety-navigation-verification.json) records the exact task inventory and checks.

## Rule status and precedence

The shared `explicit-emergency-statements.v1` rules in `safety/provisional-rules.v1.json` are `provisional_unreviewed`, with no clinician reviewer and no clinical-validation claim. Literal English phrases recognize direct requests for emergency help/ambulance and explicit inability to breathe. The [MHA emergency-service reference](https://www.mha.gov.in/en/commoncontent/emergency-response-support-system-erss) and [NHS breathing reference](https://www.nhs.uk/symptoms/shortness-of-breath/) provide source context; they do not approve this matcher or establish a comprehensive protocol.

Both the adaptive conversation and older symptom preview offer an always-available emergency action and check input locally before model work. A triggered guard latches emergency guidance, invalidates/aborts pending language and question requests, and suppresses ordinary question/self-care paths. Late responses cannot remove the interruption. Backend extraction checks run before language-provider invocation; the Python orchestrator also guards free-text proposals before conversational-model work. Model A retains normal question authority, and the evidence contract is unchanged. Structured-evidence clinical safety assessment remains unavailable: no match means **not assessed**, never safe.

Guidance says to contact local emergency services for a real emergency without waiting for the demo, questions or Maps. India 112 is explicitly jurisdiction-labelled, with local emergency services elsewhere. Calling requires a separate user action; there is no automatic call or dispatch, and fictional tests must not call emergency services.

This literal matcher can miss paraphrases, other emergencies, Telugu/mixed-language statements and contextual meaning. Quoted, historical, hypothetical or indirectly negated wording can falsely trigger it. It is not an approved red-flag protocol, diagnosis, urgency assessment or home-care clearance. Restart clears software state, not medical risk.

## Navigation actually implemented

The separate TypeScript and Python adapters reuse the existing fixed HTTPS Google Maps search URL. They return `search_handoff`, an empty facility list and explicit unverified-provider/unknown-availability/not-verified-suitability semantics. They do not find or verify hospitals, specialties, distances, travel times, capacity or emergency suitability.

Location requires a separate user action and browser permission. Coordinates are rounded to three decimals; browser location is not independently verified. The existing `medassist.navigation-request.v1` consent contract remains scoped to `nearby_hospital_search`. The browser issues 60-second consent, and the adapter rejects expired consent or expiry beyond two minutes; these are engineering controls, not clinical thresholds. Only location and consent go to the local backend, with no symptom narrative, evidence or account context. A manual city/area stays local until the external Maps link is clicked. Preparation makes no Google API request; the link uses no-referrer/noopener behavior. State is memory-only, and clear/restart/unmount invalidate pending requests.

Denied, unavailable, stale or invalid location, timeout, malformed responses and backend/network failure produce explicit fallback states while emergency guidance persists. Manual location remains available. External Maps network failure or no results cannot be observed by this application and are not claimed as verified success. Users must not delay emergency-service contact for navigation.

## Backend boundaries

Three POST JSON routes are registered independently of the Model A flag/private token:

- `/api/research/medassist/safety`
- `/api/research/medassist/navigation/hospital`
- `/api/research/medassist/navigation/emergency`

They require development mode, loopback socket/Host/Origin checks, exact bounded fields, a 4 KB body limit and no-store responses. Production returns 404. Existing extraction routes return an explicit 409 safety interruption before provider work when matched. Normal confirmation, evidence validation and Model A question selection remain intact. Authentication/account behavior is unchanged. Existing preview servers were not restarted; their next deliberate restart is needed to load changed backend code.

## Verification

- Resumed final checks: **43 TypeScript tests passed**, zero failed/skipped; **15 focused Python tests passed** with warnings treated as errors, including FastAPI HTTP integration. Jayanth tests were intentionally excluded.
- Existing successful checkpoint logs: frontend and explicit backend/test TypeScript checks passed; application build passed with its existing large-bundle warning. Runtime code did not change after those checks.
- Browser safety checks passed at **390, 820 and 1440 px**: models offline, zero model calls on emergency, denied location, manual Maps preparation, navigation failure retaining emergency guidance, pending extraction cancellation, legacy-preview guard, no page errors or horizontal overflow. These checks used mocked transports and did not open external Maps or call Groq.
- Existing 20-question browser regression passed at all three widths: bounded page/history, keyboard interaction, UNKNOWN/explicit-negative preservation, collapsed developer inspector and 223-item export. Browser interview responses were fixtures.
- Separate actual sealed Model A smoke passed: real question selection, UNKNOWN preservation, duplicate prevention, 223-item export, emergency precedence and disabled Model B. This was offline fictional inference, not a cloud/browser end-to-end clinical test.
- Fresh read-only verification matched **all 17 sealed artifact hashes**, seal/hash receipt, implementation hashes and exact frozen protocol digest. The official locked test and stable ledger were not accessed. The preexisting local-CRLF versus Git-LF protocol portability caveat remains; no frozen bytes were normalized.

Earlier sandbox socket failures and a blocked Python TestClient runner were resolved through approved bounded reruns. Only this task's identified test processes were stopped. The interruption's automatic-review usage-limit refusal prevented final commands from executing; the resumed approved 43/15 reruns now complete that checkpoint. No unresolved approval block remains. No training, downloads, cloud benchmarking, extra monitoring, staging, commit or push occurred.

## Remaining release gates

Qualified clinical review must approve rule scope, wording, exclusions and escalation behavior, followed by evaluation of misses/false triggers, child/adult contexts, jurisdictions and each supported language. No human sign-off is implied by engineering checks. Clinician-approved precautions and comprehensive red flags remain unavailable. Verified facility results require a separately governed provider, currentness/suitability evidence and privacy review. Current navigation is only a user-directed Maps search handoff. Neither these guards nor NHAMCS research activate patient-facing Model B.
