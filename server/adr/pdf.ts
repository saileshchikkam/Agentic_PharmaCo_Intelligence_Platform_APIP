import {existsSync} from 'node:fs';
import {execFile, spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {questions,type GuidedCase} from '../../src/features/adr/guided/domain';

export function pdfRuntimeFailureCode(stderr:string):string{
 if(/ModuleNotFoundError:\s*No module named ['\"](?:pypdf|reportlab)['\"]/.test(stderr))return 'PDF_RUNTIME_DEPENDENCIES_MISSING';
 return ['PDF_UNSUPPORTED_SCRIPT','PDF_SELECT_ONE_SERIOUSNESS','TEMPLATE_CHANGED'].find(code=>stderr.includes(code))??'PDF_GENERATION_FAILED';
}

export function generateOfficialPdf(c:GuidedCase):Promise<Buffer>{
 if(!existsSync(resolve('docs/adr/templates/ADRRF_2.pdf')))return Promise.reject(Error('PDF_TEMPLATE_MISSING'));
 return new Promise((resolveResult,reject)=>{
  const child=spawn(process.env.APIP_PDF_PYTHON||'python',[resolve('server/adr/pdf_form.py')],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  const chunks:Buffer[]=[];let size=0,error='';
  let failure: string | undefined;
  const timer=setTimeout(()=>{failure ??= 'PDF_TIMEOUT';child.kill('SIGKILL');},20000);
  child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>10*1024*1024){failure ??= 'PDF_TOO_LARGE';child.kill('SIGKILL');}else chunks.push(chunk);});
  child.stderr.on('data',chunk=>{error=(error+chunk.toString()).slice(-4096);});
  child.on('error',()=>{clearTimeout(timer);reject(Error('PDF_RUNTIME_UNAVAILABLE'));});
  child.on('close',code=>{clearTimeout(timer);if(failure)reject(Error(failure));else if(code!==0)reject(Error(pdfRuntimeFailureCode(error)));else resolveResult(Buffer.concat(chunks));});
  child.stdin.on('error',()=>{});
  child.stdin.end(JSON.stringify({...c,fieldLabels:Object.fromEntries(questions(c).map(f=>[f.key,f.label]))}));
 });
}

export function createPdfService() {
  let busy = false;
  return {
    available: () => existsSync(resolve('docs/adr/templates/ADRRF_2.pdf')),
    async generate(c: GuidedCase) {
      if (busy) throw Error('PDF_BUSY');
      busy = true;
      try { return await generateOfficialPdf(c); }
      finally { busy = false; }
    },
  };
}

export function probePdf(): Promise<boolean> {
  return new Promise(resolveResult => {
    execFile(process.env.APIP_PDF_PYTHON || 'python', [resolve('server/adr/pdf_form.py'), '--check'],
      { timeout: 5000, windowsHide: true, maxBuffer: 4096 }, error => resolveResult(!error));
  });
}
