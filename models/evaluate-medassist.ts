import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

// Fixed fictional inputs only. This is a transport/quote smoke check, not a clinical benchmark.
const fixtures = [
  { id: 'symptom-en', language: 'en', answers: {
    concern: 'A fictional adult has a cough, without chest pain.', duration: 'Since yesterday.', impact: null, changes: 'No change so far.',
  } },
];
const fields = ['concern', 'duration', 'impact', 'changes'] as const;
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
if (!output) throw new Error('Choose a new output filename with --output. Existing reports are not overwritten.');
const tagsResponse = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) });
if (!tagsResponse.ok) throw new Error('Cannot read the installed local model inventory.');
const tags = await tagsResponse.json();
const results = [];
for (const fixture of fixtures) {
  const start = performance.now();
  try {
    const response = await fetch('http://127.0.0.1:3000/api/medassist/structure', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(65000),
      body: JSON.stringify({ fictionalOnly: true, language: fixture.language, answers: fixture.answers }),
    });
    const data = await response.json();
    const quotes = data.suggestions;
    const passed = response.ok && data.provider === 'ollama-local' && data.assessment?.urgency === 'not_assessed'
      && quotes && Object.keys(quotes).length === 4
      && fields.every((field) => Object.hasOwn(quotes, field) && quotes[field] === fixture.answers[field]);
    const observed = tags.models?.find((item: { name: string }) => item.name === data.model);
    results.push({ fixture, status: response.status, passed: !!passed, elapsedMs: Math.round(performance.now() - start),
      modelDigest: observed?.digest ?? null, result: data });
  } catch (error) {
    results.push({ fixture, passed: false, elapsedMs: Math.round(performance.now() - start), error: error instanceof Error ? error.name : 'Error' });
  }
}
await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), purpose: 'One English fictional symptom quote-selection smoke checks. No urgency, medical advice, clinical effectiveness, or language-quality validation.', results }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, passed: results.filter((item) => item.passed).length, total: results.length }));
if (results.some((item) => !item.passed)) process.exitCode = 1;
