# Phase 4 Commerce, Stripe and Entitlement Authority

**Date:** 2026-08-31
**Branch:** `internal-phase4-commerce-authority-20260831`
**Base:** Phase 3 commit `fbb8139c6baf921459d7249b6c7f932654664b5b`

## Scope and freeze

This contract closes the local Phase 4 implementation and establishes the live canonical Stripe product/price objects. It does not apply a database migration, deploy this branch, activate the production scheduler, archive the prices used by the currently deployed application, or change production `main`.

Canonical lifecycle:

`server catalog -> validated Stripe Price -> authenticated Checkout -> signed completed webhook -> atomic receipt and entitlement grant -> server-verified customer success`

## Locked catalog

Catalog version: `investoriq-commerce-v1-2026-08-31`
Currency: `usd`

| Product | Unit price | Allowed quantity | Exact entitlement allocation | Canonical active Stripe Price |
|---|---:|---:|---|---|
| Screening | $199 | 1-5 | 1 Screening per unit | `price_1UAUEAPlUvcaYNKZ6NZQZdhR` |
| Underwriting | $499 | 1-5 | 1 Underwriting per unit | `price_1UAUEFPlUvcaYNKZ0e3HUSTM` |
| Launch Bundle | $699 | exactly 1 | 2 Screening + 1 Underwriting | `price_1UAUEjPlUvcaYNKZy8R3JkgS` |

The canonical Stripe objects were created or updated additively in connected account `acct_1SGMyFPlUvcaYNKZ`. Each active product has the matching product type, catalog version, locked amount/currency metadata, and canonical Price as its default. The new bundle product is `prod_VApuIdbL0Io7IO`.

The prior $499 Screening and $1,499 Underwriting prices remain available only to protect the currently deployed application until the governed migration/environment/deployment sequence is authorized and proven. They are not valid under the Phase 4 catalog and the new checkout handler rejects them.

## Phase 4 defect and ownership ledger

| # | Surface | Prior finding | Closed authority |
|---:|---|---|---|
| 1 | Catalog | UI text and server Price IDs were separate authorities. | `api/_lib/commerce-catalog.js` is the one server-owned product, price, currency, quantity and allocation contract. |
| 2 | Live Stripe | Screening was $499, Underwriting was $1,499, and no active bundle authority existed. | Canonical active $199, $499 and $699 one-time USD Prices now exist with exact identity/version metadata. |
| 3 | Environment | Server behavior depended on unchecked Price IDs. | Each checkout and catalog read retrieves the configured Price and validates ID, activity, amount, currency, one-time type, active expanded product, product type and catalog version. |
| 4 | UI pricing | Prices were hardcoded in the browser and availability used public Price ID variables. | Pricing and Dashboard load the public projection of the validated server catalog; client Stripe Price IDs are retired. |
| 5 | Quantity | Checkout used adjustable quantity and normalization could silently clamp malformed values. | Standalone quantities are strict integers 1-5; bundle quantity is exactly one; Stripe line-item quantity is fixed at session creation. |
| 6 | Checkout identity | Product and allocation intent were not a complete versioned contract. | Authenticated owner, product, quantity, catalog version and exact expected allocation are sealed into Checkout metadata. |
| 7 | Completion state | Entitlements could be created without an explicit locked settlement contract. | Webhook requires `complete`, exact nominal subtotal/currency, valid total, and either `paid` or a true zero-total `no_payment_required` promotion. |
| 8 | Price validation | Webhook trusted metadata and first-line-item quantity. | Webhook retrieves exactly one line item with expanded Price/product and revalidates the full catalog contract. |
| 9 | Atomicity | Event insertion and entitlement rows were separate writes with partial-recovery logic. | `grant_checkout_entitlements_v1` records event, immutable checkout receipt and exact entitlement rows in one database transaction. |
| 10 | Idempotency | Duplicate delivery could encounter an event receipt without all expected entitlements. | Per-session advisory locking, unique session/event receipts, unique entitlement lineage keys and replay mismatch guards produce the exact allocation once. |
| 11 | Customer success | Redirect copy could claim a credit before webhook completion. | The Dashboard polls an authenticated ownership-bound endpoint and shows success only after receipt plus every exact entitlement row verify. |
| 12 | Success race | A quick redirect could arrive before Stripe webhook processing. | Missing receipt returns `processing`; verified receipt/rows return `granted`; lineage corruption returns `verification_failed`. |
| 13 | Revenue display | Admin revenue guessed historic prices from consumed entitlements and labeled them as revenue. | Admin revenue reads USD settled Checkout receipt totals and no longer infers money from report consumption. |
| 14 | API compatibility | Stripe API version is behind the current compatibility target. | Upgrade remains explicitly deferred to the later controlled compatibility sub-batch required by the Phase 4 plan. |

## Atomic entitlement contract

`grant_checkout_entitlements_v1` is `SECURITY DEFINER`, has a fixed safe search path, and is executable only by `service_role`. It validates the locked amounts again inside PostgreSQL, then commits all commerce effects or none:

- Stripe event receipt;
- one immutable Checkout receipt for the Stripe session;
- one to five standalone entitlements, or exactly three bundle entitlements;
- exact user, product and session lineage;
- exact final allocation count.

The migration refuses to create the unique entitlement lineage index if historical duplicate non-null `report_purchases.stripe_session_id` values exist. That preflight must be investigated rather than bypassed.

## Scenario evidence

Local runtime and contract tests prove:

- normal paid Screening and Underwriting quantities 1 through 5;
- a valid zero-dollar promotion;
- a discounted paid partner promotion against the nominal catalog subtotal;
- fixed bundle allocation of two Screening and one Underwriting entitlements;
- repeated webhook delivery and exact RPC replay inputs;
- delayed success-page load before receipt creation;
- success only after receipt and all exact entitlement rows exist;
- rejection of unpaid, malformed quantity, wrong-price and receipt-lineage scenarios;
- server/UI catalog display of $199, $499 and $699;
- no browser-owned Stripe Price IDs or premature credit-success copy.

## Production activation gate

Before this branch may be deployed, the InvestorIQ Vercel project must bind these **server-only Production** environment variables exactly:

```text
STRIPE_PRICE_SCREENING=price_1UAUEAPlUvcaYNKZ6NZQZdhR
STRIPE_PRICE_UNDERWRITING=price_1UAUEFPlUvcaYNKZ0e3HUSTM
STRIPE_PRICE_BUNDLE=price_1UAUEjPlUvcaYNKZy8R3JkgS
```

The connected Vercel surface available during implementation could inspect the project but could not write environment variables, and the local Vercel CLI had no authenticated session. The binding therefore remains an explicit owner-controlled activation step, not a silently assumed production change.

Apply Phase 1, Phase 2, Phase 3 and Phase 4 migrations in timestamp order before deploying their code. After deployment, execute the paid, zero-dollar promotion, quantity, bundle, webhook replay and redirect-race production certification described in the operations runbook. Do not archive the old prices until the new deployment and all three server catalog availability checks are proven.

## Local exit evidence

Passed from this branch:

- Phase 4 catalog, Checkout, webhook, atomic entitlement and success-state contract tests;
- actual mocked Checkout, webhook and checkout-status handler runtime scenarios;
- Phase 1 admission/core-mode regression;
- Phase 2 atomic publication/delivery and artifact-compensation regressions;
- Phase 3 worker/render/runtime/recovery regression;
- JavaScript syntax checks, `git diff --check`, and the production build.

The broader launch suite retains the inherited Vercel Hobby function-budget failure: the repository exposes 15 deployable function routes while the sentinel limit is 12. Phase 4 adds no deployable function because the public catalog shares the existing Checkout route. This remains a deployment-plan gate rather than a commerce correctness regression.

Production certification remains intentionally pending because the consolidated migrations and branch are not deployed.
