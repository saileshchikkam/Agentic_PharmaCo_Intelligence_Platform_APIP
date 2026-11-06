import assert from 'node:assert/strict';
import test from 'node:test';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { constrainContext, understand } from '../src/features/medassist-conversation/understanding';

const cases: [string, string[]][] = [
  ['I have fever.', ['91+']],
  ['I have no fever.', ['91-']],
  ['I am not sure whether I have fever.', ['91?']],
  ['I wonder if I have a fever.', ['91?']],
  ['I had fever yesterday, not now.', []],
  ['I have had a fever since yesterday.', ['91+']],
  ['If I develop fever, what should I do?', []],
  ["Someone told me, 'I have fever.'", []],
  ['Someone told me, I have fever.', []],
  ['“I have a sore throat and cough,” she wrote. I have chills.', ['94+']],
  ['He told me he had chills, but I have nausea.', ['148+']],
  ["I have fever. Actually, I don't.", ['91!']],
  ['I have nausea. I take that back.', ['148!']],
  ['Maybe fever and cough.', ['91?']],
  ['Maybe fever, but I definitely have a cough.', ['91?', '201+']],
  ['My nausea is gone but my nose is blocked.', ['181+']],
  ['Last week I felt nauseated; now I have no nausea.', ['148-']],
  ['I do not feel like puking.', ['148-']],
  ['I puked once and my throat is scratchy.', []],
  ['I am not free of fever.', []],
  ['I’m free of fever but my head hurts.', ['53+', '91-']],
  ['The drain is blocked and the machine runs.', []],
  ['No sore throaat, but feeling chills.', ['94+', '97-']],
  ['Diarhoea and my right ankle feels strange.', ['51+']],
];

for (const [input, expected] of cases) {
  test(input, () => {
    const result = understand(input, scriptedVocabulary);
    assert.equal(result.validation_failed, false);
    const actual = result.proposal.observations.map(item =>
      item.evidence_id.slice(2) + (item.state === 'unknown' ? '?' : item.state === 'contradiction' ? '!' : item.value ? '+' : '-'));
    assert.deepEqual(actual.sort(), [...expected].sort());
    for (const row of result.annotations) assert.equal(input.slice(row.start, row.end), row.quote);
    if (input.includes('ankle')) assert.ok(result.proposal.unmapped.some(item => item.quote.includes('ankle')));
    if (input.includes('puked once')) assert.ok(result.proposal.unmapped.some(item => item.quote.includes('puked once')));
  });
}

test('provider proposals cannot strip the new uncertainty cue or promote attributed quotes', () => {
  const raw = {
    schema_version: 'medassist.natural-extraction.v1',
    observations: [{ evidence_id: 'E_91', state: 'confirmed', value: true, quote: 'fever' }],
    unmapped: [],
    instruction_attempt: false,
  };
  assert.equal(constrainContext(raw, 'I wonder if I have a fever.', scriptedVocabulary, null), null);
  const quoted = constrainContext(raw, 'Someone told me, “I have fever.”', scriptedVocabulary, null);
  assert.equal(quoted?.observations.length, 0);
});
