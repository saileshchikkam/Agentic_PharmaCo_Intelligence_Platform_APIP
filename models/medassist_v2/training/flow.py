"""Disclosed-state policies, separate oracle targets and fit-only streaming model grid."""
from contextlib import closing
import copy
import json
import pickle
import time
import warnings

import numpy as np

from .. import questioning_protocol as ref
from ..simulator import OfflineCase
from ..validation import require, typed_key, read_json
from .data import Encoding, database, file_hash, selected_records, write_json


class Truth:
    """Evaluator capability. A selector never receives this object or its dictionaries."""
    def __init__(self,raw,encoding):
        self.source=encoding.source
        self.answers=encoding.answers(raw)
        initial=raw['INITIAL_EVIDENCE']
        self.encoded=set(self.answers)-set(ref.ORPHANS)-{initial}
        self.useful={eid for eid in self.encoded if self.target(eid)}
        self.unreachable={eid for eid in self.useful if eid in ref.EDGES and self.answers.get(ref.EDGES[eid]) is not True}
        self.quarantined=len(set(self.answers)&set(ref.ORPHANS))

    def target(self,eid):
        if eid not in self.answers:return 0
        return ref.useful_content({'state':'confirmed','value':self.answers[eid]},self.source[eid])


def tokens_many(view,candidates,p):
    """Equivalent to reference feature_tokens, sharing only public-view validation work."""
    current=ref.checked_view(view);allowed=set(ref.eligible_questions(view,p))
    require(set(candidates)<=allowed,'ineligible_feature_candidate')
    age=view['disclosed_context']['age'];sex=view['disclosed_context']['source_sex']
    band='under_1' if age<1 else '1_to_4' if age<5 else '5_to_17' if age<18 else '18_to_64' if age<65 else '65_plus'
    initial=view['presenting_complaint']['initial_evidence_id'];turn=len(view['asked_questions'])
    turn_bin='0' if turn==0 else '1-4' if turn<5 else '5-9' if turn<10 else '10-19'
    for candidate in candidates:
        tokens=[['candidate',candidate],['type',candidate,view['question_catalogue'][candidate]['data_type']],
                ['age',candidate,band],['sex',candidate,sex],['initial',initial],['initial_x',candidate,initial],['turn',candidate,turn_bin]]
        for eid,a in sorted(current.items()):
            tokens.append(['state',candidate,eid,a['state']])
            if a['state']=='confirmed':
                values=a['value'] if view['question_catalogue'][eid]['data_type']=='M' else [a['value']]
                for value in sorted(values,key=typed_key):tokens.append(['value',candidate,eid,value])
        yield [typed_key(token) for token in tokens]


def prefix_pairs(raw,source,catalogue,p,partition='train'):
    require(partition=='train','prefix_training_only')
    truth=Truth(raw,Encoding(source,p))
    for policy in p['prefixes']['policies']:
        interview=OfflineCase(raw,catalogue,'train').start(disclose_demographics=True,question_budget=20)
        for turn in range(20):
            view=interview.view();eligible=ref.eligible_questions(view,p)
            if not eligible:break
            if turn in p['prefixes']['saved_before_question_turns']:
                candidates=ref.prefix_candidates(view,p,policy)
                for eid,tokens in zip(candidates,tokens_many(view,candidates,p)):
                    yield policy,turn,eid,tokens,truth.target(eid)
            question=ref.random_question(view,p,'prefix','random-eligible') if policy=='random-eligible' else eligible[0]
            require(question in eligible,'prefix_policy_parity')
            interview.ask(question)


def build_pairs(dataset,root,p):
    counts={0:0,1:0};pairs=0;prefixes=set();frequency={eid:0 for eid in dataset.source if eid not in ref.ORPHANS}
    enc=Encoding(dataset.source,p)
    with (root/'pairs-features.jsonl').open('x',encoding='utf-8',newline='\n') as features, \
         (root/'pairs-targets.jsonl').open('x',encoding='utf-8',newline='\n') as targets, \
         (root/'pair-lineage.jsonl').open('x',encoding='utf-8',newline='\n') as lineage:
        for fp,ordinal,raw in selected_records(root,'train','fit'):
            truth=Truth(raw,enc)
            for eid in frequency:frequency[eid]+=truth.target(eid)
            for policy,turn,eid,tokens,target in prefix_pairs(raw,dataset.source,dataset.catalogue,p):
                prefixes.add((fp,policy,turn));pairs+=1;counts[target]+=1
                require(pairs<=p['prefixes']['max_pairs_per_pass'] and len(prefixes)<=p['prefixes']['max_saved_prefixes'],'prefix_cap_exceeded')
                features.write(typed_key(tokens)+'\n');targets.write(str(target)+'\n')
                lineage.write(typed_key({'partition':'train','fp':fp,'ordinal':ordinal,'policy':policy,'turn':turn,'candidate':eid})+'\n')
    require(all(counts.values()),'both_target_classes_required')
    support=sum(bool(Truth(raw,enc).useful) for _,_,raw in selected_records(root,'validation','select'))
    require(support>0,'validation_positive_support_required')
    write_json(root/'frequency.json',frequency)
    result={'pairs':pairs,'prefixes':len(prefixes),'target_counts':{str(k):v for k,v in counts.items()},'positive_validation_cases':support,
            'features_sha256':file_hash(root/'pairs-features.jsonl'),'targets_sha256':file_hash(root/'pairs-targets.jsonl'),
            'lineage_sha256':file_hash(root/'pair-lineage.jsonl')}
    write_json(root/'pairs.json',result)
    return result


def hasher(p):
    from sklearn.feature_extraction import FeatureHasher
    f=p['ranking_model']['features']
    return FeatureHasher(n_features=f['n_features'],input_type=f['input_type'],alternate_sign=f['alternate_sign'],dtype=np.float32)


def estimator(p,alpha):
    from sklearn.linear_model import SGDClassifier
    m=p['ranking_model']
    return SGDClassifier(**{k:m[k] for k in ('loss','penalty','average','fit_intercept','learning_rate','class_weight','tol','early_stopping','n_jobs','random_state','shuffle')},alpha=alpha)


def batches(root,p):
    from itertools import zip_longest
    features=[];targets=[]
    with (root/'pairs-features.jsonl').open(encoding='utf-8') as x, (root/'pairs-targets.jsonl').open(encoding='utf-8') as y:
        for feature,target in zip_longest(x,y):
            require(feature is not None and target is not None,'pair_alignment')
            tokens=json.loads(feature);label=json.loads(target)
            require(isinstance(tokens,list) and all(isinstance(t,str) for t in tokens) and type(label) is int and label in (0,1),'pair_shape')
            features.append(tokens);targets.append(label)
            if len(features)==p['prefixes']['batch_pairs']:
                yield features,np.array(targets,dtype=np.int64);features=[];targets=[]
    if features:yield features,np.array(targets,dtype=np.int64)


def fit_grid(root,p,mode,factory=None):
    require(factory is None or mode=='fictional_preflight','official_factory_override_forbidden')
    require(read_json(root/'run.json')['mode']==mode,'fit_mode_mismatch')
    pairs=read_json(root/'pairs.json')
    require(all(pairs['target_counts'][str(k)]>0 for k in (0,1)),'both_target_classes_required')
    require(all(file_hash(root/name)==pairs[key] for name,key in
                [('pairs-features.jsonl','features_sha256'),('pairs-targets.jsonl','targets_sha256'),('pair-lineage.jsonl','lineage_sha256')]),'pair_artifact_changed')
    factory=factory or estimator;h=hasher(p);results=[]
    try:
        for alpha in p['ranking_model']['alpha_grid']:
            model=factory(p,alpha);start=time.monotonic();warning_counts={};steps=0
            for epoch in range(p['ranking_model']['epochs']):
                for tokens,labels in batches(root,p):
                    with warnings.catch_warnings(record=True) as caught:
                        warnings.simplefilter('always')
                        model.partial_fit(h.transform(tokens),labels,classes=np.array([0,1]))
                    for warning in caught:
                        key=warning.category.__name__;warning_counts[key]=warning_counts.get(key,0)+1
                    require(np.isfinite(model.coef_).all() and np.isfinite(model.intercept_).all(),'nonfinite_fit')
                    steps+=1
            require(steps>0,'empty_fit_stream')
            name=f'model-{alpha}.pkl'
            with (root/name).open('xb') as stream:pickle.dump(model,stream,protocol=5)
            results.append({'alpha':alpha,'artifact':name,'sha256':file_hash(root/name),'steps':steps,'epochs':3,
                            'seconds':round(time.monotonic()-start,6),'warnings':warning_counts,'status':'complete'})
        write_json(root/'fit-results.json',results)
        require(all(file_hash(root/name)==pairs[key] for name,key in
                    [('pairs-features.jsonl','features_sha256'),('pairs-targets.jsonl','targets_sha256'),('pair-lineage.jsonl','lineage_sha256')]),'pair_artifact_changed')
    except Exception as exc:
        write_json(root/'fit-failure.json',{'exception_type':type(exc).__name__,'completed':results,'test_access_permitted':False})
        raise
    return results


class Policy:
    """Contains only frozen public settings, aggregate train priors or fitted weights."""
    def __init__(self,name,p,frequency=None,model=None):
        self.name,self.p,self.frequency,self.model=name,p,frequency,model
        self.h=hasher(p) if name=='ranker' else None

    def __call__(self,view):
        eligible=ref.eligible_questions(view,self.p)
        if not eligible:return None
        if self.name=='lexical':return eligible[0]
        if self.name=='random-eligible':return ref.random_question(view,self.p)
        if self.name=='training-frequency':return min(eligible,key=lambda eid:(-self.frequency.get(eid,0),eid))
        require(self.name=='ranker','unsupported_policy')
        scores=np.asarray(self.model.decision_function(self.h.transform(tokens_many(view,eligible,self.p))))
        require(scores.shape==(len(eligible),) and np.isfinite(scores).all(),'nonfinite_or_invalid_scores')
        return eligible[int(np.argmax(scores))]  # eligible is lexical, hence exact-score ties are lexical.


def trajectory(raw,source,catalogue,p,selector,partition):
    truth=Truth(raw,Encoding(source,p));interview=OfflineCase(raw,catalogue,partition).start(disclose_demographics=True,question_budget=20)
    trace=[];curve=[[]];invalid=repeat=0;stop=None
    while len(trace)<20:
        view=interview.view();eligible=ref.eligible_questions(view,p)
        if view['contradictions']:stop='unresolved_contradiction';break
        if not eligible:stop='no_eligible_question';break
        question=selector(copy.deepcopy(view))
        if question not in eligible:
            invalid=1;repeat=int(question in view['asked_questions'] or question==raw['INITIAL_EVIDENCE'])
            stop='invalid_policy_output';break
        interview.ask(question)
        event=next(a for a in interview.view()['revealed_answers'] if a['evidence_id']==question)
        trace.append({'id':question,'type':source[question]['data_type'],'state':event['state'],'value':event['value'],
                      'useful':truth.target(question),'encoded':int(question in truth.encoded)})
        curve.append([e['id'] for e in trace if e['useful']])
    stop=stop or 'question_budget'
    while len(curve)<21:curve.append(list(curve[-1]))
    by_type={kind:{'useful_ids':sorted(eid for eid in truth.useful if source[eid]['data_type']==kind),
                   'encoded_ids':sorted(eid for eid in truth.encoded if source[eid]['data_type']==kind)} for kind in ('B','C','M')}
    age=raw['AGE'];band='under_1' if age<1 else '1_to_4' if age<5 else '5_to_17' if age<18 else '18_to_64' if age<65 else '65_plus'
    fraction=1-(len(set(truth.answers)-set(ref.ORPHANS))/218)
    missing='[0,0.90)' if fraction<.9 else '[0.90,0.95)' if fraction<.95 else '[0.95,1]'
    return {'trace':trace,'curve':curve,'useful_denominator':len(truth.useful),'encoded_denominator':len(truth.encoded),
            'types':by_type,'unreachable':len(truth.unreachable),'quarantined':truth.quarantined,
            'invalid':invalid,'repeat':repeat,'stop':stop,'groups':{'age':band,'sex':raw['SEX'],'missingness':missing}}
