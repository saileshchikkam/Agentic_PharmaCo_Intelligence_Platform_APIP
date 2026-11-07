// Identity only. No capability in this module grants access to patient records.
export const categories = ['Pharmacovigilance Associate','Pharmacist','Clinical Reviewer','Pharmacovigilance Coordinator'] as const;
export type ApplicationState = 'DRAFT'|'SUBMITTED'|'PENDING_VERIFICATION'|'APPROVED'|'REJECTED'|'SUSPENDED'|'REVOKED'|'EXPIRED';
export type ProfessionalProfile = {fullName:string;category:string;qualification:string;registration:string;jurisdiction:string;organization:string;department:string;experience:string;specialization:string};
export type Decision = {id:string;actor:string;action:string;reason:string;evidenceReference:string;at:string;policyVersion:string};
export type Application = {id:string;owner:string;version:number;state:ApplicationState;profile:ProfessionalProfile;decisions:Decision[];validUntil?:string};
export type PrototypePolicy = {version:string;approved:boolean;categories:readonly string[]};
export const disabledPolicy:PrototypePolicy = {version:'unapproved',approved:false,categories:[]};
export function validateProfile(value:unknown):ProfessionalProfile {
  const keys=['fullName','category','qualification','registration','jurisdiction','organization','department','experience','specialization'];
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==keys.sort().join(','))throw Error('INVALID_PROFILE');
  const p=value as ProfessionalProfile;
  if(keys.some(k=>typeof p[k as keyof ProfessionalProfile]!=='string'||p[k as keyof ProfessionalProfile].length>300))throw Error('INVALID_PROFILE');
  if(!p.fullName.trim()||!p.qualification.trim()||!categories.some(c=>c===p.category))throw Error('INVALID_PROFILE');
  return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,v.trim()])) as ProfessionalProfile;
}
export function decide(application:Application,actor:string,canAdminister:boolean,action:string,
  reason:string,evidenceReference:string,policy:PrototypePolicy):ApplicationState {
  if(!canAdminister)throw Error('FORBIDDEN');
  if(actor===application.owner)throw Error('SELF_APPROVAL_DENIED');
  if(!policy.approved)throw Error('POLICY_NOT_APPROVED');
  if(!reason.trim()||reason.length>300||evidenceReference.length>200)throw Error('INVALID_DECISION');
  const transitions:Record<string,Partial<Record<ApplicationState,ApplicationState>>>={
    begin_verification:{SUBMITTED:'PENDING_VERIFICATION'},
    approve:{PENDING_VERIFICATION:'APPROVED'},reject:{SUBMITTED:'REJECTED',PENDING_VERIFICATION:'REJECTED'},
    suspend:{APPROVED:'SUSPENDED'},revoke:{APPROVED:'REVOKED',SUSPENDED:'REVOKED'},
    renew:{APPROVED:'APPROVED',EXPIRED:'APPROVED'},
  };
  const state=transitions[action]?.[application.state];
  if(!state)throw Error('INVALID_TRANSITION');
  if(action==='renew'&&(!application.validUntil||Date.parse(application.validUntil)>Date.now()))throw Error('INVALID_TRANSITION');
  if(['approve','renew'].includes(action)&&(!evidenceReference.trim()||!policy.categories.includes(application.profile.category)))throw Error('VERIFICATION_REQUIRED');
  return state;
}
export function capabilities(state:ApplicationState|undefined,admin=false,validUntil?:string,now=Date.now()){
  return {apply:true,specialistWorkspace:state==='APPROVED'&&!!validUntil&&Date.parse(validUntil)>now,identityAdministration:admin,
    patientCaseAccess:false,specialistPdfExport:false,assignments:false};
}
