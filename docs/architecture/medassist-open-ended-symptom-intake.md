# Open-ended symptom intake boundary

Status: implementation design for Prompt 2; no provider, model, persistence, legacy ontology or Model A handoff has changed.

## Why this boundary exists

The current scripted MedAssist demo has exactly nine confirmation-eligible binary evidence fields: cough (`E_201`), fever (`E_91`), sore throat (`E_97`), nasal congestion/clear runny nose (`E_181`), chills (`E_94`), general pain (`E_53`), nausea (`E_148`), diarrhea (`E_51`) and slight dizziness/lightheadedness (`E_76`). They are not an all-body symptom ontology.

An unfamiliar but intelligible complaint must remain visible as source-bound, unconfirmed text. It must never be silently mapped to a nearby research field, treated as a negative, or sent into the frozen 218-question protocol merely because it sounds medically related.

## Proposed record

`src/features/medassist-conversation/open-symptom.ts` defines the unintegrated `medassist.open-symptom-mention.v1` shape. Each mention has:

- original source text plus exact character offsets;
- neutral description, optional stated location and optional literal time text;
- one broad intake family or `unclassified`, not a diagnosis;
- current/history/future/unknown temporal context, polarity and speaker attribution;
- deterministic/model-candidate/user-entered provenance and bounded confidence;
- an optional, separately validated legacy mapping; and
- clarification and confirmation state.

The record is append-only source evidence. A later correction or resolution adds a source-bound update; it does not overwrite a confirmed legacy evidence value. Existing M05/M13 rules remain the authority for the nine-field session.

## Ten intake families

1. Head, nervous system and balance.
2. Eyes and ears.
3. Nose, mouth and throat.
4. Respiratory.
5. Chest and cardiovascular.
6. Digestive.
7. Urinary and reproductive.
8. Muscles, joints and limbs.
9. Skin and allergic.
10. General systemic, mental and behavioral.

Family assignment is an intake-navigation hint only. It does not establish clinical classification, urgency, specialty, causal relation, treatment or severity.

## Prompt 2 extractor boundary

The extractor may propose zero or more `OpenSymptomMention` candidates, each grounded to a contiguous source span. A deterministic validator must reject out-of-range offsets, altered wording, unsupported legacy IDs, impossible state/value pairs, a non-current/other-person mapping, unsupported certainty, or a proposal without a source span. The application displays every candidate for explicit user confirmation.

Only after confirmation may a separately validated mapping create one of the nine current legacy evidence answers. A mention with `mapping: null` remains in the visible open-description list and export. Model output must not select Model A questions, write accepted evidence, infer anatomy/time/diagnosis, weaken emergency safeguards, or erase a previous source statement.

## Privacy and failure behavior

Prompt 2 must default to local deterministic handling. Any optional external/model extraction requires a separate, visible fictional-data boundary, server-side secret, explicit authorization and no silent fallback from local to cloud. Timeout, invalid schema, source-grounding failure, quota and model unavailability preserve the user text and request clarification; they never invent an answer.

No Model B, clinical prediction, medication, emergency-rule change, new dataset training, ADR change, frozen research-ID change or Model A inference is authorized by this design.
