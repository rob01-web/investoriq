# Underwriting Report — Morning Gameplan
_Goal: $999 report with 7x–10x perceived value vs. screening. Target: 22–25 dense pages._

---

## QUICK DIAGNOSTIC: test8 vs. screening
| | Screening (test22) | Underwriting (test8) |
|---|---|---|
| Pages | 12 | 14 |
| Avg page fill | ~75% | ~52% |
| Charts | 4 HTML/CSS | 1 (deal score bar) |
| Debt/DSCR section | n/a | fail-closed (no mortgage doc uploaded) |
| THE MOAT | n/a | not rendered |

The 14 pages are real progress but 7 of them are visually thin (20–70% fill). The MOAT never rendered because no mortgage/debt document was uploaded in test8. This is the most important fix.

---

## BLOCK 0 — THE MOAT: Debug & Unlock (30 min)
**Must do first — this is the entire underwriting value prop.**

### Step 0A: Check how the debt term sheet parses
The file `CLEAN_Debt_Term_Sheet_124_Richmond.pdf` was uploaded in the test folder but **not included in the test job**. Upload it as a supporting document in test9.

After the job runs, query `analysis_artifacts` for that job:
```sql
SELECT type, payload FROM analysis_artifacts WHERE job_id = '[test9_job_id]' ORDER BY created_at;
```
Expected: `loan_term_sheet_parsed` artifact with `interest_rate`, `loan_amount`, `ltv`, `amort_years`.

### Step 0B: Check the mortgagePayload fetch (potential null bug)
In `generate-client-report.js` around line 2329, `mortgagePayload` is fetched from `mortgage_statement_parsed`. A **term sheet** is stored as `loan_term_sheet_parsed` — a different key. If this is the issue, the MOAT gate (`if (mortgagePayload && t12Payload && effectiveReportMode === "v1_core")`) will still be false.

**Fix:**
```javascript
// generate-client-report.js ~line 2329
const mortgageArtifact =
  artifacts.find(a => a.type === "mortgage_statement_parsed") ||
  artifacts.find(a => a.type === "loan_term_sheet_parsed");
const mortgagePayload = mortgageArtifact?.payload ?? null;
// Normalize: loan_term_sheet uses loan_amount; mortgage uses outstanding_balance
if (mortgagePayload && !mortgagePayload.outstanding_balance && mortgagePayload.loan_amount) {
  mortgagePayload.outstanding_balance = mortgagePayload.loan_amount;
}
```

### Step 0C: Verify THE MOAT renders
Run test9 with T12 + Rent Roll + CLEAN_Debt_Term_Sheet.
Expected result: SECTION_7_DEBT renders with the 3×3 color-coded DSCR grid.
This is the non-negotiable test. Nothing else matters until this works.

---

## BLOCK 1 — Fix Visual Bugs (45 min)

### Bug 1: Dark-on-dark table headers (Scenario p.10, DCF p.13)
The `<th>` elements in the scenario table and DCF table both render dark text on dark background.
Fix location: In `generate-client-report.js`, inside the `buildScenarioTable` rows (around line 4229) and DCF table builder (around line 4181). Change `<th` header style:
```javascript
// Find header row in both builders, add:
style="background:#1e293b; color:#ffffff; font-weight:600; ..."
```

### Bug 2: Data Coverage page is 20% filled (p.9)
`buildScreeningDataCoverageSummary` returns a 2-row sparse table when all data is present (nothing is missing, so there's nothing to flag). This looks broken.

**Fix:** When all documents have 100% coverage, show a "DATA INTEGRITY CONFIRMED" card:
- Green checkmark header: "All Required Inputs Present"
- Confirmed docs table: T12 ✓ 4/4 fields, Rent Roll ✓ 4/4 fields
- List the actual uploaded filenames (from artifact metadata)
- Add an "Inputs Summary" block listing every uploaded document with its detected type

### Bug 3: Cover page 60% whitespace (p.1)
Add an "Asset Snapshot" block below the verdict card:
```
PROPERTY:     124 Richmond Street
ASSET CLASS:  Multifamily — 12 Units
REPORT DATE:  March 4, 2026
DOCUMENTS:    T12 · Rent Roll · Debt Terms
PREPARED BY:  InvestorIQ Property Intelligence
```
Token: `{{COVER_ASSET_SNAPSHOT}}` — build from job metadata + artifact list.
This fills the bottom 30% of the cover with institutional-looking content.

### Bug 4: Refi Stability fail-close is ugly (p.11)
Currently renders a full-page diagnostic table listing 9 missing inputs. To a client this looks like a broken section.

**Fix:** When the MOAT can't render (no debt doc), strip the entire SECTION_7_REFI_STABILITY and replace with a clean one-card message:
> "Refinance Stability Classification requires debt terms (mortgage statement or loan term sheet). Upload supporting debt documents to unlock this analysis."
Style this as a gold-bordered card with an icon, not a broken diagnostic table.

---

## BLOCK 2 — HTML/CSS Charts (2 hr)
_All pure HTML/CSS — no images, no fabrication. This is the biggest visual upgrade._

### Chart 1: NOI Waterfall (Operating Statement, p.4)
```
EGI        ████████████████████████████████████  $192,960  100%
OpEx (-)   ████████████████████████████          $120,790   62.6%  [red]
NOI        ████████████████                       $72,170   37.4%  [green]
```
3-row table with `div` bars scaled to EGI = 100%. Fills bottom 1/3 of Operating Statement page.
Token: `{{NOI_WATERFALL_CHART}}`
Inputs: `t12EgiValue`, `t12TotalExpensesValue`, `t12NoiValue`

### Chart 2: Expense Breakdown Bar Chart (Expense Structure, p.6)
Horizontal bars, sorted descending by amount:
```
Property Taxes    ██████████████████████  31.8%  $38,438
Utilities         █████████████████       23.1%  $27,923
Repairs & Maint   ██████████████          18.7%  $22,614
...
```
Token: `{{EXPENSE_BREAKDOWN_CHART}}`
Inputs: `t12Payload.expense_lines` (sorted by value desc)

### Chart 3: Rent Distribution Visual (Rent Roll, p.8)
Side-by-side in-place vs. market rent bars by unit type:
```
          In-Place                    Market
1 Bed     ████████████  $1,150       ██████████████  $1,350   +17.4% gap
2 Bed     ████████████  $1,500       ██████████████  $1,750   +16.7% gap
```
Token: `{{RENT_DISTRIBUTION_CHART}}`
Inputs: `computedRentRoll.unit_mix`

### Chart 4: Occupancy Buffer Gauge (NOI Stability, p.7)
```
Break-Even         Current / Ceiling
   65.3%   ←────────── 34.7 pt buffer ──────────►  100%
           ████████████████████░░░░░░░░░░░░░░░░░░░░
           [yellow zone]         [green cushion]
```
A single CSS progress bar with a labeled marker at break-even and the fill going to current occupancy.
Token: `{{OCCUPANCY_BUFFER_VISUAL}}`
Inputs: `breakEvenOccR`, `execOccupancy`

### Chart 5: Scenario NOI Trajectory (Scenario Analysis, p.10)
5 grouped bars, one per year, 3 colored bars per year (conservative/base/optimistic):
```
Y1   ████  ████  █████
Y2   █████ █████ ██████
Y3   ██████████  ███████
Y4   ███████████ ████████
Y5   ████████████████████
     [grey] [blue] [gold]
```
Token: `{{SCENARIO_TRAJECTORY_CHART}}`
Inputs: `scenarioRows` (already computed in Block 3 builder)

---

## BLOCK 3 — Content Expansion (1.5 hr)

### 3A: Scenario Analysis — expand from thin to full
Currently: 1 table (NOI + Exit Value only), 5 rows. 30% page fill.

Add to the scenario table:
- EGI column (NOI / estimated NOI margin)
- Implied OpEx column
- Exit Value row separated below the year rows with a heavier border

Add **Cap Rate Sensitivity on Exit Value** mini-table below:
| Cap Rate | Conservative Exit | Base Exit | Optimistic Exit |
|---|---|---|---|
| 4.5% | $X | $X | $X |
| 5.0% | $X | $X | $X |
| 5.5% | $X | $X | $X |
| 6.5% | $X | $X | $X |

Add the trajectory chart (from Block 2).

Result: Scenario page goes from 30% → 90%+ fill. This is a full rich page.

### 3B: DCF — expand from thin to full
Currently: 6-column table, 5 rows + 1 summary, 2 explanation paragraphs. 45% fill.

Add **Cap Rate Sensitivity on Intrinsic Value** mini-table:
| Exit Cap Rate | Year 5 Exit Value | Total PV (Intrinsic) |
|---|---|---|
| 4.5% | $X | $X |
| 5.0% | $X | $X |
| 5.5% stated | $X | $X |
| 6.0% | $X | $X |
| 6.5% | $X | $X |

Add **Key Assumptions** callout card listing stated defaults clearly:
> "NOI growth: 3.0% annually (stated) · Discount rate: 8.0% (stated) · Exit cap: 5.5% (stated default — override by uploading appraisal)"

Add one interpretation paragraph explaining whether the intrinsic value supports the implied cap rate.

Result: DCF page goes from 45% → 85%+ fill.

### 3C: Unit Value Add — expand
Currently: Unit mix table + cap rate value indication. 40% fill.

Add **Rent Upside Pathway** card:
```
Annual Rent Upside (in-place → market):    $32,460/yr
Implied Value Lift at 5.0% cap rate:       $649,200
Implied Value Lift at 6.0% cap rate:       $541,000
Implied Value Lift at 7.0% cap rate:       $463,714
Required months to payback reno at $X/unit [if renovation data available]
```
Inputs: `computedRentRoll.total_annual_market - computedRentRoll.total_annual_inplace`

Result: Unit Value Add page goes from 40% → 70%+ fill.

### 3D: NEW — Risk Register table
A standalone section between NOI Stability and Rent Roll (or after Deal Scorecard), or added to the Deal Scorecard page as a sub-section.

Deterministic risk register built entirely from computed metrics:
| Risk Factor | Reading | Status | Severity |
|---|---|---|---|
| Expense Ratio | 62.6% | Above 55% threshold | ELEVATED |
| Occupancy | 100% | Above 85% threshold | CLEAR |
| Break-Even Occ | 65.3% | Below 80% threshold | CLEAR |
| Rent-to-Market | +17.4% above market | Positive upside | FAVORABLE |
| DSCR | N/A | Requires debt terms | NOT ASSESSED |
| NOI Margin | 37.4% | Below 40% target | WATCH |

Color-code each row (green/amber/red). This adds an institutional risk-screening lens that a $99 screening report would never have.

Token: `{{RISK_REGISTER_TABLE}}`
Location in template: Add as a sub-section inside SECTION_8_DEAL_SCORE below the score card, OR as a standalone section.

---

## BLOCK 4 — Section Reorder for Narrative Impact (30 min)

**The MOAT is currently buried on page 11.** For a $999 underwriting report, debt analysis should be the opening statement after the exec summary — not an afterthought.

### Proposed section order (template surgery):
```
1.  Cover
2.  Exec Summary (DSCR card when debt present)
3.  *** DEBT CAPITAL STRUCTURE + THE MOAT *** ← move from p.11 to p.3
4.  Operating Statement (TTM) + NOI Waterfall chart
5.  Income Forensics
6.  Expense Structure + Expense Breakdown chart
7.  NOI Stability + Occupancy Buffer gauge
8.  Rent Roll + Rent Distribution chart
9.  Unit Value Add (expanded)
10. Scenario Analysis (expanded) + Trajectory chart
11. Deal Scorecard + Bar chart + Risk Register
12. DCF (expanded) + Cap Rate Sensitivity
13. Data Coverage (improved, merged with doc inputs list)
14. Methodology
```

**Implementation:** Move `SECTION_7_REFI_STABILITY` and `SECTION_7_DEBT` blocks in `report-template-runtime.html` from their current location (after SECTION_6_RENOVATION) to immediately after `SECTION_0_5` (Exec Summary). This is template block surgery — careful but straightforward since the section markers are clean.

---

## BLOCK 5 — Exec Summary Underwriting Upgrade (30 min)
Currently the exec summary is identical to screening. For v1_core with debt docs:

1. **DSCR card** — when mortgagePayload is present, show `EXEC_DSCR_CARD` with DSCR value + color classification (green/amber/red)
2. **Primary Pressure Point** — for v1_core with debt, change from "Expense Ratio" to "DSCR" if DSCR < 1.25, or "Refinance Risk" if refi stability is FRAGILE
3. **Underwriting-specific bullets** in Key Risks:
   - "DSCR of [X]x provides [thin/adequate/strong] debt service coverage" (when debt present)
   - "Refinance risk: [STABLE/SENSITIZED/FRAGILE]" (when debt present)
4. **Report differentiation label** — currently says "12-Unit Multifamily" — add "Full Underwriting Report" subtitle in smaller text below to clearly differentiate from screening

---

## EXPECTED OUTCOME

| | Before (test8) | After (target) |
|---|---|---|
| Pages | 14 | 22–25 |
| THE MOAT | not rendered | 3×3 DSCR grid, prominent |
| Charts | 1 | 6 |
| Cover fill | 30% | 70% |
| Scenario fill | 30% | 90% |
| DCF fill | 45% | 85% |
| Data Coverage fill | 20% | 70% |
| Risk Register | absent | full table |
| Debt Capital Structure | absent | full table with DSCR |
| Exec Summary | identical to screening | underwriting-specific with DSCR |

**Priority order if time is limited:**
1. BLOCK 0 — THE MOAT (non-negotiable, unlocks the entire section)
2. BLOCK 2 — Charts (highest visual impact per hour)
3. BLOCK 1 — Visual bug fixes (dark headers, cover whitespace, Data Coverage card)
4. BLOCK 3 — Content expansion (scenario + DCF + risk register)
5. BLOCK 4 — Section reorder (biggest narrative improvement, most careful work)
6. BLOCK 5 — Exec summary upgrade (polish)
