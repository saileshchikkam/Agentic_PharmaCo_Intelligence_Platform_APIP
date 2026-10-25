# Frozen Model A protocol portability â€” 2026-10-26

## Identity and root cause

Only `models/medassist_v2/adaptive-questioning-protocol.json` differs between the original preserved working copy and canonical Git. There are 344 line endings. Git SHA-256 (pure LF): `569169b5c119c01beb408fe35e20139b0e9e932a92e8c31fccc20468a19da076`. Historical SHA-256 (pure CRLF): `734050555cb9c42e4bc0b47884cf4bac27ec20da5b531c3457685b86dc2c899a`. Expanding every LF in the canonical snapshot to CRLF reproduces the authenticated historical digest exactly; reversing only CRLF recovers the canonical bytes. JSON and every non-line-ending byte are identical. All thirteen sealed implementation-file hashes already match canonical Git and need no exception.

Frozen `questioning_protocol.load_protocol` hashes raw bytes against the adjacent pin; `training.runner.protocol` also hardcodes the historical raw digest. The fresh LF checkout failed protocol-dependent setup in the adapter, handoff, demo, understanding and modular fixtures. Reconciliation recorded 73 tests run, eighteen errors and four skips; setup failures prevented some tests from executing. Actual model checks previously passed only in the original workspace.

## Narrow compatibility boundary

New unsealed [protocol_integrity.py](../models/medassist_v2/research_adapter/protocol_integrity.py) accepts only the exact UTF-8 LF or CRLF snapshots, against both fixed SHA-256 anchors before parsing the same bounded bytes. It requires the protocol filename and original adjacent pin; rejects symlinks, BOMs, invalid encodings, mixed/bare/doubled CR and oversized/missing/substituted files. No trimming, generic whitespace normalization, JSON reserialization or caller-supplied digest is used. Added/removed/changed fields, numeric changes and other whitespace fail closed.

The read-only adapter, fixtures and smoke scripts use this explicit boundary, preserving their behavioral assertions. General `file_hash`, binary `checked_bytes`, all thirteen implementation hashes and seventeen artifact digests remain exact. Read-only `verify_existing_seal` additionally authenticates the original seal against the unchanged published Task 4B receipt and hash receipt, exact artifact membership/source attestations, original root/mode and implementation. It performs no locked-test or ledger operation.

Frozen study code remains unchanged. Old training/campaign/locked-test functions stay strict and unpatched. This is not a general training retrofit or permission to evaluate the official test. Exact scientific versions, trusted local pickle, metadata attestations and configured private roots remain required. No protocol/pin, study result, source data, weight, environment, provider or clinical gate changes.

## Regression evidence and verification gate

The new 22-method suite covers historical/canonical acceptance, inverse transformation, field/numeric/add/remove/whitespace tampering, mixed/malformed endings, encoding/BOM/corrupt/missing/substituted paths or pins, symlinks, bounds, deterministic byte mutations, exact binary checks, seal substitution, unchanged locked-test implementation and read-only verification. Synthetic files are software fixtures, never patient records. The initial focused integrity/protocol/adapter run passed 63 tests, zero failures/errors/skips.

Clean-checkout full verification is pending at this implementation checkpoint. Record its actual results and PR status separately before declaring readiness or merging. Do not rewrite the original reconciliation failure receipt as a pass.

## Clean-checkout verification completed

Verified repair commit `2f1fc18c49382d6a39bae64e60e5988b7d6027a0` in a newly created clean managed worktree. The protocol there is the unmodified canonical LF blob; no copied CRLF protocol, verifier monkeypatch or private configuration file was used.

- Python: **210 passed, zero failures, errors or skips**, warnings treated as errors. Includes 22 new portability tests, protocol semantics, loader/simulator/format fixtures, adapter/modular/disabled-provider/evidence tests, Model B software fixtures and four actual trusted Model A tests. Explicit module selection excludes training/locked-stage execution fixtures and the unsafe legacy root prediction script; no model training or official test was run.
- TypeScript/HTTP: **113 passed, zero failed/skipped**. Git workflow: **10 passed, zero failed/skipped**. Frontend and strict backend types pass; production build passes with the existing 961.67 kB client-chunk warning.
- Independent read-only compatibility seal verification matches all **17 artifacts**, original published seal/hash receipt, source attestations, thirteen implementation hashes and pinned environment. Historical frozen Git blobs and protocol/pin remain unchanged.
- Additional actual-model HTTP smoke returns three HTTP 200 responses: initial question, UNKNOWN answer with a different follow-up, user stop and 223-item export with disabled Model B. No old receipt was overwritten and no cloud request occurred.
- No official source archive, locked test or stable ledger was opened. The original sixteen untracked contributor files and original working tree remain preserved.

The prior 73-test/18-error reconciliation result is retained as historical evidence, not overwritten. [Machine-readable results and exact repair inventory](model-a-protocol-portability-verification.json) record this new verification. Read-only inference portability is resolved for these authenticated representations; strict legacy study commands, exact package versions, original trusted artifact roots/pickle and independent clinical gates remain constraints.
