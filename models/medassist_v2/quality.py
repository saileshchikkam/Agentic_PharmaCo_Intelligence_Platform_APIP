"""Aggregate quality, class coverage and group-safety feasibility; never assign or train."""
from __future__ import annotations

from collections import Counter
import hashlib
import json

from .validation import HERE, read_json, require, shape, typed_key, validate_annotation, validate_interview

PARTITIONS = ('train', 'validation', 'test')
URGENCY_CLASSES = tuple(c for c in read_json(HERE / 'schemas/urgency-annotation.schema.json')['properties']['label']['enum'] if c is not None)


def content_digest(record):
    """Exact normalized disclosed-content duplicates, not semantic/clinical deduplication."""
    complaint = dict(record['presenting_complaint'])
    if complaint['text'] is not None:
        complaint['text'] = ' '.join(complaint['text'].split()).casefold()
    answers = [{k: a[k] for k in ('evidence_id', 'state', 'value', 'turn_index', 'source')}
               for a in record['answer_history']]
    value = {'context': record['context'], 'complaint': complaint, 'catalogue_id': record['catalogue_id'],
             'answers': sorted(answers, key=typed_key),
             'unknowns': sorted(record['unknown_information'], key=typed_key),
             'disclosure_index': record['disclosure_index']}
    return hashlib.sha256(typed_key(value).encode()).hexdigest()


def class_coverage(labels, expected):
    require(isinstance(labels, (list, tuple)), 'class_labels_must_be_sequence')
    require(isinstance(expected, (list, tuple)) and all(isinstance(c, str) and c for c in expected), 'expected_class_contract')
    require(len(expected) == len(set(expected)), 'expected_class_contract')
    require(all(label is None or isinstance(label, str) for label in labels), 'class_label_type')
    counts = Counter(label for label in labels if label is not None)
    return {'counts': {c: counts[c] for c in expected}, 'unlabelled': sum(label is None for label in labels),
            'missing_classes': [c for c in expected if not counts[c]],
            'unexpected_label_count': sum(n for c, n in counts.items() if c not in expected),
            'clinical_adequacy_established': False}


def components(records):
    parent = list(range(len(records)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    seen = {}
    for i, record in enumerate(records):
        prov = record['provenance']
        keys = [('case', prov['dataset_id'], record['case_id']),
                ('source', prov['dataset_id'], prov['source_record_id']),
                ('group', prov['dataset_id'], prov['source_group_id']),
                ('family', prov['case_family_id']), ('content', content_digest(record))]
        for key in keys:
            if key in seen:
                parent[find(i)] = find(seen[key])
            seen[key] = i
    return [find(i) for i in range(len(records))]


def profile(records, catalogue, annotations=(), assignments=None):
    """Caller passes explicit candidate assignments; this function never creates splits."""
    records = list(records)
    for record in records:
        validate_interview(record, catalogue)
    ids = [r['record_id'] for r in records]
    require(len(ids) == len(set(ids)), 'duplicate_record_id')
    references = {}
    by_id = {r['record_id']: r for r in records}
    for annotation in annotations:
        shape(annotation, 'urgency-annotation.schema.json')
        rid = annotation['record_id']
        require(rid in by_id and rid not in references, 'annotation_membership_or_duplicate')
        validate_annotation(annotation, by_id[rid])
        references[rid] = annotation
    labels = {rid: references[rid]['label'] if rid in references and references[rid]['reference_status'] == 'independently_reviewed'
              else None for rid in ids}
    groups = components(records)
    membership = {}
    for i, group in enumerate(groups):
        membership.setdefault(group, []).append(i)
    original = [r['provenance']['original_partition'] for r in records]
    original_crossings = sum(len({original[i] for i in indices} - {'unassigned'}) > 1 for indices in membership.values())
    blocked_rights = sum(r['provenance']['rights_status'] == 'pending_review' for r in records)
    # Synthetic-fixture rights are valid for software tests, never clinical eligibility.
    assignment_state = 'not_supplied'
    overlap = 0
    reassignments = 0
    per_partition = {}
    if assignments is not None:
        require(isinstance(assignments, dict) and set(assignments) == set(ids), 'incomplete_or_extra_assignments')
        require(all(p in PARTITIONS for p in assignments.values()), 'invalid_partition')
        require(set(assignments.values()) == set(PARTITIONS), 'empty_partition')
        overlap = sum(len({assignments[ids[i]] for i in indices}) > 1 for indices in membership.values())
        reassignments = sum(p != 'unassigned' and assignments[rid] != p for rid, p in zip(ids, original))
        assignment_state = 'blocked' if overlap or reassignments else 'group_safe_membership_only'
        for partition in PARTITIONS:
            selected = [i for i, rid in enumerate(ids) if assignments[rid] == partition]
            per_partition[partition] = {'rows': len(selected), 'groups': len({groups[i] for i in selected}),
                                      'urgency_coverage': class_coverage([labels[ids[i]] for i in selected], URGENCY_CLASSES)}
    coverage = class_coverage(list(labels.values()), URGENCY_CLASSES)
    # Necessary condition only. It does not promise stratification, balanced splits or power.
    necessary_groups = len(membership) >= 3 and original_crossings == 0 and blocked_rights == 0
    counts = Counter(content_digest(r) for r in records)
    missing = Counter()
    evidence_counts = Counter()
    for record in records:
        missing['age_' + record['context']['age']['status']] += 1
        missing['sex_or_gender_' + record['context']['sex_or_gender']['status']] += 1
        missing['pregnancy_' + record['context']['pregnancy']['status']] += 1
        missing['postpartum_' + record['context']['postpartum']['status']] += 1
        for item in record['unknown_information']:
            missing['evidence_' + item['reason']] += 1
        evidence_counts.update(record['evidence_types'].values())
    return {'rows': len(records), 'connected_groups': len(membership),
            'duplicate_content_groups': sum(n > 1 for n in counts.values()),
            'duplicate_content_extra_records': sum(n - 1 for n in counts.values()),
            'missingness_state_counts': dict(sorted(missing.items())),
            'tracked_evidence_type_counts': {k: evidence_counts[k] for k in ('B', 'C', 'M')},
            'urgency_reference_coverage': coverage, 'source_partition_crossing_groups': original_crossings,
            'pending_rights_records': blocked_rights,
            'three_partition_necessary_group_condition': necessary_groups,
            'assignment_status': assignment_state, 'assignment_overlap_groups': overlap,
            'original_partition_reassignments': reassignments, 'partition_support': per_partition,
            'urgency_training_ready': False,
            'interpretation': 'Structural feasibility only; independent references, reviewer rubric, support, sampling and future study freeze still required.'}
