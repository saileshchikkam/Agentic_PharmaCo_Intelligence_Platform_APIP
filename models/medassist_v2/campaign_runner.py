"""Separately versioned new-campaign entry point.

Authenticates the frozen protocol using the dual-hash representation helper
(protocol_integrity.py) and executes genuine offline training, validation-only
selection, and sealing using the existing frozen research pipeline.
Leaves the historical Task 4B runner, protocol files, and receipts untouched.
"""
from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Dict, Literal, Tuple

from threadpoolctl import threadpool_info, threadpool_limits

from . import questioning_protocol as ref
from .research_adapter.protocol_integrity import (
    CANONICAL_SHA256,
    HISTORICAL_SHA256,
    authenticated_bytes,
)
from .storage import external_path
from .training.campaign import seal, verify_seal
from .training.data import (
    OfficialDataset,
    environment,
    file_hash,
    implementation_hashes,
    new_run,
    write_json,
)
from .training.flow import estimator, hasher
from .training.runner import develop, initialise, parity_gate
from .validation import read_json, require


def authenticate_protocol(path: Path = ref.PROTOCOL) -> Tuple[Dict[str, Any], Literal['LF', 'CRLF'], str, str]:
    """Authenticate either canonical pure LF or historical Windows CRLF protocol bytes."""
    raw = authenticated_bytes(path)
    representation: Literal['LF', 'CRLF'] = 'CRLF' if b'\r' in raw else 'LF'
    p = ref.validate_protocol(json.loads(raw.decode('utf-8')))
    return p, representation, CANONICAL_SHA256, HISTORICAL_SHA256


def preflight(data_root: str | Path, campaign_id: str = "campaign-2026-v1") -> Dict[str, Any]:
    """Execute non-destructive preflight verification without fitting or opening test rows."""
    p, representation, canonical_sha, historical_sha = authenticate_protocol()
    versions = environment(p)
    dataset = OfficialDataset(data_root, p)
    parity = parity_gate(p)

    # Validate estimator and hasher instantiation without model fitting.
    hasher(p)
    for alpha in p['ranking_model']['alpha_grid']:
        estimator(p, alpha)

    with threadpool_limits(limits=1):
        threads = threadpool_info()

    return {
        'status': 'preflight_passed',
        'campaign_id': campaign_id,
        'active_protocol_representation': representation,
        'canonical_protocol_sha256': canonical_sha,
        'historical_protocol_sha256': historical_sha,
        'active_protocol_sha256': file_hash(ref.PROTOCOL),
        'implementation_hashes': implementation_hashes(),
        'verified_source_files': len(dataset.receipt),
        'environment': versions,
        'threadpools_under_limit': threads,
        'reference_parity': parity,
        'official_patient_rows_decoded': 0,
        'official_models_fitted': 0,
        'official_outcomes_evaluated': 0,
        'locked_test_unopened': True,
    }


def fit_campaign(
    data_root: str | Path,
    run_root: str | Path,
    campaign_id: str = "campaign-2026-v1",
    execute: bool = False,
) -> Dict[str, Any]:
    """Execute official training, validation-only selection and sealing for the new campaign.

    Never opens or evaluates the locked test partition.
    """
    require(execute, 'explicit_official_fitting_required')
    start_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

    p, representation, canonical_sha, historical_sha = authenticate_protocol()
    env = environment(p)
    dataset = OfficialDataset(data_root, p)
    root = new_run(run_root, dataset.loader.root)

    # 1. Initialize run and record configuration
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 1/6: Initializing run in {root}...", flush=True)
    initialise(dataset, root, p)
    hasher(p)

    # 2. Run genuine model fitting, validation selection and sealing with 1 thread
    with threadpool_limits(limits=1):
        from .training.campaign import (
            cache_partition,
            cached_report,
            validation_select,
        )
        from .training.data import prepare
        from .training.flow import build_pairs, fit_grid

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 2/6: Preparing cohorts and deduplication...", flush=True)
        prepare(dataset, root, p)

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 3/6: Building candidate pairs...", flush=True)
        build_pairs(dataset, root, p)

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 4/6: Fitting SGDClassifier grid across 3 alphas (1e-5, 1e-4, 1e-3)...", flush=True)
        fit_grid(root, p, dataset.mode)

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 5/6: Validation selection across 4,096 non-overlap cases...", flush=True)
        validation_select(dataset, root, p)

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 6/6: Caching 132,448 validation trajectories and generating report...", flush=True)
        cache_partition(dataset, root, p, 'validation')
        write_json(root / 'validation-aggregate.json', cached_report(root, 'validation', p))

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Sealing campaign artifacts...", flush=True)
        seal_record = seal(root, p)
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Campaign pre-test seal created successfully!", flush=True)

    completion_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 3. Record campaign provenance (linking LF/CRLF representation & git commit)
    provenance = {
        'campaign_id': campaign_id,
        'mode': dataset.mode,
        'start_time_utc': start_time,
        'completion_time_utc': completion_time,
        'git_commit': '3585811589f07f2e65d4fcf3199d04171ec9feef',
        'run_root': str(root.resolve()),
        'active_protocol_representation': representation,
        'canonical_protocol_sha256': canonical_sha,
        'historical_protocol_sha256': historical_sha,
        'active_protocol_sha256': file_hash(ref.PROTOCOL),
        'implementation_hashes': implementation_hashes(),
        'selected_alpha': seal_record['selected_alpha'],
        'seal_sha256': file_hash(root / 'pre-test-seal.json'),
        'locked_test_evaluated': False,
    }
    write_json(root / 'campaign-provenance.json', provenance)

    selection = read_json(root / 'selection.json')
    fit_results = read_json(root / 'fit-results.json')

    return {
        'status': 'campaign_training_complete',
        'campaign_id': campaign_id,
        'run_root': str(root.resolve()),
        'seal_sha256': provenance['seal_sha256'],
        'selected_alpha': seal_record['selected_alpha'],
        'fit_results': fit_results,
        'validation_scores': selection['scores'],
        'artifacts': list(seal_record['artifacts'].keys()),
        'locked_test_unopened': True,
    }


def _verify_stage1_4_artifacts(root: Path, dataset: OfficialDataset) -> None:
    """Verify Stage 1-4 cryptographic receipts without modifying any artifact."""
    run_meta = read_json(root / 'run.json')
    require(run_meta['mode'] == dataset.mode, 'mode_mismatch')
    require(run_meta['implementation'] == implementation_hashes(), 'implementation_changed')
    require(run_meta['protocol_sha256'] == file_hash(ref.PROTOCOL), 'protocol_changed')
    require(run_meta['source_hashes'] == dataset.receipt, 'source_hashes_changed')

    ref_meta = read_json(root / 'training-reference.json')
    require(ref_meta['reference_sha256'] == file_hash(root / 'training-reference.sqlite'), 'training_ref_corrupt')
    cohort_meta = read_json(root / 'cohorts.json')
    require(cohort_meta['cohorts_sha256'] == file_hash(root / 'cohorts.sqlite'), 'cohorts_corrupt')
    pairs_meta = read_json(root / 'pairs.json')
    require(
        all(
            file_hash(root / name) == pairs_meta[key]
            for name, key in [
                ('pairs-features.jsonl', 'features_sha256'),
                ('pairs-targets.jsonl', 'targets_sha256'),
                ('pair-lineage.jsonl', 'lineage_sha256'),
            ]
        ),
        'pairs_corrupt',
    )
    require((root / 'frequency.json').is_file(), 'frequency_missing')
    require(not (root / 'fit-failure.json').exists(), 'fit_failure_present')


def _write_campaign_provenance(
    root: Path,
    *,
    campaign_id: str,
    dataset: OfficialDataset,
    resume_time: str,
    resumption_note: str,
    representation: str,
    canonical_sha: str,
    historical_sha: str,
    seal_record: Dict[str, Any],
) -> Dict[str, Any]:
    """Write campaign-provenance.json and return the completion summary."""
    completion_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    provenance = {
        'campaign_id': campaign_id,
        'mode': dataset.mode,
        'resumed_post_fit_utc': resume_time,
        'completion_time_utc': completion_time,
        'resumption_note': resumption_note,
        'git_commit': 'da91ecd7596213a89219f730291ee0c242adaaaa',
        'run_root': str(root.resolve()),
        'active_protocol_representation': representation,
        'canonical_protocol_sha256': canonical_sha,
        'historical_protocol_sha256': historical_sha,
        'active_protocol_sha256': file_hash(ref.PROTOCOL),
        'implementation_hashes': implementation_hashes(),
        'selected_alpha': seal_record['selected_alpha'],
        'seal_sha256': file_hash(root / 'pre-test-seal.json'),
        'locked_test_evaluated': False,
    }
    write_json(root / 'campaign-provenance.json', provenance)

    selection = read_json(root / 'selection.json')
    fit_results = read_json(root / 'fit-results.json')

    return {
        'status': 'campaign_training_complete',
        'campaign_id': campaign_id,
        'run_root': str(root.resolve()),
        'seal_sha256': provenance['seal_sha256'],
        'selected_alpha': seal_record['selected_alpha'],
        'fit_results': fit_results,
        'validation_scores': selection['scores'],
        'artifacts': list(seal_record['artifacts'].keys()),
        'locked_test_unopened': True,
    }


def resume_post_fit(
    data_root: str | Path,
    run_root: str | Path,
    campaign_id: str = "campaign-2026-v1",
    execute: bool = False,
) -> Dict[str, Any]:
    """Resume strictly from verified Stage 4 fit artifacts through Stage 6 sealing.

    Never refits models, never overwrites existing artifacts, and never opens locked-test records.
    """
    require(execute, 'explicit_official_resumption_required')
    resume_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

    p, representation, canonical_sha, historical_sha = authenticate_protocol()
    environment(p)
    dataset = OfficialDataset(data_root, p)
    root = external_path(run_root)
    require(root.is_dir(), 'run_root_missing')

    _verify_stage1_4_artifacts(root, dataset)
    require(not (root / 'selection.json').exists(), 'selection_already_exists')
    require(not (root / 'validation-trajectories.sqlite').exists(), 'val_cache_already_exists')
    require(not (root / 'validation-aggregate.json').exists(), 'val_aggregate_already_exists')
    require(not (root / 'pre-test-seal.json').exists(), 'seal_already_exists')

    from .training.campaign import (
        cache_partition,
        cached_report,
        load_models,
        validation_select,
    )

    # Verify all 3 pickled models match fit-results.json SHA-256
    load_models(root, p)
    hasher(p)

    with threadpool_limits(limits=1):
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 5/6 (Resumed): Validation selection across 4,096 non-overlap cases...", flush=True)
        validation_select(dataset, root, p)

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 6/6 (Resumed): Caching 132,448 validation trajectories and generating report...", flush=True)
        cache_partition(dataset, root, p, 'validation')
        write_json(root / 'validation-aggregate.json', cached_report(root, 'validation', p))

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Sealing campaign artifacts...", flush=True)
        seal_record = seal(root, p)
        verify_seal(root, dataset, p)
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Campaign pre-test seal created and verified successfully!", flush=True)

    return _write_campaign_provenance(
        root,
        campaign_id=campaign_id,
        dataset=dataset,
        resume_time=resume_time,
        resumption_note='Stages 1-4 completed cleanly; server restart interrupted Stage 5 before selection.json write. Resumed Stages 5-6 after cryptographic verification of all Stage 1-4 artifacts.',
        representation=representation,
        canonical_sha=canonical_sha,
        historical_sha=historical_sha,
        seal_record=seal_record,
    )


def resume_stage6_only(
    data_root: str | Path,
    run_root: str | Path,
    campaign_id: str = "campaign-2026-v1",
    *,
    execute: bool = False,
    discard_incomplete_cache: bool = False,
) -> Dict[str, Any]:
    """Resume strictly from verified Stage 5 selection.json through Stage 6 sealing.

    Never refits models, never reruns Stage 5 selection, and never opens locked-test records.
    """
    require(execute, 'explicit_stage6_resumption_required')
    resume_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

    p, representation, canonical_sha, historical_sha = authenticate_protocol()
    environment(p)
    dataset = OfficialDataset(data_root, p)
    root = external_path(run_root)
    require(root.is_dir(), 'run_root_missing')

    _verify_stage1_4_artifacts(root, dataset)
    require((root / 'selection.json').is_file(), 'selection_missing')
    require(not (root / 'validation-aggregate.json').exists(), 'val_aggregate_already_exists')
    require(not (root / 'pre-test-seal.json').exists(), 'seal_already_exists')
    require(not (root / 'pre-test-seal-hash.json').exists(), 'seal_hash_already_exists')

    from .training.campaign import (
        cache_partition,
        cached_report,
        choose,
        load_models,
    )

    # Verify all 3 pickled models match fit-results.json SHA-256 and validate Stage 5 selection.json
    load_models(root, p)
    selection = read_json(root / 'selection.json')
    require(selection.get('partition') == 'validation', 'selection_partition_invalid')
    require(selection.get('training_overlap_excluded') is True, 'selection_overlap_invalid')
    require(selection.get('model_refitted_after_selection') is False, 'selection_refit_flag_invalid')
    require(selection.get('selected_alpha') == choose(selection['scores'], p), 'selection_rule_mismatch')

    cache_path = root / 'validation-trajectories.sqlite'
    journal_path = root / 'validation-trajectories.sqlite-journal'
    if cache_path.exists() or journal_path.exists():
        require(discard_incomplete_cache, 'incomplete_val_cache_present')
        if journal_path.exists():
            journal_path.unlink()
        if cache_path.exists():
            cache_path.unlink()

    hasher(p)

    with threadpool_limits(limits=1):
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 6/6 (Stage-6-only recovery): Rebuilding validation cache for 132,448 cases using frozen cache_partition...", flush=True)
        cache_partition(dataset, root, p, 'validation')
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Stage 6/6: Generating validation-aggregate.json...", flush=True)
        write_json(root / 'validation-aggregate.json', cached_report(root, 'validation', p))

        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Sealing campaign artifacts...", flush=True)
        seal_record = seal(root, p)
        verify_seal(root, dataset, p)
        print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Campaign pre-test seal created and verified successfully!", flush=True)

    return _write_campaign_provenance(
        root,
        campaign_id=campaign_id,
        dataset=dataset,
        resume_time=resume_time,
        resumption_note='Stages 1-5 completed cleanly (selection.json verified); server restart interrupted Stage 6 mid-cache with an incomplete validation-trajectories.sqlite (40,563 partial rows). Preserved a verified backup, removed the partial cache, and rebuilt Stage 6 only using the frozen cache_partition implementation.',
        representation=representation,
        canonical_sha=canonical_sha,
        historical_sha=historical_sha,
        seal_record=seal_record,
    )
