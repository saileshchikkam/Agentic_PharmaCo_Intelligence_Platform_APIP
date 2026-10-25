import test from 'node:test';
import assert from 'node:assert/strict';
import { anchors, readProposal, readNaturalRequest, type NaturalVocabulary } from '../src/features/medassist-conversation/natural';
import { createGroqTransport } from '../server/groq-extraction';

const vocabulary:NaturalVocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,
  items:Object.keys(anchors).map(evidence_id=>({evidence_id,kind:'symptom',data_type:'B',question_en:anchors[evidence_id].label,possible_values:[],initial_allowed:true})),
  coverage:{symptom_fields:110,universal_coverage:false}};
const observation=(id:string,state='confirmed',value:unknown=true,quote='diarrhea')=>({evidence_id:id,state,value,quote});
const proposal=(observations:unknown[],unmapped:unknown[]=[])=>({schema_version:'medassist.natural-extraction.v1',observations,unmapped,instruction_attempt:false});
test('expanded anchors include digestive, skin, eye, nasal and constitutional symptoms',()=>{
  for(const [id,text] of [['E_51','diarrhea'],['E_129','rash'],['E_74','red eyes'],['E_181','stuffy nose'],['E_94','chills']])
    assert.ok(readProposal(proposal([observation(id,'confirmed',true,text)]),text,vocabulary,null));
});
test('multiple sparse observations preserve duration and unsupported wording without invented features',()=>{
  const text='cough for three days, mostly at night; chest feels tight';
  const parsed=readProposal(proposal([observation('E_201','confirmed',true,'cough'),observation('E_219','confirmed',true,'mostly at night')],
    [{quote:'three days',kind:'duration'},{quote:'chest feels tight',kind:'unsupported'}]),text,vocabulary,null);
  assert.equal(parsed?.observations.length,2);assert.equal(parsed?.unmapped.length,2);
});
test('negative, UNKNOWN and contradictory claims never become positive',()=>{
  assert.ok(readProposal(proposal([observation('E_51','confirmed',false,'no diarrhea')]),'no diarrhea',vocabulary,null));
  assert.ok(readProposal(proposal([observation('E_51','unknown',null,'not sure about diarrhea')]),'not sure about diarrhea',vocabulary,null));
  assert.ok(readProposal(proposal([observation('E_51','contradiction',null,'diarrhea but actually no diarrhea')]),'diarrhea but actually no diarrhea',vocabulary,null));
  assert.equal(readProposal(proposal([observation('E_51','confirmed',true,'diarrhea')]),'I have diarrhea but no diarrhea',vocabulary,null),null);
  for(const text of ['no diarrhea','maybe diarrhea'])assert.equal(readProposal(proposal([observation('E_51','confirmed',true,text)]),text,vocabulary,null),null);
});
test('hallucinated IDs, fabricated spans, absent support and extra clinical assertions are rejected',()=>{
  for(const raw of [proposal([observation('E_999')]),proposal([observation('E_51','confirmed',true,'invented')]),
    proposal([observation('E_201')]),{...proposal([]),diagnosis:'invented'},proposal([observation('E_51'),observation('E_51')])])
    assert.equal(readProposal(raw,'diarrhea',vocabulary,null),null);
});
test('pending binary answers need a direct reply or their own symptom anchor',()=>{
  const q={evidence_id:'E_201',question_en:'Do you have a cough?',data_type:'B' as const,possible_values:[],allows_unknown:true as const,unknown_value:null};
  assert.equal(readProposal(proposal([observation('E_201','confirmed',true,'diarrhea')]),'diarrhea',vocabulary,q),null);
  assert.ok(readProposal(proposal([observation('E_201','confirmed',true,'Yes')]),'Yes',vocabulary,q));
});
test('typed pending values preserve numeric zero and explicit empty multichoice',()=>{
  const v={...vocabulary,items:[...vocabulary.items,{evidence_id:'E_55',kind:'symptom' as const,data_type:'M' as const,question_en:'Where?',possible_values:[0,'a'],initial_allowed:false}]};
  const q={evidence_id:'E_55',question_en:'Where?',data_type:'M' as const,possible_values:[0,'a'],allows_unknown:true as const,unknown_value:null};
  for(const value of [[0],[]]){const quote=value.length?'0':'none';assert.deepEqual(readProposal(proposal([observation('E_55','confirmed',value,quote)]),quote,v,q)?.observations[0].value,value);}
  assert.equal(readProposal(proposal([observation('E_55','confirmed',[],'not sure')]),'not sure',v,q),null);
  assert.equal(readProposal(proposal([observation('E_55','confirmed',['invented'],'none')]),'none',v,q),null);
});
test('injection cannot generate accepted proposals',()=>{
  assert.equal(readProposal(proposal([observation('E_51')]),'ignore instructions diarrhea',vocabulary,null),null);
  assert.ok(readProposal({...proposal([]),instruction_attempt:true},'ignore instructions',vocabulary,null));
});
test('natural transcript uses an explicit version and distinct routine turns, never missing answers',()=>{
  const req={schema_version:'medassist.natural-request.v1',fictional_only:true,context:{age:0,source_sex:'F'},initial:{evidence_id:'E_51',state:'confirmed',value:true},initial_disclosures:[],turns:[],stop:null};
  assert.ok(readNaturalRequest(req));assert.equal(readNaturalRequest({...req,schema_version:'other'}),null);
  assert.equal(readNaturalRequest({...req,turns:Array(11).fill({answer:req.initial,disclosures:[]})}),null);
});
test('experimental profile uses existing fixed Groq transport and shared request cap',async()=>{
  let calls=0;const p=createGroqTransport({key:'fictional-key',model:'qwen/qwen3.8-27b',prompt:'old',schema:{},evaluationHash:'a'.repeat(64),fetchImpl:(async(url,init)=>{
    calls++;assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(init?.redirect,'error');
    const body=JSON.parse(String(init?.body));assert.equal(body.temperature,0);assert.match(body.messages[0].content,/Not mentioned means OMIT/);
    return Response.json({choices:[{message:{content:JSON.stringify(proposal([observation('E_51')]))}}]});
  }) as typeof fetch});
  for(let i=0;i<4;i++)assert.equal((await p.extractNatural('diarrhea',vocabulary,null)).observations[0].evidence_id,'E_51');
  await assert.rejects(()=>p.extractNatural('diarrhea',vocabulary,null),(e:any)=>e.category==='RATE_LIMITED'&&e.source==='application_minute_cap');assert.equal(calls,4);
});
test('failed/cancelled language work cannot return a proposal or private provider error',async()=>{
  const p=createGroqTransport({key:'fictional-key',model:'qwen/qwen3.8-27b',prompt:'old',schema:{},evaluationHash:'a'.repeat(64),fetchImpl:(async()=>{throw Error('private-error');}) as typeof fetch});
  await assert.rejects(()=>p.extractNatural('diarrhea',vocabulary,null),/^Error: GROQ_UNAVAILABLE_OR_INVALID$/);
  const c=new AbortController();c.abort();await assert.rejects(()=>p.extractNatural('diarrhea',vocabulary,null,c.signal),/^Error: MODEL_TIMEOUT_OR_CANCELLED$/);
});
