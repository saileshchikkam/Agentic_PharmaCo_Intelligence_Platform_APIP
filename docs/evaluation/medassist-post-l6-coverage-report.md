# MedAssist Stage 3 — post-L6 vocabulary and clarification remediation

**2026-11-07 · `feat/medassist-jayanth` · starting local and directly verified origin SHA `e6be1f77ca0dd5696621aa5595a3fd7a46f61790`**

This is scoped implementation after L6. No additional historical task number was assigned. L7 is reserved for the next fresh evaluation and has not begun. The starting working tree was clean. The [progress tracker](../medassist-progress.md) owns the seven-stage snapshot.

## Scope and method

Review of the unchanged L5 and L6 reports identified all 21 remaining mismatches before implementation. Bounded aliases and original-text clause handling address existing nine-field scripted evidence only. No fuzzy matching, new ontology ID, new provider, model training or genuine Model A inference was introduced. Original source offsets and explicit user confirmation remain mandatory.

The nine fields are pain E_53, cough E_201, fever E_91, sore throat E_97, diarrhea E_51, nausea E_148, chills E_94, nasal congestion/clear runny nose E_181, and slight dizziness/lightheadedness E_76. The shared language catalogue contains other research concepts, but the scripted vocabulary filter still excludes them.

L3/L5 are now known development comparisons. Their inputs, expectations, evaluators and original reports were not edited. New contrasts use different surrounding wording and explicit state assertions; they are implementation tests, not independent accuracy evidence.

## All 21 original mismatches

Notation: + present, − absent, ? UNKNOWN, ∅ no structured evidence. Every row was an L6 mismatch. Source locations are repository paths under `src/features/medassist-conversation/`. “Recovered” means the complete unchanged evaluator row now matches, including intent and retained text.

| ID | Frozen input | Expected | L6 observed | Root cause / source | Correction and post-task result |
| --- | --- | --- | --- | --- | --- |
| L5-02 | My throat has been sore since lunch. | E_97+ | ∅ | Word-order/perfect-tense alias, concepts.ts | Bounded throat phrase. Recovered E_97+. |
| L5-07 | My nose feels congested. | E_181+ | ∅ | Missing synonym, concepts.ts | Explicit nasal phrase. Recovered. |
| L5-11 | Throat paining only when talking. | E_53+ | ∅ | Indian-English pain phrase, concepts.ts | General pain only, not sore-throat inference. Recovered. |
| L5-12 | I feel a bit pukey after lunch. | E_148+ | ∅ | Colloquial nausea phrase, concepts.ts | Bounded “feel a bit pukey.” Recovered; no vomiting ID. |
| L5-13 | Nose fully blocked yaar. | E_181+ | ∅ | Incomplete Indian-English phrase, concepts.ts | “nose fully blocked”; filler has no encoded meaning. Recovered. |
| L5-14 | Only little dizzy when getting up. | E_76+ | ∅ | Explicit mild-dizziness phrase, concepts.ts | “little dizzy.” Recovered; no urgency/location inference. |
| L5-15 | My head has been aching since lunch. | E_53+ | ∅ | Word order, concepts.ts | Head-aching phrase. Recovered as general pain. |
| L5-16 | I feel shivery and feverish today. | E_94+, E_91+ | E_91+ | Missing colloquial concept, concepts.ts | Add “feel shivery”; keep separate fever. Recovered both. |
| L5-17 | cgh since lunch | E_201+ | ∅ | Abbreviation ambiguity, concepts.ts | Framed cgh only, not unrestricted CGH token. Recovered. |
| L5-21 | nose blocked no cough | E_181+, E_201− | E_201− | Missing fragment plus negation boundary, concepts.ts / language-context.ts | Match nasal phrase and split bounded appended denial with original offsets. Recovered both. |
| L5-22 | fevr nd cough | E_91+, E_201+ | E_201+ | Allowlisted misspelling, concepts.ts | Add fevr; no global “nd” replacement. Recovered both. |
| L5-25 | Still couffing this afternoon. | E_201+ | ∅ | Allowlisted spelling, concepts.ts | Add couffing. Recovered. |
| L5-26 | My throat feels soor. | E_97+ | ∅ | Phrase-specific spelling, concepts.ts | Add whole throat phrase; no global soor rewrite. Recovered. |
| L5-27 | Feeling nausous today. | E_148+ | ∅ | Allowlisted spelling, concepts.ts | Add nausous. Recovered. |
| L5-28 | I have diarrea since noon. | E_51+ | ∅ | Allowlisted spelling, concepts.ts | Add diarrea. Recovered. |
| L5-29 | Chillls after lunch. | E_94+ | ∅ | Allowlisted spelling, concepts.ts | Add chillls. Recovered. |
| L5-30 | I feel light headed today. | E_76+ | ∅ | Spaced symptom phrase, concepts.ts | Feeling context required; avoid “light headed screw.” Recovered. |
| L5-31 | My nose is stufy. | E_181+ | ∅ | Phrase-specific spelling, concepts.ts | Add nose-is-stufy. Recovered. |
| L5-38 | No pain apart from an aching head. | E_53+; confirm, no clarification | ∅; clarify | Pain exception scope, language-context.ts | “aching head” is recognized independently; exception remains nonasserted. Still ∅ and clarification. Unresolved, not relabelled as success. |
| L5-40 | My nose is blocked, not my throat. | E_181+; no clarification | E_181+ plus extra clarification | Unsupported anatomy denial was called ambiguous, understanding.ts | Retain “not my throat” as unsupported, without inferring throat-negative. Recovered. |
| L5-50 | I had chills at breakfast and still have them now. | E_94+ | ∅ | Same-sentence pronoun continuity, language-context.ts | Link one positive historical referent with explicit “still have it/them now”; preserve full original source. Recovered. |

These are lexical, scope and interaction gaps rather than 21 missing ontology IDs. Elbow complaints, generic fatigue and spinning sensations still require narrative/clarification rather than invented mappings. The pain-exception failure needs scoped exception semantics, not an ontology expansion.

## Implementation and semantic protection

- `concepts.ts`: bounded spelling, colloquial, word-order and anatomy phrases. “hed is paining” and “body is aching” map only to general pain. Existing “loose motion,” “feeling like throwing up” and “nose water coming” remain supported within context rules.
- `language-context.ts`: appended denial split requires a recognized positive prefix without an earlier uncertainty/denial cue. Historical continuity requires one referent, same-sentence “and,” explicit current continuation, and no resolution/negation/uncertainty in the antecedent. Ambiguous multiple historical referents remain historical.
- `understanding.ts`: a narrow anatomy-only denial stays literal without manufacturing an absent symptom.
- `presentation.ts` and the existing conversation component: vague wording asks what is experienced; spinning/giddy asks which sensation; general pain asks where/what it feels like. A pending proposal remains visible and unaccepted until confirmed. L6 pending-source merging and conflict review remain unchanged.

A development contrast initially exposed unwanted current nausea in a multi-referent history. Historical conjunction inheritance was corrected. Later abbreviation counterexamples exposed missing No/Maybe cgh recognition; these framed forms were added and retested. Final results below follow those corrections. Expectations were not changed to hide failures.

## Known-set measurements

| Measure | L6 baseline | After this task |
| --- | ---: | ---: |
| L3 exact language matches | 34/34 | 34/34 |
| L5 exact language matches | 59/80 | 79/80 |
| L5 recovered / newly failing rows | — | 20 / 0 |
| L5 expected observations | 74 | 74 |
| L5 observed observations / correct ID and state | 54 / 54 | 73 / 73 |
| L5 missing IDs | 20 | 1 |
| L5 wrong states / unexpected IDs | 0 / 0 | 0 / 0 |
| L5 incorrect positive / negative / UNKNOWN emissions | 0 / 0 / 0 | 0 / 0 / 0 |
| L3 warning probes | 1/4 | 1/4 |
| L5 warning probes | 1/4 | 1/4 |

The only remaining language mismatch is L5-38. Frozen corpus SHA-256: L3 `0c8999b4d8d34433d7e9721d33d8e3c5dd28af3a53a08e679cae317854c9fa44`; L5 `08519525e96b0d3f7c2772a3e5f967f23446c42e46a9a2f8a06f599739282c5c`. The [complete 80-row post-task output](medassist-post-l6-comparison.json) includes all categories, issues, source spans and warning outcomes.

## Tests and reproducibility

**290 focused tests passed, zero failed/skipped/cancelled**, consisting of the existing 139 plus **151 new tests**. New tests contain 21 phrase families × 7 polarity/context forms (147), and four grouped checks for collisions, continuity, mixed polarity and clarification/pending integrity. Every new phrase family has explicit current, negative, uncertain, historical, conditional, other-person and quoted expectations. Source substring and annotation-offset checks are included. Existing L6 tests protect retractions, conflicts and pending merges.

Node 24 was used. Frontend TypeScript (`tsc --noEmit`) passed. Production build passed (345 modules); the existing large-chunk advisory remains. Relevant loopback security and disabled-provider tests ran within the focused suite. No paid inference was requested.

```powershell
node --import tsx --test scripts/medassist-post-l6-coverage.test.ts scripts/medassist-l6-integrity.test.ts scripts/medassist-l4-language.test.ts scripts/medassist-language-variation.test.ts scripts/medassist-scripted.test.ts scripts/medassist-conversation.test.ts scripts/model-a-demo.test.ts scripts/legacy-security.test.ts scripts/medassist-safety.test.ts scripts/medassist-understanding.test.ts scripts/medassist-reliability.test.ts
node --import tsx scripts/medassist-l3-evaluate.ts
node --import tsx scripts/medassist-l5-evaluate.ts
node node_modules/typescript/bin/tsc --noEmit
bun run build
```

## Actual local browser replay

The existing Windows Express/Vite server ran on loopback with Model A demo and legacy agents disabled. Actual UI interactions used fictional input in SIMULATED mode. All **15/15 existing L5 journeys matched**, none skipped or blocked. Eleven downloaded exports (including newly completed M05) were independently read and compared with expected ID/value sets; UNKNOWN status and conflict blocking were inspected. No premature evidence acceptance was observed.

| Journey | Verified result |
| --- | --- |
| M01 | Vague clarification, then unaccepted cough proposal; no summary before confirmation. |
| M02 | Chills+ and fever− survived confirmation, early stop and export. |
| M03 | Rejected nasal proposal did not enter sore-throat-only export. |
| M04 | Historical chills stayed unaccepted; current nasal evidence alone exported. |
| M05 | Unsupported elbow clarification retained pending diarrhea; explicit confirmation/export contained diarrhea only. Elbow stayed narrative. |
| M06 | Confirmed fever UNKNOWN followed by concrete fever stopped on conflict; no interview began. |
| M07 | Contradicted throat stopped; export kept prior positive, both confirmed source records and blocked_unresolved_conflict. |
| M08 | Throat+ and cough− exported. |
| M09 | Nasal+ and cough UNKNOWN exported, with unknown status distinct from negative. |
| M10 | Stop before cough answer exported diarrhea alone. |
| M11 | Unknown age prevented interview and export. |
| M12 | Off-question nasal addition queued until cough answer; chills+, nasal+, cough− exported. |
| M13 | Elbow wording requested current-question clarification; only subsequent explicit cough− was added. |
| M14 | One confirmation removed its control and moved to age; restart cleared proposal/summary. Concurrent clicking was not part of this journey. |
| M15 | Disclosed cough− skipped its question and survived chills+/fever+ export. |

Additional UI checks covered spelling/Indian-English general pain, multiple complaints, partial pain location prompts, vague follow-up retaining pending pain, head-spinning clarification without an ID, mixed nasal-positive/cough-negative broken wording, and manual Emergency help. Help paused ordinary questioning without placing a test call or enabling severity.

The combined sentence “Loose motion from yesterday. Feeling like throwing up. Nose water coming.” produced nausea and nasal proposals while retaining the yesterday clause as historical. This is a continuing-onset coverage limitation; the display also repeats that retained clause. It is not counted as successful diarrhea extraction. The source must be clarified rather than silently assumed current.

Phone 390×844, tablet 820×1180 and desktop 1440×1000 were inspected; no horizontal overflow was measured and confirmation/composer controls remained accessible by scrolling. [Phone](screenshots/post-l6-mobile.jpg), [tablet](screenshots/post-l6-tablet.jpg) and [desktop](screenshots/post-l6-desktop.jpg) screenshots are fictional evidence. Inspected console logs after reconnecting contained the Lit development warning and no captured errors. The earlier browser was interrupted and the local server was restarted before the final layout/help checks; console findings are limited to the inspected capture window. A typing timeout was resolved by inspecting the partial input and completing it. The live preview was left open.

## Boundaries and prioritized remaining work

1. **Fresh L7 evaluation, next separately authorized task:** freeze new English inputs, structured expectations, abstentions and clarification/multi-turn criteria before measurement. Include unseen spelling, Indian English, informal/incomplete wording, mixed polarity, temporality, attribution, unsupported anatomy and pending/conflict/export flows. Do not modify the implementation during measurement.
2. **Context-aware parser and clarification design:** scoped pain exceptions (L5-38), ambiguous multiple referents, and “from yesterday” ongoing-versus-historical wording. Add prospective contrast cases before future fixes. Preserve uncertainty and confirmation.
3. **Clarification design:** deduplicate retained history display and support clearer reconciliation of previously confirmed UNKNOWN versus later positive evidence. Current conflict behavior conservatively stops.
4. **Separate safety workstream:** warning results remain 1/4 each. L5 W2 misses “Air won't go into my lungs at all”; W3 quoted breathing difficulty and W4 negated ambulance request interrupt incorrectly. No warning-rule changes or expanded-branch merge occurred. These are unresolved safety issues, not language passes.
5. **Ontology/provider decisions only after evidence:** unsupported symptoms and broad unrestricted English cannot be solved by endless synonym additions. Any expanded ontology or NLP/LLM extractor needs an independently frozen evaluation and separately authorized contracts/provider work.

NHAMCS/DDXPlus research artifacts and locked clinical evaluations were untouched. Genuine Model A did not run; its private assets and pinned environment remain unverified locally. Model B remains disabled/untrained. No Groq, MedGemma, cloud LLM or new API was called for language extraction. The frontend scripted parser ran locally; provisional safety/help uses the existing local route. No diagnosis, personalized care advice, universal English accuracy or clinical readiness is claimed.
