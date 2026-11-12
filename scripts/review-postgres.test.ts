import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('review queue installs with narrow grants and enforces claim, release, withdrawal and immutable review history',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role apip_adr_writer;
   create schema auth;create table auth.users(id uuid primary key);
   create schema apip_identity;create table apip_identity.applications(owner_id uuid,state text,valid_until timestamptz,profile jsonb);
   create schema apip_adr;create table apip_adr.revisions(owner_id uuid,case_id uuid,revision integer,snapshot jsonb,primary key(owner_id,case_id,revision));
   create schema apip_sharing;create table apip_sharing.directory(specialist uuid primary key,opted_in boolean);
   create function apip_sharing.owner_snapshot(p_case uuid,p_revision integer) returns jsonb language sql stable security definer set search_path='' as $$select snapshot from apip_adr.revisions where owner_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid and case_id=p_case and revision=p_revision$$;
   create role migration_operator nologin createrole;grant create on database postgres to migration_operator;
   grant usage on schema auth,apip_identity,apip_adr,apip_sharing to migration_operator;
   grant references on auth.users,apip_adr.revisions to migration_operator;
   grant select on apip_identity.applications,apip_sharing.directory to migration_operator;
   grant execute on function apip_sharing.owner_snapshot(uuid,integer) to migration_operator;
   alter table apip_adr.revisions owner to migration_operator;
   set role migration_operator;`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261112103000_adr_review_queue.sql',import.meta.url),'utf8'));
  await db.exec('reset role');
  const tables=await db.query<{rls:boolean}>("select c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='apip_review' and c.relkind='r'");
  assert.equal(tables.rows.length,5);assert(tables.rows.every(t=>t.rls));
  for(const role of ['anon','authenticated','apip_adr_writer'])for(const table of ['queue','assessment_versions','messages','audit','receipts'])
   assert.equal((await db.query<{ok:boolean}>("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') ok",[role,'apip_review.'+table])).rows[0].ok,false);
  assert.equal((await db.query<{n:number}>("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='apip_review' and a.grantee=0 and a.privilege_type='EXECUTE'")).rows[0].n,0);
  const patient=randomUUID(),other=randomUUID(),specialist=randomUUID(),second=randomUUID(),admin=randomUUID(),caseId=randomUUID();
  for(const id of [patient,other,specialist,second,admin])await db.query('insert into auth.users values($1)',[id]);
  for(const id of [specialist,second]){await db.query("insert into apip_identity.applications values($1,'APPROVED',now()+interval '30 days','{}')",[id]);await db.query('insert into apip_sharing.directory values($1,true)',[id]);}
  const snapshot={id:caseId,revision:3,values:{reactionNarrative:'Fictional rash'}};
  await db.query('insert into apip_adr.revisions values($1,$2,3,$3)',[patient,caseId,JSON.stringify(snapshot)]);
  async function call(actor:string,op:string,id:string|null,expected:number|null,body:unknown={},key=randomUUID()){
   await db.exec('begin;set local role apip_adr_writer');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);const r=await db.query<{result:any}>('select apip_review.operation($1,$2,$3,$4::jsonb,$5) result',[op,id,expected,JSON.stringify(body),key]);await db.exec('commit');return r.rows[0].result;}catch(e){await db.exec('rollback');throw e;}
  }
  const id=randomUUID(),key=randomUUID(),body={caseId,revision:3,consent:true,policyVersion:'phase3c-review-v1',snapshot,disclosure:{summary:'Fictional ADR'},digest:'a'.repeat(64)};
  assert.equal((await call(patient,'create',id,0,body,key)).state,'open');assert.equal((await call(patient,'create',id,0,body,key)).id,id);
  assert.equal((await call(specialist,'pool',null,null)).length,1);assert.equal((await call(specialist,'claim',id,1)).state,'claimed');
  await assert.rejects(call(second,'detail',id,null),/NOT_FOUND/);assert.equal((await call(specialist,'detail',id,null)).revision,3);
  await call(specialist,'assessment',id,null,{state:'draft',content:{summary:'Human review pending'}});
  await call(patient,'message',id,null,{body:'Fictional follow-up message'});assert.equal((await call(specialist,'messages',id,null)).length,1);
  await call(specialist,'release',id,2);assert.equal((await call(second,'claim',id,3)).state,'claimed');
  await call(patient,'withdraw',id,4);await assert.rejects(call(second,'detail',id,null),/NOT_FOUND/);
  await assert.rejects(db.query("update apip_review.assessment_versions set content='{}' where queue_id=$1",[id]),/IMMUTABLE_REVIEW_HISTORY/);
  assert.equal((await call(admin,'patient_list',null,null)).length,0);
 }finally{await db.close();}
});
