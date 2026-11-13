import type {Sql} from 'postgres';
import type {SpecialistRepository} from './repository';
import type {Application,ProfessionalProfile} from './domain';
export function identityFailureDiagnostic(error:unknown,operation:string){
 const e=error as {code?:unknown;name?:unknown;message?:unknown};const message=typeof e?.message==='string'?e.message:'';
 return {event:'identity_repository_failure',operation,sqlstate:typeof e?.code==='string'&&/^[A-Z0-9]{5}$/.test(e.code)?e.code:'NO_SQLSTATE',errorType:typeof e?.name==='string'&&/^[A-Za-z]{1,40}$/.test(e.name)?e.name:'Error',connectionFailure:/connection|socket|closed|timeout/i.test(message)};
}
const known=new Set(['SIGN_IN_REQUIRED','FORBIDDEN','NOT_FOUND','SELF_APPROVAL_DENIED','INVALID_PROFILE','INVALID_REQUEST',
  'INVALID_DECISION','INVALID_TRANSITION','REVISION_CONFLICT','IDEMPOTENCY_CONFLICT','VERIFICATION_REQUIRED']);
export function postgresSpecialistRepository(sql:Sql):SpecialistRepository{
  async function operation<T>(actor:string,op:string,id:string|null=null,expected=0,body:unknown={},key:string|null=null):Promise<T>{
    try{return await sql.begin(async tx=>{
      await tx`select set_config('request.jwt.claim.sub',${actor},true),set_config('request.jwt.claims',${JSON.stringify({sub:actor})},true),
        set_config('statement_timeout','5000',true),set_config('lock_timeout','3000',true)`;
      const [row]=await tx`select apip_identity.identity_operation(${op},${id}::uuid,${expected},${JSON.stringify(body)}::text::jsonb,${key}::uuid) as result`;
      return row.result;
    }) as T;}catch(e){const message=e instanceof Error?e.message:'';
      const code=(e as {code?:string})?.code;
      if(!known.has(message))console.warn(JSON.stringify(identityFailureDiagnostic(e,op)));
      throw Error(known.has(message)?message:['3F000','42883'].includes(code??'')?'SPECIALIST_SETUP_REQUIRED':'SPECIALIST_UNAVAILABLE',{cause:e});}
  }
  return {
    identity:async actor=>{
      const identity=await operation<import('./repository').EffectiveIdentity>(actor,'identity');
      const rows=await sql.begin(async tx=>{
        await tx`select set_config('request.jwt.claim.sub',${actor},true)`;
        return tx`select role from apip_identity.account_roles where subject=${actor}::uuid`;
      }).catch(error=>{console.warn(JSON.stringify(identityFailureDiagnostic(error,'account_role_lookup')));throw Error((error as {code?:string}).code==='42P01'?'ACCOUNT_ROLE_SETUP_REQUIRED':'ACCOUNT_ROLE_UNAVAILABLE');});
      return {...identity,accountRole:rows[0]?.role??null};
    },currentApplication:actor=>operation(actor,'current'),
    create:(actor,profile:ProfessionalProfile,key)=>operation<Application>(actor,'create',key,0,{profile},key),
    command:(actor,id,expected,command,key)=>operation(actor,'command',id,expected,command,key),
    listForAdministrator:(actor,state,limit,before)=>operation(actor,'admin_list',null,0,{state,limit,before}),
    applicationForAdministrator:(actor,id)=>operation(actor,'admin_get',id),
    decide:(actor,id,expected,command,key)=>operation(actor,'admin_decide',id,expected,command,key),
  };
}
