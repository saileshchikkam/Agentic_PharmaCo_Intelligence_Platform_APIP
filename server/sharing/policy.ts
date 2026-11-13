// Policy v1. Not mounted on an API until the repository/migration is verified.
export const sharingPolicyVersion = 'phase3c-b-v1';
export const pooledSharingPolicyVersion = 'phase3c-c1-v1';

export type ReviewGrant = {
  patient: string;
  specialist: string;
  caseId: string;
  revision: number;
  state: 'active' | 'withdrawn' | 'declined';
  consentActive: boolean;
  assignmentActive: boolean;
};

export type CurrentSpecialist = {
  subject: string;
  state: string;
  validUntil: string | null;
  directoryOptIn: boolean;
};

export type SafeQueueMetadata = {
  caseRef: string;
  reactionSnippet: string;
  suspectMedicineClass: string;
  seriousness?: string;
};

export type PooledRequestState = 'pending_claim' | 'claimed' | 'withdrawn';

export type PooledReviewItem = {
  id: string;
  caseId: string;
  revision: number;
  patient: string;
  state: PooledRequestState;
  version: number;
  policyVersion: string;
  createdAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
  activeAssignmentId?: string | null;
  safeMetadata: SafeQueueMetadata;
  snapshot: any;
  disclosure: any;
  disclosureDigest: string;
};

export type SafeQueueEntry = {
  id: string;
  caseId: string;
  caseRef: string;
  revision: number;
  state: 'pending_claim';
  createdAt: string;
  safeMetadata: SafeQueueMetadata;
};

export function eligibleRecipient(identity: CurrentSpecialist, patient: string, now: number) {
  return identity.subject !== patient && identity.directoryOptIn && identity.state === 'APPROVED'
    && identity.validUntil !== null && Number.isFinite(Date.parse(identity.validUntil)) && Date.parse(identity.validUntil) > now;
}

// Caller and identity must be resolved from verified server/database context.
// Directory opt-in controls new recipient selection, not an existing consent grant.
export function canReadSharedRevision(actor: string, identity: CurrentSpecialist, grant: ReviewGrant, caseId: string, revision: number, now: number) {
  return actor === identity.subject && actor === grant.specialist && actor !== grant.patient
    && identity.state === 'APPROVED' && identity.validUntil !== null && Number.isFinite(Date.parse(identity.validUntil)) && Date.parse(identity.validUntil) > now
    && grant.state === 'active' && grant.consentActive && grant.assignmentActive && grant.caseId === caseId && grant.revision === revision;
}

export function canViewQueue(identity: CurrentSpecialist, now: number): boolean {
  return identity.state === 'APPROVED'
    && identity.validUntil !== null
    && Number.isFinite(Date.parse(identity.validUntil))
    && Date.parse(identity.validUntil) > now;
}

export function canClaimPooledReview(
  actor: string,
  identity: CurrentSpecialist,
  item: PooledReviewItem,
  now: number
): { allowed: boolean; reason?: 'FORBIDDEN' | 'CONFLICT_OF_INTEREST' | 'ALREADY_CLAIMED' | 'WITHDRAWN' } {
  if (!canViewQueue(identity, now) || actor !== identity.subject) {
    return { allowed: false, reason: 'FORBIDDEN' };
  }
  if (actor === item.patient) {
    return { allowed: false, reason: 'CONFLICT_OF_INTEREST' };
  }
  if (item.state === 'withdrawn') {
    return { allowed: false, reason: 'WITHDRAWN' };
  }
  if (item.state === 'claimed' && item.claimedBy !== actor) {
    return { allowed: false, reason: 'ALREADY_CLAIMED' };
  }
  return { allowed: true };
}

const DIRECT_IDENTIFIER_KEYS = new Set([
  'initials',
  'dob',
  'reporterName',
  'address',
  'pin',
  'email',
  'phone',
  'occupation',
]);
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_RE = /\bhttps?:\/\/\S+/gi;
const PHONE_OR_ID_RE = /(?:\+?\d[\d\s\-().]{5,}\d)/g;

function sanitizeQueueText(raw: unknown, personalValues: string[], maxLen: number, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  let text = raw.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim();
  if (!text) return fallback;
  for (const secret of personalValues) {
    if (secret.length >= 4) {
      const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escaped, 'gi'), '[redacted]');
    }
  }
  text = text
    .replace(EMAIL_RE, '[redacted email]')
    .replace(URL_RE, '[redacted link]')
    .replace(PHONE_OR_ID_RE, '[redacted number]')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trimEnd()}…` : text;
}

export function extractSafeMetadata(snapshot: any, disclosure: any): SafeQueueMetadata {
  const caseRef = typeof snapshot?.id === 'string' ? snapshot.id.slice(0, 8) : 'Case';
  const personalValues: string[] = [];
  if (Array.isArray(disclosure?.fields)) {
    for (const f of disclosure.fields) {
      if (DIRECT_IDENTIFIER_KEYS.has(f?.key) && f?.state === 'provided' && typeof f?.value === 'string') {
        const trimmed = f.value.trim();
        if (trimmed) personalValues.push(trimmed);
      }
    }
  }
  if (snapshot?.values && typeof snapshot.values === 'object') {
    for (const key of DIRECT_IDENTIFIER_KEYS) {
      const v = snapshot.values[key];
      if (v?.state === 'provided' && typeof v?.value === 'string' && v.value.trim()) {
        personalValues.push(v.value.trim());
      }
    }
  }

  const rxField = disclosure?.fields?.find((f: any) => f.key === 'reaction');
  const reactionSnippet = sanitizeQueueText(
    rxField?.state === 'provided' ? rxField.value : '',
    personalValues,
    120,
    'Adverse event summary'
  );

  const medNames: string[] = [];
  if (snapshot?.medications && Array.isArray(snapshot.medications)) {
    for (const m of snapshot.medications) {
      if (m.kind === 'suspect') {
        const nameField = disclosure?.fields?.find((f: any) => f.key === `med.${m.id}.name`);
        if (nameField && nameField.state === 'provided' && typeof nameField.value === 'string' && nameField.value.trim()) {
          const safeMed = sanitizeQueueText(nameField.value, personalValues, 80, '');
          if (safeMed) medNames.push(safeMed);
        }
      }
    }
  }
  const suspectMedicineClass = sanitizeQueueText(medNames.join(', '), personalValues, 120, 'Suspect medication');
  const serField = disclosure?.fields?.find((f: any) => f.key === 'seriousness');
  const seriousness =
    serField && serField.state === 'provided' && typeof serField.value === 'string'
      ? sanitizeQueueText(serField.value, personalValues, 80, '') || undefined
      : undefined;

  return { caseRef, reactionSnippet, suspectMedicineClass, seriousness };
}
