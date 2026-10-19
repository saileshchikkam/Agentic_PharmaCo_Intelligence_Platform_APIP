"""Publisher-format regressions using fabricated records, never copied patient rows."""
import copy
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from models.medassist_v2 import acquire, audit, loader
from models.medassist_v2.tests import test_loader_simulator as bundle_fixtures
from models.medassist_v2.validation import InvalidRecord, validate_ddxplus_record, _validate_ddxplus_record


class RealFormatTests(unittest.TestCase):
    def setUp(self):
        self.bundle = bundle_fixtures.LoaderSimulatorTests('test_missing_file_never_invents_statistics')
        self.bundle.setUp()
        self.addCleanup(self.bundle.doCleanups)

    def test_official_extensionless_partition_member_and_permuted_header(self):
        b = self.bundle
        b.raw = dict(reversed(list(b.raw.items())))
        for partition, name in loader.PARTITIONS.items():
            record = b.raw
            b.zip(name, [record], member=name.removesuffix('.zip')); b.pin(b.root / name)
            rows = list(loader.DatasetLoader(b.root).records(partition))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0][0], partition)

    def test_wrong_extensionless_member_and_traversal_still_fail(self):
        b = self.bundle
        for member in ('release_test_patients', '../release_train_patients', '/release_train_patients', 'arbitrary'):
            b.zip(loader.PARTITIONS['train'], [b.raw], member=member)
            b.pin(b.root / loader.PARTITIONS['train'])
            with self.assertRaises(InvalidRecord):
                list(loader.DatasetLoader(b.root).records('train'))

    def test_prevalidated_stream_path_has_same_checks(self):
        b = self.bundle
        for field, bad in [('AGE', -1), ('SEX', 'unknown'), ('EVIDENCES', ['missing']),
                           ('INITIAL_EVIDENCE', 'missing'), ('DIFFERENTIAL_DIAGNOSIS', [['hidden', 2]])]:
            record = dict(b.raw, **{field: bad})
            for check in (lambda: validate_ddxplus_record(record, b.catalogue),
                          lambda: _validate_ddxplus_record(record, b.catalogue['evidences'])):
                with self.assertRaises(InvalidRecord):
                    check()
        self.assertEqual(validate_ddxplus_record(b.raw, b.catalogue),
                         _validate_ddxplus_record(b.raw, b.catalogue['evidences']))

    def test_duplicate_screen_ignores_evidence_order_but_separates_labels(self):
        b = self.bundle
        record = validate_ddxplus_record(b.raw, b.catalogue)
        other = copy.deepcopy(record); other['EVIDENCES'].reverse()
        self.assertEqual(audit.fingerprints(record), audit.fingerprints(other))
        other['PATHOLOGY'] = 'DIFFERENT_EVALUATOR_LABEL'
        first, second = audit.fingerprints(other)
        self.assertNotEqual(first, audit.fingerprints(record)[0])
        self.assertEqual(second, audit.fingerprints(record)[1])

    def test_disk_duplicate_aggregation_crossings(self):
        db = sqlite3.connect(':memory:')
        self.addCleanup(db.close)
        db.execute('CREATE TABLE fingerprints(kind, hash, partition, n)')
        db.executemany('INSERT INTO fingerprints VALUES(?,?,?,?)',
                       [(0,b'a','train',2),(0,b'a','test',1),(0,b'b','validation',1)])
        result = audit.duplicate_summary(db, 0)
        self.assertEqual((result['duplicate_groups'],result['extra_rows'],result['cross_partition_groups'],
                          result['rows_in_cross_partition_groups']), (1,2,1,3))
        self.assertEqual(result['pairwise_shared_groups']['train__test'], 1)

    def test_train_only_probe_and_replay(self):
        b = self.bundle
        for partition in ('validation', 'test'):
            with self.assertRaisesRegex(InvalidRecord, 'simulation_training_only'):
                audit.simulation_probe(b.raw, b.catalogue, partition)
        result = audit.simulation_probe(b.raw, b.catalogue, 'train', budget=2)
        self.assertEqual(result['questions'], 2)

    def test_source_numeric_categories_python_literals_and_explicit_na(self):
        b = self.bundle
        catalogue = copy.deepcopy(b.catalogue)
        catalogue['evidences']['FX_CAT']['possible_values'] = [4, 'NA']
        from models.medassist_v2.simulator import OfflineCase
        for encoded, expected in [('4', 4), ('NA', 'NA')]:
            record = dict(b.raw, EVIDENCES=repr(['FX_SYM', 'FX_CAT_@_' + encoded]))
            interview = OfflineCase(record, catalogue, 'train').start()
            interview.ask('FX_CAT')
            answer = next(a for a in interview.view()['revealed_answers'] if a['evidence_id'] == 'FX_CAT')
            self.assertEqual(answer['value'], expected)
            self.assertEqual(answer['state'], 'confirmed')


class AcquisitionTests(unittest.TestCase):
    def setUp(self):
        self.plan = loader.manifest()
        self.metadata = {'version': self.plan['version'], 'doi': self.plan['doi'],
                         'license': {'url': self.plan['licence']['url']},
                         'files': [{'id': f['file_id'], 'name': f['name'], 'size': f['bytes'],
                                    'download_url': f['url'], 'computed_md5': f['publisher_reported_md5']}
                                   for f in self.plan['files']]}

    def test_every_publisher_pin_is_enforced(self):
        acquire.verify_publisher(self.plan, self.metadata)
        for field, value in [('id',0),('name','other.zip'),('size',1),('download_url','https://invalid/'),('computed_md5','0'*32)]:
            metadata = copy.deepcopy(self.metadata); metadata['files'][0][field] = value
            with self.assertRaises(InvalidRecord):
                acquire.verify_publisher(self.plan, metadata)
        for field, value in [('version',3),('doi','other'),('license',{'url':'https://invalid/'})]:
            with self.assertRaises(InvalidRecord):
                acquire.verify_publisher(self.plan, dict(self.metadata, **{field: value}))

    def test_existing_root_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as root:
            marker = Path(root) / 'preserve'; marker.write_bytes(b'original')
            with patch.object(acquire.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(self.metadata).encode())):
                with self.assertRaisesRegex(InvalidRecord, 'acquisition_root_exists'):
                    acquire.acquire(root)
            self.assertEqual(marker.read_bytes(), b'original')

    def test_failed_download_hash_stops_and_preserves_partial(self):
        plan = copy.deepcopy(self.plan)
        plan['files'] = [dict(plan['files'][0], bytes=3, publisher_reported_md5='0' * 32)]
        metadata = dict(self.metadata, files=[dict(self.metadata['files'][0], size=3, computed_md5='0' * 32)])
        with tempfile.TemporaryDirectory() as parent:
            root = Path(parent) / 'fresh'
            with patch.object(acquire, 'manifest', return_value=plan), patch.object(acquire.urllib.request, 'urlopen',
                    side_effect=[io.BytesIO(json.dumps(metadata).encode()), io.BytesIO(b'bad')]) as opened:
                with self.assertRaisesRegex(InvalidRecord, 'download_verification_failed'):
                    acquire.acquire(root)
            self.assertEqual(opened.call_count, 2)
            self.assertFalse((root / plan['files'][0]['name']).exists())
            self.assertEqual((root / (plan['files'][0]['name'] + '.part')).read_bytes(), b'bad')
            self.assertFalse((root / 'acquisition-receipt.json').exists())
