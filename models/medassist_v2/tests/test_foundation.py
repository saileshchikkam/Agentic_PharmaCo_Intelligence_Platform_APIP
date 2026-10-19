"""Fictional software fixtures only; no medical performance or clinical-label claims."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from jsonschema import Draft202012Validator

from models.medassist_v2.quality import URGENCY_CLASSES, class_coverage, profile
from models.medassist_v2.storage import REPO, external_path
from models.medassist_v2.validation import (HERE, InvalidRecord, read_json, validate_annotation,
                                          validate_catalogue, validate_ddxplus_record, validate_interview)


class FoundationTests(unittest.TestCase):
    def setUp(self):
        self.catalogue = read_json(HERE / 'fixtures/catalogue.json')
        self.record = read_json(HERE / 'fixtures/interview.json')
        self.raw = read_json(HERE / 'fixtures/ddxplus-shaped-record.json')

    def annotation(self, record=None):
        return {'schema_version': 'medassist-urgency-v2.1', 'record_id': (record or self.record)['record_id'],
                'scope': 'research_only', 'clinical_use_approved': False, 'reference_status': 'unlabelled',
                'label': None, 'basis': 'none', 'rubric_version': None, 'recommended_care_settings': [],
                'maximum_delay_minutes': None, 'reviewers': [], 'adjudication_reference': None}

    def distinct_records(self, n=3):
        records = []
        for i in range(n):
            r = copy.deepcopy(self.record)
            r['record_id'], r['case_id'] = f'fixture-record-{i}', f'fixture-case-{i}'
            for field in ('source_record_id', 'source_group_id', 'case_family_id'):
                r['provenance'][field] = f'fixture-{field}-{i}'
            r['context']['age']['value'] = 20 + i
            records.append(r)
        return records

    def answer(self, eid, value, state='confirmed', aid=None):
        a = {'answer_id': aid or 'fixture-answer-' + eid, 'evidence_id': eid, 'state': state,
             'value': value, 'turn_index': 0, 'source': 'patient_report'}
        self.record['answer_history'].append(a)
        self.record['unknown_information'] = [u for u in self.record['unknown_information'] if u['evidence_id'] != eid]
        if state == 'confirmed':
            self.record['confirmed_answers'].append(a['answer_id'])
        else:
            self.record['unknown_information'].append({'evidence_id': eid, 'reason': state})
        self.record['potential_follow_up_questions'] = [q for q in self.record['potential_follow_up_questions'] if q['evidence_id'] != eid]

    def test_schemas_and_valid_fixture_do_not_mutate_input(self):
        for schema in (HERE / 'schemas').glob('*.json'):
            Draft202012Validator.check_schema(read_json(schema))
        before = copy.deepcopy(self.record)
        validate_interview(self.record, self.catalogue)
        self.assertEqual(before, self.record)
        validate_annotation(self.annotation(), self.record)

    def test_required_fields_and_oracle_fields_rejected(self):
        for field in list(self.record):
            r = copy.deepcopy(self.record)
            del r[field]
            with self.assertRaises(InvalidRecord):
                validate_interview(r, self.catalogue)
        for field in ('PATHOLOGY', 'DIFFERENTIAL_DIAGNOSIS', 'EVIDENCES', 'severity', 'IMMEDR', 'urgency_label'):
            r = copy.deepcopy(self.record)
            r[field] = 'must not be an interview input'
            with self.assertRaises(InvalidRecord):
                validate_interview(r, self.catalogue)

    def test_wrong_evidence_type_kind_and_unknown_code(self):
        for mutation in ('data_type', 'kind', 'unknown'):
            r = copy.deepcopy(self.record)
            if mutation == 'data_type':
                r['evidence_types']['FX_SYM'] = 'C'
            elif mutation == 'kind':
                r['symptoms'].remove('FX_SYM'); r['antecedents'].append('FX_SYM')
            else:
                r['symptoms'].append('MISSING'); r['evidence_types']['MISSING'] = 'B'
            with self.assertRaises(InvalidRecord):
                validate_interview(r, self.catalogue)

    def test_binary_false_is_observed_not_unknown(self):
        self.record['answer_history'][0]['value'] = False
        validate_interview(self.record, self.catalogue)
        self.record['answer_history'][0]['value'] = 0
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)

    def test_categorical_and_multichoice_values(self):
        self.answer('FX_CAT', 'option_a')
        self.answer('FX_MULTI', [])
        validate_interview(self.record, self.catalogue)
        self.record['answer_history'][-1]['value'] = ['option_x', 'option_y']
        validate_interview(self.record, self.catalogue)
        for value in (['option_x', 'option_x'], ['missing'], 'option_x', True):
            self.record['answer_history'][-1]['value'] = value
            with self.assertRaises(InvalidRecord):
                validate_interview(self.record, self.catalogue)

    def test_unknown_declined_and_unasked_remain_distinct(self):
        self.answer('FX_ANT', None, 'declined')
        self.answer('FX_CAT', None, 'unknown')
        validate_interview(self.record, self.catalogue)
        result = profile([self.record], self.catalogue)['missingness_state_counts']
        self.assertEqual(result['evidence_declined'], 1)
        self.assertEqual(result['evidence_unknown'], 1)
        self.assertEqual(result['evidence_not_asked'], 1)
        self.record['answer_history'][-1]['value'] = 'option_a'
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)

    def test_cannot_forget_an_answer_as_never_asked(self):
        self.record['confirmed_answers'] = []
        self.record['unknown_information'].append({'evidence_id': 'FX_SYM', 'reason': 'not_asked'})
        with self.assertRaisesRegex(InvalidRecord, 'previous_answer_marked_unasked'):
            validate_interview(self.record, self.catalogue)

    def test_future_answers_and_duplicate_answer_ids(self):
        self.record['answer_history'][0]['turn_index'] = 1
        with self.assertRaisesRegex(InvalidRecord, 'future_answer_leakage'):
            validate_interview(self.record, self.catalogue)
        self.record['answer_history'][0]['turn_index'] = 0
        self.record['answer_history'].append(copy.deepcopy(self.record['answer_history'][0]))
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)

    def test_stale_confirmed_answer_and_out_of_order_history_fail(self):
        later = copy.deepcopy(self.record['answer_history'][0])
        later.update(answer_id='fixture-later-unknown', state='unknown', value=None, turn_index=1)
        self.record['disclosure_index'] = 1
        self.record['answer_history'].append(later)
        with self.assertRaisesRegex(InvalidRecord, 'stale_current_answer'):
            validate_interview(self.record, self.catalogue)
        self.record['answer_history'].reverse()
        with self.assertRaisesRegex(InvalidRecord, 'out_of_order_answer_history'):
            validate_interview(self.record, self.catalogue)

    def test_empty_complaint_and_omitted_initial_evidence_fail(self):
        self.record['presenting_complaint'].update(text=None, initial_evidence_id=None)
        with self.assertRaisesRegex(InvalidRecord, 'empty_presenting_complaint'):
            validate_interview(self.record, self.catalogue)
        self.record['presenting_complaint'].update(source='unprovided')
        validate_interview(self.record, self.catalogue)
        self.record['presenting_complaint'].update(source='synthetic_initial_evidence', initial_evidence_id='FX_MULTI')
        self.record['symptoms'].remove('FX_MULTI')
        self.record['evidence_types'].pop('FX_MULTI')
        self.record['unknown_information'] = [u for u in self.record['unknown_information'] if u['evidence_id'] != 'FX_MULTI']
        with self.assertRaisesRegex(InvalidRecord, 'initial_evidence_not_tracked'):
            validate_interview(self.record, self.catalogue)

    def test_contradiction_requires_explicit_history_and_resolution(self):
        second = copy.deepcopy(self.record['answer_history'][0])
        second.update(answer_id='fixture-opposite', value=False)
        self.record['answer_history'].append(second)
        with self.assertRaisesRegex(InvalidRecord, 'silent_contradiction_overwrite'):
            validate_interview(self.record, self.catalogue)
        self.record['confirmed_answers'] = []
        self.record['unknown_information'].append({'evidence_id': 'FX_SYM', 'reason': 'contradiction'})
        c = {'evidence_id': 'FX_SYM', 'answer_ids': ['fixture-answer-1', 'fixture-opposite'],
             'status': 'unresolved', 'resolution_answer_id': None}
        self.record['contradictions'] = [c]
        self.record['potential_follow_up_questions'][0]['status'] = 'blocked'
        validate_interview(self.record, self.catalogue)
        c['status'], c['resolution_answer_id'] = 'resolved', 'fixture-opposite'
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)
        self.record['confirmed_answers'] = ['fixture-opposite']
        self.record['unknown_information'] = [u for u in self.record['unknown_information'] if u['evidence_id'] != 'FX_SYM']
        validate_interview(self.record, self.catalogue)

    def test_followup_unknown_dependencies_cycles_and_question_provenance(self):
        q = self.record['potential_follow_up_questions'][0]
        q['question_text'] = 'Unversioned suggestion'
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)
        q['question_text'] = self.catalogue['evidences']['FX_CAT']['question_en']
        q['depends_on'] = ['FX_MULTI']
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)
        q['status'] = 'blocked'
        self.record['potential_follow_up_questions'].append({'evidence_id': 'FX_MULTI',
            'question_text': self.catalogue['evidences']['FX_MULTI']['question_en'], 'depends_on': ['FX_CAT'],
            'status': 'blocked', 'purpose': 'collect_unknown'})
        with self.assertRaisesRegex(InvalidRecord, 'cyclic_question_dependencies'):
            validate_interview(self.record, self.catalogue)

    def test_all_age_contexts_and_caregiver_are_representable(self):
        for age, unit in [(0, 'days'), (8, 'months'), (12, 'years'), (40, 'years'), (90, 'years')]:
            self.record['context']['age'].update(value=age, unit=unit)
            self.record['context'].update(reporter='caregiver', caregiver_relationship='fictional caregiver')
            validate_interview(self.record, self.catalogue)
        self.record['context']['age'].update(value=None, status='declined')
        validate_interview(self.record, self.catalogue)
        self.record['context']['age']['value'] = 90
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)

    def test_pregnancy_and_postpartum_not_inferred_from_demographics(self):
        self.record['context']['pregnancy'].update(status='pregnant', gestational_age_weeks=12)
        validate_interview(self.record, self.catalogue)
        self.record['context']['pregnancy']['status'] = 'unknown'
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)
        self.record['context']['pregnancy']['gestational_age_weeks'] = None
        self.record['context']['postpartum'].update(status='postpartum', days_since_birth=3)
        validate_interview(self.record, self.catalogue)

    def test_nonfinite_values_and_bad_provenance(self):
        for value in (float('nan'), float('inf'), -1):
            self.record['context']['age']['value'] = value
            with self.assertRaises(InvalidRecord):
                validate_interview(self.record, self.catalogue)
        self.record['context']['age']['value'] = 20
        self.record['provenance']['origin'] = 'synthetic_ddxplus'
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, self.catalogue)

    def test_ddxplus_record_and_csv_literals_are_validated_without_conversion(self):
        before = copy.deepcopy(self.raw)
        decoded = validate_ddxplus_record(self.raw, self.catalogue)
        self.assertEqual(self.raw, before)
        self.assertNotIn('urgency', decoded)
        for field in ('EVIDENCES', 'DIFFERENTIAL_DIAGNOSIS'):
            self.raw[field] = repr(self.raw[field])
        self.assertEqual(validate_ddxplus_record(self.raw, self.catalogue), decoded)

    def test_ddxplus_malformed_unknown_and_duplicate_encodings(self):
        for evidence in [['FX_SYM', 'FX_SYM'], ['MISSING'], ['FX_CAT_@_missing'],
                         ['FX_SYM_@_true'], ['FX_CAT'], ['FX_SYM', 'FX_CAT_@_option_a', 'FX_CAT_@_option_b']]:
            r = copy.deepcopy(self.raw); r['EVIDENCES'] = evidence
            with self.assertRaises(InvalidRecord):
                validate_ddxplus_record(r, self.catalogue)
        self.raw['EVIDENCES'] = "__import__('os').getcwd()"
        with self.assertRaisesRegex(InvalidRecord, 'malformed_ddxplus_literal'):
            validate_ddxplus_record(self.raw, self.catalogue)

    def test_ddxplus_initial_and_differential_contract(self):
        for field, value in [('INITIAL_EVIDENCE', 'FX_ANT'), ('INITIAL_EVIDENCE', {}),
                             ('DIFFERENTIAL_DIAGNOSIS', [['fixture', float('nan')]]),
                             ('DIFFERENTIAL_DIAGNOSIS', [['fixture', 2]]), ('AGE', True)]:
            r = copy.deepcopy(self.raw); r[field] = value
            with self.assertRaises(InvalidRecord):
                validate_ddxplus_record(r, self.catalogue)

    def test_catalogue_and_numeric_category_do_not_conflate_boolean(self):
        c = copy.deepcopy(self.catalogue); c['evidences']['FX_CAT']['possible_values'] = [1, 2]
        self.answer('FX_CAT', True)
        with self.assertRaises(InvalidRecord):
            validate_interview(self.record, c)
        c['evidences']['FX_CAT']['possible_values'] = [1, 1]
        with self.assertRaises(InvalidRecord):
            validate_catalogue(c)

    def test_urgency_unlabelled_fixture_and_abstention_contract(self):
        a = self.annotation()
        for label in ('insufficient_information', 'abstain'):
            a.update(reference_status='proposed', basis='software_fixture', label=label)
            validate_annotation(a, self.record)
        a['maximum_delay_minutes'] = 30
        with self.assertRaises(InvalidRecord):
            validate_annotation(a, self.record)

    def test_cannot_convert_diagnosis_severity_or_nhamcs_into_labels(self):
        a = self.annotation()
        for value in ('DDXPlus severity', 'PATHOLOGY', 'IMMEDR'):
            a.update(reference_status='proposed', label='emergency_evaluation', basis=value)
            with self.assertRaises(InvalidRecord):
                validate_annotation(a, self.record)
        a.update(reference_status='independently_reviewed', basis='independent_clinician_assessment')
        with self.assertRaisesRegex(InvalidRecord, 'synthetic_not_clinical_reference'):
            validate_annotation(a, self.record)

    def test_reviewer_metadata_checks_do_not_grant_clinical_approval(self):
        r = copy.deepcopy(self.record)
        r['provenance'].update(origin='clinician_authored', rights_status='verified_for_research',
                               source_url='urn:fixture:review-metadata-only', data_sha256='0' * 64)
        a = self.annotation(r)
        a.update(reference_status='independently_reviewed', label='routine_clinician_review',
                 basis='independent_clinician_assessment', rubric_version='FICTIONAL-RUBRIC-NOT-CLINICAL')
        a['reviewers'] = [{'reviewer_reference': f'fictional-reviewer-{i}', 'qualification_verified': True,
            'independent_of_model': True, 'proposed_label': 'routine_clinician_review'} for i in (1, 2)]
        validate_annotation(a, r)
        self.assertFalse(a['clinical_use_approved'])
        a['reviewers'][1]['proposed_label'] = 'prompt_clinician_review'
        with self.assertRaises(InvalidRecord):
            validate_annotation(a, r)
        a['adjudication_reference'] = 'FICTIONAL-TEST-ATTESTATION'
        validate_annotation(a, r)

    def test_class_coverage_includes_unlabelled_and_unexpected(self):
        result = class_coverage([None, 'a', 'unexpected'], ['a', 'b'])
        self.assertEqual(result['missing_classes'], ['b'])
        self.assertEqual(result['unexpected_label_count'], 1)
        self.assertEqual(result['unlabelled'], 1)
        self.assertFalse(result['clinical_adequacy_established'])

    def test_duplicates_and_missingness_are_aggregate_only(self):
        records = self.distinct_records()
        records[1]['context'] = copy.deepcopy(records[0]['context'])
        result = profile(records, self.catalogue)
        self.assertEqual(result['duplicate_content_extra_records'], 1)
        self.assertEqual(result['connected_groups'], 2)
        self.assertFalse(result['three_partition_necessary_group_condition'])
        self.assertNotIn('fixture-record', json.dumps(result))
        records[1]['record_id'] = records[0]['record_id']
        with self.assertRaisesRegex(InvalidRecord, 'duplicate_record_id'):
            profile(records, self.catalogue)

    def test_structural_split_feasibility_is_not_training_readiness(self):
        records = self.distinct_records()
        assignments = dict(zip([r['record_id'] for r in records], ['train', 'validation', 'test']))
        result = profile(records, self.catalogue, assignments=assignments)
        self.assertEqual(result['assignment_status'], 'group_safe_membership_only')
        self.assertTrue(result['three_partition_necessary_group_condition'])
        self.assertFalse(result['urgency_training_ready'])
        self.assertEqual(len(result['urgency_reference_coverage']['missing_classes']), len(URGENCY_CLASSES))

    def test_shared_prefix_family_and_transitive_groups_cannot_cross(self):
        records = self.distinct_records(4)
        records[1]['provenance']['source_group_id'] = records[0]['provenance']['source_group_id']
        records[2]['provenance']['case_family_id'] = records[1]['provenance']['case_family_id']
        assignments = {r['record_id']: ['train', 'validation', 'test', 'train'][i] for i, r in enumerate(records)}
        result = profile(records, self.catalogue, assignments=assignments)
        self.assertEqual(result['connected_groups'], 2)
        self.assertEqual(result['assignment_overlap_groups'], 1)
        self.assertEqual(result['assignment_status'], 'blocked')

    def test_original_source_splits_are_not_regenerated_or_reassigned(self):
        records = self.distinct_records()
        assignments = dict(zip([r['record_id'] for r in records], ['train', 'validation', 'test']))
        records[0]['provenance']['original_partition'] = 'test'
        result = profile(records, self.catalogue, assignments=assignments)
        self.assertEqual(result['original_partition_reassignments'], 1)
        self.assertEqual(result['assignment_status'], 'blocked')
        records[1]['provenance'].update(original_partition='train', source_group_id=records[0]['provenance']['source_group_id'])
        result = profile(records, self.catalogue)
        self.assertEqual(result['source_partition_crossing_groups'], 1)

    def test_malformed_assignments_and_duplicate_annotations_fail(self):
        records = self.distinct_records()
        for assignments in ({}, {r['record_id']: 'train' for r in records}, {r['record_id']: 'invalid' for r in records}):
            with self.assertRaises(InvalidRecord):
                profile(records, self.catalogue, assignments=assignments)
        a = self.annotation()
        with self.assertRaises(InvalidRecord):
            profile([self.record], self.catalogue, [a, a])

    def test_proposed_urgency_labels_never_count_as_independent_references(self):
        a = self.annotation()
        a.update(reference_status='proposed', label='insufficient_information', basis='software_fixture')
        result = profile([self.record], self.catalogue, [a])
        self.assertEqual(result['urgency_reference_coverage']['unlabelled'], 1)
        self.assertEqual(sum(result['urgency_reference_coverage']['counts'].values()), 0)

    def test_external_storage_guard_blocks_repo_ancestors_and_served_paths(self):
        for path in (REPO, REPO / 'models', REPO.parent, Path('relative'), REPO / 'public/data'):
            with self.assertRaises(InvalidRecord):
                external_path(path)
        external = Path(tempfile.gettempdir()) / 'apip-v2-fictional-external'
        external_path(external)
        with self.assertRaises(InvalidRecord):
            external_path(external, served_roots=[external.parent])
        with self.assertRaises(InvalidRecord):
            external_path(external / 'public/data')

    def test_duplicate_json_keys_and_invalid_json_fail_without_echoing_data(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'fixture.json'
            for content, error in [('{"private":"one","private":"two"}', 'duplicate_json_key'), ('{private}', 'malformed_json')]:
                p.write_text(content, encoding='utf-8')
                with self.assertRaisesRegex(InvalidRecord, error):
                    read_json(p)

    def test_manifest_has_no_invented_local_hash_or_download_claim(self):
        manifest = read_json(HERE / 'dataset-manifest.json')
        self.assertEqual(manifest['doi'], '10.6084/m9.figshare.22687585.v2')
        self.assertEqual(manifest['licence']['name'], 'CC BY 4.0')
        self.assertFalse(manifest['clinical_urgency_ground_truth'])
        self.assertEqual(len(manifest['files']), 5)
        for file in manifest['files']:
            self.assertFalse(file['downloaded'])
            self.assertIsNone(file['local_sha256'])


if __name__ == '__main__':
    unittest.main()
