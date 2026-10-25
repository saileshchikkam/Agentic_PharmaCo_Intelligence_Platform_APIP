import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
type Reply = { status: number; body: unknown; retryAfter?: string; extractionMethod?: string };
/** Bounded page-session replay cache, never disk storage. No source text in keys. */
export function naturalIdempotency(): RequestHandler {
  const entries = new Map<string, { fingerprint: string; expires: number; reply: Promise<Reply>; resolve: (r: Reply) => void }>();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return async (req, res, next) => {
    if (req.method !== 'POST' || !['/natural/extract', '/natural/interview'].includes(req.path)) return next();
    const conversation = req.get('X-Conversation-ID'), request = req.get('X-Request-ID');
    if (!conversation && !request) return next(); // Existing authored research clients remain compatible.
    if (!conversation || !request || !uuid.test(conversation) || !uuid.test(request)) { res.status(422).json({ error: 'INVALID_REQUEST_ID' }); return; }
    const now = Date.now();
    for (const [key, entry] of entries) if (entry.expires < now) entries.delete(key);
    const key = `${conversation}:${req.path}:${request}`;
    const fingerprint = createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    const existing = entries.get(key);
    res.setHeader('X-Request-ID', request);
    if (existing) {
      if (existing.fingerprint !== fingerprint) { res.status(409).json({ error: 'REQUEST_ID_CONFLICT' }); return; }
      const reply = await existing.reply;
      res.setHeader('X-Idempotent-Replay', '1');
      if (reply.retryAfter) res.setHeader('Retry-After', reply.retryAfter);
      if (reply.extractionMethod) res.setHeader('X-Extraction-Method', reply.extractionMethod);
      res.status(reply.status).json(reply.body); return;
    }
    if (entries.size >= 128) { res.setHeader('Retry-After', '60'); res.status(429).json({ error: 'RATE_LIMITED', source: 'application_replay_capacity' }); return; }
    let resolve!: (reply: Reply) => void;
    const entry = { fingerprint, expires: now + 600000, reply: new Promise<Reply>(done => { resolve = done; }), resolve: (reply: Reply) => resolve(reply) };
    entries.set(key, entry);
    const timer = setTimeout(() => { entries.delete(key); entry.resolve({ status: 504, body: { error: 'PROVIDER_TIMEOUT' } }); }, 35000);
    const json = res.json.bind(res);
    res.json = body => {
      clearTimeout(timer);
      entry.resolve({ status: res.statusCode, body, retryAfter: res.getHeader('Retry-After')?.toString(), extractionMethod: res.getHeader('X-Extraction-Method')?.toString() });
      if (res.statusCode >= 400) entries.delete(key); // Same logical ID may recover; provider owns cooldown.
      return json(body);
    };
    next();
  };
}
