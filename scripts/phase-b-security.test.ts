import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {phaseBFixture,seedPhaseB,writer,fixtureCase,finalContent,phaseBMigrations,migration} from './phase-b-fixture';import {prepareDisclosure} from '../server/sharing/disclosure';import {extractSafeMetadata} from '../server/sharing/policy';
test('Phase B actual-schema non-superuser queue, assessment, archive and privacy lifecycle',{timeout:90000},async()=>{
 const db=await phaseBFixture();try{
 const actors=await seedPhaseB(db),p=actors.patient,s=actors.specialist,d=actors.developer;
 const call=(a:any,space:string,op:string,id:string|null,body:any={},key=randomUUID(),expected:number|null=null)=>writer(db,a,async tx=>(await tx.query(`select ${space}.operation($1,$2,${space==='apip_review'?'$5,':''}$3::jsonb,$4) result`,space==='apip_review'?[op,id,JSON.stringify(body),key,expected]:[op,id,JSON.stringify(body),key])).rows[0].result);
 const pool=(a:any,op:string,id:string|null,body:any={},key=randomUUID())=>writer(db,a,async tx=>(await tx.query('select apip_sharing.pool_operation($1,$2,$3,$4) result',[op,id,JSON.stringify(body),key])).rows[0].result);
 const c=await fixtureCase(db,p),draft=await fixtureCase(db,p,false),poolId=randomUUID();
 const body=(snap:any)=>{const disclosure=prepareDisclosure(snap);return {caseId:snap.id,revision:1,snapshot:snap,disclosure,digest:disclosure.digest,safeMetadata:extractSafeMetadata(snap,disclosure),policyVersion:'phase3c-c1-v1',consent:true};};
 assert.equal((await pool(s,'pool_list',null)).length,0,'finalized unshared reports stay private');
 await assert.rejects(pool(p,'pool_create',randomUUID(),body(draft)),/REPORT_NOT_FINALIZED/);
 await assert.rejects(pool(p,'pool_create',poolId,{...body(c),consent:false}),/EXPLICIT_CONSENT_REQUIRED/);
 const createKey=randomUUID();await pool(p,'pool_create',poolId,body(c),createKey);await pool(p,'pool_create',poolId,body(c),createKey);
 const queue=await pool(s,'pool_list',null);assert.equal(queue.length,1);assert(!JSON.stringify(queue).includes('Nobody'));assert(!JSON.stringify(queue).includes('Fictional medicine'));assert(!JSON.stringify(queue).includes('FX'));
 for(const a of [p,actors.pending,actors.revoked,actors.administrator])await assert.rejects(pool(a,'pool_list',null),/FORBIDDEN/);
 const claimed=await pool(s,'pool_claim',poolId,{});const assignment=claimed.request.id;
 await assert.rejects(pool(actors.specialistB,'pool_claim',poolId,{}),/ACTIVE_ASSIGNMENT_CONFLICT/);
 await assert.rejects(call(actors.specialistB,'apip_review','assessments',assignment),/NOT_FOUND/);await assert.rejects(call(actors.patientB,'apip_review','assessments',assignment),/NOT_FOUND/);
 assert.equal((await call(s,'apip_review','overview',null)).length,1);
 const k=randomUUID();await call(s,'apip_review','assessment',assignment,{state:'draft',content:finalContent},k,0);assert.equal((await call(s,'apip_review','assessment',assignment,{state:'draft',content:finalContent},k,0)).replayed,true);
 await assert.rejects(call(s,'apip_review','assessment',assignment,{state:'draft',content:finalContent},randomUUID(),0),/REVISION_CONFLICT/);
 await assert.rejects(call(s,'apip_review','assessment',assignment,{state:'final',content:{clinicalAssessment:'Incomplete'}},randomUUID(),1),/ASSESSMENT_REQUIRED/);
 await db.exec("create function public.fail_phase_b_audit() returns trigger language plpgsql as $$begin raise exception 'AUDIT_FAILURE';end;$$;create trigger fail_phase_b before insert on apip_review.audit for each row execute function public.fail_phase_b_audit()");
 await assert.rejects(call(s,'apip_review','assessment',assignment,{state:'final',content:finalContent},randomUUID(),1),/AUDIT_FAILURE/);assert.equal((await call(s,'apip_review','assessments',assignment)).length,1);await db.exec('drop trigger fail_phase_b on apip_review.audit');
 await call(s,'apip_review','assessment',assignment,{state:'final',content:finalContent},randomUUID(),1);
 await assert.rejects(call(s,'apip_review','assessment',assignment,{state:'draft',content:finalContent},randomUUID(),2),/ASSESSMENT_FINALIZED/);
 await assert.rejects(call(s,'apip_archive','source',assignment),/ARCHIVE_CONSENT_REQUIRED/);
 await assert.rejects(call(actors.patientB,'apip_archive','consent_status',assignment),/NOT_FOUND/);
 await call(p,'apip_archive','consent',assignment,{expectedVersion:0,allowed:true,confirmed:true,policyVersion:'phase-b-archive-v1'});
 const source=await call(s,'apip_archive','source',assignment);assert.equal(source.assessmentVersion,2);assert(!JSON.stringify(source).includes(finalContent.reviewerNotes));
 const complete={assessmentVersion:2,sha256:'c'.repeat(64),bytes:1000},completeKey=randomUUID();
 await db.exec('create trigger fail_archive_audit before insert on apip_archive.audit for each row execute function public.fail_phase_b_audit()');await assert.rejects(call(s,'apip_archive','complete',assignment,complete,completeKey),/AUDIT_FAILURE/);assert.equal((await db.query<any>('select count(*)::int n from apip_archive.artifacts')).rows[0].n,0);await db.exec('drop trigger fail_archive_audit on apip_archive.audit');
 await call(s,'apip_archive','complete',assignment,complete,completeKey);await call(s,'apip_archive','complete',assignment,complete,completeKey);
 assert.equal((await call(d,'apip_archive','list',null)).length,1);assert.equal((await call({...d,email:'forged@example.test'},'apip_archive','capabilities',null)).completedArchive,false);assert.equal((await call({...d,emailVerified:false},'apip_archive','capabilities',null)).completedArchive,false);
 for(const a of [p,s,actors.administrator,actors.specialistB])await assert.rejects(call(a,'apip_archive','list',null),/FORBIDDEN/);
 await call(p,'apip_archive','consent',assignment,{expectedVersion:1,allowed:false,confirmed:true,policyVersion:'phase-b-archive-v1'});assert.equal((await call(d,'apip_archive','list',null)).length,0);await assert.rejects(call(d,'apip_archive','metadata',assignment),/NOT_FOUND/);
 for(const role of ['anon','authenticated','apip_adr_writer'])for(const table of ['entitlements','consent_versions','artifacts','audit'])assert.equal((await db.query<any>("select has_table_privilege($1,$2,'INSERT,UPDATE,DELETE') ok",[role,'apip_archive.'+table])).rows[0].ok,false);
 for(const role of ['anon','authenticated'])for(const fn of ['apip_archive.operation(text,uuid,jsonb,uuid)','apip_review.operation(text,uuid,integer,jsonb,uuid)'])assert.equal((await db.query<any>("select has_function_privilege($1,$2,'EXECUTE') ok",[role,fn])).rows[0].ok,false);
 await db.query("insert into storage.objects values($1,'apip-completed-adr')",[randomUUID()]);await db.exec('set role authenticated');assert.equal((await db.query('select * from storage.objects')).rows.length,0);await assert.rejects(db.query("insert into storage.objects values($1,'apip-completed-adr')",[randomUUID()]),/row-level security/);await db.exec('reset role');
 await db.query("update apip_identity.applications set state='REVOKED' where owner_id=$1",[s.id]);await assert.rejects(call(s,'apip_review','assessments',assignment),/NOT_FOUND/);
 await db.query("update apip_identity.applications set valid_until=now()-interval '1 second' where owner_id=$1",[actors.specialistB.id]);await assert.rejects(pool(actors.specialistB,'pool_list',null),/FORBIDDEN/);
 for(const role of ['apip_review_executor','apip_archive_executor']){assert.equal((await db.query<any>("select has_table_privilege($1,'apip_adr.cases','SELECT') ok",[role])).rows[0].ok,false);assert.equal((await db.query<any>("select count(*)::int n from pg_class where relowner=(select oid from pg_roles where rolname=$1) and relkind='r'",[role])).rows[0].n,0);}
 assert.equal((await db.query<any>("select count(*)::int n from pg_roles where rolname in ('apip_review_executor','apip_archive_executor') and (rolsuper or rolbypassrls or rolcanlogin)")).rows[0].n,0);
 }finally{await db.close();}
});

test('Phase B populated Phase A upgrade and transaction rollback preserve source records',{timeout:90000},async()=>{
 let source:any;
 const db=await phaseBFixture(async d=>{const a={id:randomUUID(),email:'preserved@fixture.example.test',emailVerified:true};await d.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[a.id,JSON.stringify({apip_registration_role:'PATIENT'})]);const c=await fixtureCase(d,a);source=(await d.query('select snapshot from apip_adr.revisions where case_id=$1',[c.id])).rows[0];});
 try{assert.deepEqual((await db.query('select snapshot from apip_adr.revisions')).rows[0],source);assert.equal((await db.query<any>("select has_table_privilege('migration_operator','auth.users','SELECT') ok")).rows[0].ok,false);assert.equal((await db.query<any>("select count(*)::int n from pg_trigger where tgname='pool_finalization_guard'")).rows[0].n,1);}finally{await db.close();}
 const rollback=await phaseBFixture(undefined,false);try{
  const before=(await rollback.query("select pg_get_functiondef('apip_sharing.eligible(uuid)'::regprocedure) definition")).rows;
  await rollback.exec('begin;set local role migration_operator');for(const name of phaseBMigrations)await rollback.exec((await migration(name)).replace(/^begin;\s*$/mi,'').replace(/^commit;\s*$/mi,''));await rollback.exec('rollback');
  assert.deepEqual((await rollback.query("select pg_get_functiondef('apip_sharing.eligible(uuid)'::regprocedure) definition")).rows,before);assert.equal((await rollback.query<any>("select to_regclass('apip_sharing.pooled_requests') pool,to_regnamespace('apip_review') review,to_regnamespace('apip_archive') archive")).rows[0].pool,null);
 }finally{await rollback.close();}
});
