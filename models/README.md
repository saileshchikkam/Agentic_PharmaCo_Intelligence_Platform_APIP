# Model catalogue and evaluation

This directory records local models and hosted-provider candidates for APIP. It is **not connected to the application's experimental handlers yet**. A provider switch must be implemented and evaluated before it is described as working.

- [Local catalogue](local/models.json): five models observed through Ollama on 2026-10-16, with sizes/quantization and a proposed first shortlist.
- [API catalogue](api/providers.json): optional provider candidates; none is enabled or account-verified here.
- [Local smoke runner](evaluate-local.mjs): dependency-free Node diagnostic using two explicitly fictional copy/extraction fixtures per selected model.
- [Saved observations](evaluations): dated output from actual diagnostic runs, not clinical validation or a performance leaderboard.

## Where the large files live

Ollama manages its own weights/cache outside this Git repository. Store model IDs, digests, licences, configuration, and reproducible evaluation here. Do not copy multi-gigabyte weights, credentials, patient records, or raw restricted datasets into Git. This directory's ignore rules protect conventional weight/cache/checkpoint paths; they are not a secret scanner.

When custom ML is implemented, version its training code/configuration and data manifest. Put trained artifacts in an appropriate private artifact store or ignored local directory, retaining version/checksum records. Consult the [ML sequence](../docs/ai-implementation.md#custom-ml-from-scratch).

## Initial comparison

Start with the already installed `qwen3.5:2b` and `qwen3:4b`. The former is Q8_0 and the latter Q4_K_M; they differ in architecture and quantization, so a timing difference cannot be attributed to parameter count alone. `phi4-mini:latest` and `llama3.2:latest` are useful controls. `qwen3:latest` is an 8.2B Q4_K_M model, not the installed 4B variant; its full footprint plus runtime/context may require CPU offload on a 4 GB GPU.

Ollama capability metadata is not proof that APIP tool calls, image extraction, Telugu understanding, or clinical tasks work. Mutable tags such as `latest` can change. The runner records the actual digest it sees, and reports any difference from the catalogue's observed prefix without treating an updated tag as equivalent.

## Run the small diagnostic

With Node available, the local Ollama service running, and the selected models already installed:

```sh
node models/evaluate-local.mjs --output models/evaluations/new-run.json
```

To compare other installed catalogue entries:

```sh
node models/evaluate-local.mjs --models llama3.2:latest,phi4-mini:latest --output models/evaluations/control-run.json
```

Choose a new output filename; existing reports are not overwritten. The runner only contacts `http://127.0.0.1:11434`, refuses missing models instead of downloading them, uses bounded generation/timeouts, and requests unloading after each model. It can temporarily use significant CPU/GPU memory. No cloud key or paid API is used. Desktop sandbox/network approval can still be required to reach the local service.

Two fixtures check basic structured output, copying a made-up medicine/symptom, and preserving an unknown dose. They do not test real medicine identification, medical reasoning, clinical translations, representative latency, concurrency, or safety. A passing result does not choose the best model. Timings include HTTP/model loading and are single observations.

The process exits unsuccessfully if a request or fixture check fails, while saving the observed results where possible. A failure is evidence to investigate, not a reason to replace the result with a mock success. For real comparison, use a larger versioned English/Telugu/mixed-language set with field-level scoring and independent clinical review.

## Hosted use and promotion

The intended development policy is local-first with optional, explicitly configured API evaluation under the confirmed **INR 500 monthly** model/deployment budget. Currency is now confirmed; suitable public hosting is not established at this price. Free quotas are changeable and account-specific. See the [AI implementation guide](../docs/ai-implementation.md#hosted-candidate-and-selection).

Before enabling an adapter, verify account/model access, terms, schema support, privacy, rate limits, SDK compatibility, token cost, retry limits, and application cutoffs. Use fictional cases. A local failure must not automatically disclose the request to a cloud provider. Test the chosen hosted model during development as well as before deployment; local success does not validate a different hosted model.

## Additional research models

- **MedGemma 1.5 4B:** priority medical comparison candidate, not installed/benchmarked here. It has medical text/image capabilities, Health AI Developer Foundations terms, primarily English safety evaluation, and no evaluated multi-turn optimization. Its card does not support direct clinical use without adaptation/validation. Quantized runtime and visual-component memory must be verified. [Official card](https://developers.google.com/health-ai-developer-foundations/medgemma/model-card)
- **BioMistral-7B:** optional, heavier biomedical text comparison; the card lists Apache-2.0 and explicitly advises research-only use. It is not a proposed production patient assistant, and its multilingual evaluation does not establish Telugu quality. [Official card](https://huggingface.co/BioMistral/BioMistral-7B/blob/main/README.md)
- **multilingual-e5-small:** proposed local retrieval embeddings, not an answering chatbot. Check source-prefix requirements and Telugu retrieval quality. No embedding model was found among the five installed catalogue entries. [Official card](https://huggingface.co/intfloat/multilingual-e5-small)

Do not download additional models merely to increase the model count. First compare the installed shortlist, identify a concrete failure, then evaluate whether another model addresses it within hardware, licence, and budget constraints.
