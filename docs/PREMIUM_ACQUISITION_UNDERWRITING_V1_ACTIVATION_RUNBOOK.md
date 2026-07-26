# Premium Acquisition Underwriting V1 Activation Runbook

Status: READY_NOT_ACTIVATED
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
```

The activation-readiness documentation commit follows these implementation
rollback points. Reverting code is not a substitute for correctly handling
already promised premium jobs.

## Current Receipt

```text
repository_implementation: complete
repository_readiness: READY_NOT_ACTIVATED
live_environment_inspected: false
live_environment_changed: false
deployment_performed: false
feature_activated: false
live_retest_run: false
```
