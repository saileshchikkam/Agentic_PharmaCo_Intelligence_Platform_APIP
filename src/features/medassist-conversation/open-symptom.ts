/**
 * An open description is not a legacy evidence answer. It remains source-bound,
 * page-memory intake information and is never eligible for Model A by itself.
 */
import { reportClauses, type ReportContext } from './language-context';
export type OpenSymptomFamily =
  | 'head_nervous_balance' | 'eyes_ears' | 'nose_mouth_throat' | 'respiratory'
  | 'chest_cardiovascular' | 'digestive' | 'urinary_reproductive'
  | 'muscles_joints_limbs' | 'skin_allergic' | 'general_mental_behavioral' | 'unclassified';

export type OpenSymptomMention = Readonly<{
  schema_version: 'medassist.open-symptom-mention.v1';
  source_text: string;
  source_start: number;
  source_end: number;
  description: string;
  body_location: string | null;
  family: OpenSymptomFamily;
  temporality: 'current' | 'historical_or_resolved' | 'future_or_hypothetical' | 'unknown';
  polarity: 'present' | 'absent' | 'uncertain' | 'conflicting' | 'not_asserted';
  subject: 'target' | 'other_person' | 'unknown';
  time_text: string | null;
  extraction: 'deterministic' | 'model_candidate' | 'user_entered';
  confidence: 'high' | 'medium' | 'low' | null;
  mapping: Readonly<{ legacy_evidence_id: string; state: 'confirmed' | 'unknown' | 'contradiction'; value: boolean | null }> | null;
  clarification_needed: boolean;
  confirmation: 'pending' | 'confirmed' | 'rejected' | 'not_applicable';
}>;

export type OpenMentionStatus = 'retained' | 'needs_clarification' | 'historical_or_resolved' | 'other_person' | 'hypothetical';
export type OpenMentionRecord = Readonly<{
  id: string;
  request_id: string;
  source_revision: number;
  mention: OpenSymptomMention;
  status: OpenMentionStatus;
  supersedes: string | null;
  superseded_by: string | null;
  eligible_for_model_a: false;
}>;

type Unmapped = { quote: string; kind: 'duration' | 'unsupported' | 'ambiguous' };
type CaptureInput = Readonly<{ text: string; requestId: string; turn: number; unmapped: readonly Unmapped[] }>;

const familyTerms: readonly [OpenSymptomFamily, RegExp, RegExp][] = [
  ['head_nervous_balance', /\b(?:head|face|dizz\w*|spinn(?:ing)?|balance|faint\w*|numb\w*)\b/i, /\b(?:head|face)\b/i],
  ['eyes_ears', /\b(?:eye|ear|vision|hear|ringing|buzzing|light)\b/i, /\b(?:eye|ear)\b/i],
  ['nose_mouth_throat', /\b(?:nose|mouth|throat|taste|swallow)\b/i, /\b(?:nose|mouth|throat)\b/i],
  ['respiratory', /\b(?:breath\w*|wheez\w*|chest tight)\b/i, /\bchest\b/i],
  ['chest_cardiovascular', /\b(?:heart|palpitation|chest pressure|chest pain)\b/i, /\bchest\b/i],
  ['digestive', /\b(?:stomach|belly|gassy|vomit|bowel|appetite)\b/i, /\b(?:stomach|belly)\b/i],
  ['urinary_reproductive', /\b(?:urine|pee|toilet|period|pregnan|cramp)\b/i, /\b(?:urine|period)\b/i],
  ['muscles_joints_limbs', /\b(?:back|knee|ankle|hand|leg|arm|joint|muscle|limb|swollen)\b/i, /\b(?:back|knee|ankle|hand|leg|arm|joint|muscle|limb)\b/i],
  ['skin_allergic', /\b(?:skin|rash|hive|itch|bump|lip|allerg)\b/i, /\b(?:skin|lip)\b/i],
  ['general_mental_behavioral', /\b(?:tired|weak|anxious|mind|sleep|energy|confused|stress)\b/i, /\b(?:mind|body)\b/i],
];

function locate(text: string, quote: string, from: number) {
  const direct = text.indexOf(quote, from);
  return direct >= 0 ? direct : text.toLowerCase().indexOf(quote.toLowerCase(), from);
}
function familyFor(quote: string): { family: OpenSymptomFamily; location: string | null } {
  for (const [family, matches, location] of familyTerms) {
    if (matches.test(quote)) return { family, location: quote.match(location)?.[0] ?? null };
  }
  return { family: 'unclassified', location: null };
}
function stateFor(context: ReportContext, uncertain: boolean, negative: boolean): Pick<OpenSymptomMention, 'temporality' | 'polarity' | 'subject'> & { status: OpenMentionStatus } {
  if (context === 'other_person') return { temporality: 'unknown', polarity: uncertain ? 'uncertain' : negative ? 'absent' : 'present', subject: 'other_person', status: 'other_person' };
  if (context === 'historical_or_resolved') return { temporality: 'historical_or_resolved', polarity: uncertain ? 'uncertain' : negative ? 'absent' : 'present', subject: 'target', status: 'historical_or_resolved' };
  if (context === 'hypothetical' || context === 'non_asserted' || context === 'suspected_condition') return { temporality: 'future_or_hypothetical', polarity: 'not_asserted', subject: 'target', status: 'hypothetical' };
  return { temporality: 'current', polarity: uncertain ? 'uncertain' : negative ? 'absent' : 'present', subject: 'target', status: uncertain ? 'needs_clarification' : 'retained' };
}
function idFor(requestId: string, start: number, end: number, quote: string) {
  let hash = 2166136261;
  for (const character of `${requestId}:${start}:${end}:${quote}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `open-${(hash >>> 0).toString(36)}`;
}

/** Convert existing unmapped source spans into non-clinical intake records. */
export function captureOpenMentions(input: CaptureInput): OpenMentionRecord[] {
  const clauses = reportClauses(input.text);
  const seen = new Set<string>(); let cursor = 0;
  const records: OpenMentionRecord[] = [];
  for (const item of input.unmapped) {
    const start = locate(input.text, item.quote, cursor);
    if (start < 0) continue;
    cursor = start + item.quote.length;
    const end = start + item.quote.length;
    const key = `${start}:${end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const clause = clauses.find(row => row.start <= start && row.end >= end) ?? clauses.find(row => row.quote.includes(item.quote));
    const context = clause?.context ?? 'current';
    const state = stateFor(context, clause?.uncertain ?? false, clause?.negative ?? false);
    const classification = familyFor(item.quote);
    const mention: OpenSymptomMention = {
      schema_version: 'medassist.open-symptom-mention.v1', source_text: input.text, source_start: start, source_end: end,
      description: input.text.slice(start, end), body_location: classification.location, family: classification.family,
      temporality: state.temporality, polarity: state.polarity, subject: state.subject,
      time_text: /\b(?:since|from|for|yesterday|today|last week|morning|night|now)\b/i.test(item.quote) ? item.quote : null,
      extraction: 'deterministic', confidence: null, mapping: null,
      clarification_needed: state.status !== 'retained', confirmation: 'not_applicable',
    };
    records.push({ id: idFor(input.requestId, start, end, mention.description), request_id: input.requestId, source_revision: input.turn,
      mention, status: state.status, supersedes: null, superseded_by: null, eligible_for_model_a: false });
  }
  return records;
}

/** Append only distinct source records; never infer that similar wording supersedes another statement. */
export function reconcileOpenMentions(existing: readonly OpenMentionRecord[], incoming: readonly OpenMentionRecord[]) {
  const ids = new Set(existing.map(item => item.id));
  return [...existing, ...incoming.filter(item => !ids.has(item.id))];
}

export function openMentionExport(items: readonly OpenMentionRecord[]) {
  return { schema_version: 'medassist.open-symptom-export.v1' as const, model_a_eligible: false as const,
    items: items.map(item => ({ ...item, mention: { ...item.mention, mapping: item.mention.mapping && { ...item.mention.mapping } } })) };
}

/** Source bounds, original wording, and an abstaining mapping are mandatory. */
export function readOpenSymptomMention(value: unknown): OpenSymptomMention | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const sourceStart = row.source_start, sourceEnd = row.source_end;
  const keys = ['body_location','clarification_needed','confidence','confirmation','description','extraction','family','mapping','polarity','schema_version','source_end','source_start','source_text','subject','temporalit' + 'y','time_text'].sort();
  if (Object.keys(row).sort().join('|') !== keys.join('|') || row.schema_version !== 'medassist.open-symptom-mention.v1'
    || typeof row.source_text !== 'string' || typeof row.description !== 'string' || !row.source_text.trim()
    || !Number.isInteger(sourceStart) || !Number.isInteger(sourceEnd) || typeof sourceStart !== 'number' || typeof sourceEnd !== 'number' || sourceStart < 0 || sourceEnd <= sourceStart
    || sourceEnd > row.source_text.length || row.source_text.slice(sourceStart, sourceEnd) !== row.description
    || !(row.body_location === null || typeof row.body_location === 'string') || !(row.time_text === null || typeof row.time_text === 'string')
    || !['head_nervous_balance','eyes_ears','nose_mouth_throat','respiratory','chest_cardiovascular','digestive','urinary_reproductive','muscles_joints_limbs','skin_allergic','general_mental_behavioral','unclassified'].includes(row.family as string)
    || !['current','historical_or_resolved','future_or_hypothetical','unknown'].includes(row.temporality as string)
    || !['present','absent','uncertain','conflicting','not_asserted'].includes(row.polarity as string)
    || !['target','other_person','unknown'].includes(row.subject as string)
    || !['deterministic','model_candidate','user_entered'].includes(row.extraction as string)
    || ![null,'high','medium','low'].includes(row.confidence as string | null)
    || typeof row.clarification_needed !== 'boolean' || !['pending','confirmed','rejected','not_applicable'].includes(row.confirmation as string)) return null;
  if (row.mapping !== null) {
    if (!row.mapping || typeof row.mapping !== 'object' || Array.isArray(row.mapping)) return null;
    const mapping = row.mapping as Record<string, unknown>;
    if (Object.keys(mapping).sort().join('|') !== 'legacy_evidence_id|state|value' || !/^E_\d{1,3}$/.test(mapping.legacy_evidence_id as string)
      || !['confirmed','unknown','contradiction'].includes(mapping.state as string)
      || !(typeof mapping.value === 'boolean' || mapping.value === null)
      || (mapping.state === 'confirmed' && typeof mapping.value !== 'boolean') || (mapping.state !== 'confirmed' && mapping.value !== null)) return null;
  }
  return row as OpenSymptomMention;
}
