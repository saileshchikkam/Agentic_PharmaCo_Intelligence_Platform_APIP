"""Bounded fictional-transcript profiling; stdout aggregates only, no output-file writes."""
import argparse
from datetime import datetime, timezone
import importlib.metadata
import json
import os
import statistics
import threading
import time
import tracemalloc

from fastapi.testclient import TestClient
import numpy as np
import psutil

from ..training.data import file_hash
from ..validation import read_json
from .. import questioning_protocol as ref
from .app import create_app
from .schemas import NextRequest
from .service import load_preserved


def distribution(values):
    ordered = sorted(values)
    return {'n':len(values), 'median_ms':statistics.median(ordered),
            'p95_ms':float(np.percentile(ordered,95)), 'min_ms':ordered[0], 'max_ms':ordered[-1]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--iterations', type=int, default=100)
    args = parser.parse_args()
    if not 20 <= args.iterations <= 500:
        raise SystemExit('iterations must be between 20 and 500')
    process = psutil.Process()
    baseline = process.memory_info().rss
    samples = [baseline]
    done = threading.Event()
    def sample():
        while not done.wait(.005):
            samples.append(process.memory_info().rss)
    sampler = threading.Thread(target=sample, daemon=True)
    sampler.start()
    tracemalloc.start()
    try:
        start = time.perf_counter()
        service = load_preserved(os.environ['MEDASSIST_A_RUN_ROOT'], os.environ['MEDASSIST_A_METADATA_ROOT'])
        startup = time.perf_counter()-start
        loaded_rss = process.memory_info().rss
        initial = next(eid for eid,d in service.definitions.items()
                       if d['kind']=='symptom' and d['data_type']=='B' and eid not in ref.EDGES)
        # Authored disclosed answers only; no source patient, validation cache or oracle reads.
        requests = []
        for age in (0,4,16,35,75):
            for sex in ('M','F'):
                for state,value in (('unknown',None),('confirmed',False),('confirmed',True)):
                    requests.append(NextRequest.model_validate({
                        'schema_version':'model-a.request.v1', 'fictional_case':True,
                        'context':{'age':age,'source_sex':sex},
                        'initial':{'evidence_id':initial,'state':'confirmed','value':True},
                        'answers':[{'evidence_id':'E_53','state':state,'value':value}]}))
        for request in requests[:3]:
            assert service.next(request).status == 'question'
        # Python allocation tracing substantially affects latency: stop it for timed calls.
        _, python_peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        direct = []
        for i in range(args.iterations):
            start = time.perf_counter()
            result = service.next(requests[i % len(requests)])
            direct.append((time.perf_counter()-start)*1000)
            assert result.status == 'question'
        http = []
        token = 'benchmark-fictional-private-token-'*2
        with TestClient(create_app(service=service, enabled=True, token=token),
                        base_url='http://127.0.0.1', client=('127.0.0.1', 123),
                        headers={'Authorization':'Bearer '+token}) as api:
            for i in range(args.iterations):
                start = time.perf_counter()
                result = api.post('/research/model-a/v1/next', json=requests[i % len(requests)].model_dump())
                http.append((time.perf_counter()-start)*1000)
                assert result.status_code == 200 and result.json()['status'] == 'question'
        samples.append(process.memory_info().rss)
    finally:
        done.set(); sampler.join()
        if tracemalloc.is_tracing():
            tracemalloc.stop()
    # Verify preservation after profiling; exclude this disk hashing from timing/memory sampling.
    from pathlib import Path
    root = Path(os.environ['MEDASSIST_A_RUN_ROOT'])
    receipt = read_json(ref.HERE/'task4b-aggregate.json')
    assert all(file_hash(root/name)==digest for name,digest in receipt['artifact_hashes'].items())
    print(json.dumps({'schema_version':'model-a.benchmark.v1', 'timestamp_utc':datetime.now(timezone.utc).isoformat(),
                      'scope':'30 authored disclosed transcripts; no patient records or clinical relevance assessment',
                      'loaded_model':'selected_alpha_1e-5', 'startup_including_17_artifact_hashes_seconds':startup,
                      'startup_python_tracing_enabled':True, 'timed_latency_tracing_enabled':False,
                      'direct':distribution(direct), 'in_process_http':distribution(http),
                      'rss_before_load_bytes':baseline, 'rss_after_load_bytes':loaded_rss,
                      'sampled_peak_rss_bytes':max(samples), 'rss_sample_interval_ms':5,
                      'startup_and_warmup_python_peak_bytes':python_peak,
                      'all_17_artifacts_unchanged_after':True, 'official_patient_rows_opened':0,
                      'versions':{n:importlib.metadata.version(n) for n in
                                  ('fastapi','starlette','pydantic','uvicorn','httpx','psutil','scikit-learn','numpy','scipy')}},
                     indent=2, allow_nan=False))


if __name__ == '__main__':
    main()
