# Premium Acquisition Underwriting V1 Activation Runbook

Status: RETEST_38_FAILED_REPAIRS_DEPLOYED_FLAG_OFF
Effective: July 26, 2026
Controlling doctrine:
[PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md](PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md)

## Purpose

This runbook governs the explicit production configuration decision for
Premium Acquisition Underwriting V1. Repository completion does not activate
the feature.

No activation may change Source Truth, Delivery Gate, Manifest, PDF Boss
rules, Screening, billing, credits, remedies, or customer messaging.

## Safe Default

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=
```

With this configuration:

- New Underwriting jobs receive the base surface.
- Screening remains unchanged.
- Premium external certification is not required for base jobs.
- Existing immutable job-start receipts remain authoritative.

## Activation Contract

Activation requires both values in one governed deployment configuration
change:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=true
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT=<valid ISO-8601 UTC timestamp>
```

The activation timestamp is the eligibility boundary:

- Underwriting jobs created before it remain base.
- Underwriting jobs created at or after it may be pinned to Premium V1.
- Screening is never assigned Premium V1.
- Capability `true` without a valid timestamp fails closed.

Do not backdate the timestamp. Choose a timestamp at or after the intended
activation deployment.

## Required Preflight Receipt

Before any live activation decision, record:

- The exact deployed commit SHA.
- Passing Premium V1 QA.
- Passing worker publication contract smoke.
- Passing P0-C PDF Boss smoke.
- Passing P0-D RETEST 24 permanent replay.
- Passing Screening isolation smoke.
- Passing syntax, build, and diff integrity checks.
- Confirmation that live production PDF mode and external publication target
  are correctly configured under existing publication doctrine.
- Confirmation that the working tree is clean.

No live RETEST is part of repository implementation. A live validation run
requires separate operational authorization after deployment.

## Premium Publication Contract

For a job whose immutable receipt promises Premium V1:

1. The generator must build the validated canonical premium model.
2. The rendered customer HTML must pass the premium completeness observation.
3. The production PDF must receive strict, issue-free PDF Boss certification.
4. The matching external premium certificate must be persisted.
5. The worker must independently verify that certificate before publication
   record resolution.

Any missing, invalid, incomplete, or mismatched premium certificate blocks
publication as an internal system failure. It must not be converted into a
customer-document failure and must not silently deliver the base report.

## Rollback

To stop assigning Premium V1 to new jobs:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1=false
```

Rollback rules:

- Apply the configuration change through the normal governed deployment path.
- Do not delete or mutate existing job-start surface receipts.
- Do not downgrade a job already pinned to Premium V1.
- Allow existing promised premium jobs to complete only with valid premium
  certification.
- Do not change Delivery Gate, PDF Boss, billing, credits, remedies, or
  customer lifecycle as part of rollback.

## Repository Rollback Points

The external boundary is separated into reversible commits:

```text
0c8738b Persist immutable premium job-start surfaces
8b905ef Wire premium job surfaces into report generation
5c36751 Enforce external premium underwriting certification
50458b4 Persist premium surface receipt on canonical claim
```

The activation-readiness documentation commit follows these implementation
rollback points. Reverting code is not a substitute for correctly handling
already promised premium jobs.

## Current Receipt

```text
repository_implementation: complete
repository_readiness: REPAIRS_DEPLOYED_PREMIUM_REVALIDATION_PENDING
live_environment_inspected: true
live_environment_changed: true
flag_off_release_deployment: dpl_Hocip6Ut67oh7CV5SkiyitjGzkx7
activation_configuration_deployment: dpl_8eWdTPmJXGDKMXvcXc497ueEFbGx
activation_boundary: 2026-07-26T13:16:22.657Z
safe_rollback_deployment: dpl_FPgzKBWA94MbzMEkQ1dP59C2cbGJ
rollback_ready_at: 2026-07-26T13:10:50.810Z
retest_37_activation_deployment: dpl_5ZbgspsPHsaiNBsrWpE2KerdW4aZ
retest_37_intended_boundary: 2026-07-26T13:52:54.945Z
retest_37_job_id: c8b23b8d-de84-4d82-a31f-8bd7710c45a4
retest_37_result: failed_closed
retest_37_error: PREMIUM_JOB_START_SURFACE_RECEIPT_REQUIRED
retest_37_credit_restored: true
post_failure_safe_deployment: dpl_2GihkWWCf6m3Bvxsq14ULcSpqNjC
claim_path_repair_commit: 50458b4
claim_path_repair_deployment: dpl_Bs72xBCAjkf9NTnibmEchea1sm8S
claim_path_repair_deployment_health: ready_200
retest_38_staged_capability_enabled: true
retest_38_staged_capability_readback: exact_true
retest_38_feature_state_at_stage: pending_future_boundary
live_retest_run: true
live_retest_status: RETEST_37_FAILED_CLOSED_REPAIR_DEPLOYED
retest_38_activation_deployment: dpl_jTNMkPQxSpzw8rzJdc8U1vmu9YGd
retest_38_activation_deployment_health: ready_200
retest_38_activation_boundary: 2026-07-26T14:35:00.652Z
retest_38_premium_capability_readback: exact_true
retest_38_allow_production_pdf_readback: exact_true
retest_38_docraptor_mode_readback: exact_production
retest_38_download_artifact_mode_readback: exact_production_pdf
retest_38_job_id: 18b949ca-5d1d-4fe4-b028-f846fcad9fc1
retest_38_status: failed_closed_before_publication
retest_38_error: PDF_ARTIFACT_FAILED
retest_38_credit_restored: true
retest_38_pdf_page_count: 19
retest_38_pdf_artifact_mode: production_pdf
retest_38_pdf_publication_target: external_customer
retest_38_delivery_gate: deliverable
retest_38_root_cause: recovery_eligibility_code_set_omitted_table_continuation_incident
retest_38_pdf_recovery_commit: 8545d69
retest_38_dashboard_history_commit: 2544969
retest_38_repair_deployment: dpl_A7DCmhqyNVu8VJmUG6uxhcDdbPt1
retest_38_repair_deployment_health: ready_200
premium_capability_after_retest_38: exact_false
```

The first activation configuration was superseded by the safe rollback
deployment before its future activation boundary. RETEST 37 was then submitted
after a second intended boundary. It failed closed before publication because
the production scheduler's canonical `claim_next_job` path moved the job to
`extracting` without first persisting the immutable job-start surface receipt.
The worker correctly rejected the missing receipt and restored the consumed
credit. Commit `50458b4` now establishes that receipt immediately after the
canonical claim and before the claimed job is exposed to downstream worker
processing.

Post-failure environment inspection returned blank values for variables
previously stored as Vercel `Sensitive`. Vercel intentionally withholds
sensitive values from environment pull output, so that blank readback was
inconclusive and must not be treated as proof of an empty runtime value.
The non-secret Premium capability was recreated as a normal production
variable and independently read back as exact `false`. The RETEST 37 artifact
inventory contained no job-start surface receipt, so RETEST 37 still did not
prove a successful Premium assignment.

Before another canary, the operator must recreate non-secret configuration as
readable production variables, set them with byte-exact standard input, and
read back exact values for:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT
ALLOW_PRODUCTION_PDF
DOCRAPTOR_MODE
REPORT_DOWNLOAD_ARTIFACT_MODE
```

RETEST 38 received the correct immutable Premium surface receipt. Source Truth,
deterministic analysis, and Delivery Gate were valid, and the Delivery Gate was
deliverable. The 19-page production PDF then failed strict certification with
one blocking approved-surface parity incident plus nonblocking composition
incidents. The complete incident set was presentation-recoverable, but
`PDF_TABLE_CONTINUATION_HEADER_MISSING` was absent from the institutional PDF
recovery eligibility set. Because eligibility requires every incident code to
be recoverable, the omission skipped the single bounded recomposition attempt
and terminated publication.

Commit `8545d69` adds only that composition incident to the existing recovery
set and locks RETEST 38's complete incident combination as recoverable. It does
not weaken PDF Boss, change the original approved surface, or permit a failed
recomposition to publish. Commit `2544969` removes the customer dashboard's
full-page Reload control, makes Report History Refresh update completed,
active, failed, entitlement, and remedy state in one bounded snapshot, and
shows failed jobs with credit-restoration messaging inside Report History. It
adds no timer, subscription, or polling loop.

Deployment `dpl_A7DCmhqyNVu8VJmUG6uxhcDdbPt1` is Ready, production-aliased,
and returns HTTP 200 with Premium assignment independently read back as exact
`false`. RETEST 38's credit was restored. No further live canary is authorized
until a separate revalidation boundary is approved.
