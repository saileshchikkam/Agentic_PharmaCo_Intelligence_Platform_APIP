"""Fold-local preprocessing and exactly the three frozen model families."""
from __future__ import annotations

import hashlib
import io
import itertools

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .data import PROFILES, VITALS, validate_feature_frame


def grid_configurations(grid):
    keys = list(grid)
    return [dict(zip(keys, values)) for values in itertools.product(*(grid[k] for k in keys))]


def object_digest(value):
    buffer = io.BytesIO()
    joblib.dump(value, buffer, compress=0)
    return hashlib.sha256(buffer.getvalue()).hexdigest()


class ResearchPreprocessor(TransformerMixin, BaseEstimator):
    def __init__(self, profile, family, config):
        self.profile = profile
        self.family = family
        self.config = config

    def fit(self, X, y=None):
        validate_feature_frame(X, self.profile)
        self.numeric_ = [c for c in X if c not in ('SEX', 'RFV1')]
        self.categorical_ = [c for c in X if c in ('SEX', 'RFV1')]
        self.indicators_ = [c for c in VITALS if c in X]
        self.known_ = {c: set(X[c].dropna().astype(str)) for c in self.categorical_}
        self.fit_rows_digest_ = hashlib.sha256(','.join(map(str, X.index)).encode()).hexdigest()
        self.fit_rows_count_ = len(X)
        settings = self.config['preprocessing']
        if self.family == 'HistGradientBoostingClassifier':
            self.maps_ = {}
            for c in self.categorical_:
                counts = X[c].dropna().astype(str).value_counts()
                ranked = sorted(counts.index, key=lambda v: (-int(counts[v]), v))
                kept = [v for v in ranked if counts[v] >= settings['HGB_rare_category_min_fit_count']][:settings['HGB_max_retained_categories']]
                self.maps_[c] = {value: i if value in kept else len(kept)
                                 for i, value in enumerate(kept)}
                self.maps_[c].update({v: len(kept) for v in ranked if v not in kept})
        else:
            self.medians_ = np.array([float(X[c].dropna().median()) if X[c].notna().any()
                                     else settings['numeric_empty_column_fill_for_LR_RF'] for c in self.numeric_])
            numeric = X[self.numeric_].to_numpy(dtype=float)
            filled = np.where(np.isnan(numeric), self.medians_, numeric)
            if self.family == 'LogisticRegression':
                self.scaler_ = StandardScaler().fit(filled)
            self.encoder_ = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
            self.encoder_.fit(self.category_values(X))
        return self

    def category_values(self, X):
        token = self.config['preprocessing']['LR_RF_category_missing_token']
        return np.column_stack([X[c].astype('string').fillna(token).to_numpy(dtype=str) for c in self.categorical_])

    def unseen(self, X):
        validate_feature_frame(X, self.profile)
        out = np.zeros(len(X), dtype=bool)
        for c in self.categorical_:
            out |= (X[c].notna() & ~X[c].astype('string').isin(self.known_[c])).to_numpy(dtype=bool)
        return out

    def transform(self, X):
        validate_feature_frame(X, self.profile)
        numeric = X[self.numeric_].to_numpy(dtype=float)
        if self.family == 'HistGradientBoostingClassifier':
            categories = np.column_stack([X[c].astype('string').map(self.maps_[c]).to_numpy(dtype=float, na_value=np.nan)
                                          for c in self.categorical_])
            return np.column_stack([numeric, categories])
        filled = np.where(np.isnan(numeric), self.medians_, numeric)
        if self.family == 'LogisticRegression':
            filled = self.scaler_.transform(filled)
        indicators = X[self.indicators_].isna().to_numpy(dtype=float)
        return np.column_stack([filled, indicators, self.encoder_.transform(self.category_values(X))])


def build_pipeline(profile, family, parameters, config):
    if family not in config['models'] or parameters not in grid_configurations(config['models'][family]['grid']):
        raise ValueError('Model/configuration is outside the frozen grid')
    fixed = config['models'][family]['fixed']
    factories = {'LogisticRegression': LogisticRegression, 'RandomForestClassifier': RandomForestClassifier,
                 'HistGradientBoostingClassifier': HistGradientBoostingClassifier}
    arguments = {**fixed, **parameters}
    if family == 'HistGradientBoostingClassifier':
        columns = PROFILES[profile]
        arguments['categorical_features'] = [False] * sum(c not in ('SEX', 'RFV1') for c in columns) + [True] * sum(c in ('SEX', 'RFV1') for c in columns)
    return Pipeline([('preprocess', ResearchPreprocessor(profile, family, config)), ('model', factories[family](**arguments))])


def choose_best(candidates, tolerance):
    if not candidates or any(c['status'] != 'completed' for c in candidates):
        raise ValueError('Incomplete declared comparison; test remains closed')
    best = candidates[0]
    for candidate in candidates[1:]:
        if candidate['mean_score'] > best['mean_score'] + tolerance:
            best = candidate
    return best


def choose_threshold(y, probabilities, config):
    rules = config['threshold_selection']
    # Fixed v1 endpoints/step; integer ticks avoid platform-dependent arange endpoints.
    if (rules['grid_start'], rules['grid_stop'], rules['grid_step']) != (0., 1., .01):
        raise ValueError('Unsupported protocol revision')
    y = np.asarray(y, dtype=bool)
    rows = []
    for tick in range(101):
        threshold = tick / 100
        pred = probabilities >= threshold
        tp, fp, fn = int((pred & y).sum()), int((pred & ~y).sum()), int((~pred & y).sum())
        rows.append({'threshold': threshold, 'F2': 5*tp/(5*tp+4*fn+fp) if (5*tp+4*fn+fp) else 0.,
                     'recall': tp/int(y.sum()), 'false_positives': fp, 'true_positives': tp, 'false_negatives': fn})
    best = max(rows, key=lambda r: (r['F2'], r['recall'], -r['false_positives'], r['threshold']))
    return {'selected': best, 'grid': rows, 'partition': 'threshold_selection', 'clinical_operating_point': False}
