import {spawn} from 'node:child_process';import {resolve} from 'node:path';
export function generateReviewPdf(original:Buffer,source:unknown):Promise<Buffer>{return new Promise((resolveResult,reject)=>{
 const child=spawn(process.env.APIP_PDF_PYTHON||'python',[resolve('server/review/pdf_review.py')],{stdio:['pipe','pipe','pipe'],windowsHide:true});const chunks:Buffer[]=[];let size=0,failed=false,error='';
 const timer=setTimeout(()=>{failed=true;child.kill();},20000);
 child.stdout.on('data',(b:Buffer)=>{size+=b.length;if(size>10485760){failed=true;child.kill();}else chunks.push(b);});child.stderr.on('data',b=>{error=(error+b.toString()).slice(-4096);});child.stdin.on('error',()=>{});
 child.on('error',()=>{clearTimeout(timer);reject(Error('PDF_RUNTIME_UNAVAILABLE'));});child.on('close',code=>{clearTimeout(timer);if(code!==0||failed)reject(Error(error.includes('PDF_UNSUPPORTED_SCRIPT')?'PDF_UNSUPPORTED_SCRIPT':'PDF_GENERATION_FAILED'));else resolveResult(Buffer.concat(chunks));});
 child.stdin.end(JSON.stringify({original:original.toString('base64'),source}));
});}
