import type {Sql} from 'postgres';
import type {SpecialistRepository} from './repository';
import type {Application,ProfessionalProfile} from './domain';
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
      throw Error(known.has(message)?message:['3F000','42883'].includes(code??'')?'SPECIALIST_SETUP_REQUIRED':'SPECIALIST_UNAVAILABLE',{cause:e});}
  }
  return {
    identity:async actor=>{
      const identity=await operation<import('./repository').EffectiveIdentity>(actor,'identity');
      const rows=await sql.begin(async tx=>{
        await tx`select set_config('request.jwt.claim.sub',${actor},true)`;
        return tx`select role from apip_identity.account_roles where subject=${actor}::uuid`;
      });
      return {...identity,accountRole:rows[0]?.role??null};
    },currentApplication:actor=>operation(actor,'current'),
    create:(actor,profile:ProfessionalProfile,key)=>operation<Application>(actor,'create',key,0,{profile},key),
    command:(actor,id,expected,command,key)=>operation(actor,'command',id,expected,command,key),
    listForAdministrator:(actor,state,limit,before)=>operation(actor,'admin_list',null,0,{state,limit,before}),
    applicationForAdministrator:(actor,id)=>operation(actor,'admin_get',id),
    decide:(actor,id,expected,command,key)=>operation(actor,'admin_decide',id,expected,command,key),
  };
}
