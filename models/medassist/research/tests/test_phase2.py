"""Protocol tests use synthetic records only. No estimator is fitted."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd

from models.medassist.research.acquire import sha256
from models.medassist.research.data import feature_matrix
from models.medassist.research.protocol import (SPEC, assignment_digest, binary_support_guard,
    fitting_cv, load_protocol, preflight, research_matrix, task_target, validate_assignments)
from models.medassist.research.splits import assess_split, connected_groups, support
from test_phase1 import fixture


class Phase2Tests(unittest.TestCase):
    def setUp(self):
        self.config = load_protocol()

    def frozen_fixture(self):
        df = fixture()
        groups = connected_groups(df)
        # Test setup only: Phase 2 production code has no split-generation call.
        _, assignments = assess_split(df, groups)
        records = [{'source_row': int(i), 'partition': str(p)} for i, p in zip(df.index, assignments)]
        items = [support(df.IMMEDR.to_numpy()[assignments == p]) for p in self.config['partitions']]
        cohort = {'rows': len(df), 'assignment_sha256': assignment_digest(df.index, assignments),
                  'partition_rows': [i['rows'] for i in items],
                  'partition_high_acuity': [i['high_acuity'] for i in items],
                  'partition_immediate': [i['immediate'] for i in items]}
        return df, groups, records, cohort, assignments

    def test_binary_target_preserves_source_and_excludes_unknowns(self):
        df = fixture(); original = df.copy(deep=True)
        self.assertEqual(task_target(df.iloc[:5], 'primary_binary', self.config).tolist(), [1, 1, 0, 0, 0])
        self.assertEqual(task_target(df.iloc[:5], 'secondary_five_class', self.config).tolist(), [1, 2, 3, 4, 5])
        pd.testing.assert_frame_equal(df, original)
        for code in [-9, -8, 0, 7, 6, np.nan]:
            bad = df.copy(); bad.loc[0, 'IMMEDR'] = code
            with self.assertRaises(ValueError): task_target(bad, 'primary_binary', self.config)

    def test_all_labelled_no_rfv_and_matched_symptom_ablations(self):
        df = fixture(); df.loc[0, 'RFV1'] = 20050
        full = research_matrix(df, 'all_labelled_initial_vitals', self.config)
        self.assertEqual(len(full), len(df))
        self.assertNotIn('RFV1', full.columns)
        self.assertTrue(full.index.equals(research_matrix(df, 'demographic_reference', self.config).index))
        symptom = research_matrix(df, 'presentation_symptom_proxy', self.config)
        self.assertNotIn(0, symptom.index)
        self.assertTrue(symptom.index.equals(research_matrix(df, 'ed_initial_symptom_proxy', self.config).index))

    def test_zero_missingness_provenance_and_raw_preservation(self):
        df = fixture()
        for c in ['TEMPF', 'PULSE', 'RESPR', 'BPSYS', 'BPDIAS', 'POPCT', 'PAINSCALE', 'AGE']: df.loc[0, c] = 0
        df.loc[1, 'AGEFL'] = -9; df.loc[2, 'BDATEFL'] = 1; df.loc[3, 'SEXFL'] = 1
        df.loc[4, 'PULSE'] = 998; df.loc[5, 'PAINSCALE'] = -8
        original = df.copy(deep=True)
        x = research_matrix(df, 'all_labelled_initial_vitals', self.config)
        for c in self.config['cleaning']['zero_to_missing']: self.assertTrue(pd.isna(x.loc[0, c]))
        self.assertEqual(x.loc[0, 'AGE'], 0); self.assertEqual(x.loc[0, 'PAINSCALE'], 0)
        for row, c in [(1,'AGE'),(2,'AGE'),(3,'SEX'),(4,'PULSE'),(5,'PAINSCALE')]: self.assertTrue(pd.isna(x.loc[row,c]))
        pd.testing.assert_frame_equal(df, original)
        # Historical Phase 1 decoder still preserves observed zero; the Phase 2 policy is explicit.
        self.assertEqual(feature_matrix(df, 'all_labelled_initial_vitals').loc[0,'PULSE'], 0)

    def test_no_rfv_profile_rejects_leaking_columns(self):
        df = fixture()
        for c in ['RFV1','IMMEDR','PATWT','AGEFL','SEXFL','DIAG1','TEMPDF','DISP']:
            with self.assertRaises(ValueError): feature_matrix(df, 'all_labelled_initial_vitals', ['AGE',c])
        df['PULSE'] = df.PULSE.astype(float)
        df.loc[0,'PULSE'] = np.inf
        with self.assertRaises(ValueError): research_matrix(df, 'all_labelled_initial_vitals', self.config)

    def test_saved_assignments_reused_and_mutations_fail_closed(self):
        df, groups, records, cohort, assignments = self.frozen_fixture()
        actual = validate_assignments(df, records, groups, cohort, self.config)
        self.assertEqual(actual.tolist(), assignments.tolist())
        for mutate in ['partition','order','duplicate','missing','extra_key']:
            bad = copy.deepcopy(records)
            if mutate=='partition': bad[0]['partition']='locked_test' if bad[0]['partition']!='locked_test' else 'fit'
            elif mutate=='order': bad.reverse()
            elif mutate=='duplicate': bad[1]=bad[0]
            elif mutate=='missing': bad.pop()
            else: bad[0]['extra']=True
            with self.assertRaises(ValueError): validate_assignments(df,bad,groups,cohort,self.config)
        overlapping = np.zeros(len(df),dtype=int)
        with self.assertRaises(ValueError): validate_assignments(df,records,overlapping,cohort,self.config)

    def test_grouped_cv_reproducible_fit_only_no_estimator_fit(self):
        df, groups, _, _, assignments = self.frozen_fixture()
        with (patch('sklearn.linear_model.LogisticRegression.fit', side_effect=AssertionError('no training')),
             patch('sklearn.ensemble.RandomForestClassifier.fit', side_effect=AssertionError('no training')),
             patch('sklearn.ensemble.HistGradientBoostingClassifier.fit', side_effect=AssertionError('no training'))):
            a, digest_a = fitting_cv(df,assignments,groups,self.config)
            b, digest_b = fitting_cv(df,assignments,groups,self.config)
        self.assertEqual(a,b); self.assertEqual(digest_a,digest_b)
        changed = df.copy(); changed.loc[assignments!='fit','IMMEDR']=5
        self.assertEqual(fitting_cv(changed,assignments,groups,self.config)[1], digest_a)
        self.assertEqual(sum(fold['validation']['rows'] for fold in a), int((assignments=='fit').sum()))

    def test_rare_class_safeguards_and_binary_support(self):
        df,groups,_,_,assignments=self.frozen_fixture()
        with self.assertRaises(ValueError): binary_support_guard(df,assignments,groups,self.config)
        relaxed=copy.deepcopy(self.config)
        for key in ['calibration','threshold_selection']:
            relaxed[key].update(minimum_positive=1,minimum_negative=1,minimum_connected_groups=1)
        result=binary_support_guard(df,assignments,groups,relaxed)
        self.assertGreater(result['calibration']['positive'],0)
        self.assertFalse(self.config['calibration']['five_class_or_Immediate_specific_calibration_allowed'])
        self.assertFalse(self.config['threshold_selection']['Immediate_specific_optimization_allowed'])

    def test_frozen_protocol_hash_and_model_boundaries(self):
        self.assertEqual(sha256(SPEC), SPEC.with_suffix('.sha256').read_text().strip())
        self.assertEqual(list(self.config['models']), ['LogisticRegression','RandomForestClassifier','HistGradientBoostingClassifier'])
        self.assertFalse(self.config['models']['HistGradientBoostingClassifier']['fixed']['early_stopping'])
        self.assertFalse(self.config['split_regeneration_allowed'])
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'baseline-protocol.json'; path.write_text('{}')
            path.with_suffix('.sha256').write_text('0'*64)
            with patch('models.medassist.research.protocol.SPEC',path):
                with self.assertRaises(ValueError): load_protocol()

    def test_preflight_refuses_missing_assignments_instead_of_regenerating(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError): preflight(Path(tmp),'absent',self.config)
            with self.assertRaises(ValueError): preflight(Path(tmp),'../escape',self.config)


if __name__ == '__main__':
    unittest.main()
