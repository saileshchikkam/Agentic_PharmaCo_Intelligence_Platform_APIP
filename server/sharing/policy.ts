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

export function extractSafeMetadata(snapshot: any, disclosure: any): SafeQueueMetadata {
  const caseRef = typeof snapshot.id === 'string' ? snapshot.id.slice(0, 8) : 'Case';
  const rxField = disclosure?.fields?.find((f: any) => f.key === 'reaction');
  const reactionSnippet = rxField && rxField.state === 'provided' && typeof rxField.value === 'string' && rxField.value.trim()
    ? rxField.value.trim().slice(0, 120)
    : 'Adverse event summary';

  const medNames: string[] = [];
  if (snapshot.medications && Array.isArray(snapshot.medications)) {
    for (const m of snapshot.medications) {
      if (m.kind === 'suspect') {
        const nameField = disclosure?.fields?.find((f: any) => f.key === `med.${m.id}.name`);
        if (nameField && nameField.state === 'provided' && typeof nameField.value === 'string' && nameField.value.trim()) {
          medNames.push(nameField.value.trim());
        }
      }
    }
  }
  const suspectMedicineClass = medNames.length > 0 ? medNames.join(', ') : 'Suspect medication';
  const serField = disclosure?.fields?.find((f: any) => f.key === 'seriousness');
  const seriousness = serField && serField.state === 'provided' && serField.value ? serField.value : undefined;

  return { caseRef, reactionSnippet, suspectMedicineClass, seriousness };
}
