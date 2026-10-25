# Modular MedAssist research composition

Implemented on 2026-10-23 within the existing APIP application. This package organizes existing intelligence boundaries; it is not a production deployment or clinical system. Importing it never loads weights, opens source datasets, calls a provider or starts a service.

```text
models/medassist_ai/
  config/          settings.py, model_registry.py
  core/            orchestrator.py, interfaces.py, schemas.py, exceptions.py
  providers/       groq_provider.py
  model_a/         adapter.py
  jayanth_model/   adapter.py, artifact_manifest.py, vocabulary_mapping.py, manifest.json
  model_b/         interface.py, disabled_provider.py, README.md
  evidence/        mapper.py, validator.py
  safety/          interface.py, provisional.py, provisional-rules.v1.json
  hospital/        interface.py, maps_search.py
  tests/           fictional component and existing-boundary integration tests
  docs/            architecture.md, component_registry.md, integration_status.md,
                   verification.json, actual-model-a-smoke.json
```

All Python component directories include `__init__.py`. [Exact task file inventory and checks](docs/verification.json) distinguish this task from substantial preexisting uncommitted work. [Architecture](docs/architecture.md), [component registry](docs/component_registry.md) and [integration findings](docs/integration_status.md) describe ownership, runtime connections and blockers.

## Use in the existing application

**Conversational update, 2026-10-25:** the [current main-site chatbot](../../src/features/medassist-conversation/README.md#current-conversational-experience--2026-10-25) replaces research controls with inline confirmation and explicit fictional-context collection. A neutral assessment panel never enables Model B; emergency precedence and location-only contextual search are preserved. [Actual conversation observations](docs/chat-model-a-observations.json), [one live Groq/Model A check](docs/chat-live-integration.json) and [verification inventory](docs/chat-verification.json) distinguish runtime evidence from UI fixtures. No model/provider configuration or sealed implementation changed.

Keep the existing loopback Express/Vite and Model A adapter setup. Set `APIP_ENABLE_MODULAR_MEDASSIST=1` in **both existing backend processes** on their next deliberate startup; retain the previously documented demo/Groq enablement, server-only key and private verified artifact configuration. No additional service, port, model download or credential file is required. The optional flag defaults off, so an already-running preview retains its current behavior until restarted. This task did not interrupt that preview.

The existing `server/model-a-demo.ts` extraction route composes the backend `GroqProvider` class around `createGroqExtractor`. Its qualification, timeout, strict schema, rate caps, confirmation flow and error behavior remain authoritative. The Python adapter's interview endpoint optionally composes `MedAssistOrchestrator(ModelAAdapter(service))` and returns the same `model-a.demo.v1` response. Disease, urgency and diagnostic endpoints remain absent. The subsequent provisional safety/navigation update below adds separate development boundaries; authentication and account features are unchanged.

The Python `GroqProvider` is an injected boundary for software composition/testing. It deliberately contains **no second cloud HTTP implementation**; its live counterpart is `server/medassist-ai.ts`. Calling it without an injected bridge fails closed. Do not configure a second Python key or bypass the existing qualified backend.

## Provisional safety and navigation — 2026-10-25

[Safety/navigation implementation and limitations](docs/safety-navigation.md) records emergency precedence across both previews and backend extraction, explicit location consent and a location-only Maps search handoff. Rules remain unreviewed; facility results are not verified. Model B stays disabled. The [exact file/check receipt](docs/safety-navigation-verification.json) records 43 TypeScript and 15 Python tests, responsive browser checks and fresh verification of all 17 sealed Model A artifacts.

## Focused checks

Use the existing adapter virtual environment, without installing/upgrading its scientific packages:

```sh
python -B -m unittest discover -s models/medassist_ai/tests -t .
node --import tsx --test scripts/medassist-ai.test.ts scripts/groq-extraction.test.ts scripts/model-a-demo.test.ts
npm run lint
npm run build
```

`scripts/medassist-ai-smoke.py` separately accepts the existing operator-provided `MEDASSIST_A_RUN_ROOT` and `MEDASSIST_A_METADATA_ROOT` and performs a bounded fictional real-model parity/UNKNOWN/export/hash check. It neither accesses official patient archives/the ledger nor repeats validation. See the recorded receipt; do not infer a new live browser/cloud run from component tests.

Clinical functions remain blocked. Trusted local pickle/environment restrictions and the preexisting frozen-protocol CRLF/LF portability caveat are preserved. No artifacts were relocated, copied, converted, refitted or normalized. No staging, commit or push.

## Canonical Jayanth files recovered — 2026-10-24

[Branch and recovery findings](docs/artifact-recovery.md) resolve the earlier local-absence blocker: 16 files now match pinned remote-main Git bytes and recorded SHA-256 digests. No merge, overwrite, deserialization, dependency upgrade or clinical enablement occurred. The adapter now checks both Git blob identity and SHA-256 while retaining execution disabled. Compatibility/data-rights/calibration/source-review gates remain.

## Declared-version compatibility and vocabulary audit — 2026-10-24

[Technical validation](docs/jayanth-technical-validation.md) reproduces contributor dependency versions in an isolated hash-locked environment and verifies exact literal-vocabulary/CSV ordering without a Joblib load. The adapter exposes deterministic normalization with explicit unsupported/missing information. Disease execution remains disabled on executable-serialization/build trust and mapping gates; original random-split test groups overlap training completely. No independent accuracy or clinical capability is established.

## Model B training foundation — 2026-10-24

[Model B foundation](model_b/README.md) implements governed ingestion, versioned provisional labels, transitive group-safe splits, offline training/evaluation and research-only registration. Tests are synthetic software checks; no estimator was fitted. Data/clinical approval gates remain blocked and the active provider is unchanged/disabled.


## Symptom understanding milestone — 2026-10-25

[Exact coverage inventory](docs/symptom-coverage.md) and [implementation/evaluation report](docs/symptom-understanding.md) document the current 30 mapped English fields, contextual normalization, bounded question compatibility, versioned provenance export and real Model A integrity checks. The UI, sealed research and disabled clinical Model B remain preserved. Development-suite performance does not establish general or clinical accuracy; two unchanged emergency-rule misses remain explicit blockers.
