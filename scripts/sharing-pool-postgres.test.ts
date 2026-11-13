import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { sharingRouter } from '../server/sharing/router';
import { postgresSharingRepository } from '../server/sharing/repository';
import { postgresSharingPoolRepository } from '../server/sharing/pool';
import { extractSafeMetadata } from '../server/sharing/policy';
import { prepareDisclosure } from '../server/sharing/disclosure';
import type { GuidedCaseRepository } from '../server/adr/repository';
import type { GuidedCase, Value } from '../src/features/adr/guided/domain';

function makeVal(value: string): Value {
  return {
    state: 'provided',
    value,
    confirmedAt: new Date().toISOString(),
    source: 'manual',
    statementId: 'fictional-st',
  };
}

test('PostgreSQL-authoritative pooled sharing queue enforces least privilege, concurrent claim, reassignment, withdrawal, and PII redaction', async () => {
  const db = new PGlite();
  let wire: PGLiteSocketServer | null = null;
  let server: import('node:http').Server | null = null;
  const clients: postgres.Sql[] = [];

  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role apip_adr_writer;
      create schema auth;
      create table auth.users(id uuid primary key);
      create schema apip_identity;
      create table apip_identity.applications(owner_id uuid, state text, valid_until timestamptz, profile jsonb);
      create schema apip_adr;
      create table apip_adr.revisions(owner_id uuid, case_id uuid, revision integer, snapshot jsonb, primary key(owner_id, case_id, revision));
      create role migration_operator nologin createrole;
      grant create on database postgres to migration_operator;
      grant usage on schema auth, apip_identity, apip_adr to migration_operator;
      grant references on auth.users, apip_adr.revisions to migration_operator;
      grant select on apip_identity.applications, apip_adr.revisions to migration_operator;
      set role migration_operator;
    `);

    const m1 = await readFile(new URL('../supabase/migrations/20261108123217_adr_consented_sharing.sql', import.meta.url), 'utf8');
    const m2 = await readFile(new URL('../supabase/migrations/20261111000000_adr_pooled_sharing_queue.sql', import.meta.url), 'utf8');
    await db.exec(m1);
    await db.exec(m2);
    await db.exec('reset role');

    // Verify all 7 apip_sharing tables enable RLS and are owned by migration_operator
    const tables = await db.query<{ relname: string; rls: boolean; owner: string }>(
      "select c.relname, c.relrowsecurity rls, pg_get_userbyid(c.relowner) owner from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'apip_sharing' and c.relkind = 'r'"
    );
    assert.equal(tables.rows.length, 7);
    assert(tables.rows.every(t => t.rls && t.owner === 'migration_operator'));

    // Verify no direct table or private bridge execute privileges on anon, authenticated, apip_adr_writer
    for (const role of ['anon', 'authenticated', 'apip_adr_writer']) {
      for (const table of ['pooled_requests', 'pool_audit', 'pool_receipts']) {
        const res = await db.query<{ allowed: boolean }>(
          "select has_table_privilege($1, $2, 'SELECT,INSERT,UPDATE,DELETE') allowed",
          [role, 'apip_sharing.' + table]
        );
        assert.equal(res.rows[0].allowed, false, `${role} should have zero privileges on ${table}`);
      }
      const bridgeRes = await db.query<{ allowed: boolean }>(
        "select has_function_privilege($1, 'apip_sharing.insert_claimed_assignment(uuid,uuid,uuid,uuid)', 'EXECUTE') allowed",
        [role]
      );
      assert.equal(bridgeRes.rows[0].allowed, false);
    }

    // Verify column-restricted update grants on pooled_requests
    assert.equal(
      (await db.query<{ allowed: boolean }>("select has_column_privilege('apip_sharing_executor', 'apip_sharing.pooled_requests', 'patient', 'UPDATE') allowed")).rows[0].allowed,
      false
    );
    assert.equal(
      (await db.query<{ allowed: boolean }>("select has_column_privilege('apip_sharing_executor', 'apip_sharing.pooled_requests', 'state', 'UPDATE') allowed")).rows[0].allowed,
      true
    );

    // Seed fictional identities and case revision
    const [patient, specialistA, specialistB, revokedSpec] = Array.from({ length: 4 }, () => randomUUID());
    for (const id of [patient, specialistA, specialistB, revokedSpec]) {
      await db.query('insert into auth.users values ($1)', [id]);
    }
    for (const [id, state, org] of [
      [specialistA, 'APPROVED', 'Fictional Clinic A'],
      [specialistB, 'APPROVED', 'Fictional Clinic B'],
      [revokedSpec, 'REVOKED', 'Revoked Clinic'],
    ]) {
      await db.query(
        "insert into apip_identity.applications values ($1, $2, now() + interval '30 days', $3)",
        [id, state, JSON.stringify({ fullName: 'Reviewer ' + id.slice(0, 4), category: 'Pharmacist', organization: org })]
      );
    }

    const caseId = randomUUID();
    const piiCase: GuidedCase = {
      schemaVersion: 1,
      id: caseId,
      revision: 1,
      fictionalOnly: true,
      updatedAt: new Date().toISOString(),
      values: {
        caseType: makeVal('Initial'),
        initials: makeVal('RK'),
        reaction: makeVal('Urticaria reported by Ravi Kumar Patient (call +91 98765 43210 or ravi.kumar@example.test, https://example.test/id)'),
        reporterName: makeVal('Ravi Kumar Patient'),
        email: makeVal('ravi.kumar@example.test'),
        phone: makeVal('+91 98765 43210'),
        'med.m1.name': makeVal('Amoxicillin 500mg (+91 98765 43210)'),
      },
      medications: [{ id: 'm1', kind: 'suspect' }],
      statements: [{ id: 'st1', text: 'Fictional rash occurred 2 hours post dose.', confirmedAt: new Date().toISOString() }],
      proposals: [],
      providerStatus: 'manual',
    };
    await db.query('insert into apip_adr.revisions values ($1, $2, 1, $3)', [
      patient,
      caseId,
      JSON.stringify(piiCase),
    ]);

    // Check extractSafeMetadata unit redaction directly
    const disclosed = prepareDisclosure(piiCase);
    const meta = extractSafeMetadata(piiCase, disclosed);
    assert(!meta.reactionSnippet.includes('Ravi Kumar Patient'));
    assert(!meta.reactionSnippet.includes('ravi.kumar@example.test'));
    assert(!meta.reactionSnippet.includes('98765'));
    assert(!meta.reactionSnippet.includes('https://example.test'));
    assert(!meta.suspectMedicineClass.includes('98765'));
    assert.equal(meta.suspectMedicineClass,'1 suspect medicine recorded');assert.equal(meta.reactionSnippet,'Confirmed reaction reported');

    // Start PGLite TCP socket server with multiple role connections
    wire = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 0, maxConnections: 5 });
    await wire.start();

    const makeWriterClient = () => {
      const c = postgres('postgresql://apip_adr_writer@' + wire!.getServerConn() + '/postgres', {
        max: 1,
        prepare: false,
        onnotice: () => {},
      });
      clients.push(c);
      return c;
    };

    const httpSql = makeWriterClient();
    const casesRepo = {
      snapshot: async (owner: string, id: string, rev: number) =>
        owner === patient && id === caseId && rev === 1 ? piiCase : null,
    } as unknown as GuidedCaseRepository;

    const app = express();
    app.use(express.json());
    app.use(
      '/api/sharing',
      sharingRouter(
        postgresSharingRepository(httpSql),
        casesRepo,
        req => (req.get('Authorization') ? { id: req.get('Authorization')! } : undefined),
        async () => true,
        postgresSharingPoolRepository(httpSql)
      )
    );
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + (server.address() as { port: number }).port;

    const call = (actor: string, path: string, body?: unknown, idempotencyKey = randomUUID()) =>
      fetch(url + '/api/sharing' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Authorization: actor,
          'X-APIP-Account': actor,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

    // 1. Revoked specialist cannot view queue
    assert.equal((await call(revokedSpec, '/queue')).status, 403);

    // 2. Patient creates pooled request via HTTP
    const createRes = await call(patient, '/requests', {
      caseId,
      revision: 1,
      target: 'pool',
      consent: true,
      policyVersion: 'phase3c-c1-v1',
      digest: disclosed.digest,
    });
    assert.equal(createRes.status, 201);
    const poolReqId = (await createRes.json()).request.id as string;

    // 3. Queue shows sanitized metadata to specialists, hides PII
    const qRes = await call(specialistA, '/queue');
    assert.equal(qRes.status, 200);
    const qBody = await qRes.json();
    assert.equal(qBody.queue.length, 1);
    const rawQ = JSON.stringify(qBody);
    assert(!rawQ.includes('ravi.kumar@example.test'));
    assert(!rawQ.includes('98765'));
    assert(!rawQ.includes('Ravi Kumar Patient'));

    // 4. Parallel PostgreSQL client race: two real PG wire connections race to claim
    const raceClientA = makeWriterClient();
    const raceClientB = makeWriterClient();
    const racePoolA = postgresSharingPoolRepository(raceClientA);
    const racePoolB = postgresSharingPoolRepository(raceClientB);

    const [raceA, raceB] = await Promise.allSettled([
      racePoolA.claim(specialistA, poolReqId, randomUUID(), async () => null),
      racePoolB.claim(specialistB, poolReqId, randomUUID(), async () => null),
    ]);
    const wins = [raceA, raceB].filter(r => r.status === 'fulfilled');
    const losses = [raceA, raceB].filter(r => r.status === 'rejected');
    assert.equal(wins.length, 1, 'Exactly one concurrent specialist claim must win');
    assert.equal(losses.length, 1, 'Second concurrent specialist claim must reject');
    assert.match((losses[0] as PromiseRejectedResult).reason.message, /ACTIVE_ASSIGNMENT_CONFLICT/);

    const winner = raceA.status === 'fulfilled' ? specialistA : specialistB;
    const loser = winner === specialistA ? specialistB : specialistA;
    const assignment1Id = (wins[0] as PromiseFulfilledResult<{ request: any }>).value.request.id;

    // 5. Verify zero patient impersonation in audit tables
    const auditActors = await db.query<{ actor: string; action: string }>(
      'select actor::text, action from apip_sharing.audit where request_id = $1',
      [assignment1Id]
    );
    assert.equal(auditActors.rows.length, 1);
    assert.equal(auditActors.rows[0].actor, winner, 'Claim audit actor must be specialist, never impersonating patient');
    assert.equal(auditActors.rows[0].action, 'pool_claim_assignment');

    // 6. Winner sees assignment in /inbox and can release back to queue by assignment ID + version 1
    const inboxWin = await (await call(winner, '/inbox')).json();
    assert.equal(inboxWin.requests.length, 1);
    assert.equal(inboxWin.requests[0].id, assignment1Id);

    const releaseRes = await call(winner, `/queue/${assignment1Id}/release`, {
      expectedVersion: inboxWin.requests[0].version,
    });
    assert.equal(releaseRes.status, 200);

    // 7. Previously losing specialist claims released item from queue cleanly
    const claim2Res = await call(loser, `/queue/${poolReqId}/claim`, {});
    assert.equal(claim2Res.status, 200);
    const claim2Body = await claim2Res.json();
    const assignment2Id = claim2Body.request.id;
    assert.notEqual(assignment2Id, assignment1Id, 'Re-claim must allocate a fresh assignment ID');

    // 8. Verify immutable pool_audit preserved all 4 lifecycle events
    const poolAudit = await db.query<{ action: string; actor: string }>(
      'select action, actor::text from apip_sharing.pool_audit where request_id = $1 order by occurred_at asc',
      [poolReqId]
    );
    assert.deepEqual(
      poolAudit.rows.map(r => r.action),
      ['pool_consent_created', 'specialist_claim', 'specialist_release_to_pool', 'specialist_claim']
    );

    // 9. Patient withdraws WHILE actively claimed by second specialist
    const patientList = await (await call(patient, '/requests')).json();
    const activePoolRow = patientList.requests.find((r: any) => r.id === poolReqId);
    assert(activePoolRow);
    assert.equal(activePoolRow.state, 'active');

    const withdrawRes = await call(patient, `/requests/${poolReqId}/withdraw`, {
      expectedVersion: activePoolRow.version,
    });
    assert.equal(withdrawRes.status, 200);

    // Specialist immediately loses inbox & report access
    const inboxAfterWithdraw = await (await call(loser, '/inbox')).json();
    assert.equal(inboxAfterWithdraw.requests.length, 0);
    assert.equal((await call(loser, `/inbox/${assignment2Id}`)).status, 404);
  } finally {
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
    await Promise.all(clients.map(c => c.end({ timeout: 2 })));
    if (wire) await wire.stop();
    await db.close();
  }
});
