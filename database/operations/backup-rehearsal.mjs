import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,stat,rm,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable,Writable} from 'node:stream';
import {createHash,randomBytes} from 'node:crypto';
import net from 'node:net';
import tls from 'node:tls';
import {probePostgresTls} from './backup-tls.mjs';
import postgres from 'postgres';
import {encryptStream,decryptTo} from './backup-crypto.mjs';
import {verifyCa} from '../../scripts/hosted-preview-preflight.mjs';
const project='kstxwoitiistmvivwixd',root=resolve(process.env.APIP_BACKUP_DIR||''),bin=process.env.APIP_PG_BIN;
let stage='preflight',source,fixtureStarted=false,fixturePort,fixturePassword,sourceHostnameVerified=false;
const password=process.env.APIP_BACKUP_RECOVERY_PASSWORD;
const base=resolve(process.env.APIP_BACKUP_PRIVATE_ROOT||'');
if(!bin||!password||password.length<16||!root.startsWith(base+'\\')||root===base||!/^aws-\d+-ap-south-1\.pooler\.supabase\.com$/.test(process.env.APIP_BACKUP_HOST||'')||!process.env.APIP_BACKUP_OPERATOR_PASSWORD)throw Error('PRIVATE_CONFIGURATION_REQUIRED');
const ca=await readFile(process.env.NODE_EXTRA_CA_CERTS);verifyCa(ca);
const sourceEnv={...process.env,PGHOST:process.env.APIP_BACKUP_HOST,PGPORT:'5432',PGUSER:'postgres.'+project,PGDATABASE:'postgres',PGPASSWORD:process.env.APIP_BACKUP_OPERATOR_PASSWORD,PGSSLMODE:'verify-full',PGSSLROOTCERT:process.env.NODE_EXTRA_CA_CERTS,PGCONNECT_TIMEOUT:'10'};
for(const name of ['APIP_BACKUP_OPERATOR_PASSWORD','APIP_BACKUP_RECOVERY_PASSWORD','APIP_ADR_DATABASE_URL'])delete sourceEnv[name];
const fixture=join(root,'fixture-cluster'),MAX=256*1024*1024;
const exe=name=>join(bin,name+'.exe');
function execute(name,args,env,input){return new Promise((resolveResult,reject)=>{
 const child=spawn(exe(name),args,{env,windowsHide:true,stdio:['pipe','pipe','pipe']});const chunks=[];let size=0;
 child.stdout.on('data',chunk=>{size+=chunk.length;if(size>MAX){child.kill();reject(Error('OUTPUT_LIMIT'));}else chunks.push(chunk);});
 child.stderr.on('data',()=>{});child.on('error',()=>reject(Error('LOCAL_TOOL_START_FAILED')));
 child.on(name==='pg_ctl'?'exit':'close',code=>{if(name==='pg_ctl'){child.stdout.destroy();child.stderr.destroy();child.stdin.destroy();}code===0?resolveResult(Buffer.concat(chunks)):reject(Error(name.toUpperCase()+'_EXIT_'+code));});
 child.stdin.on('error',()=>{});child.stdin.end(input);
 });}
async function decrypted(name){const chunks=[];let size=0;await decryptTo(join(root,name),password,new Writable({write(chunk,_encoding,done){size+=chunk.length;if(size>MAX){done(Error('RESTORE_LIMIT'));return;}chunks.push(chunk);done();}}));return Buffer.concat(chunks);}
async function encrypted(name,bytes){return encryptStream(Readable.from([bytes]),join(root,name),password);}
function fixtureEnv(){return {...sourceEnv,PGHOST:'127.0.0.1',PGPORT:String(fixturePort),PGUSER:'apip_restore_operator',PGDATABASE:'postgres',PGPASSWORD:fixturePassword,PGSSLMODE:'disable',PGTZ:'UTC'};}
async function localJson(query){return JSON.parse((await execute('psql',['-X','-A','-t','-v','ON_ERROR_STOP=1','-c',query],fixtureEnv())).toString());}
const hashQuery=table=>`select count(*)::int as count,md5(coalesce(string_agg(h,'' order by h),'')) as digest from (select md5(to_jsonb(t)::text) h from ${table} t) x`;
try{
 await mkdir(root,{recursive:false});
 stage='verified-client-tls';const tlsEvidence=await probePostgresTls(sourceEnv.PGHOST,5432,ca);
 source=postgres({host:sourceEnv.PGHOST,port:5432,username:sourceEnv.PGUSER,password:sourceEnv.PGPASSWORD,database:'postgres',max:1,prepare:false,connect_timeout:10,ssl:{rejectUnauthorized:true,ca:ca.toString(),minVersion:'TLSv1.2',checkServerIdentity:(host,cert)=>{const error=tls.checkServerIdentity(host,cert);if(!error&&host===sourceEnv.PGHOST)sourceHostnameVerified=true;return error||(host!==sourceEnv.PGHOST?Error('TLS_HOSTNAME_MISMATCH'):undefined);}},onnotice:()=>{}});
 stage='source-identity';const [identity]=await source`select current_user as role,version() as version,(select ssl from pg_stat_ssl where pid=pg_backend_pid()) as tls`;
 await writeFile(join(base,'connection-diagnostic.json'),JSON.stringify({role:identity.role,upstreamDatabaseTls:identity.tls,clientCertificateAndHostnameVerified:sourceHostnameVerified,tlsEvidence}));
 if(identity.role!=='postgres')throw Error('OPERATOR_IDENTITY_INVALID');
 if(!sourceHostnameVerified||!tlsEvidence.authorized)throw Error('CLIENT_TLS_VERIFICATION_FAILED');
 const summary={project,startedAt:new Date().toISOString(),source:{role:identity.role,tls:true,clientCertificateAndHostnameVerified:sourceHostnameVerified,upstreamDatabaseTls:identity.tls,tlsEvidence},tables:[],backupFiles:{},checks:{},limitations:['Auth runtime/session usability is not proved by PostgreSQL row restoration.','Existing access-token bytes cannot be recalled.','An off-device copy of the encrypted archive and owner recovery passphrase is required for laptop-loss protection.']};
 stage='consistent-export';await source.begin(async tx=>{
  await tx`set transaction isolation level repeatable read read only`;
  const [{snapshot}]=await tx`select pg_export_snapshot() as snapshot`;
  const tables=await tx`select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and (n.nspname in ('auth','public','storage','supabase_migrations') or n.nspname like 'apip_%') order by 1,2`;
  for(const t of tables){const name='"'+t.nspname+'"."'+t.relname+'"';const [counts]=await tx.unsafe(hashQuery(name));summary.tables.push({schema:t.nspname,table:t.relname,...counts});}
  const users=await tx`select id,email,email_confirmed_at,created_at from auth.users order by id`;
  const constraints=await tx`select conrelid::regclass::text as child,confrelid::regclass::text as parent,conname,pg_get_constraintdef(oid) as definition from pg_constraint where contype='f' and (connamespace in (select oid from pg_namespace where nspname like 'apip_%' or nspname in ('auth','storage','public'))) order by 1,3`;
  const triggers=await tx`select n.nspname as schema,c.relname as table,t.tgname as name,pg_get_triggerdef(t.oid) as definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname like 'apip_%' or n.nspname in ('auth','public','storage')) order by 1,2,3`;
  const objects=await tx`select count(*)::int as count from storage.objects`;if(objects[0].count!==0)throw Error('STORAGE_PAYLOAD_BACKUP_REQUIRED');
  summary.backupFiles['inventory.aes']=await encrypted('inventory.aes',Buffer.from(JSON.stringify({summary,users,constraints,triggers})));
  const globals=await execute('pg_dumpall',['--roles-only','--no-role-passwords','--no-password'],sourceEnv);
  summary.backupFiles['roles.aes']=await encrypted('roles.aes',globals);
  const args=['--format=custom','--no-password','--lock-wait-timeout=10000','--snapshot='+snapshot];
  for(const schema of ['auth','public','storage','extensions','supabase_migrations',...new Set(tables.filter(t=>t.nspname.startsWith('apip_')).map(t=>t.nspname))])args.push('--schema='+schema);
  const dump=spawn(exe('pg_dump'),args,{env:sourceEnv,windowsHide:true,stdio:['ignore','pipe','pipe']});dump.stderr.on('data',()=>{});
  const done=new Promise((resolveDone,reject)=>{dump.on('error',()=>reject(Error('PG_DUMP_START_FAILED')));dump.on('close',code=>code===0?resolveDone():reject(Error('PG_DUMP_EXIT_'+code)));});
  summary.backupFiles['database.aes']=await encryptStream(dump.stdout,join(root,'database.aes'),password);await done;
 });
 stage='offline-restore';await source.end({timeout:5});source=null;
 const offlineEnv={...process.env};delete offlineEnv.APIP_BACKUP_OPERATOR_PASSWORD;delete offlineEnv.APIP_ADR_DATABASE_URL;
 await new Promise((yes,no)=>{const child=spawn(process.execPath,[fileURLToPath(new URL('./restore-attempt.mjs',import.meta.url))],{env:offlineEnv,stdio:'inherit',windowsHide:true});child.on('error',()=>no(Error('OFFLINE_RESTORE_START_FAILED')));child.on('exit',code=>code===0?yes():no(Error('OFFLINE_RESTORE_FAILED')));});

}catch(error){const code=/^[A-Z0-9_]{2,64}$/.test(error.code??'')?error.code:/^[A-Z0-9_]{2,64}$/.test(error.message)?error.message:'SAFE_DIAGNOSTIC_REQUIRED';if(code!=='OFFLINE_RESTORE_FAILED')await writeFile(join(base,'rehearsal-status.json'),JSON.stringify({stage,code,complete:false}));console.error('Backup rehearsal stopped at '+stage+': '+code);process.exitCode=1;}
finally{
 if(source)await source.end({timeout:5}).catch(()=>{});
 if(fixtureStarted){await execute('pg_ctl',['-D',fixture,'-m','fast','-w','stop'],{...process.env}).catch(()=>{process.exitCode=1;});}
 delete process.env.APIP_BACKUP_OPERATOR_PASSWORD;delete process.env.APIP_BACKUP_RECOVERY_PASSWORD;
}
