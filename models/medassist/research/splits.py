"""Deterministic survey-group feasibility only; no model fitting or row random split."""
from __future__ import annotations

import hashlib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold


def connected_groups(df: pd.DataFrame) -> np.ndarray:
    for name in ['CSTRATM', 'CPSUM', 'HOSPCODE']:
        if df[name].isna().any() or df[name].le(0).any():
            raise ValueError('Unknown survey group; do not substitute a random row split')
    parent = list(range(len(df)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(a, b):
        a, b = find(a), find(b)
        parent[max(a, b)] = min(a, b)

    clusters, hospitals = {}, {}
    for i, row in enumerate(df[['CSTRATM', 'CPSUM', 'HOSPCODE']].itertuples(index=False, name=None)):
        cluster, hospital = row[:2], row[2]
        if cluster in clusters:
            union(i, clusters[cluster])
        else:
            clusters[cluster] = i
        if hospital in hospitals:
            union(i, hospitals[hospital])
        else:
            hospitals[hospital] = i
    return np.array([find(i) for i in range(len(df))])


def overlap_errors(frame: pd.DataFrame, assignments: np.ndarray, groups: np.ndarray) -> list[str]:
    errors = []
    for name, values in [('connected_group', groups), ('hospital_code', frame.HOSPCODE.to_numpy()),
                         ('masked_cluster', list(zip(frame.CSTRATM, frame.CPSUM)))]:
        seen = {}
        for value, partition in zip(values, assignments):
            if value in seen and seen[value] != partition:
                errors.append(name)
                break
            seen[value] = partition
    return errors


def support(y: np.ndarray) -> dict:
    return {'rows': len(y), 'class_counts': {str(i): int(np.sum(y == i)) for i in range(1, 6)},
            'immediate': int(np.sum(y == 1)), 'high_acuity': int(np.sum(y <= 2))}


def assess_split(frame: pd.DataFrame, all_groups: np.ndarray, seed: int = 42):
    y = frame.IMMEDR.to_numpy(dtype=int)
    groups = all_groups
    assignments = np.full(len(frame), '', dtype=object)
    pool = np.arange(len(frame))
    # Fixed sequence and seeds, not a search for a favourable class distribution.
    for partition, fraction in [('locked_test', .2), ('threshold_selection', .125), ('calibration', 1/7)]:
        if len(np.unique(groups[pool])) < 2:
            raise ValueError('Too few connected groups for the proposed partitions')
        remain, chosen = next(GroupShuffleSplit(n_splits=1, test_size=fraction, random_state=seed).split(pool, y[pool], groups[pool]))
        assignments[pool[chosen]] = partition
        pool = pool[remain]
    assignments[pool] = 'fit'
    errors = overlap_errors(frame, assignments, groups)
    if errors:
        raise ValueError('Group overlap detected: ' + ', '.join(errors))
    partitions = {name: {**support(y[assignments == name]), 'fraction': float(np.mean(assignments == name)),
                          'connected_groups': len(np.unique(groups[assignments == name]))}
                  for name in ['fit', 'calibration', 'threshold_selection', 'locked_test']}
    cv = []
    fit = np.flatnonzero(assignments == 'fit')
    if len(np.unique(groups[fit])) >= 3:
        for train, valid in StratifiedGroupKFold(n_splits=3, shuffle=True, random_state=seed).split(fit, y[fit], groups[fit]):
            assert not set(groups[fit[train]]) & set(groups[fit[valid]])
            cv.append({'train': support(y[fit[train]]), 'validation': support(y[fit[valid]])})
    blockers = []
    for name, item in partitions.items():
        if any(n == 0 for n in item['class_counts'].values()):
            blockers.append(name + ': missing target class')
        if name in ('calibration', 'threshold_selection') and item['immediate'] < 30:
            blockers.append(name + ': fewer than 30 Immediate cases (declared engineering support flag, not clinical threshold)')
    fractions = {'fit': .6, 'calibration': .1, 'threshold_selection': .1, 'locked_test': .2}
    for name, item in partitions.items():
        if abs(item['fraction'] - fractions[name]) > .05:
            blockers.append(name + ': achieved fraction differs by more than 5 percentage points')
    if len(cv) != 3 or any(any(n == 0 for n in f['validation']['class_counts'].values()) for f in cv):
        blockers.append('three-fold grouped CV has missing class support')
    digest = hashlib.sha256('\n'.join(f'{index}:{part}' for index, part in zip(frame.index, assignments)).encode()).hexdigest()
    return {'seed': seed, 'algorithm': 'fixed sequential GroupShuffleSplit, connected masked-cluster/hospital components',
            'partitions': partitions, 'overlap_errors': errors, 'grouped_cv': cv, 'support_flags': blockers,
            'assignment_sha256': digest, 'training_performed': False}, assignments
