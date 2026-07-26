# Premium Underwriting Level-Up Summary

Status: Active summary
Updated: July 26, 2026

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

## Current Closeout

Premium Acquisition Underwriting V1 is repository-complete through the
external enforcement boundary:

- Canonical consume-only receipt mapping and deterministic analysis: complete.
- Independent premium model validation: complete.
- Guarded renderer insertion and flag-off equivalence: complete.
- Observe-only completeness: complete.
- Representative 16-page internal PDF composition under the unchanged PDF Boss: certified.
- Disconnected internal-test premium certification: complete.
- Internal-only job-surface authority and base/premium isolation proof: complete.
- Renovation-row field-level evidence provenance: preserved.
- Immutable production job-start surface assignment: complete.
- Worker consumption of the pinned surface receipt: complete.
- External premium generation from canonical receipts: complete.
- Strict external premium certification: complete.
- Worker-side no-silent-downgrade enforcement before publication: complete.

The feature remains inactive after a failed-closed RETEST 37 canary and safe
rollback. The repository configuration contract still defaults off. RETEST 37
did not publish, and its consumed credit was restored.

The protected base path remains unchanged. Premium enforcement applies only
when the immutable job-start receipt establishes an external Premium V1
promise. Delivery Gate, Manifest, PDF Boss rules, Source Truth, Screening,
billing, credits, and remedies were not modified.

Current state:

```text
repository_readiness: CANARY_REPAIR_DEPLOYED_CONFIGURATION_PREFLIGHT_PENDING
repository_capability_default: false
repository_activation_timestamp_default: unset
external_activation: explicit deployment decision required
```

Operational receipt, July 26, 2026:

```text
flag_off_release: deployed_and_healthy
controlled_activation_attempt: rolled_back_before_activation_boundary
retest_37: failed_closed_before_publication
retest_37_root_cause: canonical_claim_path_omitted_job_start_surface_receipt
retest_37_customer_credit: restored
claim_path_repair_commit: 50458b4
claim_path_repair_deployment: dpl_Bs72xBCAjkf9NTnibmEchea1sm8S
claim_path_repair_health: ready_200
post_failure_safe_deployment: dpl_2GihkWWCf6m3Bvxsq14ULcSpqNjC
premium_capability: exact_false_readback
premium_jobs_successfully_certified: none
next_step: verify_exact_production_pdf_configuration_then_stage_new_canary
```

RETEST 37 established a production orchestration defect, not a Source Truth,
calculation, renderer, PDF Boss, or customer-document defect. The scheduled
`claim_next_job` route transitioned the queued job to `extracting` without
persisting the immutable report-surface receipt. Downstream enforcement
therefore correctly failed closed with
`PREMIUM_JOB_START_SURFACE_RECEIPT_REQUIRED`. Commit `50458b4` persists the
receipt at that first canonical claim boundary and retains the existing
worker-side no-silent-downgrade enforcement.

Environment pull returned blanks for variables stored as Vercel `Sensitive`;
that behavior withholds values and was not proof that the runtime values were
empty. The non-secret Premium capability has now been recreated as a normal
production variable and read back as exact `false`. A new canary is prohibited
until the remaining Premium and production-PDF configuration values have been
set with byte-exact input and read back exactly.

Activation and rollback are governed by
[PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md](PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATION_RUNBOOK.md).

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

## Completed Sequence

1. Lock doctrine.
2. Add characterization shield.
3. Build disconnected premium model.
4. Repair supporting-source authority only where forensically proven and in isolated patches.
5. Implement locked deterministic formulas.
6. Validate lineage and eligibility.
7. Add one guarded renderer insertion.
8. Observe premium completeness.
9. Certify internal PDF composition.
10. Add immutable job-level surface-version authority.
11. Integrate worker consumption and premium generation.
12. Add strict external premium certification.
13. Enforce no silent downgrade before publication.

Live feature activation is not an implementation step and remains an explicit
deployment configuration decision.

## Launch Rule

Core delivery eligibility and premium certification are different.

Before external enforcement, premium QA begins as observation and may not weaken core publication.

After an order is externally promised Premium Acquisition Underwriting V1, failure of premium certification may not silently downgrade the customer to the thinner base artifact. It remains an internal report-generation or certification failure unless canonical core authority independently proves a valid customer-source failure.

## Deferred Scope

Refinance stress matrices, max proceeds, binding LTV-versus-DSCR analysis, refinance classifications, and return modeling remain deferred until their scenario and methodology authority is explicitly governed and versioned.
