# Phase 3C-B — Copy-ready policy-gated handoff

3C-A is implemented; [delivery and evidence](3c-a-implementation-and-verification.md). This prompt prepares the next separately authorized substage. It is not approval to enable patient sharing.

```text
Continue APIP from the reviewed, verified final commit on
codex/adr-phase3c-specialist-experience. Verify remote SHA, clean/dirty status
and ancestry from 672bca78645e674bba1eaf9376d0f43e5e4e02f5. Preserve all
unpublished changes, existing worktrees, SQLite databases, runtime secrets,
the hosted preview on port 3301, MedAssist and draft PRs 6/7/8 plus the 3C-A PR.
Use an isolated codex/adr-phase3c-consented-sharing branch. Do not merge.

Read AGENTS.md, product/architecture/layer guides, the canonical ADR master
blueprint, 3A/3B and hosted administrator gate reports, 3C-A delivery,
roles-consent-and-revisions, requirements/decisions and acceptance matrix.
Inspect the actual Supabase Auth, restricted-writer repositories, private
identity functions, immutable ADR revisions and original-PDF contracts.
Reuse them. Do not replay migrations or bootstrap another administrator.

First produce an approval-ready policy sheet; do not enable sharing writes yet.
Resolve these decisions explicitly with the owner:
1. Recipient selection and the exact minimum specialist-directory disclosure;
   do not publish private professional applications or create a global case queue.
2. Exact patient data/revision/PDF fields disclosed, consent language and whether
   export is permitted. A saved draft is never consent by itself.
3. Withdrawal timing, in-flight request/PDF delivery checks and the limitation
   that already delivered copies cannot be technically recalled.
4. Assignment cardinality, who may reassign, fresh recipient-specific consent,
   specialist refusal, self-review/conflict prohibitions and administrator scope.
5. Retention, audit retention, archive/delete requests and handling previously
   shared revisions. Do not assume existing DELETE permission or permanent erasure.
6. Future professional-note visibility, clarification, finalization and patient
   access policies. Defer writing those records to separately authorized 3C-C/D.
Map decisions to the canonical P04–P16 gates and record exact approved scope.
Do not infer approval from the Phase 3B administrator bootstrap or 3C-A UI task.

After separate policy and implementation authorization, implement 3C-B only:
Patient selects an immutable saved ADR revision and approved recipient, reviews
the precise disclosure, explicitly consents, and creates an auditable bounded
assignment. New patient revisions remain private until separately shared.
Connect the existing Pending Review Reports card to a genuinely authorized
inbox and real scoped counts only once the backend contract exists. Keep the
3C-A three-card dashboard/profile, Material 3 glass header and responsive design.
Do not implement the 60/40 professional review editor, notes, causality,
clarification workflow or final decisions ahead of authorized 3C-C/D scope.

Design narrow consent, submission, exact-revision grants, assignment and audit
contracts with ownership foreign keys, expected versions, transactional commands
and idempotency. Derive principal only from verified Auth. Every read/mutation
must enforce current unexpired specialist authorization AND active consent AND
assignment AND exact revision grant. Identity administrators gain no medical
access from their role. Retain raw ADR owner RLS; do not grant specialists global
table reads. Reserved AMC/NCC fields and patient answers remain unchanged.

Create additive migrations with realistic non-superuser managed-Auth fixtures.
Retain the verified transaction-local subject helper; do not assume the migration
operator can grant managed Auth-schema privileges. Test fresh and populated
upgrades, PUBLIC/anon/authenticated SQL execution denial, least-privilege RPCs,
safe search_path and ownership, rollback, concurrent changes, retries and audit.
Request separate exact-SQL/checksum/target approval before any hosted apply.

Use two synthetic patients and two separately approved synthetic specialists.
Test private drafts, cross-owner/nested IDs, unassigned and unshared revisions,
revoked/pending/expired identities, future edits, withdrawal/reassignment races,
failed audit writes and reused pooled connections. Export tests apply only if
explicitly approved; reuse the original PvPI template and exact shared revision,
rechecking grants before delivering bytes. No real patient records.

Use focused tests first and full affected regression once stable. Reuse unchanged
JWT-expiry, PDF fidelity and backend evidence rather than rerunning long waits.
Run frontend/server TypeScript and build for code changes. Verify real Chrome
at 320/360/820/1440px, keyboard, light/dark, reduced motion, account switching,
save/resume and direct protected URLs. Clearly separate hosted and disposable
results. Leave an actually verified laptop-only preview and capture real images.

Document exact policies, routes, schema/API, actor/action/resource matrix,
audit/withdrawal semantics, tests, screenshots, limitations and file walkthrough.
Follow the explicit-file Git completion workflow; commit/push only validated
authorized changes and open a separate draft PR against the reviewed baseline.
Report exact local/remote SHA and keep every PR unmerged. Stop before 3C-C/D.
No RAG, analytics, agents, autonomous clinical decisions, drug recommendations,
Google OAuth changes, MedAssist changes, public deployment or paid services.
```
