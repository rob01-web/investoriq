# InvestorIQ Pipeline Map (Read-Only Inventory)

This file is a deterministic inventory of the current pipeline code paths from user action to PDF generation and publish, based solely on existing files and behavior.

## A) Entrypoints (frontend + API routes + workers)

**Frontend**
- `src/pages/Dashboard.jsx`
  - `handleUpload()` and `handleUploadSuccess()` create a job via RPC and upload files.
  - `handleAnalyze()` queues a job via RPC (`queue_job_for_processing`).
  - Revisions: `/api/jobs/request-revision` is called for revision requests.

**API / Serverless Routes**
- `api/admin-run-worker.js`
  - Main orchestration loop for job status transitions and parsing, report generation, and publish flow.
- `api/admin/run-eligible-jobs-once.js`
  - Admin runner: selects eligible queued jobs, claims them (sets status to extracting), logs events.
  - Forced `job_id` path: requeues a specific job.
  - `action: "regenerate_pdf"`: calls `/api/generate-client-report` for an existing job.
- `api/generate-client-report.js`
  - Builds HTML, calls DocRaptor, stores PDF, updates report rows, logs artifacts.
  - Uses generation slot RPCs for run limits.
- `api/parse/parse-doc.js`
  - Unified parser for `rent_roll`, `t12`, `other`.
- `api/parse/extract-job-text.js`
  - Textract-based extraction; writes parse artifacts and statuses.
- `api/parse/classify-documents.js`
  - Document classification; writes artifacts and parse status.
- `api/jobs/request-revision.js`
  - Revision request: consumes revision slot and requeues job.
- `api/admin/queue-metrics.js`
  - Admin observability data for jobs and issues.

**Cron / Scheduler**
- `.github/workflows/worker-kick.yml`
  - Every 5 minutes calls `POST https://investoriq.tech/api/admin/run-eligible-jobs-once` with `ADMIN_RUN_KEY`.

## B) Status transitions (from → to, and where)

**Job creation**
- `consume_purchase_and_create_job` (RPC): creates `analysis_jobs` with `status = 'needs_documents'`.
  - File: `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`

**Queue / claim**
- `Dashboard.handleAnalyze()` → `queue_job_for_processing` RPC sets job to queued (RPC definition not found in repo).
  - File: `src/pages/Dashboard.jsx`
- `admin-run-worker.js`: claims `queued → extracting` via conditional update.
  - File: `api/admin-run-worker.js`
- `run-eligible-jobs-once.js`: claims `queued → extracting` for eligible jobs.
  - File: `api/admin/run-eligible-jobs-once.js`
- `request-revision`: `status → queued` on revision.
  - File: `api/jobs/request-revision.js`
- Forced admin requeue: `status → queued` for a specific `job_id`.
  - File: `api/admin/run-eligible-jobs-once.js`

**Processing pipeline (admin-run-worker)**
- `extracting → underwriting`
- `underwriting → scoring`
- `scoring → rendering`
- `rendering → pdf_generating`
- `pdf_generating → publishing`
- `publishing → published`
  - File: `api/admin-run-worker.js`

**Failure / blocked**
- `rendering → needs_documents` (missing required parsed artifacts)
  - File: `api/admin-run-worker.js`
- `any stage → failed` on errors/timeouts
  - File: `api/admin-run-worker.js`

## C) Run/rate/limit enforcement points

- **Purchase consumption + job creation**
  - `consume_purchase_and_create_job` uses `report_purchases` and `auth.uid()` with `FOR UPDATE SKIP LOCKED`.
  - Enforces report_type and revisions_limit.
  - File: `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`

- **Generation slot limits**
  - `claim_generation_slot` (RPC) before DocRaptor generation.
  - `finalize_generation_slot` (RPC) in finally block.
  - File: `api/generate-client-report.js`

- **Revision limits**
  - `consume_revision_slot` (RPC) in `api/jobs/request-revision.js`.

- **Eligibility check for admin run**
  - `runs_limit`, `runs_used`, `runs_inflight` filters in `api/admin/run-eligible-jobs-once.js`.

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
  - Revision requested events.
  - Files: `api/admin/run-eligible-jobs-once.js`, `api/jobs/request-revision.js`

## G) Cron wiring

- GitHub Actions: `.github/workflows/worker-kick.yml`
  - Calls `POST /api/admin/run-eligible-jobs-once` every 5 minutes.

## H) Legacy/duplicate/possible mismatch observations (no refactors)

- `queue_job_for_processing` RPC is referenced in `src/pages/Dashboard.jsx` but no SQL migration or server definition appears in the repo.
- `api/jobs/request-revision.js` updates `analysis_jobs` with `last_error: null`, while the admin runner uses `error_code`/`error_message`. This suggests mixed error-field usage.
- Both `handleUploadSuccess()` and `handleUpload()` attempt job creation via `consume_purchase_and_create_job`. This may be intentional but is duplicated.
- Status `validating_inputs` appears in some UI gating/strings, but core worker transitions start at `queued → extracting`.
