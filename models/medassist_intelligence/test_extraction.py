"""Exact authored disclosures are engineering gold, never clinical urgency labels."""
import copy
import unittest
from collections import Counter

from .extraction import assess, contract_valid, load_suite, promotion_decision, schema_valid


class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.suite = load_suite()

    def test_frozen_case_count_coverage_and_all_gold_contracts(self):
        self.assertEqual(Counter(c['group'] for c in self.suite['cases']), {
            'single': 8, 'multiple': 8, 'negation': 8, 'uncertainty': 8, 'typed_duration': 8, 'adversarial': 8})
        self.assertTrue(any(c['context']['age'] < 18 for c in self.suite['cases']))
        for case in self.suite['cases']:
            self.assertTrue(contract_valid(case['expected'], case, self.suite), case['case_id'])
            self.assertTrue(assess(case['expected'], case, self.suite)['exact_match'])

    def test_hallucinated_ids_extra_clinical_fields_and_wrong_types_rejected(self):
        case = self.suite['cases'][0]
        for mutation in ['id', 'type', 'extra', 'quote', 'duplicate']:
            raw = copy.deepcopy(case['expected'])
            if mutation == 'id': raw['items'][0]['evidence_id'] = 'E_999'
            if mutation == 'type': raw['items'][0]['value'] = 1
            if mutation == 'extra': raw['severity'] = 'invented'
            if mutation == 'quote': raw['items'][0]['quote'] = 'not in input'
            if mutation == 'duplicate': raw['items'] *= 2
            self.assertFalse(contract_valid(raw, case, self.suite), mutation)

    def test_negation_unknown_contradiction_and_missing_do_not_become_positive(self):
        for case in self.suite['cases']:
            for observed in case['expected']['items']:
                if observed['value'] is False or observed['state'] in ('unknown', 'contradiction'):
                    raw = copy.deepcopy(case['expected'])
                    target = next(i for i in raw['items'] if i['evidence_id'] == observed['evidence_id'])
                    target.update(state='confirmed', value=True)
                    self.assertGreater(assess(raw, case, self.suite)['wrong_polarity_or_unknown'], 0)

    def test_typed_values_require_disclosed_dependency_and_exact_integer(self):
        case = self.suite['cases'][32]
        self.assertTrue(contract_valid(case['expected'], case, self.suite))
        no_parent = {**case, 'pending_question': None}
        self.assertFalse(contract_valid(case['expected'], no_parent, self.suite))
        for value in [True, '0', 11, -1]:
            bad = copy.deepcopy(case['expected']); bad['items'][0]['value'] = value
            self.assertFalse(contract_valid(bad, case, self.suite))

    def test_partial_or_failed_run_can_never_enable_provider(self):
        result = {'case_id': 'fictional-01', 'schema_valid': True, 'contract_valid': True,
                  'exact_match': True, 'elapsed_ms': 1, 'peak_process_rss_bytes': 1, 'peak_gpu_bytes': 0}
        decision = promotion_decision([result], self.suite)
        self.assertFalse(decision['software_gate_passed'])
        self.assertFalse(decision['runtime_enablement'])
        self.assertFalse(schema_valid({'items': []}))

    def test_complete_gate_separates_cold_latency_and_still_requires_manual_review(self):
        rows = [{'case_id': case['case_id'], 'schema_valid': True, 'contract_valid': True,
                 'exact_match': True, 'elapsed_ms': 1000, 'peak_process_rss_bytes': 1, 'peak_gpu_bytes': 0}
                for _ in range(2) for case in self.suite['cases']]
        rows[0]['elapsed_ms'] = 9000
        decision = promotion_decision(rows, self.suite)
        self.assertTrue(decision['software_gate_passed'])
        self.assertFalse(decision['runtime_enablement'])
        rows[0]['elapsed_ms'] = 16000
        self.assertFalse(promotion_decision(rows, self.suite)['software_gate_passed'])
        rows[0]['elapsed_ms'] = 1000
        rows[5]['wrong_polarity_or_unknown'] = 1
        self.assertFalse(promotion_decision(rows, self.suite)['software_gate_passed'])


if __name__ == '__main__': unittest.main()
