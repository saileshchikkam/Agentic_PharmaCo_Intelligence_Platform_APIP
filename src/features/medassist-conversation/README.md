# MedAssist conversational research slice — L2 implementation 1

## Current checkpoint — 2026-10-25

The [consolidated status](../../../models/medassist_ai/docs/checkpoint-2026-10-25.md) and [latest understanding report](../../../models/medassist_ai/docs/symptom-understanding.md) supersede historical snapshots below. Current behavior uses document scrolling, one composer, explicit confirmation, up to eight topical Model A questions, deterministic/context-validated English proposals and bounded clarification. Export is `medassist.conversation-export.v2` with the unchanged 223-item `model-a-to-b.evidence.v1` nested inside. Provider retries are bounded and successful request replay is in process memory only. No new clinical capability is established. Provisional safety still misses the documented heart-attack and stroke declarations; Model B, personalized precautions and facility verification remain unavailable.

## Latest recognition repair — 2026-10-25

[Root causes, real before/after evidence and limits](../../../models/medassist_ai/docs/recognition-fix.md): the language catalogue now includes the existing general pain field, so tested stomach-pain/headache descriptions reach confirmation and actual pain questions. Coverage is 29 anchored concepts within the unchanged source schema, with no guessed anatomical code. Source-provided labels replace raw typed-choice codes. State-aware clarification stops equivalent/repeated unsupported wording and separates service, timeout, invalid-output and mapping failures; original wording and emergency precedence remain intact. Earlier 28-concept receipts below describe their historical snapshot. [Exact task inventory/checks](../../../models/medassist_ai/docs/recognition-verification.json).

## Latest: natural conversation and full-page scrolling — 2026-10-25

The [current behavior, coverage, verification and limitations](../../../models/medassist_ai/docs/natural-conversation.md) supersede the earlier same-day snapshot below. The transcript now uses document scrolling; the separate conversational wrapper asks up to eight topical Model A questions, with no more than ten permitted, while the original research lab/protocol retain their 20-disclosure behavior. Groq proposes broader sparse details for explicit confirmation; original narratives, unmapped wording and UNKNOWN remain separate. The unchanged handoff is nested in a versioned conversation download. Clinical urgency and guidance remain unavailable.

Run the existing local setup below with `APIP_ENABLE_GROQ_MODEL_A=1` and the existing optional `APIP_ENABLE_MODULAR_MEDASSIST=1`. New guarded routes are `/api/research/model-a/natural/vocabulary`, `/natural/extract` and `/natural/interview`; browser code receives no token or private artifact location. No additional model or service is needed. The broader extraction profile is experimental, not qualified by the older three-symptom benchmark.

**Historical boundary:** the following earlier conversational-experience section and receipts describe the implementation before this latest refinement. In particular its internal transcript scrolling, three-entry bridge and 20-question conversation limit are superseded; its research study results remain unchanged.

## Current conversational experience — 2026-10-25

Open `http://127.0.0.1:3000/#/preview/medassist-conversation` in the existing APIP development preview. Reuse the [private adapter startup configuration](../model-a-research/README.md); enable the existing qualified Groq bridge with `APIP_ENABLE_GROQ_MODEL_A=1` only when its original server-only key, selected-model qualification and usage authorization are present. No new provider/model configuration, dependency, port or clinical route was added. Keep both development processes loopback-only and stop them when the active preview session ends. Groq initial descriptions leave the machine; the composer discloses this before sending. Use fictional details only.

The normal page is now a chat, with one animated greeting per conversation, left/right bubbles, an independently scrollable transcript, inline confirmation/answer controls and one multiline Material Web composer. Enter sends; Shift+Enter inserts a newline; composition input is not submitted mid-IME. Reduced motion disables the entrance effect. Research example selection and symptom shortcut buttons are removed; developer diagnostics remain in the [separate research lab](../model-a-research/README.md). Optional scope/privacy and session summary stay compact. Explicit export downloads the unchanged coded fictional evidence contract, not clinical conclusions.

### State and confirmed-evidence flow

Safety runs synchronously before availability, extraction or answers. Otherwise an initial description reaches the existing qualified backend-only Groq interface (or explicitly limited exact-phrase mode when no provider is configured). Every proposal is validated against the frozen starting vocabulary and requires confirmation. A correction replaces a pending proposal; it is not an accepted negative. The ingress bridge still accepts only one present cough, fever or sore-throat root. Negation, UNKNOWN, multiple symptoms, duration, contradiction and unsupported terms clarify without silently dropping details or inventing accepted evidence. This presentation work does not broaden extraction qualification or improve measured extraction accuracy.

After confirming a starting symptom, chat asks for explicit **fictional age**, then the frozen source's F/M code. Neither is inferred from a symptom or imported account profile. Age zero and numeric fractional ages remain valid source inputs; unavailable/unsupported context prevents Model A from starting. F/M are source constraints, not inferred gender or a claim of inclusive clinical coverage. Context and original replies remain visible in the transcript. The unchanged `model-a-to-b.evidence.v1` still identifies this as developer-authored fictional evidence; it must not be relabelled as real-patient provenance.

Only confirmed evidence enters the original Model A adapter. It selects question IDs, exact metadata wording, allowed typed answers, dependencies, exclusions and stopping behavior. The LLM does not rewrite, select or replace a follow-up. Yes/No/UNKNOWN, exact categorical scalars and explicit multichoice sets remain separate. Pending-question replay checks, serialized requests and generation invalidation prevent repeated/stale acceptance. Failed interview actions preserve accepted answers and require retry/restart; failed extraction has an explicit retry. Restart cancels requests, clears context/navigation/proposals and creates a new greeting. Long histories stay available with keyboard scrolling.

### Assessment and navigation

The desktop right panel contains four **unassessed** categories: Low/green, Moderate/yellow, High/orange and Very High/red. Their swatches and cards stay neutral; the colour names reserve the requested future legend, not present predictions. Status may be Not assessed, Gathering information or Unable to assess. Gathering answers never assigns severity. Mobile/tablet use a compact expandable status card. Model B remains disabled and returns `unable_to_assess`; neither Groq, Model A, keywords, archived disease predictions nor NHAMCS experiments can populate these levels.

Emergency help remains immediately accessible in the header and while requests are pending/offline. The existing provisional rule set is unchanged: guidance interrupts ordinary questions and remains independent of the assessment panel. No-match is not safety clearance. Routine Maps controls appear only after an explicit request such as “find care”; emergency controls appear with the safety interruption. Navigation still requires separate location action/permission or manual entry, transmits location only, and makes no facility/suitability claims. No symptom-to-specialty mapping is approved, so ENT/specialty inference is intentionally unavailable. See [safety boundaries](../../../models/medassist_ai/docs/safety-navigation.md).

The old fixed-question preview shared `.medassist-conversation` CSS and imposed a viewport-height cap. More-specific chat-shell rules remove that collision without altering the old preview. Focus-only headings are positioned within the transcript to avoid invisible page-height growth. Layout remains bounded at the tested normal viewport height; short windows/large text allow page scrolling so controls remain reachable. Cards/bubbles/grid are specification-based Material 3 compositions where Material Web has no chat-specific component; controls and semantic tokens reuse the existing system.

### Actual evidence and limitations

[Verification and exact task inventory](../../../models/medassist_ai/docs/chat-verification.json) separate fictional UI fixtures from [four real Model A conversations](../../../models/medassist_ai/docs/chat-model-a-observations.json) and [one live Groq + Model A integration](../../../models/medassist_ai/docs/chat-live-integration.json). All 17 artifacts, seal and frozen implementation/protocol matched; the environment stayed pinned. Official locked test/ledger were not accessed. Source archive digests were compared to existing attestations; archives were not reopened.

Adult cough with UNKNOWN and teen fever with explicit negative answers both used the full 20-question budget; age-zero sore throat stopped after three answers on request; an unresolved conflict stopped after one answer. No repeated/quarantined questions or invalid conditional disclosures occurred in those runs. These real scenarios selected binary questions; categorical/multichoice browser behavior is separately verified with authored transport fixtures, not misreported as real-model coverage.

Adult cough began with general pain (`E_53`), smoking (`E_79`), then nasal symptoms (`E_181`). This shows the frozen synthetic evidence-recovery objective can produce broad questions that feel indirect. It does not establish poor accuracy, clinical relevance or age-appropriate wording. The UI preserves those selections rather than making up more relevant questions. Most earlier UX friction came from research controls, required context, rendering/state and CSS collisions; the restricted single-positive ingress and unreviewed source wording remain substantive limitations. No independent accuracy study or training occurred. Future model experiments require a separately frozen task/evaluation, not tuning against the exposed validation or locked test.

Current gates: conditional GO for local fictional demonstration only; clinical severity, comprehensive red flags, guidance/precautions, specialty matching, verified facility data, patient deployment and clinical wording approval remain blocked. Trusted-pickle and preexisting frozen-protocol CRLF/LF portability constraints remain. Historical implementation notes below describe their dated state; the current section supersedes their UI/provider status claims.

**Safety/navigation update, 2026-10-25:** [provisional emergency precedence and location-only Maps search](../../../models/medassist_ai/docs/safety-navigation.md) now cover model-offline/pending states and navigation failures without changing the chat layout or evidence contract. Clinical safety rules remain unapproved and Model B disabled. [Final checks and inventory](../../../models/medassist_ai/docs/safety-navigation-verification.json) distinguish current verification from the dated implementation notes below.

**2026-10-21. CONDITIONAL GO for the local fictional structured-input demo; L2 remains partial.** This page is inside the existing APIP React application, shares its header/navigation/appearance and Material 3 controls, and reuses the actual sealed Model A through the existing guarded development proxy. It is not a disconnected app or a clinical service. The [master blueprint](../../../docs/architecture/MEDASSIST_MASTER_BLUEPRINT.md#13-evidence-based-acceptance-and-decision-gates) owns capability gates.

## Open and run

From the APIP home page, select **Try the fictional MedAssist conversation**, or use **Try fictional adaptive conversation** on the patient-home card in development. Direct URL: **http://127.0.0.1:3000/#/preview/medassist-conversation**. The existing `#/research/model-a` developer lab and older `#/preview/medassist` preview remain separate and unchanged in purpose. Direct ADR reporting remains available.

Use the existing preserved local environment and the [research lab run guide](../model-a-research/README.md#run-locally-in-the-preserved-environment). Privately configure the same valid `MEDASSIST_A_TOKEN` and existing `MEDASSIST_A_RUN_ROOT` / `MEDASSIST_A_METADATA_ROOT` in both terminals; never put values in Git, browser variables or URLs. No replacement artifacts or new model download are needed.

```powershell
# Adapter terminal, repository root, after private configuration
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:MEDASSIST_A_ENABLE_RESEARCH = '1'
.\.venv\Scripts\python.exe -m models.medassist_v2.research_adapter

# APIP terminal, same shared private token
$env:APIP_ENABLE_MODEL_A_DEMO = '1'
bun run dev
```

The adapter binds loopback port 8766; the development frontend binds loopback port 3000. Wait for artifact checks, then retry availability if needed. Stop only these preview services when finished. No new watcher, monitor, scheduled task or public tunnel is installed. Localhost belongs to the Windows computer running the services; an isolated/remote browser needs its own approved forwarding rather than a wider network bind.

## What works, and what is deliberately limited

Choose an authored fictional example (explicit age and source F/M context), then enter a supported positive phrase such as **I have a cough**, **fever** or **I have a sore throat**, or select a named symptom. Only these three initial binary symptom roots are supported in this slice. The adapter checks their exact public metadata wording/type/root eligibility against verified frozen metadata before exposing the vocabulary. No source patient rows are read.

This is **limited structured-input mode**, not general AI language understanding. Exact phrase matching proposes one candidate; it never immediately records evidence. The user explicitly confirms the proposed symptom before the first Model A call. Negation, uncertainty, multiple symptoms, extra qualifiers, unsupported text and raw evidence IDs clarify/abstain without inference or accepted evidence. For example, “no cough” never becomes a positive cough, and “cough for three days” is rejected rather than silently dropping duration.

The actual Model A selects subsequent questions using existing frozen eligibility/features. Yes/No/Not sure preserve true/false/null; categorical and multichoice controls preserve exact original scalar types and explicit empty/default sets. Original allowed source values are displayed without invented clinical interpretation. An explicit conflicting-answer action records an unresolved contradiction and stops. Already asked questions cannot be repeated; the existing 20-question budget and stop/reset semantics apply. Stopping is not a medical safety conclusion.

Assistant/user messages, pending candidate mapping and accepted evidence are separate states. The visible summary distinguishes reported positive/negative/value, UNKNOWN, not asked, unsupported and conflicting states. No clinical facts are inferred. Raw IDs, JSON, schema names and source paths are hidden in the conversational UI; the existing developer lab remains the explicit evidence-inspection/export tool. Internally every accepted response retains **`model-a-to-b.evidence.v1`**, unchanged fictional provenance and `model_b_status: not_enabled`. No new clinical provenance contract is implied.

Requests commit state only on a successful validated handoff. Failures preserve accepted answers and expose a bounded retry; restart aborts in-flight work and invalidates late responses. Keyboard Enter submits a description, controls are labelled Material Web components, responsive styles use existing semantic tokens and reduced motion is supported. Semantic HTML message lists/summary provide the chat layout; this is a specification-based layout rather than an alternative component system.

## Language provider and clinical boundaries

`language.ts` defines a future `LanguageProvider` interface returning untrusted `medassist.extraction.v1` candidates; **the runtime provider is null**. No LLM was selected, installed, downloaded, called or benchmarked. `validateInitialExtraction` accepts exactly one schema-valid, allowlisted positive initial and rejects extra fields/unknown IDs/clinical output. Future provider integration still requires deterministic validation, user confirmation, permitted data handling and separate evaluation; this boundary is not a working medical LLM integration.

Model B, precautions and hospital navigation have explicit unavailable capability states. No diagnosis, urgency/severity heuristic, red-flag rule, treatment/medication advice or home-care clearance is added. Actual clinical wording remains unreviewed. MedGemma and alternatives remain candidates requiring comparative extraction quality, latency, memory, licence and privacy evidence before selection. L3–L6 gates are unchanged.

## Isolation and privacy

The conversational module, its navigation links and route are DEV-only and absent from production client assets. Its API is the existing opt-in `/api/research/model-a` namespace: socket/Host/Origin checks, private server-side token, fixed loopback target, request/response limits, schema allowlists, timeout and no-store behaviour remain. The new read-only `/vocabulary` proxy endpoint forwards only verified public entry metadata; it does not occupy the inference slot. Missing or incompatible assets fail closed.

Raw typed descriptions stay in page memory and are never sent to a language service, account store or console. Only explicitly confirmed fictional coded evidence/context is sent to the local adapter, with credentials omitted. The component imports no account/profile state, persists no interview and adds no analytics. Existing APIP account/header infrastructure remains separate; the live preview uses an empty temporary account database. Reload/restart clears interview state. Fictional declarations are not patient consent or real-data permission.

Trusted hash-verified pickle and exact scientific environment remain mandatory. Existing CRLF-local versus LF-Git protocol-byte portability remains unresolved; do not normalize frozen files or change checksums. Clean-checkout portability, full accessibility certification, clinical validity, public security and multilingual/general free-text support are not claimed.

## Checks and next gate

The [L2 receipt](../../../models/medassist_v2/research_adapter/level2-verification.json) owns the exact changed-file inventory and actual check results. Focused Python checks cover the new vocabulary/metadata failure path plus existing selector, semantics, dependency/exclusion, duplicate, missing/corrupt artifact and handoff regressions. Node checks cover phrase/extraction schema validation, main-site isolation and guarded proxy transport. Frontend and explicit backend/test TypeScript checks and the production build are required.

Fresh local Chrome verification exercised main-site navigation → unsupported description → confirmed symptom → simulated failed action/retry → actual Model A follow-up → Not sure → end → restart/reload, plus unavailable-vocabulary recovery. Internal responses preserved all 223 handoff entries and UNKNOWN; zero page errors, no raw IDs in the page, and no horizontal overflow at 390/768/1280 px. Keyboard Enter was exercised. This is focused browser evidence, not a full assistive-technology or browser typed-value matrix certification.

Next L2 work: prospectively agree extraction evaluation and wording review, compare permitted LLM candidates without changing Model A, then separately authorize a bounded provider implementation. Broader negation, multi-symptom/correction/context handling must clarify until validated. Complete L1 review and outstanding accessibility/browser coverage alongside that work. No training, locked-test access or Git publication follows automatically.


## L2 chat refinement — 2026-10-21

The conversation now renders each selected follow-up once in the timeline. Initial confirmation no longer appends a duplicate user statement. One composer supports initial limited phrases and exact follow-up labels; boolean yes/no and UNKNOWN retain distinct typed values, categorical values are never coerced, and multichoice answers still use explicit controls. Unsupported phrases clarify without advancing. Research scope/privacy and evidence counts are expandable. Material Web controls retain wrapping, 48px minimum targets, keyboard operation and reduced-motion styling. Failed submissions lock alternate answers until retry/restart; retry appends the accepted answer once. A client replay guard rejects already-disclosed pending questions without changing the sealed selector.

`replies.ts` owns exact reply parsing and the replay guard. `language.ts` retains its disabled provider and adds an evaluation-only `extractInitialSuggestion` seam: cancellation, provider failure and invalid output return clarification; valid output is a proposal requiring the existing separate confirmation. No provider transport, credentials, runtime configuration, general extraction or generated question wording is enabled. This seam is deliberately limited to one supported positive initial; negatives, UNKNOWN, contradictions, dependencies and other evidence must not be silently shoehorned into it. They need a separately reviewed language contract before broader extraction.

### Candidate feasibility review, not a benchmark

Reviewed official publisher cards and terms on 2026-10-21. Laptop specification is user supplied (RTX 2050 4GB, 16GB system RAM), not newly measured. Approximate weights-only storage below uses parameters × bits / 8 in decimal GB; it excludes quantization metadata, unquantized tensors, context cache, runtime buffers and Windows/display use. Actual memory, startup, first-token and total latency are unmeasured for every candidate.

- [MedGemma 4B IT](https://huggingface.co/google/medgemma-4b-it): medically adapted multimodal comparison candidate. Roughly 2GB weights at 4-bit for 4B parameters is only a lower bound; 4GB VRAM is tight and partial CPU offload may be needed. 16-bit weights alone exceed VRAM. Text-only extraction does not justify loading image inputs. Its card says multi-turn behavior is not evaluated/optimized and inaccurate output remains possible. Medical QA performance does not validate APIP evidence extraction. [HAI-DEF terms](https://developers.google.com/health-ai-developer-foundations/terms) apply to weights, including usage and distribution obligations; hosted access also counts as distribution. Review and accept applicable terms before acquisition; do not treat inference-code Apache licensing as the weights licence.
- [Qwen3 1.7B](https://huggingface.co/Qwen/Qwen3-1.7B): Apache 2.0 general-language comparison, not a medical model. About 0.85GB weights at 4-bit; likely more hardware headroom than 4B, an engineering inference rather than a measured fit. Evaluate with thinking explicitly disabled in the chat template to avoid extra reasoning tokens. Lower memory does not establish negation accuracy or faithful extraction.
- [Qwen3 0.6B](https://huggingface.co/Qwen/Qwen3-0.6B): Apache 2.0 low-resource baseline; roughly 0.3GB weights at 4-bit. It is a useful lower-size comparator, not an assumed substitute for medical validation. Small capacity may lose qualifiers or follow injected instructions; measure rather than assume latency/quality superiority.
- [Gemma 3 1B IT](https://huggingface.co/google/gemma-3-1b-it): lightweight general-language comparison; roughly 0.5GB weights at 4-bit. [Gemma terms](https://ai.google.dev/gemma/terms) and access acceptance apply, including usage restrictions, redistribution notices and hosted-service obligations. It is not medically validated for APIP.

Recommendation: after separate acquisition approval, evaluate Qwen3 1.7B alongside the exact-phrase baseline first, retain 0.6B as the resource floor and Gemma 3 1B as another small comparator; compare MedGemma only if its approved quantization/runtime can fit without exhausting memory. This is a feasibility shortlist, not selection or enablement. Verify exact revision, quantization provenance, redistribution terms, backend/CUDA support and available memory before installation. No hosted calls, downloads or model runs occurred here.

A future runtime should use constrained JSON decoding where supported, a small supplied eligible vocabulary, bounded context/output, cancellation and a fixed loopback endpoint with server-side configuration. [llama.cpp grammar documentation](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md) describes grammar/JSON-schema constraints. Syntactic JSON validity cannot prove a statement supports a value: frozen ID/type/dependency checks, clarification and explicit confirmation remain mandatory. Do not accept advice, generated questions, severity or extra fields as evidence. No narrative is sent externally by this change.

### Next L2 gate

Before any inference, freeze a dated authored English extraction set and acceptance criteria: 48 fictional cases, eight each for exact positives/paraphrases, explicit negatives, uncertainty/missing, multiple symptoms/contradictions, unsupported vocabulary/dependencies and prompt injection/extra clinical output. Keep this separate from all official Model A data/tests. This is a proposed evaluation design; cases are not yet authored or run. The present positive-only seam must clarify on the categories it cannot represent; do not score those as successful full extraction.

Use the same fixed prompts, candidate revisions, context/output limits, quantization and decoding settings across comparison runs where supported. Record raw schema validity, typed ID/value precision/recall, unsupported additions, negation/UNKNOWN/contradiction behavior, clarification/coverage and user-confirmation transitions separately. Proposed minimum software gate: zero accepted out-of-vocabulary/invalid typed/dependency answers, zero accepted advice/extra fields, zero invented observations in negative/uncertain cases, and all failed/ambiguous cases clarify. Semantic accuracy thresholds and clinical wording acceptance require reviewer agreement before evaluation, not after seeing scores. Record cold load, warm p50/p95 total and first-token latency, tokens generated, peak GPU allocation and process RSS, context length, thermal/CPU-offload configuration and timeouts. Proposed usability target: warm p95 under 5 seconds, a hard 15-second cancellation limit and no OOM; unmet targets block interactive enablement. None are measured outcomes.

L2 remains partial: no evaluated LLM, general language mapping, accepted broader extraction schema or qualified clinical wording review. Correction of accepted initial context still requires restart; inline correction/provenance and evidence export remain next-gate work. Model B, severity, safety rules, precautions and hospital capabilities remain unavailable. CRLF/LF frozen-protocol portability and trusted-pickle constraints persist.

### Verification and scoped inventory

This refinement changes exactly six paths: this README; `MedAssistConversation.tsx`; `conversation.css`; `language.ts`; new `replies.ts`; and `scripts/medassist-conversation.test.ts`. The dated history and changelog receive additive documentation entries (eight paths total). Existing uncommitted work is preserved; the user explicitly prohibited staging, committing, merging and pushing.

- Node: `node --import tsx --test scripts/medassist-conversation.test.ts scripts/model-a-demo.test.ts`: 15 passed, zero failures/skips, 1.404 seconds reported by runner. Includes three new focused tests covering exact reply semantics, replay rejection and disabled/invalid/failed/cancelled provider results.
- Python: `.venv/Scripts/python.exe -m unittest models.medassist_v2.tests.test_conversation models.medassist_v2.tests.test_demo_workflow models.medassist_v2.tests.test_evidence_handoff`: 18 passed in 0.674 seconds. This bounded suite does not rerun the optional preserved-model tests.
- `npm run lint`: passed. `npm run build`: passed; Vite build 4.61 seconds, existing main chunk 961.53kB and >500kB warning persists. No production L2 route was enabled.
- Installed Chrome, authored transport stubs only: widths 390/820/1440px, 900px height, reduced-motion preference. One initial bubble, one follow-up question, one composer, Enter submission, failed-action locking, successful retry without duplicate bubble, completion, restart and no document horizontal overflow passed at all widths. This is UI verification, not actual Model A inference or model benchmarking. All temporary browser/server instances closed afterward. Full screen-reader, categorical/multichoice visual checks and a fresh actual-model lifecycle remain review work.

No sealed/frozen implementation, protocol, environment, artifacts or evidence contract was edited. No official locked test or ledger was opened. Artifact hashes were not rechecked this turn; preservation is a scoped-write claim, not a fresh seal attestation. No long-running service was left behind.

## Compact conversation UI correction — 2026-10-21

The normal route is `#/preview/medassist-conversation`; the separate `#/research/model-a` remains the developer lab. Normal chat renders no evidence rows, IDs, JSON, filters or export/debug controls. The complete structured handoff remains internal. The current question and simple answer controls sit above one composer; source/privacy details and the aggregate session summary are collapsed by default. The user-facing conflicting-information action is inside the optional summary rather than the primary answer controls.

The chat now uses a viewport-sized APIP shell, a desktop maximum width of 780px and 8px mobile gutters. Surrounding navigation no longer adds an extra viewport offset. Transcript scrolling is independent of the page, and controls for a long typed-value question have their own bounded area. The composer stays accessible as history grows; earlier messages remain readable with keyboard Home/End. Short windows (under 650px high) deliberately allow ordinary document scrolling so controls and large text are not clipped. The separate developer inspector remains collapsed and bounded, with all 223 entries and evidence export retained.

**Validation in this correction:** `scripts/medassist-conversation.browser.mjs` passed at 390, 820 and 1440px, each 900px high, with 20 authored follow-up responses and 223 internal handoff entries. Document height stayed 900px from first question through completion; no horizontal overflow/checklist/IDs, one composer, accessible composer bounds, scrollable earlier history, Enter replies, Home/End history navigation, optional bounded summary and restart all passed. Fresh Chrome screenshots were inspected. These are authored transport stubs, not actual Model A inference or new model-performance evidence. All temporary test servers/browsers closed.

16 focused Node tests and 18 focused Python semantics/contract tests passed, zero failures/skips. Frontend TypeScript and production build passed; existing >500kB client-chunk warning remains. Protected inference, frozen protocol/training code and handoff hashes matched before/after read-only. No external sealed artifacts were opened or edited, no official test/ledger access, and no fresh external seal attestation is claimed. Existing preview services were not restarted or changed by this correction. No staging, commit or push.

**Exact eight-file correction inventory:**

- `src/features/access/AccessPreview.tsx` — route-specific shell class only.
- `src/features/medassist-conversation/MedAssistConversation.tsx` — persistent composer, shorter help and optional conflicting-information action.
- `src/features/medassist-conversation/conversation.css` — bounded app/transcript/control/summary layout and short-window fallback.
- `scripts/medassist-conversation.browser.mjs` — stricter viewport, 20-turn, collapsed-info, keyboard and composer assertions.
- `scripts/medassist-conversation.test.ts` — presentation/isolation regression without changing evidence logic.
- `src/features/medassist-conversation/README.md` — this correction record.
- `docs/history/2026-10-21.md` — additive correction history.
- `CHANGELOG.md` — additive user-visible summary.


## Explicit local MedGemma bridge — 2026-10-21

The existing layout/CSS is preserved. With `APIP_ENABLE_MEDGEMMA=1`, the same-origin research proxy provides local extraction from the installed model, followed by deterministic validation and the existing explicit single-positive confirmation before real Model A questioning. `/language` reports configured availability; failures reject without silently using phrase extraction. The default remains disabled. No model-generated questions or clinical output are displayed. Multiple/negative/UNKNOWN/conflicting/duration-bearing initial descriptions remain clarification-only, not accepted handoff evidence. Follow-up typed replies, UNKNOWN, dependencies and stop/export behavior remain Model A's existing implementation.

The local model failed broad extraction-quality gates. This is restricted fictional engineering integration, not general language readiness or clinical validation. See [actual results and operational limits](../../../models/medassist_intelligence/README.md#local-medgemma-integration--2026-10-21), including the original failed prompt, revised 20-case results and final guard regressions. The exact model/digest, timeout, loopback-only flag and external private configuration are documented there. Keep all machine paths, private tokens and real symptom data out of Git and logs.


## Reliability qualification gate — 2026-10-21

The [three-model/two-variant comparison](../../../models/medassist_intelligence/reliability-v1/README.md) found no qualifying provider. The existing layout is unchanged. Live `/extract` requests now fail safely and quickly with `LOCAL_LANGUAGE_NOT_QUALIFIED`; the chat records no evidence and asks for a supported structured choice. Explicit button selection and confirmation still invoke actual Model A. The internal diagnostic extractor can evaluate unaccepted proposals, but the live route cannot bypass the failed qualification decision. No silent language fallback, Model B or clinical output was enabled. See the exact latency scope: fast rejection is not successful inference.


## P0 submission and provider recovery — 2026-10-25

The existing layout is unchanged. Logical submissions now carry page-memory conversation/request IDs through headers; retries reuse the original message, while backend replay coalesces identical extraction/interview requests. Accepted proposals and transitions have synchronous duplicate guards. Provider failures have explicit sanitized categories, bounded transient retries and Retry-After cooldowns; authentication/exhausted allowances never auto-retry. Invalid output remains fail-closed, with one explicit retry. Refresh clears page-memory state without persistence or replay.

[Current operational evidence and limits](../../../models/medassist_ai/docs/p0-reliability.md) distinguish live Groq success, a recorded structured-output correction, actual Model A handoff/UNKNOWN/replay checks and confirmed TPM throttling. A generic vomiting denial is retained as unsupported wording rather than the qualified repeated-vomiting feature. Every remaining observation still requires strict validation and user confirmation. No research contract, selected provider/model, clinical capability or visual design changed.


## Symptom understanding and evidence integrity — 2026-10-25

The [exact coverage inventory](../../../models/medassist_ai/docs/symptom-coverage.md) distinguishes 223 definitions, 218 active fields, 96 schema-eligible initial symptoms, 30 mapped language fields and 55 conversational question targets. The existing UI layout is preserved. Initial language proposals now use deterministic current/negative/UNKNOWN normalization where supported, with source spans and explicit history/resolved/other-person/hypothetical/concern context. Uncovered wording still uses the configured Groq provider and strict full-source validation; no model/provider change or new clinical capability is implied.

`medassist.natural-extract-request.v2` adds up to twelve 300-character prior fictional statements; only three relevant recent statements are passed to Groq. V1 callers remain supported. `medassist.natural-extraction.v1` remains the proposal schema. Explicit confirmation is unchanged. Question compatibility checks actual allowed B/C/M values and side/location meaning; at most two incompatible free-text clarifications are allowed per question, without consuming routine turns. UNKNOWN/valid controls remain available; explicit conflicting answers preserve contradiction and stop without choosing a polarity.

The download wrapper is explicitly **`medassist.conversation-export.v2`** with understanding records, literal detail tags, extraction source/confirmation and clarification counts. Consumers of the old wrapper must recognize v2; the nested **`model-a-to-b.evidence.v1` stays unchanged**. No silent clinical schema extension or narrative-to-negative conversion occurs. Refresh still clears page-memory state. Start a new fictional interview after an implementation/filter update.

[Full milestone evidence and unresolved safety misses](../../../models/medassist_ai/docs/symptom-understanding.md) distinguish 115 development utterances, 15 supplementary canonical cases, 22 adversarial provider fixtures and actual Model A/HTTP checks. No fresh Groq inference was needed for this task. Literal heart-attack/stroke declarations remain missed by the unchanged provisional safety rules, as recorded failures. This prevents clinical readiness despite passing software regressions. Model B and clinical guidance remain disabled.
