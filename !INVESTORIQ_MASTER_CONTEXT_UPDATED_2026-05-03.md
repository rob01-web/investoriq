# InvestorIQ Master Context - May 2026

**Last updated:** May 3, 2026 - live validation paused on active P0 report-reuse blocker.

## 1. Current Product State
- InvestorIQ is in final validation and outreach-prep for Ken Dunn.
- **May 3 live validation status - ACTIVE P0 BLOCKER:**
  - Public legacy sample route P0 is closed: `/reports/sample-report.html` is neutral in repo truth and live deployment truth.
  - During live DocRaptor test-mode validation, a new P0 was discovered before production PDF smoke.
  - Scenario: user submitted one Screening and one Underwriting report with the exact same property name: `124 Richmond Street, London, ON`.
  - Screening job `84ee5e37-437a-4bfe-a2af-43a4cdd0e7b5` published and created report `6fc4589f-cb80-4bb3-a01d-8501aae8dc24`.
  - Underwriting job `d56329cd-1fc8-4bf2-9141-42bb4d914300` also reached `published`, but did **not** create an Underwriting `reports` row.
  - Underwriting `report_generation` event showed `source: existing_report` and reused the Screening report id/path: `6fc4589f-cb80-4bb3-a01d-8501aae8dc24` / `6082ae60-b804-413c-9fc1-dd71fd80be4d/6fc4589f-cb80-4bb3-a01d-8501aae8dc24.pdf`.
  - The `reports` table showed only one row for this property, with `report_type = screening`; there was no Underwriting report row.
  - Both jobs had `analysis_jobs.report_id = null`; current reliable linkage came from `analysis_artifacts.worker_event` payloads, not the job row.
  - Underwriting purchase `c161f73c-b8e5-4f2d-83d2-159420334bc0` was consumed against the bad Underwriting job, then manually restored by setting `job_id = null` and `consumed_at = null`.
  - Root hypothesis: existing-report reuse logic is keyed too broadly, likely by user/property name, and can cross report types.
  - Required fix: existing-report reuse must not cross `report_type`; safer option is disabling live existing-report reuse unless it is job-scoped or otherwise provably safe.
  - **Stop condition:** do not continue DocRaptor production smoke, public sample regeneration, or same-name Underwriting retest until this bug is patched, deployed, and retested.
- Latest status through May 2, 2026:
  - 124 Richmond Screening, Clean Underwriting, and Messy Underwriting were regenerated and validated against the current report checks
  - Screening passed current report checks
  - Clean Underwriting passed current report checks
  - Messy Underwriting passed current report checks
  - rent-gap basis is standardized to in-place denominator: `($219,240 - $186,780) / $186,780 = 17.4%`
  - `Market Rent Premium (Avg)` is now `Market Rent Gap (Avg)`
  - unsupported renovation / CapEx documents remain acknowledged but are not modeled quantitatively
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
- April 30 strategic checkpoint:
  - today was the AI QA / failed-report prevention crossroads
  - decision: do not build concierge hold, Stripe promo-code tagging, report visibility suppression, RLS changes, or admin approval workflow yet
  - chosen path: QA safeguard first, then hard validation; full concierge hold deferred
  - old question: "Can InvestorIQ publish a report?"
  - new question: "Can InvestorIQ recognize whether a published report is actually investor-ready?"
  - this direction is validated as launch-hardening, not scope creep
- Public-positioning rule is locked:
  - any AI, AI-assisted QA, AI fallback, or AI red-team language is founder/internal only
  - public/customer/website copy must say document-driven, document-backed, deterministic validation, internal quality safeguards, source-verification controls, or proprietary document-driven underwriting infrastructure
  - do not publish copy saying AI QA, AI-assisted, or AI extraction
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
  - subtests:
    - `01_positive_ai_rent_roll_underwriting`
    - `02_positive_ai_t12_underwriting`
    - `03_positive_dual_ai_recovery_underwriting`
    - `04_long_ai_rent_roll_stress_underwriting`
  - goal is clean Underwriting validation of AI-assisted extraction recovery without reusing confusing mixed legacy packages
  - doctrine remains locked:
    - AI extraction only
    - no AI-written underwriting
    - no AI as financial source of truth
    - deterministic validation remains the gate
    - no financial value accepted unless validation passes
    - fail closed on missing, inconsistent, or unverified artifacts
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
- End-of-night May 2 / early May 3 OpenAI secret update:
  - OpenAI API key was exposed during local model-list checking
  - safe rotation completed:
    - new OpenAI API key created
    - Vercel Production `OPENAI_API_KEY` updated
    - production redeployed
    - old exposed key ending `...4v0A` revoked / deleted
    - local PowerShell `OPENAI_API_KEY` cleared with `Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue`
  - never paste API keys into chat, Codex, logs, or screenshots
- End-of-night May 2 / early May 3 AI model posture:
  - local `/v1/models` check confirmed access to `gpt-4o`, `gpt-4.1`, `gpt-5`, and newer listed GPT-5.x models including `gpt-5.5`
  - production env model settings:
    - `OPENAI_T12_RECOVERY_MODEL=gpt-4o`
    - `OPENAI_RENT_ROLL_RECOVERY_MODEL=gpt-4o-mini`
  - rationale:
    - T12 controls EGI, OpEx, NOI, DSCR, refinance, valuation, and score optics, so T12 recovery uses a stronger model than mini
    - compact rent roll recovery can remain on `gpt-4o-mini` unless failures appear
    - model output remains candidate extraction only
    - deterministic validation and cross-document gates remain source of truth
    - public / customer copy must still not mention AI
  - future optional test: evaluate newer models such as `gpt-5.5` for T12 recovery only after controlled structured-output and latency validation
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
  - AI Rent Roll Recovery Underwriting debugging path is now closed enough for launch confidence:
    - root cause 1: `api/admin-run-worker.js` only dispatched rent-roll parse-doc for `parse_status === 'pending'`, while `.txt` extraction sets rent roll files to `parse_status = 'extracted'`
    - worker patch applied in `api/admin-run-worker.js`: `anyPending`, `hasPendingRentRoll`, and rent-roll parse dispatch now include extracted rent-roll files
    - `node --check api/admin-run-worker.js` passed
    - root cause 2: AI rent-roll helper returned `null` opaquely after dispatch reached `parse-doc`
    - diagnostic patch applied in `lib/ai-rent-roll-recovery.js` and `api/parse/parse-doc.js`
    - `ai_rent_roll_recovery_diagnostic` now records attempted, feature flag, API key presence, source text length, request attempted, response status, JSON parse success, candidate presence, validation result, rejection reason, and final outcome
    - diagnostics do not persist raw document text, API keys, or full OpenAI responses
    - diagnostic retest showed `AbortError`: OpenAI request attempted, feature flag enabled, API key present, but no response returned before abort
  - AI helper timeout config patch applied:
    - files: `lib/ai-rent-roll-recovery.js`, `lib/ai-t12-recovery.js`
    - `OPENAI_RENT_ROLL_RECOVERY_TIMEOUT_MS` and `OPENAI_T12_RECOVERY_TIMEOUT_MS`
    - default `55000ms`, clamped from `10000ms` to `55000ms`
    - no models, prompts, schemas, validation, accepted artifact shapes, parser, worker, Dashboard, generator, or report logic changed
    - `node --check lib/ai-rent-roll-recovery.js` passed
    - `node --check lib/ai-t12-recovery.js` passed
  - `01_positive_ai_rent_roll_underwriting TIMEOUT RETEST` = PASS / published / AI Rent Roll Recovery proven live in Underwriting for compact parser-unfriendly `.txt`
    - validated anchors:
      - Units `18`
      - Occupancy `94.4%`
      - Annual In-Place Rent `$346,800`
      - Annual Market Rent `$387,000`
      - EGI `$346,800`
      - OpEx `$132,000`
      - NOI `$214,800`
      - Loan amount `$2,900,000`
      - Interest rate `4.85%`
      - Amortization `30 years`
      - DSCR `1.17x`
      - Rent Roll vs T12 variance `0.0%`
  - `03_positive_dual_ai_recovery_underwriting CONTROL RETEST` = PASS / published / dual AI recovery proven live in Underwriting
    - job `711787db-0fb7-4750-aadf-cafbe805cfbf`
    - report `82bd665b-fdb2-4d39-90e2-ab9ea2b220b0`
    - T12 artifact: `method: ai_t12_recovery_validated`, `ai_assisted: true`, `validated: true`
    - rent roll artifact: `method: ai_rent_roll_recovery_validated`, `ai_assisted: true`, `validated: true`
    - validated anchors:
      - Units `32`
      - Occupancy `93.8%` rounded from `93.75%`
      - Annual In-Place Rent `$648,000`
      - Annual Market Rent `$710,400`
      - EGI `$648,000`
      - OpEx `$246,000`
      - NOI `$402,000`
      - Loan amount `$5,950,000`
      - Interest rate `4.95%`
      - Amortization `35 years`
      - DSCR `1.12x`
      - Rent Roll vs T12 variance `0.0%`
    - report quality note:
      - technical validation evidence, not a showcase report
      - shorter 15-page output is expected because T12 has only core totals and the rent roll uses representative unit observations with trusted summary totals
      - unit mix / rent-distribution quality is less showcase-ready because only 12 representative rows were listed for a 32-unit property
  - Cover page long property-name overflow fix applied:
    - file: `api/report-template-runtime.html`
    - CSS target: `.cover-prop-name`
    - added `max-width: 100%`, `white-space: normal`, `overflow-wrap: anywhere`, and `hyphens: auto`
    - retained existing `word-break: break-word`
    - CSS/layout only; no report math, parser, worker, Dashboard, AI, generator, or value logic changed
    - pending visual retest with a long-name report
  - Dashboard failed-credit copy improvement is now applied:
    - failed pre-publication structured-financial jobs now explain that generation halted, no report was published, and 1 report credit was returned
    - file-specific rent roll / T12 guidance still appears after the customer-safe lead message
    - internal diagnostic terms like `AbortError` remain engineering-only; user-facing copy says InvestorIQ could not verify the uploaded rent roll as valid structured source data
    - optional later copy improvement: steer large rent rolls toward CSV/XLSX format
  - `04_long_ai_rent_roll_stress_underwriting` = ACCEPTABLE FAIL-CLOSED stress result
    - job `037a2a7c-b50b-4d2d-9e90-574d73ee9272`
    - report type/status: `underwriting` / `failed`
    - error `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`
    - report row: none
    - entitlement restored
    - uploaded files:
      - `t12_clean_control.csv`
      - `loan_terms_simple_source.txt`
      - `rent_roll_long_ai_recovery_source.txt`
    - T12 parsed by `csv`
    - loan terms parsed by `text_excerpt`
    - rent roll `.txt` failed with `unsupported_file_type_for_structured_parsing`
    - no `rent_roll_parsed`
    - AI diagnostic: attempted `true`, feature enabled `true`, OpenAI key present `true`, source text length `6787`, request attempted `true`, response status `null`, JSON parse success `null`, candidate present `false`, validation accepted `false`, rejection reason `AbortError`, final outcome `exception`
    - 04 rent roll listed all 64 unit lines
    - safety result: fail-closed worked, no report published, credit restored, no invalid rent-roll artifact accepted
    - V1 conclusion: large full-unit narrative `.txt` rent rolls are not scale-proven for AI recovery; compact `.txt` recovery is validated; CSV/XLSX remains preferred for large detailed rent rolls
  - `SYNTH-QA-MOTHERLOAD-UNDERWRITING-01` / `Harbourstone Apartments - Underwriting` = PUBLISHED but NOT website-sample ready and NOT Ken Dunn ready
    - treat as successful QA / stress discovery, not a public showcase asset
    - proved core AI T12 / AI rent-roll recovery and base math can publish:
      - T12 artifact: `method: ai_t12_recovery_validated`, `ai_assisted: true`, `validated: true`
      - rent roll artifact: `method: ai_rent_roll_recovery_validated`, `ai_assisted: true`, `validated: true`
      - core anchors landed: Units `48`, Occupancy `95.8%`, Annual In-Place Rent `$1,036,800`, EGI `$1,036,800`, OpEx `$425,000`, NOI `$611,800`
    - exposed support-doc / document-boundary gaps:
      - P0: DocRaptor test watermark still appears; no public PDF can ship with test bands
      - P0: loan balance miss; expected `$8,750,000`, but `loan_term_sheet_parsed.loan_amount = null`; interest `5.25%`, amortization `30`, and LTV `70` parsed; report said debt sizing balance was not provided and DSCR/current-debt service were not assessed
      - P0: property tax false positive; `property_tax_parsed.annual_tax = 2025`, expected `$124,000`; value did not appear to surface in report, but this is a parser/data-integrity issue
      - P1: purchase/cap-rate support; purchase assumptions produced usable cap-rate support around `5.75%`, but a later null appraisal artifact effectively masked it and report used default/stated `5.50%`
      - P1: cover title hyphenated `Harbourstone Apartments - Underwriting` awkwardly as `Un-/derwriting`; immediate sample workaround is clean property name only, such as `Harbourstone Apartments`
      - P1: AI T12 helper recovered core totals only; expense line items from the source did not populate, leaving lump-sum T12 detail too thin for a flagship sample
      - P2: market rent survey was misclassified as `rent_roll` and failed noisily
      - P2: 13-page output was thin because debt/refi sections, DSCR, T12 line-item detail, and support sections did not land
    - product lesson:
      - these are different edge cases at the document-ingestion / support-doc boundary, not one recurring bug
      - core underwriting math is materially strong once structured artifacts are clean
      - remaining launch risk is source-document classification / extraction / QA, especially support docs
      - stress packages and public showcase packages must be separated: stress packages expose failures and fail-closed behavior; showcase packages demonstrate the strongest supported path
      - do not try to make one synthetic package both the harshest stress test and the public website sample
  - Harbourstone Motherload / Test 5 validation arc, April 30:
    - Motherload / Harbourstone remains a stress-test package, not a public sample
    - earlier Harbourstone exposed DocRaptor test watermark, missed `$8,750,000` loan balance, property tax year `2025` parsed as annual tax, usable `5.75%` cap-rate support masked by later null appraisal artifact, cover `Un-derwriting` hyphenation, totals-only T12 recovery, market survey classification noise, and thin 13-page output
    - QA artifact correctly flagged `PROPERTY_TAX_AMOUNT_IMPLAUSIBLE`, `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT`, `T12_TOTALS_ONLY`, `MARKET_SURVEY_CLASSIFICATION_REVIEW`, `CAP_RATE_SUPPORT_NOT_USED`, and `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - Phase 1.1 added direct debt flag `DEBT_FILE_WITH_MISSING_BALANCE` for debt artifacts with meaningful terms but missing balance / loan amount
    - `Harbourstone Test 5` is current stress-test proof:
      - job `f5855655-150d-4f47-b7dc-71c18ea5ec89`
      - report `1cbf7fc6-99f7-4e8d-af53-9f727b3c8cf6`
      - status `published`, page count `15`
      - cover no longer hyphenates Underwriting
      - `loan_term_sheet_parsed.loan_amount = 8750000`
      - DSCR rendered `1.06x`
      - T12 parsed with GPR / EGI `$1,036,800`, OpEx `$425,000`, NOI `$611,800`
      - property tax parsed `$124,000`, not `2025`
      - refinance classification rendered `Refinance Shortfall Under Stress`
      - cap-rate basis `Exit cap: 5.75% (document derived)`
      - `DEBT_FILE_WITH_MISSING_BALANCE` and `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT` absent
      - QA status `warn`, severity `medium`; remaining flags: `T12_TOTALS_ONLY`, `MARKET_SURVEY_CLASSIFICATION_REVIEW`, `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - conclusion: Harbourstone is clean enough as stress-test proof only; not a public sample / Ken Dunn candidate
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
    - Underwriting compact `.txt` rent-roll recovery proven live by `01_positive_ai_rent_roll_underwriting TIMEOUT RETEST`
    - Underwriting dual AI recovery proven live by `03_positive_dual_ai_recovery_underwriting CONTROL RETEST`
    - long full-unit `.txt` rent rolls are not V1 scale-proven; `04_long_ai_rent_roll_stress_underwriting` failed closed safely with credit restored
    - CSV/XLSX remains the preferred V1 path for large detailed rent rolls
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
- AI Underwriting validation truth after the April 30 checkpoint:
  - AI T12 Recovery = proven live in Underwriting
  - AI Rent Roll Recovery = proven live in Screening and in Underwriting for compact `.txt`
  - dual AI recovery = proven live in Underwriting
  - long full-unit narrative `.txt` rent rolls = acceptable fail-closed stress result, not scale-proven for V1

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
- May 3 live validation found a new backend publication/reuse P0:
  - Same user/property name across Screening and Underwriting can trigger unsafe existing-report reuse.
  - Underwriting job `d56329cd-1fc8-4bf2-9141-42bb4d914300` reached `published` but reused Screening report `6fc4589f-cb80-4bb3-a01d-8501aae8dc24` instead of creating its own Underwriting report.
  - This is not a Dashboard same-name render bug; the backend only produced one `reports` row and one PDF path.
  - Underwriting credit was restored manually after confirmation that no Underwriting PDF/report row existed.
  - Treat this as active launch blocker until existing-report reuse is patched and same-name Screening/Underwriting retest passes.
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
  - `SYNTH-QA-P10` Screening AI Rent Roll Recovery = PASS
  - `SYNTH-QA-P08` AI/T12 + scale mismatch fail-closed = PASS
  - `01_positive_ai_rent_roll_underwriting` = PASS
  - `02_positive_ai_t12_underwriting` = PASS
  - `03_positive_dual_ai_recovery_underwriting` = PASS
  - `04_long_ai_rent_roll_stress_underwriting` = ACCEPTABLE FAIL-CLOSED stress result
  - AI Rent Roll Recovery is proven in Screening and in Underwriting for compact `.txt`; it is not scale-proven for long full-unit `.txt`
  - AI T12 Recovery is proven in Underwriting
  - dual AI recovery is proven in Underwriting
  - large rent roll preferred V1 path remains CSV/XLSX
- Current AI recovery scope clarification:
  - AI is not a universal document-understanding agent
  - current AI is narrow extraction fallback only:
    - AI Rent Roll Recovery
    - AI T12 Recovery
  - AI does not currently QA loan terms, property taxes, appraisal/cap-rate artifact selection, market survey classification, or final report output
  - AI did not catch the Motherload missed loan balance, tax year mistaken for tax amount, null appraisal masking usable cap rate, or market survey misclassification
  - broader AI QA requires a separate safeguard layer that can flag issues without writing accepted financial values
- April 30 QA-driven hardening completed:
  - `api/parse/parse-doc.js` loan-term parser recognizes `outstanding loan balance`, `outstanding balance`, `current loan balance`, and `current mortgage balance`
    - validated: `Outstanding loan balance: $8,750,000` -> `loan_amount = 8750000`
  - `api/parse/parse-doc.js` T12 text parser accepts `Gross Rental Income`, `gross rental revenue`, and `rental income` as GPR synonyms while preserving `validateCoreT12Payload`
    - validated: `Gross Rental Income: $1,036,800` -> `gross_potential_rent = 1036800`
  - `api/generate-client-report.js` refinance cap-rate selection now chooses the latest usable positive appraisal cap rate instead of allowing later null `appraisal_parsed` artifacts to mask support; explicit `refi_cap_rate` still wins
  - `api/generate-client-report.js` tightened `DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT` so rendered DSCR suppresses the flag, and improved Not Produced copy when debt terms are complete but refinance cap-rate / value support is incomplete
  - `api/report-template-runtime.html` cover title CSS now uses `hyphens: none`, `overflow-wrap: break-word`, `word-break: normal`, preventing `Un-derwriting`
  - `api/parse/parse-doc.js` property tax parser rejects year-like annual-tax values `1900-2100`, requires annual tax candidates `> 5000`, and emits `implausible_annual_tax` or `missing_annual_tax`
    - validated: `Tax Year: 2025` does not produce annual tax; `Annual Property Tax: $124,000` -> `124000`
  - `api/report-template-runtime.html` static Methodology headings are unnumbered: `InvestorIQ Estimates`, `Methodology Notes`, `Data Limitations & Missing Inputs`
  - `api/generate-client-report.js` whole-property rent-to-market gap basis standardized to in-place rent denominator
    - validation wording: `($219,240 - $186,780) / $186,780 = 17.4%`
- May 2 report polish / validation completed:
  - `Target Rent (Post-Reno)` and `Monthly Lift` wording replaced with neutral rent-positioning language:
    - `Documented Market Rent`
    - `Monthly Rent Gap`
    - `Unit-Level Rent Positioning & Value Sensitivity`
    - `Market-rent gap and implied value sensitivity`
  - Screening-style cover layout is now standard for Screening and Underwriting
  - Underwriting shows the cover metric strip when core metrics exist
  - extra divider above `ASSET CLASS / DOCUMENTS / REPORT TIER` was removed
  - cover metadata rows remain `ASSET CLASS`, `DOCUMENTS`, and `REPORT TIER`
  - final public samples should still use clean property names
  - `dedupeDataNotAvailableBySection()` no longer injects a section-level `data-gap-note` for `SECTION_8_DEAL_SCORE`
  - legitimate DSCR unavailable table-cell disclosure remains
  - misplaced Deal Scorecard `DATA NOT AVAILABLE` note no longer lands visually on the prior Scenario page
  - heading / metric-card punctuation cleaned:
    - `Full Refinance Sufficiency (Deterministic)`
    - `IMPLIED VALUE SENSITIVITY AT STABILIZATION`
    - `TOP INCOME LINE CONCENTRATION`
  - top income line concentration value renders as a standalone metric, e.g. `95.8%` or `98.8%`
- May 2 Deal Scorecard / DSCR verdict cap completed:
  - Underwriting Deal Scorecard caps displayed verdict when computed DSCR is below `1.25x`
  - if composite score is `>= 70` but computed DSCR is below `1.25x`, displayed verdict becomes `Review - Debt Coverage Constraint`
  - existing DSCR-not-assessed cap remains
  - Composite Score and DSCR factor row remain visible
  - Deal Scorecard note now clarifies that composite score is calculated from reported metrics only, base score thresholds are shown before mandatory DSCR verdict caps, and DSCR below `1.25x` or not assessed applies a mandatory Review verdict cap
  - Clean Underwriting validated: DSCR `1.09x`, Composite Score `75/100`, verdict `Review - Debt Coverage Constraint`
  - Messy Underwriting validated: DSCR `1.00x`, Composite Score `75/100`, verdict `Review - Debt Coverage Constraint`
- May 2 property-name sanitizer posture:
  - light `sanitizeDisplayText()` applies typo / spacing cleanup to property address and title, and remains the base cleanup step
  - aggressive `sanitizePropertyNameDisplayText()` affects PDF/report property name display only
  - raw DB `reports.property_name` is not sanitized
  - uploaded filenames / document sources are not destructively sanitized
  - production posture: preserve user-entered property names as source-of-truth display names; allow long names to wrap naturally; do not globally remove words like `Test`, `Final`, `Screening`, `Underwriting`, `Clean`, `Messy`, or `QA` from production names
  - final public samples should use clean names rather than relying on aggressive sanitizer expansion
  - later cleanup: remove aggressive sample/test cleanup from normal generation or gate it behind explicit admin/demo mode
- May 2 pricing page polish completed:
  - `/pricing` Report Comparison table now shows clear `Included` / `Not included` cells
  - first visible fix used boxed badges, then final polish replaced them with plain styled table text using page typography
  - file touched: `src/pages/Pricing.jsx`
  - no Stripe, checkout, entitlement, API, Dashboard, or report logic changed
  - `npm run build` passed; existing unrelated `AdminDashboard.jsx` warnings remain
- May 2 E2E / break-test harness added:
  - Node-based harness files:
    - `tests/e2e/run-e2e.js`
    - `tests/e2e/assert-report-output.js`
    - `tests/e2e/README.md`
    - `tests/e2e/results/latest-e2e-results.json`
  - package scripts:
    - `test:e2e`
    - `test:e2e:report`
  - harness supports static/default checks, report-path PDF/HTML/TXT assertions, `--profile underwriting-dscr-constrained`, and Wave 2/3/4 profiles
  - report assertions cover:
    - no `14.8%` rent-gap regression
    - `Market Rent Gap (Avg)` present
    - no `Market Rent Premium (Avg)`
    - no `Target Rent (Post-Reno)`
    - no `Monthly Lift`
    - no BUY/SELL language
    - no public AI terminology
    - no dangling `DATA NOT AVAILABLE` block
    - DSCR-constrained Underwriting shows `Review - Debt Coverage Constraint`
    - Composite Score and DSCR row remain visible
    - Deal Scorecard note includes base thresholds and mandatory Review verdict cap wording
  - latest report-output validation:
    - Screening PDF run: `37 PASS / 0 FAIL / 7 SKIP`
    - Clean + Messy Underwriting PDF run: `57 PASS / 0 FAIL / 7 SKIP`
    - regenerated underwriting combined JSON was superseded by later Wave profiles
- May 2 hardcore break-testing status:
  - Wave 1 report/static/output checks passed
  - Wave 2 mock lifecycle fail-closed fixtures added in `tests/e2e/fixtures/jobs/wave2-job-lifecycle.json`
    - scenarios: missing-rent-roll, missing-t12, unsupported-capex-only, scale-mismatch, partial-rent-roll-sample, incomplete-debt
    - result: `98 PASS / 0 FAIL / 8 SKIP`
  - Wave 3 fake Supabase / worker-state simulator added:
    - `tests/e2e/fake-supabase.js`
    - `tests/e2e/worker-state-scenarios.js`
    - result: `83 PASS / 0 FAIL / 8 SKIP`
    - no live Supabase, DocRaptor, Stripe, Resend, storage, emails, credits, or reports touched
    - remaining gap: simulator mirrors worker terminal behavior but does not execute `api/admin-run-worker.js` directly
  - Wave 4 parser-level adversarial fixtures added:
    - `tests/e2e/fixtures/parser/wave4-parser-adversarial.json`
    - `tests/e2e/parser-adversarial.js`
    - scenarios: loan rate / cap rate / LTV collision, generic rate outside loan context, tax-year collision, glued-number T12, malformed glued rent roll, partial rent roll with / without summary, unsupported CapEx prose
    - real parser bug found: LTV parser captured `Exit cap 6.25%` as LTV when `LTV 75%` followed
    - `api/parse/parse-doc.js` patch applied: same-line / LTV-label scoped parsing, preserves valid LTV formats, finite range guard `> 0 && <= 100`, prevents cap/refi/vacancy/tax percentages from becoming LTV
    - Wave 4 after patch: `78 PASS / 0 FAIL / 8 SKIP`
  - End-of-night May 2 / early May 3 Wave 4 expansion:
    - Claude review / follow-up investigation confirmed active columnar T12 parser risk:
      - row-label T12 table parsing selected first numeric cells
      - table detection could reject monthly-column row-label T12 layouts unless metric labels appeared in headers
      - no fixture previously proved Jan-Dec plus TTM / Annual Total selection
    - added adversarial fixture `columnar-monthly-t12-total-selection`
      - Jan-Dec plus `TTM Total`
      - expected GRI / EGI `192,960`, OpEx `120,790`, NOI `72,170`
    - fixture initially failed as expected, confirming active product bug
    - `api/parse/parse-doc.js` patch applied:
      - total-column detection for `TTM`, `T12`, `Trailing 12`, `Trailing Twelve`, `Annual`, `Annual Total`, and `Total`
      - prefers rightmost valid total-like numeric cell before first-numeric / monthly fallback
      - applied to row matrices, extracted tables, and CSV row-label fallback
      - added `Gross Rental Income` synonyms to shared T12 label rules
      - preserved percent-skip, `>$1B` rejection, coverage requirements, and core T12 validation
    - validation:
      - `node --check api/parse/parse-doc.js`: PASS
      - `node tests/e2e/run-e2e.js --profile wave4-parser-adversarial`: PASS including `columnar-monthly-t12-total-selection`
      - `npm run test:e2e`: `156 PASS / 0 FAIL / 8 SKIP`
  - Wave 5 launch-readiness red-team sweep completed:
    - repo-wide public-output sweep checked public AI terminology, BUY/SELL language, stale labels, mojibake, sanitizer risk, pricing / checkout / Dashboard launch blockers, and E2E harness health
    - no confirmed live public-output blocker found
    - legacy/unused risk remains in `api/html/sample-report.html` and `src/lib/pdfSections.js`; archive or clean before any public demo exposure
    - latest default `npm run test:e2e`: `156 PASS / 0 FAIL / 8 SKIP`
- April 30 validation notes:
  - 124 Richmond Screening Test:
    - engine / math passed, 9 pages, T12 and Rent Roll fully verified
    - issues: rent-gap basis inconsistency `17.4%` vs `14.8%`, `Target Rent (Post-Reno)` too strong without structured renovation input, Unit-Level Value Add / renovation wording may overstate Screening scope, public sample name must remove `Test`, and Methodology numbering fix requires regeneration
  - 124 Richmond CLEAN Underwriting:
    - engine / math passed, 17 pages, debt / DSCR / refi stress / T12 line items / expense drivers / rent roll / scenario / DCF rendered
    - DSCR `1.09x`; `Refinance Shortfall Under Stress`; cap-rate basis `6.25% (document derived)`
    - issues: sample name included `CLEAN`, `Underwritting`, `Test`; regenerate with clean property name; Methodology numbering fix requires regeneration; Target Rent / value-add labels need polish; review verdict optics where weak DSCR/refi shortfall conflicts with `Within Underwriting Parameters`
  - 124 Richmond MESSY Underwriting:
    - good stress test, not public/Ken sample
    - T12 line items rendered despite messy input; vacancy allowance lowered EGI/NOI as expected; core T12 and rent roll verified
    - DSCR not assessed because debt sizing balance was not parsed; scorecard correctly capped verdict at `Review`
    - issues: name included `MESSY`, `Underwritting`, `Test`; Methodology numbering fix requires regeneration; investigate messy debt parsing / QA artifact; collapse dangling `DATA NOT AVAILABLE`; same Target Rent / value-add wording concern
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

### Immediate agenda - May 1, 2026 - superseded by May 2 validation
- CLOSED / superseded:
  - rent-gap basis standardized to in-place denominator
  - reports regenerated and validated after Methodology numbering patch
  - messy underwriting debt parsing investigated; narrow loan-rate parser gap patched
  - dangling Deal Scorecard `DATA NOT AVAILABLE` note fixed
  - `Target Rent (Post-Reno)` / `Monthly Lift` wording replaced with neutral rent-positioning labels
  - verdict optics fixed with DSCR below-threshold Review cap
  - pricing comparison table visibility / premium styling fixed
  - E2E harness and Waves 1-5 validation added
- STILL OPEN from that agenda:
  - use clean public sample property names only: no `Test`, no `CLEAN`, no `MESSY`, no typo `Underwritting`
  - decide final public / Ken sample candidate
  - DocRaptor production mode before any public sample PDF
  - consider small deterministic final-render QA artifact only after sample selection
  - remove or admin/demo-gate aggressive property-name sample sanitizer in normal generation

- STILL OPEN
  - **P0 active launch blocker:** patch existing-report reuse so Screening and Underwriting can never reuse each other's report artifacts when property names match; retest same-name Screening + Underwriting before DocRaptor production smoke.
  - AI recovery Underwriting control is complete enough for launch confidence:
    - AI T12 Underwriting = PASS
    - compact AI Rent Roll Underwriting = PASS
    - dual AI Underwriting recovery = PASS
    - long full-unit `.txt` rent-roll stress = acceptable fail-closed limitation evidence
  - Optional: run `SYNTH-QA-P05 Missing Rent Roll`.
  - Low-dollar true live Stripe payment test if not yet completed.
  - Ken Dunn sample package review.
  - Final readiness check / sample package selection.
  - Dashboard freeze / lag remains a monitored launch-risk item, not solved.
  - Worker remains frozen at the last known-good rollback unless a brand-new blocker appears.
  - Do not build a `Final_Testing` batch harness before Ken Dunn.
  - Broader accepted-file-type hardening remains open for `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, and image text extraction.
  - If unsupported types remain unsupported pre-launch, tighten upload acceptance rather than pretending support exists.
  - QA safeguard Phase 1 is implemented for artifact/document-integrity risks; rendered-report editorial / sample-readiness QA remains future Phase 1.2.
  - Future AI work also includes chunking / large-text rent-roll recovery and clearer large-rent-roll CSV/XLSX guidance.
  - Optional later cleanup: SES helper cleanup, entitlement source-of-truth cleanup, Dashboard auto-visibility hardening, and broader table / schema hygiene.

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
- **Immediate resume point - P0 report-reuse blocker:**
  - Do **not** proceed to DocRaptor production smoke yet.
  - Do **not** regenerate final public samples yet.
  - Do **not** rerun same-name Underwriting validation until patched and deployed.
  - Use Codex-first investigation on `api/generate-client-report.js` for existing-report reuse logic.
  - Inspect `api/admin-run-worker.js` only if required to understand how report-generation results are handled.
  - Determine exactly why Underwriting reused the Screening report when property name/user matched.
  - Apply minimal anchor-locked patch so existing-report reuse cannot cross `report_type`; if safer, disable existing-report reuse in live generation unless it is job-scoped or provably safe.
  - Add or update a targeted E2E/simulator assertion if current harness can cover same user/property name with different report types.
  - Validate with `node --check api/generate-client-report.js`; if worker touched, also `node --check api/admin-run-worker.js`; run relevant E2E command if test added.

- **Required retest after patch/deploy:**
  - Submit one Screening and one Underwriting with exact same property name: `124 Richmond Street, London, ON`.
  - Expected `reports` table result: two rows, one `screening`, one `underwriting`.
  - Expected storage result: two distinct report ids and two distinct PDF storage paths.
  - Expected Dashboard result: Report History shows both reports after manual Refresh.
  - Expected content result: Underwriting PDF is actually Underwriting, not the Screening PDF.
  - Expected entitlement result: Screening and Underwriting purchases are consumed only by their correct report jobs.

- **After P0 is closed:**
  - Keep DocRaptor in test mode.
  - Resume live test-mode report validation:
    - T12-columnar sample if available
    - clean Screening public-candidate sample
    - clean Underwriting public-candidate sample
    - optional fail-closed test
  - Run PDF copy checklist on each published report.
  - Only after those pass, proceed to controlled DocRaptor production-mode smoke.
  - Only after production smoke passes, regenerate final public samples and run report-path E2E assertions.
  - Final public samples must use clean property names only.
  - Do not publish public samples until production PDF mode is verified and report-path assertions pass.
  - Do not overstate AI support publicly; AI/fallback/QA language remains internal only.

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

## 7.2 Report Purchases Schema Reality (Locked)

```text
id
user_id
product_type
stripe_session_id
job_id
consumed_at
created_at
```

Notes:

- `product_type` is the purchase classification field (`screening`, `underwriting`).
- There is no `report_type` column in `public.report_purchases`.
- There is no `consumed` boolean in `public.report_purchases`.
- A purchase is considered consumed when `job_id` and `consumed_at` are populated.
- To restore a credit manually after a system-side failed/bad publication, clear only the affected purchase row's `job_id` and `consumed_at`, using `product_type` and the specific bad `job_id` as safeguards.

## 8. Key Files
- `api/generate-client-report.js`
- `api/report-template-runtime.html`
- `api/parse/parse-doc.js`
- `src/lib/pdfSections.js`
- `src/pages/Dashboard.jsx`
- `src/pages/AdminDashboard.jsx`
- `api/admin/queue-metrics.js`
- `api/admin/run-eligible-jobs-once.js`
- `api/legal-acceptance.js`
- `api/admin-run-worker.js`
- `src/pages/Pricing.jsx`
- `lib/ai-rent-roll-recovery.js`
- `lib/ai-t12-recovery.js`
- `api/parse/extract-job-text.js`
- `tests/e2e/run-e2e.js`
- `tests/e2e/assert-report-output.js`
- `tests/e2e/fake-supabase.js`
- `tests/e2e/worker-state-scenarios.js`
- `tests/e2e/parser-adversarial.js`
- `tests/e2e/fixtures/jobs/wave2-job-lifecycle.json`
- `tests/e2e/fixtures/parser/wave4-parser-adversarial.json`

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

## 10.3 AI/Admin QA Safeguard Layer (Phase 1 Implemented)
- Status changed after Motherload QA:
  - Phase 1 internal deterministic QA safeguard is implemented as launch hardening
  - concierge hold, Stripe promo-code tagging, report visibility suppression, RLS changes, and admin approval workflow were deliberately deferred
  - user concern remains high-value users, especially `$100M+` portfolio prospects, hitting failed reports or weak sample reports
  - question has shifted from "Can the report engine publish?" to "Can InvestorIQ recognize whether a published report is actually investor-ready?"
- Public-positioning constraint:
  - this layer is founder/internal only
  - public language should use internal quality safeguards, source-verification controls, deterministic validation, document-driven / document-backed, and proprietary document-driven underwriting infrastructure
  - do not expose AI QA / AI-assisted QA / AI fallback language in customer or website copy
- Locked doctrine:
  - InvestorIQ is document-driven
  - deterministic parsers and calculations remain the source of truth
  - AI may help read / extract documents, but may not become the source of financial truth
  - AI must not write or override NOI, rent, occupancy, debt, DSCR, cap rate, valuation, refinance, or deal score
  - no BUY / SELL language
  - no fabricated values
  - fail closed when documents are missing, unsupported, or materially inconsistent
- Implemented Phase 1:
  - `api/generate-client-report.js` builds deterministic, internal, non-blocking QA flags
  - writes `analysis_artifacts.type = report_qa_flags`
  - bucket `internal`
  - payload includes `qa_status`, `severity`, `flags`, report type/tier, and HTML length
  - if QA artifact insert fails, report generation should not fail
  - no report visibility changes, email suppression, RLS changes, Stripe/promo changes, worker state machine changes, parser-output changes from QA itself, or customer-facing copy
- Initial QA flags cover / validate:
  - missing debt balance where debt context exists
  - DSCR not assessed despite debt context
  - property tax amount implausible / year-like
  - T12 totals-only / no meaningful line detail
  - market survey / support-doc classification review
  - cap-rate / appraisal support not used or masked
  - DocRaptor non-production mode as internal QA flag
- Phase 1 lesson:
  - it worked for artifact / document-integrity risks
  - it is not yet final rendered-PDF editorial or sample-readiness QA
  - it did not catch `Underwritting`, `CLEAN` / `MESSY` / `Test` sample naming, rent-gap basis inconsistency, stale static Methodology headings in already-generated PDFs, overstrong `Target Rent (Post-Reno)` wording, dangling `DATA NOT AVAILABLE`, or verdict/copy optics
- Possible Phase 1.2 rendered-report QA flags:
  - `Underwritting`
  - `CLEAN`, `MESSY`, or `Test` in public sample property name
  - old `12.1 / 12.2 / 12.3` methodology headings
  - rendered `DATA NOT AVAILABLE`
  - `Target Rent (Post-Reno)` when no structured renovation artifact exists
  - mixed rent-gap basis if both `17.4%` and `14.8%` appear
- Do not overbuild tonight; tomorrow priority is cleanup and validation.
- Future / deferred direction:
  - optional manual approval gate for initial high-value / concierge workflows
  - deterministic parser / calculation layer remains the source of truth
  - AI QA may flag issues but must not inject financial values
- AI QA may inspect:
  - uploaded file list
  - extracted text metadata
  - parsed artifacts
  - generated report HTML / PDF text
  - missing / failed artifacts
  - contradictions across artifacts
- AI QA may flag:
  - loan file appears to contain a balance but artifact has `loan_amount = null`
  - property tax amount looks like a year / invalid amount
  - appraisal or cap-rate support conflicts, or a null artifact masks a valid artifact
  - market survey misclassified as rent roll
  - uploaded-but-unused docs that may matter
  - T12 has expense lines but report shows lump-sum only
  - report says DSCR not assessed despite debt-looking support file
  - CapEx / support docs acknowledged but not modeled, where that restraint should be explicitly reviewed
  - long narrative rent roll likely to fail and should use CSV/XLSX
- AI QA must NOT:
  - write accepted financial values directly
  - override deterministic parsers
  - change NOI, rent, occupancy, debt, DSCR, cap rate, valuation, refinance, or deal score
  - publish unsupported assumptions
- Possible outputs:
  - internal QA warnings
  - admin review status
  - block publication pending review
  - customer-safe failed / needs-review message
  - support checklist for manual repair / retry
- This needs Codex investigation / design before implementation.
- Manual Admin QA Gate:
  - now a candidate pre-Ken Dunn / high-value concierge hardening option
  - reports may remain private until admin approval if this mode is adopted
- Later cleanup themes:
  - SES helper cleanup
  - entitlement / schema cleanup
  - Dashboard auto-visibility hardening
  - large-text rent-roll AI recovery: chunking, shorter prompt construction, CSV/XLSX steering, and clearer large-rent-roll fallback guidance
## 11. Launch Readiness Snapshot
- **Current launch status as of May 3: PAUSED on active P0 report-reuse blocker.**
- Previous scenario coverage audit recommendation was Launch this week = CONDITIONAL, but the May 3 same-name Screening/Underwriting live test introduced a new hard stop before production PDF smoke.
- Launch conditions:
  - low-dollar live Stripe payment test if still outstanding
  - final Ken Dunn sample package review
  - final readiness check / sample package selection
  - stop only if a new report-core math or document-integrity regression appears
- May 3 live validation blocker:
  - Public legacy sample route remains closed; `/reports/sample-report.html` is neutral live.
  - Live test-mode Screening for `124 Richmond Street, London, ON` published correctly.
  - Live test-mode Underwriting with the same property name reached `published` but reused the existing Screening report instead of creating an Underwriting report row/PDF.
  - This consumed the Underwriting credit and sent a report-published email despite no Underwriting PDF being created.
  - Manual entitlement remediation completed: the Underwriting purchase row was restored by clearing `job_id` and `consumed_at`; Screening purchase remains correctly consumed.
  - Current sequence is blocked until existing-report reuse is fixed and retested.
- May 2 launch-readiness update:
  - harness layers are materially stronger after report assertions, mock lifecycle fixtures, worker-state simulation, parser-adversarial fixtures, and repo-wide public-output sweep
  - no product bugs remain from Waves 1-4 after the LTV parser patch and columnar T12 total-selection patch
  - Wave 5 found no confirmed live public-output blocker
  - Wave 4 parser adversarial now includes and passes Jan-Dec plus TTM / Annual Total T12 selection
  - no remaining E2E failures after T12 total-selection patch: `156 PASS / 0 FAIL / 8 SKIP`
  - current harness is still non-live for:
    - real worker execution
    - real Supabase writes
    - real DocRaptor generation
    - real credit restoration
    - real Dashboard upload flow
  - live flow has still been manually validated through prior report generation; harness is the non-live safety net
- May 3 end-of-night launch-path update:
  - `npm run test:e2e`: `156 PASS / 0 FAIL / 8 SKIP`
  - direct Wave 4: `85 PASS / 0 FAIL / 8 SKIP`
  - direct Wave 4 overwrote `tests/e2e/results/latest-e2e-results.json`
  - previous intended sequence was:
    - live test-mode report validation first
    - DocRaptor production-mode smoke second
    - final public sample generation only after report-path assertions pass
  - current sequence is paused before DocRaptor production smoke until the May 3 existing-report reuse blocker is patched and same-name Screening/Underwriting retest passes.
  - confirmed remaining test gaps:
    - default E2E run has no final PDFs configured
    - report-path assertions exist through `--report` / `test:e2e:report`
    - parser coverage includes one Jan-Dec plus `TTM Total` case
    - T12 variants not separately covered: `Annual`, `Annual Total`, `T12`, `Trailing 12`, and monthly dollar columns with adjacent percent columns
    - appraisal later-null artifact masking earlier valid cap-rate support is not covered as an E2E fixture
    - worker-state simulator does not execute `api/admin-run-worker.js` directly
    - report generation failure before publish remains mostly static / simulator-level
    - `needs_documents` remains in Dashboard display / query code as legacy-row display risk, but current worker path does not appear to set it
  - DocRaptor production path truth:
    - live generator requires both `DOCRAPTOR_MODE=production` and `ALLOW_PRODUCTION_PDF=true`
    - `DOCRAPTOR_API_KEY` supplies auth
    - `DOCRAPTOR_TEST_MODE` is only used in admin regeneration event logging and does not control actual generator output
    - `scripts/generate-sample-pdf.js` is hardcoded `TEST_MODE = true` and must not be used for public samples
  - production smoke sequence:
    - create / validate a clean-name public-candidate job while still in test mode
    - flip only `DOCRAPTOR_MODE=production` and `ALLOW_PRODUCTION_PDF=true`
    - redeploy production
    - admin-regenerate that already-validated clean job
    - do not publicly link or share the smoke PDF
    - confirm latest `report_qa_flags` does not include `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - confirm no DocRaptor watermark / test bands
    - run report-path E2E assertions on downloaded PDF / text output
  - rollback if smoke fails:
    - set `DOCRAPTOR_MODE=test` or remove it
    - set `ALLOW_PRODUCTION_PDF=false` or remove it
    - redeploy required
  - live test-mode checklist before DocRaptor production, after P0 reuse fix:
    - same-name Screening + Underwriting retest must produce two distinct report rows/PDFs
    - T12-columnar live sample if available
    - clean Screening public-candidate sample
    - clean Underwriting public-candidate sample
    - optional fail-closed test
  - stop / go rule:
    - GO to DocRaptor production smoke only if the May 3 report-reuse P0 is patched/retested, live parser proof passes, clean Screening and clean Underwriting publish with distinct report rows/PDFs and no public-output defects, and any fail-closed test restores credit with no report row
    - STOP if any live report fabricates core metrics, silently accepts missing required docs, emits public AI / BUY / SELL language, has stale sample naming, fails DSCR verdict cap, creates a report on required-doc failure, or reuses a report artifact across report types
  - public legacy sample route:
    - `public/reports/sample-report.html` was patched locally to a neutral placeholder and production hard-refresh / reset confirmed `https://investoriq.tech/reports/sample-report.html` now renders the neutral InvestorIQ Sample Materials placeholder
    - old Riverbend Heights static sample with BUY / IQ-assisted wording is no longer visible at that route
    - treat `public/reports/sample-report.html` P0 as production-verified closed
    - `src/lib/pdfSections.js` still contains legacy `STRONG BUY` but is P1 unless reintroduced into active routes
    - do not use `public/reports/sample-report.html`, `api/html/sample-report.html`, or `scripts/generate-sample-pdf.js` for public samples
    - current sample PDFs must come only from the approved live generation path after DocRaptor production smoke passes
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
- Launch-ready areas once active P0 is closed:
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
  - compact AI Rent Roll Recovery is proven live in Underwriting through `01_positive_ai_rent_roll_underwriting TIMEOUT RETEST`
  - dual AI recovery is proven live in Underwriting through `03_positive_dual_ai_recovery_underwriting CONTROL RETEST`
  - long full-unit narrative `.txt` rent roll recovery failed closed safely through `04_long_ai_rent_roll_stress_underwriting`; treat as known V1 scale limitation, not a launch blocker
  - failed pre-publication Dashboard copy now states no report was published and 1 report credit was returned before file-specific guidance
  - Motherload Underwriting published but is not website-sample ready; it exposed support-doc classification / extraction / QA gaps that should be handled before high-value public samples
  - Harbourstone Test 5 is now clean enough as stress-test proof only:
    - published 15-page report
    - DSCR rendered `1.06x`
    - property tax parsed `$124,000`, not `2025`
    - refinance classification rendered `Refinance Shortfall Under Stress`
    - cap-rate basis `5.75% (document derived)`
    - remaining QA flags are `T12_TOTALS_ONLY`, `MARKET_SURVEY_CLASSIFICATION_REVIEW`, and `DOCRAPTOR_NOT_PRODUCTION_MODE`
    - not public sample / Ken Dunn candidate
  - rendering-stage / pre-generation cross-document scale mismatch protection is now in place and validated
- Still needed before Ken Dunn outreach:
  - Patch and retest the May 3 existing-report reuse P0 before DocRaptor production smoke or public sample generation.
  - QA safeguard Phase 1 is implemented; do not build concierge hold/admin approval until after current cleanup unless a new blocker appears
  - create or select a clean Showcase package separate from Motherload stress testing
  - if available, regenerate / validate one T12-columnar sample after the parser total-selection patch
  - resolve DocRaptor production mode before any public sample PDF
  - run final E2E report-path assertions against selected public sample PDFs
  - complete low-dollar live Stripe payment test if still outstanding
  - complete Ken Dunn sample package review
  - complete final readiness check / sample package selection
  - visually retest long cover-title wrapping when a long-name report is regenerated
  - patch only real regressions found in the synthetic validation / final readiness pass
  - do not claim AI handles all long / large narrative `.txt` rent rolls; CSV/XLSX remains preferred for large rent rolls in V1
  - broader accepted-file-type hardening remains post-launch unless support needs to be tightened pre-launch
- Ken Dunn read:
  - Clean underwriting is closest to Ken-ready after regeneration and copy polish
  - Messy underwriting is stress-test proof only
  - Screening is close but needs rent-gap consistency and label polish
  - Harbourstone is stress-test proof only
  - do not show any report to Ken with DocRaptor test watermark, `Test`, `CLEAN`, `MESSY`, typo `Underwritting`, stale Methodology numbering, inconsistent rent-gap percentages, unsupported post-reno wording, or dangling `DATA NOT AVAILABLE`
