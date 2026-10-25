"""Read-only compatibility for this one authenticated protocol; no study/ledger writes.

The sealed reference/training files remain byte-for-byte unchanged. Only this
protocol's pure UTF-8 LF and CRLF representations are accepted. General file
hashing, implementation hashing and every sealed artifact still use exact bytes.
"""
import hashlib
import json
from pathlib import Path

from .. import questioning_protocol as ref
from ..training.data import file_hash, implementation_hashes
from ..validation import read_json, require

HISTORICAL_SHA256 = '734050555cb9c42e4bc0b47884cf4bac27ec20da5b531c3457685b86dc2c899a'
CANONICAL_SHA256 = '569169b5c119c01beb408fe35e20139b0e9e932a92e8c31fccc20468a19da076'
NAME = 'adaptive-questioning-protocol.json'
MAXIMUM = 1024 * 1024


def authenticated_bytes(path=ref.PROTOCOL):
    path = Path(path)
    require(path.name == NAME and path.is_file() and not path.is_symlink(), 'protocol_path')
    pin = path.with_suffix('.sha256')
    require(pin.is_file() and not pin.is_symlink(), 'protocol_pin')
    require(pin.stat().st_size <= 256, 'protocol_pin')
    require(pin.read_text(encoding='utf-8').split() == [HISTORICAL_SHA256, NAME], 'protocol_pin')
    with path.open('rb') as stream:
        raw = stream.read(MAXIMUM + 1)
    require(0 < len(raw) <= MAXIMUM and not raw.startswith(b'\xef\xbb\xbf'), 'protocol_encoding')
    raw.decode('utf-8', errors='strict')
    if b'\r' in raw:
        lf = raw.replace(b'\r\n', b'\n')
        require(b'\r' not in lf and raw == lf.replace(b'\n', b'\r\n'), 'protocol_line_endings')
    else:
        lf = raw
    # Both exact anchors must match; parsing, trimming and JSON reserialization
    # never participate in identity verification.
    require(hashlib.sha256(lf).hexdigest() == CANONICAL_SHA256
            and hashlib.sha256(lf.replace(b'\n', b'\r\n')).hexdigest() == HISTORICAL_SHA256,
            'protocol_checksum')
    return raw


def protocol(path=ref.PROTOCOL):
    # Parse the same bounded authenticated snapshot; do not reopen the file.
    return ref.validate_protocol(json.loads(authenticated_bytes(path).decode('utf-8')))


def historical_digest(path=ref.PROTOCOL):
    authenticated_bytes(path)
    return HISTORICAL_SHA256


def verify_existing_seal(root, dataset, p):
    """Read-only counterpart to frozen campaign.verify_seal, protocol-only compatibility.

    Never dispatches to locked_test, claims a ledger or opens source archives.
    The frozen campaign/runner and their strict execution gates are not patched.
    """
    root = Path(root)
    require(p == protocol(), 'protocol_content')
    receipt = read_json(ref.HERE / 'task4b-aggregate.json')
    seal_path = root / 'pre-test-seal.json'
    require(seal_path.is_file() and not seal_path.is_symlink(), 'seal_path')
    with seal_path.open('rb') as stream:
        raw = stream.read(MAXIMUM + 1)
    require(len(raw) <= MAXIMUM and hashlib.sha256(raw).hexdigest() == receipt['seal_sha256'], 'seal_changed')
    require(read_json(root / 'pre-test-seal-hash.json')['sha256'] == receipt['seal_sha256'], 'seal_changed')
    s = json.loads(raw)
    require(s['artifacts'] == receipt['artifact_hashes'] and len(s['artifacts']) == 17
            and s['source_hashes'] == receipt['source_hashes'], 'published_receipt_changed')
    require(s['mode'] == dataset.mode and s['run_root'] == str(root.resolve()), 'seal_mode_or_root_changed')
    require(s['implementation'] == implementation_hashes()
            and s['protocol_sha256'] == historical_digest(), 'implementation_or_protocol_changed')
    require(s['source_hashes'] == dataset.receipt, 'sealed_source_changed')
    for name, digest in s['artifacts'].items():
        require(Path(name).name == name and not (root / name).is_symlink()
                and (root / name).resolve().parent == root.resolve(), 'artifact_path')
        require(file_hash(root / name) == digest, 'sealed_artifact_changed')
    require(not (root / 'fit-failure.json').exists(), 'failed_fit_blocks_test')
    return s
