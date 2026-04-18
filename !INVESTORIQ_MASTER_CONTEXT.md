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
- Report validation block is now materially green:
  - Screening green
  - clean Underwriting green
  - messy Underwriting green
- Deterministic / no-hallucination / document-driven behavior is now validated in the live report path.
- Website positioning, pricing copy, contact routing, and core report wording have been materially tightened for launch.
- Website copy and positioning have been hardened to remove legacy automation references and reinforce proprietary, document-driven positioning.
- Test 9 returned to green after the live `public.reports` persistence issue was corrected.
- Reports are generating successfully; stability and precision are now the top priority.
- A severe Dashboard freeze was isolated through controlled diagnostic containment and materially resolved through Report History render-path stabilization.
- Authenticated session / global auth, the property input alone, and fetched report data alone were each ruled out as the primary cause.
- The freeze was isolated to the rendered Report History table/rows subtree.
- Replacing the old Report History table with a lightweight stacked list/card layout materially resolved the catastrophic browser-freeze behavior.
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
- Current Dashboard status: stable in the reverted manual-refresh state, with light monitoring recommended for any residual sluggishness.
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
- InvestorIQ does not "use only 3 documents."
- T12 and Rent Roll are the core required structured inputs.
- Debt terms / mortgage documents are incorporated when they are successfully parsed into structured fields.
- Additional supporting documents may be uploaded, but only recognized and structured inputs are incorporated into quantitative underwriting.
- Unsupported or unstructured documents are excluded from modeling rather than guessed from.
- One-and-done entitlement rule applies unless regeneration is triggered for system/support reasons.
- One-and-done product rule is now explicitly confirmed:
  - users do not upload additional documents after report generation begins as part of the normal product flow
  - the old missing-doc continuation / reminder workflow is legacy behavior and is no longer part of the intended launch model
  - no refunds once report generation is in progress unless there is a true system-side error
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
- NOI breakdown wrapping was rechecked in the latest live validation runs and now appears visually resolved.

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

### Latest Live Validation Status (April 2026)

- Clean Screening Test 4 = GREEN
  - `Preliminary Screening` correct
  - heading correctly shows `Data Coverage & Screening Notes`
  - math remains consistent:
    - EGI `192,960`
    - OpEx `120,790`
    - NOI `72,170`
    - Expense Ratio `62.6%`
    - NOI Margin `37.4%`
    - Break-even Occupancy `65.3%`

- Clean Underwriting Test 4 = GREEN
  - clean underwriting path accepted as correct / document-driven
  - no vacancy invention
  - live NOI breakdown visual issue was rechecked and appears visually resolved

- Messy Underwriting Test 4 = GREEN
  - preserved validated messy basis:
    - EGI `187,172`
    - OpEx `120,790`
    - NOI `66,382`
    - Expense Ratio `64.5%`
    - NOI Margin `35.5%`
    - DSCR `1.00x`
    - Refinance Proceeds / Debt Balance `0.80x`
    - Stressed Proceeds / Debt Balance `0.55x`
  - page 8 NOI breakdown visually rechecked and appears clean

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

- Result:
  - Typing in Dashboard input no longer blocks UI thread.
  - No browser freeze during input or upload flow.
  - Rendering stabilized without altering business logic.

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
  - Reports load successfully.
  - Dashboard freeze resolved.
  - Supabase queries execute cleanly.

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
  - Final production state:
    - the old table-based Report History non-empty branch was replaced with a lightweight stacked list/card layout.
    - catastrophic browser-freeze behavior appears materially resolved after that change.
    - repeated typing and refresh testing became stable enough to stop further speculative property-input tuning before launch.

- Important:
  - No further Dashboard structural changes should be made without controlled isolation
  - Avoid broad refactors this close to launch

- Strategic interpretation:
  - Current concern is not that the backend cannot necessarily handle serious demand.
  - Dashboard-local churn was real, but the catastrophic freeze was isolated more narrowly to the old Report History table/rows render subtree.
  - The applied stacked-list replacement is treated as the operative stabilization fix.
  - Dashboard should still be monitored during final validation, but the current evidence no longer supports treating the freeze as an unresolved architecture-level blocker.
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

### Immediate agenda - April 12, 2026
- HIGH PRIORITY NEXT
  - Report-core validation block is now green:
    - Screening green
    - clean Underwriting green
    - messy Underwriting green
  - Keep worker frozen in the last known-good rollback state unless a brand-new blocker appears.
  - Focus remaining pre-outreach work on outreach prep / pricing / notifications / final polish rather than report-core math failures.

- STILL OPEN
  - Preserve Resend as the launch notification default
    - `report_published` email path is now live on Resend and validated through a controlled live Screening test
    - preserve Resend as the launch provider for report-published emails
    - obsolete worker missing-doc SES send calls were removed
    - worker no longer imports `sendEmailSES`
    - optional later cleanup: remove / retire leftover SES helper / config / doc references if desired
    - not required before Ken Dunn outreach unless a new blocker appears
    - treat this as launch-readiness / notifications work, not a report-core patch
  - Strict ASCII / typography cleanup across user-facing surfaces
    - remove unicode arrows, ellipses, and similar characters surgically
    - no broad sweep
  - Post-launch / post-blocker entitlement-model cleanup investigation
    - verify whether `report_purchases` is the true entitlement ledger
    - determine whether `profiles.report_credits` and related Dashboard credit displays are stale, secondary, legacy, or misleading
    - clean up empty / unclear credit tables and 0-credit display behavior after launch blockers are cleared
  - Admin Dashboard worker-run visibility improvement
    - show queued job count clearly
    - show which jobs likely still need another worker run
    - reduce manual guesswork while worker still requires 2 runs
  - Dashboard follow-up after launch blockers are cleared
    - revisit Report History auto-visibility so newly published reports appear without manual Refresh
    - avoid full-page reloads or broad auto-sync patterns that previously reintroduced freeze / regression risk
    - prefer a tightly scoped, low-churn solution only
    - investigate after launch blockers are cleared why the tiny completion `fetchReports()` hook re-triggered freeze signs
  - Final pre-launch language / typography sweep
    - one final search for mojibake
    - em dash / en dash cleanup
    - remove any public-facing `AI` / `artificial intelligence` / generic AI-sounding wording
    - preserve proprietary document-driven positioning
  - Low-dollar true live Stripe payment test (non-coupon) if not yet completed
  - Final Codex institutional audit after final reports are reviewed
  - Final readiness check after report review and any real blockers are fixed

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
- Dashboard catastrophic freeze issue appears materially resolved after Report History render-path stabilization.
- Continue light monitoring during final validation for any residual sluggishness.
- Outreach email to Ken Dunn only after all items above are green.

### Exact next task / resume point
- FIRST THING TOMORROW MORNING
  - continue final outreach-prep / pricing / notification / polish work from the now-de-risked launch baseline

- AFTER THAT
  - complete final outreach-prep / pricing / notification / polish items
  - optionally remove / retire leftover SES helper / config / doc references later if desired
  - apply any surgical copy / typography cleanups that are truly needed
  - run final Codex institutional audit only if needed
  - complete final readiness check
  - prepare website sample report placement for public display
  - worker logic remains frozen in rollback state unless a brand-new blocker appears

- Use anchor-locked minimal diffs only.
- No refactors.
- No random patching.

### Launch Risk Flag (Dashboard)

- Dashboard catastrophic freeze issue appears materially resolved after Report History render-path stabilization and completion-reload experiment reversion.
- Continue light monitoring during final validation.
- No current evidence of the prior machine-locking behavior after the stacked-list fix.
- The team chose not to pursue additional speculative property-input optimization before launch because repeated typing and refresh testing became stable once the Report History table subtree was replaced.

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

## 10. Launch Readiness Snapshot
- Launch-ready now:
  - pricing and positioning are fully aligned with institutional positioning and proprietary-system messaging
  - screening vs underwriting separation is materially cleaner
  - contact routing is corrected
  - dashboard/admin support workflow is operational
  - Test 9 is back to green and pipeline/report creation is restored
  - core report engine is stable enough for final validation and outreach-prep
  - underwriting cap-rate consistency is fixed across refinance, debt structure, scenario analysis, and DCF
  - Screening is green
  - clean Underwriting is green
  - messy Underwriting is green
  - deterministic / no-hallucination / document-driven report behavior is validated
  - Dashboard catastrophic freeze is materially resolved in the reverted stable manual-refresh state
  - multi-quantity Stripe checkout is now working
  - Stripe entitlement creation for quantity purchases is now working
  - launch-critical `report_published` email notifications are live on Resend and validated
  - obsolete SES worker exposure for the legacy missing-doc workflow has been removed
  - report-ready email wording now matches the actual one-and-done product model
- Still needed before Ken Dunn outreach:
  - worker remains in the last known-good rollback state, with stability prioritized over further pre-launch worker experimentation
  - preserve the Resend-backed `report_published` notification path as the launch notification default
  - accept that broader SES helper / config cleanup is optional later work, not a current launch blocker
  - accept that Dashboard remains in locked manual-refresh posture before launch
  - no more Dashboard sync experiments before outreach unless a brand-new blocker appears
  - strict ASCII / typography cleanup where truly needed
  - low-dollar true live Stripe payment test if not yet completed
  - final Codex institutional audit if needed after report review
  - final readiness check and sample presentation readiness
  - outreach prep / pricing / notification / final polish items
