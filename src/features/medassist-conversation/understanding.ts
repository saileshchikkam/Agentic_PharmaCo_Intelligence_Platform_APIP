/** Deterministic, source-bound fictional NLP. No clinical inference or new features. */
import { anchors, languageConcepts, tokenize } from './concepts';
import { reportClauses, type ReportContext } from './language-context';
import { readProposal, type Proposal, type NaturalVocabulary } from './natural';
import type { Answer, Question } from '../model-a-research/contracts';
export type Annotation={quote:string;start:number;end:number;concept:string|null;evidence_id:string|null;
  context:ReportContext|'unsupported_or_ambiguous'|'explicit_correction';normalized:string|null;method:'deterministic.v1'};
export type Compatibility={status:'not_applicable'|'valid'|'ambiguous'|'unrelated'|'contradictory';message:string|null};
export function reportedDetails(text:string){
  const patterns:Record<string,RegExp>={location:/\b(?:lower back|lumbar spine|head|stomach|abdomen|belly|breast|anus|(?:right|left) ankle)\b/gi,
    duration:/\b(?:for\s+(?:[a-z]+|[0-9]+)\s+(?:days?|weeks?|hours?|months?|years?))\b/gi,
    onset:/\b(?:since yesterday(?: evening)?|since this morning|started this morning|since [a-z]+)\b/gi,
    frequency:/\b(?:at night|persistent|repeated(?:ly)?|constant|always)\b/gi,
    severity_description:/\b(?:mild|moderate|severe|intense)\b/gi,progression:/\b(?:worse|better|resolved|stopped|gone|cleared up)\b/gi};
  return Object.entries(patterns).flatMap(([kind,pattern])=>[...text.matchAll(pattern)].map(m=>({kind,quote:m[0],start:m.index!,end:m.index!+m[0].length,origin:'unstructured_user_report' as const,structured_value_inferred:false as const})));
}
const normal=(text:string)=>tokenize(text).map(t=>t.text).join(' ');
const proposal=():Proposal=>({schema_version:'medassist.natural-extraction.v1',observations:[],unmapped:[],instruction_attempt:false});
const annotate=(text:string,quote:string,context:Annotation['context'],id:string|null=null,concept:string|null=null,start=text.indexOf(quote)):Annotation=>({quote,start,end:start+quote.length,context,evidence_id:id,concept,normalized:id?anchors[id]?.label??null:null,method:'deterministic.v1'});
const explicitRelation=(text:string)=>/\b(?:also|additional|another (?:pain )?(?:site|location)|in addition|radiates?|radiating|travels? to|spreads? to|actually|i meant|instead)\b/i.test(text);
export function questionCompatibility(text:string,question:Question|null,vocabulary:NaturalVocabulary,prior:string[]=[],value?:Answer['value']):Compatibility {
  if(!question)return{status:'not_applicable',message:null};
  const n=normal(text);
  if(/^(?:yes and no|my answer is conflicting|my answer is contradictory)$/.test(n))return{status:'contradictory',message:'Those answers conflict. I will preserve the conflict without choosing an answer.'};
  if(/^(?:not sure|unknown|i don't know|i do not know)$/.test(n))return{status:'valid',message:null};
  if(/\b(?:not only|either|neither)\b/i.test(text))return{status:'ambiguous',message:'Please clarify the current answer directly, or choose Not sure. I will not choose an interpretation of that wording.'};
  const scoped=reportClauses(text).filter(c=>question.data_type!=='B'||anchors[question.evidence_id]?.pattern.test(c.quote));
  if(scoped.length&&scoped.every(c=>c.context!=='current'))return{status:'ambiguous',message:'That describes history, another person or a hypothetical situation. Please give the current fictional person’s answer, or choose Not sure.'};
  if(question.data_type==='B')return /^(?:yes|no)$/.test(n)||anchors[question.evidence_id]?.pattern.test(text)
    ?{status:'valid',message:null}:{status:'unrelated',message:'Please answer the current question, or choose Not sure. Other details can be kept separately.'};
  if(question.data_type==='C') {
    if(question.possible_values.some(v=>normal(String(v))===n))return{status:'valid',message:null};
    return{status:/\b(?:severe|mild|moderate|very|little|lot)\b/.test(n)?'ambiguous':'unrelated',message:'Please choose one of the shown values, or Not sure. I will not invent a score from that description.'};
  }
  if(/^(?:none|none of these|explicitly none of these)$/.test(n))return{status:'valid',message:null};
  const definition=vocabulary.items.find(d=>d.evidence_id===question.evidence_id);
  const values=Array.isArray(value)?value:exactLabelValues(text,question,definition?.value_labels);
  if(!values?.length)return{status:'ambiguous',message:'Please specify a shown location or choice exactly, including side where needed, or choose Not sure. No location has been guessed.'};
  const labels=values.map(v=>definition?.value_labels?.[String(v)]??String(v));
  if(values.length>1&&/\b(?:actually|instead|correction)\b/i.test(text))return{status:'contradictory',message:'Those locations contain an unresolved correction. I will not choose a location.'};
  if(['E_55','E_57'].includes(question.evidence_id)&&prior.some(t=>/\b(?:lower back|lumbar)\b/i.test(t))
    &&labels.some(l=>! /lumbar spine|back|nowhere/i.test(l))&&!explicitRelation(text))
    return{status:'ambiguous',message:question.evidence_id==='E_57'
      ?'You described lower-back pain. Does it radiate to this new site, or are you describing a separate symptom? Please state that explicitly, or choose Not sure.'
      :'You described lower-back pain. Is this an additional pain site or a correction? Please state that explicitly, or choose Not sure.'};
  return{status:'valid',message:null};
}
function exactLabelValues(text:string,q:Question,labels:Record<string,string>={}) {
  const n=normal(text); const found=q.possible_values.filter(v=>{
    const label=labels[String(v)]??String(v);
    const side=label.match(/^(.*)\(([RL])\)$/);
    const forms=[label,...(side?[`${side[2]==='R'?'right':'left'} ${side[1].trim()}`]:[])];
    return forms.some(f=>{const phrase=normal(f);return n===phrase||(' '+n+' ').includes(' '+phrase+' ');});
  });
  return found.length?found:null;
}
export function understand(text:string,vocabulary:NaturalVocabulary,pending:Question|null=null,prior:string[]=[]) {
  const output=proposal(), annotations:Annotation[]=[], compatibility=questionCompatibility(text,pending,vocabulary,prior);
  if(/\b(ignore|disregard|override|system prompt|prescribe|diagnose|api key)\b/i.test(text))return{proposal:{...output,instruction_attempt:true},annotations,compatibility,complete:true};
  const clauses=reportClauses(text), allowed=new Set(vocabulary.items.map(d=>d.evidence_id));
  const evidence=new Map<string,Proposal['observations'][number][]>();
  for(const clause of clauses) {
    const concepts=languageConcepts.filter(c=>allowed.has(c.evidence_id)&&c.pattern.test(clause.quote));
    if(/\b(?:not only|either|neither)\b/i.test(clause.quote)||/\bor\b/i.test(clause.quote)&&concepts.length>1){
      for(const concept of concepts)annotations.push(annotate(text,clause.quote,'unsupported_or_ambiguous',concept.evidence_id,concept.concept_id,clause.start));
      output.unmapped.push({quote:clause.quote,kind:'ambiguous'});continue;
    }
    for(const concept of concepts) {
      annotations.push(annotate(text,clause.quote,clause.context,concept.evidence_id,concept.concept_id,clause.start));
      if(clause.correction)annotations.push(annotate(text,clause.quote,'explicit_correction',concept.evidence_id,concept.concept_id,clause.start));
      if(clause.context!=='current'){output.unmapped.push({quote:clause.quote,kind:'ambiguous'});continue;}
      const normalBreathing=concept.evidence_id==='E_66'&&/\b(?:can breathe normally|breathing normally)\b/i.test(clause.quote);
      if(normalBreathing&&/\b(?:shortness of breath|difficulty breathing|breathless)\b/i.test(text)
        &&! /\bsignificant (?:shortness of breath|difficulty breathing)\b/i.test(text)){
        output.unmapped.push({quote:clause.quote,kind:'ambiguous'});continue;
      }
      const observation={evidence_id:concept.evidence_id,quote:clause.quote,state:clause.uncertain?'unknown' as const:'confirmed' as const,value:clause.uncertain?null:normalBreathing?false:!clause.negative};
      evidence.set(concept.evidence_id,[...(evidence.get(concept.evidence_id)??[]),observation]);
    }
    if(!concepts.length){
      const context=clause.context==='current'?'unsupported_or_ambiguous':clause.context;
      annotations.push(annotate(text,clause.quote,context,null,null,clause.start));
      output.unmapped.push({quote:clause.quote,kind:'ambiguous'});
    }
    // Keep the complete source clause as unstructured context, including anatomy/time,
    // rather than inventing encoded anatomy, dates, frequency or severity scores.
    if(concepts.length&&/\b(?:since|for|started|yesterday|morning)\b/i.test(clause.quote))output.unmapped.push({quote:clause.quote,kind:'duration'});
    else if(concepts.length&&/\bnight\b/i.test(clause.quote)&&!concepts.some(c=>c.evidence_id==='E_219'))output.unmapped.push({quote:clause.quote,kind:'unsupported'});
    else if(concepts.length&&/\b(?:dry|back|stomach|abdomen|belly|head|aching|persistent)\b/i.test(clause.quote))output.unmapped.push({quote:clause.quote,kind:'unsupported'});
  }
  for(const [id,claims] of evidence){
    const states=new Set(claims.map(c=>JSON.stringify([c.state,c.value])));
    output.observations.push(states.size>1?{evidence_id:id,state:'contradiction',value:null,quote:text}:claims[0]);
  }
  if(pending){
    const parent=['E_54','E_55','E_56','E_57','E_58','E_59'].includes(pending.evidence_id)?'E_53':null;
    if(parent)output.observations=output.observations.filter(a=>a.evidence_id!==parent);
    const n=normal(text), d=vocabulary.items.find(d=>d.evidence_id===pending.evidence_id);
    let answer:Answer|null=null;
    if(compatibility.status==='contradictory')answer={evidence_id:pending.evidence_id,state:'contradiction',value:null};
    else if(/^(?:not sure|unknown|i don't know|i do not know)$/.test(n))answer={evidence_id:pending.evidence_id,state:'unknown',value:null};
    else if(pending.data_type==='B'&&/^(yes|no)$/.test(n))answer={evidence_id:pending.evidence_id,state:'confirmed',value:n==='yes'};
    else if(pending.data_type==='C'){
      const value=pending.possible_values.find(v=>normal(String(v))===n);
      if(value!==undefined)answer={evidence_id:pending.evidence_id,state:'confirmed',value};
    }else if(pending.data_type==='M'){
      const values=/^(?:none|none of these|explicitly none of these)$/.test(n)?[]:exactLabelValues(text,pending,d?.value_labels);
      if(values&&compatibility.status==='valid')answer={evidence_id:pending.evidence_id,state:'confirmed',value:values};
    }
    if(answer){
      output.observations=output.observations.filter(a=>a.evidence_id!==pending.evidence_id);output.observations.push({...answer,quote:text});
      output.unmapped=output.unmapped.filter(u=>u.kind!=='ambiguous');
      for(let i=annotations.length-1;i>=0;i--)if(annotations[i].context==='unsupported_or_ambiguous'&&annotations[i].evidence_id===null)annotations.splice(i,1);
      annotations.push(annotate(text,text,'current',pending.evidence_id,'question.'+pending.evidence_id));
    }
    if(compatibility.status==='ambiguous'||compatibility.status==='unrelated')output.observations=output.observations.filter(a=>a.evidence_id!==pending.evidence_id);
  }
  output.unmapped=output.unmapped.filter((u,i,all)=>all.findIndex(x=>x.quote===u.quote&&x.kind===u.kind)===i).slice(0,20);
  const checked=readProposal(output,text,vocabulary,pending);
  if(pending&&checked?.observations.some(a=>a.evidence_id===pending.evidence_id&&a.state==='contradiction')){
    compatibility.status='contradictory';compatibility.message='Those answers conflict. I will not choose between them.';
  }
  const clearAbstention=annotations.some(a=>!['current','unsupported_or_ambiguous'].includes(a.context))||pending!==null
    || /\b(?:not only|either|neither)\b/i.test(text)||/\bor\b/i.test(text)&&annotations.some(a=>a.evidence_id!==null)
    || /\b(?:runny nose|nasal discharge|feel(?:ing)? sick|shortness of breath|difficulty breathing|lump|tumou?r|cancer|ankle feels odd|bright lights)\b/i.test(text);
  return{proposal:checked??proposal(),annotations,compatibility,complete:!!checked&&(!!output.observations.length||clearAbstention),validation_failed:!checked};
}
/** Apply context gates even if an LLM supplies syntactically valid false positives. */
export function constrainContext(raw:unknown,text:string,vocabulary:NaturalVocabulary,pending:Question|null,prior:string[]=[]):Proposal|null {
  const parsed=readProposal(raw,text,vocabulary,pending);if(!parsed)return null;
  const analysis=understand(text,vocabulary,pending,prior), output=structuredClone(parsed);
  if(analysis.validation_failed)return null;
  // A short quote must not strip a negation/uncertainty from the complete source.
  // Deterministic current claims are constraints, not a fallback invented answer.
  for(const item of output.observations){
    const expected=analysis.proposal.observations.find(a=>a.evidence_id===item.evidence_id);
    if(expected&&(expected.state!==item.state||JSON.stringify(expected.value)!==JSON.stringify(item.value)))return null;
    if(item.evidence_id==='E_66'&&item.value===false&&/\b(?:can breathe normally|breathing normally)\b/i.test(text)
      &&/\b(?:shortness of breath|difficulty breathing|breathless)\b/i.test(text)&&!expected)return null;
  }
  output.observations=output.observations.filter(item=>{
    const own=analysis.annotations.filter(a=>a.evidence_id===item.evidence_id&&(a.quote.includes(item.quote)||item.quote.includes(a.quote)));
    const invalid=own.some(a=>a.context!=='current'&&a.context!=='explicit_correction');
    const mismatch=item.evidence_id===pending?.evidence_id&&!['valid','contradictory'].includes(analysis.compatibility.status);
    if(invalid||mismatch){output.unmapped.push({quote:item.quote,kind:'ambiguous'});return false;}return true;
  });
  return readProposal(output,text,vocabulary,pending);
}
