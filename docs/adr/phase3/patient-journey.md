# Patient journey

All future functionality is proposed. [Master](../../architecture/ADR_PHASE3_MASTER_BLUEPRINT.md) and [contracts](roles-consent-and-revisions.md) apply.

## Reporting and management

Home → existing patient sign-in → dashboard → My ADR Reports → case detail → existing guided editor → confirmed revision → actual original PvPI preview/download. Reporting remains directly usable without MedAssist.

List only owned cases. Search confirmed medicine names/case references and filter by dates, status and Initial/Follow-up type. Apply filters before server pagination. Preserve sort/filter state on Back without clinical text in URLs.

Historical revisions are read-only. Editing resumes the latest intake and creates a new immutable revision. Export explicitly identifies the selected revision. Preserve Unknown and original statements.

## Review and consent

Ready for Review is a patient affirmation bound to a saved revision, not clinical approval. The patient selects an approved recipient, previews disclosure including reporter contacts in the original PDF, then explicitly submits for internal APIP review.

Consent specifies recipient, purpose, scope, wording version and revision. Existing profile-sharing flags do not authorize this disclosure. Display recipient, source revision and workflow status. New edits remain private and carry New changes not shared until explicit publication.

Clarification links to guided fields. Patient answers create an intake revision; a separate Share update action publishes that exact revision. Reviewed labels the human record and reviewed revision, without implying a newer revision or government receipt is reviewed.

## Archive and withdrawal

Archive hides an eligible report while preserving history. Withdrawal revokes future specialist access under approved rules. Restore never revives old consent. A deletion request records pending intent, without claiming erasure or running permanent deletion.

Approve caregiver authority, retention/holds, note visibility, archive eligibility and review disclosure before enabling the respective writes. Data already downloaded cannot be recalled.

## Screens and acceptance

Screens are case list/filter dialog, case detail, read-only revision, existing guided editor, original form viewer, ready confirmation, disclosure/recipient confirmation, review timeline, clarification response, archive/restore and deletion-request acknowledgment.

Preserve Material 3, glass header, Back, footer, keyboard/focus, themes and reduced motion. At 320/360px use readable labeled cards and an explicit preview toggle; at 820/1440px use the central workspace. Distinguish loading, empty, no-match, unavailable, stale/conflict and expired-session states. Preserve unsaved answers on failure and clear data/PDF URLs on account switch.

Tests require two owners and anonymous callers, historical exports, unshared new edits, consent/edit races, archive/restore history and four-width navigation. No foreign case/count, auto-submission or automatic clinical conclusion may appear.
