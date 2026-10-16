# Professional intelligence

**Status:** intended part of the ADR layer. Current professional-looking demo views do not establish a working review service.

## Review workspace

Provide a permissioned queue, case timeline, original/confirmed information, clarification requests, notes, review decisions, and attributable audit events. Professionals can record conclusions without silently rewriting the patient's original account.

## Evidence retrieval

Use an approved, versioned medical-source corpus with resolvable source passages. Record publisher, title, section/page, URL, date/version, permitted use, and review status. Conflicting or missing evidence must remain visible.

Keep medical-source retrieval separate from de-identified historical-case retrieval. Apply authorization before retrieval. Similar cases do not prove diagnosis or drug causality. New reports are not automatically approved knowledge or model-training inputs.

## Descriptive analytics

Use deterministic queries/statistical code for counts, reporting delays, completeness, case status, event/drug combinations, and time trends. Show the cohort, period, reviewed/unreviewed status, duplicate/follow-up rule, and denominator.

A statement about a proportion of submitted reports must not become a claim about all medicine users or a causal risk. Multi-drug/multi-event records and imported versus APIP-collected data need explicit counting rules. Generated narrative must reconcile to computed results.

Any disproportionality or causality support needs suitable data, documented methods, and expert review before use. Never expose random demonstration values as measured signals.

## Distribution

Hospitals, manufacturers, researchers, and reporting authorities have different permissions and receiving processes. Begin with reviewed, minimized summaries. Identifiable sharing, direct regulator submission, and public datasets require separately established authority, licensing, consent, and disclosure-risk controls. Pseudonyms alone do not make narratives anonymous.

## Acceptance evidence

- Access-controlled review and attributable changes.
- Citations support statements and lead to actual retrieved material.
- Dashboard values match independently checked fixtures.
- Denominators, missingness, and limits are visible.
- No unsupported regulatory acceptance, causality, incidence, or live-integration claims.
