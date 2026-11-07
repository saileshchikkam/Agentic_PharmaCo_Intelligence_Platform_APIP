# Phase 3C — Copy-ready gated implementation prompt

This is a handoff, not an instruction to start Phase 3C. Phase 3B live administrator bootstrap and privileged hosted verification remain blocked. Read the [actual delivery](3b-implementation-and-verification.md) before using this prompt. Resolve the applicable consent, recipient, retention and review policies explicitly.

```text
Implement APIP ADR-1B Phase 3C only after I separately authorize the stage and
its unresolved access policies. Repository:
saileshchikkam/Agentic_PharmaCo_Intelligence_Platform_APIP.

Start from the reviewed final codex/adr-phase3b-specialist-identity branch,
verify its exact remote SHA and Phase 3A ancestry, and create an isolated
codex/adr-phase3c-authorized-review branch using the approved repository workflow.
Preserve draft PRs 6/7 and the Phase 3B PR; do not merge or publicly deploy.

First read AGENTS.md, docs/product.md, docs/architecture.md,
docs/architecture/ADR_PHASE3_MASTER_BLUEPRINT.md, all relevant docs/adr/phase3/
journey/contracts/requirements/acceptance files, 3a and 3b verification reports,
database hosted evidence, the actual Auth, specialist and ADR repositories,
original PDF generator and migration ledger.

Preflight gate: do not claim live specialist workflow readiness from fixture
approvals. Verify completion of separately approved exact administrator UUID
bootstrap and real hosted independent approval, current capabilities, expiry,
suspension/revocation and zero unassigned patient access. If still blocked,
finish only authorized preparation and report the exact gate. Never bootstrap
from email, workspace selection, user_metadata or a supplied role.

Before sharing implementation, obtain explicit decisions for P04/P05/P06/P07/
P09/P10/P14/P15/P16 and the 3C conflict/revocation requirements. Specify who
chooses the recipient; any queue's minimal disclosure; revision-specific consent;
withdrawal, reassignment and in-flight download linearization; professional note
visibility, clarification publication and finalization; retention and deletion
request behavior. Do not invent defaults that expose private drafts. Reuse the
approved identity-only administrator scope, four fictional categories, independent
approval, no self-approval, 30-day validity and per-request authorization checks.

Authorized scope once policy gates pass:
1. Patient explicitly authorizes one specific saved revision and approved
   recipient. Show the exact disclosed fields/revision before consent.
2. Patient can track the internal review status and exercise approved withdrawal
   or reassignment. New patient edits create private immutable revisions and
   never extend an existing grant automatically.
3. Specialist sees only approved, assigned, consented exact revisions. No global
   private-case queue, unassigned summaries or role-based raw ADR table reads.
4. Build the specialist workspace with guided human review on the left and the
   actual original PvPI v1.4 PDF on the right, responsive mobile preview access,
   current grant checks and stale-response protection. Professional notes,
   structured human decisions and requests for information remain separate
   from patient answers. Never silently fill reserved AMC/NCC fields.
5. Implement only policy-approved human state transitions, immutable finalization
   and audit. Internal APIP review is not government submission. No autonomous
   causality assessment, prescription or drug recommendation.

Reuse Supabase Auth, transaction-local verified subject, strict TLS/pooler,
restricted writer, immutable case revisions, current/historical PDF contracts,
Material 3 shell, glass header, themes, save/resume and safe account switching.
Do not widen existing owner ADR RLS. Add narrowly scoped revision-grant and
professional-record structures/functions only where required. Consent,
assignment, audit and idempotency must commit atomically with expected versions.
Recheck current approval AND active assignment AND consent AND exact revision
grant on each read/mutation/export and before delivering generated PDF bytes.

Prepare additive migrations with realistic non-superuser fresh/upgrade fixtures,
role ownership and PUBLIC/anon/authenticated EXECUTE denial checks. Obtain
separate approval for exact SQL checksum and named hosted project before apply.
Do not replay 20261107152504 or 20261107195900, reset data, change existing
applied history, use administrator connections for runtime or disable RLS/TLS.

Tests: two synthetic patients, two approved specialists, pending/rejected/revoked/
expired identities and an identity administrator. Test every action/resource
pair; self/conflicted review; nested-ID tampering; unshared/new revisions; direct
table and browser function denial; concurrent withdrawal/reassignment and PDF
delivery; failed audit rollback; stale commands and duplicate retries; bounded
pool identity cleanup; private-note access and finalization races. Reuse passed
unchanged backend gates rather than repeating natural token-expiry waits.

Run affected regressions, frontend/server TypeScript and production build.
Use real Chrome at 320/360/820/1440px: keyboard, light/dark, reduced motion,
patient consent through specialist review, clarification and withdrawal. Download
and independently reopen exact authorized original PDFs; deny other owners and
revoked grants. Clearly distinguish disposable/mocked tests from hosted tests.

Leave preserved local SQLite and hosted previews intact. Start a separate private
preview port if needed, verify health/readiness and give an actually working
loopback URL and backend mode; localhost is not a public preview. Credentials
are entered only through masked local prompts/browser, never in chat or logs.

Deliver exact file-by-file walkthrough, architecture/schema/API/state and
authorization documentation, approval register, test evidence, real screenshots,
remaining gates, precise commit/remote SHA and draft PR. Follow AGENTS.md's
explicit-file completion workflow to commit/push only validated authorized work.
Stop before 3D/new scope. Do not implement analytics, RAG, LLM follow-ups,
agents, Google OAuth changes, MedAssist changes, production deployment or merge.
```
