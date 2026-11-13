import test from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';
test('non-superuser reset drains deferred events before restoring immutable triggers',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role fixture_operator nologin nosuperuser nobypassrls;create schema fixture authorization fixture_operator;set role fixture_operator;
 create table fixture.revisions(id int primary key);create table fixture.cases(id int primary key,revision int references fixture.revisions(id) deferrable initially deferred);
 create function fixture.immutable() returns trigger language plpgsql as $$begin raise exception 'IMMUTABLE';end$$;
 create trigger history_immutable before delete or update on fixture.revisions for each row execute function fixture.immutable();
 insert into fixture.revisions values(1);insert into fixture.cases values(1,1);`);
 const deletes=`alter table fixture.revisions disable trigger history_immutable;set constraints all deferred;delete from fixture.revisions;delete from fixture.cases;`;
 await db.exec('begin');await db.exec(deletes);await assert.rejects(db.exec('alter table fixture.revisions enable trigger history_immutable'),e=>e.code==='55006');await db.exec('rollback');
 assert.equal((await db.query('select count(*)::int n from fixture.revisions')).rows[0].n,1);
 await db.exec('begin');await db.exec(deletes);await db.exec('set constraints all immediate;alter table fixture.revisions enable trigger history_immutable;');assert.equal((await db.query('select count(*)::int n from fixture.revisions')).rows[0].n,0);await db.exec('rollback');
 assert.equal((await db.query('select count(*)::int n from fixture.revisions')).rows[0].n,1);await assert.rejects(db.exec('delete from fixture.revisions'),/IMMUTABLE/);
 console.log('Original 55006 reproduced; revised order succeeds; rollback and immutable protection preserved.');
 }finally{await db.close();}
});
