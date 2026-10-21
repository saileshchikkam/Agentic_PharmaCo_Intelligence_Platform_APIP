import type { RequestHandler } from 'express';
import { trustedLocalRequest } from './local-request';
import type { RuntimeConfig } from './runtime';

export function legacyAccess(config: RuntimeConfig): RequestHandler {
  return (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (config.mode !== 'development' || !config.legacyAgentsEnabled) {
      res.status(404).json({ error: 'EXPERIMENTAL_ROUTES_DISABLED' }); return;
    }
    if (!trustedLocalRequest(req, config.port, true)) { res.status(403).json({ error: 'LOCAL_ONLY' }); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST_REQUIRED' }); return; }
    if (!req.is('application/json')) { res.status(415).json({ error: 'JSON_REQUIRED' }); return; }
    res.setHeader('X-APIP-Experimental', 'true');
    res.setHeader('X-APIP-Clinical-Use', 'prohibited');
    const send = res.json.bind(res);
    res.json = body => send({ ...body, experimentalOnly: true, clinicalUse: false });
    next();
  };
}
