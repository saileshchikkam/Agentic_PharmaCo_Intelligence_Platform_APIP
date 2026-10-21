"""Deterministic cached-trajectory metrics and paired fingerprint-cluster uncertainty."""
from collections import Counter
import numpy as np

from ..validation import require

KEYS=['n','asked_interviews','positive','denominator','encoded_denominator','cost20','unknown','default','invalid','repeat',
      'curve_sum','unreachable','quarantined','stop_budget','stop_empty','stop_conflict','stop_invalid']
for b in (5,10,20):KEYS += [f'macro{b}',f'hits{b}',f'encoded{b}',f'cost{b}']
I={key:i for i,key in enumerate(KEYS)}


def vector(result,kind=None):
    trace=result['trace']; selected=[e for e in trace if kind is None or e['type']==kind]
    denominator=result['useful_denominator'] if kind is None else len(result['types'][kind]['useful_ids'])
    encoded=result['encoded_denominator'] if kind is None else len(result['types'][kind]['encoded_ids'])
    v=np.zeros(len(KEYS),dtype=np.float64)
    values={'n':1,'asked_interviews':int(bool(selected)),'positive':int(denominator>0),'denominator':denominator,'encoded_denominator':encoded,
            'cost20':len(selected),'unknown':sum(e['state']=='unknown' for e in selected),
            'default':sum(e['state']=='confirmed' and not e['useful'] for e in selected),
            'invalid':result['invalid'] if kind is None else 0,'repeat':result['repeat'] if kind is None else 0,
            'unreachable':result['unreachable'] if kind is None else 0,'quarantined':result['quarantined'] if kind is None else 0}
    stop={'question_budget':'stop_budget','no_eligible_question':'stop_empty',
          'unresolved_contradiction':'stop_conflict','invalid_policy_output':'stop_invalid'}
    values[stop[result['stop']]]=1
    for b in (5,10,20):
        prefix=[e for e in trace[:b] if kind is None or e['type']==kind]
        hits=sum(e['useful'] for e in prefix)
        values.update({f'macro{b}':hits/denominator if denominator else 0,f'hits{b}':hits,
                       f'encoded{b}':sum(e['encoded'] for e in prefix),f'cost{b}':len(prefix)})
    values['curve_sum']=sum(sum(e['useful'] for e in trace[:b] if kind is None or e['type']==kind)/denominator
                            for b in range(1,21))/20 if denominator else 0
    for key,value in values.items():v[I[key]]=value
    return v


def point(v):
    def ratio(a,b):return float(v[I[a]]/v[I[b]]) if v[I[b]] else None
    out={}
    for b in (5,10,20):
        out[f'macro_recall@{b}']=ratio(f'macro{b}','positive')
        out[f'micro_recall@{b}']=ratio(f'hits{b}','denominator')
        out[f'useful_yield@{b}']=ratio(f'hits{b}',f'cost{b}')
        out[f'encoded_coverage@{b}']=ratio(f'encoded{b}','encoded_denominator')
        out[f'mean_questions@{b}']=ratio(f'cost{b}','n')
    out.update(curve_mean=ratio('curve_sum','positive'),unknown_rate=ratio('unknown','cost20'),
               default_rate=ratio('default','cost20'))
    attempts=v[I['cost20']]+v[I['invalid']]
    out['invalid_rate']=float(v[I['invalid']]/attempts) if attempts else None
    out['repeat_rate']=float(v[I['repeat']]/attempts) if attempts else None
    return out


def aggregate(rows,kind=None):
    v=sum((vector(r,kind) for r in rows),np.zeros(len(KEYS)))
    return {'support':{key:int(v[I[key]]) for key in ('n','positive','cost20','unreachable','quarantined')},'metrics':point(v)}


def paired_report(cube,names,p,subgroup=False,question_type=False):
    """cube[cluster,policy,stat]; each cluster already sums original row multiplicity."""
    require(cube.ndim==3 and cube.shape[0]>0 and cube.shape[1]==len(names),'bootstrap_shape')
    total=cube.sum(axis=0);stats=[point(v) for v in total]
    supported=[not subgroup or (v[I['asked_interviews' if question_type else 'n']]>=50 and v[I['positive']]>=20) for v in total]
    result={name:{'support':{key:int(v[I[key]]) for key in ('n','asked_interviews','positive','cost20','unreachable','quarantined')},
                  'stops':{key:int(v[I[key]]) for key in ('stop_budget','stop_empty','stop_conflict','stop_invalid')},
                  'zero_denominator_cases':int(v[I['n']]-v[I['positive']]),
                  'metrics':stats[j] if supported[j] else {key:None for key in stats[j]},
                  'rates_suppressed':not supported[j],'intervals':{}}
            for j,(name,v) in enumerate(zip(names,total))}
    if not any(supported):return {'clusters':len(cube),'policies':result,'paired_ranker_minus_baseline':{}}
    u=p['evaluation']['uncertainty'];rng=np.random.default_rng(u['seed'])
    draws={name:{key:[] for key in stats[j]} for j,name in enumerate(names)}
    diffs={name:{key:[] for key in stats[0]} for name in names if name!='ranker'} if 'ranker' in names else {}
    for _ in range(u['replicates']):
        weights=np.bincount(rng.integers(0,len(cube),size=len(cube)),minlength=len(cube))
        values=np.einsum('g,gpm->pm',weights,cube,optimize=False)
        metrics=[point(v) for v in values]
        for j,name in enumerate(names):
            if not supported[j]:continue
            for key,value in metrics[j].items():
                if value is not None:draws[name][key].append(value)
        if 'ranker' in names:
            r=names.index('ranker')
            for j,name in enumerate(names):
                if name=='ranker' or not (supported[r] and supported[j]):continue
                for key,a in metrics[r].items():
                    b=metrics[j][key]
                    if a is not None and b is not None:diffs[name][key].append(a-b)
    def interval(values):
        return {'valid_replicates':len(values),'interval':np.percentile(values,[2.5,97.5]).tolist()
                if len(values)>=u['minimum_valid_replicates'] else None}
    for name in names:result[name]['intervals']={key:interval(values) for key,values in draws[name].items()}
    differences={name:{key:interval(values) for key,values in metrics.items()} for name,metrics in diffs.items()}
    return {'clusters':len(cube),'policies':result,'paired_ranker_minus_baseline':differences}
