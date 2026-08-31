# InvestorIQ Operations / Recovery Runbook

**Status:** Current operations authority
**Date:** 2026-08-31

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

## Phase 4 commerce activation

The locked server catalog is Screening $199 USD, Underwriting $499 USD, and Launch Bundle $699 USD. The bundle always creates two Screening entitlements and one Underwriting entitlement. Standalone quantity is an integer from one through five.

Before deploying the Phase 4 branch, bind the production Vercel server environment exactly:

```text
STRIPE_PRICE_SCREENING=price_1UAUEAPlUvcaYNKZ6NZQZdhR
STRIPE_PRICE_UNDERWRITING=price_1UAUEFPlUvcaYNKZ0e3HUSTM
STRIPE_PRICE_BUNDLE=price_1UAUEjPlUvcaYNKZy8R3JkgS
```

Do not restore `VITE_STRIPE_PRICE_ID_*` as an authority. The browser must load display prices and availability from the server catalog projection.

Activation order:

1. Confirm the three Vercel Production values above without deploying.
2. Preflight for duplicate non-null `report_purchases.stripe_session_id` values. Investigate any duplicate; do not bypass the Phase 4 migration guard.
3. Apply `20260828233000_phase1_admission_core_modes_and_upload_policy.sql`, `20260830121500_phase2_atomic_publication_delivery_authority.sql`, `20260830183000_phase3_worker_runtime_recovery_authority.sql`, and `20260831100000_phase4_atomic_commerce_entitlement_authority.sql` in timestamp order.
4. Deploy the consolidated authorized branch while leaving the worker scheduler disabled.
5. Verify that the server catalog reports all three products available and that Pricing/Dashboard display exactly $199, $499 and $699.
6. Execute authenticated Checkout certification for Screening and Underwriting quantities one through five, the fixed bundle, a normal paid purchase, a valid 100% promotion, a discounted partner promotion, repeated webhook delivery, and an immediate success-page return before webhook completion.
7. For every Checkout, verify exactly one immutable commerce receipt, the exact `report_purchases` allocation, correct owner/product/session lineage, and no duplicate grant on replay.
8. Confirm the customer sees only `processing` before atomic grant and sees `Payment verified` only after the receipt and all exact entitlements exist.
9. Archive prior non-canonical Prices only after the governed deployment and commerce certification pass. Product objects and historic purchase records must remain intact.

Any price, currency, product identity, quantity, payment-state, receipt or entitlement mismatch is a hard commerce failure. Do not manually add credits to make the certification appear green.
