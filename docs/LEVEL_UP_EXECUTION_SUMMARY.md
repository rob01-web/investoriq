# InvestorIQ Level-Up Summary

## Positioning Target
- Screening Report: perceived value `$2k+`, price `$299`
- Underwriting Report: perceived value `$5k+`, price `$999`

## 5 Core Upgrades
1. **Decision Context Block (Screening)**
- Deterministic pass conditions + hard disqualifiers + current satisfied count.
- No inference, no opinion language.
- “This deal passes institutional viability gates under deterministic operating thresholds.”

2. **Mini Sensitivity Grid (Screening)**
- Base + simple deterministic perturbations from uploaded values.
- Show implied NOI / margin impact clearly.

3. **Breakpoint Table (Underwriting)**
- Explicit failure thresholds for NOI, interest rate, exit cap, DSCR/LTV constraints.
- Make breakpoints visible for IC-level decisioning.

4. **Never-Empty High-Value Sections**
- Top drivers and key diagnostic blocks must either:
- render deterministic fallback, or
- strip cleanly (no empty shells / no repetitive DNA spam).

5. **Zero Cosmetic Defects**
- No mojibake, no spacing artifacts, no token residue, no header drift.
- Enforce consistent punctuation/case hierarchy across all sections.

## Required Additions Beyond the 5
6. **Provenance / Source Trace**
- For critical metrics, include document-backed provenance (source file + mapped field/table context).

7. **Automated QA Gate**
- Fail report generation if quality checks fail:
- unresolved tokens
- mojibake characters
- prohibited empty shells in high-value sections
- required clean-fixture sections missing

## Execution Order
1. Decision Context Block (in progress now)
2. Top-driver reliability fallback
3. Cosmetics/typography normalization hardening
4. Provenance surfacing
5. QA gate with fixture-based checks
