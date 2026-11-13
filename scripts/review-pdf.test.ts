import test from 'node:test';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
test('native professional PDF appendix preserves original form and omits private notes',{timeout:30000},async()=>{await promisify(execFile)(process.env.APIP_PDF_PYTHON||'python',['scripts/review-pdf.test.py'],{timeout:25000,windowsHide:true,maxBuffer:8192});});
