import hashlib
import json
from pathlib import Path


class ArtifactManifest:
    """Git blob integrity inspection only. Never imports the upstream loader."""
    def __init__(self, root, manifest=None):
        self.root = Path(root).resolve()
        self.manifest = manifest or json.loads(Path(__file__).with_name('manifest.json').read_text(encoding='utf-8'))

    def inspect(self):
        checks = []
        for entry in self.manifest['artifacts']:
            relative = Path(entry['path'])
            p = (self.root / relative).resolve()
            if relative.is_absolute() or not p.is_relative_to(self.root):
                raise ValueError('INVALID_MANIFEST_PATH')
            present = p.is_file()
            matched = False
            sha256_matched = None
            if present and p.stat().st_size == entry['size']:
                h = hashlib.sha1()
                sha256 = hashlib.sha256()
                h.update(f"blob {entry['size']}\0".encode())
                with p.open('rb') as f:
                    for chunk in iter(lambda: f.read(1024*1024), b''):
                        h.update(chunk)
                        sha256.update(chunk)
                matched = h.hexdigest() == entry['git_blob_sha1']
                if 'sha256' in entry:
                    sha256_matched = sha256.hexdigest() == entry['sha256']
            checks.append({'path': entry['path'], 'present': present, 'git_blob_matched': matched,
                           'sha256_matched': sha256_matched})
        return {'checks': checks, 'integrity_complete': bool(checks) and all(
                    c['git_blob_matched'] and c['sha256_matched'] is not False for c in checks),
                'trusted_to_deserialize': False, 'execution_enabled': False}
