import assert from 'node:assert/strict';
import test from 'node:test';
import { readHandoff } from '../src/features/model-a-research/contracts';
import { readNaturalVocabulary, type NaturalRequest } from '../src/features/medassist-conversation/natural';
import { runScriptedInterview, scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { understand } from '../src/features/medassist-conversation/understanding';

const request: NaturalRequest = {
  schema_version: 'medassist.natural-request.v1',
  fictional_only: true,
  context: { age: 35, source_sex: 'F' },
  initial: { evidence_id: 'E_201', state: 'confirmed', value: true },
  initial_disclosures: [{ evidence_id: 'E_91', state: 'confirmed', value: false }],
  turns: [],
  stop: null,
};

test('the scripted vocabulary limits proposals and preserves an explicit negative', () => {
  assert.ok(readNaturalVocabulary(scriptedVocabulary));
  const { proposal } = understand('I have a cough, but no fever.', scriptedVocabulary);
  assert.deepEqual(proposal.observations.map(({ evidence_id, value }) => [evidence_id, value]), [
    ['E_201', true], ['E_91', false],
  ]);
  assert.equal(understand('My ankle feels odd.', scriptedVocabulary).proposal.observations.length, 0);
});

test('scripted questions skip disclosed fields and export unknown separately from negative', () => {
  const first = runScriptedInterview(request);
  assert.equal(first.selection.question?.evidence_id, 'E_97');
  const stopped = runScriptedInterview({
    ...request,
    turns: [{ answer: { evidence_id: 'E_97', state: 'unknown', value: null }, disclosures: [] }],
    stop: 'user_stopped',
  });
  assert.deepEqual(stopped.selection, { status: 'abstained', reason: 'user_stopped', question: null });
  assert.deepEqual(stopped.scriptedEvidence.items, [
    { evidence_id: 'E_201', status: 'observed_positive', value: true },
    { evidence_id: 'E_91', status: 'observed_negative', value: false },
    { evidence_id: 'E_97', status: 'unknown', value: null },
  ]);
  assert.equal(stopped.scriptedEvidence.model_a_inference, false);
  assert.equal(stopped.scriptedEvidence.model_b_status, 'not_enabled');
  assert.equal(readHandoff(stopped.scriptedEvidence), null);
});

test('a conflict stops the script without choosing a value', () => {
  const result = runScriptedInterview({
    ...request,
    turns: [{ answer: { evidence_id: 'E_97', state: 'contradiction', value: null }, disclosures: [] }],
  });
  assert.deepEqual(result.selection, { status: 'abstained', reason: 'unresolved_contradiction', question: null });
  assert.deepEqual(result.scriptedEvidence.items.at(-1), { evidence_id: 'E_97', status: 'contradiction', value: null });
});
