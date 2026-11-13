# MedAssist AI — Unified Supabase Auth & PostgreSQL Integration Contract

- **Status:** **Proposed contract** (for future integration; `origin/feat/medassist-jayanth` remains untouched and no clinical inference tables or endpoints are created in this stabilization phase).
- **Aligned baseline:** Supabase Auth (`sub` UUID) + PostgreSQL schema isolation (alongside existing ADR, Identity, and Sharing schemas) + [MedAssist Master Blueprint](../architecture/MEDASSIST_MASTER_BLUEPRINT.md).

---

## 1. Inspected Baseline Comparison

### Current MedAssist Backend Branch (`origin/feat/medassist-jayanth`)
Inspected read-only without modification:
- `app/core/config.py`: `DATABASE_URL`, local `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
- `app/database/session.py`, `alembic/versions/68ad8f9063cf_create_users_table.py`: separate `users` table (`id` integer, `email`, password hash) managed via SQLAlchemy / Alembic.
- `app/dependencies/auth.py`: decodes local HS256 JWT (`sub` = user email) and resolves local `User.id`.
- `app/models/prediction.py`, `app/api/routes/prediction.py`: disease prediction history owned by integer `users.id`.
- `app/models/hospital.py`: facility directory table (`Hospital`).

### Current Main APIP Platform (`codex/apip-landing-v2`)
- **Identity Authority:** Supabase Auth (`auth.users.id` UUID `sub`) via PKCE (`AccountProvider`, `server/cloud-account.ts`).
- **Database Ownership Pattern:** Schema-per-domain isolation (`public.patient_profiles`, `apip_adr`, `apip_identity`, `apip_sharing`) keyed by `auth.users(id)` UUID (`owner_id` / `user_id`), RLS + narrow `SECURITY DEFINER` executors (`set search_path = ''`), transaction-local `set_config('request.jwt.claim.sub', ..., true)`.
- **Research Adapter:** `models/medassist_v2/research_adapter/service.py` implementing L1 (`model-a-to-b.evidence.v1`) adaptive questioning behind opt-in Express adapter boundaries, with Model B / severity disabled pending L3 gates.

---

## 2. Authentication Unification Contract

Future integration MUST remove standalone FastAPI password auth (`app/api/routes/auth.py`, local `users` table login) in favor of APIP's single Supabase Auth authority:

1. **Token Verification:** APIP Express gateway verifies the user's Supabase Auth JWT (`sdk.auth.getUser(token)` or verified JWKS in FastAPI) and passes or validates the immutable UUID `sub` (`owner_id`). FastAPI MUST NOT accept user-supplied `user_id` / `email` body fields as identity proof.
2. **Account Ownership Key:** All MedAssist user-owned records MUST use `owner_id uuid not null references auth.users(id)` instead of local auto-increment `users.id` or mutable email strings.
3. **Browser Boundary:** Browser UI communicates strictly with the unified APIP portal (`/api/medassist/*`); FastAPI sits only behind APIP server-side proxying with shared-secret/internal authentication if hosted separately.

---

## 3. Proposed Isolated PostgreSQL Schema (`apip_medassist`)

MedAssist data MUST live in its own schema `apip_medassist` using a dedicated restricted writer role (`apip_medassist_writer`), isolated from `apip_adr`, `apip_identity`, and `apip_sharing` so clinical/ML endpoints cannot read PvPI ADR revisions or specialist credential records directly.

| Proposed Table | Ownership & Key Fields | Access & Separation Rule |
| --- | --- | --- |
| `apip_medassist.interviews` | `id uuid primary key`, `owner_id uuid references auth.users(id)`, `fictional_only boolean`, `status text`, `revision integer`, `created_at timestamptz`, `updated_at timestamptz` | Strictly owned by `owner_id = auth.uid()`. Anonymous access denied. |
| `apip_medassist.interview_turns` | `id uuid primary key`, `interview_id uuid`, `owner_id uuid`, `verbatim_statement text`, `ai_proposals jsonb`, `confirmed_observations jsonb`, `unknown_flags jsonb`, `model_provenance jsonb` | **Preserves four epistemic buckets separately:** raw user words, unconfirmed AI extraction proposals (with model version/digest), explicitly user-confirmed answers, and explicit `UNKNOWN` flags. |
| `apip_medassist.prediction_runs` | `id uuid primary key`, `interview_id uuid`, `owner_id uuid`, `model_version text`, `research_only boolean default true`, `predicted_candidates jsonb`, `severity_state text check (severity_state = 'disabled_pending_l3')`, `created_at timestamptz` | Replaces Jayanth's `predictions` table (`owner_id` UUID instead of integer `users.id`). Explicitly blocks Model B clinical urgency assignment until L3 approval. |
| `apip_medassist.profile_access_log` | `id uuid primary key`, `owner_id uuid`, `profile_revision integer`, `disclosed_fields jsonb`, `occurred_at timestamptz` | Records only opt-in reads from `public.patient_profiles` when `share_medassist = true` (disclosing calculated age, allergies, conditions, current medicines; excluding name, DOB, and account ID). |
| `apip_medassist.verified_facilities` | `id uuid primary key`, `facility_name text`, `verified_source text`, `verified_at timestamptz`, ... | Replaces unverified hospital capability claims; read-only for `authenticated` once L4/L5 verification criteria are met. |

---

## 4. Mandatory Clinical & Governance Invariants

1. **No Autonomous Escalation or Model Retraining:** New interviews and prediction runs MUST NEVER automatically promote records into RAG/knowledge evidence or trigger automatic ML model retraining (`AGENTS.md`).
2. **ADR Independence Preserved:** Direct ADR reporting (`#/preview/adr-report`, `#/patient/adr/cases`) remains independently accessible without requiring a MedAssist session. Future handoff from MedAssist to ADR drafting creates explicit user-reviewed draft proposals (`source: 'medassist'`), requiring explicit patient confirmation before saving into `apip_adr`.
3. **Research Severity & Safety Isolation:** Model B (`L3`) remains disabled and independent emergency escalation (`L4`) must remain rule-governed outside LLM/ML ranking overrides.
4. **Separate Schema Privileges:**
   - `anon`: zero table/function privileges in `apip_medassist`.
   - `authenticated`: RLS-restricted `SELECT` / `DELETE` only on `owner_id = auth.uid()`, or RPC-mediated `SECURITY DEFINER` executor identical to `apip_adr`.
   - `apip_medassist_writer`: zero privileges on `apip_adr.*`, `apip_identity.*`, and `apip_sharing.*`.
