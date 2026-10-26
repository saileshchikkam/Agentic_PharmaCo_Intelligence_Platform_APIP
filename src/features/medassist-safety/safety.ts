import rules from '../../../models/medassist_ai/safety/provisional-rules.v3.json';

export type SafetyMention = Readonly<{
  rule_id: string; category: string; subject: 'self' | 'other' | 'unspecified';
  assertion: 'affirmed' | 'suspected' | 'negated'; temporality: 'current_or_recent' | 'uncertain' | 'remote';
  context: 'reported' | 'remote_history' | 'hypothetical' | 'educational';
}>;
export type SafetyDecision = Readonly<{
  schema_version: 'medassist.safety-decision.v2'; status: 'escalate' | 'clarify' | 'not_assessed';
  rule_set_version: string; review_status: 'provisional_unreviewed'; clinical_validation: false;
  matched_rule_ids: string[]; mentions: SafetyMention[]; suppress_ordinary_flow: boolean; suppress_self_care: boolean;
  guidance: string | null; clarification_question: string | null;
  model_b_status: 'unable_to_assess'; negative_safety_conclusion: false;
}>;
const re = (s: string, global = false) => new RegExp(s, global ? 'g' : '');
const has = (key: keyof typeof rules.context, text: string) => re(rules.context[key]).test(text);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function normalizeSafetyText(raw: string): string {
  let text = raw.toLowerCase().replaceAll('\u2019', "'");
  for (const [from, to] of rules.normalizations) text = text.replace(re(`\\b${escape(from)}\\b`, true), to);
  return text.replace(/[^a-z0-9'.!?;,:\n]+/g, ' ').replace(/ +/g, ' ').trim();
}
function decision(status: SafetyDecision['status'], ids: string[], mentions: SafetyMention[]): SafetyDecision {
  const blocked = status !== 'not_assessed';
  return { schema_version: 'medassist.safety-decision.v2', status, rule_set_version: rules.version,
    review_status: 'provisional_unreviewed', clinical_validation: false, matched_rule_ids: ids, mentions,
    suppress_ordinary_flow: blocked, suppress_self_care: blocked,
    guidance: status === 'escalate' ? rules.guidance : status === 'clarify' ? rules.clarification_guidance : null,
    clarification_question: status === 'clarify' ? 'Is this happening now to you or someone else, only in the past or hypothetically, or are you unsure?' : null,
    model_b_status: 'unable_to_assess', negative_safety_conclusion: false };
}
function subjectAt(clause: string, end: number, inherited: SafetyMention['subject']): SafetyMention['subject'] {
  const area = clause.slice(0, end);
  const found: {at:number;subject:SafetyMention['subject']}[]=[];
  for (const m of area.matchAll(re(rules.context.self,true))) found.push({at:m.index!,subject:'self'});
  for (const m of area.matchAll(re(rules.context.other,true))) found.push({at:m.index!,subject:'other'});
  found.sort((a,b)=>a.at-b.at);
  return found.length ? found[found.length-1].subject : inherited;
}
function targetEnd(clause:string,end:number):number {
  const suffix=clause.slice(end), lead=/^\s*(?:(?:from|for|of|in|on|to|up|out)\s+)?/.exec(suffix)![0].length;
  const target=re(`^(?:${rules.context.self}|${rules.context.other})`).exec(suffix.slice(lead));
  return target?end+lead+target[0].length:end;
}
/** Bounded mention-local context. No model output, diagnosis, evidence insertion or clearance. */
export function evaluateStatement(raw: string): SafetyDecision {
  if (typeof raw !== 'string' || raw.length > 4000) return decision('clarify', [], []);
  const text=normalizeSafetyText(raw), mentions:SafetyMention[]=[], active:{id:string;action:'escalate'|'clarify'}[]=[], seen=new Set<string>();
  let inheritedSubject:SafetyMention['subject']='unspecified', inheritedScope:SafetyMention['context']='reported', inheritedRemote=false, antecedent='';
  for (const clause of text.split(re(rules.context.split))) {
    if (!clause.trim()) continue;
    const localEducation=has('education',clause), localHypothesis=has('hypothetical',clause);
    if (has('actual_override',clause)) { inheritedScope='reported'; inheritedRemote=false; }
    const contextScope:SafetyMention['context']=localEducation?'educational':localHypothesis?'hypothetical':inheritedScope;
    const recent=has('recent',clause.replace(re(rules.context.recent_clause_exclusions,true),'')), past=has('past',clause), current=has('current',clause);
    const remote:boolean=(has('remote',clause)||inheritedRemote)&&!recent;
    const uncertain=has('uncertain',clause), unknown=has('scope_unknown',clause);
    let matched=false;
    for (const rule of rules.rules) {
      if (rule.id==='reported_stroke_emergency' && has('idiom',clause)) continue;
      const matches=rule.patterns.flatMap(pattern=>[...clause.matchAll(re(pattern,true))].map(m=>({start:m.index!,end:m.index!+m[0].length,text:m[0]})));
      if (!matches.length && rule.id===antecedent && recent && has('reference',clause)) {
        const m=re(rules.context.reference).exec(clause)!; matches.push({start:m.index,end:m.index+m[0].length,text:m[0]});
      }
      for (const m of matches) {
        matched=true;
        const prefix=clause.slice(0,m.start).replace(re(rules.context.uncertainty_negation_exceptions,true),'');
        const inside=m.text.replace(re(rules.context.intrinsic_negative,true),'');
        const negative=re(rules.context.negation_prefix).test(prefix)||re(rules.context.negation_inside).test(inside)||re(rules.context.negation_suffix).test(clause.slice(m.end));
        const subject=subjectAt(clause,rule.kind==='request'?clause.length:targetEnd(clause,m.end),inheritedSubject);
        const context:SafetyMention['context']=contextScope!=='reported'?contextScope:remote?'remote_history':'reported';
        const mention:SafetyMention={rule_id:rule.id,category:rule.category,subject,assertion:negative&&!uncertain?'negated':uncertain?'suspected':'affirmed',temporality:context==='remote_history'?'remote':recent||current&&!past?'current_or_recent':'uncertain',context};
        const key=JSON.stringify(mention); if (!seen.has(key)) {seen.add(key);mentions.push(mention);}
        if (rule.kind==='declaration') antecedent=rule.id;
        if (context!=='reported'||negative&&!uncertain) continue;
        const credible=rule.kind==='request'||current||recent||subject!=='unspecified'||has('inability_fragment',clause);
        const action=unknown||negative&&uncertain||rule.kind==='clarification'||past&&!recent||!credible?'clarify':'escalate';
        active.push({id:rule.id,action});
      }
    }
    inheritedSubject=subjectAt(clause,clause.length,inheritedSubject);
    if (localEducation||localHypothesis) inheritedScope=contextScope;
    else if (matched) inheritedScope='reported';
    inheritedRemote=!matched&&remote;
  }
  const status=active.some(m=>m.action==='escalate')?'escalate':active.length?'clarify':'not_assessed';
  return decision(status,[...new Set(active.filter(m=>m.action===status).map(m=>m.id))],mentions);
}
/** Separate utterances keep their own assertion/history scope; later text cannot clear a trigger. */
export function evaluateStatements(texts: readonly string[]): SafetyDecision {
  if (!texts.length || texts.length>13) return decision('clarify',[],[]);
  const results=texts.map(evaluateStatement);
  return results.find(d=>d.status==='escalate')??results.find(d=>d.status==='clarify')??results[results.length-1];
}
/** Only explicit scope clarification; does not diagnose, infer negative evidence or clear an emergency latch. */
export function resolveSafetyClarification(prior: SafetyDecision, answer: 'current'|'non_current'|'unsure'): SafetyDecision {
  if (prior.status !== 'clarify') return prior;
  return decision(answer === 'non_current' ? 'not_assessed' : 'escalate', prior.matched_rule_ids, prior.mentions);
}
