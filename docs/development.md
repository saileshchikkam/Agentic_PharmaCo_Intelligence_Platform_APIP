# Development setup and verification

## Current MedAssist local preview — 2026-10-25

Use the [private two-process Model A setup](../src/features/model-a-research/README.md#run-locally-in-the-preserved-environment) and the [conversation guide](../src/features/medassist-conversation/README.md). Express/Vite uses `127.0.0.1:3000`; the trusted FastAPI adapter uses `127.0.0.1:8766`. Both must run in the same local environment. A remote browser's localhost refers to that browser environment, not this laptop. Open `http://127.0.0.1:3000/#/preview/medassist-conversation`; the separate diagnostic lab is `#/research/model-a`. Neither development screen is a production clinical feature.

Supply the existing private artifact roots, `MEDASSIST_A_ENABLE_RESEARCH=1` and the same private `MEDASSIST_A_TOKEN` to both processes as documented. Set `APIP_ENABLE_MODEL_A_DEMO=1` in the Node process. `APIP_ENABLE_MODULAR_MEDASSIST=1` enables the existing composition boundary. For the optional Groq path, enable `APIP_ENABLE_GROQ_MODEL_A=1` and configure `GROQ_API_KEY` only in the backend environment or explicitly authorized ignored `.env.server`. That provider-specific loader does not make ordinary `.env` a general backend loader. Never use `VITE_*` for a secret, publish local artifact roots, or commit populated environment files.

Start the existing FastAPI module with `python -B -m models.medassist_v2.research_adapter` from its pinned environment, and the existing frontend/backend with `bun run dev` (or the already-installed Node launcher `node scripts/start-server.mjs development`). Restart Node after backend edits; Vite watches frontend changes. Keep services loopback-only and only for an active preview. Do not download models or run training/locked testing to restore a preview.

Supported deterministic wording can return without cloud access; broader experimental extraction may send fictional text and limited prior fictional context to Groq. Explicit confirmation remains mandatory. The original narrow qualification is not general language/clinical validation. See [Groq caps, error categories and recovery](../models/medassist_ai/docs/p0-reliability.md). Provisional safety misses, disabled Model B, unavailable personalized precautions and unverified external Maps facilities remain documented [checkpoint blockers](../models/medassist_ai/docs/checkpoint-2026-10-25.md). Earlier dated setup observations below remain historical.

For the separate offline ML workspace, use the [MedAssist Phase 1 setup and commands](../models/medassist/research/README.md). Its Python venv, raw NHAMCS files and private split assignments live outside Git/application storage. The JavaScript checks below do not validate this Python pipeline; its synthetic tests and actual profiling results are recorded in the [Phase 1 report](../models/medassist/reports/2026-10-19-phase1/README.md).

This page describes the welcome/sign-in, patient, MedAssist, and ADR evaluation previews plus the preserved developer design reference. MedAssist provides guided English-only symptom intake, optional local-model source-quote selection, and a location-only Maps handoff; clinical urgency and tailored precautions are disabled. ADR now stores fictional drafts in owner-isolated local SQLite, with a separate browser demo. See the dated [development history](history/2026-10-17.md) for actual checks and limits.

## Prerequisites and installation

The development launcher explicitly selects development and runs `tsx server-entry.ts` in Node.js; the server uses built-in `fetch`. Use Node 24 and the tracked Bun dependency workflow. The ADR draft preview uses a review/confirmation step and stores fictional data in browser `localStorage` under a versioned collection key. Existing single-draft v1 and v2 keys load as a one-item collection; legacy v1 drafts remain unconfirmed. This legacy collection remains shared only in the explicitly separate browser demo. Signed-in local accounts use the server draft API; neither mode supports real patient information. Patient confirmation is not clinical or professional review.

The repository tracks `bun.lock`. With Bun available, the intended commands are:

```sh
bun install --frozen-lockfile
bun run dev
```

Development HTTP and Vite HMR bind to loopback only. HTTP uses port 3000; legacy agents are disabled by default. Use fictional cases.

Do not silently replace the lockfile or add competing lockfiles. Record installation failures and proposed fixes. An npm workflow can be adopted after the package/lockfile policy is selected and checked.

At the 2026-10-17 implementation session, Bun v1.4.3 was installed from the [official Windows instructions](https://bun.sh/docs/installation). `bun install --frozen-lockfile` installed the tracked dependency set without changing `bun.lock`. `bun run lint` and `bun run build` passed in this checkout. A later developer-reference browser check verified appearance controls; a clean-clone/deployment flow remains unvalidated. See the dated history.

## Existing scripts

- `dev`: `node scripts/start-server.mjs development` — explicit development with Express/Vite.
- `build`: Vite client build, then an esbuild server bundle at `dist/server.cjs`.
- `lint`: `tsc --noEmit` — frontend checking under the current TypeScript config.
- `start`: `node scripts/start-server.mjs production` — explicit production; requires built output.

Use the agreed package manager to run scripts. No test script exists. Do not describe `lint` as comprehensive server/security validation.

## Environment

MedAssist uses the fixed local Ollama service with installed `qwen3.5:2b` by default. Optional server environment `MEDASSIST_MODEL` selects another installed model; startup still does not load `.env` automatically. No API key, hosted fallback, or model download is used. The loopback-only endpoint is a source-quote experiment, not the intended urgency classifier. See the [MedAssist API/setup and checks](../src/features/medassist/README.md) and [live smoke observations](../models/evaluations/2026-10-17-medassist-smoke.json). Restart the development server after backend changes; the current dev script does not watch server files.

[.env.example](../.env.example) lists `GEMINI_API_KEY`. Provider configuration is optional for existing fallback behavior, which is not clinically reliable.

- Supply credentials through the server environment or a deliberately configured loader.
- Startup does not load `.env` automatically; copying the example is insufficient.
- Never commit populated credentials or expose them in browser variables. The root `.gitignore` excludes installed dependencies, generated build/coverage output, environment files, and common machine artifacts. Review staged paths explicitly; ignore patterns do not replace secret review.
- The launcher selects NODE_ENV explicitly and rejects a conflicting inherited mode. Direct entry requires development or production. Production serves static output and never registers local account routes or enables legacy agents.

`GET /api/health` indicates process/provider configuration, not model quality, database readiness, or clinical safety.

## Before implementation

1. Read [AGENTS.md](../AGENTS.md), [architecture](architecture.md), and the affected [layer guide](layers/README.md).
2. Inspect Git status and select a bounded, user-authorized [roadmap](roadmap.md) task.
3. Distinguish demo, product, data-contract, and infrastructure work.
4. Choose relevant checks and record environment limitations.

## Before committing

Review the diff/staged files, preserve unrelated work, update affected docs and history, and record checks actually run. Update decisions/changelog when warranted.

For documentation-only changes, check links, fences, factual status, and scope. Installing dependencies is not needed to validate prose. Write deployment, CI, database, and recovery runbooks with their actual implementation rather than as empty placeholders.

See the [documentation guide](README.md) for the ongoing maintenance workflow.

## Automatic completion and GitHub sync

The [repository workflow](../scripts/README.md) uses Node.js and Git without installing application dependencies. It is enabled locally in the current checkout; new clones need the documented installer. Codex commits its completed task files and documentation under the user's standing authorization, and the post-commit event pushes them to the matching origin branch.

Check behavior before committing; the helper does not run or certify all application tests. It preserves unrelated work, refuses an existing staged index, requires a changed dated history entry, and reports pending sync on a failed push. It never force-pushes or rewrites history. Approval controls still apply; a permission/network/conflict failure must be reported rather than bypassed.

## Developer reference and appearance

The main page opens the sign-in UI preview. Its Developer view explicitly links to the domain/core component references and token inspector. Header settings select blue, red, yellow, or green primary highlights; light white surfaces are the fresh-browser default. Dark mode is optional and uses charcoal greys. `apip.appearance.v1` stores only accent/mode preferences in this browser. The retired black accent migrates to default blue; other supported preferences persist. If storage is unavailable, the settings still work for the visit and report that persistence is unavailable. See the [design-system guide](../src/design-system/README.md).

This is currently a local development screen with no login enforcement. A developer label or hidden tab is not access control; developer-only authentication remains pending.

## Preview navigation

Use the shared Back control in the page navigation row below the app header to return to the previous in-app screen. It follows APIP routes entered during the current browser history session; a direct route entry falls back to that screen's safe parent. The ADR editor's own Back action returns to the list when available, confirms before discarding unsaved edits, and moves from review back to editing. Browser back/forward remains supported for route changes.
All routes, including the developer reference, share Home/Log in text links and a centered 1160 px page shell. The Back row reserves 48 px at the same top/left position for each viewport; sign-in and ADR content can remain narrower within it. Scrollbar space is reserved to prevent horizontal shifts. ADR review uses the same row to return to details. Native browser history remains route-level. In-app links/Back prompt before leaving unsaved ADR edits; reload/tab-close protection uses the browser leave prompt; native history remains route-level.

Run `node --test scripts/preview-navigation.test.mjs` with Node 24 for the isolated navigation checks. Browser checks are still needed for custom-element interaction, focus, and responsive geometry.

## Sign-in UI preview

See the [account/database setup](../database/README.md) for the newer patient signup/profile flow. Specialist/developer screens remain previews. The current client uses hash URLs described in the [access guide](../src/features/access/README.md). The specialist/developer preview forms perform local-only validation and display a pending-authentication message. Patient forms now use local SQLite authentication in development when Supabase configuration is empty; the optional Supabase adapter still requires configuration. Specialist/developer role enforcement remains absent; patient signup/sign-in and profile persistence now have configuration-gated Supabase code, pending live provider setup. Local Google Sans Flex files and their licence/provenance are under [public/fonts](../public/fonts/README.md); Vite serves and copies them into the build.

## Local account connection

Use Node 24. With no Supabase browser configuration, `bun run dev` now connects local email/password authentication and persistent SQLite profiles automatically. No Docker or cloud account is required. See [local account setup](../database/local-development.md) for the data location, session rules, API and checks. Local authentication is disabled in production.

## Optional Supabase configuration

Follow [database/README.md](../database/README.md) to connect Supabase Auth and the profile schema. Only the URL and publishable key use `VITE_*` configuration; Vite loads local `.env` for these browser values. This does not load server-only variables. No service-role or Google secret belongs in the client. The Supabase path requires configuration; the development-only SQLite path works without provider keys. Run `node --import tsx --test scripts/account-profile.test.ts` for local SQL ownership and profile validation checks. These are not live authentication tests.

## Legacy API security boundary

All `/api/agents/*` routes return JSON 404 by default and in production, even with `APIP_ENABLE_LEGACY_AGENTS=1`. For deliberate fictional laboratory work only:

```powershell
$env:APIP_ENABLE_LEGACY_AGENTS='1'
bun run dev
```

Clear the variable after the experiment. Restart the backend to apply changes. Server variables are not automatically loaded from `.env`. Enabling agents never enables clinical use.

Opted-in requests require a loopback socket, exact local port-3000 Host and Origin, POST and JSON. Missing Origin is rejected; internal orchestration supplies its local Origin. Forwarded headers cannot establish trust. Checks precede the 24 KB parser, agent logic and provider creation. Responses add `experimentalOnly: true`, `clinicalUse: false` and non-clinical headers. Existing heuristics/simulated results remain laboratory-only; patient/professional flows do not consume them. This restriction is not a new authentication system or clinical validation.

Global permissive CORS is removed; use same-origin requests. Local account cookie/ownership checks remain independent. MedAssist's existing bounded local inference restrictions remain intact.

`APIP_HOST` defaults to `127.0.0.1`. Development accepts only `127.0.0.1`, `::1` or `localhost` and port 3000; HMR uses the same bind host. Production may explicitly configure a bind IP and `APIP_PORT` (1–65535). A container deployment may set `APIP_HOST=0.0.0.0` and its assigned port before `bun run start`. TLS, ingress, hosted authentication and operational hardening remain deployment responsibilities. Invalid modes, hosts, ports and flag values fail startup. Clear or correct a conflicting inherited NODE_ENV before using the launcher.

Focused checks:

```sh
node --import tsx --test scripts/legacy-security.test.ts scripts/local-account.test.ts scripts/account-profile.test.ts scripts/medassist.test.ts scripts/preview-navigation.test.mjs
node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --esModuleInterop --target ES2022 --module ESNext --moduleResolution bundler server-entry.ts server.ts scripts/legacy-security.test.ts
bun run lint
bun run build
```

## Contributor backend after reconciliation

The separate `app/` FastAPI/PostgreSQL contribution, root `requirements.txt` and `test_prediction.py` are preserved, but are not the APIP React/Express startup path or the sealed Model A environment. Do not run broad root test discovery that imports the contributor prediction script, `app.main`, or its model loader: they perform import-time Joblib loading/database work outside the reviewed adapter. Use the explicit test modules in the [integration evidence](reconciliation-2026-10-26.md). No contributor dependency set should replace the pinned research environment. [Historical contributor documentation](contributors/jayanth-medassist-backend.md) is not a validated clinical/deployment guide.

Fresh-checkout Model A/Python execution remains blocked by the original CRLF-local versus LF-Git protocol digest mismatch. Verification must fail closed; do not normalize frozen files or replace hashes as a setup workaround. Actual Model A checks currently require the preserved original environment and byte-identical trusted source. See the [specific blocker](reconciliation-2026-10-26.md#exact-blocker-and-next-action).

## Read-only Model A portability repair — 2026-10-26

Use the [authenticated adapter boundary](model-a-protocol-portability.md), accepting only canonical LF or historical CRLF without changing frozen files/hashes/artifacts. No generic hashing monkeypatch or normalization setup step is needed. Keep original private roots, pinned environment and trusted-pickle provenance. Frozen training/locked-test commands remain strict and are not authorized by this change. Full clean-checkout verification must pass before PR #1 is marked ready.
