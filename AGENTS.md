# APIP development instructions

## Project identity and scope

- APIP means **Agentic Pharma Co-intelligence Platform**.
- Read [product vision](docs/product.md), [architecture](docs/architecture.md), and the affected [layer guide](docs/layers/README.md) before changing behavior.
- The existing build is a Material 3 demonstration with experimental backend code, not the implemented product. Preserve useful design work; do not promote mocks into clinical functionality.
- ADR reporting is the core. MedAssist is optional; a person can report directly.
- The current user task determines authorized work. A roadmap entry is not permission to implement or deploy it automatically.

## Required design and data behavior

- Follow [Material Design 3](https://m3.material.io/components) and [Material Web](https://github.com/material-components/material-web) strictly. Use official components where provided; document specification-based implementations for gaps. Do not silently switch design systems.
- Support phone, tablet, desktop, keyboard access, accessible labels, and reduced motion.
- Preserve user statements, AI suggestions, confirmed fields, and professional conclusions separately. Unknown values must remain unknown.
- RAG retrieves approved evidence; deterministic code computes statistics. Report proportions are not incidence or proof of causality.
- Keep keys server-side and use fictional cases by default. Project permission does not establish patient-data rights, clinical validation, or authority to share records.
- New reports must not automatically retrain models or become trusted medical evidence.
- The initial test scope is English and Telugu with fictional cases. Evaluate Telugu script, transliteration, and mixed-language input separately; bilingual clinical wording needs qualified review.
- The user gave a budget of `500`; planning assumes INR 500 monthly pending currency confirmation. Prefer local development and bounded API evaluation; do not treat this as approval to purchase hosting or send real records to a provider.

## Working practice

- Inspect Git state and relevant code first; preserve unrelated work.
- Keep changes focused and verify affected behavior. Report actual checks, failures, and limitations.
- Current scripts are in [development setup](docs/development.md); `lint` checks frontend TypeScript, not the whole server or security.
- Do not create duplicate repositories, invent recovered history, or claim integrations, releases, or approvals without evidence.

## Automatic commit and GitHub sync

- The user gives standing authorization to commit and push completed, user-authorized APIP changes to this repository without asking again after each task.
- At task start, note existing dirty/staged work. After completing the task, update its documentation/history and run the relevant checks; commit only this task's explicit files with a meaningful message.
- Use `node scripts/git-workflow.mjs complete --message "summary" -- file1 file2 ...`; the installed post-commit hook pushes to the matching branch on the reviewed origin.
- Do not commit after every intermediate edit, sweep unrelated work into a commit, or claim unrun checks passed. If required checks fail, fix them or report the incomplete task.
- Never force-push, reset, bypass checks/approvals, or resolve conflicts destructively. Report blocked syncs; a local commit is not proof of GitHub backup. Verify the final commit and remote-tracking state.
- This workflow covers task completion and Git commit events, not a background watcher of arbitrary edits. See [workflow setup](scripts/README.md).

## Documentation is part of completion

- Follow [the documentation guide](docs/README.md). Update affected docs with the code in the same commit.
- Append meaningful work to `docs/history/YYYY-MM-DD.md` using the user's local date. Keep separate entries for distinct work on the same date; never invent future entries or overwrite prior events.
- Record what changed, why, affected layer/files, checks/results, limitations, and next action. Never log a plan as completed.
- Update `CHANGELOG.md` for notable changes, `docs/decisions.md` for durable decisions, and `docs/roadmap.md` when milestone evidence changes.
- Keep root and documentation READMEs accurate. Add a focused directory README when a substantial new subsystem needs navigation; avoid repetitive READMEs for every component.
- Maintain one source per concern. Consolidate duplicate task lists and placeholders after preserving useful content.
- Keep private machine paths, chat identifiers, credentials, and patient data out of public docs.
- Before committing, check links, Markdown structure, staged scope, and factual accuracy. Claim a build/test passed only after successful execution.
