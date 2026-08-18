begin;

create table if not exists public.customer_report_removals (
  report_id uuid primary key references public.reports(id) on delete cascade,
  user_id uuid not null,
  removed_by_actor_id uuid not null,
  removed_by_role text not null check (removed_by_role in ('customer', 'admin')),
  removed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists customer_report_removals_user_id_idx
  on public.customer_report_removals(user_id);

alter table public.customer_report_removals enable row level security;
alter table public.customer_report_removals no force row level security;

revoke all on table public.customer_report_removals from anon, authenticated;

drop function if exists public.is_current_user_report_removed(uuid);
create function public.is_current_user_report_removed(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.customer_report_removals r
    where r.report_id = p_report_id
      and r.user_id = auth.uid()
  );
$$;

revoke all on function public.is_current_user_report_removed(uuid) from public;
grant execute on function public.is_current_user_report_removed(uuid) to authenticated;

-- P0-A2: customers no longer read internal constitutional artifacts directly.
drop policy if exists analysis_artifacts_select_own on public.analysis_artifacts;
revoke select on table public.analysis_artifacts from authenticated;

-- P0-A2: authoritative report rows are no longer directly customer-deletable.
drop policy if exists "Users can delete their own reports" on public.reports;
revoke delete on table public.reports from anon, authenticated;

-- Customer-visible report reads exclude governed removal tombstones.
drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can view their own reports"
on public.reports
for select
to public
using (
  auth.uid() = user_id
  and not public.is_current_user_report_removed(id)
);

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own
on public.reports
for select
to authenticated
using (
  user_id = auth.uid()
  and not public.is_current_user_report_removed(id)
);

commit;
