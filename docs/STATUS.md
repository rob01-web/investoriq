# InvestorIQ Status

Current date: August 5, 2026

Current authority:
- Treat `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-04.md` as the practical daily handoff.
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 is terminal `dead_letter` and is **not authorized for another requeue**.
- RETEST 40 must **not** be created.
- No broad tests, no source-code edits outside explicitly authorized packets.

## Current repository and deployment state

- Branch: `main`
- Implementation HEAD / origin/main before this docs closeout: `6c5c4e8` — `fix(schema): add dead_letter to analysis_jobs_status_check`
- Important ancestors: `087f97d` (`fail_exact_expired_worker_job`), `1bceb47` (governed-retry parser resume)
- Production domain: `investoriq.tech`
- Permanent boundary: never use GitHub Contents API replacement writes on `api/admin-run-worker.js` or `api/parse/parse-doc.js`. Edit large source files locally with surgical patches and push through normal Git.

## RETEST 39 final production result

- Job: `084a982e-ff6e-49b0-a7f7-473ed314aada`
- Purchase: `db421bc7-c850-4429-ab13-e1e53b6161a1` (remained bound)
- Final status: `dead_letter`
- Final error: `TIMEOUT` — Processing timed out. Please log in to your InvestorIQ dashboard to review the job status.
- Attempt count: `3`
- Final attempt ID: `6bc7f737-4e39-4ce8-b2dc-ed3836b1a294`
- Claimed by: `2026-08-04T22-03-00.204Z`
- Dead-lettered at: `2026-08-05 18:35:43.118214+00`
- Lease cleared: `worker_lease_expires_at = null`
- Report credits remained: `0`
- Event integrity:
  - `entitlement_restored` events: exactly 1
  - `worker_claimed` events: exactly 3
  - `worker_admin_requeued` events: exactly 2
  - no fourth attempt
  - no duplicate entitlement restoration
  - no duplicate credit
  - no RETEST 40

## Parser-resume / publication verdict distinction

- **Governed parser-resume proof: PASS** — attempt 3 advanced `queued → extracting → underwriting → scoring → rendering`, clearing the prior stale failed-T12 state that caused `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`.
- **End-to-end publication proof: HOLD** — attempt 3 timed out during rendering; no published report.
- **RETEST 39 lifecycle recovery and commercial integrity: PASS** — exact expired recovery, dead-letter terminal, exactly-once entitlement restoration preserved.

## Dead-letter contract repair

- Production previously rejected canonical H6 terminal status `dead_letter` because `analysis_jobs_status_check` omitted it.
- Repository migration `supabase/migrations/20260805000100_analysis_jobs_status_check_dead_letter.sql` committed at `6c5c4e8`.
- Production constraint was applied and verified to include `dead_letter` only; no existing status removed or renamed.

## Exact expired-job recovery

- Deployed action: `fail_exact_expired_worker_job` via `POST /api/admin-run-worker` (`087f97d`).
- Invoked exactly once after production constraint repair.
- Response proved: `previous_status: rendering` → `final_status: dead_letter`; attempt count 3; same attempt ID preserved; `entitlement_restored: false`; `entitlement_already_restored: true`; `credit_balance_changed: false`.
- Exact-job fencing worked; ordinary worker loop bypassed; no unrelated job processed; no fourth attempt; prior entitlement restoration recognized; no duplicate commercial remedy.

## Two-worker / scheduler authority

### Production worker (active)
- Supabase `pg_cron` / `pg_net` invokes `POST https://investoriq.tech/api/admin-run-worker`
- Cron job: jobid `1`, jobname `investoriq-admin-run-worker`, schedule `*/3 * * * *`
- Mechanism: `pg_net`; observed user agent in Vercel logs: `pg_net/0.19.5`
- Temporarily paused with `cron.alter_job(1, active := false)` for controlled recovery; pause proof: active = false and no new `worker_lease_expired` events across more than two cadence windows.
- Restored with `cron.alter_job(1, active := true)`; final proof: active = true, cadence preserved, no further `worker_lease_expired` events for terminal RETEST 39 after more than two scheduler cycles.

### Legacy worker
- Workflow: `.github/workflows/worker-kick.yml`
- Automatic GitHub schedule remains paused (commented out).
- `workflow_dispatch` remains available as manual fallback.
- Legacy worker is not yet permanently retired.

## Completed sequence (Aug 2–5, 2026) — summary

1. Parser rescue `a06b897` deployed.
2. Governed requeue production RPC installed and verified.
3. Exact-job isolation `05ccee4` / `process_exact_queued_job` deployed.
4. RETEST 39 attempt 2 failed with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` (stale failed T12).
5. Legacy GH schedule paused; production worker later identified as Supabase pg_cron `*/3`.
6. Governed-retry parser resume `1bceb47` deployed.
7. Exact expired recovery action `087f97d` added.
8. Dead-letter status constraint repair `6c5c4e8` committed; production constraint applied.
9. RETEST 39 attempt 3 advanced through rendering (parser-resume PASS) then timed out; exact recovery → `dead_letter` (commercial integrity PASS).

## Current HOLD / next packet

**Exact next packet: read-only rendering-timeout investigation for RETEST 39 attempt 3 only.**

It must determine:
1. Where rendering stopped
2. Whether report, HTML, PDF, manifest, or publication artifacts were partially created
3. Whether Vercel function timeout, external PDF latency, OOM, request abort, or uncaught exception caused termination
4. Smallest safe source repair
5. Zero production mutation during investigation

Do **not** authorize another RETEST 39 requeue.
Do **not** authorize RETEST 40.
Do **not** permanently retire the GitHub fallback yet.
Premium remains false.

## Permanent prohibitions

- No RETEST 39 requeue
- No RETEST 40
- No Premium activation
- No GitHub Contents API full-file write to protected large source files
- No broad audits
- No scheduler, worker, RPC, credit, purchase, or deployment mutation outside an explicitly authorized packet
