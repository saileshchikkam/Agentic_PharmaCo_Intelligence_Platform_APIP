-- Development only. Pending exact checksum approval. No identities or data backfill.
begin;
-- Requires existing direct sharing. Guard pooled requests too when that migration is present.
do $$begin if to_regclass('apip_sharing.requests') is null then raise exception 'SHARING_SCHEMA_REQUIRED';end if;end;$$;
do $$begin if exists(select 1 from apip_sharing.requests) then raise exception 'LEGACY_SHARES_REVIEW_REQUIRED';end if;if to_regclass('apip_sharing.pooled_requests') is not null then if exists(select 1 from apip_sharing.pooled_requests) then raise exception 'LEGACY_SHARES_REVIEW_REQUIRED';end if;end if;end;$$;
create role apip_finalization_executor nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
create table apip_adr.finalizations(
 owner_id uuid not null,case_id uuid not null,revision integer not null,
 command_id uuid not null,finalized_by uuid not null,finalized_at timestamptz not null default now(),
 content_sha256 text not null check(content_sha256 ~ '^[0-9a-f]{64}$'),
 primary key(owner_id,case_id),unique(owner_id,command_id),check(finalized_by=owner_id),
 foreign key(owner_id,case_id,revision) references apip_adr.revisions(owner_id,case_id,revision));
alter table apip_adr.finalizations enable row level security;
alter table apip_adr.finalizations force row level security;
revoke all on apip_adr.finalizations from public,anon,authenticated,apip_adr_writer;
grant usage on schema apip_adr to apip_finalization_executor;
grant select on apip_adr.cases,apip_adr.revisions to apip_finalization_executor;
grant select,insert on apip_adr.finalizations to apip_finalization_executor;
grant select on apip_adr.finalizations to apip_adr_writer;
create policy finalization_owner on apip_adr.finalizations to apip_finalization_executor,apip_adr_writer
 using(owner_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid)
 with check(owner_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid);
-- Private executor may check only finalization metadata for an assigned patient.
create policy finalization_guard_read on apip_adr.finalizations for select to apip_finalization_executor using(true);
create policy finalization_cases on apip_adr.cases for select to apip_finalization_executor using(owner_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid);
create policy finalization_revisions on apip_adr.revisions for select to apip_finalization_executor using(owner_id=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid);
create trigger finalizations_immutable before update or delete on apip_adr.finalizations for each row execute function apip_adr.reject_history_change();
create function apip_adr.finalize_case(p_case uuid,p_revision integer,p_key uuid) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare actor uuid:=nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;current_rev integer;prior apip_adr.finalizations%rowtype;snapshot jsonb;v jsonb;k text;entry jsonb;definition jsonb;field_key text;text_value text;choice text;medicine jsonb;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED';end if;
 if p_case is null or p_revision is null or p_key is null then raise exception 'INVALID_COMMAND';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':'||p_case::text,0));
 select * into prior from apip_adr.finalizations where owner_id=actor and command_id=p_key;
 if found then
  if prior.case_id<>p_case or prior.revision<>p_revision then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  return to_jsonb(prior);
 end if;
 select revision into current_rev from apip_adr.cases where owner_id=actor and id=p_case;
 if not found then raise exception 'NOT_FOUND';end if;
 if current_rev<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 if exists(select 1 from apip_adr.finalizations where owner_id=actor and case_id=p_case) then raise exception 'ALREADY_FINALIZED';end if;
 select r.snapshot into snapshot from apip_adr.revisions r where r.owner_id=actor and r.case_id=p_case and r.revision=p_revision;
 v:=snapshot->'values';
 foreach k in array array['initials','reaction','reactionStart','reporterName'] loop
  if coalesce(v->k->>'state','')<>'provided' or coalesce(v->k->>'confirmedAt','')='' or length(trim(coalesce(v->k->>'value','')))=0 then raise exception 'INCOMPLETE_REPORT';end if;
 end loop;
 if not coalesce(((v->'age'->>'state'='provided' and coalesce(v->'age'->>'value','')<>'') or (v->'dob'->>'state'='provided' and coalesce(v->'dob'->>'value','')<>'')),false) then raise exception 'INCOMPLETE_REPORT';end if;
 if not exists(select 1 from jsonb_array_elements(snapshot->'medications') m where m->>'kind'='suspect' and v->('med.'||(m->>'id')||'.name')->>'state'='provided' and length(trim(coalesce(v->('med.'||(m->>'id')||'.name')->>'value','')))>0) then raise exception 'INCOMPLETE_REPORT';end if;
 if not exists(select 1 from jsonb_each(v) x where x.key in ('email','phone','address') and x.value->>'state'='provided' and length(trim(coalesce(x.value->>'value','')))>0) then raise exception 'INCOMPLETE_REPORT';end if;


 -- Snapshot field rules copied from the shared intake definitions at migration review.
 for k,entry in select key,value from jsonb_each(v) loop
  field_key:=case when k like 'med.%' then regexp_replace(k,'^med\.[^.]+\.','') else k end;
  select d into definition from jsonb_array_elements(case when k like 'med.%' then '{"fields":[{"key":"caseType","label":"Is this an initial or follow-up report?","stage":0,"options":["Initial","Follow-up"],"required":true},{"key":"followUp","label":"Previous report reference","stage":0},{"key":"initials","label":"Patient initials","stage":1,"required":true},{"key":"age","label":"Age at reaction onset (years)","stage":1,"type":"number"},{"key":"dob","label":"Date of birth","stage":1,"type":"date"},{"key":"gender","label":"Gender","stage":1,"options":["Female","Male","Other"]},{"key":"weight","label":"Weight (kg)","stage":1,"type":"number"},{"key":"registration","label":"Registration number","stage":1},{"key":"reaction","label":"What reaction or event was noticed?","stage":2,"type":"long","required":true},{"key":"reactionStart","label":"When did it start?","stage":2,"type":"date"},{"key":"reactionStop","label":"When did it stop?","stage":2,"type":"date"},{"key":"management","label":"Describe what happened and any management","stage":2,"type":"long"},{"key":"seriousness","label":"Reported seriousness (select all that apply)","stage":2,"options":["Death","Life threatening","Hospitalization / prolonged hospitalization","Disability","Congenital anomaly","Other medically important condition","None reported"]},{"key":"outcome","label":"Reported outcome","stage":2,"options":["Recovered","Recovering","Not recovered","Fatal","Recovered with sequelae"]},{"key":"history","label":"Relevant medical history","stage":4,"type":"long"},{"key":"investigations","label":"Relevant investigations","stage":4,"type":"long"},{"key":"reporterName","label":"Reporter name","stage":4,"required":true},{"key":"address","label":"Reporter address","stage":4,"type":"long"},{"key":"pin","label":"PIN code","stage":4},{"key":"email","label":"Email","stage":4},{"key":"phone","label":"Phone","stage":4},{"key":"occupation","label":"Occupation","stage":4},{"key":"reportDate","label":"Report date","stage":4,"type":"date"},{"key":"signature","label":"Signature status","stage":4,"options":["Not signed","Will sign after printing"]},{"key":"additional","label":"Additional information","stage":4,"type":"long"}],"medicationFields":[{"key":"name","label":"Brand / generic name","stage":3,"required":true},{"key":"manufacturer","label":"Manufacturer","stage":3},{"key":"batch","label":"Batch / lot","stage":3},{"key":"expiry","label":"Expiry date","stage":3,"type":"date"},{"key":"dose","label":"Dose","stage":3},{"key":"route","label":"Route","stage":3},{"key":"frequency","label":"Frequency","stage":3},{"key":"start","label":"Therapy start","stage":3,"type":"date"},{"key":"stop","label":"Therapy stop","stage":3,"type":"date"},{"key":"indication","label":"Indication","stage":3},{"key":"action","label":"Action after the reaction","stage":3},{"key":"rechallenge","label":"What happened after reintroduction?","stage":3,"type":"long"}]}'::jsonb->'medicationFields' else '{"fields":[{"key":"caseType","label":"Is this an initial or follow-up report?","stage":0,"options":["Initial","Follow-up"],"required":true},{"key":"followUp","label":"Previous report reference","stage":0},{"key":"initials","label":"Patient initials","stage":1,"required":true},{"key":"age","label":"Age at reaction onset (years)","stage":1,"type":"number"},{"key":"dob","label":"Date of birth","stage":1,"type":"date"},{"key":"gender","label":"Gender","stage":1,"options":["Female","Male","Other"]},{"key":"weight","label":"Weight (kg)","stage":1,"type":"number"},{"key":"registration","label":"Registration number","stage":1},{"key":"reaction","label":"What reaction or event was noticed?","stage":2,"type":"long","required":true},{"key":"reactionStart","label":"When did it start?","stage":2,"type":"date"},{"key":"reactionStop","label":"When did it stop?","stage":2,"type":"date"},{"key":"management","label":"Describe what happened and any management","stage":2,"type":"long"},{"key":"seriousness","label":"Reported seriousness (select all that apply)","stage":2,"options":["Death","Life threatening","Hospitalization / prolonged hospitalization","Disability","Congenital anomaly","Other medically important condition","None reported"]},{"key":"outcome","label":"Reported outcome","stage":2,"options":["Recovered","Recovering","Not recovered","Fatal","Recovered with sequelae"]},{"key":"history","label":"Relevant medical history","stage":4,"type":"long"},{"key":"investigations","label":"Relevant investigations","stage":4,"type":"long"},{"key":"reporterName","label":"Reporter name","stage":4,"required":true},{"key":"address","label":"Reporter address","stage":4,"type":"long"},{"key":"pin","label":"PIN code","stage":4},{"key":"email","label":"Email","stage":4},{"key":"phone","label":"Phone","stage":4},{"key":"occupation","label":"Occupation","stage":4},{"key":"reportDate","label":"Report date","stage":4,"type":"date"},{"key":"signature","label":"Signature status","stage":4,"options":["Not signed","Will sign after printing"]},{"key":"additional","label":"Additional information","stage":4,"type":"long"}],"medicationFields":[{"key":"name","label":"Brand / generic name","stage":3,"required":true},{"key":"manufacturer","label":"Manufacturer","stage":3},{"key":"batch","label":"Batch / lot","stage":3},{"key":"expiry","label":"Expiry date","stage":3,"type":"date"},{"key":"dose","label":"Dose","stage":3},{"key":"route","label":"Route","stage":3},{"key":"frequency","label":"Frequency","stage":3},{"key":"start","label":"Therapy start","stage":3,"type":"date"},{"key":"stop","label":"Therapy stop","stage":3,"type":"date"},{"key":"indication","label":"Indication","stage":3},{"key":"action","label":"Action after the reaction","stage":3},{"key":"rechallenge","label":"What happened after reintroduction?","stage":3,"type":"long"}]}'::jsonb->'fields' end) d where d->>'key'=field_key;
  if definition is null or (k='followUp' and coalesce(v->'caseType'->>'value','')<>'Follow-up') then continue;end if;
  if entry->>'state'='provided' then
   text_value:=entry->>'value';
   if jsonb_typeof(entry->'value')<>'string' or coalesce(trim(text_value),'')='' or coalesce(entry->>'confirmedAt','')='' or length(text_value)>(case when definition->>'type'='long' then 4000 else 200 end) then raise exception 'INCOMPLETE_REPORT';end if;
   perform (entry->>'confirmedAt')::timestamptz;
   if definition->>'type'='number' then
    if text_value!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'INCOMPLETE_REPORT';end if;
    if text_value::numeric>(case when k='age' then 130 else 600 end) then raise exception 'INCOMPLETE_REPORT';end if;
   elsif definition->>'type'='date' then
    if text_value!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char(to_date(text_value,'YYYY-MM-DD'),'YYYY-MM-DD')<>text_value then raise exception 'INCOMPLETE_REPORT';end if;
   end if;
   if definition ? 'options' then
    for choice in select unnest(case when k='seriousness' then string_to_array(text_value,'; ') else array[text_value] end) loop
     if not (definition->'options' ? choice) then raise exception 'INCOMPLETE_REPORT';end if;
    end loop;
    if k='seriousness' and position('None reported' in text_value)>0 and text_value<>'None reported' then raise exception 'INCOMPLETE_REPORT';end if;
   end if;
  end if;
 end loop;
 if length(v->'initials'->>'value')>12 or (v->'initials'->>'value')!~'^[[:alpha:] .''-]+$' or exists(select 1 from regexp_split_to_table(trim(v->'initials'->>'value'),'[ .''-]+') part where length(part)>3) then raise exception 'INCOMPLETE_REPORT';end if;
 if not coalesce((v->'address'->>'state'='provided' and length(trim(v->'address'->>'value'))>0) or (v->'email'->>'state'='provided' and v->'email'->>'value' ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') or (v->'phone'->>'state'='provided' and v->'phone'->>'value' ~ '^\+?[0-9 ()-]{7,24}$' and length(regexp_replace(v->'phone'->>'value','[^0-9]','','g')) between 7 and 15),false) then raise exception 'INCOMPLETE_REPORT';end if;
 if v->'reactionStart'->>'state'='provided' and v->'reactionStop'->>'state'='provided' and v->'reactionStop'->>'value'<v->'reactionStart'->>'value' then raise exception 'INCOMPLETE_REPORT';end if;
 for medicine in select value from jsonb_array_elements(snapshot->'medications') loop
  if v->('med.'||(medicine->>'id')||'.start')->>'state'='provided' and v->('med.'||(medicine->>'id')||'.stop')->>'state'='provided' and v->('med.'||(medicine->>'id')||'.stop')->>'value'<v->('med.'||(medicine->>'id')||'.start')->>'value' then raise exception 'INCOMPLETE_REPORT';end if;
 end loop;
 insert into apip_adr.finalizations(owner_id,case_id,revision,command_id,finalized_by,content_sha256)
 values(actor,p_case,p_revision,p_key,actor,encode(sha256(convert_to(snapshot::text,'UTF8')),'hex')) returning * into prior;
 return to_jsonb(prior);
end;$$;
create function apip_adr.guard_finalized_content() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from apip_adr.finalizations where owner_id=new.owner_id and case_id=new.id) then raise exception 'REPORT_FINALIZED';end if;
 return new;
end;$$;
-- Case updates and revision inserts in the legacy RPC already hold the same case lock.
create trigger finalized_case_guard before update on apip_adr.cases for each row execute function apip_adr.guard_finalized_content();
-- Separate trigger avoids referencing a nonexistent record field on different tables.
create function apip_adr.guard_finalized_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from apip_adr.finalizations where owner_id=new.owner_id and case_id=new.case_id) then raise exception 'REPORT_FINALIZED';end if;return new;
end;$$;
create trigger finalized_revision_guard before insert on apip_adr.revisions for each row execute function apip_adr.guard_finalized_revision();
-- Any new direct/pool consent record must refer to the exact finalized revision.
create function apip_adr.require_finalized_sharing() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from apip_adr.finalizations where owner_id=new.patient and case_id=new.case_id and revision=new.revision) then raise exception 'REPORT_NOT_FINALIZED';end if;return new;
end;$$;
do $$begin
 if to_regclass('apip_sharing.requests') is not null then execute 'create trigger sharing_finalization_guard before insert on apip_sharing.requests for each row execute function apip_adr.require_finalized_sharing()';end if;
 if to_regclass('apip_sharing.pooled_requests') is not null then execute 'create trigger pool_finalization_guard before insert on apip_sharing.pooled_requests for each row execute function apip_adr.require_finalized_sharing()';end if;
end;$$;
grant apip_finalization_executor to current_user with set true;
grant apip_finalization_executor to current_user with inherit false;
grant create on schema apip_adr to apip_finalization_executor;
revoke all on function apip_adr.finalize_case(uuid,integer,uuid),apip_adr.guard_finalized_content(),apip_adr.guard_finalized_revision(),apip_adr.require_finalized_sharing() from public,anon,authenticated,apip_adr_writer;
grant execute on function apip_adr.finalize_case(uuid,integer,uuid) to apip_adr_writer;
alter function apip_adr.finalize_case(uuid,integer,uuid) owner to apip_finalization_executor;
alter function apip_adr.guard_finalized_content() owner to apip_finalization_executor;
alter function apip_adr.guard_finalized_revision() owner to apip_finalization_executor;
alter function apip_adr.require_finalized_sharing() owner to apip_finalization_executor;
revoke create on schema apip_adr from apip_finalization_executor;
grant apip_finalization_executor to current_user with set false;

commit;
