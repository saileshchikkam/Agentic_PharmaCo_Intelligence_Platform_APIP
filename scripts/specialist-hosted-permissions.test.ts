import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import {postgresSpecialistRepository} from '../server/specialist/postgresRepository';
import {categories} from '../server/specialist/domain';

test('managed Auth schema permission failure and verified-subject repair without broader grants',{timeout:60000},async()=>{
 const db=new PGlite(),a=randomUUID(),b=randomUUID();
 await db.exec(`create role anon;create role authenticated;create role managed_auth_owner nologin;
 create schema auth authorization managed_auth_owner;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;`);
 await db.query('insert into auth.users values ($1),($2)',[a,b]);
 const original=await readFile(new URL('../supabase/migrations/20261107195900_specialist_identity_foundation.sql',import.meta.url),'utf8');
 for(const name of ['20261105092036_adr_postgres_foundation','20261105092042_adr_command_receipts','20261105093956_apip_restricted_writer_role','20261107152504_adr_historical_pdf_receipts'])
  await db.exec(await readFile(new URL('../supabase/migrations/'+name+'.sql',import.meta.url),'utf8'));
 // Match managed PostgreSQL: migration operator has USAGE, not its GRANT OPTION.
 await db.exec(`create role migration_operator nologin createrole;
 grant create on database postgres to migration_operator;
 grant usage on schema auth to migration_operator;
 grant references on auth.users to migration_operator;
 set role migration_operator;`);
 await db.exec(original);await db.exec('reset role');
 assert.equal((await db.query<{allowed:boolean}>("select has_schema_privilege('apip_identity_executor','auth','usage') allowed")).rows[0].allowed,false);
 const wire=new PGLiteSocketServer({db,host:'127.0.0.1',port:0,maxConnections:2});await wire.start();
 const sql=postgres('postgresql://postgres@'+wire.getServerConn()+'/postgres',{max:1,prepare:false,onnotice:()=>{}});
 const restricted={begin:(work:(tx:postgres.TransactionSql)=>Promise<unknown>)=>sql.begin(async tx=>{await tx`set local role apip_adr_writer`;return work(tx);})} as unknown as postgres.Sql;
 let repo=postgresSpecialistRepository(restricted);
 try{
  await assert.rejects(repo.identity(a),(e:Error)=>{const cause=e.cause as {code:string;message:string};return e.message==='SPECIALIST_UNAVAILABLE'&&cause.code==='42501'&&cause.message==='permission denied for schema auth';});
  // Apply only to this disposable fixture using the realistic non-superuser operator.
  const repair=await readFile(new URL('../supabase/migrations/20261107210206_specialist_verified_subject_boundary.sql',import.meta.url),'utf8');
  await sql.begin(async tx=>{await tx`set local role migration_operator`;await tx.unsafe(repair.replace(/^begin;$/gm,'').replace(/^commit;$/gm,'')).simple();});
  repo=postgresSpecialistRepository(restricted);
  assert.equal((await repo.identity(a)).identityAdministrator,false);
  const profile={fullName:'Fictional hosted permission test',category:categories[0],qualification:'Fictional qualification',registration:'',jurisdiction:'',organization:'Synthetic institute',department:'',experience:'',specialization:''};
  const key=randomUUID(),created=await repo.create(a,profile,key);
  assert.equal(created.state,'DRAFT');assert.equal((await repo.create(a,profile,key)).id,created.id);
  assert.deepEqual((await repo.currentApplication(a))?.profile,profile);
  assert.equal(await repo.currentApplication(b),null);
  await assert.rejects(repo.command(b,created.id,1,{type:'submit'},randomUUID()),/NOT_FOUND/);
  await assert.rejects(repo.listForAdministrator(a,undefined,25),/FORBIDDEN/);
  assert.equal((await repo.command(a,created.id,1,{type:'submit'},randomUUID())).state,'SUBMITTED');
  assert.equal((await repo.currentApplication(a))?.state,'SUBMITTED');
  await assert.rejects(repo.command(a,created.id,1,{type:'submit'},randomUUID()),/REVISION_CONFLICT/);
  for(const role of ['anon','authenticated','apip_adr_writer'])assert.equal((await sql`select has_function_privilege(${role},'apip_identity.request_subject()','execute') allowed`)[0].allowed,false);
  assert.equal((await sql`select has_schema_privilege('apip_identity_executor','auth','usage') allowed`)[0].allowed,false,'repair does not widen managed Auth schema grants');
  const [role]=await sql`select rolcanlogin,rolbypassrls,rolinherit from pg_roles where rolname='apip_identity_executor'`;
  assert.deepEqual({...role},{rolcanlogin:false,rolbypassrls:false,rolinherit:false});
  assert.equal((await sql`select set_option from pg_auth_members where member=(select oid from pg_roles where rolname='migration_operator') and roleid=(select oid from pg_roles where rolname='apip_identity_executor')`)[0].set_option,false);
  assert.equal((await sql`select count(*)::int n from apip_identity.administrator_capabilities`)[0].n,0);
  await assert.rejects(sql.begin(async tx=>{await tx`set local role apip_adr_writer`;await tx`select apip_identity.identity_operation('identity',null,0,'{}'::jsonb,null)`;}),/SIGN_IN_REQUIRED/);
 }finally{await sql.end({timeout:2});await wire.stop();await db.close();}
});
