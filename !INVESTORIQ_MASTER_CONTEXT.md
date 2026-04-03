## ✅ INVESTORIQ FINAL LAUNCH PHASE — APRIL 2026 UPDATE

### CURRENT STATE

# 🔒 CURRENT STATE — PRE-LAUNCH STABILIZATION (LATEST)

## Status: FINAL POLISH BEFORE UNDERWRITING TEST + SOFT LAUNCH

We have successfully completed a full **Screening Report polish pass** focused on:
- Eliminating generic / framework-driven language
- Converting all narrative tone to **document-derived wording**
- Removing duplication and promotional phrasing
- Tightening institutional tone across all sections

---

## ✅ COMPLETED (THIS SESSION)

### 1. Narrative Hardening (Document-Driven Language)
Replaced remaining model/generic phrasing with grounded language tied to uploaded documents:

- "Thin operating margin with limited shock tolerance."
  → "Operating margin is narrow relative to current expense load."

- "Cash flow remains positive but is sensitive to operating variance."
  → "Cash flow remains positive but is sensitive to changes in income and expenses."

- "Operating margins remain within stable screening thresholds."
  → "Operating margins remain within a stable range based on uploaded operating results."

- "Operating performance remains within stable thresholds."
  → "Operating results remain stable based on uploaded operating data."

---

### 2. PDF Section Tone Fixes (`pdfSections.js`)
Removed brochure / pitch language:

- "High level view of yield, risk, and strategy in one glance."
  → "Summary of operating performance, risk, and positioning."

- "Five path view from downside protection to upside potential..."
  → "Scenario outcomes across downside, base, and upside operating cases."

- "Document-driven view for investment committees and partners."
  → "Observations derived from uploaded operating and supporting documents."

---

### 3. Template / Visual Fixes
- Fixed **INVESTORIQ spacing bug** (letter-spacing reduced)
- Renamed:
  - "Illustrative Unit Mix and Rent Lift"
  → "Unit Mix and Rent Lift"
- Removed weak duplicate rent statement while preserving strongest instance

---

### 4. Contact System Refactor (CRITICAL UX FIX)
Moved from single inbox → structured routing:

- support@investoriq.tech
- billing@investoriq.tech
- reports@investoriq.tech

Applied across:
- Contact page
- Pricing page
- Checkout success
- Legal pages
- Meta tags (index.html)
- Shared utils
- Public test files

Confirmed:
- ❌ No remaining `hello@investoriq.tech` in user-facing code
- ✅ Internal `adminEmail` preserved (non-user-facing)

---

## ⚠️ INTENTIONAL NON-CHANGES

These were reviewed and deliberately kept:

- Financing Envelope section
  → remains standardized but acceptable (institutional framing)

- Single strongest rent positioning sentence
  → preserved intentionally (not duplication anymore)

- Internal regex anchors referencing old wording
  → NOT user-facing, safe to keep

---

## 🧪 NEXT STEP (IMMEDIATE)

Run:

### → FULL UNDERWRITING REPORT TEST

Goal:
- Confirm tone consistency vs Screening
- Ensure no regression into:
  - generic language
  - “framework-driven” phrasing
  - promotional tone
- Validate:
  - refinance logic output
  - debt structure clarity
  - section collapses working properly

---

## 🎯 FINAL PRE-LAUNCH CHECKLIST (VERY CLOSE)

Remaining before outreach (Ken Dunn):

1. ✅ Screening report = COMPLETE
2. ⏳ Underwriting report = FINAL VALIDATION
3. ⏳ Website minor polish (if anything surfaces)
4. ⏳ Final narrative consistency sweep (if needed)
5. ⏳ Email outreach draft (Ken Dunn)

---

## 🧠 POSITIONING LOCKED

InvestorIQ V1 is now positioned as:

> "The only document-driven underwriting tool that models refinance collapse risk."

- No BUY/SELL language
- No speculation
- No fabricated narratives
- Fully deterministic + document-derived

---

## 🚨 IMPORTANT RULE (MAINTAIN GOING FORWARD)

Every sentence in the report must pass:

> "Could this sentence exist WITHOUT the uploaded documents?"

If YES → it must be rewritten or removed.
If NO → it stays.

---

# END CURRENT STATE

InvestorIQ is now in final launch hardening.

Core engine status:
- worker loop / extraction / parallel execution previously validated
- screening vs underwriting separation materially improved
- pricing page positioning updated to match launch thesis
- homepage wording materially strengthened
- about page wording tightened
- underwriting executive-summary wrong-report-type leakage fixed with hardened regex-based removal
- verification passed: no underwriting path can render the screening-positioning sentence

### SCREENING COMPRESSION STATUS

Patch 9 completed in practice:

- Patch 9A:
  - removed screening cap-rate / implied valuation depth
  - replaced with concise rent-positioning summary
- Patch 9B:
  - collapsed screening operating-analysis sprawl
  - replaced separate forensics / expense / NOI blocks with one tighter Operating Profile Summary
- Patch 9C:
  - tightened screening summary wording to memo-style language
  - removed overly padded / analytical phrasing

Result:
- screening now reads much closer to a clean IC-style screening memo
- underwriting depth preserved

### WEBSITE POSITIONING STATUS

#### Pricing page
Updated successfully:
- headline:
  - "Document-driven underwriting for real estate investors."
- subline:
  - "Built from your T12, rent roll, and deal documents — not assumptions."
- screening / underwriting separation is now clearer
- pricing remains:
  - $399 screening
  - $1,499 underwriting

Additional pricing copy refinements completed:
- stronger eyebrow labels
- tighter feature lists
- more premium CTA / comparison language
- no layout / styling changes
- branding remains locked

#### Homepage
Homepage wording pass completed:
- stronger hero positioning
- less SaaS / less robotic
- method section improved
- trust-pillar language improved
- sample CTA improved
- no branding drift
- colors / fonts / layout remain locked

#### About page
About page wording tightened:
- removed defensive / pitch-deck language
- stronger investment-committee / audit-trail language
- no structural changes

### REPORT LANGUAGE HARDENING

Inventory completed for user-facing report wording across:
- api/generate-client-report.js
- api/report-template-runtime.html
- src/lib/pdfSections.js

Approved next wording-fix wave includes:
- weaker screening-vs-underwriting references
- templated DSCR phrasing
- generic finance jargon
- promotional / self-validating template language
- appraisal-like / pitch-like wording
- institutional filler not clearly document-driven

### CRITICAL BUG FIX COMPLETED

Executive Summary wrong-report-type bug:
- both test reports were showing the screening-positioning sentence
- root cause narrowed to hardcoded screening sentence plus fragile underwriting cleanup
- underwriting protection hardened with regex-based removal
- verification result:
  - remaining user-facing sentence = screening only
  - underwriting cleanup pattern = non-renderable
  - PASS: no underwriting path can render the screening sentence

### BRAND / STYLE LOCKS (NON-NEGOTIABLE)

Still locked:
- colors
- fonts
- report visual system
- website visual system

Rules reinforced:
- no global em-dash cleanup
- no broad typography cleanup
- no refactors
- no layout drift
- wording-only micro-patches unless explicitly approved

### CURRENT REMAINING PRE-LAUNCH WORK

1. Apply approved report wording cleanup wave
   - generate-client-report.js
   - report-template-runtime.html
   - pdfSections.js

2. Run one fresh production-grade Screening report

3. Run one fresh production-grade Underwriting report

4. Perform final manual QA on both reports:
   - report type labels
   - executive summary wording
   - no wrong-report references
   - no AI-sounding language
   - no mojibake / encoding issues
   - no em-dash regressions
   - no overclaiming / non-document-driven narrative

5. Put final production-grade Screening + Underwriting reports onto homepage sample area

6. Final website deep dive if anything obvious remains

7. Once all above is clean:
   - InvestorIQ is launch-ready
   - prepare and send Ken Dunn outreach email offering:
     - 1 free Screening
     - 1 free Underwriting

### LAUNCH STANDARD

InvestorIQ is launch-ready only when:
- report language is fully hardened
- fresh screening + underwriting PDFs pass final QA
- homepage sample reports are replaced with final production-grade outputs
- website wording is elite and consistent
- no wrong-report leakage remains
- no AI giveaway language remains
## 🔒 V1 FINAL HARDENING — SCREENING COMPRESSION + WORKER STABILITY (LATEST)

### 🚀 SYSTEM STATUS (CURRENT)

* Worker loop fix VERIFIED:

  * Jobs now run end-to-end in a single trigger
  * Root cause: 20s loop timeout vs long DocRaptor + LLM execution
  * Fix: `maxSeconds = 55`
* Parallel execution validated:

  * Screening + Underwriting processed in same run
  * No race conditions observed
* Extraction reuse:

  * Confirmed stable (no redundant Textract calls)
* Report quality:

  * Institutional level confirmed (Test 14 + 15)

---

### ⚠️ CURRENT FOCUS — SCREENING VS UNDERWRITING SEPARATION

Problem identified:

* Screening report (~13 pages) too close to Underwriting (~17 pages)
* Pricing gap ($399 vs # INVESTORIQ â€” MASTER CONTEXT (UPDATED)

,499) not visually justified
* Risk: perceived overpricing / confusion at purchase level

Strategy:

* Preserve institutional tone
* Remove depth, not credibility
* Screening = decision-grade intake
* Underwriting = full investment memo

---

### 🔧 PATCHES IN PROGRESS

#### ✅ Patch 1 — Hide NOI Waterfall (Screening only)

* Guard added:

```js
if (effectiveReportMode !== "screening_v1" && ...)
```

---

#### ✅ Patch 2A — Remove detailed T12 rows (Screening)

```js
finalHtml = replaceAll(finalHtml, "{{T12_INCOME_ROWS}}", effectiveReportMode === "screening_v1" ? "" : (t12IncomeRows || ""));
finalHtml = replaceAll(finalHtml, "{{T12_EXPENSE_ROWS}}", effectiveReportMode === "screening_v1" ? "" : (t12ExpenseRows || ""));
```

---

#### ⏳ Patch 2B — Remove T12 table blocks (Screening)

* Using:

```js
stripMarkedSection(finalHtml, "T12_INCOME_TABLE");
stripMarkedSection(finalHtml, "T12_EXPENSE_TABLE");
```

* Status: pending validation

---

### 📌 REMAINING PATCHES (DO NOT IMPLEMENT YET)

* Patch 3 — Compress Rent Roll detail
* Patch 4 — Remove refinance sensitivity grid (Screening)
* Patch 5 — Remove DSCR sensitivity grid (Screening)
* Patch 6 — Collapse advanced modeling sections
* Patch 7 — Add elite Screening positioning language
* Patch 8 — Final narrative tightening

---

### 🎯 NEXT STEPS (LOCKED ORDER)

1. Validate Patch 2B
2. STOP
3. Resume with Patch 3 (next session)
4. Complete all 8 patches
5. Run:

   * 1 clean Screening test
   * 1 clean Underwriting test (non-Richmond)
6. Final website polish
7. Prepare Ken Dunn demo

---

### 🧠 IMPORTANT POSITIONING UPDATE

Replace:
“triage-level screening”

With:
“Preliminary Investment Screening Memorandum”

Tone requirement:

* Institutional
* Confident
* No retail / casual language

---
## 🔧 SCREENING COMPRESSION — PATCH STATUS (APRIL 1)

### ✅ COMPLETED PATCHES

**Patch 3 — Rent Roll Compression**
- Removed:
  - Rent roll flags card
  - Implied value creation card
- Retained:
  - Unit mix summary
  - Avg rent
  - Occupancy
  - Rent-to-market gap
- Result:
  - Clean summary, no audit-level detail

**Patch 4 — Refinance Sensitivity Grid (Screening)**
- Verified that refinance sensitivity grid is already gated by:
  ```js
  if (effectiveReportMode === "v1_core")
  ```
- Result:
  - Removed from screening
  - Preserved in underwriting

**Patch 5 — DSCR / Sensitivity Tables**
- Confirmed already implicitly covered by existing screening gating / section stripping
- Result:
  - No separate DSCR model grid remains in screening

**Patch 6 — Advanced Modeling Collapse**
- Confirmed removed in screening:
  - DCF
  - advanced modeling sections
  - deep refinance / debt-heavy modeling sections
- Result:
  - Screening no longer includes deep valuation / modeling sections

**Patch 7A — Positioning Language**
- Replaced weak screening language:
  - `"Triage"` -> `"Screening"`
- Updated:
  - Report Tier -> `"Preliminary Screening"`
  - Report Type -> `"Preliminary Investment Screening Memorandum"`
- Result:
  - Institutional tier language now clean and intentional

**Patch 7B — Executive Positioning Statement**
- Added screening-only executive positioning sentence:
  - `"This report is a Preliminary Investment Screening Memorandum. Full debt structuring, refinance modeling, and valuation analysis are included in the Underwriting Report."`
- Result:
  - Clear separation between screening and underwriting

**Patch 8 — Narrative Tightening**
- Tightened screening-only explanation / thesis language
- Removed filler and reduced narrative padding
- Result:
  - Screening reads more like an IC memo and less like compressed underwriting prose

### ⚠️ CURRENT TEST RESULT

Latest validation:
- Underwriting test passed and retained full modeling depth
- Screening test passed functionally but is still approximately 12 pages

### ❗CURRENT PROBLEM

Screening is still too long because it still contains too much analytical density, especially:
- Unit-Level Value Add Analysis (still includes cap-rate / implied value logic)
- Income & Revenue Forensics
- Expense Structure Analysis
- NOI Stability Review
- Refinance Data Sufficiency
- Maximum Financing Envelope

This means the obvious modeling was removed, but too much mid-depth analysis still remains, so screening still feels too close to underwriting.

### 🎯 NEXT REQUIRED PATCH WAVE

Next session should focus on a final screening compression wave:

**Patch 9A — Compress / remove value-add valuation depth**
- Remove cap-rate implied valuation logic from screening
- Keep only concise value-add summary insight

**Patch 9B — Collapse operating analysis density**
- Consolidate or reduce:
  - Income Forensics
  - Expense Structure
  - NOI Stability
- Goal:
  - one tighter operating profile section instead of several mid-depth sections

**Patch 9C — Remove financing depth from screening**
- Remove:
  - Maximum Financing Envelope
  - Refinance Data Sufficiency section
- or compress refinance sufficiency to a very short note inside data coverage

### 🎯 TARGET STATE REMAINS

**Screening**
- 8–10 pages
- fast
- clean
- decision-grade
- no deep or mid-depth analytical sprawl

**Underwriting**
- full depth retained
- refinance / debt / DCF / scenario modeling preserved
- institutional memo quality maintained

### 🧠 KEY TAKEAWAY

The first compression wave successfully removed explicit modeling depth.

The next compression wave must remove implicit analytical density.

That is now the final major step required to create a clear perceived value gap between screening and underwriting.

---
## ðŸŽ¯ PRODUCT OVERVIEW

InvestorIQ is a **document-driven real estate underwriting platform**.

Core positioning:
- â€œThe only underwriting tool that models refinance collapse riskâ€
- Institutional-grade
- Deterministic only (no AI hallucination)
- Fail-closed system
- One purchase = one report (no reruns unless system fault)

---

## ðŸ§± PRODUCT TIERS

### 1. Screening Report (~$299)
- Decision memo style
- Ranked deterministic drivers
- No empty sections
- No speculation
- Fast triage

### 2. Underwriting Report (~$999)
- Full lender-grade analysis
- Refinance risk modeling
- DCF + scenario analysis
- Institutional output (NO BUY/SELL language)

---

## âš™ï¸ CORE ENGINE

Pipeline:

uploads â†’ analysis_job_files â†’ parsing â†’ analysis_artifacts â†’ underwriting â†’ scoring â†’ rendering â†’ PDF

Statuses:
- needs_documents
- queued
- extracting
- underwriting
- scoring
- rendering
- pdf_generating
- publishing
- published

---

## ðŸ” PRODUCT RULES (NON-NEGOTIABLE)

- Deterministic math only
- Fail-closed gating
- No fabricated narratives
- No AI tone
- No BUY/SELL recommendations
- ASCII-only output
- NCO repo (no duplication / no residue)

---

## ðŸŽ¨ NEW DESIGN SYSTEM (LOCKED â€” CRITICAL)

### Core Philosophy

Reports must feel like:
- Glossy white paper
- Black ink precision
- Institutional memo
- Editorial / annual report quality

NOT:
- SaaS dashboard
- UI export
- Dark/navy-heavy design

---

### ðŸŽ¨ COLOR SYSTEM


White: #FFFFFF
Ink: #0C0C0C
Ink-2: #363636
Ink-3: #606060
Ink-4: #9A9A9A
Hairline: #E8E5DF
Warm paper: #FAFAF8

Gold: #C9A84C
Gold dark: #9A7A2C
Cover green: #0F2318


---

### ðŸ”¤ TYPOGRAPHY SYSTEM (LOCKED)


Display: Cormorant Garamond (authority / headings / KPI values)
Body: DM Sans (clarity / paragraphs / tables)
Mono: DM Mono (metadata / dates / IDs)


Usage rules:
- Serif = authority
- Sans = clarity
- Mono = system/data feel

---

## ðŸ§© REPORT TEMPLATE â€” CURRENT STATE

File:
`api/report-template-runtime.html`

---

## âœ… COMPLETED PATCHES

### PATCH 1 â€” Design Tokens + Fonts
- Replaced Inter/Merriweather
- Introduced full ink + gold system

---

### PATCH 2 â€” Layout + Header System
- Removed heavy header strip
- Introduced clean running header
- Removed REPORT_TYPE_LABEL
- Introduced refined spacing + bleed
- Footer system cleaned

---

### PATCH 3 â€” Section Header System
- Introduced:
  - eyebrow (Section XX)
  - title (serif)
  - subtext (sans)
  - gold rule
- Removed legacy `<hr>` usage
- Applied across ALL sections (01â€“20)

---

### PATCH 4 â€” KPI SYSTEM (CRITICAL)

TRANSFORMATION:

Before:
- Card UI
- Background boxes
- Borders
- SaaS dashboard feel

After:
- No boxes
- No shadows
- Hairline separators only
- Serif KPI values
- Ink-based hierarchy
- Grid layout (3-column)

Result:
â†’ **Institutional financial presentation**

---

### PATCH 5 â€” TABLE SYSTEM
- Removed UI table feel
- Introduced bottom hairline borders only
- Improved row spacing
- Refined header hierarchy
- Added subtle striping
- Table presentation now reads more like a financial statement / IC memo

---

### PATCH 6 â€” EXECUTIVE TEXT / NARRATIVE
- Cleaned executive headings
- Removed old Inter / Merriweather residue in core narrative components
- Restyled verdict block, verdict label, verdict classification, verdict supporting text
- Updated major headings, h1/h2/h4, h3, and data-not-available styling
- Executive summary now aligns with locked display/body/mono system

---

## ðŸš§ CURRENT PRIORITY (ACTIVE WORK)

### PATCH 7 â€” COVER PAGE
Goal:
- Remove old navy-era / Inter-based cover styling
- Align cover with locked white / ink / gold / green system
- Make cover feel minimal, premium, and institutional
- Ensure cover matches the new landing page / report preview standard

---

## â­ï¸ NEXT PATCHES (IN ORDER)

### PATCH 7 â€” COVER PAGE (NEXT â€” CRITICAL)
Goal:
- Align with new system
- Keep green/gold but:
  - more minimal
  - more premium
  - less template-like
  - fully consistent with the rest of the report

POST-DESIGN RETURN:
- Return immediately to debt/refinance recognition and rendering reliability

---

## âš ï¸ AFTER DESIGN â€” RETURN TO CORE BUG

Once visual redesign is complete:

ðŸ‘‰ RETURN TO:

### â— Debt / Refinance Bridge Issue

Context:
- Mortgage / loan term sheet parsing
- `mortgagePayload` fallback logic
- Missing or misclassified debt artifacts
- Refinance model not triggering correctly

File:
`api/generate-client-report.js`

Focus:
- This is still the next engineering priority after visual redesign
- Ensure debt artifact recognition is deterministic
- Ensure `mortgagePayload` fallback reliability
- Ensure refinance triggering remains deterministic

---

## ðŸ§  CURRENT STATUS

- Core engine working
- Patch 5 complete
- Patch 6 complete
- Patch 7 remaining
- Debt/refinance bug remains next after design
- Product now visually approaching launch standard

---

## ðŸš€ MISSION

Transform InvestorIQ from:

â€œworking productâ€

â†’ into

ðŸ‘‰ **institutional-grade underwriting platform trusted by lenders**

---

## ðŸ”¥ WORKING STYLE (CRITICAL)

- Anchor-locked patches ONLY
- One file at a time
- No global replace
- No guessing
- No refactors unless approved
- Fail on mismatch
- Deterministic changes only

ðŸŽ¨ PATCH 7 â€” COVER SYSTEM (IN PROGRESS)
Objective

Transform cover from:

light / blue / template feel

â†’ into:

ðŸ‘‰ dark green + gold institutional cover

cinematic

high-contrast

zero SaaS feel

zero template feel

â€œinvestment committee memo coverâ€

âœ… PATCH 7A â€” COVER CSS (COMPLETE)

Changes:

Introduced var(--cover-bg) (deep green)

Full typography shift to display/body/mono system

Removed blue (#1F3A5F / #3F5E84) dependency

Added:

vertical gold thread (left)

subtle top-right corner frame

dark footer bar

Converted spacing to inch-based layout (print precision)

Result:
â†’ Cover now uses locked design system
â†’ Interior styles untouched (critical separation maintained)

ðŸš§ PATCH 7B â€” COVER HTML (IN PROGRESS)

Purpose:

Remove legacy inline styling + blue-era artifacts

Align content hierarchy with new cover system

Key fixes:

Remove inline styled COVER_REPORT_TYPE_LABEL

Remove duplicate verdict label layer

Replace | with Â· separators

Remove unnecessary <hr> remnants

Update brand subtitle:

FROM: â€œInstitutional Grade Property Intelligenceâ€

TO: â€œInstitutional Real Estate Analysisâ€

Result (expected):
â†’ Cover becomes fully system-aligned
â†’ No legacy styling conflicts

â­ï¸ PATCH 7C / 7D â€” INTERIOR ALIGNMENT (PENDING)

Scope:

Minor spacing + polish only

Header strip alignment

Footer typography refinement

âš ï¸ Constraint:

DO NOT alter interior design system

Only micro-adjust spacing/consistency

ðŸ§  DESIGN STATE (CRITICAL LOCK)

InvestorIQ is now a dual-mode report system:

ðŸŸ© COVER

Dark

Emotional

High contrast

Gold + green

â€œInvestment decision momentâ€

â¬œ INTERIOR

White

Analytical

Ink-based

Financial statement feel

â€œUnderwriting memoâ€

ðŸ”’ THIS CONTRAST IS INTENTIONAL

DO NOT:

make interior dark

make cover white

blend the two systems

This contrast = institutional quality

ðŸš¨ NEXT PRIORITY AFTER PATCH 7

Once cover is complete:

ðŸ‘‰ IMMEDIATELY RETURN TO ENGINE FIXES

â— CRITICAL ENGINE ISSUE â€” BLOCKING LAUNCH
Debt / Refinance Recognition Failure

Symptoms:

Mortgage docs not consistently recognized

mortgagePayload sometimes null

Loan term sheet fallback unreliable

Refinance model not triggering correctly

Location:
api/generate-client-report.js

Focus Areas:

Parsed artifact detection:

mortgage_statement_parsed

loan term sheet fallback

Ensure deterministic assignment:

if (!mortgagePayload && loanTermSheetPayload) {
  mortgagePayload = loanTermSheetPayload;
}

- Validate:
  - outstanding_balance normalization
  - loan_amount fallback logic
  - downstream refinance triggers

---

### ðŸŽ¯ REQUIRED OUTCOME

- InvestorIQ is no longer in visual-polish phase
- InvestorIQ is now in final launch-stabilization phase
- single most important next action:
  - validate fallback text handoff
  - rerun the same debt test pack
  - verify typed debt artifacts and refinance rendering end-to-end

---

## ðŸš€ LAUNCH READINESS CHECK

To launch, ALL must be true:

### Visual
- [x] report design is launch-ready / locked
- [x] product positioning is strong
- [x] deterministic philosophy remains core strength

### Product
- [x] one-run entitlement architecture exists
- [x] fail-closed / no-hallucination philosophy remains intact
- [ ] do not email Ken Dunn until engine blockers below are cleared
- [ ] No â€œDATA NOT AVAILABLEâ€ spam

### Engine
- [x] core rent roll + T12 path works
- [x] supporting-doc dispatch improved
- [x] debt classifier logic improved
- [x] malformed PDF fallback improved
- [x] Textract is functioning live
- [x] Richmond underwriting rerun is effectively passed
- [x] Refinance Stability Classification renders on the validated Richmond path
- [ ] worker single-trigger automation remains outstanding
- [ ] 1 additional clean deal still required before launch

CURRENT STATUS:

- Extraction: STABLE + REUSE ENABLED
- Classification: STABLE
- Debt parsing: STABLE
- Refinance model: STABLE (validated on Richmond)
- Report output: INSTITUTIONAL / LOCKED
- Worker execution:
  - functional but requires second trigger (fix in progress)
- Launch phase:
  - FINAL OPERATIONAL HARDENING

---

## ðŸ”¥ CURRENT STATUS

- Patch 5 âœ…
- Patch 6 âœ…
- Patch 7A âœ…
- Patch 7B ðŸš§ (in progress)
- Engine bug â— (next critical step)

---

# ðŸŽ¯ TLDR FOR NEXT CHAT

You are:
- finishing Patch 7 (cover)
- then immediately switching back to **core underwriting reliability**

---

If you want, next Iâ€™ll give you:

ðŸ‘‰ **Fresh Chat Starter Prompt (ELITE, Codex-safe, zero drift)**  
that drops you EXACTLY back into this state with no context loss.

Just say:
**â€œnew chat promptâ€** and Iâ€™ll wire it perfectly.

âœ… INVESTORIQ STATUS UPDATE â€” MARCH 19, 2026 (END OF DAY)
PATCH 7 â€” DESIGN / COVER SYSTEM

STATUS: COMPLETE AND LOCKED

Todayâ€™s work confirmed that the new report design direction is the correct one and is now considered locked:

Hybrid system is now intentional and approved:

Cover = dark forest green + gold + cinematic institutional tone

Interior = white + ink + restrained gold + underwriting memo feel

This contrast is now a core design principle, not an experiment

User is extremely happy with this direction and does not want to drift away from it

PATCH 7A

Verified as correctly applied:

deep green cover background

gold accent system

Cormorant / DM Sans / DM Mono typography

vertical gold thread

top-right corner frame

refined footer bar

inch-based cover spacing

PATCH 7B

Completed successfully:

removed duplicate cover report-type / verdict label from HTML

cleaned cover hierarchy

cover now reads:

brand

property

verdict

metric strip

footer

Result:

stronger institutional hierarchy

less template feel

cleaner â€œinvestment committee memoâ€ presentation

NCO CLEANUP PASS

Completed successfully after integrity scan:

removed unused .cover-verdict-label CSS

removed legacy blue-era utility CSS blocks:

.pill

.pill.bad

.pill.neutral

.label

.highlight

.disclaimer

.footer-note

.chip-row

.chip

.dscr-tag

.risk-positive

.risk-negative

Result:

file is materially cleaner

legacy blue residue removed

active design system preserved

report template now aligns much better with NCO / no residue standard

FINAL DESIGN VERDICT

api/report-template-runtime.html is now effectively design-locked.

Notable conclusion:

visual work should now STOP

no more redesign / restyling unless a real defect appears

current report design is the first version the user feels genuinely proud of

this is now the benchmark visual standard for InvestorIQ reports

ðŸ” INTEGRITY SCAN RESULT

Post-clean scan passed:

cover structure intact

interior institutional styling intact

KPI system intact

table system intact

running header intact

fixed footer intact

no obvious Codex collateral damage

Non-blocking residue may still exist in tiny placeholder/empty elements, but nothing currently justifies additional visual work.

ðŸš¨ NEXT PRIORITY â€” RETURN TO ENGINE / LAUNCH-CRITICAL BUG

âœ… INVESTORIQ STATUS UPDATE â€” MARCH 20, 2026 (ENGINE INTEGRATION PHASE)

ðŸŽ¯ CONTEXT SHIFT (CRITICAL)

InvestorIQ has now fully exited design phase.

Patch 7 (cover + system alignment) = âœ… COMPLETE

Report visuals = ðŸ”’ LOCKED (institutional-grade)

No further visual work unless a real defect appears

ðŸ‘‰ All effort now moves to engine reliability + pipeline execution

ðŸš¨ CURRENT BLOCKER â€” GENERATE REPORT FAILURE
ROOT CAUSE IDENTIFIED

The issue was NOT Stripe, NOT pricing, NOT UI

It was a Supabase RPC contract mismatch

ðŸ”´ PROBLEM

Frontend was calling:

consume_purchase_and_create_job(
  p_user_id,
  p_product_type,
  p_property_name,
  p_batch_id,
  ...
)

But production DB expects:

consume_purchase_and_create_job(
  p_report_type text,
  p_job_payload jsonb,
  p_staged_files jsonb
)

Result:

404 RPC error

â€œfunction not foundâ€ (misleading)

analysis never started

âœ… FIX (IN PROGRESS â€” DASHBOARD PATCH)
File:

src/pages/Dashboard.jsx

Changes:

Removed legacy RPC payload

Aligned to production RPC signature

Rebuilt stagedFiles payload

Fixed storage path contract

REQUIRED: staged/${userId}/...

Updated storage bucket

FROM: analysis-uploads

TO: staged_uploads

Removed invalid pre-job artifact insert

analysis_artifacts insert removed (job_id not yet created)

âœ… NEW FLOW

Upload â†’ staged_uploads bucket
â†’ build stagedFiles array
â†’ call RPC with correct signature
â†’ DB creates job + files
â†’ queue_job_for_processing
â†’ pipeline continues

âš ï¸ CRITICAL CONTRACTS (NOW ENFORCED)
Storage path MUST match:
staged/${auth.uid()}/...
RPC payload MUST be:
{
  p_report_type: 'screening' | 'underwriting',
  p_job_payload: { property_name },
  p_staged_files: [...]
}
stagedFiles object shape:
{
  storage_path,
  original_name,
  content_type,
  size,
  doc_type
}
ðŸš¨ SECONDARY ISSUE (PENDING)
RLS BLOCKING:
analysis_artifacts â†’ row-level security violation

Status:

NOT addressed yet

deferred until RPC + pipeline confirmed working
UPDATE - SUPERSEDED BY VERIFIED SECURITY STATE (MARCH 2026)

Supabase REST warning reviewed:
- no direct `/rest/v1/` root usage found anywhere in the codebase
- no direct REST root exposure risk was found from the April 8 change

Key handling verified:
- anon key is client-side only
- service role key is server-side only

Live DB security state confirmed:
- RLS enabled on `analysis_jobs`
- RLS enabled on `analysis_job_files`
- RLS enabled on `analysis_artifacts`
- RLS enabled on `reports`

Repo gap identified:
- checked-in migrations did not contain the live RLS / policy truth for these four tables

Sync action completed:
- new migration created:
  - `supabase/migrations/20260328_0001_sync_rls_policies_for_analysis_and_reports.sql`
- migration codifies the observed live RLS enabled-state and policies

Policy notes:
- `reports` INSERT / UPDATE user policies were intentionally not added
- report writes remain service-role-only
- overlapping live policies were preserved intentionally for sync accuracy
- policy cleanup can be handled later as a separate task

ðŸ§  CURRENT SYSTEM STATE
âœ… WORKING

Stripe pricing (USD) âœ…

Vercel env alignment âœ…

Checkout flow âœ…

Webhook credit assignment âœ…

Design system âœ…

ðŸš§ IN PROGRESS

Dashboard RPC alignment (this patch)

â— NEXT

Validate full pipeline execution

Then return to:
ðŸ‘‰ api/generate-client-report.js
(debt/refinance deterministic fix)

ðŸŽ¯ NEXT TEST (FIRST THING NEXT SESSION)

Run full E2E:

Upload Rent Roll + T12

Click Generate Screening Report

Verify:

no RPC error

job created

files accepted

status transitions:

needs_documents â†’ queued â†’ extracting â†’ underwritingâ€¦

ðŸš€ TRUE POSITION

InvestorIQ is now:

visually launch-ready âœ…

pricing aligned with product value âœ…

checkout + credits working âœ…

entering final pipeline stabilization phase

Now that Patch 7 is complete, the next task is to return immediately to:

api/generate-client-report.js
CRITICAL ISSUE

Debt / Refinance Recognition Failure

Symptoms:

mortgage docs not consistently recognized

mortgagePayload sometimes null

loan term sheet fallback unreliable

refinance model not always triggering

Focus Areas Tomorrow

verify parsed artifact detection for:

mortgage_statement_parsed

loan term sheet parsed fallback

verify deterministic assignment:

if (!mortgagePayload && loanTermSheetPayload) {
  mortgagePayload = loanTermSheetPayload;
}

validate:

outstanding_balance normalization

loan_amount fallback logic

downstream refinance trigger conditions

confirm no silent failure path where debt exists but refinance block is skipped

Required Outcome

debt ALWAYS recognized when present

fallback ALWAYS works

refinance model ALWAYS deterministic

no silent failures

no partial states

ðŸš€ CURRENT TRUE STATUS
Visual

Patch 5 âœ…

Patch 6 âœ…

Patch 7 âœ… COMPLETE

New hybrid report design âœ… LOCKED

No legacy blue residue in active design system âœ…

Product / Engine

debt recognition bug â— NEXT

refinance triggering bug â— NEXT

launch path now depends more on engine reliability than visuals

ðŸŽ¯ STARTING POINT FOR TOMORROW

When work resumes, do not continue visual design.

Start immediately with:

File: api/generate-client-report.js
Mission: fix deterministic debt recognition and refinance triggering reliability.

---

## SYSTEM EXECUTION FLOW (REAL)

End-to-end path:

1. Frontend upload
- File: `src/pages/Dashboard.jsx`
- User uploads source files from the dashboard
- Files are uploaded into Supabase Storage bucket:
  - `staged_uploads`
- Required path contract:
  - `staged/${userId}/${batchId}/${docType}/...`

2. Job creation RPC
- File: `src/pages/Dashboard.jsx`
- RPC called:
  - `consume_purchase_and_create_job`
- Current production signature:
```js
{
  p_report_type: 'screening' | 'underwriting',
  p_job_payload: { property_name },
  p_staged_files: [...]
}
```
- DB contract source:
  - `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`

3. DB objects created
- `consume_purchase_and_create_job` creates:
  - one row in `analysis_jobs`
  - one or more rows in `analysis_job_files`
- `analysis_job_files` is the source-of-truth manifest for every uploaded file

4. Queue trigger
- File: `src/pages/Dashboard.jsx`
- RPC called:
  - `queue_job_for_processing`
- DB contract source:
  - `supabase/migrations/20260214_0930_queue_job_for_processing.sql`

5. Worker trigger
- Manual or admin trigger:
  - `api/admin/run-eligible-jobs-once.js`
- Main worker:
  - `api/admin-run-worker.js`

6. Worker pipeline stages
- `extracting`
  - file inspection
  - text extraction
  - parser dispatch
  - artifact creation
- `underwriting`
  - deterministic metric build
  - report data assembly
- `scoring`
  - deterministic KPI / decision layer
- `rendering`
  - HTML report assembly
- `pdf_generating`
  - PDF generation
- `publishing`
  - final report artifact / delivery state

7. Final report generation
- File:
  - `api/generate-client-report.js`
- Template:
  - `api/report-template-runtime.html`
- This stage consumes parsed artifacts, builds deterministic report payloads, renders HTML, and generates the final PDF

8. Internal endpoints involved
- `api/admin/run-eligible-jobs-once.js`
- `api/admin-run-worker.js`
- `api/parse/extract-job-text.js`
- `api/parse/parse-doc.js`
- `api/generate-client-report.js`

---

## WORKER ARCHITECTURE

Primary file:
- `api/admin-run-worker.js`

How jobs are selected:
- `api/admin/run-eligible-jobs-once.js` can:
  - force a specific job path
  - or claim the next queued job
- `api/admin-run-worker.js` scans active jobs by status and advances them through the pipeline

How `status = extracting` is used:
- `extracting` is the parser / artifact-production stage
- When a job is in `extracting`, the worker reads `analysis_job_files` and decides which parser or extraction path to run next

Parser dispatch logic:

Rent roll
- handled through `api/parse/parse-doc.js`
- structured spreadsheet logic
- output artifact:
  - `rent_roll_parsed`

T12
- handled through `api/parse/parse-doc.js`
- structured spreadsheet logic
- output artifact:
  - `t12_parsed`

Supporting documents
- handled through:
  - `api/parse/extract-job-text.js`
  - then `api/parse/parse-doc.js`
- current supported dispatch normalization includes:
  - `supporting`
  - `supporting_documents`
  - `supporting_documents_ui`

NEW FIX:
- supporting docs were originally not dispatched correctly
- worker now includes:
  - `supporting`
  - `supporting_documents`
  - `supporting_documents_ui`
- worker normalizes these to:
  - `supporting_documents`
- worker now calls text extraction before parser inference

Current worker pipeline note:
- previous extraction-handoff early-return issue is already patched
- however, the latest validation path still required two manual worker runs
- current suspected gap:
  - job lists are fetched too early in the pass
  - a job promoted from `queued` to `extracting` is not re-seen by the `extracting` loop until the next invocation
- active pre-launch task:
  - remove the remaining second-kick requirement in `api/admin-run-worker.js`
- tomorrow's first engineering task:
  - inspect `queuedJobs` vs `extractingJobs` fetch / control flow
  - patch with a minimal anchor-locked diff only

---

## TEXT EXTRACTION LAYER (CRITICAL)

Primary file:
- `api/parse/extract-job-text.js`

Purpose:
- creates artifact:
  - `document_text_extracted`
- uses:
  - `pdf-parse`
- also performs table extraction support work where applicable

Why it exists:
- `parse-doc` does not have enough context to infer supporting document type from a PDF unless extracted text already exists
- this layer must run before supporting PDF classification

Required for:
- loan term sheet inference
- supporting document classification
- mortgage / debt fallback detection

CRITICAL RULE:
- `parse-doc` will fail or remain blocked for supporting PDF inference if `document_text_extracted` does not exist

Artifact created:
- type:
  - `document_text_extracted`
- file:
  - `api/parse/extract-job-text.js`

Current extraction status:
- Textract is now fully active and confirmed working
  - TABLE extraction working
  - LINE text extraction working
- `pdf-parse` failure case identified:
  - `Command token too long: 128`
- previous failure behavior:
  - `parse_status = failed`
  - `document_text_extracted` not written
  - downstream classification failed
- fix implemented:
  - Textract LINE text is now captured and persisted
  - Textract text is used as fallback when `pdf-parse` fails
- result:
  - no more silent text loss
  - `document_text_extracted` is present whenever extractable content exists

Extraction Reuse Optimization (NEW)

- system now checks for existing `document_text_extracted` artifacts before running extraction
- reuse conditions:
  - same `file_id`
  - same `bucket`
  - same `object_path`
  - same `original_filename`
  - non-empty extracted text
- if exactly one valid artifact exists:
  - skip extraction, including Textract
  - mark file as `parse_status = extracted`
  - continue pipeline
- if multiple matches:
  - fail closed as ambiguous reuse
- if none:
  - proceed with normal extraction

Impact:
- eliminates duplicate Textract cost during testing and retries
- production-safe optimization
- no change to downstream parser or report contracts

---

## PARSER SYSTEM

Primary file:
- `api/parse/parse-doc.js`

Key model:
- `declaredDocType`
  - what the worker dispatches into the parser
- `effectiveDocType`
  - what the parser actually decides the file is after classification / inference

Supporting document flow:
1. Worker dispatches supporting PDFs as:
   - `supporting_documents`
2. `parse-doc` looks for:
   - `document_text_extracted`
3. `parse-doc` runs:
   - `inferDocTypeFromText()`
4. `effectiveDocType` becomes one of:
   - `loan_term_sheet`
   - `mortgage_statement`
   - `appraisal`
   - `property_tax`
   - or `supporting_documents_unclassified`

Parser outputs include:
- `rent_roll_parsed`
- `t12_parsed`
- `loan_term_sheet_parsed`
- `mortgage_statement_parsed`
- `appraisal_parsed`
- `property_tax_parsed`

Important rule:
- parser classification is deterministic
- no LLM is involved in artifact creation

---

## ARTIFACT CONTRACT (VERY IMPORTANT)

Core artifact types:

| Artifact Type | Required vs Optional | Produced By | Used For |
|---|---|---|---|
| `rent_roll_parsed` | Required | `api/parse/parse-doc.js` | unit mix, rents, occupancy, screening + underwriting |
| `t12_parsed` | Required | `api/parse/parse-doc.js` | income, expenses, NOI, screening + underwriting |
| `document_text_extracted` | Required for supporting PDF inference | `api/parse/extract-job-text.js` | upstream text source for supporting-doc classification |
| `loan_term_sheet_parsed` | Optional but critical when debt docs are term-sheet-only | `api/parse/parse-doc.js` | debt fallback, refinance / underwriting logic |
| `mortgage_statement_parsed` | Optional but preferred when available | `api/parse/parse-doc.js` | primary debt input for underwriting / refinance |

Required vs optional:
- Required to produce a real report:
  - `rent_roll_parsed`
  - `t12_parsed`
- Required for supporting PDF debt inference:
  - `document_text_extracted`
- Optional but important for debt-aware underwriting:
  - `loan_term_sheet_parsed`
  - `mortgage_statement_parsed`

Fallback behavior:
- `loan_term_sheet_parsed` can be used as fallback debt input when `mortgage_statement_parsed` is absent or unusable
- this fallback is consumed in:
  - `api/generate-client-report.js`

---

## ENGINE FIX - SUPPORTING DOCUMENT PARSING (MARCH 2026)

## ðŸš¨ ENGINE FAILURE â€” SUPPORTING DOC PARSE 400 (ROOT CAUSE â€” MARCH 2026)

### â— WHAT HAPPENED

During a full underwriting test:

- Rent Roll parsed âœ…
- T12 parsed âœ…
- ALL supporting PDFs failed âŒ

Observed symptoms:

- DSCR â†’ NOT ASSESSED
- Debt narrative missing
- Refinance model (MOAT) did not render
- Report still completed successfully (silent degradation)

---

### ðŸ” ARTIFACT EVIDENCE

From `analysis_artifacts`:

- `t12_parsed` âœ…
- `rent_roll_parsed` âœ…
- `loan_term_sheet_parsed` âŒ (missing)
- `mortgage_statement_parsed` âŒ (missing)
- `property_tax_parsed` âŒ (missing)

Repeated worker events:

- `supporting_doc_parse_failed`
- status: 400

---

### ðŸŽ¯ ROOT CAUSE (CONFIRMED)

Mismatch between:

- `analysis_job_files.doc_type`
  â†’ "supporting"

AND

- `parse-doc.js` expected input
  â†’ "supporting_documents"

Because of this:

- supporting PDFs NEVER entered the inference block:
  - `inferDocTypeFromText()`
- parser fell through to:
  - `return 400 Unsupported doc_type`
- no parsed artifacts were created

Second upstream schema failure:

- `extract-job-text.js` queried:
  - `analysis_job_files.created_at`
- live schema uses:
  - `analysis_job_files.uploaded_at`

Because of this:

- `extract-job-text` returned 500 before supporting PDF text extraction completed
- `document_text_extracted` was not created for supporting PDFs

---

### ðŸ”¥ WHY THIS MATTERS

This is a **silent failure mode**:

- Report renders successfully
- BUT critical underwriting data is missing
- Violates fail-closed principle

Impact:

- DSCR not computed
- Debt not recognized
- Refinance model not triggered
- Deal scoring becomes incomplete

---

### ðŸ›  REQUIRED FIX

File:
`api/parse/parse-doc.js`

Fix:

Expand supporting-doc condition to include ALL valid upstream types:

FROM:

```js
if (declaredDocType === 'supporting_documents' && !isTabularInput) {
```

TO:

```js
if (
  ['supporting', 'supporting_documents', 'supporting_documents_ui'].includes(declaredDocType) &&
  !isTabularInput
) {
```

### ðŸŽ¯ EXPECTED RESULT AFTER FIX

Supporting PDFs enter inference pipeline

document_text_extracted â†’ used correctly

loan_term_sheet_parsed created

mortgagePayload populated

DSCR computed

Refinance model (MOAT) renders

No silent degradation

### Ã¢Å“â€¦ VALIDATED RERUN RESULT

Successful rerun confirmed:

- supporting PDFs now produce `document_text_extracted`
- `CLEAN_Debt_Term_Sheet_124_Richmond.pdf` parsed successfully
- successful parsed artifact type on rerun:
  - `mortgage_statement_parsed`
- `analysis_job_files` for the debt PDF now shows:
  - `parse_status = parsed`
  - `parse_error = null`
- no new `supporting_doc_parse_failed` events occurred on the successful rerun
- final report no longer says debt terms were missing or DSCR was not assessed
- final report now contains DSCR and debt/refinance content

### âš ï¸ SECONDARY WATCH ITEMS

`extract-job-text.js`

Some PDFs logged:

`document_text_extract_failed`

May indicate:

- `pdf-parse` edge cases
- or file handling inconsistencies

XLSX supporting docs

Currently skipped in extraction layer

may remain at pending

### ðŸš¨ SYSTEM PRINCIPLE REINFORCED

InvestorIQ must NEVER:

- silently drop supporting documents
- continue underwriting with missing critical artifacts
- produce â€œcomplete-lookingâ€ reports with incomplete intelligence

Required behavior:

EITHER:

- fully process supporting docs

OR:

- fail closed with explicit error

### ðŸ§  CURRENT ENGINE STATE

Core parsing engine: âœ… stable

Supporting doc ingestion: âŒ broken (this issue)

Debt recognition: âŒ blocked upstream

Refinance modeling: âŒ blocked upstream

### ðŸŽ¯ NEXT STEP

Apply fix in:

`api/parse/parse-doc.js`

THEN:

- rerun identical underwriting test

confirm:

- `loan_term_sheet_parsed` exists
- DSCR renders
- MOAT renders

Validated final stabilization result:
- Richmond underwriting rerun passed cleanly
- Refinance Stability Classification now renders correctly
- DSCR now renders consistently as `1.09x`
- the LTV-limited proceeds bug is fixed
- the `Data Integrity Confirmed / All Required Inputs Verified` overstatement was corrected
- current wording now limits confirmation to T12 + Rent Roll core coverage
- the core report-level launch blocker is resolved

Refi / debt engine state:

- deterministic defaults for the refinance model are now in place and validated:
  - `refi_ltv_max`
  - `refi_dscr_min`
  - `stress_noi_shocks`
  - `stress_cap_rate_bps`
  - `stress_rate_bps`
- the LTV normalization fix is present in `buildRefiStabilityModel`
- refinance now renders when debt is present in the validated Richmond path
- debt recognition -> DSCR -> refinance is now considered stable on the validated Richmond path

Report / PDF polish completed today:

- global tables now use fixed layout and proper horizontal cell padding
- table alignment improved materially
- Unit Mix now uses balanced columns
- Operating Statement income / expense tables now use balanced columns
- Section 03 matrix heading now reads:
  - `Current Debt Coverage Sensitivity`
- current-debt coverage sensitivity logic no longer flat-lines at `1.25x`
- duplicate checkmark removed from the Data Coverage section
- chart-table polish added for:
  - NOI Waterfall value nowrap
  - Expense Composition label / title anti-word-break behavior

Supporting-doc and extraction chain retained:

- `api/parse/parse-doc.js` accepts:
  - `supporting`
  - `supporting_documents`
  - `supporting_documents_ui`
- `api/parse/extract-job-text.js` uses `uploaded_at`
- `extract-job-text.js` captures Textract LINE text and uses fallback text when `pdf-parse` fails
- supporting-doc dispatch gate in `api/admin-run-worker.js` includes:
  - `pending`
  - `extracted`
- debt classifier collision hardening remains in place
- non-debt supporting recognizers remain intentionally minimal and do not change downstream report contracts

## CURRENT PRIMARY BLOCKER

The current blocker is worker loop continuation.

Root cause confirmed:

- `queuedJobs` and `extractingJobs` are fetched before status mutations
- jobs promoted from `queued` -> `extracting` are not visible to the extracting loop in the same pass

Result:

- still requires a second manual worker run

Fix in progress:

- re-fetch `extractingJobs` after the queued loop completes

This is now the final operational blocker before launch.

## TODAY'S VALIDATED ENGINE STATE

- Richmond validation is effectively passed
- report output is now institutionally credible
- deterministic refinance rendering is validated on the Richmond path
- fail-closed debt handling remains intact
- launch is now in final polish / operational hardening rather than core report debugging

## PRODUCT RULE (LOCKED)

InvestorIQ must NOT rely on filenames for production document classification.

- filename fallback may be discussed only as an emergency debugging idea
- it is NOT approved as launch architecture
- production classification must remain content-first and deterministic
- no fabricated values
- no hallucination
- no silent assumptions
- no fake debt recognition from bad evidence

## FINAL PRE-LAUNCH BLOCKERS

A. Worker continuation fix (IN PROGRESS)

- eliminate second worker trigger requirement
- ensure single-pass pipeline execution

B. Validate 1 additional clean deal

- confirm no regression outside Richmond path
- confirm reuse + worker loop behave correctly

C. Website micro-polish

- minor UI / UX cleanup
- non-blocking

D. Launch decision

- only after A + B are confirmed

Launch trigger condition:

We are ready to email Ken Dunn and launch when:

- Richmond validation remains clean
- at least 1 additional deal runs clean
- worker single-trigger automation is working
- website micro-polish is complete

Final reality check:

- we are no longer debugging unknowns
- report-level engine issues are no longer the blocker
- the remaining blocker is:
  - worker single-trigger continuation
- everything else is now:
  - deterministic
  - fail-closed
  - observable

## Cost Control Strategy (Testing Phase)

- Textract cost is minimized via extraction reuse
- repeated tests should not trigger re-extraction
- no global Textract disable is required
- production behavior is preserved

START HERE TOMORROW:

- file:
  - `api/admin-run-worker.js`
- mission:
  - remove the remaining need for a second manual worker kick
- inspect:
  - `queuedJobs` vs `extractingJobs` fetch / control flow
- patch:
  - minimal anchor-locked diff only
- after worker fix:
  - run 1 additional clean deal validation
  - do website polish pass
  - make final go / no-go decision for the Ken Dunn email

## DOCUMENT MAINTENANCE NOTES

- `MASTER_CONTEXT.md` is approaching high length / density
- going forward:
  - avoid duplication
  - consolidate repeated logic descriptions
  - prefer updating existing sections over appending new ones
- goal:
  - maintain clarity and fast parseability for future sessions
  - prevent context bloat


## FAILURE MODES (FAIL-CLOSED LOGIC)

InvestorIQ must never silently pass bad or incomplete state.

Missing rent roll
- block deterministic underwriting
- do not fabricate unit data
- fail closed or return a deterministic degraded output only where explicitly designed

Missing T12
- block deterministic underwriting
- do not fabricate NOI / expense data
- fail closed

Missing debt
- screening may still run if debt is not required
- underwriting must degrade explicitly and deterministically
- no refinance logic may be fabricated

Parse failure
- job must block or fail with explicit artifact / parse status evidence
- never silently continue as if parsing succeeded

Non-negotiable behavior:
- no silent pass
- no hidden assumptions
- no fabricated numbers
- either:
  - block
  - or clearly degrade deterministically

---

## DEBUG PLAYBOOK (GOLD)

How to debug a failed job:

1. Check `analysis_job_files`
- verify every expected file row exists
- verify `doc_type`
- verify storage path and object path

2. Check `parse_status`
- `pending`
- `extracted`
- `parsed`
- `failed`
- `parsed_with_warnings`

3. Check `analysis_artifacts`
- list artifact types actually produced for the job
- confirm whether required artifacts exist

4. Check missing artifact types
- missing `rent_roll_parsed`
- missing `t12_parsed`
- missing `document_text_extracted`
- missing `loan_term_sheet_parsed`
- missing `mortgage_statement_parsed`

5. Check worker execution
- was the job queued
- did worker move it into `extracting`
- did text extraction run
- did parser dispatch run
- did `api/generate-client-report.js` run

Fast debug order:
1. `analysis_job_files`
2. `parse_status`
3. `analysis_artifacts`
4. missing artifact types
5. worker execution

---

## AI / LLM ARCHITECTURE (LOCKED)

## ðŸ§  LLM EXECUTION LAYER (CRITICAL â€” LOCKED)

### ðŸ“ WHERE LLM IS CALLED

The LLM is invoked ONLY inside:

File:
`api/generate-client-report.js`

Stage:
AFTER underwriting + scoring
BEFORE HTML assembly

Pipeline position:

deterministic metrics
â†’ deterministic scoring
â†’ structured report JSON built
â†’ ðŸ§  LLM narrative generation (THIS STEP)
â†’ inject narratives into template
â†’ render HTML
â†’ generate PDF

---

### ðŸ§  PROMPT SYSTEM (LOCKED)

The system uses:

ðŸ‘‰ "Golden Elite Master Prompt"

Rules:
- Prompt is injected at runtime
- Prompt receives ONLY structured JSON
- Prompt NEVER receives raw documents
- Prompt NEVER computes numbers

---

### ðŸ“¦ LLM INPUT CONTRACT (STRICT)

LLM must receive:

{
  executive_data,
  risk_flags,
  refinance_classification,
  kpi_metrics,
  missing_data_flags,
  scenario_outputs,
  property_metadata
}

NO:
- raw text
- PDFs
- partial data
- undefined fields

---

### ðŸŽ¯ LLM OUTPUT CONTRACT

LLM returns ONLY:

{
  execSummary,
  riskAssessment,
  renovationNarrative,
  neighborhoodAnalysis,
  debtStructureNarrative,
  dcfInterpretation,
  dealScoreSummary,
  finalRecommendation
}

Rules:
- Must not fabricate
- Must not infer missing numbers
- Must explicitly state missing data
- Must follow institutional tone

---

### âš™ï¸ MODEL STRATEGY (HARD LOCK)

Production model:

ðŸ‘‰ OpenAI API (GPT-5.x)

Used for:
- ALL narrative generation

Reason:
- deterministic control
- cost efficiency
- already integrated
- sufficient quality with Golden Prompt

---

### ðŸ§ª NON-PRODUCTION MODEL

Anthropic Claude:

- NOT used in production pipeline
- ONLY used for:
  - internal benchmarking
  - optional future premium tier

---

### ðŸš¨ FAIL CONDITIONS

If any of the following occur:

- missing required input fields
- undefined metrics
- incomplete underwriting outputs

THEN:

âŒ DO NOT CALL LLM

Instead:
- fail closed
OR
- inject deterministic "DATA NOT AVAILABLE" logic

---

### ðŸ”’ SYSTEM IDENTITY

InvestorIQ is:

NOT an AI underwriting system

It is:

ðŸ‘‰ a deterministic underwriting engine  
ðŸ‘‰ with AI used ONLY for narrative presentation

InvestorIQ is a hybrid deterministic + LLM system, with strict separation of responsibilities.

### NON-NEGOTIABLE RULE

LLMs must never be used for:
- underwriting math
- financial calculations
- NOI
- DSCR
- IRR
- debt recognition
- refinance modeling
- deal scoring
- artifact creation
- pass/fail gating

All of the above must be:
- deterministic
- code-driven
- artifact-driven

### WHERE LLMs ARE USED

LLMs are only used for:
- narrative generation
- executive summary writing
- risk explanation
- renovation narrative
- debt structure narrative based on parsed data only
- DCF interpretation, not calculation
- final recommendation language for tone only, never decision logic

### INPUT CONTRACT FOR LLM

LLM input must be:
- structured JSON only
- fully computed metrics
- flags and classifications
- no raw documents
- no missing fields disguised as assumptions

LLM must:
- never infer missing data
- never fabricate numbers
- explicitly state when data is missing

### MODEL STRATEGY

Production:
- OpenAI API
- primary model:
  - GPT-5.1 or GPT-5.4 depending on cost / performance
- used for:
  - narrative generation only

### BENCHMARK STRATEGY

Anthropic / Claude:
- used for A/B testing narrative quality
- not used in the core production pipeline initially

Evaluation criteria:
- factual discipline
- tone consistency
- verbosity control
- handling of missing data
- adherence to structure

### COST PRINCIPLE

- do not use premium models unless:
  - output is measurably better
  - and users would notice the difference

### DESIGN PRINCIPLE

InvestorIQ is not an "AI underwriting tool".

It is:
- a deterministic underwriting engine
- with AI used only as a presentation layer

---

## QUALITY INVARIANCE AT SCALE (NON-NEGOTIABLE)

InvestorIQ must produce materially consistent report quality from the first production report through the 1,000th+ report.

This means:

- same deterministic engine
- same artifact contracts
- same underwriting logic
- same refinance logic
- same fail-closed behavior
- same report structure
- same visual template
- same narrative prompt
- same model policy
- same output standards

### RULES

1. No silent prompt changes
- The Golden Elite Master Prompt is versioned and locked.
- Any prompt change must be deliberate, documented, and tested.

2. No silent model changes
- Production model changes are controlled.
- Changing model/provider requires benchmark comparison against the current production baseline.

3. No runtime improvisation
- LLM receives only structured JSON.
- LLM may not invent structure, numbers, or missing facts.

4. No template drift
- Report template changes must preserve institutional formatting and section hierarchy.
- Visual or structural edits must be explicitly approved.

5. No logic drift
- Underwriting math, scoring, debt recognition, and refinance classification remain deterministic and code-driven.

6. Identical standards at scale
- A report generated today and one generated months later must meet the same quality bar if given equivalent inputs.

### REQUIRED CONTROL MECHANISMS

- versioned prompt
- versioned model policy
- locked report template
- deterministic input contract
- deterministic output schema
- benchmark regression testing before major changes

### DESIGN PRINCIPLE

InvestorIQ is not allowed to become worse as it scales.

Scale must increase volume only, not variance in quality.

---

## ARTIFACT CONTRACTS (STRICT)

All downstream systems depend on structured artifacts.

Each artifact type must:
- have a fixed schema
- never change shape without versioning
- never include null/undefined critical fields
- never include fabricated values

Core artifacts:
- rent_roll_parsed
- t12_parsed
- loan_term_sheet_parsed
- document_text_extracted

LLM input MUST come only from these artifacts.

No raw text. No guessing.

---

## LLM ROLE (STRICTLY LIMITED)

The LLM is a formatting and synthesis layer only.

It is NOT allowed to:
- create financial values
- infer missing numbers
- fill gaps with assumptions
- override deterministic outputs

It is ONLY allowed to:
- translate structured data into narrative
- organize sections
- explain deterministic outputs

If required data is missing â†’ section is omitted or flagged.

---

## FAILURE HANDLING (TRUST FIRST)

If the system cannot produce a complete, accurate report:

- DO NOT degrade quality
- DO NOT fabricate
- DO NOT partially guess

Instead:
- fail the run
- restore user credit
- provide clear reason:
  - missing documents
  - parse failure
  - system error

InvestorIQ prioritizes trust over output completion.

---

## VERSION CONTROL (CRITICAL)

All core system components must be versioned:

### 1. Prompt Versioning
- Golden Prompt must have a version tag (e.g., v1.0, v1.1)
- Prompt changes must:
  - be documented
  - be tested against baseline outputs
  - never overwrite previous versions silently

### 2. Model Versioning
- Production model must be explicitly defined:
  - e.g., "gpt-5.1"
- Any model upgrade must:
  - be benchmarked against current production
  - pass quality invariance checks
  - be manually approved

### 3. Template Versioning
- Report template must be treated as a locked artifact
- Changes must:
  - preserve section structure
  - preserve institutional formatting
  - not introduce UI artifacts

### 4. Regression Requirement
Before any change:
- generate baseline report
- generate new report
- compare:
  - structure
  - tone
  - completeness
  - correctness

If degradation exists â†’ change is rejected

# ðŸš¨ EXECUTION CONTRACT (MANDATORY)

You are working on InvestorIQ.

This file is the SINGLE SOURCE OF TRUTH.

You MUST follow ALL rules in this document EXACTLY.

## NON-NEGOTIABLE RULES

1. NO REFACTORING
- Do not restructure code
- Do not rename variables
- Do not â€œclean upâ€ anything

2. ANCHOR-LOCKED PATCHES ONLY
- Every change must be:
  - "REPLACE ONLY THIS EXACT BLOCK"
  - with "THIS EXACT BLOCK"
- If the anchor is not found:
  - output EXACTLY: ANCHOR_MISMATCH
  - STOP immediately

3. MINIMAL DIFFS ONLY
- Change ONLY what is required
- No extra edits
- No formatting changes

4. NO GUESSING
- If unsure â†’ STOP
- Ask for clarification

5. FAIL-CLOSED
- Never introduce fallback logic unless explicitly defined
- Never silently skip logic

6. NO DUPLICATION
- Do not create duplicate logic blocks
- Do not leave old code behind

7. VERIFY BEFORE CONTINUING
After EVERY patch:
- confirm patch applied cleanly
- show exact old block
- show exact new block
- run syntax check

8. THIS DOCUMENT IS LAW
- If code conflicts with this document â†’ FOLLOW THIS DOCUMENT

9. NO PARTIAL PATCHES
- If a patch cannot be completed fully and cleanly â†’ STOP
- Do not return partial implementations

Failure to follow ANY rule = INVALID OUTPUT

***If you violate ANY rule in the execution contract, STOP and explain why.***
