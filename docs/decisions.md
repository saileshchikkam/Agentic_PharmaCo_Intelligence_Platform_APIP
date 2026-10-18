# Decisions

**Confirmed** means directly established by the user, not implemented or clinically validated. Engineering recommendations stay proposed until selected.

## DEC-001 — Mission and name

**Confirmed 2026-10-16; origin described as September 2024.** APIP means Agentic Pharma Co-intelligence Platform. Easy suspected-ADR reporting is the core; technology serves the workflow. This supersedes older APP/Pharma Intelligence naming. Original mission notes lacked reliable dates; none are invented.

## DEC-002 — Connected layers and audiences

**Confirmed 2026-10-16.** MedAssist supports the care journey; reporting/professional intelligence remains most of the scope. Direct reporting must work. Shared context retains provenance and confirmation. Manufacturers/researchers receive information only through appropriate permissions.

## DEC-003 — Strict Material 3

**Confirmed 2026-10-16.** Follow Material Design 3 and Material Web. Preserve the existing demo as design reference, not implemented product. Verify accessibility and responsive behavior.

## DEC-004 — Progressive AI and human review

**Confirmed direction 2026-10-16.** Build useful functions before coordinating Reporting, Validation, Knowledge, and Analysis agents. Preserve MedAssist's custom-ML goal while selecting the task/data before training. RAG retrieves evidence; code calculates statistics. Human confirmation/review stays explicit.

## DEC-005 — Documentation with code

**Confirmed 2026-10-16.** Keep concise, useful docs, a navigable README, layer specifications, and dated history. Update docs with meaningful code changes and commit together. Use milestones rather than a fixed-duration label; consolidate duplicate templates after preserving useful content.

## DEC-006 — Automatic completion commits and cloud backup

**Confirmed 2026-10-16.** The user authorizes routine commits and GitHub pushes after completed, checked APIP changes without repeated requests. Task-owned files and their documentation are committed together. A repository-local completion helper and post-commit hook implement the workflow; they preserve unrelated work and report blocked sync. No background file-save watcher, force-push, destructive conflict resolution, or approval bypass is authorized. See [workflow setup](../scripts/README.md).

## DEC-007 — Bilingual fictional-case evaluation

**Confirmed 2026-10-16.** The user selected English plus Telugu, using fictional cases, for the first version. Include Telugu script, transliteration, and mixed-language behavior in evaluation; do not infer Telugu capability from English results. Mahesh is subsequently identified as the pharmacy reviewer; agreed review scope and qualified bilingual review remain open.

The initial budget reply was `500`; the user subsequently confirmed rupees. See DEC-008 for the current spending/model policy.

## DEC-008 — Local-first models and bounded provider evaluation

**Confirmed direction 2026-10-16.** Use local models for development/testing and support optional hosted APIs where needed, with API-based deployment preferred subject to evaluation, budget, and readiness. The planning ceiling is INR 500 monthly. Keep model/provider settings and evaluation records under `models/`; Ollama weights and credentials stay outside Git. Compare models by task/evidence rather than quantity. Do not assume a free model download or consumer service includes unlimited API inference.

Five installed models were inventoried and two received tiny fictional extraction checks; these observations are not clinical validation or an overall benchmark. No additional weights, provider accounts, purchases, or live application adapters were established. See the [model catalogue](../models/README.md).

## DEC-009 — Review responsibilities with limited availability

**User clarification 2026-10-16.** Sailesh identifies Mahesh P as the pharmacy reviewer and may arrange targeted/final checks; routine availability is limited. Codex performs engineering/evidence checks and prepares review packets, but does not provide human clinical sign-off. Fictional-case software work can proceed while review is arranged. Clinical labels/guidance and live inference require appropriate qualified review; model agreement or AI critique does not replace it.

Sailesh identifies MALADE as project inspiration and plans to share exact references. A likely matching author repository/paper was located and recorded in [research](research-and-validation.md#malade-reference-candidate); no code was copied or integration adopted.

## DEC-010 — Groq free-tier evaluation

**Confirmed direction 2026-10-17.** The user approved Groq's free tier as an APIP option and requested medical-model availability research. Prioritize a bounded Groq evaluation after account access is established; no account/key or live adapter was enabled by the research task. Exact model selection remains proposed. Current public Groq models are general-purpose, not verified dedicated medical specialists.

The live Hugging Face pricing page now lists no included free-user Inference Providers credits; this supersedes the earlier USD 0.10 planning assumption. Keep free local weights, limited hosted demos, and metered routed APIs distinct. See [dated access findings](../models/README.md#medical-models-and-free-access--checked-2026-10-17). No additional model download or paid hosting is selected by this decision.

## DEC-011 — Browser-local drafts are fictional-only

**Implementation boundary 2026-10-17.** The first ADR draft slice uses versioned browser `localStorage` to demonstrate save/reload behavior with fictional cases. It has no identity, access control, server copy, or APIP-managed encryption and must not hold real patient data. Replace it with authenticated, audited server persistence and user-level isolation before any real patient workflow.

## Open engineering proposals

- Modular TypeScript application, PostgreSQL, possible pgvector index, private storage, and durable jobs: see [architecture](architecture.md).
- Restricted synthetic-data evaluation pilot as first release; final real-data/launch scope is unselected.
- Intended population, Telugu clinical wording/review, hosting region, selected providers, runtime/package manager, retention, and agreed reviewer availability/scope.
- Small local Qwen instruction model, hosted Gemini Flash comparison, multilingual E5 embeddings, and a scikit-learn ML baseline: candidates in the [AI implementation guide](ai-implementation.md), not selected or benchmarked production dependencies.
- Dataset licences, labels, training/evaluation protocol, and conditions for model-driven urgency.
- Official destinations, form versions, terminology rights, and external integrations.

## Recording future decisions

Append ID, actual date, status, concrete decision, rationale, material tradeoffs, and affected docs/commit/issue links. Mark superseded entries explicitly. A recommendation in a plan does not become accepted by repetition.

## DEC-012 — Developer reference and appearance before product expansion

**User clarification and implementation 2026-10-17.** The current screen is the development team's reusable Material 3 reference. Show component/token tabs, and retain earlier product prototypes outside the mounted shell. Default to clean white surfaces and blue highlights, with blue/black/green accents in settings and optional dark mode. Persist appearance locally without storing clinical data. Use the same colour source in components and the token inspector.

Developer-only login is a confirmed requirement and remains unimplemented. Define the rough application framework and access boundaries next, then continue backend/model contracts and connected product workflows phase by phase. Ask for the next selected task at each phase handoff; do not treat the roadmap as blanket permission.

## DEC-013 — Sign-in interface before authentication

**User-selected 2026-10-17.** Build a simple main-page entry and consistent Material 3 sign-in views for patient, specialist, and developer audiences. Preserve the developer reference as an explicitly unrestricted preview. Authentication, account creation/recovery, sessions, and verified roles are deferred; local form feedback must not claim account access. Use sample credentials only and do not send, log, or persist them in APIP. Ask the user which page to design after this sign-in task.

The access composition uses official Material Web controls, shared palette roles, responsive logical CSS sizing, and licensed self-hosted Google Sans Flex static cuts. Relevant sources and implementation choices are recorded in the [access guide](../src/features/access/README.md); full Pixel/M3 Expressive parity is not claimed.

## DEC-014 — Restrained Google-inspired appearance palette

**User-selected 2026-10-17.** Offer the familiar Google blue, red, yellow, and green as user-selectable primary highlights. Keep secondary, tertiary, and error roles independent so one choice does not turn the whole interface into a multicolour palette. Use charcoal grey surfaces in dark mode for comfortable viewing, and preserve old green/dark-mode preferences while migrating the retired black accent to blue.

This decision supersedes DEC-012's black accent and near-black dark surface treatment.


## DEC-015 — Shared preview navigation and page geometry

**User-selected 2026-10-17.** Keep a visible text-style Home link beside Log in and use the same page-level Back slot below the header throughout the website. Share one header, typography source, page width/gutters, and stable scrollbar allocation across patient/access and developer-reference routes. The Back slot has fixed dimensions even on the welcome page, where it contains no action. Readable inner form widths may vary without moving navigation. ADR Back resolves internal steps before route exits; native browser history continues to represent routes. Use official Material Web controls where provided and specification-based HTML links/page composition where there is no matching library primitive; retain accessible focus and reduced-motion support.

## DEC-016 — Confirm before deleting a saved draft

**User-selected 2026-10-17.** Give patients a way to remove an unwanted saved ADR draft, and ask them to confirm before deleting it. If deletion cannot be persisted, keep the draft and explain the error. The current design preview applies this behavior only to fictional drafts in the shared browser profile; account-level ownership and server deletion require the future authenticated backend.

## DEC-017 — MedAssist symptom scope and first local-model boundary

**User-selected scope, engineering implementation 2026-10-17.** MedAssist starts with current symptoms and follow-up context, then ultimately reviewed urgency, precautions, and facility navigation. It is a separate task from ADR extraction. The first connected fictional slice uses fixed follow-up questions and a local model only to select source quotes, preserving originals and requiring user confirmation; it cannot generate an urgency level or treatment advice. Keep the output contract and failure/cancellation behavior checked before expanding model responsibilities. Train/evaluate a narrow symptom-urgency model only with suitable permitted labels and review; a successful local LLM request is not that model. Maps receives only deliberately selected location information, never symptom narratives, and selection/directions occur in Maps until a verified facility API is implemented.

## DEC-018 — English-only, zero-paid-service scope and shared signup profile

**User-selected 2026-10-17.** Replace the earlier bilingual/INR 500 direction with English-only data/interface and no required paid services. All-age product intent includes parent/caregiver-managed child profiles and requires suitable per-population model evaluation. One account-backed, user-confirmed profile stores name/date of birth and optional health history, with per-layer sharing choices. Age is calculated at use time. Do not auto-train on records or promote profile text into clinical conclusions.

The implementation foundation uses Supabase Auth/Postgres with PKCE, publishable browser configuration and owner RLS, prepared without provisioning a paid resource. Live setup remains pending. Existing browser-local ADR previews remain separate; profile availability is not permission to transmit to AI, share externally or import into reports automatically.

## DEC-019 — SQLite accounts for zero-cost local development

**User-authorized 2026-10-18.** Connect local database and authentication without provisioning cloud resources. Because Docker/Supabase CLI are unavailable, use Node 24 SQLite with server-verified HttpOnly cookie sessions and scrypt password hashes. Share one profile contract with the optional Supabase adapter; do not silently synchronize databases. Restrict local routes to loopback development and disable them in production. Keep the database outside Git and synced project directories. No real-patient readiness, email verification or Google setup is implied.

## DEC-020 — Owner-isolated local fictional ADR drafts

**Implemented 2026-10-18.** Use the verified local account session for ADR ownership, additive SQLite schema v2 and server-controlled revisions/timestamps. Permit unfinished saves and separately confirmed drafts. Preserve reporter text and unknown values. Keep legacy browser drafts behind an explicit separate demo, with no automatic transfer or fallback on account failures. Supabase ADR storage, clinical case history, confirmed profile imports and hospital workflow remain pending. See the [ADR storage guide](../src/features/adr/README.md).

## DEC-021 — Explicit modes and closed legacy agent APIs

**User-requested 2026-10-18.** Disable legacy agents by default and prohibit them in production regardless of opt-in. Explicit local development experiments require loopback socket, exact Host/Origin and POST/JSON checks before providers/logic. Use same-origin requests and loopback development HTTP/HMR. Startup selects its mode explicitly, rejects ambiguity and permits deliberately configured production bind IP/port. Preserve experimental algorithms with non-clinical metadata; no validation is implied.

## DEC-022 — Open-access MedAssist experiments with separate labels

**User-selected 2026-10-19.** Use CDC NHAMCS 2022 public-use ED as the primary offline recorded-acuity candidate, DDXPlus English for separate synthetic symptom/questioning experiments and MIMIC-IV-ED Demo v2.2 only for schema/pipeline smoke checks. Exclude restricted datasets. Verify actual target/terms/timing; do not pool synthetic pathology severity with real acuity or claim ED predictions are validated home triage. Compare structured Logistic Regression, Random Forest and HistGradientBoostingClassifier with high-acuity/under-triage, calibration, uncertainty and subgroup evaluation. See the [plan](../models/medassist/experiment-plan.md). No acquisition, training or clinical integration was performed by this documentation task.

**Subsequent implementation evidence, 2026-10-19:** authorized [Phase 1](../models/medassist/reports/2026-10-19-phase1/README.md) now supplies actual NHAMCS acquisition/profiling outside Git and supporting metadata verification. Keep original target codes, unknowns and group isolation; rare-class and symptom-selection findings require review before training. Alternatives in that report remain proposals, not accepted label merges or clinical thresholds.
