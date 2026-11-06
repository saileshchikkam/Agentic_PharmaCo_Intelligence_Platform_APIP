export type ReportContext = 'current' | 'historical_or_resolved' | 'other_person' | 'hypothetical' | 'suspected_condition' | 'non_asserted';
export const uncertaintyCue = /\b(?:not sure|unsure|unknown|maybe|might|perhaps|possibly|could be|don['’]t know|do not know|think i|not certain|wonder (?:if|whether))\b/i;
export const negationCue = /\b(?:no|not|without|deny|denies|absent|free of|don['’]t|haven['’]t|hasn['’]t|didn['’]t|doesn['’]t)\b/i;
export const correctionCue = /\b(?:actually|correction|i meant|instead|scratch that|take that back)\b/i;
const resolvedCue = /\b(?:resolved|recovered|cleared up|no longer|it stopped|it is gone|it has stopped|gone now|(?:is|has) gone|not now)\b/i;

export function reportClauses(text:string) {
  const result:{quote:string;start:number;end:number;context:ReportContext;correction:boolean;uncertain:boolean;negative:boolean}[]=[];
  const quotations = [...text.matchAll(/"[^"\r\n]*"|“[^”\r\n]*”|‘[^’\r\n]*’|(?<!\w)'(?:[^'\r\n]|(?<=\w)'(?=\w))*'(?!\w)/g)];
  for (const sentence of text.matchAll(/[^.!?;]+/g)) {
    let subject:'target'|'other'='target', sharedNegative=false;
    let hypothetical = false, sharedUncertainty = false, reportedSpeech = false;
    const firstClause = result.length;
    for(const part of sentence[0].matchAll(/\b(?:and|but)\b|,|((?:(?!\b(?:and|but)\b)[^,])+)/gi)) {
      if (!part[1]) continue;
      const quote=part[0].trim(); if(!quote)continue;
      const start=sentence.index!+part.index!+part[0].indexOf(quote), normalized=quote.toLowerCase().replaceAll('’',"'");
      const end = start + quote.length;
      const quoted = quotations.some(match => start < match.index! + match[0].length && end > match.index!);
      if(/\bmy (?:brother|sister|mother|father|friend|son|daughter|child|wife|husband|partner)\b|\b(?:he|she|they)\b/.test(normalized))subject='other';
      if(/^(?:actually\s+)?i\b|\bthe fictional (?:person|patient)\b/.test(normalized))subject='target';
      if(/\bmy (?:head|stomach|back|lower back|belly|throat|nose|eyes|feet)\b/.test(normalized))subject='target';
      const reported = /\b(?:someone|a friend|my \w+|he|she|they) (?:told me|said|wrote)\b/i.test(quote);
      const boundary=sentence[0].slice(0,part.index).match(/\b(and|but)\b\s*$/i)?.[1]?.toLowerCase();
      if (boundary === 'but') reportedSpeech = false;
      reportedSpeech ||= reported;
      if (reportedSpeech) subject = 'other';
      if(boundary==='but'||/^i\b/.test(normalized))sharedNegative=false;
      hypothetical ||= /^(?:what if|if|suppose|imagine|i would)\b/.test(normalized);
      const resolved = resolvedCue.test(normalized);
      const historical=resolved || /\b(?:used to|last year|last week|as a child|in childhood|in the past)\b/.test(normalized)
        || /\byesterday\b/.test(normalized) && /\b(?:was|were|felt|experienced|had)\b/.test(normalized)
          && !/\b(?:since|still|now|haven't|have not|didn't|did not)\b/.test(normalized)
        || /\b(?:coughed|was coughing)\b/.test(normalized)&&! /\b(?:today|since|for|still|now)\b/.test(normalized)
        || /\bhad\b/.test(normalized)&&! /\b(?:since|for|today|still|now|haven't|have not|hasn't|has not|didn't|did not)\b/.test(normalized);
      const uncertain=uncertaintyCue.test(normalized);
      const inheritedUncertainty: boolean = sharedUncertainty && boundary === 'and' && !uncertain
        && !/^(?:i|my|the fictional person|definitely|certainly)\b/.test(normalized);
      const context:ReportContext=quoted || inheritedUncertainty || /\b(?:read about|article|website|definition|the word|tell me about|what is|can you explain|not free of|not without)\b/.test(normalized)?'non_asserted'
        :hypothetical?'hypothetical'
        : /\b(?:cancer|tumou?r|pneumonia|heart attack)\b/.test(normalized)?'suspected_condition'
        : subject==='other'?'other_person':historical?'historical_or_resolved':'current';
      if (context === 'historical_or_resolved' && result.length > firstClause &&
          /^(?:now\s+)?(?:it (?:is|has) (?:gone|stopped|cleared up)|not now)$/i.test(normalized)) {
        const previous = result.at(-1)!;
        if (previous.context === 'current') previous.context = 'historical_or_resolved';
      }
      const negative: boolean = !uncertain&&(negationCue.test(normalized)||sharedNegative);
      sharedNegative = context === 'current' && negative;
      sharedUncertainty = context === 'current' && uncertain || inheritedUncertainty;
      result.push({quote,start,end,context,negative,uncertain,correction:correctionCue.test(sentence[0])});
    }
  }
  return result;
}
export function contextAllowsObservation(text:string, quote:string, pattern?:RegExp) {
  const clauses=reportClauses(text).filter(c=>pattern?pattern.test(c.quote):c.quote.includes(quote)||quote.includes(c.quote));
  return !!clauses.length&&clauses.some(c=>c.context==='current')&&!clauses.some(c=>c.context!=='current' && quote.includes(c.quote));
}
