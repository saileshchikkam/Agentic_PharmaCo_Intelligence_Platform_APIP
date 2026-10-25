# Main-branch reconciliation â€” 2026-10-26

**Blocked for main merge.** The dedicated integration branch resolves the repository conflicts and preserves both histories, but fresh-checkout Python verification fails the existing frozen protocol checksum gate. Per the task instruction, prepare an open draft PR and do not merge it while verification is failing. This is an engineering integration review, not clinical approval.

## Original relationship and preservation

Fetched origin confirms main `6965b204bbc70eac91fccad5669a8a1c384c6844`, feature `161a14cce8e3923ff7beed8f10ca225b5156d246`, common ancestor `7618d4e63df4ef12615f264cddcf8320237cb2cd`; the feature is three commits ahead and two behind main. Integration uses `codex/apip-main-reconciliation`, created from remote main in an isolated managed worktree, then an ordinary two-parent merge of the feature. No squash, rebase, reset, force push or original-checkout branch change is used. The original feature branch and its 16 untracked contributor files remain untouched.

All 58 contributor Git blobs under `app/`, migrations, root requirements, contributor test and related backend documentation remain identical to remote main. Both Jayanth commits, `357906c45945e9e42fcd0dabe234f9c178ad2ec3` and `6965b204bbc70eac91fccad5669a8a1c384c6844`, are retained in ancestry. All 16 recovered canonical files match their pinned SHA-256 and Git provenance. Standard checkout conversion had changed the bytes of ten text files in the new worktree; they were restored from unchanged Git blobs, with scoped attributes preventing future conversion. No weights were changed or deserialized. The original recovered files were not moved or overwritten.

## Individually resolved conflicts

- `.gitignore`: union of both parents' rules, deduplicated and grouped. Node/build, environment/credential, account database, Python/cache, editor, OS and log exclusions remain. Populated environment files stay excluded; only the empty example is excepted.
- Root README: removes both the new merge conflict and literal conflict markers already committed on main. Retains the full APIP overview and current MedAssist/ADR/four-agent status; corrects stale patient sign-in wording. The requested full platform title is used; other historical naming is not rewritten across the repository.
- The useful standalone contributor documentation is [preserved separately](contributors/jayanth-medassist-backend.md), with its source commits and explicit current execution/clinical caveats. Historical disease/confidence/precaution claims are not promoted to verified APIP capability.

No application source, Groq provider selection, Model B execution gate, frozen research code/protocol or sealed Model A artifact was changed by conflict resolution. Root `requirements.txt` remains contributor-specific and must not be installed into the pinned Model A environment. The separate legacy backend has import-time Joblib loading and database table creation, and remains outside approved APIP startup/testing.

## Verification results

- Merged-worktree TypeScript/HTTP suite: **113 passed, zero failed/skipped**. Includes ADR/account behavior, guarded routes, evidence semantics, provider failures/recovery, safety precedence and navigation.
- Frontend types, explicit strict backend types and production build: passed. Existing 961.67 kB main-client chunk warning remains.
- Existing understanding, reliability and safety/navigation browser scripts: passed at **390/820/1440px**, zero page errors, authored mocked model/provider transports and no cloud/Maps calls. These are software checks, not new model-performance evidence.
- Merged-worktree Python suite: **failed â€” 73 tests run, 18 errors, four skipped**. Protocol-dependent class setup and individual tests fail with `InvalidRecord: protocol_checksum`; some tests never reach execution. The four preserved-root-only actual-model tests were skipped in this worktree and are not counted as passes here.
- Preserved original workspace: the four existing actual trusted Model A parity/inference tests **passed**. Fresh read-only verification matched all **17 sealed artifacts**, seal/hash receipt, source attestations, frozen implementation and pinned environment. No official source archives, locked test or stable ledger were opened. Ledger emptiness is not freshly asserted.
- Final static checks covered 675 tracked text files with no remaining conflict markers, provider/private-key or exact configured-secret matches, invalid JSON, contributor Python syntax errors or missing local `app.*` import paths. Relative links and staged whitespace pass; GitHub Markdown rendering of the corrected README passes. All 614 feature files outside the eleven explicitly reviewed documentation/ignore/attribute paths retain their original Git blobs. All 58 contributor blobs and the 16 raw artifact/source hashes match. The separate backend was neither imported nor started. No dedicated secret scanner was installed; pattern/exact-secret and explicit staged-file checks do not certify the entire repository secure.

The [machine-readable evidence](reconciliation-2026-10-26.json) separates outcomes, original inputs and completion-time Git checks. Prior receipts remain unchanged; no existing failed outcome is relabelled as a pass.

## Exact blocker and next action

The original working-copy protocol satisfies the recorded frozen digest, but the fresh checkout does not. The fresh file equals the original after CRLF-to-LF conversion, and its canonical Git blob is identical in main, feature and integration. This proves a **preexisting byte-portability defect**, not a merge-time semantic change. The merge does not normalize frozen files, replace the digest, disable verification or copy private runtime configuration to hide the failure.

A separately authorized research-integrity/portability repair must define how a fresh checkout can verify the original frozen protocol and implementation without weakening trust or rewriting study artifacts. After that reviewed repair, rerun affected Python and actual-model checks from the integration checkout, resolve any other failures, and only then use a history-preserving PR merge subject to required checks/reviews. No main merge is authorized by passing frontend tests alone.

Clinical blockers remain independent: literal provisional safety misses the documented heart-attack and stroke declarations; no match is not clearance; Model B and disease inference remain disabled; personalized precautions and verified facility suitability/availability are unavailable. NHAMCS ED experiments are research-only and do not qualify community urgency. No training, provider change, patient-data acquisition or clinical activation occurred.

## Git completion boundary

The repository completion helper explicitly refuses an in-progress merge. Complete this reviewed integration with a normal merge commit retaining both parents, dated documentation and the installed post-commit sync hook; do not bypass hooks or protections. Push only the integration branch and create a draft PR targeting main. The PR URL, merge-commit SHA and live remote state must be reported from actual results, not invented in this pre-commit record. Main stays unchanged while verification is blocked. Keep the original feature branch.

## Subsequent portability repair checkpoint

The [narrow read-only compatibility boundary](model-a-protocol-portability.md) preserves the failure report above and all frozen identities. Initial integrity tests pass; clean-checkout verification is pending at this commit. PR #1 stays draft until actual fresh checks and applicable review conditions pass. Historical outcomes above are not relabelled.

## Current readiness after clean-checkout verification

The [subsequent authenticated repair](model-a-protocol-portability.md#clean-checkout-verification-completed) passes 210 Python tests, 113 TypeScript/HTTP tests, ten workflow tests, types/build and independent seal/actual-model HTTP verification in a clean LF checkout. Zero test failures/errors/skips remain in that scope. The earlier failure above is historical; the protocol/pin and thirteen sealed implementation files remain unchanged. PR #1 can now be marked ready subject to final scope and GitHub check/review conditions. This is engineering readiness only; all clinical limitations remain.
