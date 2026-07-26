# Premium Acquisition Underwriting V1 Execution Plan

Status: Active execution plan
Doctrine: [Premium Acquisition Underwriting V1 Doctrine](docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md)
Parent doctrine: [InvestorIQ Product Doctrine](docs/INVESTORIQ_PRODUCT_DOCTRINE.md)

## Objective

Expand the current InvestorIQ Underwriting Report into a financing- and investment-committee-ready acquisition underwriting product without destabilizing the hardened source, delivery, publication, or commercial pipeline.

This plan does not authorize a rewrite, a legacy underwriting resurrection, speculative analysis, or a fixed report length.

## Locked Architecture

```text
Protected canonical receipts
          |
          v
Disconnected Premium Expansion Model
          |
          v
Independent validation and certification
          |
          v
One feature-flagged renderer insertion
          |
          v
Existing HTML, PDF, quality, and publication path
```

Protected systems:

- Source Truth.
- Core Publish-or-Collapse.
- Delivery Gate source eligibility.
- Worker orchestration.
- Storage and publication.
- Billing, credits, remedies, and lifecycle.
- Screening.
- Existing PDF Boss doctrine.

## Current Implementation Closeout — July 26, 2026

The internal-test Premium Acquisition Underwriting V1 build is complete through the protected surface-receipt isolation boundary.

Completed and protected:

- Phase 0 doctrine and default-off characterization.
- Phase 1 consume-only model skeleton.
- Phase 2 renovation and market source-authority repairs, including field-level renovation-row provenance preservation.
- Phase 3 governed deterministic receipt mapping and calculations.
- Phase 4 independent model validation and lineage proof.
- Phase 5 one guarded renderer insertion with flag-off equivalence.
- Phase 6 observe-only completeness and disconnected internal-test certification.
- Phase 7 representative multi-page PDF composition under the unchanged PDF Boss.
- Internal-only report-surface receipt authority and integration isolation proof.

Current authority remains:

```text
assignment_scope: internal_test_only
external_premium_activation: false
worker_integration: not_started
external_underwriting_enforcement: not_started
delivery_or_publication_authority_changed: false
```

The next boundary is the unfinished external portion of Phase 8. It requires a separately bounded worker/job-start integration patch followed by separately reviewed external premium certification and enforcement. Those changes are not authorized by completion of the internal-test phases and may not be combined with feature activation.

## Phase 0: Doctrine and Characterization Shield

### Deliverables

- Locked product doctrine.
- Locked premium doctrine.
- Active roadmaps supersede unsafe legacy plans.
- Permanent flag-off characterization tests.

### Required proof

- Screening unchanged.
- Base Underwriting unchanged when premium is disabled.
- Source Truth unchanged.
- Current and proposed debt remain separate.
- Delivery decisions unchanged.
- Worker, billing, credits, and remedies untouched.
- Protected replays pass.
- Unsupported analysis still collapses.
- Reconciliation remains canonical.

### Exit gate

No premium production behavior is connected until the characterization shield passes.

## Phase 1: Disconnected Premium Model Skeleton

### Deliverables

- A pure consume-only Premium Expansion Model.
- Explicit version and schema.
- Canonical input adapter.
- Section eligibility states.
- Field-level lineage.
- Independent validation receipt.
- No renderer import.
- No worker import.
- No delivery or publication authority.

### Initial model sections

- Executive Underwriting Summary.
- Property and Transaction Context.
- Operating Performance.
- Rent Roll and Unit Economics.
- Expense Structure.
- Current and Proposed Debt.
- Debt Capacity and Coverage.
- Valuation and Appraisal Bridge.
- Capital Plan Evidence.
- Market Evidence.
- Environmental Evidence.
- Evidence and Diligence Register.
- Source Reconciliation.
- Methods and Limitations.
- Appendices.

### Exit gate

The model builds deterministically from synthetic canonical receipts, collapses unsupported sections, and cannot affect a customer artifact.

## Phase 2: Isolated Supporting-Source Authority Repairs

Known candidate gaps must be reverified before editing:

- Renovation plan rows.
- Market-survey rent ranges.

Each repair requires its own patch and proof:

- Extraction fixture.
- Canonical acceptance contract.
- Contradiction and rejection behavior.
- No core publication effect.
- No renderer or calculation change.

### Exit gate

Canonical supporting-source receipts contain the accepted row-level evidence needed by the premium model, or the dependent premium sections remain collapsed.

## Phase 3: Formula Constitution and Deterministic Calculators

Implement only formulas authorized by the premium doctrine:

- Occupied and vacant counts.
- Occupancy by unit type.
- Rent PSF and rent gap.
- Expense composition and per-unit costs.
- Proposed debt yield.
- Current-to-proposed debt-service change.
- LTV by explicitly labeled accepted basis.
- Purchase-price versus appraisal bridge.
- Minimum purchase-price equity before transaction costs.
- Governed debt-inclusive break-even occupancy.

Every calculator must return:

- Status.
- Value.
- Units.
- Formula version.
- Operand lineage.
- Eligibility evidence.
- Exact collapse reason.

No formatter or renderer may recalculate a value.

### Exit gate

Formula-level positive, missing-input, zero-denominator, role-conflict, and source-lineage tests pass.

## Phase 4: Premium Model Validation

Validate:

- Canonical input provenance.
- Formula eligibility.
- Debt-role separation.
- Reconciliation consistency.
- Duplicate or contradictory fields.
- Section activation.
- Prohibited calculations and narratives.
- Source-aware collapse.

### Exit gate

Only an independently valid premium model can become render-eligible.

## Phase 5: Guarded Renderer Integration

Add one conceptual insertion:

```js
if (premiumCapabilityEnabled && jobSurfaceVersionIsPremium && premiumModel.validation.ok) {
  renderPremiumUnderwritingSections(premiumModel);
}
```

The renderer may not:

- Read raw uploads.
- Reinterpret Source Truth.
- Recalculate.
- Infer missing values.
- Alter existing base sections.
- Suppress the base report.
- Affect Screening.

Initially append or insert premium chapters into defined slots without deleting established base content.

### Exit gate

Flag-off output is contract-equivalent. Flag-on output uses only validated premium fields. Invalid premium models render no premium sections.

## Phase 6: Premium Completeness Contract

Roll out in four stages:

1. `observe_only`
2. `internal_test_required`
3. `premium_flag_required`
4. `external_underwriting_enforcement`

Measure:

- Accepted-evidence utilization.
- Required financial row preservation.
- Canonical reconciliation preservation.
- Eligible chapter coverage.
- Lineage completeness.
- Prohibited content.
- Semantic density.
- Composition quality.

Do not use page count as a certification proxy.

### Exit gate

Several representative internal packages pass without false blocking of legitimate section collapse.

## Phase 7: Institutional PDF Composition

Refine only premium section composition:

- Stable numeric and label/value geometry.
- Repeated headers on continued tables.
- Controlled row splitting.
- Orphan-heading prevention.
- Dense but readable spacing.
- Local limitation notes.
- Appendices for detailed accepted evidence.

Do not broadly redesign the existing PDF system or weaken PDF Boss.

### Exit gate

Page-by-page visual and extraction-based certification passes on sparse, complete, constrained, and adversarial packages.

## Phase 8: Surface-Version Authority and External Enforcement

Add an immutable job-start surface-version receipt.

Status: internal-only receipt resolution and isolation proof are complete. Persistence or consumption by the production worker has not started.

External premium activation requires:

- Deployment capability enabled.
- Premium job version pinned.
- Premium model valid.
- Premium artifact certified.
- Protected replay suite passing.
- Rollback proven.

An externally promised premium job may not silently receive the base report. Premium failure is an internal generation or certification failure unless canonical core authority independently proves a customer-source failure.

### Exit gate

One explicit launch decision enables new premium orders. Existing jobs and Screening remain unchanged.

## Phase 9: Deferred Full Capital-Risk Underwriting

Do not begin until separately authorized.

Potential later scope:

- Versioned deterministic scenario sets.
- Max refinance proceeds.
- LTV-versus-DSCR binding constraint.
- Refinance coverage matrices.
- Governed stability classifications.

This phase requires explicit policy receipts and may not reuse hardcoded legacy assumptions.

## Test Strategy

For every phase:

1. Focused unit or contract smoke.
2. Relevant authority and renderer suites.
3. Source Truth constitutional matrix where inputs change.
4. Financial Intelligence suite where calculations change.
5. Institutional PDF suite where customer composition changes.
6. Permanent RETEST replays.
7. Production build when runtime integration changes.
8. Syntax, diff, and scoped status checks.

No live services or live RETEST are part of implementation verification without separate authorization.

## Commit Strategy

Recommended commits:

1. Doctrine and characterization shield.
2. Disconnected premium model skeleton.
3. Renovation authority repair, if required.
4. Market-survey authority repair, if required.
5. Formula contracts and calculators.
6. Premium validation.
7. Guarded renderer integration.
8. Observe-only completeness contract.
9. Premium composition.
10. Internal premium certification.
11. Surface-version authority.
12. External enforcement.

Each commit must be independently revertible.

## Launch Acceptance

Premium V1 is ready only when all definition-of-done requirements in the controlling premium doctrine are satisfied. “More pages” is not an exit gate. The exit gate is a source-grounded, analytically complete, premium-certified report whose disabled path leaves the stabilized product unchanged.
