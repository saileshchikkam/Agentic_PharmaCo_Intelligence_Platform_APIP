import { entryDefinitions } from '../medassist-conversation/language';

export type ExtractedItem = { evidence_id: string; state: 'confirmed' | 'unknown' | 'contradiction'; value: boolean | null; quote: string };
export type LocalExtraction = { schema_version: 'medassist.extraction.eval.v1'; status: 'proposed' | 'clarify' | 'abstain'; items: ExtractedItem[]; issues: string[] };
export type ExtractionEnvelope = { schema_version: 'medassist.local-extraction.v1'; extraction: LocalExtraction;
  suggestion: { schema_version: 'medassist.extraction.v1'; items: { evidence_id: string; state: 'confirmed'; value: true }[] } | null;
  reason: 'confirm_single_symptom' | 'clarification_required'; provenance: { provider: 'ollama-local'; model: string; digest: string; accepted: false } };
const issues = ['ambiguous', 'missing', 'unsupported', 'duration_unsupported', 'invalid_value', 'prompt_injection', 'conflict'];
const literalSymptoms: Record<string, RegExp> = { E_201: /\bcough(?:ing)?\b/i, E_91: /\bfever\b/i, E_97: /\bsore throat\b|throat is sore/i };
const uncertainOrAbsent = /\b(no|not|deny|denies|without|absent|maybe|unsure|perhaps|unknown|uncertain)\b|don't|do not/i;
const uncertain = /\b(not sure|do not know|don't know|maybe|unsure|perhaps|unknown|uncertain|possibly|might)\b/i;
const explicitAbsence = /\b(no|not|deny|denies|without|absent)\b|don't/i;
const keys = (v: unknown, fields: string[]): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).sort().join() === [...fields].sort().join();

export const extractionSchema = { type: 'object', additionalProperties: false,
  required: ['schema_version', 'status', 'items', 'issues'], properties: {
    schema_version: { const: 'medassist.extraction.eval.v1' }, status: { enum: ['proposed', 'clarify', 'abstain'] },
    issues: { type: 'array', uniqueItems: true, items: { enum: issues } }, items: { type: 'array', maxItems: 3, items: {
      type: 'object', additionalProperties: false, required: ['evidence_id', 'state', 'value', 'quote'], properties: {
        evidence_id: { enum: entryDefinitions.map(d => d.evidence_id) }, state: { enum: ['confirmed', 'unknown', 'contradiction'] },
        value: { type: ['boolean', 'null'] }, quote: { type: 'string', minLength: 1, maxLength: 300 },
      },
    } },
  },
};

/** Suggestions only: no automatic evidence merge, demographic inference or generated questions. */
export function readLocalExtraction(raw: unknown, text: string): LocalExtraction | null {
  if (!keys(raw, ['schema_version', 'status', 'items', 'issues']) || raw.schema_version !== 'medassist.extraction.eval.v1'
    || !['proposed', 'clarify', 'abstain'].includes(raw.status as string) || !Array.isArray(raw.items) || raw.items.length > 3
    || !Array.isArray(raw.issues) || !raw.issues.every(i => issues.includes(i)) || new Set(raw.issues).size !== raw.issues.length) return null;
  if (raw.status === 'abstain' && raw.items.length || raw.status === 'proposed' && (!raw.items.length || raw.issues.length)) return null;
  const seen = new Set();
  for (const item of raw.items) {
    if (!keys(item, ['evidence_id', 'state', 'value', 'quote']) || !entryDefinitions.some(d => d.evidence_id === item.evidence_id)
      || seen.has(item.evidence_id) || !['confirmed', 'unknown', 'contradiction'].includes(item.state as string)
      || typeof item.quote !== 'string' || !item.quote.trim() || item.quote.length > 300 || !text.includes(item.quote)
      || (item.state === 'confirmed' ? typeof item.value !== 'boolean' : item.value !== null || raw.status !== 'clarify')) return null;
    // Require literal support for this specific ID, not merely an arbitrary copied span.
    if (!literalSymptoms[item.evidence_id as string].test(item.quote)
      || item.state === 'confirmed' && uncertain.test(item.quote)
      || item.state === 'confirmed' && item.value === true && uncertainOrAbsent.test(item.quote)
      || item.state === 'confirmed' && item.value === false && !explicitAbsence.test(item.quote)) return null;
    seen.add(item.evidence_id);
  }
  // Conservative bridge guards: model span-copying alone cannot establish polarity or completeness.
  if (/\b(ignore|instructions|prescribe|diagnose|token|schema)\b|<system>/i.test(text) && raw.status !== 'abstain') return null;
  if (/\b(days?|hours?|weeks?|yesterday|since)\b|\bfor\s+\d/i.test(text)
    && !(raw.status === 'clarify' && raw.items.length === 0 && raw.issues.includes('duration_unsupported'))) return null;
  if (raw.status === 'proposed' && raw.items.length === 1 && raw.items[0].value === true) {
    if (uncertainOrAbsent.test(text)) return null;
    const mentioned = [/\bcough(?:ing)?\b/i, /\bfever\b/i, /\bsore throat\b|throat is sore/i].filter(pattern => pattern.test(text));
    if (mentioned.length > 1) return null;
  }
  return raw as LocalExtraction;
}

export function makeEnvelope(extraction: LocalExtraction, model: string, digest: string, allowSuggestion = true): ExtractionEnvelope {
  const only = extraction.items[0];
  const bridge = allowSuggestion && extraction.status === 'proposed' && !extraction.issues.length && extraction.items.length === 1 && only.state === 'confirmed' && only.value === true;
  return { schema_version: 'medassist.local-extraction.v1', extraction,
    suggestion: bridge ? { schema_version: 'medassist.extraction.v1', items: [{ evidence_id: only.evidence_id, state: 'confirmed', value: true }] } : null,
    reason: bridge ? 'confirm_single_symptom' : 'clarification_required', provenance: { provider: 'ollama-local', model, digest, accepted: false } };
}

export function readExtractionEnvelope(raw: unknown, text: string): ExtractionEnvelope | null {
  if (!keys(raw, ['schema_version', 'extraction', 'suggestion', 'reason', 'provenance']) || raw.schema_version !== 'medassist.local-extraction.v1'
    || !keys(raw.provenance, ['provider', 'model', 'digest', 'accepted']) || raw.provenance.provider !== 'ollama-local' || raw.provenance.accepted !== false
    || typeof raw.provenance.model !== 'string' || !/^[a-zA-Z0-9_.:/-]{1,100}$/.test(raw.provenance.model)
    || typeof raw.provenance.digest !== 'string' || !/^[a-f0-9]{64}$/.test(raw.provenance.digest)) return null;
  const extraction = readLocalExtraction(raw.extraction, text);
  if (!extraction) return null;
  const expected = makeEnvelope(extraction, raw.provenance.model, raw.provenance.digest);
  // Server qualification may withhold a proposal; the client may never upgrade one.
  if (raw.suggestion === null && raw.reason === 'clarification_required') return { ...expected, suggestion: null, reason: 'clarification_required' };
  return JSON.stringify(raw.suggestion) === JSON.stringify(expected.suggestion) && raw.reason === expected.reason ? expected : null;
}
