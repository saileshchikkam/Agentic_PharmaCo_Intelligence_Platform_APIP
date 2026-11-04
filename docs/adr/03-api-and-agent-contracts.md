# Proposed API and agent contracts

Status: **design v1, not implemented**. Types below are normative shapes to implement with strict runtime schemas; TypeScript alone is insufficient. All endpoints are new and separate from legacy `/api/agents/*` and existing draft APIs.

## Authentication and common rules

Base: **`/api/account/adr`**. This deliberately fits the existing cookie `Path=/api/account`. Do not put ADR under `/api/adr` and assume the browser sends that cookie. ADR-1 must refactor a narrow server-only session verifier/policy interface from `local-account.ts`; do not expose session tokens, accept caller `userId`, widen cookie scope casually or duplicate password logic. Mount the ADR router before the account router's terminal 404, via one shared bootstrap owner. Proposed `APIP_ENABLE_ADR=1` explicitly enables the new router/worker in development only; default and all production requests return 404. This flag is not present in current code and must not weaken existing account/legacy restrictions.

Every request: verified current local session, trusted loopback Host/socket; mutation requires exact Origin, JSON and `X-APIP-Account` matching session. Reads also require the consistency header. Cookie/header are not role proof. SQL filters use owner or explicit active reviewer grant **and** server reviewer role. Nonexistent and unauthorized case/nested resource both return 404; authenticated prohibited actions on an otherwise visible case return 403. Operator role alone grants no case access. No role/owner fields accepted in ordinary payloads.

JSON bodies max 24 KiB; UTF-8 transport, narrative max 4,000 Unicode code points, short text max 200, review notes max 2,000, max 20 medicines/events, max 20 proposals and max 20 decisions/request. Unknown keys rejected at every boundary. Size is checked before model work. Dates validate precision and calendar validity. Do not trim the stored original text. Limit fields explicitly in runtime schemas. Present all current proposals in one decision batch; a content-changing partial decision makes remaining proposals stale and requires a fresh run.

Command POST/PATCH bodies include `expectedRevision` except creation; `Idempotency-Key` is required (8–128 safe ASCII characters). Canonical request hash includes method/route/body. Same actor/key/hash replays committed response; different hash returns 409 `IDEMPOTENCY_CONFLICT`. Pending duplicate returns 409 `OPERATION_PENDING` with Retry-After. Store response and domain/audit writes atomically. Replay repeats authorization and must never expose revoked resources. Retain keys 24 hours; after expiry, a new command must still satisfy revisions/business uniqueness. GET is side-effect-free, no idempotency key required. Export uses POST because it creates a receipt/audit.

## Shared domain types

```ts
type ID = string; // UUIDv4, server-issued except idempotency keys
type Missing<T> =
  | { state: 'provided'; value: T }
  | { state: 'unknown' | 'not_asked' | 'not_applicable'; value: null };
type Origin = {
  kind: 'manual' | 'accepted_proposal' | 'edited_proposal' | 'confirmed_import';
  statementId: ID | null; executionId: ID | null; proposalId: ID | null;
};
type DraftField<T> = Missing<T> & { confirmed: boolean; origin: Origin | null };
type ReportedDate = {
  text: string; iso: string | null;
  precision: 'year' | 'month' | 'day' | 'relative_text';
};
type Medicine = {
  id: ID; role: 'suspect' | 'concomitant'; name: DraftField<string>;
  dose: DraftField<string>; route: DraftField<string>; frequency: DraftField<string>;
  started: DraftField<ReportedDate>; stopped: DraftField<ReportedDate>;
  indication: DraftField<string>;
};
type ReportedSeriousness = {
  death: Missing<boolean>; lifeThreatening: Missing<boolean>;
  hospitalization: Missing<boolean>; disability: Missing<boolean>;
  congenitalAnomaly: Missing<boolean>; other: Missing<boolean>;
};
type ReportedEvent = {
  id: ID; description: DraftField<string>; onset: DraftField<ReportedDate>;
  intensity: DraftField<'mild' | 'moderate' | 'severe'>;
  seriousness: DraftField<ReportedSeriousness>;
  outcome: DraftField<string>;
};
type CaseContent = {
  schemaVersion: 1; language: 'en' | 'te' | 'mixed' | 'und';
  reporter: { fictionalAlias: DraftField<string>; relationship: DraftField<string> };
  patient: { fictionalAlias: DraftField<string>; ageYears: DraftField<number> };
  statementIds: ID[]; medicines: Medicine[]; events: ReportedEvent[];
};
type CaseView = {
  id: ID; ownerId: ID; fictionalOnly: true; revision: number; contentVersion: number;
  status: 'draft' | 'ready_for_review' | 'changes_requested' | 'reviewed' | 'archived';
  content: CaseContent; statements: { id: ID; text: string; language: string }[];
  createdAt: string; updatedAt: string; applicableArtifacts: ID[];
};
type Principal = { userId: ID; roles: ('reporter' | 'reviewer' | 'operator')[] };
type DomainError = {
  error: { code: string; message: string; requestId: ID;
    fields?: { path: string; code: string }[]; retryAfterMs?: number };
};
```

Age permits 0–130; all-age software entry is not model/clinical coverage. UI can keep unfinished fields in a draft; agent inputs include only fields explicitly confirmed. `confirmed:true` is a requested owner action checked by the service, not an assertion agents can submit. Source/confirmation actor/time are server stamped. New medicine/event IDs are returned by the service; client uses a temporary `clientKey` on add operations. No identity/contact data is sent to model providers.

## Case and workflow endpoints

Success envelope is `{data:T, requestId:ID}` except export bytes. All views carry version/revision where relevant. `CaseSummary={id,status,contentVersion,revision,updatedAt,medicineLabels:string[],eventPreview:string}`. Narrative preview stays inside authorized UI.

### Create, list, retrieve, edit

- `POST /cases`: `{fictionalOnly:true,language,narrative:string}` → 201 `CaseView` with empty structured fields and one exact original statement. Narrative may be empty for an unfinished draft. Ownership and timestamps come from session/server.
- `GET /cases?scope=&status=&medicine=&event=&from=&to=&cursor=&limit=` → 200 `{items:CaseSummary[],nextCursor:string|null}`. Scope defaults `own`; `assigned` requires active reviewer role and returns only actively granted cases. Default limit 20, max 50. Filters are bounded literal strings; dates filter created-at `[from,to)` in UTC. Stable opaque cursor encodes `(updatedAt,id)` plus filter/scope digest; reject reuse under changed filters/principal. No SQL interpolation. No all-hospital list in MVP.
- `GET /cases/:id?version=N` → 200 `CaseView` for current or specified immutable content version, with current lifecycle metadata labeled separately. Reject version <1, unknown version 404. No supplied owner parameter.
- `PATCH /cases/:id`: `{expectedRevision,operations:DraftOperation[]}` → 200 `CaseView`. Owner only; not archived/ready-for-review/reviewed unless first explicitly reopened/withdrawn. Allowlisted operations below; no arbitrary JSON Patch paths. One transaction, one content version, one audit chain. Omitted fields are unchanged; null is accepted only through `Missing<T>`.
- `POST /cases/:id/import-legacy`: `{expectedRevision,legacyDraftId,legacyRevision}` → 200 `CaseView`, owner only, existing draft same owner and exact revision. Imports original statements, not clinical approval. Unique import receipt prevents repeats. New target case must be empty; otherwise 409 `IMPORT_TARGET_NOT_EMPTY`.

```ts
type EditablePath =
  | 'reporter.fictionalAlias' | 'reporter.relationship'
  | 'patient.fictionalAlias' | 'patient.ageYears'
  | `medicines.${ID}.${'name'|'dose'|'route'|'frequency'|'started'|'stopped'|'indication'}`
  | `events.${ID}.${'description'|'onset'|'intensity'|'seriousness'|'outcome'}`;
type FieldValue = string | number | ReportedDate | ReportedSeriousness;
type DraftOperation =
  | { op:'append_statement'; text:string; language:'en'|'te'|'mixed'|'und'; supersedesId:ID|null }
  | { op:'add_medicine'; clientKey:string; role:'suspect'|'concomitant' }
  | { op:'add_event'; clientKey:string }
  | { op:'remove_medicine'|'remove_event'; id:ID }
  | { op:'set_field'; path:EditablePath; field:Missing<FieldValue>; confirm:boolean };
```

Runtime discriminated schemas enforce path-specific value types and membership of every nested ID. Add operations return `createdIds:{clientKey:ID}` alongside CaseView; set fields using returned IDs in a later command. Snapshot history preserves removed records. Manual field edits append their exact source text as reporter statements and stamp source/confirmation provenance server-side; they never overwrite prior statements. No proposal can add an exposure/event silently; the human adds entries, then applies eligible proposals.

### Execution and artifact endpoints

- `POST /cases/:id/executions`: `{expectedRevision,inputVersion,stage:'reporting'|'validation'|'knowledge'|'analysis',mode:'auto'|'deterministic'}` → 202 `ExecutionView`. Owner may request; assigned reviewer may run read-only validation/knowledge/analysis, never confirm owner fields. Stage prerequisites below; `auto` does not grant cloud consent. Server config/provider permission still required. Idempotent replay returns original execution.
- `GET /cases/:id/executions?cursor=&limit=` → 200 `{items:ExecutionView[],nextCursor}`; sorted `(createdAt,id)`, same max 50.
- `GET /cases/:id/executions/:executionId` → 200 `ExecutionView` plus typed artifact when complete. Verify parent case, version and actor permissions; never fetch execution solely by UUID.
- `POST /cases/:id/executions/:executionId/cancel`: `{expectedRevision}` → 200 `ExecutionView`; requester owner or granted reviewer of their own execution. Cancellation blocks publication; provider may already have consumed work. It never deletes original input.
- `POST /cases/:id/executions/:executionId/retry`: `{expectedRevision}` → 202 `ExecutionView`; authorized requester, original input must still be current, retry budget max 2 total attempts. Permanent invalid-output/unsupported-language errors require manual action or a separately configured new run, not blind retries.
- `GET /cases/:id/validation?version=N` → 200 `{version,executionId:ID|null,applicability:'current'|'stale'|'not_run',result:ValidationResult|null}`. No-run differs from zero findings.
- `GET /cases/:id/citations?version=N&cursor=&limit=` → 200 `{version,applicability,items:Citation[],nextCursor}`. Default 20/max 50; citation detail resolves stored passage metadata; no arbitrary URL proxy.
- `POST /cases/:id/proposal-decisions`: `{expectedRevision,inputVersion,executionId,decisions:{proposalId,action:'accept'|'edit'|'reject',value:Missing<FieldValue>|null}[]}` → 200 `CaseView`. Owner only, current reporting artifact and exact source span required; accept uses artifact value and requires null client value, edit requires typed value, reject requires null. Duplicate proposal IDs rejected. Decisions create one new content version only if fields change, with separate immutable decision receipts; reject-only increments revision but not contentVersion.

Reporting requires a nonblank statement; validation accepts incomplete drafts. Knowledge requires confirmed provided suspect medicine and event query terms; absent terms produce `no_evidence` with reason, not arbitrary retrieval. Analysis requires current validation and retrieval outcomes; explicit unavailable/no-evidence is accepted only for a limited deterministic summary. Run cache key is `(case,contentVersion,stage,inputHash,configHash,corpusVersion)`; previous results may be reused only if authorized, nonwithdrawn and current. Keep one queued/running run per such key. No blanket cache shared across case narratives.

### Human workflow and access

- `POST /cases/:id/review-request`: `{expectedRevision,inputVersion,acknowledgedFindingIds:ID[],acknowledgedLimitations:string[]}` → 200 `CaseView`. Owner only. Uses the readiness rules in [architecture](01-system-architecture.md); finding IDs resolved server-side. Completeness is an academic checklist, not regulatory acceptance.
- `POST /cases/:id/reviews`: `{expectedRevision,inputVersion,decision:'approve_academic'|'request_changes'|'comment',notes,acknowledgedFindingIds:ID[],acknowledgedLimitations:string[]}` → 201 `{case:CaseView,review:ReviewDecision}`. Active reviewer role+case grant, reviewer ≠ owner, exact version, current validation. Approval/request-changes require ready-for-review; comments may attach to any visible nonarchived version. Required acknowledgement codes are server-enumerated from current artifact state; clients cannot clear them with arbitrary strings.
- `GET /cases/:id/reviews?version=N&cursor=&limit=` → 200 paginated review decisions; owner or granted reviewer.
- `POST /cases/:id/transitions`: `{expectedRevision,action:'withdraw_review'|'reopen'|'archive'|'restore',reason}` → 200 `CaseView`. Owner only; state matrix in architecture. Reopen/restore copies content to a new immutable version and clears applicable review. Archive of active review requires withdrawal first; pending workers cancelled/staled. Never hard-deletes records.
- `POST /cases/:id/reviewer-grants`: `{expectedRevision,reviewerId}` → 201 `{grantId,revision}`. Owner requests access for an already provisioned reviewer; no public directory enumeration. `POST /cases/:id/reviewer-grants/:grantId/revoke` with revision → 200 `{revoked:true,revision}`. Both atomically audit; stale requests 409. Roles provisioned by a local operator command, with audit, not a self-service API.
- `GET /cases/:id/audit?cursor=&limit=` → 200 paginated minimized events, owner/granted reviewer; authentication failures and secret diagnostics are not exposed in this view.

### Export and statistics

- `POST /cases/:id/exports`: `{expectedRevision,inputVersion,format:'json'|'html'}` → 200 bytes, `Content-Disposition: attachment`, `Cache-Control:no-store`, `X-APIP-Export-Id`, `X-APIP-Content-SHA256`. Owner or granted reviewer; current review status and fictional watermark included. Archived historic export permitted read-only if authorized. No regulatory receiver IDs. JSON includes snapshot, source/proposal/confirmation provenance, findings, citations, review records, execution versions and limits; never passwords/tokens/prompts with secret material. HTML uses escaped text and no executable model markup; browser printing is a manual download option, not proof of PDF fidelity.
- `GET /dashboard?scope=&from=&to=&status=` → 200 `DashboardResult`. Scope defaults `own`; selecting `assigned` requires active reviewer role and server-enforced active grants. Date range `[from,to)` UTC, max 366 days, default last 30. No client-supplied owner/organization. Counts and denominators in [dashboard](05-dashboard-workflows.md); all values deterministic. Aggregates enforce the same scope as lists and cannot leak other owners.

## Agent interfaces and output schemas

```ts
type AgentInput = {
  caseId:ID; inputVersion:number; inputHash:string; schemaVersion:1;
  confirmedContent:CaseContent; statements:{id:ID;text:string;language:string}[];
};
type Proposal = {
  id:ID; path:EditablePath; value:Missing<FieldValue>;
  statementId:ID; quote:string; start:number; end:number;
  uncertainty:'explicit'|'ambiguous'; // never a clinical confidence probability
};
type ExtractionResult = {
  schemaVersion:1; status:'proposed'|'manual_required';
  proposals:Proposal[]; limitations:string[];
};
type ValidationFinding = {
  id:ID; ruleId:string; path:string; severity:'blocker'|'warning'|'info';
  code:string; messageKey:string;
};
type ValidationResult = {
  schemaVersion:1; ruleSetVersion:string; findings:ValidationFinding[];
  providedRequired:number; requiredApplicable:number;
  reviewChecklistComplete:boolean; // never "regulatory compliant"
};
type Citation = {
  id:ID; documentId:ID; chunkId:ID; sourceVersion:string; corpusVersion:string;
  title:string; publisher:string; url:string; section:string; page:number|null;
  quote:string; documentHash:string; chunkHash:string; rank:number; score:number;
};
type RetrievalResult = {
  schemaVersion:1; status:'found'|'no_evidence'|'unavailable';
  corpusVersion:string; citations:Citation[]; limitations:string[];
};
type AnalysisResult = {
  schemaVersion:1; mode:'provider'|'deterministic';
  reportedFacts:{path:string;value:FieldValue;originVersion:number}[];
  evidenceObservations:{text:string;citationIds:ID[]}[];
  missingFields:string[]; limitations:string[];
  clinicalConclusion:null;
};
type ExecutionView = {
  id:ID; caseId:ID; inputVersion:number; stage:'reporting'|'validation'|'knowledge'|'analysis';
  status:'queued'|'running'|'succeeded'|'manual_required'|'failed'|'stale'|'cancelled'|'interrupted';
  attemptCount:number; maxAttempts:2; mode:'provider'|'deterministic'|'manual_required';
  configHash:string; artifactId:ID|null; errorCode:string|null;
  createdAt:string; startedAt:string|null; finishedAt:string|null;
};
interface ReportingAgent { run(input:AgentInput, signal:AbortSignal):Promise<ExtractionResult> }
interface ValidationAgent { run(input:AgentInput):ValidationResult }
interface KnowledgeAgent { run(input:AgentInput):Promise<RetrievalResult> }
interface AnalysisAgent {
  run(input:AgentInput, validation:ValidationResult, retrieval:RetrievalResult,
      signal:AbortSignal):Promise<AnalysisResult>;
}
```

These functions receive no database write handle, HTTP cookie, role-editing tool or arbitrary network tool. The orchestrator rechecks policy, content version, corpus status and schema before persisting any artifact. Server stamps UUIDs for proposals/findings; model output uses temporary keys resolved to server IDs. Quote spans are JS UTF-16 `[start,end)` offsets and must satisfy `statement.text.slice(start,end)===quote`, including Telugu; never mix byte/code-point offsets. Reject ambiguous numeric/date transformation unless a deterministic approved normalization reproduces it. AgentInput's structured fields are filtered to confirmations by the service, not trusted because the caller names them `confirmedContent`.

`ReviewDecision={id,caseId,inputVersion,reviewerId,decision,notes,acknowledgedFindingIds,acknowledgedLimitations,createdAt}`. `DashboardResult={scope:'own'|'assigned',from,to,computedAt,cohortCount,byStatus:Record<string,number>,reviewedCount,withMissingFieldsCount,notCheckedCount,topReportedMedicines:{label,caseCount,denominator}[],limitations:string[]}`. Role/profile identifiers in views are minimized to needed UI fields.

## Failures, retries and execution history

HTTP errors: 400 malformed JSON/query; 401 missing/expired session; 403 visible-resource action/Origin denial; 404 invisible resource/disabled route; 409 revision/idempotency/stale state/account change; 413 body too large; 415 wrong media type; 422 well-formed invalid schema or unmet stage inputs; 429 bounded request/work capacity with Retry-After; 503 database busy/service unavailable; 500 unexpected internal fault with redacted request ID. Never return raw provider errors or SQL to clients.

Queued execution is durable before responding 202. Local worker concurrency 1, queue max 20, max 2 total attempts, provider timeout 15 seconds/attempt, 1 second retry delay for eligible transient transport/5xx failures, and overall run wall budget 35 seconds. Persist cooldown; never sleep inside a DB transaction. 429 respects Retry-After only within the wall budget; otherwise return retryable failure/manual path. No retry of invalid JSON, unsupported language, unanchored claim, permission denial or deterministic rule failure. Cancellation and version edits invalidate late output even if transport cannot be interrupted.

Persist input/config/prompt/schema/model/corpus hashes and stage timings. Lease 45 seconds; at restart an expired running execution becomes `interrupted`, never falsely succeeded. Explicit retry requires current authorization and remaining attempt budget. Result, findings/citations and audit commit together. If case version changed or source withdrawn, mark stale without case mutation. Idempotency and leases provide bounded at-least-once execution with idempotent publication, not magical exactly-once provider billing.
