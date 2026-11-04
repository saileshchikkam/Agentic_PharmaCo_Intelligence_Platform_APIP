# Proposed parallel development protocol

Status: recommendation only. ADR-0 creates no branches, worktrees, commits, merges or shared-file edits. Resource split is 75% ADR / 25% MedAssist. This file assigns **proposed ownership**, not proof that another conversation accepted it.

## Ownership boundaries

**ADR owner:** `docs/adr/`, `shared/adr/`, `server/adr/`, `database/adr/`, `knowledge/adr/`, `src/features/adr/`, `tests/adr/`, and explicitly named `scripts/adr-*`. The legacy shared `ReportReactionView.tsx` requires coordination before modification because it also appears in the developer reference. New canonical ADR types belong to `shared/adr`, not the older mock `src/types.ts`.

**MedAssist owner:** `src/features/medassist/`, `src/features/medassist-conversation/`, `src/features/medassist-intelligence/`, `src/features/model-a-research/`, `server/medassist*`, `server/model-a-demo.ts`, `server/groq-extraction.ts`, `server/medgemma-extraction.ts`, and existing MedAssist scripts/model documentation. These path families indicate boundaries, not authorization for ADR to edit them. Sealed model/evaluation artifacts, frozen Model A, Model B state and emergency policy remain immutable to ADR even if located within these owned families. No ADR-triggered training/qualification/live Groq calls.

**Shared infrastructure owner (one integrator, named before implementation):** `server.ts`, `server-entry.ts`, `server/runtime.ts`, `server/local-account.ts`, proposed `server/account-session.ts`, `server/local-request.ts`, `src/App.tsx`, `src/main.tsx`, account/access features, global styles, Material/design-system wrappers, package/lock/compiler configuration, root README, platform docs/history/changelog and Git workflow/hooks. Do not concurrently edit any of these files across conversations.

**Contract owner:** ADR owner maintains proposed `shared/adr/*` and ADR contracts page. Shared integrator owns identity/session/policy seam; MedAssist owner owns any MedAssist source handoff. Contract changes require a written compatibility note and consumer agreement before either implementation starts. UI fixtures cannot silently redefine backend types.

## Optional MedAssist handoff

ADR and MedAssist remain independent domain modules. Share infrastructure, not inference outputs as trusted clinical facts. Minimal proposed envelope:

```ts
type AdrContextHandoff = {
  schemaVersion: 1; fictionalOnly: true;
  source: 'medassist'; sourceRevision: string;
  statements: { text: string; language: 'en'|'te'|'mixed'|'und' }[];
  userConfirmedForAdrImport: true;
};
```

No disease, urgency, causality, Model B output, source clinical conclusion or automatic profile history. The receiving UI shows selected original statements and asks confirmation before an ADR-controlled import operation. Imported text remains source-attributed; structured facts are unconfirmed until ADR confirmation. Shared login identifies owner, not consent to send data to a provider. Cross-account import is denied. This handoff is stretch and **not implemented**; no code in ADR-0 or assumption of an existing connected journey.

## Branch/worktree strategy after authorization

Do not run two writers in this same checkout. Current checkout contains unrelated untracked work and is on a MedAssist branch; do not change branches underneath the other conversation or move/remove those files. After implementation authorization, coordinate a reviewed common base and reuse a suitable attached ADR checkout if one exists. If necessary, create a separate worktree using the supported worktree tool, with a `codex/adr-*` branch. This is a future recommendation; no branch/worktree is created here. Avoid duplicate clones/repositories.

The current local branch, GitHub main and PR #2 head differ. Never assume PR #2 has been merged or use its safety repair as qualified shared infrastructure. Pick a base explicitly after comparing shared contracts. ADR must not require merging PR #2 to function.

## Working rules

1. At start/end of each work block, inspect branch, HEAD, dirty/staged/untracked state. Record pre-existing work; stage only the task's explicit files if that future task permits commits.
2. Before touching a shared file, announce intended paths and change to the other owner and obtain ownership coordination through the user if direct cross-chat work is not authorized. ADR-0 sends no messages to other conversations. One writer owns each shared file until a checkpoint; a verbal convention is not a filesystem lock.
3. ADR contracts freeze at end ADR-1, then evolve additively. Breaking change means update schema version, API fixtures and both consumers together; do not silently coerce unknown values or source provenance.
4. Never share one writable SQLite file across worktree tests. Each worker/test gets a disposable DB override; do not point at another conversation's live account DB. Keep provider flags off and use injected transports for offline tests.
5. Do not run builds/migrations/training in the other checkout, modify another owner's lockfile or use whole-tree formatter/staging commands. No `git add .`, force-push, reset or destructive conflict resolution.
6. Dated history is a shared append surface. Integrator appends distinct entries in the user's local date, preserves prior text and consolidates navigation/status; do not overwrite another conversation's history.
7. Before future integration, compare exact touched paths and contract hashes, review differences and rerun relevant tests against the integrated tree. A successful branch test is not evidence for an untested merge.

## Integration checkpoints

- **C0 / before ADR-1:** agree base, ownership and session/cookie seam; preserve dirty/untracked work and PR #2 state. No implicit branch creation.
- **C1 / end ADR-1:** case/missingness/API schemas and policy stable; account/profile and cross-user tests pass before frontend/agents depend on them.
- **C2 / end ADR-3:** source registry/citation schema and provider interface stable; no MedAssist artifact mutation; source rights/review status visible.
- **C3 / end ADR-4:** stale/retry/restart/execution contract verified; shared bootstrap changes reviewed by integrator.
- **C4 / end ADR-5:** integrated authenticated owner/reviewer/browser/export flow and deterministic dashboard checked; optional handoff separately tested or left absent.
- **C5 / ADR-6:** exact combined diff review, backend/shared/frontend checks, build, focused regressions, preservation checks and demo runbook. No merge/deploy unless that later task explicitly authorizes it. Keep PR #2 draft/unmerged.

If conflict occurs: pause only the affected file/dependent work, preserve both diffs, ask the owner/user to choose intended behavior, implement a reviewed combined change and rerun relevant checks. Do not resolve clinical policy, research artifacts or competing histories by choosing “ours/theirs.” Continue independent ADR documentation/tests where safe.
