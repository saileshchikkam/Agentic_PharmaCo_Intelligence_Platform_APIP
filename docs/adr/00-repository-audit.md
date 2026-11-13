# ADR-0 repository audit

Inspection date: 2026-11-03. Method: static local source/document inspection, Git metadata, read-only GitHub PR metadata and an in-memory SQLite capability query. Runtime functionality below means **implemented in inspected code**, not newly runtime-verified. Historical test reports are not fresh passes.

## Baseline and preservation

- Checkout: `codex/medassist-v2-task5a-adapter`, HEAD `161a14cce8e3923ff7beed8f10ca225b5156d246`.
- Reviewed origin: [canonical repository](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP). Local HEAD is not assumed to equal GitHub main or any PR head.
- At task start: no tracked changes or staged files reported; untracked `app/` and `requirements.txt` already existed. Their contents were not used as delivered functionality and were left untouched.
- [PR #2](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP/pull/2) metadata verified open, draft and unmerged. Its head is `codex/medassist-emergency-recognition`, separate from this checkout. Its reported independent gates remain NO-GO; no PR content is merged or requalified here.
- No application edits, provider inference, model loading/training, persistent database access/migration, large downloads, branch creation, commit, push, merge or deployment.

## Frontend — implemented foundation, partial ADR product

[package.json](../../package.json) declares React 18, TypeScript 5, Vite 6, Material Web 2.5, Tailwind 4, Motion, Lucide and Recharts. [main](../../src/main.tsx) mounts React; [App](../../src/App.tsx) selects hash routes and appearance. [DeveloperReference](../../src/DeveloperReference.tsx) preserves the design showcase; visibility is not role authorization.

[Material imports](../../src/design-system/material-web-imports.ts) register official buttons, fields, checkbox/radio/switch, select, tabs, chips, lists, dialogs and progress. [Core wrappers](../../src/components/material/core/index.ts) and [domain components](../../src/components/material/domain/index.ts) are useful presentation primitives; labels such as reviewed/compliant do not prove backend capability. Prefer these over the older `src/components/ui/` generation.

[AdrWorkspace](../../src/features/adr/AdrWorkspace.tsx) and [ReportReactionView](../../src/components/material/ReportReactionView.tsx) implement fictional intake, list, review, explicit user confirmation, unsaved-change guards and save/delete failure handling. [accountDraft](../../src/features/adr/accountDraft.ts) has strict commands; [draftStorage](../../src/features/adr/draftStorage.ts) is a separate shared-browser collection. Account mode does not silently fall back or import that collection. The current five statement keys are `source`, `medicineName`, `dose`, `reaction`, `onset`; the last four are not a complete ADR case schema.

**Mock/experimental:** [mockData](../../src/mockData.ts), [SafetyDashboardView](../../src/components/SafetyDashboardView.tsx), [SafetyRecordsView](../../src/components/material/SafetyRecordsView.tsx), and [CaseDetailModal](../../src/components/CaseDetailModal.tsx) include illustrative causality, signals, reviewer/compliance labels and XML export. CaseDetailModal builds XML with string interpolation and defaults; no official-schema validation or escaping assurance was established. These outputs must not be reused as genuine E2B exports. See the [ADR storage limits](../../src/features/adr/README.md).

## Backend and routes

[server.ts](../../server.ts) creates Express, local routes and Vite middleware in development; production serves built assets. [server-entry](../../server-entry.ts), [launcher](../../scripts/start-server.mjs) and [runtime](../../server/runtime.ts) enforce explicit development/production modes. Development binds loopback/port 3000. No independent ADR modular backend currently exists.

Implemented route families:

- `GET /api/health`: process/configuration status; not proof of provider availability or database readiness.
- `/api/account/session`, `/signup`, `/signin`, `/signout`, `/profile`, `/profile/delete`, `/drafts`, `/drafts/save`, `/drafts/delete`: local account/profile/draft service; methods and rules in [local guide](../../database/local-development.md).
- `POST /api/medassist/structure`: bounded local quote-selection experiment in [medassist.ts](../../server/medassist.ts).
- Development-only research proxy registered by [model-a-demo.ts](../../server/model-a-demo.ts): inspect there for the current research routes, not ADR contracts.
- Legacy `POST /api/agents/report-extract`, `/validate`, `/knowledge-rag`, `/causality`, `/orchestrate`: gated by [legacy-access](../../server/legacy-access.ts), off by default and always unavailable in production. Host/Origin/socket restrictions are laboratory access controls, not case ownership or professional authorization.

Legacy inspection findings:

- Extraction optionally invokes Gemini; fallback extraction is experimental. It does not produce the proposed versioned, source-span-validated ADR proposal contract.
- Validation checks coarse truthiness, calculates a heuristic completeness index and labels results regulatory compliant. This is **not** validated regulatory completeness; age zero and unknown representations need explicit handling.
- Knowledge uses `DRUG_SAFETY_DB`, substring matching and optional Gemini generation. Empty drug input can match a dictionary entry because substring matching accepts an empty string. Generated approximate references and text implying VigiBase/FAERS cross-reference are not actual retrieval receipts.
- Causality computes heuristic Naranjo/WHO-UMC categories and a `Math.random()` simulated PRR. No measured safety signal or independent expert assessment follows from these outputs.
- Orchestrator fetches its own HTTP routes sequentially, consumes extracted values directly, generates a random case number, and has no durable case revision, job journal or human confirmation boundary. It is not the proposed orchestrator.

Leave the legacy namespace guarded; do not extend it into the ADR product.

## Identity, storage and migrations

[local-account.ts](../../server/local-account.ts) uses Node `node:sqlite`, salted scrypt password hashing, random session tokens stored as hashes, eight-hour sessions, HttpOnly/SameSite=Strict cookies and exact local Origin checks on mutations. Cookie path is **`/api/account`**. Protected draft/profile routes require a matching `X-APIP-Account`; the header detects account changes but **does not authenticate**. SQL predicates derive owner from the session. Draft saves enforce revisions, a 200-draft cap and bounded same-payload replay. Role provisioning/assignment is absent.

Existing SQLite `user_version=2` tables: `local_users`, `local_sessions`, `local_profiles`, `local_adr_drafts`. Profiles and drafts use JSON payloads plus revision metadata; draft primary key is `(user_id,id)`. Foreign keys, WAL and busy timeout are enabled. Store defaults outside Git; no application at-rest encryption or durable case audit exists. Profile deletion does not delete drafts. Schema initialization is inline, not a versioned ADR migration runner.

[account client](../../src/features/account/client.ts) also has an optional configuration-gated Supabase adapter. [account-schema.sql](../../database/account-schema.sql) is a fresh-project PostgreSQL bootstrap for `patient_profiles` with owner RLS/column grants and revision trigger, **not evidence of an applied hosted migration**. That adapter has no ADR repository. No Supabase setup, project query or advisor run occurred here. Hosted provider state is unverified and not needed for the selected local plan.

**Missing:** multiple suspect medicines/events, immutable case versions, confirmed-field ledger, reviewer role/grants, audit events, durable executions, approved evidence documents/chunks, retrieval citations, source-grounded analyses and authoritative exports/analytics.

## LLM, retrieval and MedAssist reuse

[groq-extraction.ts](../../server/groq-extraction.ts) already implements server-only transport, hash-bound selection/prompt/schema checks, request caps, timeouts, response limits and diagnostic categories for a narrow MedAssist task. [medassist-ai.ts](../../server/medassist-ai.ts) wraps its selected provider. These are inspected integrations, not permission to call Groq or transferable ADR qualification. Its short-input/domain constraints do not fit full ADR narratives without separate adapter and ADR evaluation.

Local Ollama extraction code and research FastAPI adapters exist separately. They do not establish a deployed clinical service. [model catalogue](../../models/README.md) contains dated inventory/candidate decisions; installed model availability and licence/digest were not freshly verified. No vector client/index, approved medical ingestion pipeline or ADR embedding model was established in the inspected application code. Dependencies have no dedicated vector database, job broker or ADR JSON-schema validator.

Reuse **patterns**: exact-source quote checks, explicit UNKNOWN, confirmation UX, timeout/cancellation/error categories, correlation IDs and Material wrappers. Reuse shared account infrastructure via a controlled seam. Do not import MedAssist vocabulary, clinical interpretations, safety policy, selection receipts or frozen model artifacts into ADR. Default extractor and Model B remain unchanged.

## Infrastructure and verification gaps

- Node `v24.19.0` and Bun `1.4.3` were observed. A temporary in-memory query reported SQLite `3.53.3`, `ENABLE_FTS5=1`; no persistent database was opened. This establishes compiled capability, not ingestion/retrieval correctness.
- `build` bundles Vite frontend plus esbuild server; `lint` is frontend `tsc --noEmit` (`tsconfig.json` includes `src` only). `tsconfig.node.json` currently includes only `vite.config.ts`. Neither is a full server/shared type check or security verification.
- Existing scripts include account, SQL/RLS, legacy-security, ADR browser fixtures and many MedAssist tests. None rerun for ADR-0; no training/heldout evaluation invoked.
- `.env.example` documents empty browser/provider settings and guarded experiments; server settings are process variables, not automatically loaded from `.env`. Actual secrets/configuration were not read.
- No tracked `.github` CI directory, deployment manifest or ADR migration directory was found in the inspected inventory. This does **not** prove no external CI, Firebase/Vercel service or running deployment exists. Cloud service inventory and credentials were not accessed.
- Clean install, production authentication, persistence restore, HTTP negative tests, frontend geometry/accessibility and live provider availability are unverified in this turn. Architecture decisions must not be described as passing those gates.

## Dependency decisions

Reuse Node/React/Material Web/Express/SQLite; add no new datastore or framework. Propose a pinned `zod` dependency for shared runtime contract validation only after ADR-1 authorization, with lockfile review. SQLite FTS5 replaces the need for an initial embedding download/vector service. Export MVP is versioned JSON plus escaped printable HTML/browser Save as PDF; a dedicated PDF library is stretch. Durable jobs use SQLite execution rows, not Redis. See [architecture](01-system-architecture.md) and [RAG](04-llm-rag-design.md).
