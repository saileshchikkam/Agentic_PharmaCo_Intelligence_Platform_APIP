export type AdrDraftLanguage = 'en' | 'te';

export interface AdrDraft {
  schemaVersion: 1;
  id: string;
  language: AdrDraftLanguage;
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

export const ADR_DRAFT_STORAGE_KEY = 'apip.fictionalAdrDraft.v1';

export interface AdrDraftLoadResult {
  draft: AdrDraft | null;
  error: boolean;
}

function isNullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= maxLength);
}

function isAdrDraft(value: unknown): value is AdrDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<AdrDraft>;
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

export function loadAdrDraft(): AdrDraftLoadResult {
  try {
    const serialized = window.localStorage.getItem(ADR_DRAFT_STORAGE_KEY);
    if (serialized === null) return { draft: null, error: false };

    const parsed: unknown = JSON.parse(serialized);
    return isAdrDraft(parsed)
      ? { draft: parsed, error: false }
      : { draft: null, error: true };
  } catch {
    return { draft: null, error: true };
  }
}

export function saveAdrDraft(draft: AdrDraft): void {
  window.localStorage.setItem(ADR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}
