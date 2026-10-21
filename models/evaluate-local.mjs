import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const modelDirectory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.dirname(modelDirectory);
const catalogue = JSON.parse(await readFile(path.join(modelDirectory, 'local/models.json'), 'utf8'));
const args = process.argv.slice(2);
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  if (!['--models', '--output'].includes(args[index]) || !args[index + 1] || options.has(args[index])) {
    throw new Error('Use --models model1,model2 (optional) and --output models/evaluations/new-file.json.');
  }
  options.set(args[index], args[index + 1]);
}
if (!options.has('--output')) throw new Error('Choose a new report using --output models/evaluations/new-file.json.');
const output = path.resolve(repository, options.get('--output'));
const evaluationDirectory = path.join(modelDirectory, 'evaluations');
if (path.dirname(output) !== evaluationDirectory || path.extname(output) !== '.json') {
  throw new Error('Output must be a JSON file directly inside models/evaluations.');
}
const selectedModels = options.has('--models') ? options.get('--models').split(',') : catalogue.initialShortlist;
if (!selectedModels.length || new Set(selectedModels).size !== selectedModels.length ||
    selectedModels.some(id => !catalogue.models.some(model => model.id === id))) {
  throw new Error('Choose unique model IDs from models/local/models.json.');
}
// Exclusive creation prevents accidental replacement of an earlier observation.
await mkdir(evaluationDirectory, { recursive: true });
await writeFile(output, '{}\n', { flag: 'wx' });

const fixtures = [
  { id: 'fictional-copy-en', language: 'English', text: 'Fictional software fixture. Medicine: TESTMED-A. Symptom: test symptom. Dose is not known.', expected: { medicine: 'TESTMED-A', symptom: 'test symptom', dose: null } },
  { id: 'fictional-copy-te', language: 'Telugu-script', text: 'కల్పిత సాఫ్ట్‌వేర్ పరీక్ష. మందు: TESTMED-A. లక్షణం: పరీక్ష లక్షణం. మోతాదు తెలియదు.', expected: { medicine: 'TESTMED-A', symptom: 'పరీక్ష లక్షణం', dose: null } }
];
const schema = { type: 'object', properties: { medicine: { type: ['string', 'null'] }, symptom: { type: ['string', 'null'] }, dose: { type: ['string', 'null'] } }, required: ['medicine', 'symptom', 'dose'], additionalProperties: false };
const generationOptions = { temperature: 0, seed: 42, num_ctx: 2048, num_predict: 160 };
const report = {
  startedAt: new Date().toISOString(), status: 'running',
  purpose: 'Two fictional extraction/copy fixtures per model; not clinical validation or representative benchmarking.',
  runtime: 'ollama-local-only', endpoint: 'http://127.0.0.1:11434',
  nodeVersion: process.version, generationOptions, schema, fixtures, runs: []
};
const save = () => writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
await save();

async function request(route, body, timeout = 90000) {
  const response = await fetch(`${report.endpoint}${route}`, {
    method: body ? 'POST' : 'GET',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`Local Ollama HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);
  return response.json();
}

try {
  report.ollamaVersion = (await request('/api/version', undefined, 10000)).version;
  const installed = (await request('/api/tags', undefined, 10000)).models;
  for (const id of selectedModels) {
    const installedModel = installed.find(model => model.name === id || model.model === id);
    if (!installedModel) throw new Error(`Model ${id} is not installed. No automatic download was attempted.`);
    const observed = catalogue.models.find(model => model.id === id);
    const modelResult = { model: id, digest: installedModel.digest, catalogueDigestMatches: installedModel.digest.replace(/^sha256:/, '').startsWith(observed.observedDigestPrefix), fixtures: [] };
    report.runs.push(modelResult);
    try {
      for (const fixture of fixtures) {
        const started = performance.now();
        const result = { fixture: fixture.id, passed: false };
        modelResult.fixtures.push(result);
        try {
          const response = await request('/api/chat', {
            model: id, stream: false, think: false, format: schema, keep_alive: '2m', options: generationOptions,
            messages: [
              { role: 'system', content: 'Extract only explicitly supplied values from this fictional software fixture. Copy the medicine and symptom exactly in their original script. Keep an unknown or absent dose null. Return only the schema fields. Do not give medical advice or translate values.' },
              { role: 'user', content: fixture.text }
            ]
          });
          result.output = response.message?.content ?? '';
          const parsed = JSON.parse(result.output);
          result.fieldChecks = Object.fromEntries(Object.entries(fixture.expected).map(([key, value]) => [key, parsed?.[key] === value]));
          result.noExtraFields = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 3;
          result.passed = result.noExtraFields && Object.values(result.fieldChecks).every(Boolean);
          result.serverTotalSeconds = response.total_duration / 1e9;
          result.loadSeconds = response.load_duration / 1e9;
          result.outputTokens = response.eval_count;
          result.doneReason = response.done_reason;
        } catch (error) {
          result.error = error.message;
        }
        result.wallSeconds = Number(((performance.now() - started) / 1000).toFixed(3));
        console.log(`${id} / ${fixture.id}: ${result.passed ? 'PASS' : 'FAIL'} (${result.wallSeconds}s)`);
        await save();
      }
    } finally {
      try { await request('/api/generate', { model: id, keep_alive: 0 }, 10000); }
      catch (error) { modelResult.unloadError = error.message; }
    }
  }
  report.status = report.runs.every(run => run.fixtures.length === fixtures.length && run.fixtures.every(fixture => fixture.passed)) ? 'passed-small-smoke-check-only' : 'observed-fixture-failures';
} catch (error) {
  report.status = 'execution-error';
  report.error = error.message;
} finally {
  report.finishedAt = new Date().toISOString();
  await save();
}
console.log(`Saved ${path.relative(repository, output)}; ${report.status}.`);
if (report.status !== 'passed-small-smoke-check-only') process.exitCode = 1;
