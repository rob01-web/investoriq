create or replace function public.transition_worker_job(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_expected_current_status text,
  p_next_status text,
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
begin
  return query
  update public.analysis_jobs j
     set status = p_next_status,
         started_at = case
           when p_next_status = 'queued' then null
           else j.started_at
         end,
         worker_last_heartbeat_at = case
           when p_next_status = 'queued' then null
           else v_now
         end,
         worker_lease_expires_at = case
           when p_next_status in ('queued', 'published', 'failed', 'dead_letter') then null
           else v_now + public.worker_lease_duration()
         end,
         worker_attempt_id = case
           when p_next_status = 'queued' then null
           else j.worker_attempt_id
         end,
         worker_claimed_at = case
           when p_next_status = 'queued' then null
           else j.worker_claimed_at
         end,
         worker_claimed_by = case
           when p_next_status = 'queued' then null
           else j.worker_claimed_by
         end,
         dead_lettered_at = case
           when p_next_status = 'queued' then null
           else j.dead_lettered_at
         end,
         error_code = case
           when p_next_status = 'queued' then null
           else j.error_code
         end,
         error_message = case
           when p_next_status = 'queued' then null
           else j.error_message
         end,
         failure_reason = case
           when p_next_status = 'queued' then null
           else j.failure_reason
         end
   where j.id = p_job_id
     and j.worker_attempt_id = p_worker_attempt_id
     and j.worker_claimed_by = v_claimed_by
     and j.status = p_expected_current_status
     and j.dead_lettered_at is null
     and (
       p_expected_current_status = 'queued'
       or (j.worker_lease_expires_at is not null and j.worker_lease_expires_at > v_now)
     )
  returning j.*;
end;
$$;
