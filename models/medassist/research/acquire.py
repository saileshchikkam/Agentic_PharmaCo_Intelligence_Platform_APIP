"""Pinned public archive acquisition; all dataset writes stay under an external root."""
from __future__ import annotations

import hashlib
import json
import os
import platform
import stat
import urllib.request
import zipfile
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path, PurePosixPath

REPO = Path(__file__).resolve().parents[3]
MANIFEST = Path(__file__).resolve().parents[1] / 'open-access-manifest.json'
SOURCE = 'https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Dataset_Documentation/NHAMCS/stata/ed2022-stata.zip'


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256(file: Path) -> str:
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def external_root(value: str | None = None) -> Path:
    value = value or os.environ.get('APIP_RESEARCH_ROOT')
    if not value or not Path(value).is_absolute():
        raise ValueError('Set APIP_RESEARCH_ROOT to an explicit absolute external research directory')
    root = Path(value).resolve()
    if root == REPO or root.is_relative_to(REPO) or REPO.is_relative_to(root) or len(root.parts) < 4:
        raise ValueError('Research root must be separate from the repository, served files and application storage')
    for name in ('OneDrive', 'OneDriveConsumer', 'OneDriveCommercial'):
        if os.environ.get(name) and root.is_relative_to(Path(os.environ[name]).resolve()):
            raise ValueError('Use unsynced research storage, outside OneDrive')
    if root.name in ('APIP', 'public', 'dist'):
        raise ValueError('Select a dedicated research leaf directory, not an application/storage root')
    return root


def write_json(file: Path, value: object) -> None:
    """Exclusive writes: never overwrite an earlier run or receipt."""
    with file.open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write('\n')


def environment() -> dict:
    packages = ('pandas', 'numpy', 'scikit-learn', 'pyreadstat', 'scipy', 'joblib', 'threadpoolctl', 'narwhals', 'python-dateutil', 'pytz', 'tzdata', 'six')
    return {'python': platform.python_version(), 'platform': platform.system(), 'packages': {p: version(p) for p in packages}}


def verify_archive(file: Path) -> list[dict]:
    with zipfile.ZipFile(file) as archive:
        files = archive.infolist()
        if len(files) != 1:
            raise ValueError('Expected exactly one Stata archive member')
        member = files[0]
        path = PurePosixPath(member.filename)
        if (path.name.lower() not in {'ed2022-stata.dta', 'ed2022.dta'} or len(path.parts) != 1
                or '\\' in member.filename or ':' in member.filename or member.flag_bits & 1
                or stat.S_ISLNK(member.external_attr >> 16) or member.file_size > 512 * 1024**2):
            raise ValueError('Unexpected/unsafe archive member')
        if archive.testzip() is not None:
            raise ValueError('Archive CRC failed')
        digest = hashlib.sha256()
        with archive.open(member) as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
        return [{'name': member.filename, 'bytes': member.file_size, 'compressed_bytes': member.compress_size,
                 'crc32': f'{member.CRC:08x}', 'sha256': digest.hexdigest()}]


def acquire(root: Path, opener=urllib.request.urlopen) -> dict:
    parser = environment()  # Validate the environment before any download or persistent artifact.
    plan = json.loads(MANIFEST.read_text(encoding='utf-8'))
    dataset = next(d for d in plan['datasets'] if d['id'] == 'nhamcs-ed-2022')
    artifact = next(a for a in dataset['artifacts'] if a['format'] == 'stata')
    if artifact['url'] != SOURCE:
        raise ValueError('Pinned source changed; review the protocol first')
    folder = root / 'raw' / 'nhamcs-ed-2022'
    folder.mkdir(parents=True, exist_ok=True)
    archive = folder / 'ed2022-stata.zip'
    receipt_file = folder / 'acquisition-receipt.json'
    lock = folder / '.acquisition.lock'
    with lock.open('x'):
        pass
    part = folder / 'ed2022-stata.zip.part'
    try:
        if receipt_file.exists():
            receipt = json.loads(receipt_file.read_text(encoding='utf-8'))
            if (receipt['status'] != 'verified' or receipt['source_url'] != SOURCE
                    or sha256(archive) != receipt['archive']['sha256']
                    or verify_archive(archive) != receipt['members']):
                raise ValueError('Cached archive/receipt mismatch; preserving files for investigation')
            for item in receipt['members']:
                if sha256(folder / item['name']) != item['sha256']:
                    raise ValueError('Cached extracted member mismatch')
            return receipt
        if archive.exists() or part.exists() or list(folder.glob('*.dta')):
            raise ValueError('Unreceipted artifacts exist; refusing overwrite')
        started = now()
        request = urllib.request.Request(SOURCE, headers={'User-Agent': 'APIP-offline-research-phase1'})
        with opener(request, timeout=45) as response, part.open('xb') as stream:
            if response.status != 200 or response.geturl() != SOURCE:
                raise ValueError('Unexpected HTTP status or redirect')
            headers = {k: response.headers.get(k) for k in ('Content-Length', 'Content-Type', 'Last-Modified', 'ETag')}
            count = 0
            while chunk := response.read(1024 * 1024):
                count += len(chunk)
                if count > artifact['head_bytes']:
                    raise ValueError('Archive exceeds pinned size')
                stream.write(chunk)
        if count != artifact['head_bytes']:
            raise ValueError('Truncated or changed archive size')
        members = verify_archive(part)
        digest = sha256(part)
        with zipfile.ZipFile(part) as zipped:
            for member in members:
                with zipped.open(member['name']) as src, (folder / member['name']).open('xb') as dst:
                    for block in iter(lambda: src.read(1024 * 1024), b''):
                        dst.write(block)
                if sha256(folder / member['name']) != member['sha256']:
                    raise ValueError('Extracted member hash mismatch')
        part.rename(archive)
        receipt = {'schema_version': 1, 'status': 'verified', 'dataset_id': dataset['id'], 'source_version': dataset['version'],
                   'source_url': SOURCE, 'started_at_utc': started, 'retrieved_at_utc': now(), 'headers': headers,
                   'manifest_sha256': sha256(MANIFEST), 'archive': {'name': archive.name, 'bytes': count, 'sha256': digest},
                   'members': members, 'parser': parser, 'publisher_sha256': None,
                   'integrity_scope': 'Official HTTPS, pinned size, ZIP CRC and local SHA-256; publisher SHA-256 unavailable',
                   'terms_urls': dataset['license']['urls']}
        write_json(receipt_file, receipt)
        return receipt
    except Exception as error:
        failure = folder / ('failure-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f') + '.json')
        write_json(failure, {'status': 'failed', 'time_utc': now(), 'error_type': type(error).__name__, 'reason': str(error), 'success_receipt_created': False})
        raise
    finally:
        lock.unlink()
