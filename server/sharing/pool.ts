import type { Sql } from 'postgres';
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
  listQueue(limit?: number): Promise<SafeQueueEntry[]>;
  get(id: string): Promise<PooledReviewItem | null>;
  listForPatient(patient: string): Promise<PooledReviewItem[]>;
  claim(
    actor: string,
    id: string,
    key: string,
    assignFn: (item: PooledReviewItem) => Promise<any>
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

export function createSharingPoolRepository(
  sql: Sql | null,
  dbPath?: string
): SharingPoolRepository {
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
      safe_metadata TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      disclosure TEXT NOT NULL,
      disclosure_digest TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pool_state ON pooled_requests(state);
    CREATE INDEX IF NOT EXISTS idx_pool_patient ON pooled_requests(patient);
    CREATE INDEX IF NOT EXISTS idx_pool_claimed_by ON pooled_requests(claimed_by);

    CREATE TABLE IF NOT EXISTS pool_audit (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      command_id TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      UNIQUE(actor, command_id, action)
    );
  `);

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
      safeMetadata: JSON.parse(row.safe_metadata) as SafeQueueMetadata,
      snapshot: JSON.parse(row.snapshot),
      disclosure: JSON.parse(row.disclosure),
      disclosureDigest: row.disclosure_digest,
    };
  }

  async function withAdvisoryLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    if (sql) {
      return await sql.begin(async tx => {
        await tx`select pg_advisory_xact_lock(7345, hashtext(${id}))`;
        return await fn();
      });
    }
    return await fn();
  }

  return {
    async createPoolRequest(patient, body, key) {
      if (body.policyVersion !== pooledSharingPolicyVersion) {
        throw Error('EXPLICIT_CONSENT_REQUIRED');
      }

      return withAdvisoryLock(body.caseId, async () => {
        // Enforce only one active pool request per case
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
            created_at, claimed_by, claimed_at, safe_metadata, snapshot,
            disclosure, disclosure_digest
          ) VALUES (?, ?, ?, ?, 'pending_claim', 1, ?, ?, NULL, NULL, ?, ?, ?, ?)
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

        const auditStmt = db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        auditStmt.run(crypto.randomUUID(), body.id, patient, 'pool_consent_created', key, now);

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

    async listQueue(limit = 50) {
      const stmt = db.prepare(`
        SELECT id, case_id, revision, state, created_at, safe_metadata
        FROM pooled_requests
        WHERE state = 'pending_claim'
        ORDER BY created_at DESC
        LIMIT ?
      `);
      const rows = stmt.all(limit) as any[];
      return rows.map(r => ({
        id: r.id,
        caseId: r.case_id,
        caseRef: (JSON.parse(r.safe_metadata) as SafeQueueMetadata).caseRef ?? r.case_id.slice(0, 8),
        revision: Number(r.revision),
        state: 'pending_claim',
        createdAt: r.created_at,
        safeMetadata: JSON.parse(r.safe_metadata) as SafeQueueMetadata,
      }));
    },

    async get(id: string) {
      const stmt = db.prepare('SELECT * FROM pooled_requests WHERE id = ?');
      const row = stmt.get(id) as any;
      return row ? rowToItem(row) : null;
    },

    async listForPatient(patient: string) {
      const stmt = db.prepare(
        'SELECT * FROM pooled_requests WHERE patient = ? ORDER BY created_at DESC LIMIT 50'
      );
      const rows = stmt.all(patient) as any[];
      return rows.map(rowToItem);
    },

    async claim(actor, id, key, assignFn) {
      return withAdvisoryLock(id, async () => {
        const stmt = db.prepare('SELECT * FROM pooled_requests WHERE id = ?');
        const row = stmt.get(id) as any;
        if (!row) {
          throw Error('NOT_FOUND');
        }

        // C1-E: Conflict of interest self-assignment check
        if (row.patient === actor) {
          throw Error('CONFLICT_OF_INTEREST');
        }

        if (row.state === 'withdrawn') {
          throw Error('NOT_FOUND');
        }

        // If already claimed by this exact specialist (idempotent replay)
        if (row.state === 'claimed' && row.claimed_by === actor) {
          return {
            request: {
              id: row.id,
              caseId: row.case_id,
              revision: Number(row.revision),
              state: 'active',
              version: Number(row.version),
              assignedAt: row.claimed_at,
            },
          };
        }

        // If already claimed by someone else, fail with ACTIVE_ASSIGNMENT_CONFLICT
        if (row.state === 'claimed') {
          throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
        }

        const item = rowToItem(row);

        // Call the official assignment function (creates row in apip_sharing.requests)
        const assignedResult = await assignFn(item);

        const now = new Date().toISOString();
        const updateStmt = db.prepare(`
          UPDATE pooled_requests
          SET state = 'claimed', claimed_by = ?, claimed_at = ?, version = version + 1
          WHERE id = ? AND state = 'pending_claim'
        `);
        const info = updateStmt.run(actor, now, id);
        if (info.changes === 0) {
          throw Error('ACTIVE_ASSIGNMENT_CONFLICT');
        }

        const auditStmt = db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        auditStmt.run(crypto.randomUUID(), id, actor, 'specialist_claim', key, now);

        return {
          request: {
            id: row.id,
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
      return withAdvisoryLock(id, async () => {
        const stmt = db.prepare('SELECT * FROM pooled_requests WHERE id = ?');
        const row = stmt.get(id) as any;
        if (!row) {
          throw Error('NOT_FOUND');
        }

        if (row.claimed_by !== actor || row.state !== 'claimed') {
          throw Error('FORBIDDEN');
        }

        if (row.version !== expectedVersion) {
          throw Error('REVISION_CONFLICT');
        }

        await declineFn(id, expectedVersion);

        const now = new Date().toISOString();
        const updateStmt = db.prepare(`
          UPDATE pooled_requests
          SET state = 'pending_claim', claimed_by = NULL, claimed_at = NULL, version = version + 1
          WHERE id = ? AND claimed_by = ?
        `);
        updateStmt.run(id, actor);

        const auditStmt = db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        auditStmt.run(crypto.randomUUID(), id, actor, 'specialist_release_to_pool', key, now);

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
        const stmt = db.prepare('SELECT * FROM pooled_requests WHERE id = ?');
        const row = stmt.get(id) as any;
        if (!row) {
          throw Error('NOT_FOUND');
        }

        if (row.patient !== patient) {
          throw Error('NOT_FOUND');
        }

        if (row.state === 'withdrawn') {
          return {
            request: {
              id: row.id,
              state: 'withdrawn',
              version: Number(row.version),
            },
          };
        }

        if (row.version !== expectedVersion) {
          throw Error('REVISION_CONFLICT');
        }

        if (row.state === 'claimed' && withdrawFn) {
          await withdrawFn(id, expectedVersion);
        }

        const now = new Date().toISOString();
        const updateStmt = db.prepare(`
          UPDATE pooled_requests
          SET state = 'withdrawn', version = version + 1
          WHERE id = ? AND patient = ?
        `);
        updateStmt.run(id, patient);

        const auditStmt = db.prepare(
          'INSERT INTO pool_audit (id, request_id, actor, action, command_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        auditStmt.run(crypto.randomUUID(), id, patient, 'pool_withdrawal', key, now);

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
