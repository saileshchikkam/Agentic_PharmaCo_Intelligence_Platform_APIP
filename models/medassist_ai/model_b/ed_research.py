"""Offline NHAMCS five-class statistical experiment. Never a clinical provider.

No imports from this module belong in application routes. Source labels are recorded
ED immediacy, not independently adjudicated community urgency or ESI ground truth.
"""
from collections import Counter
from dataclasses import dataclass
import argparse
import hashlib
import importlib.metadata
import io
import json
from pathlib import Path
import platform
import time
import warnings
import zipfile

import numpy as np
from scipy import sparse
from sklearn.exceptions import ConvergenceWarning
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from threadpoolctl import threadpool_limits

from .data import FeatureSchema, Observation, ReadinessError, records_digest
from .evaluation import EDResearchEvaluator
from .splitting import LeakageAuditor, Split, symptom_key
from .training import NumericEvidenceEncoder, ResearchFit

HERE = Path(__file__).resolve().parent
CODES = ('1', '2', '3', '4', '5')
NUMERIC = ('AGE', 'TEMPF', 'PULSE', 'RESPR', 'BPSYS', 'BPDIAS', 'POPCT', 'PAINSCALE')
CATEGORICAL = ('SEX', 'RFV1', 'RFV2', 'RFV3', 'RFV4', 'RFV5')
FEATURES = NUMERIC + CATEGORICAL
RANGES = {'AGE': (0, 94), 'TEMPF': (896, 1056), 'PULSE': (0, 240),
          'RESPR': (0, 150), 'BPSYS': (0, 289), 'BPDIAS': (0, 190),
          'POPCT': (0, 100), 'PAINSCALE': (0, 10), 'SEX': (1, 2)}
SCHEMA = FeatureSchema(names=list(FEATURES),
    symptom_group_features=['AGE', 'SEX', 'RFV1', 'RFV2', 'RFV3', 'RFV4', 'RFV5'],
    prediction_time='source-coded complaints and initial vitals; exact chronology unverified')
CONFIG = {'schema_version': 'medassist.nhamcs-ed-research.v1', 'research_only': True,
    'live_enabled': False, 'seed': 20261024, 'classes': list(CODES),
    'target': 'IMMEDR', 'target_meaning': 'recorded five-level ED immediacy, not community urgency',
    'source_label_adjudication': 'source recorded; no independent clinical adjudication claimed',
    'features': list(FEATURES), 'split': 'StratifiedGroupKFold(5,shuffle=True); fold0 test,fold1 validation,fold2-4 train',
    'grouping': 'age, sex, sorted recorded RFV codes plus explicit missing-state counts; ignore vitals',
    'algorithm': 'L2 multinomial logistic regression', 'C': 1.0, 'solver': 'lbfgs',
    'class_weight': 'balanced', 'max_iter': 2000, 'tol': 0.0001,
    'threads': 1, 'sample_weight': None, 'survey_inference': False,
    'tuning': 'none; configuration frozen before first fit',
    'abstention_threshold': 0.6, 'abstention_scope': 'fixed descriptive experiment, no clinical threshold',
    'calibration_fitted': False, 'clinical_validation': False}


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def observation(name, value):
    """Keep source missing/special states explicit; numerical zero stays observed."""
    if value is None or not np.isfinite(value) or value == -9:
        return Observation(state='not_asked', value=None)  # source unrecorded; not proof not asked
    if value == -8:
        return Observation(state='unknown', value=None)
    low, high = RANGES.get(name, (10050, 89990))
    if not low <= value <= high or (name in CATEGORICAL and value != int(value)):
        return Observation(state='unsupported', value=None)
    return Observation(state='observed_value', value=float(value) / 10 if name == 'TEMPF' else float(value))


@dataclass
class EDVisit:
    record_id: str  # internal source row position only, never published
    target: str
    features: dict
    patient_id: None = None
    encounter_id: None = None
    source_group: None = None  # no claim of hospital-separated evaluation

    def model_dump(self):
        return {'record_id': self.record_id, 'target': self.target,
                'features': {k: v.model_dump() for k, v in self.features.items()}}


def group_view(record):
    """Ignore ordering of RFV complaints for conservative near-duplicate grouping."""
    features = dict(record.features)
    reasons = sorted((features[f'RFV{i}'] for i in range(1, 6)),
                     key=lambda o: (o.state, o.value if o.value is not None else -1))
    features.update({f'RFV{i}': value for i, value in enumerate(reasons, 1)})
    return EDVisit(record.record_id, record.target, features)


def load_source(archive, manifest):
    import pandas as pd
    if sha256(archive) != manifest['archive_sha256']:
        raise ReadinessError('NHAMCS_ARCHIVE_HASH_MISMATCH')
    with zipfile.ZipFile(archive) as z:
        if z.namelist() != [manifest['archive_member']]:
            raise ReadinessError('UNEXPECTED_ARCHIVE_MEMBERS')
        content = z.read(manifest['archive_member'])
    if hashlib.sha256(content).hexdigest() != manifest['archive_member_sha256']:
        raise ReadinessError('NHAMCS_MEMBER_HASH_MISMATCH')
    frame = pd.read_stata(io.BytesIO(content), convert_categoricals=False)
    if len(frame) != manifest['source_rows'] or len(frame.columns) != manifest['source_columns']:
        raise ReadinessError('SOURCE_SHAPE_CHANGED')
    required = {'IMMEDR', 'AGEFL', 'SEXFL', *FEATURES}
    if not required <= set(frame):
        raise ReadinessError('SOURCE_COLUMNS_MISSING')
    selected = frame.loc[frame.IMMEDR.isin([1, 2, 3, 4, 5])]
    records = [EDVisit(str(i), str(int(row.IMMEDR)),
                      {name: observation(name, getattr(row, name)) for name in FEATURES})
               for i, row in enumerate(selected.itertuples(index=False))]
    audit = {'source_rows': len(frame), 'eligible_rows': len(records),
             'excluded_rows': len(frame)-len(records),
             'target_counts': {str(int(k)): int(v) for k, v in frame.IMMEDR.value_counts().sort_index().items()},
             'feature_states': {n: dict(Counter(r.features[n].state for r in records)) for n in FEATURES},
             'source_imputation_flags': {n: {str(int(k)): int(v) for k, v in selected[n].value_counts().items()}
                                         for n in ('AGEFL', 'SEXFL')},
             'feature_allowlist_only': True, 'outcomes_diagnoses_treatment_used': False,
             'patient_independence_verified': False,
             'source_missing_mapping': 'blank -> not_asked channel means unrecorded here, not known unasked; no negative observation',
             'exact_feature_duplicates': len(records)-len({symptom_key(r, FeatureSchema(
                 names=list(FEATURES), symptom_group_features=list(FEATURES), prediction_time='source initial')) for r in records})}
    return records, audit


def split_records(records, source_hash, seed=CONFIG['seed']):
    grouped = [group_view(r) for r in records]
    groups = [symptom_key(r, SCHEMA) for r in grouped]
    splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=seed)
    folds = [tuple(sorted(test.tolist())) for _, test in splitter.split(
        np.zeros(len(records)), [r.target for r in records], groups)]
    result = Split(tuple(sorted(folds[2]+folds[3]+folds[4])), folds[1], folds[0], seed,
                   source_hash, records_digest(grouped),
                   hashlib.sha256(json.dumps(SCHEMA.model_dump(), sort_keys=True).encode()).hexdigest())
    audit = LeakageAuditor().audit(grouped, result, SCHEMA)
    if any(set(v) != set(CODES) for v in audit['split_class_support'].values()):
        raise ReadinessError('ED_PARTITION_CLASS_SUPPORT_MISSING')
    audit['split_strategy'] = CONFIG['split']
    audit['patient_independent'] = False
    audit['hospital_independent'] = False
    audit['stratification'] = 'approximate under indivisible duplicate groups; no split seed search'
    return result, audit


class EDPreprocessor:
    """Reuse explicit-state encoder; train-only median/scaling and categorical vocabulary."""
    def __init__(self):
        schema = FeatureSchema(names=list(NUMERIC), symptom_group_features=['AGE'], prediction_time='initial')
        self.encoder = NumericEvidenceEncoder(schema)
        self.scaler = StandardScaler()
        self.categories = OneHotEncoder(handle_unknown='ignore', sparse_output=True)

    @staticmethod
    def categorical(records):
        return [[f'{o.state}:{o.value}' for n in CATEGORICAL for o in [r.features[n]]] for r in records]

    def numeric(self, records, fit=False):
        matrix = np.asarray(self.encoder.transform(records), dtype=float)
        # Existing encoder produces value + seven explicit state channels per field.
        step = len(self.encoder.columns)//len(NUMERIC)
        values = matrix[:, ::step].copy()
        observed = matrix[:, 3::step].astype(bool)  # channel observed_value
        values[~observed] = np.nan
        if fit:
            self.medians = np.asarray([np.median(col[np.isfinite(col)]) if np.isfinite(col).any() else 0.0
                                       for col in values.T])
        values = np.where(np.isnan(values), self.medians, values)
        scaled = self.scaler.fit_transform(values) if fit else self.scaler.transform(values)
        states = np.delete(matrix, np.arange(0, matrix.shape[1], step), axis=1)
        return sparse.csr_matrix(np.column_stack([scaled, states]))

    def fit(self, records):
        self.numeric(records, fit=True)
        self.categories.fit(self.categorical(records))
        return self

    def transform(self, records):
        return sparse.hstack([self.numeric(records), self.categories.transform(self.categorical(records))], format='csr')


def run(archive, output):
    """Explicit offline entry point; exclusive external outputs, no live registration."""
    import joblib
    output = Path(output).resolve()
    repo = HERE.parents[2]
    if output == repo or output.is_relative_to(repo) or output.exists():
        raise ReadinessError('NEW_EXTERNAL_RESEARCH_OUTPUT_REQUIRED')
    manifest = json.loads((HERE/'docs/nhamcs_2022_access_manifest.json').read_text())
    records, audit = load_source(archive, manifest)
    split, leakage = split_records(records, manifest['archive_sha256'])
    output.mkdir(parents=True, exist_ok=False)
    def write(name, value):
        with (output/name).open('x', encoding='utf-8') as f:
            json.dump(value, f, indent=2, allow_nan=False)
    environment = {'python': platform.python_version(), **{n: importlib.metadata.version(n)
        for n in ('numpy', 'scipy', 'pandas', 'scikit-learn', 'joblib', 'threadpoolctl')}}
    implementation = {p.name: sha256(p) for p in (Path(__file__), HERE/'training.py', HERE/'evaluation.py', HERE/'data.py', HERE/'splitting.py')}
    config = {**CONFIG, 'source_sha256': manifest['archive_sha256'],
              'feature_schema': SCHEMA.model_dump(), 'implementation_sha256': implementation,
              'environment': environment}
    # Freeze configuration and private row-position membership BEFORE any estimator fit.
    write('configuration.json', config)
    write('split-membership.private.json', {k: list(v) for k, v in split.parts().items()})
    write('source-audit.json', audit)
    write('leakage-audit.json', leakage)
    parts = {name: [records[i] for i in indices] for name, indices in split.parts().items()}
    start = time.perf_counter()
    preprocess = EDPreprocessor().fit(parts['train'])
    estimator = LogisticRegression(C=CONFIG['C'], solver=CONFIG['solver'], max_iter=CONFIG['max_iter'],
        tol=CONFIG['tol'], random_state=CONFIG['seed'], class_weight=CONFIG['class_weight'])
    with threadpool_limits(limits=1), warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always', ConvergenceWarning)
        estimator.fit(preprocess.transform(parts['train']), [r.target for r in parts['train']])
    fit_seconds = time.perf_counter()-start
    if tuple(estimator.classes_) != CODES:
        raise ReadinessError('ED_ESTIMATOR_CLASS_ORDER_CHANGED')
    fit = ResearchFit(estimator, preprocess, manifest['archive_sha256'],
                      hashlib.sha256(json.dumps(CODES).encode()).hexdigest(), CODES)
    reports = {}
    for name in ('calibration', 'test'):
        with threadpool_limits(limits=1):
            probabilities = fit.probabilities(parts[name])
        reports['validation' if name == 'calibration' else name] = EDResearchEvaluator().evaluate(
            [r.target for r in parts[name]], probabilities, abstention_threshold=CONFIG['abstention_threshold'])
    report = {'schema_version': CONFIG['schema_version'], 'status': 'research_only_not_release',
              'fit_seconds': fit_seconds, 'iterations': estimator.n_iter_.tolist(),
              'convergence_warning': any(isinstance(w.message, ConvergenceWarning) for w in caught),
              'partitions': reports, 'live_enabled': False, 'clinical_validation': False,
              'training_class_weights': {c: len(parts['train'])/(5*Counter(r.target for r in parts['train'])[c]) for c in CODES},
              'majority_baseline': {name: sum(r.target == Counter(x.target for x in parts['train']).most_common(1)[0][0] for r in parts[name])/len(parts[name]) for name in ('calibration', 'test')}}
    joblib.dump(fit, output/'research-only-model.joblib', compress=3)
    write('evaluation.json', report)
    write('artifact-receipt.json', {'research_only': True, 'live_enabled': False,
        'trusted_local_pickle_only': True, 'files': {p.name: sha256(p) for p in sorted(output.iterdir()) if p.is_file()},
        'configuration_sha256': sha256(output/'configuration.json'), 'implementation_sha256': implementation})
    print(json.dumps({'status': report['status'], 'fit_seconds': fit_seconds,
        'split_counts': {k: len(v) for k, v in parts.items()}, 'metrics': reports,
        'convergence_warning': report['convergence_warning']}, allow_nan=False))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    # Stable import identity makes our locally-created pickle reloadable, unlike __main__ classes.
    from models.medassist_ai.model_b.ed_research import run as stable_run
    stable_run(args.archive, args.output)
