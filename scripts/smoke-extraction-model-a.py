"""Explicit fictional loopback smoke against the existing running preview, no test data."""
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path('models/medassist_intelligence/reliability-v1')


def post(endpoint, payload):
    request = urllib.request.Request('http://127.0.0.1:3000/api/research/model-a/' + endpoint,
        data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:3000'})
    with urllib.request.urlopen(request, timeout=65) as response:
        return json.load(response)


def main():
    target = ROOT / 'integration-smoke.json'
    if target.exists():
        raise ValueError('preserve_existing_receipt')
    selection = json.loads((ROOT / 'selection.json').read_text())['selected']
    at = time.perf_counter()
    extraction = post('extract', {'schema_version': 'medassist.extract-request.v1', 'fictional_only': True, 'text': 'I have a cough.'})
    extraction_ms = (time.perf_counter() - at) * 1000
    assert extraction['provenance']['provider'] == 'ollama-local'
    if selection:
        assert extraction['suggestion'] and extraction['provenance']['model'] == selection['model']
        initial = extraction['suggestion']['items'][0]
    else:
        assert extraction['suggestion'] is None and extraction['reason'] == 'clarification_required'
        # Explicit authored structured confirmation exercises the independent Model A path.
        initial = {'evidence_id': 'E_201', 'state': 'confirmed', 'value': True}
    request = {'schema_version': 'model-a.request.v1', 'fictional_case': True, 'context': {'age': 35, 'source_sex': 'F'},
               'initial': initial, 'answers': [], 'stop': None}
    first = post('interview', request)
    question = first['selection']['question']
    assert question and question['evidence_id'] != initial['evidence_id']
    request['answers'].append({'evidence_id': question['evidence_id'], 'state': 'unknown', 'value': None})
    second = post('interview', request)
    assert second['selection']['question']['evidence_id'] != question['evidence_id']
    request['stop'] = 'user_stopped'
    final = post('interview', request)
    handoff = final['handoff']
    assert handoff['schema_version'] == 'model-a-to-b.evidence.v1' and handoff['model_b_status'] == 'not_enabled'
    assert len(handoff['items']) == 223
    answered = next(i for i in handoff['items'] if i['evidence_id'] == question['evidence_id'])
    assert answered['status'] == 'unknown' and answered['value'] is None
    receipt = {'status': 'passed', 'actual_local_llm': True, 'selected_provider_pipeline': bool(selection),
        'unqualified_extraction_withheld': not bool(selection), 'model': extraction['provenance']['model'],
        'extraction_ms': round(extraction_ms, 2), 'actual_model_a': True,
        'initial_source': 'user_confirmed_llm_proposal' if selection else 'independent_authored_structured_confirmation',
        'questions': [question['evidence_id'], second['selection']['question']['evidence_id']],
        'unknown_preserved': True, 'duplicate_question_prevented': True, 'handoff_items': 223,
        'handoff_version': handoff['schema_version'], 'model_b': 'not_enabled', 'locked_test_and_ledger': 'not_accessed'}
    target.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
