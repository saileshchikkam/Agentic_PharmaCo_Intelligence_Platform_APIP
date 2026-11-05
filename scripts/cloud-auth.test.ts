import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import express from 'express';
import { registerVerifiedAdr, configuredCloudAccount } from '../server/cloud-account';
import { sqliteGuidedRepository } from '../server/adr/repository';
import { readAuthCallback, allowedAuthOrigin, accountDestination } from '../src/features/account/authCallback';

test('callback handles query codes, cancellation, and allowlisted destinations', () => {
  assert.deepEqual(readAuthCallback(new URL('https://dev.example/?apip_auth=1&code=abc')), { code: 'abc' });
  assert.deepEqual(readAuthCallback(new URL('https://dev.example/?apip_auth=1&code=abc#error=access_denied')), { code: null });
  assert.equal(readAuthCallback(new URL('https://dev.example/?code=abc')), null);
  assert.equal(accountDestination('https://evil.example'), '/patient/home');
  assert.equal(accountDestination('adr-report'), '/preview/adr-report');
  assert.equal(allowedAuthOrigin('https://dev.example', 'https://dev.example'), true);
  assert.equal(allowedAuthOrigin('https://other.example', 'https://dev.example'), false);
  assert.equal(allowedAuthOrigin('http://localhost:3000', ''), true);
  assert.throws(() => configuredCloudAccount(express(), { APIP_SUPABASE_URL: 'https://dev.example' }), /incomplete/);
});

test('cloud ADR gate rejects unverified identity and scopes all case endpoints', async () => {
  const [a,b] = [randomUUID(),randomUUID()];
  const db = new DatabaseSync(':memory:');
  db.exec('create table local_users(id text primary key)');
  db.prepare('insert into local_users values (?), (?)').run(a,b);
  const app = express();
  registerVerifiedAdr(app, sqliteGuidedRepository(db), async token => {
    if (token === 'offline') throw Error('fixture outage');
    return token === 'alice' ? { id:a } : token === 'bob' ? { id:b } : null;
  });
  const server = app.listen(0,'127.0.0.1');
  await once(server,'listening');
  const origin = 'http://127.0.0.1:' + (server.address() as {port:number}).port + '/api/account/adr-guided';
  const call = (path: string, token?: string, owner = a, body?: unknown) => fetch(origin + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'X-APIP-Account': owner, 'Content-Type': 'application/json', Cookie: 'apip_local_session=ignored',
      ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try {
    assert.equal((await call('')).status,401);
    assert.equal((await call('','expired')).status,401);
    assert.equal((await call('','offline')).status,503);
    assert.equal((await call('','bob')).status,409);
    const created = await call('','alice',a,{fictionalOnly:true});
    assert.equal(created.status,201);
    const id = '/' + (await created.json()).case.id;
    assert.deepEqual(await (await call('','bob',b)).json(),{cases:[]});
    for (const suffix of ['', '/history', '/command', '/pdf']) {
      const body = ['/command','/pdf'].includes(suffix) ? { expectedRevision:1 } : undefined;
      assert.equal((await call(id + suffix,'bob',b,body)).status,404);
      assert.equal((await call(id + suffix,undefined,a,body)).status,401);
    }
    assert.equal((await call(id,'alice')).status,200);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    db.close();
  }
});
