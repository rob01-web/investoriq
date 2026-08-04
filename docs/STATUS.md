# InvestorIQ Status

Current date: August 4, 2026

Current authority:
- Treat `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-04.md` as the practical daily handoff.
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 has executed twice (initial failure + one governed requeue attempt); it is **not authorized for a third requeue** in this closeout.
- RETEST 40 must **not** be created.
- No broad tests, no source-code edits outside explicitly authorized packets.

## Current repository and deployment state

- Branch: `main`
- HEAD / origin/main: `1bceb47` — `fix(worker): deploy governed-retry parser resume`
- Working tree: clean before docs closeout
- Vercel Production: Ready / Latest / Current for `1bceb47`
- Production domain: `investoriq.tech`
- Parser fix `a06b897` remains an ancestor of current main
- Permanent boundary: never use GitHub Contents API replacement writes on `api/admin-run-worker.js` or `api/parse/parse-doc.js`. Edit large source files locally with surgical patches and push through normal Git.

## Completed sequence (Aug 2–4, 2026)

1. **Parser rescue** — `a06b897` fixed undefined `sourceContentSha256` in spreadsheet T12 and rent-roll parser paths; deployed.
2. **Governed requeue** — production RPC installed and verified:
   - `public.governed_requeue_worker_job(p_job_id uuid, p_claimed_by text)`
   - service-role-only, `SECURITY DEFINER`, owner `postgres`, safe `search_path=public`, exactly one overload
   - production verification complete
3. **Exact-job worker isolation** — `05ccee4` action `process_exact_queued_job`; exact-job / H6 / governed-requeue smokes PASS; deployed.
4. **RETEST 39 governed retry attempt 2**
   - job ID: `084a982e-ff6e-49b0-a7f7-473ed314aada`
   - purchase rebound: `db421bc7-c850-4429-ab13-e1e53b6161a1`
   - credit balance did not change
   - a plain automated worker claimed the job before owner exact-mode invocation
   - worker attempt count: `2`
   - attempt ID: `814344fd-9980-4fe0-9184-6342419b6acf`
   - final status: `failed`
   - error: `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`
   - RETEST 39 was not requeued again; RETEST 40 was not created
5. **Parser-resume diagnosis**
   - T12 `analysis_job_files.parse_status` remained `failed`
   - extraction re-entry previously reparsed only `pending` or `extracted`
   - attempt 2 skipped parsing and reused stale parser state
   - valid rent-roll and support artifacts remained present
   - source files remain reusable via existing `job_id`, `file_id`, `doc_type`, and `object_path` (no re-upload required)
6. **Legacy worker mapping**
   - workflow: `.github/workflows/worker-kick.yml` (`InvestorIQ Worker Kick`)
   - prior automatic schedule: `*/5 * * * *`
   - manual fallback: `workflow_dispatch`
   - calls both `https://investoriq.tech/api/admin/run-eligible-jobs-once` and `https://investoriq.tech/api/admin-run-worker`
   - `vercel.json` has no cron
   - legacy GitHub schedule was the most likely source of attempt 2 claim
7. **Legacy schedule isolation**
   - automatic schedule commented out / paused
   - `workflow_dispatch` and both curl fallback steps remain
   - no permanent workflow retirement yet; retire only after successful Vercel-controlled proof
8. **Governed-retry parser resume** — `1bceb47` changed only `api/admin-run-worker.js`; deployed Ready / Latest / Current
   - detects governed retry via `hasWorkerEvent(job.id, 'worker_admin_requeued')`
   - governed retry allows core T12/rent-roll with `pending`, `extracted`, or `failed`
   - non-governed behavior unchanged; valid parsed core and support artifacts preserved
   - failed core status resets to `pending` before parser redispatch
   - terminal fail-closed retained; no automatic retry loop
9. **Final targeted validation**
   - `node tests/qa/governed-retry-parser-resume-smoke.js` → PASS
   - `node tests/qa/exact-job-worker-claim-smoke.js` → PASS
   - `node tests/qa/h6-worker-claim-lease-fencing-smoke.js` → PASS
   - `node tests/qa/governed-requeue-worker-job-smoke.js` → PASS
   - `git diff --check` → PASS
10. **Transport incident cleanup**
    - malformed patch, truncated Base64, checksum, failed chunk, and corrupted bundle artifacts removed
    - final worker repair applied via validated surgical patch and normal Git push
    - permanent Contents API boundary on large worker/parser sources remains

## Current HOLD / next packet

- Parser-resume repair is deployed at `1bceb47`
- Legacy automatic GitHub schedule is paused; `workflow_dispatch` remains
- RETEST 39 has not been requeued a third time
- No worker has been invoked after deployment
- RETEST 40 remains forbidden
- Premium remains false

**Exact next packet: production verification only before any RETEST 39 mutation.**

It must prove:
1. origin/main and Vercel Production both point to `1bceb47`
2. deployed worker source contains the governed-retry parser-resume gate
3. GitHub automatic schedule remains paused
4. `workflow_dispatch` remains available
5. no other automatic Vercel cron exists
6. no worker, RPC, requeue, purchase, credit, job, report, or artifact mutation occurs during verification

Only after that verification PASS may the owner separately decide whether to authorize exactly one further governed RETEST 39 requeue and immediate exact-job invocation.

## Permanent prohibitions

- No RETEST 39 requeue in this docs packet
- No worker invocation
- No RPC invocation
- No RETEST 40
- No Premium activation
- No GitHub Contents API full-file write to protected large source files
- No broad audits
