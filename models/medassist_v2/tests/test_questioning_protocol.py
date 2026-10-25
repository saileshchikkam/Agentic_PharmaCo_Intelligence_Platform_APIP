"""Task 3.5 protocol checks: project-authored synthetic data only, no training."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from models.medassist_v2 import questioning_protocol as q
from models.medassist_v2.research_adapter.protocol_integrity import protocol as portable_protocol
from models.medassist_v2.loader import normalise_catalogue
from models.medassist_v2.simulator import OfflineCase
from models.medassist_v2.validation import InvalidRecord


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        self.p=portable_protocol()
        self.source={}
        ids={'E_0','E_1','E_204',*q.EDGES,*q.EDGES.values(),*q.ORPHANS}
        for eid in ids:
            self.source[eid]={'name':eid,'code_question':q.ORPHANS.get(eid,q.EDGES.get(eid,eid)),
                'data_type':'B','default_value':0,'possible-values':[],'question_en':'Fictional research question?',
                'is_antecedent':eid in q.ORPHANS}
        for eid in ('E_55','E_57','E_54','E_133','E_152'):
            self.source[eid].update(data_type='M',default_value='NA',**{'possible-values':['NA','a','b']})
        for eid in ('E_56','E_58','E_59','E_130','E_131','E_132','E_134','E_135','E_136','E_204'):
            self.source[eid].update(data_type='C',default_value=0,**{'possible-values':[0,4]})
        for i in range(223-len(self.source)):
            self.source['FX_'+str(i)]={'name':'FX_'+str(i),'code_question':'FX_'+str(i),'data_type':'B',
                'default_value':0,'possible-values':[],'question_en':'Fictional independent question?', 'is_antecedent':False}
        self.catalogue=normalise_catalogue(self.source)
        self.raw={'AGE':32,'SEX':'M','PATHOLOGY':'EVALUATOR_ONLY_SENTINEL',
                  'DIFFERENTIAL_DIAGNOSIS':[['EVALUATOR_ONLY_SENTINEL',1.0]],'INITIAL_EVIDENCE':'E_0',
                  'EVIDENCES':['E_0','E_53','E_55_@_NA','E_55_@_a','E_56_@_4','E_69','E_204_@_0']}

    def start(self, raw=None):
        return OfflineCase(raw or self.raw,self.catalogue,'train').start(disclose_demographics=True,question_budget=20)

    def test_frozen_integrity_and_declared_bounds(self):
        self.assertEqual(self.p['eligibility']['active_size'],218)
        self.assertEqual(self.p['prefixes']['max_saved_prefixes']*32,self.p['prefixes']['max_pairs_per_pass'])
        self.assertEqual(self.p['stopping']['report_budgets'],[5,10,20])

    def test_checksum_rejects_even_whitespace_tampering(self):
        with tempfile.TemporaryDirectory() as parent:
            p=Path(parent)/q.PROTOCOL.name
            p.write_bytes(q.PROTOCOL.read_bytes()+b' ')
            p.with_suffix('.sha256').write_bytes(q.PROTOCOL.with_suffix('.sha256').read_bytes())
            with self.assertRaisesRegex(InvalidRecord,'protocol_checksum'):q.load_protocol(p)

    def test_semantic_changes_fail_validation(self):
        for section,key,value in [('answers','absent','false'),('prefixes','partition','test'),
                                  ('eligibility','active_size',223),('stopping','max_questions',30),
                                  ('seeds','master',999)]:
            p=copy.deepcopy(self.p);p[section][key]=value
            with self.assertRaises(InvalidRecord):q.validate_protocol(p)
        p=copy.deepcopy(self.p);p['source']['files'][0]['sha256']='0'*64
        with self.assertRaisesRegex(InvalidRecord,'source_pins'):q.validate_protocol(p)
        p=copy.deepcopy(self.p);del p['selection']
        with self.assertRaisesRegex(InvalidRecord,'protocol_fields'):q.validate_protocol(p)

    def test_synthetic_metadata_graph_matches_contract(self):
        self.assertEqual(q.validate_metadata(self.source,self.p),{'catalogue':223,'quarantined':5,'conditional':14,'active':218})

    def test_missing_parents_are_not_fabricated(self):
        source=copy.deepcopy(self.source);source['E_68']=source.pop('FX_0');source['E_68']['code_question']='E_68'
        with self.assertRaisesRegex(InvalidRecord,'metadata_graph_changed'):q.validate_metadata(source,self.p)
        allowed=q.eligible_questions(self.start().view(),self.p)
        self.assertFalse(set(allowed)&set(q.ORPHANS))

    def test_changed_parent_type_cannot_open_new_semantics(self):
        source=copy.deepcopy(self.source);source['E_53'].update(data_type='C',**{'possible-values':[0,1]})
        with self.assertRaisesRegex(InvalidRecord,'unsupported_parent_type'):q.validate_metadata(source,self.p)

    def test_conditional_mask_uses_disclosed_parent_only(self):
        interview=self.start()
        self.assertNotIn('E_55',q.eligible_questions(interview.view(),self.p))
        interview.ask('E_53')
        self.assertIn('E_55',q.eligible_questions(interview.view(),self.p))
        interview.ask('E_55')
        self.assertNotIn('E_55',q.eligible_questions(interview.view(),self.p))

    def test_unknown_parent_does_not_open_child(self):
        raw=copy.deepcopy(self.raw);raw['EVIDENCES'].remove('E_53')
        interview=self.start(raw);interview.ask('E_53')
        self.assertNotIn('E_55',q.eligible_questions(interview.view(),self.p))
        answer=next(a for a in interview.view()['revealed_answers'] if a['evidence_id']=='E_53')
        self.assertEqual((answer['state'],answer['value']),('unknown',None))

    def test_false_parent_does_not_open_child(self):
        interview=self.start();interview.ask('E_53');view=interview.view()
        next(a for a in view['revealed_answers'] if a['evidence_id']=='E_53')['value']=False
        self.assertNotIn('E_55',q.eligible_questions(view,self.p))

    def test_unknown_default_multichoice_mixed_and_empty_are_distinct(self):
        interview=self.start();interview.ask('E_204');interview.ask('E_1');interview.ask('E_53');interview.ask('E_55')
        answers={a['evidence_id']:a for a in interview.view()['revealed_answers']}
        self.assertEqual((answers['E_204']['state'],answers['E_204']['value']),('confirmed',0))
        self.assertEqual((answers['E_1']['state'],answers['E_1']['value']),('unknown',None))
        self.assertEqual(set(answers['E_55']['value']),{'NA','a'})
        self.assertEqual(q.useful_content(answers['E_204'],self.source['E_204']),0)
        self.assertEqual(q.useful_content(answers['E_55'],self.source['E_55']),1)
        self.assertEqual(q.useful_content({'state':'confirmed','value':['NA']},self.source['E_55']),0)
        self.assertEqual(q.useful_content({'state':'confirmed','value':[]},self.source['E_55']),0)

    def test_hidden_answers_labels_and_fingerprints_cannot_seed_selector(self):
        changed=copy.deepcopy(self.raw);changed['EVIDENCES'].append('E_1')
        changed['PATHOLOGY']='OTHER_EVALUATOR_ONLY_SENTINEL';changed['DIFFERENTIAL_DIAGNOSIS']=[['OTHER_EVALUATOR_ONLY_SENTINEL',1.0]]
        left,right=self.start().view(),self.start(changed).view()
        self.assertNotEqual(q.active_fingerprint(self.raw,self.source,self.p),q.active_fingerprint(changed,self.source,self.p))
        self.assertEqual(left,right)
        self.assertEqual(q.transcript_digest(left),q.transcript_digest(right))
        self.assertEqual(q.random_question(left,self.p),q.random_question(right,self.p))
        self.assertEqual(q.prefix_candidates(left,self.p,'random-eligible'),q.prefix_candidates(right,self.p,'random-eligible'))
        self.assertEqual(q.feature_tokens(left,'E_1',self.p),q.feature_tokens(right,'E_1',self.p))

    def test_prefix_sampling_is_bounded_eligible_and_replays(self):
        view=self.start().view();a=q.prefix_candidates(view,self.p,'lexical')
        self.assertEqual(a,q.prefix_candidates(view,self.p,'lexical'))
        self.assertEqual(len(a),32)
        self.assertTrue(set(a)<=set(q.eligible_questions(view,self.p)))

    def test_feature_tokens_contain_only_disclosed_state(self):
        view=self.start().view();tokens=q.feature_tokens(view,'E_1',self.p)
        self.assertTrue(all(json.loads(t) for t in tokens))
        self.assertNotIn('EVALUATOR_ONLY_SENTINEL',''.join(tokens))
        self.assertFalse(any('E_55' in t for t in tokens))
        with self.assertRaisesRegex(InvalidRecord,'ineligible_feature_candidate'):q.feature_tokens(view,'E_55',self.p)

    def test_hidden_or_future_fields_are_rejected(self):
        view=self.start().view();view['PATHOLOGY']='NO'
        with self.assertRaisesRegex(InvalidRecord,'selector_view_fields'):q.eligible_questions(view,self.p)
        view=self.start().view();view['answer_history'].append({'evidence_id':'E_1','state':'confirmed','value':True})
        with self.assertRaisesRegex(InvalidRecord,'future_history'):q.transcript_digest(view)
        view=self.start().view();view['revealed_answers'][0]['hidden']='NO'
        with self.assertRaisesRegex(InvalidRecord,'public_answer_fields'):q.transcript_digest(view)

    def test_context_must_be_explicit_not_inferred(self):
        view=OfflineCase(self.raw,self.catalogue,'train').start().view()
        with self.assertRaisesRegex(InvalidRecord,'explicit_source_context_required'):q.eligible_questions(view,self.p)

    def test_fingerprint_excludes_diagnoses_and_quarantined_evidence(self):
        changed=copy.deepcopy(self.raw);changed['EVIDENCES'].remove('E_69')
        changed['PATHOLOGY']='OTHER';changed['DIFFERENTIAL_DIAGNOSIS']=[['OTHER',1.0]]
        changed['EVIDENCES'].reverse()
        self.assertEqual(q.active_fingerprint(self.raw,self.source,self.p),q.active_fingerprint(changed,self.source,self.p))
        changed['EVIDENCES'].remove('E_204_@_0')
        self.assertNotEqual(q.active_fingerprint(self.raw,self.source,self.p),q.active_fingerprint(changed,self.source,self.p))

    def test_sensitivity_uses_train_reference_without_moving_rows(self):
        reference={'seen'};before=set(reference)
        self.assertFalse(q.sensitivity_keep('validation','seen','train',reference))
        self.assertTrue(q.sensitivity_keep('test','new','train',reference))
        self.assertEqual(reference,before)
        for source in ('validation','test'):
            with self.assertRaisesRegex(InvalidRecord,'training_reference_required'):q.sensitivity_keep('test','seen',source,reference)

    def test_contradiction_and_stopping_leave_no_eligible_output(self):
        interview=self.start();interview.ask('E_53');interview.observe('E_53',False)
        self.assertEqual(q.eligible_questions(interview.view(),self.p),[])
        interview=self.start();interview.stop()
        self.assertIsNone(q.random_question(interview.view(),self.p))

    def test_protocol_budget_applies_even_if_underlying_harness_budget_is_larger(self):
        interview=OfflineCase(self.raw,self.catalogue,'train').start(disclose_demographics=True,question_budget=100)
        for _ in range(20):
            interview.ask(q.eligible_questions(interview.view(),self.p)[0])
        self.assertIsNone(interview.view()['stopping_reason'])
        self.assertEqual(q.eligible_questions(interview.view(),self.p),[])
