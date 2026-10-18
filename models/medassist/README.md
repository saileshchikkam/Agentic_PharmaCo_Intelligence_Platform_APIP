# MedAssist ML research

This directory contains offline English-only, open-access research specifications and the implemented Phase 1 acquisition/profiling pipeline. It does not configure the running application or enable clinical inference.

- [Verified dataset manifest](open-access-manifest.json): pinned sources, access/terms, target codes, published marginals and permitted feature profiles. Observed hashes belong to acquisition receipts.
- [Technical experiment plan](experiment-plan.md): separate NHAMCS recorded-acuity and DDXPlus conversation experiments, leakage controls, model comparisons and evaluation gates.

- [Implemented research pipeline](research/README.md): external Windows-compatible Python environment, acquisition, raw Stata decoding, leakage controls, deterministic grouped partitions and synthetic tests.
- [Actual Phase 1 findings](reports/2026-10-19-phase1/README.md): 16,025 visits, 10,207 labelled, exact published reconciliation, data-quality/provenance/split reports and safe receipt summaries.

NHAMCS raw records and private split assignments were acquired/generated **outside Git**. DDXPlus/MIMIC demo were verified through metadata only. No model, checkpoint, training or inference integration was produced. Full credentialed MIMIC datasets remain excluded. Open access does not remove licensing, confidentiality, attribution or intended-use limits.

Use the [main research register](../../docs/research-and-validation.md) for broader evidence governance and the [roadmap](../../docs/roadmap.md) for work sequence. Phase 1 review is required before baseline training: rare Immediate support, symptom-filter selection and unproven feature timing block executing the original five-class protocol unchanged.
