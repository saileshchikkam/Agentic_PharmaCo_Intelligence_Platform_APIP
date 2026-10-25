import hashlib
from pathlib import Path
import tempfile
import unittest
from models.medassist_ai.jayanth_model.artifact_manifest import ArtifactManifest
from models.medassist_ai.jayanth_model.adapter import JayanthDiseaseModelAdapter
from models.medassist_ai.jayanth_model.vocabulary_mapping import VocabularyMapping
from models.medassist_ai.core.exceptions import EvidenceRejected
from .fixtures import handoff


class JayanthTests(unittest.TestCase):
    def test_restored_integrity_never_enables_canonical_artifact_execution(self):
        adapter = JayanthDiseaseModelAdapter(ArtifactManifest('.'))
        report = adapter.inspect()
        self.assertTrue(report['integrity_complete'])
        self.assertTrue(all(c['present'] and c['sha256_matched'] for c in report['checks']))
        self.assertFalse(report['execution_enabled'])
        self.assertFalse(report['trusted_to_deserialize'])
        self.assertEqual(adapter.predict(handoff()).status, 'unavailable')
        self.assertEqual(adapter.lookup('fictional').get('status'), 'unavailable')

    def test_integrity_is_not_trust_and_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'fixture.joblib'; p.write_bytes(b'not executable')
            sha=hashlib.sha1(b'blob 14\0not executable').hexdigest()
            manifest={'artifacts':[{'path':p.name,'size':14,'git_blob_sha1':sha}]}
            report=ArtifactManifest(tmp,manifest).inspect()
            self.assertTrue(report['integrity_complete']);self.assertFalse(report['trusted_to_deserialize'])
            manifest['artifacts'][0]['sha256']='0'*64
            self.assertFalse(ArtifactManifest(tmp,manifest).inspect()['integrity_complete'])
            del manifest['artifacts'][0]['sha256']
            p.write_bytes(b'corrupt')
            self.assertFalse(ArtifactManifest(tmp,manifest).inspect()['integrity_complete'])
            manifest['artifacts'][0]['path']='../escape'
            with self.assertRaises(ValueError):ArtifactManifest(tmp,manifest).inspect()

    def test_unknown_never_encoded_as_negative(self):
        evidence=handoff()
        with self.assertRaises(EvidenceRejected):VocabularyMapping(['cough'],{'E_53':'cough'}).encode(evidence)
        with self.assertRaises(EvidenceRejected):VocabularyMapping(['a','b'],{'E_0':'a'}).encode(evidence)
        self.assertEqual(VocabularyMapping(['a'],{'E_0':'a'}).encode(evidence),(1,))
        evidence.items[0].status='observed_negative';evidence.items[0].value=False
        self.assertEqual(VocabularyMapping(['a'],{'E_0':'a'}).encode(evidence),(0,))
