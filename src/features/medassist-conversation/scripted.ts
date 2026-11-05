import type { Answer, Question } from '../model-a-research/contracts';
import { readNaturalRequest, type Definition, type NaturalRequest, type NaturalVocabulary } from './natural';

// Small, authored UI fixtures. The order is fixed and contains no ranking or clinical rules.
const questions = [
  ['E_201', 'Does the fictional person have a cough?'],
  ['E_91', 'Does the fictional person have a fever?'],
  ['E_97', 'Does the fictional person have a sore throat?'],
  ['E_181', 'Does the fictional person have a stuffy nose or clear runny nose?'],
  ['E_94', 'Does the fictional person have chills?'],
] as const;
const items: Definition[] = questions.map(([evidence_id, question_en]) => ({
  evidence_id, question_en, kind: 'symptom', data_type: 'B', possible_values: [true, false], initial_allowed: true,
}));

export const scriptedVocabulary: NaturalVocabulary = {
  schema_version: 'medassist.natural-vocabulary.v1',
  fictional_only: true,
  items,
  coverage: { symptom_fields: items.length, universal_coverage: false },
};

export function runScriptedInterview(input: NaturalRequest) {
  const request = readNaturalRequest(input);
  if (!request || request.initial.state !== 'confirmed' || request.initial.value !== true)
    throw Error('Invalid fictional interview');
  const answers = [request.initial, ...request.initial_disclosures, ...request.turns.flatMap(turn => [turn.answer, ...turn.disclosures])];
  const known = new Map<string, Answer>();
  let reason: string | null = request.stop;
  for (const answer of answers) {
    if (!items.some(item => item.evidence_id === answer.evidence_id) ||
        (answer.state === 'confirmed' && typeof answer.value !== 'boolean'))
      throw Error('Answer is outside the fictional script');
    const previous = known.get(answer.evidence_id);
    if (answer.state === 'contradiction' || previous && (previous.state !== answer.state || previous.value !== answer.value)) {
      reason = 'unresolved_contradiction';
      known.set(answer.evidence_id, { evidence_id: answer.evidence_id, state: 'contradiction', value: null });
    } else {
      known.set(answer.evidence_id, answer);
    }
  }
  const next = reason ? undefined : items.find(item => !known.has(item.evidence_id));
  const question: Question | null = next ? {
    evidence_id: next.evidence_id, question_en: next.question_en, data_type: 'B',
    possible_values: [true, false], allows_unknown: true, unknown_value: null,
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
