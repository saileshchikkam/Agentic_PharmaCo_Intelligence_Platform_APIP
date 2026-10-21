"""All fixtures are generated synthetic data; no downloaded patient records used."""
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd

from models.medassist.research.acquire import acquire, external_root, sha256, verify_archive
from models.medassist.research.data import (decoded, feature_matrix, load_stata, missing_reasons,
                                            source_missing, target_eligible, validate_feature_frame)
from models.medassist.research.splits import assess_split, connected_groups, overlap_errors


def fixture(groups=50):
    n = groups * 10
    return pd.DataFrame({'IMMEDR': np.tile([1, 2, 3, 4, 5], n//5), 'AGE': [25] * n,
                         'AGEFL': [0]*n, 'BDATEFL': [0]*n, 'SEX': [1]*n, 'SEXFL': [0]*n,
                         'RFV1': [10050]*n, 'TEMPF': [986]*n, 'PULSE': [80]*n, 'RESPR': [18]*n,
                         'BPSYS': [120]*n, 'BPDIAS': [80]*n, 'POPCT': [98]*n, 'PAINSCALE': [2]*n,
                         'HOSPCODE': np.repeat(np.arange(1, groups+1), 10),
                         'CSTRATM': [1]*n, 'CPSUM': np.repeat(np.arange(1, groups+1), 10)})


class Phase1Tests(unittest.TestCase):
    def test_hash_and_zip_integrity(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)/'x'
            p.write_bytes(b'abc')
            self.assertEqual(sha256(p), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
            with zipfile.ZipFile(p, 'w') as z:
                z.writestr('ed2022-stata.dta', b'fictional-fixture')
            self.assertEqual(verify_archive(p)[0]['bytes'], 17)
            p.write_bytes(b'corrupted')
            with self.assertRaises(zipfile.BadZipFile):
                verify_archive(p)

    def test_archive_path_and_unexpected_members_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            for name in ['../ed2022-stata.dta', 'folder/ed2022-stata.dta', 'evil.exe', 'C:\\ed2022-stata.dta']:
                p = Path(tmp)/'fixture.zip'
                with zipfile.ZipFile(p, 'w') as z:
                    z.writestr(name, 'synthetic')
                with self.assertRaises(ValueError):
                    verify_archive(p)

    def test_valid_zip_with_damaged_member_fails_crc(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)/'crc.zip'
            with zipfile.ZipFile(p, 'w', compression=zipfile.ZIP_STORED) as z:
                z.writestr('ed2022-stata.dta', b'fictional-fixture')
            data = p.read_bytes(); i = data.index(b'fictional-fixture')
            p.write_bytes(data[:i] + b'X' + data[i+1:])
            with self.assertRaises((ValueError, zipfile.BadZipFile)):
                verify_archive(p)

    def test_stata_preserves_numeric_target_and_value_labels(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)/'synthetic.dta'
            pd.DataFrame({'immedr': [1., -9., -8., 0., 7., np.nan]}).to_stata(p, write_index=False,
                value_labels={'immedr': {1: 'Immediate', -9: 'Blank', -8: 'Unknown', 0: 'No triage', 7: 'No ESA triage'}})
            df, metadata = load_stata(p, require_schema=False)
            self.assertEqual(df.IMMEDR.iloc[0], 1)
            self.assertEqual(metadata.variable_value_labels['immedr'][1], 'Immediate')
            self.assertEqual(target_eligible(df.IMMEDR).tolist(), [True, False, False, False, False, False])

    def test_unknown_target_fails_closed(self):
        with self.assertRaises(ValueError):
            target_eligible(pd.Series([1, 6]))

    def test_missing_reasons_distinct_and_temperature_units(self):
        values = pd.Series([-9, -8, -7, -6, 998, 0, 80, np.nan])
        audit = missing_reasons(values, 'PULSE')
        for key in ['blank', 'unknown', 'not_applicable', 'refused', 'doppler_998', 'system_missing']:
            self.assertEqual(audit[key], 1)
        self.assertFalse(source_missing(values, 'PULSE').iloc[5])
        self.assertAlmostEqual(decoded(pd.Series([986]), 'TEMPF').iloc[0], 98.6)
        with self.assertRaises(ValueError):
            decoded(pd.Series([98.6]), 'TEMPF')

    def test_feature_allowlist_imputation_leakage_and_symptom_cohort(self):
        df = fixture()
        df.loc[0, 'SEXFL'] = 1
        df.loc[1, 'AGEFL'] = -9
        df.loc[2, 'RFV1'] = 20050  # disease module cannot enter symptom cohort
        df.loc[3, 'BDATEFL'] = 1  # Conflicting DOB provenance is quarantined, not called proven age imputation.
        df['DIAG1'] = 999
        x = feature_matrix(df, 'presentation_symptom_proxy')
        self.assertTrue(pd.isna(x.loc[0, 'SEX']))
        self.assertTrue(pd.isna(x.loc[1, 'AGE']))
        self.assertTrue(pd.isna(x.loc[3, 'AGE']))
        self.assertNotIn(2, x.index)
        self.assertNotIn('DIAG1', x.columns)
        for field in ['IMMEDR', 'DIAG1', 'TEMPDF', 'PATWT', 'made_up']:
            with self.assertRaises(ValueError):
                feature_matrix(df, 'presentation_symptom_proxy', ['AGE', field])
        with self.assertRaises(ValueError):
            validate_feature_frame(x.assign(DIAG1=1), 'presentation_symptom_proxy')

    def test_deterministic_splits_and_linked_group_components(self):
        df = fixture()
        df.loc[10:19, 'HOSPCODE'] = 1  # Links two different masked clusters.
        groups = connected_groups(df)
        self.assertEqual(groups[0], groups[10])
        a, assign_a = assess_split(df, groups)
        b, assign_b = assess_split(df, groups)
        self.assertEqual(a['assignment_sha256'], b['assignment_sha256'])
        self.assertEqual(assign_a.tolist(), assign_b.tolist())
        self.assertEqual(a['overlap_errors'], [])
        self.assertEqual(sum(p['rows'] for p in a['partitions'].values()), len(df))
        assign_a[0] = 'different'
        self.assertIn('connected_group', overlap_errors(df, assign_a, groups))

    def test_missing_group_is_not_replaced_by_row_split(self):
        df = fixture(); df.loc[0, 'CPSUM'] = -9
        with self.assertRaises(ValueError):
            connected_groups(df)

    def test_acquisition_network_failure_cannot_create_success_receipt(self):
        with tempfile.TemporaryDirectory() as tmp, patch('models.medassist.research.acquire.environment', return_value={'fixture': True}):
            def fail(*args, **kwargs):
                raise OSError('fictional network failure')
            with self.assertRaises(OSError):
                acquire(Path(tmp), opener=fail)
            folder = Path(tmp)/'raw/nhamcs-ed-2022'
            self.assertFalse((folder/'acquisition-receipt.json').exists())
            self.assertEqual(json.loads(next(folder.glob('failure-*.json')).read_text())['status'], 'failed')

    def test_environment_failure_precedes_artifact_creation(self):
        with tempfile.TemporaryDirectory() as tmp, patch('models.medassist.research.acquire.environment', side_effect=RuntimeError('missing dependency')):
            with self.assertRaises(RuntimeError):
                acquire(Path(tmp), opener=lambda *a, **k: self.fail('environment must be checked first'))
            self.assertFalse((Path(tmp)/'raw').exists())

    def test_cache_tampering_rejected_without_network(self):
        with tempfile.TemporaryDirectory() as tmp, patch('models.medassist.research.acquire.environment', return_value={}):
            folder = Path(tmp)/'raw/nhamcs-ed-2022'; folder.mkdir(parents=True)
            archive = folder/'ed2022-stata.zip'; archive.write_bytes(b'tampered')
            (folder/'acquisition-receipt.json').write_text(json.dumps({'status':'verified', 'source_url':
                'https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/stata/ed2022-stata.zip',
                'archive': {'sha256': '0'*64}}))
            with self.assertRaises(ValueError):
                acquire(Path(tmp), opener=lambda *a, **k: self.fail('network must not be invoked'))

    def test_success_cache_reuse_and_truncated_failure(self):
        with tempfile.TemporaryDirectory() as tmp, patch('models.medassist.research.acquire.environment', return_value={}):
            root = Path(tmp)
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w') as zipped:
                zipped.writestr('ed2022-stata.dta', b'fictional-fixture')
            body = buffer.getvalue()
            source = 'https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/stata/ed2022-stata.zip'
            manifest = root/'fixture-manifest.json'
            manifest.write_text(json.dumps({'datasets':[{'id':'nhamcs-ed-2022','version':'synthetic',
                'artifacts':[{'format':'stata','url':source,'head_bytes':len(body)}], 'license':{'urls':[]}}]}))
            calls = []
            class Response(io.BytesIO):
                status = 200
                headers = {}
                def geturl(self):
                    return source
            def opener(*a, **k):
                calls.append(True); return Response(body)
            with patch('models.medassist.research.acquire.MANIFEST', manifest):
                a = acquire(root/'success', opener)
                b = acquire(root/'success', lambda *a, **k: self.fail('must reuse valid cache'))
                self.assertEqual(a['archive']['sha256'], b['archive']['sha256'])
                self.assertEqual(len(calls), 1)
                with self.assertRaises(ValueError):
                    acquire(root/'truncated', lambda *a, **k: Response(body[:-4]))
                self.assertFalse((root/'truncated/raw/nhamcs-ed-2022/acquisition-receipt.json').exists())

    def test_research_root_cannot_be_repo_or_relative(self):
        with self.assertRaises(ValueError):
            external_root('relative')
        with self.assertRaises(ValueError):
            external_root(str(Path(__file__).resolve().parents[1]))


if __name__ == '__main__':
    unittest.main()
