"""Validation selection, immutable pre-test seals, single-use ledger and private caches."""
from contextlib import closing
import json
import pickle
import platform
import time

import numpy as np

from .. import questioning_protocol as ref
from ..validation import read_json, require
from ..storage import external_path
from .data import (database,file_hash,write_json,implementation_hashes,selected_records,Encoding)
from .flow import Policy,trajectory
from .metrics import vector,point,paired_report

NAMES=['lexical','random-eligible','training-frequency','ranker']


def load_models(root,p):
    require(not (root/'fit-failure.json').exists(),'failed_fit_blocks_test')
    results=read_json(root/'fit-results.json')
    require([r['alpha'] for r in results]==p['ranking_model']['alpha_grid'] and
            all(r['status']=='complete' and file_hash(root/r['artifact'])==r['sha256'] for r in results),'incomplete_fit_grid')
    # Only trusted local artifacts created by this run may be unpickled, after their hashes match.
    models={}
    for r in results:
        require('/' not in r['artifact'] and '\\' not in r['artifact'],'unsafe_model_artifact')
        with (root/r['artifact']).open('rb') as stream:models[r['alpha']]=pickle.load(stream)
    return models


def choose(scores,p):
    require(len(scores)==len(p['ranking_model']['alpha_grid']) and
            [s['alpha'] for s in scores]==p['ranking_model']['alpha_grid'],'selection_grid')
    best=None;tol=p['selection']['tie_tolerance']
    for score in scores:
        require(score['positive_cases']>0 and all(np.isfinite(score[k]) for k in ('recall20','recall10','yield20')),'validation_support_or_nonfinite')
        if best is None:best=score;continue
        for key in ('recall20','recall10','yield20'):
            delta=score[key]-best[key]
            if abs(delta)>tol:
                if delta>0:best=score
                break
        else:
            if score['alpha']>best['alpha']:best=score
    return best['alpha']


def validation_select(dataset,root,p):
    models=load_models(root,p);scores=[]
    for alpha,model in models.items():
        v=None
        selector=Policy('ranker',p,model=model)
        for _,_,raw in selected_records(root,'validation','select'):
            entry=vector(trajectory(raw,dataset.source,dataset.catalogue,p,selector,'validation'))
            v=entry if v is None else v+entry
        require(v is not None,'validation_positive_support_required')
        from .metrics import I
        m=point(v);require(v[I['positive']]>0,'validation_positive_support_required')
        scores.append({'alpha':alpha,'recall20':m['macro_recall@20'],'recall10':m['macro_recall@10'],
                       'yield20':m['useful_yield@20'],'positive_cases':int(v[I['positive']])})
    result={'partition':'validation','training_overlap_excluded':True,'scores':scores,'selected_alpha':choose(scores,p),
            'model_refitted_after_selection':False}
    write_json(root/'selection.json',result);return result


def policies(root,p):
    models=load_models(root,p);selection=read_json(root/'selection.json');frequency=read_json(root/'frequency.json')
    return {name:Policy(name,p,frequency=frequency,model=models[selection['selected_alpha']] if name=='ranker' else None) for name in NAMES}


def cache_partition(dataset,root,p,partition):
    require(partition in ('validation','test'),'evaluation_partition')
    selectors=policies(root,p);enc=Encoding(dataset.source,p);count=0
    cache=database(root/f'{partition}-trajectories.sqlite')
    try:
        cache.execute('CREATE TABLE trajectories(fp TEXT,ordinal INTEGER,keep INTEGER,policy TEXT,result TEXT,PRIMARY KEY(ordinal,policy)) WITHOUT ROWID')
        cache.execute('CREATE INDEX trajectory_groups ON trajectories(fp,ordinal,policy)')
        with closing(database(root/'training-reference.sqlite',True)) as reference, closing(database(root/'cohorts.sqlite',True)) as cohort:
            iterator=((ordinal,fp,bool(keep),json.loads(raw)) for ordinal,fp,keep,raw in cohort.execute(
                'SELECT ordinal,fp,keep,raw FROM records WHERE partition=? ORDER BY ordinal',('validation',))) if partition=='validation' else (
                    (ordinal,enc.fingerprint(raw),None,raw) for ordinal,raw in enumerate(dataset.records('test')))
            for ordinal,fp,keep,raw in iterator:
                if keep is None:keep=reference.execute('SELECT 1 FROM groups WHERE fp=?',(fp,)).fetchone() is None
                for name,selector in selectors.items():
                    result=trajectory(raw,dataset.source,dataset.catalogue,p,selector,partition)
                    cache.execute('INSERT INTO trajectories VALUES(?,?,?,?,?)',(fp,ordinal,int(keep),name,json.dumps(result,allow_nan=False,separators=(',',':'))))
                count+=1
                if count%1000==0:cache.commit()
        require(count==dataset.counts[partition],'evaluation_count_mismatch')
        cache.commit()
    finally:cache.close()
    return {'partition':partition,'cases':count,'policy_trajectories':count*len(NAMES),'cache_sha256':file_hash(root/f'{partition}-trajectories.sqlite')}


def cached_report(root,partition,p):
    """Only cached trajectories are read. Source records and selectors are never replayed."""
    names=NAMES;groups=[];current=None;matrix=None;metadata=None;keep=None;per_ordinal={}
    def finish():
        if current is not None:groups.append((keep,metadata,matrix))
    with closing(database(root/f'{partition}-trajectories.sqlite',True)) as cache:
        for fp,ordinal,k,name,raw in cache.execute('SELECT fp,ordinal,keep,policy,result FROM trajectories ORDER BY fp,ordinal,policy'):
            r=json.loads(raw)
            if fp!=current:
                finish();current=fp;matrix=np.zeros((4,len(names),len(vector(r))));metadata=r['groups'];keep=bool(k)
            require(keep==bool(k) and metadata==r['groups'],'cluster_metadata_changed')
            j=names.index(name)
            for t,kind in enumerate((None,'B','C','M')):matrix[t,j]+=vector(r,kind)
        finish()
    require(groups,'empty_trajectory_cache')
    result={'partition':partition,'mode':read_json(root/'run.json')['mode'],'source_memberships_changed':False,
            'derived_from_same_cache':True,'clinical_accuracy':False,'reports':{}}
    if partition=='test':
        with closing(database(root/'cohorts.sqlite',True)) as cohort:
            # Fingerprints never leave the private SQLite join or appear in aggregate reports.
            with closing(database(root/'test-trajectories.sqlite',True)) as cache:
                count=cases=0
                for fp,n in cache.execute('SELECT fp,count(DISTINCT ordinal) FROM trajectories WHERE keep=1 GROUP BY fp'):
                    if cohort.execute('SELECT 1 FROM validation_groups WHERE fp=?',(fp,)).fetchone():count+=1;cases+=n
            result['residual_nontraining_validation_test_overlap']={'groups':count,'test_cases':cases,'independence_claim':False}
    for view in ('full_original_partition','training_overlap_excluded_sensitivity'):
        selected=[g for g in groups if view=='full_original_partition' or g[0]]
        if not selected:
            result['reports'][view]={'cases':0,'status':'empty_sensitivity','metrics':None};continue
        cube=np.stack([g[2] for g in selected])
        overall=paired_report(cube[:,0],names,p)
        subgroups={}
        for dimension in ('age','sex','missingness'):
            values={'age':p['evaluation']['subgroups']['age_bands'],'sex':p['evaluation']['subgroups']['source_sex'],
                    'missingness':p['evaluation']['subgroups']['oracle_unencoded_active_fraction_bins']}[dimension]
            for value in values:
                indexes=[i for i,g in enumerate(selected) if g[1][dimension]==value]
                subgroups[dimension+'='+value]=paired_report(cube[indexes,0],names,p,subgroup=True) if indexes else {'status':'no_cases','cases':0,'rates':None}
        for t,kind in enumerate(('B','C','M'),1):subgroups['question_type='+kind]=paired_report(cube[:,t],names,p,subgroup=True,question_type=True)
        result['reports'][view]={'overall':overall,'subgroups':subgroups}
    return result


def seal(root,p):
    require(not any((root/name).exists() for name in ('test-started.json','test-aggregate.json','test-trajectories.sqlite')),'test_already_opened')
    models=load_models(root,p);selection=read_json(root/'selection.json')
    require(selection['selected_alpha']==choose(selection['scores'],p),'selection_changed')
    require(set(models)==set(p['ranking_model']['alpha_grid']),'incomplete_fit_grid')
    run=read_json(root/'run.json')
    reference=read_json(root/'training-reference.json');pairs=read_json(root/'pairs.json');cohort=read_json(root/'cohorts.json')
    require(reference['reference_sha256']==file_hash(root/'training-reference.sqlite'),'training_reference_changed')
    require(cohort['cohorts_sha256']==file_hash(root/'cohorts.sqlite'),'cohort_changed')
    require(all(file_hash(root/name)==pairs[key] for name,key in
                [('pairs-features.jsonl','features_sha256'),('pairs-targets.jsonl','targets_sha256'),('pair-lineage.jsonl','lineage_sha256')]),'pair_artifact_changed')
    require(run['implementation']==implementation_hashes() and run['protocol_sha256']==file_hash(ref.PROTOCOL),'implementation_or_protocol_changed')
    names=['run.json','training-reference.sqlite','training-reference.json','cohorts.sqlite','cohorts.json','pairs-features.jsonl',
           'pairs-targets.jsonl','pair-lineage.jsonl','pairs.json','frequency.json','fit-results.json','selection.json',
           'validation-trajectories.sqlite','validation-aggregate.json']+[r['artifact'] for r in read_json(root/'fit-results.json')]
    frozen={'mode':run['mode'],'run_root':str(root.resolve()),'protocol_sha256':file_hash(ref.PROTOCOL),
            'implementation':implementation_hashes(),'source_hashes':run['source_hashes'],
            'artifacts':{name:file_hash(root/name) for name in names},'selected_alpha':selection['selected_alpha']}
    write_json(root/'pre-test-seal.json',frozen)
    write_json(root/'pre-test-seal-hash.json',{'sha256':file_hash(root/'pre-test-seal.json')})
    return frozen


def verify_seal(root,dataset,p):
    s=read_json(root/'pre-test-seal.json')
    require(file_hash(root/'pre-test-seal.json')==read_json(root/'pre-test-seal-hash.json')['sha256'],'seal_changed')
    require(s['mode']==dataset.mode and s['run_root']==str(root.resolve()),'seal_mode_or_root_changed')
    require(s['implementation']==implementation_hashes() and s['protocol_sha256']==file_hash(ref.PROTOCOL),'implementation_or_protocol_changed')
    require(s['source_hashes']==dataset.receipt,'sealed_source_changed')
    require(all(file_hash(root/name)==digest for name,digest in s['artifacts'].items()),'sealed_artifact_changed')
    require(not (root/'fit-failure.json').exists(),'failed_fit_blocks_test')
    return s


def locked_test(dataset,root,p,ledger_root):
    """Claim globally per mode+source+protocol BEFORE reading one test row. Failure poisons claim."""
    s=verify_seal(root,dataset,p)
    require(not any((root/name).exists() for name in ('test-started.json','test-trajectories.sqlite','test-aggregate.json')),'test_replay_forbidden')
    ledger=external_path(ledger_root)
    require(not ledger.is_relative_to(root) and not root.is_relative_to(ledger),'ledger_run_overlap')
    if hasattr(dataset,'loader'):
        source=dataset.loader.root
        require(not ledger.is_relative_to(source) and not source.is_relative_to(ledger),'ledger_source_overlap')
    ledger.mkdir(parents=True,exist_ok=True)
    campaign=ref.sha({'mode':dataset.mode,'sources':dataset.receipt,'protocol':file_hash(ref.PROTOCOL)})
    write_json(ledger/(campaign+'.json'),{'campaign':campaign,'seal_sha256':file_hash(root/'pre-test-seal.json'),'status':'consumed_before_first_test_row'})
    write_json(root/'test-started.json',{'campaign':campaign,'status':'attempted','seal_sha256':file_hash(root/'pre-test-seal.json')})
    cache_partition(dataset,root,p,'test')
    report=cached_report(root,'test',p)
    write_json(root/'test-aggregate.json',report)
    return report
