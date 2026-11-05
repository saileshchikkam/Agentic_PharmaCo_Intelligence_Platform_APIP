import { Router, type Request, type RequestHandler } from 'express';
import type { GuidedCaseRepository } from './repository';
import { randomUUID } from 'node:crypto';
import { questions, validateValue, missing, nextQuestion, chronology, type GuidedCase } from '../../src/features/adr/guided/domain';
import { configuredProvider, checkedProposals, type IntakeProvider } from './provider';
import {generateOfficialPdf} from './pdf';
const exact=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.sort().join();
const asyncRoute = (handler: (...args: Parameters<RequestHandler>) => Promise<void>): RequestHandler =>
 (req, res, next) => { void handler(req, res, next).catch(next); };
export function guidedRouter(repository:GuidedCaseRepository,readUser:(req:Request)=>{id:string}|null|undefined,provider:IntakeProvider|null|undefined=configuredProvider(),
 revalidate=(req:Request,owner:string):boolean|Promise<boolean>=>readUser(req)?.id===owner) {
 const router=Router();
 let extracting=false;
 let exporting=false;
 router.use((req,res,next)=>{const user=readUser(req);if(!user)return void res.status(401).json({error:'SIGN_IN_REQUIRED'});if(req.get('X-APIP-Account')!==user.id)return void res.status(409).json({error:'ACCOUNT_CHANGED'});next();});
 const view=(c:GuidedCase)=>({case:c,missing:missing(c),nextQuestion:nextQuestion(c),warnings:chronology(c),officialTemplateAvailable:true});
 router.get('/',asyncRoute(async(req,res)=>{res.json({cases:await repository.list(readUser(req)!.id)});}));
 router.post('/',async(req,res,next)=>{try{
  if(!exact(req.body,['fictionalOnly'])||req.body.fictionalOnly!==true)return void res.status(400).json({error:'FICTIONAL_ONLY'});
  const owner=readUser(req)!.id;
  const c:GuidedCase={schemaVersion:1,id:randomUUID(),revision:0,fictionalOnly:true,updatedAt:'',values:{},medications:[{id:randomUUID(),kind:'suspect'}],statements:[],proposals:[],providerStatus:'manual'};res.status(201).json(view(await repository.save(owner,c,0,{type:'create'})));
 }catch(e){if((e as Error).message==='CASE_LIMIT')res.status(409).json({error:'CASE_LIMIT'});else next(e);}});
 router.get('/:id',asyncRoute(async(req,res)=>{const c=await repository.load(readUser(req)!.id,req.params.id);if(!c)return void res.status(404).json({error:'NOT_FOUND'});res.json(view(c));}));
 router.get('/:id/history',asyncRoute(async(req,res)=>{const owner=readUser(req)!.id;if(!await repository.load(owner,req.params.id))return void res.status(404).json({error:'NOT_FOUND'});res.json({versions:await repository.history(owner,req.params.id)});}));
 router.post('/:id/pdf',asyncRoute(async(req,res)=>{
  const owner=readUser(req)!.id,c=await repository.load(owner,req.params.id);
  if(!c)return void res.status(404).json({error:'NOT_FOUND'});
  if(!exact(req.body,['expectedRevision'])||req.body.expectedRevision!==c.revision)return void res.status(409).json({error:'REVISION_CONFLICT'});
  if(exporting)return void res.status(429).json({error:'PDF_BUSY'});
  exporting=true;
  try{const bytes=await generateOfficialPdf(c);
   if(!await revalidate(req,owner))return void res.status(401).json({error:'SIGN_IN_REQUIRED'});
   if((await repository.load(owner,c.id))?.revision!==c.revision)return void res.status(409).json({error:'REVISION_CONFLICT'});
   await repository.recordExport?.(owner,c.id,c.revision,bytes);
   res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="APIP-PvPI-${c.id}-r${c.revision}.pdf"`);res.setHeader('X-APIP-Revision',String(c.revision));res.send(bytes);
  }catch(e){const code=(e as Error).message;res.status(code==='REVISION_CONFLICT'?409:['PDF_UNSUPPORTED_SCRIPT','PDF_SELECT_ONE_SERIOUSNESS'].includes(code)?422:503).json({error:code});}finally{exporting=false;}
 }));
 router.post('/:id/command',async(req,res,next)=>{try{
  const owner=readUser(req)!.id,c=await repository.load(owner,req.params.id);if(!c)return void res.status(404).json({error:'NOT_FOUND'});
  const b=req.body;if(!exact(b,['expectedRevision','command'])||!Number.isSafeInteger(b.expectedRevision)||b.expectedRevision!==c.revision)return void res.status(409).json({error:'REVISION_CONFLICT'});
  if(c.revision>=500)return void res.status(409).json({error:'HISTORY_LIMIT'});
  const cmd=b.command;let valid=false;
  if(exact(cmd,['type','key','value'])&&cmd.type==='confirm'){
   const f=questions(c).find(f=>f.key===cmd.key);if(f&&validateValue(f,cmd.value)){
    const id=randomUUID(),at=new Date().toISOString();c.statements.push({id,text:cmd.value??'Unknown / not available',at});c.values[f.key]={state:cmd.value===null?'unknown':'provided',value:cmd.value,confirmedAt:at,source:'manual',statementId:id};c.proposals=[];valid=true;
   }
  }else if(exact(cmd,['type','kind'])&&cmd.type==='add_medication'&&['suspect','concomitant'].includes(cmd.kind)&&c.medications.length<20){c.medications.push({id:randomUUID(),kind:cmd.kind});c.proposals=[];valid=true;
  }else if(exact(cmd,['type','text'])&&cmd.type==='describe'&&typeof cmd.text==='string'&&cmd.text.trim()&&cmd.text.length<=4000){
   if(extracting)return void res.status(429).json({error:'EXTRACTION_BUSY'});
   c.statements.push({id:randomUUID(),text:cmd.text,at:new Date().toISOString()});c.proposals=[];c.providerStatus='manual_required';
   if(provider){extracting=true;try{c.proposals=checkedProposals(await provider(cmd.text,c),cmd.text,c).map(p=>({...p,id:randomUUID()}));c.providerStatus='proposals_ready';}catch{c.providerStatus='unavailable_or_invalid';}finally{extracting=false;}}
   // Session may expire/change while inference is pending; never publish for a stale principal.
   if(!await revalidate(req,owner))return void res.status(401).json({error:'SIGN_IN_REQUIRED'});valid=true;
  }else if(exact(cmd,['type','proposalId','accept'])&&cmd.type==='proposal'&&typeof cmd.accept==='boolean'){
   const p=c.proposals.find(p=>p.id===cmd.proposalId);if(p){if(cmd.accept){c.values[p.key]={state:'provided',value:p.value,confirmedAt:new Date().toISOString(),source:'proposal',statementId:c.statements[c.statements.length-1].id};}c.proposals=c.proposals.filter(x=>x.id!==p.id);valid=true;}
  }
  if(!valid)return void res.status(400).json({error:'INVALID_COMMAND'});
  res.json(view(await repository.save(owner,c,b.expectedRevision,cmd)));
 }catch(e){if((e as Error).message==='REVISION_CONFLICT')res.status(409).json({error:'REVISION_CONFLICT'});else next(e);}});
 return router;
}
