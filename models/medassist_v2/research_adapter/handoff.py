"""Research-only A-to-B evidence contract; no Model B, clinical labels or scoring.

This explicit projection is not wired into HTTP v1. It validates the existing
disclosures again and never calls Policy, a model, an oracle or a patient loader.
"""
from typing import Literal

from pydantic import Field, model_validator

from .. import questioning_protocol as ref
from ..validation import typed_key
from .schemas import Contract, Context, Evidence, NextRequest, Value

ObservationStatus = Literal['observed_positive', 'observed_negative', 'observed_value',
                            'unknown', 'not_asked', 'unsupported', 'contradiction']


class Provenance(Contract):
    source: Literal['developer_fictional_fixture', 'not_disclosed', 'frozen_scope_exclusion']
    disclosure: Literal['initial', 'followup', 'none']
    turn: int | None = Field(ge=0, le=20)

    @model_validator(mode='after')
    def coherent_source(self):
        if self.disclosure == 'initial':
            valid = self.source == 'developer_fictional_fixture' and self.turn == 0
        elif self.disclosure == 'followup':
            valid = self.source == 'developer_fictional_fixture' and self.turn is not None and self.turn > 0
        else:
            valid = self.source in ('not_disclosed', 'frozen_scope_exclusion') and self.turn is None
        if not valid:
            raise ValueError('inconsistent_disclosure_provenance')
        return self


class EvidenceItem(Contract):
    evidence_id: str = Field(pattern=r'^E_[0-9]{1,3}$')
    data_type: Literal['B', 'C', 'M']
    status: ObservationStatus
    value: Value
    unsupported_reason: Literal['quarantined_question'] | None = None
    provenance: Provenance

    @model_validator(mode='after')
    def explicit_semantics(self):
        if self.status in ('observed_positive', 'observed_negative'):
            expected = self.status == 'observed_positive'
            if self.data_type != 'B' or self.value is not expected:
                raise ValueError('explicit_boolean_observation_required')
        elif self.status == 'observed_value':
            if self.data_type == 'B' or self.value is None:
                raise ValueError('typed_observed_value_required')
            if self.data_type == 'C' and (type(self.value) not in (str,int,float)):
                raise ValueError('categorical_scalar_required')
            if self.data_type == 'M' and not isinstance(self.value,list):
                raise ValueError('multichoice_list_required')
            if self.data_type == 'M' and (any(type(v) not in (str,int,float) for v in self.value)
                                          or len({typed_key(v) for v in self.value}) != len(self.value)):
                raise ValueError('unique_typed_multichoice_values_required')
        elif self.value is not None:
            raise ValueError('unobserved_or_conflicting_value_must_be_null')
        if self.status == 'unsupported':
            if (self.evidence_id not in ref.ORPHANS or self.unsupported_reason is None
                    or self.provenance.source != 'frozen_scope_exclusion'):
                raise ValueError('unsupported_provenance_required')
        elif self.unsupported_reason is not None:
            raise ValueError('unexpected_unsupported_reason')
        elif self.evidence_id in ref.ORPHANS:
            raise ValueError('quarantined_evidence_must_be_unsupported')
        if self.status == 'not_asked':
            valid = self.provenance.source == 'not_disclosed'
        elif self.status == 'unsupported':
            valid = self.provenance.disclosure == 'none'
        else:
            valid = self.provenance.source == 'developer_fictional_fixture'
        if not valid:
            raise ValueError('observation_provenance_mismatch')
        return self


class EvidenceHandoff(Contract):
    schema_version: Literal['model-a-to-b.evidence.v1'] = 'model-a-to-b.evidence.v1'
    research_only: Literal[True] = True
    intended_use: Literal['fictional_demo_evidence_only'] = 'fictional_demo_evidence_only'
    producer: Literal['model-a.adapter.v1'] = 'model-a.adapter.v1'
    protocol_id: Literal['medassist-v2-adaptive-questioning-v1'] = 'medassist-v2-adaptive-questioning-v1'
    context: Context
    context_origin: Literal['developer_fictional_fixture'] = 'developer_fictional_fixture'
    initial_evidence_id: str
    items: list[EvidenceItem] = Field(min_length=1, max_length=223)
    missing_item_semantics: Literal['unspecified_never_negative'] = 'unspecified_never_negative'
    model_b_status: Literal['not_enabled'] = 'not_enabled'
    human_clinical_review: Literal[False] = False

    @model_validator(mode='after')
    def unique_items(self):
        ids = [item.evidence_id for item in self.items]
        if len(ids) != len(set(ids)):
            raise ValueError('duplicate_evidence_item')
        initial = [item for item in self.items if item.evidence_id == self.initial_evidence_id]
        if len(initial) != 1 or initial[0].provenance.disclosure != 'initial':
            raise ValueError('initial_provenance_required')
        if initial[0].status not in ('observed_positive','observed_value'):
            raise ValueError('confirmed_initial_premise_required')
        if sum(item.provenance.disclosure == 'initial' for item in self.items) != 1:
            raise ValueError('one_initial_disclosure_required')
        turns = sorted(item.provenance.turn for item in self.items if item.provenance.disclosure=='followup')
        if turns != list(range(1,len(turns)+1)):
            raise ValueError('contiguous_followup_turns_required')
        return self


def build_handoff(service, evidence: Evidence) -> EvidenceHandoff:
    """Expand the trusted catalogue; invalid/OOV transcripts yield no accepted handoff.

    Metadata membership/category validation remains the adapter's responsibility:
    JSON Schema alone cannot certify frozen vocabulary or clinical appropriateness.
    Missing definitions are not inferred. Quarantined definitions are explicit
    unsupported entries; out-of-vocabulary submissions still abstain at ingress.
    """
    request = NextRequest(schema_version='model-a.request.v1', fictional_case=True,
                          context=evidence.context, initial=evidence.initial, answers=evidence.answers)
    service.view(request)  # Chronological IDs/types/dependencies, no policy execution.
    disclosed = {evidence.initial.evidence_id: (evidence.initial,0)}
    disclosed.update({answer.evidence_id:(answer,index) for index,answer in enumerate(evidence.answers,1)})
    items = []
    for eid,definition in sorted(service.definitions.items()):
        # Production metadata has only E_ IDs. Tiny software stand-in catalogues may omit IDs.
        if eid in ref.ORPHANS:
            status,value,reason = 'unsupported',None,'quarantined_question'
            provenance = Provenance(source='frozen_scope_exclusion',disclosure='none',turn=None)
        elif eid not in disclosed:
            status,value,reason = 'not_asked',None,None
            provenance = Provenance(source='not_disclosed',disclosure='none',turn=None)
        else:
            answer,turn = disclosed[eid]
            value,reason = answer.value,None
            if answer.state == 'confirmed':
                status = ('observed_positive' if value is True else 'observed_negative') if definition['data_type']=='B' else 'observed_value'
            else:
                status = answer.state
            provenance = Provenance(source='developer_fictional_fixture',
                                    disclosure='initial' if turn==0 else 'followup',turn=turn)
        items.append(EvidenceItem(evidence_id=eid,data_type=definition['data_type'],status=status,
                                  value=value,unsupported_reason=reason,provenance=provenance))
    return EvidenceHandoff(context=evidence.context, initial_evidence_id=evidence.initial.evidence_id, items=items)
