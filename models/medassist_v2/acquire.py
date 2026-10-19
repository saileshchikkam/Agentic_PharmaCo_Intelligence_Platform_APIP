"""Acquire only the pinned public bundle, into a new external directory. Never overwrite."""
import argparse
import hashlib
import json
import urllib.request

from .loader import manifest
from .storage import external_path
from .validation import require


def verify_publisher(plan, metadata):
    require(metadata.get('version') == plan['version'] and metadata.get('doi') == plan['doi'], 'publisher_version')
    require(metadata.get('license', {}).get('url', '').rstrip('/') == plan['licence']['url'].rstrip('/'), 'publisher_licence')
    files = metadata.get('files', [])
    require(len(files) == len(plan['files']), 'publisher_file_count')
    for spec in plan['files']:
        matches = [item for item in files if item.get('id') == spec['file_id']]
        require(len(matches) == 1, 'publisher_file_id')
        item = matches[0]
        require((item.get('name'), item.get('size'), item.get('download_url'), item.get('computed_md5')) ==
                (spec['name'], spec['bytes'], spec['url'], spec['publisher_reported_md5']), 'publisher_file_changed')


def acquire(root):
    plan = manifest()
    with urllib.request.urlopen(plan['metadata_url'], timeout=60) as response:
        metadata_bytes = response.read(1024 * 1024 + 1)
    require(len(metadata_bytes) <= 1024 * 1024, 'publisher_metadata_size')
    metadata = json.loads(metadata_bytes)
    verify_publisher(plan, metadata)
    root = external_path(root)
    require(not root.exists(), 'acquisition_root_exists')
    root.mkdir(parents=True, exist_ok=False)
    (root / 'publisher-metadata.json').write_bytes(metadata_bytes)
    receipt = {'dataset_doi': plan['doi'], 'licence': plan['licence'],
               'metadata_sha256': hashlib.sha256(metadata_bytes).hexdigest(), 'files': []}
    for spec in plan['files']:
        partial = root / (spec['name'] + '.part')
        md5, sha, size = hashlib.md5(usedforsecurity=False), hashlib.sha256(), 0
        with urllib.request.urlopen(spec['url'], timeout=120) as source, partial.open('xb') as target:
            while block := source.read(65536):
                size += len(block)
                require(size <= spec['bytes'], 'source_size_mismatch')
                md5.update(block); sha.update(block); target.write(block)
        require(size == spec['bytes'] and md5.hexdigest() == spec['publisher_reported_md5'], 'download_verification_failed')
        partial.rename(root / spec['name'])
        receipt['files'].append({'name': spec['name'], 'bytes': size, 'md5': md5.hexdigest(), 'sha256': sha.hexdigest()})
        print('Verified ' + spec['name'], flush=True)
    with (root / 'acquisition-receipt.json').open('x', encoding='utf-8') as target:
        json.dump(receipt, target, indent=2)
    return receipt


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True)
    acquire(parser.parse_args().root)
