# Task 5A — Model A integration feasibility

**Current integration, 2026-10-25:** the unchanged sealed ranker now serves the opt-in fictional lab and DEV-only conversation through guarded Express/FastAPI boundaries. See the [current checkpoint](../../medassist_ai/docs/checkpoint-2026-10-25.md), [conversation setup](../../../src/features/medassist-conversation/README.md) and [evidence-integrity findings](../../medassist_ai/docs/symptom-understanding.md). The topical conversation has an eight-question budget; the original research interface retains its frozen twenty-disclosure behavior. The 223-item `model-a-to-b.evidence.v1` handoff remains unchanged. No clinical Model B or locked testing is enabled. The dated Task 5A/Day 1/Day 2 findings below describe their original snapshots, not the latest route-registration status.

**Day 2 workflow, 2026-10-21:** [run the isolated fictional question lab](../../../src/features/model-a-research/README.md). Separate demo endpoints wrap the existing selector and unchanged Day 1 handoff, with a development-only same-origin proxy and Material Web screen. Old `/next` remains compatible. [Day 2 actual checks and file inventory](day2-verification.json). No clinical Model B, production integration or locked-test execution is enabled.

**Sprint Day 1 review, 2026-10-20:** [findings, dataset readiness and merge conditions](day1-review.md), [versioned A-to-B research contract](handoff.schema.json), and [exact Day 1 change inventory/checks](day1-review.json). The original Task 5A receipt and 21-file inventory below remain historical. One invalid binary-initial case now abstains; no valid frozen scoring/encoding was changed. Days 2–5 remain planned, not executed.

**CONDITIONAL GO for a local fictional-case research component, 2026-10-20.** The existing selected alpha **0.00001** model can be loaded read-only and can select questions through the unchanged feature/mask/ranker pipeline. This separate FastAPI prototype is not registered in APIP's Express server or patient UI. It supplies no diagnosis, severity, urgency, treatment, home-care assessment or red-flag mechanism. No Model B is implemented or clinically validated by this contract.

The [Task 4B report](../task4b-validation.md) remains the source of model performance: 77.1866% synthetic validation recall@20 versus 59.5172% training frequency. Task 5A does not replay validation, retune the model, establish independent performance or assess clinical question relevance. The official locked test remains unopened.

## Discovery and exact inference reuse

`training.flow.Policy('ranker', ...)` performs all candidate scoring. It calls the existing `questioning_protocol.eligible_questions`, `training.flow.tokens_many` and `training.flow.hasher`: lexical candidate ordering, exact frozen JSON-array token strings, 65,536 float32 hashed columns, no alternate signs, finite decision scores, first maximum with lexical ties. No parallel encoder, learned vocabulary, score threshold or new model is introduced.

The frozen view contains source AGE and M/F SEX, initial evidence, chronological disclosed answers and question state. No raw source records, diagnoses, hidden answers or evaluator fingerprints enter inference. Missing demographic context is rejected rather than imputed. This is a material domain mismatch with APIP's optional/unknown profile fields and real-world sex/gender information.

The metadata catalogue has 223 definitions, 218 active questions and 14 child dependencies. All five unresolved child questions remain quarantined. A child becomes eligible only after its binary parent is explicitly confirmed **true**; false, unknown and unasked parents block it. The adapter validates history in chronological order and abstains on duplicates, unsupported IDs, quarantined questions, invalid values or dependencies. Conditional initial complaints are unsupported by this minimal interface, as no parent has yet been disclosed. Contradictions stop questioning; mixed multichoice defaults are preserved, not inferred to be contradictions.

## Data flow and contracts

```text
Operator-configured trusted local run + evidence metadata
  -> exact frozen environment/protocol/implementation and 17 artifact hash checks
  -> selected model snapshot hash check, then trusted local unpickle
  -> fictional request schema -> chronological disclosure/eligibility validation
  -> existing frozen Policy -> pending question + answer schema
  -> separately versioned disclosed evidence object for future research consumers
```

- [schemas.py](schemas.py) owns Pydantic contracts. [Request JSON Schema](request.schema.json) and [response JSON Schema](response.schema.json) are generated from it and checked for consistency.
- Request version: `model-a.request.v1`; response: `model-a.response.v1`; evidence: `model-a.evidence.v1`.
- Required request: literal `fictional_case: true`, nonnegative finite source age, source SEX M/F and an explicitly confirmed in-scope symptom initial. No free text, clinical profile mapping or language translation is accepted.
- `answers` contains at most 20 **answered** follow-up IDs in chronological order. Each has `state` and typed `value`. Unknown/contradiction values must be null. B values are booleans; C values must exactly match a typed category; M values are unique allowed category lists, including explicit empty/default/mixed lists. Numeric categories cannot be replaced by booleans.
- Unobserved evidence remains unknown and is not materialized as false/default. The evidence object contains supplied disclosures only, labelled `developer_fictional_fixture` with `human_clinical_review: false`. A selected/pending question is separate from answered evidence.
- Successful selection returns `status: question`, question ID, source question wording, B/C/M type and allowed values. B expects a boolean, C one listed scalar, M a list of listed scalars; explicit unknown is always supported.
- Semantic invalidity returns `status: abstained`, a value-free reason and no question or accepted evidence. Valid stopped/budget/exhausted states retain their disclosed evidence; stopping means no further research question, **not medical safety**. Structural invalidity returns sanitized HTTP 422; unavailable artifacts/inference fail closed, without fallback questions.
- Stateless requests must resend their complete answered history; pending selection is not an authenticated persisted session. No transcript storage, patient identity, correction workflow or clinical confirmation is provided. Clients cannot submit future answers/catalogues or override eligibility, weights or policy settings.

Example authored request to `POST /research/model-a/v1/next`:

```json
{
  "schema_version": "model-a.request.v1",
  "fictional_case": true,
  "context": {"age": 35, "source_sex": "F"},
  "initial": {"evidence_id": "E_91", "state": "confirmed", "value": true},
  "answers": []
}
```

## Read-only loading and isolation

[service.py](service.py) verifies the pre-test seal against the reviewed repository Task 4B receipt, original absolute run root, exact implementation/protocol bytes and all 17 sealed file hashes. It verifies evidence metadata using the existing pinned loader and validates its frozen graph. Only the chosen model is unpickled, from the **same bounded bytes that were hashed**. The other two alpha models are hashed, not loaded. Scientific package versions must match the frozen environment.

No patient archive, validation row/cache query, hidden oracle or locked-test ledger is opened by the adapter or benchmark. Hashing existing run files includes the sealed validation cache as opaque bytes; this is not replay or record decoding. Full source archive checks remain Task 4B attestations; this loader rechecks the metadata used for inference, not the five source files. No file is written in the source/run/ledger. A loaded model is a process-local snapshot; reloading requires all startup gates again. Local mutation protection assumes a trusted operator; hashes do not authenticate malicious pickle downloads or replace filesystem permissions.

[app.py](app.py) is disabled by default. The provided [launcher](__main__.py) binds only `127.0.0.1:8766`, one worker, no access logs. Every endpoint requires an operator token of 32–256 characters and a loopback peer/Host; all browser Origin headers are rejected. No CORS, interactive docs, file-serving, uploads, model/path endpoints, production routes or proxy are provided. Request bodies are bounded to 64 KiB; duplicate JSON keys/nonfinite JSON and extra fields are rejected, and schema errors never echo input. Calls are serialized around the frozen policy and one-thread scientific context.

This is a local engineering boundary, not multi-user authentication, deployment hardening or a hostile-code sandbox. Do not reverse-proxy it, expose the port, pass tokens to browser code or use real patient inputs.

## Local setup and checks

Use the **preserved local checkout with its original frozen bytes** and trusted original run. The known CRLF working protocol versus LF Git digest defect still blocks a fresh-checkout claim. Do not normalize frozen files, copy the seal to a new root or rewrite checksums to make startup pass. Missing/corrupt/incompatible assets cause abstention/unavailability; this is not permission to refit or replace them.

Task 5A used a new ignored `.venv` with system site packages: only FastAPI/Starlette were added there; the existing scientific environment was not changed. [Adapter dependencies](requirements.txt) record tested versions, not a complete portable scientific lock. Original Python 3.12.2, scikit-learn 1.9.1, NumPy 2.2.2, SciPy 1.16.1 and jsonschema 4.23.0 remain mandatory. A clean environment installation/cross-platform numerical equivalence was not established.

Configure existing private locations and a privately generated token in your local process environment (never in Git):

- `MEDASSIST_A_RUN_ROOT`: preserved original official pre-test-sealed run.
- `MEDASSIST_A_METADATA_ROOT`: existing verified source metadata bundle.
- `MEDASSIST_A_TOKEN`: private random research token, 32–256 characters.
- `MEDASSIST_A_ENABLE_RESEARCH=1`: explicit local research opt-in.

From the repository root, using that development environment:

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python -W error -m unittest models.medassist_v2.tests.test_research_adapter -v
python -W error -m unittest models.medassist_v2.tests.test_evidence_handoff -v
python -W error -m models.medassist_v2.research_adapter.benchmark --iterations 100
python -m models.medassist_v2.research_adapter
```

`GET /research/model-a/v1/health` and POST requests require `Authorization: Bearer <private-token>`. Stop the local research server when finished. This is independent of `bun run dev`; no frontend/API deployment step is included. Without explicitly configured artifact roots, preserved-model tests are skipped and cannot be claimed as passed. Other tests use the existing non-learning software fixture, never newly fitted weights.

## Measured feasibility and remaining gates

[Benchmark receipt](benchmark-results.json), 2026-10-20 23:01 IST: selected model, 30 authored disclosed transcripts spanning source age/SEX and true/false/unknown parent cases, 100 direct and 100 in-process HTTP calls. Direct median **83.62 ms**, p95 **100.13 ms**; HTTP median **85.68 ms**, p95 **111.53 ms**. Sampled process peak **193.12 MiB**; RSS before/after loading **177.15/179.79 MiB**. Startup checks/load took **15.44 s**, with Python allocation tracing enabled; module imports precede that timer. Latency tracing was disabled. Python startup/warmup allocation peak was **16.72 MiB**, distinct from total/native process memory. Five-millisecond RSS sampling may miss brief peaks. This is a warm local, serial, in-process measurement, not network/load/deployment performance or a resource guarantee. All 17 artifact hashes were unchanged afterward.

Parity checks compare every candidate's features and selected ID against the frozen reference on authored disclosed transcripts, plus five successive choices against the existing simulator using a completely authored case. These establish technical compatibility only. They neither measure held-out recovery nor demonstrate clinical question relevance. No validation fixture was used to tune anything.

All **18 focused tests passed in 63.222 seconds** with warnings treated as errors, including three preserved-model tests; no tests were skipped. A live loopback launcher smoke check returned health/question HTTP 200, rejected browser Origin with 403 and returned 404 for the application route. Readiness including imports/startup was 22.062 seconds in that check. The temporary research server was stopped afterward. No application/frontend build was run because those routes/files were unchanged. [Verification and exact file inventory](verification.json).

Remaining blockers to patient-facing APIP integration: clinically reviewed question wording/vocabulary and population coverage; an explicit free-text/context-to-code mapping with uncertainty handling; real missing-context/correction workflows; separately validated Model B contracts; applicable privacy/access/deployment controls; and independent clinical evaluation. No red-flag rules are invented here. Scientific limitations in Task 4B (synthetic collection utility, selection reuse, overlap/template dependence, high UNKNOWN rate and full question cost) remain. Locked-test execution still requires separate authorization and existing one-use gates; Task 5A does not authorize or consume it.

**Recommendation:** retain this as an isolated developer research component. The smallest safe next step is review of this uncommitted patch and fictional interface, then a separately scoped mapping/clinical-review specification. Fresh-checkout portability and patient-facing clinical integration remain NO-GO. No commit or push is authorized before review.

## Protocol portability boundary — 2026-10-26

The read-only adapter uses [authenticated compatibility](../../../docs/model-a-protocol-portability.md): only original UTF-8 CRLF or canonical Git LF bytes pass dual SHA-256 anchors. Binary/implementation hashes, sealed receipts, environment and source checks stay exact. Frozen training/locked-test code is unchanged and strict; this is not study-execution permission. Original protocol/pin and seventeen artifacts are untouched. Earlier warnings describe historical snapshots; fresh verification is recorded separately in the linked report.
