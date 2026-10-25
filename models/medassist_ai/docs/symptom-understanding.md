# Symptom understanding and evidence integrity

2026-10-25. **Conditional GO for bounded fictional engineering tests. NO-GO for a clinically qualified Model B input pipeline or patient-facing clinical use.** No Model B work, training, provider/model switch, UI redesign, commit or push occurred.

## What was wrong

The P0 transport/replay fixes are retained. Inspection found that language anchors plus quote/polarity checks did not establish subject, time or assertion status: a historical, resolved, other-person or hypothetical symptom could still look like a current positive mention. A cropped quote could omit a negation from the full source. Verb/spelling coverage was narrow. Generic feeling sick, nasal discharge and breathing difficulty did not safely supply qualified schema meanings.

Typed schema membership also did not establish question compatibility. `anus` and ankle sites are valid source choices, so treating them as invalid anatomy would be another error. After lower-back wording, a different site needs an explicit relationship/correction; a posterior ankle without side is not a right/left ankle answer. Narrative severity is not a numeric score. The original per-concept clarification tracker did not cap different incompatible replies to the same question.

The topical mask omitted E_66: even a valid significant-breathing initial symptom could have an empty pool. The ranker and frozen graph were functioning; this was an unsealed conversational-filter gap.

## Implemented flow

1. The existing independent safety evaluator runs first, in the browser and local backend. Its rules/phrases are unchanged.
2. Token/phrase normalization uses explicit equivalences and allowlisted misspellings, source offsets and clause context. Current positive/negative/UNKNOWN proposals are separated from history/resolved, other-person, hypothetical, suspected-condition, non-asserted and unsupported wording. Contradictions/corrections remain unresolved; earlier accepted facts are never silently replaced.
3. Supported deterministic input returns through the same guarded `/natural/extract` route without a cloud call. Uncovered language still uses the unchanged configured Groq provider, token budget, deadline, rate limits and bounded retry policy. Relevant prior fictional context is limited to three earlier statements in the provider prompt. Strict schema/span/type/polarity/context validation follows generation. A short quote cannot override the complete source's negation or uncertainty.
4. Input request `medassist.natural-extract-request.v2` explicitly adds bounded `prior_context`; v1 authored callers remain supported. The proposal stays `medassist.natural-extraction.v1`. Source method is preserved in an allowlisted response header, including cached retries.
5. The existing confirmation UI remains. Proposals do not modify accepted evidence until the user confirms. History, concern about a tumor, an unsupported breast lump, qualifiers and unmatched detail stay as user-reported context, never diagnoses or guessed features.
6. Question compatibility checks actual B/C/M types and allowed values. Exact labelled choices and explicit side aliases can be proposed. Incompatible/unrelated/ambiguous replies clarify; at most two such free-text attempts are allowed for a pending question. Shown valid controls and Not sure remain available. Clarification never advances Model A.
7. `topical-candidates.v2` adds only E_66 to the respiratory mask. The same sealed Model A scores eligible candidates with the same frozen encoding. Explicit negative/UNKNOWN parents do not unlock children; exclusions, repeat prevention, disclosure limits and eight routine turns remain.
8. Export wrapper `medassist.conversation-export.v2` adds original wording, source-span annotations, literal detail tags, extraction method, confirmation flags and clarification counts. The nested **`model-a-to-b.evidence.v1` is unchanged**, contains 223 items and keeps Model B disabled. Unmentioned, UNKNOWN, negative and unsupported remain distinct. Raw context is not a confirmed clinical fact.

Page-memory state still clears on refresh without silently persisting or replaying medical text. After an implementation/filter update, start a new fictional interview; earlier question sequences are not a migration guarantee. No account history is imported. Credentials/private artifact paths are never returned or logged. Original DEV/loopback/origin/token guards remain.

## Before and after examples

- “I've been coughing for three days”: current E_201 proposed; literal duration retained; no cloud call required.
- “I used to cough, but it stopped”: history/resolved annotation and narrative; no current positive/negative is invented.
- “My brother is coughing”: another-person context; no automatic assignment to the fictional person.
- “I am not coughing” / “Not sure”: explicit negative versus UNKNOWN, never missing-as-negative.
- “I think I have a tumor in my breast” / “I have a lump in my breast”: concern or unsupported reported symptom; no cancer inference.
- “I have diarrhea and nausea, but I haven't vomited”: E_51/E_148 proposed; unqualified vomiting denial remains wording, not repeated-vomiting E_211.
- Lower-back context + `anus`: targeted additional-site/correction clarification, no new Model A turn. Explicit “I also have pain in my anus” can propose the existing exact location, requiring confirmation.
- Radiation + unsided posterior ankle: clarification. Explicit “It radiates to my left ankle” can propose V_35, never posterior/right ankle. `severe` for a numeric question does not become a score.

## Quantitative fictional checks

[Primary suite and method](../evaluation/symptom-understanding-v1/README.md) freeze **115 unique fictional utterances across 17 categories** before implementation. Labels were AI-assisted manually specified independently of extractor execution; no human clinical sign-off or clinical ground truth is claimed. Corrections were developed against this set, so it is a development/regression suite, **not an untouched holdout**.

- Initial deterministic evidence exactness: **113/115**; mapping precision/recall **82/83 each (98.80%)**; negation **9/10**; question compatibility with exact evidence **15/16**; context annotations **114/115**.
- Final deterministic evidence exactness: **115/115**; **83 correct, zero false-positive and zero missed mappings** in this suite; negation **10/10**, question/evidence compatibility **16/16**, unsupported abstention **8/8**, context annotations **115/115**. All 115 expectations are rechecked in the current unit test. These numbers are fictional software semantics, not clinical accuracy or English-wide coverage.
- Fifteen separately labelled canonical positive checks cover the mapped fields absent from the primary set: **15/15**. Together the examples touch all 30 mapped fields and three typed question fields. These supplementary checks were written after primary development and are not independent confirmation.
- Twenty-two manually authored adversarial mocked-provider outputs: **22/22 expected safety/validation outcomes**—three nonempty accepted proposals, six quarantined to empty evidence and thirteen rejected. This tests software gates, **not Groq model accuracy**. Earlier 20-case/mock and initial/refined deterministic receipts remain unchanged.
- Actual loopback integration: all **12 reported statements** returned deterministic proposals/context; three explicitly authored fictional confirmations reached **actual sealed Model A**; replay and the existing emergency guard worked. **Zero live Groq calls** in this task. Cloud semantic accuracy/availability was not remeasured; prior P0 receipts document TPM throttling.
- Five separate **actual Model A** scenarios cover cough/normal-breathing absence, pain+nausea, significant breathing, negative pain parent and empty topic. UNKNOWN/negatives, dependencies, no repeats, eight turns, 223-item export and disabled Model B passed. These are model integration checks, not question relevance or clinical performance.

## Safety findings that remain unresolved

The primary suite has three explicit emergency statements. The unchanged rule set catches **1/3**, “I cannot breathe,” and misses **2/3**: “I am having a heart attack” and “I am having a stroke.” Across all 115 cases, safety expectations match 113/115, but that aggregate must not hide the emergency-positive recall of **33.3% (1/3)** in this tiny authored set. No-match remains `not_assessed`, never clearance.

These are existing literal-rule gaps, not fixed or relabelled as successful tests. The user explicitly prohibited changing independent safety rules; this implementation did not add a parallel rule engine or bypass that restriction. Known offline/pending/denied-location/navigation-failure safety regressions still pass for recognized statements. The two missing declarations can enter ordinary clarification/provider paths and are a hard blocker to clinical readiness. Qualified rule/wording review and separately authorized safety changes are required.

## Verification, preservation and next gate

[Exact files/check receipt](symptom-understanding-verification.json) distinguishes unit assertions, mocked UI/provider traffic and real Model A/HTTP execution. Browser NLP/anatomy checks cover 390/820/1440px; existing natural-history/export checks also cover 320px. Type/build checks pass with the existing large-bundle warning. All 17 artifacts, seal, frozen implementation/protocol and pinned environment match before/after real-model checks. Only metadata was read; source patient archives, locked test and ledger were not opened. Original research/Jayanth/Model B data and prior receipts remain intact. Trusted-pickle and CRLF-local/LF-Git portability caveats remain.

The [inventory](symptom-coverage.md) is deliberately narrower than the schema. Remaining limits include English-only allowlists, conservative ambiguous/conditional grammar, limited third-party/coreference coverage, unusual source vocabulary/question wording, no independently reviewed anatomical synonym ontology, broad unreviewed topic masks, and stop/restart for changes to earlier confirmed facts. Deterministic and LLM paths can abstain; no general natural-language guarantee is established.

Next: independent unseen English/context/anatomical cases and qualified annotation review; resolve safety declarations through the proper review/authorization boundary; review question wording and topic memberships. Do not use these development-suite scores to approve clinical Model B features, labels, training or activation. Independent, properly governed Model B research remains a separate task and was not advanced here.
