import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const url=(name:string)=>new URL('../docs/evaluation/'+name,import.meta.url);
const read=(name:string)=>JSON.parse(readFileSync(url(name),'utf8'));
const corpus=read('medassist-l7-english-v1.json');
const browser=read('medassist-wording-browser-results.json');
const pairs=(x:any)=>x.evidence.items.map((i:any)=>[i.evidence_id,i.value]).sort();
function provenance(x:any){
 assert.equal(x.evidence.model_a_inference,false);assert.equal(x.evidence.model_b_status,'not_enabled');
 assert.equal(x.evidence.missing_item_semantics,'unspecified_never_negative');
 for(const r of x.understanding_records)for(const a of r.annotations)assert.equal(r.text.slice(a.start,a.end),a.quote);
}
for(const row of corpus.journeys)test('actual browser replay / download '+row.id,()=>{
 const observed=browser.journeys.find((r:any)=>r.id===row.id);
 assert.equal(observed.status,'passed');assert.ok(observed.snapshots.length>=3);
 const filename='medassist-wording-'+row.id.toLowerCase()+'-export.json';
 if(observed.exportAbsent){assert.equal(existsSync(url(filename)),false);return;}
 const data=read(filename);provenance(data);assert.deepEqual(pairs(data),[...row.expected].sort());
 if(row.flow==='accepted_conflict_export_blocked')assert.equal(data.evidence_usage,'blocked_unresolved_conflict');
});
test('actual new wording accepted update preserves history and pending diarrhea',()=>{
 const x=read('medassist-wording-new-accepted-export.json');provenance(x);
 assert.equal(x.evidence_usage,'blocked_context_update');
 assert.equal(x.accepted_evidence_history.items.find((i:any)=>i.evidence_id==='E_201').value,true);
 assert.ok(!x.evidence.items.some((i:any)=>i.evidence_id==='E_201'));
 assert.deepEqual(pairs(x),[['E_91',false],['E_94',true]]);
 assert.equal(x.pending_proposals.sources[0].proposal.observations[0].evidence_id,'E_51');
 assert.equal(x.understanding_records.find((r:any)=>r.text==='Loose motion going on.').confirmed,false);
});
test('actual new wording UNKNOWN explicitly reconciles only a held pending field',()=>{
 const x=read('medassist-wording-new-reconciled-export.json');provenance(x);
 assert.deepEqual(pairs(x),[['E_201',null],['E_51',true],['E_91',false]]);
 assert.equal(x.context_updates[0].status,'reconciled_by_confirmation');
 assert.deepEqual(x.understanding_records[0].confirmed_evidence_ids,['E_51']);
 for(const text of ['My stomach feels weird.','My left elbow hurts.'])assert.equal(x.understanding_records.find((r:any)=>r.text===text).confirmed,false);
});
test('actual held summary excludes stale new-spelling cough',()=>{
 const x=read('medassist-wording-new-held-export.json');provenance(x);
 assert.deepEqual(pairs(x),[['E_51',true]]);assert.deepEqual(x.excluded_from_current,['E_201']);
 assert.equal(x.context_updates[0].status,'unresolved');
});
test('actual mixed informal wording keeps positive, negative and UNKNOWN distinct',()=>{
 const x=read('medassist-wording-new-mixed-export.json');provenance(x);
 assert.deepEqual(pairs(x),[['E_181',true],['E_201',false],['E_91',null],['E_97',true]]);
 assert.equal(x.evidence.items.find((i:any)=>i.evidence_id==='E_91').status,'unknown');
});
test('actual clarification-to-confirmation export retains vague source without inventing nausea',()=>{
 const x=read('medassist-wording-clarification-export.json');provenance(x);
 assert.deepEqual(pairs(x),[['E_201',null],['E_51',true]]);
 assert.equal(x.understanding_records.find((r:any)=>r.text==='My stomach feels weird.').confirmed,false);
});
