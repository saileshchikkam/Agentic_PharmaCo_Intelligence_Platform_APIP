import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name:string)=>JSON.parse(readFileSync(new URL('../docs/evaluation/'+name,import.meta.url),'utf8'));
test('actual M13/M05 download excludes stale cough and keeps confirmed diarrhea plus source history',()=>{
 const x=read('medassist-post-l7-m13-m05-export.json');
 assert.deepEqual(x.evidence.items.map((i:any)=>[i.evidence_id,i.value]),[['E_51',true]]);
 assert.equal(x.context_updates[0].evidence_id,'E_201');
 assert.equal(x.context_updates[0].status,'unresolved');
 assert.equal(x.understanding_records.find((r:any)=>r.text==='I have a cough during this shift.').confirmed,false);
 assert.equal(x.understanding_records.find((r:any)=>r.text==='My left elbow hurts.').confirmed,false);
});
test('actual accepted-update download separates history, current evidence and an unaccepted draft',()=>{
 const x=read('medassist-post-l7-accepted-update-export.json');
 assert.equal(x.evidence_usage,'blocked_context_update');
 assert.equal(x.accepted_evidence_history.items.find((i:any)=>i.evidence_id==='E_201').value,true);
 assert.ok(!x.evidence.items.some((i:any)=>i.evidence_id==='E_201'));
 assert.equal(x.evidence.items.find((i:any)=>i.evidence_id==='E_91').status,'unknown');
 assert.equal(x.evidence.items.find((i:any)=>i.evidence_id==='E_97').value,false);
 assert.equal(x.pending_proposals.sources[0].proposal.observations[0].evidence_id,'E_148');
 assert.equal(x.understanding_records.find((r:any)=>r.text==='I feel nauseated.').confirmed,false);
});
test('actual explicit UNKNOWN reconciliation does not retroactively confirm the held cough source',()=>{
 const x=read('medassist-post-l7-reconciled-export.json');
 assert.equal(x.evidence.items.find((i:any)=>i.evidence_id==='E_201').status,'unknown');
 assert.equal(x.context_updates[0].status,'reconciled_by_confirmation');
 assert.deepEqual(x.understanding_records[0].confirmed_evidence_ids,['E_51']);
 assert.equal(x.evidence.items.find((i:any)=>i.evidence_id==='E_91').value,false);
});
test('actual unresolved-summary download contains only unrelated current evidence',()=>{
 const x=read('medassist-post-l7-held-summary-export.json');
 assert.deepEqual(x.evidence.items.map((i:any)=>i.evidence_id),['E_94']);
 assert.deepEqual(x.excluded_from_current,['E_201']);
 assert.equal(x.context_updates[0].status,'unresolved');
});
test('actual ordinary-conflict download retains prior evidence and explicitly blocks its use',()=>{
 const x=read('medassist-post-l7-conflict-export.json');
 assert.equal(x.evidence_usage,'blocked_unresolved_conflict');assert.equal(x.unresolved_conflict,true);
 assert.equal(x.evidence.items[0].value,true);
 assert.equal(x.user_confirmed_proposals.length,2);
 for(const name of ['medassist-post-l7-m13-m05-export.json','medassist-post-l7-accepted-update-export.json','medassist-post-l7-reconciled-export.json','medassist-post-l7-held-summary-export.json','medassist-post-l7-conflict-export.json']){
  const data=read(name);assert.equal(data.evidence.model_a_inference,false);assert.equal(data.evidence.model_b_status,'not_enabled');
  for(const r of data.understanding_records)for(const a of r.annotations)assert.equal(r.text.slice(a.start,a.end),a.quote);
 }
});
