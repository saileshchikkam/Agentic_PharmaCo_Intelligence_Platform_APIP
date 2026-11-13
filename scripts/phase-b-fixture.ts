// Isolated PostgreSQL only. No hosted connection or real identity changes.
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
export const phaseBMigrations=['20261111000000_adr_pooled_sharing_queue','20261112103000_adr_professional_review','20261113152850_adr_completed_review_archive'];
export const migration=(name:string)=>readFile(new URL('../supabase/migrations/'+name+'.sql',import.meta.url),'utf8');
export async function phaseBFixture(before?: (db:PGlite)=>Promise<void>,apply=true){
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 create role migration_operator nologin createrole;grant create on database postgres to migration_operator;grant authenticated to migration_operator with admin true,inherit false,set false;
 grant usage on schema auth to migration_operator;grant references on auth.users to migration_operator;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;
 grant usage on schema storage to migration_operator,anon,authenticated;grant insert,select on storage.buckets to migration_operator;
 alter table storage.objects owner to migration_operator;grant select,insert on storage.objects to authenticated;
 set role migration_operator;`);
 for(const name of ['20261105092036_adr_postgres_foundation','20261105092042_adr_command_receipts','20261105093956_apip_restricted_writer_role','20261107152504_adr_historical_pdf_receipts','20261107195900_specialist_identity_foundation','20261107210206_specialist_verified_subject_boundary','20261108123217_adr_consented_sharing','20261113192624_adr_patient_finalization']){await db.exec('set role migration_operator');await db.exec(await migration(name));}
 // Auth-trigger installation is part of the already-deployed managed foundation,
 // not a new grant to the Phase B operator. Match its owned role-table boundary.
 await db.exec('reset role');await db.exec(await migration('20261112155338_account_portal_binding'));
 await db.exec('alter table apip_identity.account_roles owner to migration_operator;set role migration_operator');
 if(before){await db.exec('reset role');await before(db);await db.exec('set role migration_operator');}
 if(apply)for(const name of phaseBMigrations)await db.exec(await migration(name));
 await db.exec('reset role');return db;
 }catch(e){await db.close();throw e;}
}


export const finalContent={clinicalAssessment:'Fictional manual assessment only',medicineVerification:'Synthetic medicine record checked',seriousness:'Not assessed',outcome:'Unknown',causality:'Not assessed',causalityReasoning:'No clinical determination in this fictional test',investigations:'Not available',observations:'Research prototype',reviewerNotes:'PRIVATE NOTE MUST NOT ENTER ARCHIVE'};
export async function seedPhaseB(db:any){
 const actors:any={};for(const [name,role]of Object.entries({patient:'PATIENT',patientB:'PATIENT',specialist:'SPECIALIST',specialistB:'SPECIALIST',pending:'SPECIALIST',revoked:'SPECIALIST',administrator:'SPECIALIST',developer:'PATIENT'})){
  actors[name]={id:randomUUID(),email:name+'@fixture.example.test',emailVerified:true,role};await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[actors[name].id,actors[name].email,JSON.stringify({apip_registration_role:role})]);
 }
 for(const name of ['specialist','specialistB','pending','revoked'])await db.query("insert into apip_identity.applications(id,owner_id,version,state,profile,valid_until) values($1,$2,1,$3,$4,now()+interval '30 days')",[randomUUID(),actors[name].id,name==='pending'?'SUBMITTED':name==='revoked'?'REVOKED':'APPROVED',JSON.stringify({fullName:'Fictional '+name,category:'Pharmacist',qualification:'Fictional qualification',organization:'Synthetic institute'})]);
 await db.query("insert into apip_identity.administrator_capabilities(subject,capability,active,provisioning_reference) values($1,'specialist.identity.admin',true,'DISPOSABLE FIXTURE ONLY')",[actors.administrator.id]);
 await db.exec('set role migration_operator');await db.query("insert into apip_archive.entitlements(subject,approved_email,valid_until,approval_reference) values($1,$2,now()+interval '30 days','DISPOSABLE FIXTURE ONLY')",[actors.developer.id,actors.developer.email]);await db.exec('reset role');
 return actors;
}
export async function writer(db:any,actor:any,fn:(tx:any)=>Promise<any>){return db.transaction(async(tx:any)=>{await tx.exec('set local role apip_adr_writer');await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.email',$2,true),set_config('request.jwt.claim.email_verified',$3,true)",[actor.id,actor.email??'',actor.emailVerified?'true':'false']);return fn(tx);});}
export async function fixtureCase(db:any,actor:any,final=true){const at=new Date().toISOString(),c:any={schemaVersion:1,id:randomUUID(),revision:1,fictionalOnly:true,updatedAt:at,values:{},medications:[{id:'m',kind:'suspect'}],statements:[],proposals:[],providerStatus:'manual'};
 for(const[k,value]of Object.entries({caseType:'Initial',initials:'FX',age:'32',reaction:'Fictional reaction involving unlisted name Nobody',reactionStart:'2026-11-01',reporterName:'Fictional Reporter',email:'fixture@example.test','med.m.name':'Fictional medicine'}))c.values[k]={state:'provided',value,confirmedAt:at,source:'manual',statementId:'fixture'};
 await writer(db,actor,tx=>tx.query("select apip_adr.append_revision($1,0,$2,'create',$3,$4)",[c.id,randomUUID(),'a'.repeat(64),JSON.stringify(c)]));if(final)await writer(db,actor,tx=>tx.query('select apip_adr.finalize_case($1,1,$2)',[c.id,randomUUID()]));return c;
}
