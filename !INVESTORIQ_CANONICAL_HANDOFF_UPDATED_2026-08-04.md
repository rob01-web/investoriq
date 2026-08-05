# InvestorIQ Canonical Handoff

Current date: August 5, 2026

## Current authority pointers

- Branch: `main`
- Implementation HEAD / origin/main before this docs closeout: `6c5c4e8` — `fix(schema): add dead_letter to analysis_jobs_status_check`
- Important ancestors: `087f97d` (`fail_exact_expired_worker_job`), `1bceb47` (governed-retry parser resume)
- Active docs: `docs/STATUS.md`, `docs/ROADMAP.md`, this handoff, `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- Premium: **false**
- RETEST 39 (`084a982e-ff6e-49b0-a7f7-473ed314aada`): terminal `dead_letter`; **not authorized for another requeue**
- RETEST 40: **must not be created**
- Production domain: https://investoriq.tech

## RETEST 39 final production result

- Purchase: `db421bc7-c850-4429-ab13-e1e53b6161a1` (remained bound)
- Final status: `dead_letter`
- Final error: `TIMEOUT` — Processing timed out. Please log in to your InvestorIQ dashboard to review the job status.
- Attempt count: `3`
- Final attempt ID: `6bc7f737-4e39-4ce8-b2dc-ed3836b1a294`
- Claimed by: `2026-08-04T22-03-00.204Z`
- Dead-lettered at: `2026-08-05 18:35:43.118214+00`
- Lease cleared: `worker_lease_expires_at = null`
- Report credits remained: `0`
- Event integrity: `entitlement_restored` ×1; `worker_claimed` ×3; `worker_admin_requeued` ×2; no fourth attempt; no duplicate entitlement or credit; no RETEST 40

## Parser-resume / publication verdict distinction

- **Governed parser-resume proof: PASS** — attempt 3 advanced `queued → extracting → underwriting → scoring → rendering`, clearing the prior stale failed-T12 `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` path.
- **End-to-end publication proof: HOLD** — attempt 3 timed out during rendering; report did not publish.
- **Lifecycle recovery and commercial integrity: PASS** — exact expired recovery to `dead_letter`; exactly-once entitlement restoration preserved.

## Dead-letter contract + exact recovery

- Repository migration `20260805000100_analysis_jobs_status_check_dead_letter.sql` at `6c5c4e8` added only `dead_letter` to `analysis_jobs_status_check`.
- Production constraint applied and verified; no status removed or renamed.
- `fail_exact_expired_worker_job` (`087f97d`) invoked exactly once after constraint repair: `rendering` → `dead_letter`; attempt 3 preserved; `entitlement_already_restored: true`; `credit_balance_changed: false`; exact-job fencing held; no unrelated job processed.

## Two-worker / scheduler authority

### Production worker (active)
- Supabase `pg_cron` / `pg_net` → `POST https://investoriq.tech/api/admin-run-worker`
- jobid `1`, jobname `investoriq-admin-run-worker`, schedule `*/3 * * * *`
- User agent observed: `pg_net/0.19.5`
- Temporarily paused (`cron.alter_job(1, active := false)`) for controlled recovery; restored (`active := true`); cadence preserved; no further `worker_lease_expired` events for terminal RETEST 39 after more than two cycles.

### Legacy worker
- `.github/workflows/worker-kick.yml`: automatic schedule remains paused; `workflow_dispatch` remains available.
- Not yet permanently retired.

## Sequence complete through RETEST 39 commercial closeout

1. Parser rescue `a06b897` deployed.
2. Governed requeue production RPC installed and verified.
3. Exact-job isolation `05ccee4` deployed.
4. RETEST 39 attempt 2 failed `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` (stale failed T12).
5. Legacy GH schedule paused; production scheduler later identified as Supabase pg_cron `*/3`.
6. Governed-retry parser resume `1bceb47` deployed.
7. Exact expired recovery action `087f97d` added.
8. Dead-letter status constraint `6c5c4e8` committed; production applied.
9. RETEST 39 attempt 3 parser-resume advanced to rendering (PASS) then TIMEOUT; exact recovery → `dead_letter` (commercial integrity PASS).

## Production gates

**Done:** parser fix; governed requeue; exact-job isolation; parser-resume deployed and proven on attempt 3; dead-letter constraint in production; exact expired recovery proven; RETEST 39 commercial closeout; production scheduler mapped (Supabase pg_cron job 1) and controlled (pause/restore); GH automatic schedule paused; Premium false.

**HOLD / not done:**
- End-to-end publication proof (rendering timeout on attempt 3)
- Legacy GitHub worker permanent retirement
- RETEST 40 (forbidden)
- Premium remains false

## Exact next packet

Read-only rendering-timeout investigation for RETEST 39 attempt 3 only:
1. Where rendering stopped
2. Whether report, HTML, PDF, manifest, or publication artifacts were partially created
3. Whether Vercel function timeout, external PDF latency, OOM, request abort, or uncaught exception caused termination
4. Smallest safe source repair
5. Zero production mutation during investigation

Do **not** authorize another RETEST 39 requeue.
Do **not** authorize RETEST 40.
Do **not** permanently retire the GitHub fallback yet.

## Forbidden until separately authorized

- No RETEST 39 requeue
- No RETEST 40
- No Premium activation
- No GitHub Contents API full-file writes to large worker/parser sources
- No scheduler, worker, RPC, credit, purchase, or deployment mutation outside an explicitly authorized packet

## Prior launch context (still true)

- H0–H10 complete at repository-proof level (including H6 correction).
- Bundle pricing still shows configuration/copy debt; do not change Stripe/Vercel bundle config until a governed Full Underwriting live PDF is proven.
- Full Underwriting production output quality is not yet proven by a reviewed live customer PDF.
