"""Synthetic-only training, calibration, leakage, metric and test-lock regressions."""
import copy
import json
import tempfile
import unittest
import warnings
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.exceptions import ConvergenceWarning
from sklearn.frozen import FrozenEstimator
from threadpoolctl import threadpool_limits

from models.medassist.research.acquire import sha256
from models.medassist.research.estimators import (ResearchPreprocessor,build_pipeline,choose_best,
                                                 choose_threshold,grid_configurations,object_digest)
from models.medassist.research.metrics import (abstention_metrics,binary_metrics,bootstrap_cohort,
                                              reliability,secondary_metrics,subgroup_report)
from models.medassist.research.protocol import SPEC,load_protocol,research_matrix
from models.medassist.research.train import code_hashes,evaluate,expected_ids,seal_pretest,verify_seal
from models.medassist.research.train_worker import checked_fit,execute
from test_phase1 import fixture


class Phase3Tests(unittest.TestCase):
    def setUp(self):
        self.config=load_protocol()

    def test_grid_order_and_exact_budgets(self):
        grids={k:grid_configurations(v['grid']) for k,v in self.config['models'].items()}
        self.assertEqual([len(x) for x in grids.values()],[3,4,8])
        self.assertEqual(grids['HistGradientBoostingClassifier'][1],{'learning_rate':.05,'max_leaf_nodes':15,'l2_regularization':1.})
        for family,parameters in grids.items():
            for values in parameters: build_pipeline('demographic_reference',family,values,self.config)
        with self.assertRaises(ValueError): build_pipeline('demographic_reference','LogisticRegression',{'C':999},self.config)

    def test_ties_and_incomplete_selection(self):
        a={'status':'completed','mean_score':.5,'id':'first'}
        b={'status':'completed','mean_score':.5+5e-13,'id':'second'}
        self.assertEqual(choose_best([a,b],1e-12)['id'],'first')
        with self.assertRaises(ValueError): choose_best([a,{'status':'failed'}],1e-12)
        selected=choose_threshold(np.array([1,1,0,0]),np.full(4,.5),self.config)
        self.assertEqual(len(selected['grid']),101)
        self.assertEqual(selected['selected']['threshold'],.5)

    def test_fold_only_medians_unknowns_and_schema(self):
        df=fixture(5);df['AGE']=np.arange(len(df))
        x=research_matrix(df,'all_labelled_initial_vitals',self.config)
        pre=ResearchPreprocessor('all_labelled_initial_vitals','RandomForestClassifier',self.config).fit(x.iloc[:20])
        self.assertEqual(pre.medians_[0],9.5)
        valid=x.iloc[20:].copy();valid['AGE']=1000000;valid['SEX']='unseen'
        before=object_digest(pre);values=pre.transform(valid)
        self.assertEqual(object_digest(pre),before)
        self.assertTrue(pre.unseen(valid).all())
        self.assertEqual(len(pre.indicators_),7)
        self.assertNotIn('AGE',pre.indicators_)
        self.assertEqual(values.shape[1],8+7+1)
        with self.assertRaises(ValueError): pre.transform(valid.assign(IMMEDR=1))

    def test_empty_numeric_column_retained(self):
        x=research_matrix(fixture(5),'demographic_reference',self.config);x['AGE']=np.nan
        pre=ResearchPreprocessor('demographic_reference','LogisticRegression',self.config).fit(x)
        self.assertEqual(pre.medians_.tolist(),[0.])
        self.assertTrue(np.isfinite(pre.transform(x)).all())

    def test_hgb_categories_bounded_rare_and_unseen(self):
        df=fixture(300);df['RFV1']=np.repeat(np.arange(10000,10300),10)
        x=research_matrix(df,'presentation_symptom_proxy',self.config)
        pre=ResearchPreprocessor('presentation_symptom_proxy','HistGradientBoostingClassifier',self.config).fit(x)
        self.assertLessEqual(len(set(pre.maps_['RFV1'].values())),254)
        self.assertEqual(pre.maps_['RFV1']['10299'],253)
        changed=x.iloc[:1].copy();changed['RFV1']='19999'
        self.assertTrue(pre.unseen(changed)[0])
        self.assertTrue(np.isnan(pre.transform(changed)[0,-1]))

    def test_calibration_does_not_refit_or_mutate_pipeline(self):
        df=fixture(20);df['AGE']=np.arange(len(df))%50
        x=research_matrix(df,'demographic_reference',self.config);y=(df.IMMEDR<=2).astype(int)
        model=build_pipeline('demographic_reference','LogisticRegression',{'C':.1},self.config)
        with threadpool_limits(limits=1):
            checked_fit(model,x.iloc[:100],y.iloc[:100]);before=object_digest(model)
            calibrated=CalibratedClassifierCV(FrozenEstimator(model),method='sigmoid',n_jobs=1)
            checked_fit(calibrated,x.iloc[100:],y.iloc[100:])
        self.assertEqual(object_digest(model),before)
        self.assertEqual(model.named_steps['preprocess'].fit_rows_count_,100)

    def test_convergence_warning_blocks_candidate(self):
        class Bad:
            def fit(self,X,y): warnings.warn('synthetic convergence',ConvergenceWarning)
        with self.assertRaises(RuntimeError): checked_fit(Bad(),None,None)

    def test_candidate_executes_only_given_training_folds(self):
        df=fixture(10);x=research_matrix(df,'demographic_reference',self.config)
        with tempfile.TemporaryDirectory() as tmp:
            job={'stage':'candidate','task':'primary_binary','profile':'demographic_reference',
                 'family':'LogisticRegression','parameters':{'C':.1},'config':self.config,
                 'X':x,'y':(df.IMMEDR<=2).astype(int),'folds':[(np.arange(50),np.arange(50,100))]*3,
                 'private_error':str(Path(tmp)/'error.txt')}
            with threadpool_limits(limits=1): result=execute(job)
            self.assertEqual(result['status'],'completed');self.assertEqual(len(result['folds']),3)
            self.assertFalse((Path(tmp)/'error.txt').exists())

    def test_binary_metrics_and_weighted_misses(self):
        y=np.array([1,2,3,5]);p=np.array([.9,.2,.8,.1])
        m=binary_metrics(y,p,.5)
        self.assertEqual(m['confusion'],[[1.,1.],[1.,1.]])
        self.assertEqual(m['high_missed'],1);self.assertEqual(m['Immediate_missed'],0)
        self.assertEqual(m['high_recall'],.5)
        weighted=binary_metrics(y,p,.5,np.array([3.,1.,1.,1.]))
        self.assertEqual(weighted['high_recall'],.75)
        self.assertEqual(weighted['high_missed'],1)
        self.assertEqual(sum(b['rows'] for b in reliability([0,1],[0.,1.])['bins']),2)

    def test_secondary_ordinal_errors(self):
        y=np.array([1,2,3,4,5]);p=np.eye(5)[[2,0,2,4,4]]
        m=secondary_metrics(y,p)
        self.assertEqual(m['undertriage_count'],2);self.assertEqual(m['severe_undertriage_count'],1)
        self.assertEqual(m['Immediate_missed'],1);self.assertEqual(m['high_missed'],1)

    def test_abstention_cannot_hide_missed_high_cases(self):
        result=abstention_metrics([1,2,3],np.array([.9,.8,.1]),.5,np.array([True,False,False]),True)
        self.assertEqual(result['unconditional_high_detection'],.5)
        self.assertEqual(result['high_acuity_abstained'],1)

    def test_singleton_uncertainty_and_sparse_subgroups(self):
        df=fixture(1);df['RACEUN']=1;df['ETHUN']=1
        x=research_matrix(df,'all_labelled_initial_vitals',self.config)
        result=bootstrap_cohort(df,{},True,self.config)
        self.assertEqual(result['generated_replicates'],0)
        groups=subgroup_report(df,x,np.full(len(df),.4),.5,True,self.config)
        self.assertTrue(all(row['unstable_or_sparse'] for row in groups['age'].values()))
        self.assertTrue(all('comparative_metrics' not in row for row in groups['age'].values()))

    def test_cluster_bootstrap_reuses_paired_draws(self):
        df=fixture(4)
        p=np.tile([.8,.6,.4,.2,.1],8)
        cache={'a':{'probabilities':p,'threshold':.5,'family':'LR','profile':'without'},
               'b':{'probabilities':p,'threshold':.5,'family':'LR','profile':'with'}}
        result=bootstrap_cohort(df,cache,True,self.config)
        self.assertEqual(result['generated_replicates'],1000)
        self.assertEqual(result['intervals']['a']['high_recall']['valid_replicates'],1000)
        self.assertEqual(result['paired_differences']['a minus b']['high_recall']['interval_95'],[0.,0.])

    def manifest_fixture(self,run):
        manifest={'models':{},'candidates':[],'code_sha256':code_hashes(),'protocol_sha256':sha256(SPEC),
                  'requirements_sha256':sha256(SPEC.parent/'requirements-phase1.txt'),'test_predictions_performed':False}
        for key in expected_ids(self.config):
            task,profile,family=key.split('--');params=grid_configurations(self.config['models'][family]['grid'])
            for p in params: manifest['candidates'].append({'task':task,'profile':profile,'family':family,'parameters':p,'status':'completed','mean_score':.5})
            folder=run/'artifacts'/key;folder.mkdir(parents=True)
            names=['base.joblib','calibrated.joblib','private-development-predictions.joblib'] if task=='primary_binary' else ['base.joblib']
            for name in names: (folder/name).write_bytes(b'synthetic-not-a-real-model')
            manifest['models'][key]={'task':task,'profile':profile,'family':family,'parameters':params[0],
                'status':'completed','CV_mean_score':.5,'artifacts':{name:sha256(folder/name) for name in names}}
        return manifest

    def test_pretest_requires_all_candidates_and_artifact_hashes(self):
        with tempfile.TemporaryDirectory() as tmp:
            run=Path(tmp);manifest=self.manifest_fixture(run)
            broken=copy.deepcopy(manifest);broken['candidates'].pop()
            with self.assertRaises(ValueError): seal_pretest(run,broken,self.config)
            duplicate=copy.deepcopy(manifest);duplicate['candidates'][-1]=duplicate['candidates'][0]
            with self.assertRaises(ValueError): seal_pretest(run,duplicate,self.config)
            digest=seal_pretest(run,manifest,self.config)
            self.assertEqual(digest,sha256(run/'pretest-manifest.json'))
            verify_seal(run,self.config)
            with self.assertRaises(FileExistsError): seal_pretest(run,manifest,self.config)
            key=next(iter(manifest['models']));(run/'artifacts'/key/'base.joblib').write_bytes(b'tampered')
            with self.assertRaises(ValueError): verify_seal(run,self.config)

    def test_test_marker_prevents_prediction_replay(self):
        with tempfile.TemporaryDirectory() as tmp:
            run=Path(tmp);(run/'test-started.json').write_text('{}');(run/'pretest-manifest.json').write_text('{}')
            fake={'phase1_run':'synthetic','split_and_CV_digests':{}}
            with (patch('models.medassist.research.train.verify_seal',return_value=fake),
                  patch('models.medassist.research.train.load_inputs',return_value=({'cohorts':{}},{})),
                  patch('models.medassist.research.train.joblib.load') as load):
                with self.assertRaises(FileExistsError): evaluate(run,run,self.config)
                load.assert_not_called()


if __name__=='__main__': unittest.main()
