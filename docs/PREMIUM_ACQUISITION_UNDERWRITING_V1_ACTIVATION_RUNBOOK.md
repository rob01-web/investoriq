# Premium Acquisition Underwriting V1 Activation Runbook

Status: CANARY_FAILED_ROLLED_BACK
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
repository_readiness: CANARY_REPAIR_VERIFIED_PENDING_DEPLOYMENT
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
premium_capability_enabled: false
feature_activated: false
live_retest_run: true
live_retest_status: RETEST_37_FAILED_CLOSED_REPAIR_PENDING_DEPLOYMENT
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

Post-failure environment inspection also proved that the attempted CLI
configuration writes had stored empty values. Empty Premium capability is
fail-off, so the RETEST 37 receipt omission affected the base surface path and
did not prove a successful Premium assignment. Before another canary, the
operator must set and then read back exact non-empty production values for:

```text
PREMIUM_ACQUISITION_UNDERWRITING_V1
PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT
ALLOW_PRODUCTION_PDF
DOCRAPTOR_MODE
REPORT_DOWNLOAD_ARTIFACT_MODE
```

No further canary may begin until the repaired claim path is deployed with
Premium assignment off, the deployment is healthy, and the exact production
configuration is independently read back.
