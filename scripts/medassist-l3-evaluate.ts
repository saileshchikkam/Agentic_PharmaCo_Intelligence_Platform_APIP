import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { reportedDetails, understand } from '../src/features/medassist-conversation/understanding';
import { evaluateStatement } from '../src/features/medassist-safety/safety';

type Case = {
  id: string;
  style: string;
  text: string;
  evidence: string[];
  interaction: 'confirm' | 'clarify' | 'review_conflict' | 'interrupt';
  requiredSpan?: string;
  retain?: string;
};

const raw = readFileSync(new URL('../docs/evaluation/medassist-l3-english-v1.json', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const digest = createHash('sha256').update(raw).digest('hex');
assert.equal(digest, '0c8999b4d8d34433d7e9721d33d8e3c5dd28af3a53a08e679cae317854c9fa44', 'Frozen corpus changed');
const corpus: { baseline: string; cases: Case[] } = JSON.parse(raw);
assert.equal(corpus.cases.length, 38);
assert.equal(new Set(corpus.cases.map(row => row.id)).size, corpus.cases.length);
const vocabulary = new Set(scriptedVocabulary.items.map(item => item.evidence_id));
assert.equal(vocabulary.size, 9);

const rows = corpus.cases.map(row => {
  for (const code of row.evidence) assert.ok(vocabulary.has(code.slice(0, -1)));
  const interrupted = evaluateStatement(row.text).suppress_ordinary_flow;
  const analysis = interrupted ? null : understand(row.text, scriptedVocabulary);
  const observations = analysis?.proposal.observations ?? [];
  const observed = observations.map(item => {
    const suffix = item.state === 'unknown' ? '?' : item.state === 'contradiction' ? '!' : item.value === true ? '+' : '-';
    return item.evidence_id + suffix;
  });
  const interaction = interrupted ? 'interrupt' : observed.some(code => code.endsWith('!')) ? 'review_conflict'
    : observed.length ? 'confirm' : 'clarify';
  const issues: string[] = [];
  const observedIds = new Set(observed.map(code => code.slice(0, -1)));
  for (const expected of row.evidence) {
    if (!observedIds.has(expected.slice(0, -1))) issues.push('missing ' + expected);
    else if (!observed.includes(expected)) issues.push('wrong state for ' + expected);
  }
  const expectedIds = new Set(row.evidence.map(code => code.slice(0, -1)));
  for (const code of observed) if (!expectedIds.has(code.slice(0, -1))) issues.push('unexpected ' + code);
  if (analysis?.validation_failed) issues.push('proposal rejected');
  if (interaction !== row.interaction) issues.push('interaction mismatch');
  if (row.requiredSpan && !observations.some(item => item.quote.includes(row.requiredSpan!))) issues.push('required source span missing');
  const retained = analysis ? [...analysis.proposal.unmapped, ...reportedDetails(row.text)] : [];
  if (row.retain && !retained.some(item => item.quote.includes(row.retain!))) issues.push('required narrative detail missing');
  for (const item of observations) {
    assert.ok(vocabulary.has(item.evidence_id));
    assert.ok(row.text.includes(item.quote));
  }
  return { ...row, observed, interactionObserved: interaction, issues };
});

const render = (codes: string[]) => codes.length ? codes.join(', ') : '—';
console.log(`Corpus SHA-256: ${digest}\nAuthored against: ${corpus.baseline}\n`);
console.log('| ID | Style | Input | Expected evidence / action | Observed evidence / action | Result |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  console.log(`| ${row.id} | ${row.style} | ${row.text} | ${render(row.evidence)} / ${row.interaction} | ${render(row.observed)} / ${row.interactionObserved} | ${row.issues.join(', ') || 'Match'} |`);
}
for (const group of ['language', 'safety']) {
  const selected = rows.filter(row => (row.style === 'safety') === (group === 'safety'));
  console.log(`\n${group}: ${selected.filter(row => !row.issues.length).length}/${selected.length} full matches`);
}
