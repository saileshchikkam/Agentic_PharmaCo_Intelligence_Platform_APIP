"""Software-only fixtures; no synthetic clinical performance or estimator training."""
import copy
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

from models.medassist_ai.model_b.data import ReadinessError
from models.medassist_ai.model_b.ed_experiment2 import (development_records, balanced_weights,
    select_candidate, validate_split, audit_development, run)
from models.medassist_ai.model_b.ed_research import FEATURES


def software_frame():
    # Arbitrary schema counters test access boundaries; never clinical ground truth.
    return pd.DataFrame([{**{n: -9 for n in FEATURES}, 'AGE': i, 'SEX': 1,
        'RFV1': 10050+10*i, 'AGEFL': 1, 'BDATEFL': 0, 'SEXFL': 0, 'IMMEDR': i%5+1}
        for i in range(15)])


def metric(macro=.3, recall=.5, under=2):
    return {'macro_f1': macro, 'per_class': {c: {'recall': recall} for c in ('1', '2')},
        'severe_acuity_underclassification': {c: {'predicted_less_acute': under} for c in ('1', '2')}}


class Experiment2Tests(unittest.TestCase):
    def test_protected_rows_never_become_feature_records(self):
        frame = software_frame()
        # A protected row contains a poison feature that would fail numerical conversion.
        frame['PULSE'] = frame.PULSE.astype(object)
        frame.loc[10:, 'PULSE'] = 'MUST_NOT_BE_CONVERTED'
        split = {'train': list(range(5)), 'calibration': list(range(5, 10)), 'test': list(range(10, 15))}
        raw, clean, audit = development_records(frame, split)
        self.assertEqual(set(clean), {'train', 'calibration'})
        self.assertEqual(len(clean['train']), 5)
        self.assertEqual(audit['calibration']['n'], 5)
        self.assertFalse({r.record_id for part in clean.values() for r in part} & {'10','11','12','13','14'})
        self.assertEqual(audit_development(clean)['cross_split_overlap'], 0)

    def test_source_imputation_mask_and_ageflag_correction(self):
        frame = software_frame()
        frame.loc[0, 'SEXFL'] = 1
        frame.loc[1, 'AGEFL'] = -9
        frame.loc[1, 'BDATEFL'] = 1
        split = {'train': list(range(5)), 'calibration': list(range(5, 10)), 'test': list(range(10, 15))}
        raw, clean, _ = development_records(frame, split)
        self.assertEqual(clean['train'][0].features['SEX'].state, 'unknown')
        self.assertEqual(clean['train'][1].features['AGE'].state, 'unknown')
        self.assertEqual(clean['train'][2].features['AGE'].state, 'observed_value')  # AGEFL=1 reported
        self.assertEqual(raw['train'][0].features['SEX'].state, 'observed_value')

    def test_split_is_fixed_complete_and_exclusive(self):
        with self.assertRaises(ReadinessError):
            validate_split({'train': [0], 'calibration': [1], 'test': [1]}, 3)

    def test_training_weight_does_not_duplicate_records(self):
        targets = ['1', '1', '2', '3', '4', '5']
        weight = balanced_weights(targets)
        self.assertEqual(len(weight), len(targets))
        for label in set(targets):
            self.assertAlmostEqual(sum(w for w, y in zip(weight, targets) if y == label), 6/5)

    def test_selection_cannot_trade_severe_errors_for_macro_f1(self):
        baseline = metric()
        unsafe = metric(macro=.9, recall=.4)
        chosen = select_candidate({'leaf2': unsafe, 'leaf5': metric(macro=.31)}, baseline, baseline)
        self.assertEqual(chosen['selected_id'], 'leaf5')
        self.assertIsNone(select_candidate({'leaf2': unsafe}, baseline, baseline)['selected_id'])
        worse_under = metric(macro=.8, under=3)
        self.assertIsNone(select_candidate({'leaf5': worse_under}, baseline, baseline)['selected_id'])

    def test_existing_outputs_and_repository_are_rejected_before_loading(self):
        with TemporaryDirectory() as root, patch('models.medassist_ai.model_b.ed_experiment2.verify_prior') as verify:
            with self.assertRaises(ReadinessError): run('unused', 'unused', root)
            with self.assertRaises(ReadinessError): run('unused', 'unused', Path.cwd()/'must-not-create')
            verify.assert_not_called()
