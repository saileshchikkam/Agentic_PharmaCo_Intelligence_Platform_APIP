from copy import deepcopy
from models.medassist_intelligence.sparse_extraction import valid_output
from ..core.exceptions import EvidenceRejected


class EvidenceMapper:
    """Sparse proposals stay distinct from accepted canonical Model A evidence."""
    def proposal(self, raw, text):
        if not isinstance(text, str) or len(text) > 300 or not valid_output(raw, text):
            raise EvidenceRejected('INVALID_EXTRACTION_PROPOSAL')
        return {'schema_version': 'medassist.ai-proposal.v1',
                'accepted': False, 'extraction': deepcopy(raw)}

    def confirmed_observations(self, handoff):
        return tuple(i.model_copy(deep=True) for i in handoff.items
                     if i.status in ('observed_positive', 'observed_negative', 'observed_value'))
