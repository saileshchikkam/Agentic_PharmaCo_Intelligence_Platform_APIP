# Milestone roadmap

This is the single work-planning entry point. It is organized by deliverables and acceptance evidence, not a fixed calendar or a completed-feature claim. Individual implementation tasks still require the current user's authorization.

## Current position

Documentation and repository connection have been established. Application code remains the Material 3 demonstration and experimental server at baseline `5400696`. A tested runtime, persistent product workflow, and clinical validation are not established.

The proposed first delivery is a restricted evaluation pilot using fictional cases. Final population, language, clinical-review scope, real-data permissions, and budget remain open.

## M0 — Scope, reviewers, and data readiness

- [ ] Confirm pilot audience, institution, language, intended use, team responsibilities, availability, and budget.
- [ ] Nominate a pharmacy reviewer and clarify institutional permission.
- [ ] Review official consumer/professional form mapping and the actual receiving route.
- [ ] Register dataset rights, labels, population coverage, and evidence-source permissions.
- [ ] Decide the MedAssist ML experiment's task and whether suitable evaluation data exists.

**Acceptance:** written scope, mapped forms, source/data register, fictional reporting cases, and explicit clinical/data boundaries. Missing clinical review limits work to synthetic evaluation.

## M1 — Reproducible engineering foundation

- [ ] Verify package manager, runtime, install, frontend/backend checking, and build.
- [ ] Establish CI, environment validation, secret protection, and development/staging separation.
- [ ] Implement identity, role/object access, database migrations, cases/versions, drafts, and audit records.
- [ ] Create the actual accessible Material 3 application shell, separate from the showcase.

**Acceptance:** repeatable baseline, isolated user data, restart-safe drafts, idempotent operations, and checked phone/tablet/desktop/keyboard flows.

## M2 — Complete ADR reporting

- [ ] Build narrative/choice intake, confirmation, unknown states, and a non-LLM fallback.
- [ ] Add schema-validated extraction with provenance and adaptive follow-up questions.
- [ ] Add private medicine-photo upload/OCR only with validation and confirmation.
- [ ] Generate versioned, template-aligned PDFs supporting long text and multiple medicines.
- [ ] Add user-controlled download/sharing, review state, and linked follow-ups.
- [ ] Conduct pharmacy workflow review.

**Acceptance:** intake → confirmation → saved version → accurate PDF → clarification/follow-up preserves the same facts. Optional-provider failure does not lose the report.

**Dependency:** do not expand optional features while this core path remains unreliable.

## M3 — Professional review and grounded intelligence

- [ ] Implement reviewer queues, notes, clarification, decisions, and attribution.
- [ ] Ingest a small approved corpus with source versions and resolvable citations.
- [ ] Produce duplicate-aware descriptive analytics with explicit denominators.
- [ ] Verify generated explanations against actual evidence/query results.

**Acceptance:** permissioned review, honest insufficient-evidence responses, and independently reconciled dashboard values. No simulated statistics or unsupported compliance labels.

## M4 — Bounded MedAssist and connected context

- [ ] Implement clinically reviewed educational/care-navigation flows, including uncertainty and urgent interruption.
- [ ] Add facility search, manual-location fallback, honest attributes, and provider navigation.
- [ ] Run the permitted ML baseline/candidate experiment with reproducible splits and error analysis.
- [ ] Import only user-selected, confirmed episode context into reporting.

**Acceptance:** reviewed scope, provider-failure handling, documented experiment, and safe context reuse. Keep model-driven urgency disabled when data/review criteria are unmet.

## M5 — Four-agent coordination

- [ ] Establish typed contracts for Reporting, Validation, Knowledge, and Analysis.
- [ ] Add durable orchestration, case-version invalidation, bounded retries, cancellation, and human gates.
- [ ] Test malicious/untrusted source content, failure/resume, and duplicate prevention.

**Acceptance:** observable stage results, safe resumptions, and no unauthorized fact changes, disclosures, or submissions.

## M6 — Evidence-based evaluation

- [ ] Run reporting, PDF, retrieval, and reviewed MedAssist scenario sets.
- [ ] Test access controls, uploads, timeouts, quotas, malformed outputs, and redacted logs.
- [ ] Check accessibility/responsiveness and conduct any institutionally approved fictional-case usability comparison.
- [ ] Record actual metrics, failures, confidence/uncertainty limits, and unresolved risks.

**Acceptance:** the [validation requirements](research-and-validation.md) have evidence. Critical safety/privacy/integrity failures block the affected release.

## M7 — Operable pilot and handover

- [ ] Deploy the restricted pilot with migrations, secrets, monitoring, and an incident owner.
- [ ] Prove backup restore and rollback, and document the runbooks.
- [ ] Obtain pharmacy/workflow acceptance and resolve release blockers.
- [ ] Publish internal release notes, measured results, enabled/disabled features, limitations, and the next validation work.

**Acceptance:** a reviewer reproduces the complete journey from a clean account; recovery works; release claims match the evidence. Real-patient/public expansion is a separate decision.

## Future candidates

These are preserved ideas, not current commitments:

- Regional-language and voice reporting.
- QR-based entry from hospitals/pharmacies/awareness campaigns.
- Permissioned similar-case retrieval.
- Expanded MedAssist custom ML and more reviewed populations.
- Manufacturer-facing summaries and institution-to-authority integrations.
- Privacy-reviewed public research datasets.
- Statistical signal methods after suitable reference data and expert review.
- Wider deployment/tenancy and further agent capabilities after measured need.

## Tracking practice

Put new actionable defects or research blockers here under the affected milestone, or link a focused GitHub issue when one exists. Include observed behavior, impact, evidence, and the condition for resolution. Demo placeholders are not automatically product bugs. Completion boxes change only with linked history/check evidence.
