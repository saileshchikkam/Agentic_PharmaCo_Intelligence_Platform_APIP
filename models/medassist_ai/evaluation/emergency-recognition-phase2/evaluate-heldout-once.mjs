import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const base=resolve('models/medassist_ai/evaluation/emergency-recognition-phase2');
const sha=(x)=>createHash('sha256').update(x).digest('hex');
const write=(name,value)=>writeFileSync(resolve(base,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const goldBytes=readFileSync(resolve(base,'heldout-gold.json'));
const freeze=JSON.parse(readFileSync(resolve(base,'independent-gold-freeze.json'),'utf8'));
if(sha(goldBytes)!==freeze.gold_sha256) throw Error('Frozen gold hash mismatch');
if(!process.env.MEDASSIST_TEST_PYTHON||!process.env.MEDASSIST_SAFETY_MODULE) throw Error('Supply private local Python runtime and safety module');
if(!process.env.MEDASSIST_IMPLEMENTATION_FREEZE_SHA256) throw Error('Supply implementation-freeze file hash after explicit implementation freeze');
const implFile=resolve(base,'implementation-freeze.json');
if(sha(readFileSync(implFile))!==process.env.MEDASSIST_IMPLEMENTATION_FREEZE_SHA256) throw Error('Implementation manifest hash mismatch');
const manifest=JSON.parse(readFileSync(implFile,'utf8'));
for(const [file,expectedHash] of Object.entries(manifest.files)) if(sha(readFileSync(resolve(file)))!==expectedHash) throw Error('Frozen implementation source mismatch: '+file);
const gold=JSON.parse(goldBytes);
write('independent-run-start.json',{started_at_utc:new Date().toISOString(),gold_sha256:sha(goldBytes),implementation_manifest_sha256:sha(readFileSync(implFile)),policy:'One final evaluation per engine. No rerun, tuning, gold or result changes. Execution errors remain evidence.'});
const {evaluateStatement}=await import('../../../../src/features/medassist-safety/safety.ts');
const ts=[];
for(const c of gold.cases){try{ts.push({id:c.id,decision:evaluateStatement(c.text)});}catch(e){ts.push({id:c.id,error:String(e)});}}
write('independent-typescript-raw.json',{engine:'TypeScript evaluateStatement',gold_sha256:sha(goldBytes),results:ts});
const code=`import sys,json,importlib\nsys.path.insert(0,'models')\nm=importlib.import_module(sys.argv[1])\nengine=m.ProvisionalSafety()\nresults=[]\nfor c in json.load(sys.stdin):\n try: results.append({'id':c['id'],'decision':engine.check(c['text'])})\n except Exception as e: results.append({'id':c['id'],'error':str(e)})\nprint(json.dumps(results))\n`;
let py;
try{py=JSON.parse(execFileSync(process.env.MEDASSIST_TEST_PYTHON,['-c',code,process.env.MEDASSIST_SAFETY_MODULE],{input:JSON.stringify(gold.cases),encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}}));}
catch(e){write('independent-python-process-failure.json',{error:String(e),stdout:String(e.stdout||''),stderr:String(e.stderr||'')});throw e;}
write('independent-python-raw.json',{engine:'Python ProvisionalSafety.check',gold_sha256:sha(goldBytes),results:py});
const statuses=['escalate','clarify','not_assessed'];
function metrics(rows){
 const m=Object.fromEntries(statuses.map(g=>[g,Object.fromEntries(statuses.map(p=>[p,0]))]));
 let tp=0,fp=0,fn=0,tn=0;const errors=[];
 for(const r of rows){if(statuses.includes(r.predicted))m[r.expected][r.predicted]++;else errors.push(r.id);if(r.expected==='escalate'){if(r.predicted==='escalate')tp++;else fn++;}else if(r.expected==='not_assessed'){if(r.predicted==='escalate')fp++;else if(statuses.includes(r.predicted))tn++;}}
 return {case_count:rows.length,confusion_3x3:m,binary:{TP:tp,FP:fp,FN:fn,TN:tn,denominator:tp+fp+fn+tn,emergency_support:tp+fn,negative_support:fp+tn,excluded_gold_clarify:rows.filter(r=>r.expected==='clarify').length,recall:tp+fn?tp/(tp+fn):null,precision:tp+fp?tp/(tp+fp):null,definition:'Gold clarify excluded. Predicted clarify on gold escalate is FN; predicted clarify on gold not_assessed is TN.'},execution_error_ids:errors};
}
const reports={};
for(const [engine,raw] of [['typescript',ts],['python',py]]){
 const byid=new Map(raw.map(r=>[r.id,r]));
 const rows=gold.cases.map(c=>({...c,predicted:byid.get(c.id)?.decision?.status??null,decision:byid.get(c.id)?.decision??null,error:byid.get(c.id)?.error??null}));
 const aggregate=metrics(rows);
 const categories=Object.fromEntries([...new Set(rows.map(r=>r.category))].map(c=>[c,metrics(rows.filter(r=>r.category===c))]));
 const ambiguous=rows.filter(r=>r.expected==='clarify');
 const third=rows.filter(r=>r.subject==='other');
 const selfMention=third.filter(r=>(r.decision?.mentions??[]).some(m=>m.subject==='self'));
 reports[engine]={...aggregate,per_category:categories,false_negatives:rows.filter(r=>r.expected==='escalate'&&r.predicted!=='escalate'),false_positives:rows.filter(r=>r.expected==='not_assessed'&&r.predicted==='escalate'),ambiguous:{actions:Object.fromEntries(statuses.map(s=>[s,ambiguous.filter(r=>r.predicted===s).length])),routine_continuations:ambiguous.filter(r=>r.predicted==='not_assessed'),all_cases:ambiguous},annotation_coverage:{total_with_mentions:rows.filter(r=>(r.decision?.mentions??[]).length>0).length,total:rows.length,by_expected:Object.fromEntries(statuses.map(s=>[s,{with_mentions:rows.filter(r=>r.expected===s&&(r.decision?.mentions??[]).length>0).length,total:rows.filter(r=>r.expected===s).length}])),emergency_cases_without_mentions:rows.filter(r=>r.expected==='escalate'&&!(r.decision?.mentions??[]).length).map(r=>({id:r.id,text:r.text,predicted:r.predicted})),third_party_safety_mentions_with_self_subject:selfMention,patient_annotation_mutation:'Not established by isolated safety matcher; browser observation is separate.'},gates:{zero_false_negatives:aggregate.binary.FN===0,precision_at_least_point95:aggregate.binary.precision!==null&&aggregate.binary.precision>=0.95,zero_ambiguous_routine_continuations:ambiguous.every(r=>r.predicted!=='not_assessed'&&r.predicted!==null),zero_third_party_self_safety_mentions:selfMention.length===0,no_execution_errors:aggregate.execution_error_ids.length===0},all_results:rows};
 write(`independent-${engine}-results.json`,reports[engine]);
}
write('independent-engine-summary.json',{completed_at_utc:new Date().toISOString(),gold_sha256:sha(goldBytes),engines:Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,{...metrics(v.all_results),gates:v.gates,ambiguous_actions:v.ambiguous.actions,annotation_coverage:v.annotation_coverage.total_with_mentions}])),clinical_status:'AI-assisted fictional engineering evaluation; not clinical approval'});
console.log(JSON.stringify(Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,{binary:v.binary,gates:v.gates,ambiguous_actions:v.ambiguous.actions}]))));
