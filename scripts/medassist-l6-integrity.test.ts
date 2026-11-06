import assert from 'node:assert/strict';
import test from 'node:test';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { constrainContext, understand } from '../src/features/medassist-conversation/understanding';
import { reviewProposal } from '../src/features/medassist-conversation/pending-proposal';

const cases: [string, string[]][] = [
  ['I have no fever or cough.', ['201-', '91-']],
  ['I have pain and no nausea.', ['148-', '53+']],
  ['I have no fever and I am coughing.', ['201+', '91-']],
  ['No fever and cough persists.', ['201+', '91-']],
  ['No fever, cough.', ['91-']],
  ['Maybe fever, chills.', ['91?']],
  ['Either fever or chills.', []],
  ['Possible fever.', ['91?']],
  ['I might have chills but my throat is sore.', ['94?', '97+']],
  ['Hard to tell whether I have nausea.', ['148?']],
  ['I had fever last night, but it stopped.', []],
  ['I have had nausea throughout today.', ['148+']],
  ['Yesterday I had no chills. Today I have chills.', ['94+']],
  ['My nausea went away, but I have a cough.', ['201+']],
  ['I might become sick tomorrow.', []],
  ['Tomorrow I might develop fever, but now I have chills.', ['94+']],
  ['Would nausea happen if I missed lunch?', []],
  ['My brother has a sore throat, but I am fine.', []],
  ['My sister texted me that her throat is sore, but I have a cough.', ['201+']],
  ['My aunt said “I feel nauseated” and I have chills.', ['94+']],
  ['I have nausea. Actually, I am not sure.', ['148!']],
  ['I feel feverish. Wait, I take that back.', ['91!']],
  ['My throat is sore. Sorry, that was my sister.', []],
  ['I would not say I am not feverish.', []],
  ['No pain apart from an aching back.', []],
  ['I feel nauseated plus an odd taste.', ['148+']],
  ['I am still answering the previous question, and my elbow hurts.', []],
];

for (const [input, expected] of cases) {
  test(input, () => {
    const { proposal, annotations } = understand(input, scriptedVocabulary);
    const actual = proposal.observations.map(item => item.evidence_id.slice(2) +
      (item.state === 'unknown' ? '?' : item.state === 'contradiction' ? '!' : item.value ? '+' : '-'));
    assert.deepEqual(actual.sort(), [...expected].sort());
    for (const item of proposal.observations) assert.ok(input.includes(item.quote));
    for (const annotation of annotations) assert.equal(input.slice(annotation.start, annotation.end), annotation.quote);
    if (input.includes('odd taste')) assert.ok(proposal.unmapped.some(item => item.quote.includes('odd taste')));
  });
}

const source = (requestId: string, input: string) => ({ requestId, proposal: understand(input, scriptedVocabulary).proposal });
test('a failed clarification preserves pending evidence and its original source', () => {
  const initial = source('first', 'Diarhoea and my arm feels odd.');
  const pending = reviewProposal(null, initial);
  assert.ok(pending);
  assert.equal(reviewProposal(pending, source('clarification', 'My elbow feels odd.')), pending);
  assert.deepEqual(pending.sources, [initial]);
});

test('compatible additions preserve request provenance and deduplicate matching evidence', () => {
  const initial = source('first', 'I have diarrhea.');
  const pending = reviewProposal(null, initial);
  const mixed = reviewProposal(pending, source('second', 'I have diarrhea and nausea.'));
  assert.deepEqual(mixed?.sources.map(({ requestId, proposal }) =>
    [requestId, proposal.observations.map(item => [item.evidence_id, item.quote])]),
    [['first', [['E_51', 'I have diarrhea']]], ['second', [['E_148', 'nausea']]]]);
});

test('incompatible additions stay separate until an explicit review choice', () => {
  const first = source('first', 'I have nausea.');
  const second = source('second', 'I have no nausea.');
  const pending = reviewProposal(null, first);
  const conflict = reviewProposal(pending, second);
  assert.deepEqual(conflict, { sources: [first], alternative: second });
  assert.equal(reviewProposal(conflict, source('third', 'I have chills.')), conflict);
});

test('source validation rejects a positive with the coordinated denial removed from its quote', () => {
  const raw = source('provider', 'I have cough.').proposal;
  raw.observations[0].quote = 'cough';
  assert.equal(constrainContext(raw, 'No fever or cough.', scriptedVocabulary, null), null);
});
