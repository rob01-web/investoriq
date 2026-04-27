# InvestorIQ Master Context - April 2026

## 1. Current Product State
- InvestorIQ is in final validation and outreach-prep.
- InvestorIQ remains in pre-launch phase, April 2026, and is now days away from outreach to Ken Dunn.
- Screening report is materially compressed, document-driven, and positioned as a decision-grade screening memorandum.
- Underwriting report retains full debt, refinance, valuation, and scenario depth with deterministic inputs only.
- Live architecture is now confirmed as:
  - a Supabase-centered document pipeline
  - Stripe for entitlements / checkout
  - an admin-style worker for job progression
  - AWS Textract plus `pdf-parse` for extraction
  - deterministic parsers for structured artifacts
  - a tokenized HTML report renderer
  - DocRaptor for final PDF generation
- The current live runtime is not LLM-driven.
- No active OpenAI client / OpenAI API call exists in the present live code path.
- The imported master prompt file is currently used for version logging only, not live model generation.
- Current live report generation is primarily:
  - deterministic calculations
  - structured artifact reads
  - template / token replacement
  - section gating
  - DocRaptor rendering
- Forest City Manor Screening Test 14 is GREEN:
  - critical report-core launch blocker is materially resolved
  - cover now correctly shows 144 Units
  - asset class now correctly shows Multifamily - 144 Units
  - T12 values now publish correctly:
    - Effective Gross Income: $2,517,120
    - Total Operating Expenses: $793,685
    - Net Operating Income: $1,723,435
  - root display/count fix was in `api/generate-client-report.js`
  - `computedRentRoll` total-unit selection now prefers finite `rentRollPayload.total_units`
  - fallback to `rentRollUnits.length` only when parsed total is unavailable
  - this was display/count selection only: no parser changes, no T12 math changes, no extrapolation changes
  - prior active 144-unit / T12 corruption launch blocker is materially closed pending broader underwriting validation
- Forest City Manor Underwriting validation sequence materially improved debt and rent-roll integrity:
  - PurchaseAssumptions PDF correctly classified as `loan_term_sheet_parsed`
  - `api/parse/parse-doc.js` now extracts debt interest rate from explicit financing / interest-rate context, so 3.8% is no longer contaminated by 4.99% cap rate
  - `api/parse/parse-doc.js` now extracts `40-year amortization`
  - LTV remains 85 and refi / exit cap remains 4.99 from cap-rate labels
  - `node --check api/parse/parse-doc.js`: PASS
  - `api/generate-client-report.js` now supports partial loan-term assumptions through a separate weaker terms payload while leaving `hasUsableDebtPayload()` unchanged for DSCR / current-debt eligibility
  - rate, amortization, LTV, and refi / exit cap can feed refinance assumptions when document-derived
  - debt balance is not invented; DSCR / current debt remains not assessed without loan amount or outstanding balance
  - confirmed wording: `Debt terms were partially identified, but no debt sizing balance was provided; DSCR and current-debt service are not assessed.`
  - Forest City Manor Underwriting Test 17 is a meaningful underwriting integrity pass
  - explicit 144-unit asset count is preserved while partial/sample-derived full-property metrics are suppressed
  - 2.1% occupancy, 3 occupied units against 144, annual in-place rent contradiction, and false rent roll vs T12 GPR variance are gone
  - executive snapshot now shows Units: 144, Occupancy: DATA NOT AVAILABLE, Annual In-Place Rent: DATA NOT AVAILABLE
  - remaining caution: Rent Roll Distribution still shows sample-derived weighted averages / rent bands from the 4 parsed rows; not a current launch blocker if not used as full-property totals
- 124 Richmond Street Doberman validation sequence completed:
  - Screening Test 10 = GREEN
    - math verified
    - no debt/refi contamination
    - report tier and section labeling correct
    - remaining polish: final ASCII/typography cleanup and tighter "no assumptions" wording
  - Screening Test 11 = GREEN
    - all core math reconciled: EGI $192,960, OpEx $120,790, NOI $72,170, Expense Ratio 62.6%, NOI Margin 37.4%, Annual In-Place Rent $186,780, Annual Market Rent $219,240, Rent Gap 17.4%, Units / Occupied 12 / 12, Occupancy 100.0%
    - no debt/refi contamination appeared in the screening report
    - NOI wrap defect is visually fixed in the Screening Test 11 PDF
    - Screening Test 11 remains math-green and logic-green
    - the only new issue elevated after secondary review is the visible rent-lift rounding reconciliation defect
    - remaining issues are presentation / wording polish, not report-core blockers
  - Clean Underwriting Test 10 = GREEN with one real launch defect
    - debt/refi math checked out
    - rent roll/T12 alignment checked out
    - launch defect: NOI breakdown numeric wrap still broken
    - institutional polish flags: `Illustrative Capital Structure` wording, score calibration review, projection framing / risk tone alignment
  - Clean Underwriting Test 11 status revised after dual red-team audit:
    - strong engine / not yet IC-ready
    - two critical math defects elevated: break-even occupancy formula and DSCR threshold consistency
  - Messy Underwriting Test 10 = GREEN with two major catches
    - partial debt terms fail-closed behavior confirmed strong
    - no debt balance invention
    - new issues surfaced: composite score inflation problem, mojibake in `document-derived` text, and systemic NOI wrap bug
  - Messy Underwriting Test 11 did not expose a new catastrophic model-risk class
    - DSCR score inflation fix held under messy conditions: DSCR Not Assessed = 0/10, Composite Score = 70/100, and missing debt sizing no longer improves score
    - confirmed the same shared defects already found in clean underwriting: break-even occupancy defect, NOI wrap / rendering defect, rent-lift header collision, and rent-lift display reconciliation issue
    - messy debt gating behaved correctly: partial debt terms were identified, no debt balance was invented, DSCR / current debt service remained not assessed, and refinance debt sections were omitted / fail-closed where debt sizing was unavailable
  - Batch 1 Critical Math Integrity - VERIFIED PASS (Closed)
    - Clean Underwriting Test 12 passed: break-even occupancy corrected to 62.6%, occupancy cushion 37.4 pts reconciled, and DSCR lender minimum threshold aligned to 1.25x
    - Messy Underwriting Test 12 passed: break-even occupancy corrected to 64.5%, occupancy cushion 35.5 pts reconciled, and DSCR Not Assessed fail-closed behavior preserved
    - shared engine-level hardening confirmed: OpEx / EGI break-even basis fixed across underwriting paths and DSCR threshold inconsistency eliminated
    - Batch 1 was the highest model-risk batch and is now formally closed
  - Batch 2 retest - 124 Richmond Clean + Messy Underwriting Test 13:
    - 2B header collision fix verified
    - 2C rent-lift / displayed rent reconciliation fix verified
    - 2D interest-rate precision consistency fix verified
    - 2E Step 03 duplicate live processing row UX cleanup patch applied and smoke-tested
    - 2A NOI wrap defect resolved by converting NOI Breakdown to a 3-column layout and removing the visual bar column
    - Batch 2 is closed
    - no new hidden model-risk regressions surfaced; remaining issues are presentation / polish class, not core underwriting math defects
  - composite score inflation was patched in `api/generate-client-report.js`; missing debt sizing / DSCR NOT ASSESSED now adds `DSCR (Not Assessed) = 0/10` and expands the denominator so missing debt data cannot improve the composite score
  - resolved model-risk insight: missing debt sizing must not improve deal score; this scoring optics concern was likely to be questioned by institutional reviewers
  - Batch 3 cleanup is materially completed:
    - `document-derived` mojibake survivor removed
    - ASCII-safe typography sweep completed
    - `Illustrative Capital Structure` renamed to `Debt Structure Summary`
    - `Scenario Assumptions` renamed to `Scenario Inputs`
    - speculative / DCF wording tightened to scenario-conditioned language
    - low-score `PASS` defect corrected to `Outside Parameters`
    - `Refinance Failure Under Stress` renamed to `Refinance Shortfall Under Stress`
    - `Final Recommendations` renamed to `Final Observations`
    - Uploaded Files disclosure fix completed
    - hardcoded unsupported / excluded document-name list removed
    - public-facing "no assumptions" language softened to document-backed / framework-constrained wording
    - public `AI` language audit returned clean
    - public em dash / en dash audit returned clean
    - Pricing typography survivors cleaned: `Redirecting...` and `|` separators
    - public `refinance failure risk` wording changed to `refinance shortfall risk`
  - Batch 4 report-polish cleanup is completed:
    - DSCR Not Assessed now caps the score verdict at Review
    - supporting-doc coverage fallback wording tightened
    - footer, header, and document separators changed from middle dot to `|`
    - value-add language neutralized to sensitivity-based wording
    - `node --check api/generate-client-report.js`: PASS
  - Batch 5 Step 03 / worker cleanup is completed:
    - rendering-stage missing parsed artifacts now route to `failed`, not `needs_documents`
    - rendering transition changed to `rendering -> failed`
    - entitlement restore behavior preserved
    - hidden Dashboard upload-more-docs language neutralized to integrity-validation wording
    - `npm run build`: PASS
    - internal response metadata `blockedNeedsDocumentsCount` may remain but is not customer-facing
  - Step 03 smoke test materially passed:
    - Start new report: PASS
    - Step 03 shows only `Processing underway...` copy: PASS
    - no duplicate property / status row in Step 03: PASS
    - Active Jobs shows live statuses: PASS
    - Generate disabled during processing: PASS
    - no upload-more-documents wording on failures: PASS
    - published-state copy not directly confirmed; verify opportunistically during next regression
  - 124 Richmond final validation:
    - Screening Test 15: strong pass / sendable screening memo
    - Clean Underwriting Test 15: strong pass
    - Messy Underwriting Test 15: strong pass
    - NOI wrap is closed after visual screenshot verification; parsed text line breaks were false positives
    - unsupported docs were ignored correctly
    - DSCR Not Assessed / partial debt behavior held
    - remaining items are polish philosophy only: Sensitized / borderline severity, any survivor value-creation wording, softer value sensitivity framing, and score-calibration optics where DSCR / refi shortfall creates concern
  - Forest City Test 18 review:
    - Forest City Screening Test 18 and Underwriting Test 18 reviewed
    - T12 reconciles to source: EGI $2,517,120, OpEx $793,685, NOI $1,723,435, Expense Ratio 31.5%
    - footer middle dot is fixed in generated PDFs; footer now uses `|`
    - DSCR Not Assessed score cap works: Underwriting shows Review, not Within Underwriting Parameters
    - no fake DSCR was invented from partial financing terms
    - 4.99% cap rate carried from purchase assumptions
    - real issue: partial rent-roll sample leakage remains in Operating Profile / NOI Stability, which still use 75.0% and vacancy buffer from partial/sample rows even though Executive Snapshot suppresses occupancy as DATA NOT AVAILABLE
    - real issue: CapEx / renovation budget acknowledgment gap remains; uploaded CapEx should be structured into the renovation section or disclosed as uploaded but excluded / unstructured
- Website positioning, pricing copy, contact routing, and core report wording have been materially tightened for launch.
- Website copy and positioning have been hardened to remove legacy automation references and reinforce proprietary, document-driven positioning.
- Test 9 returned to green after the live `public.reports` persistence issue was corrected.
- Reports are generating successfully; stability and precision are now the top priority.
- Dashboard freeze history is now more precise:
  - controlled diagnostic containment isolated the worst freeze behavior to Dashboard-local render pressure, especially the old Report History table/rows subtree
  - authenticated session / global auth, the property input alone, and fetched report data alone were each ruled out as the primary cause during that isolation sequence
  - the old Report History table was replaced with a lightweight stacked list/card layout, which materially reduced the earlier catastrophic browser-freeze behavior
  - however, the freeze has now reappeared in live use and must be treated as an active blocker again rather than a solved issue
  - latest controlled diagnostic pass used `DASHBOARD_DIAG_MINIMAL = true` as the live isolate; startup mount had already been reduced to entitlements-only, but property input slowdown / recovery still appeared inconsistent
  - diagnostic mode stayed smooth after raw reintroduction of property input, Report History, in-progress jobs, latest failed / `needs_documents`, and Step 03 job status
  - current suspicion is no longer raw data rendering alone; stronger suspect is interactive / conditional UI coupling in the full normal Dashboard branch, especially heavier live Step 02 / Step 03 surfaces coexisting in one page tree
  - latest diagnostic work materially reduced catastrophic full-freeze behavior and shifted the investigation from a total freeze loop to targeted render-pressure / lag paths
  - sequential staged uploads, post-Generate uploaded-file teardown, and post-Generate property reset were each isolated as contributors, but not as sole root causes
  - the team pivoted away from endless single-line culprit hunting and restored the real Dashboard through the 4-section compartment model
  - `DASHBOARD_DIAG_MINIMAL` is now back to `false`, reactivating the normal 4-section Dashboard branch
  - initial live retesting after reactivation showed typing, clicking, reloading, refreshing, and generating reports materially smoother than the earlier catastrophic freeze period
  - stale diagnostic suppressions for `reportHistoryCards` and `readyReports` were removed so completed reports are again visible through Ready to Download and Report History / Archive
  - Dashboard remains a cautious launch-risk item until additional controlled live retesting confirms stability across more usage
- Worker single-run timeout issue was reproduced, and the route-specific `maxDuration` override for `api/admin-run-worker.js` in `vercel.json` remains in place.
- Today's worker-fix experiments then broke live generation and caused false extracting-stage failures / false `needs_documents`.
- The safest rollback boundary was confirmed to be file-level rather than whole-repo.
- Only `api/admin-run-worker.js` was reverted to the pre-worker-debugging version from before the failed worker experiments.
- Result:
  - report generation stability returned
  - pipeline is back to the last known-good state
  - current temporary operational reality is that the worker may still require 2 manual runs
- Launch decision:
  - do not touch worker logic again before launch unless a brand-new blocker appears
  - stability now takes priority over single-run worker perfection
- Dashboard auto full-page completion reload was tested, followed by a timing patch, and then fully reverted after regression risk / freeze return.
- A narrowly scoped Dashboard auto-visibility patch was also attempted in `Dashboard.jsx`:
  - tracked `hasActiveProcessingJob`
  - detected transition from `true -> false`
  - fired one isolated `fetchReports()` call
- That tiny reports-only completion refresh initially appeared to work in live testing.
- Freeze signs then returned shortly afterward, and the patch was fully reverted.
- Conclusion:
  - even the tiny reports-only completion refresh did not pass the launch-safety test
  - manual Refresh remains the locked pre-launch posture
- Current Dashboard status: recent testing was smoother, but freeze is not declared solved and remains a launch-risk confidence item.
- Dashboard is frozen for now: do not touch Dashboard until active `api/parse/parse-doc.js` launch blockers are resolved.
- Latest live Dashboard blocker status:
  - the earlier catastrophic freeze has been materially reduced
  - controlled retesting now needs to validate stability in the real branch before underwriting proof validation resumes
  - current interpretation points to broader Dashboard render pressure / coupling rather than one isolated bad line
- V1.0 Dashboard posture is now locked:
  - keep top Reload button
  - keep Report History Refresh button
  - no auto completion reload before launch
  - no automatic Report History completion refresh before launch
  - no more Dashboard sync experiments before outreach unless a brand-new blocker appears
- Dashboard UX containment selected for launch:
  - a copy-only helper note was added to the Report History card header area instead of further sync logic
  - helper copy now shown:
    - `Completed reports may take a moment to appear in Report History.`
    - `Click Refresh if needed.`
  - the note sits centered between the left heading block and the Refresh button
  - the note was intentionally darkened from the first too-faint version so it remains readable while still subordinate to the main heading
- Report-published launch notification path has now been successfully moved from AWS SES to Resend.
- Resend domain `investoriq.tech` was verified successfully.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` were added in Vercel.
- `RESEND_FROM_EMAIL` is set to `InvestorIQ <reports@investoriq.tech>`.
- One controlled live Screening report test was run after deployment:
  - report published successfully
  - report-ready email was received successfully
  - subject received: `Your InvestorIQ report is ready`
  - sender appeared as: `InvestorIQ <reports@investoriq.tech>`
- Conclusion:
  - Resend is now confirmed live and working for the launch-critical report-ready notification path
- Fresh live validation also confirmed the updated `report_published` email copy was received successfully.
- Current live publish email wording is now:
  - `Hello [FirstName],`
  - ``
  - `Your InvestorIQ report has been published and is now available in your dashboard.`
  - ``
  - `Please log in to review and download your report.`
  - ``
  - `Thanks,`
  - ``
  - `InvestorIQ Team`
- Website now includes business-day turnaround expectation copy on Pricing and Checkout Success.
- Multi-quantity Stripe checkout now works for Screening and Underwriting.
- Stripe webhook quantity entitlement creation was diagnosed through live Stripe metadata, Supabase inspection, and Vercel logs, then fixed.
- Fresh multi-quantity underwriting purchase now correctly creates 5 available underwriting credits in Supabase and shows 5 underwriting credits in Dashboard.
- Dashboard checkout-success banner copy has been updated from single-credit wording to quantity-neutral wording.
- Dashboard multi-quantity purchase has now been restored without reintroducing quantity selection on the public Pricing page.
- Public Pricing remains simplified with no public quantity selector, while authenticated Dashboard purchase flow again supports quantity selection.
- Signup page copy typo was corrected manually from `Screening & underwriting reports` to `Screening & Underwriting reports`.
- Underwriting document-derived cap-rate display precision issue is now fixed in the live output:
  - parser and math were already correct at `6.25`
  - the bug was a display-only rounding issue in `api/generate-client-report.js`
  - a narrow cap-specific display formatter was introduced
  - displayed refinance / exit cap labels now preserve exact parsed precision for that field family without changing parsing or math
- Recent Supabase inspection strongly suggests `report_purchases` is the real entitlement / source-of-truth ledger, while `profiles.report_credits` and related Dashboard credit displays may be stale, secondary, legacy, or misleading.
- Launch phase status: worker remains frozen in the last known-good rollback state, while final report review, notification verification, low-dollar live Stripe acceptance confirmation, and outreach-prep remain before outreach.

## 2. Locked Product Positioning
- InvestorIQ is a document-driven real estate decision engine for investors.
- Every conclusion must be traceable to uploaded documents.
- No BUY/SELL language.
- No speculation.
- No fabricated narrative.
- Deterministic math only.
- Fail closed when required inputs are missing.

## 3. Current Pricing
- Screening Report: $499
- Underwriting Report: $1,499
- Quantity purchase supported at checkout for both report types.
- One purchased report = one report credit.
- No subscription.

## 4. Core System Architecture
- Node-based backend/API layer drives parsing, report generation, admin actions, and payment flow.
- Supabase is the system of record for auth, database tables, storage, and generated report artifacts.
- Stripe handles checkout and report purchase entitlements.
- DocRaptor renders final HTML into production PDFs.
- Textract plus `pdf-parse` handle document text extraction and fallback parsing paths.
- Current live stack definitely includes:
  - Supabase
  - Stripe
  - DocRaptor
  - AWS Textract
  - `pdf-parse`
  - `api/admin-run-worker.js`
  - `api/parse/extract-job-text.js`
  - `api/parse/parse-doc.js`
  - `api/report-template-runtime.html`
  - `api/generate-client-report.js`
- Report generation in the confirmed live path is deterministic first, with optional narrative slots present in the renderer but not populated by the live worker path.
- `api/generate-client-report.js` supports optional narrative `sections`, but the production worker call does not populate them.
- End-to-end live report flow:
  - user purchases report entitlement via Stripe
  - webhook inserts unconsumed `report_purchases`
  - dashboard uploads files to `staged_uploads`
  - dashboard calls `consume_purchase_and_create_job`
  - dashboard calls `queue_job_for_processing`
  - worker claims queued jobs
  - extraction pass runs
  - structured parsers create artifacts in `analysis_artifacts`
  - worker advances statuses through rendering
  - `generate-client-report.js` reads artifacts, computes metrics, assembles HTML, and sends to DocRaptor
  - PDF is uploaded to `generated_reports`
  - `reports` row powers Report History

## 5. Current Report Rules
- Screening and Underwriting are separate report products, not layered versions of the same memo.
- Screening is a concise acquisition screening memorandum built from T12 and Rent Roll inputs.
- Screening currently:
  - requires T12 + Rent Roll
  - uses `screening_v1`
  - strips most underwriting-only sections
  - is primarily deterministic and compressed
- Underwriting is the full capital-risk report with debt structure, refinance capacity, valuation, and scenario depth when supporting documents exist.
- Underwriting currently:
  - requires T12 + Rent Roll + at least one supporting document
  - uses `v1_core`
  - can incorporate mortgage statement / loan term sheet / appraisal / property tax artifacts when parsed
  - uses active debt normalization / fallback between mortgage statement and loan term sheet
- Underwriting intake acceptance investigation is complete, and the ranked patch wave was executed in sequence with anchor-locked, minimal-diff changes only.
- Forest City Manor was the real-world proof case that exposed the underwriting intake contract mismatch and is now materially green after the parser / status-sync fixes:
  - readable PDF T12
  - XLSX rent roll
  - debt-style purchase assumptions PDF
  - broker email
  - renovation budget
  - failure was treated as a product-contract mismatch, not simply bad user documents
  - current locked truth now confirms:
    - Forest City Manor Underwriting Test 1 = `published`
    - Forest City Manor Screening Test 1 = `published`
    - latest `analysis_job_files` rows confirm:
      - T12 = `parsed`
      - Rent Roll = `parsed`
      - `loan_term_sheet` = `parsed` for the underwriting package
      - supporting unclassified docs remain `parsed_with_warnings` where appropriate
    - worker lifecycle advanced fully through:
      - `extracting`
      - `underwriting`
      - `scoring`
      - `rendering`
      - `pdf_generating`
      - `publishing`
      - `published`
    - generated PDFs exist for both reports
    - reports explicitly confirm T12 and Rent Roll coverage in output
- Final underwriting acceptance patch wave status:
  - Patch 1 passed: worker-side user-facing failure message precision in `api/admin-run-worker.js`
  - Patch 2 passed: live `loan_terms` routing normalized into `loan_term_sheet`
  - Patch 3 passed: dead core-doc fallback references removed from `api/parse/extract-job-text.js`
  - Patch 4 passed: T12 acceptance widened in the live path, after repeated correction when earlier attempts placed fallback logic in the wrong parser branch
  - Patch 5 passed: rent roll acceptance widened in the live path with strict fail-closed table-based parsing for non-spreadsheet rent rolls
  - Patch 6 passed: support-doc extraction contract mismatch corrected by storing full extracted text and using full text first in support-doc parsing / classification
- Implementation discipline for the underwriting patch wave:
  - pre-patch planning completed first
  - report-core remained materially green throughout
  - worker stayed frozen in the last known-good rollback state
  - no Dashboard sync experiments were performed during the underwriting acceptance patch wave
  - no refactors
  - one step at a time
  - failed patches were cleaned up before moving on
  - repo hygiene check was run before Patch 5 and came back clean
- Patch-review lesson from this wave:
  - multiple Patch 4 attempts produced false-positive summaries where the claimed fix did not match the actual saved file
  - final review discipline was pass / fail based on the real uploaded file, not the summary
- InvestorIQ does not "use only 3 documents."
- T12 and Rent Roll are the core required structured inputs.
- Debt terms / mortgage documents are incorporated when they are successfully parsed into structured fields.
- Additional supporting documents may be uploaded, but only recognized and structured inputs are incorporated into quantitative underwriting.
- Unsupported or unstructured documents are excluded from modeling rather than guessed from.
- One-and-done entitlement rule applies unless regeneration is triggered for system/support reasons.
- One-and-done product rule is now explicitly confirmed:
  - users do not upload additional documents after report generation begins as part of the normal product flow
  - the old missing-doc continuation / reminder workflow is legacy behavior and is no longer part of the intended launch model
  - if InvestorIQ cannot verify enough required source data to produce a defensible report, no report publishes and the report credit is automatically restored
  - if a defensible report is successfully generated and published from the submitted package, the credit is consumed
  - if a user later realizes they forgot optional documents after publication, that is not a system failure and requires a new report request
  - to retry after failed generation, the user must start a new report request and upload the complete document package again, including all required and supporting documents
  - V1 does not support supplementing a failed job with only selected replacement documents
- Preferred failed-generation copy:
  - `Generation halted due to document verification limits. InvestorIQ could not verify enough required source data from the uploaded documents to produce a defensible report. No report was published, and 1 report credit has been returned to your account. To try again, please start a new report request and upload the complete document package again, including all required and supporting documents. Do not upload only the documents you believe were unclear or unreadable, because each report is generated from a single complete upload package.`
- Narrative must be document-derived and supportable from parsed inputs.
- No fabricated data, no silent fallback assumptions, and no decorative filler sections.

## 6. Current Engine State
- Worker loop, extraction reuse, and parallel execution have been validated previously.
- Screening vs underwriting separation has been materially improved.
- Wrong report-type leakage in the executive summary was fixed and hardened.
- Screening compression removed valuation and refinance depth that belonged only in underwriting.
- Report wording across generator, runtime template, and PDF sections was tightened toward institutional, document-driven language.
- Pricing updated to $499 for Screening and aligned across frontend and Stripe.
- Website copy fully cleaned of legacy automation terminology and standardized to proprietary-system language.
- Em dash usage removed from all user-facing copy to maintain institutional tone.
- Public-facing contact routing has been migrated away from `hello@investoriq.tech` to department addresses.
- Test 9 failure was confirmed as a backend persistence issue, not a parsing, classification, or rendering failure.
- Live pipeline persistence was restored by adding the missing `report_type text` column to `public.reports`.
- Admin dashboard blank-screen crash was fixed by restoring local `loading` state in `src/pages/AdminDashboard.jsx`.
- Dashboard disclosure acceptance timestamp duplicate-response behavior now returns a fresh UI timestamp without altering stored `legal_acceptances` history.
- Dashboard auto-refresh polling has been removed in favor of manual refresh/reload actions.
- Analysis Scope Preview has been removed from the user dashboard UI.
- Failed Step 03 dashboard state now supports UI-only dismissal through local storage, with no report, job, or credit changes.
- Underwriting capability has been reconfirmed: refinance stress testing, DSCR, and cap-rate / valuation sensitivity are already present.
- Underwriting cap-rate consistency is now unified across refinance, debt structure, scenario analysis, and DCF.
- Messy Underwriting Test 32 reached production-pass status after:
  - unifying cap-rate source to the document-derived path
  - removing the invalid cap-rate dimension from the DSCR sensitivity grid
  - renaming misleading refinance "Coverage" labels to proceeds-vs-debt-balance language
  - correcting overstated coverage disclosure
  - adding unsupported / excluded input disclosure
  - removing recommendation-style "PROCEED" language in favor of neutral underwriting framing
- Worker loop / double-trigger behavior has been re-verified as fixed in the live path:
  - `api/admin-run-worker.js` uses `maxSeconds = 55`
  - single-run publish path is confirmed through `pdf_generating` -> `publishing` -> `published`
- Forest City Manor acceptance investigation remains the key real-world underwriting proof case:
  - package included a PDF T12 / operating statement, XLSX rent roll, purchase assumptions PDF with debt-style terms, broker email, and renovation budget
  - this package should feel acceptable to a serious investor / user
  - Textract / text readability was not the main issue
  - the underwriting failure exposed downstream acceptance / gating narrowness rather than simple user-error or unreadable source documents
- User-facing failure-message interpretation from the acceptance investigation:
  - `Missing structured financials: t12` is only partially accurate and materially misleading for packages like Forest City Manor
  - it hides the narrower truth that a readable PDF T12 was uploaded, but the live underwriting gate only trusts spreadsheet-format structured T12
- Stripe purchase flow is architecturally imperfect in code review but functionally validated in real-world usage:
  - 30+ live end-to-end checkout tests have already been completed through the real pricing page using 100% coupon flow
  - Screening and Underwriting entitlements have both been repeatedly confirmed working in practice
  - Stripe is not a pre-launch patch target unless a real bug is reproduced
- Dashboard Report History now uses a lightweight stacked list/card layout instead of the prior table-based render path.
- This Report History render-path replacement is a production stabilization fix applied after controlled freeze isolation, not a temporary diagnostic patch.
- Worker single-run timeout issue was reproduced live, and a route-specific `maxDuration` override for `api/admin-run-worker.js` in `vercel.json` remains in place.
- Single worker kick was previously thought fixed, but later live retesting disproved that and the failed worker experiments were rolled back.
- Current worker posture is intentionally frozen at the last known-good rollback state, even if that still means 2 manual runs in some cases.
- Dashboard completion auto-reload experiments were attempted and then fully reverted after regression risk / freeze return.
- Reverted manual-refresh Dashboard state is the locked V1.0 posture.
- The narrow completion-hook experiment in `Dashboard.jsx` was also tried and reverted:
  - tracked `hasActiveProcessingJob`
  - detected `true -> false`
  - fired one isolated `fetchReports()` call
  - initially appeared to work
  - freeze signs then returned
  - experiment was fully removed
- Launch-safe Dashboard containment now favors the centered Report History helper note over further sync logic.
- Deterministic vs narrative layer is now confirmed more precisely:
  - pure deterministic layer includes parsing, T12 / rent roll rollups, occupancy, NOI, expense ratio, NOI margin, DSCR, refinance stress, and scenario / deal-score / risk-register math
  - template replacement layer is `api/report-template-runtime.html` plus token replacement / section stripping in `api/generate-client-report.js`
  - narrative slots exist in the renderer but are mostly inactive in the live worker path because `body.sections` is not populated by production worker calls
  - true LLM-generated narrative is not active in the current live production path
- Cost / OpenAI clarification:
  - despite earlier assumptions, current codebase inspection indicates the live report path is not actively using OpenAI API
  - this matters for real variable-cost assumptions and future pricing analysis
  - current live variable cost is more likely concentrated in Stripe, Textract, DocRaptor, and infrastructure / storage
  - OpenAI API cost should not currently be treated as a confirmed live per-report cost unless a new active path is later introduced
  - this improves expected margins and makes modest transactional email spend acceptable if needed for reliable launch notifications
- Notifications / provider status:
  - report-published email path remains wired in code through the worker publish flow
  - Amazon SES production access was denied and the account remains in sandbox
  - scope of the provider cutover was intentionally kept narrow
  - `lib/email-ses.js` was not globally replaced
  - new helper `lib/email-resend.js` was added
  - the helper uses native `fetch` to call Resend
  - only the `report_published` send call in `api/admin-run-worker.js` was changed from `sendEmailSES(...)` to `sendEmailResend(...)`
  - obsolete missing-doc SES sends in `api/admin-run-worker.js` were later retired because that workflow no longer matches the live product model
  - the top-level worker import of `sendEmailSES` was removed from `api/admin-run-worker.js`
  - worker no longer imports `sendEmailSES`
  - current live `report_published` email wording was updated and validated live
  - subject remains `Your InvestorIQ report is ready`
  - sender remains `InvestorIQ <reports@investoriq.tech>`
  - Resend is now the preferred launch notification provider for report-published emails
  - launch-critical report-ready notifications are materially de-risked
  - obsolete SES worker exposure has been removed from the active publish path
  - `lib/email-ses.js` may still remain in the repo for now as legacy leftover code, but it is no longer part of the active worker path
  - broader final SES cleanup / deletion can happen later and is no longer a launch blocker
  - this removes SES sandbox / approval risk from the primary user-facing publish-notification flow
- Pricing page and Checkout Success page now include the business-day turnaround disclosure:
  - "InvestorIQ reports are typically delivered within 1 business day. Submissions received after business hours, on weekends, or on holidays begin processing on the next business day."
- Multi-quantity Stripe checkout now supports quantity selection for Screening and Underwriting.
- `api/create-checkout-session.js` now passes quantity into Stripe line items and metadata.
- Stripe webhook entitlement creation now writes one `report_purchases` row per purchased credit.
- Dashboard checkout-success banner copy is now quantity-neutral.
- Dashboard purchase flow now again supports quantity selection while the public Pricing page remains quantity-free.
- Screening heading leak is now fixed in the true live generation path.
- PDF brand spacing / kerning fix was applied through CSS letter-spacing adjustment only.
- Break-even occupancy investigation confirmed the formula itself can remain, while shared operating cushion logic was the actual bug.
- Shared operating cushion calculation now uses current occupancy minus break-even occupancy when current occupancy is available.
- Latest Doberman validation found NOI breakdown numeric wrapping is still a live launch-fix candidate.

### Prompt / Hallucination Risk Clarification (April 2026)

- Locked v7.1 master prompt policy exists and remains the governing prompt standard.
- Current system strength comes from structured-input-first generation, deterministic math, and fail-closed handling.
- Pre-launch risk is not classic hallucination inside the model logic.
- The larger risk is accidental late-stage wording edits introducing unsupported claims.
- Pre-launch patch style therefore remains:
  - anchor-locked
  - minimal diff
  - no broad narrative rewrites
  - deterministic only

### Recent Parsing & Underwriting Hardening (April 2026)

- Microscope review completed:
  - clean Screening
  - clean Underwriting
  - messy Underwriting
- Microscope review findings:
  - clean Screening math checked out against source documents
  - clean Screening surfaced wrong-report-type leakage in the heading: `Data Coverage & Underwriting Gaps`
  - clean Underwriting surfaced a real debt parsing bug where purchase price was being used as current debt balance instead of the parsed loan amount
  - messy Underwriting debt parsing and core math looked materially correct
  - underwriting PDFs surfaced a presentation issue in NOI breakdown numeric wrapping
- Debt document routing hardened:
  - Normalized `debt_term_sheet` -> `loan_term_sheet` in `parse-doc.js` to ensure consistent extraction path and artifact generation.
- Loan term sheet inference expanded:
  - `inferDocTypeFromText(...)` now supports compact lender-style debt summaries (e.g., "REFI TERMS", "Rate", "AM", "LTV") using signal-count + financing-pattern gating.
  - Prevents valid debt documents from falling into `supporting_documents_unclassified`.
- Loan amount extraction hardened:
  - `api/parse/parse-doc.js` fixed the clean underwriting loan amount parsing bug.
  - Fallback loan amount candidate now only applies when no explicit / compact loan match exists.
- Result:
  - Messy debt documents now correctly produce `loan_term_sheet_parsed` artifacts.
  - Clean underwriting debt balance no longer substitutes purchase price when an explicit loan amount is present.
  - Underwriting debt inputs (loan balance, rate, amortization, LTV) now route correctly from both clean and messy lender formats.
  - Screening heading was corrected from `Data Coverage & Underwriting Gaps` to `Data Coverage & Screening Notes`.
  - Underwriting NOI breakdown presentation was patched with nowrap on values / percentages to stop ugly numeric wrapping.
  - Header mobile-menu visibility was corrected by moving hamburger flex behavior into `className`, preventing desktop visibility.
  - Public pricing page cleanup completed:
    - removed quantity selector from the public pricing page
    - public pricing page checkout now hard-calls quantity `1`
    - copy changed to `Portfolio pricing available on request.`
- Final T12 numeric extraction hardening completed across ALL parsing layers:
  - Layer 1: `parseMoneyLike` fixed to ignore `%` tokens and adjacent numeric bleed
  - Layer 2: table parsing guarded with:
    - percent-column skip logic
    - >$1B sanity bounds to reject malformed concatenations
  - Layer 3: text extraction regex hardened in `api/parse/parse-doc.js`:
    - updated currency match to prevent trailing numeric capture bleed
    - new regex:
      `/\(?-?\$?\s*([\d,]+(?:\.\d{1,2})?)\)?(?!\s*\d)/`
    - ensures extraction stops before adjacent numeric tokens (e.g. `100%`)
- Result:
  - prevents concatenation bugs such as:
    - `$2,517,120 100%` -> `2,517,120,100` (now eliminated)
  - ensures clean isolation of financial values from mixed-format T12 rows
- Parsing system classification:
  - now considered **multi-layer hardened**
  - both text-based and table-based extraction paths are aligned and safe

### Latest Live Validation Status (April 2026)

- Screening Test 7 = GREEN
  - Screening remains green
  - heading correctly shows `Data Coverage & Screening Notes`
  - report remains materially document-driven and deterministic

- CLEAN Underwriting Test 7 = GREEN
  - clean Underwriting remains green
  - clean underwriting path remains materially document-driven and deterministic
  - underwriting reports now display `6.25%` consistently where the document-derived exit / refi cap is shown

- MESSY Underwriting Test 7 = GREEN
  - messy Underwriting remains green
  - messy Underwriting remains strong validation evidence of deterministic messy-doc handling
  - underwriting reports now display `6.25%` consistently where the document-derived exit / refi cap is shown

- Practical review conclusion
  - Screening Test 7 is showcase-ready
  - CLEAN Underwriting Test 7 is showcase-ready
  - MESSY Underwriting Test 7 is strong validation evidence of deterministic messy-doc handling
  - report-core quality is not the immediate concern right now
  - dashboard reliability has re-emerged as the bigger pre-outreach concern

- Vacancy investigation conclusion
  - clean-vs-messy underwriting difference was investigated
  - conclusion:
    - not a parser bug
    - not a hallucination issue
    - not a clean-path math bug
  - clean T12 simply did not contain a vacancy row
  - messy T12 did contain a vacancy row
  - InvestorIQ correctly did not invent vacancy for the clean file
  - this is working as intended under the document-driven / fail-closed doctrine

### Dashboard Performance Hardening (April 2026)

- Critical frontend freeze identified on Dashboard page during property name input.
- Issue was isolated to main-thread blocking caused by React re-render cycles on every keystroke.
- Root causes:
  - Controlled input (`useState`) triggering full dashboard re-render per keypress.
  - Large `jobs` array and derived UI recomputing on each render.
  - Polling effect tied to `jobs` dependency, creating repeated re-trigger loops.

- Fix approach:
  - Migrated property input from controlled state to ref-backed uncontrolled input:
    - `propertyNameRef` introduced to store live input value.
    - React state (`propertyName`) now updates only on blur / Enter.
  - Introduced `propertyInputRef` to directly manage DOM value when needed.
  - Updated analyze flow to use `effectivePropertyName` (ref-first fallback logic).
  - Cleared input deterministically post-submit across:
    - ref
    - state
    - DOM input value

- Auto-fill synchronization fix:
  - `needs_documents` recovery path updated to sync all three layers:
    - React state
    - `propertyNameRef.current`
    - input element value
  - Prevents desync between UI and internal state.

- Polling stabilization:
  - Replaced `jobs` dependency in polling effect with stable boolean:
    - `hasActiveProcessingJob`
  - Eliminates unnecessary interval resets and render churn.

- Result at that stage:
  - typing pressure was reduced without altering business logic
  - this was a meaningful stabilization step, but later live recurrence proved it was not the final root-cause closure

### Dashboard Render-Path Stabilization (April 2026)

- Controlled diagnostic isolation was extended beyond effects and auth/session hypotheses.
- Confirmed binary test sequence:
  - diagnostic shell: stable
  - header-only diagnostic mode: stable
  - header + property input: stable
  - header + property input + Report History table: froze
  - header + property input + Report History summary-only branch: stable
- Conclusion:
  - the old rendered Report History table/rows subtree was the primary frontend freeze trigger.

- Final applied stabilization in `Dashboard.jsx`:
  - temporary diagnostic gate was used for isolation and then turned off
  - `DASHBOARD_DIAG_MINIMAL` returned to `false`
  - temporary render trace was removed
  - temporary `SupabaseAuthContext.jsx` auth-listener diagnostic patch was reverted
  - normal Dashboard Report History non-empty branch now renders a lightweight stacked list/card layout instead of table markup

- Report History capabilities preserved:
  - refresh
  - loading state
  - empty state
  - download
  - issue
  - delete

- Classification:
  - this was a production stabilization fix, not just a diagnostic patch.

### Dashboard Freeze / Lag Status - Current Truth (April 2026)

- Current blocker status:
  - Dashboard usability remains an immediate launch-risk item, but current evidence has moved from catastrophic full-freeze behavior to broader render-pressure / coupling that was materially improved by the 4-section restoration.
  - After repeated diagnostic tests, the team stopped treating the issue as one remaining isolated bad line.
  - Sequential staged uploads, post-Generate `setUploadedFiles([])`, and the post-Generate property reset cluster were each investigated as Generate-linked contributors.
  - Skipping `setUploadedFiles([])` in diagnostic mode materially improved Generate responsiveness in at least one live run, indicating uploaded-file teardown was a major churn contributor.
  - Skipping the property reset cluster in diagnostic mode also appeared to reduce churn, but did not prove a single root cause.
  - The real normal Dashboard branch has now been reactivated with `DASHBOARD_DIAG_MINIMAL = false`.
  - Initial live retesting after reactivation showed typing, clicking, reloading, refreshing, and generating reports materially smooth, but the Dashboard is not yet declared permanently solved.
- Latest focused investigation inspected:
  - `src/pages/Dashboard.jsx`
  - `src/contexts/SupabaseAuthContext.jsx`
- Fresh controlled manual isolation pass:
  - a fresh manual isolation pass was performed directly in `src/pages/Dashboard.jsx`
  - `DASHBOARD_DIAG_MINIMAL` was actively used as the controlled live isolate
  - the delayed post-mount auto `fetchReports()` effect was removed so Report History no longer auto-loads on Dashboard mount
  - `reportsLoading` was moved to an idle/manual posture so Report History does not sit in a false loading state when reports are no longer auto-fetched
  - mount-time `fetchRecentJobs()` was removed again from the startup sync path during this pass
  - mount-time `fetchInProgressJobs()` was also removed from the startup sync path during this pass
  - mount-time `fetchLatestFailedJob()` was also removed during this pass
  - startup mount was therefore reduced to entitlements-only
- Result:
  - the Dashboard did not catastrophically freeze during this pass
  - however, typing into the property name box was still inconsistent
  - observed behavior was: slows down, then partially recovers / speeds back up again
- Main conclusion:
  - the property input itself is likely not the root cause
  - the stronger suspect is whole-page render pressure in `Dashboard.jsx`
- Interpretation:
  - this weakens the theory that the remaining issue is primarily mount fetch fan-out alone
  - this strengthens the theory that the remaining slowness may now be in the normal live Dashboard render tree itself
  - especially the normal non-diagnostic branch in `src/pages/Dashboard.jsx`
- Fresh diagnostic reintroduction sequence:
  - diagnostic shell remained smooth after reintroducing the property input
  - minimal raw Report History remained smooth
  - minimal raw in-progress jobs remained smooth
  - minimal raw latest failed / `needs_documents` surface remained smooth
  - minimal raw Step 03 job status remained smooth
- Current interpretation:
  - raw data rendering alone does not appear to be the remaining culprit
  - the stronger suspicion is interactive / conditional UI coupling in the full normal Dashboard branch
  - likely pressure area is the heavier live Step 02 / Step 03 interface and how those sections coexist in one page tree
- Controlled diagnostic re-expansion completed:
  - Generate button restored in the diagnostic branch
  - Rent Roll upload control restored in the diagnostic branch
  - T12 upload control restored in the diagnostic branch
  - acknowledgement checkbox restored in the diagnostic branch
  - these were restored one step at a time to isolate remaining lag triggers
- Latest controlled live behavior:
  - fresh-login typing became fine after diagnostic-mode `reportHistoryCards` and `readyReports` short-circuits during the diagnostic pass
  - staged upload execution inside `handleAnalyze` was a Generate-only workload contributor, but not the sole root cause
  - uploaded-file teardown and property reset were confirmed as churn contributors during diagnostic isolation
  - the strategic conclusion shifted to broader shared Dashboard render pressure / coupling rather than endless single-line isolation
  - after `DASHBOARD_DIAG_MINIMAL` was flipped back to `false`, the real 4-section Dashboard branch became materially stable in initial live testing
  - worker kick testing did not itself introduce lag
  - confidence remains cautious pending additional controlled live retesting
- Latest Dashboard lag patches completed:
  - post-generate delayed fetch burst was reduced from `fetchInProgressJobs()`, `fetchRecentJobs()`, `fetchReports()`, and `fetchEntitlements()` to only `fetchInProgressJobs()`
  - diagnostic-mode `reportHistoryCards` and `readyReports` were temporarily short-circuited to `[]` during isolation, then those stale suppressions were removed after normal branch reactivation
  - Ready to Download and Report History / Archive now use real `reports` data again
  - diagnostic-mode `setScopeConfirmed(false)` effect now returns early when `DASHBOARD_DIAG_MINIMAL` is true
  - `fetchInProgressJobs()` now has an equality guard so unchanged active-job rows do not commit a new `inProgressJobs` array
  - `fetchReports()` now has an equality guard so unchanged report rows do not commit a new `reports` array
  - active -> inactive job transition now triggers a one-shot visibility refresh for `fetchRecentJobs()`, `fetchLatestFailedJob()`, and `fetchReports()`
- Latest Generate-path diagnostic patches completed:
  - diagnostic-mode staged upload skip tested inside `handleAnalyze` while preserving loop structure and `stagedFiles` shape
  - diagnostic-mode guard added so post-Generate `setUploadedFiles([])` is skipped only when `DASHBOARD_DIAG_MINIMAL` is true
  - diagnostic-mode guard added so the post-Generate property reset cluster is skipped only when `DASHBOARD_DIAG_MINIMAL` is true
  - `DASHBOARD_DIAG_MINIMAL` was then flipped back to `false` to reactivate the real normal Dashboard branch
- Current remaining risk ranking:
  1. broader Dashboard render pressure / coupling across live operational surfaces
  2. Generate-linked intake teardown and staged upload work if future testing shows lag returning
  3. report/job visibility coupling after worker completion, now mitigated by restoring real `readyReports` and `reportHistoryCards`
  4. acknowledgement acceptance path via `recordLegalAcceptance()` if checkbox-specific lag returns
- Ranked likely causes:
  1. whole-page render pressure rather than property-input state churn
  2. the normal live Dashboard render tree itself
  3. especially the normal non-diagnostic branch in `src/pages/Dashboard.jsx`
  4. heavier live Step 02 / Step 03 interactive and conditional surfaces
  5. query / refetch coupling around reports and jobs
  6. heavy normal non-empty Report History render path: lower confidence after raw history remained smooth
  7. realtime / subscription storm: low confidence
- Strategic Dashboard direction now locked for planning:
  - preferred direction is a compartment-based live layout rather than one large shared interactive surface
  - preserve existing InvestorIQ visual language: fonts, colors, branding, and premium / institutional styling
  - keep the existing Report History helper note:
    - `Completed reports may take a moment to appear in Report History.`
    - `Click Refresh if needed.`
- Preferred live Dashboard compartment model:
  - Top = Start New Report
  - Top-middle = Current Job
  - Bottom-middle = Needs Attention + Ready to Download
  - Bottom = Report History / Archive
  - active operational surfaces should be isolated from archive/history clutter
  - bottom archive should be calmer and lighter than the prior all-purpose history concept
- Recent published report handling decision:
  - newly published reports should first appear in a top-level recent / ready-to-download area
  - older reports should live in the lower archive/history area
  - avoid timer-based 72-hour client-side movement before launch
  - prefer state/priority-based compartments rather than time-based transitions
- Auto-refresh / live-zone posture:
  - existing 60-second active-job auto-refresh remains relevant to the live operational zone
  - limited live auto-update behavior should serve the top operational zone only
  - do not reintroduce broad full-page or full-history auto-refresh behavior before launch
- Compartment architecture work completed in `src/pages/Dashboard.jsx` under controlled diagnostic / anchor-locked minimal-diff discipline:
  - `data-dashboard-section="start-new-report"` added
  - `data-dashboard-section="current-job"` added
  - `data-dashboard-layout-slot="top-middle"` added
  - `data-dashboard-live-surface="current-job"` added
  - `data-dashboard-section="needs-and-ready"` added
  - `data-dashboard-layout-slot="bottom-middle"` added
  - `data-dashboard-action-surface="needs-attention"` added
  - `data-dashboard-action-surface="ready-to-download"` added
  - `data-dashboard-section="report-history-archive"` added
  - `data-dashboard-layout-slot="bottom"` added
  - `data-dashboard-reference-surface="report-history"` added
  - ready-to-download visible card added
  - ready-to-download empty-state copy added: `Completed reports will appear here.`
  - diagnostic heading copy corrected from `Latest failed / needs documents` to `Latest failed job`
  - these changes were structural seams intended to reduce render coupling while preserving InvestorIQ visual language
- Safest next work:
  - investigate Dashboard status-truth alignment between `inProgressJobs`, `recentJobs`, `latestFailedJob`, and `reports`
  - determine why the same job can appear as `needs_documents` in Step 03 while also appearing as `queued` in Active Jobs
  - determine which status/source becomes orphaned after worker runs and why jobs can still disappear after full page refresh
  - only after Dashboard confidence is good, resume underwriting proof validation, especially Forest City Manor

### Dashboard Stability Findings (April 2026)

- Root cause category identified:
  - frontend state churn / polling re-render pressure
  - the freeze reproduced while the page was idle, which points away from backend execution as the direct UI-freeze trigger
- Key breakthrough:
  - idle freeze / flicker behavior was materially reduced after `fetchInProgressJobs()` stopped committing unchanged active-job arrays
  - this identified repeated frontend state commits as a primary Dashboard stability issue
- Confirmed behavior:
  - the page could freeze or lag even without active typing, upload, or Generate interaction
  - after the `inProgressJobs` equality guard, a long idle session of roughly 5 hours remained stable

### Dashboard Stability Patches Applied

- `fetchInProgressJobs()` equality guard:
  - added a deterministic comparison over active-job fields used by Dashboard rendering
  - unchanged active-job fetch results now return the previous `inProgressJobs` array instead of committing a new array
  - result: significant reduction in idle flicker / lag
- `fetchRecentJobs()` equality guard:
  - added a deterministic comparison over `recentJobs` fields used by Dashboard selection / lifecycle rendering
  - unchanged recent-job fetch results now return the previous `recentJobs` array instead of committing a new array
  - intended to reduce unnecessary re-renders from unchanged `recentJobs` payloads
- `fetchReports()` equality guard:
  - added a deterministic comparison over fields selected for report rendering: `id`, `property_name`, `report_type`, `created_at`, and `storage_path`
  - unchanged report fetch results now return the previous `reports` array instead of committing a new array

### Dashboard Visibility Restoration Work

- Mount-time restore currently includes:
  - `fetchEntitlements()`
  - `fetchInProgressJobs()`
  - `fetchLatestFailedJob()`
  - `fetchRecentJobs()`
- Mount-time restore still intentionally excludes:
  - `fetchReports()`
- Post-generate restore currently includes:
  - `fetchInProgressJobs()`
  - `fetchEntitlements()`
  - `fetchRecentJobs()`
- Active -> inactive transition restore:
  - when `hasActiveProcessingJob` changes from `true` to `false`, Dashboard now runs:
    - `fetchRecentJobs()`
    - `fetchLatestFailedJob()`
    - `fetchReports()`
  - this is intended to restore non-active job visibility and completed-report visibility without broad mount-time report refresh

### Dashboard Data Source Model

- `inProgressJobs`:
  - active pipeline only
  - currently covers `queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, and `publishing`
- `recentJobs`:
  - broader lifecycle states
  - includes `needs_documents`, active statuses, `published`, and `failed`
- `latestFailedJob`:
  - failed only
  - does not cover `needs_documents`
- `reports`:
  - published report artifacts only
  - powers Ready to Download and Report History / Archive
- Important:
  - these Dashboard sources are not fully synchronized
  - visibility depends on correct timing and selection logic across the separate sources

### Dashboard Current Known Issues

- Status contradiction:
  - Step 03 contradiction bug was traced to mixed-source `activeJobForRuns` fallback logic
  - unrelated fallback rows (`inProgressJobs[0]`, `visibleLatestFailedJob`) were removed from `activeJobForRuns`
  - however, live testing showed Step 03 is still too tightly coupled to `selectedReportType` / selected `jobId`
  - current product truth is now clearer:
    - Step 01 selection should control new intake only
    - Step 03 must behave as a true current-job surface, not a selected-report-type surface
  - stale failure pinning was then traced further to the report-type selector itself:
    - `recentJobs` filtered by `selectedReportType`
    - selector explicitly preferred older `needs_documents` rows
  - patch applied in `src/pages/Dashboard.jsx`:
    - removed the old `preferredNeedsDocsJob` preference
    - current selection now uses:
      - `const preferredJob = typedJobs[0];`
  - result:
    - Step 03 no longer hard-pins itself to an older `needs_documents` row for that report type
- V1-invalid `needs_documents` presentation:
  - customer-facing `needs_documents` remains invalid for V1
  - Step 03 still has remaining user-facing `needs_documents` display paths that should be converted to failed / system-side messaging instead
- Dashboard freeze / lag:
  - freeze remains an active launch blocker
  - the new `fetchRecentJobs()` equality guard was added as a targeted churn-reduction patch, but freeze is still not yet declared solved

### Dashboard Restoration Status

- Fully restored:
  - 4-section Dashboard structure
  - real normal Dashboard branch with `DASHBOARD_DIAG_MINIMAL = false`
  - major idle stability after the `inProgressJobs` equality guard
- Partially restored:
  - job lifecycle visibility
  - post-generate refresh behavior
  - completed-report visibility after active processing ends
- Still reduced / cautious:
  - mount-time `fetchReports()`
  - broad report auto-refresh
  - Report History remains manual-first

### Dashboard Next Investigation Target

- Investigate Dashboard freeze / lag closure first, then finish status-truth alignment.
- Determine:
  - how to make Step 03 show the real active job regardless of selected report type
  - how to remove remaining user-facing `needs_documents` display paths in Step 03
  - whether the next safe fix belongs in selection logic, source reconciliation, or a narrower fetch timing adjustment

### Latest Dashboard + Worker Reality Update (April 2026)

- Dashboard status-truth investigation was completed in the real 4-section branch.
- Exact Dashboard source model was confirmed:
  - `inProgressJobs` = active pipeline only
  - `recentJobs` = broader lifecycle including `needs_documents`
  - `latestFailedJob` = failed only
  - `reports` = published artifacts only
- Exact orphaned lifecycle state was confirmed as `needs_documents`.
- Exact reload visibility gap was confirmed: mount-time Dashboard initialization did not fetch `recentJobs`, so `needs_documents` could disappear after refresh even when still present in the database.
- A narrow mount-time visibility restore was applied in `src/pages/Dashboard.jsx` by adding `fetchRecentJobs()` back into the mount `syncEverything()` path.
- Result:
  - `needs_documents` no longer disappeared on refresh
  - lifecycle visibility was restored
- However, the Dashboard freeze later reappeared again in live use after that change.
- Current interpretation:
  - lifecycle visibility gap and freeze root cause are separate problems
  - the freeze is still the top launch blocker
- A targeted churn-reduction patch was then applied:
  - `fetchRecentJobs()` now uses a serialize-and-compare equality guard, matching the existing pattern already used for `fetchInProgressJobs()` and `fetchReports()`
  - this was intended to reduce unnecessary re-renders from unchanged `recentJobs` payloads
  - freeze is still not yet declared solved
- Product-contract clarification is now locked more explicitly:
  - `needs_documents` is NOT a valid customer-facing V1 endpoint
  - users cannot upload additional documents after generation begins
  - one purchase = one generation
  - second run occurs only from admin when InvestorIQ failed on its side
- Dashboard status/source reconciliation also progressed:
  - Step 03 contradiction bug was traced to mixed-source `activeJobForRuns` fallback logic
  - unrelated fallback rows (`inProgressJobs[0]`, `visibleLatestFailedJob`) were removed from `activeJobForRuns`
  - live testing then showed Step 03 is still too tightly coupled to `selectedReportType` / selected `jobId`
  - current product truth is now clearer:
    - Step 01 selection should control new intake only
    - Step 03 must behave as a true current-job surface, not a selected-report-type surface
- Fresh worker-path investigation confirmed:
  - there were exactly two live `needs_documents` assignments in `api/admin-run-worker.js`
  - the extracting-stage branch represented a system-side parsing / artifact failure, not a valid customer continuation state
  - the rendering-stage branch also represents an internal inconsistency / system-side failure bucket, not a true user-actionable missing-doc state
- Extracting-stage worker correction was applied:
  - extracting-stage `needs_documents` was converted to `failed`
  - extracting -> `needs_documents` transition artifact was converted to extracting -> `failed`
  - misleading continuation wording implying upload-more-later was removed from that branch
- Remaining worker follow-up:
  - rendering-stage `needs_documents` still exists and remains the next worker-status cleanup target once Dashboard freeze work is under control
- Dashboard wording polish decision:
  - bottom archive surface wording should now be:
    - section title: `Generated Reports`
    - subheading: `Archive`
- Ready to Download section decision and current status:
  - `Ready to Download` was investigated as a pure render surface over:
    - `const readyReports = reports.filter((r) => r.storage_path);`
  - investigation confirmed it has no fetch/effect/state coupling
  - safe patch shape chosen:
    - remove JSX only
    - do not remove `readyReports`
    - do not combine with wording changes
  - patch was then applied:
    - standalone `Ready to Download` render block removed from `src/pages/Dashboard.jsx`
- Forest City Manor was confirmed as a targeted underwriting blind spot rather than evidence of universal parser failure:
  - Screening Test 9 passed using a different property / document set
  - messy Underwriting Test 9 passed using a different property / document set
  - the issue was therefore framed correctly as a targeted Forest City Manor blind spot, not a system-wide messy-doc failure
- Exact Forest City Manor failure chain that was found and fixed:
  - `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` is triggered only when the worker does not see both core parsed artifacts:
    - parsed `rent_roll`
    - parsed `t12`
  - supporting docs are not part of the blocking gate for that failure code
  - initial Forest City Manor failure was not a universal parser failure
  - Forest City Manor used a PDF T12 / operating statement, XLSX rent roll, broker email PDF, purchase assumptions PDF, and renovation budget ODT
  - T12 parser hardening was applied for PDF / annual-summary operating statements
  - later investigation proved parser success artifacts were already being generated
  - the real blocking bug was `api/parse/extract-job-text.js` overwriting `analysis_job_files.parse_status` back to `extracted` after parse success
  - that overwrite affected non-spreadsheet files and could hit T12 / `loan_term_sheet` style documents
  - fix applied:
    - the two `parse_status: 'extracted'` updates in `api/parse/extract-job-text.js` are now guarded so they only apply for `NULL`, `pending`, or `uploaded`
    - this prevents overwriting `parsed` / `failed`
  - result:
    - Forest City Manor now publishes correctly
- Latest parser hardening steps:
  - Patch A: non-spreadsheet T12 parsing in `api/parse/parse-doc.js` now falls back from direct text extraction to already-extracted Textract tables via `parseT12FromExtractedTables(...)` before failing
  - this remains fail-closed: if fallback also fails, parser still fails
  - no worker gate changes
  - no fabricated data
  - Patch B: `parseT12FromExtractedTables(...)` was widened so Textract-table T12 detection now supports both month / YTD / trailing-12 tables and annual-summary operating statements
  - annual-summary support now recognizes header structure such as `annual total`, `annual`, `category`, `% of egi`, and `notes`
  - existing month/YTD path remains intact
  - downstream requirement that all four core T12 values must still be found before success remains unchanged
  - Earlier T12 parsed-status check hardening also happened in `api/parse/parse-doc.js` so the direct text success path no longer silently masks a failed parsed-status update
  - this hardening mattered, but the `extract-job-text.js` overwrite bug was the real final blocker
- T12 parsing is now fully hardened across:
  - direct text extraction
  - Textract fallback
  - table parsing
- Silent numeric corruption risk has been eliminated from the underwriting pipeline
- Parsing system now behaves deterministically under mixed-format financial tables (currency + % + adjacent numeric tokens)

### Worker Runtime and Dashboard Reload Posture (April 12, 2026)

- Worker timeout issue evidence:
  - first GitHub-triggered worker kick advanced a job into `extracting`
  - first `/api/admin-run-worker` invocation then hit `FUNCTION_INVOCATION_TIMEOUT`
  - second run completed the pipeline
  - root cause was runtime budget on `api/admin-run-worker`
  - fix applied in `vercel.json`:
    - route-specific `maxDuration` override for `api/admin-run-worker.js`
- Worker debugging timeline after the timeout fix:
  - original live issue:
    - worker needed 2 kicks
    - kick 1: `queued` -> `extracting`
    - kick 2: `extracting` -> `published`
  - investigation found:
    - extracting branch dispatched parsing and then immediately deferred
    - worker self-limited to `maxSeconds = 55`
  - first worker patch attempted:
    - refresh parse state after dispatch so the worker could continue in the same invocation
  - live retest failed:
    - valid jobs incorrectly landed in `needs_documents`
    - purchases / credits were restored
  - investigation confirmed stale pre-dispatch parsed booleans caused fall-through into `needs_documents`
  - second worker patch attempted:
    - post-refresh parsed-doc guard
  - live retest still failed
  - latest investigation confirmed why:
    - the current patch only rechecked inside `if (anyPending)`
    - `anyPending` only looked at `parse_status === 'pending'`
    - structured docs can be `extracted` at that point
    - refresh / recheck could therefore be skipped and valid jobs still routed to `needs_documents`
  - latest action before rollback:
    - a replacement local patch was prepared so structured `rent_roll` / `t12` in `pending` or `extracted` would both trigger refresh / recheck
    - that path was not kept; the worker file was later rolled back to the last known-good version after the failed experiments
- Latest live worker / UX symptom:
  - after clicking Generate Report, the job appeared at the top of the Dashboard as `queued`
  - after roughly 30-45 seconds and auto-refresh, it disappeared from that top section
  - it never visibly showed `extracting` in the Dashboard UI before disappearing
  - backend inspection showed jobs landing in `needs_documents`
  - credits / purchases were restored
  - this is a major UX / support risk because users are not clearly told where the job went or why

- Final worker outcome tonight:
  - worker-fix experiments caused false extracting-stage failures / false `needs_documents`
  - rollback boundary investigation confirmed the safest rollback target was file-level rather than whole-repo
  - only `api/admin-run-worker.js` was reverted to the pre-worker-debugging version from before the failed worker experiments
  - report-generation stability returned after that revert
  - pipeline is back to the last known-good state
  - current operational reality is that the worker may still require 2 manual runs
  - worker logic is now frozen in rollback state unless a brand-new blocker appears

- Report History auto full-page reload experiment:
  - attempted one-shot completion reload
  - attempted a follow-up delayed post-reload `fetchReports()` timing patch
  - freeze / regression risk returned
  - both patches were fully reverted
  - reverted manual-refresh Dashboard state was confirmed stable again

- Locked V1.0 Dashboard posture:
  - 60-second top-section in-progress polling remains
  - no automatic full page reload after completion
  - Report History remains manual refresh for V1.0
  - do not attempt more Dashboard synchronization experiments before launch

- Optional UX containment idea discussed:
  - add nearby guidance that completed reports may require Refresh
  - treat as optional and non-blocking
  - do not patch unless explicitly resumed later

### Stripe Quantity Checkout and Entitlements (April 12, 2026)

- Quantity selector (1-5) added to Pricing cards for both Screening and Underwriting.
- `api/create-checkout-session.js` now passes quantity into Stripe line items and session metadata.
- Webhook now creates one `report_purchases` row per purchased credit.

- Live bug investigation path:
  - Stripe metadata confirmed `productType=underwriting`, `quantity=5`, and valid `userId`
  - `report_purchases` initially showed 0 matching rows for the exact session
  - Vercel webhook logs exposed false-success behavior, then a NOT NULL constraint issue (`23502`)
  - first webhook fix removed false-success logging and stopped the null session-id strategy
  - final fix:
    - first entitlement row keeps exact `stripe_session_id`
    - rows 2..N use deterministic suffixed ids such as `sessionId#2`, `sessionId#3`, etc.

- Final live validation result:
  - 5 underwriting credits successfully created
  - Dashboard underwriting count updated correctly

- Business note:
  - when creating a coupon for Ken Dunn, quantity / offer behavior should be considered carefully so he cannot accidentally run more reports than intended

### Reports Query Schema Fix (April 2026)

- Dashboard reports were failing to load and causing UI freeze.
- Supabase error identified:
  - `column reports.status does not exist`

- Root cause:
  - Frontend query in `Dashboard.jsx` requested a non-existent `status` column from `public.reports`.

- Fix applied:
  - Removed `status` from all `.select(...)` calls on `reports`.

- Final query:

```js
.select('id, property_name, report_type, created_at, storage_path')
```

- Result:
  - reports load successfully
  - Supabase queries execute cleanly
  - this fixed one concrete query failure, but it did not permanently close the broader Dashboard freeze issue

### Dashboard Stability Investigation (April 10-11, 2026)

- A severe UI freeze was reintroduced on the Dashboard page, triggered when interacting with the property name input field.
- This session focused on controlled, evidence-based diagnosis rather than broad or speculative patching.

- Behavior observed:
  - Freeze occurs on focus OR shortly after typing/pasting
  - In some cases immediate lock, in others after several seconds of interaction
  - UI becomes unresponsive (cannot switch tabs or interact)
  - Visual flicker observed during freeze (likely repaint thrash)
  - After a report run, the page can become broadly unresponsive, not just inside the property input

- Confirmed NOT root causes:
  - Not strictly `onChange` related
  - Not resolved by uncontrolled input migration alone
  - Not resolved by removing `onFocus` handler
  - Not resolved by memoizing uploadedFiles filters
  - Not resolved by preflight useMemo conversions

- Confirmed findings from diagnosis:
  - Dashboard was polluted by abandoned `needs_documents` jobs with `property_name = null`.
  - Those ghost jobs were being created by `api/create-checkout-session.js`.
  - Checkout-created jobs were not reused later by the Dashboard flow.
  - Dashboard `recentJobs` selection was previously willing to choose null-name `needs_documents` rows.
  - Worker events themselves did not appear to be the primary issue.
  - The remaining freeze is not just a property-input bug; it appears to be a broader Dashboard UI / state-churn / reactivity problem.
  - The issue likely worsened because `Dashboard.jsx` has accumulated too many overlapping responsibilities and fetch/effect paths.

- Supabase / data findings:
  - Many `analysis_jobs` rows in `needs_documents` were confirmed to have `property_name = null`.
  - Successful published jobs were separate named rows.
  - This confirmed that stale `needs_documents` rows were abandoned ghost jobs, not the same published rows changing state.

- Changes applied during investigation:
  - Removed `onFocus` styling handler from property input
  - Disabled browser auto-features:
    - `autoComplete="off"`
    - `autoCorrect="off"`
    - `autoCapitalize="none"`
    - `spellCheck={false}`
  - Moved Google Fonts injection out of render and into module-level one-time injection
  - Removed `<style>{FONTS}</style>` from JSX
  - Removed one `needs_documents` auto-fill sync block (possible render trigger)
  - Cleaned JSX invalid `>` characters in UI text
  - Removed abandoned checkout placeholder `analysis_jobs` creation from `api/create-checkout-session.js`
  - Removed `jobId` from Stripe session metadata
  - Added Dashboard containment so `recentJobs` no longer prefers `needs_documents` rows unless `property_name` is non-empty
  - Reduced redundant `setPropertyName(...)` commits on Enter / blur when the trimmed value did not change
  - Delayed the post-analyze refresh burst to move heavy refresh work off the critical interaction path
  - Narrowed active polling to `fetchInProgressJobs()` only
  - Disabled the `jobId -> fetchRentRollCoverage(jobId)` effect for diagnostic containment
  - Removed `fetchRecentJobs()` from mount-time `syncEverything`
  - Removed `fetchReports()` from mount-time `syncEverything`
  - Added a separate deferred `fetchReports()` effect after mount
  - Added temporary render tracing at the top of `Dashboard.jsx`:
    - `console.log('DASHBOARD RENDER TRACE', Date.now());`
  - Tried a temporary diagnostic patch disabling the Supabase auth-state listener in `SupabaseAuthContext.jsx`

- Current status:
  - The diagnostic shell remained stable.
  - Header-only diagnostic mode remained stable.
  - Header + property input remained stable.
  - Header + property input + Report History table froze.
  - Header + property input + Report History summary-only branch remained stable.
  - Render trace did not show obvious runaway local render spam.
  - Authenticated session / global auth was not confirmed as the primary cause.
  - Property input alone was not the primary cause.
  - Fetched report data alone was not the primary cause.
  - Conclusion:
    - the old rendered Report History table/rows subtree was the primary frontend freeze trigger.
  - Final production state at that stage:
    - the old table-based Report History non-empty branch was replaced with a lightweight stacked list/card layout
    - repeated typing and refresh testing became stable enough to stop further speculative property-input tuning at that time

- Important:
  - No further Dashboard structural changes should be made without controlled isolation
  - Avoid broad refactors this close to launch

- Strategic interpretation:
  - Current concern is not that the backend cannot necessarily handle serious demand.
- Dashboard-local churn was real, but the catastrophic freeze was isolated more narrowly to the old Report History table/rows render subtree.
- The applied stacked-list replacement is treated as the operative stabilization fix.
- Dashboard should still be monitored during final validation, and the freeze can no longer be treated as fully closed.
- Latest live recurrence note:
  - dashboard was left open / idling for roughly 10 minutes
  - returning to the dashboard and typing in the property name box became very slow
  - the page then froze for roughly 2-3 minutes
  - user had to log out / recover
  - after logging back in, old reports were manually reduced down to only 3 visible history items as a containment test
  - it is not yet confirmed whether report-count reduction actually fixes the issue
  - current evidence suggests catastrophic freeze was materially reduced by the Report History render-path change, but the broader idle-time / state-churn root cause is still not fully closed
- If Ken Dunn responds positively and syndicate interest increases, Dashboard simplicity and controlled render-path discipline should remain part of future hardening.

## 7. Current Remaining Issues / Immediate Next Work
### Completed recent fixes
- Test 9 pipeline failure: completed.
- Dashboard disclosure accepted date/time fix: completed.
- Dashboard auto-refresh removal: completed.
- Analysis Scope Preview removal: completed.
- Active Jobs filtering and property-name fallback: completed.
- Report History `report_type` population for newly generated reports (replaces legacy status concept): completed.
- Admin issue / regen workflow wiring: completed.
- Admin dashboard blank-screen crash from missing `loading` state: completed.
- Cover-page REPORT TIER visibility/color fix: completed.
- Underwriting support-doc detection for page-13 coverage messaging: completed.
- Failed Step 03 dashboard-state dismissal: completed.
- Screening and Underwriting wording polish wave: substantially completed.
- Underwriting cap-rate consistency across refinance / debt grid / scenario / DCF: completed.
- Messy Underwriting Test 32 production-pass hardening sweep: completed.
- Report microscope review of clean Screening, clean Underwriting, and messy Underwriting: completed.
- Stripe checkout -> entitlement flow practical validation: completed.
- Checkout ghost-job creation removal: completed.
- Dashboard null-name `needs_documents` containment patch: completed.
- Property-name redundant state-commit reduction: completed.
- Post-analyze refresh deferral test: completed.
- Active polling narrowed to `fetchInProgressJobs()` only: completed.
- `jobId -> fetchRentRollCoverage(jobId)` effect diagnostic disable: completed.
- `fetchRecentJobs()` removed from mount-time `syncEverything`: completed.
- `fetchReports()` removed from mount-time `syncEverything`: completed.
- Separate deferred `fetchReports()` effect after mount: completed.
- Temporary Dashboard render trace insertion: completed.
- Temporary auth-listener diagnostic patch: tried; did not solve freeze.
- Report History render-path isolation sequence: completed.
- Old Report History table/rows subtree replaced with lightweight stacked list/card layout: completed.
- Temporary diagnostic gate disabled and Dashboard returned to normal route rendering: completed.
- Worker single-run timeout reproduction and route-specific `vercel.json` override: completed.
- Worker extracting-stage same-invocation continuation fix: attempted, failed live retest.
- Worker post-refresh parsed-doc guard patch: attempted, failed live retest.
- Worker extracting-stage `pending` or `extracted` refresh / recheck replacement patch: attempted during worker debugging, then superseded by file-level rollback to the last known-good worker state.
- Worker file-level rollback to pre-worker-debugging `api/admin-run-worker.js`: completed.
- Auto full-page completion reload experiment: attempted, caused regression risk, and fully reverted.
- Business-day turnaround copy added to Pricing and Checkout Success: completed.
- Multi-quantity Stripe checkout support for Screening and Underwriting: completed.
- Webhook quantity entitlement creation bug investigation and final fix: completed.
- Dashboard checkout-success banner copy updated to quantity-neutral wording: completed.
- Public pricing page quantity selector removal and copy cleanup: completed.
- Screening live heading leak fix in the true generation path: completed.
- PDF brand-spacing / kerning CSS adjustment: completed.
- Shared operating cushion calculation fix (`current occupancy - break-even occupancy`): completed.
- Dashboard-only multi-quantity purchase restoration while keeping public Pricing quantity-free: completed.
- Signup page copy typo fix (`Screening & Underwriting reports`): completed.
- Dashboard compartment seam wave in `src/pages/Dashboard.jsx`: completed.
- Ready to Download card and empty state (`Completed reports will appear here.`): completed during the compartment wave, then the standalone render block was removed later as a pure render-surface cleanup.
- Diagnostic branch Generate button, Rent Roll upload, T12 upload, and acknowledgement checkbox controlled reintroduction: completed.
- Post-generate delayed fetch burst reduced to `fetchInProgressJobs()` only: completed.
- Diagnostic-mode `reportHistoryCards` / `readyReports` short-circuit: completed during isolation, then removed after normal branch reactivation.
- Diagnostic-mode `setScopeConfirmed(false)` early return: completed.
- Diagnostic-mode staged upload skip inside `handleAnalyze`: tested; contributor identified but not sole root cause.
- Diagnostic-mode post-Generate `setUploadedFiles([])` guard: completed.
- Diagnostic-mode post-Generate property reset cluster guard: completed.
- Real 4-section Dashboard branch reactivated by flipping `DASHBOARD_DIAG_MINIMAL` back to `false`: completed.
- Completed-report visibility restored by removing stale `reportHistoryCards` / `readyReports` suppressions: completed.
- Batch 1 Critical Math Integrity: completed / verified pass.
- Break-even occupancy basis corrected from OpEx / GPR to OpEx / EGI and validated in Clean + Messy Underwriting Test 12.
- DSCR minimum threshold standardized to 1.25x and validated.
- Composite score inflation fix validated under messy underwriting conditions.
- Batch 2 Rendering / Presentation Integrity: materially closed.
- NOI Breakdown wrap defect resolved with the 3-column NOI Breakdown patch in `api/generate-client-report.js`.
- Step 03 duplicate live processing row cleanup patched and smoke-tested.
- Batch 3 public-language, disclosure, ASCII, mojibake, and score-label cleanup: materially completed.
- Batch 4 score / disclosure / footer / value-add polish: completed.
- Batch 5 Step 03 / rendering-stage `needs_documents` cleanup: completed.
- Batch 6A partial rent-roll sample leakage suppression: code-complete, pending Forest City retest.
- Batch 6A preserves explicit total units while preventing partial/sample rows from supporting full-property occupancy, occupied/vacant counts, vacancy buffer, row-derived occupancy, annual in-place / market rent totals, Rent Roll Distribution, or Data Coverage occupancy presence.
- Batch 6A validation: `node --check api/generate-client-report.js`: PASS.
- Batch 6A required retest: Forest City Screening / Underwriting should confirm 144 units remain preserved and occupancy / vacancy / distribution fail closed.
- Batch 6B CapEx / renovation acknowledgment:
  - audit found no live CapEx / renovation / budget classifier in the parser
  - generator queries `renovation_parsed`, but parser does not currently create it
  - CapEx / renovation docs can become supporting unclassified docs
  - launch decision: do not build a CapEx parser before launch
  - minimum launch behavior is disclosure-only when uploaded filenames suggest CapEx / renovation / budget / capital plan and no structured renovation input exists
  - no costs, rent lift, ROI, payback, or scope should be invented
  - disclosure patch is code-complete and pending regression confirmation

### Immediate agenda - April 12, 2026
- IMMEDIATE PRIORITY (UPDATED)
  1. Final Forest City / 124 Richmond regression suite
  2. Run final repo-wide Codex red-team audit
  3. Low-dollar Stripe test if outstanding
  4. Ken Dunn sample package review

- STILL OPEN
  - Forest City / 124 Richmond regression confirmation for Batch 6A and Batch 6B.
  - Final repo-wide Codex red-team audit before Ken Dunn.
  - Final three-report regression suite.
  - Low-dollar true live Stripe payment test if not yet completed.
  - Dashboard freeze remains a monitored launch-risk item, not solved.
  - Opportunistically confirm Step 03 published-state copy during next regression.
  - Optional later cleanup: SES helpers, entitlement table/source-of-truth cleanup, Dashboard auto-visibility, rent-roll sample relabel / suppression review, jurisdiction-sensitive rent-growth qualifier, and vacancy-adjusted concentration disclosure.
  - Final readiness check after report review and any real blockers are fixed.

### Before Ken Dunn outreach
- Screening test result - April 11, 2026
  - Successfully generated:
    - `124 Richmond Street (Screening Test 33)`
  - Quick review outcome:
    - structurally strong overall
    - no major missing-section issue observed from quick review
    - minor cosmetic note observed: brand text showed `INVEST ORIQ` spacing / kerning issue in parsed output

- Fresh final Screening PDF generated and approved.
- Fresh final Underwriting PDF generated and approved.
- Messy / mixed-document regression pass completed.
- Low-dollar true live Stripe payment test completed if not already verified.
- Homepage / sample-report replacements finalized if still pending.
- One final manual QA sweep completed:
  - report type labels
  - executive summary wording
  - updated wording appearing in live PDFs
  - no wrong-report references
  - no padded or robotic phrasing
  - no mojibake or typography regressions
  - no unsupported narrative claims
- Screening Test 7 reviewed and remains showcase-ready.
- CLEAN Underwriting Test 7 reviewed and remains showcase-ready.
- MESSY Underwriting Test 7 reviewed and remains strong deterministic messy-doc validation evidence.
- Dashboard freeze risk is no longer assumed resolved.
- Report-core risk is lower after Forest City Manor Screening Test 14 and Forest City Manor Underwriting Test 17, pending the next 3-report validation pass.
- Before messaging Ken Dunn, run a Final Codex Red-Team Audit across major production files:
  - hidden surprises
  - duplicate/orphaned logic
  - stale diagnostics
  - launch blockers
  - filebase hygiene
- Outreach email to Ken Dunn only after all items above are green.

### Exact next task / resume point
- Immediate resume point
  - final Forest City / 124 Richmond regression suite
  - run final repo-wide Codex red-team audit
  - low-dollar Stripe test if outstanding
  - Ken Dunn sample package review

- AFTER THAT
  - complete final readiness check
  - prepare website sample report placement only after blockers are closed
  - worker logic remains frozen in rollback state unless a brand-new blocker appears

- Use anchor-locked minimal diffs only.
- No refactors.
- No random patching.
- Codex investigation before worker / Dashboard / parser patches.
- Worker success flow remains protected.
- Dashboard remains manual-refresh / cautious posture.
- Patch only real regressions found.
- No Dashboard changes until report blockers are resolved.
- No report wording or valuation polish until debt / underwriting proof validation is complete.

### Launch Risk Flag (Dashboard)

- Dashboard freeze / lag is an active launch-risk item and must not be treated as solved.
- Historical pattern:
  - Report History render-path stabilization materially reduced the earlier catastrophic freeze behavior
  - later tiny completion-refresh experiments were reverted after freeze / regression signs returned
  - recent live use then showed the freeze reappearing again, including idle-time slowdown and a fresh freeze while typing into the property name box after logging back in
- Latest diagnostic pass:
  - startup mount was reduced to entitlements-only and diagnostic raw sections stayed smooth
  - raw data rendering alone is no longer the leading suspect
  - catastrophic full-freeze behavior is materially reduced
  - staged uploads, uploaded-file teardown, and property reset were each identified as Generate-linked churn contributors, but not sole root causes
  - the real 4-section Dashboard branch has been reactivated with `DASHBOARD_DIAG_MINIMAL = false`
  - stale completed-report suppressions were removed so Ready to Download and Report History / Archive use real `reports` data again
  - initial live retesting after reactivation was materially smoother, including Generate
  - idle freeze / flicker was materially reduced after the `fetchInProgressJobs()` equality guard
  - current critical issue is status-source mismatch: `needs_documents` can coexist visually with `queued`, and jobs can still disappear after worker runs / full refresh
  - worker kick did not cause lag in latest controlled testing
- Do not assume the Dashboard freeze / lag is solved until controlled retesting proves otherwise.

### Parsing System Status (April 2026)

- Rent roll hardening completed today and passed validation:
  - spreadsheet weak-coverage rent roll now fails closed before writing `rent_roll_parsed`
  - summary/totals contamination rows are skipped before unit/rent acceptance
  - summary keywords include: total, subtotal, grand total, average, avg
  - occupied/vacant/model/down checks are limited to first-label/non-unit context to avoid false skips of legitimate unit identifiers
  - status: PASS with caution
  - remaining caution: summary semantics only in non-`row[0]`/non-unit columns could theoretically pass without further evidence
- T12 hardening attempted today in `api/parse/parse-doc.js`:
  - spreadsheet T12 matrix candidate path now skips percent cells and rejects values over `1_000_000_000`
  - CSV `sumColumn` now skips percent cells and rejects values over `1_000_000_000`
  - CSV row-fallback `sumRow` now skips percent cells and rejects values over `1_000_000_000`
  - these patches are present in file truth
  - later bundled audit strategy closed the Forest City Manor Screening report-core blocker by Test 14
  - lesson reinforced: Repo-Wide Audit Mode is preferred over drip patches when repeated failures show a systemic bug class
- Forest City Manor Underwriting Test 16 / Test 17 validation:
  - partial loan-term debt assumptions can feed refinance assumptions without creating a debt balance
  - `hasUsableDebtPayload()` remains unchanged for DSCR / current-debt eligibility
  - partial rent-roll samples now preserve explicit total units while suppressing misleading full-property occupancy and annual rent metrics
  - Test 17 confirmed the debt partial-term wording remained intact and partial rent-roll contamination was materially contained

## 7.1 Reports Table Schema (Locked)

```text
id
user_id
property_name
storage_path
created_at
report_type
```

Notes:

- `report_type` is the only classification field (`screening`, `underwriting`)
- No `status` column exists in `public.reports`
- Any future queries must NOT reference `status`

## 8. Key Files
- `api/generate-client-report.js`
- `api/report-template-runtime.html`
- `src/lib/pdfSections.js`
- `src/pages/Dashboard.jsx`
- `src/pages/AdminDashboard.jsx`
- `api/admin/queue-metrics.js`
- `api/admin/run-eligible-jobs-once.js`
- `api/legal-acceptance.js`
- `api/admin-run-worker.js`
- `src/pages/Pricing.jsx`

## 9. Working Style / Patch Rules
- Anchor-locked patches only when possible.
- No refactors unless explicitly approved.
- Minimal diffs only.
- Fail on anchor mismatch rather than guessing.
- Deterministic changes only.
- No broad narrative rewrites in the final validation window.
- Preserve institutional tone and document-driven logic.
- We are too close to launch day to allow uncontrolled code churn.
- Minimal reversible changes only.
- One step at a time.
- No guessing.
- Anchor-based reasoning only.
- Token discipline applies: prefer compressed patch receipts over verbose Codex summaries.

## 10. Codex-First Workflow (Locked)

  - All investigation and code extraction should be performed by Codex first.
  - ChatGPT acts as:
  - verifier
  - reasoning layer
  - patch planner

  - Standard flow:
  1. ChatGPT provides micro-prompt
  2. Codex returns exact file-truth code
  3. ChatGPT analyzes and determines next step
  4. Only then propose anchor-locked patch (if needed)

  - Never skip Codex investigation for:
  - Dashboard logic
  - Worker logic
  - Parser logic

  - No direct guessing or speculative patches without Codex-backed file truth.
  
  ## 10.1 Codex Token Discipline / Compressed Patch Receipts (Locked)
  Status: Governing default protocol unless explicitly overridden.

  ## Purpose
  - GPT-5.5 Codex usage must conserve tokens aggressively.
  - Default operating mode is compressed patch receipts, not verbose patch explanations.

  ## Default Codex Return Format (Required Unless Explicitly Overridden)

  Codex should return SHORT FORM RECEIPT ONLY:

  A. Files changed
  - file path(s) only

  B. Patch summary (max 5 bullets)
  - grouped changes only
  - what changed, not full diff restatement
  - no repeated old/new snippets
  - no code blocks unless anchor mismatch occurred

C. Safety note
- one sentence only

D. Validation (if applicable)
- `node --check` pass/fail only

E. Retest checklist
- max 5 bullets
- concise verification only

### Prohibited by Default
Do NOT return:
- long explanations
- rationale essays
- repeated old/new snippets
- duplicate anchor restatements
- giant diff summaries
- unnecessary blast-radius prose
- token-heavy narrative explanations
- do not echo entire old/new snippets unless specifically requested

### Rule
- Default to compressed patch receipts unless FULL DIFF MODE is explicitly requested.
- Assume ChatGPT maintains master context and acts as:
  - verifier
  - reasoning layer
  - patch planner

### Standard Codex footer instruction
Use this in patch prompts by default:

Return SHORT FORM RECEIPT ONLY.
Do not restate code unless anchor mismatch occurred.
Optimize for token conservation.

### Reason
- Preserve GPT-5.5 usage budget
- Reduce Codex token burn
- Keep more budget available for audits and actual code investigation
- Prioritize file truth over verbose reporting

### Trigger Phrase
If prompt includes:
"Compressed Receipt Mode"

Codex should automatically use Section 10.1 format.

## 10.2 Repo-Wide Audit Mode (Locked)
Status: Governing escalation protocol when repeated failures indicate systemic risk.

Principles
- audit entire file before patching when repeated failures occur
- prefer bundled patch sets over drip patches when bug class is systemic
- repo hygiene / duplicate logic scan before launch outreach
- red-team audit before messaging Ken Dunn

Trigger condition:
Use Repo-Wide Audit Mode after two failed surgical patches in the same bug class.

## 10.3 Post-Launch QA Roadmap
- AI QA Safeguard Layer:
  - post-launch roadmap item, not a pre-Ken Dunn launch pivot
  - purpose: AI-assisted document QA to flag parser misses, unsupported report claims, uploaded-but-unused docs, source/report inconsistencies, and messy mom-and-pop / napkin-user document issues
  - AI may flag issues and recommend review actions
  - AI must not silently inject financial values into NOI, rent, occupancy, DSCR, debt, valuation, cap rate, refinance, or deal score
  - deterministic parser / calculation layer remains source of truth
  - admin approval or deterministic validation is required before any AI-identified financial value affects a report
- Manual Admin QA Gate:
  - V1.1 / immediate post-launch hardening option, not current pre-launch pivot
  - concept: reports remain private until admin approval; admin can inspect uploaded docs, run generation privately, QA PDF against source documents, then approve / publish
  - no customer-visible report or report-ready email until approval
  - current decision: do not pivot launch to this before Ken Dunn unless final validation reveals a fatal issue

## 11. Launch Readiness Snapshot
- Scenario coverage audit recommendation: Launch this week = CONDITIONAL.
- Launch conditions:
  - complete and validate CapEx / renovation uploaded-but-unstructured acknowledgment
  - run final regression suite
  - run final repo-wide Codex red-team audit
  - complete low-dollar live Stripe payment test if still outstanding
  - stop only if a new report-core math or document-integrity regression appears
- Current covered scenarios:
  - clean Screening
  - clean Underwriting
  - messy T12 extraction with fail-closed validation
  - full rent roll
  - partial rent roll sample with explicit total units
  - missing / partial debt terms
  - DSCR not assessed
  - rendering-stage failure remap to failed
  - Stripe quantity entitlement path
  - Dashboard visibility with caution
- Launch-ready now:
  - pricing and positioning are fully aligned with institutional positioning and proprietary-system messaging
  - screening vs underwriting separation is materially cleaner
  - contact routing is corrected
  - dashboard/admin support workflow is operational
  - Test 9 is back to green and pipeline/report creation is restored
  - core report engine is stable enough for final validation and outreach-prep
  - underwriting cap-rate consistency is fixed across refinance, debt structure, scenario analysis, and DCF
  - Screening Test 7 is green
  - CLEAN Underwriting Test 7 is green
  - MESSY Underwriting Test 7 is green
  - deterministic / no-hallucination / document-driven report behavior is validated
  - underwriting document-derived exit / refi cap labels now display exact parsed precision consistently, including `6.25%`
  - rent roll hardening is materially improved and currently pass-with-caution
  - Forest City Manor Screening Test 14 is green:
    - cover and asset class now show 144 Units
    - T12 values publish correctly at EGI $2,517,120, OpEx $793,685, NOI $1,723,435
    - unit-count display fix was in `api/generate-client-report.js` total-unit selection only
  - Forest City Manor Underwriting Test 17 is a meaningful integrity pass:
    - PurchaseAssumptions PDF is parsed as `loan_term_sheet_parsed`
    - 3.8% interest rate, 40-year amortization, 85% LTV, and 4.99% refi / exit cap are separated correctly
    - partial loan-term assumptions inform refinance assumptions without inventing debt balance
    - DSCR / current debt remains not assessed when loan amount or outstanding balance is absent
    - partial rent-roll sample no longer produces 2.1% occupancy, 3 occupied units against 144, annual rent contradiction, or false rent roll vs T12 GPR variance
  - 124 Richmond Screening / Clean Underwriting / Messy Underwriting Test 10 Doberman reviews are GREEN overall:
    - Screening Test 10: math verified, no debt/refi contamination, report tier / section labeling correct
    - Screening Test 11: financially sound and logic-green; all core math reconciled, no debt/refi contamination, NOI wrap visually fixed
    - Clean Underwriting Test 10: debt/refi math and rent roll/T12 alignment checked out
    - Messy Underwriting Test 10: partial debt terms fail-closed behavior confirmed, no debt balance invention
    - Batch 1 Critical Math Integrity is closed after Clean + Messy Underwriting Test 12
    - current true survivors: final Batch 6 regression confirmation, final red-team audit, final regression suite, low-dollar Stripe test if still open, and monitored Dashboard freeze risk
  - the underwriting acceptance patch wave is complete
  - multi-quantity Stripe checkout is now working
  - Stripe entitlement creation for quantity purchases is now working
  - launch-critical `report_published` email notifications are live on Resend and validated
  - obsolete SES worker exposure for the legacy missing-doc workflow has been removed
  - report-ready email wording now matches the actual one-and-done product model
- Still needed before Ken Dunn outreach:
  - confirm Batch 6A partial rent-roll sample fail-closed behavior in Forest City retest
  - confirm Batch 6B CapEx / renovation uploaded-but-unstructured acknowledgment in Forest City retest
  - run final repo-wide Codex red-team audit
  - run final three-report regression suite after those fixes
  - patch only real regressions found in final validation
  - worker remains in the last known-good rollback state, with stability prioritized over further pre-launch worker experimentation
  - preserve the Resend-backed `report_published` notification path as the launch notification default
  - accept that broader SES helper / config cleanup is optional later work, not a current launch blocker
  - accept that Dashboard remains in locked manual-refresh posture before launch
  - `needs_documents` refresh disappearance gap was fixed by restoring mount-time `fetchRecentJobs()`
  - `fetchRecentJobs()` now also has a serialize-and-compare equality guard to reduce unchanged-payload churn, but Dashboard freeze is still not declared solved
  - Dashboard freeze remains a monitor / cautious launch-risk item, not solved
  - customer-facing `needs_documents` is not an acceptable V1 endpoint
  - extracting-stage and rendering-stage `needs_documents` paths have been converted to `failed`
  - hidden Step 03 upload-more-docs language has been neutralized to integrity-validation wording
  - fetch reconciliation investigation still remains open and should not be handled through blanket restoration
  - no more Dashboard sync experiments before outreach unless a brand-new blocker appears
  - bottom completed-reports wording choice still remains open:
    - keep `Generated Reports` / `Report history`
    - or later change to `Generated Reports` / `Archive`
  - Ready to Download standalone JSX block was removed after it was confirmed to be a pure render surface with no fetch/effect/state coupling
  - Admin Dashboard still needs clearer worker-run visibility while worker may require multiple manual kicks
  - strict ASCII / typography cleanup where truly needed
  - low-dollar true live Stripe payment test if not yet completed
  - Final Codex Red-Team Audit is required before outreach:
    - repo-wide audit across major production files
    - hidden surprises
    - duplicate/orphaned logic
    - stale diagnostics
    - launch blockers
    - filebase hygiene
  - final readiness check and sample presentation readiness
  - outreach prep / pricing / notification / final polish items
