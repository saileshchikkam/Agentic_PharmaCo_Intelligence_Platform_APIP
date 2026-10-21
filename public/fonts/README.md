# Self-hosted Google Sans Flex

The sign-in/welcome preview uses four unmodified static TrueType cuts (400, 500, 600, 700) obtained from the official Google Fonts CSS service on 2026-10-17. Self-hosting avoids depending on an external font stylesheet at runtime for this typeface. Existing Roboto/Material Symbols resources remain separate.

- [Author project](https://github.com/googlefonts/googlesans-flex).
- [Google Fonts distribution and licence](https://github.com/google/fonts/tree/main/ofl/googlesansflex).
- [SIL Open Font License and copyright notice](GoogleSansFlex-OFL.txt) and [trademark notice](GoogleSansFlex-TRADEMARKS.txt) are redistributed with the font files; notice wording is preserved with trailing whitespace normalized.
- [sources.json](sources.json) records each exact provider URL, size, weight, and SHA-256 digest. The provider URLs use the `v23` distribution path.

The original Google Fonts query was `https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400..700&display=swap`; the service supplied the static cuts for the requested user-agent. APIP's access CSS registers these local cuts with `font-display: swap`. No font was modified or relicensed, and no Google affiliation or sponsorship is claimed. Preserve these notices when redistributing the files.
