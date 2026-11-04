# ADR-1A — guided intake and official PDF checkpoint

2026-11-04 correction: [Final PDF, guided UX and navigation report](10-adr-1a-final-corrections.md) supersedes the continuation and navigation behavior described in the historical checkpoint below.

2026-11-03. **A/B preserved; C implemented and verified for supported English fictional cases; D engineering checks pass within the limits below.** This checkpoint supersedes the earlier missing-template blocker, not the preserved intake/authentication architecture. No ADR-1B work, live inference, commits, pushes, merges or deployment occurred.

## Recovery and source fidelity

The existing dirty workspace contained completed guided intake, authenticated SQLite persistence and editable review. Recovery continued those files. The exact supplied [ADRRF_2.pdf](templates/ADRRF_2.pdf) is retained unchanged; no visually similar replacement was created. Source SHA-256: `40af4962d6dd65ce538ff4791805b0632085159623c5a4beeb755442f6c0ed0b`.

The two-page Version 1.4 document has **147 native widgets, all on page 1: 127 text fields, 19 checkboxes and one image pushbutton**. Page 2 has no widgets. The AcroForm field references match the page annotation references. [Complete machine-readable inventory](templates/widget-inventory.json) records every widget name/type/page/original bounding box, visible label, schema path, allowed values/states and multiline support. [Template notes](templates/README.md) explain coordinates and reproduction. Source-document instructions were treated as form content, not authorization to share, submit, sign or assess causality.

## Mapping and remaining unfilled fields

[Deterministic generator](../../server/adr/pdf_form.py) maps **132 widgets: 113 text fields and all 19 checkboxes**. It reads only provided values with a confirmation timestamp; explicit unknowns remain blank except the form's explicit unknown choices. Pending proposals and raw descriptions are not asserted as confirmed facts. Full confirmed records, including explicit unknown status, are included in the continuation.

- Patient initials, age/DOB and weight; initial/follow-up and gender; reaction dates, description/management, investigations, history, seriousness and outcome; reporter name, address, PIN, email, contact, occupation, report date and additional information are mapped.
- Four suspected-medication rows map name, manufacturer, batch, expiry, dose, route, frequency, start/stop and indication. Three concomitant rows map name, dose, route, frequency, start/stop and indication. Rows use stored order within medication kind; later rows are labelled on continuation pages.
- The action/rechallenge grid uses **text widgets**, not checkbox widgets. Exact confirmed category strings produce X marks. Free narratives remain in labelled continuation records without inferred category marks. Unknown action/rechallenge selects the corresponding unknown cell only when explicitly recorded as unknown.
- Dates are formatted dd/mm/yyyy. Text uses explicit 7-point appearances; date-only fields use 6 points to fit the narrow original cells. Measured width/height overflow becomes a numbered A-reference, with the entire value on a continuation page. Long text is never silently cut, and the full confirmed record remains available there.
- Multiple seriousness selections are preserved in the saved case, but export returns `PDF_SELECT_ONE_SERIOUSNESS` because the source says to tick one. No category is selected on the reporter's behalf.

**Fifteen widgets intentionally have no automatic population:** AMC report/registration/worldwide identifiers (`Text Field2/3/4`); four causality cells (`20/91/92/93`); reporter signature (`44`); receiving personnel (`47`); date of death (`48`, not separately collected); four reintroduced-dose cells (`30/82/83/84`, not separately collected); receiving-signature image button (`Image Field0`). There is no authorized-personnel workflow in ADR-1A, so AMC/NCC fields always remain blank. The existing registration input and signature-status text are retained only as reporter-provided continuation information. Rechallenge narrative is not parsed into a dose. No signature, date of death, causality or absent fact is invented.

## Native PDF method and appearance repair

Server-side Python uses pinned **pypdf 6.10.0** to clone/fill the supplied AcroForm and **ReportLab 4.4.9** only for appended continuation pages. Both original page content streams and page geometry remain intact; page 2 renders pixel-identically to the source. Native fields remain editable; they are not flattened. Continuations are static, clearly identified as APIP additions, and carry case ID/revision/page footers. APIP review is the primary correction source; editing a downloaded PDF does not update the saved case.

Visual inspection caught shared source appearance objects that caused different text fields to display the same content despite correct stored values. Each of the 127 text widgets now gets an independent appearance stream. Oversized/offset original checkbox annotations are aligned with the existing printed squares and receive explicit transparent Off/black-X Yes streams with matching `/V` and `/AS`. Original text rectangles are unchanged. The receiving-signature image button is retained and hidden to avoid an unwanted blank overlay; it is never filled. `NeedAppearances` is disabled so viewers need not reconstruct appearances. Template bytes are hash-checked before generation. The same confirmed snapshot produces identical PDF bytes.

The current PDF font path supports Windows-1252 characters, including English. **Telugu script and other unsupported characters return `PDF_UNSUPPORTED_SCRIPT` (422)**; the original saved text is preserved. Transliteration using supported characters works as literal text. No transliteration, translation or replacement glyph is silently substituted. This is a remaining bilingual-export gap, not a successful Telugu PDF result.

## Authenticated export and editable review

The existing `#/preview/adr-report` route remains in the same signed-in local-account shell. Its six guided stages, explicit confirmations, unknowns, medication additions, source statements, optional proposals, live structured draft and saved-case corrections are preserved. Legacy account/browser drafts remain separate; no automatic import or schema migration was introduced.

Existing `/api/account/adr-guided` endpoints still provide owner-scoped create/list/get/command/history. Additive SQLite `adr_guided_cases` and immutable `adr_guided_versions` keep transactional revisions. Commands are strictly allowlisted; 100 cases/owner, 500 revisions/case, 20 medicines, 12 proposals and 4,000-character narratives remain bounded. Existing same-origin, cookie, Host, body-size and account-header restrictions apply. Production local-account routes remain disabled. No hosted ADR storage or professional role workflow was added.

`POST /api/account/adr-guided/:id/pdf` accepts only `expectedRevision`. It loads the owner-scoped persisted snapshot, checks revision, generates in memory, then checks session/ownership and revision again before returning `application/pdf` with an attachment filename and revision header. Responses inherit no-store. Anonymous access is 401, another owner's case 404, account mismatch/stale revision 409. One active export is allowed; the subprocess has a 20-second timeout and 10 MiB output cap. No report files, patient narrative logs or LLM writes occur in the export service.

The review interface fetches real PDF bytes before preview/reveal. Download and separate-viewer links expose that exact PDF. Blob URLs are revoked on revision/account/unmount changes; pending fetches are aborted. Editing and reloading a saved case clears the old preview and regeneration uses the new revision. Missing fields remain visible in the review checklist; generation does not certify form completeness or submit anything.

## Reveal and accessibility

`ReportExport.tsx` and isolated CSS add a 1.6-second top-to-bottom clip/scan with a subtle medical cross. The actual native PDF viewer is preserved. Skip Animation is available immediately during reveal; download is available as soon as the bytes exist. Reduced-motion preferences suppress the effect and leave the viewer usable, including changes to that preference. Material Web action components, existing Material 3 tokens, semantic links, labelled iframe and status/error messages are used. The PDF reveal container is custom CSS because Material Web does not provide a PDF-viewer/reveal component. This is engineering accessibility checking, not an accessibility certification.

## Runtime setup and reproducible checks

Install the two pinned generation dependencies into a local Python environment:

```sh
python -m pip install -r server/adr/requirements-pdf.txt
```

Start the existing development server from the repository root. If needed, set server-only `APIP_PDF_PYTHON` to that environment's Python executable before `bun run dev`; otherwise `python` on PATH is used. Do not put machine paths or interpreter configuration into browser variables. A production build does not enable local authentication or clinical export. PDF tests additionally need `pypdfium2`; browser checks need Playwright and installed Chrome (`ADR_PLAYWRIGHT_MODULE` can select an installed module).

```sh
python scripts/adr-pdf.test.py
node --import tsx --test scripts/adr-guided.test.ts scripts/local-account.test.ts scripts/account-profile.test.ts scripts/legacy-security.test.ts scripts/preview-navigation.test.mjs
node --import tsx scripts/adr-guided.browser.mjs
bun run lint
node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --esModuleInterop --target ES2022 --module ESNext --moduleResolution bundler server-entry.ts server.ts scripts/adr-guided.test.ts
bun run build
```

Default provider remains disabled/manual. Optional existing local proposal configuration is unchanged: server-only `ADR_INTAKE_PROVIDER=ollama`, `ADR_INTAKE_MODEL` selects an already installed model; fixed loopback, 15-second timeout, bounded output/concurrency and explicit per-field acceptance remain enforced. No model was downloaded or invoked. Model availability, semantic extraction quality and human clinical wording review remain unverified.

## Actual verification results

- **4/4 Python test groups pass:** complete inventory; exact repeated medication cell values; reserved blanks; independent appearance streams; canonical field/widget values; native edit/reopen; byte determinism; explicit overflow; unknown and unconfirmed handling; revision correction; unsupported-script and multiple-seriousness rejection. All 19 checkbox selections have matching values/states and render differently from Off in PDFium. All 147 native fields remain present.
- **17/17 Node tests pass:** guided planner/provenance, real authenticated export/download headers, anonymous/cross-owner denial, stale revision/account mismatch, regeneration, durable restart, account/profile, legacy security and navigation regressions. Fixtures/temp databases only.
- **Chrome 360/820/1440 px checks pass:** open route, guided confirmations/unknowns, finish minimum checklist, live draft, generate, download and reopen with pypdf, assert reaction/medicine/checks/reserved blanks, edit/save/reload/regenerate, reduced motion, no horizontal overflow or page errors. Desktop also checks Skip and natural animation completion. An initial desktop test assertion incorrectly expected reduced motion after deliberately enabling motion; the assertion was corrected and all sizes rerun successfully.
- **Frontend TypeScript, strict backend/shared TypeScript and production build pass.** Existing main-bundle size warning remains. Local HTTP/browser tests required permission to bind a temporary loopback server; no external service was used.
- **Visual AI-assisted inspection:** source and filled government page, populated patient/reaction/medication/reporter sections, retained instructions, continuation/overflow pages and phone/desktop actual viewer screenshots. Source page content streams compare byte-for-byte; instruction page additionally compares pixel-for-pixel. The reproducible full fixture produces five pages (two source plus three continuation); the long-reaction fixture produces six. Test artifacts are ignored under `output/pdf/adr-fictional-*.pdf` and `tmp/pdfs/`.
- A strengthened overflow assertion initially counted 239/240 repeated phrases because extraction inserted a page footer between two parts of one phrase. Excluding footer lines before joining page text verifies all 240 instances (120 in the referenced overflow plus 120 in the complete record); all four PDF groups pass. Documentation verification resolves 197 local links across 13 affected documents, with balanced fences/single H1s and no source trailing whitespace; the saved inventory exactly matches the generator.

## Exact recovery file inventory

New recovery files: `server/adr/pdf_form.py`, `server/adr/pdf.ts`, `server/adr/requirements-pdf.txt`, `src/features/adr/guided/ReportExport.tsx`, `scripts/adr-pdf.test.py`, `docs/adr/templates/ADRRF_2.pdf`, `docs/adr/templates/widget-inventory.json`, `docs/adr/templates/README.md`.

Existing ADR-1A files extended: `server/adr/guided.ts`, `src/features/adr/guided/GuidedWorkspace.tsx`, `src/features/adr/guided/guided.css`, `scripts/adr-guided.test.ts`, `scripts/adr-guided.browser.mjs`.

Recovery documentation/configuration: `.gitignore`, `docs/adr/09-adr-1a-checkpoint.md`, `docs/adr/README.md`, `src/features/adr/guided/README.md`, `src/features/adr/README.md`, `README.md`, `docs/architecture.md`, `docs/development.md`, `docs/layers/adr-reporting.md`, `docs/roadmap.md`, `docs/decisions.md`, `CHANGELOG.md`, `docs/history/2026-11-03.md`.

Earlier ADR-1A changes already present on recovery, including `domain.ts`, `provider.ts`, `server/local-account.ts`, `src/features/access/AccessPreview.tsx`, `docs/README.md` and `docs/history/README.md`, were preserved. Pre-existing `app/`, root `requirements.txt`, ADR-0 planning and all MedAssist research/sealed Model A artifacts were not rewritten.

## Gate and remaining limits

**GO for the supported English fictional ADR-1A PDF/reveal engineering path. NO-GO for unconditional ADR-1B progression:** Telugu/mixed-script PDF export is not implemented; multiple reported seriousness categories need an explicit form-review resolution. Human pharmacy review of reporting wording/mapping remains outstanding. These limitations are not hidden by passing English software checks. ADR-1B was not started and needs a separate user-authorized scope/gate decision.

Existing limits remain: no professional authorization workflow, removal/reordering of medicine rows, queued provider jobs, full browser-history edit guarding, automatic recovery of unsubmitted description drafts, clinical inference qualification or real-data/public/regulatory operation. No clinical sign-off or production readiness is claimed.

## ADR-1B Phase 2 — original-form preview and intake progress

- During guided questions, the desktop workspace uses a 60/40 split at 1000 CSS pixels and above. At smaller widths the question comes first and the form opens on demand. PDF.js renders page one of the actual mapped PvPI Version 1.4 PDF; the separate viewer opens the full document, including instructions and any continuation pages. Review retains the existing editable export and reveal.
- Preview requests use the existing authenticated, owner-scoped PDF endpoint with the saved revision. Revision changes discard the previous preview, abort the client request, and revoke its object URL. A mismatched response revision is discarded. Missing templates, busy responses and rendering errors have visible fallback states.
- Intake progress counts saved Provided and Unknown answers against the active question plan. Optional questions are included. Adding a medicine increases the denominator by its applicable questions. Reopening a saved answer does not change the count until a different answer is saved, and resuming derives the same count from the saved case. Review has no intake questions. This count is separate from the minimum checklist and official report completeness.
- Shared Back uses the logo's left gutter and starts alongside the content, with no dedicated horizontal row. The guided question still offers its previous-question action.

Chrome passed at 320, 360, 820 and 1440 CSS pixels, including preview rendering, stale revision rejection and retry, keyboard, themes, reduced motion, long answers, save/resume, and regeneration. All eight two-page downloads were reopened; the regenerated desktop sample also had widget appearances checked and both pages rendered separately. All 32 focused tests passed, including owner and revision denial for the shared PDF endpoint. Frontend and backend TypeScript and the production build passed. The build retains its existing bundle warning; the PDF renderer and worker load on demand. Small inline previews can require the separate viewer for reading at full size. Phase 3 remains outside this milestone.
