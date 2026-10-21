"""Phase 2 contracts/preflight. Reads frozen assignments; never fits or regenerates splits."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

from .acquire import REPO, environment, external_root, sha256, write_json
from .data import feature_matrix, load_stata, target_eligible, validate_feature_frame
from .splits import connected_groups, overlap_errors, support

SPEC = Path(__file__).resolve().parents[1] / 'baseline-protocol.json'


def load_protocol() -> dict:
    expected = SPEC.with_suffix('.sha256').read_text(encoding='utf-8').strip()
    if sha256(SPEC) != expected:
        raise ValueError('Frozen protocol hash mismatch; review and version any change')
    config = json.loads(SPEC.read_text(encoding='utf-8'))
    if config['split_regeneration_allowed'] or config['patient_facing_use_allowed']:
        raise ValueError('Invalid offline protocol boundary')
    return config


def research_matrix(df: pd.DataFrame, profile: str, config: dict) -> pd.DataFrame:
    """Fixed decoding, no learned imputation; preserve every eligible row and the raw source."""
    x = feature_matrix(df, profile)
    validate_feature_frame(x, profile)
    for field in config['cleaning']['zero_to_missing']:
        if field in x:
            x[field] = x[field].mask(x[field].eq(0))
    numeric = x.select_dtypes(include='number')
    if np.isinf(numeric.to_numpy(dtype=float)).any():
        raise ValueError('Nonfinite predictor; no silent replacement')
    return x


def task_target(frame: pd.DataFrame, task: str, config: dict) -> pd.Series:
    if task not in config['tasks'] or not target_eligible(frame.IMMEDR).all():
        raise ValueError('Unexpected task or unlabelled/invalid target in task cohort')
    if task == 'primary_binary':
        return frame.IMMEDR.isin(config['tasks'][task]['positive_immedr']).astype('int64').rename('high_acuity')
    return frame.IMMEDR.astype('int64').rename('recorded_acuity')


def assignment_digest(indices, partitions) -> str:
    return hashlib.sha256('\n'.join(f'{i}:{p}' for i, p in zip(indices, partitions)).encode()).hexdigest()


def validate_assignments(frame: pd.DataFrame, records: list, groups: np.ndarray, cohort: dict, config: dict) -> np.ndarray:
    if len(records) != len(frame) or len(frame) != cohort['rows'] or len(groups) != len(frame):
        raise ValueError('Frozen cohort row count changed')
    if any(set(row) != {'source_row', 'partition'} or type(row['source_row']) is not int or type(row['partition']) is not str for row in records):
        raise ValueError('Invalid assignment schema')
    indices = [row['source_row'] for row in records]
    if indices != frame.index.tolist() or len(indices) != len(set(indices)):
        raise ValueError('Frozen source row membership/order changed')
    assignments = np.array([row['partition'] for row in records], dtype=object)
    if set(assignments) != set(config['partitions']):
        raise ValueError('Invalid frozen partition')
    if assignment_digest(indices, assignments) != cohort['assignment_sha256']:
        raise ValueError('Frozen assignment digest changed; never regenerate to repair')
    if overlap_errors(frame, assignments, groups):
        raise ValueError('Frozen groups overlap')
    for pos, name in enumerate(config['partitions']):
        item = support(frame.IMMEDR.to_numpy()[assignments == name])
        if any(item[key] != cohort[field][pos] for key, field in [('rows', 'partition_rows'), ('high_acuity', 'partition_high_acuity'), ('immediate', 'partition_immediate')]):
            raise ValueError('Frozen target support changed')
    return assignments


def fitting_cv(frame: pd.DataFrame, assignments: np.ndarray, groups: np.ndarray, config: dict) -> tuple[list, str]:
    if len(frame) != len(assignments) or len(frame) != len(groups):
        raise ValueError('Misaligned frame/assignment/groups')
    fit = np.flatnonzero(assignments == 'fit')
    cv_config = config['cv']
    if len(np.unique(groups[fit])) < cv_config['folds']:
        raise ValueError('Insufficient fitting groups')
    cv = StratifiedGroupKFold(n_splits=cv_config['folds'], shuffle=True, random_state=cv_config['seed'])
    folds, private_signature = [], []
    for train, valid in cv.split(fit, frame.IMMEDR.to_numpy()[fit], groups[fit]):
        train, valid = fit[train], fit[valid]
        if set(groups[train]) & set(groups[valid]):
            raise ValueError('CV group overlap')
        if any(assignments[i] != 'fit' for i in np.concatenate([train, valid])):
            raise ValueError('Non-fit partition reached CV')
        for indices in (train, valid):
            if set(frame.IMMEDR.iloc[indices]) != {1, 2, 3, 4, 5}:
                raise ValueError('CV lacks a recorded class; no fold/seed substitution')
        folds.append({'train': support(frame.IMMEDR.iloc[train].to_numpy()),
                      'validation': support(frame.IMMEDR.iloc[valid].to_numpy())})
        private_signature.append({'train': frame.index[train].tolist(), 'validation': frame.index[valid].tolist()})
    digest = hashlib.sha256(json.dumps(private_signature, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    return folds, digest


def binary_support_guard(frame: pd.DataFrame, assignments: np.ndarray, groups: np.ndarray, config: dict) -> dict:
    out = {}
    for partition, key in [('calibration', 'calibration'), ('threshold_selection', 'threshold_selection')]:
        selected = assignments == partition
        y = frame.IMMEDR.loc[selected].isin([1, 2])
        counts = {'positive': int(y.sum()), 'negative': int((~y).sum()), 'groups': len(np.unique(groups[selected]))}
        rules = config[key]
        if (counts['positive'] < rules['minimum_positive'] or counts['negative'] < rules['minimum_negative']
                or counts['groups'] < rules['minimum_connected_groups']):
            raise ValueError('Insufficient binary calibration/threshold support; do not borrow other partitions')
        out[partition] = counts
    return out


def preflight(root: Path, phase1_run: str, config: dict) -> dict:
    if not phase1_run or not all(c.isalnum() or c in '-_' for c in phase1_run):
        raise ValueError('Use a simple existing Phase 1 run name')
    runtime = environment()
    pins = dict(line.split('==') for line in (SPEC.parent / 'requirements-phase1.txt').read_text().splitlines()
                if line and not line.startswith('#'))
    if runtime['packages'] != pins:
        raise ValueError('Research dependency pins changed; review before regenerating CV')
    folder = root / 'raw' / 'nhamcs-ed-2022'
    receipt = json.loads((folder / 'acquisition-receipt.json').read_text(encoding='utf-8'))
    if receipt['status'] != 'verified' or len(receipt['members']) != 1:
        raise ValueError('Missing verified acquisition')
    member = receipt['members'][0]
    if member['name'] != 'ed2022-stata.dta' or member['sha256'] != config['source_dta_sha256']:
        raise ValueError('Frozen source receipt mismatch')
    source = folder / member['name']
    if sha256(source) != config['source_dta_sha256']:
        raise ValueError('Frozen source bytes changed')
    df, _ = load_stata(source)
    if list(df.shape) != config['source_shape']:
        raise ValueError('Frozen source schema changed')
    all_groups = connected_groups(df)
    phase1 = root / 'runs' / phase1_run
    run_receipt = json.loads((phase1 / 'run-receipt.json').read_text(encoding='utf-8'))
    if run_receipt['status'] != 'completed' or run_receipt['training_performed']:
        raise ValueError('Phase 1 run receipt must attest completed data engineering only')
    result = {'protocol_id': config['protocol_id'], 'protocol_sha256': sha256(SPEC),
              'source_dta_sha256': sha256(source), 'runtime': runtime, 'training_performed': False,
              'split_regenerated': False, 'patient_facing_behavior_changed': False, 'cohorts': {}}
    for name, cohort in config['cohorts'].items():
        without = research_matrix(df, cohort['without_vitals'], config)
        with_vitals = research_matrix(df, cohort['with_vitals'], config)
        if not without.index.equals(with_vitals.index):
            raise ValueError('Unmatched ablation cohorts')
        frame = df.loc[without.index]
        groups = all_groups[without.index.to_numpy()]
        assignment_file = phase1 / (cohort['phase1_name'] + '-private-assignments.json')
        assignment_file_hash = sha256(assignment_file)
        if assignment_file_hash != run_receipt['reports'][assignment_file.name]:
            raise ValueError('Private Phase 1 assignment file changed since completed run')
        records = json.loads(assignment_file.read_text(encoding='utf-8'))
        assignments = validate_assignments(frame, records, groups, cohort, config)
        cv, cv_hash = fitting_cv(frame, assignments, groups, config)
        task = next(t for t, rules in config['tasks'].items() if rules['cohort'] == name)
        target = task_target(frame, task, config)
        out = {'rows': len(frame), 'task': task, 'target_counts': {str(k): int(v) for k, v in target.value_counts().sort_index().items()},
               'phase1_assignment_file_sha256': assignment_file_hash,
               'assignment_sha256': assignment_digest(frame.index, assignments), 'overlap_errors': [],
               'matched_cohort': True, 'cv': cv, 'cv_assignment_sha256': cv_hash,
               'profiles': {p: {'columns': list(x.columns), 'rows': len(x), 'missing_counts': {c: int(x[c].isna().sum()) for c in x}}
                            for p, x in [(cohort['without_vitals'], without), (cohort['with_vitals'], with_vitals)]}}
        if task == 'primary_binary':
            out['binary_support'] = binary_support_guard(frame, assignments, groups, config)
        else:
            out['five_class_calibration_allowed'] = False
            out['Immediate_specific_threshold_allowed'] = False
        result['cohorts'][name] = out
    result['decision'] = 'GO_OFFLINE_BASELINE_ONLY'
    result['clinical_or_patient_facing_decision'] = 'NO_GO'
    return result


def main() -> None:
    if sys.version_info[:2] not in [(3, 11), (3, 12)] or sys.prefix == sys.base_prefix:
        raise ValueError('Use the dedicated Python 3.11/3.12 research venv')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase1-run', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    allowed = REPO / 'models' / 'medassist' / 'reports'
    output = args.output.resolve()
    if not output.is_relative_to(allowed) or output == allowed or output.suffix != '.json':
        raise ValueError('Publish only a new aggregate JSON under research reports')
    if output.exists():
        raise ValueError('Never overwrite an earlier report')
    result = preflight(external_root(), args.phase1_run, load_protocol())
    result['code_sha256'] = {p.name: sha256(p) for p in Path(__file__).parent.glob('*.py')}
    result['requirements_sha256'] = sha256(SPEC.parent / 'requirements-phase1.txt')
    output.parent.mkdir(parents=True, exist_ok=True)
    write_json(output, result)
    print(json.dumps({'decision': result['decision'], 'protocol_sha256': result['protocol_sha256'],
                      'training_performed': False, 'split_regenerated': False}))


if __name__ == '__main__':
    main()
