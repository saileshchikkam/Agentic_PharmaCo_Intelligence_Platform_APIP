# Stage 3 post-L7 context and stale-evidence integrity remediation

**Completed engineering verification: 2026-11-08.** Existing Windows checkout and branch `feat/medassist-jayanth`; starting local/direct GitHub SHA `29dab61ae567a51f23fd514cb9fc28ce63ddc218`. Starting tree was clean. Work began in the prior session and resumed without discarding task-owned edits. No historical task ID was invented.

## Root causes and implementation

M13 was reproduced in the actual local Comet browser before changes: “I have a cough during this shift.” followed by “That cough has stopped now.” left cough Yes and its confirmation control available. The native [workspace capture](screenshots/post-l7-m13-before.jpg) did not show the entire card; the accessibility observation verified that it remained enabled. The original L7 browser result also retains the failure.

1. `language-context.ts` recognized pronoun-specific resolution phrases but missed noun-subject “That cough has stopped.” That was annotated current; its progression detail did not affect polarity.
2. Pending proposal deduplication saw the same cough ID/state/value and kept the older positive. Neither the UI nor export had a record separating context changes from current evidence.
3. Broad cue gaps also missed isn't/wasn't, indirect uncertainty, trailing uncertainty and modified/less-common third-person references. These shared parser/validator decisions caused wrong current states.

The new `evidence-state.ts` records a literal source-bound context update, holds only implicated pending fields, and projects them out of current evidence. No negative or UNKNOWN answer is inferred from resolution. Original statements/proposals remain in source history. Unrelated pending fields remain available. Accepted values are never overwritten; a context update affecting an already accepted field blocks progression and current use until restart with clarified details.

A later fresh explicit statement plus confirmation, or explicit question answer, can reconcile a held *pending* field. An old held source cannot reconcile itself. Synchronous confirmation guards use the context-update ref to reject stale UI events before React rerenders. Already accepted context changes remain blocked; this task does not implement an accepted-history replacement editor.

Language changes add bounded contraction/uncertainty cues, nearby trailing-marker scope with literal spans, relative/colleague attribution and general resolution with a negated-resolution exception. “Hasn't stopped” stays ongoing. Quoted, other-person, historical old-episode and hypothetical resolution do not cancel target evidence. Ambiguous multi-concept alternatives remain unasserted. Existing routine UNKNOWN, negative and contradiction handling is retained.

## Files and export contract

| Area | Files / behavior |
| --- | --- |
| Interpretation | `language-context.ts`, `natural.ts`, `understanding.ts`: scoped cues and matching validation; no ontology expansion. |
| State integrity | New `evidence-state.ts`: context updates, field holds, reconciliation, current projection and stale-event guards. |
| UI / summary / download | `MedAssistConversation.tsx`: apply context changes before duplicate/empty-result handling; preserve drafts/history; block accepted changes; count held updates in final uncertainty. |
| Prospective tests | `medassist-post-l7-context.test.ts` (32), `medassist-post-l7-state.test.ts` (14), `medassist-post-l7-exports.test.ts` (5). |
| Evidence | Known L5/L7 comparisons, five actual downloaded JSON fixtures, browser-check record and screenshots. |

The existing scripted wrapper/evidence schemas and nine IDs remain. Additive `evidence_state_version: medassist.evidence-state.v1` defines:
- `evidence`: the effective view, excluding unresolved context-held fields.
- `accepted_evidence_history`: unchanged accepted engine snapshot.
- `pending_proposals` and `confirmed_queued_disclosures`: separate unconfirmed drafts and confirmed disclosures awaiting an interview update.
- `context_updates` and `excluded_from_current`: original change text, implicated ID, held sources, status and explicit reconciliation reference.
- `confirmed_evidence_ids`: field-level confirmation within a source record. A mixed record's legacy confirmed Boolean means some fields were confirmed; it does not accept every annotation.
- `evidence_usage: blocked_context_update` when accepted history has a newer unresolved context change.

Ordinary contradictions preserve the prior accepted snapshot under the existing `blocked_unresolved_conflict` marker. Consumers must honor blocked usage and must not aggregate narrative, historical or pending proposals into current evidence.

## Browser and downloaded evidence

The actual development page remained SIMULATED at [the local preview](http://127.0.0.1:3000/#/preview/medassist-conversation). Native Comet was used for initial reproduction/M05; the available in-app browser completed final checks after tool availability changed.

| Check | Before / verified after |
| --- | --- |
| M13 exact pair | Before: cough Yes remained confirmable. After: zero stale confirmation controls; literal resolution notice; no inferred absence. |
| Unrelated field in same draft | Cough/chills or cough/diarrhea followed by cough resolution kept only the unrelated field confirmable. |
| M05 preservation | Diarrhea survived unsupported elbow clarification; export retained diarrhea only with earlier cough held out. |
| Accepted update | Accepted cough/chills, fever UNKNOWN and throat No, then pending nausea and cough resolution: current cough excluded, accepted history unchanged, nausea still pending, confirmation disabled, usage blocked. |
| Explicit reconciliation | A routine explicit Not sure answer restored cough only as UNKNOWN; fever No remained negative; the mixed original record confirmed only diarrhea. |
| Final held summary | Confirmed chills only; one unresolved context counted; cough absent from current export. |
| Ordinary conflict | Confirmed throat contradicted later: original accepted positive preserved with blocked usage and both source proposals. |
| Manual Emergency help | Opened, paused composer; no test call, location permission or Maps request. |

Five actual downloads were independently read and are checked by the new export tests:
[M13/M05](medassist-post-l7-m13-m05-export.json), [accepted update](medassist-post-l7-accepted-update-export.json), [explicit reconciliation](medassist-post-l7-reconciled-export.json), [held summary](medassist-post-l7-held-summary-export.json), [ordinary conflict](medassist-post-l7-conflict-export.json).

The first native export preceded a summary-counter improvement; the final held-summary browser replay verifies that the spoken summary also counts the unresolved update. The effective evidence and held-source separation were correct in both.

This task performed targeted acceptance journeys, **not a full rescore of all 20 L7 browser journeys**. M13's original failure is now repaired in targeted replay; the original 19/20 L7 record is unchanged.

Phone 390×844, tablet 820×1180 and desktop 1440×1000 were checked, with scroll widths 375/805/1425. No horizontal overflow was measured. [Phone](screenshots/post-l7-mobile.jpg), [tablet](screenshots/post-l7-tablet.jpg), [desktop](screenshots/post-l7-desktop.jpg), [accepted block](screenshots/post-l7-accepted-blocked.jpg), [final exact M13](screenshots/post-l7-final-m13.jpg).

Inspected console logs contained the Lit development warning and no captured application errors. Browser-service startup/attachment timeouts were recovered before verification. A complete network trace is not claimed. The server was restarted on loopback after resumption; preview was left available.

## Frozen comparisons — known development sets

L3/L5/L7 inputs, expectations, evaluators and original results are unchanged. Corpus hashes were rechecked. The derivative L7 result corrects the original runner's implementationModified metadata to true and labels this a known-case comparison; scores/expectations were not altered.

| Measure | Before | After |
| --- | ---: | ---: |
| L3 full language | 34/34 | 34/34 |
| L5 full language | 79/80 | 79/80 |
| L7 full cases | 61/110 | 73/110 |
| L7 evidence-set exact cases | 76/110 | 89/110 |
| L7 correct expected ID/state | 78/110 | 88/110 |
| Missing observations | 24/110 | 22/110 |
| Wrong states | 8/91 emissions | 0/88 |
| Unexpected IDs | 5/91 | 0/88 |
| Incorrect positives | 11/56 positive emissions | 0/45 |
| Incorrect negatives | 1/24 negative emissions | 0/27 |
| Incorrect UNKNOWN | 0/8 UNKNOWN emissions | 0/14 |
| Incorrect contradictions | 1/3 contradiction emissions | 0/2 |
| Temporal evidence-set cases | 9/10 | 10/10 |
| Speaker evidence-set cases | 8/10 | 10/10 |
| Warning probes, L3/L5/L7 separately | 1/4 each | 1/4 each |

Recovered L7 full rows: L7-028, L7-033, L7-058, L7-062, L7-064, L7-071, L7-073, L7-076, L7-080, L7-082, L7-092, L7-098. New full-case regressions: none. Full case success includes retention/clarification expectations; it is not semantic accuracy alone. L5-38 remains the same pain-exception abstention.

## All remaining L7 mismatches

**37/110 remain.** There are 22 missing observations across 21 cases, nine retention-only scorer limitations, and seven clarification-only differences. These case groups total 37. Zero wrong states/unexpected IDs in this known set does not establish correctness on unseen English.

| ID | Frozen input | Expected | Observed | Remaining issues |
| --- | --- | --- | --- | --- |
| L7-012 | My tummy hurts while I'm sitting here. | E_53 present | ∅ | missing E_53 present; clarification intent; abstain intent; confirmation intent |
| L7-013 | I feel ready to puke, though nothing has come up. | E_148 present | ∅ | missing E_148 present; clarification intent; abstain intent; confirmation intent |
| L7-014 | My nose won't stop dripping clear water. | E_181 present | ∅ | missing E_181 present; clarification intent; abstain intent; confirmation intent |
| L7-015 | My throat's sore after that meeting. | E_97 present | ∅ | missing E_97 present; clarification intent; abstain intent; confirmation intent |
| L7-016 | I feel a little light-headed right this minute. | E_76 present | ∅ | missing E_76 present; clarification intent; abstain intent; confirmation intent |
| L7-017 | No runs today, just a cough. | E_51 absent, E_201 present | ∅ | missing E_51 absent; missing E_201 present; clarification intent; abstain intent; confirmation intent |
| L7-018 | I feel sick, but I can't tell what kind of sick. | ∅ | ∅ | missing retained wording |
| L7-019 | My head feels heavy, not painful. | ∅ | ∅ | missing retained wording |
| L7-021 | Cough is coming again and again today only. | E_201 present | E_201 present | clarification intent |
| L7-023 | For me nose getting blocked now, yaar. | E_181 present | ∅ | missing E_181 present; clarification intent; abstain intent; confirmation intent |
| L7-025 | Vomiting sensation coming, no actual vomit. | E_148 present | ∅ | missing E_148 present; abstain intent; confirmation intent |
| L7-027 | Throat little sore only, no cough also. | E_97 present, E_201 absent | E_201 absent | missing E_97 present; clarification intent |
| L7-030 | Stomach gas problem only, cannot explain more. | ∅ | ∅ | missing retained wording |
| L7-031 | cough / chills / sore throat, all now | E_201 present, E_94 present, E_97 present | E_201 present, E_97 present, E_94 present | clarification intent |
| L7-036 | HA since tea; sore throat too | E_53 present, E_97 present | E_97 present | missing E_53 present; clarification intent |
| L7-041 | My coff has lasted all afternoon. | E_201 present | ∅ | missing E_201 present; clarification intent; abstain intent; confirmation intent |
| L7-042 | I have a feever at the moment. | E_91 present | ∅ | missing E_91 present; clarification intent; abstain intent; confirmation intent |
| L7-043 | A soar throat started just now. | E_97 present | ∅ | missing E_97 present; clarification intent; abstain intent; confirmation intent |
| L7-044 | I feel nausia during this ride. | E_148 present | ∅ | missing E_148 present; clarification intent; abstain intent; confirmation intent |
| L7-045 | Diarrhoe today, definitely happening. | E_51 present | ∅ | missing E_51 present; clarification intent; abstain intent; confirmation intent |
| L7-046 | Nose is stufffed, no cough. | E_181 present, E_201 absent | E_201 absent | missing E_181 present; clarification intent |
| L7-047 | I do not have a couugh today. | E_201 absent | ∅ | missing E_201 absent; clarification intent; abstain intent; confirmation intent |
| L7-048 | Maybe this is a fevar. | E_91 unknown | ∅ | missing E_91 unknown; clarification intent; abstain intent; confirmation intent |
| L7-049 | Chils have started while I wait. | E_94 present | ∅ | missing E_94 present; clarification intent; abstain intent; confirmation intent |
| L7-050 | I feel liteheaded at this instant. | E_76 present | ∅ | missing E_76 present; clarification intent; abstain intent; confirmation intent |
| L7-055 | I have a headache but no cough or nausea. | E_53 present, E_201 absent, E_148 absent | E_53 present, E_201 absent, E_148 absent | clarification intent |
| L7-068 | Apart from my painful head, nothing hurts. | E_53 present | ∅ | missing E_53 present; clarification intent; abstain intent; confirmation intent |
| L7-069 | There is pain nowhere except in my stomach. | E_53 present | E_53 present | clarification intent |
| L7-077 | Sore throat or just a dry mouth; I can't tell. | E_97 unknown | E_97 unknown | clarification intent |
| L7-079 | Either chills or fever, I cannot distinguish. | ∅ | ∅ | missing retained wording |
| L7-084 | My nose was blocked an hour ago, but it is clear now. | ∅ | ∅ | missing retained wording |
| L7-086 | Suppose nausea started, would that be relevant? | ∅ | ∅ | missing retained wording |
| L7-088 | A cough began earlier and remains present right now. | E_201 present | E_201 present | clarification intent |
| L7-097 | We both have a cough, including me. | E_201 present | E_201 present | clarification intent |
| L7-099 | A stranger wrote, 'I have fever and chills'. | ∅ | ∅ | missing retained wording |
| L7-106 | I feel off-colour and washed out. | ∅ | ∅ | missing retained wording |
| L7-109 | My nose has green mucus, no other detail. | ∅ | ∅ | missing retained wording |

The L7 authoring/adjudication caveats remain: whole-sentence retention reconstruction, HA ambiguity, knee-aching and pain-clarification rubric issues were not relabelled. The new spelling category remains 0/10 full matches. Complete current category/quote/annotation results are in the [L7 derivative](medassist-post-l7-l7-comparison.json).

## Tests and acceptance evidence

Final suite: **348 passed, zero failed/skipped/cancelled**: 297 existing checks (290 focused plus seven L7 integrity checks) and 51 new checks (32 language, 14 state and five actual-export checks). The initial prospective 30-case screen exposed 17 failures before fixes (13 passed); those expectations were retained. Additional cases followed during implementation.

TypeScript and production build passed (345 modules), with the existing large-chunk advisory. An intermediate TypeScript result-union error was fixed before final validation. An intermediate unnecessary clarification changed one L5 row; that blanket rule was removed, restoring 79/80 while preserving uncertainty.

Acceptance gates are covered by the reproduced M13, pending/source preservation tests, accepted-history blocking tests, explicit reconciliation/UNKNOWN/negative/conflict tests, five real downloads, unchanged corpus hashes, final browser replay, TypeScript/build and security regressions. Final commit/push use the existing helper with explicit files; the final SHA is independently checked after committing and reported in the session completion.

## Remaining boundaries and next task

The accepted-context-change path conservatively requires restart; an in-session accepted-history reconciliation editor is not implemented. Ambiguous multiple referents can hold multiple fields for clarification rather than choosing one. Exact-repeat submission deduplication remains bounded. Broader wording, spelling and useful clarification remain incomplete. Complete L7 multi-turn rescore and full network tracing were not performed here.

Next separately authorized implementation: bounded real-world wording coverage and targeted clarification for the missing supported concepts, with prospective positive/negative/UNKNOWN/historical/attribution/collision contrasts. Do not force ambiguous abbreviations or pain exceptions into a code merely to improve known scores. Keep rubric revision and any ontology/LLM extractor expansion separate.

Model B stays disabled. No emergency-warning rules, expanded emergency branch, genuine Model A inference/training, research assets, locked evaluations, 218-question protocol, ADR behavior or provider integration changed. NHAMCS/DDXPlus remain historical research context, not data used for these fictional checks. No clinical readiness or generalized English accuracy is claimed.

Verified restart command (Node 24, existing checkout):

```powershell
$env:APIP_HOST='127.0.0.1'
$env:APIP_PORT='3000'
$env:APIP_ENABLE_MODEL_A_DEMO='0'
$env:APIP_ENABLE_LEGACY_AGENTS='0'
node scripts/start-server.mjs development
```
