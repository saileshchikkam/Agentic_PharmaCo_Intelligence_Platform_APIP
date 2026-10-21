"""Task 4A software tests. Every record is authored fiction; no official fitting/evaluation."""
from contextlib import closing
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import shutil
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.validation import InvalidRecord,read_json
from models.medassist_v2.training import data,flow,campaign,metrics,runner
from models.medassist_v2.training.fictional import FictionalDataset,NonLearningEstimator


class PureRunnerTests(unittest.TestCase):
    def setUp(self):
        self.p=runner.protocol();self.ds=FictionalDataset(self.p)

    def test_reference_gate_and_exact_feature_parity(self):
        result=runner.parity_gate(self.p)
        self.assertEqual(result['status'],'passed');self.assertEqual(result['synthetic_token_vectors'],640)

    def test_fingerprint_order_and_diagnosis_parity(self):
        raw=self.ds.rows['train'][0];changed=copy.deepcopy(raw)
        changed['PATHOLOGY']='DIFFERENT';changed['DIFFERENTIAL_DIAGNOSIS']=[['DIFFERENT',1.0]];changed['EVIDENCES'].reverse()
        enc=data.Encoding(self.ds.source,self.p)
        self.assertEqual(enc.fingerprint(raw),ref.active_fingerprint(raw,self.ds.source,self.p))
        self.assertEqual(enc.fingerprint(changed),enc.fingerprint(raw))

    def test_prefix_order_caps_turns_and_partition_gate(self):
        raw=self.ds.rows['train'][0]
        pairs=list(flow.prefix_pairs(raw,self.ds.source,self.ds.catalogue,self.p))
        self.assertEqual(pairs,list(flow.prefix_pairs(raw,self.ds.source,self.ds.catalogue,self.p)))
        for policy in self.p['prefixes']['policies']:
            selected=[r for r in pairs if r[0]==policy]
            self.assertEqual([t for i,t,_,_,_ in selected[::32]],[0,2,5,10])
            self.assertEqual(len(selected),128)
        for partition in ('validation','test'):
            with self.assertRaisesRegex(InvalidRecord,'prefix_training_only'):
                list(flow.prefix_pairs(raw,self.ds.source,self.ds.catalogue,self.p,partition))

    def test_hidden_target_changes_cannot_change_initial_feature_inputs(self):
        raw=self.ds.rows['train'][0];other=copy.deepcopy(raw);other['EVIDENCES'].append('FX_15')
        def initial(r):return [(policy,t,eid,tokens) for policy,t,eid,tokens,_ in flow.prefix_pairs(r,self.ds.source,self.ds.catalogue,self.p) if t==0]
        self.assertEqual(initial(raw),initial(other))

    def test_capped_heap_matches_exact_hash_sort(self):
        heap=[]
        for ordinal,fp in enumerate(('z','a','m','c')):data.consider(heap,2,fp,ordinal,{'fixture':fp},'fit')
        expected=sorted(('z','a','m','c'),key=lambda fp:data.sample_key('fit',fp))[:2]
        self.assertEqual([r[0] for r in data.ordered(heap,'fit')],expected)

    def test_source_hash_failure_stops_before_record_access(self):
        with tempfile.TemporaryDirectory() as parent:
            root=Path(parent);(root/'fixture.json').write_bytes(b'abc')
            p={'source':{'files':[{'name':'fixture.json','bytes':3,'md5':hashlib.md5(b'abc').hexdigest(),'sha256':'0'*64}]}}
            with self.assertRaisesRegex(InvalidRecord,'source_sha256_mismatch'):data.verify_sources(SimpleNamespace(root=root),p)

    def test_baseline_lexical_random_and_frequency_ties(self):
        from models.medassist_v2.simulator import OfflineCase
        view=OfflineCase(self.ds.rows['train'][0],self.ds.catalogue,'train').start(disclose_demographics=True).view()
        eligible=ref.eligible_questions(view,self.p)
        self.assertEqual(flow.Policy('lexical',self.p)(view),eligible[0])
        self.assertEqual(flow.Policy('random-eligible',self.p)(view),ref.random_question(view,self.p))
        self.assertEqual(flow.Policy('training-frequency',self.p,frequency={})(view),eligible[0])

    def test_sgd_grid_objects_match_frozen_parameters_without_fit(self):
        for alpha in self.p['ranking_model']['alpha_grid']:
            model=flow.estimator(self.p,alpha);params=model.get_params()
            self.assertEqual(params['alpha'],alpha);self.assertEqual(params['loss'],'log_loss');self.assertFalse(params['shuffle'])
            self.assertTrue(params['average']);self.assertFalse(hasattr(model,'coef_'))
        h=flow.hasher(self.p);self.assertEqual(h.n_features,65536);self.assertFalse(h.alternate_sign)

    def test_selection_support_tolerance_and_large_alpha_tie(self):
        scores=[{'alpha':a,'recall20':.2,'recall10':.1,'yield20':.1,'positive_cases':1} for a in self.p['ranking_model']['alpha_grid']]
        self.assertEqual(campaign.choose(scores,self.p),.001)
        scores[0]['recall20']=.3;self.assertEqual(campaign.choose(scores,self.p),1e-5)
        scores[0]['positive_cases']=0
        with self.assertRaises(InvalidRecord):campaign.choose(scores,self.p)

    def test_invalid_policy_cost_carry_and_denominator(self):
        raw=self.ds.rows['test'][0]
        result=flow.trajectory(raw,self.ds.source,self.ds.catalogue,self.p,lambda view:'E_0','test')
        self.assertEqual(result['stop'],'invalid_policy_output');self.assertEqual(result['repeat'],1)
        v=metrics.vector(result);point=metrics.point(v)
        self.assertEqual(point['macro_recall@20'],0);self.assertEqual(point['invalid_rate'],1)
        self.assertEqual(point['mean_questions@20'],0)

    def test_null_zero_denominators_never_become_zero_recall(self):
        raw=copy.deepcopy(self.ds.rows['test'][0]);raw['EVIDENCES']=['E_0']
        r=flow.trajectory(raw,self.ds.source,self.ds.catalogue,self.p,flow.Policy('lexical',self.p),'test')
        result=metrics.aggregate([r]);self.assertIsNone(result['metrics']['macro_recall@20'])
        self.assertEqual(result['support']['n'],1)

    def test_cluster_bootstrap_is_paired_deterministic_and_suppresses_rare_groups(self):
        r=flow.trajectory(self.ds.rows['test'][0],self.ds.source,self.ds.catalogue,self.p,flow.Policy('lexical',self.p),'test')
        v=metrics.vector(r);cube=np.stack([np.stack([v,v]),np.stack([v*2,v*2])])
        a=metrics.paired_report(cube,['lexical','ranker'],self.p)
        self.assertEqual(a,metrics.paired_report(cube,['lexical','ranker'],self.p))
        self.assertEqual(a['paired_ranker_minus_baseline']['lexical']['macro_recall@20']['interval'],[0.0,0.0])
        sub=metrics.paired_report(cube,['lexical','ranker'],self.p,subgroup=True)
        self.assertTrue(sub['policies']['ranker']['rates_suppressed']);self.assertIsNone(sub['policies']['ranker']['metrics']['macro_recall@20'])


class PipelineRunnerTests(unittest.TestCase):
    def setUp(self):
        self.p=runner.protocol();self.ds=FictionalDataset(self.p)
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.parent=Path(self.temp.name);self.root=data.new_run(self.parent/'run')
        runner.initialise(self.ds,self.root,self.p)

    def prepare(self):
        result=data.prepare(self.ds,self.root,self.p);flow.build_pairs(self.ds,self.root,self.p);return result

    def ready_seal(self):
        self.prepare();flow.fit_grid(self.root,self.p,self.ds.mode,NonLearningEstimator)
        campaign.validation_select(self.ds,self.root,self.p)
        campaign.cache_partition(self.ds,self.root,self.p,'validation')
        data.write_json(self.root/'validation-aggregate.json',campaign.cached_report(self.root,'validation',self.p))
        campaign.seal(self.root,self.p)

    def test_reference_dedup_earliest_selection_and_training_seal(self):
        r=self.prepare();self.assertEqual(r['train_groups'],4);self.assertEqual(r['fit_groups'],4)
        self.assertEqual(r['selection_groups'],3);self.assertNotIn('test',self.ds.opened)
        with closing(data.database(self.root/'training-reference.sqlite',True)) as db:
            fp=data.Encoding(self.ds.source,self.p).fingerprint(self.ds.rows['train'][1])
            self.assertEqual(db.execute('SELECT ordinal FROM groups WHERE fp=?',(fp,)).fetchone()[0],1)
        self.assertNotIn('FICTIONAL_EVALUATOR_ONLY',(self.root/'pairs-features.jsonl').read_text())

    def test_zero_target_support_blocks_fitting(self):
        for row in self.ds.rows['train']:row['EVIDENCES']=['E_0']
        data.prepare(self.ds,self.root,self.p)
        with self.assertRaisesRegex(InvalidRecord,'both_target_classes_required'):flow.build_pairs(self.ds,self.root,self.p)
        self.assertFalse((self.root/'fit-results.json').exists())

    def test_missing_validation_support_blocks_fitting(self):
        for row in self.ds.rows['validation']:row['EVIDENCES']=['E_0']
        data.prepare(self.ds,self.root,self.p)
        with self.assertRaisesRegex(InvalidRecord,'validation_positive_support_required'):flow.build_pairs(self.ds,self.root,self.p)

    def test_failed_fit_writes_blocker_and_never_seals_or_tests(self):
        self.prepare()
        class Failed(NonLearningEstimator):
            def partial_fit(self,*args,**kwargs):raise RuntimeError('synthetic_failure')
        with self.assertRaises(RuntimeError):flow.fit_grid(self.root,self.p,self.ds.mode,Failed)
        self.assertTrue((self.root/'fit-failure.json').exists())
        with self.assertRaisesRegex(InvalidRecord,'failed_fit_blocks_test'):campaign.load_models(self.root,self.p)
        self.assertNotIn('test',self.ds.opened)

    def test_pair_hash_mutation_blocks_before_fake_fit(self):
        self.prepare()
        with (self.root/'pairs-targets.jsonl').open('a') as out:out.write('1\n')
        with self.assertRaisesRegex(InvalidRecord,'pair_artifact_changed'):flow.fit_grid(self.root,self.p,self.ds.mode,NonLearningEstimator)

    def test_fictional_end_to_end_seal_cache_sensitivity_and_replay_guards(self):
        from sklearn.linear_model import SGDClassifier
        with patch.object(SGDClassifier,'fit',side_effect=AssertionError('real fitting forbidden')),patch.object(SGDClassifier,'partial_fit',side_effect=AssertionError('real fitting forbidden')):
            self.ready_seal()
            report=campaign.locked_test(self.ds,self.root,self.p,self.parent/'ledger')
        full=report['reports']['full_original_partition']['overall']['policies']['ranker']
        sensitivity=report['reports']['training_overlap_excluded_sensitivity']['overall']['policies']['ranker']
        self.assertEqual(full['support']['n'],4);self.assertEqual(sensitivity['support']['n'],3)
        self.assertEqual(report['residual_nontraining_validation_test_overlap']['groups'],1)
        opened=list(self.ds.opened)
        with self.assertRaisesRegex(InvalidRecord,'test_replay_forbidden'):campaign.locked_test(self.ds,self.root,self.p,self.parent/'ledger')
        self.assertEqual(self.ds.opened,opened)
        with patch.object(campaign,'trajectory',side_effect=AssertionError('cache must not replay')):
            self.assertEqual(report,campaign.cached_report(self.root,'test',self.p))

    def test_ledger_claim_is_atomic_and_survives_failed_test_attempt(self):
        self.ready_seal()
        with patch.object(campaign,'cache_partition',side_effect=RuntimeError('fictional interrupted test')):
            with self.assertRaises(RuntimeError):campaign.locked_test(self.ds,self.root,self.p,self.parent/'ledger')
        self.assertTrue((self.root/'test-started.json').exists());self.assertEqual(len(list((self.parent/'ledger').glob('*.json'))),1)
        with self.assertRaisesRegex(InvalidRecord,'test_replay_forbidden'):campaign.locked_test(self.ds,self.root,self.p,self.parent/'ledger')

    def test_changed_sealed_artifact_blocks_test_before_source_access(self):
        self.ready_seal();opened=list(self.ds.opened)
        with (self.root/'frequency.json').open('a') as out:out.write(' ')
        with self.assertRaisesRegex(InvalidRecord,'sealed_artifact_changed'):campaign.locked_test(self.ds,self.root,self.p,self.parent/'ledger')
        self.assertEqual(self.ds.opened,opened)

    def test_official_commands_require_explicit_execution_flags(self):
        with self.assertRaisesRegex(InvalidRecord,'explicit_official_fitting_required'):runner.fit_official('unused','unused')
        with self.assertRaisesRegex(InvalidRecord,'explicit_locked_test_required'):runner.test_official('unused','unused','unused')

    def test_global_ledger_blocks_another_sealed_run_of_same_campaign(self):
        self.ready_seal()
        second=self.parent/'second-run';shutil.copytree(self.root,second)
        with self.assertRaisesRegex(InvalidRecord,'seal_mode_or_root_changed'):campaign.verify_seal(second,self.ds,self.p)
        # These are disposable fictional copies only; resealing simulates another valid run.
        (second/'pre-test-seal.json').unlink();(second/'pre-test-seal-hash.json').unlink()
        campaign.seal(second,self.p)
        with patch.object(campaign,'cache_partition',side_effect=RuntimeError('fictional interruption')):
            with self.assertRaises(RuntimeError):campaign.locked_test(self.ds,self.root,self.p,self.parent/'ledger')
        opened=list(self.ds.opened)
        with self.assertRaises(FileExistsError):campaign.locked_test(self.ds,second,self.p,self.parent/'ledger')
        self.assertEqual(self.ds.opened,opened)
        pools=read_json(self.root/'run.json')['execution_threadpools']
        self.assertTrue(pools and all(pool['num_threads']==1 for pool in pools))
