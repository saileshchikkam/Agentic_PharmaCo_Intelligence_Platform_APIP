# APIP developer working agreement — proposal

Sailesh owns ADR documentation, server/adr/, src/features/adr/, and ADR-specific contracts, tests and scripts. Jayanth owns the isolated app/ backend and approved MedAssist-specific code, tests and documentation, subject to review. ADR runs independently of MedAssist disease inference. Preserve sealed Model A research and keep Model B disabled. Clinically unapproved safety work remains in draft review.

Coordinate changes to server.ts, runtime setup, server/local-account.ts, src/App.tsx, access/account components, shared contracts, root dependencies, global configuration, README, changelog and roadmap. Agree on the contract and owner before editing shared surfaces.

Proposed CODEOWNERS entries for discussion. Keep this proposal in documentation until both owners agree. Two names on a CODEOWNERS rule designate eligible owners and do not require approval from both.

```text
/docs/adr/ @saileshchikkam
/server/adr/ @saileshchikkam
/src/features/adr/ @saileshchikkam
/app/ @jayanth12-git
/server.ts @saileshchikkam @jayanth12-git
/server/local-account.ts @saileshchikkam @jayanth12-git
/src/App.tsx @saileshchikkam @jayanth12-git
/README.md @saileshchikkam @jayanth12-git
/CHANGELOG.md @saileshchikkam @jayanth12-git
/docs/roadmap.md @saileshchikkam @jayanth12-git
```

Use one checkout per branch. Sailesh continues feat/adr-1a-guided-reporting in the existing ADR checkout. Use a separate sibling worktree named apip-adr-integration on chore/adr-main-reconciliation for the reviewed merge rehearsal. Keep the protocol-verification worktree with codex/medassist-emergency-recognition and its pending research intact. Use apip-collaboration-hygiene on chore/apip-collaboration-hygiene for documentation review.

Jayanth first inventories his current branch, local-only commits, staged/unstaged edits and untracked files. Make a private verified backup, including ignored assets that matter, and share only reviewed code diffs or selected commits. After agreement, create feat/medassist-jayanth from freshly fetched origin/main in a new sibling worktree named apip-medassist-jayanth. Compare against main before transferring any changes. Keep datasets, credentials and local artifacts private. Use a separate dependency environment for the historical backend. Validate its dependencies and artifact provenance before any execution. Confirm transferred changes against the saved inventory before retiring anything.

Sailesh keeps ADR work on its feature branch, reviews the collision receipt privately, and uses the separate reconciliation checkout when ready. Review PR #3 with the account and MedAssist owners before moving it out of draft. Use separate ports and local state locations when running concurrent development instances.

Proposed main rules after explicit approval are pull requests, one independent approval, dismissal of stale approvals, passing stable CI checks, blocked force pushes and deletion, and no routine bypass. Review the CI pilot and administrator recovery policy together before enforcement.

See the [branch audit](branch-audit-2026-11-04.md) for evidence, merge conflicts and retirement gates.
