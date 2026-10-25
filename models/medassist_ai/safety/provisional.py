"""Independent provisional literal guard; never infers safety from missing evidence."""
import json
import re
from pathlib import Path


class ProvisionalSafety:
    def __init__(self):
        self.rules = json.loads((Path(__file__).parent/'provisional-rules.v1.json').read_text())
        if self.rules['review_status'] != 'provisional_unreviewed' or self.rules['clinically_validated'] is not False:
            raise ValueError('EXPLICIT_RULE_REVIEW_REQUIRED')

    def check(self, evidence):
        if not isinstance(evidence, str):
            return {'status': 'unavailable', 'reason': 'independent_clinician_review_required'}
        text = re.sub(r"[^a-z0-9']+", ' ', evidence.lower().replace('\u2019', "'")).strip()
        text = ' '+text+' '
        ids = [r['id'] for r in self.rules['rules'] if any(' '+p+' ' in text for p in r['phrases'])]
        triggered = bool(ids)
        return {'schema_version': 'medassist.safety-decision.v1',
            'status': 'escalate' if triggered else 'not_assessed',
            'rule_set_version': self.rules['version'], 'review_status': 'provisional_unreviewed',
            'clinical_validation': False, 'matched_rule_ids': ids,
            'suppress_ordinary_flow': triggered, 'suppress_self_care': triggered,
            'guidance': self.rules['guidance'] if triggered else None,
            'model_b_status': 'unable_to_assess', 'negative_safety_conclusion': False}
