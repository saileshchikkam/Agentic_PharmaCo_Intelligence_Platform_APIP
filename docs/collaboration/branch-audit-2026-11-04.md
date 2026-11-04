# APIP branch audit — 2026-11-04 IST

Live GitHub heads matched the local remote-tracking refs. Counts below are relative to main at 5085a265 and exclude working changes.

| Branch | Tip | Behind / ahead | Disposition |
|---|---|---:|---|
| main | 5085a265 | 0 / 0 | Integration base |
| MedAssist-Jay | 54006967 | 56 / 0 | Incorporated historical pointer, owner confirmation required |
| codex/apip-main-reconciliation | 27446fd6 | 2 / 0 | Incorporated through PR #1, conditional retirement candidate |
| codex/medassist-v2-task5a-adapter | 161a14cc | 7 / 0 | Incorporated, conditional retirement candidate |
| codex/medassist-emergency-recognition | db1274a4 | 0 / 2 | Active draft review and local research |
| feat/adr-1a-guided-reporting | 06f1258c | 7 / 1 | Active ADR development and draft review |

Local main is 7618d4e, ten commits behind its upstream. The other four local branches match their named upstreams. MedAssist-Jay has only a remote-tracking ref here. No local branch commits were found outside the remote refs. Local worktree edits are separate from commit ancestry.

The ADR worktree reports two untracked entries, app/ and requirements.txt, with 16 nonignored leaf paths that collide with tracked main paths. A local SHA-256 receipt was recorded outside Git. Treat ignored files under app/ as potentially valuable too. Preserve a private verified copy of the entire directory and requirements file before any future transfer. Compare bytes and review differences in an isolated worktree. The reconciliation worktree was clean. The protocol verification worktree contained nine modified and 46 untracked entries, with no staged entries observed. Preserve it as a separate research workspace.

Jayanth's 357906c added app/ and requirements.txt. His 6965b20 merge and initial contribution are both ancestors of main. MedAssist-Jay points at an older shared ancestor, so it contains no unique commits despite the contribution being present in main. The emergency and ADR branches retain unique remote commits. The collision files and research worktree edits are laptop-local material whose presence is separate from published history. Work on Jayanth's computer requires his inventory and transfer confirmation.

## Pull requests and shared paths

PR #1 merged as 092dd4b1. PR #2 is open, draft and technically mergeable at the observed tips. Its medical NO-GO remains in force. PR #3 is open, draft and conflicting. Its merge base is 161a14cc. A Git merge simulation found these shared changes.

| Path | Simulation | Reconciliation review |
|---|---|---|
| .gitignore | Content conflict | Combine compatible ignore rules and retain the local-only PDF template and private inputs exclusions |
| CHANGELOG.md | Content conflict | Preserve both histories and retain accurate ADR and MedAssist statuses |
| docs/development.md | Content conflict | Keep ADR setup and fixture limitations alongside MedAssist research constraints |
| README.md | Auto-merged | Review project entry points and scope |
| docs/architecture.md | Auto-merged | Review account isolation, ADR independence and disabled clinical paths |
| docs/roadmap.md | Auto-merged | Preserve distinct milestones and safety gates |

In a dedicated integration worktree, merge verified main into a review branch based on the ADR tip. Resolve the three conflicts by reading all stages. Review the full merged tree, including Jayanth's tracked backend, ADR routes/tests and authentication. Verify account isolation, authenticated ADR intake and persistence, export with a lawful local fixture, ignore rules, and absence of MedAssist dependencies in ADR. Bring the reviewed reconciliation to PR #3 through a normal update agreed by Sailesh.

## Controls, CI and retirement

GitHub returned an empty repository ruleset list and reported main unprotected. Collaborator metadata showed saileshchikkam as admin and jayanth12-git with write access. GitHub's recent run query returned no rows and the verified main tree has no workflow files. This does not establish that external status checks exist or pass.

Propose Node 24 and a documented pinned Bun release with frozen bun.lock installation. Pilot frontend and explicit backend TypeScript, production build, and deterministic existing Node tests on a CI branch. Review each test for writes and external calls. Separate ADR PDF checks until a lawful fixture is available. Run Python syntax or isolated fixture tests without private datasets, Joblib execution or sealed external artifacts. Keep research-environment and live-service checks local. Require stable CI check names after the pilot. This hygiene change proposes CI and does not add a workflow.

Retirement candidates after acknowledgement are codex/apip-main-reconciliation and codex/medassist-v2-task5a-adapter. Both have zero unique commits. Release the clean reconciliation worktree only after its owner confirms. MedAssist-Jay remains on hold until Jayanth verifies his local refs and changes. PR #2 and #3 head branches stay active. Recheck live refs, all open PR references, worktrees, unpushed changes and owners immediately before any retirement.

## Decisions

| Action | Decision |
|---|---|
| Jayanth starting isolated MedAssist work | BLOCKED pending his local inventory and transfer agreement |
| Sailesh continuing isolated ADR work | GO on the current ADR branch with collision paths preserved |
| Merge PR #3 | BLOCKED pending reconciliation and integration verification |
| Merge PR #2 | BLOCKED by clinical review and qualification |
| Retire branches | BLOCKED pending owner acknowledgements and final checks |
| Enforce main protection | BLOCKED pending explicit administrative approval |

Checks executed for this audit include live head and PR reads, collaborator/ruleset/protection queries, Actions run listing, ancestry and merge simulation, worktree status, and collision hashing. Application tests are outside this documentation-only change. The hygiene branch starts at 5085a265. Its commit and draft PR, if published, are recorded in the delivery response.
