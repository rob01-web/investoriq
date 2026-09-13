# InvestorIQ Clean-Room Migration Authority

**Owner decision date:** 2026-09-13
**Status:** CURRENT GOVERNING MIGRATION AUTHORITY
**Legacy certification branch:** `launch-certification-20260913`
**Legacy repository:** `rob01-web/investoriq`
**Planned clean repository:** `rob01-web/investoriq-clean-v1`

## 1. Owner decision

InvestorIQ will move toward a clean-room runtime rebuild rather than continuing indefinite repair-on-repair work inside the accumulated legacy runtime.

This is not a blank-sheet rewrite of the product and it is not permission to discard evidence. The existing repository remains the preserved reference, evidence, history, production baseline, and source quarry. The clean repository is assembled only from deliberately approved code, tests, migrations, assets, and newly written replacements.

No production deployment or production mutation is authorized by this decision.

## 2. Non-destructive legacy freeze

Do not delete, empty, rename, or repurpose the existing `rob01-web/investoriq` repository.

The legacy repository remains intact so that Git history, production commits, migrations, fixtures, handoffs, tests, and prior implementation evidence remain recoverable.

The current repository audit continues on `launch-certification-20260913`. Its purpose changes from repairing every legacy pathway in place to determining what may safely cross into the clean system.

## 3. Clean-room border rule

Nothing enters the clean repository merely because the legacy application imports it.

Every production-relevant legacy file receives one clean-room disposition:

- `MIGRATE`: reviewed and acceptable for intentional transfer.
- `MIGRATE AFTER REPAIR`: architecture is worth preserving, but a bounded defect must be corrected before transfer.
- `REWRITE`: required responsibility remains, but the legacy implementation must not cross the border.
- `DO NOT MIGRATE`: obsolete, competing, historical, duplicate, unsafe, generated, or otherwise unnecessary in the clean runtime.

A file may not be marked `MIGRATE` until its entire relevant implementation has been reviewed, its responsibility is understood, competing authority has been checked, and the receiving clean architecture has an explicit need for it.

## 4. Clean architecture target

The target runtime is intentionally small and authority-driven:

```text
src/
  constitution/
  intake/
  parsing/
  source-truth/
  calculations/
  screening/
  underwriting/
  publication/
  quality/
  delivery/

worker/
  queue/
  lifecycle/
  recovery/

commerce/
  catalog/
  checkout/
  webhook/

tests/
```

This is an architectural target, not a requirement that legacy paths or filenames be preserved.

## 5. Canonical responsibility rule

One business fact has one canonical authority.

A clean renderer formats governed values. It does not independently calculate or adjudicate them.

A clean QA layer verifies canonical receipts and rendered output. It does not reconstruct competing financial truth.

A clean Quality Manifest reports canonical evidence and publication state. It does not create a second delivery decision.

The worker orchestrates durable state transitions. It does not own financial calculations.

## 6. Product constitution remains binding

The clean system must preserve the current product constitution, including:

- Screening admission requires usable T12 plus usable Rent Roll and admits no supporting documents.
- Underwriting admission requires usable T12 plus usable Rent Roll plus at least one additional readable supporting due-diligence document.
- downstream survivability modes do not weaken intake.
- content-driven pagination with no hard page caps.
- one business fact, one canonical authority.
- no invented source facts.
- no unsupported investment recommendations or forecasts.
- no property-specific production repairs.
- customer-facing copy contains no em dashes or en dashes.
- every published report preserves traceability and a Quality Manifest.
- a failed or uncertified publication artifact is not customer-deliverable merely because core financial truth is otherwise publishable.

Where an older handoff conflicts, `04_PRODUCT_CONSTITUTION.md` and this migration authority control.

## 7. Audit method from this point forward

The legacy census continues until every tracked file is accounted for, but review depth is risk-based:

1. production runtime: literal implementation review and consumer/dependency tracing;
2. build, test, migration, configuration, and workflow files: technical review;
3. current governing documentation: doctrine review;
4. fixtures, samples, and QA evidence: provenance and consumer review;
5. archived history: preserve and classify unless it can affect execution.

Every production-relevant file must receive both its legacy classification and its clean-room disposition.

## 8. Migration customs checkpoint

Before a legacy file or responsibility enters the clean repository, record:

- legacy path;
- clean destination or replacement responsibility;
- disposition;
- canonical responsibility;
- allowed calculations or decisions;
- forbidden responsibilities;
- upstream dependencies;
- downstream consumers;
- defects found;
- required tests;
- migration status;
- clean commit once migrated.

No bulk copy of `api/`, `src/`, `lib/`, tests, migrations, or configuration is allowed.

Dependencies are migrated deliberately, one reviewed responsibility at a time.

## 9. Repair policy

Do not spend launch effort making every obsolete legacy layer internally elegant.

Repair legacy code in place only when one of these is true:

- the currently deployed production system requires a safety-critical fix before clean cutover;
- the code is a strong migration candidate and the bounded repair is safer than a rewrite;
- the repair is necessary to produce or validate trustworthy migration evidence.

Otherwise, record the defect and either rewrite the responsibility cleanly or do not migrate it.

## 10. Verification policy

The clean system is not trusted because it is smaller or newer.

Each migrated responsibility must be protected by executable proof. Final clean-system certification must include at minimum:

- intake constitution tests;
- parser acceptance and role-identity tests;
- Source Truth conflict and lineage tests;
- financial formula tests with explicit units;
- Screening and Underwriting parity tests for shared facts;
- unauthorized scenario/scoring/forecast absence tests;
- PDF publication fail-closed tests;
- Quality Manifest lineage tests;
- worker state-machine and bounded-recovery tests;
- commerce entitlement tests;
- security and owner-fence tests;
- repository residual scans;
- canonical QA;
- production build;
- fresh synthetic/fixture report generation and factual plus visual inspection.

## 11. Cutover policy

The legacy production application remains production authority until the clean system independently certifies.

There is no partial silent cutover.

A clean-system deployment, database migration, scheduler activation, Stripe mutation, Supabase mutation, or production traffic switch requires a separate explicit owner decision after certification evidence exists.

## 12. Stopping rule

The project does not restart another 1,028-file audit after clean migration.

The current legacy audit identifies what crosses the border. The clean repo is certified from its own intentionally small inventory. After that, new defects are handled as normal bounded defects unless there is concrete evidence that a certified invariant or canonical authority model is fundamentally wrong.
