# Emergency-recognition v2 evaluation evidence

**NO-GO.** This is a fictional English engineering evaluation, not clinical ground truth or clinician approval. Do not rerun the final heldout suite to tune this implementation.

- [Predefined protocol](protocol.json), [primary-author development cases](development.json) and [pre-implementation audit](../../docs/emergency-recognition-audit.md).
- [Heldout gold](heldout.json), [gold freeze](heldout-freeze.json), [implementation freeze](implementation-freeze.json) and [one-time results](heldout-final-results.json).
- [Independent evaluator report](independent-evaluation-report.md): all failures, category counts, subject annotations, dataset overlap and browser-harness limitations.
- [Raw results freeze](final-results-freeze.json), [final attestation](independent-final-attestation.json) and [public-runner import sanitation](public-runner-sanitization.json). Evaluated runner import path was removed for privacy after execution; hashes distinguish versions, with no rerun.
- [Independent integration specification](integration-scenarios.json) and [raw browser results](independent-integration-results.json). Typing is not submission, blocked resources are not successful network calls, and unobserved evidence mutation is not a passed assertion.
- [Historical development browser receipt](development-browser.json), [preservation receipt](preservation.json) and [milestone report](../../docs/emergency-recognition.md).
- [Exact final task inventory and verification](../../docs/emergency-recognition-verification.json).

The one-time runners refuse existing result/attempt files. Preserve them and the failed outcomes. A future repair requires new development cases, a newly frozen implementation and fresh independent evaluation; this directory does not authorize clinical release, Model B activation or any official Model A test.
