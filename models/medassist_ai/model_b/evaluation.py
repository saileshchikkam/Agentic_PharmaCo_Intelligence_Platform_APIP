"""Deterministic research metrics. Never emits care recommendations."""
import math
from .data import ReadinessError


class EDResearchEvaluator:
    """Separate five-class, unweighted visit-level diagnostics; no care decisions.

    The four-class ModelEvaluator and its release/clinical gates below are unchanged.
    """
    def evaluate(self, targets, probabilities, *, abstention_threshold=0.6, bins=10):
        import numpy as np
        from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
        codes = ('1', '2', '3', '4', '5')
        p = np.asarray(probabilities, dtype=float)
        if (not targets or p.shape != (len(targets), 5) or not set(targets) <= set(codes)
                or not np.isfinite(p).all() or (p < 0).any() or (p > 1).any()
                or not np.allclose(p.sum(axis=1), 1, atol=1e-8, rtol=0)
                or not 0 <= abstention_threshold <= 1 or type(bins) is not int or bins < 1):
            raise ReadinessError('INVALID_ED_RESEARCH_EVALUATION')
        truth = np.asarray([codes.index(t) for t in targets])
        best = p.argmax(axis=1)
        predictions = [codes[i] for i in best]
        precision, recall, f1, support = precision_recall_fscore_support(
            targets, predictions, labels=list(codes), zero_division=0)
        confidence = p.max(axis=1)
        bucket_rows = []
        for i in range(bins):
            mask = np.minimum((confidence*bins).astype(int), bins-1) == i
            if mask.any():
                bucket_rows.append({'lower': i/bins, 'upper': (i+1)/bins, 'n': int(mask.sum()),
                    'mean_confidence': float(confidence[mask].mean()),
                    'accuracy': float((best[mask] == truth[mask]).mean())})
        accepted = confidence >= abstention_threshold
        selective = np.where(accepted, best, 5)
        selective_matrix = [[int(((truth == i) & (selective == j)).sum()) for j in range(6)] for i in range(5)]
        severe = {}
        for index in (0, 1):
            mask = truth == index
            n = int(mask.sum())
            severe[codes[index]] = {'support': n, 'correct': int((mask & (best == truth)).sum()),
                'predicted_less_acute': int((mask & (best > truth)).sum()),
                'underclassified_by_at_least_two_levels': int((mask & (best-truth >= 2)).sum()),
                'abstained_at_fixed_threshold': int((mask & ~accepted).sum()),
                'accepted_less_acute': int((mask & accepted & (best > truth)).sum())}
        return {'scope': 'unweighted source-label prediction, offline research only', 'class_order': list(codes),
            'n': len(targets), 'accuracy': float(accuracy_score(targets, predictions)),
            'macro_f1': float(f1.mean()), 'balanced_accuracy': float(recall.mean()),
            'per_class': {c: {'precision': float(precision[i]), 'recall': float(recall[i]),
                'f1': float(f1[i]), 'support': int(support[i])} for i, c in enumerate(codes)},
            'confusion_matrix': confusion_matrix(targets, predictions, labels=list(codes)).tolist(),
            'confusion_orientation': 'rows actual, columns predicted, order 1-5',
            'severe_acuity_underclassification': severe,
            'calibration': {'multiclass_brier': float(((p-np.eye(5)[truth])**2).sum(axis=1).mean()),
                'negative_log_likelihood': float(-np.log(np.maximum(p[np.arange(len(truth)), truth], 1e-15)).mean()),
                'top_label_ece': sum(b['n']/len(targets)*abs(b['mean_confidence']-b['accuracy']) for b in bucket_rows),
                'bins': bucket_rows, 'fitted': False,
                'limitations': 'descriptive, not certified calibrated; class-balanced training changes effective prior'},
            'abstention': {'threshold': abstention_threshold, 'selected_using_test': False,
                'coverage': float(accepted.mean()), 'abstention_rate': float((~accepted).mean()),
                'selective_error': float((best[accepted] != truth[accepted]).mean()) if accepted.any() else None,
                'confusion_matrix': selective_matrix, 'prediction_columns': [*codes, 'research_abstain'],
                'operational': False}, 'clinical_validation': False}


class ModelEvaluator:
    def evaluate(self, targets, probabilities, labels, *, dataset_kind, abstention_threshold=None, bins=10):
        if dataset_kind not in ('clinical','synthetic_software_fixture'):
            raise ReadinessError('EVALUATION_DATA_SCOPE_REQUIRED')
        if not targets or len(targets)!=len(probabilities) or type(bins) is not int or bins<1:
            raise ReadinessError('INVALID_EVALUATION_INPUT')
        if abstention_threshold is not None and (type(abstention_threshold) not in (int,float) or not math.isfinite(abstention_threshold) or not 0<=abstention_threshold<=1):
            raise ReadinessError('INVALID_RESEARCH_ABSTENTION_THRESHOLD')
        codes=labels.codes; confusion=[[0]*5 for _ in codes];accepted=0;accepted_errors=0
        brier=0.0;nll=0.0;buckets=[[] for _ in range(bins)];decisions=[]
        for target,probs in zip(targets,probabilities):
            if target not in codes or len(probs)!=4 or any(type(p) not in (float,int) or not math.isfinite(p) or p<0 or p>1 for p in probs) or not math.isclose(sum(probs),1,abs_tol=1e-8):
                raise ReadinessError('INVALID_TARGET_OR_PROBABILITY_VECTOR')
            truth=codes.index(target);best=max(range(4),key=lambda i:probs[i]);confidence=probs[best]
            prediction=best if abstention_threshold is not None and confidence>=abstention_threshold else 4
            confusion[truth][prediction]+=1;decisions.append(prediction)
            if prediction!=4:accepted+=1;accepted_errors+=prediction!=truth
            brier+=sum((probs[i]-int(i==truth))**2 for i in range(4))
            nll-=math.log(max(probs[truth],1e-15))
            buckets[min(int(confidence*bins),bins-1)].append((confidence,int(best==truth)))
        per_class={}
        for i,code in enumerate(codes):
            tp=confusion[i][i];support=sum(confusion[i]);predicted=sum(row[i] for row in confusion)
            fp=predicted-tp;fn=support-tp
            per_class[code]={'support':support,'precision':tp/predicted if predicted else None,
                'recall':tp/support if support else None,'f1':2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None}
        emergency={'status':'blocked_pending_approved_emergency_mapping'}
        if labels.approved and labels.emergency_class is not None:
            i=codes.index(labels.emergency_class);support=sum(confusion[i])
            emergency={'status':'research_analysis_only','class':labels.emergency_class,'support':support,
                'recall':confusion[i][i]/support if support else None,'abstained':confusion[i][4],
                'accepted_non_emergency':sum(confusion[i][j] for j in range(4) if j!=i),
                'limitations':'Not a validated disposition rule; no clinical miss-rate threshold inferred'}
        n=len(targets)
        ece=sum(len(bucket)/n*abs(sum(c for c,_ in bucket)/len(bucket)-sum(a for _,a in bucket)/len(bucket)) for bucket in buckets if bucket)
        return {'schema_version':'medassist.model-b.evaluation.v1','dataset_kind':dataset_kind,
            'performance_scope':'synthetic software functionality only' if dataset_kind=='synthetic_software_fixture' else 'offline research; not clinical certification',
            'class_order':list(codes),
            'confusion_matrix':confusion,'prediction_columns':[*codes,'unable_to_assess'],'per_class':per_class,
            'coverage':accepted/n,'abstention_rate':1-accepted/n,'selective_error':accepted_errors/accepted if accepted else None,
            'multiclass_brier':brier/n,'negative_log_likelihood':nll/n,'top_label_ece':ece,
            'calibration_status':'descriptive held-out diagnostics; probabilities not certified calibrated',
            'emergency_safety_analysis':emergency,'clinical_validation':False}
