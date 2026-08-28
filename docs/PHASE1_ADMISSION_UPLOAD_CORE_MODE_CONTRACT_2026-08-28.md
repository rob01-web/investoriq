# InvestorIQ Phase 1 Admission, Upload and Core-Mode Contract

**Date:** 2026-08-28  
**Branch:** `internal-phase1-admission-coremode-20260828`  
**Production base:** `b69d8dd3911449b82c94770d51f22302e47adcd9`

This document is the forward Phase 1 authority for customer report admission. Older text that says both core documents or an Underwriting supporting document are mandatory is historical and must not control current behavior.

## Core admission constitution

The approved source modes are:

- `dual_source_core`: admissible
- `t12_minimum_core`: admissible
- `rent_roll_minimum_core`: admissible
- `insufficient_core`: rejected

A valid T12 or a valid Rent Roll is sufficient to start Screening or Underwriting. Underwriting supporting documents are optional enrichment inputs and are not an admission prerequisite.

## Transaction and Storage rules

- A report purchase is consumed only inside the admission database transaction that creates the queued job and registers its staged source rows.
- The admission receipt is created only after exact job, purchase and staged-object lineage checks pass.
- Governed admission manifest ordering uses `analysis_job_files.uploaded_at`, which is the production schema authority. No fake `analysis_job_files.created_at` column is introduced.
- Confirmed admission rejection triggers compensation of the exact staged objects uploaded for that attempt.
- Ambiguous client/network failure does not delete staged objects because the client cannot safely assume the server transaction failed.

## Upload envelope

Customer staged uploads are limited to 50 MB per file. Browser validation checks the supported extension/MIME pair before upload. PDFs must begin with the `%PDF-` signature. The `staged_uploads` Storage bucket is also configured with a 50 MB limit and an allowed MIME list.

The current accepted customer upload families are PDF, Excel, CSV, Word, JPEG and PNG. Parser/source classification remains a later pipeline responsibility and is not inferred merely from MIME type.

## Customer error boundary

Raw database, provider, schema, SQL, parser or runtime diagnostics must not be returned to customer toasts. Internal diagnostics remain available to operator logging.

Confirmed rejection can safely state that the report did not start. Ambiguous network failure must instead tell the customer that InvestorIQ could not confirm the start and to refresh before retrying.

## Phase 1 focused certification

Run:

`node tests/qa/phase1-admission-core-mode-contract-smoke.js`

Then run the normal local build. This focused smoke is local/static and must not invoke production workers, production DocRaptor, Stripe, Vercel or live Supabase mutations.
