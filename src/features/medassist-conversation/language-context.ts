import { tokenize } from './concepts';
export type ReportContext = 'current' | 'historical_or_resolved' | 'other_person' | 'hypothetical' | 'suspected_condition' | 'non_asserted';
export function reportClauses(text:string) {
  const result:{quote:string;start:number;end:number;context:ReportContext;correction:boolean;uncertain:boolean;negative:boolean}[]=[];
  for (const sentence of text.matchAll(/[^.!?;]+/g)) {
    let subject:'target'|'other'='target', sharedNegative=false;
    const full=sentence[0].toLowerCase().replaceAll('’',"'");
    const resolved=/\b(resolved|recovered|cleared up|no longer|it stopped|it is gone|it has stopped|gone now)\b/.test(full);
    for(const part of sentence[0].matchAll(/(?:(?!\b(?:and|but)\b)[^,])+/gi)) {
      const quote=part[0].trim(); if(!quote)continue;
      const start=sentence.index!+part.index!+part[0].indexOf(quote), normalized=quote.toLowerCase().replaceAll('’',"'");
      const words=tokenize(normalized).map(t=>t.text);
      if(/\bmy (?:brother|sister|mother|father|friend|son|daughter|child|wife|husband|partner)\b|\b(?:he|she|they)\b/.test(normalized))subject='other';
      if(/^(?:actually\s+)?i\b|\bthe fictional (?:person|patient)\b/.test(normalized))subject='target';
      if(/\bmy (?:head|stomach|back|lower back|belly|throat|nose|eyes|feet)\b/.test(normalized))subject='target';
      const boundary=sentence[0].slice(0,part.index).match(/\b(and|but)\b\s*$/i)?.[1]?.toLowerCase();
      if(boundary==='but'||/^i\b/.test(normalized))sharedNegative=false;
      const historical=resolved || /\b(?:used to|last year|last week|as a child|in childhood|in the past)\b/.test(normalized)
        || /\b(?:coughed|was coughing)\b/.test(normalized)&&! /\b(?:today|since|for|still|now)\b/.test(normalized)
        || /\bhad\b/.test(normalized)&&! /\b(?:since|for|today|still|now|haven't|have not|hasn't|has not|didn't|did not)\b/.test(normalized);
      const context:ReportContext=/\b(?:read about|article|website|definition|the word|tell me about|what is|can you explain)\b/.test(normalized)?'non_asserted'
        :/\b(?:what if|if i|suppose|imagine|i would)\b/.test(normalized)?'hypothetical'
        : /\b(?:cancer|tumou?r|pneumonia|heart attack)\b/.test(normalized)?'suspected_condition'
        : subject==='other'?'other_person':historical?'historical_or_resolved':'current';
      const uncertain=/\b(?:not sure|unsure|unknown|maybe|might|perhaps|don't know|do not know|think i)\b/.test(normalized);
      const negative=!uncertain&&(words.some(w=>['no','not','without','deny','denies',"don't","haven't","hasn't","didn't","doesn't"].includes(w))||sharedNegative);
      if(negative)sharedNegative=true;
      result.push({quote,start,end:start+quote.length,context,negative,uncertain,correction:/\b(?:actually|correction|i meant|instead)\b/.test(full)});
    }
  }
  return result;
}
export function contextAllowsObservation(text:string, quote:string, pattern?:RegExp) {
  const clauses=reportClauses(text).filter(c=>pattern?pattern.test(c.quote):c.quote.includes(quote)||quote.includes(c.quote));
  return !!clauses.length&&clauses.some(c=>c.context==='current')&&!clauses.some(c=>c.context!=='current' && quote.includes(c.quote));
}
