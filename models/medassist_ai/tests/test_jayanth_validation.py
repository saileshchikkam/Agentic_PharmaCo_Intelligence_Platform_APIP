from pathlib import Path
import pickle
import unittest
from models.medassist_ai.core.exceptions import EvidenceRejected
from models.medassist_ai.jayanth_model.static_inspection import literal_string_list, opcode_summary
from models.medassist_ai.jayanth_model.vocabulary_mapping import SymptomVocabulary
from models.medassist_ai.jayanth_model.adapter import JayanthDiseaseModelAdapter
from models.medassist_ai.jayanth_model.artifact_manifest import ArtifactManifest


class VocabularyValidationTests(unittest.TestCase):
    def test_literal_only_parser_reads_exact_canonical_feature_order_without_unpickling(self):
        values=literal_string_list(Path('app/ml/symptom_columns.joblib').read_bytes())
        self.assertEqual(len(values),131)
        self.assertEqual(len(set(values)),131)
        with self.assertRaises(EvidenceRejected):literal_string_list(b"cos\nsystem\n(S'never execute'\ntR.")
        with self.assertRaises(EvidenceRejected):literal_string_list(pickle.dumps(['a','b'])+b'extra')
        with self.assertRaises(EvidenceRejected):literal_string_list(pickle.dumps(['a','a']))
        self.assertTrue(opcode_summary(Path('app/ml/model.joblib').read_bytes())['object_construction_present'])

    def test_case_whitespace_underscore_and_unicode_normalize_without_fuzzy_guessing(self):
        vocab=SymptomVocabulary(['skin_rash','cough','foul_smell_of urine'])
        result=vocab.normalize([' COUGH ','skin  rash','cough','foul_smell_of_urine','coughing',''])
        self.assertEqual(result.present,('skin_rash','cough','foul_smell_of urine'))
        self.assertEqual(result.unsupported,('coughing',''))
        self.assertEqual(vocab.normalize(['ＣＯＵＧＨ']).present,('cough',))
        self.assertEqual(vocab.normalize(['fever']).not_observed,vocab.feature_order)
        with self.assertRaises(EvidenceRejected):SymptomVocabulary(['skin_rash','skin rash'])
        with self.assertRaises(EvidenceRejected):vocab.normalize('cough')
        with self.assertRaises(EvidenceRejected):vocab.normalize([False])

    def test_feature_order_requires_explicit_negatives_and_rejects_unknown_or_contradiction(self):
        vocab=SymptomVocabulary(['rash','cough'])
        self.assertEqual(vocab.observed_vector(positive=['cough'],negative=['rash']),(0,1))
        for yes,no in [(['cough'],[]),(['cough','other'],['rash']),(['cough'],['cough','rash'])]:
            with self.assertRaises(EvidenceRejected):vocab.observed_vector(positive=yes,negative=no)

    def test_existing_adapter_exposes_normalization_but_keeps_predictions_and_precautions_disabled(self):
        adapter=JayanthDiseaseModelAdapter(ArtifactManifest('.'))
        result=adapter.normalize_symptoms(['itching','UNSUPPORTED FIXTURE'])
        self.assertEqual(result.present,('itching',))
        self.assertEqual(result.unsupported,('UNSUPPORTED FIXTURE',))
        self.assertEqual(len(result.not_observed),130)
        self.assertEqual(adapter.predict(None).status,'unavailable')
        self.assertEqual(adapter.lookup('fixture')['status'],'unavailable')
