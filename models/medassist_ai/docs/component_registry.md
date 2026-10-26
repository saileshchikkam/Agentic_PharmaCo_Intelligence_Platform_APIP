# Implemented component registry

- `ModelRegistry` / `Settings`: immutable canonical references; selected Groq ID locked; no secret-bearing settings or artifact loading.
- `ConversationalProvider` / `QuestionProvider`: small injectable structural interfaces. Python Groq calls require an explicit bridge; the existing TypeScript backend remains the live cloud transport.
- `GroqProvider`: backend OOP wrapper, exact selected ID, safe in-memory metrics, existing qualification/timeouts/errors/caps. No new provider comparison or real cloud call during this task.
- `ModelAAdapter`: receives an already verified service, calls the original fictional interview function, returns the original question/export contracts and generic failures.
- `MedAssistOrchestrator`: composition, unchanged question authority, complete evidence validation and isolated optional research summaries. It neither accepts raw LLM output as confirmed evidence nor generates questions.
- `EvidenceMapper` / `EvidenceValidator`: sparse proposal validation and copying; canonical export/provenance checks. Confirmed false is distinct from UNKNOWN and not asked.
- `ArtifactManifest`: pinned Git blob identity, bounded streaming local integrity checks and path containment; integrity never authorizes deserialization.
- `VocabularyMapping`: caller-supplied reviewed crosswalk and exact feature order; incomplete/unknown/unasked/conflicting mapped features abstain. No guessed symptom aliases or implicit zero-fill. The observed raw-dataset feature order is not accepted as verified serialized order.
- `JayanthDiseaseModelAdapter`: explicitly unavailable research prediction and source lookup. No Joblib import, conversion, model execution or patient-facing registration.
- `ModelBInterface` / `DisabledModelB`: four reserved technical levels, independent abstention, version/provenance/validation fields; active implementation always disabled.
- `SafetyProvider` / `UnavailableSafety` / `ProvisionalSafety`: clinical structured-evidence assessment remains unavailable; shared unreviewed v2 context rules interrupt or request clarification before models; the independent evaluation fails and clinical use remains blocked. No validated red-flag protocol or safety clearance. See [scope and review gates](safety-navigation.md).
- `HospitalProvider` / `UnavailableHospital` / `MapsSearchHospital`: explicit finite location consent and fixed Maps search handoff; no verified facility provider, availability or suitability claims. Browser geolocation requires a separate action; no automatic external Maps request.

Canonical Model A artifacts remain externally configured at their original verified roots. Jayanth references remain `app/ml/*` at the cited merge; the 16 required files were restored at their canonical paths from verified remote main on 2026-10-24, with no duplicate artifact location or format conversion. Integrity is verified; execution is still disabled.
