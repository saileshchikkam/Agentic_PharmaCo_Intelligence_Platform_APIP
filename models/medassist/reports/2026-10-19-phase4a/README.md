# Phase 4A — error audit and independent validation design

Completed 2026-10-19 against Phase 3 commit **853f7d69059ba2685de44362a890a615f6a5de47**. **GO for bounded additional offline research/design; NO-GO for clinical inference, home urgency mapping or a real-patient pilot.** This is an AI-assisted engineering/evidence assessment, without human clinical sign-off.

## Deliverables and boundaries

- [Error analysis](error-analysis.md) and [reproducible count-only output](error-audit.json): existing development caches separated from post-hoc opened-test descriptions, all 12 frozen pipelines retained.
- [Feature availability and target suitability](feature-and-target-assessment.md): future conversation inputs versus ED proxies.
- [External dataset feasibility matrix](external-datasets.md) and [source/access manifest](validation-sources.json): real, reconstructed and synthetic evidence separated; no new patient archives acquired.
- [Independent study design](validation-study.md): proposed reviewer roles, sequential tasks, safety endpoints, uncertainty and acceptance gates; **not an approved clinical rulebook**.
- [Risk register](risk-register.md): evidence gaps, controls and review responsibilities.
- [Read-only auditor and exact commands](../../research/audit/README.md); [artifact/code hashes](reproducibility.json).

The protocol, earlier reports, source, split files, fitted models, calibrators, cached predictions and thresholds were preserved. The auditor checked **332 external files before/after**, with identical inventories, and reverified the source, original assignments, group separation, CV fingerprints and pre-test artifact seal. It neither loaded estimators nor called training, model prediction or threshold-search methods. This is cached error aggregation, not another locked-test evaluation. No application, backend, account, ADR or safety behavior changed.

Public outputs contain single-attribute aggregate counts only, with sparse-support flags; no individual examples, source-row lists, narratives, hospital/cluster identifiers or model files. The private inventory uses paths only in memory; its public receipt exposes a digest and file count. Cryptographic consistency is internal provenance, not independent proof of dataset validity.

## Recommended Phase 4B, in dependency order

1. **Small — settle task and review roles.** Agree English symptom assessment at each disclosure, permitted care-setting/time recommendations, and explicit insufficient-information/abstention outcomes. Obtain suitably qualified emergency/primary-care review and paediatric/obstetric coverage where in scope; Mahesh's pharmacy role alone does not establish those qualifications.
2. **Medium — close source-rights and provenance gates.** Pin candidate versions/metadata and resolve CARE-Bench upstream/code terms, Semigran supplement rights, and any India-source restrictions before acquisition. Keep DDXPlus conversation research separate. No restricted data download or paid service is required by this plan.
3. **Medium — build an isolated synthetic evaluation harness.** Validate staged disclosure, withheld-answer protection, question relevance, contradiction handling, source attribution and deterministic scoring using hand-written software fixtures. Fixtures test the harness, not clinical accuracy. Keep it outside the app.
4. **Large — assemble and independently label a new evaluation set.** Use permissioned/publicly reusable cases after source review plus clinician-authored Indian-context vignettes. Group by patient/source/case family, reserve independent untouched cases, adjudicate labels blind to model outputs, and establish support/precision requirements before any model runs. Real-patient acquisition requires a separately authorized study and data-governance arrangements.
5. **Medium — preregister the new study.** Freeze task, inputs, case exclusions, models/prompts, any calibration/operating-point choices, sample-size justification, metrics, failure handling and analysis. No test-informed v1 patching. NHAMCS remains a historical ED baseline; any temporal ED study is a distinct endpoint, not home validation.

No Phase 4B acquisition, clinical rules, training, evaluation of a new system or deployment is implemented/authorized merely by listing these recommendations. The immediate safe next step is task/rubric and dataset-rights review, then an offline harness under a separately agreed specification.

## Executed checks and limitations

**50 synthetic research tests passed with warnings treated as errors; pip check found no broken requirements.** The actual cached-audit repeat was equal with estimator fitting/prediction, threshold search, training/evaluation entry points and outer split generation patched to fail. All 332 protected external files remained byte-identical. The first sandboxed suite had a temporary-fixture rename permission error; its retry with normal filesystem access passed. The initial auditor used the wrong test-partition spelling, failed its membership check before publication and was corrected to the existing `locked_test` name; no benchmark file changed. A development-abstention draft was corrected to omit unavailable masks instead of implying zero abstentions, with a regression test.

Exact commands are in the auditor guide and dated history. No application build or clinical evaluation was needed or run. All original benchmarks remain historical. Missing fit/OOF and secondary development error caches limit development error investigation; no new predictions were generated to fill these gaps. Test singleton-stratum interval suppression remains in force. Opened-test comparisons are descriptive and do not select a replacement model.

Source verification occurred on 2026-10-19 using publisher/author documentation and official metadata only. Licence notices are recorded evidence, not a new grant of rights. Bounded searches did not establish a ready-to-use independent Indian all-age home-urgency benchmark; this does not prove none exists. Clinical-label validity and population transportability remain unestablished.
