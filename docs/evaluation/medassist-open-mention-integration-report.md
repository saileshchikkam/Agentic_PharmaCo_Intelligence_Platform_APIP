# Prompt 2 — open-ended symptom capture and conversation integration

**2026-11-08 · fictional, local, deterministic implementation · `feat/medassist-jayanth`.** Prompt 2 implements the bounded layer designed in Prompt 1. It does not run Model A, an LLM, Model B, a provider, training, the frozen DDXPlus protocol, or an expanded emergency path.

## Contract and method

The existing scripted interpreter remains the only authority for the nine confirmation-eligible evidence fields. After it identifies an unmapped source span, the new deterministic layer creates an append-only, source-bound `medassist.open-symptom-mention.v1` record. It preserves exact text and offsets, a broad nonclinical intake family, context-derived polarity/temporality/speaker, a neutral status and `mapping: null`.

The prospective test contract was authored before the capture behavior: ten broad fictional families, mixed supported/unsupported reports, attribution/uncertainty/history/resolution context, stable IDs/no inferred supersession, and export exclusion. Unsupported records are explicitly `confirmation: not_applicable` because there is no semantic mapping to confirm. They are not accepted research evidence, do not alter the existing nine fields, do not enter Model A, and do not choose follow-up questions.

## Implemented integration

- `open-symptom.ts` captures only existing unmapped source spans, derives bounded display/context metadata, retains distinct source records and exports an explicit `model_a_eligible: false` section.
- `MedAssistConversation.tsx` keeps the records in page memory, clears them on restart, displays **Additional descriptions** independently of the confirmation card, and includes `open_symptom_mentions` in the existing scripted session download.
- The existing accepted-evidence, UNKNOWN, negative, conflict, M05 and M13 codepaths are not replaced or relaxed.

## Live verification

At [the local MedAssist preview](http://127.0.0.1:3000/#/preview/medassist-conversation), the fictional report “The fictional person has a cough and ears ringing.” produced a confirmable cough proposal and a separately visible **Kept as an additional description: ears ringing** record. After the cough alone was confirmed and fictional age/sex context supplied, the downloaded `scripted-medassist-session.json` contained:

- `schema_version: medassist.open-symptom-export.v1`;
- one `ears ringing` record with `mapping: null`, `confirmation: not_applicable`, and `model_a_eligible: false`; and
- the normal fictional-only evidence-use label, with cough retained as the confirmed positive (`E_201`).

The browser console had one existing Lit development-mode warning and no application errors. This is a single fictional workflow check, not clinical validation, general-English accuracy evidence, or a Model A test.

The final relevant Node regression run was **729 passed, 0 failed, 0 skipped**, including existing M05/M13, state/export, safety and security checks. TypeScript `--noEmit` and the Vite production build passed; the existing >500 kB chunk-size advisory remains.

## Limits and next gate

The broad family label is a neutral intake grouping, not an ontology, diagnosis, triage, anatomy inference or specialty routing. Context tags are bounded deterministic cues and can be incomplete. Records remain only in page memory and current session downloads. No reconciliation UI, durable storage, open-mention-to-nine-field mapping, independent NLP extractor, Model A input, provider call or clinical recommendation is implemented.

The next authorized work should freeze and run a genuinely new evaluation of contextual/open-ended extraction before considering an independently evaluated candidate extractor. It must preserve literal source text, explicit mapping confirmation, M05/M13 state guarantees, Model B disablement and the frozen research boundary.
