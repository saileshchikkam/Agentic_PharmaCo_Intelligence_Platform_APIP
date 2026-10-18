# Hospital ADR and pharmacovigilance requirements

Recorded 2026-10-18 from the user's supplied transcription attributed to Mahesh P. The original handwritten hospital notes and approved institutional documents were not supplied here. This is a requirements/gap register, **not a verified hospital SOP, clinical approval or implemented workflow**. APIP's canonical name remains Agentic Pharma Co-intelligence Platform.

## Existing implementation and boundaries

- Local email/password accounts and owner-isolated SQLite health profiles are implemented and tested. Name/date of birth, optional conditions, surgeries, medicines and allergies can be saved. They do not establish hospital affiliation, professional credentials or permission to view patient cases.
- The English-only ADR preview collects medicine, dose, reaction narrative and onset as user text, supports review, multiple saved drafts and confirmed deletion. Its browser-local records are shared within a browser profile, even after login. These are fictional drafts, not protected hospital cases or official submissions.
- MedAssist collects symptoms with fixed follow-ups, optional local source-quote selection and location-only Maps navigation. Its intended custom urgency ML remains separate from ADR causality, seriousness and professional assessment; no trained urgency model is present.
- Reporting, Validation, Knowledge and Analysis have experimental handlers in `server.ts`. Embedded references, heuristics or simulated results are not validated clinical capabilities. Production agent contracts, approved evidence ingestion, role enforcement, review attribution and case-level audit remain missing.

Implementation references: [architecture](architecture.md), [local account API](../database/local-development.md), [ADR contract](../src/features/adr/draftStorage.ts), [ADR UI](../src/components/material/ReportReactionView.tsx), [agent responsibilities](layers/agent-orchestration.md).

## Document traceability

Statuses describe current evidence. **Implemented** means working software, **Partially implemented** means some necessary foundation exists, **Missing** means not present, and **Needs clarification** means a source/decision is required. A source requirement and a proposed interpretation are not interchangeable.

- **DOC-01 Official ADR form — Needs clarification.** The [IPC reporting-forms portal](https://www.ipc.gov.in/8-category-en/865-adr-reporting-forms.html) lists a healthcare-professional form and consumer reporting forms (checked 2026-10-18). Select the applicable current template/version with Mahesh/the receiving institution; no official field mapping or approved export is implemented. A professional template must not silently impose hospital-only identifiers on direct consumer reporting.
- **DOC-02 Hospital ADR SOP — Needs clarification.** No approved SOP supplied. Required source for responsibilities, review/approval order, escalation and submission.
- **DOC-03 Medication safety policy — Needs clarification.** No approved institutional policy supplied; do not ingest example guidance as trusted evidence.
- **DOC-04 User-role matrix — Partially implemented / Needs clarification.** Account/profile ownership exists; hospital role provisioning, affiliation and case permissions do not. Candidate roles: patient, nurse, treating doctor, pharmacist, PV officer, quality/governance reviewer and administrator. The institution must approve the exact matrix; self-selecting a role must never grant it.
- **DOC-05 Serious ADR escalation protocol — Needs clarification.** No reviewed trigger set, designated recipient or verified contact/acknowledgement process. Do not imply that displaying a warning notifies a clinician.
- **DOC-06 Drug master — Missing.** The embedded experimental reference dictionary is not an approved, versioned hospital drug master. Need permitted source, identifiers, update ownership and user-confirmed selections.
- **DOC-07 Department/ward master — Missing.** Need hospital-specific department/ward IDs and active/inactive reference management.
- **DOC-08 ADR classification guide — Needs clarification.** Keep symptom intensity/severity, regulatory seriousness, causality and outcome separate. The institution must confirm the classification tools and reviewer responsibilities before implementation.
- **DOC-09 Training material — Partially implemented.** Developer/setup guides and fictional-preview explanations exist; approved role-specific hospital training does not.
- **DOC-10 Privacy/retention policy — Partially implemented / Needs clarification.** Local account ownership, session expiry and user profile deletion exist. Hospital permissions, retention/legal holds, case audit, disclosure rules, backups and real-patient arrangements are not established. User profile deletion must not automatically delete a legally retained clinical report.

## Intake and case-field traceability

- **INT-01 Reporter identity/details — Partially implemented.** An account identifies the signed-in person; reporter role, contact, organization and authority in a specific case are not captured. Initial question: who is reporting? Do not infer professional status from login.
- **INT-02 Patient information — Partially implemented.** Profile has name/date of birth and computed age. Hospital patient ID/UHID, sex, ward and admission number are missing. A case may concern someone other than the account owner. Require explicit care-recipient selection and case confirmation, with identifiers/requirements appropriate to the chosen reporting pathway.
- **INT-03 Suspected medicine — Partially implemented.** ADR text medicine/dose fields exist; normalized identification, multiple suspect/concomitant exposures, route and frequency do not. Suspicion is not proof of causality.
- **INT-04 Reaction/onset — Partially implemented.** Original narrative and onset text are preserved; typed date/time with precision/unknown handling and chronology validation are missing. Initial questions: what happened, and when did it start?
- **INT-05 Serious outcome — Missing.** A separate user-reported seriousness/outcome intake and reviewed screening process are needed. The faint source wording must be confirmed; do not invent exact questions or thresholds.
- **INT-06 Management/outcome — Missing.** Treatment given, clinical management and outcome need attributable, authorized clinical records. Patient descriptions and professional conclusions must remain separate.
- **INT-07 Background/allergies — Partially implemented.** Optional account profile fields exist; importing selected facts into a versioned ADR case still needs explicit confirmation and source revision. Blank history is not "no history."
- **INT-08 Missingness/completeness — Partially implemented.** Null unknowns and local schemas exist. Hospital case fields need distinct provided, unknown, not-applicable and not-yet-collected states, plus validated pathway-specific requirements. Do not make identifiers universally mandatory before selecting the intended form/SOP.
- **INT-09 Draft/follow-up/versioning — Partially implemented.** Fictional drafts and account profiles have revisions. Owner-/case-authorized server ADR drafts, idempotency, immutable submitted versions and linked follow-ups are missing.

## Clinical review and responsibility traceability

- **REV-01 Clinical evaluation, evidence and final assessment — Missing.** Need permissioned case inspection, clarification requests, evidence provenance, AI-assisted proposals and separately signed professional assessments. Existing demonstration screens are not a review service.
- **REV-02 Responsibility stages — Needs clarification.** The supplied interpretation is initial reporter (nurse/doctor/pharmacist), treating doctor, PV reviewer/committee, possible quality/governance reviewer, then authorized submitter. Exact role labels and mandatory order require the actual SOP.
- **REV-03 Escalation — Missing / Needs clarification.** Urgent escalation must operate independently of ordinary completeness/review queues. Deterministic screening should use an approved protocol and record routing, acknowledgement and failure; unrestricted LLM decisions must not control escalation. No emergency notification is implemented by this register.
- **REV-04 Case lifecycle/audit — Missing.** Candidate states are draft, submitted, screening, clinical review, PV assessment, optional additional approval, prepared-for-submission, submission-recorded, follow-up and closed/reopened. These are proposed states, not adopted hospital policy. Capture case version, actor, timestamp and transition reason; urgent handling is parallel, not a blocking sequential step.
- **REV-05 Submission and outputs — Missing.** Need versioned template exports and deliberate authorized handoff. Generated, downloaded, sent, acknowledged and officially received must be different states. No auto-submission, recipient sharing or regulatory compliance is claimed.

## Preserve the four-agent architecture

- **Reporting:** structured intake assistance and draft/report preparation; users confirm proposed facts.
- **Validation:** deterministic schema/missingness/date checks and reviewed seriousness screening; the application enforces permissions and routing outside the LLM.
- **Knowledge:** retrieve permitted/versioned drug and policy evidence with citations; drug/ward masters are managed reference data, not model memory.
- **Analysis:** case summaries, reviewable evidence and deterministic aggregate analysis; authorized humans record final clinical assessments.

No new agent or rename is required by these notes. Shared case versions, review records and audit events belong in the backend. Agent runs reference the exact authorized case/evidence versions; they cannot grant access, approve clinical conclusions or publish records. New reports do not automatically retrain MedAssist or become trusted RAG evidence.

## Phased integration proposal

1. **Confirm sources and boundaries:** obtain the applicable blank official form, approved SOP, role matrix, escalation protocol and privacy/retention policy. Confirm uncertain handwriting, receiving channel and who can approve clinical wording. Preserve the independent consumer/direct-ADR pathway and English-only scope.
2. **First durable ADR slice:** define a versioned case/exposure/reaction/reporter contract with explicit missingness, then owner-isolated server draft APIs and confirmed profile imports. Preserve existing fictional drafts; any migration needs an explicit mapping and user review. First acceptance evidence: exact input survives save, restart/reload, edit and user isolation.
3. **Hospital authorization and audit:** add institution membership, verified professional roles, case assignment, attributable transitions and audit events. Enforce in the server/database, not navigation labels. No universal access for a generic "specialist" selection.
4. **Reviewed escalation and clinical workflow:** implement the approved protocol, independent urgent routing, clinical/PV review and clarification/follow-up. Record accountable human conclusions separately from AI suggestions. Test routing failure and incomplete cases before enabling notifications.
5. **Official documentation and handoff:** map the selected form/version, generate checked outputs and record deliberate authorized submission/acknowledgement. Add trained-role guidance and apply the institution's retention/disclosure rules.
6. **Evidence and analytics:** introduce approved masters/RAG and four-agent coordination only after underlying permissions and deterministic functions pass independently. Reconcile statistics to defined cohorts and report counts; never label report proportions as incidence or proven causality.

These phases are a plan, not completed features or permission to perform major migrations/deployments automatically. The current task fixes profile editing and records the requirements; it does not change clinical behavior or hospital database structure.

## Next information for Mahesh / the institution

- Which institution and reporting pathway apply, and which blank form/version is required?
- Supply approved SOP, role matrix and escalation protocol, including accountable recipients and acknowledgement/failure handling.
- Confirm patient versus staff entry requirements, optional hospital identifiers, exact role sequence and unclear handwriting.
- Confirm permitted clinical data, reviewer scope, drug/ward master ownership, retention/legal-hold rules and submission authority. Do not send patient records to answer these questions.
