import type { DatabaseSync } from 'node:sqlite';
import type { GuidedCase } from '../../src/features/adr/guided/domain';

type Awaitable<T> = T | Promise<T>;
export type CaseSummary = Pick<GuidedCase, 'id' | 'revision' | 'updatedAt'>;

// Owner comes from the verified session. A successful save returns the persisted revision.
export interface GuidedCaseRepository {
  list(owner: string): Awaitable<CaseSummary[]>;
  load(owner: string, id: string): Awaitable<GuidedCase | null>;
  history(owner: string, id: string): Awaitable<{ revision: number }[]>;
  save(owner: string, candidate: GuidedCase, expected: number): Awaitable<GuidedCase>;
}

export function sqliteGuidedRepository(db: DatabaseSync): GuidedCaseRepository {
  db.exec(`CREATE TABLE IF NOT EXISTS adr_guided_cases(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES local_users(id),revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
 CREATE INDEX IF NOT EXISTS adr_guided_owner ON adr_guided_cases(owner_id);
 CREATE TABLE IF NOT EXISTS adr_guided_versions(case_id TEXT NOT NULL REFERENCES adr_guided_cases(id),revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),PRIMARY KEY(case_id,revision));`);
  const decode = (payload: unknown): GuidedCase => JSON.parse(String(payload));
  return {
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
