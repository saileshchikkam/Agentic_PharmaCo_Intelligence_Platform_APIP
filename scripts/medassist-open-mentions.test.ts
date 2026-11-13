import assert from 'node:assert/strict';
import test from 'node:test';
import { captureOpenMentions, openMentionExport, reconcileOpenMentions } from '../src/features/medassist-conversation/open-symptom';
import { scriptedVocabulary } from '../src/features/medassist-conversation/scripted';
import { understand } from '../src/features/medassist-conversation/understanding';

function capture(text: string, requestId = 'turn-1', turn = 1) {
  const analysis = understand(text, scriptedVocabulary);
  return { analysis, mentions: captureOpenMentions({ text, requestId, turn, unmapped: analysis.proposal.unmapped }) };
}

test('prospective ten-family unsupported descriptions become source-grounded open mentions', () => {
  const examples: [string, string][] = [
    ['head_nervous_balance', 'Room is spinning when I stand.'], ['eyes_ears', 'My ears are ringing.'],
    ['nose_mouth_throat', 'Mouth has painful ulcers.'], ['respiratory', 'Breathing feels heavy after stairs.'],
    ['chest_cardiovascular', 'Heart beats fast sometimes.'], ['digestive', 'Stomach is full and gassy.'],
    ['urinary_reproductive', 'Burning while passing urine.'], ['muscles_joints_limbs', 'My hands are swollen.'],
    ['skin_allergic', 'Red itchy bumps came on skin.'], ['general_mental_behavioral', 'Mind is racing, cannot sleep.'],
  ];
  for (const [family, text] of examples) {
    const { mentions } = capture(text);
    assert.ok(mentions.some(mention => mention.mention.family === family), `${family}: ${text}`);
    for (const mention of mentions) {
      assert.equal(mention.eligible_for_model_a, false);
      assert.equal(mention.mention.mapping, null);
      assert.equal(text.slice(mention.mention.source_start, mention.mention.source_end), mention.mention.description);
    }
  }
});

test('mixed supported and unsupported complaints remain separate', () => {
  const { analysis, mentions } = capture('My ears are ringing and I have a cough.');
  assert.ok(analysis.proposal.observations.some(item => item.evidence_id === 'E_201' && item.value === true));
  assert.ok(mentions.some(mention => /ears are ringing/i.test(mention.mention.description)));
  assert.ok(mentions.every(mention => mention.mention.mapping === null && mention.eligible_for_model_a === false));
});

test('open mentions retain attribution, uncertainty, history and resolution without creating legacy evidence', () => {
  const rows: [string, string, string][] = [
    ['My sister has ear ringing.', 'other_person', 'other_person'],
    ['Maybe my ears are ringing.', 'current', 'needs_clarification'],
    ['My ears were ringing last week.', 'historical_or_resolved', 'historical_or_resolved'],
    ['The ear ringing has stopped now.', 'historical_or_resolved', 'historical_or_resolved'],
  ];
  for (const [text, context, status] of rows) {
    const { analysis, mentions } = capture(text);
    assert.equal(analysis.proposal.observations.length, 0, text);
    assert.ok(mentions.some(mention => mention.mention.subject === (context === 'other_person' ? 'other_person' : 'target') && mention.status === status), text);
  }
});

test('open mentions use stable source identities and do not infer supersession from vague similarity', () => {
  const first = capture('My ears are ringing.', 'turn-1', 1).mentions;
  const second = capture('My ears are ringing again today.', 'turn-2', 2).mentions;
  const merged = reconcileOpenMentions(first, second);
  assert.equal(first[0].id, capture('My ears are ringing.', 'turn-1', 1).mentions[0].id);
  assert.equal(merged.length, first.length + second.length);
  assert.ok(merged.every(mention => mention.supersedes === null && mention.superseded_by === null));
});

test('open mention export separates retained complaints from confirmed evidence and Model A eligibility', () => {
  const mentions = capture('My ears are ringing and I have a cough.').mentions;
  const exported = openMentionExport(mentions);
  assert.equal(exported.schema_version, 'medassist.open-symptom-export.v1');
  assert.ok(exported.items.length > 0);
  assert.ok(exported.items.every(item => item.eligible_for_model_a === false && item.mention.mapping === null));
  assert.ok(exported.items.every(item => item.confirmation !== 'confirmed'));
});
