import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { reportClauses } from '../src/features/medassist-conversation/language-context';
import { readOpenSymptomMention } from '../src/features/medassist-conversation/open-symptom';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { understand } from '../src/features/medassist-conversation/understanding';

const file = (name: string) => new URL(`../docs/evaluation/${name}`, import.meta.url);
const development = readFileSync(file('medassist-systemic-development-v1.json'));
const withheld = readFileSync(file('medassist-systemic-withheld-v1.json'));
const freeze = JSON.parse(readFileSync(file('medassist-systemic-corpus-freeze-v1.json'), 'utf8'));
const hash = (value: Buffer) => createHash('sha256').update(value).digest('hex');

test('systemic corpora are frozen, fictional, balanced, and hash-bound', () => {
  const dev = JSON.parse(development.toString('utf8'));
  const held = JSON.parse(withheld.toString('utf8'));
  assert.equal(dev.fictional_only, true);
  assert.equal(held.fictional_only, true);
  assert.equal(dev.cases.length, 50);
  assert.equal(held.cases.length, 50);
  assert.deepEqual([...new Set(dev.cases.map((row: { family: string }) => row.family))].sort(), [...freeze.families].sort());
  assert.deepEqual([...new Set(held.cases.map((row: { family: string }) => row.family))].sort(), [...freeze.families].sort());
  assert.equal(hash(development), freeze.sha256.development);
  assert.equal(hash(withheld), freeze.sha256.withheld);
  for (const row of [...dev.cases, ...held.cases]) {
    assert.match(row.id, /^[DW]-[A-Z]{2}-\d{2}$/);
    assert.equal(typeof row.text, 'string');
    assert.ok(row.text.length > 2 && row.text.length <= 300);
    assert.ok(Array.isArray(row.expected));
    assert.equal(typeof row.clarify, 'boolean');
  }
});

test('the nine scripted evidence fields each have a basic current-positive smoke path', () => {
  const cases: [string, string][] = [
    ['E_201', 'I have a cough.'], ['E_91', 'I have a fever.'], ['E_97', 'My throat feels sore.'],
    ['E_181', 'My nose is blocked.'], ['E_94', 'I have chills.'], ['E_53', 'My head hurts badly since morning.'],
    ['E_148', 'I feel nauseated.'], ['E_51', 'I have diarrhea.'], ['E_76', 'I feel a little dizzy.'],
  ];
  for (const [id, text] of cases) {
    const output = understand(text, scriptedVocabulary);
    assert.equal(output.validation_failed, false, text);
    assert.ok(output.proposal.observations.some(item => item.evidence_id === id && item.state === 'confirmed' && item.value === true), text);
  }
});

test('one message can keep an unsupported description while proposing supported and negative evidence', () => {
  const text = 'My ears are ringing, I have a cough, but no fever.';
  const output = understand(text, scriptedVocabulary);
  assert.deepEqual(output.proposal.observations.map(item => [item.evidence_id, item.value]).sort(), [['E_201', true], ['E_91', false]]);
  assert.ok(output.proposal.unmapped.some(item => item.quote.includes('ears are ringing')));
});

test('apostrophe-free English negation is normalized before evidence polarity is decided', () => {
  for (const text of ['I dont have fever.', 'I havent had diarrhea today.', 'I doesnt have cough.']) {
    const output = understand(text, scriptedVocabulary);
    assert.equal(output.validation_failed, false, text);
    assert.ok(output.proposal.observations.some(item => item.state === 'confirmed' && item.value === false), text);
    assert.ok(reportClauses(text).some(clause => clause.negative), text);
  }
});

test('history, uncertainty, another person, and resolution cannot become current evidence', () => {
  for (const text of ['My mother has fever.', 'Maybe I have cough.', 'I had a cough yesterday but it stopped now.']) {
    const output = understand(text, scriptedVocabulary);
    assert.equal(output.validation_failed, false, text);
    if (text.startsWith('Maybe')) assert.ok(output.proposal.observations.some(item => item.state === 'unknown'));
    else assert.equal(output.proposal.observations.length, 0, text);
  }
});

test('the proposed open symptom contract preserves source text while abstaining from legacy mapping', () => {
  const mention = { schema_version: 'medassist.open-symptom-mention.v1', source_text: 'My ears are ringing.', source_start: 0,
    source_end: 20, description: 'My ears are ringing.', body_location: 'ears', family: 'eyes_ears', temporality: 'current',
    polarity: 'present', subject: 'target', time_text: null, extraction: 'deterministic', confidence: 'low', mapping: null,
    clarification_needed: true, confirmation: 'pending' };
  assert.deepEqual(readOpenSymptomMention(mention), mention);
  assert.equal(readOpenSymptomMention({ ...mention, source_end: 19 }), null);
  assert.equal(readOpenSymptomMention({ ...mention, mapping: { legacy_evidence_id: 'E_201', state: 'confirmed', value: null } }), null);
});
