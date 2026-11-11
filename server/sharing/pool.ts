import type { Sql } from 'postgres';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import {
  extractSafeMetadata,
  pooledSharingPolicyVersion,
  type PooledReviewItem,
  type SafeQueueEntry,
  type SafeQueueMetadata,
} from './policy';

export interface SharingPoolRepository {
  readonly mode?: 'postgres' | 'sqlite';
  createPoolRequest(
    patient: string,
    body: {
      id: string;
      caseId: string;
      revision: number;
      snapshot: any;
      disclosure: any;
      digest: string;
      policyVersion: string;
    },
    key: string
  ): Promise<PooledReviewItem>;
  listQueue(limit?: number, actor?: string): Promise<SafeQueueEntry[]>;
  get(id: string, actor?: string): Promise<PooledReviewItem | null>;
  listForPatient(patient: string): Promise<PooledReviewItem[]>;
  claim(
    actor: string,
    id: string,
    key: string,
    assignFn: (item: PooledReviewItem, assignmentId: string) => Promise<any>
  ): Promise<{ request: any }>;
  release(
    actor: string,
    id: string,
    expectedVersion: number,
    key: string,
    declineFn: (id: string, version: number) => Promise<any>
  ): Promise<{ request: any }>;
  withdraw(
    patient: string,
    id: string,
    expectedVersion: number,
    key: string,
    withdrawFn?: (id: string, version: number) => Promise<any>
  ): Promise<{ request: any }>;
}

const POSTGRES_POOL_ERRORS = new Set([
  'SIGN_IN_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'EXPLICIT_CONSENT_REQUIRED',
  'RECIPIENT_UNAVAILABLE',
  'DISCLOSURE_MISMATCH',
  'IDEMPOTENCY_CONFLICT',
  'REVISION_CONFLICT',
  'ACTIVE_ASSIGNMENT_CONFLICT',
  'CONFLICT_OF_INTEREST',
  'INVALID_REQUEST',
]);

export function postgresSharingPoolRepository(sql: Sql): SharingPoolRepository {
  async function execOp(
    actor: string,
    op: string,
    id: string | null,
    body: unknown,
    key: string
  ): Promise<any> {
    if (!actor) throw Error('SIGN_IN_REQUIRED');
    try {
      return await sql.begin(async tx => {
        await tx`select set_config('request.jwt.claim.sub', ${actor}, true), set_config('statement_timeout', '5000', true), set_config('lock_timeout', '3000', true)`;
        const [row] = await tx`select apip_sharing.pool_operation(${op}, ${id}::uuid, ${JSON.stringify(body)}::text::jsonb, ${key}::uuid) result`;
        return row.result;
      });
    } catch (error) {
      const e = error as { code?: string; message?: string };
      if (e.code === '23505') throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
      if (POSTGRES_POOL_ERRORS.has(e.message ?? '')) throw Error(e.message);
      throw Error('SHARING_UNAVAILABLE', { cause: error });
    }
  }

  return {
    mode: 'postgres',

    async createPoolRequest(patient, body, key) {
      if (body.policyVersion !== pooledSharingPolicyVersion) {
        throw Error('EXPLICIT_CONSENT_REQUIRED');
      }
      const safeMetadata = extractSafeMetadata(body.snapshot, body.disclosure);
      return await execOp(
        patient,
        'pool_create',
        body.id,
        {
          caseId: body.caseId,
          revision: body.revision,
          consent: true,
          policyVersion: body.policyVersion,
          safeMetadata,
          snapshot: body.snapshot,
          disclosure: body.disclosure,
          digest: body.digest,
        },
        key
      );
    },

    async listQueue(limit = 50, actor) {
      if (!actor) throw Error('SIGN_IN_REQUIRED');
      return await execOp(actor, 'pool_list', null, { limit }, randomUUID());
    },

    async get(id: string, actor?: string) {
      if (!actor) throw Error('SIGN_IN_REQUIRED');
      return await execOp(actor, 'pool_get', id, {}, randomUUID());
    },

    async listForPatient(patient: string) {
      return await execOp(patient, 'pool_patient_list', null, {}, randomUUID());
    },

    async claim(actor, id, key) {
      return await execOp(actor, 'pool_claim', id, {}, key);
    },

    async release(actor, id, expectedVersion, key) {
      return await execOp(actor, 'pool_release', id, { expectedVersion }, key);
    },

    async withdraw(patient, id, expectedVersion, key) {
      return await execOp(patient, 'pool_withdraw', id, { expectedVersion }, key);
    },
  };
}

export function createSharingPoolRepository(
  sql: Sql | null,
  dbPath?: string
): SharingPoolRepository {
  if (sql && !dbPath && process.env.APIP_POOL_POSTGRES === '1') {
    return postgresSharingPoolRepository(sql);
  }
  const path = dbPath ?? join(homedir(), '.apip', 'sharing-pool.sqlite');
  if (path !== ':memory:') {
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch {
      /* ignore */
    }
  }

  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS pooled_requests (
      id TEXT PRIMARY KEY,
      patient TEXT NOT NULL,
      case_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('pending_claim', 'claimed', 'withdrawn')),
      version INTEGER NOT NULL DEFAULT 1,
      policy_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      claimed_by TEXT,
      claimed_at TEXT,
      active_assignment_id TEXT,
      active_assignment_version INTEGER,
      safe_metadata TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      disclosure TEXT NOT NULL,
      disclosure_digest TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pool_state ON pooled_requests(state);
    CREATE INDEX IF NOT EXISTS idx_pool_patient ON pooled_requests(patient);
    CREATE INDEX IF NOT EXISTS idx_pool_claimed_by ON pooled_requests(claimed_by);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pool_one_active_case
      ON pooled_requests(patient, case_id)
      WHERE state IN ('pending_claim', 'claimed');

    CREATE TABLE IF NOT EXISTS pool_audit (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      command_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      UNIQUE(actor, command_id, action)
    );

    CREATE TABLE IF NOT EXISTS pool_receipts (
      actor TEXT NOT NULL,
      command_id TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      request_id TEXT NOT NULL,
      PRIMARY KEY (actor, command_id)
    );
  `);

  for (const col of [
    'ALTER TABLE pooled_requests ADD COLUMN active_assignment_id TEXT',
    'ALTER TABLE pooled_requests ADD COLUMN active_assignment_version INTEGER',
  ]) {
    try {
      db.exec(col);
    } catch {
      /* column already exists */
    }
  }
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_pool_active_assignment ON pooled_requests(active_assignment_id)');
  } catch {
    /* ignore */
  }

  function rowToItem(row: any): PooledReviewItem {
    return {
      id: row.id,
      caseId: row.case_id,
      revision: Number(row.revision),
      patient: row.patient,
      state: row.state,
      version: Number(row.version),
      policyVersion: row.policy_version,
      createdAt: row.created_at,
      claimedBy: row.claimed_by,
      claimedAt: row.claimed_at,
      activeAssignmentId: row.active_assignment_id ?? null,
      safeMetadata: JSON.parse(row.safe_metadata) as SafeQueueMetadata,
      snapshot: JSON.parse(row.snapshot),
      disclosure: JSON.parse(row.disclosure),
      disclosureDigest: row.disclosure_digest,
    };
  }

  const keyMutexes = new Map<string, Promise<unknown>>();
  async function withLocalMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = keyMutexes.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const chained = prev.then(() => gate);
    keyMutexes.set(key, chained);
    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (keyMutexes.get(key) === chained) {
        keyMutexes.delete(key);
      }
    }
  }

  async function withAdvisoryLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return withLocalMutex(id, async () => {
      if (sql) {
        return await sql.begin(async tx => {
          await tx`select pg_advisory_xact_lock(7345, hashtext(${id}))`;
          return await fn();
        });
      }
      return await fn();
    });
  }

  function hashValue(v: unknown): string {
    return createHash('sha256').update(JSON.stringify(v)).digest('hex');
  }

  return {
    mode: 'sqlite',

    async createPoolRequest(patient, body, key) {
      if (body.policyVersion !== pooledSharingPolicyVersion) {
        throw Error('EXPLICIT_CONSENT_REQUIRED');
      }

      return withAdvisoryLock(`case:${patient}:${body.caseId}`, async () => {
        const fingerprint = hashValue({
          op: 'pool_create',
          caseId: body.caseId,
          revision: body.revision,
          digest: body.digest,
          policyVersion: body.policyVersion,
        });
        const existingReceipt = db
          .prepare('SELECT request_hash, request_id FROM pool_receipts WHERE actor = ? AND command_id = ?')
          .get(patient, key) as { request_hash: string; request_id: string } | undefined;
        if (existingReceipt) {
          if (existingReceipt.request_hash !== fingerprint) {
            throw Error('IDEMPOTENCY_CONFLICT');
          }
          const row = db.prepare('SELECT * FROM pooled_requests WHERE id = ?').get(existingReceipt.request_id) as any;
          if (row) return rowToItem(row);
        }

        const existingStmt = db.prepare(
          "SELECT * FROM pooled_requests WHERE patient = ? AND case_id = ? AND state IN ('pending_claim', 'claimed')"
        );
        const existing = existingStmt.get(patient, body.caseId) as any;
        if (existing) {
          throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
        }

        const safeMetadata = extractSafeMetadata(body.snapshot, body.disclosure);
        const now = new Date().toISOString();
        const insertStmt = db.prepare(`
          INSERT INTO pooled_requests (
            id, patient, case_id, revision, state, version, policy_version,
            created_at, claimed_by, claimed_at, active_assignment_id, active_assignment_version,
            safe_metadata, snapshot, disclosure, disclosure_digest
          ) VALUES (?, ?, ?, ?, 'pending_claim', 1, ?, ?, NULL, NULL, NULL, NULL, ?, ?, ?, ?)
        `);

        insertStmt.run(
          body.id,
          patient,
          body.caseId,
          body.revision,
          body.policyVersion,
          now,
          JSON.stringify(safeMetadata),
          JSON.stringify(body.snapshot),
          JSON.stringify(body.disclosure),
          body.digest
        );

        db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(randomUUID(), body.id, patient, 'pool_consent_created', key, now);
        db.prepare(
          'INSERT INTO pool_receipts (actor, command_id, request_hash, request_id) VALUES (?, ?, ?, ?)'
        ).run(patient, key, fingerprint, body.id);

        return {
          id: body.id,
          caseId: body.caseId,
          revision: body.revision,
          patient,
          state: 'pending_claim',
          version: 1,
          policyVersion: body.policyVersion,
          createdAt: now,
          claimedBy: null,
          claimedAt: null,
          safeMetadata,
          snapshot: body.snapshot,
          disclosure: body.disclosure,
          disclosureDigest: body.digest,
        };
      });
    },

    async listQueue(limit = 50, actor?: string) {
      const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
      const rows = (actor
        ? db
            .prepare(`
              SELECT id, case_id, revision, state, created_at, safe_metadata
              FROM pooled_requests
              WHERE state = 'pending_claim' AND patient <> ?
              ORDER BY created_at DESC, id
              LIMIT ?
            `)
            .all(actor, safeLimit)
        : db
            .prepare(`
              SELECT id, case_id, revision, state, created_at, safe_metadata
              FROM pooled_requests
              WHERE state = 'pending_claim'
              ORDER BY created_at DESC, id
              LIMIT ?
            `)
            .all(safeLimit)) as any[];
      return rows.map(r => {
        const meta = JSON.parse(r.safe_metadata) as SafeQueueMetadata;
        return {
          id: r.id,
          caseId: r.case_id,
          caseRef: meta.caseRef ?? r.case_id.slice(0, 8),
          revision: Number(r.revision),
          state: 'pending_claim',
          createdAt: r.created_at,
          safeMetadata: meta,
        };
      });
    },

    async get(id: string) {
      const row = db
        .prepare('SELECT * FROM pooled_requests WHERE id = ? OR active_assignment_id = ?')
        .get(id, id) as any;
      return row ? rowToItem(row) : null;
    },

    async listForPatient(patient: string) {
      const rows = db
        .prepare('SELECT * FROM pooled_requests WHERE patient = ? ORDER BY created_at DESC, id LIMIT 50')
        .all(patient) as any[];
      return rows.map(rowToItem);
    },

    async claim(actor, id, key, assignFn) {
      return withAdvisoryLock(id, async () => {
        const row = db.prepare('SELECT * FROM pooled_requests WHERE id = ?').get(id) as any;
        if (!row) {
          throw Error('NOT_FOUND');
        }

        if (row.patient === actor) {
          throw Error('CONFLICT_OF_INTEREST');
        }

        if (row.state === 'withdrawn') {
          throw Error('NOT_FOUND');
        }

        const fingerprint = hashValue({ op: 'pool_claim', id });
        const receipt = db
          .prepare('SELECT request_hash, request_id FROM pool_receipts WHERE actor = ? AND command_id = ?')
          .get(actor, key) as { request_hash: string; request_id: string } | undefined;
        if (receipt) {
          if (receipt.request_hash !== fingerprint) {
            throw Error('IDEMPOTENCY_CONFLICT');
          }
          if (row.state === 'claimed' && row.claimed_by === actor) {
            return {
              request: {
                id: row.active_assignment_id ?? row.id,
                poolRequestId: row.id,
                caseId: row.case_id,
                revision: Number(row.revision),
                state: 'active',
                version: Number(row.version),
                assignedAt: row.claimed_at,
              },
            };
          }
          throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
        }

        if (row.state === 'claimed' && row.claimed_by === actor) {
          return {
            request: {
              id: row.active_assignment_id ?? row.id,
              poolRequestId: row.id,
              caseId: row.case_id,
              revision: Number(row.revision),
              state: 'active',
              version: Number(row.version),
              assignedAt: row.claimed_at,
            },
          };
        }

        if (row.state === 'claimed') {
          throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
        }

        const item = rowToItem(row);
        const assignmentId = randomUUID();
        const assignedResult = await assignFn(item, assignmentId);
        const effectiveAssignmentId = assignedResult?.id ?? assignmentId;
        const effectiveAssignmentVersion = Number(assignedResult?.version ?? 1);

        const now = new Date().toISOString();
        const updateStmt = db.prepare(`
          UPDATE pooled_requests
          SET state = 'claimed',
              claimed_by = ?,
              claimed_at = ?,
              active_assignment_id = ?,
              active_assignment_version = ?,
              version = version + 1
          WHERE id = ? AND state = 'pending_claim'
        `);
        const info = updateStmt.run(
          actor,
          now,
          effectiveAssignmentId,
          effectiveAssignmentVersion,
          id
        );
        if (info.changes === 0) {
          throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
        }

        db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(randomUUID(), id, actor, 'specialist_claim', key, now);
        db.prepare(
          'INSERT INTO pool_receipts (actor, command_id, request_hash, request_id) VALUES (?, ?, ?, ?)'
        ).run(actor, key, fingerprint, id);

        return {
          request: {
            id: effectiveAssignmentId,
            poolRequestId: row.id,
            caseId: row.case_id,
            revision: Number(row.revision),
            state: 'active',
            version: Number(row.version) + 1,
            assignedAt: now,
            details: assignedResult,
          },
        };
      });
    },

    async release(actor, id, expectedVersion, key, declineFn) {
      const lookup = db
        .prepare('SELECT id FROM pooled_requests WHERE id = ? OR active_assignment_id = ?')
        .get(id, id) as { id: string } | undefined;
      if (!lookup) {
        throw Error('NOT_FOUND');
      }

      return withAdvisoryLock(lookup.id, async () => {
        const row = db.prepare('SELECT * FROM pooled_requests WHERE id = ?').get(lookup.id) as any;
        if (!row) {
          throw Error('NOT_FOUND');
        }

        const replayAudit = db
          .prepare(
            "SELECT 1 FROM pool_audit WHERE request_id = ? AND actor = ? AND command_id = ? AND action = 'specialist_release_to_pool'"
          )
          .get(row.id, actor, key);
        if (replayAudit) {
          return {
            request: {
              id: row.id,
              caseId: row.case_id,
              revision: Number(row.revision),
              state: row.state,
              version: Number(row.version),
            },
          };
        }

        if (row.claimed_by !== actor || row.state !== 'claimed') {
          throw Error('FORBIDDEN');
        }

        const targetByAssignment = row.active_assignment_id === id && id !== row.id;
        const assignmentVersion = Number(row.active_assignment_version ?? 1);
        const expectedTargetVersion = targetByAssignment ? assignmentVersion : Number(row.version);
        if (expectedTargetVersion !== expectedVersion) {
          throw Error('REVISION_CONFLICT');
        }

        await declineFn(row.active_assignment_id ?? row.id, assignmentVersion);

        const now = new Date().toISOString();
        db.prepare(`
          UPDATE pooled_requests
          SET state = 'pending_claim',
              claimed_by = NULL,
              claimed_at = NULL,
              active_assignment_id = NULL,
              active_assignment_version = NULL,
              version = version + 1
          WHERE id = ? AND claimed_by = ?
        `).run(row.id, actor);

        db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(randomUUID(), row.id, actor, 'specialist_release_to_pool', key, now);

        return {
          request: {
            id: row.id,
            caseId: row.case_id,
            revision: Number(row.revision),
            state: 'pending_claim',
            version: Number(row.version) + 1,
          },
        };
      });
    },

    async withdraw(patient, id, expectedVersion, key, withdrawFn) {
      return withAdvisoryLock(id, async () => {
        const row = db.prepare('SELECT * FROM pooled_requests WHERE id = ?').get(id) as any;
        if (!row || row.patient !== patient) {
          throw Error('NOT_FOUND');
        }

        if (row.state === 'withdrawn') {
          return {
            request: {
              id: row.id,
              caseId: row.case_id,
              revision: Number(row.revision),
              state: 'withdrawn',
              version: Number(row.version),
            },
          };
        }

        if (Number(row.version) !== expectedVersion) {
          throw Error('REVISION_CONFLICT');
        }

        if (row.state === 'claimed' && withdrawFn) {
          await withdrawFn(
            row.active_assignment_id ?? row.id,
            Number(row.active_assignment_version ?? 1)
          );
        }

        const now = new Date().toISOString();
        db.prepare(`
          UPDATE pooled_requests
          SET state = 'withdrawn',
              claimed_by = NULL,
              claimed_at = NULL,
              active_assignment_id = NULL,
              active_assignment_version = NULL,
              version = version + 1
          WHERE id = ? AND patient = ?
        `).run(id, patient);

        db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(randomUUID(), id, patient, 'pool_withdrawal', key, now);

        return {
          request: {
            id: row.id,
            caseId: row.case_id,
            revision: Number(row.revision),
            state: 'withdrawn',
            version: Number(row.version) + 1,
          },
        };
      });
    },
  };
}
