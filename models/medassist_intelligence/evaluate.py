"""Bounded localhost-only evaluation of ALREADY installed models. Never downloads."""
import json
import statistics
import threading
import time
from pathlib import Path

import httpx
import psutil

from .extraction import HERE, OUTPUT_SCHEMA, SYSTEM, assess, load_suite, promotion_decision

BASE = 'http://127.0.0.1:11434'
MODELS = ('qwen3.5:2b', 'qwen3:4b')


def run(output=None):
    output = Path(output or HERE / 'candidate-results.json')
    if output.exists():
        raise ValueError('existing_evaluation_receipt_preserved')
    suite = load_suite()
    began = time.monotonic()
    with httpx.Client(base_url=BASE, timeout=3, follow_redirects=False, trust_env=False) as client:
        inventory = client.get('/api/tags').raise_for_status().json()['models']
        if client.get('/api/ps').raise_for_status().json().get('models'):
            raise ValueError('existing_loaded_model_not_interrupted')
        version = client.get('/api/version').raise_for_status().json().get('version')
    by_name = {m['name']: m for m in inventory}
    report = {'suite_id': suite['suite_id'], 'runtime_version': version,
              'scope': 'bounded fictional development screen; not clinical validation',
              'inventory': [{'name': m['name'], 'digest': m['digest'], 'bytes': m['size'], 'details': m['details']} for m in inventory],
              'unavailable_requested_candidates': ['Qwen3 1.7B', 'MedGemma 4B IT'],
              'configuration': {'temperature': 0, 'seed': 23, 'num_ctx': 2048,
                                'num_predict': 256, 'think': False, 'per_request_seconds': 10,
                                'global_generation_seconds': 120, 'per_model_seconds': 55,
                                'safety_failure_early_stop': True, 'retries': 0},
              'candidates': [], 'downloads': False, 'paid_calls': False,
              'live_provider_changed': False, 'memory_measurement': 'sampled Ollama process RSS aggregate and per-model API size_vram; not precise CUDA allocation/total system peak'}
    # Screen injection, negation, UNKNOWN and typed bounds first; no tuning after results.
    priority = [44, 16, 24, 39, 0, 8]
    ordered = [suite['cases'][i] for i in priority] + [c for i, c in enumerate(suite['cases']) if i not in priority]
    for name in MODELS:
        candidate = {'name': name, 'results': [], 'status': 'not_run'}
        report['candidates'].append(candidate)
        if name not in by_name:
            candidate['status'] = 'not_installed'
            continue
        if time.monotonic() - began >= 120:
            candidate['status'] = 'global_budget_exhausted'
            continue
        candidate['digest'] = by_name[name]['digest']
        model_start = time.monotonic()
        stop = threading.Event()
        memory = {'rss': None, 'gpu': None}

        def sample():
            with httpx.Client(base_url=BASE, timeout=1, trust_env=False) as monitor:
                while not stop.is_set():
                    try:
                        rss = sum(p.memory_info().rss for p in psutil.process_iter(['name'])
                                  if 'ollama' in (p.info['name'] or '').lower())
                        memory['rss'] = max(memory['rss'] or 0, rss)
                        current = monitor.get('/api/ps').json().get('models', [])
                        for m in current:
                            if m.get('name') == name:
                                memory['gpu'] = max(memory['gpu'] or 0, m.get('size_vram', 0))
                    except (httpx.HTTPError, psutil.Error, ValueError):
                        pass
                    stop.wait(.25)

        monitor = threading.Thread(target=sample, daemon=True)
        monitor.start()
        try:
            with httpx.Client(base_url=BASE, trust_env=False, follow_redirects=False) as client:
                for case in ordered:
                    remaining = min(120 - (time.monotonic() - began), 55 - (time.monotonic() - model_start))
                    if remaining < 1:
                        candidate['status'] = 'budget_exhausted_incomplete'
                        break
                    started = time.monotonic()
                    row = {'case_id': case['case_id'], 'group': case['group']}
                    try:
                        response = client.post('/api/chat', timeout=min(10, remaining), json={
                            'model': name, 'stream': False, 'think': False, 'format': OUTPUT_SCHEMA,
                            'options': {'temperature': 0, 'seed': 23, 'num_ctx': 2048, 'num_predict': 256},
                            'keep_alive': '30s', 'messages': [{'role': 'system', 'content': SYSTEM},
                                {'role': 'user', 'content': json.dumps({k: case[k] for k in ['text', 'context', 'pending_question']})}],
                        }).raise_for_status().json()
                        raw = json.loads(response['message']['content'])
                        row.update(assess(raw, case, suite))
                        row.update({'load_ms': response.get('load_duration', 0) / 1e6,
                                    'generated_tokens': response.get('eval_count'),
                                    'first_token_ms': None})  # nonstreamed; cannot infer TTFT
                    except (httpx.HTTPError, ValueError, KeyError):
                        row.update({'transport_error': True, 'schema_valid': False, 'contract_valid': False, 'exact_match': False})
                    row.update({'elapsed_ms': round((time.monotonic() - started) * 1000, 2),
                                'peak_process_rss_bytes': memory['rss'], 'peak_gpu_bytes': memory['gpu']})
                    candidate['results'].append(row)
                    # Do not waste a full suite after a demonstrated safety/contract failure.
                    if row.get('transport_error') or not row.get('schema_valid') or not row.get('contract_valid') or row.get('unsupported_assertions') or row.get('wrong_polarity_or_unknown'):
                        candidate['status'] = 'failed_screen_stopped_without_retry'
                        break
                else:
                    candidate['status'] = 'single_pass_only_repetition_gate_open'
        finally:
            stop.set(); monitor.join(timeout=2)
            # Only unload the model this run loaded; preexisting loaded models were refused above.
            try:
                with httpx.Client(base_url=BASE, timeout=5, trust_env=False) as cleanup:
                    cleanup.post('/api/generate', json={'model': name, 'keep_alive': 0})
            except httpx.HTTPError:
                candidate['unload_confirmed'] = False
        rows = candidate['results']
        warm = [r['elapsed_ms'] for r in rows[1:]]
        candidate['observations'] = {'attempts': len(rows), 'schema_valid': sum(bool(r.get('schema_valid')) for r in rows),
            'contract_valid': sum(bool(r.get('contract_valid')) for r in rows),
            'exact_outputs': sum(bool(r.get('exact_match')) for r in rows),
            'unsupported_assertions': sum(r.get('unsupported_assertions', 0) for r in rows),
            'wrong_polarity_or_unknown': sum(r.get('wrong_polarity_or_unknown', 0) for r in rows),
            'warm_p50_ms': statistics.median(warm) if warm else None,
            'warm_p95_ms': sorted(warm)[max(0, int(.95 * len(warm) + .999) - 1)] if warm else None,
            'warm_sample_size': len(warm), 'reliability_observed': sum(not r.get('transport_error', False) for r in rows) / max(1, len(rows)),
            'peak_process_rss_bytes': memory['rss'], 'peak_model_size_vram_bytes': memory['gpu']}
        candidate['decision'] = promotion_decision(rows, suite)
        print(json.dumps({'candidate': name, 'status': candidate['status'], 'attempts': len(rows)}), flush=True)
    with httpx.Client(base_url=BASE, timeout=3, trust_env=False) as client:
        report['loaded_models_after'] = [m['name'] for m in client.get('/api/ps').json().get('models', [])]
    report['elapsed_seconds'] = round(time.monotonic() - began, 2)
    output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'receipt_written', 'provider_enabled': False, 'seconds': report['elapsed_seconds']}))
    return report


if __name__ == '__main__':
    run()
