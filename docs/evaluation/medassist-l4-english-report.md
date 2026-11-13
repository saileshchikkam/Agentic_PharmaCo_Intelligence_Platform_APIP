# MedAssist Stage 3 / L4 English remediation

Baseline `60b2655f50c46a69424f9658ac9fb9988bb5c4f8`. The [L3 corpus](medassist-l3-english-v1.json), [baseline report](medassist-l3-english-report.md) and evaluator are fixed. L3 cases were visible during L4 development. This comparison measures regression recovery on known cases.

| Measure | L3 | L4 |
| --- | ---: | ---: |
| Full language matches | 16/34 | 34/34 |
| Missing expected evidence | 12 | 0 |
| Wrong state on an expected ID | 4 | 0 |
| Unexpected evidence ID | 2 | 0 |
| Unsupported positive proposals | 6 | 0 |
| Warning-presentation matches | 1/4 | 1/4 |

Recovered cases: L3-04, 06–09, 13–15, 17, 20–26, 28 and 34. All other language rows retained their baseline match. Run `node --import tsx scripts/medassist-l3-evaluate.ts` for individual outputs. The evaluator checks the original corpus digest.

## Interpretation changes

- `language-context.ts` and `natural.ts` share explicit negation and uncertainty cues. “Free of fever” retains absence. “Could be,” “possibly,” “not certain,” and “wonder if” retain UNKNOWN when tied to a supported symptom. Ambiguous double negation and inherited uncertainty without a clear independent assertion remain unresolved.
- Resolution is clause-local, with a narrow backward link for wording such as “it is gone” or “not now.” Past reports, conditional continuations, quotes and attributed speech stay outside current evidence. A mixed statement can still propose a separately asserted current symptom.
- `understanding.ts` handles immediate retractions, including “Actually, I don't” and “I take that back,” as conflict when the preceding positive identifies one supported field. Source quotes and offsets are retained.
- `concepts.ts` adds bounded phrases and spelling variants for existing fields. There is no fuzzy matching. The existing UI shows partial proposals beside unmapped wording and asks about the remaining current symptom. Accepted evidence still requires explicit confirmation.

## Separate warning-presentation work package

The provisional warning matcher evaluates literal phrases before the language interpreter. As a result, “I can't get any air in” still misses the expected interruption, and quoted “I cannot breathe” and denied “I need an ambulance” still interrupt. This language task leaves those rules intact. Manual Emergency help passed in the browser.

Under separate safety authorization, freeze a fictional warning corpus that distinguishes direct, indirect, quoted, denied, hypothetical, historical and third-person statements. Record interruption decisions and manual-help availability separately from language extraction. Review both missed and unexpected interruptions, including mixed clauses and preservation of direct explicit warnings. Use independent qualified review before considering any change to clinical behavior. Keep Model B disabled and the expanded emergency branch isolated.

## Remaining boundaries

The nine fields cannot encode every reported concept. Bare warmth, giddiness, scratchiness, unspecified discharge, spinning and generic vomiting may still need clarification or narrative retention. Scope rules are bounded, especially for nested quotes, indirect references and multi-turn retractions. Next, freeze a fresh fictional challenge set with separately authored expectations and include multi-turn correction and partial-evidence behavior. Genuine Model A and provider inference remain separate.
