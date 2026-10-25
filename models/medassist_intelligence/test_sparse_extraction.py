import copy
import hashlib
import json
import unittest
from pathlib import Path
from .sparse_extraction import bridge_candidate, score, valid_output

ROOT = Path(__file__).parent / 'groq-v1'


class SparseExtractionTests(unittest.TestCase):
    def setUp(self):
        self.suite = json.loads((ROOT / 'suite-candidate.json').read_text())
        self.case = self.suite['cases'][0]

    def test_twenty_fresh_gold_cases_and_pinned_review_bytes(self):
        data = (ROOT / 'suite-candidate.json').read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(), (ROOT / 'suite-candidate.sha256').read_text().split()[0])
        self.assertEqual(len(self.suite['cases']), 20)
        old = json.loads((ROOT.parent / 'extraction-v1.json').read_text())
        self.assertFalse({c['text'] for c in self.suite['cases']} & {c['text'] for c in old['cases']})
        for case in self.suite['cases']:
            self.assertTrue(valid_output(case['expected'], case['text']), case['case_id'])
            self.assertTrue(score(case['expected'], case)['semantic_exact'], case['case_id'])

    def test_not_mentioned_is_omission_not_unknown_or_negative(self):
        for state in ['unknown', 'absent', 'present']:
            raw = copy.deepcopy(self.case['expected'])
            raw['observations'].append({'evidence_id': 'E_91', 'state': state, 'quote': 'coughing'})
            self.assertFalse(valid_output(raw, self.case['text']))
            self.assertEqual(score(raw, self.case)['unsupported_assertions'], 1)

    def test_unknown_cannot_be_negative_or_omitted(self):
        case = self.suite['cases'][8]
        for state in ['absent', 'present']:
            raw = copy.deepcopy(case['expected']); raw['observations'][0]['state'] = state
            self.assertEqual(score(raw, case)['polarity_errors'], 1)
            self.assertEqual(score(raw, case)['omission_unknown_confusion'], 1)
        raw = copy.deepcopy(case['expected']); raw['observations'] = []
        self.assertEqual(score(raw, case)['omission_unknown_confusion'], 1)

    def test_unsupported_and_duration_retained_without_made_up_ids(self):
        for index in [14, 15, 16]:
            case = self.suite['cases'][index]
            self.assertIsNone(bridge_candidate(case['expected'], case['text']))
            raw = copy.deepcopy(case['expected']); raw['unmapped'] = []
            self.assertFalse(score(raw, case)['semantic_exact'])
            self.assertEqual(score(raw, case)['unmapped_omissions'], 1)

    def test_single_present_can_only_be_a_confirmation_candidate(self):
        self.assertEqual(bridge_candidate(self.case['expected'], self.case['text'])['value'], True)
        for case in self.suite['cases'][3:]:
            self.assertIsNone(bridge_candidate(case['expected'], case['text']))

    def test_invalid_ids_extra_fields_duplicate_ids_and_non_source_quotes(self):
        for change in ['id', 'extra', 'duplicate', 'quote']:
            raw = copy.deepcopy(self.case['expected'])
            if change == 'id': raw['observations'][0]['evidence_id'] = 'E_999'
            elif change == 'extra': raw['diagnosis'] = 'not allowed'
            elif change == 'duplicate': raw['observations'] *= 2
            else: raw['observations'][0]['quote'] = 'not supplied'
            self.assertFalse(valid_output(raw, self.case['text']))

    def test_injection_cannot_carry_disclosures(self):
        raw = copy.deepcopy(self.case['expected']); raw['instruction_attempt'] = True
        self.assertFalse(valid_output(raw, self.case['text']))


if __name__ == '__main__':
    unittest.main()
