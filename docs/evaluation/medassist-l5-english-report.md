# MedAssist Stage 3 / L5 fictional English and multi-turn evaluation

**2026-11-06 · `feat/medassist-jayanth` · baseline `cad354d70c108343b54bd6fa3d146614a572a04e`**

## Freeze and measurement

The [versioned corpus](medassist-l5-english-v1.json) contains 80 new initial descriptions, 15 browser journeys, and four separate warning probes. Inputs and expectations were saved together before the first L5 execution. The pre-run SHA-256 was `08519525e96b0d3f7c2772a3e5f967f23446c42e46a9a2f8a06f599739282c5c` over UTF-8 with LF line endings. The [evaluator](../../scripts/medassist-l5-evaluate.ts) checks that digest. The cases were AI-authored after contract review, separately from the L2 and L3 suites. The same assistant authored and executed them. There was no external annotation, blinding, or representative sampling.

Run `node --import tsx scripts/medassist-l5-evaluate.ts` from the repository root for exact proposal quotes, retained narrative snippets, flags and mismatch reasons. Initial language rows run the existing `understand` function with the nine scripted fields. Warning rows separately run the existing provisional warning matcher. A language full match requires exact IDs and states, specified literal span support and narrative retention, valid provenance, and matching confirmation, clarification and conflict intent. The evaluator projects those intents from parser output and the existing rendering contract. Live UI checks cover the separate browser journeys below. A successful evaluator exit means the measurement ran.

## Results

- **40/80 full language matches (50.0%)**, 40 mismatches, zero skipped or blocked. Across cases, 43/74 expected ID/state pairs were recovered (58.1%) and 43/58 proposed pairs matched expectations (74.1%).
- There were 25 missing expected IDs, six wrong states on expected IDs, and nine unexpected IDs. Eleven erroneous positive proposals, three erroneous negative proposals, and one unexpected UNKNOWN account for the 15 nonmatching emitted pairs. There were eight missing required narrative spans and 29 clarification-intent differences. These dimensions overlap.
- The evaluator found zero emitted out-of-vocabulary IDs, invalid literal evidence quotes, or invalid annotation offsets. Correct offsets can still point to semantically misinterpreted statements.

| Language category | Full matches |
| --- | ---: |
| Grammar | 5/8 (62.5%) |
| Indian and everyday English | 2/8 (25.0%) |
| Fragmented and abbreviated | 5/8 (62.5%) |
| Spelling | 1/8 (12.5%) |
| Negation | 3/8 (37.5%) |
| Uncertainty | 4/8 (50.0%) |
| Temporal | 3/8 (37.5%) |
| Hypothetical and attribution | 4/8 (50.0%) |
| Corrections and mixed | 5/8 (62.5%) |
| Unsupported and vague | 8/8 (100%) |

L2 passed its development cases. L3 first measured 16/34 language matches. L4 recovered all 34 known L3 rows, and the L5 rerun still returned 34/34. L5 uses different wording, denominators and span requirements. Its 40/80 is evidence of remaining gaps on this new set.

## Live multi-turn results

**14/15 matched (93.3%)**. One mismatch, zero skipped or blocked. The ten downloaded exports were checked for the expected IDs and states, scripted conversation and evidence schema versions, mode, and inference markers. M07 additionally retained both source proposals, prior accepted evidence, and `blocked_unresolved_conflict`. M14 checked the confirmation control after one activation and restart isolation. Concurrent clicks were outside that browser journey.

| ID | Verified observation | Outcome |
| --- | --- | --- |
| M01 | Generic clarification, then cough proposal with no accepted summary before confirmation. | Match |
| M02 | Confirmed chills present and fever absent. Both survived early stop and export. | Match |
| M03 | Rejected nasal proposal, then confirmed sore throat. Export contained sore throat alone. | Match |
| M04 | Historical chills prompted clarification. Later current nasal evidence was the only exported field. | Match |
| M05 | Diarrhea appeared with a partial clarification prompt. Submitting “My left elbow hurts” replaced the pending card and returned generic clarification. No diarrhea card remained. No evidence was prematurely accepted. | Mismatch |
| M06 | Confirmed fever UNKNOWN, then a concrete fever proposal. Confirming the second proposal surfaced conflict and preserved the earlier state without beginning an interview. | Match, explicit reconciliation remains a usability gap |
| M07 | Confirmed sore throat then contradicted it. UI stopped for conflict. Export retained the prior positive, both literal proposals, and conflict blocking. | Match |
| M08 | Answered pending cough No. Export retained sore throat positive and cough negative. | Match |
| M09 | Answered pending cough Not sure. Export retained nasal positive and cough UNKNOWN. | Match |
| M10 | Stopped before answering cough. Export contained diarrhea alone. | Match |
| M11 | Unknown fictional age stopped context collection. No interview or export appeared. | Match |
| M12 | Confirmed off-question nasal evidence while cough remained pending. After cough No, export contained chills and nasal positives and cough negative. | Match |
| M13 | Unrelated elbow wording prompted a current-question clarification. Later cough No was the only additional exported state. | Match |
| M14 | One confirmation moved to age and removed the confirmation control. Restart cleared the session. | Match |
| M15 | Initial cough denial persisted after a positive fever answer and stop. Export showed chills and fever present, cough absent. | Match |

M05 implicates the single pending candidate in `MedAssistConversation.tsx`, which clears the initial card on editing/submission. The general pain anchors also miss this elbow wording. Preserve unresolved candidate evidence across clarification, retain separate source spans, and make accepting, replacing, or rejecting the earlier proposal explicit. Add collision tests and verify exports from both choices before considering broader NLP.

The real browser ran in SIMULATED mode and displayed Not assessed. Manual Emergency help opened. Widths 390, 820 and 1440 px had a visible composer and no horizontal overflow. The first tablet measurement caught the earlier phone width during resizing, so it was repeated at the verified 820 px width. Screenshots captured a successful summary and the M05 clarification gap. The inspected console showed the Lit development warning and no captured errors.

## Separate warning findings

Fresh probes matched **1/4**. W1 direct emergency-service request interrupted as expected. W2 “Air won't go into my lungs at all” missed the expected interruption. W3 the narrator's quoted breathing statement and W4 the denied ambulance request both interrupted unexpectedly. Frozen L3 warning behavior remains 1/4. These are observations about the provisional literal matcher. Keep manual help available and route changes through a separately authorized, qualified warning review with direct, indirect, quoted and denied cases. No warning rule, expanded safety branch, or Model B behavior changed.

## Priorities and interpretation of failure tags

| Tag | Suspected cause, user impact and correction |
| --- | --- |
| Lexicon | `concepts.ts` uses bounded terms and word forms. Missed familiar or misspelled language causes missing or partial proposals. Add controlled aliases or normalization and collision tests. |
| Polarity | `language-context.ts` and `natural.ts` use simple cues and guards. Coordinated denials, double negation and exception clauses may be missed or overextended. Parse cue scope and exceptions, then validate against full source spans. |
| Certainty | `language-context.ts` lacks some modal and indirect uncertainty cues. Unknown symptoms may be proposed as present. Model clause-local certainty before mapping and share it with validation. |
| Time | `language-context.ts` treats some past, resolved and ongoing forms inconsistently. History may enter current evidence or a continuing symptom may disappear. Handle tense, continuation, and distinct clause time anchors. |
| Attribution | `language-context.ts` relies on limited subject, quotation and conditional patterns. Nested or indirect reports can add another person's symptoms or suppress the speaker's own. Preserve quotation spans, resolve only explicit speakers, and abstain on ambiguous attribution. |
| Retraction | `understanding.ts` has narrow immediate-retraction rules. Discourse markers and corrections of who had a symptom can leave stale positives. Preserve claims as unresolved pending explicit correction. |
| Partial | `understanding.ts` can treat a whole matched clause as covered, while the UI may also ask about a scope detail already excluded. Preserve the unmapped span and ask one discriminating question about genuinely unresolved wording. |

Prioritize polarity, certainty, temporal scope, attribution and multi-turn state integrity before lexical breadth. The 8/8 vague and unsupported rows support preserving narrative and clarification as valid outcomes. Any ontology expansion or constrained NLP/LLM integration requires separate authorization and an evaluation on fresh examples with evidence state and provenance checks. No genuine inference or locked evaluation ran.

## All language cases

Flags: C = confirmation, Q = clarification, X = conflict. Evidence entries use literal source text from the expectation or output. The issue column lists retention failures where present. Tags identify suspected causes and the corresponding implementation direction above.

| ID | Input | Expected evidence and flags | Observed evidence and flags | Result and suspected cause |
| --- | --- | --- | --- | --- |
| L5-01 | A mild cough began this afternoon. | E_201 present [cough] / C | E_201 present [A mild cough began this afternoon] / C | Match |
| L5-02 | My throat has been sore since lunch. | E_97 present [throat has been sore] / C | — / Q | missing E_97 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-03 | I developed chills shortly after breakfast. | E_94 present [chills] / C | E_94 present [I developed chills shortly after breakfast] / C | Match |
| L5-04 | I have had nausea throughout the afternoon. | E_148 present [nausea] / C | — / Q | missing E_148 present, clarification intent mismatch, confirmation intent mismatch · Time |
| L5-05 | I am experiencing diarrhea today. | E_51 present [diarrhea] / C | E_51 present [I am experiencing diarrhea today] / C | Match |
| L5-06 | I feel lightheaded when I stand up. | E_76 present [lightheaded] / C | E_76 present [I feel lightheaded when I stand up] / C | Match |
| L5-07 | My nose feels congested. | E_181 present [nose feels congested] / C | — / Q | missing E_181 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-08 | I have pain around my shoulder. | E_53 present [pain] / C | E_53 present [I have pain around my shoulder] / C | Match |
| L5-09 | Since evening I am getting cough. | E_201 present [cough] / C | E_201 present [Since evening I am getting cough] / C | Match |
| L5-10 | My stomach is doing loose motion today. | E_51 present [loose motion] / C | E_51 present [My stomach is doing loose motion today] / C | Match |
| L5-11 | Throat paining only when talking. | E_53 present [Throat paining] / C | — / Q | missing E_53 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-12 | I feel a bit pukey after lunch. | E_148 present [pukey] / C | — / Q | missing E_148 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-13 | Nose fully blocked yaar. | E_181 present [Nose fully blocked] / C | — / Q | missing E_181 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-14 | Only little dizzy when getting up. | E_76 present [little dizzy] / C | — / Q | missing E_76 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-15 | My head has been aching since lunch. | E_53 present [head has been aching] / C | — / Q | missing E_53 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-16 | I feel shivery and feverish today. | E_94 present [shivery], E_91 present [feverish] / C | E_91 present [feverish today] / CQ | missing E_94 present, clarification intent mismatch · Lexicon |
| L5-17 | cgh since lunch | E_201 present [cgh] / C | — / Q | missing E_201 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-18 | sore throat throat | E_97 present [sore throat] / C | E_97 present [sore throat throat] / C | Match |
| L5-19 | temp high since lunch | — / Q | — / Q | Match |
| L5-20 | chills... nausea... | E_94 present [chills], E_148 present [nausea] / C | E_94 present [chills], E_148 present [nausea] / C | Match |
| L5-21 | nose blocked no cough | E_181 present [nose blocked], E_201 absent [no cough] / C | E_201 absent [nose blocked no cough] / C | missing E_181 present · Polarity |
| L5-22 | fevr nd cough | E_91 present [fevr], E_201 present [cough] / C | E_201 present [fevr nd cough] / C | missing E_91 present · Lexicon |
| L5-23 | head ache bad since noon | E_53 present [head ache] / C | E_53 present [head ache bad since noon] / C | Match |
| L5-24 | diarrhoea twice today | E_51 present [diarrhoea] / C | E_51 present [diarrhoea twice today] / C | Match |
| L5-25 | Still couffing this afternoon. | E_201 present [couffing] / C | — / Q | missing E_201 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-26 | My throat feels soor. | E_97 present [throat feels soor] / C | — / Q | missing E_97 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-27 | Feeling nausous today. | E_148 present [nausous] / C | — / Q | missing E_148 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-28 | I have diarrea since noon. | E_51 present [diarrea] / C | — / Q | missing E_51 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-29 | Chillls after lunch. | E_94 present [Chillls] / C | — / Q | missing E_94 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-30 | I feel light headed today. | E_76 present [light headed] / C | — / Q | missing E_76 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-31 | My nose is stufy. | E_181 present [nose is stufy] / C | — / Q | missing E_181 present, clarification intent mismatch, confirmation intent mismatch · Lexicon |
| L5-32 | My kid has a coath with a torn button. | — / Q | — / Q | Match |
| L5-33 | Cough is absent, but the fictional person has a sore throat. | E_201 absent [Cough is absent], E_97 present [sore throat] / C | E_201 absent [Cough is absent], E_97 present [the fictional person has a sore throat] / C | Match |
| L5-34 | No chills or fever today. | E_94 absent [No chills], E_91 absent [No chills or fever] / C | — / Q | missing E_94 absent, missing E_91 absent, clarification intent mismatch, confirmation intent mismatch · Polarity |
| L5-35 | I haven't got a blocked nose, but I have nausea. | E_181 absent [haven't got a blocked nose], E_148 present [nausea] / C | E_181 absent [I haven't got a blocked nose], E_148 present [I have nausea] / C | Match |
| L5-36 | I don't have diarrhea and I do have chills. | E_51 absent [don't have diarrhea], E_94 present [do have chills] / C | E_51 absent [I don't have diarrhea], E_94 present [I do have chills] / C | Match |
| L5-37 | I wouldn't say I'm not feverish. | — / Q | E_91 absent [I wouldn't say I'm not feverish] / C | unexpected E_91 absent, missing narrative span not feverish, clarification intent mismatch, confirmation intent mismatch · Polarity |
| L5-38 | No pain apart from an aching head. | E_53 present [aching head] / C | E_53 absent [No pain apart from an aching head] / C | wrong state E_53 present→absent · Polarity |
| L5-39 | Neither fever nor cough today. | E_91 absent [Neither fever], E_201 absent [Neither fever nor cough] / C | — / Q | missing E_91 absent, missing E_201 absent, clarification intent mismatch, confirmation intent mismatch · Polarity |
| L5-40 | My nose is blocked, not my throat. | E_181 present [nose is blocked] / C | E_181 present [My nose is blocked] / CQ | clarification intent mismatch · Partial |
| L5-41 | I suspect I may have nausea. | E_148 unknown [may have nausea] / C | E_148 present [I suspect I may have nausea] / C | wrong state E_148 unknown→present · Certainty |
| L5-42 | Hard to tell whether there is a fever. | E_91 unknown [Hard to tell] / C | E_91 present [Hard to tell whether there is a fever] / C | wrong state E_91 unknown→present · Certainty |
| L5-43 | Perhaps I'm a little lightheaded, but I definitely have chills. | E_76 unknown [Perhaps], E_94 present [definitely have chills] / C | E_76 unknown [Perhaps I'm a little lightheaded], E_94 present [I definitely have chills] / C | Match |
| L5-44 | I might be coughing or just clearing my throat. | E_201 unknown [might be coughing] / C | E_201 unknown [I might be coughing or just clearing my throat] / C | Match |
| L5-45 | I'm unsure about diarrhea. My nose is blocked. | E_51 unknown [unsure], E_181 present [nose is blocked] / C | E_51 unknown [I'm unsure about diarrhea], E_181 present [My nose is blocked] / C | Match |
| L5-46 | I can't tell if my throat is sore. | E_97 unknown [can't tell] / C | E_97 present [I can't tell if my throat is sore] / C | wrong state E_97 unknown→present · Certainty |
| L5-47 | Possible fever, no chills. | E_91 unknown [Possible fever], E_94 absent [no chills] / C | E_91 present [Possible fever], E_94 absent [no chills] / C | wrong state E_91 unknown→present · Certainty |
| L5-48 | I don't know if it counts as a cough. | E_201 unknown [don't know] / C | E_201 unknown [I don't know if it counts as a cough] / C | Match |
| L5-49 | On Monday I felt feverish, but I'm fine today. | — / Q | E_91 present [On Monday I felt feverish] / CQ | unexpected E_91 present, missing narrative span On Monday, confirmation intent mismatch · Time |
| L5-50 | I had chills at breakfast and still have them now. | E_94 present [still have them now] / C | — / Q | missing E_94 present, clarification intent mismatch, confirmation intent mismatch · Time |
| L5-51 | I used to cough. This afternoon I have diarrhea. | E_51 present [diarrhea] / CQ | E_51 present [This afternoon I have diarrhea] / CQ | Match |
| L5-52 | My fever went away; I have a sore throat now. | E_97 present [sore throat] / CQ | E_91 present [My fever went away], E_97 present [I have a sore throat now] / C | unexpected E_91 present, missing narrative span fever went away, clarification intent mismatch · Time |
| L5-53 | I have been coughing since Friday. | E_201 present [coughing] / C | E_201 present [I have been coughing since Friday] / C | Match |
| L5-54 | Chills are over, nausea is still here. | E_148 present [nausea] / CQ | E_94 present [Chills are over], E_148 present [nausea is still here] / C | unexpected E_94 present, missing narrative span Chills are over, clarification intent mismatch · Time |
| L5-55 | I felt sick to my stomach this morning, but it has stopped. | — / Q | — / Q | Match |
| L5-56 | Yesterday no fever. Today my throat is sore. | E_97 present [throat is sore] / CQ | E_91 absent [Yesterday no fever], E_97 present [Today my throat is sore] / C | unexpected E_91 absent, clarification intent mismatch · Time |
| L5-57 | Would chills happen if I caught a cold? | — / Q | E_94 present [Would chills happen if I caught a cold] / C | unexpected E_94 present, missing narrative span chills, clarification intent mismatch, confirmation intent mismatch · Attribution |
| L5-58 | Tomorrow I might develop nausea, but right now I have a cough. | E_201 present [cough] / CQ | E_148 unknown [Tomorrow I might develop nausea], E_201 present [right now I have a cough] / C | unexpected E_148 unknown, missing narrative span Tomorrow, clarification intent mismatch · Attribution |
| L5-59 | My neighbour texted me that her throat is sore. | — / Q | E_97 present [My neighbour texted me that her throat is sore] / C | unexpected E_97 present, missing narrative span throat is sore, clarification intent mismatch, confirmation intent mismatch · Attribution |
| L5-60 | A friend wrote “I feel feverish”; I feel nauseated myself. | E_148 present [nauseated] / CQ | E_148 present [I feel nauseated myself] / CQ | Match |
| L5-61 | If there were a cough, chills might follow. | — / Q | — / Q | Match |
| L5-62 | My aunt said ‘the nurse told me “I have diarrhea”’ and I only have a sore throat. | E_97 present [sore throat] / CQ | — / Q | missing E_97 present, confirmation intent mismatch · Attribution |
| L5-63 | He is coughing. My nose is blocked. | E_181 present [nose is blocked] / CQ | E_181 present [My nose is blocked] / CQ | Match |
| L5-64 | Imagine I have a fever; would that count as a symptom? | — / Q | — / Q | Match |
| L5-65 | There's nausea. Wait, I take that back. | E_148 contradiction [take that back] / CQX | E_148 present [There's nausea] / CQ | wrong state E_148 contradiction→present, conflict intent mismatch · Retraction |
| L5-66 | My throat is sore. Sorry, that was my brother. | — / Q | E_97 present [My throat is sore] / CQ | unexpected E_97 present, confirmation intent mismatch · Attribution |
| L5-67 | I have no cough, but I am coughing now. | E_201 contradiction [coughing now] / CQX | E_201 contradiction [I have no cough, but I am coughing now.] / CQX | Match |
| L5-68 | I have chills. Correction, I do not have chills. | E_94 contradiction [Correction] / CQX | E_94 contradiction [I have chills. Correction, I do not have chills.] / CQX | Match |
| L5-69 | I feel lightheaded and my wrist tingles. | E_76 present [lightheaded] / CQ | E_76 present [I feel lightheaded] / CQ | Match |
| L5-70 | I've got the runs; my belly also feels bubbly. | E_51 present [the runs] / CQ | E_51 present [I've got the runs] / CQ | Match |
| L5-71 | Blocked nose plus a funny taste in my mouth. | E_181 present [Blocked nose] / CQ | E_181 present [Blocked nose plus a funny taste in my mouth] / C | missing narrative span funny taste, clarification intent mismatch · Partial |
| L5-72 | Head hurts. My foot is numb. | E_53 present [Head hurts] / CQ | E_53 present [Head hurts] / CQ | Match |
| L5-73 | My chest feels fluttery. | — / Q | — / Q | Match |
| L5-74 | Things look doubled today. | — / Q | — / Q | Match |
| L5-75 | My ears are ringing. | — / Q | — / Q | Match |
| L5-76 | My knee keeps giving way. | — / Q | — / Q | Match |
| L5-77 | I threw up once after lunch. | — / Q | — / Q | Match |
| L5-78 | A woozy sort of feeling. | — / Q | — / Q | Match |
| L5-79 | My nose keeps dripping. | — / Q | — / Q | Match |
| L5-80 | I just feel off today. | — / Q | — / Q | Match |
