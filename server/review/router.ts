import {Router,type Request,type RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
import type {ReviewRepository} from './repository';

const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const status:Record<string,number>={SIGN_IN_REQUIRED:401,FORBIDDEN:403,NOT_FOUND:404,INVALID_REQUEST:400,REVISION_CONFLICT:409,IDEMPOTENCY_CONFLICT:409,ASSESSMENT_FINALIZED:409};
const exact=(value:any,keys:string[])=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');

export function reviewRouter(repository:ReviewRepository|null,principal:(req:Request)=>{id:string}|undefined){
 const router=Router();
 router.use((req,res,next)=>{res.set('Cache-Control','private, no-store');const user=principal(req);if(!user){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}if(req.get('X-APIP-Account')!==user.id){res.status(409).json({error:'ACCOUNT_CHANGED'});return;}if(!repository){res.status(503).json({error:'REVIEW_NOT_ENABLED'});return;}next();});
 const endpoint=(fn:(req:Request,res:import('express').Response)=>Promise<void>):RequestHandler=>(req,res)=>void fn(req,res).catch(error=>{const code=(error as Error).message;res.status(status[code]??503).json({error:status[code]?code:'REVIEW_UNAVAILABLE'});});
 const actor=(req:Request)=>principal(req)!.id;
 const key=(req:Request)=>{const value=req.get('Idempotency-Key');if(!value||!uuid.test(value))throw Error('INVALID_REQUEST');return value;};
 const op=(req:Request,name:string,id:string,expected:number|null=null,body:unknown={},command:string=randomUUID())=>repository!.operation(actor(req),name,id,expected,body,command);
 router.get('/:id/assessments',endpoint(async(req,res)=>{if(!uuid.test(req.params.id))throw Error('INVALID_REQUEST');res.json({assessments:await op(req,'assessments',req.params.id)});}));
 router.post('/:id/assessments',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['expectedVersion','state','content'])||!Number.isSafeInteger(req.body.expectedVersion)||!['draft','final'].includes(req.body.state)||!req.body.content||typeof req.body.content!=='object'||Array.isArray(req.body.content))throw Error('INVALID_REQUEST');res.status(201).json({assessment:await op(req,'assessment',req.params.id,req.body.expectedVersion,{state:req.body.state,content:req.body.content},key(req))});}));
 router.get('/:id/messages',endpoint(async(req,res)=>{if(!uuid.test(req.params.id))throw Error('INVALID_REQUEST');res.json({messages:await op(req,'messages',req.params.id)});}));
 router.post('/:id/messages',endpoint(async(req,res)=>{if(!uuid.test(req.params.id)||!exact(req.body,['body'])||typeof req.body.body!=='string'||req.body.body.trim().length<1||req.body.body.length>4000)throw Error('INVALID_REQUEST');res.status(201).json({message:await op(req,'message',req.params.id,null,{body:req.body.body.trim()},key(req))});}));
 return router;
}
