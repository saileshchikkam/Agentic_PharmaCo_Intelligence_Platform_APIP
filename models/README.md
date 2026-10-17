# Model catalogue and evaluation

This directory records local models and hosted-provider candidates for APIP. The [MedAssist fictional slice](../src/features/medassist/README.md) now connects installed Ollama `qwen3.5:2b` for bounded source-quote selection. The older agent handlers do not use this catalogue or a general provider switch. No custom urgency model is trained or enabled.

- [Local catalogue](local/models.json): five models observed through Ollama on 2026-10-16, with sizes/quantization and a proposed first shortlist.
- [API catalogue](api/providers.json): optional provider candidates; none is enabled or account-verified here.
- [Local smoke runner](evaluate-local.mjs): dependency-free Node diagnostic using two explicitly fictional copy/extraction fixtures per selected model.
- [Saved observations](evaluations): dated output from actual diagnostic runs, not clinical validation or a performance leaderboard.
- [MedAssist live smoke runner](evaluate-medassist.ts) and [2026-10-17 observations](evaluations/2026-10-17-medassist-smoke.json): two fictional English/Telugu/mixed symptom intakes through the new endpoint, including source fidelity and a null unknown. Both returned accepted outputs; neither tests clinical triage or establishes representative language quality. See the implementation guide for the bounded invocation.

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

## Medical models and free access — checked 2026-10-17

**Groq:** the user approved evaluating the free tier. The current public model catalogue lists general models, including `openai/gpt-oss-20b` and `openai/gpt-oss-120b`; neither is a medical-specialist model. No MedGemma, BioMistral, or Meditron is listed. Prefer the 20B production-listed model as a proposed first hosted comparison; Qwen3.8-27B is currently preview-listed. The free-plan limits page includes these candidates, but actual account access/quotas remain unverified. No Groq adapter or account was enabled. [Catalogue](https://console.groq.com/docs/models), [free-plan limits](https://console.groq.com/docs/rate-limits)

**Hugging Face hosted inference:** the live pricing page now lists **no included Inference Providers credits for free users**; buying credits or upgrading is required. This supersedes the USD 0.10 figure reported on 2026-10-16, which still appears in cached search excerpts. Both the official `google/medgemma-1.5-4b-it` page and the BioMistral-7B page currently state that no Inference Provider deploys that exact model. This does not rule out separately hosted derivatives, dedicated paid endpoints, or demos; it means neither exact repository was verified as a free routed API. [Live pricing](https://huggingface.co/docs/inference-providers/pricing), [MedGemma provider status](https://huggingface.co/google/medgemma-1.5-4b-it), [BioMistral provider status](https://huggingface.co/BioMistral/BioMistral-7B)

**Hugging Face demonstrations:** ZeroGPU Spaces offer free, quota-limited use. A community [MedGemma 1.5 demo](https://huggingface.co/spaces/warshanks/medgemma-1.5-4b-it) was publicly labelled "Running on Zero" when checked. This is a third-party demonstration, not an adopted/private APIP backend. No request was sent to it. Its data handling, queue, actual remaining quota, output behavior, and API suitability were not tested. Use only fictional examples for evaluation. [ZeroGPU documentation](https://huggingface.co/docs/hub/spaces-zerogpu)

**Ollama local inference:** these published library entries have no metered API charge when run on one's own hardware, subject to model terms. They are available candidates, not newly installed models:

- [`medgemma1.5:4b`](https://ollama.com/library/medgemma1.5): approximately **3.3 GB** download, text/image model; the priority medical comparison candidate for this machine. Total memory exceeds weight size, and visual/context overhead may require CPU offload on a 4 GB GPU. Begin with short text tasks and measure; no full-GPU or Telugu-quality guarantee is made.
- [`meditron:7b`](https://ollama.com/library/meditron): approximately **3.8 GB**, older Llama-2-based medical text model; optional research comparison, not the default.
- [`medllama2:7b`](https://ollama.com/library/medllama2): approximately **3.8 GB**, older medical QA fine-tune; lower-priority research baseline.

Local inference still uses electricity, RAM, disk, and download bandwidth. A free model is not a free cloud server or validated clinical service. Verify model provenance, licence, quantization, context, and checksum before downloading. Telugu performance remains unestablished for these candidates.

**Author repositories:** [Google Health MedGemma](https://github.com/google-health/medgemma) provides source/tutorials under its component-specific terms; [EPFL Meditron](https://github.com/epfLLM/meditron) distinguishes Apache-2.0 code from Llama-2 model terms. Neither repository grants a hosted inference entitlement. Existing BioMistral research-use limitations remain relevant.

**APIP recommendation:** keep the installed Qwen shortlist for local application development; compare local MedGemma 1.5 4B for a bounded medical-evidence task after runtime/licence review; evaluate Groq's free-tier general model with the same approved RAG passages and bilingual fixtures. A general LLM plus RAG remains a general LLM with retrieved evidence, not a medically fine-tuned model or proof of clinical correctness.
