# INVESTORIQ — MASTER CONTEXT (UPDATED)

## 🎯 PRODUCT OVERVIEW

InvestorIQ is a **document-driven real estate underwriting platform**.

Core positioning:
- “The only underwriting tool that models refinance collapse risk”
- Institutional-grade
- Deterministic only (no AI hallucination)
- Fail-closed system
- One purchase = one report (no reruns unless system fault)

---

## 🧱 PRODUCT TIERS

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

## ⚙️ CORE ENGINE

Pipeline:

uploads → analysis_job_files → parsing → analysis_artifacts → underwriting → scoring → rendering → PDF

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

## 🔐 PRODUCT RULES (NON-NEGOTIABLE)

- Deterministic math only
- Fail-closed gating
- No fabricated narratives
- No AI tone
- No BUY/SELL recommendations
- ASCII-only output
- NCO repo (no duplication / no residue)

---

## 🎨 NEW DESIGN SYSTEM (LOCKED — CRITICAL)

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

### 🎨 COLOR SYSTEM


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

### 🔤 TYPOGRAPHY SYSTEM (LOCKED)


Display: Cormorant Garamond (authority / headings / KPI values)
Body: DM Sans (clarity / paragraphs / tables)
Mono: DM Mono (metadata / dates / IDs)


Usage rules:
- Serif = authority
- Sans = clarity
- Mono = system/data feel

---

## 🧩 REPORT TEMPLATE — CURRENT STATE

File:
`api/report-template-runtime.html`

---

## ✅ COMPLETED PATCHES

### PATCH 1 — Design Tokens + Fonts
- Replaced Inter/Merriweather
- Introduced full ink + gold system

---

### PATCH 2 — Layout + Header System
- Removed heavy header strip
- Introduced clean running header
- Removed REPORT_TYPE_LABEL
- Introduced refined spacing + bleed
- Footer system cleaned

---

### PATCH 3 — Section Header System
- Introduced:
  - eyebrow (Section XX)
  - title (serif)
  - subtext (sans)
  - gold rule
- Removed legacy `<hr>` usage
- Applied across ALL sections (01–20)

---

### PATCH 4 — KPI SYSTEM (CRITICAL)

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
→ **Institutional financial presentation**

---

### PATCH 5 — TABLE SYSTEM
- Removed UI table feel
- Introduced bottom hairline borders only
- Improved row spacing
- Refined header hierarchy
- Added subtle striping
- Table presentation now reads more like a financial statement / IC memo

---

### PATCH 6 — EXECUTIVE TEXT / NARRATIVE
- Cleaned executive headings
- Removed old Inter / Merriweather residue in core narrative components
- Restyled verdict block, verdict label, verdict classification, verdict supporting text
- Updated major headings, h1/h2/h4, h3, and data-not-available styling
- Executive summary now aligns with locked display/body/mono system

---

## 🚧 CURRENT PRIORITY (ACTIVE WORK)

### PATCH 7 — COVER PAGE
Goal:
- Remove old navy-era / Inter-based cover styling
- Align cover with locked white / ink / gold / green system
- Make cover feel minimal, premium, and institutional
- Ensure cover matches the new landing page / report preview standard

---

## ⏭️ NEXT PATCHES (IN ORDER)

### PATCH 7 — COVER PAGE (NEXT — CRITICAL)
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

## ⚠️ AFTER DESIGN — RETURN TO CORE BUG

Once visual redesign is complete:

👉 RETURN TO:

### ❗ Debt / Refinance Bridge Issue

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

## 🧠 CURRENT STATUS

- Core engine working
- Patch 5 complete
- Patch 6 complete
- Patch 7 remaining
- Debt/refinance bug remains next after design
- Product now visually approaching launch standard

---

## 🚀 MISSION

Transform InvestorIQ from:

“working product”

→ into

👉 **institutional-grade underwriting platform trusted by lenders**

---

## 🔥 WORKING STYLE (CRITICAL)

- Anchor-locked patches ONLY
- One file at a time
- No global replace
- No guessing
- No refactors unless approved
- Fail on mismatch
- Deterministic changes only

🎨 PATCH 7 — COVER SYSTEM (IN PROGRESS)
Objective

Transform cover from:

light / blue / template feel

→ into:

👉 dark green + gold institutional cover

cinematic

high-contrast

zero SaaS feel

zero template feel

“investment committee memo cover”

✅ PATCH 7A — COVER CSS (COMPLETE)

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
→ Cover now uses locked design system
→ Interior styles untouched (critical separation maintained)

🚧 PATCH 7B — COVER HTML (IN PROGRESS)

Purpose:

Remove legacy inline styling + blue-era artifacts

Align content hierarchy with new cover system

Key fixes:

Remove inline styled COVER_REPORT_TYPE_LABEL

Remove duplicate verdict label layer

Replace | with · separators

Remove unnecessary <hr> remnants

Update brand subtitle:

FROM: “Institutional Grade Property Intelligence”

TO: “Institutional Real Estate Analysis”

Result (expected):
→ Cover becomes fully system-aligned
→ No legacy styling conflicts

⏭️ PATCH 7C / 7D — INTERIOR ALIGNMENT (PENDING)

Scope:

Minor spacing + polish only

Header strip alignment

Footer typography refinement

⚠️ Constraint:

DO NOT alter interior design system

Only micro-adjust spacing/consistency

🧠 DESIGN STATE (CRITICAL LOCK)

InvestorIQ is now a dual-mode report system:

🟩 COVER

Dark

Emotional

High contrast

Gold + green

“Investment decision moment”

⬜ INTERIOR

White

Analytical

Ink-based

Financial statement feel

“Underwriting memo”

🔒 THIS CONTRAST IS INTENTIONAL

DO NOT:

make interior dark

make cover white

blend the two systems

This contrast = institutional quality

🚨 NEXT PRIORITY AFTER PATCH 7

Once cover is complete:

👉 IMMEDIATELY RETURN TO ENGINE FIXES

❗ CRITICAL ENGINE ISSUE — BLOCKING LAUNCH
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

### 🎯 REQUIRED OUTCOME

- Debt ALWAYS recognized when present
- Fallback ALWAYS works
- Refinance model ALWAYS deterministic
- No silent failures
- No partial states

---

## 🚀 LAUNCH READINESS CHECK

To launch, ALL must be true:

### Visual
- [ ] Cover = institutional green/gold
- [ ] Interior = white/ink/gold
- [ ] No legacy blue styles
- [ ] No UI/card artifacts

### Product
- [ ] One-run entitlement enforced
- [ ] Error messaging correct
- [ ] No stuck jobs
- [ ] No “DATA NOT AVAILABLE” spam

### Engine
- [ ] Debt recognition fixed
- [ ] Refinance modeling deterministic
- [ ] No missing artifacts
- [ ] No silent failures

---

## 🔥 CURRENT STATUS

- Patch 5 ✅
- Patch 6 ✅
- Patch 7A ✅
- Patch 7B 🚧 (in progress)
- Engine bug ❗ (next critical step)

---

# 🎯 TLDR FOR NEXT CHAT

You are:
- finishing Patch 7 (cover)
- then immediately switching back to **core underwriting reliability**

---

If you want, next I’ll give you:

👉 **Fresh Chat Starter Prompt (ELITE, Codex-safe, zero drift)**  
that drops you EXACTLY back into this state with no context loss.

Just say:
**“new chat prompt”** and I’ll wire it perfectly.

✅ INVESTORIQ STATUS UPDATE — MARCH 19, 2026 (END OF DAY)
PATCH 7 — DESIGN / COVER SYSTEM

STATUS: COMPLETE AND LOCKED

Today’s work confirmed that the new report design direction is the correct one and is now considered locked:

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

cleaner “investment committee memo” presentation

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

🔍 INTEGRITY SCAN RESULT

Post-clean scan passed:

cover structure intact

interior institutional styling intact

KPI system intact

table system intact

running header intact

fixed footer intact

no obvious Codex collateral damage

Non-blocking residue may still exist in tiny placeholder/empty elements, but nothing currently justifies additional visual work.

🚨 NEXT PRIORITY — RETURN TO ENGINE / LAUNCH-CRITICAL BUG

✅ INVESTORIQ STATUS UPDATE — MARCH 20, 2026 (ENGINE INTEGRATION PHASE)

🎯 CONTEXT SHIFT (CRITICAL)

InvestorIQ has now fully exited design phase.

Patch 7 (cover + system alignment) = ✅ COMPLETE

Report visuals = 🔒 LOCKED (institutional-grade)

No further visual work unless a real defect appears

👉 All effort now moves to engine reliability + pipeline execution

🚨 CURRENT BLOCKER — GENERATE REPORT FAILURE
ROOT CAUSE IDENTIFIED

The issue was NOT Stripe, NOT pricing, NOT UI

It was a Supabase RPC contract mismatch

🔴 PROBLEM

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

“function not found” (misleading)

analysis never started

✅ FIX (IN PROGRESS — DASHBOARD PATCH)
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

✅ NEW FLOW

Upload → staged_uploads bucket
→ build stagedFiles array
→ call RPC with correct signature
→ DB creates job + files
→ queue_job_for_processing
→ pipeline continues

⚠️ CRITICAL CONTRACTS (NOW ENFORCED)
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
🚨 SECONDARY ISSUE (PENDING)
RLS BLOCKING:
analysis_artifacts → row-level security violation

Status:

NOT addressed yet

deferred until RPC + pipeline confirmed working

🧠 CURRENT SYSTEM STATE
✅ WORKING

Stripe pricing (USD) ✅

Vercel env alignment ✅

Checkout flow ✅

Webhook credit assignment ✅

Design system ✅

🚧 IN PROGRESS

Dashboard RPC alignment (this patch)

❗ NEXT

Validate full pipeline execution

Then return to:
👉 api/generate-client-report.js
(debt/refinance deterministic fix)

🎯 NEXT TEST (FIRST THING NEXT SESSION)

Run full E2E:

Upload Rent Roll + T12

Click Generate Screening Report

Verify:

no RPC error

job created

files accepted

status transitions:

needs_documents → queued → extracting → underwriting…

🚀 TRUE POSITION

InvestorIQ is now:

visually launch-ready ✅

pricing aligned with product value ✅

checkout + credits working ✅

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

🚀 CURRENT TRUE STATUS
Visual

Patch 5 ✅

Patch 6 ✅

Patch 7 ✅ COMPLETE

New hybrid report design ✅ LOCKED

No legacy blue residue in active design system ✅

Product / Engine

debt recognition bug ❗ NEXT

refinance triggering bug ❗ NEXT

launch path now depends more on engine reliability than visuals

🎯 STARTING POINT FOR TOMORROW

When work resumes, do not continue visual design.

Start immediately with:

File: api/generate-client-report.js
Mission: fix deterministic debt recognition and refinance triggering reliability.
