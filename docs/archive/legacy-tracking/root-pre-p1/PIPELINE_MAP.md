# InvestorIQ Pipeline Map (Read-Only Inventory)

This file is a deterministic inventory of the current pipeline code paths from user action to PDF generation and publish, based solely on existing files and behavior.

## A) Entrypoints (frontend + API routes + workers)

**Frontend**
- `src/pages/Dashboard.jsx`
  - `handleUpload()` and `handleUploadSuccess()` create a job via RPC and upload files.
  - `handleAnalyze()` queues a job via RPC (`queue_job_for_processing`).
  - Revisions are not user-triggered; regeneration is admin-controlled.

**API / Serverless Routes**
- `api/admin-run-worker.js`
  - Main orchestration loop for job status transitions and parsing, report generation, and publish flow.
- `api/admin/run-eligible-jobs-once.js`
  - Admin runner: selects eligible queued jobs, claims them (sets status to extracting), logs events.
  - Forced `job_id` path: requeues a specific job.
  - `action: "regenerate_pdf"`: calls `/api/generate-client-report` for an existing job.
- `api/generate-client-report.js`
  - Builds HTML, calls DocRaptor, stores PDF, updates report rows, logs artifacts.
- `api/parse/parse-doc.js`
  - Unified parser for `rent_roll`, `t12`, `other`.
- `api/parse/extract-job-text.js`
  - Textract-based extraction; writes parse artifacts and statuses.
- `api/parse/classify-documents.js`
  - Document classification; writes artifacts and parse status.
- `api/jobs/request-revision.js`
  - Returns a fail-closed 403 (regeneration is admin-controlled).
- `api/admin/queue-metrics.js`
  - Admin observability data for jobs and issues.

**Cron / Scheduler**
- `.github/workflows/worker-kick.yml`
  - Every 5 minutes calls `POST https://investoriq.tech/api/admin/run-eligible-jobs-once` with `ADMIN_RUN_KEY`.

## B) Status transitions (from -> to, and where)

**Job creation**
- `consume_purchase_and_create_job` (RPC): creates `analysis_jobs` with `status = 'needs_documents'`.
  - File: `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`

**Queue / claim**
- `Dashboard.handleAnalyze()` -> `queue_job_for_processing` RPC sets job to queued.
  - File: `src/pages/Dashboard.jsx`
  - RPC file: `supabase/migrations/20260214_0930_queue_job_for_processing.sql`
- `admin-run-worker.js`: claims `queued -> extracting` via conditional update.
  - File: `api/admin-run-worker.js`
- `run-eligible-jobs-once.js`: claims `queued -> extracting` for queued jobs.
  - File: `api/admin/run-eligible-jobs-once.js`
- Forced admin requeue: `status -> queued` for a specific `job_id`.
  - File: `api/admin/run-eligible-jobs-once.js`

**Processing pipeline (admin-run-worker)**
- `extracting -> underwriting`
- `underwriting -> scoring`
- `scoring -> rendering`
- `rendering -> pdf_generating`
- `pdf_generating -> publishing`
- `publishing -> published`
  - File: `api/admin-run-worker.js`

**Failure / blocked**
- `rendering -> needs_documents` (missing required parsed artifacts)
  - File: `api/admin-run-worker.js`
- `any stage -> failed` on errors/timeouts
  - File: `api/admin-run-worker.js`

## C) Run/rate/limit enforcement points

- **Purchase consumption + job creation**
  - `consume_purchase_and_create_job` uses `report_purchases` and `auth.uid()` with `FOR UPDATE SKIP LOCKED`.
  - Enforces report_type and creates jobs in `needs_documents`.
  - File: `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`

## D) DocRaptor call sites

- `api/generate-client-report.js`
  - POSTs to `https://docraptor.com/docs`.
  - Payload: `{ test, document_content: htmlString, name, document_type: "pdf" }`.
  - On failure: logs error and returns 500; may set job failed when HTML integrity fails earlier.

## E) Storage writes (PDFs/HTML/etc.)

- `generated_reports` bucket:
  - PDF stored at `${user_id}/${report_id}.pdf`.
  - File: `api/generate-client-report.js`

- `analysis_artifacts` (object_path conventions):
  - Status transitions, worker events, HTML integrity logs, missing-docs events, parser events.
  - Files: `api/admin-run-worker.js`, `api/parse/parse-doc.js`, `api/parse/extract-job-text.js`, `api/generate-client-report.js`

- `analysis_job_files`:
  - Inserted from uploads in `src/pages/Dashboard.jsx`.
  - parse_status updates in `api/parse/parse-doc.js` and `api/parse/extract-job-text.js`.

## F) Event/artifact logging

- `analysis_artifacts`:
  - `status_transition`, `worker_event` (extracting_started/completed, parser_completed, report_html_integrity, missing_required_documents, etc.).
  - Primary file: `api/admin-run-worker.js`
  - Also from `api/generate-client-report.js`, `api/parse/parse-doc.js`, `api/parse/extract-job-text.js`

- `analysis_job_events`:
  - Admin run claims and forced requeue, admin regenerate PDF.
  - Files: `api/admin/run-eligible-jobs-once.js`

## G) Cron wiring

- GitHub Actions: `.github/workflows/worker-kick.yml`
  - Calls `POST /api/admin/run-eligible-jobs-once` every 5 minutes.

## H) Legacy/duplicate/possible mismatch observations (no refactors)

- `queue_job_for_processing` is defined in `supabase/migrations/20260214_0930_queue_job_for_processing.sql` and used by `Dashboard.handleAnalyze()`.
- Both `handleUploadSuccess()` and `handleUpload()` attempt job creation via `consume_purchase_and_create_job`. This may be intentional but is duplicated.
