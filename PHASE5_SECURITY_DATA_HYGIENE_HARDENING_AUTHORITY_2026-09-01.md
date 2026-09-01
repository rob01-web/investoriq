# InvestorIQ Phase 5 Security, Data Hygiene and Operational Hardening Authority

**Date:** 2026-09-01  
**Status:** CLOSED LOCALLY AND CHECKPOINTED REMOTELY  
**Branch:** `internal-phase5-security-data-hardening-20260901`  
**Phase 4 base:** `5bd349998cb64d12b8990fd5ed9f6f11efc9b83c`  
**Certified Phase 5 code checkpoint:** `cb7e29e011e72077a5b5980ff212721bb818fa82`

## 1. Purpose

Phase 5 hardens InvestorIQ's customer data boundary, privileged database routines, launch-path database performance, legacy-data handling, and Storage hygiene without changing the customer product model or weakening the publication, worker, or commerce authorities established in Phases 1 through 4.

This phase is a forward hardening batch. It does not apply production migrations, deploy code, activate the scheduler, delete Storage objects, merge `main`, or alter the production release state.

## 2. Governing outcomes

Phase 5 establishes the following authority:

- Customer browser code must not directly expose or depend on raw internal pipeline state from `analysis_jobs`, `analysis_job_files`, `analysis_artifacts`, `report_purchases`, or `reports` where a governed customer projection or server boundary is required.
- Customer job status is served through an authenticated server boundary and exposes only deliberately safe customer fields.
- Customer entitlement balances are served through an authenticated server boundary rather than direct browser reads from raw purchase lineage.
- Administrative entitlement inspection, grant, and bounded revocation are server-owned and admin-authorized.
- Internal worker, database, and runtime details are not returned through customer job status.
- Privileged internal database helpers and triggers are restricted to the service role except for the intentionally authenticated report-admission RPC.
- Worker helper function search paths are fixed.
- Launch-path foreign-key indexes identified by the Phase 5 audit are added by forward migration.
- Selected RLS auth evaluation is hoisted without weakening ownership checks.
- Storage cleanup is classification-only until explicit deletion authority is established for a reviewed object class.
- Legacy reports remain retained and quarantined under the Phase 2 `legacy_archive_only` authority. They are not silently backfilled or deleted.

## 3. Customer boundary hardening

Phase 5 adds and uses `src/lib/customerBoundarySupabase.js` to intercept customer-facing access patterns that previously reached raw pipeline tables.

### Customer jobs

The customer jobs adapter routes owner-scoped job lookups through the existing `/api/customer-job-status` route using `surface=jobs` semantics. Query parameters are constructed with `URLSearchParams` rather than relying on literal query-string text.

The server boundary selects only:

- `id`
- `property_name`
- `report_type`
- `status`
- `created_at`
- `error_code`

The returned error code is sanitized through the customer-safe failure-code authority. `failure_reason` and `error_message` are explicitly returned as `null`, and internal worker ownership or runtime fields are not exposed.

### Customer entitlements

Customer entitlement balances route through `surface=entitlements` and expose only safe product identity/count information. Raw Stripe checkout lineage, purchase IDs, job lineage, and internal purchase metadata are not exposed to ordinary customers.

### Admin entitlements

Controlled administrative entitlement operations route through `surface=admin_entitlements`. The server verifies InvestorIQ admin authority before allowing exact entitlement inspection, bounded grant operations, or bounded revocation of eligible unconsumed entitlement IDs.

A normal authenticated customer cannot invoke the admin entitlement surface.

## 4. Existing route reuse and Vercel function count

Phase 5 intentionally does not add a new deployable API function.

`/api/customer-job-status` is rewritten by `vercel.json` into the existing legal-acceptance function with `customer_route=job_status`. The customer boundary handler then dispatches the requested customer surface.

This preserves the existing function topology and does not worsen the inherited Vercel Hobby function-budget gate.

## 5. Forward database hardening migration

Forward migration:

`supabase/migrations/20260901100000_phase5_security_data_hygiene_hardening.sql`

The migration prepares the following changes for the governed production activation sequence:

### Raw table browser privilege closure

Direct browser privileges are revoked from:

- `analysis_jobs`
- `analysis_job_files`
- `analysis_artifacts`
- `report_purchases`
- `reports`

Service-role operation is preserved.

### Intentional authenticated admission exception

`consume_purchase_and_create_job(text, jsonb, jsonb)` remains executable by `authenticated` and `service_role`. This is deliberate because it is the governed authenticated report-admission boundary established by earlier phases.

### Privileged helper and trigger closure

Internal helper and trigger routines identified by the Phase 5 audit are removed from public, anonymous, and ordinary authenticated RPC exposure and retained for service-role use.

### Fixed search paths

The worker helper functions `worker_lease_duration()` and `worker_max_attempt_count()` receive fixed search paths.

### Launch-path indexes

The migration adds the identified launch-path foreign-key indexes, including:

- `analysis_job_admission_receipts_purchase_id_idx`
- `analysis_job_events_job_id_idx`
- `analysis_jobs_admission_receipt_id_idx`
- `analysis_jobs_recovery_episode_id_idx`
- `property_files_property_id_idx`
- `property_files_user_id_idx`
- `report_issues_artifact_id_idx`
- `report_publication_receipts_delivery_gate_artifact_id_idx`
- `report_publication_receipts_manifest_artifact_id_idx`
- `report_purchases_job_id_idx`
- `worker_recovery_episodes_purchase_id_idx`
- `worker_stage_checkpoints_recovery_episode_id_idx`

### RLS optimization

Selected RLS policies hoist repeated `auth.uid()` evaluation through `select auth.uid()` while preserving the existing owner-bound comparisons.

## 6. Storage hygiene authority

The Phase 5 production inspection was read-only. It found material volumes of Storage objects that do not have obvious current report/publication registration, but the inspection also proved that unreferenced does not mean disposable.

Observed read-only classification snapshot:

- approximately 2,014 staged objects without current registration
- approximately 2,266 generated objects without current report/publication references
- approximately 1,755 of those generated objects are under analysis-job paths and include internal pipeline artifacts such as extracted or structured intermediate data

Because many apparently unreferenced objects are legitimate pipeline internals or legacy evidence, Phase 5 explicitly forbids automatic deletion based only on missing current lineage.

The migration establishes `storage_object_hygiene_inventory_v1` and classification categories including:

- `registered_source`
- `governed_report_artifact`
- `pipeline_internal_artifact`
- `legacy_pdf_candidate_review`
- `staged_cleanup_candidate_review`
- `unknown_preserve`

Every classified object remains:

`deletion_authorized = false`

Phase 5 contains no `delete from storage.objects`, bucket-emptying operation, or automatic Storage removal routine.

Any future cleanup must be a separately reviewed and explicitly authorized operation based on evidence, retention requirements, and current publication/source lineage.

## 7. Legacy report authority

Phase 5 preserves the Phase 2 legacy policy:

- legacy reports without governed publication lineage remain retained
- they remain outside the governed current publication surface
- they are not auto-backfilled
- they are not deleted merely because they predate the governed publication model

## 8. Certification evidence

### Canonical launch QA

The completed launch QA run produced:

- 18 of 19 checks PASS
- the only failure is the inherited Vercel Hobby deployable-function budget sentinel: 15 deployable functions versus the configured certification limit of 12

This gate predates Phase 5. Phase 5 adds no new deployable function.

### Phase 5 contract certification

`tests/qa/phase5-security-data-hygiene-contract-smoke.js`

Result: **PASS**

The initial static assertion expected literal strings such as `surface=jobs`. The real implementation correctly constructs the same query parameter using `URLSearchParams`. The stale assertion was repaired without changing product code or runtime behavior. The final test verifies the actual code construction pattern and the server-side contract.

### Phase 5 runtime customer-boundary certification

`tests/qa/phase5-customer-boundary-runtime-smoke.js`

Result: **PASS**

The runtime smoke proves:

- owner-scoped job projection
- sanitized customer failure fields
- no exposure of worker/runtime ownership details
- safe entitlement projection
- no exposure of Stripe session lineage to customers
- normal customer denial from the admin entitlement surface
- authorized admin entitlement inspection
- bounded admin grant and revocation behavior

### Production build

`npm run build`

Result: **PASS**

Vite completed the production build successfully. Non-gating warnings remain for stale browser-data metadata and a JavaScript chunk larger than 500 kB after minification. These warnings do not invalidate the Phase 5 security/data-hygiene closure and should be handled only through a separately governed optimization batch if desired.

### Repository hygiene

- exact certified code SHA verified
- repair scope verified as test-only for the final contract-assertion repair
- `git diff --check` PASS
- certification worktree clean after tests/build

## 9. Certified checkpoint and closure state

Certified Phase 5 code checkpoint:

`cb7e29e011e72077a5b5980ff212721bb818fa82`

At this checkpoint:

- Phase 5 security/data-hygiene contract: PASS
- Phase 5 customer-boundary runtime: PASS
- production build: PASS
- repository hygiene: PASS
- canonical launch QA: 18/19, with only the inherited 15/12 Vercel function-budget gate remaining

Phase 5 is therefore **CLOSED LOCALLY AND CHECKPOINTED REMOTELY**, with the inherited Vercel function-budget gate carried forward as a deployment-planning blocker rather than a Phase 5 regression.

## 10. Production state remains intentionally unchanged

Phase 5 closure does not mean production activation.

As of this authority checkpoint:

- no Phase 5 migration has been applied to production
- no Phase 1 through Phase 5 recovery migration has been applied as part of this phase closure
- no Phase 5 code has been deployed to production
- production `main` has not been merged or changed by Phase 5
- the scheduler remains inactive
- no Storage object has been deleted
- no production database row has been mutated by the Phase 5 inspection/certification work

Production certification for this hardening remains pending until the governed activation sequence is explicitly authorized.

## 11. Forward activation constraint

Do not deploy this branch before the governed production activation plan is ready.

The activation plan must account for:

1. the required Phase 1 through Phase 5 forward migrations in timestamp order
2. the inherited Vercel Hobby 15/12 function-budget deployment gate
3. environment authority already prepared for Phase 4 commerce
4. deliberate code deployment only after the required database state exists
5. post-deployment production certification of admission, worker, publication, commerce, customer-boundary, and security behavior
6. scheduler activation only under its own explicit production gate

No part of this document authorizes deployment, migration application, scheduler activation, Storage deletion, or merge to production `main`.
