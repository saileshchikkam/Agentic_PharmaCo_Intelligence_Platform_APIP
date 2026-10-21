"""Run with python -m models.medassist.research.cli; offline data engineering only."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

from .acquire import MANIFEST, REPO, acquire, external_root, now, sha256, write_json
from .profile import profile


def check_supporting_metadata(root: Path, run_id: str) -> dict:
    output = root / 'metadata' / run_id
    output.mkdir(parents=True, exist_ok=False)
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    ddx, mimic = manifest['datasets'][1:]
    with urllib.request.urlopen(ddx['metadata_url'], timeout=30) as response:
        raw = response.read(2 * 1024**2)
    data = json.loads(raw)
    files = {f['id']: f for f in data['files']}
    checks = []
    if data['version'] != ddx['version'] or data['doi'] != ddx['doi'] or data['license']['name'] != ddx['license']['name']:
        raise ValueError('Pinned DDXPlus version/DOI/licence changed')
    for artifact in ddx['artifacts']:
        f = files[artifact['file_id']]
        checks.append(f['name'] == artifact['name'] and f['size'] == artifact['publisher_bytes']
                      and f['computed_md5'] == artifact['publisher_md5'] and f['download_url'] == artifact['url'])
    if not all(checks):
        raise ValueError('Pinned DDXPlus metadata changed')
    (output / 'ddxplus-version2-metadata.json').write_bytes(raw)
    with urllib.request.urlopen(mimic['publisher_checksums_url'], timeout=30) as response:
        checksums = response.read(65536)
    published = {line.split()[1]: line.split()[0] for line in checksums.decode().splitlines() if line.strip()}
    for artifact in mimic['artifacts']:
        if published[artifact['name']] != artifact['publisher_sha256']:
            raise ValueError('Pinned MIMIC demo checksum metadata changed')
    (output / 'mimic-demo-publisher-checksums.txt').write_bytes(checksums)
    for i, url in enumerate(manifest['datasets'][0]['license']['urls'] + [mimic['license']['url']]):
        with urllib.request.urlopen(url, timeout=30) as response:
            (output / f'terms-{i}.html').write_bytes(response.read(2 * 1024**2))
    result = {'checked_at_utc': now(), 'ddxplus_version': data['version'], 'ddxplus_license': data['license']['name'],
              'ddxplus_files_verified': len(checks), 'mimic_demo_publisher_digests_verified': len(mimic['artifacts']),
              'patient_archives_downloaded': False, 'metadata_sha256': hashlib.sha256(raw).hexdigest(),
              'source_urls': [ddx['metadata_url'], mimic['publisher_checksums_url'], *manifest['datasets'][0]['license']['urls'], mimic['license']['url']]}
    write_json(output / 'verification.json', result)
    return result


def publish(payload: dict, folder: Path) -> None:
    allowed = REPO / 'models' / 'medassist' / 'reports'
    folder = folder.resolve()
    if not folder.is_relative_to(allowed) or folder == allowed:
        raise ValueError('Publish only under models/medassist/reports/<unique-run>')
    folder.mkdir(parents=True, exist_ok=False)
    # Only the explicit aggregate payload; private assignment files are never copied.
    for name, value in payload.items():
        write_json(folder / (name + '.json'), value)


def main() -> None:
    if sys.version_info[:2] not in [(3, 11), (3, 12)] or sys.prefix == sys.base_prefix:
        raise ValueError('Use Python 3.11/3.12 in a dedicated virtual environment')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['acquire', 'profile', 'metadata'])
    parser.add_argument('--run-id', default='phase1-20261019')
    parser.add_argument('--publish-dir', type=Path)
    args = parser.parse_args()
    if not args.run_id or not all(c.isalnum() or c in '-_' for c in args.run_id):
        raise ValueError('Use a simple run ID')
    if args.publish_dir and args.command != 'profile':
        raise ValueError('Only aggregate profile reports may be published')
    root = external_root()
    if args.command == 'metadata':
        print(json.dumps(check_supporting_metadata(root, args.run_id)))
        return
    receipt = acquire(root)
    if args.command == 'acquire':
        print(json.dumps({'status': receipt['status'], 'archive': receipt['archive']}))
        return
    run, result = profile(root, receipt, args.run_id)
    if args.publish_dir:
        publish(result, args.publish_dir)
    quality = result['data-quality']
    print(json.dumps({'status': 'completed', 'rows': quality['source_shape']['rows'],
                      'columns': quality['source_shape']['columns'], 'reconciliation_passed': quality['reconciliation_passed'],
                      'eligible': quality['eligible'], 'excluded': quality['excluded'],
                      'split_summary': result['split-feasibility'], 'training_performed': False}))


if __name__ == '__main__':
    main()
