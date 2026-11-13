import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { sharingRouter } from '../server/sharing/router';
import { prepareDisclosure } from '../server/sharing/disclosure';
import { createPdfService, probePdf, type PdfService } from '../server/adr/pdf';
import type { SharingRepository } from '../server/sharing/repository';
import type { GuidedCaseRepository } from '../server/adr/repository';
import type { GuidedCase, Value } from '../src/features/adr/guided/domain';

const makeVal = (value: string): Value => ({
  state: 'provided',
  value,
  confirmedAt: new Date().toISOString(),
  source: 'manual',
  statementId: 'fictional',
});

const sampleCase = (caseId: string): GuidedCase => ({
  schemaVersion: 1,
  id: caseId,
  revision: 3,
  fictionalOnly: true,
  updatedAt: new Date().toISOString(),
  values: {
    caseType: makeVal('Initial'),
    initials: makeVal('FS'),
    reaction: makeVal('Fictional rash'),
    reporterName: makeVal('Fictional Reporter'),
    'med.m.name': makeVal('Fictional medicine'),
  },
  medications: [{ id: 'm', kind: 'suspect' }],
  statements: [],
  proposals: [],
  providerStatus: 'manual',
});

test('sharing HTTP validates owner context, explicit consent and revocation before original PDF delivery', async () => {
  const patient = randomUUID(),
    specialist = randomUUID(),
    foreign = randomUUID(),
    caseId = randomUUID(),
    requestId = randomUUID();
  const c = sampleCase(caseId);
  let active = true,
    received: any;
  const sharing: SharingRepository = {
    async operation(actor, op, _id, body) {
      if (op === 'create') {
        received = body;
        return { id: requestId, state: 'active' };
      }
      if (['report', 'check', 'pdf_snapshot'].includes(op)) {
        if (actor !== specialist || !active) throw Error('NOT_FOUND');
        if (op === 'pdf_snapshot') {
          active = false;
          return c;
        }
        return op === 'check' ? { version: 1 } : { revision: 3 };
      }
      return [];
    },
  };
  const cases = {
    snapshot: async (owner: string, id: string, revision: number) =>
      owner === patient && id === caseId && revision === 3 ? c : null,
  } as unknown as GuidedCaseRepository;
  const testPdf: PdfService = {
    available: () => true,
    generate: async () => Buffer.from('%PDF-1.4\n%fictional-test\n'),
  };
  const app = express();
  app.use(express.json());
  app.use(
    '/api/sharing',
    sharingRouter(
      sharing,
      cases,
      req => (req.get('Authorization') ? { id: req.get('Authorization')! } : undefined),
      async () => true,
      null,
      testPdf
    )
  );
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
  const call = (actor: string, path: string, body?: unknown, header = actor) =>
    fetch(url + '/api/sharing' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: actor,
        'X-APIP-Account': header,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    assert.equal((await fetch(url + '/api/sharing/directory')).status, 401);
    assert.equal((await call(patient, '/directory', undefined, foreign)).status, 409);
    assert.equal((await call(foreign, '/disclosure', { caseId, revision: 3 })).status, 404);
    const d = prepareDisclosure(c);
    const b = { caseId, revision: 3, specialist, consent: true, policyVersion: 'phase3c-b-v1', digest: d.digest };
    assert.equal((await call(patient, '/requests', { ...b, consent: false })).status, 400);
    assert.equal((await call(patient, '/requests', { ...b, owner: foreign })).status, 400);
    assert.equal((await call(patient, '/requests', { ...b, digest: 'tampered' })).status, 409);
    assert.equal((await call(patient, '/requests', b)).status, 201);
    assert.deepEqual(received.snapshot, c);
    assert.equal(received.disclosure.digest, d.digest);
    assert.equal((await call(foreign, '/inbox/' + requestId)).status, 404);
    const pdf = await call(specialist, '/inbox/' + requestId + '/preview', {});
    assert.equal(pdf.status, 404);
    assert(!pdf.headers.get('content-type')?.includes('pdf'), 'withdrawal during generation prevents PDF delivery');
  } finally {
    await new Promise<void>(resolveServer => server.close(() => resolveServer()));
  }
});

test('sharing HTTP separates 503 PDF service unavailability from 404 unauthorized or withdrawn previews', async () => {
  const specialist = randomUUID(),
    foreign = randomUUID(),
    caseId = randomUUID(),
    requestId = randomUUID();
  const c = sampleCase(caseId);
  let pdfError = 'PDF_TEMPLATE_MISSING';
  const sharing: SharingRepository = {
    async operation(actor, op) {
      if (['pdf_snapshot', 'check'].includes(op)) {
        if (actor !== specialist) throw Error('NOT_FOUND');
        return op === 'pdf_snapshot' ? c : { version: 1 };
      }
      return [];
    },
  };
  const cases = {} as GuidedCaseRepository;
  const unavailablePdf: PdfService = {
    available: () => false,
    generate: async () => {
      throw Error(pdfError);
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    '/api/sharing',
    sharingRouter(
      sharing,
      cases,
      req => (req.get('Authorization') ? { id: req.get('Authorization')! } : undefined),
      async () => true,
      null,
      unavailablePdf
    )
  );
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
  const call = (actor: string, path: string, body?: unknown) =>
    fetch(url + '/api/sharing' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: actor,
        'X-APIP-Account': actor,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    // Unauthorized callers fail before PDF generation with 404, never leaking PDF service state.
    const unauth = await call(foreign, '/inbox/' + requestId + '/preview', {});
    assert.equal(unauth.status, 404);

    const missingTemplate = await call(specialist, '/inbox/' + requestId + '/preview', {});
    assert.equal(missingTemplate.status, 503);
    assert.deepEqual(await missingTemplate.json(), { error: 'PDF_TEMPLATE_MISSING' });
    assert(!missingTemplate.headers.get('content-type')?.includes('pdf'));

    pdfError = 'PDF_RUNTIME_DEPENDENCIES_MISSING';
    const missingDeps = await call(specialist, '/inbox/' + requestId + '/preview', {});
    assert.equal(missingDeps.status, 503);
    assert.deepEqual(await missingDeps.json(), { error: 'PDF_RUNTIME_DEPENDENCIES_MISSING' });
  } finally {
    await new Promise<void>(resolveServer => server.close(() => resolveServer()));
  }
});

test('sharing HTTP exercises real PDF service gracefully according to local template and runtime availability', async () => {
  const specialist = randomUUID(),
    caseId = randomUUID(),
    requestId = randomUUID();
  const c = sampleCase(caseId);
  const sharing: SharingRepository = {
    async operation(actor, op) {
      if (['pdf_snapshot', 'check'].includes(op)) {
        if (actor !== specialist) throw Error('NOT_FOUND');
        return op === 'pdf_snapshot' ? c : { version: 1 };
      }
      return [];
    },
  };
  const realPdf = createPdfService();
  const app = express();
  app.use(express.json());
  app.use(
    '/api/sharing',
    sharingRouter(
      sharing,
      {} as GuidedCaseRepository,
      req => (req.get('Authorization') ? { id: req.get('Authorization')! } : undefined),
      async () => true,
      null,
      realPdf
    )
  );
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
  try {
    const res = await fetch(url + '/api/sharing/inbox/' + requestId + '/preview', {
      method: 'POST',
      headers: {
        Authorization: specialist,
        'X-APIP-Account': specialist,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({}),
    });
    const hasTemplate = existsSync(resolve('docs/adr/templates/ADRRF_2.pdf'));
    const hasRuntime = hasTemplate && (await probePdf());
    if (hasRuntime) {
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/pdf');
      assert.equal(res.headers.get('x-apip-revision'), '3');
      const buf = Buffer.from(await res.arrayBuffer());
      assert(buf.subarray(0, 5).toString('utf8') === '%PDF-');
    } else {
      assert.equal(res.status, 503);
      const body = (await res.json()) as { error?: string };
      assert(
        body.error === 'PDF_TEMPLATE_MISSING' ||
          body.error === 'PDF_RUNTIME_UNAVAILABLE' ||
          body.error === 'PDF_RUNTIME_DEPENDENCIES_MISSING',
        `Unexpected 503 error payload: ${JSON.stringify(body)}`
      );
    }
  } finally {
    await new Promise<void>(resolveServer => server.close(() => resolveServer()));
  }
});
