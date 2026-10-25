/** Operational metadata only. Never infer clinical evidence from an error. */
export const errorCategories = ['RATE_LIMITED', 'QUOTA_EXHAUSTED', 'AUTH_FAILURE', 'PROVIDER_UNAVAILABLE',
  'PROVIDER_TIMEOUT', 'INVALID_STRUCTURED_OUTPUT', 'EVIDENCE_MAPPING_FAILURE', 'EMPTY_MODEL_A_CANDIDATES'] as const;
export type ErrorCategory = typeof errorCategories[number];
export const transient = (category: ErrorCategory) => ['RATE_LIMITED', 'PROVIDER_UNAVAILABLE', 'PROVIDER_TIMEOUT'].includes(category);
export function retryAfterMs(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const seconds = /^\d+(?:\.\d+)?$/.test(value) ? Number(value) * 1000 : Date.parse(value) - now;
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}
export function readErrorCategory(value: unknown): ErrorCategory | null {
  return typeof value === 'string' && errorCategories.includes(value as ErrorCategory) ? value as ErrorCategory : null;
}
export const friendlyError = (category: ErrorCategory) => ({
  RATE_LIMITED: 'The language service is temporarily limited. Your message and accepted answers are kept. Please wait before retrying.',
  QUOTA_EXHAUSTED: 'The language service has reached a usage allowance. Your answers are kept. The operator must restore availability before you retry.',
  AUTH_FAILURE: 'The language service needs an operator configuration check. Your answers are kept; retrying will not fix this.',
  PROVIDER_UNAVAILABLE: 'The language service is unavailable. Your message and accepted answers are kept. You can retry later.',
  PROVIDER_TIMEOUT: 'The language service took too long. Your message and accepted answers are kept. You can retry.',
  INVALID_STRUCTURED_OUTPUT: 'The language service returned an answer that failed validation. Nothing was accepted. You can retry once.',
  EVIDENCE_MAPPING_FAILURE: 'I recognize a supported symptom, but could not validate an answer from this wording. Nothing was accepted. Please clarify once.',
  EMPTY_MODEL_A_CANDIDATES: 'There are no further supported questions. Anything not discussed remains unspecified.'
})[category];

/** Synchronous lock before React state updates; IDs stay stable through retries. */
export class SubmissionLedger {
  conversationId = crypto.randomUUID();
  private records = new Map<string, { id: string; committed: boolean }>();
  private active: string | null = null;
  begin(key: string) {
    if (this.active) return null;
    let record = this.records.get(key);
    if (record?.committed) return null;
    const fresh = !record;
    if (!record) { record = { id: crypto.randomUUID(), committed: false }; this.records.set(key, record); }
    this.active = key;
    return { id: record.id, fresh };
  }
  finish(key: string, commit: boolean, id?: string) {
    const record = this.records.get(key);
    if (id && record?.id !== id) return;
    if (record && commit) record.committed = true;
    if (this.active === key) this.active = null;
  }
  reset() { this.records.clear(); this.active = null; this.conversationId = crypto.randomUUID(); }
}
