# Local extraction reliability comparison — 2026-10-21

**Decision: no provider qualifies.** Existing UI is unchanged. Unqualified live language requests now return a fast, safe clarification/error path with no inference or accepted evidence; structured symptom buttons plus explicit confirmation still use real Model A. Model B stays disabled. This is AI-assisted engineering evaluation, not human clinical approval.

## Preserved baseline and fixed experiment

Original [MedGemma v2 results](../medgemma-results-v2.json) remain byte-identical: 6/20 semantic agreement (30%), 20/20 JSON-schema validity, 10 unsupported assertions and 6 polarity/UNKNOWN errors; warm median 11.782s/p95 27.075s. The original earlier failed system-message experiment is also unchanged. [Baseline analysis](baseline-analysis.json) separates the observed categories; original v2 raw responses were not retained, limiting retrospective attribution.

The [prospective protocol](protocol.json) fixed the same 20 authored fictional cases, two variants and identical candidate criteria before execution. All **120 requests completed without transport errors**, no retries, downloads or paid calls, in 684.65 seconds. The same user-turn instructions/deterministic decoding apply to each model. Baseline uses the existing evidence JSON envelope; compact uses three symptom-state slots plus a global issue, then deterministic mapping into the same evidence contract. Thinking is disabled, temperature 0, seed 23, context 2048. Output budgets are respectively 384 and 100 tokens. Each request is capped at 30 seconds; total ceiling 20 minutes. Models were unloaded before/after this run.

## Exact comparison

Semantic agreement ignores quote choice but requires matching IDs, states, values, item order, status and issues plus valid supporting spans/types. All failures stay in the 20-case denominator. Counts below are raw proposed assertions, including proposals subsequently rejected. Native JSON schema validity and mapped evidence-contract schema validity are distinct.

| Installed model / variant | Semantic | Native / mapped schema | Unsupported assertions | Polarity/UNKNOWN errors | Warm median | Warm p95 | Warm n |
|---|---:|---:|---:|---:|---:|---:|---:|
| medgemma1.5:latest / baseline | 6/20 (30%) | 20/20 / 20/20 | 10 | 6 | 8.713s | 23.075s | 19 |
| medgemma1.5:latest / compact | 0/20 (0%) | 20/20 / 0/20 | 38 | 0 | 4.501s | 6.509s | 20 |
| qwen3:4b / baseline | 9/20 (45%) | 20/20 / 20/20 | 11 | 5 | 7.745s | 21.664s | 19 |
| qwen3:4b / compact | 2/20 (10%) | 20/20 / 2/20 | 36 | 0 | 2.090s | 2.426s | 20 |
| qwen3.5:2b / baseline | 2/20 (10%) | 20/20 / 20/20 | 1 | 1 | 3.365s | 7.821s | 19 |
| qwen3.5:2b / compact | 1/20 (5%) | 20/20 / 3/20 | 23 | 0 | 2.005s | 2.251s | 20 |

The historical 30% MedGemma result was reproduced at 30%; its newer baseline timing (8.713s/23.075s) is observed run-to-run variation, not a demonstrated prompt gain. Qwen3 4B baseline improved semantic agreement to 45% but introduced 11 unsupported assertions and 5 polarity errors, with 21.664s warm p95. The compact Qwen variants reached roughly two-second medians but reduced agreement to 10%/5%; they are rejected, not deployed as speed improvements. All six candidate gates failed.

Warm samples exclude responses reporting at least 1 second of model loading. Cold baseline requests: MedGemma 17.537s, Qwen3 4B 17.045s, Qwen3.5 2B 13.771s. Compact runs reused each loaded model. Native schema validity alone was 100% for every variant and did not predict semantic correctness. Installed quantizations differ (recorded exact identities in [comparison](comparison.json)); timing is observational on this laptop. Ordinary system load and one concurrent 37-second build were not controlled. The prior run used a 60-second deadline; this comparison used 30 seconds and explicitly disabled thinking. No causal latency superiority or independent generalization claim.

## Failure attribution

- **Model/semantic errors:** MedGemma baseline made negated symptoms positive, invented all three symptoms on empty input, and split a cough contradiction into mismatched symptom IDs. Qwen3 4B interpreted uncertain fever as false and emitted repeated conflicting entries instead of one unresolved contradiction. Qwen3.5 2B often requested duration clarification when no duration existed. These are preserved actual fictional outputs, not clinical facts.
- **Prompt/task failures:** compact models frequently treated unmentioned symptoms as UNKNOWN or absent and chose global `missing`/`injection` issues on ordinary disclosures. They confused slot absence with empty overall input. This is consistent with instruction/task-following failure; the precise causal contribution of each prompt clause was not isolated. No third prompt was tuned against these outcomes.
- **Mapping/validation rejection:** compact mapping refused asserted-but-unmentioned slots, global clarification issues paired with assertions, or missing literal support. This produced mapped schema counts 0/2/3 despite valid native JSON. Those rejections protect evidence; they are not counted as correct extraction. No automatic removal of unsupported slots was used to manufacture passing scores.
- **Schema scope:** all 20 expected outcomes can be represented as evidence or explicit clarification. Duration still has no frozen evidence field; unsupported descriptions and duration must clarify, not acquire invented IDs. Numeric pending E_56 and broader vocabulary are outside this 20-case subset. Schema limitations do not explain the 30% ceiling.
- **Metric separation:** arbitrary copied quotes and wrong status/issues can fail semantic validity. Quote exactness alone explains some exact-output failures but does not explain the 30% semantic score. Unsupported assertion counts include inventing an explicit UNKNOWN for a symptom never mentioned; UNKNOWN and not asked remain distinct.

[Per-case failure categories](analysis.json) and [actual fictional native/mapped responses](responses.json) make these distinctions auditable. These authored engineering cases contain no patient records or clinical labels.

## Runtime decision and changes

The fixed subset candidate gate required at least 19/20 semantic agreement, all 20 valid evidence outputs, zero unsupported or polarity errors, zero request failures, and warm p95 <=5 seconds. [Selection](selection.json) is null. The server checks its hash-bound comparison, model digest and counters at startup and fails closed on missing/changed/unqualified results. Passing this subset would still not complete the original 48-case/two-repeat L2 promotion gate or clinical wording/provenance review.

The compact adapter remains a tested, unselected experimental variant. Production/research UI layout was not changed. The final evidence validator additionally rejects confirmed false on uncertain wording and negatives without literal absence support; the comparison predates these last guard tightenings and is not relabelled as their accuracy. A valid negative remains false; UNKNOWN/contradiction remain null. No facts are autoaccepted, and Model A retains sole follow-up authority.

The live route returns `422 LOCAL_LANGUAGE_NOT_QUALIFIED` before calling Ollama. The existing chat tells the user nothing was recorded and offers supported structured choices. Six actual blocked loopback requests measured median 2.5ms/p95 3.4ms. **This is fast rejection, not improved extraction accuracy or inference latency.** No silent phrase fallback or unqualified model choice was introduced.

## Actual integration and preservation

[Initial diagnostic smoke](integration-smoke.json) ran real local MedGemma and verified its proposal was withheld, then independently supplied an authored structured positive to real Model A. [Final browser smoke](final-route-smoke.json) verified fast withholding of uncertain input with no candidate, explicit structured Cough confirmation, real follow-ups E_53 then E_79, UNKNOWN preservation, user stop and a 223-item `model-a-to-b.evidence.v1` handoff. No provider-qualified end-to-end inference claim is made because no provider qualifies.

All 17 sealed artifact hashes and seal digest matched again. All 22 [protected files](preservation-verification.json), including UI component/CSS, frozen implementation/protocol/handoff, immutable suite and prior results, matched task-start hashes. Adapter startup additionally checked its pinned environment, implementation and metadata. No official test or stable ledger was opened, read or consumed. Preserved CRLF-local/LF-Git exact-byte portability, trusted-pickle/package environment, and unverified installed MedGemma upstream provenance/licence constraints remain. No refits, Model B training, model downloads, staging, commits or pushes. Existing loopback preview only was refreshed with private configuration retained; no public listener or unrelated service was started.

## Checks and next step

28 focused Node tests and 18 Python tests passed, zero failures/skips. Frontend and explicit backend/comparison TypeScript checks and production build passed, with the existing >500kB client chunk warning. UI source/layout hashes were unchanged. The final browser used actual Model A, not authored transport stubs. All temporary comparison models were unloaded afterward.

Next: human-review the literal evidence rubric and a separately versioned, clearer extraction task (especially not-mentioned versus UNKNOWN and global issue semantics), then freeze fresh unseen fictional negation/contradiction/unsupported cases before another bounded evaluation. Retain manual structured clarification until a provider meets the unchanged correctness/safety/latency gate. Do not expand clinical functionality, normalize frozen protocol bytes or train models to close this failure.

[Exact incremental inventory and verification](verification.json).
