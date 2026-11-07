import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { understand } from '../src/features/medassist-conversation/understanding';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { clarifyPain } from '../src/features/medassist-conversation/presentation';
import { evaluateStatement } from '../src/features/medassist-safety/safety';

const raw = readFileSync(new URL('../docs/evaluation/medassist-l7-english-v1.json', import.meta.url),'utf8').replaceAll('\r\n','\n');
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0 && !process.argv[outputIndex + 1]) throw Error('--output requires a new filename');
const destination = outputIndex >= 0 ? resolve(process.argv[outputIndex + 1])
 : new URL('../docs/evaluation/medassist-l7-results.json', import.meta.url);
if (existsSync(destination)) throw Error('Preserve existing L7 results; use --output with a new filename.');
const hash=createHash('sha256').update(raw).digest('hex');
assert.equal(hash,'d107ff88fb601c1ac5581db8817a9fdc489b012387172c7e81e842f6606dc3b8','Frozen L7 changed');
const corpus=JSON.parse(raw);
assert.equal(corpus.cases.length,110);
assert.equal(corpus.journeys.length,20);
const fields=new Set(scriptedVocabulary.items.map(i=>i.evidence_id));
assert.equal(fields.size,9);
type Evidence={id:string;state:string;spans?:string[];quote?:string};
const same=(a:Evidence,b:Evidence)=>a.id===b.id&&a.state===b.state;
const rows=corpus.cases.map((row:any)=>{
 for(const e of row.evidence){assert.ok(fields.has(e.id));for(const span of e.spans)assert.ok(row.input.includes(span));}
 const result=understand(row.input,scriptedVocabulary);
 const observed:Evidence[]=result.proposal.observations.map(item=>({id:item.evidence_id,state:item.state==='confirmed'?item.value===true?'present':'absent':item.state,quote:item.quote}));
 const flags={clarification:!observed.length||result.proposal.unmapped.some(i=>i.kind==='ambiguous')||observed.some(i=>i.state==='contradiction')||
 result.proposal.observations.some(i=>i.evidence_id==='E_53'&&i.state==='confirmed'&&i.value===true&&!!clarifyPain(i.quote)),
 abstain:!observed.length,confirmation:!!observed.length,conflict:observed.some(i=>i.state==='contradiction')};
 const issues:string[]=[];
 for(const e of row.evidence){
 const got=observed.find(i=>i.id===e.id);
 if(!got)issues.push('missing '+e.id+' '+e.state);
 else if(got.state!==e.state)issues.push('wrong state '+e.id+': '+got.state+' expected '+e.state);
 else if(!e.spans.every((span:string)=>got.quote!.includes(span)))issues.push('missing required source span '+e.id);
 }
 for(const e of observed)if(!row.evidence.some((i:Evidence)=>i.id===e.id))issues.push('unexpected '+e.id+' '+e.state);
 let literalGood=0;
 for(const e of observed){if(fields.has(e.id)&&row.input.includes(e.quote!))literalGood++;else issues.push('invalid evidence provenance');}
 let offsetGood=0;
 for(const a of result.annotations){if(row.input.slice(a.start,a.end)===a.quote)offsetGood++;else issues.push('invalid annotation offset');}
 const narrative=result.proposal.unmapped.map(i=>i.quote);
 // Retention allows source clauses to be split by punctuation; preserve their literal words in ordered annotations/unmapped.
 const retained= [...result.annotations.map(a=>a.quote),...narrative].join(' ');
 for(const span of row.retain)if(!retained.includes(span)&&!row.input.split(/[.!?;]/).filter(Boolean).every((part:string)=>retained.includes(part.trim())))issues.push('missing retained wording');
 for(const key of Object.keys(flags) as (keyof typeof flags)[])if(flags[key]!==row[key])issues.push(key+' intent');
 if(result.validation_failed)issues.push('validator rejected');
 const evidenceExact=observed.length===row.evidence.length&&observed.every(i=>row.evidence.some((e:Evidence)=>same(i,e)));
 return {...row,observed,observedFlags:flags,narrative,annotations:result.annotations,validation_failed:result.validation_failed,literalGood,offsetGood,evidenceExact,issues};
});
const expected=rows.flatMap((r:any)=>r.evidence),emitted=rows.flatMap((r:any)=>r.observed);
const pair=(n:number,d:number)=>({numerator:n,denominator:d});
const expectedCases=(predicate:(r:any)=>boolean)=>{const selected=rows.filter(predicate);return pair(selected.filter((r:any)=>r.evidenceExact).length,selected.length);};
const metrics={
 fullCases:pair(rows.filter((r:any)=>!r.issues.length).length,rows.length),
 expectedIdRecall:pair(rows.reduce((n:number,r:any)=>n+r.evidence.filter((e:Evidence)=>r.observed.some((o:Evidence)=>o.id===e.id)).length,0),expected.length),
 expectedIdStateRecall:pair(rows.reduce((n:number,r:any)=>n+r.evidence.filter((e:Evidence)=>r.observed.some((o:Evidence)=>same(o,e))).length,0),expected.length),
 unexpectedIds:pair(rows.reduce((n:number,r:any)=>n+r.observed.filter((o:Evidence)=>!r.evidence.some((e:Evidence)=>e.id===o.id)).length,0),emitted.length),
 wrongStates:pair(rows.reduce((n:number,r:any)=>n+r.observed.filter((o:Evidence)=>r.evidence.some((e:Evidence)=>e.id===o.id&&!same(o,e))).length,0),emitted.length),
 missingObservations:pair(rows.reduce((n:number,r:any)=>n+r.evidence.filter((e:Evidence)=>!r.observed.some((o:Evidence)=>o.id===e.id)).length,0),expected.length),
 incorrectPositive:pair(0,0),incorrectNegative:pair(0,0),incorrectUnknown:pair(0,0),
 negationEvidenceCases:expectedCases((r:any)=>r.evidence.some((e:Evidence)=>e.state==='absent')),
 uncertaintyEvidenceCases:expectedCases((r:any)=>r.evidence.some((e:Evidence)=>e.state==='unknown')),
 temporalEvidenceCases:expectedCases((r:any)=>r.category==='temporal and hypothetical'),
 speakerEvidenceCases:expectedCases((r:any)=>r.category==='speakers and quotation'),
 appropriateAbstention:pair(rows.filter((r:any)=>r.abstain&&r.observedFlags.abstain).length,rows.filter((r:any)=>r.abstain).length),
 clarificationIntent:pair(rows.filter((r:any)=>r.clarification===r.observedFlags.clarification).length,rows.length),
 confirmationIntent:pair(rows.filter((r:any)=>r.confirmation===r.observedFlags.confirmation).length,rows.length),
 evidenceProvenance:pair(rows.reduce((n:number,r:any)=>n+r.literalGood,0),emitted.length),
 annotationOffsets:pair(rows.reduce((n:number,r:any)=>n+r.offsetGood,0),rows.reduce((n:number,r:any)=>n+r.annotations.length,0))
};
for(const [key,state] of [['incorrectPositive','present'],['incorrectNegative','absent'],['incorrectUnknown','unknown']] as const){
 metrics[key]=pair(rows.reduce((n:number,r:any)=>n+r.observed.filter((o:Evidence)=>o.state===state&&!r.evidence.some((e:Evidence)=>same(o,e))).length,0),emitted.filter((o:Evidence)=>o.state===state).length);
}
const categories=[...new Set(rows.map((r:any)=>r.category))].map(category=>({category,...pair(rows.filter((r:any)=>r.category===category&&!r.issues.length).length,rows.filter((r:any)=>r.category===category).length)}));
const knownLimits=corpus.knownLimits.map((row:any)=>({...row,observed:row.id==='K4'?null:understand(row.input,scriptedVocabulary),note:row.id==='K4'?'Multi-turn UI probe; separate from L7 score.':'Known, excluded from fresh score.'}));
const warnings=corpus.safety.map((r:any)=>({...r,observed:evaluateStatement(r.input).suppress_ordinary_flow?'interrupt':'ordinary'}));
const output={version:corpus.version,hash,baseline:corpus.baseline,measuredAt:new Date().toISOString(),metrics,categories,rows,knownLimits,warnings,execution:{singleTurnScored:110,skipped:0,blocked:0,implementationModified:false}};
writeFileSync(destination,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({metrics,categories,failures:rows.filter((r:any)=>r.issues.length).map((r:any)=>({id:r.id,input:r.input,observed:r.observed,issues:r.issues})),warnings},null,2));
// Exit 0 means measurement completed; failing cases remain failures in results.
