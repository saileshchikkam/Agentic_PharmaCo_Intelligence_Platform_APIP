import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';
test('professional review history is private, immutable, assignment-scoped and revocation-aware',async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role apip_adr_writer;create schema auth;create table auth.users(id uuid primary key);
 create schema apip_identity;create table apip_identity.applications(owner_id uuid,state text,valid_until timestamptz);
 create schema apip_sharing;create table apip_sharing.requests(id uuid primary key,patient uuid,specialist uuid,state text);
 create role migration_operator nologin createrole;grant create on database postgres to migration_operator;grant usage on schema auth,apip_identity,apip_sharing to migration_operator;
 grant references on auth.users,apip_sharing.requests to migration_operator;grant select on apip_identity.applications,apip_sharing.requests to migration_operator;
 alter table apip_sharing.requests owner to migration_operator;set role migration_operator;`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261112103000_adr_professional_review.sql',import.meta.url),'utf8'));await db.exec('reset role');
 const tables=await db.query<{rls:boolean}>("select c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='apip_review' and c.relkind='r'");assert.equal(tables.rows.length,4);assert(tables.rows.every(t=>t.rls));
 for(const role of ['anon','authenticated','apip_adr_writer'])for(const table of ['assessment_versions','messages','audit','receipts'])assert.equal((await db.query<{ok:boolean}>("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') ok",[role,'apip_review.'+table])).rows[0].ok,false);
 assert.equal((await db.query<{n:number}>("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='apip_review' and a.grantee=0 and a.privilege_type='EXECUTE'")).rows[0].n,0);
 const patient=randomUUID(),specialist=randomUUID(),other=randomUUID(),admin=randomUUID(),assignment=randomUUID();for(const id of [patient,specialist,other,admin])await db.query('insert into auth.users values($1)',[id]);
 await db.query("insert into apip_identity.applications values($1,'APPROVED',now()+interval '30 days')",[specialist]);await db.query("insert into apip_identity.applications values($1,'APPROVED',now()+interval '30 days')",[other]);await db.query("insert into apip_sharing.requests values($1,$2,$3,'active')",[assignment,patient,specialist]);
 async function call(actor:string,op:string,expected:number|null,body:unknown={},key=randomUUID()){await db.exec('begin;set local role apip_adr_writer');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);const r=await db.query<{result:any}>('select apip_review.operation($1,$2,$3,$4::jsonb,$5) result',[op,assignment,expected,JSON.stringify(body),key]);await db.exec('commit');return r.rows[0].result;}catch(e){await db.exec('rollback');throw e;}}
 const command=randomUUID();assert.equal((await call(specialist,'assessment',0,{state:'draft',content:{summary:'Fictional human review'}},command)).version,1);assert.equal((await call(specialist,'assessment',0,{state:'draft',content:{summary:'Fictional human review'}},command)).replayed,true);
 await assert.rejects(call(patient,'assessments',null),/NOT_FOUND/);await assert.rejects(call(other,'assessments',null),/NOT_FOUND/);await assert.rejects(call(admin,'messages',null),/NOT_FOUND/);
 await call(patient,'message',null,{body:'Fictional follow-up'});assert.equal((await call(specialist,'messages',null)).length,1);
 await db.query("update apip_identity.applications set state='REVOKED' where owner_id=$1",[specialist]);await assert.rejects(call(specialist,'assessments',null),/NOT_FOUND/);
 await db.query("update apip_sharing.requests set state='withdrawn' where id=$1",[assignment]);await assert.rejects(call(patient,'messages',null),/NOT_FOUND/);
 await assert.rejects(db.query("update apip_review.assessment_versions set content='{}' where assignment_id=$1",[assignment]),/IMMUTABLE_REVIEW_HISTORY/);
 }finally{await db.close();}});
