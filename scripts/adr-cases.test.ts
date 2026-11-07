import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { registerVerifiedAdr } from '../server/cloud-account';
import { postgresGuidedRepository } from '../server/adr/postgresRepository';
import { sqliteGuidedRepository, type GuidedCaseRepository } from '../server/adr/repository';
import { parseCaseFilters, encodeCursor, decodeCursor } from '../server/adr/caseQuery';
import type { GuidedCase } from '../src/features/adr/guided/domain';

const migration='20261107152504_adr_historical_pdf_receipts.sql';
test('strict filters and owner/filter-bound signed cursors',()=>{
  const f=parseCaseFilters({q:' Example ',limit:'2'}),owner=randomUUID();
  const cursor=encodeCursor(owner,f,{at:new Date().toISOString(),id:randomUUID()});
  assert.ok(decodeCursor(owner,f,cursor));
  for(const bad of ['tampered',cursor+'x',cursor.slice(0,-3)])assert.throws(()=>decodeCursor(owner,f,bad),/INVALID_CURSOR/);
  assert.throws(()=>decodeCursor(randomUUID(),f,cursor),/INVALID_CURSOR/);
  assert.throws(()=>decodeCursor(owner,{...f,q:'other'},cursor),/INVALID_CURSOR/);
  for(const query of [{owner:'fake'},{limit:'51'},{status:'Reviewed'},{archived:'include'},
    {sort:'drop table'},{from:'2026-02-30'},{from:'2026-11-10',to:'2026-11-01'},{q:['x']},{medicine:'x'.repeat(101)}])
    assert.throws(()=>parseCaseFilters(query),/INVALID_FILTER/);
});

for(const mode of ['sqlite','postgres'] as const)test(`patient case API, ${mode}: filters, immutable snapshots, pinned PDFs and denial`,{timeout:90000},async()=>{
  const dir=await mkdtemp(join(tmpdir(),'apip-cases-'));
  const a=randomUUID(),b=randomUUID();
  let repository:GuidedCaseRepository,close:()=>Promise<void>;
  if(mode==='sqlite'){
    const db=new DatabaseSync(join(dir,'fixture.sqlite'));
    db.exec('create table local_users(id text primary key)');
    db.prepare('insert into local_users values (?)').run(a);db.prepare('insert into local_users values (?)').run(b);
    repository=sqliteGuidedRepository(db);close=async()=>db.close();
  }else{
    const db=new PGlite();
    await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;`);
    await db.query('insert into auth.users values ($1),($2)',[a,b]);
    for(const file of ['20261105092036_adr_postgres_foundation.sql','20261105092042_adr_command_receipts.sql','20261105093956_apip_restricted_writer_role.sql'])
      await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
    const oldId=randomUUID(),oldSnapshot={schemaVersion:1,id:oldId,revision:1,fictionalOnly:true,updatedAt:new Date().toISOString(),
      values:{},medications:[{id:randomUUID(),kind:'suspect'}],statements:[],proposals:[],providerStatus:'manual'};
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
    await db.exec('set role apip_adr_writer');
    await db.query('select apip_adr.append_revision($1,0,$2,$3,$4,$5)',[oldId,randomUUID(),'create','a'.repeat(64),JSON.stringify(oldSnapshot)]);
    await db.exec('reset role');
    const definition=(await db.query<{def:string}>("select pg_get_functiondef('apip_adr.record_pdf_export(uuid,integer,uuid,text,text,integer)'::regprocedure) def")).rows[0].def;
    // Upgrade the verified schema; the new function grants neither direct writes nor browser execution.
    await db.exec(await readFile(new URL('../supabase/migrations/'+migration,import.meta.url),'utf8'));
    assert.deepEqual((await db.query('select snapshot from apip_adr.revisions where case_id=$1',[oldId])).rows,[{snapshot:oldSnapshot}]);
    assert.equal((await db.query<{def:string}>("select pg_get_functiondef('apip_adr.record_pdf_export(uuid,integer,uuid,text,text,integer)'::regprocedure) def")).rows[0].def,definition);
    // A deployment ledger skips an applied file; the SQL deliberately fails instead of replacing a prior function.
    await db.exec('begin');
    await assert.rejects(db.exec('create function apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer) returns void language sql as $$select null$$'),/already exists/);
    await db.exec('rollback');
    await db.exec('set role apip_adr_writer');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
    await assert.rejects(db.query('select apip_adr.record_historical_pdf_export($1,1,$2,$3,$4,100)',[oldId,randomUUID(),'b'.repeat(64),'c'.repeat(64)]),/NOT_FOUND/);
    await db.query("select set_config('request.jwt.claim.sub','','false')");
    await assert.rejects(db.query('select apip_adr.record_historical_pdf_export($1,1,$2,$3,$4,100)',[oldId,randomUUID(),'b'.repeat(64),'c'.repeat(64)]),/SIGN_IN_REQUIRED/);
    await db.exec('reset role');
    assert.equal((await db.query<{n:number}>(`select count(*)::int n from pg_proc p,
      lateral aclexplode(p.proacl) acl where p.oid='apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer)'::regprocedure
      and acl.grantee=0 and acl.privilege_type='EXECUTE'`)).rows[0].n,0);
    assert.equal((await db.query<{ok:boolean}>(`select has_function_privilege('apip_adr_writer',
      'apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer)','EXECUTE') ok`)).rows[0].ok,true);
    for(const role of ['anon','authenticated'])assert.equal((await db.query<{ok:boolean}>(
      "select has_function_privilege($1,'apip_adr.record_historical_pdf_export(uuid,integer,uuid,text,text,integer)','EXECUTE') ok",[role])).rows[0].ok,false);
    await db.exec('set role apip_adr_writer');
    await assert.rejects(db.exec('delete from apip_adr.revisions'),/permission denied/);
    await db.exec('reset role');
    const socket=new PGLiteSocketServer({db,host:'127.0.0.1',port:0,maxConnections:4});await socket.start();
    const sql=postgres('postgresql://postgres@'+socket.getServerConn()+'/postgres',{max:3,prepare:false,onnotice:()=>{}});
    repository=postgresGuidedRepository({begin:(run:(tx:postgres.TransactionSql)=>Promise<unknown>)=>sql.begin(async tx=>{
      await tx`set local role apip_adr_writer`;return run(tx);
    })} as unknown as postgres.Sql);
    close=async()=>{await sql.end({timeout:2});await socket.stop();await db.close();};
  }
  let revoked=false;
  const app=express();registerVerifiedAdr(app,repository,async token=>revoked?null:token==='a'?{id:a}:token==='b'?{id:b}:null);
  const http=app.listen(0,'127.0.0.1');await once(http,'listening');
  const origin='http://127.0.0.1:'+(http.address() as {port:number}).port;
  const call=(path:string,body?:unknown,actor='a')=>fetch(origin+'/api/account/'+path,{
    method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+actor,'X-APIP-Account':actor==='a'?a:b,
      'Content-Type':'application/json','Idempotency-Key':randomUUID()},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const json=async(path:string,body?:unknown,actor='a')=>{const r=await call(path,body,actor);assert.equal(r.status,200,await r.clone().text());return r.json();};
  try{
    const create=async(actor='a')=>{const r=await call('adr-guided',{fictionalOnly:true},actor);assert.equal(r.status,201);return (await r.json()).case as GuidedCase;};
    let c=await create();const id=c.id,original=structuredClone(c);
    for(const [key,value] of Object.entries({caseType:'Initial',initials:'ZX',reaction:'Fictional first rash',reporterName:'Fictional Reporter',reportDate:'2026-11-01',
      [`med.${c.medications[0].id}.name`]:'Fictional TestMed'}))c=(await json(`adr-guided/${id}/command`,{expectedRevision:c.revision,command:{type:'confirm',key,value}})).case;
    const historical=structuredClone(c);
    c=(await json(`adr-guided/${id}/command`,{expectedRevision:c.revision,command:{type:'confirm',key:'reaction',value:'Fictional later swelling'}})).case;
    await create();await create();const foreign=await create('b');
    const all=await json('adr-cases?limit=2');assert.equal(all.cases.length,2);assert.ok(all.nextCursor);
    const next=await json('adr-cases?limit=2&cursor='+all.nextCursor);assert.equal(next.cases.length,1);
    assert.equal(new Set([...all.cases,...next.cases].map(x=>x.id)).size,3);
    assert.equal((await call('adr-cases?limit=2&q=changed&cursor='+all.nextCursor)).status,400);
    assert.equal((await call('adr-cases?limit=2&cursor='+all.nextCursor,undefined,'b')).status,400);
    assert.equal((await json('adr-cases?q=testmed&status=intake_complete')).cases[0].id,id);
    assert.equal((await json('adr-cases?medicine=TestMed&caseType=Initial&dateField=reported&from=2026-11-01&to=2026-11-01')).cases.length,1);
    assert.equal((await json('adr-cases?status=draft')).cases.length,2);
    assert.equal((await json('adr-cases?medicine=unknown')).cases.length,0);
    for(const sort of ['created','updated'])for(const direction of ['asc','desc']){
      const list=(await json(`adr-cases?sort=${sort}&direction=${direction}`)).cases;
      const keys=list.map((x:{createdAt:string;updatedAt:string;id:string})=>[x[sort==='created'?'createdAt':'updatedAt'],x.id].join('/'));
      assert.deepEqual(keys,direction==='asc'?[...keys].sort():[...keys].sort().reverse());
    }
    assert.deepEqual((await json(`adr-cases/${id}/revisions/1`)).case,original);
    assert.deepEqual((await json(`adr-cases/${id}/revisions/${historical.revision}`)).case,historical);
    assert.equal((await json(`adr-cases/${id}`)).case.revision,c.revision);
    assert.equal((await json(`adr-cases/${id}/revisions?limit=2`)).versions.length,2);
    for(const actor of ['a','b']){
      const denied=actor==='a'?foreign.id:id;
      for(const suffix of ['', '/revisions','/revisions/1'])assert.equal((await call(`adr-cases/${denied}${suffix}`,undefined,actor)).status,404);
      assert.equal((await call(`adr-cases/${denied}/revisions/1/pdf`,{},actor)).status,404);
      assert.equal((await fetch(origin+`/api/account/adr-cases/${denied}`,{method:'DELETE',headers:{
        Authorization:'Bearer '+actor,'X-APIP-Account':actor==='a'?a:b}})).status,404);
    }
    assert.equal((await call('adr-cases',undefined,'invalid')).status,401);
    assert.equal((await call(`adr-cases/${id}/lifecycle`,{})).status,403);
    assert.equal((await call(`adr-cases/${id}/deletion-requests`,{})).status,403);
    assert.equal((await call(`adr-guided/${id}/pdf`,{expectedRevision:historical.revision})).status,409);
    if(existsSync('docs/adr/templates/ADRRF_2.pdf')){
      for(const [version,narrative] of [[historical.revision,'Fictional first rash'],[c.revision,'Fictional later swelling']] as const){
        const response=await call(`adr-cases/${id}/revisions/${version}/pdf`,{});
        assert.equal(response.status,200,await response.clone().text());
        assert.equal(response.headers.get('X-APIP-Revision'),String(version));
        assert.match(response.headers.get('cache-control')!,/no-store/);
        execFileSync(process.env.APIP_PDF_PYTHON||'python',['-c',
          "import sys,io;from pypdf import PdfReader;p=PdfReader(io.BytesIO(sys.stdin.buffer.read()));assert len(p.pages)==2;assert len(p.get_fields())==147;assert p.get_fields()['Text Field8']['/V']==sys.argv[1]",narrative],
          {input:Buffer.from(await response.arrayBuffer())});
      }
      assert.deepEqual((await json(`adr-cases/${id}/revisions/${historical.revision}`)).case,historical);
    }
    revoked=true;assert.equal((await call('adr-cases')).status,401);
  }finally{await new Promise<void>(resolve=>http.close(()=>resolve()));await close();await rm(dir,{recursive:true,force:true});}
});
