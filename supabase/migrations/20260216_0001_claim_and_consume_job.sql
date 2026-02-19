-- Creates an atomic claim + consume RPC.
-- Deterministic. Fail-closed. No partial state.

create or replace function public.claim_and_consume_job(
  p_job_id uuid,
  p_started_at timestamptz default now()
)
returns table (job_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  -- 1) Claim the job (must be queued)
  update public.analysis_jobs
  set
    status = 'extracting',
    started_at = p_started_at,
    error_code = null,
    error_message = null
  where id = p_job_id
    and status = 'queued'
  returning id into v_job_id;

  if v_job_id is null then
    raise exception 'JOB_NOT_CLAIMABLE: %', p_job_id
      using errcode = 'P0001';
  end if;

  return query select v_job_id;
end;
$$;

revoke all on function public.claim_and_consume_job(uuid, timestamptz) from public;
grant execute on function public.claim_and_consume_job(uuid, timestamptz) to authenticated;
grant execute on function public.claim_and_consume_job(uuid, timestamptz) to service_role;
