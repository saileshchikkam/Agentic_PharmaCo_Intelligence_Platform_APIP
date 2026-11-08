// Policy v1. Not mounted on an API until the repository/migration is verified.
export const sharingPolicyVersion='phase3c-b-v1';
export type ReviewGrant={patient:string;specialist:string;caseId:string;revision:number;state:'active'|'withdrawn'|'declined';consentActive:boolean;assignmentActive:boolean};
export type CurrentSpecialist={subject:string;state:string;validUntil:string|null;directoryOptIn:boolean};
export function eligibleRecipient(identity:CurrentSpecialist,patient:string,now:number){
 return identity.subject!==patient&&identity.directoryOptIn&&identity.state==='APPROVED'
  &&identity.validUntil!==null&&Number.isFinite(Date.parse(identity.validUntil))&&Date.parse(identity.validUntil)>now;
}
// Caller and identity must be resolved from verified server/database context.
// Directory opt-in controls new recipient selection, not an existing consent grant.
export function canReadSharedRevision(actor:string,identity:CurrentSpecialist,grant:ReviewGrant,caseId:string,revision:number,now:number){
 return actor===identity.subject&&actor===grant.specialist&&actor!==grant.patient
  &&identity.state==='APPROVED'&&identity.validUntil!==null&&Number.isFinite(Date.parse(identity.validUntil))&&Date.parse(identity.validUntil)>now
  &&grant.state==='active'&&grant.consentActive&&grant.assignmentActive&&grant.caseId===caseId&&grant.revision===revision;
}
