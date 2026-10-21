"""Safe aggregate error views. Source identifiers never enter returned objects."""
from __future__ import annotations

import numpy as np
import pandas as pd

from ..data import VITALS, age_groups, symptom_mask


def checked_predictions(y, probabilities, binary, threshold=None):
    y = np.asarray(y)
    p = np.asarray(probabilities, dtype=float)
    expected = (len(y),) if binary else (len(y), 5)
    if p.shape != expected or not np.isfinite(p).all() or ((p < 0) | (p > 1)).any():
        raise ValueError('Invalid cached probabilities')
    if not np.isin(y, [1, 2, 3, 4, 5]).all():
        raise ValueError('Invalid recorded labels')
    if binary:
        if threshold is None or not 0 <= threshold <= 1:
            raise ValueError('Use a frozen threshold only')
        pred_high = p >= threshold
        return pred_high, None
    if not np.allclose(p.sum(axis=1), 1):
        raise ValueError('Invalid multiclass probability sum')
    ordinal = p.argmax(axis=1) + 1
    return ordinal <= 2, ordinal


def counts(y, probabilities, binary, threshold=None, abstention=None):
    y = np.asarray(y)
    high_pred, ordinal = checked_predictions(y, probabilities, binary, threshold)
    a = np.zeros(len(y), dtype=bool) if abstention is None else np.asarray(abstention)
    if a.shape != y.shape or a.dtype != np.dtype(bool):
        raise ValueError('Misaligned/nonboolean abstention mask')
    high, immediate = y <= 2, y == 1
    out = {'rows': len(y), 'high_support': int(high.sum()), 'Immediate_support': int(immediate.sum()),
           'high_false_negatives': int((high & ~high_pred).sum()),
           'false_positives': int((~high & high_pred).sum()),
           'Immediate_not_detected_as_high': int((immediate & ~high_pred).sum())}
    if abstention is not None:
        out.update(abstained=int(a.sum()), high_abstained=int((a & high).sum()),
           Immediate_abstained=int((a & immediate).sum()),
           high_missed_or_abstained=int((high & (~high_pred | a)).sum()),
           Immediate_not_high_or_abstained=int((immediate & (~high_pred | a)).sum()))
    if not binary:
        out.update(Immediate_exact_class_errors=int((immediate & (ordinal != 1)).sum()),
                   undertriage=int((ordinal > y).sum()), severe_undertriage=int((ordinal - y >= 2).sum()))
    return out


def attributes(frame, decoded_vitals):
    """Fixed, one-way audit categories, not learned risk rules or model features."""
    if not frame.index.equals(decoded_vitals.index):
        raise ValueError('Misaligned feature audit')
    missing = decoded_vitals[VITALS].isna()
    output = {'age': age_groups(frame),
              'vital_missing_count': missing.sum(axis=1).astype(str),
              'symptom_coverage': symptom_mask(frame).map({True: 'symptom', False: 'other'}),
              'age_provenance': (frame.AGEFL.isin([0, 1]) & frame.BDATEFL.eq(0)).map(
                  {True: 'accepted', False: 'quarantined'}),
              'sex_provenance': frame.SEXFL.eq(0).map({True: 'original', False: 'imputed_or_unknown'}),
              'sex': frame.SEX.mask(frame.SEXFL.ne(0)).astype('Int64').astype('string').fillna('unknown'),
              'original_race': frame.RACEUN.mask(frame.RACEUN.lt(0)).astype('Int64').astype('string').fillna('unknown'),
              'original_ethnicity': frame.ETHUN.mask(frame.ETHUN.lt(0)).astype('Int64').astype('string').fillna('unknown')}
    both = decoded_vitals[['BPSYS', 'BPDIAS']].notna().all(axis=1)
    output['BP_order'] = pd.Series(np.where(~both, 'unassessable', np.where(
        decoded_vitals.BPSYS < decoded_vitals.BPDIAS, 'systolic_below_diastolic', 'no_order_conflict')), index=frame.index)
    for v in VITALS:
        output[v + '_availability'] = missing[v].map({True: 'missing_after_frozen_policy', False: 'observed'})
        # Explanatory mutually exclusive source encodings, not new cleaning.
        raw = frame[v]
        output[v + '_source'] = pd.Series(np.select(
            [raw.isna(), raw.isin([-9, -8, -7, -6]), raw.eq(998) if v in ('PULSE', 'BPDIAS') else np.zeros(len(raw), bool), raw.eq(0)],
            ['system_missing', 'negative_sentinel', 'Doppler_998', 'zero'], default='other_recorded'), index=frame.index)
    return output


def summarize(frame, vitals, probabilities=None, binary=True, threshold=None, abstention=None):
    y = frame.IMMEDR.to_numpy()
    out = {'rows': len(frame), 'error_predictions_available': probabilities is not None, 'strata': {}}
    if probabilities is not None:
        out['errors'] = counts(y, probabilities, binary, threshold, abstention)
    for name, values in attributes(frame, vitals).items():
        out['strata'][name] = {}
        for value in sorted(values.unique()):
            mask = values.eq(value).to_numpy()
            yy = y[mask]
            cell = {'rows': int(mask.sum()), 'high_support': int((yy <= 2).sum()), 'Immediate_support': int((yy == 1).sum())}
            if probabilities is not None:
                cell = counts(yy, np.asarray(probabilities)[mask], binary, threshold,
                              None if abstention is None else np.asarray(abstention)[mask])
            # Count-only publication even in large cells; sparse comparisons stay suppressed.
            cell['sparse_high_comparison'] = cell['rows'] < 30 or cell['high_support'] < 10
            cell['sparse_Immediate_comparison'] = cell['rows'] < 30 or cell['Immediate_support'] < 10
            out['strata'][name][str(value)] = cell
    return out
