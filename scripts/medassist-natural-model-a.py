"""Bounded, authored fictional inference and read-only seal verification; no corpus/test access."""
import json
import os
from pathlib import Path
from types import SimpleNamespace

from models.medassist_v2.research_adapter.service import load_preserved, protocol
from models.medassist_v2.research_adapter.natural import NaturalRequest, Turn, interview, vocabulary
from models.medassist_v2.research_adapter.schemas import Answer, NextRequest
from models.medassist_v2.research_adapter.app import create_app
from models.medassist_v2.research_adapter.protocol_integrity import verify_existing_seal as verify_seal
from fastapi.testclient import TestClient


def main():
    output = Path('models/medassist_ai/docs/natural-model-a-observations.json')
    if output.exists():
        raise RuntimeError('preserve_previous_observations')
    root = Path(os.environ['MEDASSIST_A_RUN_ROOT'])
    receipt = json.loads(Path('models/medassist_v2/task4b-aggregate.json').read_text())
    source = SimpleNamespace(mode='official', receipt=receipt['source_hashes'])
    before = verify_seal(root, source, protocol())
    service = load_preserved(root, os.environ['MEDASSIST_A_METADATA_ROOT'])
    rows = []
    for label,eid,mode in [('cough','E_201','unknown'),('diarrhea','E_51','negative'),
                          ('rash','E_129','typed'),('fever-and-cough','E_91','multi'),
                          ('user-stop','E_148','stop'),('conflict','E_201','conflict')]:
        request = NaturalRequest(context={'age':35,'source_sex':'F'},
                                 initial=Answer(evidence_id=eid,state='confirmed',value=True))
        if mode=='multi':
            request.initial_disclosures=[Answer(evidence_id='E_201',state='confirmed',value=True),
                                         Answer(evidence_id='E_51',state='confirmed',value=False)]
        original=service.next(NextRequest(schema_version='model-a.request.v1',fictional_case=True,
                             context=request.context,initial=request.initial))
        sequence=[]
        while True:
            result=interview(service,request)
            assert len(result['result']['handoff']['items'])==223
            q=result['result']['selection']['question']
            if not q:
                break
            assert q['evidence_id'] not in sequence and q['evidence_id'] in result['audit']['candidate_ids']
            sequence.append(q['evidence_id'])
            state,value='unknown',None
            if mode=='negative' and q['data_type']=='B':state,value='confirmed',False
            if mode=='typed':
                state='confirmed'
                value=False if q['data_type']=='B' else q['possible_values'][0] if q['data_type']=='C' else []
            if mode=='conflict':state,value='contradiction',None
            request.turns.append(Turn(answer=Answer(evidence_id=q['evidence_id'],state=state,value=value)))
            if mode=='stop':request.stop='user_stopped'
            assert len(sequence)<=8
        if mode=='unknown':
            assert len(sequence)==8
            assert sum(i['status']=='unknown' for i in result['result']['handoff']['items'])==8
        if mode=='conflict':assert result['result']['selection']['reason']=='unresolved_contradiction'
        rows.append({'scenario':label,'unfiltered_first_id':original.question.evidence_id,
                     'filtered_sequence':sequence,'stop':result['result']['selection']['reason'],
                     'answered':result['progress']['answered'],'handoff_items':223})
    failures=0
    for initial,extras in [('E_999',[]),('E_201',[Answer(evidence_id='E_54',state='confirmed',value=[])]),
                           ('E_201',[Answer(evidence_id='E_69',state='confirmed',value=True)]),
                           ('E_201',[Answer(evidence_id='E_201',state='confirmed',value=True)])]:
        try:interview(service,NaturalRequest(context={'age':0,'source_sex':'M'},initial=Answer(evidence_id=initial,state='confirmed',value=True),initial_disclosures=extras))
        except Exception:failures+=1
    assert failures==4
    with TestClient(create_app(service=service,enabled=True,token='fictional-natural-test-token-123456789'),
                    base_url='http://127.0.0.1',client=('127.0.0.1',1234)) as client:
        headers={'Authorization':'Bearer fictional-natural-test-token-123456789'}
        assert client.get('/research/model-a/v1/demo/natural/vocabulary',headers=headers).status_code==200
        assert client.post('/research/model-a/v1/demo/natural/interview',headers=headers,json=request.model_dump()).status_code==200
        assert client.get('/research/model-a/v1/demo/natural/vocabulary',headers={**headers,'Origin':'http://127.0.0.1'}).status_code==403
    assert verify_seal(root,source,protocol())==before
    coverage=vocabulary(service)
    report={'fictional_only':True,'scenarios':rows,'invalid_transcripts_rejected':failures,
            'http_checks':3,'seal_verified_before_after':True,'sealed_artifact_count':17,
            'symptom_fields':coverage['coverage']['symptom_fields'],
            'initial_symptoms':sum(d['initial_allowed'] for d in coverage['items']),
            'locked_test_or_ledger_accessed':False,'clinical_performance_claim':False}
    output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))


if __name__=='__main__':
    main()
