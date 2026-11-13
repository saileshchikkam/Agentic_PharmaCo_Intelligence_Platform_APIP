# Accelerated Model A program — Prompt 1 language audit

Date: 2026-11-08. Scope: fictional, local, scripted MedAssist only. This is an engineering audit, not a clinical validation, generalized-English claim, Model A result, diagnosis, urgency assessment or dataset study.

## Decision

**Prompt 1 is complete for its scoped pipeline repair and design work. Stage 3 is not closed.** The scripted browser path is working for ordinary supported wording; the withheld corpus exposes real gaps that must be addressed in Prompt 2. Model A inference did not run, Model B remains disabled, and no external provider received data.

## End-to-end root cause audit

| Path | Finding | Evidence | Result |
| --- | --- | --- | --- |
| Server/runtime | The initial preview had no listener on port 3000, so the browser got connection refused. | Repository launcher started with Node 24; `GET /api/health` then returned `status: ok`, development, legacy agents disabled and `geminiConfigured: false`. | Operational startup defect, repaired by starting the documented loopback launcher; no code/config change required. |
| Served client | Development uses Express + Vite middleware. The fresh browser page showed `SIMULATED · Ready to listen`; source changes were served by Vite. | The exact supplied “My head hurts badly since morning.” rendered `pain : Yes` and an explicit confirmation card. | No stale bundle reproduced. |
| Default interpretation | The mounted component starts with `scripted=true`, calls `understand(...)` in-browser and does not call the Model A natural-extract route. | Source trace: `MedAssistConversation.tsx` → `understanding.ts` → `language-context.ts`/`concepts.ts` → `pending-proposal.ts` → explicit confirmation. | The example uses the same interpreter as the scripted tests. |
| Research switch | The visible “Switch to Model A research” mode correctly reported “Question service offline” and “requires a verified private adapter and operator opt-in.” | Browser route returned the disabled research boundary; no private adapter, token, model or provider was enabled. | A user in this mode cannot expect broad extraction. This is an intentional capability boundary, not a fallback path. |
| Negation | Apostrophe-free contractions were not recognized: `I dont have fever` previously proposed a positive fever. | Shared `negationCue`/`uncertaintyCue` required an apostrophe. | Repaired generically for omitted apostrophes in common contractions; original text, offsets, confirmation and ontology remain unchanged. |
| Rendering/confirmation/export | Supported proposals render before acceptance; original text and unmapped spans stay visible. Existing M05/M13 state/export tests remain the authority. | Browser showed original text, `pain : Yes`, and confirm/reject controls. Existing current export regression fixtures remain valid because no evidence/export schema changed. | No swallowed interpreter error or backend interaction exists on the scripted path. |

The reported generic unsupported response is therefore not reproducible for the supplied head-pain wording in scripted mode. It is consistent with either an unavailable local preview, intentional Model A research mode with no adapter, or an actually unsupported/ambiguous description. It must not be described as evidence that a Model A service interpreted the input.

## Nine-field smoke matrix

All nine current-positive pathways passed a new deterministic smoke test: cough `E_201`, fever `E_91`, sore throat `E_97`, nasal congestion/clear runny nose `E_181`, chills `E_94`, general pain `E_53`, nausea `E_148`, diarrhea `E_51`, and slight dizziness/lightheadedness `E_76`.

The test uses plain current statements and requires a source-bound proposal, not acceptance. Multi-symptom handling was also checked with an unsupported ear-ringing description plus cough and a fever denial: cough positive and fever negative were proposed; ear ringing remained unmapped. `I dont have fever`, `I havent had diarrhea today` and `I doesnt have cough` now produce negative evidence rather than positives.

These nine fields remain a small scripted research contract. Plain “I feel dizzy” is intentionally ambiguous; chest, urinary, skin, mental/behavioral, eye/ear and most limb complaints are not represented by them.

## Frozen systemic corpus and results

Two new fictional corpora were authored and frozen with SHA-256 before measurement:

| Set | Cases | Families | SHA-256 | Result |
| --- | ---: | ---: | --- | --- |
| Development | 50 | ten | `76da0cdcfec7be4b0a0cc46ce8d463838aeed20abfbe74de3af4466a8b1e4401` | 48/50 expectation matches |
| Withheld | 50 | ten | `b1dafee4525c1a578b38b53ffd42c206c5ac85c1d1ca12146831f99ea79101ec` | 43/50 expectation matches |

Each set spans head/nervous/balance; eyes/ears; nose/mouth/throat; respiratory; chest/cardiovascular; digestive; urinary/reproductive; muscles/joints/limbs; skin/allergic; and general/mental/behavioral descriptions. Rows include Indian English, spelling/grammar variation, short/incomplete text, mixed complaints, negation, uncertainty, corrections, family members, history, resolution and unsupported content. See the fixed source files and `scripts/evaluate-medassist-systemic-language.ts`; that evaluator verifies hashes before emitting results.

The results are a small fictional regression screen, not an independent clinical benchmark or general-English percentage.

### Complete mismatch matrix

| Set / case | Expected | Observed | Category | Prompt 2 priority |
| --- | --- | --- | --- | --- |
| Development D-CC-02 | preserve unsupported chest denial + cough positive | both clauses clarified | clause context (“No chest pain, only cough”) | P1 context segmentation |
| Development D-SA-04 | preserve unsupported rash denial + fever positive | both clauses clarified | clause context (“No rash, only feverish”) | P1 context segmentation |
| Withheld W-HN-01 | pain positive | clarification | Indian-English word order / descriptive pain grammar | P2 contextual extraction candidate |
| Withheld W-HN-03 | resolution / clarification | stale pain positive | unresolved synonym `settled` | P0 temporal resolution safety |
| Withheld W-EE-04 | clarification | general-pain negative | site-scoped denial leaked into general pain | P0 polarity/site scope safety |
| Withheld W-NT-02 | nasal positive | clarification | word-order grammar | P2 contextual extraction candidate |
| Withheld W-CC-01 | clarification | general-pain positive | chest-location phrase overmapped to general pain | P0 anatomic scope safety |
| Withheld W-ML-01 | pain positive | clarification | ordinary back-ache grammar | P2 contextual extraction candidate |
| Withheld W-GM-03 | fever negative + chills positive | fever negative only | everyday “shivery” synonym | P2 coverage candidate |

No withheld expectation was changed after measurement. The two development misses are likewise retained as failures; they are not converted to passing behavior by relabelling.

## Architecture recommendation

Use a **hybrid, confirmation-gated intake architecture** in Prompt 2:

1. Retain deterministic sentence segmentation, source offsets, polarity/uncertainty/history/speaker gates, emergency precedence and the legacy validator.
2. Add an optional contextual extractor that produces grounded `medassist.open-symptom-mention.v1` candidates, never accepted facts.
3. Store every comprehensible complaint as an open mention even when no nine-field mapping is available.
4. Allow the deterministic validator to map a candidate to an existing legacy ID only when source-grounded and context-safe; require explicit confirmation.
5. Keep a deterministic abstaining fallback for timeout, invalid output, unavailable model and any failed validation.

The new unintegrated contract is documented in [open-ended symptom intake](../architecture/medassist-open-ended-symptom-intake.md). It preserves source text, body-location text, family, time, polarity, attribution, uncertainty, provenance, mapping state, clarification and confirmation separately from the frozen nine-field evidence contract.

### Options assessed

| Option | Generalization | Safety / cost / runtime | Decision |
| --- | --- | --- | --- |
| Existing literal rules only | Predictable and source-bound, but weak on unseen grammar, body systems and mixed discourse. | Fast, private, no cost; brittle coverage. | Retain as validation/fallback, not the sole strategy. |
| Pretrained extractor only | Potentially better paraphrase, grammar and multi-complaint handling. | Hallucination, attribution/polarity and structured-output risk; needs evaluation. This laptop has 8 GB RAM, 2-core/4-thread i3-1005G1 and 1 GB Intel UHD graphics; `ollama` is not on PATH. | Do not select or run one yet. A 4B medical model cannot be assumed feasible or timely locally. |
| Hybrid contextual candidate + deterministic validation + confirmation | Best chance of useful new wording without letting a model change evidence state. | Requires controlled fictional evaluation, bounded local/server runtime, source-span validation and fallback. | Selected architecture for Prompt 2. |

Candidate comparison order: first test a small already-authorized local instruction model only if its runtime is actually available; then compare an authorized pretrained medical-text candidate only if its license, install, latency and memory fit are verified. An optional hosted provider is not permitted for private symptom data without explicit authorization. No candidate has yet demonstrated material improvement, so no model is promoted.

## Prompt 2 implementation contract

- Input: fictional text, up to bounded prior turns, and current pending-question ID; never hidden prompts, account data or private assets.
- Output: zero or more source-span-grounded open mentions; optional legacy mapping; no diagnosis, triage, medication, emergency classification or Model A question selection.
- Validation: exact source span, schema, legacy-ID allowlist, typed polarity, temporal/speaker gates, correction/retraction handling, deduplication and no unsupported automatic current evidence.
- Confirmation: show original wording and each proposal; acceptance is per candidate; rejected/unsupported descriptions remain visible.
- Failure: source-preserving clarification on timeout, invalid schema, provider failure, quota or low confidence; never an unrelated legacy mapping.
- Privacy: local/fictitious testing first; server-side credentials only; no external transmission or automatic local-to-cloud fallback.
- Gates: zero critical stale/current/polarity leaks; source-grounding 100%; all M05/M13 state checks pass; fixed withheld suite remains unchanged; report exact/open-mention/clarification accuracy separately; browser/export regression passes before any promotion.

Fine-tuning is not planned or implemented. It would require a licensed, governed dataset; written annotation guidelines; independent annotator agreement; patient-data governance if applicable; train/validation/test split discipline; and held-out safety, language and calibration evaluation.

## Browser, export and safety evidence

The actual preview was opened at `http://127.0.0.1:3000/#/preview/medassist-conversation`. Before startup it returned connection refused; after the documented launcher it loaded as **SIMULATED**. The supplied head-pain example rendered a source-preserved `pain : Yes` proposal; an ordinary cough did the same. Switching research mode visibly showed the adapter-required offline boundary, and switching back restored scripted mode. Console contained only Lit development-mode warnings, with no application errors.

The scripted path does not call a backend extraction/model service. No export schema changed in this task. Existing actual-download regression fixtures and M05/M13 export assertions remain covered by the regression suite; Prompt 2 must add open-mention export/download browser checks before that new record is integrated. Manual Emergency help, emergency rules and Model B were not changed or activated.

## Validation

- Combined relevant Node suite: **724 passed, 0 failed, 0 skipped, 0 cancelled** (718 prior checks plus 6 new systemic tests), including legacy-security, Model A proxy fail-closed behavior, safety, M05/M13/export and frozen L3/L5/L7 regression checks.
- Systemic evaluation command: development **48/50**, withheld **43/50**; the evaluator verified both frozen SHA-256 values before scoring.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- Production build: `node node_modules/vite/bin/vite.js build` passed (345 modules). The existing >500 kB chunk advisory remains.
- The first combined run was **711 passed / 13 loopback-socket blocked** under restricted local networking; the identical suite passed 724/724 when rerun with permitted local loopback access. No assertion failure was masked.

## Limits and next action

The current app remains a simulated, nine-field fictional demo. The new corpora expose unresolved context scope, resolution vocabulary, anatomic site scope, broad grammar and open-body coverage. The current browser test proves the narrow scripted path—not broad natural-language understanding, Model A readiness, clinical usefulness or Model A completion.

Proceed only with the separately authorized Prompt 2 implementation described below. Do not enable Model B, change emergency rules, access private/sealed Model A assets, alter the DDXPlus/218-question protocol, train/fine-tune a model or send data to a provider.
