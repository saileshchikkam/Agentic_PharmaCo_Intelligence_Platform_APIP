from copy import deepcopy
from dataclasses import replace
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock
from models.medassist_ai.model_b.data import (DatasetIngestor, DatasetManifest, DatasetValidator,
    DocumentRef, ClinicalReview, EvidenceProjector, FeatureSchema, LabelSchema, Observation, ReadinessError, Record)
from models.medassist_ai.model_b.splitting import GroupSafeSplitter, LeakageAuditor, symptom_key
from models.medassist_ai.model_b.training import ArtifactRegistry, ModelTrainer, NumericEvidenceEncoder, TrainingPipeline
from models.medassist_ai.model_b.evaluation import ModelEvaluator
from models.medassist_ai.model_b.disabled_provider import DisabledModelB


def labels():
    return LabelSchema.model_validate_json(Path('models/medassist_ai/model_b/label-schema.v1.json').read_text(encoding='utf-8'))


def features():
    return FeatureSchema(names=['fixture_numeric'],symptom_group_features=['fixture_numeric'],prediction_time='synthetic_input_only')


def rows():
    # Numeric counters and class slots are software fixtures, not clinical observations or urgency targets.
    return [Record(record_id=f'SYNTHETIC-{i}',patient_id=f'SYNTHETIC-P-{i}',encounter_id=f'SYNTHETIC-E-{i}',
        features={'fixture_numeric':Observation(state='observed_value',value=i)},target=f'level_{i%4+1}',
        label_origin='synthetic_software_fixture',adjudication_ref='SYNTHETIC_NOT_CLINICALLY_ADJUDICATED',
        evidence_origin='synthetic_software_fixture') for i in range(40)]


def fixture(root, records=None):
    records=records if records is not None else rows()
    data=''.join(json.dumps(r.model_dump())+'\n' for r in records).encode()
    path=Path(root)/'synthetic.jsonl';path.write_bytes(data)
    manifest=DatasetManifest(dataset_id='SYNTHETIC_FUNCTIONALITY_ONLY',data_path=path.name,kind='synthetic_software_fixture',
        dataset_sha256=hashlib.sha256(data).hexdigest(),source_description='authored software counters',
        intended_population='not people',intended_use='software tests only',label_schema_sha256=labels().digest())
    return path,manifest


class ModelBFoundationTests(unittest.TestCase):
    def test_provisional_four_slots_and_separate_abstention(self):
        schema=labels()
        self.assertFalse(schema.approved);self.assertEqual(len(schema.codes),4)
        self.assertNotIn(schema.abstention,schema.codes);self.assertIsNone(schema.emergency_class)
        with self.assertRaises(ValueError):LabelSchema(**{**schema.model_dump(),'emergency_class':'level_1'})
        with self.assertRaises(ValueError):LabelSchema(**{**schema.model_dump(),'approved':True})
        self.assertEqual(DisabledModelB().assess(None).status,'unable_to_assess')

    def test_synthetic_ingestion_is_hashed_and_explicit(self):
        with tempfile.TemporaryDirectory() as root:
            path,manifest=fixture(root)
            accepted=DatasetIngestor().read(path,manifest,labels(),features(),governance_root=root)
            self.assertEqual(len(accepted),40)
            path.write_text('{}',encoding='utf-8')
            with self.assertRaisesRegex(ReadinessError,'HASH'):DatasetIngestor().read(path,manifest,labels(),features(),governance_root=root)

    def test_duplicate_json_keys_extra_targets_and_paths_fail_closed(self):
        with tempfile.TemporaryDirectory() as root:
            path,manifest=fixture(root)
            data=b'{"record_id":"a","record_id":"b"}\n';path.write_bytes(data)
            manifest.dataset_sha256=hashlib.sha256(data).hexdigest()
            with self.assertRaisesRegex(ReadinessError,'SCHEMA'):DatasetIngestor().read(path,manifest,labels(),features(),governance_root=root)
            manifest.data_path='../outside.jsonl'
            with self.assertRaisesRegex(ReadinessError,'GOVERNED_ROOT'):DatasetIngestor().read(path,manifest,labels(),features(),governance_root=root)
            bad=rows();bad[0].target='disease_name'
            with self.assertRaises(ReadinessError):DatasetValidator().validate(bad,manifest,labels(),features(),root=root)

    def test_missing_clinical_approval_and_provenance_block_before_estimator_creation(self):
        factory=Mock(side_effect=AssertionError('no_model_construction'))
        with tempfile.TemporaryDirectory() as root:
            path,manifest=fixture(root);records=rows();split=GroupSafeSplitter().split(records,features(),manifest.dataset_sha256)
            with self.assertRaises(ReadinessError):ModelTrainer(factory).fit(records,manifest,labels(),features(),split,governance_root=root)
            with self.assertRaises(ReadinessError):TrainingPipeline(trainer=ModelTrainer(factory)).run(path,manifest,labels(),features(),governance_root=root)
            manifest.kind='clinical';manifest.clinical_training_authorized=True
            with self.assertRaises(ReadinessError):DatasetIngestor().read(path,manifest,labels(),features(),governance_root=root)
        factory.assert_not_called()

    def test_review_documents_require_containment_and_exact_hash(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'review.txt';p.write_text('SYNTHETIC DOCUMENT CHECK ONLY',encoding='utf-8')
            doc=DocumentRef(path=p.name,sha256=hashlib.sha256(p.read_bytes()).hexdigest());doc.verify(root)
            p.write_text('changed',encoding='utf-8')
            with self.assertRaises(ReadinessError):doc.verify(root)
            with self.assertRaises(ReadinessError):DocumentRef(path='../escape',sha256='0'*64).verify(root)

    def test_transitive_patient_encounter_source_and_duplicate_groups_never_cross_splits(self):
        records=rows()
        records[1].patient_id=records[0].patient_id
        records[2].encounter_id=records[1].encounter_id
        records[3].features=deepcopy(records[2].features)
        records[4].source_group='SYNTHETIC-SOURCE';records[3].source_group='SYNTHETIC-SOURCE'
        splitter=GroupSafeSplitter(seed=42);first=splitter.split(records,features(),'0'*64)
        self.assertEqual(first,splitter.split(records,features(),'0'*64))
        part_by_row={i:name for name,indices in first.parts().items() for i in indices}
        self.assertEqual(len({part_by_row[i] for i in range(5)}),1)
        audit=LeakageAuditor().audit(records,first,features())
        self.assertEqual(audit['cross_split_overlap'],0)
        self.assertEqual(audit['repeated_symptom_groups'],1)

    def test_manual_overlap_or_changed_records_rejected(self):
        records=rows();split=GroupSafeSplitter().split(records,features(),'0'*64)
        with self.assertRaises(ReadinessError):LeakageAuditor().audit(records,replace(split,test=split.test+(split.train[0],)),features())
        records[0].target='level_4'
        with self.assertRaisesRegex(ReadinessError,'CHANGED'):LeakageAuditor().audit(records,split,features())
        for row in records:row.patient_id='ONE_SYNTHETIC_PATIENT'
        with self.assertRaises(ReadinessError):GroupSafeSplitter().split(records,features(),'0'*64)

    def test_numeric_dtype_does_not_hide_duplicate_symptom_groups(self):
        a,b=rows()[:2]
        a.features['fixture_numeric']=Observation(state='observed_value',value=1)
        b.features['fixture_numeric']=Observation(state='observed_value',value=1.0)
        self.assertEqual(symptom_key(a,features()),symptom_key(b,features()))

    def test_negative_unknown_missing_and_contradiction_encode_distinct_states(self):
        schema=features();encoded=[]
        for state,value in [('observed_negative',False),('unknown',None),('not_asked',None),('contradiction',None)]:
            r=rows()[0];r.features={'fixture_numeric':Observation(state=state,value=value)}
            encoded.append(tuple(NumericEvidenceEncoder(schema).transform([r])[0]))
        self.assertEqual(len(set(encoded)),4)
        with self.assertRaises(ValueError):Observation(state='unknown',value=False)
        with self.assertRaises(ValueError):Observation(state='observed_value',value='encoded diagnosis')
        with self.assertRaises(ValueError):FeatureSchema(names=['disease'],symptom_group_features=['disease'],prediction_time='invalid')

    def test_numeric_evaluation_and_abstention_are_synthetic_not_clinical_performance(self):
        evaluator=ModelEvaluator();schema=labels()
        report=evaluator.evaluate(['level_1','level_2'],[[.8,.1,.05,.05],[.4,.3,.2,.1]],schema,
            dataset_kind='synthetic_software_fixture',abstention_threshold=.7)
        self.assertEqual(report['coverage'],.5);self.assertEqual(report['confusion_matrix'][1][4],1)
        self.assertEqual(report['per_class']['level_2']['recall'],0)
        self.assertIsNone(report['per_class']['level_3']['recall'])
        self.assertAlmostEqual(report['multiclass_brier'],(.055+.7)/2)
        self.assertAlmostEqual(report['top_label_ece'],.3)
        self.assertFalse(report['clinical_validation'])
        self.assertEqual(report['emergency_safety_analysis']['status'],'blocked_pending_approved_emergency_mapping')
        all_abstain=evaluator.evaluate(['level_1'],[[.8,.1,.05,.05]],schema,dataset_kind='synthetic_software_fixture')
        self.assertEqual(all_abstain['coverage'],0);self.assertIsNone(all_abstain['selective_error'])
        for probs in [[float('nan'),0,0,1],[-.1,.5,.5,.1],[.1,.1,.1,.1]]:
            with self.assertRaises(ReadinessError):evaluator.evaluate(['level_1'],[probs],schema,dataset_kind='synthetic_software_fixture')

    def test_emergency_metric_branch_is_only_a_synthetic_contract_simulation(self):
        # This receipt is intentionally fictional and never satisfies clinical ingestion.
        review=ClinicalReview(reviewer_id='SYNTHETIC_BRANCH_TEST_NOT_A_PERSON',qualification='software fixture only',
            scope='test approved-flag branch; not clinical sign-off',reviewed_at='2026-10-24T00:00:00Z',
            document=DocumentRef(path='nonexistent-synthetic-review',sha256='0'*64))
        schema=LabelSchema(version='SYNTHETIC_APPROVAL_SIMULATION',approved=True,
            classes={f'level_{i}':f'Synthetic software slot {i}; no clinical meaning' for i in range(1,5)},
            emergency_class='level_1',clinical_review=review)
        report=ModelEvaluator().evaluate(['level_1','level_1'],[[.1,.8,.05,.05],[.2,.4,.2,.2]],schema,
            dataset_kind='synthetic_software_fixture',abstention_threshold=.7)
        self.assertEqual(report['emergency_safety_analysis']['support'],2)
        self.assertEqual(report['emergency_safety_analysis']['accepted_non_emergency'],1)
        self.assertEqual(report['emergency_safety_analysis']['abstained'],1)
        self.assertFalse(report['clinical_validation'])

    def test_model_a_export_projection_never_changes_fictional_provenance(self):
        from models.medassist_ai.tests.fixtures import handoff
        schema=FeatureSchema(names=['E_0','E_53','E_1'],symptom_group_features=['E_0','E_53'],prediction_time='synthetic_only')
        original=handoff();snapshot=original.model_dump()
        projected=EvidenceProjector().project(original,schema)
        self.assertEqual(projected['evidence_origin'],'model_a_fictional_export')
        self.assertEqual(projected['features']['E_53'].state,'unknown')
        self.assertEqual(projected['features']['E_1'].state,'not_asked')
        self.assertEqual(original.model_dump(),snapshot)
        with self.assertRaises(ReadinessError):EvidenceProjector().project(original,features())

    def test_registry_never_enables_live_provider_and_preserves_existing_files(self):
        with tempfile.TemporaryDirectory() as root:
            _,manifest=fixture(root);records=rows();split=GroupSafeSplitter().split(records,features(),manifest.dataset_sha256)
            evaluation=ModelEvaluator().evaluate(['level_1'],[[.25]*4],labels(),dataset_kind='synthetic_software_fixture')
            target=Path(root)/'registration.json'
            report=ArtifactRegistry().register(target,dataset_manifest=manifest,labels=labels(),features=features(),split=split,evaluation=evaluation)
            self.assertFalse(report['live_enabled']);self.assertFalse(report['clinical_validation'])
            self.assertEqual(report['dataset_kind'],'synthetic_software_fixture')
            self.assertNotIn('SYNTHETIC-P-',target.read_text())
            with self.assertRaises(ReadinessError):ArtifactRegistry().register(target,dataset_manifest=manifest,labels=labels(),features=features(),split=split,evaluation=evaluation)
            invalid=Path(root)/'invalid.json'
            with self.assertRaises(ValueError):ArtifactRegistry().register(invalid,dataset_manifest=manifest,labels=labels(),features=features(),split=split,evaluation={'invalid':float('nan')})
            self.assertFalse(invalid.exists())
