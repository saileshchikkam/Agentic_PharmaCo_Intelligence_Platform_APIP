# Architecture and implementation status

Last inspected: 2026-10-17. The current shell presents welcome, sign-in, patient-home, a guided fictional MedAssist symptom conversation, and fictional ADR drafts plus an explicit developer-reference route. MedAssist preserves page-memory answers and optionally uses local Ollama to select source quotes. It offers a location-only Maps search handoff; model-driven urgency, tailored precautions, and clinical validation are absent. The ADR preview uses browser-local fictional drafts. Neither task preview is a protected clinical workflow. Local email/password authentication, cookie sessions and SQLite profiles now work in development. The optional Supabase client/RLS schema remain prepared; hosted setup is unverified.

## Current repository

- [src/main.tsx](../src/main.tsx) mounts React; [src/App.tsx](../src/App.tsx) owns shared appearance and hash navigation between welcome, sign-in, patient-home, MedAssist, ADR-intake, and developer-reference previews.
- [Access preview](../src/features/access/README.md) documents the three sign-in workspace views, patient task choices, local-only feedback, and absence of authentication.
- [MedAssist implementation guide](../src/features/medassist/README.md) documents the English-only symptom/follow-up/review flow, original answers versus confirmed AI quotes, cancellation, and location-only Maps handoff. [server/medassist.ts](../server/medassist.ts) registers a loopback-only local-model endpoint with strict schemas and no clinical assessment. Its parser precedes the older server's global parser; existing experimental agent endpoints are not reused or certified by this feature.
- [Shared preview layout](../src/features/access/PreviewLayout.tsx) provides text-style Home/patient/Log in links, inline appearance controls, and a fixed-position page Back row across access and developer-reference screens. ADR review/editor steps provide that row with their internal return action.
- [src/features/access/navigation.ts](../src/features/access/navigation.ts) marks in-app hash-history entries, provides a shared Back behavior, and replaces direct-entry routes with safe parent fallbacks when no prior APIP screen exists.
- [src/DeveloperReference.tsx](../src/DeveloperReference.tsx) preserves Domain Components, Core Components, and Design Tokens, reached through an explicit preview link.
- [src/components/material](../src/components/material) contains the current demonstration and core/domain wrappers.
- [src/components/material/ReportReactionView.tsx](../src/components/material/ReportReactionView.tsx) contains the English/Telugu fictional ADR draft and review preview at `#/preview/adr-report`. The patient reviews and explicitly confirms the summary before it saves a versioned draft in browser storage. User confirmation is distinct from professional review. It does not transmit, authenticate, submit, or add a case to professional records.
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

- The new ADR draft prototype supports multiple browser-local fictional drafts. It is not authenticated, isolated between users, encrypted by APIP, or suitable for real patient data; anyone using the same browser profile can access the drafts.
- The earlier demo's mock cases remain separate from the ADR draft and do not receive it.
- Cases use mock/browser state, not a server-backed database.
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
