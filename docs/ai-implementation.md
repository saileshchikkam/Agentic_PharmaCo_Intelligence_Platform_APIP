# AI implementation guide

**Status: proposed engineering approach, checked against official references on 2026-10-16.** No model has been downloaded, trained, benchmarked, or selected for clinical use by this planning update. The [roadmap](roadmap.md) owns sequence and tasks; the [layer guides](layers/README.md) own product requirements; [research and validation](research-and-validation.md) owns evidence and release gates.

## What each technology does

- **Custom ML:** learn a narrow prediction task from permitted, labelled examples. The proposed MedAssist experiment is reviewed urgency classification, with an uncertain outcome. This is separate from diagnosis and drug causality.
- **LLM:** interpret free text, propose report fields/questions, and explain retrieved evidence. Its output is a suggestion until validated and, where required, confirmed.
- **Embedding model:** convert questions and passages into vectors for meaning-based search. It does not write answers or certify a source.
- **RAG:** retrieve relevant passages from an approved collection, then ask an LLM to answer using those passages and citations. It does not automatically train the LLM.
- **Agents:** bounded software roles that use these functions/tools, keep state, and request human decisions. Four roles do not require four different language models.
- **Ordinary code/database queries:** save records, enforce access, validate types/dates, generate PDFs, and calculate counts. These functions should not depend on generated guesses.

The user does not need to master these libraries before development starts. Each implementation session should explain the input, processing, output, failure behavior, and verification of the selected small feature. Engineering work can be handled in Codex; product decisions and qualified clinical review remain human responsibilities.

## Local development, local inference, and hosted APIs

These are separate choices. An app running on a laptop can call an online model API; a deployed app can use a privately hosted model. Changing the model's location does not remove the need to test its outputs.

### Practical local starting point

The hardware check found approximately 16 GB system memory and 4 GB dedicated GPU memory. Ollama is installed, but its service was not running during the check; no installed model inventory or inference speed was established. Python and Node are available. Do not infer a working local AI environment from installed executables.

Use one small quantized instruction model initially, with bounded input/output and a short context, rather than loading several large models concurrently. A 4-bit **Qwen3-4B-Instruct-2507** artifact is a candidate; select a compatible, traceable artifact and record its exact tag/digest, quantization, licence, and runtime. GPU/system-memory use and latency must be measured with the app running; CPU offload may be necessary. A smaller model or manual/fixture mode is the fallback when this machine is too slow. The advertised maximum context length is not an appropriate laptop default.

Qwen's official card describes this as a 4B instruction model with non-thinking output. It is a general model, not validated medical software. Telugu quality and extraction reliability require APIP-specific evaluation. [Qwen model card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507)

Ollama supports schema-constrained local output, but application validation and factual confirmation are still necessary. Record model/runtime versions rather than assuming similarly named artifacts are equivalent. [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)

### Hosted candidate and selection

The repository already has a Google GenAI dependency, so the first hosted comparison can use **Gemini 3.8 Flash (`gemini-3.8-flash`)**, currently listed as stable in Google's catalogue. Its structured-output documentation supports JSON Schema. This is a candidate to benchmark, not a claim that the existing endpoint succeeds or that a provider is clinically suitable. Confirm account access, current pricing/limits, SDK compatibility, and permitted processing before use. [Models](https://ai.google.dev/gemini-api/docs/models), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)

Begin with a fast schema-capable instruction model. Consider a larger reasoning model only when a measured failure justifies the extra cost/latency. A vision-capable model or OCR is optional for medicine images; recognized names/strengths still need confirmation. No model may invent an absent drug, dose, date, or citation.

### One contract across providers

The proposed application interface should support explicit `manual/fixture`, `local`, and `hosted` modes. These are design labels, not existing configuration switches. Both live modes must return the same validated field structure, unknown states, source spans, errors, and usage metadata. Validate on the server; do not trust JSON merely because it parses.

Keep a fixed set of reviewer-corrected fictional stories. Compare providers on field fidelity, omitted/contradicted facts, unsupported additions, Telugu/mixed-language behavior, latency, and measured token cost. Log model/prompt/schema versions. Use deterministic fixtures for routine automated checks and a limited live benchmark for provider behavior; do not pay for an LLM call on every frontend test.

Run a small hosted compatibility test during ADR implementation. Repeat it on the intended deployment path before release. Switching from local to API only at the end risks different outputs, timeouts, safety refusals, and data handling. Do not silently send data to the cloud when a local model fails; preserve the draft and show the next available action.

### Budget and data handling

The user gave a budget of `500`; assume INR 500 monthly for planning until currency is confirmed. Keep the app, database, embeddings, ML experiments, and most tests local initially. This avoids API/hosting charges for those components, but uses existing hardware, electricity, storage, and download bandwidth. Reserve the budget for small measured API comparisons; it is not an estimate that public production hosting will fit.

Before enabling paid calls, estimate representative per-case cost from current provider rates, cap input/output and retries, limit concurrency and test volume, and track usage. Application cutoffs and provider quotas are needed; billing alerts alone are not a guaranteed spending cap. Do not buy hosting or download large models as part of a documentation task.

Use fictional cases throughout this pilot. Google's unpaid-service terms prohibit submitting sensitive/confidential/personal information and describe use of inputs/outputs for product improvement. Paid service terms differ, but payment alone does not establish medical-data suitability or project permission. Review the selected service's exact terms and processing arrangements before real data. Local embeddings also do not keep retrieved text private if that text is later sent to a hosted generator. [Gemini API terms](https://ai.google.dev/gemini-api/terms)

## Custom ML from scratch

For this project, a realistic first goal is **training our own narrow classifier from labelled data**, not pretraining a general conversational foundation model. A general LLM trained from random weights needs resources and data far beyond this laptop/budget. A small classifier can be trained locally; a small randomly initialized neural network is an optional research comparison when enough suitable data exists. Fine-tuning a pretrained model is a different experiment and must be described honestly.

### 1. Define the question and labels

Proposed input: symptom narrative plus reviewed structured context such as duration, age band, and warning-feature responses. Proposed target: reviewer-defined care urgency classes, with a separate insufficient-information/abstention outcome. The reviewer defines intended population, label rubric, out-of-scope cases, and how ambiguity is handled. Do not train a broad disease-diagnosis model merely because a dataset is easy to download.

Decide what action each output can support and which errors matter most. A clinically reviewed urgent rule cannot be downgraded by the ML model. If the input is unsupported or uncertainty is high, the app must not confidently assign a low-urgency answer.

### 2. Obtain lawful, relevant examples

Register dataset origin, version, licence, permitted purpose, population, language, personal-data status, and label creation/review. Dean consultation does not itself provide a labelled dataset. Existing ADR reports can support reporting research but do not automatically provide valid symptom-urgency labels.

Use fictional examples to develop the loader and UI. Model-generated labels and translated copies are not independent clinical ground truth. Do not train only on a small synthetic set and describe its scores as clinical performance. Choose the necessary data volume after examining class/language coverage and the uncertainty of evaluation; there is no universal number that guarantees a safe model.

### 3. Build the dataset and review it

Use stable example IDs and separate narrative, language, structured features, target label, reviewer/rubric version, and source/group identifiers. Preserve unknowns. Remove accidental identifiers; document exclusions and disputed labels. Where feasible, obtain independent label review for a subset and adjudicate disagreements.

Report counts per class, language, population, and source. Keep English, Telugu script, transliterated Telugu, and mixed English/Telugu visible as different evaluation slices. Clinical translations need qualified bilingual review; medicine names, numbers, and units should not be casually rewritten.

### 4. Split before learning

Create training, development, and a locked test set before fitting preprocessing. Keep records from the same patient/episode/source family together; keep paraphrases, translations, and synthetic variants of the same example in the same split. Use source/time separation where relevant. Never tune on the locked test set or include post-outcome information unavailable at prediction time.

Fit vocabulary, imputers, feature selection, and other learned preprocessing only on training folds. A scikit-learn pipeline helps enforce this. Save the split manifest and seed. [Leakage prevention](https://scikit-learn.org/stable/common_pitfalls.html)

### 5. Train a simple baseline, then a candidate

Start with a majority-class reference and the reviewed rule pathway. For text/structured inputs, a proposed learned baseline is character/word TF-IDF features plus structured features and logistic regression in Python/scikit-learn. Character features are worth testing for spelling/transliteration; do not assume they solve Telugu understanding.

Train a small candidate only after inspecting baseline errors: for example, a compact randomly initialized neural network over an appropriate input representation, or a tabular model if the reviewed task is primarily structured. Document whether any embeddings/encoder were pretrained. Use repeatable commands, versioned configuration, dependencies, data manifest, and saved model/preprocessing artifacts.

### 6. Evaluate errors and confidence

Report per-class precision/recall, macro F1, confusion counts, urgent-class misses, language/population coverage, abstention rate, and latency. Have the reviewer inspect consequential errors. Study calibration on held-out development data before interpreting a probability as confidence; a high model probability is not proof of clinical correctness. [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)

Synthetic regression vignettes test software behavior. They do not substitute for representative held-out clinical evaluation. Record sample sizes and uncertainty; do not claim a target accuracy has been achieved or choose a release threshold without reviewer input.

### 7. Package, compare silently, then decide

Write a model card with intended use, data/labels, exclusions, training method, measured results, limitations, and version/checksum. Load exactly the saved preprocessing/model. Run schema and failure checks, then compare predictions offline or in a non-user-facing evaluation mode against reviewed cases.

Enable model-supported urgency only if the data, evaluation, workflow review, and applicable readiness requirements support it. Otherwise deliver the useful reporting product and reviewed MedAssist prototype with model inference disabled; preserve the experiment and its actual results. New reports never automatically retrain it.

## RAG implementation

RAG gives the assistant a small, traceable reference collection to consult. Its quality depends on source selection and retrieval, not just which chatbot is connected.

### Offline ingestion

1. **Approve sources:** choose a small permitted set of reporting guidance, approved medicine information, and reviewer-selected references. Record publisher, URL, version/date, licence, scope, and review status. Do not scrape arbitrary medical pages as trusted knowledge.
2. **Extract content:** read text/PDF sections; use OCR only where needed and inspect extraction quality. Preserve headings, page/section references, tables, units, and warnings.
3. **Make passages:** split along meaningful sections with modest overlap where useful. Tune passage size on actual questions; do not separate a dosage qualifier or warning from its subject. Keep stable passage IDs, source version, language, permissions, and content hash.
4. **Embed and index:** a small multilingual embedding candidate is `intfloat/multilingual-e5-small`. Its card requires `query: ` and `passage: ` prefixes even for non-English inputs and notes weaker performance can occur in low-resource languages. Follow its documented token limit; record truncation and model version. Telugu retrieval must be tested. [E5 model card](https://huggingface.co/intfloat/multilingual-e5-small)
5. **Store/rebuild:** proposed PostgreSQL plus pgvector can hold vectors beside source metadata. Begin with exact similarity search for the small corpus; add approximate indexing only when measurement justifies it. Changing embedding models requires a separately versioned/rebuilt index. [pgvector](https://github.com/pgvector/pgvector)

### At question time

1. Identify the permitted task, user role, and current case version. Apply permissions/source status in retrieval, before text reaches generation.
2. Search using the query embedding; add lexical matching where needed for exact medicine names/identifiers. Evaluate English-to-English, Telugu-to-Telugu, and Telugu-to-English retrieval when sources are English.
3. Rank a bounded number of passages. Add a reranker only if the simpler baseline misses relevant material and the extra cost/latency is worthwhile.
4. Send the question and those passages to the generator with a strict instruction to use the supplied evidence, cite passage IDs, preserve uncertainty, and report absent/conflicting support. Retrieved text is untrusted data, not tool instructions.
5. Validate cited IDs against the actual retrieved passages and check whether statements are supported. Display links/page/section and the source version; a plausible-looking citation is not sufficient.
6. Store the retrieval/source/model versions needed to reproduce the answer without putting full sensitive narratives into general logs.

Keep an answerable/conflicting/unanswerable reviewed question set. Measure whether relevant passages are retrieved, whether citations support answers, unsupported claims, abstention, language-specific failures, and latency. Vector similarity is not clinical confidence.

Medical-reference retrieval and patient-case retrieval are separate collections and permission paths. Operational report statistics come from reproducible database queries, not vector search or the LLM. For a fictional 20-report cohort, code computes the count and denominator; the model may explain those results without turning a submitted-report proportion into population incidence or causality.

## Agent implementation

Build independent functions before orchestration. A small explicit state machine is a reasonable starting point; a framework such as LangGraph is optional, not a prerequisite or an accepted dependency. Do not add several orchestration frameworks or give agents unrestricted tools.

### Four bounded roles

- **Reporting:** read the supplied narrative/answers, propose fields with source spans, ask focused follow-ups, and stop for user confirmation.
- **Validation:** run deterministic schema/date/consistency/completeness checks and flag conflicts/possible duplicates. An LLM may assist with ambiguous text; it cannot certify truth or official acceptance.
- **Knowledge:** retrieve approved passages, present supported evidence/citations, and return insufficient/conflicting evidence explicitly.
- **Analysis:** call checked analytical tools, assemble query results and evidence for professional review, and keep hypotheses separate from causal conclusions.

### Execution and failures

The orchestrator records stages against an exact case version: draft → extraction proposal → confirmation required → validation → evidence → analysis → professional review. This is a conceptual flow; not every stage belongs in the patient's short reporting interview, and people can save a draft or report without waiting for optional evidence analysis.

Each stage needs input/output validation, a bounded tool list, stage/model/prompt versions, status, timeout, retry limit, error, cancellation, and an idempotency key. Store progress durably, so restart/resume does not duplicate a report. Invalidate dependent outputs when confirmed case facts change. Prevent concurrent stale runs from overwriting a newer version.

Test an interrupted run, malformed JSON, provider outage, duplicate event, revoked permission, changed case, and malicious instructions in an uploaded/retrieved document. Show which stage failed and preserve confirmed facts. A sequence of four prompts without these controls does not establish a reliable agent system.

Agents may suggest or prepare a document. They may not silently overwrite confirmed facts, disclose records, submit to an authority, publish datasets, change medicines, or turn an analytical association into a clinical conclusion. Human actions and permissions stay explicit.

## Evidence to show at each demonstration

Explain the feature in plain language, show one complete fictional example, show what happens when it fails, and record the actual check results. Use the gates in [research and validation](research-and-validation.md), not a single claimed AI accuracy.

Keep the selected provider/model/index/ML versions and known limitations alongside the code when implemented. UI polish, a successful API response, a RAG citation, and an agent stage each need their own evidence before they are described as working product capabilities.
