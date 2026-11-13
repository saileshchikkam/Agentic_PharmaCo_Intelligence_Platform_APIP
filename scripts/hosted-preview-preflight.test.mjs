import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyCa,safeFailure,caHashes} from './hosted-preview-preflight.mjs';
test('separate PEM/DER identity checks reject altered trust and redact private failures',()=>{
 assert.notEqual(caHashes.pem,caHashes.der);
 assert.throws(()=>verifyCa(Buffer.from('untrusted')),/CA_FILE_CHANGED/);
 assert.equal(safeFailure(new Error('private connection information')),'PREFLIGHT_FAILED');
 assert.equal(safeFailure({code:'28P01'}),'28P01');
 if(process.env.APIP_TEST_CA_FILE)assert.doesNotThrow(()=>verifyCa(readFileSync(process.env.APIP_TEST_CA_FILE)));
});
