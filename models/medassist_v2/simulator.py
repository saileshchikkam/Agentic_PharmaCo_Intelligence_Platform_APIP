"""Trusted offline harness: selectors receive JSON copies, never the case/oracle/evaluator."""
from __future__ import annotations

import copy

from .validation import require, typed_key, validate_catalogue, validate_ddxplus_record, validate_value


class HiddenOracle:
    __slots__ = ('_answers',)

    def __init__(self, answers):
        self._answers = copy.deepcopy(answers)

    def __repr__(self):
        return '<HiddenOracle>'

    def __getstate__(self):
        raise TypeError('hidden_oracle_serialization_forbidden')

    def disclose(self, eid):
        if eid not in self._answers:
            return {'evidence_id': eid, 'state': 'unknown', 'value': None, 'source': 'not_encoded_in_source'}
        return {'evidence_id': eid, 'state': 'confirmed', 'value': copy.deepcopy(self._answers[eid]),
                'source': 'synthetic_oracle_disclosure'}


class OfflineCase:
    __slots__ = ('_oracle', '_evaluator', '_catalogue', '_initial', '_context', 'partition')

    def __init__(self, raw, catalogue, partition):
        require(partition in ('train', 'validation', 'test'), 'unknown_source_partition')
        record = validate_ddxplus_record(raw, catalogue)
        self._catalogue = copy.deepcopy(catalogue)
        answers = {}
        for token in record['EVIDENCES']:
            parts = token.split('_@_'); eid = parts[0]
            definition = catalogue['evidences'][eid]
            if definition['data_type'] == 'B':
                answers[eid] = True
            else:
                value = next(v for v in definition['possible_values'] if str(v) == parts[1])
                if definition['data_type'] == 'M':
                    answers.setdefault(eid, []).append(value)
                else:
                    answers[eid] = value
        self._oracle = HiddenOracle(answers)
        # Diagnoses are excluded from the oracle and every simulator state.
        self._evaluator = copy.deepcopy({k: record[k] for k in ('PATHOLOGY', 'DIFFERENTIAL_DIAGNOSIS')})
        self._initial = record['INITIAL_EVIDENCE']
        self._context = {'age': record['AGE'], 'source_sex': record['SEX']}
        self.partition = partition

    def __repr__(self):
        return '<OfflineCase evaluator-and-oracle-redacted>'

    def __getstate__(self):
        raise TypeError('offline_case_serialization_forbidden')

    def evaluator_data(self):
        """Trusted evaluator only; never send to a selector, prompt, log or retrieval store."""
        return copy.deepcopy(self._evaluator)

    def start(self, *, disclose_demographics=False, question_budget=20):
        return StagedInterview(self._oracle, self._catalogue, self._initial,
                               self._context if disclose_demographics else None, question_budget)


class StagedInterview:
    __slots__ = ('_oracle', '_definitions', '_initial', '_context', '_history', '_current', '_asked', '_conflicts', '_stop', '_budget')

    def __init__(self, oracle, catalogue, initial, context, budget):
        require(type(budget) is int and 0 < budget <= 10000, 'question_budget')
        self._oracle = oracle
        self._definitions = copy.deepcopy(validate_catalogue(catalogue))
        self._initial, self._context = initial, copy.deepcopy(context)
        self._history, self._current, self._asked, self._conflicts = [], {}, [], []
        self._stop, self._budget = None, budget
        self._record(oracle.disclose(initial))
        if len(self._current) == len(self._definitions):
            self._stop = 'all_catalogue_questions_disclosed'

    def __repr__(self):
        return '<StagedInterview hidden-state-redacted>'

    def __getstate__(self):
        raise TypeError('interview_serialization_forbidden')

    def _record(self, event):
        previous = self._current.get(event['evidence_id'])
        self._history.append(copy.deepcopy(event))
        if previous and previous['state'] == 'confirmed' and event['state'] == 'confirmed' and typed_key(previous['value']) != typed_key(event['value']):
            self._conflicts.append({'evidence_id': event['evidence_id'], 'status': 'unresolved'})
            self._current[event['evidence_id']] = {'evidence_id': event['evidence_id'], 'state': 'contradiction', 'value': None}
        elif any(c['evidence_id'] == event['evidence_id'] for c in self._conflicts):
            self._current[event['evidence_id']] = {'evidence_id': event['evidence_id'], 'state': 'contradiction', 'value': None}
        else:
            self._current[event['evidence_id']] = copy.deepcopy(event)

    def view(self):
        """Explicit allowlist: no source partition, row IDs, hidden answers, defaults or labels."""
        return copy.deepcopy({'schema_version': 'medassist-selector-v2-task2',
            'presenting_complaint': {'initial_evidence_id': self._initial},
            'disclosed_context': self._context,
            'question_catalogue': {eid: {'data_type': d['data_type'], 'question_en': d['question_en'],
                                        'possible_values': d['possible_values']} for eid, d in self._definitions.items()},
            'asked_questions': self._asked, 'revealed_answers': list(self._current.values()),
            'unknown_answers': [eid for eid, value in self._current.items() if value['state'] == 'unknown'],
            'answer_history': self._history, 'contradictions': self._conflicts, 'stopping_reason': self._stop})

    def ask(self, eid):
        require(isinstance(eid, str) and eid in self._definitions, 'invalid_question')
        if self._stop:
            return 'stopped'
        if eid in self._asked or eid in self._current:
            return 'already_disclosed'
        self._asked.append(eid)
        self._record(self._oracle.disclose(eid))
        if len(self._asked) >= self._budget:
            self._stop = 'question_budget'
        elif len(self._current) == len(self._definitions):
            self._stop = 'all_catalogue_questions_disclosed'
        return 'answer_revealed'

    def observe(self, eid, value):
        """Trusted scripted-disclosure hook for contradiction tests, not a selector capability."""
        require(self._stop is None and isinstance(eid, str) and eid in self._current, 'invalid_scripted_observation')
        validate_value(value, self._definitions[eid])
        self._record({'evidence_id': eid, 'state': 'confirmed', 'value': copy.deepcopy(value), 'source': 'scripted_research_disclosure'})

    def stop(self, reason='selector_requested'):
        require(reason in ('selector_requested', 'insufficient_information', 'unresolved_contradiction'), 'invalid_stopping_reason')
        if self._stop is None:
            self._stop = reason

    def run(self, selector):
        """Pass only detached public dictionaries to trusted selector code; no oracle callbacks."""
        while self._stop is None:
            question = selector(self.view())
            if question is None:
                self.stop()
            elif self.ask(question) == 'already_disclosed':
                self.stop('insufficient_information')
        return self.view()
