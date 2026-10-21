import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import express, { type Request } from 'express';
import { createApiApp } from '../server';
import { readRuntimeConfig } from '../server/runtime';
import { trustedLocalRequest } from '../server/local-request';
import { legacyAccess } from '../server/legacy-access';
import { emptyProfile } from '../src/features/account/profile';
import { randomUUID } from 'node:crypto';
// @ts-expect-error Node launcher is intentionally dependency-free JavaScript.
import { launchConfiguration } from './start-server.mjs';

const routes = ['report-extract', 'validate', 'knowledge-rag', 'causality', 'orchestrate'];
const config = (mode = 'development', opt = '0') => readRuntimeConfig({ NODE_ENV: mode, APIP_ENABLE_LEGACY_AGENTS: opt });
const origin = 'http://localhost:3000';
const localHeaders = { Host: 'localhost:3000', Origin: origin, 'Content-Type': 'application/json' };

async function listen(app: express.Express) {
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const port = (server.address() as { port: number }).port;
  const send = (path: string, headers: Record<string, string> = localHeaders, body = '{}', method = 'POST') => new Promise<{ status: number; headers: Record<string, unknown>; body: any }>((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, headers }, res => {
      let text = ''; res.on('data', chunk => text += chunk); res.on('end', () => {
        try { resolve({ status: res.statusCode!, headers: res.headers, body: text ? JSON.parse(text) : null }); } catch (error) { reject(error); }
      });
    }); req.on('error', reject); req.end(body);
  });
  return { send, close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}

test('runtime selection fails closed and production never enables agents', () => {
  for (const NODE_ENV of [undefined, '', 'test', 'Production']) assert.throws(() => readRuntimeConfig({ NODE_ENV }));
  assert.equal(config().legacyAgentsEnabled, false);
  assert.equal(config('development', '1').legacyAgentsEnabled, true);
  assert.equal(config('production', '1').legacyAgentsEnabled, false);
  assert.equal(config().host, '127.0.0.1');
  assert.throws(() => readRuntimeConfig({ NODE_ENV: 'development', APIP_HOST: '0.0.0.0' }));
  assert.throws(() => readRuntimeConfig({ NODE_ENV: 'development', APIP_PORT: '8080' }));
  assert.throws(() => readRuntimeConfig({ NODE_ENV: 'production', APIP_PORT: 'NaN' }));
  assert.throws(() => readRuntimeConfig({ NODE_ENV: 'development', APIP_ENABLE_LEGACY_AGENTS: 'true' }));
  assert.equal(readRuntimeConfig({ NODE_ENV: 'production', APIP_HOST: '0.0.0.0', APIP_PORT: '8080' }).port, 8080);
  assert.equal(launchConfiguration('development', {}).env.NODE_ENV, 'development');
  assert.deepEqual(launchConfiguration('production', {}).args, ['dist/server.cjs']);
  assert.throws(() => launchConfiguration('development', { NODE_ENV: 'production' }));
  assert.throws(() => launchConfiguration(undefined, {}));
});

test('socket, exact Host and required Origin establish local trust; forwarding headers cannot', () => {
  const req = (address: string, headers = localHeaders) => ({ socket: { remoteAddress: address }, get: (key: string) => Object.entries(headers).find(([name]) => name.toLowerCase() === key.toLowerCase())?.[1] }) as unknown as Request;
  assert.equal(trustedLocalRequest(req('192.168.1.20'), 3000, true), false);
  assert.equal(trustedLocalRequest(req('127.0.0.1'), 3000, true), true);
  assert.equal(trustedLocalRequest(req('::ffff:127.0.0.1'), 3000, true), true);
  assert.equal(trustedLocalRequest(req('127.0.0.1', { ...localHeaders, Host: 'untrusted.example:3000' }), 3000, true), false);
  assert.equal(trustedLocalRequest(req('127.0.0.1', { ...localHeaders, Origin: 'null' }), 3000, true), false);
  let invoked = false;
  let status = 0;
  legacyAccess(config('development', '1'))(req('192.168.1.20'), { setHeader() {}, status(code: number) { status = code; return this; }, json() {} } as any, () => { invoked = true; });
  assert.equal(status, 403); assert.equal(invoked, false);
});

test('all legacy routes block before providers; explicit local opt-in preserves isolated account and MedAssist paths', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'apip-legacy-security-'));
  let providers = 0;
  let inference = 0;
  try {
    for (const runtime of [config(), config('development', '1'), config('production', '1')]) {
      const service = createApiApp(runtime, {
        accountFile: join(dir, 'accounts.sqlite'),
        geminiFactory: () => { providers++; return null; },
        medassist: { fetchImpl: (async () => { inference++; return new Response(JSON.stringify({ message: { content: JSON.stringify({ concern: 'Fictional cough', duration: null, impact: null, changes: null }) } })); }) as typeof fetch },
      });
      const http = await listen(service.app);
      try {
        for (const route of routes) {
          const response = await http.send(`/api/agents/${route}`, runtime.legacyAgentsEnabled ? { ...localHeaders, Origin: 'https://untrusted.example' } : localHeaders, '{invalid-json');
          assert.equal(response.status, runtime.legacyAgentsEnabled ? 403 : 404);
          assert.equal(response.headers['access-control-allow-origin'], undefined);
        }
        assert.equal(providers, 0); assert.equal(inference, 0);
        if (runtime.legacyAgentsEnabled) {
          for (const headers of [{ ...localHeaders, Host: 'evil.example:3000' }, { Host: 'localhost:3000', 'Content-Type': 'application/json' }]) {
            assert.equal((await http.send('/api/agents/report-extract', headers, JSON.stringify({ narrative: 'Fictional text' }))).status, 403);
          }
          const valid = await http.send('/api/agents/validate', localHeaders);
          assert.equal(valid.status, 200); assert.equal(valid.body.experimentalOnly, true); assert.equal(valid.body.clinicalUse, false);
          assert.equal(valid.headers['x-apip-clinical-use'], 'prohibited');
          assert.equal((await http.send('/api/agents/validate', localHeaders, 'x'.repeat(25000))).status, 413);
          const extract = await http.send('/api/agents/report-extract', localHeaders, JSON.stringify({ narrative: 'Fictional example only.' }));
          assert.equal(extract.status, 200); assert.equal(extract.body.clinicalUse, false);
          assert.equal(providers, 1); providers = 0;
        }
        if (runtime.mode === 'development' && !runtime.legacyAgentsEnabled) {
          const response = await http.send('/api/medassist/structure', localHeaders, JSON.stringify({ fictionalOnly: true, language: 'en', answers: { concern: 'Fictional cough', duration: null, impact: null, changes: null } }));
          assert.equal(response.status, 200); assert.equal(response.body.assessment.urgency, 'not_assessed');
          assert.equal(inference, 1); inference = 0;
          assert.equal((await http.send('/api/account/session', localHeaders, '', 'GET')).status, 200);
          assert.equal((await http.send('/api/account/profile', localHeaders, '', 'GET')).status, 401);
          assert.equal((await http.send('/api/account/drafts', localHeaders, '', 'GET')).status, 401);
          const signup = await http.send('/api/account/signup', localHeaders, JSON.stringify({ email: `${randomUUID()}@example.test`, password: randomUUID() }));
          assert.equal(signup.status, 201);
          const cookie = (signup.headers['set-cookie'] as string[])[0].split(';')[0];
          const authenticated = { ...localHeaders, Cookie: cookie, 'X-APIP-Account': signup.body.user.id };
          assert.equal((await http.send('/api/account/profile', authenticated, JSON.stringify({ profile: { ...emptyProfile(), display_name: 'Fictional Person', birth_date: '1990-01-01' }, expectedRevision: null }))).status, 200);
          assert.equal((await http.send('/api/account/profile', authenticated, '', 'GET')).body.profile.display_name, 'Fictional Person');
          assert.equal((await http.send('/api/account/drafts/save', authenticated, JSON.stringify({ id: randomUUID(), fictionalOnly: true, expectedRevision: null, status: 'draft', statements: { source: 'reporter', medicineName: null, dose: null, onset: null, reaction: '' } }))).status, 200);
          assert.equal((await http.send('/api/account/drafts', authenticated, '', 'GET')).body.drafts.length, 1);
        }
        if (runtime.mode === 'production') {
          assert.equal((await http.send('/api/account/session', localHeaders, '', 'GET')).status, 404);
          assert.equal((await http.send('/api/account/signup', localHeaders)).status, 404);
        }
      } finally { await http.close(); service.close(); }
    }
  } finally {
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + '\\') || resolve(dir).startsWith(resolve(tmpdir()) + '/'));
    assert.ok(dir.includes('apip-legacy-security-'));
    await rm(dir, { recursive: true, force: true });
  }
});
