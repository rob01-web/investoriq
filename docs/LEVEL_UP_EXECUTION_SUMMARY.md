# Premium Underwriting Level-Up Summary

Status: Active summary
Updated: July 25, 2026

## Decision

InvestorIQ will not rewrite the stabilized report pipeline and will not resurrect the legacy underwriting implementation.

The current Underwriting Report will be expanded through a consume-only Premium Acquisition Underwriting V1 sidecar that:

- Reads canonical accepted receipts.
- Performs only governed deterministic analysis.
- Validates independently.
- Enters the renderer through one guarded insertion.
- Defaults off.
- Preserves the current path when disabled.
- Requires a job-level report-surface version before external activation.
- Receives independent premium certification.

Full doctrine: [PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md](PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md)

Execution plan: [UNDERWRITING_GAMEPLAN_v2.md](../UNDERWRITING_GAMEPLAN_v2.md)

## Why

The current report can be factually correct and visually readable while still underusing accepted evidence and presenting too little institutional analysis for a premium underwriting product.

The correction is not a mandatory number of pages. The correction is:

- Better accepted-evidence utilization.
- More deterministic operating, unit, expense, debt, valuation, and diligence analysis.
- Clearer source lineage.
- Denser information architecture.
- Less accidental whitespace.
- Better appendices.
- Source-aware collapse.

## Protected Spine

Initial implementation may not alter:

- Source Truth.
- Core Publish-or-Collapse.
- Delivery Gate source eligibility.
- Worker.
- Publication and storage.
- Billing, credits, remedies, or lifecycle.
- Screening.
- Existing PDF Boss doctrine.

## Immediate Sequence

1. Lock doctrine.
2. Add characterization shield.
3. Build disconnected premium model.
4. Repair supporting-source authority only where forensically proven and in isolated patches.
5. Implement locked deterministic formulas.
6. Validate lineage and eligibility.
7. Add one guarded renderer insertion.
8. Observe premium completeness.
9. Certify internal PDF composition.
10. Add job-level surface-version authority.
11. Activate external premium enforcement only after all gates pass.

## Launch Rule

Core delivery eligibility and premium certification are different.

Before external enforcement, premium QA begins as observation and may not weaken core publication.

After an order is externally promised Premium Acquisition Underwriting V1, failure of premium certification may not silently downgrade the customer to the thinner base artifact. It remains an internal report-generation or certification failure unless canonical core authority independently proves a valid customer-source failure.

## Deferred Scope

Refinance stress matrices, max proceeds, binding LTV-versus-DSCR analysis, refinance classifications, and return modeling remain deferred until their scenario and methodology authority is explicitly governed and versioned.
