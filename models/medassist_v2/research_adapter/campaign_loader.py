"""Separately versioned read-only loader for post-Task-4B sealed campaigns.

Preserves historical ``load_preserved()`` in ``service.py`` unchanged. Authenticates
the new campaign's protocol representation (LF or CRLF via ``protocol_integrity``),
source provenance receipt, 13-file frozen implementation hashes, pre-test seal,
all 17 sealed artifacts, validation selection, and distinct campaign provenance
before bounded, restricted unpickling of the selected ``SGDClassifier``.
Never opens patient zip archives or the locked-test partition.
"""
from __future__ import annotations

import hashlib
import importlib
import io
import json
import pickle
from pathlib import Path
from typing import Any, Dict, Mapping, Optional

import numpy as np
from sklearn.linear_model import SGDClassifier

from .. import questioning_protocol as ref
from ..loader import DatasetLoader, normalise_catalogue
from ..storage import external_path
from ..training.campaign import choose
from ..training.data import environment, file_hash, implementation_hashes
from ..validation import read_json, require
from .protocol_integrity import CANONICAL_SHA256, HISTORICAL_SHA256, authenticated_bytes
from .service import ArtifactUnavailable, ModelA, checked_bytes

LOADER_VERSION = 'medassist-v2.campaign-loader.v1'
DEFAULT_CAMPAIGN_ID = 'campaign-2026-v1'
HISTORICAL_TASK4B_SEAL_SHA256 = (
    '90e1c4c57e7a568033827a7f6166b71f4f203594aa835f8a27fb5f4d43a2415f'
)

REQUIRED_COMPLETION_FILES = (
    'selection.json',
    'validation-aggregate.json',
    'pre-test-seal.json',
    'campaign-provenance.json',
)

EXPECTED_SEALED_ARTIFACTS = frozenset({
    'run.json',
    'training-reference.sqlite',
    'training-reference.json',
    'cohorts.sqlite',
    'cohorts.json',
    'pairs-features.jsonl',
    'pairs-targets.jsonl',
    'pair-lineage.jsonl',
    'pairs.json',
    'frequency.json',
    'fit-results.json',
    'selection.json',
    'validation-trajectories.sqlite',
    'validation-aggregate.json',
    'model-1e-05.pkl',
    'model-0.0001.pkl',
    'model-0.001.pkl',
})

ALLOWED_PICKLE_GLOBALS = frozenset({
    ('numpy', 'dtype'),
    ('numpy', 'ndarray'),
    ('numpy._core.multiarray', '_reconstruct'),
    ('sklearn._loss._loss', 'CyHalfBinomialLoss'),
    ('sklearn.linear_model._stochastic_gradient', 'SGDClassifier'),
})


class _RestrictedModelUnpickler(pickle.Unpickler):
    """Defense-in-depth unpickler permitting only fitted SGDClassifier internals."""

    def find_class(self, module: str, name: str) -> Any:
        if (module, name) not in ALLOWED_PICKLE_GLOBALS:
            raise pickle.UnpicklingError(f'disallowed_pickle_global:{module}.{name}')
        return getattr(importlib.import_module(module), name)


def _restricted_unpickle_model(data: bytes) -> SGDClassifier:
    return _RestrictedModelUnpickler(io.BytesIO(data)).load()


def trusted_source_hashes() -> Dict[str, str]:
    """Load expected Task 3 SHA-256 source provenance digests."""
    verification = read_json(ref.HERE / 'task3-source-verification.json')
    entries = verification.get('files', [])
    hashes = {entry['name']: entry['sha256'] for entry in entries}
    require(len(hashes) == 5, 'incomplete_source_manifest')
    return hashes


def _safe_root_file(root: Path, name: str) -> Path:
    require(
        isinstance(name, str) and Path(name).name == name and '/' not in name and '\\' not in name,
        'artifact_name',
    )
    path = root / name
    require(not path.is_symlink() and path.resolve().parent == root and path.is_file(), 'artifact_path')
    return path


def _load_and_verify_campaign_bundle(
    run_root: str | Path,
    metadata_root: str | Path,
    *,
    campaign_id: str,
    expected_source_hashes: Optional[Mapping[str, str]],
) -> Dict[str, Any]:
    require(isinstance(campaign_id, str) and bool(campaign_id.strip()), 'campaign_id_required')

    raw_protocol = authenticated_bytes(ref.PROTOCOL)
    active_proto_sha = hashlib.sha256(raw_protocol).hexdigest()
    expected_rep = 'CRLF' if b'\r' in raw_protocol else 'LF'
    p = ref.validate_protocol(json.loads(raw_protocol.decode('utf-8')))
    environment(p)

    root = external_path(run_root)
    source_root = external_path(metadata_root)
    require(root.is_dir() and source_root.is_dir(), 'root_missing')
    require(
        not (
            root == source_root
            or root.is_relative_to(source_root)
            or source_root.is_relative_to(root)
        ),
        'root_overlap',
    )

    source_expected = (
        dict(expected_source_hashes) if expected_source_hashes is not None else trusted_source_hashes()
    )
    require('release_evidences.json' in source_expected and len(source_expected) == 5, 'source_provenance_incomplete')

    # Verify exact release_evidences.json digest without opening patient zip archives.
    checked_bytes(source_root, 'release_evidences.json', source_expected['release_evidences.json'], 8 * 1024 * 1024)
    source = DatasetLoader(source_root)._metadata('release_evidences.json')
    ref.validate_metadata(source, p)

    require(not (root / 'fit-failure.json').exists(), 'fit_failed')
    for required_name in (*REQUIRED_COMPLETION_FILES, 'pre-test-seal-hash.json'):
        _safe_root_file(root, required_name)

    prov_path = _safe_root_file(root, 'campaign-provenance.json')
    provenance = json.loads(
        checked_bytes(root, 'campaign-provenance.json', file_hash(prov_path), 1024 * 1024)
    )
    require(provenance.get('campaign_id') == campaign_id, 'campaign_id_mismatch')
    require(provenance.get('mode') == 'official', 'campaign_mode_mismatch')
    require(provenance.get('run_root') == str(root), 'campaign_root_mismatch')
    require(provenance.get('canonical_protocol_sha256') == CANONICAL_SHA256, 'protocol_canonical_mismatch')
    require(provenance.get('historical_protocol_sha256') == HISTORICAL_SHA256, 'protocol_historical_mismatch')
    require(provenance.get('active_protocol_representation') in ('LF', 'CRLF'), 'protocol_rep_invalid')
    require(
        provenance.get('active_protocol_sha256') in (CANONICAL_SHA256, HISTORICAL_SHA256),
        'protocol_active_digest_invalid',
    )
    require(provenance.get('implementation_hashes') == implementation_hashes(), 'frozen_code_changed')
    require(provenance.get('locked_test_evaluated') is False, 'locked_test_not_isolated')

    seal_sha = provenance.get('seal_sha256')
    require(isinstance(seal_sha, str) and len(seal_sha) == 64, 'seal_digest_invalid')
    require(seal_sha != HISTORICAL_TASK4B_SEAL_SHA256, 'historical_seal_not_distinct')
    seal_hash_doc = read_json(_safe_root_file(root, 'pre-test-seal-hash.json'))
    require(seal_hash_doc.get('sha256') == seal_sha, 'seal_receipt_mismatch')

    seal_bytes = checked_bytes(root, 'pre-test-seal.json', seal_sha, 1024 * 1024)
    seal = json.loads(seal_bytes)
    require(seal.get('mode') == 'official' and seal.get('run_root') == str(root), 'seal_root_mode')
    require(
        seal.get('protocol_sha256') == provenance['active_protocol_sha256']
        and seal.get('protocol_sha256') in (CANONICAL_SHA256, HISTORICAL_SHA256),
        'seal_protocol_mismatch',
    )
    require(seal.get('implementation') == implementation_hashes(), 'seal_implementation_mismatch')
    require(seal.get('source_hashes') == source_expected, 'seal_source_provenance_mismatch')
    require(
        seal.get('selected_alpha') == provenance.get('selected_alpha')
        and seal.get('selected_alpha') in p['ranking_model']['alpha_grid'],
        'seal_selected_alpha_invalid',
    )

    artifacts = seal.get('artifacts')
    require(isinstance(artifacts, dict) and len(artifacts) == 17, 'sealed_artifact_count')
    require(frozenset(artifacts.keys()) == EXPECTED_SEALED_ARTIFACTS, 'sealed_artifact_inventory')
    for name, digest in artifacts.items():
        artifact_path = _safe_root_file(root, name)
        require(file_hash(artifact_path) == digest, 'sealed_artifact_changed')

    run_meta = json.loads(checked_bytes(root, 'run.json', artifacts['run.json'], 1024 * 1024))
    require(
        run_meta.get('mode') == 'official'
        and run_meta.get('source_hashes') == source_expected
        and run_meta.get('implementation') == implementation_hashes()
        and run_meta.get('protocol_sha256') == seal['protocol_sha256'],
        'run_metadata_mismatch',
    )

    selection = json.loads(checked_bytes(root, 'selection.json', artifacts['selection.json'], 1024 * 1024))
    require(selection.get('partition') == 'validation', 'selection_partition_invalid')
    require(selection.get('training_overlap_excluded') is True, 'selection_overlap_flag')
    require(selection.get('selected_alpha') == seal['selected_alpha'], 'selection_alpha_mismatch')
    require(selection.get('selected_alpha') == choose(selection['scores'], p), 'selection_rule_mismatch')

    val_agg = json.loads(
        checked_bytes(
            root, 'validation-aggregate.json', artifacts['validation-aggregate.json'], 4 * 1024 * 1024
        )
    )
    require(
        val_agg.get('partition') == 'validation'
        and val_agg.get('mode') == 'official'
        and val_agg.get('clinical_accuracy') is False
        and isinstance(val_agg.get('reports'), dict),
        'validation_aggregate_invalid',
    )

    fit_results = json.loads(checked_bytes(root, 'fit-results.json', artifacts['fit-results.json'], 1024 * 1024))
    selected_alpha = selection['selected_alpha']
    matching_fit = [
        r for r in fit_results if r.get('alpha') == selected_alpha and r.get('status') == 'complete'
    ]
    require(len(matching_fit) == 1, 'selected_fit_entry_missing')
    selected_artifact = matching_fit[0]['artifact']
    require(selected_artifact in artifacts, 'selected_artifact_not_sealed')
    require(matching_fit[0]['sha256'] == artifacts[selected_artifact], 'fit_result_digest_mismatch')

    return {
        'p': p,
        'root': root,
        'source': source,
        'provenance': provenance,
        'seal': seal,
        'seal_sha256': seal_sha,
        'selection': selection,
        'val_agg': val_agg,
        'selected_alpha': selected_alpha,
        'selected_artifact': selected_artifact,
        'selected_artifact_sha256': artifacts[selected_artifact],
        'active_protocol_sha256': active_proto_sha,
        'current_protocol_representation': expected_rep,
    }


def check_campaign_completion_gate(
    run_root: str | Path,
    metadata_root: Optional[str | Path] = None,
    *,
    campaign_id: str = DEFAULT_CAMPAIGN_ID,
    expected_source_hashes: Optional[Mapping[str, str]] = None,
) -> Dict[str, Any]:
    """Read-only completion gate check for Phase A2.2 -> A2.3 handoff."""
    try:
        root = external_path(run_root)
    except Exception:
        return {
            'ready': False,
            'status': 'PREPARED / WAITING FOR SEAL',
            'present_files': [],
            'missing_files': list(REQUIRED_COMPLETION_FILES),
            'seal_verified': False,
        }

    present = [name for name in REQUIRED_COMPLETION_FILES if (root / name).is_file()]
    missing = [name for name in REQUIRED_COMPLETION_FILES if name not in present]
    if missing:
        return {
            'ready': False,
            'status': 'PREPARED / WAITING FOR SEAL',
            'present_files': present,
            'missing_files': missing,
            'seal_verified': False,
        }

    if metadata_root is None:
        return {
            'ready': False,
            'status': 'SEAL_FILES_PRESENT_METADATA_REQUIRED',
            'present_files': present,
            'missing_files': [],
            'seal_verified': False,
        }

    try:
        bundle = _load_and_verify_campaign_bundle(
            root,
            metadata_root,
            campaign_id=campaign_id,
            expected_source_hashes=expected_source_hashes,
        )
    except Exception:
        return {
            'ready': False,
            'status': 'SEAL_VERIFICATION_FAILED',
            'present_files': present,
            'missing_files': [],
            'seal_verified': False,
        }

    return {
        'ready': True,
        'status': 'SEAL_VERIFIED',
        'present_files': present,
        'missing_files': [],
        'seal_verified': True,
        'campaign_id': campaign_id,
        'selected_alpha': bundle['selected_alpha'],
        'seal_sha256': bundle['seal_sha256'],
        'selected_artifact': bundle['selected_artifact'],
    }


def load_campaign_model(
    run_root: str | Path,
    metadata_root: str | Path,
    *,
    campaign_id: str = DEFAULT_CAMPAIGN_ID,
    expected_source_hashes: Optional[Mapping[str, str]] = None,
) -> ModelA:
    """Authenticate and load a sealed post-Task-4B campaign Model A service."""
    try:
        bundle = _load_and_verify_campaign_bundle(
            run_root,
            metadata_root,
            campaign_id=campaign_id,
            expected_source_hashes=expected_source_hashes,
        )
        root = bundle['root']
        p = bundle['p']
        selected_alpha = bundle['selected_alpha']
        selected_artifact = bundle['selected_artifact']

        # Hash-before-unpickle on the exact bounded byte snapshot; never reopen.
        model_bytes = checked_bytes(
            root,
            selected_artifact,
            bundle['selected_artifact_sha256'],
            16 * 1024 * 1024,
        )
        model = _restricted_unpickle_model(model_bytes)
        require(
            type(model) is SGDClassifier
            and model.alpha == selected_alpha
            and model.n_features_in_ == 65536
            and model.classes_.tolist() == [0, 1]
            and np.isfinite(model.coef_).all()
            and np.isfinite(model.intercept_).all(),
            'model_shape',
        )

        source = bundle['source']
        service = ModelA(p, normalise_catalogue(source)['evidences'], model)
        service.value_labels = {
            eid: {
                str(v): source.get(eid, {}).get('value_meaning', {}).get(str(v), {}).get('en')
                for v in d['possible_values']
                if isinstance(
                    source.get(eid, {}).get('value_meaning', {}).get(str(v), {}).get('en'),
                    str,
                )
            }
            for eid, d in service.definitions.items()
        }
        service.provenance = {
            'campaign_id': campaign_id,
            'loader_version': LOADER_VERSION,
            'historical_task4b': False,
            'selected_alpha': selected_alpha,
            'selected_artifact': selected_artifact,
            'seal_sha256': bundle['seal_sha256'],
            'trained_protocol_representation': bundle['provenance']['active_protocol_representation'],
            'active_protocol_representation': bundle['current_protocol_representation'],
            'locked_test_evaluated': False,
        }
        return service
    except Exception:
        raise ArtifactUnavailable('artifact_unavailable_or_integrity_failed') from None
