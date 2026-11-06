# MedAssist Stage 3 / L6 semantic and multi-turn integrity

**2026-11-06 · `feat/medassist-jayanth` · starting SHA `d0e39d156ccca44b0169028e01f978176a1f17b2`**

## Root causes and changes

| Code area | L5 failure | L6 correction |
| --- | --- | --- |
| `language-context.ts` and `natural.ts` | Coordination either lost a denial or attributed it to the wrong symptom. Ambiguous exceptions and double negation could produce a definite negative. | Keep a literal cue span for coordinated negatives. Reset scope at independent assertions and leave ambiguous fragments and exceptions unresolved. Validate against the scoped source. |
| `language-context.ts` | “Possible,” “may have,” and indirect uncertainty were absent from the shared cues. Resolved and past wording could appear current, while ongoing perfect-tense wording was dropped. | Preserve UNKNOWN. Distinguish past dates, resolution, ongoing wording, and future or conditional descriptions. Preserve other current clauses. |
| `language-context.ts` and `understanding.ts` | Indirect reports, a quote followed by an explicit self-report, and retractions with discourse markers were misread. | Bound attributed and conditional scope, recognize explicit speaker corrections, and record immediate retractions as conflict when one preceding positive can be identified. |
| `understanding.ts` and `language-context.ts` | A valid symptom could hide an unstructured detail in the same clause. | Treat explicit “plus” as a boundary and retain the unmatched clause. |
| `MedAssistConversation.tsx` and `pending-proposal.ts` | Editing and submitting cleared the existing candidate before evaluating the new clarification. | Keep pending sources through failed clarification. Combine compatible additions by field with original source records, deduplicate equivalent evidence, and block confirmation on incompatible additions until the user chooses which proposal set to review. Review choices still require confirmation. |

## Frozen comparisons

The L3 and L5 inputs, expectations, evaluators and baseline reports were preserved. These cases were visible during L6. Results are regression comparisons.

| Measure | Before L6 | After L6 |
| --- | ---: | ---: |
| L3 exact language matches | 34/34 | 34/34 |
| L5 exact language matches | 40/80 | 59/80 |
| L5 missing IDs | 25 | 20 |
| L5 wrong states | 6 | 0 |
| L5 unexpected IDs | 9 | 0 |
| L5 incorrect positives / negatives / UNKNOWN | 11 / 3 / 1 | 0 / 0 / 0 |
| L3 and L5 warning probes, each | 1/4 | 1/4 |

Recovered L5 rows: 04, 34, 37, 39, 41, 42, 46, 47, 49, 52, 54, 56, 57, 58, 59, 62, 65, 66, 71. The comparison introduced no new mismatches. Remaining rows are 02, 07, 11–17, 21–22, 25–31, 38, 40 and 50. These mostly concern spelling and bounded vocabulary. In addition, the parser abstains on the pain exception in 38, asks an extra clarification in 40, and misses the pronoun-linked continuing chills in 50. Generic elbow wording still stays narrative. No broad lexical expansion was made.

## Live evidence and follow-up

The L5 browser baseline was 14/15. L6 replayed M05 and targeted contrast journeys, rather than rescoring all 15. M05 retained the diarrhea proposal through failed elbow mapping. A later nausea proposal was added, and confirmation and export preserved both literal source spans. The unrecognized clarification remained unconfirmed. A conflicting nausea draft disabled confirmation until a review choice. Selecting the newer denial and then confirming exported the denial and an independent chills positive. The earlier nausea-positive draft remained unconfirmed.

The simulated browser also checked coordinated denial, UNKNOWN, historical and future abstention, conditional and third-party wording, immediate retraction, explicit rejection, manual help, and 390/820/1440 px layouts. Inspected console logs showed the expected Lit warning and no captured errors.

Next, evaluate bounded spelling and colloquial coverage with contrastive near-matches and a fresh fictional set. Include pain exceptions, pronoun-linked continuity, and clarification specificity. Keep the known three warning findings in the separate safety work package. The nine-field ontology, research protocol, disabled Model B, and emergency rules remain intact. No genuine model inference or provider call was used.
