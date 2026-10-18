-- Bootstrap for a fresh Supabase project. Apply once in SQL Editor; not yet deployed.
begin;
create table public.patient_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  birth_date date not null check (birth_date <= current_date and birth_date > current_date - interval '131 years'),
  relationship text not null check (relationship in ('self', 'caregiver')),
  conditions text check (length(conditions) <= 2000),
  surgeries text check (length(surgeries) <= 2000),
  medicines text check (length(medicines) <= 2000),
  allergies text check (length(allergies) <= 2000),
  history_notes text check (length(history_notes) <= 2000),
  share_medassist boolean not null default false,
  share_adr boolean not null default false,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  check (relationship = 'caregiver' or birth_date <= current_date - interval '18 years')
);
alter table public.patient_profiles enable row level security;
alter table public.patient_profiles force row level security;
revoke all on public.patient_profiles from public, anon, authenticated;
grant select, delete on public.patient_profiles to authenticated;
grant insert (user_id, display_name, birth_date, relationship, conditions, surgeries, medicines, allergies, history_notes, share_medassist, share_adr) on public.patient_profiles to authenticated;
grant update (display_name, birth_date, relationship, conditions, surgeries, medicines, allergies, history_notes, share_medassist, share_adr) on public.patient_profiles to authenticated;
create policy "Read own profile" on public.patient_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own profile" on public.patient_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Edit own profile" on public.patient_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own profile" on public.patient_profiles for delete to authenticated using ((select auth.uid()) = user_id);
create function public.advance_profile_revision() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.advance_profile_revision() from public, anon, authenticated;
create trigger profile_revision before update on public.patient_profiles for each row execute function public.advance_profile_revision();
commit;
