import express, { type Express } from 'express';
import type { RuntimeConfig } from './runtime';
import { trustedLocalRequest } from './local-request';
import { evaluateStatement } from '../src/features/medassist-safety/safety';
import { navigationHandoff } from '../src/features/medassist-safety/navigation';

/** Available independently of Model A/Groq tokens, only in the existing guarded local demo. */
export function registerSafetyNavigation(app: Express, config: RuntimeConfig) {
  const prefix = '/api/research/medassist';
  if (config.mode !== 'development') { app.use(prefix, (_req, res) => { res.sendStatus(404); }); return; }
  const router = express.Router();
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!trustedLocalRequest(req, config.port, true)) { res.status(403).json({ error: 'LOCAL_DEMO_ONLY' }); return; }
    if (req.method !== 'POST') { res.sendStatus(405); return; }
    if (!req.is('application/json')) { res.sendStatus(415); return; }
    next();
  });
  const parser = express.json({ limit: '4kb', strict: true });
  router.use((req, res, next) => parser(req, res, error => error ? res.status(400).json({ error: 'INVALID_INPUT' }) : next()));
  router.post('/safety', (req, res) => {
    const r = req.body;
    if (!r || Object.keys(r).sort().join() !== 'schema_version,text' || r.schema_version !== 'medassist.safety-request.v1'
      || typeof r.text !== 'string' || r.text.length > 300) { res.status(422).json({ error: 'INVALID_INPUT' }); return; }
    res.json(evaluateStatement(r.text));
  });
  router.post('/navigation/:kind', (req, res) => {
    if (!['hospital','emergency'].includes(req.params.kind)) { res.sendStatus(404); return; }
    const result = navigationHandoff(req.body, req.params.kind === 'emergency');
    if (!result) { res.status(422).json({ error: 'LOCATION_CONSENT_REQUIRED' }); return; }
    res.json(result);
  });
  router.use((_req, res) => { res.sendStatus(404); });
  app.use(prefix, router);
}
