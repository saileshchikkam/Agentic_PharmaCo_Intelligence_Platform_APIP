import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { sharingRouter } from '../server/sharing/router';
import { prepareDisclosure } from '../server/sharing/disclosure';
import { createSharingPoolRepository } from '../server/sharing/pool';
import type { SharingRepository } from '../server/sharing/repository';
import type { GuidedCaseRepository } from '../server/adr/repository';
import type { GuidedCase, Value } from '../src/features/adr/guided/domain';

test('shared queue HTTP endpoints enforce authentication, atomic claim, self-review prohibition, and withdrawal', async () => {
  const patient = randomUUID();
  const specialistA = randomUUID();
  const specialistB = randomUUID();
  const revokedSpecialist = randomUUID();
  const caseId = randomUUID();

  const val = (value: string): Value => ({
    state: 'provided',
    value,
    confirmedAt: new Date().toISOString(),
    source: 'manual',
    statementId: 'fictional',
  });

  const c: GuidedCase = {
    schemaVersion: 1,
    id: caseId,
    revision: 2,
    fictionalOnly: true,
    updatedAt: new Date().toISOString(),
    values: {
      caseType: val('Initial'),
      initials: val('FS'),
      reaction: val('Fictional severe itching'),
      reporterName: val('Fictional Reporter'),
      'med.m.name': val('Fictional test medicine'),
    },
    medications: [{ id: 'm', kind: 'suspect' }],
    statements: [],
    proposals: [],
    providerStatus: 'manual',
  };

  const pool = createSharingPoolRepository(null, ':memory:');
  const assignments = new Map<string, any>();

  const sharing: SharingRepository = {
    async operation(actor, op, id, body) {
      if (op === 'count') {
        if (actor === revokedSpecialist) throw Error('FORBIDDEN');
        return { count: assignments.size };
      }
      if (op === 'create') {
        assignments.set(id!, { actor, body, state: 'active' });
        return { id, state: 'active', case_id: (body as any).caseId, revision: (body as any).revision };
      }
      if (op === 'decline') {
        assignments.delete(id!);
        return { id, state: 'declined' };
      }
      if (op === 'withdraw') {
        assignments.delete(id!);
        return { id, state: 'withdrawn' };
      }
      if (op === 'patient_list') {
        return Array.from(assignments.values()).filter(a => a.actor === actor);
      }
      return [];
    },
  };

  const cases = {
    snapshot: async (owner: string, id: string, revision: number) =>
      owner === patient && id === caseId && revision === 2 ? c : null,
  } as unknown as GuidedCaseRepository;

  const app = express();
  app.use(express.json());
  app.use(
    '/api/sharing',
    sharingRouter(
      sharing,
      cases,
      req => (req.get('Authorization') ? { id: req.get('Authorization')! } : undefined),
      async () => true,
      pool
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
    // 1. Unauthenticated request rejected with 401
    const unauth = await fetch(url + '/api/sharing/queue');
    assert.equal(unauth.status, 401);

    // 2. Revoked specialist rejected from queue with 403
    const revoked = await call(revokedSpecialist, '/queue');
    assert.equal(revoked.status, 403);

    // 3. Approved specialist sees empty queue initially
    const emptyQueueRes = await call(specialistA, '/queue');
    assert.equal(emptyQueueRes.status, 200);
    const emptyQueue = await emptyQueueRes.json();
    assert.equal(emptyQueue.queue.length, 0);

    // 4. Patient creates pool sharing request
    const d = prepareDisclosure(c);
    const poolBody = {
      caseId,
      revision: 2,
      target: 'pool',
      consent: true,
      policyVersion: 'phase3c-c1-v1',
      digest: d.digest,
    };

    const createRes = await call(patient, '/requests', poolBody);
    assert.equal(createRes.status, 201);
    const createdData = await createRes.json();
    const requestId = createdData.request.id;
    assert.equal(createdData.request.state, 'pending_claim');

    // 5. Specialist A and Specialist B query queue; both see the entry
    const qA = await (await call(specialistA, '/queue')).json();
    assert.equal(qA.queue.length, 1);
    assert.equal(qA.queue[0].id, requestId);
    assert.equal(qA.queue[0].safeMetadata.reactionSnippet, 'Fictional severe itching');
    // Ensure no patient personal information in queue response
    assert(!JSON.stringify(qA).includes('Fictional Reporter'));

    // 6. Conflict of interest: Patient attempts to claim own report
    const selfClaim = await call(patient, '/queue/' + requestId + '/claim', {});
    assert.equal(selfClaim.status, 409);
    const selfClaimErr = await selfClaim.json();
    assert.equal(selfClaimErr.error, 'CONFLICT_OF_INTEREST');

    // 7. Specialist A claims the case
    const claimRes = await call(specialistA, '/queue/' + requestId + '/claim', {});
    assert.equal(claimRes.status, 200);

    // 8. Queue is now empty for Specialist B
    const qB = await (await call(specialistB, '/queue')).json();
    assert.equal(qB.queue.length, 0);

    // 9. Specialist B attempting to claim receives 409 Conflict
    const claimBRes = await call(specialistB, '/queue/' + requestId + '/claim', {});
    assert.equal(claimBRes.status, 409);
    const claimBErr = await claimBRes.json();
    assert.equal(claimBErr.error, 'ACTIVE_ASSIGNMENT_CONFLICT');

    // 10. Specialist A releases case back to queue
    const releaseRes = await call(specialistA, '/queue/' + requestId + '/release', { expectedVersion: 2 });
    assert.equal(releaseRes.status, 200);

    // Case is back in queue for Specialist B
    const qBAfterRelease = await (await call(specialistB, '/queue')).json();
    assert.equal(qBAfterRelease.queue.length, 1);

    // 11. Patient withdraws sharing request
    const withdrawRes = await call(patient, '/requests/' + requestId + '/withdraw', { expectedVersion: 3 });
    assert.equal(withdrawRes.status, 200);

    // Queue is empty again
    const qBAfterWithdraw = await (await call(specialistB, '/queue')).json();
    assert.equal(qBAfterWithdraw.queue.length, 0);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
