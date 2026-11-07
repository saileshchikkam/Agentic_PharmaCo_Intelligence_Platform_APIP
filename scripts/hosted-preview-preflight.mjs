import {readFileSync,existsSync} from 'node:fs';
import {createHash,X509Certificate} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import net from 'node:net';
import postgres from 'postgres';

export const caHashes={pem:'700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7',der:'807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa'};
export function verifyCa(bytes){
 const hash=value=>createHash('sha256').update(value).digest('hex');
 if(hash(bytes)!==caHashes.pem)throw Error('CA_FILE_CHANGED');
 const certificate=new X509Certificate(bytes);
 if(hash(certificate.raw)!==caHashes.der||!certificate.ca||Date.parse(certificate.validTo)<Date.now())throw Error('CA_IDENTITY_INVALID');
}
export function safeFailure(error){return /^[A-Z0-9_]{2,60}$/.test(error?.code??'')?error.code:/^[A-Z0-9_]{2,60}$/.test(error?.message??'')?error.message:'PREFLIGHT_FAILED';}
async function freePort(port){
 await new Promise((resolveResult,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error('PORT_OCCUPIED')));server.listen(port,'127.0.0.1',()=>server.close(resolveResult));});
}
export async function preflight({prerequisitesOnly=false}={}){
 if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('INSECURE_TLS_CONFIGURATION');
 if(process.env.APIP_ACCOUNT_MODE!=='cloud')throw Error('CLOUD_MODE_REQUIRED');
 const ca=process.env.NODE_EXTRA_CA_CERTS;if(!ca)throw Error('TRUSTED_CA_REQUIRED');verifyCa(readFileSync(ca));
 const entry=resolve(process.env.APIP_VERIFIED_SERVER_ENTRY||'dist/server.cjs');
 if(!existsSync(entry))throw Error('SERVER_BUILD_MISSING');
 await freePort(Number(process.env.APIP_PORT||3301));
 execFileSync(process.env.APIP_PDF_PYTHON||'python',[resolve('server/adr/pdf_form.py'),'--check'],{stdio:'pipe',windowsHide:true,timeout:10000});
 const template=readFileSync(resolve('docs/adr/templates/ADRRF_2.pdf'));
 if(createHash('sha256').update(template).digest('hex')!=='40af4962d6dd65ce538ff4791805b0632085159623c5a4beeb755442f6c0ed0b')throw Error('PDF_TEMPLATE_CHANGED');
 console.log('PASS certificate integrity, cloud mode, free port, server build and original PDF runtime.');
 if(prerequisitesOnly)return;
 const uri=process.env.APIP_ADR_DATABASE_URL;if(!uri)throw Error('WRITER_CONNECTION_REQUIRED');
 const parsed=new URL(uri),url=new URL(process.env.APIP_SUPABASE_URL||'');
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw Error('SUPABASE_PROJECT_REQUIRED');
 if(!/^aws-[0-9]+-ap-south-1\.pooler\.supabase\.com$/.test(parsed.hostname)||parsed.port!=='6543'||decodeURIComponent(parsed.username)!=='apip_adr_writer.'+url.hostname.split('.')[0]||parsed.search)throw Error('RESTRICTED_TRANSACTION_POOLER_REQUIRED');
 const sql=postgres(uri,{max:1,prepare:false,connect_timeout:8,ssl:{rejectUnauthorized:true},onnotice:()=>{}});
 try{const [row]=await sql`select current_user='apip_adr_writer' as writer,rolsuper or rolbypassrls as elevated from pg_roles where rolname=current_user`;
  if(!row?.writer||row.elevated)throw Error('RESTRICTED_WRITER_REQUIRED');
 }finally{await sql.end({timeout:2});}
 const auth=await fetch(new URL('/auth/v1/health',url),{headers:{apikey:process.env.APIP_SUPABASE_PUBLISHABLE_KEY||''},signal:AbortSignal.timeout(10000)});
 if(!auth.ok)throw Error('AUTH_NOT_READY');
 console.log('PASS certificate-verified restricted writer and hosted Auth readiness.');
}
async function main(){
 try{
  await preflight({prerequisitesOnly:process.argv.includes('--prerequisites')});
  if(!process.argv.includes('--launch'))return;
  const child=spawn(process.execPath,[resolve(process.env.APIP_VERIFIED_SERVER_ENTRY||'dist/server.cjs')],{stdio:'inherit',windowsHide:true});
  let exited=false;child.on('exit',code=>{exited=true;process.exitCode=code??1;});child.on('error',()=>{exited=true;process.exitCode=1;});
  const origin='http://127.0.0.1:'+Number(process.env.APIP_PORT||3301);
  for(let attempt=0;attempt<30&&!exited;attempt++){
   await new Promise(r=>setTimeout(r,1000));
   try{const response=await fetch(origin+'/api/ready',{signal:AbortSignal.timeout(1500)});const result=await response.json();
    if(response.ok&&result.ready){console.log('PASS application readiness: '+origin+'/#/sign-in/specialist');return;}
   }catch{/* bounded startup wait, no response payload logging */}
  }
  if(!exited)child.kill();throw Error('APPLICATION_NOT_READY');
 }catch(error){console.error('Hosted preflight stopped: '+safeFailure(error));process.exitCode=1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
