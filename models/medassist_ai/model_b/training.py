"""Clinical-data-gated offline baseline. No CLI auto-fit and no live-provider wiring."""
from dataclasses import dataclass
import hashlib
import json
import importlib.metadata
import sys
from pathlib import Path
from .data import DatasetValidator, DatasetIngestor, Observation, ReadinessError, records_digest
from .splitting import LeakageAuditor

STATES=('observed_positive','observed_negative','observed_value','unknown','not_asked','unsupported','contradiction')


class NumericEvidenceEncoder:
    """Fixed order with explicit state channels; missing zeros never mean observed negative."""
    def __init__(self, schema):self.schema=schema

    @property
    def columns(self):
        return tuple(f'{name}:{channel}' for name in self.schema.names for channel in ('value',*STATES))

    def transform(self, records):
        rows=[]
        for row in records:
            values=[]
            for name in self.schema.names:
                observation=row.features.get(name,Observation(state='not_asked',value=None))
                values += [float(observation.value) if observation.value is not None else 0.0]
                values += [float(observation.state==state) for state in STATES]
            rows.append(values)
        return rows


@dataclass
class ResearchFit:
    estimator: object
    encoder: NumericEvidenceEncoder
    dataset_sha256: str
    label_schema_sha256: str
    classes: tuple[str,...]

    def probabilities(self, records):
        return self.estimator.predict_proba(self.encoder.transform(records)).tolist()


class ModelTrainer:
    def __init__(self, estimator_factory=None):self.estimator_factory=estimator_factory

    def fit(self, records, manifest, labels, features, split, *, governance_root):
        validator=DatasetValidator()
        validator.require_clinical(manifest,labels,features,governance_root)
        validator.validate(records,manifest,labels,features,root=governance_root)
        original=DatasetIngestor().read(Path(governance_root)/manifest.data_path,manifest,labels,features,governance_root=governance_root)
        if records_digest(original)!=records_digest(records):raise ReadinessError('INGESTED_RECORDS_CHANGED')
        if manifest.dataset_sha256!=split.dataset_sha256:raise ReadinessError('SPLIT_DATASET_CHANGED')
        audit=LeakageAuditor().audit(records,split,features)
        for counts in audit['split_class_support'].values():
            if set(counts)!=set(labels.codes):raise ReadinessError('CLASS_SUPPORT_MISSING_FROM_PARTITION')
        from sklearn.linear_model import LogisticRegression
        factory=self.estimator_factory or (lambda:LogisticRegression(random_state=split.seed,max_iter=1000))
        estimator=factory();encoder=NumericEvidenceEncoder(features)
        train=[records[i] for i in split.train]
        estimator.fit(encoder.transform(train),[r.target for r in train])
        if tuple(estimator.classes_)!=labels.codes:raise ReadinessError('ESTIMATOR_CLASS_ORDER_CHANGED')
        return ResearchFit(estimator,encoder,manifest.dataset_sha256,labels.digest(),labels.codes)


class TrainingPipeline:
    def __init__(self, splitter=None, trainer=None):
        from .splitting import GroupSafeSplitter
        self.splitter=splitter if splitter is not None else GroupSafeSplitter()
        self.trainer=trainer if trainer is not None else ModelTrainer()

    def run(self, path, manifest, labels, features, *, governance_root, abstention_threshold=None):
        from .evaluation import ModelEvaluator
        # Approval checks precede ingestion and all estimator construction.
        DatasetValidator().require_clinical(manifest,labels,features,governance_root)
        records=DatasetIngestor().read(path,manifest,labels,features,governance_root=governance_root)
        split=self.splitter.split(records,features,manifest.dataset_sha256)
        fitted=self.trainer.fit(records,manifest,labels,features,split,governance_root=governance_root)
        reports={}
        for part in ('calibration','test'):
            subset=[records[i] for i in split.parts()[part]]
            reports[part]=ModelEvaluator().evaluate([r.target for r in subset],fitted.probabilities(subset),labels,
                dataset_kind=manifest.kind,abstention_threshold=abstention_threshold)
        return fitted,split,{'partitions':reports,'calibration_fitted':False,'live_enabled':False}


class ArtifactRegistry:
    """Exclusive metadata registration only; no unsafe weight deserialization or live enablement."""
    def register(self, path, *, dataset_manifest, labels, features, split, evaluation, artifact=None):
        path=Path(path)
        if path.exists():raise ReadinessError('REGISTRATION_ALREADY_EXISTS')
        artifact_hash=None
        if artifact is not None:
            artifact=Path(artifact)
            if not artifact.is_file():raise ReadinessError('ARTIFACT_MISSING')
            h=hashlib.sha256()
            with artifact.open('rb') as stream:
                for data in iter(lambda:stream.read(1024*1024),b''):h.update(data)
            artifact_hash=h.hexdigest()
        implementation={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(Path(__file__).parent.glob('*.py'))}
        environment={'python':sys.version.split()[0],**{name:importlib.metadata.version(name)
                     for name in ('scikit-learn','numpy','scipy','joblib')}}
        report={'schema_version':'medassist.model-b.registration.v1','status':'research_only_not_release',
                'dataset_kind':dataset_manifest.kind,'dataset_sha256':dataset_manifest.dataset_sha256,
                'dataset_manifest':dataset_manifest.model_dump(),'label_schema':labels.model_dump(),
                'label_schema_sha256':labels.digest(),'feature_schema':features.model_dump(),
                'split':{k:list(v) for k,v in split.parts().items()},'seed':split.seed,
                'split_records_sha256':split.records_sha256,'split_features_sha256':split.features_sha256,
                'artifact_sha256':artifact_hash,'evaluation':evaluation,'live_enabled':False,
                'clinical_validation':False,'trusted_serialization':False,
                'implementation_sha256':implementation,'environment':environment}
        # Registration contains no original record IDs, patient IDs or source rows.
        payload=json.dumps(report,indent=2,allow_nan=False)
        with path.open('x',encoding='utf-8') as stream:stream.write(payload)
        return report
