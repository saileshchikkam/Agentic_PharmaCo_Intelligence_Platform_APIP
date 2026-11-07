import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const corpus=JSON.parse(read('docs/evaluation/medassist-l7-english-v1.json'));
const results=JSON.parse(read('docs/evaluation/medassist-l7-results.json'));
const browser=JSON.parse(read('docs/evaluation/medassist-l7-browser-results.json'));
test('L7 freeze is intact and has 110 distinct descriptions and 20 journeys',()=>{
 const digest=createHash('sha256').update(read('docs/evaluation/medassist-l7-english-v1.json')).digest('hex');
 assert.equal(digest,'d107ff88fb601c1ac5581db8817a9fdc489b012387172c7e81e842f6606dc3b8');
 assert.equal(JSON.parse(read('docs/evaluation/medassist-l7-freeze.json')).sha256,digest);
 assert.equal(corpus.cases.length,110);assert.equal(corpus.journeys.length,20);
 assert.equal(new Set(corpus.cases.map((r:any)=>r.input)).size,110);
 assert.equal(new Set([...corpus.cases,...corpus.journeys].map((r:any)=>r.id)).size,130);
});
test('every frozen expectation uses a real scripted ID and literal source substring',()=>{
 const ids=new Set(['E_201','E_91','E_97','E_181','E_94','E_53','E_148','E_51','E_76']);
 for(const c of corpus.cases){
  for(const e of c.evidence){assert.ok(ids.has(e.id));assert.ok(['present','absent','unknown','contradiction'].includes(e.state));for(const span of e.spans)assert.ok(c.input.includes(span));}
  for(const key of ['clarification','abstain','confirmation','conflict'])assert.equal(typeof c[key],'boolean');
  assert.ok(c.speaker&&c.temporal&&c.intendedMeaning&&c.transition);
 }
 for(const j of corpus.journeys){assert.ok(j.texts.length&&j.flow&&j.expectations);for(const [id] of j.expected)assert.ok(ids.has(id));}
});
test('fresh single turns are not exact prior L3/L5 or development sentences',()=>{
 const normalize=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
 const prior=[JSON.parse(read('docs/evaluation/medassist-l3-english-v1.json')),JSON.parse(read('docs/evaluation/medassist-l5-english-v1.json'))];
 const strings:string[]=[];const walk=(x:any)=>{if(typeof x==='string')strings.push(normalize(x));else if(x&&typeof x==='object')Object.values(x).forEach(walk);};prior.forEach(walk);
 const development=['scripts/medassist-language-variation.test.ts','scripts/medassist-post-l6-coverage.test.ts'].map(read).join('\n').toLowerCase();
 for(const c of corpus.cases){assert.ok(!strings.includes(normalize(c.input)),c.id);assert.ok(!development.includes(c.input.toLowerCase()),c.id);}
});
test('results account for every original frozen case without relabelling',()=>{
 assert.equal(results.rows.length,110);assert.equal(results.hash,'d107ff88fb601c1ac5581db8817a9fdc489b012387172c7e81e842f6606dc3b8');
 for(const [i,r] of results.rows.entries()){const c=corpus.cases[i];for(const key of Object.keys(c))assert.deepEqual(r[key],c[key]);assert.ok(Array.isArray(r.issues));}
 assert.equal(results.metrics.fullCases.numerator,results.rows.filter((r:any)=>!r.issues.length).length);
 assert.equal(results.execution.skipped,0);assert.equal(results.execution.blocked,0);
});
test('observation totals reconcile correct, wrong, missing and unexpected counts',()=>{
 const m=results.metrics;
 assert.equal(m.expectedIdStateRecall.numerator+m.wrongStates.numerator+m.unexpectedIds.numerator,m.evidenceProvenance.denominator);
 assert.equal(m.expectedIdStateRecall.numerator+m.wrongStates.numerator+m.missingObservations.numerator,m.expectedIdStateRecall.denominator);
 for(const value of Object.values(m) as any[])assert.ok(value.numerator>=0&&value.numerator<=value.denominator);
});
test('all browser journeys and export audits retain failures and literal source provenance',()=>{
 assert.equal(browser.length,20);
 for(const j of corpus.journeys){const r=browser.find((x:any)=>x.id===j.id);assert.ok(r,j.id);assert.equal(typeof r.pass,'boolean');assert.ok(r.checks);
  if(r.evidence){const set=(a:any[])=>JSON.stringify([...a].sort((a,b)=>a[0].localeCompare(b[0])));
   assert.equal(r.checks.expectedExport,set(r.evidence.items.map((i:any)=>[i.evidence_id,i.value]))===set(j.expected));
   for(const source of r.records)for(const a of source.annotations)assert.equal(source.text.slice(a.start,a.end),a.quote);
   assert.equal(r.evidence.model_a_inference,false);assert.equal(r.evidence.model_b_status,'not_enabled');
  }
  if(r.manualAdjudication)assert.ok(r.rerunReason&&r.uiSnapshot);
 }
 assert.ok(browser.some((r:any)=>!r.pass),'Failures must remain visible');
 assert.equal(browser.find((r:any)=>r.id==='L7-M10').usage,'blocked_unresolved_conflict');
 assert.equal(browser.find((r:any)=>r.id==='L7-M09').evidence.items.find((i:any)=>i.evidence_id==='E_201').status,'unknown');
});
test('L7 has not modified application, model, existing test or frozen evaluation files',()=>{
 const paths=['src','server','models','scripts/medassist-l3-evaluate.ts','scripts/medassist-l5-evaluate.ts','scripts/medassist-post-l6-coverage.test.ts','docs/evaluation/medassist-l3-english-v1.json','docs/evaluation/medassist-l5-english-v1.json'];
 // Once committed, audit the evaluation receipt rather than blocking authorized future implementation.
 const receipt=execFileSync('git',['log','-1','--format=%H','--','docs/evaluation/medassist-l7-freeze.json'],{encoding:'utf8'}).trim();
 const diff=execFileSync('git',['diff','60c53c3ae7590205f7e9d4aab948f1d0a8a67efe',...(receipt?[receipt]:[]),'--',...paths],{encoding:'utf8'});
 assert.equal(diff,'');
});
