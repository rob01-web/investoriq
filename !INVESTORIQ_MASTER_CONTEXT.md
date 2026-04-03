# InvestorIQ Master Context — April 2026

## 1. Current Product State
- InvestorIQ is in final launch hardening.
- Screening report is materially compressed, document-driven, and positioned as a decision-grade screening memorandum.
- Underwriting report retains full debt, refinance, valuation, and scenario depth with deterministic inputs only.
- Website positioning, pricing copy, contact routing, and core report wording have been materially tightened for launch.
- Launch phase status: final QA and sample-output replacement remain before outreach.

## 2. Locked Product Positioning
- InvestorIQ is a document-driven real estate decision engine for investors.
- Every conclusion must be traceable to uploaded documents.
- No BUY/SELL language.
- No speculation.
- No fabricated narrative.
- Deterministic math only.
- Fail closed when required inputs are missing.

## 3. Current Pricing
- Screening Report: $399
- Underwriting Report: $1,499
- One purchase = one report.
- No subscription.

## 4. Core System Architecture
- Node-based backend/API layer drives parsing, report generation, admin actions, and payment flow.
- Supabase is the system of record for auth, database tables, storage, and generated report artifacts.
- Stripe handles checkout and report purchase entitlements.
- DocRaptor renders final HTML into production PDFs.
- Textract plus `pdf-parse` handle document text extraction and fallback parsing paths.
- Report generation is deterministic first, with narrative assembly layered on top of structured artifacts and computed outputs.

## 5. Current Report Rules
- Screening and Underwriting are separate report products, not layered versions of the same memo.
- Screening is a concise acquisition screening memorandum built primarily from T12 and rent roll inputs.
- Underwriting is the full capital-risk report with debt structure, refinance capacity, valuation, and scenario depth when supporting documents exist.
- One-and-done entitlement rule applies unless regeneration is triggered for system/support reasons.
- Narrative must be document-derived and supportable from parsed inputs.
- No fabricated data, no silent fallback assumptions, and no decorative filler sections.

## 6. Current Engine State
- Worker loop, extraction reuse, and parallel execution have been validated previously.
- Screening vs underwriting separation has been materially improved.
- Wrong report-type leakage in the executive summary was fixed and hardened.
- Screening compression removed valuation and refinance depth that belonged only in underwriting.
- Report wording across generator, runtime template, and PDF sections was tightened toward institutional, document-driven language.
- Public-facing contact routing has been migrated away from `hello@investoriq.tech` to department addresses.
- Dashboard disclosure acceptance timestamp now reads from stored acceptance data.
- Dashboard auto-refresh polling has been removed in favor of manual refresh/reload actions.
- Analysis Scope Preview has been removed from the user dashboard UI.

## 7. Current Remaining Issues / Immediate Next Work
### Completed recent fixes
- Dashboard disclosure accepted date/time fix: completed.
- Dashboard auto-refresh removal: completed.
- Analysis Scope Preview removal: completed.
- Active Jobs filtering and property-name fallback: completed.
- Report History `report_type` population for newly generated reports: completed.
- Admin issue / regen workflow wiring: completed.
- Cover-page REPORT TIER visibility/color fix: completed.
- Underwriting support-doc detection for page-13 coverage messaging: completed.

### Real current punch list
- Run one fresh production-grade Screening PDF and one fresh production-grade Underwriting PDF.
- Perform final manual QA on both outputs:
  - report type labels
  - executive summary wording
  - no wrong-report references
  - no AI-sounding or padded phrasing
  - no mojibake or typography regressions
  - no unsupported narrative claims
- Replace homepage sample reports with final production-grade outputs.
- Do one final website pass for any remaining user-facing copy or workflow rough edges.
- Prepare Ken Dunn outreach only after final report QA and sample replacement are complete.

## 8. Key Files
- `api/generate-client-report.js`
- `api/report-template-runtime.html`
- `src/lib/pdfSections.js`
- `src/pages/Dashboard.jsx`
- `src/pages/AdminDashboard.jsx`
- `api/admin/queue-metrics.js`
- `api/admin/run-eligible-jobs-once.js`
- `api/legal-acceptance.js`
- `api/admin-run-worker.js`
- `src/pages/Pricing.jsx`

## 9. Working Style / Patch Rules
- Anchor-locked patches only when possible.
- No refactors unless explicitly approved.
- Minimal diffs only.
- Fail on anchor mismatch rather than guessing.
- Deterministic changes only.
- Preserve institutional tone and document-driven logic.

## 10. Launch Readiness Snapshot
- Launch-ready now:
  - pricing and positioning are aligned
  - screening vs underwriting separation is materially cleaner
  - contact routing is corrected
  - dashboard/admin support workflow is operational
  - core report engine is stable enough for final launch QA
- Still needed before Ken Dunn outreach:
  - fresh final Screening and Underwriting PDFs
  - final manual QA pass
  - homepage sample report replacement
