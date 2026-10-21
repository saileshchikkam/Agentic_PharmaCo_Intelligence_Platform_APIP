# MedAssist research risk register — Phase 4A

All owners below are required roles, **not confirmed appointments**. No clinical risk is closed by this engineering review. Priorities describe research gating, not an institutional risk rating. Review with the [study design](validation-study.md), [dataset matrix](external-datasets.md) and [error analysis](error-analysis.md).

| ID / priority | Risk and observed evidence | Required control / owner role | Status / gate |
| --- | --- | --- | --- |
| R01 Critical | ED IMMEDR misrepresented as home urgency | Separate task/reference labels and no automatic category mapping; clinical lead + research lead | Open; blocks clinical inference |
| R02 Critical | Rare danger cases missed: primary seven raw Immediate misses, secondary ten exact errors | Independently reviewed warning-sign study, meaningful subgroup support, reviewed harm endpoints; emergency/paediatric reviewers | Open; no clinical operating point approved |
| R03 High | Opened test reused for threshold/model selection | Preserve v1 and caches; post-hoc report labels, new untouched study before revisions; research engineer | Controlled for this audit, ongoing boundary |
| R04 High | Leakage through retrospective coding, imputed demographics, hidden simulator labels or future disclosures | Prediction-time ledger, oracle separation, frozen input schema/source provenance tests; data engineer | Partially controlled in v1; home timing unresolved |
| R05 High | Missing/uncertain measurements mistaken for normal; absent danger question treated as no | Explicit missing/declined/unasked/contradictory states; device/unit/time provenance and reviewed response; clinical + data leads | Open for future home study |
| R06 High | Abstention hides emergencies: primary 48 high/four Immediate abstain | Unconditional detection alongside selective metrics; approved response semantics and failure handling; clinical + evaluation leads | Measured offline, unresolved clinically |
| R07 High | Over-triage burden: primary 956 false positives | Separate burden endpoint and clinically approved tradeoffs; never optimize on old test; primary-care reviewer | Open |
| R08 High | Claimed certainty despite singleton strata and small subgroups | Preserve suppressed intervals; prospective independent support and cluster-aware methods; statistician | Open; no superiority/all-age claims |
| R09 High | US ED selection, target nonresponse and RFV restriction distort population | Separate population/source analyses; India/local-context independent validation; epidemiology/clinical reviewers | Open; transportability unestablished |
| R10 High | Synthetic/reconstructed labels mistaken for clinical outcomes | Source-type tags, separate pipelines/reports, clinician reference review; research lead | Documented boundary; ongoing gate |
| R11 High | Public dataset licence overinterpreted; sensitive posts republished | Pin versions/terms, resolve third-party and noncommercial rights, no case-text publication; data steward | Conditional sources remain blocked for reuse |
| R12 High | LLM invents findings, prescribes or reassures unsafely | Blinded clinical response audit, source quote separation, explicit uncertainty, frozen parser/mapper and adversarial fixtures; safety reviewer | Not evaluated in Phase 4A; blocks clinical claims |
| R13 High | Reviewer availability/scope mistaken for independent sign-off | Verify roles/qualifications, conflicts, two independent ratings plus adjudication and specialty coverage; project + clinical leads | No study sign-off obtained |
| R14 High | Repeated/published cases or LLM contamination inflate validation | Case/patient/source-family grouping, provenance and exposure ledger, new hidden independently authored cases; evaluation lead | Planned; no independent test assembled |
| R15 Medium | Nearest facility mistaken for appropriate emergency or specialist care | Separately review local pathways/capability and consent; offline navigation tests; clinical/navigation leads | No routing rules approved |
| R16 High | Data/model leakage into Git, served paths or unauthorized providers | External storage, explicit allowlisted aggregates, protected-file hashes and no hosted record transfer; engineer + data steward | Checked for this audit; no broader security certification |
| R17 Medium | Mutable metadata/API version or unsafe deserialization undermines reproducibility | Pin/check sources before acquisition; joblib only trusted pre-existing local array caches, never downloaded pickle/models; research engineer | Local cache boundary tested; future source pinning pending |

Phase 4B should close reference-task, reviewer, source-rights and harness gates first. Keep unresolved risks visible; do not relabel “not evaluated” as passed. No new model, clinical rule or real-patient data collection is enabled by this register.
