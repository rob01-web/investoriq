# July 15, 2026 Night Close-Out - Semantic Authority Protected / Gates 1 and 2 PASS / Gate 3 PASS Locally

### The July 15 Gate 3 Semantic Receipt Addendum at the end of this ledger is the controlling continuation point. Earlier evidence remains historical evidence only.

## Current exact state

```text
CURRENT COMMITTED BASELINE:
cde0b05
updates

CURRENT WORKING TREE:
DIRTY / UNCOMMITTED.
Contains the locally accepted Gate 3 receipt projection, API, dashboard, and terminal Manifest completion.

DEPLOYMENT:
Gate 2 and earlier work deployed.
Gate 3 not committed or deployed.

LIVE RETEST:
RETEST 27 PASS in DocRaptor test mode.
Published report and canonical customer READY state agreed.

PRODUCTION CERTIFICATION:
HOLD while DocRaptor remains intentionally in test mode and Gate 3 awaits deployment verification.

NEXT ACTIVE BOUNDARY:
Rest, then review/commit/deploy Gate 3 and verify canonical production reads.
Gate 4 Institutional Financial Intelligence follows.

ADMIN QUALITY INCIDENT DASHBOARD:
PASS locally / receipt-only / uncommitted / not deployed.
```

## Historical July 13 checkpoint evidence begins below

## Why the architecture was reopened after `6c15de1`

The controlled live Acquisition Memo run after `6c15de1` exposed a support-document authority failure.

Observed failure family:

```text
Stonebridge_Assumptions.pdf contained a complete proposed acquisition financing bundle,
but entered through the mortgage parser route.

Appraisal and current-debt artifacts could cross-promote into purchase assumptions.

Parser route, artifact type, taxonomy, filename, reconciliation, and downstream selection
still retained competing fragments of support-document authority.

The Boss correctly blocked unsafe publication after the upstream authority chain produced
an incomplete or contradictory financing state.

The final report did not publish.
Credit was restored.
```

Critical distinction:

```text
Accepted-truth preservation had been strengthened.

Accepted-truth creation had not yet been fully centralized.
```

## Accepted six-patch Support Document Authority plan

Sol organized the repair into six sequential production patches.

### Patch 1 — Canonical Adjudicator Contract

Purpose:

```text
Create one canonical Support Document Authority contract.
Define sourcePresent, roleAccepted, factAccepted, sourceBacked, and sectionDisplayReady.
Add deterministic semantic evidence, negation, disclaimer, temporality, mixed-document,
duplicate, and conflict states.
Run in shadow mode first.
```

### Patch 2 — Evidence-Bound Parser and AI Candidates

Purpose:

```text
Parser routes become extractor-routing only.
Parser and AI outputs become non-sovereign candidate evidence.
AI claims must bind exact value, source value, unit, page, excerpt, and coordinates when available.
AI confidence remains diagnostic only.
```

### Patch 3 — Source Truth Sovereignty Cutover

Purpose:

```text
Source Truth calls the Support Document Authority Adjudicator.
Artifact type, filename, first-seen order, parser role, and legacy reconciliation
cannot create accepted authority.
All artifacts for one physical source are adjudicated together.
Canonical package becomes a compatibility adapter only.
```

### Patch 4 — Downstream Consume-Only State

Purpose:

```text
Projection, Boss, CustomerSurfaceModel, and repair consume canonical authority only.
They must share exact meanings for:
sourcePresent
roleAccepted
factAccepted
sourceBacked
sectionDisplayReady

No downstream component may independently reclassify support documents
or recalculate completeness.
```

### Patch 5 — Renderer and Publish-or-Collapse Safety

Purpose:

```text
Renderer consumes CustomerSurfaceModel only.
No parser, filename, raw text, mortgage, or loan-term fallback may recreate truth.
No Number(null) -> 0 support path.
Incomplete optional support collapses without blocking valid core.
```

### Patch 6 — Screening Isolation

Purpose:

```text
Keep Acquisition support-document authority out of Screening.
Preserve only the legitimate null-safe per-unit correction.
Missing units omit per-unit rows and never substitute one unit.
```

## Sol's local implementation receipt

Sol reported all six production patches completed locally.

Claimed architecture:

```text
raw extracted source
-> deterministic evidence
-> evidence-bound AI candidates
-> Support Document Authority Adjudicator
-> immutable Source Truth
-> consume-only downstream pipeline
```

Claimed Stonebridge replay:

```text
Stonebridge_Assumptions.pdf:
purchase_assumptions
purchase price: $13,500,000
proposed loan: $9,450,000
LTV: 70%
rate: 5.95%
amortization: 30 years
lender fee: 0.85%
going-in cap: 7%
NOI basis: $945,000
proposed financing display-ready: yes

Stonebridge_Appraisal_Summary.pdf:
appraisal_context
no purchase-assumptions promotion

Current_Debt_Stonebridge.pdf:
current_debt_context
no purchase-assumptions promotion

core publishable: yes
true blockers: none
false Purchase Price $0 row: no
```

Important limits:

```text
Sol's receipt is not final proof.
The working tree remains uncommitted.
No deployment occurred.
No live retest occurred.
One local handler smoke unexpectedly reached DocRaptor and received 401.
No PDF was created or published.
```

## Independent stale-test investigation

Claude independently reran broader tests and initially found five failures.

Later results showed genuine progress:

```text
screening-report-smoke.js:
PASS

acquisition-memo-v2-document-smoke.js:
PASS

stonebridge-retest21-source-authority-smoke.js:
PASS

report-type-normalization-smoke.js:
PASS
```

Two remaining failures were investigated.

### Legacy mortgage fallback assertion

The old smoke expected two references to:

```text
resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(...)
```

Current production file contains only the compatibility function definition and zero live call sites.

Disposition:

```text
STALE TEST ASSERTION.
Production legacy fallback call sites: zero.
```

### Legacy fixture canonical package

`buildCanonicalSourcePackage(...)` remains defined in:

```text
api/_lib/canonical-source-package.js
```

Repository search found no production API/lib/parser call site.

Its call sites are QA fixtures only.

The direct legacy fixture adapter now returns:

```text
authorityVersion = "legacy_fixture_v2"
```

Disposition:

```text
TEST-ONLY LEGACY FIXTURE ADAPTER.
NO EVIDENCE OF A SECOND LIVE PRODUCTION BOSSMAN.
```

The test was updated to assert the adapter is not imported or called by production code.

## Current targeted smoke result

Sol corrected the stale fixture so canonical Source Truth receives validated:

```text
t12_parsed
rent_roll_parsed
```

artifacts.

This cleared:

```text
CORE_T12_NOT_VALIDATED
CORE_RENT_ROLL_NOT_VALIDATED
ACQUISITION_MEMO_SOURCE_TRUTH_NOT_PUBLISHABLE
```

The same smoke then reached a later, separate invariant failure:

```text
REPAIR_PROVENANCE_REGRESSION

customerSurfaceModel.unitMix lost sourceBacked
bossContract.unitMix lost sourceBacked

HTTP 500
expected 200
```

## Active classification

```text
CORE FIXTURE:
STALE_FIXTURE / corrected.

LEGACY FIXTURE ADAPTER:
TEST-ONLY / isolated.

LEGACY MORTGAGE FALLBACK:
ZERO PRODUCTION CALL SITES.

STONEBRIDGE SOURCE-AUTHORITY REPLAY:
PASS locally.

FINAL ACTIVE BLOCKER:
unitMix sourceBacked truth loss across the repair/provenance path.

CLASSIFICATION OF UNITMIX FAILURE:
NOT YET PROVEN.
Must determine STALE_FIXTURE vs PRODUCTION_REGRESSION.

COMMIT:
HOLD.

DEPLOY:
HOLD.

LIVE RETEST:
HOLD.
```

## Exact next bounded task

Trace the first state transition where unitMix authority changes from accepted/source-backed to not source-backed.

Required path:

```text
validated Rent Roll artifact
-> Source Truth
-> Projection
-> Boss Contract
-> CustomerSurfaceModel
-> repair
-> final provenance regression check
```

For each stage inspect:

```text
sourcePresent
roleAccepted
factAccepted
sourceBacked
sectionDisplayReady
accepted provenance fields
source identity key
```

Rules:

```text
Do not weaken REPAIR_PROVENANCE_REGRESSION.
Do not bypass Boss or CustomerSurfaceModel checks.
Do not patch production before the first exact truth-loss transition is proven.
If stale fixture, update only the fixture.
If production regression, identify the smallest production owner and patch boundary first.
```

## Mandatory Admin Quality Incident and Customer Remedy doctrine

A successful publication must never hide non-catastrophic quality failures.

Every report, including published reports, must persist a canonical internal:

```text
Report Quality Manifest
```

The manifest must record report-level, document-level, and section-level quality state.

Mandatory report queues:

```text
BLOCKED
PUBLISHED WITH LIMITATIONS
PUBLISHED CLEAN
```

Mandatory distinction:

```text
collapse_expected
collapse_unexpected
collapse_requires_review
```

Mandatory Customer Attention Risk:

```text
HIGH
MEDIUM
LOW
```

InvestorIQ owns the failure when readable, clear evidence is:

```text
misclassified
dropped
contradicted
rendered incorrectly
converted into false zero
or lost through an internal pipeline failure
```

Customer remedy ladder:

```text
Level 1:
minor disclosed limitation

Level 2:
free corrected rerun for clear InvestorIQ omission/misclassification

Level 3:
credit restoration plus priority corrected report for material InvestorIQ defect

Level 4:
refund or customer-selected account credit when InvestorIQ cannot provide
a materially correct report
```

The dashboard must support:

```text
mark for review
mark customer contacted
request free corrected rerun
request or verify credit restoration through the protected workflow
record replacement source required and customer-contact routing
attach corrected report
issue account credit
record refund
close incident
link incident to permanent regression case
```

Permanent doctrine:

```text
A failure happens once.
It must never happen the same way twice.
```

## Sol usage budget and next project order

Rob is down to approximately 45% Sol usage until July 19.

Use Sol only where deep repository reasoning is most valuable.

Required order:

```text
1. Finish and classify the unitMix provenance HOLD.
2. Apply the smallest accepted correction.
3. Run the bounded final acceptance suite.
4. Freeze and commit the six-patch Support Document Authority repair.
5. Then use Sol for the Admin Quality Incident Dashboard audit and canonical contract.
```

Sol should handle:

```text
final provenance trace
existing admin architecture audit
Report Quality Manifest contract
quality-event persistence design
canonical admin incident workflow
final architecture review
```

Terra/Luna/Codex may handle later bounded UI, copy, CSS, migrations, and tiny implementation tasks after Sol defines the architecture.

## Protected doctrine that remains outside the repair

Do not weaken or reopen without current contrary evidence:

```text
Core-Gated Publish-or-Collapse
core T12 and Rent Roll authority
Delivery Seal
Final Decision
terminal failure taxonomy
worker publication lock
automatic credit restoration
shared final delivery authority
dashboard canonical-only customer messaging
```

## Fresh-chat continuation point

Start the next chat from this exact state:

```text
InvestorIQ is in an uncommitted six-patch Support Document Authority repair.

The stale core fixture is corrected.

The legacy fixture builder is test-only and has no production call sites.

The legacy mortgage fallback has zero production call sites.

Stonebridge source-authority replay passes locally.

The only active blocker is:
REPAIR_PROVENANCE_REGRESSION
customerSurfaceModel.unitMix lost sourceBacked
bossContract.unitMix lost sourceBacked

Do not commit.
Do not deploy.
Do not run live RETEST.
Do not start the admin dashboard yet.

Next task:
trace the first exact unitMix truth-loss transition and classify it as
STALE_FIXTURE or PRODUCTION_REGRESSION.
```

---

# July 12, 2026 Final Acceptance + Commit Checkpoint - Source Truth Delivery Authority PASS / Commit 6c15de1 / One Controlled Live Acquisition Memo RETEST Cleared After Deploy

### This addendum supersedes the July 11 Protected Final BOSSMAN Authority Lock checkpoint as the active continuation point.

## Current verified state

```text
STEPS 1-6:
PASS / protect.

HANDOFFS 1-8:
PASS / protect.

SOURCE TRUTH PACKAGE SPINE:
PASS / protect.

PHASES 5/6 SOURCE TRUTH AUTHORITY:
PASS / protect.

PHASE 6C SELF-HEAL PROOF GATE:
PASS / protect.

PHASES 7/8 DELIVERY SEAL + TERMINAL FAILURE TAXONOMY:
PASS / protect.

STAGES 9/10 CONSTITUTIONAL MATRIX:
PASS / protect.

WORKER HELD-OUTPUT TAXONOMY:
PASS / protect.

DASHBOARD CANONICAL-ONLY CUSTOMER MESSAGING:
PASS / protect.

FINAL ACCEPTANCE GATE:
PASS.

LOCAL FINAL QA GATES:
PASS.

COMMIT:
6c15de1
Lock Source Truth delivery authority and terminal failure gates.

PUSH:
PASS / main -> origin/main.

WORKING TREE:
clean after push.

LIVE ACQUISITION MEMO RETEST:
CLEARED ONLY AFTER VERCEL DEPLOYMENT OF COMMIT 6c15de1.
DO NOT RUN ANY OTHER LIVE TEST.
```

## Final acceptance gate result

Sol final acceptance gate returned:

```text
PASS.
Files changed: none.
HOLD items: none.
Controlled live Acquisition Memo retest: cleared.
```

Final-gate category verdicts:

```text
Source Truth authority: PASS.
Delivery Seal: PASS.
Worker publication authority: PASS.
Terminal failure taxonomy: PASS.
Dashboard customer messaging: PASS.
Public/customer language hygiene: PASS.
Stonebridge replay, both lanes: PASS.
Constitutional matrix: PASS.
Production build: PASS.
```

## Local final gate rerun before commit

Rob reran the final gate locally on the exact dirty working tree before committing.

Passed commands:

```text
node tests/qa/admin-run-worker-gate-smoke.js
node tests/qa/source-truth-phase7-8-smoke.js
node tests/qa/qa-action-plan-smoke.js
npm.cmd run qa:stonebridge-source-authority
npm.cmd run qa:source-truth-pipelines
node tests/qa/source-report-coverage-qa-smoke.js
node tests/qa/job-failure-messaging-smoke.js
node tests/qa/qa-manager-review-smoke.js
node tests/qa/dashboard-customer-copy-smoke.js
node tests/qa/source-truth-constitutional-matrix-smoke.js
npm.cmd run build
git diff --check
```

Observed Stonebridge replay result:

```text
Screening:
T12 validated.
Rent Roll validated.
core_publishability_bucket = disclose_only_publishable.
delivery_gate_status = deliverable.
customer_delivery_allowed = true.
hold_delivery = false.
customer_blockers = [].

Acquisition Memo:
T12 validated.
Rent Roll validated.
core_publishability_bucket = disclose_only_publishable.
delivery_gate_status = deliverable.
customer_delivery_allowed = true.
hold_delivery = false.
customer_blockers = [].
```

Build result:

```text
npm.cmd run build: PASS.
```

Diff check result:

```text
git diff --check: PASS.
Windows LF/CRLF warnings only; no whitespace errors.
```

## Commit checkpoint

Rob committed and pushed the final checkpoint:

```text
commit: 6c15de1
message: Lock Source Truth delivery authority and terminal failure gates
branch: main
push: PASS
working tree after push: clean
```

Commit summary:

```text
26 files changed.
2266 insertions.
802 deletions.
```

New protected files created in this checkpoint:

```text
api/_lib/delivery-gate-constitution.js
api/_lib/source-truth-package.js
lib/terminal-failure-taxonomy.js
tests/qa/fixtures/stonebridge-retest21-source-authority.json
tests/qa/source-truth-constitutional-matrix-smoke.js
tests/qa/source-truth-phase7-8-smoke.js
tests/qa/source-truth-pipeline-authority-smoke.js
tests/qa/stonebridge-retest21-source-authority-smoke.js
```

Changed protected production / customer-surface files included:

```text
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-pipeline.js
api/_lib/acquisition-memo-v2-role-reconciler.js
api/_lib/generate-client-report-impl.js
api/_lib/qa-action-plan.js
api/_lib/screening-report-pipeline.js
api/_lib/source-report-coverage-qa.js
api/admin-run-worker.js
api/parse/parse-doc.js
docs/INVESTORIQ_PRODUCT_DOCTRINE.md
src/lib/dashboardCustomerCopy.js
src/lib/jobFailureMessaging.js
src/pages/Dashboard.jsx
```

## Active doctrine after commit 6c15de1

```text
Source Truth decides core T12 / Rent Roll authority first.

Both Screening and Acquisition Memo consume Source Truth.

Optional/support limitations remain non-blocking when core is valid.

Non-negotiable public/customer-surface defects block even when core is valid.

Deterministic self-heal rendered defects block unless explicit clean-output proof exists.

Delivery Seal blocks unless Source Truth is valid, core is publishable, pipeline compliance passes, HTML safety passes, renderer completes, and no customer blockers exist.

Worker cannot publish from aliases, top-level compatibility fields, missing canonical state, partial canonical state, or stale delivery flags.

Dashboard cannot reconstruct customer truth from file rows, doc_type, parse_status, parse_error, or failed candidate/support rows.

Only catastrophic core terminal codes may state that replacement source evidence is required and direct the customer to InvestorIQ support.

Internal Source Truth/render/PDF/storage/publication failures use neutral customer messaging and preserve exact reference code.
```

## Terminal failure taxonomy lock

Only these terminal codes may classify replacement source evidence as required:

```text
CORE_T12_CATASTROPHICALLY_UNUSABLE
CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE
CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY
```

Core-valid held output must not be mislabeled as missing user documents. Core-valid held output classifies as:

```text
REPORT_CONTRACT_FAILED
```

Internal/system failure family stays neutral, including:

```text
SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED
REPORT_RENDER_FAILED
REPORT_CONTRACT_FAILED
PDF_ARTIFACT_FAILED
STORAGE_PUBLICATION_FAILED
```

## Phase 6C self-heal proof lock

Self-heal render classifications are not allowed to ship merely because they are self-healable.

Rule:

```text
pre-heal defect detected
-> deterministic self-heal may run
-> final customer output must be revalidated clean
-> if clean proof exists, delivery may proceed
-> if proof missing/stale/not tied to final output, block
```

Accepted proof fields:

```text
post_self_heal_validation_passed === true
final_render_validation_clean === true
resolved_by_self_heal === true together with verified_final_output_clean === true
```

Fields may be direct or under evidence.

## Controlled live retest constraints

One live retest is now cleared only after Vercel confirms deployment of commit 6c15de1.

Retest constraints:

```text
Run one Acquisition Memo only.
Use the unchanged Stonebridge RETEST 21 document set.
Do not modify parsing, Source Truth, calculations, renderers, gates, fixtures, or customer messaging during the run.
Require a canonical Source Truth Package with publishable T12 and Rent Roll coverage.
Require canonical deliveryDecisionState.source === "canonical_delivery_decision".
Require customer_delivery_allowed === true.
Require hold_delivery !== true.
Require customer_blockers length === 0.
Require Delivery Seal success after final rendered-output validation.
Require explicit post-heal clean-output proof if any self-heal defect is encountered.
Verify final HTML and PDF contain no placeholders, template tokens, debug details, implementation terminology, vendor/model terminology, prompt language, internal authority wording, or prohibited em dashes.
If any gate fails, stop and classify the exact terminal code.
Do not force publication.
Do not substitute compatibility aliases.
Do not run RETEST 22.
```

Live retest evidence to collect:

```text
1. Job ID.
2. Final job status.
3. Deployment / commit SHA shown.
4. Source Truth Package summary.
5. Delivery Seal result.
6. deliveryDecisionState.
7. customer_delivery_allowed.
8. hold_delivery.
9. customer_blockers.
10. PDF/report created or not.
11. Dashboard customer message.
12. Terminal code if failed.
```

## Current launch posture

```text
Offline architecture:
CLEARED.

Commit/deploy checkpoint:
COMMITTED AND PUSHED AS 6c15de1.

Controlled live Acquisition Memo retest:
CLEARED AFTER VERCEL DEPLOYMENT OF 6c15de1.

Launch:
NOT CLEARED UNTIL LIVE PROOF PASSES AND OUTPUT ARTIFACTS / DASHBOARD BEHAVIOR ARE INSPECTED.
```

## Fresh-chat continuation point

Rob will start a fresh chat after uploading these updated ledgers.

First task in fresh chat:

```text
Continue InvestorIQ from commit 6c15de1 final acceptance checkpoint.
Treat the uploaded MASTER, CVF, and Semantic Authority ledgers as current source of truth.
Do not reopen Handoffs 1-8.
Do not rediscover protected authority families.
Do not run broad audits.
Do not patch anything before the live proof run.

Next action:
1. Confirm Vercel deployed commit 6c15de1.
2. Run exactly one controlled live Acquisition Memo retest with unchanged Stonebridge RETEST 21 documents.
3. Collect the live retest evidence list.
4. Stop and report PASS / HOLD with exact terminal code if any gate fails.
```

---

# Archived prior checkpoint content below


## Semantic authority update after commit 6c15de1

```text
The semantic authority hierarchy is now:

1. Source Truth Package for core T12 / Rent Roll source authority.
2. Pipeline-specific compliance for Screening and Acquisition Memo internal checks.
3. Delivery Seal / canonical deliveryDecisionState for final customer delivery authority.
4. Worker publication lock for downstream enforcement.
5. Dashboard canonical-only messaging for customer-facing status.
```

Forbidden semantic authority sources:

```text
candidate parser role labels
failed support file rows
raw analysis_job_files.doc_type
raw parse_status / parse_error
legacy aliases
top-level delivery flags
compatibility aliases without canonical state
non-canonical customer_delivery_allowed
self-heal code without final clean-output proof
optional/support limitation as fatal core blocker when T12/Rent Roll are valid
```

Accepted final BOSSMAN interpretation:

```text
The product does not require one monolithic internal Boss object.
The product now has one protected upstream-to-downstream authority spine:
Source Truth -> pipeline compliance -> Delivery Seal -> canonical deliveryDecisionState -> worker/publication lock -> dashboard canonical-only customer messaging.
```

# July 11, 2026 Protected Checkpoint - Final BOSSMAN Authority Lock PASS / Both Pipelines Share One Protected Final Delivery Boss / Live RETEST Still Locked

### This addendum supersedes the prior July 11 Screening Delivery Gate / Publish Constitution checkpoint as the active continuation point.

## Current verified state

```text
STEPS 1-6:
PASS / protect.

HANDOFFS 1-8:
PASS / protect.

HANDOFF 8 - DELIVERY GATE:
PASS / protect.

SCREENING DELIVERY-GATE EXECUTION-ORDER FIX:
PASS / protect.

ACQUISITION MEMO V2 DELIVERY-GATE EXECUTION-ORDER FIX:
PASS / protect.

LEGACY LIVE-EFFECT CONTAINMENT:
PASS / protect.

DOWNSTREAM EXPLICIT-AUTHORITY LOCK:
PASS / protect.

FINAL NO-EDIT AUTHORITY AUDIT:
PASS.

FINAL VERIFIED ARCHITECTURE VERDICT:
PASS: BOTH PIPELINES SHARE ONE PROTECTED FINAL BOSSMAN.

LIVE ACQUISITION MEMO RETEST:
STILL LOCKED.
DO NOT RUN UNTIL EXPLICITLY CLEARED.
```

## Final BOSSMAN clarification

The long-running BOSSMAN question is now resolved precisely.

```text
InvestorIQ does not require one identical internal Boss object for every pipeline.

Screening has its own Screening lane.

Acquisition Memo V2 has its Boss Contract, CustomerSurfaceModel, HTML validation, repair, and Final Decision lane.

But both pipelines now terminate through the same protected final delivery boss:

shared Delivery Gate
-> canonical deliveryDecisionState
-> downstream worker / publication / artifact lock.
```

Protected short form:

```text
No canonical deliveryDecisionState
-> no publish.

No validated core coverage
-> no publish.

No explicit customer_delivery_allowed === true
-> no publish.

No shared Delivery Gate authority
-> no publish.

No downstream resurrection.
```

Therefore:

```text
ONE REQUIRED MONOLITHIC PIPELINE BOSS OBJECT:
NO.

ONE PRODUCT-WIDE FINAL DELIVERY BOSSMAN AUTHORITY:
YES / PASS / PROTECT.
```

## Final protected architecture

```text
SCREENING:
usable T12 + usable Rent Roll
-> Screening lane
-> shared QA / Delivery Gate
-> canonical deliveryDecisionState
-> worker / publication / artifact lock

ACQUISITION MEMO V2:
Boss Contract
-> CustomerSurfaceModel
-> HTML validation / repair / Final Decision
-> shared QA / Delivery Gate
-> canonical deliveryDecisionState
-> worker / publication / artifact lock
```

Acquisition Memo V2 remains stricter internally because it has extra Boss / Model / Final Decision protection. That is acceptable and intended. What matters is that neither pipeline can publish outside the final canonical delivery authority.

## Acquisition Memo V2 delivery-gate execution-order fix

Earlier bounded audit found Acquisition Memo V2 reached Boss Contract, CustomerSurfaceModel, validation, and Final Decision, but the successful V2 path returned before the shared Delivery Gate and before canonical worker-consumed fields were constructed.

Accepted fix:

```text
File changed:
api/_lib/generate-client-report-impl.js

The successful Acquisition Memo V2 early return was removed.

After Boss / CustomerSurfaceModel / Final Decision success, execution now continues through the shared QA chain and buildDeliveryGateDecision(...).

Boss-blocked V2 still throws REPORT_GENERATION_FAILED before Delivery Gate and cannot be resurrected.

Final response exposes canonical worker-consumed delivery fields.
```

Protected commit recorded in chat:

```text
9ce5aaf
Acquisition Memo V2 shared Delivery Gate execution-order fix.
```

## Legacy live-effect containment closeout

A later old-code audit found legacy or stale mechanisms that were still live-affecting. These are now closed or contained.

### Patch family 1 - legacy DSCR fallback contained

```text
File changed:
api/_lib/generate-client-report-impl.js

resolveCanonicalCurrentDebtScoreInputs(...) no longer calls resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(...).

When canonical current-debt state is absent, currentDebtCoverage returns null and usedCanonicalState returns false.

Legacy mortgage DSCR helper may remain in file, but has no production caller.
```

Disposition:

```text
PASS / protect.
```

### Patch family 2 - legacy customer-blocker fallback deleted

```text
File changed:
api/_lib/qa-action-plan.js

legacyCustomerBlockerFallbackCodes was removed from production blocking authority.

Delivery Gate blocking now depends on explicit current canonical delivery-impact fields, explicit blocks_customer_delivery, current non-negotiable hard-defect classification, true core-fatal state, source-status failure, and required-core failure.
```

Disposition:

```text
PASS / protect.
```

### Patch family 3 - legacy readiness fail-open paths closed

```text
File changed:
api/_lib/qa-action-plan.js

legacy_action_plan_fallback removed from production selection.
legacy_publish_eligibility_fallback removed from production selection.
readiness_fallback_used remains false.
Missing gate status normalizes to blocked.
Missing or failed source coverage returns user_needs_documents / blocked.
Default deliverable branch is reachable only after canonical required core coverage is validated.
buildCanonicalDeliveryDecisionState(...) cannot manufacture customer delivery from missing, partial, or legacy state.
```

Disposition:

```text
PASS / protect.
```

## Downstream explicit-authority lock

Final downstream HOLDs were traced to worker and compatibility alias permissiveness. These are now closed.

Changed files:

```text
api/admin-run-worker.js
api/_lib/report-delivery-output.js
```

Worker authority now requires all of:

```text
deliveryDecisionState.source === "canonical_delivery_decision"
core_valid_required_coverage === true
delivery_gate_status === "deliverable"
customer_delivery_allowed === true
hold_delivery !== true
zero customer blockers
```

Compatibility aliases now require the same canonical marker, validated core coverage, explicit customer permission, deliverable status, no hold, and no blockers before returning any publishable / customer-eligible true value.

Top-level delivery aliases are now diagnostics only and cannot authorize publication or artifact work.

Missing, partial, non-canonical, top-level-only, or compatibility-only delivery states fail closed.

Disposition:

```text
PASS / protect.
```

## Final no-edit authority audit result

Final bounded audit returned:

```text
PASS: BOTH PIPELINES SHARE ONE PROTECTED BOSSMAN.
```

Accepted final audit findings:

```text
Screening:
PASS.
Validated usable T12 and Rent Roll reach the shared deliverable gate.
Missing, failed, or unusable core returns user_needs_documents / blocked.
Optional/support/advisory gaps remain collapsible or disclosable.

Acquisition Memo V2:
PASS.
Boss Contract, CustomerSurfaceModel, HTML validation, repair, and Final Decision execute before shared Delivery Gate.
Boss-blocked result throws before Delivery Gate and cannot be resurrected downstream.

Worker / publication / storage:
PASS.
Delivery requires canonical marker, validated core coverage, explicit deliverable status, explicit customer permission, no hold, and no blockers.
Missing, partial, non-canonical, top-level, and compatibility-only states fail closed.
```

Remaining old mechanisms classification:

```text
Legacy mortgage DSCR helper:
CONTAINED / no production caller.

Legacy blocker-code fallback:
DELETED.

Legacy readiness authority fallbacks:
DELETED from production selection.

Historical readiness calculations:
CONTAINED as metadata only.

Deprecated admin-review handling:
CONTAINED / cannot authorize canonical delivery.

Top-level delivery aliases:
CONTAINED as diagnostics only.

Compatibility aliases:
CONTAINED / mirror only complete canonical authority.

Legacy render guards:
CONTAINED outside sealed Screening and V2 lanes.

Acquisition Boss repair fallback:
CONTAINED within current Boss validation and Final Decision authority; cannot independently authorize publication.
```

## Protected A-D doctrine after final BOSSMAN lock

```text
CASE A:
Usable core with some missing section facts
-> publish with collapse / omission / qualification / disclosure.

CASE B:
Complete usable T12 + Rent Roll
-> publish.

CASE C:
Usable core with optional/support/downstream issues
-> publish with collapse / omission / qualification / disclosure.

CASE D:
Catastrophically unusable core T12 or Rent Roll
-> fail closed / block.
```

No report may publish solely because a legacy alias, stale fallback, compatibility field, top-level response field, or customer flag says it can.

## Current launch-readiness posture

```text
Architecture reconstruction:
SUBSTANTIALLY COMPLETE.

Final BOSSMAN authority:
PASS / protect.

Both production report pipelines:
share one final delivery authority.

Live Acquisition Memo RETEST:
still locked pending deliberate controlled RETEST decision.
```

Do not restart Handoffs 1-8.
Do not rediscover closed authority families.
Do not reopen legacy fallback hunts without current-code evidence.
Do not run live services casually.
Do not run RETEST until explicitly cleared.

## Next action

```text
Final completion-gate launch-readiness review only.

Then, if deliberately authorized, prepare and run one controlled live Acquisition Memo RETEST.
```

---

# Archived prior checkpoint content below


## Semantic authority update after final BOSSMAN lock

Final semantic authority now rests on canonical delivery authority, not on pipeline-specific labels, legacy aliases, or top-level compatibility flags.

```text
Canonical delivery authority source:
deliveryDecisionState.source === "canonical_delivery_decision"

Required semantic authority facts:
core_valid_required_coverage === true
delivery_gate_status === "deliverable"
customer_delivery_allowed === true
hold_delivery !== true
customer blockers length === 0
```

Forbidden authority sources:

```text
legacy mortgage DSCR fallback
legacyCustomerBlockerFallbackCodes
legacy action-plan fallback
legacy publish-eligibility fallback
top-level delivery aliases
compatibility aliases without canonical state
customer_delivery_allowed without canonical core-valid state
delivery_gate_status deliverable without explicit customer permission
worker publication transition without canonical authority
```

Accepted authority conclusion:

```text
Screening and Acquisition Memo V2 do not share one internal Boss implementation.
They do share one protected final delivery authority.
That final authority is now the real BOSSMAN.
```

# July 11, 2026 Final Completion-Gate Continuation - Screening Delivery Gate Execution-Order Fix PASS / Shared Publish-or-Collapse Constitution Confirmed / Commit b53b5a1

### This addendum supersedes the prior July 11 Handoff 8 / Delivery Gate / Sol Trial checkpoint as the active continuation point.

## Current verified state

```text
STEPS 1-6:
PASS / protect.

HANDOFFS 1-8:
PASS / protect.

HANDOFF 8 - DELIVERY GATE:
PASS / protect.

SCREENING DELIVERY-GATE EXECUTION-ORDER FIX:
PASS / protect.

SHARED PUBLISH-OR-COLLAPSE CONSTITUTION:
PASS / protect.

SCREENING PIPELINE:
PASS / protect under the shared Publish-or-Collapse Constitution.

ACQUISITION MEMO PIPELINE:
PASS / protect under the shared Publish-or-Collapse Constitution.

BASELINE DELIVERY-GATE COMMIT:
bd24b94.

LATEST SCREENING PARITY FIX COMMIT:
b53b5a1.

FINAL ANTI-WHACK-A-MOLE COMPLETION GATE:
ACTIVE.

LIVE ACQUISITION MEMO RETEST:
LOCKED pending deliberate final completion-gate closeout decision.
DO NOT RUN.
```

## What changed after the prior checkpoint

The prior July 11 checkpoint protected Handoff 8 Delivery Gate authority and introduced the bounded GPT-5.6 Sol trial workflow.

After that checkpoint, Rob asked the long-running BOSSMAN question in its practical form:

```text
Do both Screening and Acquisition Memo obey the same publication constitution?

A. Usable core with missing section facts -> publish with collapse.
B. Complete usable core -> publish.
C. Usable core plus optional/support/downstream gaps -> publish with collapse, omit, qualify, or disclose.
D. Catastrophically unusable core -> fail closed.
```

The answer is now:

```text
YES.

One monolithic shared Boss object is not required.

The governing authority is the shared Publish-or-Collapse Constitution.

Pipeline-specific Boss/orchestration paths are acceptable only if both obey the same A-D doctrine.
```

## BOSSMAN architecture clarification

Important correction:

```text
Do not record the architecture as requiring one single production Boss object.

Current accepted doctrine:
- Screening may have its own pipeline authority.
- Acquisition Memo may have its own Boss / CustomerSurfaceModel / final-decision authority.
- Both must obey one shared constitutional publication doctrine.
```

Therefore the protected statement is:

```text
ONE PRODUCT-WIDE PUBLISH-OR-COLLAPSE CONSTITUTION:
YES.

ONE REQUIRED MONOLITHIC BOSS OBJECT:
NO.
```

This is the preferred architecture because:

```text
- pipeline ownership remains isolated;
- Screening and Acquisition can evolve independently;
- publication behavior stays identical where it matters;
- future report types can adopt the same constitution without sharing fragile implementation internals.
```

## Screening constitutional parity defect found

Bounded Sol and ChatGPT manual review found a real Screening execution-order defect.

The defect was not a doctrine problem.

The defect was that Screening could return before the shared Delivery Gate was constructed.

Old shape:

```text
Screening branch
-> render / seal response
-> return
-> shared buildDeliveryGateDecision(...) never reached
```

Known effect:

```text
deliveryGateDecisionResult remained null.

screening pipeline response carried no canonical deliveryDecisionState.

worker saw missing delivery_gate_status.

missing delivery status defaulted to blocked.

Screening could fail to publish even when core T12 + Rent Roll were usable.
```

That violated the shared A/B/C Publish-or-Collapse doctrine for Screening.

Acquisition Memo already passed the A/B/C/D publication doctrine.

## Screening execution-order fix accepted

Production file changed:

```text
api/_lib/generate-client-report-impl.js
```

Accepted fix:

```text
- premature Screening sealing / response returns were deferred;
- Screening rendered HTML is preserved in finalHtml;
- execution continues through the shared QA chain;
- existing shared buildDeliveryGateDecision(...) is reused;
- Screening seals once after canonical Delivery Gate state exists;
- final Screening response exposes canonical worker-consumed delivery fields.
```

Canonical fields now returned for Screening:

```text
deliveryDecisionState
delivery_gate_status
hold_delivery
customer_delivery_allowed
report_publishable
report_blocked
customer_delivery_ready
customer_publish_eligible
```

No new independent Screening-specific delivery authority was created.

No `admin_review_required` doctrine was reintroduced.

No legacy alias, customer flag, or compatibility field can manufacture deliverability.

## Post-fix constitutional parity audit

Post-fix bounded audit result:

```text
SCREENING A:
usable core + missing section facts
-> deliverable / publish with collapse.

SCREENING B:
complete usable core
-> deliverable / publish.

SCREENING C:
usable core + optional/support/downstream gaps
-> deliverable / publish with collapse, omit, qualify, or disclose.

SCREENING D:
catastrophically unusable core
-> held / blocked, including user_needs_documents style outcomes.
```

Acquisition Memo already satisfied the same A/B/C/D doctrine.

Final disposition:

```text
SCREENING DELIVERY-GATE EXECUTION-ORDER FIX:
PASS / protect.

SHARED PUBLISH-OR-COLLAPSE CONSTITUTIONAL PARITY:
PASS / protect.
```

## Commit checkpoint

Accepted commit:

```text
b53b5a1
Fix Screening delivery-gate execution order
```

Committed file:

```text
api/_lib/generate-client-report-impl.js
```

Commit status:

```text
Committed and pushed by Rob after local cleanup.
```

Prior protected Delivery Gate baseline remains:

```text
bd24b94
```

Do not confuse the two commits:

```text
bd24b94:
Handoff 8 Delivery Gate protected baseline.

b53b5a1:
Screening delivery-gate execution-order / constitutional parity fix.
```

## Updated semantic authority interpretation

The semantic authority ledger now treats publication authority as constitutional rather than object-monolithic.

Protected authority principle:

```text
A pipeline-specific authority path is valid only if it cannot contradict the product-wide Publish-or-Collapse Constitution.
```

This means:

```text
- Screening cannot skip Delivery Gate and silently block usable-core reports.
- Acquisition Memo cannot bypass Boss / CustomerSurfaceModel / Final Decision / Delivery Gate protections.
- worker-facing delivery fields must come from canonical Delivery Gate authority.
- missing delivery status remains blocked.
- deliverability requires explicit deliverable authority.
```

## GPT-5.6 Sol workflow refinement

The Sol trial is accepted as useful for bounded architecture audits, not as an independent source of truth.

Permanent workflow:

```text
REAL CURRENT FILES
-> bounded Sol architecture audit when useful
-> smallest coherent patch if required
-> Rob provides receipt plus changed files / diff summary
-> ChatGPT manually verifies actual production file
-> PASS / HOLD / BLOCKED
-> commit only after accepted verification
```

Important refinement:

```text
Sol is useful for bounded architecture and execution-order audits.

Codex remains preferred for surgical implementation when the edit boundary is already narrow.

Neither Sol nor Codex receipts are trusted without manual verification of real production files.
```

Hard rules remain:

```text
- no broad repo rewrites;
- no live services;
- no RETEST;
- no reopening protected Handoffs without current-code evidence;
- no report-specific hardcoding;
- no weakening Boss, CustomerSurfaceModel, Final Decision, or Delivery Gate;
- no compatibility aliases that manufacture deliverability.
```

## Fresh-chat continuation point

Rob will upload the updated MASTER, CVF, and Semantic Authority ledgers in a fresh chat.

Start from:

```text
InvestorIQ final completion gate after Screening delivery-gate parity fix.

Use the uploaded ledgers as current source of truth.

Do not restart Handoff 4 / DUPFACT-4.

Do not reopen Handoffs 1-8 without concrete current-code contradiction.

Do not run live RETEST yet.

Current protected commits:
bd24b94
b53b5a1
```

Likely next task:

```text
Perform final completion-gate readiness review and decide whether to authorize one controlled live Acquisition Memo RETEST.
```

If live RETEST is considered, first prepare a controlled RETEST plan.

Do not run live services casually.

---

# Archived prior checkpoint content below


# July 11, 2026 Active Checkpoint - Final Anti-Whack-a-Mole Gate Advanced / Handoffs 1-8 PASS / Handoff 8 Delivery Gate PASS and Protected

### This addendum supersedes the prior July 8 Handoff 4 / DUPFACT-4 checkpoint as the active continuation point.

## Current verified state

```text
STEPS 1-6:
PASS / protect.

HANDOFFS 1-8:
PASS / protect.

HANDOFF 8 - DELIVERY GATE:
PASS / protect.

FINAL SOL AUDIT:
PASS.
No files changed.

MANUAL CHATGPT VERIFICATION:
PASS.

SYNTAX CHECKS:
node --check api/admin-run-worker.js: PASS.
node --check api/_lib/report-delivery-output.js: PASS.

COMMIT:
bd24b94.

FINAL ANTI-WHACK-A-MOLE COMPLETION GATE:
ACTIVE pending final full completion-gate closeout decision.

LIVE ACQUISITION MEMO RETEST:
LOCKED pending final full completion-gate closeout decision.
DO NOT RUN.
```

## Handoff 8 closeout

```text
HANDOFF 8:
PASS / protect.

Delivery Gate publication, artifact, and worker transition boundaries are fail closed.
The final bounded Sol audit found no remaining production delivery-authority bypass within scope.
Manual ChatGPT verification passed.
```

Next action:

```text
Keep Steps 1-6 and Handoffs 1-8 protected.
Do not run live RETEST pending the final full completion-gate closeout decision.
```

## Current product doctrine

```text
Substantially usable T12 + substantially usable Rent Roll = publish.

Bad, unreadable, contradictory, or unsupported portions of otherwise usable core docs collapse only the affected sections.

Optional / support / advanced failures collapse, omit, qualify, or disclose.

Full report failure only happens when core docs are so unusable that no responsible report can establish a usable core basis, or for true runtime / storage / PDF / platform fatal.

There is no admin_review_required doctrine.
```

## Delivery Gate invariants now protected

```text
HANDOFF 8:
PASS / protect.

Missing delivery status defaults to blocked.

Blocked or held outcomes skip publication-record resolution and download-artifact work.

Publication helpers require explicit deliveryGateStatus === "deliverable" and holdDelivery !== true.

The download-artifact helper requires explicit deliveryGateStatus === "deliverable" and holdDelivery !== true before existing-artifact reuse, rendering, upload, verification, or return.

The worker passes the same resolved canonical deliveryGateStatus and holdDelivery authority into both publication and artifact helpers.

Worker transitions to pdf_generating, publishing, and published require explicit deliverable authority.

Legacy aliases, customer flags, and coreValidRequiredCoverage cannot manufacture deliverability.
```

## Handoff 7 Final Decision now protected

```text
FINAL-1:
PASS / protect.
Missing customerSurfaceModelValidation and missing customerSurfaceHtmlValidation fail closed.
modelOk / htmlOk require explicit validation object with ok === true.

FINAL-2:
PASS / protect.
Publication requires explicit coreGate object with coreGate.publishAllowed === true.
Missing coreGate or missing publishAllowed fails closed.

HANDOFF 7 FINAL DECISION:
PASS / protect.
```

## Handoff 6 Orchestrator now protected

```text
ORCH-1 through ORCH-8:
PASS / protect.

Current protected result:
Repaired-path Boss state and repaired CustomerSurfaceModel validation are consistently aligned across initial-repair failure branches and post-render retry carry-forward.
No Orchestrator-owned truth-laundering blocker remains known.
```

## Handoff 5 Repair now protected

```text
REPAIR-1:
PASS / protect.
accepted_purchase_assumptions_lost and accepted_current_debt_lost removed from repairable Boss codes.

REPAIR-2:
PASS / protect.
accepted_purchase_assumptions_lost and accepted_current_debt_lost classified as core fatal in isCoreFatalPath(...).

REPAIR-3:
PASS / protect.
Core-fatal classification is evaluated before advisory / warning downgrade.

HANDOFF 5 REPAIR:
PASS / protect.
```

## Handoff 4 CustomerSurfaceModel now protected

The prior July 8 ledger was active at DUPFACT-4, but the work later advanced past that point. Current disposition:

```text
HANDOFF 4 CUSTOMERSURFACEMODEL:
PASS / protect.

Protected subfamilies include:
- acceptedProvenance preservation;
- purchase / current accepted truth compatibility;
- current-debt accepted alias canonicalization;
- duplicate identity alias union;
- deterministic accepted-authority priority;
- sovereign other-role family separation;
- incompatible basis filtering;
- incompatible truth exclusivity;
- Appraisal sourceBacked provenance;
- Renovation sourceBacked provenance;
- Market Survey sourceBacked provenance;
- Environmental sourceBacked provenance;
- deterministic typed pairwise extracted-fact resolver;
- active resolved extractedFacts wiring;
- incompatible-family no-fill firewall;
- accepted-family vs empty-family no-fill firewall;
- whole-group duplicate fact determinism closure after DUPFACT family completion.
```

Do not restart at DUPFACT-4 unless a fresh current-code contradiction is found.

## GPT-5.6 Sol trial workflow

Rob now has access to ChatGPT Work on Windows with the local InvestorIQ folder mounted directly, and discovered GPT-5.6 options including Sol / Terra / Luna.

New experimental workflow:

```text
OLD MODE:
1 tiny Codex patch
-> upload changed file
-> ChatGPT verifies
-> repeat

NEW SOL TRIAL MODE:
1 bounded medium-batch audit / fix task
-> Sol edits directly in the local InvestorIQ folder
-> Rob provides Sol receipt plus changed files or diff summary
-> ChatGPT verifies manually before PASS
```

Sol trial rules:

```text
- Use Sol for bounded architecture / pipeline / delivery-gate audits.
- Do not let Sol rewrite the kingdom.
- Use one narrow file family at a time.
- First trial target: Handoff 8 Delivery Gate / publication boundary.
- Sol may inspect direct call sites for report-delivery-output.js helpers.
- No live services.
- No RETEST.
- No broad smoke wall.
- No repo-wide refactor.
- No pricing, UI copy, parser, Boss, CustomerSurfaceModel, or unrelated report-generation changes.
- ChatGPT still verifies actual changed files before PASS.
```

Approved first Sol experiment shape:

```text
SOL EXPERIMENT 1:
Delivery Gate / publication boundary only.

Start with:
api/_lib/report-delivery-output.js

Then inspect only direct import / call-site files needed to verify:
- buildDeliveryResponseCompatibilityAliases(...)
- assertValidReportPublicationInsert(...)
- resolveOrCreateReportPublicationRecord(...)
- ensureReportDownloadArtifact(...)

Goal:
Find any remaining fail-open delivery / publication paths.
If a fix is needed, make the smallest coherent patch across the fewest files.
```

## Permanent execution doctrine with Sol added

```text
REAL CURRENT FILES
-> bounded model-assisted audit or manual inspection
-> explicit handoff invariant
-> PASS / HOLD / BLOCKED
-> if using Sol, bounded medium batch only
-> Rob provides receipt + changed files / diff summary
-> ChatGPT manual verification of actual changed files
-> targeted proof only if needed
-> no live RETEST until final gate clears
```

Hard constraints remain:

```text
- Do not trust any model receipt by itself, including Sol.
- Do not run live services.
- Do not run RETEST.
- Do not use broad smoke walls as a substitute for authority proof.
- Do not reopen protected handoffs without concrete current-code evidence.
- Do not weaken Boss, CustomerSurfaceModel, Final Decision, or Delivery Gate.
- Do not hardcode Stonebridge or any single test report.
```

## Fresh-chat continuation point

Rob will start a fresh chat after uploading these updated ledgers.

First task in fresh chat:

```text
Continue InvestorIQ final anti-whack-a-mole gate from Handoff 8 Delivery Gate.
Use updated ledgers as current source of truth.
Do not restart at Handoff 4 / DUPFACT-4.
Do not reopen Handoffs 1-7 without concrete contrary current-code evidence.
Live Acquisition Memo RETEST remains locked.
```

Potential first action:

```text
Run SOL EXPERIMENT 1 in ChatGPT Work against the local InvestorIQ folder.
Then paste Sol receipt and upload any changed files / diff summary here for ChatGPT manual verification.
```

---

# Archived prior checkpoint content below


## Semantic authority July 11 update

```text
Accepted-role sovereignty:
PASS / protect.

Projection authority:
PASS / protect.

Boss authority consumption:
PASS / protect.

CustomerSurfaceModel authority:
PASS / protect.

Repair authority:
PASS / protect.

Orchestrator authority:
PASS / protect.

Final Decision authority:
PASS / protect.

Delivery Gate authority:
ACTIVE after DELIVERY-5 PASS.
```

Current authority principle:

```text
No compatibility alias, legacy flag, missing status fallback, customer_delivery_allowed override, report_publishable alias, or publication insert helper may create customer deliverability without explicit delivery-gate authority.
```


# July 8, 2026 Active Checkpoint — Handoff 4 CustomerSurfaceModel Deep Manual Review / Provenance-Completeness Closure PASS / Duplicate-Fact Merge Active / DUPFACT-4 Group Resolver Next

### This addendum supersedes the prior July 7 “CustomerSurfaceModel Next” checkpoint as the active handoff.

## Current verified state

```text
STEPS 1–4:
PASS / protect.

STEP 5:
PASS checkpoint.

LAST ACCEPTED COMMIT CHECKPOINT:
main / fd80bb7.

IMPORTANT:
Later manually reviewed working-state production changes exist.
Do not falsely describe them as committed in fd80bb7.

STEP 6 FINAL DELIVERY GATE INTEGRITY:
PASS checkpoint.

FINAL ANTI-WHACK-A-MOLE COMPLETION GATE:
ACTIVE.

HANDOFF 1 — ACCEPTED TRUTH:
PASS / protect.

HANDOFF 2 — PROJECTION:
PASS / protect.

HANDOFF 3 — BOSS CONTRACT:
PASS / protect.

HANDOFF 4 — CUSTOMERSURFACEMODEL:
ACTIVE / HOLD.

HANDOFF 5 — REPAIR:
PENDING.

HANDOFF 6 — ORCHESTRATOR:
PENDING.

HANDOFF 7 — FINAL DECISION:
PENDING.

HANDOFF 8 — DELIVERY GATE:
PENDING.

LIVE ACQUISITION MEMO RETEST:
LOCKED.
DO NOT RUN.
```

---

## Permanent execution doctrine

Continue exactly:

```text
REAL CURRENT FILE
-> CHATGPT MANUAL FULL-FILE INSPECTION
-> HANDOFF INVARIANT
-> PASS / HOLD / BLOCKED
-> 3–5 TINY SEQUENTIAL CODEX MICROS ONLY IF NEEDED
-> ROB PROVIDES RECEIPT + EVERY CHANGED FULL FILE
-> CHATGPT FULL-FILE MANUAL REVIEW
-> TARGETED PROOF
```

Hard rules:

```text
- Do not trust Codex receipts.
- Do not send Codex first.
- Do not run tests first.
- No broad smoke wall.
- No live services.
- No RETEST until all handoffs clear.
- One Codex prompt = one literal micro-change or invariant.
- Keep Codex receipts extremely short.
- Do not bundle adjacent fixes for convenience.
- Do not reopen protected micros absent new contrary evidence.
```

---

# Handoff 4 — CustomerSurfaceModel — current exact state

Real production owner:

```text
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Controlling invariants:

```text
1. accepted purchase assumptions truth remains purchase assumptions;
2. accepted current debt truth remains current debt;
3. accepted authority fields, not generic parser fields, establish accepted truth;
4. sourceBacked represents provenance, not completeness;
5. sourceBacked true + nonempty missing[] remains legal;
6. same physical source cannot create incompatible customer-surface truth;
7. Boss / Projection truth is consumed rather than independently reclassified;
8. optional absence may collapse, but accepted/source-backed truth may not be erased;
9. core T12 / Rent Roll truth remains sovereign;
10. CustomerSurfaceModel cannot silently downgrade truth in a way later repair can launder.
```

## Accepted protected micro history

```text
MICRO 1:
PASS / PROTECT.
acceptedProvenance preserved in normalizeSupportDoc(...).

MICRO 2:
PASS / PROTECT.
compatibility-aware accepted purchase/current truth.

MICRO 2A:
PASS / PROTECT.
accepted current-debt aliases canonicalized to current_debt_context.

MICRO 3A:
PASS / PROTECT.
duplicate identity aliases rebound to one merged index.

MICRO 3B:
PASS / PROTECT.
pairwise accepted-authority priority made deterministic.

MICRO 3C-1:
PASS / PROTECT.
sovereign non-purchase/current accepted roles get distinct accepted_role:* families.

MICRO 3C-2:
PASS / PROTECT.
explicit compatibility matrix:
both empty / one empty / same nonempty compatible;
distinct nonempty incompatible.

MICRO 3C-3:
PASS / PROTECT.
incompatible acceptedDebtBasis filtered against selected primary sovereign role family.

MICRO 3C-4:
PASS / PROTECT.
incompatible branch accepted truth booleans made family-exclusive.

MICRO 3 OVERALL:
PASS / PROTECT.
```

Do not reopen these absent new contrary evidence.

---

# Provenance vs completeness defect family — CLOSED / PROTECT

Four sequential optional-context micros were completed and manually reviewed on actual full production files.

```text
SOURCEBACKED-1 — Appraisal:
PASS / PROTECT.

SOURCEBACKED-2 — Renovation:
PASS / PROTECT.

SOURCEBACKED-3 — Market Survey:
PASS / PROTECT.

SOURCEBACKED-4 — Environmental:
PASS / PROTECT.
```

Accepted invariant in all four branches:

```text
source exists
-> factAvailability.sourceBacked true

source absent
-> factAvailability.sourceBacked false
```

Recognized-fact completeness no longer controls `sourceBacked`.

Protected legal state:

```text
status = collapsed
sourceBacked = true
missing[] may remain non-empty
```

This is intentional because:

```text
PROVENANCE != COMPLETENESS
PRESENTATION COLLAPSE != SOURCE ABSENCE
```

No status-logic rewrite was authorized in those micros.

---

# Duplicate extracted-fact preservation family

## Initial defect

Manual full-file review proved duplicate physical-source merging preserved accepted authority but discarded richer later `extractedFacts`.

Old merge shape effectively began from:

```text
...existingDoc
```

without merged extracted facts.

Consequence:

```text
same physical source
+
sparse first representation
+
richer later Projection/Boss representation
->
accepted authority may survive
but richer facts disappear
->
false missing / partial collapse risk
```

## DUPFACT-1 — deterministic pair resolver helper

```text
PASS / PROTECT.
```

Added:

```text
resolveMergedExtractedFacts(existingDoc, incomingDoc)
```

Required semantics preserved:

```text
- accepted-authority priority first;
- primary facts cloned;
- missing top-level values may be filled from secondary;
- primary non-missing values never overwritten;
- null/undefined/blank string/empty array/empty plain object = missing;
- 0 and false = valid;
- no input mutation.
```

## DUPFACT-2 / 2A — intermediate HOLDs

These intermediate attempts were not accepted as final closure because pairwise primary selection retained equal-priority/equal-signature order-dependence.

Disposition:

```text
SUPERSEDED BY CORRECTIVE MICRO.
DO NOT TREAT AS FINAL PASS.
```

## DUPFACT-2B — typed extracted-facts signature

```text
PASS / PROTECT.
```

The resolver now recursively emits explicit typed signature tokens for:

```text
undefined
null
arrays
plain objects
strings
numbers
booleans
```

Protected distinctions include:

```text
undefined != null
blank string != missing property
empty array != empty plain object
number != string
boolean != string
```

Plain-object keys are sorted.
Array order remains preserved.

## DUPFACT-3 — active wiring

The resolver was wired into:

```text
mergeDuplicateNormalizedSupportDoc(existingDoc, incomingDoc)
```

Active merge now computes:

```text
resolvedExtractedFacts
resolvedAcceptedAuthority
```

and passes:

```text
extractedFacts: resolvedExtractedFacts
```

into `normalizeSupportDoc(...)`.

This activation exposed cross-family contamination risks, which were then handled by later micros.

## DUPFACT-3A — incompatible non-empty family firewall

```text
PASS / PROTECT.
```

In `resolveMergedExtractedFacts(...)`:

```text
primary non-empty family
+
different secondary non-empty family
->
return clone(primaryFacts)
->
no secondary fact fill
```

Therefore:

```text
purchase_assumptions + current_debt_context
-> no cross-fill

current_debt_context + purchase_assumptions
-> no cross-fill
```

## DUPFACT-3B — one-empty-family firewall

```text
PASS / PROTECT.
```

Current accepted firewall shape:

```text
if ((primaryFamily || secondaryFamily) && primaryFamily !== secondaryFamily)
  return mergedFacts;
```

Therefore:

```text
non-empty accepted family + empty family
-> no cross-fill

empty family + non-empty accepted family
-> no cross-fill

different non-empty families
-> no cross-fill

same non-empty family
-> fill allowed

both empty
-> fill allowed
```

This closes authority-empty parser/generic enrichment into sovereign accepted truth.

---

# Current active blocker — whole-collection duplicate determinism

The actual collection path sequentially folds duplicate representations:

```text
merge(merge(A, B), C)
```

because `collectSupportDocs(...)` repeatedly merges the same physical source as it appears through:

```text
canonicalSourcePackage.supportDocs
projection allSupportDocs
projection otherSupportDocs
projection purchaseAssumptions
projection currentDebtContext
projection structuredRenovation
projection appraisalContext
projection marketSurveyContext
projection environmentalContext
Boss sourceTruth.supportDocs
```

Manual reasoning proved:

```text
pairwise deterministic
!=
multi-representation deterministic
```

The pairwise merge is not guaranteed associative.

Concrete same-family conflict shape:

```text
A facts: { x: 1 }
B facts: { y: 1 }
C facts: { y: 2 }
```

Sequential folding can preserve different final `y` values depending on representation arrival order.

Disposition:

```text
PAIRWISE MERGE SAFETY:
PASS.

WHOLE-COLLECTION DUPLICATE DETERMINISM:
HOLD.

HANDOFF 4:
HOLD.

RETEST:
LOCKED.
```

---

# DUPFACT-4 — ACTIVE WITH CODEX NOW

Exact active prompt already sent:

```text
CODEX DUPFACT-4

FILE:
api/_lib/acquisition-memo-v2-customer-surface-model.js

ONE CHANGE ONLY.

Add a local helper:

resolveMergedExtractedFactsFromGroup(docs)

Required behavior:

- accept an array of normalized support docs
- ignore non-object entries
- if no valid docs, return {}
- sort all valid docs deterministically using:
  1. existing compareAcceptedAuthorityPriority(...)
  2. the same typed extractedFacts signature logic already used by resolveMergedExtractedFacts(...)
  3. the same stable identity signature logic already used there
- choose the first sorted doc as primary
- clone primary.extractedFacts
- determine the primary accepted-authority family
- only allow missing top-level fact fill from docs with:
  - the same non-empty family as primary, or
  - empty family when primary family is also empty
- never fill across different non-empty families
- never fill between empty and non-empty families
- process secondary docs in the same deterministic sorted order
- preserve existing missing-value semantics:
  - null missing
  - undefined missing
  - blank string missing
  - empty array missing
  - empty plain object missing
  - 0 valid
  - false valid
- primary non-missing values must never be overwritten
- return a new plain object
- do not mutate inputs

Do not call the helper yet.
Do not change resolveMergedExtractedFacts(...).
Do not change mergeDuplicateNormalizedSupportDoc(...).
Do not change collectSupportDocs(...).
Do not change accepted-authority logic.
Do not change tests.
Do not run tests.
Do not touch other files.

Return only:

PASS/HOLD
file changed
exact deterministic group extracted-fact resolver added
```

## Exact next action

Rob will open a fresh chat and paste Codex's DUPFACT-4 reply as the first message.

Required assistant behavior:

```text
1. Do not trust Codex receipt.
2. Require / inspect the actual full changed production file.
3. Manually inspect the whole file.
4. Verify helper is added but NOT called.
5. Verify no change to:
   - resolveMergedExtractedFacts(...)
   - mergeDuplicateNormalizedSupportDoc(...)
   - collectSupportDocs(...)
   - accepted-authority logic
   - SOURCEBACKED 1–4
   - core T12 / Rent Roll logic
6. Verify group sort is deterministic.
7. Verify same-family and both-empty fill rules.
8. Verify different-family and one-empty-family no-fill rules.
9. Verify missing-value semantics.
10. Verify no mutation.
11. Return PASS / HOLD / BLOCKED from real file evidence.
```

If DUPFACT-4 passes, do not automatically wire it.

Next sequencing must be determined only after full-file inspection.

---

# Current protected checkpoint summary

```text
STEPS 1–4:
PASS / protect.

STEP 5:
PASS checkpoint.

STEP 6:
PASS checkpoint.

HANDOFF 1:
PASS / protect.

HANDOFF 2:
PASS / protect.

HANDOFF 3:
PASS / protect.

HANDOFF 4:
HOLD / active.

CustomerSurfaceModel protected:
- accepted truth precedence;
- role/basis compatibility;
- current-debt alias canonicalization;
- identity alias rebinding;
- deterministic accepted-authority priority;
- sovereign other-role families;
- incompatible basis filtering;
- incompatible truth exclusivity;
- optional sourceBacked provenance/completeness separation;
- deterministic typed pairwise extracted-fact resolution;
- active resolved extractedFacts wiring;
- incompatible-family fact-fill firewall;
- one-empty-family fact-fill firewall.

Current blocker:
whole-collection multi-representation duplicate determinism.

DUPFACT-4:
ACTIVE WITH CODEX.

HANDOFFS 5–8:
PENDING.

LIVE RETEST:
LOCKED.
```

---

# Fresh-chat continuation doctrine

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–6.
Do not reopen Handoffs 1–3.
Do not reopen protected Handoff 4 micros absent contrary evidence.
Do not run tests first.
Do not run RETEST.
Do not send a broad Codex investigation.

First user message:

```text
Codex DUPFACT-4 reply
```

Then continue from the exact active point above.


## AUTH-specific July 8 update

Current semantic-authority interpretation:

```text
Accepted-role sovereignty:
PASS / protect.

Projection authority:
PASS / protect.

Boss authority consumption:
PASS / protect.

CustomerSurfaceModel:
still active because duplicate physical-source representations can carry
multiple fact payloads even after role authority is stabilized.
```

New evidence-backed authority principle:

```text
ONE PHYSICAL SOURCE
-> ONE ACCEPTED AUTHORITY FAMILY
-> ONE DETERMINISTIC MERGED FACT PAYLOAD
```

The audit has now separated three distinct duplicate-source concerns:

```text
A. identity dedupe
B. accepted-authority merge
C. extracted-fact merge
```

A and B are materially protected.

C is not complete until multi-representation grouping is deterministic.

New active semantic-authority finding:

```text
PAIRWISE FACT MERGE DETERMINISM
DOES NOT PROVE
WHOLE-GROUP FACT MERGE DETERMINISM
```

DUPFACT-4 is therefore an authority-preservation micro, not merely data cleanup.


---

# Archived Prior Checkpoint Content Below

# July 7, 2026 Night Close-Out Checkpoint — Step 6 PASS / Final Anti-Whack-a-Mole Gate ACTIVE / Handoffs 1–3 PASS / Boss Contract Manually Cleared / CustomerSurfaceModel Next

### This addendum supersedes the prior “Boss Contract Next” checkpoint as the active handoff.

## Current verified state

```text
STEPS 1–4:
PASS / protect.

STEP 5:
PASS checkpoint.
Last accepted commit checkpoint remains fd80bb7 on main.

STEP 6 FINAL DELIVERY GATE INTEGRITY:
PASS checkpoint.

FINAL ANTI-WHACK-A-MOLE COMPLETION GATE:
ACTIVE.

HANDOFF 1 — ACCEPTED TRUTH:
PASS / protect.

HANDOFF 2 — PROJECTION:
PASS / protect.

HANDOFF 3 — BOSS CONTRACT:
PASS / protect after repeated real-file manual inspection,
multiple Codex PASS rejections,
corrective micro-fixes,
and full-file completion review.

HANDOFF 4 — CUSTOMERSURFACEMODEL:
NEXT.

LIVE ACQUISITION MEMO RETEST:
LOCKED.
DO NOT RUN YET.
```

---

## Commit / working-tree checkpoint

Last accepted commit checkpoint remains:

```text
branch: main
commit: fd80bb7
```

Do not falsely describe later production changes as committed in `fd80bb7`.

Known later working-state production changes manually reviewed include:

```text
api/_lib/acquisition-memo-v2-final-decision.js
- dedicated REPAIR_PROVENANCE_REGRESSION detection;
- fatalCategory precedence includes unresolved_provenance_regression;
- blockingReasons includes unresolved_provenance_regression.

api/_lib/acquisition-memo-v2-role-reconciler.js
- accepted-role sovereignty;
- null-safe no-candidate fallback;
- compatible accepted debt-basis preservation;
- Other Support fallback preserved.

api/_lib/acquisition-memo-boss-contract.js
- accepted purchase/current-debt truth recognizes sovereign accepted role/provenance;
- accepted role/basis compatibility fences;
- direct accepted debt basis outranks provenance accepted basis;
- normalized canonicalRole honors accepted-role precedence;
- active Boss-side current-debt evidence reclassification removed.
```

No new accepted commit checkpoint is recorded here.

---

# Handoff 3 — Boss Contract — PASS checkpoint

Real current production file manually inspected repeatedly:

```text
api/_lib/acquisition-memo-boss-contract.js
```

The review was intentionally whole-file, not patch-only.

## Initial contrary evidence found

The first real-file review proved Boss could preserve accepted role metadata while still derive:

```text
acceptedPurchaseAssumptionsTruth = false
acceptedCurrentDebtTruth = false
```

because source-backed truth recognition did not fully recognize already-sovereign accepted role/provenance and compatible accepted debt basis.

Downstream consequence:

```text
accepted role survives
->
accepted truth boolean false
->
sourceBacked false
->
required customer section collapses
```

Disposition:

```text
HOLD.
```

## Corrective micro history

Multiple Codex PASS receipts were manually rejected after real-file review found new contradictions.

### Defect A — dual incompatible truth

Independent OR aggregation could allow contradictory accepted role/basis inputs to produce both:

```text
acceptedPurchaseAssumptionsTruth = true
acceptedCurrentDebtTruth = true
```

Required invariant:

```text
ONE PHYSICAL SOURCE
-> ONE COMPATIBLE ACCEPTED AUTHORITY
```

Corrective micro added compatibility-aware truth derivation.

### Defect B — stale lower-precedence provenance basis could erase sovereign truth

The first compatibility patch required direct and provenance debt-basis copies to agree simultaneously.

Forbidden chain:

```text
sovereign accepted role
+
compatible direct accepted basis
+
stale lower-precedence provenance basis
->
both truths false
```

Corrective micro established effective basis precedence:

```text
direct acceptedDebtBasis
>
acceptedProvenance accepted debt basis
>
none
```

Accepted implementation shape:

```text
selectedAcceptedDebtBasisKey =
acceptedDebtBasisKey || acceptedProvenanceDebtBasisKey
```

### Defect C — provenance accepted role could establish truth while generic role controlled canonicalRole

Forbidden split-brain case:

```text
acceptedProvenance.acceptedSemanticDocRole = purchase_assumptions
source.canonicalRole = current_debt_context

->
acceptedPurchaseAssumptionsTruth = true
canonicalRole = current_debt_context
```

Corrective micro established normalized canonical-role precedence:

```text
direct acceptedSemanticDocRole
>
acceptedProvenance accepted semantic role
>
generic canonicalRole
>
generic canonical_support_doc_role
>
generic role
>
null
```

Accepted implementation shape:

```text
selectedAcceptedRole
||
source.canonicalRole
||
source.canonical_support_doc_role
||
source.role
||
null
```

### Defect D — active Boss-side current-debt reclassification remained

Whole-file review found active production path:

```text
promoteCurrentDebtSupportDoc(...)
```

The helper could inspect:

```text
evidence text
current_outstanding_balance
monthly_payment
```

and independently write:

```text
canonicalRole = current_debt_context
role = current_debt_context
allowedUses = ["current_debt_context"]
forbiddenUses = [...]
```

This violated:

```text
PROJECTION / ACCEPTED AUTHORITY OWNS SEMANTIC ROLE.
BOSS CONSUMES ROLE.
BOSS DOES NOT INVENT ROLE FROM EVIDENCE TEXT.
```

The helper also read generic:

```text
acceptedProvenance.debt_basis
```

inside the old promotion path.

Root-cause micro removed the active fallback call.

Current build-path selection:

```text
findSupportDocByRole(supportDocs, "current_debt_context")
||
acquisitionMemoProjection?.supportDocProjection?.currentDebtContext
||
null
```

The evidence-driven promotion helper is no longer called.

## Dead helper classification

Current file still contains:

```text
promoteCurrentDebtSupportDoc(...)
```

and its evidence helper.

Manual inspection / targeted reference review found:

```text
definition only;
no active caller;
not exported.
```

Disposition:

```text
STALE DEAD-CODE CLEANUP DEBT:
YES.

ACTIVE AUTHORITY BLOCKER:
NO.

DO NOT REOPEN HANDOFF 3 MERELY BECAUSE DEAD UNREACHABLE CODE REMAINS.
Record for later cleanup only.
```

## Final eight-invariant Boss verdict

```text
1. accepted purchase assumptions truth remains purchase assumptions:
PASS.

2. accepted current debt truth remains current debt:
PASS.

3. Boss source-backed booleans derive from accepted truth/provenance:
PASS.

4. generic parser fields cannot override accepted truth:
PASS on active path.

5. same physical source cannot become incompatible duplicate authority:
PASS with non-blocking first-seen ordering watch.

6. Projection truth is consumed, not independently reclassified:
PASS on active path.

7. optional/support absence may collapse, but accepted truth may not be erased:
PASS.

8. core gate remains T12 / Rent Roll sovereign:
PASS / protect.
```

Final disposition:

```text
HANDOFF 3 — BOSS CONTRACT:
PASS / PROTECT.
```

---

# Full-file collateral-damage review

The final Boss review rechecked:

```text
accepted role precedence
accepted debt-basis precedence
dual-truth prevention
canonical-role precedence
purchase/current-debt separation
support-doc dedupe
collection order
purchase loan amount precedence
T12 supplementation
current-debt fact supplementation
source-backed integrity escalation
routing taxonomy
collapseSectionByTitle boundary guard
forbidden-surface handling
post-render validators
core gate
exports
active current-debt reclassification caller
```

Accepted result:

```text
NO NEW COLLATERAL PRODUCTION DEFECT FOUND.
```

Targeted syntax proof:

```text
node --check api/_lib/acquisition-memo-boss-contract.js
PASS.
```

No tests were run for the final micro.
No live services.
No RETEST.

---

# Current final anti-whack-a-mole sequence

```text
1. Accepted Truth:
PASS / protect.

2. Projection:
PASS / protect.

3. Boss Contract:
PASS / protect.

4. CustomerSurfaceModel:
NEXT.

5. Repair:
PENDING.

6. Orchestrator:
PENDING.

7. Final Decision:
PENDING.

8. Delivery Gate:
PENDING.
```

Only after all remaining handoffs are manually cleared:

```text
consider one controlled live Acquisition Memo RETEST.
```

---

# Exact next fresh-chat continuation point

Rob is stopping because fatigue is materially worsening.

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–6.
Do not reopen Accepted Truth, Projection, or Boss Contract without new contrary evidence.
Do not run live RETEST.
Do not send a broad Codex investigation.

Current exact state:

```text
Steps 1–4:
PASS / protect.

Step 5:
PASS checkpoint.
Last accepted commit checkpoint: fd80bb7.

Step 6:
PASS checkpoint.

Final anti-whack-a-mole completion gate:
ACTIVE.

Handoff 1 — Accepted Truth:
PASS / protect.

Handoff 2 — Projection:
PASS / protect.

Handoff 3 — Boss Contract:
PASS / protect.

Handoff 4 — CustomerSurfaceModel:
NEXT.
```

First user action in the fresh chat:

```text
Upload:
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

First assistant task:

```text
Manually inspect the real current CustomerSurfaceModel file before Codex or tests.

Inspect only the next handoff invariants:

1. accepted purchase assumptions truth remains purchase assumptions;
2. accepted current debt truth remains current debt;
3. accepted authority fields, not generic parser fields, establish accepted truth;
4. sourceBacked is provenance, not completeness;
5. sourceBacked true + nonempty missing[] remains legal;
6. same physical source cannot create incompatible customer-surface truth;
7. Boss/Projection truth is consumed rather than reclassified;
8. optional absence may collapse, but accepted/source-backed truth may not be erased;
9. core T12 / Rent Roll truth remains sovereign;
10. CustomerSurfaceModel cannot silently downgrade truth in a way later repair can launder.

Return only after direct manual file inspection:

PASS
HOLD
or
BLOCKED
```

Then choose the next action from evidence.

---

# Permanent doctrine reaffirmed

```text
REAL CURRENT FILE
-> CHATGPT MANUAL INSPECTION
-> HANDOFF INVARIANT
-> PASS / HOLD / BLOCKED
-> TINY CODEX MICRO ONLY IF NEEDED
-> ROB UPLOADS EVERY CHANGED FILE
-> CHATGPT FULL-FILE MANUAL REVIEW
-> TARGETED PROOF
```

Never again:

```text
Codex says PASS
-> trust receipt
-> RETEST
```

Tonight's Boss review proved the doctrine again by catching and closing multiple downstream truth-authority contradictions before live testing.

---


## AUTH-specific night close-out

```text
HANDOFF 1 accepted-truth sovereignty:
PASS / proven.

HANDOFF 2 projection authority:
PASS / protect.

HANDOFF 3 Boss Contract:
PASS / protect.
```

New evidence-backed Boss closure includes:

```text
- accepted role/provenance establishes compatible purchase/current truth;
- effective accepted debt-basis precedence is direct > provenance > none;
- normalized canonicalRole honors accepted-role precedence;
- incompatible role/basis cannot mint dual truth;
- stale lower-precedence provenance basis cannot veto direct sovereign accepted basis;
- active Boss text/structured evidence current-debt reclassification removed;
- generic provenance debt_basis no longer participates in an active promotion path.
```

Deferred:

```text
dead promoteCurrentDebtSupportDoc helper cleanup only.
No active caller.
Not exported.
Not a P0 handoff blocker.
```


---

# Archived Prior Checkpoint Content Below

# July 7, 2026 Final Anti-Whack-a-Mole Checkpoint — Step 6 PASS / Final Manual Completion Gate ACTIVE / Accepted-Truth Gate 1 Defect Found, Repaired, Manually Inspected, and Behaviorally Proven / Projection PASS / Boss Contract Next

### This addendum supersedes the prior dinner-break checkpoint as the active handoff.

## Current verified state

```text
STEPS 1–4:
PASS / protect.

STEP 5:
PASS checkpoint.
Accepted commit checkpoint remains fd80bb7 on main.

STEP 6 FINAL DELIVERY GATE INTEGRITY:
PASS checkpoint.
AUTH-092 through AUTH-105 review completed in tiny evidence-backed units.

FINAL ANTI-WHACK-A-MOLE COMPLETION GATE:
ACTIVE.

HANDOFF 1 — ACCEPTED TRUTH:
PASS after contrary evidence, one-file repair, manual changed-file review,
corrective micro-fixes, and three-case behavioral proof.

HANDOFF 2 — PROJECTION:
PASS / protect from direct manual inspection of the real current file.

HANDOFF 3 — BOSS CONTRACT:
NEXT.
First fresh-chat action is to upload:
api/_lib/acquisition-memo-boss-contract.js

LIVE ACQUISITION MEMO RETEST:
LOCKED.
DO NOT RUN YET.
```

---

## Commit / working-tree checkpoint

Last accepted commit checkpoint remains:

```text
branch: main
commit: fd80bb7
```

That commit covered the accepted Step 5 provenance-preservation checkpoint and first Step 6 `complianceOk` publication-gate fix.

Important later-state refinement:

```text
The current working state now contains later production changes
that are not represented by a newly accepted commit checkpoint in this ledger.
```

Known later production changes manually reviewed in this session include:

```text
api/_lib/acquisition-memo-v2-final-decision.js
- dedicated REPAIR_PROVENANCE_REGRESSION detection;
- fatalCategory precedence:
  unresolved_provenance_regression;
- dedicated blocking reason:
  unresolved_provenance_regression.

api/_lib/acquisition-memo-v2-role-reconciler.js
- accepted-role sovereignty;
- null-safe no-candidate fallback;
- compatible accepted debt-basis preservation only;
- Other Support fallback preserved.
```

Do not falsely describe these later working-tree changes as committed in `fd80bb7`.

---

# Step 6 final delivery gate integrity — PASS checkpoint

The remaining AUTH-092 through AUTH-105 family was reviewed after dinner in tiny evidence-backed units.

## AUTH-092 / AUTH-103 — full final compliance now participates in publication

Current verified predicate requires:

```text
coreGate?.publishAllowed !== false
&&
complianceOk
&&
modelOk
&&
!coreFatal
&&
!unsafeFinalHtml
```

Therefore:

```text
final compliance false
->
publishable false
```

Behavioral proof already passed on the cleaned later-retry provenance smoke.

## AUTH-093 / AUTH-094 — Boss and HTML status flow through complianceOk

Verified current relationship:

```text
complianceOk
=
final.compliance.ok
&&
bossOk
&&
modelOk
&&
htmlOk
```

Therefore:

```text
publishable true
->
bossOk true
->
htmlOk true
```

Manual inspection of the real current orchestrator found exactly four final-decision call sites.

All four were confirmed to supply:

```text
customerSurfaceModelValidation
customerSurfaceHtmlValidation
```

Therefore the permissive missing-validation defaults in final-decision are not reachable through the current orchestrator call path.

No edit was warranted for that seam.

## AUTH-104 — dedicated provenance/truth-regression final classification

The audit proved the old final decision did not explicitly detect:

```text
REPAIR_PROVENANCE_REGRESSION
```

and had no dedicated final blocking category.

Old behavior for a provenance regression plus non-empty repairable plan:

```text
final_delivery_status:
blocked

fatalCategory:
repairable_optional_support_unresolved

blockingReasons:
["repairable_optional_support_unresolved_after_repair"]
```

This was semantically wrong because repair-induced truth/provenance regression was being mislabeled as ordinary unresolved optional/support repair.

Accepted one-file production change:

```text
api/_lib/acquisition-memo-v2-final-decision.js
```

New exact classification:

```text
fatalCategory:
unresolved_provenance_regression

blockingReasons includes:
unresolved_provenance_regression
```

Precedence now preserves:

```text
true_core_fatal
>
true_unrepaired_unsafe_final_html
>
unresolved_provenance_regression
>
repairable_optional_support_unresolved
>
final_compliance_unresolved
```

Manual inspection of the real changed file:

```text
PASS.
```

Targeted isolated runtime proof observed:

```text
final_delivery_status:
blocked

fatalCategory:
unresolved_provenance_regression

blockingReasons:
[
  "unresolved_provenance_regression",
  "repairable_optional_support_unresolved_after_repair"
]
```

Disposition:

```text
AUTH-104:
CLOSED + behaviorally proven.
```

## AUTH-098 — no redundant edit after control-flow proof

Audit question:

```text
Can final decision receive:
repairAttempted === true
repairedHtmlRevalidated === false
while the supplied finalization can still satisfy publishable?
```

Result:

```text
NO.
```

Real orchestrator control flow proves:

```text
publishable attempted-repair path
->
repaired HTML revalidated
->
retryFinalization.compliance.ok
->
zero provenance regression
```

The attempted-but-not-revalidated provenance-regression early return is deterministically failed compliance and blocked.

Disposition:

```text
AUTH-098:
MATERIALLY CLOSED BY CONTROL-FLOW PROOF.
NO EDIT.
```

## AUTH-099 — non-empty repair plan is not equivalent to unresolved failure

Audit proved a successful repaired retry can call final decision with the original non-empty:

```text
repairPlan
```

after:

```text
retryFinalization.compliance.ok
&&
provenanceRegressionViolations.length === 0
```

Therefore:

```text
repairableOptional === true
```

can mean historical repair-plan diagnostics remain attached after successful repair.

It does not necessarily mean unresolved repairable truth remains.

Disposition:

```text
AUTH-099:
RECLASSIFIED BY CURRENT CONTROL-FLOW EVIDENCE.
NO STANDALONE GATE EDIT.
```

## AUTH-101 — naming debt only

Production repository read audit result:

```text
NO_DOWNSTREAM_PRODUCTION_READS
```

for:

```text
finalBossCompliance.ok
```

Disposition:

```text
P1 diagnostic naming debt.
No live authority defect proven.
No Step 6 patch.
```

## AUTH-102 — watch/design review only

Preserved classification:

```text
WATCH / DESIGN REVIEW
NO PATCH YET
```

Do not invent upstream-readiness gating without evidence.

## Final Step 6 disposition

```text
AUTH-092:
CLOSED.

AUTH-093:
CLOSED.

AUTH-094:
CLOSED.

AUTH-095:
MATERIALLY CLOSED AS DELIVERY BYPASS.

AUTH-096:
MATERIALLY CLOSED BY STEP 5 + STEP 6.

AUTH-097:
MATERIALLY CLOSED AT ORCHESTRATOR IMMUTABLE-BASELINE BOUNDARY.

AUTH-098:
MATERIALLY CLOSED BY CONTROL-FLOW PROOF.

AUTH-099:
RECLASSIFIED / NO EDIT.

AUTH-100:
CLOSED.

AUTH-101:
P1 NAMING DEBT / NO DOWNSTREAM PRODUCTION READS.

AUTH-102:
WATCH / DESIGN REVIEW / NO PATCH.

AUTH-103:
CLOSED.

AUTH-104:
CLOSED + BEHAVIORALLY PROVEN.

AUTH-105:
MATERIALLY CLOSED BY ORIGINAL-vs-REPAIRED PROVENANCE DELTA GATE
PLUS DISTINCT FINAL REGRESSION CLASSIFICATION.
```

Therefore:

```text
STEP 6:
PASS CHECKPOINT.

NEXT:
MANDATORY FINAL ANTI-WHACK-A-MOLE MANUAL COMPLETION GATE.

NO LIVE RETEST.
```

---

# Mandatory final anti-whack-a-mole completion gate — ACTIVE

This is not Step 7.

This is not an audit restart.

This is the mandatory manual end-to-end review of the real current production chain:

```text
accepted truth
-> projection
-> Boss Contract
-> CustomerSurfaceModel
-> repair
-> orchestrator
-> final decision
-> delivery gate
```

Rules:

```text
NO BROAD CODEX INVESTIGATION.
NO LIVE RETEST.
NO BROAD SMOKE WALL.
NO TRUSTING OLD RECEIPTS.
NO REOPENING CLOSED STEPS WITHOUT CONTRARY EVIDENCE.

REAL CURRENT FILE
-> CHATGPT MANUAL INSPECTION
-> HANDOFF INVARIANT
-> PASS / HOLD
-> ONLY THEN NEXT LAYER.
```

---

# Gate 1 — Accepted Truth

## Initial manual inspection found contrary evidence

Real current file inspected:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
```

Initial review found that accepted semantic truth could still be treated as one input to a fresh evidence-scoring process.

The reconciler could:

```text
accepted role exists
+
weaker/newly scored parser/text/filename evidence
->
bestCandidate selected
->
new acceptedSemanticDocRole minted
```

Real current canonical package inspected:

```text
api/_lib/canonical-source-package.js
```

It proved the path was production-reachable:

```text
collectAcceptedSupportDocTruth(...)
->
acceptedTruth
->
reconcileAcquisitionMemoV2SupportDocRole(...)
->
reconciledCanonicalRole
->
canonical package adopts reconciled result
```

Important correction preserved:

```text
The accepted role was not completely ignored.

canonical-source-package.js passes it as:
acceptedTruth.semanticDocRole

The actual defect was:
accepted role was read,
but was not sovereign.
```

## Behavioral reproduction proved the defect

Isolated neutral local call used:

```text
acceptedTruth.semanticDocRole = "purchase_assumptions"
acceptedTruth.debtBasis = "acquisition_financing_assumption"
```

with stronger current-debt-style source evidence.

Observed old behavior:

```text
canonicalRole:
current_debt_context

acceptedSemanticDocRole:
current_debt_context

acceptedDebtBasis:
current_debt_context
```

Conclusion:

```text
accepted purchase_assumptions truth
->
incompatible current_debt_context rewrite
```

The Gate 1 defect was executable.

## One-file repair owner

Exact production owner:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
```

Projection was manually inspected and cleared as downstream owner.

## Accepted-role sovereignty repair

Required invariant:

```text
WHEN acceptedTruth.semanticDocRole contains an accepted role:
that accepted role is sovereign.

The reconciler may inspect evidence for diagnostics,
but must not replace that accepted role with an incompatible scored role.

WHEN no accepted role exists:
retain current evidence-scoring behavior.
```

Initial one-file edit added accepted-role sovereignty.

Manual inspection then caught a new null-dereference regression before proof:

```text
no accepted role
+
no positive evidence
->
bestCandidate = null
->
bestCandidate.role dereference
```

Corrective edit fixed `selectedRole`, but manual inspection caught a second null dereference:

```text
bestCandidate.authorityBasis
```

and a literal debt-basis fallback mismatch.

A second corrective micro fixed both.

## Final manually accepted reconciler behavior

Real current file manually inspected:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
```

Accepted logic:

```text
accepted role exists
-> normalize accepted role
-> selectedRole = sovereign accepted role

accepted role absent
-> selectedRole = bestCandidate?.role || "other_support_context"

no candidate
-> authorityBasis = "no_same_source_positive_evidence"
-> no null dereference
```

Accepted debt-basis compatibility:

```text
compatible acceptedTruth.debtBasis
-> preserve

else compatible selected-candidate basis
-> use

else
-> null
```

Forbidden contradictions closed:

```text
acceptedSemanticDocRole = purchase_assumptions
acceptedDebtBasis = current_debt_context

acceptedSemanticDocRole = current_debt_context
acceptedDebtBasis = acquisition_financing_assumption
```

## Three-case behavioral proof PASS

### CASE 1 — accepted Purchase Assumptions vs stronger Current Debt evidence

Observed:

```text
canonicalRole:
purchase_assumptions

acceptedSemanticDocRole:
purchase_assumptions

acceptedDebtBasis:
acquisition_financing_assumption

acceptedSourceTruth.hasPurchaseAssumptions:
true

acceptedSourceTruth.hasCurrentDebt:
false
```

### CASE 2 — accepted Current Debt vs stronger Purchase Assumptions evidence

Observed:

```text
canonicalRole:
current_debt_context

acceptedSemanticDocRole:
current_debt_context

acceptedDebtBasis:
current_debt_context

acceptedSourceTruth.hasCurrentDebt:
true

acceptedSourceTruth.hasPurchaseAssumptions:
false
```

### CASE 3 — no accepted role + no positive evidence

Observed:

```text
threw:
NO

canonicalRole:
other_support_context

acceptedSemanticDocRole:
other_support_context

authorityBasis:
no_same_source_positive_evidence
```

No files changed during proof.
No live services.
No RETEST.
No commit.

## Gate 1 disposition

```text
HANDOFF 1 — ACCEPTED TRUTH:
PASS.

ACCEPTED ROLE SOVEREIGNTY:
PROVEN.

PURCHASE/CURRENT-DEBT SEPARATION:
PROVEN.

DEBT-BASIS COMPATIBILITY:
PROVEN.

NO-EVIDENCE OTHER-SUPPORT FALLBACK:
PROVEN.
```

---

# Handoff 2 — Projection

Real current file manually inspected:

```text
api/_lib/acquisition-memo-projection.js
```

Projection gives accepted-role authority precedence:

```text
acceptedSemanticDocRole
or acceptedProvenance accepted role
->
projection bucket selection
```

Only when accepted role is absent does it fall back to:

```text
canonicalRole
```

Exact approved alias map remains:

```text
renovation_capex_context
-> structured_renovation_capex_plan

appraisal_valuation_context
-> appraisal_context

environmental_due_diligence_context
-> environmental_context
```

No unauthorized speculative aliases were reintroduced.

Purchase-loan canonicalization remains:

```text
proposed_loan_amount
>
stated_acquisition_loan_amount
>
derived_acquisition_loan_amount
>
loan_amount
```

with empty/null/whitespace rejection and canonical:

```text
proposed_loan_amount
```

The checklist remains alias-blind.

Disposition:

```text
HANDOFF 2 — PROJECTION:
PASS / PROTECT.
```

---

# Exact fresh-chat continuation point

This chat is intentionally being paused because it reached maximum molasses.

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Step 6.
Do not reopen Gate 1 unless new contrary evidence appears.
Do not edit projection.
Do not run live RETEST.

Current exact state:

```text
Steps 1–4:
PASS / protect.

Step 5:
PASS checkpoint.
Last accepted commit checkpoint: fd80bb7.

Step 6:
PASS checkpoint.

Final anti-whack-a-mole completion gate:
ACTIVE.

Handoff 1 — Accepted Truth:
PASS after defect reproduction, one-file sovereignty repair,
manual review, corrective micros, and three-case behavioral proof.

Handoff 2 — Projection:
PASS / protect after manual inspection.

Handoff 3 — Boss Contract:
NEXT.
```

First user action in the fresh chat:

```text
Upload:
api/_lib/acquisition-memo-boss-contract.js
```

First assistant task:

```text
Manually inspect the real current Boss Contract file only for the next handoff invariants.

Do not send Codex first.
Do not run tests first.
Do not run RETEST.
```

Boss handoff invariants to inspect:

```text
1. accepted purchase assumptions truth remains purchase assumptions;
2. accepted current debt truth remains current debt;
3. Boss source-backed booleans derive from accepted truth/provenance;
4. generic parser fields cannot override accepted truth;
5. same physical source cannot become incompatible duplicate authority;
6. projection truth is consumed, not independently reclassified;
7. optional/support absence may collapse, but accepted truth may not be erased;
8. core gate remains T12 / Rent Roll sovereign.
```

Only after direct manual file inspection:

```text
PASS
HOLD
or
BLOCKED
```

Then choose the next layer from evidence.

---

# Permanent doctrine reaffirmed

```text
REAL CURRENT FILES
-> CHATGPT MANUAL INSPECTION
-> ONE HANDOFF INVARIANT
-> TINY CODEX MICRO ONLY IF NEEDED
-> ROB UPLOADS EVERY CHANGED FILE
-> CHATGPT MANUAL PASS / HOLD
-> TARGETED PROOF
```

Never again:

```text
Codex says PASS
-> assume done
-> RETEST
-> discover next hidden contradiction
```

The final completion gate has already proven its value by catching:

```text
accepted truth
-> incompatible reclassification
```

before live testing.

---



## AUTH-specific checkpoint

### Step 6 family

```text
AUTH-092 through AUTH-105:
review complete / Step 6 PASS checkpoint.
```

Key new post-dinner evidence:

```text
AUTH-104:
Dedicated unresolved_provenance_regression classification added and behaviorally proven.

AUTH-098:
No redundant edit; publishable attempted-repair path is proven revalidated.

AUTH-099:
Reclassified; non-empty repairPlan can remain after successful compliant repair.

AUTH-101:
No downstream production reads of finalBossCompliance.ok.

AUTH-102:
Watch/design review only.
```

### New final-completion-gate evidence

Contrary evidence found against the assumed accepted-truth closure:

```text
accepted purchase_assumptions truth
->
stronger current-debt evidence
->
old reconciler output rewrote:
canonicalRole
acceptedSemanticDocRole
acceptedDebtBasis
to current_debt_context
```

Behavioral reproduction:

```text
CONFIRMED.
```

Accepted repair invariant:

```text
acceptedTruth.semanticDocRole present
->
accepted role sovereign

accepted role absent
->
evidence-scored bestCandidate

no accepted role + no positive evidence
->
other_support_context
```

Three-case proof:

```text
PASS.
```

Therefore:

```text
ACCEPTED-TRUTH HANDOFF:
PASS checkpoint after contrary-evidence repair.

PROJECTION HANDOFF:
PASS / protect.

BOSS CONTRACT HANDOFF:
NEXT.
```


---

# Archived Prior Checkpoint Content Below

# July 7, 2026 Dinner-Break Checkpoint — Step 5 Provenance Preservation PASS / Step 6 Final Delivery Gate Defect Proven + First Fix PASS / Commit fd80bb7

### This addendum supersedes the prior “Step 4 QA Gate PASS / Step 5 Unlocked Next” checkpoint as the active handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS / protect.

STEP 3 OVERALL:
PASS / protect.

STEP 4 PRODUCTION CONSTITUTIONAL WORK:
PASS / protect.

STEP 4 QA GATE:
PASS / protect.

STEP 4 REPAIR-INDUCED HTML TRUTH-DESTRUCTION DEFECT:
CLOSED / protect.

STEP 5 REPAIR-ORCHESTRATOR IMMUTABLE-BASELINE PROVENANCE PRESERVATION:
PASS checkpoint.

STEP 6 FINAL DELIVERY GATE INTEGRITY:
ACTIVE.
First confirmed defect fixed and behaviorally proven.
Broader AUTH-092 through AUTH-105 review still remains before Step 6 completion.

LIVE ACQUISITION MEMO RETEST:
LOCKED.
DO NOT RUN YET.
```

## Accepted commit checkpoint

Commit:

```text
fd80bb7
```

Branch:

```text
main
```

Exact committed files:

```text
api/_lib/acquisition-memo-v2-boss-repair.js
api/_lib/acquisition-memo-v2-orchestrator.js
api/_lib/acquisition-memo-v2-final-decision.js
tests/qa/acquisition-memo-v2-boss-repair-provenance-smoke.js
tests/qa/acquisition-memo-v2-orchestrator-initial-repair-provenance-smoke.js
tests/qa/acquisition-memo-v2-orchestrator-later-repair-provenance-smoke.js
```

Commit receipt confirmed:

```text
- no unrelated files committed;
- no live services used;
- no RETEST run.
```

## Step 5 production work accepted

### A. Repair helper no longer launders truth into absence

In:

```text
api/_lib/acquisition-memo-v2-boss-repair.js
```

the old destructive repair behavior had overwritten section fact availability as:

```text
required: [...]
available: []
missing: []
sourceBacked: false
```

The accepted repair now preserves pre-existing:

```text
required
available
missing
sourceBacked
```

while allowing presentation status to become:

```text
collapsed
```

Constitutional invariant:

```text
PRESENTATION MAY COLLAPSE.
PROVENANCE MAY NOT.
```

### B. Orchestrator regression helper added

In:

```text
api/_lib/acquisition-memo-v2-orchestrator.js
```

accepted helper:

```text
buildRepairProvenanceRegressionViolations(...)
```

guards:

```text
sourceBacked
required[]
available[]
missing[]
```

against repair-induced loss.

Array preservation is membership-based, not length-only.

Therefore this is detected:

```text
baseline ["alpha", "beta"]
repaired ["alpha", "gamma"]
```

even though lengths match.

### C. Immutable original baselines enforced

Later retry provenance comparison now uses original pre-repair baselines:

```text
initialCustomerSurfaceModel
acquisitionMemoBossContract
```

against repaired working objects.

Forbidden comparison closed:

```text
already-repaired working state
vs
later repaired state
```

Required comparison:

```text
original pre-repair truth
vs
repaired truth
```

### D. Initial pre-render repair seam guarded

Inside:

```text
if (initialRepairPlan.shouldRetry)
```

the orchestrator now runs the provenance regression helper immediately after both repaired objects are produced.

If any:

```text
REPAIR_PROVENANCE_REGRESSION
```

exists, the orchestrator returns deterministic failed compliance before normal:

```text
renderAndValidate(...)
```

continuation.

Accepted behavior:

```text
initial repair
-> provenance regression
-> compliance false
-> regression code preserved
-> normal render acceptance not entered
-> final delivery blocked
```

### E. Later repaired-retry success gate guarded

The later retry path only accepts successful repaired retry when:

```text
retryFinalization.compliance.ok
&&
provenanceRegressionViolations.length === 0
```

If retry compliance is true but provenance regression exists:

```text
successful retry is not accepted;
final compliance becomes false;
REPAIR_PROVENANCE_REGRESSION is preserved.
```

## Step 5 QA proof accepted

### QA Micro 3A — repair helper provenance smoke

File:

```text
tests/qa/acquisition-memo-v2-boss-repair-provenance-smoke.js
```

Proves a targeted repaired section can become:

```text
status = collapsed
```

while preserving:

```text
sourceBacked = true
required = ["alpha", "beta"]
available = ["alpha"]
missing = ["beta"]
```

Disposition:

```text
PASS.
```

### QA Micro 3B — initial repair seam behavioral fault injection

File:

```text
tests/qa/acquisition-memo-v2-orchestrator-initial-repair-provenance-smoke.js
```

Accepted behavioral proof:

```text
forced initial repair
+
forced REPAIR_PROVENANCE_REGRESSION
->
renderAndValidateCalls = 0
compliance.ok = false
violation code preserved
final delivery status = blocked
```

Disposition:

```text
PASS.
```

### QA Micro 3C — later repair seam

File:

```text
tests/qa/acquisition-memo-v2-orchestrator-later-repair-provenance-smoke.js
```

Important diagnostic history:

Initial version contained two confounders:

```text
coreGate.publishAllowed = false
forced repaired model validation failure
```

ChatGPT manually rejected that PASS because blocked delivery was not attributable specifically to provenance regression.

Both confounders were removed.

The cleaned test then produced:

```text
retryFinalization.compliance.ok = true
final compliance.ok = false
REPAIR_PROVENANCE_REGRESSION present
final delivery status = deliverable
```

This was not a Step 5 failure.

It behaviorally exposed the next locked family:

```text
STEP 6
AUTH-092 through AUTH-105
FINAL DELIVERY GATE INTEGRITY
```

## Step 6 first defect proven

The cleaned later-retry test proved:

```text
provenance regression
-> final compliance false
-> final delivery still deliverable
```

Manual production review identified the exact cause in:

```text
api/_lib/acquisition-memo-v2-final-decision.js
```

The function computed:

```text
complianceOk
```

but `publishable` did not require it.

Therefore:

```text
final compliance false
```

could still coexist with:

```text
final_delivery_status = deliverable
```

This directly confirmed the previously preserved CVF-25K / AUTH-092 through AUTH-105 defect family.

## Step 6 Edit Micro 1 accepted

Changed:

```text
api/_lib/acquisition-memo-v2-final-decision.js
```

Exact accepted change:

```text
complianceOk &&
```

added to the `publishable` predicate.

Current predicate requires:

```text
coreGate?.publishAllowed !== false
&&
complianceOk
&&
modelOk
&&
!coreFatal
&&
!unsafeFinalHtml
```

Manual inspection accepted:

```text
- full final compliance is now required;
- existing core gate condition preserved;
- existing model condition preserved;
- existing core-fatal condition preserved;
- existing unsafe-final-HTML condition preserved;
- helper logic otherwise unchanged.
```

## Behavioral proof after Step 6 Edit Micro 1

The exact cleaned later-retry provenance smoke was rerun without assertion weakening.

Result:

```text
node --check tests/qa/acquisition-memo-v2-orchestrator-later-repair-provenance-smoke.js
PASS

node tests/qa/acquisition-memo-v2-orchestrator-later-repair-provenance-smoke.js
PASS
```

Observed final delivery status:

```text
blocked
```

Therefore the previously illegal chain is now:

```text
successful later retry
+
provenance regression
->
final compliance false
->
final delivery blocked
```

## Current Step 5 disposition

```text
STEP 5 PRODUCTION IMPLEMENTATION:
PASS checkpoint.

STEP 5 TARGETED QA:
PASS.

STEP 5 COMMIT:
PASS via fd80bb7.
```

Step 5 target family:

```text
AUTH-078 through AUTH-091
```

is materially remediated at this checkpoint through:

```text
- repair factAvailability preservation;
- immutable original baselines;
- exact provenance membership regression detection;
- initial repair seam guard;
- later repair seam guard;
- behavioral fault-injection proofs.
```

Do not casually reopen Step 5 unless new contrary evidence appears.

## Current Step 6 disposition

```text
STEP 6:
ACTIVE.

FIRST CONFIRMED DEFECT:
CLOSED.

EXACT CLOSED DEFECT:
publishable did not require complianceOk.

BEHAVIORAL PROOF:
PASS.

BROADER AUTH-092 THROUGH AUTH-105 FAMILY:
NOT YET DECLARED COMPLETE.
```

Do not assume one predicate edit closes every final-delivery integrity question.

Next work after dinner must review the remaining final-gate family in tiny evidence-backed units.

## Mandatory final anti-whack-a-mole gate after Step 6

Rob explicitly requires:

```text
After Step 6 is fully complete,
do not begin another live RETEST immediately.
```

Instead:

```text
1. Upload / inspect the real current production files again.
2. Manually review the full five-step remediation set end to end.
3. Verify no later layer silently undoes an earlier layer.
4. Review the actual authority chain:

accepted truth
-> projection
-> Boss Contract
-> CustomerSurfaceModel
-> repair
-> orchestrator
-> final decision
-> delivery gate

5. Only then decide PASS / HOLD for resuming live testing.
```

This is the permanent anti-whack-a-mole completion gate.

## Permanent execution doctrine strengthened

Continue:

```text
REAL FILES
-> CHATGPT MANUAL INSPECTION
-> TINY CODEX MICRO
-> UPLOAD CHANGED FILES
-> CHATGPT MANUAL PASS/HOLD
```

New explicit refinement:

```text
After ChatGPT manually determines the patch,
split execution into 2–3 tiny Codex prompts when necessary.

One prompt = one literal change or invariant.

Do not bundle adjacent defects merely for convenience.
```

Permanent rules:

```text
- Codex PASS receipts are never trusted by themselves.
- Same-process behavioral proof outranks detached reconstruction.
- Same-length arrays do not prove membership preservation.
- Tests with independent blocking confounders do not prove causation.
- Do not weaken a failing test when it exposes the next predicted root family.
- No live RETEST until Step 6 completion + final manual file review.
```

## Fresh-chat continuation point

Rob is taking a dinner break.

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–4.
Do not reopen Step 5 without contrary evidence.
Do not rerun live testing.

Resume from:

```text
Steps 1–4:
PASS / protect.

Step 5:
PASS checkpoint.
Committed in fd80bb7.

Step 6:
ACTIVE.
First final-delivery defect closed:
publishable now requires complianceOk.

Behavioral proof:
cleaned later-retry provenance smoke PASS.
Observed delivery status: blocked.

Next:
Continue the remaining AUTH-092 through AUTH-105 final-delivery gate integrity review
in tiny evidence-backed micro mode.

After Step 6:
perform final manual anti-whack-a-mole production-file review
before any live RETEST.
```

Recommended first task after dinner:

```text
Review the remaining Step 6 / AUTH-092 through AUTH-105 obligations
against the current final-decision and orchestrator evidence.

Do not send a broad Codex investigation.

Identify the single next literal final-gate invariant not yet proven,
then issue one tiny audit or edit micro only.
```

---

## AUTH status update at fd80bb7

### AUTH-078 through AUTH-091

Current disposition:

```text
PASS checkpoint / materially remediated.
```

Evidence-backed protections now include:

```text
- repair preserves required/available/missing/sourceBacked;
- provenance regression helper exists;
- exact membership loss is detected;
- immutable initialCustomerSurfaceModel baseline used;
- immutable acquisitionMemoBossContract baseline used;
- initial repair seam is blocked on regression;
- later successful retry is rejected on regression;
- REPAIR_PROVENANCE_REGRESSION is stable and behaviorally proven.
```

### AUTH-092 through AUTH-105

Current disposition:

```text
ACTIVE.
```

New behaviorally confirmed evidence:

```text
final compliance false
+
provenance regression present
+
otherwise publishable state
->
old final decision returned deliverable
```

Exact first root cause:

```text
complianceOk computed
but publishable did not require it
```

Accepted fix:

```text
publishable now requires complianceOk
```

Behavioral reproof:

```text
same cleaned later-retry provenance smoke
-> blocked
```

Do not mark AUTH-092 through AUTH-105 complete yet.
Continue remaining final-gate integrity review after dinner.


# July 7, 2026 Final Checkpoint — Step 4 QA Gate PASS / Repair-Induced Truth Destruction Closed / Checkpoint Commit PASS / Step 5 Unlocked Next

### This addendum supersedes the prior “Step 4 checkpoint committed / repair-induced truth destruction HOLD next” handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS.

STEP 3 OVERALL:
PASS.

STEP 4 PRODUCTION CONSTITUTIONAL WORK:
PASS / protect.

STEP 4 QA GATE:
PASS.

STEP 4 REPAIR-INDUCED TRUTH-DESTRUCTION DEFECT:
CLOSED.

STEP 4 FINAL CHECKPOINT COMMIT:
PASS.

STEP 5:
UNLOCKED NEXT.
NOT YET EXECUTED.
TARGET AUTH-078 THROUGH AUTH-091.
```

## Final Step 4 defect closure

The prior active HOLD was the Boss repair/enforcement path:

```text
clean compliant baseHtml
-> inject renovation-only collapseable surface
-> pre-enforcement fatal_core = []
-> repair rewrites HTML
-> unrelated source-backed Unit Mix and Proposed Financing evidence disappears
-> post-repair validation emits:
   UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS
   PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED
-> both route fatal_core
-> renovationEnforcement.ok = false
```

The exact production operation was isolated through 3–10 micro-micro prompts:

```text
enforceAcquisitionMemoBossContractOnHtml(...)
-> collapseAcquisitionMemoBossViolationsHtml(...)
-> collapseSectionByTitle(...)
```

The targeted collapse title was:

```text
Key Upside Drivers
```

but the old section regex began its match at:

```text
Executive Summary
```

and one replacement region swallowed:

```text
Executive Summary
Key Metrics Snapshot
Key Upside Drivers
```

The removed region also contained text globally required by post-render integrity validators, including:

```text
Unit Mix validator:
!/(1BR|2BR)/i.test(htmlString)

Proposed Financing validator:
!new RegExp(escapeRegExp(label), "i").test(htmlString)
```

Therefore the previously observed post-repair fatal pair was proven to be repair-induced collateral truth destruction.

## Production fix accepted

Changed production file:

```text
api/_lib/acquisition-memo-boss-contract.js
```

Old overbroad boundary removed:

```text
/<section\b[^>]*>[\s\S]*?<span[^>]*class="section-header-title"[^>]*>\s*${escapeRegExp(title)}\s*<\/span>[\s\S]*?<\/section>/i
```

New section-local behavior:

```text
1. locate exact section-header-title match;
2. find nearest prior <section;
3. scan <section> / </section> tags with depth tracking;
4. resolve the matching closing section boundary;
5. replace only that section-local region.
```

Final containment guard accepted after manual inspection:

```text
if (sectionEnd < 0 || !(sectionStart < titleMatch.index && titleMatch.index < sectionEnd)) return source;
```

Required invariant now enforced:

```text
sectionStart < titleMatch.index < sectionEnd
```

If the title is not inside the selected section boundary:

```text
return original source unchanged
```

## Manual changed-file inspection

ChatGPT manually inspected the actual changed production file after Codex's receipt.

Accepted result:

```text
OLD CROSS-SECTION REGEX:
REMOVED.

SECTION-LOCAL MATCHING:
PASS.

EXPLICIT TITLE CONTAINMENT GUARD:
PASS.

ROUTING TAXONOMY:
UNCHANGED.

SOURCE-BACKED INTEGRITY FENCE:
PRESERVED.

CUSTOMER SURFACE MODEL:
UNTOUCHED BY FINAL PATCH.

ORCHESTRATOR / FINAL DECISION:
UNTOUCHED BY FINAL PATCH.
```

## Stale debt QA assertion classification

After the section-boundary fix, the targeted Boss smoke advanced to a different assertion involving:

```text
Current Debt Maturity Not available
Maturity Date Not available
```

A same-call truth bundle proved:

```text
VALIDATION_OK=true
INITIAL_FATAL=NONE
INITIAL_COLLAPSE=NONE
EARLY_RETURN=true
COLLAPSE_HELPER_CALLED=false
REPAIRED_EQUALS_INPUT=true
BAD_SUBSTRING_PRESENT=true
```

The decisive provenance fact was:

```text
bossContract.sections.currentDebtContext.factAvailability.sourceBacked === false
```

Therefore the old expectation that enforcement must scrub that placeholder was stale/overbroad for a non-source-backed debt fixture.

Accepted QA-only refresh:

```text
Old:
assert.equal(
  /Current Debt Maturity Not available|Maturity Date Not available/i.test(debtEnforcement.repairedHtml),
  false
);

New:
assert.equal(
  /Current Debt Maturity Not available|Maturity Date Not available/i.test(debtEnforcement.repairedHtml),
  true
);
```

Changed QA file:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

ChatGPT manually inspected the actual changed QA file.

Accepted conclusion:

```text
- non-source-backed ambiguous debt remains nonfatal;
- source-backed current-debt integrity was not weakened;
- Boss routing was not weakened;
- production was not changed to satisfy stale QA.
```

## Targeted verification

Passed:

```text
node --check api/_lib/acquisition-memo-boss-contract.js

node tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

Targeted smoke result:

```text
acquisition-memo-v2 boss-violation-routing smoke PASS
```

The renovation path still requires:

```text
renovationEnforcement.ok === true
```

and still requires unsupported renovation language to be absent after repair.

## Step 4 final disposition

```text
STEP 4 QA GATE:
PASS.

REPAIR-INDUCED TRUTH-DESTRUCTION DEFECT:
CLOSED.

CURRENT DEFECT UNIT:
PASS.

CHECKPOINT COMMIT:
PASS.
```

Exact committed files for this final Step 4 closure checkpoint:

```text
api/_lib/acquisition-memo-boss-contract.js
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

No temporary instrumentation is part of the accepted state.

## Permanent diagnostic doctrine preserved

The investigation repeatedly proved that detached probes can contradict the real path.

Permanent rule:

```text
SAME PROCESS
+
SAME OBJECT
+
SAME TEST PATH
>
DETACHED RECONSTRUCTION
```

When probe answers conflict, require one same-call truth bundle before editing production.

## Step 5 now unlocked

Formal next root family:

```text
STEP 5
Repair/orchestrator immutable-baseline provenance preservation
```

Target:

```text
AUTH-078 through AUTH-091
```

Do not treat the closed Step 4 regex seam as Step 5 completion.

Step 5 must now address the broader constitutional family already preserved in the AUTH ledger:

```text
- repair must not erase accepted source-backed truth;
- original pre-repair truth baseline must remain available;
- repaired CustomerSurfaceModel / Boss state must not become the only truth;
- orchestrator must preserve provenance across repair;
- pre/post truth regression must be detectable;
- source-backed provenance cannot be downgraded merely to make repaired state self-consistent.
```

## Step 5 execution method

Use the permanent micro-micro doctrine:

```text
3–10 MICRO-MICRO PROMPTS MAXIMUM PER UNIT OF WORK
```

Preferred accelerated pattern for Step 5:

```text
MICRO 1 -> literal repair owner fact
MICRO 2 -> immutable-baseline boundary fact
MICRO 3 -> exact mutation / handoff fact
MICRO 4 -> smallest safe edit
MICRO 5 -> Rob uploads every changed file
MICRO 6 -> ChatGPT manually inspects actual file(s)
MICRO 7 -> targeted verification
MICRO 8 -> focused same-path / integration proof if needed
MICRO 9 -> PASS / HOLD / BLOCKED
MICRO 10 -> commit only if explicitly authorized
```

Speed rule:

```text
Do not spend 8–10 micros by default.
Use the minimum number needed to establish the literal edit boundary.
The long Step 4 chain was exceptional because contradictory probe evidence had to be resolved.
```

## Fresh-chat continuation point

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–4.
Do not repeat the Step 4 regex/debt diagnostic chain.
Do not run a live RETEST yet.

Start here:

```text
Steps 1–4:
PASS / protect.

Step 4 QA gate:
PASS.

Repair-induced truth destruction seam:
CLOSED.

Final Step 4 checkpoint commit:
PASS.

Step 5:
UNLOCKED NEXT.

Target:
AUTH-078 through AUTH-091.
```

First task in the fresh chat:

```text
Begin formal Step 5 in usage-preserving micro-micro mode.

Treat AUTH-078 through AUTH-091 as one root-family unit:
repair/orchestrator immutable-baseline provenance preservation.

Do not send a broad Codex investigation.
Do not ask Codex to rediscover architecture.
Use the preserved AUTH evidence map.
Aim for roughly 3–5 audit micros before one tiny edit prompt unless literal evidence requires more.
```

## Live-proof doctrine remains mandatory

Even after Step 5 eventually passes:

```text
smoke PASS
!=
live pipeline PASS
```

Final acceptance later remains:

```text
targeted smokes
-> manual changed-file inspection
-> focused integration/proof wall
-> coherent remaining AUTH family completion
-> one controlled live Acquisition Memo RETEST
-> inspect actual customer-facing PDF/report truth
```

Do not run the live RETEST yet.

---

## AUTH ledger status update

The closed Step 4 defect materially strengthens the evidence around:

```text
AUTH-078 through AUTH-091
```

but does not close that family.

What is now proven and closed:

```text
A concrete HTML repair operation could destroy unrelated validator-visible truth because section matching crossed sibling boundaries.
That concrete operation has been fixed and manually verified.
```

What remains for formal Step 5:

```text
the broader repair/orchestrator immutable-baseline provenance family:
original truth preservation,
repair mutation boundaries,
pre/post truth delta,
and prevention of provenance laundering across repaired model/Boss state.
```

Therefore:

```text
AUTH-078 through AUTH-091:
ACTIVE NEXT / FORMAL STEP 5.

AUTH-092 through AUTH-105:
LOCKED UNTIL STEP 5 FAMILY IS REVIEWED.
```

---

# InvestorIQ Semantic Authority Evidence Ledger

## July 7, 2026 Late-Night Checkpoint — Step 4 Checkpoint Committed / QA Investigation Proved Repair-Induced Truth Destruction / Step 5 Still Locked

### This addendum supersedes the prior “Step 4 PASS / stale QA refresh next” handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS.

STEP 3 OVERALL:
PASS.

STEP 4 PRODUCTION CONSTITUTIONAL WORK:
PASS / protect.

STEP 4 CHECKPOINT COMMIT:
PASS / committed.

STEP 4 QA GATE:
HOLD.

STEP 5:
NOT STARTED AS FORMAL EXECUTION.
LOCKED UNTIL THE CURRENT BOSS REPAIR/ENFORCEMENT DEFECT IS RESOLVED AND REVIEWED.
```

### Committed checkpoint

Accepted commit:

```text
bc2eaf3
Step 4 provenance integrity checkpoint
```

Exact committed files reported and accepted:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js

!!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_UPDATED_JULY7_STEPS1_4_STEP4_PASS_STALE_QA_REFRESH_NEXT.md
!!!INVESTORIQ_MASTER_CONTEXT_CURRENT_DOCTRINE_COMPLETION_CHECKLIST_UPDATED_JULY7_STEPS1_4_STEP4_PASS_STALE_QA_REFRESH_NEXT.md
!!!INVESTORIQ_SEMANTIC_AUTHORITY_EVIDENCE_LEDGER_UPDATED_JULY7_STEPS1_4_STEP4_PASS_STALE_QA_REFRESH_NEXT.md

plus the prior Step 3 checkpoint ledgers moved into:
Very Old and Archived MD Files/
```

Commit receipt confirmed:

```text
- no temporary instrumentation included;
- no unauthorized files included;
- no production fix for the remaining Boss smoke HOLD was smuggled into the commit.
```

### Permanent Codex process doctrine tightened again

Rob explicitly directed that the remainder of Step 4 and all Step 5 work must be executed in:

```text
3–10 MICRO-MICRO PROMPTS PER UNIT OF WORK
```

Controlling pattern:

```text
MICRO 1 -> establish one literal fact
MICRO 2 -> establish adjacent fact
MICRO 3 -> prove exact boundary
MICRO 4 -> authorize one tiny edit
MICRO 5 -> upload actual changed file
MICRO 6 -> ChatGPT manually inspects actual file
MICRO 7 -> targeted verification
MICRO 8 -> focused integration/path proof if needed
MICRO 9 -> only then PASS / HOLD / BLOCKED
MICRO 10 -> commit checkpoint only if explicitly authorized
```

Hard rules:

```text
- one prompt = one question or one tiny edit;
- no broad causal narratives from Codex;
- no “investigate everything” prompts;
- no Codex PASS accepted at face value;
- after any real change, Rob uploads the actual changed file;
- ChatGPT inspects the file itself before PASS;
- smoke PASS alone is never launch proof;
- live pipeline proof remains required later;
- no Step 5 expansion until the current seam is closed.
```

### QA refresh result before the remaining HOLD

CustomerSurfaceModel stale expectations were refreshed and manually inspected.

Proven accepted expectations now include:

```text
partial current debt:
factAvailability.sourceBacked === true

partial Purchase Assumptions:
acquisitionRequestContext.status === "required"

partial Purchase Assumptions:
proposedFinancingContext.status === "required"
```

Targeted result:

```text
CustomerSurfaceModel smoke:
PASS
```

The actual changed test file was manually inspected before acceptance.

### Boss smoke remaining HOLD — exact stable failure

Repeated current-state runs proved:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js

stable first failure:
renovationEnforcement.ok

actual:
false

expected:
true
```

Two separate runs reproduced the same failure.

Temporary same-process instrumentation was used only for diagnosis, then fully reverted. Uploaded files were manually inspected to confirm no instrumentation remained.

### Critical diagnostic lesson

Detached/reconstructed probes repeatedly produced contradictory results and are no longer accepted as authoritative for this seam.

The decisive doctrine is:

```text
SAME PROCESS
+
SAME OBJECT
+
SAME TEST PATH
>
DETACHED RECONSTRUCTION
```

The actual return shape of:

```text
enforceAcquisitionMemoBossContractOnHtml(...)
```

was proven to be:

```text
ok: boolean
violations: array
routing: object
repairedHtml: string
```

Important correction:

```text
renovationEnforcement.routing
```

is the real returned routing object.

Do not probe nonexistent:

```text
renovationEnforcement.postRouting
```

### Evidence-complete current root chain

The following chain was proven with same-process before/after evidence.

#### Clean baseline

```text
validateAcquisitionMemoRenderAgainstBossContract(
  bossContract,
  baseHtml
).violations
=
[]
```

The test also independently asserts the clean baseline is Boss compliant.

#### Renovation-only injection

The smoke injects only:

```text
Renovation ROI
payback
NOI impact
value impact
refi impact
implementation modeling
```

into the Key Upside Drivers area.

Raw validation after injection:

```text
["NO_FORBIDDEN_SURFACES"]
```

Same-process pre-enforcement routing:

```text
fatal_core
=
[]

collapseable_surface
=
[
  "NO_FORBIDDEN_SURFACES",
  "UNSUPPORTED_RENOVATION_MODELING_SURFACE"
]
```

Therefore the injected condition is pre-enforcement collapseable-only and nonfatal.

#### Enforcement/repair result

Same-process enforcement result:

```text
renovationEnforcement.ok
=
false
```

Then the repaired HTML itself was revalidated.

Raw validation of:

```text
renovationEnforcement.repairedHtml
```

returned:

```text
[
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"
]
```

Returned enforcement routing then contained:

```text
fatal_core
=
[
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"
]

collapseable_surface
=
[]
```

Therefore the evidence-complete chain is:

```text
clean compliant baseHtml
-> inject one renovation-only collapseable forbidden surface
-> raw validation detects only NO_FORBIDDEN_SURFACES
-> pre-enforcement routing remains nonfatal and collapseable
-> enforcement/repair rewrites HTML
-> repaired HTML loses or makes unrecognizable unrelated source-backed Unit Mix and Proposed Financing evidence
-> post-repair validation emits two source-backed integrity violations
-> those violations route fatal_core
-> enforcement.ok becomes false
```

### AUTH mapping update

The newly proven runtime chain materially strengthens:

```text
AUTH-078 through AUTH-091
```

and specifically confirms that repair/enforcement can transform a nonfatal collapseable-only HTML state into repaired HTML that fails unrelated source-backed integrity checks.

### Current classification

```text
REPAIR-INDUCED TRUTH DESTRUCTION
+
POST-REPAIR SOURCE-BACKED INTEGRITY FAILURE
+
IMMUTABLE-BASELINE / PROVENANCE-PRESERVATION DEFECT
```

This is strongly aligned with the already-preserved Step 5 / AUTH-078 through AUTH-091 family.

However:

```text
Do not casually relabel this as “Step 5 PASS work started.”
Formal Step 5 execution remains locked until the current Step 4 QA gate is closed and the exact repair seam is patched/reviewed.
```

### Important correction to the prior stale-QA interpretation

The earlier ledger said the Boss routing smoke was merely stale at the known assertion.

That is no longer sufficient.

Current evidence proves:

```text
- the CustomerSurfaceModel stale expectations were real and refreshed;
- the remaining Boss smoke failure is a genuine production-path repair/enforcement defect;
- do not change the line expecting renovationEnforcement.ok === true merely to make the smoke green;
- do not bless the post-repair fatal pair as expected behavior.
```

### Current exact continuation point for the fresh chat

Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–3.
Do not re-run the long diagnostic chain.

Start from this exact proven seam:

```text
Clean baseHtml raw validation:
[]

Renovation-injected raw validation:
["NO_FORBIDDEN_SURFACES"]

Pre-enforcement routing:
fatal_core = []
collapseable_surface =
[
  "NO_FORBIDDEN_SURFACES",
  "UNSUPPORTED_RENOVATION_MODELING_SURFACE"
]

Post-repair raw validation:
[
  "UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS",
  "PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED"
]

Post-repair routing:
fatal_core =
same two codes

renovationEnforcement.ok:
false
```

First task in the fresh chat:

```text
Use 3–10 micro-micro prompts maximum to identify the exact repair function/operation that removes or invalidates the unrelated Unit Mix and Proposed Financing evidence.

Then authorize the smallest safe patch.

After any patch:
- Rob uploads every changed file;
- ChatGPT manually inspects the actual files;
- run targeted smoke(s);
- run focused integration/path proof;
- do not treat smoke PASS alone as launch proof.
```

Recommended first micro-question:

```text
AUDIT ONLY. NO EDITS.

Using the exact current failing Boss smoke path, return only:

the exact production function called inside
enforceAcquisitionMemoBossContractOnHtml(...)
that transforms the pre-enforcement HTML into
renovationEnforcement.repairedHtml.

No explanation.
No fixes.
No file changes.
No commit.
```

### Live-proof doctrine remains mandatory

Even after this repair is locally green:

```text
smoke PASS
!=
live pipeline PASS
```

Final acceptance later remains:

```text
targeted smokes
-> manual changed-file inspection
-> focused integration/proof wall
-> coherent Steps 4–7 completion
-> one controlled live Acquisition Memo RETEST
-> inspect actual customer-facing PDF/report truth
```

Do not run the live RETEST yet.

---

# July 7, 2026 Night Execution Addendum — Steps 1–4 PASS / Step 4 Production Completion Gate Verified / Stale QA Refresh Next

## Controlling checkpoint

This addendum supersedes the prior Step 3 Completion Gate checkpoint as the active execution handoff.

Current verified state:

```text
STEP 1:
PASS / protect.

STEP 2:
PASS / protect.

STEP 3A:
PASS / protect.

STEP 3B:
PASS.

STEP 3 OVERALL:
PASS.

STEP 4:
PASS.

STEP 5:
DO NOT BEGIN YET.
```

The operating method remains mandatory:

```text
AUTH evidence
-> surgical Codex prompt
-> Codex receipt
-> manual inspection of actual changed production files
-> PASS / HOLD / BLOCKED
-> next micro only after literal invariant proof
```

Never accept a Codex PASS receipt at face value.

## Step 4 target

Step 4 implemented Micro Family 3 constitutional protections:

```text
PROVENANCE != COMPLETENESS
```

and:

```text
SOURCE-BACKED TRUTH
CANNOT BE LAUNDERED INTO
ORDINARY COLLAPSEABLE ABSENCE
```

Target AUTH family:

```text
AUTH-049
AUTH-050
AUTH-051
AUTH-052
AUTH-055
AUTH-056
AUTH-059
AUTH-060
AUTH-061
AUTH-062
AUTH-063
AUTH-064
AUTH-065
AUTH-066
AUTH-067
AUTH-069
```

## Step 4 initial Codex result

Initial Step 4 receipt returned HOLD after production changes in:

```text
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Directionally correct improvements included:

```text
- financing/current-debt sourceBacked moved toward accepted provenance rather than completeness;
- Unit Mix provenance tied to core Rent Roll existence;
- mapped source-backed integrity violations fenced from ordinary collapseable_surface routing;
- non-source-backed legitimate collapse remained possible;
- missing[] remained visible.
```

Manual production-file inspection rejected closure because three contradictions remained.

### Step 4 blocker A — Boss normalization dropped accepted truth later read by sourceBacked

Boss later read:

```text
acceptedPurchaseAssumptionsTruth
acceptedCurrentDebtTruth
```

but normalized Boss support-doc records did not preserve those booleans.

Effect:

```text
accepted provenance exists
-> normalization drops accepted-truth boolean
-> later sourceBacked read can become false
```

### Step 4 blocker B — CustomerSurfaceModel validator still conflated provenance with completeness

The validator still contained the old fatal rule equivalent to:

```text
sourceBacked true
+
missing[] non-empty
->
fatal_core
```

including the stale message:

```text
cannot be source-backed with missing facts
```

This directly contradicted Step 4.

### Step 4 blocker C — CustomerSurfaceModel accepted authority fell back to generic parser fields

Accepted-role variables could still fall back to generic:

```text
semantic_doc_role
debt_basis
```

allowing parser/generic semantics to establish accepted purchase/current-debt truth.

This threatened the frozen Step 2 sovereignty fence.

Disposition:

```text
STEP 4 INITIAL RECEIPT:
HOLD
```

## Step 4 Completion Gate

A tightly scoped completion prompt allowed changes only in:

```text
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Tests remained read-only.

Required exact fixes:

```text
1. Preserve accepted purchase/current-debt truth through Boss normalization.

2. Make sourceBacked true + missing[] legal.

3. Remove generic semantic_doc_role / debt_basis fallback from accepted authority.

4. Preserve the good contextual source-backed routing fence.

5. Preserve Steps 1–3 exactly.

6. Do not begin Step 5.
```

## Manual inspection result — Step 4 PASS

ChatGPT manually inspected the actual changed production files after the Codex receipt.

### PASS A — Boss accepted truth survives normalization

`normalizeSupportDocRecord(...)` now preserves:

```text
acceptedSourceTruth
acceptedProvenance
acceptedPurchaseAssumptionsTruth
acceptedCurrentDebtTruth
```

The two accepted-truth booleans are derived from accepted fields / accepted provenance / accepted source-truth signals, not generic parser role or generic debt-basis fields.

Therefore:

```text
accepted purchase provenance
+
partial purchase facts
->
purchaseAssumptionsSourceBacked can remain true
```

and:

```text
accepted current-debt provenance
+
partial debt facts
->
currentDebtSourceBacked can remain true
```

### PASS B — sourceBacked true + missing[] is legal

The stale CustomerSurfaceModel fatal path was removed.

The production model no longer contains:

```text
SECTION_MISSING_FACTS_WITHOUT_COLLAPSE
```

or the old message:

```text
cannot be source-backed with missing facts
```

Therefore this is now legal:

```text
sourceBacked: true
available: [A]
missing: [B]
```

`missing[]` remains visible and is not cleared.

### PASS C — generic parser semantics no longer establish accepted authority

CustomerSurfaceModel accepted role now reads accepted-role fields only:

```text
acceptedSemanticDocRole
accepted_semantic_doc_role
payload.acceptedSemanticDocRole
payload.accepted_semantic_doc_role
```

Accepted debt basis now reads accepted-basis fields only:

```text
acceptedDebtBasis
accepted_debt_basis
payload.acceptedDebtBasis
payload.accepted_debt_basis
```

Generic parser fields:

```text
semantic_doc_role
debt_basis
payload.semantic_doc_role
payload.debt_basis
```

do not establish accepted purchase/current-debt truth in the touched accepted-authority path.

Note:

```text
generic semantic_doc_role may still exist in canonicalRole descriptive fallback;
that is not the acceptedSemanticDocRole authority variable and does not by itself set accepted truth.
```

### PASS D — contextual source-backed routing fence remains intact

Boss preserves the mapping for:

```text
UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT
UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS
CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED
PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED
ACQUISITION_REQUEST_FACTS_REQUIRED_WHEN_SOURCE_BACKED
```

Required contextual behavior remains:

```text
sourceBacked true
->
non-collapseable source-backed integrity failure
```

and:

```text
sourceBacked false
->
ordinary collapse may remain possible where otherwise legal
```

No fourth routing taxonomy was added.

## Step 4 stale QA status

Two existing QA smokes remain red because they encode the old contract.

Known stale expectations:

```text
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js:786

Old expectation:
partial current-debt fixture
-> factAvailability.sourceBacked === false

Correct Step 4 production contract:
accepted provenance survives partial completeness
-> sourceBacked === true
```

and:

```text
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js:214

Old expectation:
source-backed current-debt integrity violation
-> collapseable_surface

Correct Step 4 production contract:
source-backed integrity failure
-> must not enter ordinary collapseable_surface
```

These tests were intentionally not edited during the production completion gate.

Current interpretation:

```text
PRODUCTION STEP 4:
PASS.

QA EXPECTATIONS:
STALE / REFRESH NEXT.

Do not treat the two stale assertions as production regressions.
Do not begin Step 5 until the stale QA expectations are refreshed and manually reviewed.
```

## Protected frozen contracts

Continue protecting:

```text
STEP 1:
accepted source identity;
accepted role/provenance;
Boss physical-source dedupe;
purchase assumptions cannot become current debt.

STEP 2:
accepted role sovereignty;
accepted provenance role reads accepted fields only;
exact approved projection role mappings.

STEP 3:
exact four-key acquisition-loan family;
exact precedence;
strict null/empty/whitespace handling;
canonical proposed_loan_amount;
no current-debt contamination;
exactly three approved Step 3A mappings.
```

## Tomorrow morning first task

Do not begin Step 5 immediately.

First:

```text
Refresh only the two stale Step 4 QA expectations.
```

Exact candidate tests:

```text
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js
tests/qa/acquisition-memo-v2-boss-violation-routing-smoke.js
```

Required doctrine:

```text
- test-only changes;
- production files read-only;
- update only expectations proven stale by Step 4;
- no new production semantics;
- no fixture-specific hardcoding;
- no broad smoke wall;
- no live services;
- no RETEST;
- no commit unless explicitly requested;
- compact receipt;
- manual inspection before PASS.
```

After stale QA refresh passes and is manually accepted:

```text
STEP 5 NEXT:
Repair/orchestrator immutable-baseline provenance preservation.
```

Step 5 target remains:

```text
AUTH-078 through AUTH-091
```

Do not yet touch final delivery gate integrity; that remains later.

## Stop conditions tonight

Rob is stopping due to fatigue.

Do not run:

```text
Step 5;
repair/orchestrator changes;
final-decision changes;
live Acquisition Memo RETEST;
DocRaptor;
Supabase writes;
paid/API loops;
broad smoke wall;
Screening changes;
production commit without explicit request.
```

## Fresh-chat handoff

Rob will upload:

```text
1. Updated MASTER
2. Updated CVF
3. Updated AUTH evidence ledger
```

Fresh chat instruction:

```text
Do not restart the audit.
Do not rediscover AUTH-001 through AUTH-105.
Do not reopen Steps 1–4.

Current verified checkpoint:
Steps 1–4 PASS.

First task:
Write the smallest safe Codex prompt to refresh only the two stale Step 4 QA expectations.

Production files are read-only.
No Step 5 yet.

After Codex replies:
review receipt,
inspect actual changed test files,
return PASS / HOLD / BLOCKED.

Only after stale QA refresh is accepted may Step 5 begin.
```

---

---

# July 7, 2026 Execution Addendum — Surgical Codex Remediation Steps 1–3 / Step 3 Completion Gate Active

## Controlling workflow update

The AUTH-001 through AUTH-105 evidence audit is no longer merely awaiting prompt design.

Execution has begun under a new mandatory doctrine:

```text
CODEX SURGICAL LEASH MODE
```

Reason:

```text
Codex produced materially useful changes but declared PASS while an explicitly forbidden downstream authority path still existed.
Therefore:
Codex receipts are never accepted at face value.
ChatGPT manually inspects the actual changed production files after each receipt.
PASS requires literal production-code proof of the requested invariant.
```

Mandatory Codex controls now in force:

```text
- exact allowed production files;
- all other files read-only;
- exact target invariant;
- explicit frozen symbols/contracts;
- no substitute fixes;
- no compatibility shims;
- no speculative aliases;
- no opportunistic cleanup;
- no future-proofing;
- no new abstractions unless explicitly authorized;
- test files read-only unless explicitly allowed;
- stop on surprise;
- minimum diff;
- targeted checks only;
- no broad smoke wall;
- no live services;
- no DocRaptor;
- no Supabase writes;
- no paid/API loops;
- no commit unless explicitly requested;
- PASS only when literal code proof confirms the forbidden path is gone.
```

Compact receipt doctrine:

```text
1. Verdict PASS / HOLD / BLOCKED
2. Files changed
3. Exact invariant changed
4. Exact old path removed/fenced
5. Targeted checks/results
6. Unexpected condition
7. Confirm no out-of-scope changes / no live services / no commit
```


## Step 1 — Immutable accepted role/provenance foundation

### Initial Step 1 result

Codex changed:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
api/_lib/canonical-source-package.js
api/_lib/acquisition-memo-boss-contract.js
```

Material improvements manually confirmed:

```text
- acceptedSourceIdentityKey emitted;
- acceptedProvenance emitted;
- accepted role/basis preserved;
- canonical package preserves accepted fields;
- Boss dedupe prefers accepted physical-source identity;
- raw parser role fallback reduced;
- parser debt basis no longer accepted without same-source evidence in key fallback.
```

However ChatGPT manually inspected the real Boss file and rejected Codex PASS.

Exact remaining blocker:

```text
promoteCurrentDebtSupportDoc(
  findSupportDocByRole(supportDocs, "purchase_assumptions")
)

promoteCurrentDebtSupportDoc(
  acquisitionMemoProjection?.supportDocProjection?.purchaseAssumptions
)
```

Interpretation:

```text
purchase_assumptions
-> downstream Boss promotion
-> current_debt_context
```

Disposition:

```text
STEP 1 INITIAL RECEIPT: HOLD
AUTH-043 remained executable.
```

### Step 1 Completion Gate

A tighter one-file completion prompt allowed changes only in:

```text
api/_lib/acquisition-memo-boss-contract.js
```

Required:

```text
1. caller fence:
   accepted purchase assumptions must not enter current-debt promotion;

2. callee fence:
   promoteCurrentDebtSupportDoc(...) must reject incompatible accepted purchase provenance.
```

Manually confirmed actual code result:

```text
- purchase-assumptions promotion callers removed;
- only currentDebtContext promotion caller remains;
- defensive accepted purchase-role / acquisition-financing-basis rejection added;
- legitimate current-debt path preserved.
```

Final disposition:

```text
STEP 1: PASS
```

Current invariant materially established:

```text
physical source identity
-> reconciled accepted role
-> accepted provenance
-> canonical preservation
-> Boss preservation
-> physical-source dedupe
-> accepted purchase assumptions cannot be promoted to current debt
```

## Step 2 — Downstream role reclassification fences + tiny authority cleanup

Allowed production files:

```text
api/_lib/acquisition-memo-projection.js
api/_lib/acquisition-memo-boss-contract.js
```

### Initial Step 2 result

Codex reported PASS, but manual inspection found two blockers.

#### Blocker A — accepted-role taxonomy mismatch still caused downgrade

Projection preferred accepted role, but bucket vocabulary still differed:

```text
accepted renovation_capex_context
vs projection structured_renovation_capex_plan

accepted appraisal_valuation_context
vs projection appraisal_context

accepted environmental_due_diligence_context
vs projection environmental_context
```

Effect:

```text
valid accepted role
-> projection no-match
-> otherSupportDocs
```

#### Blocker B — Step 2A accepted provenance cleanup incomplete

Boss still derived:

```text
acceptedProvenanceRole
```

from broader fields:

```text
acceptedProvenance.canonicalRole
acceptedProvenance.role
```

Disposition:

```text
STEP 2 INITIAL RECEIPT: HOLD
```

### Step 2 Completion Gate

Manual inspection confirmed:

```text
- projection now recognizes the three established accepted-role mismatches;
- valid accepted roles no longer downgrade merely due legacy bucket names;
- acceptedProvenanceRole now reads accepted provenance role fields only;
- purchase_assumptions -> current_debt_context fence remains closed;
- Boss normalizer prefers accepted role;
- physical identity dedupe remains acceptedSourceIdentityKey-first.
```

Final disposition:

```text
STEP 2: PASS
```

### Important Step 2 WATCH

Codex added extra projection aliases beyond the three requested mappings, including examples such as:

```text
phase_i
phase_i_esa
mortgage_statement
current_debt
proposed_acquisition_financing
market_survey
```

Although Step 2 still passed because the known invariants were preserved, this was classified as unauthorized scope expansion.

New doctrine:

```text
Codex does not invent product authority.
We specify authority.
Codex executes authority.
Codex does not expand authority.
```

## Step 3 — Projection alias pruning + one canonical acquisition-loan fact family

Allowed production files:

```text
api/_lib/acquisition-memo-projection.js
api/_lib/acquisition-memo-boss-contract.js
```

### Step 3A — Unauthorized projection alias pruning

Actual code manually confirmed:

```text
Only three evidence-backed mappings remain:

renovation_capex_context
-> structured_renovation_capex_plan

appraisal_valuation_context
-> appraisal_context

environmental_due_diligence_context
-> environmental_context
```

Unauthorized speculative aliases were removed.

Disposition:

```text
STEP 3A: PASS
```

### Step 3B — Canonical acquisition-loan amount schema

Exact allowed input key family:

```text
proposed_loan_amount
stated_acquisition_loan_amount
derived_acquisition_loan_amount
loan_amount
```

Canonical downstream key:

```text
proposed_loan_amount
```

Required precedence:

```text
proposed_loan_amount
>
stated_acquisition_loan_amount
>
derived_acquisition_loan_amount
>
loan_amount
```

Codex added:

```text
normalizePurchaseAssumptionLoanAmountFacts(...)
```

and removed the synthetic write back to:

```text
loan_amount
```

inside purchase evidence supplementation.

However manual inspection rejected the PASS receipt.

#### Step 3 blocker 1 — empty/null coercion to zero

Current implementation used:

```text
Number(candidate)
Number.isFinite(...)
```

which means:

```text
Number(null) === 0
Number("") === 0
Number("   ") === 0
```

Forbidden example:

```text
proposed_loan_amount = null
stated_acquisition_loan_amount = 8500000

current implementation can resolve:
proposed_loan_amount = 0
```

This violates exact non-empty precedence and can suppress real higher-quality evidence.

#### Step 3 blocker 2 — projection checklist still sees false missing

Projection still reads only:

```text
purchaseAssumptions.extractedFacts.proposed_loan_amount
```

while alias normalization occurs later inside Boss construction.

Therefore:

```text
same accepted source
-> Projection checklist: missing
-> Boss purchase facts: available
```

This preserves cross-stage semantic inconsistency.

Disposition:

```text
STEP 3B: HOLD
STEP 3 OVERALL: HOLD
```

## Current active Codex task at handoff

A Step 3 Completion Gate prompt has been issued.

Exact required fixes:

```text
1. In Boss:
   null / undefined / empty string / whitespace-only string must be absent,
   never numeric zero.

2. In projection:
   cloned accepted purchase-assumption entry must expose
   extractedFacts.proposed_loan_amount
   before buildChecklist(...) consumes it.

3. Exact four-key family only.

4. Exact precedence only.

5. Preserve original fact keys.

6. Do not mutate upstream canonical source record.

7. Do not apply purchase-loan normalization to current debt.

8. Freeze Step 3A alias map at exactly the three approved mappings.

9. No new aliases.
10. No new modules.
11. No test edits.
12. No broad smoke wall.
13. No commit.
```

Current continuation point:

```text
Rob's first message in the fresh chat will be Codex's Step 3 Completion Gate reply.

Review that reply against the actual changed production files.

Do not trust PASS receipt alone.

First acceptance questions:

A. Can null/empty/whitespace still become 0?
B. Does projection expose canonical proposed_loan_amount before buildChecklist?
C. Is precedence exactly proposed > stated > derived > loan_amount?
D. Are original fact keys preserved?
E. Is current debt excluded?
F. Are exactly three approved role mappings still present?
G. Did Codex add anything not explicitly authorized?
```

# InvestorIQ Semantic Authority Evidence Ledger
## AUTH-001 through AUTH-105
### July 6, 2026 — Manual Production File-by-File Audit

---

# Purpose

This file preserves the detailed manual evidence audit performed across the live Acquisition Memo V2 production path before any new Codex execution prompts are written.

Controlling workflow:

> **We inspect the real production files ourselves, one by one, build the authority map from evidence, and only then write the Codex execution prompts.**

This ledger exists so a fresh chat can continue without losing the findings from the long-form audit.

Do **not** treat all entries as equal. Status language is intentional:

- **CONFIRMED** — directly proven by production code.
- **CONFIRMED RUNTIME** — execution path proven by orchestrator/finalization flow.
- **VERY HIGH LIVE CAUSATION** — code path strongly matches RETEST 20 live behavior.
- **OPEN / WATCH** — behavior exists but live causation is not yet proven.
- **NOT OWNER** — file inspected and ruled out as primary owner for that defect.

Allowed classifications:

- `DELETE`
- `STRIP_AUTHORITY`
- `CONSOLIDATE_DUPLICATE_AUTHORITY`
- `ORPHANED_AUTHORITY`
- `REPLACE`
- `KEEP`

---

# Live Context

RETEST 20 published end to end:

```text
queued
-> extracting
-> underwriting
-> scoring
-> rendering
-> pdf_generating
-> publishing
-> published
```

CVF-24 recurring final Boss-compliance / route-500 family was broken through.

However, RETEST 20 exposed CVF-25:

```text
SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE
```

Observed launch-critical defects:

```text
- Unit Mix source-backed truth existed but section collapsed.
- Purchase Assumptions parsed but customer surface said none uploaded.
- Purchase Assumptions source mislabeled as Existing Debt.
- Current Debt facts appeared in Document Treatment but dedicated Debt section collapsed.
- Appraisal Stabilized Cap Rate 7.40% displayed as Interest Rate 7.40%.
- Break-Even Occupancy output 37.0%, incorrectly equal to Expense Ratio.
- QA oracle also expected wrong 37.0%.
- Rent-upside capitalization table label implied whole-property value semantics.
- Asset Class displayed 64-Unit.
```

---

# Files Manually Inspected for AUTH-001 through AUTH-105

1. `api/_lib/acquisition-memo-v2-customer-surface-model.js`
2. `api/_lib/acquisition-memo-v2-role-reconciler.js`
3. `api/_lib/canonical-source-package.js`
4. `api/_lib/acquisition-memo-projection.js`
5. `api/_lib/acquisition-memo-boss-contract.js`
6. `api/_lib/acquisition-memo-v2-boss-repair.js`
7. `api/_lib/acquisition-memo-v2-orchestrator.js`
8. `api/_lib/acquisition-memo-v2-final-decision.js`

The renderer file `api/_lib/acquisition-memo-v2-document.js` was uploaded at the end of the session but is **not** included in AUTH-001 through AUTH-105. Continue that file separately if needed.

---

# Root-Family Summary

## Root Family 1 — Duplicate Semantic Role Authority

Active semantic decision makers exist across:

```text
role-reconciler
canonical-source-package
Boss Contract
CustomerSurfaceModel
raw-payload repair/heal side doors
```

Key entries:

```text
AUTH-005, AUTH-006, AUTH-015, AUTH-016, AUTH-017,
AUTH-018, AUTH-021, AUTH-023, AUTH-030, AUTH-039,
AUTH-040, AUTH-043, AUTH-044, AUTH-057, AUTH-071
```

Target doctrine:

```text
one source identity
-> one accepted role
-> one canonical fact schema
-> immutable provenance
-> downstream consumers do not reclassify
```

## Root Family 2 — Duplicate Fact Extraction / Writer Authority

Same facts are independently extracted or supplemented in multiple layers:

```text
role-reconciler
canonical-source-package
Boss Contract
raw payload heal guards
```

Key entries:

```text
AUTH-001, AUTH-002, AUTH-019, AUTH-020, AUTH-022,
AUTH-028, AUTH-041, AUTH-042, AUTH-045
```

Target doctrine:

```text
normalize aliases once
write one canonical fact object
downstream reads canonical facts only
```

## Root Family 3 — No Immutable Accepted-Truth Provenance Lock

Key entries:

```text
AUTH-006, AUTH-017, AUTH-039, AUTH-046, AUTH-047,
AUTH-057, AUTH-059, AUTH-069, AUTH-075, AUTH-079,
AUTH-084, AUTH-086, AUTH-097, AUTH-105
```

Target invariant:

```text
raw accepted evidence
-> parsed artifact
-> canonical role
-> reconciled accepted truth
-> projection
-> CustomerSurfaceModel
-> Boss Contract
-> final delivery
```

## Root Family 4 — False-Collapse Compliance Laundering

Fully proven in code and runtime.

Key entries:

```text
AUTH-049, AUTH-050, AUTH-051, AUTH-052, AUTH-055,
AUTH-056, AUTH-059, AUTH-060, AUTH-061, AUTH-062,
AUTH-063, AUTH-064, AUTH-065, AUTH-066, AUTH-067,
AUTH-069, AUTH-078, AUTH-079, AUTH-080, AUTH-081,
AUTH-082, AUTH-083, AUTH-084, AUTH-085, AUTH-086,
AUTH-088, AUTH-089, AUTH-090, AUTH-096, AUTH-098,
AUTH-105
```

Confirmed forbidden runtime pattern:

```text
sourceBacked true
-> validation detects missing rendered truth
-> repair classifies as optional/support repairable
-> repair sets section.status = collapsed
-> repair clears available facts
-> repair clears missing facts
-> repair sets sourceBacked = false
-> model and Boss are both downgraded
-> rerender
-> revalidate repaired state
-> repaired state becomes final truth
-> final decision can deliver
```

## Root Family 5 — Final Gate Does Not Require Full Final Compliance

Key entries:

```text
AUTH-092, AUTH-093, AUTH-094, AUTH-095,
AUTH-099, AUTH-100, AUTH-103, AUTH-104
```

Critical finding:

```text
complianceOk is computed
but not required by publishable
```

---

# Detailed Authority Ledger

## AUTH-001 — Purchase Loan Alias Contract Mismatch
- **Status:** CONFIRMED cross-file mismatch; exact live propagation path still needed.
- **Files:** role reconciler, CustomerSurfaceModel.
- **Evidence:** reconciler recognizes/writes `derived_acquisition_loan_amount`, `stated_acquisition_loan_amount`, `loan_amount`; CustomerSurfaceModel purchase section requires `proposed_loan_amount`.
- **Effect:** accepted acquisition financing truth can exist while section collapses or reports unavailable.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY / CONTRACT_REPAIR`
- **CVF:** 25B

## AUTH-002 — Top-Level Facts vs `extractedFacts` Contract Mismatch
- **Status:** CONFIRMED.
- **Evidence:** role reconciler authority rows write many facts top-level; CustomerSurfaceModel normalization reads `extractedFacts` / `extracted_facts`.
- **Effect:** facts can survive in one surface but disappear in dedicated sections.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25B / 25D

## AUTH-003 — Role Vocabulary Contract Split
- **Status:** CONFIRMED.
- **Mismatches:** `appraisal_valuation_context` vs `appraisal_context`; `environmental_due_diligence_context` vs `environmental_context`; `renovation_capex_context` vs `structured_renovation_capex_plan`.
- **Effect:** valid context can disappear or collapse.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-004 — Current Debt Fixed Priority Can Beat Purchase Assumptions
- **Status:** STRONG CANDIDATE.
- **Evidence:** same-identity priority favors `current_debt_context` over `purchase_assumptions`.
- **Effect:** possible Purchase Assumptions -> Existing Debt mislabel.
- **Classification:** `STRIP_AUTHORITY / CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C

## AUTH-005 — Semantic Metadata Reused as Evidence
- **Status:** CONFIRMED.
- **File:** role reconciler.
- **Reads into evidence:** `semantic_doc_role`, `semantic_doc_display_label`, `semantic_doc_role_reason`, `debt_basis`.
- **Effect:** prior classification can help prove itself.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-006 — Accepted Truth Is Not Provenance Locked
- **Status:** CONFIRMED.
- **Evidence:** `acceptedTruth` is one input among many; reconciler emits new accepted semantic fields.
- **Effect:** accepted truth is recomputed rather than preserved.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25I

## AUTH-007 — Parser Debt Basis Survives No-Evidence Fallback
- **Status:** CONFIRMED.
- **Evidence:** no best candidate -> `other_support_context`, but `acceptedDebtBasis = parserDebtBasis || null`.
- **Effect:** rejected parser semantics leak downstream.
- **Classification:** `ORPHANED_AUTHORITY`

## AUTH-008 — Appraisal Role Can Retain Generic `interest_rate`
- **Status:** STRONG CANDIDATE.
- **Evidence:** appraisal canonicalization spreads prior row fields.
- **Effect:** cap rate can survive under generic interest-rate alias.
- **Classification:** `STRIP_AUTHORITY / PROVENANCE_LOCK_REQUIRED`
- **CVF:** 25E

## AUTH-009 — CustomerSurfaceModel Merges Multiple Truth Stages
- **Status:** CONFIRMED.
- **Reads:** canonical package, projection buckets, Boss sourceTruth.
- **Effect:** contradictory semantic versions coexist in final model construction.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-010 — First-Writer-Wins Dedupe Can Preserve Stale Semantics
- **Status:** CONFIRMED.
- **Effect:** earlier canonical version can suppress later reconciled/Boss copy.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-011 — CustomerSurfaceModel Infers Accepted Truth from Display Labels
- **Status:** CONFIRMED.
- **Effect:** wrong labels can self-reinforce as accepted truth.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-012 — Local Completeness Can Rewrite `sourceBacked` False
- **Status:** CONFIRMED.
- **Evidence:** purchase/current debt sections recompute source-backed state from exact display-field completeness.
- **Effect:** accepted provenance can be downgraded because one alias/field is missing.
- **Classification:** `REPLACE_SOURCE_BACKED_SEMANTICS`
- **CVF:** 25J

## AUTH-013 — Unit Mix Source-Backed Test Is Internally Weak/Inconsistent
- **Status:** CONFIRMED.
- **Evidence:** total units alone can satisfy source-backed condition despite required `unit_mix` semantics.
- **Effect:** inconsistent model obligations.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25A

## AUTH-014 — First Role Document Wins in Customer Model
- **Status:** CONFIRMED.
- **Evidence:** first role mapping wins without provenance rank.
- **Effect:** stale/earlier same-role doc can own customer surface.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-015 — Reconciler + Canonical Package Are Two Active Role Authorities
- **Status:** CONFIRMED.
- **Evidence:** canonical package calls reconciler, then independently reclassifies.
- **Effect:** reconciled role can be overridden before immutable canonical output.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C / 25I

## AUTH-016 — Canonical Current-Debt Branch Can Override Purchase Truth
- **Status:** CONFIRMED mechanism; VERY HIGH live-causation candidate.
- **Evidence:** current-debt branch runs before purchase branch and can fire on accepted/stale debt truth.
- **Effect:** purchase assumptions become existing debt.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25C

## AUTH-017 — “Accepted Truth” Is First Artifact Metadata
- **Status:** CONFIRMED.
- **Evidence:** first non-empty artifact semantic role/basis/label wins.
- **Effect:** parser metadata promoted to accepted truth without rank/provenance.
- **Classification:** `STRIP_AUTHORITY`
- **CVF:** 25I

## AUTH-018 — Semantic Label Feedback Loop Across Three Files
- **Status:** CONFIRMED CATEGORY.
- **Files:** role reconciler, canonical source package, CustomerSurfaceModel.
- **Pattern:** semantic label -> evidence/truth -> semantic classification.
- **Classification:** `STRIP_AUTHORITY ACROSS PIPELINE`

## AUTH-019 — Canonical Package Re-Extracts Facts Instead of Preserving Structured Facts
- **Status:** CONFIRMED.
- **Effect:** structured accepted facts can disappear in text regex re-extraction.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-020 — Current Debt Structured Facts Can Be Lost in Text Re-Extraction
- **Status:** CONFIRMED architecture; VERY HIGH live candidate.
- **Effect:** one surface sees debt facts while canonical extractedFacts loses them.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25D

## AUTH-021 — Canonical Role Taxonomy Split Is Created by Active Writers
- **Status:** CONFIRMED.
- **Evidence:** role reconciler vocabulary A; canonical package vocabulary B.
- **Effect:** no single canonical role vocabulary.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-022 — Canonical Appraisal Extraction Omits Stabilized Cap Rate / NOI
- **Status:** CONFIRMED missing field contract.
- **Effect:** correct appraisal field absent while generic rate alias may survive elsewhere.
- **Classification:** `CONTRACT_REPAIR / PROVENANCE_LOCK`
- **CVF:** 25E

## AUTH-023 — Reconciled Purchase Role Is Not Sovereign
- **Status:** CONFIRMED.
- **Evidence:** stale/accepted current-debt truth can win before purchase branch despite reconciled purchase role.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-024 — Artifact-Text Helper Lacks Internal Identity Filtering
- **Status:** OPEN / WATCH.
- **Nuance:** main caller appears file-scoped, so no live defect claimed.
- **Classification:** `WATCH`

## AUTH-025 — Core T12/Rent Roll Filename-First Authority
- **Status:** CONFIRMED behavior; live defect link OPEN.
- **Classification:** `KEEP UNDER REVIEW`

## AUTH-026 — `other_support_context` vs `other_support`
- **Status:** CONFIRMED taxonomy split.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **Priority:** P1/P2 unless live impact proven.

## AUTH-027 — Projection Blindly Trusts `canonicalRole`
- **Status:** CONFIRMED propagation mechanism.
- **Effect:** upstream canonical misclassification becomes projection truth.
- **Classification:** `KEEP` with upstream fix.
- **CVF:** 25B / 25C

## AUTH-028 — Projection Checklist Requires Exact `proposed_loan_amount`
- **Status:** CONFIRMED.
- **Effect:** financing terms can exist under other aliases but checklist reports incomplete.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25B

## AUTH-029 — Property Tax Support Hardcoded False
- **Status:** CONFIRMED direct defect.
- **Effect:** valid property tax support can never be acknowledged by checklist.
- **Classification:** `CONTRACT_REPAIR`
- **Priority:** P1 unless visible launch impact.

## AUTH-030 — Projection Taxonomy Aligns With Canonical Package, Not Reconciler
- **Status:** CONFIRMED.
- **Conclusion:** canonical package reclassification is effective downstream taxonomy; reconciler is not sovereign.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-031 — Projection First Match Per Role Wins
- **Status:** CONFIRMED.
- **Evidence:** `Array.find(...)`.
- **Effect:** multiple same-role docs not merged/ranked.
- **Classification:** `KEEP / REVIEW`
- **Priority:** P1 unless live-linked.

## AUTH-032 — Reconciler-Valid Roles Can Be Downgraded to Other Support
- **Status:** CONFIRMED behavior.
- **Effect:** vocabulary A roles not recognized by projection vocabulary B.
- **Classification:** `CONSOLIDATE_ROLE_TAXONOMY`

## AUTH-033 — Projection Creates Duplicate Access Paths to Same Document
- **Status:** CONFIRMED.
- **Examples:** allSupportDocs, role bucket, top-level context aliases.
- **Effect:** downstream recollection/dedupe required.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-034 — Projection Cloning Is Shallow
- **Status:** CONFIRMED.
- **Effect:** nested truth objects can share references across duplicate surfaces.
- **Classification:** `KEEP / HARDEN`
- **Priority:** P1

## AUTH-035 — False Diagnostic: `competingDecisionMakersEliminated: true`
- **Status:** CONFIRMED.
- **Effect:** tests/diagnostics can claim authority cleanup while multiple decision makers remain.
- **Classification:** `REMOVE FALSE CLAIM / DERIVE REAL INVARIANT`

## AUTH-036 — Projection Is Not Primary Owner of Unit Mix Loss
- **Status:** NOT OWNER / HIGH confidence.
- **Effect:** narrows CVF-25A elsewhere.
- **Classification:** `NOT_OWNER`

## AUTH-037 — Projection Does Not Calculate Break-Even Occupancy
- **Status:** NOT OWNER.
- **Classification:** `NOT_OWNER`
- **CVF:** 25F

## AUTH-038 — Boss Re-Merges Canonical + Projection Support Docs
- **Status:** CONFIRMED.
- **Effect:** multiple truth stages re-enter final contract.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-039 — Same File Can Survive Twice Under Conflicting Roles
- **Status:** CONFIRMED.
- **Evidence:** Boss dedupe key includes role.
- **Effect:** same physical source can exist as purchase and debt simultaneously.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`
- **CVF:** 25B / 25C / 25I

## AUTH-040 — Boss Normalizer Falls Back to Raw `semantic_doc_role`
- **Status:** CONFIRMED.
- **Effect:** raw parser role leaks into final Boss truth.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-041 — Boss Re-Extracts Purchase Facts From Evidence Text
- **Status:** CONFIRMED.
- **Effect:** Boss becomes independent purchase-fact writer.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-042 — Boss Re-Extracts Current Debt Facts From Evidence Text
- **Status:** CONFIRMED.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-043 — Boss Can Promote Purchase Assumptions to Current Debt
- **Status:** CONFIRMED code path; EXTREMELY HIGH live-causation candidate.
- **Evidence:** purchase assumptions doc explicitly passed into `promoteCurrentDebtSupportDoc(...)`.
- **Effect:** Purchase Assumptions -> Existing Debt.
- **Classification:** `STRIP_AUTHORITY / REMOVE_PROMOTION_PATH`
- **CVF:** 25C

## AUTH-044 — Current Debt Evidence Detector Is Too Broad
- **Status:** CONFIRMED behavior.
- **Effect:** generic financing language can support current-debt promotion.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-045 — Boss Can Create Purchase Truth When Projection Facts Are Empty
- **Status:** CONFIRMED.
- **Effect:** Boss acts as fact extractor/writer, not only enforcer.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-046 — Boss `sourceTruth.supportDocs` Is Synthesized, Not Pure Source Truth
- **Status:** CONFIRMED.
- **Contains:** merged canonical docs, projection docs, supplemented facts, promoted docs.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-047 — Boss `sourceBacked` Means Availability, Not Provenance
- **Status:** CONFIRMED.
- **Effect:** accepted provenance, partial facts, supplemented facts, and promoted facts are conflated.
- **Classification:** `REPLACE_SOURCE_BACKED_SEMANTICS`
- **CVF:** 25J

## AUTH-048 — Boss Unit Mix Availability vs Required Facts Is Inconsistent
- **Status:** CONFIRMED.
- **Evidence:** availability can be `unit_mix OR units`; required list demands both plus total_units and occupancy.
- **Classification:** `CONTRACT_REPAIR`
- **CVF:** 25A

## AUTH-049 — Source-Backed Unit Mix Violation Is Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** source-backed core Unit Mix can be erased to achieve compliance.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25A / 25J

## AUTH-050 — Source-Backed Current Debt Violation Is Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** dedicated debt section can collapse despite accepted facts.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25D / 25J

## AUTH-051 — Source-Backed Purchase/Proposed Financing Violations Are Collapseable
- **Status:** CONFIRMED P0.
- **Effect:** accepted purchase assumptions can disappear through compliance repair.
- **Classification:** `REPLACE_ROUTING_SEMANTICS`
- **CVF:** 25B / 25J

## AUTH-052 — Collapse Text Can Make False Customer Claim
- **Status:** CONFIRMED.
- **Effect:** internal binding/render failure becomes “uploaded support did not provide detail.”
- **Classification:** `REPLACE_COLLAPSE_COPY_LOGIC`

## AUTH-053 — Boss HTML Repair Calculates Customer Values
- **Status:** CONFIRMED.
- **Evidence:** Boss computes implied/per-unit values and mutates HTML.
- **Classification:** `STRIP_AUTHORITY`

## AUTH-054 — Boss Globally Scrubs Forbidden Words From HTML
- **Status:** CONFIRMED.
- **Effect:** blind HTML mutation.
- **Classification:** `STRIP_AUTHORITY / REPLACE_WITH_MODEL_REPAIR`

## AUTH-055 — Current Debt `sourceBacked` Can Be True With Incomplete Facts
- **Status:** CONFIRMED.
- **Effect:** source-backed provenance conflated with complete render schema.
- **Classification:** `SEPARATE_PROVENANCE_FROM_COMPLETENESS`

## AUTH-056 — Purchase `sourceBacked` Can Be True With Partial Facts
- **Status:** CONFIRMED.
- **Effect:** partial facts -> sourceBacked true -> missing required fields -> collapse path.
- **Classification:** `SEPARATE_PROVENANCE_FROM_COMPLETENESS`

## AUTH-057 — Boss Normalization Drops Accepted Provenance Fields
- **Status:** CONFIRMED.
- **Dropped:** accepted semantic role/basis/display/provenance fields.
- **Effect:** provenance metadata disappears before Boss reconstructs role/facts.
- **Classification:** `PROVENANCE_CONTRACT_REPAIR`
- **CVF:** 25I

## AUTH-058 — Boss Core Validity Check Is Too Shallow
- **Status:** CONFIRMED.
- **Evidence:** role/label/sourceKind can make core doc “valid.”
- **Classification:** `HARDEN_CORE_GATE`
- **Priority:** P1

## AUTH-059 — Boss Repair Explicitly Flips `sourceBacked` False
- **Status:** CONFIRMED DIRECT CODE, P0.
- **Mutation:** status collapsed; available []; missing []; sourceBacked false.
- **Classification:** `REPLACE_CORE_REPAIR_SEMANTICS`
- **CVF:** 25J

## AUTH-060 — Unit Mix False Collapse Is Explicitly Repairable
- **Status:** CONFIRMED mechanism; VERY HIGH live causation.
- **Effect:** Unit Mix violation -> collapse -> provenance erasure.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25A / 25J

## AUTH-061 — Current Debt False Collapse Is Explicitly Repairable
- **Status:** CONFIRMED P0.
- **Mapped codes:** source-backed debt missing, false missing, accepted debt lost, HTML false missing.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25D / 25J

## AUTH-062 — Purchase Assumptions Loss Is Repaired by Collapsing Acquisition Context
- **Status:** CONFIRMED P0.
- **Effect:** accepted purchase truth loss triggers further suppression.
- **Classification:** `REPLACE_REPAIR_POLICY`
- **CVF:** 25B / 25J

## AUTH-063 — HTML Missing-Fact Violations Mutate Model Provenance
- **Status:** CONFIRMED P0.
- **Effect:** renderer/output failure becomes source-truth downgrade.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`

## AUTH-064 — Unit Mix HTML Failures Erase Model Provenance
- **Status:** CONFIRMED P0.
- **Effect:** missing label/count/rents/spread -> unitMix collapsed and sourceBacked false.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`
- **CVF:** 25A / 25J

## AUTH-065 — Accepted-Truth Loss Misclassified as Optional Support Repair
- **Status:** CONFIRMED P0.
- **Effect:** `ACCEPTED_*_LOST` treated as `repairableOptionalSupport`.
- **Classification:** `REPLACE_ROUTING_TAXONOMY`

## AUTH-066 — `shouldRetry` Enables Compliance Laundering
- **Status:** CONFIRMED P0.
- **Chain:** no core fatal + repairable section -> retry -> provenance downgrade -> rerender.
- **Classification:** `REPLACE_RETRY_POLICY`

## AUTH-067 — False-Missing Detection Exists but Recovery Policy Is Collapse
- **Status:** CONFIRMED P0.
- **Effect:** system detects false missing but does not restore truth.
- **Classification:** `REPLACE_REPAIR_POLICY`

## AUTH-068 — Generic Section Failure Can Become Core Fatal
- **Status:** CONFIRMED behavior; exact live path OPEN.
- **Classification:** `REPLACE_ROUTING_TAXONOMY`

## AUTH-069 — Repair Destroys Diagnostic State
- **Status:** CONFIRMED P0.
- **Effect:** available/missing/sourceBacked history erased.
- **Classification:** `REPLACE_REPAIR_STATE_MODEL`

## AUTH-070 — Boss Repair Mixes V2 Repair With Legacy HTML Quarantine
- **Status:** CONFIRMED.
- **Effect:** separate responsibilities mixed.
- **Classification:** `CONSOLIDATE / POSSIBLE_EXTRACTION`
- **Priority:** P1 after truth fixes.

## AUTH-071 — Final Heal Guard Re-Reads Raw Payload Semantics
- **Status:** CONFIRMED.
- **Reads:** raw `debt_basis`, `semantic_doc_role`, financing aliases.
- **Effect:** side-door semantic authority after canonical/Boss/model chain.
- **Classification:** `STRIP_AUTHORITY`
- **Priority:** P0/P1 depending reachability.

## AUTH-072 — Raw Payload Gate Can Strip Debt Marked Section
- **Status:** CONFIRMED behavior; live V2 relevance OPEN.
- **Classification:** `WATCH / TRACE`

## AUTH-073 — Specific `-48.0%` Stale Variance HTML Guard
- **Status:** CONFIRMED.
- **Concern:** report/history-specific hardcoded stale-value guard.
- **Classification:** `POSSIBLE_REPORT_SPECIFIC_PATCH / INVESTIGATE`
- **Priority:** P1

## AUTH-074 — Duplicate Global HTML Scrub Authority
- **Status:** CONFIRMED.
- **Files:** Boss Contract and Boss Repair.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-075 — Runtime Confirms Customer Model Receives Three Truth Stages
- **Status:** CONFIRMED RUNTIME.
- **Inputs:** canonical package + projection + Boss Contract.
- **Classification:** `CONSOLIDATE_DUPLICATE_AUTHORITY`

## AUTH-076 — Dual Customer Model Entry Path
- **Status:** CONFIRMED.
- **Paths:** caller-supplied prebuilt model OR locally built model.
- **Classification:** `TRACE / POSSIBLE_DUPLICATE_AUTHORITY`

## AUTH-077 — Compliance Assesses Already-Mutated HTML
- **Status:** CONFIRMED RUNTIME.
- **Chain:** render -> Boss enforcement mutation -> repair mutation -> compliance.
- **Classification:** `REVIEW_FINAL_AUTHORITY`

## AUTH-078 — Pre-Render Provenance Erasure Path
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** model validation issue can trigger repair before first render.
- **Classification:** `REPLACE_REPAIR_EXECUTION_POLICY`
- **CVF:** 25A / 25B / 25D / 25J

## AUTH-079 — Same Repair Plan Downgrades Customer Model and Boss Contract
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** validator and validated truth contract can be changed together.
- **Classification:** `REPLACE_REPAIR_EXECUTION_POLICY`

## AUTH-080 — Mutated Model Is Revalidated, Not Original Truth
- **Status:** CONFIRMED P0.
- **Effect:** original source-backed obligation disappears before revalidation.
- **Classification:** `REPLACE_REVALIDATION_POLICY`

## AUTH-081 — Second Post-Render Truth-Downgrade Pass Exists
- **Status:** CONFIRMED P0.
- **Effect:** pre-render and post-render repair waves can both mutate truth.
- **Classification:** `REPLACE_RETRY_POLICY`

## AUTH-082 — HTML Failure Can Mutate Boss Truth
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** missing HTML fact -> repaired Boss section sourceBacked false.
- **Classification:** `REPLACE_REPAIR_ARCHITECTURE`

## AUTH-083 — Retry Allowed With Invalid Repaired Model
- **Status:** CONFIRMED P0.
- **Evidence:** retry allowed when validation OK OR repairableSectionKeys non-empty.
- **Classification:** `REPLACE_RETRY_GATE`

## AUTH-084 — Repaired Truth Becomes Final Truth
- **Status:** CONFIRMED RUNTIME, P0.
- **Effect:** successful retry returns repaired model/Boss/HTML without provenance comparison.
- **Classification:** `ADD_PROVENANCE_DELTA_GUARD`
- **CVF:** 25J

## AUTH-085 — Final Decision Consumes Repaired State
- **Status:** CONFIRMED.
- **Effect:** final gate sees repaired finalization and repaired Boss coreGate.
- **Classification:** `PROTECT_FINAL_DECISION_WITH_ORIGINAL_PROVENANCE`

## AUTH-086 — No Pre/Post Provenance Delta Validation
- **Status:** CONFIRMED ABSENCE, P0.
- **Missing invariant:** forbid unexplained `sourceBacked true -> false`.
- **Classification:** `ADD_CONSTITUTIONAL_GUARD`

## AUTH-087 — Boss Contract Validation Is Not Primary Initial Gate
- **Status:** CONFIRMED FLOW.
- **Effect:** invalid Boss contract may be diagnosed but not immediately gate execution.
- **Classification:** `REVIEW`
- **Priority:** P1

## AUTH-088 — Mutated Boss Used as Render Authority
- **Status:** CONFIRMED P0.
- **Effect:** Boss is directly repaired, not rebuilt from immutable source truth.
- **Classification:** `REBUILD_OR_PRESERVE_IMMUTABLE_BOSS`

## AUTH-089 — Repair Mutates Already-Mutated State Cumulatively
- **Status:** CONFIRMED P0.
- **Effect:** pass 2 starts from pass-1 state, not immutable baseline.
- **Classification:** `REPLACE_RETRY_STATE_MANAGEMENT`

## AUTH-090 — Repaired Model + Boss + HTML Can Self-Validate
- **Status:** CONFIRMED architectural effect, P0.
- **Effect:** synchronized erasure creates internal consistency.
- **Classification:** `ADD_IMMUTABLE_PROVENANCE_BASELINE`

## AUTH-091 — Diagnostics Lack Provenance Delta
- **Status:** CONFIRMED.
- **Effect:** diagnostics record repair happened but not what truth was erased.
- **Classification:** `ADD_PROVENANCE_AUDIT_TRAIL`
- **Priority:** P0/P1

## AUTH-092 — `publishable` Ignores `complianceOk`
- **Status:** CONFIRMED P0.
- **Evidence:** `complianceOk` computed but absent from publishable formula.
- **Classification:** `REPLACE_PUBLISHABLE_LOGIC`

## AUTH-093 — Final Delivery Does Not Require `bossOk`
- **Status:** CONFIRMED P0.
- **Effect:** Boss compliance may fail while final delivery still passes loose gate.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-094 — Final Delivery Does Not Require `htmlOk`
- **Status:** CONFIRMED P0.
- **Effect:** customer-surface HTML validation failure may not block.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-095 — Unsafe HTML Blocker Covers Only Narrow Failure Set
- **Status:** CONFIRMED P0.
- **Effect:** ordinary critical truth-display failures may not count unsafe.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-096 — Final Gate Can Rubber-Stamp Repaired/Truth-Erased State
- **Status:** CONFIRMED architectural effect, P0.
- **Classification:** `ADD_IMMUTABLE_PRE_POST_PROVENANCE_GATE`
- **CVF:** 25J

## AUTH-097 — Final Gate Has No Immutable Baseline Input
- **Status:** CONFIRMED P0.
- **Missing:** initial model, original Boss, original source truth, pre-repair provenance.
- **Classification:** `ADD_PROVENANCE_BASELINE_INPUT`

## AUTH-098 — Repair Success Defined Without Truth Preservation
- **Status:** CONFIRMED P0.
- **Evidence:** success = publishable after attempted repair.
- **Classification:** `REPLACE_REPAIR_SUCCESS_SEMANTICS`

## AUTH-099 — Repairable Optional Signal Does Not Block Delivery
- **Status:** CONFIRMED.
- **Effect:** repairable issues can remain while delivery passes.
- **Classification:** `REPLACE_FINAL_GATE`

## AUTH-100 — `fatalCategory` Can Be Null While Compliance Is False
- **Status:** CONFIRMED.
- **Cause:** fatalCategory derives from loose publishable.
- **Classification:** `REPLACE_FINAL_DECISION_ORDER`

## AUTH-101 — `finalBossCompliance.ok` Is Misnamed
- **Status:** CONFIRMED.
- **Evidence:** field reflects combined `final.compliance.ok`, not Boss-only status.
- **Classification:** `DIAGNOSTIC_REPAIR`
- **Priority:** P1

## AUTH-102 — Upstream Readiness Signals Recorded but Not Gating
- **Status:** CONFIRMED behavior.
- **Classification:** `WATCH / DESIGN REVIEW`
- **No patch yet.**

## AUTH-103 — Computed `complianceOk` Is Dead Decision Data
- **Status:** CONFIRMED P0.
- **Effect:** intended final-compliance concept exists but is unused.
- **Classification:** `ORPHANED_AUTHORITY / LOGIC_REPAIR`

## AUTH-104 — No Final Blocking Category for Truth Regression
- **Status:** CONFIRMED ABSENCE, P0.
- **Needed category:** unresolved source-truth regression / provenance loss.
- **Classification:** `ADD_FINAL_DECISION_CLASSIFICATION`

## AUTH-105 — No Distinction Between Legitimate Collapse and False Collapse
- **Status:** CONFIRMED P0.
- **Effect:** optional source absent and accepted source lost can look identical by final decision time.
- **Classification:** `ADD_PROVENANCE_DELTA_GATE`
- **CVF:** 25J

---

# RETEST 20 Defect Mapping

## CVF-25A — Unit Mix False Collapse

High-confidence chain:

```text
structured Rent Roll unit_mix exists
-> model/HTML mismatch
-> UNIT_MIX_* violation
-> repairable section = unitMix
-> model + Boss set collapsed
-> sourceBacked false
-> rerender
-> compliant publish
```

Relevant entries:

```text
AUTH-049, AUTH-059, AUTH-060, AUTH-064,
AUTH-078, AUTH-079, AUTH-080, AUTH-081,
AUTH-082, AUTH-084, AUTH-090
```

## CVF-25B — Purchase Assumptions False Missing

Likely combined chain:

```text
role conflict and/or field schema loss
-> accepted purchase truth lost / HTML missing
-> acquisitionRequestContext repairable
-> model + Boss collapse
-> rerender
-> publish
```

Relevant entries:

```text
AUTH-001, AUTH-016, AUTH-017, AUTH-023, AUTH-028,
AUTH-043, AUTH-051, AUTH-056, AUTH-062, AUTH-063,
AUTH-065, AUTH-078, AUTH-079, AUTH-084
```

## CVF-25C — Purchase Assumptions Mislabeled Existing Debt

Strong candidate chain:

```text
stale debt semantics
-> canonical current-debt branch precedence
and/or Boss purchase-doc promotion
-> current debt bucket
-> customer treatment label
```

Relevant entries:

```text
AUTH-004, AUTH-016, AUTH-023, AUTH-039,
AUTH-043, AUTH-044
```

## CVF-25D — Current Debt Facts Visible but Dedicated Section Collapsed

Extremely strong chain:

```text
facts survive one surface
-> dedicated HTML fails completeness
-> CURRENT_DEBT_* violation
-> currentDebtContext repairable
-> model + Boss collapse
-> rerender
-> Document Treatment retains separate copy
```

Relevant entries:

```text
AUTH-002, AUTH-020, AUTH-033, AUTH-050, AUTH-055,
AUTH-061, AUTH-063, AUTH-079, AUTH-082, AUTH-084
```

## CVF-25E — Appraisal Cap Rate -> Interest Rate

Relevant entries:

```text
AUTH-008, AUTH-022
```

Confirmed missing correct appraisal fact contract plus strong candidate stale generic alias survival.

## CVF-25F — Break-Even Occupancy

No owner confirmed in AUTH-001 through AUTH-105.

Known:

```text
Projection is NOT owner.
CustomerSurfaceModel reads coreMetrics.breakEvenOccupancy rather than calculating.
```

Continue upstream metric-owner trace separately.

## CVF-25G — Rent-Upside Value Semantics

Not resolved in AUTH-001 through AUTH-105.

Continue renderer/document audit separately.

## CVF-25H — Asset Class / Identity Alias

Not resolved in AUTH-001 through AUTH-105.

Known:

```text
CustomerSurfaceModel reads propertyProfile.assetClass / asset_class.
Projection not owner.
```

Continue upstream profile/renderer trace separately.

---

# Codex Usage Doctrine for the Next Fresh Chat

The user explicitly wants Codex usage preserved.

Do **not** start with another broad audit.

Do **not** ask Codex to rediscover the architecture.

Use ChatGPT’s evidence ledger to write a sequence of **small root-family execution prompts**.

Preferred sequencing:

## Micro Prompt Family 1 — Immutable source provenance / one accepted role

Target:

```text
AUTH-005, 006, 015, 016, 017, 018, 021, 023,
039, 040, 043, 044, 057, 071
```

Goal:

```text
one identity
one accepted role
no display-label truth inference
no Boss role promotion
no same-file conflicting role duplicates
```

## Micro Prompt Family 2 — One canonical fact schema

Target:

```text
AUTH-001, 002, 019, 020, 022, 028, 041, 042, 045
```

Goal:

```text
normalize aliases once
downstream reads canonical facts only
no Boss regex fact extraction
```

## Micro Prompt Family 3 — No false collapse of source-backed truth

Target:

```text
AUTH-049, 050, 051, 052, 055, 056,
059, 060, 061, 062, 063, 064, 065,
066, 067, 069
```

Goal:

```text
sourceBacked true
must not become false merely to pass validation
```

## Micro Prompt Family 4 — Repair/orchestrator provenance preservation

Target:

```text
AUTH-078 through AUTH-091
```

Goal:

```text
immutable original provenance baseline
repair may change renderability
repair may not rewrite accepted truth
pre/post delta guard required
```

## Micro Prompt Family 5 — Final delivery gate integrity

Target:

```text
AUTH-092 through AUTH-105
```

Goal:

```text
publishability requires full final compliance
Boss OK
model OK
HTML OK
no unresolved provenance regression
legitimate collapse distinguished from false collapse
```

---

# Codex Leash / Usage Preservation

For every future Codex prompt:

```text
- narrow scope;
- one root family at a time;
- no broad repo audit;
- no live services;
- no DocRaptor;
- no Supabase writes;
- no paid/API loops;
- no broad smoke wall by default;
- no RETEST until coherent category fix is complete;
- no test-report hardcoding;
- no Stonebridge/RETEST/Attack fixture values in production;
- preserve Screening;
- compact receipt only.
```

Preferred compact receipt:

```text
1. Verdict PASS / HOLD / BLOCKED
2. Files changed
3. Exact authority contract changed
4. Targeted checks run/results
5. Exact blocker if HOLD/BLOCKED
6. Confirm no live services
7. Confirm no commit unless explicitly requested
```

Testing discipline:

```text
Start with:
- node --check
- targeted rg
- smallest relevant smoke/test

Escalate only if necessary.
Do not spend Codex usage on broad smoke walls unless the change genuinely requires them.
```

---

# Fresh Chat Start Instruction

Upload these three files first:

```text
1. Updated MASTER context/checklist
2. Updated CVF ledger
3. This AUTH-001 through AUTH-105 Semantic Authority Evidence Ledger
```

Then instruct the next chat:

```text
Do not restart the audit.
Do not ask for a broad Codex investigation.
Treat the AUTH ledger as the preserved evidence map.

First task:
Consolidate AUTH-001 through AUTH-105 into the smallest safe sequence of Codex micro-prompts.

Preserve Codex usage:
- one root family at a time;
- compact receipts;
- targeted checks;
- no broad smoke wall;
- no live services;
- no Screening changes unless strictly required;
- no RETEST until coherent category fixes are complete.

The prompts must implement the evidence-backed authority purge.
Codex is not being asked to rediscover the architecture.
```

---

# Controlling Conclusion

The manual audit proved that the Acquisition Memo problem is not one renderer bug, one parser bug, one stale helper, or one bad test.

It is:

```text
duplicate semantic authority
+
duplicate fact authority
+
no immutable provenance lock
+
false-collapse compliance laundering
+
a final gate that does not require full final compliance
```

That is the root evidence base for the next Codex execution phase.

---

# Historical July 15, 2026 Semantic Authority and Publication Evidence Addendum

This section records the pre-RETEST 27, pre-Manifest, and pre-Gate 3 checkpoint. The Gate 3 Semantic Receipt Addendum below is controlling.

This addendum preserves the accepted July 13 authority work and records the completed P0 customer-egress and publication proof. Earlier next-task instructions are historical only.

## Authority state after P0-A through P0-D

```text
Raw extraction
-> deterministic semantic evidence
-> optional evidence-bound AI candidate analysis
-> exact source-excerpt/value validation
-> conflict and ambiguity adjudication
-> canonical accepted role and fact bundle in Source Truth
-> consume-only Projection
-> consume-only Boss Contract
-> consume-only CustomerSurfaceModel
-> deterministic calculations and reconciliation
-> deterministic Contract QA Seal
-> Delivery Seal
-> final PDF rendering
-> Final PDF Publication Quality Boss
-> storage/publication
```

No P0 change grants AI, filename, parser route, artifact type, taxonomy, renderer, or compatibility alias independent truth authority.

## Permanent RETEST 24 evidence

Sanitized fixture:

```text
tests/qa/fixtures/retest24-sanitized-permanent-replay.json
```

Replay owner:

```text
tests/qa/p0d-retest24-permanent-regression-replay-smoke.js
```

The replay binds source excerpts to these accepted, role-separated facts:

```text
purchase_assumptions:
  purchase price 13,500,000
  NOI basis 945,000
  going-in cap rate 7.00%
  proposed loan 9,450,000
  LTV 70.0%
  proposed rate 5.95%
  amortization 30 years
  lender fee 0.85%

current_debt_context:
  current outstanding balance 6,800,000
  current rate 4.85%
  amortization remaining 24 years
  monthly payment 39,250
  maturity 2029-11-01

appraisal_context:
  appraisal value 14,200,000
  stabilized NOI 1,050,000
  stabilized cap rate 7.40%
```

Cross-role eligibility is explicitly false:

```text
purchase assumptions -> not current debt, not appraisal
current debt -> not purchase assumptions, not proposed acquisition financing
appraisal -> not purchase assumptions, not current debt
```

## Reconciliation authority proof

```text
T12 Gross Potential Rent: 1,612,800
Rent Roll annual in-place rent: 1,432,800
Rent Roll less T12: (180,000)
canonical variance: -0.11160714285714286
customer display: -11.16%
disclosure: InvestorIQ has not reconciled this variance and does not infer the cause.
```

The disclosure is mandatory because provenance does not explain causation and InvestorIQ never infers the source of a variance.

## New evidence item: delivery compatibility alias regression

P0-D proved the sealed Acquisition final decision was correct while the compatibility adapter emitted false blocked aliases. The owner was `api/_lib/report-delivery-output.js`.

The correction accepts `acq_memo_v2_final_delivery_decision_v1` only when all of the following agree:

```text
exact version and product
exact final-delivery authority
deliverable final status
coreGate.publishAllowed true
Boss validation true
CustomerSurfaceModel validation true
customer-surface HTML validation true
zero final compliance violations
customer delivery ready true
customer publish eligible true
report publishable true
report blocked false
zero blocking reasons
```

Any missing or contradictory field still fails closed.

## P0 local evidence

```text
P0-A: PASS
P0-B: PASS
P0-C: PASS
P0-D: PASS
full Acquisition render harness: PASS
Support Document Authority cutover: PASS
worker publication contract: PASS
production build: PASS
```

## Preserved ELITE authority rule

Every later module, including debt analytics, renovation underwriting, valuation, scenario analysis, returns, risk, diligence, and visualization, must consume accepted Source Truth and deterministic calculations. Later modules may add analysis only when their complete role-specific fact bundle is accepted. Missing optional evidence must collapse the narrow section, not mutate core truth or block a valid report.

Production certification remains HOLD while DocRaptor remains intentionally in test mode and the locally accepted Gate 3 bundle awaits deployment verification.

---

# July 15, 2026 Gate 3 Semantic Receipt Addendum

This addendum supersedes every earlier next-task instruction in this ledger. It does not replace or weaken AUTH-001 through AUTH-105 evidence.

## Exact authority chain after Gate 3

```text
raw extraction
-> deterministic semantic evidence
-> optional evidence-bound AI candidate analysis
-> exact source-excerpt and value validation
-> conflict, duplicate, and ambiguity adjudication
-> canonical accepted role and fact bundle in Source Truth
-> consume-only Projection
-> consume-only Boss Contract
-> consume-only CustomerSurfaceModel
-> deterministic customer calculations and reconciliation
-> deterministic Contract QA Seal
-> canonical Delivery Seal decision
-> final PDF rendering
-> Final PDF Publication Quality Boss
-> terminal publication or blocked state
-> immutable receipt-only Report Quality Manifest
-> receipt-only Report Quality Incident Projection
-> Admin Quality Incident and Customer Remedy Dashboard
```

Semantic authority stops at canonical Source Truth and the protected downstream contracts. The Manifest and Dashboard record what happened. They do not decide which role or fact is true.

## Gate 2 evidence boundary

Committed baseline:

```text
cde0b05
```

The Report Quality Manifest records accepted facts, rejected facts, evidence, identity, conflicts, section outcomes, calculation eligibility, final receipts, publication, credit, and remedy state.

It is constitutionally marked:

```text
authorityCreating: false
receiptOnly: true
downstreamConsumeOnly: true
legacyUnderwritingReuseAllowed: false
```

Final published Manifests now require the full object whose exact source is:

```text
canonical_delivery_decision
```

A compatibility alias, normalized status object, filename, parser label, raw file row, or rendered surface cannot satisfy that requirement.

## Blocked-terminal semantic receipt

Every terminal path can now retain an honest quality receipt:

```text
canonical Source Truth candidate when available
canonical delivery decision when available
explicit terminal code
explicit failure class
credit restoration state
remedy state
publication.state = blocked
```

If canonical evidence was never constructed, the unavailable candidate records that absence. It contains no invented documents, facts, sections, calculations, or provenance.

Post-gate internal failure is represented without rewriting history:

```text
content/delivery eligibility may be deliverable
publication may still be blocked by PDF, storage, or platform failure
both receipts remain explicit
```

## Gate 3 incident projection authority boundary

Production owner:

```text
api/_lib/report-quality-incident-projection.js
```

Allowed truth inputs:

```text
canonical_report_quality_manifest
canonical_delivery_decision
```

Allowed non-truth operational input:

```text
quality_incident_action_receipt
```

Forbidden reconstruction inputs:

```text
filenames
parser labels or routes
raw upload rows
HTML fragments
worker logs
artifact-order inference
legacy delivery aliases
model narrative
single-field completeness guesses
```

The projection may classify quality impact, responsibility, severity, owner area, and remedy eligibility only from the finalized receipts. It cannot promote a candidate role, accept a fact, manufacture completeness, modify a canonical decision, or make a report publishable.

## Gate 3 operational evidence

```text
BLOCKED
PUBLISHED WITH LIMITATIONS
PUBLISHED CLEAN

collapse_expected
collapse_unexpected
collapse_requires_review

Customer Attention Risk: HIGH / MEDIUM / LOW
```

Action receipts explicitly preserve:

```text
authorityCreating false
sourceTruthChanged false
deliveryChanged false
publicationChanged false
creditMutationPerformed false
financialMutationPerformed false
```

## Exact production files in the Gate 3 semantic boundary

```text
api/_lib/report-quality-manifest.js
api/_lib/report-quality-incident-projection.js
api/admin/quality-incidents.js
api/admin-run-worker.js
api/_lib/generate-client-report-impl.js
src/components/Admin/QualityIncidentDashboard.jsx
src/pages/AdminDashboard.jsx
```

## Local proof

```text
Report Quality Manifest smoke: PASS
Report Quality Incident Projection smoke: PASS
Admin Quality Incident authority-boundary smoke: PASS
qa:quality-ops: PASS
qa:full: PASS
production build: PASS
P0-A through P0-D: PASS
Source Truth constitutional matrix: PASS
Acquisition normal path: PASS
Support Document Authority adversarial matrix: PASS, 24 scenarios
```

No live service, deployment, DocRaptor call, or live retest was run for Gate 3.

## Gate 4 semantic contract

Institutional Financial Intelligence is next after Gate 3 deployment verification.

Every new debt, DSCR, refinancing, sensitivity, reconciliation, reserve, and CapEx result must declare:

```text
required canonical role
required accepted fact bundle
accepted provenance for every input
deterministic formula and version
units and timing basis
eligibility state
result or null
collapse/qualification reason
section display readiness
```

Legacy underwriting code remains quarantined. Historical formulas or labels may inform product vocabulary only after independent review. They may not become production truth, code authority, or a shortcut around the current canonical chain.

Missing optional inputs remain null and ineligible. They must never be coerced to zero, filled by AI, inferred from market convention, or used to block valid core publication.

## Preserved ELITE roadmap after Gate 4

```text
Gate 5: Institutional Underwriting
Gate 6: Investment Committee Memo
Gate 7: Scenario Engine
Gate 8: Due Diligence Engine
Gate 9: Institutional Scoring
Gate 10: ELITE Presentation and PDF System
Gate 11: Launch Operations, Monitoring, Analytics, and Certification
```

Every later gate remains subordinate to accepted Source Truth, complete fact-bundle eligibility, deterministic math, non-inference, consume-only downstream contracts, final PDF certification, immutable Manifest receipts, and canonical incident monitoring.

---

## July 16 Gate 3 production receipt and Gate 4A semantic contract

Gate 3 production verification is complete. The deployed authenticated dashboard loaded the canonical Manifest queues, receipt-only projection boundary, no-legacy-alias boundary, and valid empty state. Empty queues mean no finalized post-deployment Manifest matched the filters; they do not authorize reconstruction from historical raw artifacts.

Gate 4A adds one consume-only semantic boundary:

```text
canonical_source_truth_package
-> accepted canonical T12 NOI
+ accepted primary debt-role facts
+ exact accepted fact evidence
-> canonical_debt_service_input_contract
-> eligible or ineligible calculation bundle only
```

Accepted calculation bundles:

```text
current stated debt service:
  monthly_payment

current modeled debt service:
  current_outstanding_balance
  interest_rate
  amortization_remaining_years

proposed modeled debt service:
  proposed_loan_amount
  interest_rate
  amortization_years

DSCR eligibility additionally requires:
  canonical T12 net_operating_income
```

LTV, purchase price, lender fee, and maturity remain accepted context when evidence-bound, but they cannot substitute for a required debt-service input. The contract performs no payment, annualization, DSCR, stress, or renderer calculation. That work begins only in Gate 4B and remains subordinate to this contract.

Gate 4A verification: focused smoke `PASS`; full QA `PASS`; build `PASS`; Vercel function budget `PASS 12 / 12`; diff check `PASS`.

## July 16 Gate 4B deterministic derivation receipt

Gate 4B extends the consume-only chain without creating new source authority:

```text
canonical_debt_service_input_contract
-> eligible evidence-bound debt-service bundle
-> deterministic debt-service calculation
-> immutable monthly and annual derivation receipt
```

The result distinguishes semantic truth classes:

```text
source-stated monthly payment
deterministically annualized source-stated payment
deterministically modeled monthly debt service
deterministically modeled annual debt service
collapsed calculation with null output
```

A modeled debt-service result is never promoted to a lender-stated fact. Its receipt permanently records accepted input provenance, the annual-rate-to-monthly-rate convention, payment timing, number of periods, formula class, and required qualification state.

No DSCR, stress, maturity risk, refinancing risk, lender-fee analysis, renderer output, or customer copy is produced in Gate 4B. Public terminology guards prohibit em dash characters and wording that reveals implementation machinery. Missing values remain null and optional calculation limitations remain non-blocking.

Gate 4B verification: focused Gate 4A and 4B smokes `PASS`; full QA `PASS`; build `PASS`; Vercel budget `PASS 12 / 12`; diff check `PASS`.

## July 16 Gate 4C deterministic coverage receipt

Gates 4A and 4B are committed and deployed at `e3e080e`. Gate 4C extends the consume-only chain:

```text
canonical debt-service input contract
-> canonical deterministic annual debt service
+ canonical accepted T12 NOI
-> deterministic current or proposed coverage ratio
-> immutable coverage receipt
```

Semantic result classes remain distinct:

```text
current coverage using annualized source-stated monthly payment
current coverage using modeled debt service
proposed coverage using modeled debt service
coverage collapsed with accepted numerator retained
coverage collapsed with accepted denominator retained
scenario coverage not calculated without canonical scenario inputs
```

No threshold is inferred. No calculated ratio becomes a source fact. No modeled denominator becomes a lender-stated payment. Each calculated ratio carries separate numerator provenance, denominator provenance, calculation methodology, analysis precision, display precision, and qualification state.

Bridge, exit, and stress remain null until a canonical scenario contract exists. Arbitrary input objects cannot activate them. Accepted zero and negative NOI values are preserved; missing values remain null.

Gate 4C verification: focused Gate 4A through 4C smokes `PASS`; full QA `PASS`; build `PASS`; Vercel budget `PASS 12 / 12`; diff check `PASS`. Public terminology guards remain active.

## July 16 Gate 4D debt-risk authority receipt

Gate 4C is committed and deployed at `2ed59d3`. Gate 4D extends the protected authority chain:

```text
raw extracted support text
-> deterministic semantic family evidence
-> canonical support-role adjudication
-> exact source binding for rate structure, loan term, and maturity
-> canonical Source Truth accepted fact or narrow fact conflict
-> canonical debt-service input contract
+ canonical report analysis context
-> deterministic maturity, rate-variability, lender-fee, and refinancing-readiness receipt
```

New accepted semantic values are deliberately small and explicit:

```text
rate_structure: fixed | floating | hybrid
loan_term_years: accepted positive source value only
maturity_date: accepted labeled source value only
```

`maturity_date` is no longer a current-debt semantic-family signal by itself. It remains a role-neutral fact until stronger document evidence establishes `current_debt_context` or `purchase_assumptions`.

Deterministic categorical evidence handles semantic families, not thousands of phrases. It recognizes explicit fixed, floating, variable, adjustable, and hybrid structures; rejects negated fixed language; and withholds authority when fixed and floating terms conflict without an explicit transition. Every accepted categorical value retains an exact excerpt, source value, normalized value, and binding method.

The Gate 4A contract now carries optional `rate_structure`, `loan_term_years`, and proposed `maturity_date` facts without adding them to any debt-service or DSCR required bundle. Their absence cannot change existing calculation eligibility.

The canonical report analysis context requires a valid `YYYY-MM-DD` as-of date and prohibits system-clock fallback. Maturity results are reproducible. The analysis accepts unambiguous day-level ISO or named-month dates and refuses ambiguous slash dates or month-only precision.

The debt-risk receipt preserves these semantic boundaries:

```text
contractual maturity position is not a risk tier
floating or hybrid structure is not a modeled rate shock
lender-fee dollars are a deterministic derivation, not a source-stated dollar fee
current debt maturity is not future refinancing authority
proposed acquisition financing is not refinancing
missing refinancing terms mean model ineligible
```

Source Truth narrow conflict treatment is now explicit. Optional same-role conflicts in `rate_structure`, `loan_term_years`, or `maturity_date` reject only the disputed fact and create a `support.fact_conflicts` receipt. Uncontested accepted facts remain available. Full financing-bundle contradictions retain document-level rejection. Quality Manifest and incident consumers preserve this distinction.

Gate 4D verification: support authority matrix `PASS` with 33 scenarios; Source Truth pipelines and constitutional matrix `PASS`; Quality Ops `PASS`; Financial Intelligence `PASS`; full QA and build `PASS`; Vercel budget `PASS 12 / 12`; diff check `PASS`. No renderer or customer copy changed.

NEXT: Gate 4E T12 versus Rent Roll reconciliation materiality and source-bound explanation.

## July 16 Gate 4E core reconciliation authority receipt

Gate 4D is committed and deployed at `62ae77f`, with its ledger update at `c790986`. Gate 4E extends the protected consume-only chain:

```text
validated T12 and Rent Roll core artifacts
-> canonical Source Truth core facts and source reconciliation selection
-> canonical core reconciliation input contract
-> deterministic difference and variance analysis
-> immutable source-limited reconciliation receipt
```

Accepted reconciliation meanings remain deliberately narrow:

```text
T12 Gross Potential Rent from gross_potential_rent or gross_scheduled_rent only
Rent Roll annual in-place rent from an explicitly annual source path only
total units as an optional accepted Rent Roll fact
```

The input contract binds each value to the canonical Source Truth package, accepted core role, accepted fact or source-selection value, source identity key, file and artifact identity, and core validation state. A parser route, filename, broad income alias, unannualized monthly summary, or standalone calculated value cannot create reconciliation authority.

The deterministic receipt preserves these semantic boundaries:

```text
Rent Roll annual in-place rent minus T12 Gross Potential Rent is a comparison, not a source fact
point-in-time Rent Roll and trailing T12 measures are not declared equivalent
variance direction is not a causal explanation
objective size is not a materiality classification without approved policy
missing input is not zero
optional comparison collapse is not a core publication blocker
```

For the permanent reference case, the accepted facts produce:

```text
$1,432,800.00 - $1,612,800.00 = -$180,000.00
-$180,000.00 / $1,612,800.00 = -0.111607
display variance = -11.16%
-$180,000.00 / 64 units / 12 months = -$234.38 per unit per month
```

The source-limited explanation states the accepted amounts and direction, identifies the distinct time bases, and explicitly withholds cause. It never inserts vacancy, concessions, collections, loss-to-lease, timing, turnover, bad debt, or any other unsupported narrative.

The legacy 5% threshold is rejected. Objective dollar, ratio, and per-unit measures are recorded, but classification and threshold remain null with `CANONICAL_MATERIALITY_POLICY_NOT_AVAILABLE`. Arbitrary threshold and cause fields passed by callers have no effect.

Gate 4E verification: Financial Intelligence `PASS`; Source Truth pipelines and constitutional matrix `PASS`; diff check `PASS`; full QA and build `PASS`; Vercel budget `PASS 12 / 12`. Public terminology guards remain active. No renderer or customer copy changed.

NEXT: Gate 4F CapEx timing, reserve adequacy, and deferred maintenance.

## July 16 Gate 4F capital authority receipt

Gate 4E is committed at `b3ac12b`. Gate 4F extends the protected chain:

```text
raw extracted support text
-> deterministic support semantic family evidence
-> canonical support role and exact fact adjudication
-> canonical Source Truth capital facts or narrow fact conflicts
-> canonical capital-plan input contract
-> deterministic timing, reserve, and deferred-maintenance receipt
```

New semantic roles remain distinct:

```text
property_condition_context
renovation_capex_context
historical_capital_context
appraisal_context with accepted capital facts only
```

Completed capital work is contextual evidence only. It is not a forward capital plan. Property condition, renovation, and appraisal facts do not cross-promote into each other's roles merely because they share a reserve or deferred-maintenance reference.

Accepted capital facts require exact source binding. Semantic evidence may establish a candidate family, but it cannot create a fact. Missing currency symbols remain eligible only when a locally bound amount is clear. Split label/value evidence is accepted only when the immediate continuation begins with the value. Later unrelated amounts remain ineligible.

The canonical contract preserves source identity, file identity, canonical role, exact excerpt, evidence method, source value, normalized value, and fact path for every accepted fact. It consumes primary accepted sources only and independently detects cross-role disagreement.

Deterministic timing meaning is limited to:

```text
source-labeled immediate amount
source-labeled near-term amount
source-labeled long-term amount
explicit relative start month
explicit relative end month
explicit or deterministically bounded duration
```

Relative month ranges are not reclassified into timing buckets. A complete source-labeled bucket set may reconcile to the accepted plan total. A partial bucket set records only the accounted amount and leaves unallocated capital null.

Reserve intelligence is limited to objective arithmetic:

```text
reserve balance minus accepted stated requirement
reserve balance divided by accepted stated requirement
annual reserve contribution divided by accepted units
monthly reserve contribution divided by accepted units and 12
```

Deferred-maintenance intelligence preserves only an explicit source status of `identified` or `none_identified` and an exact accepted amount when stated. `not assessed`, `unknown`, and contradictory status language create no accepted status. Severity and cause remain unclassified.

Same-role optional fact conflicts are removed from accepted truth while uncontested plan facts remain. Cross-role conflicts collapse only the disputed consolidated fact. All capital conflicts and limitations remain non-blocking to accepted core publication.

Gate 4F verification: Financial Intelligence `PASS`; support authority `PASS` with 37 scenarios; Source Truth pipelines and constitutional matrix `PASS`; full QA and build `PASS`; Vercel budget `PASS 12 / 12`; diff check `PASS`. No renderer implementation or Gate 4F financial output changed. Canonical document-treatment labels were added for the two new accepted roles.

NEXT: Gate 4G atomic downstream integration.

## July 16 Gate 4G downstream authority receipt

Gate 4G establishes the completed Gate 4 evidence chain:

```text
raw uploaded evidence
-> deterministic semantic evidence
-> canonical support-document adjudication
-> canonical Source Truth accepted roles, facts, evidence, conflicts, and duplicates
-> canonical Gate 4 input contracts
-> deterministic Gate 4 analyses
-> immutable institutional financial-intelligence receipt
-> downstream consume-only report and quality surfaces
```

`api/_lib/institutional-financial-intelligence.js` is the sole aggregate owner. Its receipt does not become a new evidence adjudicator. It can preserve and calculate from canonical accepted truth only. Its validator rejects incomplete or forged marker-only objects and requires the constitutional policy, Source Truth identity, four section receipts, and formula/input/provenance integrity for every eligible calculation.

The accepted-state vocabulary remains exact end to end:

```text
sourcePresent = relevant evidence exists
roleAccepted = canonical adjudication accepted the source role
factAccepted = canonical adjudication accepted at least the required fact state
sourceBacked = accepted fact bundle is bound to exact canonical evidence
sectionDisplayReady = every fact required by that customer section is eligible to render
```

No state is derived from filename, candidate parser route, artifact type, field presence, or calculation result alone. A downstream consumer cannot promote a collapsed receipt, fill null with zero, select a conflict winner, or create a customer fact.

The four consume-only customer surfaces are `debtServiceCoverage`, `debtTermAnalysis`, `coreReconciliation`, and `capitalPlanAnalysis`. Exact calculations and qualifications flow through Projection, Boss, CustomerSurfaceModel, renderer, Report Contract QA, PDF Boss, Manifest, and Admin incident projection without reinterpretation.

The generic unit-mix validator now derives its required labels from accepted Rent Roll Source Truth. Source-defined labels such as Studio, 0BR, 3BR, All Units, or another exact accepted label can be validated without hardcoded property or bedroom assumptions.

Gate 4G is `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. NEXT: Gate 5A must define canonical institutional-underwriting inputs, policy authority, and scenario authority before any constraint, stress, or classification calculation is connected to customer output.
