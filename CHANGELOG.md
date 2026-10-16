# Changelog

Notable product and developer-facing changes. Entries describe completed work; plans belong in the [roadmap](docs/roadmap.md). An unreleased entry does not imply a release or clinical readiness.

## Unreleased

### Repository automation — 2026-10-16

- Added a task-completion helper that commits explicitly selected files with a required dated history update.
- Added an installed checkout-local post-commit hook for automatic ordinary pushes to the matching branch of the reviewed origin.
- Preserved unrelated work and local commits on push failure; destination changes and existing custom hooks require review.
- Recorded standing user authorization for routine completed-work commits and GitHub sync without repeated confirmation.
- Verified the workflow with ten integration tests against isolated local Git repositories and remotes.

### Documentation — 2026-10-16

- Established the canonical product name, vision, connected layers, and four-agent direction.
- Rewrote the README to explain the demonstration baseline and guide contributors.
- Consolidated incomplete and repeated planning files into architecture, setup, layer, milestone, decision, research, and validation documentation.
- Established dated development history and required documentation updates alongside code.
- Preserved useful origin, research, future ideas, prior findings, and dependencies without publishing local chat/workspace identifiers.
- Replaced calendar-bound planning with ongoing milestones and acceptance gates.

Application code and dependency versions are unchanged. See [dated history](docs/history/2026-10-16.md) for scope and verification.

## Earlier repository history

- [`5400696`](https://github.com/saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP/commit/54006967a0325acdae83e46f04a84b4ce1ad4f92): Material 3 component views and shared tokens.
- `4b0e6e3`: initial pharmacovigilance prototype and documentation, as recorded in Git.

Earlier templates did not establish a reliable release history. No version tags or completion dates are invented for that work.
