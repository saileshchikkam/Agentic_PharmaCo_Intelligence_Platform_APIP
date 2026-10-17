# Development setup and verification

This page describes the welcome/sign-in interface preview and preserved developer design reference; earlier product workflows remain unmounted. The pinned dependency install, frontend lint, and production build passed in the current checkout on 2026-10-17. Limited developer-reference appearance checks have also passed in the browser; see the dated [development history](history/2026-10-17.md).

## Prerequisites and installation

The current script runs `tsx server.ts` in Node.js; the server uses built-in `fetch`. Supported runtime/package-manager versions are not declared. Establish a tested baseline before claiming reproducible deployment. The unmounted ADR draft prototype stores fictional data in browser `localStorage`; it does not use the server or support real patient information.

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

## Sign-in UI preview

The current client uses hash URLs described in the [access guide](../src/features/access/README.md). Submitting fictional details performs local-only validation and displays a pending-authentication message. No sign-in API, account, session, password persistence, or role enforcement exists. Local Google Sans Flex files and their licence/provenance are under [public/fonts](../public/fonts/README.md); Vite serves and copies them into the build.
