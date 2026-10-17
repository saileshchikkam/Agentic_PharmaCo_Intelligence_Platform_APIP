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

export const ADR_DRAFT_STORAGE_KEY = 'apip.fictionalAdrDraft.v2';
const legacyStorageKey = 'apip.fictionalAdrDraft.v1';

export interface AdrDraftLoadResult {
  draft: AdrDraft | null;
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

function readDraft(serialized: string): AdrDraft | null {
  const parsed: unknown = JSON.parse(serialized);
  if (isAdrDraft(parsed)) return parsed;
  if (hasValidDraftFields(parsed)) return migrateLegacyDraft(parsed);
  return null;
}

export function loadAdrDraft(): AdrDraftLoadResult {
  try {
    const current = window.localStorage.getItem(ADR_DRAFT_STORAGE_KEY);
    if (current !== null) {
      const draft = readDraft(current);
      return draft ? { draft, error: false } : { draft: null, error: true };
    }

    const legacy = window.localStorage.getItem(legacyStorageKey);
    if (legacy === null) return { draft: null, error: false };
    const draft = readDraft(legacy);
    return draft ? { draft, error: false } : { draft: null, error: true };
  } catch {
    return { draft: null, error: true };
  }
}

export function saveAdrDraft(draft: AdrDraft): void {
  window.localStorage.setItem(ADR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}
