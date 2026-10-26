# Emergency recognition audit — before implementation, 2026-10-26

Base: current main `5085a26579bab3bbf994d8b5f62f363b6b310df4`, including required merge `092dd4b100d2ff1337e9f7e85e70ad92c3a341b5`. The later README formatting commit is preserved. Work uses the existing clean managed worktree on `codex/medassist-emergency-recognition`; the original workspace and sixteen contributor files remain untouched.

## Confirmed causes

The v1 JSON contains only explicit emergency-request phrases and literal cannot-breathe phrases. Neither heart-attack nor stroke declarations exist. Both TypeScript and Python simply substring-match normalized text against that shared list. This directly explains the documented two misses; no model output, threshold or question ranking is involved.

The guard has no own clause-level assertion, subject, temporality or hypothetical interpretation. Negation around an included phrase, remote history, quoted/educational mentions and mixed-subject statements can therefore be mishandled. The broader extraction context module is deliberately conservative about suspected conditions/other people and must not be reused as emergency clearance: a third-party or suspected emergency still needs independent attention.

Precedence already exists: browser safety checks precede availability/in-flight gates; recognized emergencies latch, advance the generation, abort pending work and prevent routine rendering. Server extraction checks run before providers; Python orchestration checks before language availability. Navigation is a separate location-consent Maps handoff. Missing coverage is the primary defect; this task must verify these existing guards with new categories and delayed/conflicting responses rather than redesign the interface.

## Approved engineering scope and review boundary

The user selected proceeding with source-backed **provisional** rules. No clinician-approved APIP rule set or human sign-off was supplied. Official NHS, St John Ambulance/Resuscitation Council and India ERSS material can support reviewable category definitions and generic emergency-service wording; their clinical publication review does not approve this software matcher, population coverage, translations or action boundaries. All added rules stay provisional/unreviewed and fictional-demo-only; clinical review is a blocker.

Target categories: explicit emergency requests; current/suspected cardiac and stroke declarations plus source-supported warning patterns; severe respiratory difficulty; unresponsiveness; severe/uncontrolled bleeding; explicit suspected anaphylaxis/airway swelling. No diagnosis, medication, treatment/first-aid procedure, Model B urgency score, clinical threshold or facility suitability will be generated. Unknown/ambiguous emergency context must interrupt for safety clarification rather than silently become safe. Current third-party emergencies must interrupt without entering the user's Model A evidence.

## Planned state boundary

Use a separately versioned deterministic result with escalate / clarify / not_assessed, subject, assertion and temporality annotations. Negated, remote-historical and explicitly hypothetical statements are not positive current evidence; no result is medical clearance. Suspected current emergencies count as escalation, not confirmed diagnosis. Clear emergencies remain latched until an explicit fictional-session restart; repeats, corrections and stale provider replies cannot automatically clear them. Ambiguous context blocks ordinary inference until explicit clarification or emergency help.

The independent evaluation protocol is frozen separately before implementation. Final cases must be separately authored and withheld from implementation tuning where authorized. If independent authorship is unavailable, report that limitation and keep the independent-validation gate incomplete. No frozen Model A file, evidence handoff, Model B, Groq configuration or original research receipt is within the implementation scope.
