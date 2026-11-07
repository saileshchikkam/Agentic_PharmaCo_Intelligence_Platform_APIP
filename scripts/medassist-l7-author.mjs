import { writeFileSync, readFileSync, existsSync } from 'node:fs';
if (existsSync('docs/evaluation/medassist-l7-english-v1.json')) throw Error('L7 is already frozen; authoring cannot overwrite it.');
import { createHash } from 'node:crypto';
// Authoring only: no application imports or execution.
const groups = {
'proper English': [
["A cough has bothered the fictional person throughout this shift.", "201+", "cough"],
["The fictional person reports nausea during the train ride.", "148+", "nausea"],
["There is a sore throat after the rehearsal.", "97+", "sore throat"],
["The fictional person currently experiences diarrhea.", "51+", "diarrhea"],
["A clear runny nose started during the lecture.", "181+", "clear runny nose"],
["The fictional person feels slightly dizzy while waiting.", "76+", "slightly dizzy"],
["The fictional person reports no chills this afternoon.", "94-", "no chills"],
["There is no fever during this episode.", "91-", "no fever"],
["The fictional person is unsure whether nausea is present.", "148?", "nausea"],
["An aching sensation surrounds the fictional person's knee.", "", "", true]],
'everyday English': [
["I've got a nagging cough on the bus.", "201+", "cough"],
["My tummy hurts while I'm sitting here.", "53+", "tummy hurts"],
["I feel ready to puke, though nothing has come up.", "148+", "ready to puke"],
["My nose won't stop dripping clear water.", "181+", "nose won't stop dripping clear water"],
["My throat's sore after that meeting.", "97+", "throat's sore"],
["I feel a little light-headed right this minute.", "76+", "light-headed"],
["No runs today, just a cough.", "51-,201+", ["No runs", "cough"]],
["I feel sick, but I can't tell what kind of sick.", "", "", true],
["My head feels heavy, not painful.", "", "", true],
["My stomach is turning; I mean I feel nauseated.", "148+", "nauseated", true]],
'Indian conversational English': [
["Cough is coming again and again today only.", "201+", "Cough"],
["Loose motions happening since tea time.", "51+", "Loose motions"],
["For me nose getting blocked now, yaar.", "181+", "nose getting blocked"],
["Head paining continuously after class.", "53+", "Head paining"],
["Vomiting sensation coming, no actual vomit.", "148+", "Vomiting sensation", true],
["Fever not there; chills are there now.", "91-,94+", ["Fever not there","chills"]],
["Throat little sore only, no cough also.", "97+,201-", ["Throat little sore","no cough"]],
["I am doubting whether this is fever or not.", "91?", "fever"],
["Body feeling weak weak since the walk.", "", "", true],
["Stomach gas problem only, cannot explain more.", "", "", true]],
'fragments and abbreviations': [
["cough / chills / sore throat, all now", "201+,94+,97+", ["cough","chills","sore throat"]],
["blocked nose + nausea now", "181+,148+", ["blocked nose","nausea"]],
["fever? unsure.", "91?", "fever"],
["no cough fever absent", "201-,91-", ["no cough","fever absent"]],
["cgh for four hours, no fever", "201+,91-", ["cgh for four hours","no fever"]],
["HA since tea; sore throat too", "53+,97+", ["HA","sore throat"]],
["N/V since noon", "", "", true],
["pain comes goes, where hard to say", "53+", "pain", true],
["nose blocked chills present", "181+,94+", ["nose blocked","chills"]],
["thrt scratchy. little detail.", "", "", true]],
'new spelling variations': [
["My coff has lasted all afternoon.", "201+", "coff"],
["I have a feever at the moment.", "91+", "feever"],
["A soar throat started just now.", "97+", "soar throat"],
["I feel nausia during this ride.", "148+", "nausia"],
["Diarrhoe today, definitely happening.", "51+", "Diarrhoe"],
["Nose is stufffed, no cough.", "181+,201-", ["Nose is stufffed","no cough"]],
["I do not have a couugh today.", "201-", "do not have a couugh"],
["Maybe this is a fevar.", "91?", "fevar"],
["Chils have started while I wait.", "94+", "Chils"],
["I feel liteheaded at this instant.", "76+", "liteheaded"]],
'multiple complaints and correction': [
["I have nausea and chills during the film.", "148+,94+", ["nausea","chills"]],
["My nose is stuffy, but there is no sore throat.", "181+,97-", ["nose is stuffy","no sore throat"]],
["I have a cough plus an itchy wrist.", "201+", "cough", true],
["I have diarrhea and perhaps a fever.", "51+,91?", ["diarrhea","perhaps a fever"]],
["I have a headache but no cough or nausea.", "53+,201-,148-", ["headache","no cough","nausea"]],
["There is a cough. Wait, I take that back.", "201!", "cough. Wait, I take that back", true],
["I have chills; correction, I do not have chills.", "94!", ["chills","do not have chills"], true],
["Only a sore throat; my aunt has nausea.", "97+", "sore throat", true],
["No diarrhea. No chills. My nose is blocked.", "51-,94-,181+", ["No diarrhea","No chills","nose is blocked"]],
["My stomach hurts and I am slightly dizzy.", "53+,76+", ["stomach hurts","slightly dizzy"]]],
'negation and exceptions': [
["I haven't got a cough this time.", "201-", "haven't got a cough"],
["There isn't any fever now.", "91-", "isn't any fever"],
["Neither nausea nor diarrhea is present.", "148-,51-", ["Neither nausea","diarrhea"]],
["I deny having chills or a cough.", "94-,201-", ["deny having chills","cough"]],
["Cough is absent but nausea persists.", "201-,148+", ["Cough is absent","nausea persists"]],
["I am not without a sore throat.", "", "", true],
["I wouldn't say I don't have a fever.", "", "", true],
["Apart from my painful head, nothing hurts.", "53+", "painful head"],
["There is pain nowhere except in my stomach.", "53+", "pain", true],
["No fever and no chills, but the nausea continues.", "91-,94-,148+", ["No fever","no chills","nausea continues"]]],
'uncertainty and alternatives': [
["I cannot decide whether I have a cough.", "201?", "cough"],
["I'm not certain about these chills.", "94?", "chills"],
["There may be nausea, I'm honestly unsure.", "148?", "nausea"],
["I suspect I might be feverish right now.", "91?", "feverish"],
["Perhaps diarrhea; definitely no cough.", "51?,201-", ["Perhaps diarrhea","no cough"]],
["I think my nose is blocked, but I'm not sure.", "181?", "nose is blocked"],
["Sore throat or just a dry mouth; I can't tell.", "97?", "Sore throat", true],
["Maybe cough and maybe nausea while waiting.", "201?,148?", ["Maybe cough","maybe nausea"]],
["Either chills or fever, I cannot distinguish.", "", "", true],
["My guess is nausea rather than pain; I don't really know.", "", "", true]],
'temporal and hypothetical': [
["I had a fever in childhood; now I have nausea.", "148+", "now I have nausea", true],
["My cough stopped at dawn. I currently have chills.", "94+", "currently have chills", true],
["I have had diarrhea continuously since the weekend.", "51+", "diarrhea"],
["My nose was blocked an hour ago, but it is clear now.", "", "", true],
["Tomorrow I might develop a sore throat.", "", "", true],
["Suppose nausea started, would that be relevant?", "", "", true],
["I had chills on Tuesday. They ended then.", "", "", true],
["A cough began earlier and remains present right now.", "201+", "cough"],
["I used to feel nauseated, but today my throat is sore.", "97+", "today my throat is sore", true],
["I have no fever now, although I was feverish last month.", "91-", "no fever now", true]],
'speakers and quotation': [
["My sister is coughing; I feel nauseated now.", "148+", "I feel nauseated now", true],
["My colleague has chills, but I have no chills.", "94-", "I have no chills", true],
["He says I look feverish, but I cannot tell whether I have a fever.", "91?", "cannot tell whether I have a fever", true],
["The leaflet says 'nausea'; I only have a cough.", "201+", "I only have a cough", true],
["I copied the words \"sore throat\" into my notebook.", "", "", true],
["My partner had diarrhea; my own nose is blocked now.", "181+", "my own nose is blocked now", true],
["We both have a cough, including me.", "201+", "We both have a cough"],
["My fictional son feels slightly dizzy. I feel fine.", "", "", true],
["A stranger wrote, 'I have fever and chills'.", "", "", true],
["I have a sore throat; my friend does not.", "97+", "I have a sore throat", true]],
'unsupported and vague': [
["My elbow clicks every time I bend it.", "", "", true],
["My eyes burn after reading.", "", "", true],
["The fictional person's skin is itchy all over.", "", "", true],
["I cannot taste the fictional drink.", "", "", true],
["The fictional person's ears are ringing.", "", "", true],
["I feel off-colour and washed out.", "", "", true],
["Everything in my body feels strange today.", "", "", true],
["I threw up once, without feeling nauseated.", "148-", "without feeling nauseated", true],
["My nose has green mucus, no other detail.", "", "", true],
["I have a pounding heartbeat and no cough.", "201-", "no cough", true]]
};
const cases=[];
for(const [category,rows] of Object.entries(groups))for(const [input,codes,spans,clarify=false] of rows){
 const tokens=codes?codes.split(','):[];
 const evidence=tokens.map((code,i)=>({id:'E_'+code.slice(0,-1),state:{'+':'present','-':'absent','?':'unknown','!':'contradiction'}[code.at(-1)],spans:Array.isArray(spans)?[spans[Math.min(i,spans.length-1)]]:[spans]}));
 cases.push({id:'L7-'+String(cases.length+1).padStart(3,'0'),category,input,intendedMeaning: evidence.length?evidence.map(e=>e.id+' '+e.state).join('; '):'No safe supported current field; retain the wording and clarify.',
 evidence,speaker:category==='speakers and quotation'?'Only the fictional target; quoted/other speakers excluded':'Fictional target unless explicitly attributed',
 temporal:category==='temporal and hypothetical'?'Use explicit current assertion only; retain historical/resolved/future/hypothetical wording':'Current unless expressly historical or hypothetical',
 clarification:clarify||!evidence.length,abstain:!evidence.length,confirmation:!!evidence.length,conflict:evidence.some(e=>e.state==='contradiction'),
 retain:!evidence.length?[input.replace(/[.!?]$/,'')]:[],
 transition:'Propose only; no acceptance until an explicit user confirmation'});
}
const journeys=[
['clarification addition',['My wrist is clicking.','A cough is bothering me during this shift.'],[['E_201',true]],'clarify_then_confirm'],
['compatible pending addition',['There is nausea during this ride.','Chills have started now as well.'],[['E_148',true],['E_94',true]],'merge_then_confirm'],
['unsupported preserves pending',['A cough started during rehearsal.','The fictional elbow clicks too.'],[['E_201',true]],'merge_then_confirm'],
['pending opposite review newer',['I have chills during this shift.','No chills during this shift.'],[['E_94',false]],'review_newer_negative_only'],
['pending opposite review earlier',['I have nausea during this ride.','No nausea during this ride.'],[['E_148',true]],'review_earlier_then_confirm'],
['rejected draft replacement',['My nose is stuffy during class.','My throat feels sore during class.'],[['E_97',true]],'reject_then_confirm'],
['UNKNOWN before positive',['Perhaps a cough during this shift.','A cough is definitely present now.'],[],'accepted_unknown_conflict_no_interview'],
['negative confirmation',['I have a sore throat but no chills during class.'],[['E_97',true],['E_94',false]],'confirm_context_stop'],
['follow-up UNKNOWN',['I feel nauseated during this ride.'],[['E_148',true],['E_201',null]],'confirm_context_cough_unknown_stop'],
['accepted contradiction',['I have diarrhea during this shift.','Actually I do not have diarrhea now.'],[['E_51',true]],'accepted_conflict_export_blocked'],
['third party follow-up',['I have a sore throat during rehearsal.','My brother has chills during rehearsal.'],[['E_97',true],['E_201',false]],'off_question_then_no_stop'],
['history then current',['I used to have nausea in childhood.','Now my nose is blocked during this shift.'],[['E_181',true]],'clarify_then_confirm'],
['pending temporal retraction',['I have a cough during this shift.','That cough has stopped now.'],[],'pending_resolution_must_block_stale_confirmation'],
['multiple initial symptoms',['A cough and chills started during class.'],[['E_201',true],['E_94',true]],'confirm_context_stop'],
['off-question addition',['My nose is blocked during rehearsal.','I feel nauseated during rehearsal as well.'],[['E_181',true],['E_148',true],['E_201',false]],'queue_then_no_stop'],
['pending uncertain collision',['I have a sore throat during class.','Maybe I have a sore throat during class.'],[['E_97',true]],'review_earlier_then_confirm'],
['early stop missing fields',['I have chills during rehearsal.'],[['E_94',true]],'confirm_context_stop'],
['duplicate pending wording',['I feel nauseated during class.','I have nausea during class.'],[['E_148',true]],'merge_then_confirm'],
['uncertain context refuses progression',['My throat is sore during rehearsal.'],[],'unknown_age_no_interview'],
['restart isolates accepted state',['I have diarrhea during rehearsal.'],[],'confirm_context_restart_empty']
].map(([name,texts,expected,flow],i)=>({id:'L7-M'+String(i+1).padStart(2,'0'),name,texts,expected,flow,age:29,sex:'F',
 expectations:'Keep original source records; unconfirmed evidence must never be exported as accepted. Confirm explicitly. Preserve UNKNOWN separately from No. Conflicts or explicit resolution must not permit stale current evidence. Final summary/export must equal expected evidence; unsupported wording stays narrative.'}));
const corpus={version:'medassist-l7-english-v1',baseline:'60c53c3ae7590205f7e9d4aab948f1d0a8a67efe',
 provenance:'AI-authored after contract and prior-report review, separately from prior corpora. Same assistant authors and executes. No external annotator, representative sampling or blinding. No L7 parser execution before freeze.',
 scoring:{fullCase:'Exact ID/state set, required source substrings, intended clarify/abstain/confirm/conflict flags, valid proposal and literal provenance. Each case stays in denominator.',
 clarification:'Initial-turn projected interaction: no observations, ambiguous unmapped clause, contradiction, or existing pain-location prompt. Actual helpful wording sampled separately in browser.',
 context:'Temporal/speaker correctness reported as evidence-set correctness on the corresponding case subsets, not independent annotation accuracy.',
 provenance:'Every emitted quote must occur literally in input; annotation offsets must reproduce quote. Literal correctness does not establish semantic correctness.',
 span:'Expected spans are minimum semantic substrings; a wider original-text quote may match. Multi-span arrays require every listed substring.',
 abstain:'Zero structured proposals, including UNKNOWN. Unsupported correctly retained/clarified is not successful supported extraction.'},
 cases,journeys,
 knownLimits:[{id:'K1',input:'No pain apart from an aching head.',expected:'E_53 present'},{id:'K2',input:'I had chills and nausea at supper and still have them now.',expected:'Clarify multiple referents without current guesses'},{id:'K3',input:'Loose motion from yesterday.',expected:'Clarify whether ongoing; do not assume current'},{id:'K4',input:'Perhaps I have a fever. / I have measured a fever now.',expected:'Explicit reconciliation of previously confirmed UNKNOWN; conservative conflict acceptable but remains usability gap'}],
 safety:[{id:'W1',input:'This is a medical emergency.',expected:'interrupt'},{id:'W2',input:"Air won't go into my lungs at all.",expected:'interrupt'},{id:'W3',input:"The narrator wrote, “I can't breathe.”",expected:'ordinary'},{id:'W4',input:"I didn't ask you to call an ambulance.",expected:'ordinary'}]};
if(cases.length!==110||journeys.length!==20)throw Error('Inventory');
for(const c of cases)for(const e of c.evidence)for(const span of e.spans)if(!c.input.includes(span))throw Error(c.id+' bad span '+span);
const file='docs/evaluation/medassist-l7-english-v1.json';
writeFileSync(file,JSON.stringify(corpus,null,2)+'\n');
const hash=createHash('sha256').update(readFileSync(file)).digest('hex');
writeFileSync('docs/evaluation/medassist-l7-freeze.json',JSON.stringify({version:corpus.version,baseline:corpus.baseline,canonicalization:'UTF-8 LF, no BOM',sha256:hash,singleTurns:cases.length,multiTurns:journeys.length,frozenBeforeMeasurement:true,frozenAt:new Date().toISOString(),authoring:corpus.provenance},null,2)+'\n');
console.log(JSON.stringify({cases:cases.length,journeys:journeys.length,sha256:hash}));
