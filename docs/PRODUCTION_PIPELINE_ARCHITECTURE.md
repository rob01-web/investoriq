# InvestorIQ Production Pipeline Architecture

**Status:** Current architecture authority
**Date:** 2026-08-18


## September 8, 2026 admission authority clarification

Customer admission is strict and is separate from downstream source-survivor modes:

- **Screening:** both a usable T12 / operating statement and a usable Rent Roll are required. Screening admits no supporting or additional due-diligence documents.
- **Underwriting:** both a usable T12 / operating statement and a usable Rent Roll are required, plus at least one additional readable supporting due-diligence document.
- `t12_minimum_core` and `rent_roll_minimum_core` remain valid only as downstream source-truth / publication-survivability states after valid admission. They do not authorize customer intake with one core document.

This clarification controls the current admission boundary wherever older architecture notes, migrations, or tests conflict.

## Constitutional chain

`authenticated customer`
→ `governed disclosure acknowledgement`
→ `immutable staged source bytes`
→ `transactional entitlement + job admission`
→ `trusted job provenance`
→ `bounded worker lifecycle`
→ `trusted extraction / parsing evidence`
→ `canonical source truth`
→ `canonical publication obligation`
→ `product-specific construction`
→ `canonical delivery decision`
→ `single publication authority`
→ `certified PDF + immutable generated artifact`
→ `report + Quality Manifest + publication receipt`
→ `job published`
→ `lineage-fenced current-revision promotion`
→ `customer-visible current report`
→ `signed download`

## Product authority

Current launch products are **Screening** and **Full Underwriting**. Bundle is commerce only. Premium is future-only and OFF.

Full Underwriting admission is strict: usable T12 + usable Rent Roll + at least one additional readable/adjudicable support document. After admission, downstream Core-Gated Publish-or-Collapse applies.

Canonical downstream source modes:

- `dual_source_core`
- `t12_minimum_core`
- `rent_roll_minimum_core`
- `insufficient_core`

The first three are publish-capable. Optional/support weakness must qualify, compact, collapse, omit, or create a quality incident rather than independently destroy a valid-core report.

## Current code authority boundaries

- Public report API wrapper: `api/generate-client-report.js`
- Handler layer: `api/_lib/generate-client-report-handler.js`
- Report implementation authority: `api/_lib/generate-client-report-impl.js`
- Full Underwriting current construction boundary: `api/_lib/full-underwriting-pipeline.js`
- Delivery-output / compatibility projection: `api/_lib/report-delivery-output.js`
- Worker orchestration: `api/admin-run-worker.js`
- Canonical local launch-regression runner: `tests/qa/run-all.js` (supporting evidence only)

Historical Acquisition-named modules may remain only where they are reusable lower-level implementation components or legacy fixtures. They do not define current product identity, source truth, delivery authority, or launch certification.
