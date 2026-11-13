# Shared portal layout

All Patient and Specialist pages must place Back navigation in a full-width row directly beneath the shared APIP header. The Back button aligns with the viewport's left page gutter beneath the APIP logo. Main page content must be positioned independently in its own centered responsive container. Back navigation must never shift or constrain the page body.

AccessPreview provides access-back-navigation before the centered access-page-shell. PageNavigation portals its existing Material button into that shared outlet, including when invoked from a nested ADR/MedAssist navigation slot. The portal preserves React ownership and existing guarded callbacks. Do not place the outlet inside a max-width container or add negative margins, transforms or side columns. Keep the existing 24px desktop/16px mobile gutter and 24px navigation-to-content spacing. Landing/authentication retain their existing Back visibility rules.

Read-only acceptance script: scripts/back-navigation-hosted.browser.mjs. Its companion checks measure the viewport-relative Back row, independent shell centering, duplicate navigation and overflow at 320/375/768/1440px. Only finite animations are awaited; repeating ADR highlights must never stall acceptance. Exact hosted route outcomes must be reported from execution, not inferred from this guideline.

## Global research disclaimer ticker

ResearchDisclaimerTicker is mounted once after PreviewHeader, outside centered content. Its single RESEARCH_DISCLAIMER constant owns the exact approved wording. A measured 45px/s text track travels from bar width to minus text width (right to left); the stationary sticky red bar is 20px high. Hover/focus pauses it. Reduced motion disables travel and exposes a horizontally scrollable full text; static accessible text is never duplicated to screen readers. General footer disclaimer paragraphs are removed; retain form consent and feature-specific safety warnings.

## Shared header brand and document scrolling

The header alone uses HeaderBrandText. It holds APIP for 2.5 seconds, reveals the full name one character every 85ms, holds for 4.5 seconds and repeats. Its fixed desktop text area prevents control movement. Below 1200px and for reduced motion, use compact text. The home link has a stable full-name accessible label; animated characters are hidden from assistive announcements. Media listeners and timers are cleaned up. Independent Brand instances remain static.

Hide only the document scrollbar when APIP is mounted; never disable document overflow or hide component/dialog scrollbars. Header left padding uses the shared gutter. Keep ticker, Back outlet and independent content shell unchanged.
