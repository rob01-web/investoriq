# InvestorIQ Master Context — April 2026

## 1. Current Product State
- InvestorIQ is in final validation and outreach-prep.
- InvestorIQ remains in pre-launch phase, April 2026, and is now days away from outreach to Ken Dunn.
- Screening report is materially compressed, document-driven, and positioned as a decision-grade screening memorandum.
- Underwriting report retains full debt, refinance, valuation, and scenario depth with deterministic inputs only.
- Website positioning, pricing copy, contact routing, and core report wording have been materially tightened for launch.
- Website copy and positioning have been hardened to remove legacy automation references and reinforce proprietary, document-driven positioning.
- Test 9 returned to green after the live `public.reports` persistence issue was corrected.
- Reports are generating successfully; stability and precision are now the top priority.
- Main launch blocker remains Dashboard stability / UI freeze behavior.
- Launch phase status: final validation, low-dollar live Stripe acceptance confirmation, and outreach-prep remain before outreach.

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
- One purchase = one report.
- No subscription.

## 4. Core System Architecture
- Node-based backend/API layer drives parsing, report generation, admin actions, and payment flow.
- Supabase is the system of record for auth, database tables, storage, and generated report artifacts.
- Stripe handles checkout and report purchase entitlements.
- DocRaptor renders final HTML into production PDFs.
- Textract plus `pdf-parse` handle document text extraction and fallback parsing paths.
- Report generation is deterministic first, with narrative assembly layered on top of structured artifacts and computed outputs.

## 5. Current Report Rules
- Screening and Underwriting are separate report products, not layered versions of the same memo.
- Screening is a concise acquisition screening memorandum built primarily from T12 and rent roll inputs.
- Underwriting is the full capital-risk report with debt structure, refinance capacity, valuation, and scenario depth when supporting documents exist.
- InvestorIQ does not "use only 3 documents."
- T12 and Rent Roll are the core required structured inputs.
- Debt terms / mortgage documents are incorporated when they are successfully parsed into structured fields.
- Additional supporting documents may be uploaded, but only recognized and structured inputs are incorporated into quantitative underwriting.
- Unsupported or unstructured documents are excluded from modeling rather than guessed from.
- One-and-done entitlement rule applies unless regeneration is triggered for system/support reasons.
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

- Debt document routing hardened:
  - Normalized `debt_term_sheet` -> `loan_term_sheet` in `parse-doc.js` to ensure consistent extraction path and artifact generation.
- Loan term sheet inference expanded:
  - `inferDocTypeFromText(...)` now supports compact lender-style debt summaries (e.g., "REFI TERMS", "Rate", "AM", "LTV") using signal-count + financing-pattern gating.
  - Prevents valid debt documents from falling into `supporting_documents_unclassified`.
- Loan amount extraction hardened:
  - Replaced single-match parsing with multi-candidate collection using `matchAll(...)`.
  - Added plausibility filter (`>= 10,000`) to eliminate OCR noise and small-value miscaptures (e.g., `$75`).
  - Deterministic selection now returns the largest valid candidate.
- Result:
  - Messy debt documents now correctly produce `loan_term_sheet_parsed` artifacts.
  - Underwriting debt inputs (loan balance, rate, amortization, LTV) reliably populate from compact or non-standard lender formats.
  - DSCR and refinance outputs no longer break due to invalid small-value parses.

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

- Current status:
  - Dashboard behavior improved somewhat versus earlier state
  - User was able to log in, enter a full property address, and run a Screening report successfully
  - Freeze still reproducible after report generation during later Dashboard interaction
  - Root cause not yet fully isolated
  - Strong suspicion remains:
    - broader Dashboard state/reactivity overload
    - overlapping fetch / effect chains
    - render-loop interaction or repaint thrash

- Important:
  - No further Dashboard structural changes should be made without controlled isolation
  - Avoid broad refactors this close to launch

- Strategic interpretation:
  - Current concern is not that the backend cannot necessarily handle serious demand.
  - Current concern is that the Dashboard frontend has likely accumulated too many responsibilities and overlapping reactive paths.
  - If Ken Dunn responds positively and syndicate interest increases, Dashboard stability and simplification become urgent because the customer control surface must feel stable and institutional.
  - Future hardening should prioritize a lighter Dashboard orchestration model and potentially a cleaner dashboard-state layer or helper endpoint rather than continuing to pile more logic into `Dashboard.jsx`.

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
- Worker loop / double-trigger verification: completed.
- Stripe checkout -> entitlement flow practical validation: completed.
- Checkout ghost-job creation removal: completed.
- Dashboard null-name `needs_documents` containment patch: completed.
- Property-name redundant state-commit reduction: completed.
- Post-analyze refresh deferral test: completed.

### Immediate agenda — April 11, 2026
- STEP 1 — END-TO-END TESTING
  - Run:
    - 1 clean Screening report
    - 1 clean Underwriting report
    - 1 messy Underwriting report
  - Confirm:
    - no missing sections
    - no incorrect wording
    - no regressions
    - no encoding issues
- STEP 2 — STRIPE LIVE PAYMENT TEST
  - Create low-dollar live product or test price ($1 or similar)
  - Run real payment (NOT coupon-based)
  - Confirm:
    - payment appears in Stripe dashboard
    - Stripe balance updates
    - payout path to TD bank account is functioning
- STEP 3 — CODEX AUDIT
  - Provide fresh outputs from April 11 tests
  - Request STRICT institutional audit
  - Only fix if a REAL blocker is identified
  - No cosmetic rewrites
- STEP 4 — FINAL READINESS CHECK
  - Confirm:
    - sample reports are elite quality
    - system is stable
    - no last-minute risks
    - no UI blocking issues (Dashboard freeze must be resolved or isolated)

### Before Ken Dunn outreach
- Screening test result â€” April 11, 2026
  - Successfully generated:
    - `124 Richmond Street (Screening Test 33)`
  - Quick review outcome:
    - structurally strong overall
    - no major missing-section issue observed from quick review
    - minor cosmetic note observed: brand text showed `INVEST ORIQ` spacing / kerning issue in parsed output

- Fresh final Screening PDF generated and approved.
- Fresh final Underwriting PDF generated and approved.
- Messy / mixed-document regression pass completed.
- Stripe live-money acceptance tested at low dollar amount.
- Homepage / sample-report replacements finalized if still pending.
- One final manual QA sweep completed:
  - report type labels
  - executive summary wording
  - updated wording appearing in live PDFs
  - no wrong-report references
  - no padded or robotic phrasing
  - no mojibake or typography regressions
  - no unsupported narrative claims
- No real launch blockers remaining.
- Outreach email to Ken Dunn only after all items above are green.

### Exact next task / resume point
- Continue isolating and reducing Dashboard state-reactivity overload.
- Focus on Dashboard-wide responsiveness, not just the property input field.
- Likely next step is a controlled reduction of Dashboard live reactivity / overlapping fetch-effect chains, one surgical change at a time.
- Use anchor-locked minimal diffs only.
- No refactors.
- No random patching.

### Launch Risk Flag (Dashboard)

- Dashboard input freeze is currently the only known high-severity UX risk.
- Must be:
  - resolved
    OR
  - safely isolated (non-blocking to report generation + checkout)
- No outreach should occur until:
  - user can reliably enter property name without UI lock

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
  - messy underwriting regression output has reached production-pass status
  - worker publish-loop behavior is confirmed stable in a single-run path
  - Stripe entitlement behavior is practically validated through repeated real-world checkout testing
- Still needed before Ken Dunn outreach:
  - Dashboard freeze / responsiveness issue resolved or safely isolated
  - fresh final Screening PDF generated and approved
  - fresh final Underwriting PDF generated and approved
  - messy test regression pass completed
  - low-dollar live Stripe acceptance test completed
  - homepage sample report replacement finalized if still pending
  - one final manual QA sweep completed
  - no real launch blockers remaining
