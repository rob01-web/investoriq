alter table if exists public.reports
  add column if not exists revision_kind text,
  add column if not exists revision_family_key text,
  add column if not exists revision_root_report_id uuid,
  add column if not exists revision_parent_report_id uuid,
  add column if not exists revision_number integer,
  add column if not exists revision_request_key text,
  add column if not exists revision_source_job_id uuid,
  add column if not exists is_current_revision boolean not null default false,
  add column if not exists revision_published_at timestamptz;

alter table if exists public.reports
  add constraint reports_revision_kind_check
  check (revision_kind is null or revision_kind in ('original', 'corrected', 'replacement'));

alter table if exists public.reports
  add constraint reports_revision_number_check
  check (revision_number is null or revision_number >= 1);

alter table if exists public.reports
  add constraint reports_revision_parent_not_self_check
  check (revision_parent_report_id is null or id is null or revision_parent_report_id <> id);

create or replace function public.report_revision_has_published_analysis_job(p_report_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.analysis_jobs aj
    where aj.report_id = p_report_id
      and aj.status = 'published'
  );
$$;

create unique index if not exists reports_revision_request_key_key
  on public.reports (revision_request_key)
  where revision_request_key is not null;

create unique index if not exists reports_revision_family_number_key
  on public.reports (revision_family_key, revision_number)
  where revision_family_key is not null and revision_number is not null;

drop index if exists reports_one_current_published_revision_per_family_key;
create unique index if not exists reports_one_current_published_revision_per_family_key
  on public.reports (revision_family_key)
  where revision_family_key is not null and is_current_revision = true;

create index if not exists reports_user_revision_history_idx
  on public.reports (user_id, revision_family_key, revision_number desc, created_at desc);

create index if not exists reports_user_current_revision_idx
  on public.reports (user_id, is_current_revision desc, created_at desc);

create or replace function public.reports_apply_revision_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_revision_number integer;
  v_family_key text;
begin
  if NEW.revision_kind is null then
    NEW.revision_kind := 'original';
  end if;

  if NEW.revision_kind not in ('original', 'corrected', 'replacement') then
    raise exception 'invalid report revision kind: %', NEW.revision_kind;
  end if;

  if NEW.revision_kind = 'original' then
    if NEW.revision_number is null then
      NEW.revision_number := 1;
    end if;
    if NEW.revision_root_report_id is null then
      NEW.revision_root_report_id := NEW.id;
    end if;
    if NEW.revision_family_key is null then
      NEW.revision_family_key := coalesce(NEW.revision_root_report_id::text, NEW.id::text);
    end if;
    if NEW.revision_request_key is null then
      NEW.revision_request_key := concat('original:', coalesce(NEW.revision_source_job_id::text, NEW.id::text));
    end if;
    NEW.revision_parent_report_id := null;
  else
    if NEW.revision_root_report_id is null then
      raise exception 'revision root report id is required for % revisions', NEW.revision_kind;
    end if;
    v_family_key := coalesce(NEW.revision_family_key, NEW.revision_root_report_id::text);
    NEW.revision_family_key := v_family_key;
    if NEW.revision_number is null then
      select coalesce(max(r.revision_number), 1) + 1
        into v_next_revision_number
      from public.reports r
      where r.revision_family_key = v_family_key;
      NEW.revision_number := v_next_revision_number;
    end if;
    if NEW.revision_request_key is null then
      NEW.revision_request_key := concat(
        NEW.revision_kind,
        ':',
        v_family_key,
        ':',
        coalesce(NEW.revision_parent_report_id::text, 'none'),
        ':',
        coalesce(NEW.revision_source_job_id::text, NEW.id::text)
      );
    end if;
  end if;

  if NEW.is_current_revision is null then
    NEW.is_current_revision := false;
  end if;

  if NEW.is_current_revision = true and not public.report_revision_has_published_analysis_job(NEW.id) then
    NEW.is_current_revision := false;
  end if;

  if NEW.is_current_revision = true and NEW.revision_published_at is null then
    NEW.revision_published_at := now();
  end if;

  return NEW;
end;
$$;

drop trigger if exists reports_apply_revision_defaults_trigger on public.reports;
create trigger reports_apply_revision_defaults_trigger
before insert or update on public.reports
for each row
execute function public.reports_apply_revision_defaults();

create or replace function public.promote_report_revision_to_current(p_report_id uuid)
returns table(promoted boolean, stale boolean, report_id uuid, demoted_report_id uuid, revision_family_key text, revision_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.reports%rowtype;
  v_current public.reports%rowtype;
  v_demoted_report_id uuid := null;
begin
  select *
    into v_target
  from public.reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'REPORT_REVISION_NOT_FOUND: %', p_report_id;
  end if;

  if not public.report_revision_has_published_analysis_job(v_target.id) then
    return query select false, false, v_target.id, null::uuid, v_target.revision_family_key, v_target.revision_number;
    return;
  end if;

  if v_target.revision_family_key is null then
    raise exception 'REPORT_REVISION_FAMILY_KEY_MISSING: %', p_report_id;
  end if;

  perform 1
  from public.reports r
  where r.revision_family_key = v_target.revision_family_key
  for update;

  select *
    into v_current
  from public.reports
  where revision_family_key = v_target.revision_family_key
    and is_current_revision = true
    and public.report_revision_has_published_analysis_job(id)
  order by revision_number desc, created_at desc
  limit 1;

  if found and v_current.id = v_target.id then
    update public.reports
      set revision_published_at = coalesce(revision_published_at, now())
    where id = v_target.id
      and revision_published_at is null;

    return query select true, false, v_target.id, null::uuid, v_target.revision_family_key, v_target.revision_number;
    return;
  end if;

  if found and coalesce(v_current.revision_number, 0) > coalesce(v_target.revision_number, 0) then
    return query select false, true, v_target.id, null::uuid, v_target.revision_family_key, v_target.revision_number;
    return;
  end if;

  if found then
    update public.reports
      set is_current_revision = false
    where id = v_current.id;
    v_demoted_report_id := v_current.id;
  end if;

  update public.reports
    set is_current_revision = true,
        revision_published_at = coalesce(revision_published_at, now())
  where id = v_target.id;

  return query select true, false, v_target.id, v_demoted_report_id, v_target.revision_family_key, v_target.revision_number;
end;
$$;

create or replace function public.analysis_jobs_promote_report_revision_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.report_id is not null and NEW.status = 'published' then
    perform public.promote_report_revision_to_current(NEW.report_id);
  end if;

  return NEW;
end;
$$;

drop trigger if exists analysis_jobs_promote_report_revision_trigger on public.analysis_jobs;
create trigger analysis_jobs_promote_report_revision_trigger
after insert or update of status, report_id on public.analysis_jobs
for each row
when (NEW.status = 'published' and NEW.report_id is not null)
execute function public.analysis_jobs_promote_report_revision_trigger();
