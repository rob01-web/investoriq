alter table public.analysis_jobs enable row level security;
alter table public.analysis_job_files enable row level security;
alter table public.analysis_artifacts enable row level security;
alter table public.reports enable row level security;

alter table public.analysis_jobs no force row level security;
alter table public.analysis_job_files no force row level security;
alter table public.analysis_artifacts no force row level security;
alter table public.reports no force row level security;

drop policy if exists analysis_artifacts_insert_own on public.analysis_artifacts;
create policy analysis_artifacts_insert_own
on public.analysis_artifacts
for insert
to authenticated
with check ((user_id = auth.uid()));

drop policy if exists analysis_artifacts_select_own on public.analysis_artifacts;
create policy analysis_artifacts_select_own
on public.analysis_artifacts
for select
to authenticated
using ((user_id = auth.uid()));

drop policy if exists ajf_insert_own_job on public.analysis_job_files;
create policy ajf_insert_own_job
on public.analysis_job_files
for insert
to public
with check ((exists (
  select 1
  from analysis_jobs j
  where ((j.id = analysis_job_files.job_id) and (j.user_id = auth.uid()))
)));

drop policy if exists ajf_select_own_job on public.analysis_job_files;
create policy ajf_select_own_job
on public.analysis_job_files
for select
to public
using ((exists (
  select 1
  from analysis_jobs j
  where ((j.id = analysis_job_files.job_id) and (j.user_id = auth.uid()))
)));

drop policy if exists ajf_update_own_job on public.analysis_job_files;
create policy ajf_update_own_job
on public.analysis_job_files
for update
to public
using ((exists (
  select 1
  from analysis_jobs j
  where ((j.id = analysis_job_files.job_id) and (j.user_id = auth.uid()))
)))
with check ((exists (
  select 1
  from analysis_jobs j
  where ((j.id = analysis_job_files.job_id) and (j.user_id = auth.uid()))
)));

drop policy if exists analysis_job_files_insert_own on public.analysis_job_files;
create policy analysis_job_files_insert_own
on public.analysis_job_files
for insert
to authenticated
with check ((user_id = auth.uid()));

drop policy if exists analysis_job_files_select_own on public.analysis_job_files;
create policy analysis_job_files_select_own
on public.analysis_job_files
for select
to authenticated
using ((user_id = auth.uid()));

drop policy if exists analysis_jobs_insert_own on public.analysis_jobs;
create policy analysis_jobs_insert_own
on public.analysis_jobs
for insert
to authenticated
with check ((user_id = auth.uid()));

drop policy if exists analysis_jobs_select_own on public.analysis_jobs;
create policy analysis_jobs_select_own
on public.analysis_jobs
for select
to authenticated
using ((user_id = auth.uid()));

drop policy if exists "Users can delete their own reports" on public.reports;
create policy "Users can delete their own reports"
on public.reports
for delete
to public
using ((auth.uid() = user_id));

drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can view their own reports"
on public.reports
for select
to public
using ((auth.uid() = user_id));

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own
on public.reports
for select
to authenticated
using ((user_id = auth.uid()));
