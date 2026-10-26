"""Provisional deterministic emergency context; no models, evidence mapping or clearance."""
import json
import re
from pathlib import Path


class ProvisionalSafety:
    def __init__(self):
        self.rules = json.loads((Path(__file__).parent / 'provisional-rules.v2.json').read_text(encoding='utf8'))
        if self.rules['review_status'] != 'provisional_unreviewed' or self.rules['clinically_validated'] is not False:
            raise ValueError('EXPLICIT_RULE_REVIEW_REQUIRED')

    def _has(self, key, text):
        return re.search(self.rules['context'][key], text) is not None

    def _decision(self, status, ids, mentions):
        blocked = status != 'not_assessed'
        return {'schema_version': 'medassist.safety-decision.v2', 'status': status,
                'rule_set_version': self.rules['version'], 'review_status': 'provisional_unreviewed',
                'clinical_validation': False, 'matched_rule_ids': ids, 'mentions': mentions,
                'suppress_ordinary_flow': blocked, 'suppress_self_care': blocked,
                'guidance': self.rules['guidance'] if status == 'escalate' else self.rules['clarification_guidance'] if status == 'clarify' else None,
                'clarification_question': 'Is this happening now to you or someone else, only in the past or hypothetically, or are you unsure?' if status == 'clarify' else None,
                'model_b_status': 'unable_to_assess', 'negative_safety_conclusion': False}

    def check(self, evidence):
        if not isinstance(evidence, str):
            return {'status': 'unavailable', 'reason': 'independent_clinician_review_required'}
        if len(evidence) > 4000:
            return self._decision('clarify', [], [])
        text = evidence.lower().replace('\u2019', "'")
        for before, after in self.rules['normalizations']:
            text = re.sub(r'\b' + re.escape(before) + r'\b', after, text)
        text = re.sub(r"[^a-z0-9'.!?;,\n]+", ' ', text)
        text = re.sub(' +', ' ', text).strip()
        mentions, active, seen = [], [], set()
        for clause in re.split(self.rules['context']['split'], text):
            if not clause.strip():
                continue
            for rule in self.rules['rules']:
                for pattern in rule['patterns']:
                    for match in re.finditer(pattern, clause):
                        prefix, suffix = clause[:match.start()], clause[match.end():]
                        recent = self._has('recent', re.sub(self.rules['context']['recent_clause_exclusions'], '', clause))
                        past, uncertain = (self._has(k, clause) for k in ('past', 'uncertain'))
                        current = recent or self._has('current', clause) or rule['kind'] == 'request'
                        prefix = re.sub(self.rules['context']['uncertainty_negation_exceptions'], '', prefix)
                        negative = bool(re.search(self.rules['context']['negation_prefix'], prefix) or re.search(self.rules['context']['negation_suffix'], suffix))
                        context = 'educational' if self._has('education', clause) else 'hypothetical' if self._has('hypothetical', clause) else 'remote_history' if self._has('remote', clause) and not recent else 'reported'
                        mention = {'rule_id': rule['id'], 'category': rule['category'],
                                   'subject': 'other' if self._has('other', clause) else 'self' if self._has('self', clause) else 'unspecified',
                                   'assertion': 'negated' if negative and not uncertain else 'suspected' if uncertain else 'affirmed',
                                   'temporality': 'remote' if context == 'remote_history' else 'uncertain' if past and not recent or not current else 'current_or_recent', 'context': context}
                        key = tuple(mention.values())
                        if key in seen:
                            continue
                        seen.add(key); mentions.append(mention)
                        if context != 'reported' or negative and not uncertain:
                            continue
                        action = 'clarify' if negative and uncertain or rule['kind'] == 'clarification' or past and not recent or rule['kind'] == 'declaration' and not self._has('current', clause) and not recent else 'escalate'
                        active.append((rule['id'], action))
        status = 'escalate' if any(a == 'escalate' for _, a in active) else 'clarify' if active else 'not_assessed'
        ids = list(dict.fromkeys(i for i, action in active if action == status))
        return self._decision(status, ids, mentions)

    def resolve(self, prior, answer):
        if prior['status'] != 'clarify':
            return prior
        if answer not in ('current', 'non_current', 'unsure'):
            raise ValueError('INVALID_SCOPE_CLARIFICATION')
        return self._decision('not_assessed' if answer == 'non_current' else 'escalate', prior['matched_rule_ids'], prior['mentions'])
