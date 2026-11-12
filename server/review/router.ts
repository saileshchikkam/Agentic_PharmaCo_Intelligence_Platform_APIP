import {Router,type Request,type RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
import type {GuidedCaseRepository} from '../adr/repository';
import {createPdfService} from '../adr/pdf';
import {prepareDisclosure} from '../sharing/disclosure';
import type {ReviewRepository} from './repository';

const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const errors:Record<string,number>={SIGN_IN_REQUIRED:401,FORBIDDEN:403,NOT_FOUND:404,INVALID_REQUEST:400,EXPLICIT_CONSENT_REQUIRED:400,DISCLOSURE_MISMATCH:409,REVISION_CONFLICT:409,IDEMPOTENCY_CONFLICT:409,ACTIVE_REVIEW_CONFLICT:409,ASSESSMENT_REQUIRED:422};
const exact=(value:any,keys:string[])=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');

export function reviewRouter(repository:ReviewRepository|null,cases:GuidedCaseRepository,principal:(req:Request)=>{id:string}|undefined,revalidate:(req:Request,owner:string)=>Promise<boolean>){
 const router=Router(),pdf=createPdfService();
 router.use((req,res,next)=>{res.set('Cache-Control','private, no-store');const user=principal(req);if(!user){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}if(req.get('X-APIP-Account')!==user.id){res.status(409).json({error:'ACCOUNT_CHANGED'});return;}if(!repository){res.status(503).json({error:'REVIEW_NOT_ENABLED'});return;}next();});
 const endpoint=(fn:(req:Request,res:import('express').Response)=>Promise<void>):RequestHandler=>(req,res)=>void fn(req,res).catch(error=>{const code=(error as Error).message;res.status(errors[code]??503).json({error:errors[code]?code:'REVIEW_UNAVAILABLE'});});
 const actor=(req:Request)=>principal(req)!.id;
 const key=(req:Request)=>{const value=req.get('Idempotency-Key');if(!value||!uuid.test(value))throw Error('INVALID_REQUEST');return value;};
 const op=(req:Request,name:string,id:string|null=null,expected:number|null=null,body:unknown={},command=randomUUID())=>repository!.operation(actor(req),name,id,expected,body,command);
 router.get('/patient',endpoint(async(req,res)=>res.json({reviews:await op(req,'patient_list')})));
 router.get('/pool',endpoint(async(req,res)=>res.json({reviews:await op(req,'pool')})));
 router.get('/inbox',endpoint(async(req,res)=>res.json({reviews:await op(req,'inbox')})));
 router.post('/patient/disclosure',endpoint(async(req,res)=>{if(!exact(req.body,['caseId','revision'])||!uuid.test(req.body.caseId)||!Number.isSafeInteger(req.body.revision))throw Error('INVALID_REQUEST');const snapshot=await cases.snapshot(actor(req),req.body.caseId,req.body.revision);if(!snapshot)throw Error('NOT_FOUND');res.json({disclosure:prepareDisclosure(snapshot)});}));
 router.post('/patient',endpoint(async(req,res)=>{const b=req.body;if(!exact(b,['caseId','revision','consent','policyVersion','digest'])||!uuid.test(b.caseId)||!Number.isSafeInteger(b.revision)||b.consent!==true||b.policyVersion!=='phase3c-review-v1')throw Error('INVALID_REQUEST');const snapshot=await cases.snapshot(actor(req),b.caseId,b.revision);if(!snapshot)throw Error('NOT_FOUND');const disclosure=prepareDisclosure(snapshot);if(disclosure.digest!==b.digest)throw Error('DISCLOSURE_MISMATCH');const id=randomUUID(),command=key(req);res.status(201).json({review:await op(req,'create',id,0,{...b,snapshot,disclosure},command)});}));
 for(const action of ['claim','release','withdraw','complete'] as const)router.post('/:id/'+action,endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['expectedVersion'])||!Number.isSafeInteger(req.body.expectedVersion))throw Error('INVALID_REQUEST');res.json({review:await op(req,action,req.params.id,req.body.expectedVersion,{},key(req))});}));
 router.get('/:id',endpoint(async(req,res)=>{if(!uuid.test(req.params.id))throw Error('INVALID_REQUEST');res.json({review:await op(req,'detail',req.params.id)});}));
 router.post('/:id/assessments',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['state','content'])||!['draft','final'].includes(req.body.state)||!req.body.content||typeof req.body.content!=='object'||Array.isArray(req.body.content))throw Error('INVALID_REQUEST');res.status(201).json({review:await op(req,'assessment',req.params.id,null,req.body,key(req))});}));
 router.get('/:id/messages',endpoint(async(req,res)=>{if(!uuid.test(req.params.id))throw Error('INVALID_REQUEST');res.json({messages:await op(req,'messages',req.params.id)});}));
 router.post('/:id/messages',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['body'])||typeof req.body.body!=='string'||req.body.body.trim().length<1||req.body.body.length>4000)throw Error('INVALID_REQUEST');res.status(201).json({review:await op(req,'message',req.params.id,null,{body:req.body.body.trim()},key(req))});}));
 router.post('/:id/pdf-preview',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,[]))throw Error('INVALID_REQUEST');const detail=await op(req,'detail',req.params.id);const bytes=await pdf.generate(detail.snapshot);if(!await revalidate(req,actor(req)))throw Error('SIGN_IN_REQUIRED');await op(req,'detail',req.params.id);res.set({'Content-Type':'application/pdf','Content-Disposition':'inline; filename="APIP-authorized-review.pdf"','X-Content-Type-Options':'nosniff','X-APIP-Revision':String(detail.revision)}).send(bytes);}));
 return router;
}
