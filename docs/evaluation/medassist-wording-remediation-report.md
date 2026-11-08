# Stage 3 post-L7 real-world English coverage and clarification remediation

**2026-11-08 · bounded fictional software work · `feat/medassist-jayanth`.** Started with a clean tree; local root/branch/HEAD and direct GitHub branch SHA matched `aaaa1538c25d65a48600c23ef774b58b11673a79`. Read AGENTS, canonical roadmap/progress, product/architecture/layer guides, original L7 and post-L7 reports and interpretation/evidence-state contracts before edits. No new historical subphase ID is assigned.

## Scope, root causes and implementation

The scripted vocabulary remains **nine fields**: cough E_201, fever E_91, sore throat E_97, congestion/clear runny nose E_181, chills E_94, general pain E_53, nausea E_148, diarrhea E_51 and slight dizziness/lightheadedness E_76. Shared language definitions include other historical research concepts, but the unchanged script filters proposals to these nine IDs.

The remaining failures were not all parser errors. Exact phrase aliases missed bounded spelling variants, contracted/fragmented grammar, clear-water descriptions and informal nausea wording. Clause splitting also treated an explicit “just a cough” after “No runs” as an ambiguous negative list. Existing “the runs” could incorrectly map a software description. The UI lacked useful prompts for several vague descriptions.

Four functional files changed:

- `concepts.ts`: add bounded whole-token spelling forms **coff, couugh, feever, fevar, soar throat, nausia, diarrhoe, chils, liteheaded**, hyphenated light-headed, hed/tummy hurt grammar, contracted or fragmented sore throat, nose getting blocked/stufffed, watery leaking/dripping nose, vomiting sensation, feeling ready/about to puke and throat scratching while swallowing. These are source-matching expressions, not text replacement, unrestricted edit distance or fuzzy matching. Anatomy, time, intensity and frequency remain literal context rather than new coded fields.
- `language-context.ts`: recognize hed/tummy as explicit target anatomy and a bounded “just [supported symptom]” independent assertion after a denial. Bare comma lists remain ambiguous. Existing negation, uncertainty, temporal, speaker, quotation and resolution gates still apply.
- `understanding.ts`: abstain from diarrhea mapping when a runs expression explicitly concerns a program, software, bus, train, race or engine. No claim of comprehensive word-sense disambiguation.
- `presentation.ts`: ask about the actual stomach/head sensation, where/when vague body/walking descriptions occur, and explain the limited support for tiredness/sleep wording. Existing higher-priority historical/quoted/other-person notices still take precedence. No diagnosis, treatment or inferred fatigue/insomnia field.

The earlier pending/accepted evidence ledger, synchronous stale-event guard, confirmation, summary/export implementation and emergency rules were **not changed**. New vocabulary uses their shared patterns and contracts. Already accepted context changes still require restart; pending holds require a fresh explicit confirmation or question answer. UNKNOWN is never absence.

`My hed is hurting since mrng` proposes general pain while preserving `mrng` literally; it does not infer a timestamp. “Getting pain sometimes sometimes” retains general pain and requests location/detail. “Feeling tired from yesterday” and sleep/vague wording do not acquire unsupported IDs. “HA” remains ambiguous. “Throat scratching while swallowing” is a bounded engineering synonym requiring confirmation, not clinically reviewed generalization.

## Classification of all 37 starting L7 mismatches

Read the complete original [case matrix](medassist-l7-case-matrix.md) and [post-L7 remaining matrix](medassist-post-l7-remediation-report.md#all-remaining-l7-mismatches). Categories overlap; **nine retention-only findings are scoring limitations**, not nine lost source narratives. Original source statements remain in conversation records/downloads. Frozen retention logic reconstructs clauses and can fail to find an intact whole sentence. It was not changed or relabelled.

| Case | Classification | Appropriate correction / current outcome |
| --- | --- | --- |
| 012 | Existing-field synonym; incomplete clarification | Tummy hurts now maps general pain. Extra location clarification remains (tummy is not in the older pain-prompt anatomy list). |
| 013 | Informal nausea; context-sensitive residual wording | Ready to puke maps nausea; “though nothing has come up” remains unstructured and causes an extra clarification. |
| 014 | Existing-field clear-water synonym | Bounded nose dripping clear water; recovered full case. |
| 015 | Contracted everyday grammar | Throat's sore; recovered full case. |
| 016 | Hyphen/spelling/qualifier variant | Light-headed; recovered full case. |
| 017 | Informal diarrhea plus negation/independent mixed clause | No runs + just a cough; recovered full case, software near-neighbor excluded. |
| 018 | Retention-only scoring limitation | No new nausea meaning inferred; retain original source. Separate future rubric adjudication. |
| 019 | Retention-only scoring limitation | Head heaviness does not imply pain; retain original source. |
| 021 | Clarification-only interaction difference | Cough correct; repeated-frequency wording is narrative. Future UX review should decide whether a further question is useful. |
| 023 | Indian English / word order | Nose getting blocked maps congestion; an unmapped conversational fragment still triggers extra clarification. |
| 025 | Indian English / nausea versus actual vomiting | Vomiting sensation maps nausea without a vomiting ID; frozen clarification flag still differs. |
| 027 | Indian English / fragment grammar | Throat little sore and cough No; recovered full case. |
| 030 | Retention-only; ontology boundary | Gas does not establish pain/nausea; useful stomach clarification available, source preserved. |
| 031 | Clarification-only / list residual | Three symptom IDs correct; “all now” creates an extra question. Review residual discourse classification separately. |
| 036 | Ambiguous abbreviation | HA not forced to headache; clarify. Frozen expected pain remains missed. Needs semantic adjudication/context policy, not spelling distance. |
| 041 | Allowlisted spelling | coff; recovered full case. |
| 042 | Allowlisted spelling | feever; recovered full case. |
| 043 | Spelling with phrase constraint | soar only in soar throat; recovered full case. |
| 044 | Allowlisted spelling | nausia; recovered full case. |
| 045 | Allowlisted spelling plus clarification residual | diarrhoe now recognized; “definitely happening” still causes an extra question. |
| 046 | Allowlisted spelling / mixed polarity | nose stufffed + cough No; recovered full case. |
| 047 | Allowlisted spelling / negative | couugh retains No; recovered full case. |
| 048 | Allowlisted spelling / uncertain | fevar retains UNKNOWN; recovered full case. |
| 049 | Allowlisted spelling | chils; recovered full case. |
| 050 | Allowlisted spelling | liteheaded; recovered full case. |
| 055 | Clarification-only / negated alternative | Pain and both denials are correct; existing or-phrase clarification differs. Do not weaken denial scope. |
| 068 | Context-sensitive exception | Apart-from pain exception still abstains. Needs a separately tested exception grammar; same family as L5-38. |
| 069 | Clarification-only / pain anatomy scope | General pain correct; prompt considers only support quote's anatomy. Review source-bound prompt scope without inventing location. |
| 077 | Clarification-only / uncertainty | Sore throat UNKNOWN correct; alternative dry-mouth question remains a design issue. |
| 079 | Retention-only / multiple referents | Do not choose chills versus fever. Whole original text retained. |
| 084 | Retention-only / resolution | Historical resolved congestion correctly excluded from current evidence. |
| 086 | Retention-only / hypothetical | No current nausea asserted. |
| 088 | Clarification-only / continuation | Cough current is correct; remains-present fragment causes extra clarification. |
| 097 | Clarification-only / speaker | Explicit including-me cough is correct; residual phrase creates extra clarification. |
| 099 | Retention-only / quoted third party | No target fever/chills inferred; source retained. |
| 106 | Retention-only / ontology limitation | Off-colour/washed out is insufficient for any of the nine fields. Clarify; do not add fatigue ID. |
| 109 | Retention-only / ontology limitation | Colored nasal mucus is outside this nine-field script; never force it into clear runny nose. |

## Prospective contrasts and test outcomes

`scripts/medassist-wording-coverage.test.ts` was authored and run before recognition changes: **253 checks, 126 passed / 127 failed**, zero skipped/cancelled. Twenty-one phrase families each have current, negative, uncertain, historical, hypothetical, third-person, quote, resolution, retraction and conflict contrasts. Additional natural statements, spelling/word-order/multiple-symptom collisions, vague clarification and M13/M05 state checks are included.

Before changing independent-clause handling, three additional fixed comma-scope contrasts were added: the intermediate screen was **253 passed / 3 failed out of 256**. No existing expectation was rewritten. Final new vocabulary suite: **256/256**. These are development tests, not independently authored population evidence. An intermediate overly broad spaced light-headed rule failed the existing screw near-neighbor check and was narrowed; an existing prompt assertion was preserved by retaining “experiencing” wording. The initial full restricted run had 13 loopback EACCES errors and those two implementation/prompt failures; the permitted rerun resolved the transport restriction after fixes.

Final combined Node suite: **629 passed, 0 failed, 0 skipped, 0 cancelled**: 348 previous checks + 256 new coverage/semantic/state checks + 25 actual-browser/download checks. The new export suite checks 20 unchanged L7 journey records (15 actual downloads and five no-export states) plus five additional actual downloads. Existing stale callbacks, accepted-history immutability, unrelated pending preservation, UNKNOWN/negative, conflicts, M13 and M05 tests all pass. Security and transport checks use authored fixtures and temporary loopback services, not genuine Model A or a provider.

Frontend TypeScript (`tsc --noEmit`) and full production frontend/server build passed; 345 frontend modules. The existing >500 kB chunk advisory remains. No additional TSX components or dependencies were changed.

## KNOWN-CASE DEVELOPMENT COMPARISONS

Original L3/L5/L7 corpora, expectations, evaluators and first results are unchanged. The comparison script verifies their LF-normalized SHA-256 digests. These repeated exposed cases are **not fresh independent accuracy**. Comparison outputs are separate; the L7 derivative explicitly corrects the frozen runner's hardcoded `implementationModified` metadata without changing scores or expectations.

| Measure | Start | This task |
| --- | ---: | ---: |
| L3 full language | 34/34 | 34/34 |
| L5 full language | 79/80 | 79/80 |
| L7 full cases | 73/110 | 87/110 |
| L7 evidence-set exact | 89/110 | 108/110 |
| Correct expected ID/state | 88/110 | 108/110 |
| Missing observations | 22/110 | 2/110 |
| Wrong states / unexpected IDs | 0/88 each | 0/108 each |
| Incorrect positives | 0/45 | 0/62 |
| Incorrect negatives | 0/27 | 0/29 |
| Incorrect UNKNOWN | 0/14 | 0/15 |
| Incorrect contradictions | 0/2 | 0/2 |
| New spelling full cases | 0/10 | 9/10 |
| Negation evidence sets | 19/23 | 23/23 |
| Uncertainty evidence sets | 13/14 | 14/14 |
| Temporal / speaker evidence sets | 10/10 each | 10/10 each |
| L7 browser journeys | Original L7 19/20; prior repair targeted only | 20/20 replays |
| Historical warning probes, each set | 1/4 | 1/4 |

Recovered full cases: **014, 015, 016, 017, 027, 041, 042, 043, 044, 046, 047, 048, 049, 050**. No new full-case regressions. Nineteen cases recover missing structured concepts (20 observations); five of these retain clarification-only mismatches. Final remaining **23**: **two missing-concept cases**, **12 clarification-only cases**, **nine retention-only scorer limitations**.

- Missing: **036** ambiguous HA; **068** apart-from pain exception. L5-38 remains its unchanged exception abstention.
- Clarification-only: **012, 013, 021, 023, 025, 031, 045, 055, 069, 077, 088, 097**.
- Retention-only: **018, 019, 030, 079, 084, 086, 099, 106, 109**.

Full inputs/issues/annotations remain in the [L7 derivative](medassist-wording-l7-comparison.json); [L5 derivative](medassist-wording-l5-comparison.json) and [comparison summary](medassist-wording-comparison-summary.json) preserve counts, hashes and remaining rows. No failed case is removed. All 23 final failures are explicitly listed above and trace back to the starting classification table.

## Actual browser, summary and downloaded JSON

The actual [local MedAssist preview](http://127.0.0.1:3000/#/preview/medassist-conversation) was opened in the in-app browser. The server initially was not running; it was started on loopback with Model A demo and legacy agents disabled. The page remained **SIMULATED**. An initial programmatic field fill did not update React state; keyboard input was used for actual interaction thereafter.

All **20 original L7 journeys replayed successfully**, including exact M13. There are **15 original-journey JSON downloads**, all matching frozen expected evidence, and five correct no-export conditions: M04 negative-only, M07 confirmed UNKNOWN conflict before an initial positive, M13 resolved pending symptom, M19 unavailable age and M20 restart. M04's newer negative was reviewed/confirmed in UI; no unavailable export is claimed. M13 leaves no stale confirmation control. M05 in the older preservation sense was also replayed using loose-motion pending evidence through unsupported elbow and vague-stomach clarification; the unrelated field survives.

Five additional real downloads:

| Download | Independently checked evidence |
| --- | --- |
| [clarification](medassist-wording-clarification-export.json) | Vague stomach description remains unconfirmed; later diarrhea positive plus explicit cough UNKNOWN. |
| [reconciled](medassist-wording-new-reconciled-export.json) | coff resolution holds old cough; diarrhea survives; explicit UNKNOWN reconciles pending cough, fever remains No; original mixed record confirms only diarrhea. |
| [accepted update](medassist-wording-new-accepted-export.json) | Original accepted coff positive preserved in history, excluded from current; chills positive/fever No current; loose-motion draft stays pending; usage blocked_context_update. |
| [held summary](medassist-wording-new-held-export.json) | Only diarrhea current; cough held/unresolved; spoken summary counts the unresolved context. |
| [mixed wording](medassist-wording-new-mixed-export.json) | Clear watery nose and throat little sore positive, couugh negative, explicit fever UNKNOWN. |

Additional UI samples confirmed misspelled hed pain, ready-to-puke nausea, scratchy swallowing throat, head pain with fever No, and useful non-inventive responses to vague head/body/walking, tiredness and sleep descriptions. The sleep and historical tiredness samples use higher-priority existing context notices rather than overriding them with new prompts. Source context remains available across turns.

Manual Emergency help opened and disabled the composer; no test call, location permission or Maps request was activated. No automatic severity functionality was added. Responsive widths **390/820/1440** (height 1000) measured client/scroll widths **375/375, 805/805, 1425/1425**, with no horizontal overflow. Screenshots: [spelling proposal](screenshots/wording-spelling.jpg), [accepted block](screenshots/wording-accepted-block.jpg), [phone](screenshots/wording-390.jpg), [tablet](screenshots/wording-820.jpg), [desktop](screenshots/wording-1440.jpg), [final preview](screenshots/wording-final-preview.jpg).

[Browser evidence](medassist-wording-browser-results.json) stores the 20 journey snapshots, 13 additional observations, responsive measurements and captured console logs. Only the existing Lit development warning was captured, zero application errors. No complete network trace is exposed by this browser surface; a full request audit is not claimed. Loopback health is checked separately. Twenty actual JSON downloads are retained as fictional fixtures and checked; no real patient data is used.

## Boundaries, remaining blockers and next milestone

Deterministic TypeScript only; no genuine Model A, Model B or NLP/LLM inference/training/provider API was used. NHAMCS and DDXPlus are historical research context, not newly loaded datasets. No private model weights, sealed assets, locked clinical evaluation, 218-question protocol, emergency rule, expanded emergency branch or ADR implementation was accessed or modified. Model B remains disabled. Warning results remain **1/4** for each set and require separate authorized safety review.

The corpus is small, fictional, exposed and assistant-authored; neither improved known-case counts nor passing development contrasts establish generalized English understanding or clinical readiness. Rules are bounded and can miss unseen variants. Nine-field ontology gaps, source-sensitive exception grammar, ambiguous abbreviations, excessive residual clarification, multi-referent resolution and accepted-history restart limitations remain. Original private Model A/runtime and recovery-bundle blockers remain separate.

**Recommended next milestone:** a genuinely new, separately authored/frozen fictional evaluation of vocabulary, semantic counterexamples, clarification usefulness and multi-turn/export integrity. Author expectations before measurement, include near-neighbor collisions and unseen spellings, disclose authoring independence limits and do not tune during evaluation. Preserve existing known comparisons. Use its failures to select the next bounded implementation; any ontology, rubric, LLM or safety expansion needs a separate authorized scope. Do not automatically start it.

Restart (Node 24, existing checkout):

```powershell
$env:APIP_HOST='127.0.0.1'
$env:APIP_PORT='3000'
$env:APIP_ENABLE_MODEL_A_DEMO='0'
$env:APIP_ENABLE_LEGACY_AGENTS='0'
node scripts/start-server.mjs development
```

Progress/roadmap/history/changelog and implementation navigation are updated with this report. Final explicit-file commit/push and independently verified remote SHA are reported after synchronization; no local-only commit is called a successful backup.
