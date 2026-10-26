"""Provisional deterministic emergency context; no models, evidence mapping or clearance."""
import json
import re
from pathlib import Path


class ProvisionalSafety:
    def __init__(self):
        self.rules = json.loads((Path(__file__).parent / 'provisional-rules.v3.json').read_text(encoding='utf8'))
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

    def _subject(self, clause, end, inherited):
        area = clause[:end]
        found = [(m.start(), kind) for key, kind in (('self', 'self'), ('other', 'other'))
                 for m in re.finditer(self.rules['context'][key], area)]
        return sorted(found, key=lambda item: item[0])[-1][1] if found else inherited

    def _target_end(self, clause, end):
        suffix = clause[end:]
        lead = re.match(r'^\s*(?:(?:from|for|of|in|on|to|up|out)\s+)?', suffix).end()
        target = re.match('(?:' + self.rules['context']['self'] + '|' + self.rules['context']['other'] + ')', suffix[lead:])
        return end + lead + target.end() if target else end

    def check(self, evidence):
        if not isinstance(evidence, str):
            return {'status': 'unavailable', 'reason': 'independent_clinician_review_required'}
        if len(evidence) > 4000:
            return self._decision('clarify', [], [])
        text = evidence.lower().replace('\u2019', "'")
        for before, after in self.rules['normalizations']:
            text = re.sub(r'\b' + re.escape(before) + r'\b', after, text)
        text = re.sub(r"[^a-z0-9'.!?;,:\n]+", ' ', text)
        text = re.sub(' +', ' ', text).strip()
        mentions, active, seen = [], [], set()
        inherited_subject, inherited_scope, inherited_remote, antecedent = 'unspecified', 'reported', False, ''
        for clause in re.split(self.rules['context']['split'], text):
            if not clause.strip():
                continue
            local_education, local_hypothesis = self._has('education', clause), self._has('hypothetical', clause)
            if self._has('actual_override', clause):
                inherited_scope, inherited_remote = 'reported', False
            scope = 'educational' if local_education else 'hypothetical' if local_hypothesis else inherited_scope
            recent = self._has('recent', re.sub(self.rules['context']['recent_clause_exclusions'], '', clause))
            past, current = self._has('past', clause), self._has('current', clause)
            remote = (self._has('remote', clause) or inherited_remote) and not recent
            uncertain, unknown = self._has('uncertain', clause), self._has('scope_unknown', clause)
            matched = False
            for rule in self.rules['rules']:
                if rule['id'] == 'reported_stroke_emergency' and self._has('idiom', clause):
                    continue
                matches = [m for pattern in rule['patterns'] for m in re.finditer(pattern, clause)]
                if not matches and rule['id'] == antecedent and recent and self._has('reference', clause):
                    matches = [re.search(self.rules['context']['reference'], clause)]
                for match in matches:
                    matched = True
                    prefix = re.sub(self.rules['context']['uncertainty_negation_exceptions'], '', clause[:match.start()])
                    inside = re.sub(self.rules['context']['intrinsic_negative'], '', match.group())
                    negative = bool(re.search(self.rules['context']['negation_prefix'], prefix) or re.search(self.rules['context']['negation_inside'], inside) or re.search(self.rules['context']['negation_suffix'], clause[match.end():]))
                    subject = self._subject(clause, len(clause) if rule['kind'] == 'request' else self._target_end(clause, match.end()), inherited_subject)
                    context = scope if scope != 'reported' else 'remote_history' if remote else 'reported'
                    mention = {'rule_id': rule['id'], 'category': rule['category'], 'subject': subject,
                               'assertion': 'negated' if negative and not uncertain else 'suspected' if uncertain else 'affirmed',
                               'temporality': 'remote' if context == 'remote_history' else 'current_or_recent' if recent or current and not past else 'uncertain', 'context': context}
                    key = tuple(mention.values())
                    if key not in seen:
                        seen.add(key); mentions.append(mention)
                    if rule['kind'] == 'declaration':
                        antecedent = rule['id']
                    if context != 'reported' or negative and not uncertain:
                        continue
                    credible = rule['kind'] == 'request' or current or recent or subject != 'unspecified' or self._has('inability_fragment', clause)
                    action = 'clarify' if unknown or negative and uncertain or rule['kind'] == 'clarification' or past and not recent or not credible else 'escalate'
                    active.append((rule['id'], action))
            inherited_subject = self._subject(clause, len(clause), inherited_subject)
            if local_education or local_hypothesis:
                inherited_scope = scope
            elif matched:
                inherited_scope = 'reported'
            inherited_remote = not matched and remote
        status = 'escalate' if any(a == 'escalate' for _, a in active) else 'clarify' if active else 'not_assessed'
        ids = list(dict.fromkeys(i for i, action in active if action == status))
        return self._decision(status, ids, mentions)

    def resolve(self, prior, answer):
        if prior['status'] != 'clarify':
            return prior
        if answer not in ('current', 'non_current', 'unsure'):
            raise ValueError('INVALID_SCOPE_CLARIFICATION')
        return self._decision('not_assessed' if answer == 'non_current' else 'escalate', prior['matched_rule_ids'], prior['mentions'])
