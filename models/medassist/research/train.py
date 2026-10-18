"""Offline Phase 3: bounded training, all-task pre-test seal, then one-shot cached evaluation."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import StratifiedGroupKFold
from threadpoolctl import threadpool_limits

from .acquire import REPO, external_root, now, sha256, write_json
from .data import load_stata
from .estimators import choose_best, grid_configurations
from .metrics import abstention_metrics, binary_metrics, bootstrap_cohort, secondary_metrics, subgroup_report
from .protocol import SPEC, load_protocol, preflight, research_matrix, task_target, validate_assignments
from .splits import connected_groups


def code_hashes():
    return {p.name:sha256(p) for p in Path(__file__).parent.glob('*.py')}


def expected_ids(config):
    return [f'{task}--{profile}--{family}' for task,rules in config['tasks'].items()
            for profile in [config['cohorts'][rules['cohort']]['without_vitals'],config['cohorts'][rules['cohort']]['with_vitals']]
            for family in config['models']]


def load_inputs(root,phase1_run,config):
    verified=preflight(root,phase1_run,config)
    phase2=json.loads((SPEC.parent/'reports/2026-10-19-phase2/preflight-final.json').read_text(encoding='utf-8'))
    if verified['protocol_sha256']!=phase2['protocol_sha256']:
        raise ValueError('Protocol differs from frozen Phase 2 evidence')
    df,_=load_stata(root/'raw/nhamcs-ed-2022/ed2022-stata.dta')
    groups=connected_groups(df)
    bundles={}
    for name,cohort in config['cohorts'].items():
        if verified['cohorts'][name]['cv_assignment_sha256']!=phase2['cohorts'][name]['cv_assignment_sha256']:
            raise ValueError('CV fingerprint differs from Phase 2')
        x=research_matrix(df,cohort['without_vitals'],config)
        frame=df.loc[x.index]
        selected_groups=groups[x.index.to_numpy()]
        records=json.loads((root/'runs'/phase1_run/(cohort['phase1_name']+'-private-assignments.json')).read_text())
        assignments=validate_assignments(frame,records,selected_groups,cohort,config)
        fit=np.flatnonzero(assignments=='fit')
        cv=StratifiedGroupKFold(n_splits=config['cv']['folds'],shuffle=True,random_state=config['cv']['seed'])
        folds=list(cv.split(np.zeros(len(fit)),frame.IMMEDR.to_numpy()[fit],selected_groups[fit]))
        signature=[{'train':frame.index[fit[a]].tolist(),'validation':frame.index[fit[b]].tolist()} for a,b in folds]
        digest=hashlib.sha256(json.dumps(signature,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        if digest!=verified['cohorts'][name]['cv_assignment_sha256']: raise ValueError('Training folds changed')
        bundles[name]={'frame':frame,'groups':selected_groups,'assignments':assignments,'folds':folds,
                       'profiles':{p:research_matrix(df,p,config) for p in [cohort['without_vitals'],cohort['with_vitals']]}}
    return verified,bundles


def run_worker(run,job,serial,timeout):
    label=f'{serial:03d}-{job["stage"]}'
    folder=run/'jobs';folder.mkdir(exist_ok=True)
    source=folder/(label+'.joblib');output=folder/(label+'.json')
    job['private_error']=str(folder/(label+'-error.txt'))
    joblib.dump(job,source,compress=3)
    env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1','MKL_NUM_THREADS':'1','NUMEXPR_NUM_THREADS':'1'}
    start=time.perf_counter()
    try:
        completed=subprocess.run([sys.executable,'-m','models.medassist.research.train_worker','--job',str(source),'--output',str(output)],
                                  cwd=REPO,env=env,capture_output=True,text=True,timeout=timeout)
        (folder/(label+'-process.log')).write_text(completed.stdout+completed.stderr,encoding='utf-8')
        if completed.returncode or not output.exists(): raise RuntimeError('Worker process failed')
        return json.loads(output.read_text(encoding='utf-8'))
    except (subprocess.TimeoutExpired,RuntimeError) as error:
        result={k:job[k] for k in ['task','profile','family','parameters','stage']}
        result.update(status='failed',error_type=type(error).__name__,warnings=[],duration_seconds=time.perf_counter()-start)
        if not output.exists(): write_json(output,result)
        return result


def seal_pretest(run,manifest,config):
    if set(manifest['models'])!=set(expected_ids(config)):
        raise ValueError('Not all required task/profile/family artifacts completed')
    if len(manifest['candidates'])!=60 or any(c['status']!='completed' for c in manifest['candidates']):
        raise ValueError('Incomplete candidate comparison blocks testing')
    expected=set()
    for key in expected_ids(config):
        task,profile,family=key.split('--')
        for params in grid_configurations(config['models'][family]['grid']):
            expected.add((task,profile,family,json.dumps(params,sort_keys=True)))
    actual=[(c['task'],c['profile'],c['family'],json.dumps(c['parameters'],sort_keys=True)) for c in manifest['candidates']]
    if len(set(actual))!=len(actual) or set(actual)!=expected:
        raise ValueError('Frozen grid coverage/uniqueness mismatch')
    for key,result in manifest['models'].items():
        if result['status']!='completed': raise ValueError('Failed final model blocks testing')
        task,profile,family=key.split('--')
        best=choose_best([c for c in manifest['candidates'] if (c['task'],c['profile'],c['family'])==(task,profile,family)],config['selection']['tie_tolerance'])
        if result['parameters']!=best['parameters'] or result['CV_mean_score']!=best['mean_score']:
            raise ValueError('Final selection differs from frozen CV rules')
        expected={'base.joblib','calibrated.joblib','private-development-predictions.joblib'} if result['task']=='primary_binary' else {'base.joblib'}
        if set(result['artifacts'])!=expected: raise ValueError('Missing final artifact')
        for name,digest in result['artifacts'].items():
            if sha256(run/'artifacts'/key/name)!=digest: raise ValueError('Artifact hash mismatch')
    if manifest['code_sha256']!=code_hashes() or manifest['protocol_sha256']!=sha256(SPEC):
        raise ValueError('Source changed during training; freeze blocked')
    manifest['sealed_at_utc']=now()
    write_json(run/'pretest-manifest.json',manifest)
    digest=sha256(run/'pretest-manifest.json')
    with (run/'pretest-manifest.sha256').open('x',encoding='ascii') as stream: stream.write(digest+'\n')
    return digest


def train(root,run,phase1_run,config):
    verified,bundles=load_inputs(root,phase1_run,config)
    run.mkdir(parents=True,exist_ok=False)
    write_json(run/'preflight.json',verified)
    manifest={'protocol_id':config['protocol_id'],'protocol_sha256':sha256(SPEC),
              'source_dta_sha256':config['source_dta_sha256'],'phase1_run':phase1_run,
              'base_git_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),
              'code_sha256':code_hashes(),'runtime':verified['runtime'],
              'requirements_sha256':sha256(SPEC.parent/'requirements-phase1.txt'),
              'split_and_CV_digests':{k:{field:v[field] for field in ['assignment_sha256','cv_assignment_sha256','phase1_assignment_file_sha256']}
                                     for k,v in verified['cohorts'].items()},
              'started_at_utc':now(),'candidates':[],'models':{},'CV_winners':{},'test_predictions_performed':False}
    serial=0;failures=[]
    for task,rules in config['tasks'].items():
        bundle=bundles[rules['cohort']]
        assignments=bundle['assignments'];frame=bundle['frame']
        y=task_target(frame,task,config)
        fit=assignments=='fit'
        for profile,X in bundle['profiles'].items():
            family_best=[]
            for family,settings in config['models'].items():
                candidates=[]
                for parameters in grid_configurations(settings['grid']):
                    serial+=1
                    job={'stage':'candidate','task':task,'profile':profile,'family':family,'parameters':parameters,
                         'config':config,'X':X.loc[fit],'y':y.loc[fit],'folds':bundle['folds']}
                    result=run_worker(run,job,serial,config['resource_limits']['candidate_timeout_minutes']*60)
                    manifest['candidates'].append(result);candidates.append(result)
                    write_json(run/'jobs'/f'{serial:03d}-record.json',result)
                    print(json.dumps({'candidate':serial,'task':task,'profile':profile,'family':family,
                                      'status':result['status'],'CV_score':result.get('mean_score')}),flush=True)
                if any(c['status']!='completed' for c in candidates):
                    failures.append(f'{task}/{profile}/{family}: incomplete candidates')
                    continue
                best=choose_best(candidates,config['selection']['tie_tolerance'])
                serial+=1
                key=f'{task}--{profile}--{family}'
                job={'stage':'final','task':task,'profile':profile,'family':family,'parameters':best['parameters'],
                     'config':config,'X':X.loc[fit],'y':y.loc[fit],'artifact_dir':str(run/'artifacts'/key)}
                (run/'artifacts').mkdir(exist_ok=True)
                if task=='primary_binary':
                    cal,threshold=assignments=='calibration',assignments=='threshold_selection'
                    job.update(cal_X=X.loc[cal],cal_y=y.loc[cal],cal_immedr=frame.IMMEDR.loc[cal].to_numpy(),
                               threshold_X=X.loc[threshold],threshold_y=y.loc[threshold])
                result=run_worker(run,job,serial,config['resource_limits']['candidate_timeout_minutes']*60)
                result['CV_mean_score']=best['mean_score'];result['CV_folds']=best['folds']
                manifest['models'][key]=result
                if result['status']!='completed': failures.append(key+': final fitting/calibration incomplete')
                else: family_best.append({'family':family,'status':'completed','mean_score':best['mean_score']})
                print(json.dumps({'final':key,'status':result['status']}),flush=True)
            if len(family_best)==3:
                manifest['CV_winners'][task+'--'+profile]=choose_best(family_best,config['selection']['tie_tolerance'])['family']
    write_json(run/'training-results.json',manifest)
    if failures:
        write_json(run/'blocked.json',{'status':'incomplete','failures':failures,'testing_performed':False,'time_utc':now()})
        print(json.dumps({'status':'incomplete','testing_performed':False,'failures':failures}),flush=True)
        return False
    digest=seal_pretest(run,manifest,config)
    print(json.dumps({'status':'pretest_sealed','pretest_sha256':digest,'testing_performed':False}),flush=True)
    return True


def verify_seal(run,config):
    manifest_file=run/'pretest-manifest.json'
    if sha256(manifest_file)!=(run/'pretest-manifest.sha256').read_text().strip(): raise ValueError('Pre-test seal mismatch')
    manifest=json.loads(manifest_file.read_text())
    if manifest['protocol_sha256']!=sha256(SPEC) or manifest['code_sha256']!=code_hashes(): raise ValueError('Code/protocol changed since pre-test freeze')
    if manifest['requirements_sha256']!=sha256(SPEC.parent/'requirements-phase1.txt'): raise ValueError('Dependency lock changed since freeze')
    if set(manifest['models'])!=set(expected_ids(config)) or manifest['test_predictions_performed']: raise ValueError('Invalid pre-test state')
    for key,result in manifest['models'].items():
        if result['status']!='completed': raise ValueError('Incomplete frozen model')
        for name,digest in result['artifacts'].items():
            if sha256(run/'artifacts'/key/name)!=digest: raise ValueError('Frozen artifact changed')
    return manifest


def evaluate(root,run,config):
    manifest=verify_seal(run,config)
    verified,bundles=load_inputs(root,manifest['phase1_run'],config)
    for name,digests in manifest['split_and_CV_digests'].items():
        if any(verified['cohorts'][name][k]!=v for k,v in digests.items()): raise ValueError('Input split changed since freeze')
    # Exclusive durable marker before any predictions: even a failed evaluation cannot silently retest.
    write_json(run/'test-started.json',{'time_utc':now(),'pretest_sha256':sha256(run/'pretest-manifest.json')})
    private=run/'private-test-predictions';private.mkdir(exist_ok=False)
    report={'pretest_sha256':sha256(run/'pretest-manifest.json'),'started_at_utc':now(),'models':{},'references':{},'uncertainty':{}}
    cache={name:{} for name in bundles}
    with threadpool_limits(limits=config['resource_limits']['CPU_threads']):
        for key,selected in manifest['models'].items():
            task,profile,family=selected['task'],selected['profile'],selected['family']
            name=config['tasks'][task]['cohort'];bundle=bundles[name]
            mask=bundle['assignments']=='locked_test';X=bundle['profiles'][profile].loc[mask];frame=bundle['frame'].loc[mask]
            audit_profile=config['cohorts'][name]['with_vitals'];audit=bundle['profiles'][audit_profile].loc[mask]
            model=joblib.load(run/'artifacts'/key/'base.joblib')
            expected_classes=[0,1] if task=='primary_binary' else [1,2,3,4,5]
            if model.classes_.tolist()!=expected_classes: raise ValueError('Frozen probability-class order mismatch')
            before=time.perf_counter();raw=model.predict_proba(X)
            binary=task=='primary_binary'
            if binary:
                calibrated=joblib.load(run/'artifacts'/key/'calibrated.joblib')
                probabilities=calibrated.predict_proba(X)[:,1]
                threshold=selected['threshold_selection']['selected']['threshold']
                metrics=binary_metrics(frame.IMMEDR,probabilities,threshold)
                extra={'uncalibrated_fixed_0_5':binary_metrics(frame.IMMEDR,raw[:,1],.5),
                       'calibrated_fixed_0_5':binary_metrics(frame.IMMEDR,probabilities,.5)}
            else:
                probabilities=raw;threshold=None
                metrics=secondary_metrics(frame.IMMEDR,probabilities);extra={}
            abstain=X.isna().all(axis=1).to_numpy() | model.named_steps['preprocess'].unseen(X)
            if binary: abstain |= (probabilities>=.4)&(probabilities<=.6)
            weights=frame.PATWT.to_numpy(dtype=float)
            if not np.isfinite(weights).all() or np.any(weights<=0): raise ValueError('Invalid survey weights')
            weighted=binary_metrics(frame.IMMEDR,probabilities,threshold,weights) if binary else secondary_metrics(frame.IMMEDR,probabilities,weights)
            result={'task':task,'profile':profile,'family':family,'threshold':threshold,'unweighted':metrics,
                    'PATWT_weighted_eligible_cohort_description':weighted,'abstention':abstention_metrics(frame.IMMEDR,probabilities,threshold,abstain,binary),
                    'subgroups':subgroup_report(frame,audit,probabilities,threshold,binary,config),
                    'prediction_seconds':time.perf_counter()-before,**extra}
            file=private/(key+'.joblib')
            joblib.dump({'source_rows':X.index.to_numpy(),'IMMEDR':frame.IMMEDR.to_numpy(),'raw':raw,
                         'probabilities':probabilities,'abstention':abstain},file,compress=3)
            result['private_prediction_sha256']=sha256(file)
            report['models'][key]=result
            cache[name][key]={'probabilities':probabilities,'threshold':threshold,'family':family,'profile':profile}
        for name,bundle in bundles.items():
            task=next(t for t,r in config['tasks'].items() if r['cohort']==name)
            binary=task=='primary_binary';fit=bundle['assignments']=='fit';test=bundle['assignments']=='locked_test'
            frame=bundle['frame'].loc[test];y=bundle['frame'].IMMEDR.loc[fit].to_numpy()
            p=float((y<=2).mean()) if binary else np.array([(y==i).mean() for i in range(1,6)])
            prior=np.full(len(frame),p) if binary else np.tile(p,(len(frame),1))
            report['references'][task]={'fit_prevalence':p if binary else p.tolist(),
                'unweighted':binary_metrics(frame.IMMEDR,prior,.5) if binary else secondary_metrics(frame.IMMEDR,prior)}
            report['uncertainty'][name]=bootstrap_cohort(frame,cache[name],binary,config)
    report['completed_at_utc']=now()
    write_json(run/'test-results.json',report)
    write_json(run/'completed.json',{'status':'completed','pretest_sha256':report['pretest_sha256'],
                                   'test_results_sha256':sha256(run/'test-results.json'),'time_utc':now()})
    print(json.dumps({'status':'locked_test_completed_once','models':len(report['models'])}),flush=True)


def publish(run,folder):
    folder=folder.resolve();allowed=SPEC.parent/'reports'
    if folder==allowed or not folder.is_relative_to(allowed): raise ValueError('Publish aggregate reports only under MedAssist reports')
    folder.mkdir(parents=True,exist_ok=False)
    # Explicit aggregate objects only. Never copy joblib, private job inputs, logs or predictions.
    for name in ['preflight.json','training-results.json','blocked.json','pretest-manifest.json','test-started.json','test-results.json','completed.json']:
        if (run/name).exists(): write_json(folder/name,json.loads((run/name).read_text()))
    write_json(folder/'aggregate-manifest.json',{'files':{p.name:sha256(p) for p in folder.glob('*.json')},
               'raw_rows_or_model_files_published':False,'pretest_seal_sha256':sha256(run/'pretest-manifest.json') if (run/'pretest-manifest.json').exists() else None})


def main():
    if sys.version_info[:2] not in [(3,11),(3,12)] or sys.prefix==sys.base_prefix: raise ValueError('Use the research Python venv')
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode',choices=['train','evaluate','publish'])
    parser.add_argument('--run-id',required=True)
    parser.add_argument('--phase1-run',default='phase1-final-20261019')
    parser.add_argument('--publish-dir',type=Path)
    args=parser.parse_args()
    if not args.run_id or not all(c.isalnum() or c in '-_' for c in args.run_id): raise ValueError('Use a unique simple run ID')
    config=load_protocol();root=external_root();run=root/'runs'/args.run_id
    if args.mode=='train':
        success=train(root,run,args.phase1_run,config)
        if not success:
            if args.publish_dir: publish(run,args.publish_dir)
            raise SystemExit(2)
    elif args.mode=='evaluate': evaluate(root,run,config)
    if args.publish_dir: publish(run,args.publish_dir)
    elif args.mode=='publish': raise ValueError('Specify --publish-dir')


if __name__=='__main__':
    main()
