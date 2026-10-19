# Symptom-interview data contract v2.1

**Subsequent Task 2:** the [loader/simulator guide](task2-loader-simulator.md) records the implemented streaming source reader and separate minimal selector view. This original Task 1 schema is unchanged; no archival snapshot converter or clinical assessment is introduced. Later implementation supersedes only the historical “not implemented” status notes below.

This contract is a research storage/validation design. It does not determine what to ask clinically, make care recommendations, supply a trained model or validate source facts. Clinical review remains required. JSON Schema draft 2020-12 provides shape checks; `validate_interview` adds typed-value, chronology, provenance and reference consistency. It never changes inputs to make them pass.

## Source fields and separation

[Official DDXPlus documentation](https://github.com/mila-iqia/ddxplus) describes the following synthetic fields; [versioned Figshare metadata](https://api.figshare.com/v2/articles/22687585/versions/2) supplies the dataset/file/licence provenance recorded in the manifest.

| DDXPlus field | Future research role |
| --- | --- |
| AGE, SEX | Synthetic source context. Preserve units and source construct; source SEX is not an inferred pregnancy status or gender identity. |
| INITIAL_EVIDENCE | Starting evidence identifier for an interview simulation; not a natural-language patient narrative. |
| EVIDENCES | **Hidden simulator oracle**, revealed on demand. Full patient evidence must never be a starting interview input. |
| PATHOLOGY, DIFFERENTIAL_DIAGNOSIS | Synthetic diagnostic research references only, excluded from interview features and care-urgency labels. |
| Evidence metadata: question_en, is_antecedent, data_type | Public question text, symptom/history distinction and B/C/M typing. |
| Evidence metadata: code_question, possible-values, value_meaning, default_value | Related-question groups, admissible categories/meanings and generation conventions. Group semantics need review before imposing dependencies; defaults are not patient answers. |
| Condition metadata severity | Synthetic condition attribute; prohibited as care-urgency ground truth or a feature shortcut. |

No real file schema, missingness, class balance, patient-group identifier or complete population coverage is claimed from metadata alone. The raw validator accepts the six documented patient fields only. CSV list-literals use `ast.literal_eval`, never `eval`; list lengths are bounded before parsing. Unknown fields/codes, malformed types, duplicate evidence, incompatible values or absent initial evidence block validation. The normalized catalogue uses `kind`, `data_type`, `question_en` and `possible_values`; an official-metadata adapter is **not implemented**. Retain original source files/default meanings externally for later review, without adding default negative answers to a conversation.

## Interview snapshot semantics

Each `record_id` identifies one disclosure snapshot; `case_id` identifies its underlying case across turns. `disclosure_index` bounds every visible answer's `turn_index`. Source-record, group and case-family references remain provenance fields for data governance/splitting, **not predictive features**. Only fictional references are committed. A future source-row reference must be stable and external; do not invent a real patient identifier or infer patient independence from a row number.

- `presenting_complaint` preserves text or a starting evidence identifier and its reporter. Missing complaints use `source=unprovided` and null fields; no invented text is generated from a diagnosis.
- `context` records age with explicit unit/status; reported sex/gender with its construct/status; reporter/caregiver relationship; pregnancy status/optional gestational weeks; postpartum status/optional days since birth. Unknown/declined/not-collected values remain null. Age zero is valid. No age cap, reproductive-state inference, clinical age bands or inferred normal status is introduced. Children, adults and older adults are representable; this does not prove dataset or clinical coverage. Voluntary profile information would still require consent/source freshness in a future application integration.
- `symptoms` and `antecedents` are **tracked evidence identifiers**, including unasked items. Membership does **not** mean present. `evidence_types` must agree with the external versioned catalogue. Catalogues are shared metadata, not replicated hidden patient evidence.
- `answer_history` retains only disclosed observations with source and turn. `confirmed_answers` references the explicitly current confirmed observations. B accepts true/false, not 1/0; C accepts one catalogue value; M accepts a unique list of catalogue values. Empty multichoice and false binary answers are observed answers, distinct from null/unknown. A synthetic oracle disclosure is still synthetic, not a patient's statement.
- `unknown_information` distinguishes not-asked, unknown, declined, unavailable and contradiction. Every tracked evidence must have a current confirmed answer or an explicit unknown state, never both. Previously answered evidence cannot become “never asked.” Unknown/declined histories cannot silently retain an older current answer.
- `contradictions` references all conflicting confirmed observations of one evidence. Unresolved conflicts have no current confirmed answer and retain `reason=contradiction`; resolution requires an explicit chosen confirmation reference. This validates the declared resolution, not the truth of the answer or authority of a clinical decision. No automatic resolver exists.
- `potential_follow_up_questions` stores versioned catalogue text, dependencies and candidate/blocked state. Unanswered prerequisites block candidates; self/cyclic dependencies are rejected. These are **declared research candidates**, not an implemented policy, clinical dependency graph, ranking or LLM question generator.

Raw PATHOLOGY, DIFFERENTIAL_DIAGNOSIS, EVIDENCES, severity, IMMEDR and urgency annotations are prohibited extra interview fields. A future model adapter must use an explicit input allowlist, excluding provenance/group IDs, source partitions, annotation references and hidden oracle data. Task 1 supplies validation and contracts, not a feature exporter, source converter or simulator. Temporal leakage cannot be detected when someone mislabels a fabricated future fact as already disclosed; a future loader/simulator needs additional oracle-access tests.

## Quality and split feasibility

`quality.profile` validates a small batch, reports missing-state/evidence-type counts and counts **independently reviewed** reference annotations separately from unlabelled/proposed fixtures. `class_coverage` can separately audit source diagnostic classes against an explicitly supplied source class list; such counts must be labelled synthetic diagnosis coverage, never urgency coverage. No actual DDXPlus class counts have been computed.

Connected groups join snapshots sharing source case/record/group references, a global case-family reference, or a normalized disclosed-content fingerprint. Duplicate record IDs fail. Content screening ignores incidental record IDs and normalizes complaint whitespace/case; it is conservative screening, not semantic deduplication. It neither deletes nor moves duplicates. A future loader must supply trustworthy, stable family/group references and review near-duplicates; hidden relatives can still escape this screen.

Three connected groups are a **necessary structural condition**, not adequate class support, a feasible stratified allocation or clinical power. Candidate membership maps, when explicitly supplied by a caller, must cover every record with nonempty train/validation/test partitions. Cross-group membership and changes from published source partitions are blocked; no split or ratio is generated. Original `validate` is normalized to `validation` only as a name, not a reassignment. Cross-partition duplicate/source-family conflicts require review and a new approved plan; do not silently reshuffle the official test. Group checks cannot prove unobserved patient/site independence. The utility is in-memory and has no full-corpus memory/performance validation.

Task 1 always reports `urgency_training_ready=false`: there is no agreed clinical rubric, acquired corpus, frozen allocation, independently validated urgency-label set or approved model experiment. Passing structural checks cannot override these gaps.
