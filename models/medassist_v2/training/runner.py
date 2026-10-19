"""Explicit stage entry points. Preflight does not decode patient archives or fit models."""
from pathlib import Path

from threadpoolctl import threadpool_info,threadpool_limits

from .. import questioning_protocol as ref
from ..validation import require,read_json
from ..storage import external_path
from .data import (OfficialDataset,environment,new_run,write_json,file_hash,implementation_hashes,prepare)
from .flow import build_pairs,fit_grid,estimator,hasher
from .campaign import validation_select,cache_partition,cached_report,seal,locked_test


def parity_gate(p):
    """Authored miniature cases only; no dataset I/O and no learned parameters."""
    from .fictional import FictionalDataset
    from .flow import tokens_many,prefix_pairs
    from .data import Encoding
    from ..simulator import OfflineCase
    data=FictionalDataset(p);raw=data.rows['train'][0]
    require(Encoding(data.source,p).fingerprint(raw)==ref.active_fingerprint(raw,data.source,p),'fingerprint_parity')
    interview=OfflineCase(raw,data.catalogue,'train').start(disclose_demographics=True,question_budget=20)
    compared=0
    for turn in range(20):
        view=interview.view();eligible=ref.eligible_questions(view,p)
        if not eligible:break
        subset=ref.prefix_candidates(view,p,'lexical')
        require(list(tokens_many(view,subset,p))==[ref.feature_tokens(view,eid,p) for eid in subset],'feature_reference_parity')
        compared+=len(subset);interview.ask(eligible[0])
    pairs=list(prefix_pairs(raw,data.source,data.catalogue,p))
    require(pairs and set(turn for _,turn,_,_,_ in pairs)==set(p['prefixes']['saved_before_question_turns']),'prefix_turn_parity')
    return {'status':'passed','synthetic_token_vectors':compared,'synthetic_prefix_pairs':len(pairs)}


def protocol():
    p=ref.load_protocol()
    require(file_hash(ref.PROTOCOL)=='734050555cb9c42e4bc0b47884cf4bac27ec20da5b531c3457685b86dc2c899a','unexpected_frozen_protocol')
    return p


def preflight(data_root):
    p=protocol();versions=environment(p);data=OfficialDataset(data_root,p);parity=parity_gate(p)
    # Construct API objects only. No fit/partial_fit or record iteration occurs.
    hasher(p)
    for alpha in p['ranking_model']['alpha_grid']:estimator(p,alpha)
    with threadpool_limits(limits=1):threads=threadpool_info()
    return {'status':'source_and_environment_preflight_passed','protocol_sha256':file_hash(ref.PROTOCOL),
            'verified_files':len(data.receipt),'environment':versions,'threadpools_under_limit':threads,
            'reference_parity':parity,'official_patient_rows_decoded':0,'official_models_fitted':0,'official_outcomes_evaluated':0,
            'remaining_gates':['future full train/validation membership counts','active reference/masks','target/selection support',
                               'real fitting, convergence/runtime and selected-model artifacts','pre-test seal and unopened ledger']}


def initialise(dataset,root,p):
    parity=parity_gate(p)
    hasher(p)
    with threadpool_limits(limits=1):pools=threadpool_info()
    write_json(root/'run.json',{'mode':dataset.mode,'protocol_sha256':file_hash(ref.PROTOCOL),
                              'implementation':implementation_hashes(),'source_hashes':dataset.receipt,'environment':environment(p),
                              'execution_threadpools':pools,'reference_parity':parity})


def develop(dataset,root,p,factory=None):
    prepare(dataset,root,p);build_pairs(dataset,root,p);fit_grid(root,p,dataset.mode,factory)
    validation_select(dataset,root,p)
    cache_partition(dataset,root,p,'validation')
    write_json(root/'validation-aggregate.json',cached_report(root,'validation',p))
    return seal(root,p)


def fit_official(data_root,run_root,execute=False):
    require(execute,'explicit_official_fitting_required')
    p=protocol();environment(p);data=OfficialDataset(data_root,p)
    root=new_run(run_root,data.loader.root);initialise(data,root,p)
    hasher(p)
    with threadpool_limits(limits=1):develop(data,root,p)
    return {'status':'pre_test_sealed','mode':'official','test_outcomes_evaluated':0}


def test_official(data_root,run_root,ledger_root,execute=False):
    require(execute,'explicit_locked_test_required')
    p=protocol();environment(p);data=OfficialDataset(data_root,p);root=external_path(run_root)
    require(read_json(root/'run.json')['mode']=='official','official_run_required')
    hasher(p)
    with threadpool_limits(limits=1):locked_test(data,root,p,ledger_root)
    return {'status':'locked_test_completed','mode':'official','raw_results_location':'external run directory only'}


def fictional_dry_run(run_root,ledger_root):
    from .fictional import FictionalDataset,NonLearningEstimator
    p=protocol();data=FictionalDataset(p);root=new_run(run_root);initialise(data,root,p)
    hasher(p)
    with threadpool_limits(limits=1):
        develop(data,root,p,NonLearningEstimator)
        locked_test(data,root,p,ledger_root)
    return {'status':'fictional_end_to_end_passed','mode':data.mode,'fictional_source_rows':data.counts,
            'fitting_groups':read_json(root/'cohorts.json')['fit_groups'],'pairs':read_json(root/'pairs.json')['pairs'],
            'selected_alpha':read_json(root/'selection.json')['selected_alpha'],'standin_estimator':'non-learning zero scores',
            'official_models_fitted':0,'official_validation_test_outcomes_evaluated':0,'protocol_unchanged':True}
