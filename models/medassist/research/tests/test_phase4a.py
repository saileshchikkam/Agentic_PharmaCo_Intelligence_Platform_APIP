"""Synthetic regression tests; no patient fixtures, model fitting or downloads."""
import ast
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import joblib
import numpy as np
import pandas as pd

from models.medassist.research.audit.cli import assert_preserved, inventory, inventory_digest, load_cache
from models.medassist.research.audit.errors import counts, summarize
from models.medassist.research.data import VITALS


class Phase4AAuditTests(unittest.TestCase):
    def fixture(self):
        frame = pd.DataFrame({'IMMEDR': [1, 2, 3, 5], 'AGE': [0, 25, 70, 10],
            'AGEFL': [0, 0, 0, 2], 'BDATEFL': [0, 0, 1, 0], 'SEX': [1, 2, 1, 2],
            'SEXFL': [0, 0, 1, 0], 'RACEUN': [1, 2, -9, 1], 'ETHUN': [1, 2, -9, 1],
            'RFV1': [10000, 20000, -9, 12000], **{v: [1, 0, -9, 1] for v in VITALS}})
        vitals = frame[VITALS].mask(frame[VITALS].isin([0, -9])).copy()
        vitals.loc[0, 'BPSYS'], vitals.loc[0, 'BPDIAS'] = 50, 70
        return frame, vitals

    def test_binary_counts_and_abstention_union_not_double_counted(self):
        result = counts([1, 2, 3, 5], [.1, .9, .8, .1], True, .5, np.array([True, True, False, False]))
        self.assertEqual(result['high_false_negatives'], 1)
        self.assertEqual(result['false_positives'], 1)
        self.assertEqual(result['Immediate_not_detected_as_high'], 1)
        self.assertEqual(result['high_missed_or_abstained'], 2)
        self.assertEqual(result['Immediate_abstained'], 1)

    def test_ordinal_exact_Immediate_differs_from_high_detection(self):
        p = np.eye(5)[np.array([2, 4, 2, 5]) - 1]
        result = counts([1, 2, 3, 5], p, False)
        self.assertEqual(result['Immediate_exact_class_errors'], 1)
        self.assertEqual(result['Immediate_not_detected_as_high'], 0)
        self.assertEqual(result['undertriage'], 2)
        self.assertEqual(result['severe_undertriage'], 1)

    def test_probabilities_and_masks_fail_closed(self):
        for probabilities in [[np.nan], [1.1], [[.2] * 5]]:
            with self.assertRaises(ValueError):
                counts([1], probabilities, True, .5)
        with self.assertRaises(ValueError):
            counts([1], [.1], True, .5, [1])
        with self.assertRaises(ValueError):
            counts([1], [[.1] * 5], False)
        with self.assertRaises(ValueError):
            counts([0], [.1], True, .5)

    def test_missing_provenance_conflict_and_sparse_publication(self):
        frame, vitals = self.fixture()
        result = summarize(frame, vitals, np.array([.1, .9, .8, .1]), True, .5)
        self.assertEqual(result['strata']['age_provenance']['quarantined']['rows'], 2)
        self.assertEqual(result['strata']['BP_order']['systolic_below_diastolic']['rows'], 1)
        self.assertEqual(result['strata']['vital_missing_count']['7']['rows'], 2)
        self.assertTrue(result['strata']['sex_provenance']['original']['sparse_high_comparison'])
        self.assertNotIn('rate', str(result))
        self.assertNotIn('source_row', str(result))

    def test_fit_quality_does_not_invent_predictions(self):
        frame, vitals = self.fixture()
        result = summarize(frame, vitals)
        self.assertFalse(result['error_predictions_available'])
        self.assertNotIn('errors', result)
        self.assertNotIn('high_false_negatives', str(result))

    def test_absent_abstention_cache_is_unknown_not_zero(self):
        result = counts([1, 2], [.1, .9], True, .5)
        self.assertNotIn('abstained', result)
        self.assertNotIn('high_missed_or_abstained', result)

    def test_alignment_guard(self):
        frame, vitals = self.fixture()
        with self.assertRaises(ValueError):
            summarize(frame, vitals.iloc[::-1])

    def test_protected_file_mutation_addition_and_deletion(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'cache').write_bytes(b'original')
            before = inventory([root])
            self.assertEqual(inventory_digest(before), inventory_digest(inventory([root])))
            (root / 'extra').write_bytes(b'new')
            with self.assertRaises(ValueError):
                assert_preserved(before, inventory([root]))
            (root / 'extra').unlink()
            (root / 'cache').write_bytes(b'changed')
            with self.assertRaises(ValueError):
                assert_preserved(before, inventory([root]))
            (root / 'cache').unlink()
            with self.assertRaises(ValueError):
                assert_preserved(before, inventory([root]))

    def test_never_load_model_artifacts(self):
        with patch('joblib.load', side_effect=AssertionError('deserializer reached')):
            with self.assertRaises(ValueError):
                load_cache(Path('artifacts/base.joblib'), [1])

    def test_membership_labels_and_array_only_cache(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'private-test-predictions'
            root.mkdir()
            path = root / 'synthetic.joblib'
            joblib.dump({'source_rows': np.array([4, 9]), 'IMMEDR': np.array([1, 2])}, path)
            load_cache(path, [4, 9], [1, 2])
            for rows, labels in [([9, 4], [1, 2]), ([4, 9], [2, 1])]:
                with self.assertRaises(ValueError):
                    load_cache(path, rows, labels)
            joblib.dump({'source_rows': [4, 9]}, path)
            with self.assertRaises(ValueError):
                load_cache(path, [4, 9], [1, 2])

    def test_audit_source_has_no_training_prediction_or_threshold_calls(self):
        package = Path(__file__).resolve().parents[1] / 'audit'
        forbidden = {'fit', 'fit_transform', 'predict', 'predict_proba', 'train', 'evaluate',
                     'choose_threshold', 'choose_best', 'acquire', 'run_worker'}
        for file in package.glob('*.py'):
            tree = ast.parse(file.read_text())
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    name = node.func.id if isinstance(node.func, ast.Name) else getattr(node.func, 'attr', None)
                    self.assertNotIn(name, forbidden)

    def test_source_manifest_never_approves_clinical_truth_or_downloads(self):
        path = Path(__file__).resolve().parents[2] / 'reports/2026-10-19-phase4a/validation-sources.json'
        data = json.loads(path.read_text())
        self.assertFalse(data['clinical_ground_truth_approved'])
        self.assertEqual(len(data['datasets']), len({d['id'] for d in data['datasets']}))
        for source in data['datasets']:
            self.assertTrue(all(u.startswith('https://') for u in source['sources']))
            self.assertFalse(source['data_downloaded_in_phase4a'])
            self.assertIsNone(source['downloaded_data_sha256'])
            self.assertTrue(source['blockers'])


if __name__ == '__main__':
    unittest.main()
