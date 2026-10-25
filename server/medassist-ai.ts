/** Existing guarded Express boundary; no second service or cloud client. */
import { performance } from 'node:perf_hooks';
import { createGroqExtractor } from './groq-extraction';
export const selectedGroqModel = 'qwen/qwen3.8-27b';
export interface ConversationalProvider {
    readonly model: string;
    readonly provider: 'groq-cloud';
    readonly qualified: boolean;
    readonly timeoutMs: number;
    extract(text: string, signal?: AbortSignal): ReturnType<ReturnType<typeof createGroqExtractor>['extract']>;
}
export class GroqProvider implements ConversationalProvider {
    private readonly delegate: ReturnType<typeof createGroqExtractor>;
    private requests = 0;
    private failures = 0;
    private latencyMs: number | null = null;
    constructor(factory = createGroqExtractor) {
        this.delegate = factory();
        if (this.delegate.model !== selectedGroqModel || !this.delegate.qualified)
            throw Error('SELECTED_GROQ_MODEL_REQUIRED');
    }
    get model() { return this.delegate.model; }
    get provider() { return this.delegate.provider; }
    get qualified() { return this.delegate.qualified; }
    get timeoutMs() { return this.delegate.timeoutMs; }
    get diagnostics() { return this.delegate.diagnostics; }
    get metrics() {
        return { model: this.model, requests: this.requests, failures: this.failures, last_latency_ms: this.latencyMs,
            rate_limits: this.delegate.rateLimits };
    }
    async extractNatural(...args: Parameters<ReturnType<typeof createGroqExtractor>['extractNatural']>) {
        const at = performance.now(); this.requests++;
        try { return await this.delegate.extractNatural(...args); }
        catch (error) { this.failures++; throw error; }
        finally { this.latencyMs = Math.round((performance.now() - at) * 1000) / 1000; }
    }
    async extract(text: string, signal?: AbortSignal) {
        if (typeof text !== 'string' || !text.trim() || text.length > 300)
            throw Error('INVALID_EXTRACTION_INPUT');
        const at = performance.now();
        this.requests++;
        try {
            return await this.delegate.extract(text, signal);
        }
        catch (e) {
            this.failures++;
            throw e;
        }
        finally {
            this.latencyMs = Math.round((performance.now() - at) * 1000) / 1000;
        }
    }
}
