import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes, randomUUID } from 'node:crypto';
import { registerLocalAccount } from '../server/local-account';
import { emptyProfile } from '../src/features/account/profile';
import { validateDraftCommand, readAccountDraft } from '../src/features/adr/accountDraft';

test('ADR storage distinguishes unfinished, confirmed, unknown and unsupported fields', () => {
  const command = { id: randomUUID(), fictionalOnly: true, expectedRevision: null, status: 'draft',
    statements: { source: 'reporter', medicineName: null, dose: null, reaction: '', onset: null } };
  assert.notEqual(validateDraftCommand(command), null);
  assert.equal(validateDraftCommand({ ...command, status: 'user-confirmed' }), null);
  assert.equal(validateDraftCommand({ ...command, fictionalOnly: false }), null);
  assert.equal(validateDraftCommand({ ...command, user_id: 'forged-owner' }), null);
  assert.equal(validateDraftCommand({ ...command, expectedRevision: -1 }), null);
  assert.equal(validateDraftCommand({ ...command, statements: { ...command.statements, medicineName: '' } }), null);
  assert.equal(readAccountDraft({}), null);
});

test('local account service refuses production registration', () => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    assert.throws(() => registerLocalAccount(express()), /development-only/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('real local HTTP auth: durable profiles, isolated accounts, cookies, expiry, logout and invalid input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'apip-auth-test-'));
  const file = join(dir, 'accounts.sqlite');
  let time = Date.now();
  const boot = async () => {
    const app = express();
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const address = server.address() as { port: number };
    const service = registerLocalAccount(app, { file, now: () => time, originPort: address.port });
    return { service, server, url: `http://127.0.0.1:${address.port}/api/account/` };
  };
  let runtime = await boot();
  const call = async (endpoint: string, body?: unknown, cookie = '', id?: string, origin?: string) => {
    const response = await fetch(runtime.url + endpoint, { method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: origin ?? new URL(runtime.url).origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), Cookie: cookie, ...(id ? { 'X-APIP-Account': id } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  };
  const stop = async () => { await new Promise<void>((resolve, reject) => runtime.server.close(e => e ? reject(e) : resolve())); runtime.service.close(); };
  try {
    const password = randomBytes(24).toString('base64url');
    assert.equal((await call('signup', { email: 'first@example.test', password: 'short' })).status, 400);
    assert.equal((await call('signup', { email: 'first@example.test', password }, '', undefined, 'https://unrelated.example')).status, 403);
    const first = await call('signup', { email: 'first@example.test', password });
    assert.equal(first.status, 201);
    assert.match(first.cookie!, /HttpOnly/i); assert.match(first.cookie!, /SameSite=Strict/i);
    const cookie = first.cookie!.split(';')[0], id = first.body.user.id;
    const stored = runtime.service.db.prepare('SELECT password_hash, salt FROM local_users WHERE id=?').get(id)!;
    assert.notEqual(stored.password_hash, password); assert.equal(String(stored.salt).length, 32);
    const token = cookie.split('=')[1];
    assert.equal(runtime.service.db.prepare('SELECT token_hash FROM local_sessions WHERE token_hash=?').get(token), undefined);
    assert.equal((await call('session', undefined, cookie)).body.user.id, id);
    assert.equal((await call('profile', undefined, '', id)).status, 401);
    const profile = { ...emptyProfile(), display_name: 'Fictional Adult', birth_date: '1990-01-01', conditions: 'Fictional history' };
    const saved = await call('profile', { profile, expectedRevision: null }, cookie, id);
    assert.equal(saved.status, 200); assert.equal(saved.body.profile.revision, 1);
    assert.equal((await call('profile', { profile, expectedRevision: null }, cookie, id)).status, 409);
    assert.equal((await call('profile', { profile: { ...profile, user_id: id }, expectedRevision: 1 }, cookie, id)).status, 400);
    assert.equal((await call('profile', { profile: { ...profile, birth_date: new Date(time).toISOString().slice(0, 10) }, expectedRevision: 1 }, cookie, id)).status, 400);
    const second = await call('signup', { email: 'second@example.test', password });
    assert.equal(second.status, 201);
    const otherCookie = second.cookie!.split(';')[0], otherId = second.body.user.id;
    assert.equal((await call('profile', undefined, otherCookie, otherId)).body.profile, null);
    assert.equal((await call('profile', undefined, otherCookie, id)).status, 409);
    assert.equal((await call('profile', { profile, expectedRevision: null }, otherCookie, id)).status, 409);
    assert.equal((await call('profile/delete', { expectedRevision: 1 }, otherCookie, id)).status, 409);
    // Reproduce an existing v1 account/profile database before the additive draft-store upgrade.
    runtime.service.db.exec('DROP TABLE local_adr_drafts; PRAGMA user_version=1;');
    await stop(); runtime = await boot();
    assert.equal(runtime.service.db.prepare('PRAGMA user_version').get()?.user_version, 2);
    assert.equal((await call('profile', undefined, cookie, id)).body.profile.conditions, profile.conditions);
    const draftId = randomUUID();
    const unfinished = { fictionalOnly: true, id: draftId, expectedRevision: null, status: 'draft',
      statements: { source: 'reporter', medicineName: null, dose: null, reaction: '', onset: null } };
    assert.equal((await call('drafts', undefined, '', id)).status, 401);
    const created = await call('drafts/save', unfinished, cookie, id);
    assert.equal(created.status, 200); assert.equal(created.body.draft.revision, 1);
    assert.equal(created.body.draft.confirmedAt, null);
    assert.equal((await call('drafts/save', unfinished, cookie, id)).body.draft.revision, 1);
    assert.equal((await call('drafts', undefined, cookie, id)).body.drafts.length, 1);
    assert.equal((await call('drafts', undefined, otherCookie, otherId)).body.drafts.length, 0);
    assert.equal((await call('drafts', undefined, otherCookie, id)).status, 409);
    assert.equal((await call('drafts/save', { ...unfinished, user_id: otherId }, cookie, id)).status, 400);
    assert.equal((await call('drafts/save', { ...unfinished, createdAt: 'forged' }, cookie, id)).status, 400);
    const exactReaction = '  Fictional itching after a medicine.\nNo other details supplied.  ';
    const confirmed = { ...unfinished, expectedRevision: 1, status: 'user-confirmed', statements: { ...unfinished.statements, reaction: exactReaction } };
    const updated = await call('drafts/save', confirmed, cookie, id);
    assert.equal(updated.body.draft.revision, 2); assert.equal(updated.body.draft.statements.reaction, exactReaction);
    assert.equal(updated.body.draft.createdAt, created.body.draft.createdAt);
    assert.equal(updated.body.draft.language, 'en'); assert.ok(updated.body.draft.confirmedAt);
    assert.ok(readAccountDraft(updated.body.draft));
    assert.equal((await call('drafts/save', confirmed, cookie, id)).body.draft.revision, 2);
    assert.equal((await call('drafts/save', { ...confirmed, statements: { ...confirmed.statements, reaction: 'Stale changed words' } }, cookie, id)).status, 409);
    assert.equal((await call('drafts/save', { ...confirmed, expectedRevision: 2 }, otherCookie, otherId)).status, 409);
    assert.equal((await call('drafts/delete', { fictionalOnly: true, id: draftId, expectedRevision: 2 }, otherCookie, otherId)).status, 409);
    await stop(); runtime = await boot();
    assert.equal((await call('drafts', undefined, cookie, id)).body.drafts[0].statements.reaction, exactReaction);
    assert.equal((await call('signin', { email: 'first@example.test', password: 'incorrect-test-password' })).status, 401);
    assert.equal((await call('signin', { email: 'FIRST@example.test', password })).status, 200);
    assert.equal((await call('profile', { profile: { ...profile, surgeries: 'Fictional surgery' }, expectedRevision: 1 }, cookie, id)).body.profile.revision, 2);
    assert.equal((await call('profile/delete', { expectedRevision: 1 }, cookie, id)).status, 409);
    assert.equal((await call('profile/delete', { expectedRevision: 2 }, cookie, id)).status, 200);
    assert.equal((await call('profile', undefined, cookie, id)).body.profile, null);
    // Deleting a personal profile must not silently delete independent ADR records.
    assert.equal((await call('drafts', undefined, cookie, id)).body.drafts.length, 1);
    assert.equal((await call('drafts/delete', { fictionalOnly: true, id: draftId, expectedRevision: 1 }, cookie, id)).status, 409);
    assert.equal((await call('drafts/delete', { fictionalOnly: true, id: draftId, expectedRevision: 2 }, cookie, id)).status, 200);
    assert.equal((await call('drafts', undefined, cookie, id)).body.drafts.length, 0);
    assert.equal((await call('signout', {}, cookie)).status, 200);
    assert.equal((await call('session', undefined, cookie)).body.user, null);
    time += 9 * 60 * 60 * 1000;
    assert.equal((await call('session', undefined, otherCookie)).body.user, null);
    // Repeated auth attempts are bounded before invoking expensive hashing.
    for (let i = 0; i < 30; i++) await call('signin', { email: 'invalid', password });
    assert.equal((await call('signin', { email: 'first@example.test', password })).status, 429);
  } finally {
    await stop();
    if (!dir.startsWith(join(tmpdir(), 'apip-auth-test-'))) throw new Error('Unexpected test directory');
    await rm(dir, { recursive: true, force: true });
  }
});
