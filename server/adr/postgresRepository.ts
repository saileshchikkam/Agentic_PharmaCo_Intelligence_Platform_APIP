import {patientCompleteness} from '../../src/features/adr/guided/completeness';
import { createHash, randomUUID } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import type { GuidedCaseRepository } from './repository';
import type { GuidedCase } from '../../src/features/adr/guided/domain';
import { caseCard } from '../../src/features/adr/cases/contracts';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const templateHash = '40af4962d6dd65ce538ff4791805b0632085159623c5a4beeb755442f6c0ed0b';

function commandHash(command: { type: string }) {
  return createHash('sha256').update(JSON.stringify(command, Object.keys(command).sort())).digest('hex');
}

export function postgresGuidedRepository(sql: Sql, finalizationEnabled=false): GuidedCaseRepository {
  async function owned<T>(owner: string, operation: (tx: TransactionSql) => Promise<T>): Promise<T> {
    try {
      return await sql.begin(async tx => {
        await tx`select set_config('request.jwt.claim.sub', ${owner}, true),
          set_config('statement_timeout', '5000', true), set_config('lock_timeout', '3000', true),
          set_config('request.jwt.claims', ${JSON.stringify({ sub: owner })}, true)`;
        return operation(tx);
      }) as T;
    } catch (error) {
      if (error instanceof Error && ['REVISION_CONFLICT', 'CASE_LIMIT', 'IDEMPOTENCY_CONFLICT','REPORT_FINALIZED','ALREADY_FINALIZED','INCOMPLETE_REPORT','NOT_FOUND'].includes(error.message)) {
        throw Error(error.message);
      }
      throw Error('ADR_STORAGE_UNAVAILABLE');
    }
  }

  const page: NonNullable<GuidedCaseRepository['page']> = (owner, limit, after) => owned(owner, async tx => {
    const [setup]=await tx`select to_regclass('apip_adr.finalizations') is not null present`;
    const rows = await tx<{ id: string; revision: number; updatedAt: string }[]>`
      select c.id,c.revision,r.snapshot->>'updatedAt' as "updatedAt" from apip_adr.cases c join apip_adr.revisions r
        on (r.owner_id,r.case_id,r.revision) = (c.owner_id,c.id,c.revision)
      where c.owner_id = ${owner} and ${setup.present?tx`not exists(select 1 from apip_adr.finalizations f where f.owner_id=c.owner_id and f.case_id=c.id)`:tx`true`} and (${after ?? null}::uuid is null or (c.created_at,c.id) <
        (select created_at,id from apip_adr.cases where owner_id = ${owner} and id = ${after ?? null}::uuid))
      order by c.created_at desc,c.id desc limit ${limit + 1}`;
    const cases = rows.slice(0, limit);
    return { cases, nextCursor: rows.length > limit ? cases[cases.length - 1].id : null };
  });
  return {
    lifecycle:async(owner,id)=>{
      try{return await sql.begin(async tx=>{await tx`select set_config('request.jwt.claim.sub',${owner},true)`;const rows=await tx`select * from apip_adr.finalizations where owner_id=${owner}::uuid and case_id=${id}::uuid`;return {available:finalizationEnabled,finalization:rows[0]??null};}) as any;}
      catch(e){if((e as {code?:string}).code==='42P01')return {available:false,finalization:null};throw Error('ADR_STORAGE_UNAVAILABLE');}
    },
    finalize:(owner,id,revision,key)=>owned(owner,async tx=>{await tx`select pg_advisory_xact_lock(hashtextextended(${owner}::text||':'||${id}::text,0))`;const [saved]=await tx`select r.snapshot from apip_adr.revisions r join apip_adr.cases c on (c.owner_id,c.id,c.revision)=(r.owner_id,r.case_id,r.revision) where c.owner_id=${owner}::uuid and c.id=${id}::uuid`;if(!saved)throw Error('NOT_FOUND');if(saved.snapshot.revision!==revision)throw Error('REVISION_CONFLICT');if(!patientCompleteness(saved.snapshot).ready)throw Error('INCOMPLETE_REPORT');const [row]=await tx`select apip_adr.finalize_case(${id}::uuid,${revision},${key}::uuid) result`;return row.result;}),
    search: (owner,f,p) => owned(owner,async tx => {
      const [setup]=await tx`select to_regclass('apip_adr.finalizations') is not null present`;
      const rows = await tx<{ snapshot:GuidedCase; created:string;finalized:boolean }[]>`with summaries as (
        select c.id,r.snapshot,${setup.present?tx`exists(select 1 from apip_adr.finalizations f where f.owner_id=c.owner_id and f.case_id=c.id)`:tx`false`} as finalized,c.created_at::text as created,r.snapshot->>'updatedAt' as updated,
          case when r.snapshot->'values'->'reportDate'->>'state'='provided'
            then r.snapshot->'values'->'reportDate'->>'value' end as reported,
          case when r.snapshot->'values'->'caseType'->>'state'='provided'
            then r.snapshot->'values'->'caseType'->>'value' end as case_type,
          (select coalesce(string_agg(a.value->>'value',' '),'') from jsonb_each(r.snapshot->'values') a
            where a.key like 'med.%.name' and a.value->>'state'='provided') as medicines,
          (r.snapshot->'values'->'caseType'->>'state'='provided'
            and r.snapshot->'values'->'initials'->>'state'='provided'
            and r.snapshot->'values'->'reaction'->>'state'='provided'
            and r.snapshot->'values'->'reporterName'->>'state'='provided'
            and exists(select 1 from jsonb_array_elements(r.snapshot->'medications') m where m->>'kind'='suspect')
            and not exists(select 1 from jsonb_array_elements(r.snapshot->'medications') m
              where coalesce(r.snapshot->'values'->('med.'||(m->>'id')||'.name')->>'state','')!='provided')) as complete
        from apip_adr.cases c join apip_adr.revisions r on (r.owner_id,r.case_id,r.revision)=(c.owner_id,c.id,c.revision)
        where c.owner_id=${owner}
      ), selected as (select *,case when ${f.sort}='created' then created else updated end as sort_at,
        case ${f.dateField} when 'created' then created when 'reported' then reported else updated end as filter_at from summaries)
      select snapshot,created,finalized from selected where (${f.q}='' or strpos(lower(id::text||' '||medicines),lower(${f.q}))>0)
        and (${f.medicine}='' or strpos(lower(medicines),lower(${f.medicine}))>0)
        and (${f.caseType}='all' or case_type=${f.caseType})
        and (${f.status}='all' or (${f.status}='finalized' and finalized) or (${f.status}='draft' and not finalized and not coalesce(complete,false)) or (${f.status}='intake_complete' and complete))
        and (${f.from}='' or substr(filter_at,1,10)>=${f.from}) and (${f.to}='' or substr(filter_at,1,10)<=${f.to})
        and (${p?.at??null}::text is null or (${f.direction}='asc' and (sort_at,id)>(${p?.at??''},${p?.id??null}::uuid))
          or (${f.direction}='desc' and (sort_at,id)<(${p?.at??''},${p?.id??null}::uuid)))
      order by case when ${f.direction}='asc' then sort_at end asc,case when ${f.direction}='desc' then sort_at end desc,
        case when ${f.direction}='asc' then id end asc,case when ${f.direction}='desc' then id end desc limit ${f.limit+1}`;
      return rows.map(row => ({...caseCard(row.snapshot,row.created),status:row.finalized?'finalized' as const:'draft' as const}));
    }),
    snapshot: (owner,id,revision) => !uuid.test(id) ? null : owned(owner,async tx => {
      const rows=await tx<{snapshot:GuidedCase}[]>`select snapshot from apip_adr.revisions
        where owner_id=${owner} and case_id=${id} and revision=${revision}`;
      return rows[0]?.snapshot??null;
    }),
    revisions: (owner,id,limit,before) => !uuid.test(id) ? [] : owned(owner,async tx => {
      const rows=await tx<{revision:number;savedAt:Date}[]>`select revision,saved_at as "savedAt" from apip_adr.revisions
        where owner_id=${owner} and case_id=${id} and revision<${before} order by revision desc limit ${limit}`;
      return rows.map(row=>({revision:row.revision,savedAt:new Date(row.savedAt).toISOString()}));
    }),
    recordHistoricalExport: (owner,id,revision,bytes) => owned(owner,async tx => {
      await tx`select apip_adr.record_historical_pdf_export(${id},${revision},${randomUUID()},${templateHash},
        ${createHash('sha256').update(bytes).digest('hex')},${bytes.length})`;
    }),
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
