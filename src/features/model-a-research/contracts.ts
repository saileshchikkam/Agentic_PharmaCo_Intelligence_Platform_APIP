/** Transport guards for the local demo. Python remains authoritative for frozen vocabulary/eligibility. */
export type Scalar = boolean | number | string;
export type Answer = { evidence_id: string; state: 'confirmed' | 'unknown' | 'contradiction'; value: Scalar | Scalar[] | null };
export type Context = { age: number; source_sex: 'M' | 'F' };
export type InterviewRequest = { schema_version: 'model-a.request.v1'; fictional_case: true; context: Context;
  initial: Answer; answers: Answer[]; stop: 'user_stopped' | 'unresolved_contradiction' | null };
export type Question = { evidence_id: string; question_en: string; data_type: 'B' | 'C' | 'M';
  possible_values: Scalar[]; allows_unknown: true; unknown_value: null };
export const statuses = ['observed_positive', 'observed_negative', 'observed_value', 'unknown', 'not_asked', 'unsupported', 'contradiction'] as const;
export type EvidenceItem = { evidence_id: string; data_type: 'B' | 'C' | 'M'; status: typeof statuses[number];
  value: Answer['value']; unsupported_reason: 'quarantined_question' | null;
  provenance: { source: 'developer_fictional_fixture' | 'not_disclosed' | 'frozen_scope_exclusion'; disclosure: 'initial' | 'followup' | 'none'; turn: number | null } };
export type Handoff = { schema_version: 'model-a-to-b.evidence.v1'; research_only: true; intended_use: 'fictional_demo_evidence_only';
  producer: 'model-a.adapter.v1'; protocol_id: 'medassist-v2-adaptive-questioning-v1'; context: Context;
  context_origin: 'developer_fictional_fixture'; initial_evidence_id: string; items: EvidenceItem[];
  missing_item_semantics: 'unspecified_never_negative'; model_b_status: 'not_enabled'; human_clinical_review: false };
type DisclosedEvidence = { schema_version: 'model-a.evidence.v1'; origin: 'developer_fictional_fixture'; context: Context;
  initial: Answer; answers: Answer[]; unobserved_semantics: 'unknown_not_negative'; human_clinical_review: false };
export type DemoResult = { schema_version: 'model-a.demo.v1'; selection: {
  schema_version: 'model-a.response.v1'; research_only: true; status: 'question' | 'abstained'; reason: string | null;
  question: Question | null; state: { answered_question_ids: string[]; pending_question_id: string | null;
    questions_answered: number; remaining_budget: number; stopping_reason: string | null } | null;
  evidence: DisclosedEvidence | null; limitations: string[] }; handoff: Handoff | null };
export type Fixtures = { schema_version: 'model-a.fixtures.v1'; fictional_only: true;
  fixtures: { fixture_id: string; label: string; request: InterviewRequest }[] };

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function keys(v: unknown, required: string[], optional: string[] = []): v is Record<string, unknown> {
  return record(v) && required.every(k => Object.hasOwn(v, k)) && Object.keys(v).every(k => [...required, ...optional].includes(k));
}
const id = (v: unknown): v is string => typeof v === 'string' && /^E_[0-9]{1,3}$/.test(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 4096;
const nullableText = (v: unknown) => v === null || text(v);
const scalar = (v: unknown): v is Scalar => typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v) || typeof v === 'string' && v.length <= 256;
const value = (v: unknown) => v === null || scalar(v) || Array.isArray(v) && v.length <= 223 && v.every(scalar);
const context = (v: unknown): v is Context => keys(v, ['age', 'source_sex']) && typeof v.age === 'number' && Number.isFinite(v.age) && v.age >= 0 && ['M', 'F'].includes(v.source_sex as string);
const answer = (v: unknown): v is Answer => keys(v, ['evidence_id', 'state', 'value']) && id(v.evidence_id)
  && ['confirmed', 'unknown', 'contradiction'].includes(v.state as string) && value(v.value)
  && (v.state === 'confirmed' ? v.value !== null : v.value === null);
const answers = (v: unknown): v is Answer[] => Array.isArray(v) && v.length <= 20 && v.every(answer);

export function readRequest(v: unknown): InterviewRequest | null {
  if (!keys(v, ['schema_version', 'fictional_case', 'context', 'initial'], ['answers', 'stop'])
    || v.schema_version !== 'model-a.request.v1' || v.fictional_case !== true || !context(v.context) || !answer(v.initial)
    || v.answers !== undefined && !answers(v.answers) || v.stop != null && !['user_stopped', 'unresolved_contradiction'].includes(v.stop as string)) return null;
  return { schema_version: v.schema_version, fictional_case: true, context: v.context, initial: v.initial,
    answers: (v.answers ?? []) as Answer[], stop: (v.stop ?? null) as InterviewRequest['stop'] };
}

function question(v: unknown): v is Question {
  return keys(v, ['evidence_id', 'question_en', 'data_type', 'possible_values', 'allows_unknown', 'unknown_value'])
    && id(v.evidence_id) && text(v.question_en) && ['B', 'C', 'M'].includes(v.data_type as string)
    && Array.isArray(v.possible_values) && v.possible_values.length <= 223 && v.possible_values.every(scalar)
    && v.allows_unknown === true && v.unknown_value === null;
}
function evidence(v: unknown): v is DisclosedEvidence {
  return keys(v, ['schema_version', 'origin', 'context', 'initial', 'answers', 'unobserved_semantics', 'human_clinical_review'])
    && v.schema_version === 'model-a.evidence.v1' && v.origin === 'developer_fictional_fixture' && context(v.context)
    && answer(v.initial) && answers(v.answers) && v.unobserved_semantics === 'unknown_not_negative' && v.human_clinical_review === false;
}
function item(v: unknown): v is EvidenceItem {
  if (!keys(v, ['evidence_id', 'data_type', 'status', 'value', 'unsupported_reason', 'provenance']) || !id(v.evidence_id)
    || !['B', 'C', 'M'].includes(v.data_type as string) || !statuses.includes(v.status as EvidenceItem['status']) || !value(v.value)
    || !keys(v.provenance, ['source', 'disclosure', 'turn'])) return false;
  const p = v.provenance;
  if (!['developer_fictional_fixture', 'not_disclosed', 'frozen_scope_exclusion'].includes(p.source as string)
    || !['initial', 'followup', 'none'].includes(p.disclosure as string)
    || !(p.turn === null || Number.isInteger(p.turn) && Number(p.turn) >= 0 && Number(p.turn) <= 20)) return false;
  if (v.status === 'observed_positive' && (v.data_type !== 'B' || v.value !== true)
    || v.status === 'observed_negative' && (v.data_type !== 'B' || v.value !== false)) return false;
  if (['unknown', 'not_asked', 'unsupported', 'contradiction'].includes(v.status as string) && v.value !== null) return false;
  if (v.status === 'observed_value' && (v.data_type === 'B' || v.value === null)) return false;
  return v.status === 'unsupported' ? v.unsupported_reason === 'quarantined_question' : v.unsupported_reason === null;
}
export function readHandoff(v: unknown): Handoff | null {
  if (!keys(v, ['schema_version', 'research_only', 'intended_use', 'producer', 'protocol_id', 'context', 'context_origin',
    'initial_evidence_id', 'items', 'missing_item_semantics', 'model_b_status', 'human_clinical_review'])
    || v.schema_version !== 'model-a-to-b.evidence.v1' || v.research_only !== true || v.intended_use !== 'fictional_demo_evidence_only'
    || v.producer !== 'model-a.adapter.v1' || v.protocol_id !== 'medassist-v2-adaptive-questioning-v1' || !context(v.context)
    || v.context_origin !== 'developer_fictional_fixture' || !id(v.initial_evidence_id) || !Array.isArray(v.items)
    || !v.items.length || v.items.length > 223 || !v.items.every(item) || new Set(v.items.map(i => i.evidence_id)).size !== v.items.length
    || v.missing_item_semantics !== 'unspecified_never_negative' || v.model_b_status !== 'not_enabled' || v.human_clinical_review !== false) return null;
  return v as Handoff;
}
export function readDemoResult(v: unknown): DemoResult | null {
  if (!keys(v, ['schema_version', 'selection', 'handoff']) || v.schema_version !== 'model-a.demo.v1'
    || !keys(v.selection, ['schema_version', 'research_only', 'status', 'reason', 'question', 'state', 'evidence', 'limitations'])) return null;
  const s = v.selection;
  if (s.schema_version !== 'model-a.response.v1' || s.research_only !== true || !['question', 'abstained'].includes(s.status as string)
    || !nullableText(s.reason) || !(s.question === null || question(s.question))
    || !(s.evidence === null || evidence(s.evidence)) || !Array.isArray(s.limitations) || s.limitations.length > 20 || !s.limitations.every(text)) return null;
  if (s.state !== null) {
    const t = s.state;
    if (!keys(t, ['answered_question_ids', 'pending_question_id', 'questions_answered', 'remaining_budget', 'stopping_reason'])
      || !Array.isArray(t.answered_question_ids) || t.answered_question_ids.length > 20 || !t.answered_question_ids.every(id)
      || new Set(t.answered_question_ids).size !== t.answered_question_ids.length
      || !(t.pending_question_id === null || id(t.pending_question_id)) || !Number.isInteger(t.questions_answered)
      || t.questions_answered !== t.answered_question_ids.length || !Number.isInteger(t.remaining_budget)
      || t.remaining_budget !== 20 - Number(t.questions_answered) || !nullableText(t.stopping_reason)) return null;
  }
  if ((s.evidence === null) !== (v.handoff === null) || v.handoff !== null && !readHandoff(v.handoff)) return null;
  if (s.status === 'question' && (s.question === null || s.state === null || s.evidence === null || s.reason !== null)) return null;
  if (s.status === 'abstained' && (s.question !== null || s.reason === null)) return null;
  return v as DemoResult;
}
export function readFixtures(v: unknown): Fixtures | null {
  if (!keys(v, ['schema_version', 'fictional_only', 'fixtures']) || v.schema_version !== 'model-a.fixtures.v1' || v.fictional_only !== true
    || !Array.isArray(v.fixtures) || !v.fixtures.length || v.fixtures.length > 3) return null;
  for (const f of v.fixtures) if (!keys(f, ['fixture_id', 'label', 'request']) || !text(f.fixture_id) || !text(f.label) || !readRequest(f.request)) return null;
  return v as Fixtures;
}
