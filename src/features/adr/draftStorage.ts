export type AdrDraftLanguage = 'en' | 'te';
export type AdrDraftStatus = 'draft' | 'user-confirmed';

export interface AdrDraft {
  schemaVersion: 2;
  id: string;
  language: AdrDraftLanguage;
  status: AdrDraftStatus;
  confirmedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  statements: {
    source: 'reporter';
    medicineName: string | null;
    dose: string | null;
    reaction: string;
    onset: string | null;
  };
}

interface LegacyAdrDraft {
  schemaVersion: 1;
  id: string;
  language: AdrDraftLanguage;
  revision: number;
  createdAt: string;
  updatedAt: string;
  statements: AdrDraft['statements'];
}

interface AdrDraftCollection {
  schemaVersion: 1;
  drafts: AdrDraft[];
}

export const ADR_DRAFT_STORAGE_KEY = 'apip.fictionalAdrDraft.v2';
export const ADR_DRAFTS_STORAGE_KEY = 'apip.fictionalAdrDrafts.v1';
const legacyStorageKey = 'apip.fictionalAdrDraft.v1';

export interface AdrDraftsLoadResult {
  drafts: AdrDraft[];
  error: boolean;
}

function isNullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= maxLength);
}

function hasValidDraftFields(value: unknown): value is LegacyAdrDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<LegacyAdrDraft>;
  const statements = draft.statements;

  return (
    draft.schemaVersion === 1 &&
    typeof draft.id === 'string' &&
    (draft.language === 'en' || draft.language === 'te') &&
    Number.isInteger(draft.revision) &&
    (draft.revision ?? 0) > 0 &&
    typeof draft.createdAt === 'string' &&
    typeof draft.updatedAt === 'string' &&
    typeof statements === 'object' &&
    statements !== null &&
    statements.source === 'reporter' &&
    isNullableText(statements.medicineName, 200) &&
    isNullableText(statements.dose, 200) &&
    typeof statements.reaction === 'string' &&
    statements.reaction.trim().length > 0 &&
    statements.reaction.length <= 4000 &&
    isNullableText(statements.onset, 200)
  );
}

function isAdrDraft(value: unknown): value is AdrDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<AdrDraft>;
  if (draft.schemaVersion !== 2 || (draft.status !== 'draft' && draft.status !== 'user-confirmed')) return false;
  if (draft.status === 'user-confirmed' && typeof draft.confirmedAt !== 'string') return false;
  if (draft.status === 'draft' && draft.confirmedAt !== null) return false;
  return hasValidDraftFields({ ...draft, schemaVersion: 1 });
}

function migrateLegacyDraft(draft: LegacyAdrDraft): AdrDraft {
  return {
    ...draft,
    schemaVersion: 2,
    status: 'draft',
    confirmedAt: null,
  };
}

function readDraft(value: unknown): AdrDraft | null {
  if (isAdrDraft(value)) return value;
  if (hasValidDraftFields(value)) return migrateLegacyDraft(value);
  return null;
}

function readCollection(value: unknown): AdrDraft[] | null {
  if (typeof value !== 'object' || value === null) return null;
  const collection = value as Partial<AdrDraftCollection>;
  if (collection.schemaVersion !== 1 || !Array.isArray(collection.drafts)) return null;
  const drafts = collection.drafts.map(readDraft);
  if (drafts.some((draft) => draft === null)) return null;
  const validDrafts = drafts as AdrDraft[];
  if (new Set(validDrafts.map((draft) => draft.id)).size !== validDrafts.length) return null;
  return validDrafts;
}

export function loadAdrDrafts(): AdrDraftsLoadResult {
  try {
    const collectionValue = window.localStorage.getItem(ADR_DRAFTS_STORAGE_KEY);
    if (collectionValue !== null) {
      const drafts = readCollection(JSON.parse(collectionValue));
      return drafts ? { drafts, error: false } : { drafts: [], error: true };
    }

    const currentValue = window.localStorage.getItem(ADR_DRAFT_STORAGE_KEY);
    if (currentValue !== null) {
      const draft = readDraft(JSON.parse(currentValue));
      return draft ? { drafts: [draft], error: false } : { drafts: [], error: true };
    }

    const legacyValue = window.localStorage.getItem(legacyStorageKey);
    if (legacyValue === null) return { drafts: [], error: false };
    const legacyDraft = readDraft(JSON.parse(legacyValue));
    return legacyDraft ? { drafts: [legacyDraft], error: false } : { drafts: [], error: true };
  } catch {
    return { drafts: [], error: true };
  }
}

export function saveAdrDrafts(drafts: AdrDraft[]): void {
  if (!drafts.every(isAdrDraft) || new Set(drafts.map((draft) => draft.id)).size !== drafts.length) {
    throw new TypeError('ADR draft collection contains invalid or duplicate drafts.');
  }
  const collection: AdrDraftCollection = { schemaVersion: 1, drafts };
  window.localStorage.setItem(ADR_DRAFTS_STORAGE_KEY, JSON.stringify(collection));
}
