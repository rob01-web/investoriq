# InvestorIQ E2E Break-Test Harness

Local deterministic harness for report-output and source-level regression checks. It is designed to run without secrets by default and to avoid live Supabase, Stripe, DocRaptor, or credit side effects.

## Run

```bash
npm run test:e2e
```

The runner prints:

```text
Test Name | Mode | Expected | Actual | Result | Notes
```

It also writes:

```text
tests/e2e/results/latest-e2e-results.json
```

## Report/PDF Text Checks

After regenerating a report, pass one or more HTML/TXT/PDF paths:

```bash
node tests/e2e/run-e2e.js --report "path/to/report.pdf"
```

For constrained underwriting reports:

```bash
node tests/e2e/run-e2e.js --profile underwriting-dscr-constrained --report "path/to/report.pdf"
```

Multiple reports can also be provided with `E2E_REPORT_PATHS`, using the platform path delimiter.

## Wave 2 Mock Lifecycle Checks

Wave 2 uses seeded JSON fixtures only. It does not call Supabase, DocRaptor, Stripe, email, storage, or credit systems.

Run all Wave 2 scenarios:

```bash
node tests/e2e/run-e2e.js --profile wave2
```

Run one scenario:

```bash
node tests/e2e/run-e2e.js --profile missing-rent-roll
node tests/e2e/run-e2e.js --profile missing-t12
node tests/e2e/run-e2e.js --profile unsupported-capex-only
node tests/e2e/run-e2e.js --profile scale-mismatch
node tests/e2e/run-e2e.js --profile partial-rent-roll-sample
node tests/e2e/run-e2e.js --profile incomplete-debt
```

## Wave 3 Worker-State Checks

Wave 3 uses a local fake Supabase state object plus a pure worker-state simulator. It validates terminal job status, transition markers, reports row creation/absence, entitlement restoration markers, artifacts, and file parse diagnostics without calling live services.

Run all Wave 3 scenarios:

```bash
node tests/e2e/run-e2e.js --profile wave3-worker-state
```

## Wave 4 Parser Adversarial Checks

Wave 4 uses local parser fixtures and test-only parser contract checks. It directly exercises the exported T12 table helper where available and validates adversarial text contracts for internal parser paths without calling live services.

```bash
node tests/e2e/run-e2e.js --profile wave4-parser-adversarial
```

## Current Coverage

- Static source/template checks for recently hardened public copy.
- Wave 1 break-test source/fixture checks for missing required document gates, structured artifact gates, T12/rent-roll scale mismatch, partial rent roll suppression, unsupported CapEx restraint, market survey restraint, scoped loan-rate parsing, and incomplete-debt DSCR restraint.
- Wave 2 mock lifecycle checks for seeded job status, error/failure reason, report row presence/absence, artifact presence/absence, and public-output suppression rules.
- Wave 3 local worker-state simulation for happy-path publishing, missing required docs, missing structured artifacts, scale mismatch, and incomplete-debt publishing without DSCR.
- Wave 4 parser adversarial fixtures for rate collisions, tax-year collisions, glued T12 values, malformed/partial rent rolls, and unsupported CapEx prose.
- Report text assertions for regenerated HTML/TXT/PDF outputs.
- Fixture package inventory for local packages such as `Final_Testing/`.
- Parser hardening source checks for generic fixed-rate loan terms and property-tax year rejection.
- Safe skips for live job outcome tests until a seeded test-account contract exists.

## Not Covered Yet

- Creating live Supabase jobs.
- Uploading fixture files through Dashboard flows.
- DocRaptor PDF generation.
- Credit/entitlement restoration assertions.
- Database `analysis_jobs` / `reports` row assertions.

Those are intentionally skipped unless a live E2E contract is added, because the harness must not burn credits, send emails, or create customer-visible reports by default.
