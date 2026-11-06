export type ReportContext = 'current' | 'historical_or_resolved' | 'other_person' | 'hypothetical' | 'suspected_condition' | 'non_asserted';
export const uncertaintyCue = /\b(?:not sure|unsure|unknown|maybe|might|may have|perhaps|possible|possibly|could be|don['’]t know|do not know|think i|not certain|wonder (?:if|whether)|hard to tell|can(?:not|['’]t) tell)\b/i;
export const negationCue = /\b(?:no|not|neither|without|deny|denies|absent|free of|don['’]t|haven['’]t|hasn['’]t|didn['’]t|doesn['’]t)\b/i;
export const correctionCue = /\b(?:actually|correction|i meant|instead|scratch that|take that back)\b/i;
const resolvedCue = /\b(?:resolved|recovered|cleared up|no longer|it stopped|it is gone|it has stopped|gone now|(?:is|has) gone|went away|(?:is|are) over|not now)\b/i;
const pastCue = /\b(?:used to|last (?:year|week|night)|as a child|in childhood|in the past)\b/i;
const pastDate = /\b(?:yesterday|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;
const continuing = /\b(?:since|still|throughout|now|(?:have|has) had)\b/i;

export function reportClauses(text:string) {
  const result:{quote:string;start:number;end:number;context:ReportContext;correction:boolean;uncertain:boolean;negative:boolean;negationStart:number|null}[]=[];
  const quotations = [...text.matchAll(/"[^"\r\n]*"|“[^”\r\n]*”|‘[^’\r\n]*’|(?<!\w)'(?:[^'\r\n]|(?<=\w)'(?=\w))*'(?!\w)/g)];
  for (const sentence of text.matchAll(/[^.!?;]+/g)) {
    let subject:'target'|'other'='target', negationStart:number|null=null;
    let hypothetical = false, sharedUncertainty = false, reportedSpeech = false;
    const firstClause = result.length;
    for(const part of sentence[0].matchAll(/\b(?:and|but|plus)\b|,|((?:(?!\b(?:and|but|plus)\b)[^,])+)/gi)) {
      if (!part[1]) continue;
      const quote=part[0].trim(); if(!quote)continue;
      const start=sentence.index!+part.index!+part[0].indexOf(quote), normalized=quote.toLowerCase().replaceAll('’',"'");
      const end = start + quote.length;
      const quoted = quotations.some(match => start < match.index! + match[0].length && end > match.index!);
      if(/\bmy (?:brother|sister|mother|father|friend|son|daughter|child|wife|husband|partner)\b|\b(?:he|she|they)\b/.test(normalized))subject='other';
      if(/^(?:actually\s+)?i\b|\bthe fictional (?:person|patient)\b/.test(normalized))subject='target';
      if(/\bmy (?:head|stomach|back|lower back|belly|throat|nose|eyes|feet)\b/.test(normalized))subject='target';
      const reported = /\b(?:someone|a friend|my \w+|he|she|they) (?:told me|texted me|said|wrote)\b/i.test(quote);
      const boundary=sentence[0].slice(0,part.index).match(/(\b(?:and|but|plus)\b|,)\s*$/i)?.[1]?.toLowerCase();
      const freshSubject = /^(?:(?:right )?now\s+)?(?:i|my (?:head|stomach|back|throat|nose)|the fictional (?:person|patient))\b/i.test(normalized);
      if (boundary === 'but' || (boundary === 'and' && freshSubject && !quoted &&
        result.length > firstClause && quotations.some(match => match.index! + match[0].length <= start &&
          match.index! >= result[firstClause].start))) reportedSpeech = false;
      reportedSpeech ||= reported;
      if (reportedSpeech) subject = 'other';
      const independentAssertion = /\b(?:persists?|continues?|is present|is still|are still|started|began)\b/i.test(normalized);
      const ambiguousList: boolean = boundary === ',' && (negationStart !== null || sharedUncertainty)
        && !freshSubject && !independentAssertion && !negationCue.test(normalized) && !uncertaintyCue.test(normalized)
        && !/^(?:definitely|certainly)\b/i.test(normalized);
      if (boundary !== 'and' || freshSubject || independentAssertion) negationStart = null;
      hypothetical ||= /^(?:what if|if|suppose|imagine|i would)\b/.test(normalized)
        || /\bwould\b.*\bif\b/.test(normalized);
      const future = /\b(?:tomorrow|next (?:day|week|month)|(?:might|may|will) (?:become|develop|get))\b/.test(normalized)
        && !/\b(?:until|since|already|now)\b/.test(normalized);
      const resolved = resolvedCue.test(normalized);
      const historical=resolved || pastCue.test(normalized) && !continuing.test(normalized)
        || pastDate.test(normalized) && !continuing.test(normalized) && !/\b(?:haven't|have not|didn't|did not)\b/.test(normalized)
        || /\b(?:coughed|was coughing)\b/.test(normalized)&&! /\b(?:today|since|for|still|now)\b/.test(normalized)
        || /\bhad\b/.test(normalized)&&!continuing.test(normalized) && !/\b(?:for|today|haven't|have not|hasn't|has not|didn't|did not)\b/.test(normalized);
      const uncertain=uncertaintyCue.test(normalized);
      const inheritedUncertainty: boolean = sharedUncertainty && boundary === 'and' && !uncertain
        && !/^(?:i|my|the fictional person|definitely|certainly)\b/.test(normalized);
      const context:ReportContext=quoted || inheritedUncertainty || ambiguousList || /\b(?:read about|article|website|definition|the word|tell me about|what is|can you explain|not free of|not without|wouldn't say|apart from|except for)\b/.test(normalized)?'non_asserted'
        :hypothetical || future?'hypothetical'
        : /\b(?:cancer|tumou?r|pneumonia|heart attack)\b/.test(normalized)?'suspected_condition'
        : subject==='other'?'other_person':historical?'historical_or_resolved':'current';
      if (context === 'historical_or_resolved' && result.length > firstClause &&
          /^(?:now\s+)?(?:it (?:is|has) (?:gone|stopped|cleared up)|not now)$/i.test(normalized)) {
        const previous = result.at(-1)!;
        if (previous.context === 'current') previous.context = 'historical_or_resolved';
      }
      if (/^(?:that was|that is about) (?:my|another)\b/i.test(normalized)) {
        const previous = result.at(-1);
        const corrected = previous && /^sorry$/i.test(previous.quote) ? result.at(-2) : previous;
        if (corrected?.context === 'current') corrected.context = 'other_person';
      }
      if (negationCue.test(normalized)) negationStart = start;
      if (context !== 'current' || uncertain) negationStart = null;
      const negative = negationStart !== null;
      sharedUncertainty = context === 'current' && uncertain || inheritedUncertainty;
      result.push({quote,start,end,context,negative,uncertain,negationStart,correction:correctionCue.test(sentence[0])});
    }
  }
  return result;
}
export function contextAllowsObservation(text:string, quote:string, pattern?:RegExp) {
  const clauses=reportClauses(text).filter(c=>pattern?pattern.test(c.quote):c.quote.includes(quote)||quote.includes(c.quote));
  return !!clauses.length&&clauses.some(c=>c.context==='current')&&!clauses.some(c=>c.context!=='current' && quote.includes(c.quote));
}
