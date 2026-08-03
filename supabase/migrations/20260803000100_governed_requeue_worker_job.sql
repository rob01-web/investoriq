-- Governed atomic requeue for Admin Dashboard retry.
-- Completes the full retry transition for failed/dead_letter jobs whose
-- original purchase is either still linked or was restored via entitlement_restored.
-- Either the whole transition commits or nothing changes.

create or replace function public.governed_requeue_worker_job(
  p_job_id uuid,
  p_claimed_by text default null
)
returns table(
  job_id uuid,
  previous_status text,
  new_status text,
  purchase_id uuid,
  purchase_already_linked boolean,
  purchase_rebound boolean,
  credit_balance_changed boolean,
  new_job_created boolean,
  new_purchase_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_job public.analysis_jobs%rowtype;
  v_prev_status text;
  v_purchase_id uuid := null;
  v_already_linked boolean := false;
  v_rebound boolean := false;
  v_restore_purchase_ids uuid[];
  v_restore_count int := 0;
  v_purchase public.report_purchases%rowtype;
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
begin
  if p_job_id is null then
    raise exception 'GOVERNED_REQUEUE_MISSING_JOB_ID';
  end if;

  select *
    into v_job
  from public.analysis_jobs j
  where j.id = p_job_id
  for update;

  if not found then
    raise exception 'GOVERNED_REQUEUE_JOB_NOT_FOUND';
  end if;

  v_prev_status := v_job.status;

  if v_job.status = 'published' then
    raise exception 'GOVERNED_REQUEUE_PUBLISHED_BLOCKED';
  end if;

  if v_job.status not in ('failed', 'dead_letter') then
    raise exception 'GOVERNED_REQUEUE_STATUS_NOT_ELIGIBLE';
  end if;

  -- CASE A: purchase still linked and consumed
  select rp.id
    into v_purchase_id
  from public.report_purchases rp
  where rp.job_id = p_job_id
    and rp.consumed_at is not null
    and rp.user_id = v_job.user_id
    and (
      v_job.report_type is null
      or rp.product_type is null
      or rp.product_type = v_job.report_type
    )
  order by rp.created_at asc, rp.id asc
  for update
  limit 1;

  if v_purchase_id is not null then
    v_already_linked := true;
  else
    -- CASE B: identify exact original purchase from entitlement_restored lineage only
    select array_agg(distinct (e.meta->>'purchase_id')::uuid)
      into v_restore_purchase_ids
    from public.analysis_job_events e
    where e.job_id = p_job_id
      and e.event_type = 'entitlement_restored'
      and e.meta is not null
      and nullif(btrim(e.meta->>'purchase_id'), '') is not null
      and (e.meta->>'purchase_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    v_restore_count := coalesce(array_length(v_restore_purchase_ids, 1), 0);

    if v_restore_count = 0 then
      raise exception 'GOVERNED_REQUEUE_NO_LINKED_OR_RESTORED_PURCHASE';
    end if;

    if v_restore_count > 1 then
      raise exception 'GOVERNED_REQUEUE_AMBIGUOUS_PURCHASE_LINEAGE';
    end if;

    v_purchase_id := v_restore_purchase_ids[1];

    select *
      into v_purchase
    from public.report_purchases rp
    where rp.id = v_purchase_id
    for update;

    if not found then
      raise exception 'GOVERNED_REQUEUE_RESTORE_PURCHASE_NOT_FOUND';
    end if;

    if v_purchase.user_id is distinct from v_job.user_id then
      raise exception 'GOVERNED_REQUEUE_WRONG_USER_PURCHASE';
    end if;

    if v_job.report_type is not null
       and v_purchase.product_type is not null
       and v_purchase.product_type is distinct from v_job.report_type then
      raise exception 'GOVERNED_REQUEUE_WRONG_PRODUCT_TYPE';
    end if;

    if v_purchase.job_id is not null and v_purchase.job_id is distinct from p_job_id then
      raise exception 'GOVERNED_REQUEUE_PURCHASE_BOUND_TO_OTHER_JOB';
    end if;

    if v_purchase.consumed_at is not null and v_purchase.job_id = p_job_id then
      v_already_linked := true;
    elsif v_purchase.consumed_at is not null and v_purchase.job_id is null then
      raise exception 'GOVERNED_REQUEUE_PURCHASE_CONSUMED_UNBOUND';
    elsif v_purchase.job_id is not null and v_purchase.job_id = p_job_id and v_purchase.consumed_at is null then
      update public.report_purchases rp
         set consumed_at = v_now
       where rp.id = v_purchase_id
         and rp.job_id = p_job_id
         and rp.consumed_at is null;
      v_already_linked := true;
    else
      update public.report_purchases rp
         set job_id = p_job_id,
             consumed_at = v_now
       where rp.id = v_purchase_id
         and rp.job_id is null
         and rp.consumed_at is null
         and rp.user_id = v_job.user_id;

      if not found then
        raise exception 'GOVERNED_REQUEUE_REBIND_REJECTED';
      end if;

      update public.analysis_jobs j
         set purchase_id = v_purchase_id
       where j.id = p_job_id
         and j.status in ('failed', 'dead_letter');

      if not found then
        raise exception 'GOVERNED_REQUEUE_JOB_PURCHASE_ID_UPDATE_REJECTED';
      end if;

      v_rebound := true;
    end if;
  end if;

  update public.analysis_jobs j
     set status = 'queued',
         started_at = null,
         worker_attempt_id = null,
         worker_lease_expires_at = null,
         worker_claimed_at = null,
         worker_last_heartbeat_at = null,
         worker_claimed_by = null,
         dead_lettered_at = null,
         error_code = null,
         error_message = null,
         failure_reason = null,
         purchase_id = coalesce(j.purchase_id, v_purchase_id)
   where j.id = p_job_id
     and j.status in ('failed', 'dead_letter');

  if not found then
    raise exception 'GOVERNED_REQUEUE_JOB_RESET_REJECTED';
  end if;

  job_id := p_job_id;
  previous_status := v_prev_status;
  new_status := 'queued';
  purchase_id := v_purchase_id;
  purchase_already_linked := v_already_linked;
  purchase_rebound := v_rebound;
  credit_balance_changed := false;
  new_job_created := false;
  new_purchase_created := false;
  return next;
end;
$$;

revoke all on function public.governed_requeue_worker_job(uuid, text) from public;
revoke all on function public.governed_requeue_worker_job(uuid, text) from anon;
revoke all on function public.governed_requeue_worker_job(uuid, text) from authenticated;
grant execute on function public.governed_requeue_worker_job(uuid, text) to service_role;
