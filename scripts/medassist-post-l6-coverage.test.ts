import assert from 'node:assert/strict';
import test from 'node:test';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { understand } from '../src/features/medassist-conversation/understanding';
import { clarifyPain, clarifyWording } from '../src/features/medassist-conversation/presentation';
import { reviewProposal } from '../src/features/medassist-conversation/pending-proposal';

// New development contrasts for bounded spelling and phrase families.
const phrases: [string, string][] = [
  ['cgh today', 'E_201'], ['aching head', 'E_53'],
  ['couffing after supper', 'E_201'], ['throat has been sore after supper', 'E_97'],
  ['throat feels soor', 'E_97'], ['nausous after supper', 'E_148'],
  ['feel a bit pukey', 'E_148'], ['diarrea after supper', 'E_51'],
  ['chillls after supper', 'E_94'], ['feel shivery', 'E_94'],
  ['feel light headed', 'E_76'], ['little dizzy after supper', 'E_76'],
  ['nose is stufy', 'E_181'], ['nose feels congested', 'E_181'],
  ['nose fully blocked', 'E_181'], ['nose blocked', 'E_181'],
  ['hed is paining', 'E_53'], ['head has been aching after supper', 'E_53'],
  ['throat paining', 'E_53'], ['body is aching', 'E_53'], ['fevr after supper', 'E_91'],
];
const variations = [
  { name: 'current', wrap: (s: string) => 'I have ' + s + '.', expected: 'confirmed', value: true },
  { name: 'denial', wrap: (s: string) => 'No ' + s + '.', expected: 'confirmed', value: false },
  { name: 'uncertain', wrap: (s: string) => 'Maybe ' + s + '.', expected: 'unknown', value: null },
  { name: 'history', wrap: (s: string) => 'I used to have ' + s + '.', expected: null },
  { name: 'conditional', wrap: (s: string) => 'If I have ' + s + ', what then?', expected: null },
  { name: 'other person', wrap: (s: string) => 'My sister has ' + s + '.', expected: null },
  { name: 'quoted', wrap: (s: string) => 'Someone wrote “' + s + '”.', expected: null },
];
for (const [phrase, id] of phrases) {
  for (const variation of variations) {
    test(id + ' ' + variation.name + ': ' + phrase, () => {
      const text = variation.wrap(phrase);
      const output = understand(text, scriptedVocabulary);
      assert.equal(output.validation_failed, false);
      const expected = variation.expected ? [{ evidence_id: id, state: variation.expected, value: variation.value }] : [];
      assert.deepEqual(output.proposal.observations.map(({ evidence_id, state, value }) => ({ evidence_id, state, value })), expected);
      for (const item of output.proposal.observations) assert.ok(text.includes(item.quote));
      for (const item of output.annotations) assert.equal(text.slice(item.start, item.end), item.quote);
    });
  }
}

test('abbreviation and collision checks preserve the intended concept', () => {
  for (const text of ['cgh for a week', 'I have cgh today.'])
    assert.equal(understand(text, scriptedVocabulary).proposal.observations[0]?.evidence_id, 'E_201');
  for (const text of [
    'I visited CGH hospital.', 'The light headed screw is on the table.',
    'My coat has a torn button.', 'The staff runs a cafeteria.',
    'The blocked road is noisy.', 'The word nausous is misspelled.',
    'My head is not only paining.', 'Somebody mentioned a congestion charge.',
  ]) assert.equal(understand(text, scriptedVocabulary).proposal.observations.length, 0, text);
});

test('continuity requires one positive referent in the same sentence', () => {
  const text = 'I had a cough at supper and still have it now.';
  const continued = understand(text, scriptedVocabulary);
  assert.equal(continued.proposal.observations[0]?.value, true);
  assert.equal(continued.proposal.observations[0]?.quote, text.slice(0, -1));
  for (const input of [
    'I had chills and nausea at supper and still have them now.',
    'My sister had a cough and still has it now.',
    'I had no cough and still have it now.',
    'My cough went away and still have it now.',
    'I had maybe a cough and still have it now.',
  ]) assert.ok(!understand(input, scriptedVocabulary).proposal.observations.some(item => item.value === true), input);
});

test('broken clause polarity does not spread onto the preceding nasal complaint', () => {
  const output = understand('nose blocked no fever', scriptedVocabulary);
  assert.deepEqual(output.proposal.observations.map(({ evidence_id, value }) => [evidence_id, value]),
    [['E_181', true], ['E_91', false]]);
});

test('clarification asks for meaning while pending evidence remains available', () => {
  for (const input of ['My body is not feeling right.', 'Feeling tired tired.', 'Not able to explain properly.'])
    assert.match(clarifyWording(input)!, /experiencing/);
  assert.match(clarifyWording('Head spinning')!, /spinning/);
  assert.match(clarifyPain('Pain coming sometimes.')!, /Where/);
  assert.equal(clarifyPain('My hed is paining.'), null);
  const first = { requestId: 'first', proposal: understand('Loose motion after supper.', scriptedVocabulary).proposal };
  const pending = reviewProposal(null, first);
  assert.equal(reviewProposal(pending, { requestId: 'next', proposal: understand('Head spinning', scriptedVocabulary).proposal }), pending);
  assert.deepEqual(pending?.sources, [first]);
});
