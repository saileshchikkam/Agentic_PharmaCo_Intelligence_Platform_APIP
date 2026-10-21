"""One bounded, single-thread candidate/final-fit subprocess; never receives test records."""
from __future__ import annotations

import argparse
import time
import traceback
import warnings
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.exceptions import ConvergenceWarning
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import average_precision_score, f1_score
from threadpoolctl import threadpool_limits

from .acquire import external_root, sha256, write_json
from .estimators import build_pipeline, choose_threshold, object_digest
from .metrics import binary_metrics


def checked_fit(estimator, X, y):
    if hasattr(X,'index') and hasattr(y,'index') and not X.index.equals(y.index):
        raise ValueError('Feature/target row alignment mismatch')
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        estimator.fit(X,y)
    messages=[{'category':w.category.__name__,'message':str(w.message)} for w in caught]
    if any(issubclass(w.category,ConvergenceWarning) for w in caught):
        error=RuntimeError('Convergence warning blocks this declared candidate')
        error.warning_records=messages
        raise error
    return messages


def execute(job):
    start=time.perf_counter()
    result={k:job[k] for k in ['task','profile','family','parameters','stage']}
    result.update(status='running',warnings=[])
    try:
        config=job['config']
        if job['stage']=='candidate':
            folds=[]
            result['folds']=folds
            for train,valid in job['folds']:
                model=build_pipeline(job['profile'],job['family'],job['parameters'],config)
                before=time.perf_counter()
                messages=checked_fit(model,job['X'].iloc[train],job['y'].iloc[train])
                result['warnings'].extend(messages)
                probabilities=model.predict_proba(job['X'].iloc[valid])
                score=float(average_precision_score(job['y'].iloc[valid],probabilities[:,1])) if job['task']=='primary_binary' else float(f1_score(job['y'].iloc[valid],model.classes_[np.argmax(probabilities,axis=1)],labels=[1,2,3,4,5],average='macro',zero_division=0))
                if not np.isfinite(score): raise ValueError('Nonfinite CV score')
                folds.append({'score':score,'train_rows':len(train),'validation_rows':len(valid),'duration_seconds':time.perf_counter()-before})
            result.update(folds=folds,mean_score=float(np.mean([f['score'] for f in folds])))
        elif job['stage']=='final':
            model=build_pipeline(job['profile'],job['family'],job['parameters'],config)
            result['warnings'].extend(checked_fit(model,job['X'],job['y']))
            artifact=Path(job['artifact_dir']);artifact.mkdir(exist_ok=False)
            base_digest=object_digest(model)
            result['fit_rows_digest']=model.named_steps['preprocess'].fit_rows_digest_
            result['fit_rows_count']=len(job['X'])
            if job['task']=='primary_binary':
                calibrated=CalibratedClassifierCV(FrozenEstimator(model),method='sigmoid',n_jobs=1)
                result['warnings'].extend(checked_fit(calibrated,job['cal_X'],job['cal_y']))
                if object_digest(model)!=base_digest:
                    raise ValueError('Calibration mutated/refitted the base pipeline')
                calibration=calibrated.calibrated_classifiers_[0].calibrators[0]
                cal_p=calibrated.predict_proba(job['cal_X'])[:,1]
                raw_cal_p=model.predict_proba(job['cal_X'])[:,1]
                threshold_p=calibrated.predict_proba(job['threshold_X'])[:,1]
                threshold=choose_threshold(job['threshold_y'].to_numpy(),threshold_p,config)
                result['calibration']={'method':'sigmoid_frozen_pipeline','a':float(calibration.a_), 'b':float(calibration.b_),
                    'base_object_digest_before':base_digest,'base_object_digest_after':object_digest(model),
                    'diagnostic_scope':'calibration_fit_sample_not_unbiased_test',
                    'uncalibrated':binary_metrics(job['cal_immedr'],raw_cal_p,.5),
                    'calibrated':binary_metrics(job['cal_immedr'],cal_p,.5)}
                result['threshold_selection']=threshold
                joblib.dump(calibrated,artifact/'calibrated.joblib',compress=3)
                joblib.dump({'calibration_rows':job['cal_X'].index.to_numpy(),'raw_calibration':raw_cal_p,
                             'calibrated_calibration':cal_p,'threshold_rows':job['threshold_X'].index.to_numpy(),
                             'calibrated_threshold':threshold_p},artifact/'private-development-predictions.joblib',compress=3)
            joblib.dump(model,artifact/'base.joblib',compress=3)
            result['artifacts']={p.name:sha256(p) for p in artifact.iterdir() if p.is_file()}
        else:
            raise ValueError('Unexpected worker stage')
        result['status']='completed'
    except Exception as error:
        result.update(status='failed',error_type=type(error).__name__)
        result['warnings'].extend(getattr(error,'warning_records',[]))
        # Full debugging information is private; public results contain no traceback or machine paths.
        Path(job['private_error']).write_text(traceback.format_exc(),encoding='utf-8')
    result['duration_seconds']=time.perf_counter()-start
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--job',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    root=external_root()/'runs'
    if not args.job.resolve().is_relative_to(root) or not args.output.resolve().is_relative_to(root):
        raise ValueError('Worker inputs/outputs must be trusted local research-run files')
    job=joblib.load(args.job)
    with threadpool_limits(limits=job['config']['resource_limits']['CPU_threads']):
        result=execute(job)
    write_json(args.output,result)


if __name__=='__main__':
    main()
