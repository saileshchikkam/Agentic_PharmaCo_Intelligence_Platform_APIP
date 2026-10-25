import { readExtractionEnvelope, type ExtractionEnvelope } from '../medassist-intelligence/medgemma';
import type { LanguageProvider } from './language';
import { readCloudEnvelope, type CloudEnvelope } from '../medassist-intelligence/cloud-extraction';

/** Browser talks only to the guarded same-origin server; no key or direct cloud call. */
export class ValidatedLanguageProvider implements LanguageProvider {
  readonly schemaVersion = 'medassist.extraction.v1' as const;
  lastExtraction: ExtractionEnvelope | CloudEnvelope | null = null;
  constructor(readonly evaluatedModelVersion: string, readonly timeoutMs: number, readonly provider: 'ollama-local' | 'groq-cloud' = 'ollama-local') {}
  async extractCandidates(text: string, signal: AbortSignal): Promise<unknown> {
    this.lastExtraction = null;
    const controller = new AbortController(); const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel, { once: true }); if (signal.aborted) cancel();
    const timer = setTimeout(cancel, this.timeoutMs + 3000);
    try {
      const response = await fetch('/api/research/model-a/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', cache: 'no-store', signal: controller.signal,
        body: JSON.stringify({ schema_version: 'medassist.extract-request.v1', fictional_only: true, text }) });
      if (!response.ok) throw new Error('LOCAL_LANGUAGE_UNAVAILABLE');
      const raw = await response.json();
      const accepted = this.provider === 'groq-cloud' ? readCloudEnvelope(raw,text) : readExtractionEnvelope(raw,text);
      if (!accepted || accepted.provenance.model !== this.evaluatedModelVersion || controller.signal.aborted) throw new Error('INVALID_LOCAL_EXTRACTION');
      this.lastExtraction = accepted;
      return accepted.suggestion;
    } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
  }
}
export { ValidatedLanguageProvider as LocalOllamaProvider };

export function readLanguageStatus(raw: unknown): { model: string; timeoutMs: number; provider: 'ollama-local' | 'groq-cloud' } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const provider = r.schema_version === 'medassist.language-status.v1' ? 'ollama-local' : r.provider;
  return ['medassist.language-status.v1','medassist.language-status.v2'].includes(r.schema_version as string) && r.configured === true
    && ['ollama-local','groq-cloud'].includes(provider as string)
    && typeof r.model === 'string' && /^[a-zA-Z0-9_.:/-]{1,100}$/.test(r.model)
    && typeof r.timeout_ms === 'number' && Number.isInteger(r.timeout_ms) && r.timeout_ms >= 1000 && r.timeout_ms <= 90000
    ? { model: r.model, timeoutMs: r.timeout_ms, provider: provider as 'ollama-local' | 'groq-cloud' } : null;
}
