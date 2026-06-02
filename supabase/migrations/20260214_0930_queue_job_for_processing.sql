CREATE OR REPLACE FUNCTION public.queue_job_for_processing(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_prev_status text;
  v_report_type text;
  v_has_t12 boolean := false;
  v_has_rent_roll boolean := false;
  v_has_supporting_docs boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select status, report_type into v_prev_status, v_report_type
  from public.analysis_jobs
  where id = p_job_id and user_id = v_user_id;

  if v_prev_status is null then
    raise exception 'Job not found';
  end if;

  select
    bool_or(lower(coalesce(doc_type, '')) = 'rent_roll'),
    bool_or(lower(coalesce(doc_type, '')) in ('t12', 't12_or_operating_statement')),
    bool_or(lower(coalesce(doc_type, '')) not in ('rent_roll', 't12', 't12_or_operating_statement'))
  into v_has_rent_roll, v_has_t12, v_has_supporting_docs
  from public.analysis_job_files
  where job_id = p_job_id and user_id = v_user_id;

  if not coalesce(v_has_t12, false) or not coalesce(v_has_rent_roll, false) then
    raise exception 'MISSING_REQUIRED_CORE_DOCUMENTS';
  end if;

  if v_report_type = 'underwriting' and not coalesce(v_has_supporting_docs, false) then
    raise exception 'MISSING_REQUIRED_SUPPORTING_DOCUMENT';
  end if;

  -- Allow queueing from queued for new jobs; keep needs_documents only for historical compatibility.
  if v_prev_status not in ('queued', 'needs_documents') then
    raise exception 'Job not eligible to queue (status=%)', v_prev_status;
  end if;

  update public.analysis_jobs
  set
    status = 'queued',
    error_code = null,
    error_message = null
  where id = p_job_id
    and user_id = v_user_id
    and status in ('queued', 'needs_documents');

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
    v_prev_status,
    'queued',
    jsonb_build_object('source', 'dashboard', 'note', 'User initiated generation')
  );

end;
$function$;
