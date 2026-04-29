# Final Testing Fixtures

All properties in this folder are fictional. These fixtures are for pre-launch QA only.

## Purpose
This folder contains mixed-format synthetic upload packages for final InvestorIQ validation. Each package is intentionally small enough to inspect manually and is designed to stress one specific bug class or report path.

## Binary-format note
Where true `.pdf`, `.docx`, or `.xlsx` files are not created directly in-repo, a clean source file is provided together with exact manual export instructions. This avoids production dependency changes while still giving a repeatable QA package.

## Upload instructions
1. Use one package at a time.
2. Upload the files in the package folder only.
3. If a package includes a `MANUAL_EXPORT.md`, export the noted source files to the requested binary format before uploading.
4. Match the intended report type listed below.
5. Record whether the result is publish / fail-closed, and whether any unsupported file was acknowledged correctly.

## Packages

### Property 01 - Clean Screening
- Intended report type: Screening
- Files included: T12 CSV, rent roll source for XLSX, rent roll mirror CSV
- Expected behavior: publish cleanly; no underwriting-only debt/refi sections
- Bug class stressed: clean screening separation and baseline math

### Property 02 - Clean Underwriting
- Intended report type: Underwriting
- Files included: T12 source for XLSX, rent roll CSV, loan terms source for PDF, property tax source for PDF, valuation source for DOCX
- Expected behavior: publish cleanly with debt, DSCR, valuation, cap-rate, and scenario sections where supported
- Bug class stressed: clean underwriting with structured support docs

### Property 03 - Messy Underwriting
- Intended report type: Underwriting
- Files included: OCR-style T12 text, messy rent roll source for XLSX, lender-style debt terms text, broker email text
- Expected behavior: use only defensible values; fail closed on unclear inputs
- Bug class stressed: messy extraction and document-driven restraint

### Property 04 - Partial Rent Roll With Summary
- Intended report type: Screening and Underwriting
- Files included: T12 CSV, partial rent roll source for XLSX with explicit totals row, broker note text
- Expected behavior: explicit totals may be used; detail-row full-property distribution stays suppressed
- Bug class stressed: partial-sample summary totals doctrine

### Property 05 - Missing Rent Roll
- Intended report type: Screening and Underwriting
- Files included: T12 CSV, broker note text, no rent roll
- Expected behavior: fail closed and do not publish a defensible report
- Bug class stressed: required-document gating

### Property 06 - Unsupported CapEx Only
- Intended report type: Underwriting
- Files included: T12 CSV, rent roll source for XLSX, renovation narrative source for DOCX
- Expected behavior: uploaded CapEx file acknowledged if uploaded; no invented budget, ROI, payback, rent lift, or modeled CapEx
- Bug class stressed: uploaded-but-unstructured CapEx disclosure

### Property 07 - Conflicting Documents
- Intended report type: Underwriting
- Files included: T12 source for XLSX, rent roll CSV, loan terms source, broker note with conflicting rate/cap-rate
- Expected behavior: no blended or invented values; fail closed or prefer established structured source hierarchy
- Bug class stressed: source conflict handling

### Property 08 - Glued Number T12
- Intended report type: Screening and Underwriting
- Files included: OCR-style T12 text with dollar-plus-percent lines, rent roll CSV
- Expected behavior: parser must not concatenate percent fields into dollar values
- Bug class stressed: numeric corruption regression

### Property 09 - Overcomplete Underwriting
- Intended report type: Underwriting
- Files included: T12 source for XLSX, rent roll source for XLSX, loan terms source, appraisal source, property tax source, insurance quote source, broker email, CapEx notes source
- Expected behavior: recognized structured inputs used; unsupported files acknowledged or excluded without fabricated modeling
- Bug class stressed: heavy upload package stability and disclosure discipline
