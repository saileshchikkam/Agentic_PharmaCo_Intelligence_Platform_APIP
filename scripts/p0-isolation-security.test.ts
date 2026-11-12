import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import { registerVerifiedAdr } from '../server/cloud-account';
import { postgresGuidedRepository } from '../server/adr/postgresRepository';
import { postgresSpecialistRepository } from '../server/specialist/postgresRepository';
import { postgresSharingRepository } from '../server/sharing/repository';
import { createSharingPoolRepository, postgresSharingPoolRepository } from '../server/sharing/pool';
import { prepareDisclosure } from '../server/sharing/disclosure';
import { sharingRouter } from '../server/sharing/router';
import type { GuidedCase, Value } from '../src/features/adr/guided/domain';
import type { GuidedCaseRepository } from '../server/adr/repository';

const migrations = [
  '20261105092031_apip_profile_bootstrap.sql',
  '20261105092036_adr_postgres_foundation.sql',
  '20261105092042_adr_command_receipts.sql',
  '20261105093956_apip_restricted_writer_role.sql',
  '20261107152504_adr_historical_pdf_receipts.sql',
  '20261107195900_specialist_identity_foundation.sql',
  '20261107210206_specialist_verified_subject_boundary.sql',
  '20261108123217_adr_consented_sharing.sql',
  '20261111000000_adr_pooled_sharing_queue.sql',
];

const readMigration = (name: string) =>
  readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');

const val = (value: string): Value => ({
  state: 'provided',
  value,
  confirmedAt: new Date().toISOString(),
  source: 'manual',
  statementId: 'fictional-stmt',
});

function hasPdfRuntime(): boolean {
  return Boolean(process.env.APIP_PDF_PYTHON);
}

test('fail-closed runtime prevents silent hosted SQLite fallback and returns 503 POOL_MIGRATION_REQUIRED', async () => {
  const savedPoolFlag = process.env.APIP_POOL_POSTGRES;
  const savedMode = process.env.APIP_ACCOUNT_MODE;
  const savedNodeEnv = process.env.NODE_ENV;
  try {
    delete process.env.APIP_POOL_POSTGRES;
    const fakeSql = {} as postgres.Sql;
    assert.throws(() => createSharingPoolRepository(fakeSql), /POOL_MIGRATION_REQUIRED/);

    process.env.APIP_ACCOUNT_MODE = 'cloud';
    assert.throws(() => createSharingPoolRepository(null), /POOL_SQLITE_FORBIDDEN_IN_CLOUD/);

    process.env.NODE_ENV = 'production';
    delete process.env.APIP_ACCOUNT_MODE;
    assert.throws(() => createSharingPoolRepository(null), /POOL_SQLITE_FORBIDDEN_IN_CLOUD/);
  } finally {
    if (savedPoolFlag === undefined) delete process.env.APIP_POOL_POSTGRES;
    else process.env.APIP_POOL_POSTGRES = savedPoolFlag;
    if (savedMode === undefined) delete process.env.APIP_ACCOUNT_MODE;
    else process.env.APIP_ACCOUNT_MODE = savedMode;
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedNodeEnv;
  }

  const actor = randomUUID();
  const specialist = randomUUID();
  const caseId = randomUUID();
  const fakeCase: GuidedCase = {
    schemaVersion: 1,
    id: caseId,
    revision: 1,
    fictionalOnly: true,
    updatedAt: new Date().toISOString(),
    values: {
      caseType: val('Initial'),
      initials: val('FP'),
      reaction: val('Fictional rash'),
      reporterName: val('Fictional Reporter'),
      'med.m1.name': val('Fictional drug'),
    },
    medications: [{ id: 'm1', kind: 'suspect' }],
    statements: [],
    proposals: [],
    providerStatus: 'manual',
  };
  const disclosure = prepareDisclosure(fakeCase);
  const directCreateSeen: unknown[] = [];
  const sharingRepo = {
    operation: async (_actor: string, op: string, id: string | null, body: unknown) => {
      if (op === 'count') return { count: 0 };
      if (op === 'create') {
        directCreateSeen.push(body);
        return { id: id ?? randomUUID(), state: 'active' };
      }
      return [];
    },
  };
  const casesRepo = {
    snapshot: async (owner: string, id: string, rev: number) =>
      owner === actor && id === caseId && rev === 1 ? fakeCase : null,
  } as unknown as GuidedCaseRepository;

  const app = express();
  app.use(express.json());
  app.use(
    '/api/sharing',
    sharingRouter(sharingRepo, casesRepo, req => (req.get('Authorization') ? { id: req.get('Authorization')! } : undefined), async () => true, null)
  );
  let server!: ReturnType<express.Express['listen']>;
  await new Promise<void>(resolve => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  assert(addr && typeof addr === 'object');
  const base = 'http://127.0.0.1:' + addr.port + '/api/sharing';
  const call = (who: string, path: string, body?: unknown) =>
    fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: who,
        'X-APIP-Account': who,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  try {
    const qRes = await call(specialist, '/queue');
    assert.equal(qRes.status, 503);
    assert.equal((await qRes.json()).error, 'POOL_MIGRATION_REQUIRED');

    const pCreateRes = await call(actor, '/requests', {
      caseId,
      revision: 1,
      target: 'pool',
      consent: true,
      policyVersion: 'phase3c-c1-v1',
      digest: disclosure.digest,
    });
    assert.equal(pCreateRes.status, 503);
    assert.equal((await pCreateRes.json()).error, 'POOL_MIGRATION_REQUIRED');

    const claimRes = await call(specialist, `/queue/${randomUUID()}/claim`, {});
    assert.equal(claimRes.status, 503);
    assert.equal((await claimRes.json()).error, 'POOL_MIGRATION_REQUIRED');

    const releaseRes = await call(specialist, `/queue/${randomUUID()}/release`, { expectedVersion: 1 });
    assert.equal(releaseRes.status, 503);
    assert.equal((await releaseRes.json()).error, 'POOL_MIGRATION_REQUIRED');

    // Direct 3C-B sharing continues operating when pool is null
    const directRes = await call(actor, '/requests', {
      caseId,
      revision: 1,
      specialist,
      consent: true,
      policyVersion: 'phase3c-b-v1',
      digest: disclosure.digest,
    });
    assert.equal(directRes.status, 201);
    assert.equal(directCreateSeen.length, 1);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('multi-actor isolation matrix across profiles, guided ADR cases, specialist states, direct vs pool overlap, and PDFs', { timeout: 60000 }, async () => {
  const db = new PGlite();
  const [
    patientA,
    patientB,
    specApproved1,
    specApproved2,
    specApproved3,
    specUnapproved,
    specRevoked,
    specExpired,
  ] = Array.from({ length: 8 }, () => randomUUID());

  let wire: PGLiteSocketServer | undefined;
  let server: ReturnType<express.Express['listen']> | undefined;
  const clients: postgres.Sql[] = [];

  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role managed_auth_owner nologin;
      create schema auth authorization managed_auth_owner;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create role migration_operator nologin createrole in role authenticated, anon;
      grant anon, authenticated to migration_operator with admin option;
      grant create on database postgres to migration_operator;
      grant create, usage on schema public to migration_operator;
      grant usage on schema auth to migration_operator;
      grant references on auth.users to migration_operator;
    `);
    for (const id of [patientA, patientB, specApproved1, specApproved2, specApproved3, specUnapproved, specRevoked, specExpired]) {
      await db.query('insert into auth.users values ($1)', [id]);
    }
    await db.exec('set role migration_operator');
    for (const m of migrations) {
      await db.exec(await readMigration(m));
    }
    await db.exec('reset role');

    // Verify pooled queue least privilege and no public EXECUTE grants
    assert.equal(
      (await db.query<{ ok: boolean }>("select has_schema_privilege('apip_sharing_executor', 'auth', 'usage') ok")).rows[0].ok,
      false
    );
    assert.equal(
      (await db.query<{ ok: boolean }>("select has_function_privilege('apip_adr_writer', 'apip_sharing.pool_operation(text,uuid,jsonb,uuid)', 'EXECUTE') ok")).rows[0].ok,
      true
    );
    for (const r of ['anon', 'authenticated']) {
      assert.equal(
        (await db.query<{ ok: boolean }>("select has_function_privilege($1, 'apip_sharing.pool_operation(text,uuid,jsonb,uuid)', 'EXECUTE') ok", [r])).rows[0].ok,
        false
      );
      for (const tbl of ['pooled_requests', 'pool_audit', 'pool_receipts']) {
        assert.equal(
          (await db.query<{ ok: boolean }>("select has_table_privilege($1, $2, 'SELECT,INSERT,UPDATE,DELETE') ok", [r, 'apip_sharing.' + tbl])).rows[0].ok,
          false
        );
      }
    }
    for (const r of ['anon', 'authenticated', 'apip_adr_writer']) {
      for (const fullTable of [
        'apip_adr.cases',
        'apip_adr.revisions',
        'apip_adr.pdf_exports',
        'apip_identity.applications',
        'apip_sharing.requests',
        'apip_sharing.pooled_requests',
      ]) {
        if (r === 'authenticated' && fullTable.startsWith('apip_adr.')) continue;
        assert.equal(
          (await db.query<{ ok: boolean }>("select has_table_privilege($1, $2, 'INSERT,UPDATE,DELETE') ok", [r, fullTable])).rows[0].ok,
          false,
          `${r} must not write directly to ${fullTable}`
        );
      }
    }

    // Verify patient_profiles RLS across SELECT / INSERT / UPDATE / DELETE
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [patientA]);
    await db.exec('set role authenticated');
    await db.query(
      "insert into public.patient_profiles (user_id, display_name, birth_date, relationship, share_adr) values ($1, 'Patient A Fictional', '1991-02-03', 'self', false)",
      [patientA]
    );
    assert.equal((await db.query('select * from public.patient_profiles')).rows.length, 1);

    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [patientB]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select * from public.patient_profiles')).rows.length, 0);
    await assert.rejects(
      db.query("insert into public.patient_profiles (user_id, display_name, birth_date, relationship) values ($1, 'Spoofed', '1991-02-03', 'self')", [patientA]),
      /row-level security policy/
    );
    await db.query("update public.patient_profiles set display_name='Tampered' where user_id=$1", [patientA]);
    await db.query('delete from public.patient_profiles where user_id=$1', [patientA]);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    assert.equal(
      (await db.query<{ display_name: string }>('select display_name from public.patient_profiles where user_id=$1', [patientA])).rows[0]?.display_name,
      'Patient A Fictional'
    );

    // Seed specialist states independently of auth.users email/metadata
    for (const [id, state, daysOffset] of [
      [specApproved1, 'APPROVED', '+30 days'],
      [specApproved2, 'APPROVED', '+30 days'],
      [specApproved3, 'APPROVED', '+30 days'],
      [specUnapproved, 'SUBMITTED', '+30 days'],
      [specRevoked, 'REVOKED', '+30 days'],
      [specExpired, 'APPROVED', '-1 day'],
    ] as const) {
      await db.query(
        `insert into apip_identity.applications (id, owner_id, version, state, profile, valid_until) values ($1, $2, 1, $3, $4, now() + $5::interval)`,
        [
          randomUUID(),
          id,
          state,
          JSON.stringify({
            fullName: 'Fictional Spec ' + id.slice(0, 6),
            category: 'Pharmacist',
            qualification: 'PharmD',
            organization: 'Synthetic Hospital',
          }),
          daysOffset,
        ]
      );
    }

    wire = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 0, maxConnections: 6 });
    await wire.start();
    const makeWriter = () => {
      const sql = postgres('postgresql://apip_adr_writer@' + wire!.getServerConn() + '/postgres', {
        max: 1,
        prepare: false,
        onnotice: () => {},
      });
      clients.push(sql);
      return sql;
    };
    const appSql = makeWriter();

    const app = express();
    app.use(express.json());
    registerVerifiedAdr(
      app,
      postgresGuidedRepository(appSql),
      async token => ({ id: token }),
      null,
      false,
      postgresSpecialistRepository(appSql),
      postgresSharingRepository(appSql),
      postgresSharingPoolRepository(appSql)
    );
    await new Promise<void>(resolve => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server!.address();
    assert(addr && typeof addr === 'object');
    const url = 'http://127.0.0.1:' + addr.port;

    const reqAs = (actor: string, path: string, body?: unknown, accountHeader = actor) =>
      fetch(url + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Authorization: 'Bearer ' + actor,
          'X-APIP-Account': accountHeader,
          'Content-Type': 'application/json',
          'Idempotency-Key': randomUUID(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

    // Verify capabilities strictly enforce APPROVED + non-expired
    for (const approvedId of [specApproved1, specApproved2, specApproved3]) {
      const cap = await (await reqAs(approvedId, '/api/account/capabilities')).json();
      assert.equal(cap.specialistWorkspace, true);
      assert.equal(cap.identityAdministration, false);
    }
    for (const ineligible of [patientA, patientB, specUnapproved, specRevoked, specExpired]) {
      const cap = await (await reqAs(ineligible, '/api/account/capabilities')).json();
      assert.equal(cap.specialistWorkspace, false);
      assert.equal((await reqAs(ineligible, '/api/sharing/queue')).status, 403);
      assert.equal((await reqAs(ineligible, '/api/sharing/inbox')).status, 403);
    }

    // Header impersonation rejected with 409 ACCOUNT_CHANGED
    assert.equal((await reqAs(patientB, '/api/account/capabilities', undefined, patientA)).status, 409);

    // Patient A creates Guided ADR case and confirms mandatory fields (rev 1)
    let cA = (await (await reqAs(patientA, '/api/account/adr-guided', { fictionalOnly: true })).json()).case as GuidedCase;
    const medId = cA.medications[0].id;
    for (const [key, value] of [
      ['caseType', 'Initial'],
      ['initials', 'FA'],
      ['reaction', 'Fictional acute urticaria by Fictional Patient A (+91 98765 00001, patA@example.test)'],
      ['reporterName', 'Fictional Patient A'],
      ['email', 'patA@example.test'],
      ['med.' + medId + '.name', 'Fictional Cefixime'],
    ]) {
      const step = await reqAs(patientA, `/api/account/adr-guided/${cA.id}/command`, {
        expectedRevision: cA.revision,
        command: { type: 'confirm', key, value },
      });
      assert.equal(step.status, 200);
      cA = (await step.json()).case;
    }

    // Patient B creates separate Case B1 and cannot touch Case A1
    const cB = (await (await reqAs(patientB, '/api/account/adr-guided', { fictionalOnly: true })).json()).case as GuidedCase;
    assert.notEqual(cA.id, cB.id);
    assert.equal((await reqAs(patientB, `/api/account/adr-cases/${cA.id}`)).status, 404);
    assert.equal(
      (await reqAs(patientB, `/api/account/adr-guided/${cA.id}/command`, {
        expectedRevision: cA.revision,
        command: { type: 'confirm', key: 'initials', value: 'XX' },
      })).status,
      404
    );

    // Check transaction-local claim reset on pooled writer connection after error/rollback and success
    const subjectCheck = await appSql.begin(async tx => {
      return await tx<{ sub: string | null }[]>`select nullif(current_setting('request.jwt.claim.sub', true), '') as sub`;
    });
    assert.equal(subjectCheck[0]?.sub ?? null, null, 'Transaction-local JWT subject must never leak across pooled queries');

    // Stage 2.3 null p_id check in SQL pool_operation
    for (const op of ['pool_get', 'pool_claim', 'pool_release', 'pool_withdraw']) {
      await assert.rejects(
        appSql.begin(async tx => {
          await tx`select set_config('request.jwt.claim.sub', ${specApproved1}, true)`;
          return await tx`select apip_sharing.pool_operation(${op}, null, '{}'::jsonb, ${randomUUID()}::uuid)`;
        }),
        /INVALID_REQUEST/
      );
    }

    // Patient A shares Case A1 revision 1 into the pooled queue
    const discRev = cA.revision;
    const disc = await (await reqAs(patientA, '/api/sharing/disclosure', { caseId: cA.id, revision: discRev })).json();
    const poolCreateRes = await reqAs(patientA, '/api/sharing/requests', {
      caseId: cA.id,
      revision: discRev,
      target: 'pool',
      consent: true,
      policyVersion: 'phase3c-c1-v1',
      digest: disc.disclosure.digest,
    });
    assert.equal(poolCreateRes.status, 201);
    const poolReqId = (await poolCreateRes.json()).request.id as string;

    // Direct 3C-B share on same active/pending case blocked by overlap trigger
    await reqAs(specApproved1, '/api/sharing/directory', { optedIn: true });
    const overlapDirectRes = await reqAs(patientA, '/api/sharing/requests', {
      caseId: cA.id,
      revision: discRev,
      specialist: specApproved1,
      consent: true,
      policyVersion: 'phase3c-b-v1',
      digest: disc.disclosure.digest,
    });
    assert.equal(overlapDirectRes.status, 409);
    assert.equal((await overlapDirectRes.json()).error, 'ACTIVE_ASSIGNMENT_CONFLICT');

    // 3 approved specialists race concurrently; exactly 1 claims
    const race = await Promise.all([
      reqAs(specApproved1, `/api/sharing/queue/${poolReqId}/claim`, {}),
      reqAs(specApproved2, `/api/sharing/queue/${poolReqId}/claim`, {}),
      reqAs(specApproved3, `/api/sharing/queue/${poolReqId}/claim`, {}),
    ]);
    assert.deepEqual(race.map(r => r.status).sort(), [200, 409, 409]);
    const winnerIdx = race.findIndex(r => r.status === 200);
    const specs = [specApproved1, specApproved2, specApproved3];
    const winner = specs[winnerIdx];
    const losers = specs.filter((_, i) => i !== winnerIdx);
    const winnerBody = await race[winnerIdx].json();
    const assignmentId = winnerBody.request.id as string;

    // Losers see neither queue row nor assigned report
    for (const loser of losers) {
      assert.equal((await (await reqAs(loser, '/api/sharing/queue')).json()).queue.length, 0);
      assert.equal((await reqAs(loser, `/api/sharing/inbox/${assignmentId}`)).status, 404);
    }

    // Patient A edits Case A1 to newer revision; specialist remains pinned to exact consented revision
    const nextEdit = await reqAs(patientA, `/api/account/adr-guided/${cA.id}/command`, {
      expectedRevision: cA.revision,
      command: { type: 'confirm', key: 'initials', value: 'A2' },
    });
    assert.equal(nextEdit.status, 200);
    const revSnap = await (await reqAs(winner, `/api/sharing/inbox/${assignmentId}`)).json();
    assert.equal(revSnap.revision, discRev);

    // Exact-revision PDF snapshot remains pinned to consented revision even after patient edits rev + 1
    const snapshotData = await postgresSharingRepository(appSql).operation(winner, 'pdf_snapshot', assignmentId, {}, randomUUID());
    assert.equal(snapshotData.revision, discRev);
    assert.equal(snapshotData.values.initials.value, 'FA');

    if (hasPdfRuntime()) {
      const pdfRes = await reqAs(winner, `/api/sharing/inbox/${assignmentId}/preview`, {});
      assert.equal(pdfRes.status, 200);
      assert(pdfRes.headers.get('content-type')?.includes('application/pdf'));
      const pdfBytes = Buffer.from(await pdfRes.arrayBuffer());
      assert(pdfBytes.length > 5000);
    }

    // Revoking active winning specialist immediately blocks access
    await db.query("update apip_identity.applications set state='REVOKED' where owner_id=$1", [winner]);
    assert.equal((await reqAs(winner, '/api/sharing/inbox')).status, 403);
    assert.equal((await reqAs(winner, '/api/sharing/queue')).status, 403);
    assert.equal((await reqAs(winner, `/api/sharing/inbox/${assignmentId}`)).status, 404);
    await db.query("update apip_identity.applications set state='APPROVED' where owner_id=$1", [winner]);

    // Release back to queue, second specialist claims, patient withdraws -> second specialist loses access
    assert.equal((await reqAs(winner, `/api/sharing/queue/${assignmentId}/release`, { expectedVersion: 1 })).status, 200);
    const reclaimRes = await reqAs(losers[0], `/api/sharing/queue/${poolReqId}/claim`, {});
    assert.equal(reclaimRes.status, 200);
    const pReqs = (await (await reqAs(patientA, '/api/sharing/requests')).json()).requests as any[];
    const currentRow = pReqs.find(r => r.id === poolReqId);
    assert.equal(currentRow.state, 'active');
    assert.equal((await reqAs(patientA, `/api/sharing/requests/${poolReqId}/withdraw`, { expectedVersion: currentRow.version })).status, 200);
    assert.equal((await reqAs(losers[0], `/api/sharing/inbox/${(await reclaimRes.json()).request.id}`)).status, 404);

    // Immutable pool_audit cannot be tampered
    await db.exec('reset role');
    await assert.rejects(db.exec('update apip_sharing.pool_audit set action=\'tampered\''), /IMMUTABLE/);
    await assert.rejects(db.exec('delete from apip_sharing.pool_audit'), /IMMUTABLE/);
  } finally {
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
    await Promise.all(clients.map(c => c.end({ timeout: 2 })));
    if (wire) await wire.stop();
    await db.close();
  }
});
