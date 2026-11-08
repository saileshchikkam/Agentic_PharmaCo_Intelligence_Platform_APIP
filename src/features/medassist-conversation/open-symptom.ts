/**
 * Prompt-2 boundary only: an open description is not a legacy evidence answer.
 * This type is intentionally not yet persisted, exported, or sent to Model A.
 * It provides one source-bound intake contract for the next authorized extractor.
 */
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
