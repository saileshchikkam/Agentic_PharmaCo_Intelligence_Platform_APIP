import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
test('draft sharing foundation installs under non-superuser and exposes no browser or writer access',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role apip_adr_writer;
   create schema auth;create table auth.users(id uuid primary key);
   create schema apip_identity;create table apip_identity.applications(owner_id uuid,state text,valid_until timestamptz,profile jsonb);
   create schema apip_adr;create table apip_adr.revisions(owner_id uuid,case_id uuid,revision integer,snapshot jsonb,primary key(owner_id,case_id,revision));
   create role migration_operator nologin createrole;
   grant create on database postgres to migration_operator;
   grant usage on schema auth,apip_identity,apip_adr to migration_operator;
   grant references on auth.users,apip_adr.revisions to migration_operator;
   grant select on apip_identity.applications,apip_adr.revisions to migration_operator;
   set role migration_operator;`);
  assert.equal((await db.query<{super:boolean}>('select rolsuper as super from pg_roles where rolname=current_user')).rows[0].super,false);
  await db.exec(await readFile(new URL('../supabase/migrations/20261108123217_adr_consented_sharing.sql',import.meta.url),'utf8'));
  await db.exec('reset role');
  const tables=await db.query<{rls:boolean;owner:string}>("select c.relrowsecurity rls,pg_get_userbyid(c.relowner) owner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='apip_sharing' and c.relkind='r'");
  assert.equal(tables.rows.length,4);assert(tables.rows.every(t=>t.rls&&t.owner==='migration_operator'));
  for(const role of ['anon','authenticated','apip_adr_writer']){
   for(const table of ['directory','requests','audit','receipts'])assert.equal((await db.query<{allowed:boolean}>('select has_table_privilege($1,$2,\'SELECT,INSERT,UPDATE,DELETE\') allowed',[role,'apip_sharing.'+table])).rows[0].allowed,false);
   for(const fn of ['subject()','eligible(uuid)','immutable()','owner_snapshot(uuid,integer)','own_directory_profile()','decline_owned_assignment(uuid,integer,uuid)'])assert.equal((await db.query<{allowed:boolean}>('select has_function_privilege($1,$2,\'EXECUTE\') allowed',[role,'apip_sharing.'+fn])).rows[0].allowed,false);
  }
  assert.equal((await db.query<{allowed:boolean}>("select has_column_privilege('apip_sharing_executor','apip_sharing.requests','patient','UPDATE') allowed")).rows[0].allowed,false);
  assert.equal((await db.query<{allowed:boolean}>("select has_column_privilege('apip_sharing_executor','apip_sharing.requests','state','UPDATE') allowed")).rows[0].allowed,true);
  assert.equal((await db.query<{n:number}>("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='apip_sharing' and a.grantee=0 and a.privilege_type='EXECUTE'")).rows[0].n,0);
  const [patient,other,reviewer,unassigned,revoked,admin]=Array.from({length:6},()=>randomUUID());
  for(const id of [patient,other,reviewer,unassigned,revoked,admin])await db.query('insert into auth.users values($1)',[id]);
  for(const [id,state] of [[reviewer,'APPROVED'],[unassigned,'APPROVED'],[revoked,'REVOKED']])await db.query("insert into apip_identity.applications values($1,$2,now()+interval '30 days',$3)",[id,state,JSON.stringify({fullName:'Fictional reviewer',category:'Pharmacist',organization:'Fictional Institute'})]);
  const caseId=randomUUID(),snapshot={id:caseId,revision:3};await db.query('insert into apip_adr.revisions values($1,$2,3,$3)',[patient,caseId,JSON.stringify(snapshot)]);
  async function call(actor:string,op:string,id:string|null=null,body:unknown={},key=randomUUID()){
   await db.exec('begin;set local role apip_adr_writer');
   try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);const result=await db.query<{result:any}>('select apip_sharing.operation($1,$2,$3::jsonb,$4) result',[op,id,JSON.stringify(body),key]);await db.exec('commit');return result.rows[0].result;}catch(e){await db.exec('rollback');throw e;}
  }
  await call(reviewer,'opt_in',null,{optedIn:true});await call(unassigned,'opt_in',null,{optedIn:true});assert.equal((await call(patient,'directory')).length,2);
  const requestId=randomUUID(),command=randomUUID(),body={caseId,revision:3,specialist:reviewer,consent:true,policyVersion:'phase3c-b-v1',snapshot,disclosure:{revision:3},digest:'a'.repeat(64)};
  await assert.rejects(call(other,'create',randomUUID(),body),/NOT_FOUND/);
  const created=await call(patient,'create',requestId,body,command);assert.equal(created.state,'active');assert.equal((await call(patient,'create',requestId,body,command)).id,requestId);
  await assert.rejects(call(patient,'create',randomUUID(),body),/duplicate key/);
  assert.equal((await call(reviewer,'count')).count,1);assert.equal((await call(unassigned,'count')).count,0);
  assert.equal((await call(reviewer,'report',requestId)).revision,3);
  for(const actor of [unassigned,other,revoked,admin])await assert.rejects(call(actor,'report',requestId),/NOT_FOUND/);
  await assert.rejects(call(other,'withdraw',requestId,{expectedVersion:1}),/NOT_FOUND/);
  await assert.rejects(call(patient,'withdraw',requestId,{expectedVersion:9}),/REVISION_CONFLICT/);
  await db.query('insert into apip_adr.revisions values($1,$2,4,$3)',[patient,caseId,JSON.stringify({...snapshot,revision:4})]);assert.equal((await call(reviewer,'pdf_snapshot',requestId)).revision,3);
  await db.query("update apip_identity.applications set state='REVOKED' where owner_id=$1",[reviewer]);await assert.rejects(call(reviewer,'report',requestId),/NOT_FOUND/);
  await db.query("update apip_identity.applications set state='APPROVED' where owner_id=$1",[reviewer]);
  await db.query("update apip_identity.applications set valid_until=now()-interval '1 second' where owner_id=$1",[reviewer]);await assert.rejects(call(reviewer,'report',requestId),/NOT_FOUND/);await db.query("update apip_identity.applications set valid_until=now()+interval '30 days' where owner_id=$1",[reviewer]);
  await call(patient,'withdraw',requestId,{expectedVersion:1});await assert.rejects(call(reviewer,'report',requestId),/NOT_FOUND/);
  assert.equal((await call(patient,'create',requestId,body,command)).state,'withdrawn');
  const wire=new PGLiteSocketServer({db,host:'127.0.0.1',port:0,maxConnections:3});await wire.start();
  const clients=[postgres('postgresql://postgres@'+wire.getServerConn()+'/postgres',{max:1,prepare:false,onnotice:()=>{}}),postgres('postgresql://postgres@'+wire.getServerConn()+'/postgres',{max:1,prepare:false,onnotice:()=>{}})];
  try{const races=await Promise.allSettled(clients.map(client=>client.begin(async tx=>{await tx`set local role apip_adr_writer`;await tx`select set_config('request.jwt.claim.sub',${patient},true)`;return tx`select apip_sharing.operation('create',${randomUUID()}::uuid,${JSON.stringify(body)}::text::jsonb,${randomUUID()}::uuid) result`;})));assert.equal(races.filter(r=>r.status==='fulfilled').length,1);assert.equal(races.filter(r=>r.status==='rejected').length,1);}finally{await Promise.all(clients.map(c=>c.end({timeout:2})));await wire.stop();}
  const active=(await call(patient,'patient_list')).find((r:any)=>r.state==='active');assert(active);await call(reviewer,'decline',active.id,{expectedVersion:1});await assert.rejects(call(reviewer,'report',active.id),/NOT_FOUND/);
  const before=(await db.query<{n:number}>('select count(*)::int n from apip_sharing.requests')).rows[0].n;
  await db.exec(`create function apip_sharing.fixture_fail_audit() returns trigger language plpgsql as $$begin if new.action='consent_and_assignment' then raise exception 'CONTROLLED_AUDIT_FAILURE';end if;return new;end;$$;create trigger fixture_fail_audit before insert on apip_sharing.audit for each row execute function apip_sharing.fixture_fail_audit();`);
  await assert.rejects(call(patient,'create',randomUUID(),body),/CONTROLLED_AUDIT_FAILURE/);assert.equal((await db.query<{n:number}>('select count(*)::int n from apip_sharing.requests')).rows[0].n,before);
 }finally{await db.close();}
});
