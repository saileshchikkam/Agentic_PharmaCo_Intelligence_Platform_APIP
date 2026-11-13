import {readFile} from 'node:fs/promises';
import type {PGlite} from '@electric-sql/pglite';
/** Existing fixture identities predate this migration. Seed their explicit roles as
 * the fixture operator, never through the restricted runtime or editable metadata. */
export async function installFixturePortalRoles(db:PGlite,roles:ReadonlyArray<readonly[string,'PATIENT'|'SPECIALIST']>){
 await db.exec("alter table auth.users add column if not exists raw_user_meta_data jsonb not null default '{}'::jsonb");
 await db.exec(await readFile(new URL('../supabase/migrations/20261112155338_account_portal_binding.sql',import.meta.url),'utf8'));
 for(const [subject,role] of roles)await db.query('insert into apip_identity.account_roles(subject,role) values ($1,$2)',[subject,role]);
}
