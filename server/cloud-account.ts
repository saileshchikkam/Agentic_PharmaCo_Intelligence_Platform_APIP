import express, { type Request, type Express } from 'express';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { guidedRouter } from './adr/guided';
import type { GuidedCaseRepository } from './adr/repository';
import { postgresGuidedRepository } from './adr/postgresRepository';

type Principal = { id: string };
type Verify = (token: string) => Promise<Principal | null>;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function registerVerifiedAdr(app: Express, repository: GuidedCaseRepository, verify: Verify) {
  const router = express.Router();
  const principals = new WeakMap<Request, Principal>();
  async function authenticate(req: Request) {
    const match = /^Bearer ([A-Za-z0-9._-]{1,8192})$/i.exec(req.get('authorization') ?? '');
    const user = match ? await verify(match[1]) : null;
    return user && uuid.test(user.id) ? user : null;
  }
  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    void authenticate(req).then(user => {
      if (!user) { res.status(401).json({ error: 'SIGN_IN_REQUIRED' }); return; }
      principals.set(req, user);
      next();
    }).catch(() => { res.status(503).json({ error: 'AUTH_UNAVAILABLE' }); });
  });
  router.use(express.json({ limit: '24kb' }));
  router.use(guidedRouter(repository, req => principals.get(req), null,
    async (req, owner) => (await authenticate(req))?.id === owner));
  router.use((error: { status?: number }, _req: Request, res: express.Response, _next: express.NextFunction) => {
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 503;
    res.status(status).json({ error: status === 503 ? 'ADR_UNAVAILABLE' : 'INVALID_REQUEST' });
  });
  app.use('/api/account/adr-guided', router);
}

export function configuredCloudAccount(app: Express, env = process.env) {
  const { APIP_SUPABASE_URL: url, APIP_SUPABASE_PUBLISHABLE_KEY: key, APIP_ADR_DATABASE_URL: db } = env;
  if (!url && !key && !db) return null;
  if (!url || !key?.startsWith('sb_publishable_') || !db) throw Error('Cloud account configuration is incomplete.');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password
      || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) throw Error('Invalid Supabase Auth origin.');
  const sdk = createClient(endpoint.origin, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init, signal: AbortSignal.any([AbortSignal.timeout(5000), ...(init?.signal ? [init.signal] : [])]),
    }) },
  });
  const sql = postgres(db, { max: 3, prepare: false, connect_timeout: 5, idle_timeout: 20,
    ssl: { rejectUnauthorized: true } });
  registerVerifiedAdr(app, postgresGuidedRepository(sql), async token => {
    const { data, error } = await sdk.auth.getUser(token);
    if (error) {
      if (error.status === 400 || error.status === 401 || error.status === 403) return null;
      throw Error('AUTH_UNAVAILABLE');
    }
    return data.user && !data.user.is_anonymous ? { id: data.user.id } : null;
  });
  return { close: () => sql.end({ timeout: 2 }) };
}
