import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { ageOn, emptyProfile, profileContext, validateProfile, type PatientProfile } from '../src/features/account/profile';

test('age, unknown history, children and sharing are explicit', () => {
  assert.equal(ageOn('2000-10-18', '2026-10-17'), 25);
  assert.equal(ageOn('2000-10-17', '2026-10-17'), 26);
  assert.equal(ageOn('2026-10-17', '2026-10-17'), 0);
  assert.equal(ageOn('2025-02-29'), null);
  assert.equal(ageOn('2099-01-01'), null);
  const input = { ...emptyProfile(), display_name: 'Fictional Person', birth_date: '2016-10-17' };
  assert.match(validateProfile(input, '2026-10-17')!, /caregiver/);
  input.relationship = 'caregiver';
  assert.equal(validateProfile(input, '2026-10-17'), null);
  assert.equal(input.conditions, null);
  const profile: PatientProfile = { ...input, user_id: 'private-id', revision: 1, updated_at: '2026-10-17' };
  assert.equal(profileContext(profile, 'medassist'), null);
  profile.share_medassist = true;
  assert.equal(profileContext(profile, 'medassist', '2026-10-17')?.age, 10);
  assert.equal(profileContext(profile, 'adr'), null);
  assert.equal(JSON.stringify(profileContext(profile, 'medassist')).includes('Fictional Person'), false);
  assert.equal(JSON.stringify(profileContext(profile, 'medassist')).includes('private-id'), false);
});

test('Postgres: owner CRUD, cross-account denial, anonymous denial, revisions and constraints', async () => {
  const db = new PGlite();
  try {
    // Test-only equivalent of Supabase identity primitives; no hosted accounts or records are created.
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');`);
    await db.exec(await readFile(new URL('../database/account-schema.sql', import.meta.url), 'utf8'));
    const a = '00000000-0000-0000-0000-000000000001';
    const b = '00000000-0000-0000-0000-000000000002';
    const identity = async (id: string) => { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]); };
    await identity(a);
    await db.query('insert into public.patient_profiles (user_id, display_name, birth_date, relationship) values ($1, $2, $3, $4)', [a, 'Fictional Adult', '1990-01-01', 'self']);
    assert.equal((await db.query('select * from public.patient_profiles')).rows.length, 1);
    await assert.rejects(db.query('insert into public.patient_profiles (user_id, display_name, birth_date, relationship) values ($1, $2, $3, $4)', [b, 'Impersonated', '1990-01-01', 'self']));
    await db.query("update public.patient_profiles set conditions = 'Fictional history' where revision = 1");
    assert.equal((await db.query<{ revision: number }>('select revision from public.patient_profiles')).rows[0].revision, 2);
    assert.equal((await db.query('update public.patient_profiles set conditions = null where revision = 1 returning user_id')).rows.length, 0);
    await assert.rejects(db.query('update public.patient_profiles set revision = 99'));
    await assert.rejects(db.query('update public.patient_profiles set user_id = $1', [b]));
    await assert.rejects(db.query("update public.patient_profiles set birth_date = current_date"));
    await db.exec("update public.patient_profiles set relationship = 'caregiver', birth_date = current_date");
    await identity(b);
    assert.equal((await db.query('select * from public.patient_profiles')).rows.length, 0);
    assert.equal((await db.query("update public.patient_profiles set conditions = 'intrusion' returning user_id")).rows.length, 0);
    assert.equal((await db.query('delete from public.patient_profiles returning user_id')).rows.length, 0);
    await db.query('insert into public.patient_profiles (user_id, display_name, birth_date, relationship) values ($1, $2, $3, $4)', [b, 'Fictional Other', '1990-01-01', 'self']);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from public.patient_profiles'));
    await assert.rejects(db.query('delete from public.patient_profiles'));
    await identity(a);
    assert.equal((await db.query('delete from public.patient_profiles returning user_id')).rows.length, 1);
    await identity(b);
    assert.equal((await db.query('select * from public.patient_profiles')).rows.length, 1);
  } finally { await db.close(); }
});
