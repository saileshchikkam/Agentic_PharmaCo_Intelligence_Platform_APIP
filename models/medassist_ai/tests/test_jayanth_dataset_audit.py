import unittest
from unittest.mock import patch
from models.medassist_ai.jayanth_model.dataset_audit import audit_dataset


class DatasetAuditTests(unittest.TestCase):
    def test_group_partition_is_repeatable_without_fitting_or_loading_model(self):
        with patch('joblib.load',side_effect=AssertionError('no_joblib_load')) as loader:
            first=audit_dataset('.')
            second=audit_dataset('.')
        loader.assert_not_called()
        self.assertEqual(first,second)
        self.assertEqual(first['rows'],4920)
        self.assertEqual(first['symptom_groups'],304)
        self.assertEqual(first['repeated_symptom_vectors'],4616)
        self.assertEqual(first['historical_row_split_audit']['test_rows_with_symptom_group_in_training'],984)
        partition=first['prospective_group_partition']
        self.assertEqual(partition['group_overlap'],0)
        self.assertEqual(partition['train_rows']+partition['test_rows'],first['rows'])
        self.assertFalse(partition['independent_test_for_existing_model'])
        self.assertEqual(partition['test_label_count'],32)
        self.assertIsNone(first['model_accuracy_or_calibration_claim'])
        self.assertEqual(first['models_fitted'],0)
