"""Read cached arrays only; no estimator deserialization, prediction, fit or threshold search."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np

from ..acquire import external_root, sha256, write_json
from ..protocol import SPEC, load_protocol
from ..train import load_inputs, verify_seal
from .errors import summarize

BASE_COMMIT = '853f7d69059ba2685de44362a890a615f6a5de47'


def inventory(paths):
    """Hash all existing raw/run/split files, with no identifier-bearing paths published."""
    return {str(p): sha256(p) for folder in paths for p in sorted(folder.rglob('*')) if p.is_file()}


def inventory_digest(items):
    # Paths used privately to detect additions/deletions; public digest uses ordinal + content only.
    return hashlib.sha256(json.dumps(list(items.values()), separators=(',', ':')).encode()).hexdigest()


def assert_preserved(before, after):
    if before != after:
        raise ValueError('Protected research files changed during audit; refuse publication')


def load_cache(path, expected_rows, expected_labels=None):
    """Only trusted locally generated caches. joblib is unsafe for arbitrary downloaded files."""
    if path.parent.name != 'private-test-predictions' and path.name != 'private-development-predictions.joblib':
        raise ValueError('Refuse estimator/job artifact deserialization')
    result = joblib.load(path)
    if not isinstance(result, dict) or any(not isinstance(v, np.ndarray) for v in result.values()):
        raise ValueError('Cache must contain only named ndarray values')
    if expected_labels is not None:
        if not np.array_equal(result['source_rows'], expected_rows) or not np.array_equal(result['IMMEDR'], expected_labels):
            raise ValueError('Cached test membership/order/labels differ from original split')
    return result


def run_audit(root, run_name):
    # Both existing directories are selected by names, never path traversal.
    if Path(run_name).name != run_name or run_name in ('.', '..'):
        raise ValueError('Invalid existing run name')
    run = root / 'runs' / run_name
    config = load_protocol()
    manifest = verify_seal(run, config)
    phase1 = root / 'runs' / manifest['phase1_run']
    protected = [root / 'raw/nhamcs-ed-2022', phase1, run]
    before = inventory(protected)
    preflight, bundles = load_inputs(root, manifest['phase1_run'], config)
    for name, bundle in preflight['cohorts'].items():
        for field in ('assignment_sha256', 'cv_assignment_sha256'):
            if manifest['split_and_CV_digests'][name][field] != bundle[field]:
                raise ValueError('Frozen split/CV digest mismatch')
    test_report = json.loads((run / 'test-results.json').read_text())
    completed = json.loads((run / 'completed.json').read_text())
    published = SPEC.parent / 'reports/2026-10-19-phase3/test-results.json'
    if (completed['test_results_sha256'] != sha256(run / 'test-results.json')
            or sha256(published) != sha256(run / 'test-results.json')
            or test_report['pretest_sha256'] != sha256(run / 'pretest-manifest.json')):
        raise ValueError('Require completed sealed Phase 3 evaluation')
    result = {'phase3_commit': BASE_COMMIT, 'protocol_sha256': sha256(SPEC),
              'pretest_sha256': sha256(run / 'pretest-manifest.json'),
              'source_dta_sha256': manifest['source_dta_sha256'],
              'split_and_CV_digests': manifest['split_and_CV_digests'],
              'inference_replayed': False, 'training_performed': False,
              'rates_or_intervals_estimated': False, 'fit_quality_only': {},
              'development_cached_errors': {}, 'opened_test_descriptive_errors': {}}
    for name, bundle in bundles.items():
        cohort = config['cohorts'][name]
        mask = bundle['assignments'] == 'fit'
        result['fit_quality_only'][name] = summarize(bundle['frame'].loc[mask], bundle['profiles'][cohort['with_vitals']].loc[mask])
    for key, selected in manifest['models'].items():
        task, profile, family = key.split('--')
        binary = task == 'primary_binary'
        name = config['tasks'][task]['cohort']
        bundle, cohort = bundles[name], config['cohorts'][name]
        frame, assignments = bundle['frame'], bundle['assignments']
        vitals = bundle['profiles'][cohort['with_vitals']]
        threshold = selected['threshold_selection']['selected']['threshold'] if binary else None
        test = frame.loc[assignments == 'locked_test']
        cache = load_cache(run / 'private-test-predictions' / (key + '.joblib'), test.index.to_numpy(), test.IMMEDR.to_numpy())
        summary = summarize(test, vitals.loc[test.index], cache['probabilities'], binary, threshold, cache['abstention'])
        original = test_report['models'][key]['unweighted']
        for new, old in [('high_false_negatives', 'high_missed'), ('false_positives', None),
                         ('Immediate_not_detected_as_high' if binary else 'Immediate_exact_class_errors', 'Immediate_missed')]:
            if old and summary['errors'][new] != original[old]:
                raise ValueError('Cached error counts do not reconcile to Phase 3')
        expected_fp = original['confusion'][0][1] if binary else sum(
            sum(row[:2]) for row in original['confusion'][2:])
        if summary['errors']['false_positives'] != expected_fp:
            raise ValueError('Cached false positives differ from Phase 3')
        for new, old in [('abstained', 'abstained'), ('high_abstained', 'high_acuity_abstained'),
                         ('high_missed_or_abstained', 'unconditional_high_missed_or_abstained')]:
            if summary['errors'][new] != test_report['models'][key]['abstention'][old]:
                raise ValueError('Cached abstention errors differ from Phase 3')
        summary['frozen_threshold'] = threshold
        summary['CV_winner_before_test'] = manifest['CV_winners'][task + '--' + profile] == family
        result['opened_test_descriptive_errors'][key] = summary
        if binary:
            cache = load_cache(run / 'artifacts' / key / 'private-development-predictions.joblib', None)
            result['development_cached_errors'][key] = {}
            for partition, prefix in [('calibration', 'calibration'), ('threshold_selection', 'threshold')]:
                sub = frame.loc[assignments == partition]
                if not np.array_equal(cache[prefix + '_rows'], sub.index.to_numpy()):
                    raise ValueError('Development cache membership differs from frozen split')
                result['development_cached_errors'][key][partition] = summarize(
                    sub, vitals.loc[sub.index], cache['calibrated_' + prefix], True, threshold)
    after = inventory(protected)
    assert_preserved(before, after)
    verify_seal(run, config)
    result['preservation'] = {'files_hashed': len(before), 'inventory_sha256': inventory_digest(before),
                              'all_protected_files_byte_identical': True}
    result['limitations'] = ['Fit/OOF and secondary development row predictions were not cached; no error claims for them.',
        'Calibration errors reuse calibrator-fitting data; threshold-partition errors reuse threshold-selection data.',
        'Development abstention masks were not cached; no development abstention claims.',
        'Opened-test strata are post-hoc descriptions, never model/threshold selection evidence.',
        'Count-only single-attribute aggregates; sparse cells are unstable, not causal explanations.',
        'No clinical rules, home urgency mapping, new uncertainty intervals or patient-facing changes.']
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase3-run', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    reports = (SPEC.parent / 'reports').resolve()
    if not output.is_relative_to(reports) or output.suffix != '.json' or output.exists():
        raise ValueError('Choose a new aggregate JSON inside MedAssist reports')
    # No writes before all checks and protected-file comparison pass.
    result = run_audit(external_root(), args.phase3_run)
    output.parent.mkdir(parents=True, exist_ok=True)
    write_json(output, result)
    print(json.dumps({'status': 'completed', 'files_preserved': result['preservation']['files_hashed'],
                      'aggregate_sha256': sha256(output)}))


if __name__ == '__main__':
    main()
