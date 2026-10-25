import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { understand } from '../src/features/medassist-conversation/understanding';
import { evaluateStatement } from '../src/features/medassist-safety/safety';
import type { NaturalVocabulary } from '../src/features/medassist-conversation/natural';
const root='models/medassist_ai/evaluation/symptom-understanding-v1/';
const bytes=readFileSync(root+'suite.json'), digest=createHash('sha256').update(bytes).digest('hex');
assert.equal(digest,readFileSync(root+'suite.sha256','utf8').split(' ')[0]);
const suite=JSON.parse(bytes.toString()), metadata=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json','utf8'));
const vocabulary:NaturalVocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:metadata.items.filter((d:any)=>!d.quarantined).map((d:any)=>({...d,value_labels:Object.fromEntries(Object.entries(d.value_labels??{}).filter(([,value])=>typeof value==='string')),initial_allowed:d.kind==='symptom'&&!d.parent})),coverage:{symptom_fields:110,universal_coverage:false}};
const output=process.argv[2]??root+'deterministic-initial.json';assert.equal(existsSync(output),false,'Preserve previous evaluation receipts.');
const key=(o:any)=>JSON.stringify([o.evidence_id,o.state,o.value]);
let tp=0,fp=0,fn=0,exact=0,negationCorrect=0,qaCorrect=0,unsupportedCorrect=0,safetyCorrect=0;
const rows=suite.cases.map((row:any)=>{
 const d=vocabulary.items.find(d=>d.evidence_id===row.question_id), pending=d?{...d,allows_unknown:true as const,unknown_value:null}:null;
 const analysis=understand(row.text,vocabulary,pending,row.prior_context),observations=analysis.proposal.observations.map(({evidence_id,state,value})=>({evidence_id,state,value}));
 const actual=new Set(observations.map(key)), gold=new Set<string>(row.expected.observations.map(key));
 for(const value of actual)gold.has(value)?tp++:fp++;
 for(const value of gold)if(!actual.has(value))fn++;
 const evidenceExact=JSON.stringify([...actual].sort())===JSON.stringify([...gold].sort());if(evidenceExact)exact++;
 if(row.category==='negation'&&evidenceExact)negationCorrect++;
 if(row.question_id&&analysis.compatibility.status===row.expected.compatibility&&evidenceExact)qaCorrect++;
 if(row.category==='unsupported_or_ambiguous'&&evidenceExact)unsupportedCorrect++;
 const safety=evaluateStatement(row.text).status==='escalate';if(safety===row.expected.emergency_escalation)safetyCorrect++;
 const annotationKinds=new Set(analysis.annotations.map(a=>a.context));
 const annotationsCorrect=row.expected.annotation_kinds.every((kind:string)=>annotationKinds.has(kind as any));
 return{id:row.id,text:row.text,category:row.category,evidence_exact:evidenceExact,observations,expected:row.expected.observations,
  compatibility:analysis.compatibility.status,expected_compatibility:row.expected.compatibility,annotations_correct:annotationsCorrect,
  validation_failed:analysis.validation_failed??false,complete_deterministic:analysis.complete,safety_correct:safety===row.expected.emergency_escalation};
});
const count=(category:string)=>suite.cases.filter((r:any)=>r.category===category).length;
const summary={suite_sha256:digest,cases:rows.length,fictional_only:true,clinical_accuracy:false,method:'deterministic normalization + strict proposal validation; no LLM calls',
 true_positive_mappings:tp,false_positive_mappings:fp,missed_mappings:fn,concept_precision:tp+fp?tp/(tp+fp):null,concept_recall:tp+fn?tp/(tp+fn):null,
 evidence_exact:{correct:exact,total:rows.length},negation:{correct:negationCorrect,total:count('negation')},question_answer:{correct:qaCorrect,total:suite.cases.filter((r:any)=>r.question_id).length},
 unsupported_abstention:{correct:unsupportedCorrect,total:count('unsupported_or_ambiguous')},emergency_preservation:{correct:safetyCorrect,total:rows.length},
 context_annotations:{correct:rows.filter((r:any)=>r.annotations_correct).length,total:rows.length},deterministic_complete:rows.filter((r:any)=>r.complete_deterministic).length,
 failed_ids:rows.filter((r:any)=>!r.evidence_exact||r.compatibility!==r.expected_compatibility||!r.annotations_correct||!r.safety_correct).map((r:any)=>r.id)};
writeFileSync(output,JSON.stringify({summary,rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
