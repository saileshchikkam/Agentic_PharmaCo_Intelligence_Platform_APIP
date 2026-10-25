"""Offline versioned data contracts; clinical provenance is mandatory, never inferred."""
import hashlib
import json
import math
from datetime import datetime
from pathlib import Path
from typing import Literal
from pydantic import Field, model_validator, field_validator
from models.medassist_v2.research_adapter.schemas import Contract


class ReadinessError(ValueError):
    """Value-free codes only: never echo records, identities or private paths."""


class DocumentRef(Contract):
    path: str = Field(min_length=1)
    sha256: str = Field(pattern=r'^[a-f0-9]{64}$')

    def verify(self, root):
        root = Path(root).resolve(); target = (root/self.path).resolve()
        if Path(self.path).is_absolute() or not target.is_relative_to(root) or not target.is_file() or target.stat().st_size > 1024*1024:
            raise ReadinessError('GOVERNANCE_DOCUMENT_REQUIRED')
        content=target.read_bytes()
        if not content.strip() or hashlib.sha256(content).hexdigest() != self.sha256:
            raise ReadinessError('GOVERNANCE_DOCUMENT_CHANGED')


class ClinicalReview(Contract):
    reviewer_id: str = Field(min_length=1)
    qualification: str = Field(min_length=1)
    scope: str = Field(min_length=1)
    reviewed_at: str = Field(min_length=1)
    document: DocumentRef

    @model_validator(mode='after')
    def meaningful_review(self):
        if any(not value.strip() for value in (self.reviewer_id,self.qualification,self.scope)):
            raise ValueError('review_identity_scope_required')
        try: datetime.fromisoformat(self.reviewed_at.replace('Z','+00:00'))
        except ValueError: raise ValueError('review_timestamp_required') from None
        return self


class LabelSchema(Contract):
    schema_version: Literal['medassist.urgency-labels.v1'] = 'medassist.urgency-labels.v1'
    version: str = Field(min_length=1)
    approved: bool = False
    classes: dict[str,str]
    abstention: Literal['unable_to_assess'] = 'unable_to_assess'
    emergency_class: str | None = None
    clinical_review: ClinicalReview | None = None

    @model_validator(mode='after')
    def exact_targets(self):
        if set(self.classes) != {'level_1','level_2','level_3','level_4'} or any(not v.strip() for v in self.classes.values()):
            raise ValueError('four_versioned_targets_required')
        if self.emergency_class is not None and (not self.approved or self.emergency_class not in self.classes):
            raise ValueError('approved_emergency_mapping_required')
        if self.approved and self.clinical_review is None:
            raise ValueError('clinical_review_required')
        if self.approved and any(value.startswith('Unapproved technical slot') for value in self.classes.values()):
            raise ValueError('reviewed_definitions_required')
        return self

    @property
    def codes(self):
        return tuple(sorted(self.classes))

    def digest(self):
        return hashlib.sha256(json.dumps(self.model_dump(),sort_keys=True,separators=(',',':')).encode()).hexdigest()


class FeatureSchema(Contract):
    version: Literal['medassist.model-b.numeric-evidence.v1'] = 'medassist.model-b.numeric-evidence.v1'
    names: list[str] = Field(min_length=1)
    symptom_group_features: list[str] = Field(min_length=1)
    prediction_time: str = Field(min_length=1)
    review: DocumentRef | None = None

    @model_validator(mode='after')
    def allowlist(self):
        if len(self.names)!=len(set(self.names)) or not set(self.symptom_group_features)<=set(self.names):
            raise ValueError('unique_allowlisted_features_required')
        if any(not n.strip() or any(w in n.casefold() for w in ('disease','diagnosis','jayanth','target','urgency')) for n in self.names):
            raise ValueError('outcome_features_forbidden')
        return self


class DatasetManifest(Contract):
    schema_version: Literal['medassist.model-b.dataset.v1'] = 'medassist.model-b.dataset.v1'
    dataset_id: str = Field(min_length=1)
    data_path: str = Field(min_length=1)
    kind: Literal['clinical','synthetic_software_fixture']
    dataset_sha256: str = Field(pattern=r'^[a-f0-9]{64}$')
    source_description: str = Field(min_length=1)
    intended_population: str = Field(min_length=1)
    intended_use: str = Field(min_length=1)
    label_schema_sha256: str = Field(pattern=r'^[a-f0-9]{64}$')
    source: DocumentRef | None = None
    usage_rights: DocumentRef | None = None
    intended_use_alignment: DocumentRef | None = None
    adjudication: DocumentRef | None = None
    grouping_review: DocumentRef | None = None
    clinical_review: ClinicalReview | None = None
    clinical_training_authorized: bool = False


State = Literal['observed_positive','observed_negative','observed_value','unknown','not_asked','unsupported','contradiction']


class Observation(Contract):
    state: State
    value: bool | int | float | None

    @model_validator(mode='after')
    def preserve_semantics(self):
        if self.state=='observed_positive' and self.value is not True:
            raise ValueError('positive_boolean_required')
        if self.state=='observed_negative' and self.value is not False:
            raise ValueError('negative_boolean_required')
        if self.state=='observed_value' and (type(self.value) not in (int,float) or not math.isfinite(self.value)):
            raise ValueError('explicit_numeric_mapping_required')
        if self.state in ('unknown','not_asked','unsupported','contradiction') and self.value is not None:
            raise ValueError('missing_or_conflicting_value_must_be_null')
        return self


class Record(Contract):
    record_id: str = Field(min_length=1)
    patient_id: str | None = None
    encounter_id: str | None = None
    source_group: str | None = None
    features: dict[str,Observation]
    target: str
    label_origin: Literal['qualified_adjudication','synthetic_software_fixture']
    adjudication_ref: str = Field(min_length=1)
    evidence_origin: Literal['clinical_source','model_a_fictional_export','synthetic_software_fixture']

    @field_validator('record_id','patient_id','encounter_id','source_group')
    @classmethod
    def identifier_whitespace(cls, value):
        if value is None:return value
        if not value.strip():raise ValueError('nonblank_identifier_required')
        return value.strip()


class DatasetValidator:
    def validate(self, records, manifest, labels, features, *, root):
        if manifest.label_schema_sha256 != labels.digest():
            raise ReadinessError('LABEL_SCHEMA_CHANGED')
        if not records or len({r.record_id for r in records}) != len(records):
            raise ReadinessError('EMPTY_OR_DUPLICATE_RECORD_IDS')
        if any(r.target not in labels.codes or set(r.features)-set(features.names) for r in records):
            raise ReadinessError('UNKNOWN_TARGET_OR_FEATURE')
        if manifest.kind == 'clinical':
            self.require_clinical(manifest,labels,features,root)
            if any(r.label_origin!='qualified_adjudication' or r.evidence_origin!='clinical_source' for r in records):
                raise ReadinessError('FICTIONAL_OR_DISEASE_LABELS_NOT_CLINICAL_GROUND_TRUTH')
            if any(not r.adjudication_ref.startswith(manifest.adjudication.sha256+':') for r in records):
                raise ReadinessError('RECORD_ADJUDICATION_REFERENCE_REQUIRED')
        elif any(r.label_origin!='synthetic_software_fixture' or r.evidence_origin!='synthetic_software_fixture' for r in records):
            raise ReadinessError('SYNTHETIC_FIXTURE_MARKING_REQUIRED')
        return tuple(records)

    def require_clinical(self, manifest, labels, features, root):
        if manifest.kind!='clinical' or not manifest.clinical_training_authorized or not labels.approved:
            raise ReadinessError('APPROVED_CLINICAL_DATA_AND_LABELS_REQUIRED')
        docs=[manifest.source,manifest.usage_rights,manifest.intended_use_alignment,manifest.adjudication,
              manifest.grouping_review,features.review]
        if manifest.clinical_review is None or labels.clinical_review is None or any(d is None for d in docs):
            raise ReadinessError('SOURCE_RIGHTS_ALIGNMENT_ADJUDICATION_REVIEW_REQUIRED')
        for doc in [*docs,manifest.clinical_review.document,labels.clinical_review.document]:
            doc.verify(root)


class DatasetIngestor:
    def read(self, path, manifest, labels, features, *, governance_root):
        path=Path(path).resolve();root=Path(governance_root).resolve()
        expected=(root/manifest.data_path).resolve()
        if not expected.is_relative_to(root) or path!=expected:
            raise ReadinessError('DATASET_PATH_OUTSIDE_GOVERNED_ROOT')
        with path.open('rb') as stream: data=stream.read(64*1024*1024+1)
        if len(data)>64*1024*1024 or hashlib.sha256(data).hexdigest()!=manifest.dataset_sha256:
            raise ReadinessError('DATASET_SIZE_OR_HASH_MISMATCH')
        def unique(pairs):
            obj={}
            for key,value in pairs:
                if key in obj: raise ValueError('duplicate')
                obj[key]=value
            return obj
        try:
            lines=data.decode('utf-8').splitlines()
            if len(lines)>100000: raise ValueError('row_limit')
            records=[Record.model_validate(json.loads(line,object_pairs_hook=unique)) for line in lines if line.strip()]
        except (ValueError,TypeError,UnicodeError):
            raise ReadinessError('INVALID_DATASET_SCHEMA') from None
        return DatasetValidator().validate(records,manifest,labels,features,root=governance_root)


def records_digest(records):
    return hashlib.sha256(json.dumps([r.model_dump() for r in records],sort_keys=True,separators=(',',':')).encode()).hexdigest()


class EvidenceProjector:
    """Read-only compatibility view; fictional Model A exports cannot become clinical labels."""
    def project(self, raw, feature_schema):
        from models.medassist_v2.research_adapter.handoff import EvidenceHandoff
        handoff=EvidenceHandoff.model_validate(raw.model_dump() if isinstance(raw,EvidenceHandoff) else raw)
        by_id={item.evidence_id:item for item in handoff.items}
        if set(feature_schema.names)-set(by_id):
            raise ReadinessError('EXPLICIT_FEATURE_MAPPING_REQUIRED')
        try:
            features={name:Observation(state=by_id[name].status,value=by_id[name].value) for name in feature_schema.names}
        except ValueError:
            raise ReadinessError('EXPLICIT_TYPED_NUMERIC_MAPPING_REQUIRED') from None
        return {'evidence_origin':'model_a_fictional_export','features':features}
