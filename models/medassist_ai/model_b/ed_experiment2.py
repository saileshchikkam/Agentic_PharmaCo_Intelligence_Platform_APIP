"""Validation-only nonlinear NHAMCS follow-up; no test-scoring code or live integration."""
from collections import Counter
import argparse
import hashlib
import importlib.metadata
import io
import json
from pathlib import Path
import platform
import time
import zipfile

import numpy as np
from sklearn.ensemble import ExtraTreesClassifier
from threadpoolctl import threadpool_limits

from .data import ReadinessError, Observation, records_digest
from .ed_research import (HERE, CODES, FEATURES, SCHEMA, EDVisit, EDPreprocessor,
                          observation, group_view, sha256)
from .evaluation import EDResearchEvaluator
from .splitting import Split, LeakageAuditor
from .training import ResearchFit

PLAN = {'schema_version': 'medassist.nhamcs-ed-experiment2.v1', 'research_only': True,
    'live_enabled': False, 'seed': 20261024, 'task': 'source-recorded five-class ED immediacy',
    'features': list(FEATURES), 'development_partitions': ['train', 'calibration'],
    'test_policy': 'previously exposed; excluded from feature construction, fitting, audits, prediction and scoring',
    'source_access': 'shared archive decoded for original eligible-row indexing; only frozen development rows materialized',
    'imputation_policy': 'SEXFL != 0 -> sex unknown; AGEFL not in [0,1] or BDATEFL != 0 -> age unknown; flags not predictors',
    'preprocessing': 'same explicit-state/one-hot algorithms as experiment1, fit on leakage-masked training rows only',
    'sample_weight': 'n_train / (5 * training_class_count); no oversampling or survey weights',
    'classifier': 'ExtraTreesClassifier',
    'common_parameters': {'n_estimators': 200, 'max_depth': 16, 'max_features': 0.5,
        'bootstrap': False, 'criterion': 'gini', 'n_jobs': 1, 'random_state': 20261024,
        'class_weight': None},
    'configurations': [{'id': 'leaf2', 'min_samples_leaf': 2}, {'id': 'leaf5', 'min_samples_leaf': 5}],
    'selection': 'eligible only if macro-F1 improves over both original and masked frozen-logistic references, '
        'each severe-class recall is no worse than either reference and each severe underclassification count '
        'is no larger than either reference; select maximum validation macro-F1 then leaf5 on exact tie; '
        'otherwise reject both and retain the highest-macro-F1 diagnostic candidate without promotion',
    'severe_classes': ['1', '2'], 'abstention_threshold': 0.6,
    'abstention': 'fixed descriptive threshold; not selected or fitted on validation',
    'calibration_fitted': False, 'independent_test_evaluation': False,
    'clinical_validation': False}


def verify_prior(prior):
    """Use published artifact/code hashes as trust anchors before our local pickle load."""
    prior = Path(prior).resolve()
    published = json.loads((HERE/'docs/nhamcs_ed_research_v1_results.json').read_text())['artifact_receipt']
    receipt = json.loads((prior/'artifact-receipt.json').read_text())
    if receipt != published or any(sha256(prior/n) != h for n, h in receipt['files'].items()):
        raise ReadinessError('EXPERIMENT1_ARTIFACT_CHANGED')
    if any(sha256(HERE/n) != h for n, h in receipt['implementation_sha256'].items()):
        raise ReadinessError('EXPERIMENT1_IMPLEMENTATION_CHANGED')
    return {p.name: sha256(p) for p in prior.iterdir() if p.is_file()}


def validate_split(split, eligible_count):
    if set(split) != {'train', 'calibration', 'test'}:
        raise ReadinessError('FROZEN_PARTITIONS_REQUIRED')
    flat = [i for part in split.values() for i in part]
    if any(type(i) is not int for i in flat) or sorted(flat) != list(range(eligible_count)):
        raise ReadinessError('FROZEN_SPLIT_MUST_COVER_EACH_ROW_ONCE')


def development_records(frame, split):
    """Do not construct features, targets or audit records for protected test positions."""
    validate_split(split, len(frame))
    raw, cleaned, audit = {}, {}, {}
    for part in ('train', 'calibration'):
        # Select original frozen row positions before ANY observation conversion or auditing.
        subset = frame.iloc[split[part]]
        raw[part], cleaned[part] = [], []
        for position, row in zip(split[part], subset.itertuples(index=False)):
            features = {n: observation(n, getattr(row, n)) for n in FEATURES}
            original = EDVisit(str(position), str(int(row.IMMEDR)), features)
            raw[part].append(original)
            features = dict(features)
            if row.SEXFL != 0:
                features['SEX'] = Observation(state='unknown', value=None)
            if row.AGEFL not in (0, 1) or row.BDATEFL != 0:
                features['AGE'] = Observation(state='unknown', value=None)
            cleaned[part].append(EDVisit(original.record_id, original.target, features))
        counts = Counter(r.target for r in cleaned[part])
        if set(counts) != set(CODES):
            raise ReadinessError('DEVELOPMENT_CLASS_SUPPORT_REQUIRED')
        audit[part] = {'n': len(subset), 'class_support': dict(sorted(counts.items())),
            'source_flags': {n: {str(int(k)): int(v) for k, v in subset[n].value_counts().items()}
                             for n in ('AGEFL', 'BDATEFL', 'SEXFL')},
            'feature_states': {n: dict(Counter(r.features[n].state for r in cleaned[part])) for n in FEATURES}}
    return raw, cleaned, audit


def load_development(archive, prior):
    import pandas as pd
    manifest = json.loads((HERE/'docs/nhamcs_2022_access_manifest.json').read_text())
    if sha256(archive) != manifest['archive_sha256']:
        raise ReadinessError('SOURCE_ARCHIVE_CHANGED')
    with zipfile.ZipFile(archive) as z:
        if z.namelist() != [manifest['archive_member']]:
            raise ReadinessError('SOURCE_MEMBER_CHANGED')
        content = z.read(manifest['archive_member'])
    if hashlib.sha256(content).hexdigest() != manifest['archive_member_sha256']:
        raise ReadinessError('SOURCE_MEMBER_HASH_CHANGED')
    # IMMEDR membership alone restores the original eligible-row index, not new split selection.
    frame = pd.read_stata(io.BytesIO(content), columns=['IMMEDR', 'AGEFL', 'BDATEFL', 'SEXFL', *FEATURES],
                          convert_categoricals=False)
    eligible = frame.loc[frame.IMMEDR.isin([1, 2, 3, 4, 5])]
    split = json.loads((Path(prior)/'split-membership.private.json').read_text())
    if len(frame) != manifest['source_rows'] or len(eligible) != manifest['eligible_five_level_rows']:
        raise ReadinessError('SOURCE_SHAPE_CHANGED')
    return development_records(eligible, split), manifest


def audit_development(parts):
    records = [group_view(r) for name in ('train', 'calibration') for r in parts[name]]
    n = len(parts['train'])
    split = Split(tuple(range(n)), tuple(range(n, len(records))), (), PLAN['seed'], '0'*64,
        records_digest(records), hashlib.sha256(json.dumps(SCHEMA.model_dump(), sort_keys=True).encode()).hexdigest())
    audit = LeakageAuditor().audit(records, split, SCHEMA)
    audit['scope'] = 'training and validation only; empty test slot is not a test audit'
    audit['patient_independent'] = audit['hospital_independent'] = False
    return audit


def balanced_weights(targets):
    counts = Counter(targets)
    if set(counts) != set(CODES):
        raise ReadinessError('TRAINING_CLASS_SUPPORT_REQUIRED')
    return np.asarray([len(targets)/(5*counts[y]) for y in targets])


def select_candidate(candidates, original_reference, masked_reference):
    references = (original_reference, masked_reference)
    def eligible(report):
        return (all(report['macro_f1'] > r['macro_f1'] for r in references)
            and all(report['per_class'][c]['recall'] >= r['per_class'][c]['recall']
                    and report['severe_acuity_underclassification'][c]['predicted_less_acute'] <=
                    r['severe_acuity_underclassification'][c]['predicted_less_acute']
                    for c in PLAN['severe_classes'] for r in references))
    qualified = [name for name, r in candidates.items() if eligible(r)]
    key = lambda n: (candidates[n]['macro_f1'], n == 'leaf5')
    diagnostic = max(candidates, key=key)
    return {'selected_id': max(qualified, key=key) if qualified else None,
            'eligible_ids': qualified, 'diagnostic_id': diagnostic,
            'status': 'validation_improvement_only' if qualified else 'rejected_severe_or_macro_f1_regression',
            'independent_confirmation': False, 'live_enabled': False}


def evaluate_fit(fit, records):
    with threadpool_limits(limits=1):
        return EDResearchEvaluator().evaluate([r.target for r in records], fit.probabilities(records),
            abstention_threshold=PLAN['abstention_threshold'])


def run(archive, prior, output):
    import joblib
    prior, output = Path(prior).resolve(), Path(output).resolve()
    repo = HERE.parents[2]
    if output.exists() or output == repo or output.is_relative_to(repo) or output == prior or output.is_relative_to(prior):
        raise ReadinessError('NEW_SEPARATE_EXTERNAL_OUTPUT_REQUIRED')
    before = verify_prior(prior)
    (raw, parts, source_audit), manifest = load_development(archive, prior)
    leakage = audit_development(parts)  # fail before fitting if sanitizing introduced cross-split groups
    output.mkdir(parents=True, exist_ok=False)
    def write(name, value):
        with (output/name).open('x', encoding='utf-8') as f:
            json.dump(value, f, indent=2, allow_nan=False)
    implementation = {n: sha256(HERE/n) for n in ('ed_experiment2.py', 'ed_research.py',
        'evaluation.py', 'training.py', 'data.py', 'splitting.py')}
    frozen = {**PLAN, 'source_sha256': manifest['archive_sha256'],
        'prior_artifact_sha256': before, 'implementation_sha256': implementation,
        'environment': {'python': platform.python_version(), **{n: importlib.metadata.version(n)
            for n in ('scikit-learn', 'numpy', 'scipy', 'pandas', 'joblib', 'threadpoolctl')}}}
    # Plan, selection policy, source cleanup and artifact lineage freeze BEFORE estimator fitting.
    write('frozen-plan.json', frozen)
    write('development-source-audit.json', source_audit)
    write('development-leakage-audit.json', leakage)
    prior_fit = joblib.load(prior/'research-only-model.joblib')  # verified self-created local artifact
    # Read only the prior validation result; never use prior test scores for development.
    original_validation = json.loads((prior/'evaluation.json').read_text())['partitions']['validation']
    if evaluate_fit(prior_fit, raw['calibration']) != original_validation:
        raise ReadinessError('REFERENCE_VALIDATION_REPRODUCTION_FAILED')
    references = {'original_validation': original_validation,
        'masked_train': evaluate_fit(prior_fit, parts['train']),
        'masked_validation': evaluate_fit(prior_fit, parts['calibration'])}
    encoder = EDPreprocessor().fit(parts['train'])
    x_train = encoder.transform(parts['train']).tocsc()
    y_train = [r.target for r in parts['train']]
    weights = balanced_weights(y_train)
    write('reference-validation.json', references)
    models, reports = {}, {}
    for candidate in PLAN['configurations']:
        name = candidate['id']
        parameters = {**PLAN['common_parameters'], 'min_samples_leaf': candidate['min_samples_leaf']}
        estimator = ExtraTreesClassifier(**parameters)
        started = time.perf_counter()
        with threadpool_limits(limits=1):
            estimator.fit(x_train, y_train, sample_weight=weights)
        elapsed = time.perf_counter()-started
        if tuple(estimator.classes_) != CODES:
            raise ReadinessError('CLASS_ORDER_CHANGED')
        fitted = ResearchFit(estimator, encoder, manifest['archive_sha256'], prior_fit.label_schema_sha256, CODES)
        models[name] = fitted
        reports[name] = {'parameters': parameters, 'fit_seconds': elapsed,
            'train': evaluate_fit(fitted, parts['train']), 'validation': evaluate_fit(fitted, parts['calibration'])}
        joblib.dump(fitted, output/(name+'-research-only.joblib'), compress=3)
        write(name+'-evaluation.json', reports[name])
    selection = select_candidate({n: r['validation'] for n, r in reports.items()},
                                 original_validation, references['masked_validation'])
    write('frozen-selection.json', {**selection, 'plan_sha256': sha256(output/'frozen-plan.json'),
        'selected_parameters': reports[selection['selected_id']]['parameters'] if selection['selected_id'] else None,
        'evaluation_protocol': 'No test evaluation in Experiment 2; any new independent dataset needs separate authorization'})
    after = verify_prior(prior)
    if before != after:
        raise ReadinessError('EXPERIMENT1_CHANGED_DURING_RUN')
    report = {'schema_version': PLAN['schema_version'], 'selection': selection,
        'references': references, 'candidates': reports, 'live_enabled': False,
        'clinical_validation': False, 'test_evaluated': False, 'prior_files_unchanged': True,
        'training_class_weight': {c: len(y_train)/(5*Counter(y_train)[c]) for c in CODES}}
    write('comparison.json', report)
    write('artifact-receipt.json', {'research_only': True, 'live_enabled': False,
        'files': {p.name: sha256(p) for p in sorted(output.iterdir()) if p.is_file()},
        'implementation_sha256': implementation})
    print(json.dumps({'selection': selection, 'validation': {n: r['validation'] for n, r in reports.items()},
                      'fit_seconds': {n: r['fit_seconds'] for n, r in reports.items()}}, allow_nan=False))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True)
    parser.add_argument('--prior', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    from models.medassist_ai.model_b.ed_experiment2 import run as stable_run
    stable_run(args.archive, args.prior, args.output)
