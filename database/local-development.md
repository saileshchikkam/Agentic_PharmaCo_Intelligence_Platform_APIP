# Local account database and authentication

## Run

Use Node 24 and the existing Bun dependency workflow. Run `bun run dev` and open `http://localhost:3000/#/sign-in/patient`. Leave both Supabase browser variables empty to select local mode. Choose **Create account**, enter a fictional email identifier and a separate test password (12–128 characters), then complete and save the profile. No email is sent and email ownership is not verified. Google, password recovery and account deletion are not connected in local mode.

The local backend is enabled only outside `NODE_ENV=production`; the built production client cannot select this development adapter. Do not expose the experimental app as a patient service. Local account routes additionally reject non-loopback sockets, unexpected Host/Origin values, and missing JSON/Origin on mutations. Use the same hostname consistently: `localhost` and `127.0.0.1` have separate browser cookies even though they share the same database.

No Docker, Supabase runtime, cloud project, model API or paid service is needed for this local path. Configured Supabase projects continue to use the separately documented [hosted adapter](README.md).

## Storage and sessions

On Windows, the database is `%LOCALAPPDATA%/APIP/accounts.sqlite`, outside the repository and its synced documents folder. Other platforms use a user-local application-data directory. `APIP_LOCAL_DB_PATH` can override the file through the **server environment**; the server still does not automatically read server variables from `.env`. Never put the database under `public`, `dist`, or another served/synced directory. SQLite/WAL files are ignored by Git as an additional safeguard. Credentials and records are never committed.

`server/local-account.ts` creates schema version 1: `local_users`, `local_sessions`, and `local_profiles`. Foreign keys, prepared parameters, WAL and a busy timeout are enabled. A newer schema version refuses startup. This is a single-process local development store; cloud migration, operational backups and recovery tooling are not implemented. Backups must include consistent SQLite/WAL state; do not copy a running database casually.

Passwords use unique 16-byte random salts and scrypt (`N=32768, r=8, p=3`, 32-byte key). The database stores salt/hash, never plaintext passwords. Sessions use random 32-byte tokens; only their SHA-256 hashes are stored server-side. The browser receives an HttpOnly, SameSite=Strict cookie scoped to `/api/account`, with an eight-hour absolute expiry. Logout deletes the current session. Local HTTP cookies intentionally omit Secure for loopback development; this configuration is not a public deployment recipe.

Health records are **not encrypted at rest by APIP**. File protection depends on the operating-system account and disk controls; local administrators or someone with filesystem access may read them. Use fictional records. No health data is sent to external services or models by the local account module. Any explicitly configured cloud account provider is a separate path.

Authentication attempts are bounded to 30 per 15 minutes across this local process, with at most two concurrent password hashes. Limits reset on process restart. Errors are bounded/generic and the account feature does not log credentials, cookies or history.

## API and isolation

All routes are under `/api/account`, with `Cache-Control: no-store`:

- `GET /session`: verified current user or null, from the server-side session lookup.
- `POST /signup`, `POST /signin`: exact `{email, password}` body, normalized email identifier, new session cookie. Signup does not grant specialist/developer roles.
- `POST /signout`: clears the current cookie/session.
- `GET /profile`: current user's profile or null.
- `POST /profile`: `{profile, expectedRevision}`; null expected revision creates once, otherwise a matching revision is required for update.
- `POST /profile/delete`: `{expectedRevision}`; deletes only the current profile, preserving the login.

Profile routes require `X-APIP-Account` to match the authenticated account. It is a consistency check, not an authorization credential: ownership always comes from the server-verified cookie. This prevents an old tab from writing one person's edits into another account after cookies change. Extra profile fields, missing values/types, unconfirmed ownership fields, invalid dates and unsupported child/self combinations are rejected. Missing optional medical history remains null.

The browser adapter keeps profile data in React memory and uses the HttpOnly cookie for requests, without storing local session tokens in JavaScript storage. It rechecks session state on focus and every 30 seconds. A same-origin BroadcastChannel carries only a change signal so other tabs clear stale account state and ask the server again. Native history/reload can still discard unsaved profile edits; app navigation and reload have existing discard protection. Device/browser compromise, XSS and user-level filesystem access remain outside these ownership checks.

The shared profile remains distinct from MedAssist statements and ADR report data. The fictional ADR draft collection still uses shared browser storage; it is **not migrated into account storage** by this task.

## Verification

```sh
node --import tsx --test scripts/local-account.test.ts scripts/account-profile.test.ts scripts/medassist.test.ts scripts/preview-navigation.test.mjs
bun run lint
bun run build
```

The local HTTP test creates isolated temporary SQLite data and two fictional accounts, checks password/token storage, signup/login, owner retrieval, cross-account read/edit/delete rejection, schema validation, stale edits, deletion, logout, expiry and rate limiting, then closes/reopens the database to verify persistence. Temporary credentials are generated per run and not printed. These are engineering checks, not a clinical/security certification. Supabase SQL ownership tests remain separate from the SQLite backend tests.

References consulted: [Node SQLite](https://nodejs.org/api/sqlite.html), [Node scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Profile control regression

The profile page uses explicit disabled props for each official Material input/checkbox rather than a native disabled fieldset. Material Web can retain a control-level disabled flag after a disabled ancestor fieldset becomes enabled; this previously blocked editing after account/profile loading. The [browser regression fixture](../tests/README.md) reproduces the old failure and verifies the explicit-control behavior through repeated loading cycles.
