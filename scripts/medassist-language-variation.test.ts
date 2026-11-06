import assert from 'node:assert/strict';
import test from 'node:test';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { reportedDetails, understand } from '../src/features/medassist-conversation/understanding';
import { evaluateStatement } from '../src/features/medassist-safety/safety';

// The brief supplied exact text for T09, T11, T17, T19, T21 and T23.
// Other rows are newly authored development examples in the requested groups.
// + and - are proposals for presence and absence, ? is UNKNOWN, ! is conflict.
const cases = [
  ['T01', 'I have a fever.', '91+'],
  ['T02', 'Feeling feverish', '91+'],
  ['T03', 'fever', '91+'],
  ['T04', 'I have a cough.', '201+'],
  ['T05', 'I am coughing.', '201+'],
  ['T06', 'coughng', '201+'],
  ['T07', 'cogh', '201+'],
  ['T08', 'fever cough', '91+ 201+'],
  ['T09', 'My head is paining badly from morning.', '53+'],
  ['T10', 'Head paining', '53+'],
  ['T11', 'Feeling like vomiting but not vomiting', '148+'],
  ['T12', 'I feel like vomiting but I am not vomiting.', '148+'],
  ['T13', 'Loose motion', '51+'],
  ['T14', 'Nose water coming', '181+'],
  ['T15', 'Feeling giddy', ''],
  ['T16', 'Body hot', ''],
  ['T17', 'I have fever but no cough.', '91+ 201-'],
  ['T18', 'Not vomiting', ''],
  ['T19', "I don't know whether I have fever.", '91?'],
  ['T20', 'I am not sure whether I have fever.', '91?'],
  ['T21', 'I have a cough. Actually no, I am not coughing.', '201!'],
  ['T22', "I have a headache. Actually I don't.", '53!'],
  ['T23', 'I had fever yesterday, but now it is gone.', ''],
  ['T24', 'Body no good', ''],
  ['T25', 'sore thrt chills', '94+ 97+'],
  ['T26', 'Maybe cough', '201?'],
  ['T27', 'I have a cough or a fever.', ''],
  ['T28', 'My fictional ankle feels odd.', ''],
  ['T29', 'No fever, but coughing.', '91- 201+'],
  ['T30', 'I cannot breathe.', 'emergency'],
  ['T31', 'I need an ambulance. I have a cough.', 'emergency'],
  ['T32', "I don't have chest pain, but I feel breathless.", ''],
  ['T33', 'My brother has a fever.', ''],
  ['T34', 'What if I get a cough?', ''],
  ['T35', 'I think I have pneumonia.', ''],
] as const;

function analyze(input: string) {
  const analysis = understand(input, scriptedVocabulary);
  const evidence = analysis.proposal.observations.map(({ evidence_id, state, value }) => {
    const symbol = state === 'unknown' ? '?' : state === 'contradiction' ? '!' : value ? '+' : '-';
    return evidence_id.slice(2) + symbol;
  }).sort((a, b) => Number.parseInt(a) - Number.parseInt(b)).join(' ');
  return { ...analysis, evidence };
}

for (const [id, input, expected] of cases) {
  test(id + ' ' + input, () => {
    const safety = evaluateStatement(input);
    if (expected === 'emergency') {
      assert.equal(safety.status, 'escalate');
      assert.equal(safety.suppress_ordinary_flow, true);
      return;
    }
    assert.equal(safety.status, 'not_assessed');
    const actual = analyze(input);
    assert.equal(actual.validation_failed, false);
    assert.equal(actual.evidence, expected);
    for (const annotation of actual.annotations) {
      assert.equal(input.slice(annotation.start, annotation.end), annotation.quote);
    }
    for (const item of actual.proposal.observations) assert.ok(input.includes(item.quote));
    if (!expected) assert.ok(actual.proposal.unmapped.length);
    if (id === 'T09') assert.ok(reportedDetails(input).some(d => d.kind === 'onset' && d.quote === 'from morning'));
    if (id === 'T11' || id === 'T12' || id === 'T18') {
      assert.ok(actual.proposal.unmapped.some(d => d.kind === 'unsupported' && /not vomiting/i.test(d.quote)));
    }
    if (id === 'T23') assert.ok(actual.annotations.some(d => d.context === 'historical_or_resolved'));
  });
}

test('equivalent wording preserves evidence, while changes in meaning change the proposal', () => {
  for (const group of [
    ['I have a fever.', 'Feeling feverish', 'fever'],
    ['I have a cough.', 'I am coughing.', 'coughng', 'cogh'],
    ['I have a headache.', 'Head paining', 'My head is paining badly from morning.'],
    ['I feel nauseated.', 'Feeling like vomiting', 'I feel like throwing up.'],
    ['I have diarrhea.', 'Loose motion'],
  ]) {
    const [reference, ...variants] = group.map(input => analyze(input).evidence);
    assert.ok(reference);
    for (const variant of variants) assert.equal(variant, reference);
  }
  for (const [input, expected] of [
    ['I have fever.', '91+'], ['I have no fever.', '91-'], ['Maybe fever.', '91?'],
    ['I had fever yesterday.', ''], ['I have a cough.', '201+'],
  ]) assert.equal(analyze(input).evidence, expected);
});
