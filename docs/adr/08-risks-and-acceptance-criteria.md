# ADR risks, gates and acceptance criteria

Status: ADR-0 planning complete; implementation and clinical validation absent. Checks here are future gates unless explicitly labeled observed. Engineering/evidence checks performed by Codex are **AI-assisted**, not human clinical sign-off.

## Top five project risks

1. **Access-control/session integration — high likelihood/high impact.** Existing local cookie path is narrow and professional roles/grants are missing. A login or bearer token alone cannot authorize a case. Mitigation: `/api/account/adr`, server session seam, owner predicates plus reviewer role+grant, nested-resource checks, reauthorization on worker commit, two-account/revocation/self-review negative tests. Owner: shared integrator + ADR foundation owner. Block ADR-2 until these pass.
2. **False clinical authority from legacy demos/LLM outputs — high/high.** Existing RAG can generate references and legacy causality uses simulated PRR; regulatory labels overstate capability. Mitigation: no legacy route/UI data reuse, separate original/proposed/confirmed/review records, deterministic validation, source-ID/hash resolution, extractive analysis, no causal/clinical conclusions. Owner: ADR contracts/agents owner; Mahesh for qualified clinical wording/source relevance. Block clinical guidance regardless of demo success.
3. **Ten-day capacity and parallel-file conflicts — high/high.** Broad workflow, one implementer and shared MedAssist branch leave limited integration time. Mitigation: 60 ADR-hour assumption, one shared-file owner, separate future worktree, daily dependency gates, no design-system/auth rewrite and strict cut order. Owner: Sailesh/project integrator. If hours or Day-3 foundation slip, explicitly reduce demo scope; no fabricated completion.
4. **Corpus permission/relevance and reviewer availability — high/high.** No approved indexed corpus is established; label availability is not licence, local applicability or evidence for the case. Mitigation: individually recorded rights/source versions and qualified relevance review, small allowlisted corpus, explicit no-evidence/fixture fallback and separate medical-grounding acceptance. Owner: corpus operator + qualified reviewer. Pending review prevents medically grounded/clinical readiness claims, but not fictional software work.
5. **Versioning, restart durability and faithful outputs — medium/high.** Existing drafts are mutable JSON without audit; async results, imports and exports can diverge. Mitigation: immutable content snapshots/projections, optimistic revisions, transactional audit/idempotency, bounded leased jobs, edit/withdrawal invalidation, consistent backup/restore and independent fixture reconciliation. Owner: ADR persistence/integration owner. Block demonstration acceptance on lost input, cross-version citations or inaccurate export/counts.

Additional risks: model licence/resources/latency unknown; Telugu language quality and bilingual wording unqualified; source changes/withdrawal; local unencrypted storage; prompt injection; missing hosted auth/retention/backups/incident response; no clinical authority/data-sharing rights. Keep local fictional-only operation and deterministic/manual fallbacks. INR 500 is a ceiling, not a purchase authorization or a guarantee that public services fit it.

## ADR-0 completion criteria and actual evidence

- Repository inspected: frontend/current routes, local identity/owner checks, SQLite tables, optional Supabase bootstrap, legacy agents/RAG/causality, provider transport, Material wrappers and setup/tests. Evidence links and limits in [audit](00-repository-audit.md).
- Ten ADR planning pages cover scope/modules/contracts/dataflow/schema/RAG/UI/integration/ten-day dependencies/parallel ownership/risks. Architecture, sequence and two state diagrams supplied.
- Observed: Node 24.19.0, Bun 1.4.3, in-memory SQLite 3.53.3 with FTS5 compile option; Git checkout/dirty baseline; GitHub PR #2 draft/open/unmerged. No claim that FTS retrieval, provider inference or app workflow passed.
- Documentation verification: see [actual dated outcome](../history/2026-11-03.md). No application tests/build rerun; no application behavior changed. Runtime/auth/security/clinical acceptance remains pending.
- New documents only; no application/model/policy edits, persistent migrations, live providers, downloads, deployment, commits/pushes/merges or branch creation. Existing untracked files preserved. Existing README/changelog/roadmap edits deferred because this request permits only new documents.

## ADR-1 entry decision

**GO for separately authorized ADR-1 engineering only**, restricted to fictional local cases and the foundation files/checks in [delivery plan](06-ten-day-delivery-plan.md). Architecture supplies a feasible path without new infrastructure. This is not authorization to start or a passed implementation gate.

Before first code edit, verify: current user authorization; fresh Git state/shared-file owner/base; Node/account schema and disposable-test setup; session-cookie routing plan; permission matrix; additive migration/backup plan; role bootstrap procedure; explicit language/provider/cost boundaries. Source rights review can begin in parallel but must not block save/reload foundation. If base/ownership is unresolved, work on independent ADR artifacts only and pause shared edits.

**NO-GO** for enabling clinical advice, autonomous diagnosis/causality, real-patient records, public hosting, regulator submission, Model B or research qualification. None is needed for ADR-1. Keep PR #2 draft and unmerged; independent MedAssist failures are not repaired by ADR architecture.

## Implementation acceptance gates

### G1 — durable and isolated foundation

Fictional owner can create/save/restart/reload/edit cases without text loss; unknown/false/zero/Unicode and multiple medicine/event entries preserved; stale edits denied; no unauthorized owner/nested-resource access; role+grant checks and revocation effective; duplicate commands replay once; audit failures roll back writes; migration and consistent restore verified. No source/agent work substitutes for G1.

### G2 — honest proposals and deterministic validation

Proposals contain valid source span/path/type, remain unconfirmed until owner action and stale after content edits. Invalid JSON/unanchored facts are rejected. Missingness/completeness/chronology rules have stable IDs, reproducible results and no regulatory-compliance claim. Unsupported language/provider failure leaves manual workflow available. Evaluate English, Telugu-script, transliteration and mixed-language separately; preserve unsupported text without interpretation. No inherited MedAssist qualification claimed.

### G3 — traceable knowledge and grounded analysis

Each approved source has rights/version/hash/review metadata; pending/withdrawn sources excluded. Queries use confirmed terms and never retrieve other cases. Citations resolve stored passages exactly. No evidence yields explicit abstention, not “not a known ADR.” Analysis separates reported facts, source excerpts and missingness with `clinicalConclusion:null`. No fabricated sources or causal claims accepted. Nonclinical fixture mode can pass engineering retrieval checks but **cannot** pass medical-reference readiness; report it separately.

### G4 — controlled workflow, human review and export

Bounded retries/leases survive restart; cancel/edit/revoke prevents late publication. Owner requests review; independent authorized reviewer can approve academic draft/request changes/comment on exact version, with missingness/evidence acknowledgements. Corrections preserve original text and historic decisions; new content invalidates approval. Export exactly reconciles to case version, source/proposal/confirmation/review records, long text/Unicode and multiple entries; malicious markup inert. Draft export labeled unreviewed; no submission/clinical approval claim.

### G5 — usable dashboard and integration

Material 3/official components reused; documented gaps; keyboard/labels/focus/reduced motion and 360/820/1440 responsive checks plus 320 overflow stress. Counts match fixture queries with period/scope/denominator, include unknown/not-checked states and never imply incidence/causality. Account changes clear UI data. Direct ADR works without MedAssist. Existing account/legacy-route restrictions remain passing; no protected MedAssist changes. Relevant frontend/backend/shared checks, build and ADR suites pass with actual evidence recorded.

### G6 — honest demo readiness

Runbook starts from a known fictional DB with provider mode explicit and no required paid/network inference. Demonstrate success, missing information, correction/review, provider outage, no-evidence, unauthorized access, restart and export. Report measured failures/limitations. Present separate results for **software workflow**, **approved-reference grounding**, **language extraction** and **clinical readiness**. A functioning fictional demo is not clinical validation. Missing required MVP features means reduced/incomplete demo, not a full pass.

## Deferred decisions and next action

No hospital form/SOP/role/escalation/retention policy is invented. [Hospital register](../hospital-requirements.md) remains the source of unresolved institutional requirements. Academic generic JSON/print export deliberately avoids asserting official form compliance. Qualified reviewer availability/scope, exact source set, runtime model licence/digest and any hosted provider remain unresolved prerequisites for their respective features, not blockers to local fictional persistence engineering.

Next action: review ADR-0 and explicitly authorize or revise ADR-1. ADR-0 ends here.
