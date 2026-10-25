import express, { type Express } from 'express';
import type { RuntimeConfig } from './runtime';
import { trustedLocalRequest } from './local-request';
import { readDemoResult, readFixtures, readRequest } from '../src/features/model-a-research/contracts';
import { readVocabulary } from '../src/features/medassist-conversation/language';
import { createMedGemmaExtractor } from './medgemma';
import { createGroqExtractor } from './groq-extraction';
import { GroqProvider } from './medassist-ai';
import { evaluateStatement } from '../src/features/medassist-safety/safety';
import { readNaturalRequest, readNaturalResult, readNaturalVocabulary, anchors, type NaturalVocabulary } from '../src/features/medassist-conversation/natural';
import { registerSafetyNavigation } from './medassist-safety';
import { naturalIdempotency } from './medassist-idempotency';
import { readErrorCategory } from '../src/features/medassist-conversation/reliability';
import { understand, constrainContext } from '../src/features/medassist-conversation/understanding';
const prefix = '/api/research/model-a';
const adapter = 'http://127.0.0.1:8766/research/model-a/v1/demo';
export function registerModelADemo(app: Express, config: RuntimeConfig, { enabled = process.env.APIP_ENABLE_MODEL_A_DEMO === '1', token = process.env.MEDASSIST_A_TOKEN ?? '', fetchImpl = fetch, timeoutMs = 15000, cloudFactory = createGroqExtractor, }: {
    enabled?: boolean;
    token?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    cloudFactory?: typeof createGroqExtractor;
} = {}) {
    registerSafetyNavigation(app, config);
    if (config.mode !== 'development' || !enabled || token.length < 32 || token.length > 256) {
        app.use(prefix, (_req, res) => { res.status(404).json({ error: 'RESEARCH_DEMO_DISABLED' }); });
        return;
    }
    const router = express.Router();
    router.use((req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (!trustedLocalRequest(req, config.port, req.method !== 'GET')) {
            res.status(403).json({ error: 'LOCAL_DEMO_ONLY' });
            return;
        }
        next();
    });
    const parser = express.json({ limit: '64kb', strict: true });
    router.use((req, res, next) => {
        if (req.method === 'POST' && !req.is('application/json')) {
            res.status(415).json({ error: 'JSON_REQUIRED' });
            return;
        }
        parser(req, res, error => error ? res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'INVALID_DEMO_REQUEST' }) : next());
    });
    router.use(naturalIdempotency());
    let language: ReturnType<typeof createMedGemmaExtractor> | ReturnType<typeof createGroqExtractor> | GroqProvider | null = null;
    try {
        if (process.env.APIP_ENABLE_GROQ_MODEL_A === '1')
            language = process.env.APIP_ENABLE_MODULAR_MEDASSIST === '1'
                ? new GroqProvider(cloudFactory) : cloudFactory();
        else if (process.env.APIP_ENABLE_MEDGEMMA === '1')
            language = createMedGemmaExtractor();
    }
    catch { /* No provider fallback on failed explicit cloud qualification/configuration. */ }
    router.get('/language', (_req, res) => res.json({ schema_version: 'medassist.language-status.v2', configured: !!language,
        provider: language && 'provider' in language ? language.provider : 'ollama-local',
        model: language?.model ?? null, timeout_ms: language?.timeoutMs ?? null }));
    // Guarded development diagnostics: no prompt, symptom text, credentials or provider error bodies.
    router.get('/language/diagnostics', (_req, res) => res.json(language && 'diagnostics' in language
        ? language.diagnostics : { available: false, historical_status_unavailable: true }));
    router.post('/extract', async (req, res) => {
        const body = req.body;
        if (!body || Object.keys(body).sort().join() !== 'fictional_only,schema_version,text'
            || body.schema_version !== 'medassist.extract-request.v1' || body.fictional_only !== true
            || typeof body.text !== 'string' || body.text.length > 300) {
            res.status(422).json({ error: 'INVALID_EXTRACTION_INPUT' });
            return;
        }
        const safety = evaluateStatement(body.text);
        if (safety.status === 'escalate') {
            res.status(409).json({ error: 'SAFETY_ESCALATION', safety });
            return;
        }
        if (!language) {
            res.status(503).json({ error: 'LOCAL_LANGUAGE_DISABLED' });
            return;
        }
        // No candidate passed: avoid spending generation time on an unusable proposal.
        // The existing chat requests explicit structured clarification; no fallback facts.
        if (!language.qualified) {
            res.status(422).json({ error: 'LOCAL_LANGUAGE_NOT_QUALIFIED' });
            return;
        }
        const controller = new AbortController();
        const cancel = () => { if (!res.writableEnded)
            controller.abort(); };
        res.on('close', cancel);
        try {
            const result = await language.extract(body.text, controller.signal);
            if (!res.destroyed)
                res.json(result.envelope);
        }
        catch (error) {
            const busy = error instanceof Error && error.message === 'MODEL_BUSY';
            const timeout = error instanceof Error && error.message === 'MODEL_TIMEOUT_OR_CANCELLED';
            if (!res.destroyed)
                res.status(busy ? 429 : timeout ? 504 : 503).json({ error: busy ? 'LOCAL_LANGUAGE_BUSY' : timeout ? 'LOCAL_LANGUAGE_TIMEOUT' : 'LOCAL_LANGUAGE_UNAVAILABLE_OR_REJECTED' });
        }
        finally {
            res.off('close', cancel);
        }
    });
    let naturalVocabulary: NaturalVocabulary | null = null;
    router.post('/natural/extract', async (req, res) => {
        const b = req.body;
        const v2=b?.schema_version==='medassist.natural-extract-request.v2';
        if (!b || Object.keys(b).sort().join() !== (v2?'fictional_only,prior_context,question_id,schema_version,text':'fictional_only,question_id,schema_version,text')
            || !['medassist.natural-extract-request.v1','medassist.natural-extract-request.v2'].includes(b.schema_version) || b.fictional_only !== true
            || v2&&(!Array.isArray(b.prior_context)||b.prior_context.length>12||!b.prior_context.every((s:unknown)=>typeof s==='string'&&s.length<=300))
            || typeof b.text !== 'string' || !b.text.trim() || b.text.length > 300 || !(b.question_id === null || typeof b.question_id === 'string' && /^E_\d{1,3}$/.test(b.question_id))) {
            res.status(422).json({ error: 'INVALID_EXTRACTION_INPUT' });
            return;
        }
        const safety = evaluateStatement(b.text);
        if (safety.status === 'escalate') {
            res.status(409).json({ error: 'SAFETY_ESCALATION', safety });
            return;
        }
        if (!naturalVocabulary) {
            res.status(503).json({ error: 'PROVIDER_UNAVAILABLE' });
            return;
        }
        const d = naturalVocabulary.items.find(d => d.evidence_id === b.question_id);
        if (b.question_id !== null && !d) {
            res.status(422).json({ error: 'INVALID_QUESTION' });
            return;
        }
        const pending = d ? { evidence_id: d.evidence_id, question_en: d.question_en, data_type: d.data_type, possible_values: d.possible_values, allows_unknown: true as const, unknown_value: null } : null;
        const prior=v2?b.prior_context:[], analysis=understand(b.text,naturalVocabulary,pending,prior);
        if(analysis.complete){res.setHeader('X-Extraction-Method','deterministic.v1');res.json(analysis.proposal);return;}
        if (!language || !('extractNatural' in language) || !language.qualified) {res.status(503).json({error:'PROVIDER_UNAVAILABLE'});return;}
        const controller = new AbortController();
        const cancel = () => { if (!req.get('X-Request-ID') && !res.writableEnded)
            controller.abort(); };
        res.on('close', cancel);
        try {
            const proposal = await language.extractNatural(b.text, naturalVocabulary, pending, controller.signal, req.get('X-Request-ID'), prior);
            const checked=constrainContext(proposal,b.text,naturalVocabulary,pending,prior);
            if(!checked){res.status(422).json({error:'EVIDENCE_MAPPING_FAILURE'});return;}
            if(!checked.observations.length && !checked.unmapped.length && !checked.instruction_attempt && Object.values(anchors).some(a=>a.pattern.test(b.text))){res.status(422).json({error:'EVIDENCE_MAPPING_FAILURE'});return;}
            res.setHeader('X-Extraction-Method','groq_validated.v1');res.json(checked);
        }
        catch (e) {
            const problem = e as { category?: string; source?: string; retryAfterMs?: number };
            const category = readErrorCategory(problem.category) ?? 'PROVIDER_UNAVAILABLE';
            if (problem.retryAfterMs && problem.retryAfterMs > 0) res.setHeader('Retry-After', String(Math.ceil(problem.retryAfterMs / 1000)));
            res.status(category === 'RATE_LIMITED' || category === 'QUOTA_EXHAUSTED' ? 429 : category === 'AUTH_FAILURE' ? 503
                : category === 'PROVIDER_TIMEOUT' ? 504 : category === 'INVALID_STRUCTURED_OUTPUT' ? 502 : 503).json({ error: category,
                    source: ['groq', 'application_minute_cap', 'application_session_allowance', 'application_concurrency', 'application_validation', 'application_deadline', 'network'].includes(problem.source ?? '') ? problem.source : 'application' });
        }
        finally {
            res.off('close', cancel);
        }
    });
    let active = false;
    router.all(['/fixtures', '/vocabulary', '/interview', '/natural/vocabulary', '/natural/interview'], async (req, res) => {
        const fixtures = req.path === '/fixtures' && req.method === 'GET';
        const vocabulary = req.path === '/vocabulary' && req.method === 'GET';
        const natural = req.path.startsWith('/natural/');
        const naturalVocab = natural && req.path.endsWith('/vocabulary') && req.method === 'GET';
        const readOnly = fixtures || vocabulary || naturalVocab;
        if (!readOnly && !((req.path === '/interview' || req.path === '/natural/interview') && req.method === 'POST')) {
            res.sendStatus(405);
            return;
        }
        const body = readOnly ? null : natural ? readNaturalRequest(req.body) : readRequest(req.body);
        if (!readOnly && !body) {
            res.status(422).json({ error: 'INVALID_DEMO_REQUEST' });
            return;
        }
        // React StrictMode can overlap initial fixture reads. Only inference needs a slot.
        if (!readOnly && active) {
            res.status(429).json({ error: 'DEMO_BUSY' });
            return;
        }
        if (!readOnly)
            active = true;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const cancel = () => { if (!req.get('X-Request-ID') && !res.writableEnded)
            controller.abort(); };
        res.on('close', cancel);
        try {
            const upstream = await fetchImpl(`${adapter}/${natural ? 'natural/' + (naturalVocab ? 'vocabulary' : 'interview') : fixtures ? 'fixtures' : vocabulary ? 'vocabulary' : 'interview'}`, {
                method: readOnly ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: readOnly ? undefined : JSON.stringify(body), signal: controller.signal, redirect: 'error',
            });
            if (!upstream.ok) {
                res.status(upstream.status === 422 ? 422 : 503).json({ error: 'ADAPTER_UNAVAILABLE_OR_REJECTED' });
                return;
            }
            // Bound streaming bytes before JSON allocation; do not forward arbitrary backend errors/headers.
            const reader = upstream.body?.getReader();
            if (!reader)
                throw new Error('invalid_response');
            const chunks: Uint8Array[] = [];
            let size = 0;
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                size += value.byteLength;
                if (size > 262144) {
                    await reader.cancel();
                    throw new Error('response_too_large');
                }
                chunks.push(value);
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw.includes(token))
                throw new Error('invalid_response');
            const parsed: unknown = JSON.parse(raw);
            const accepted = natural ? naturalVocab ? readNaturalVocabulary(parsed) : readNaturalResult(parsed) : fixtures ? readFixtures(parsed) : vocabulary ? readVocabulary(parsed) : readDemoResult(parsed);
            if (naturalVocab && accepted)
                naturalVocabulary = accepted as NaturalVocabulary;
            if (!accepted)
                throw new Error('invalid_response');
            if (natural && !naturalVocab && 'result' in accepted && accepted.result.selection.reason === 'no_eligible_questions')
                res.setHeader('X-Outcome-Category', 'EMPTY_MODEL_A_CANDIDATES');
            res.json(accepted);
        }
        catch {
            res.status(controller.signal.aborted ? 504 : 502).json({ error: controller.signal.aborted ? 'ADAPTER_TIMEOUT' : 'INVALID_ADAPTER_RESPONSE' });
        }
        finally {
            clearTimeout(timer);
            res.off('close', cancel);
            if (!readOnly)
                active = false;
        }
    });
    router.use((_req, res) => { res.sendStatus(404); });
    app.use(prefix, router);
}
