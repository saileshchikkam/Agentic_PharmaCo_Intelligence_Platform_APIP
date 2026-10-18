"""Aggregate retrospective metrics from cached predictions, never estimator fitting."""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import (average_precision_score, balanced_accuracy_score, confusion_matrix,
    f1_score, fbeta_score, log_loss, precision_recall_fscore_support, roc_auc_score)

from .data import VITALS, age_groups, symptom_mask


def ratio(n, d):
    return float(n/d) if d else None


def reliability(y, probabilities, weights=None):
    y, p = np.asarray(y), np.asarray(probabilities)
    w = np.ones(len(y)) if weights is None else np.asarray(weights, dtype=float)
    bins = np.minimum((p*10).astype(int), 9)
    rows, ece = [], 0.
    for b in range(10):
        m = bins == b
        mass = float(w[m].sum())
        actual = float(np.average(y[m], weights=w[m])) if mass else None
        predicted = float(np.average(p[m], weights=w[m])) if mass else None
        rows.append({'bin': b, 'rows': int(m.sum()), 'weight': mass, 'observed': actual, 'predicted': predicted})
        if mass:
            ece += mass / w.sum() * abs(actual-predicted)
    return {'ECE': float(ece), 'bins': rows}


def binary_metrics(immedr, probabilities, threshold, weights=None):
    raw, p = np.asarray(immedr), np.asarray(probabilities)
    y, pred = raw <= 2, p >= threshold
    w = np.ones(len(y)) if weights is None else np.asarray(weights, dtype=float)
    cm = confusion_matrix(y, pred, labels=[False, True], sample_weight=w)
    tn, fp, fn, tp = cm.ravel()
    immediate = raw == 1
    return {'rows': len(y), 'confusion': cm.tolist(), 'high_support': int(y.sum()),
            'high_missed': int((y & ~pred).sum()), 'high_recall': ratio(tp, tp+fn), 'high_miss_rate': ratio(fn,tp+fn),
            'Immediate_support': int(immediate.sum()), 'Immediate_missed': int((immediate & ~pred).sum()),
            'Immediate_recall': ratio(w[immediate & pred].sum(), w[immediate].sum()),
            'precision': ratio(tp,tp+fp), 'specificity': ratio(tn,tn+fp),
            'F2': float(fbeta_score(y,pred,beta=2,zero_division=0,sample_weight=weights)),
            'average_precision': float(average_precision_score(y,p,sample_weight=weights)) if y.any() and (~y).any() else None,
            'ROC_AUC': float(roc_auc_score(y,p,sample_weight=weights)) if y.any() and (~y).any() else None,
            'balanced_accuracy': ratio((ratio(tp,tp+fn) or 0)+(ratio(tn,tn+fp) or 0),2) if y.any() and (~y).any() else None,
            'Brier': float(np.average((p-y)**2,weights=w)),
            'log_loss': float(log_loss(y,np.column_stack([1-p,p]),labels=[False,True],sample_weight=weights)),
            'reliability': reliability(y,p,weights)}


def secondary_metrics(immedr, probabilities, weights=None):
    y, p = np.asarray(immedr,dtype=int), np.asarray(probabilities)
    pred = np.argmax(p,axis=1)+1
    w = np.ones(len(y)) if weights is None else np.asarray(weights,dtype=float)
    precision,recall,_,support = precision_recall_fscore_support(y,pred,labels=[1,2,3,4,5],zero_division=0,sample_weight=weights)
    high, immediate = y<=2, y==1
    cm=confusion_matrix(y,pred,labels=[1,2,3,4,5],sample_weight=weights)
    per_class={str(i):{'precision':float(precision[i-1]),'recall':float(recall[i-1]) if support[i-1] else None,
                       'support':float(support[i-1])} for i in range(1,6)}
    return {'rows':len(y),'confusion':cm.tolist(),'per_class':per_class,
            'macro_F1':float(f1_score(y,pred,labels=[1,2,3,4,5],average='macro',zero_division=0,sample_weight=weights)),
            'balanced_accuracy':float(np.mean([recall[i] for i in range(5) if support[i]])),
            'undertriage_count':int((pred>y).sum()),'undertriage_rate':float(np.average(pred>y,weights=w)),
            'severe_undertriage_count':int((pred-y>=2).sum()),'severe_undertriage_rate':float(np.average(pred-y>=2,weights=w)),
            'high_support':int(high.sum()),'high_missed':int((high & (pred>2)).sum()),
            'high_recall':ratio(w[high & (pred<=2)].sum(),w[high].sum()),
            'Immediate_support':int(immediate.sum()),'Immediate_missed':int((immediate & (pred!=1)).sum()),
            'Immediate_recall':ratio(w[immediate & (pred==1)].sum(),w[immediate].sum()),
            'log_loss':float(log_loss(y,p,labels=[1,2,3,4,5],sample_weight=weights)),
            'Brier':float(np.average(np.sum((p-np.eye(5)[y-1])**2,axis=1),weights=w)),
            'reliability':{str(i):reliability(y==i,p[:,i-1],weights) for i in range(1,6)},
            'probabilities_calibrated':False}


def abstention_metrics(immedr, probabilities, threshold, mask, binary):
    y=np.asarray(immedr);mask=np.asarray(mask,dtype=bool)
    pred_high=probabilities>=threshold if binary else np.argmax(probabilities,axis=1)+1<=2
    high=y<=2
    wrong=(pred_high!=high) if binary else (np.argmax(probabilities,axis=1)+1!=y)
    return {'abstained':int(mask.sum()),'coverage':float((~mask).mean()),'high_acuity_abstained':int((mask & high).sum()),
            'unconditional_high_detection':ratio((~mask & high & pred_high).sum(),high.sum()),
            'selective_error':ratio((~mask & wrong).sum(),(~mask).sum()),
            'unconditional_high_missed_or_abstained':int((high & (mask | ~pred_high)).sum())}


def subgroup_report(frame, audit_vitals, probabilities, threshold, binary, config):
    settings=config['evaluation']
    sex=frame.SEX.mask(frame.SEXFL.ne(0)).astype('Int64').astype('string').fillna('unknown')
    def original(c):
        return frame[c].mask(frame[c]<0).astype('Int64').astype('string').fillna('unknown')
    groups={'age':age_groups(frame),'sex':sex,'original_race':original('RACEUN'),'original_ethnicity':original('ETHUN'),
            'vitals_missing_count':audit_vitals[VITALS].isna().sum(axis=1).astype('string'),
            'symptom_module':symptom_mask(frame).map({True:'symptom',False:'other'})}
    out={}
    for attribute, values in groups.items():
        out[attribute]={}
        for value in sorted(values.unique()):
            mask=values.eq(value).to_numpy()
            y=frame.IMMEDR.to_numpy()[mask]
            metrics=binary_metrics(y,probabilities[mask],threshold) if binary else secondary_metrics(y,probabilities[mask])
            supports=[int((y<=2).sum())] if binary else [int((y==i).sum()) for i in range(1,6)]
            stable=len(y)>=settings['sparse_subgroup_minimum_rows'] and min(supports)>=settings['sparse_subgroup_minimum_positive']
            counts={k:v for k,v in metrics.items() if k in ['rows','confusion','high_support','high_missed','Immediate_support','Immediate_missed','undertriage_count','severe_undertriage_count']}
            counts['unstable_or_sparse']=not stable
            if stable:
                counts['comparative_metrics']={k:metrics[k] for k in (['high_recall','F2','Brier'] if binary else ['macro_F1','undertriage_rate'])}
            out[attribute][str(value)]=counts
    return out


def bootstrap_cohort(frame, cached, binary, config):
    """Same stratified cluster draws for every family/profile; never resample individual visits."""
    design=frame[['CSTRATM','CPSUM']]
    strata={s:design.loc[design.CSTRATM.eq(s),'CPSUM'].unique() for s in design.CSTRATM.unique()}
    singleton=sum(len(c)<2 for c in strata.values())
    if singleton:
        return {'requested_replicates':1000,'generated_replicates':0,'singleton_strata':singleton,
                'status':'intervals_suppressed_singleton_strata','intervals':{},'paired_differences':{}}
    rng=np.random.default_rng(43)
    metrics=['high_recall','Immediate_recall','precision','F2','average_precision','ROC_AUC','Brier','log_loss'] if binary else ['macro_F1','balanced_accuracy','high_recall','Immediate_recall','undertriage_rate','severe_undertriage_rate','Brier','log_loss']
    arrays={key:{m:[] for m in metrics} for key in cached}
    for _ in range(1000):
        indices=[]
        for s, clusters in strata.items():
            for cluster in rng.choice(clusters,size=len(clusters),replace=True):
                indices.extend(np.flatnonzero((design.CSTRATM.to_numpy()==s)&(design.CPSUM.to_numpy()==cluster)))
        indices=np.asarray(indices)
        y=frame.IMMEDR.to_numpy()[indices]
        for key,item in cached.items():
            scores=binary_metrics(y,item['probabilities'][indices],item['threshold']) if binary else secondary_metrics(y,item['probabilities'][indices])
            for metric in metrics: arrays[key][metric].append(scores.get(metric))
    minimum=config['evaluation']['minimum_valid_bootstrap_replicates']
    def interval(values):
        valid=np.array([v for v in values if v is not None and np.isfinite(v)])
        return {'valid_replicates':len(valid),'interval_95':np.quantile(valid,[.025,.975]).tolist() if len(valid)>=minimum else None}
    intervals={key:{m:interval(values) for m,values in rows.items()} for key,rows in arrays.items()}
    paired={}
    keys=list(cached)
    for i,a in enumerate(keys):
        for b in keys[i+1:]:
            # Only matched family or matched profile differences, not confounded cross changes.
            if cached[a]['family']!=cached[b]['family'] and cached[a]['profile']!=cached[b]['profile']: continue
            paired[a+' minus '+b]={m:interval([va-vb if va is not None and vb is not None else None
                                            for va,vb in zip(arrays[a][m],arrays[b][m])]) for m in metrics}
    return {'requested_replicates':1000,'generated_replicates':1000,'singleton_strata':0,
            'status':'exploratory_cluster_intervals_not_national_survey_variance','intervals':intervals,'paired_differences':paired}
