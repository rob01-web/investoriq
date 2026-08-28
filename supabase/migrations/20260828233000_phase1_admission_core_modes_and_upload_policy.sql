begin;

-- Phase 1: restore the approved minimum-core admission constitution and align
-- admission provenance with the production analysis_job_files schema.
-- Publishable core modes:
--   dual_source_core
--   t12_minimum_core
--   rent_roll_minimum_core
-- Only insufficient_core is rejected at admission.

create or replace function public.consume_purchase_and_create_job_untrusted_legacy(
  p_report_type text,
  p_job_payload jsonb,
  p_staged_files jsonb
)
returns table(job_id uuid, purchase_id uuid)
language plpgsql
security definer
set search_path = public, storage, auth, pg_temp
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
    v_content_type := lower(nullif(trim(v_file->>'content_type'), ''));
    v_payload_doc_type := lower(trim(v_file->>'doc_type'));

    if v_storage_path is null or v_original_name is null or v_content_type is null then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if v_file->>'size' is null or trim(v_file->>'size') !~ '^[0-9]+$' then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    v_size := trim(v_file->>'size')::bigint;
    if v_size <= 0 or v_size > 52428800 then
      raise exception 'INVALID_STAGED_FILES';
    end if;

    if v_content_type not in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ) then
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
      null;
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
        'doc_type', v_payload_doc_type
      )
    );
  end loop;

  if not v_has_t12 and not v_has_rent_roll then
    raise exception 'MISSING_REQUIRED_CORE_DOCUMENTS'
      using detail = 'Upload a Rent Roll or a T12 before starting analysis.';
  end if;

  -- Supporting documents enrich Underwriting but are not an admission prerequisite.

  for v_file in select * from jsonb_array_elements(v_normalized_files) loop
    v_storage_path := nullif(trim(v_file->>'storage_path'), '');
    v_size := (v_file->>'size')::bigint;
    v_content_type := lower(nullif(trim(v_file->>'content_type'), ''));

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

    if lower(coalesce(v_storage_object_row.metadata->>'mimetype', '')) <> v_content_type then
      raise exception 'INVALID_STAGED_FILES';
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

revoke all on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) from public;
revoke all on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) from anon;
revoke all on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) from authenticated;
grant execute on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) to service_role;

create or replace function public.consume_purchase_and_create_job(
  p_report_type text,
  p_job_payload jsonb,
  p_staged_files jsonb
)
returns table(job_id uuid, purchase_id uuid)
language plpgsql
security definer
set search_path = public, storage, auth, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_session_identifier text := coalesce(
    nullif(auth.jwt()->>'session_id', ''),
    nullif(auth.jwt()->>'jti', '')
  );
  v_job_id uuid;
  v_purchase_id uuid;
  v_product_identity text;
  v_report_family text;
  v_manifest jsonb;
  v_receipt_id uuid;
  v_file_count integer;
  v_object_count integer;
  v_has_core_file boolean;
begin
  if v_uid is null then
    raise exception 'ADMISSION_UNAUTHENTICATED';
  end if;
  if p_report_type not in ('screening', 'underwriting') then
    raise exception 'ADMISSION_UNSUPPORTED_PRODUCT';
  end if;
  if v_session_identifier is null then
    raise exception 'ADMISSION_DISCLOSURE_SESSION_IDENTIFIER_MISSING';
  end if;

  if not exists (
    select 1
    from public.disclosure_session_ack_events d
    where d.user_id = v_uid
      and d.disclosure_key = 'analysis_disclosures'
      and d.disclosure_version = 'v2026-08-02'
      and d.disclosure_text_hash = '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340'
      and d.session_identifier = v_session_identifier
  ) then
    raise exception 'ADMISSION_CURRENT_DISCLOSURE_SESSION_REQUIRED';
  end if;

  select x.job_id, x.purchase_id
    into v_job_id, v_purchase_id
  from public.consume_purchase_and_create_job_untrusted_legacy(
    p_report_type,
    p_job_payload,
    p_staged_files
  ) x
  limit 1;

  if v_job_id is null or v_purchase_id is null then
    raise exception 'ADMISSION_LEGACY_TRANSACTION_DID_NOT_RETURN_LINEAGE';
  end if;

  if not exists (
    select 1 from public.analysis_jobs j
    where j.id = v_job_id
      and j.user_id = v_uid
      and j.purchase_id = v_purchase_id
      and j.status = 'queued'
      and j.report_type = p_report_type
  ) then
    raise exception 'ADMISSION_JOB_LINEAGE_INVALID';
  end if;

  if not exists (
    select 1 from public.report_purchases p
    where p.id = v_purchase_id
      and p.user_id = v_uid
      and p.job_id = v_job_id
      and p.consumed_at is not null
      and p.product_type = p_report_type
  ) then
    raise exception 'ADMISSION_PURCHASE_LINEAGE_INVALID';
  end if;

  select count(*),
         bool_or(lower(coalesce(f.doc_type, '')) in ('rent_roll', 't12', 't12_or_operating_statement'))
    into v_file_count, v_has_core_file
  from public.analysis_job_files f
  where f.job_id = v_job_id and f.user_id = v_uid;

  select count(*) into v_object_count
  from public.analysis_job_files f
  join storage.objects o
    on o.bucket_id = 'staged_uploads'
   and o.name = f.object_path
  where f.job_id = v_job_id
    and f.user_id = v_uid
    and f.bucket = 'staged_uploads'
    and o.name like ('staged/' || v_uid::text || '/%')
    and nullif(o.metadata->>'size', '') is not null
    and (o.metadata->>'size') ~ '^[0-9]+$'
    and (o.metadata->>'size')::bigint = f.bytes
    and lower(coalesce(o.metadata->>'mimetype', '')) = lower(coalesce(f.mime_type, ''));

  if v_file_count < 1 or coalesce(v_has_core_file, false) is false or v_object_count <> v_file_count then
    raise exception 'ADMISSION_STAGED_OBJECT_METADATA_MISMATCH';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'job_file_id', f.id,
      'bucket', f.bucket,
      'object_path', f.object_path,
      'doc_type', f.doc_type,
      'bytes', f.bytes,
      'mime_type', f.mime_type,
      'storage_size', (o.metadata->>'size')::bigint,
      'storage_mimetype', o.metadata->>'mimetype',
      'storage_created_at', o.created_at,
      'storage_updated_at', o.updated_at
    ) order by f.uploaded_at, f.id
  )
  into v_manifest
  from public.analysis_job_files f
  join storage.objects o
    on o.bucket_id = 'staged_uploads'
   and o.name = f.object_path
  where f.job_id = v_job_id and f.user_id = v_uid;

  v_product_identity := case when p_report_type = 'underwriting' then 'full_underwriting' else 'screening' end;
  v_report_family := v_product_identity;

  insert into public.analysis_job_admission_receipts (
    job_id, purchase_id, user_id, report_type, product_identity, report_family,
    disclosure_key, disclosure_version, disclosure_text_hash,
    disclosure_session_identifier, staged_source_manifest
  ) values (
    v_job_id, v_purchase_id, v_uid, p_report_type, v_product_identity, v_report_family,
    'analysis_disclosures', 'v2026-08-02',
    '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340',
    v_session_identifier, coalesce(v_manifest, '[]'::jsonb)
  )
  returning id into v_receipt_id;

  update public.analysis_jobs
     set product_identity = v_product_identity,
         report_family = v_report_family,
         admission_receipt_id = v_receipt_id,
         terminal_domain = null,
         last_checkpoint = 'admitted',
         last_checkpoint_at = now()
   where id = v_job_id and user_id = v_uid;

  insert into public.analysis_job_events(job_id, actor, event_type, from_status, to_status, meta)
  values (
    v_job_id,
    'admission_authority',
    'job_admitted',
    null,
    'queued',
    jsonb_build_object(
      'admission_receipt_id', v_receipt_id,
      'purchase_id', v_purchase_id,
      'product_identity', v_product_identity,
      'report_family', v_report_family,
      'disclosure_version', 'v2026-08-02'
    )
  );

  job_id := v_job_id;
  purchase_id := v_purchase_id;
  return next;
end;
$$;

revoke all on function public.consume_purchase_and_create_job(text, jsonb, jsonb) from public;
revoke all on function public.consume_purchase_and_create_job(text, jsonb, jsonb) from anon;
grant execute on function public.consume_purchase_and_create_job(text, jsonb, jsonb) to authenticated;
grant execute on function public.consume_purchase_and_create_job(text, jsonb, jsonb) to service_role;

-- Enforce the same customer upload envelope at the Storage bucket boundary.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]::text[]
where id = 'staged_uploads';

commit;
