import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapCompactExtraction } from '../src/features/medassist-intelligence/compact-extraction';
import { makeEnvelope, readExtractionEnvelope } from '../src/features/medassist-intelligence/medgemma';
import { readQualifiedSelection, qualifySelection } from '../server/local-extraction-selection';
const empty = { cough: 'missing', fever: 'missing', sore_throat: 'missing', issue: 'none' };
test('compact output maps only fixed supported IDs and preserves exact null/false states', () => {
  for (const [state, wanted, value] of [['present','confirmed',true], ['absent','confirmed',false], ['unknown','unknown',null], ['conflict','contradiction',null]] as const) {
    const output = mapCompactExtraction({ ...empty, cough: state }, 'cough');
    assert.equal(output?.items[0].evidence_id,'E_201'); assert.equal(output?.items[0].state,wanted); assert.equal(output?.items[0].value,value);
  }
  assert.equal(mapCompactExtraction({...empty, cough:'present'}, 'ear discomfort'),null);
  assert.equal(mapCompactExtraction({...empty, diagnosis:'invented'}, 'cough'),null);
  assert.equal(mapCompactExtraction({...empty, cough:true}, 'cough'),null);
});
test('compact mapping retains mention order and explicit clarification without inventing a duration field', () => {
  const multi = mapCompactExtraction({...empty, cough:'present', fever:'present'}, 'fever and cough');
  assert.deepEqual(multi?.items.map(i=>i.evidence_id),['E_91','E_201']);
  assert.equal(makeEnvelope(multi!, 'fictional-model', 'a'.repeat(64)).suggestion,null);
  for (const [issue, wanted] of [['injection','prompt_injection'],['duration','duration_unsupported'],['unsupported','unsupported'],['missing','missing'],['ambiguous','ambiguous']]) {
    const output=mapCompactExtraction({...empty,issue},'fictional input');
    assert.deepEqual(output?.issues,[wanted]);assert.deepEqual(output?.items,[]);
    assert.equal(mapCompactExtraction({...empty,issue,cough:'present'},'cough'),null);
  }
});
test('qualification can withhold a proposal without changing facts or permitting an upgrade', () => {
  const parsed=mapCompactExtraction({...empty,cough:'present'},'cough')!;
  const envelope=makeEnvelope(parsed,'fictional-unqualified','a'.repeat(64),false);
  assert.equal(envelope.suggestion,null); assert.ok(readExtractionEnvelope(envelope,'cough'));
  assert.equal(readExtractionEnvelope({...envelope,suggestion:{schema_version:'medassist.extraction.v1',items:[{evidence_id:'E_91',state:'confirmed',value:true}]}},'cough'),null);
  assert.equal(readQualifiedSelection('fictional-unqualified','a'.repeat(64)),null);
});
test('provider qualification rejects missing/changed identity, errors, partial results and safety or latency regressions', () => {
  const digest='a'.repeat(64), hash='b'.repeat(64), model='fictional-candidate';
  const selection={comparison_sha256:hash,selected:{model,digest,variant:'compact'}};
  const group={model,variant:'compact',attempts:20,semantic_exact:20,schema_valid:20,errors:0,unsupported_assertions:0,wrong_polarity_or_unknown:0,p95_ms:4000};
  const result={identities:[{model,digest}],groups:[group]};
  assert.equal(qualifySelection(selection,result,hash,model,digest)?.variant,'compact');
  for (const bad of [{attempts:19},{semantic_exact:18},{schema_valid:19},{errors:1},{unsupported_assertions:1},{wrong_polarity_or_unknown:1},{p95_ms:5001},{p95_ms:NaN}])
    assert.equal(qualifySelection(selection,{...result,groups:[{...group,...bad}]},hash,model,digest),null);
  assert.equal(qualifySelection(selection,result,'c'.repeat(64),model,digest),null);
  assert.equal(qualifySelection(selection,result,hash,model,'d'.repeat(64)),null);
  assert.equal(qualifySelection({...selection,selected:null},result,hash,model,digest),null);
});
