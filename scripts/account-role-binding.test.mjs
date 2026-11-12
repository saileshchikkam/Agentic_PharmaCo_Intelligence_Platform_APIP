import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
try {
 await db.exec(`create schema auth;create schema apip_identity;create role anon;create role authenticated;create role apip_adr_writer;grant usage on schema apip_identity to apip_adr_writer;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);`);
 await db.exec(await readFile('supabase/migrations/20261112155338_account_portal_binding.sql','utf8'));
 const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 await db.query(`insert into auth.users values($1,$2),($3,$4)`,[a,JSON.stringify({apip_registration_role:'PATIENT'}),b,JSON.stringify({apip_registration_role:'SPECIALIST'})]);
 await db.query(`update auth.users set raw_user_meta_data=$1 where id=$2`,[JSON.stringify({apip_registration_role:'SPECIALIST'}),a]);
 assert.equal((await db.query(`select role from apip_identity.account_roles where subject=$1`,[a])).rows[0].role,'PATIENT');
 await db.exec(`set role apip_adr_writer;begin;select set_config('request.jwt.claim.sub','${a}',true);`);
 assert.deepEqual((await db.query('select role from apip_identity.account_roles')).rows,[{role:'PATIENT'}]);
 await db.exec('commit');
 assert.equal((await db.query('select * from apip_identity.account_roles')).rows.length,0);
 await assert.rejects(db.query(`update apip_identity.account_roles set role='SPECIALIST'`));
 await assert.rejects(db.query(`select apip_identity.bind_registration_role()`));
 await db.exec('reset role; set role anon');
 await assert.rejects(db.query('select * from apip_identity.account_roles'));
 await assert.rejects(db.query('select apip_identity.bind_registration_role()'));
 await db.exec('reset role; set role authenticated');
 await assert.rejects(db.query('select * from apip_identity.account_roles'));
 await assert.rejects(db.query('select apip_identity.bind_registration_role()'));
 console.log('PASS registration binding, metadata changes ignored, owner RLS, transaction cleanup, writer mutation and execution denial');
} finally {await db.close();}
