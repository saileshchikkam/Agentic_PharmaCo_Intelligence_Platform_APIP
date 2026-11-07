# Specialist journey

All screens are proposed. [Master](../../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md) and [roles/contracts](roles-consent-and-revisions.md) apply.

## Identity and queue

Existing Supabase sign-in → own application → independent human verification → administrator decision → effective capability. Registration, email and workspace choice grant no professional privilege. Self-approval is prohibited. Approved specialists without assignments see no patient cases.

Pending/rejected/suspended/revoked/expired identities receive their own permitted status. Administrators have identity/permission powers without default access to narratives.

The proposed default is a patient-selected recipient and an assigned-only queue. A future dispatcher queue requires P22 approval and minimum consented routing metadata. Unassigned actors receive no private draft, name, contact, narrative, medicine or PDF. Claim/assignment is an atomic authorized command, not a client-only button.

## Guided human review

At desktop widths, approximately 60% left guides review and 40% right renders the actual original PvPI PDF from the exact shared revision. On narrow screens prioritize the review step and expose preview explicitly.

Proposed steps are source/consent context, confirmed patient/exposure details, reaction chronology, completeness observations, clarification needs and human summary/finalization. They do not calculate causality or recommend medication.

Patient data is read-only. Professional drafts, saved versions and finalized records are separate. Finalization requires human affirmation; amendments append superseding records. Show source revision, grant/assignment epoch and draft version.

Specialist approval alone does not authorize AMC/NCC fields or signatures. Preserve the original mapping and reserved-field rules.

## Clarification, evidence and revocation

A specialist may request bounded plain-English information. The patient answers through intake and explicitly shares an updated revision. Future revisions and complete history are not automatically visible.

In 3F only, an evidence drawer and approve/edit/reject suggestion panel may support the reviewer. No AI proposal publishes itself.

Withdrawal, reassignment or role revocation blocks subsequent access and final PDF response checks. Authorship alone does not preserve access to retained notes after revocation. Download/retention exceptions require approved policy.

## Tests and screens

Screens are application/status, assigned inbox, guided review/PDF, draft/final review, clarification and permission-changed recovery states. Test two patients, two specialists, an unapproved applicant and an approver; nested IDs, unshared revisions, raw proposal/profile exclusion, revocation during rendering and audit failure.

At 320/360/820/1440px verify readable controls, actual form preview, keyboard, reduced motion, themes and account switching. No unrelated patient access, automatic clinical decision, autonomous causality or recommendation is accepted.
