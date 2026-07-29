-- H5-B: authoritative staged-source registration guard.
-- Replaces consume_purchase_and_create_job with a transaction-safe version that
-- validates staged objects against storage.objects before any entitlement is consumed.

create or replace function public.consume_purchase_and_create_job(
  p_report_type text,
  p_job_payload jsonb,
  p_staged_files jsonb
)
returns table(job_id uuid, purchase_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_product_type text;
  v_job_id uuid;
  v_file jsonb;
  v_storage_path text;
  v_path_prefix text;
  v_path_suffix text;
  v_path_segment text;
  v_original_name text;
  v_content_type text;
  v_size bigint;
  v_doc_type text;
  v_payload_doc_type text;
  v_has_t12 boolean := false;
  v_has_rent_roll boolean := false;
  v_has_supporting_docs boolean := false;
  v_seen_storage_paths text[] := array[]::text[];
  v_normalized_files jsonb := '[]'::jsonb;
  v_storage_object_row storage.objects%rowtype;
  v_object_size_text text;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_report_type is null or p_report_type not in ('screening','underwriting') then
    raise exception 'INVALID_REPORT_TYPE';
  end if;

  if p_staged_files is null or jsonb_typeof(p_staged_files) <> 'array' or jsonb_array_length(p_staged_files) = 0 then
    raise exception 'INVALID_STAGED_FILES';
  end if;

  for v_file in select * from jsonb_array_elements(p_staged_files) loop
    if v_file is null or jsonb_typeof(v_file) <> 'object' then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if v_file->'doc_type' is null or jsonb_typeof(v_file->'doc_type') <> 'string' or nullif(trim(v_file->>'doc_type'), '') is null then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    v_storage_path := nullif(trim(v_file->>'storage_path'), '');
    v_original_name := nullif(trim(v_file->>'original_name'), '');
    v_content_type := nullif(trim(v_file->>'content_type'), '');
    v_payload_doc_type := lower(trim(v_file->>'doc_type'));

    if v_storage_path is null or v_original_name is null or v_content_type is null then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if v_file->>'size' is null or trim(v_file->>'size') !~ '^[0-9]+$' then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    v_size := trim(v_file->>'size')::bigint;
    if v_size <= 0 then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    v_path_prefix := 'staged/' || auth.uid()::text || '/';
    if left(v_storage_path, length(v_path_prefix)) <> v_path_prefix then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    v_path_suffix := substring(v_storage_path from length(v_path_prefix) + 1);
    if v_path_suffix is null or v_path_suffix = '' then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if position(E'\\' in v_storage_path) > 0 or v_storage_path ~ '[[:cntrl:]]' then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    for v_path_segment in select * from unnest(regexp_split_to_array(v_path_suffix, '/')) loop
      if v_path_segment is null or v_path_segment = '' or v_path_segment in ('.', '..') then
        raise exception 'INVALID_STAGED_FILES';
      end if;
    end loop;

    if v_storage_path = any(v_seen_storage_paths) then
      raise exception 'INVALID_STAGED_FILES';
    end if;
    v_seen_storage_paths := array_append(v_seen_storage_paths, v_storage_path);

    if v_payload_doc_type in ('rent_roll', 't12', 't12_or_operating_statement') then
      if v_payload_doc_type = 'rent_roll' then
        v_has_rent_roll := true;
      else
        v_has_t12 := true;
      end if;
    elsif v_payload_doc_type in ('supporting', 'supporting_documents', 'supporting_documents_ui') then
      v_has_supporting_docs := true;
    else
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if v_payload_doc_type = 't12_or_operating_statement' then
      v_payload_doc_type := 't12';
    elsif v_payload_doc_type in ('supporting_documents', 'supporting_documents_ui') then
      v_payload_doc_type := 'supporting';
    end if;

    v_normalized_files := v_normalized_files || jsonb_build_array(
      jsonb_build_object(
        'storage_path', v_storage_path,
        'original_name', v_original_name,
        'content_type', v_content_type,
        'size', v_size,
        'doc_type', case
          when v_payload_doc_type = 't12_or_operating_statement' then 't12'
          when v_payload_doc_type in ('rent_roll', 't12', 'supporting', 'supporting_documents', 'supporting_documents_ui') then v_payload_doc_type
          else null
        end
      )
    );
  end loop;

  if not v_has_t12 or not v_has_rent_roll then
    raise exception 'MISSING_REQUIRED_CORE_DOCUMENTS';
  end if;

  if p_report_type = 'underwriting' and not v_has_supporting_docs then
    raise exception 'MISSING_REQUIRED_SUPPORTING_DOCUMENT';
  end if;

  for v_file in select * from jsonb_array_elements(v_normalized_files) loop
    v_storage_path := nullif(trim(v_file->>'storage_path'), '');
    v_size := (v_file->>'size')::bigint;

    select *
      into strict v_storage_object_row
    from storage.objects
    where bucket_id = 'staged_uploads'
      and name = v_storage_path
    for update;

    v_object_size_text := nullif(trim(v_storage_object_row.metadata->>'size'), '');
    if v_object_size_text is not null then
      if v_object_size_text !~ '^[0-9]+$' then
        raise exception 'INVALID_STAGED_FILES';
      end if;

      if v_object_size_text::bigint <> v_size then
        raise exception 'INVALID_STAGED_FILES';
      end if;
    end if;
  end loop;

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
    purchase_id,
    property_name,
    status,
    started_at
  )
  values (
    auth.uid(),
    v_product_type,
    v_purchase_id,
    nullif(p_job_payload->>'property_name',''),
    'queued',
    null
  )
  returning id into v_job_id;

  for v_file in select * from jsonb_array_elements(v_normalized_files) loop
    v_storage_path := nullif(trim(v_file->>'storage_path'), '');
    v_original_name := nullif(trim(v_file->>'original_name'), '');
    v_content_type := nullif(trim(v_file->>'content_type'), '');
    v_size := (v_file->>'size')::bigint;
    v_doc_type := lower(trim(coalesce(v_file->>'doc_type', '')));

    if v_doc_type = '' then
      raise exception 'INVALID_STAGED_FILES';
    end if;

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
