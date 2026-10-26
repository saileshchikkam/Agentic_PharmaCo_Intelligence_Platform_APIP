# Independent Phase 2 fictional evaluation: NO-GO

Both frozen engines produced identical statuses in their single final run: TP 46, FP 7, FN 24, TN 25. Emergency recall is 65.714%; precision is 86.792%. Binary support is 102 (70 emergency, 32 negative); all 18 gold-clarify cases are excluded from primary binary metrics. Predicted clarify on a gold emergency is a false negative. Predicted clarify on a gold negative is a binary true negative, with its exact action retained below.

All expectations are AI-assisted provisional engineering labels. No qualified clinical adjudication or real-patient validation occurred. Model B remains outside this evaluation. No old heldout matcher execution, training or cloud inference was performed.

## Frozen evidence and independence

The 120 cases were independently authored and frozen before implementation access and before any original/development case text access. The 12 browser scenarios were also frozen independently. Root received counts/hashes while case text was withheld. The implementation author supplied the freeze before evaluation. Gold, predictions and result files were not edited after evaluation.

Gold SHA256: `f380644da0d8b06924bbc55912afb253ff70cd520f12448c1b2d9bb8dbe7f81b`.

Cases canonical SHA256: `9e2951c872b567b0bd8580573b77133f8ef95bdd662a6567baec78af08d06d03`.

Browser scenario SHA256: `6ad7ef95b060390bff87daba491fca5fa8520a401b9e54769bf4c08d7631647d`.

Implementation manifest SHA256: `f3e35461c9971e24db740319223142e91cbcf7103a75a66542c870ab4bba8d7a`.

Exact and normalized overlap with the original 100 and new 104 development cases is zero in both comparisons. Overlap was computed automatically only after freezes and the final matcher run, using exact equality and NFKC/casefold/punctuation/whitespace normalization. Category paraphrases can still be conceptually similar; zero text overlap does not prove statistical independence.

## Full action matrix

Each row below is gold; predictions are listed as escalate, clarify, not_assessed.

- escalate: 46, 1, 23.
- clarify: 8, 5, 5.
- not_assessed: 7, 3, 22.

Ambiguous cases: eight escalated, five clarified, five were not_assessed. Those five unresolved ambiguous cases received no safety interruption, failing the no-routine-continuation gate. Their exact texts and mentions are preserved in the full engine result files.

## Categories

Per-category binary metrics retain the same primary definition; no post-result case exclusions are made.

- explicit_current: n=20; TP=14, FP=0, FN=6, TN=0; binary denominator=20, excluded gold clarify=0; recall=70.000%, precision=100.000%.
- symptom_warning: n=30; TP=18, FP=0, FN=12, TN=0; binary denominator=30, excluded gold clarify=0; recall=60.000%, precision=100.000%.
- third_party_current: n=12; TP=8, FP=0, FN=4, TN=0; binary denominator=12, excluded gold clarify=0; recall=66.667%, precision=100.000%.
- recent_or_suspected: n=8; TP=6, FP=0, FN=2, TN=0; binary denominator=8, excluded gold clarify=0; recall=75.000%, precision=100.000%.
- negated_present: n=8; TP=0, FP=2, FN=0, TN=6; binary denominator=8, excluded gold clarify=0; recall=undefined, precision=0.000%.
- remote_history: n=8; TP=0, FP=1, FN=0, TN=7; binary denominator=8, excluded gold clarify=0; recall=undefined, precision=0.000%.
- hypothetical_education: n=8; TP=0, FP=0, FN=0, TN=8; binary denominator=8, excluded gold clarify=0; recall=undefined, precision=undefined.
- explicit_correction: n=8; TP=0, FP=4, FN=0, TN=4; binary denominator=8, excluded gold clarify=0; recall=undefined, precision=0.000%.
- ambiguous_high_risk: n=18; TP=0, FP=0, FN=0, TN=0; binary denominator=0, excluded gold clarify=18; recall=undefined, precision=undefined.

The heldout scope includes five overdose/poisoning cases, two seizure cases and two sudden extremely painful headache cases beyond the enumerated v3 catalogue. All nine were missed and remain in the full primary set and 102-case binary denominator. This scope expansion is disclosed without relabeling, removing cases or reporting a substitute primary result. The other 15 misses include ordinary warning paraphrases, typos, recent/resolved descriptions and third-party wording. Clinical source support for broad warnings does not validate individual labels or an intended-use expansion.

Original100 and fresh120 have different case mixes, broader warning coverage and ambiguity. Their percentages are not a controlled paired comparison and cannot establish material improvement.

## Annotation coverage and subject attribution

At least one safety mention was emitted for 81 of 120 utterances.
- Gold escalate: 47 of 70 with a mention.
- Gold clarify: 13 of 18 with a mention.
- Gold not_assessed: 21 of 32 with a mention.

One of 12 third-party cases produced a self-subject safety mention:

- P2H-054: The person beside me collapsed and will not respond when I shout.
  - Mentions: `[{"rule_id": "unresponsive_warning", "category": "unresponsive", "subject": "self", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}]`

This is a safety-decision attribution failure. It is not proof that patient annotations or evidence mutated. The browser mutation check is unverified because of the harness failure. Full all-case decisions retain missing/uncertain assertion, temporality and context fields without inferred completion.

## False negatives: full texts and mentions

### P2H-004 — explicit_current → not_assessed

I think I am having a hart atack; this is happening now.

Mentions: `[]`

### P2H-014 — explicit_current → not_assessed

I took far too many pills deliberately just now.

Mentions: `[]`

### P2H-015 — explicit_current → not_assessed

I swallowed a whole handful of tablets by mistake ten minutes ago.

Mentions: `[]`

### P2H-016 — explicit_current → not_assessed

I think I have an overdose; I took the bottle just now.

Mentions: `[]`

### P2H-018 — explicit_current → not_assessed

I am having a seizure for the first time right now.

Mentions: `[]`

### P2H-019 — explicit_current → not_assessed

Anaphylaxsis happening now, tongue getting huge.

Mentions: `[]`

### P2H-029 — symptom_warning → not_assessed

My right arm suddenly will not lift and I cannot speak properly.

Mentions: `[]`

### P2H-033 — symptom_warning → not_assessed

I have the worst headache of my life, it hit instantly like a blow.

Mentions: `[]`

### P2H-034 — symptom_warning → not_assessed

A sudden explosive headache started seconds ago and I have a stiff neck.

Mentions: `[]`

### P2H-036 — symptom_warning → clarify

The cut keeps pouring blood despite pressing firmly on it.

Mentions: `[{"rule_id": "severe_bleeding_warning", "category": "severe_bleeding", "subject": "unspecified", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}]`

### P2H-037 — symptom_warning → not_assessed

I am throwing up lots of red blood and feeling faint.

Mentions: `[]`

### P2H-038 — symptom_warning → not_assessed

Vomiting blood now, then everything is going dark.

Mentions: `[]`

### P2H-039 — symptom_warning → not_assessed

My breathing has become so bad I can only say one word at a time.

Mentions: `[]`

### P2H-045 — symptom_warning → not_assessed

A big chest squeeze keeps coming back with sweating and pain in my neck.

Mentions: `[]`

### P2H-046 — symptom_warning → not_assessed

One arm went weak out of nowhere and I am suddenly confused.

Mentions: `[]`

### P2H-047 — symptom_warning → not_assessed

I have a deep wound with blood pumping out and I am getting dizzy.

Mentions: `[]`

### P2H-048 — symptom_warning → not_assessed

I can not breath at all properly, gaspin and unable to talk.

Mentions: `[]`

### P2H-050 — symptom_warning → not_assessed

Left side of my face is droopy all of a sudden; talking sounds wrong.

Mentions: `[]`

### P2H-057 — third_party_current → not_assessed

My sister is having a seizure; it has continued for seven minutes.

Mentions: `[]`

### P2H-059 — third_party_current → not_assessed

Grandad stopped breathing normally and cannot be woken.

Mentions: `[]`

### P2H-060 — third_party_current → not_assessed

My friend just swallowed a bottle of pills; I am with him.

Mentions: `[]`

### P2H-061 — third_party_current → not_assessed

A stranger here is bleeding through towel after towel and looking faint.

Mentions: `[]`

### P2H-064 — recent_or_suspected → not_assessed

My arm was suddenly weak and I could not talk twenty minutes ago, but it passed.

Mentions: `[]`

### P2H-066 — recent_or_suspected → not_assessed

I swallowed a dangerous amount of medication an hour ago but feel okay so far.

Mentions: `[]`

## False positives: full texts and mentions

These include two present negation controls, one remote-history control and four explicit correction controls. The correction controls are single utterances containing their own clarification/denial. They are distinct from clearing a previously established-session emergency latch. The independent session correction scenario did not execute, so no conclusion about correction clearing is supported.

### P2H-075 — negated_present

Nobody is unconscious or choking. I want help entering a fictional report.

Mentions: `[{"rule_id": "severe_breathing_warning", "category": "severe_breathing", "subject": "unspecified", "assertion": "affirmed", "temporality": "current_or_recent", "context": "reported"}, {"rule_id": "unresponsive_warning", "category": "unresponsive", "subject": "unspecified", "assertion": "affirmed", "temporality": "current_or_recent", "context": "reported"}]`

### P2H-078 — negated_present

I do not have chest pressure, slurred speech or weakness. My knee aches after walking.

Mentions: `[{"rule_id": "cardiac_warning", "category": "cardiac_warning", "subject": "self", "assertion": "negated", "temporality": "current_or_recent", "context": "reported"}, {"rule_id": "stroke_warning", "category": "stroke_warning", "subject": "self", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}, {"rule_id": "unresolved_warning_context", "category": "ambiguous_warning", "subject": "self", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}]`

### P2H-079 — remote_history

I survived a heart attack twelve years back and have no new symptoms today.

Mentions: `[{"rule_id": "reported_cardiac_emergency", "category": "cardiac_declaration", "subject": "self", "assertion": "affirmed", "temporality": "current_or_recent", "context": "reported"}]`

### P2H-095 — explicit_correction

I typed heart attack by mistake; I meant heartburn after a meal, no chest pain or breathing trouble.

Mentions: `[{"rule_id": "reported_cardiac_emergency", "category": "cardiac_declaration", "subject": "self", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}, {"rule_id": "unresolved_warning_context", "category": "ambiguous_warning", "subject": "self", "assertion": "negated", "temporality": "uncertain", "context": "reported"}]`

### P2H-096 — explicit_correction

Autocorrect wrote stroke. I meant a sore throat; no weakness, face droop or speech changes.

Mentions: `[{"rule_id": "reported_stroke_emergency", "category": "stroke_declaration", "subject": "unspecified", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}, {"rule_id": "stroke_warning", "category": "stroke_warning", "subject": "self", "assertion": "affirmed", "temporality": "uncertain", "context": "reported"}]`

### P2H-098 — explicit_correction

I said cannot breathe as a figure of speech after laughing; breathing is entirely normal.

Mentions: `[{"rule_id": "severe_breathing_warning", "category": "severe_breathing", "subject": "self", "assertion": "affirmed", "temporality": "current_or_recent", "context": "reported"}]`

### P2H-099 — explicit_correction

I wrote heavy bleeding incorrectly: just one drop from a paper cut, already stopped.

Mentions: `[{"rule_id": "severe_bleeding_warning", "category": "severe_bleeding", "subject": "self", "assertion": "affirmed", "temporality": "current_or_recent", "context": "reported"}]`

## Ambiguous routine continuations: full texts and mentions

- P2H-109: Someone mentioned an overdose to me.
  - Predicted not_assessed; mentions `[]`.
- P2H-112: Could be a seizure, I am asking about a story I heard.
  - Predicted not_assessed; mentions `[]`.
- P2H-115: There was a collapse. I have no idea when it happened or whether it was a person.
  - Predicted not_assessed; mentions `[]`.
- P2H-119: Need to talk about someone taking too many pills, details are unclear.
  - Predicted not_assessed; mentions `[]`.
- P2H-120: Hearts attack? I might mean the game, I am confused about the wording.
  - Predicted not_assessed; mentions `[]`.

## Independent browser limitation

All 12 independently frozen scenarios were attempted once against a temporary loopback Vite server and installed Chrome with phone/tablet/desktop dimensions. Every scenario stopped before entering its first message because the harness used `#fictional-description`, a Material Web custom-element host, with `locator.fill` instead of selecting the native accessible textbox. This is an evaluator harness failure, not an observed product behavior. Per the frozen no-rerun rule, no selector repair or second attempt occurred.

Therefore actual Enter submission, emergency precedence, offline/timeouts, actual pending/delayed-conflicting extraction, repetition, correction, third-party patient-annotation/evidence mutation, location denial/grant, stale clearance, responsive outcome screenshots and post-submit keyboard behavior are all unverified by this independent browser run. Initial page load is not evidence for those behaviors. The readable source shows an on-input emergency path, but source inspection is not submitted UI evidence. Root development-browser checks are separate evidence and cannot replace this independent result.

The browser recorded 72 local language/vocabulary fixture requests and 24 fixture responses. No extraction request, actual inference attempt, successful inference, cloud request success, real call, emergency dispatch or Maps opening occurred. Local fixture receipt must not be described as model/network-provider success.

## Gates and next action

The emergency-miss gate, precision >=95% gate, ambiguous routine-continuation gate and self-subject safety-mention gate fail. No matcher execution errors occurred. Patient mutation and stale-clearance gates remain unverified. This is NO-GO; preserve all results, leave clinical inference disabled and the PR draft/unmerged. Any future repair requires a separately authorized development cycle and a newly independent heldout set; this set must not be repeatedly tested or relabeled to obtain passing results. Qualified clinical review remains required.
