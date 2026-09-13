# InvestorIQ Current Handoff - 2026-09-13

This file is the current September 13 continuation authority. It supplements the preserved historical `00_CURRENT_HANDOFF.md`; do not delete or rewrite prior handoff history.

## Current branch and code parent

- Working branch: `hotfix-worker-queue-starvation-20260911-r1`
- Runtime/code parent before documentation-only handoff updates: `811af341f481b55e24803c2a8c296686669630af`
- The owner's local working tree is still based on that SHA and contains the authoritative uncommitted Slice 1A v5 patch.
- No Slice 1 runtime commit, push, merge, Vercel deployment, migration, scheduler change, Supabase mutation, Stripe mutation, or production Final Attack Test was performed on September 12.
- The September 12 prelaunch architecture audit remains the controlling launch-blocker register where earlier optimistic launch-readiness notes conflict.

## Exact local Slice 1A v5 working-tree state

The local worktree contains these nine Slice 1A paths:

- `M api/_lib/deterministic-report-contract-qa-seal.js`
- `M api/_lib/generate-client-report-impl.js`
- `M api/_lib/report-contract-qa.js`
- `M api/_lib/screening-report-renderer.js`
- `M api/report-template-runtime.html`
- `M tests/qa/p0b-deterministic-contract-qa-seal-smoke.js`
- `M tests/qa/run-all.js`
- `?? api/_lib/canonical-operating-metrics.js`
- `?? tests/qa/canonical-operating-cost-coverage-ratio-smoke.js`

Treat that local v5 state as the Slice 1A authority. GitHub contains the parent baseline and documentation updates, not the owner's uncommitted runtime patch.

## Slice 1A v5 authority already established

The OPEX / GPR metric is being cut over from the retired operating label `Break-Even Occupancy` to `Operating Cost Coverage Ratio`.

Canonical OCCR rules:

- Formula: accepted total operating expenses divided by accepted T12 gross potential rent.
- Physical occupancy is a separate metric and must never be subtracted from OCCR or presented as the same dimension.
- Classification thresholds: `>75%` Sensitized and `>85%` Fragile.
- Exactly `75%` remains Stable; exactly `85%` remains Sensitized.
- Formatting is explicit ratio formatting. `2.0` means `200.0%`, not `2.0%`.
- Negative operating expenses and non-positive GPR are invalid inputs.
- Stonebridge diagnostic: `$555,000 / $1,612,800 = 34.41%` OCCR; physical occupancy remains `93.75%` as a separate source fact.
- Screening no longer uses an occupancy-minus-OCCR cushion or an occupancy/OCCR comparison chart.
- Temporary internal `breakEven...` aliases are compatibility only until Slice 1B is fully cut over. They are not customer terminology authority.

## September 12 whole-Slice-1 attempt and rollback

A transactional whole-Slice-1 release-candidate runner was attempted from exact v5. It was designed to restore every touched file if any gate failed.

The focused H14/H15 Underwriting regression failed because a stale assertion expected `Going-In Cap Rate 7.0%` while the current rendered output correctly uses `7.00%`.

The runner restored every touched file to the exact Slice 1A v5 state. Slice 1B was not left partially applied. Do not rerun that old release candidate and do not fix only that stale assertion.

## Additional findings from the deeper post-failure audit

Before another complete Slice 1 runner is trusted, the following active issues must be incorporated into the same coherent repair:

1. An institutional integration fixture used the wrong GPR basis for the Stonebridge-style case.
2. The deterministic seal could falsely fail when OCCR is legitimately unavailable.
3. The Underwriting customer-surface model could manufacture or diverge from canonical Source Truth instead of consuming one shared operating-metric authority.
4. Quality Manifest calculation receipts could coerce missing values through `Number(null)` and accidentally represent zero instead of unavailable.
5. OCCR calculation provenance could become overly broad by inheriting source identities that did not provide its inputs.
6. `api/_lib/acquisition-memo-v2-document.js` still contains an active historical Break-Even Occupancy path that must be audited before the next complete runner.
7. Underwriting base contracts still require Slice 1B cutover so wrappers no longer repair obsolete semantics after construction.

Candidate corrections for these issues were proven in a rebuilt sandbox, including canonical OCCR math, exact threshold boundaries, explicit 200% formatting, occupancy separation, and source-truth handling. Those candidate Slice 1B changes were not left applied after the transactional rollback.

## Required next action

Do not immediately create another patch runner.

First finish the active-path audit for Slice 1. Inspect the acquisition memo document and customer-surface model, Quality Manifest, Underwriting operating-intelligence base/wrapper contracts, Chapter 1 base/wrapper contracts, active renderers, deterministic seal consumers, manifest consumers, and relevant tests.

Search active code for:

- `Break-Even Occupancy`
- `break-even occupancy`
- `breakEvenOccupancy`
- `breakEvenOccR`
- `occupancyBreakEvenSpread`
- `OCCUPANCY_BREAK_EVEN_POSITION`
- independent OPEX/GPR division
- OCCR passed through magnitude-inference ratio/percent helpers
- physical occupancy minus OCCR comparisons
- stale 0.70 / 0.75 / 0.80 / 0.85 operating-ratio thresholds

Classify every hit as an active Slice 1 blocker, temporary compatibility alias required only until the same cutover, legitimate separate debt-inclusive break-even concept, historical/archive/test-only evidence, or later-slice validator language.

Only after that audit should the next chat prepare one complete transactional Slice 1 runner from exact v5. Run focused regressions, stale-alias scans, `git diff --check`, canonical `npm run qa`, production build, and a final line-by-line diff review. Commit only after the entire Slice 1 is locally certified.

## Commit doctrine

Commit is the finish line of a slice, not part of the repair loop.

If final review finds another issue, repair it inside the same uncommitted Slice 1, rerun affected checks, rerun the full required gates, review the final diff again, and only then commit once.

## Standing production holds

- No merge to `main`.
- No Vercel deployment.
- No production Final Attack Test.
- No migrations.
- No scheduler mutation.
- No Supabase/Storage mutation.
- No Stripe/pricing mutation.
- No historical queued/dead-letter replay.
- Keep DocRaptor in TEST mode until separately authorized.

## Seven-slice September 12 repair sequence

1. Slice 1: canonical financial + terminology authority - IN PROGRESS.
2. Slice 2: worker failure integrity.
3. Slice 3: deadline + lease + recovery architecture.
4. Slice 4: queue fairness + checkpoint correctness.
5. Slice 5: artifact/publication contract.
6. Slice 6: validators/customer language.
7. Slice 7: certification architecture.

Do not move to Slice 2 until Slice 1 is completely closed.
