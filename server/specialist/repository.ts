import type {Application,ProfessionalProfile} from './domain';

export type IdentityCommand = {type:'save_draft';profile:ProfessionalProfile}|{type:'submit'};
export type DecisionCommand = {action:string;reason:string;evidenceReference:string;policyVersion:string};
export type EffectiveIdentity = {accountRole?:"PATIENT"|"SPECIALIST"|null;applicationState?:Application['state'];identityAdministrator:boolean;authorizationVersion:string;validUntil?:string};

// Actor is supplied only by the existing verified Auth middleware, never a request body.
export interface SpecialistRepository {
  identity(actor:string):Promise<EffectiveIdentity>;
  currentApplication(actor:string):Promise<Application|null>;
  create(actor:string,profile:ProfessionalProfile,key:string):Promise<Application>;
  command(actor:string,id:string,expectedVersion:number,command:IdentityCommand,key:string):Promise<Application>;
  listForAdministrator(actor:string,state:Application['state']|undefined,limit:number,before?:string):Promise<Application[]>;
  applicationForAdministrator(actor:string,id:string):Promise<Application|null>;
  decide(actor:string,id:string,expectedVersion:number,command:DecisionCommand,key:string):Promise<Application>;
}
