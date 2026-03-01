# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # Production build → /dist/
npm run preview      # Preview production build on port 4173
```

There are no automated tests. Verification is done by running the dev server and triggering the pipeline manually, or by writing and running isolated `.mjs` scripts with `node scripts/my-test.mjs`. Delete those scripts when done.

The backend runs as Vercel serverless functions in `/api/`. For local backend testing, `server.js` exposes an Express wrapper on port 3000.

## Product Rules (Non-Negotiable)

- **Document-driven and deterministic only.** No AI gap-filling, no estimates, no BUY/SELL language, no IRR/DCF assumptions unless directly from documents.
- **Fail-closed.** If inputs are missing or a derivation returns null, strip the entire section silently — never emit "DATA NOT AVAILABLE" in the visible report. The `DATA_NOT_AVAILABLE` constant is a sentinel, not display text.
- **Institutional tone.** No consumer language.
- **One file at a time. Minimal diffs. No refactors without explicit approval.**

## Architecture

### Frontend (`/src/`)
React 18 + Vite SPA. Auth via Supabase JWT (`src/contexts/SupabaseAuthContext.jsx`). Path aliases: `@` = `src/`, `@components`, `@pages`, `@lib`. The main user surface is `src/pages/Dashboard.jsx` — upload, scope confirmation, job monitoring, and PDF download all happen there.

### Backend (`/api/`)
Vercel serverless functions. All backend logic lives here — no shared runtime state. Key files:

| File | Role |
|---|---|
| `api/admin-run-worker.js` | Main job orchestrator — drives every status transition from `extracting` → `published` |
| `api/admin/run-eligible-jobs-once.js` | Cron entry point — claims `queued` jobs, kicks the worker |
| `api/generate-client-report.js` | Builds HTML from template + artifacts, calls DocRaptor, stores PDF |
| `api/parse/parse-doc.js` | Unified document parser for `rent_roll` and `t12` doc types |
| `api/parse/extract-job-text.js` | AWS Textract integration — PDFs → table matrices |
| `api/parse/classify-documents.js` | Document type detection (rent_roll / t12 / other) |

### Shared Utilities (`/lib/`)
Server-only. `textractClient.js` + `textractTablesToMatrix.js` for Textract, `investoriqMasterPromptV71.js` for the AI underwriting prompt, `email-ses.js` for SES.

### Database
Supabase Postgres. All atomic operations go through RPCs in `supabase/migrations/`. Key RPCs: `consume_purchase_and_create_job`, `queue_job_for_processing`, `claim_and_consume_job`. Row-level security enforces user ownership. The worker uses `supabaseAdmin` (service role); the report generator uses `supabase` (anon key + JWT).

### Job State Machine
```
needs_documents → queued → extracting → underwriting → scoring
→ rendering → pdf_generating → publishing → published
```
Failure paths: `rendering → needs_documents` (missing docs), any stage → `failed`. Driven by `admin-run-worker.js`. Full detail in `PIPELINE_MAP.md`.

**Cron trigger:** `.github/workflows/worker-kick.yml` calls `POST /api/admin/run-eligible-jobs-once` every 5 minutes.

### Report Template
`api/report-template-runtime.html` is the single master HTML template. It uses `{{TOKEN}}` placeholders replaced by `generate-client-report.js`. Tokens follow a two-pass pattern:
1. Primary pass: compute value, call `replaceAll(finalHtml, "{{TOKEN}}", value)`
2. Safety pass (~line 3192): any unreplaced tokens get `DATA_NOT_AVAILABLE`
3. Section-strip pass: if all values in a section are `DATA_NOT_AVAILABLE`, strip the entire section block

### Artifact Logging
`analysis_artifacts` is the audit trail for everything — parser output, status transitions, worker events, email sends, HTML integrity checks. Querying it by `job_id` + `type` is how the report generator retrieves parsed document data (e.g. `.eq("type", "rent_roll_parsed")`).

## Active Work

Full elite roadmap is in `ELITE_ROADMAP.md`. Execution order: Block A (cosmetic) → Block B (rationale) → Block C (content fallbacks) → Block D/E (underwriting moat).

**Fixes applied 2026-03-01:**
- `text-transform: uppercase` removed from `.section-header` CSS
- `exec-major-heading` and `small` added to `sentenceIntegrity.js` whitelist
- `Primary Pressure Point:` (colon, not mdash) in template
- `${missingHtml}` duplicate bullet removed from refi sufficiency return
- Brand-nowrap span on cover verdict label

## Established Patterns (Do Not Regress)

- **Occupancy derivation from unit rows:** when `status` is blank/null, count a unit as occupied if `in_place_rent > 0`. This applies in both the `computedRentRoll` builder (~line 2428) and the `execOccupancy` fallback block (~line 2750).
- **Coverage checker source:** `rentRollPayload.units[]` (individual rows) must be checked for `in_place_rent` / `market_rent` presence — not `unit_mix`, which is empty when no `beds` column exists.
- **Unit mix grouping key:** use `beds` when finite, otherwise fall back to `unit_type` string. Label formatter: numeric keys → `"X Bed"`, non-numeric keys → use as-is.
- **Rent field priority:** always `in_place_rent ?? current_rent ?? rent`. Parser writes `in_place_rent`; `current_rent` is the fallback only.
- **`rent_roll_parsed` artifact payload:** always includes `units` and `column_map` for both CSV and XLSX (guard was removed from `parse-doc.js:910`).
- **Token replacement:** `execOccupancyTokenText` reads from `execOccupancy` (computed at ~line 2728). Do not re-derive independently at the token replacement site.

## Key Field/Type Strings

These must stay consistent across parse-doc.js, admin-run-worker.js, and generate-client-report.js:

| Artifact type | Written by | Read by |
|---|---|---|
| `rent_roll_parsed` | `api/parse/parse-doc.js:895` | `api/generate-client-report.js:2357`, `api/parse/extract-job-text.js:220` |
| `t12_parsed` | `api/parse/parse-doc.js` | `api/generate-client-report.js:2368` |
| `worker_event` | `api/admin-run-worker.js` | observability only |
