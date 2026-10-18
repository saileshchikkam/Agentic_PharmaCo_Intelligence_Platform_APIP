# Development setup and verification

This page describes the welcome/sign-in, patient, MedAssist, and ADR evaluation previews plus the preserved developer design reference. MedAssist provides guided English-only symptom intake, optional local-model source-quote selection, and a location-only Maps handoff; clinical urgency and tailored precautions are disabled. ADR now stores fictional drafts in owner-isolated local SQLite, with a separate browser demo. See the dated [development history](history/2026-10-17.md) for actual checks and limits.

## Prerequisites and installation

The current script runs `tsx server.ts` in Node.js; the server uses built-in `fetch`. Use Node 24 and the tracked Bun dependency workflow. The ADR draft preview uses a review/confirmation step and stores fictional data in browser `localStorage` under a versioned collection key. Existing single-draft v1 and v2 keys load as a one-item collection; legacy v1 drafts remain unconfirmed. This legacy collection remains shared only in the explicitly separate browser demo. Signed-in local accounts use the server draft API; neither mode supports real patient information. Patient confirmation is not clinical or professional review.

The repository tracks `bun.lock`. With Bun available, the intended commands are:

```sh
bun install --frozen-lockfile
bun run dev
```

The server listens on port `3000` and binds all interfaces. Use fictional cases; do not expose this unauthenticated experimental server as a patient service.

Do not silently replace the lockfile or add competing lockfiles. Record installation failures and proposed fixes. An npm workflow can be adopted after the package/lockfile policy is selected and checked.

At the 2026-10-17 implementation session, Bun v1.4.3 was installed from the [official Windows instructions](https://bun.sh/docs/installation). `bun install --frozen-lockfile` installed the tracked dependency set without changing `bun.lock`. `bun run lint` and `bun run build` passed in this checkout. A later developer-reference browser check verified appearance controls; a clean-clone/deployment flow remains unvalidated. See the dated history.

## Existing scripts

- `dev`: `tsx server.ts` — Express and Vite middleware outside production.
- `build`: Vite client build, then an esbuild server bundle at `dist/server.cjs`.
- `lint`: `tsc --noEmit` — frontend checking under the current TypeScript config.
- `start`: `node dist/server.cjs` — requires built output and configured environment.

Use the agreed package manager to run scripts. No test script exists. Do not describe `lint` as comprehensive server/security validation.

## Environment

MedAssist uses the fixed local Ollama service with installed `qwen3.5:2b` by default. Optional server environment `MEDASSIST_MODEL` selects another installed model; startup still does not load `.env` automatically. No API key, hosted fallback, or model download is used. The loopback-only endpoint is a source-quote experiment, not the intended urgency classifier. See the [MedAssist API/setup and checks](../src/features/medassist/README.md) and [live smoke observations](../models/evaluations/2026-10-17-medassist-smoke.json). Restart the development server after backend changes; the current dev script does not watch server files.

[.env.example](../.env.example) lists `GEMINI_API_KEY`. Provider configuration is optional for existing fallback behavior, which is not clinically reliable.

- Supply credentials through the server environment or a deliberately configured loader.
- Startup does not load `.env` automatically; copying the example is insufficient.
- Never commit populated credentials or expose them in browser variables. The root `.gitignore` excludes installed dependencies, generated build/coverage output, environment files, and common machine artifacts. Review staged paths explicitly; ignore patterns do not replace secret review.
- `NODE_ENV=production` selects static serving. `start` does not set it. Production bundling/dependency behavior remains to be verified.

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
