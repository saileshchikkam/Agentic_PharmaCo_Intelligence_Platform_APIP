import test from 'node:test';
import assert from 'node:assert/strict';
import {pdfRuntimeFailureCode} from '../server/adr/pdf.ts';

test('missing pinned PDF imports return an actionable runtime code',()=>{
 for(const dependency of ['pypdf','reportlab']){
  const stderr=`Traceback (most recent call last):\n  File "pdf_form.py", line 4\nModuleNotFoundError: No module named '${dependency}'`;
  assert.equal(pdfRuntimeFailureCode(stderr),'PDF_RUNTIME_DEPENDENCIES_MISSING');
 }
});

test('PDF validation errors remain specific and unrelated failures stay generic',()=>{
 assert.equal(pdfRuntimeFailureCode('PDF_UNSUPPORTED_SCRIPT'),'PDF_UNSUPPORTED_SCRIPT');
 assert.equal(pdfRuntimeFailureCode('PDF_SELECT_ONE_SERIOUSNESS'),'PDF_SELECT_ONE_SERIOUSNESS');
 assert.equal(pdfRuntimeFailureCode('Permission denied'),'PDF_GENERATION_FAILED');
});
