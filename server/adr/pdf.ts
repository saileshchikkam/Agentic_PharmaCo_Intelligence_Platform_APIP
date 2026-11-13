import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {questions,type GuidedCase} from '../../src/features/adr/guided/domain';
export function generateOfficialPdf(c:GuidedCase):Promise<Buffer>{
 if(!existsSync(resolve('docs/adr/templates/ADRRF_2.pdf')))return Promise.reject(Error('PDF_TEMPLATE_MISSING'));
 return new Promise((resolveResult,reject)=>{
  const child=spawn(process.env.APIP_PDF_PYTHON||'python',[resolve('server/adr/pdf_form.py')],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  const chunks:Buffer[]=[];let size=0,error='';
  const timer=setTimeout(()=>{child.kill();reject(Error('PDF_TIMEOUT'));},20000);
  child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>10*1024*1024){child.kill();reject(Error('PDF_TOO_LARGE'));}else chunks.push(chunk);});
  child.stderr.on('data',chunk=>{error=(error+chunk.toString()).slice(0,200);});
  child.on('error',()=>{clearTimeout(timer);reject(Error('PDF_RUNTIME_UNAVAILABLE'));});
  child.on('close',code=>{clearTimeout(timer);if(code!==0)reject(Error(['PDF_UNSUPPORTED_SCRIPT','PDF_SELECT_ONE_SERIOUSNESS','TEMPLATE_CHANGED'].includes(error)?error:'PDF_GENERATION_FAILED'));else resolveResult(Buffer.concat(chunks));});
  child.stdin.on('error',()=>{});
  child.stdin.end(JSON.stringify({...c,fieldLabels:Object.fromEntries(questions(c).map(f=>[f.key,f.label]))}));
 });
}
