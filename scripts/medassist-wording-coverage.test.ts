import test from 'node:test';
import assert from 'node:assert/strict';
import { understand } from '../src/features/medassist-conversation/understanding';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { clarifyWording } from '../src/features/medassist-conversation/presentation';
import { reviewProposal } from '../src/features/medassist-conversation/pending-proposal';
import { contextUpdates, holdPending, canConfirmPending, currentEvidence } from '../src/features/medassist-conversation/evidence-state';

// Prospective expectations authored before implementation. Fictional development
// contrasts, not an independent language evaluation. Original wording is sacred.
const forms: [string,string][] = [
 ['coff','201'], ['couugh','201'], ['feever','91'], ['fevar','91'],
 ['soar throat','97'], ['nausia','148'], ['diarrhoe','51'], ['chils','94'],
 ['liteheaded','76'], ['light-headed','76'], ['tummy hurts','53'],
 ['hed is hurting','53'], ['throat little sore','97'], ["throat's sore",'97'],
 ['nose getting blocked','181'], ['nose is stufffed','181'],
 ['nose is leaking water','181'], ['nose dripping clear water','181'],
 ['vomiting sensation','148'], ['feeling ready to puke','148'],
 ['throat scratching while swallowing','97'],
];
const shape=(text:string)=>understand(text,scriptedVocabulary);
const codes=(text:string)=>shape(text).proposal.observations.map(o=>o.evidence_id.slice(2)+(o.state==='unknown'?'?':o.state==='contradiction'?'!':o.value?'+':'-')).sort();
const contexts: [string,(s:string)=>string,(id:string)=>string[]][] = [
 ['current',s=>`I have ${s} right now.`,id=>[id+'+']],
 ['negative',s=>`I do not have ${s} today.`,id=>[id+'-']],
 ['uncertain',s=>`Maybe I have ${s}.`,id=>[id+'?']],
 ['historical',s=>`I had ${s} last week.`,()=>[]],
 ['hypothetical',s=>`If I have ${s}, what then?`,()=>[]],
 ['third person',s=>`My brother has ${s}.`,()=>[]],
 ['quote',s=>`A note reads "I have ${s}".`,()=>[]],
 ['resolution',s=>`My ${s} has stopped now.`,()=>[]],
 ['retraction',s=>`I have ${s}. Actually, I take that back.`,id=>[id+'!']],
 ['conflict',s=>`I have ${s}, but I do not have ${s}.`,id=>[id+'!']],
];
for(const [form,id] of forms)for(const [context,make,expected] of contexts)test(`${form}: ${context}`,()=>{
 const text=make(form), result=shape(text);
 assert.equal(result.validation_failed,false);
 assert.deepEqual(codes(text),expected(id));
 for(const a of result.annotations)assert.equal(text.slice(a.start,a.end),a.quote);
 for(const o of result.proposal.observations)assert.ok(text.includes(o.quote));
});
const cases:[string,string[]][]=[
 ['My hed is hurting since mrng.',['53+']],
 ['My head is not hurting.',['53-']],
 ['My tummy does not hurt.',['53-']],
 ['My nose is not getting blocked.',['181-']],
 ["My nose won't stop dripping clear water.",['181+']],
 ['No runs today, just a cough.',['201+','51-']],
 ['No coff today, just a feever.',['201-','91+']],
 ['No coff, nausia.', ['201-']],
 ['No coff, just a feever and chils.',['201-','91+','94+']],
 ['Loose motion going on.',['51+']],
 ['Feeling like throwing up.',['148+']],
 ['Body is aching badly.',['53+']],
 ['Head pain but no fever.',['53+','91-']],
 ['I have feever and nausia but no couugh.',['148+','201-','91+']],
 ['I feel ready to puke, though nothing has come up.',['148+']],
 ['Vomiting sensation coming, no actual vomit.',['148+']],
 ['My throat is a little sore.',['97+']],
 ['Light headed I am now.',['76+']],
 ['My brother has nausia but I have chils.',['94+']],
 ['My nose is stufffed and my brother has a coff.',['181+']],
 ["My coff hasn't stopped.",['201+']],
 ['I have coff coff today.',['201+']],
 ['I will develop a fevar tomorrow.',[]],
 ['Coffee is ready and the coffer is full.',[]],
 ['I soar over the hills.',[]],
 ['My throat is dry.',[]],
 ['My throat is itchy outside.',[]],
 ['The tap is leaking water.',[]],
 ['Water went into my nose.',[]],
 ['I run every day.',[]],
 ['The bus runs today.',[]],
 ['The runs in this program are slow.',[]],
 ['My nose has green mucus.',[]],
 ['My head feels heavy, not painful.',[]],
 ['HA since tea.',[]],
 ['My calf is sore.',[]],
];
for(const [text,expected] of cases)test(text,()=>{assert.equal(shape(text).validation_failed,false);assert.deepEqual(codes(text),expected.sort());});
for(const text of ['My stomach feels weird.','Something is happening in my head.','Body is not okay.','Feeling funny when walking.','Not able to sleep, feeling strange.','Feeling tired from yesterday.'])test('useful clarification: '+text,()=>{
 assert.deepEqual(codes(text),[]);assert.ok(clarifyWording(text));
});
for(const text of ['Pain coming and going.','Getting pain sometimes sometimes.'])test('keep general pain and request detail: '+text,()=>assert.deepEqual(codes(text),['53+']));
test('new spellings retain M13 holds, stale guard, accepted history and unrelated pending information',()=>{
 const source={requestId:'original',proposal:shape('I have a coff and loose motions.').proposal};
 const pending=reviewProposal(null,source)!;
 const updates=contextUpdates('That coff has stopped now.','change',scriptedVocabulary,pending,[]);
 assert.equal(updates.length,1);assert.equal(canConfirmPending(pending,updates),false);
 const kept=holdPending(pending,updates)!;
 assert.deepEqual(kept.sources.flatMap(s=>s.proposal.observations.map(o=>o.evidence_id)),['E_51']);
 const accepted={items:[{evidence_id:'E_201',value:true},{evidence_id:'E_51',value:true}]};
 assert.deepEqual(currentEvidence(accepted,updates).items,[{evidence_id:'E_51',value:true}]);
 assert.equal(accepted.items.length,2);assert.equal(source.proposal.observations.length,2);
});
test('M05 and clarification preserve prior new-vocabulary pending evidence',()=>{
 const p=reviewProposal(null,{requestId:'one',proposal:shape('Loose motion going on.').proposal})!;
 for(const text of ['My left elbow hurts.','My stomach feels weird.'])assert.equal(reviewProposal(p,{requestId:'two',proposal:shape(text).proposal}),p);
});
