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

## Launch-Critical Execution Plan (Monday/Tuesday)
### Scope Lock (Must Ship)
1. Eliminate mojibake in Dashboard + report output paths.
2. Normalize report visual system to navy/gold/teal with muted neutrals (remove bright red/green/blue emphasis).
3. Preserve deterministic fail-closed behavior (no empty shells, no contradictory labels).
4. Keep underwriting focused on capital constraints and breakpoints; do not duplicate screening narrative.

### 72-Hour Delivery Sequence
1. Encoding cleanup pass:
- `src/pages/Dashboard.jsx`
- `api/generate-client-report.js`
- remove corrupted user-facing literals and ensure sanitizer is deterministic.
2. Institutional visual pass:
- `api/report-template-runtime.html`
- chart and signal colors mapped to navy/gold/teal + neutral grayscale.
3. Underwriting decision density pass:
- `api/generate-client-report.js`
- breakpoint table clarity, binding-constraint clarity, deterministic primary breakpoint line.
4. Screening decision clarity pass:
- `api/generate-client-report.js`
- pressure point + decision context + mini stress grid consistency.
5. Final regression:
- golden fixture render set
- verify no token residue, no mojibake, no blank sections.

### Commercial Framing Targets
1. Screening:
- Price: `$299`
- Perceived value target: `$2,999`
- Positioning: "Should I allocate attention?"
2. Underwriting:
- Price: `$999`
- Perceived value target: `$9,999`
- Positioning: "If I allocate capital, where does it break?"

## Change Control Protocol (Mandatory)
1. One file at a time.
2. Minimal in-place edits only.
3. As few steps as possible per patch.
4. Commit after each discrete fix.
5. Run a targeted test immediately after each commit to confirm:
- the intended fix is applied
- no unrelated behavior regressed.
6. No sweeping multi-file changes in one pass.
7. If a patch causes side effects, stop, revert only that patch, and re-apply with a narrower anchor.
