# Welcome and sign-in interface preview

This is the selected rough UI task, ahead of authentication. It provides a simple APIP welcome page and one shared sign-in composition with three workspace views. It does not access an account, submit credentials, create a session, or establish permissions.

## Navigation and behaviour

- `#/` opens the welcome page. Header **Log in** and main **Sign in to APIP** buttons open the patient sign-in view.
- `#/patient/home` opens the patient home interface preview. The patient sign-in preview links directly to it without simulating an authenticated account.
- `#/preview/adr-report` opens the fictional ADR intake design preview. The patient sign-in screen exposes this route only when ADR reporting was selected, and labels the link as a preview. This is a UI route, not a session or access boundary.
- Access-preview routes keep an in-app browser-history trail. The shared Back control returns to the previous in-app screen; when a route is opened directly, it uses a safe parent fallback rather than leaving the app. The ADR editor adds a return-to-drafts action when a list is available, confirms before discarding unsaved edits, and returns from review to the detail step.
- Patient task actions route to `#/sign-in/patient?continue=medassist` or `#/sign-in/patient?continue=adr-report`, and the sign-in preview explains the requested destination. The current build has no account/session state: this navigation is only a UI demonstration, does not verify a person, and cannot conditionally grant access. A future auth integration must enforce the guard server-side and resume only an authorized destination.
- `#/sign-in/patient`, `#/sign-in/specialist`, and `#/sign-in/developer` select the shared sign-in layout and audience-specific wording.
- `#/developer-reference` explicitly previews the preserved component library. The developer sign-in view links to it as a preview. This route is currently unrestricted and is not a sign-in bypass to a protected system.
- `App.tsx` listens for hash changes, applies appearance, and sets the page title. Unknown hashes return to the welcome view. Browser Back/Forward and direct hash refresh remain usable.
- `AccessPreview.tsx` uses the existing official Material Web field/button/checkbox wrappers and official tabs. Local form feedback checks that the email resembles an address and that a sample password is present. Submission prevents navigation, sends no request, clears the password state, and states that authentication is pending.
- Credential fields live only in the form component's memory, with autocomplete discouraged. They are not logged, persisted, or shared by APIP. Use fictional values only. Browser-managed autofill remains a browser behaviour; the prototype is not a password manager.
- Selecting a different workspace remounts the form. The selected workspace is an interface intent, never an authorization claim. The future server must determine roles from an authenticated account and enforce object/action access.

## Design decisions and primary references

Research checked 2026-10-17. Read relevant official guidance rather than claiming an exhaustive audit of the entire Material website:

- [Material 3 typography](https://m3.material.io/styles/typography/overview) and [applying type](https://m3.material.io/styles/typography/applying-type): a readable hierarchy, separate display/headline/body/label roles, and selective emphasis. The current M3 site lists baseline plus emphasized typography and notes Expressive web support gaps.
- [Adaptive layout guidance](https://m3.material.io/foundations/layout/canonical-examples/overview): layouts respond to available space. This composition uses 24 px compact margins, a single column below 840 CSS px, and a two-column sign-in surface on wider screens. These are application choices, not a claim to reproduce Pixel hardware pixel density.
- [Motion](https://m3.material.io/styles/motion/overview/how-it-works): brief, purposeful transitions support orientation. This preview uses a 240–280 ms opacity/8 px entrance and disables it for reduced motion. It does not claim to implement the full M3 Expressive spring system.
- [Material Web source](https://github.com/material-components/material-web), [text fields](https://material-web.dev/components/text-field/), [buttons](https://material-web.dev/components/button/), and [typography theming](https://github.com/material-components/material-web/blob/main/docs/theming/typography.md): retain the installed official components and token-based theming. The upstream library reports maintenance mode; it is not silently replaced by another design system.
- [Google Sans Flex author repository](https://github.com/googlefonts/googlesans-flex) and [Google Design's typeface article](https://design.google/library/google-sans-flex-font): use self-hosted static 400/500/600/700 cuts with Roboto/system fallback. See [font provenance and notices](../../../public/fonts/README.md). The APIP mark/name remain distinct; no Google affiliation is implied.

The sign-in heading is 36/44 px (32/40 compact); body inputs use the Material 16 px role, supporting copy uses 12–14 px, and the primary action has a 48 px container. White surfaces, neutral outlines, 28 px large corners, 12 px text-field corners, and the selected Google-inspired blue/red/yellow/green primary highlight roles come from the existing theme. The slight header translucency leaves fields on opaque, readable surfaces.

## Patient home preview

The patient home puts MedAssist AI and direct ADR reporting side by side on wide screens, then stacks them on phones. It explains each intended purpose, keeps the suspected-reaction report available without MedAssist, and uses distinct actions with a shared heading style. The header identifies this as a preview and provides appearance settings plus a centered Help dialog explaining the two paths. Task actions demonstrate the intended sign-in destination and retain the requested task in the route; the page states that sign-in cannot currently unlock access. Neither action starts a model conversation, accepts case details, nor sends data. The explicitly labelled ADR design preview is reachable from the patient sign-in screen after selecting the report task. It reuses the fictional browser-local draft form and supports multiple drafts shared within the browser profile; do not enter real patient information. No protected patient session exists.

`access.css` defines the page composition; it does not duplicate the shared colour palette. Shared settings work on these pages and the developer reference. The first UI copy is English; reviewed Telugu account wording is not implemented by this task.

On access pages, appearance controls replace the header actions within its existing 80 px height (72 px on phones); they never insert a panel above main content. Official Material Web toggle icon buttons select Google's familiar blue/red/yellow/green highlights or dark mode, expose pressed states, and share existing browser preferences. Dark mode uses lifted charcoal surfaces similar to Chrome's dark theme. On phones, controls temporarily replace the brand to fit the same row. Opening focuses the selected colour; Close or Escape restores focus to settings. A 200 ms horizontal fade honours reduced motion. The developer component reference retains its expanded explanatory settings panel.

Tailwind preflight overrides Material Web custom-element host padding. The access button rule restores the installed official button's calculated block and leading/trailing spacing using its internal CSS variables; Help also uses Material's 12 px leading-icon inset and 16 px trailing inset. Check this integration when updating Material Web. This prevents labels from touching capsule edges without replacing the official control.

## Remaining work

Authentication provider/session handling, recovery/account creation, verified specialist/developer roles, clinical consent, actual patient/reviewer pages, and backend/model connections remain separate selected tasks. Never turn a UI role switch into server authorization. Record browser/device/error checks and limits in dated history before claiming readiness.
