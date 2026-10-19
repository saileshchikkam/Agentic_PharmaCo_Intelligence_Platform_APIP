"""Streaming Task 3 audit. Only aggregate JSON is publishable; SQLite stays external."""
import argparse
from collections import Counter
import hashlib
import json
import sqlite3
import time

from .acquire import verify_publisher
from .loader import DatasetLoader, PARTITIONS, manifest, verified_file
from .simulator import OfflineCase
from .storage import external_path
from .validation import read_json, require


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).digest()


def fingerprints(record):
    """Canonical exact content and eventual interview content, not proof of patient identity."""
    canonical = dict(record, EVIDENCES=sorted(record['EVIDENCES']),
                     DIFFERENTIAL_DIAGNOSIS=sorted(record['DIFFERENTIAL_DIAGNOSIS']))
    interview = {key: canonical[key] for key in ('AGE', 'SEX', 'INITIAL_EVIDENCE', 'EVIDENCES')}
    return digest(canonical), digest(interview)


def duplicate_summary(db, kind):
    groups, extras, crossings, crossing_rows = db.execute('''
        SELECT count(*), coalesce(sum(n-1),0), coalesce(sum(parts>1),0),
               coalesce(sum(CASE WHEN parts>1 THEN n ELSE 0 END),0)
        FROM (SELECT sum(n) n, count(*) parts FROM fingerprints WHERE kind=? GROUP BY hash HAVING sum(n)>1)
        ''', (kind,)).fetchone()
    pairs = {}
    for left, right in (('train', 'validation'), ('train', 'test'), ('validation', 'test')):
        pairs[left + '__' + right] = db.execute('''SELECT count(*) FROM fingerprints a
            JOIN fingerprints b ON a.kind=b.kind AND a.hash=b.hash
            WHERE a.kind=? AND a.partition=? AND b.partition=?''', (kind, left, right)).fetchone()[0]
    return {'duplicate_groups': groups, 'extra_rows': extras, 'cross_partition_groups': crossings,
            'rows_in_cross_partition_groups': crossing_rows, 'pairwise_shared_groups': pairs}


VIEW_KEYS = {'schema_version', 'presenting_complaint', 'disclosed_context', 'question_catalogue',
             'asked_questions', 'revealed_answers', 'unknown_answers', 'answer_history',
             'contradictions', 'stopping_reason'}


def select_public_question(view):
    """Deterministic lexical software probe, deliberately no trained selector."""
    disclosed = {item['evidence_id'] for item in view['revealed_answers']}
    return next((eid for eid in sorted(view['question_catalogue']) if eid not in disclosed), None)


def simulation_probe(record, catalogue, partition, budget=8):
    require(partition == 'train', 'simulation_training_only')
    case = OfflineCase(record, catalogue, partition)
    histories = []
    for _ in range(2):
        interview = case.start(question_budget=budget)
        trace = []
        while True:
            view = interview.view()
            require(set(view) == VIEW_KEYS and view['disclosed_context'] is None, 'selector_allowlist')
            ids = {a['evidence_id'] for a in view['revealed_answers']}
            allowed = {record['INITIAL_EVIDENCE'], *view['asked_questions']}
            require(ids == allowed and all(a['evidence_id'] in allowed for a in view['answer_history']), 'hidden_answer_leakage')
            require(len(view['answer_history']) == len(allowed), 'future_answer_leakage')
            trace.append(view)
            if view['stopping_reason'] is not None:
                break
            question = select_public_question(view)
            if question is None:
                interview.stop()
            else:
                interview.ask(question)
        histories.append(trace)
    require(histories[0] == histories[1], 'non_deterministic_replay')
    final = histories[0][-1]
    return {'questions': len(final['asked_questions']), 'unknown_answers': len(final['unknown_answers']),
            'stopping_reason': final['stopping_reason']}


def run_audit(root, output, sample=32):
    require(type(sample) is int and 1 <= sample <= 128, 'sample_bound')
    started = time.monotonic()
    loader = DatasetLoader(root)
    require(not loader.missing_files(), 'missing_source_files')
    verify_publisher(manifest(), read_json(loader.root / 'publisher-metadata.json'))
    receipt = read_json(loader.root / 'acquisition-receipt.json')
    expected = {item['name']: item for item in receipt['files']}
    require(set(expected) == set(loader.specs), 'acquisition_receipt_files')
    files = []
    for name, spec in loader.specs.items():
        with verified_file(loader.root, spec) as (_, sha, _):
            require(expected[name]['sha256'] == sha, 'acquisition_sha256_changed')
            files.append({'name': name, 'bytes': spec['bytes'], 'md5': spec['publisher_reported_md5'], 'sha256': sha})
    output = external_path(output)
    require(output.is_relative_to(loader.root) and not output.exists(), 'new_external_audit_directory_required')
    output.mkdir(exist_ok=False)
    db = sqlite3.connect(output / 'private-fingerprints.sqlite')
    db.execute('PRAGMA cache_size=-8192')
    db.execute('PRAGMA temp_store=FILE')
    db.execute('CREATE TABLE fingerprints(kind INTEGER, hash BLOB, partition TEXT, n INTEGER, PRIMARY KEY(kind,hash,partition)) WITHOUT ROWID')
    catalogue = loader.catalogue()
    evidence_meta = loader._metadata('release_evidences.json')
    definitions = catalogue['evidences']
    partitions, simulations = {}, []
    try:
        for partition in PARTITIONS:
            rows, sex, age, classes, evidences, types, kinds, initial = 0, Counter(), Counter(), Counter(), Counter(), Counter(), Counter(), Counter()
            missing, token_counts, evidence_counts = Counter(), Counter(), Counter()
            min_age, max_age, buffer = float('inf'), 0, []
            explicit_default_tokens = 0
            for membership, _, record in loader.records(partition):
                require(membership == partition, 'partition_changed')
                rows += 1
                value = record['AGE']; min_age = min(min_age, value); max_age = max(max_age, value)
                age['under_1' if value < 1 else '1_to_4' if value < 5 else '5_to_17' if value < 18 else '18_to_64' if value < 65 else '65_plus'] += 1
                sex[record['SEX']] += 1; classes[record['PATHOLOGY']] += 1
                initial[record['INITIAL_EVIDENCE']] += 1
                missing.update(key for key, item in record.items() if item is None or item == '' or item == [])
                ids = {token.split('_@_')[0] for token in record['EVIDENCES']}
                evidences.update(ids); token_counts[len(record['EVIDENCES'])] += 1; evidence_counts[len(ids)] += 1
                types.update(definitions[eid]['data_type'] for eid in ids)
                kinds.update(definitions[eid]['kind'] for eid in ids)
                for token in record['EVIDENCES']:
                    parts = token.split('_@_')
                    if len(parts) == 2 and parts[1] == str(evidence_meta[parts[0]].get('default_value')):
                        explicit_default_tokens += 1
                for kind, hashed in enumerate(fingerprints(record)):
                    buffer.append((kind, hashed, partition, 1))
                if partition == 'train' and rows <= sample:
                    simulations.append(simulation_probe(record, catalogue, partition))
                if rows % 5000 == 0:
                    db.executemany('INSERT INTO fingerprints VALUES(?,?,?,?) ON CONFLICT(kind,hash,partition) DO UPDATE SET n=n+1', buffer)
                    db.commit(); buffer.clear()
                if rows % 100000 == 0:
                    print(partition + ': validated ' + str(rows), flush=True)
            if buffer:
                db.executemany('INSERT INTO fingerprints VALUES(?,?,?,?) ON CONFLICT(kind,hash,partition) DO UPDATE SET n=n+1', buffer)
                db.commit()
            counts = list(classes.values())
            partitions[partition] = {'rows': rows, 'age_min': min_age, 'age_max': max_age, 'age_bins': dict(age),
                'source_sex': dict(sex), 'required_field_missing': {key: missing[key] for key in sorted(record)},
                'synthetic_diagnostic_classes': len(classes), 'class_min_rows': min(counts), 'class_max_rows': max(counts),
                'evidences_observed': len(evidences), 'evidences_unobserved': len(definitions) - len(evidences),
                'initial_evidences_observed': len(initial), 'distinct_evidence_occurrences_by_type': dict(types),
                'distinct_evidence_occurrences_by_kind': dict(kinds), 'encoded_token_count_histogram': dict(sorted(token_counts.items())),
                'distinct_evidence_count_histogram': dict(sorted(evidence_counts.items())),
                'unencoded_evidence_slots': rows * len(definitions) - sum(evidences.values()),
                'explicit_categorical_or_multichoice_default_tokens': explicit_default_tokens}
            print(partition + ': complete ' + str(rows), flush=True)
        duplicates = {name: duplicate_summary(db, kind) for kind, name in enumerate(('exact_content', 'eventual_interview_content'))}
        result = {'dataset_doi': manifest()['doi'], 'files': files, 'partitions': partitions, 'duplicates': duplicates,
            'catalogue': {'evidences': len(definitions), 'types': dict(Counter(d['data_type'] for d in definitions.values())),
                'kinds': dict(Counter(d['kind'] for d in definitions.values()))},
            'simulations': {'partition': 'train', 'selection': 'first source rows, not random or representative',
                'cases': len(simulations), 'replays_per_case': 2, 'question_budget': 8,
                'questions': sum(s['questions'] for s in simulations), 'unknown_answers': sum(s['unknown_answers'] for s in simulations),
                'stopping_reasons': dict(Counter(s['stopping_reason'] for s in simulations)), 'allowlist_and_disclosure_checks_passed': True},
            'source_partitions_changed': False, 'urgency_labels_available': False, 'trained_models': 0,
            'elapsed_seconds': round(time.monotonic() - started, 2)}
        with (output / 'aggregate.json').open('x', encoding='utf-8') as target:
            json.dump(result, target, indent=2)
        return result
    finally:
        db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--sample', type=int, default=32)
    args = parser.parse_args()
    run_audit(args.root, args.output, args.sample)
