"""Aggregate profiling and private split artifacts. No training or patient UI connection."""
from __future__ import annotations

import json
from pathlib import Path
import numpy as np
import pandas as pd

from .acquire import MANIFEST, environment, sha256, write_json
from .data import (AUDIT, PREDICTORS, PROFILES, SURVEY, TARGET, VITALS, age_groups, decoded,
                   feature_matrix, load_stata, missing_reasons, source_missing, target_eligible, validate_feature_frame)
from .splits import assess_split, connected_groups


def counts(series: pd.Series) -> dict:
    return {str(key): int(value) for key, value in series.value_counts(dropna=False).sort_index().items()}


def field_missing(df: pd.DataFrame) -> dict:
    out = {}
    for field in PREDICTORS:
        missing = source_missing(df[field], field)
        if field == 'AGE':
            missing |= ~(df.AGEFL.isin([0, 1]) & df.BDATEFL.eq(0))
        if field == 'SEX':
            missing |= ~df.SEXFL.eq(0)
        out[field] = {'denominator': len(df), 'missing_or_unusable': int(missing.sum()),
                      'percent': round(float(missing.mean() * 100), 4) if len(df) else None,
                      'raw_reasons': missing_reasons(df[field], field)}
    return out


def cohort(df: pd.DataFrame) -> dict:
    vitals = pd.DataFrame({field: source_missing(df[field], field) for field in VITALS})
    age = decoded(df.AGE, 'AGE').mask(~(df.AGEFL.isin([0, 1]) & df.BDATEFL.eq(0)))
    return {'rows': len(df), 'age_groups': counts(age_groups(df)), 'median_nonimputed_age': float(age.median()) if age.notna().any() else None,
            'nonimputed_sex': counts(df.SEX.mask(~df.SEXFL.eq(0)).astype('Int64').astype('string').fillna('unknown')),
            'predictor_missingness': field_missing(df),
            'initial_vitals': {'all_seven_recorded': int((~vitals.any(axis=1)).sum()),
                              'six_without_pain_recorded': int((~vitals.drop(columns='PAINSCALE').any(axis=1)).sum()),
                              'missing_field_count_distribution': counts(vitals.sum(axis=1))}}


def provenance(df: pd.DataFrame) -> dict:
    fields = [
        {'fields': ['AGE', 'SEX'], 'status': 'offline_demographic_reference_only', 'home_availability': 'reported age and sex may be known',
         'controls': 'require AGEFL in {0,1} and BDATEFL=0; SEXFL=0; quarantine conflicting age provenance; recorded sex is not gender identity'},
        {'fields': ['RFV1'], 'status': 'retrospective_proxy_only', 'home_availability': 'coded abstraction unavailable directly at home',
         'controls': 'symptom prefix 1 cohort only; no disease/test/treatment/admin modules; no inferred missingness flag'},
        {'fields': VITALS, 'status': 'retrospective_proxy_only', 'home_availability': 'clinician/device measurements not reliably available to ordinary home users',
         'controls': 'initial only; no exact pre-label timestamps; temperature tenths decoded; Doppler 998 masked'},
        {'fields': ['ARREMS', 'SEEN72'], 'status': 'audit_only_not_in_primary_matrices', 'home_availability': 'ED context, not home assessment', 'controls': 'sensitivity candidate only'},
        {'fields': AUDIT + SURVEY, 'status': 'audit_split_weight_only', 'home_availability': 'not model inputs',
         'controls': 'no target-informed imputations or identifiers in X'},
    ]
    matrices = {}
    for name in PROFILES:
        x = feature_matrix(df, name)
        validate_feature_frame(x, name)
        matrices[name] = {'rows': len(x), 'columns': list(x.columns), 'missing_counts': {c: int(x[c].isna().sum()) for c in x},
                          'status': 'retrospective_research_only', 'clinical_or_home_triage_approved': False}
    return {'profiles': matrices, 'feature_ledger': fields,
            'demographic_provenance_counts': {
                'age_explicit_imputation_flag_minus9': int(df.AGEFL.eq(-9).sum()),
                'birthdate_imputation_flag_1': int(df.BDATEFL.eq(1).sum()),
                'age_flag_0_with_birthdate_flag_1_quarantined': int((df.AGEFL.eq(0) & df.BDATEFL.eq(1)).sum()),
                'age_masked_by_conservative_provenance_rule': int((~(df.AGEFL.isin([0, 1]) & df.BDATEFL.eq(0))).sum()),
                'sex_masked_publisher_imputation': int(df.SEXFL.ne(0).sum())},
            'denials': ['IMMEDR/derivatives', 'diagnoses/discharge diagnoses', 'tests/procedures/treatments/medications',
                        'providers seen', 'disposition/admission/ICU/death/observation', 'WAITTIME/LOV/boarding',
                        'VITALSD/TEMPDF/PULSED/RESPRD/BPSYSD/BPDIASD', 'diagnosis-derived injury recodes',
                        'target-informed demographic imputations', 'all survey/hospital/patient IDs or weights in X'],
            'timing_established': False, 'strict_prospective_profile_approved': False,
            'temperature_encoding': 'Stata initial TEMPF is integer Fahrenheit tenths; -9 masked before divide by 10',
            'zero_value_audit': {c: int(df[c].eq(0).sum()) for c in VITALS},
            'unresolved': ['initial measurements and RFV lack proof of exact ordering before label',
                           'AGEFL=0 with BDATEFL=1 has ambiguous provenance; six additional ages conservatively quarantined, not labelled as six proven imputed ages',
                           'zero/extreme vital-sign values require review; no invented physiological thresholds',
                           'home language-to-RFV mapping and Indian/all-age transportability unvalidated']}


def profile(root: Path, receipt: dict, run_id: str) -> tuple[Path, dict]:
    if not run_id or not all(c.isalnum() or c in '-_' for c in run_id):
        raise ValueError('Run ID must be a simple unique name')
    run = root / 'runs' / run_id
    run.mkdir(parents=True, exist_ok=False)
    source = root / 'raw' / 'nhamcs-ed-2022' / receipt['members'][0]['name']
    if sha256(source) != receipt['members'][0]['sha256']:
        raise ValueError('Source hash changed')
    df, meta = load_stata(source)
    eligible = target_eligible(df.IMMEDR)
    plan = json.loads(MANIFEST.read_text(encoding='utf-8'))
    expected = plan['datasets'][0]['published_statistics']['counts_by_target']
    actual = {str(int(k)): int(v) for k, v in df.IMMEDR.value_counts().items()}
    reconcile = {key: {'expected': int(value), 'actual': actual.get(key, 0), 'difference': actual.get(key, 0) - int(value)} for key, value in expected.items()}
    discrepancies = any(item['difference'] for item in reconcile.values()) or set(actual) != set(expected)
    quality = {'dataset': 'nhamcs-ed-2022', 'archive_sha256': receipt['archive']['sha256'], 'source_dta_sha256': sha256(source),
               'source_shape': {'rows': len(df), 'columns': len(df.columns)}, 'parser': environment(),
               'target_distribution': {key: {'label': TARGET[int(key)], 'count': value} for key, value in sorted(actual.items(), key=lambda kv: int(kv[0]))},
               'published_reconciliation': reconcile, 'reconciliation_passed': not discrepancies,
               'eligible': int(eligible.sum()), 'excluded': int((~eligible).sum()),
               'class_imbalance': {'majority_class': 3, 'majority_count': actual.get('3', 0),
                                   'largest_to_smallest_valid_class_ratio': max(actual[str(i)] for i in range(1, 6))/min(actual[str(i)] for i in range(1, 6))},
               'cohorts': {'all': cohort(df), 'labelled': cohort(df.loc[eligible]), 'excluded': cohort(df.loc[~eligible])},
               'missingness_by_target': {str(code): field_missing(df.loc[df.IMMEDR.eq(code)]) for code in TARGET},
               'target_value_labels': {str(int(k)): v for k, v in meta.variable_value_labels.get('IMMEDR', {}).items()},
               'survey_limitations': ['visit sample, not longitudinal patients', 'masked grouping is imperfect',
                                     'weighted eligible-cohort descriptions are not national home-triage performance',
                                     'US ED selection, nonresponse and symptom-cohort restriction can bias generalization']}
    groups = connected_groups(df)
    split = {'grouping': {'masked_clusters': len(set(zip(df.CSTRATM, df.CPSUM))), 'masked_hospital_codes': int(df.HOSPCODE.nunique()),
                          'connected_components': len(np.unique(groups)), 'largest_component_rows': int(pd.Series(groups).value_counts().max()),
                          'identity_warning': 'not verified hospital identities or longitudinal patient groups'}, 'cohorts': {}}
    for name in ['demographic_reference', 'presentation_symptom_proxy']:
        indices = feature_matrix(df, name).index
        subset = df.loc[indices]
        try:
            result, assignments = assess_split(subset, groups[indices.to_numpy()])
            split['cohorts'][name] = result
            # Private row-level assignment; never included in aggregate publication payload.
            write_json(run / (name + '-private-assignments.json'), [{'source_row': int(i), 'partition': str(p)} for i, p in zip(indices, assignments)])
        except ValueError as error:
            split['cohorts'][name] = {'structural_blocker': str(error), 'training_performed': False}
    ledger = provenance(df)
    inventory = [{'name': c, 'dtype': str(df[c].dtype), 'stata_format': meta.original_variable_types.get(c),
                  'classification': 'target' if c == 'IMMEDR' else 'candidate' if c in PREDICTORS else 'audit_only' if c in AUDIT + SURVEY else 'denied_by_default'} for c in df.columns]
    public_receipt = {k: receipt[k] for k in ['schema_version', 'status', 'dataset_id', 'source_version', 'source_url', 'started_at_utc', 'retrieved_at_utc', 'headers', 'manifest_sha256', 'archive', 'members', 'parser', 'publisher_sha256', 'integrity_scope', 'terms_urls']}
    payload = {'acquisition': public_receipt, 'data-quality': quality, 'feature-provenance': ledger,
               'split-feasibility': split, 'column-inventory': inventory}
    for name, value in payload.items():
        write_json(run / (name + '.json'), value)
    payload['reproducibility'] = {'raw_manifest_sha256': sha256(MANIFEST), 'training_performed': False,
                                'code_sha256': {p.name: sha256(p) for p in Path(__file__).parent.glob('*.py')},
                                'aggregate_report_sha256': {name + '.json': sha256(run / (name + '.json')) for name in payload}}
    write_json(run / 'reproducibility.json', payload['reproducibility'])
    write_json(run / 'run-receipt.json', {'status': 'completed', 'raw_manifest_sha256': sha256(MANIFEST), 'training_performed': False,
                                         'code_sha256': {p.name: sha256(p) for p in Path(__file__).parent.glob('*.py')},
                                         'reports': {p.name: sha256(p) for p in run.glob('*.json')}})
    return run, payload
