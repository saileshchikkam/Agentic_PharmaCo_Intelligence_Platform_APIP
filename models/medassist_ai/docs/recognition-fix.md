# Symptom recognition and bounded clarification — 2026-10-25

**Fixed for fictional software evaluation; clinical use remains NO-GO.** No model, training vocabulary, frozen feature encoder, safety rule or provider selection was changed. The UI structure and styling are unchanged. A phone check also found the sticky composer covering newly inserted numeric answers; automatic scrolling now reserves the measured composer height and follows delayed control sizing so the answers stay visible.

## Findings and before/after evidence

The language profile supplied only 28 anchored concepts to Groq and omitted the existing general pain field **E_53**. Both stomach pain and headache can support this general pain premise, but were unavailable to extraction. The first two actual browser reproductions returned HTTP 200 with empty observations, no confirmation and no Model A call. Headache’s catalogue exclusion is proven statically; its later before-API attempt returned HTTP 503, so no captured empty-observation headache response is claimed. The original frontend unconditionally repeated the same clarification and kept no attempt/concept state.

A separate persistent language-service failure then affected **all seven API controls**, not just pain. The old transport collapsed upstream/provider/validation failures into one error; the exact upstream status was not retained and cannot honestly be attributed to quota, authentication or a particular Groq failure. [Before receipt](recognition-before.json) distinguishes these observations. Two headless browser attempts stalled during lifecycle/verification and were stopped; they are not counted as completed seven-case browser runs.

The repaired, quota-spaced [seven-case real-browser/API run](recognition-after.json) passed every input through actual configured Groq, frontend validation, explicit confirmation, fictional age/female-or-male context and real Model A:

- “I have stomach pain that started three days ago”, “stomach pain”, and “headache”: proposed existing E_53=true, then selected **E_56, pain intensity**.
- “I am coughing.”: E_201, then E_181.
- “I have diarrhea and nausea.”: E_51 and E_148, then E_161.
- “I have a fever.”: E_91, then E_50.
- “I have a sore throat.”: E_97, then E_201.

These are seven successful engineering cases, not a general extraction-accuracy estimate or clinical validation. The selected provider remains `qwen/qwen3.8-27b`; its original qualified three-symptom profile and evaluation files remain unchanged. No additional cloud benchmark or model comparison ran. The successful run spaced cases by at least 22 seconds and used the existing backend request caps/free-plan approval.

## Mapping and candidate generation

The expanded profile now exposes **29 anchored concepts**, adding general pain within the same **110 symptom fields / 96 root initial symptoms**. It does not create dedicated stomach-pain/headache IDs. Specific location and duration remain original/unmapped wording unless an exact source-supported answer can be confirmed. The source location vocabulary contains specific coded subregions; a generic headache does not establish “forehead”, “back of head” or “top of head”, and stomach pain does not establish “epigastric”. No default location is substituted.

The adapter now returns English `value_meaning` labels from the same trusted, verified metadata. The UI displays these instead of raw V_ codes; the original codes/types remain in requests, feature encoding and the unchanged evidence handoff. A typed extraction may use only an exact supplied label/code pair. These labels are source metadata, not newly approved clinical wording.

Direct actual-model investigation of confirmed E_53 produced **13 topical candidates** before the fix. The reported pain failure therefore occurred **before candidate generation**, not because the filter emptied the pool or the ranker failed. No topic membership, eligibility mask, dependency rule, safety question list or ranker scoring was changed to force the result. There is no newly invented list of “clinically important” questions: independent provisional emergency statement handling remains first, and clinical completeness of the existing interview remains unestablished.

[Actual Model A regression](recognition-model-a.json) answered eight selected pain questions with explicit UNKNOWN, without repeated IDs, and stopped at eight. A separate confirmed supported field outside the current topic membership ended with `no_eligible_questions`; the normal summary explains that no supported follow-up remains rather than requesting another description.

## Failure separation and bounded conversation state

Backend natural-extraction responses now distinguish service unavailability, quota/busy, timeout, invalid structured output and recognized-but-unmapped text. Legacy transport error messages stay compatible, with a safe internal category used by the new route; no raw error body, key, private path or request log is exposed. The original access/payment/quota latch and request caps remain.

The Python adapter separately reports invalid transcripts and unavailable ranking. The frontend distinguishes an ineligible interview sequence from transient question-service failure. Empty eligible pools are successful terminal states, not extraction failures.

`ClarificationTracker` stores unresolved concepts, phase, meaningful tokens, failure kind and attempts in page memory. An equivalent simplification of already-kept wording does not spend another Groq request. One genuinely new detail can clarify before the two-attempt bound; a service failure can be explicitly retried once. After the bound, a scope/service-specific explanation offers restart, a different supported symptom or location-only care navigation. Further equivalent submissions retain the user's words without appending another identical assistant fallback. Restart clears the tracker. New pending question IDs have separate state.

Already-accepted facts re-extracted without new information also enter this bounded path, preventing repeated confirmation/current-question loops. Changed facts still reach explicit contradiction handling; they are never silently overwritten. Original narratives, unmatched wording, confirmed proposals and unresolved-concept diagnostics remain separately downloadable. Safety evaluation precedes all of this bookkeeping, including blocked, offline or pending language work.

## Verification and limits

The [task receipt](recognition-verification.json) records the exact files and final checks: focused TypeScript/Python regressions; seven real browser/API cases; fictional browser tests for unsupported/equivalent wording, bounded retries, invalid output and timeout; real eight-question/empty-pool checks; frontend type/build checks; and read-only verification of all 17 sealed artifacts, frozen implementation/protocol, pinned environment and existing source attestations.

No source patient archives, official locked test or stable ledger were accessed. Model B remains disabled; archived Jayanth and Model B research files are unchanged. Existing emergency rules and hospital navigation are unchanged. No new dependencies, training, UI redesign, staging, commits or pushes occurred. The existing large client-bundle warning, exact-byte CRLF/LF portability caveat and trusted-local-pickle constraint remain.

Clinical question relevance, comprehensive language/anatomical coverage, safety wording and urgency/guidance still require independent evaluation/review. Generic pain mapping does not establish a diagnosis, severity or exact anatomical location. Earlier accepted conflicts still stop the interview and require clarification/restart. The active preview remains `http://127.0.0.1:3000/#/preview/medassist-conversation`.
