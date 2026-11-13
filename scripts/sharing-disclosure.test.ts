import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareDisclosure} from '../server/sharing/disclosure';
import type {GuidedCase,Value} from '../src/features/adr/guided/domain';
const v=(value:string):Value=>({state:'provided',value,confirmedAt:'2026-11-08T00:00:00Z',source:'manual',statementId:'statement'});
const c:GuidedCase={schemaVersion:1,id:'fictional-case',revision:3,fictionalOnly:true,updatedAt:'2026-11-08T00:00:00Z',values:{caseType:v('Initial'),initials:v('FS'),reaction:v('Fictional rash'),reporterName:v('Fictional Reporter'),'med.m.name':v('Fictional medicine'),email:v('fictional@example.test')},medications:[{id:'m',kind:'suspect'}],statements:[{id:'statement',text:'Fictional original statement',at:'2026-11-08T00:00:00Z'}],proposals:[{id:'proposal',key:'reaction',value:'unconfirmed private proposal',quote:'quote',conflict:false}],providerStatus:'manual'};
test('disclosure binds immutable revision, highlights contact data and excludes extraction proposals',()=>{
 const d=prepareDisclosure(c);assert.equal(d.revision,3);assert(d.fields.find(f=>f.key==='email')?.personal);assert(!JSON.stringify(d).includes('unconfirmed private proposal'));
 assert.deepEqual(d.statements,['Fictional original statement']);assert.equal(d.digest,prepareDisclosure(structuredClone(c)).digest);
 assert.notEqual(d.digest,prepareDisclosure({...c,revision:4}).digest);
 assert.notEqual(d.digest,prepareDisclosure({...c,values:{...c.values,email:v('changed@example.test')}}).digest);
});
test('incomplete, unconfirmed, unknown-schema and reserved-field payloads fail closed',()=>{
 assert.throws(()=>prepareDisclosure({...c,revision:0}),/SAVED_FICTIONAL/);
 assert.throws(()=>prepareDisclosure({...c,values:{}}),/INTAKE_INCOMPLETE/);
 assert.throws(()=>prepareDisclosure({...c,values:{...c.values,email:{...v('a@example.test'),confirmedAt:''}}}),/DISCLOSURE_MISMATCH/);
 assert.throws(()=>prepareDisclosure({...c,values:{...c.values,unexpected:v('hidden')}}),/DISCLOSURE_MISMATCH/);
 assert.throws(()=>prepareDisclosure({...c,values:{...c.values,registration:v('reserved')}}),/RESERVED_FIELD/);
});
