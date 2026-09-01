# InvestorIQ Local Regression and Lifecycle Simulation Harness

This directory contains deterministic local regression helpers. Despite the historical `e2e` directory name, these checks are **not production end-to-end certification** and must never be presented as proof that a real customer purchase, upload, worker run, publication, listing, or download succeeded.

The default harness is intentionally secret-free and avoids live Supabase, Stripe, DocRaptor, email, Storage mutations, credit consumption, and customer-visible report creation.

## Run the legacy local regression harness

```bash
npm run test:e2e
```

The historical runner prints:

```text
Test Name | Mode | Expected | Actual | Result | Notes
```

It also writes:

```text
tests/e2e/results/latest-e2e-results.json
```

That JSON is local regression evidence only. It is not a production lifecycle receipt.

## Phase 6 lifecycle certification authority

The forward lifecycle contract is certified by:

```bash
node tests/qa/phase6-lifecycle-certification-contract-smoke.js
```

The Phase 6 smoke binds the local simulator to the governing Phase 1 through Phase 3 contracts and verifies:

- `dual_source_core`, `t12_minimum_core`, and `rent_roll_minimum_core` survival
- hard failure only when no usable T12 or Rent Roll core artifact remains in the simulated worker state
- cross-source scale mismatch only when both core sources survived
- `reports` rows as revision/storage metadata, not publication-state authority
- one simulated `finalize_worker_publication_v2` publication boundary
- complete publication receipt lineage
- current-revision promotion only through atomic finalization
- idempotent replay after a committed publication
- owner-bound customer listing through `customer_published_report_projection`
- owner-bound signed download through the governed generated-report projection

The simulator is still a simulator. Passing Phase 6 local certification proves contract alignment, not live infrastructure behavior. Production certification remains a separate gated operation after migrations and deployment are explicitly authorized.

## Report/PDF text checks

After regenerating a report locally, pass one or more HTML/TXT/PDF paths:

```bash
node tests/e2e/run-e2e.js --report "path/to/report.pdf"
```

For constrained underwriting reports:

```bash
node tests/e2e/run-e2e.js --profile underwriting-dscr-constrained --report "path/to/report.pdf"
```

Multiple reports can also be provided with `E2E_REPORT_PATHS`, using the platform path delimiter.

## Wave 2 mock lifecycle checks

Wave 2 uses seeded JSON fixtures only. It does not call Supabase, DocRaptor, Stripe, email, Storage, or entitlement systems. It is historical fixture regression coverage and is not forward lifecycle authority.

Run all Wave 2 scenarios:

```bash
node tests/e2e/run-e2e.js --profile wave2
```

## Wave 3 worker-state simulation

Wave 3 uses a local fake Supabase state object plus a pure worker-state simulator. Phase 6 corrected this simulator so one-core survival follows the current Phase 1 authority and report publication is no longer invented by assigning a `published` status to a report row.

The simulator now models publication as:

```text
usable core -> report revision metadata -> generated object -> canonical delivery decision -> publishing -> finalize_worker_publication_v2 simulation -> complete publication receipt -> current revision -> published job
```

Run all Wave 3 scenarios:

```bash
node tests/e2e/run-e2e.js --profile wave3-worker-state
```

Important historical profile names are retained for compatibility:

- `missing-rent-roll` now proves T12-only minimum-core survival
- `missing-t12` now proves Rent-Roll-only minimum-core survival

Those names no longer mean that the missing counterpart is a publication blocker.

## Wave 4 parser adversarial checks

Wave 4 uses local parser fixtures and test-only parser contract checks. It validates adversarial text contracts without calling live services.

```bash
node tests/e2e/run-e2e.js --profile wave4-parser-adversarial
```

## What these local checks cover

- Static source and template regressions.
- Seeded lifecycle fixture behavior.
- Corrected local worker-state simulation.
- Parser adversarial fixtures.
- Report text assertions for regenerated local artifacts.
- Fixture package inventory.
- Contract-level publication lineage through the dedicated Phase 6 smoke.

## What is intentionally not certified here

- A real Stripe checkout and webhook grant.
- A real customer browser upload.
- A production admission database transaction.
- A production worker claim and lease.
- Production DocRaptor PDF generation.
- Production Storage object creation.
- Production `analysis_jobs`, `reports`, receipt, or revision mutations.
- Production customer report listing or signed download.
- Production entitlement restoration.

Those behaviors require the separately authorized production activation and certification sequence. Local simulations must never be used as a substitute for that evidence.
