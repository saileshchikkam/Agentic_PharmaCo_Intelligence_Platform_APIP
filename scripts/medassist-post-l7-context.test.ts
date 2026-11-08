import test from 'node:test';
import assert from 'node:assert/strict';
import { understand } from '../src/features/medassist-conversation/understanding';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
const cases:[string,string[]][]=[
 ['There is not any cough during this lesson.', ['201-']],
 ["There isn't a sore throat during this lesson.", ['97-']],
 ["I wasn't feverish during the earlier game.", []],
 ["I cannot decide whether nausea is happening.", ['148?']],
 ['There may be chills during this lesson.', ['94?']],
 ['I am doubting whether I have a cough or not.', ['201?']],
 ['I think my throat is sore, but I am unsure.', ['97?']],
 ['chills? uncertain.', ['94?']],
 ['I have a cough and I am certain about it.', ['201+']],
 ['My aunt has chills; I have nausea.', ['148+']],
 ['My colleague has nausea, but I do not have nausea.', ['148-']],
 ['My fictional daughter has a cough. I have chills.', ['94+']],
 ['The fictional person has a cough.', ['201+']],
 ['My nose is blocked and my throat is sore.', ['181+','97+']],
 ['My cough has stopped at noon.', []],
 ['That nausea stopped just now.', []],
 ['The chills have resolved now.', []],
 ["My cough hasn't stopped yet.", ['201+']],
 ['My cough has not resolved yet.', ['201+']],
 ['Maybe my nausea has stopped.', []],
 ['If my cough stops tomorrow, what happens?', []],
 ['My aunt says her cough has stopped.', []],
 ['The phrase “my cough has stopped” was in a book.', []],
 ['I have chills but my cough has stopped.', ['94+']],
 ['I have had a cough since yesterday.', ['201+']],
 ['I have a cough. Actually, I take that back.', ['201!']],
 ['I would not say I am not nauseated.', []],
 ['I used to have chills. Now I have a cough.', ['201+']],
 ['I may develop a cough tomorrow.', []],
 ['I have no cough or chills in this lesson.', ['201-','94-']],
 ["My throat is sore or perhaps dry; I can't tell.", ['97?']],
 ["My guess is chills rather than nausea; I don't know.", []],
];
for(const [text,expected] of cases)test(text,()=>{
 const x=understand(text,scriptedVocabulary);
 assert.equal(x.validation_failed,false);
 assert.deepEqual(x.proposal.observations.map(o=>o.evidence_id.slice(2)+(o.state==='unknown'?'?':o.state==='contradiction'?'!':o.value?'+':'-')).sort(),[...expected].sort());
 for(const a of x.annotations)assert.equal(text.slice(a.start,a.end),a.quote);
});
