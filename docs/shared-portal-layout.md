# Shared portal layout

All Patient and Specialist pages must place Back navigation in a full-width row directly beneath the shared APIP header. The Back button aligns with the viewport's left page gutter beneath the APIP logo. Main page content must be positioned independently in its own centered responsive container. Back navigation must never shift or constrain the page body.

AccessPreview provides access-back-navigation before the centered access-page-shell. PageNavigation portals its existing Material button into that shared outlet, including when invoked from a nested ADR/MedAssist navigation slot. The portal preserves React ownership and existing guarded callbacks. Do not place the outlet inside a max-width container or add negative margins, transforms or side columns. Keep the existing 24px desktop/16px mobile gutter and 24px navigation-to-content spacing. Landing/authentication retain their existing Back visibility rules.

Read-only acceptance script: scripts/back-navigation-hosted.browser.mjs. Its companion checks measure the viewport-relative Back row, independent shell centering, duplicate navigation and overflow at 320/375/768/1440px. Only finite animations are awaited; repeating ADR highlights must never stall acceptance. Exact hosted route outcomes must be reported from execution, not inferred from this guideline.
