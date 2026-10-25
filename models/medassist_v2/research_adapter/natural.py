"""Versioned conversational wrapper; frozen selector, features and handoff stay intact.

Topic membership is an engineering heuristic, not a clinically reviewed interview.
Volunteered disclosures are distinct from routine answers; neither fills missing data.
"""
from typing import Literal

import numpy as np
from pydantic import Field
from threadpoolctl import threadpool_limits

from .. import questioning_protocol as ref
from ..training.flow import tokens_many
from ..validation import require
from .demo import DemoResult
from .handoff import build_handoff
from .schemas import Answer, Context, Contract, Evidence, NextRequest, NextResponse, Question, QuestioningState

# Explicit topic memberships, independently auditable and deliberately conservative.
TOPICS = {
    'respiratory': [66,201,203,77,112,202,166,219,181,182,97,212,103],
    'digestive': [51,148,211,30,32,161,150,173],
    'skin': [129,151],
    'constitutional': [91,94,50,175,89,88,32,161],
    'pain': [53,54,55,56,57,58,59,144,216,220,221,215,217,218],
    'neurological': [76,82,177,93,157,52,90,89],
    'eyes': [74,127,170,172,180],
}
TOPICS = {key: {'E_'+str(n) for n in ids} for key,ids in TOPICS.items()}


class Turn(Contract):
    answer: Answer
    disclosures: list[Answer] = Field(default_factory=list, max_length=8)


class NaturalRequest(Contract):
    schema_version: Literal['medassist.natural-request.v1'] = 'medassist.natural-request.v1'
    fictional_only: Literal[True] = True
    context: Context
    initial: Answer
    initial_disclosures: list[Answer] = Field(default_factory=list, max_length=8)
    turns: list[Turn] = Field(default_factory=list, max_length=10)
    stop: Literal['user_stopped', 'unresolved_contradiction'] | None = None


def vocabulary(service):
    return {'schema_version': 'medassist.natural-vocabulary.v1', 'fictional_only': True,
            'items': [dict(evidence_id=eid, **definition,
                           initial_allowed=definition['kind']=='symptom' and eid not in ref.EDGES,
                           value_labels=getattr(service,'value_labels',{}).get(eid,{}))
                      for eid,definition in sorted(service.definitions.items()) if eid not in ref.ORPHANS],
            'coverage': {'symptom_fields': sum(d['kind']=='symptom' for d in service.definitions.values()),
                         'universal_coverage': False}}


def candidates(service, view):
    positive = {a['evidence_id'] for a in view['revealed_answers']
                if a['state']=='confirmed' and a['value'] is True}
    topical = set().union(*(ids for ids in TOPICS.values() if ids & positive))
    # Conditional children become relevant only through an explicit positive parent.
    topical.update(child for child,parent in ref.EDGES.items() if parent in positive)
    return [eid for eid in ref.eligible_questions(view, service.p) if eid in topical]


class NaturalInferenceUnavailable(RuntimeError):
    pass


def ranked(service, view):
    eligible = candidates(service, view)
    if not eligible:
        return None
    try:
      with service.lock, threadpool_limits(limits=1):
        matrix = service.policy.h.transform(tokens_many(view, eligible, service.p))
        scores = np.asarray(service.policy.model.decision_function(matrix)).reshape(-1)
        require(len(scores)==len(eligible) and np.isfinite(scores).all(), 'invalid_policy_output')
        return eligible[int(np.argmax(scores))]
    except Exception:
        raise NaturalInferenceUnavailable() from None


def interview(service, request: NaturalRequest):
    # Validate each answered question against the same topical ranked prefix. No
    # skipped question is automatically labelled UNKNOWN or negative.
    answers = list(request.initial_disclosures)
    base = lambda: NextRequest(schema_version='model-a.request.v1', fictional_case=True,
                              context=request.context, initial=request.initial, answers=answers)
    view = service.view(base())
    for index,turn in enumerate(request.turns):
        require(index < 8 and len(answers) < 20, 'conversation_already_complete')
        require(turn.answer.evidence_id == ranked(service, view), 'unexpected_routine_question')
        answers.append(turn.answer)
        # Chronological dependency and duplicate validation is delegated unchanged.
        view = service.view(base())
        for disclosure in turn.disclosures:
            require(disclosure.state != 'contradiction', 'clarify_conflicting_disclosure_first')
            answers.append(disclosure)
            require(len(answers)<=20, 'disclosure_budget')
            view = service.view(base())
    stop = ('unresolved_contradiction' if view['contradictions'] else request.stop)
    if not stop and (len(request.turns)>=8 or len(answers)>=20):
        stop = 'question_budget'
    eid = None if stop else ranked(service, view)
    if not eid and not stop:
        stop = 'no_eligible_questions'
    question = Question(evidence_id=eid, **service.catalogue[eid]) if eid else None
    evidence = Evidence(context=request.context, initial=request.initial, answers=answers)
    selection = NextResponse(status='question' if question else 'abstained', reason=stop, question=question,
        state=QuestioningState(answered_question_ids=[a.evidence_id for a in answers],
            pending_question_id=eid, questions_answered=len(answers), remaining_budget=20-len(answers), stopping_reason=stop),
        evidence=evidence, limitations=['Fictional demonstration; topical filtering is not clinically validated.'])
    return {'schema_version':'medassist.natural-result.v1',
            'result':DemoResult(selection=selection, handoff=build_handoff(service,evidence)).model_dump(),
            'progress':{'answered':len(request.turns), 'target':8, 'hard_limit':10},
            'audit':{'filter_version':'topical-candidates.v2', 'candidate_ids':candidates(service,view),
                     'frozen_feature_encoding':True, 'clinical_validation':False}}
