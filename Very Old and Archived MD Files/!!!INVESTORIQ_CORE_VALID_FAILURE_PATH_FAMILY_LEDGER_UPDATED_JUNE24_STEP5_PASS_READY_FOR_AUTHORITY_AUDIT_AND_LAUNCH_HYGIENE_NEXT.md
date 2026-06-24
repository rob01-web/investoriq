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
