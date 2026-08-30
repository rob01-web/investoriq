# InvestorIQ Phase 2 - Atomic Publication and Customer Delivery Authority

Date: 2026-08-30
Branch: `internal-phase2-atomic-publication-20260830`
Base: Phase 1 certified checkpoint `469f4e5caa19932a73e966f09982185f4d487dec`
Production `main` remains frozen at `b69d8dd3911449b82c94770d51f22302e47adcd9`.

## Governing publication rule

A report is customer-published only when all of the following agree:

1. governed job is `published`
2. complete `report_publication_receipt` exists
3. receipt, job, report, user, revision request and storage path have exact lineage
4. report is the one current revision for its family
5. generated PDF object exists with the receipt's exact Storage object id
6. final Report Quality Manifest and canonical delivery decision are bound to the same receipt

The `reports` table does not own publication status.

## Phase 2 implementation

- `finalize_worker_publication_v2` establishes final manifest, receipt, published job and current revision in one PostgreSQL transaction.
- Generic worker transitions are prohibited from setting `published`.
- The historical automatic revision-promotion trigger is removed so there is one explicit publication owner.
- `customer_published_report_projection` exposes only complete governed current reports whose Storage object exists.
- `admin_report_projection` derives publication state without inventing `reports.status` and preserves visibility of legacy/unpublished rows.
- legacy rows without governed receipt lineage are retained as archive-only/unpublished and never silently backfilled into customer publication.
- customer report listing and signed download use service-owned governed projections.
- direct authenticated/public Storage read policies specifically granting `generated_reports` reads are removed by the forward migration; signed download remains service-controlled.

## Local-only doctrine

The forward migration is committed to the internal branch but is not applied to production during the Vercel-preservation repair period. No production worker, DocRaptor production mode or public launch action is authorized by this phase alone.

## Exit gate

Phase 2 can be stamped CLOSED LOCALLY only after the guarded local handoff proves:

- focused Phase 2 contract smoke PASS
- JavaScript syntax checks PASS
- full local application build PASS
- worker uses `finalize_worker_publication_v2` and no longer publishes then promotes afterward
- Dashboard uses governed customer projection and no report-row status field
- Admin report inventory uses governed admin projection and no report-row status field
- report surface/revision helpers derive state from `publication_state`
- generated report download is governed by publication lineage
- `main` remains unchanged

Production failure injection and live receipt/object proof remain part of later integrated certification after the repair stack is intentionally applied.
