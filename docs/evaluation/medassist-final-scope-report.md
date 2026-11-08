# Prompt 1 of 5 — Stage 3 final scoped language, clarification and continuity

**2026-11-08. Scoped implementation: COMPLETE. Closure readiness: READY FOR EVALUATION.** Stage 3 is not independently qualified or clinically ready. Prompt 2 has not started.

Existing Windows checkout, `feat/medassist-jayanth`, clean at start. Local HEAD and direct GitHub branch SHA both matched `0d78aa79508660d0ae16692da6ebf77580f55b36`. AGENTS, canonical roadmap/progress/blueprint, product/architecture/layer guidance, L5/L6, original L7, post-L7 and wording reports and actual interpretation/state/confirmation/export code were inspected. No repository, branch or historical task number was created.

## Implementation and source contracts

Six functional source paths changed:

| Source | Change |
| --- | --- |
| `pain-scope.ts` (new) | Anchored linguistic grammar for clear no-pain exceptions, fronted aching/painful-site exceptions and nowhere-except constructions. Only general pain is inferred; no encoded anatomy or headache ID. |
| `language-context.ts` | Apply the exception's polarity without dropping literal negation words; unsupported/uncertain exception constructions remain nonasserted. Recognize explicit `now I` / `only I` speaker switches. Quotation, history, hypothetical, attribution and resolution gates remain authoritative. |
| `natural.ts` | The validator uses the same narrow pain-exception predicate; an ordinary pain denial cannot support a positive. No schema expansion. |
| `concepts.ts` | Bounded literal pain wording: head aches, aching back, painful supported sites and explicit only-my-site-hurts. Existing nine-field filter remains. |
| `understanding.ts` | Retain a bounded discourse tail as unsupported narrative rather than asking whether it is another symptom, only after a supported current claim in the same sentence. No additional evidence is emitted. |
| `presentation.ts` | Recognize already supplied tummy/headache anatomy, ask a useful question for `feel funny` / `not able to describe`, and ask users to spell out HA without presuming a head symptom. |

The discourse allowlist covers all/both now/today, definitely/certainly happening, again now/today, remains present, including me, yaar, nothing hurts and nothing-has-come-up tails. Unknown symptom details still clarify. A bare discourse fragment does not become evidence. Source spans/offsets are preserved by matching original text directly, never by replacement or fuzzy nearest-ID selection.

No changes to `evidence-state.ts`, `MedAssistConversation.tsx`, pending-proposal state, interview reducer, export schema, emergency rules, providers, ADR or ontology. The accepted-history and current-evidence contracts are preserved.

## Individual root causes and disposition

Expected/actual below summarize the frozen L7 cases; complete quotes, flags and annotations remain in the separately saved comparison. These are known development cases. E_53 is general pain, E_148 nausea, E_181 nasal symptoms, E_201 cough, E_51 diarrhea, E_97 sore throat and E_94 chills.

| ID | Expected / starting actual | Classification, affected source and disposition |
| --- | --- | --- |
| 012 | Pain + / pain + with extra question | UX: supplied tummy anatomy absent from `clarifyPain`; corrected in presentation. Full recovered. |
| 013 | Nausea + / correct + with extra question | UX: nothing-came-up tail misclassified as a new vague symptom; retained as narrative in understanding. Full recovered. |
| 018 | No evidence / no evidence, retention flag | Rubric limitation: split-clause reconstruction misses whole source. No symptom invented; original source retained. Unchanged. |
| 019 | No evidence / no evidence, retention flag | Rubric limitation; head heaviness is not pain. Unchanged. |
| 021 | Cough + / correct + with extra question | UX: `and` splits repeated again into a fragment. Bounded discourse retention avoids a needless question. Full recovered. |
| 023 | Nasal + / correct + with extra question | UX: yaar is discourse, not another symptom; understanding corrected. Full recovered. |
| 025 | Nausea + plus clarification / correct + without clarification | Interaction-label difference. No actual vomit is already retained as unsupported narrative; another symptom question is unnecessary. Do not force it to satisfy a frozen flag. Unchanged mismatch. |
| 030 | No evidence / no evidence, retention flag | Ontology plus rubric: gas does not establish one of the nine fields; stomach clarification available. Source preserved. |
| 031 | Three positives / correct three with extra question | UX: all-now tail. Narrative retention corrected. Full recovered. |
| 036 | Pain +, throat + / throat + only | Ambiguous HA. No unconditional alias; presentation asks to spell it out. Frozen pain expectation remains missed; annotation ambiguity retained. |
| 045 | Diarrhea + / correct + with extra question | UX: definitely-happening tail. Corrected without changing evidence. Full recovered. |
| 055 | Pain +, cough/nausea No / correct set with extra question | UX: headache failed the anatomy check. Presentation corrected; coordinated denials preserved. Full recovered. |
| 068 | Pain + / abstention | Interpretation: blanket apart-from gate hid an explicitly painful exception. Shared scope grammar and validator now propose general pain with the literal source. Full recovered. |
| 069 | Pain + and clarification / correct + without clarification | Anatomical scope is already supplied. Keep current pain and literal location; frozen clarification difference remains. |
| 077 | Throat UNKNOWN plus clarification / correct UNKNOWN without clarification | User explicitly cannot distinguish throat versus dry mouth. Keep UNKNOWN and require confirmation; do not demand an invented answer. Existing workflow/label difference remains. |
| 079 | No evidence / no evidence, retention flag | Ambiguous alternatives plus scorer limitation. Do not choose chills or fever. |
| 084 | No current symptom / no current symptom, retention flag | Resolved history correctly excluded. Preserve full source; no label edits. |
| 086 | No current symptom / no current symptom, retention flag | Hypothetical correctly excluded; source retained. |
| 088 | Cough + / correct + with extra question | UX: remains-present continuation tail. Narrative classification corrected. Full recovered. |
| 097 | Cough + / correct + with extra question | UX: including-me tail. Retained without an extra symptom question. Full recovered. |
| 099 | No target evidence / no evidence, retention flag | Third-party quotation correctly excluded. Original source retained; scorer issue unchanged. |
| 106 | No evidence / no evidence, retention flag | Ontology limitation: washed-out/off-colour has no unambiguous nine-field mapping. Clarify, retain source. |
| 109 | No evidence / no evidence, retention flag | Ontology limitation: green mucus is not clear runny nose. No forced mapping. |
| L5-38 | General pain + / abstention | Same clear pain-exception scope defect; recovered with source and confirmation preserved. |

The existing L6 development check `No pain apart from an aching back` previously expected blanket abstention. Its one expectation was explicitly changed to general pain + under this authorized behavior change, after prospective contrasts were recorded. **No frozen L3/L5/L7 expectation/evaluator/adjudication record changed.** This is not a silent relabeling to improve benchmark scores.

## Referents, UNKNOWN and continuity investigation

Explicit `now I` and `only I` now switch from another person to the speaker. Daughter-fever/speaker-cough, historical brother-pain/current speaker-nausea, child-sick/now-speaker-feverish and negative/UNKNOWN speaker contrasts are tested. Quotes and `now she` stay other-person information; different people do not produce a target conflict.

Implicit ellipsis such as `My mother is coughing. I am not.` or `My brother has head pain, but I do not.` remains unencoded, with clarification, because the script does not bind the omitted proposition across people. This is conservative missing coverage, not a target positive or an inferred negative. Multiple unresolved referents remain a limitation. No family-member patient record is created.

The interview request is append-only and its existing reducer treats a different answer for an accepted ID—including UNKNOWN—as a conflict. Merely replacing queued/current values would break immutable accepted history and provenance. A proper accepted-value revision requires versioned reconciliation/replay semantics beyond this bounded pass. **No in-session accepted-UNKNOWN replacement editor was added.** User-confirmed later changes are flagged and block use; explicit restart with clarified details remains the safe existing workflow. Pending context holds can still be explicitly reconciled by a fresh confirmation or question answer. This distinction is verified in actual exports.

## Prospective expectations and checks

Expectations are separate from observations:
- [Scope expectations](medassist-final-scope-expectations.json): 46 fictional descriptions covering positive/negative pain, exceptions, uncertainty, history/future/hypothetical, attribution, quotes, resolution, retraction, multiple symptoms and ambiguity.
- [Clarification expectations](medassist-final-clarification-expectations.json): 15 residual-clause contrasts, including meaningful unsupported near-neighbors that must still clarify.
- [Baseline observations](medassist-final-scope-before.json) and [final observations](medassist-final-scope-after.json) preserve actual extraction outputs.

Initial prospective suite: **49 checks, 30 passed / 19 failed**. Before discourse changes, the expanded 64-check screen was **55 passed / nine failed**. The neutral-HA prompt expectation was separately added before that prompt change and failed 1/64, then passed. Final targeted suite: **64/64** (46 scope cases +15 clarification cases +three validator/state checks). These are development contrasts, not an independent corpus.

Final combined suite: **718 passed, zero failed/skipped/cancelled; zero blocked Node checks**. Breakdown: 629 prior checks (including the explicitly revised L6 semantic expectation), 64 new scope/clarification/state checks and 25 new current-browser/download checks. Existing M13/M05, stale callbacks, pending holds, immutable history, explicit reconciliation, UNKNOWN/negative/conflict, source offsets, research-proxy and security regressions all pass.

Frontend TypeScript and frontend/server production builds passed, 345 frontend modules; existing large-chunk advisory remains. The initial pain implementation briefly caused one old development assertion to fail; its intended behavior change is disclosed above. No failing critical evidence-state check remains.

## Unchanged evaluations — KNOWN-CASE DEVELOPMENT COMPARISONS

| Measure | Original first evaluation | Pre-task | Post-task |
| --- | ---: | ---: | ---: |
| L3 full language | 16/34 | 34/34 | 34/34 |
| L5 full language | 40/80 | 79/80 | 80/80 |
| L7 full cases | 61/110 | 87/110 | 97/110 |
| L7 exact evidence sets | 76/110 | 108/110 | 109/110 |
| L7 correct expected ID/state | 78/110 | 108/110 | 109/110 |
| L7 missing observations | 24/110 | 2/110 | 1/110 |
| L7 wrong states | 8/91 | 0/108 | 0/109 |
| L7 unexpected IDs | 5/91 | 0/108 | 0/109 |
| L7 incorrect positives | 11/56 | 0/62 | 0/63 |
| L7 incorrect negatives | 1/24 | 0/29 | 0/29 |
| L7 incorrect UNKNOWN | 0/8 | 0/15 | 0/15 |
| L7 incorrect contradictions | 1/3 | 0/2 | 0/2 |
| Warning probes in each set | 1/4 | 1/4 | 1/4 |

Recovered L7 full cases: **012,013,021,023,031,045,055,068,088,097**. L5-38 recovered. **No new full-case mismatches.** Remaining 13 L7 mismatches: one ambiguous-HA interpretation (036), three clarification-only differences (025,069,077), and nine retention-only scoring limitations (018,019,030,079,084,086,099,106,109). All remain failed in the frozen rubric. No missed expected ID besides general pain in HA case 036. The full source quotes/flags/remaining rows are saved in [L7 comparison](medassist-final-scope-l7-comparison.json), [L5 comparison](medassist-final-scope-l5-comparison.json) and [summary](medassist-final-scope-comparison-summary.json).

All three LF-normalized corpus digests match the frozen values. Original evaluators and first results remain unchanged. The derivative L7 metadata explicitly says implementationModified=true and known-case comparison; the evaluator's hardcoded false is not misrepresented. Repeat scores do not establish new independent accuracy.

## Real browser, summaries and downloaded exports

The existing [localhost MedAssist conversation](http://127.0.0.1:3000/#/preview/medassist-conversation) was opened in the in-app browser, visibly SIMULATED with no Model A inference. All **20 original L7 journeys passed** on replay, including exact M13. Fifteen produced downloaded JSON with frozen expected evidence; five correctly had no export (negative-only, pre-interview UNKNOWN conflict, pending resolution, missing age and restart).

Five additional actual downloads:

| Fixture | Verified behavior |
| --- | --- |
| [Pain and speakers](medassist-final-scope-pain-speaker-export.json) | General pain/cough confirmed, daughter-fever retained as third-party source, explicit target fever No, summary matches current evidence. |
| [Held pending](medassist-final-scope-held-pending-export.json) | Resolved pain held out; diarrhea survives vague-head and unsupported-elbow turns (earlier M05 preservation). Cough UNKNOWN and fever No remain distinct; summary counts UNKNOWN plus held pain. |
| [Accepted UNKNOWN](medassist-final-scope-accepted-unknown-export.json) | Earlier cough UNKNOWN and nausea retained; later explicitly confirmed cough positive flags blocked_unresolved_conflict without silently replacing UNKNOWN. |
| [Accepted negative](medassist-final-scope-accepted-negative-export.json) | Accepted pain No remains unchanged after confirmed positive exception; use is blocked for conflict. |
| [Accepted resolution](medassist-final-scope-accepted-resolved-export.json) | Accepted pain preserved in history, excluded from current; unrelated pending nausea retained, usage blocked_context_update. |

All **20 actual downloads** were read and checked, including source offsets and simulated/disabled model markers. Nine additional UI probes checked explicit speaker switching, conservative ellipsis, vague head/walking input, unable-to-describe wording, neutral HA prompt, uncertain exception abstention, explicit pain No and repeated-word discourse. Manual Emergency help paused the composer; no test call, location permission or Maps request occurred. Reset and early stop passed in the original journeys.

Layouts at 390/820/1440 px (1000 high) had client/scroll widths 375/375, 805/805 and 1425/1425: no horizontal overflow. Captured console contained Lit development warnings, no application errors. Full network tracing is unavailable on the browser surface; no complete external-request audit is claimed. Existing server health is checked separately; loopback preview remains running.

[Browser snapshots/diagnostics](medassist-final-scope-browser.json), [pain screenshot](screenshots/final-scope-pain.jpg), [accepted-history block](screenshots/final-scope-history.jpg), [phone](screenshots/final-scope-390.jpg), [tablet](screenshots/final-scope-820.jpg), [desktop](screenshots/final-scope-1440.jpg), [final preview](screenshots/final-scope-preview.jpg).

An early browser batch timed out/reset and was replayed with per-journey saves. Its older helper briefly reused three prior wording-export filenames; their exact committed Git contents were restored, and their diff is empty. All final downloads use this task's names. No prior frozen measurement was changed or lost.

## Boundaries, closure decision and next task

Only deterministic TypeScript and fictional fixtures ran. Model A inference/training and LLM/provider calls did not run; Model B remains disabled. NHAMCS/DDXPlus are historical context, not newly loaded datasets. No private/sealed artifacts, locked clinical evaluation, frozen 218-question protocol, ontology, emergency-warning rule, expanded emergency branch, ADR module or clinical endpoint was changed.

Warning probes remain **1/4 each** and need separate authorized safety review. Genuine Model A artifacts/runtime remain unverified; Model B, clinical guidance and deployment stay unavailable. Language still has bounded coverage, ambiguous abbreviations/referents, accepted-history restart limitations, and scorer/ontology gaps. These passing fictional development checks are not clinical qualification or universal English understanding.

**READY FOR EVALUATION** means only this implementation pass is ready for Prompt 2. The separately authorized next task should author/freeze fresh language, clarification and multi-turn cases before running, with explicit engineering closure criteria, actual browser/summary/download checks and no implementation tuning during measurement. Its closure decision may be PASS, FAIL or CONDITIONAL with disclosed limitations. Prompt 2, Model A verification/inference/integration and all other phases have not started.

The canonical tracker, roadmap, dated history, changelog, decisions and implementation navigation are updated. Only explicit task-owned files are committed through the existing helper; final local/direct remote SHA equality and clean-tree status are reported after synchronization.
