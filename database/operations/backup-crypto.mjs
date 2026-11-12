import {createCipheriv,createDecipheriv,randomBytes,scryptSync,createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {open,stat} from 'node:fs/promises';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const magic=Buffer.from('APIPBK01');
export async function encryptStream(source,path,password){
 const salt=randomBytes(32),iv=randomBytes(12),header=Buffer.concat([magic,salt,iv]);
 const cipher=createCipheriv('aes-256-gcm',scryptSync(password,salt,32),iv);cipher.setAAD(header);
 const hash=createHash('sha256');let size=0;
 const measure=new Transform({transform(chunk,_encoding,done){hash.update(chunk);size+=chunk.length;done(null,chunk);}});
 const target=createWriteStream(path,{flags:'wx'});target.write(header);
 await pipeline(source,measure,cipher,target,{end:false});
 target.end(cipher.getAuthTag());await new Promise((resolve,reject)=>{target.once('finish',resolve);target.once('error',reject);});
 return {plaintextSha256:hash.digest('hex'),plaintextBytes:size};
}
export async function decryptTo(path,password,target){
 const file=await open(path,'r'),header=Buffer.alloc(52),tag=Buffer.alloc(16),size=(await file.stat()).size;
 try {if(size<68)throw Error('BACKUP_TRUNCATED');await file.read(header,0,52,0);await file.read(tag,0,16,size-16);}finally{await file.close();}
 if(!header.subarray(0,8).equals(magic))throw Error('BACKUP_FORMAT_INVALID');
 const cipher=createDecipheriv('aes-256-gcm',scryptSync(password,header.subarray(8,40),32),header.subarray(40,52));cipher.setAAD(header);cipher.setAuthTag(tag);
 // Callers must authenticate first to a bounded memory sink or verifier before trusting output.
 await pipeline(createReadStream(path,{start:52,end:size-17}),cipher,target);
}
