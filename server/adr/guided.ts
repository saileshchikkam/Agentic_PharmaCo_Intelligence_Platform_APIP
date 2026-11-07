import { Router, type Request, type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { missing, nextQuestion, chronology, type GuidedCase } from '../../src/features/adr/guided/domain';
import type { GuidedCaseRepository } from './repository';
import { applyCaseCommand, exact } from './caseService';
import { configuredProvider, type IntakeProvider } from './provider';
import { createPdfService } from './pdf';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const errors: Record<string, number> = {
  SIGN_IN_REQUIRED: 401, ACCOUNT_CHANGED: 409, NOT_FOUND: 404, FICTIONAL_ONLY: 400,
  INVALID_COMMAND: 400, INVALID_PAGE: 400, IDEMPOTENCY_KEY_REQUIRED: 400,
  REVISION_CONFLICT: 409, IDEMPOTENCY_CONFLICT: 409, CASE_LIMIT: 409, HISTORY_LIMIT: 409,
  PDF_BUSY: 429, EXTRACTION_BUSY: 429, PDF_SELECT_ONE_SERIOUSNESS: 422, PDF_UNSUPPORTED_SCRIPT: 422,
};
const pdfErrors = new Set(['PDF_TEMPLATE_MISSING', 'TEMPLATE_CHANGED', 'PDF_RUNTIME_UNAVAILABLE',
  'PDF_RUNTIME_DEPENDENCIES_MISSING', 'PDF_GENERATION_FAILED', 'PDF_TIMEOUT', 'PDF_TOO_LARGE']);
const endpoint = (fn: (...args: Parameters<RequestHandler>) => Promise<void>): RequestHandler =>
  (req, res, next) => { void fn(req, res, next).catch(error => {
    const code = error instanceof Error ? error.message : '';
    if (Object.hasOwn(errors, code)) res.status(errors[code]).json({ error: code });
    else if (pdfErrors.has(code)) res.status(503).json({ error: code });
    else next(error);
  }); };

export function guidedRouter(repository: GuidedCaseRepository, readUser: (req: Request) => { id: string } | null | undefined,
  provider: IntakeProvider | null | undefined = configuredProvider(),
  revalidate = (req: Request, owner: string): boolean | Promise<boolean> => readUser(req)?.id === owner) {
  const router = Router();
  const pdf = createPdfService();
  let extracting = false;

  router.use((req, res, next) => {
    const user = readUser(req);
    if (!user) { res.status(401).json({ error: 'SIGN_IN_REQUIRED' }); return; }
    if (req.get('X-APIP-Account') !== user.id) { res.status(409).json({ error: 'ACCOUNT_CHANGED' }); return; }
    next();
  });
  const owner = (req: Request) => readUser(req)!.id;
  const view = (c: GuidedCase) => ({ case: c, missing: missing(c), nextQuestion: nextQuestion(c),
    warnings: chronology(c), officialTemplateAvailable: pdf.available() });
  async function load(user: string, id: string) {
    const c = await repository.load(user, id);
    if (!c) throw Error('NOT_FOUND');
    return c;
  }
  function key(req: Request) {
    if (!repository.replay) return undefined;
    const value = req.get('Idempotency-Key');
    if (!value || !uuid.test(value)) throw Error('IDEMPOTENCY_KEY_REQUIRED');
    return value.toLowerCase();
  }
  router.get('/', endpoint(async (req, res) => {
    if (repository.page && (req.query.limit !== undefined || req.query.after !== undefined)) {
      const limit = req.query.limit ?? '25';
      const after = req.query.after;
      if (typeof limit !== 'string' || !/^[1-9][0-9]?$/.test(limit) || Number(limit) > 50
        || (after !== undefined && (typeof after !== 'string' || !uuid.test(after)))) throw Error('INVALID_PAGE');
      res.json(await repository.page(owner(req), Number(limit), after));
      return;
    }
    res.json({ cases: await repository.list(owner(req)) });
  }));
  router.post('/', endpoint(async (req, res) => {
    if (!exact(req.body, ['fictionalOnly']) || req.body.fictionalOnly !== true) throw Error('FICTIONAL_ONLY');
    const user = owner(req), mutation = key(req);
    const c: GuidedCase = { schemaVersion: 1, id: mutation ?? randomUUID(), revision: 0, fictionalOnly: true,
      updatedAt: '', values: {}, medications: [{ id: randomUUID(), kind: 'suspect' }], statements: [], proposals: [], providerStatus: 'manual' };
    res.status(201).json(view(await repository.save(user, c, 0, { type: 'create' }, mutation)));
  }));
  router.get('/:id', endpoint(async (req, res) => { res.json(view(await load(owner(req), req.params.id))); }));
  router.get('/:id/history', endpoint(async (req, res) => {
    const user = owner(req);
    await load(user, req.params.id);
    if (repository.page && (req.query.limit !== undefined || req.query.before !== undefined)) {
      const limit = req.query.limit ?? '25', before = req.query.before ?? '501';
      if (typeof limit !== 'string' || !/^[1-9][0-9]?$/.test(limit) || Number(limit) > 50
        || typeof before !== 'string' || !/^[1-9][0-9]{0,2}$/.test(before) || Number(before) > 501) throw Error('INVALID_PAGE');
      const rows = await repository.history(user, req.params.id, Number(limit) + 1, Number(before));
      const versions = rows.slice(0, Number(limit));
      res.json({ versions, nextBefore: rows.length > Number(limit) ? versions[versions.length - 1].revision : null });
      return;
    }
    res.json({ versions: await repository.history(user, req.params.id) });
  }));
  router.post('/:id/pdf', endpoint(async (req, res) => {
    const user = owner(req), c = await load(user, req.params.id);
    if (!exact(req.body, ['expectedRevision']) || req.body.expectedRevision !== c.revision) throw Error('REVISION_CONFLICT');
    const bytes = await pdf.generate(c);
    if (!await revalidate(req, user)) throw Error('SIGN_IN_REQUIRED');
    if ((await repository.load(user, c.id))?.revision !== c.revision) throw Error('REVISION_CONFLICT');
    await repository.recordExport?.(user, c.id, c.revision, bytes);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="APIP-PvPI-' + c.id + '-r' + c.revision + '.pdf"');
    res.set('X-APIP-Revision', String(c.revision));
    res.send(bytes);
  }));
  router.post('/:id/command', endpoint(async (req, res) => {
    const user = owner(req), id = req.params.id, c = await load(user, id);
    const b = req.body;
    if (!exact(b, ['expectedRevision', 'command']) || !Number.isSafeInteger(b.expectedRevision)) throw Error('REVISION_CONFLICT');
    const cmd = b.command, mutation = key(req);
    if (!cmd || typeof cmd.type !== 'string') throw Error('INVALID_COMMAND');
    const prior = mutation && await repository.replay?.(user, id, b.expectedRevision, cmd, mutation);
    if (prior) { res.json(view(prior)); return; }
    if (b.expectedRevision !== c.revision) throw Error('REVISION_CONFLICT');
    if (c.revision >= 500) throw Error('HISTORY_LIMIT');

    if (cmd.type === 'describe' && provider) {
      if (extracting) throw Error('EXTRACTION_BUSY');
      extracting = true;
      try { await applyCaseCommand(c, cmd, provider); } finally { extracting = false; }
    } else {
      await applyCaseCommand(c, cmd, null);
    }
    if (cmd.type === 'describe' && !await revalidate(req, user)) throw Error('SIGN_IN_REQUIRED');
    res.json(view(await repository.save(user, c, b.expectedRevision, cmd, mutation)));
  }));
  return router;
}
