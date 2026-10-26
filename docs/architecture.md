# Architecture and implementation status

**Emergency repair Phase 2, 2026-10-26: NO-GO.** The fresh 120-case evaluation has 24 emergency misses, seven false escalations and five ambiguous routine continuations (65.71% recall;86.79% precision on 102 binary cases). [Repair, exact evidence and review blockers](../models/medassist_ai/docs/emergency-phase2.md). PR #2 remains draft; Model B stays disabled. Earlier checkpoint entries retain their historical evidence.

**Latest safety milestone, 2026-10-26: NO-GO.** The original heart-attack/stroke declarations now escalate, but the separately authored 100-case evaluation has 25 emergency misses, five false escalations and three ambiguous routine continuations. [Results, state boundaries and blockers](../models/medassist_ai/docs/emergency-recognition.md). Rules remain provisional and clinically unreviewed; keep Model B disabled and the change in draft review. Earlier dated statements below describe historical checkpoints.
Last inspected: 2026-10-18. The current shell presents welcome, sign-in, patient-home, a guided fictional MedAssist symptom conversation, and fictional ADR drafts plus an explicit developer-reference route. MedAssist preserves page-memory answers and optionally uses local Ollama to select source quotes. It offers a location-only Maps search handoff; model-driven urgency, tailored precautions, and clinical validation are absent. The ADR preview now uses owner-isolated SQLite drafts for local accounts, with a separate optional browser demo. Neither task preview is a protected clinical workflow. Local email/password authentication, cookie sessions and SQLite profiles now work in development. The optional Supabase client/RLS schema remain prepared; hosted setup is unverified.

## Current repository

- **2026-10-25 conversational update:** [main-site chat and data flow](../src/features/medassist-conversation/README.md#current-conversational-experience--2026-10-25) preserve the existing Groq/Model A proxy boundaries while replacing research controls with conversational confirmation/context. Desktop/mobile assessment slots remain unassessed; independent provisional emergency checks and location-only Maps are separate. [Verification](../models/medassist_ai/docs/chat-verification.json) distinguishes actual inference, UI fixtures and remaining clinical blockers. Earlier dated overview text retains its historical scope.

- [MedAssist L2 conversational slice](../src/features/medassist-conversation/README.md), 2026-10-21: a DEV-only page inside the existing APIP shell offers explicitly limited fictional symptom phrases, confirmation and actual Model A adaptive questions through the guarded proxy. It preserves the existing handoff, hides coded IDs and keeps the developer lab separate. A qualified backend-only Groq provider can be explicitly enabled for fictional extraction with user confirmation; clinical assessment, precautions and hospital navigation remain unavailable. Full L2 remains incomplete pending evaluated language extraction and clinical wording review.

- [Fictional Model A question lab](../src/features/model-a-research/README.md), Day 2 on 2026-10-21: a DEV-only React/Material Web screen outside AccountProvider calls a development-only same-origin proxy (`server/model-a-demo.ts`). The proxy keeps the operator token server-side and talks only to the fixed loopback Python demo endpoints. The existing frozen selector and unchanged Day 1 handoff provide questions/evidence; no clinical Model B, patient navigation or production inference route is connected. The screen is pruned from production client assets; disabled/production proxy namespaces return 404 without contacting Python.

- [Model A research adapter](../models/medassist_v2/research_adapter/README.md) is a separate opt-in loopback FastAPI prototype for authored fictional coded inputs (Task 5A, 2026-10-20). It loads the preserved v2 selected model read-only and reuses frozen eligibility/features/scoring. It is not imported by Express or the patient UI, supplies no clinical conclusions, and does not access official patient archives or the locked-test ledger. The patch is pending review, not deployment.

- [Offline MedAssist research runner](../models/medassist/research/training.md) independently trains scikit-learn structured baselines using the frozen NHAMCS protocol. [Phase 3 results](../models/medassist/reports/2026-10-19-phase3/README.md) record 12 fitted pipelines with pre-test sealing and one-time evaluation; weights/predictions remain external. This is not an application backend or connected clinical inference service. Significant missed cases and false positives keep clinical use NO-GO.

- [src/main.tsx](../src/main.tsx) mounts React; [src/App.tsx](../src/App.tsx) owns shared appearance and hash navigation between welcome, sign-in, patient-home, MedAssist, ADR-intake, and developer-reference previews.
- [Access preview](../src/features/access/README.md) documents the three sign-in workspace views, patient task choices, local development authentication and the remaining specialist/developer permission gaps.
- [MedAssist implementation guide](../src/features/medassist/README.md) documents the English-only symptom/follow-up/review flow, original answers versus confirmed AI quotes, cancellation, and location-only Maps handoff. [server/medassist.ts](../server/medassist.ts) registers a loopback-only local-model endpoint with strict schemas and no clinical assessment. Its parser precedes the older server's global parser; existing experimental agent endpoints are not reused or certified by this feature.
- [Shared preview layout](../src/features/access/PreviewLayout.tsx) provides text-style Home/patient/Log in links, inline appearance controls, and a fixed-position page Back row across access and developer-reference screens. ADR review/editor steps provide that row with their internal return action.
- [src/features/access/navigation.ts](../src/features/access/navigation.ts) marks in-app hash-history entries, provides a shared Back behavior, and replaces direct-entry routes with safe parent fallbacks when no prior APIP screen exists.
- [src/DeveloperReference.tsx](../src/DeveloperReference.tsx) preserves Domain Components, Core Components, and Design Tokens, reached through an explicit preview link.
- [src/components/material](../src/components/material) contains the current demonstration and core/domain wrappers.
- [src/components/material/ReportReactionView.tsx](../src/components/material/ReportReactionView.tsx) contains the English-only fictional ADR draft and review preview at `#/preview/adr-report`. It supports unfinished account saves and explicit confirmation after review. User confirmation is distinct from professional review. The account workspace selects server persistence; the separate browser demo retains browser storage. Neither mode submits to professional records.
- [src/features/adr/draftStorage.ts](../src/features/adr/draftStorage.ts) validates draft schema v2 in a versioned browser-local collection, and loads previous single-draft v1/v2 keys into that collection in memory. Optional blank statements remain `null`; saved drafts can be deleted from the fictional list after confirmation. This storage is shared within a browser profile and provides no account isolation, so any user of that profile can view or delete its drafts.
- [src/design-system](../src/design-system) registers Material Web and defines tokens; [src/index.css](../src/index.css) provides styles.
- [src/components](../src/components) also contains an earlier UI generation and experimental integrations. Their presence does not mean they are mounted by the current app.
- [src/mockData.ts](../src/mockData.ts) and [src/types.ts](../src/types.ts) provide demonstration data and case types.
- [server.ts](../server.ts) hosts Express and development Vite middleware, or built static assets under `NODE_ENV=production`.
- [package.json](../package.json), [bun.lock](../bun.lock), and TypeScript/Vite configuration define the toolchain.

## Experimental endpoints

```text
GET  /api/health
POST /api/medassist/structure
POST /api/agents/report-extract
POST /api/agents/validate
POST /api/agents/knowledge-rag
POST /api/agents/causality
POST /api/agents/orchestrate
```

Extraction/generation optionally use Gemini. Validation includes completeness checks. Knowledge is an embedded lookup plus optional generation, not a verified ingestion/vector-retrieval pipeline. Causality uses heuristics and simulated statistics. Orchestration calls these endpoints sequentially.

These observations are not validated clinical capabilities or a committed production API contract. The configured provider model and successful execution remain unverified.

## Baseline limitations

- The ADR workspace supports multiple account-isolated fictional drafts in local SQLite. Its separate browser demo remains shared. Neither store is suitable for real patient data or encrypted at rest by APIP.
- The earlier demo's mock cases remain separate from the ADR draft and do not receive it.
- Earlier experimental cases use mock/browser state; local account ADR drafts use the server database.
- Local authentication and durable account profiles are implemented; hosted authentication/storage, permissioned review, durable audit and official integrations remain unverified.
- Patient assistance, scores, evidence text, reviewer identities, and compliance labels include illustrative behavior.
- A fresh-project SQL bootstrap and focused account/MedAssist/navigation tests now exist; applied migrations and CI are absent. `lint` checks `src`, not the full server.
- Frozen install, frontend lint, and production build have passed in this checkout. Clean-clone setup, clinical functionality, and deployment remain unverified.

This describes the demonstration-to-product gap; it does not authorize repairing demo behavior without a selected task.

Before reusing experimental handlers, check runtime output schemas, missing-value handling, embedded/generated evidence, external-AI consent, input/output escaping, request limits, CORS, and authorization. Existing XML/export and compliance-labelled UI need independent validation before becoming product behavior. These concerns were identified during the earlier static review; this documentation pass does not claim a fresh security or clinical certification.

## Proposed application structure

The following remains a proposal:

- Retain React/TypeScript and Material Web wrappers.
- Modularize identity/access, patient/episode, reporting, documents, review, evidence, analytics, navigation, and orchestration.
- Use PostgreSQL for authoritative records and evaluate pgvector for an evidence index.
- Keep uploads/PDFs private with authorized access and retention rules.
- Use durable jobs for indexing, documents, and agent execution.
- Isolate model/map providers with version records, timeouts, quotas, and visible failures.
- Keep ML training reproducible and separate; introduce inference after data/evaluation decisions.

Begin with a modular application. Split services only when justified. Record adoption in [decisions](decisions.md).

## Proposed shared data flow

An optional MedAssist episode can supply confirmed context to an ADR case. Draft, confirmation, report generation, review, and follow-up retain versions. Evidence/analysis reference an exact case version; changes invalidate dependent results.

Logical records include users/roles, organizations, profiles, consent, episodes, medication exposures, cases/versions, attachments, reviews, evidence sources/chunks, retrieval results, agent runs, and audit events. These are design needs, not existing tables.

Important fields retain origin, confirmation, uncertainty, and version. Missing differs from “no.” Repeated requests must not duplicate reports; follow-ups link to the original.

Medical-source retrieval, permissioned case retrieval, and operational analytics have different evidence/access rules. Patients must not retrieve others' records. New reports do not automatically train models or become approved knowledge.

## Document with implementation

Record new/changed endpoints, schemas, authorization, migrations, provider dependencies, stored/shared data, failures, and operational effects beside the real subsystem. Do not present an invented future API as live.

## Developer reference shell and appearance

The component reference is now a separate hash view alongside the rough welcome/sign-in front end. It has no login or developer-role enforcement. Hiding prototype tabs is presentation only and is not authorization. Introduce authenticated roles and protect both routes and relevant server actions before describing it as restricted.

[Design-system guidance](../src/design-system/README.md) describes the shared neutral surfaces, Google-inspired blue/red/yellow/green primary highlights, Chrome-like charcoal dark surfaces, browser preferences, and settings controls. `tokens.ts` is the colour source for the application and token inspector. Themes are applied before React mounts and update Material Web semantic CSS properties. Appearance preferences contain no clinical data.

## Account/profile foundation

[Account setup and contract](../database/README.md) documents Supabase Auth with PKCE, tab-scoped session storage, owner-enforced PostgreSQL profiles, optional history, per-layer sharing, source revision, conflict handling and deletion. The client has signup/sign-in/profile routes; the Supabase adapter requires valid public configuration, while development can use the local SQLite adapter described below. Task previews show opted-in profile context separately; they do not send it to models or persist task records to accounts. Specialist/developer roles are not granted by signup. Hosted connection, Google setup, real-user login and hosted isolation/advisors are pending.

## Local development account service

[Local account guide](../database/local-development.md) describes the connected SQLite backend in `server/local-account.ts` and the shared account-client interface. Server-verified cookie ownership protects each profile; the requested account header only checks tab consistency. Credentials/sessions are hashed, records remain local, optimistic revisions prevent silent overwrites, and production cannot enable the local adapter. Google/email verification and task-record persistence remain separate unfinished work. The optional Supabase backend retains its RLS contract.

### Local account ADR boundary

[AdrWorkspace](../src/features/adr/AdrWorkspace.tsx) selects the authenticated local repository and clears state between accounts. The [ADR storage guide](../src/features/adr/README.md) describes the strict contract, additive schema v2, API, revision checks, unfinished saves and separate legacy demo. Supabase ADR persistence and hospital case workflow remain pending.

## Runtime and legacy security boundary

`server-entry.ts` starts the server; `server.ts` exports API composition for focused integration tests. `scripts/start-server.mjs` selects development/production explicitly and rejects conflicting inherited modes. `server/runtime.ts` validates mode, bind host/port and opt-in. Development HTTP/HMR bind to loopback; production may explicitly configure a bind IP/port. Production never registers local account routes.

`server/legacy-access.ts` guards all `/api/agents/*` routes before parsing or execution: JSON 404 by default/production, even with opt-in. Opted-in development requires a trusted socket, exact Host/Origin and POST/JSON. `server/local-request.ts` shares account trust checks, ignoring forwarded identity headers. Global permissive CORS is removed. Allowed laboratory responses carry experimental/non-clinical metadata. Heuristics/random statistics remain unvalidated and unavailable in normal application operation. No clinical algorithm or MedAssist ML behavior was redesigned. See [runtime setup](development.md#legacy-api-security-boundary).

## Modular MedAssist composition — 2026-10-23

[Component architecture](../models/medassist_ai/docs/architecture.md) documents the opt-in existing-backend composition. It preserves routes and sealed artifact locations. Current [checkpoint evidence](../models/medassist_ai/docs/checkpoint-2026-10-25.md) distinguishes sealed question selection, deterministic/experimental Groq proposals, provisional independent safety and consent-based external Maps navigation. Disease/urgency execution stays disabled. Safety has known emergency misses; Maps supplies no verified facility listing or clinical suitability. These modules do not qualify the application for clinical use.

## Contributor backend integration boundary — 2026-10-26

The preserved standalone `app/` FastAPI/PostgreSQL backend and its archived disease model coexist in Git with APIP React/Express and the separate sealed Model A research adapter. They are distinct entry points and dependency environments. No APIP route is redirected to the contributor predictor, precautions or seeded hospitals; its import-time model loading/database creation is not activated. [Contributor context](contributors/jayanth-medassist-backend.md) and [main reconciliation evidence](reconciliation-2026-10-26.md) record provenance, unchanged files and the failing fresh-checkout protocol gate. Both histories are preserved in the integration branch; main merge remains blocked pending verification.
