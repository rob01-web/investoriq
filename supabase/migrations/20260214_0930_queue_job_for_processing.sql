CREATE OR REPLACE FUNCTION public.queue_job_for_processing(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_prev_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select status into v_prev_status
  from public.analysis_jobs
  where id = p_job_id and user_id = v_user_id;

  if v_prev_status is null then
    raise exception 'Job not found';
  end if;

  -- Only allow queueing from needs_documents (fail-closed)
  if v_prev_status <> 'needs_documents' then
    raise exception 'Job not eligible to queue (status=%)', v_prev_status;
  end if;

  update public.analysis_jobs
  set
    status = 'queued',
    error_code = null,
    error_message = null
  where id = p_job_id
    and user_id = v_user_id
    and status = 'needs_documents';

  if not found then
    raise exception 'Failed to queue job (concurrent update?)';
  end if;

  insert into public.analysis_job_events (
    job_id,
    actor,
    event_type,
    from_status,
    to_status,
    meta
  ) values (
    p_job_id,
    'user',
    'status_transition',
    'needs_documents',
    'queued',
    jsonb_build_object('source', 'dashboard', 'note', 'User initiated generation')
  );

end;
$function$;
