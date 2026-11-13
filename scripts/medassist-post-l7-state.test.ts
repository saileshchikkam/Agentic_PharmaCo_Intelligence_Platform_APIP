import test from 'node:test';
import assert from 'node:assert/strict';
import { understand } from '../src/features/medassist-conversation/understanding';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { reviewProposal } from '../src/features/medassist-conversation/pending-proposal';
import { contextUpdates,holdPending,currentEvidence,reconcilePendingUpdates,acceptedUpdateBlocked,canConfirmPending } from '../src/features/medassist-conversation/evidence-state';
import { finalSummary } from '../src/features/medassist-conversation/natural';
const src=(requestId:string,text:string)=>({requestId,proposal:understand(text,scriptedVocabulary).proposal});
test('M13 resolution holds the named pending symptom and preserves its original source',()=>{
 const original=src('old','There is a cough during this rehearsal.');
 const pending=reviewProposal(null,original)!;
 const updates=contextUpdates('That cough has stopped now.','new',scriptedVocabulary,pending,[]);
 assert.equal(updates.length,1);assert.equal(updates[0].kind,'reported_resolution');
 assert.equal(holdPending(pending,updates),null);
 assert.deepEqual(updates[0].held_sources,[original]);assert.equal(original.proposal.observations[0].value,true);
});
test('a held field cannot leak through an unrelated confirmation or export projection',()=>{
 const pending=reviewProposal(null,src('both','I have nausea and chills.'))!;
 const changes=contextUpdates('The nausea has resolved now.','resolution',scriptedVocabulary,pending,[]);
 const kept=holdPending(pending,changes)!;
 assert.deepEqual(kept.sources.flatMap(s=>s.proposal.observations.map(o=>o.evidence_id)),['E_94']);
 const evidence={items:[{evidence_id:'E_94',value:true}]};
 assert.deepEqual(currentEvidence(evidence,changes),evidence);
 assert.equal(changes[0].status,'unresolved');
});
test('already accepted evidence is immutable but excluded from current evidence and blocks progression',()=>{
 const accepted={items:[{evidence_id:'E_201',value:true},{evidence_id:'E_94',value:true}]};
 const changes=contextUpdates('My cough has stopped now.','new',scriptedVocabulary,null,[{evidence_id:'E_201',state:'confirmed',value:true}]);
 assert.equal(acceptedUpdateBlocked(changes),true);
 assert.deepEqual(currentEvidence(accepted,changes).items,[{evidence_id:'E_94',value:true}]);
 assert.equal(accepted.items[0].value,true);
 assert.equal(reconcilePendingUpdates(changes,[src('third','I have a cough now.')])[0].status,'unresolved');
});
test('a fresh explicit confirmation can reconcile pending history without overwriting it',()=>{
 const p=reviewProposal(null,src('old','I have nausea.'))!;
 const changes=contextUpdates('My nausea has stopped.','change',scriptedVocabulary,p,[]);
 const later=src('fresh','I have nausea again now.');
 const reconciled=reconcilePendingUpdates(changes,[later]);
 assert.equal(reconciled[0].status,'reconciled_by_confirmation');
 assert.equal(changes[0].status,'unresolved');
 assert.deepEqual(reconciled[0].reconciled_by,['fresh']);
});
test('unsupported clarification preserves M05 pending evidence',()=>{
 const p=reviewProposal(null,src('first','Diarhoea and an odd elbow.'))!;
 const updates=contextUpdates('The elbow clicks.','other',scriptedVocabulary,p,[]);
 assert.equal(updates.length,0);assert.equal(holdPending(p,updates),p);
 assert.equal(reviewProposal(p,src('other','The elbow clicks.')),p);
});
test('quoted, hypothetical, old-episode and other-person resolution do not hold target evidence',()=>{
 const p=reviewProposal(null,src('old','I have a cough.'))!;
 for(const text of ['My brother has a cough that stopped.','If my cough stopped tomorrow, what then?','The phrase “my cough stopped” is quoted.','My cough stopped last year.'])
 assert.deepEqual(contextUpdates(text,'new',scriptedVocabulary,p,[]),[],text);
});
test('negated resolution is ongoing, not absence or a state update',()=>{
 const p=reviewProposal(null,src('old','I have a cough.'))!;
 assert.deepEqual(contextUpdates("My cough hasn't stopped.",'new',scriptedVocabulary,p,[]),[]);
 assert.equal(understand("My cough hasn't stopped.",scriptedVocabulary).proposal.observations[0]?.value,true);
});
test('a retraction holds implicated drafts while retaining source history',()=>{
 const p=reviewProposal(null,src('old','I have chills.'))!;
 const updates=contextUpdates('Actually, I take that back.','retract',scriptedVocabulary,p,[]);
 assert.equal(updates.length,1);assert.equal(holdPending(p,updates),null);
});
test('a later attribution correction holds target evidence without asserting another persons symptom',()=>{
 const p=reviewProposal(null,src('old','I have a cough.'))!;
 const updates=contextUpdates('That was my sister.','correction',scriptedVocabulary,p,[]);
 assert.equal(updates.length,1);assert.equal(holdPending(p,updates),null);
});
for(const [state,value] of [['confirmed',false],['unknown',null]] as const)test('only an explicit '+state+' reply reconciles a held pending field',()=>{
 const p=reviewProposal(null,src('old','I have a cough.'))!;
 const updates=contextUpdates('My cough has stopped now.','new',scriptedVocabulary,p,[]);
 const reply={requestId:'confirmed-turn:0',proposal:{...src('shape','I have a cough.').proposal,observations:[{evidence_id:'E_201',state,value,quote:'explicit reply'}]}};
 assert.equal(reconcilePendingUpdates(updates,[reply])[0].status,'reconciled_by_confirmation');
 assert.equal(updates[0].status,'unresolved');
});
test('stale event handlers cannot confirm the original held candidate before React rerenders',()=>{
 const old=reviewProposal(null,src('old','I have a cough and chills.'))!;
 const updates=contextUpdates('My cough has stopped.','change',scriptedVocabulary,old,[]);
 assert.equal(canConfirmPending(old,updates),false);
 assert.equal(canConfirmPending(holdPending(old,updates),updates),true);
});
test('an old held source is not an explicit reconciliation',()=>{
 const original=src('old','I have a cough.');
 const p=reviewProposal(null,original)!;
 const updates=contextUpdates('My cough has stopped.','change',scriptedVocabulary,p,[]);
 assert.equal(reconcilePendingUpdates(updates,[original])[0].status,'unresolved');
});
test('the final summary counts a held context without presenting it as a symptom or absence',()=>{
 const summary=finalSummary('user_stopped',{context:{age:29,source_sex:'F'},items:[{evidence_id:'E_94',status:'observed_positive'}]},[],1);
 assert.match(summary,/You confirmed: chills/);assert.match(summary,/Still uncertain: 1/);assert.doesNotMatch(summary,/no cough|confirmed: cough/);
});
