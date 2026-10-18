import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { emptyProfile, historyFields, validateProfile, type ProfileInput } from '../src/features/account/profile';
import { isDraftId, validateDraftCommand } from '../src/features/adr/accountDraft';
import type { AdrDraft } from '../src/features/adr/draftStorage';

const cookieName = 'apip.local.session';
const lifetime = 8 * 60 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const hashPassword = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) =>
  scrypt(password, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key)));

export function defaultAccountFile() {
  return process.env.APIP_LOCAL_DB_PATH || join(process.env.LOCALAPPDATA || join(homedir(), '.local', 'share'), 'APIP', 'accounts.sqlite');
}

function readProfileInput(value: unknown): ProfileInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const keys = Object.keys(emptyProfile());
  if (Object.keys(item).length !== keys.length || !keys.every(key => Object.hasOwn(item, key))) return null;
  if (typeof item.display_name !== 'string' || typeof item.birth_date !== 'string'
    || typeof item.relationship !== 'string' || typeof item.share_medassist !== 'boolean' || typeof item.share_adr !== 'boolean') return null;
  if (!historyFields.every(key => item[key] === null || (typeof item[key] === 'string' && item[key].length <= 2000 && item[key].trim().length > 0))) return null;
  const profile = item as unknown as ProfileInput;
  return validateProfile(profile) ? null : profile;
}

/** Local development only. Never enable these cookie/password routes on a public deployment. */
export function registerLocalAccount(app: Express, {
  file = defaultAccountFile(), now = Date.now, originPort = 3000,
}: { file?: string; now?: () => number; originPort?: number } = {}) {
  if (process.env.NODE_ENV === 'production') throw new Error('Local account service is development-only');
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  if (Number(db.prepare('PRAGMA user_version').get()?.user_version) > 2) {
    db.close(); throw new Error('Local account schema is newer than this application');
  }
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS local_sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS local_sessions_user ON local_sessions(user_id);
    CREATE TABLE IF NOT EXISTS local_profiles (
      user_id TEXT PRIMARY KEY REFERENCES local_users(id) ON DELETE CASCADE,
      payload TEXT NOT NULL CHECK(json_valid(payload)), revision INTEGER NOT NULL CHECK(revision > 0),
      updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS local_adr_drafts (
      user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
      id TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)),
      revision INTEGER NOT NULL CHECK(revision > 0), updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, id)
    ) STRICT;
    PRAGMA user_version=2;`);
  const router = express.Router();
  const allowedOrigins = [`http://localhost:${originPort}`, `http://127.0.0.1:${originPort}`, `http://[::1]:${originPort}`];
  const fail = (res: Response, status: number, error: string) => res.status(status).json({ error });
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
    const hostAllowed = allowedOrigins.some(value => new URL(value).host === req.get('host'));
    const origin = req.get('origin');
    if (!loopback || !hostAllowed || (origin && !allowedOrigins.includes(origin))) return void fail(res, 403, 'LOCAL_ONLY');
    if (req.method !== 'GET' && (!origin || !allowedOrigins.includes(origin))) return void fail(res, 403, 'ORIGIN_REQUIRED');
    if (req.method !== 'GET' && !req.is('application/json')) return void fail(res, 415, 'JSON_REQUIRED');
    next();
  });
  router.use(express.json({ limit: '24kb' }));
  const readUser = (req: Request) => {
    const token = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    return db.prepare(`SELECT u.id, u.email FROM local_sessions s JOIN local_users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.expires_at>?`).get(digest(token), now()) as { id: string; email: string } | undefined;
  };
  const session = (res: Response, id: string) => {
    const token = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM local_sessions WHERE expires_at<=?').run(now());
    db.prepare('INSERT INTO local_sessions VALUES (?, ?, ?)').run(digest(token), id, now() + lifetime);
    res.cookie(cookieName, token, { httpOnly: true, sameSite: 'strict', path: '/api/account', maxAge: lifetime });
  };
  // Bound CPU/memory work; limits are process-local and reset when development restarts.
  let activeHashes = 0;
  let attempts: number[] = [];
  const rateLimit = (_req: Request, res: Response, next: NextFunction) => {
    attempts = attempts.filter(t => now() - t < 15 * 60 * 1000);
    if (attempts.length >= 30 || activeHashes >= 2) { res.setHeader('Retry-After', '60'); return void fail(res, 429, 'TRY_LATER'); }
    attempts.push(now()); next();
  };
  router.get('/session', (req, res) => res.json({ user: readUser(req) ?? null, backend: 'local' }));
  for (const action of ['signup', 'signin'] as const) router.post(`/${action}`, rateLimit, async (req, res, next) => {
    const { email, password } = req.body ?? {};
    if (Object.keys(req.body ?? {}).sort().join(',') !== 'email,password' || typeof email !== 'string'
      || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string'
      || password.length < 12 || password.length > 128) return void fail(res, 400, 'INVALID_CREDENTIALS');
    activeHashes++;
    try {
      const normalized = email.trim().toLowerCase();
      if (action === 'signup') {
        const salt = randomBytes(16).toString('hex');
        const hash = await hashPassword(password, salt);
        const id = randomUUID();
        if (db.prepare('SELECT id FROM local_users WHERE email=?').get(normalized)) return void fail(res, 409, 'ACCOUNT_EXISTS');
        db.prepare('INSERT INTO local_users VALUES (?, ?, ?, ?)').run(id, normalized, salt, hash.toString('hex'));
        session(res, id); res.status(201).json({ user: { id, email: normalized } });
      } else {
        const row = db.prepare('SELECT * FROM local_users WHERE email=?').get(normalized) as { id: string; email: string; salt: string; password_hash: string } | undefined;
        const key = await hashPassword(password, row?.salt ?? '00000000000000000000000000000000');
        const expected = Buffer.from(row?.password_hash ?? '0'.repeat(64), 'hex');
        if (!timingSafeEqual(key, expected) || !row) return void fail(res, 401, 'INVALID_CREDENTIALS');
        session(res, row.id); res.json({ user: { id: row.id, email: row.email } });
      }
    } catch (error) { next(error); }
    finally { activeHashes--; }
  });
  router.post('/signout', (req, res) => {
    const raw = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (raw) db.prepare('DELETE FROM local_sessions WHERE token_hash=?').run(digest(raw));
    res.clearCookie(cookieName, { httpOnly: true, sameSite: 'strict', path: '/api/account' });
    res.json({ success: true });
  });
  // Cookies are shared by tabs. Refuse an edit from a tab still displaying a different account.
  router.use(['/profile', '/drafts'], (req, res, next) => {
    const user = readUser(req);
    if (!user) return void fail(res, 401, 'SIGN_IN_REQUIRED');
    if (req.get('X-APIP-Account') !== user.id) return void fail(res, 409, 'ACCOUNT_CHANGED');
    next();
  });
  const load = (id: string) => {
    const row = db.prepare('SELECT * FROM local_profiles WHERE user_id=?').get(id) as { payload: string; revision: number; updated_at: string } | undefined;
    return row ? { ...JSON.parse(row.payload), user_id: id, revision: row.revision, updated_at: row.updated_at } : null;
  };
  router.get('/profile', (req, res) => {
    const user = readUser(req);
    if (!user) return void fail(res, 401, 'SIGN_IN_REQUIRED');
    res.json({ profile: load(user.id) });
  });
  router.post('/profile', (req, res) => {
    const user = readUser(req);
    if (!user) return void fail(res, 401, 'SIGN_IN_REQUIRED');
    const body = req.body;
    const profile = readProfileInput(body?.profile);
    if (!profile || Object.keys(body).sort().join(',') !== 'expectedRevision,profile'
      || !(body.expectedRevision === null || (Number.isInteger(body.expectedRevision) && body.expectedRevision > 0))) return void fail(res, 400, 'INVALID_PROFILE');
    const existing = load(user.id);
    if ((existing?.revision ?? null) !== body.expectedRevision) return void fail(res, 409, 'PROFILE_CONFLICT');
    const time = new Date(now()).toISOString();
    if (existing) {
      const result = db.prepare('UPDATE local_profiles SET payload=?, revision=revision+1, updated_at=? WHERE user_id=? AND revision=?')
        .run(JSON.stringify(profile), time, user.id, body.expectedRevision);
      if (!result.changes) return void fail(res, 409, 'PROFILE_CONFLICT');
    }
    else db.prepare('INSERT INTO local_profiles VALUES (?, ?, 1, ?)').run(user.id, JSON.stringify(profile), time);
    res.json({ profile: load(user.id) });
  });
  router.post('/profile/delete', (req, res) => {
    const user = readUser(req);
    if (!user) return void fail(res, 401, 'SIGN_IN_REQUIRED');
    if (Object.keys(req.body ?? {}).join(',') !== 'expectedRevision' || !Number.isInteger(req.body.expectedRevision)) return void fail(res, 400, 'INVALID_PROFILE');
    const result = db.prepare('DELETE FROM local_profiles WHERE user_id=? AND revision=?').run(user.id, req.body.expectedRevision);
    if (!result.changes) return void fail(res, 409, 'PROFILE_CONFLICT');
    res.json({ success: true });
  });
  const getDraft = (userId: string, id: string): AdrDraft | null => {
    const row = db.prepare('SELECT payload FROM local_adr_drafts WHERE user_id=? AND id=?').get(userId, id) as { payload: string } | undefined;
    return row ? JSON.parse(row.payload) : null;
  };
  router.get('/drafts', (req, res) => {
    const user = readUser(req)!;
    const rows = db.prepare('SELECT payload FROM local_adr_drafts WHERE user_id=? ORDER BY updated_at DESC, id').all(user.id) as { payload: string }[];
    res.json({ drafts: rows.map(row => JSON.parse(row.payload)) });
  });
  router.post('/drafts/save', (req, res) => {
    const user = readUser(req)!;
    const command = validateDraftCommand(req.body);
    if (!command) return void fail(res, 400, 'INVALID_DRAFT');
    const existing = getDraft(user.id, command.id);
    // A retried request after a lost response returns the already saved revision.
    if (existing && (command.expectedRevision === existing.revision || (command.expectedRevision ?? 0) === existing.revision - 1)
      && existing.status === command.status && JSON.stringify(existing.statements) === JSON.stringify(command.statements)) return void res.json({ draft: existing });
    if ((existing?.revision ?? null) !== command.expectedRevision) return void fail(res, 409, 'DRAFT_CONFLICT');
    if (!existing && Number(db.prepare('SELECT count(*) AS total FROM local_adr_drafts WHERE user_id=?').get(user.id)?.total) >= 200) return void fail(res, 409, 'DRAFT_LIMIT');
    const time = new Date(now()).toISOString();
    const draft: AdrDraft = { schemaVersion: 2, id: command.id, language: 'en', status: command.status,
      confirmedAt: command.status === 'user-confirmed' ? time : null, revision: (existing?.revision ?? 0) + 1,
      createdAt: existing?.createdAt ?? time, updatedAt: time, statements: command.statements };
    if (existing) {
      const result = db.prepare('UPDATE local_adr_drafts SET payload=?, revision=?, updated_at=? WHERE user_id=? AND id=? AND revision=?')
        .run(JSON.stringify(draft), draft.revision, time, user.id, command.id, command.expectedRevision!);
      if (!result.changes) return void fail(res, 409, 'DRAFT_CONFLICT');
    } else db.prepare('INSERT INTO local_adr_drafts VALUES (?, ?, ?, ?, ?)').run(user.id, draft.id, JSON.stringify(draft), draft.revision, time);
    res.json({ draft });
  });
  router.post('/drafts/delete', (req, res) => {
    const user = readUser(req)!;
    const body = req.body;
    if (!body || Object.keys(body).sort().join(',') !== 'expectedRevision,fictionalOnly,id' || body.fictionalOnly !== true
      || !isDraftId(body.id) || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 1) return void fail(res, 400, 'INVALID_DRAFT');
    const result = db.prepare('DELETE FROM local_adr_drafts WHERE user_id=? AND id=? AND revision=?').run(user.id, body.id, body.expectedRevision);
    if (!result.changes) return void fail(res, 409, 'DRAFT_CONFLICT');
    res.json({ success: true });
  });
  router.use((_req, res) => { fail(res, 404, 'NOT_FOUND'); });
  router.use((error: { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    fail(res, error.status === 413 ? 413 : error.type === 'entity.parse.failed' ? 400 : 500, 'REQUEST_FAILED');
  });
  app.use('/api/account', router);
  return { close: () => db.close(), db };
}
