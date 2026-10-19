"""Pure protocol integrity/semantic reference checks. No fitting, corpus scan or inference API."""
import argparse
import hashlib
import json
import math
import random

from .loader import DatasetLoader, normalise_catalogue
from .validation import HERE, read_json, require, typed_key, validate_ddxplus_record, validate_value

PROTOCOL = HERE / 'adaptive-questioning-protocol.json'
ORPHANS = {'E_69': 'E_68', 'E_37': 'E_36', 'E_118': 'E_117', 'E_123': 'E_122', 'E_87': 'E_85'}
EDGES = {**{eid: 'E_53' for eid in ('E_54','E_55','E_56','E_57','E_58','E_59')},
         **{eid: 'E_129' for eid in ('E_130','E_131','E_132','E_133','E_134','E_135','E_136')},
         'E_152': 'E_151'}
VIEW_KEYS = {'schema_version','presenting_complaint','disclosed_context','question_catalogue',
             'asked_questions','revealed_answers','unknown_answers','answer_history','contradictions','stopping_reason'}


def sha(value):
    return hashlib.sha256(typed_key(value).encode('utf-8')).hexdigest()


def validate_protocol(p):
    require(isinstance(p,dict) and set(p) == set(('protocol_id version status date scope source answers eligibility information overlap prefixes stopping baselines ranking_model selection evaluation seeds environment gates').split()), 'protocol_fields')
    require(p['protocol_id'] == 'medassist-v2-adaptive-questioning-v1' and p['version'] == 1
            and p['status'] == 'frozen', 'protocol_identity')
    require(p['answers']['absent'] == 'UNKNOWN' and p['answers']['unknown_value'] is None, 'absent_semantics')
    e = p['eligibility']
    require(e['quarantined_child_to_missing_root'] == ORPHANS and e['known_child_to_binary_parent'] == EDGES,
            'protocol_group_graph')
    require(e['catalogue_size'] == 223 and e['active_size'] == 218, 'protocol_scope')
    require(p['prefixes']['partition'] == 'train only' and p['prefixes']['max_unique_cases'] == 4096
            and p['prefixes']['saved_before_question_turns'] == [0,2,5,10]
            and p['prefixes']['candidate_cap_per_prefix'] == 32, 'prefix_settings')
    require(p['stopping']['report_budgets'] == [5,10,20] and p['stopping']['max_questions'] == 20, 'fixed_budgets')
    require(p['ranking_model']['alpha_grid'] == [1e-5,1e-4,1e-3] and p['ranking_model']['epochs'] == 3
            and p['ranking_model']['n_jobs'] == 1 and p['ranking_model']['features']['n_features'] == 65536,
            'model_settings')
    require(p['seeds']['master'] == 1729 and p['seeds']['bootstrap'] == 2718, 'fixed_seeds')
    require(p['source']['doi'] == '10.6084/m9.figshare.22687585.v2', 'source_version')
    require(p['source']['files'] == read_json(HERE / 'task3-source-verification.json')['files'], 'source_pins')
    require(p['source']['manifest_sha256'] == hashlib.sha256((HERE / 'dataset-manifest.json').read_bytes()).hexdigest(), 'manifest_pin')
    return p


def load_protocol(path=PROTOCOL):
    expected = path.with_suffix('.sha256').read_text(encoding='utf-8').strip().split()
    require(len(expected) == 2 and expected[1] == path.name
            and hashlib.sha256(path.read_bytes()).hexdigest() == expected[0], 'protocol_checksum')
    return validate_protocol(read_json(path))


def validate_metadata(source, p):
    normalise_catalogue(source)
    require(len(source) == p['eligibility']['catalogue_size'], 'metadata_catalogue_size')
    orphans = {eid:d['code_question'] for eid,d in source.items() if d['code_question'] not in source}
    edges = {eid:d['code_question'] for eid,d in source.items()
             if eid != d['code_question'] and d['code_question'] in source}
    require(orphans == ORPHANS and edges == EDGES, 'metadata_graph_changed')
    require(all(source[parent]['data_type'] == 'B' and source[parent]['code_question'] == parent
                for parent in edges.values()), 'unsupported_parent_type_or_chain')
    for d in source.values():
        if d['data_type'] == 'B':
            require(type(d['default_value']) is int and d['default_value'] == 0, 'binary_default_changed')
        else:
            require(typed_key(d['default_value']) in {typed_key(v) for v in d['possible-values']}, 'default_not_catalogue_value')
    return {'catalogue': len(source), 'quarantined': len(orphans), 'conditional': len(edges), 'active': len(source)-len(orphans)}


def checked_view(view):
    require(set(view) == VIEW_KEYS and view['schema_version'] == 'medassist-selector-v2-task2', 'selector_view_fields')
    catalogue = view['question_catalogue']
    require(all(set(d) == {'data_type','question_en','possible_values'} for d in catalogue.values()), 'public_catalogue_fields')
    initial = view['presenting_complaint']['initial_evidence_id']
    require(set(view['presenting_complaint']) == {'initial_evidence_id'} and initial in catalogue
            and initial not in ORPHANS, 'initial_scope')
    asked = view['asked_questions']
    require(len(set(asked)) == len(asked) and initial not in asked and set(asked) <= set(catalogue), 'asked_scope')
    current = {a['evidence_id']:a for a in view['revealed_answers']}
    require(len(current) == len(view['revealed_answers']) and set(current) == {initial,*asked}, 'undisclosed_answer')
    for eid, a in current.items():
        require(set(a) <= {'evidence_id','state','value','source'} and {'evidence_id','state','value'} <= set(a), 'public_answer_fields')
        require('source' not in a or a['source'] in ('synthetic_oracle_disclosure','not_encoded_in_source','scripted_research_disclosure'), 'public_answer_source')
        require(a['state'] in ('confirmed','unknown','contradiction'), 'answer_state')
        if a['state'] == 'confirmed':
            validate_value(a['value'], catalogue[eid])
        else:
            require(a['value'] is None, 'unknown_has_value')
    require(all(a['evidence_id'] in current for a in view['answer_history']), 'future_history')
    require(all(a['evidence_id'] in current for a in view['contradictions']), 'future_contradiction')
    context = view['disclosed_context']
    require(isinstance(context, dict) and set(context) == {'age','source_sex'}
            and type(context['age']) in (int,float) and math.isfinite(context['age']) and context['age'] >= 0
            and context['source_sex'] in ('M','F'), 'explicit_source_context_required')
    return current


def eligible_questions(view, p):
    current = checked_view(view)
    if view['stopping_reason'] is not None or view['contradictions'] or len(view['asked_questions']) >= p['stopping']['max_questions']:
        return []
    result = []
    for eid in sorted(view['question_catalogue']):
        if eid in current or eid in p['eligibility']['quarantined_child_to_missing_root']:
            continue
        parent = p['eligibility']['known_child_to_binary_parent'].get(eid)
        if parent is not None:
            require(parent in view['question_catalogue'], 'missing_known_parent')
            a = current.get(parent)
            if not a or a['state'] != 'confirmed' or a['value'] is not True:
                continue
        result.append(eid)
    return result


def transcript_digest(view):
    current = checked_view(view)
    return sha({'initial':view['presenting_complaint'], 'context':view['disclosed_context'],
                'asked':view['asked_questions'], 'answers':[[eid,a['state'],a['value']] for eid,a in sorted(current.items())],
                'contradictions':view['contradictions']})


def random_question(view, p, phase='eval', policy='random'):
    require((phase,policy) in (('eval','random'),('prefix','random-eligible')), 'rng_domain')
    candidates = eligible_questions(view,p)
    if not candidates:
        return None
    material = f"1729|{phase}|{policy}|{transcript_digest(view)}|{len(view['asked_questions'])}"
    seed = int(hashlib.sha256(material.encode()).hexdigest()[:16],16)
    return candidates[random.Random(seed).randrange(len(candidates))]


def prefix_candidates(view, p, policy):
    require(policy in p['prefixes']['policies'], 'prefix_policy')
    prefix = f"1729|candidate|{policy}|{transcript_digest(view)}|{len(view['asked_questions'])}|"
    return sorted(eligible_questions(view,p), key=lambda eid:(hashlib.sha256((prefix+eid).encode()).hexdigest(),eid))[:32]


def useful_content(event, source_definition):
    """Oracle/evaluator utility only: zero does NOT assert a negative clinical answer."""
    if event['state'] != 'confirmed':
        return 0
    value, kind = event['value'], source_definition['data_type']
    if kind == 'B':
        require(type(value) is bool, 'binary_answer_type')
        return int(value)
    values = value if kind == 'M' else [value]
    return int(any(typed_key(v) != typed_key(source_definition['default_value']) for v in values))


def active_fingerprint(raw, source, p):
    """Governance/evaluator only. Never pass this fingerprint or source record to a selector."""
    record = validate_ddxplus_record(raw, normalise_catalogue(source))
    answers = {}
    for token in record['EVIDENCES']:
        parts=token.split('_@_');eid=parts[0]
        if eid in p['eligibility']['quarantined_child_to_missing_root']:
            continue
        d=source[eid]
        if d['data_type']=='B': answers[eid]=True
        else:
            value=next(v for v in d['possible-values'] if str(v)==parts[1])
            if d['data_type']=='M': answers.setdefault(eid,[]).append(value)
            else: answers[eid]=value
    for eid,value in answers.items():
        if source[eid]['data_type']=='M': answers[eid]=sorted(value,key=typed_key)
    return sha({'profile':'active-interview-v1','AGE':float(record['AGE']),'SEX':record['SEX'],
                'INITIAL_EVIDENCE':record['INITIAL_EVIDENCE'],'answers':sorted(answers.items())})


def sensitivity_keep(partition, fingerprint, reference_partition, training_fingerprints):
    require(partition in ('validation','test') and reference_partition == 'train', 'training_reference_required')
    return fingerprint not in training_fingerprints


def feature_tokens(view, candidate, p):
    """Exact token grammar for a FUTURE hasher; does not import or fit sklearn."""
    current=checked_view(view)
    require(candidate in eligible_questions(view,p), 'ineligible_feature_candidate')
    d=view['question_catalogue'][candidate]; age=view['disclosed_context']['age']
    band='under_1' if age<1 else '1_to_4' if age<5 else '5_to_17' if age<18 else '18_to_64' if age<65 else '65_plus'
    # Task 2 view excludes kind; do not infer it from opaque source codes.
    tokens=[['candidate',candidate],['type',candidate,d['data_type']],['age',candidate,band],
            ['sex',candidate,view['disclosed_context']['source_sex']],
            ['initial',view['presenting_complaint']['initial_evidence_id']],
            ['initial_x',candidate,view['presenting_complaint']['initial_evidence_id']]]
    turn=len(view['asked_questions']);turn_bin='0' if turn==0 else '1-4' if turn<5 else '5-9' if turn<10 else '10-19'
    tokens.append(['turn',candidate,turn_bin])
    for eid,a in sorted(current.items()):
        tokens.append(['state',candidate,eid,a['state']])
        if a['state']=='confirmed':
            values=a['value'] if view['question_catalogue'][eid]['data_type']=='M' else [a['value']]
            for value in sorted(values,key=typed_key): tokens.append(['value',candidate,eid,value])
    return [typed_key(token) for token in tokens]


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',help='Optional existing external bundle; reads evidence metadata only')
    args=parser.parse_args();p=load_protocol()
    result={'protocol':p['protocol_id'],'checksum':'verified','training_performed':False}
    if args.root:
        l=DatasetLoader(args.root)
        source=l._metadata('release_evidences.json')
        require(hashlib.sha256((l.root/'release_evidences.json').read_bytes()).hexdigest() ==
                next(f['sha256'] for f in p['source']['files'] if f['name']=='release_evidences.json'),'metadata_sha256')
        result['metadata']=validate_metadata(source,p)
    print(json.dumps(result,sort_keys=True))
