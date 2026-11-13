import { Router, type Request, type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import type { GuidedCaseRepository } from '../adr/repository';
import type { SharingRepository } from './repository';
import { prepareDisclosure } from './disclosure';
import { createPdfService, type PdfService } from '../adr/pdf';
import type { SharingPoolRepository } from './pool';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const status: Record<string, number> = {
  REPORT_NOT_FINALIZED:409,
  PDF_BUSY: 429,
  PDF_UNSUPPORTED_SCRIPT: 422,
  PDF_SELECT_ONE_SERIOUSNESS: 422,
  SIGN_IN_REQUIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REVISION_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  ACTIVE_ASSIGNMENT_CONFLICT: 409,
  CONFLICT_OF_INTEREST: 409,
  RECIPIENT_UNAVAILABLE: 409,
  DISCLOSURE_MISMATCH: 409,
  EXPLICIT_CONSENT_REQUIRED: 400,
  INVALID_REQUEST: 400,
  INTAKE_INCOMPLETE: 422,
  RESERVED_FIELD_REQUIRES_CORRECTION: 422,
  POOL_MIGRATION_REQUIRED: 503,
  POOL_SQLITE_FORBIDDEN_IN_CLOUD: 503,
  PDF_TEMPLATE_MISSING: 503,
  TEMPLATE_CHANGED: 503,
  PDF_RUNTIME_UNAVAILABLE: 503,
  PDF_RUNTIME_DEPENDENCIES_MISSING: 503,
  PDF_GENERATION_FAILED: 503,
  PDF_TIMEOUT: 503,
  PDF_TOO_LARGE: 503,
};
const exact = (v: any, keys: string[]) =>
  v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.keys(v).sort().join(',') === keys.sort().join(',');

export function sharingRouter(
  sharing: SharingRepository | null,
  cases: GuidedCaseRepository,
  principal: (r: Request) => { id: string } | undefined,
  revalidate: (r: Request, owner: string) => Promise<boolean>,
  poolRepo?: SharingPoolRepository | null,
  pdfService?: PdfService
) {
  const pdf = pdfService ?? createPdfService();
  const pool = poolRepo ?? null;
  const router = Router();

  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    const user = principal(req);
    if (!user) {
      res.status(401).json({ error: 'SIGN_IN_REQUIRED' });
      return;
    }
    if (req.get('X-APIP-Account') !== user.id) {
      res.status(409).json({ error: 'ACCOUNT_CHANGED' });
      return;
    }
    if (!sharing) {
      res.status(503).json({ error: 'SHARING_NOT_ENABLED' });
      return;
    }
    next();
  });

  const endpoint =
    (fn: (req: Request, res: import('express').Response) => Promise<void>): RequestHandler =>
    (req, res) => {
      void fn(req, res).catch(e =>
        res.status(status[e.message] ?? 503).json({
          error: status[e.message] ? e.message : 'SHARING_UNAVAILABLE',
        })
      );
    };

  const actor = (req: Request) => principal(req)!.id;
  const key = (req: Request) => {
    const k = req.get('Idempotency-Key');
    if (!k || !uuid.test(k)) throw Error('INVALID_REQUEST');
    return k;
  };
  const op = (
    req: Request,
    name: string,
    id: string | null = null,
    body: unknown = {},
    command: string = randomUUID()
  ) => sharing!.operation(actor(req), name, id, body, command);

  // Directory and status
  router.get(
    '/directory/me',
    endpoint(async (req, res) => {
      res.json(await op(req, 'directory_status'));
    })
  );
  router.get(
    '/directory',
    endpoint(async (req, res) => {
      res.json({ specialists: await op(req, 'directory') });
    })
  );
  router.post(
    '/directory',
    endpoint(async (req, res) => {
      if (!exact(req.body, ['optedIn']) || typeof req.body.optedIn !== 'boolean')
        throw Error('INVALID_REQUEST');
      res.json(await op(req, 'opt_in', null, req.body, key(req)));
    })
  );

  // Patient sharing requests (direct + pooled)
  router.get(
    '/requests',
    endpoint(async (req, res) => {
      const directReqs: any[] = (await op(req, 'patient_list')) ?? [];
      const poolReqs = pool ? await pool.listForPatient(actor(req)) : [];
      const poolIds = new Set(poolReqs.map(p => p.id));
      const poolAssignments = new Set(
        poolReqs.map(p => p.activeAssignmentId).filter((v): v is string => Boolean(v))
      );
      const filteredDirect = directReqs.filter(
        r => !poolIds.has(r.id) && !poolAssignments.has(r.id)
      );
      const formattedPoolReqs = poolReqs.map(p => ({
        id: p.id,
        caseId: p.caseId,
        revision: p.revision,
        state: p.state === 'claimed' ? 'active' : p.state,
        version: p.version,
        target: 'pool',
        assignedAt: p.claimedAt ?? p.createdAt,
      }));
      res.json({ requests: [...filteredDirect, ...formattedPoolReqs] });
    })
  );

  router.post(
    '/disclosure',
    endpoint(async (req, res) => {
      if (
        !exact(req.body, ['caseId', 'revision']) ||
        !uuid.test(req.body.caseId) ||
        !Number.isSafeInteger(req.body.revision)
      )
        throw Error('INVALID_REQUEST');
      const c = await cases.snapshot(actor(req), req.body.caseId, req.body.revision);
      if (!c) throw Error('NOT_FOUND');
      res.json({ disclosure: prepareDisclosure(c) });
    })
  );

  // Create sharing request: Direct specialist (3C-B) or Pooled queue (3C-C1)
  router.post(
    '/requests',
    endpoint(async (req, res) => {
      const b = req.body;
      const command = key(req);

      // Phase 3C-C1: Pooled sharing
      if (b.target === 'pool') {
        if (!pool) throw Error('POOL_MIGRATION_REQUIRED');
        if (
          !exact(b, ['caseId', 'revision', 'target', 'consent', 'policyVersion', 'digest']) ||
          !uuid.test(b.caseId) ||
          !Number.isSafeInteger(b.revision) ||
          b.consent !== true ||
          b.policyVersion !== 'phase3c-c1-v1'
        ) {
          throw Error('INVALID_REQUEST');
        }
        const c = await cases.snapshot(actor(req), b.caseId, b.revision);
        if (!c) throw Error('NOT_FOUND');
        const disclosure = prepareDisclosure(c);
        if (disclosure.digest !== b.digest) throw Error('DISCLOSURE_MISMATCH');
        const requestId = command;
        const item = await pool.createPoolRequest(
          actor(req),
          {
            id: requestId,
            caseId: b.caseId,
            revision: b.revision,
            snapshot: c,
            disclosure,
            digest: b.digest,
            policyVersion: 'phase3c-c1-v1',
          },
          command
        );
        res.status(201).json({ request: item });
        return;
      }

      // Phase 3C-B: Direct 1-to-1 specialist sharing
      if (
        !exact(b, ['caseId', 'revision', 'specialist', 'consent', 'policyVersion', 'digest']) ||
        !uuid.test(b.caseId) ||
        !uuid.test(b.specialist) ||
        !Number.isSafeInteger(b.revision) ||
        b.consent !== true ||
        b.policyVersion !== 'phase3c-b-v1'
      )
        throw Error('INVALID_REQUEST');
      const c = await cases.snapshot(actor(req), b.caseId, b.revision);
      if (!c) throw Error('NOT_FOUND');
      const disclosure = prepareDisclosure(c);
      if (disclosure.digest !== b.digest) throw Error('DISCLOSURE_MISMATCH');
      res.status(201).json({
        request: await op(req, 'create', command, { ...b, snapshot: c, disclosure }, command),
      });
    })
  );

  // Withdraw patient sharing request
  router.post(
    '/requests/:id/withdraw',
    endpoint(async (req, res) => {
      if (
        !uuid.test(req.params.id) ||
        !exact(req.body, ['expectedVersion']) ||
        !Number.isSafeInteger(req.body.expectedVersion)
      )
        throw Error('INVALID_REQUEST');

      const command = key(req);
      const poolItem = pool ? await pool.get(req.params.id, actor(req)) : null;
      if (poolItem && poolItem.patient === actor(req)) {
        const result = await pool.withdraw(
          actor(req),
          poolItem.id,
          req.body.expectedVersion,
          command,
          async (assignmentId, assignmentVersion) => {
            try {
              return await op(req, 'withdraw', assignmentId, { expectedVersion: assignmentVersion }, command);
            } catch (e) {
              if ((e as Error).message === 'NOT_FOUND') return null;
              throw e;
            }
          }
        );
        res.json(result);
        return;
      }

      res.json({ request: await op(req, 'withdraw', req.params.id, req.body, command) });
    })
  );

  // Shared Queue (Phase 3C-C1)
  router.get(
    '/queue',
    endpoint(async (req, res) => {
      // Caller must be currently approved specialist
      await op(req, 'count');
      if (!pool) throw Error('POOL_MIGRATION_REQUIRED');
      const queue = await pool.listQueue(50, actor(req));
      res.json({ queue });
    })
  );

  // Atomic Claim (Phase 3C-C1)
  router.post(
    '/queue/:id/claim',
    endpoint(async (req, res) => {
      if (!uuid.test(req.params.id) || !exact(req.body, [])) throw Error('INVALID_REQUEST');
      // Caller must be currently approved specialist
      await op(req, 'count');
      if (!pool) throw Error('POOL_MIGRATION_REQUIRED');
      const specialistId = actor(req);
      const command = key(req);

      const result = await pool.claim(specialistId, req.params.id, command, async (item, assignmentId) => {
        // Fallback path when PostgreSQL pooled migration is awaiting owner DDL approval:
        // Re-verify canonical patient-owned snapshot and disclosure digest before assignment creation.
        const canonical = await cases.snapshot(item.patient, item.caseId, item.revision);
        if (!canonical) throw Error('NOT_FOUND');
        const verifiedDisclosure = prepareDisclosure(canonical);
        if (verifiedDisclosure.digest !== item.disclosureDigest) throw Error('DISCLOSURE_MISMATCH');
        return await sharing!.operation(
          item.patient,
          'create',
          assignmentId,
          {
            caseId: item.caseId,
            revision: item.revision,
            specialist: specialistId,
            consent: true,
            policyVersion: 'phase3c-b-v1',
            snapshot: canonical,
            disclosure: verifiedDisclosure,
            digest: verifiedDisclosure.digest,
          },
          command
        );
      });

      res.status(200).json(result);
    })
  );

  // Release / Unclaim back to pool (Phase 3C-C1)
  router.post(
    '/queue/:id/release',
    endpoint(async (req, res) => {
      if (
        !uuid.test(req.params.id) ||
        !exact(req.body, ['expectedVersion']) ||
        !Number.isSafeInteger(req.body.expectedVersion)
      )
        throw Error('INVALID_REQUEST');
      if (!pool) throw Error('POOL_MIGRATION_REQUIRED');

      const specialistId = actor(req);
      const command = key(req);

      const result = await pool.release(
        specialistId,
        req.params.id,
        req.body.expectedVersion,
        command,
        async (assignmentId, assignmentVersion) => {
          return await op(req, 'decline', assignmentId, { expectedVersion: assignmentVersion }, command);
        }
      );

      res.json(result);
    })
  );

  // Specialist Assigned Inbox & Management
  router.post(
    '/inbox/:id/decline',
    endpoint(async (req, res) => {
      if (
        !uuid.test(req.params.id) ||
        !exact(req.body, ['expectedVersion']) ||
        !Number.isSafeInteger(req.body.expectedVersion)
      )
        throw Error('INVALID_REQUEST');
      const command = key(req);
      const specialistId = actor(req);
      const poolItem = pool ? await pool.get(req.params.id, specialistId) : null;
      if (poolItem && poolItem.state === 'claimed' && poolItem.claimedBy === specialistId) {
        const result = await pool.release(
          specialistId,
          req.params.id,
          req.body.expectedVersion,
          command,
          async (assignmentId, assignmentVersion) => {
            return await op(req, 'decline', assignmentId, { expectedVersion: assignmentVersion }, command);
          }
        );
        res.json(result);
        return;
      }
      res.json(await op(req, 'decline', req.params.id, req.body, command));
    })
  );

  router.get(
    '/inbox',
    endpoint(async (req, res) => {
      res.json({ requests: await op(req, 'inbox') });
    })
  );
  router.get(
    '/count',
    endpoint(async (req, res) => {
      res.json(await op(req, 'count'));
    })
  );

  router.get(
    '/inbox/:id',
    endpoint(async (req, res) => {
      if (!uuid.test(req.params.id)) throw Error('INVALID_REQUEST');
      const report = await op(req, 'report', req.params.id);
      if (!(await revalidate(req, actor(req)))) throw Error('SIGN_IN_REQUIRED');
      await op(req, 'check', req.params.id);
      res.json(report);
    })
  );

  router.post(
    '/inbox/:id/preview',
    endpoint(async (req, res) => {
      if (!uuid.test(req.params.id) || !exact(req.body, [])) throw Error('INVALID_REQUEST');
      const snapshot = await op(req, 'pdf_snapshot', req.params.id);
      prepareDisclosure(snapshot);
      const bytes = await pdf.generate(snapshot);
      if (!(await revalidate(req, actor(req)))) throw Error('SIGN_IN_REQUIRED');
      await op(req, 'check', req.params.id);
      res
        .set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="APIP-authorized-preview.pdf"',
          'X-Content-Type-Options': 'nosniff',
          'X-APIP-Revision': String(snapshot.revision),
        })
        .send(bytes);
    })
  );

  return router;
}
