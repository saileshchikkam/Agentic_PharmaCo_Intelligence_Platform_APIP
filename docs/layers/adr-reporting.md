# ADR reporting

**Status:** core confirmed requirement. A small English/Telugu fictional draft prototype remains in source, but is no longer mounted in the developer design-reference shell. It can save one version in browser storage when mounted. It is not the real patient-reporting workflow: there is no account, server persistence, user isolation, official form, professional review, or submission.

## Responsibility

Make it easy to describe a suspected medicine-related problem while preserving accurate, editable information for review. Reporting must work directly without MedAssist.

## Intake and case lifecycle

- Support narrative, guided choices, and optional medicine photos.
- Aim for 5–10 short steps for straightforward cases; complex/missing information can require more.
- Gather medicine/exposure, dose where known, timing, reaction, relevant history/outcome, and reporter details according to the reviewed template.
- Offer unknown/not-applicable states. Do not invent dates, doses, demographics, or clinical interpretations.
- Show proposed structured fields for correction/confirmation with their source.
- Save/resume drafts; confirm a version; generate a report; link professional clarification and follow-up versions.
- Use idempotent requests and review potential duplicates without silently merging different people.

The unmounted prototype at `ReportReactionView` is limited to fictional evaluation. Reporter statements are labelled as reporter-originated, optional blank values remain unknown, and only the report narrative is required. Browser storage is a temporary engineering step; never enter real patient information into it.

Current care urgency, symptom intensity, regulatory seriousness, and causality are separate fields/concepts. Reviewed urgent guidance can interrupt intake.

## Reports and sharing

Map confirmed data to the appropriate official consumer or healthcare-professional form. Record template/version and case version. Keep AMC/NCC-only sections unfilled unless an authorized receiving workflow supplies them.

PDFs need readable long narratives, multiple medicines, dates/unknowns, and attachment references. A medicine image/OCR suggestion requires user confirmation; appearance alone does not establish identification.

Allow download and deliberate recipient-specific sharing. Copy/share controls must expose what will be disclosed. Generated, downloaded, shared, and officially received are different states. Do not imply government approval or submission receipt without an authorized integration.

## Acceptance evidence

- Saved/reloaded cases preserve the user's confirmed details.
- Draft completion remains possible during optional-AI failure.
- PDFs reconcile to exact case versions without lost text.
- Follow-ups retain original provenance and do not overwrite history.
- File access, sharing, and professional-only fields obey permissions.
- Pharmacy review confirms questions, mappings, and receiving process.
