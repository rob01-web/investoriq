# InvestorIQ Status

Current date: August 4, 2026

Current authority:
- Treat `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md` as the practical daily handoff (with Aug 2 parser rescue and Aug 3–4 governed-requeue closeout below).
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 has executed once after H6 production migration; it is **not authorized for requeue**.
- RETEST 40 must **not** be created.
- No broad tests, no source-code edits outside explicitly authorized packets.

## Current repository and deployment state

- Branch: `main`
- HEAD / origin/main: `b86872f` — `fix(worker): wire governed requeue endpoint`
- Working tree: clean after docs closeout
- Vercel Production: Ready for the governed-requeue wiring commit
- Production aliases: `investoriq.tech`, `www.investoriq.tech`
- Parser fix `a06b897` remains an ancestor of current main
- `api/parse/parse-doc.js` intact; never modify via GitHub Contents API writes
- Permanent boundary: never use GitHub Contents API replacement writes on `api/admin-run-worker.js` or `api/parse/parse-doc.js`. Edit large source files locally with surgical patches and push through normal Git.

## Aug 2, 2026 — Parser rescue and RETEST 39 record

- Parser fix commit: `a06b897` — `fix(parser): hash spreadsheet T12 and rent-roll sources`
- RETEST 39 job `084a982e-ff6e-49b0-a7f7-473ed314aada` failed with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` because spreadsheet T12 / Rent Roll paths referenced undefined `sourceContentSha256`
- Root cause was not a customer bad-document issue
- Credit restored; purchase left unbound (`consumed_at = null`, `job_id = null`)
- **RETEST 39 is not requeued**
- **RETEST 40 must not be created**
- Parser-fix production deployment verified Ready via Vercel commit metadata

## Aug 3–4, 2026 — Governed requeue wiring closeout

Problem:
- Admin Dashboard Operational Recovery Retry already called `POST /api/admin-run-worker` with `{"action":"requeue_failed_job","job_id":"<exact job id>"}`
- Linked failed jobs (purchase still consumed) could requeue
- Credit-restored failed jobs requeued but later failed claim with `PURCHASE_NOT_CONSUMED`

Repair on main:
- Migration: `supabase/migrations/20260803000100_governed_requeue_worker_job.sql`
- Smoke: `tests/qa/governed-requeue-worker-job-smoke.js`
- API wiring in `api/admin-run-worker.js` (commit `b86872f`)
- RPC: `public.governed_requeue_worker_job(p_job_id uuid, p_claimed_by text)`
- Terminal failed/dead-letter path calls `governed_requeue_worker_job`
- Expired active lease recovery still calls `requeue_worker_job`
- No automatic worker invocation after requeue
- Exact-job worker isolation is **not** implemented

Governed RPC behavior (source contract; production schema not yet applied):
- One atomic PL/pgSQL transaction; locks exact job and purchase
- Allows failed/dead-letter only; blocks published and ineligible states
- Reuses valid linked consumed purchase, else exact restored purchase from sole distinct `analysis_job_events.meta->>'purchase_id'` where `event_type = 'entitlement_restored'` for that job
- Rejects missing/ambiguous lineage; verifies user and product type
- Atomically rebinds original restored purchase and requeues the same job
- No credit decrement; no new job, report, purchase, or restoration event

Emergency worker restorations (do not repeat):
- GitHub Contents API attempts truncated `api/admin-run-worker.js` into stubs
- Restore commits: `041af76`, `8d326fc`
- Final safe wiring applied via local surgical patch → `b86872f`

Validation:
- `node tests/qa/governed-requeue-worker-job-smoke.js` → PASS
- `node tests/qa/h6-worker-claim-lease-fencing-smoke.js` → PASS
- `git diff --check` → PASS
- H8 smoke not completed (known missing local axios)

## Remaining production gates

Completed:
- Parser repair committed and deployed
- Full worker endpoint restored
- Governed requeue migration and smoke committed
- API wiring committed and deployed
- Targeted tests passed

Not completed:
- Migration `20260803000100_governed_requeue_worker_job.sql` **not applied** to production Supabase
- Production RPC signature/security/grants **not verified**
- Exact-job worker isolation **not implemented**
- RETEST 39 **not requeued or executed**
- RETEST 40 **not created**

## Exact next packet

Production-gate only the governed retry migration:
1. Verify clean main at `b86872f`
2. Inspect only `supabase/migrations/20260803000100_governed_requeue_worker_job.sql`
3. Apply only that migration through the authorized Supabase production mechanism
4. Verify RPC signature, security definer, safe search_path, service_role-only grants
5. Do not invoke the RPC, requeue RETEST 39, invoke the worker, or create RETEST 40
6. Then map the smallest exact-job worker-isolation packet

Do not treat this status note as authorization to requeue RETEST 39, create RETEST 40, apply the migration without a dedicated packet, or edit large source files via GitHub Contents API.
