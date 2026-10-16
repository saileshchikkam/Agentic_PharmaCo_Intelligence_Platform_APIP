# Development setup and verification

This page describes the existing demonstration. The documentation update did not install dependencies, run the application, or establish a successful build.

## Prerequisites and installation

The current script runs `tsx server.ts` in Node.js; the server uses built-in `fetch`. Supported runtime/package-manager versions are not declared. Establish a tested baseline before claiming reproducible deployment. The initial ADR draft prototype stores fictional data in browser `localStorage`; it does not use the server or support real patient information.

The repository tracks `bun.lock`. With Bun available, the intended commands are:

```sh
bun install --frozen-lockfile
bun run dev
```

The server listens on port `3000` and binds all interfaces. Use fictional cases; do not expose this unauthenticated experimental server as a patient service.

Do not silently replace the lockfile or add competing lockfiles. Record installation failures and proposed fixes. An npm workflow can be adopted after the package/lockfile policy is selected and checked.

At the 2026-10-17 implementation session, Node.js v24.19.0 was available, Bun was not accessible, and dependencies were not installed. The existing lint/build commands could not run in that environment; see the dated history. Install through the existing Bun lockfile before treating the app as runnable.

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
- Never commit populated credentials or expose them in browser variables. The baseline lacks a tracked `.gitignore`; review staged paths explicitly until addressed.
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
