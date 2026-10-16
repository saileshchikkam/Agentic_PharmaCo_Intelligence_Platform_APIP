# APIP Git hooks

[post-commit](post-commit) runs the repository sync helper after a commit. It preserves the commit if pushing fails and reports that cloud sync is pending.

Install only for the intended checkout using `node scripts/git-workflow.mjs install`. The installer preserves existing custom-hook configurations and records the reviewed origin. See [workflow setup, checks, and recovery](../scripts/README.md) for the complete contract.

Hook files use LF line endings and are tracked executable. The helper never force-pushes or stages files from this event.
