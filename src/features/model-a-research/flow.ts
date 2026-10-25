import { type Answer, type DemoResult, type InterviewRequest, readHandoff } from './contracts';

export function appendAnswer(request: InterviewRequest, result: DemoResult, state: Answer['state'], value: Answer['value']): InterviewRequest {
  const q = result.selection.question;
  if (!q || request.stop || request.answers.length >= 20 || request.initial.evidence_id === q.evidence_id
    || request.answers.some(a => a.evidence_id === q.evidence_id)) throw new Error('NO_PENDING_QUESTION');
  if (state !== 'confirmed' && value !== null) throw new Error('UNKNOWN_MUST_BE_NULL');
  if (state === 'confirmed') {
    const allowed = (v: unknown) => q.possible_values.some(candidate => JSON.stringify(candidate) === JSON.stringify(v));
    if (q.data_type === 'B' && typeof value !== 'boolean' || q.data_type === 'C' && !allowed(value)
      || q.data_type === 'M' && (!Array.isArray(value) || !value.every(allowed) || new Set(value.map(v => JSON.stringify(v))).size !== value.length)) throw new Error('INVALID_TYPED_ANSWER');
  }
  return { ...request, answers: [...request.answers, { evidence_id: q.evidence_id, state, value }] };
}
export const endInterview = (request: InterviewRequest): InterviewRequest => ({ ...request, stop: 'user_stopped' });
export function exportEvidence(result: DemoResult): string {
  const evidence = readHandoff(result.handoff);
  if (!evidence) throw new Error('NO_ACCEPTED_EVIDENCE');
  return JSON.stringify(evidence, null, 2) + '\n';
}
