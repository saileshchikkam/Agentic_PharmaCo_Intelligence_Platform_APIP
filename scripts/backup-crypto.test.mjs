import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {Readable,Writable} from 'node:stream';import {randomBytes,createHash} from 'node:crypto';import {encryptStream,decryptTo} from '../database/operations/backup-crypto.mjs';
test('backup authenticated encryption roundtrips without plaintext dump and rejects wrong key/tampering',async()=>{
 const root=await mkdtemp(join(tmpdir(),'apip-crypto-test-'));
 try{const path=join(root,'fixture.aes'),data=randomBytes(100000),password=randomBytes(32).toString('base64url');const metadata=await encryptStream(Readable.from([data]),path,password);assert.equal(metadata.plaintextSha256,createHash('sha256').update(data).digest('hex'));
 const chunks=[];await decryptTo(path,password,new Writable({write(c,e,d){chunks.push(c);d();}}));assert.deepEqual(Buffer.concat(chunks),data);
 await assert.rejects(decryptTo(path,password+'wrong',new Writable({write(c,e,d){d();}})));
 const ciphertext=await readFile(path);assert(!ciphertext.includes(data));ciphertext[100]^=1;await writeFile(path,ciphertext);await assert.rejects(decryptTo(path,password,new Writable({write(c,e,d){d();}})));
 }finally{await rm(root,{recursive:true,force:true});}
});
