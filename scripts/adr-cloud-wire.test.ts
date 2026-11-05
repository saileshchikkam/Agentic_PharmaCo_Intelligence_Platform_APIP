import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { postgresGuidedRepository } from '../server/adr/postgresRepository';
import { registerVerifiedAdr } from '../server/cloud-account';

test('ADR API over the PostgreSQL wire: retries, ownership, races and outage', { timeout: 60000 }, async () => {
  const db = new PGlite();
  const [alice, bob] = [randomUUID(), randomUUID()];
  await db.exec(`create role anon; create role authenticated; create role adr_writer in role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;`);
  await db.query('insert into auth.users values ($1), ($2)', [alice,bob]);
  for (const file of ['20261105071028_adr_postgres_foundation', '20261105074041_adr_command_receipts']) {
    await db.exec(await readFile(new URL('../supabase/migrations/' + file + '.sql', import.meta.url), 'utf8'));
  }
  await db.exec('grant execute on all functions in schema apip_adr to adr_writer');
  const socket = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 0, maxConnections: 4 });
  await socket.start();
  const sql = postgres('postgresql://postgres@' + socket.getServerConn() + '/postgres', {
    max: 3, prepare: false, connect_timeout: 2, onnotice: () => {},
  });
  // The socket fixture connects as its bootstrap role. Apply the real restricted role per transaction.
  const restricted = {
    begin: (run: (tx: postgres.TransactionSql) => Promise<unknown>) => sql.begin(async tx => {
      await tx`set local role adr_writer`;
      return run(tx);
    }),
  } as unknown as postgres.Sql;
  let available = true;
  const app = express();
  registerVerifiedAdr(app, postgresGuidedRepository(restricted), async token => token === 'alice' ? { id: alice }
    : token === 'bob' ? { id: bob } : null, async () => {
    if (!available) throw Error('Fixture provider outage');
    return { proposals: [{ key: 'reaction', quote: 'Fictional rash', value: 'Fictional rash' }] };
  });
  const http = app.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const origin = 'http://127.0.0.1:' + (http.address() as {port:number}).port + '/api/account/adr-guided';
  const call = (path: string, body?: unknown, key?: string, actor = 'alice') => fetch(origin + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer ' + actor, 'X-APIP-Account': actor === 'alice' ? alice : bob,
      'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try {
    assert.equal((await call('', undefined, undefined, 'invalid')).status, 401);
    assert.equal((await call('', { fictionalOnly: true })).status, 400);
    const id = randomUUID();
    const create = () => call('', { fictionalOnly: true }, id);
    for (const response of await Promise.all([create(), create()])) {
      assert.equal(response.status, 201);
      assert.equal((await response.json()).case.id, id);
    }
    assert.equal((await call('/' + id, undefined, undefined, 'bob')).status, 404);
    const command = (expectedRevision: number, command: object, key = randomUUID()) =>
      call('/' + id + '/command', { expectedRevision, command }, key);
    const key = randomUUID();
    const results = await Promise.all([
      command(1, { type: 'confirm', key: 'age', value: null }, key),
      command(1, { value: null, key: 'age', type: 'confirm' }, key),
    ]);
    assert.deepEqual(results.map(r => r.status), [200, 200]);
    assert.deepEqual(await results[0].json(), await results[1].json());
    assert.equal((await command(1, { type: 'confirm', key: 'age', value: '30' }, key)).status, 409);
    const race = await Promise.all([
      command(2, { type: 'add_medication', kind: 'suspect' }),
      command(2, { type: 'add_medication', kind: 'concomitant' }),
    ]);
    assert.deepEqual(race.map(r => r.status).sort(), [200, 409]);
    const described = await command(3, { type: 'describe', text: 'Fictional rash' });
    assert.equal((await described.json()).case.proposals[0].value, 'Fictional rash');
    available = false;
    const fallback = await command(4, { type: 'describe', text: 'Fictional provider outage' });
    assert.equal((await fallback.json()).case.providerStatus, 'unavailable_or_invalid');
    const history = await (await call('/' + id + '/history?limit=2')).json();
    assert.deepEqual(history, { versions: [{ revision: 5 }, { revision: 4 }], nextBefore: 4 });
    assert.equal((await call('/' + id + '/pdf', { expectedRevision: 5 }, undefined, 'bob')).status, 404);
    if (existsSync('docs/adr/templates/ADRRF_2.pdf')) {
      const answered = await command(5, { type: 'confirm', key: 'reaction', value: 'Fictional rash' });
      assert.equal(answered.status, 200);
      const started = performance.now();
      const pdf = await call('/' + id + '/pdf', { expectedRevision: 6 });
      assert.equal(pdf.status, 200);
      const bytes = Buffer.from(await pdf.arrayBuffer());
      assert.equal(pdf.headers.get('X-APIP-Revision'), '6');
      execFileSync(process.env.APIP_PDF_PYTHON || 'python', ['-c',
        "import io,sys; from pypdf import PdfReader; p=PdfReader(io.BytesIO(sys.stdin.buffer.read())); assert p.get_fields()['Text Field8']['/V']=='Fictional rash'"], { input: bytes });
      console.log('Wire PDF: ' + bytes.length + ' bytes, ' + Math.round(performance.now() - started) + ' ms including independent PDF parsing');
    } else {
      console.log('Wire PDF skipped: authorized template absent');
    }
    assert.equal((await call('', { fictionalOnly: true }, randomUUID())).status, 201);
    const first = await (await call('?limit=1')).json();
    assert.equal(first.cases.length, 1);
    assert.equal((await (await call('?limit=1&after=' + first.nextCursor)).json()).cases[0].id, id);
    assert.deepEqual((await (await call('?limit=1', undefined, undefined, 'bob')).json()).cases, []);
    const reads = await Promise.all(Array.from({length: 12}, () => call('/' + id)));
    assert.ok(reads.every(r => r.status === 200));
    console.log('12 parallel owner-scoped reads completed with pool max 3 (socket fixture serializes transactions)');
    await socket.stop();
    assert.equal((await call('/' + id)).status, 503);
    await socket.start();
    assert.equal((await (await call('/' + id)).json()).case.revision, existsSync('docs/adr/templates/ADRRF_2.pdf') ? 6 : 5);
  } finally {
    await new Promise<void>(resolve => http.close(() => resolve()));
    await sql.end({ timeout: 1 });
    await socket.stop();
    await db.close();
  }
});
