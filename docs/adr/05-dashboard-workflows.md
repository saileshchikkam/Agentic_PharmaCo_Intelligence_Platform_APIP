# Proposed ADR dashboard and review workflows

Status: design only. Reuse [Material Web registration](../../src/design-system/material-web-imports.ts), [core wrappers](../../src/components/material/core/index.ts), [domain components](../../src/components/material/domain/index.ts), account state and existing appearance/navigation patterns. Preserve the developer reference. This is the ADR workspace specification, not an implementation or mockup promoted to clinical behavior.

## Navigation and screen inventory

Proposed hash routes (route names do not grant access): `#/adr` overview, `#/adr/new`, `#/adr/cases`, `#/adr/cases/:id` with section tabs, and `#/adr/review` for explicitly assigned reviewer cases. Existing `#/preview/adr-report` remains the legacy fictional draft route until a verified compatibility transition. A visible “Fictional academic prototype” notice and current account appear throughout. Direct ADR reporting is available without MedAssist.

1. **Overview:** New report action, own/assigned cohort switch only when authorized, counts by status, cases needing missing information, recent drafts and explicit data period/denominator. No mock signal graph or compliance badge.
2. **New report:** explain fictional-only boundary, language selection, exact narrative, suspect medicines and events; guided short sections with unknown/not-asked controls. Save unfinished work without AI. Fictional reporter/recipient aliases avoid real identity entry. Existing account/profile sharing does not auto-copy a profile.
3. **Case list:** status/date/medicine/event filters, paginated results, empty/loading/error/retry views, saved version and timestamp. Archive is explicit and reversible. No fake live records mixed with saved cases.
4. **Case detail:** header with ID/status/version, save state and role-appropriate actions. Tabs/sections for original statements, structured facts, proposals, validation, sources, executions, review and export. Show historic versions read-only with a prominent historical/stale label.
5. **Extraction:** original quote alongside proposed path/value, source highlight and uncertainty. Accept/edit/reject are explicit owner actions, never preselected bulk confirmation. Changes show provenance and require save. Unsupported-language or unavailable provider shows manual continuation.
6. **Validation:** rule-keyed findings with field links, blockers vs missingness warnings, current content version/rule-set identity and a retry action. “Not checked” differs from “no findings.” Do not display regulatory-compliant/clinical-valid labels.
7. **Sources:** publisher/title/version/jurisdiction, relevant exact passage/section, source link and approval status. Distinguish no match, unavailable corpus, fixture-only source and withdrawn/stale evidence. General label information is separate from the reported event.
8. **Executions:** stage, queued/running/completed/manual-required/failed/stale status, attempt/time and retry/cancel when eligible. Operator diagnostics are collapsed and redacted. No spinner implying success or clinical analysis while the job failed.
9. **Review:** owner confirms fields and requests review; assigned reviewer compares original/confirmed values, missingness and reference passages, then comments, requests changes or approves the academic draft. Reviewer corrections are requests, not silent rewrites. Audit timeline attributes every action. Self-approval unavailable. Human clinical sign-off is outside the MVP.
10. **Export:** choose JSON or printable report, content version, draft/review status and included evidence/provenance. Preview before download. Drafts are labeled unreviewed; reviewed exports identify the exact academic review. No send/submission action. Browser Save as PDF is optional; native PDF generation is stretch.

## State and failure behavior

- Save failure retains text/field edits and offers retry; stale revision explains conflict and permits reload/compare without replacing unsaved work. Never offer a blind overwrite.
- New content clears current artifact/review applicability, preserving historical evidence. Returning to an older tab must not accept stale proposals.
- Account change/logout clears in-memory case data, cancels pending requests and stops late-response rendering; account consistency checks remain server-enforced.
- Provider timeout/invalid output preserves the original narrative and manual workflow. No invented extraction or fallback to legacy causality/RAG endpoints.
- No citations is a valid visible result; review/export acknowledges evidence limitations. A missing corpus must not be shown as a clinical search with no known ADRs.
- User confirmation, academic reviewer approval and clinical assessment have different labels and record types.
- Navigation preserves the existing unsaved-change guard. Cross-tab edit conflicts use revision checks, never last-write-wins.

## Material 3 and accessibility

Use official Material Web text fields, buttons, select, checkbox/radio, dialogs, chips, lists, tabs and progress where available. Follow [Material 3 component guidance](https://m3.material.io/components) and [Material Web](https://github.com/material-components/material-web). Do not silently replace the design system. Reuse current white/blue surface/token family and optional charcoal dark appearance; existing color preferences remain available.

For gaps such as responsive case table, navigation rail and split review layout, use semantic HTML with repository tokens and document the relevant Material 3 specification, spacing/states and keyboard behavior in a future ADR UI README. Check whether an official component exists before implementing a gap. This page does not claim component conformance from visual resemblance alone.

At phone widths (~360 px), use one column, stacked case rows, section navigation and full-width primary actions; avoid horizontal page scrolling. At tablet (~820 px), use adaptive navigation and two-column nonnarrative form groups only where readable. At desktop (~1440 px), show source/proposal comparison beside the case; keep prose width controlled. Verify 320 px as an additional overflow stress case. Language labels and Telugu combining glyphs must remain legible without truncating original statements.

Every control has an accessible name, field errors are associated with inputs, focus moves to the first invalid field on failed submit and returns after dialogs, status changes use restrained live regions, and all workflow actions work by keyboard. Dialogs trap focus and support escape where safe. Status has text beyond color. Respect reduced motion, contrast and zoom; no animated diagnostic panels in the normal reporting flow.

## Deterministic dashboard definitions

All queries use authorized current cases, excluding archived cases by default. Filter `created_at >= from AND created_at < to`, return UTC interval, computed-at and scope. A follow-up feature is out of MVP; no unimplemented deduplication is assumed. Imported legacy receipt creates one case; duplicate import cannot inflate totals. Historical versions are never counted as extra cases.

- Cohort count: distinct authorized case IDs in filter; by-status sums to this count.
- Reviewed count: cases with applicable `approve_academic` decision on current content version; historic approvals do not count after edits.
- Missing-fields count: cases with current validation identifying at least one missing required/applicable checklist field; cases not yet checked are a separate `not_checked` label, not presumed complete.
- Top reported medicines: distinct case count per normalized **confirmed provided** medicine label, denominator all cohort cases. Normalize only whitespace/case for aggregation while preserving raw text; do not conflate active ingredients, combinations or brand names. Multiple medicines can make summed category counts exceed cohort size; disclose that explicitly.
- Completion proportion: `providedRequired / requiredApplicable` on a specified current checklist. A reported unknown is collected but not provided; not-applicable fields excluded only if rule-set permits. Return numerator/denominator and null when denominator is zero. No LLM completeness score.

Numbers are descriptive **report counts/proportions**, not exposed-population incidence, drug risk or proof of causality. No PRR/ROR, random confidence interval, urgency score, disease map or safety signal. Show unassessed/unknown data rather than negative conclusions. SQL fixtures independently reconcile zero-case, unknown, multiple-medication, version-change, archive and cross-owner cases.

## Review and demonstration acceptance

Required demonstrations: exact create/save/restart/reload; multi-medication/event editing; proposal accept/edit/reject provenance; missing/contradictory input; approved-source or clearly scoped fixture retrieval; citation resolution; provider outage/manual continuation; reviewer role+grant and self-review denial; correction/reapproval versioning; faithful JSON/print export; counts matching fixtures; account switching; 360/820/1440 keyboard/reduced-motion layouts. Engineering checks are AI-assisted, with results recorded separately from Mahesh's pending clinical wording/source review.
