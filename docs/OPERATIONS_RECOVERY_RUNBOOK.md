# InvestorIQ Operations / Recovery Runbook

**Status:** Current operations authority
**Date:** 2026-08-30

## Scheduler

Production automatic scheduler: Supabase Cron / `pg_net` job `investoriq-admin-run-worker`, normally scheduled `*/3 * * * *`.

`worker_scheduler_authority` is the repository-owned singleton registry. Its only valid authority is `supabase_cron_pg_net`; `vercel.json` contains no cron and `.github/workflows/worker-kick.yml` remains manual emergency fallback only. The registry is deliberately written with `enabled = false` until the owner authorizes the production activation and certification window.

### Temporary Vercel-preservation doctrine

The scheduler is intentionally **PAUSED** during the current local-only work period.

Until the owner explicitly lifts the freeze:

- no GitHub push that triggers Vercel
- no deploy
- no production worker invocation
- no production RETEST
- no Vercel CLI / log inspection
- no Cron re-enable

## Worker lifecycle

Worker lifecycle/recovery must remain bounded and lineage-aware. No recovery path may recreate the historical unbounded retry loop.

The lifetime ceiling is three base attempts plus at most three explicitly authorized recovery attempts. An exhausted requeue becomes `dead_letter` immediately and restores the exact consumed `report_purchases` row once when no publication receipt exists.

Operational failure jurisdictions:

1. admission / job-integrity failure
2. canonical source / core insufficiency
3. internal delivery / platform failure

Internal renderer, PDF, storage, persistence, manifest, or recovery defects remain InvestorIQ internal failures and must not be translated into customer-document blame.

## Recovery

Recovery must use governed lifecycle authorities and preserve exact job / attempt / entitlement lineage. Admin recovery is a bounded recovery episode, not permanent retry permission.

Do not manually force historical stranded jobs through modern state transitions. Legacy rows require deliberate reconciliation after the current architecture is deployed and fresh production certification is authorized.

## Production proof rule

Local QA, local build, code inspection, and historical RETESTs cannot produce launch PASS. Fresh production evidence is mandatory after the owner authorizes the consolidated deployment/certification window.
