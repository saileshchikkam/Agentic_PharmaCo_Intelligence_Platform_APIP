import { languageConcepts } from './concepts';
import { hasPainException } from './pain-scope';

export type ReportContext = 'current' | 'historical_or_resolved' | 'other_person' | 'hypothetical' | 'suspected_condition' | 'non_asserted';
// People routinely omit apostrophes in phone typing ("dont", "havent").
// Treat that narrow orthographic normalization as the same polarity marker while
// preserving the original source text, offsets and evidence confirmation step.
export const uncertaintyCue = /\b(?:not sure|unsure|uncertain|unknown|maybe|might|may (?:have|be)|perhaps|possible|possibly|could be|don['’]?t know|do not know|don not know|dont know|do nt know|dunno|think i|i think|not certain|wonder(?:ing)? (?:if|whether)|doubt(?:ing)? (?:if|whether)|hard to tell|can(?:not|['’]?t) (?:tell|decide)|my guess)\b/i;
export const negationCue = /\b(?:no|not|neither|without|deny|denies|absent|free of|don['’]?t|haven['’]?t|hasn['’]?t|didn['’]?t|doesn['’]?t|isn['’]?t|aren['’]?t|wasn['’]?t|weren['’]?t|dont|havent|hasnt|didnt|doesnt|isnt|arent|wasnt|werent)\b/i;
export const correctionCue = /\b(?:actually|correction|i meant|instead|scratch that|take that back|wait\s+no|wait)\b/i;
export const negatedResolution = (text:string) => /\b(?:hasn't|has not|haven't|have not|isn't|is not|aren't|are not)\s+(?:yet\s+)?(?:stopped|resolved|gone|cleared up|over)\b/i.test(text.replaceAll('’',"'"));
const resolvedCue = /\b(?:resolved|recovered|cleared up|no longer|stopped|gone now|(?:is|has) gone|went away|(?:is|are) over|not now)\b/i;
export const reportsResolution = (text:string) => resolvedCue.test(text) && !negatedResolution(text);
const pastCue = /\b(?:used to|last (?:year|week|night)|as a child|in childhood|in the past)\b/i;
const pastDate = /\b(?:yesterday|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;
const continuing = /\b(?:since|still|throughout|now|(?:have|has) had)\b/i;

function initialClauses(sentence: string) {
  const splitter = /\b(?:and|but|plus)\b|,|;|:|\b—\b|--|((?:(?!\b(?:and|but|plus)\b)[^,;:—])+)/gi;
  const rawParts = [...sentence.matchAll(splitter)]
    .filter(part => part[1])
    .map(part => ({ text: part[0], index: part.index! }));

  const subRegex = /\b(?=(?:without|except|excluding|instead of|rather than|take that back|scratch that|actually\s+scratch\s+that|actually\s+i\s+meant|wait\s+actually|wait\s+no|now\s+(?:pain|fever|cough|chills|sore|rash)|only\s+(?:cough|fever|chills|nausea|pain|sore|rash|diarrhea|headache|stomach)|not\s+(?:cough|fever|chills|nausea|pain|sore|rash|diarrhea)|no\s+(?:cough|fever|chills|nausea|pain|sore|rash|diarrhea)|i\s+(?:only\s+)?have\s+(?:cough|fever|chills|nausea|pain|sore|rash))\b)|(?<=\b(?:yes|no)\b)\s+(?=(?:cough|fever|chills|nausea|pain|sore|rash|now)\b)/i;

  const parts = rawParts.flatMap(part => {
    const pieces: { text: string; index: number }[] = [];
    let currentText = part.text, currentIndex = part.index;
    while (currentText) {
      const searchRegion = currentText.length > 1 ? currentText.slice(1) : '';
      const match = subRegex.exec(searchRegion);
      if (!match) {
        pieces.push({ text: currentText, index: currentIndex });
        break;
      }
      const matchIndex = 1 + match.index;
      const before = currentText.slice(0, matchIndex);
      if (before.trim() && languageConcepts.some(c => c.pattern.test(before))) {
        pieces.push({ text: before, index: currentIndex });
        currentIndex += matchIndex;
        currentText = currentText.slice(matchIndex);
      } else {
        pieces.push({ text: currentText, index: currentIndex });
        break;
      }
    }
    return pieces;
  });

  return parts.flatMap(part => {
    const denial = /\bno\s+(?:cough|fever|chills|nausea|pain|sore throat)\b/i.exec(part.text);
    const prefix = denial ? part.text.slice(0, denial.index) : '';
    if (!denial || !prefix.trim() || negationCue.test(prefix) || uncertaintyCue.test(prefix) ||
        !languageConcepts.some(concept => concept.pattern.test(prefix))) return [part];
    return [{ text: prefix, index: part.index },
      { text: part.text.slice(denial.index), index: part.index + denial.index }];
  });
}

export function reportClauses(text:string) {
  const result:{quote:string;start:number;end:number;context:ReportContext;correction:boolean;uncertain:boolean;negative:boolean;negationStart:number|null}[]=[];
  const quotations = [...text.matchAll(/"[^"\r\n]*"|“[^”\r\n]*”|‘[^’\r\n]*’|(?<!\w)'(?:[^'\r\n]|(?<=\w)'(?=\w))*'(?!\w)/g)];
  for (const sentence of text.matchAll(/[^.!?;]+/g)) {
    let subject:'target'|'other'='target', negationStart:number|null=null;
    let hypothetical = false, sharedUncertainty = false, reportedSpeech = false;
    const firstClause = result.length;
    for(const part of initialClauses(sentence[0])) {
      const quote=part.text.trim(); if(!quote)continue;
      const start=sentence.index!+part.index+part.text.indexOf(quote), normalized=quote.toLowerCase().replaceAll('’',"'");
      const end = start + quote.length;
      const quoted = quotations.some(match => start < match.index! + match[0].length && end > match.index!);
      const previous = result.at(-1);
      if (!quoted && previous?.context === 'historical_or_resolved' && !previous.negative && !previous.uncertain &&
          !resolvedCue.test(previous.quote) && !negationCue.test(previous.quote) && !uncertaintyCue.test(previous.quote) &&
          /^\s*and\s*$/i.test(text.slice(previous.end, start)) &&
          /^(?:i )?still have (?:it|them) now$/i.test(normalized) &&
          languageConcepts.filter(concept => concept.pattern.test(text.slice(sentence.index!, previous.end))).length === 1) {
        previous.context = 'current';
        previous.end = end;
        previous.quote = text.slice(previous.start, end);
        continue;
      }
      if(/\b(?:(?:my|a|an|the)\s+)?(?:(?:fictional|older|younger|elder|little|best|work)\s+){0,2}(?:brother|sister|mother|father|friend|son|daughter|child|wife|husband|partner|aunt|uncle|colleague|coworker|neighbour|neighbor)\b|\b(?:he|she|they)\b/.test(normalized))subject='other';
      if(/^(?:actually\s+)?(?:(?:right )?now\s+|only\s+)?i\b|\bthe fictional (?:person|patient)\b/.test(normalized))subject='target';
      if(/\bmy (?:head|hed|tummy|stomach|back|lower back|belly|throat|nose|eyes|feet)\b/.test(normalized))subject='target';
      const reported = /\b(?:someone|a friend|friend|my \w+|he|she|they) (?:told me|texted me|said|wrote)\b/i.test(quote);
      const boundary=sentence[0].slice(0,part.index).match(/(\b(?:and|but|plus)\b|,)\s*$/i)?.[1]?.toLowerCase();
      const freshSubject = /^(?:(?:right )?now\s+|only\s+)?(?:i|my (?:head|stomach|back|throat|nose)|the fictional (?:person|patient))\b/i.test(normalized);
      if (boundary === 'but' || (boundary === 'and' && freshSubject && !quoted &&
        result.length > firstClause && quotations.some(match => match.index! + match[0].length <= start &&
          match.index! >= result[firstClause].start))) reportedSpeech = false;
      reportedSpeech ||= reported;
      if (reportedSpeech) subject = 'other';
      const independentAssertion = /\b(?:persists?|continues?|is present|is still|are still|started|began)\b/i.test(normalized)
        || /^just (?:a |the )?/i.test(normalized) && languageConcepts.some(c=>c.pattern.test(normalized));
      const ambiguousList: boolean = boundary === ',' && (negationStart !== null || sharedUncertainty)
        && !freshSubject && !independentAssertion && !negationCue.test(normalized) && !uncertaintyCue.test(normalized)
        && !/^(?:definitely|certainly)\b/i.test(normalized);
      if (boundary !== 'and' || freshSubject || independentAssertion || /^(?:only|without|except|now|not)\b/i.test(normalized)) negationStart = null;
      hypothetical ||= /^(?:what if|if|suppose|imagine|i would)\b/.test(normalized)
        || /\bwould\b.*\bif\b/.test(normalized);
      const future = /\b(?:tomorrow|next (?:day|week|month)|(?:might|may|will) (?:become|develop|get))\b/.test(normalized)
        && !/\b(?:until|since|already|now)\b/.test(normalized);
      const resolved = reportsResolution(normalized);
      const inheritedHistory = boundary === 'and' && previous?.context === 'historical_or_resolved'
        && !freshSubject && !continuing.test(normalized);
      const historical=resolved || inheritedHistory || pastCue.test(normalized) && !continuing.test(normalized)
        || pastDate.test(normalized) && !continuing.test(normalized) && !/\b(?:haven't|have not|didn't|did not)\b/.test(normalized)
        || /\b(?:coughed|was coughing)\b/.test(normalized)&&! /\b(?:today|since|for|still|now)\b/.test(normalized)
        || /\b(?:was|were|wasn't|weren't)\b/.test(normalized)&&!continuing.test(normalized)
        || /\bhad\b/.test(normalized)&&!continuing.test(normalized) && !/\b(?:for|today|haven't|have not|hasn't|has not|didn't|did not)\b/.test(normalized);
      const uncertain=uncertaintyCue.test(normalized);
      const inheritedUncertainty: boolean = sharedUncertainty && boundary === 'and' && !uncertain
        && !/^(?:i|my|the fictional person|definitely|certainly)\b/.test(normalized);
      const context:ReportContext=quoted || inheritedUncertainty || ambiguousList || /\b(?:read about|article|website|definition|the word|tell me about|what is|can you explain|not free of|not without|wouldn't say|rather than)\b/.test(normalized)
        || /\b(?:apart from|except|other than)\b/.test(normalized)&&!hasPainException(normalized)?'non_asserted'
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
      if (negationCue.test(normalized) && !negatedResolution(normalized) && !hasPainException(normalized)) negationStart = start;
      if (context !== 'current' || uncertain) negationStart = null;
      const negative = negationStart !== null;
      sharedUncertainty = context === 'current' && uncertain || inheritedUncertainty;
      result.push({quote,start,end,context,negative,uncertain,negationStart,correction:correctionCue.test(sentence[0])});
    }
  }
  // A short trailing uncertainty marker scopes the preceding single symptom,
  // including question-mark fragments. Keep the complete literal source quote.
  for(let i=1;i<result.length;i++){
    const marker=result[i], previous=result[i-1];
    if(previous.context==='current' && marker.context==='current' &&
      /^(?:(?:but|and)\s+)?(?:i(?: am|'m)?\s+(?:honestly\s+)?)?(?:not sure|unsure|uncertain|cannot tell|can't tell)$/i.test(marker.quote) &&
      (/^[?,\s]*(?:(?:but|and)\s*)?$/i.test(text.slice(previous.end,marker.start)) ||
        /\bor\b/i.test(previous.quote)&&/^[;\s]*$/i.test(text.slice(previous.end,marker.start))) &&
      languageConcepts.filter(c=>c.pattern.test(previous.quote)).length===1){
      previous.uncertain=true;previous.negative=false;previous.negationStart=null;
      previous.end=marker.end;previous.quote=text.slice(previous.start,marker.end);
      result.splice(i,1);i--;
    }
  }
  return result;
}
export function contextAllowsObservation(text:string, quote:string, pattern?:RegExp) {
  const clauses=reportClauses(text).filter(c=>pattern?pattern.test(c.quote):c.quote.includes(quote)||quote.includes(c.quote));
  return !!clauses.length&&clauses.some(c=>c.context==='current')&&!clauses.some(c=>c.context!=='current' && quote.includes(c.quote));
}
