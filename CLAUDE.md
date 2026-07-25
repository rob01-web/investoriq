# CLAUDE.md

Repository guidance for coding agents working on InvestorIQ.

## Controlling Doctrine

Read these documents before changing product behavior:

1. [InvestorIQ Product Doctrine](docs/INVESTORIQ_PRODUCT_DOCTRINE.md)
2. [Premium Acquisition Underwriting V1 Doctrine](docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md)
3. [Pipeline Map](PIPELINE_MAP.md) for read-only orientation

The product doctrine controls all work. The premium doctrine additionally controls every Underwriting Report expansion, model, calculation, renderer, certification, and rollout change.

Do not follow an archived roadmap or reactivate legacy underwriting logic merely because it remains in the repository.

## Non-Negotiable Rules

- Document-driven only.
- Canonical Source Truth is the factual authority.
- Fail closed at the narrowest defensible field or section.
- Publish when accepted core evidence supports a defensible report.
- Deterministic math only.
- Institutional tone.
- No hype.
- No BUY/SELL language.
- No fabricated narrative.
- No unstated scenario, market, refinance, growth, discount, or exit assumptions.
- Preserve current-debt and proposed-debt role separation.
- Renderers may present accepted facts and authorized receipts; they may not create authority.
- Internal failures may not be converted into customer-document failures.
- Screening and Underwriting remain distinct products.

## Premium Underwriting Work

Premium Acquisition Underwriting V1 is an additive, consume-only sidecar.

It must:

- Default off behind `PREMIUM_ACQUISITION_UNDERWRITING_V1=false`.
- Consume canonical receipts directly.
- Remain independent from rendered HTML and legacy compatibility state.
- Integrate through one guarded renderer insertion.
- Preserve contract-equivalent base behavior when disabled.
- Use an immutable job-level report-surface version before external activation.
- Roll out quality enforcement from observe-only to internal-required to external enforcement.
- Require independent premium certification.
- Never silently downgrade an externally promised premium job to the thinner base report.

It must not initially change Source Truth, Delivery Gate source eligibility, worker orchestration, publication authority, credits, billing, remedies, Screening, or PDF Boss doctrine.

There is no universal page-count target. Measure accepted-evidence utilization, analytical depth, semantic density, readability, and correct pagination.

## Safe Execution Order

1. Characterize and protect the current path.
2. Build the premium model disconnected.
3. Repair any missing supporting-source authority in isolated patches.
4. Lock formula contracts before calculators.
5. Validate lineage and eligibility.
6. Add one guarded renderer insertion.
7. Observe quality before enforcing it.
8. Prove internal PDF composition and certification.
9. Prove protected replays and flag-off equivalence.
10. Add job-level surface-version authority.
11. Enable external premium enforcement only after certification.

Do not combine source extraction, calculations, rendering, quality enforcement, worker changes, or commercial activation in one patch.

## Commands

Use the scripts defined in `package.json`. The repository has extensive automated contract, QA, parser, renderer, PDF, replay, build, and end-to-end tests.

Common commands:

```bash
npm run dev
npm run build
npm run qa:renderer
npm run qa:sources
npm run qa:financial-intelligence
npm run qa:institutional-pdf
npm run qa:launch-core
npm run qa:full
```

Run the narrowest focused test first, then the protected suites proportionate to the change.

## Change Discipline

- Inspect the current authority chain before editing.
- Add characterization proof before new behavior.
- Keep commits narrow, independently reviewable, and revertible.
- Preserve unrelated user changes.
- Do not deploy, run live services, or run a live RETEST unless explicitly authorized.
- Use [UNDERWRITING_GAMEPLAN_v2.md](UNDERWRITING_GAMEPLAN_v2.md) as the current execution plan.
- Use [ELITE_ROADMAP.md](ELITE_ROADMAP.md) as the current product roadmap.
