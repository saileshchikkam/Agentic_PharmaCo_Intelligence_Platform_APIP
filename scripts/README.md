# Repository workflow

APIP contributors and Codex commit completed task changes with their documentation and appropriate checks. The user has authorized routine commits and GitHub pushes without repeated confirmation. [AGENTS.md](../AGENTS.md) defines task ownership and completion requirements.

## How it runs

1. Codex completes an authorized change, updates the dated history and affected docs, and runs the relevant checks.
2. The completion helper stages only explicitly selected files and creates a meaningful commit.
3. The [post-commit hook](../.githooks/post-commit) pushes the commit to the matching branch of the reviewed origin.
4. The helper verifies the remote-tracking commit. Failed sync remains visibly pending while the local commit is retained.

This is a completion workflow, not a file-save watcher or recurring cloud job. The agent initiates automatic commits under its standing project instructions; the Git hook automates pushing after a commit. Merely editing a file outside an agent task does not create a commit.

## One-time checkout setup

Node.js and Git must be available on PATH. Node 24 and Git for Windows were used to verify this workflow; the app's supported runtime baseline is still a separate decision.

```sh
node scripts/git-workflow.mjs install
```

Installation sets only this checkout's `core.hooksPath`, `apip.autoSync`, and reviewed origin URL. It refuses to hide existing custom hooks. It does not change global Git configuration or credentials. Review any future destination change before reinstalling. New clones need this one-time setup; tracked hook files do not automatically install themselves.

## Complete a task

Run checks appropriate to the actual code first and record their outcome. Then select literal task-owned files, including the updated dated history:

```sh
node scripts/git-workflow.mjs complete --message "docs: clarify reporting workflow" -- docs/layers/adr-reporting.md docs/history/2026-10-16.md
```

The example illustrates syntax; use the actual current history date and affected paths. The helper does not determine clinical correctness or replace build/behavior checks. It refuses existing staged work, directories, path expansion, common credential filenames, detached HEAD, in-progress Git operations, and an unexpected origin. Its filename check is not a comprehensive secret scanner.

Before committing, it requires a changed dated history entry and checks staged whitespace. Individual files are added literally. Unrelated unstaged work stays outside the commit. If validation stops after staging, selected changes remain staged for review; they are not discarded.

## Sync failure and recovery

The hook uses an ordinary push, with bounded wait and no interactive credential prompt. It never force-pushes, merges, rebases, or resets history. A conflict, authentication failure, permission restriction, or network failure leaves a local commit and a visible pending-sync message. The agent must respect approval controls and report unresolved blockers.

After the cause is resolved, retry:

```sh
node scripts/git-workflow.mjs push
```

## Verification and maintenance

```sh
node --test scripts/git-workflow.test.mjs
```

Tests create isolated local repositories and local bare remotes; they never push to GitHub. They exercise actual commit hooks, selective staging, unrelated work, journal requirements, invalid paths, destination changes, failed pushes, feature branches, and existing hooks. Temporary targets are checked before cleanup. Some sandboxes require approval for the tests to write Git metadata.

To disable automatic pushes in this checkout, set `git config --local apip.autoSync false`. The hook then reports pending sync instead of pushing. To remove the project hook path as well, use `git config --local --unset core.hooksPath`; reconcile any other hooks first. Update the standing project instructions if the user revokes automatic completion.

Git's [hook documentation](https://git-scm.com/docs/githooks) explains the commit event and why hook failure cannot undo a local commit.
