import { Router, type Request } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { questions, validateValue, missing, nextQuestion, chronology, type GuidedCase } from '../../src/features/adr/guided/domain';
import { configuredProvider, checkedProposals, type IntakeProvider } from './provider';
import {generateOfficialPdf} from './pdf';
const exact=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.sort().join();
export function guidedRouter(db:DatabaseSync,readUser:(req:Request)=>{id:string}|null|undefined,provider:IntakeProvider|undefined=configuredProvider()) {
 db.exec(`CREATE TABLE IF NOT EXISTS adr_guided_cases(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES local_users(id),revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
 CREATE INDEX IF NOT EXISTS adr_guided_owner ON adr_guided_cases(owner_id);
 CREATE TABLE IF NOT EXISTS adr_guided_versions(case_id TEXT NOT NULL REFERENCES adr_guided_cases(id),revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),PRIMARY KEY(case_id,revision));`);
 const router=Router();
 let extracting=false;
 let exporting=false;
 router.use((req,res,next)=>{const user=readUser(req);if(!user)return void res.status(401).json({error:'SIGN_IN_REQUIRED'});if(req.get('X-APIP-Account')!==user.id)return void res.status(409).json({error:'ACCOUNT_CHANGED'});next();});
 const load=(id:string,owner:string)=>{const row=db.prepare('SELECT payload FROM adr_guided_cases WHERE id=? AND owner_id=?').get(id,owner);return row?JSON.parse(String(row.payload)) as GuidedCase:null;};
 const view=(c:GuidedCase)=>({case:c,missing:missing(c),nextQuestion:nextQuestion(c),warnings:chronology(c),officialTemplateAvailable:true});
 const write=(c:GuidedCase,owner:string,expected:number)=>{
  c.revision=expected+1;c.updatedAt=new Date().toISOString();const payload=JSON.stringify(c);
  db.exec('BEGIN IMMEDIATE');try{
   if(expected===0)db.prepare('INSERT INTO adr_guided_cases VALUES (?,?,?,?)').run(c.id,owner,c.revision,payload);
   else if(!db.prepare('UPDATE adr_guided_cases SET revision=?,payload=? WHERE id=? AND owner_id=? AND revision=?').run(c.revision,payload,c.id,owner,expected).changes)throw Error('REVISION_CONFLICT');
   db.prepare('INSERT INTO adr_guided_versions VALUES (?,?,?)').run(c.id,c.revision,payload);db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
 };
 router.get('/',(req,res)=>{const rows=db.prepare('SELECT payload FROM adr_guided_cases WHERE owner_id=? ORDER BY rowid DESC LIMIT 100').all(readUser(req)!.id);res.json({cases:rows.map(r=>{const c=JSON.parse(String(r.payload));return {id:c.id,revision:c.revision,updatedAt:c.updatedAt};})});});
 router.post('/',(req,res,next)=>{try{
  if(!exact(req.body,['fictionalOnly'])||req.body.fictionalOnly!==true)return void res.status(400).json({error:'FICTIONAL_ONLY'});
  const owner=readUser(req)!.id;if(Number(db.prepare('SELECT count(*) n FROM adr_guided_cases WHERE owner_id=?').get(owner)?.n)>=100)return void res.status(409).json({error:'CASE_LIMIT'});
  const c:GuidedCase={schemaVersion:1,id:randomUUID(),revision:0,fictionalOnly:true,updatedAt:'',values:{},medications:[{id:randomUUID(),kind:'suspect'}],statements:[],proposals:[],providerStatus:'manual'};write(c,owner,0);res.status(201).json(view(c));
 }catch(e){next(e);}});
 router.get('/:id',(req,res)=>{const c=load(req.params.id,readUser(req)!.id);if(!c)return void res.status(404).json({error:'NOT_FOUND'});res.json(view(c));});
 router.get('/:id/history',(req,res)=>{if(!load(req.params.id,readUser(req)!.id))return void res.status(404).json({error:'NOT_FOUND'});res.json({versions:db.prepare('SELECT revision FROM adr_guided_versions WHERE case_id=? ORDER BY revision DESC LIMIT 100').all(req.params.id)});});
 router.post('/:id/pdf',async(req,res)=>{
  const owner=readUser(req)!.id,c=load(req.params.id,owner);
  if(!c)return void res.status(404).json({error:'NOT_FOUND'});
  if(!exact(req.body,['expectedRevision'])||req.body.expectedRevision!==c.revision)return void res.status(409).json({error:'REVISION_CONFLICT'});
  if(exporting)return void res.status(429).json({error:'PDF_BUSY'});
  exporting=true;
  try{const bytes=await generateOfficialPdf(c);
   if(readUser(req)?.id!==owner)return void res.status(401).json({error:'SIGN_IN_REQUIRED'});
   if(load(c.id,owner)?.revision!==c.revision)return void res.status(409).json({error:'REVISION_CONFLICT'});
   res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="APIP-PvPI-${c.id}-r${c.revision}.pdf"`);res.setHeader('X-APIP-Revision',String(c.revision));res.send(bytes);
  }catch(e){const code=(e as Error).message;res.status(['PDF_UNSUPPORTED_SCRIPT','PDF_SELECT_ONE_SERIOUSNESS'].includes(code)?422:503).json({error:code});}finally{exporting=false;}
 });
 router.post('/:id/command',async(req,res,next)=>{try{
  const owner=readUser(req)!.id,c=load(req.params.id,owner);if(!c)return void res.status(404).json({error:'NOT_FOUND'});
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
   if(readUser(req)?.id!==owner)return void res.status(401).json({error:'SIGN_IN_REQUIRED'});valid=true;
  }else if(exact(cmd,['type','proposalId','accept'])&&cmd.type==='proposal'&&typeof cmd.accept==='boolean'){
   const p=c.proposals.find(p=>p.id===cmd.proposalId);if(p){if(cmd.accept){c.values[p.key]={state:'provided',value:p.value,confirmedAt:new Date().toISOString(),source:'proposal',statementId:c.statements[c.statements.length-1].id};}c.proposals=c.proposals.filter(x=>x.id!==p.id);valid=true;}
  }
  if(!valid)return void res.status(400).json({error:'INVALID_COMMAND'});
  write(c,owner,b.expectedRevision);res.json(view(c));
 }catch(e){if((e as Error).message==='REVISION_CONFLICT')res.status(409).json({error:'REVISION_CONFLICT'});else next(e);}});
 return router;
}
