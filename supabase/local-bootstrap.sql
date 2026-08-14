-- InvestorIQ local/dev bootstrap baseline only.
-- This file is intentionally outside supabase/migrations and must never be
-- treated as production migration history.
--
-- Purpose:
--   Create the minimum pre-migration schema needed to replay the committed
--   Supabase migration chain on a fresh local database.
--
-- Deliberately excluded here:
--   - H6 worker lifecycle columns
--   - H9/H10 report revision lineage columns
--   - RLS state and policy objects
--   - later worker/report helpers and indexes

create extension if not exists pgcrypto;

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_name text,
  status text not null default 'queued',
  error_code text,
  error_message text,
  report_id uuid,
  report_type text not null default 'screening',
  failure_reason text,
  purchase_id uuid,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  constraint analysis_jobs_status_check check (
    status = any (
      array[
        'needs_documents'::text,
        'queued'::text,
        'extracting'::text,
        'underwriting'::text,
        'scoring'::text,
        'rendering'::text,
        'pdf_generating'::text,
        'publishing'::text,
        'published'::text,
        'failed'::text
      ]
    )
  ),
  constraint analysis_jobs_report_type_check check (
    report_type = any (array['screening'::text, 'underwriting'::text, 'ic'::text])
  )
);

create table public.report_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_type text not null,
  job_id uuid,
  consumed_at timestamptz,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  constraint report_purchases_product_type_check check (
    product_type = any (array['screening'::text, 'underwriting'::text])
  )
);

create table public.analysis_job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  user_id uuid not null,
  bucket text not null,
  object_path text not null,
  original_filename text not null,
  mime_type text not null,
  bytes bigint not null,
  doc_type text not null,
  parse_status text not null default 'pending',
  parse_error text,
  sha256 text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint analysis_job_files_job_id_doc_type_key unique (job_id, doc_type)
);

create table public.analysis_job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  actor text not null,
  event_type text not null,
  from_status text,
  to_status text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.disclosure_session_ack_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  disclosure_key text not null,
  disclosure_version text not null,
  disclosure_text_hash text not null,
  session_identifier text not null,
  acknowledged_at timestamptz not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint disclosure_session_ack_events_session_key unique (
    user_id,
    disclosure_version,
    disclosure_text_hash,
    session_identifier
  )
);

create table public.analysis_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  user_id uuid,
  type text not null,
  bucket text not null,
  object_path text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_name text not null,
  report_type text not null default 'screening',
  storage_path text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  constraint reports_report_type_check check (
    report_type = any (array['screening'::text, 'underwriting'::text])
  )
);

alter table public.analysis_jobs
  add constraint analysis_jobs_purchase_id_fkey
  foreign key (purchase_id) references public.report_purchases(id);

alter table public.report_purchases
  add constraint report_purchases_job_id_fkey
  foreign key (job_id) references public.analysis_jobs(id);

alter table public.analysis_job_files
  add constraint analysis_job_files_job_id_fkey
  foreign key (job_id) references public.analysis_jobs(id);

alter table public.analysis_job_events
  add constraint analysis_job_events_job_id_fkey
  foreign key (job_id) references public.analysis_jobs(id);

alter table public.analysis_artifacts
  add constraint analysis_artifacts_job_id_fkey
  foreign key (job_id) references public.analysis_jobs(id);
