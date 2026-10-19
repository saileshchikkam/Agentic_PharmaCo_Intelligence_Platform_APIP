# MedAssist ML research

This directory contains offline English-only, open-access research specifications and implemented Phase 1 acquisition/profiling plus Phase 2 contracts and the Phase 3 offline training runner. It does not configure the running application or enable clinical inference.

- [Verified dataset manifest](open-access-manifest.json): pinned sources, access/terms, target codes, published marginals and permitted feature profiles. Observed hashes belong to acquisition receipts.
- [Technical experiment plan](experiment-plan.md): separate NHAMCS recorded-acuity and DDXPlus conversation experiments, leakage controls, model comparisons and evaluation gates.

- [Implemented research pipeline](research/README.md): external Windows-compatible Python environment, acquisition, raw Stata decoding, leakage controls, deterministic grouped partitions and synthetic tests.
- [Frozen Phase 2 baseline protocol](baseline-protocol.md), [settings](baseline-protocol.json) and [preflight findings](reports/2026-10-19-phase2/README.md): freeze-time offline-only GO; subsequent training is recorded below.
- [Actual Phase 3 training/evaluation](reports/2026-10-19-phase3/README.md): 60 configurations, 12 fitted pipelines, one-time locked evaluation and research model cards; clinical use NO-GO.
- [Phase 4A error audit and independent validation design](reports/2026-10-19-phase4a/README.md): cached errors, feature/target suitability, nine-source feasibility matrix, draft study and risk register; v1 preserved, no training or inference integration.
- [Actual Phase 1 findings](reports/2026-10-19-phase1/README.md): 16,025 visits, 10,207 labelled, exact published reconciliation, data-quality/provenance/split reports and safe receipt summaries.

NHAMCS raw records and private split assignments were acquired/generated **outside Git**. DDXPlus/MIMIC demo were verified through metadata only. Phase 3 fitted model/calibrator artifacts and private predictions also remain outside Git. No inference integration was enabled. Full credentialed MIMIC datasets remain excluded. Open access does not remove licensing, confidentiality, attribution or intended-use limits.

Use the [main research register](../../docs/research-and-validation.md) for broader evidence governance and the [roadmap](../../docs/roadmap.md) for work sequence. The user-reviewed Phase 2 freeze addresses Phase 1 blockers through a primary binary all-labelled study and secondary uncalibrated five-class exploration, preserving both existing splits. Phase 3 executes that freeze; Phase 4A audits cached errors and defines independent-study gates. Next: review the new task/rubric, reviewer roles and source rights before a separate offline conversation harness. Do not retune on the opened test. Clinical/home inference remains NO-GO.
