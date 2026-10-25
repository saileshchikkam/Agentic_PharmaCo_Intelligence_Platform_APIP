/** Guarded loopback regression with actual preserved model, no LLM/corpus/test calls. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { readNaturalResult, type NaturalRequest } from '../src/features/medassist-conversation/natural';
const endpoint='http://127.0.0.1:3000/api/research/model-a/natural/interview';
const headers={'Content-Type':'application/json','Origin':'http://127.0.0.1:3000'};
const req:NaturalRequest={schema_version:'medassist.natural-request.v1',fictional_only:true,context:{age:35,source_sex:'F'},initial:{evidence_id:'E_201',state:'confirmed',value:true},initial_disclosures:[],turns:[],stop:null};
let last;
for(let i=0;i<=8;i++){
 const r=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(req)});assert.equal(r.status,200);
 last=readNaturalResult(await r.json());assert.ok(last);
 const q=last.result.selection.question;
 if(i===8){assert.equal(q,null);break;}
 assert.ok(q);req.turns.push({answer:{evidence_id:q.evidence_id,state:'unknown',value:null},disclosures:[]});
}
assert.equal(last!.progress.answered,8);assert.equal(last!.result.handoff!.items.filter(i=>i.status==='unknown').length,8);
const forced={...req,turns:[...req.turns,{answer:{evidence_id:'E_202',state:'unknown',value:null},disclosures:[]}]};
assert.equal((await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(forced)})).status,422);
assert.equal((await fetch(endpoint,{method:'POST',headers:{...headers,Origin:'https://untrusted.invalid'},body:JSON.stringify(req)})).status,403);
const safety=await fetch('http://127.0.0.1:3000/api/research/model-a/natural/extract',{method:'POST',headers,
 body:JSON.stringify({schema_version:'medassist.natural-extract-request.v1',fictional_only:true,text:'I cannot breathe',question_id:null})});
assert.equal(safety.status,409);
const report={actual_model:true,routine_questions:8,ninth_question_rejected:true,unknown_count:8,external_origin_rejected:true,emergency_precedes_language:true,cloud_calls:0};
writeFileSync('models/medassist_ai/docs/natural-http-observations.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(report);
