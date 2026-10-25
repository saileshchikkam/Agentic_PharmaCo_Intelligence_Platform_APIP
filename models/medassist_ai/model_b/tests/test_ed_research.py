"""Software fixtures only; no synthetic clinical performance claims or model fitting."""
import unittest
from unittest.mock import patch
from tempfile import TemporaryDirectory
from pathlib import Path
import numpy as np

from models.medassist_ai.model_b.data import ReadinessError
from models.medassist_ai.model_b.disabled_provider import DisabledModelB
from models.medassist_ai.model_b.ed_research import (EDVisit, EDPreprocessor, FEATURES,
    observation, group_view, split_records, SCHEMA, run)
from models.medassist_ai.model_b.evaluation import EDResearchEvaluator
from models.medassist_ai.model_b.splitting import symptom_key


def fixture(i):
    # Counter features exercise software splitting, not clinical labels or evidence.
    features = {name: observation(name, -9) for name in FEATURES}
    features['AGE'] = observation('AGE', i % 94)
    features['SEX'] = observation('SEX', i % 2+1)
    features['RFV1'] = observation('RFV1', 10050+i*10)
    return EDVisit(f'SOFTWARE-{i}', str(i % 5+1), features)


class EDResearchTests(unittest.TestCase):
    def test_missing_unknown_special_and_zero_are_distinct(self):
        self.assertEqual(observation('PAINSCALE', -8).state, 'unknown')
        self.assertEqual(observation('PAINSCALE', -9).state, 'not_asked')
        self.assertEqual(observation('PULSE', 998).state, 'unsupported')
        zero = observation('PAINSCALE', 0)
        self.assertEqual((zero.state, zero.value), ('observed_value', 0.0))
        self.assertEqual(observation('TEMPF', 986).value, 98.6)

    def test_unordered_complaints_group_together_ignoring_vitals(self):
        a, b = fixture(0), fixture(0)
        a.features['RFV2'] = observation('RFV2', 10100)
        b.features['RFV2'], b.features['RFV1'] = b.features['RFV1'], a.features['RFV2']
        b.features['PULSE'] = observation('PULSE', 80)
        self.assertEqual(symptom_key(group_view(a), SCHEMA), symptom_key(group_view(b), SCHEMA))

    def test_grouped_stratified_split_is_deterministic_and_complete(self):
        records = [fixture(i) for i in range(150)]
        duplicate = fixture(0); duplicate.record_id = 'SOFTWARE-DUPLICATE'
        records.append(duplicate)
        split, audit = split_records(records, '0'*64)
        again, _ = split_records(records, '0'*64)
        self.assertEqual(split, again)
        self.assertEqual(audit['cross_split_overlap'], 0)
        self.assertFalse(audit['patient_independent'])
        self.assertTrue(any(0 in part and 150 in part for part in split.parts().values()))
        self.assertEqual(sorted(i for p in split.parts().values() for i in p), list(range(151)))

    def test_preprocessing_is_train_only_and_retains_state_channels(self):
        a, b = fixture(0), fixture(1)
        a.features['PULSE'] = observation('PULSE', 60)
        b.features['PULSE'] = observation('PULSE', 100)
        encoder = EDPreprocessor().fit([a, b])
        saved = encoder.medians.copy()
        missing, unknown = fixture(2), fixture(2)
        unknown.features['PULSE'] = observation('PULSE', -8)
        matrix = encoder.transform([missing, unknown]).toarray()
        np.testing.assert_array_equal(encoder.medians, saved)
        self.assertFalse(np.array_equal(matrix[0], matrix[1]))
        self.assertTrue(np.isfinite(matrix).all())

    def test_five_class_metrics_underclassification_and_abstention(self):
        report = EDResearchEvaluator().evaluate(['1', '2', '3', '4', '5'],
            [[0, 0, 1, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0],
             [0.2]*5, [0, 0, 0, 0, 1]])
        self.assertAlmostEqual(report['accuracy'], .6)
        self.assertEqual(report['severe_acuity_underclassification']['1']['predicted_less_acute'], 1)
        self.assertEqual(report['severe_acuity_underclassification']['1']['underclassified_by_at_least_two_levels'], 1)
        self.assertAlmostEqual(report['abstention']['coverage'], .8)
        self.assertEqual(len(report['confusion_matrix']), 5)
        with self.assertRaises(ReadinessError):
            EDResearchEvaluator().evaluate(['1'], [[.25]*4])

    def test_external_exclusive_output_and_disabled_provider(self):
        self.assertEqual(DisabledModelB().assess(None).status, 'unable_to_assess')
        with TemporaryDirectory() as root, patch('models.medassist_ai.model_b.ed_research.load_source') as load:
            with self.assertRaises(ReadinessError):
                run('never-opened', root)  # existing outputs forbidden before source read
            with self.assertRaises(ReadinessError):
                run('never-opened', Path.cwd()/'must-not-create')
            load.assert_not_called()
