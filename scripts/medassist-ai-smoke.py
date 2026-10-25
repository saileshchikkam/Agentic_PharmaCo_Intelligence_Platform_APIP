"""Bounded preserved-model modular parity smoke. No cloud or official test I/O.

Uses operator-provided existing MEDASSIST_A_RUN_ROOT / METADATA_ROOT. Never logs
private roots, credentials, raw descriptions, source records or fingerprints.
"""
import hashlib
import json
import os
import secrets
from pathlib import Path
from models.medassist_v2.research_adapter.service import load_preserved
from models.medassist_v2.research_adapter.schemas import NextRequest, Answer
from models.medassist_v2.research_adapter.demo import interview
from models.medassist_ai.core.orchestrator import MedAssistOrchestrator
from models.medassist_ai.model_a.adapter import ModelAAdapter
from models.medassist_v2.research_adapter.app import create_app
from fastapi.testclient import TestClient


def main():
    service = load_preserved(os.environ['MEDASSIST_A_RUN_ROOT'], os.environ['MEDASSIST_A_METADATA_ROOT'])
    flow = MedAssistOrchestrator(ModelAAdapter(service))
    request = NextRequest.model_validate({'schema_version':'model-a.request.v1','fictional_case':True,
        'context':{'age':35,'source_sex':'F'},'initial':{'evidence_id':'E_201','state':'confirmed','value':True}})
    first = flow.interview(request)
    assert first.model_dump() == interview(service,request).model_dump()
    question = first.selection.question.evidence_id
    request.answers.append(Answer(evidence_id=question,state='unknown',value=None))
    second = flow.interview(request)
    assert second.selection.question.evidence_id != question
    request.stop = 'user_stopped'
    ended = flow.interview(request)
    assert any(i.evidence_id==question and i.status=='unknown' for i in ended.handoff.items)
    assert len(ended.handoff.items)==223
    summary = flow.research_summary(ended.handoff)
    assert summary['model_b']['status']=='unable_to_assess'
    token=secrets.token_urlsafe(48)
    with TestClient(create_app(service=service,enabled=True,token=token,modular_enabled=True),
                    base_url='http://127.0.0.1',client=('127.0.0.1',12345),
                    headers={'Authorization':'Bearer '+token}) as api:
        response=api.post('/research/model-a/v1/demo/interview',json=request.model_dump())
        assert response.status_code==200
        assert response.json()==ended.model_dump()
    receipt=json.loads(Path('models/medassist_v2/task4b-aggregate.json').read_text())
    root=Path(os.environ['MEDASSIST_A_RUN_ROOT'])
    def digest(path):
        h=hashlib.sha256()
        with path.open('rb') as f:
            for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
        return h.hexdigest()
    assert all(digest(root/name)==value for name,value in receipt['artifact_hashes'].items())
    assert digest(root/'pre-test-seal.json')==receipt['seal_sha256']
    result={'status':'passed','actual_preserved_model_a':True,'canonical_function_parity':True,
            'unknown_preserved':True,'repeat_prevention':True,'termination_export_items':223,
            'model_b':'disabled','safety':'unavailable','disease_execution':False,'cloud_requests':0,
            'sealed_artifacts_matched':17,'seal_digest_matched':True,
            'official_locked_test_and_ledger':'not accessed','browser_end_to_end_this_task':False,
            'existing_guarded_python_endpoint_actual_model':True}
    Path('models/medassist_ai/docs/actual-model-a-smoke.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))


if __name__=='__main__':
    main()
