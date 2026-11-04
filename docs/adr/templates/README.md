# Official PvPI template

The PDF is a local prerequisite. Place your authorized, unmodified PvPI Version 1.4 copy at `docs/adr/templates/ADRRF_2.pdf` before exporting or running the PDF checks. Git excludes this copy because redistribution permission for the exact supplied file was not established.

`ADRRF_2.pdf` is the original user-supplied PvPI Version 1.4 form, copied without modification. SHA-256: `40af4962d6dd65ce538ff4791805b0632085159623c5a4beeb755442f6c0ed0b`. It contains two pages; the second is reporting instructions. It is not a reconstruction or a claim that this supplied version is the latest regulatory form.

[Complete widget inventory](widget-inventory.json) records all 147 original page-1 widgets: name, PDF type, page, original PDF-coordinate bounding box, visible-label correspondence, schema path, disposition, allowed states and multiline flag. Coordinates use a bottom-left origin in points. Schema paths describe zero-based rows within medication kind; actual values are stored under `values[med.<id>.<field>]`. Page 2 has no widgets. Inventory generation verifies that AcroForm references and page widget references match.

The 127 text fields, 19 checkboxes and one image pushbutton must not be inferred from their generic names. [Mapping and generator](../../../server/adr/pdf_form.py) are authoritative. The inventory can be reproduced with `python server/adr/pdf_form.py --inventory`.

Output keeps original page content streams, page geometry and editable native fields. It replaces shared text appearances with independent appearances. The source's oversized/off-center checkbox rectangles are aligned with the existing printed squares, with transparent Off and black-X Yes appearances. Original text field geometry is unchanged. The receiving-signature image button is retained, hidden and never populated. The source file itself is unchanged.

See [checkpoint](../09-adr-1a-checkpoint.md) for coverage, unfilled fields, runtime setup and fidelity results. No source-document instructions authorize automated signatures, clinical assessments, submission or sharing.
