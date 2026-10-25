/** Explicit 20-case actual local inference, no mocks/downloads/cloud. Not part of unit tests. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { createMedGemmaExtractor } from '../server/medgemma';

const output = process.env.MEDASSIST_EVAL_OUTPUT || 'models/medassist_intelligence/medgemma-results.json';
if (!/^models\/medassist_intelligence\/medgemma-results(?:-v2)?\.json$/.test(output)) throw new Error('Invalid evaluation receipt path');
if (existsSync(output)) throw new Error('Existing MedGemma receipt is preserved; choose a separately reviewed new run.');
const suite = JSON.parse(readFileSync('models/medassist_intelligence/extraction-v1.json', 'utf8'));
const indices = [0, 1, 2, 5, 6, 8, 9, 12, 16, 17, 18, 24, 25, 27, 30, 45, 46, 36, 37, 40];
let raw: unknown = null;
const extractor = createMedGemmaExtractor({ fetchImpl: async (url, init) => {
  const response = await fetch(url, init);
  if (String(url).endsWith('/api/chat') && response.ok) {
    try { const data = await response.clone().json(); raw = JSON.parse(data.message.content); } catch { raw = null; }
  }
  return response;
} });
const initialPs = await (await fetch('http://127.0.0.1:11434/api/ps')).json();
const initiallyLoaded = initialPs.models.some((m: any) => m.name === extractor.model);
const rows: any[] = []; let peakVram: number | null = null;
const sample = setInterval(() => { void fetch('http://127.0.0.1:11434/api/ps', { signal: AbortSignal.timeout(1000) }).then(r => r.json())
  .then(data => { for (const m of data.models ?? []) if (m.name === extractor.model) peakVram = Math.max(peakVram ?? 0, m.size_vram ?? 0); }).catch(() => {}); }, 500);
const started = performance.now(); const freeBefore = os.freemem();
try {
  for (const index of indices) {
    const c = suite.cases[index]; raw = null; const at = performance.now(); let result: any = null; let error: string | null = null;
    try { result = await extractor.extract(c.text); } catch (e) { error = e instanceof Error ? e.message : 'FAILED'; }
    rows.push({ case_id: c.case_id, group: c.group, raw, envelope: result?.envelope ?? null,
      elapsed_ms: Math.round((performance.now() - at) * 100) / 100, load_ms: result?.metrics.load_ms ?? null, error });
    console.log(JSON.stringify({ completed: rows.length, total: 20, case_id: c.case_id, accepted_structure: !!result, error }),);
  }
} finally {
  clearInterval(sample);
  if (!initiallyLoaded) await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: extractor.model, keep_alive: 0 }), signal: AbortSignal.timeout(10000) }).catch(() => {});
}
const scored = JSON.parse(execFileSync('.venv/Scripts/python.exe', ['-B', '-c', `
import sys,json
from models.medassist_intelligence.extraction import load_suite,assess,contract_valid
s=load_suite(); cases={c['case_id']:c for c in s['cases']}; out=[]
for r in json.load(sys.stdin):
 c=cases[r['case_id']]; raw=r['raw']; score=assess(raw,c,s)
 def semantic(v):
  if not isinstance(v,dict):return None
  return {k:([{x:y for x,y in i.items() if x!='quote'} for i in val] if k=='items' else val) for k,val in v.items()}
 score['semantic_exact']=contract_valid(raw,c,s) and semantic(raw)==semantic(c['expected'])
 score['unexpected_fields']=len(set(raw)-{'schema_version','status','items','issues'}) if isinstance(raw,dict) else 0
 out.append({**{k:v for k,v in r.items() if k not in ('raw','envelope')},**score,'runtime_validated':r['envelope'] is not None,'bridge_available':bool(r['envelope'] and r['envelope']['suggestion'])})
print(json.dumps(out))
`], { input: JSON.stringify(rows), encoding: 'utf8' }));
const valid = scored.filter((r: any) => r.runtime_validated); const warm = scored.slice(1).map((r: any) => r.elapsed_ms).sort((a: number, b: number) => a - b);
const report = { model: extractor.model, model_digest: rows.find(r => r.envelope)?.envelope.provenance.digest ?? null,
  scope: '20 real fictional local inferences; small development evaluation, not clinical validation', cases: scored,
  totals: { attempts: scored.length, completed_responses: scored.filter((r: any) => r.error !== 'MODEL_TIMEOUT_OR_CANCELLED').length,
    schema_valid: scored.filter((r: any) => r.schema_valid).length, runtime_validated: valid.length,
    semantic_exact: scored.filter((r: any) => r.semantic_exact).length, exact_output: scored.filter((r: any) => r.exact_match).length,
    unsupported_assertions: scored.reduce((n: number, r: any) => n + r.unsupported_assertions, 0),
    wrong_polarity_or_unknown: scored.reduce((n: number, r: any) => n + r.wrong_polarity_or_unknown, 0),
    unexpected_fields: scored.reduce((n: number, r: any) => n + r.unexpected_fields, 0),
    cold_request_ms: initiallyLoaded ? null : scored[0].elapsed_ms, first_request_ms: scored[0].elapsed_ms,
    warm_p50_ms: warm[Math.floor(warm.length / 2)], warm_p95_ms: warm[Math.ceil(.95 * warm.length) - 1], warm_n: warm.length },
  memory: { sampled_model_size_vram_bytes: peakVram, system_free_before_bytes: freeBefore, system_free_after_bytes: os.freemem(),
    precise_gpu_allocations_and_process_rss: 'not measured; size_vram is Ollama residency telemetry, free RAM is whole system' },
  initial_model_loaded: initiallyLoaded, protocol: output.includes('-v2') ? 'template-aware-user-turn-v2' : 'system-turn-v1',
  elapsed_seconds: (performance.now() - started) / 1000, installed_model_only: true, downloads: false, cloud_calls: false,
  live_scope: 'only one confirmed supported positive initial bridges; all other proposals clarify; no full-suite/clinical promotion claim' };
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: 'complete', ...report.totals }));
