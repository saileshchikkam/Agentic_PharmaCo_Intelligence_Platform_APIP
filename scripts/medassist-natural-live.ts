/** Two predeclared fictional spot checks, not a qualification benchmark. */
import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { readNaturalVocabulary, readProposal } from '../src/features/medassist-conversation/natural';
const output='models/medassist_ai/docs/natural-language-spot-check.json';
assert.equal(existsSync(output),false,'Preserve prior observations');
const base='http://127.0.0.1:3000/api/research/model-a';
const vocabulary=readNaturalVocabulary(await (await fetch(base+'/natural/vocabulary')).json());assert.ok(vocabulary);
const cases=[
 {text:'I have a rash, but no fever.',expected:[{evidence_id:'E_129',state:'confirmed',value:true},{evidence_id:'E_91',state:'confirmed',value:false}]},
 {text:'I am not sure whether I have diarrhea.',expected:[{evidence_id:'E_51',state:'unknown',value:null}]},
];
const observations=[];
for(const c of cases){
 const at=performance.now();const r=await fetch(base+'/natural/extract',{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:3000'},
   body:JSON.stringify({schema_version:'medassist.natural-extract-request.v1',fictional_only:true,text:c.text,question_id:null}),signal:AbortSignal.timeout(18000)});
 const raw=await r.json();const parsed=r.ok?readProposal(raw,c.text,vocabulary,null):null;
 const actual=parsed?.observations.map(({evidence_id,state,value})=>({evidence_id,state,value})).sort((a,b)=>a.evidence_id.localeCompare(b.evidence_id));
 const expected=c.expected.sort((a,b)=>a.evidence_id.localeCompare(b.evidence_id));
 observations.push({fictional_text:c.text,status:r.status,latency_ms:Math.round(performance.now()-at),validated:!!parsed,expected,actual:actual??null,exact_semantics:JSON.stringify(actual)===JSON.stringify(expected)});
}
writeFileSync(output,JSON.stringify({fictional_only:true,profile:'medassist.natural-extraction.v1',purpose:'predeclared two-case engineering spot check; not broad accuracy or clinical qualification',observations},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(observations));
