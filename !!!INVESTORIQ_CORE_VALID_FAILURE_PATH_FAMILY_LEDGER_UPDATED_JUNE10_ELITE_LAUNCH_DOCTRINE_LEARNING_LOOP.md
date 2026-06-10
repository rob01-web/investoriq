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
