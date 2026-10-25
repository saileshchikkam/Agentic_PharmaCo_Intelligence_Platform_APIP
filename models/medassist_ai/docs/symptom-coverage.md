# Exact symptom and evidence coverage

2026-10-25, verified metadata and implementation inventory. [Full JSON inventory](symptom-coverage-inventory.json), [metadata-only snapshot](symptom-schema-metadata.json), [auditable topic memberships](symptom-topic-memberships.json). No patient records, disease-label archives or test ledger were opened.

## Counts are different capabilities

- **223 schema definitions:** 110 symptom fields and 113 antecedent/history fields.
- **218 active definitions:** five quarantined antecedent children remain excluded. The active API contains 110 symptom and 108 antecedent fields.
- **96 schema-eligible initial symptom fields:** fourteen symptom children require an explicitly positive parent. Initial eligibility does not imply free-text understanding.
- **30 mapped English language concepts/fields**, plus four explicitly ambiguous/unmapped concepts. All 30 can produce proposed initial observations; a negative-only/UNKNOWN-only description still cannot supply Model A's positive initial premise.
- **55 unique topical question targets** in the conversational wrapper, selected from the frozen eligible pool. The separate original research adapter can ask eligible questions across the 218 active definitions. Neither count is a disease count.
- **Zero diagnostic outputs or clinical urgency providers enabled.** Disease labels in separate research datasets are not symptom fields, urgency labels or confirmed diagnoses. Those archives were not inspected for this inventory.

Every JSON field records its canonical ID, source meaning, type, exact values/available labels, exclusion/dependency, language synonyms/pattern, initial-extraction eligibility, original versus conversational question-target eligibility, clarification/confirmation requirements and known ambiguity. A field with an empty language-concept list has no implemented initial language mapping; it must not be advertised as understood free text.

## Canonical mappings

- E_201: cough, coughing, coughed in current context, been coughing, persistent cough; allowlisted `couhg`/`coughng` spellings. Historical/resolved/third-party uses are not current cough.
- E_53: existing general pain. Stomach/abdominal pain, belly ache, headache/head hurts and lower-back aching retain their anatomy and time as user wording; no anatomical subregion is inferred.
- E_148: nausea, nauseous/nauseated, sick **to the stomach**, feel like vomiting/throwing up. Unqualified “feeling sick” remains ambiguous.
- E_51: diarrhea, diarrhoea, allowlisted `diarhea`. E_91: fever/feverish. E_97: sore throat/throat feels sore.
- E_181: nasal congestion/stuffy nose or **clear** runny nose. E_182: **green/yellow** nasal discharge. Generic runny nose/discharge does not establish color or either qualified field.
- E_66: **significant** shortness of breath/difficulty breathing. A clear unopposed normal-breathing statement may propose absence; generic positive breathing difficulty does not establish the significant qualifier. Independent safety executes first; these are unapproved fictional engineering mappings, not a safety rule.
- Other mapped fields: E_211 repeated vomiting; E_129 rash/skin lesions; E_151 swelling; E_30 abdominal bloating; E_94 chills; E_50 sweating; E_144 diffuse muscle pain; E_175 new fatigue/body aches; E_89 constant fatigue/unrefreshing sleep; E_103 loss of smell; E_212 hoarseness; E_203 intense coughing fits; E_166 vomiting after coughing; E_219 worse at night; E_32 decreased appetite; E_74 red eyes; E_127 excessive tears; E_170 severe eye itching; E_93 numb feet; E_177 numbness/tingling; E_76 slight dizziness/lightheadedness. Their qualifiers remain mandatory.

No fuzzy nearest-symptom/nearest-ID search is used. Spelling equivalences are explicit whole-word forms, not general typo tolerance. The inventory lists exact implemented synonyms; it is not a comprehensive English or clinical terminology dictionary.

## Anatomy, time and question answers

Pain-location E_55 and radiation E_57 use the actual metadata choices. `anus` is a real option (V_22); right/left ankle are distinct V_34/V_35, and posterior ankle options are different V_23/V_24. These must not be substituted for each other. A new remote site after lower-back wording requires explicit additional-site/radiation/correction language or clarification. A location being in the schema does not establish that it answers the present question.

Numbers are accepted only as exact allowed values for the question; “severe” cannot become an invented 0–10 score. Missing side or unfamiliar anatomical terminology remains ambiguous. Explicit empty multichoice, UNKNOWN and negative binary answers remain distinct. Clarification does not consume a routine question, and the eight-routine-question budget is preserved.

Source spans and literal location/duration/onset/frequency/severity/progression wording are recorded outside the unchanged `model-a-to-b.evidence.v1` handoff. No dates, scores, clinical thresholds or anatomical relationships are calculated from prose. See [implementation, evaluation and blockers](symptom-understanding.md).
