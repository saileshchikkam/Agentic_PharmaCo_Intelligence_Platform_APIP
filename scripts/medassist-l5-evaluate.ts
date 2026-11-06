import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { reportedDetails, understand } from '../src/features/medassist-conversation/understanding';
import { evaluateStatement } from '../src/features/medassist-safety/safety';

type Expected = { id: string; state: string; span: string };
type Case = { id: string; category: string; input: string; evidence: Expected[]; retain: string[];
  clarification: boolean; confirmation: boolean; conflict: boolean };
const raw = readFileSync(new URL('../docs/evaluation/medassist-l5-english-v1.json', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const hash = createHash('sha256').update(raw).digest('hex');
assert.equal(hash, '08519525e96b0d3f7c2772a3e5f967f23446c42e46a9a2f8a06f599739282c5c', 'Frozen L5 corpus changed');
const corpus: { cases: Case[]; safety: { id: string; input: string; expect: string }[]; turns: unknown[] } = JSON.parse(raw);
assert.equal(corpus.cases.length, 80);
assert.equal(corpus.turns.length, 15);
assert.equal(corpus.safety.length, 4);
assert.equal(new Set(corpus.cases.map(row => row.id)).size, 80);
const fields = new Set(scriptedVocabulary.items.map(item => item.evidence_id));
assert.equal(fields.size, 9);

const rows = corpus.cases.map(row => {
  for (const item of row.evidence) {
    assert.ok(fields.has(item.id));
    assert.ok(row.input.includes(item.span), row.id + ' expected span');
  }
  for (const span of row.retain) assert.ok(row.input.includes(span), row.id + ' retained span');
  const result = understand(row.input, scriptedVocabulary);
  const evidence = result.proposal.observations.map(item => ({
    id: item.evidence_id,
    state: item.state === 'confirmed' ? item.value === true ? 'present' : 'absent' : item.state,
    span: item.quote,
  }));
  const flags = {
    clarification: !evidence.length || result.proposal.unmapped.some(item => item.kind === 'ambiguous')
      || evidence.some(item => item.state === 'contradiction'),
    confirmation: evidence.length > 0,
    conflict: evidence.some(item => item.state === 'contradiction'),
  };
  const issues: string[] = [];
  for (const item of row.evidence) {
    const actual = evidence.find(candidate => candidate.id === item.id);
    if (!actual) issues.push('missing ' + item.id + ' ' + item.state);
    else if (actual.state !== item.state) issues.push('wrong state ' + item.id + ' ' + item.state + '→' + actual.state);
    else if (!actual.span.includes(item.span)) issues.push('missing evidence span ' + item.span);
  }
  for (const item of evidence) {
    if (!row.evidence.some(expected => expected.id === item.id)) issues.push('unexpected ' + item.id + ' ' + item.state);
    if (!fields.has(item.id) || !row.input.includes(item.span)) issues.push('invalid evidence provenance');
  }
  const narrative = [...result.proposal.unmapped, ...reportedDetails(row.input)].map(item => item.quote);
  for (const span of row.retain) if (!narrative.some(quote => quote.includes(span))) issues.push('missing narrative span ' + span);
  for (const annotation of result.annotations) {
    if (row.input.slice(annotation.start, annotation.end) !== annotation.quote) issues.push('invalid annotation provenance');
  }
  for (const key of Object.keys(flags) as (keyof typeof flags)[]) {
    if (flags[key] !== row[key]) issues.push(key + ' intent mismatch');
  }
  if (result.validation_failed) issues.push('proposal rejected');
  return { ...row, observed: evidence, observedFlags: flags, narrative, issues };
});

const warningRows = corpus.safety.map(row => {
  const observed = evaluateStatement(row.input).suppress_ordinary_flow ? 'interrupt' : 'ordinary';
  return { ...row, observed, matched: observed === row.expect };
});
const categories = [...new Set(rows.map(row => row.category))].map(category => {
  const group = rows.filter(row => row.category === category);
  return { category, matched: group.filter(row => !row.issues.length).length, total: group.length };
});
const expectedObservations = rows.flatMap(row => row.evidence).length;
const observedObservations = rows.flatMap(row => row.observed).length;
const correctIdAndState = rows.reduce((sum, row) => sum + row.evidence.filter(expected =>
  row.observed.some(item => item.id === expected.id && item.state === expected.state)).length, 0);
console.log(JSON.stringify({ hash, categories, fullMatches: rows.filter(row => !row.issues.length).length,
  expectedObservations, observedObservations, correctIdAndState, rows, warningRows }, null, 2));
