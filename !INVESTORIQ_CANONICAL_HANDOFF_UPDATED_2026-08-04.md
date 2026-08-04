# InvestorIQ Canonical Handoff

Current date: August 4, 2026

## Current authority pointers

- Branch: `main`
- HEAD / origin/main: `1bceb47` — `fix(worker): deploy governed-retry parser resume`
- Active docs: `docs/STATUS.md`, `docs/ROADMAP.md`, this handoff, `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`, `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- Premium: **false**
- RETEST 39 (`084a982e-ff6e-49b0-a7f7-473ed314aada`): two attempts (initial + one governed requeue); **not authorized for a third requeue** in this closeout
- RETEST 40: **must not be created**
- Production domain: https://investoriq.tech
- Vercel Production: Ready / Latest / Current for `1bceb47`

## Sequence complete through governed-retry parser resume

1. **Parser rescue (Aug 2)** — `a06b897` restored spreadsheet `sourceContentSha256` in T12 and rent-roll paths. Deployed.
2. **Governed requeue** — production RPC `public.governed_requeue_worker_job(p_job_id uuid, p_claimed_by text)` installed and verified (service-role-only, `SECURITY DEFINER`, owner `postgres`, safe `search_path=public`, one overload).
3. **Exact-job worker isolation** — `05ccee4` action `process_exact_queued_job`. Exact-job, H6, and governed-requeue smokes PASS. Deployed.
4. **RETEST 39 attempt 2** — governed requeue rebound purchase `db421bc7-c850-4429-ab13-e1e53b6161a1` without credit change. Plain automated worker claimed before owner exact-mode. Attempt `814344fd-9980-4fe0-9184-6342419b6acf` failed with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`. Not requeued again; RETEST 40 not created.
5. **Parser-resume diagnosis** — T12 `parse_status=failed` excluded from reparsable set (`pending`/`extracted` only). Attempt 2 skipped parse and reused stale state. Source files still reusable via `job_id` / `file_id` / `doc_type` / `object_path`.
6. **Two-worker mapping** — legacy `.github/workflows/worker-kick.yml` (`InvestorIQ Worker Kick`) had schedule `*/5 * * * *` plus `workflow_dispatch`; calls both eligible-jobs-once and admin-run-worker. `vercel.json` has no cron. GH schedule most likely claim source for attempt 2.
7. **Legacy schedule isolation** — automatic schedule paused (commented out); `workflow_dispatch` and curl fallbacks retained. No permanent retirement until Vercel-controlled proof succeeds.
8. **Governed-retry parser resume** — `1bceb47` updates `api/admin-run-worker.js` only. Detects `worker_admin_requeued`; allows core T12/rent-roll `pending`/`extracted`/`failed` on governed retry only; resets failed → pending before redispatch; preserves valid artifacts; fail-closed; no auto-loop. Deployed Ready / Latest / Current.
9. **Targeted validation** — governed-retry-parser-resume, exact-job, H6, governed-requeue smokes PASS; `git diff --check` PASS.
10. **Transport cleanup** — malformed/truncated transport artifacts removed. Permanent boundary: no GitHub Contents API full-file replacement on `api/admin-run-worker.js` or `api/parse/parse-doc.js`.

## Production gates

**Done:** parser fix deployed; governed requeue production-verified; exact-job isolation deployed; parser-resume deployed; GH automatic schedule paused; targeted smokes PASS; Vercel Ready for `1bceb47`.

**HOLD / not done:**
- Production verification packet for `1bceb47` not yet run
- RETEST 39 not requeued a third time
- RETEST 40 not created
- No post-deploy worker invocation
- Legacy worker not permanently retired
- Premium remains false

## Exact next packet

Production verification only before any RETEST 39 mutation:
1. Prove origin/main and Vercel Production both point to `1bceb47`
2. Prove deployed worker source contains the governed-retry parser-resume gate
3. Prove GitHub automatic schedule remains paused
4. Prove `workflow_dispatch` remains available
5. Prove no other automatic Vercel cron exists
6. Prove zero worker / RPC / requeue / purchase / credit / job / report / artifact mutation during verification

Only after verification PASS may the owner separately authorize exactly one further governed RETEST 39 requeue and immediate exact-job invocation.

## Forbidden until separately authorized

- No RETEST 39 third requeue/execute in this closeout
- No RETEST 40
- No automatic worker invoke after requeue without exact-job control
- No GitHub Contents API full-file writes to large worker/parser sources
- No Premium activation
- No production mutations during the verification packet

## Prior launch context (still true)

- H0–H10 complete at repository-proof level (including H6 correction).
- Bundle pricing still shows configuration/copy debt; do not change Stripe/Vercel bundle config until a governed Full Underwriting live PDF is proven.
- Full Underwriting production output quality is not yet proven by a reviewed live customer PDF.
