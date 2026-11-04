# Guided ADR intake

See [ADR-1A checkpoint](../../../../docs/adr/09-adr-1a-checkpoint.md) for scope, routes, data/provenance, PDF runtime setup, checks and remaining export limits.

`domain.ts` is the shared provisional field registry, missingness/chronology validator and next-question planner. `GuidedWorkspace.tsx` contains the account-gated shell, adaptive controls, medicine additions, confirmation panel and editable structured preview. `guided.css` isolates responsive layout and reduced-motion behavior.

`ReportExport.tsx` requests an exact saved revision from the owner-checked server export endpoint and displays the returned PDF in the browser's native viewer. It provides download, separate-viewer access, regeneration and a short top-to-bottom reveal with Skip/reduced-motion support. Revision/account changes invalidate the old blob URL. Correction remains in the APIP review interface; PDF-only edits are not imported.

Official Material Web components are reused through the existing React wrappers. Stage navigation and responsive two-column composition use semantic HTML and existing Material tokens; a native labeled date input provides platform date picking because the installed wrapper has no date-picker component. The PDF container/reveal uses custom CSS because Material Web has no PDF viewer component. Reference: [Material Design 3](https://m3.material.io/components). This is not a claim of completed accessibility certification.
