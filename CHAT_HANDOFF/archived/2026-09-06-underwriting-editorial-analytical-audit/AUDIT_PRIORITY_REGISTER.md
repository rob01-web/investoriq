# Underwriting Editorial + Analytical Audit Priority Register

**Date:** 2026-09-06  
**Purpose:** Compact implementation register derived from the full 21-page Underwriting audit.  
**Important:** The audited Stonebridge PDF is evidence of systemic defects, not the repair target.

## P1 findings

| ID | Area | Systemic outcome required |
| --- | --- | --- |
| A01 | Rent precision | Preserve canonical calculation/source precision across tables, charts, summaries, and annualized totals. Display rounding must never cause visible detail to contradict totals. |
| A02 | Tie handling | Shared concentration/ranking logic must describe ties as ties rather than arbitrarily selecting the first row. |
| A03 | Scenario scope | Cross-section scope statements and references must be generated from what analysis is actually present. Interest-rate stress cannot be described as deferred when rendered later. |
| A04 | Source register | Long filenames and long tokens must wrap safely without collision, clipping, or evidence loss. |
| A05 | Quality Manifest | Establish real gutters/stacking and readable typography so identity/evidence columns never touch. |
| A06 | Issue synthesis | Treat the $180,000 cross-basis rent comparison separately from the $20,000 expense subtotal discrepancy. State basis, consequence, and required evidence for each. |
| A07 | Break-even governance | Verify governing formulas/revenue bases for operating break-even and debt-inclusive coverage. Publish precise labels/formulas/limitations. Do not alter math merely to make figures agree. |
| A08 | Coverage semantics | Document counts and coverage statements must describe exactly what was checked and must not imply complete diligence where inputs are absent. |
| A09 | Environmental wording | Verify the underlying environmental source before claiming what “none identified” means. Unknown remains unknown. |
| A10 | Source dates/currency | Display source period/as-of dates and currency from canonical source authority, or explicitly mark unavailable. |

## P2 visual/editorial findings

| ID | Area | Systemic outcome required |
| --- | --- | --- |
| V01 | Rules/borders | One boundary, one separator. Remove stacked gold/green/black rule treatments across shared components. |
| V02 | KPI system | One approved KPI/metric hierarchy across pages and both products. |
| V03 | Readability | Essential meaning must not depend on ~5-6pt text. Reflow for readable print sizes; never squeeze to a page count. |
| V04 | Pagination | Keep headings with first meaningful content and short schedules intact. Long tables may continue with repeated headers and useful continuation labels. |
| E01 | Duplication | Consolidate repeated metrics, warnings, scope inventories, and governance prose without deleting unique evidence. |
| E02 | Customer copy | Replace vague, grammatical, and system-facing language with finding -> meaning -> unresolved -> next action. |
| D01 | Product framing | Align title and opening decision framing with what the Underwriting product actually delivers. |

## Current editorial direction

- Cover wordmark: remove isolated gold dot unless brand authority explicitly requires it.
- Reader-facing review state: prefer `Source differences require review` to unexplained `RECONCILIATION REQUIRED`.
- Product title recommendation: `InvestorIQ Underwriting Report`; optional subtitle `Prepared for investment review`.
- Page 2: remove redundant `INVESTMENT COMMITTEE OVERVIEW`; keep one main `Investment Decision Snapshot` title plus quiet running furniture.
- Horizontal rules: current concern is rule overuse, not em/en dashes. The audited PDF text contained zero em and zero en dashes.
- Earnings bridge: preserve and refine as a strong decision-useful visual.

## Implementation matrix required in the next chat

Before any repair code is changed, create a live matrix with these columns:

`Audit ID | Artifact symptom | Root-cause hypothesis | Source authority needed | Code owner/component | Shared Screening impact | Repair class | Regression proof | Fresh rendered proof | Status`

The matrix is the control plane for the repair. An item is not CLOSED merely because one Stonebridge page looks better.
