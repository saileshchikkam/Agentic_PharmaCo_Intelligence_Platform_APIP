# MedAssist Stage 3 / L3 fictional English evaluation

**2026-11-06 · Baseline `47f509f078f27c73b2b2d9be98e98022facce166`**

The [38-case corpus](medassist-l3-english-v1.json) was AI-authored separately from T01–T35 after reviewing the contracts. Input, evidence state, required literal spans, retained context and intended interaction were fixed before the first run. The author also ran the evaluation, so independence here means separation from the L2 development set and no tuning after measurement. The corpus has no external annotation, clinical labels or representative sampling.

The [runner](../../scripts/medassist-l3-evaluate.ts) checks the frozen digest (UTF-8 with LF line endings), calls the existing provisional warning matcher first, then calls the actual scripted interpreter with its nine-field vocabulary. The nine fields are cough, fever, sore throat, nasal congestion or clear runny nose, chills, general pain, nausea, diarrhea, and slight dizziness or lightheadedness. A full match requires the same evidence ID/state set, a valid proposal, required source or narrative span where specified, and the intended interaction category. The runner projects the broad interaction from the result. Actual wording and rendering were sampled separately in the browser.

Run from the repo root with Node 24:

```sh
node --import tsx scripts/medassist-l3-evaluate.ts
```

The runner reports baseline mismatches as observations and asserts corpus integrity and proposal invariants. Its exit status covers successful measurement. The table is the acceptance evidence.

## Findings and L4 priorities

| Priority | Evidence and diagnosis | L4 implementation approach |
| --- | --- | --- |
| P0 · prevent unsupported current positives | L3-20 flips a denial. L3-21 and L3-23 turn uncertainty into presence. L3-26 and L3-34 promote past and hypothetical wording to current presence. L3-28 misses an explicit retraction. | Use context-aware clause parsing for assertion, negation, temporality, hypothetical scope and corrections. Share scope decisions with proposal validation. Preserve source spans and confirmation. Add new contrastive cases for phrasing that really is positive. |
| P0 · separate warning follow-up | L3-36 misses an indirect inability-to-breathe statement. L3-37 and L3-38 interrupt on quoted or denied literal phrases. | Review the warning behavior in its separately authorized safety workstream. Prepare a separate fictional warning corpus covering indirect, quoted, negated, historical and third-person examples. Preserve manual Emergency help and provisional status. |
| P1 · recover qualified meanings | L3-04, 06–09, 17 and 25 miss supported senses or word order. L3-13–15 miss spelling variants. | Add bounded deterministic spelling normalization and contextual synonym handling for everyday English, Indian English, slang and broken grammar. Preserve the original text. Test misleading near-neighbors and qualifiers before promoting a match. |
| P1 · preserve partial evidence | L3-22 loses explicit UNKNOWN through proposal rejection. L3-24 marks the whole sentence resolved and misses current chills. L3-17 keeps dizziness but gives no targeted follow-up for the missed nasal clause. | Use clause-local temporal scope and consistent UNKNOWN validation. Make clarification identify a missing or ambiguous clause while keeping any valid evidence subject to confirmation. |
| P2 · review ontology limits and extractor options | L3-05, 29–32 exercise safe abstention or narrative retention. Scratchiness, unspecified nasal discharge, actual vomiting without the required qualifier and spinning do not automatically justify the existing codes. | Retain original wording and ask one discriminating question. Route any ontology expansion to separate approval. If broader deterministic coverage remains inadequate, evaluate a constrained NLP or LLM extractor separately against a fresh independent set before any integration. |

Language had **16/34 full matches**. Across the 18 nonmatches there were 12 missing concept or state proposals, four wrong states on expected IDs, and two unexpected IDs. Six cases proposed unsupported presence (L3-20, 21, 23, 26, 28 and 34). One proposal was rejected by the existing validator (L3-22). Warning presentation matched **1/4**, with one missed interruption and two unexpected interruptions. These counts describe this authored corpus only.

Live loopback browser sampling reproduced the incorrect fever proposal in L3-20 and verified it awaited confirmation. L3-04 showed a generic clarification and L3-03 proposed both symptoms. Manual Emergency help opened. The inspected console contained the Lit development warning and no captured errors. No clinical assessment, genuine Model A, provider inference, locked evaluation or research-data access occurred.

## Frozen case-by-case results

`+` presence, `-` absence, `?` UNKNOWN, `!` conflict. All evidence shown is proposed, pending confirmation. Warning rows report the provisional UI gate before parsing.


Corpus SHA-256: 0c8999b4d8d34433d7e9721d33d8e3c5dd28af3a53a08e679cae317854c9fa44
Authored against: 47f509f078f27c73b2b2d9be98e98022facce166

| ID | Style | Input | Expected evidence / action | Observed evidence / action | Result |
| --- | --- | --- | --- | --- | --- |
| L3-01 | formal | I have been nauseated since breakfast. | E_148+ / confirm | E_148+ / confirm | Match |
| L3-02 | formal | I have experienced diarrhea for two days. | E_51+ / confirm | E_51+ / confirm | Match |
| L3-03 | formal | I have chills and a sore throat. | E_94+, E_97+ / confirm | E_94+, E_97+ / confirm | Match |
| L3-04 | everyday | My nose is blocked. | E_181+ / confirm | — / clarify | missing E_181+, interaction mismatch, required source span missing |
| L3-05 | everyday | My throat is scratchy. | — / clarify | — / clarify | Match |
| L3-06 | slang | I feel like puking. | E_148+ / confirm | — / clarify | missing E_148+, interaction mismatch, required source span missing |
| L3-07 | slang | I've got the runs. | E_51+ / confirm | — / clarify | missing E_51+, interaction mismatch, required source span missing |
| L3-08 | Indian English | Since last night, motions are loose. | E_51+ / confirm | — / clarify | missing E_51+, interaction mismatch, required source span missing |
| L3-09 | Indian English | Throat is paining when I swallow. | E_53+ / confirm | — / clarify | missing E_53+, interaction mismatch, required source span missing |
| L3-10 | Indian English | I am feeling fever only in the evening. | E_91+ / confirm | E_91+ / confirm | Match |
| L3-11 | broken grammar | cough there since 2 days | E_201+ / confirm | E_201+ / confirm | Match |
| L3-12 | broken grammar | No fever. Throat sore. | E_91-, E_97+ / confirm | E_91-, E_97+ / confirm | Match |
| L3-13 | spelling | I keep coffing at night. | E_201+ / confirm | — / clarify | missing E_201+, interaction mismatch, required source span missing |
| L3-14 | spelling | Sore throaat since Sunday. | E_97+ / confirm | — / clarify | missing E_97+, interaction mismatch, required source span missing |
| L3-15 | spelling | Diarhoea since yesterday. | E_51+ / confirm | — / clarify | missing E_51+, interaction mismatch, required source span missing |
| L3-16 | multiple | The fictional patient has a cough, chills, and nausea. | E_201+, E_94+, E_148+ / confirm | E_201+, E_94+, E_148+ / confirm | Match |
| L3-17 | multiple | I feel slightly dizzy, but my nose is stuffy too. | E_76+, E_181+ / confirm | E_76+ / confirm | missing E_181+ |
| L3-18 | negation | No cough and no fever, but I have chills. | E_201-, E_91-, E_94+ / confirm | E_201-, E_91-, E_94+ / confirm | Match |
| L3-19 | negation | I have a cough but haven't had any fever. | E_201+, E_91- / confirm | E_201+, E_91- / confirm | Match |
| L3-20 | negation | I am free of fever today. | E_91- / confirm | E_91+ / confirm | wrong state for E_91- |
| L3-21 | uncertainty | Could be a fever; I haven't checked. | E_91? / confirm | E_91+ / confirm | wrong state for E_91? |
| L3-22 | uncertainty | I’m not certain I have a cough. | E_201? / confirm | — / clarify | missing E_201?, proposal rejected, interaction mismatch, required source span missing |
| L3-23 | uncertainty | Possibly nausea, definitely chills. | E_148?, E_94+ / confirm | E_148+, E_94+ / confirm | wrong state for E_148? |
| L3-24 | temporal | My cough cleared up but I have chills now. | E_94+ / confirm | — / clarify | missing E_94+, interaction mismatch, required source span missing |
| L3-25 | temporal | I used to get nausea. Now my nose is stuffy. | E_181+ / confirm | — / clarify | missing E_181+, interaction mismatch, required source span missing |
| L3-26 | temporal | Yesterday I was feverish. Today I feel fine. | — / clarify | E_91+ / confirm | unexpected E_91+, interaction mismatch |
| L3-27 | contradiction | I have a sore throat. Actually, no sore throat. | E_97! / review_conflict | E_97! / review_conflict | Match |
| L3-28 | contradiction | I have chills. Scratch that, I don't. | E_94! / review_conflict | E_94+ / confirm | wrong state for E_94!, interaction mismatch |
| L3-29 | ambiguity | Something feels off around my head. | — / clarify | — / clarify | Match |
| L3-30 | ambiguity | My nose is running. | — / clarify | — / clarify | Match |
| L3-31 | unsupported | I've vomited three times and feel nauseated. | E_148+ / confirm | E_148+ / confirm | Match |
| L3-32 | unsupported | The room is spinning when I stand. | — / clarify | — / clarify | Match |
| L3-33 | context | My father has a cough, not me. | — / clarify | — / clarify | Match |
| L3-34 | context | If I get chills and nausea, what then? | — / clarify | E_148+ / confirm | unexpected E_148+, interaction mismatch |
| L3-35 | safety | This is a medical emergency. I also have chills. | — / interrupt | — / interrupt | Match |
| L3-36 | safety | I can't get any air in. | — / interrupt | — / clarify | interaction mismatch |
| L3-37 | safety | I read the phrase “I cannot breathe” in a story. | — / clarify | — / interrupt | interaction mismatch, required narrative detail missing |
| L3-38 | safety | I never said I need an ambulance. | — / clarify | — / interrupt | interaction mismatch, required narrative detail missing |

language: 16/34 full matches

safety: 1/4 full matches
