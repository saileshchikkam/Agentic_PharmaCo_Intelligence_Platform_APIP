import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {access,unlink} from 'node:fs/promises';
const root=resolve(process.env.APIP_BACKUP_PRIVATE_ROOT||'');
const signal=join(root,'resume-offline.request');
await unlink(signal).catch(()=>{});
while(true){
 const code=await new Promise((yes,no)=>{const p=spawn(process.execPath,[fileURLToPath(new URL('./restore-attempt.mjs',import.meta.url))],{env:process.env,stdio:'inherit',windowsHide:true});p.on('error',no);p.on('exit',yes);});
 if(code===0)break;
 console.log('Offline helper paused. Keep open. Engineering can resume after a targeted correction; no password re-entry.');
 while(true){await new Promise(r=>setTimeout(r,1000));try{await access(signal);await unlink(signal);break;}catch{}}
}
delete process.env.APIP_BACKUP_RECOVERY_PASSWORD;
