import test from 'node:test';
import assert from 'node:assert/strict';
import { ClarificationTracker, conceptKey } from '../src/features/medassist-conversation/clarification';
import { anchors, proposalAddsInformation, readProposal, readNaturalVocabulary, type NaturalVocabulary } from '../src/features/medassist-conversation/natural';
import { createGroqTransport } from '../server/groq-extraction';
const vocabulary:NaturalVocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:Object.keys(anchors).map(evidence_id=>({evidence_id,kind:'symptom',data_type:'B',question_en:anchors[evidence_id].label,possible_values:[],initial_allowed:true})),coverage:{symptom_fields:110,universal_coverage:false}};
const proposal=(text:string,state='confirmed',value:unknown=true)=>({schema_version:'medassist.natural-extraction.v1',observations:[{evidence_id:'E_53',state,value,quote:text}],unmapped:[],instruction_attempt:false});
test('reported stomach pain and headache map only to the existing general pain feature',()=>{
 for(const text of ['I have stomach pain that started three days ago','stomach pain','headache']){
  const p=readProposal(proposal(text),text,vocabulary,null);assert.ok(p);assert.equal(p.observations[0].evidence_id,'E_53');assert.equal(p.observations.length,1);
 }
});
test('pain polarity, UNKNOWN and contradiction stay explicit; duration is not a feature',()=>{
 for(const [text,state,value] of [['no stomach pain','confirmed',false],['not sure about headache','unknown',null],['headache but actually no headache','contradiction',null]] as const)
  assert.ok(readProposal(proposal(text,state,value),text,vocabulary,null));
 for(const text of ['no headache','maybe stomach pain'])assert.equal(readProposal(proposal(text),text,vocabulary,null),null);
 const raw={...proposal('stomach pain'),unmapped:[{quote:'three days',kind:'duration'}]};
 assert.equal(readProposal(raw,'stomach pain for three days',vocabulary,null)?.observations.length,1);
});
test('equivalent simplifications keep one unresolved pain concept without discarding new details',()=>{
 const t=new ClarificationTracker();t.fail('I have stomach pain that started three days ago','initial','mapping');
 const repeated=t.check('stomach pain','initial');assert.equal(repeated.blocked,true);assert.match(repeated.message!,/already kept/);
 assert.equal(t.check('stomach pain','initial').message,null);assert.equal(t.snapshot()[0].attempts,2);
 assert.equal(t.check('I have a fever','initial').blocked,false);
 assert.equal(conceptKey('abdominal pain','initial'),conceptKey('stomach pain','initial'));
});
test('one genuinely new detail may clarify; after the second failure the loop ends',()=>{
 const t=new ClarificationTracker();t.fail('stomach pain','initial','unsupported');
 assert.equal(t.check('stomach pain for three days','initial').blocked,false);
 assert.match(t.fail('stomach pain for three days','initial','unsupported'),/supported scope/);
 assert.equal(t.check('stomach pain for three days','initial').message,null);
});
test('service errors are not described as unsupported symptoms; manual retry is bounded',()=>{
 for(const kind of ['provider','quota','timeout','invalid_output'] as const){
  const t=new ClarificationTracker();assert.doesNotMatch(t.fail('headache','initial',kind),/outside.*scope/);
  assert.equal(t.canRetry('headache','initial'),true);assert.equal(t.check('headache','initial',true).blocked,false);
  t.fail('headache','initial',kind);assert.equal(t.canRetry('headache','initial'),false);assert.equal(t.check('headache','initial',true).blocked,true);
 }
});
test('new pending questions have separate clarification state; restart clears unresolved entries',()=>{
 const t=new ClarificationTracker();t.fail('unknown words','E_56','unsupported');assert.equal(t.check('unknown words','E_58').blocked,false);
 t.clear('unknown words','E_56');assert.deepEqual(t.snapshot(),[]);t.fail('words','initial','mapping');t.reset();assert.deepEqual(t.snapshot(),[]);
});
test('trusted metadata labels display exact codes without inventing anatomical locations',()=>{
 const v={...vocabulary,items:[...vocabulary.items,{evidence_id:'E_55',kind:'symptom' as const,data_type:'M' as const,question_en:'Where?',possible_values:['V_25'],value_labels:{V_25:'back of head'},initial_allowed:false}]};
 assert.ok(readNaturalVocabulary(v));const q={evidence_id:'E_55',question_en:'Where?',data_type:'M' as const,possible_values:['V_25'],allows_unknown:true as const,unknown_value:null};
 const p={...proposal('back of head'),observations:[{evidence_id:'E_55',state:'confirmed',value:['V_25'],quote:'back of head'}]};
 assert.ok(readProposal(p,'back of head',v,q));assert.equal(readProposal({...p,observations:[{...p.observations[0],quote:'headache'}]},'headache',v,q),null);
 assert.equal(readNaturalVocabulary({...v,items:[{...v.items.at(-1),value_labels:{V_999:'invented'}}]}),null);
});
test('new transport exposes safe failure categories while preserving legacy error messages',async()=>{
 for(const [status,expected] of [[429,'RATE_LIMITED'],[403,'AUTH_FAILURE'],[500,'PROVIDER_UNAVAILABLE']] as const){
  const p=createGroqTransport({key:'fictional-key',model:'qwen/qwen3.8-27b',prompt:'fixture',schema:{},evaluationHash:'a'.repeat(64),fetchImpl:(async()=>new Response('private-error',{status})) as typeof fetch});
  await assert.rejects(()=>p.extractNatural('headache',vocabulary,null),(e:any)=>e.category===expected&&e.message==='GROQ_UNAVAILABLE_OR_INVALID');
 }
 const invalid=createGroqTransport({key:'fictional-key',model:'qwen/qwen3.8-27b',prompt:'fixture',schema:{},evaluationHash:'a'.repeat(64),fetchImpl:(async()=>Response.json({choices:[{message:{content:'{}'}}]})) as typeof fetch});
 await assert.rejects(()=>invalid.extractNatural('headache',vocabulary,null),(e:any)=>e.category==='INVALID_STRUCTURED_OUTPUT');
 const c=new AbortController();c.abort();await assert.rejects(()=>invalid.extractNatural('headache',vocabulary,null,c.signal),(e:any)=>e.category==='PROVIDER_TIMEOUT');
});

test('re-extracted accepted facts do not create another confirmation/current-question loop',()=>{
 const p=proposal('stomach pain') as any,known=[{evidence_id:'E_53',state:'confirmed' as const,value:true}];
 assert.equal(proposalAddsInformation(p,known),false);
 assert.equal(proposalAddsInformation(proposal('no pain','confirmed',false) as any,known),true,'a changed fact must reach explicit conflict handling');
 const t=new ClarificationTracker();assert.match(t.fail('stomach pain','E_55','duplicate'),/already recorded/);
 assert.equal(t.check('stomach pain','E_55').blocked,true);assert.equal(t.check('stomach pain','E_55').message,null);
});
