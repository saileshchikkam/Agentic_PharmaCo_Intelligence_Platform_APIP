# Fictional ADR draft storage

`AdrWorkspace.tsx` selects local account storage for an authenticated local user. It clears task state on account changes and waits for the owner list before opening the editor. Failed loads offer retry; no silent browser fallback occurs. Signed-out users can sign in or explicitly open the separate shared browser demo. The optional Supabase adapter has no ADR repository yet and reports this boundary.

`accountDraft.ts` defines the strict English-only command and response contract. `ReportReactionView.tsx` supplies the shared Material Web intake, review, list and confirmation dialogs. It receives persistence callbacks in account mode and never reads browser drafts there.

## Local API

All endpoints use the existing verified cookie and matching `X-APIP-Account` consistency header. Ownership comes from the session, never a supplied user ID.

- `GET /api/account/drafts` lists only the current account's drafts.
- `POST /api/account/drafts/save` accepts `fictionalOnly: true`, a UUID, `expectedRevision` (null for creation), `status` (`draft` or `user-confirmed`) and reporter `statements`.
- `POST /api/account/drafts/delete` accepts the fictional flag, ID and matching revision. Deletion removes the row; there is no restore workflow.

Statements contain medicine name, dose, onset and reaction. Optional blank values become null; meaningful original text, including whitespace, is preserved. An unfinished draft may have an empty reaction. Review/confirmation requires a nonblank reaction and an explicit checkbox. Server-assigned timestamps/revisions cannot be supplied by the client. User confirmation is not professional review.

Schema v2 adds `local_adr_drafts` with an owner/ID primary key and revision checks, preserving existing accounts/profiles. Saves are bounded to 200 drafts per account. Repeating the same save at the current or immediately previous revision returns the existing record without a duplicate; changed stale writes fail. This is bounded retry handling, not an immutable case audit or distributed exactly-once guarantee. Deleting a profile preserves its separate drafts.

Failed saves keep edits; failed deletes keep the draft. Busy controls and navigation guards prevent overlapping UI actions. The server remains authoritative. Legacy browser drafts are neither claimed by a login nor automatically imported; their browser-profile sharing remains explicit.

## Limits and verification

This is local development with fictional cases only. SQLite is outside Git but is not encrypted at rest by APIP. No hospital submission, official form mapping, clinical assessment, profile import, model call, immutable submitted version or linked follow-up is implemented here.

Run the [local account tests](../../../database/local-development.md) for real HTTP ownership, revisions, exact-text persistence and restart checks. The [browser fixture](../../../tests/README.md) independently tests UI success/failure using page-memory callbacks; it is not a database test.
