import {Router,type Request,type RequestHandler} from 'express';
import type {Sql} from 'postgres';
import {createHash,randomUUID} from 'node:crypto';
import {generateOfficialPdf} from '../adr/pdf';
import {generateReviewPdf} from './pdf';
export type ArchivePrincipal={id:string;email?:string;emailVerified?:boolean};
export interface ArchiveRepository{operation(actor:ArchivePrincipal,op:string,id:string|null,body?:unknown,key?:string):Promise<any>}
export interface PrivatePdfStore{putOnce(path:string,bytes:Buffer):Promise<Buffer>;read(path:string):Promise<Buffer>}
export function postgresArchiveRepository(sql:Sql):ArchiveRepository{return {async operation(actor,op,id,body={},key=randomUUID()){
 try{return await sql.begin(async tx=>{await tx`select set_config('request.jwt.claim.sub',${actor.id},true),set_config('request.jwt.claim.email',${actor.email??''},true),set_config('request.jwt.claim.email_verified',${actor.emailVerified?'true':'false'},true),set_config('statement_timeout','5000',true),set_config('lock_timeout','3000',true)`;const [r]=await tx`select apip_archive.operation(${op},${id}::uuid,${JSON.stringify(body)}::text::jsonb,${key}::uuid) result`;return r.result;});}
 catch(e){const code=(e as Error).message;if(['SIGN_IN_REQUIRED','FORBIDDEN','NOT_FOUND','ASSESSMENT_REQUIRED','ARCHIVE_CONSENT_REQUIRED','EXPLICIT_CONSENT_REQUIRED','REVISION_CONFLICT','IDEMPOTENCY_CONFLICT','ARCHIVE_CONFLICT','INVALID_REQUEST'].includes(code))throw Error(code);throw Error('ARCHIVE_UNAVAILABLE');}
}};}
export function supabasePrivatePdfStore(client:any):PrivatePdfStore{
 const bucket=client.storage.from('apip-completed-adr');
 async function read(path:string){const r=await bucket.download(path);if(r.error)throw Error(r.error.statusCode==='404'?'ARCHIVE_FILE_MISSING':'ARCHIVE_STORAGE_UNAVAILABLE');if(r.data.size>10485760)throw Error('ARCHIVE_FILE_INVALID');const bytes=Buffer.from(await r.data.arrayBuffer());if(!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('ARCHIVE_FILE_INVALID');return bytes;}
 return {read,async putOnce(path,bytes){if(bytes.length>10485760)throw Error('ARCHIVE_FILE_INVALID');const r=await bucket.upload(path,bytes,{contentType:'application/pdf',upsert:false});if(r.error&&!['409','400'].includes(String(r.error.statusCode)))throw Error('ARCHIVE_STORAGE_UNAVAILABLE');if(r.error&&String(r.error.statusCode)==='400'&&!/already exists|duplicate/i.test(r.error.message))throw Error('ARCHIVE_STORAGE_UNAVAILABLE');return read(path);}};
}
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const statuses:Record<string,number>={SIGN_IN_REQUIRED:401,FORBIDDEN:403,NOT_FOUND:404,ARCHIVE_CONSENT_REQUIRED:422,ASSESSMENT_REQUIRED:422,EXPLICIT_CONSENT_REQUIRED:400,INVALID_REQUEST:400,REVISION_CONFLICT:409,IDEMPOTENCY_CONFLICT:409,ARCHIVE_CONFLICT:409,ARCHIVE_FILE_MISSING:404,ARCHIVE_FILE_INVALID:502,PDF_UNSUPPORTED_SCRIPT:422};
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export function archiveRouter(repo:ArchiveRepository|null,store:PrivatePdfStore|null,principal:(r:Request)=>ArchivePrincipal|undefined,revalidate:(r:Request,owner:string)=>Promise<boolean>,render=generateReviewPdf,official=generateOfficialPdf){
 const router=Router();
 router.use((req,res,next)=>{res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});const a=principal(req);if(!a){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}if(req.get('X-APIP-Account')!==a.id){res.status(409).json({error:'ACCOUNT_CHANGED'});return;}if(!repo){res.status(503).json({error:'ARCHIVE_NOT_ENABLED'});return;}next();});
 const endpoint=(fn:(req:Request,res:import('express').Response)=>Promise<void>):RequestHandler=>(req,res)=>void fn(req,res).catch(e=>res.status(statuses[e.message]??503).json({error:statuses[e.message]?e.message:'ARCHIVE_UNAVAILABLE'}));
 const actor=(r:Request)=>principal(r)!;
 const op=(r:Request,name:string,body:unknown={})=>repo!.operation(actor(r),name,r.params.id??null,body,r.method==='GET'?undefined:r.get('Idempotency-Key'));
 router.get('/capabilities',endpoint(async(req,res)=>{res.json(await op(req,'capabilities'));}));
 router.get('/completed',endpoint(async(req,res)=>{res.json({artifacts:await op(req,'list')});}));
 router.use('/:id',(req,res,next)=>{if(!uuid.test(req.params.id)){res.status(400).json({error:'INVALID_REQUEST'});return;}next();});
 router.get('/:id/consent',endpoint(async(req,res)=>{res.json(await op(req,'consent_status'));}));
 router.post('/:id/consent',endpoint(async(req,res)=>{
  const b=req.body;if(!b||Object.keys(b).sort().join(',')!=='allowed,confirmed,expectedVersion,policyVersion'||!Number.isSafeInteger(b.expectedVersion)||typeof b.allowed!=='boolean'||b.confirmed!==true||b.policyVersion!=='phase-b-archive-v1'||!uuid.test(req.get('Idempotency-Key')??''))throw Error('INVALID_REQUEST');res.json(await op(req,'consent',b));
 }));
 router.post('/:id/generate',endpoint(async(req,res)=>{
  if(!req.body||Object.keys(req.body).length||!uuid.test(req.get('Idempotency-Key')??''))throw Error('INVALID_REQUEST');if(!store)throw Error('ARCHIVE_UNAVAILABLE');
  const source=await op(req,'source');if(source.snapshot?.fictionalOnly!==true)throw Error('INVALID_REQUEST');const prior=await op(req,'artifact');
  if(prior){const bytes=await store.read(prior.storage_key);if(sha(bytes)!==prior.sha256)throw Error('ARCHIVE_FILE_INVALID');await op(req,'source');res.json({artifact:{...prior,storage_key:undefined}});return;}
  const original=await official(source.snapshot);const bytes=await render(original,source);
  if(!await revalidate(req,actor(req).id))throw Error('SIGN_IN_REQUIRED');await op(req,'source');
  const retained=await store.putOnce('completed/'+req.params.id+'/'+source.assessmentVersion+'.pdf',bytes);
  const artifact=await op(req,'complete',{assessmentVersion:source.assessmentVersion,sha256:sha(retained),bytes:retained.length});res.json({artifact:{...artifact,storage_key:undefined}});
 }));
 router.get('/:id/pdf',endpoint(async(req,res)=>{
  if(!store)throw Error('ARCHIVE_UNAVAILABLE');const metadata=await op(req,'metadata');const bytes=await store.read(metadata.storage_key);if(sha(bytes)!==metadata.sha256)throw Error('ARCHIVE_FILE_INVALID');
  if(!await revalidate(req,actor(req).id))throw Error('SIGN_IN_REQUIRED');const current=await op(req,'metadata');if(current.sha256!==metadata.sha256)throw Error('ARCHIVE_CONFLICT');
  res.set({'Content-Type':'application/pdf','Content-Disposition':(req.query.download==='1'?'attachment':'inline')+'; filename="APIP-reviewed-'+metadata.case_id.slice(0,8)+'-v'+metadata.assessment_version+'.pdf"'}).send(bytes);
 }));return router;
}
