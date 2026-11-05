# APIP development hosted handoff

The development ledger for project `kstxwoitiistmvivwixd` records profile bootstrap `20261105092031`, ADR foundation `20261105092036`, and command receipts `20261105092042`. Repository migrations match the recorded SQL after normalizing line endings and final whitespace. The reconciliation changes repository filenames only. Do not replay the bootstrap, apply the two retired filenames, or repair the hosted ledger. Other environments that applied the retired versions must be independently reconciled before any push.

## Restricted writer provisioning

Migration `20261105093956_apip_restricted_writer_role.sql` provisioned `apip_adr_writer` as NOLOGIN, with inherited authenticated privileges and only the three ADR function grants. The hosted catalog confirms the role has neither superuser nor BYPASSRLS and cannot directly mutate ADR tables.

Connect as the authorized development database administrator using verified TLS. Use psql's interactive `\password apip_adr_writer` command to set a strong password securely, then run `ALTER ROLE apip_adr_writer LOGIN;`. Do not record a password in a migration. Store the secret in the approved local or server secret store. Use the Supavisor transaction endpoint shown for this project under **Connect** and the custom-role login `apip_adr_writer.kstxwoitiistmvivwixd`. Supply the resulting URI as server-only `APIP_ADR_DATABASE_URL`. Use certificate validation, including an approved CA if required by the endpoint. Keep the pool cap at 3 and named prepared statements disabled for the first rehearsal.

The role inherits the project's authenticated grants, including the existing owner-scoped profile privileges. It must have no direct ADR mutation privileges, ownership, administrative role memberships, or BYPASSRLS. Before sending fixture traffic, verify actual role and grants over the pooler. Verify a transaction-scoped subject clears on both commit and rollback and that the writer cannot directly mutate ADR tables.

## Auth and local cloud preview

Set server-only `APIP_ACCOUNT_MODE=cloud`, `APIP_SUPABASE_URL=https://kstxwoitiistmvivwixd.supabase.co`, and `APIP_SUPABASE_PUBLISHABLE_KEY` in the cloud process alongside the database URL. The frontend uses the same project through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use an approved HTTPS origin in `VITE_APIP_AUTH_ORIGINS` or use HTTP localhost for the development OAuth check. Keep the existing SQLite preview process and its data separate.

Use two approved synthetic users. Configure email confirmation delivery to controlled inboxes, or create confirmed test users through the Auth dashboard to test password sign-in separately from email delivery. Verify session restoration, subject stability, owner denial, retries, revisions and reopen an exported original PvPI PDF.

In Google Auth Platform, configure Branding, set Audience to testing and add the synthetic testers, then create a Web application OAuth client. Register `https://kstxwoitiistmvivwixd.supabase.co/auth/v1/callback` as the authorized redirect URI. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and set the client ID and secret. In **Authentication → URL Configuration**, add the exact app callback, for example `http://localhost:3000/?apip_auth=1` or the approved HTTPS equivalent. Open the return in the initiating tab so its PKCE verifier is available. Keep secrets out of the repository, browser configuration, and chat.

Run the private container rehearsal on a Docker-capable host with the verified original template mounted read-only. The local SQLite preview and SQL fixture results do not establish hosted writer connectivity, hosted Auth or container readiness.
