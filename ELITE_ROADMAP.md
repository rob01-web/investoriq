# InvestorIQ — Elite Report Roadmap

**Mission:** Both reports must read like Blackstone/CBRE IC committee memo output.
**Standard:** Screening valued at ~$2,990 (sold at $299). Underwriting valued at ~$9,990 (sold at $999).
**Rule:** One file at a time. Baby-step patches only. Pause for commit after each major block.

---

## PART 1 — SCREENING REPORT ($299)

Users upload: T12 + Rent Roll only.
Output: Deterministic decision memo — Proceed / Sensitized / Fail — with auditable drivers.

---

### TIER 0 — COSMETIC / TRUST KILLERS (fix before any sale)

These are defects that would make an institutional reader distrust the product instantly.

| # | Defect | Where | Root Cause | Fix Target |
|---|--------|--------|------------|------------|
| S0-1 | `"124 Richmond Street , London, ON"` — space before comma | All page headers + cover | Trailing space in PROPERTY_NAME value before address construction | `generate-client-report.js` — trim address tokens before joining |
| S0-2 | `PROPERTY_SUBMARKET` always empty → `"Property Name · "` trailing middot in header | Line 836 of template + cover sub-line | Hardcoded `""` at `generate-client-report.js:~2381` | Derive from job metadata (`jobs.address` or similar) or strip middot when empty |
| S0-3 | `EXEC_CLASSIFICATION_RATIONALE` always empty → dead vertical gap in verdict block | Exec Summary verdict block | Token never filled; set to `""` in fail-closed sweep | Compute a deterministic 1–2 sentence rationale from `screeningClass + driver1` |
| S0-4 | "Ranked Drivers (Worst → Best)" alone on its own full page (~70% blank) | Page 3 of PDF | Content at bottom of long left-column overflows; right column of `grid-2` is empty | Move ranked drivers into a compact standalone block below bullets, or ensure it stays on same page |
| S0-5 | Trailing periods on exec headings (now fixed via whitelist) | `sentenceIntegrity.js` | `exec-major-heading` and `small` were not whitelisted | **DONE** — deployed in this session |
| S0-6 | Section headers still ALL-CAPS in older PDFs | All section pages | `text-transform: uppercase` in CSS | **DONE** — removed in this session |
| S0-7 | `"Primary Pressure Point - Expense Ratio"` used hyphen instead of colon | Verdict block | Template used `&mdash;` which DocRaptor rendered as `-` | **DONE** — fixed in this session |

---

### TIER 1 — CONTENT GAPS (required for $299 legitimacy)

| # | Defect | Where | Root Cause | Fix Target |
|---|--------|--------|------------|------------|
| S1-1 | T12 Operating Statement shows only 4 summary rows, no line-item breakdown | Page 5 of PDF | This property's T12 has only lump-sum totals (no individual expense lines); page is 75% empty | Add "No line-item breakdown available for this T12 format" message when rows are empty; show what IS available |
| S1-2 | Income Forensics section stripped entirely for lump-sum T12s | Missing from PDF | `buildScreeningIncomeForensicsHtml` returns `""` when `incomeLines.length < 2` | Provide graceful fallback card showing EGI + any available income fields even when no line items |
| S1-3 | Expense Drivers not rendering in Expense Structure section | Page 6 of PDF | `toExpenseRows` returns empty when T12 has no individual expense lines | Same fallback: show single-line summary ("Total Operating Expenses: $120,790") with flag instead of empty drivers block |
| S1-4 | All section pages ~20–30% full then blank | Pages 4–11 | `page-break` CSS class forces each section to its own page even with minimal content | Group thin sections together (e.g., combine Data Coverage + Refi Sufficiency into one page) |
| S1-5 | NOI Sensitivity shows only 2 rows in older builds; code now generates 4 | Page 7 of PDF | Older test PDF; current code has 4-row builder | Verify on next generation that all 4 scenarios render |
| S1-6 | Document Sources shows filenames only, no doc type or parse status | Exec Summary | Query only fetches `original_filename, created_at` | Add `doc_type` classification to display (T12 / Rent Roll / Other) |

---

### TIER 2 — INSTITUTIONAL TONE (what makes it feel 10x valuable)

| # | Improvement | Detail | Target File |
|---|-------------|--------|-------------|
| S2-1 | **Classification rationale sentence** | Verdict block must say: *"Classified SENSITIZED: expense ratio of 62.6% exceeds the 55.0% sensitized threshold; NOI margin of 37.4% provides limited operating buffer."* — deterministic, no AI | `generate-client-report.js` — build `execClassificationRationale` string from `screeningClass + driver values` |
| S2-2 | **Pressure point includes value** | "Primary Pressure Point: Expense Ratio (62.6%)" — not just the label | `generate-client-report.js` — append `driver1.value` to `PRIMARY_PRESSURE_POINT` token |
| S2-3 | **KPI flagging is dynamic** | Only flag cards that actually breach thresholds (gold border). Currently Expense Ratio and NOI Margin are always flagged regardless of values | `report-template-runtime.html` — inject `kpi-card--flagged` class dynamically from JS, not hardcoded in template |
| S2-4 | **Ranked Drivers trigger language** | "(trigger: >= 55.0% sensitized threshold breached)" is raw/ugly. Should read: *"Expense Ratio 62.6% — breaches sensitized threshold of 55.0%"* | `generate-client-report.js` — rewrite DRIVER_x_TRIGGER format strings |
| S2-5 | **Section header subtitles are truncated in PDF** | "Expense Structure Analysis — Expense Ratio, Drivers, and Intensity Flags" wraps to 2 lines because it's too long | `report-template-runtime.html` — shorten section header subtitles |
| S2-6 | **Break-even Occupancy classification tag** | "(Stable)" appended in KPI value is institutional. All 3 verdict metrics should show their classification in parentheses | Already working; verify on all classification tiers |
| S2-7 | **Document Sources: show doc type** | "124 Richmond T12.pdf — T12 Operating Statement — Parsed" vs bare filename + timestamp | `generate-client-report.js` + Supabase query |
| S2-8 | **Empty right column in Exec Summary grid** | The `grid-2` wrapper on exec summary has an empty right column — wasted space | `report-template-runtime.html` — either use the right column for property location/photo placeholder or go full-width |

---

## PART 2 — UNDERWRITING REPORT ($999)

Users upload: T12 + Rent Roll + ALL available docs (appraisal, mortgage statement, purchase agreement, operating history, property condition report, comparable sales, etc.).
Output: Full lender-grade underwriting package — stress-tested, refinance-modeled, IC-ready.

The moat: **"The only tool that models refinance collapse risk deterministically."**

---

### TIER 3 — UNDERWRITING BASELINE (required for $999 legitimacy)

| # | Section | Current State | What's Needed |
|---|---------|---------------|---------------|
| U3-1 | **Refinance Stability Classification** | `buildRefiStabilityModel` exists; fails-closed correctly when inputs missing | Verify Stable/Sensitized/Fragile/Failure tier math; output must include the classification label + the stress scenario that triggers collapse |
| U3-2 | **Debt Structure / Capital Stack** | `DEBT_CAPITAL_STRUCTURE_ROWS` token — **never built** | Extract debt terms from uploaded mortgage docs; build table: Lender / Balance / Rate / Amort / Monthly P&I / DSCR at current NOI |
| U3-3 | **5-Year Scenario Analysis** | `buildScenarioTable` builder exists; `SCENARIO_TABLE` token exists | Build deterministic 5-year NOI projection from T12 baseline + explicit rent growth assumption (stated, not assumed) |
| U3-4 | **Return Summary** | `buildReturnSummaryTable` builder exists | Populate from deal parameters when present (purchase price, equity, financing) |
| U3-5 | **Risk Scoring** | Purely narrative + external radar chart URL | Build deterministic risk matrix from existing driver rankings: 3×3 grid (Financial Health × Operating Stability) with color coding |
| U3-6 | **Renovation Strategy** | Narrative-driven; budget/execution tables have builders | When no renovation docs uploaded, section should fail-closed cleanly with: "No renovation documentation provided. Section omitted." |
| U3-7 | **Neighborhood Fundamentals** | Narrative-only; stripped when no narrative | When submarket data available from uploaded docs, extract and display; when not, fail-closed with clear statement |
| U3-8 | **DCF Analysis** | `DCF_TABLE_BLOCK` token — **never built** | 5-year discounted cash flow from T12 baseline; requires exit cap rate assumption (from uploaded appraisal or user input) |

---

### TIER 4 — THE MOAT (what makes it worth $9,990)

| # | Feature | Description | Where to Build |
|---|---------|-------------|----------------|
| U4-1 | **Refinance Collapse Risk Grid** | Core differentiator. 3×3 DSCR sensitivity table: rows = interest rate scenarios (+0/+100/+200 bps), columns = exit cap rate scenarios (current / +50bps / +100bps). Each cell shows implied DSCR. Cells below 1.20 flagged red. | `generate-client-report.js` — extend `buildRefiStabilityModel` to output this grid when debt inputs present |
| U4-2 | **Refinance Collapse Classification Tier** | After stress grid: classify the asset as: Stable (DSCR ≥ 1.20 in all scenarios) / Sensitized (DSCR < 1.20 in 1–2 scenarios) / Fragile (DSCR < 1.20 in most scenarios) / Refinance Failure Under Stress (DSCR < 1.00 in any scenario) | Same builder |
| U4-3 | **Deterministic 5-Year Cash Flow** | Year 0 = T12 NOI. Years 1–5 = NOI grown at document-backed rate (if market data uploaded) or stated-flat (explicitly noted). Exit valuation = Year 5 NOI ÷ exit cap rate. All assumptions listed in footnote. | `generate-client-report.js` — build `buildDeterministicCashFlow` |
| U4-4 | **Comparable Transaction Table** | If comps uploaded: sale price, cap rate, price/unit, date. Used to anchor acquisition yield analysis. If not: section fails-closed. | `buildCompsTable` already exists; needs to be wired to parsed data |
| U4-5 | **IC Deal Score** | Quantitative scorecard: 5–7 weighted metrics (Expense Ratio, NOI Margin, Occupancy, Rent Gap, Break-even Occ, DSCR if available, Market Premium). Total score 0–100 → maps to Proceed / Review / Pass. | `buildDealScoreTable` exists; wire to computed metrics |
| U4-6 | **Final Investment Summary** | 1-page IC memo distillation: Verdict + Top 3 Drivers + Top 2 Risks + Key Metrics + Recommendation. This is the cover page of a real IC memo. | `report-template-runtime.html` + `generate-client-report.js` |

---

## EXECUTION ORDER (Recommended Sequence)

### TODAY — Get Screening to Sellable State

**Block A: Zero cosmetic defects (S0-1 through S0-4)**
1. Fix address comma spacing (trim in address construction)
2. Fix PROPERTY_SUBMARKET empty → strip trailing middot when empty
3. Build `execClassificationRationale` deterministic string
4. Fix Ranked Drivers orphan page layout

**Block B: Classification rationale + pressure point value (S2-1, S2-2)**
5. Verdict block shows full rationale sentence
6. Primary Pressure Point includes value in parentheses

**Block C: Content fallbacks for lump-sum T12s (S1-1, S1-2, S1-3)**
7. Income Forensics fallback for no line items
8. Expense Drivers fallback for no line items
9. T12 Operating Statement — show available summary even without line items

### NEXT — Underwriting Baseline

**Block D: Debt structure + refi model (U3-1, U3-2)**
10. Build DEBT_CAPITAL_STRUCTURE_ROWS from parsed mortgage docs
11. Verify refinance stability classification math

**Block E: The moat (U4-1, U4-2)**
12. Refinance Collapse Risk Grid (DSCR sensitivity 3×3)
13. Classification tier output

**Block F: 5-Year Projections (U3-3, U4-3)**
14. Deterministic scenario analysis from T12 baseline
15. Exit valuation from cap rate

---

## QUALITY GATE — What "Elite" Looks Like

Before any report goes to a paying customer, it must pass all of these:

- [ ] Zero cosmetic defects visible to an institutional reader
- [ ] Every number traces to a specific uploaded document or deterministic formula
- [ ] No empty shells, no orphan pages, no dead whitespace > 30% of a page
- [ ] Verdict block: classification + rationale sentence + pressure point with value
- [ ] All section pages at least 50% utilized (content density)
- [ ] All stress/sensitivity tables complete (4-row NOI sensitivity minimum)
- [ ] Screening: fail-closed with clear statement when T12/rent roll insufficient
- [ ] Underwriting: Refinance Collapse Risk Classification appears when debt inputs present
- [ ] Underwriting: All sections either populated or cleanly omitted with reason stated
- [ ] `node --check api/generate-client-report.js` passes after every edit

---

## FINAL SWEEP — Required Before Any Public Launch

**Do this as the very last step before going live:**

- [ ] **No em dashes anywhere.** Em dashes are a widely-recognized AI writing signature. InvestorIQ is proprietary and deterministic — never AI. Sweep every file: `report-template-runtime.html`, `generate-client-report.js`, all frontend copy in `src/`. Replace `&mdash;`, `—`, `–` with `:` or `,` as appropriate.
- [ ] **No mention of "AI" visible to users.** No "AI-generated", "AI analysis", "AI-powered" in reports, dashboard copy, or emails. The product is document-driven — let the output speak for itself.
- [ ] Audit command when ready: `grep -rn "mdash\|&ndash;\| — \| – \|AI-\| AI " api/report-template-runtime.html api/generate-client-report.js src/`

---

## KNOWN UNFIXED ITEMS (as of session 2026-03-01)

These were identified but not yet patched:
- PROPERTY_SUBMARKET hardcoded empty
- EXEC_CLASSIFICATION_RATIONALE never computed
- Ranked Drivers orphan page layout
- Income Forensics / Expense Drivers no-line-item fallback
- DEBT_CAPITAL_STRUCTURE_ROWS never built
- DCF_TABLE_BLOCK never built
- REFI_SENSITIVITY_MATRIX_BLOCK never built (this IS the moat)
