# ADR-1B Phase 1 — global UI foundation

2026-11-04. Branch `feat/adr-1b-ui-foundation` starts at verified `origin/main` commit `e2e33e0` (merged ADR-1A PR #5). The implementation is confined to the shared layout and guided reporting presentation.

- `src/features/access/PreviewLayout.tsx` keeps the header controls available when the appearance panel is open, measures the header for scroll clearance, and exposes the shared research footer.
- `src/features/access/access.css` implements a sticky translucent header with Material elevation, safe area padding, responsive wrapping, and a scrollable appearance panel. Native modal dialogs retain the browser top layer.
- `src/features/access/AccessPreview.tsx` and `src/DeveloperReference.tsx` reuse the footer. `src/features/medassist-conversation/conversation.css` leaves room below the header for the sticky assessment panel and shows the common footer.
- `src/components/material/core/M3Button.tsx` supports SVG leading icons in the existing Material Web slot. `M3TextField.tsx` and `src/index.css` set shared width and wrapping boundaries for field and icon hosts.
- `src/features/adr/guided/AdrLanding.tsx` presents the start action, four reporting steps, and saved cards using the existing case ID, timestamp and revision. It distinguishes loading, empty and failed lists. The process highlight can pause and resume and becomes static under reduced motion.
- `src/features/adr/guided/GuidedWorkspace.tsx` passes the existing start and resume commands to the landing. `guided.css` lays out the hero and cards, wraps the six stage controls at narrow widths, and separates question help from the input.
- `scripts/adr-guided.browser.mjs` verifies the changed UI and the established ADR workflow in Chrome with fictional accounts and a temporary SQLite database.

## Verification

- Frontend TypeScript, a strict backend TypeScript check from `server-entry.ts`, and the production build passed. The build reports a bundle over Vite’s 500 kB warning threshold.
- All 31 focused ADR, account, profile, legacy security, navigation and MedAssist tests passed.
- Chrome at 320, 360, 820 and 1440 CSS pixels passed sign-up, sign-in and sign-out, keyboard input and Back, draft save and resume, edit and regeneration. Browser checks also covered the sticky header, appearance settings, dialogs, theme changes, motion pause and resume, reduced motion and layout bounds. Zoom used 200% CSS scaling in headless Chrome.
- At each width, the initial and corrected downloads were reopened independently and checked for two pages, expected text and checkbox values, and blank restricted fields. The desktop run exercised the report reveal with Skip and with automatic completion.
- A separate Chrome smoke check verified the common header and footer on the developer reference and MedAssist conversation without an inference request.

Fictional-case screenshots show the empty landing at all four widths, a saved draft card and a narrow guided question.

## Preview and limits

Run the documented local development server and sign in at <http://localhost:3000/#/sign-in/patient>, then open **Start an ADR report** from the dashboard. A checkout needs the separately supplied [PvPI template](templates/README.md) and local Python PDF dependencies to export. The separate Model A research lab retains its own shell. The checked shared routes include the public site, account/dashboard, guided ADR, MedAssist and the developer reference. The browser's inline PDF support and the single seriousness category limit remain relevant to ADR-1A export. Phase 2 and specialist review require their own authorization.

## Phase 1.1 viewport corrections

- `src/features/access/PreviewLayout.tsx` renders the shared Back control only when there is a destination. Existing callbacks retain route history and leave guards.
- `src/features/access/access.css` places the compact 44px control directly below the header and reduces the shared page, Home and dashboard insets. `AccessPreview.tsx` uses a local SVG for the Home symbol to avoid overflow when the icon font is unavailable.
- `src/features/adr/guided/GuidedWorkspace.tsx` removes the redundant workspace heading. `guided.css` tightens the spacing around the stages, revision, question and answer.

Chrome passed at 320, 360, 820 and 1440 CSS pixels. The localhost smoke covered Home, sign-in, dashboard, profile and MedAssist with keyboard Back, footer and layout bounds checks. The ADR browser regression covered settings, theme, reduced motion, save and resume, edit and two-page PvPI export. The 1440 by 720 capture showed the short date question and its actions above the fold. All 31 focused tests, both TypeScript checks and the production build passed. Vite retains its bundle-size warning. Phase 2 requires separate authorization.
