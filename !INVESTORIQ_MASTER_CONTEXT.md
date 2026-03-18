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

## 🚧 CURRENT PRIORITY (ACTIVE WORK)

We are redesigning the report to achieve:

👉 **CRISP / AIRY / LUXURY / ELITE**
👉 “Written with authority”
👉 Lender-grade visual trust

---

## ⏭️ NEXT PATCHES (IN ORDER)

### PATCH 5 — TABLE SYSTEM (NEXT — HIGH IMPACT)
Goal:
- Remove UI table feel
- Introduce:
  - ink hierarchy
  - refined spacing
  - subtle striping
  - financial statement aesthetic

---

### PATCH 6 — EXECUTIVE TEXT / NARRATIVE
Goal:
- Remove generic block feel
- Introduce:
  - editorial tone
  - better line spacing
  - typographic hierarchy

---

### PATCH 7 — COVER PAGE (FINAL)
Goal:
- Align with new system
- Keep green/gold but:
  - more minimal
  - more premium
  - less “template”

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
- Ensure debt inputs are ALWAYS correctly recognized
- Ensure refinance model runs deterministically

---

## 🧠 CURRENT STATUS

You are:

✅ Days from launch  
✅ Core engine working  
✅ Design now approaching institutional level  
⚠️ Final polish + debt model fix remaining  

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
