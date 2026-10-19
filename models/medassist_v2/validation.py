"""Structural/source validation only. No urgency derivation, clinical assessment or inference."""
from __future__ import annotations

import ast
import json
import math
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

HERE = Path(__file__).resolve().parent


class InvalidRecord(ValueError):
    """Stable, value-free error codes: never echo patient text or source identifiers."""


def require(condition, code):
    if not condition:
        raise InvalidRecord(code)


def finite_tree(value):
    if isinstance(value, float):
        require(math.isfinite(value), 'nonfinite_value')
    elif isinstance(value, dict):
        for child in value.values():
            finite_tree(child)
    elif isinstance(value, list):
        for child in value:
            finite_tree(child)


def read_json(path):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, 'duplicate_json_key')
            result[key] = value
        return result
    try:
        value = json.loads(Path(path).read_text(encoding='utf-8'), object_pairs_hook=pairs)
    except (UnicodeError, json.JSONDecodeError):
        raise InvalidRecord('malformed_json') from None
    finite_tree(value)
    return value


def shape(record, schema_name):
    finite_tree(record)
    schema = read_json(HERE / 'schemas' / schema_name)
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    require(validator.is_valid(record), 'schema_violation')


def typed_key(value):
    # Python equality must not let True masquerade as category 1.
    return json.dumps(value, sort_keys=True, allow_nan=False, separators=(',', ':'))


def validate_catalogue(catalogue):
    require(isinstance(catalogue, dict) and set(catalogue) == {'catalogue_id', 'evidences'}, 'catalogue_shape')
    require(isinstance(catalogue['catalogue_id'], str) and catalogue['catalogue_id'].strip(), 'catalogue_id')
    definitions = catalogue['evidences']
    require(isinstance(definitions, dict) and bool(definitions), 'empty_catalogue')
    for key, definition in definitions.items():
        require(isinstance(key, str) and bool(key.strip()) and isinstance(definition, dict), 'catalogue_entry')
        require(set(definition) == {'kind', 'data_type', 'question_en', 'possible_values'}, 'catalogue_fields')
        require(definition['kind'] in ('symptom', 'antecedent') and definition['data_type'] in ('B', 'C', 'M'), 'evidence_type')
        require(isinstance(definition['question_en'], str) and bool(definition['question_en'].strip()), 'question_text')
        values = definition['possible_values']
        require(isinstance(values, list), 'possible_values')
        finite_tree(values)
        require(all(type(v) in (str, int, float) for v in values), 'category_scalar')
        require(len({typed_key(v) for v in values}) == len(values), 'duplicate_category')
        require(not values if definition['data_type'] == 'B' else bool(values), 'category_coverage')
    return definitions


def validate_value(value, definition):
    kind = definition['data_type']
    allowed = {typed_key(v) for v in definition['possible_values']}
    if kind == 'B':
        require(type(value) is bool, 'binary_answer_type')
    elif kind == 'C':
        require(type(value) in (str, int, float) and typed_key(value) in allowed, 'categorical_answer_value')
    else:
        require(isinstance(value, list) and all(typed_key(v) in allowed for v in value), 'multichoice_answer_value')
        require(len({typed_key(v) for v in value}) == len(value), 'duplicate_multichoice_value')


def validate_interview(record, catalogue):
    shape(record, 'interview.schema.json')
    definitions = validate_catalogue(catalogue)
    require(record['catalogue_id'] == catalogue['catalogue_id'], 'catalogue_mismatch')
    tracked = record['symptoms'] + record['antecedents']
    require(len(set(tracked)) == len(tracked) and set(tracked) == set(record['evidence_types']), 'tracked_evidence_mismatch')
    for field, kind in [('symptoms', 'symptom'), ('antecedents', 'antecedent')]:
        for eid in record[field]:
            require(eid in definitions and definitions[eid]['kind'] == kind, 'unknown_or_wrong_evidence_kind')
            require(record['evidence_types'][eid] == definitions[eid]['data_type'], 'evidence_type_mismatch')
    prov = record['provenance']
    if prov['origin'] == 'synthetic_ddxplus':
        require(prov['dataset_id'] == 'ddxplus-en' and prov['dataset_version'] == '10.6084/m9.figshare.22687585.v2', 'ddxplus_version')
        require(prov['source_url'] == 'https://api.figshare.com/v2/articles/22687585/versions/2'
                and prov['licence'] == 'CC BY 4.0', 'ddxplus_provenance')
        require(prov['data_sha256'] is not None and prov['rights_status'] == 'verified_for_research', 'unverified_ddxplus_data')
    elif prov['origin'] == 'synthetic_fixture':
        require(prov['dataset_id'] == 'apip-synthetic-fixture' and prov['rights_status'] == 'synthetic_fixture', 'fixture_provenance')
    else:
        require(prov['rights_status'] == 'verified_for_research' and prov['data_sha256'] is not None
                and prov['source_url'] is not None, 'unverified_research_data')
    context = record['context']
    for field in ('age', 'sex_or_gender'):
        item = context[field]
        require((item['value'] is not None) == (item['status'] == 'reported'), 'context_unknown_must_stay_null')
    require(context['caregiver_relationship'] is None or context['reporter'] == 'caregiver', 'caregiver_context')
    require(context['pregnancy']['gestational_age_weeks'] is None or context['pregnancy']['status'] == 'pregnant', 'pregnancy_context')
    require(context['postpartum']['days_since_birth'] is None or context['postpartum']['status'] == 'postpartum', 'postpartum_context')
    complaint = record['presenting_complaint']
    initial = complaint['initial_evidence_id']
    require(initial is None or (initial in definitions and definitions[initial]['kind'] == 'symptom'), 'initial_evidence')
    require(complaint['source'] != 'unprovided' or (complaint['text'] is None and initial is None), 'unprovided_complaint')
    require(complaint['source'] == 'unprovided' or complaint['text'] is not None or initial is not None, 'empty_presenting_complaint')
    require(complaint['source'] != 'synthetic_initial_evidence' or initial is not None, 'missing_initial_evidence')
    require(initial is None or initial in tracked, 'initial_evidence_not_tracked')
    answers = {}
    confirmed_history = {}
    turns = [a['turn_index'] for a in record['answer_history']]
    require(turns == sorted(turns), 'out_of_order_answer_history')
    for answer in record['answer_history']:
        aid, eid = answer['answer_id'], answer['evidence_id']
        require(aid not in answers and eid in tracked, 'answer_reference_or_duplicate')
        require(answer['turn_index'] <= record['disclosure_index'], 'future_answer_leakage')
        if answer['state'] == 'confirmed':
            validate_value(answer['value'], definitions[eid])
            confirmed_history.setdefault(eid, []).append(answer)
        else:
            require(answer['value'] is None, 'unknown_answer_must_stay_null')
        answers[aid] = answer
    current = {}
    for aid in record['confirmed_answers']:
        require(aid in answers and answers[aid]['state'] == 'confirmed', 'confirmed_answer_reference')
        eid = answers[aid]['evidence_id']
        require(eid not in current, 'multiple_current_answers')
        current[eid] = aid
    unknown = {}
    for item in record['unknown_information']:
        eid = item['evidence_id']
        require(eid in tracked and eid not in unknown and eid not in current, 'unknown_reference_or_conflict')
        unknown[eid] = item['reason']
        history = [a for a in answers.values() if a['evidence_id'] == eid]
        if item['reason'] == 'not_asked':
            require(not history, 'previous_answer_marked_unasked')
        elif item['reason'] in ('unknown', 'declined'):
            require(bool(history) and history[-1]['state'] == item['reason'], 'unknown_state_history_mismatch')
    require(set(current) | set(unknown) == set(tracked), 'unaccounted_evidence_state')
    conflicts = {}
    for conflict in record['contradictions']:
        eid = conflict['evidence_id']
        require(eid in tracked and eid not in conflicts, 'contradiction_reference_or_duplicate')
        refs = conflict['answer_ids']
        require(all(a in answers and answers[a]['evidence_id'] == eid and answers[a]['state'] == 'confirmed' for a in refs), 'contradiction_answers')
        require(len({typed_key(answers[a]['value']) for a in refs}) > 1, 'contradiction_without_difference')
        require(set(refs) == {a['answer_id'] for a in confirmed_history[eid]}, 'incomplete_contradiction_history')
        resolved = conflict['resolution_answer_id']
        if conflict['status'] == 'unresolved':
            require(resolved is None and unknown.get(eid) == 'contradiction' and eid not in current, 'unresolved_contradiction')
        else:
            require(resolved in refs and current.get(eid) == resolved, 'unconfirmed_contradiction_resolution')
        conflicts[eid] = conflict
    for eid, history in confirmed_history.items():
        if len({typed_key(a['value']) for a in history}) > 1:
            require(eid in conflicts, 'silent_contradiction_overwrite')
    for eid, aid in current.items():
        history = [a for a in answers.values() if a['evidence_id'] == eid]
        require(aid == history[-1]['answer_id'] or (eid in conflicts and conflicts[eid]['status'] == 'resolved'), 'stale_current_answer')
    require(all(reason != 'contradiction' or eid in conflicts for eid, reason in unknown.items()), 'unbacked_contradiction')
    followups = set()
    graph = {}
    for question in record['potential_follow_up_questions']:
        eid = question['evidence_id']
        require(eid in unknown and eid not in followups, 'followup_reference_or_duplicate')
        require(question['question_text'] == definitions[eid]['question_en'], 'unversioned_question_text')
        require(all(d in definitions and d != eid for d in question['depends_on']), 'followup_dependency')
        if question['status'] == 'candidate':
            require(all(d in current for d in question['depends_on']), 'unanswered_followup_dependency')
        graph[eid] = question['depends_on']
        followups.add(eid)
    def visit(eid, trail):
        require(eid not in trail, 'cyclic_question_dependencies')
        for dependency in graph.get(eid, []):
            visit(dependency, trail | {eid})
    for eid in graph:
        visit(eid, set())
    return record


def validate_annotation(annotation, interview):
    shape(annotation, 'urgency-annotation.schema.json')
    require(annotation['record_id'] == interview['record_id'], 'annotation_record_mismatch')
    status = annotation['reference_status']
    if status == 'unlabelled':
        require(annotation['label'] is None and annotation['basis'] == 'none' and not annotation['reviewers']
                and not annotation['recommended_care_settings'] and annotation['maximum_delay_minutes'] is None
                and annotation['rubric_version'] is None and annotation['adjudication_reference'] is None, 'unlabelled_has_conclusion')
    else:
        require(annotation['label'] is not None, 'missing_annotation_label')
    if status == 'independently_reviewed':
        require(interview['provenance']['origin'] in ('real_deidentified', 'clinician_authored'), 'synthetic_not_clinical_reference')
        require(annotation['basis'] == 'independent_clinician_assessment' and annotation['rubric_version'], 'reference_basis')
        reviewers = annotation['reviewers']
        require(len(reviewers) >= 2 and len({r['reviewer_reference'] for r in reviewers}) == len(reviewers), 'independent_review_support')
        require(all(r['qualification_verified'] and r['independent_of_model'] for r in reviewers), 'unverified_review')
        labels = {r['proposed_label'] for r in reviewers}
        require((len(labels) == 1 and annotation['label'] in labels) or annotation['adjudication_reference'], 'unadjudicated_label')
    elif status == 'proposed':
        require(annotation['basis'] in ('software_fixture', 'independent_clinician_assessment'), 'proposed_basis')
    if annotation['label'] in ('insufficient_information', 'abstain'):
        require(annotation['maximum_delay_minutes'] is None and annotation['recommended_care_settings'] in ([], ['undetermined']), 'uncertain_label_has_disposition')
    return annotation


def validate_ddxplus_record(record, catalogue):
    """Validate documented raw source shape, kept separate from an interview snapshot."""
    definitions = validate_catalogue(catalogue)
    expected = {'AGE', 'SEX', 'PATHOLOGY', 'EVIDENCES', 'INITIAL_EVIDENCE', 'DIFFERENTIAL_DIAGNOSIS'}
    require(isinstance(record, dict) and set(record) == expected, 'ddxplus_raw_fields')
    finite_tree(record)
    require(type(record['AGE']) in (int, float) and record['AGE'] >= 0 and record['SEX'] in ('M', 'F'), 'ddxplus_demographics')
    require(isinstance(record['PATHOLOGY'], str) and bool(record['PATHOLOGY'].strip()), 'ddxplus_pathology')
    decoded = dict(record)
    for field in ('EVIDENCES', 'DIFFERENTIAL_DIAGNOSIS'):
        if isinstance(decoded[field], str):
            require(len(decoded[field]) <= 1000000, 'oversize_literal')
            try:
                decoded[field] = ast.literal_eval(decoded[field])
            except (SyntaxError, ValueError, TypeError, RecursionError):
                raise InvalidRecord('malformed_ddxplus_literal') from None
        require(isinstance(decoded[field], list) and bool(decoded[field]), 'ddxplus_list')
    evidence = decoded['EVIDENCES']
    require(all(isinstance(token, str) for token in evidence) and len(set(evidence)) == len(evidence), 'ddxplus_evidence_duplicate_or_type')
    found = {}
    for token in evidence:
        parts = token.split('_@_')
        require(len(parts) in (1, 2) and parts[0] in definitions, 'ddxplus_evidence_code')
        eid = parts[0]
        definition = definitions[eid]
        require((len(parts) == 1) == (definition['data_type'] == 'B'), 'ddxplus_evidence_encoding')
        if len(parts) == 2:
            require(parts[1] in {str(v) for v in definition['possible_values']}, 'ddxplus_evidence_value')
        found.setdefault(eid, []).append(token)
        require(definition['data_type'] == 'M' or len(found[eid]) == 1, 'ddxplus_repeated_single_answer')
    require(isinstance(record['INITIAL_EVIDENCE'], str) and record['INITIAL_EVIDENCE'] in found
            and definitions[record['INITIAL_EVIDENCE']]['kind'] == 'symptom', 'ddxplus_initial_evidence')
    differential = decoded['DIFFERENTIAL_DIAGNOSIS']
    require(all(isinstance(row, (list, tuple)) and len(row) == 2 and isinstance(row[0], str) and bool(row[0].strip())
                and type(row[1]) in (int, float) and math.isfinite(row[1]) and 0 <= row[1] <= 1 for row in differential), 'ddxplus_differential')
    require(len({row[0] for row in differential}) == len(differential), 'ddxplus_duplicate_differential')
    # No urgency conversion or unverified assumption that truncated differential weights sum to one.
    return decoded
