import { missing, type GuidedCase } from '../guided/domain';

export type CaseFilters = {
  limit: number; q: string; medicine: string; status: 'all' | 'draft' | 'intake_complete' | 'finalized';
  caseType: 'all' | 'Initial' | 'Follow-up'; dateField: 'created' | 'updated' | 'reported';
  from: string; to: string; sort: 'created' | 'updated'; direction: 'asc' | 'desc'; archived: 'exclude';
};
export const defaultFilters: CaseFilters = { limit: 12, q: '', medicine: '', status: 'all', caseType: 'all',
  dateField: 'updated', from: '', to: '', sort: 'updated', direction: 'desc', archived: 'exclude' };
export type CaseCard = { id: string; revision: number; createdAt: string; updatedAt: string;
  medicines: string[]; caseType: string | null; intakeComplete: boolean; status: 'draft'|'finalized'; reviewStatus: 'shared'|null };
export type CasePage = { cases: CaseCard[]; nextCursor: string | null };
export type RevisionDescriptor = { revision: number; savedAt: string };
export const confirmed = (c: GuidedCase, key: string) => c.values[key]?.state === 'provided' ? c.values[key].value : null;
export function caseCard(c: GuidedCase, createdAt: string): CaseCard {
  return { id: c.id, revision: c.revision, createdAt, updatedAt: c.updatedAt,
    medicines: c.medications.map(m => confirmed(c, `med.${m.id}.name`)).filter((s): s is string => !!s),
    caseType: confirmed(c, 'caseType'), intakeComplete: missing(c).length === 0, status: 'draft', reviewStatus: null };
}
