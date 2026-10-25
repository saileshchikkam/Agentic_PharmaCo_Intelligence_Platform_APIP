/** Explicit bounded local comparison. Never part of default tests. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { MEDGEMMA_PROMPT } from '../server/medgemma';
import { extractionSchema, readLocalExtraction } from '../src/features/medassist-intelligence/medgemma';
import { COMPACT_PROMPT, compactSchema, mapCompactExtraction } from '../src/features/medassist-intelligence/compact-extraction';
const directory = 'models/medassist_intelligence/reliability-v1/';
const output = directory + 'comparison.json'; const protocol = directory + 'protocol.json';
if (existsSync(output) || existsSync(protocol)) throw Error('Preserve completed experiment/protocol');
const models = ['medgemma1.5:latest', 'qwen3:4b', 'qwen3.5:2b'];
const indices = [0,1,2,5,6,8,9,12,16,17,18,24,25,27,30,45,46,36,37,40];
const suite = JSON.parse(readFileSync('models/medassist_intelligence/extraction-v1.json', 'utf8'));
const plan = { version: 'local-extraction-reliability.v1', models, case_ids: indices.map(i => suite.cases[i].case_id),
  variants: { baseline: { prompt: MEDGEMMA_PROMPT, schema: extractionSchema, num_predict: 384 },
    compact: { prompt: COMPACT_PROMPT, schema: compactSchema, num_predict: 100 } },
  temperature: 0, seed: 23, num_ctx: 2048, thinking: false, request_deadline_ms: 30000, total_deadline_ms: 1200000,
  retries: 0, candidate_gate: { semantic_accuracy: .95, schema_validity: 1, unsupported_assertions: 0, polarity_errors: 0, warm_p95_ms: 5000 },
  scope: 'Same 20 reused development cases; not full 48-case promotion or clinical validation. Count failures in denominators. No retries or post-result prompt edits.' };
writeFileSync(protocol, JSON.stringify(plan, null, 2)+'\n');
const start = performance.now();
const json = async (url: string, init: RequestInit = {}) => {
  const r = await fetch('http://127.0.0.1:11434/api/'+url, { ...init, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw Error('OLLAMA_HTTP_'+r.status); const text = await r.text(); if (text.length > 65536) throw Error('RESPONSE_TOO_LARGE'); return JSON.parse(text);
};
const inventory = await json('tags'); const loaded = await json('ps');
if (loaded.models?.length) throw Error('Do not displace an already loaded model');
const rows: any[] = []; const identities: any[] = [];
try {
  for (const model of models) {
    const installed = inventory.models.find((m: any) => m.name === model && m.details?.format === 'gguf');
    if (!installed || !/^[a-f0-9]{64}$/.test(installed.digest)) throw Error('Required installed GGUF missing');
    const show = await json('show', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({model}) });
    if (show.remote_model || show.remote_host) throw Error('Remote model forbidden');
    identities.push({model, digest:installed.digest, details:installed.details, template_has_system_branch:/\.Role.*system/.test(show.template || '')});
    for (const variant of ['baseline','compact'] as const) {
      for (const index of indices) {
        const c = suite.cases[index]; const at = performance.now(); let raw: any = null, mapped: any = null, error: string | null = null, load_ms = null, tokens = null, vram = null;
        if (at-start >= plan.total_deadline_ms) error = 'TOTAL_BUDGET_EXHAUSTED';
        else try {
          const settings = plan.variants[variant];
          const content = variant === 'baseline' ? settings.prompt+'\nBEGIN_UNTRUSTED_FICTIONAL_INPUT\n'+JSON.stringify({fictional_only:true,text:c.text})+'\nEND_UNTRUSTED_FICTIONAL_INPUT'
            : settings.prompt+'\nINPUT_JSON\n'+JSON.stringify({fictional_only:true,text:c.text});
          const result = await json('chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,think:false,keep_alive:'60s',format:settings.schema,
            options:{temperature:plan.temperature,seed:plan.seed,num_ctx:plan.num_ctx,num_predict:settings.num_predict},messages:[{role:'user',content}]})});
          raw = JSON.parse(result.message.content); mapped = variant === 'compact' ? mapCompactExtraction(raw,c.text) : raw;
          load_ms = Number(result.load_duration || 0)/1e6; tokens = result.eval_count;
          const ps = await json('ps'); vram = ps.models.find((m:any)=>m.name===model)?.size_vram ?? null;
        } catch(e) { error = e instanceof Error ? e.name+':'+e.message : 'FAILED'; }
        rows.push({model,variant,case_id:c.case_id,raw,mapped,error,load_ms,tokens,model_residency_bytes:vram,
          elapsed_ms:Math.round((performance.now()-at)*100)/100,runtime_validated:!!mapped && !!readLocalExtraction(mapped,c.text)});
        console.log(JSON.stringify({model,variant,completed:rows.filter(r=>r.model===model&&r.variant===variant).length,total:20,error}));
      }
    }
    await json('generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,keep_alive:0})});
  }
} finally {
  // These candidates were all unloaded before the explicit experiment began.
  for (const model of models) await json('generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,keep_alive:0})}).catch(()=>{});
  writeFileSync(directory+'responses.json',JSON.stringify({fictional_only:true,rows},null,2)+'\n');
}
const scored = JSON.parse(execFileSync('.venv/Scripts/python.exe',['-B','-c',`
import sys,json,math
from models.medassist_intelligence.extraction import load_suite,assess,contract_valid
s=load_suite(); cases={c['case_id']:c for c in s['cases']}; rows=json.load(sys.stdin); out=[]
slots={'cough':'E_201','fever':'E_91','sore_throat':'E_97'}
for r in rows:
 c=cases[r['case_id']]; raw=r['mapped']; score=assess(raw,c,s)
 def semantic(v):
  if not isinstance(v,dict):return None
  return {k:([{x:y for x,y in i.items() if x!='quote'} for i in val] if k=='items' else val) for k,val in v.items()}
 score['semantic_exact']=contract_valid(raw,c,s) and semantic(raw)==semantic(c['expected'])
 if r['variant']=='compact':
  native=r['raw']; expected={i['evidence_id']:i for i in c['expected']['items']}; unsupported=0; polarity=0
  if isinstance(native,dict):
   for slot,eid in slots.items():
    state=native.get(slot)
    if state not in ('missing',None):
     if eid not in expected:unsupported+=1
     else:
      i=expected[eid]; want='unknown' if i['state']=='unknown' else 'conflict' if i['state']=='contradiction' else 'present' if i['value'] is True else 'absent'
      polarity+=state!=want
  score['unsupported_assertions']=unsupported;score['wrong_polarity_or_unknown']=polarity
 out.append({**{k:v for k,v in r.items() if k not in ('raw','mapped')},**score})
groups=[]
for model,variant in dict.fromkeys((r['model'],r['variant']) for r in out):
 rs=[r for r in out if (r['model'],r['variant'])==(model,variant)]; warm=sorted(r['elapsed_ms'] for r in rs if r['error'] is None and r['load_ms'] is not None and r['load_ms']<1000)
 pct=lambda a,p:a[max(0,math.ceil(len(a)*p)-1)] if a else None
 summary={k:sum(bool(r[k]) for r in rs) for k in ['schema_valid','semantic_exact','exact_match','runtime_validated']}
 summary.update({k:sum(r[k] for r in rs) for k in ['unsupported_assertions','wrong_polarity_or_unknown']})
 summary.update(model=model,variant=variant,attempts=len(rs),errors=sum(r['error'] is not None for r in rs),warm_n=len(warm),median_ms=pct(warm,.5),p95_ms=pct(warm,.95),cold_ms=[r['elapsed_ms'] for r in rs if r['load_ms'] is not None and r['load_ms']>=1000])
 summary['candidate_gate']=len(rs)==20 and summary['semantic_exact']>=19 and summary['schema_valid']==20 and not summary['errors'] and not summary['unsupported_assertions'] and not summary['wrong_polarity_or_unknown'] and summary['p95_ms'] is not None and summary['p95_ms']<=5000
 groups.append(summary)
print(json.dumps({'groups':groups,'cases':out}))
`],{input:JSON.stringify(rows),encoding:'utf8'}));
writeFileSync(output,JSON.stringify({protocol:'protocol.json',identities,elapsed_seconds:(performance.now()-start)/1000,...scored},null,2)+'\n');
console.log(JSON.stringify(scored.groups));
