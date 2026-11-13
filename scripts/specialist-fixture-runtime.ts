import {sharingRouter} from '../server/sharing/router';
import {postgresSharingRepository} from '../server/sharing/repository';
import {postgresGuidedRepository} from '../server/adr/postgresRepository';
import {guidedRouter} from '../server/adr/guided';
import {casesRouter} from '../server/adr/cases';
// Explicit disposable fixture: actual PostgreSQL wire/repository + existing local test Auth.
// Not imported by server-entry and never connects to hosted PostgreSQL.
import express from 'express';
import {readFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import {createServer} from 'vite';
import {registerLocalAccount} from '../server/local-account';
import {trustedLocalRequest} from '../server/local-request';
import {specialistRouter} from '../server/specialist/router';
import {postgresSpecialistRepository} from '../server/specialist/postgresRepository';

export async function startSpecialistFixture(port=0,sharing=false){
 process.env.NODE_ENV='development';process.env.ADR_INTAKE_PROVIDER='disabled';
 const dir=await mkdtemp(join(tmpdir(),'apip-3b-fixture-')),db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;`);
 for(const name of ['20261105092036_adr_postgres_foundation','20261105092042_adr_command_receipts','20261105093956_apip_restricted_writer_role','20261107152504_adr_historical_pdf_receipts','20261107195900_specialist_identity_foundation','20261107210206_specialist_verified_subject_boundary'])
  await db.exec(await readFile(new URL('../supabase/migrations/'+name+'.sql',import.meta.url),'utf8'));
 if(sharing)await db.exec(await readFile(new URL('../supabase/migrations/20261108123217_adr_consented_sharing.sql',import.meta.url),'utf8'));
 const wire=new PGLiteSocketServer({db,host:'127.0.0.1',port:0,maxConnections:4});await wire.start();
 const sql=postgres('postgresql://postgres@'+wire.getServerConn()+'/postgres',{max:3,prepare:false,onnotice:()=>{}});
 const restricted={begin:(work:(tx:postgres.TransactionSql)=>Promise<unknown>)=>sql.begin(async tx=>{await tx`set local role apip_adr_writer`;return work(tx);})} as unknown as postgres.Sql;
 const app=express();let local:ReturnType<typeof registerLocalAccount>;
 const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const s=app.listen(port,'127.0.0.1',()=>resolve(s));});
 const actualPort=(server.address() as {port:number}).port,origin='http://127.0.0.1:'+actualPort;
 const identityRoutes=express.Router();
 identityRoutes.use(async(req,res,next)=>{
  if(!/^\/(account\/capabilities|specialist\/applications(?:\/|$)|admin\/specialist-applications(?:\/|$))/.test(req.path)){next('router');return;}
  if(!trustedLocalRequest(req,actualPort,req.method!=='GET')){res.status(403).json({error:'LOCAL_ONLY'});return;}
  try{
   const user=local.readUser(req);
   if(user)await controlQuery('insert into auth.users(id) values($1) on conflict do nothing',[user.id]);
   next();
  }catch{res.status(503).json({error:'SPECIALIST_UNAVAILABLE'});}
 },express.json({limit:'24kb'}),specialistRouter(postgresSpecialistRepository(restricted),req=>local.readUser(req)));
 app.use('/api/account/identity-fixture',identityRoutes);
 if(sharing){
  const cases=postgresGuidedRepository(restricted);
  const guard=express.Router();guard.use(async(req,res,next)=>{if(!trustedLocalRequest(req,actualPort,req.method!=='GET')){res.status(403).json({error:'LOCAL_ONLY'});return;}const user=local.readUser(req);if(!user){res.status(401).json({error:'SIGN_IN_REQUIRED'});return;}await controlQuery('insert into auth.users(id) values($1) on conflict do nothing',[user.id]);if(!req.destroyed&&!req.aborted)next();},express.json({limit:'24kb'}));
  app.use('/api/account/sharing-fixture',guard,sharingRouter(postgresSharingRepository(restricted),cases,req=>local.readUser(req)??undefined,async(req,owner)=>local.readUser(req)?.id===owner));
  app.use('/api/account/adr-guided',guard,guidedRouter(cases,req=>local.readUser(req),null,async(req,owner)=>local.readUser(req)?.id===owner));
  app.use('/api/account/adr-cases',guard,casesRouter(cases,req=>local.readUser(req),async(req,owner)=>local.readUser(req)?.id===owner));
 }
 local=registerLocalAccount(app,{file:join(dir,'fictional.sqlite'),originPort:actualPort});
 // This disposable API fixture must not start an asynchronous whole-app dependency crawl.
 const vite=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:{server},watch:{ignored:['**/docs/**','**/scripts/**','**/database/**','**/supabase/**','**/CHANGELOG.md']}},define:{
  'import.meta.env.VITE_APIP_IDENTITY_FIXTURE':JSON.stringify('1'),
  'import.meta.env.VITE_APIP_SHARING_FIXTURE':JSON.stringify(sharing?'1':''),
  'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('')}});
 app.use((_req,res,next)=>{res.set('X-APIP-Fixture','disposable-postgresql-local-test-auth');next();});
 app.use(vite.middlewares);
 async function controlQuery(query:string,parameters:string[]=[]){
  return sql.begin(async tx=>{await tx`set local role postgres`;return {rows:await tx.unsafe(query,parameters)};});
 }
 async function bootstrap(subject:string){
  const text=await readFile(new URL('../database/operations/bootstrap-specialist-admin.sql',import.meta.url),'utf8');
  const values:Record<string,string>={approved_subject:subject,operator_reference:'disposable-browser-test',approval_reference:'fixture-explicit-bootstrap',approval_confirmation:'APPROVE IDENTITY ADMIN BOOTSTRAP'};
  const statement=text.replace(/:'([a-z_]+)'/g,(_match,key)=>"'"+values[key].replaceAll("'","''")+"'").replace(/^begin;\s*$/gmi,'').replace(/^commit;\s*$/gmi,'');
  await sql.begin(async tx=>{await tx`set local role postgres`;await tx.unsafe(statement).simple();});
 }
 return {origin,db:{query:controlQuery,exec:(statement:string)=>sql.begin(async tx=>{await tx`set local role postgres`;await tx.unsafe(statement.replace(/^begin;$/gm,'').replace(/^commit;$/gm,'')).simple();})},bootstrap,close:async()=>{await vite.close();await new Promise<void>(resolve=>server.close(()=>resolve()));local.close();await sql.end({timeout:2});await wire.stop();await db.close();}};
}
