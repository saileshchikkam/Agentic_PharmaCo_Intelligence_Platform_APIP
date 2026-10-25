from ..core.exceptions import EvidenceRejected
from dataclasses import dataclass
import re
import unicodedata


@dataclass(frozen=True)
class NormalizedSymptoms:
    present: tuple[str, ...]
    unsupported: tuple[str, ...]
    not_observed: tuple[str, ...]


class SymptomVocabulary:
    """Deterministic spelling normalization only; no fuzzy clinical synonyms."""
    @staticmethod
    def key(value):
        if not isinstance(value, str) or len(value) > 256:
            raise EvidenceRejected('INVALID_SYMPTOM_TOKEN')
        return re.sub(r'[\s_]+', '_', unicodedata.normalize('NFKC', value).strip().casefold())

    def __init__(self, feature_order):
        self.feature_order = tuple(feature_order)
        if not self.feature_order or len(self.feature_order) != len(set(self.feature_order)):
            raise EvidenceRejected('INVALID_FEATURE_ORDER')
        self._names = {}
        for value in self.feature_order:
            key = self.key(value)
            if not key or key in self._names:
                raise EvidenceRejected('AMBIGUOUS_NORMALIZED_FEATURE')
            self._names[key] = value

    def normalize(self, symptoms):
        if not isinstance(symptoms, (list, tuple)) or len(symptoms) > 256:
            raise EvidenceRejected('SYMPTOM_LIST_REQUIRED')
        found, unsupported = set(), []
        for value in symptoms:
            key = self.key(value)
            canonical = self._names.get(key)
            if canonical is None:
                if value not in unsupported:
                    unsupported.append(value)
            else:
                found.add(canonical)
        return NormalizedSymptoms(tuple(f for f in self.feature_order if f in found), tuple(unsupported),
                                  tuple(f for f in self.feature_order if f not in found))

    def observed_vector(self, *, positive, negative):
        yes, no = self.normalize(positive), self.normalize(negative)
        if yes.unsupported or no.unsupported:
            raise EvidenceRejected('UNSUPPORTED_SYMPTOMS_REVIEW_NORMALIZATION_REPORT')
        if set(yes.present) & set(no.present):
            raise EvidenceRejected('CONTRADICTORY_SYMPTOMS')
        if set(yes.present) | set(no.present) != set(self.feature_order):
            raise EvidenceRejected('UNOBSERVED_FEATURES_NOT_NEGATIVE')
        return tuple(int(f in yes.present) for f in self.feature_order)


class VocabularyMapping:
    """No guessed DDXPlus-to-classifier crosswalk or unknown-to-zero encoding."""
    def __init__(self, feature_order=(), reviewed_crosswalk=None):
        if len(feature_order) != len(set(feature_order)):
            raise EvidenceRejected('DUPLICATE_FEATURE')
        self.feature_order = tuple(feature_order)
        self.crosswalk = dict(reviewed_crosswalk or {})
        if any(v not in self.feature_order for v in self.crosswalk.values()):
            raise EvidenceRejected('UNSUPPORTED_FEATURE_MAPPING')

    def encode(self, evidence):
        values = {}
        for item in evidence.items:
            feature = self.crosswalk.get(item.evidence_id)
            if feature is None:
                continue
            if item.status not in ('observed_positive', 'observed_negative'):
                raise EvidenceRejected('CLASSIFIER_REQUIRES_OBSERVED_FEATURES')
            value = int(item.status == 'observed_positive')
            if feature in values and values[feature] != value:
                raise EvidenceRejected('CONFLICTING_FEATURE_MAPPING')
            values[feature] = value
        if not self.feature_order or set(values) != set(self.feature_order):
            raise EvidenceRejected('INCOMPLETE_REVIEWED_FEATURE_CROSSWALK')
        return tuple(values[f] for f in self.feature_order)
