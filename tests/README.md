# Browser regression fixtures

With the development server running, open `/tests/profile-controls.html`. This isolated fixture contains no account client, passwords or patient records and is not part of the production build entry.

The profile-control regression starts in Loading. Toggle to Ready: the previous native-disabled-fieldset example reproduces Material Web's stuck disabled state; the explicit-control example becomes editable. Enter fictional text and check its checkbox; the output must show those exact values. Toggle Loading → Ready again: the fixed controls must disable/re-enable and preserve text/check state. The previous example is retained intentionally to make the original failure reproducible.

The profile page keeps fieldset grouping/legends and uses `aria-disabled` on groups, while passing `disabled` explicitly to each official Material text field and checkbox. Server authorization remains unchanged. This fixture supports browser verification; it is not a substitute for account/API tests.

## ADR account UI fixture

Open `/tests/adr-drafts.html` to exercise the actual ADR editor with asynchronous page-memory persistence callbacks. It has no authentication client or database connection and starts empty after reload. Save an unfinished draft, enter fictional text, use **Fail next save** and verify edits survive the error. Retry, review, confirm, open the list and reopen the draft. Unknown fields must remain unknown; confirmed drafts must remain distinct from professional review. The real HTTP tests in `scripts/local-account.test.ts` separately verify database ownership, persistence, revisions and migration.
