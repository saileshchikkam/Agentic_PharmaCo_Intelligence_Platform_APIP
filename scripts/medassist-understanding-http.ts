/** Existing loopback services only. Fixed fictional statements; zero cloud calls expected. */
import assert from 'node:assert/strict';
import {writeFileSync,existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {readProposal,readNaturalVocabulary,readNaturalResult,type NaturalRequest} from '../src/features/medassist-conversation/natural';
const output='models/medassist_ai/docs/symptom-understanding-http.json';assert.equal(existsSync(output),false);
const base='http://127.0.0.1:3000/api/research/model-a',origin='http://127.0.0.1:3000';
const vocabulary=readNaturalVocabulary(await(await fetch(base+'/natural/vocabulary')).json());assert.ok(vocabulary);
const before=await(await fetch(base+'/language/diagnostics')).json();
const statements=[['I have a cough.',['E_201']],["I've been coughing for three days.",['E_201']],["It's mostly a dry cough. I can breathe normally.",['E_201','E_66']],['I am not coughing.',['E_201']],['I used to cough, but it stopped.',[]],['My brother is coughing.',[]],['I have stomach pain.',['E_53']],['My head hurts.',['E_53']],["I've had lower back pain for three days.",['E_53']],['I think I have a tumor in my breast.',[]],['I have a lump in my breast.',[]],["I have diarrhea and nausea, but I haven't vomited.",['E_51','E_148']]] as const;
const rows=[];
for(const [text,ids] of statements){
 const session=randomUUID(),id=randomUUID(),headers={'Content-Type':'application/json',Origin:origin,'X-Conversation-ID':session,'X-Request-ID':id};
 const body={schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text,question_id:null,prior_context:[]};
 const at=performance.now(),r=await fetch(base+'/natural/extract',{method:'POST',headers,body:JSON.stringify(body)}),p=readProposal(await r.json(),text,vocabulary,null);
 assert.equal(r.status,200);assert.ok(p);assert.equal(r.headers.get('x-extraction-method'),'deterministic.v1');assert.deepEqual(p.observations.map(o=>o.evidence_id),ids);
 const replay=await fetch(base+'/natural/extract',{method:'POST',headers,body:JSON.stringify(body)});assert.equal(replay.headers.get('x-idempotent-replay'),'1');
 const row:any={text,method:'deterministic.v1',status:r.status,elapsed_ms:Math.round(performance.now()-at),observations:p.observations,unmapped:p.unmapped,actual_model_a:null};
 if(['I have a cough.','My head hurts.',"I have diarrhea and nausea, but I haven't vomited."].includes(text)){
  const initial=p.observations.find(a=>a.state==='confirmed'&&a.value===true)!;
  const clean=({evidence_id,state,value}:any)=>({evidence_id,state,value});
  const request:NaturalRequest={schema_version:'medassist.natural-request.v1',fictional_only:true,context:{age:35,source_sex:'F'},initial:clean(initial),initial_disclosures:p.observations.filter(a=>a!==initial).map(clean),turns:[],stop:null};
  const selected=await fetch(base+'/natural/interview',{method:'POST',headers:{...headers,'X-Request-ID':randomUUID()},body:JSON.stringify(request)}),result=readNaturalResult(await selected.json());assert.equal(selected.status,200);assert.ok(result);
  assert.ok(result.result.selection.question);assert.equal(result.result.handoff!.items.length,223);assert.equal(result.result.handoff!.model_b_status,'not_enabled');
  row.actual_model_a={first_question_id:result.result.selection.question.evidence_id,items:223,model_b_status:'not_enabled',authored_fictional_confirmation:true};
 }
 rows.push(row);
}
const blocked=await fetch(base+'/natural/extract',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text:'I cannot breathe',question_id:null,prior_context:[]})});assert.equal(blocked.status,409);
const after=await(await fetch(base+'/language/diagnostics')).json();assert.equal(after.calls,before.calls);
writeFileSync(output,JSON.stringify({fictional_only:true,actual_http:true,actual_model_a:true,cloud_calls:after.calls-before.calls,existing_emergency_guard:true,rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cases:rows.length,actual_model_a_paths:rows.filter(r=>r.actual_model_a).length,cloud_calls:0,emergency_guard:true}));
