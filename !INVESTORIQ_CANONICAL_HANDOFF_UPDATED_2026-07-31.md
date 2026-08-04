# InvestorIQ Canonical Handoff

Current date: August 4, 2026

## Current authority pointers

- Branch: `main`
- HEAD / origin/main after this docs closeout will advance from `b86872f` (wiring) through the docs commit
- Active docs: `docs/STATUS.md`, `docs/ROADMAP.md`, this handoff, `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- Premium: **false**
- RETEST 39 (`084a982e-ff6e-49b0-a7f7-473ed314aada`): executed once; **not requeued**
- RETEST 40: **must not be created**
- Production domain: https://investoriq.tech
- Vercel Production: Ready for governed-requeue wiring

## Sequence complete through governed-requeue wiring closeout

1. **Parser rescue (Aug 2)** — `a06b897` restored spreadsheet `sourceContentSha256` definitions in `api/parse/parse-doc.js`. RETEST 39 failed pre-fix with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`; credit restored. Parser deployment verified Ready.
2. **Admin Retry gap** — Dashboard already POSTed `requeue_failed_job` for an exact job. Linked consumed purchases worked; credit-restored purchases (`consumed_at`/`job_id` null) later failed claim with `PURCHASE_NOT_CONSUMED`.
3. **Governed repair (source on main)** — Migration `20260803000100_governed_requeue_worker_job.sql`, smoke `tests/qa/governed-requeue-worker-job-smoke.js`, API wiring in `api/admin-run-worker.js` at `b86872f`. RPC `public.governed_requeue_worker_job(p_job_id uuid, p_claimed_by text)` is atomic, locks job+purchase, reuses linked consumed purchase or sole `entitlement_restored` purchase lineage, requeues same job, no new credits/jobs/reports/events.
4. **Emergency worker restorations** — Contents-API full-file writes truncated `api/admin-run-worker.js`. Restored via `041af76` and `8d326fc`. Final wiring via local surgical patch only (`b86872f`).
5. **Permanent boundary** — Never use GitHub Contents API replacement writes on `api/admin-run-worker.js` or `api/parse/parse-doc.js`.

## Production gates

**Done:** parser fix deployed; full worker restored; migration+smoke+API wiring on main; targeted smokes PASS (governed-requeue, H6); Vercel Ready for wiring commit.

**Not done:**
- Production Supabase has **not** applied `20260803000100_governed_requeue_worker_job.sql`
- Production RPC grants/signature **not verified**
- Exact-job worker isolation **not implemented**
- RETEST 39 **not** requeued; RETEST 40 **not** created

## Exact next packet

Production-gate the governed retry migration only:
1. Clean main at wiring+docs HEAD
2. Inspect only the migration file
3. Apply only that migration via authorized Supabase production mechanism
4. Verify RPC signature, security definer, safe search_path, service_role-only
5. Do not invoke RPC, requeue RETEST 39, run worker, or create RETEST 40
6. Then map smallest exact-job worker-isolation packet

## Forbidden until separately authorized

- No RETEST 39 requeue/execute
- No RETEST 40
- No automatic worker invoke after requeue
- No GitHub Contents API full-file writes to large worker/parser sources
- No Premium activation
- No claim that the governed RPC already exists in production schema

## Prior launch context (still true)

- H0–H10 complete at repository-proof level (including H6 correction).
- Bundle pricing still shows configuration/copy debt; do not change Stripe/Vercel bundle config until a governed Full Underwriting live PDF is proven.
- Full Underwriting production output quality is not yet proven by a reviewed live customer PDF.
