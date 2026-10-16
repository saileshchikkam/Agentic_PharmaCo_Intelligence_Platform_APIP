# Architecture and implementation status

Last inspected: 2026-10-16. Application baseline: `5400696`. Documentation cleanup changes no application code.

## Current repository

- [src/main.tsx](../src/main.tsx) mounts React; [src/App.tsx](../src/App.tsx) selects the Material showcase, patient, reporting, records, and token views. The initial tab is the domain-component showcase.
- [src/components/material](../src/components/material) contains the current demonstration and core/domain wrappers.
- [src/design-system](../src/design-system) registers Material Web and defines tokens; [src/index.css](../src/index.css) provides styles.
- [src/components](../src/components) also contains an earlier UI generation and experimental integrations. Their presence does not mean they are mounted by the current app.
- [src/mockData.ts](../src/mockData.ts) and [src/types.ts](../src/types.ts) provide demonstration data and case types.
- [server.ts](../server.ts) hosts Express and development Vite middleware, or built static assets under `NODE_ENV=production`.
- [package.json](../package.json), [bun.lock](../bun.lock), and TypeScript/Vite configuration define the toolchain.

## Experimental endpoints

```text
GET  /api/health
POST /api/agents/report-extract
POST /api/agents/validate
POST /api/agents/knowledge-rag
POST /api/agents/causality
POST /api/agents/orchestrate
```

Extraction/generation optionally use Gemini. Validation includes completeness checks. Knowledge is an embedded lookup plus optional generation, not a verified ingestion/vector-retrieval pipeline. Causality uses heuristics and simulated statistics. Orchestration calls these endpoints sequentially.

These observations are not validated clinical capabilities or a committed production API contract. The configured provider model and successful execution remain unverified.

## Baseline limitations

- The active reporting demo constructs a fixed example case rather than a persistent patient-report workflow.
- Cases use mock/browser state, not a server-backed database.
- Authentication, permissioned review, durable audit, and official integrations are not established.
- Patient assistance, scores, evidence text, reviewer identities, and compliance labels include illustrative behavior.
- Database migrations, a test suite, and CI are absent from the inspected baseline. `lint` checks `src`, not the full server.
- Successful install, clean build, runtime operation, and deployment remain unverified.

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
