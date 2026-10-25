from ..core.schemas import ResearchOutput
from ..core.exceptions import EvidenceRejected
from .static_inspection import literal_string_list
from .vocabulary_mapping import SymptomVocabulary


class JayanthDiseaseModelAdapter:
    """Fail-closed research port. No unsafe Joblib import, conversion or inference."""
    def __init__(self, manifest):
        self._manifest = manifest

    def inspect(self):
        return self._manifest.inspect()

    def normalize_symptoms(self, symptoms):
        # Integrity check before reading the canonical literal-only vocabulary.
        # This does not construct a pickle object or authorize model execution.
        if not self.inspect()['integrity_complete']:
            raise EvidenceRejected('ARTIFACT_INTEGRITY_REQUIRED')
        vocabulary = literal_string_list((self._manifest.root/'app/ml/symptom_columns.joblib').read_bytes())
        return SymptomVocabulary(vocabulary).normalize(symptoms)

    def predict(self, evidence):
        return ResearchOutput(status='unavailable', reason='executable_serialization_trust_and_reviewed_crosswalk_not_established')

    def lookup(self, disease_label):
        # Unreviewed precautions/descriptions must not become clinical guidance.
        return {'status': 'unavailable', 'reason': 'licensed_traceable_reviewed_sources_required'}
