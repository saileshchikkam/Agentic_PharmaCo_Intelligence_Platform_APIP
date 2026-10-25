import type { Answer } from '../model-a-research/contracts';

export const entryDefinitions = [
  { evidence_id: 'E_201', label: 'Cough', question_en: 'Do you have a cough?' },
  { evidence_id: 'E_91', label: 'Fever', question_en: 'Do you have a fever (either felt or measured with a thermometer)?' },
  { evidence_id: 'E_97', label: 'Sore throat', question_en: 'Do you have a sore throat?' },
] as const;
export type InitialOption = { evidence_id: string; label: string; question_en: string };
export type Vocabulary = { schema_version: 'model-a.vocabulary.v1'; mode: 'limited_structured_input'; initials: InitialOption[] };
export function readVocabulary(value: unknown): Vocabulary | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).sort().join() !== 'initials,mode,schema_version' || v.schema_version !== 'model-a.vocabulary.v1'
    || v.mode !== 'limited_structured_input' || !Array.isArray(v.initials) || v.initials.length !== 3) return null;
  const initials = v.initials;
  if (!entryDefinitions.every((known, index) => {
    const item = initials[index] as Record<string, unknown>;
    return item && Object.keys(item).sort().join() === 'evidence_id,label,question_en'
      && item.evidence_id === known.evidence_id && item.label === known.label && item.question_en === known.question_en;
  })) return null;
  return v as Vocabulary;
}

export type Mapping = { status: 'candidate'; option: InitialOption } | { status: 'clarify' };
/** Exact phrase grammar only. Negation, multiple symptoms and qualifiers never substring-match. */
export function mapLimitedDescription(text: string, vocabulary: Vocabulary): Mapping {
  if (text.length > 300) return { status: 'clarify' };
  const normalized = text.trim().toLowerCase().replace(/[.!]$/, '').replace(/\s+/g, ' ');
  const option = vocabulary.initials.find(option => [option.label.toLowerCase(), `i have ${option.label.toLowerCase()}`,
    `i have a ${option.label.toLowerCase()}`].includes(normalized));
  return option ? { status: 'candidate', option } : { status: 'clarify' };
}

/** Provider boundary; the global default stays disabled. Local opt-in lives in ollama.ts. */
export interface LanguageProvider {
  readonly schemaVersion: 'medassist.extraction.v1';
  readonly evaluatedModelVersion: string;
  extractCandidates(text: string, signal: AbortSignal): Promise<unknown>;
}
export const languageProvider: LanguageProvider | null = null;
export const futureCapabilities = Object.freeze({ modelB: 'unavailable', precautions: 'unavailable', hospitalNavigation: 'unavailable' });

/** Treat every provider result as untrusted. This first slice accepts one positive initial only. */
export function validateInitialExtraction(raw: unknown, vocabulary: Vocabulary): Answer | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (Object.keys(r).sort().join() !== 'items,schema_version' || r.schema_version !== 'medassist.extraction.v1'
    || !Array.isArray(r.items) || r.items.length !== 1) return null;
  const a = r.items[0];
  if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).sort().join() !== 'evidence_id,state,value'
    || a.state !== 'confirmed' || a.value !== true || !vocabulary.initials.some(o => o.evidence_id === a.evidence_id)) return null;
  return { evidence_id: a.evidence_id, state: 'confirmed', value: true };
}

/** Returns suggestions, never accepted observations or a handoff.
 * Provider output is untrusted even when the separately configured provider is local.
 */
export async function extractInitialSuggestion(provider: LanguageProvider | null, text: string,
  vocabulary: Vocabulary, signal: AbortSignal): Promise<Mapping> {
  if (!provider || signal.aborted || !text.trim() || text.length > 300
    || provider.schemaVersion !== 'medassist.extraction.v1' || !provider.evaluatedModelVersion.trim()) return { status: 'clarify' };
  try {
    const raw = await provider.extractCandidates(text, signal);
    if (signal.aborted) return { status: 'clarify' };
    const validated = validateInitialExtraction(raw, vocabulary);
    const option = validated && vocabulary.initials.find(item => item.evidence_id === validated.evidence_id);
    return option ? { status: 'candidate', option: { ...option } } : { status: 'clarify' };
  } catch { return { status: 'clarify' }; }
}
