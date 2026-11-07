# MedAssist Stage 3 / L7 — fresh fictional English and multi-turn evaluation

**2026-11-07 · evaluation only · branch `feat/medassist-jayanth`**
Starting local and directly verified GitHub SHA: `60c53c3ae7590205f7e9d4aab948f1d0a8a67efe`. Starting tree was clean.

## Purpose, freeze and independence

L7 measures the unchanged post-L6 scripted implementation on separately authored fictional English. It does not evaluate genuine Model A, any LLM, clinical outcomes or representative real-world accuracy. No application/parser/validator/model source was changed.

The [frozen corpus](medassist-l7-english-v1.json) has **110 distinct single-turn descriptions, 20 new multi-turn journeys, four separate known-limit probes and four historical warning probes**. Eleven language categories each contain ten single turns. The same assistant authored expectations after reviewing contracts/prior reports and then executed them. There was no external annotator, human clinical adjudication, blinding or population sampling. Exact sentence-overlap checks against prior L3/L5 JSON and T01–T35/post-L6 test source found none; shared symptom concepts and known rule vocabulary necessarily overlap.

Version: **medassist-l7-english-v1**. Freeze time: **2026-11-07T06:40:20.635Z**. SHA-256 over UTF-8 LF without BOM:

`d107ff88fb601c1ac5581db8817a9fdc489b012387172c7e81e842f6606dc3b8`

The manifest and authoring file were saved before the first parser run. The evaluator pins the literal digest. The authoring command refuses to overwrite the existing corpus. This supplies inspectable local sequencing, not an externally notarized or blinded freeze. The first measured results are preserved; expectations were not changed.

Every case fixes IDs/states, minimum literal source spans, speaker/temporal meaning, clarify/abstain/confirm/conflict intent and transition requirements. Only the existing nine scripted IDs are allowed: E_201 cough, E_91 fever, E_97 sore throat, E_181 nasal congestion/clear runny nose, E_94 chills, E_53 general pain, E_148 nausea, E_51 diarrhea and E_76 slight dizziness/lightheadedness.

## Scoring and exact single-turn results

A full case requires the frozen evidence set, state, source spans, retention check, interaction flags and valid provenance. Clarification is projected from the current parser and existing pain prompt; helpful wording is sampled in the browser. Speaker/temporal measures below are evidence-set correctness within those subsets, not separately validated discourse annotations. Exit 0 from the evaluator means measurement completed, not that every case passed.

**61/110 full matches (55.5%), 49 mismatches, zero skipped or blocked.**
Evidence-ID/state sets alone match **76/110**. This supplementary figure does not replace the frozen full score.

| Metric | Numerator / denominator |
| --- | ---: |
| fullCases | 61/110 (55.5%) |
| expectedIdRecall | 86/110 (78.2%) |
| expectedIdStateRecall | 78/110 (70.9%) |
| unexpectedIds | 5/91 (5.5%) |
| wrongStates | 8/91 (8.8%) |
| missingObservations | 24/110 (21.8%) |
| incorrectPositive | 11/56 (19.6%) |
| incorrectNegative | 1/24 (4.2%) |
| incorrectUnknown | 0/8 (0.0%) |
| negationEvidenceCases | 16/23 (69.6%) |
| uncertaintyEvidenceCases | 7/14 (50.0%) |
| temporalEvidenceCases | 9/10 (90.0%) |
| speakerEvidenceCases | 8/10 (80.0%) |
| appropriateAbstention | 24/26 (92.3%) |
| clarificationIntent | 78/110 (70.9%) |
| confirmationIntent | 89/110 (80.9%) |
| evidenceProvenance | 91/91 (100.0%) |
| annotationOffsets | 186/186 (100.0%) |

Incorrect-emission denominators are emissions of that state. Unexpected IDs/wrong states use all 91 emissions; missing observations and recall use all 110 expected observations. There is also **1/3 incorrect contradiction emissions**, in L7-092. Thus 78 correct pairs + 8 wrong states + 5 unexpected IDs = 91 emitted; 78 correct + 8 wrong + 24 missing = 110 expected. The 13 incorrect emissions comprise 11 positives, one negative and one contradiction. There are no out-of-vocabulary emissions.

| Category | Full matches |
| --- | ---: |
| proper English | 10/10 (100.0%) |
| everyday English | 2/10 (20.0%) |
| Indian conversational English | 4/10 (40.0%) |
| fragments and abbreviations | 7/10 (70.0%) |
| new spelling variations | 0/10 (0.0%) |
| multiple complaints and correction | 8/10 (80.0%) |
| negation and exceptions | 6/10 (60.0%) |
| uncertainty and alternatives | 4/10 (40.0%) |
| temporal and hypothetical | 6/10 (60.0%) |
| speakers and quotation | 6/10 (60.0%) |
| unsupported and vague | 8/10 (80.0%) |

Literal provenance passed for 91/91 emitted quotes and 186/186 annotation offsets. These checks do not make a semantically incorrect positive safe.

## Complete failed-case matrix

All 49 original mismatches remain below; no failed row was excluded. See the [complete 110-row readable matrix](medassist-l7-case-matrix.md) and [all case results and annotations](medassist-l7-results.json) for the inventory, flags, quotes and known probes.

| ID | Input | Frozen evidence | Observed evidence | Failure / root-cause hypothesis |
| --- | --- | --- | --- | --- |
| L7-012 | My tummy hurts while I'm sitting here. | E_53 present | ∅ | missing E_53 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-013 | I feel ready to puke, though nothing has come up. | E_148 present | ∅ | missing E_148 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-014 | My nose won't stop dripping clear water. | E_181 present | ∅ | missing E_181 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-015 | My throat's sore after that meeting. | E_97 present | ∅ | missing E_97 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-016 | I feel a little light-headed right this minute. | E_76 present | ∅ | missing E_76 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-017 | No runs today, just a cough. | E_51 absent, E_201 present | ∅ | missing E_51 absent; missing E_201 present; clarification intent; abstain intent; confirmation intent — Negation/exception scope loses supported evidence |
| L7-018 | I feel sick, but I can't tell what kind of sick. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-019 | My head feels heavy, not painful. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-021 | Cough is coming again and again today only. | E_201 present | E_201 present | clarification intent — Clarification specificity / rubric |
| L7-023 | For me nose getting blocked now, yaar. | E_181 present | ∅ | missing E_181 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-025 | Vomiting sensation coming, no actual vomit. | E_148 present | ∅ | missing E_148 present; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-027 | Throat little sore only, no cough also. | E_97 present, E_201 absent | E_201 absent | missing E_97 present; clarification intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-028 | I am doubting whether this is fever or not. | E_91 unknown | E_91 absent | wrong state E_91: absent expected unknown — Polarity, uncertainty or speaker scope |
| L7-030 | Stomach gas problem only, cannot explain more. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-031 | cough / chills / sore throat, all now | E_201 present, E_94 present, E_97 present | E_201 present, E_97 present, E_94 present | clarification intent — Clarification specificity / rubric |
| L7-033 | fever? unsure. | E_91 unknown | E_91 present | wrong state E_91: present expected unknown; clarification intent — Polarity, uncertainty or speaker scope |
| L7-036 | HA since tea; sore throat too | E_53 present, E_97 present | E_97 present | missing E_53 present; clarification intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-041 | My coff has lasted all afternoon. | E_201 present | ∅ | missing E_201 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-042 | I have a feever at the moment. | E_91 present | ∅ | missing E_91 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-043 | A soar throat started just now. | E_97 present | ∅ | missing E_97 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-044 | I feel nausia during this ride. | E_148 present | ∅ | missing E_148 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-045 | Diarrhoe today, definitely happening. | E_51 present | ∅ | missing E_51 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-046 | Nose is stufffed, no cough. | E_181 present, E_201 absent | E_201 absent | missing E_181 present; clarification intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-047 | I do not have a couugh today. | E_201 absent | ∅ | missing E_201 absent; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-048 | Maybe this is a fevar. | E_91 unknown | ∅ | missing E_91 unknown; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-049 | Chils have started while I wait. | E_94 present | ∅ | missing E_94 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-050 | I feel liteheaded at this instant. | E_76 present | ∅ | missing E_76 present; clarification intent; abstain intent; confirmation intent — Bounded vocabulary / phrase coverage (HA needs adjudication) |
| L7-055 | I have a headache but no cough or nausea. | E_53 present, E_201 absent, E_148 absent | E_53 present, E_201 absent, E_148 absent | clarification intent — Clarification specificity / rubric |
| L7-058 | Only a sore throat; my aunt has nausea. | E_97 present | E_97 present, E_148 present | unexpected E_148 present; clarification intent — Unsupported positive / attribution / temporal scope |
| L7-062 | There isn't any fever now. | E_91 absent | E_91 present | wrong state E_91: present expected absent — Polarity, uncertainty or speaker scope |
| L7-064 | I deny having chills or a cough. | E_94 absent, E_201 absent | ∅ | missing E_94 absent; missing E_201 absent; clarification intent; abstain intent; confirmation intent — Negation/exception scope loses supported evidence |
| L7-068 | Apart from my painful head, nothing hurts. | E_53 present | ∅ | missing E_53 present; clarification intent; abstain intent; confirmation intent — Negation/exception scope loses supported evidence |
| L7-069 | There is pain nowhere except in my stomach. | E_53 present | E_53 present | clarification intent — Clarification specificity / rubric |
| L7-071 | I cannot decide whether I have a cough. | E_201 unknown | E_201 present | wrong state E_201: present expected unknown — Polarity, uncertainty or speaker scope |
| L7-073 | There may be nausea, I'm honestly unsure. | E_148 unknown | E_148 present | wrong state E_148: present expected unknown; clarification intent — Polarity, uncertainty or speaker scope |
| L7-076 | I think my nose is blocked, but I'm not sure. | E_181 unknown | E_181 present | wrong state E_181: present expected unknown; clarification intent — Polarity, uncertainty or speaker scope |
| L7-077 | Sore throat or just a dry mouth; I can't tell. | E_97 unknown | E_97 present | wrong state E_97: present expected unknown — Polarity, uncertainty or speaker scope |
| L7-079 | Either chills or fever, I cannot distinguish. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-080 | My guess is nausea rather than pain; I don't really know. | ∅ | E_53 present, E_148 present | unexpected E_53 present; unexpected E_148 present; abstain intent; confirmation intent — Unsupported positive / attribution / temporal scope |
| L7-082 | My cough stopped at dawn. I currently have chills. | E_94 present | E_201 present, E_94 present | unexpected E_201 present; clarification intent — Unsupported positive / attribution / temporal scope |
| L7-084 | My nose was blocked an hour ago, but it is clear now. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-086 | Suppose nausea started, would that be relevant? | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-088 | A cough began earlier and remains present right now. | E_201 present | E_201 present | clarification intent — Clarification specificity / rubric |
| L7-092 | My colleague has chills, but I have no chills. | E_94 absent | E_94 contradiction | wrong state E_94: contradiction expected absent; conflict intent — Polarity, uncertainty or speaker scope |
| L7-097 | We both have a cough, including me. | E_201 present | E_201 present | clarification intent — Clarification specificity / rubric |
| L7-098 | My fictional son feels slightly dizzy. I feel fine. | ∅ | E_76 present | unexpected E_76 present; abstain intent; confirmation intent — Unsupported positive / attribution / temporal scope |
| L7-099 | A stranger wrote, 'I have fever and chills'. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-106 | I feel off-colour and washed out. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |
| L7-109 | My nose has green mucus, no other detail. | ∅ | ∅ | missing retained wording — Whole-sentence retention scorer vs split clauses |

The primary failure grouping is 19 vocabulary/phrase cases, three missing-evidence scope cases, eight wrong-state cases, four unexpected-positive cases, six clarification-only cases and nine retention-only cases. Groups total 49 cases; individual issue dimensions overlap.

## Adjudication and measurement limitations — original labels retained

Nine cases (018, 019, 030, 079, 084, 086, 099, 106, 109) fail only the whole-sentence retained-wording check. The parser splits punctuation/conjunctions into literal clauses, and the scorer cannot reconstruct some complete input strings. This is a retention-measurement limitation, not proof that the original user message disappeared. The browser directly displayed the complete L7-018 input. These cases remain failures in 61/110; no score was silently repaired.

L7-010, the knee-aching description, was frozen as unsupported/abstain, but E_53 general pain may plausibly represent its intended meaning. L7-036 “HA” may require clarification rather than a forced headache mapping. L7-069 requests clarification although stomach location is explicit; the desired level of further description needs a clearer rubric. These are expectation/adjudication issues for future rubric review. Original labels, observations and denominators remain intact. No human review has occurred.

Six clarification-only failures include unnecessary fragments (“again,” “all now,” “including me”), a general-pain prompt despite “headache,” and expected-vs-current specificity. Helpful clarification quality is not captured completely by one Boolean.

## Actual multi-turn browser evaluation

**19/20 journeys matched; one application failure; zero skipped or blocked journeys.** Sixteen JSON exports were downloaded/read: 15 matched expected sets, one exposed stale evidence. Four journeys correctly lacked an export after negative-only context, UNKNOWN conflict, missing age or restart. M04's negative-only acceptance is verified by proposal/review/acknowledgement UI, not an unavailable JSON export.

| ID | New journey | Result / evidence |
| --- | --- | --- |
| L7-M01 | clarification addition | Match — downloaded JSON checked |
| L7-M02 | compatible pending addition | Match — downloaded JSON checked |
| L7-M03 | unsupported preserves pending | Match — downloaded JSON checked |
| L7-M04 | pending opposite review newer | Match — manually adjudicated DOM-spacing assertion; original evidence preserved |
| L7-M05 | pending opposite review earlier | Match — downloaded JSON checked |
| L7-M06 | rejected draft replacement | Match — downloaded JSON checked |
| L7-M07 | UNKNOWN before positive | Match — UI state/no-export condition checked |
| L7-M08 | negative confirmation | Match — downloaded JSON checked |
| L7-M09 | follow-up UNKNOWN | Match — downloaded JSON checked |
| L7-M10 | accepted contradiction | Match — prior positive retained, export explicitly blocked |
| L7-M11 | third party follow-up | Match — downloaded JSON checked |
| L7-M12 | history then current | Match — downloaded JSON checked |
| L7-M13 | pending temporal retraction | FAIL — resolution still allowed current cough confirmation and export |
| L7-M14 | multiple initial symptoms | Match — downloaded JSON checked |
| L7-M15 | off-question addition | Match — downloaded JSON checked |
| L7-M16 | pending uncertain collision | Match — downloaded JSON checked |
| L7-M17 | early stop missing fields | Match — downloaded JSON checked |
| L7-M18 | duplicate pending wording | Match — downloaded JSON checked |
| L7-M19 | uncertain context refuses progression | Match — UI state/no-export condition checked |
| L7-M20 | restart isolates accepted state | Match — UI state/no-export condition checked |

M13: “I have a cough during this shift.” followed by “That cough has stopped now.” left cough Yes confirmable. Confirmation, fictional age 29/F and stop yielded current E_201 positive in summary and export, although the frozen journey required the resolved/stale proposal to be blocked. The newer source stayed unconfirmed, and its annotation was incorrectly current; the progression detail “stopped” did not alter that classification. This is semantic/state integrity failure, even though literal offsets and the visible summary agree with the corrupted accepted evidence. The [saved failure screenshot](screenshots/l7-stale-pending.jpg) and browser export records preserve the result.

Source hypotheses: `language-context.ts` recognizes narrow pronoun-specific resolution cues and misses noun-subject “That cough has stopped.” `pending-proposal.ts` deduplicates equal ID/state values; the UI does not reconcile the resolution detail before keeping the old candidate. Future work must address both semantic resolution and pending/accepted transitions, rather than erasing all pending evidence on unsupported text.

The first browser tally was 18 matches and two failed checks. M04's automated text assertion used accessibility/DOM spacing that did not match the split rendered label. A replay repeated that locator problem. The observed accessibility tree showed chills No after choosing the newer draft, enabled confirmation, and the subsequent negative-only acknowledgement without an interview. It was manually adjudicated as a match with unchanged expectations. [First results](medassist-l7-browser-first-results.json) and the final record's explanation are retained. M13 remains failed.

M07 safely stopped when a confirmed UNKNOWN was followed by positive evidence. This passes its conservative transition expectation; explicit UNKNOWN reconciliation remains a known usability gap. Duplicate pending descriptions produced one accepted field. Conflicting drafts required a review choice and then explicit confirmation. Sampled summaries were consistent with their exports, including the M13 semantic failure.

## Real preview, console and diagnostics

The actual Windows preview was opened at [the existing local route](http://127.0.0.1:3000/#/preview/medassist-conversation), visibly SIMULATED with Model A inference off and urgency unassessed. Browser samples reproduced both “There isn't any fever now” incorrectly proposing fever Yes and “I cannot decide whether I have a cough” incorrectly proposing cough Yes. They still awaited explicit confirmation. A mixed nasal-positive/throat-negative case, vague clarification, UNKNOWN, multiple symptoms and full conversation controls were checked.

Manual Emergency help opened and paused the ordinary composer. No fictional test call, location permission or Maps request was made. Existing loopback development server was reused after a redundant startup reported an occupied port. Health and listener checks confirmed development mode on 127.0.0.1:3000 with legacy agents disabled.

Phone 390×844, tablet 820×1180 and desktop 1440×1000 were observed with document widths 375, 805 and 1425 respectively; no horizontal overflow was measured. Controls remained accessible by scrolling. [Phone](screenshots/l7-mobile.jpg), [tablet](screenshots/l7-tablet.jpg), [desktop](screenshots/l7-desktop.jpg), [negation failure](screenshots/l7-negation-error.jpg).

Inspected console logs contained the Lit development warning and no captured errors. **Complete browser network capture was blocked by tool capability:** the supported surface exposes no network trace capability and read-only evaluation does not expose performance entries. No complete request trace or absence of all external requests is claimed. Code-path review, simulation markers and existing security regressions separately support the restricted inference status. [Diagnostics](medassist-l7-browser-diagnostics.json) record this limit. Preview was left open.

## Known sets, safety and regression verification

| Check | Actual result |
| --- | --- |
| Existing focused regression suite | 290 passed; zero failed/skipped/cancelled |
| New L7 corpus/result/browser integrity checks | 7 passed; zero failed/skipped/cancelled |
| Fresh single-turn evaluation | 61 matches, 49 mismatches; all 110 scored |
| Fresh multi-turn evaluation | 19 matches, 1 application failure; all 20 assessed |
| Existing L3 language / warning comparison | 34/34 and 1/4 |
| Existing L5 language / warning comparison | 79/80 and 1/4 |
| TypeScript | Passed |
| Production build | Passed, 345 modules; existing large-chunk advisory |
| Full browser network trace | Blocked by available diagnostic capability |

The 297 passing software/integrity checks do not mean 297 successful language cases. New integrity tests verify freeze, coverage, exact novelty, denominator arithmetic, source provenance, UNKNOWN/conflict markers and unchanged implementation. They deliberately preserve evaluation failures.

Historical pain exception, multiple-referent continuity, “from yesterday” ambiguity/duplicate retained narrative and confirmed-UNKNOWN reconciliation are separate known probes, excluded from 110. Their outcomes remain in the JSON; K4 is reviewed through the corresponding conservative browser transition, not treated as a newly solved limitation.

Warning probes remain **1/4**: direct emergency declaration interrupts; indirect inability to get air misses; quoted breathing difficulty and a negated ambulance request interrupt incorrectly. These historical probes are separate from L7 language results. No emergency rule or expanded-branch merge occurred.

The L3 34/34 and L5 79/80 repeated results coexist with L7 61/110. Corpora, scoring and denominators differ; the L7 retention/rubric limitations also prevent a clean numerical accuracy comparison. The new misspellings all failed full-case expectations (0/10), showing poor coverage beyond the allowlisted development spellings.

## Prioritized next development task — no implementation begun

1. **P0: context-aware polarity, uncertainty, attribution and temporal-state integrity.** Address isn't/indirect uncertainty/punctuation scope; distinguish aunt, colleague and modified caregiver references; recognize explicit noun-subject resolution. Reconcile resolution before pending deduplication and block stale current confirmation/export. Preserve unrelated pending facts, literal source records, UNKNOWN, user review and accepted-history provenance.
2. **P1: prospective vocabulary and clarification coverage.** Design new contrasts for missed everyday/Indian phrases and common spelling families, with collision controls. Avoid unrestricted fuzzy mapping and guessing abbreviations. Use targeted clarification when meaning is uncertain.
3. **P1: evaluation-rubric work.** Separately document/adjudicate retention reconstruction, ambiguous HA and pain/clarification labels. Do not rewrite frozen L7 expectations; any revised rubric requires a new version and paired reporting.
4. **Separate safety/runtime workstreams.** Warning qualification and genuine Model A asset/runtime verification remain separately gated. Broad ontology expansion or an NLP/LLM extractor needs independent evaluation and explicit future scope.

The recommended immediate implementation task is **Stage 3 post-L7 context and stale-evidence integrity remediation**, with no newly invented historical task number. Add fresh prospective contrasts, rerun L7 as a known development comparison and preserve its original results. Do not automatically begin it.

## Reproduction and boundaries

Use Node 24 from the existing checkout:

```powershell
node --import tsx scripts/medassist-l7-evaluate.ts --output node_modules/.apip-tools/l7-replay.json
node --import tsx --test scripts/medassist-l7-integrity.test.ts
node --import tsx scripts/medassist-l3-evaluate.ts
node --import tsx scripts/medassist-l5-evaluate.ts
node node_modules/typescript/bin/tsc --noEmit
bun run build
```

The 20 browser journeys are manual assisted-UI evaluations defined in the frozen corpus; they are not an unattended browser-runner claim. After first measurement, an output-file safeguard was added without changing scoring or expectations. The evaluator refuses to overwrite any existing result; use a new --output filename for each replay. The committed initial result remains preserved.

No Model A/LLM inference, new provider integration, training, Model B activation, clinical severity changes, ADR modifications, deployment, private data access or locked-study unsealing occurred. Application, research assets and frozen L3/L5 evaluations are unchanged. This evaluation is engineering evidence from fictional AI-authored English and does not establish clinical readiness or generalized real-world accuracy.
