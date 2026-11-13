import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const url=(s:string)=>new URL('../docs/evaluation/'+s,import.meta.url);
const read=(s:string)=>JSON.parse(readFileSync(url(s),'utf8'));
const b=read('medassist-final-scope-browser.json');
const pairs=(x:any)=>x.evidence.items.map((i:any)=>[i.evidence_id,i.value]).sort();
function provenance(x:any){assert.equal(x.evidence.model_a_inference,false);assert.equal(x.evidence.model_b_status,'not_enabled');for(const r of x.understanding_records)for(const a of r.annotations)assert.equal(r.text.slice(a.start,a.end),a.quote);}
for(const row of read('medassist-l7-english-v1.json').journeys)test('current actual journey '+row.id,()=>{
 const r=b.journeys.find((r:any)=>r.id===row.id);assert.equal(r.status,'passed');
 const name='medassist-final-scope-'+row.id.toLowerCase()+'-export.json';
 if(r.exportAbsent){assert.equal(existsSync(url(name)),false);return;}
 const x=read(name);provenance(x);assert.deepEqual(pairs(x),[...row.expected].sort());
 if(row.flow==='accepted_conflict_export_blocked')assert.equal(x.evidence_usage,'blocked_unresolved_conflict');
});
test('actual pain exception and speaker export preserves target positives and explicit fever denial',()=>{
 const x=read('medassist-final-scope-pain-speaker-export.json');provenance(x);
 assert.deepEqual(pairs(x),[['E_201',true],['E_53',true],['E_91',false]]);
 const r=x.understanding_records[0];assert.ok(r.annotations.some((a:any)=>a.evidence_id==='E_91'&&a.context==='other_person'));
 assert.ok(x.user_confirmed_proposals[0].observations.find((o:any)=>o.evidence_id==='E_53').quote.includes('No pain apart from'));
});
test('actual pain resolution/M05 preserves unrelated pending and unknown/negative answers',()=>{
 const x=read('medassist-final-scope-held-pending-export.json');provenance(x);
 assert.deepEqual(pairs(x),[['E_201',null],['E_51',true],['E_91',false]]);
 assert.deepEqual(x.excluded_from_current,['E_53']);assert.equal(x.context_updates[0].status,'unresolved');
 for(const text of ['My head feels strange.','My left elbow hurts.'])assert.equal(x.understanding_records.find((r:any)=>r.text===text).confirmed,false);
});
test('actual accepted UNKNOWN remains UNKNOWN when a later confirmed proposal conflicts',()=>{
 const x=read('medassist-final-scope-accepted-unknown-export.json');provenance(x);
 assert.equal(x.evidence_usage,'blocked_unresolved_conflict');
 assert.deepEqual(pairs(x),[['E_148',true],['E_201',null]]);
 assert.equal(x.evidence.items.find((i:any)=>i.evidence_id==='E_201').status,'unknown');
 assert.equal(x.user_confirmed_proposals.length,2);
});
test('actual accepted negative pain is not overwritten by a later positive exception',()=>{
 const x=read('medassist-final-scope-accepted-negative-export.json');provenance(x);
 assert.equal(x.evidence_usage,'blocked_unresolved_conflict');assert.deepEqual(pairs(x),[['E_53',false],['E_94',true]]);
});
test('actual accepted resolution keeps history and unrelated nausea draft while blocking use',()=>{
 const x=read('medassist-final-scope-accepted-resolved-export.json');provenance(x);
 assert.equal(x.evidence_usage,'blocked_context_update');assert.deepEqual(pairs(x),[['E_94',true]]);
 assert.equal(x.accepted_evidence_history.items.find((i:any)=>i.evidence_id==='E_53').value,true);
 assert.equal(x.pending_proposals.sources[0].proposal.observations[0].evidence_id,'E_148');
});
