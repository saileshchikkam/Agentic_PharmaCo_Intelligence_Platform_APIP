import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { understand } from '../src/features/medassist-conversation/understanding';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { clarifyPain,clarifyWording } from '../src/features/medassist-conversation/presentation';
import { readProposal } from '../src/features/medassist-conversation/natural';
import { reviewProposal } from '../src/features/medassist-conversation/pending-proposal';
import { contextUpdates,holdPending,canConfirmPending,currentEvidence,reconcilePendingUpdates } from '../src/features/medassist-conversation/evidence-state';
const fixture=JSON.parse(readFileSync(new URL('../docs/evaluation/medassist-final-scope-expectations.json',import.meta.url),'utf8'));
const results:any[]=[];
for(const row of fixture.cases)test(row.text,()=>{
 const x=understand(row.text,scriptedVocabulary);
 const evidence=x.proposal.observations.map(o=>o.evidence_id.slice(2)+(o.state==='unknown'?'?':o.state==='contradiction'?'!':o.value?'+':'-')).sort();
 results.push({text:row.text,evidence,validation_failed:x.validation_failed,unmapped:x.proposal.unmapped});
 assert.deepEqual(evidence,[...row.evidence].sort());assert.equal(x.validation_failed,false);
 for(const a of x.annotations)assert.equal(row.text.slice(a.start,a.end),a.quote);
 if(row.prompt)assert.match(clarifyWording(row.text)??'',new RegExp(row.prompt,'i'));
 if('painPrompt' in row)assert.equal(!!clarifyPain(row.text),row.painPrompt);
});
test.after(()=>{if(process.env.APIP_FINAL_SCOPE_RESULTS)writeFileSync(process.env.APIP_FINAL_SCOPE_RESULTS,JSON.stringify(results,null,2)+'\n');});
for(const row of JSON.parse(readFileSync(new URL('../docs/evaluation/medassist-final-clarification-expectations.json',import.meta.url),'utf8')).cases)test('clarification: '+row.text,()=>{
 const x=understand(row.text,scriptedVocabulary);
 const clarify=!x.proposal.observations.length||x.proposal.unmapped.some(u=>u.kind==='ambiguous')||x.proposal.observations.some(o=>o.evidence_id==='E_53'&&o.value===true&&!!clarifyPain(o.quote));
 assert.equal(clarify,row.clarify);
});
test('validator must not accept a positive proposal supported by an unqualified pain denial',()=>{
 const raw={schema_version:'medassist.natural-extraction.v1',instruction_attempt:false,unmapped:[],observations:[{evidence_id:'E_53',state:'confirmed',value:true,quote:'I have no pain'}]};
 assert.equal(readProposal(raw,'I have no pain.',scriptedVocabulary,null),null);
});
test('exception source uses the existing stale hold, explicit UNKNOWN and unrelated pending contracts',()=>{
 const src={requestId:'old',proposal:understand('No pain apart from an aching head and I have chills.',scriptedVocabulary).proposal};
 const p=reviewProposal(null,src)!;const changes=contextUpdates('The pain has stopped now.','new',scriptedVocabulary,p,[]);
 assert.equal(changes.length,1);assert.equal(canConfirmPending(p,changes),false);
 assert.deepEqual(holdPending(p,changes)?.sources.flatMap(s=>s.proposal.observations.map(o=>o.evidence_id)),['E_94']);
 const history={items:[{evidence_id:'E_53',value:true},{evidence_id:'E_94',value:true}]};
 assert.deepEqual(currentEvidence(history,changes).items,[{evidence_id:'E_94',value:true}]);assert.equal(history.items.length,2);
 assert.equal(reconcilePendingUpdates(changes,[{requestId:'explicit',proposal:understand('Maybe I have pain.',scriptedVocabulary).proposal}])[0].status,'reconciled_by_confirmation');
});
test('accepted UNKNOWN is not silently replaced by a positive statement',()=>{
 const x={schema_version:'medassist.natural-extraction.v1' as const,instruction_attempt:false,unmapped:[],observations:[{evidence_id:'E_201',state:'unknown' as const,value:null,quote:'Maybe cough'}]};
 const p=reviewProposal(null,{requestId:'old',proposal:x})!;
 const next=reviewProposal(p,{requestId:'new',proposal:understand('I have a cough now.',scriptedVocabulary).proposal});
 assert.ok(next?.alternative);assert.deepEqual(p.sources[0].proposal,x);
});
