# InvestorIQ Operations / Recovery Runbook

**Status:** Current operations authority
**Date:** 2026-08-18

## Scheduler

Production automatic scheduler: Supabase Cron / `pg_net` job `investoriq-admin-run-worker`, normally scheduled `*/3 * * * *`.

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
