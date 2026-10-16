# APIP developer design reference

The running shell is Sailesh and the development team's Material 3 component library, not the product application. It exposes Domain Components, Core Components, Design Tokens, and appearance settings. Prototype patient/report/records files are retained outside the mounted shell. Developer sign-in and route/server authorization remain pending; a developer label does not restrict access.

## Colour and appearance

- `tokens.ts` defines all shared semantic colour roles. Light mode defaults to pure white backgrounds/surfaces, neutral grey container levels, and blue highlights. `getColorScheme` supplies blue, black, or green accents in both light and dark modes. These are curated palettes using Material roles; no HCT generation or full accessibility certification is claimed.
- `appearance.ts` validates the selected accent/mode, applies the shared CSS properties, and saves `apip.appearance.v1`. Invalid or unavailable browser storage falls back safely; controls still apply for the current visit.
- `main.tsx` applies the saved/default scheme before mounting React. `App.tsx` owns later appearance changes. `index.css` contains typography/shape/surface rules, not a duplicate colour palette.
- `AppearanceSettings.tsx` uses existing official Material Web select, switch, and button wrappers. It is an inline settings region, not a modal; Escape/Close returns focus to the header settings button.
- The token inspector reads the same selected scheme as the rendered components. Error roles remain semantic and do not change with decorative accents.

Preferences are per browser and contain only appearance choices. They are not account settings or an access-control boundary. Dark mode is optional; a fresh browser opens in white/blue light mode.

## Components and verification

Use `material-web-imports.ts` for official element registration and `components/material/core` for existing React wrappers. For custom-element boolean attributes, omit false values (`undefined`) rather than serializing `false`, which still makes a boolean attribute present. Cards and other compositions use existing specification-based wrappers where Material Web has no matching component.

Keep white surfaces, visible keyboard focus, accessible control labels, narrow-screen wrapping, light/dark contrast, and reduced motion intact. Run the frontend lint/build scripts for changes; browser checks and limitations belong in dated history. Preserve the full showcase as a reference rather than connecting its illustrative clinical examples to live product actions.
