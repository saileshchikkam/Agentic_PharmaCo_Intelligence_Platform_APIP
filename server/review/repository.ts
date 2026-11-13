import type {Sql} from 'postgres';

export interface ReviewRepository {
  operation(actor:string,op:string,id:string|null,expected:number|null,body:unknown,key:string):Promise<any>;
}

const known=new Set(['SIGN_IN_REQUIRED','FORBIDDEN','NOT_FOUND','INVALID_REQUEST','REVISION_CONFLICT','IDEMPOTENCY_CONFLICT','EXPLICIT_CONSENT_REQUIRED','DISCLOSURE_MISMATCH','ASSESSMENT_REQUIRED']);

export function postgresReviewRepository(sql:Sql):ReviewRepository {
 return {async operation(actor,op,id,expected,body,key){
  try{return await sql.begin(async tx=>{
   await tx`select set_config('request.jwt.claim.sub',${actor},true),set_config('statement_timeout','5000',true),set_config('lock_timeout','3000',true)`;
   const [row]=await tx`select apip_review.operation(${op},${id}::uuid,${expected},${JSON.stringify(body)}::text::jsonb,${key}::uuid) result`;
   return row.result;
  });}catch(error){const e=error as {code?:string;message?:string};if(['23505','40001','40P01'].includes(e.code??''))throw Error('REVISION_CONFLICT');if(e.message==='ASSESSMENT_FINALIZED')throw Error(e.message);if(known.has(e.message??''))throw Error(e.message);throw Error('REVIEW_UNAVAILABLE',{cause:error});}
 }};
}
