import type { Answer, Question } from '../model-a-research/contracts';
import { readNaturalRequest, type Definition, type NaturalRequest, type NaturalVocabulary } from './natural';
import metadata from '../../../models/medassist_ai/docs/symptom-schema-metadata.json';

const items: Definition[] = (metadata.items as any[])
  .filter(d => !d.quarantined)
  .map(d => ({
    evidence_id: d.evidence_id,
    question_en: d.question_en,
    kind: d.kind,
    data_type: d.data_type,
    possible_values: d.data_type === 'B' ? [true, false] : d.possible_values,
    initial_allowed: d.kind === 'symptom' && !d.parent,
    value_labels: d.value_labels,
  }));

export const scriptedVocabulary: NaturalVocabulary = {
  schema_version: 'medassist.natural-vocabulary.v1',
  fictional_only: true,
  items,
  coverage: { symptom_fields: items.filter(i => i.kind === 'symptom').length, universal_coverage: false },
};

export function runScriptedInterview(input: NaturalRequest) {
  const request = readNaturalRequest(input);
  if (!request || request.initial.state !== 'confirmed' || request.initial.value !== true)
    throw Error('Invalid fictional interview');
  const answers = [request.initial, ...request.initial_disclosures, ...request.turns.flatMap(turn => [turn.answer, ...turn.disclosures])];
  const known = new Map<string, Answer>();
  let reason: string | null = request.stop;
  for (const answer of answers) {
    const item = items.find(i => i.evidence_id === answer.evidence_id);
    if (!item)
      throw Error('Answer is outside the fictional script');
    const previous = known.get(answer.evidence_id);
    if (answer.state === 'contradiction' || previous && (previous.state !== answer.state || JSON.stringify(previous.value) !== JSON.stringify(answer.value))) {
      reason = 'unresolved_contradiction';
      known.set(answer.evidence_id, { evidence_id: answer.evidence_id, state: 'contradiction', value: null });
    } else {
      known.set(answer.evidence_id, answer);
    }
  }
  const next = reason ? undefined : items.find(item => !known.has(item.evidence_id));
  const question: Question | null = next ? {
    evidence_id: next.evidence_id, question_en: next.question_en, data_type: next.data_type,
    possible_values: next.possible_values, allows_unknown: true, unknown_value: null,
  } : null;
  return {
    selection: {
      status: question ? 'question' as const : 'abstained' as const,
      question,
      reason: question ? null : reason ?? 'no_eligible_questions',
    },
    handoff: null,
    scriptedEvidence: {
      schema_version: 'medassist.scripted-evidence.v1',
      mode: 'scripted_fictional',
      model_a_inference: false,
      model_b_status: 'not_enabled',
      context: request.context,
      missing_item_semantics: 'unspecified_never_negative',
      items: [...known.values()].map(({ evidence_id, state, value }) => ({
        evidence_id,
        status: state === 'confirmed' ? value === true ? 'observed_positive' : 'observed_negative' : state,
        value,
      })),
    },
  };
}
