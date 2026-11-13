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

export function extractSafeMetadata(snapshot: any, disclosure: any): SafeQueueMetadata {
  // Free-text redaction cannot guarantee removal of unlisted third-party names.
  // Pre-claim rows disclose structural counts only; assigned reviewers get summaries.
  const caseRef = typeof snapshot?.id === 'string' ? snapshot.id.slice(0, 8) : 'Case';
  const count=Array.isArray(snapshot?.medications)?snapshot.medications.filter((m:any)=>m.kind==='suspect').length:0;
  return {caseRef,reactionSnippet:'Confirmed reaction reported',suspectMedicineClass:count+' suspect medicine'+(count===1?'':'s')+' recorded'};
}
