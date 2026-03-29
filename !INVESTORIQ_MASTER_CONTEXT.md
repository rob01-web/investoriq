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

- InvestorIQ is no longer in visual-polish phase
- InvestorIQ is now in final launch-stabilization phase
- single most important next action:
  - fix Textract
  - rerun the same debt test pack
  - verify typed debt artifacts and refinance rendering end-to-end

---

## 🚀 LAUNCH READINESS CHECK

To launch, ALL must be true:

### Visual
- [x] report design is launch-ready / locked
- [x] product positioning is strong
- [x] deterministic philosophy remains core strength

### Product
- [x] one-run entitlement architecture exists
- [x] fail-closed / no-hallucination philosophy remains intact
- [ ] do not email Ken Dunn until engine blockers below are cleared
- [ ] No “DATA NOT AVAILABLE” spam

### Engine
- [x] core rent roll + T12 path works
- [x] supporting-doc dispatch improved
- [x] debt classifier logic improved
- [x] malformed PDF fallback improved
- [ ] Textract must be functioning live
- [ ] supporting PDFs must extract as readable text for debt / property-tax classification
- [ ] no silent degradation may remain on debt-aware underwriting runs

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

## 🚨 ENGINE FAILURE — SUPPORTING DOC PARSE 400 (ROOT CAUSE — MARCH 2026)

### ❗ WHAT HAPPENED

During a full underwriting test:

- Rent Roll parsed ✅
- T12 parsed ✅
- ALL supporting PDFs failed ❌

Observed symptoms:

- DSCR → NOT ASSESSED
- Debt narrative missing
- Refinance model (MOAT) did not render
- Report still completed successfully (silent degradation)

---

### 🔍 ARTIFACT EVIDENCE

From `analysis_artifacts`:

- `t12_parsed` ✅
- `rent_roll_parsed` ✅
- `loan_term_sheet_parsed` ❌ (missing)
- `mortgage_statement_parsed` ❌ (missing)
- `property_tax_parsed` ❌ (missing)

Repeated worker events:

- `supporting_doc_parse_failed`
- status: 400

---

### 🎯 ROOT CAUSE (CONFIRMED)

Mismatch between:

- `analysis_job_files.doc_type`
  → "supporting"

AND

- `parse-doc.js` expected input
  → "supporting_documents"

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

### 🔥 WHY THIS MATTERS

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

### 🛠 REQUIRED FIX

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

### 🎯 EXPECTED RESULT AFTER FIX

Supporting PDFs enter inference pipeline

document_text_extracted → used correctly

loan_term_sheet_parsed created

mortgagePayload populated

DSCR computed

Refinance model (MOAT) renders

No silent degradation

### âœ… VALIDATED RERUN RESULT

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

### ⚠️ SECONDARY WATCH ITEMS

`extract-job-text.js`

Some PDFs logged:

`document_text_extract_failed`

May indicate:

- `pdf-parse` edge cases
- or file handling inconsistencies

XLSX supporting docs

Currently skipped in extraction layer

may remain at pending

### 🚨 SYSTEM PRINCIPLE REINFORCED

InvestorIQ must NEVER:

- silently drop supporting documents
- continue underwriting with missing critical artifacts
- produce “complete-looking” reports with incomplete intelligence

Required behavior:

EITHER:

- fully process supporting docs

OR:

- fail closed with explicit error

### 🧠 CURRENT ENGINE STATE

Core parsing engine: ✅ stable

Supporting doc ingestion: ❌ broken (this issue)

Debt recognition: ❌ blocked upstream

Refinance modeling: ❌ blocked upstream

### 🎯 NEXT STEP

Apply fix in:

`api/parse/parse-doc.js`

THEN:

- rerun identical underwriting test

confirm:

- `loan_term_sheet_parsed` exists
- DSCR renders
- MOAT renders

Validated final stabilization result:

- supporting-doc pipeline is now restored at the dispatch / extraction / parse handoff level
- debt recognition logic is restored, but still depends on readable supporting-doc text
- refinance modeling logic is restored, but still depends on typed debt artifacts being produced
- supporting-doc pipeline root cause 1 fixed:
  - `api/parse/parse-doc.js` now accepts `supporting`, `supporting_documents`, and `supporting_documents_ui`
- supporting-doc pipeline root cause 2 fixed:
  - `api/parse/extract-job-text.js` now queries `uploaded_at` instead of `created_at`
- supporting-doc pipeline root cause 3 fixed:
  - `parse-doc.js` supporting inference previously allowed overlapping keyword collisions between `loan_term_sheet` and `mortgage_statement`
  - `inferDocTypeFromText(text)` now evaluates `loan_term_sheet` before `mortgage_statement`
  - `loan_term_sheet` now requires anchor terms:
    - `TERM SHEET` or `LOAN AMOUNT`
  - `mortgage_statement` now requires anchor terms:
    - `OUTSTANDING BALANCE` or `MONTHLY PAYMENT`
  - both debt types now also require broader supporting debt terms
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
- `node --check api/parse/parse-doc.js` passed after the classifier tightening
- debt -> parse -> artifact -> report chain is restored
- current debt-doc collision risk is reduced without changing downstream artifact or report contracts
- supporting-doc dispatch gate in `api/admin-run-worker.js` now includes:
  - `pending`
  - `extracted`
- non-debt supporting-doc intelligence expanded cautiously:
  - `insurance_policy`
  - `bank_statement`
- non-debt recognizers now require:
  - at least 1 anchor
  - at least 2 corroborating terms
- these additions were intentionally minimal and did not change downstream report contracts
- `extract-job-text.js` now includes a malformed-PDF fallback for xref / startxref / trailer-style failures
- earlier `bad XRef entry` failures no longer represent the primary blocker

## CRITICAL CURRENT BLOCKER

The current launch blocker is NOT the old worker gate anymore.

The current launch blocker is:

- Textract is not functioning in the current AWS environment
- local PDF extraction is unreliable for some uploaded supporting PDFs
- some uploaded PDFs appear to contain ReportLab-generated stream text patterns in extracted artifacts
- `document_text_extracted` for several supporting docs contains garbage / unreadable stream text instead of real readable text
- because of that, `inferDocTypeFromText()` fails and those files fall to:
  - `supporting_documents_unclassified`

Verified examples:

- `CLEAN_Debt_Term_Sheet_124_Richmond.pdf` ended as:
  - `supporting_documents_unclassified`
  - `extracted`
- `Property_Tax_Bill_2025_124_Richmond_Test.pdf` also ended:
  - `supporting_documents_unclassified`
  - `extracted`
- unsupported appraisal extracted cleanly and did produce:
  - `appraisal_parsed`

This proves:

- parser dispatch is running
- extraction quality is now the primary blocker for some PDFs

## TEXTRACT STATE (CRITICAL)

Textract is currently failing live.

Observed worker events show:

- `textract_failed`
- error_message:
  - `The AWS Access Key Id needs a subscription for the service`

Current diagnosis:

- Textract appears not to be activated / subscribed / permitted correctly for the current AWS account / key / region
- this is now the real launch blocker for robust supporting-PDF classification
- until Textract is fixed, some debt / property-tax / supporting docs may remain unreadable to the classifier even though the pipeline executes

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

A. Fix Textract fully

- activate / subscribe / permission the AWS account / key / region correctly
- confirm `textract_failed` no longer appears for supporting PDFs

B. Re-run the same underwriting test pack

Using the same Richmond test docs, verify that:

- `CLEAN_Debt_Term_Sheet_124_Richmond.pdf` becomes a typed parsed debt artifact
- `Property_Tax_Bill_2025_124_Richmond_Test.pdf` becomes `property_tax_parsed`
- debt is no longer omitted from the report
- DSCR renders
- refinance / MOAT content renders
- no silent degradation remains

C. Confirm fail-closed credibility

- if a supporting document cannot be read, InvestorIQ must degrade explicitly and honestly
- it must never pretend a debt-aware underwriting run is complete when debt extraction failed

D. Only after the above is verified should we:

- email Ken Dunn
- treat InvestorIQ as truly launch-ready


Problem:
- supporting PDFs never parsed correctly
- no `document_text_extracted` artifact existed
- `parse_status` stayed at `pending`
- debt artifacts were missing

Root cause:
- worker did not dispatch supporting docs consistently
- worker did not call `extract-job-text` before `parse-doc`
- `parse-doc` depended on a missing `document_text_extracted` artifact

Fix:
- worker now dispatches supporting doc types:
  - `supporting`
  - `supporting_documents`
  - `supporting_documents_ui`
- worker normalizes them to:
  - `supporting_documents`
- worker now calls:
  - `api/parse/extract-job-text`
  - before
  - `api/parse/parse-doc`

Result:
- loan term sheets can now be classified correctly
- debt artifacts can now be created deterministically
- supporting PDFs no longer remain stuck at `pending` when the pipeline is healthy

---

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

## 🧠 LLM EXECUTION LAYER (CRITICAL — LOCKED)

### 📍 WHERE LLM IS CALLED

The LLM is invoked ONLY inside:

File:
`api/generate-client-report.js`

Stage:
AFTER underwriting + scoring
BEFORE HTML assembly

Pipeline position:

deterministic metrics
→ deterministic scoring
→ structured report JSON built
→ 🧠 LLM narrative generation (THIS STEP)
→ inject narratives into template
→ render HTML
→ generate PDF

---

### 🧠 PROMPT SYSTEM (LOCKED)

The system uses:

👉 "Golden Elite Master Prompt"

Rules:
- Prompt is injected at runtime
- Prompt receives ONLY structured JSON
- Prompt NEVER receives raw documents
- Prompt NEVER computes numbers

---

### 📦 LLM INPUT CONTRACT (STRICT)

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

### 🎯 LLM OUTPUT CONTRACT

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

### ⚙️ MODEL STRATEGY (HARD LOCK)

Production model:

👉 OpenAI API (GPT-5.x)

Used for:
- ALL narrative generation

Reason:
- deterministic control
- cost efficiency
- already integrated
- sufficient quality with Golden Prompt

---

### 🧪 NON-PRODUCTION MODEL

Anthropic Claude:

- NOT used in production pipeline
- ONLY used for:
  - internal benchmarking
  - optional future premium tier

---

### 🚨 FAIL CONDITIONS

If any of the following occur:

- missing required input fields
- undefined metrics
- incomplete underwriting outputs

THEN:

❌ DO NOT CALL LLM

Instead:
- fail closed
OR
- inject deterministic "DATA NOT AVAILABLE" logic

---

### 🔒 SYSTEM IDENTITY

InvestorIQ is:

NOT an AI underwriting system

It is:

👉 a deterministic underwriting engine  
👉 with AI used ONLY for narrative presentation

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

If required data is missing → section is omitted or flagged.

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

If degradation exists → change is rejected

# 🚨 EXECUTION CONTRACT (MANDATORY)

You are working on InvestorIQ.

This file is the SINGLE SOURCE OF TRUTH.

You MUST follow ALL rules in this document EXACTLY.

## NON-NEGOTIABLE RULES

1. NO REFACTORING
- Do not restructure code
- Do not rename variables
- Do not “clean up” anything

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
- If unsure → STOP
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
- If code conflicts with this document → FOLLOW THIS DOCUMENT

9. NO PARTIAL PATCHES
- If a patch cannot be completed fully and cleanly → STOP
- Do not return partial implementations

Failure to follow ANY rule = INVALID OUTPUT

***If you violate ANY rule in the execution contract, STOP and explain why.***
