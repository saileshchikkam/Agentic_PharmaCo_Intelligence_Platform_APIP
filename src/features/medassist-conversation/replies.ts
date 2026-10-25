import type { Answer, DemoResult, InterviewRequest, Question } from '../model-a-research/contracts';

/** Exact control labels only; free language is never interpreted as a clinical fact. */
export function parseQuickReply(text: string, question: Question | null): Pick<Answer, 'state' | 'value'> | null {
  if (!question || text.length > 300) return null;
  const normalized = text.trim().toLowerCase();
  if (['not sure', 'unknown', "i don't know"].includes(normalized)) return { state: 'unknown', value: null };
  if (question.data_type === 'B' && ['yes', 'no'].includes(normalized)) return { state: 'confirmed', value: normalized === 'yes' };
  if (question.data_type === 'C') {
    const matches = question.possible_values.filter(value => String(value).toLowerCase() === normalized);
    if (matches.length === 1) return { state: 'confirmed', value: matches[0] };
  }
  return null;
}

/** Reject replayed or malformed pending questions before changing accepted state. */
export function pendingQuestionIsFresh(request: InterviewRequest, result: DemoResult): boolean {
  const selection = result.selection;
  if (selection.status === 'abstained') return selection.question === null;
  const question = selection.question;
  return !!question && !request.stop && request.answers.length < 20
    && question.evidence_id !== request.initial.evidence_id
    && !request.answers.some(answer => answer.evidence_id === question.evidence_id)
    && selection.state?.pending_question_id === question.evidence_id;
}
