import rules from '../../../models/medassist_ai/safety/provisional-rules.v2.json';

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
  return text.replace(/[^a-z0-9'.!?;,\n]+/g, ' ').replace(/ +/g, ' ').trim();
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
/** Bounded deterministic interruption, separate from extraction and clinical assessment. */
export function evaluateStatement(raw: string): SafetyDecision {
  if (typeof raw !== 'string' || raw.length > 4000) return decision('clarify', [], []);
  const text = normalizeSafetyText(raw), mentions: SafetyMention[] = [], active: {id: string; action: 'escalate'|'clarify'}[] = [];
  const seen = new Set<string>();
  for (const clause of text.split(re(rules.context.split))) {
    if (!clause.trim()) continue;
    for (const rule of rules.rules) for (const pattern of rule.patterns) for (const match of clause.matchAll(re(pattern, true))) {
      const prefix = clause.slice(0, match.index), suffix = clause.slice(match.index! + match[0].length);
      const recent = has('recent', clause.replace(re(rules.context.recent_clause_exclusions, true), '')), past = has('past', clause), uncertain = has('uncertain', clause);
      const current = recent || has('current', clause) || rule.kind === 'request';
      const negativePrefix = prefix.replace(re(rules.context.uncertainty_negation_exceptions, true), '');
      const negative = re(rules.context.negation_prefix).test(negativePrefix) || re(rules.context.negation_suffix).test(suffix);
      const context: SafetyMention['context'] = has('education', clause) ? 'educational' : has('hypothetical', clause) ? 'hypothetical'
        : has('remote', clause) && !recent ? 'remote_history' : 'reported';
      const mention: SafetyMention = { rule_id: rule.id, category: rule.category,
        subject: has('other', clause) ? 'other' : has('self', clause) ? 'self' : 'unspecified',
        assertion: negative && !uncertain ? 'negated' : uncertain ? 'suspected' : 'affirmed',
        temporality: context === 'remote_history' ? 'remote' : past && !recent || !current ? 'uncertain' : 'current_or_recent', context };
      const key = JSON.stringify(mention); if (seen.has(key)) continue; seen.add(key); mentions.push(mention);
      if (context !== 'reported' || negative && !uncertain) continue;
      const action = negative && uncertain || rule.kind === 'clarification' || past && !recent
        || rule.kind === 'declaration' && !has('current', clause) && !recent ? 'clarify' : 'escalate';
      active.push({id: rule.id, action});
    }
  }
  const status = active.some(m => m.action === 'escalate') ? 'escalate' : active.length ? 'clarify' : 'not_assessed';
  return decision(status, [...new Set(active.filter(m => m.action === status).map(m => m.id))], mentions);
}
/** Only explicit scope clarification; does not diagnose, infer negative evidence or clear an emergency latch. */
export function resolveSafetyClarification(prior: SafetyDecision, answer: 'current'|'non_current'|'unsure'): SafetyDecision {
  if (prior.status !== 'clarify') return prior;
  return decision(answer === 'non_current' ? 'not_assessed' : 'escalate', prior.matched_rule_ids, prior.mentions);
}
