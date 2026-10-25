import {readFileSync,writeFileSync} from 'node:fs';
import {languageConcepts,ambiguousConcepts} from '../src/features/medassist-conversation/concepts';
const metadata=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json','utf8'));
const topics=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-topic-memberships.json','utf8'));
const targets=new Set(Object.values(topics.topics).flat() as string[]);
const fields=metadata.items.map((d:any)=>{
 const concepts=languageConcepts.filter(c=>c.evidence_id===d.evidence_id),initial=d.kind==='symptom'&&!d.quarantined&&!d.parent;
 return{...d,canonical_identifier:d.evidence_id,human_meaning:d.question_en,
  language_concepts:concepts.map(c=>({concept_id:c.concept_id,canonical:c.canonical,synonyms:c.synonyms,pattern:c.pattern.source})),
  schema_initial_eligible:initial,free_text_initial_extraction:initial&&concepts.length>0,
  model_a_research_question_target:!d.quarantined,natural_chat_question_target:!d.quarantined&&targets.has(d.evidence_id),
  conditional_parent_requires_explicit_positive:d.parent??null,
  follow_up_language:'Exact shown choices, explicitly supported labelled values or UNKNOWN; other wording is validated/clarified.',
  confirmation_required:true,clarification_required_when:'Unknown meaning, missing qualifiers/side, conflicting evidence, incompatible question or subject/time scope.',
  unsupported_or_ambiguous:ambiguousConcepts.filter(c=>c.candidate_fields.includes(d.evidence_id)).map(c=>({expressions:c.expressions,reason:c.reason})),
  no_language_mapping_reason:concepts.length?null:d.quarantined?'Quarantined frozen-schema child; never exposed as an eligible question.':'No initial free-text language concept is implemented; evidence-schema existence is not language coverage.'};
});
const counts={schema_definitions:fields.length,active_definitions:fields.filter((d:any)=>!d.quarantined).length,quarantined:fields.filter((d:any)=>d.quarantined).length,
 symptoms:fields.filter((d:any)=>d.kind==='symptom').length,antecedents:fields.filter((d:any)=>d.kind==='antecedent').length,
 initial_schema_symptoms:fields.filter((d:any)=>d.schema_initial_eligible).length,mapped_language_concepts:languageConcepts.length,
 ambiguous_unmapped_concepts:ambiguousConcepts.length,initial_language_fields:fields.filter((d:any)=>d.free_text_initial_extraction).length,
 natural_chat_question_targets:fields.filter((d:any)=>d.natural_chat_question_target).length};
writeFileSync('models/medassist_ai/docs/symptom-coverage-inventory.json',JSON.stringify({schema_version:'medassist.symptom-coverage.v1',local_date:'2026-10-25',counts,
 semantics:{evidence_fields_are_not_diseases:true,diagnosis_enabled:false,model_b_enabled:false,disease_labels_in_research_archives:'Not read or used in this audit; separate task/labels, never evidence-field counts.',clinical_validation:false,initial_language_is_narrower_than_schema:true},
 ambiguous_concepts:ambiguousConcepts,fields},null,2)+'\n');console.log(JSON.stringify(counts));
