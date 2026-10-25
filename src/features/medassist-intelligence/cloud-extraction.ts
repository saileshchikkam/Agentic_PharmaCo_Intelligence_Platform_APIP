/** Separate cloud proposal wrapper; the frozen Model A handoff is unchanged. */
export type SparseObservation = { evidence_id: string; state: 'present' | 'absent' | 'unknown' | 'contradictory'; quote: string };
export type SparseExtraction = { schema_version: 'medassist.sparse-extraction.v1'; observations: SparseObservation[];
  unmapped: { quote: string; kind: 'unsupported_symptom' | 'duration' | 'ambiguous_wording' | 'unsupported_value' }[]; instruction_attempt: boolean };
export type CloudEnvelope = { schema_version: 'medassist.cloud-extraction.v1'; extraction: SparseExtraction;
  suggestion: { schema_version: 'medassist.extraction.v1'; items: { evidence_id: string; state: 'confirmed'; value: true }[] } | null;
  reason: 'confirm_single_symptom' | 'clarification_required';
  provenance: { provider: 'groq-cloud'; model: string; evaluation_sha256: string; accepted: false } };
const literal: Record<string, RegExp> = { E_201: /\bcough(?:ing)?\b/i, E_91: /\bfever\b/i, E_97: /\bsore throat\b|\bthroat is sore\b/i };
const keys = (v: unknown, fields: string[]): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).sort().join() === [...fields].sort().join();
export function readSparseExtraction(raw: unknown, text: string): SparseExtraction | null {
  if (!keys(raw, ['schema_version','observations','unmapped','instruction_attempt']) || raw.schema_version !== 'medassist.sparse-extraction.v1'
    || typeof raw.instruction_attempt !== 'boolean' || !Array.isArray(raw.observations) || raw.observations.length > 3 || !Array.isArray(raw.unmapped) || raw.unmapped.length > 20
    || raw.instruction_attempt && (raw.observations.length || raw.unmapped.length)) return null;
  const seen = new Set();
  for (const item of raw.observations) {
    if (!keys(item,['evidence_id','state','quote']) || typeof item.evidence_id !== 'string' || !literal[item.evidence_id]
      || seen.has(item.evidence_id) || !['present','absent','unknown','contradictory'].includes(item.state as string)
      || typeof item.quote !== 'string' || !item.quote.trim() || item.quote.length > 300 || !text.includes(item.quote) || !literal[item.evidence_id].test(item.quote)) return null;
    seen.add(item.evidence_id);
  }
  for (const item of raw.unmapped) if (!keys(item,['quote','kind']) || typeof item.quote !== 'string' || !item.quote.trim()
    || item.quote.length > 300 || !text.includes(item.quote) || !['unsupported_symptom','duration','ambiguous_wording','unsupported_value'].includes(item.kind as string)) return null;
  return raw as SparseExtraction;
}
export function cloudEnvelope(extraction: SparseExtraction, text: string, model: string, evaluationHash: string): CloudEnvelope {
  const only = extraction.observations[0];
  const marked = Object.values(literal).filter(p => p.test(text));
  const unsupportedQualifier = /\b(days?|hours?|weeks?|months?|years?|yesterday|since)\b|\bfor\s+\d/i.test(text);
  const overrideAttempt = /\b(ignore|disregard|instructions|schema|credential|token|prescribe|diagnose)\b|api key|<system>/i.test(text);
  const bridge = !extraction.instruction_attempt && !extraction.unmapped.length && extraction.observations.length === 1 && only.state === 'present'
    && marked.length === 1 && !unsupportedQualifier && !overrideAttempt
    && !/\b(no|not|denies|deny|absent|without|cannot|unsure|uncertain|maybe|perhaps|unknown|might|possibly)\b|don't/i.test(text);
  return { schema_version:'medassist.cloud-extraction.v1', extraction,
    suggestion: bridge ? {schema_version:'medassist.extraction.v1',items:[{evidence_id:only.evidence_id,state:'confirmed',value:true}]} : null,
    reason:bridge?'confirm_single_symptom':'clarification_required',provenance:{provider:'groq-cloud',model,evaluation_sha256:evaluationHash,accepted:false} };
}
export function readCloudEnvelope(raw: unknown, text: string): CloudEnvelope | null {
  if (!keys(raw,['schema_version','extraction','suggestion','reason','provenance']) || raw.schema_version !== 'medassist.cloud-extraction.v1'
    || !keys(raw.provenance,['provider','model','evaluation_sha256','accepted']) || raw.provenance.provider !== 'groq-cloud' || raw.provenance.accepted !== false
    || typeof raw.provenance.model !== 'string' || !['openai/gpt-oss-120b','qwen/qwen3.8-27b','openai/gpt-oss-20b'].includes(raw.provenance.model)
    || typeof raw.provenance.evaluation_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(raw.provenance.evaluation_sha256)) return null;
  const parsed = readSparseExtraction(raw.extraction,text); if (!parsed) return null;
  const expected = cloudEnvelope(parsed,text,raw.provenance.model,raw.provenance.evaluation_sha256);
  return JSON.stringify(raw.suggestion) === JSON.stringify(expected.suggestion) && raw.reason === expected.reason ? expected : null;
}
