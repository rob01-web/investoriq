# InvestorIQ Fresh-Chat Handoff — 2026-08-25

## Governing checkpoint
Current phase: **ELITE Full Underwriting final surgical polish — LOCAL ONLY**

Do **not** restart the repository/pipeline audit. The monster audit is complete.
Do **not** reopen completed ELITE work absent contradictory evidence.
Do **not** deploy, push, run production RETEST, invoke the production worker, re-enable Cron, or change pricing.
DocRaptor remains TEST mode where relevant.

## Page-count doctrine
There is **no report page cap**. InvestorIQ reports are content-driven. A valid report may be about 17 pages, 28 pages, or longer depending on the uploaded evidence and authorized analysis. Do not add filler to hit a length target and do not delete legitimate analysis to shorten the report.

## ELITE / Blackstone-inspired architecture
The current Stonebridge report contains the upgraded institutional architecture we built:
- Investment Committee Overview / Executive Investment Summary
- Primary Constraint and Source Reconciliation
- Key Metrics Snapshot / Underwriting Observations
- Operating Performance Intelligence
- Revenue Quality / Expense Structure / NOI & Margin Analysis
- Unit / Rent Concentration and Operating Evidence Visuals
- Scenario Basis
- Occupancy Stress
- Operating Expense Stress
- Cap Rate / Value Sensitivity
- Occupancy x Expense NOI Matrix
- Underwriting Driver Analysis / Compound Downside Context
- Transaction & Diligence Intelligence
- Debt Intelligence
- Current vs Proposed Debt Coverage
- Proposed Rate / DSCR Sensitivity
- Maturity Context / Debt Capacity Interpretation
- Renovation / CapEx context when supported
- Valuation Position & Reconciliation
- Appraisal Reconciliation when supported
- Source Appendix
- Source Register & Document Treatment
- Methodology & Data Transparency
- Quality Manifest

This is institutional structure inspired by the Blackstone work sample, not a literal copy. InvestorIQ must not invent unsupported IRR, MOIC, DCF, waterfall, hold-period returns, or BUY/SELL/HOLD recommendations.

## Stonebridge real-input validation
Historical failure fixture:
`tests\investoriq_validation_fixtures_UPLOADABLE\Final Attack Test 8`

Eight files:
1. `T12_Stonebridge_Lofts_Attack_Test_8.xlsx`
2. `Rent_Roll_Stonebridge_Lofts_Attack_Test_8.xlsx`
3. `Stonebridge_Assumptions.pdf`
4. `Current_Debt_Stonebridge.pdf`
5. `Stonebridge_Reno_Plan.pdf`
6. `Stonebridge_Appraisal_Summary.pdf`
7. `Stonebridge_Market_Survey.pdf`
8. `Stonebridge_Phase_I_ESA.pdf`

Latest local run reached:
`STONEBRIDGE_CANONICAL_BUILD=PASS`

Verified actual core facts:
- 64 units
- 60 occupied / 4 vacant
- 93.75% occupancy
- T12 GPR $1,612,800
- T12 EGI $1,500,000
- T12 OpEx $555,000
- T12 NOI $945,000
- Annual in-place rent $1,432,800
- Annual market rent $1,718,400
- Annual gross rent difference $285,600
- Expense ratio 37.0%
- NOI margin 63.0%
- Operating break-even occupancy ~34.41%

Independent debt/value math:
- Current annual debt service $471,000
- Current DSCR ~2.0064x -> 2.01x
- Proposed monthly debt service ~$56,354.10
- Proposed annual debt service ~$676,249.24
- Proposed DSCR ~1.3974x -> 1.40x
- Proposed debt yield 10.0%
- Proposed mortgage constant ~7.156%
- Implied value $13,500,000
- Price/unit $210,937.50 -> $210,938

Validation:
- Boss Contract PASS
- Customer Surface Model PASS
- Boss Render PASS
- Customer HTML PASS
- Routing decision = publish
- T12 valid = true
- Rent Roll valid = true
- publishAllowed = true
- fatal core count = 0

## Source-boundary proof
Purchase assumptions:
- Price $13.5M
- Proposed loan $9.45M
- 70% LTV
- 5.95%
- 30 years
- 0.85% fee

Current debt stayed separate:
- Balance $6.8M
- 4.85%
- 24 years remaining
- $39,250 monthly payment
- Maturity 2029-11-01

Appraisal stayed third-party context:
- $14.2M value
- $1.05M stabilized NOI
- 7.40% stabilized cap
It did not override purchase price or T12 NOI.

Market survey stayed context only and did not override Rent Roll market rents.

Renovation facts rendered as source facts only:
- Total budget $1.28M
- 1BR: 20 x $18,500, stated $225/month lift, Months 1-18
- 2BR: 18 x $24,000, stated $325/month lift, Months 1-24
- Common Area $210,000
- Exterior / Security $115,000
- Contingency $153,000

No ROI, payback, DCF, waterfall, equity return, value uplift, refinance, deal score, or recommendation was invented.

## Latest visual baseline
Latest files from Rob's machine:
- `InvestorIQ_STONEBRIDGE_CANONICAL_PREVIEW_20260824_193802.pdf`
- `InvestorIQ_STONEBRIDGE_CANONICAL_PREVIEW_20260824_193802.html`
- `InvestorIQ_STONEBRIDGE_CANONICAL_AUDIT_20260824_193802.json`

The PDF is valid and 17 pages. Chrome wrote ~996,570 bytes.
The later `Browser PDF generation failed with exit code .` message was a **wrapper false negative after the PDF already existed**, not an InvestorIQ report failure.

## Final surgical polish punch list
Build **one consolidated guarded patch**, not many tiny patches.

1. **Zero customer-facing em/en dash punctuation**
   - zero em dash punctuation
   - zero en dash punctuation
   - do not use dash punctuation in prose
   - preserve normal linguistic hyphens such as Going-In, In-Place, Document-Backed
   - preserve mathematical negative signs such as `-11.16%`
   - preserve ISO dates such as `2029-11-01`
   - preserve legitimate source-stated numeric ranges
   - final certification must scan normalized rendered customer text/HTML, not only source-code literals

2. Page 2:
   `Occupancy less Break-Even Occupancy` -> cleaner customer phrase such as `Occupancy Above Break-Even`, with math unchanged.

3. Page 3:
   remove mechanical/internal wording such as `established from governed operating inputs` and `governed going-in cap-rate reference`.

4. Pages 7-8:
   reduce repeated `SCENARIO ANALYSIS - NOT SOURCE EVIDENCE` labeling while preserving the scenario/source boundary.

5. Page 9:
   remove internal terms such as `governed scenario framework`, `governed deterministic stress family`, `Debt Intelligence upgrade`.
   Fix `Base 555,000` -> `Base $555,000`.

6. Page 11:
   Acquisition Request Context duplicates the ELITE Transaction Snapshot. Suppress/consolidate overlapping legacy presentation while retaining unique content.

7. Pages 12-14:
   suppress duplicate legacy debt presentation when ELITE Debt Intelligence is active.
   Keep facts/math and genuinely unique useful material.

8. Page 14:
   fix the contradiction:
   `Capital Plan and Reserve Position` says support lacks display-ready detail, while detailed renovation/CapEx rows render immediately below.
   Correct section state/composition.

9. Page 14:
   replace raw customer wording such as `Maturity Position: future` with natural institutional wording.

10. Page 15:
    normalize `-0.0%` to `0.0%` without masking real negatives.

11. Page 15:
    remove/fix `Not shown because supporting evidence is unavailable: cap-rate sensitivity`, because cap-rate sensitivity is visibly present in the scenario chapter. Do not fabricate a valuation-specific surface if not authorized.

12. Quality Manifest:
    fix misleading `Reduced / omitted sections: Core Source Reconciliation; Debt Capacity & Coverage` wording when ELITE replacement surfaces are visibly present. Customer manifest should describe what the reader actually received.

13. Methodology & Data Transparency:
    **keep it**, but do not force it back onto a dedicated mostly-empty page.
    It currently appears compactly in the Source Appendix.
    Pagination remains content-driven.

## Correct Stonebridge source-to-section mapping
- T12 -> operating performance, NOI, expenses, scenario base, valuation base
- Rent Roll -> units, occupancy, unit mix, rent positioning, source reconciliation
- Purchase Assumptions -> transaction terms and proposed financing
- Current Debt -> existing debt, current DSCR, maturity
- Renovation Plan -> CapEx budget, scope, stated lifts, timing
- Appraisal -> third-party valuation context and reconciliation
- Market Survey -> market-rent context only
- Phase I ESA -> environmental diligence context only

All 8 filenames appear in the Source Register.
Supporting-document count = 6.

Broad section/source mapping = PASS.

Two section-state/customer inconsistencies remain:
1. Capital Plan omission message despite visible renovation detail.
2. Quality Manifest reduced/omitted wording despite ELITE replacement surfaces.

## What the local Stonebridge run did NOT prove
It did not prove:
- website credit consumption
- coupon logic
- live production PDF support-document extraction
- Supabase job creation
- production worker execution
- production provider call
- production publication/delivery

Do not falsely claim those are certified.

## Coupon/credit issue
Rob currently has no Underwriting credits and his 100%-off coupon was not working.
Treat that as a separate issue.
Do not derail final local report polish with it.
After final Stonebridge local validation is clean, investigate coupon/credit behavior before final live end-to-end certification.

## NEXT
1. Inspect exact current renderer/composition inputs for the punch list.
2. Build ONE guarded final surgical polish patch.
3. Avoid protected worker/publication/authority code unless evidence requires it.
4. Run broad local regression/certification.
5. Re-run Stonebridge exactly once.
6. Perform final visual + math review.
7. If clean, close final report-polish phase.
8. Then address coupon/credits.
9. Then plan one deliberate final live upload -> parser -> worker -> publication certification when explicitly authorized.

Do not call the report finished merely because tests pass.
Visual PDF review remains mandatory.

BOOOOOOOOOOM.
