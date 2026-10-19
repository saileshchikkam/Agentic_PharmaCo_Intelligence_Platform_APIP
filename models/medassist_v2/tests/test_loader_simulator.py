"""Task 2 synthetic tests: fake local bundles only, never medical accuracy fixtures."""
import copy
import csv
import hashlib
import io
import json
from pathlib import Path
import pickle
import stat
import struct
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from models.medassist_v2 import loader
from models.medassist_v2.simulator import OfflineCase
from models.medassist_v2.validation import HERE, InvalidRecord, read_json


class LoaderSimulatorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.catalogue = read_json(HERE / 'fixtures/catalogue.json')
        self.raw = read_json(HERE / 'fixtures/ddxplus-shaped-record.json')
        self.raw['PATHOLOGY'] = 'HIDDEN_DIAGNOSIS_SENTINEL'
        self.raw['DIFFERENTIAL_DIAGNOSIS'] = [['HIDDEN_DIAGNOSIS_SENTINEL', 1.0]]
        source = {eid: {'data_type': d['data_type'], 'is_antecedent': d['kind'] == 'antecedent',
                        'question_en': d['question_en'], 'possible-values': d['possible_values']}
                  for eid, d in self.catalogue['evidences'].items()}
        (self.root / 'release_evidences.json').write_text(json.dumps(source))
        (self.root / 'release_conditions.json').write_text(json.dumps({'hidden': {'condition_name': self.raw['PATHOLOGY']}}))
        for i, name in enumerate(loader.PARTITIONS.values()):
            record = copy.deepcopy(self.raw); record['AGE'] = 20 + i
            self.zip(name, [record])
        self.specs = {'files': []}
        for path in self.root.iterdir():
            self.pin(path)
        self.patcher = patch.object(loader, 'manifest', return_value=self.specs)
        self.patcher.start(); self.addCleanup(self.patcher.stop)

    def pin(self, path):
        content = path.read_bytes()
        self.specs['files'] = [f for f in self.specs['files'] if f['name'] != path.name]
        self.specs['files'].append({'name': path.name, 'bytes': len(content),
            'publisher_reported_md5': hashlib.md5(content, usedforsecurity=False).hexdigest(), 'local_sha256': None})

    def zip(self, name, records, member='patients.csv'):
        text = io.StringIO(newline=''); writer = csv.writer(text)
        writer.writerow(list(self.raw))
        for record in records:
            writer.writerow([repr(v) if isinstance(v, list) else v for v in record.values()])
        with zipfile.ZipFile(self.root / name, 'w', zipfile.ZIP_DEFLATED) as archive:
            archive.writestr(member, text.getvalue())

    def session(self, **kwargs):
        return OfflineCase(self.raw, self.catalogue, 'train').start(**kwargs)

    def test_partition_memberships_and_aggregate_readiness(self):
        bundle = loader.DatasetLoader(self.root)
        for i, partition in enumerate(loader.PARTITIONS):
            rows = list(bundle.records(partition))
            self.assertEqual(rows[0][0], partition)
            self.assertEqual(rows[0][2]['AGE'], 20 + i)
        report = bundle.readiness()
        self.assertEqual([r['rows'] for r in report['partitions'].values()], [1, 1, 1])
        self.assertNotIn('HIDDEN_DIAGNOSIS_SENTINEL', json.dumps(report))
        self.assertFalse(report['source_partitions_regenerated'])
        with self.assertRaises(InvalidRecord):
            list(bundle.records('validate'))

    def test_missing_file_never_invents_statistics(self):
        (self.root / 'release_test_patients.zip').unlink()
        result = loader.DatasetLoader(self.root).readiness()
        self.assertEqual(result['missing_files'], ['release_test_patients.zip'])
        self.assertIsNone(result['real_data_statistics'])

    def test_size_md5_and_optional_sha_checks(self):
        p = self.root / 'release_train_patients.zip'
        original = p.read_bytes()
        p.write_bytes(original + b'x')
        with self.assertRaisesRegex(InvalidRecord, 'source_size_mismatch'):
            list(loader.DatasetLoader(self.root).records('train'))
        p.write_bytes(bytes([original[0] ^ 1]) + original[1:])
        with self.assertRaisesRegex(InvalidRecord, 'source_hash_mismatch'):
            list(loader.DatasetLoader(self.root).records('train'))
        p.write_bytes(original)
        next(f for f in self.specs['files'] if f['name'] == p.name)['local_sha256'] = '0' * 64
        with self.assertRaisesRegex(InvalidRecord, 'source_sha256_mismatch'):
            list(loader.DatasetLoader(self.root).records('train'))

    def test_archive_traversal_absolute_and_backslash_paths(self):
        name = loader.PARTITIONS['train']
        for member in ('../patients.csv', '/patients.csv', 'C:patients.csv', 'a\\patients.csv', '.hidden.csv'):
            self.zip(name, [self.raw], member); self.pin(self.root / name)
            with self.assertRaisesRegex(InvalidRecord, 'unsafe_archive_path'):
                list(loader.DatasetLoader(self.root).records('train'))

    def test_multiple_members_rejected_before_central_allocation(self):
        name = loader.PARTITIONS['train']
        with zipfile.ZipFile(self.root / name, 'w') as archive:
            archive.writestr('one.csv', 'one'); archive.writestr('two.csv', 'two')
        self.pin(self.root / name)
        with self.assertRaisesRegex(InvalidRecord, 'archive_directory_limit'):
            list(loader.DatasetLoader(self.root).records('train'))

    def test_symlink_and_expansion_limits(self):
        item = zipfile.ZipInfo('patients.csv'); item.external_attr = (stat.S_IFLNK | 0o777) << 16
        item.file_size, item.compress_size = 100, 100
        fake = type('Fake', (), {'infolist': lambda _: [item]})()
        with self.assertRaisesRegex(InvalidRecord, 'unsafe_archive_member_type'):
            loader.archive_member(fake)
        item.external_attr = 0; item.file_size = loader.MAX_EXPANDED_BYTES + 1
        with self.assertRaisesRegex(InvalidRecord, 'archive_expansion_limit'):
            loader.archive_member(fake)

    def test_bad_crc_is_rejected_even_with_matching_outer_test_hash(self):
        path = self.root / loader.PARTITIONS['train']
        data = bytearray(path.read_bytes())
        offset = data.index(b'PK\x01\x02')
        previous = struct.unpack_from('<L', data, offset + 16)[0]
        struct.pack_into('<L', data, offset + 16, previous ^ 1)
        path.write_bytes(data); self.pin(path)
        with self.assertRaisesRegex(InvalidRecord, 'malformed_archive_or_csv'):
            list(loader.DatasetLoader(self.root).records('train'))

    def test_bounded_multiline_and_lazy_record_validation(self):
        with patch.object(loader, 'MAX_RECORD_BYTES', 32):
            lines = loader.BoundedLines(io.BytesIO(b'x' * 19 + b'\n' + b'y' * 19 + b'\n'))
            next(lines)
            with self.assertRaisesRegex(InvalidRecord, 'record_size_limit'):
                next(lines)
        name = loader.PARTITIONS['train']
        self.zip(name, [self.raw, self.raw]); self.pin(self.root / name)
        with patch.object(loader, '_validate_ddxplus_record', wraps=loader._validate_ddxplus_record) as validate:
            stream = loader.DatasetLoader(self.root).records('train')
            next(stream); self.assertEqual(validate.call_count, 1)
            stream.close()

    def test_malformed_record_fails_without_echoing_labels(self):
        self.raw['EVIDENCES'] = ['MISSING']
        name = loader.PARTITIONS['train']; self.zip(name, [self.raw]); self.pin(self.root / name)
        with self.assertRaises(InvalidRecord) as error:
            list(loader.DatasetLoader(self.root).records('train'))
        self.assertNotIn('HIDDEN_DIAGNOSIS_SENTINEL', str(error.exception))

    def test_input_bytes_unchanged(self):
        before = {p.name: p.read_bytes() for p in self.root.iterdir()}
        loader.DatasetLoader(self.root).readiness()
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.root.iterdir()})

    def test_initial_selector_view_has_no_future_answers_or_diagnoses(self):
        session = self.session()
        view = session.view()
        self.assertEqual([a['evidence_id'] for a in view['revealed_answers']], ['FX_SYM'])
        self.assertIsNone(view['disclosed_context'])
        encoded = json.dumps(view)
        for forbidden in ('HIDDEN_DIAGNOSIS_SENTINEL', 'PATHOLOGY', 'DIFFERENTIAL_DIAGNOSIS', 'EVIDENCES', 'source_partition'):
            self.assertNotIn(forbidden, encoded)
        changed = copy.deepcopy(self.raw)
        changed['EVIDENCES'] = ['FX_SYM', 'FX_CAT_@_option_b']
        changed['AGE'] = 99
        self.assertEqual(view, OfflineCase(changed, self.catalogue, 'test').start().view())

    def test_valid_question_reveals_only_that_evidence(self):
        session = self.session(); session.ask('FX_CAT')
        view = session.view()
        self.assertEqual(view['revealed_answers'][-1]['value'], 'option_a')
        self.assertEqual(len(view['revealed_answers']), 2)
        self.assertEqual(view['asked_questions'], ['FX_CAT'])

    def test_repeated_initial_and_invalid_questions_do_not_query_oracle(self):
        session = self.session(); before = session.view()
        self.assertEqual(session.ask('FX_SYM'), 'already_disclosed')
        self.assertEqual(before, session.view())
        for question in ([], None, 'UNRECOGNISED'):
            with self.assertRaisesRegex(InvalidRecord, '^invalid_question$'):
                session.ask(question)
        session.ask('FX_CAT'); after = session.view()
        self.assertEqual(session.ask('FX_CAT'), 'already_disclosed')
        self.assertEqual(after, session.view())

    def test_absent_evidence_is_unknown_not_invented_false(self):
        session = self.session(); session.ask('FX_ANT')
        self.assertEqual(session.view()['unknown_answers'], ['FX_ANT'])
        self.assertIsNone(session.view()['revealed_answers'][-1]['value'])

    def test_multichoice_reveal_and_explicit_demographic_disclosure(self):
        session = self.session(disclose_demographics=True)
        self.assertEqual(session.view()['disclosed_context']['age'], 25)
        session.ask('FX_MULTI')
        self.assertEqual(session.view()['revealed_answers'][-1]['value'], ['option_x', 'option_y'])

    def test_contradictions_retained_and_not_silently_resolved(self):
        session = self.session(); session.observe('FX_SYM', False)
        view = session.view()
        self.assertEqual(view['revealed_answers'][0]['state'], 'contradiction')
        self.assertEqual(len(view['answer_history']), 2)
        session.observe('FX_SYM', True)
        self.assertEqual(session.view()['revealed_answers'][0]['state'], 'contradiction')
        with self.assertRaises(InvalidRecord):
            session.observe('FX_CAT', 'option_a')

    def test_budget_and_stopping_reasons(self):
        session = self.session(question_budget=1); session.ask('FX_CAT')
        self.assertEqual(session.view()['stopping_reason'], 'question_budget')
        before = session.view(); self.assertEqual(session.ask('FX_ANT'), 'stopped')
        self.assertEqual(before, session.view())
        session = self.session(); session.stop('insufficient_information')
        self.assertEqual(session.view()['stopping_reason'], 'insufficient_information')

    def test_selector_callback_receives_detached_public_data_and_replays(self):
        observed = []
        def selector(view):
            observed.append(copy.deepcopy(view))
            return 'FX_CAT' if not view['asked_questions'] else None
        first = self.session().run(selector)
        self.assertEqual(first, self.session().run(selector))
        session = self.session(); view = session.view()
        view['question_catalogue'].clear(); view['revealed_answers'][0]['value'] = 'changed'
        self.assertEqual(session.view()['revealed_answers'][0]['value'], True)
        self.assertNotIn('HIDDEN_DIAGNOSIS_SENTINEL', json.dumps(observed))

    def test_repr_serialization_and_evaluator_separation(self):
        case = OfflineCase(self.raw, self.catalogue, 'train'); session = case.start()
        for item in (case, session, session._oracle):
            self.assertNotIn('HIDDEN_DIAGNOSIS_SENTINEL', repr(item))
            with self.assertRaises(TypeError):
                pickle.dumps(item)
        self.assertFalse(hasattr(session, '_evaluator'))
        result = case.evaluator_data(); result['PATHOLOGY'] = 'modified'
        self.assertEqual(case.evaluator_data()['PATHOLOGY'], 'HIDDEN_DIAGNOSIS_SENTINEL')


if __name__ == '__main__':
    unittest.main()
