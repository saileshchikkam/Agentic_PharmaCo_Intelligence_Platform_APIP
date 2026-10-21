"""Explicit software-only fixtures and a NON-LEARNING estimator for dry runs."""
import copy
import hashlib

import numpy as np

from .. import questioning_protocol as ref
from ..loader import normalise_catalogue
from ..validation import require,validate_ddxplus_record


class FictionalDataset:
    mode='fictional_preflight'

    def __init__(self,p):
        source={}
        ids={'E_0','E_1','E_204',*ref.EDGES,*ref.EDGES.values(),*ref.ORPHANS}
        for eid in sorted(ids):source[eid]={'name':eid,'code_question':ref.ORPHANS.get(eid,ref.EDGES.get(eid,eid)),
            'data_type':'B','default_value':0,'possible-values':[],'question_en':'Fictional software question?', 'is_antecedent':eid in ref.ORPHANS}
        for eid in ('E_55','E_57','E_54','E_133','E_152'):source[eid].update(data_type='M',default_value='NA',**{'possible-values':['NA','a','b']})
        for eid in ('E_56','E_58','E_59','E_130','E_131','E_132','E_134','E_135','E_136','E_204'):
            source[eid].update(data_type='C',default_value=0,**{'possible-values':[0,4]})
        for i in range(223-len(source)):
            eid='FX_'+str(i);source[eid]={'name':eid,'code_question':eid,'data_type':'B','default_value':0,
                'possible-values':[],'question_en':'Fictional independent question?', 'is_antecedent':False}
        ref.validate_metadata(source,p);self.source=source;self.catalogue=normalise_catalogue(source)
        def record(age,extra=True):
            evidence=['E_0','E_53','E_55_@_NA','E_55_@_a','E_56_@_4','E_204_@_0','E_69']
            if extra:evidence+=['FX_0','FX_2']
            return {'AGE':age,'SEX':'M' if age%2 else 'F','INITIAL_EVIDENCE':'E_0','EVIDENCES':evidence,
                    'PATHOLOGY':'FICTIONAL_EVALUATOR_ONLY','DIFFERENTIAL_DIAGNOSIS':[['FICTIONAL_EVALUATOR_ONLY',1.0]]}
        self.rows={'train':[record(a) for a in (10,20,30,40)]+[record(20)],
                   'validation':[record(20),record(21),record(31),record(41)],
                   'test':[record(10),record(21),record(51),record(61)]}
        self.counts={k:len(v) for k,v in self.rows.items()}
        self.receipt={'synthetic_fixture_sha256':ref.sha({'source':source,'rows':self.rows}),'not_ddxplus':True}
        self.opened=[]

    def records(self,partition):
        require(partition in self.rows,'partition_scope');self.opened.append(partition)
        for row in self.rows[partition]:yield validate_ddxplus_record(copy.deepcopy(row),self.catalogue)


class NonLearningEstimator:
    """No statistics are learned: zero coefficients and scores; records plumbing calls only."""
    def __init__(self,p,alpha):
        self.alpha=alpha;self.calls=0
        self.coef_=np.zeros((1,p['ranking_model']['features']['n_features']),dtype=np.float32)
        self.intercept_=np.zeros(1,dtype=np.float32)

    def partial_fit(self,x,y,classes):
        require(x.shape[0]==len(y) and classes.tolist()==[0,1],'fictional_batch_shape');self.calls+=1
        return self

    def decision_function(self,x):return np.zeros(x.shape[0],dtype=np.float32)
