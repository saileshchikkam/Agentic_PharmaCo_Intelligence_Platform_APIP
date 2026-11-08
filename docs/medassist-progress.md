# MedAssist development progress

| Field | 2026-11-08 Accelerated Model A program — Prompt 2 of 4 |
| --- | --- |
| Current stage | Stage 3 — Conversational NLP and Evidence |
| Current subphase | Open-ended symptom capture, bounded context validation and conversation/export integration |
| Current task | Prompt 2 of 4: implementation complete pending final regression/sync verification. |
| Overall MedAssist status | Scripted research demo is operational for nine confirmed evidence fields plus separately retained page-memory unsupported descriptions. Genuine local Model A remains blocked; clinical assessment disabled. |
| Last verified completion | [Open-mention integration](evaluation/medassist-open-mention-integration-report.md): five prospective capture/export checks pass and the local browser/download check keeps an unsupported ear complaint out of evidence and Model A. |
| Current blockers | No durable open-mention persistence or mapping/reconciliation UI; contextual extraction evaluation, local model/runtime availability and original sealed Model A environment remain unverified. |
| Next task | Do not start automatically. A separately authorized fresh evaluation must assess contextual/open-ended coverage before any independently evaluated candidate extractor. |
| Starting commit for this task | `f8c350fc8ce2df0fde04bf79e1db749ee52fc55e` |
| Latest verified preview | See the latest [dated verification](history/2026-11-08.md). |

The [roadmap](roadmap.md), [blueprint](architecture/MEDASSIST_MASTER_BLUEPRINT.md) and [decision log](decisions.md) retain their existing scope. Stage numbers here group evidence for reporting. Task IDs come from the project record. Historical results refer to their recorded environments.

| Stage and objective | Completed or historically tested | Implemented, simulated, blocked or failed | Dependencies and source | Branch and associated commit | Remaining work and acceptance gate |
| --- | --- | --- | --- | --- | --- |
| 1. Research and datasets | NHAMCS Phase 1 profiling and subsequent research reports. DDXPlus protocol recorded. | Private raw files and split assignments unverified locally. | [NHAMCS evidence](../models/medassist/reports/2026-10-19-phase1/README.md), [DDXPlus work](../models/medassist_v2) | Adapter research branch, snapshot `161a14c` | Verify approved provenance, environment and asset availability without opening locked splits. |
| 2. Model A adaptive ranking | Task 4B historically sealed. Task 5A implemented with 18 historical focused tests. | Research only. Local artifacts, pinned dependencies and genuine inference unverified in Phase 0. | DDXPlus, sealed ranker, authenticated protocol, [FastAPI adapter](../models/medassist_v2/research_adapter) | `codex/medassist-v2-task5a-adapter` at `161a14c`, portability reconciliation included in `5085a26` | In a separately authorized task, verify trusted private assets and adapter contract with fictional inputs. |
| 3. Conversational NLP and evidence | Prompt 1 systemic audit and Prompt 2 source-grounded open-mention integration completed. Unsupported spans are visible/exported separately from the nine fields. | Development 48/50 and withheld 43/50 retain clause-context, resolution, site-scope and ordinary-grammar failures. Open mentions are page-memory only; mapping/reconciliation and accepted-history revision remain unavailable. | [Conversation](../src/features/medassist-conversation), [audit](evaluation/medassist-accelerated-language-audit-report.md), [Prompt 2 report](evaluation/medassist-open-mention-integration-report.md) | `feat/medassist-jayanth` | Freeze/run a genuinely new contextual/open-ended evaluation before considering an independently evaluated candidate extractor. |
| 4. Emergency safety and Model B | Provisional safety boundary and evaluation evidence exist. | Emergency branch failed qualification. Expanded rules remain isolated. Model B planned, untrained and disabled. | [Safety source](../src/features/medassist-safety), [qualification and restrictions](architecture/MEDASSIST_MASTER_BLUEPRINT.md) | `codex/medassist-emergency-recognition` at `db1274a` | Obtain a separate authorized safety review with independent acceptance criteria. Keep clinical guidance and Model B disabled. |
| 5. Frontend and backend integration | React/Vite and Express verified on Windows. Scripted mode runs in the existing conversation. The private research proxy correctly reports its disabled state. | Genuine adapter readiness and provider qualification remain open. | [Development guide](development.md), [account/database setup](../database/README.md), [proxy](../server/model-a-demo.ts) | `feat/medassist-jayanth` | Verify authenticated research integration after the private runtime is established. |
| 6. Academic demonstration and preview | Local scripted submission, confirmation, follow-up, summary and JSON export verified. Hot update and restart passed. | Original cloud interactive review bundle remains unavailable. | [Conversation guide](../src/features/medassist-conversation/README.md), [dated verification](history/2026-11-05.md) | `feat/medassist-jayanth` | Match the original patch to its baseline, classify differences and review the demo. |
| 7. Advanced capabilities and qualification | Blueprint specifies capability and review gates. | Clinical outputs, personalized precautions and Model B unavailable. External Maps facility results unverified. | [Blueprint gates](architecture/MEDASSIST_MASTER_BLUEPRINT.md#13-evidence-based-acceptance-and-decision-gates), approved evidence and independent review | No implementation commit assigned for qualification | Resolve earlier gates and secure independent qualification before clinical use. |

## Component availability

| Dataset | Purpose and location | Availability and training | Next gate |
| --- | --- | --- | --- |
| NHAMCS 2022 | Visit-level research in [MedAssist reports](../models/medassist/reports) | Historical research fits reported. Private raw assets and split assignments unverified. | Verify approved source and access separately. |
| DDXPlus v2 | Synthetic adaptive questioning in [MedAssist v2](../models/medassist_v2) | Historical Task 4B training and validation reported. Private data and held-out split availability unverified. | Verify trusted metadata. Keep held-out testing locked. |
| Synthetic interview fixtures | Deterministic UI and adapter contract checks in [scripts](../scripts) and the [adapter](../models/medassist_v2/research_adapter) | Source available. Fixtures are evaluation and demo inputs. | Run scoped checks with fictional data. |
| Emergency evaluation data | Controlled evaluation for the emergency workstream | Historical qualification failure. Private evaluation inputs unverified. | Keep expansion isolated pending separate review. |

| Model or service | Training, artifacts and runtime | Test evidence and next gate |
| --- | --- | --- |
| NHAMCS research models | Historical fits, private saved assets unverified. Offline research only. | Consult phase reports and verify trusted inventory separately. |
| Model A | Historically trained and sealed. Private saved ranker and pinned environment unverified. | Task 4B evidence is historical. Verify genuine inference only under separate authorization. |
| Model A adapter | Untrained wrapper around the trusted artifact. Loopback, token and explicit opt-in required. | Task 5A receipt and portability record are historical. Verify readiness separately. |
| NLP extraction | Deterministic mappings plus gated local or hosted providers. No new training or local artifact verified. | Historical L2/P0 checks and failed broad provider gates. Confirm availability and evidence handling separately. |
| Emergency recognition | Provisional deterministic rules. Expanded rules isolated on emergency branch. | Prior misses and failed independent qualification. Requires independent review before activation. |
| Model B | Untrained, disabled, no runtime or validated artifact. | Clinical data and qualification gates remain open. |

## API and application inventory

The app enters through `server-entry.ts` and `server.ts` with Vite in development. `src/features/access` owns hash navigation. `src/features/account`, `server/local-account.ts` and `database` cover the local SQLite account and optional configured Supabase profile path. `src/features/adr` contains the ADR UI. The separate contributor `app` FastAPI/PostgreSQL tree is outside the normal startup path and imports serialized assets in prediction code.

| Method and route | Handler and access | Runtime dependency and status |
| --- | --- | --- |
| GET `/api/health` | `server.ts`, no account required | Process/configuration check. See dated runtime evidence. |
| POST `/api/medassist/structure` | `server/medassist.ts`, guarded local request | Optional local extraction model. Inference excluded from Phase 0. |
| GET `/api/research/model-a/language`, `/language/diagnostics` under the same prefix | `server/model-a-demo.ts`, opted-in development and local-request guards | Configuration status. Optional language provider. |
| POST `/api/research/model-a/extract`, `/natural/extract` under the same prefix | Same guarded proxy | Vocabulary and extraction path depend on provider/configuration. |
| GET `/api/research/model-a/fixtures`, `/vocabulary`, `/natural/vocabulary` under the same prefix | Same guarded proxy, server-held token upstream | Private adapter required. |
| POST `/api/research/model-a/interview`, `/natural/interview` under the same prefix | Same guarded proxy, server-held token upstream | Genuine adaptive questioning requires trusted Model A runtime. |
| POST `/api/research/medassist/safety`, `/navigation/:kind` under the same prefix | `server/medassist-safety.ts`, loopback development request guards | Provisional deterministic safety and navigation. No clinical qualification. |
| GET `/research/model-a/v1/health`, `/demo/fixtures`, `/demo/vocabulary`, `/demo/natural/vocabulary` under the same prefix | `models/medassist_v2/research_adapter/app.py`, private loopback adapter with token | Opt-in research process. Phase 0 startup excluded. |
| POST `/research/model-a/v1/next`, `/demo/interview`, `/demo/natural/interview` under the same prefix | Same private adapter | Trusted sealed artifact required. Phase 0 inference excluded. |

## Local completion checklist

1. Confirm Windows checkout, working tree, phase, owning existing branch and live GitHub SHA. UI, evidence and integration use `feat/medassist-jayanth`. Model A research uses `codex/medassist-v2-task5a-adapter`. Emergency research uses `codex/medassist-emergency-recognition`. Escalate mixed ownership before implementation.
2. Use [development setup](development.md), Node 24 and the frozen Bun lock. Start the Express/Vite launcher on loopback. Keep research flags off for basic UI checks. Run the affected tests, then open the real local app and verify the changed flow, console and responsive behavior as applicable. For backend work verify the dependent UI and API. For approved model work verify actual inference separately from fixtures. For documentation work record the preview outcome or reason for omission.
3. Review the diff, update this status record and append dated evidence. Use the [existing completion helper](../scripts/README.md) with explicit files. Preserve unrelated work and exclude credentials, databases, private data and sealed artifacts. Keep history intact and stay on the approved branch.
4. Check `git ls-remote --exit-code origin refs/heads/<branch>` and compare the returned SHA with `git rev-parse HEAD`. Record the verified SHA in the report. Report pending sync if any gate fails.
5. Report in order: project overview, seven-stage snapshot, prior work, current work, current position, models/datasets/APIs, exact test counts, GitHub sync, live preview, blockers, next step, standalone next prompt and planning handoff. Include current phase and subphase and any unverified outcome.

## Cloud recovery

The reported 16-file working tree uses baseline `5085a26579bab3bbf994d8b5f62f363b6b310df4`. The historical roadmap PDF was found in the follow-up. The reported `fictional-preview-transport.ts` is absent from that baseline and from the follow-up starting commit. The local `scripted.ts` is a new implementation. Request the original `apip-medassist-interactive-review-5085a26.patch`, `apip-medassist-interactive-review-5085a26.tar.gz` and `apip-medassist-interactive-review-manifest.json`. Verify digests and compare the baseline and current tree before any application. The blueprint's old uncommitted Task 5A note is historical. Checkpoint `161a14c` is reachable from the feature branch.
