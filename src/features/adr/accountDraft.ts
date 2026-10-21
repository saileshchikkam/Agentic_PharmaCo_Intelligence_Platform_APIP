import type { AdrDraft } from './draftStorage';

export interface DraftCommand {
  fictionalOnly: true;
  id: string;
  expectedRevision: number | null;
  status: 'draft' | 'user-confirmed';
  statements: AdrDraft['statements'];
}
const keys = (value: unknown, expected: string[]): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
export const isDraftId = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function validateDraftCommand(value: unknown): DraftCommand | null {
  if (!keys(value, ['fictionalOnly', 'id', 'expectedRevision', 'status', 'statements']) || value.fictionalOnly !== true
    || !isDraftId(value.id) || !['draft', 'user-confirmed'].includes(value.status as string)
    || !(value.expectedRevision === null || (Number.isSafeInteger(value.expectedRevision) && Number(value.expectedRevision) > 0))
    || !keys(value.statements, ['source', 'medicineName', 'dose', 'reaction', 'onset'])) return null;
  const statements = value.statements;
  if (statements.source !== 'reporter' || typeof statements.reaction !== 'string' || statements.reaction.length > 4000
    || (value.status === 'user-confirmed' && !statements.reaction.trim())) return null;
  for (const field of ['medicineName', 'dose', 'onset']) {
    const item = statements[field];
    if (item !== null && (typeof item !== 'string' || !item.trim() || item.length > 200)) return null;
  }
  return value as unknown as DraftCommand;
}

export function readAccountDraft(value: unknown): AdrDraft | null {
  if (!keys(value, ['schemaVersion', 'id', 'language', 'status', 'confirmedAt', 'revision', 'createdAt', 'updatedAt', 'statements'])
    || value.schemaVersion !== 2 || value.language !== 'en'
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))
    || (value.status === 'draft' ? value.confirmedAt !== null : typeof value.confirmedAt !== 'string' || !Number.isFinite(Date.parse(value.confirmedAt)))
    || !validateDraftCommand({ fictionalOnly: true, id: value.id, expectedRevision: value.revision, status: value.status, statements: value.statements })) return null;
  return value as unknown as AdrDraft;
}

export interface AccountDraftRepository {
  load: (userId: string) => Promise<AdrDraft[]>;
  save: (userId: string, draft: AdrDraft, expectedRevision: number | null) => Promise<AdrDraft>;
  remove: (userId: string, draft: AdrDraft) => Promise<void>;
}
