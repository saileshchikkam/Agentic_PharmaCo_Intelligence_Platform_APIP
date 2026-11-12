// Disposable verification only. Never imported by the application runtime.
import {randomUUID,createHash} from 'node:crypto';
import {decide,validateProfile,type Application,type PrototypePolicy} from './domain';
import type {SpecialistRepository} from './repository';
const canonical=(value:unknown):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export function fixtureSpecialistRepository(administrators:readonly string[],policy:PrototypePolicy,
  audit:(event:{actor:string;application:string;action:string})=>void=()=>{}):SpecialistRepository {
  const applications=new Map<string,Application>();
  const receipts=new Map<string,{hash:string;application:Application}>();
  const admin=(actor:string)=>{if(!administrators.includes(actor))throw Error('FORBIDDEN');};
  const load=(id:string)=>{const value=applications.get(id);if(!value)throw Error('NOT_FOUND');return value;};
  async function mutate(actor:string,key:string,scope:string,body:unknown,work:()=>Application){
    const receiptKey=canonical([actor,key,scope]);
    const hash=createHash('sha256').update(canonical(body)).digest('hex'),prior=receipts.get(receiptKey);
    if(prior){if(prior.hash!==hash)throw Error('IDEMPOTENCY_CONFLICT');return structuredClone(prior.application);}
    const candidate=work();
    // A failed required audit aborts before either application or receipt changes.
    audit({actor,application:candidate.id,action:scope});
    applications.set(candidate.id,structuredClone(candidate));receipts.set(receiptKey,{hash,application:structuredClone(candidate)});
    return structuredClone(candidate);
  }
  return {
    async identity(actor){const own=[...applications.values()].find(a=>a.owner===actor);
      return {accountRole:'SPECIALIST' as const,applicationState:own?.state,identityAdministrator:administrators.includes(actor),authorizationVersion:String(own?.version??0),validUntil:own?.validUntil};},
    async currentApplication(actor){return structuredClone([...applications.values()].find(a=>a.owner===actor)??null);},
    async create(actor,profile,key){return mutate(actor,key,'create',profile,()=>{
      if([...applications.values()].some(a=>a.owner===actor))throw Error('REVISION_CONFLICT');
      return {id:randomUUID(),owner:actor,version:1,state:'DRAFT',profile:validateProfile(profile),decisions:[]};
    });},
    async command(actor,id,expectedVersion,command,key){
      const original=load(id);if(original.owner!==actor)throw Error('NOT_FOUND');
      return mutate(actor,key,'application/'+id,{expectedVersion,command},()=>{
        const a=structuredClone(load(id));if(a.version!==expectedVersion)throw Error('REVISION_CONFLICT');
        if(a.state!=='DRAFT')throw Error('INVALID_TRANSITION');
        if(command.type==='save_draft')a.profile=validateProfile(command.profile);else a.state='SUBMITTED';
        return {...a,version:a.version+1};
      });
    },
    async listForAdministrator(actor,state,limit,before){admin(actor);
      return structuredClone([...applications.values()].filter(a=>(!state||a.state===state)&&(!before||a.id<before))
        .sort((a,b)=>b.id.localeCompare(a.id)).slice(0,limit));},
    async applicationForAdministrator(actor,id){admin(actor);return structuredClone(applications.get(id)??null);},
    async decide(actor,id,expectedVersion,command,key){
      admin(actor); // Access is checked again even on an idempotent replay.
      return mutate(actor,key,'decision/'+id,{expectedVersion,command},()=>{
        const a=structuredClone(load(id));if(a.version!==expectedVersion)throw Error('REVISION_CONFLICT');
        if(command.policyVersion!==policy.version)throw Error('POLICY_NOT_APPROVED');
        const state=decide(a,actor,true,command.action,command.reason,command.evidenceReference,policy);
        return {...a,state,validUntil:['approve','renew'].includes(command.action)?new Date(Date.now()+30*86400000).toISOString():a.validUntil,
          version:a.version+1,decisions:[...a.decisions,{id:randomUUID(),actor,...command,at:new Date().toISOString()}]};
      });
    },
  };
}
