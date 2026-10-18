# MedAssist fictional conversation slice

`#/preview/medassist` implements symptom intake, guided follow-ups, review/edit, optional local-model quote selection, and care-search handoff. It is not an authenticated patient service or a clinically validated urgency model.

## Implementation

- `MedAssistPreview.tsx`: four questions (concern, duration, activity impact, changes), explicit unknown answers, original statements, editable review, separate AI suggestions/user confirmation, cancellation, reset confirmation, and care navigation.
- `copy.ts` and `flow.ts`: English-only interface text and question labels, response validation, and location-only Maps URLs. Questions are currently fixed, not model-adaptive clinical questions.
- `medassist.css`: responsive composition within the shared Material 3 page shell. Inputs, chips, checkbox, and actions use official Material Web wrappers. Standard HTML supplies semantic conversation/review layout and external navigation links.
- [Local server module](../../../server/medassist.ts): a bounded quote-selection experiment through installed Ollama. No hosted fallback, diagnosis, urgency prediction, precautions, RAG, or training is connected.

The shared Back row moves from review to the last question, from an edited answer to review, or to the previous question before exiting at the first question. Unsent changed text prompts before discard. In-app route exits and reload/tab-close warn while fictional answers exist; native browser Back/Forward remains route-level and is not an internal question history. State is in React memory only and is lost on exit/reload; it is not isolated patient storage. ADR remains directly available and receives none of this conversation automatically.

## Local AI contract

`POST /api/medassist/structure` accepts JSON with exactly these fields:

```json
{
  "fictionalOnly": true,
  "language": "en",
  "answers": {
    "concern": "A fictional person describes a symptom.",
    "duration": null,
    "impact": null,
    "changes": null
  }
}
```

`language` is `en` or `te`. Each answer is null or 1–1200 characters; concern is required. The UI requires explicit fictional-case consent before sending. The boolean affirms the test scope; it does not prove that input lacks actual patient data.

The server accepts loopback clients and an absent or local port-3000 Origin only. JSON parsing is limited to 24 KB, with one active inference and six accepted requests per minute per process. Rate/concurrency limits are local development protection, not a hosted tenancy or authentication system.

Ollama is fixed to `http://127.0.0.1:11434/api/chat`. `MEDASSIST_MODEL` selects an already installed model; default is `qwen3.5:2b`. Generation uses structured JSON, zero temperature, a 256-token output limit, a 4096-token context, a 60-second server timeout, and `keep_alive: 0`. No model is automatically downloaded. Inputs/outputs are not logged by this module or saved server-side; the local runtime's own operational settings remain outside APIP.

The response contains four `suggestions` fields (a verbatim quote from the corresponding answer, or null), `provider`, `model`, `promptVersion`, and a fixed assessment:

```json
{ "urgency": "not_assessed", "reason": "clinical_validation_pending" }
```

Server and client reject non-source quotes, extra quote fields, wrong types, and filled unknowns. A substring check verifies provenance, not semantic completeness: a quote can omit context, so original answers remain visible and user review is required. Suggestions never overwrite the source or become a clinical conclusion. Editing invalidates suggestions/confirmation. Failure and cancellation retain the original answers; stale responses cannot restore old suggestions.

Error codes: `INVALID_INTAKE` (400/413), `JSON_REQUIRED` (415), `LOCAL_ONLY` (403), `MODEL_BUSY`/`RATE_LIMITED` (429), `MODEL_UNAVAILABLE` (502/503), `INVALID_MODEL_OUTPUT` (502), and `MODEL_TIMEOUT` (504). No provider error text or generated medical text is returned on failure.

Startup does not automatically load `.env`; use the server environment to override the installed model, as described in [development setup](../../../docs/development.md).

## Care navigation

Find care is available before completing any questions. A person can enter a locality, or deliberately request browser location. The latter is rounded to three decimal places and can be cleared; denial/error retains manual entry. Only the location field enters a fixed Google Maps HTTPS search URL after the person chooses to open it. Symptoms and referrer data are excluded. The facility is selected and directions obtained in Maps, not inside APIP. No Google API key is needed for this URL handoff; APIP does not claim provider-ranked clinical suitability, availability, or verified facility services. See [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

## Verification

```sh
node --import tsx --test scripts/medassist.test.ts scripts/preview-navigation.test.mjs
bun run lint
bun run build
node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --esModuleInterop --target ES2022 --module ESNext --moduleResolution bundler server/medassist.ts scripts/medassist.test.ts models/evaluate-medassist.ts
```

The default lint covers frontend TypeScript; the explicit command checks the new server module/tests/runner. Unit checks cover strict input/output validation, unknown/mixed-language fidelity, local-origin restrictions, timeout, provider failure, concurrency/rate limiting, and Maps URL separation.

With APIP and the local Ollama service running, optionally run one fixed English fictional live cases:

```sh
node --import tsx models/evaluate-medassist.ts --output models/evaluations/new-medassist-smoke.json
```

The runner refuses to overwrite a report and records the model digest, prompt version, outputs, and individual timings. The [2026-10-17 observations](../../../models/evaluations/2026-10-17-medassist-smoke.json) passed two quote/unknown checks; this is not a clinical, triage, or representative Telugu benchmark. See [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs) and the [MedAssist requirements](../../../docs/layers/medassist.md) for the remaining scope and gates.

## Scope revision

The current interface and request contract are English only (`language: "en"`). The earlier bilingual smoke result is retained as historical evidence, not a current test. The runner now uses one English case. Optional account profile context appears separately when sharing is enabled; no profile is sent to the local model. See [account setup](../../../database/README.md).
