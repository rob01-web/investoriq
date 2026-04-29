# InvestorIQ Master Context - April 2026

## 1. Current Product State
- InvestorIQ is in final validation and outreach-prep for Ken Dunn.
- Screening is the compressed, decision-grade memorandum; Underwriting retains deterministic debt, refinance, valuation, and scenario depth.
- Live generation remains deterministic and document-driven:
  - Supabase document pipeline
  - Stripe entitlements / checkout
  - admin-style worker for job progression
  - AWS Textract plus `pdf-parse`
  - deterministic structured parsers
  - tokenized HTML renderer
  - DocRaptor PDF generation
- No live LLM generation path exists in the report runtime.
- Strategic direction is now explicit:
  - repeated synthetic tests exposed real parser / file-format edge-case risk
  - do not pivot InvestorIQ toward AI-written underwriting or AI-generated report narrative
  - safe direction is narrow AI extraction recovery only
  - AI may help InvestorIQ read documents; AI may not become the source of financial truth
  - deterministic validation remains the gate before any AI-recovered values enter `analysis_artifacts`
  - P10 validated this doctrine in a production-like live flow: AI recovered a parser-unfriendly rent roll, but deterministic validation controlled acceptance and report math
  - P08 validated the same doctrine on T12-side document integrity: readable T12 values can be recovered or processed, but materially inconsistent T12 vs rent-roll scale must fail closed before publication
- Batch 6A.2 explicit rent-roll summary totals is CLOSED:
  - parser now writes `rent_roll_parsed.payload.totals` from explicit totals / summary rows
  - generator trusts verified explicit summary totals during partial-sample mode
  - detail-row-derived full-property metrics remain suppressed when rows are partial
  - Forest City validated state:
    - Units `144`
    - Occupancy `96.0%`
    - Annual In-Place Rent `$2,622,000`
    - Annual Market Rent `$3,148,800`
    - Rent-to-Market Gap `16.7%`
    - Rent Roll Distribution remains suppressed for the 4-row partial sample
  - Executive Snapshot annual in-place rent now correctly shows `$2,622,000`
- Exact document-derived cap-rate consistency is CLOSED:
  - Forest City shows `4.99% (document derived)` in basis and sensitivity base rows
  - 124 Richmond shows `6.25% (document derived)` in basis and sensitivity base rows
  - exact base cap rows are inserted when document-derived caps fall between benchmark rows
- CapEx / renovation disclosure validation is CLOSED:
  - uploaded-but-unstructured CapEx / renovation files are acknowledged by filename
  - no CapEx amount, scope, ROI, payback, rent lift, or modeled CapEx values are created unless structured inputs exist
  - Forest City acknowledged `ForestCityManor_RenovationBudget.docx`
  - 124 Richmond acknowledged `CapEx_Schedule_124_Richmond_Test.pdf`
- Final regression suite passed after the Richmond cap-rate follow-up.
- Layout polish is CLOSED:
  - cover page now shows a compact document count instead of a white documents box
  - full `Uploaded Files` list still appears later in the report
  - `Key Upside Drivers` and `Primary Constraints` stay with their bullets
  - redundant `NOI Breakdown` block is removed
  - `Deal Scorecard & Radar` no longer orphans from `Factor-Level Scores`
  - Refi / Debt template no-break wrappers are balanced
- Latest clean proof points:
  - `124 Richmond Street Underwriting Test 22` passed layout and financial regression
  - `Forest City Manor Underwriting Test 27` passed layout and financial regression
- Final repo-wide Codex red-team audit is complete:
  - no new report-core, parser, worker, or Dashboard blocker beyond the known monitored Dashboard risk
  - true blocker found and closed in `api/webhook.js`: duplicate Stripe event IDs are no longer treated as complete until expected `report_purchases` rows are confirmed
  - public-copy / mojibake launch-risk cleanup completed in:
    - `src/pages/CheckoutSuccess.jsx`
    - `src/pages/Pricing.jsx`
    - `src/App.jsx`
- `Final_Testing/` local-only synthetic QA fixture library now exists:
  - 11 fictional packages: P01 clean Screening, P02 clean Underwriting, P03 messy Underwriting, P04 partial rent roll with summary, P05 missing rent roll, P06 unsupported CapEx only, P07 conflicting documents, P08 glued-number T12, P09 overcomplete Underwriting, P10 AI rent-roll recovery, and the dedicated `SYNTH-QA-AI-UNDERWRITING-CONTROL` pack
  - fixtures are deterministic `.csv`, `.txt`, `.md` plus `MANUAL_EXPORT.md` notes only
  - no existing safe local/batch runner reads these folders directly; honest end-to-end testing remains manual Dashboard upload unless a future staging harness is built
- Dedicated AI Underwriting validation pack now exists at:
  - `Final_Testing/SYNTH-QA-AI-UNDERWRITING-CONTROL/`
  - intended subtests:
    - `01_positive_ai_rent_roll_underwriting`
    - `02_positive_ai_t12_underwriting`
    - `03_positive_dual_ai_recovery_underwriting`
  - goal is clean Underwriting validation of AI-assisted extraction recovery without reusing confusing mixed legacy packages
  - doctrine remains locked:
    - AI extraction only
    - deterministic validation remains the gate
    - no AI-written underwriting
    - no financial value accepted unless validation passes
- AI Rent Roll Recovery v0.1 is now implemented as a feature-flagged extraction fallback:
  - helper lives in `lib/ai-rent-roll-recovery.js`
  - `api/parse/parse-doc.js` uses it behind `ENABLE_AI_RENT_ROLL_RECOVERY=true`
  - helper uses `OPENAI_API_KEY` plus OpenAI Responses API through native `fetch`
  - AI output is candidate extraction only and is accepted only after deterministic validation
  - accepted AI recovery artifacts carry:
    - `method: ai_rent_roll_recovery_validated`
    - `ai_assisted: true`
    - `validated: true`
- AI T12 Recovery v0.1 is now implemented as a stricter feature-flagged extraction fallback:
  - helper lives in `lib/ai-t12-recovery.js`
  - `api/parse/parse-doc.js` uses it behind `ENABLE_AI_T12_RECOVERY=true`
  - helper uses `OPENAI_API_KEY` plus OpenAI Responses API through native `fetch`
  - scope is parser-unfriendly T12 / operating statement recovery only
  - it is not report generation, not narrative, and not underwriting conclusions
  - accepted AI recovery artifacts carry:
    - `method: ai_t12_recovery_validated`
    - `ai_assisted: true`
    - `validated: true`
  - deterministic T12 validation still gates acceptance:
    - finite EGI / OpEx / NOI
    - `EGI > 0`
    - `OpEx >= 0`
    - NOI finite
    - `EGI - OpEx ~= NOI`
  - T12 recovery is intentionally stricter than rent-roll recovery because it directly controls NOI
- Deployment / secret hygiene completed today:
  - initial AI helper location under `/api` triggered Vercel Hobby function-count failure
  - helper was moved out of `/api` into `lib/`, deploy returned green/current
  - initial live P10 failure after the `.txt` extraction patch was caused by missing `OPENAI_API_KEY` in Vercel Production while `ENABLE_AI_RENT_ROLL_RECOVERY=true` was already set
  - after adding `OPENAI_API_KEY` in Vercel Production and redeploying, P10 passed
  - first successful OpenAI usage was confirmed in the OpenAI dashboard at very low cost / token volume
  - narrow AI extraction fallback appears low-cost at current scale; material cost risk is still more likely in Textract, DocRaptor, Stripe fees, infrastructure, and support / admin time than in this AI layer
  - `RESEND_API_KEY` was rotated and marked Sensitive in Vercel after the Vercel security notice
  - old Resend key was revoked after the new production key was installed
  - do not rotate Stripe / Supabase / OpenAI / AWS / DocRaptor blindly mid-launch; one secret at a time only
- Naming convention is now locked:
  - use `SYNTH-QA-P## ...` for synthetic tests
  - reserve Richmond / Forest / Final Regression names for real proof assets only
- Dashboard failed-job guidance is now improved:
  - for visible failed jobs with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`, Dashboard performs a narrow read-only `analysis_job_files` lookup
  - friendly file-specific guidance is shown for T12, rent roll, or unknown core-document verification failures
  - raw parser codes are not exposed to users
- Current synthetic QA proof points:
  - `SYNTH-QA-P01 Clean Screening RETEST 1` = PASS
    - 6 units, `100.0%` occupancy, Annual In-Place Rent `$111,180`, EGI `$186,780`, OpEx `$69,907`, NOI `$116,873`
    - T12 and Rent Roll both fully verified
    - no underwriting-only leakage observed
  - `SYNTH-QA-P04 Partial Summary Rent Roll RETEST 2` = PASS
    - 144 units, `96.0%` occupancy, Annual In-Place Rent `$2,622,000`, EGI `$2,622,000`, OpEx `$898,000`, NOI `$1,724,000`, Rent-to-Market Gap `16.7%`
    - trusted summary totals remain intact
    - Unit-Level Value Add / Unit Mix Rent Lift suppressed
    - Rent Roll Distribution suppressed
  - `SYNTH-QA-P08 Glued Number T12 / Scale Mismatch` = PASS as fail-closed integrity test
    - T12 text explicitly contained EGI `$2,517,120`, OpEx `$1,246,880`, NOI `$1,270,240`
    - paired rent roll supported only 4 units and annual in-place rent `$73,260`
    - root issue discovered: coverage had been treated like consistency
    - correct fix was fail-closed document-consistency validation, not changing the numbers
    - final behavior after redeploy:
      - T12 values can be recovered / processed
      - worker cross-document gate catches the T12-vs-rent-roll scale mismatch
      - job fails closed with `DOCUMENT_FINANCIAL_SCALE_MISMATCH`
      - no new PDF is published
      - credit is restored
      - Dashboard shows a readable fail-closed message
  - `SYNTH-QA-P10 RETEST` = PASS
    - uploaded files:
      - `t12_clean_source.csv`
      - `rent_roll_parser_unfriendly_source.txt`
    - published successfully with stable classification
    - Units `8`, Occupancy `87.5%`, Annual In-Place Rent `$111,180`, Annual Market Rent `$122,160`
    - EGI `$111,180`, OpEx `$41,250`, NOI `$69,930`
    - Expense Ratio `37.1%`, NOI Margin `62.9%`
    - `CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Fully Verified`
    - T12 Operating Statement coverage `4/4`, `100.0%`
    - Rent Roll coverage `4/4`, `100.0%`
    - proved the live chain:
      - `.txt extraction -> document_text_extracted -> AI rent-roll recovery -> deterministic validation -> rent_roll_parsed -> published Screening report`
    - confirms AI is correctly limited to extraction recovery and did not become the source of underwriting truth
  - `02_positive_ai_t12_underwriting` = PASS / published / AI T12 Recovery proven live in Underwriting
    - job `8cf09b74-0a5b-4fb4-be65-c01e578f4fb7`
    - report `7df1f2bc-fd38-45c3-93a3-f9d55f93e5d7`
    - uploaded files:
      - `rent_roll_clean_control.csv` -> `rent_roll` -> `parsed`
      - `t12_ai_recovery_source.txt` -> `t12` -> `parsed`
      - `loan_terms_simple_source.txt` -> `loan_term_sheet` -> `parsed`
    - T12 artifact:
      - `method: ai_t12_recovery_validated`
      - `ai_assisted: true`
      - `validated: true`
    - validated report values:
      - EGI `$475,200`
      - OpEx `$181,500`
      - NOI `$293,700`
      - Units `24`
      - Occupancy `95.8%`
      - Loan amount `$4,200,000`
      - Interest rate `5.10%`
      - Amortization `30 years`
      - DSCR `1.07x`
    - conclusion:
      - AI T12 Recovery is now proven live in Underwriting
    - minor fixture mismatch noted, not a launch blocker:
      - published annual in-place rent showed `$476,100` while T12 EGI was `$475,200`
      - investigation conclusion: fixture variance only; rent roll sums to `$39,675/month` while T12 states `$39,600/month`
      - treat as later fixture cleanup or explicit documented variance, not parser / generator / AI bug
  - `01_positive_ai_rent_roll_underwriting` = OPEN / not yet proven in Underwriting
    - initial failure and `TEST 2` both failed on rent-roll verification
    - worker dispatch bug was found and patched in `api/admin-run-worker.js` so extracted `.txt` rent-roll files now dispatch into `parse-doc`
    - `node --check api/admin-run-worker.js` passed
    - post-worker-patch `TEST 2` still failed:
      - job `0ba307b6-bed4-4189-ae65-47594cf3f0dd`
      - `rent_roll_ai_recovery_source.txt` -> `rent_roll` -> `failed` -> `unsupported_file_type_for_structured_parsing`
      - `t12_clean_control.csv` parsed
      - `loan_terms_simple_source.txt` parsed
      - entitlement restored
    - current conclusion:
      - worker dispatch is no longer the likely blocker
      - blocker moved downstream into AI rent-roll candidate acceptance / helper-validation opacity
    - fixture was then rewritten to follow the proven P10 manager-style narrative pattern more closely
    - `TEST 3` still visually failed in Dashboard, but exact Supabase/file-truth remains the next investigation item
  - `03_positive_dual_ai_recovery_underwriting` = BLOCKED pending `01`
    - original failure matched the same `.txt` rent-roll failure shape as `01`
    - do not treat dual recovery as proven until single-path AI rent-roll Underwriting passes
  - `SYNTH-QA-P01 Clean Screening RETEST` after AI helper install and Resend rotation = PASS
    - Units `6`, Occupancy `100.0%`, Annual In-Place Rent `$111,180`, EGI `$186,780`, OpEx `$69,907`, NOI `$116,873`
    - confirms AI helper install did not break deterministic Screening
    - confirms Resend rotation did not destabilize deployment
- Website positioning, pricing copy, contact routing, and report wording are materially aligned with proprietary, document-driven positioning.
- Dashboard freeze / lag remains a monitored launch-risk item, not a solved issue.
- Dashboard Step 03 failed-state readability polish is closed:
  - `src/pages/Dashboard.jsx`
  - failure messaging now renders as readable, brand-consistent dashboard body/status text
  - no backend / parser / worker / generator logic changed
- Worker remains frozen at the last known-good rollback; do not touch worker success flow unless a brand-new blocker appears.
- Manual Refresh remains the locked pre-launch Dashboard posture.
- Resend is live and validated for launch-critical report-ready email delivery.
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
- Current extraction contract reality:
  - PDF = text + tables extracted
  - PNG / JPG / JPEG = tables extracted only, no `document_text_extracted`
  - CSV / XLSX = no extraction artifact, but direct structured parsers consume them
  - TXT is now validated for the P10 AI rent-roll recovery path:
    - `api/parse/extract-job-text.js` writes `document_text_extracted` for `text/plain` / `.txt`
    - non-spreadsheet rent-roll parsing can now reach AI recovery with real extracted text
  - DOC / DOCX and PPT / PPTX are accepted by Dashboard but still have no extraction path
  - XLS is accepted by Dashboard but parser eligibility remains weak / inconsistent
- AI-assisted structured recovery now exists only as validation-gated parser fallback:
  - rent roll:
    - `.txt extraction -> document_text_extracted -> AI rent-roll recovery -> deterministic validation -> rent_roll_parsed`
    - Screening proven live by `SYNTH-QA-P10 RETEST`
    - Underwriting `.txt` rent-roll dispatch bug in `api/admin-run-worker.js` was found and patched
    - AI Rent Roll Recovery is still only proven live in Screening; Underwriting proof remains open because `01_positive_ai_rent_roll_underwriting` still fails downstream after dispatch
  - T12:
    - `document_text_extracted -> AI T12 recovery -> deterministic validation -> t12_parsed`
    - Screening is proven far enough through P08 to recover/process values and trigger the worker fail-closed scale-mismatch gate
    - Underwriting is now proven live through `02_positive_ai_t12_underwriting`
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
- File-type support reality should be tightened or expanded after Ken Dunn:
  - preferred direction is real extraction support or narrower upload acceptance for `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, and image text extraction
  - do not keep inviting uploads the backend cannot actually read
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
- Cross-document integrity gate now exists in the worker before report generation:
  - `api/admin-run-worker.js`
  - compares `t12_parsed.payload.effective_gross_income` against trusted rent-roll annual in-place rent
  - trusted annual rent derivation uses:
    1. explicit summary annual totals
    2. explicit summary monthly totals x 12
    3. full non-partial unit rows only
  - does not use partial sample rows, average rent alone, market rent, or extrapolated values
  - if the ratio exceeds `5x`, the worker fails closed with `DOCUMENT_FINANCIAL_SCALE_MISMATCH`
  - failure uses existing entitlement restoration / no-publication pattern
- AI Underwriting validation truth after the April 29 control pack:
  - AI T12 Recovery = proven live in Underwriting
  - AI Rent Roll Recovery = proven live in Screening, not yet proven in Underwriting
  - dual AI recovery in Underwriting = not yet proven

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
- Refund / regeneration policy is now locked more explicitly:
  - InvestorIQ does not offer refunds once generation begins
  - if InvestorIQ fails due to a system-side issue, the remedy is credit restoration or report regeneration, not a cash refund
  - if a user uploads the wrong or incomplete package and InvestorIQ generates a defensible report from it, that requires a new report request
- Preferred failed-generation copy:
  - `Generation halted due to document verification limits. InvestorIQ could not verify enough required source data from the uploaded documents to produce a defensible report. No report was published, and 1 report credit has been returned to your account. To try again, please start a new report request and upload the complete document package again, including all required and supporting documents. Do not upload only the documents you believe were unclear or unreadable, because each report is generated from a single complete upload package.`
- Narrative must be document-derived and supportable from parsed inputs.
- No fabricated data, no silent fallback assumptions, and no decorative filler sections.

## 6. Current Engine State
- Worker loop, extraction reuse, and parallel execution have been validated previously.
- Coverage-vs-consistency lesson is now explicit:
  - coverage confirmation is not sufficient document integrity
  - cross-document financial scale mismatch must fail closed before report generation
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
- Latest narrow worker change validated:
  - `api/admin-run-worker.js` now treats extracted `rent_roll` files as dispatchable into `parse-doc`
  - change was limited to:
    - `anyPending`
    - `hasPendingRentRoll`
    - rent-roll parse dispatch filter
  - parser logic, AI helper validation, publication flow, and Dashboard behavior remained unchanged
- Current AI Underwriting scoreboard:
  - AI T12 Underwriting = PASS / published
  - AI Rent Roll Underwriting = still failing / not yet proven
  - dual AI Underwriting recovery = blocked until single-path rent-roll recovery passes
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
- Rare Stripe partial-failure path is now closed:
  - duplicate webhook event IDs no longer short-circuit as complete until expected entitlement rows are confirmed
  - if `stripe_events` exists but some `report_purchases` rows are missing, webhook inserts only the missing rows
  - quantity behavior and deterministic suffixed `stripe_session_id` pattern were preserved
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

### Dashboard Current Truth (April 2026)

- Dashboard freeze / lag remains a monitored launch-risk item and is not declared solved.
- Current working interpretation:
  - catastrophic full-freeze behavior was materially reduced
  - remaining risk is broader Dashboard render pressure / coupling rather than one isolated bad line
  - manual Refresh remains the locked pre-launch posture
- Durable Dashboard hardening already in place:
  - property-input churn and polling pressure were reduced
  - the old Report History table/rows subtree was replaced with a lightweight stacked list/card layout
  - equality guards were added to reduce unchanged state commits for active jobs, recent jobs, and reports
  - the real 4-section Dashboard branch was restored
  - completed-report visibility remains manual-first
- Current launch posture:
  - do not treat Dashboard as solved
  - do not resume Dashboard sync experiments before launch unless a brand-new blocker appears
  - no auto completion reload before launch
  - Report History remains manual refresh for V1.0
  - keep the existing helper note that completed reports may take a moment to appear
- Worker / Dashboard coordination truth:
  - worker remains frozen at the last known-good rollback after failed worker experiments
  - customer-facing `needs_documents` is not a valid V1 endpoint
  - report and job visibility still require caution, but current launch work is report/red-team/readiness first

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

### Dashboard Historical Investigation Note (Compressed)

- Earlier April diagnostics confirmed the freeze/lag issue was real, involved Dashboard-local render/state churn, and was materially improved by the Report History render-path replacement plus later equality-guard hardening.
- Current operational truth is the `Dashboard Current Truth` section above; do not treat older diagnostic branches as active work.
## 7. Current Remaining Issues / Immediate Next Work
### Completed recent fixes
- Batch 1 Critical Math Integrity: completed / verified pass.
- Batch 2 Rendering / Presentation Integrity: closed.
- Batch 3 public-language, disclosure, ASCII, mojibake, and score-label cleanup: materially completed.
- Batch 4 score / disclosure / footer / value-add polish: completed.
- Batch 5 Step 03 / rendering-stage `needs_documents` cleanup: completed.
- Batch 6A / 6A.2 explicit rent-roll summary totals trust path: completed and validated.
- Batch 6B CapEx / renovation disclosure: completed and validated.
- DCF exact document-derived cap-rate consistency: completed and validated.
- Final Richmond / Forest regression suite: passed.
- Final layout polish pass: closed.

- Purchase-assumption DSCR note:
  - current engine correctly refuses to use purchase assumption terms as current-debt DSCR when no debt balance is provided
  - future enhancement: optional Acquisition DSCR / Pro Forma Debt Coverage metric from purchase assumptions, separate from current debt assessment

### Immediate agenda - April 29, 2026
- IMMEDIATE PRIORITY
  1. Investigate the latest failed `01_positive_ai_rent_roll_underwriting TEST 3`.
  2. Optional: run `SYNTH-QA-P05 Missing Rent Roll`.
  3. Run low-dollar true live Stripe payment test if still outstanding.
  4. Review the Ken Dunn sample package.
  5. Complete final readiness check / sample package selection.

- STILL OPEN
  - AI Rent Roll Recovery in Underwriting remains open.
  - AI T12 Recovery in Underwriting is proven.
  - dual AI recovery in Underwriting remains unproven and should stay blocked until `01_positive_ai_rent_roll_underwriting` passes.
  - Optional: run `SYNTH-QA-P05 Missing Rent Roll`.
  - Low-dollar true live Stripe payment test if not yet completed.
  - Ken Dunn sample package review.
  - Final readiness check / sample package selection.
  - Dashboard freeze / lag remains a monitored launch-risk item, not solved.
  - Worker remains frozen at the last known-good rollback unless a brand-new blocker appears.
  - Do not build a `Final_Testing` batch harness before Ken Dunn.
  - Broader accepted-file-type hardening remains open for `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, and image text extraction.
  - If unsupported types remain unsupported pre-launch, tighten upload acceptance rather than pretending support exists.
  - Optional later cleanup: SES helper cleanup, entitlement source-of-truth cleanup, Dashboard auto-visibility hardening, post-launch AI QA Safeguard Layer, and broader table / schema hygiene.

### Before Ken Dunn outreach
- Keep launch doctrine locked:
  - document-driven
  - deterministic
  - fail closed
  - no BUY / SELL language
  - no fabricated narrative
  - one generation per purchased report
  - Codex-first / micro-patch workflow

### Exact next task / resume point
- Immediate resume point
  - start with the latest failed `01_positive_ai_rent_roll_underwriting TEST 3`
  - determine:
    - newest TEST 3 job id
    - exact file statuses
    - whether `document_text_extracted` exists
    - whether `parse-doc` was reached
    - whether `recoverRentRollWithAI(...)` ran
    - whether any AI error / rejection is visible
    - whether the uploaded file actually matches the edited P10-style fixture
  - do not patch production code until file-truth confirms the next blocker
  - do not rerun `03_positive_dual_ai_recovery_underwriting` until `01` passes
  - after that: optional `SYNTH-QA-P05`, low-dollar Stripe test, Ken Dunn sample package review, final readiness check / sample package selection

- AFTER THAT
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
  - post-launch only
  - flags parser misses, unsupported claims, uploaded-but-unused docs, and source/report inconsistencies
  - must not inject financial values into NOI, rent, occupancy, DSCR, debt, valuation, cap rate, refinance, or deal score
  - deterministic parser / calculation layer remains the source of truth
- Manual Admin QA Gate:
  - V1.1 / immediate post-launch hardening option, not a pre-Ken Dunn pivot
  - reports remain private until admin approval if this mode is adopted
- Later cleanup themes:
  - SES helper cleanup
  - entitlement / schema cleanup
  - Dashboard auto-visibility hardening
## 11. Launch Readiness Snapshot
- Scenario coverage audit recommendation: Launch this week = CONDITIONAL.
- Launch conditions:
  - low-dollar live Stripe payment test if still outstanding
  - final Ken Dunn sample package review
  - final readiness check / sample package selection
  - stop only if a new report-core math or document-integrity regression appears
- Current covered scenarios:
  - clean Screening
  - clean Underwriting
  - messy T12 extraction with fail-closed validation
  - full rent roll
  - partial rent roll sample with explicit total units
  - partial rent roll sample with trusted explicit summary totals
  - missing / partial debt terms
  - DSCR not assessed
  - rendering-stage failure remap to failed
  - Stripe quantity entitlement path
  - Dashboard visibility with caution
- Launch-ready now:
  - pricing and positioning are aligned with institutional positioning and proprietary-system messaging
  - screening vs underwriting separation is materially clean
  - dashboard / admin support workflow is operational
  - multi-quantity Stripe checkout and entitlement creation are working
  - launch-critical `report_published` email notifications are live on Resend and validated
  - underwriting exact document-derived exit / refi cap labels now display exact parsed precision consistently, including `4.99%` and `6.25%`
  - rent roll hardening is validated through explicit summary-totals trust plus partial-sample suppression
  - Forest City latest validated underwriting proof point: `Forest City Manor Underwriting Test 27`
    - Units `144`, Occupancy `96.0%`, Annual In-Place Rent `$2,622,000`, Annual Market Rent `$3,148,800`, Rent-to-Market Gap `16.7%`
    - partial-sample detail rows remain suppressed as full-property metrics
    - `ForestCityManor_RenovationBudget.docx` is acknowledged without unsupported CapEx modeling
    - Scenario and DCF basis / sensitivity base rows use `4.99% (document derived)`
  - 124 Richmond latest validated underwriting proof point: `124 Richmond Street Underwriting Test 22`
    - Units `12`, Occupancy `100.0%`, Annual In-Place Rent `$186,780`, Annual Market Rent `$219,240`, Rent-to-Market Gap `17.4%`, DSCR `1.09x`
    - `CapEx_Schedule_124_Richmond_Test.pdf` is acknowledged without unsupported CapEx modeling
    - Scenario and DCF basis / sensitivity base rows use `6.25% (document derived)`
  - final regression suite and final layout-polish pass are complete
  - AI Rent Roll Recovery is proven live for Screening through `SYNTH-QA-P10 RETEST`
  - AI T12 Recovery is proven live in Underwriting through `02_positive_ai_t12_underwriting`
  - rendering-stage / pre-generation cross-document scale mismatch protection is now in place and validated
- Still needed before Ken Dunn outreach:
  - close the open AI Rent Roll Recovery Underwriting control (`01_positive_ai_rent_roll_underwriting`)
  - do not claim dual AI Underwriting recovery is proven until `03` passes after `01`
  - optional: run `SYNTH-QA-P05 Missing Rent Roll` if additional fail-closed validation is desired
  - complete low-dollar live Stripe payment test if still outstanding
  - complete Ken Dunn sample package review
  - complete final readiness check / sample package selection
  - patch only real regressions found in the synthetic validation / final readiness pass
