# Analytics and data-source governance

Proposed stage 3E. No ingestion or public dashboard is authorized. [Master](../../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md), P18 and P19 govern implementation.

## Internal analytics

Separate operational workflow metrics from clinical-content cohorts. Private drafts are excluded by default. Review assignment does not grant global aggregate access. Approve permitted roles, consent/cohort eligibility, retention and export scope first.

Define unit, denominator, timeframe, eligibility, timezone and metric version for every chart. A report, revision, medication mention and review episode are different units. Count logical cases at a declared snapshot cutoff; specify follow-up deduplication, multiple medicines/events, missing values and withdrawn sharing.

Use deterministic PostgreSQL/TypeScript computation. No LLM arithmetic. Suppress small cells and complementary/differencing disclosures across filters and exports under an approved threshold. No threshold is invented. Aggregate permissions confer no row-level drill-through.

## External source candidates

- FDA quarterly spontaneous-report releases, historically FAERS, and openFDA drug-event API. Verify current publisher naming/schema at implementation. These sources may overlap; do not treat them as independent reports.
- EMA EudraVigilance/ADRreports public outputs, under approved access and interpretation conditions. A public portal does not establish an unrestricted bulk API.
- DailyMed SPL labels for evidence/context, separately from spontaneous-report counts.
- Official Indian IPC/PvPI publications and regulator safety notices after exact source, rights and reuse conditions are approved. No private national-database access is assumed.

Keep public-source data separate from APIP private records. Spontaneous reports can be incomplete/duplicated and lack exposure denominators. Counts and proportions do not establish incidence, comparative drug risk or causality. Do not pool APIP and external counts into an incidence figure.

## Proposed architecture, data and APIs

Approved registry → immutable release/checksum → versioned normalization/deduplication → deterministic metrics → permissioned display with provenance.

Proposed objects are source_registry, dataset_releases, ingestion_manifests, normalized_external_reports, deduplication_decisions, metric_definitions, approved_cohort_snapshots, aggregate_results and query_audit.

Record source URI, retrieval time, publisher release, rights decision, schema/metric version, checksum, jurisdiction and coverage. Preserve raw releases and follow-up lineage; never silently merge patients.

Proposed namespaces are /api/analytics/internal/metrics and /cohorts, /api/analytics/external/sources and /reports, and bounded POST /api/analytics/queries. Private ingestion commands require an operator capability. No unrestricted SQL or patient-level export endpoint.

Separate ingestion, computation and read roles with private schemas/RLS. No administrator/service credentials enter the browser.

## Screens, risks and gate

Screens are operational metrics, authorized cohort explorer, external explorer and source/release/limitations details. Every visualization identifies units, denominator, source, time range and freshness.

Tests use fixed fixtures for counts, deduplication, follow-ups, unknowns, schema drift, rollback/replay and stale/withdrawn releases. Test small-cell/differencing attacks, forbidden drill-through, export scope and 320/360/820/1440px accessibility.

Accept only reproducible results with approved rights/cohorts and visible limitations. Exclude private-draft inclusion, unapproved bulk ingestion, public internal dashboards, clinical conclusions and LLM statistics.

## Authoritative planning references

- [FDA quarterly source](https://www.fda.gov/drugs/fda-adverse-event-reporting-system-faers/fda-adverse-event-reporting-system-faers-latest-quarterly-data-files)
- [FDA limitations](https://www.fda.gov/drugs/cder-small-business-industry-assistance-sbia/audio-transcript-faers-public-dashboard-and-its-value-pharmaceutical-industry)
- [openFDA endpoint](https://open.fda.gov/apis/drug/event/how-to-use-the-endpoint/)
- [EudraVigilance context](https://www.adrreports.eu/en/eudravigilance.html)
- [DailyMed services](https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm)

References establish candidate interfaces/context, not licensing approval, completed ingestion or clinical qualification.
