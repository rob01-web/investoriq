# July 15, 2026 Night Close-Out - Gates 1 and 2 PASS / Gate 3 PASS Locally / Gate 4 Next

### The July 15 Gate 3 Completion Addendum at the end of this ledger is the controlling continuation point. Earlier evidence remains historical evidence only.

## Current exact state

```text
CURRENT COMMITTED BASELINE:
cde0b05
updates

CURRENT WORKING TREE:
DIRTY / UNCOMMITTED.
Contains the locally accepted Gate 3 Admin Quality Incident and Customer Remedy bundle.

DEPLOYMENT:
Gate 2 and earlier work deployed.
Gate 3 not committed or deployed.

LIVE RETEST:
RETEST 27 PASS in DocRaptor test mode.
Report published and customer dashboard showed READY.

PRODUCTION CERTIFICATION:
HOLD while DocRaptor remains intentionally in test mode and Gate 3 awaits deployment verification.

NEXT ACTIVE BOUNDARY:
Rest, then review/commit/deploy Gate 3 and verify its Manifest-only production reads.
Gate 4 Institutional Financial Intelligence follows.

ADMIN QUALITY INCIDENT DASHBOARD:
PASS locally / uncommitted / not deployed.
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


## CVF disposition update after commit 6c15de1

Newly closed / protected family:

```text
CVF-25R SOURCE_TRUTH_PACKAGE_MISSING_OR_LATE_AUTHORITY:
CLOSED / protect.
Source Truth Package created and wired before both report pipelines and source coverage.

CVF-25S OPTIONAL_SUPPORT_LIMITATION_FALSE_FATAL:
CLOSED / protect.
Optional/support limitations remain non-blocking when core T12/Rent Roll are valid.

CVF-25T HARD_CUSTOMER_SURFACE_DEFECT_SUPPRESSED_BY_VALID_CORE:
CLOSED / protect.
Non-negotiable customer-surface defects block even when core is valid.

CVF-25U SELF_HEAL_RENDER_DEFECT_WAVED_THROUGH_WITHOUT_PROOF:
CLOSED / protect.
Self-heal render defects require explicit final clean-output proof.

CVF-25V CUSTOMER_FAILURE_MESSAGE_RECONSTRUCTED_FROM_FILE_ROWS:
CLOSED / protect.
Dashboard customer status and messaging now require source: canonical_delivery_decision.

CVF-25W HELD_CORE_VALID_OUTPUT_MISLABELED_AS_DOCUMENT_BLAME:
CLOSED / protect.
Core-valid held output resolves to REPORT_CONTRACT_FAILED, not missing source documents.

CVF-25X TERMINAL_FAILURE_TAXONOMY_OVERBROAD_DOCUMENT_REPLACEMENT:
CLOSED / protect.
Only the three catastrophic core terminal codes may classify replacement source evidence as required.

CVF-25Y CONSTITUTIONAL_MATRIX_NOT_LOCKED_ACROSS_BOTH_LANES:
CLOSED / protect.
18-scenario Source Truth constitutional matrix added and passing across Screening and Acquisition Memo.
```

Active CVF posture:

```text
No known current-code blocker remains before the single controlled live Acquisition Memo retest.
If the live retest fails, classify the exact terminal code and do not patch until the failure artifact is inspected.
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


## CVF disposition update after final BOSSMAN lock

```text
CVF-25L SCREENING_DELIVERY_GATE_EXECUTION_ORDER_NULL_DECISION:
CLOSED / protect.

CVF-25M ACQUISITION_MEMO_V2_SHARED_DELIVERY_GATE_EARLY_RETURN:
CLOSED / protect.

CVF-25N LEGACY_DSCR_FALLBACK_LIVE_SCORING_AUTHORITY:
CLOSED / protect.
Legacy helper contained with no production caller.

CVF-25O LEGACY_CUSTOMER_BLOCKER_FALLBACK_AUTHORITY:
CLOSED / protect.
Legacy blocker code fallback deleted.

CVF-25P LEGACY_READINESS_FAIL_OPEN_DELIVERY_GATE:
CLOSED / protect.
Missing / failed source coverage and partial canonical state fail closed.

CVF-25Q DOWNSTREAM_PARTIAL_STATE_DELIVERY_AUTHORITY:
CLOSED / protect.
Worker and compatibility aliases now require complete canonical core-valid delivery authority.
```

Protected CVF rule:

```text
A report cannot be customer-deliverable unless the final canonical deliveryDecisionState explicitly authorizes delivery.
```

# July 11, 2026 Continuation Checkpoint - Screening Delivery Gate Execution-Order Fix PASS / Shared Publish-or-Collapse Constitution Confirmed / Final Completion Gate Still Locked

### This addendum supersedes the prior July 11 Handoff 8 Delivery Gate / Sol Trial checkpoint as the active continuation point.

## Current verified state

```text
STEPS 1-6:
PASS / protect.

HANDOFFS 1-8:
PASS / protect.

HANDOFF 8 - DELIVERY GATE:
PASS / protect.

DELIVERY GATE PUBLICATION / ARTIFACT / WORKER BOUNDARIES:
PASS / protect.

SCREENING DELIVERY-GATE EXECUTION-ORDER FIX:
PASS / protect.

ACQUISITION MEMO DELIVERY PIPELINE:
PASS / protect.

SCREENING DELIVERY PIPELINE:
PASS / protect.

MANUAL CHATGPT VERIFICATION:
PASS.

LATEST PROTECTED DELIVERY-GATE BASELINE COMMIT:
bd24b94.

LATEST SCREENING DELIVERY-GATE FIX COMMIT:
b53b5a1.

FINAL ANTI-WHACK-A-MOLE COMPLETION GATE:
ACTIVE.

LIVE ACQUISITION MEMO RETEST:
STILL LOCKED.
DO NOT RUN.
```

## July 11 constitutional clarification

The long-running "one Boss" question has been reframed and answered more precisely.

Current protected doctrine:

```text
InvestorIQ does not require one monolithic Boss object shared by every report type.

InvestorIQ requires one shared Publish-or-Collapse Constitution.

Pipeline-specific Boss / orchestration is acceptable only if every report family obeys the same publication doctrine.
```

The governing constitutional behavior is now:

```text
CASE A:
Usable T12 + usable Rent Roll
+
some missing / omitted / unusable section facts
->
publish report;
collapse, omit, qualify, or disclose affected sections.

CASE B:
Complete usable T12 + complete usable Rent Roll
->
publish complete report.

CASE C:
Usable core T12 + Rent Roll
+
optional/support/downstream issues
->
publish report;
collapse, omit, qualify, or disclose affected sections.

CASE D:
Catastrophically unusable core T12 and/or Rent Roll
->
fail closed / block report.
```

Only true runtime, storage, PDF, platform, or catastrophic core-evidence failure may block a report that otherwise has substantially usable T12 and Rent Roll.

## Screening Delivery Gate defect found and closed

Bounded Sol audit found a real constitutional asymmetry in Screening.

Old Screening path:

```text
generate-client-report-impl.js
- initialized deliveryGateDecisionResult = null;
- rendered Screening HTML;
- sealed Screening output through runScreeningReportPipeline(...);
- returned before the shared buildDeliveryGateDecision(...) call;
- response carried null delivery decision / null delivery state;
- admin-run-worker.js treated missing delivery status as blocked.
```

Consequence:

```text
Screening could fail A, B, and C not because core evidence was bad,
but because Screening never reached the shared Delivery Gate.
```

This was an execution-order defect.

It was not a doctrine defect.

It was not proof that one monolithic Boss object was required.

## Screening execution-order fix accepted

Changed production file:

```text
api/_lib/generate-client-report-impl.js
```

Accepted result:

```text
- premature Screening returns were deferred;
- pre-gate Screening sealing block was removed;
- rendered Screening HTML is preserved in finalHtml;
- Screening now continues through the existing shared QA chain;
- Screening reaches the existing buildDeliveryGateDecision(...) call;
- Screening is sealed once after canonical delivery-state construction;
- response exposes worker-consumed canonical delivery authority fields.
```

Canonical fields now returned for Screening include:

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

Syntax proof:

```text
node --check api/_lib/generate-client-report-impl.js:
PASS.
```

Commit:

```text
b53b5a1
Fix Screening delivery-gate execution order
```

## Post-fix Screening A-D parity audit

Bounded post-fix audit result:

```text
A:
publish with collapse.
canonical delivery status reaching worker: deliverable.

B:
publish.
canonical delivery status reaching worker: deliverable.

C:
publish with collapse, omission, qualification, or disclosure.
canonical delivery status reaching worker: deliverable.

D:
fail closed.
canonical delivery status reaching worker: user_needs_documents.
worker treats it as held.
```

Remaining concrete production blocker within this bounded scope:

```text
none.
```

## Current CVF disposition

```text
CVF-25J FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH:
Protected through CustomerSurfaceModel provenance/completeness separation,
Repair preservation,
Orchestrator provenance regression guards,
and Delivery Gate fail-closed publication boundaries.

CVF-25K FINAL_DELIVERY_GATE_DOES_NOT_REQUIRE_FULL_FINAL_COMPLIANCE:
Protected through Final Decision FINAL-1 and FINAL-2,
Delivery Gate DELIVERY-1 through DELIVERY-5,
and worker/artifact fail-closed boundaries.

CVF-25L SCREENING_DELIVERY_GATE_EXECUTION_ORDER_NULL_DECISION:
CLOSED / protect.

Old condition:
Screening returned before shared Delivery Gate construction.

Accepted fix:
Screening now reaches the shared Delivery Gate and returns canonical delivery authority fields consumed by the worker.
```

## Permanent launch-readiness doctrine

```text
Core-Gated Publish-or-Collapse is now the governing constitutional doctrine.

Substantially usable T12 + substantially usable Rent Roll
->
publish.

Bad optional/support/downstream facts
->
collapse / omit / qualify / disclose.

Catastrophically unusable core evidence
or true runtime/storage/PDF/platform fatal
->
block.
```

Future work must preserve:

```text
Accepted Truth
Projection
Boss Contract
CustomerSurfaceModel
Repair
Orchestrator
Final Decision
Delivery Gate
Screening delivery-gate execution order
Shared Publish-or-Collapse Constitution
```

## Updated GPT-5.6 Sol workflow disposition

The first bounded Sol architecture trial is accepted as useful, with limits.

Approved pattern:

```text
bounded Sol architecture audit
-> narrow production fix only if required
-> Rob supplies receipt and changed file(s)
-> ChatGPT manually verifies real production file(s)
-> PASS / HOLD / BLOCKED
```

Permanent constraints:

```text
Do not trust Sol receipts by themselves.
Do not trust Codex receipts by themselves.
No broad repo rewrite.
No live services.
No RETEST.
No reopening protected handoffs without concrete current-code evidence.
```

Sol is useful for bounded architecture tracing.
Codex remains preferred for tiny surgical implementation prompts when the edit boundary is already known.

## Current phase

```text
Architecture reconstruction is substantially complete.

The project is now in final launch-readiness verification,
not broad architectural redesign.
```

Remaining work:

```text
Final completion-gate review.
Then, only if explicitly cleared, one controlled live Acquisition Memo RETEST.
```

## Fresh-chat continuation point

Rob will start a fresh chat after updating all three ledgers.

First task in fresh chat:

```text
Continue InvestorIQ from the July 11 Final Completion Gate.

Treat the uploaded MASTER, CVF, and Semantic Authority ledgers as current source of truth.

Current state:
- Steps 1-6 PASS / protect.
- Handoffs 1-8 PASS / protect.
- Delivery Gate PASS / protect.
- Screening delivery-gate execution-order fix PASS / protect.
- Shared Publish-or-Collapse Constitution confirmed across Screening and Acquisition Memo.
- Latest Screening fix commit: b53b5a1.
- Live Acquisition Memo RETEST remains locked.

Do not reopen Handoffs 1-8.
Do not restart old authority families.
Do not run live RETEST.
Do not run broad audits.

Next action:
final completion-gate review only.
```

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


## CVF July 11 update

```text
CVF-25J FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH:
Materially protected through CustomerSurfaceModel provenance/completeness separation, Repair preservation, and Orchestrator provenance regression guards.

CVF-25K FINAL_DELIVERY_GATE_DOES_NOT_REQUIRE_FULL_FINAL_COMPLIANCE:
Materially protected through Final Decision FINAL-1 and FINAL-2 plus Delivery Gate DELIVERY-1 through DELIVERY-5.

Current active CVF frontier:
Delivery / publication boundary residual fail-open audit.
Specifically inspect whether any downstream call site can still create a report record, storage artifact, or customer-ready response without explicit deliverable gate status and no hold_delivery.
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


## CVF-specific July 8 update

Current CVF-25 family refinement:

```text
CVF-25I ACCEPTED_TRUTH_PROVENANCE_LOCK_MISSING:
Materially protected through Handoffs 1–3 and CustomerSurfaceModel accepted-authority micros.

CVF-25B PURCHASE_ASSUMPTIONS_FALSE_MISSING:
Optional provenance/completeness defect closed;
duplicate-fact loss/ordering family remains relevant.

CVF-25D CURRENT_DEBT_CROSS_SURFACE_BINDING_INCONSISTENCY:
Accepted current-debt authority protected;
duplicate fact merge ordering remains relevant.

CVF-25J FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH:
SOURCEBACKED-1 through SOURCEBACKED-4 closed the known optional provenance/completeness conflation.
Repair/orchestrator handoffs remain pending.

NEW ACTIVE DUPLICATE-FACT SUBFAMILY:
same physical source
-> multiple pipeline representations
-> sequential pairwise fold
-> non-associative conflicting fact winner
-> order-dependent customer truth.
```

Active classification:

```text
DUPLICATE FACT AUTHORITY
+
WHOLE-COLLECTION ORDER DEPENDENCE
+
POTENTIAL FALSE MISSING / FALSE SURFACE FACT SELECTION
```

DUPFACT-4 is the current root-family micro.


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


## CVF-specific night close-out

```text
CVF-25I ACCEPTED_TRUTH_PROVENANCE_LOCK_MISSING:
Handoff 1 PASS / materially closed at accepted-truth boundary.

CVF-25B PURCHASE_ASSUMPTIONS_FALSE_MISSING:
Boss-side source-backed recognition defect materially closed in Handoff 3.

CVF-25C PURCHASE_ASSUMPTIONS_MISLABELED_EXISTING_DEBT:
Active Boss evidence-driven current-debt promotion path removed.

CVF-25D CURRENT_DEBT_CROSS_SURFACE_BINDING_INCONSISTENCY:
Boss accepted current-debt truth/source-backed chain materially repaired;
next downstream CustomerSurfaceModel handoff still pending.

CVF-25J FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH:
Boss handoff PASS;
downstream CustomerSurfaceModel -> repair -> orchestrator review still pending.

CVF-25K FINAL_DELIVERY_GATE_DOES_NOT_REQUIRE_FULL_FINAL_COMPLIANCE:
Step 6 PASS checkpoint remains protected.

LIVE RETEST:
LOCKED.
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



## CVF-specific checkpoint

```text
CVF-25I ACCEPTED_TRUTH_PROVENANCE_LOCK_MISSING:
Gate 1 contrary evidence found in final completion review.
Executable accepted-role rewrite reproduced.
One-file reconciler sovereignty repair completed.
Manual inspection PASS.
Three-case behavioral proof PASS.
Current disposition: materially closed at accepted-truth handoff.

CVF-25J FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH:
Step 5 provenance preservation remains PASS checkpoint.
Final completion review continues downstream.

CVF-25K FINAL_DELIVERY_GATE_DOES_NOT_REQUIRE_FULL_FINAL_COMPLIANCE:
Step 6 PASS checkpoint.
Dedicated unresolved_provenance_regression final classification added and proven.

LIVE RETEST:
LOCKED pending completion of Boss Contract -> CustomerSurfaceModel -> repair
-> orchestrator -> final decision -> delivery gate manual review.
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

## CVF status update at fd80bb7

```text
CVF-25J FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH:
Material Step 5 remediation PASS checkpoint.

Closed mechanisms:
- repair no longer clears source-backed factAvailability truth;
- original pre-repair baselines remain authoritative;
- initial and later repair seams detect provenance regression;
- repaired self-consistency cannot silently substitute for original truth.

CVF-25K FINAL_DELIVERY_GATE_DOES_NOT_REQUIRE_FULL_FINAL_COMPLIANCE:
First P0 defect CLOSED.

Closed mechanism:
- publishable now requires complianceOk.

Behavioral proof:
- cleaned later-retry provenance test changed from deliverable to blocked.

CVF-25K broader family:
ACTIVE until remaining AUTH-092 through AUTH-105 obligations are reviewed.

LIVE RETEST:
LOCKED until Step 6 completion and final anti-whack-a-mole manual review.
```


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

## CVF ledger status update

Current disposition:

```text
CVF-25J false-collapse / repair-induced truth destruction seam:
CONCRETE SECTION-BOUNDARY DEFECT CLOSED.

CVF-25 broader immutable provenance / repair mutation risk:
ACTIVE NEXT under Step 5.

CVF-25K final delivery gate integrity:
LATER / AUTH-092 through AUTH-105.
```

The exact closed subfamily is:

```text
collapseSectionByTitle cross-section collateral deletion
-> unrelated source-backed validator evidence lost
-> post-repair fatal_core manufactured
```

Do not reopen that subfamily unless new evidence appears.

---

# InvestorIQ Core Valid Failure Path Family Ledger

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

### CVF classification

Current active subfamily:

```text
CVF-25J / CVF-25 repair-induced truth destruction seam
```

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


## CVF-25 remediation execution status

The AUTH ledger has now moved into active remediation.

Current dependency order executed:

```text
STEP 1
Immutable accepted source identity + accepted role sovereignty + provenance preservation.

STEP 2
Downstream role reclassification fences + accepted-role-aware projection.

STEP 3
One canonical acquisition-loan fact family + unauthorized alias pruning.
```

## Step 1 CVF disposition

Initial Codex PASS was rejected after direct code review because AUTH-043 remained executable.

Confirmed forbidden path:

```text
purchase_assumptions
-> promoteCurrentDebtSupportDoc(...)
-> current_debt_context
```

Completion gate removed purchase callers and added defensive accepted-provenance rejection.

Current CVF effect:

```text
CVF-25C materially improved.
AUTH-043 direct Boss promotion path closed.
AUTH-039 physical identity dedupe improved.
AUTH-057 accepted provenance preservation improved.
```

Disposition:

```text
STEP 1 PASS / protect.
```

## Step 2 CVF disposition

Initial Codex PASS was rejected because:

```text
accepted roles could still downgrade to otherSupportDocs through taxonomy mismatch;
acceptedProvenanceRole still consumed broader canonicalRole/role fields.
```

Completion gate fixed:

```text
renovation_capex_context
appraisal_valuation_context
environmental_due_diligence_context
```

projection recognition and accepted-provenance-only role reading.

Current CVF effect:

```text
AUTH-030 / AUTH-032 materially improved.
AUTH-040 further constrained.
AUTH-043 regression fence preserved.
```

Disposition:

```text
STEP 2 PASS / protect.
```

## Unauthorized alias expansion incident

Codex added unrequested role aliases during Step 2.

This created a new process-control lesson:

```text
No speculative compatibility.
No extra aliases.
No future-proofing.
No authority expansion without evidence.
```

Step 3A therefore pruned the alias map back to exactly three evidence-backed mappings.

Disposition:

```text
STEP 3A PASS.
```

## Step 3B CVF disposition — currently HOLD

Target CVF family:

```text
CVF-25B Purchase Assumptions false missing
AUTH-001 Purchase loan alias mismatch
AUTH-028 projection checklist exact proposed_loan_amount dependency
```

Exact allowed structured alias family:

```text
proposed_loan_amount
stated_acquisition_loan_amount
derived_acquisition_loan_amount
loan_amount
```

Canonical output:

```text
proposed_loan_amount
```

Manual review found two blockers in Codex's PASS implementation.

### Blocker 1 — null/empty coercion to zero

Unsafe implementation pattern:

```text
Number(candidate)
```

can turn:

```text
null
""
"   "
```

into:

```text
0
```

This can suppress a real lower-priority valid alias.

### Blocker 2 — projection/Boss disagreement persists

Projection checklist still consumes:

```text
purchaseAssumptions.extractedFacts.proposed_loan_amount
```

before Boss performs canonical alias normalization.

Therefore:

```text
Projection truth can report missing
while Boss truth reports available.
```

This violates the intended one-canonical-read-key contract.

Current status:

```text
STEP 3B HOLD.
STEP 3 COMPLETION GATE ACTIVE.
```

## Current stop conditions

Do not:

```text
begin Step 4;
touch false-collapse repair yet;
touch orchestrator provenance preservation yet;
touch final delivery gate yet;
run live RETEST;
run DocRaptor;
write Supabase;
run paid/API loops;
run broad smoke wall;
touch Screening;
commit Step 3 until manual review accepts the completion gate.
```

## Fresh-chat CVF handoff

First user message will be:

```text
Codex Step 3 Completion Gate reply
```

Immediate task:

```text
Review PASS / HOLD / BLOCKED.

Then inspect actual changed:
api/_lib/acquisition-memo-projection.js
api/_lib/acquisition-memo-boss-contract.js

Do not accept green tests alone.
```



---

# July 6, 2026 CVF Addendum — CVF-25 Manual Evidence Audit Completed Through AUTH-105 / False-Collapse Runtime Chain Proven / Codex Micro-Prompt Remediation Next

## Current controlling CVF status

This addendum supersedes the earlier July 6 “manual file-by-file evidence review required” checkpoint.

A dedicated evidence ledger has now been created:

```text
!!!INVESTORIQ_SEMANTIC_AUTHORITY_EVIDENCE_LEDGER_AUTH001_AUTH105_JULY6_2026.md
```

It preserves:

```text
AUTH-001 through AUTH-105
```

from direct manual inspection of the real production pipeline.

## CVF-25 status

```text
CVF-25 SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE:
CONFIRMED / ROOT FAMILY MAPPED / REMEDIATION NEXT
```

The manual audit proved the active topology is not one isolated defect.

Controlling root:

```text
duplicate semantic role authority
+
duplicate fact writer authority
+
accepted-truth provenance not immutable
+
false-collapse compliance laundering
+
final delivery gate integrity failure
```

## CVF-25I — Accepted Truth Provenance Lock Missing

Status:

```text
CONFIRMED across multiple production layers.
```

Representative AUTH findings:

```text
AUTH-006
AUTH-017
AUTH-039
AUTH-046
AUTH-047
AUTH-057
AUTH-075
AUTH-079
AUTH-084
AUTH-086
AUTH-097
AUTH-105
```

Confirmed violations include:

```text
raw parser semantic fields can leak downstream;
display labels can help prove semantic truth;
same physical source can survive under conflicting roles;
Boss sourceTruth is synthesized from merged stages;
Boss normalization drops accepted provenance fields;
CustomerSurfaceModel receives canonical + projection + Boss simultaneously;
repair mutates both CustomerSurfaceModel and Boss Contract;
final decision receives repaired state without original baseline;
no pre/post provenance delta guard exists.
```

Required invariant:

```text
raw accepted evidence
-> parsed artifact
-> canonical role
-> reconciled accepted truth
-> projection
-> CustomerSurfaceModel
-> Boss Contract
-> final delivery

No incompatible drift.
```

## CVF-25J — False Collapse of Source-Backed Truth

Status:

```text
FULLY CONFIRMED IN CODE AND RUNTIME FLOW.
```

Direct repair mutation:

```text
section.status = collapsed
factAvailability.available = []
factAvailability.missing = []
factAvailability.sourceBacked = false
```

Representative AUTH findings:

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
AUTH-078
AUTH-079
AUTH-080
AUTH-081
AUTH-082
AUTH-083
AUTH-084
AUTH-085
AUTH-086
AUTH-088
AUTH-089
AUTH-090
AUTH-096
AUTH-098
AUTH-105
```

Proven runtime chain:

```text
sourceBacked true
-> validator detects missing rendered truth
-> repair maps issue to repairable optional/support section
-> repair collapses section
-> available facts cleared
-> missing facts cleared
-> sourceBacked set false
-> same repair applied to CustomerSurfaceModel and Boss Contract
-> repaired state revalidated
-> rerender against downgraded truth
-> repaired state can self-validate
-> final decision sees repaired state
-> final delivery may proceed
```

This is the exact forbidden pattern previously described only as doctrine.

## CVF-25A — Unit Mix False Collapse

Status:

```text
CONFIRMED MECHANISM / VERY HIGH RETEST 20 CAUSATION.
```

Key AUTH evidence:

```text
AUTH-049
AUTH-059
AUTH-060
AUTH-064
AUTH-078
AUTH-079
AUTH-080
AUTH-081
AUTH-082
AUTH-084
AUTH-090
```

## CVF-25B — Purchase Assumptions False Missing

Status:

```text
CONFIRMED MULTI-LAYER CONTRACT RISK / HIGH RETEST 20 CAUSATION.
```

Key AUTH evidence:

```text
AUTH-001
AUTH-016
AUTH-017
AUTH-023
AUTH-028
AUTH-043
AUTH-051
AUTH-056
AUTH-062
AUTH-063
AUTH-065
AUTH-078
AUTH-079
AUTH-084
```

## CVF-25C — Purchase Assumptions Mislabeled Existing Debt

Status:

```text
CONFIRMED CODE PATHS / EXTREMELY HIGH LIVE CAUSATION.
```

Key AUTH evidence:

```text
AUTH-004
AUTH-016
AUTH-023
AUTH-039
AUTH-043
AUTH-044
```

Critical confirmed path:

```text
Boss explicitly attempts:
purchase_assumptions
-> promoteCurrentDebtSupportDoc(...)
-> current_debt_context
```

## CVF-25D — Current Debt Cross-Surface Binding Inconsistency

Status:

```text
CONFIRMED ARCHITECTURAL MECHANISM / VERY HIGH LIVE CAUSATION.
```

Key AUTH evidence:

```text
AUTH-002
AUTH-020
AUTH-033
AUTH-050
AUTH-055
AUTH-061
AUTH-063
AUTH-079
AUTH-082
AUTH-084
```

## CVF-25E — Appraisal Cap Rate to Interest Rate Alias

Status:

```text
PARTIALLY CONFIRMED / HIGH CAUSATION CANDIDATE.
```

Key AUTH evidence:

```text
AUTH-008
AUTH-022
```

Confirmed:

```text
canonical appraisal extraction omits stabilized_cap_rate and stabilized_noi;
generic interest_rate alias can survive elsewhere.
```

## CVF-25F — Break-Even Occupancy

Status:

```text
OWNER NOT YET CONFIRMED IN AUTH-001 THROUGH AUTH-105.
```

Known:

```text
projection is not owner;
CustomerSurfaceModel reads coreMetrics.breakEvenOccupancy rather than calculating it.
```

Do not hardcode 34.4.

Continue metric-owner trace separately when scheduled.

## CVF-25G — Rent-Upside Value Semantics

Status:

```text
NOT RESOLVED IN AUTH-001 THROUGH AUTH-105.
```

Continue renderer/document audit separately.

## CVF-25H — Asset Class / Identity Alias

Status:

```text
NOT RESOLVED IN AUTH-001 THROUGH AUTH-105.
```

Known:

```text
CustomerSurfaceModel consumes propertyProfile assetClass/asset_class.
```

## New final-gate subfamily under CVF-25

### CVF-25K — FINAL_DELIVERY_GATE_DOES_NOT_REQUIRE_FULL_FINAL_COMPLIANCE

Status:

```text
CONFIRMED P0.
```

Key AUTH evidence:

```text
AUTH-092
AUTH-093
AUTH-094
AUTH-095
AUTH-099
AUTH-100
AUTH-103
AUTH-104
```

Critical findings:

```text
complianceOk is computed but unused by publishable;
bossOk is not directly required by publishable;
htmlOk is not directly required by publishable;
unsafeFinalHtml only blocks a narrow subset of HTML failures;
final decision has no immutable source-truth baseline;
final decision has no truth-regression blocking category.
```

## CVF root-family remediation order

Do not send Codex 105 disconnected patches.

Use dependency-ordered micro families.

### Micro Family 1 — Immutable source provenance + one accepted role authority

Targets:

```text
AUTH-005
AUTH-006
AUTH-015
AUTH-016
AUTH-017
AUTH-018
AUTH-021
AUTH-023
AUTH-039
AUTH-040
AUTH-043
AUTH-044
AUTH-057
AUTH-071
```

### Micro Family 2 — One canonical fact schema

Targets:

```text
AUTH-001
AUTH-002
AUTH-019
AUTH-020
AUTH-022
AUTH-028
AUTH-041
AUTH-042
AUTH-045
```

### Micro Family 3 — No false collapse of source-backed truth

Targets:

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

### Micro Family 4 — Repair/orchestrator provenance preservation

Targets:

```text
AUTH-078 through AUTH-091
```

### Micro Family 5 — Final delivery gate integrity

Targets:

```text
AUTH-092 through AUTH-105
```

## Codex usage preservation is now part of CVF control

Rob explicitly requires usage discipline.

Future Codex prompts must:

```text
- use the AUTH ledger as evidence;
- not rerun broad investigations;
- not rediscover architecture;
- operate one root family at a time;
- use compact receipts;
- prefer node --check;
- use targeted rg;
- use smallest relevant test;
- avoid broad smoke walls unless genuinely required;
- avoid live services;
- avoid DocRaptor;
- avoid Supabase writes;
- avoid paid/API loops;
- preserve Screening;
- avoid RETEST until coherent category fixes are complete.
```

## Fresh CVF handoff

Upload:

```text
1. Updated MASTER
2. This updated CVF
3. AUTH-001 through AUTH-105 evidence ledger
```

Then:

```text
Do not restart audit.
Do not request broad Codex investigation.

First task:
Design the smallest safe dependency-ordered Codex micro-prompt sequence from the AUTH ledger.

Codex executes the evidence map.
Codex does not rediscover the pipeline.

Preserve usage.
No broad smoke wall by default.
No live services.
No Screening changes unless strictly necessary.
No RETEST until coherent root-family fixes are complete.
```

## Current stop conditions

Do not run:

```text
another broad Codex audit;
another live Acquisition Memo RETEST;
production DocRaptor;
Supabase writes;
paid/API loops;
public samples;
high-value outreach PDFs;
mass deletion;
Screening changes without explicit evidence.
```

## Current CVF continuation point

```text
July 6 CVF checkpoint.

CVF-24:
Broken through / protect.

CVF-25:
Confirmed and mapped through AUTH-105.

CVF-25I:
Accepted Truth Provenance Lock Missing — CONFIRMED.

CVF-25J:
False Collapse of Source-Backed Truth — FULLY CONFIRMED.

CVF-25K:
Final Delivery Gate Does Not Require Full Final Compliance — CONFIRMED P0.

Next:
Usage-disciplined Codex micro-prompt remediation in dependency order.
```

---
# July 6, 2026 CVF Addendum — RETEST 20 Live Publish PASS / CVF-24 Broken Through / CVF-25 Semantic Authority Pollution Opened / Manual File-by-File Evidence Review Required

## Current CVF status

This update supersedes the July 1 CVF-24 finalization-reset checkpoint as the active Core Valid Failure Path ledger checkpoint.

Major change:

```text
CVF-24 ACQUISITION_MEMO_FINALIZATION_CONTRACT_BROKEN:
LIVE FAILURE FAMILY BROKEN THROUGH by RETEST 20.
Acquisition Memo published end to end.

However, RETEST 20 exposed a new launch-critical family:
CVF-25 SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE.
```

Current posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect.
RETEST 20 parsed both successfully.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE / PARTIAL.
Calculations avoided forbidden debt modeling, but customer-facing role/treatment remains contradictory.

CVF-05 V2 containment:
PASS / protect.
No DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD leakage observed in RETEST 20.

CVF-13 Runtime/render stability:
PASS checkpoint for RETEST 20 live publication.
Report rendered, PDF generated, stored, published, emailed.

CVF-15 Acquisition Memo final document ownership / customer artifact quality:
ACTIVE / HOLD.
Pipeline owns and publishes final artifact, but customer truth is not yet reliable enough for paid launch.

CVF-16 Boss Contract / CustomerSurfaceModel / final decision:
IMPROVED / final-delivery authority real.
Do not regress.
New gap is provenance integrity and false-collapse prevention.

CVF-17 Test-report hardcoding risk:
PROTECT.
No production fixture hardcoding allowed.
New bad-oracle issue confirmed for break-even occupancy expectation.

CVF-18 Shared legacy customer-output authority:
IMPROVED for execution authority.
Still WATCH for upstream semantic writers/readers.

CVF-19 Product lane sealing:
PASS checkpoint for live publication.
Screening remains protected.

CVF-20 Customer-facing launch hygiene:
PASS / protect.

CVF-21 Final Boss compliance gate disagreement:
BROKEN THROUGH in RETEST 20.
No 500.

CVF-24 Acquisition Memo finalization contract broken:
PASS checkpoint / archive as live failure family broken through.

NEW ACTIVE FAMILY:
CVF-25 SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE.
```

## CVF-24 RETEST 20 disposition

Live job path:

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

Accepted conclusion:

```text
The recurring Final Acquisition Memo V2 HTML failed Boss compliance / true_core_fatal / route-500 family did not recur.
```

CVF-24 disposition:

```text
BROKEN THROUGH / protect.
Do not reopen by weakening final decision, repair, Boss, sealed lane, or delivery handoff.
```

## CVF-25 — SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE

Issue:

```text
A live Acquisition Memo can publish successfully while accepted source truth is lost, misbound, relabeled, downgraded, or collapsed across customer surfaces.
```

This is now the launch-critical family.

### CVF-25A — UNIT_MIX_SOURCE_BACKED_TRUTH_FALSE_COLLAPSE

Observed:

```text
Live Rent Roll:
- 64 units;
- structured unit_mix;
- 32 x 1BR;
- 32 x 2BR;
- detailed unit rows.

Final PDF:
Unit Mix and Rent Positioning section omitted for lack of display-ready detail.
```

Classification:

```text
Source-backed core truth existed.
Customer section collapsed anyway.
```

Required invariant:

```text
Core/source-backed Unit Mix must bind/render from sovereign facts before collapse is permitted.
```

### CVF-25B — PURCHASE_ASSUMPTIONS_FALSE_MISSING

Observed live parser truth:

```text
semantic_doc_role: purchase_assumptions
debt_basis: acquisition_financing_assumption
purchase price / loan / LTV / rate / amortization / fee accepted
```

Final PDF:

```text
No purchase assumptions uploaded.
Purchase assumptions provided: No.
```

Classification:

```text
Accepted truth propagation failure.
```

### CVF-25C — PURCHASE_ASSUMPTIONS_MISLABELED_AS_EXISTING_DEBT

Raw source says:

```text
purchase assumptions and proposed acquisition financing only;
not current mortgage;
not existing debt.
```

Final Document Treatment says:

```text
Existing Debt Context — Current Mortgage / Debt Statement
```

Classification:

```text
Customer-facing provenance violation.
Likely duplicate/orphaned authority or unauthorized stale reader.
```

### CVF-25D — CURRENT_DEBT_CROSS_SURFACE_BINDING_INCONSISTENCY

Raw source facts:

```text
$6,800,000 balance
4.85% rate
24 years remaining
$39,250 monthly payment
2029-11-01 maturity
```

Final PDF:

```text
Dedicated Debt / Financing Context collapsed.
Document Treatment later displayed the facts.
```

Classification:

```text
Partial propagation.
One surface consumes truth; another surface falsely collapses.
```

### CVF-25E — APPRAISAL_CAP_RATE_TO_INTEREST_RATE_ALIAS

Raw source:

```text
Stabilized Cap Rate: 7.40%
```

Final customer surface:

```text
Interest Rate: 7.40%
```

Classification:

```text
Field semantic aliasing / unauthorized generic rate mapping.
```

### CVF-25F — BREAK_EVEN_OCCUPANCY_SEMANTIC_ALIAS_AND_BAD_ORACLE

Expected-results file currently says:

```text
Expense Ratio: 37.0%
Break-Even Occupancy: 37.0%
```

Core T12:

```text
Gross Potential Rent: 1,612,800
Effective Gross Income: 1,500,000
Operating Expenses: 555,000
```

Current launch-mode metric definition:

```text
Operating Break-Even Occupancy
= Operating Expenses / Gross Potential Rent
≈ 34.4%
```

The current 37.0% is:

```text
Operating Expenses / Effective Gross Income
```

which is Expense Ratio.

Classification:

```text
Production derived metric wrong.
QA oracle also wrong.
Tests can pass while math is wrong.
```

### CVF-25G — RENT_UPSIDE_VALUE_SEMANTICS_AMBIGUOUS

Observed table capitalizes:

```text
Annual Gross Rent Upside $285,600
```

at:

```text
5%
6%
7%
```

Current label:

```text
Implied Value Sensitivity at Stabilization
```

Preferred:

```text
Illustrative Capitalized Rent-Upside Sensitivity
```

Classification:

```text
Arithmetic correct.
Semantic label can imply whole-property value when table is rent-upside value only.
```

### CVF-25H — ASSET_CLASS_IDENTITY_ALIAS

Observed:

```text
ASSET CLASS: 64-Unit
```

Classification:

```text
Unit count / asset identity being used as asset class.
Lower priority but customer-facing.
```

## CVF-25 root topology

The active root is not merely legacy code.

Classify all relevant production files/functions into:

```text
DELETE
STRIP_AUTHORITY
CONSOLIDATE_DUPLICATE_AUTHORITY
ORPHANED_AUTHORITY
REPLACE
KEEP
```

Definitions:

### DELETE

```text
No production runtime reachability or current architectural purpose.
Delete from main after proof.
Preserve in Git history/tag/archive branch.
```

### STRIP_AUTHORITY

```text
Runtime needed, but must not assign/reinterpret customer semantic truth.
Keep extraction/runtime mechanics only.
```

### CONSOLIDATE_DUPLICATE_AUTHORITY

```text
Two active modules independently own the same semantic decision.
Choose one sovereign owner.
Remove competing authority.
```

### ORPHANED_AUTHORITY

```text
A module writes semantic output ignored by the official path but consumed by a side-door path.
Trace stale writer + unauthorized reader.
Redirect reader to sovereign truth or remove stale field.
```

### REPLACE

```text
Runtime functionality required but semantic entanglement too polluted for safe incremental stripping.
```

### KEEP

```text
Legitimate bounded current owner.
```

## Required writer/reader audit

CVF-25 cannot be solved by writer search alone.

For every semantic field, trace:

```text
WRITER
REWRITER
RAW/STABLE FIELD
OFFICIAL SOVEREIGN CONSUMER
SIDE-DOOR CONSUMER
CUSTOMER SURFACE
```

Especially:

```text
semantic_doc_role
canonicalRole
acceptedSemanticDocRole
debt_basis
acceptedDebtBasis
interest_rate
cap_rate
stabilized_cap_rate
sourceBacked
factAvailability
section.status
collapse eligibility
customer display label
```

## Boss doctrine update

Do not regress to:

```text
Boss is still advisory.
```

Current accepted status:

```text
Boss is real final-delivery authority.
```

New missing constitutional protections:

### CVF-25I — ACCEPTED_TRUTH_PROVENANCE_LOCK_MISSING

Required chain:

```text
raw accepted evidence
-> parsed artifact
-> canonical role
-> reconciled accepted truth
-> projection
-> CustomerSurfaceModel
-> Boss Contract
```

Boss/model must detect incompatible drift.

Examples:

```text
purchase assumptions -> current debt
appraisal cap rate -> interest rate
current debt -> proposed financing
market survey -> Rent Roll authority
```

### CVF-25J — FALSE_COLLAPSE_OF_SOURCE_BACKED_TRUTH

Forbidden:

```text
sourceBacked true upstream
-> repair/collapse
-> sourceBacked false
-> report passes
```

Required:

```text
source-backed facts exist
-> rebind/reconstruct
-> render
-> revalidate
-> collapse only if truly unavailable, contradictory/unusable, or deterministically unrenderable
```

## Legacy quarantine / deletion doctrine

Execution-authority quarantine was real and materially successful.

However:

```text
Proven-dead code should no longer remain active in main merely because Git history exists.
```

Current decision:

```text
Delete proven-dead code from main after reachability proof.
Preserve through:
- Git history;
- tag;
- archive branch;
- optional separate private archive repo.
```

Do not mass-delete.

Required pre-delete proof:

```text
no static import;
no dynamic import;
no require/factory registry;
no string/path reference;
no worker root reachability;
no route root reachability;
no required admin/migration role.
```

## New mandatory execution workflow

This is now controlling:

> **We inspect the real production files ourselves, one by one, build the authority map from evidence, and only then write the final Codex execution prompt.**

Required sequence:

```text
1. Fresh chat begins with updated MASTER and CVF files.
2. No Codex prompt first.
3. ChatGPT requests one exact production file.
4. ChatGPT inspects it directly.
5. Record:
   - reachability;
   - semantic WRITES;
   - semantic READS;
   - raw/stale field consumption;
   - competing owner;
   - collapse authority;
   - customer-label authority;
   - classification.
6. Choose next file from discovered evidence.
7. Repeat until launch-critical authority map is complete enough.
8. Only then write final Codex execution prompt.
9. Codex executes the evidence-backed map; it does not rediscover architecture from scratch.
```

Controlling prohibitions:

```text
No Codex-first guessing.
No broad audit receipt as substitute for our own code reading.
No smoke-test-first workflow.
No one-symbol patches.
No mass deletion before reachability proof.
```

## Recommended first file in next chat

Request first:

```text
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Why:

```text
It is supposed to be the Boss-owned customer truth boundary.
RETEST 20 contradictions directly implicate:
- purchaseAssumptionsPresent;
- currentDebtPresent;
- Unit Mix sourceBacked/status;
- section status/factAvailability;
- rate semantics;
- raw vs reconciled support truth consumption.
```

Next file must be selected based on evidence.

Likely candidates:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
api/_lib/canonical-source-package.js
api/_lib/document-treatment-authority.js
api/_lib/acquisition-memo-v2-boss-repair.js
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-document.js
api/_lib/acquisition-memo-v2-orchestrator.js
api/_lib/acquisition-memo-projection.js
api/_lib/generate-client-report-impl.js
api/admin-run-worker.js
```

## Launch-critical CVF priority this week

P0:

```text
CVF-25A Unit Mix false collapse
CVF-25B Purchase Assumptions false missing
CVF-25C Purchase Assumptions mislabeled as Existing Debt
CVF-25D Current Debt cross-surface binding inconsistency
CVF-25E Appraisal cap rate -> interest rate
CVF-25F Break-even math + bad oracle
CVF-25G Rent-upside vs whole-property value semantics
CVF-25J False collapse of source-backed truth
```

P1:

```text
CVF-25H Asset class/identity alias
sparse collapsed-page polish
document treatment presentation polish
```

P2:

```text
broader dead-code cleanup outside launch-critical reachability
```

## Current stop conditions

Do not run:

```text
another broad Codex audit;
the previously drafted semantic purge prompt yet;
another live Acquisition Memo RETEST;
broad smoke wall as proof;
mass deletion;
production DocRaptor;
public sample/high-value outreach PDF;
Screening changes without explicit reason.
```

Do not patch by:

```text
hardcoding 34.4;
hardcoding test values;
renaming one HTML string while duplicate semantic owners remain;
forcing Unit Mix from fixture-specific values;
weakening Boss;
weakening CustomerSurfaceModel;
allowing repair to erase sourceBacked truth;
changing tests to bless wrong source semantics.
```

## Fresh CVF continuation point

```text
July 6 CVF checkpoint.

CVF-24 recurring final Boss compliance / route-500 family:
BROKEN THROUGH in RETEST 20.
Live Acquisition Memo published end to end.

New active family:
CVF-25 SEMANTIC_AUTHORITY_POLLUTION_AND_FALSE_COLLAPSE.

Live defects:
- source-backed Unit Mix collapsed;
- Purchase Assumptions parsed but reported missing;
- Purchase Assumptions source mislabeled as Existing Debt;
- Current Debt facts appear in Document Treatment but dedicated section collapses;
- Appraisal Stabilized Cap Rate 7.40% displayed as Interest Rate 7.40%;
- Break-Even Occupancy wrongly outputs 37.0%;
- expected-results oracle wrongly expects same 37.0%;
- rent-upside capitalized value table has ambiguous stabilization/value label;
- Asset Class shows 64-Unit.

Root classes:
DELETE
STRIP_AUTHORITY
CONSOLIDATE_DUPLICATE_AUTHORITY
ORPHANED_AUTHORITY
REPLACE
KEEP

Boss status:
real final-delivery authority.
Missing invariants:
- Accepted-Truth Provenance Lock;
- No False Collapse of Source-Backed Truth.

Mandatory workflow:
We inspect the real production files ourselves, one by one, build the authority map from evidence, and only then write the final Codex execution prompt.

Fresh chat:
Rob uploads updated MASTER and CVF files first.
Then ask for:
api/_lib/acquisition-memo-v2-customer-surface-model.js

Inspect it directly.
Choose the next file from evidence.
No Codex prompt until the authority map is evidence-backed enough to execute.
Goal: launch-critical semantic authority purge this week.
```

---

# Archived Previous CVF Checkpoints Below

---
# July 1, 2026 CVF Addendum — CVF-24 Opened / Acquisition Memo Final Boss Compliance Loop Still Broken / Full Pipeline Reset Required

## Current CVF status

This update supersedes the June 28 night CVF-23 PASS checkpoint as the active Core Valid Failure Path ledger checkpoint.

The June 28 audit PASS is no longer sufficient as a launch-readiness checkpoint for Acquisition Memo because live post-audit testing exposed the same recurring Final Acquisition Memo V2 Boss compliance failure family.

Current posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect. Latest Acquisition Memo failure was not caused by unusable core docs. T12 and Rent Roll parsed successfully.

CVF-04 Current debt / proposed acquisition separation:
IMPROVED but still implicated. Current debt role authority was improved and committed, but final Boss still flagged current debt facts as missing/source-backed in the final rendered surface.

CVF-05 V2 containment:
PROTECT. Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD.

CVF-13 Runtime/render stability:
ACTIVE. Acquisition Memo still returns 500 from final Boss compliance path after final HTML generation.

CVF-15 Acquisition Memo final document ownership / customer artifact quality:
ACTIVE / BLOCKED. Final HTML exists, but final customer-surface validation/Boss/final decision disagree and block publication.

CVF-16 Boss Contract / CustomerSurfaceModel / final decision authority:
ACTIVE / NOT CLOSED. CustomerSurfaceModel can pass while HTML validation and final Boss compliance fail; final decision can misclassify repairable display omissions as true_core_fatal.

CVF-17 Test-report hardcoding risk:
PROTECT. Continue no Stonebridge / Attack / RETEST / fixture-value production hardcoding.

CVF-18 Shared legacy customer-output authority:
WATCH. Route authority smokes passed, but the final route/API still returns 500 for Acquisition Memo final Boss compliance. Need full path inspection.

CVF-19 Product lane sealing:
Screening sealed lane PASS.
Acquisition sealed lane exists but does not yet guarantee publish-safe finalization.

CVF-20 Customer-facing launch hygiene:
PASS / protect. Safe failure copy works.

CVF-21 Final Boss compliance gate disagreement:
REOPENED / CONFIRMED LIVE. Same family still failing.

NEW ACTIVE FAMILY:
CVF-24 ACQUISITION_MEMO_FINALIZATION_CONTRACT_BROKEN.
```

## CVF-24 — ACQUISITION_MEMO_FINALIZATION_CONTRACT_BROKEN

Issue:

```text
Valid-core Acquisition Memo reports can still fail closed at final Boss/customer-surface HTML compliance even when coreGate says publish is allowed and there are no core fatal reasons.
```

Latest live failure:

```text
Report generation failed (500)
Final Acquisition Memo V2 HTML failed Boss compliance
```

Status path:

```text
queued -> extracting -> underwriting -> scoring -> rendering -> failed
```

Core artifacts:

```text
T12 parsed successfully.
Rent Roll parsed successfully.
Validator rollup accepted:
- rent_roll_parsed
- t12_parsed
- ai_support_doc_recovery_diagnostic
```

Finalization artifacts:

```text
finalHtmlLength: ~20840
bossContractValidationResult.ok: true
customerSurfaceModelValidation.ok: true
customerSurfaceHtmlValidation.ok: false
finalBossComplianceOk: false
repairAttempted: false
```

Blocking violations:

```text
HTML_UNIT_MIX_LABEL_MISSING
UNIT_MIX_REQUIRED_WHEN_STRUCTURED_RENT_ROLL_EXISTS
CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED
```

Core contradiction:

```text
coreGate.publishAllowed: true
coreGate.fatalReasons: []
```

But final delivery decision reported:

```text
fatalCategory: true_core_fatal
report_blocked: true
blockingReasons:
- true_core_fatal
- repairable_optional_support_unresolved_after_repair
```

CVF conclusion:

```text
This is a finalization contract failure, not a parser failure.
This is a gate-classification/repair-execution/render-surface alignment failure.
```

## Why CVF-24 is not another single issue

The failure shows multiple layers disagree:

```text
Parser/source package has facts.
CustomerSurfaceModel can be valid.
Renderer may omit required visible sections.
HTML validator flags missing labels/sections.
Repair plan can identify repairable surfaces.
Repair is not attempted.
Final decision mislabels valid-core display omissions as true_core_fatal.
Route/API returns 500.
```

This proves the previous loop is still alive:

```text
Final Acquisition Memo V2 HTML failed Boss compliance.
```

No more one-off fixes should be accepted until the full finalization contract is mapped and repaired.

## Screening CVF update

Screening now has a live end-to-end PASS through:

```text
sealed output;
worker report identity;
download artifact creation;
DocRaptor test-mode watermarked PDF render;
storage verify;
dashboard READY;
download works.
```

Screening remaining items are polish/quality cleanup, not current architecture blockers.

Protect Screening during CVF-24.

## Current stop conditions

Do not run:

```text
additional Acquisition Memo live retests;
production DocRaptor;
production PDF mode;
Supabase writes from local tests;
paid/API loops;
public samples;
Ken Dunn / high-value outreach PDFs;
launch marketing PDFs;
broad smoke walls;
another one-off Codex patch.
```

## Required next-chat approach

The next fresh chat must not start by drafting a Codex prompt.

First step:

```text
Ask Rob to upload/provide the exact repo files and latest artifacts needed to inspect the entire Acquisition Memo finalization pipeline.
```

Likely files to request:

```text
api/_lib/generate-client-report-impl.js
api/_lib/generate-client-report-handler.js
api/generate-client-report.js
api/_lib/acquisition-memo-v2-pipeline.js
api/_lib/acquisition-memo-v2-orchestrator.js
api/_lib/acquisition-memo-v2-document.js
api/_lib/acquisition-memo-v2-customer-surface-model.js
api/_lib/acquisition-memo-v2-boss-repair.js
api/_lib/acquisition-memo-v2-final-decision.js
api/_lib/acquisition-memo-boss-contract.js
api/_lib/acquisition-memo-v2-role-reconciler.js
api/_lib/canonical-source-package.js
api/_lib/document-treatment-authority.js
api/_lib/report-delivery-output.js
api/admin-run-worker.js
```

Likely tests to request:

```text
tests/qa/acquisition-memo-current-debt-role-reconciliation-smoke.js
tests/qa/acquisition-triangle-collapse-finalhtml-smoke.js
tests/qa/acquisition-memo-v2-sealed-lane-authority-smoke.js
tests/qa/acquisition-memo-v2-final-boss-compliance-collapse-smoke.js
tests/qa/acquisition-memo-v2-boss-repair-collapse-smoke.js
tests/qa/acquisition-memo-v2-publish-or-collapse-smoke.js
tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js
tests/qa/generate-client-report-zero-authority-sealed-output-smoke.js
tests/qa/generate-client-report-sealed-dispatcher-smoke.js
```

## Fresh CVF continuation point

```text
July 1 CVF checkpoint.

CVF-24 is now active:
ACQUISITION_MEMO_FINALIZATION_CONTRACT_BROKEN.

Latest Acquisition Memo live retest failed again with:
Report generation failed (500)
Final Acquisition Memo V2 HTML failed Boss compliance.

This is the same failure family as prior RETEST 19/20 issues and cannot be treated as "just the next issue."

Core gate said:
publishAllowed true;
fatalReasons empty.

But final decision still labeled the outcome:
true_core_fatal;
report_blocked true.

Boss/customer-surface violations:
- missing unit mix labels / source-backed unit mix render;
- current debt facts required when source-backed.

CustomerSurfaceModel passed, but HTML validation/final Boss failed.
Repair plan existed, but repairAttempted was false.
Route returned 500.

Doctrine breach:
Valid core Acquisition Memo reports must publish by rendering, repairing, collapsing, or disclosing repairable surfaces.
They must not fail closed unless true core fatal or true runtime/platform/storage/PDF fatal.

First step next fresh chat:
Ask Rob for the files/artifacts needed to inspect the entire Acquisition Memo finalization pipeline.
Do not draft a Codex prompt until that file set is gathered and reasoned through.
```

---

# Archived Previous CVF Checkpoints Below

---
# June 28, 2026 Night CVF Addendum — CVF-23 PASS Checkpoint / Cleanup Lane Closed / QA Green / Morning Resume

## Current CVF status

This update supersedes the earlier June 28 CVF-23 route-helper-cleanup checkpoint as the active Core Valid Failure Path ledger checkpoint.

Rob is closing up for the night and taking the WIN. Resume fresh in the morning from this checkpoint.

Current posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect. No current evidence of core-parser launch blocker from the full pipeline audit.

CVF-04 Current debt / proposed acquisition separation:
PROTECT. No new blocker confirmed in the full audit. Do not delete debt-safety guard helpers casually.

CVF-05 V2 containment:
PASS / protect. Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces.

CVF-13 Runtime/render stability:
IMPROVED / watch. Syntax checks and sealed-lane smokes are green. No dangling dependency found in the closed helper-cleanup lane.

CVF-16 Boss Contract / CustomerSurfaceModel / final decision authority:
PASS from audit / protect. Do not weaken Boss, CustomerSurfaceModel, final decision, repair/collapse, or final validation.

CVF-17 Test-report hardcoding risk:
PROTECT. Continue no Stonebridge, RETEST, Attack, Final Attack, fixture filenames, or fixture values in production.

CVF-18 Shared legacy customer-output authority:
IMPROVED / PASS checkpoint. Public route is sleeper wrapper. Route-helper cleanup lane is closed. No post-sealed-output route mutation blocker confirmed.

CVF-19 Product lane sealing:
PASS checkpoint. Screening and Acquisition Memo V2 sealed-lane smokes pass.

CVF-20 Customer-facing launch hygiene:
PASS / protect. reports@investoriq.tech remains the report failure/review contact.

CVF-21 Final Boss compliance gate disagreement:
No active blocker confirmed by the June 28 full pipeline audit. Continue protecting gate alignment.

CVF-23 Full Screening + Acquisition pipeline audit:
PASS checkpoint as of June 28 night.
```

## CVF-23 audit result

Full pipeline audit returned:

```text
Overall verdict: PASS
Screening verdict: PASS
Acquisition Memo V2 verdict: PASS
Route authority verdict: PASS
No production launch blocker confirmed.
No files changed.
Working tree clean.
```

CVF disposition:

```text
Accepted as the current launch-readiness checkpoint.
Do not continue whack-a-mole cleanup tonight.
```

## CVF-23A / CVF-18C cleanup lane closure

Route-helper cleanup now has final disposition:

```text
CLEANUP_LANE_CLOSED
```

Accepted cleanup commits:

```text
2586237 Remove unused refi narrative helper
bdd763d Remove unused exit cap source label helper
1570820 Remove unused unit mix table injection helper
d93fe91 Remove unused rent roll occupancy helper
5f4510d Remove unused key metrics row injection helper
4546a25 Remove unused T12 and renovation helper code
```

Removed helpers:

```text
resolveRefiNarrativeMode
normalizeExitCapSourceLabel
injectUnitMixTable
deriveOccFromRentRollUnits
injectKeyMetricsRows
buildT12KeyMetricRows
summarizeRenovationBudgetRows
```

Required proof pattern was satisfied for accepted deletions:

```text
fresh per-symbol rg before deletion;
node --check;
Acquisition Memo V2 sealed-lane smoke;
Screening sealed-lane smoke;
git diff --check;
post-delete rg;
clean working tree.
```

## Parked CVF debt guard decision

`hasUsableDebtPayload` remains present and untouched.

CVF rationale:

```text
It is a debt-safety guard in the CVF-04 family.
Even if definition-only under scoped grep, it is too semantic/sensitive for casual cleanup.
Deleting it is not part of the accepted cleanup lane.
```

Current rule:

```text
Do not delete hasUsableDebtPayload unless a separate doctrine/ownership audit explicitly approves it.
```

## QA closure after stale route-wrapper tests

Two stale tests were refreshed and now pass.

Commit:

```text
61ab7d2 Refresh sealed route wrapper smokes
```

Files changed:

```text
tests/qa/generate-client-report-sealed-dispatcher-smoke.js
tests/qa/generate-client-report-zero-authority-sealed-output-smoke.js
```

No production files changed.

CVF effect:

```text
CVF-18 / CVF-19 proof wall now matches the sleeper wrapper architecture.
The tests no longer expect old route-body internals.
They assert current wrapper/delegation boundaries and zero route authority.
```

Commands passed:

```text
node --check tests/qa/generate-client-report-sealed-dispatcher-smoke.js
node --check tests/qa/generate-client-report-zero-authority-sealed-output-smoke.js
node --check api/_lib/generate-client-report-impl.js
node --check api/_lib/screening-report-pipeline.js
node --check api/_lib/acquisition-memo-v2-pipeline.js
node tests/qa/generate-client-report-sealed-dispatcher-smoke.js
node tests/qa/generate-client-report-zero-authority-sealed-output-smoke.js
node tests/qa/screening-report-sealed-lane-authority-smoke.js
node tests/qa/acquisition-memo-v2-sealed-lane-authority-smoke.js
git diff --check
```

Working tree clean after commit.

## Current stop conditions

Do not run or initiate without an explicit morning plan:

```text
live report generation;
DocRaptor;
Supabase writes;
paid/API loops;
customer PDFs;
public samples;
high-value outreach PDFs;
launch marketing PDFs;
new live retest;
broad smoke wall;
more helper cleanup chase.
```

## Fresh CVF continuation point

```text
June 28 night CVF checkpoint.

Rob is closing up for the night and taking the WIN.
We will start fresh in the morning.

Current accepted CVF state:
- CVF-23 full Screening + Acquisition pipeline audit: PASS checkpoint.
- Screening: PASS from audit.
- Acquisition Memo V2: PASS from audit.
- Route authority: PASS from audit.
- CVF-23A / CVF-18C route-helper cleanup lane: CLOSED.
- Stale route-wrapper QA: refreshed and PASS.
- Commit 61ab7d2 Refresh sealed route wrapper smokes accepted.
- No production files changed in final QA refresh.
- Working tree clean.

Parked:
- hasUsableDebtPayload remains present and untouched.
- Do not delete it casually.

Morning task:
Start from this clean PASS checkpoint and decide the next launch-safe move.
Do not run live generation, DocRaptor, Supabase writes, paid/API loops, customer PDFs, public samples, launch marketing PDFs, broad smoke walls, or more helper cleanup unless explicitly planned.
```

---

# Archived Previous CVF Checkpoints Below

---
# June 28, 2026 CVF Addendum — CVF-23 Still Active / Route Helper Cleanup Micro-Proof Lane Added

## Current CVF status

This update supersedes the earlier June 28 CVF-23 full-pipeline-audit checkpoint as the active Core Valid Failure Path ledger checkpoint.

Current posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect. Current work is not about core parser validity.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE / protect. Several route-helper cleanup candidates were proven live in current debt / acquisition financing paths and must not be deleted.

CVF-05 V2 containment:
PASS / protect. Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces.

CVF-13 Runtime/render stability:
WATCHLIST. Helper cleanup must never create dangling runtime dependencies.

CVF-16 Boss Contract / AI Boss Enforcement:
PROTECT. Do not weaken Boss/Model/final validation during cleanup.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. No Stonebridge, RETEST, Attack, Final Attack, fixture filenames, or fixture values may be hardcoded into production.

CVF-18 Shared legacy customer-output authority:
ACTIVE / improved. Route helper cleanup is proceeding, but only with proof that deleted helpers are unreachable.

CVF-19 Product lane sealing required:
ACTIVE / improved. Sealed Screening and Acquisition lanes remain protected by smokes during every cleanup step.

CVF-21 Final Boss compliance gate disagreement:
STILL OPEN until the full pipeline audit inventories all fatal/publish/collapse gates.

CVF-23 FULL_PIPELINE_AUDIT_REQUIRED_FOR_SCREENING_AND_ACQUISITION_LAUNCH_CLEARANCE:
ACTIVE / still controlling launch clearance.
```

## New CVF cleanup subfamily

```text
CVF-23A / CVF-18C:
ROUTE_HELPER_CLEANUP_REQUIRES_FRESH_PER_SYMBOL_PROOF
```

Reason:

```text
A broad dead-helper audit incorrectly classified several live helpers as unused.
Fresh per-symbol grep prevented unsafe deletion.
```

Confirmed live after correction:

```text
hasUsableDebtPayload
hasUsableCurrentMortgagePayload
hasDebtTermsPayload
buildDocumentQuantitativeUsageMap
```

CVF interpretation:

```text
These helpers touch current debt / acquisition financing / document quantitative usage logic.
They are not dead.
Deleting them would risk CVF-04, CVF-07, CVF-13, and CVF-18 regressions.
```

New rule:

```text
No helper deletion from api/_lib/generate-client-report-impl.js unless an immediate individual rg proves the only occurrence is its own definition.
```

## Cleanup commits accepted

### 2586237 — Remove unused refi narrative helper

Removed:

```text
resolveRefiNarrativeMode
```

CVF disposition:

```text
PASS.
Definition-only by fresh rg.
No imports removed.
No tests touched.
node --check passed.
Acquisition Memo V2 sealed-lane smoke passed.
Screening sealed-lane smoke passed.
Working tree clean.
```

### bdd763d — Remove unused exit cap source label helper

Removed:

```text
normalizeExitCapSourceLabel
```

CVF disposition:

```text
PASS.
Definition-only by fresh rg.
No imports removed.
No tests touched.
node --check passed.
Acquisition Memo V2 sealed-lane smoke passed.
Screening sealed-lane smoke passed.
Working tree clean.
```

## Current active Codex task

Codex is currently auditing only:

```text
injectUnitMixTable
```

Purpose:

```text
Determine whether this helper is TRUE_DEFINITION_ONLY, LIVE_USED, or UNCLEAR.
```

No edits and no commit are allowed.

Required proof:

```bash
rg -n "\\binjectUnitMixTable\\b" api/_lib/generate-client-report-impl.js tests/qa
rg -n "injectUnitMixTable\\(" api/_lib/generate-client-report-impl.js tests/qa
```

Review next receipt as:

```text
PASS / HOLD / BLOCKED
```

Accept only if:

```text
no files changed;
no commit;
working tree clean;
node --check passed;
sealed Acquisition Memo V2 smoke passed;
sealed Screening smoke passed;
exact grep results are reported.
```

## Next possible CVF actions

If `injectUnitMixTable` is TRUE_DEFINITION_ONLY:

```text
Delete only injectUnitMixTable in one micro-commit with fresh pre-delete proof and post-delete proof.
```

If `injectUnitMixTable` is LIVE_USED or UNCLEAR:

```text
Do not delete it.
Move to deriveOccFromRentRollUnits proof-only audit or pause cleanup until after the full pipeline audit.
```

## CVF-23 remains the launch-control family

The route-helper cleanup lane does not replace the full audit.

CVF-23 still requires Codex's full audit report to answer:

```text
What exactly is still standing in the way of a flawless publish-safe Screening pipeline?
What exactly is still standing in the way of a flawless publish-safe Acquisition Memo pipeline?
Which failures are true production blockers?
Which are stale harness expectations?
Which are legacy cleanup only?
Which fatal gates are stale or over-authoritative?
Which next three batch prompts should be run first?
```

Stop conditions remain:

```text
No RETEST 21.
No live generation.
No DocRaptor.
No Supabase writes.
No paid/API loops.
No public samples.
No high-value outreach PDFs.
No launch marketing PDFs.
No broad smoke walls unless explicitly authorized.
```

## Fresh CVF continuation point

```text
June 28 CVF checkpoint.

CVF-23 remains active and launch-controlling.
The full Screening + Acquisition pipeline audit is still required before live retests or launch clearance.

A safe micro-cleanup lane was also opened for api/_lib/generate-client-report-impl.js.
Important lesson: the broad dead-helper audit over-reported unused helpers.
Fresh grep showed several supposed delete candidates are live:
- hasUsableDebtPayload
- hasUsableCurrentMortgagePayload
- hasDebtTermsPayload
- buildDocumentQuantitativeUsageMap

Accepted cleanup commits:
- 2586237 Remove unused refi narrative helper
- bdd763d Remove unused exit cap source label helper

Current active Codex task:
Proof-only audit for injectUnitMixTable.
No edits.
No commit.

First thing next chat:
Rob will paste Codex's injectUnitMixTable audit reply.
Review PASS / HOLD / BLOCKED.
If definition-only, give a one-helper delete prompt.
If live or unclear, do not delete.
```

---

# Archived Previous CVF Checkpoints Below

---
# June 28, 2026 CVF Addendum — Full Screening + Acquisition Pipeline Audit Active / CVF-22 Smoke Loop Paused / CVF-23 Opened

## Current CVF status

This update supersedes the June 25 late CVF-22 role-reconciler checkpoint as the active Core Valid Failure Path ledger checkpoint.

Current posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect. Current work is not about core parser validity.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE / improved. Role-reconciler evidence contamination and same-identity grouping issues were found and fixed locally, but the full audit must confirm no other separation leaks remain.

CVF-05 V2 containment:
PASS / protect. Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE / improved. Support-doc authority now requires identity-scoped, positive same-source evidence. The full audit must confirm all downstream consumers obey this authority.

CVF-13 Runtime/render stability:
WATCHLIST. Runtime helper misses were found during the rent-roll smoke loop and corrected, but a full fatal-path inventory is now required.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
NOT CLOSED. Acquisition Memo is still not launch-cleared.

CVF-16 Boss Contract / AI Boss Enforcement:
PROTECT. Do not weaken Boss/Model/final validation to hide stale harness or role-authority issues.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. No Stonebridge, RETEST, Attack, Final Attack, fixture filenames, or fixture values may be hardcoded into production.

CVF-18 Shared legacy customer-output authority:
ACTIVE / improved. The route sleeper mission continues, but the audit must map remaining route/shared authority risks across both product lanes.

CVF-19 Product lane sealing required:
ACTIVE / improved. Screening and Acquisition lanes exist, but the full audit must prove end-to-end publish safety and no hidden shared-surface dependence.

CVF-20 Customer-facing launch hygiene:
PASS / protect. reports@investoriq.tech remains the report failure/review contact.

CVF-21 Final Boss compliance gate disagreement:
STILL OPEN from RETEST 19/20 until the audit inventories all fatal/publish/collapse gates.

CVF-22 Route sleeper / role-reconciler smoke cleanup:
PAUSED as the immediate driver. Useful fixes were made, but the line-by-line smoke loop is too slow.

NEW ACTIVE FAMILY:
CVF-23 FULL_PIPELINE_AUDIT_REQUIRED_FOR_SCREENING_AND_ACQUISITION_LAUNCH_CLEARANCE.
```

## Why CVF-23 is opened

Rob correctly escalated because the current workflow was too slow:

```text
one smoke failure
one prompt
one fix/classification
one rerun
next failure
```

That pattern finds issues but does not answer the launch-critical question:

```text
What exactly is still standing in the way of flawless Screening and Acquisition pipelines?
```

CVF-23 requires a full current-state audit before more patches.

## CVF-22 status before pause

The rent-roll smoke loop exposed and addressed several real families.

### Real production authority fixes accepted during the loop

```text
1. SUPPORT_DOC_ROLE_RECONCILER_UNSCOPED_ARTIFACT_TEXT_CONTAMINATION:
   collectTextParts(...) and collectRowText(...) now require identity-scoped artifact evidence.

2. PARSER_ONLY_CANONICAL_ROLE_LEAK:
   canonical role selection now requires positive same-source evidence; parser-only hints cannot win.

3. SUPPORT_DOC_TAXONOMY_INCOMPLETE:
   product-owned role decision now covers current debt, purchase assumptions, renovation/CapEx, environmental, appraisal, property tax, market survey, historical CapEx, core T12, core Rent Roll, and true other_support_context fallback.

4. SAME_IDENTITY_GROUPED_ROW_WRONG_WINNER:
   same-identity rows now use product authority priority before raw score. Proven case: purchase assumptions now outrank appraisal when both rows share identity and acquisition evidence exists.

5. FORBIDDEN_FULL_UW_WORDING_LEAK:
   renovation/CapEx role text no longer opens ROI/payback/DSCR/refi/DCF/waterfall/deal-score/final recommendation surfaces.
```

### Stale harness expectation confirmed

```text
loan_terms_simple_source.txt had only parser-ish metadata:
- original_filename
- doc_type: loan_term_sheet
- semantic_doc_role: loan_term_sheet
- parse_status: parsed

No positive same-source acquisition evidence existed.
Therefore production correctly returned other_support_context.
The old smoke expectation that parser-only loan_term_sheet should render as Purchase Assumptions / Acquisition Context is stale under current doctrine.
```

CVF interpretation:

```text
Parser labels alone are no longer sufficient.
Tests must split parser-only vs evidence-backed cases.
```

## New CVF-23 — FULL_PIPELINE_AUDIT_REQUIRED_FOR_SCREENING_AND_ACQUISITION_LAUNCH_CLEARANCE

Issue:

```text
The team needs a complete map of remaining launch blockers, stale tests, route/shared authority risks, and collapse-vs-fail mismatches across both product lanes.
```

Required audit scope:

```text
1. Screening pipeline end-to-end.
2. Acquisition Memo pipeline end-to-end.
3. Shared route / handler / worker / delivery gate / QA / Boss compliance handoff.
4. Every publication gate and fatal throw path.
5. Every collapse-vs-fail mismatch.
6. Every customer-truth authority conflict.
7. Current stale harness expectations.
8. Legacy authority quarantine targets.
9. Hardcoding/test-specific risk.
10. Exact next three batch remediation prompts.
```

## Current active Codex task

Codex is currently running an audit-only prompt:

```text
FULL ROOT-CAUSE PIPELINE AUDIT REQUIRED.
```

Codex must report:

```text
A. Executive verdict
- Screening: GREEN / YELLOW / RED
- Acquisition Memo: GREEN / YELLOW / RED

B. Pipeline maps
- route/handler entry
- sealed lane/pipeline owner
- renderer/customer output owner
- final delivery/publish gate
- tests/smokes covering each lane

C. Launch blockers
Only true blockers that can prevent valid reports from publishing or create wrong customer-facing truth.

D. Non-blocking cleanup
Legacy/stale surfaces that should be quarantined later.

E. Stale tests/harness expectations
Exact test expectations that conflict with current doctrine.

F. Legacy/stale authority quarantine list
File/function, reachability, customer-facing risk, recommendation, and proof needed before deletion.

G. Exact next 3 batch prompts
The safest next prompts in launch-risk order.

H. Commands run
Only commands actually run.
```

## Current CVF stop conditions

Do not run:

```text
RETEST 21 or any live retest;
live report generation;
DocRaptor;
Supabase writes;
paid API loops;
public samples;
high-value outreach PDFs;
launch marketing PDFs;
broad smoke walls unless explicitly authorized.
```

Do not patch next by:

```text
fixing only the latest visible rent-roll smoke failure;
changing stale tests without doctrine proof;
hardcoding test report facts;
weakening Boss Contract;
weakening CustomerSurfaceModel;
bypassing final Boss compliance;
bypassing delivery gate;
restoring route authority;
restoring impl.__test__;
importing generate-client-report-impl.js;
opening Full UW surfaces;
touching Screening casually.
```

## Required next-chat acceptance

Rob will paste Codex's full audit report next.

Review for:

```text
PASS / PARTIAL / FAIL.
```

A PASS-quality audit must include:

```text
1. Screening GREEN/YELLOW/RED with evidence.
2. Acquisition GREEN/YELLOW/RED with evidence.
3. Full Screening pipeline map.
4. Full Acquisition pipeline map.
5. All launch blockers separated from non-blocking cleanup.
6. Stale harness expectations separated from production bugs.
7. Legacy authority quarantine targets with reachability status.
8. Fatal/publish/collapse gate inventory.
9. Exact next three batch prompts.
10. Confirmation no code changes, no live services, no rent-roll smoke, no commit.
```

## Fresh CVF continuation point

```text
June 28 CVF checkpoint.

The CVF-22 rent-roll smoke loop is paused because it became too slow and assertion-by-assertion.
Useful fixes were made:
- identity-scoped support-doc evidence collection;
- parser-only hints cannot become canonical;
- expanded support-doc role taxonomy;
- same-identity product-priority grouping;
- forbidden Full UW wording containment.

A stale harness expectation was also proven:
parser-only loan_term_sheet with no same-source acquisition evidence must remain other_support_context.

New active family:
CVF-23 FULL_PIPELINE_AUDIT_REQUIRED_FOR_SCREENING_AND_ACQUISITION_LAUNCH_CLEARANCE.

Current Codex task:
Audit both pipelines end-to-end and report what still blocks a flawless publish-safe pipeline.
No code changes.
No commit.
No live generation.
No DocRaptor.
No Supabase writes.
No full rent-roll smoke.

First thing next chat:
Rob will paste Codex's audit report.
Review PASS / PARTIAL / FAIL.
Do not ask for patches until blockers and next batch prompts are identified.
```



---
# Archived Previous CVF Checkpoints Below

---
# June 25, 2026 Late CVF Addendum — CVF-22 Continued / Role-Reconciler Artifact Evidence Contamination Active

## Current CVF status

This update supersedes the earlier June 25 CVF-22 route-sleeper checkpoint as the active Core Valid Failure Path ledger checkpoint.

Current posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect. The current blocker is not core parser validity.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE. The current repeated failure is exactly this doctrine family: purchase assumptions are still resolving to current_debt_context in the rent-roll smoke.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE. Support-doc authority must be identity-scoped. One support doc must not inherit evidence from another unrelated artifact.

CVF-16 Boss Contract / AI Boss Enforcement:
PROTECT. Do not weaken Boss/Model/final validation to hide a role-reconciler issue.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. No Stonebridge, RETEST, Attack, Final Attack, or fixture values may be hardcoded into production.

CVF-18 Shared legacy customer-output authority:
ACTIVE / improved. Stale impl.__test__ helper dependencies are being removed from the monster rent-roll smoke rather than restored.

CVF-22 Route sleeper cutover / dangling authority and dependencies:
ACTIVE. The broader sleeper mission continues, but the immediate local blocker is now role-reconciler evidence contamination in the rent-roll smoke loop.
```

## New active subfamily under CVF-22 / CVF-04 / CVF-07

```text
CVF-22B / CVF-04C / CVF-07F:
SUPPORT_DOC_ROLE_RECONCILER_UNSCOPED_ARTIFACT_TEXT_CONTAMINATION
```

Observed repeated failure:

```text
node tests/qa/generate-client-report-rent-roll-smoke.js

AssertionError:
expected /purchase_assumptions|proposed_acquisition_financing/i
actual: current_debt_context

at:
tests/qa/generate-client-report-rent-roll-smoke.js:5660
```

Doctrine impact:

```text
Purchase assumptions / proposed acquisition financing must not become current debt.
Current debt classification requires positive current/existing-debt evidence tied to the same source/document.
A support-doc row/source cannot borrow unrelated artifact text from a separate current-debt file.
```

## What is not a failure

The earlier smoke loop exposed stale harness assertions and removed old dependencies.

Those included:

```text
old acquisition-financing full-table expectations now replaced with collapsed safe output expectations;
old sentence/table label expectations updated to current valid table output;
old impl.__test__ helper calls removed or properly rewired only when a product-owned module existed.
```

CVF interpretation:

```text
Those were stale harness cleanup from the sleeper cutover.
They do not count as production doctrine patches.
```

## What is a true failure

The line-5660 role mismatch is a true product authority risk.

Codex first reported a narrow production fix:

```text
api/_lib/acquisition-memo-v2-role-reconciler.js
collectRowText(...) identity-key filtering
```

Accepted partial principle:

```text
Evidence collection must be scoped to the document/row identity.
Stonebridge_Assumptions.pdf must not inherit current-debt evidence from unrelated current-debt artifacts.
This is generic and not Stonebridge-specific.
```

But the same failure persisted after Rob reran the smoke.

Likely CVF root:

```text
The failing path is not using the newly filtered collectRowText(...) helper.
It may still be using reconcileAcquisitionMemoV2SupportDocRole(...), which calls collectTextParts(source, artifacts).
collectTextParts(...) may still collect all artifact text without source/file identity filtering.
```

## Current active Codex task

Codex is currently investigating/fixing the repeated blocker.

Required answer:

```text
1. exact function call at tests/qa/generate-client-report-rent-roll-smoke.js:5660 producing current_debt_context;
2. why the prior collectRowText(...) fix did not affect the failure;
3. whether collectTextParts(source, artifacts) is the remaining contamination path;
4. narrow production fix or HOLD.
```

Preferred fix if confirmed:

```text
Apply identity-scoped artifact filtering in collectTextParts(source, artifacts):
- compute source/file identity key;
- compute artifact identity key;
- skip artifacts with non-empty identity keys that differ;
- do not mix unrelated support-doc evidence;
- prefer source-local evidence when identity is missing;
- return HOLD if ambiguity makes safe classification impossible.
```

Forbidden fixes:

```text
change the line-5660 assertion blindly;
hardcode Stonebridge_Assumptions.pdf;
hardcode any test values;
restore impl.__test__;
import api/_lib/generate-client-report-impl.js;
define route-local helpers;
add compatibility aliases;
weaken Boss/CustomerSurfaceModel;
broaden role heuristics beyond the exact contamination problem.
```

## Current CVF stop conditions

Do not run:

```text
RETEST 21;
live report generation;
DocRaptor;
Supabase writes;
paid API loops;
public samples;
high-value outreach PDFs;
launch marketing PDFs;
broad smoke walls.
```

Codex must not run the rent-roll smoke unless Rob explicitly changes that instruction.

Rob will run manually:

```bash
node tests/qa/generate-client-report-rent-roll-smoke.js
```

## Required acceptance for the next Codex reply

Review the next Codex receipt for:

```text
PASS / HOLD / BLOCKED.
```

Acceptance requires:

```text
exact function call identified;
root cause identified;
narrow fix in api/_lib/acquisition-memo-v2-role-reconciler.js if applicable;
no test-report hardcoding;
no route authority restoration;
no generate-client-report-impl.js import;
no smoke tests run by Codex;
node --check passed;
no commit.
```

## Fresh CVF continuation point

```text
June 25 late CVF checkpoint.

CVF-22 remains active, but the immediate repeated blocker is now:
CVF-22B / CVF-04C / CVF-07F SUPPORT_DOC_ROLE_RECONCILER_UNSCOPED_ARTIFACT_TEXT_CONTAMINATION.

Current repeated failure:
tests/qa/generate-client-report-rent-roll-smoke.js:5660
expected purchase_assumptions/proposed_acquisition_financing
actual current_debt_context.

Codex first fixed collectRowText(...) in api/_lib/acquisition-memo-v2-role-reconciler.js, but the same failure persisted.
Likely reason: the failing path still uses collectTextParts(source, artifacts) through reconcileAcquisitionMemoV2SupportDocRole(...), and collectTextParts still collects unrelated artifact text.

Active Codex task:
Find exact call path and apply identity-scoped evidence collection to the actual failing path, likely collectTextParts(...), or return HOLD.

No commit.
No live tests.
No broad smoke walls.
Rob runs the rent-roll smoke manually after review.
```



---
# June 25, 2026 CVF Addendum — CVF-22 Route Sleeper Cutover Active / generate-client-report.js Customer-Truth Authority Being Removed

## Current CVF status

This update supersedes the June 24 late CVF-21 full-investigation checkpoint as the active Core Valid Failure Path ledger checkpoint.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protect. The current sleeper cutover is not about core parser validity. Do not weaken core gate.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE / protected by product-owned authority work. Current/proposed separation must remain product-owned and must not be restored to route helpers.

CVF-05 V2 containment:
PASS / protect. Do not reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces.

CVF-07 / CVF-15 Optional support/source package authority:
IMPROVED. Document-treatment and support-doc authority is being moved out of generate-client-report.js and into product-owned _lib modules.

CVF-13 Runtime/render stability:
WATCHLIST. The active blocker is now a cleanup-exposed runtime dangling dependency: buildFinancingEnvelopeGrid is not defined.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
NOT CLOSED. The route is still not a sleeper shell and Acquisition Memo V2 is not launch-cleared.

CVF-16 Boss Contract / AI Boss Enforcement:
IMPROVED / protect. Boss repair guards moved from the route into acquisition-memo-v2-boss-repair.js. Do not weaken Boss or bypass final compliance.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. No Stonebridge / RETEST / Attack / Final Attack production hardcoding is allowed.

CVF-18 Shared legacy customer-output authority:
ACTIVE / being directly remediated. This is the current route sleeper cutover.

CVF-19 Product lane sealing required:
IMPROVED / protect. Sealed lanes remain the target. Route must dispatch/deliver, not own truth.

CVF-20 Customer-facing launch hygiene:
PASS / protect. reports@investoriq.tech remains the failed-report/review contact.

CVF-21 Final Boss compliance gate disagreement:
STILL OPEN as the live RETEST 19/20 failure family, but current local work is focused on removing route authority before any more live retest/gate work.

NEW ACTIVE FAMILY:
CVF-22 ROUTE_SLEEPER_CUTOVER_DANGLING_AUTHORITY_AND_DEPENDENCIES.
```

## CVF-22 — ROUTE_SLEEPER_CUTOVER_DANGLING_AUTHORITY_AND_DEPENDENCIES

Opened during the generate-client-report.js sleeper cutover.

Issue:

```text
generate-client-report.js remains too authoritative and too entangled.
As route authority is removed, stale route dependencies can surface as runtime failures.
The current exposed blocker is ReferenceError: buildFinancingEnvelopeGrid is not defined.
```

Observed current blocker:

```text
node tests/qa/generate-client-report-rent-roll-smoke.js
FAIL
ReferenceError: buildFinancingEnvelopeGrid is not defined
source: api/generate-client-report.js around line 9044
```

CVF interpretation:

```text
This is not a reason to restore route authority.
This is evidence that the route still contains entangled customer-output surfaces and dangling dependencies.
The correct disposition is delete, move to product-owned _lib, or BLOCKED with call sites.
```

## Sleeper cutover CVF progress

### Document-treatment / financing authority extraction

CVF effect:

```text
CVF-18 improved.
Route __test__ no longer exposes the five document-treatment / acquisition-financing authority builders.
Authority tests were moved toward product-owned api/_lib/document-treatment-authority.js.
```

Moved/remediated family:

```text
legacyOnlyBuildCanonicalSupportDocAuthorityRows
legacyOnlyBuildDocumentTreatmentSummaryHtml
legacyOnlyBuildPreliminaryFinancingReadinessSummaryHtml
legacyOnlyBuildAcquisitionFinancingAssumptionsHtml
legacyOnlyBuildAcquisitionFinancingReadinessHtml
```

### Boss repair guard extraction

CVF effect:

```text
CVF-16 / CVF-18 improved.
Route-local final source reconciliation and section-heal guards were removed.
Product-owned api/_lib/acquisition-memo-v2-boss-repair.js now owns the functions.
```

Removed route-local guards:

```text
legacyOnlyApplyFinalSourceReconciliationRenderGuard
legacyOnlyApplyFinalSectionHealRenderGuards
```

### Product-owned classification fixes

CVF effect:

```text
CVF-07 / CVF-15 improved.
Historical-only CapEx and ESA/environmental context are now fixed in product-owned document-treatment authority.
```

Historical-only CapEx expected result:

```text
historical_capex_only
Historical Capital Items
Context only
Historical capital items are displayed for context only.
```

ESA / environmental expected result:

```text
Environmental Due Diligence Context
Context only
Environmental due-diligence context only; not used quantitatively.
Listed but Not Quantitatively Modeled
```

### Detached/obsolete route authority cleanup

CVF effect:

```text
CVF-18 improved.
Detached document-treatment route authority bodies were removed.
Renaming route authority to pass grep was explicitly rejected.
```

Strict rule now recorded:

```text
No obsoleteDetachedRoute...
No _detachedRouteAuthority...
No helper renaming to hide authority.
Delete, move, or BLOCKED only.
```

### Screening helper residue cleanup

CVF effect:

```text
CVF-18 / CVF-19 improved.
Two dead Screening helper residues were deleted.
No active route call sites were found for the listed Screening legacy helpers in the latest receipt.
```

Deleted:

```text
legacyOnlyBuildScreeningDataCoverageSummary
legacyOnlyBuildScreeningRentRollDistributionHtml
```

Still to watch:

```text
legacyOnlyBuildScreeningIncomeForensicsHtml
legacyOnlyBuildScreeningExpenseStructureHtml
legacyOnlyBuildScreeningNoiStabilityHtml
legacyOnlyBuildScreeningRentRollDistributionHtml
```

Latest Codex receipt said remaining hits were test grep strings only, but this must remain under review.

## Current active Codex task

Codex is currently running:

```text
Sleeper Cutover Pass 5, strict leash.
```

Narrow blocker:

```text
buildFinancingEnvelopeGrid is not defined.
```

Allowed fixes:

```text
delete the call if dead/forbidden in sealed paths;
move the helper into the correct product-owned _lib module and import it;
stop and report BLOCKED with exact call sites.
```

Forbidden fixes:

```text
quick local route helper;
restored legacy helper body;
compatibility alias;
weakened forbidden-surface check;
hardcoded test value;
CustomerSurfaceModel or Boss bypass;
broad smoke wall.
```

## Current CVF stop conditions

Do not run:

```text
RETEST 21;
live report generation;
DocRaptor;
Supabase writes;
paid API loops;
public samples;
high-value outreach PDFs;
launch marketing PDFs;
broad smoke walls while in cutover.
```

Do not patch next by:

```text
restoring route customer-truth authority;
renaming customer-truth authority to pass grep;
adding route compatibility aliases;
making old smokes green without removing/moving authority;
weakening Boss Contract;
weakening CustomerSurfaceModel;
bypassing final Boss compliance;
touching Screening casually.
```

## Required Pass 5 acceptance

Rob will paste Codex's Pass 5 receipt next.

Review for:

```text
PASS / HOLD / BLOCKED.
```

Acceptance requires:

```text
buildFinancingEnvelopeGrid disposition is explicitly explained;
route authority is not restored;
no new route-local customer-truth helper is created;
no compatibility aliases are added;
minimum tests/grep were run;
remaining route authority is listed;
no commit was made.
```

Reject if:

```text
Codex defines buildFinancingEnvelopeGrid inside generate-client-report.js as a quick fix;
Codex reintroduces deleted helper bodies;
Codex widens scope into unrelated smokes;
Codex claims PASS only because a stale smoke was weakened;
Codex renames route authority again.
```

## Fresh CVF continuation point

```text
June 25 CVF checkpoint.

CVF-22 is now open:
ROUTE_SLEEPER_CUTOVER_DANGLING_AUTHORITY_AND_DEPENDENCIES.

Current mission:
Make api/generate-client-report.js unable to own customer truth.

Completed route authority progress:
- document-treatment / acquisition-financing authority moved to api/_lib/document-treatment-authority.js;
- route __test__ no longer exports the five moved authority builders;
- final source-reconciliation and section-heal guards moved to api/_lib/acquisition-memo-v2-boss-repair.js;
- historical-only CapEx fixed;
- ESA/environmental support treatment fixed;
- detached/obsolete route document-treatment bodies removed;
- some dead Screening helper residue deleted;
- sealed-lane authority smoke has passed during the sequence.

Current blocker:
ReferenceError: buildFinancingEnvelopeGrid is not defined
from api/generate-client-report.js around line 9044 during generate-client-report-rent-roll-smoke.

Strict rule:
Delete, move to product-owned _lib, or BLOCKED.
Do not restore route authority.
Do not define a quick local route helper.
Do not add aliases.
Do not broaden scope.
Preserve Codex usage.

First thing in next chat:
Rob will paste Codex's Pass 5 receipt.
Review PASS / HOLD / BLOCKED.
No commit unless Rob explicitly approves after review.
```


---
# June 24, 2026 Late CVF Addendum — Zero-Authority + Launch Hygiene Passed / RETEST 19–20 Exposed Final Boss Gate Disagreement / Full Investigation Active

## Current CVF status

This update supersedes the earlier June 24 Step 5 CVF checkpoint.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected in current evidence. RETEST 20 artifacts showed T12 and Rent Roll parsed and core coverage existed. Core docs were not the publication failure cause.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE / warning family. Current/proposed separation warnings still appear, but RETEST 20 report_contract_qa and qa_action_plan marked them non-customer-blocking. Need investigation to determine whether remaining rendered separation warning is truly advisory or still a repair-collapse mismatch.

CVF-05 V2 containment:
PASS / protect. Forbidden advanced surfaces remain intended closed. Do not reopen Full UW surfaces.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE. Support/advanced surfaces still produce warnings that can interact with final Boss compliance. The critical issue is whether those warnings collapse/qualify and publish or still trigger a stale fatal throw.

CVF-13 Runtime/render stability:
ACTIVE AGAIN, but in a narrower form. Not a helper crash. Not DocRaptor. The live API still throws 500 after final HTML generation with “Final Acquisition Memo V2 HTML failed Boss compliance.”

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
NOT CLOSED. HTML is generated, but final publication fails before customer artifact. The final Boss compliance handoff is still not aligned with delivery readiness.

CVF-16 Boss Contract / AI Boss Enforcement:
ACTIVE / NOT CLOSED. Boss/contract/report QA can produce non-customer-blocking warn states, but another final compliance throw path still treats final Boss compliance as fatal.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. Recent fixes appear generic. No Stonebridge/Attack/RETEST values should be added to production.

CVF-18 Shared legacy customer-output authority:
IMPROVED / PASS candidate after zero-authority route gate. Sealed Screening and Acquisition V2 output are now protected from route customer-output mutation after lane dispatch. Still part of full investigation because generate-client-report.js remains large and legacy-heavy.

CVF-19 Product lane sealing required:
IMPROVED / PASS candidate. Screening and Acquisition Memo V2 have sealed lanes and proof walls, but investigation must confirm no hidden cross-lane or legacy gate still controls publication.

CVF-20 Customer-facing launch hygiene:
PASS. Failed/paused report copy now uses safe no-publication language and reports@investoriq.tech.
```

## New active family — CVF-21 FINAL_BOSS_COMPLIANCE_GATE_DISAGREEMENT

Opened after RETEST 19 and confirmed by RETEST 20.

Issue:

```text
The API can still throw:
Final Acquisition Memo V2 HTML failed Boss compliance

even when downstream QA/action-plan/report-contract artifacts say:
customer_delivery_ready: true
customer_publish_eligible: true
report_publishable: true
report_blocked: false
remaining report_contract_qa violations are warn/non-customer-blocking.
```

Observed RETEST 20 conflict:

```text
report_contract_qa:
contract_status: warn
report_quality_status: warn
customer_delivery_ready: true
violations:
- ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT
- UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED
both blocks_customer_delivery: false

qa_action_plan:
report_publishable: true
customer_delivery_ready: true
customer_publish_eligible: true
report_blocked: false

worker/API:
500 REPORT_GENERATION_FAILED
response_text_preview: {"error":"Final Acquisition Memo V2 HTML failed Boss compliance"}
```

CVF interpretation:

```text
There are multiple publication/final-compliance gates that can disagree.
At least one stale or over-strict final Boss compliance throw path still fails valid-core customer publication on warn/advisory compliance state.
```

This is no longer acceptable as a one-off patch target.

## Completed gates since prior CVF checkpoint

### Step 8 — route-owned Screening authority removal

Verdict:

```text
PASS + committed.
```

CVF effect:

```text
CVF-18 / CVF-19 improved.
Screening renderer/customer-output helper ownership moved to product module.
Route-owned active Screening helper definitions removed/quarantined.
```

### Step 9 — zero-authority sealed output gate

Verdict:

```text
PASS + committed.
```

CVF effect:

```text
CVF-18 / CVF-19 improved.
generate-client-report.js no longer has customer-output authority over sealed Screening or sealed Acquisition Memo V2 after product-lane dispatch.
```

Key proof:

```text
assertSealedOutputImmutable(...)
sealedCustomerOutput: true
sealed lane markers for Screening and Acquisition Memo V2
zero-authority sealed-output smoke
sealed dispatcher smoke
Screening sealed-lane authority smoke
```

### CVF-20 launch hygiene

Verdict:

```text
PASS + committed.
```

CVF effect:

```text
Customer-facing failed report copy no longer says vague failure/try again/contact hello.
It now says generation paused before publication, no completed report was published, issue logged, credit restoration according to report status, do not repeatedly retry, contact reports@investoriq.tech.
```

## RETEST 19 CVF disposition

Status:

```text
FAILED before publication.
```

Backend failure:

```text
REPORT_GENERATION_FAILED 500
Final Acquisition Memo V2 HTML failed Boss compliance
```

Patch attempted:

```text
api/_lib/qa-action-plan.js
tests/qa/acquisition-memo-v2-final-boss-compliance-collapse-smoke.js
```

CVF review:

```text
The patch appeared generic and not test-report-specific.
It classified UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED as core-valid non-blocking.
But it addressed downstream action-plan/delivery classification only.
```

## RETEST 20 CVF disposition

Status:

```text
FAILED before publication with the same backend error.
```

New information:

```text
The downstream action-plan and report-contract layers now say customer publish is allowed.
The final API still throws 500.
Therefore the root is not only qa-action-plan overblocking.
```

CVF classification:

```text
CVF-21 FINAL_BOSS_COMPLIANCE_GATE_DISAGREEMENT.
```

## Current active task

Codex is currently running:

```text
Full Pipeline Investigation / No More Whack-a-Mole
```

Investigation scope:

```text
Screening pipeline.
Acquisition Memo V2 pipeline.
Shared route/worker/delivery/QA/Boss compliance handoff.
Every publication gate.
Every fatal throw path.
Every collapse-vs-fail mismatch.
Every authority conflict.
RETEST 19/20 autopsy.
AI Boss / Boss Contract / CustomerSurfaceModel effectiveness.
Hardcoding/test-specific audit.
```

Patch freeze:

```text
No production code changes until the investigation report is complete and reviewed.
```

## Current CVF stop conditions

Do not run:

```text
RETEST 21
live report generation
DocRaptor
Supabase writes
paid API loops
public samples
high-value outreach PDFs
launch marketing PDFs
```

Do not patch next by:

```text
only changing the latest fatal throw condition without a full gate inventory;
hardcoding report facts;
weakening Boss Contract;
weakening CustomerSurfaceModel;
bypassing final Boss compliance;
bypassing delivery gate;
treating launch hygiene/dashboard copy as the cause;
adding another standalone parser heuristic;
touching Screening without root investigation and regression proof.
```

## Required investigation acceptance

Rob will paste the full Codex investigation report next.

Review for:

```text
PASS / PARTIAL / FAIL.
```

Acceptance requires:

```text
full Screening pipeline map;
full Acquisition Memo pipeline map;
all publication/fatal gates with file/function/condition;
collapse-vs-fail inventory;
authority conflict audit;
RETEST 19/20 exact autopsy;
AI Boss/Boss Contract/CustomerSurfaceModel effectiveness assessment;
Screening risk register;
Acquisition Memo risk register;
hardcoding/test-specific search results;
P0/P1/P2 root problem ranking;
phase remediation plan;
exact patches required before next live retest;
clear answer to “What more do we need to do?”
```

## Fresh CVF continuation point

```text
June 24 late CVF checkpoint.

Steps/gates completed:
- Step 8 route-owned Screening authority removal: PASS + committed.
- Step 9 zero-authority sealed output: PASS + committed.
- Launch hygiene/customer-facing failed-report copy: PASS + committed.

Live proof:
- RETEST 19 failed before publication with Final Acquisition Memo V2 HTML failed Boss compliance.
- A qa-action-plan non-blocking classification patch was made and looked generic.
- RETEST 20 failed the same way.

Key RETEST 20 finding:
report_contract_qa and qa_action_plan say customer delivery is ready/publishable and remaining issues are warn/non-customer-blocking, but the API still throws 500.

New active family:
CVF-21 FINAL_BOSS_COMPLIANCE_GATE_DISAGREEMENT.

Rob correctly stopped the whack-a-mole loop.
Codex is now running a full investigation across both product lanes and all gates.
No RETEST 21, no live services, no patches until investigation report is reviewed.
```



---
# June 24, 2026 CVF Addendum — Steps 2–5 Passed / RETEST 18 Failure Family Locally Guarded / Authority Audit + Launch Hygiene Next

## Current CVF status after Steps 2–5

This update supersedes the June 23 late CVF addendum as the active Core Valid Failure Path ledger checkpoint.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. Step 5 local replay proves valid core T12 + Rent Roll remains publish-capable locally. Missing T12/Rent Roll still fails.

CVF-04 Current debt / proposed acquisition separation:
PASS candidate / protected locally. Step 3 role reconciler and Step 5 replay prove current debt vs purchase assumptions can be separated by product-owned evidence, not raw parser role.

CVF-05 V2 containment:
PASS / protect. Forbidden DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD/loan approval/lender commitment surfaces remain closed in the Step 4/5 proof wall.

CVF-07 / CVF-15 Optional support/source package authority:
IMPROVED / local PASS candidate. Optional/support conflicts now reconcile or repair/collapse instead of nuking valid-core reports. Still needs controlled live proof after authority/hygiene audits.

CVF-13 Runtime/render stability:
IMPROVED. Step 4 repair/collapse and Step 5 local replay reduce report-kill risk from optional/support conflict. Runtime/storage/PDF fatal remains a true fail condition.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
LOCAL PASS CANDIDATE for RETEST 18 failure family, NOT full launch-closed. generate-client-report authority audit and launch hygiene audit remain before controlled RETEST 19.

CVF-16 Boss Contract / AI Boss Enforcement:
IMPROVED / local PASS candidate. Boss remains strict, repair/collapse happens before final fail, and hard forbidden surfaces still fail.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. Step 5 production code unchanged. Test harness cleaned of Stonebridge / Attack Test / Final Attack strings.

CVF-18 Shared legacy customer-output authority:
ACTIVE NEXT AUDIT. Steps 2–5 reduced risk, but generate-client-report.js must now be audited to prove it is no longer a hidden second Boss.

CVF-19 Product lane sealing required:
IMPROVED / local PASS candidate. Screening and Acquisition Memo V2 lane entry/fence work is passing locally, but authority audit must confirm no legacy post-lane mutation remains.

NEW / ACTIVE PRE-LAUNCH FAMILY:
CVF-20 — CUSTOMER_FACING_LAUNCH_HYGIENE_REQUIRED.
```

## Step 2 CVF disposition — sealed lane entry points

Verdict:

```text
PASS + committed.
```

CVF effect:

```text
CVF-18 / CVF-19 risk reduced.
Screening is fenced from acquisition document-treatment and V2 finalization mutation.
Acquisition Memo V2 has a sealed lane wrapper.
Screening has a sealed lane wrapper.
```

Remaining CVF risk:

```text
generate-client-report.js still exists as the public route and remains large.
It must be audited to confirm it dispatches/delivers only and does not mutate customer truth after sealed lane output.
```

## Step 3 CVF disposition — V2 role reconciler / source truth authority

Verdict:

```text
PASS + committed.
```

CVF effect:

```text
CVF-04 / CVF-07 / CVF-16 improved.
Parser semantic_doc_role is now evidence only.
Product-owned reconciled role is authority.
Current debt can overcome misleading parser purchase/acquisition labels when evidence supports current debt.
Purchase assumptions remain purchase/acquisition context when evidence supports that classification.
```

Launch hygiene note:

```text
Encoding artifacts in role labels were cleaned to ASCII.
Existing Debt - Contextual
Acquisition Assumptions - Contextual
```

## Step 4 CVF disposition — Boss repair/collapse before final fail

Verdict:

```text
PASS + committed after forbidden-surface completion fix.
```

CVF effect:

```text
CVF-13 / CVF-16 improved.
Optional/support violations no longer have to abort a valid-core report.
Repairable optional/support sections can collapse in CustomerSurfaceModel and Boss contract.
The V2 orchestrator rerenders, re-enforces Boss, and revalidates HTML.
Core-fatal issues still fail.
```

Forbidden surface handling accepted:

```text
Forbidden-surface violations classify separately as forbiddenSurface, not first-pass coreFatal.
Repairable forbidden terms can be scrubbed and revalidated.
Hard forbidden terms still fail if they remain.
```

## Step 5 CVF disposition — local RETEST 18-style replay + Screening wall

Verdict:

```text
PASS.
Not committed yet at handoff unless Rob commits it afterward.
```

New test-only proof wall:

```text
tests/qa/acquisition-memo-v2-retest18-local-artifact-replay-smoke.js
```

Production files changed:

```text
None.
```

CVF effect:

```text
CVF-04 / CVF-07 / CVF-15 / CVF-16 / CVF-18 / CVF-19 all improved locally.
```

Accepted proof points:

```text
Valid core T12 + Rent Roll publishes locally.
Support-doc parser role conflict exists in fixture.
Reconciled product-owned role reaches canonical package, projection, Boss, and CustomerSurfaceModel.
Optional/support repair-collapse remains green.
Forbidden surfaces remain closed.
Missing T12 still fails.
Missing Rent Roll still fails.
Screening smoke remains green.
```

Harness hygiene accepted:

```text
No production hardcoding.
No production files changed.
Harness uses neutral Replay Property fixtures.
No Stonebridge / Attack Test / Final Attack strings remain in the Step 5 harness.
```

Expected untracked status at handoff:

```text
?? tests/qa/acquisition-memo-v2-retest18-local-artifact-replay-smoke.js
```

## CVF-18 — shared legacy customer-output authority remains NEXT

CVF-18 is improved but not closed.

Required next audit:

```text
Generate Client Report Authority Audit.
```

The audit must prove:

```text
generate-client-report.js is only public route / request resolver / dispatcher / delivery wrapper;
Screening owns Screening customer output;
Acquisition Memo V2 owns Acquisition customer output;
legacy shared code cannot mutate customer HTML after sealed lane output;
legacy support-doc role inference cannot override V2 reconciled truth;
legacy document treatment/readiness wording cannot override product-owned model truth;
meaning-changing strip/replace/marker helpers are not authority after Boss validation.
```

Pass criteria:

```text
No hidden second Boss in generate-client-report.js.
No post-Boss mutation that can remove source-backed facts.
No post-Boss mutation that can reintroduce forbidden surfaces.
No Screening contamination from Acquisition Memo V2 or shared underwriting cleanup.
```

## CVF-20 — customer-facing launch hygiene required

New pre-launch CVF family:

```text
CUSTOMER_FACING_LAUNCH_HYGIENE_REQUIRED
```

Trigger:

```text
Rob found failed-report copy telling users to email hello@investoriq.tech.
For report failure/report review contexts, the correct mailbox is reports@investoriq.tech.
```

Required email role map:

```text
hello@investoriq.tech = general/contact/sales
support@investoriq.tech = account/platform support
billing@investoriq.tech = payments/credits/invoices
reports@investoriq.tech = failed report, report review, report-generation issues
```

Launch hygiene audit must scan customer-facing surfaces for:

```text
wrong email usage;
em dashes / en dashes used as punctuation;
encoding artifacts such as â€”;
AI / A.I. / artificial intelligence language;
internal terms like Boss, CustomerSurfaceModel, Source Authority, v2, parser, semantic_doc_role;
RETEST / Final Attack / Stonebridge / smoke / debug / legacy leakage;
dead-end failed-report language telling users to simply try again;
stack traces or internal module names.
```

Preferred failed-report doctrine:

```text
Generation paused before publication.
No completed report was published.
Credit restoration language where applicable.
Failure logged for review.
Do not repeatedly retry the same property if it fails again.
Contact reports@investoriq.tech with the property name.
```

CVF-20 must be cleared before launch/public samples/high-value outreach.

## Controlled RETEST 19 posture

Step 5 says:

```text
READY FOR CONTROLLED RETEST 19 technically.
```

Owner control says:

```text
Do not run controlled RETEST 19 until authority audit and launch hygiene audit are done or explicitly deferred by Rob.
```

Recommended next sequence:

```text
1. Commit Step 5 replay harness only if Rob approves.
2. Run Generate Client Report Authority Audit.
3. Run Launch Hygiene / Customer-Facing Copy Audit.
4. Then prepare controlled RETEST 19.
```

## Current CVF stop conditions

Do not run yet:

```text
controlled RETEST 19;
live report generation;
DocRaptor;
Supabase writes;
paid API loops;
public samples;
high-value outreach PDFs;
launch marketing PDFs.
```

Do not patch next by:

```text
hardcoding test values;
weakening Boss;
weakening CustomerSurfaceModel;
adding isolated parser heuristics;
letting generate-client-report.js overrule the sealed lanes;
touching Screening casually;
running live tests before audit/hygiene gates.
```

## Fresh CVF continuation point

```text
June 24 CVF checkpoint.

Steps 2–5 of the RETEST 18 failure-family/root architecture migration are now PASS.

Step 2 sealed lane entry points: PASS + committed.
Step 3 V2 role reconciler/source truth authority: PASS + committed.
Step 4 Boss repair/collapse before final fail: PASS + committed.
Step 5 local RETEST 18-style artifact replay + Screening regression wall: PASS, test file untracked at handoff unless Rob commits it afterward.

New Step 5 file:
tests/qa/acquisition-memo-v2-retest18-local-artifact-replay-smoke.js

Production files changed by Step 5: none.

Step 5 proof:
- valid core T12 + Rent Roll publishes locally;
- parser role conflict is reconciled before Boss/CustomerSurfaceModel;
- optional/support repair-collapse remains green;
- forbidden surfaces remain closed;
- missing T12/Rent Roll still fail;
- Screening smoke remains green;
- no Stonebridge / Attack Test / Final Attack strings remain in the harness.

Active next CVF families before controlled RETEST 19:
- CVF-18 Shared legacy customer-output authority: run generate-client-report authority audit.
- CVF-20 Customer-facing launch hygiene: scan/update failed-report copy, emails, em dashes, encoding artifacts, AI/internal/test leakage.

Rob also earned AWS credits during this session:
- Explore AWS 4 of 5 completed;
- $80/$100 USD earned;
- EC2 launched and terminated;
- RDS/Aurora deferred for safety.

First next-chat action:
Decide whether to commit the Step 5 replay harness. Then run the Generate Client Report Authority Audit prompt. Launch hygiene audit follows before controlled RETEST 19.
```


---
# June 23, 2026 Late CVF Addendum — RETEST 17/18 / Legacy Shared Output Path Becomes Active Root / Dual Sealed Lanes Opened

## Current CVF status after RETEST 17 and RETEST 18

This update supersedes the earlier June 23 CustomerSurfaceModel / hardcoding-firewall CVF checkpoint.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. RETEST 18 again showed core T12 + Rent Roll were usable. They are not the active blocker.

CVF-04 Current debt / proposed acquisition separation:
ACTIVE. Local tests improved, RETEST 17 showed current debt could render, but RETEST 18 exposed that live parser role stamps can still misclassify current debt as purchase assumptions before reconciliation.

CVF-05 V2 containment:
PASS / protect. Forbidden DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces remain closed in current evidence.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE. RETEST 17 proved accepted purchase-assumption truth could be lost/misclassified downstream. RETEST 18 proved wrong parser-accepted role truth can now over-trigger Boss final failure.

CVF-13 Runtime/render stability:
WATCHLIST. RETEST 18 did not crash from code/runtime in the old way; it failed because final Boss compliance blocked publication. However, that is still unacceptable if the only problem is a collapsible/reconcilable support-doc role conflict.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
ACTIVE / NOT CLOSED. Customer output is not yet sealed from old/shared pipeline authority.

CVF-16 Boss Contract / AI Boss Enforcement:
IMPROVED BUT NOT CLOSED. Boss now catches contradictions, but it is still a final guillotine instead of a repair/collapse gate for support-doc conflicts.

CVF-17 Test-report hardcoding risk:
PROTECTED / continue grep. Production hardcoding grep has remained clean in recent receipts.

NEW / ELEVATED ACTIVE FAMILY:
CVF-18 — SHARED_LEGACY_CUSTOMER_OUTPUT_AUTHORITY.

NEW / ELEVATED ACTIVE FAMILY:
CVF-19 — PRODUCT_LANE_SEALING_REQUIRED.
```

## RETEST 17 CVF interpretation

RETEST 17 was a partial pass.

Positive CVF movement:

```text
Core T12/Rent Roll publishability worked.
Current debt facts rendered.
Forbidden advanced underwriting surfaces remained closed.
Boss/model final gate protected several unsafe-output classes.
```

Active failures:

```text
Accepted purchase-assumptions artifact truth did not reach final customer surface correctly.
Final report said purchase assumptions were missing.
Document Treatment mislabeled purchase assumptions as current debt.
```

CVF classification:

```text
CVF-07 / CVF-15 / CVF-16:
accepted artifact truth vs model/customer-surface truth gap.
```

Surgical patch afterward:

```text
Accepted semantic_doc_role / debt_basis precedence added.
CustomerSurfaceModel sourceTruth accepted support indicators added.
Artifact-truth-vs-model validation added.
Document Treatment role precedence fixed.
Hardcoding grep clean.
Screening smoke green.
```

Local status after patch:

```text
PASS locally, but live proof still required.
```

## RETEST 18 CVF interpretation

RETEST 18 failed before publication.

Observed failure:

```text
REPORT_GENERATION_FAILED 500.
Final Acquisition Memo V2 HTML failed Boss compliance.
```

Important CVF distinction:

```text
This is not a core T12/Rent Roll failure.
This is not a DocRaptor/Supabase/storage failure.
This is the Boss final compliance gate stopping publication.
```

Core docs remained usable:

```text
T12 parsed successfully.
Rent Roll parsed successfully.
```

Accepted support facts:

```text
Stonebridge_Assumptions.pdf was accepted correctly as purchase_assumptions / acquisition_financing_assumption.
```

Live parser role conflict:

```text
Current_Debt_Stonebridge.pdf extracted text clearly said Existing Current Debt Statement,
but a loan_term_sheet_parsed artifact stamped it as purchase_assumptions / acquisition_financing_assumption.
```

CVF classification:

```text
CVF-04 / CVF-07 / CVF-16 / CVF-18.

The Boss was fed unreconciled or conflicting parser truth.
Because Boss was acting as final fail gate, a support-doc role conflict could kill a valid-core report.
That violates Core-Gated Publish-or-Collapse doctrine.
```

## CVF doctrine correction after RETEST 18

Do not phrase this as “one more correction.”

The controlling correction is now architectural:

```text
Parser semantic_doc_role is evidence only.
Reconciled product-owned role is authority.
Legacy/shared code cannot be customer-output authority for either product lane.
Boss must repair/collapse support-doc conflicts before final whole-report failure.
```

Accepted invariant:

```text
Valid core T12 + valid core Rent Roll should publish.
Support-doc role conflict should be reconciled if possible.
If unresolved, support section collapses/qualifies/omits.
Whole report fails only for unusable/missing/contradictory core T12/Rent Roll, true runtime/storage/PDF fatal, or unsafe final HTML that remains after repair/collapse.
```

## CVF-18 — SHARED_LEGACY_CUSTOMER_OUTPUT_AUTHORITY

New controlling family:

```text
Issue: legacy/shared code still shares customer-output authority.
```

Symptoms across recent retests:

```text
legacy support-doc authority rows can reclassify accepted artifacts;
legacy document treatment can disagree with source truth;
legacy readiness wording can say support is missing when artifacts exist;
parser role stamps can be treated as accepted truth before reconciliation;
Boss can validate the wrong/incomplete model;
final Boss gate can fail whole report rather than collapse a support lane.
```

Human red-pen decision:

```text
true root architecture blocker.
No further one-off seam patches should be treated as launch path.
```

Required disposition:

```text
Legacy authority may physically remain but must be forbidden from sealed customer-output lanes.
```

## CVF-19 — PRODUCT_LANE_SEALING_REQUIRED

New controlling family:

```text
Both Screening and Acquisition Memo V2 require sealed lanes.
```

Why Screening is included:

```text
Screening is launchable / founder-beta ready.
It must not be exposed to Acquisition Memo V2 patches, Boss/CustomerSurfaceModel logic, or shared underwriting output mutation.
```

Required Screening invariant:

```text
Screening owns Screening source rules, metrics, classification, sections, renderer, validation, and delivery output.
Acquisition Memo V2 must not mutate Screening customer output.
```

Required Acquisition Memo V2 invariant:

```text
Acquisition Memo V2 owns V2 source reconciliation, canonical package, projection, Boss Contract, CustomerSurfaceModel, renderer, final validation, and delivery output.
Screening/legacy/shared final-output mutation must not touch it.
```

Allowed shared helper classes:

```text
shared_formatting_only;
shared_delivery_only;
shared_request_dispatch_only.
```

Forbidden shared helper classes:

```text
document role inference;
support treatment;
section eligibility;
classification;
financing/debt meaning;
customer-facing readiness/disclaimer wording;
meaning-changing final HTML replacement.
```

## Active Codex task at pause

Codex is currently running an audit-only prompt:

```text
Dual-Lane Architecture Audit — Seal Screening + Acquisition Memo V2 / Kill Shared Legacy Customer-Output Authority
```

CVF purpose:

```text
Map exactly which code belongs to Screening, Acquisition Memo V2, shared formatting/delivery/request dispatch, and legacy forbidden authority.
```

Required cut-line table columns:

```text
File/function;
Current behavior;
Current owner;
Future owner;
Screening allowed?;
Acquisition V2 allowed?;
Risk level;
Action needed;
Notes.
```

Future owner labels:

```text
screening_lane;
acquisition_memo_v2_lane;
shared_formatting_only;
shared_delivery_only;
shared_request_dispatch_only;
legacy_forbidden_from_customer_output;
delete_later_after_quarantine.
```

## New migration CVF sequence

### Step 1 — Dual-lane architecture audit

```text
CURRENTLY RUNNING.
No code changes expected.
```

### Step 2 — Thin dispatcher / sealed lane entry points

```text
generate-client-report.js remains one public route.
It dispatches to product-owned internal pipelines.
No new public route because Vercel Hobby route/function cap remains a constraint.
```

### Step 3 — V2 role reconciler

```text
Parser role stamps become evidence.
Reconciled role becomes V2 truth.
Current debt title/body/current balance/monthly payment/maturity must override misleading parser purchase_assumption stamp.
Negative/boundary language must not count as positive role signal.
```

### Step 4 — Boss repair/collapse loop

```text
Boss outcome must include repair/collapse instructions before final fail.
Support role conflicts do not kill valid-core reports if they can be repaired/collapsed.
```

### Step 5 — Live artifact replay + Screening regression wall

```text
Replay RETEST 18 live artifact shape locally.
Prove current debt/purchase assumptions separation, valid-core publish, support conflict collapse, forbidden surface firewall, and Screening green.
```

## Current CVF stop conditions

Do not run:

```text
RETEST 19;
live report generation;
DocRaptor;
Supabase writes;
paid API loops;
public samples;
high-value outreach PDFs.
```

Do not patch next by:

```text
only fixing Current_Debt_Stonebridge;
only fixing Stonebridge_Assumptions;
weakening Boss final gate;
adding another parser heuristic as a standalone launch fix;
adding hardcoded test-report facts;
modifying Screening without sealed-lane intent and regression proof.
```

## First task in next chat

Rob will paste Codex's Dual-Lane Architecture Audit receipt.

Review for:

```text
PASS / PARTIAL / FAIL.
```

Acceptance requires a real cut-line table and migration sequence, not just general architecture commentary.

Expected receipt:

```text
A. Branch/latest commit.
B. Files inspected.
C. Files modified, if any.
D. Cut-line table.
E. Screening sealed-lane recommendation.
F. Acquisition Memo V2 sealed-lane recommendation.
G. Thin dispatcher recommendation.
H. Shared formatting-only helper list.
I. Shared delivery-only helper list.
J. Legacy forbidden customer-output authority list.
K. Highest-risk seams.
L. Proposed 3–5 prompt migration sequence.
M. Confirmation no live services/DocRaptor/Supabase/RETEST 19.
N. Commands run/results.
O. git diff --name-only.
P. git status --short.
Q. Final audit verdict: READY FOR MIGRATION / NOT READY.
```

## Fresh CVF continuation point

```text
June 23 late CVF checkpoint.

RETEST 17 partially passed but showed accepted purchase-assumption support truth could still be lost/mislabeled downstream.
A local patch preserved accepted support truth into canonical/CustomerSurfaceModel/final validation and fixed role precedence.

RETEST 18 then failed before publication because final Boss compliance blocked the report.
T12/Rent Roll were valid.
Stonebridge_Assumptions.pdf was correctly accepted as purchase assumptions.
Current_Debt_Stonebridge.pdf text clearly said Existing Current Debt Statement, but live loan_term_sheet parser stamped it as purchase_assumptions / acquisition_financing_assumption.
Boss caught the contradiction but failed the whole report instead of repairing/collapsing the support lane.

Rob rejected another one-off correction.
New active families:
- CVF-18 SHARED_LEGACY_CUSTOMER_OUTPUT_AUTHORITY;
- CVF-19 PRODUCT_LANE_SEALING_REQUIRED.

Accepted direction:
Seal both Screening and Acquisition Memo V2 lanes.
Keep one public route as dispatcher.
Shared helpers only formatting/delivery/request dispatch.
Legacy authority forbidden from customer output.

Current Codex task:
Dual-Lane Architecture Audit.
First next-chat task:
Review Codex's cut-line receipt for PASS/PARTIAL/FAIL.
No RETEST 19 or live services until audit and migration proof walls pass.
```


---
# June 23, 2026 CVF Addendum — CustomerSurfaceModel Boundary Active / Hardcoding Firewall Opened and Blocked

## Current CVF status after RETEST 16 and CustomerSurfaceModel micro-prompts

This update supersedes the June 22 late orchestrator/T12 propagation CVF checkpoint for the Acquisition Memo V2 workstream.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. Core parse/math is not the active blocker.

CVF-04 Current debt / proposed acquisition separation:
IMPROVED but not globally closed. RETEST 16 showed current debt facts can render, but support-role/customer-surface authority is still not fully model-owned.

CVF-05 V2 containment:
PASS / protect. Forbidden DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces remain closed in current evidence.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE. Source facts exist, but customer-facing role labels, document treatment, acquisition request visibility, and support counts can still drift outside Boss/canonical truth.

CVF-13 Runtime/render stability:
IMPROVED. RETEST 16 published and did not catastrophically fail, but publication success is not enough for launch.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
ACTIVE / NOT CLOSED. RETEST 16 was much better than RETEST 15 but still exposed customer-surface authority and semantic-label issues.

CVF-16 Boss Contract / AI Boss Enforcement:
IMPROVED / PARTIAL. Boss governs part of the V2 final-handoff path but not the whole customer surface.

NEW ACTIVE SUBFAMILY:
CVF-16C / CVF-15H — CUSTOMER_SURFACE_MODEL_NOT_YET_SOVEREIGN.

NEW HARD BLOCKER:
CVF-17 — TEST_REPORT_HARDCODING_RISK.
```

## RETEST 16 CVF interpretation

RETEST 16 moved the product forward:

```text
published successfully;
16 pages returned;
title contamination fixed;
current debt facts rendered;
T12/Rent Roll facts rendered;
Property Taxes / $185,000 rendered;
elite section inventory mostly returned.
```

But RETEST 16 did not close CVF-15/CVF-16.

Observed issue families:

```text
purchase assumptions / proposed acquisition context could be mislabeled or treated as missing;
Acquisition Request Context could collapse despite source-backed facts;
appraisal context could be mislabeled using purchase/debt style labels;
cap-rate value displays could confuse whole-property value with rent-upside capitalized value;
support document counts could inflate from artifact rows;
QA/advisory surfaces could remain misaligned with Boss/canonical truth;
publication could proceed while customer-surface contradictions remain non-fatal/advisory.
```

CVF interpretation:

```text
This is not a Stonebridge-specific patch request.
This is a customer-surface authority failure.
```

## RED authority audit result

Codex performed a read-only authority-chain audit.

Overall verdict:

```text
RED: material surfaces can still freelance source truth, labels, section eligibility, QA severity, and publication decisions.
```

Exact CVF root:

```text
The repo still has multiple authority owners. Canonical, projection, renderer, QA, and delivery logic can each independently infer, relabel, collapse, or block customer-facing surfaces. Boss governs the V2 final-handoff path, but it does not yet own the whole customer-surface contract end-to-end.
```

New active family:

```text
CVF-16C / CVF-15H — CustomerSurfaceModel / RenderSurfaceContract missing.
```

Required invariant:

```text
Boss/canonical truth must produce a CustomerSurfaceModel.
Renderer may only format that model.
Final HTML must validate against the model before success/PDF handoff.
QA cannot become source truth.
Delivery gate must respect deterministic model/Boss violations.
```

## CustomerSurfaceModel implementation micro-prompt status

### Micro Prompt 1 — read-only implementation plan

Status:

```text
PASS.
No files changed.
No code written.
SAFE TO IMPLEMENT.
```

Accepted proposed new file:

```text
api/_lib/acquisition-memo-v2-customer-surface-model.js
```

Accepted functions:

```text
buildAcquisitionMemoV2CustomerSurfaceModel(...)
validateAcquisitionMemoV2CustomerSurfaceModel(model)
validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, model)
summarizeAcquisitionMemoV2CustomerSurfaceModel(model)
```

### Micro Prompt 2 — additive module only

Codex added:

```text
api/_lib/acquisition-memo-v2-customer-surface-model.js
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js
```

Reported:

```text
no existing files modified;
renderer/PDF/publication not rewired;
Screening untouched;
model-only smoke green;
Screening smoke green.
```

Review status:

```text
PARTIAL, not PASS.
```

Why:

```text
Production model validator contained hardcoded RETEST/Stonebridge values.
Optional/support facts were treated too fatally.
visibleClassification could fall back to asset class.
```

## CVF-17 — TEST_REPORT_HARDCODING_RISK

New CVF family opened because a production model validator used fixed test report values.

Issue code:

```text
TEST_REPORT_VALUES_IN_PRODUCTION_VALIDATOR
```

Observed risk:

```text
Production CustomerSurfaceModel HTML validation checked exact Stonebridge/RETEST values such as $6,800,000, $9,450,000, 4.85%, 5.95%, 70.0%, 24 years, 30 years, and 2029-11-01.
```

Human red-pen decision:

```text
true architecture risk;
automatic fail if left in production code;
must be removed before renderer/orchestrator wiring.
```

Controlling doctrine:

```text
Test reports are forks, not the cake.
Test reports diagnose the system.
They must not become production constants.
```

Allowed location for test-specific values:

```text
test fixtures;
smoke tests;
expected-result files;
local assertions.
```

Forbidden location for test-specific values:

```text
production validators;
production renderers;
Boss contract logic;
CustomerSurfaceModel logic;
canonical source logic;
parser logic;
QA routing;
delivery gate;
final HTML/PDF handoff.
```

Required invariant:

```text
Production validation must derive expected values from model facts and format them dynamically.
```

Example correct behavior:

```text
validate formatted(model.sections.currentDebtContext.facts.current_outstanding_balance)
not hardcoded '$6,800,000'.
```

## Optional-support fatalization correction

Current correction required:

```text
Core T12 and core Rent Roll are required.
Optional support documents are not required.
Missing current debt, missing purchase assumptions, missing proposed financing, missing appraisal, missing renovation, missing market survey, or missing environmental context must collapse/omit/qualify — not fail the entire report.
```

Fatal only for:

```text
unusable/contradictory core T12;
unusable/contradictory core Rent Roll;
non-collapsible customer-surface contradiction;
runtime/storage/PDF fatal.
```

## Active Codex task at pause

Codex is currently working on Micro Prompt 2B:

```text
Hardcoding firewall + generic CustomerSurfaceModel correction.
```

Allowed modification scope:

```text
api/_lib/acquisition-memo-v2-customer-surface-model.js
tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js
```

Hard boundaries:

```text
Do not rewire renderer.
Do not modify PDF/publication handoff.
Do not touch Screening behavior.
Do not patch RETEST 16 directly.
Do not add public routes.
Do not weaken Boss.
Do not broadly edit production files.
```

Required Micro Prompt 2B proof:

```text
no Stonebridge/RETEST/fixed test values in production model code;
HTML validator derives expected values from model facts;
optional support gaps are collapseable/omittable/qualifiable, not fatal;
visible classification does not fall back to asset class;
generic non-Stonebridge fixture passes;
negative hardcode proof fails when HTML contains old Stonebridge values for a different model;
optional-support collapse proof passes;
negated current-debt language proof passes;
hardcoding grep is clean for modified production files;
Screening smoke remains green.
```

## Current CVF stop conditions

Do not proceed to Micro Prompt 3 / renderer wiring until Micro Prompt 2B is green.

Do not commit unless Rob explicitly accepts a clean model-only checkpoint.

Do not run:

```text
RETEST 17;
live Stonebridge report;
paid API test loop;
DocRaptor/PDF live handoff;
Supabase writes;
public sample;
high-value outreach PDF;
Ken Dunn launch PDF.
```

Do not patch next by:

```text
hardcoding any test value;
weakening tests to permit production hardcoding;
weakening Boss assertions;
weakening CustomerSurfaceModel validation;
turning optional support absence into fatal failure;
touching Screening production behavior;
wiring renderer before the model is generic and clean.
```

## First task in next chat

Rob will paste Codex's Micro Prompt 2B reply.

Review against:

```text
A. Files modified.
B. No renderer/orchestrator/PDF/publication rewiring.
C. No test-report values hardcoded in production code.
D. Test-specific values only in test files.
E. Optional support gaps collapseable, not fatal.
F. Classification no longer falls back to asset class.
G. Tests added/updated.
H. Commands run and results.
I. Hardcoding grep command and output.
J. Screening behavior untouched.
K. git diff --name-only.
L. git status --short.
M. Verdict PASS / PARTIAL / FAIL.
```

## Fresh CVF continuation point

```text
June 23 CVF checkpoint.

RETEST 16 improved the artifact but did not close customer-surface authority. Codex RED audit confirmed multiple authority owners still exist.
New active family: CVF-16C / CVF-15H — CustomerSurfaceModel / RenderSurfaceContract missing.

Micro Prompt 1 read-only plan: PASS.
Micro Prompt 2 model skeleton: PARTIAL.
New files exist:
- api/_lib/acquisition-memo-v2-customer-surface-model.js
- tests/qa/acquisition-memo-v2-customer-surface-model-smoke.js

Critical risk caught before wiring:
Production model validator hardcoded Stonebridge/RETEST values. New CVF-17 opened: TEST_REPORT_HARDCODING_RISK.

Codex is currently working on Micro Prompt 2B to remove production hardcoding, make validation dynamic/model-derived, make optional support collapseable, fix classification fallback, add generic non-Stonebridge tests, and run hardcoding grep.

Do not proceed to renderer wiring / Micro Prompt 3 until Micro Prompt 2B is genuinely clean.
```


---
# June 22, 2026 Late Addendum — Orchestrator Bypass Partial / Final Boss Fail-Closed / T12 Expense-Line Propagation Gap Active

## Current CVF status after orchestrator extraction work

This update supersedes the earlier June 22 “Boss Contract local proof / legacy firewall next” checkpoint for the Acquisition Memo V2 workstream.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. Core parse/math remains stable and is not the active blocker.

CVF-04 Current debt / proposed acquisition separation:
LOCAL PASS CANDIDATE remains intact under Boss Contract/local smokes. Continue protecting current debt vs proposed acquisition financing separation.

CVF-05 V2 containment:
PASS / protect. Forbidden DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation/BUY/SELL/HOLD surfaces remain closed in local proof.

CVF-07 / CVF-15 Optional support/source package authority:
LOCAL PASS CANDIDATE but not final-artifact closed. Source-backed facts can exist upstream, but final orchestrator path still exposed a T12 expense-line propagation/rendering gap.

CVF-13 Runtime/render stability:
IMPROVED. Publish-or-Collapse remains green. V2 final Boss compliance now fail-closes instead of returning a false-success artifact.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
ACTIVE / NOT CLOSED. Orchestrator bypass is partial. Final handoff proof wall still fails because source-backed T12 expense lines do not render in final returned HTML.

CVF-16 Boss Contract / AI Boss Enforcement:
IMPROVED / PARTIAL. Boss compliance detects the missing T12 expense-line violation and the handler now fail-closes instead of returning success. Remaining work is to make the orchestrator-rendered document consume/render the source-backed T12 expense-line facts.

CVF-16B / CVF-15G Legacy Override After Boss Enforcement:
IMPROVED / PARTIAL. Final Boss handoff seam is now routed through an internal orchestrator and fail-closed, but the broader monster file is not yet quarantined and Acquisition Memo V2 source/context assembly still remains partly inside generate-client-report.js.
```

## Important owner clarification

Rob correctly challenged whether the team is “patching test reports.”

Clarified doctrine:

```text
No test-report patching.
No Stonebridge hardcoding.
No changing test expectations to hide a missing production path.

The Stonebridge Property Taxes / $185,000 row is only the known source-backed fixture used to prove generic T12 expense-line propagation.

Correct fix:
T12 parsed expense_lines
-> canonical/source/document args/Boss truth
-> V2 document renderer
-> final Boss-compliant HTML

Wrong fix:
append "Property Taxes $185,000" or otherwise hard-code the Stonebridge test report.
```

## Current uncommitted working-tree posture

Do not commit the current partial state yet.

Current reported working tree after the latest orchestrator pass:

```text
 M api/generate-client-report.js
 M tests/qa/acquisition-memo-v2-boss-contract-legacy-firewall-smoke.js
?? api/_lib/acquisition-memo-v2-orchestrator.js
?? tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js
```

Reason:

```text
The orchestrator bypass is materially improved but still PARTIAL.
The final-handoff proof wall still fails.
Committing before source-backed T12 expense-line propagation is green would freeze a partial architecture.
```

## What Codex changed during orchestrator work

New internal module:

```text
api/_lib/acquisition-memo-v2-orchestrator.js
```

Important Vercel constraint:

```text
No new public API route/function was created.
The only public API route remains api/generate-client-report.js.
Internal _lib modules do not count as new Vercel API routes/functions.
This respects the Vercel Hobby route/function cap concern.
```

Current orchestrator behavior:

```text
runAcquisitionMemoV2Orchestrator({
  acquisitionMemoV2DocumentArgs,
  acquisitionMemoBossContract
})

The orchestrator now calls renderCompleteAcquisitionMemoV2Html(...), then runs Boss enforcement and validation.
```

This is a real improvement over the first partial orchestrator attempt, which only accepted already-rendered HTML.

## What remains inside generate-client-report.js

Acquisition Memo V2 authority still remaining in the monster file:

```text
request/report-mode resolution;
canonical source package / projection construction;
Boss Contract construction;
V2 context/document-args assembly;
response/PDF/storage wrapper behavior;
legacy non-V2 assembly for other lanes.
```

Current acceptable near-term posture:

```text
generate-client-report.js may remain the public route and plumbing owner.
Acquisition Memo V2 rendering/finalization should keep moving into the orchestrator.
Do not quarantine/delete broad legacy code until the orchestrator final proof is green.
```

## Final Boss compliance behavior after latest patch

Accepted improvement:

```text
If final Boss compliance is false on the V2 final-handoff path, the handler no longer returns success:true.
The harness returns controlled failure (500 in the current smoke), and the PDF path throws before DocRaptor.
```

This closes the prior false-success issue:

```text
handler_boss_compliance.ok === false
but success === true
```

Current status:

```text
false-success seam improved.
final HTML correctness still not green.
```

## Current active failure

Current failing proof wall:

```text
tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js
```

Current failure:

```text
node tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js
fails with 500 == 200
```

Why:

```text
Final Boss compliance is false.
Violation: T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT.
Final returned HTML does not contain Property Taxes / $185,000.
```

Current narrowed root:

```text
Source-backed T12 expense lines exist in the test fixture/source payloads,
but they are not reaching or rendering in final Acquisition Memo V2 customer HTML through the orchestrator path.
```

Open diagnostic question for next Codex reply:

```text
Is the missing T12 expense-line data:
1. absent from acquisitionMemoV2DocumentArgs,
2. absent from Boss source truth,
3. present in args/Boss truth but not rendered by acquisition-memo-v2-document.js,
4. or present in base render but removed during enforcement/finalization?
```

## Tests currently reported green aside from final handoff

Latest reported green checks:

```text
node --check api/generate-client-report.js
node --check api/_lib/acquisition-memo-v2-orchestrator.js
node --check tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js
node --check tests/qa/acquisition-memo-v2-boss-contract-legacy-firewall-smoke.js
node tests/qa/acquisition-memo-v2-normal-path-local-smoke.js
node tests/qa/acquisition-memo-v2-boss-contract-legacy-firewall-smoke.js
node tests/qa/acquisition-memo-v2-publish-or-collapse-smoke.js
node tests/qa/screening-report-smoke.js
git diff --check
```

Final-handoff smoke remains red.

## Current stop conditions

Do not run:

```text
RETEST 14
any live Stonebridge report
paid API testing loop
DocRaptor/PDF live handoff
Supabase writes
public sample generation
high-value outreach report generation
```

Do not commit yet:

```text
api/generate-client-report.js
api/_lib/acquisition-memo-v2-orchestrator.js
tests/qa/acquisition-memo-v2-boss-contract-legacy-firewall-smoke.js
tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js
```

until final source-backed T12 expense-line propagation proof is green or the next checkpoint is explicitly accepted as a safety-only partial commit.

Do not patch next by:

```text
hard-coding Property Taxes / $185,000;
weakening T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT;
changing the final-handoff smoke to expect 500;
adding source-package/render-context injection to the final-handoff smoke;
letting old legacy report assembly render T12 rows for the V2 path;
broad cleanup/quarantine before proof.
```

## Active next task

First action in the next chat:

```text
Rob will upload Codex's reply to the latest source-backed T12 expense-line propagation prompt.
```

Evaluate that reply against:

```text
A. Files modified.
B. Exact root cause of missing T12 expense-line rendering.
C. Whether missing data was absent from acquisitionMemoV2DocumentArgs, absent from Boss source truth, or present but not rendered.
D. Exact fix made.
E. Whether Property Taxes / $185,000 render from source-backed data, not hard-coded.
F. Whether final Boss compliance is true.
G. Whether final-handoff smoke passes.
H. Whether normal-path, legacy-firewall, publish-or-collapse, and Screening smokes pass.
I. Whether forbidden/internal surfaces appear.
J. git diff --name-only.
K. git status --short.
L. Final verdict: Source-backed T12 expense-line propagation PASS / PARTIAL / FAIL.
```

## After source-backed T12 propagation passes

Only after the final-handoff smoke is green:

```text
1. Decide whether to commit the orchestrator + final-handoff proof wall.
2. Run the quarantine audit.
3. Begin shrinking/quarantining generate-client-report.js by ownership boundary.
4. Preserve Screening.
5. Still no RETEST 14 until local final artifact/PDF handoff proof is sealed.
```

## Fresh CVF continuation point

```text
June 22 late checkpoint.

We pivoted from tiny finalizer/row patches to a Vercel-safe Acquisition Memo V2 orchestrator extraction.

Key owner decision:
Do not create a new public API route because Vercel Hobby route/function capacity is constrained.
Use api/generate-client-report.js as the existing public dispatcher and put new internals under api/_lib.

Completed/partial:
- api/_lib/acquisition-memo-v2-orchestrator.js created.
- Orchestrator now calls renderCompleteAcquisitionMemoV2Html(...).
- generate-client-report.js delegates V2 rendering/finalization to the orchestrator.
- Final Boss compliance now fail-closes instead of returning success:true when false.
- No new public API route was created.
- Normal-path, legacy-firewall, publish-or-collapse, and Screening smokes remain green.

Still failing:
- tests/qa/acquisition-memo-v2-final-pdf-handoff-smoke.js returns 500 instead of 200.
- Final Boss compliance violation: T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT.
- Final returned HTML does not include source-backed Property Taxes / $185,000.

Critical clarification:
We are not patching the Stonebridge test report.
Property Taxes / $185,000 is a known fixture proving generic source-backed T12 expense-line propagation.
The fix must make any source-backed T12 expense_lines render through the V2 orchestrator path.

Current first task in next chat:
Review Codex's next reply to the source-backed T12 expense-line propagation prompt.
No commit, no live test, no quarantine, and no RETEST 14 until that proof wall is green.
```

# June 22, 2026 CVF Addendum — CVF-16 Boss Contract Implemented Locally / Test Hooks Guarded / Legacy Override Firewall Next

## Current CVF status

This update supersedes the June 20 evening CVF checkpoint for the Acquisition Memo V2 workstream.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. Core parse/math is not the active failure family.

CVF-04 Current debt / proposed acquisition separation:
LOCAL BOSS-CONTRACT PASS CANDIDATE. Current debt/proposed financing separation is now asserted by Boss Contract render/handler smokes, but not yet live-PDF proven.

CVF-05 V2 containment:
PASS / protect. Forbidden advanced underwriting surfaces remain closed in local proof.

CVF-07 / CVF-15 Optional support/source package authority:
LOCAL PASS CANDIDATE under Boss Contract. Source-backed facts now drive required sections in local V2 renderer/handler smokes.

CVF-13 Runtime/render stability:
IMPROVED. Publish-or-Collapse and handler local proof are green. Top-level Supabase import warning remains a non-blocking local import caveat.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
IMPROVED / NOT CLOSED. Local V2 render/handler final_html proof is green, but live PDF/customer artifact and visual proof remain pending.

CVF-16 Boss Contract / AI Boss Enforcement:
LOCAL PASS CANDIDATE. Boss Contract is now implemented and locally enforced. Remaining risk is downstream legacy override after Boss enforcement.
```

## CVF-16 root issue recap

Issue code:

```text
AI_BOSS_ADVISORY_NOT_SOVEREIGN
```

Original failure pattern:

```text
QA Manager / QA Director / QA Action Plan were advisory.
They could flag but not enforce.
Renderers and late legacy final-html paths could still omit source-backed facts.
```

Correct invariant:

```text
Boss decides source truth, required facts, section eligibility, collapse rules, forbidden surfaces, and post-render assertions.
Renderer formats/lays out only from the Boss-approved contract.
Post-render compliance catches renderer disobedience before PDF/storage.
```

## CVF-16 implementation status

Accepted new/active module:

```text
api/_lib/acquisition-memo-boss-contract.js
```

Accepted functions:

```text
buildAcquisitionMemoBossContract
validateAcquisitionMemoBossContract
validateAcquisitionMemoRenderAgainstBossContract
enforceAcquisitionMemoBossContractOnHtml
```

Accepted Boss enforcement coverage:

```text
unitMix
capRateValueIndication
currentDebtContext
proposedFinancingContext
acquisitionRequestContext
operatingStatementTTMSummary
documentTreatment
lenderDiligenceChecklist
forbiddenSurfaces
```

Accepted post-render violation families:

```text
UNIT_MIX_NO_FALSE_MISSING_ROWS_TEXT
NO_PER_UNIT_DASH_WITH_UNITS
NO_ZERO_CAP_RATE
CURRENT_DEBT_FACTS_REQUIRED_WHEN_SOURCE_BACKED
PROPOSED_FINANCING_FACTS_REQUIRED_WHEN_SOURCE_BACKED
T12_EXPENSE_LINES_REQUIRED_WHEN_PRESENT
DOCUMENT_TREATMENT_CORE_SOURCES_REQUIRED
NO_FORBIDDEN_SURFACES
```

## RETEST 13 failures now locally blocked by Boss Contract

The local render/handler smokes now target the exact RETEST 13 customer failures:

```text
false Unit Mix fallback despite source-backed unit_mix/units;
cap-rate per-unit dashes when units exist;
0.0% / invalid cap rate;
current-debt Not available text when facts exist;
proposed financing omission when source-backed;
T12 expense-line omission when structured expense detail exists;
core T12/Rent Roll source treatment omissions;
forbidden DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation/BUY/SELL/HOLD surfaces.
```

Current CVF interpretation:

```text
RETEST 13 failure classes are locally guarded.
They are not live-PDF closed until controlled final artifact proof occurs later.
```

## Handler/final-html local proof

New test:

```text
tests/qa/acquisition-memo-v2-boss-contract-handler-smoke.js
```

CVF purpose:

```text
Prove the actual generate-client-report.js local final_html path builds the Boss Contract, validates it, renders V2 HTML, enforces Boss compliance, and returns compliant final_html before DocRaptor/storage.
```

Accepted assertions:

```text
Boss Contract validates.
coreGate.publishAllowed true.
unitMix/currentDebt/proposedFinancing sourceBacked true.
handler returns 200/success true/report_mode v1_core.
validateAcquisitionMemoRenderAgainstBossContract(...).ok true on returned final_html.
Required facts appear:
- 1BR / 2BR Unit Mix rows
- Current Outstanding Balance $6,800,000
- Proposed Acquisition Loan $9,450,000
- Property Taxes $185,000

Forbidden outputs absent:
- false missing unit mix fallback
- per-unit dash rows
- 0.0% going-in cap row
- Current Debt Maturity Not available
- Maturity Date Not available
- DSCR/refi/DCF/waterfall/equity return/deal score/final recommendation/BUY/SELL/HOLD/loan approval/lender commitment
- Boss Contract / Source Authority / V2 projection / debug stack language
```

Negative enforcement proof:

```text
Bad HTML containing false unit-mix fallback, per-unit dash, Current Debt Maturity Not available, and DSCR is rejected/flagged.
Repair path removes false fallback, Not available text, and DSCR.
```

## Test-hook safety CVF disposition

Test-hook risk was opened because the handler proof used test-only fields.

Risk:

```text
Normal customer request must not be able to send __test_* fields and trigger source-package injection or final_html return.
```

Disposition:

```text
PASS candidate / locally proven.
```

Accepted guard:

```text
isTestHarnessAllowed()
hasTestHarnessFields(body)

Test-only body fields honored only when:
NODE_ENV === "test"
OR
INVESTORIQ_ENABLE_TEST_HOOKS === "true"

Unauthorized __test_* fields return 403 before render work.
```

Protected fields:

```text
__test_return_final_html
__test_enable_acq_memo_v2_source_authority
__test_acq_memo_v2_source_package
__test_acq_memo_v2_render_context
__test_payloads
```

Negative test:

```text
NODE_ENV=production with no INVESTORIQ_ENABLE_TEST_HOOKS and request containing __test_return_final_html / __test_acq_memo_v2_source_package returns 403.
```

CVF interpretation:

```text
The local proof seam is not production-customer reachable when the guard is present.
```

## CVF-15 / CVF-16 remaining risk — legacy override after Boss enforcement

Current active remaining family:

```text
CVF-16B / CVF-15G — LEGACY_OVERRIDE_AFTER_BOSS_ENFORCEMENT
```

Risk:

```text
generate-client-report.js remains a large legacy orchestration file.
Even if V2 renderer obeys Boss Contract, an old downstream transform might strip, replace, append, or contaminate Boss-compliant HTML after enforcement.
```

This is the next bounded root task.

Required proof:

```text
Trace V2 final HTML from renderCompleteAcquisitionMemoV2Html(...)
through enforceAcquisitionMemoBossContractOnHtml(...)
to final_html / DocRaptor / storage handoff.

Identify every downstream transform touching htmlString/finalHtml/safeHtml.

Ensure final Boss compliance runs at the last safe point before final_html/PDF/storage.

Prove no legacy strip/replace/marker/QA/delivery transform can reintroduce forbidden surfaces or remove required Boss facts after final enforcement.
```

Required smoke:

```text
tests/qa/acquisition-memo-v2-boss-contract-legacy-firewall-smoke.js
```

CVF pass criteria for the firewall:

```text
Required Boss facts survive all final transforms:
- Unit Mix rows
- cap-rate per-unit values
- Current Outstanding Balance
- current debt rate/amortization/monthly payment/maturity
- Proposed Acquisition Loan
- proposed LTV/rate/amortization/lender fee
- T12 expense lines

Forbidden surfaces remain absent after all final transforms:
- DSCR
- refi/refinance
- DCF
- waterfall
- equity return
- deal score
- final recommendation
- BUY/SELL/HOLD
- loan approval
- lender commitment

Internal implementation/debug language remains absent:
- Boss Contract
- V2 Canonical Package
- Source Authority
- canonical source package
- V2 projection
- assertion code names
- stack traces
```

## generate-client-report.js file-size posture

The file remains very large:

```text
~13,368 lines
```

CVF interpretation:

```text
This is a maintainability risk, not the active CVF blocker by itself.
The recent work extracted authority/Boss components, not a full platform-generator decomposition.
Do not begin a broad file-size cleanup until Boss sovereignty and legacy override firewall are proven.
```

Future cleanup family:

```text
GENERATOR_DECOMPOSITION_FUTURE
```

Not active launch blocker unless it causes Boss override, Screening regression, or delivery risk.

## Current stop condition

Do not run:

```text
RETEST 14
additional live Stonebridge reports
paid API testing loops
public sample generation
high-value outreach report generation
```

Do not patch next:

```text
unit mix alone
current debt alone
cap-rate per-unit alone
T12 expense rows alone
stray zero alone
visual polish alone
generate-client-report.js broad cleanup
```

Reason:

```text
Boss sovereignty and legacy override firewall must be proven before symptom work or live testing resumes.
```

## Updated CVF launch posture

```text
Screening:
Launchable / founder-beta ready. Protected.

Acquisition Memo:
Not launch-cleared.
CVF-16 is locally improved and near root-close, but legacy override firewall and normal-path/PDF proof remain pending.
CVF-15 still not closed until customer artifact/PDF proof passes.

Full Underwriting V2:
Deferred.
```

## Fresh CVF continuation point

```text
June 22 CVF checkpoint.

Boss Contract has moved from investigation to local implementation.

Completed locally:
- acquisition-memo-boss-contract.js created and hardened.
- Boss Contract validates source truth, core gate, section requirements, factAvailability, forbidden surfaces, render requirements, post-render assertions.
- V2 renderer consumes Boss Contract.
- generate-client-report.js builds Boss Contract under the V2 path.
- enforceAcquisitionMemoBossContractOnHtml(...) runs locally before final_html return.
- handler/final-html smoke passes.
- test-hook production safety guard rejects __test_* fields with 403 unless NODE_ENV=test or INVESTORIQ_ENABLE_TEST_HOOKS=true.
- Screening smoke passes.
- No live tests, no DocRaptor, no Supabase writes, no paid services.

Current active next family:
CVF-16B / CVF-15G — Legacy override after Boss enforcement.

Next task:
Run Boss Sovereignty / Legacy Override Firewall prompt.
Prove no downstream legacy mutation can override Boss-compliant Acquisition Memo V2 HTML before final_html/PDF/storage.

No RETEST 14.
No live reports.
No visual polish patch.
No broad generate-client-report cleanup.
```


---

# June 20, 2026 Evening CVF Addendum — RETEST 13 Published / CVF-15 Not Closed / Boss Contract Authority Family Opened

## Current CVF status

This update supersedes the June 20 morning CVF checkpoint for the Acquisition Memo V2 workstream.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. Core parse/math is not the active failure family.

CVF-04 Current debt / proposed acquisition separation:
VISIBLE OUTPUT STILL INCOMPLETE. Current debt role can be recognized in source treatment, but current debt facts still failed to render in Debt / Financing Context.

CVF-05 V2 containment:
PASS / protect. Do not reopen advanced underwriting surfaces.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE. Source facts exist upstream but still do not reliably reach customer-visible V2 output.

CVF-13 Runtime/render stability:
IMPROVED. RETEST 12 fatal helper crash was addressed by Publish-or-Collapse hardening; RETEST 13 published.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
ACTIVE / NOT CLOSED. RETEST 13 published but failed elite fact-consumption and quality review.

NEW ACTIVE FAMILY:
CVF-16 Boss Contract / AI Boss Enforcement:
OPEN. AI/QA Boss is currently advisory/fragmented and not mechanically sovereign over V2 renderers.
```

## Doctrine correction after RETEST 12

Old shorthand:

```text
Publish-or-Fail
```

Corrected doctrine:

```text
Core-Gated Publish-or-Collapse
```

Rules:

```text
If core T12 and core Rent Roll are valid, the report publishes.
Optional/support/rendering issues collapse, omit, qualify, or disclose.
Complete report failure should be allowed only for truly unusable core docs, fatal T12/Rent Roll contradiction, or true platform/infrastructure failure.
```

CVF implication:

```text
CVF-13 should not be triggered by optional/support renderer branch errors.
Those must be contained section-level failures.
```

## RETEST 12 CVF result

RETEST 12 failure:

```text
REPORT_GENERATION_FAILED
{"error":"extractPercentFraction is not defined"}
```

CVF classification:

```text
Family: CVF-13 runtime/render stability.
Subfamily: optional/support renderer branch caused whole-report failure.
Human red-pen decision: true doctrine violation.
Customer visible: report failed before publication.
Core docs affected: no.
Patch required: yes.
Regression required: yes.
```

Disposition:

```text
Patched through Publish-or-Collapse hardening before RETEST 13.
```

## Publish-or-Collapse hardening CVF effect

Codex patch reportedly added:

```text
section-level renderSafely(...);
top-level V2 fallback;
missing current-debt text fallback helpers;
V2 final-HTML gate away from fatal post-render source-reconciliation / section-heal logic;
new publish-or-collapse smoke.
```

CVF interpretation:

```text
CVF-13 improved materially.
Optional/support branch failures should collapse instead of taking down the whole Acquisition Memo V2 report.
```

## RETEST 13 CVF result

RETEST 13 published successfully.

Runtime:

```text
git_commit_sha / build_marker: 9b57e4c41754ed1df6b35cb14e617392da97e076
deployment_id: dpl_8gLWdPumM8sW3PCPf96ybfBp8ZG3
job_id: 5e7d7ad2-1b26-4b62-ab18-7cea8b325fd7
report_id: 2dfda2af-9276-4fb3-8d28-8cc18babacb8
```

Publication result:

```text
rendering -> pdf_generating -> publishing -> published
email_sent: report_published
```

CVF interpretation:

```text
CVF-13 runtime publication reliability improved.
But CVF-15 remains open because customer-visible fact rendering and artifact quality failed elite review.
```

## RETEST 13 CVF failures

### CVF-15A — Unit mix live artifact facts not consumed

Observed PDF:

```text
No parsed unit mix rows were available from the canonical rent roll evidence.
```

Observed artifact truth:

```text
rent_roll_parsed accepted:
- total_units: 64
- occupancy: 0.9375
- unit_mix present
- full units array present
```

CVF classification:

```text
Family: CVF-15 optional-support/source-package/final-render fact propagation.
Human red-pen decision: true customer-artifact bug.
Launch blocker for Acquisition Memo elite/public sample: yes.
```

### CVF-15B — Cap-rate per-unit values missing

Observed PDF:

```text
Cap-rate implied values rendered, but Per Unit column showed dashes.
```

Expected:

```text
5.0%: $295,313 per unit
6.0%: $246,094 per unit
7.0%: $210,937 per unit
```

CVF classification:

```text
Family: CVF-15 final-render fact propagation.
Cause signal: unit count available upstream but not consumed by cap-rate value section.
```

### CVF-04 / CVF-15C — Current debt facts missing from customer output

Observed PDF:

```text
Debt / Financing Context only showed Maturity Date Not available.
```

Observed source truth:

```text
Current Outstanding Balance $6,800,000
Interest Rate 4.85%
Amortization Remaining 24 years
Monthly Payment $39,250
Maturity Date 2029-11-01
```

CVF classification:

```text
Family: CVF-04 and CVF-15.
Role separation improved in Document Treatment, but fact rendering remains incomplete.
Launch blocker for Acquisition Memo elite/public sample: yes.
```

### CVF-04 / CVF-15D — Proposed acquisition financing facts omitted

Observed PDF Acquisition Request Context:

```text
Purchase Price $13,500,000
NOI Basis $945,000
Going-In Cap Rate 7.0%
```

Observed source truth:

```text
Proposed Acquisition Loan $9,450,000
Proposed LTV 70.0%
Proposed Interest Rate 5.95%
Proposed Amortization 30 years
Lender / Origination Fee 0.85%
```

CVF classification:

```text
Family: CVF-04 and CVF-15.
Proposed acquisition financing is source-backed but not visible in Acquisition Request Context.
Must remain separate from current debt and must not open DSCR/refi/DCF/waterfall/final recommendation.
```

### CVF-15E — T12 expense lines missing from Operating Statement / TTM

Observed artifact truth:

```text
expense_lines present:
Property Taxes $185,000
Insurance $72,000
Repairs & Maintenance $104,000
Utilities $86,000
Property Management $60,000
Payroll / Admin $28,000
```

Observed PDF:

```text
Operating Statement / TTM rendered only high-level totals.
```

CVF classification:

```text
Family: CVF-15 final-render fact propagation.
Launch blocker for elite memo density/quality: yes.
```

### CVF-15F — Visual polish / public sample blockers

Observed:

```text
64-Unit Multifamily 0 stray zero.
Sparse page density.
Repeated Review / Source Reconciliation Disclosure wording.
DocRaptor test mode / production PDF not enabled.
```

CVF classification:

```text
Visual/product quality blockers for public sample/high-value outreach.
DocRaptor test mode is distribution config, not Acquisition Memo logic.
```

## New CVF-16 — AI Boss / Boss Contract enforcement gap

Issue code:

```text
AI_BOSS_ADVISORY_NOT_SOVEREIGN
```

Observed failure pattern:

```text
QA Manager / QA Director / QA Action Plan can flag issues but are advisory only.
They do not mutate reports, parser values, worker state, or publication state.
Renderers can still ignore source-backed facts or output contradictory gaps.
```

Human red-pen decision:

```text
true_root_architecture_gap
```

Core distinction:

```text
The AI Boss must not invent or freehand rewrite customer output.
But renderers must not have final truth authority.
The Boss must define the contract; renderers must obey it.
```

Required invariant:

```text
Boss decides source truth, required facts, section eligibility, collapse rules, forbidden surfaces, and post-render assertions.
Renderer formats and lays out only from the Boss-approved contract.
Post-render compliance must catch renderer disobedience before PDF.
```

Correct architecture:

```text
uploaded files
-> parsers/extraction
-> canonical source package
-> acquisition memo projection
-> Boss Contract
-> renderer consumes Boss Contract
-> post-render Boss compliance check
-> deterministic repair/collapse if needed
-> final PDF
```

Forbidden architecture:

```text
renderer builds output from scattered facts
-> QA Boss writes advisory notes after PDF/customer artifact is effectively built
```

CVF-16 must be closed before further symptom patches.

## Current stop condition

Do not run:

```text
RETEST 14
additional live Stonebridge runs
paid API testing loops
public sample generation
high-value outreach report generation
```

Do not patch next:

```text
unit mix alone
current debt alone
cap-rate per-unit alone
T12 expense rows alone
stray zero alone
visual polish alone
```

Reason:

```text
Those are downstream symptoms until Boss Contract enforcement is settled.
```

## Active Codex investigation

Current Codex task:

```text
AI Boss / Boss Contract Architecture Investigation
```

Purpose:

```text
Map current authority layers, prove whether AI Boss is true/partial/advisory, identify renderer autonomy, design Boss Contract module/function/object shape, and define enforcement flow and tests.
```

Expected Codex output:

```text
A. Executive verdict
B. Current authority map
C. Renderer autonomy map
D. Missing Boss Contract design
E. Enforcement flow
F. RETEST 13 examples
G. Required code changes later
H. Required tests later
I. Risks and hallucination prevention
J. Recommendation
```

No code changes in this investigation.

## Updated CVF launch posture

```text
Screening:
Launchable / founder-beta ready. Protected.

Acquisition Memo:
Not launch-cleared.
CVF-13 improved after Publish-or-Collapse patch.
CVF-15 remains open due final fact propagation/customer artifact issues.
CVF-16 is now the controlling root family: AI/Boss contract enforcement is not yet sovereign.

Full Underwriting V2:
Deferred.
```

## Fresh CVF continuation point

```text
June 20 evening CVF checkpoint.

RETEST 12 failed with extractPercentFraction undefined. This opened a corrected doctrine: Core-Gated Publish-or-Collapse.
Codex patched section-level render safety, top-level fallback, helper definitions, and V2 fatal guard downgrade.
No-paid preflight passed.
RETEST 13 published successfully on SHA 9b57e4c41754ed1df6b35cb14e617392da97e076, proving publication reliability improved.

But RETEST 13 remains HOLD:
- unit mix failed despite parsed unit_mix/units;
- cap per-unit values were dashes;
- current debt facts did not render;
- proposed acquisition financing facts omitted;
- T12 expense lines omitted;
- stray 0 and visual sparsity remain;
- DocRaptor production mode still off.

Rob then correctly challenged the AI Boss premise. Current finding: QA/Boss layers are advisory inspectors, not mandatory pre-PDF enforcement. Open new family CVF-16: AI_BOSS_ADVISORY_NOT_SOVEREIGN.

Codex is currently running an investigation-only Boss Contract Architecture prompt.
No code changes, no live tests, no paid services.
No further symptom patches until Boss Contract architecture is accepted.
```


---

# June 20, 2026 Morning CVF Addendum — RETEST 10 Added CVF-15 Subfamilies / Golden Parity Patch Candidate / Ledger Near Archive

## Current CVF status

This update supersedes the June 17 RETEST 6 CVF addendum for the Acquisition Memo V2 workstream.

Current CVF posture:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected. Core math is not the active failure family.

CVF-04 Current debt / proposed acquisition separation:
PASS candidate after V2 source-authority work, but live RETEST 11 proof still required.

CVF-05 V2 containment:
PASS / protect. Do not reopen advanced underwriting surfaces.

CVF-07 / CVF-15 Optional support/source package authority:
ACTIVE PASS CANDIDATE. RETEST 10 exposed additional source-fallback and renderer-zero-guard issues; latest patch reportedly addresses them.

CVF-13 Runtime/render stability:
PASS for publication mechanics in RETEST 10, but customer-visible render quality failed.

CVF-15 Acquisition Memo V2 final document ownership / customer artifact quality:
ACTIVE / RETEST 11 REQUIRED.
```

## RETEST 10 CVF interpretation

RETEST 10 was a valid live retest and a true customer-artifact failure, but it was not a broad core-engine collapse.

Observed state:

```text
Core T12/Rent Roll math generally held.
PDF generated/published.
Forbidden V2 surfaces remained closed.
But Acquisition Memo visual/content parity and one support-doc cap-rate value failed customer expectations.
```

Customer-visible failure:

```text
Going-In Cap Rate rendered as 0.0%.
Implied value at going-in cap rate rendered as Not available.
Report still looked/read materially worse than RETEST 5.
```

CVF mapping:

```text
CVF-07 / CVF-15:
Support-doc cap-rate source truth existed but was not carried through robustly.

CVF-15:
V2 document owner still did not reproduce RETEST 5 golden visual/content parity.

CVF-13:
No catastrophic runtime failure, but rendered customer artifact quality failed.
```

## New CVF subfamily — invalid zero-value render guard

Issue code:

```text
ACQ_MEMO_GOING_IN_CAP_ZERO_RENDERED
```

Failure:

```text
The report rendered Going-In Cap Rate 0.0% when source-backed cap-rate truth existed or when the field should have collapsed/qualified.
```

Human red-pen decision:

```text
true_bug_non_launch_blocker_for_core_engine
true_launch_blocker_for_Acquisition_Memo_customer_quality
```

Required invariant:

```text
A missing/null/invalid going-in cap rate must never render as 0.0%.
0.0% is not a valid missing-data display for an Acquisition Memo going-in cap rate.
```

Required behavior:

```text
If support-doc source truth exists, deterministically extract and render it.
If no valid source truth exists, omit/qualify the row or collapse the derived field.
Do not fabricate.
Do not render a fake zero.
```

## New CVF subfamily — AI recovery failure without deterministic support-doc fallback

Issue code:

```text
ACQ_MEMO_SUPPORT_DOC_AI_RECOVERY_FALLBACK_GAP
```

Failure:

```text
AI support-doc recovery/provider path failed, and deterministic fallback did not extract Going-In Cap Reference7.00% from source text.
```

Required invariant:

```text
Obvious source-text patterns must be handled deterministically when AI recovery fails.
```

Required patterns:

```text
Going-In Cap Reference7.00%
Going-In Cap Reference 7.00%
Going-In Cap Rate 7.00%
Going-In Cap 7.0%
```

## New CVF subfamily — class-name parity is not golden parity

Issue code:

```text
ACQ_MEMO_RETEST5_GOLDEN_PARITY_GAP
```

Failure:

```text
The system reused old shell/classes but did not restore the full RETEST 5 section content, density, narrative rhythm, tables, and memo flow.
```

Required invariant:

```text
Smoke tests must assert RETEST 5 visible content and key tables/values, not merely old CSS class names.
```

Golden parity requirements include:

```text
64-Unit Multifamily / ACQUISITION MEMO identity.
Key Metrics Snapshot.
Key Upside Drivers.
Primary Constraint / Review disclosure.
Unit Mix and Rent Positioning.
Rent Upside / Value Sensitivity.
Cap-Rate Value Indication.
Acquisition Request Context.
Operating Support.
Rent / Value Support.
Debt / Financing Context.
Operating Statement / TTM Summary.
T12 expense rows.
Per-unit metrics.
Source Context / Support Document Treatment.
Methodology & Data Transparency.
```

## Latest patch candidate CVF effects

Codex reported a three-file patch:

```text
api/_lib/acquisition-memo-v2-document.js
api/_lib/canonical-source-package.js
tests/qa/acquisition-memo-v2-document-smoke.js
```

Claimed CVF fixes:

```text
ACQ_MEMO_GOING_IN_CAP_ZERO_RENDERED:
Shared valid cap-rate resolver rejects zero and invalid/unreasonable values.

ACQ_MEMO_SUPPORT_DOC_AI_RECOVERY_FALLBACK_GAP:
canonical-source-package extracts Going-In Cap Reference patterns from support-doc text.

ACQ_MEMO_RETEST5_GOLDEN_PARITY_GAP:
Smoke now asserts richer RETEST 5-style sections, values, unit mix, T12 line items, cap-rate values, and forbidden regressions.

CVF-01 / CVF-02 support:
Core T12/Rent Roll structured parser artifacts are now carried into canonical source package and rendered before text parsing fallback.
```

Reported checks:

```text
node --check api/_lib/acquisition-memo-v2-document.js
node --check api/_lib/canonical-source-package.js
node --check api/_lib/acquisition-memo-projection.js
node --check tests/qa/acquisition-memo-v2-document-smoke.js
node tests/qa/acquisition-memo-v2-document-smoke.js
node tests/qa/source-authority-smoke.js
node tests/qa/screening-report-smoke.js
node tests/qa/report-type-normalization-smoke.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

Current CVF interpretation:

```text
Local PASS candidate.
Not CVF-15 closed until RETEST 11 live PDF proves it.
```

## CVF ledger disposition recommendation

The CVF ledger should remain available through RETEST 11, but it is approaching archive/freeze status.

Recommended rule:

```text
Do not keep expanding the CVF ledger indefinitely after CVF-15 is proven.
Use it through RETEST 11.
If RETEST 11 passes, freeze/archive this file as historical root-cause/failure-family doctrine and use the Master Context as the active live handoff.
If RETEST 11 fails, update only the relevant active CVF family/subfamily, not the entire ledger.
```

Rationale:

```text
The CVF ledger has served its purpose: it identified and organized the core failure families.
The live workstream is now narrower: prove Acquisition Memo V2 golden parity and source-authority output with one live PDF.
```

## RETEST 11 CVF pass criteria

CVF-15 can move toward PASS only if RETEST 11 proves:

```text
1. Customer PDF looks/read materially like RETEST 5, not RETEST 10.
2. Occupancy displays around 93.8%, not 0.9%.
3. Going-In Cap Rate displays 7.0%, not 0.0%.
4. Implied value at going-in cap displays $13,500,000, not Not available.
5. Unit mix rows render from structured or text evidence.
6. T12 expense rows render from structured or text evidence.
7. T12 and Rent Roll remain core quantitative sources.
8. Purchase assumptions, current debt, Reno, appraisal, market survey, and Phase I roles remain correct.
9. Current debt facts come from Current_Debt_Stonebridge.pdf.
10. Document Treatment appears inside body.
11. No forbidden V2/advanced underwriting surfaces appear.
12. Screening remains protected.
```

## Fresh CVF continuation point

```text
June 20 morning CVF checkpoint.

RETEST 10 added three active CVF-15 subfamilies:
- ACQ_MEMO_GOING_IN_CAP_ZERO_RENDERED
- ACQ_MEMO_SUPPORT_DOC_AI_RECOVERY_FALLBACK_GAP
- ACQ_MEMO_RETEST5_GOLDEN_PARITY_GAP

Latest Codex patch reportedly fixes them locally by:
- adding a valid cap-rate resolver that rejects zero;
- extracting Going-In Cap Reference patterns deterministically;
- carrying structured T12/Rent Roll parser facts into canonical source package;
- rendering structured unit mix and T12 line items before text fallback;
- strengthening RETEST 5 golden parity smoke.

CVF status:
Local PASS candidate only.
Run exactly one live RETEST 11 before closing CVF-15 or archiving the ledger.
```



---

# June 17, 2026 Afternoon CVF Addendum — RETEST 6 Live Failure / Local Patch Candidate for CVF-15 + Visual Shell Regression

## Current CVF status

Final Attack Test 8 RETEST 6 was a valid live production retest and a true customer-visible failure.

Runtime marker:

```text
git_commit_sha / build_marker: 6721252350d211ba23194c6bdd00ac04c135cd3e
deployment_id: dpl_AnFg1yqCBhXvtps28U335rBuTj2L
```

CVF status after RETEST 6:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
UPSTREAM PASS.
T12 and Rent Roll artifacts existed and parsed.
Rent roll occupancy artifact was 0.9375.

CVF-04 Current debt / proposed acquisition separation:
FAIL IN LIVE CUSTOMER OUTPUT.
Current debt source text existed but did not reach visible V2 readiness/source treatment correctly.

CVF-05 V2 containment:
PASS / protect.
No reason to reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final recommendation.

CVF-07 / CVF-15 Optional support/source package authority:
FAIL IN LIVE CUSTOMER OUTPUT.
Support docs were extracted upstream but rendered as missing/Other Support.

CVF-13 Runtime/render stability:
PASS for publication mechanics, FAIL for customer-visible render quality.
Report generated and published, but output was not acceptable.

CVF-15 Acquisition Memo V2 final document ownership:
ACTIVE.
V2 owned the document, but the document owner was too thin and not production-grade.
```

## RETEST 6 failure evidence

Visible PDF failures:

```text
Occupancy displayed as 0.9%.
Purchase assumptions uploaded: No.
Existing debt context uploaded: No.
Renovation plan uploaded: No.
Appraisal uploaded: No.
Market survey uploaded: No.
Most support documents rendered as Other Support Document / Context only.
PDF collapsed to a thin 3-page V2 skeleton instead of a production-grade Acquisition Memo.
```

Artifact evidence showed upstream source truth was present:

```text
Current_Debt_Stonebridge.pdf had current balance, rate, amortization, payment, and maturity text.
Stonebridge_Assumptions.pdf had purchase price, NOI basis, proposed loan, LTV, rate, amortization, and fee text.
Stonebridge_Reno_Plan.pdf had structured renovation budget, rent lift, and phasing text.
Rent roll artifact had occupancy 0.9375.
```

CVF interpretation:

```text
The upstream extraction layer did not fully collapse.
The live failure was artifact-shape ingestion + V2 projection/source-package propagation + V2 visual shell completeness.
```

## Local patch candidate after RETEST 6

Codex produced a bounded patch and reported green checks.

Files changed:

```text
api/_lib/canonical-source-package.js
api/_lib/acquisition-memo-v2-document.js
tests/qa/acquisition-memo-v2-document-smoke.js
```

No changes to:

```text
api/generate-client-report.js
Screening
Stripe
Supabase
DocRaptor
auth/payment/upload gates
SQL
Admin Dashboard
pricing
delivery gate behavior
```

## CVF fixes claimed by patch

### CVF-04 / CVF-07 / CVF-15 — live artifact-shape classification

`canonical-source-package.js` now consumes live-shaped artifacts such as:

```text
artifact-only support docs
original_filename
payload.document_text_extracted
snake_case names
underscore-heavy filenames
```

Expected roles now asserted by smoke:

```text
T12_Stonebridge_Lofts_Attack_Test_8.xlsx -> core_t12
Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx -> core_rent_roll
Stonebridge_Assumptions.pdf -> purchase_assumptions
Current_Debt_Stonebridge.pdf -> current_debt_context
Stonebridge_Reno_Plan.pdf -> structured_renovation_capex_plan
Stonebridge_Appraisal_Summary.pdf -> appraisal_context
Stonebridge_Market_Survey.pdf -> market_survey_context
Stonebridge_Phase_I_ESA.pdf -> environmental_context
```

### CVF-01 / CVF-02 rendered occupancy formatting

`acquisition-memo-v2-document.js` now renders:

```text
0.9375 -> 93.8%
```

instead of:

```text
0.9375 -> 0.9%
```

### CVF-15 visual shell regression

`acquisition-memo-v2-document.js` now includes a more complete V2-owned production-grade memo shell:

```text
Acquisition Memo Summary
Key Metrics Snapshot
Operating Snapshot
Unit Mix / Rent Positioning
Rent Upside / Value Sensitivity
Preliminary Financing Readiness Summary
Data Coverage / Source Reliability
Source Context / Support Document Treatment
Methodology / Limitations
```

This addresses the RETEST 6 visual collapse without restoring legacy row/marker/body/after-html hacks.

## Tests reported green

```text
node --check api/generate-client-report.js
node --check api/_lib/canonical-source-package.js
node --check api/_lib/acquisition-memo-v2-document.js
node --check tests/qa/acquisition-memo-v2-document-smoke.js
node tests/qa/acquisition-memo-v2-document-smoke.js
node tests/qa/source-authority-smoke.js
node tests/qa/screening-report-smoke.js
node tests/qa/report-type-normalization-smoke.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

## CVF status after local patch

The patch is a **local PASS candidate**, not a launch pass.

Updated status:

```text
CVF-01 / CVF-02:
PASS candidate for occupancy display regression; needs live PDF confirmation.

CVF-04:
PASS candidate for current debt / purchase assumptions separation in live-shaped artifacts; needs live PDF confirmation.

CVF-05:
PASS / protect.

CVF-07 / CVF-15:
PASS candidate for artifact-only support-doc classification; needs live PDF confirmation.

CVF-13:
PASS for no generator/delivery code touched; live render still needs retest.

CVF-15:
IMPROVED / LIVE PDF PROOF REQUIRED.
```

## Acceptance criteria for the next live retest

CVF-15 may move toward PASS only if the next deployed PDF proves:

```text
1. Professional Acquisition Memo shell, not 3-page skeleton.
2. Occupancy displays around 93.8%, not 0.9%.
3. T12 is core quantitative source.
4. Rent Roll is core quantitative source.
5. Stonebridge_Assumptions.pdf is Purchase Assumptions / Proposed Acquisition Financing Context.
6. Current_Debt_Stonebridge.pdf is Existing Debt / Current Debt Context.
7. Current debt facts come from Current_Debt_Stonebridge.pdf, not Stonebridge_Assumptions.pdf.
8. Stonebridge_Reno_Plan.pdf is Structured Renovation / CapEx Plan.
9. Stonebridge_Appraisal_Summary.pdf is Appraisal / Valuation Context.
10. Stonebridge_Market_Survey.pdf is Market Survey Context.
11. Stonebridge_Phase_I_ESA.pdf is Environmental / Phase I ESA Context.
12. Lender checklist reflects uploaded support context correctly.
13. Document Treatment is inside body.
14. No DSCR/refi/DCF/waterfall/equity return/deal score/final recommendation/BUY/SELL/HOLD/loan approval/lender commitment.
15. Screening remains protected.
```

## Stop conditions

Do not:

```text
run repeated live retests as a loop;
patch by regex/marker/body insertion;
restore legacy fact authority;
touch Screening;
touch delivery/payment/auth/storage;
open Full Underwriting V2 surfaces;
weaken smokes to make output pass.
```

Allowed next actions:

```text
commit the three-file patch if clean;
deploy once;
run exactly one live Stonebridge retest;
review PDF and artifacts;
then update docs again with live result.
```

## Fresh CVF continuation point

```text
June 17 afternoon CVF checkpoint.

RETEST 6 live failure was valid and bad.
Root causes:
- live-shaped support doc artifacts not consumed reliably;
- underscore-heavy core filenames not consistently classified;
- occupancy ratio formatted incorrectly;
- V2 document shell was too thin.

Codex patch changed only:
- canonical-source-package.js
- acquisition-memo-v2-document.js
- acquisition-memo-v2-document-smoke.js

Local smokes are green.
Acquisition Memo remains not launch-cleared until the patched code is deployed and exactly one live PDF confirms CVF-15.
```



---

# June 16, 2026 Late-Night CVF Addendum — Smoke Green / CVF-15 Improved but Final Handler Proof Still Required

## Current CVF status after late-night pass

The late-night test-harness repair materially improves the working state, but does not fully close CVF-15 yet.

Updated status:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected.

CVF-04 Current debt / proposed acquisition separation:
UPSTREAM PASS candidate.
FOCUSED HANDLER FINAL HTML PROOF STILL REQUIRED.

CVF-05 V2 containment:
PASS / protect.

CVF-07 / CVF-15 Optional support/source-package authority:
FOCUSED SMOKES PASS.
HANDLER/PDF PROOF STILL REQUIRED.

CVF-13 Runtime/render stability:
IMPROVED.
Handler import smoke passes, const/let blocker fixed, request-context regression repaired.

CVF-14 Advisory/final assembly diagnostics:
IMPROVED.
Monster rent-roll smoke now passes, but remains a bloated regression harness.

CVF-15 Acquisition Memo V2 final HTML ownership:
IMPROVED / NOT YET PASS.
V2 document smoke passes, but the live handler V2-gate path still needs focused proof and then PDF/customer-artifact validation.
```

## What changed in the late-night pass

The previous red state was no longer caused by V2 source authority or production rendering.

The final failing assertion was traced to the monster smoke’s later `attackContractQa` fixture.

Observed violation:

```text
PURCHASE_ASSUMPTIONS_ROLE_DRIFT
evidence: stonebridge_assumptions.pdf missing_from_source_treatment_table
```

Root cause:

```text
The attackContractQa block fed the contract checker HTML without a Source Treatment / Quantitative Use table containing the purchase-assumptions row expected by the contract checker.
```

Accepted fix:

```text
Test-harness only.
A synthetic Source Treatment / Quantitative Use section was added to the rent-roll smoke’s attackContractHtml.
Rows included:
- Stonebridge_Assumptions.pdf
- Current_Debt_Stonebridge.pdf
- Stonebridge_Reno_Plan.pdf
```

CVF interpretation:

```text
This repaired the regression harness contract-data setup.
It did not alter customer-visible production rendering.
It does not by itself launch-clear Acquisition Memo.
```

## Updated CVF-15 interpretation

CVF-15 was previously:

```text
ACTIVE / V2 final HTML ownership failure.
```

It is now:

```text
IMPROVED / focused final proof pending.
```

Reason:

```text
V2 document owner exists.
Focused V2 document smoke passes.
Source authority smoke passes.
Screening smoke passes.
Handler import smoke passes.
Monster smoke passes.
```

Still pending:

```text
A dedicated handler-path V2 gate smoke must prove generate-client-report.js returns the complete V2-owned final HTML document under the V2 gate without relying on legacy marker/regex/body-insertion/fallback behavior.
```

CVF-15 cannot be marked PASS until this is proven.

## Current accepted evidence

Accepted as green:

```text
generate-client-report import safety
V2 document output smoke
source-authority smoke
Screening regression smoke
report-type normalization smoke
monster rent-roll regression harness
git diff whitespace check
```

Not yet accepted as launch proof:

```text
actual V2-gated handler complete-document proof
actual PDF/customer artifact proof
visual PDF QA
production flag/launch posture decision
```

## Remaining CVF-15 pass requirements

CVF-15 may move to PASS only when all of the following are proven:

```text
1. V2 gate on uses complete V2-owned final HTML.
2. Preliminary Financing Readiness Summary appears.
3. Lender Diligence Checklist appears.
4. Current debt context uploaded says Yes when source package says current debt exists.
5. Current_Debt_Stonebridge.pdf appears as Debt Support Received / Contextual.
6. Stonebridge_Assumptions.pdf remains purchase/acquisition context.
7. Stonebridge_Reno_Plan.pdf remains Structured Renovation / CapEx Plan.
8. Document Treatment appears inside <body>, not after </html>.
9. No after-html V2 fallback exists.
10. No marker replacement or row regex is required for V2 correctness.
11. Screening remains unchanged/protected.
12. Forbidden V2 surfaces remain absent.
13. A controlled real PDF/customer artifact has been reviewed.
```

## Updated blocker severity

The blocker has moved from:

```text
active smoke failure / whack-a-mole bridge instability
```

to:

```text
final proof / quarantine / launch-readiness validation
```

This is materially better.

However:

```text
Acquisition Memo remains not launch-cleared.
```

## CVF handling for remaining generate-client-report.js split work

Remaining split work should not be treated as a launch-blocking emergency unless it affects CVF families.

### Launch-relevant remaining split/quarantine

```text
V2 handler gate smoke
legacy V2 body mutation quarantine
append-after-html fallback verification
marker/row-regex independence verification
controlled real PDF proof
```

### Non-urgent future split work

```text
buildRendererCanonicalState extraction
Screening renderer extraction
legacy helper cleanup
monster smoke decomposition
delivery tail extraction
```

These should not block the immediate Acquisition Memo proof unless a direct CVF risk is found.

## Guided CVF investigation to run after the green checkpoint

Add a bounded read-first investigation:

```text
Acquisition Memo V2 Clean Pipeline Verification
```

Purpose:

```text
Confirm that CVF-15 is truly closed or identify the one remaining bounded patch required.
```

Codex should answer:

```text
1. Does the V2 gate produce a complete V2-owned document through the handler path?
2. Can any legacy path mutate V2 customer-visible Financing Readiness or Document Treatment after V2 document generation?
3. Can any projection/renderer bypass canonical-source-package?
4. Is Screening protected?
5. Are forbidden surfaces absent?
6. Is a focused V2 gate handler smoke present and green?
7. What exact legacy path, if any, remains a CVF-15 risk?
```

Codex must not patch unless the investigation finds one bounded CVF-15 issue and the fix is explicitly limited.

## Updated CVF stop conditions

Reject any next action whose primary mechanism is:

```text
patch one row
replace one marker
insert one block before body
append one block
weaken an assertion
delete a contract check
touch Screening rendering
touch delivery/payment/auth/storage
reopen DSCR/refi/DCF/waterfall/equity/deal-score/final recommendation
```

Acceptable next actions:

```text
commit current green checkpoint
add focused V2 gate handler smoke
run clean-pipeline verification
quarantine a proven legacy V2 mutation path
run controlled real PDF proof
update docs
```

## Fresh CVF continuation point

```text
June 16 late-night CVF checkpoint.

The final red monster-smoke issue was test-harness-only and is now green.
Focused source-authority/V2-document/screening/import/report-type smokes are green.
The Acquisition Memo V2 architecture is materially improved.
CVF-15 is not yet launch-cleared because the handler V2-gate path and PDF/customer artifact still need final proof.

Next:
1. Commit green checkpoint.
2. Add focused V2 gate handler smoke.
3. Run bounded clean-pipeline verification.
4. Quarantine any remaining V2 legacy mutation path.
5. Run controlled real report/PDF proof.
6. Then reassess Acquisition Memo launch readiness.
```

# June 16, 2026 Late CVF Addendum — V2 Root Cutover Progress / Helper Split Checkpoint / Smoke Harness Reclassification

## Current CVF status

The June 16 owner-escalation diagnosis remains correct:

```text
CVF-15 / CVF-13 — Acquisition Memo V2 final HTML ownership failure
```

is still the controlling Acquisition Memo launch blocker until focused final HTML validation passes.

However, the project has now made meaningful architectural progress toward closing the family.

Current updated CVF status:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected.

CVF-04 Current debt / proposed acquisition separation:
UPSTREAM PASS candidate / FINAL HTML VALIDATION PENDING.
V2 source/projection can represent current debt context, but focused final HTML proof is still required.

CVF-05 V2 containment:
PASS / protect. No forbidden surfaces should be reopened.

CVF-07 / CVF-15 Optional support/source-package authority:
ROOT CUTOVER IN PROGRESS.
The new V2 document owner is the correct final assembly direction, but final focused smoke is still required.

CVF-13 Runtime/render stability:
WATCHLIST, improved.
The const/let V2 reassignment blocker was caught and fixed. Request-context split regression was also caught and repaired.

CVF-14 Advisory/final assembly diagnostics:
ACTIVE.
The monster rent-roll smoke is now considered a bloated regression harness, not a clean smoke.
Focused V2/screening/source-authority smokes are required.
```

## What changed since the prior CVF addendum

### CVF-15 root direction moved from patching to ownership

Old failed pattern:

```text
legacy Acquisition Memo HTML
+ V2 marker replacements
+ row regex rewrites
+ before-body insertion
+ after-html fallback suppression
```

New active pattern:

```text
V2 gate on
-> canonical source package / projection
-> renderCompleteAcquisitionMemoV2Html(...)
-> complete V2-owned final HTML body/document
-> PDF/storage/delivery plumbing
```

New owner:

```text
api/_lib/acquisition-memo-v2-document.js
```

Key function:

```javascript
renderCompleteAcquisitionMemoV2Html(...)
```

CVF interpretation:

```text
This is the right architecture for closing CVF-15.
It is not launch-cleared until focused final HTML validation proves it.
```

### CVF-13 runtime blocker fixed

A syntax-passing runtime failure was identified:

```javascript
const htmlString = sanitizeTypography(htmlStringRaw);
...
htmlString = renderCompleteAcquisitionMemoV2Html(...);
```

Risk:

```text
TypeError: Assignment to constant variable
```

Fix:

```javascript
let htmlString = sanitizeTypography(htmlStringRaw);
```

CVF interpretation:

```text
CVF-13 remains watchlist, but this specific runtime blocker is fixed.
```

### Request-context regression caught and repaired

During helper extraction, `resolveReportTypeAndTier(...)` initially lost required return fields:

```text
reportTier
effectiveReportMode
allowedTypes
supportedAliases
```

It also temporarily added screening aliases that were not in the original behavior.

Repair completed:

```text
original return contract restored.
original alias behavior restored.
constantTimeEqual(...) preserved.
```

CVF interpretation:

```text
This prevented a quiet report-mode/branching regression that could have affected Screening and Acquisition Memo routing.
```

## Helper boundary split progress

These splits are not direct CVF fixes by themselves, but they reduce the monster-file risk that repeatedly caused CVF-13/CVF-15 patch-loop failures.

### Split complete — V2 document owner

```text
api/_lib/acquisition-memo-v2-document.js
```

CVF relevance:

```text
Directly targets CVF-15 by moving Acquisition Memo V2 customer-visible final body ownership out of legacy final assembly.
```

### Split complete — delivery/output helper plumbing

```text
api/_lib/report-delivery-output.js
```

Moved:

```text
sanitizeTypography(...)
buildDeliveryResponseCompatibilityAliases(...)
isValidReportStoragePath(...)
buildReportStoragePath(...)
assertValidReportPublicationInsert(...)
```

CVF relevance:

```text
Supports CVF-08/CVF-09/CVF-10 clarity, but hot DocRaptor/Supabase/delivery gate/credit logic was correctly left in place.
```

### Split complete — request/context helper plumbing

```text
api/_lib/report-request-context.js
```

Moved:

```text
resolveReportTypeAndTier(...)
constantTimeEqual(...)
```

CVF relevance:

```text
Supports stable report-mode routing and prevents helper clutter inside generate-client-report.js.
Regression was caught and repaired before proceeding.
```

### Split complete — formatting/display helpers

```text
api/_lib/report-formatting-helpers.js
```

Moved:

```text
isNil(...)
formatCurrency(...)
formatPercent(...)
formatPercent1(...)
formatPercentExactDisplay(...)
formatCapPercentExact(...)
formatInterestRatePercent(...)
formatMultiple(...)
formatYears(...)
formatDistanceKm(...)
escapeHtml(...)
replaceAll(...)
sanitizeDisplayText(...)
sanitizePropertyNameDisplayText(...)
```

CVF relevance:

```text
Low-risk helper cleanup. No CVF business behavior should change.
```

### Split complete / safe-to-commit — number helpers

```text
api/_lib/report-number-helpers.js
```

Moved:

```text
isFiniteNumber(...)
isFinitePositive(...)
materiallyDifferent(...)
toRateRatio(...)
toCapRatio(...)
```

Left local:

```text
coerceNumber(...)
computeMortgageConstant(...)
normalizeCapRatePercent(...)
capRateMatches(...)
```

Reason:

```text
Those remaining helpers are either too deeply tied to local business logic or financial modeling.
```

CVF relevance:

```text
Low-risk helper cleanup. Helps reduce future patch blast radius.
```

### Split in progress — HTML utility helpers

Target module:

```text
api/_lib/report-html-helpers.js
```

Allowed candidates:

```text
stripMarkedSection(...)
replaceMarkedSection(...)
stripT12DetailSubsection(...)
stripEmptyHeadingBlocks(...)
stripChartBlockByAlt(...)
```

CVF caution:

```text
Moving HTML utilities must not become another way to mutate customer-visible report behavior.
Bodies/regex must be preserved exactly.
```

## Monster smoke reclassification

The large smoke test:

```text
tests/qa/generate-client-report-rent-roll-smoke.js
```

is now classified as:

```text
bloated regression harness / not a clean smoke
```

Reason:

```text
It failed on scope errors before reaching meaningful V2 assertions:
- attackPrelimHtml not defined
- supportDocAuthorityRows not defined
```

CVF interpretation:

```text
A harness scope error is not the same as a V2 final HTML failure.
The monster smoke still matters, but it cannot be the only validator for CVF-15.
```

Required focused tests:

```text
1. Acquisition Memo V2 document smoke.
2. Source-package/source-authority smoke.
3. Acquisition Memo projection smoke.
4. Forbidden V2 surface smoke.
5. Screening regression smoke.
6. Delivery/PDF smoke.
```

## Updated CVF acceptance for CVF-15

CVF-15 can move from ACTIVE to PASS only when focused tests prove:

```text
1. V2 gate on uses complete V2-owned final HTML.
2. Preliminary Financing Readiness Summary appears.
3. Lender Diligence Checklist appears.
4. Current debt context uploaded says Yes when source package says current debt exists.
5. Current_Debt_Stonebridge.pdf appears as Debt Support Received / Contextual.
6. Stonebridge_Assumptions.pdf remains purchase/acquisition context.
7. Stonebridge_Reno_Plan.pdf remains Structured Renovation / CapEx Plan.
8. Document Treatment is inside <body>, not after </html>.
9. No after-html V2 fallback exists.
10. No marker replacement or row regex is required for V2 correctness.
11. Screening remains unchanged/protected.
12. Forbidden V2 surfaces remain absent.
```

## Current CVF stop conditions

Reject any next patch whose primary mechanism is:

```text
patch one V2 row;
replace one marker;
insert one V2 block before </body>;
append one missing block;
change one monster-smoke assertion;
fix one out-of-scope smoke variable as the main strategy.
```

Allowed if explicitly bounded:

```text
pure helper extraction;
focused smoke creation;
V2 final document ownership verification;
legacy V2 path quarantine;
Screening protective regression.
```

## Fresh CVF continuation point

```text
June 16 late CVF checkpoint.

Progress:
- V2 complete document owner exists.
- Helper boundaries are being split safely out of generate-client-report.js.
- Runtime const/let blocker fixed.
- Request-context regression fixed.
- Formatting helpers committed.
- Number helpers extracted / safe to commit if not already committed.
- HTML helper split is in progress.
- Monster rent-roll smoke is downgraded to bloated regression harness.

Still required:
- focused V2 document smoke;
- Screening regression smoke;
- source authority/projection smokes;
- final proof that V2 Document Treatment and Financing Readiness are inside valid body HTML;
- no forbidden surface leakage.

Acquisition Memo remains not launch-cleared until CVF-15 focused validation passes.
```

---

# June 16, 2026 CVF Addendum — Owner Escalation / CVF-15 Final Assembly Root Not Solved / Hard V2 Cutover Required

## Current CVF status

The CVF ledger is updated after Rob's June 16 escalation.

Active blocker:

```text
CVF-15 / CVF-13 — Acquisition Memo V2 Final HTML Ownership Failure
```

This supersedes treating the current failure as:

```text
a current-debt row bug,
a Document Treatment idempotency bug,
a marker replacement bug,
or a test assertion tweak.
```

Current CVF mapping:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll:
PASS / protected.

CVF-04 Current debt / proposed acquisition separation:
UPSTREAM PARTIAL PASS, FINAL HTML FAIL.
Source package/projection can identify current debt context, but the final customer-visible body still does not reliably render the Document Treatment and checklist proof.

CVF-05 V2 containment:
PASS / protect. Do not reopen forbidden surfaces.

CVF-07 / CVF-15 Optional support/source package authority:
UPSTREAM PARTIAL PASS, FINAL HTML OWNERSHIP FAIL.
Source authority can classify rows, but final report assembly still fails to make V2 the sole customer-visible owner.

CVF-13 Runtime/render stability:
WATCHLIST.
Multiple bridge patches changed failure shape and one introduced a ReferenceError earlier. This confirms patching legacy final assembly is risky.

CVF-14 Advisory/final assembly diagnostics:
ACTIVE.
Final smoke/test-return paths are not yet aligned with canonical V2 authority.
```

## Owner escalation recorded

Rob escalated because the same CVF family has consumed weeks through repeated tiny patches.

Substance of escalation:

```text
Rob has repeatedly asked for the root problem, not one more small patch.
Rob correctly identified the repeated pattern as whack-a-mole.
Rob challenged the earlier advice not to rebuild generate-client-report / final assembly.
Rob now requires a same-day root fix: one patch/rebuild/cutover that changes the ownership boundary.
```

Ledger interpretation:

```text
This is a valid owner escalation.
It should prevent future assistants/Codex prompts from proposing another marker, regex, or row-level patch as the main strategy.
```

## Latest smoke evidence

Manual command:

```text
node tests/qa/generate-client-report-rent-roll-smoke.js 2>&1 | findstr "PASS ERR_ASSERTION"
```

Latest failure:

```text
AssertionError [ERR_ASSERTION]:
The input did not match the regular expression
/Current_Debt_Stonebridge\.pdf[\s\S]{0,2000}Debt Support Received \/ Contextual/i
```

This occurred after:

```text
- new api/_lib/acquisition-memo-v2-final-assembly.js helper,
- generate-client-report.js calls to helper in harness/intermediate/final paths,
- removal/bypass of old ad hoc row/marker replacements,
- current debt row driven by acquisitionMemoProjection.financingReadinessSignals.hasCurrentDebtContext,
- row regex correction to avoid nested <td>.
```

CVF conclusion:

```text
The helper-centered bridge did not close CVF-15.
The failure moved, then returned.
The root is final HTML ownership, not one assertion.
```

## Why the current approach still fails CVF-15

The V2 system currently owns:

```text
source classification,
projection,
some rendered fragments,
a final assembly helper.
```

But it does NOT yet sovereignly own:

```text
the complete Acquisition Memo V2 customer-visible HTML document/body.
```

`generate-client-report.js` still owns too much under the V2 path:

```text
legacy htmlString/finalHtml shell,
legacy marked sections,
legacy token replacement,
legacy test-return path,
legacy section stripping/sanitizing,
legacy Document Treatment paths,
legacy preliminary financing readiness paths,
late fallback paths.
```

This creates repeated CVF failures because V2 output is inserted into or patched over legacy output.

## CVF correction

The next patch must change the architecture boundary:

Old failed pattern:

```text
legacy Acquisition Memo HTML
+ V2 fragment replacements
+ body insertions
+ marker fallback suppression
= recurring CVF-15 failures
```

Required pattern:

```text
V2 gate on
-> build canonical source package
-> build Acquisition Memo projection
-> render complete Acquisition Memo V2 HTML/body/document
-> pass complete finalHtml to PDF/storage/delivery
```

`generate-client-report.js` may still provide:

```text
core data extraction,
job plumbing,
PDF/storage/delivery plumbing,
error handling.
```

It must not provide V2 customer-visible section ownership.

## Required CVF acceptance

Before CVF-15 can move from ACTIVE to PASS:

```text
1. Acquisition Memo V2 under feature gate renders complete final HTML from V2-owned document/body.
2. No marker replacement is required to make V2 Financing Readiness appear.
3. No marker replacement is required to make V2 Document Treatment appear.
4. No append-after-html fallback is possible under V2.
5. No row-level regex mutation is needed for Current debt context uploaded.
6. Current_Debt_Stonebridge.pdf appears as Debt Support Received / Contextual in valid body HTML.
7. Current debt context uploaded: Yes appears.
8. Preliminary Financing Readiness Summary appears.
9. Lender Diligence Checklist appears.
10. V2 gate off keeps legacy/Screening unaffected.
11. Screening regression remains green.
12. Forbidden V2 surfaces remain absent.
```

## Stop condition

If Codex or any assistant proposes another patch whose primary mechanism is:

```text
replace one marker,
fix one regex,
insert one block before </body>,
patch one row,
or change one assertion,
```

then reject it unless it is explicitly part of a complete V2 final document ownership cutover.

## Fresh CVF continuation point

```text
CVF-15 remains ACTIVE.
The final HTML bridge is not solved.
The correct next move is a hard V2 final document/body owner, not another helper patch.
Screening is protected.
Acquisition Memo remains not launch-cleared until this cutover passes local smoke and visible final HTML validation.
```

---


# June 15, 2026 CVF Addendum — V2 Bridge Final HTML Assembly Failure / Patch Loop Paused

## Current CVF status

The Acquisition Memo V2 source-authority rebuild remains active, but Step 5 bridge wiring is not currently passing.

The latest local smoke/debug sequence updates CVF status as follows:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll parsing:
PASS / protected. Not implicated.

CVF-04 Current debt / proposed acquisition financing separation:
PARTIAL UPSTREAM PASS / FINAL RENDER FAIL.
Current_Debt_Stonebridge.pdf reaches correct Debt Support Received / Contextual document-treatment output in one path, but Current debt context uploaded / Lender Diligence Checklist is absent from final HTML.

CVF-05 V2 containment:
PASS / continue protecting. No reason to reopen forbidden surfaces.

CVF-07 / CVF-15 Optional-support/source-package authority:
PARTIAL UPSTREAM PASS / FINAL ASSEMBLY FAIL.
Document Treatment can classify Current Debt correctly, but the Document Treatment block is still appended after </html> in the local test-return path.

CVF-13 Runtime/render stability:
WATCHLIST.
A ReferenceError was introduced by a bridge patch and then fixed. This proves Step 5 bridge wiring can create runtime defects if patched blindly.

CVF-14 Advisory/final assembly diagnostics:
ACTIVE.
The smoke/test-return path and final HTML path are not yet aligned to V2 source-package truth.
```

## New active blocker classification

Active blocker name:

```text
CVF-15 / CVF-13 — Acquisition Memo V2 Bridge Final HTML Assembly Ownership Failure
```

This is distinct from the earlier pure classification failures.

The current root is:

```text
V2 source/projection/render output is not yet the sole owner of the customer-visible Acquisition Memo V2 body.
Legacy final assembly still controls tokens, marked sections, test-return htmlString, and append fallbacks.
```

## Evidence recorded

### ReferenceError fixed

Observed failure:

```text
ReferenceError: acquisitionMemoV2Projection is not defined
```

Disposition:

```text
Fixed locally by replacing out-of-scope acquisitionMemoV2Projection access with acquisitionMemoV2Bridge?.acquisitionMemoProjection.
```

CVF mapping:

```text
CVF-13 runtime/render defect introduced during bridge patching.
Status: fixed in uploaded local file; do not broaden.
```

### Financing readiness section absent

Latest final HTML evidence:

```text
Current debt context uploaded: absent.
Lender Diligence Checklist: absent.
Preliminary Financing Readiness Summary: absent.
```

The marked section remains empty:

```html
<!-- BEGIN SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->

<!-- END SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->
```

CVF mapping:

```text
CVF-04 final visible checklist/current-debt readiness not rendered.
CVF-15 final assembly does not consume V2 projection/renderer output correctly.
```

### Document Treatment Summary appended after closing HTML

Latest final HTML evidence:

```html
</body>
</html>

<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->...
```

CVF mapping:

```text
CVF-15 final support-doc treatment path exists but is not inserted into the valid report body.
CVF-13/CVF-15 final HTML assembly failure.
```

### Current debt source treatment row is correct where it appears

Latest Document Treatment block includes:

```text
Current_Debt_Stonebridge.pdf
Debt Support Received / Contextual
Uploaded existing/current debt context only; not proposed acquisition financing.
```

CVF mapping:

```text
CVF-04 source classification is no longer the immediate blocker in this local path.
The remaining blocker is final assembly/placement/ownership.
```

## Why the patch loop is paused

This sequence reproduced the same structural problem the V2 rebuild was meant to solve:

```text
Patching one local row or replacement path leaves another legacy final assembly path active.
```

Observed active legacy behaviors include:

```text
empty marked sections,
token replacement that misses marked sections,
late V2 bridge replacement timing,
test-return htmlString fallback,
DOCUMENT_TREATMENT_SUMMARY append-after-html fallback,
legacy preliminary financing/readiness builders,
legacy support-doc treatment output paths.
```

CVF conclusion:

```text
Further micro-patches are likely to keep moving the failure unless Step 5 is reframed as ownership, not row replacement.
```

## Required next acceptance criteria

Before Step 5 can be considered passing:

```text
1. V2 gate on:
   - SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY is populated.
   - Preliminary Financing Readiness Summary appears.
   - Lender Diligence Checklist appears.
   - Current debt context uploaded appears and says Yes.
   - Current debt facts come from Current_Debt_Stonebridge.pdf, not Stonebridge_Assumptions.pdf.

2. Document Treatment:
   - Current_Debt_Stonebridge.pdf appears as Debt Support Received / Contextual.
   - Stonebridge_Assumptions.pdf remains Purchase Assumptions / Acquisition Context.
   - Reno remains Structured Renovation / CapEx Plan.
   - Document Treatment Summary is inside <body>, not after </html>.

3. Legacy containment:
   - No duplicate/conflicting legacy current-debt/document-treatment rows.
   - No legacy append-after-html fallback for V2 test-return path.
   - V2 gate off behavior remains unchanged.

4. Hygiene:
   - Temporary fs.writeFileSync debug line is removed before commit.
   - No diagnostics/logs remain.
   - No commit/deploy/UI retest until local smoke passes.
```

## Recommended next CVF handling

Do not continue with a broad audit.

Preferred next approach:

```text
Reframe Step 5 as a V2 memo-body ownership bridge:
generate-client-report.js may provide shell/layout only;
renderAcquisitionMemo(projection) must own the Acquisition Memo V2 customer-visible source sections;
legacy support-doc and financing-readiness helpers must not append/overwrite those sections under the V2 gate.
```

If a smaller patch is attempted, it must be bounded to:

```text
V2-gated final assembly ownership only.
```

It must not touch:

```text
core math,
Screening,
parser classification,
source package,
projection/renderer authority boundary,
payment/access,
Stripe,
SQL/Supabase,
DocRaptor,
Admin Dashboard,
Full Underwriting V2 surfaces.
```

## Fresh continuation point

```text
Pause point: June 15 local smoke/debug.

Do not commit/deploy/UI retest.

Latest known state:
- acquisitionMemoV2Projection ReferenceError fixed.
- current-debt document treatment row can be correct.
- final HTML still has empty SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY.
- final HTML still lacks Current debt context uploaded / Lender Diligence Checklist / Preliminary Financing Readiness Summary.
- Document Treatment Summary still appears after </html>.
- Latest smoke failure moved to Current_Debt_Stonebridge.pdf / Debt Support Received assertion, but final HTML shows the deeper final-assembly placement problem remains.
- Next work should be a clean fresh-chat decision between:
  A) one V2-gated final assembly ownership patch; or
  B) replacing section-by-section bridge patching with a complete V2 Acquisition Memo body insertion.
```

---

# June 14, 2026 Evening Addendum — CVF Update / V2 Rebuild Steps 1 and 2 Complete

## Current CVF status after Steps 1 and 2

```text
CVF-01 / CVF-02 Core T12 and Rent Roll parsing: PASS / holding.
CVF-03 / CVF-06 Source reconciliation disclosure: PASS WITH DISCLOSURE / holding.
CVF-04 Current debt / proposed acquisition financing separation: ACTIVE REBUILD — Step 2 foundation complete.
CVF-05 V2 containment: PASS / holding.
CVF-07 / CVF-15 Optional-support/source-package authority: ACTIVE REBUILD — Step 2 foundation complete.
CVF-08 / CVF-09 / CVF-10 Delivery/publish path: PASS for customer delivery.
CVF-14 Advisory QA: Will be fixed in Step 6 when QA is converted to dumb consumer.
```

## Why the patch loop is permanently closed

Step 1 inspection confirmed there are at least 4 separate locations in `generate-client-report.js`
alone (~2994, ~9708, ~11949, ~12696) that can independently build or overwrite document treatment output.

This is the structural proof of why RETEST 1 through RETEST 5 each fixed a visible surface
while leaving another competing path running underneath. No patch can win against 4 independent
output paths. The V2 rebuild eliminates all 4 by making them dumb consumers of a single authority.

## Step 2 CVF progress

CVF-04 and CVF-07/CVF-15 now have a mechanically enforced solution at the foundation level.

`buildCanonicalSourcePackage` enforces:

```text
Stonebridge_Assumptions.pdf → purchase_assumptions (never current_debt_context)
Current_Debt_Stonebridge.pdf → current_debt_context (never contaminated by assumption terms)
Stonebridge_Reno_Plan.pdf → structured_renovation_capex_plan
Stonebridge_Appraisal_Summary.pdf → appraisal_context (never purchase_assumptions)
Stonebridge_Phase_I_ESA.pdf → environmental_context (never property tax support)
T12 file → core_t12 (never other_support)
Rent Roll file → core_rent_roll (never other_support)
Stonebridge_Market_Survey.pdf → market_survey_context
```

The negative contamination guard is also enforced by the smoke test:
A file with "assumption" in its filename and debt_basis "proposed_acquisition" can NEVER
resolve to current_debt_context regardless of any other signal.

## CVF-04 specific enforcement mechanism

The old failure mode:

```text
Negative language in Stonebridge_Assumptions.pdf ("not a current mortgage statement",
"does not represent existing debt") triggered the current-debt classification path
because the system read for the presence of debt-related language rather than
distinguishing positive current-debt evidence from limiting/exclusion language.
```

The new enforcement:

```text
Classification rule 3 (current_debt_context) requires POSITIVE evidence:
current outstanding balance, current interest rate, or existing mortgage maturity.
Negative/exclusion language is not positive evidence and cannot trigger the role.

Classification rule 4 (purchase_assumptions) explicitly wins over rule 3
if a file contains "assumption" in the filename OR has debt_basis "proposed_acquisition".
Priority order is mechanically enforced — not a hint or preference.
```

## CVF-07/CVF-15 specific enforcement mechanism

The old failure mode:

```text
Phase I ESA was classified as Property Tax Support because environmental language
co-occurred with property-related terms. No strict role separation existed.
Appraisal was overpromoted to Purchase Assumptions because acquisition context
language co-occurred with price/value terms.
```

The new enforcement:

```text
environmental_context is a discrete canonical role.
appraisal_context is a discrete canonical role.
Neither can bleed into property_tax_support or purchase_assumptions
because those are separate canonical roles with separate detection rules.
A file cannot hold two canonical roles simultaneously.
The first matching rule in priority order wins and classification stops.
```

## CVF-15 T12/Rent Roll demoted-to-support-doc fix

```text
T12 and Rent Roll now return as coreT12 and coreRentRoll on the canonical source package root,
not as entries in the supportDocs map.
They carry role "core_t12" and "core_rent_roll" with treatment "Primary quantitative input".
They can never appear as "Other Support Document / Context only / not used quantitatively."
```

## Rebuild sequence CVF mapping

```text
Step 1 (complete): Inspection — confirmed all competing decision-makers
Step 2 (complete): buildCanonicalSourcePackage — CVF-04, CVF-07, CVF-15 foundation enforced
Step 3 (pending): buildAcquisitionMemoProjection — CVF-04, CVF-07, CVF-15 propagation
Step 4 (pending): renderAcquisitionMemo — CVF-04, CVF-07, CVF-15 visible output
Step 5 (pending): Thin bridge in generate-client-report.js — live path wiring
Step 6 (pending): Quarantine legacy paths — closes all remaining CVF-14 noise
Step 7 (pending): Final Attack Test 8 golden replay — permanent RETEST 5 expectations verified
```

## Launch posture unchanged

```text
Screening: Launchable / founder-beta ready.
Acquisition Memo: Not launch-cleared. V2 rebuild active on branch acq-memo-v2-source-package.
Full Underwriting V2: Deferred.
```

## Fresh continuation point

```text
Resume in next session with Codex Step 2 validation result.
All 5 node commands must pass before proceeding to Step 3.
Step 3 prompt will implement buildAcquisitionMemoProjection consuming
the canonical source package output with zero independent classification.
```

---

# June 14, 2026 Addendum - CVF Ledger Update / Acquisition Memo V2 Source-Authority Rebuild Start

## Current CVF controlling status after RETEST 5

Final Attack Test 8 RETEST 5 confirmed that the incremental Patch 4B/4C/4D authority loop improved some visible labels but did not close the underlying CVF family.

Current CVF verdict:

```text
CVF-01 / CVF-02 Core T12 and Rent Roll parsing: PASS / holding.
CVF-03 / CVF-06 Source reconciliation disclosure: PASS WITH DISCLOSURE / holding.
CVF-04 Current debt / proposed acquisition financing separation: FAIL for Acquisition Memo V1 automation.
CVF-05 V2 containment: PASS / holding.
CVF-07 / CVF-15 Optional-support/source-package authority: FAIL for Acquisition Memo V1 automation.
CVF-08 / CVF-09 / CVF-10 Delivery/publish path: PASS for customer delivery, but diagnostic authority remains noisy.
CVF-14 Advisory QA: PARTIAL / still noisy and not sovereign.
```

Controlling action:

```text
Stop the tiny support-doc patch loop.
Freeze Acquisition Memo automation.
Start quarantined Acquisition Memo V2 source-authority rebuild.
```

## RETEST 5 CVF pass findings

### CVF-01 / CVF-02 - Core parsing

Status:

```text
PASS / holding.
```

Observed stable rendered values:

```text
Units: 64
Occupancy: 93.8%
Annual In-Place Rent: $1,432,800
Annual Market Rent: $1,718,400
Annual Rent Upside: $285,600
Rent Gap: 19.9%
EGI: $1,500,000
OpEx: $555,000
NOI: $945,000
Expense Ratio: 37.0%
NOI Margin: 63.0%
Break-Even Occupancy: 37.0%
```

Disposition:

```text
Do not reopen core T12/Rent Roll math or parser work as part of Acquisition Memo V2 rebuild, except protective regression.
```

### CVF-03 / CVF-06 - Source reconciliation / disclosure

Status:

```text
PASS WITH DISCLOSURE / holding.
```

Visible report classification remained:

```text
Review - Source Reconciliation Disclosure
```

Disposition:

```text
Correct conservative disclosure. Not the active blocker.
```

### CVF-05 - V2 containment

Status:

```text
PASS / holding.
```

No visible prohibited V2 surfaces were observed:

```text
No DSCR.
No current-debt DSCR.
No refinance proceeds.
No DCF.
No waterfall.
No equity return.
No deal score.
No final recommendation.
No BUY / SELL / HOLD.
```

Disposition:

```text
Do not reopen V2 surfaces during the Acquisition Memo V2 source-authority rebuild.
```

## RETEST 5 CVF failures

### CVF-04 - Current debt / proposed acquisition financing contamination

Status:

```text
FAIL / true Acquisition Memo V1 launch blocker.
```

Observed wrong visible behavior:

```text
Uploaded Existing Debt Context showed:
- Interest Rate 5.95%
- Amortization 30 years
- LTV 70.0%
```

Those are proposed acquisition financing terms from `Stonebridge_Assumptions.pdf`, not current-debt facts from `Current_Debt_Stonebridge.pdf`.

Correct current-debt source facts:

```text
Current Outstanding Balance: $6,800,000
Interest Rate: 4.85%
Amortization Remaining: 24 years
Monthly Payment: $39,250
Maturity Date: 2029-11-01
```

CVF classification:

```text
CVF family: CVF-04 and CVF-15.
Human red-pen decision: true_launch_blocker for Acquisition Memo automated launch.
Customer visible: yes.
Math affected: current debt context facts wrong / contaminated.
Source binding affected: yes.
Patch-loop disposition: stop tiny patching; rebuild source-authority foundation.
Regression required: yes, permanent RETEST 5 golden replay.
```

Required V2 behavior:

```text
Current_Debt_Stonebridge.pdf must supply current debt context facts.
Stonebridge_Assumptions.pdf must never supply Uploaded Existing Debt Context facts.
Proposed acquisition financing and existing/current debt must be separate canonical roles with separate allowed/forbidden uses.
```

### CVF-04 / CVF-15 - Stonebridge_Assumptions.pdf misclassified as debt support

Status:

```text
FAIL / source-authority role contamination.
```

Observed wrong visible Document Treatment:

```text
Stonebridge_Assumptions.pdf
Document Role: Debt Support Received / Contextual
Use: Uploaded existing/current debt context only; not proposed acquisition financing.
```

Correct behavior:

```text
Stonebridge_Assumptions.pdf should be Purchase Assumptions / Proposed Acquisition Financing Context.
It must not be current debt or existing debt support.
```

Disposition:

```text
This confirms negative language like “not a current mortgage statement” or “does not represent existing debt” must not trigger current-debt classification.
Canonical role rules must distinguish positive current-debt proof from limitation sentences.
```

### CVF-07 / CVF-15 - Phase I ESA misclassified as Property Tax Support

Status:

```text
FAIL / support-doc role contamination.
```

Observed wrong visible Document Treatment:

```text
Stonebridge_Phase_I_ESA.pdf
Document Role: Property Tax Support
Treatment: Corroborating support
Use: Corroborating property-tax support; does not override T12 totals.
```

Correct behavior:

```text
Stonebridge_Phase_I_ESA.pdf should be Environmental / Phase I due diligence context only.
It must not become property tax support.
```

Disposition:

```text
Environmental context and property tax support must be separate canonical roles.
```

### CVF-07 / CVF-15 - Appraisal summary overpromoted to Purchase Assumptions

Status:

```text
FAIL / appraisal-context overpromotion.
```

Observed wrong visible Document Treatment:

```text
Stonebridge_Appraisal_Summary.pdf
Document Role: Purchase Assumptions / Acquisition Context
```

Correct behavior:

```text
Appraisal summary should be appraisal / valuation context only.
It must not become purchase assumptions unless explicit purchase-assumption facts are present and validated for that file.
It must not override purchase price, T12 NOI, Rent Roll market rent, or cap-rate value framework.
```

Disposition:

```text
Appraisal context requires its own canonical role and forbidden uses.
```

### CVF-15 - Core T12/Rent Roll listed as generic support docs

Status:

```text
FAIL / visible source-treatment credibility issue.
```

Observed wrong visible Document Treatment:

```text
T12_Stonebridge_Lofts_Attack_Test_8.xlsx - Other Support Document / Context only / not used quantitatively
Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx - Other Support Document / Context only / not used quantitatively
```

Correct behavior:

```text
T12 and Rent Roll are core quantitative sources.
They may appear in a core-source treatment table, but must not be described as generic support docs not used quantitatively.
```

Disposition:

```text
Canonical Source Package must include core_t12 and core_rent_roll roles, not just support-doc roles.
```

### CVF-14 - Advisory QA still not aligned to source-authority truth

Status:

```text
PARTIAL / noisy and stale.
```

Observed internal artifacts included:

```text
UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED
structured_renovation_present: false
legacy_action_plan_fallback
canonical_delivery_state_present: false
```

Interpretation:

```text
Advisory QA is not blocking delivery, but it still proves old authority paths remain active diagnostically.
```

Disposition:

```text
Do not broaden the rebuild into QA first.
First rebuild source package + projection + renderer authority.
Then QA must consume source package/projection artifacts instead of reinterpreting raw support docs.
```

## Updated active blocker name

The active blocker is no longer named as another Patch 4x.

New active blocker:

```text
Acquisition Memo V2 Source-Authority Rebuild
```

Primary CVF families:

```text
CVF-04 - current debt / proposed acquisition financing / debt-context separation.
CVF-07 - optional/support document treatment and source-depth boundaries.
CVF-15 - optional-support/source-package/admin diagnostic authority.
```

Secondary families to protect:

```text
CVF-01/CVF-02 - core parsing must remain untouched/protected.
CVF-05 - V2 surfaces must remain closed.
CVF-08/CVF-09/CVF-10 - delivery/publish path must remain stable.
CVF-14 - advisory QA must be downstream of source-package truth, not a separate authority.
```

## New CVF doctrine for Acquisition Memo V2 rebuild

The rebuild must create a mechanically enforced authority path:

```text
uploaded files + extracted text + parsed artifacts
-> buildCanonicalSourcePackage(...)
-> buildAcquisitionMemoProjection(...)
-> renderAcquisitionMemo(...)
-> final HTML / PDF
```

No downstream renderer, checklist, financing section, document-treatment summary, or QA layer may independently decide file role after `buildCanonicalSourcePackage(...)`.

## Canonical source package CVF requirements

For each file, the source package must emit one canonical source object:

```text
fileId
originalFilename
sourceKind
canonicalRole
canonicalLabel
allowedUses
forbiddenUses
extractedFacts
confidence
sourceEvidence
sourceAuthorityVersion
provenance
```

Required roles include:

```text
core_t12
core_rent_roll
purchase_assumptions
proposed_acquisition_financing
current_debt_context
structured_renovation_capex_plan
appraisal_context
market_survey_context
environmental_context
property_tax_support
zoning_or_compliance_context
broker_or_diligence_context
other_support_context
unclassified_support_context
```

RETEST 5 golden expected roles:

```text
T12_Stonebridge_Lofts_Attack_Test_8.xlsx -> core_t12
Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx -> core_rent_roll
Stonebridge_Assumptions.pdf -> purchase_assumptions / proposed_acquisition_financing
Current_Debt_Stonebridge.pdf -> current_debt_context
Stonebridge_Reno_Plan.pdf -> structured_renovation_capex_plan
Stonebridge_Appraisal_Summary.pdf -> appraisal_context
Stonebridge_Market_Survey.pdf -> market_survey_context
Stonebridge_Phase_I_ESA.pdf -> environmental_context
```

## Acquisition Memo projection CVF requirements

`buildAcquisitionMemoProjection(...)` must be the only source used by the Acquisition Memo renderer.

Projection fields should include:

```text
coreOperatingMetrics
rentPositioning
acquisitionContext
proposedFinancingContext
currentDebtContext
renovationContext
appraisalContext
marketSurveyContext
environmentalContext
propertyTaxContext
documentTreatmentRows
lenderDiligenceChecklist
omittedSections
disclosures
sourcePackageDiagnostics
```

Renderer may not read:

```text
raw artifacts
raw documentSources
parser semantic_doc_role
parser semantic_doc_display_label
debt_basis
doc_type
parse_error
filename heuristics
AI recovery labels
```

## CVF enforcement tests required

The rebuild must add contract tests that fail if Acquisition Memo V2 bypasses the source package.

Required test classes:

```text
1. Source-package unit smoke:
   - validates canonical roles and extracted facts for RETEST 5 source package.

2. Acquisition Memo projection smoke:
   - validates current debt, proposed financing, appraisal, environmental, market survey, Reno, T12, and Rent Roll treatment before rendering.

3. Final HTML smoke:
   - validates customer-visible rows and values.

4. Forbidden-field / source-scan smoke:
   - fails if Acquisition Memo projection/renderer files directly reference parser authority fields or filename heuristics outside the source-package builder.

5. Screening regression smoke:
   - proves Screening remains untouched.

6. V2 containment smoke:
   - proves no DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation/BUY/SELL/HOLD surfaces render.
```

Forbidden direct fields outside `canonical-source-package.js`:

```text
semantic_doc_role
semantic_doc_display_label
debt_basis
doc_type
parse_error
supporting_documents_unclassified
loan_term_sheet_parsed
rent_roll_parse_error
document_text_extracted
original_filename.includes
filename.includes
```

## Old authority path disposition

Old support-doc authority helpers must not remain independent authorities for Acquisition Memo V2.

Inspect and resolve:

```text
buildCanonicalSupportDocAuthorityRows(...)
resolveExplicitSupportDocAuthority(...)
buildSupportDocTaxonomyState(...)
Document Treatment row builders that classify roles themselves
Preliminary Financing Readiness builders that classify roles themselves
QA/action-plan support-doc role inference helpers
renderer filename/doc_type/debt_basis fallbacks
```

Allowed dispositions:

```text
delete;
quarantine as legacy V1 only;
rename as LEGACY_DO_NOT_USE;
convert into adapter around buildCanonicalSourcePackage(...).
```

Not allowed:

```text
leave old helpers as live independent decision-makers beside the new source package.
```

## Publish-or-Fail doctrine preserved

The rebuild must not convert support-doc uncertainty into whole-report fail.

Production doctrine remains:

```text
Only true missing/unusable required T12, true missing/unusable required Rent Roll, true runtime/storage/PDF fatal, or catastrophic render failure can fail a report.
```

Optional/support docs must:

```text
classify when clear;
render as bounded context when allowed;
collapse / omit / qualify when incomplete;
never fabricate;
never override T12/Rent Roll;
never unlock V2 surfaces in Acquisition Memo.
```

Developer/test doctrine:

```text
CI/tests fail if code bypasses source package or final HTML contradicts canonical authority.
```

Customer delivery doctrine:

```text
Core-valid reports still publish with section-level collapse/qualification/disclosure for optional/support ambiguity.
```

## Updated launch posture

```text
Screening:
Launchable / founder-beta ready from current evidence. Protect with regression.

Acquisition Memo V1:
Frozen / not launch-cleared. Do not keep patching.

Acquisition Memo V2:
New rebuild target, behind branch/feature boundary, not active production until source-package/projection/final HTML contract passes.

Full Underwriting V2:
Deferred until shared source-authority foundation is stable.
```

## Do not do next

Do not:

```text
run another V1 RETEST 6 as a tiny patch loop;
write another one-off Current Debt / Reno / Assumptions label patch;
rewrite generate-client-report.js wholesale;
start Full Underwriting V2 first;
touch Screening except protective tests;
touch Stripe, SQL, Supabase lifecycle, payment/access, auth/upload gates, pricing, DocRaptor config, or Admin Dashboard;
reopen DSCR/refi/DCF/waterfall/equity-return/deal-score/final-recommendation surfaces.
```

## Fresh continuation point

Resume from here:

```text
Final Attack Test 8 RETEST 5 was the stop point for the Patch 4 loop.
Core math/publish/V2 containment held.
Current Debt/Reno labels improved, but source-authority contamination remains:
- Uploaded Existing Debt Context used proposed acquisition terms.
- Stonebridge_Assumptions became Debt Support.
- Phase I became Property Tax Support.
- Appraisal became Purchase Assumptions.
- Core T12/Rent Roll appeared as Other Support Docs.

Acquisition Memo V1 automation is frozen.
Next work is Acquisition Memo V2 Source-Authority Rebuild:
- branch/tag first;
- new canonical-source-package module;
- new acquisition-memo-projection module;
- dumb acquisition-memo-renderer;
- source-scan/forbidden-field tests;
- permanent RETEST 5 golden fixture;
- Screening protected;
- Full Underwriting V2 deferred.
```

---

# June 12, 2026 Addendum - Final Attack Test 8 RETEST 2 CVF Update / Patch 4 Partial Pass, Current Debt + Reno Still Open

## Current CVF status after RETEST 2

Final Attack Test 8 RETEST 2 was run on an active post-Patch-4 deployment.

Runtime marker:

```text
git_commit_sha / build_marker: f88d9a9b6430a1af0043213a28b678d5e0c03819
```

This was a valid retest, not a stale deployment.

Controlling CVF verdict:

```text
Core-valid publish path: PASS.
Core T12/Rent Roll math: PASS.
V2 leakage prevention: PASS.
Purchase assumptions / proposed acquisition context: PARTIAL PASS / materially improved.
Current debt support-doc authority: FAIL / launch blocker for Acquisition Memo.
Structured Reno Plan support-doc authority: FAIL / launch blocker for Acquisition Memo.
Report-contract QA authority enforcement: PARTIAL / warning exists, but visible contradictions still publish as advisory.
```

## CVF family mapping

### CVF-01 / CVF-02 - Core T12 and Rent Roll parsing

Status:

```text
PASS / holding.
```

Evidence from RETEST 2:

```text
T12 parsed successfully.
Rent Roll parsed successfully.
PDF rendered 64 units, 93.8% occupancy, $1,432,800 annual in-place rent, $1,718,400 annual market rent, $945,000 NOI, $555,000 OpEx, 37.0% expense ratio, 63.0% NOI margin.
```

Disposition:

```text
No new CVF-01/CVF-02 issue.
```

### CVF-03 / CVF-06 - Source reconciliation disclosure

Status:

```text
PASS WITH DISCLOSURE / holding.
```

Visible classification:

```text
Review - Source Reconciliation Disclosure
Primary Constraint: Rent roll and T12 income evidence remain materially unreconciled; classification is capped pending source reconciliation.
```

Disposition:

```text
Correct conservative disclosure, not a false fail-closed.
```

### CVF-04 / CVF-15 - Purchase assumptions / proposed acquisition financing

Status:

```text
PARTIAL PASS / materially improved.
```

Observed corrected behavior:

```text
Stonebridge_Assumptions.pdf now renders as Purchase Assumptions / Acquisition Context.
Purchase Price $13,500,000 appears.
NOI Basis $945,000 appears.
Going-In Cap Rate 7.0% appears.
Purchase assumptions provided: Yes.
Proposed acquisition loan terms complete: Yes.
Proposed Acquisition Financing: Source-complete inputs provided / available for future underwriting.
```

Disposition:

```text
Preserve this fix.
Do not regress purchase assumptions while fixing current debt and Reno.
```

Remaining caution:

```text
The wording “available for future underwriting” is acceptable as bounded context only if it does not open DSCR/refi/DCF/waterfall/deal-score/final recommendation.
No forbidden V2 surfaces were observed in RETEST 2.
```

### CVF-04 / CVF-15 - Current debt statement authority

Status:

```text
FAIL / true Acquisition Memo launch blocker.
```

Observed source facts:

```text
Current_Debt_Stonebridge.pdf extracted text:
- Existing Current Debt Statement
- existing/current debt context document
- Current Outstanding Balance $6,800,000
- Interest Rate 4.85%
- Amortization Remaining 24 years
- Monthly Payment $39,250
- Maturity Date 2029-11-01
```

Observed wrong behavior:

```text
PDF says No verified current debt context was provided.
Lender Diligence Checklist says Current debt context uploaded: No.
Document Treatment lists Current_Debt_Stonebridge.pdf as Other Support Document / Context only / Listed for auditability only.
```

Artifact root signal:

```text
Current_Debt_Stonebridge.pdf still inferred as loan_term_sheet.
semantic_doc_role: purchase_assumptions.
semantic_doc_display_label: Purchase Assumptions / Acquisition Context.
explicit_current_debt_proof: false.
mixed_financing_signals: true.
```

CVF classification:

```text
CVF family: CVF-04 and CVF-15.
Human red-pen decision: true_launch_blocker for Acquisition Memo.
Customer visible: yes.
Math affected: no unsafe modeled DSCR/refi math rendered.
Source binding affected: yes.
Owner area: support-doc parser / canonical authority builder / Financing Readiness consumer / Document Treatment consumer / report-contract QA.
Patch required: yes.
Regression required: yes.
```

Required future behavior:

```text
Explicit “Existing Current Debt Statement”, “Current Outstanding Balance”, interest rate, monthly payment, amortization remaining, and maturity date must outrank purchase/acquisition/loan-term fallback for the same file.
```

### CVF-07 / CVF-15 - Structured Reno Plan authority

Status:

```text
FAIL / true Acquisition Memo launch blocker.
```

Observed source facts:

```text
Stonebridge_Reno_Plan.pdf extracted text:
- Structured Renovation / CapEx Plan
- structured forward-looking renovation / CapEx plan
- budget, unit scope, stated rent lift, and phasing
- Total Renovation Budget $1,280,000
- 1BR Interiors 20 units x $18,500/unit; expected rent lift $225/month; Months 1-18
- 2BR Interiors 18 units x $24,000/unit; expected rent lift $325/month; Months 1-24
- Common Area Refresh $210,000
- Exterior / Security $115,000
- Contingency $153,000
```

Observed wrong behavior:

```text
PDF says renovation/CapEx support was received, but no verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided.
Document Treatment lists Stonebridge_Reno_Plan.pdf as Other Support Document / Context only / Listed for auditability only.
```

Artifact root signal:

```text
Stonebridge_Reno_Plan.pdf still went through rent_roll_parse_error and ai_rent_roll_recovery_diagnostic.
ai_rent_roll_recovery_diagnostic attempted: true.
final_outcome: validation_rejected.
inferred_doc_type: rent_roll.
```

CVF classification:

```text
CVF family: CVF-07 and CVF-15.
Human red-pen decision: true_launch_blocker for Acquisition Memo support-doc intelligence.
Customer visible: yes.
Math affected: no unsafe modeled ROI/payback/NOI impact/refi/DCF math rendered.
Source binding affected: yes.
Owner area: support-doc parser dispatch / canonical authority builder / renovation acknowledgement renderer / Document Treatment consumer / report-contract QA.
Patch required: yes.
Regression required: yes.
```

Required future behavior:

```text
Explicit “Structured Renovation / CapEx Plan”, “Total Renovation Budget”, “rent lift”, and “phasing” must outrank rent-roll parsing/recovery and generic support fallback for the same file.
```

### CVF-05 / V2 containment

Status:

```text
PASS / holding.
```

Observed safe behavior:

```text
No DSCR.
No current-debt DSCR.
No refinance proceeds or refinance stability.
No DCF.
No waterfall.
No equity return.
No deal score.
No final recommendation.
No BUY / SELL / HOLD.
```

Disposition:

```text
Do not reopen V2 surfaces while fixing Current Debt and Reno authority.
```

### CVF-08 / CVF-09 / CVF-10 - Delivery/publish path

Status:

```text
Customer delivery path: PASS.
Internal conformance authority: WATCHLIST.
```

Observed behavior:

```text
Report published.
Email sent.
Status reached published.
Customer delivery was allowed.
```

But artifacts show:

```text
report_contract_qa delivery_conformance_source: legacy_fallback_only.
canonical_delivery_state_present: false.
qa_action_plan readiness_source: legacy_action_plan_fallback.
```

Disposition:

```text
Do not patch delivery gate broadly right now.
But retain watchlist: legacy fallback remains visible in diagnostic authority artifacts.
```

### CVF-14 / advisory QA

Status:

```text
PARTIAL / advisory layer is no longer silent, but not sovereign.
```

Observed behavior:

```text
report_contract_qa now emits ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT as high severity.
But advisory_only remains true and customer_delivery_ready remains true.
```

Interpretation:

```text
The QA layer is beginning to see the issue, but visible support-doc authority contradictions are still treated as advisory instead of contract-enforced.
```

Future rule:

```text
When visible Document Treatment / Financing Readiness contradicts canonical support-doc authority, this must be a contract violation strong enough to prevent launch-clearance and fail regression, even if ordinary customer delivery remains possible under Publish-or-Fail doctrine.
```

## Updated blocker name

Current active blocker after RETEST 2:

```text
Patch 4B - Current Debt + Structured Reno Support-Doc Authority Enforcement
```

This is not a broad Patch 5 and not a new product rewrite.

It is the unfinished remainder of Patch 4:

```text
Purchase assumptions side: improved / preserve.
Current Debt side: still open.
Structured Reno side: still open.
Contract QA authority contradiction escalation: still open.
```

## Required future patch scope when Rob resumes

Only patch:

```text
1. Current-debt explicit source-text authority over acquisition/loan-term fallback.
2. Structured-renovation explicit source-text authority over rent-roll recovery/generic support fallback.
3. Document Treatment / Financing Readiness / Reno acknowledgement consumers reading the same canonical support-doc authority.
4. Contract QA detecting visible contradictions against canonical support-doc authority.
```

Do not touch:

```text
Screening.
T12/Rent Roll core math.
Delivery gate/payment/access except if strictly needed for visible authority contradiction enforcement.
Pricing/Stripe.
SQL/RPC/Supabase.
Dashboard.
DocRaptor config.
Auth/upload gates.
Full Underwriting V2 surfaces.
```

## Updated launch posture

```text
Screening:
Launchable / founder-beta ready from current evidence.

Acquisition Memo:
Not launch-cleared.
Core math and publish path are strong, but Current Debt and Structured Reno support-doc authority failures remain customer-visible and launch-blocking for the Acquisition Memo product promise.

Full Underwriting V2:
Deferred.
```

## Fresh continuation point

Resume from here:

```text
Final Attack Test 8 RETEST 2 was valid on runtime SHA f88d9a9b6430a1af0043213a28b678d5e0c03819.
Purchase assumptions now work materially better and must be preserved.
Current_Debt_Stonebridge.pdf still renders as Other Support / no verified current debt despite explicit current-debt source text.
Stonebridge_Reno_Plan.pdf still renders as Other Support / no verified forward-looking renovation budget despite explicit structured Reno/CapEx source text.
Report-contract QA now flags ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT, but remains advisory and legacy-fallback-sourced.
Next patch, when Rob is ready, should be Patch 4B: Current Debt + Structured Reno Support-Doc Authority Enforcement only.
```

---

# June 10, 2026 Session Closeout Addendum - CVF / Learning Ledger Update After Seven-Test Batch, Patches 1-3, Claude V2 Notes, and Final Attack Test 8

## Current CVF status after today’s session

The June 10 session refined the Core-Valid Failure Path interpretation.

Controlling finding:

```text
The highest-risk core CVF families are no longer showing broad collapse in live PDFs.
The strongest remaining Acquisition Memo launch blocker is now support-document role routing and bounded acquisition-context extraction.
```

Core math / delivery / V2 containment status:

```text
Core T12/Rent Roll math: repeatedly holding.
Core-valid publish with disclosure: repeatedly holding.
Invalid-core fail-closed behavior: holding in Tests 5-6.
Credit restore behavior: holding in Tests 5-6.
V2 leakage prevention: holding in Tests 1-8 reviewed today.
Rent-roll canonical QA drift: patched and did not recur in Attack Test 8.
```

## Seven-test batch CVF mapping

### Tests 1-4

Verdict:

```text
Customer-facing reports passed with disclosure.
Internal RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT repeated.
```

CVF mapping:

```text
Primary family: CVF-06 Source reconciliation / rendered variance drift.
Owner area: report_contract_qa / rent-roll canonical source selection.
Human red-pen decision: qa_false_positive_pattern_confirmed, system_trust_affected.
Launch status before patch: true launch blocker because repeated internal canonical drift could undermine QA/delivery confidence.
```

Resolution:

```text
Patch 1 completed.
report-contract-qa now uses shared resolveCanonicalRentRollAnnualTotals(...) authority.
Regression added for polluted summary total with correct row-derived annual market rent.
True mismatch still fails.
```

Post-patch status:

```text
CVF-06 rent-roll canonical drift subclass: patched / regression-covered / monitor in live retests.
```

### Test 5

Verdict:

```text
Correct fail-closed for unusable/bad rent roll.
```

CVF mapping:

```text
Primary family: CVF-02 Core Rent Roll parse failure.
Human red-pen decision: source_limitation_correctly_handled / legitimate fail-closed.
Launch status: PASS.
```

### Test 6

Verdict:

```text
Correct fail-closed for financially impossible 10x T12/Rent Roll mismatch.
```

CVF mapping:

```text
Primary family: CVF-03 Financial scale mismatch after core parse.
Human red-pen decision: source_limitation_correctly_handled / legitimate fail-closed for unreconcilable package.
Launch status: PASS.
```

### Test 7

Verdict:

```text
Exact PASS against expected controlled source-reconciliation disclosure contract.
```

CVF mapping:

```text
Primary family: CVF-06 Source reconciliation / rendered variance drift.
Human red-pen decision: correct_conservative_disclosure.
Launch status: PASS.
```

## Patch 1 CVF update - Rent-roll canonical QA drift

```text
Files changed:
- api/_lib/report-contract-qa.js
- tests/qa/report-contract-qa-smoke.js

CVF family:
- CVF-06

Issue code:
- RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT

Disposition:
- patched / monitor

Regression required:
- yes, added in report-contract-qa-smoke

Remaining risk:
- if a rent roll has no trustworthy row/unit evidence, QA can still use summary totals by intentional fallback.
```

## Patch 2 CVF update - Renovation / CapEx document treatment

```text
Files changed:
- api/generate-client-report.js
- tests/qa/generate-client-report-rent-roll-smoke.js

CVF families:
- CVF-07 Optional/full-underwriting support depth constraints
- CVF-15 Optional-support/source-package/admin ops paths

Disposition:
- partially patched

What was fixed:
- budget-only renovation docs acknowledge budget/scope while refusing rent-lift/ROI/payback/phasing if absent.
- structured forward-looking renovation docs can render budget/rent-lift/phasing as source facts only.
- no ROI/payback/NOI impact/valuation/refi/DCF/waterfall/final recommendation was introduced.

Remaining risk found by Attack Test 8:
- live routing can still misclassify a structured Reno Plan PDF as Rent Roll context before the new structured renovation treatment row has final authority.
```

## Patch 3 CVF update - QA advisory calibration / stale routing noise

```text
Files changed:
- api/_lib/source-report-coverage-qa.js
- api/_lib/qa-action-plan.js
- tests/qa/qa-action-plan-smoke.js

CVF families:
- CVF-07
- CVF-14
- CVF-15
- CVF-08 compatibility/noise surfaces where public/sample metadata can appear beside delivery authority

Disposition:
- patched / monitor

What was fixed:
- noisy source-coverage findings rerouted to advisory_only or render_gating_gap instead of public_sample_blocker.
- DocRaptor kept as distribution_config_blocked only.
- legacy public/high-value fields preserved as compatibility metadata, not active routing authority.
```

Remaining monitoring item:

```text
Final Attack Test 8 still showed readiness_source: legacy_action_plan_fallback / canonical_delivery_gate_status null in QA action plan artifacts.
This did not block customer delivery, but remains an internal trust/diagnostic watchlist item.
```

## Claude V2 notes mapped to CVF / future DS roadmap

Claude’s V2 architecture review should be preserved as future roadmap.

Key CVF/DS mappings:

```text
1. Renderer-selected rent-roll canonical write-through:
   - CVF-06 / report_contract_qa canonical authority hardening.
   - Future V2 PR A.
   - Not required to reopen launch Patch 1 unless drift recurs.

2. Acquisition triangle fixture suite:
   - CVF-04 current debt / proposed acquisition financing / refi separation.
   - CVF-07 optional/full-underwriting support-depth constraints.
   - CVF-15 optional support/source-package routing.
   - Future V2 PR B.
   - Attack Test 8 shows a launch-scope subset is now needed for Acquisition Memo support-doc routing.

3. Section eligibility smoke suite:
   - CVF-04 / CVF-05 / V2 full-underwriting source-constrained behavior.
   - Future V2 PR C.
   - Not launch-blocking for Acquisition Memo unless V2 surfaces leak.
```

Claude’s strongest architectural conclusion:

```text
No rewrite required. The codebase needs authority alignment and fixture-based hardening, especially around acquisition/debt/support-document combinations.
```

## Final Attack Test 8 CVF entry

Test name:

```text
Final Attack Test 8 - Stonebridge Lofts
```

Source package family:

```text
Valid XLSX T12 + valid XLSX Rent Roll + messy overlapping support-doc package:
- Purchase/proposed acquisition assumptions
- Appraisal summary
- Current debt statement
- Structured renovation plan
- Market survey
- Phase I ESA
```

Customer-facing verdict:

```text
PASS WITH DISCLOSURE / SAFE BUT INCOMPLETE.
```

CVF pass findings:

```text
CVF-01/CVF-02: pass, XLSX T12/Rent Roll parsed.
CVF-03/CVF-06: pass with source reconciliation disclosure; no false fail-closed.
CVF-08/CVF-09/CVF-10: pass, report published and no customer lifecycle limbo.
CVF-13: pass, no runtime/PDF fatal.
V2 containment: pass, no DSCR/refi/DCF/waterfall/final recommendation leak.
Rent-roll canonical drift subclass of CVF-06: pass, no recurrence.
```

Critical CVF failures found:

### CVF-04 / CVF-15 - Purchase assumptions and proposed acquisition financing misrouted

Observed source facts:

```text
Stonebridge_Assumptions.pdf contained purchase price $13,500,000, NOI basis $945,000, going-in cap 7.00%, proposed acquisition loan $9,450,000, LTV 70.0%, interest rate 5.95%, amortization 30 years, lender fee 0.85%.
```

Observed wrong behavior:

```text
PDF said Purchase assumptions provided: No.
PDF said Proposed acquisition loan terms complete: No.
PDF said Proposed Acquisition Financing: Not source-complete / not modeled.
Artifact parsed Stonebridge_Assumptions.pdf as mortgage_statement_parsed with rate/amortization but no loan amount.
Artifact semantic role bizarrely showed environmental_due_diligence.
```

Classification:

```text
Human red-pen decision: true_launch_blocker.
Customer visible: yes.
Math affected: no core math affected, but acquisition-context source binding affected.
Source binding affected: yes.
Owner area: support-doc role routing / acquisition assumptions extraction / proposed financing context.
Patch required: yes.
Regression required: yes, use Final Attack Test 8-style fixture.
```

### CVF-04 / CVF-15 - Current debt statement not recognized

Observed source facts:

```text
Current_Debt_Stonebridge.pdf contained current outstanding balance $6,800,000, interest rate 4.85%, amortization remaining 24 years, monthly payment $39,250, maturity 2029-11-01.
```

Observed wrong behavior:

```text
PDF said No verified current debt context was provided.
Document Treatment listed the file as Other Support Document / Context only / auditability only.
```

Classification:

```text
Human red-pen decision: true_launch_blocker for Acquisition Memo product quality.
Customer visible: yes.
Math affected: no unsafe math rendered.
Source binding affected: yes.
Owner area: current debt support-doc routing / extraction / Document Treatment / Financing Readiness consumer.
Patch required: yes.
Regression required: yes.
```

### CVF-07 / CVF-15 - Structured Reno Plan misrouted as Rent Roll

Observed source facts:

```text
Stonebridge_Reno_Plan.pdf contained total renovation budget $1,280,000, unit scopes, cost/unit, stated rent lifts, and phasing.
```

Observed wrong behavior:

```text
PDF said no verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided.
Document Treatment labeled Stonebridge_Reno_Plan.pdf as Rent Roll / Context only.
AI rent-roll recovery attempted and correctly rejected it as not a rent roll, but the final treatment row still inherited wrong rent-roll framing.
```

Classification:

```text
Human red-pen decision: true_launch_blocker for Acquisition Memo support-doc intelligence.
Customer visible: yes.
Math affected: no core math affected.
Source binding affected: yes.
Owner area: support-doc classifier / parser dispatch / renovation treatment renderer.
Patch required: yes.
Regression required: yes.
```

## New active blocker after Attack Test 8

New blocker name:

```text
Patch 4 - Support Document Role Routing / Acquisition Context / Current Debt / Structured Reno Path Fix
```

Primary CVF families:

```text
CVF-04 Current-debt/refi render-contract drift and debt/proposed-financing separation.
CVF-07 Optional/full-underwriting support depth constraints.
CVF-15 Optional-support/source-package/admin ops paths.
```

Secondary diagnostic families:

```text
CVF-06 if wrong support-doc role leads to rendered/source reconciliation mismatch.
CVF-08 if QA/action artifacts mispromote support-doc issues to delivery authority.
```

Patch 4 invariant:

```text
Support documents must be routed by explicit document role and source facts before final Document Treatment / Financing Readiness consumes them.

A purchase/proposed acquisition assumptions doc must not become current debt, environmental due diligence, or generic debt support.
A current debt statement must not become generic support when explicit outstanding balance/current debt facts exist.
A structured renovation plan must not become rent roll context.
```

Patch 4 required behavior:

```text
1. Purchase/proposed acquisition assumptions:
   - render as Purchase Assumptions / Proposed Acquisition Financing Context when source-complete;
   - display purchase price, NOI basis, going-in cap, proposed loan amount, LTV, rate, amortization, and fee as bounded source facts if safely extracted;
   - do not create DSCR/debt sizing/refi/DCF/waterfall/final recommendation unless current launch doctrine explicitly supports a bounded field.

2. Current debt:
   - render as Existing/Current Debt Context when outstanding balance/current debt terms are explicit;
   - keep separate from proposed acquisition financing;
   - do not unlock refinance, DSCR, DCF, waterfall, or recommendation.

3. Structured renovation:
   - render as Structured Renovation / CapEx Plan when budget/rent lift/phasing are explicit;
   - display only source facts;
   - do not model ROI, payback, NOI impact, stabilized value, refi, DCF, waterfall, or recommendation.

4. Market survey:
   - context only;
   - must not override Rent Roll market rent.

5. Appraisal:
   - valuation context only;
   - must not override purchase price, T12 NOI, or Rent Roll values.
```

## Current CVF launch posture

```text
Screening:
- Still launchable / founder-beta ready from current evidence.
- Needs final website/payment/access/DocRaptor/security smoke before public launch.

Acquisition Memo:
- Not launch-cleared after Attack Test 8.
- Core math and delivery path are strong.
- Support-doc role routing is not yet ELITE.

Full Underwriting V2:
- Deferred.
- Claude’s PR A/B/C notes should be tracked as V2 roadmap.
```

## Next action

Do not run another random test now.

Next sequence:

```text
1. Commit Patches 1-3 separately if not already committed.
2. Give Codex targeted Patch 4 prompt.
3. Patch only support-doc role routing / acquisition assumptions / current debt / structured renovation path.
4. Add Final Attack Test 8-style regression fixture(s).
5. Rerun Final Attack Test 8 package.
6. Update MD files again after Patch 4 result.
```

## Guardrails

```text
No broad audit by default.
No report-specific hardcoding.
No core T12/Rent Roll math changes unless a true source-binding defect is proven.
No delivery gate/payment/access changes.
No V2 reopen.
No DSCR/refi/DCF/waterfall/equity return/deal score/final recommendation.
No support-doc override of T12/Rent Roll source truth.
No DocRaptor production flip until final.
```

---

# June 10, 2026 Addendum - InvestorIQ Learning Loop Doctrine / No Silent Financial Mutation

## Current controlling decision

InvestorIQ should become more intelligent from every controlled test and every future live report, but it must not silently change customer-facing financial truth.

The learning system is allowed to improve diagnostics, issue clustering, QA calibration, source-package scoring, regression recommendations, and future patch proposals.

The learning system is not allowed to silently mutate deterministic financial outputs, source-bound values, delivery authority, credit/payment/access state, or customer-facing calculations.

Controlling rule:

```text
InvestorIQ may learn from test and live-report outcomes, but any learned rule that can affect customer-facing financial outputs must be promoted through human-approved deterministic code, regression tests, and commit review before it can affect production reports.
```

## Three-zone learning architecture

### 1. Locked deterministic calculation engine

This layer remains sacred and must not self-learn or self-mutate.

It owns:

```text
NOI
EGI
Gross rental income
Other income
Operating expenses
Expense ratio
NOI margin
Break-even occupancy
Occupancy
Annual in-place rent
Annual market rent
Annual rent upside
Rent gap %
Per-unit metrics
Cap-rate value math
Price per unit
NOI per unit
Current debt context values
Proposed acquisition financing values when explicitly source-complete
Delivery/fail-closed/customer-credit/payment/access authority
```

Permitted change path:

```text
human red-pen decision -> deterministic rule proposal -> Codex/code patch -> regression test -> review -> commit -> future reports
```

Forbidden change path:

```text
test observation -> AI silently changes numbers in a future report
```

### 2. Learning ledger / feedback memory

Every meaningful test and future live report should produce structured learning records.

Minimum learning event fields:

```text
report_id / job_id
report_type
source_package_family
issue_code
human_red_pen_decision
severity
launch_blocker: yes/no
customer_visible: yes/no
math_affected: yes/no
source_binding_affected: yes/no
root_cause_family
recommended_owner_area
patch_required: yes/no
regression_required: yes/no
final_disposition
notes
```

Allowed human red-pen dispositions:

```text
true_launch_blocker
true_bug_non_launch_blocker
qa_false_positive
correct_conservative_disclosure
source_limitation_correctly_handled
support_doc_containment_pass
v2_surface_leak
current_debt_proposed_financing_contamination
renderer_or_pdf_polish
admin_dashboard_diagnostic_polish
post_launch_backlog
ignore_for_now
```

### 3. Recommendation / QA intelligence layer

This layer may use prior learning records to make the system smarter without touching customer financial outputs.

Allowed uses:

```text
cluster repeated issue families;
identify repeated QA false positives;
recommend focused Codex prompts;
recommend regression tests;
rank issues as Tier 1, Tier 2, or Tier 3;
warn when a live report resembles a prior failure pattern;
recommend whether an issue is parser, renderer, QA contract, source limitation, distribution config, or admin diagnostic;
prepare V2 eligibility intelligence from Acquisition Memo patterns.
```

Forbidden uses:

```text
change NOI, rent, cap-rate value, debt, DSCR, financing, delivery, credit, payment, or access outputs without a deterministic patch;
override T12/Rent Roll/source-bound values because a prior test looked similar;
suppress a real customer-visible math issue because a previous issue was a false positive;
mark a report deliverable or failed based only on learned similarity;
create new modeled outputs from unsupported support documents.
```

## Test 1 / Test 2 learning signal recorded

The first two June 10 major tests created the first clear Learning Loop candidate.

Observed pattern:

```text
RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT fired in Test 1 and Test 2.
Customer-visible rendered annual market rent appeared mathematically correct from row/unit-mix rent-roll math.
Internal QA/canonical value appeared polluted by inflated summary totals.
```

Interpretation:

```text
This is not yet proof of wrong customer-facing math.
It is a repeated QA/canonical-source-selection trust issue.
Treat as a Critical Watchlist / potential launch blocker if repeated across the 7-test batch.
Likely owner area: QA contract / rent-roll canonical source selection, not report renderer, unless a later test proves customer-visible math is wrong.
```

Correct learning classification for now:

```text
issue_code: RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
human_red_pen_decision: qa_false_positive_pattern_candidate
severity: critical_watchlist
customer_visible_math_wrong: not proven
system_trust_affected: yes
patch_now: no, wait for all 7 tests unless it escalates into visible math defect
regression_required_if_patched: yes
```

## Startup launch discipline

Learning Loop doctrine does not mean pausing launch for every imperfect artifact.

Launch-blocking learning families are only those that can create Tier 1 failures:

```text
wrong math;
wrong source binding;
fabricated/inferred unsupported values;
current debt / proposed financing / refi contamination;
unsafe V2 surface leakage;
customer lifecycle limbo;
false fail-closed or false publish;
credit/payment/access/security failure;
missing or misleading customer-facing limitations.
```

Tier 2 learning families can be captured for post-launch improvement:

```text
PDF spacing;
filename wrapping;
thin divider pages;
repetitive wording;
advisory QA noise;
admin diagnostic clarity;
optional support-doc summary depth;
public/sample/DocRaptor distribution polish.
```

## V2 Underwriting benefit

Acquisition Memo testing should become the training ground for Full Underwriting V2.0.

Every memo test can teach V2:

```text
which source packages are strong enough for debt sizing;
which fields are commonly missing for DSCR;
which support docs are safe context-only;
which support docs should never unlock modeled outputs;
which current-debt/proposed-financing combinations are dangerous;
which QA signals are reliable versus noisy;
which source gaps should create V2 eligibility constraints.
```

V2 should not inherit the old broad underwriting surfaces until the Learning Loop has enough source-package evidence and deterministic eligibility rules.

## Future implementation target

When launch pressure allows, add a persistent `learning_events` / `red_pen_review_events` table or artifact family.

Near-term manual version:

```text
During major test batches, record each issue in the docs as:
- Test number
- visible report issue
- artifact/QA issue
- launch-blocking status
- human decision
- owner area
- defer/patch decision
```

Longer-term product version:

```text
Every generated report creates structured diagnostics.
Human/Admin red-pen decisions attach dispositions.
Repeated patterns create recommended rules/regressions.
Only human-approved deterministic patches can affect financial outputs.
```

## Guardrail phrase

Use this phrase as the controlling shorthand:

```text
InvestorIQ learns for diagnostics and future rules; it does not silently learn new numbers.
```

---

# June 10, 2026 Addendum - Learning Loop Mapping to Core-Valid Failure Path Ledger

## Current CVF interpretation of Learning Loop doctrine

The Learning Loop is not a new delivery authority and not a new calculation authority.

It is a diagnostics and regression-intelligence layer that supports the existing CVF doctrine.

Mapping:

```text
CVF families remain the launch-blocking doctrine map.
Learning events help classify whether a repeated issue is a true CVF launch blocker, a QA false positive, a correct disclosure, or Tier 2 polish.
```

## Learning Loop cannot override CVF authority

Learning events must not override:

```text
CVF-01 / CVF-02 core T12/Rent Roll validity;
CVF-04 current-debt/refi separation;
CVF-05 report-type section leak gates;
CVF-06 source reconciliation disclosure behavior;
CVF-08 / CVF-09 / CVF-10 delivery-gate and worker lifecycle;
CVF-11 / CVF-12 customer failure/Dashboard copy;
CVF-13 runtime/storage/PDF catastrophic failure treatment;
CVF-14 provider/advisory diagnostic-only behavior;
CVF-15 optional-support diagnostic-only behavior.
```

Learning events may recommend patches or regressions for these families, but cannot directly change customer outputs.

## Tests 1-2 CVF watchlist mapping

Observed repeated issue:

```text
RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT
```

Likely CVF family:

```text
CVF-06 Source reconciliation / rendered variance drift
```

Possible related authority family:

```text
report_contract_qa canonical rent-roll source selection / summary-total acceptance
```

Current status:

```text
Critical Watchlist / potential launch blocker.
Not yet proven as customer-visible wrong math.
Repeated enough to track as a system-trust issue.
Do not patch until all 7 reports are reviewed unless the defect becomes customer-visible.
```

Correct CVF handling if confirmed:

```text
If rendered math is correct and QA canonical is wrong:
- patch QA/canonical source selection;
- add regression proving row-derived/unit-mix totals outrank polluted summary totals when summary totals are magnitude-inconsistent;
- do not patch renderer math.

If rendered math is wrong:
- classify as Tier 1 core math/source-binding blocker;
- patch renderer/source selection immediately after batch review;
- add regression proving customer-visible annual market rent/rent gap/value sensitivity use correct authority.
```

## CVF learning event classification template

Use this template for future ledger entries:

```text
Issue Code:
Report/Test:
CVF Family:
Human Red-Pen Decision:
Customer Visible:
Math Affected:
Source Binding Affected:
Launch Blocker:
Owner Area:
Patch Timing:
Regression Required:
Final Disposition:
```

## No silent mutation rule added to CVF doctrine

All CVF patches must remain deterministic.

A repeated learning pattern may trigger:

```text
recommended Codex prompt;
recommended regression fixture;
recommended QA calibration;
recommended source-package scoring rule;
recommended V2 eligibility rule.
```

It may not trigger:

```text
automatic changes to financial values;
automatic suppression of customer-visible warnings;
automatic delivery/fail-closed changes;
automatic source override;
automatic V2 debt/DSCR/refi/DCF unlocks.
```

---

# June 10, 2026 Addendum - ELITE Launch Doctrine Status / Core-Valid Failure Path Reclassification

## Current controlling status

The Core-Valid Failure Path Ledger now distinguishes between launch-blocking Tier 1 doctrine and non-blocking Tier 2 polish/advisory issues.

The controlling launch rule is:

```text
Core-valid reports must publish unless true core failure or true runtime/storage/PDF/catastrophic render failure prevents safe generation.

Optional/support/advisory/distribution issues must remain section-level, diagnostic, advisory, or distribution-config only.

The system may launch when Tier 1 truth, math, source binding, non-fabrication, unsafe-surface prevention, and delivery lifecycle are ELITE.
```

This supersedes any workflow where every advisory, optional section, public/sample field, or cosmetic PDF issue is treated as a launch blocker.

## Tier 1 doctrine families that must remain ELITE

The following are launch-blocking if violated:

```text
1. Core math / calculations.
2. T12 and Rent Roll core parse / validation.
3. Source-to-output binding.
4. No fabricated or inferred financial facts.
5. Correct fail-closed behavior for truly invalid required core docs.
6. No dangerous V2 leakage in launch products.
7. Current debt / proposed acquisition financing / refi separation.
8. Conservative non-misleading report classification.
9. Customer-facing disclaimer / limitation language.
10. Delivery lifecycle, credit, payment, and report-access basics.
```

## Current ELITE / near-ELITE mapping to CVF families

### CVF-01 / CVF-02 - Core T12 and Rent Roll parse failure

Current status:

```text
Legitimate fail-closed families preserved.
Valid-core parse path is ELITE in recent clean, messy, narrative/recovery, spreadsheet, and swapped-slot tests.
```

Evidence from recent checkpoint:

```text
Acquisition Memo 15/16 and 124 Richmond Clean/Messy tests showed T12 and Rent Roll verified at 4/4 / 100% where core docs were usable.
```

Remaining launch check:

```text
Run final invalid-core/server-gate smoke before full public launch.
```

### CVF-03 - Financial scale mismatch after core parse

Current status:

```text
No active recent blocker observed.
Treat as disclosure/qualification unless true unreconcilable core contradiction exists.
```

### CVF-04 - Current-debt/refi render-contract drift

Current status:

```text
Mostly contained in customer-facing PDFs.
Not fully ELITE until proposed acquisition financing context render path and current-debt separation contract QA are finalized.
```

Recent tests show proposed financing did not leak into DSCR/refi/current-debt surfaces. Remaining issue is over-conservative omission of clean proposed acquisition financing context.

### CVF-05 - Report-type section leak

Current status:

```text
Customer-facing PDFs appear safe.
QA detector still needs calibration for valid Acquisition Memo section labels.
```

Not launch-blocking if detector noise remains admin-only, but should be patched because it creates false elite-readiness noise.

### CVF-06 - Source reconciliation / rendered variance drift

Current status:

```text
Strong / near ELITE.
Recent source reconciliation and rent/T12 alignment held across tested packages.
```

### CVF-07 - Optional/full-underwriting support depth constraints

Current status:

```text
Safe-internal / distribution-only direction is working.
Optional support issues are not killing customer delivery in recent tests.
```

Remaining issue is diagnostic/advisory calibration, not customer-facing doctrine failure.

### CVF-08 / CVF-09 / CVF-10 - Delivery-gate hold-chain, publication-held shim, worker terminal failure misclassification

Current status:

```text
Valid-core publish path is ELITE in recent tests.
Core-valid jobs are publishing and customer delivery remains allowed despite advisory/support/config findings.
```

Continue to guard against any resurrection of:

```text
user_needs_documents
needs_documents
publication_held
MISSING_REQUIRED_SOURCE_DATA
entitlement_restored
```

for core-valid section-only/support/advisory issues.

### CVF-11 / CVF-12 - Failure message and Dashboard customer-copy fallback

Current status:

```text
Mostly ELITE for current valid-core path.
Still requires final customer-facing invalid-core/system-failure copy smoke before public launch.
```

### CVF-13 - Runtime/storage/PDF/catastrophic render failure

Current status:

```text
Legitimate fail-closed family preserved.
Renderer-scope TDZ/undefined-variable subclass has been root-patched and harnessed.
```

Still legitimate:

```text
true runtime fatal
storage failure
PDF generation fatal
catastrophic render failure where no safe shell can be produced
```

### CVF-14 - OpenAI/provider/advisory failures

Current status:

```text
Diagnostic-only when deterministic core artifacts are valid.
Safe-internal / monitor.
```

### CVF-15 - Optional-support/source-package/admin ops paths

Current status:

```text
Mostly safe-internal / distribution-only.
Support-doc containment is ELITE in recent PDFs.
```

Recent tests show Phase I, zoning, unsupported appraisal, market survey, offering summary, and CapEx remained context-only / not quantitatively modeled.

## Already ELITE from a CVF perspective

```text
1. CVF-01/CVF-02 valid-core parsing path for usable T12 and Rent Roll.
2. CVF-06 source reconciliation for tested T12/Rent Roll value families.
3. CVF-07/CVF-15 support-doc containment in customer-facing PDFs.
4. CVF-08/CVF-09/CVF-10 valid-core publish path in recent live tests.
5. CVF-14 provider/advisory diagnostic-only behavior when deterministic core succeeds.
6. V2 leakage prevention in recent Acquisition Memo PDFs.
7. Property tax corroborating support path.
8. Document Treatment safety/containment for unsupported docs.
```

## Not yet ELITE / open bounded CVF work

```text
1. CVF-04: proposed acquisition financing context render path and current-debt separation contract calibration.
2. CVF-05: report-type section leak detector calibration for valid Acquisition Memo sections.
3. CVF-07/CVF-15: advisory/action/manager vocabulary cleanup so old public-sample/high-value/Ken language is not active authority.
4. CVF-11/CVF-12: final Dashboard/failure-copy smoke for invalid-core/system-failure scenarios.
5. Payment/access/download owner protection smoke before full public launch.
```

## Tier 2 issues are not CVF launch blockers

The following are not launch blockers if Tier 1 remains true:

```text
PDF spacing/polish
long filename wrapping
some divider/thin pages
awkward repeated wording
overly conservative omission of optional support details
optional CapEx / appraisal / market survey depth
advisory QA noise
admin dashboard diagnostic grouping
DocRaptor test mode during internal/founder beta
```

These should route to admin diagnostics or post-launch patch backlog, not fail customer delivery.

## Current root patch in progress

Codex is currently working on:

```text
Generalized Acquisition Memo Proposed Acquisition Financing Context render path.
```

Required invariant:

```text
Validated proposed acquisition financing context may render as bounded acquisition-financing context.
It must not become current debt, refinance analysis, DSCR, debt-service underwriting, DCF, waterfall, deal score, or final recommendation.
Incomplete proposed financing must remain Not source-complete / not modeled and advisory-only when correctly qualified.
```

## Updated doctrine for future audits

Do not ask Codex to audit every possible imperfection.

Future audits must be restricted to:

```text
Tier 1 launch-blocking doctrine only.
Find paths that can create wrong math, wrong source binding, fabricated values, unsafe V2 leakage, customer lifecycle limbo, payment/access failure, or false fail-closed behavior.
Do not list cosmetic or optional-depth issues as launch blockers.
```

---

# June 8, 2026 Night Addendum - Acquisition Memo 13 Financing-Ready Checkpoint / Final Polish + Advisory Rounding Root Fix

## Current controlling status

InvestorIQ ended June 8 with the Acquisition Memo product direction materially validated.

Current report/product status:

```text
Screening Report:
Launchable / founder-beta ready.

Acquisition Memo:
Founder-beta / customer-deliverable and now credible for 1-150/200 unit financing conversations, pending one final retest after the latest polish and advisory QA rounding patch.

Full Underwriting V2.0:
Still deferred. This remains the institutional lender-credit-committee package for 250+ unit assets, multi-building deals, family office / Ken Dunn type users, and roughly $50M-$500M transactions.
```

Controlling product distinction:

```text
Acquisition Memo = financing-ready acquisition memo for serious lender discussions and acquisition financing requests on approximately 1-150/200 unit properties.

Full Underwriting V2.0 = institutional credit-committee package with full DSCR stack, debt sizing, DCF, waterfall, capital stack, integrations, lender/investor package, and advanced sensitivity analysis.
```

Do not reopen Full Underwriting V2 surfaces inside the launch Acquisition Memo.

## Acquisition Memo 12 root-render confirmation

The repeated Document Treatment contradiction finally tested clean.

The old failure was:

```text
purchase_assumptions_source.txt used correctly in the Acquisition Memo Summary for:
- Purchase Price $10,640,000
- Going-In Cap Rate 5.8%
- NOI Basis $611,800

but rendered incorrectly in Document Treatment as:
- Appraisal Context
- Context only
- Listed for auditability only; not used quantitatively
- Listed but Not Quantitatively Modeled
```

Acquisition Memo 12 proved the root-render fix:

```text
purchase_assumptions_source.txt rendered as:
Purchase Assumptions / Acquisition Context

It did not render as:
Appraisal Context
Context only
Listed for auditability only
Listed but Not Quantitatively Modeled
```

Interpretation:

```text
Final Document Treatment Summary same-file artifact precedence family is fixed in the tested path.
Validated acquisition / purchase-assumptions authority now beats stale appraisal metadata for the same source identity.
The visible PDF contradiction is no longer present.
```

This root family should be treated as closed after the next final retest confirms it remains stable after the financing-section patches.

## Acquisition Memo 13 result - 100-unit / lender-conversation test

Acquisition Memo 13 reached 17 pages and passed the practical "Ken Dunn 100-unit property test" / smaller-deal lender-conversation test.

Clarified meaning of the test:

```text
This is not the full Ken Dunn institutional $50M-$500M / 250+ unit credit-committee test.
This is the 50-150-ish / 1-150/200 unit Acquisition Memo financing-conversation test.
```

Verdict:

```text
Acquisition Memo 13 = PASS for founder-beta / customer-deliverable / 1-150/200 unit lender-conversation use, with minor polish.
Full institutional Ken Dunn test = not applicable until Full Underwriting V2.0.
```

Acquisition Memo 13 now gives lenders and borrowers a coherent first-pass package:

```text
property size
occupancy
T12 income / expenses / NOI
rent roll support
rent upside
purchase price
going-in cap rate
cap-rate value indication
uploaded existing debt context
source coverage
document treatment
what is verified, context-only, and not modeled
```

## Preliminary Financing Readiness Summary implemented

The new Acquisition Memo financing section was implemented and refined.

New section:

```text
Preliminary Financing Readiness Summary
```

Purpose:

```text
Make Acquisition Memo useful for 1-150/200 unit acquisition borrowers preparing lender discussions and acquisition financing requests, without implying loan approval or reopening V2 debt/refi/DCF surfaces.
```

Section structure now includes:

```text
1. Acquisition Request Context
   - Purchase Price
   - NOI Basis
   - Going-In Cap Rate
   - Units
   - Price per Unit
   - NOI per Unit

2. Operating Support
   - Effective Gross Income
   - Operating Expenses
   - NOI
   - Expense Ratio
   - NOI Margin
   - Occupancy
   - Break-Even Occupancy

3. Rent / Value Support
   - Annual In-Place Rent
   - Annual Market Rent
   - Annual Rent Upside
   - Rent Gap %
   - Implied Value at 5.0%, 6.0%, 7.0% cap rates
   - Document-derived cap-rate reference, if available

4. Debt / Financing Context
   - Uploaded Existing Debt Context, when verified:
     - Outstanding Balance
     - Interest Rate
     - Amortization
     - LTV
   - Proposed Acquisition Financing:
     - shown only if explicitly source-complete
     - otherwise: Not source-complete / not modeled

5. Lender Diligence Checklist
   - T12 verified: Yes / No
   - Rent Roll verified: Yes / No
   - Purchase assumptions provided: Yes / No
   - Property tax support: Yes / No
   - Current debt context uploaded: Yes / No
   - Proposed acquisition loan terms complete: Yes / No
   - Environmental / Phase I support: Context only / not modeled, when present
   - Appraisal support: Context only unless structured value exists, when present
   - CapEx / renovation plan: Context only unless verified budget and rent-lift assumptions exist, when present
```

Required note/caution remains:

```text
Shown for lender discussion and acquisition diligence support only. This Acquisition Memo organizes verified operating evidence, rent-positioning support, acquisition context, and uploaded financing context. It does not represent loan approval, lender commitment, refinance proceeds, full debt sizing, DCF, equity waterfall, or institutional credit-committee underwriting.
```

## Financing-section implementation sequence completed

### Slice 1 - New Acquisition Memo-only section

Files changed:

```text
api/generate-client-report.js
api/report-template-runtime.html
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Added buildPreliminaryFinancingReadinessSummaryHtml(...)
Added Acquisition Memo-only template block
Wired section into v1_core Acquisition Memo final render path
Kept Screening unchanged
Kept old V2 debt/refi sections collapsed
Current debt shown only as Uploaded Existing Debt Context
Proposed acquisition financing separate and not derived from current debt
```

### Slice 2 - Lender-facing section hardening

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Strengthened the Preliminary Financing Readiness Summary without reopening V2 debt math.
Existing/current debt remains disclosure-only under Uploaded Existing Debt Context.
Proposed acquisition financing collapses to Not source-complete / not modeled unless explicit source-complete proposed-financing language exists.
No proposed loan amount, debt service, DSCR, or debt sizing rendered in this slice.
Forbidden V2 and loan-approval language confirmed absent from visible HTML.
Screening regression confirms the section does not render in Screening.
```

Forbidden surfaces kept closed:

```text
DSCR
Current Debt DSCR
refinance proceeds
refinance stability
DCF
waterfall
equity return
deal score
final recommendation
BUY / SELL / HOLD
loan approval
lender commitment
financing approval
credit approval
Proposed Acquisition Debt Sizing
```

### Slice 3 - Tiny visible polish

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

```text
Added Annual Rent Upside to Rent / Value Support.
Added Rent Gap % to Rent / Value Support.
Fixed duplicate Proposed Acquisition Financing label.
Removed duplicate/wrong Property tax support: Context only / not modeled row.
Property tax support now appears once as Yes / No.
Kept Screening unchanged.
Kept forbidden V2 surfaces closed.
```

Interpretation:

```text
The financing section should now feel like a credible Acquisition Memo section rather than a tiny debt-context note.
```

## Cap-rate advisory QA false-positive root fix completed

A final advisory/root cleanup fixed the cap-rate rounding false-positive class.

Problem:

```text
Source value: 5.75%
Customer report display: 5.8%

This is normal display rounding, not a real source-report contradiction.
The live source-package advisory layer could still flag it as source_report_inconsistency.
```

Root issue:

```text
Production advisory QA treated normal rounded percentage displays as source/report contradictions.
```

Files changed:

```text
api/_lib/source-package-qa.js
tests/qa/source-package-cap-rate-rounding-smoke.js
```

Production path fixed:

```text
filterSourcePackageFalsePositives(review, compactPayload)
isCapRateRoundingFalsePositive(finding, compactPayload)
```

Rounding rule:

```text
Cap-rate / percentage comparisons normalize to percentage points.
Values within 0.1 percentage points are treated as equivalent.
The filter is narrowly scoped to cap-rate / percentage source-report inconsistency findings.
```

Regression proof:

```text
source 5.75% vs rendered 5.8% -> no source_report_inconsistency
source 5.75% vs rendered 5.75% -> no source_report_inconsistency
source 5.75% vs rendered 6.5% -> still source_report_inconsistency
non-cap contradictions remain unaffected
```

Interpretation:

```text
This is a root-class advisory QA fix, not a test-report hack.
Do not hardcode Acquisition Memo 13, Harbourstone, purchase_assumptions_source.txt, 5.75, or 5.8 in production logic.
```

## Current report readiness assessment

No-BS readiness assessment as of this checkpoint:

```text
Screening Report:
8.5/10 launch readiness.
Launchable/founder-beta ready.

Acquisition Memo:
Approximately 8+/10 if the next final retest confirms the new financing section polish and advisory rounding fix.
Founder-beta/customer-deliverable.
Financing-conversation ready for 1-150/200 unit properties.
Not a loan approval package.
Not a Full Underwriting V2 institutional package.

Full Underwriting V2.0:
Do not launch.
Future premium product.
```

Current strongest product point:

```text
InvestorIQ now has document-treatment discipline:
it clearly separates what was used quantitatively, what was context-only, what was deferred, and what was not modeled.
```

Current remaining risk:

```text
Trust polish.
No visible contradictions.
No stale document treatment.
No false QA panic.
No awkward duplicate labels.
No V2 leakage.
No Summary-vs-Data-Coverage contradictions.
```

## Next action after this checkpoint

Do not do more tonight after committing the final cap-rate advisory patch and updating docs.

Next work session:

```text
Run ONE controlled Acquisition Memo retest using the same/source-family package.
```

Retest acceptance checklist:

```text
1. Preliminary Financing Readiness Summary appears and looks substantial.
2. Rent / Value Support includes Annual Rent Upside and Rent Gap %.
3. Proposed Acquisition Financing appears once as Not source-complete / not modeled when incomplete.
4. Lender Diligence Checklist has no duplicate Property tax support context-only row.
5. Uploaded Existing Debt Context appears only as debt context, not proposed acquisition financing.
6. purchase_assumptions_source.txt still renders as Purchase Assumptions / Acquisition Context.
7. No Appraisal Context / Context only contradiction for validated purchase assumptions.
8. No Listed but Not Quantitatively Modeled leak for validated purchase assumptions.
9. No V2 surfaces leak:
   - DSCR
   - Current Debt DSCR
   - refinance proceeds
   - refinance stability
   - DCF
   - waterfall
   - equity return
   - deal score
   - final recommendation
   - BUY / SELL / HOLD
10. Advisory QA should not false-flag 5.75% vs 5.8% cap-rate rounding.
11. Screening remains unchanged/protected.
```

If this retest passes:

```text
Acquisition Memo can be treated as founder-beta / customer-deliverable and financing-conversation ready for 1-150/200 unit acquisitions.
Next remaining launch work moves to final website/pricing/checkout/sample/DocRaptor/distribution polish, not report-core rescue.
```

## Guardrails going forward

Continue to enforce:

```text
micro-prompts only
no broad audits unless a real new root class appears
no report-specific production hacks
no hardcoded production filenames, property names, report IDs, or fixture-only values outside tests
no new API/serverless routes casually due to Vercel Hobby constraints
no pricing / Stripe / SQL / RPC changes during report-core polish
no DocRaptor production flip until final report confidence is confirmed
no public/Ken/sample distribution until DocRaptor production mode and public sample readiness are addressed
no public AI wording
no BUY / SELL / HOLD
no loan approval / lender commitment / financing approval / credit approval language
no reopening V2 debt/refi/DCF/waterfall/full debt sizing inside Acquisition Memo
```

## Fresh continuation point

Resume from here:

```text
June 8 night checkpoint.

Completed:
- Screening Memo 7 is launchable/founder-beta ready.
- Acquisition Memo 12 fixed the purchase-assumptions Document Treatment contradiction.
- Acquisition Memo 13 reached 17 pages and passed the 100-unit/lender-conversation test with minor polish.
- Preliminary Financing Readiness Summary has been implemented and polished.
- Cap-rate advisory QA rounding false-positive root fix is complete.
- Latest patches were safe to commit.

Next:
- Run ONE controlled Acquisition Memo retest.
- Upload PDF + artifacts.
- Review only the financing summary polish, Document Treatment stability, V2 leakage absence, and cap-rate QA rounding behavior.
- If clean, mark Acquisition Memo founder-beta/customer-deliverable and financing-conversation ready for 1-150/200 unit deals.
```

---


# June 8, 2026 Addendum - Acquisition Memo Financing-Ready Product Doctrine / Preliminary Financing Readiness Summary Locked

## Current controlling clarification

InvestorIQ Acquisition Memo is not merely a light debt-context memo.

The controlling product ladder is now:

```text
1. InvestorIQ Screening Report
   Purpose: help investors narrow a broad property search down to a few deals worth deeper diligence.
   Scope: T12 + Rent Roll operating triage, rent upside, operating quality, and source coverage.
   Not a financing memo or lender approval package.

2. InvestorIQ Acquisition Memo
   Purpose: financing-ready acquisition memo for approximately 1-150/200 unit properties.
   User outcome: help smaller and mid-market property investors organize the property story, operating support, NOI, rent upside, purchase basis, value indication, debt context, source coverage, and lender diligence gaps well enough to approach lenders and support acquisition financing conversations.
   It should be strong enough for users to show a lender when pursuing financing for a 1-150/200 unit acquisition, while avoiding unsupported loan-approval claims.

3. InvestorIQ Full Underwriting V2.0
   Purpose: lender-credit-committee / institutional package for sophisticated users such as Ken Dunn, family offices, larger operators, brokers, and institutional users.
   Target use case: 250+ unit assets, multi-building deals, and approximately $50M-$500M transactions.
   Future scope: advanced debt/refi, full DSCR stack, DCF, waterfall, capital stack, sensitivity analysis, integrations, lender/investor package, and institutional credit-committee-ready outputs.
```

This supersedes any narrower language suggesting Acquisition Memo is only for under-50-unit properties or only for vague/simple financing discussions.

## Acquisition Memo financing-readiness standard

Acquisition Memo should support lender-facing preliminary financing conversations for 1-150/200 unit deals, but it must not claim loan approval, lender commitment, or institutional credit-committee completeness.

Correct positioning:

```text
Acquisition Memo = financing-ready for serious lender discussions and acquisition financing requests.
Full Underwriting V2.0 = institutional lender / credit-committee package for major assets and portfolios.
```

The Acquisition Memo should answer the lender's first-pass questions:

```text
What is the property?
What is the verified income and NOI?
What is the purchase basis?
What rent/value support exists?
What debt or financing context was uploaded?
What is verified, what is context-only, and what remains missing for full credit underwriting?
```

## Required new section: Preliminary Financing Readiness Summary

Add or upgrade the Acquisition Memo financing section to render as:

```text
Preliminary Financing Readiness Summary
```

The section should include the following structure when source-supported.

### 1. Acquisition Request Context

```text
- Purchase Price
- NOI Basis
- Going-In Cap Rate
- Units
- Price per Unit
- NOI per Unit
```

### 2. Operating Support

```text
- Effective Gross Income
- Operating Expenses
- NOI
- Expense Ratio
- NOI Margin
- Occupancy
- Break-Even Occupancy
```

### 3. Rent / Value Support

```text
- Annual In-Place Rent
- Annual Market Rent
- Annual Rent Upside
- Rent Gap %
- Implied Value at 5.0%, 6.0%, 7.0% cap rates
- Document-derived cap-rate reference, if available
```

### 4. Debt / Financing Context

```text
- Uploaded Existing Debt Context, if available:
  - Outstanding Balance
  - Interest Rate
  - Amortization
  - LTV
- Proposed Acquisition Financing:
  - Shown only if explicitly provided
  - Otherwise: "Not source-complete / not modeled"
```

### 5. Lender Diligence Checklist

```text
- T12 verified: Yes
- Rent Roll verified: Yes
- Purchase assumptions provided: Yes / No
- Property tax support: Yes / No
- Current debt context uploaded: Yes / No
- Proposed acquisition loan terms complete: Yes / No
- Environmental / Phase I support: Context only / not modeled
- Appraisal support: Context only unless structured value exists
- CapEx / renovation plan: Context only unless verified budget and rent-lift assumptions exist
```

## Safe boundaries for the financing-readiness section

Allowed in Acquisition Memo:

```text
Acquisition Request Context
Operating Support
Rent / Value Support
Uploaded Existing Debt Context
Proposed Acquisition Financing status, only if explicitly source-supported
Lender Diligence Checklist
Source-complete limitation notes
```

Do not reopen Full Underwriting V2.0 surfaces in Acquisition Memo:

```text
No refinance proceeds
No refinance stress
No full debt sizing unless proposed acquisition financing terms are explicitly source-complete and the output is bounded to the Acquisition Memo readiness section
No DCF
No waterfall
No equity returns
No full debt schedule
No final recommendation
No BUY / SELL / HOLD
No loan approval or lender commitment language
No institutional credit-committee claim
```

Current debt / existing debt context must remain separate from proposed acquisition financing.

```text
Existing/current debt may be shown as Uploaded Existing Debt Context when verified.
Existing/current debt must not be relabeled as Proposed Acquisition Financing unless the source explicitly says it is proposed acquisition financing.
```

## Source-gating rule

If proposed acquisition financing terms are incomplete, the memo should still render the lender-facing readiness summary using verified property-level and source-coverage inputs, but proposed acquisition debt sizing/math should say:

```text
Not source-complete / not modeled
```

This limitation is acceptable and should not block the report.

## Immediate next implementation slice

After the Document Treatment root-render family is confirmed fixed, the next Codex slice should be:

```text
Add Preliminary Financing Readiness Summary to Acquisition Memo.
```

It must be a bounded Acquisition Memo product-value slice, not a V2 debt/refi/DCF reopening.

Guardrails:

```text
Do not touch Screening except protective regression.
Do not change pricing, Stripe, SQL/RPC, Supabase schema, routes, Dashboard, DocRaptor config, OpenAI config, auth, or upload gates.
Do not add new API/serverless routes.
Do not re-enable Full Underwriting V2 surfaces.
Do not hardcode property names, report IDs, production filenames, or fixture values outside tests.
```

---

# June 7, 2026 Addendum - Clean Retest Results / Acquisition Memo Root Renderer Failure Still Open / No More Testing Until Final Document-Treatment Precedence Patch

## Current controlling status

InvestorIQ completed the next clean retest batch after OpenAI API credits were restored and after the June 5/6 source-treatment / fullness / readiness cleanup patches were committed.

Clean retests reviewed:

```text
Screening Memo 7 - CLEAN
Acquisition Memo 10 - CLEAN
```

Controlling verdict:

```text
Screening Memo 7: PASS / launchable for ordinary customer delivery and founder-beta use.
Acquisition Memo 10: FAIL / not launchable yet because one visible credibility blocker remains.
```

Do not run more live tests while Codex is patching the Acquisition Memo root issue. A different test package could pass accidentally and would not prove the root class is fixed.

## OpenAI API credit / advisory layer status

OpenAI API credits were restored before this retest batch.

OpenAI/advisory/recovery calls are now working again. Artifacts show successful OpenAI responses, including accepted AI-assisted recovery where relevant.

Doctrine interpretation remains unchanged:

```text
OpenAI/advisory/recovery may help recover or flag source facts.
AI is not the final authority.
Deterministic validation and final render/source-treatment precedence must control customer output.
```

The latest failure is not an OpenAI quota issue and not an AI recovery issue.

## Screening Memo 7 result

Screening Memo 7 is launchable.

It does what the Screening product is meant to do:

```text
Fast document-based deal triage from T12 + Rent Roll.
Shows whether the property belongs in the pursue / maybe / next-diligence pile.
Does not attempt lender approval, debt sizing, DCF, waterfall, refi, or final recommendation.
```

Validated visible results:

```text
Classification: Stable
Units: 48
Occupancy: 95.8%
Annual In-Place Rent: $1,036,800
Annual Market Rent: $1,137,600
Annual Gross Rent Upside: $100,800
Rent Gap: 9.7%
EGI: $1,036,800
OpEx: $425,000
NOI: $611,800
Expense Ratio: 41.0%
NOI Margin: 59.0%
Break-Even Occupancy: 41.0%
Core input coverage: T12 4/4, Rent Roll 4/4
```

Screening artifacts showed:

```text
report_contract_qa: pass
violations: []
report_quality_ready: true
customer_delivery_ready: true
```

Known non-blockers:

```text
DocRaptor remains in test mode and blocks external/public sample distribution only.
Advisory QA may still raise low/medium parser-style or wording observations, but these do not block ordinary customer delivery when contract QA and deterministic core math pass.
```

Commercial interpretation:

```text
Screening is meaningfully above free calculators when the user has real documents.
Free calculators rely on manual entry and do not extract/validate/organize T12 + Rent Roll evidence into a memo.
InvestorIQ Screening sells time savings, consistency, document discipline, and a clean triage memo.
High-volume users such as investors screening 50 deals/month likely need bundles/subscription/custom pricing rather than single-report pricing only.
```

Current launch stance:

```text
Screening Report at founder pricing around $199 is launchable.
Future package ideas remain open: 3-pack, 10-pack, high-volume/custom plan.
```

## Acquisition Memo 10 result

Acquisition Memo 10 improved, but is not launchable yet.

Fixed / improved:

```text
Duplicate Rent Positioning Evidence appears fixed.
The report now shows one Rent Positioning Evidence section and then moves to Rent Upside / Value Sensitivity.
Core operating math still ties.
Purchase price and going-in cap rate display correctly in Acquisition Memo Summary.
V2 forbidden surfaces remain deferred/collapsed.
```

Still broken:

```text
purchase_assumptions_source.txt is still visibly rendered in the Document Treatment Summary as:
- Appraisal Context
- Context only
- Listed for auditability only; not used quantitatively

The same file is also listed under:
- Listed but Not Quantitatively Modeled
```

This is a launch blocker because the memo earlier uses that same source for:

```text
Purchase Price: $10,640,000
Going-In Cap Rate: 5.8%
NOI Basis: $611,800
```

A sophisticated investor could immediately see the contradiction.

## Root cause identified from artifacts

This is not a parser failure.

This is not an AI failure.

Artifacts show the correct acquisition artifact exists for `purchase_assumptions_source.txt`:

```text
artifact type: loan_term_sheet_parsed acquisition artifact
original_filename: purchase_assumptions_source.txt
semantic_doc_role: purchase_assumptions
validated: true
purchase_price: 10640000
going_in_cap_rate: 5.75
accepted_fields: purchase_price, going_in_cap_rate
```

But the same source also produced a stale `appraisal_parsed` artifact path:

```text
original_filename: purchase_assumptions_source.txt
semantic_doc_role: appraisal
cap_rate: 5.75
missing_appraised_value
```

The final Document Treatment Summary renderer is still choosing stale appraisal metadata for the source-treatment row, even though the validated acquisition artifact should outrank it.

Root failure class:

```text
Final Document Treatment Summary same-file artifact precedence failure.
```

The renderer must merge duplicate same-file artifacts and choose the highest-authority treatment row.

## Contract QA blind spot

The report contract QA passed even though the visible PDF failed.

Observed artifact status:

```text
report_contract_qa: pass
violations: []
report_quality_ready: true
customer_delivery_ready: true
```

But the PDF still visibly showed `purchase_assumptions_source.txt` as Appraisal Context / not quantitatively modeled.

Therefore the contract QA is not currently checking the actual final rendered Document Treatment Summary strongly enough.

This is a second root issue:

```text
Contract QA must fail when visible customer output contradicts validated acquisition artifact truth.
```

## Correct production invariant to patch

For Acquisition Memo mode, if any artifact for a source file has validated/recovered acquisition fields, including:

```text
purchase_price
going_in_cap_rate
noi_basis
semantic_doc_role: purchase_assumptions
```

then that source must render as:

```text
Document Role: Purchase Assumptions / Acquisition Context
Treatment: Acquisition context / document-derived acquisition context
Use: Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth
```

It must never render as:

```text
Appraisal Context
Context only / not used quantitatively
Listed for auditability only; not used quantitatively
Listed but Not Quantitatively Modeled
```

Unsupported appraisal files without validated acquisition fields should still remain Appraisal Context / context only.

`loan_terms_simple_source.txt` should remain Debt Support Received / contextual or deferred and should not become Purchase Assumptions or current-debt modeled output in launch Acquisition Memo mode.

## Acquisition Financing Readiness / mini financing section status

The prior Codex patch added the controlled mini financing readiness logic, but Acquisition Memo 10 did not have source-complete acquisition financing terms.

This is acceptable for this specific source package.

Required source-gated inputs for visible financing math remain:

```text
purchase_price
NOI basis
proposed acquisition loan amount OR LTV
interest rate
amortization years
```

If any required field is missing, the section must collapse or show a compact limitation note.

For Acquisition Memo 10, artifacts correctly indicated acquisition financing fields were limited/missing:

```text
ACQUISITION_FINANCING_FIELD_LIMITED
stated_acquisition_loan_amount_present: false
derived_acquisition_loan_amount_present: false
lender_fee_percent_present: false
```

This should remain a source limitation / section-level omission, not a whole-report blocker.

## Product strategy clarification recorded

Screening Report:

```text
Purpose: fast document-based deal triage.
Output: pass / maybe / pursue-diligence signal based on operating quality and rent upside.
Not a financing approval package.
```

Acquisition Memo:

```text
Purpose: investor-ready acquisition memo for basic/smaller property diligence and financing discussions.
For approximately 1-150/200 unit assets, it should support financing-ready lender conversations and acquisition financing requests when the required source inputs are available, while avoiding unsupported loan-approval claims.
It should not claim full lender approval if debt terms are incomplete.
```

Full Underwriting V2.0:

```text
Deferred product for advanced current debt/refi, DCF, waterfall, capital stack, integrations, advanced lender/investor package.
```

Do not reopen full V2 surfaces during the current root patch.

## Current Codex work in progress

Codex is currently working on an emergency root fix:

```text
Final Document Treatment Summary artifact precedence for same-file duplicate artifacts.
```

The patch must answer:

```text
A. Exact final renderer function that produced the bad row
B. Why report_contract_qa passed despite the bad PDF
C. Production precedence fix implemented
D. Final rendered contract check added
E. Regression with same filename producing stale appraisal + validated acquisition artifacts
F. Safe to commit yes/no
```

## Current no-testing rule

Do not run a different test package while this patch is in progress.

Reason:

```text
A different package may not create both stale appraisal_parsed and validated acquisition artifacts for the same filename.
It could pass accidentally and still leave the root bug alive.
```

Use the same source family/package after Codex patches.

## Next acceptance test after patch

After Codex returns and the patch is committed, run one Acquisition Memo retest using the same package.

Pass condition:

```text
purchase_assumptions_source.txt renders as Purchase Assumptions / Acquisition Context.
It does not render as Appraisal Context.
It does not render as Context only / not used quantitatively.
It does not appear under Listed but Not Quantitatively Modeled.
Only one Rent Positioning Evidence/Summary block remains.
No V2 forbidden surfaces leak.
Core operating/acquisition math remains correct.
```

Do not run messy/edge variants before this exact root class passes.

## Ledger interpretation

This is part of the ongoing CVF / DS root-family problem, not a one-off PDF typo.

Relevant families:

```text
CVF-07 Optional/full-underwriting support depth constraints
CVF-15 Optional-support/source-package/admin ops paths
DS-035 Support-doc treatment canonical authority
DS-037 Filename/fallback document-treatment paths
DS-041/042/043 final rendering and Data Coverage/source treatment consumers
DS-064/065/066 broader generator/rendered/QA provenance cluster
```

Do not mark the support-doc treatment/source-treatment root family closed until a regenerated Acquisition Memo PDF proves the visible Document Treatment Summary obeys validated acquisition artifact precedence.

## Immediate continuation point

Current exact continuation point:

```text
Codex is patching the final Document Treatment Summary artifact precedence bug.
Screening Memo 7 is launchable.
Acquisition Memo 10 is not launchable yet.
No more live testing until Codex fixes the root renderer and QA blind spot.
```



---

# June 5/6, 2026 Addendum - Elite Report Fullness / Source Treatment / Readiness Alias Cleanup Completed Before Retest

## Current controlling status

InvestorIQ is now at a new pre-retest checkpoint after the June 5/6 report-fullness and source-treatment cleanup sequence.

The immediate goal is no longer another Codex audit or another small patch. The known issues from the latest live Screening and Acquisition Memo reports have been patched as one consolidated root-family cleanup.

The next action is:

```text
Run one fresh Screening Report live test.
Run one fresh Acquisition Memo live test.
Upload the PDFs and analysis artifacts for red-pen review before any more patches.
```

Do not run messy variants, edge-case variants, public samples, or DocRaptor production-mode changes before this clean retest batch is reviewed.

## Live tests that triggered this checkpoint

The prior live reports materially improved after the Acquisition Memo pivot and report-fullness work:

```text
Screening Memo 3: 7 pages
Acquisition Memo 6: 14 pages
```

This confirmed that the report-fullness direction was working, but the red-pen review still found root-level defects that needed a consolidated cleanup before more live testing.

Known issues identified from the live PDFs/artifacts:

```text
1. Screening still risked thin final assembly despite valid T12 + Rent Roll.
2. Screening visible wording still referenced advanced excluded modules / launch memo language.
3. Acquisition Memo had duplicate rent-positioning presentation / wrapper churn.
4. Source-treatment tables needed clean semantic role/treatment labels while preserving filename transparency.
5. Debt support needed to be labeled as received/contextual/deferred, not modeled current-debt analysis.
6. Purchase assumptions treatment could contradict document-derived purchase-price / cap-rate context.
7. Legacy readiness aliases still contradicted canonical deliverability in artifacts.
8. Provider/advisory failures and DocRaptor test mode needed to remain diagnostic/distribution-only.
9. Purchase assumptions/acquisition context classification needed follow-through so it did not look like appraisal/appraised-value support.
```

## Patch family completed - report fullness, source treatment, and readiness alignment

Two tight production patches were completed and validated.

### Patch 1 - Acquisition Memo source treatment / filename transparency / duplicate rent positioning

Files changed:

```text
api/generate-client-report.js
api/_lib/report-contract-qa.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

- duplicate Acquisition Memo `Rent Positioning Summary` path was corrected;
- summary-only rent-roll branch now emits `Rent Positioning Evidence` rather than a second near-identical summary block;
- uploaded filenames remain visible for customer/audit transparency;
- filenames no longer act as the semantic treatment authority;
- support-treatment table separates `Filename`, `Document Role`, and `Treatment`;
- clean role labels added for T12, Rent Roll, Loan / Debt Support, Purchase Assumptions, Market Rent Context, CapEx / Renovation Context, Environmental Due Diligence Context, Appraisal Context, and Broker / Diligence Context;
- debt/current loan support now renders as support received with launch memo analysis deferred, not modeled current-debt analysis;
- purchase assumptions with purchase price / going-in cap / NOI basis now render as acquisition context or document-derived purchase/cap-rate reference when supported;
- Screening no longer says `launch memo`;
- customer-facing deferred/excluded copy no longer lists exact advanced module names such as DCF/waterfall/equity-return/deal-score/final recommendation;
- support-doc QA contract became row-aware so property-tax and environmental/zoning phrasing do not falsely trip cross-row treatment violations;
- occupancy contract matching was tightened so break-even/expense-ratio contexts are less likely to be misread as canonical occupancy drift.

Validation:

```text
node --check api/generate-client-report.js
node --check api/_lib/report-contract-qa.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

Codex reported validation pass / safe to commit. A separate uploaded-file syntax sanity check also passed.

### Patch 2 - Screening depth / final assembly / readiness alias cleanup / provider-DocRaptor diagnostic isolation

Files changed:

```text
api/generate-client-report.js
api/_lib/qa-action-plan.js
api/_lib/report-contract-qa.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

Completed behavior:

- full T12/Rent Roll Screening operating sections are kept alive in final assembly when valid T12 + Rent Roll exist;
- preserved Screening sections include income reconstruction, expense structure, NOI stability, rent-roll distribution, and Data Coverage / Source Reliability;
- no advanced underwriting surfaces were re-enabled for Screening;
- Screening customer-visible output no longer surfaces `launch memo`, DCF, waterfall, equity return, deal score, final recommendation, current-debt DSCR, refinance proceeds, or refinance stability language;
- generic Screening scope copy now uses safe language: advanced financing and return-projection modules are outside Screening scope;
- Acquisition Memo source-bound sections were preserved while reducing wrapper churn and duplicate rent-positioning presentation;
- focused smoke now verifies one visible rent-positioning path and no obvious duplicate-heading churn;
- canonical deliverability now drives compatibility/readiness aliases;
- when canonical state is deliverable, legacy aliases no longer contradict it with blocked/not-ready/publishable-false values;
- OpenAI/provider/advisory failures remain diagnostic-only and cannot create contradictory customer readiness when deterministic core parsing succeeds;
- DocRaptor test mode remains non-authoritative for ordinary customer delivery and remains distribution/public-sample metadata only;
- purchase assumptions classify as purchase-context/acquisition-context support when supported and otherwise remain context-only;
- purchase assumptions must not be treated as appraisal, appraised value, T12 override, Rent Roll override, or current debt override;
- forbidden V2 surfaces remain collapsed/deferred.

Validation:

```text
node --check api/generate-client-report.js
node --check api/_lib/qa-action-plan.js
node --check api/_lib/report-contract-qa.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

Codex reported validation pass / safe to commit. A separate uploaded-file syntax sanity check also passed.

## CVF family interpretation at this checkpoint

This sequence materially advances the following CVF families, but final live confirmation is still pending:

```text
CVF-04 Current-debt/refi render-contract drift
- Launch Acquisition Memo still keeps current-debt DSCR/refi surfaces collapsed/deferred.
- Debt support can be disclosed as received/contextual/deferred without becoming modeled current-debt analysis.

CVF-05 Report-type section leak
- Screening visible output no longer uses advanced underwriting/exclusion terms that trigger false report-type leak signals.
- Forbidden V2/full-underwriting surfaces remain collapsed.

CVF-06 Source reconciliation / rendered variance drift
- Screening and Acquisition Memo source-bound sections are preserved while unsupported advanced outputs remain omitted/qualified.

CVF-07 Optional/full-underwriting support depth constraints
- Optional/support documents now have cleaner context-only / limited-use treatment labels and should not block ordinary delivery when core docs are valid.

CVF-08 / CVF-09 Delivery/readiness alias drift
- Canonical deliverability now controls legacy compatibility/readiness aliases in the patched path.
- A canonical deliverable job should not simultaneously emit blocked/not-ready/publishable-false aliases.

CVF-14 OpenAI/provider/advisory failures
- Provider failures remain diagnostic-only when deterministic core parsing succeeds.

CVF-15 Optional-support/source-package/admin ops paths
- Support-doc treatment and advisory/distribution metadata remain internal/diagnostic/distribution-only rather than customer-delivery blockers.
```

Do not mark these as live-confirmed until the next fresh Screening and Acquisition Memo reports are generated and reviewed.

## Forbidden surfaces remain collapsed

The launch Screening Report and launch Acquisition Memo must still not render:

```text
current-debt DSCR analysis
refinance proceeds / refinance stability analysis
DCF
Discounted Cash Flow
waterfall
equity return
deal score
final recommendations
BUY / SELL / HOLD
```

The next live PDFs must be inspected for these exact leak classes.

## Next retest plan

Run only the clean retest batch:

```text
1. One fresh Screening Report using valid T12 + Rent Roll.
2. One fresh Acquisition Memo using valid T12 + Rent Roll + support docs.
```

For each report, capture/upload:

```text
PDF
analysis_artifacts_rows.json
report_contract_qa
source_report_coverage_qa
qa_action_plan
delivery_gate_decision / deliveryDecisionState
any Dashboard/Admin diagnostics if relevant
```

## Retest acceptance checklist

Screening must show:

```text
7-ish pages or better institutional density;
valid T12 + Rent Roll operating depth survives final PDF assembly;
Income Reconstruction / Operating Expenses / NOI / rent-roll sections visible where supported;
Data Coverage / Source Reliability visible;
no launch memo wording;
no DCF/waterfall/equity-return/deal-score/final-recommendation/current-debt DSCR/refi wording;
no unresolved tokens;
no thin one-card pages that look unfinished.
```

Acquisition Memo must show:

```text
materially full memo presentation;
one rent-positioning path, not duplicate summary blocks;
source treatment with filenames preserved plus clean role/treatment labels;
debt support disclosed as received/contextual/deferred, not modeled current-debt analysis;
purchase assumptions treated as acquisition context when supported;
property tax, environmental, market survey, CapEx, appraisal, broker/email roles clearly separated;
advanced financing/refinance/return-projection/recommendation modules deferred in customer-safe language;
no forbidden V2 surfaces;
no unresolved tokens;
no orphan headings / empty tables / one-box pages where avoidable.
```

Artifacts must show:

```text
canonical delivery allowed;
hold_delivery false;
delivery_gate_status deliverable / ready;
legacy aliases aligned with canonical deliverability;
provider/advisory failures diagnostic-only if deterministic core passed;
DocRaptor test mode distribution-only, not ordinary customer delivery blocker;
no customer-lifecycle needs_documents/publication_held/admin_review resurrection for core-valid jobs.
```

## Current instruction

Do not spend more Codex usage before the clean retest batch unless a local validation failure appears.

Do not run another audit before the retest.

Do not run messy/edge reports before reviewing the clean retest PDFs/artifacts.

Do not flip DocRaptor production mode yet.

Do not create public/Ken/sample links from the current reports yet.

---

# June 4, 2026 Addendum - Acquisition Memo Renderer Runtime Failures Classified Under CVF-13 / Root Stability Harness Added

## Current controlling status

The June 4 Acquisition Memo live failures are now classified in the Core-Valid Failure Path Family Ledger.

These failures were not CVF-01 or CVF-02 required-core document failures.

The uploaded source package had valid/parseable core documents:

```text
T12 parsed successfully.
Rent Roll parsed successfully.
```

The failures occurred after core parsing and during renderer/final HTML assembly.

Therefore the failures classify under:

```text
CVF-13 Runtime/storage/PDF/catastrophic render failure
```

## Live failures recorded

Two live Acquisition Memo runs failed during rendering:

```text
Acquisition Memo 3:
Cannot access 'rrUnits' before initialization

Acquisition Memo 4:
hasForwardLookingRenovationInputs is not defined
```

Interpretation:

- both failures were renderer/runtime variable-scope defects;
- neither failure was caused by bad T12 or bad Rent Roll input;
- neither failure should be treated as missing required source data;
- entitlement/credit restore was correct because true runtime/platform failure prevented safe report generation.

## Doctrine interpretation

CVF-13 remains a legitimate whole-report fail class when a true runtime/storage/PDF/catastrophic render failure prevents safe report generation.

However, preventable renderer-scope defects must be caught locally before live testing whenever possible.

Valid-core doctrine remains:

```text
Core-valid jobs publish unless true runtime/storage/PDF/catastrophic failure prevents safe generation.

Unsupported support documents collapse, qualify, omit, or render context-only.

Support-doc ambiguity must not become a required-core failure.
```

## Root cause class identified

Audit-only investigation identified the root class as:

```text
Acquisition Memo renderer-scope TDZ / missing render-context initialization
```

Pattern:

```text
New Acquisition Memo sections reached sideways into scattered late-bound locals instead of consuming one early safe render context object.
```

The prior test suite missed the class because it was too source-regex/helper-level and did not execute the actual `v1_core` final HTML assembly path with a realistic support-doc package.

## Root stability patch completed

A root runtime stability patch was completed.

Completed behavior:

- early Acquisition Memo render context added before section assembly;
- `rrUnits` / unit-count hazard resolved;
- `hasForwardLookingRenovationInputs` undefined hazard resolved;
- Acquisition Memo source-context/data-coverage sections now consume initialized/defaulted context;
- unstructured support docs fail soft / context-only instead of creating runtime risk.

Files changed:

```text
api/generate-client-report.js
tests/qa/generate-client-report-rent-roll-smoke.js
```

A real `v1_core` full-render smoke was added using `__test_return_final_html` and a Harbourstone-style support-doc fixture.

The smoke now executes the actual handler / final HTML assembly path far enough to catch:

```text
ReferenceError
TDZ crash
undefined render variables
unresolved {{TOKEN}} placeholders
```

## CVF-13 status note

CVF-13 remains legitimate, not deleted.

But the renderer-scope subclass exposed today should now be guarded by the full-render smoke harness before more live tests.

Expected future behavior:

```text
If a core-valid report fails because of true runtime/storage/PDF/catastrophic failure, fail closed and restore credit.

If the runtime issue is a preventable renderer-scope variable/scope defect, catch it in the full-render harness before live testing.
```

## Next verification

Next action is not another Codex patch.

Next action:

```text
Run one controlled live Acquisition Memo test in a fresh chat.
```

If the report publishes, inspect PDF quality and artifacts.

If it fails again with a renderer/runtime error, the full-render harness is still missing a production branch and must be expanded before additional live retries.

---

# June 2, 2026 Addendum - Doctrine Completion Checklist / Remaining Work To Make InvestorIQ Obey Doctrine End-to-End

## Current controlling decision

Yes: update the `.MD` files before this gets lost.

The P0 Core-Valid Failure Path families were closed by Slices 1-3, but InvestorIQ should not stop at "P0 closed" while known P1 doctrine edges remain mapped. The next work is doctrine-completion hardening, not random patching.

## Current doctrine target

InvestorIQ must obey this end-to-end:

```text
Bad uploads cannot generate.
Valid core jobs publish.
Unsupported sections self-heal.
Worker cannot resurrect old fail states.
Dashboard cannot blame usable docs.
Support/advisory/distribution issues stay internal.
Only true core failure or true runtime/PDF/storage failure can kill the report.
```

## Remaining work sequence from this checkpoint

### 1. Doctrine-completion patch: hard upload/server gate + P1 CVF cleanup

Patch before live retest:

- Screening Generate gate:
  - require valid/usable T12;
  - require valid/usable Rent Roll.
- Underwriting Generate gate:
  - require valid/usable T12;
  - require valid/usable Rent Roll;
  - require at least one supporting/deal document outside the required core docs.
- Server-side generate gate:
  - re-check the same rule so UI bypass cannot generate invalid jobs;
  - reject before report generation and before credit consumption wherever safely possible;
  - do not create failed-report lifecycle limbo for attempts that never satisfied the upload gate.
- CVF-07 cleanup:
  - optional/full-underwriting support-depth constraints must stay internal/distribution-only or section-level;
  - they must not block ordinary customer delivery when `core_valid_required_coverage === true`.
- CVF-15 cleanup:
  - optional-support/source-package/admin-op paths must stay diagnostic/internal/distribution-only;
  - they must not feed customer lifecycle, fail closed, or restore credit for core-valid jobs.

Important support-doc nuance:

```text
For Underwriting, at least one support doc is required to start generation.
But support docs are not quantitatively mandatory after that.
Bad or unsupported support docs after the gate is satisfied are section-level/internal/distribution-only issues.
They must not become required-core blockers once T12 + Rent Roll are valid.
```

### 2. Final no-code doctrine closure audit

After the doctrine-completion patch passes, run an audit-only confirmation.

Audit must prove:

- CVF-07 is closed or safe internal/distribution-only;
- CVF-15 is closed or safe internal/distribution-only;
- upload/server gate is enforced for Screening and Underwriting;
- `core_valid_required_coverage === true` cannot be overridden by optional/support/advisory/distribution issues;
- no known non-legitimate CVF remains open before live retest.

No code changes during this audit unless a real remaining P0/P1 doctrine edge is found.

### 3. Controlled live retests

Run in this order:

1. valid Screening job with T12 + Rent Roll;
2. valid Underwriting job with T12 + Rent Roll + support doc;
3. deliberate invalid-core case;
4. optional deliberate runtime/PDF/system failure case only if safe.

Live retest must prove:

- valid core jobs publish;
- invalid core docs fail closed or are blocked at the gate;
- runtime fatal shows neutral system-failure copy;
- no core-valid job shows source-package/rent-roll/missing-doc blame;
- no unsupported debt/refi/report-type surfaces leak into the PDF.

### 4. Artifact and PDF inspection after live tests

For valid Screening and Underwriting jobs, confirm artifacts show:

```text
core_valid_required_coverage: true
customer_delivery_allowed: true
hold_delivery: false
delivery_gate_status: deliverable / ready
no MISSING_REQUIRED_SOURCE_DATA
no entitlement_restored
no user_needs_documents customer lifecycle
no publication_held customer lifecycle
```

PDF inspection must confirm:

- no unsupported Current Debt DSCR leak;
- no unsupported refinance stress/proceeds table leak;
- no wrong report-type section leak;
- unsupported sections are omitted, qualified, disclosed, or Not Assessed.

### 5. Ledger/master-context update after live retest

If live retest passes, update statuses:

- `CVF-01`, `CVF-02`, `CVF-03`, `CVF-13` = legitimate failure paths preserved;
- `CVF-04`, `CVF-05`, `CVF-06` = closed + live-confirmed;
- `CVF-07` = closed or safe internal/distribution-only after doctrine-completion patch;
- `CVF-08`, `CVF-09`, `CVF-10` = closed + live-confirmed;
- `CVF-11`, `CVF-12` = closed + live-confirmed;
- `CVF-14` = safe internal/distribution-only;
- `CVF-15` = closed or safe internal/distribution-only after doctrine-completion patch.

### 6. Final public/customer polish sweep

Only after doctrine behavior is proven:

- replace contraction wording where touched, especially `You'll` -> `You will`;
- verify no customer-visible admin-review / under-review / publication-held wording;
- verify no stale upload-clearer-docs copy except true invalid core-doc cases;
- verify no weird report labels, unresolved tokens, mojibake, stale N/A blocks, public AI wording, or BUY/SELL/HOLD language;
- resolve DocRaptor production/public-sample distribution readiness separately from ordinary customer delivery.

### 7. Launch-readiness smoke

Final short run:

- `npm run build`;
- all targeted QA smokes touched by the doctrine-completion sequence;
- one Screening report;
- one Underwriting report;
- Dashboard customer card review;
- Admin artifacts/diagnostics review;
- PDF visual review.

## Definition of Done

InvestorIQ obeys doctrine when all of the following are true:

```text
1. Bad uploads cannot start generation.
2. Valid T12 + Rent Roll jobs publish.
3. Underwriting requires at least one support doc to start, but optional/support docs cannot later kill a core-valid report.
4. Unsupported current-debt/refi/report-type/support sections self-heal before delivery.
5. Worker cannot map core-valid section/support/advisory issues to MISSING_REQUIRED_SOURCE_DATA or entitlement restore.
6. Dashboard and failure-message copy cannot blame usable core docs.
7. Public-sample/high-value/DocRaptor/OpenAI/advisory issues stay internal or distribution-only.
8. Only true core failure or true runtime/storage/PDF/catastrophic failure can kill the whole report.
```

## Immediate next action

Give Codex the doctrine-completion patch prompt:

```text
Hard upload/server gate + remaining P1 CVF-07/CVF-15 cleanup.
```

Do not run controlled live retest until that patch and the follow-up no-code closure audit pass.

---

# June 2, 2026 Addendum - Core-Valid Failure Path Families Ledger / 15 P0-P1 Paths To Destroy

## Current controlling status

This addendum supersedes the earlier comfort language that the Publish-or-Fail Doctrine Lock was fully closed for launch purposes.

A live controlled Full Underwriting test proved that the system can still fail a whole report even after required core documents are valid:

- T12 parsed successfully.
- Rent Roll parsed successfully.
- Core T12 validation passed.
- Core Rent Roll validation passed.
- Additional support documents were available.
- The job still failed closed.
- Customer-facing copy incorrectly blamed source package / rent roll verification.
- Actual blocker class was section/render-contract drift, especially current-debt/refi surfaces.

Therefore the new controlling ledger target is:

```text
CORE-VALID REPORTS MUST PUBLISH.

If T12 + Rent Roll are parsed/validated, the report must publish unless there is:
1. true missing/unusable/unvalidated required T12;
2. true missing/unusable/unvalidated required Rent Roll;
3. true runtime/storage/PDF generation failure;
4. catastrophic render failure where no safe report shell can be produced.

Everything else must fail closed only at the section/line/surface level:
collapse, omit, qualify, mark Not Assessed, disclose, and emit diagnostics.
```

## New ledger name / working campaign name

Rename this active ledger/campaign from general Decision-Source Elimination to:

```text
InvestorIQ Core-Valid Failure Path Family Ledger
```

Suggested filename going forward:

```text
!!INVESTORIQ_CORE_VALID_FAILURE_PATH_FAMILY_LEDGER_2026-06-02.md
```

The original decision-source ledger remains historical/contextual, but the active launch blocker campaign is now the **15 Core-Valid Failure Path Families** below.

## Non-negotiable launch invariant

When `core_valid === true`:

- no customer-facing `user_needs_documents`;
- no customer-facing `needs_documents`;
- no customer-facing `publication_held`;
- no `MISSING_REQUIRED_SOURCE_DATA` for section-only/non-core issues;
- no whole-report fail for section-contained issues;
- no source-package/rent-roll/additional-documents blame copy;
- no entitlement restore for section-only/non-core/support-doc/public-sample/advisory issues;
- public-sample/high-value/DocRaptor/OpenAI/advisory blockers are distribution/internal metadata only;
- optional/support document parse failures cannot become failed required-core blockers;
- unsafe sections must not publish as unsafe surfaces; they must collapse/omit/qualify before delivery.

## 15 Core-Valid Failure Path Families

| Family | Files / functions from audit | Trigger / reason class | Scope | Current risk | Correct doctrine outcome | Priority |
|---|---|---|---|---|---|---|
| CVF-01 Core T12 parse failure | `api/parse/parse-doc.js`, `api/admin-run-worker.js` | `t12_parse_error`, `insufficient_t12_text_coverage`, `invalid_core_t12_values:*` | Screening + Underwriting | Legitimate whole-report fail when T12 is truly invalid | Fail closed + restore credit only when required T12 is truly missing/unusable/invalid | P0 legitimate |
| CVF-02 Core Rent Roll parse failure | `api/parse/parse-doc.js`, `api/admin-run-worker.js` | `rent_roll_parse_error`, `insufficient_rent_roll_text_coverage`, `insufficient_rent_roll_structure` | Screening + Underwriting | Legitimate whole-report fail when Rent Roll is truly invalid | Fail closed + restore credit only when required Rent Roll is truly missing/unusable/invalid | P0 legitimate |
| CVF-03 Financial scale mismatch after core parse | `api/admin-run-worker.js` | `DOCUMENT_FINANCIAL_SCALE_MISMATCH` | Both | Can fail whole report even after parse/validation passes | Disclose/qualify when core is otherwise valid; fail only when truly unreconcilable/incoherent beyond defensible use | P0 |
| CVF-04 Current-debt/refi render-contract drift | `api/_lib/report-contract-qa.js` | `CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT`, `CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT`, `UNSUPPORTED_CURRENT_DEBT_RENDERED`, `UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED` | Underwriting | Customer delivery blocker / whole-report fail cascade | Collapse/omit/qualify current-debt/refi/DSCR surfaces; publish core-valid report | P0 |
| CVF-05 Report-type section leak | `api/_lib/report-contract-qa.js`, `api/_lib/qa-action-plan.js` | `REPORT_TYPE_SECTION_LEAK`, `SCREENING_UNDERWRITING_SECTION_LEAK` | Screening + Underwriting | Can become customer delivery blocker / regeneration hold | Strip/collapse leaked section; publish core-valid report | P0 |
| CVF-06 Source reconciliation / rendered variance drift | `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js` | `RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH`, `RENT_ROLL_T12_RECONCILIATION_REQUIRED` | Both | Can become customer-blocking if promoted beyond disclosure | Disclose-only when core-valid; no source-package blame | P0 |
| CVF-07 Optional/full-underwriting support depth constraints | `api/_lib/source-report-coverage-qa.js`, `api/_lib/qa-action-plan.js` | `FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED`, `FULL_UNDERWRITING_SUPPORT_UNDERUSED`, `PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT`, `ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT` | Underwriting | Public/high-value blocker can be mispromoted into customer block | Internal/distribution-only or section collapse/qualification; ordinary customer delivery allowed | P1 |
| CVF-08 Delivery-gate hold-chain / legacy needs-doc conversion | `api/_lib/qa-action-plan.js` | `buildDeliveryGateDecision`, `buildCanonicalDeliveryDecisionState`, `resolveNeedsDocumentsReasonCode` mapping section-only blockers to `user_needs_documents` / `needs_documents` / `publication_held` | Both | Primary whole-report fail cascade for core-valid reports | Only core-invalid/runtime-fatal can block ordinary delivery; remove customer-facing hold lifecycle | P0 |
| CVF-09 Generator publication-held shim | `api/generate-client-report.js` | `assertValidReportPublicationInsert`, `buildDeliveryResponseCompatibilityAliases`, `delivery_gate_status === "user_needs_documents"` shim | Both | Blocks storage insert / returns `publication_held` | Publish core-valid reports after section collapse/qualification; no hold shim for section-only issues | P0 |
| CVF-10 Worker terminal failure / credit restore misclassification | `api/admin-run-worker.js` | `resolveWorkerDeliveryDecision`, `applyTerminalFailureOutcome(... MISSING_REQUIRED_SOURCE_DATA ...)` | Both | Maps misclassified hold into whole-report fail + entitlement restore | Restore credit only for true core-invalid or true runtime/storage/PDF fatal failures | P0 |
| CVF-11 Failure message builder source-package/rent-roll blame | `src/lib/jobFailureMessaging.js` | `classifyFailure`, `classifyMissingDocumentCategory`, `buildCustomerFailureMessage` mapping `MISSING_REQUIRED_SOURCE_DATA` into source-package/rent-roll copy | Both | Customer trust-killer copy even when core docs parsed | Copy keys only off true core-invalid vs runtime-fatal; never blame usable core docs | P0 |
| CVF-12 Dashboard customer status/copy fallback | `src/pages/Dashboard.jsx` | `resolveDashboardCustomerStatus`, `resolveDoctrineCustomerMessage`, `getFailedFileGuidance`, `normalizeDashboardCustomerStatusLabel` | Both | Can surface `needs_documents`, `publication_held`, additional-documents/source-package/rent-roll guidance | Display only canonical publish/fail-closed/system-failure customer outcomes; suppress needs-doc/held lifecycle | P0 |
| CVF-13 Runtime/storage/PDF/catastrophic render failure | `api/generate-client-report.js` | source-reconciliation guard failure, DocRaptor errors, upload failure, DB insert failure, missing storage path/reportId | Both | Legitimate whole-report fail even after core-valid | Keep fail-closed if true runtime/storage/PDF/render fatal; use system-failure copy only, not docs blame | P0 legitimate |
| CVF-14 OpenAI/provider/advisory failures | `api/_lib/qa-review.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-manager-review.js`, `api/_lib/qa-director-review.js`, `lib/openai-error-classifier.js` | `insufficient_quota`, billing/rate-limit/timeout/missing key/provider outage | Both | Should be internal only but dangerous if mispromoted downstream | Diagnostic/advisory only when deterministic core is valid; cannot block ordinary delivery | Safe-internal / monitor |
| CVF-15 Optional-support/source-package/admin ops paths | `api/_lib/source-package-qa.js`, `api/admin-run-worker.js`, `api/_lib/source-report-coverage-qa.js`, `api/admin/queue-metrics.js` | market survey, appraisal, environmental, renovation, property tax, mortgage/loan support, `supporting_docs_degraded`, public-sample blocker, admin/ops labels | Underwriting mainly; admin internal | Optional/support docs or admin labels can be misread/mispromoted as customer blockers | Internal/distribution/diagnostic only; optional sections collapse/qualify; admin ops labels must not feed customer lifecycle | P1 / safe-internal |

## P0 launch blocker grouping

The active P0 work is not “one more Underwriting bug.” It is a core-valid delivery doctrine failure family.

P0 groups to destroy:

1. **Core-valid delivery invariant**
   - Files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`
   - Destroy any path where section-only/non-core issues become whole-report fail, `user_needs_documents`, `publication_held`, or `MISSING_REQUIRED_SOURCE_DATA`.

2. **Section-contained render-contract handling**
   - Files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`
   - Debt/refi/report-type/source-reconciliation render problems must collapse/omit/qualify affected sections before delivery, not fail the report.

3. **Customer copy and Dashboard fallback correction**
   - Files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`
   - If core is valid, customer copy must never blame T12, Rent Roll, source package, missing documents, or additional documents.

4. **Optional/support/distribution blocker isolation**
   - Files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`
   - Optional support docs, public-sample readiness, high-value outreach readiness, DocRaptor test mode, and OpenAI/advisory failures must remain internal/distribution-only when deterministic core is valid.


## Execution rule - bundle path families by shared file cluster

When Codex begins implementation, do not patch one CVF row at a time if several rows share the same files, canonical owner, and invariant. To prevent this from taking the entire day, bundle **2-4 tightly related CVF families** per prompt only when they touch the same file cluster and share the same doctrine rule.

Approved grouping pattern:

1. **Delivery invariant cluster**
   - CVF-08, CVF-09, CVF-10
   - Files: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`
   - Shared invariant: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA/credit-restored because of non-core or section-only issues.

2. **Rendered section self-heal cluster**
   - CVF-04, CVF-05, CVF-06
   - Files: `api/_lib/report-contract-qa.js`, `api/generate-client-report.js`, `api/_lib/report-surface-contracts.js`, `api/_lib/source-report-coverage-qa.js`
   - Shared invariant: section-contained render-contract issues collapse/omit/qualify affected sections and do not fail core-valid reports.

3. **Customer copy cluster**
   - CVF-11, CVF-12
   - Files: `src/lib/jobFailureMessaging.js`, `src/pages/Dashboard.jsx`
   - Shared invariant: customer copy cannot blame source package, T12, Rent Roll, missing documents, or additional documents when core-valid is true.

4. **Optional/support/distribution isolation cluster**
   - CVF-07, CVF-14, CVF-15 plus DocRaptor/public-sample/high-value metadata behavior where surfaced through CVF-08
   - Files: `api/_lib/source-report-coverage-qa.js`, `api/_lib/source-package-qa.js`, `api/_lib/qa-action-plan.js`, advisory QA helpers
   - Shared invariant: optional/support/advisory/distribution blockers remain diagnostic or distribution-only and cannot block ordinary customer delivery when deterministic core docs are valid.

Do not bundle unrelated parser, renderer, worker, Dashboard, and support-doc families just to move faster. Bundling is allowed only when the same patch can enforce one shared invariant without broad refactor or drift.

## Required patch sequence from this checkpoint

Do not prompt Codex for random symptom patches. Use this sequence:

1. **Slice 1 - Core-valid delivery invariant**
   - `qa-action-plan.js`, `generate-client-report.js`, `admin-run-worker.js`, plus minimal customer-copy guard if needed.
   - Goal: core-valid jobs cannot become needs-doc/publication-held/MISSING_REQUIRED_SOURCE_DATA because of non-core/section-only issues.

2. **Slice 2 - Section self-heal/collapse for render-contract violations**
   - current-debt/refi/report-type/source-reconciliation section issues collapse/omit/qualify before delivery.
   - No unsafe debt/refi surface may publish.

3. **Slice 3 - Dashboard/failure messaging final customer-copy lock**
   - no source-package/rent-roll/additional-documents copy for core-valid section-only failures.
   - true core-invalid and true runtime/storage/PDF failures keep accurate fail-closed/system copy.

4. **Slice 4 - Optional/support/distribution isolation sweep**
   - optional support doc failures, market survey parsing, public-sample/high-value blockers, DocRaptor mode, OpenAI advisory failures cannot block ordinary customer delivery.

## Required regression proof

Every slice must prove:

- valid T12 + valid Rent Roll cannot be blamed;
- core-valid section-only issues do not whole-report fail;
- unsafe sections are not published as unsafe surfaces;
- `user_needs_documents`, `needs_documents`, and `publication_held` do not reach customer lifecycle/copy;
- public-sample/high-value/DocRaptor/OpenAI/advisory issues cannot block ordinary customer delivery;
- optional/support docs cannot become failed required-core documents;
- missing/unusable required T12/Rent Roll still fail closed + restore credit;
- true runtime/storage/PDF/catastrophic render failure still fails closed with system-failure copy.

## Supersession note

Older notes claiming no clear P0 launch blocker after G8 or that live regression alone was the next launch gate are superseded by this live Underwriting failure and the repo-wide 15-family audit.

Current launch gate:

```text
All P0 Core-Valid Failure Path Families must be patched or explicitly proven safe before more launch-readiness claims for Full Underwriting.
```

Screening remains cleaner, but because these delivery/copy paths are shared, the P0 core-valid invariant should be fixed across both Screening and Underwriting before launch confidence is restored.

## Fresh continuation point

Next action: give Codex Slice 1 only after this addendum is committed.

Do not run more live tests yet.
Do not start debt/refi rendering before the core-valid delivery invariant is patched.
Do not patch customer copy only while the delivery chain can still fail core-valid reports.


---

# InvestorIQ Decision-Source Elimination Ledger
## Controlling Status - May 28, 2026

Historical note: This file supersedes the prior Full Underwriting cleanup roadmap and is now the master decision-source elimination ledger for both Screening and Full Underwriting.

## DS Row Closure Standard
- A DS row may only be marked `CLOSED` if the old decision-maker can no longer override canonical truth.
- Every touched row must have one disposition:
- `DELETED`
- `NEUTERED / READ-ONLY CONSUMER`
- `CONVERTED TO QA CONTRACT`
- `LEGACY FALLBACK ONLY`
- `STILL OPEN`
- Rules:
- Adding a canonical helper is not enough to close a row.
- If legacy fallback remains, mark `PARTIAL`, not `CLOSED`.
- If renderer/worker/Dashboard can still override canonical state, row remains `OPEN` or `PARTIAL`.
- If QA still infers truth instead of canonical-vs-render conformance checking, row remains `OPEN` or `PARTIAL`.

## Section 1 - Executive Doctrine
- InvestorIQ must have ONE canonical decision authority per truth family.
- Renderer must become a read-only consumer.
- QA must become state-to-render conformance checking, not truth inference.
- Worker must consume canonical delivery/gate decisions, not reinterpret them.
- Dashboard must display canonical customer status/gate meaning, not recompute it from error codes.
- No tactical symptom patches.
- No report-specific hacks.
- No hardcoded property names, filenames, report IDs, or one-off fixture values.
- Tests are required but are not substitutes for production root-cause fixes.
- Screening and Full Underwriting both share this cleanup.
- Full Underwriting public self-serve remains paused.
- Screening-first launch remains possible but must be protected from shared decision-sprawl.

## Section 2 - Current Root Diagnosis
- The primary defect class is duplicate truth-makers / decision-sprawl.
- Contract QA catches important drift after render, but does not fully prevent render-time drift.
- Canonical helpers are not sufficient unless every consumer surface is forced to obey canonical state.
- The old root-class patch sequence improved quality but did not eliminate competing authorities.
- Strategy is now strict: inventory -> assign authority -> migrate consumers -> quarantine/delete duplicates.

## Section 2A - Today DS Status Update (May 28, 2026)

### June 1, 2026 Addendum - Clean Screening 7 Green Checkpoint / Live Validation Update
- Final Motherload Screening 7 (CLEAN) rerun passed and published.
- Clean Screening is GREEN for ordinary customer delivery.
- Report Contract QA passed with zero violations.

#### Live validation checkpoints recorded
1. Summary-only rent-roll surface behavior is validated live.
- `Summary Rent Positioning` no longer duplicates.
- Implied-average labels remain for summary-only mode.
- No weighted/rent-band row-level framing leaks in summary-only mode.
- `InvestorIQ estimates are document-backed...` wording is removed.

2. Deterministic text-summary rent-roll fallback validated live.
- `method: deterministic_text_summary`
- `total_units: 48`, `occupied_units: 46`, `vacant_units: 2`, `occupancy: 95.83%`
- `in_place_rent_annual: 1,036,800`, `market_rent_annual: 1,137,600`
- `ai_assisted: false`

3. T12 parsing validated live.
- `effective_gross_income: 1,036,800`
- `total_operating_expenses: 425,000`
- `net_operating_income: 611,800`
- `core_t12_validation.ok: true`

4. OpenAI/provider diagnostics taxonomy validated live.
- 429 quota failures normalize to `provider_error_class: insufficient_quota`.
- Validator rollup maps `insufficient_quota` under `platform_infrastructure_issue_codes`.
- Advisory/recovery provider failure does not block deterministic customer delivery when required core deterministic artifacts validate.

5. Delivery/readiness doctrine status unchanged.
- Customer delivery remains allowed for deliverable reports.
- DocRaptor test mode remains the current external/public/Ken/sample blocker only.
- `public_sample_ready` and `high_value_outreach_ready` remain blocked until DocRaptor production mode is enabled and verified.

#### DS sub-scope status notes (no broad over-closure)
- `DS-067`: deterministic rent-roll text-summary fallback sub-scope validated live; broader DS-067 remains `PARTIAL`.
- `DS-064`: Screening summary-only rent-roll render/surface sub-scope validated live; broader DS-064 remains `PARTIAL`.
- Delivery/readiness DocRaptor distribution-only behavior validated live as targeted sub-scope; broader delivery clusters remain governed by row closure standards.
- OpenAI/provider diagnostics taxonomy validated live as diagnostic/platform-infrastructure sub-scope; no broader DS-068/DS-069 over-closure implied.

#### Continuation point
1. Proceed to Messy Screening controlled live regression.
2. Handle DocRaptor production/public-sample config before external distribution readiness claims.

---

### June 1, 2026 Addendum - Clean Screening Regression Root Fixes / Parser Fallback / Delivery Gate Correction / Summary-Only Surface Patch / Core Parser Rejection Audit Installed
- Post-G8 controlled live regression surfaced a real parser->delivery->surface chain.
- Clean Screening initially failed closed because narrative rent-roll summary totals were usable but not accepted by deterministic non-tabular path; AI recovery returned non-OK/429.
- Worker fail-closed/credit-restore doctrine behaved correctly.

#### Completed June 1 root-fix sequence (post-G8 live-regression)
1. Deterministic rent-roll text-summary fallback added and hardened.
- Files: `api/parse/parse-doc.js`, `tests/qa/rent-roll-text-summary-fallback-smoke.js`
- Added deterministic summary-total acceptance for non-tabular rent roll text with strict coherence.
- Requires both rent-total families (in-place/current and market).
- Representative-only text rejects; no fabricated rows; no representative-row summation.
- Summary-total precedence fixed so controlling totals win over representative unit narrative values.

2. Delivery/readiness leakage correction.
- Files: `api/_lib/qa-action-plan.js`, `tests/qa/delivery-decision-state-smoke.js`
- Fixed canonical-vs-legacy alias precedence so `DOCRAPTOR_NOT_PRODUCTION_MODE` remains distribution-only.
- Ordinary customer delivery is not held when canonical gate says deliverable and no customer blockers exist.
- Public sample/high-value outreach can remain blocked in test mode.
- True customer blockers and typed gate holds remain unchanged.

3. Screening summary-only rent-roll surface eligibility/render patch.
- Files: `api/generate-client-report.js`, `tests/qa/generate-client-report-rent-roll-smoke.js`
- Summary-only rent roll (no verified unit rows/unit_mix) now suppresses empty unit-level framing.
- Replaced with summary-total positioning language and implied-average labels.
- Weighted labels/rent-band table preserved only for row-level support.
- Replaced stale heading `InvestorIQ Estimates` -> `Document-Backed Screening Outputs`.

4. Diagnostic safeguard in worker fail path.
- Files: `api/admin-run-worker.js`, `tests/qa/core-parser-rejection-audit-smoke.js`
- Added diagnostic-only `core_parser_rejection_audit` artifact when required core structured artifact is missing but extracted text exists.
- Deterministic text-signal findings identify likely parser miss vs insufficient evidence vs provider unavailable.
- No publish behavior change, no parsed artifact creation, no delivery doctrine change.

#### DS cluster status notes (closure nuance)
- `DS-067 parser recovery cluster`:
- Deterministic rent-roll text-summary fallback and summary-precedence sub-scopes are closed.
- Core parser rejection diagnostic safeguard sub-scope is closed.
- Broader DS-067 remains `PARTIAL` unless full cluster closure standard is met.

- `DS-068 worker status-machine cluster`:
- Diagnostic-only core parser rejection audit in fail path is added and closed as a sub-scope.
- No change to fail-closed doctrine, typed outcomes, or credit-restore semantics.
- Broader DS-068 remains governed by closure standard.

- `DS-047/DS-048/DS-050 delivery/readiness`:
- Canonical-over-legacy precedence fix for DocRaptor distribution-only blocker leakage is completed.
- Do not auto-mark broader rows `CLOSED` unless all row closure criteria are met; treat as targeted sub-scope closure where applicable.

- `DS-064 generator/render cluster`:
- Screening summary-only rent-roll surface eligibility/render sub-scope is closed.
- Broader DS-064 remains `PARTIAL` unless complete closure standard is satisfied.

#### Validation receipts (June 1)
- `rent-roll-text-summary-fallback-smoke` passed.
- `t12-rent-roll-diagnostics-regression` passed where run.
- `delivery-decision-state-smoke` passed.
- `admin-run-worker-gate-smoke` passed.
- `generate-client-report-rent-roll-smoke` passed.
- `core-parser-rejection-audit-smoke` passed.
- `git diff --check` passed with CRLF warnings only.

#### Immediate continuation point
- Pause live testing until doc checkpoint + fresh chat reset.
- Next:
1. rerun same Clean Screening and red-pen latest PDF surface;
2. separate OpenAI 429/insufficient_quota diagnostics readiness pass (error-body capture clarity, model/retry/backoff diagnostics, no secret exposure).

#### Do not overclaim
- Do not claim all DS rows globally closed.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public sample readiness.

### May 30, 2026 Addendum - G8 Delivery/UI Lifecycle Authority Materially Closed / Grouped Campaign Checkpoint
- G8 is materially closed.
- G8A-02 seam in `api/admin-run-worker.js` is closed.
- Worker publish path now requires resolved delivery permission:
  - `holdDelivery === false`
  - `customerDeliveryAllowed === true`
- Typed outcomes remain preserved:
  - `user_needs_documents` fail-closed/restore path
  - `admin_review_required` held publishing/admin-held path
- Fail-closed and credit-restore safety behavior remains preserved.

#### Post-patch audit verdict
- Audit-only verification completed.
- No material remaining delivery/UI duplicate truth-maker was found across worker lifecycle, Dashboard customer status/message surfaces, AdminDashboard triage surfaces, and generator delivery compatibility aliases.
- Dashboard remains canonical-first for `customer_status_label`/`customer_message` when canonical state exists.
- Legacy display/copy fallback remains canonical-absent compatibility only.
- AdminDashboard remains display/diagnostic/emergency-action only, not customer delivery authority.
- `public_sample_ready` and `high_value_outreach_ready` remain distribution metadata, not ordinary customer delivery authority.

#### Grouped campaign status update
- Completed/materially closed:
  - Patch 1/1B
  - Patch 2
  - G4
  - G1
  - G2
  - G5
  - G6
  - G7
  - G8
- Remaining grouped batches in current G1-G8 sequence:
  - None

#### Fresh-Chat Continuation Prompt
We resume after G8 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7, G8.

Next step: either controlled live regression checkpoint or targeted post-launch polish selection.

Guardrails unchanged:
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded IDs/filenames
- no new API/serverless routes casually
- renderer consumes canonical state
- QA conformance only

#### Do not overclaim
- Do not claim all DS rows globally closed unless row closure standards are satisfied.
- Do not claim Full Underwriting public self-serve launch-ready.
- Do not claim Ken/public samples are ready.
### May 30, 2026 Addendum - G7 Action-Plan Consumer Demotion Materially Closed / G8 Remains Next
- Campaign status update: G7 is now materially closed after Slices 1, 2A, 2B, and Slice 3 closure audit.
- Completed/materially closed grouped sequence:
  - Patch 1/1B
  - Patch 2
  - G4
  - G1
  - G2
  - G5
  - G6
  - G7
- G7 closure details:
  - Slice 1: `buildQaActionPlan(...)` now consumes canonical delivery state when present; legacy synthesis is canonical-absent fallback only.
  - Slice 2A: `buildPublishEligibilitySummary(...)` now consumes canonical delivery state when present; local blockers/advisories/regeneration/source-limitation fields remain diagnostic metadata under canonical-present authority.
  - Slice 2B: `buildDeliveryGateDecision(...)` now accepts `deliveryDecisionState`, `canonicalDeliveryDecisionState`, `delivery_gate_decision`, and `deliveryGateDecision`; canonical-present paths mirror canonical truth for delivery/readiness fields.
  - `public_sample_ready` and `high_value_outreach_ready` mirror canonical only when explicitly present; otherwise safe distribution metadata fallback remains.
  - Legacy gate-owner behavior remains only when canonical delivery state is absent.
  - Slice 3 closure audit: audit-only, no files changed, no material residual duplicate-authority leak in G7 scope.
- Remaining grouped batch:
  - `G8 - Delivery/UI Lifecycle Follow-up`
- Next recommended task:
  - G8 audit only, unless Rob explicitly chooses controlled live regression first.
- G8 must remain micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby constraints.
- Supersession note: prior top-note guidance that G7 remained next/open is superseded by this G7 closure update.
- Do not claim all DS rows are closed.
- Do not claim Full Underwriting public self-serve launch-ready.
### May 30, 2026 Addendum - G1/G2/G5/G6 Materially Closed / Pause Before G7-G8
- Campaign checkpoint status: grouped cleanup is paused intentionally due to low Codex usage.
- Completed/materially closed sequence in this campaign:
  - Patch 1/1B
  - Patch 2
  - G4
  - G1
  - G2
  - G5
  - G6
- Remaining grouped batches:
  - `G7 - Action-Plan Consumer Demotion`
  - `G8 - Delivery/UI Lifecycle Follow-up`
- Do not start G7/G8 in this paused checkpoint.
- Next recommended task on resume: G7 audit only, unless Rob explicitly chooses controlled live regression first.

#### Sequence Recorded As Completed/Committed
- Patch 1/1B
  - Parser current-debt support routing and downstream loan-term promotion aligned.
  - Explicit non-acquisition current-debt terms route/promote as current debt.
  - Acquisition/proposed financing remains separated.
  - Standalone LTV no longer creates acquisition/proposed classification by itself.
- Patch 2
  - `resolveReportTypeAndTier(...)` added.
  - Explicit unknown `report_type` fails closed with `400 Invalid report_type`.
  - Underwriting aliases normalize to underwriting/tier 2/v1_core.
  - Screening default remains only when no explicit type is provided.
- G4
  - Source-report-coverage QA canonical-first depth/signal guard sweep completed.
  - Rendered/file/artifact signals are conformance/evidence only when canonical state exists.
  - Full Underwriting depth conformance is based on canonical section-family expectations, not raw page count.
- G1 materially closed
  - Slice 1: operating statement, renovation, document sources canonicalization.
  - Slice 2: debt tables, DCF table, risk matrix, DCF summary, narrative strip canonicalization.
  - Slice 3: late `reportTier === 1` strip cascade guarded by canonical report intent.
  - Closure audit: early `effectiveReportMode === "screening_v1"` cascade remains residual/contained (`G1C-02` watch item only).
  - Do not patch `G1C-02` unless future live regression proves actual mode mismatch.
- G2 materially closed
  - Slice 1: `normalizeVisibleReportClassification(...)` is mode-aware; screening debt-cap leakage blocked; underwriting canonical caps preserved.
  - Slice 2: Screening stress-summary/framework/rationale consumers now use canonical/final visible label.
  - `screeningClass` remains fallback/evidence only, not final visible authority.
  - Deferred polish only: CSS stale aliases, Data Coverage wording nuance, historical Deal Scorecard threshold note.
- G5 materially closed
  - Slice 1: `resolveCanonicalCurrentDebtStateForQa(...)` provenance-locked; `hasCanonicalCoverageAuthority(...)` explicit-provenance only.
  - Slice 2: `inferCanonicalVerdictCapState(...)` provenance-gated.
  - Explicit verdict/classification state remains highest authority.
  - Remaining G5 scope is regex/taxonomy wording polish and non-authority conformance tuning only.
- G6 materially closed
  - Slice 1: rendered acquisition phrase removed as canonical acquisition authority; rendered section heading removed as canonical section-eligibility authority.
  - Final sweep:
    - `buildCurrentDebtAssessmentState(...)` no longer allows QA inventory booleans to create debt truth, DSCR, or refi eligibility.
    - `normalizeReconciliationVariance(...)` no longer lets deterministic parser/artifact flags escalate material variance to parser/admin/customer-blocking status.
    - `buildCanonicalVisibleClassificationState(...)` gates debt-coverage caps to Underwriting/tier 2 mode.
    - Screening cannot emit `Review - Debt Coverage Constraint` from debt flags or not-assessed debt.
  - No new G6 authority leak surfaced in final sweep scope.

#### Grouped Batch Map Update
- `G1` status: materially closed, with residual `G1C-02` watch item only.
- `G2` status: materially closed; polish deferred.
- `G5` status: materially closed; non-authority polish deferred.
- `G6` status: materially closed.
- `G7` status: materially closed after Slices 1, 2A, 2B, and Slice 3 closure audit.
- `G8` remains.
- `G8` must remain micro-sliced due to worker/dashboard lifecycle risk and Vercel Hobby constraints.

#### Fresh-Chat Continuation Prompt
We resume after G7 material closure.

Completed/materially closed: Patch 1/1B, Patch 2, G4, G1, G2, G5, G6, G7.

Remaining: G8 - Delivery/UI Lifecycle Follow-up.

Codex usage was low, so work paused intentionally.

Next recommended task: G8 audit only, unless Rob explicitly chooses controlled live regression first.

Guardrails remain:
- micro-prompts
- no broad refactors
- no report-specific hacks
- no hardcoded property names/filenames/report IDs
- no public AI wording
- no BUY/SELL/HOLD
- no new Vercel API/serverless routes casually
- renderer consumes canonical state
- QA is conformance only
- action plan consumers must not re-infer truth
- lifecycle/UI consumers in G8 must not reinterpret canonical delivery state

### May 30, 2026 Addendum - Grouped Decision-Source Elimination Process Adopted / Patch 1B + Patch 2 + G4 Complete
- InvestorIQ is no longer patching individual test reports or isolated symptoms.
- Live report failures identify root families, then fixes remove or demote the repo-wide decision-source class.
- The ~132 decision-source findings now run through controlled grouped batches.
- Larger grouped patches are allowed only when findings share:
  - same file or very small file cluster
  - same canonical owner
  - same invariant
  - same failure mode
  - same regression strategy
- Random cross-family 15-20 item patches remain prohibited.
- Tests must prove generalized invariants, not one fixture.
- Renderer must consume canonical truth.
- QA may detect canonical-vs-render mismatch but must not create financial/report truth.
- Parser/canonical-owner slices remain smaller where acquisition/current-debt or semantic-classification risk is high.

#### Grouped Batch Map (Controlling Next-Work Map)
- `G1 - Generator Section Strip Canonicalization`
  - Findings: generator strip/mutation authority leaks.
  - Files: primarily `api/generate-client-report.js`.
  - Invariant: when canonical section/data coverage state exists, renderer cannot override via local strip/phrase heuristics.
  - Next after G4.
- `G2 - Generator Classification/Coverage Consumer Cleanup`
  - Files: primarily `api/generate-client-report.js`.
  - Invariant: headline/classification labels consume canonical state; fallback only when canonical absent.
- `G3 - Parser Financing Route & Promotion Consistency Sweep`
  - Files: primarily `api/parse/parse-doc.js`.
  - Invariant: explicit non-acquisition current-debt terms stay debt-eligible; acquisition/proposed never promotes to current debt.
  - Note: Patch 1/1B completed the immediate current-debt support routing/promotion sub-scope.
- `G4 - Source-Coverage QA Canonical-First Depth/Signal Guard Sweep`
  - Files: `api/_lib/source-report-coverage-qa.js`.
  - Invariant: rendered/file/artifact signals are conformance/fallback-only under canonical-present authority.
  - Status: completed and committed.
- `G5 - Report-Contract QA Provenance + Conformance Sweep`
  - Files: `api/_lib/report-contract-qa.js`.
  - Invariant: regex/html evidence detects drift only; canonical/provenanced state defines truth.
- `G6 - Surface-Contracts Canonical Owner Hardening`
  - Files: `api/_lib/report-surface-contracts.js`, `api/_lib/full-underwriting-state.js`.
  - Invariant: single owner for debt/eligibility/reconciliation/full-underwriting composite state.
- `G7 - Action-Plan Consumer Demotion`
  - Files: `api/_lib/qa-action-plan.js`.
  - Invariant: action plan consumes canonical/QA findings and does not re-infer truth.
- `G8 - Delivery/UI Lifecycle Follow-up`
  - Files: `api/admin-run-worker.js`, `src/pages/Dashboard.jsx`.
  - Invariant: lifecycle/status consumers honor canonical delivery decision.
  - Must stay micro-sliced.

#### Patch 1 / 1B Completed (Committed)
- Files:
  - `api/parse/parse-doc.js`
  - `tests/qa/current-debt-support-routing-smoke.js`
- Fixed current-debt support routing and downstream loan-term promotion.
- Added/used `resolveLoanTermCurrentDebtPromotion(...)`.
- Explicit non-acquisition debt terms now route to `loan_term_sheet` and promote current-debt aliases.
- Current-debt aliases include:
  - `current_outstanding_balance`
  - `current_loan_balance`
  - `debt_basis: existing_mortgage_debt`
- Acquisition/proposed financing remains separated and does not promote current-debt aliases.
- Standalone LTV no longer creates acquisition/proposed classification by itself.
- Scope remained parser-only plus focused smoke test.

#### Patch 2 Completed (Committed)
- Files:
  - `api/generate-client-report.js`
  - `tests/qa/report-type-normalization-smoke.js`
- Added `resolveReportTypeAndTier(...)`.
- Closed silent explicit-unknown report-type downgrade path.
- Explicit unknown `report_type` now fails closed with `400 Invalid report_type` instead of defaulting to Screening/tier 1.
- Valid underwriting aliases normalize to underwriting/tier 2/v1_core:
  - `full_underwriting`
  - `full-underwriting`
  - `underwriting_report`
  - `underwriting_v1`
  - `tier_2`
  - `tier2`
- Screening default remains only when no explicit type is provided.

#### G4 Completed (Committed)
- Batch: `G4 - Source-Coverage QA Canonical-First Depth/Signal Guard Sweep`
- Files:
  - `api/_lib/source-report-coverage-qa.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
- Added/strengthened:
  - `CURRENT_DEBT_CANONICAL_RENDER_STATE_DRIFT`
  - `ACQUISITION_CURRENT_DEBT_CANONICAL_CONFORMANCE_DRIFT`
  - `UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE`
- Canonical-present underwriting paths now treat rendered debt/acquisition signals as conformance evidence only.
- Rendered "not assessed" debt wording can flag drift but cannot downgrade canonical computed debt.
- Rendered debt/acquisition phrasing can flag drift but cannot promote/redefine acquisition/current-debt truth.
- Fallback artifact/rendered truth-making remains only in canonical-absent branches.
- Full Underwriting thin-depth detection uses canonical section-family expectations plus rendered section-family evidence, not raw page count.
- Debt omission is allowed when canonically source-constrained and clear limitation disclosure is rendered.
- No fake DSCR/refi math is required when current debt is not assessed.
- Screening does not trigger Full Underwriting depth mismatch.

#### Current Next Step
- Next batch: `G1 - Generator Section Strip Canonicalization`.
- Reason: G4 installed the alarm/conformance layer; G1 now addresses the generator strip/mutation machinery that can still physically collapse/remove sections despite canonical state.

#### Supersession / Launch Gate Note
- The prior "live regression is next" note is superseded by the grouped decision-source process until at least G1 is addressed.
- Live regression remains required before Full Underwriting launch readiness.
- Immediate next step is G1 because grouped audit sequencing identified generator strip/mutation authority as the next safest/highest-impact batch.
- Full Underwriting public self-serve remains paused.
- Controlled regeneration should wait until grouped sequencing reaches the agreed checkpoint.

### May 30, 2026 Addendum - Batch 6 DS-064/065/066 Launch-Risk Compression Complete / Controlled Launch Acceptable With Monitoring
- Batch 6 status: `CLOSED WITH KNOWN BROADER FOLLOW-UP`.
- Batch 6 materially hardened the DS-064 / DS-065 / DS-066 generator/rendered-regex/QA provenance cluster.
- Full DS-064/DS-065/DS-066 ledger closure is not required before controlled launch.
- Remaining DS-064/DS-065/DS-066 work is P1/P2 hardening unless live regression exposes a launch-blocking issue.
- The next launch gate is live regression, not full ledger closure.

#### Batch 6B - Canonical State Propagation + Provenance Guard Hard-Lock
- Addressed: `B6A-064-03`, `B6A-066-01`, `B6A-066-02`, and partially tightened `B6A-065-01` / `B6A-065-02`.
- Files changed:
  - `api/generate-client-report.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `api/_lib/report-contract-qa.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Result:
  - generator now passes canonical states into source-report-coverage QA.
  - source-report-coverage QA now emits `authority_provenance` and canonical/fallback state source markers.
  - report-contract QA no longer treats fallback-derived current debt state as canonical authority.

#### Batch 6B-Proof - Runtime Behavioral Proof Hardening
- Source-level assertions were supplemented with runtime behavioral proof.
- Proven:
  - canonical-present source coverage behavior.
  - canonical-absent fallback behavior.
  - report-contract canonical/fallback current-debt DSCR provenance behavior.
  - generator canonical-state helper propagation behavior.
- Note: one lightweight generator source-level backup assertion remains acceptable because full runtime interception of the internal call path would require broader harness instrumentation.

#### Batch 6C - DS-064 Residual Renderer Strip/Mutation Cleanup
- Addressed: `B6A-064-01`, `B6A-064-02`.
- Files changed:
  - `api/generate-client-report.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Result:
  - `SECTION_4_NEIGHBORHOOD` and `SECTION_4_LOCATION_TABLE` now route through canonical `market_context` section visibility when canonical state exists.
  - Data Coverage `DATA NOT AVAILABLE` phrase-count suppression is now legacy fallback only and cannot override canonical Data Coverage authority.
  - Runtime/helper behavioral proof was added.

#### Batch 6D - Closure Audit
- Audit-only.
- Verdict: `CLOSED WITH KNOWN BROADER FOLLOW-UP`.
- Found:
  - `B6D-065-01`: report-contract QA coverage authority could still be object-presence based.
  - `B6D-065-02`: report-contract QA current_debt_state promotion still needed stricter provenance.
  - `B6D-066-01`: source-report-coverage QA sufficiency authority needed to include explicit sectionEligibility.
  - `B6D-064-01`: `SECTION_11_FINAL_RECS` final recommendation section was still local-narrative gated.
- Recommendation: split QA provenance hardening from final recommendation section guard.

#### Batch 6E - QA Provenance Guard Tightening
- Addressed: `B6D-065-01`, `B6D-065-02`, `B6D-066-01`.
- Files changed:
  - `api/_lib/report-contract-qa.js`
  - `api/_lib/source-report-coverage-qa.js`
  - `tests/qa/report-contract-qa-smoke.js`
  - `tests/qa/source-report-coverage-qa-smoke.js`
- Result:
  - `hasCanonicalCoverageAuthority(...)` now requires explicit provenance authority flags.
  - `resolveCanonicalCurrentDebtStateForQa(...)` no longer promotes fallback/unprovenanced `current_debt_state` to canonical truth.
  - `fallback_reconstructed` current debt is explicitly non-canonical.
  - explicit `sectionEligibility` now participates in source-report-coverage canonical coverage/sufficiency authority.
  - Runtime behavioral tests prove canonical/provenanced vs fallback/unprovenanced behavior.

#### Batch 6F - DS-064 Final Recommendation Canonical Guard
- Addressed: `B6D-064-01` and DS-064 residual renderer mutation hardening sub-scope for `SECTION_11_FINAL_RECS`.
- Files changed:
  - `api/generate-client-report.js`
  - `tests/qa/generate-client-report-rent-roll-smoke.js`
- Result:
  - `SECTION_11_FINAL_RECS` is no longer gated only by local `finalRecommendation` narrative presence.
  - Added canonical-first resolver `resolveFinalRecommendationSectionVisibility(...)`.
  - Supported canonical keys: `final_recommendation`, `final_recommendations`, `final_recs`.
  - Canonical eligible/rendered keeps the section even when local fallback would strip.
  - Canonical omitted/source_constrained strips the section even when local fallback would keep.
  - Canonical absent preserves legacy local narrative fallback.
  - Runtime helper-level behavioral tests were added.

#### Launch-Risk Compression Audit
- Current launch-readiness summary: `Controlled launch acceptable now with monitoring`.
- No clear P0 remaining from the sweep.
- No current canonical-present path was found that plausibly reintroduces false debt/refi math, acquisition-as-current-debt contamination, or wrong customer delivery decision.
- Full ledger closure is no longer required before controlled launch.
- Remaining DS-064/DS-065/DS-066 work is P1/P2 hardening unless live regression proves otherwise.
- Live regression is now the launch gate.

#### Supersession Note
- Older notes saying Full Underwriting must wait for full decision-source closure are superseded to the extent that the latest launch-risk compression audit says controlled launch is acceptable with monitoring if live regression passes.
- This does not mean Full Underwriting is fully public self-serve launch-ready before live regression passes.
- This does not mean all DS rows are closed.
- Historical caution remains preserved as history.

#### Current Next Step
- Run live regression set:
  1. Clean Screening
  2. Messy Screening
  3. Clean Underwriting
  4. Messy Underwriting
  5. Acquisition/current-debt edge case
- For each regression, capture:
  - PDF/report output
  - analysis artifacts
  - report_contract_qa
  - source_report_coverage_qa
  - qa_action_plan
  - Dashboard/Admin Diagnostics evidence if relevant
- Validation checklist:
  - no false limitation headline
  - Screening does not leak underwriting sections
  - acquisition/proposed financing never treated as current debt
  - DSCR/refi suppressed when current debt is not assessed
  - current-debt/refi math only appears with verified current debt basis
  - Data Coverage headline/severity obeys canonical state
  - support docs are not used quantitatively unless canonical state supports it
  - visible classification aligned across surfaces
  - no prohibited public language
  - no internal parser/admin/vendor artifacts
  - no unresolved tokens, `DATA NOT AVAILABLE` placeholders, mojibake, or awkward N/A metric leaks

### May 29, 2026 Addendum - Batch 5 Section Eligibility / Data Coverage / QA Conformance Authority Closed With Broader Cluster Follow-Up
- Batch 5 status: `CLOSED WITH KNOWN BROADER CLUSTER FOLLOW-UP`.
- Batch 5B hard-locked generator rendering to canonical-first authority for Data Coverage headline/severity and section eligibility gating.
- Batch 5C hard-locked source-report-coverage QA to canonical-first conformance behavior when canonical state exists; rendered sections/signals are evidence-only in canonical-present paths.
- Batch 5D hard-locked report-contract QA to canonical-first conformance behavior for coverage/section/debt/acquisition checks while preserving real contradiction detection.
- Batch 5E closure audit found final renderer leak `F-5E-01`: unconditional `SECTION_4_NEIGHBORHOOD` strip could bypass canonical section eligibility.
- Batch 5F fixed `F-5E-01` by replacing unconditional neighborhood strip with canonical-guarded `market_context` decision via `shouldRenderCanonicalSection(...)`, preserving canonical-absent fallback behavior.
- Behavioral proof standard was enforced across Batch 5 sub-batches: production authority fix plus runtime behavioral proof in the same PR scope.
- Batch 4 DS-029 acquisition/current-debt separation invariant remained preserved during Batch 5C/5D (and was not reopened).
- Family-level follow-up remains: broader DS-064/DS-065/DS-066 rendered/regex/generator mutation cluster closure sweep.

### Batch 1 / 1A Classification
- DS-004: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` path not applicable (canonical helper retained), but family not fully closed until all renderer/QA override paths are eliminated.
- DS-005: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` downstream migration in progress; canonical owner exists but not all consumers are hard-locked.
- DS-006: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator now routes toward canonical state, fallback path still exists.
- DS-007: `PARTIAL` - disposition `LEGACY FALLBACK ONLY`; scorecard HTML alignment remains adaptation path.
- DS-008: `PARTIAL` - disposition `CONVERTED TO QA CONTRACT`; conformance improved, regex fallback still present.
- DS-009: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; scoring remains mixed path where visible classification interactions are only partially neutralized.
- DS-010: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER` migration in progress; canonical metadata path exists, family still has fallback paths.

### Batch 2A Delivery Decision State Shape
- DS-047: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; mapped into canonical deliveryDecisionState, legacy readiness aliases still emitted for compatibility.
- DS-048: `PARTIAL` - disposition `NEUTERED / READ-ONLY CONSUMER`; canonical gate owner retained, but downstream consumer lock-in not complete.
- DS-049: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator compatibility aliases are derived from canonical `deliveryDecisionState` and cannot independently recompute readiness when canonical state exists.

### Batch 2B / 2B.1 Worker Consumption
- DS-050: `CLOSED` (deliveryDecisionState consumption scope) - disposition `NEUTERED / READ-ONLY CONSUMER`; worker resolver enforces canonical-first precedence for gate status, customer delivery allowed, hold delivery, and credit restore. Legacy top-level fields are fallback-only when canonical state is absent.
- DS-068: `PARTIAL` - disposition `STILL OPEN`; only deliveryDecisionState consumption slice addressed, broader worker status-machine cluster remains.

### Batch 2C Dashboard Bridge
- DS-059: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; customer-facing status surfaces now prefer canonical `customer_status_label` when present, with legacy mapping fallback-only.
- DS-060: `CLOSED` - disposition `LEGACY FALLBACK ONLY`; canonical `customer_message` is authoritative when present, and needs-doc/message fallback is non-authoritative fallback-only.
- DS-061: `CLOSED` - disposition `LEGACY FALLBACK ONLY`; failed-file guidance is suppressed when canonical `customer_message` exists and remains fallback-only for older/non-canonical jobs.
- DS-069: `PARTIAL` - disposition `STILL OPEN`; canonical bridge exists, broader Dashboard/customer messaging consolidation remains open.

### Batch 2E / 2F Delivery Hard-Lock
- DS-052: `CLOSED` - disposition `CONVERTED TO QA CONTRACT`; report-contract QA resolves canonical delivery state first and treats legacy readiness aliases, `qaFixRouting`, and source coverage readiness payloads as conformance inputs only when canonical state exists. Closure proof: `report-contract-qa-smoke.js` canonical delivery conflict cases.
- DS-049: `CLOSED` - disposition `NEUTERED / READ-ONLY CONSUMER`; generator compatibility aliases are derived from canonical `deliveryDecisionState` through `buildDeliveryResponseCompatibilityAliases(...)`. Legacy aliases remain compatibility outputs and cannot independently recompute readiness when canonical state exists. Closure proof: `delivery-decision-state-smoke.js`.
- DS-050: `CLOSED` (deliveryDecisionState consumption scope) - disposition `NEUTERED / READ-ONLY CONSUMER`; worker resolver applies strict canonical-first precedence for delivery gate status, customer delivery allowed, hold delivery, and credit restore. Legacy top-level fields are used only when canonical state is absent and cannot override canonical state. Closure proof: `admin-run-worker-gate-smoke.js`.
- DS-068: `PARTIAL`; broader worker status-machine cluster is not fully closed, even though deliveryDecisionState consumption sub-scope is hard-locked.

### Batch 2 Consolidated Completion Update - Delivery / Readiness Authority
- Batch 2 materially hard-locked delivery/readiness propagation across generator, worker, contract QA, and Dashboard.
- `deliveryDecisionState` is the canonical delivery/customer state object for downstream consumers.
- Generator aliases are compatibility/read-only outputs derived from canonical `deliveryDecisionState`.
- Worker delivery gate consumption is canonical-first.
- Worker terminal fail/restore mechanics now route through `applyTerminalFailureOutcome(...)` and `restoreEntitlementForFailedJob(...)`.
- Dashboard customer status/message/guidance now uses canonical `customer_status_label`/`customer_message` when present.
- report-contract QA now treats delivery readiness as canonical-vs-render/payload conformance, not independent truth.
- Legacy fallback remains only for older/non-canonical jobs where explicitly retained.
- DS-049: `CLOSED`
- DS-050: `CLOSED`
- DS-051: `CLOSED`
- DS-052: `CLOSED`
- DS-059: `CLOSED`
- DS-060: `CLOSED`
- DS-061: `CLOSED`
- DS-068: `PARTIAL`
- DS-069: `PARTIAL`
- Broader cluster rows DS-068 and DS-069 remain `PARTIAL` because full worker lifecycle and Dashboard legacy fallback architecture are not completely eliminated.

### Batch 3 Consolidated Completion Update - Current Debt / Refi Authority
- Current debt/refi customer-facing truth is now controlled by canonical current-debt state and canonical refi render/basis state where canonical payload exists.
- Scorecard DSCR no longer backfills numeric DSCR from legacy mortgage/debt fallback when canonical current debt is not computed.
- Legacy mortgage fallback is retained only as canonical-absent compatibility.
- Refi basis/render-state/narrative mode are canonical-gated and cannot upgrade not-assessed/source-limited/acquisition-only state into quantitative refi/current-debt math.
- Report-contract QA now treats rendered DSCR extraction as evidence-only and compares rendered debt/refi surfaces against canonical state.
- QA artifact/inventory debt heuristics are retained only for canonical-absent fallback and cannot override canonical current-debt payload.
- DS-021 remains `PARTIAL` as canonical owner/root authority, while downstream override rows DS-022 through DS-027 are closed.
- DS-021: `PARTIAL`
- DS-022: `CLOSED`
- DS-023: `CLOSED`
- DS-024: `CLOSED`
- DS-025: `CLOSED`
- DS-026: `CLOSED`
- DS-027: `CLOSED`

### Batch 4 Consolidated Completion Update - Acquisition / Current Debt Separation Authority
- Batch 4 status: `CLOSED WITH KNOWN BROADER DS-067 FOLLOW-UP`.
- No single remaining Batch 4 acquisition/current-debt authority leak was found in closure audit.
- Residual risk belongs to broader DS-067 parser-cluster cleanup, not an immediate Batch 4 authority regression.
- DS-021 was not reopened.
- DS-029: `CLOSED` (acquisition/current-debt authority in source-report-coverage QA sub-scope).
- DS-030: `CLOSED` (report-contract QA acquisition/current-debt authority and acquisition value/fee conformance sub-scope).
- DS-067: `PARTIAL` (loan-term financing-route and alias-gating sub-scopes closed; broader parser-cluster semantic/fallback consistency remains open).

## Remaining High-Risk Families
1. Broader Dashboard legacy fallback/messaging architecture for older/non-canonical jobs
2. Acquisition vs current debt separation authority
3. Broader DS-064/DS-065/DS-066 rendered/regex/generator mutation cluster closure sweep
4. QA rendered-text inference that should become conformance checks
5. Broader parser-cluster fallback/semantic consistency follow-up (DS-067)

Delivery/readiness note: Generator aliasing, worker delivery consumption, worker terminal failure/restore mechanics, Dashboard customer messaging, and report-contract QA delivery conformance are now hard-locked to canonical delivery decision state where canonical payload exists. Remaining Batch 2 risk is DS-068/DS-069 broader architecture only.
Batch 2 risk note: Batch 2 customer-facing override risk is materially reduced; DS-069 remains a broader fallback architecture cluster, not an active canonical override when `deliveryDecisionState`/`customer_message` exists.
Batch 3 risk note: Batch 3 customer-facing current-debt/refi override risk is materially reduced. Remaining acquisition/current-debt separation issues should be handled in Batch 4, not reopened under Batch 3 unless a regression proves the Batch 3 canonical gate was bypassed.
Launch-risk note: The latest launch-risk compression audit found no clear P0 launch-blocking canonical-present risk. Remaining DS-064/DS-065/DS-066 work is mostly P1/P2 hardening unless live regression proves otherwise. The next launch gate is live regression, not full decision-source ledger closure.

## Section 3 - Master Decision-Maker Inventory

Coverage note: The completed audit estimated ~132 decision-makers. This ledger captures explicit rows plus grouped row-clusters for remaining call-site expansion. Grouped rows are marked `AUDIT EXPANSION REQUIRED` where individual call sites were not yet atomized.

| ID | Family | Report scope | File | Function or region | Current decision made | Current input source | Current output/surface affected | Current authority status | Risk | Target canonical owner | Required action | Migration batch | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DS-001 | report type/tier | Both | api/generate-client-report.js | effectiveReportMode branching | screening_v1 vs v1_core/underwriting paths | request/job fields + local branching | section inclusion, copy, calculations | duplicate | critical | Decision Canonical Layer | make read-only consumer | B5 | partial | Patch 2 closed the silent explicit-unknown report_type downgrade path via `resolveReportTypeAndTier(...)` and fail-closed `400 Invalid report_type`. Underwriting aliases now normalize explicitly. Broader report type/tier branch cleanup remains partial. |
| DS-002 | report type/tier | Both | api/_lib/source-report-coverage-qa.js | isFullUnderwriting | report type from reportType/reportTier | function args | QA depth/routing flags | QA-only | high | Decision Canonical Layer | convert to QA conformance only | B5 | open | Should consume canonical report-mode state |
| DS-003 | report type/tier | Both | api/_lib/report-contract-qa.js | reportTypeIsScreening | screening contract interpretation | reportType/reportTier | contract violations | QA-only | medium | Decision Canonical Layer | convert to QA conformance only | B5 | open | Keep as conformance only |
| DS-004 | classification/verdict | Both | api/_lib/report-surface-contracts.js | normalizeVerdictLabel | score->label mapping | computed score | canonical label seed | canonical | critical | Decision Canonical Layer | keep as canonical | B1 | open | G2 materially closed visible-label consumer hardening in generator; canonical label family consumption is now mode-aware. Keep row open until broader classification family atomization is complete. |
| DS-005 | classification/verdict | Both | api/_lib/report-surface-contracts.js | buildCanonicalDisplayVerdictState | cap application (source/debt/core support) | canonical states | canonical visible label/cap metadata | canonical | critical | Decision Canonical Layer | keep as canonical | B1 | open | Primary owner candidate; G2/G6 materially hardened downstream consumers and mode-gating, but owner-row remains open pending broader row-family closure standard. |
| DS-006 | classification/verdict | Both | api/generate-client-report.js | normalizeVisibleReportClassification | visible label override chain | mixed state/local | cover/scorecard visible label | renderer-local | critical | Decision Canonical Layer | make read-only consumer | B1 | open | G2 materially closed this consumer class: mode-aware canonical label consumption, screening debt-cap leakage blocked, and source/core cap precedence preserved. |
| DS-007 | classification/verdict | Both | api/generate-client-report.js | alignDealScorecardVisibleClassificationHtml | text replacement for scorecard label | rendered HTML text | scorecard label string | renderer-local | high | Decision Canonical Layer | make read-only consumer | B1 | open | G2 materially closed cross-surface label alignment in completed scope; remaining work is wording/polish, not known authority leak. |
| DS-008 | classification/verdict | Both | api/_lib/report-contract-qa.js | visible label regex checks | infer rendered label set | rendered text | contradictions/violations | QA-only | high | Decision Canonical Layer | convert to QA conformance only | B1 | open | G5 materially closed provenance/cap authority in report-contract QA; remaining row scope is conformance taxonomy/wording polish. |
| DS-009 | scoring | Both | api/generate-client-report.js | buildDealScorecardState | composite/factor scoring and cap interactions | mixed canonical + local fallbacks | score rows/labels/explanations | duplicate | critical | Financial Canonical Layer + Decision Canonical Layer | make read-only consumer | B1 | open | Canonical score object required |
| DS-010 | scoring | Both | api/_lib/report-surface-contracts.js | verdict cap metadata path | score_label vs cap_reason relationship | canonical state | risk profile labels | canonical | high | Decision Canonical Layer | keep as canonical | B1 | open | Should be single verdict authority |
| DS-011 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildT12SufficiencyState | T12 core sufficiency bucket | parser artifacts | publishability class | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | fail-closed logic root |
| DS-012 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildRentRollSufficiencyState | rent roll sufficiency bucket | parser artifacts | publishability class | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | includes occupancy basis reasoning |
| DS-013 | core sufficiency | Both | api/_lib/report-surface-contracts.js | buildCoreInputSufficiencyState | combined core sufficiency gate | T12/rent roll + reconciliation | user/admin/deliverability influence | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | top-level core gate owner |
| DS-014 | core sufficiency | Both | api/_lib/source-report-coverage-qa.js | deterministic flag translation | convert sufficiency into flags | canonical + rendered signals | QA routing and blockers | QA-only | high | Coverage/Eligibility Layer | convert to QA conformance only | B5 | partial | Canonical guards now reduce non-canonical authority in deterministic flag translation paths; broader flag/routing family remains partial. |
| DS-015 | T12 truth | Both | api/parse/parse-doc.js | t12 parser + core validation | accept/reject T12 totals/lines | extracted text/tables + AI recovery | t12_parsed artifact | canonical | critical | Parser Canonical Layer | keep as canonical | B5 | open | core_t12_validation already present |
| DS-016 | T12 truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalT12GprSource | choose authoritative GPR field | t12 payload fields | reconciliation and downstream metrics | canonical | high | Financial Canonical Layer | keep as canonical | B5 | open | explicit precedence list |
| DS-017 | rent roll truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalRentRollAnnualMetric | annual in-place/market truth selection | rent roll totals/rows/sample signals | rr annual totals | canonical | critical | Financial Canonical Layer | keep as canonical | B5 | open | key anti-drift authority |
| DS-018 | rent roll truth | Both | api/_lib/report-surface-contracts.js | resolveCanonicalRentRollAnnualTotals | combined in-place + market totals | canonical metric resolver | rent totals for reconciliation/rendering | canonical | critical | Financial Canonical Layer | keep as canonical | B5 | open | used by source reconciliation state |
| DS-019 | rent roll truth | Both | api/generate-client-report.js | resolveSafeAnnualRentTotal | alternate rent total fallback | local heuristic | displayed rent totals | legacy | critical | Financial Canonical Layer | quarantine | B5 | open | duplicate with canonical resolver |
| DS-020 | rent roll truth | Both | api/_lib/report-contract-qa.js | occupancy extraction regex | infer occupancy from rendered text | rendered text | violation findings | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B5 | open | false positive risk demonstrated |
| DS-021 | debt/refi truth | Both | api/_lib/report-surface-contracts.js | buildCurrentDebtAssessmentState | current debt assessed/not assessed + reason codes | mortgage/loan/t12 artifacts | debt status, DSCR state, explanations | canonical | critical | Financial Canonical Layer + Decision Canonical Layer | keep as canonical | B3 | partial | Canonical owner remains PARTIAL by design. G6 Final Sweep demoted QA inventory booleans so inventory-only evidence cannot create computed current debt, DSCR, or refi eligibility; payload-backed explicit current-debt evidence is required. |
| DS-022 | debt/refi truth | Both | api/generate-client-report.js | resolveCanonicalCurrentDebtScoreInputs | DSCR score input selection | canonical + legacy fallback | scorecard DSCR row | duplicate | critical | Financial Canonical Layer | make read-only consumer | B3 | closed | Scorecard DSCR consumes canonical current-debt state. If canonical debt exists and is not computed, no numeric DSCR is backfilled from legacy fallback. |
| DS-023 | debt/refi truth | Both | api/generate-client-report.js | resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback | fallback DSCR compute | mortgage payload + T12 NOI | debt metrics fallback | legacy | high | Financial Canonical Layer | quarantine | B3 | closed | resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(...) retained only for canonical-absent compatibility through score-input bridge; cannot override canonical not-assessed state. |
| DS-024 | debt/refi truth | Both | api/generate-client-report.js | resolveCanonicalRefiDebtBasis | determine refi debt basis and acquisition-only condition | currentDebtState + artifacts + financials | refi gates/copy/eligibility | duplicate | critical | Financial Canonical Layer | make read-only consumer | B3 | closed | resolveCanonicalRefiDebtBasis(...) obeys canonical current-debt state. Non-computed canonical state returns no true debt balance, annual debt service, or DSCR; computed state uses canonical balance/service/DSCR. |
| DS-025 | debt/refi truth | Both | api/generate-client-report.js | buildRefiDebtRenderState | valid/source-limited/not-assessed gate | refi basis + debt signals | refi section render behavior | renderer-local | critical | Coverage/Eligibility Layer + Decision Layer | make read-only consumer | B3 | closed | buildRefiDebtRenderState(...) allows debt/refi math only when canonical debt is computed/eligible. Acquisition-only, source-limited, and not-assessed paths remain non-quantitative. |
| DS-026 | debt/refi truth | Both | api/generate-client-report.js | resolveRefiNarrativeMode | explanatory mode classification | render state + booleans | narrative copy | renderer-local | high | Decision Canonical Layer | make read-only consumer | B3 | closed | resolveRefiNarrativeMode(...) cannot independently upgrade not-assessed/source-limited state into assessed-style current-debt/refi messaging; assessed narrative requires valid canonical render state. |
| DS-027 | debt/refi truth | Both | api/_lib/report-contract-qa.js | extractCurrentDebtDscrValues | parse rendered DSCR values | rendered text | QA blockers | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B3 | closed | extractCurrentDebtDscrValues(...) is evidence-only. report-contract QA resolves canonical current-debt state first, checks rendered DSCR/refi surfaces for conformance, and uses artifact/inventory debt heuristics only as canonical-absent fallback. |
| DS-028 | acquisition vs current debt | Underwriting | api/_lib/report-surface-contracts.js | buildAcquisitionAssumptionState | validated acquisition assumptions and separation semantics | loan terms + taxonomy + debt state | acquisition state | canonical | critical | Financial Canonical Layer | keep as canonical | B4 | open | G6 Slice 1 removed rendered acquisition signals as support authority; `acquisition_financing_rendered` is metadata only. Canonical acquisition support/separation now derives from semantics + validated fields + debt separation state. |
| DS-029 | acquisition vs current debt | Underwriting | api/_lib/source-report-coverage-qa.js | acquisition_financing_assumptions rendered signal logic | rendered evidence of acquisition section | rendered text signals | coverage flags | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B4 | closed | Source-coverage QA is canonical-first when `currentDebtState`/`acquisitionAssumptionState` exists; rendered text and filename/doc_type cues are evidence/conformance only; local heuristics are legacy fallback only when canonical state is absent; no report-specific hardcoding. |
| DS-030 | acquisition vs current debt | Underwriting | api/_lib/report-contract-qa.js | contamination checks | detect acquisition/current debt drift | rendered text + artifacts | blocking violations | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B4 | closed | QA uses canonical acquisition/current-debt state first; acquisition/current-debt separation, acquisition value drift, purchase price/loan mismatch, and lender-fee omission checks are canonical-first; closing-cost notes remain fallback-only until canonical closing-cost fields exist; rendered text is conformance evidence only; artifact fallback is allowed only when canonical state is absent. |
| DS-031 | DCF/cap-rate provenance | Underwriting | api/generate-client-report.js | cap-source label resolver | appraisal/support/framework defaults | cap-rate source labels | renderer-local | critical | Financial Canonical Layer | make read-only consumer | B5 | open | overclaim drift family |
| DS-032 | DCF/cap-rate provenance | Underwriting | api/_lib/report-contract-qa.js | exit-cap overclaim checks | rendered text regex | violations/public blockers | QA-only | high | Financial Canonical Layer | convert to QA conformance only | B5 | open | validated in Slice 6 calibration |
| DS-033 | property tax truth | Underwriting | api/parse/parse-doc.js | property_tax parser/recovery | annual tax acceptance thresholds + AI validation | text/tables | property_tax_parsed artifact | canonical | critical | Parser Canonical Layer + Financial Layer | keep as canonical | B5 | open | includes implausible tax rejection |
| DS-034 | property tax truth | Underwriting | api/_lib/full-underwriting-state.js | buildPropertyTaxBindingState | tax binding reliability | propertyTaxPayload file id/name/tax | binding state used in docs/coverage | duplicate | medium | Parser Canonical Layer | make read-only consumer | B5 | open | keep if strictly derived from canonical payload |
| DS-035 | support-doc treatment | Both | api/_lib/report-surface-contracts.js | buildSupportDocTaxonomyState | semantic role/display label classification | payload + filename/text fallbacks | doc treatment summary and downstream gating | canonical | critical | Parser Canonical Layer | keep as canonical | B5 | open | must be sole semantic role authority |
| DS-036 | support-doc treatment | Both | api/parse/parse-doc.js | inferSupportingDocTypeFromText and related helpers | initial doc classification | extracted text + filename heuristics | parser artifact type selection | duplicate | high | Parser Canonical Layer | make read-only consumer | B5 | open | align with taxonomy contract |
| DS-037 | support-doc treatment | Both | api/generate-client-report.js | filename fallback document treatment paths | infer role from filename text | filename heuristic | treatment labels/context copy | legacy | high | Parser Canonical Layer | quarantine | B5 | open | multiple filename_fallback reason codes |
| DS-038 | renovation/CapEx truth | Underwriting | api/parse/parse-doc.js | renovation parsing/recovery | structured capex/forward assumptions extraction | text/tables + AI | renovation_parsed artifact | canonical | high | Parser Canonical Layer + Financial Layer | keep as canonical | B5 | open | forward-looking vs historical distinction |
| DS-039 | renovation/CapEx truth | Underwriting | api/generate-client-report.js | resolveRenovationDisplayMode / display copy builders | determine modeled vs display-only | mixed canonical + local checks | renovation sections/copy | renderer-local | high | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should consume canonical renovation state |
| DS-040 | section eligibility/rendering | Underwriting | api/_lib/report-surface-contracts.js | UNDERWRITING_SECTION_BLUEPRINTS + buildFullUnderwritingSectionEligibility | eligible/omitted/constrained/underused decision | artifact inventory + debt + reconciliation | render/collapse/omission contract | canonical | critical | Coverage/Eligibility Layer | keep as canonical | B5 | open | G6 Slice 1 removed rendered headings as section-eligibility authority; `rendered_observed` is now observational/conformance metadata only. |
| DS-041 | section eligibility/rendering | Both | api/_lib/source-report-coverage-qa.js | buildRenderedSections | infer section presence from HTML headings | rendered HTML | QA section-depth flags | QA-only | high | Coverage/Eligibility Layer | convert to QA conformance only | B5 | closed | Canonical section eligibility is authoritative when present; rendered section presence is conformance/evidence only. Behavioral tests cover canonical omitted/eligible and heading present/missing paths. |
| DS-042 | section eligibility/rendering | Both | api/generate-client-report.js | screening/underwriting section stripping/replacements | mode branches + local guards | final html surfaces | renderer-local | high | Coverage/Eligibility Layer | make read-only consumer | B5 | closed | Generator section gating is canonical-first for patched section family; final `SECTION_4_NEIGHBORHOOD` unconditional strip leak was fixed via canonical `market_context` guard with behavioral proof and canonical-absent fallback preservation. |
| DS-043 | Data Coverage | Both | api/generate-client-report.js | data coverage headline/severity assignment | mode + reconciliation + section counts | Data Coverage customer copy/headline | renderer-local | high | Coverage/Eligibility Layer + Decision Layer | make read-only consumer | B5 | closed | Data Coverage headline/severity uses canonical-first bridge; behavioral tests prove canonical beats fallback and fallback applies only when canonical is absent. |
| DS-044 | Data Coverage | Both | api/_lib/report-contract-qa.js | data coverage taxonomy drift checks | rendered text + coverage state | violations | QA-only | medium | Coverage/Eligibility Layer | convert to QA conformance only | B5 | open | retain as conformance check |
| DS-045 | QA systems | Both | api/generate-client-report.js | QA orchestration chain | rendered qa + source coverage + contract + director + action plan | analysis artifacts + gate seed | duplicate | critical | Decision Canonical Layer | make read-only consumer | B2 | open | orchestration should consume single decision_state |
| DS-046 | QA systems | Both | api/_lib/qa-action-plan.js | buildQaActionPlan | route actions + summary readiness | multiple QA artifacts | action plan/readiness summary | duplicate | critical | Decision Canonical Layer | make read-only consumer | B2 | partial | G7 Slice 1 materially closed consumer demotion: canonical-present paths now mirror canonical delivery state; local readiness synthesis is canonical-absent fallback only. |
| DS-047 | delivery/readiness | Both | api/_lib/qa-action-plan.js | buildPublishEligibilitySummary | customer/public/outreach readiness + blockers | deterministic flags + violations + actions | publishability/readiness flags | canonical | critical | Decision Canonical Layer | keep as canonical | B2 | partial | G7 Slice 2A materially closed canonical-consumer boundary: canonical-present readiness mirrors canonical delivery state; blocker/advisory/regeneration/source-limitation outputs remain diagnostic metadata under canonical-present authority. |
| DS-048 | delivery/readiness | Both | api/_lib/qa-action-plan.js | buildDeliveryGateDecision | deliverable/admin_review/user_needs_documents | canonical publish summary + sufficiency | delivery_gate_decision artifact | canonical | critical | Decision Canonical Layer | keep as canonical | B2 | partial | G7 Slice 2B + Slice 3 audit materially closed canonical-present consumer boundary: accepts canonical delivery state shapes and mirrors canonical gate truth fields when present; legacy gate-owner behavior is preserved only for canonical-absent artifacts. |
| DS-049 | delivery/readiness | Both | api/generate-client-report.js | gate response + hold delivery handling | delivery_gate_decision + local checks | API response, publication hold | duplicate | high | Decision Canonical Layer | make read-only consumer | B2 | closed | compatibility aliases derived from canonical deliveryDecisionState |
| DS-050 | delivery/readiness | Both | api/admin-run-worker.js | status transitions by generator response | reportData + statuses | analysis_jobs lifecycle | worker-local | critical | Decision Canonical Layer | make read-only consumer | B2 | closed | canonical-first resolver; legacy fields fallback-only when canonical absent |
| DS-051 | fail closed / restore credit | Both | api/admin-run-worker.js | restoreEntitlementForFailedJob / failure handling | worker events + status + purchase rows | credit restoration behavior | canonical | high | Worker Layer | keep as canonical | B2 | closed | `applyTerminalFailureOutcome(...)` centralizes terminal failure updates; `restoreEntitlementForFailedJob(...)` remains sole entitlement restore authority; `recordJobFailure(...)` routes through terminal helper. |
| DS-052 | delivery/readiness | Both | api/_lib/report-contract-qa.js | readiness payload checks | QA payload nesting/flags | blockers/public readiness findings | QA-only | medium | Decision Canonical Layer | convert to QA conformance only | B2 | closed | canonical-first precedence; legacy readiness inputs conformance-only when canonical exists |
| DS-053 | rendered-text parsing | Both | api/_lib/report-contract-qa.js | stripHtml + extract helpers | text parsing for DSCR/occupancy/variance | violations and blocker severities | QA-only | high | QA Layer | convert to QA conformance only | B1-B5 | open | remove truth inference intent |
| DS-054 | rendered-text parsing | Both | api/_lib/source-report-coverage-qa.js | findRenderedSignals | infer semantic report signals | rendered text regex | deterministic flags | QA-only | high | QA Layer | convert to QA conformance only | B1-B5 | open | replace signal truth with state checks |
| DS-055 | rendered-text parsing | Both | api/_lib/qa-manager-review.js | decision suppression heuristics | rendered text + artifact context | manager review classifications | QA-only | medium | QA Layer | convert to QA conformance only | B2 | open | preserve as advisory conformance |
| DS-056 | source reconciliation truth | Both | api/_lib/report-surface-contracts.js | buildSourceReconciliationState | variance status and bucket | canonical rent totals + T12 GPR + parser signals | reconciliation status/disclosure/publishability | canonical | critical | Coverage/Eligibility Layer + Financial Layer | keep as canonical | B5 | open | G6 Final Sweep demoted deterministic flag escalation: material RR/T12 variance stays `source_reconciliation_required` disclose-only unless core sufficiency fails elsewhere; parser/artifact flags remain diagnostic metadata. |
| DS-057 | source reconciliation render guard | Both | api/generate-client-report.js | applyFinalSourceReconciliationRenderGuard | stale variance text cleanup | rendered HTML + canonical variance | final HTML sanitization | renderer-local | medium | Renderer Layer | quarantine | B5 | open | keep only as safety sanitizer |
| DS-058 | parser extraction state | Both | api/parse/extract-job-text.js | parse_status extracted/failed/skipped decisions | file type + parse success | job file parse status | canonical | medium | Parser Canonical Layer | keep as canonical | B5 | open | upstream pipeline authority |
| DS-059 | dashboard/customer status | Both | src/pages/Dashboard.jsx | getCustomerFacingJobStatus | map job status to user label | analysis_jobs status fields | customer-facing status labels | dashboard-local | critical | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Dashboard customer status labels use canonical `customer_status_label` when available; legacy status mapping is fallback-only. |
| DS-060 | dashboard/customer status | Both | src/pages/Dashboard.jsx | needsDocumentsMessage builder | infer missing docs from error_code/files | job + events + file parse statuses | failed-state copy | dashboard-local | high | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Canonical `customer_message` wins; needs-doc/message fallback is non-authoritative fallback-only. |
| DS-061 | dashboard/customer status | Both | src/pages/Dashboard.jsx | getFailedFileGuidance | generate failure guidance narratives | file metadata + status heuristics | customer failed-state guidance | dashboard-local | high | Dashboard Layer consuming Decision Layer | make read-only consumer | B2 | closed | Failed-file guidance is suppressed when canonical `customer_message` exists; legacy parse/file guidance is fallback-only. |
| DS-062 | dashboard/customer status | Both | src/pages/Dashboard.jsx | underwriting support-doc preflight checks | block submit on doc mix | client-side upload set | launch-time UX gate | dashboard-local | medium | Coverage/Eligibility Layer | make read-only consumer | B5 | open | should mirror server canonical requirements |
| DS-063 | launch positioning context | Both | src/pages/Pricing.jsx | static policy/pricing/disclaimer copy | hardcoded policy text | customer messaging | renderer-local | low | Product policy docs | make read-only consumer | N/A | open | no change approved in this ledger stage |
| DS-064 | AUDIT EXPANSION REQUIRED - generator decision cluster | Both | api/generate-client-report.js | multiple helpers exported in __test__ (state/render/math/copy gates) | mixed | many report surfaces | duplicate cluster | critical | Family-specific canonical owners | AUDIT EXPANSION REQUIRED - enumerate remaining individual call sites before migration | B1-B5 | partial | G1/G2 materially closed generator strip/classification consumer authority in the current grouped campaign. Residual broader generator mutation family remains partial as future/post-launch hardening unless live regression exposes a blocker. |
| DS-065 | AUDIT EXPANSION REQUIRED - contract QA regex cluster | Both | api/_lib/report-contract-qa.js | additional regex-based inference sites | rendered text | violation severity/block flags | QA-only cluster | high | QA Layer | AUDIT EXPANSION REQUIRED - enumerate regex truth-inference call sites | B1-B5 | partial | G5 materially closed provenance/cap authority: coverage/current-debt/verdict-cap inference requires explicit provenance, and fallback/unprovenanced states no longer force canonical expected caps. Broader regex/taxonomy polish remains partial. |
| DS-066 | AUDIT EXPANSION REQUIRED - source coverage QA cluster | Both | api/_lib/source-report-coverage-qa.js | additional rendered depth and file-signal checks | files + rendered text | deterministic flags/routing | QA-only cluster | high | QA Layer | AUDIT EXPANSION REQUIRED - enumerate all flag producers by family | B1-B5 | partial | Batch 6E tightened provenance authority. G4 materially hardened canonical-first depth/signal behavior with `CURRENT_DEBT_CANONICAL_RENDER_STATE_DRIFT`, `ACQUISITION_CURRENT_DEBT_CANONICAL_CONFORMANCE_DRIFT`, and `UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE`. Rendered/file/artifact signals are conformance/evidence when canonical authority exists, with legacy fallback retained for canonical-absent paths. Broader deterministic-flag cluster remains partial. |
| DS-067 | AUDIT EXPANSION REQUIRED - parser recovery cluster | Both | api/parse/parse-doc.js | AI fallback + deterministic fallback branch points | extracted text/tables | parser artifacts and diagnostics | duplicate cluster | medium | Parser Canonical Layer | AUDIT EXPANSION REQUIRED - enumerate per-doc recovery authority points | B5 | partial | Closed sub-scopes include prior Batch 4 hardening plus Patch 1/1B current-debt support routing/promotion alignment: explicit non-acquisition debt terms route to `loan_term_sheet` and promote current-debt aliases via `resolveLoanTermCurrentDebtPromotion(...)`, while acquisition/proposed support remains separated. Broader parser-cluster fallback/semantic consistency remains open. |
| DS-068 | AUDIT EXPANSION REQUIRED - worker status machine cluster | Both | api/admin-run-worker.js | repeated status transition paths and branch checks | job state + response payload | published/failed/publishing transitions | worker-local cluster | high | Worker Layer consuming Decision Layer | AUDIT EXPANSION REQUIRED - enumerate all status branch decision sites | B2 | partial | G8 materially closed delivery authority sub-scope: publish path now requires resolved permission (`holdDelivery === false` and `customerDeliveryAllowed === true`), typed hold outcomes remain preserved, and fail-closed/credit-restore safety remains intact. Broader worker lifecycle architecture remains partial. |
| DS-069 | AUDIT EXPANSION REQUIRED - dashboard messaging cluster | Both | src/pages/Dashboard.jsx | failed-state and guidance copy branches | error/status/events | customer messaging | dashboard-local cluster | high | Dashboard Layer consuming Decision Layer | AUDIT EXPANSION REQUIRED - enumerate all customer state recompute branches | B2 | partial | G8 closure audit confirmed canonical-first customer status/message behavior where canonical state exists. Legacy dashboard fallback remains canonical-absent compatibility for older jobs. Broader dashboard messaging architecture remains partial. |
| DS-070 | AUDIT EXPANSION REQUIRED - test-driven implicit decision clusters | Both | tests/qa/* | invariant clusters implying production decisions | tests + fixture assumptions | regression expectations | legacy reference cluster | low | N/A (tests) | quarantine (reference-only) | N/A | open | Use as map only; not authority |

Inventory count note: Explicit rows above: 70 row entries/groups. Combined with grouped expansion clusters, this ledger currently maps the audit-estimated ~132 decision-makers at family and call-site-cluster level. Remaining atomization is explicitly tracked as `AUDIT EXPANSION REQUIRED` rows.
## Section 4 - Duplicate Truth-Maker Map

### 4.1 Classification / visible verdict
- Current duplicate authorities:
  - `buildCanonicalDisplayVerdictState`
  - `normalizeVisibleReportClassification`
  - HTML text replacement for scorecard label
  - regex-based label inference in contract QA
- Desired sole canonical owner: Decision Canonical Layer (`visible_classification_state`).
- Surfaces that must obey it: cover, executive summary, deal scorecard, risk register, Data Coverage severity language.
- QA role after migration: confirm rendered labels equal canonical labels and cap reasons.
- Migration risk: critical customer/public drift if partial migration only.
- First safe batch: Batch 1.

### 4.2 Delivery / readiness
- Current duplicate authorities:
  - `buildPublishEligibilitySummary`
  - `buildDeliveryGateDecision`
  - generator hold/publication checks
  - worker status reinterpretation
  - dashboard status/error-code message recompute
- Desired sole canonical owner: Decision Canonical Layer (`delivery_gate_decision`).
- Surfaces that must obey it: generator response, worker transitions, dashboard states/copy.
- QA role after migration: verify response/job/dashboard conformance to gate payload.
- Migration risk: critical publish/hold inconsistency.
- First safe batch: Batch 2.

### 4.3 Current debt / refi
- Current duplicate authorities:
  - `buildCurrentDebtAssessmentState`
  - generator refi render state helpers
  - legacy fallback DSCR function
  - regex-based DSCR truth inference in QA
- Desired sole canonical owner: Financial Canonical Layer (`current_debt_refi_state`).
- Surfaces that must obey it: debt header/body, DSCR rows, scorecard, sensitivity sections, limitation copy.
- QA role after migration: compare rendered DSCR/labels to canonical state only.
- Migration risk: critical contradiction between not-assessed and numeric DSCR display.
- First safe batch: Batch 3.

### 4.4 Acquisition vs current debt
- Current duplicate authorities:
  - acquisition assumption state
  - parser semantic role/fallback role logic
  - rendered-signal based QA checks
- Desired sole canonical owner: Financial Canonical Layer (`acquisition_financing_state` + separation flags).
- Surfaces that must obey it: acquisition table render/collapse, debt exclusion copy, refi exclusion logic.
- QA role after migration: conformance check for separation and table values.
- Migration risk: critical contamination of current debt truth.
- First safe batch: Batch 4.

### 4.5 Section eligibility
- Current duplicate authorities:
  - `buildFullUnderwritingSectionEligibility`
  - rendered heading detection in source coverage QA
  - renderer branch stripping/injection
- Desired sole canonical owner: Coverage/Eligibility Layer (`section_eligibility_state`).
- Surfaces that must obey it: render/collapse/omit decisions.
- QA role after migration: verify section presence matches eligibility contract.
- Migration risk: high underused/omitted surface drift.
- First safe batch: Batch 5.

### 4.6 Data Coverage
- Current duplicate authorities:
  - canonical coverage states
  - renderer-assigned headline/severity modes
  - QA regex taxonomy checks
- Desired sole canonical owner: Coverage/Eligibility Layer + Decision Layer (`data_coverage_state`).
- Surfaces that must obey it: data coverage headline, limitations body, severity badges.
- QA role after migration: conformance only.
- Migration risk: high customer trust language drift.
- First safe batch: Batch 5.

### 4.7 Support-doc treatment
- Current duplicate authorities:
  - taxonomy state builder
  - parser text-based inferred doc type fallbacks
  - renderer filename fallback reason-code labels
- Desired sole canonical owner: Parser Canonical Layer (`support_doc_taxonomy_state`).
- Surfaces that must obey it: document-treatment tables, modeled/limited/listed labels.
- QA role after migration: detect treatment drift from taxonomy.
- Migration risk: high contamination risk.
- First safe batch: Batch 5.

### 4.8 Rent roll annual totals
- Current duplicate authorities:
  - canonical rent-roll metric resolver
  - generator local safe-rent fallback resolver
- Desired sole canonical owner: Financial Canonical Layer (`rent_roll_annual_totals`).
- Surfaces that must obey it: reconciliation variance, scoring inputs, rent sections.
- QA role after migration: compare rendered totals with canonical totals.
- Migration risk: critical reconciliation drift.
- First safe batch: Batch 5.

### 4.9 T12 operating truth
- Current duplicate authorities:
  - parser accepted T12 values
  - renderer conditional/fallback math paths
  - QA rendered-text inferencing
- Desired sole canonical owner: Parser + Financial Canonical Layers (`t12_operating_state`).
- Surfaces that must obey it: operating statement, NOI/ratio metrics, score factors.
- QA role after migration: conformance against canonical T12 state.
- Migration risk: high model credibility drift.
- First safe batch: Batch 5.

### 4.10 DCF / cap-rate provenance
- Current duplicate authorities:
  - renderer cap-source logic and labels
  - contract QA overclaim detection regex
- Desired sole canonical owner: Financial Canonical Layer (`valuation_assumption_state`).
- Surfaces that must obey it: DCF section labels and cap provenance notes.
- QA role after migration: overclaim conformance check only.
- Migration risk: high public/sample blocker risk.
- First safe batch: Batch 5.

### 4.11 Property tax
- Current duplicate authorities:
  - property_tax parser acceptance
  - full-underwriting-state binding interpretation
  - renderer/document treatment fallback labels
- Desired sole canonical owner: Parser Canonical + Financial Layers (`property_tax_state` with source identity).
- Surfaces that must obey it: modeled tax rows, treatment labels, coverage notes.
- QA role after migration: source-binding conformance checks.
- Migration risk: medium/high contamination risk.
- First safe batch: Batch 5.

### 4.12 Renovation / CapEx
- Current duplicate authorities:
  - parser renovation artifact truth
  - renderer display-mode/collapse copy heuristics
- Desired sole canonical owner: Financial Canonical + Coverage/Eligibility Layers (`renovation_state`).
- Surfaces that must obey it: renovation section visibility and wording.
- QA role after migration: conformance only.
- Migration risk: medium/high false-modeling risk.
- First safe batch: Batch 5.

### 4.13 Dashboard customer status
- Current duplicate authorities:
  - worker status transitions
  - dashboard status/error message recompute
  - gate payload not consistently authoritative in UI
- Desired sole canonical owner: Decision Canonical Layer (`customer_status_state` derived from delivery gate).
- Surfaces that must obey it: status badge, failed-state guidance, needs-doc messaging.
- QA role after migration: UI conformance checks to canonical payload.
- Migration risk: critical customer-facing mismatch risk.
- First safe batch: Batch 2.

## Section 5 - Canonical Authority Target Model

### Parser Canonical Layer
- typed artifacts
- source file identity
- semantic role metadata
- validator outcomes

### Financial Canonical Layer
- operating/T12
- rent roll
- current debt
- acquisition
- property tax
- valuation/cap-rate
- renovation where supported

### Coverage / Eligibility Layer
- core sufficiency
- optional/support constraints
- section eligibility
- Data Coverage class

### Decision Canonical Layer
- visible classification
- score/risk profile
- delivery/readiness
- customer/public/high-value gates
- diagnostics

### Renderer Layer
- formatting only
- no independent classification
- no independent financial calculations
- no independent source labels
- no independent section eligibility

### QA Layer
- state-to-render conformance
- public language checks
- contradiction detection
- not primary truth authority

### Worker Layer
- executes canonical gate/status
- does not reinterpret business truth

### Dashboard Layer
- displays canonical customer status/guidance
- does not recompute business meaning from raw error codes
## Section 6 - Migration Batch Plan

### Batch 1 - Classification / Visible Verdict Authority
- Objective: One canonical classification/verdict decision consumed by cover, executive summary, scorecard, and risk surfaces, with QA expected labels aligned.
- Ledger rows affected: DS-004, DS-005, DS-006, DS-007, DS-008, DS-053, DS-064, DS-065.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, possibly `api/_lib/full-underwriting-state.js`.
- Production invariant: one `visible_classification_state` object drives all rendered labels.
- Must become non-authoritative: renderer label overrides, regex truth inference.
- Tests required: visible label cross-surface conformance, cap reason conformance, no conflicting labels.
- Anti-hardcode proof required: no property/report-id/file-name conditional label branching.
- Rollback/safety notes: if drift appears, fail closed to canonical `Review` class without local overrides.

### Batch 2 - Delivery / Readiness Authority
- Objective: One `delivery_gate_decision` consumed by generator, qa_action_plan outputs, worker, and dashboard.
- Ledger rows affected: DS-045, DS-046, DS-047, DS-048, DS-049, DS-050, DS-052, DS-059, DS-060, DS-061, DS-068, DS-069.
- Files likely affected: `api/_lib/qa-action-plan.js`, `api/generate-client-report.js`, `api/admin-run-worker.js`, `src/pages/Dashboard.jsx`, `api/_lib/report-contract-qa.js`.
- Production invariant: `delivery_gate_status` and readiness flags are interpreted once.
- Must become non-authoritative: worker/dashboard reinterpretation from status/error-code fragments.
- Tests required: gate->worker->dashboard conformance matrix for deliverable/admin_review/user_needs_documents.
- Anti-hardcode proof required: no bespoke error-code message trees overriding canonical gate reason.
- Rollback/safety notes: preserve credit-restore safety path; do not loosen fail-closed blockers.

### Batch 3 - Current Debt / Refi Authority
- Objective: One current debt/refi state controls all headers, DSCR, debt body, scorecard, sensitivity, and QA.
- Ledger rows affected: DS-021, DS-022, DS-023, DS-024, DS-025, DS-026, DS-027.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js`.
- Production invariant: no numeric current-debt DSCR surfaces when canonical status is not computed.
- Must become non-authoritative: `LEGACY_DO_NOT_USE` fallback and render-time debt reclassification.
- Tests required: assessed/not-assessed matrix across clean debt, no-debt, acquisition-only, partial terms.
- Anti-hardcode proof required: no property/document-specific debt exceptions.
- Rollback/safety notes: default to not-assessed with canonical limitation reason if state is uncertain.

### Batch 4 - Acquisition / Current Debt Separation Authority
- Objective: One acquisition/proposed financing state prevents acquisition terms becoming current debt and controls table render/collapse behavior.
- Ledger rows affected: DS-028, DS-029, DS-030, DS-036, DS-037, DS-067.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/parse/parse-doc.js`, `api/generate-client-report.js`, `api/_lib/report-contract-qa.js`, `api/_lib/source-report-coverage-qa.js`.
- Production invariant: acquisition assumptions never populate current debt balance/DSCR authority.
- Must become non-authoritative: rendered-text-based acquisition contamination truth logic.
- Tests required: acquisition-only, mixed docs, noisy text, contradictory loan text collapse behavior.
- Anti-hardcode proof required: no filename/property special-casing for acquisition promotion/suppression.
- Rollback/safety notes: collapse acquisition table to conservative limited disclosure on ambiguity.

### Batch 5 - Section Eligibility + Data Coverage Authority
- Objective: One section/data coverage decision layer controls render/collapse/omit and headline/severity, with QA conformance-only checks.
- Ledger rows affected: DS-001, DS-011..DS-020, DS-031..DS-044, DS-056..DS-058, DS-062, DS-064..DS-066.
- Files likely affected: `api/_lib/report-surface-contracts.js`, `api/generate-client-report.js`, `api/_lib/source-report-coverage-qa.js`, `api/_lib/report-contract-qa.js`, `api/_lib/full-underwriting-state.js`.
- Production invariant: renderer does not independently decide section eligibility or data coverage severity.
- Must become non-authoritative: rendered-section regex inference and local section headline computation.
- Tests required: section eligibility matrix for Screening + Underwriting across core/optional/reconciliation/parser_suspected conditions.
- Anti-hardcode proof required: no per-report/per-property section force-show/hide logic.
- Rollback/safety notes: on uncertainty, prefer canonical constrained/omitted with explicit limitation disclosure.

## Section 7 - Screening Launch Protection Track
- Screening remains possible as first public launch path.
- Screening does not need completion of every Full Underwriting family, but shared decision-sprawl must be controlled.
- Screening-specific required checks:
  1. classification has one authority
  2. data coverage headline has one authority
  3. section eligibility is canonical/pre-render
  4. dashboard copy uses canonical gate/status payload
  5. underwriting debt/refi/acquisition language cannot leak into Screening
  6. public sample paths are fixed before launch
- No `Pricing.jsx` change is approved from this ledger alone.

## Section 8 - Full Underwriting Pause Doctrine
- Full Underwriting public self-serve remains paused.
- Full Underwriting may remain controlled beta/invite-only/operator-reviewed while architecture consolidation proceeds.
- Customer-deliverable does not equal public/sample/high-value ready.
- Do not create public underwriting sample PDFs from flawed reports.

## Section 9 - Working Rules for Every Future Patch
- micro-scoped
- one batch or sub-batch at a time
- audit-backed
- production root cause first
- tests after production fix
- no report-specific hacks
- no hardcoded property names / filenames / report IDs / one-off fixture values
- no public AI wording
- no BUY/SELL/HOLD language
- no broad refactor unless explicitly approved
- no casual new serverless/API route files because of Vercel Hobby function-count constraint
- receipt required every time

## Section 10 - Receipt Template for Future Codex Patches
- A. Files changed
- B. Ledger rows addressed
- C. Canonical authority selected/created
- D. Duplicate authority removed/quarantined/made read-only
- E. Renderer consumption proof
- F. QA changed from truth inference to conformance check, if applicable
- G. Tests added/updated
- H. Validation commands run
- I. Anti-hardcode proof
- J. Anything intentionally not touched
- K. Remaining ledger rows in this family
# June 2, 2026 Addendum - Publish-or-Fail Doctrine Lock Completed

## Checkpoint
- Batch status: `CLOSED / PASS WITH KNOWN SAFE INTERNAL LEGACY`.
- Scope completed: qa-action-plan (Slice 1/1B), generate-client-report (Slice 2), admin-run-worker (Slice 3), Dashboard (Slice 4/4B), AdminDashboard (Slice 5), final repo-search audit.

## Locked Customer Outcome Doctrine
- Ordinary customer outcomes only:
1. `PUBLISH / READY`
2. `FAIL CLOSED + CREDIT RESTORED`
3. Normal processing lifecycle states while generation runs (`queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, `publishing`)
- Forbidden as ordinary customer lifecycle outcomes:
  - admin/under/internal review
  - held/review limbo
  - needs-documents limbo
  - publication-held lifecycle framing
  - upload-more-documents/resume messaging on active jobs

## Sub-scope Validation Notes
- Deprecated `admin_review_required` is no longer an ordinary customer lifecycle endpoint; normalization is reason-aware.
- `user_needs_documents` retained only as internal legacy fail-closed alias for required core-document failures.
- Generator/worker/dashboard/admin surfaces now align to publish-or-fail for ordinary customer-facing lifecycle behavior.
- One late Dashboard review-language leak (`24 business hours` framed as review) was removed and replaced with processing-only timing copy.

## Next Recommended Action
1. Controlled clean Screening live lifecycle retest.
2. Verify Dashboard processing copy and statuses.
3. Verify published report appears and downloads normally.
4. Verify no customer-facing review/hold/needs-doc limbo wording.
5. Then controlled Underwriting lifecycle retest.

If new issues appear, open the next hardening family from concrete evidence only.

---

# June 11, 2026 Addendum - Patch 4 Pre-Audit / Support-Doc Authority Enforcement Escape-Hatch Inventory

## Current CVF interpretation

Patch 4 remains the active blocker family, but the team has paused direct patching to avoid another symptom fix.

Active blocker:

```text
Support-doc role routing / acquisition assumptions / current debt / structured renovation path.
```

Primary CVF families:

```text
CVF-04 Current-debt/refi render-contract drift and debt/proposed-financing separation.
CVF-07 Optional/full-underwriting support depth constraints.
CVF-15 Optional-support/source-package/admin ops paths.
```

Important clarification:

```text
InvestorIQ already has canonical / AI-assisted / deterministic support-doc decisions in places.

The failure mode is likely downstream authority leakage:
some consumers still make independent support-doc role/treatment/allowed-use decisions instead of obeying final canonical authority.
```

## Why this audit exists

Rob challenged whether this is truly new, because support-doc canonical authority was already supposed to be implemented.

The correct response:

```text
The concept was implemented in pieces.

The remaining risk is enforcement:
final renderer, Document Treatment Summary, Financing Readiness, source coverage QA, report contract QA, and action-plan consumers may still have duplicate or fallback decision paths.
```

Therefore the audit is not asking:

```text
"Should we create canonical support-doc authority?"
```

It is asking:

```text
"Where can any part of the Acquisition Memo still bypass canonical support-doc authority?"
```

## Active Codex audit

Codex is currently running:

```text
Support-doc authority enforcement audit only.
```

Audit must find every path where these decisions can still be made independently:

```text
support-doc role
support-doc treatment
allowed use / forbidden use
purchase assumptions provided
proposed acquisition financing source-complete status
current debt context uploaded
Uploaded Existing Debt Context
Proposed Acquisition Financing
Renovation / CapEx acknowledgement
Document Treatment Summary rows
Modeled Inputs / Displayed Limited Use / Listed but Not Quantitatively Modeled groups
appraisal context
market survey context
environmental Phase I context
QA/report/action-plan support-doc role claims
```

## Attack Test 8 root-path questions

The audit must explain how these failures were possible:

```text
1. Stonebridge_Assumptions.pdf contained purchase price + proposed loan terms but was not recognized as purchase/proposed acquisition financing context.
2. Current_Debt_Stonebridge.pdf contained current outstanding balance and debt terms but was rendered as no verified current debt context / generic support.
3. Stonebridge_Reno_Plan.pdf contained budget/rent lift/phasing but was labeled as Rent Roll context and rendered as no verified renovation budget/rent-lift/phasing provided.
```

## Required bypass disposition

For each bypass or duplicate decision-maker, Codex must classify it as:

```text
DELETE duplicate decision-maker
DEMOTE to display-only consumer
FORCE to consume canonical support-doc authority
KEEP as diagnostic-only / non-authoritative
NEEDS new canonical support-doc authority if no single authority exists
```

## Patch 4 acceptance after audit

Patch 4 should not be written until the audit identifies the minimum file/function set.

Patch 4 must prove:

```text
1. Purchase/proposed acquisition assumptions doc routes as Purchase Assumptions / Proposed Acquisition Financing Context.
2. Current debt statement routes as Existing/Current Debt Context.
3. Structured Reno Plan routes as Structured Renovation / CapEx Plan.
4. Document Treatment Summary obeys canonical role/treatment authority.
5. Preliminary Financing Readiness Summary obeys canonical role/treatment authority.
6. QA checks conformance to canonical authority instead of re-deciding document role.
7. Support docs remain bounded and cannot override T12/Rent Roll core truth.
8. No V2 surfaces reopen.
```

## Regression fixtures required

Patch 4 must include or recommend fixtures for:

```text
purchase assumptions / proposed acquisition financing
current debt statement
structured renovation / CapEx plan
appraisal summary
market survey
Phase I ESA
mixed support package equivalent to Final Attack Test 8
same-filename / duplicate-artifact support-doc conflict if relevant
```

## Launch posture unchanged

```text
Screening remains launchable / founder-beta ready from current evidence.
Acquisition Memo remains not launch-cleared until support-doc authority enforcement patch and Final Attack Test 8 rerun pass.
Full Underwriting V2 remains deferred.
```

## Next sequence

```text
1. Receive Codex audit receipt.
2. Review whether audit found actual bypasses and minimum Patch 4 scope.
3. Create Patch 4 prompt from audit results.
4. Patch only support-doc authority enforcement.
5. Rerun Final Attack Test 8.
6. Update this ledger with audit findings and Patch 4 result.
```



---

# June 13, 2026 Addendum - CVF Update / Patch 4C Render-Time Canonical Authority Handoff

## Current CVF status

Final Attack Test 8 and follow-up Patch 4C work have narrowed the active Acquisition Memo blocker.

Current CVF verdict:

```text
CVF-01 / CVF-02 Core T12 + Rent Roll parsing:
PASS / holding.

Core-valid publish path:
PASS / holding.

V2 leakage prevention:
PASS / holding.

Purchase assumptions / proposed acquisition context:
PASS or near-pass in the current tested path; preserve.

Current debt support-doc authority:
OPEN / launch blocker for Acquisition Memo.

Structured Reno support-doc authority:
OPEN / launch blocker for Acquisition Memo until full render propagation is proven.

Report-contract / render authority conformance:
OPEN / root now narrowed to live render-time canonical map consumption.
```

## Updated blocker name

Current active blocker:

```text
Patch 4C - Render-Time Canonical Support-Doc Authority Propagation
```

This supersedes broader language that described the blocker only as parser/support-doc intelligence.

The current issue is now narrower:

```text
The helper authority path can classify the support docs correctly, but the live Acquisition Memo render path still loses or misreads the canonical authority row before final visible HTML/PDF output.
```

## Root-cause investigation result

Codex confirmed:

```text
1. buildCanonicalSupportDocAuthorityRows(...) is classifying the Stonebridge support docs correctly in the helper path.
2. buildDocumentTreatmentSummaryHtml(...) correctly renders the canonical row when called directly with the canonical authority rows/map.
3. The end-to-end generateClientReport(...) path still diverges from that helper result for live HTML.
```

Current interpretation:

```text
The remaining CVF failure is not a missing current-debt keyword.
It is not a missing Reno keyword.
It is not proof that the canonical authority design is impossible.
It is a final render propagation / consumer-shape / call-site issue.
```

## Specific suspected implementation fault

The live canonicalSupportDocMap now likely contains authority-row-style objects from `buildCanonicalSupportDocAuthorityRows(...)`, while `buildDocumentTreatmentSummaryHtml(...)` still reads resolver-style keys.

Expected by consumer:

```text
authority.displayLabel
authority.treatment
authority.use
authority.role
authority.authoritySource
authority.originalFilename
```

Likely provided by authority rows:

```text
authority.document_role_label
authority.treatment_label
authority.use_label
authority.canonical_support_doc_role
authority.semantic_doc_display_label
authority.authority_source
authority.original_filename
```

Resulting failure mode:

```text
The authority row can be correct, but the renderer reads empty fields and defaults to:
- Other Support Document
- Context only
- Listed for auditability only; not used quantitatively.
```

This matches the observed smoke failure:

```text
Current_Debt_Stonebridge.pdf is present in live full-render HTML, but Debt Support Received / Contextual does not propagate into final visible Acquisition Memo output.
```

## CVF mapping

### CVF-04 / CVF-15 - Current debt authority

Status:

```text
OPEN / launch blocker.
```

Updated owner area:

```text
api/generate-client-report.js
buildDocumentTreatmentSummaryHtml canonical map consumer branch
active v1_core buildDocumentTreatmentSummaryHtml call sites
late DOCUMENT_TREATMENT_SUMMARY replacement path
```

Human red-pen decision:

```text
true_launch_blocker for Acquisition Memo until current debt visible label propagation passes local full-render smoke and live Final Attack Test 8 retest.
```

### CVF-07 / CVF-15 - Structured Reno authority

Status:

```text
OPEN / launch blocker until full render propagation proves structured Reno rows survive final HTML.
```

Updated owner area:

```text
same canonical map consumer/field-shape path as Current Debt.
```

### CVF-14 / QA authority enforcement

Status:

```text
OPEN / partially improved.
```

Updated interpretation:

```text
QA can only be trusted after the render path and QA path compare against the same canonical map shape.
If renderer consumes one shape and QA records another, QA can still miss visible contradictions or produce misleading green checks.
```

## What must be patched next

Patch only:

```text
1. Normalize canonicalSupportDocMap value shape inside buildDocumentTreatmentSummaryHtml.
2. Ensure active Acquisition Memo call sites pass the canonical map or are replaced by the canonical late block before final HTML returns.
3. Ensure renderedDocumentTreatmentRowsOut receives normalized rendered rows.
4. Preserve current helper authority rows and resolver behavior unless a tiny compatibility alias is unavoidable.
```

Do not patch:

```text
T12/Rent Roll math
Screening
Delivery gate / credit restore
Pricing / Stripe
SQL / RPC / Supabase
Dashboard
DocRaptor config
Auth / upload gates
Full Underwriting V2
DSCR / refi / DCF / waterfall / deal score / final recommendation
```

## Required acceptance tests

The next patch is not acceptable until:

```text
node --check api/generate-client-report.js
node --check tests/qa/generate-client-report-rent-roll-smoke.js
node tests/qa/generate-client-report-rent-roll-smoke.js
git diff --check
```

The live full-render smoke must prove:

```text
Current debt fixture renders Debt Support Received / Contextual.
Structured Reno fixture renders Structured Renovation / CapEx Plan.
Purchase assumptions remain Purchase Assumptions / Acquisition Context.
Appraisal remains Appraisal Context.
Market survey remains Market Rent Context.
Phase I remains Environmental Due Diligence Context.
No forbidden V2 surfaces appear.
```

## Retest rule

Do not run another live Final Attack Test 8 retest until the local full-render smoke passes.

Reason:

```text
A live retest before the smoke passes only burns time and confirms the known gap.
The local smoke is now the immediate gate.
```

## Launch posture

```text
Screening:
Launchable / founder-beta ready from current evidence.

Acquisition Memo:
Not launch-cleared.
Current active blocker is Patch 4C render-time canonical authority propagation, not broad product design.

Full Underwriting V2:
Deferred.
```

## Fresh continuation point

Resume from here:

```text
Patch 4C partially improved canonical map wiring but full-render smoke still fails current debt visible label propagation.
The helper authority path works.
The direct Document Treatment helper call works.
The end-to-end generateClientReport path diverges.
Likely fault: canonicalSupportDocMap contains authority-row fields, but buildDocumentTreatmentSummaryHtml reads resolver-style fields and defaults to Other Support / Context only.
Next patch must normalize the map consumer and inspect remaining v1_core call sites.
No live retest until node tests/qa/generate-client-report-rent-roll-smoke.js passes.
```

---

# Historical July 15, 2026 P0 Completion Addendum

This section records the pre-RETEST 27, pre-Manifest, and pre-Gate 3 checkpoint. The Gate 3 Completion Addendum below is controlling.

This addendum supersedes the July 13 continuation instructions above. The historical evidence remains valid; its stale next-task directions do not.

## Current exact state

```text
P0-A Financial Truth and Reconciliation Egress Seal: PASS locally
P0-B Deterministic Contract QA Seal: PASS locally
P0-C Final PDF Publication Quality Boss: PASS locally
P0-D RETEST 24 Permanent Regression Replay: PASS locally

PRODUCTION CERTIFICATION: HOLD
DEPLOYMENT: NO
COMMIT: NO
LIVE RETEST: one controlled Acquisition proof authorized only after commit and deployment
```

## Failure families closed locally

```text
CVF-P0-01 incorrect Break-Even Occupancy formula
  closed by deterministic OpEx / T12 GPR calculation and render assertion

CVF-P0-02 unauthorized gross-rent capitalization
  closed by calculation/surface prohibition and Contract QA assertion

CVF-P0-03 reconciliation truth lost downstream
  closed by canonical T12 GPR, Rent Roll in-place rent, difference,
  variance, and non-inference disclosure through Projection/Boss/Model/render

CVF-P0-04 QA falsely approves an unsafe customer surface
  closed by an independent deterministic Contract QA Seal

CVF-P0-05 final HTML survives but PDF drops or damages approved content
  closed by the post-render Final PDF Publication Quality Boss before publication

CVF-P0-06 RETEST 24 recurrence not permanently represented
  closed by the sanitized permanent RETEST 24 fixture and replay

CVF-P0-07 sealed Acquisition decision becomes false blocked compatibility aliases
  discovered by P0-D and closed at report-delivery-output.js with a strict,
  schema-specific, fail-closed Acquisition final-decision adapter
```

## Core-valid optional-support doctrine proven

The permanent replay proves that a valid T12 and Rent Roll still publish when every optional support document is unusable. Optional support may collapse, omit, qualify, or disclose. It cannot manufacture a core blocker.

The same replay proves that:

```text
purchase assumptions remain acquisition-only
current debt remains current-debt-only
appraisal remains appraisal-only
Screening remains isolated from Acquisition support behavior
Contract QA, Publication Boss, and Delivery Seal agree
```

## Local acceptance evidence

```text
node tests/qa/p0a-financial-truth-egress-smoke.js: PASS
node tests/qa/p0b-deterministic-contract-qa-seal-smoke.js: PASS
node tests/qa/p0c-final-pdf-publication-quality-boss-smoke.js: PASS
node tests/qa/p0d-retest24-permanent-regression-replay-smoke.js: PASS
node tests/qa/generate-client-report-rent-roll-smoke.js: PASS
node tests/qa/support-document-authority-cutover-smoke.js: PASS
node tests/qa/admin-run-worker-publish-contract-smoke.js: PASS
npm.cmd run build: PASS
```

## Exact next boundary

```text
commit and deploy the accepted P0-A through P0-D bundle
-> one controlled live Acquisition retest in DocRaptor test mode
-> inspect the full PDF, artifacts, delivery state, worker state, and credit state
-> keep production certification HOLD unless every surface agrees
-> build the Canonical Report Quality Manifest
-> build the Admin Quality Incident and Customer Remedy Dashboard
-> execute the institutional ELITE stages preserved in the July 15 Master
```

No broad Source Truth or Support Document Authority reopening is authorized by this addendum.

---

# July 15, 2026 Gate 3 Completion Addendum

This addendum supersedes every earlier next-task instruction in this ledger. Historical CVF evidence remains preserved and must not be deleted or reinterpreted as current execution authority.

## Current gate state

```text
Gate 1 controlled live Acquisition proof: PASS through RETEST 27
Gate 2 Canonical Report Quality Manifest: PASS / committed at cde0b05
Gate 3 Admin Quality Incident and Customer Remedy Dashboard: PASS locally
Gate 3 commit: NO
Gate 3 deployment: NO
Gate 3 live service or live retest: NO
Gate 4 Institutional Financial Intelligence: NEXT after Gate 3 deployment verification
```

## New CVF families closed locally

### CVF-G3-01 - Blocked terminal without a final quality receipt

Prior risk:

```text
published reports could receive a finalized Manifest,
while blocked or platform-failed reports could terminate without one.
The BLOCKED admin queue would then need to reconstruct truth from secondary evidence.
```

Local closure:

```text
separate blocked-terminal Manifest finalizer
explicit terminal code and failure class
credit/remedy receipt
canonical delivery receipt when one exists
honest unavailable-evidence candidate when Source Truth was never constructed
```

### CVF-G3-02 - Noncanonical delivery receipt accepted by final Manifest

Prior risk:

```text
a normalized compatibility object could look deliverable without carrying
the exact canonical_delivery_decision source marker.
```

Local closure:

```text
published final Manifest requires exact canonical delivery authority
worker passes the full canonical deliveryDecisionState
legacy aliases cannot finalize published quality truth
```

### CVF-G3-03 - Admin dashboard becomes a competing truth engine

Prior risk:

```text
admin triage could reconstruct quality state from filenames, parser labels,
raw file rows, HTML fragments, scattered logs, or legacy aliases.
```

Local closure:

```text
one receipt-only incident projection owner
inputs limited to final Report Quality Manifest and exact canonical delivery state
append-only action receipts allowed only for operational history
no raw-source or legacy-alias fallback
```

### CVF-G3-04 - Remedy control silently changes constitutional state

Prior risk:

```text
an admin button could bypass Source Truth, Delivery Gate, publication locks,
credit accounting, or billing review.
```

Local closure:

```text
current controls record requests and references only
authorityCreating false
sourceTruthChanged false
deliveryChanged false
publicationChanged false
creditMutationPerformed false
financialMutationPerformed false
```

### CVF-G3-05 - Post-gate platform failure overwrites content eligibility

Prior risk:

```text
a report can pass content/delivery eligibility and later fail PDF or storage.
Forcing the earlier canonical decision to blocked would falsify history.
Treating the terminal result as published would also be false.
```

Local closure:

```text
the Manifest preserves the deliverable canonical decision
and separately records blocked publication with the internal terminal failure.
Both facts remain visible without contradiction.
```

### CVF-G3-06 - Customer remedy wording implies a nonexistent upload workflow

Local closure:

```text
replacement source required
customer contact routing
support-coordinated corrected rerun
no claim that a customer can upload more documents after submission
```

## Gate 3 queue doctrine now implemented

```text
BLOCKED
PUBLISHED WITH LIMITATIONS
PUBLISHED CLEAN

collapse_expected
collapse_unexpected
collapse_requires_review

Customer Attention Risk: HIGH / MEDIUM / LOW
responsibility: InvestorIQ defect / customer source limitation / mixed
owner routing
recurring defect-family counts
report inspection links
append-only remedy requests
```

## Production owner boundary

```text
api/_lib/report-quality-manifest.js
api/_lib/report-quality-incident-projection.js
api/admin/quality-incidents.js
api/admin-run-worker.js
api/_lib/generate-client-report-impl.js
src/components/Admin/QualityIncidentDashboard.jsx
src/pages/AdminDashboard.jsx
package.json
```

No Gate 3 production change grants authority to AI, parser route, filename, artifact type, taxonomy, Manifest, incident projection, admin UI, or remedy controls.

## Permanent verification

```text
tests/qa/report-quality-manifest-smoke.js: PASS
tests/qa/report-quality-incident-projection-smoke.js: PASS
tests/qa/admin-quality-incidents-smoke.js: PASS
npm.cmd run qa:quality-ops: PASS
npm.cmd run qa:full: PASS
npm.cmd run build: PASS
P0-A through P0-D: PASS
Source Truth constitutional matrix: PASS
Support Document Authority adversarial matrix: PASS, 24 scenarios
git diff --check: PASS
```

## Exact next CVF boundary

Gate 4 must add Institutional Financial Intelligence through bounded, deterministic modules:

```text
canonical accepted debt-service input contract
monthly and annual debt-service math
current/proposed/bridge/exit/stress DSCR eligibility
fixed/floating and maturity/refinancing risk
lender fee and debt-cost analysis
reconciliation materiality
CapEx timing, reserve adequacy, and deferred-maintenance classification
```

Legacy underwriting code remains quarantined. It may be inspected only as historical product context, never copied into production authority or used to bypass current Source Truth, fact-bundle, deterministic-math, Boss, Contract QA, Delivery Seal, PDF Boss, Manifest, or Dashboard contracts.

Missing optional Gate 4 inputs must collapse or qualify only the narrow section. They must never become zero, false completeness, inferred facts, or a blocker to valid T12/Rent Roll publication.

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

Institutional composition, role-specific support fact bundles, debt/lender analytics, renovation/value-creation underwriting, valuation, returns, risk register, diligence tracking, deterministic visual design, and committee-ready presentation remain required inside these bounded gates.

---

## July 16 Gate 3 production proof and Gate 4A CVF closure

Gate 3 deployed successfully after consolidating the Quality Incident endpoint behind the existing admin function. The live authenticated Admin Dashboard loaded all three canonical Manifest queues and the valid empty receipt state. Vercel function count is locked by regression proof at 12 / 12.

Gate 4A closes the following debt-input failure families before calculation work begins:

```text
accepted debt fact without exact accepted evidence -> ineligible evidence gap
missing numeric debt input -> null, never zero
multiple accepted sources without one canonical primary -> ineligible
conflicting accepted debt sources -> affected debt analysis collapses
duplicate source with one accepted primary -> duplicate disclosed, authority preserved
current debt carrying proposed-financing fields -> no cross-role promotion
proposed financing carrying current-debt fields -> no cross-role promotion
optional debt failure -> never a report publication blocker
noncanonical or legacy source package -> rejected by contract constructor
```

Production owner: `api/_lib/debt-service-input-contract.js`.

Permanent proof: `tests/qa/debt-service-input-contract-smoke.js` through `qa:financial-intelligence` and `qa:full`.

Status: Gate 4A `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED`. Next bounded CVF slice is Gate 4B deterministic annual and monthly debt-service math. No renderer, Boss, CustomerSurfaceModel, Delivery Gate, Screening, or publication behavior changed in Gate 4A.

## July 16 Gate 4B CVF closure

Gate 4B adds `api/_lib/deterministic-debt-service-calculation.js` as the only new debt-service calculation owner. It accepts only the canonical Gate 4A contract and closes these calculation failure families:

```text
missing debt input -> calculation collapsed with null outputs
unbound accepted fact -> calculation collapsed
conflicting debt authority -> calculation collapsed
source-stated monthly payment -> preserved and annualized exactly by 12
both stated and modeled current debt eligible -> stated payment takes precedence
zero or near-zero rate -> numerically stable deterministic calculation
fractional non-monthly amortization period -> calculation collapsed
unsafe payment-period count -> calculation collapsed
numeric overflow or non-finite result -> calculation collapsed
modeled payment -> explicitly qualified as modeled, not source-stated
optional debt calculation failure -> never a core publication blocker
```

Gate 4B performs no DSCR, stress, rendering, Boss, CustomerSurfaceModel, Delivery Gate, Screening, credit, billing, or publication mutation. Focused QA, full QA, build, diff integrity, terminology guards, and the 12 / 12 Vercel budget all pass.

Status: Gate 4B `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED`. Next bounded CVF slice is Gate 4C DSCR eligibility and calculation.

## July 16 Gate 4C CVF closure

Gates 4A and 4B are committed and deployed at `e3e080e`. Gate 4C adds `api/_lib/deterministic-dscr-analysis.js` as the sole new deterministic coverage owner.

Closed Gate 4C failure families:

```text
missing canonical T12 NOI -> ratio null
accepted zero NOI -> ratio zero, not missing
accepted negative NOI -> negative ratio preserved
missing or evidence-gapped debt inputs -> affected ratio null
conflicting debt authority -> affected ratio null
unavailable annual debt service -> affected ratio null
non-finite division result -> affected ratio null
modeled debt service -> coverage result requires modeled qualification
missing covenant threshold -> no pass/fail or risk classification
arbitrary bridge/exit/stress inputs -> ignored
base-case reuse as scenario -> prohibited
bridge/exit/stress without canonical scenario contract -> not calculated
optional DSCR failure -> never a core publication blocker
```

Collapsed coverage receipts retain valid accepted numerator or denominator components and the exact missing-input/evidence-gap state. They do not fabricate a ratio or discard valid provenance.

Gate 4C performs no rendering, Boss, CustomerSurfaceModel, Delivery Gate, Screening, credit, billing, or publication mutation. Focused QA, full QA, build, terminology guards, diff integrity, and the 12 / 12 Vercel budget pass.

Status: Gate 4C `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED`. Next bounded CVF slice is Gate 4D maturity, rate structure, refinancing, and lender-fee risk.

## July 16 Gate 4D CVF closure

Gate 4C is committed and deployed at `2ed59d3`. Gate 4D adds `api/_lib/deterministic-debt-risk-analysis.js` as the sole deterministic maturity, rate-structure, lender-fee, and refinancing-readiness owner. `api/_lib/report-analysis-context.js` supplies the required reproducible report as-of date.

Closed Gate 4D failure families:

```text
maturity date alone cross-promotes proposed financing into current debt -> prohibited
filename or parser role creates rate structure -> prohibited
fixed, floating, or hybrid label lacks exact source evidence -> fact not accepted
fixed and floating wording conflicts without an explicit transition -> rate structure rejected
amortization is mistaken for loan term -> prohibited
ambiguous maturity date is guessed -> analysis not assessed
system clock silently changes maturity result -> prohibited
missing maturity or rate structure becomes a risk label -> prohibited
missing lender fee becomes zero -> prohibited
accepted zero lender fee becomes missing -> prohibited
proposed acquisition financing becomes refinancing authority -> prohibited
current debt facts become future refinancing terms -> prohibited
missing refinancing fact bundle produces a model -> prohibited
optional risk fact conflict destroys uncontested financing authority -> prohibited
optional debt-risk limitation blocks valid core publication -> prohibited
```

Source Truth now records narrow optional fact conflicts through `support.fact_conflicts`. Disputed `rate_structure`, `loan_term_years`, or `maturity_date` facts are excluded from accepted truth while the accepted role and uncontested facts remain intact. Material bundle conflicts retain the prior full fail-closed behavior. The Quality Manifest records accepted and rejected facts, and the Admin incident projection creates a non-blocking `SUPPORT_FACT_CONFLICT` event.

Gate 4D creates no renderer output, Boss mutation, CustomerSurfaceModel mutation, Delivery Gate change, Screening change, credit change, billing change, or customer lifecycle change. No covenant threshold, risk tier, rate shock, recommendation, or refinancing scenario is inferred.

Verification: support authority `PASS` with 33 scenarios; Source Truth pipeline, phase, and constitutional matrix `PASS`; Quality Ops `PASS`; Financial Intelligence `PASS`; full QA and production build `PASS`; Vercel budget `PASS 12 / 12`; diff integrity `PASS`.

Status: Gate 4D `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED`. Next bounded CVF slice is Gate 4E T12 versus Rent Roll reconciliation materiality and source-bound explanation.

## July 16 Gate 4E CVF closure

Gate 4D is committed and deployed at `62ae77f`, with its ledger update at `c790986`. Gate 4E adds `api/_lib/core-reconciliation-input-contract.js` as the sole canonical input owner and `api/_lib/deterministic-core-reconciliation-analysis.js` as the sole deterministic calculation owner for T12 versus Rent Roll reconciliation intelligence.

Closed Gate 4E failure families:

```text
broad T12 gross income is relabeled as Gross Potential Rent -> prohibited
T12 reconciliation value disagrees with its accepted core fact -> evidence gap and collapse
monthly Rent Roll summary is used without annualization -> prohibited
Rent Roll reconciliation value disagrees with canonical source selection -> evidence gap and collapse
point-in-time Rent Roll and trailing T12 are presented as equivalent concepts -> prohibited
variance cause is inferred from the amount alone -> prohibited
legacy 5% materiality threshold is silently reused -> prohibited
arbitrary caller threshold creates classification -> prohibited
missing reconciliation value becomes zero -> prohibited
accepted zero Rent Roll value becomes missing -> prohibited
optional unit count absence destroys the core comparison -> prohibited
optional reconciliation limitation blocks valid core publication -> prohibited
```

Gate 4E calculates objective variance measures only. The permanent reference proof produces a difference of `-$180,000.00`, a T12 GPR-relative variance of `-11.16%`, and a 64-unit monthly difference of `-$234.38` per unit. The explanation identifies only the accepted measures, their time-basis distinction, and the fact that accepted sources do not establish cause.

Materiality classification remains fail-closed at `not_classified` with a null threshold until an approved canonical policy exists. Missing inputs and evidence gaps produce null calculations and retain any separately valid accepted component. All Gate 4E outcomes remain non-blocking to canonically valid T12 and Rent Roll publication.

The existing live `buildSourceReconciliationState(...)` path still owns customer behavior and still contains the legacy 5% rule plus broad source fallbacks. It was not modified in Gate 4E. Gate 4G must perform the bounded atomic downstream cutover; no parallel authority is permitted after that integration.

Gate 4E creates no renderer output, Boss mutation, CustomerSurfaceModel mutation, Delivery Gate change, Screening change, credit change, billing change, or publication mutation.

Verification: Financial Intelligence `PASS`; Source Truth pipelines and constitutional matrix `PASS`; diff integrity `PASS`; full QA and production build `PASS`; Vercel budget `PASS 12 / 12`.

Status: Gate 4E `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED`. Next bounded CVF slice is Gate 4F CapEx timing, reserve adequacy, and deferred maintenance.

## July 16 Gate 4F CVF closure

Gate 4E is committed at `b3ac12b`. Gate 4F adds `api/_lib/capital-plan-input-contract.js` as the canonical capital input owner and `api/_lib/deterministic-capital-plan-analysis.js` as the deterministic timing, reserve, and deferred-maintenance owner.

Closed Gate 4F failure families:

```text
property condition assessment is routed only by filename or candidate type -> prohibited
historical CapEx becomes a forward capital plan -> prohibited
capital amount lacks exact local source evidence -> fact not accepted
unrelated later dollar amount satisfies a prior capital label -> prohibited
missing currency symbol destroys an otherwise locally bound institutional amount -> supported safely
split capital label and immediate value are lost -> supported safely
conflicting timing horizons are guessed -> timing facts rejected
month range is converted into an invented timing bucket -> prohibited
missing timing bucket becomes zero -> prohibited
partial timing buckets produce a false unallocated amount -> prohibited
missing reserve balance becomes zero -> prohibited
accepted zero reserve or capital requirement becomes missing -> prohibited
same-role optional reserve conflict destroys uncontested plan authority -> prohibited
cross-role reserve disagreement selects an arbitrary winner -> prohibited
reserve comparison becomes an adequacy conclusion without policy -> prohibited
deferred-maintenance amount becomes a severity conclusion -> prohibited
deferred-maintenance cause is inferred -> prohibited
optional capital limitation blocks valid core publication -> prohibited
```

Source Truth now recognizes `property_condition_context` and quarantines completed or historical work as `historical_capital_context`. Optional capital fact conflicts are resolved at the narrowest fact boundary. Material total-plan contradictions retain full document-level conflict treatment.

Gate 4F calculates source-labeled timing-bucket reconciliation, explicit relative schedule duration, reserve less stated capital requirement, reserve coverage ratio, annual and monthly reserve contribution per accepted unit, and reserve coverage against accepted deferred maintenance. It does not assign adequacy, severity, cause, execution, or recommendation labels.

The permanent reference proof produces a fully reconciled `$1,200,000.00` capital plan, a 24-month source horizon, `-$850,000.00` reserve less plan position, `0.291667` plan coverage ratio, `$1,000.00` annual reserve contribution per unit, `$83.33` monthly reserve contribution per unit, and `1.944444` reserve coverage of the accepted `$180,000.00` deferred-maintenance amount.

Gate 4F financial results create no renderer output, Boss mutation, CustomerSurfaceModel mutation, Delivery Gate change, Screening change, credit change, billing change, or publication mutation. The Source Truth compatibility view adds exact customer-safe document-treatment labels for the two new roles so accepted property-condition and historical-capital evidence cannot appear under a vague generic label.

Verification: Financial Intelligence `PASS`; support authority `PASS` with 37 scenarios; Source Truth pipeline, phase, and constitutional matrix `PASS`; full QA and production build `PASS`; Vercel budget `PASS 12 / 12`; diff integrity `PASS`.

Status: Gate 4F `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED`. Next bounded CVF slice is Gate 4G atomic CustomerSurfaceModel, Boss, Contract QA, PDF Boss, Manifest, and Dashboard integration.

## July 16 Gate 4G CVF closure

Gate 4G adds `api/_lib/institutional-financial-intelligence.js` as the sole Gate 4 aggregate receipt owner and atomically cuts the canonical calculations into Projection, Boss, CustomerSurfaceModel, rendering, Report Contract QA, PDF Boss, Quality Manifest, and Admin incident projection.

Closed Gate 4G failure families:

```text
receipt marker or version alone unlocks customer output -> prohibited
sourcePresent silently becomes roleAccepted -> prohibited
accepted role without accepted fact becomes display-ready -> prohibited
eligible calculation lacks formula, required inputs, or provenance -> prohibited
reserve-per-unit calculation loses input provenance -> prohibited
downstream Projection reuses the legacy 5% reconciliation classification -> prohibited
Boss forbids canonical receipt-backed DSCR -> corrected
legacy no-receipt Boss silently authorizes DSCR -> prohibited
CustomerSurfaceModel loses a canonical calculation receipt -> hard fail
renderer reconstructs a financial value from payload aliases -> prohibited
Report Contract QA accepts a label with the wrong value -> prohibited
PDF Boss accepts HTML and PDF disagreement -> prohibited
Quality Manifest omits calculation receipts -> prohibited
Admin projection reconstructs financial facts from raw artifacts -> prohibited
optional support collapse blocks accepted core publication -> prohibited
unit-mix validation assumes only 1BR or 2BR source labels -> prohibited
```

The Gate 4G validator requires the complete consume-only policy plus section and calculation integrity. Every display-ready section proves `sourcePresent`, `roleAccepted`, `factAccepted`, `sourceBacked`, and `sectionDisplayReady` without conflating those meanings. Every eligible result remains finite, deterministic, formula-bound, required-input-bound, and provenance-bound.

All Gate 4 outputs remain optional to report-level publication. Missing, unreadable, conflicting, ambiguous, or incomplete support evidence collapses only the affected debt, reconciliation, or capital section. Valid canonical T12 and Rent Roll remain sovereign.

Status: Gate 4G `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Gate 4 is complete locally. Next bounded CVF slice is Gate 5A canonical institutional-underwriting input and scenario-policy authority.

## July 16 Gate 5A CVF closure

Gate 4G is committed at `d332c68`, with a Vercel pass reported by the user. Gate 5A adds the canonical institutional-underwriting scenario-policy contract and input contract without connecting any calculation or customer surface.

Closed Gate 5A failure families:

```text
Source Truth marker alone unlocks underwriting inputs -> prohibited
Gate 4 receipt marker alone unlocks underwriting inputs -> prohibited
mismatched Source Truth and Gate 4 job identities are combined -> prohibited
core-invalid evidence becomes underwriting-eligible -> prohibited
support role without one canonical primary becomes accepted -> prohibited
duplicate primary source becomes underwriting authority -> prohibited
conflicting support role selects a winner -> prohibited
narrow support-fact conflict leaves the disputed value eligible -> prohibited
accepted entry and adjudication decision disagree but the fact survives -> prohibited
adjudication rejects source backing but local evidence revives the fact -> prohibited
evidence excerpt disagrees with the accepted value but the value survives -> prohibited
missing numeric input becomes zero -> prohibited
accepted zero expense or occupancy becomes missing -> prohibited
acquisition LTV becomes maximum refinance LTV -> prohibited
acquisition interest rate becomes future refinance rate -> prohibited
current debt becomes future refinance debt -> prohibited
caller override creates a policy threshold or scenario -> prohibited
expense normalization occurs without approved policy -> prohibited
bridge, exit, or stress scenario is invented -> prohibited
optional underwriting ambiguity blocks valid core publication -> prohibited
legacy underwriting code becomes production authority -> prohibited
```

The scenario-policy contract authorizes only the accepted-source case without adjustment. Refinance constraints, normalization, scenarios, classifications, and return assumptions remain null and unauthorized. The formula registry records the future deterministic formula boundary but performs no calculation.

The input contract binds T12, Rent Roll, purchase assumptions, appraisal, Gate 4 debt, Gate 4 reconciliation, and Gate 4 capital inputs to exact upstream receipts. Every eligible Gate 5 bundle also requires canonical core publication authority. Input eligibility and policy eligibility remain separate so a complete source bundle cannot silently create a missing policy.

All support fact values fail closed to null unless canonical role acceptance, fact acceptance, exact accepted-entry and adjudication agreement, exact evidence binding, conflict state, duplicate state, and source identity all pass. Source-present but ambiguous evidence remains auditable without becoming source-backed.

Verification: Gate 5A smoke `PASS`; Financial Intelligence `PASS` with 8 smokes; full QA, parser, recovery, routing, production build, 37-scenario authority matrix, Vercel budget `12 / 12`, and diff integrity all `PASS`.

Status: Gate 5A `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Next bounded CVF slice is Gate 5B deterministic source-case operating underwriting and objective rent/vacancy bridge.

## July 16 Gate 5B CVF closure

Gate 5A is committed at `702c940`, and the exact commit is present on `origin/main`. Vercel automatic deployment was not confirmed because Vercel reported a GitHub integration outage. Gate 5B adds one immutable deterministic source-case analysis receipt without connecting any customer surface.

Closed Gate 5B failure families:

```text
marker-only Gate 5A object unlocks calculations -> prohibited
caller-supplied result or policy override changes the receipt -> prohibited
changed formula survives validation -> prohibited
changed result survives validation -> prohibited
changed provenance survives validation -> prohibited
missing source value becomes zero -> prohibited
accepted zero becomes missing -> prohibited
zero denominator produces a fabricated ratio -> prohibited
source-stated market rent difference becomes forecast rent growth -> prohibited
source-stated market rent becomes an achievability conclusion -> prohibited
physical vacancy becomes economic vacancy -> prohibited
unit-equivalent arithmetic becomes invented unit-row fact -> prohibited
expense normalization occurs without policy -> prohibited
bridge, exit, or stress case is invented -> prohibited
refinance proceeds or return analysis is calculated -> prohibited
risk classification or recommendation is created -> prohibited
optional analysis collapse blocks valid core publication -> prohibited
Gate 5B changes Screening or a customer renderer -> prohibited
legacy underwriting becomes production authority -> prohibited
```

The sole Gate 5B production owner is `api/_lib/deterministic-source-case-underwriting-analysis.js`. It requires the complete canonical Gate 5A input contract, preserves exact input provenance, records exact formulas and required canonical facts, and validates by deterministic reconstruction. Ten objective measures are supported across source-case operating, rent difference, and physical vacancy sections. Each unavailable dependent measure collapses to null with an exact reason code and cannot block report-level publication.

No expense normalization, economic-vacancy inference, rent-growth inference, scenario, refinance constraint, return, classification, recommendation, customer rendering, Screening behavior, Delivery Gate behavior, or terminal taxonomy changed.

Verification: dedicated Gate 5B smoke `PASS`; Financial Intelligence `PASS` with 9 smokes; full QA and production build `PASS`; parser, recovery, routing, Boss, CustomerSurfaceModel, Report Contract QA, PDF Boss, Quality Manifest, Admin projection, 37-scenario support-authority matrix, Vercel budget `12 / 12`, and diff integrity all `PASS`.

Status: Gate 5B `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Next bounded CVF slice is Gate 5C deterministic source-bound acquisition and appraisal valuation reference. Gate 5C cannot infer future value, an exit cap rate, appreciation, refinance proceeds, returns, risk, or a recommendation.

## July 16 Gate 5C CVF closure

Gate 5B is committed at `c38c91a`, with exact `origin/main` parity confirmed. Vercel automatic deployment was not confirmed during the reported GitHub integration outage. Gate 5C adds one immutable deterministic acquisition and appraisal valuation receipt without changing any downstream consumer.

Closed Gate 5C failure families:

```text
marker-only Gate 5A object unlocks valuation calculations -> prohibited
caller-supplied future value, exit cap rate, or recommendation changes receipt -> prohibited
changed valuation result survives validation -> prohibited
changed formula survives validation -> prohibited
changed provenance survives validation -> prohibited
T12 NOI, purchase-assumption NOI, and appraisal NOI are blended -> prohibited
source-stated cap rate is replaced by a derived rate -> prohibited
missing unit count becomes zero or blocks non-unit measures -> prohibited
missing purchase-assumption NOI collapses accepted purchase price arithmetic -> prohibited
missing appraisal NOI collapses accepted appraised-value arithmetic -> prohibited
zero purchase price or zero appraised value becomes a valid denominator -> prohibited
accepted zero or negative NOI becomes missing -> prohibited
negative appraised-value difference becomes a risk conclusion -> prohibited
arithmetic value difference becomes a discount or premium classification -> prohibited
appraised value becomes future or exit value -> prohibited
optional valuation ambiguity blocks valid core publication -> prohibited
Gate 5C changes Screening or customer rendering -> prohibited
legacy underwriting becomes production authority -> prohibited
```

The sole Gate 5C production owner is `api/_lib/deterministic-acquisition-valuation-analysis.js`. It requires the complete Gate 5A input contract and validates its entire receipt by deterministic reconstruction. Twelve objective measures are supported across acquisition reference, appraisal reference, and acquisition-versus-appraisal comparison sections. Every measure carries exact formula, facts, values, provenance, precision, collapse reason, and non-blocking state.

No market-value conclusion, future value, appreciation, exit cap rate, refinance proceeds, return, classification, recommendation, customer rendering, Screening behavior, Delivery Gate behavior, or terminal taxonomy changed.

Verification: dedicated Gate 5C smoke `PASS`; Financial Intelligence `PASS` with 10 smokes; full QA and production build `PASS`; parser, recovery, routing, Boss, CustomerSurfaceModel, Report Contract QA, PDF Boss, Quality Manifest, Admin projection, 37-scenario support-authority matrix, Vercel budget `12 / 12`, and diff integrity all `PASS`.

Status: Gate 5C `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Next bounded CVF slice is Gate 5D deterministic source-bound acquisition capital structure and equity reference. Gate 5D cannot use current debt as acquisition financing, promote acquisition terms into refinance policy, invent costs, calculate returns, classify risk, recommend action, or change customer output.

## July 16 Gate 5D CVF closure

Gate 5C is committed at `7705c46`, with exact `origin/main` parity confirmed. Vercel deployment was not verified in this turn. Gate 5D adds one immutable deterministic acquisition capital-structure receipt without changing downstream behavior.

Closed Gate 5D failure families:

```text
marker-only Gate 5A object unlocks capital-structure calculations -> prohibited
caller-supplied costs, payoff, equity, refinance, or recommendation changes receipt -> prohibited
changed result, formula, or provenance survives validation -> prohibited
debt-service incompleteness erases individually accepted capital facts -> prohibited
contradictory canonical purchase-price copies select a winner -> prohibited
proposed financing fact with mismatched source identity survives -> prohibited
missing purchase price becomes zero -> prohibited
missing LTV collapses non-LTV capital measures -> prohibited
missing fee collapses non-fee capital measures -> prohibited
missing unit count collapses non-unit capital measures -> prohibited
zero proposed loan becomes accepted positive financing -> prohibited
accepted zero lender fee becomes missing -> prohibited
purchase price less loan becomes total equity requirement -> prohibited
lender fee becomes an assumed equity use -> prohibited
current debt becomes acquisition financing or payoff -> prohibited
acquisition terms become refinance assumptions -> prohibited
loan above purchase price becomes an inferred risk classification -> prohibited
LTV disagreement becomes a recommendation -> prohibited
optional capital-structure ambiguity blocks valid core publication -> prohibited
Gate 5D changes Screening or customer rendering -> prohibited
legacy underwriting becomes production authority -> prohibited
```

The sole Gate 5D production owner is `api/_lib/deterministic-acquisition-capital-structure-analysis.js`. Ten objective measures are supported. Every measure carries an exact formula, accepted facts, values, provenance, precision, collapse reason, customer-surface prohibition, and non-blocking state. Lender-fee dollars are permanently cross-checked against the existing Gate 4 canonical calculation.

No closing costs, total equity requirement, fee funding source, current-debt payoff, refinance proceeds, return, classification, recommendation, customer rendering, Screening behavior, Delivery Gate behavior, or terminal taxonomy changed.

Verification: dedicated Gate 5D smoke `PASS`; Financial Intelligence `PASS` with 11 smokes; full QA and production build `PASS`; parser, recovery, routing, Boss, CustomerSurfaceModel, Report Contract QA, PDF Boss, Quality Manifest, Admin projection, 37-scenario support-authority matrix, Vercel budget `12 / 12`, and diff integrity all `PASS`.

Status: Gate 5D `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Next bounded CVF slice is Gate 5E canonical acquisition-cost, equity-basis, and return-readiness authority. Gate 5E defines eligibility only and cannot calculate returns or create customer output.

## July 16 Gate 5E CVF closure

Gate 5D is committed at `80974e0`, with exact `origin/main` parity confirmed. Vercel deployment was not verified in this turn. Gate 5E adds one immutable return-readiness authority receipt without changing downstream behavior.

Closed Gate 5E failure families:

```text
marker-only Gate 5B, Gate 5C, or Gate 5D object unlocks readiness -> prohibited
individually valid analyses from different Gate 5A inputs are combined -> prohibited
caller-supplied cost, hold, exit, return, or recommendation changes receipt -> prohibited
changed readiness, return value, semantic boundary, or provenance survives validation -> prohibited
source-case NOI becomes equity cash flow -> prohibited
purchase price becomes total acquisition uses -> prohibited
purchase price less proposed loan becomes total equity -> prohibited
lender-fee dollars create an inferred funding source -> prohibited
appraised value becomes future value or exit value -> prohibited
current debt becomes acquisition debt, exit payoff, or refinance proceeds -> prohibited
missing closing costs, hold period, exit value, or selling costs become zero -> prohibited
accepted zero lender fee becomes missing -> prohibited
missing optional support becomes a report blocker -> prohibited
incomplete acquisition uses become return-ready -> prohibited
incomplete initial equity basis becomes return-ready -> prohibited
incomplete annual equity cash flow becomes return-ready -> prohibited
incomplete exit proceeds become return-ready -> prohibited
cash-on-cash return is calculated without its complete bundle -> prohibited
equity multiple is calculated without its complete bundle -> prohibited
internal rate of return is calculated without dated cash flows -> prohibited
Gate 5E changes Screening, rendering, Admin, Delivery Gate, or terminal taxonomy -> prohibited
legacy underwriting becomes production authority -> prohibited
```

The sole Gate 5E production owner is `api/_lib/institutional-underwriting-return-readiness-contract.js`. It requires complete canonical Gate 5B, Gate 5C, and Gate 5D analyses with an exactly identical embedded Gate 5A contract. It retains six source-bound references, records seventeen unavailable authority fields as null, defines seven readiness bundles, and leaves seven return outputs null and unauthorized.

Every optional readiness failure is non-blocking. Valid core publication remains sovereign. No return metric, refinance proceeds, classification, recommendation, customer rendering, Screening behavior, Delivery Gate behavior, or terminal taxonomy changed.

Verification: dedicated Gate 5E smoke `PASS`; Financial Intelligence `PASS` with 12 smokes; full QA and production build `PASS`; parser, recovery, routing, Boss, CustomerSurfaceModel, Report Contract QA, PDF Boss, Quality Manifest, Admin projection, 37-scenario support-authority matrix, Vercel budget `12 / 12`, and diff integrity all `PASS`.

Status: Gate 5E `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Next bounded CVF slice is Gate 5F exact optional return-input source authority. Gate 5F may accept only exact source-evidenced acquisition costs, funding treatments, timing, cash flows, exit value, exit costs, and debt payoff facts. It cannot infer missing values or calculate returns.

## July 17 Gate 5F CVF closure

Gate 5F adds one quarantined, exact optional-return failure family for `closing_costs_percent` without creating customer output or a return calculation.

Closed Gate 5F failure families:

```text
unlabeled or non-quantified closing-cost language becomes a number -> prohibited
two different closing-cost percentages in one source select a winner -> prohibited
two accepted sources with different percentages reject the entire purchase role -> prohibited
missing closing-cost percentage becomes zero -> prohibited
accepted exact zero becomes missing -> prohibited
AI, parser, filename, artifact type, caller override, or prior report independently creates authority -> prohibited
evidence value and accepted value disagree but survive -> prohibited
Source Truth and adjudication values disagree but survive -> prohibited
non-authoritative or role-conflicted source creates return authority -> prohibited
return-only closing-cost percentage leaks into customer-compatible accepted facts -> prohibited
closing-cost percentage becomes closing-cost dollars -> prohibited
closing-cost percentage creates a funding treatment -> prohibited
one optional percentage makes acquisition uses or returns eligible -> prohibited
optional return-input failure blocks validated core publication -> prohibited
Gate 5F changes Screening, rendering, Admin, Delivery Gate, or terminal taxonomy -> prohibited
```

The Support Document Authority Adjudicator binds the field only to exact labeled source text. Source Truth stores it under `accepted_return_input_facts`, separate from customer-compatible `accepted_facts`. Cross-source disagreement is a narrow fact conflict: ordinary accepted purchase and financing facts remain available while only the optional return field collapses.

Gate 5A requires exact primary-role authority, exact Source Truth and adjudication value agreement, matching evidence on both receipts, and `returnInputSourceBacked: true`. Gate 5F then exposes only the percentage reference with provenance. Dollar closing costs remain null, every readiness bundle remains incomplete, and every return output remains uncalculated.

Verification: dedicated Gate 5F smoke `PASS`; Source Truth cutover smoke `PASS`; support-authority matrix `PASS` with 38 scenarios; Financial Intelligence `PASS` with 12 smokes; full QA and production build `PASS`; Vercel budget `12 / 12`; diff integrity `PASS` through `qa:full` before ledger update.

Status: Gate 5F `PASS LOCALLY / UNCOMMITTED / UNDEPLOYED / NO LIVE RETEST`. Next is Gate 6 Investment Committee Memo. Gates 6 through 11 remain unchanged. Gate 10 retains mandatory page-by-page institutional PDF certification covering every table, chart, column, number, heading, page break, spacing rule, and alignment defect that a sophisticated institutional investor would notice.
