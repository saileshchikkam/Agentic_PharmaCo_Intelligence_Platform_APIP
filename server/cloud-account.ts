import express, { type Request, type Express } from 'express';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { configuredProvider, type IntakeProvider } from './adr/provider';
import { probePdf } from './adr/pdf';
import { guidedRouter } from './adr/guided';
import type { GuidedCaseRepository } from './adr/repository';
import { postgresGuidedRepository } from './adr/postgresRepository';

type Principal = { id: string };
type Verify = (token: string) => Promise<Principal | null>;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function registerVerifiedAdr(app: Express, repository: GuidedCaseRepository, verify: Verify, provider: IntakeProvider | null = null, logRequests = false) {
  const router = express.Router();
  const principals = new WeakMap<Request, Principal>();
  async function authenticate(req: Request) {
    const match = /^Bearer ([A-Za-z0-9._-]{1,8192})$/i.exec(req.get('authorization') ?? '');
    const user = match ? await verify(match[1]) : null;
    return user && uuid.test(user.id) ? user : null;
  }
  let inFlight = 0;
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (inFlight >= 24) { res.set('Retry-After', '1').status(429).json({ error: 'ADR_BUSY' }); return; }
    inFlight++;
    const started = Date.now();
    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      inFlight--;
      if (logRequests) console.info(JSON.stringify({ event: 'adr_request',
        status: res.headersSent ? res.statusCode : 0, elapsedMs: Date.now() - started }));
    };
    res.once('finish', release);
    res.once('close', release);
    next();
  });
  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    void authenticate(req).then(user => {
      if (!user) { res.status(401).json({ error: 'SIGN_IN_REQUIRED' }); return; }
      principals.set(req, user);
      next();
    }).catch(() => { res.status(503).json({ error: 'AUTH_UNAVAILABLE' }); });
  });
  router.use(express.json({ limit: '24kb' }));
  router.use(guidedRouter(repository, req => principals.get(req), provider,
    async (req, owner) => (await authenticate(req))?.id === owner));
  router.use((error: { status?: number }, _req: Request, res: express.Response, _next: express.NextFunction) => {
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 503;
    res.status(status).json({ error: status === 503 ? 'ADR_UNAVAILABLE' : 'INVALID_REQUEST' });
  });
  app.use('/api/account/adr-guided', router);
}

export function configuredCloudAccount(app: Express, env = process.env) {
  const { APIP_SUPABASE_URL: url, APIP_SUPABASE_PUBLISHABLE_KEY: key, APIP_ADR_DATABASE_URL: db } = env;
  const mode = env.APIP_ACCOUNT_MODE;
  if (mode && !['cloud', 'local', 'disabled'].includes(mode)) throw Error('Invalid account mode.');
  if (mode === 'local' || mode === 'disabled') {
    if (url || key || db) throw Error('Cloud settings conflict with account mode.');
    return null;
  }
  if (!url && !key && !db && mode !== 'cloud') return null;
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
  let dbUrl: URL;
  try { dbUrl = new URL(db); } catch { throw Error('Invalid ADR database URL.'); }
  if (!['postgres:', 'postgresql:'].includes(dbUrl.protocol) || !dbUrl.hostname) throw Error('Invalid ADR database URL.');
  const poolSize = env.APIP_ADR_POOL_SIZE ?? '3';
  if (!/^[1-8]$/.test(poolSize)) throw Error('Invalid ADR pool size.');
  // The CommonJS bundle receives the ESM driver's namespace through require().
  const createPostgres = typeof postgres === 'function'
    ? postgres : (postgres as unknown as { default: typeof postgres }).default;
  const sql = createPostgres(db, { max: Number(poolSize), prepare: false, connect_timeout: 5, idle_timeout: 20,
    ssl: { rejectUnauthorized: true } });
  registerVerifiedAdr(app, postgresGuidedRepository(sql), async token => {
    const { data, error } = await sdk.auth.getUser(token);
    if (error) {
      if (error.status === 400 || error.status === 401 || error.status === 403) return null;
      throw Error('AUTH_UNAVAILABLE');
    }
    return data.user && !data.user.is_anonymous ? { id: data.user.id } : null;
  }, configuredProvider(env) ?? null, env.APIP_ADR_LOG_REQUESTS === '1');
  let readiness: { expires: number; check: Promise<{ database: boolean; pdf: boolean; auth: boolean }> } | undefined;
  app.get('/api/ready', async (_req, res) => {
    if (!readiness || readiness.expires < Date.now()) {
      const database = sql`select
        has_function_privilege(current_user, 'apip_adr.find_command_receipt(uuid,integer,uuid,text,text)', 'EXECUTE')
        and has_function_privilege(current_user, 'apip_adr.append_revision(uuid,integer,uuid,text,text,jsonb)', 'EXECUTE')
        and has_function_privilege(current_user, 'apip_adr.record_pdf_export(uuid,integer,uuid,text,text,integer)', 'EXECUTE') as ready`;
      const check = Promise.all([
        Promise.race([database.then(rows => rows[0]?.ready === true, () => false),
          new Promise<boolean>(resolve => { const timer = setTimeout(() => { void database.cancel(); resolve(false); }, 4000);
            void database.then(() => clearTimeout(timer), () => clearTimeout(timer)); })]),
        probePdf(),
        fetch(endpoint.origin + '/auth/v1/health', { headers: { apikey: key },
          signal: AbortSignal.timeout(4000) }).then(response => response.ok, () => false),
      ]).then(([database, pdf, auth]) => ({ database, pdf, auth }));
      readiness = { expires: Date.now() + 10000, check };
    }
    const checks = await readiness.check;
    const ready = checks.database && checks.pdf && checks.auth;
    res.set('Cache-Control', 'no-store').status(ready ? 200 : 503).json({ ready, checks });
  });
  return { close: () => sql.end({ timeout: 2 }) };
}
