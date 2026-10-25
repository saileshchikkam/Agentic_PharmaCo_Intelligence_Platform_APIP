# MedAssist intelligence integration — bounded evidence, 2026-10-21

**UI frozen. Model A verified. LLM promotion blocked. Model B training NO-GO.** This isolated subsystem implements fictional extraction evaluation and records real local checks. It is not a new app, clinical inference service, model selection approval or replacement for the [master blueprint](../../docs/architecture/MEDASSIST_MASTER_BLUEPRINT.md). No patient narratives, official test data, private paths, credentials or model weights are included.

## Real Model A, not replay

[Actual integration receipt](model-a-smoke.json): the preserved selected ranker completed one authored fictional 20-follow-up interview in **25.263 seconds including loading/integrity checks**, with 20 distinct questions, a null-valued UNKNOWN and frozen budget stop. Export validated as `model-a-to-b.evidence.v1`, all 223 items retained. This duration is not a per-call performance benchmark.

That trajectory selected no dependent question, so it alone does not prove dependency behaviour. Separate bounded fictional transcripts against the **same actual loaded service** checked true-parent acceptance, false/UNKNOWN-parent rejection and duplicate rejection. No hidden oracle or patient loader supplied answers. Synthetic disclosures were authored for software checks, not clinical cases or severity labels.

The existing loader verified the 17 sealed artifacts, exact frozen implementation/protocol and scientific environment before inference; all 17 artifact hashes matched again afterward. The official Model A test and stable ledger were not accessed. No fitting, retuning, validation replay or source-patient archive decoding occurred. The clinical Model B stayed disabled.

## Frozen extraction benchmark and separate contract

[extraction-v1.json](extraction-v1.json) contains **48 explicit fictional cases**, eight each for single symptoms, multiple symptoms, negation, uncertainty/missing/unsupported information, typed values/duration, and injection/contradictions. Adult and child contexts are explicitly supplied, never inferred. [SHA-256 receipt](extraction-v1.sha256) fixes the case bytes and acceptance criteria before the candidate screen. Cases are authored engineering gold, not independent clinical adjudication, model-training examples or official Model A records.

The evaluation-only **`medassist.extraction.eval.v1`** envelope has `status`, proposed `items` and enumerated `issues`. Each proposal has a frozen ID, exact state/value and verbatim supporting quote. The complete literal expected output is stored per case. UNKNOWN and contradiction preserve null; negation is explicit false; omitted information never becomes negative. Numeric pain-intensity replies preserve integer values 0–10 only for an explicitly pending E_56 question with E_53 already disclosed true. Duration has no approved mapping in this subset: duration-bearing inputs clarify with no observations, rather than silently discard the qualifier. Unsupported input and injection abstain/clarify under the predeclared outputs. No urgency labels exist in the suite.

[Source binding](source-binding.json) verifies exact wording/type/values for the four evaluation IDs against pinned public evidence metadata. The subset is intentionally much smaller than the full source vocabulary. “Unsupported” means outside this evaluation task, not medically impossible or absent from every DDXPlus definition. The live frozen protocol still governs dependency eligibility, not the LLM.

[extraction.py](extraction.py) supplies strict structural and semantic validators, supported-span/type/dependency checks, scoring and a fail-closed promotion decision. The prompt is fixed in `SYSTEM`; the evaluator never sends expected outputs. Exact output agreement is deliberately stricter than clinical or semantic equivalence, including the specified supporting spans. Missing/malformed output counts as a failed attempt, not evidence of valid extraction. No clinical performance claim follows from this development set.

**The live contract is unchanged.** The existing chat still uses `medassist.extraction.v1`, one user-confirmed positive initial, and unchanged `model-a-to-b.evidence.v1`. Broader evaluation proposals are never bulk-inserted into the handoff or treated as accepted facts. A future bridge must preserve candidate provenance, deterministic frozen membership/type/dependency validation and explicit user confirmation; unsupported structures must clarify. A successful offline result would still need that separate integration and wording review.

### Predeclared gates

The frozen suite requires all 48 cases in two repetitions, at least 95% exact output agreement, 100% schema validity, zero unsupported assertions or wrong polarity/UNKNOWN conversions, no transport/OOM failures, measured resource usage and warm p95 under five seconds. A 15-second cancellation ceiling is specified; this screen used the stricter ten-second request budget. These are engineering promotion thresholds, not clinically validated thresholds. Qualified wording review remains independently required.

The **screen** allows at most two installed candidates, 120 seconds of generation budget total, 55 seconds per model, no retries, and immediate stopping on contract/safety failure. It deliberately does not complete the two-repetition promotion gate; no partial/failed screen can enable a provider. Do not expand budgets or tune the prompt against results automatically. Keep this v1 immutable; a separately reviewed revised task/prompt needs its own version and fresh evaluation design.

## Candidate inventory and actual screen

[candidate-results.json](candidate-results.json) records the live Ollama **0.40.6** inventory, exact model digests/quantization, decoding settings, case IDs, timing and sampled resource observations. Installed: `qwen3.5:2b` (reported 2.3B, Q8_0), `qwen3:4b` (4B, Q4_K_M), `llama3.2:latest`, `phi4-mini:latest`, and `qwen3:latest`. Mutable tag names are not assumed equivalent to prior snapshots. No model was initially loaded; no existing active inference was displaced.

The two selected, already-installed Qwen models were screened with fixed JSON-schema output, thinking disabled, temperature zero, seed 23, context 2048 and output limit 256. The first case was the preselected prompt-injection screen; later categories were not attempted after failure. The whole run ended after **22.11 seconds**, with both candidates unloaded and `/api/ps` empty.

- **Qwen3.5 2B:** one attempt, no accepted completion, **10,125 ms** elapsed. The saved runner classifies request/parse failure together, so its precise exception category was not retained; do not assert a proven model-quality failure or a measured JSON validity rate. Sampled aggregate Ollama RSS reached **83,460,096 bytes**; no model VRAM sample was captured. No warm latency/TTFT or extraction accuracy is established.
- **Qwen3 4B:** one completed response, **9,765 ms** total, including **7,988.3591 ms** reported load time; 30 generated tokens. JSON was schema-valid but failed semantic contract invariants and exact expected output. The rejected raw output and specific invariant were not retained, limiting error diagnosis; this is not a complete benchmark or a general quality ranking. Sampled aggregate Ollama RSS reached **285,024,256 bytes**, and API-reported model `size_vram` peaked at **2,340,327,259 bytes**.

Reported RSS sums visible Ollama processes; API `size_vram` is model-residency telemetry, not instrumented CUDA allocations or total-system peak memory. Sampling is approximate. Warm p50/p95 and first-token latency remain **unmeasured** for both models. Zero observed unsupported-item counts on these tiny/failed attempts do not establish safety or negate the failed contract gate. No full-suite accuracy, superiority, clinical validation or deployment readiness is claimed.

**Provider integration status: disabled (`languageProvider = null`), existing phrase fallback unchanged.** Neither candidate qualifies. No hosted API, downloads, new dependency installation or provider fallback was used. The [Ollama API](https://docs.ollama.com/api/chat) documents JSON-schema output, thinking controls and keep-alive unloading; syntactic JSON does not establish valid evidence.

### Acquisition requirements, not installation authorization

**Qwen3 1.7B is not installed.** The [publisher model card](https://huggingface.co/Qwen/Qwen3-1.7B) lists Apache 2.0. To compare it, separately authorize acquisition of the exact `Qwen/Qwen3-1.7B` revision or an identified, trusted quantized derivative; record upstream revision, converter/quantizer provenance, licence notices, file digest, tokenizer/chat template and exact runtime model name. Check disk/RAM/VRAM availability and backend support before downloading. About 0.85GB is only the arithmetic 4-bit weight lower bound, not a measured total footprint. It is not the installed Qwen3.5 2B or Qwen3 4B.

**MedGemma 4B IT is not installed and access/terms acceptance is not established.** The [publisher card](https://huggingface.co/google/medgemma-4b-it) requires review/agreement to HAI-DEF terms. The operator must establish approved gated access, accept applicable terms, select/pin the exact model revision and permitted quantization/runtime, document provenance/notices and verify actual memory fit. A 4-bit 4B model has roughly 2GB raw-weight lower bound before runtime/context/vision allocations; a 4GB GPU is not proven sufficient. Prefer a justified text-only extraction configuration; do not silently download a vision stack. No assumption of a free hosted provider or account access is made. A medical pretraining label does not validate this task.

Next essential L2 step: review the frozen extraction rubric and the first-screen diagnostic limitations, then approve a specific smaller artifact/runtime acquisition or a separately bounded diagnostic design. Preserve this failed screen. Do not rerun or retune the same two candidates merely to obtain a passing result, and do not alter Model A to accommodate an LLM.

## Model B readiness: hard blocker

[model-b-readiness.json](model-b-readiness.json) is an auditable readiness decision, not a training run or newly created label mapping. Existing NHAMCS ED 2022 acquisition/research receipts establish a historical local statistical-research source, not a task-matched conversational clinical cohort. No raw clinical records were opened or new data acquired here.

NHAMCS IMMEDR records five-level nursing-triage immediacy among people already at US EDs. There is no defensible automatic mapping to the proposed four conversation-time urgency levels, independent unable-to-assess state, community disposition or home-care safety. Missing triage, predictor timing, population transport and patient-level grouping remain concerns. [Prior assessment](../medassist/reports/2026-10-19-phase4a/feature-and-target-assessment.md) and [historical Phase 3 results](../medassist/reports/2026-10-19-phase3/README.md) remain negative clinical-readiness evidence: primary high-acuity misses 86/411, Immediate misses 7/26, and zero exact Immediate recall across secondary variants on ten Immediate cases. These were not recomputed or used for retuning today.

The [CDC data-use agreement](https://www.cdc.gov/nchs/policy/data-user-agreement.html), refreshed 2026-10-21, restricts public-use data to statistical reporting/analysis and prohibits identification. Public availability is not operational clinical permission. DDXPlus synthetic recovery targets supply no clinical urgency labels either.

**No Model B training baseline was started or fabricated.** First obtain an intended-use/label rubric with qualified adjudication and permitted task-matched data. Then freeze prediction-time features, patient/family/institution/source grouping, immutable grouped splits and untouched evaluation, train-only preprocessing, development-only calibration/abstention selection, rare/high-acuity sensitivity and false-reassurance criteria, subgroup uncertainty and external validation. The readiness receipt captures these prospective requirements without inventing four labels, sample counts or safe-home conclusions. Model B remains untrained/disabled.

## Independently governed interfaces

[governance.ts](../../src/features/medassist-intelligence/governance.ts) defines separate safety, vetted guidance and navigation ports, all with explicit unavailable implementations. No red-flag rules, clinical messages, providers or map requests are implemented. Review/source/version/expiry provenance is part of the future result contracts; types do not authenticate an approval or constitute sign-off. The research handoff is not automatically a clinical input contract.

Safety has no LLM/Model B override input. Guidance references vetted source versions separately from model predictions. The navigation-request guard accepts only explicit unexpired purpose-specific consent and finite in-range coordinates, cloning an allowlisted payload; symptom narratives, account IDs and extra fields are rejected. Facility capabilities require reviewed provenance and explicit verified/unknown emergency status; names cannot imply specialist/emergency capability or current availability. No location was collected or shared. Any eventual safety-dependent navigation remains blocked on qualified clinical review and provider/capability verification.

## Reproducibility and verification

New package uses already-installed Python/httpx/jsonschema/psutil; no dependency/lockfile change. The bounded runner is explicit, refuses an existing result filename and refuses to displace loaded models. It contacts only fixed loopback Ollama endpoints and cannot pull models. Do not run it automatically as part of tests.

```powershell
.\.venv\Scripts\python.exe -B -m unittest models.medassist_intelligence.test_extraction
node --import tsx --test scripts/medassist-governance.test.ts scripts/medassist-conversation.test.ts scripts/model-a-demo.test.ts
bun run lint
bun run build
```

[Verification and exact task inventory](verification.json) separates current checks, failed candidate screen and unresolved gates. UI/chat/source contract hashes are checked unchanged against the start-of-task snapshot. Existing unrelated dirty work is preserved. Known CRLF-local/LF-Git portability and trusted-pickle/environment constraints remain; no clean-checkout or clinical claims. No official Model A test/ledger use, staged files, commit, merge, push or unrelated background service. The only additional model workload was this explicitly bounded screen; its models were unloaded afterward.


## Local MedGemma integration — 2026-10-21

This dated section supersedes the earlier installed-model inventory and disabled-provider statement for the explicitly enabled local fictional demo only. Earlier Qwen screen results and the immutable 48-case rubric remain unchanged. No general L2 promotion or clinical enablement is claimed.

The user-installed `medgemma1.5:latest` reports a 4.3B Gemma3 GGUF Q4_K_M artifact (3,338,940,988 bytes). The evaluated digest is recorded in [v2 results](medgemma-results-v2.json). A tag alone does not establish official upstream provenance, licence acceptance or clinical suitability. No weights, templates or models were downloaded or changed. Ollama 0.40.6 was observed listening only on loopback.

The [local server provider](../../server/medgemma.ts) uses fixed loopback tags/show/chat endpoints, installed-only GGUF checks, optional digest pinning, bounded responses, cancellation, one active extraction, configurable model/1–90-second timeout (minimum 1 second), and generic errors. The default timeout is 60 seconds. All routes retain existing development-only/local Host/Origin/private adapter-token restrictions. Browser requests use only the same-origin proxy; no credentials or private roots enter responses. The server neither pulls models nor accepts an Ollama host supplied by a client. Input is fictional, at most 300 characters, not durable clinical storage. No raw symptom logging was introduced; local runtime/operator telemetry remains outside this application's retention guarantee.

The inspected installed chat template omits system-role messages. [Original protocol](medgemma-protocol-v1.json) and [failed original 20-case results](medgemma-results.json) are preserved: 0/20 semantic agreement and runtime validation. The revised prompt puts constrained policy plus JSON-encoded untrusted input in a supported user turn; the installed model/template was not edited.

**Revised actual 20-case development result:** 20/20 JSON-schema valid, 6/20 semantic exact agreement (30%), 1/20 exact gold output including quote (5%), 10 unsupported assertions and 6 polarity/UNKNOWN errors. Ten outputs passed the then-current runtime checks; that is NOT ten correct outputs. Cold request 16.175 seconds (8.890 seconds reported model loading); 19 warm requests median 11.782 seconds, p95 27.075 seconds. Sampled model VRAM residency was 1,606,313,574 bytes, not precise CUDA allocation or whole-system peak memory. Free system RAM before/after was about 4.98/4.20 GB; process RSS was not measured. This is a reused development subset, not independent held-out or clinical evidence. The predeclared 48-case/two-repeat/95%/zero-error/under-five-second gate is not met.

The run exposed two unsafe single-positive proposals (unsupported ear discomfort and contradictory fever). Final deterministic guards additionally require a literal matching symptom span and reject absence/uncertainty-bearing positives. The v2 receipt records the earlier guard version truthfully; it was not rewritten to imply final-guard accuracy. Separate actual regression checks and the browser lifecycle are recorded in [browser smoke](medgemma-browser-smoke.json). Do not interpret these two checks as a new 20-case accuracy estimate.

Live bridge is deliberately narrow: only one literal supported confirmed positive, explicitly confirmed by the user, can start Model A. Three initial IDs come from the verified existing vocabulary; no IDs are generated. Multiple, negative-only, UNKNOWN, conflicting, unsupported and duration-bearing descriptions clarify/reject and never bulk-merge into accepted evidence. Valid proposals/provenance stay separate in page memory. Duration has no frozen handoff field and is explicitly unsupported; it is not silently converted into a fabricated ID or negative. This does not implement general free-text understanding. Follow-up selection and dependency/exclusion/duplicate enforcement remain entirely Model A; follow-up answers use existing exact typed controls. `model-a-to-b.evidence.v1` and its 223 entries remain unchanged. Model B and clinical safety/advice remain unavailable.

Enable only in the existing approved local development environment using `.env.example` flags `APIP_ENABLE_MODEL_A_DEMO=1`, `APIP_ENABLE_MEDGEMMA=1`, `MEDASSIST_LLM_MODEL=medgemma1.5:latest`, `MEDASSIST_LLM_TIMEOUT_MS=60000` and `MEDASSIST_LLM_DIGEST` set to the reviewed installed digest. Keep the existing artifact-root and private adapter-token settings external to Git. Start the existing Python adapter and APIP `npm run dev` with that shared configuration; open `http://127.0.0.1:3000/#/preview/medassist-conversation`. No public/production route is enabled. Disabling the explicit MedGemma flag preserves the old limited phrase mode; a configured inference failure does not silently invoke it.

No CSS/layout redesign occurred. [Model A verification](medgemma-model-a-verification.json) records real preserved-model inference, UNKNOWN/repeat/export checks and 17 sealed hashes. Final [integration verification](medgemma-verification.json) records check outcomes and the exact incremental task inventory. Trusted local pickle, preserved package environment and the preexisting CRLF-local/LF-Git protocol portability caveat remain unresolved. Official test and stable ledger were not opened. No training, staging, commit or push.


## Extraction reliability follow-up — 2026-10-21

[Full before/after comparison and failure analysis](reliability-v1/README.md) supersedes the earlier limited live-proposal enablement. The same 20 cases were evaluated for three installed models and two fixed variants: 120 actual local requests, no retries. Best semantic agreement was only 45% (Qwen3 4B baseline); all candidate gates failed. Compact output improved timing but regressed correctness. Prior results/suite are preserved byte-identical. The final local route now rejects unqualified language proposals before inference and asks for explicit structured clarification; no provider was selected. Real Model A structured confirmation/UNKNOWN/end/export still works, and UI source/layout stayed unchanged. This is a safety and failure-latency improvement, not a successful natural-language model upgrade or L2/clinical promotion.

## Groq fictional extraction qualification — 2026-10-23

[Groq evaluation and integration](groq-v1/README.md) selected Qwen after 20/20 agreement and zero measured safety errors on a fresh user-reviewed English fictional set. The real browser-to-Groq-to-Model A smoke passed with explicit confirmation and UNKNOWN/export preserved. This does not replace prior failed local results or clinically validate L2; Model B remains disabled.
