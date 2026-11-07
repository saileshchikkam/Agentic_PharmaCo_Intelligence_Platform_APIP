import { createHash, randomUUID } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import type { GuidedCaseRepository } from './repository';
import type { GuidedCase } from '../../src/features/adr/guided/domain';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const templateHash = '40af4962d6dd65ce538ff4791805b0632085159623c5a4beeb755442f6c0ed0b';

function commandHash(command: { type: string }) {
  return createHash('sha256').update(JSON.stringify(command, Object.keys(command).sort())).digest('hex');
}

export function postgresGuidedRepository(sql: Sql): GuidedCaseRepository {
  async function owned<T>(owner: string, operation: (tx: TransactionSql) => Promise<T>): Promise<T> {
    try {
      return await sql.begin(async tx => {
        await tx`select set_config('request.jwt.claim.sub', ${owner}, true),
          set_config('statement_timeout', '5000', true), set_config('lock_timeout', '3000', true),
          set_config('request.jwt.claims', ${JSON.stringify({ sub: owner })}, true)`;
        return operation(tx);
      }) as T;
    } catch (error) {
      if (error instanceof Error && ['REVISION_CONFLICT', 'CASE_LIMIT', 'IDEMPOTENCY_CONFLICT'].includes(error.message)) {
        throw Error(error.message);
      }
      throw Error('ADR_STORAGE_UNAVAILABLE');
    }
  }

  const page: NonNullable<GuidedCaseRepository['page']> = (owner, limit, after) => owned(owner, async tx => {
    const rows = await tx<{ id: string; revision: number; updatedAt: string }[]>`
      select c.id,c.revision,r.snapshot->>'updatedAt' as "updatedAt" from apip_adr.cases c join apip_adr.revisions r
        on (r.owner_id,r.case_id,r.revision) = (c.owner_id,c.id,c.revision)
      where c.owner_id = ${owner} and (${after ?? null}::uuid is null or (c.created_at,c.id) <
        (select created_at,id from apip_adr.cases where owner_id = ${owner} and id = ${after ?? null}::uuid))
      order by c.created_at desc,c.id desc limit ${limit + 1}`;
    const cases = rows.slice(0, limit);
    return { cases, nextCursor: rows.length > limit ? cases[cases.length - 1].id : null };
  });
  return {
    page,
    replay: (owner, id, expected, command, key) => !uuid.test(id) ? null : owned(owner, async tx => {
      const [row] = await tx<{ snapshot: GuidedCase | null }[]>`select apip_adr.find_command_receipt(
        ${id}, ${expected}, ${key}, ${command.type}, ${commandHash(command)}) as snapshot`;
      return row.snapshot;
    }),
    list: async owner => (await page(owner, 100)).cases,
    load: (owner, id) => !uuid.test(id) ? null : owned(owner, async tx => {
      const rows = await tx<{ snapshot: GuidedCase }[]>`
        select r.snapshot from apip_adr.cases c join apip_adr.revisions r
          on (r.owner_id,r.case_id,r.revision) = (c.owner_id,c.id,c.revision)
        where c.owner_id = ${owner} and c.id = ${id}`;
      return rows[0]?.snapshot ?? null;
    }),
    history: (owner, id, limit = 100, before = 501) => !uuid.test(id) ? [] : owned(owner, async tx =>
      tx<{ revision: number }[]>`select revision from apip_adr.revisions
        where owner_id = ${owner} and case_id = ${id} and revision < ${before} order by revision desc limit ${limit}`),
    save: (owner, candidate, expected, command, key) => owned(owner, async tx => {
      const saved = { ...candidate, revision: expected + 1, updatedAt: new Date().toISOString() };
      const hash = commandHash(command);
      const [row] = await tx<{ snapshot: GuidedCase }[]>`select apip_adr.append_revision(
        ${saved.id}, ${expected}, ${key ?? randomUUID()}, ${command.type}, ${hash},
        ${JSON.stringify(saved)}::text::jsonb) as snapshot`;
      return row.snapshot;
    }),
    recordExport: (owner, id, revision, bytes) => owned(owner, async tx => {
      const hash = createHash('sha256').update(bytes).digest('hex');
      await tx`select apip_adr.record_pdf_export(
        ${id}, ${revision}, ${randomUUID()}, ${templateHash}, ${hash}, ${bytes.length})`;
    }),
  };
}
