# Groq fictional extraction qualification

Evaluation ran on 2026-10-22; integration and final preservation checks finished on 2026-10-23 IST. This is a small engineering qualification, not clinical validation or completion of the broader L2 gate.

[Verification and exact 46-file incremental inventory](verification.json): 36 Node tests and 25 Python tests passed, with no failures/skips in final runs; frontend/backend TypeScript checks and build passed. The build retains the existing large-client-chunk warning. Initial sandbox loopback failures and the system Python missing FastAPI were resolved by using host access and the existing adapter environment.

## Decision and measured results

All three requested IDs were account-accessible. User approval covers the exact [20-case annotations](REVIEW.md) and operator-confirmed Free plan. [Execution approval](execution-approval.json) does not independently establish billing or zero charges.

- **Qwen `qwen/qwen3.8-27b`: selected.** 20/20 semantic agreement, 20/20 schema/span validity, zero measured unsupported assertions, polarity errors, observation omissions, UNKNOWN confusion or unmapped-detail errors. Median 1,269.86 ms; p95 1,842.15 ms.
- `openai/gpt-oss-120b`: rejected. 18/20 semantic, 19/20 valid; median 1,416.09 ms; p95 4,339.86 ms. One request/output rejection and one mention-order mismatch. The initial rejected request did not retain an HTTP category; its exact cause is unknown.
- `openai/gpt-oss-20b`: rejected. 18/20 semantic, 20/20 valid; median 6,008.38 ms; p95 10,840.09 ms. One mention-order mismatch and one omitted ambiguous detail; latency also failed.

Zero measured safety errors is limited to these 20 fictional English cases. The fresh sparse rubric differs from the old local suite: these numbers are not a controlled improvement from the prior 30% result. Negation, explicit uncertainty, contradiction, omission and unsupported details are separate states; no missing symptom becomes negative.

The [frozen protocol](protocol.json) requires at least 19 correct cases, all 20 valid outputs, zero enumerated safety/transport errors and p95 at most five seconds. The [selection](selection.json) binds the actual [combined results](continuation-results.json), prompt and schema. Hosted model IDs can change behind the provider; this is not a pinned weight digest.

## Execution accounting

The original run stopped after 14 attempts. Its [results](results.json) and [responses](responses.json) remain preserved. The explicitly resumed [continuation](continuation.json) skipped every previously attempted pair, including the failed request, and completed 46 remaining pairs. There were exactly 60 benchmark attempts, 20 per model, no benchmark retries. Final selection is separate from the immutable results' pre-selection status fields.

Browser harness attempts were separate from the comparison. An initial harness failed during response collection; another sandbox attempt could not reach host localhost and was cancelled. Their possible inference count was not reliably captured. After response handling and host execution were corrected, the successful bounded smoke used one fictional request. Do not infer an exact all-task cloud request total from the benchmark count.

## Connected behavior and checks

The [backend provider](../../../server/groq-extraction.ts) reads a server-only environment key or the explicitly authorized ignored backend configuration. It uses fixed HTTPS, strict output schema, a 15-second timeout, cancellation, bounded response size, one active request, four requests/minute and 20 calls per server lifetime. Access/payment/quota errors latch closed; no retry or local fallback. These are development caps, not an organization-wide cost-control system.

The explicit `APIP_ENABLE_GROQ_MODEL_A=1` flag within the guarded Model A demo enables the qualified provider. `GROQ_API_KEY` must never be a browser variable. Existing Model A enablement, private adapter token and verified artifact configuration are still required; see the [adapter guide](../../medassist_v2/research_adapter/README.md). No credentials or private roots are included here.

Cloud proposals use `medassist.cloud-extraction.v1`, distinct from the frozen `model-a-to-b.evidence.v1` handoff. Only a validated, single supported positive with no unresolved details can become an initial candidate, and only explicit confirmation accepts it. Multiple symptoms, negatives, UNKNOWN, contradictions and unsupported values remain proposals requiring clarification. Model A alone selects follow-ups; Model B stays disabled.

[Actual browser smoke](integration-smoke.json): cloud extraction, confirmation before real Model A, two follow-up selections, UNKNOWN and 223-field evidence export passed. Browser sent no request directly to Groq; private configuration returned 403; no credential exposure or page errors. Widths 390/820/1440 had no horizontal overflow or technical checklist. UI layout/CSS were preserved; only provider logic and cloud privacy wording changed. Initial UI time was 10,641 ms, substantially above benchmark median; one end-to-end sample cannot establish a latency distribution.

[Final preservation](final-preservation.json): all 17 sealed artifact hashes and seal digest matched. Protected prior results, frozen code/protocol, evidence contract and UI stylesheet were unchanged. Official test and stable ledger were not accessed; current ledger emptiness was not independently inspected. Trusted local pickle/environment constraints and the preexisting CRLF-local versus LF-Git protocol portability caveat remain. The cloud prompt reader derives the evaluated LF request text without rewriting files.

## Quotas, privacy and remaining work

The [Groq Free limits](https://console.groq.com/docs/rate-limits) observed/documented for these models were 30 RPM, 1,000 RPD, 8,000 TPM and 200,000 TPD; limits are shared and account console values take precedence. The API did not expose billing plan. No upgrade or paid access was requested. [Strict schemas](https://console.groq.com/docs/structured-outputs) constrain structure, not truth. Groq is an external processor: [data controls](https://console.groq.com/docs/your-data) include retention exceptions, and this account's zero-data-retention setting was not verified. Use fictional text only.

Next: independently review a broader held-out bilingual set, test Telugu script/transliteration/mixed input separately, and measure repeated end-to-end latency under the authorized quota. No additional benchmark, download or training is authorized by this document. Model B still lacks permitted task-matched labels/data; urgency, diagnosis, treatment, precautions and clinical navigation remain unavailable. Nothing was staged, committed or pushed.
