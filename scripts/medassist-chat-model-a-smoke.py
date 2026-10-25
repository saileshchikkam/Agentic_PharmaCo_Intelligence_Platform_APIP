"""Read-only trusted Model A conversations over authored context; never source patients or test ledger."""
import json
import os
from pathlib import Path
from types import SimpleNamespace
from models.medassist_v2.research_adapter.service import load_preserved, protocol
from models.medassist_v2.research_adapter.schemas import NextRequest, Answer
from models.medassist_v2.research_adapter.demo import interview
from models.medassist_v2.research_adapter.protocol_integrity import verify_existing_seal as verify_seal
from models.medassist_v2 import questioning_protocol as ref
from models.medassist_ai.model_b.disabled_provider import DisabledModelB


def main():
    output = Path('models/medassist_ai/docs/chat-model-a-observations.json')
    if output.exists():
        raise RuntimeError('Preserve the existing observation receipt')
    root = Path(os.environ['MEDASSIST_A_RUN_ROOT'])
    receipt = json.loads(Path('models/medassist_v2/task4b-aggregate.json').read_text())
    attested_source = SimpleNamespace(mode='official', receipt=receipt['source_hashes'])
    seal = verify_seal(root, attested_source, protocol())
    service = load_preserved(root, Path(os.environ['MEDASSIST_A_METADATA_ROOT']))
    observations = []
    for label, age, sex, initial, kind in [('adult-cough',35,'F','E_201','unknown-budget'),
            ('teen-fever',16,'M','E_91','explicit-negative-budget'),
            ('age-zero-sore-throat',0,'F','E_97','typed-user-stop'),
            ('adult-unresolved-conflict',35,'F','E_201','contradiction')]:
        request = NextRequest.model_validate({'schema_version':'model-a.request.v1','fictional_case':True,
            'context':{'age':age,'source_sex':sex},'initial':{'evidence_id':initial,'state':'confirmed','value':True}})
        turns = []; seen = {initial}
        while True:
            result = interview(service, request)
            assert result.handoff and len(result.handoff.items) == 223
            question = result.selection.question
            if question is None:
                break
            eid = question.evidence_id
            assert eid not in seen and eid not in ref.ORPHANS
            if eid in ref.EDGES:
                parent = next((a for a in [request.initial,*request.answers] if a.evidence_id == ref.EDGES[eid]), None)
                assert parent is not None and parent.state == 'confirmed' and parent.value is True
            seen.add(eid)
            state, value = 'unknown', None
            if kind == 'contradiction': state = 'contradiction'
            elif kind == 'explicit-negative-budget' and question.data_type == 'B': state,value = 'confirmed',False
            elif kind == 'typed-user-stop':
                state = 'confirmed'
                value = False if question.data_type == 'B' else question.possible_values[0] if question.data_type == 'C' else question.possible_values[:1]
            turns.append({'question_id':eid,'visible_question':question.question_en,'data_type':question.data_type,
                'answer_state':state,'answer_value':value})
            request.answers.append(Answer(evidence_id=eid,state=state,value=value))
            if kind == 'typed-user-stop' and len(turns) == 3: request.stop = 'user_stopped'
            if kind == 'contradiction': request.stop = 'unresolved_contradiction'
            assert len(turns) <= 20
        by_id = {item.evidence_id:item for item in result.handoff.items}
        for answer in request.answers:
            item = by_id[answer.evidence_id]
            if answer.state == 'unknown': assert item.status == 'unknown' and item.value is None
            if answer.state == 'confirmed' and answer.value is False: assert item.status == 'observed_negative'
            if answer.state == 'contradiction': assert item.status == 'contradiction'
        assert DisabledModelB().assess(result.handoff).status == 'unable_to_assess'
        observations.append({'fictional_scenario':label,'context':request.context.model_dump(),'initial_evidence_id':initial,
            'turns':turns,'stop_reason':result.selection.reason,'answered':len(request.answers),
            'handoff_schema':result.handoff.schema_version,'handoff_items':223,'model_b':'unable_to_assess'})
    assert verify_seal(root, attested_source, protocol()) == seal
    report = {'status':'passed','actual_model_a':True,'scenario_origin':'authored software contexts, not corpus patients',
        'observations':observations,'sealed_artifacts_matched':17,'frozen_code_protocol_environment':'matched',
        'source_archive_hashes':'compared to existing sealed attestations; archives not opened',
        'official_locked_test_and_ledger':'not accessed','clinical_accuracy_measured':False,'cloud_calls':0,
        'limitations':['These authored interviews verify behavior, not clinical relevance or model accuracy.',
            'Question wording is frozen synthetic metadata, not LLM generation or clinician-reviewed phrasing.',
            'Frequent UNKNOWN answers may still use the entire frozen 20-question budget.']}
    output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':'passed','actual_model_a':True,'scenarios':[{k:o[k] for k in ('fictional_scenario','answered','stop_reason')} for o in observations],
        'sealed_artifacts_matched':17,'locked_test_and_ledger':'not accessed'}))


if __name__ == '__main__': main()
