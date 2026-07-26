# Premium Acquisition Underwriting V1 Doctrine

Status: Locked product and implementation doctrine
Effective: July 25, 2026
Applies to: InvestorIQ Underwriting Report expansion work
Controlling parent doctrine: [INVESTORIQ_PRODUCT_DOCTRINE.md](INVESTORIQ_PRODUCT_DOCTRINE.md)

## 1. Launch Decision

InvestorIQ will expand the current Underwriting Report through an additive, feature-flagged, consume-only analytical and presentation layer.

Premium Acquisition Underwriting V1 is not:

- A rewrite of the stabilized report pipeline.
- A resurrection of legacy underwriting HTML or legacy calculation logic.
- Screening with additional pages.
- A speculative refinance model.
- A license to invent assumptions, benchmarks, narratives, risk labels, or missing facts.

It is a source-aware acquisition underwriting report built from canonical accepted evidence and authorized deterministic calculations.

The locked implementation principle is:

> Protect the spine. Add depth beside it. Prove it while disconnected. Integrate it through one guarded insertion point. Observe before enforcing. Promote gradually. Roll back instantly.

## 2. Product Standard

The commercial objective is an institutional report suitable for serious acquisition, financing, and investment-committee review.

Quality is not defined by a mandatory page count. It is defined by:

- Decision-useful analytical depth.
- Clear source lineage.
- Complete use of accepted evidence.
- Correct and governed calculations.
- Dense, legible information architecture.
- Explicit limitations where evidence is incomplete.
- No filler, padding, repeated narrative, or artificially expanded pagination.
- No predominantly empty analytical pages.
- No customer-visible internal machinery.

An 11-page report is not automatically deficient, and a 30-page report is not automatically institutional. A premium report is deficient when accepted source evidence and authorized analysis are available but omitted, fragmented, weakly explained, or presented with excessive whitespace.

## 3. Protected Foundation

Premium V1 may not initially change:

- Source Truth authority.
- Core Publish-or-Collapse rules.
- Delivery Gate source eligibility.
- Worker orchestration.
- Storage or publication authority.
- Credits, billing, remedies, or customer lifecycle.
- Screening.
- Existing PDF Boss thresholds, issue codes, or publication doctrine.
- Accepted current-debt facts, proposed-debt facts, or debt-role separation.
- Existing reconciliation authority.

These systems are the protected spine. The expansion must consume their accepted outputs and may not reinterpret or mutate them.

## 4. One-Way Architecture

```text
Canonical Source Truth receipts
Canonical Financial Intelligence receipts
Canonical reconciliation receipts
Canonical report identity
Later: versioned and approved analysis-policy receipts
                         |
                         v
Premium Acquisition Underwriting Expansion Model
                         |
                         v
Independent premium validation and certification
                         |
                         v
One guarded renderer insertion
                         |
                         v
Existing HTML, PDF, quality, delivery, and publication path
```

The Premium Expansion Model must consume canonical receipts directly where possible. It must not scrape, parse, or reinterpret:

- Rendered HTML.
- The current CustomerSurfaceModel.
- Raw uploads.
- Unaccepted extraction candidates.
- Compatibility objects.
- Legacy state.
- PDF text.

The existing CustomerSurfaceModel remains the base report surface. The Premium Expansion Model is an independent sidecar whose validated sections are inserted into that surface.

## 5. Activation and Version Pinning

The deployment capability flag is:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=
```

The repository-safe default is capability `false` with no activation timestamp.

External assignment requires both:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=true
AND
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=<valid ISO-8601 UTC timestamp>
```

Capability `true` without a valid activation timestamp must fail closed. The
two values must be applied together in one governed deployment configuration
change. No repository commit may silently activate the feature.

A deployment flag alone is not sufficient for external activation. Every job must ultimately carry an immutable report-surface version resolved at job start.

Initial surface versions:

```text
acquisition_underwriting_base_v1
premium_acquisition_underwriting_v1
```

Premium rendering requires both:

```text
deployment capability enabled
AND
job report_surface_version = premium_acquisition_underwriting_v1
```

Jobs created before the activation timestamp remain on the base surface. New
underwriting jobs created at or after that timestamp may be assigned the
premium surface. Screening always remains on its existing surface.

The immutable job-start surface receipt controls the assigned surface after
resolution. Later environment changes may stop new premium assignment but may
not mutate a receipt or downgrade an already promised premium job.

With premium disabled:

- Existing production behavior must remain unchanged.
- Existing canonical receipts, visible facts, calculations, sections, decisions, and delivery outcomes must remain contract-equivalent.
- The premium model must have no publication authority.
- The premium renderer insertion must emit nothing.
- Exact HTML equality should be used where deterministic.
- PDF byte equality is not required because timestamps, metadata, fonts, and external PDF engines may vary.

## 6. Canonical Input Contract

Premium V1 may consume only:

- Canonical accepted T12 facts.
- Canonical accepted Rent Roll facts and rows.
- Canonical accepted current-debt facts.
- Canonical accepted proposed-debt facts.
- Canonical accepted appraisal facts.
- Canonical accepted renovation facts.
- Canonical accepted market-survey facts.
- Canonical accepted environmental facts.
- Canonical accepted assumptions.
- Canonical reconciliation receipts.
- Existing authorized deterministic Financial Intelligence receipts.
- Canonical document-treatment and report-identity receipts.
- Versioned policy receipts that are separately approved in a later phase.

Every premium field must carry enough lineage to identify:

- The canonical source or receipt.
- Its evidence status.
- Its calculation method when derived.
- Its display eligibility.
- Its reason for collapse when not eligible.

Presence of a supporting document is never sufficient. Only accepted canonical facts and explicit section eligibility may activate a premium section.

## 7. Analysis Constitution

### 7.1 Source facts

Accepted source facts may be reorganized and presented in greater depth without changing their value, status, role, or authority.

### 7.2 Deterministic derivations authorized for V1

The following analysis families are authorized only when all required operands are canonical and accepted:

- Occupied and vacant unit counts.
- Occupancy by accepted unit type.
- In-place rent per square foot.
- Market rent per square foot.
- Rent gap by unit type.
- Expense composition.
- Expenses per unit.
- Debt yield.
- Current-to-proposed debt-service change.
- Purchase price versus accepted appraisal value.
- LTV against each explicitly labeled accepted value basis.
- Minimum purchase-price equity before transaction costs.
- Debt-inclusive break-even occupancy under the governed formula below.

No calculation may substitute an unsupported input, silently choose between contradictory bases, or infer a market assumption.

### 7.3 Locked formula labels and definitions

#### Unit occupancy

Use the canonical accepted unit-status or occupancy receipt. The premium model must not create a competing occupancy authority.

```text
Occupancy by unit type = occupied accepted units in type / total accepted units in type
```

The report must state the row population and any excluded or unresolved rows.

#### Rent per square foot

```text
In-place rent PSF = accepted in-place monthly rent / accepted unit square feet
Market rent PSF = accepted market monthly rent / accepted unit square feet
```

Only rows with a positive accepted square-foot value and the required accepted rent may participate. The report must disclose the included and excluded row counts.

#### Rent gap

```text
Monthly rent gap = accepted market rent - accepted in-place rent
Rent gap percentage = monthly rent gap / accepted in-place rent
```

The percentage must collapse when accepted in-place rent is zero or missing.

#### Expense composition and per-unit cost

```text
Expense share = accepted expense category / accepted total operating expenses
Expense per unit = accepted expense category / accepted total unit count
```

The report must label the period and source basis.

#### Debt yield

```text
Debt yield = accepted T12 NOI / accepted proposed loan amount
```

Debt yield must be labeled as proposed-debt debt yield. Current debt may not be substituted.

#### Debt-service change

```text
Annual debt-service change = accepted proposed annual debt service - accepted current annual debt service
Debt-service change percentage = annual debt-service change / accepted current annual debt service
```

The percentage must collapse when current annual debt service is zero or missing.

#### LTV

```text
LTV = accepted proposed loan amount / explicitly identified accepted value basis
```

Each LTV must name its denominator, such as purchase price or accepted appraisal value. Denominators may not be blended.

#### Minimum purchase-price equity before transaction costs

```text
Minimum purchase-price equity before transaction costs
  = accepted purchase price - accepted proposed loan amount
```

This must never be labeled total equity, total cash required, or complete sources and uses. It excludes closing costs, lender costs, reserves, escrows, renovation funding, fees, and any other uses not canonically accepted.

#### Debt-inclusive break-even occupancy

```text
Debt-inclusive break-even occupancy
  = (accepted T12 operating expenses + accepted annual debt service)
    / accepted T12 gross potential rent
```

Current and proposed debt-service cases must be separately labeled. This calculation is eligible only when accepted T12 operating expenses, accepted T12 gross potential rent, and the relevant accepted annual debt service are available and positive where required.

The report must identify this as a simplified operating break-even ratio based on the accepted T12 period. It is not a cash-flow forecast and does not include unsupported capital expenditures, reserves, transaction costs, taxes outside accepted operating expenses, or other unstated uses.

### 7.4 Calculations that must collapse

The following must collapse unless their complete governed inputs and methodology are separately authorized:

- Complete sources and uses.
- Total equity requirement.
- Levered returns.
- IRR.
- Equity multiple.
- Cash-on-cash return.
- Exit value.
- Discounted cash flow.
- Market growth.
- Renovation ROI.
- Renovation value creation.
- Max refinance proceeds.
- Refinance sensitivity matrices.
- Binding LTV-versus-DSCR constraint.
- Refinance Stability Classification.
- Any recommendation to proceed, buy, sell, finance, or decline.

## 8. Premium V1 Customer Surface

Premium V1 should use accepted evidence to produce the following content-aware chapters when eligible:

1. Executive Underwriting Summary.
2. Property and Transaction Context.
3. Operating Performance.
4. Rent Roll and Unit Economics.
5. Expense Structure.
6. Current and Proposed Debt.
7. Debt Capacity and Coverage.
8. Valuation and Appraisal Bridge.
9. Capital Plan Evidence.
10. Market Evidence.
11. Environmental Evidence.
12. Evidence and Diligence Register.
13. Source Reconciliation.
14. Methods, Definitions, and Limitations.
15. Supporting Appendices.

These are eligibility slots, not mandatory filler. A chapter or subsection must collapse when its required accepted evidence is absent.

The report must preserve:

- Every approved financial label/value row needed by certification.
- Exact displayed numbers from the approved customer surface.
- Canonical reconciliation disclosures.
- Canonical report identity.
- Current-debt and proposed-debt separation.
- Source treatment and limitations.

The Evidence and Diligence Register may describe:

- Evidence received.
- Evidence accepted.
- Evidence constrained.
- Evidence rejected.
- Evidence missing.
- Dependent analysis that collapsed.
- Follow-up information needed.

It may not assign risk severity, urgency, priority, or a decision recommendation without an approved policy receipt.

## 9. Composition Doctrine

Pagination is content-driven. No implementation or acceptance test may require a universal minimum or target number of pages.

Premium composition must:

- Favor decision-useful tables, bridges, schedules, and concise explanatory text.
- Use stable table geometry and repeat headers on continued tables.
- Keep labels, values, units, periods, and bases visibly connected.
- Avoid orphaned headings and separated table headings.
- Avoid predominantly blank analytical pages.
- Avoid duplicating the same facts or narrative across chapters.
- Preserve legibility without inflating whitespace.
- Place limitations next to the analysis they qualify.
- Use appendices for detailed accepted evidence that would overload the main narrative.

Quality review must measure semantic coverage and accepted-evidence utilization, not page count.

## 10. Core Delivery and Premium Certification

Core delivery eligibility and premium certification are distinct statuses:

```text
core_delivery_eligible
premium_underwriting_certified
```

The existing core Publish-or-Collapse constitution continues to decide whether source evidence supports a defensible base report.

Premium certification determines whether the expanded artifact satisfies the premium contract. It validates:

- Canonical input lineage.
- Formula eligibility.
- Required source-aware content.
- Reconciliation preservation.
- Debt-role separation.
- Customer-surface completeness.
- PDF composition.
- Prohibited content.
- No hidden downgrade to the base surface.

The premium completeness contract must roll out in stages:

```text
Stage 1: observe_only
Stage 2: internal_test_required
Stage 3: premium_flag_required
Stage 4: external_underwriting_enforcement
```

Before Stage 4, observations may create internal quality evidence without changing core delivery authority.

At Stage 4, a job sold and pinned to Premium Acquisition Underwriting V1 may publish only a premium-certified artifact. If premium certification fails:

- Do not silently deliver the thinner base report as the paid premium product.
- Preserve the constitutional core source decision.
- Classify the failure as an internal report-generation or premium-certification failure.
- Do not blame customer documents unless canonical core authority independently established a valid customer-source failure.
- Use existing governed remedy and lifecycle authority without changing it as part of this project.

## 11. Implementation Sequence

The required sequence is:

1. Characterization shield.
2. Disconnected Premium Expansion Model skeleton.
3. Isolated renovation-row authority repair, if still required.
4. Isolated market-survey authority repair, if still required.
5. Locked formula contracts and deterministic calculators.
6. Premium model validation and lineage proof.
7. One guarded renderer insertion.
8. Observe-only premium completeness QA.
9. Internal PDF composition proof.
10. Internal premium certification.
11. Protected replay and flag-off equivalence proof.
12. Job-level surface-version authority.
13. External premium enforcement.
14. Governed stress and refinance policy in a later version.

No phase may be skipped merely to increase report length.

## 12. Commit Boundaries

Each commit must be independently reviewable and revertible.

Required boundaries:

- Characterization tests before functional changes.
- Premium model skeleton separate from renderer integration.
- Each supporting-source authority repair in its own commit.
- Formula contracts separate from presentation.
- Renderer insertion separate from quality enforcement.
- Observe-only quality separate from blocking certification.
- Job-version authority separate from analytical content.
- No mixed worker, billing, credit, remedy, or Delivery Gate changes.

A supporting-source repair must include focused extraction, canonical-authority, and regression proof. It must not be bundled with calculations or rendering.

## 13. Required Characterization Shield

Before premium logic is connected, permanent tests must prove:

- Screening output and authority are unchanged.
- Base Underwriting output is unchanged when premium is disabled.
- Source Truth is unchanged.
- Current and proposed debt roles remain separate.
- Delivery decisions are unchanged.
- Worker, credits, billing, remedies, and customer lifecycle are untouched.
- Existing protected replays pass.
- Unsupported inputs still collapse.
- Canonical reconciliation remains authoritative.
- Legacy underwriting logic remains unauthorized.

## 14. Rollback

Rollback must be immediate:

- Disable the deployment capability flag.
- Stop assigning the premium report-surface version.
- Preserve the existing core path.
- Require no database authority rollback during disconnected development.
- Require no billing, credit, worker, Delivery Gate, or customer-remedy rollback.

Once a job is externally sold and pinned to a premium surface version, rollback may stop new premium assignment but may not silently downgrade that job's promised artifact.

## 15. Deferred Full Underwriting

Full capital-structure and refinance underwriting remains a later governed product phase. It may include deterministic stress sets, max proceeds, LTV-versus-DSCR binding analysis, refinance coverage, and classification tiers only after:

- The required debt and value inputs are canonically accepted.
- Formula and scenario policy is versioned.
- Thresholds and classifications have explicit authority.
- The work passes the same disconnected, feature-flagged, lineage, and certification discipline.

Premium V1 must not pre-empt that authority with hardcoded assumptions.

## 15A. Implementation Status Receipt — July 26, 2026

This status receipt records implementation progress and does not amend the authority boundaries in this doctrine.

Completed:

- Default-off characterization shield.
- Consume-only receipt map and deterministic analysis.
- Validated premium expansion model.
- Guarded renderer insertion with base-path equivalence.
- Observe-only completeness receipt.
- Representative internal PDF composition certified by the unchanged PDF Boss.
- Disconnected internal-test certification.
- Internal-only job-surface receipt authority and integration isolation.
- Exact field-level provenance for merged renovation-row evidence.
- Immutable production job-start surface receipt persistence and consumption.
- Premium generation from the pinned canonical job surface.
- Strict external premium certification after the unchanged PDF Boss.
- Independent worker-side no-silent-downgrade enforcement before publication
  record resolution.
- Fail-closed capability and activation-timestamp assignment contract.

Repository activation status:

```text
readiness: READY_NOT_ACTIVATED
external_feature_activation: false
live_environment_changed: false
deployment_performed: false
```

The external integration implementation is complete. It does not alter Source
Truth, the CustomerSurfaceModel's factual authority, Delivery Gate, Manifest,
PDF Boss rules, Screening, billing, credits, or remedies. The only new
publication constraint applies to jobs whose immutable job-start receipt
already establishes an external Premium V1 promise.

The remaining launch boundary is an explicit deployment configuration
decision under
[PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md](PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md).
That decision is not made by this repository closeout.

## 16. Definition of Done

Premium Acquisition Underwriting V1 is launch-ready only when:

- The characterization shield passes.
- Premium-disabled behavior is contract-equivalent to the protected base path.
- Every premium field has canonical lineage.
- Every premium calculation has a locked formula and eligibility contract.
- Every unsupported section collapses cleanly.
- Accepted evidence is used comprehensively without padding.
- The customer PDF is visually dense, readable, and correctly paginated.
- Premium completeness has passed observe-only and internal-required stages.
- The premium artifact is independently certified.
- Existing Source Truth, Delivery Gate, base-report publication, billing,
  credit, remedy, and Screening behavior remains unchanged; worker enforcement
  is added only for an immutable external Premium V1 promise.
- External premium jobs cannot silently fall back to the base report.
- Rollback has been proven.

The repository implementation satisfies these conditions through protected
automated proofs and reversible commits. `READY_NOT_ACTIVATED` does not mean a
live deployment, live feature activation, or live RETEST has occurred.

This doctrine may be changed only through an explicit doctrine amendment before corresponding implementation work begins.
