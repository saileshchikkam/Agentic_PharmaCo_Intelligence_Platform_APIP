import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const migration = '20261105071028_adr_postgres_foundation.sql';

test('ADR PostgreSQL migration, RLS, immutable history, retries and restore', async () => {
  const db = new PGlite();
  const [alice, bob, caseId, command, next] = Array.from({ length: 5 }, () => randomUUID());
  const hash = 'a'.repeat(64);
  const at = new Date().toISOString();
  const medications = Array.from({ length: 20 }, () => ({ id: randomUUID(), kind: 'suspect' }));
  const statements = [
    { id: randomUUID(), text: 'F'.repeat(4000), at },
    { id: randomUUID(), text: 'Unknown / not available', at },
    ...medications.map(() => ({ id: randomUUID(), text: 'M'.repeat(4000), at })),
  ];
  const snapshot = {
    schemaVersion: 1, id: caseId, revision: 1, fictionalOnly: true, updatedAt: at,
    values: {
      age: { state: 'unknown', value: null, confirmedAt: at, source: 'manual', statementId: statements[1].id },
      ...Object.fromEntries(medications.map((medicine, index) => [
        'med.' + medicine.id + '.rechallenge',
        { state: 'provided', value: statements[index + 2].text, confirmedAt: at, source: 'manual', statementId: statements[index + 2].id },
      ])),
    },
    medications, statements,
    proposals: [{ id: randomUUID(), key: 'reaction', value: 'F', quote: 'F', conflict: false }],
    providerStatus: 'proposals_ready',
  };
  const setActor = async (role: string, actor: string) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [actor]);
    await db.exec(`set role ${role}`);
  };
  const append = (revision: number, key: string, payload: unknown, fingerprint = hash) =>
    db.query<{ saved: typeof snapshot }>(
      'select apip_adr.append_revision($1,$2,$3,$4,$5,$6) as saved',
      [caseId, revision, key, revision === 0 ? 'create' : 'confirm', fingerprint, JSON.stringify(payload)],
    );

  try {
    await db.exec(`create role anon; create role authenticated; create role adr_writer in role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table migration_fixture(version text primary key);`);
    await db.query('insert into auth.users values ($1), ($2)', [alice, bob]);
    await db.exec(await read('../database/account-schema.sql'));
    await setActor('authenticated', alice);
    await db.query("insert into public.patient_profiles (user_id, display_name, birth_date, relationship, share_adr) values ($1,'Fictional','1990-01-01','self',true)", [alice]);
    await db.exec('reset role');

    // Models the deployment migration ledger. Re-running the deploy skips recorded versions.
    const applyPending = () => db.transaction(async tx => {
      if ((await tx.query('select version from migration_fixture where version=$1', [migration])).rows.length) return false;
      await tx.exec(await read('../supabase/migrations/' + migration));
      await tx.query('insert into migration_fixture values ($1)', [migration]);
      return true;
    });
    assert.equal(await applyPending(), true);
    assert.equal(await applyPending(), false);
    await db.exec(`grant execute on function apip_adr.append_revision(uuid,integer,uuid,text,text,jsonb),
      apip_adr.record_pdf_export(uuid,integer,uuid,text,text,integer) to adr_writer;`);

    await setActor('adr_writer', '');
    await assert.rejects(append(0, command, snapshot), /SIGN_IN_REQUIRED/);
    await setActor('adr_writer', alice);
    assert.deepEqual((await append(0, command, snapshot)).rows[0].saved, snapshot);
    assert.deepEqual((await append(0, command, { ...snapshot, values: {} })).rows[0].saved, snapshot);
    await assert.rejects(append(0, command, snapshot, 'b'.repeat(64)), /IDEMPOTENCY_CONFLICT/);
    await assert.rejects(append(1, next, { ...snapshot, revision: 3 }));
    assert.deepEqual((await db.query('select revision from apip_adr.cases')).rows, [{ revision: 1 }]);
    const updated = { ...snapshot, revision: 2 };
    await append(1, next, updated);
    await assert.rejects(append(1, randomUUID(), updated), /REVISION_CONFLICT/);
    const exportPdf = (revision: number) => db.query(
      'select apip_adr.record_pdf_export($1,$2,$3,$4,$5,$6)', [caseId, revision, randomUUID(), hash, hash, 1234],
    );
    await assert.rejects(exportPdf(1), /REVISION_CONFLICT/);
    await exportPdf(2);

    await setActor('authenticated', alice);
    assert.equal((await db.query('select share_adr from public.patient_profiles')).rows[0].share_adr, true);
    assert.equal((await db.query('select snapshot from apip_adr.revisions')).rows.length, 2);
    await assert.rejects(append(2, randomUUID(), updated), /permission denied/);
    await setActor('authenticated', bob);
    for (const table of ['cases', 'revisions', 'pdf_exports']) {
      assert.deepEqual((await db.query(`select owner_id from apip_adr.${table}`)).rows, []);
      await assert.rejects(db.query(`insert into apip_adr.${table} (owner_id) values ($1)`, [alice]), /permission denied/);
      await assert.rejects(db.query(`update apip_adr.${table} set owner_id=$1`, [bob]), /permission denied/);
      await assert.rejects(db.query(`delete from apip_adr.${table}`), /permission denied/);
    }
    await setActor('adr_writer', bob);
    await assert.rejects(exportPdf(2), /REVISION_CONFLICT/);
    await assert.rejects(append(1, randomUUID(), updated), /REVISION_CONFLICT/);
    await setActor('anon', '');
    for (const table of ['cases', 'revisions', 'pdf_exports']) {
      await assert.rejects(db.query(`select * from apip_adr.${table}`), /permission denied/);
    }

    await db.exec('reset role');
    await assert.rejects(db.exec('update apip_adr.revisions set saved_at=now()'), /IMMUTABLE_ADR_HISTORY/);
    await assert.rejects(db.exec('delete from apip_adr.revisions'), /IMMUTABLE_ADR_HISTORY/);
    const restored = new PGlite({ loadDataDir: await db.dumpDataDir() });
    try {
      assert.deepEqual((await restored.query('select snapshot from apip_adr.revisions order by revision')).rows,
        [{ snapshot }, { snapshot: updated }]);
      assert.equal((await restored.query('select export_id from apip_adr.pdf_exports')).rows.length, 1);
      await restored.exec('set role anon');
      await assert.rejects(restored.query('select * from apip_adr.revisions'), /permission denied/);
    } finally {
      await restored.close();
    }
  } finally {
    await db.close();
  }
});
