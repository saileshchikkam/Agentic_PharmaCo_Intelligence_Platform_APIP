"""Explicit user-requested continuation: never repeat an attempted model/case pair."""
import hashlib
import json
import math
import time
from .groq_access import accessible_models, backend_key, request_json
from .groq_runner import ROOT
from .sparse_extraction import PROMPT, SCHEMA, score


def run():
    if (ROOT / 'continuation-results.json').exists() or (ROOT / 'continuation-responses.json').exists():
        raise ValueError('PRESERVE_EXISTING_CONTINUATION')
    prior = json.loads((ROOT / 'responses.json').read_text())['rows']
    plan = json.loads((ROOT / 'protocol.json').read_text())
    approval = json.loads((ROOT / 'execution-approval.json').read_text())
    if approval['plan'] != 'free' or approval['operator_confirmed'] is not True or approval['billable_usage_allowed'] is not False:
        raise ValueError('FREE_PLAN_NOT_CONFIRMED')
    data = (ROOT / 'suite.json').read_bytes(); suite = json.loads(data)
    if hashlib.sha256(data).hexdigest() != (ROOT / 'suite.sha256').read_text().split()[0]:
        raise ValueError('FROZEN_SUITE_CHANGED')
    if (ROOT / 'prompt.txt').read_text().rstrip() != PROMPT.rstrip() or json.loads((ROOT / 'schema.json').read_text()) != SCHEMA:
        raise ValueError('FROZEN_TASK_CHANGED')
    review = json.loads((ROOT / 'review.json').read_text())
    if review['status'] != 'approved_by_user' or review['suite_sha256'] != hashlib.sha256((ROOT / 'suite-candidate.json').read_bytes()).hexdigest():
        raise ValueError('REVIEW_CHANGED')
    key = backend_key(); available = accessible_models(key)
    models = [m for m in plan['model_priority'] if m in available][:3]
    attempted = {(r['model'], r['case_id']) for r in prior}
    if len(attempted) != len(prior):
        raise ValueError('DUPLICATE_PRIOR_ATTEMPTS')
    # Conservatively charge every prior attempt for pacing plus its full timeout.
    budget = plan['total_budget_seconds'] - len(prior) * (15 + plan['request_timeout_seconds'])
    start = time.perf_counter(); last = None; added = []; stop = None
    (ROOT / 'continuation.json').write_text(json.dumps({'authorization': 'user explicitly requested continuation of interrupted work',
        'prior_attempts': len(prior), 'prior_failed_case_retries': 0, 'maximum_additional_attempts': 60 - len(prior),
        'active_budget_seconds_remaining_conservative': budget, 'unchanged_prompt_schema_suite': True}, indent=2) + '\n')
    try:
        for model in models:
            for case in suite['cases']:
                if (model, case['case_id']) in attempted:
                    continue
                now = time.perf_counter(); delay = max(0, 15 - (now - last)) if last is not None else 0
                if now - start + delay + 15 > budget:
                    stop = 'ACTIVE_BUDGET_EXHAUSTED'; break
                if delay:
                    time.sleep(delay)
                at = time.perf_counter(); last = at; raw = None; error = None; usage = {}; headers = {}
                try:
                    response, headers = request_json(key, 'chat/completions', {'model': model, 'temperature': 0,
                        'max_completion_tokens': plan['max_completion_tokens'], 'reasoning_effort': 'low', 'stream': False,
                        'messages': [{'role': 'system', 'content': PROMPT}, {'role': 'user', 'content': 'INPUT_JSON\n' + json.dumps({'fictional_only': True, 'text': case['text']})}],
                        'response_format': {'type': 'json_schema', 'json_schema': {'name': 'sparse_symptom_extraction', 'strict': True, 'schema': SCHEMA}}})
                    usage = {k: v for k, v in response.get('usage', {}).items() if k in ('prompt_tokens', 'completion_tokens', 'total_tokens')}
                    raw = json.loads(response['choices'][0]['message']['content'])
                except ValueError as failure:
                    category = str(failure)
                    error = category if category.startswith('GROQ_') else 'OUTPUT_JSON_REJECTED'
                    if category in ('GROQ_HTTP_401', 'GROQ_HTTP_402', 'GROQ_HTTP_403', 'GROQ_HTTP_429'):
                        stop = 'ACCESS_PAYMENT_OR_QUOTA_REJECTED_NO_RETRIES'
                except (KeyError, IndexError, TypeError):
                    error = 'OUTPUT_STRUCTURE_REJECTED'
                row = {'model': model, 'case_id': case['case_id'], 'elapsed_ms': round((time.perf_counter() - at) * 1000, 2),
                    'output': raw, 'error': error, 'usage': usage, 'quota_headers': headers, **score(raw, case)}
                added.append(row); attempted.add((model, case['case_id']))
                print(json.dumps({'model': model, 'completed_including_original': sum(r['model'] == model for r in prior + added),
                    'maximum': 20, 'semantic_exact': row['semantic_exact'], 'error': error}), flush=True)
                if stop:
                    break
            if stop:
                break
    finally:
        (ROOT / 'continuation-responses.json').write_text(json.dumps({'fictional_only': True, 'rows': added}, indent=2) + '\n')
    rows = prior + added; groups = []
    for model in models:
        rs = [r for r in rows if r['model'] == model]; times = sorted(r['elapsed_ms'] for r in rs)
        group = {'model': model, 'attempts': len(rs), 'expected_cases': 20, 'semantic_correct': sum(r['semantic_exact'] for r in rs),
            'schema_and_span_valid': sum(r['schema_and_span_valid'] for r in rs), 'median_ms': times[math.ceil(len(times) * .5) - 1] if times else None,
            'p95_ms': times[math.ceil(len(times) * .95) - 1] if times else None, 'errors': sum(r['error'] is not None for r in rs)}
        fields = ['unsupported_assertions','polarity_errors','omitted_observations','omission_unknown_confusion','unmapped_omissions','unmapped_assertions']
        group.update({f: sum(r[f] for r in rs) for f in fields})
        group['qualified'] = len(rs) == 20 and group['semantic_correct'] >= 19 and group['schema_and_span_valid'] == 20 and group['p95_ms'] <= 5000 and not group['errors'] and not any(group[f] for f in fields)
        groups.append(group)
    result = {'status': 'completed' if stop is None else 'stopped', 'stop_reason': stop, 'groups': groups,
        'suite_sha256': hashlib.sha256(data).hexdigest(), 'inference_requests_including_original': len(rows), 'retries': 0,
        'original_results_preserved': True, 'selected_provider': None, 'live_enablement': False, 'clinical_validation': False}
    (ROOT / 'continuation-results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result), flush=True)


if __name__ == '__main__':
    run()
