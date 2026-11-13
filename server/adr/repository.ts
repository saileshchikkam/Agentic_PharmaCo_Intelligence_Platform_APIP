import type { DatabaseSync } from 'node:sqlite';
import type { GuidedCase } from '../../src/features/adr/guided/domain';
import { caseCard, type CaseCard, type CaseFilters, type RevisionDescriptor } from '../../src/features/adr/cases/contracts';
import type { CasePosition } from './caseQuery';

type Awaitable<T> = T | Promise<T>;
export type CaseSummary = Pick<GuidedCase, 'id' | 'revision' | 'updatedAt'>;

// Owner comes from the verified session. A successful save returns the persisted revision.
export interface GuidedCaseRepository {
  search(owner: string, filters: CaseFilters, position?: CasePosition): Awaitable<CaseCard[]>;
  snapshot(owner: string, id: string, revision: number): Awaitable<GuidedCase | null>;
  revisions(owner: string, id: string, limit: number, before: number): Awaitable<RevisionDescriptor[]>;
  recordHistoricalExport?(owner: string, id: string, revision: number, bytes: Buffer): Awaitable<void>;
  list(owner: string): Awaitable<CaseSummary[]>;
  load(owner: string, id: string): Awaitable<GuidedCase | null>;
  history(owner: string, id: string, limit?: number, before?: number): Awaitable<{ revision: number }[]>;
  save(owner: string, candidate: GuidedCase, expected: number, command: { type: string }, key?: string): Awaitable<GuidedCase>;
  replay?(owner: string, id: string, expected: number, command: { type: string }, key: string): Awaitable<GuidedCase | null>;
  page?(owner: string, limit: number, after?: string): Awaitable<{ cases: CaseSummary[]; nextCursor: string | null }>;
  recordExport?(owner: string, id: string, revision: number, bytes: Buffer): Awaitable<void>;
}

export function sqliteGuidedRepository(db: DatabaseSync): GuidedCaseRepository {
  db.exec(`CREATE TABLE IF NOT EXISTS adr_guided_cases(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES local_users(id),revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
 CREATE INDEX IF NOT EXISTS adr_guided_owner ON adr_guided_cases(owner_id);
 CREATE TABLE IF NOT EXISTS adr_guided_versions(case_id TEXT NOT NULL REFERENCES adr_guided_cases(id),revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),PRIMARY KEY(case_id,revision));`);
  const decode = (payload: unknown): GuidedCase => JSON.parse(String(payload));
  return {
    search(owner, f, position) {
      // Derive summaries from the current immutable payload: old cases need no backfill.
      const rows = db.prepare(`WITH summaries AS (
        SELECT c.id,c.payload,
          json_extract(v.payload,'$.updatedAt') AS created,
          json_extract(c.payload,'$.updatedAt') AS updated,
          CASE WHEN json_extract(c.payload,'$.values.reportDate.state')='provided'
            THEN json_extract(c.payload,'$.values.reportDate.value') END AS reported,
          CASE WHEN json_extract(c.payload,'$.values.caseType.state')='provided'
            THEN json_extract(c.payload,'$.values.caseType.value') END AS case_type,
          (SELECT coalesce(group_concat(json_extract(a.value,'$.value'),' '),'') FROM json_each(c.payload,'$.values') a
            WHERE a.key LIKE 'med.%.name' AND json_extract(a.value,'$.state')='provided') AS medicines,
          (json_extract(c.payload,'$.values.caseType.state')='provided'
            AND json_extract(c.payload,'$.values.initials.state')='provided'
            AND json_extract(c.payload,'$.values.reaction.state')='provided'
            AND json_extract(c.payload,'$.values.reporterName.state')='provided'
            AND EXISTS(SELECT 1 FROM json_each(c.payload,'$.medications') m WHERE json_extract(m.value,'$.kind')='suspect')
            AND NOT EXISTS(SELECT 1 FROM json_each(c.payload,'$.medications') m
              WHERE coalesce(json_extract(c.payload,'$.values."med.'||json_extract(m.value,'$.id')||'.name".state'),'')!='provided')) AS complete
        FROM adr_guided_cases c JOIN adr_guided_versions v ON v.case_id=c.id AND v.revision=1 WHERE c.owner_id=?
      ), selected AS (SELECT *,CASE WHEN ?='created' THEN created ELSE updated END AS sort_at,
        CASE ? WHEN 'created' THEN created WHEN 'reported' THEN reported ELSE updated END AS filter_at FROM summaries)
      SELECT payload,created FROM selected WHERE (?='' OR instr(lower(id||' '||medicines),lower(?))>0)
        AND (?='' OR instr(lower(medicines),lower(?))>0) AND (?='all' OR case_type=?)
        AND (?='all' OR (?='draft' AND NOT coalesce(complete,0)) OR (?='intake_complete' AND complete))
        AND (?='' OR substr(filter_at,1,10)>=?) AND (?='' OR substr(filter_at,1,10)<=?)
        AND (? IS NULL OR (?='asc' AND (sort_at,id)>(?,?)) OR (?='desc' AND (sort_at,id)<(?,?)))
      ORDER BY CASE WHEN ?='asc' THEN sort_at END ASC, CASE WHEN ?='desc' THEN sort_at END DESC,
        CASE WHEN ?='asc' THEN id END ASC, CASE WHEN ?='desc' THEN id END DESC LIMIT ?`).all(
          owner,f.sort,f.dateField,f.q,f.q,f.medicine,f.medicine,f.caseType,f.caseType,f.status,f.status,f.status,
          f.from,f.from,f.to,f.to,position?.at??null,f.direction,position?.at??'',position?.id??'',
          f.direction,position?.at??'',position?.id??'',f.direction,f.direction,f.direction,f.direction,f.limit+1);
      return rows.map(row => caseCard(decode(row.payload),String(row.created)));
    },
    snapshot(owner,id,revision) {
      const row = db.prepare(`SELECT v.payload FROM adr_guided_versions v JOIN adr_guided_cases c ON c.id=v.case_id
        WHERE c.owner_id=? AND c.id=? AND v.revision=?`).get(owner,id,revision);
      return row ? decode(row.payload) : null;
    },
    revisions(owner,id,limit,before) {
      return db.prepare(`SELECT v.revision,json_extract(v.payload,'$.updatedAt') AS savedAt FROM adr_guided_versions v
        JOIN adr_guided_cases c ON c.id=v.case_id WHERE c.owner_id=? AND c.id=? AND v.revision<?
        ORDER BY v.revision DESC LIMIT ?`).all(owner,id,before,limit)
        .map(row => ({ revision:Number(row.revision),savedAt:String(row.savedAt) }));
    },
    list(owner) {
      return db.prepare('SELECT payload FROM adr_guided_cases WHERE owner_id=? ORDER BY rowid DESC LIMIT 100').all(owner)
        .map(row => {
          const { id, revision, updatedAt } = decode(row.payload);
          return { id, revision, updatedAt };
        });
    },
    load(owner, id) {
      const row = db.prepare('SELECT payload FROM adr_guided_cases WHERE id=? AND owner_id=?').get(id, owner);
      return row ? decode(row.payload) : null;
    },
    history(owner, id) {
      return db.prepare(`SELECT v.revision FROM adr_guided_versions v
        JOIN adr_guided_cases c ON c.id=v.case_id
        WHERE c.owner_id=? AND c.id=? ORDER BY v.revision DESC LIMIT 100`).all(owner, id)
        .map(row => ({ revision: Number(row.revision) }));
    },
    save(owner, candidate, expected) {
      const saved = { ...candidate, revision: expected + 1, updatedAt: new Date().toISOString() };
      const payload = JSON.stringify(saved);
      db.exec('BEGIN IMMEDIATE');
      try {
        if (expected === 0) {
          const row = db.prepare('SELECT count(*) n FROM adr_guided_cases WHERE owner_id=?').get(owner);
          if (Number(row?.n) >= 100) throw Error('CASE_LIMIT');
          db.prepare('INSERT INTO adr_guided_cases VALUES (?,?,?,?)').run(saved.id, owner, saved.revision, payload);
        } else if (!db.prepare('UPDATE adr_guided_cases SET revision=?,payload=? WHERE id=? AND owner_id=? AND revision=?')
          .run(saved.revision, payload, saved.id, owner, expected).changes) {
          throw Error('REVISION_CONFLICT');
        }
        db.prepare('INSERT INTO adr_guided_versions VALUES (?,?,?)').run(saved.id, saved.revision, payload);
        db.exec('COMMIT');
        return saved;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
