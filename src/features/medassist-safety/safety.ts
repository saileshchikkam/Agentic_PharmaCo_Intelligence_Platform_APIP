import rules from '../../../models/medassist_ai/safety/provisional-rules.v1.json';

export type SafetyDecision = Readonly<{
  schema_version: 'medassist.safety-decision.v1'; status: 'escalate' | 'not_assessed';
  rule_set_version: string; review_status: 'provisional_unreviewed'; clinical_validation: false;
  matched_rule_ids: string[]; suppress_ordinary_flow: boolean; suppress_self_care: boolean;
  guidance: string | null; model_b_status: 'unable_to_assess'; negative_safety_conclusion: false;
}>;
/** Local synchronous precedence. No network, model, account data or diagnostic claims. */
export function evaluateStatement(raw: string): SafetyDecision {
  const text = ` ${raw.toLowerCase().replace(/\u2019/g, "'").replace(/[^a-z0-9']+/g, ' ').trim()} `;
  const ids = rules.rules.filter(rule => rule.phrases.some(phrase => text.includes(` ${phrase} `))).map(rule => rule.id);
  return { schema_version: 'medassist.safety-decision.v1', status: ids.length ? 'escalate' : 'not_assessed',
    rule_set_version: rules.version, review_status: 'provisional_unreviewed', clinical_validation: false,
    matched_rule_ids: ids, suppress_ordinary_flow: !!ids.length, suppress_self_care: !!ids.length,
    guidance: ids.length ? rules.guidance : null, model_b_status: 'unable_to_assess', negative_safety_conclusion: false };
}
