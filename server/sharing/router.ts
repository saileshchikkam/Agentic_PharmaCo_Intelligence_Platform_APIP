import {Router,type Request,type RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
import type {GuidedCaseRepository} from '../adr/repository';
import type {SharingRepository} from './repository';
import {prepareDisclosure} from './disclosure';
import {createPdfService} from '../adr/pdf';
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const status:Record<string,number>={PDF_BUSY:429,PDF_UNSUPPORTED_SCRIPT:422,PDF_SELECT_ONE_SERIOUSNESS:422,SIGN_IN_REQUIRED:401,FORBIDDEN:403,NOT_FOUND:404,REVISION_CONFLICT:409,IDEMPOTENCY_CONFLICT:409,ACTIVE_ASSIGNMENT_CONFLICT:409,RECIPIENT_UNAVAILABLE:409,DISCLOSURE_MISMATCH:409,EXPLICIT_CONSENT_REQUIRED:400,INVALID_REQUEST:400,INTAKE_INCOMPLETE:422,RESERVED_FIELD_REQUIRES_CORRECTION:422};
const exact=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys.sort().join(',');
export function sharingRouter(sharing:SharingRepository|null,cases:GuidedCaseRepository,principal:(r:Request)=>{id:string}|undefined,revalidate:(r:Request,owner:string)=>Promise<boolean>){
 const pdf=createPdfService();const router=Router();router.use((req,res,next)=>{res.set('Cache-Control','private, no-store');const user=principal(req);if(!user){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}if(req.get('X-APIP-Account')!==user.id){res.status(409).json({error:'ACCOUNT_CHANGED'});return;}if(!sharing){res.status(503).json({error:'SHARING_NOT_ENABLED'});return;}next();});
 const endpoint=(fn:(req:Request,res:import('express').Response)=>Promise<void>):RequestHandler=>(req,res)=>{void fn(req,res).catch(e=>res.status(status[e.message]??503).json({error:status[e.message]?e.message:'SHARING_UNAVAILABLE'}));};
 const actor=(req:Request)=>principal(req)!.id;
 const key=(req:Request)=>{const k=req.get('Idempotency-Key');if(!k||!uuid.test(k))throw Error('INVALID_REQUEST');return k;};
 const op=(req:Request,name:string,id:string|null=null,body:unknown={},command:string=randomUUID())=>sharing!.operation(actor(req),name,id,body,command);
 router.get('/directory/me',endpoint(async(req,res)=>{res.json(await op(req,'directory_status'));}));
 router.get('/directory',endpoint(async(req,res)=>{res.json({specialists:await op(req,'directory')});}));
 router.post('/directory',endpoint(async(req,res)=>{if(!exact(req.body,['optedIn'])||typeof req.body.optedIn!=='boolean')throw Error('INVALID_REQUEST');res.json(await op(req,'opt_in',null,req.body,key(req)));}));
 router.get('/requests',endpoint(async(req,res)=>{res.json({requests:await op(req,'patient_list')});}));
 router.post('/disclosure',endpoint(async(req,res)=>{if(!exact(req.body,['caseId','revision'])||!uuid.test(req.body.caseId)||!Number.isSafeInteger(req.body.revision))throw Error('INVALID_REQUEST');const c=await cases.snapshot(actor(req),req.body.caseId,req.body.revision);if(!c)throw Error('NOT_FOUND');res.json({disclosure:prepareDisclosure(c)});}));
 router.post('/requests',endpoint(async(req,res)=>{const b=req.body;if(!exact(b,['caseId','revision','specialist','consent','policyVersion','digest'])||!uuid.test(b.caseId)||!uuid.test(b.specialist)||!Number.isSafeInteger(b.revision)||b.consent!==true||b.policyVersion!=='phase3c-b-v1')throw Error('INVALID_REQUEST');const c=await cases.snapshot(actor(req),b.caseId,b.revision);if(!c)throw Error('NOT_FOUND');const disclosure=prepareDisclosure(c);if(disclosure.digest!==b.digest)throw Error('DISCLOSURE_MISMATCH');const command=key(req);res.status(201).json({request:await op(req,'create',command,{...b,snapshot:c,disclosure},command)});}));
 router.post('/requests/:id/withdraw',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['expectedVersion'])||!Number.isSafeInteger(req.body.expectedVersion))throw Error('INVALID_REQUEST');res.json({request:await op(req,'withdraw',req.params.id,req.body,key(req))});}));
 router.post('/inbox/:id/decline',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['expectedVersion'])||!Number.isSafeInteger(req.body.expectedVersion))throw Error('INVALID_REQUEST');res.json(await op(req,'decline',req.params.id,req.body,key(req)));}));
 router.get('/inbox',endpoint(async(req,res)=>{res.json({requests:await op(req,'inbox')});}));router.get('/count',endpoint(async(req,res)=>{res.json(await op(req,'count'));}));
 router.get('/inbox/:id',endpoint(async(req,res)=>{if(!uuid.test(req.params.id))throw Error('INVALID_REQUEST');const report=await op(req,'report',req.params.id);if(!await revalidate(req,actor(req)))throw Error('SIGN_IN_REQUIRED');await op(req,'check',req.params.id);res.json(report);}));
 router.post('/inbox/:id/preview',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,[]))throw Error('INVALID_REQUEST');const snapshot=await op(req,'pdf_snapshot',req.params.id);prepareDisclosure(snapshot);const bytes=await pdf.generate(snapshot);if(!await revalidate(req,actor(req)))throw Error('SIGN_IN_REQUIRED');await op(req,'check',req.params.id);res.set({'Content-Type':'application/pdf','Content-Disposition':'inline; filename="APIP-authorized-preview.pdf"','X-Content-Type-Options':'nosniff','X-APIP-Revision':String(snapshot.revision)}).send(bytes);}));
 return router;
}
