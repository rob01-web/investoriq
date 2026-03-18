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
