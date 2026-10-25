# MedAssist Model A — local fictional question lab

**Day 2, 2026-10-21. CONDITIONAL GO for the local developer research demo.** This reuses the preserved [Task 5A adapter](../../../models/medassist_v2/research_adapter/README.md) and [Day 1 evidence contract](../../../models/medassist_v2/research_adapter/day1-review.md). No new model, fitting, clinical labels, LLM or patient workflow is added. Model B is explicitly **not enabled**. The user target is October 22; later-day work remains separately scoped.

## Run locally in the preserved environment

Do not download/recreate a model or choose a replacement run/ledger. Use the existing trusted original run, source metadata and frozen scientific environment. The original CRLF-local versus LF-Git checksum portability defect remains: a fresh LF checkout fails the current gate. Do not normalize frozen files or change hashes.

In **both local server terminals**, privately configure the same random `MEDASSIST_A_TOKEN` (32–256 characters), `MEDASSIST_A_RUN_ROOT` (preserved original run), and `MEDASSIST_A_METADATA_ROOT` (existing verified metadata bundle). Never put values in Git, browser/VITE variables, URLs or screenshots. For example, PowerShell can generate a local token using `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`; privately pass the same token to both processes. Root paths and token are deliberate operator configuration, not browser inputs. Neither server automatically loads these values from `.env`.

1. Adapter terminal, from repository root, using the existing development venv with the frozen scientific versions and tested adapter dependencies:

   ```powershell
   $env:PYTHONDONTWRITEBYTECODE = '1'
   $env:MEDASSIST_A_ENABLE_RESEARCH = '1'
   .\.venv\Scripts\python.exe -m models.medassist_v2.research_adapter
   ```

2. APIP terminal, from repository root, with the same private token:

   ```powershell
   $env:APIP_ENABLE_MODEL_A_DEMO = '1'
   bun run dev
   ```

3. Open **http://127.0.0.1:3000/#/research/model-a**. The adapter binds 127.0.0.1:8766. Wait for model integrity/startup checks before loading fixtures; use **Retry local availability** if it was still starting. Stop both server terminals with Ctrl+C when finished. No automatic background service is installed. An existing process on either port must not be interrupted automatically.

The smoke used a separate temporary empty account database through `APIP_LOCAL_DB_PATH`; no real account data was accessed. Operators can also deliberately select a separate unsynced development database if needed. The research screen itself is outside AccountProvider, imports no profile/patient data, and stores interview state only in page memory. Reload/reset clears it; accepted fictional evidence is downloaded only when explicitly requested.

## Workflow and boundaries

Select an **authored software fixture** reusing Task 5A context values, not a corpus record. Its supported binary initial symptom is explicitly true. The actual loaded Model A selects a pending question through the frozen `Policy`, tokens/hasher and eligibility. Question wording/allowed values come from the verified public metadata; no generated clinical questions are introduced.

- B controls record explicit true or false. C controls preserve the exact typed scalar; a numeric 0 is not string "0". M checkboxes preserve selected typed values, including empty/default/mixed sets.
- UNKNOWN records null and stays distinct from an explicit negative and from not asked. An explicit conflict control records a declared unresolved contradiction and stops; it does not invent a clinical rule or resolve a history.
- The server recomputes chronological eligibility, dependency rules, duplicate prevention, 20-question stopping and all five exclusions. Unsupported input abstains without accepted evidence. The UI only appends an answer after a pending question and commits state after a successful server response; failures retain previous accepted evidence.
- **End interview** requests `user_stopped` and receives a stopped selection plus accepted evidence. Exhaustion/conflict/budget stops have no medical safety meaning. **Export accepted evidence JSON** downloads the unchanged `model-a-to-b.evidence.v1` object, with source context, all 223 definition statuses, five unsupported exclusions and per-item fictional provenance. Pending questions stay not asked. Human clinical review is false and Model B status is not enabled.
- The new `model-a.demo.v1` response wraps the old `model-a.response.v1` and optional handoff. It does not alter either existing contract. Old `/next` remains compatible; demo endpoints are separate.

## Architecture, isolation and errors

```text
DEV-only React screen (page-memory fictional disclosures)
  -> same-origin development-only Express proxy (socket/Host/Origin guards)
  -> fixed loopback FastAPI demo endpoints (private server-side bearer token)
  -> existing Model A Policy + unchanged Day 1 handoff projection
  -> versioned accepted evidence -> explicit local fictional JSON download
```

`server/model-a-demo.ts` registers `/api/research/model-a/fixtures` (GET) and `/interview` (POST) only with development mode, `APIP_ENABLE_MODEL_A_DEMO=1` and a private token; otherwise the namespace returns 404. Production never calls the adapter. The screen is DEV-only, has no patient-navigation link and is removed from the production client build. Existing clinical/preview/ADR behavior is unchanged.

The proxy uses the actual loopback socket, exact Host and same-local-origin checks; forwarded headers cannot grant local trust. Browser requests contain **no model token**, and account credentials are omitted. The proxy sends only its own fixed headers to a fixed 127.0.0.1 adapter URL, with redirects refused. Python's existing Origin/CORS/token guards are unchanged. Request bodies are limited to 64 KiB; streamed responses to 256 KiB. Strict transport allowlists reject extra backend fields; arbitrary backend errors/paths/headers never pass through. Requests time out and cancel, responses are no-store, and only one inference is in flight. Concurrent read-only fixture requests are safe and permitted (including React development StrictMode).

The UI never renders raw backend errors or HTML and retains accepted state on failure. Missing/corrupt/incompatible model artifacts return unavailable, not replay/clinical advice. No uploads, pickle path parameters, model downloads, persistence, analytics or cloud fallbacks are provided. Provenance/fictional declarations are trusted operator assertions, not identity/consent verification. This is not a hostile-user security boundary or public deployment certification. Pickle still requires a trusted local, hash-verified artifact.

## Reused interface and checks

The screen reuses APIP React, Material Web registration, colour roles and existing M3Button/M3Checkbox/M3Select wrappers; no dependencies or lockfiles changed. The evidence table uses semantic HTML with labels/header scopes, keyboard-focusable scrolling and Material colour/spacing roles because Material Web supplies no table component in this installed set. Phone layout stacks columns and reduced motion removes animation/transitions.

Focused checks and exact inventory are in [Day 2 verification](../../../models/medassist_v2/research_adapter/day2-verification.json). Run from repository root:

Actual results: **35 Python / 23 Node tests passed, zero final failures or skips**; frontend and explicit proxy/test TypeScript checks and production build passed. The build retains a large-client-chunk warning. Actual-model loopback smoke and fresh Chrome fixture → UNKNOWN → end → export → reset passed, with zero page errors; desktop/phone layouts were inspected. All 17 sealed hashes, frozen code/protocol/environment and original handoff matched afterward; ledger empty and test markers absent. Both temporary services were stopped. No official patient records, training, locked test or new benchmark were used.

```powershell
python -W error -m unittest models.medassist_v2.tests.test_research_adapter models.medassist_v2.tests.test_evidence_handoff models.medassist_v2.tests.test_demo_workflow -v
node --import tsx --test scripts/model-a-demo.test.ts scripts/medassist.test.ts scripts/legacy-security.test.ts
bun run lint
bun run build
```

Explicitly configure original artifact roots for preserved-model tests; otherwise they skip and cannot be claimed passed. Software fixture estimators are non-learning stand-ins only; actual-model tests and the short live loopback smoke establish reuse of the real selected ranker. No official patient rows or locked-test evaluation are needed for these checks.

Known remaining limits: no clinical question review, real-world free-text/context mapping, clinical Model B, patient data governance or independent clinical validation; no clean-checkout portability; trusted operator/pickle assumptions. Day 3 should add broader browser B/C/M/default/contradiction/budget/cancellation coverage and tablet/keyboard/accessibility verification, rather than rebuilding the already functioning loop. No stage/commit/merge/push is authorized before review.
