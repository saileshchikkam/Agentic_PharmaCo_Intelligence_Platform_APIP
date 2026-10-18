export interface ProfileInput {
  display_name: string;
  birth_date: string;
  relationship: 'self' | 'caregiver';
  conditions: string | null;
  surgeries: string | null;
  medicines: string | null;
  allergies: string | null;
  history_notes: string | null;
  share_medassist: boolean;
  share_adr: boolean;
}
export interface PatientProfile extends ProfileInput {
  user_id: string;
  revision: number;
  updated_at: string;
}
export const historyFields = ['conditions', 'surgeries', 'medicines', 'allergies', 'history_notes'] as const;
export const emptyProfile = (): ProfileInput => ({ display_name: '', birth_date: '', relationship: 'self',
  conditions: null, surgeries: null, medicines: null, allergies: null, history_notes: null,
  share_medassist: false, share_adr: false });

export function ageOn(date: string, today = new Date().toISOString().slice(0, 10)): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > today) return null;
  const age = Number(today.slice(0, 4)) - Number(date.slice(0, 4)) - (today.slice(5) < date.slice(5) ? 1 : 0);
  return age >= 0 && age <= 130 ? age : null;
}

export function validateProfile(value: ProfileInput, today?: string): string | null {
  if (!value.display_name.trim() || value.display_name.length > 100) return 'Enter a name of up to 100 characters.';
  const age = ageOn(value.birth_date, today);
  if (age === null) return 'Enter a valid date of birth as YYYY-MM-DD (age 0–130).';
  if (!['self', 'caregiver'].includes(value.relationship)) return 'Choose who this profile is for.';
  if (age < 18 && value.relationship !== 'caregiver') return 'For this prototype, a child’s profile must be managed by a parent or caregiver.';
  for (const field of historyFields) if (value[field] !== null && (typeof value[field] !== 'string' || value[field]!.length > 2000)) return 'Keep each history answer within 2,000 characters.';
  if (typeof value.share_medassist !== 'boolean' || typeof value.share_adr !== 'boolean') return 'Review your sharing choices.';
  return null;
}

/** Names/identifiers are excluded from task context. Never automatically submit this to a model. */
export function profileContext(profile: PatientProfile, layer: 'medassist' | 'adr', today?: string) {
  if (!(layer === 'medassist' ? profile.share_medassist : profile.share_adr)) return null;
  return { source: 'user-confirmed-profile' as const, revision: profile.revision,
    age: ageOn(profile.birth_date, today), conditions: profile.conditions, surgeries: profile.surgeries,
    medicines: profile.medicines, allergies: profile.allergies, history_notes: profile.history_notes };
}
