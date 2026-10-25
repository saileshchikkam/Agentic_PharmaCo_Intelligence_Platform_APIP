"""Bounded real preserved-model check; metadata and seal only, no official records."""
import json
import os
from pathlib import Path
from types import SimpleNamespace
from models.medassist_v2.research_adapter.service import load_preserved,protocol
from models.medassist_v2.research_adapter.natural import NaturalRequest,Turn,interview
from models.medassist_v2.research_adapter.schemas import Answer
from models.medassist_v2.research_adapter.protocol_integrity import verify_existing_seal as verify_seal

output=Path('models/medassist_ai/docs/symptom-understanding-model-a.json')
assert not output.exists()
root=Path(os.environ['MEDASSIST_A_RUN_ROOT'])
receipt=json.loads(Path('models/medassist_v2/task4b-aggregate.json').read_text())
source=SimpleNamespace(mode='official',receipt=receipt['source_hashes'])
before=verify_seal(root,source,protocol())
service=load_preserved(root,os.environ['MEDASSIST_A_METADATA_ROOT'])
rows=[]
for label,initial,extras in [('cough','E_201',[Answer(evidence_id='E_66',state='confirmed',value=False)]),
                             ('pain-nausea','E_53',[Answer(evidence_id='E_148',state='confirmed',value=True)]),
                             ('significant-breathing','E_66',[]),
                             ('negative-pain-parent','E_201',[Answer(evidence_id='E_53',state='confirmed',value=False)]),
                             ('unmapped-topic','E_155',[])]:
    request=NaturalRequest(context={'age':35,'source_sex':'F'},initial=Answer(evidence_id=initial,state='confirmed',value=True),initial_disclosures=extras)
    first=interview(service,request);sequence=[]
    while True:
        result=interview(service,request);q=result['result']['selection']['question']
        if not q:break
        assert q['evidence_id'] not in sequence and q['evidence_id'] in result['audit']['candidate_ids']
        sequence.append(q['evidence_id']);assert len(sequence)<=8
        request.turns.append(Turn(answer=Answer(evidence_id=q['evidence_id'],state='unknown',value=None)))
    handoff=result['result']['handoff'];assert len(handoff['items'])==223 and handoff['model_b_status']=='not_enabled'
    if label=='significant-breathing':assert first['audit']['candidate_ids'] and sequence
    if label=='unmapped-topic':assert result['result']['selection']['reason']=='no_eligible_questions'
    if label=='negative-pain-parent':assert not set(first['audit']['candidate_ids'])&{'E_54','E_55','E_56','E_57','E_58','E_59'}
    rows.append({'scenario':label,'sequence':sequence,'first_candidates':first['audit']['candidate_ids'],
                 'routine_turns':len(sequence),'stop':result['result']['selection']['reason'],'unknown_count':sum(i['status']=='unknown' for i in handoff['items']),
                 'negative_ids':[i['evidence_id'] for i in handoff['items'] if i['status']=='observed_negative'],'export_items':len(handoff['items'])})
assert verify_seal(root,source,protocol())==before
report={'actual_model_a':True,'fictional_only':True,'no_cloud_calls':True,'sealed_artifacts':17,'before_after_seal_match':True,'frozen_code_protocol_environment_match':True,
        'source_patient_archives_opened':False,'locked_test_or_ledger_opened':False,'candidate_filter_version':'topical-candidates.v2','scenarios':rows}
output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
