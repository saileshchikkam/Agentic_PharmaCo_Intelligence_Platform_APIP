"""Raw Stata decoding and explicit candidate-feature contracts. No estimators."""
from __future__ import annotations

from pathlib import Path
import numpy as np
import pandas as pd
import pyreadstat

VITALS = ['TEMPF', 'PULSE', 'RESPR', 'BPSYS', 'BPDIAS', 'POPCT', 'PAINSCALE']
PREDICTORS = ['AGE', 'SEX', 'RFV1', *VITALS, 'ARREMS', 'SEEN72']
AUDIT = ['AGEFL', 'BDATEFL', 'SEXFL', 'RACEUN', 'ETHUN', 'RFV2', 'RFV3', 'RFV4', 'RFV5']
SURVEY = ['CSTRATM', 'CPSUM', 'HOSPCODE', 'PATCODE', 'PATWT']
REQUIRED = ['IMMEDR', *PREDICTORS, *AUDIT, *SURVEY]
TARGET = {-9: 'Blank', -8: 'Unknown', 0: 'No triage this visit', 1: 'Immediate', 2: 'Emergent',
          3: 'Urgent', 4: 'Semi-urgent', 5: 'Nonurgent', 7: 'No nursing triage in ESA'}
PROFILES = {
    'demographic_reference': ['AGE', 'SEX'],
    'all_labelled_initial_vitals': ['AGE', 'SEX', *VITALS],
    'presentation_symptom_proxy': ['AGE', 'SEX', 'RFV1'],
    'ed_initial_symptom_proxy': ['AGE', 'SEX', 'RFV1', *VITALS],
}


def load_stata(file: Path, require_schema: bool = True):
    df, meta = pyreadstat.read_dta(str(file), apply_value_formats=False, user_missing=True)
    names = [str(c).upper() for c in df.columns]
    if len(names) != len(set(names)):
        raise ValueError('Case-normalized column collision')
    df.columns = names
    if require_schema and set(REQUIRED) - set(names):
        raise ValueError('Missing required source columns: ' + ','.join(sorted(set(REQUIRED) - set(names))))
    return df, meta


def target_eligible(values: pd.Series) -> pd.Series:
    unknown = set(values.dropna().unique()) - set(TARGET)
    if unknown:
        raise ValueError('Unexpected target codes; investigate rather than invent labels')
    return values.isin([1, 2, 3, 4, 5])


def missing_reasons(values: pd.Series, field: str) -> dict:
    out = {'system_missing': int(values.isna().sum())}
    for code, name in [(-9, 'blank'), (-8, 'unknown'), (-7, 'not_applicable'), (-6, 'refused')]:
        out[name] = int(values.eq(code).sum())
    out['doppler_998'] = int(values.eq(998).sum()) if field in ('PULSE', 'BPDIAS') else 0
    out['zero_observed_not_automatically_missing'] = int(values.eq(0).sum())
    return out


def source_missing(values: pd.Series, field: str) -> pd.Series:
    return values.isna() | values.isin([-9, -8, -7, -6] + ([998] if field in ('PULSE', 'BPDIAS') else []))


def decoded(values: pd.Series, field: str) -> pd.Series:
    result = values.mask(source_missing(values, field))
    # Verified pinned Stata file stores initial Fahrenheit temperature in tenths (e.g. 986).
    if field == 'TEMPF':
        if result.dropna().between(1, 199).any():
            raise ValueError('Unexpected temperature scaling; refuse double conversion')
        result = result / 10
    return result


def symptom_mask(df: pd.DataFrame) -> pd.Series:
    # Numeric Stata RFV codes are five-digit fixed-width codes, not floating clinical scores.
    values = df.RFV1
    return values.between(10000, 19999) & values.mod(1).eq(0)


def feature_matrix(df: pd.DataFrame, profile: str, requested: list[str] | None = None) -> pd.DataFrame:
    if profile not in PROFILES:
        raise ValueError('Unknown feature profile')
    allowed = PROFILES[profile]
    requested = allowed if requested is None else requested
    if len(requested) != len(set(requested)) or set(requested) - set(allowed):
        raise ValueError('Unexpected/prohibited model feature')
    mask = target_eligible(df.IMMEDR)
    if 'RFV1' in allowed:
        mask &= symptom_mask(df)
    x = pd.DataFrame({field: decoded(df[field], field) for field in requested}, index=df.index).loc[mask].copy()
    if 'AGE' in x:
        good = df.AGEFL.isin([0, 1]) & df.BDATEFL.eq(0)
        x['AGE'] = x.AGE.mask(~good.loc[x.index])
    if 'SEX' in x:
        x['SEX'] = x.SEX.mask(~df.SEXFL.loc[x.index].eq(0)).astype('Int64').astype('string')
    if 'RFV1' in x:
        x['RFV1'] = x.RFV1.astype('Int64').astype('string')
    return x


def validate_feature_frame(x: pd.DataFrame, profile: str) -> None:
    if profile not in PROFILES or list(x.columns) != PROFILES[profile]:
        raise ValueError('Unexpected or missing feature-matrix columns')


def age_groups(df: pd.DataFrame) -> pd.Series:
    age = decoded(df.AGE, 'AGE').mask(~(df.AGEFL.isin([0, 1]) & df.BDATEFL.eq(0)))
    bands = pd.cut(age, bins=[-0.1, 0.5, 4.5, 17.5, 44.5, 64.5, np.inf],
                   labels=['<1', '1-4', '5-17', '18-44', '45-64', '65+'])
    return bands.astype('string').fillna('unknown_or_provenance_quarantined')
