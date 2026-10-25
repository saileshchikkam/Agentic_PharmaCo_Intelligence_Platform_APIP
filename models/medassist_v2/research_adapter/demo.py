"""Fictional interactive workflow over the existing selector and unchanged handoff."""
from typing import Literal

from pydantic import model_validator

from .. import questioning_protocol as ref
from .handoff import EvidenceHandoff, build_handoff
from .schemas import Answer, Context, Contract, NextRequest, NextResponse


class DemoFixture(Contract):
    fixture_id: str
    label: str
    request: NextRequest


class FixtureList(Contract):
    schema_version: Literal['model-a.fixtures.v1'] = 'model-a.fixtures.v1'
    fictional_only: Literal[True] = True
    fixtures: list[DemoFixture]


class DemoResult(Contract):
    schema_version: Literal['model-a.demo.v1'] = 'model-a.demo.v1'
    selection: NextResponse
    handoff: EvidenceHandoff | None

    @model_validator(mode='after')
    def consistent_evidence(self):
        if (self.selection.evidence is None) != (self.handoff is None):
            raise ValueError('accepted_evidence_handoff_mismatch')
        return self


def demo_fixtures(service):
    # Reuse authored context values from Task 5A parity tests, never corpus rows.
    initial = next(eid for eid,d in service.definitions.items()
                   if d['kind']=='symptom' and d['data_type']=='B'
                   and eid not in ref.EDGES and eid not in ref.ORPHANS)
    return FixtureList(fixtures=[DemoFixture(fixture_id=key,label=label,request=NextRequest(
        schema_version='model-a.request.v1',fictional_case=True,
        context=Context(age=age,source_sex=sex),
        initial=Answer(evidence_id=initial,state='confirmed',value=True)))
        for key,label,age,sex in [('adult','Software fixture · age 35 / source SEX F',35,'F'),
                                  ('teen','Software fixture · age 16 / source SEX M',16,'M'),
                                  ('age-zero','Software fixture · age 0 / source SEX F',0,'F')]])


def interview(service,request):
    selection = service.next(request)
    handoff = build_handoff(service,selection.evidence) if selection.evidence is not None else None
    return DemoResult(selection=selection,handoff=handoff)
