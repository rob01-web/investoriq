-- RPC: consume_purchase_and_create_job
-- Atomically consumes one unconsumed purchase and creates a job for the same user/type.

create or replace function public.consume_purchase_and_create_job(
  p_report_type text,
  p_job_payload jsonb,
  p_staged_files jsonb
)
returns table(job_id uuid, purchase_id uuid)
language plpgsql
as $$
declare
  v_purchase_id uuid;
  v_product_type text;
  v_job_id uuid;
  v_file jsonb;
  v_storage_path text;
  v_original_name text;
  v_content_type text;
  v_size bigint;
  v_doc_type text;
begin
  if p_report_type is null or p_report_type not in ('screening','underwriting') then
    raise exception 'INVALID_REPORT_TYPE';
  end if;

  if p_staged_files is null or jsonb_typeof(p_staged_files) <> 'array' or jsonb_array_length(p_staged_files) = 0 then
    raise exception 'INVALID_STAGED_FILES';
  end if;

  select id, product_type
    into v_purchase_id, v_product_type
  from public.report_purchases
  where user_id = auth.uid()
    and product_type = p_report_type
    and consumed_at is null
  order by created_at asc
  for update skip locked
  limit 1;

  if v_purchase_id is null then
    raise exception 'PURCHASE_NOT_AVAILABLE';
  end if;

  if v_product_type not in ('screening','underwriting') then
    raise exception 'INVALID_REPORT_TYPE';
  end if;

  insert into public.analysis_jobs (
    user_id,
    report_type,
    property_name,
    status,
    started_at
  )
  values (
    auth.uid(),
    v_product_type,
    nullif(p_job_payload->>'property_name',''),
    'needs_documents',
    null
  )
  returning id into v_job_id;

  for v_file in select * from jsonb_array_elements(p_staged_files) loop
    v_storage_path := nullif(trim(v_file->>'storage_path'), '');
    v_original_name := nullif(trim(v_file->>'original_name'), '');
    v_content_type := nullif(trim(v_file->>'content_type'), '');
    v_size := nullif(v_file->>'size','')::bigint;

    if v_storage_path is null or v_original_name is null or v_content_type is null or v_size is null then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if v_storage_path not like ('staged/' || auth.uid()::text || '/%') then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    v_doc_type := case
      when lower(v_original_name) like '%rent%' then 'rent_roll'
      when lower(v_original_name) like '%t12%' then 't12'
      else 'supporting'
    end;

    insert into public.analysis_job_files (
      job_id,
      user_id,
      bucket,
      object_path,
      original_filename,
      mime_type,
      bytes,
      doc_type,
      parse_status
    )
    values (
      v_job_id,
      auth.uid(),
      'staged_uploads',
      v_storage_path,
      v_original_name,
      v_content_type,
      v_size,
      v_doc_type,
      'pending'
    );
  end loop;

  update public.report_purchases
  set job_id = v_job_id,
      consumed_at = now()
  where id = v_purchase_id
    and consumed_at is null;

  if not found then
    raise exception 'PURCHASE_NOT_AVAILABLE';
  end if;

  return query select v_job_id, v_purchase_id;
end;
$$;

