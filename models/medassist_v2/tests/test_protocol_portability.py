"""Software tampering fixtures only; no training, source records or official ledger."""
import hashlib
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.research_adapter import protocol_integrity as integrity
from models.medassist_v2.research_adapter.service import checked_bytes
from models.medassist_v2.training.data import file_hash, implementation_hashes
from models.medassist_v2.validation import read_json


class ProtocolPortabilityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.path = self.root / integrity.NAME
        self.lf = integrity.authenticated_bytes().replace(b'\r\n', b'\n')
        self.path.write_bytes(self.lf)
        self.path.with_suffix('.sha256').write_text(integrity.HISTORICAL_SHA256 + '  ' + integrity.NAME + '\n')

    def reject(self, raw):
        self.path.write_bytes(raw)
        with self.assertRaises((ValueError, OSError)):
            integrity.protocol(self.path)

    def test_historical_crlf(self):
        self.path.write_bytes(self.lf.replace(b'\n', b'\r\n'))
        self.assertEqual(file_hash(self.path), integrity.HISTORICAL_SHA256)
        self.assertEqual(integrity.protocol(self.path), integrity.protocol())

    def test_canonical_git_lf(self):
        self.assertEqual(file_hash(self.path), integrity.CANONICAL_SHA256)
        self.assertEqual(integrity.historical_digest(self.path), integrity.HISTORICAL_SHA256)

    def test_semantics_and_non_line_ending_bytes_identical(self):
        crlf = self.lf.replace(b'\n', b'\r\n')
        self.assertEqual(crlf.replace(b'\r\n', b'\n'), self.lf)
        self.assertEqual(json.loads(crlf), json.loads(self.lf))
        self.assertEqual(hashlib.sha256(crlf).hexdigest(), integrity.HISTORICAL_SHA256)

    def test_changed_field(self):
        self.reject(self.lf.replace(b'UNKNOWN', b'FALSE', 1))

    def test_changed_numeric_parameter(self):
        self.assertIn(b'65536', self.lf)
        self.reject(self.lf.replace(b'65536', b'65537', 1))

    def test_added_field(self):
        self.reject(self.lf.replace(b'{', b'{"unauthorized": true,', 1))

    def test_removed_field(self):
        value = json.loads(self.lf); del value['scope']
        self.reject(json.dumps(value).encode())

    def test_non_line_ending_whitespace(self):
        for raw in [b' ' + self.lf, self.lf + b' ', self.lf + b'\n', self.lf.replace(b'  ', b'   ', 1)]:
            with self.subTest(raw_size=len(raw)): self.reject(raw)

    def test_mixed_line_endings(self):
        self.reject(self.lf.replace(b'\n', b'\r\n', 1))

    def test_malformed_line_endings(self):
        for raw in [self.lf.replace(b'\n', b'\r\r\n'), self.lf.replace(b'\n', b'\r')]:
            with self.subTest(): self.reject(raw)

    def test_unrecognized_encodings(self):
        for raw in [b'\xef\xbb\xbf' + self.lf, self.lf.decode().encode('utf-16'), b'\xff' + self.lf]:
            with self.subTest(): self.reject(raw)

    def test_corruption_and_empty_file(self):
        for raw in [b'', b'{}', self.lf[:30], self.lf + b'\x00']:
            with self.subTest(): self.reject(raw)

    def test_missing_file(self):
        self.path.unlink()
        with self.assertRaises(ValueError): integrity.protocol(self.path)

    def test_substituted_filename(self):
        other = self.root / 'substituted.json'; other.write_bytes(self.lf)
        with self.assertRaises(ValueError): integrity.protocol(other)

    def test_missing_or_substituted_pin(self):
        pin = self.path.with_suffix('.sha256'); pin.unlink()
        with self.assertRaises(ValueError): integrity.protocol(self.path)
        pin.write_text(integrity.CANONICAL_SHA256 + '  ' + integrity.NAME)
        with self.assertRaises(ValueError): integrity.protocol(self.path)

    def test_symlink_rejected(self):
        with patch.object(Path, 'is_symlink', return_value=True):
            with self.assertRaises(ValueError): integrity.protocol(self.path)

    def test_bounded_file(self):
        self.reject(b' ' * (integrity.MAXIMUM + 1))

    def test_deterministic_byte_mutations(self):
        for index in range(0, len(self.lf), max(1, len(self.lf) // 32)):
            raw = bytearray(self.lf); raw[index] ^= 1
            with self.subTest(index=index): self.reject(bytes(raw))

    def test_general_and_binary_hashing_remain_exact(self):
        artifact = self.root / 'model.pkl'; artifact.write_bytes(b'fictional\r\nbinary\x00')
        expected = file_hash(artifact)
        self.assertEqual(checked_bytes(self.root, artifact.name, expected, 1024), artifact.read_bytes())
        artifact.write_bytes(artifact.read_bytes().replace(b'\r\n', b'\n'))
        with self.assertRaises(ValueError): checked_bytes(self.root, artifact.name, expected, 1024)
        self.assertEqual(file_hash(self.path), integrity.CANONICAL_SHA256)

    def test_frozen_study_and_locked_test_implementation_unchanged(self):
        expected = {'training/campaign.py': '3a9a199aa99eb646a138633599b95a69aa8edfe11b81592f171c319ef73c431b',
                    'training/data.py': '3f06366415adbb6baae0c5a89535b0dac75bd92914cffe43d9704b7c933f1523',
                    'training/runner.py': '567ed1b52e76b622359de1e1e5ba5f74d472410583c57f4c3ed6308361a8120f',
                    'questioning_protocol.py': '4f2f55a52bf4ba106259fba2512ba425db91010ddf8d68ca372460aa7059ab6b'}
        for name, digest in expected.items(): self.assertEqual(file_hash(ref.HERE / name), digest)
        with self.assertRaises(ValueError): ref.load_protocol(self.path)  # Legacy study entry remains strict.

    def sealed_fixture(self):
        artifacts = {}
        for n in range(17):
            f = self.root / ('fixture-%02d.bin' % n); f.write_bytes(b'fictional\r\n\x00')
            artifacts[f.name] = file_hash(f)
        seal = {'mode': 'official', 'run_root': str(self.root.resolve()), 'implementation': implementation_hashes(),
                'protocol_sha256': integrity.HISTORICAL_SHA256, 'source_hashes': {}, 'artifacts': artifacts}
        s = self.root / 'pre-test-seal.json'; s.write_text(json.dumps(seal))
        receipt = {'seal_sha256': file_hash(s), 'artifact_hashes': artifacts, 'source_hashes': {}}
        (self.root / 'pre-test-seal-hash.json').write_text(json.dumps({'sha256': receipt['seal_sha256']}))
        original = read_json
        def reader(path):
            return receipt if Path(path) == ref.HERE / 'task4b-aggregate.json' else original(path)
        return reader

    def test_read_only_seal_accepts_and_rejects_binary_tamper(self):
        reader = self.sealed_fixture(); before = {p.name: p.read_bytes() for p in self.root.iterdir()}
        with patch.object(integrity, 'read_json', side_effect=reader):
            integrity.verify_existing_seal(self.root, SimpleNamespace(mode='official', receipt={}), integrity.protocol())
            self.assertEqual(before, {p.name: p.read_bytes() for p in self.root.iterdir()})
            f = self.root / 'fixture-00.bin'; f.write_bytes(f.read_bytes().replace(b'\r\n', b'\n'))
            with self.assertRaises(ValueError): integrity.verify_existing_seal(self.root, SimpleNamespace(mode='official', receipt={}), integrity.protocol())

    def test_replacing_seal_and_its_receipt_does_not_change_published_anchor(self):
        reader = self.sealed_fixture()
        (self.root / 'pre-test-seal.json').write_text('{}')
        (self.root / 'pre-test-seal-hash.json').write_text(json.dumps({'sha256': file_hash(self.root / 'pre-test-seal.json')}))
        with patch.object(integrity, 'read_json', side_effect=reader):
            with self.assertRaises(ValueError): integrity.verify_existing_seal(self.root, SimpleNamespace(mode='official', receipt={}), integrity.protocol())
