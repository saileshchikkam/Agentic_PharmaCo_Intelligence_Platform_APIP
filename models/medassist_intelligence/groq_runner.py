"""Explicit backend-only, free-plan-gated fictional evaluation; no live route enablement."""
import hashlib
import json
import math
from pathlib import Path
import time

from .groq_access import accessible_models, backend_key, request_json
from .sparse_extraction import PROMPT, SCHEMA, score

ROOT = Path(__file__).parent / 'groq-v1'


def run():
    if (ROOT / 'results.json').exists() or (ROOT / 'responses.json').exists():
        raise ValueError('PRESERVE_EXISTING_GROQ_RESULTS')
    authorization = json.loads((ROOT / 'execution-approval.json').read_text())
    if authorization.get('plan') != 'free' or authorization.get('billable_usage_allowed') is not False or authorization.get('operator_confirmed') is not True:
        raise ValueError('FREE_PLAN_NOT_CONFIRMED')
    review = json.loads((ROOT / 'review.json').read_text())
    candidate = (ROOT / 'suite-candidate.json').read_bytes()
    if review['status'] != 'approved_by_user' or review['suite_sha256'] != hashlib.sha256(candidate).hexdigest():
        raise ValueError('MANUAL_REVIEW_NOT_VERIFIED')
    data = (ROOT / 'suite.json').read_bytes()
    if hashlib.sha256(data).hexdigest() != (ROOT / 'suite.sha256').read_text().split()[0]:
        raise ValueError('FROZEN_SUITE_CHANGED')
    suite = json.loads(data)
    if suite['cases'] != json.loads(candidate)['cases'] or len(suite['cases']) != 20:
        raise ValueError('REVIEWED_CASES_CHANGED')
    plan = json.loads((ROOT / 'protocol.json').read_text())
    if (ROOT / 'prompt.txt').read_text().rstrip() != PROMPT.rstrip() or json.loads((ROOT / 'schema.json').read_text()) != SCHEMA:
        raise ValueError('FROZEN_PROMPT_OR_SCHEMA_CHANGED')
    key = backend_key()
    available = accessible_models(key)
    models = [m for m in plan['model_priority'] if m in available][:3]
    (ROOT / 'inventory.json').write_text(json.dumps({'available_model_ids': available,
        'prioritized_available': models, 'billing_verification': 'operator-confirmed Free plan, not supplied by model-list API'}, indent=2) + '\n')
    start = time.perf_counter(); last = None; history = []; rows = []; stop = None
    try:
        for model in models:
            for case in suite['cases']:
                now = time.perf_counter()
                # Four RPM plus conservative rolling actual usage; no automatic retries.
                delay = max(0, 15 - (now - last)) if last is not None else 0
                recent = [(at, tokens) for at, tokens in history if now - at < 60]
                if sum(t for _, t in recent) > 5500:
                    delay = max(delay, 61 - (now - recent[0][0]))
                if now - start + delay > plan['total_budget_seconds']:
                    stop = 'TOTAL_BUDGET_EXHAUSTED'; break
                if delay:
                    time.sleep(min(delay, 60))
                at = time.perf_counter(); last = at
                raw = None; error = None; usage = {}; headers = {}
                try:
                    response, headers = request_json(key, 'chat/completions', {
                        'model': model, 'temperature': 0, 'max_completion_tokens': plan['max_completion_tokens'],
                        'reasoning_effort': 'low', 'stream': False,
                        'messages': [{'role': 'system', 'content': PROMPT}, {'role': 'user',
                            'content': 'INPUT_JSON\n' + json.dumps({'fictional_only': True, 'text': case['text']})}],
                        'response_format': {'type': 'json_schema', 'json_schema': {'name': 'sparse_symptom_extraction', 'strict': True, 'schema': SCHEMA}}})
                    usage = {k: v for k, v in response.get('usage', {}).items() if k in ('prompt_tokens', 'completion_tokens', 'total_tokens')}
                    raw = json.loads(response['choices'][0]['message']['content'])
                    history.append((at, usage.get('total_tokens', 2000)))
                except (ValueError, KeyError, IndexError, TypeError):
                    # Only categorical safe errors; never headers/bodies or hidden reasoning.
                    error = 'REQUEST_OR_OUTPUT_REJECTED'
                    stop = 'PROVIDER_REQUEST_REJECTED_NO_RETRIES'
                elapsed = (time.perf_counter() - at) * 1000
                rows.append({'model': model, 'case_id': case['case_id'], 'elapsed_ms': round(elapsed, 2),
                    'output': raw, 'error': error, 'usage': usage, 'quota_headers': headers, **score(raw, case)})
                print(json.dumps({'model': model, 'completed': sum(r['model'] == model for r in rows), 'maximum': 20,
                                  'semantic_exact': rows[-1]['semantic_exact'], 'error': error}), flush=True)
                if stop:
                    break
            if stop:
                break
    finally:
        (ROOT / 'responses.json').write_text(json.dumps({'fictional_only': True, 'rows': rows}, indent=2) + '\n')
    groups = []
    for model in models:
        rs = [r for r in rows if r['model'] == model]; times = sorted(r['elapsed_ms'] for r in rs)
        group = {'model': model, 'attempts': len(rs), 'expected_cases': 20, 'semantic_correct': sum(r['semantic_exact'] for r in rs),
            'schema_and_span_valid': sum(r['schema_and_span_valid'] for r in rs),
            'median_ms': times[math.ceil(len(times) * .5) - 1] if times else None,
            'p95_ms': times[math.ceil(len(times) * .95) - 1] if times else None,
            'errors': sum(r['error'] is not None for r in rs)}
        for field in ['unsupported_assertions', 'polarity_errors', 'omitted_observations', 'omission_unknown_confusion', 'unmapped_omissions', 'unmapped_assertions']:
            group[field] = sum(r[field] for r in rs)
        group['qualified'] = len(rs) == 20 and group['semantic_correct'] >= 19 and group['schema_and_span_valid'] == 20 and group['p95_ms'] <= 5000 and not group['errors'] and not any(group[f] for f in ['unsupported_assertions', 'polarity_errors', 'omitted_observations', 'omission_unknown_confusion', 'unmapped_omissions', 'unmapped_assertions'])
        groups.append(group)
    result = {'status': 'completed' if stop is None else 'stopped', 'stop_reason': stop, 'groups': groups,
        'suite_sha256': hashlib.sha256(data).hexdigest(), 'inference_requests': len(rows), 'retries': 0,
        'selected_provider': None, 'live_enablement': False, 'clinical_validation': False}
    (ROOT / 'results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result), flush=True)


if __name__ == '__main__':
    try:
        run()
    except (ValueError, FileNotFoundError):
        print(json.dumps({'status': 'blocked', 'reason': 'PRECONDITIONS_NOT_SATISFIED', 'live_enablement': False}), flush=True)
