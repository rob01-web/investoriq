-- Align analysis_jobs_status_check with the canonical H6 terminal status contract.
-- Adds only 'dead_letter'. No row updates, RPC changes, or other constraint changes.

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_status_check;

alter table public.analysis_jobs
  add constraint analysis_jobs_status_check
  check (
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
        'failed'::text,
        'dead_letter'::text
      ]
    )
  );
