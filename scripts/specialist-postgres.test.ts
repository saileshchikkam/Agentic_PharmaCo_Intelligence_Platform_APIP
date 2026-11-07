import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import {postgresSpecialistRepository} from '../server/specialist/postgresRepository';
import {categories} from '../server/specialist/domain';
test('Phase 3B restricted PostgreSQL: migration, owner/admin gates, audit, retries and revocation',{timeout:90000},async()=>{
 const db=new PGlite(),a=randomUUID(),b=randomUUID(),admin=randomUUID();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;`);
 await db.query('insert into auth.users values ($1),($2),($3)',[a,b,admin]);
 for(const file of ['20261105092036_adr_postgres_foundation','20261105092042_adr_command_receipts','20261105093956_apip_restricted_writer_role','20261107152504_adr_historical_pdf_receipts'])
   await db.exec(await readFile(new URL('../supabase/migrations/'+file+'.sql',import.meta.url),'utf8'));
 const oldCase=randomUUID(),oldSnapshot={schemaVersion:1,id:oldCase,revision:1,fictionalOnly:true,updatedAt:new Date().toISOString(),values:{},medications:[{id:randomUUID(),kind:'suspect'}],statements:[],proposals:[],providerStatus:'manual'};
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
 await db.query('select apip_adr.append_revision($1,0,$2,$3,$4,$5)',[oldCase,randomUUID(),'create','a'.repeat(64),JSON.stringify(oldSnapshot)]);
 await db.exec(`create role fixture_migrator nologin createrole;
   grant create on database postgres to fixture_migrator;
   grant usage on schema auth to fixture_migrator with grant option;
   grant references on auth.users to fixture_migrator;
   set role fixture_migrator;`);
 assert.equal((await db.query<{rolsuper:boolean}>('select rolsuper from pg_roles where rolname=current_user')).rows[0].rolsuper,false);
 const identityMigration=await readFile(new URL('../supabase/migrations/20261107195900_specialist_identity_foundation.sql',import.meta.url),'utf8');
 await assert.rejects(db.exec(identityMigration.replace(/^grant apip_identity_executor to current_user.*$/gm,'')),/must be able to SET ROLE/);
 await db.exec('rollback');
 assert.equal((await db.query<{schema:string|null}>("select to_regnamespace('apip_identity')::text schema")).rows[0].schema,null);
 await db.exec(identityMigration);
 await db.exec(await readFile(new URL('../supabase/migrations/20261107210206_specialist_verified_subject_boundary.sql',import.meta.url),'utf8'));
 await db.exec('reset role');
 const migrationMembership=(await db.query<{set_option:boolean;inherit_option:boolean}>(`select set_option,inherit_option from pg_auth_members
   where member=(select oid from pg_roles where rolname='fixture_migrator') and roleid=(select oid from pg_roles where rolname='apip_identity_executor')`)).rows[0];
 assert.deepEqual(migrationMembership,{set_option:false,inherit_option:false});
 assert.deepEqual((await db.query('select snapshot from apip_adr.revisions where case_id=$1',[oldCase])).rows,[{snapshot:oldSnapshot}]);
 // Exercise the real reviewed procedure against disposable identities, not a live bootstrap.
 const bootstrap=await readFile(new URL('../database/operations/bootstrap-specialist-admin.sql',import.meta.url),'utf8');
 const variables:Record<string,string>={approved_subject:admin,operator_reference:'fixture-operator',approval_reference:'fixture-explicit-approval',approval_confirmation:'APPROVE IDENTITY ADMIN BOOTSTRAP'};
 const script=(confirmation=variables.approval_confirmation)=>bootstrap.replace(/:'([a-z_]+)'/g,(_match,key)=>"'"+(key==='approval_confirmation'?confirmation:variables[key]).replaceAll("'","''")+"'");
 await assert.rejects(db.exec(script('NOT APPROVED')),/EXPLICIT_APPROVAL_REQUIRED/);await db.exec('rollback');
 await db.exec(script());
 await assert.rejects(db.exec(script()),/ALREADY_BOOTSTRAPPED/);await db.exec('rollback');
 assert.equal((await db.query<{n:number}>('select count(*)::int n from apip_identity.provisioning_events')).rows[0].n,1);
 const socket=new PGLiteSocketServer({db,host:'127.0.0.1',port:0,maxConnections:4});await socket.start();
 const sql=postgres('postgresql://postgres@'+socket.getServerConn()+'/postgres',{max:3,prepare:false,onnotice:()=>{}});
 const restricted={begin:(work:(tx:postgres.TransactionSql)=>Promise<unknown>)=>sql.begin(async tx=>{await tx`set local role apip_adr_writer`;return work(tx);})} as unknown as postgres.Sql;
 const repo=postgresSpecialistRepository(restricted);
 const profile={fullName:'Fictional Reviewer',category:categories[0],qualification:'Synthetic qualification',registration:'',jurisdiction:'Fictional',organization:'Example Institute',department:'',experience:'',specialization:''};
 const decide=(id:string,version:number,action:string,key=randomUUID())=>repo.decide(admin,id,version,{action,reason:'Fictional independent check',evidenceReference:'synthetic-reference',policyVersion:'private-fictional-3b-v1'},key);
 try{
  const role=(await db.query<{rolcanlogin:boolean;rolsuper:boolean;rolbypassrls:boolean;rolcreaterole:boolean;rolinherit:boolean}>("select rolcanlogin,rolsuper,rolbypassrls,rolcreaterole,rolinherit from pg_roles where rolname='apip_identity_executor'")).rows[0];
  assert.deepEqual(role,{rolcanlogin:false,rolsuper:false,rolbypassrls:false,rolcreaterole:false,rolinherit:false});
  assert.equal((await db.query<{n:number}>(`select count(*)::int n from pg_auth_members where member=(select oid from pg_roles where rolname='apip_identity_executor')`)).rows[0].n,0);
  assert.equal((await db.query<{member:boolean}>("select pg_has_role('apip_adr_writer','apip_identity_executor','MEMBER') member")).rows[0].member,false);
  const tables=(await db.query<{relname:string;relrowsecurity:boolean;owner:string}>(`select c.relname,c.relrowsecurity,pg_get_userbyid(c.relowner) owner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='apip_identity' and c.relkind='r'`)).rows;
  assert.equal(tables.length,6);assert(tables.every(t=>t.relrowsecurity&&t.owner!=='apip_identity_executor'));
  assert.equal((await db.query<{owner:string}>("select pg_get_userbyid(proowner) owner from pg_proc where oid='apip_identity.identity_operation(text,uuid,integer,jsonb,uuid)'::regprocedure")).rows[0].owner,'apip_identity_executor');
  for(const table of ['administrator_capabilities','applications','decisions','command_receipts','audit_events','provisioning_events']){
    for(const role of ['anon','authenticated','apip_adr_writer']){
      const privileges=(await db.query<{ok:boolean}>("select has_table_privilege($1,$2,'INSERT,UPDATE,DELETE') ok",[role,'apip_identity.'+table])).rows[0];
      assert.equal(privileges.ok,false,role+' cannot directly mutate '+table);
    }
  }
  assert.equal((await db.query<{ok:boolean}>("select has_table_privilege('apip_adr_writer','apip_adr.cases','INSERT,UPDATE,DELETE') ok")).rows[0].ok,false);
  assert.equal((await db.query<{ok:boolean}>("select has_table_privilege('apip_identity_executor','apip_adr.revisions','SELECT') ok")).rows[0].ok,false);
  for(const role of ['anon','authenticated']){
   assert.equal((await db.query<{ok:boolean}>("select has_function_privilege($1,'apip_identity.identity_operation(text,uuid,integer,jsonb,uuid)','EXECUTE') ok",[role])).rows[0].ok,false);
  }
  await db.exec('set role apip_adr_writer');await assert.rejects(db.exec('select * from apip_identity.applications'),/permission denied/);await db.exec('reset role');
  let c=await repo.create(a,profile,randomUUID());assert.equal(c.state,'DRAFT');
  await assert.rejects(repo.command(b,c.id,1,{type:'submit'},randomUUID()),/NOT_FOUND/);
  await assert.rejects(repo.listForAdministrator(a,undefined,25),/FORBIDDEN/);
  c=await repo.command(a,c.id,c.version,{type:'submit'},randomUUID());
  c=await decide(c.id,c.version,'begin_verification');
  const version=c.version,key=randomUUID();
  await db.exec(`create function public.fixture_audit_failure() returns trigger language plpgsql as $$begin if NEW.action='approve' then raise exception 'FIXTURE_AUDIT_FAILURE';end if;return NEW;end;$$;
    create trigger fixture_audit_failure before insert on apip_identity.audit_events for each row execute function public.fixture_audit_failure();`);
  await assert.rejects(decide(c.id,version,'approve',key),/SPECIALIST_UNAVAILABLE/);
  assert.equal((await repo.currentApplication(a))?.state,'PENDING_VERIFICATION');
  assert.equal((await db.query<{n:number}>("select count(*)::int n from apip_identity.decisions where action='approve'")).rows[0].n,0);
  await db.exec('drop trigger fixture_audit_failure on apip_identity.audit_events;drop function public.fixture_audit_failure()');
  c=await decide(c.id,version,'approve',key);assert.equal(c.state,'APPROVED');
  assert.equal((await decide(c.id,version,'approve',key)).version,c.version);
  await assert.rejects(decide(c.id,version,'reject'),/REVISION_CONFLICT/);
  assert.equal((await repo.identity(a)).applicationState,'APPROVED');
  assert.equal((await repo.currentApplication(b)),null);
  c=await decide(c.id,c.version,'revoke');assert.equal((await repo.identity(a)).applicationState,'REVOKED');
  assert.equal((await decide(c.id,version,'approve',key)).state,'REVOKED','old receipt cannot restore approved UI state');
  const own=await repo.create(admin,profile,randomUUID());
  await assert.rejects(decide(own.id,own.version,'approve'),/SELF_APPROVAL_DENIED/);
  await db.exec('set role apip_identity_executor');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
  assert.equal((await db.query('select id from apip_identity.applications where owner_id=$1',[a])).rows.length,0,'executor remains subject to owner RLS');
  await assert.rejects(db.exec('select snapshot from apip_adr.revisions'),/permission denied/);
  await db.exec('reset role');
  assert.equal((await db.query<{n:number}>("select count(*)::int n from apip_identity.decisions where application_id=$1 and action='approve'",[c.id])).rows[0].n,1);
  let expiring=await repo.create(b,profile,randomUUID());
  expiring=await repo.command(b,expiring.id,expiring.version,{type:'submit'},randomUUID());
  expiring=await decide(expiring.id,expiring.version,'begin_verification');
  const race=await Promise.allSettled([decide(expiring.id,expiring.version,'approve'),decide(expiring.id,expiring.version,'reject')]);
  assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
  expiring=(await repo.currentApplication(b))!;
  const expiryOwner=randomUUID();await db.query('insert into auth.users(id) values($1)',[expiryOwner]);
  expiring=await repo.create(expiryOwner,profile,randomUUID());
  expiring=await repo.command(expiryOwner,expiring.id,expiring.version,{type:'submit'},randomUUID());
  expiring=await decide(expiring.id,expiring.version,'begin_verification');
  expiring=await decide(expiring.id,expiring.version,'approve');
  {
   await db.query("update apip_identity.applications set valid_until=now()-interval '1 second' where id=$1",[expiring.id]);
   assert.equal((await repo.identity(expiryOwner)).applicationState,'EXPIRED');
   const renewed=await decide(expiring.id,expiring.version,'renew');assert.equal(renewed.state,'APPROVED');
   assert.ok(Date.parse(renewed.validUntil!)>Date.now()+29*86400000);
  }
  await assert.rejects(db.exec("update apip_identity.audit_events set action='tampered'"),/IMMUTABLE_IDENTITY_HISTORY/);
  const publicGrants=await db.query<{n:number}>(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
    lateral aclexplode(p.proacl) acl where n.nspname='apip_identity' and acl.grantee=0 and acl.privilege_type='EXECUTE'`);
  assert.equal(publicGrants.rows[0].n,0);
  for(const browserRole of ['anon','authenticated']){
   const accessible=await db.query<{n:number}>(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='apip_identity' and has_function_privilege($1,p.oid,'EXECUTE')`,[browserRole]);
   assert.equal(accessible.rows[0].n,0);
  }
  const restored=new PGlite({loadDataDir:await db.dumpDataDir()});
  try{assert.deepEqual((await restored.query('select snapshot from apip_adr.revisions where case_id=$1',[oldCase])).rows,[{snapshot:oldSnapshot}]);
    assert.equal((await restored.query<{n:number}>('select count(*)::int n from apip_identity.provisioning_events')).rows[0].n,1);
  }finally{await restored.close();}
 }catch(error){const cause=(error as Error).cause as {code?:string;message?:string}|undefined;
  if(cause)console.error('Disposable SQL diagnostic:',cause.code,cause.message);throw error;
 }finally{await sql.end({timeout:2});await socket.stop();await db.close();}
});
