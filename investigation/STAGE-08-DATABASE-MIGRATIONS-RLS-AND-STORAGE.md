# Stage 08: Database Migrations, RLS, Storage, and F-009

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only. No production patch, merge, deploy, environment change, customer-data change, credit/job mutation, migration execution, or live RETEST.

## Files inspected

Active migrations: `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql`, `20260213XXXXXX_queue_job_for_processing.sql`, `20260214_0930_queue_job_for_processing.sql`, `20260216_0001_claim_and_consume_job.sql`, `20260302_0001_allow_multiple_files_per_doc_type.sql`, `20260328_0001_sync_rls_policies_for_analysis_and_reports.sql`.

Database-facing runtime: `api/webhook.js`, `api/create-checkout-session.js`, `api/checkout-session.js`, `api/legal-acceptance.js`, `api/admin-run-worker.js`, `api/admin/run-eligible-jobs-once.js`, `api/parse/extract-job-text.js`, `api/parse/parse-doc.js`, `api/parse/classify-documents.js`, `api/jobs/request-revision.js`, `api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js`, `api/_lib/report-delivery-output.js`, `PIPELINE_MAP.md`, and the `api/_lib` Supabase/storage callers enumerated during this stage.

## Migration and schema authority

The repository contains six active migrations and no base table-creation migration for `profiles`, `report_purchases`, `stripe_events`, `analysis_jobs`, `analysis_job_files`, `analysis_artifacts`, `analysis_job_events`, `reports`, `legal_acceptances`, or storage-object policies. Therefore the repository proves function bodies and policy deltas, but does **not** prove the deployed base schema, foreign keys, unique indexes, check constraints, trigger set, storage bucket definitions, or migration history preceding these files. Any launch claim that these are enforced in production is unproven until the live schema is separately inspected.

| Contract | Owning migration/runtime authority | Proven contract | Transaction / partial-success risk |
|---|---|---|---|
| Purchase -> entitlement | `api/webhook.js`; `report_purchases` assumed pre-existing | Stripe event insert, purchase lookup, then purchase insert are separate calls; quantity is expanded into synthetic `session#N` IDs | Event marker can persist while entitlement insert fails; retry then follows a compensating read path. |
| Entitlement -> job | `20260210100140_consume_purchase_and_create_job.sql` | `auth.uid()` selects one unconsumed purchase with `FOR UPDATE SKIP LOCKED`, inserts job/files, then marks purchase consumed; all statements are inside one PL/pgSQL function transaction | Atomic if the function exists with the assumed columns/constraints. It trusts client-supplied user-independent payload fields and filename fallback classification. |
| Queue | `20260214_0930_queue_job_for_processing.sql`; prior `20260213XXXXXX` is only a placeholder | Authenticated owner check, required doc-type presence, `queued`/legacy `needs_documents` acceptance, status update, then event insert | Status can update while event insert fails. The placeholder migration cannot recreate the function. |
| Claim / lease | `20260216_0001_claim_and_consume_job.sql`; legacy `claim_next_job` caller in `api/admin/run-eligible-jobs-once.js` | `claim_and_consume_job` conditionally changes `queued` to `extracting`; no owner, lease expiry, fencing token, heartbeat, attempt cap, or user predicate | Claim is atomic only for the status update. Work ownership and recovery are not durable. A second active caller remains reachable through `claim_next_job`. |
| Processing/status | `api/admin-run-worker.js` | Direct conditional updates implement extracting -> underwriting -> scoring -> rendering -> pdf_generating -> publishing -> published, plus failed | No DB status check constraint or transition trigger is present in the repository. Each status and its event/artifacts are separate writes. |
| Parsed artifacts | `api/parse/extract-job-text.js`, `api/parse/parse-doc.js` | Service-role writes `analysis_artifacts`, then updates `analysis_job_files.parse_status`; object paths are convention-only | Artifact/status mismatch is possible; duplicate artifacts are possible; no unique `(job_id,type,file_id,version)` contract is shown. |
| Publication/history | `api/generate-client-report.js`, worker, `api/_lib/report-delivery-output.js` | Report PDF uses `generated_reports`; reports/history rows are resolved and written outside a single job transaction | Existing-report lookup is heuristic by user/property/type/time; duplicate publication and report/job divergence remain possible. |
| Failure/restore | `api/admin-run-worker.js` | Marks job failed, then restores purchase by clearing `consumed_at`/`job_id`, then writes an entitlement-restored artifact | Failure status, credit restoration, and evidence are non-transactional; restoration is explicitly best-effort in several paths. |
| Premium receipt | `api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js` | Reads up to two receipts, rejects if multiple, otherwise inserts one artifact; service-role caller | No unique constraint or atomic insert-if-absent is shown. Two workers can both observe none and insert receipts. |
| Legal acceptance | `api/legal-acceptance.js` | Uses service role and caller-supplied `userId` and `policyTextHash`; server constants fix policy key/version but not the actor | GET and POST are not bound to the authenticated request actor. Duplicate response fabricates current time instead of returning stored `accepted_at`. |

## RLS and service-role boundary

Migration `20260328_0001_sync_rls_policies_for_analysis_and_reports.sql` enables RLS and explicitly leaves `FORCE ROW LEVEL SECURITY` disabled on `analysis_jobs`, `analysis_job_files`, `analysis_artifacts`, and `reports`. It creates owner-based authenticated select/insert policies, plus duplicate policies granted to `public` on some tables whose predicates still depend on `auth.uid()`. No policies for `report_purchases`, `stripe_events`, `legal_acceptances`, `analysis_job_events`, `profiles`, or storage objects are present in the active migration set.

Authenticated-user reads are owner-scoped where policies exist. Service-role clients used by webhook, worker, parser, report generation, and admin routes bypass RLS, so route-level authorization is the effective tenant boundary. The worker and parser require admin credentials or an admin email, but several service-role paths accept a job ID and rely on the caller already being privileged. The repository does not prove storage bucket/object policies for `staged_uploads`, `internal`, or `generated_reports`; storage isolation is therefore unproven from source.

## Database authority map

`Stripe checkout metadata` -> `stripe_events` idempotency marker -> `report_purchases` entitlement rows -> `consume_purchase_and_create_job(auth.uid())` -> `analysis_jobs` + `analysis_job_files` -> `queue_job_for_processing` -> `claim_and_consume_job` or legacy `claim_next_job` -> worker status transitions -> parser artifacts and file parse status -> Source Truth/report artifacts -> report PDF/object -> `reports` history -> `published` status.

Failure branch: worker terminal update -> purchase lookup -> `report_purchases.consumed_at = null, job_id = null` -> entitlement-restored artifact -> failed job remains in history if the initial status update succeeded. These are not one transaction. A restoration error can leave a failed job with consumed entitlement; a late worker error can leave a published object with unreconciled job/credit state.

## F-009 resolution

**F-009 remains PROVEN.** The authoritative purchase-completion path is `api/webhook.js`, not a database RPC. Its `stripe_events` insert is a separate idempotency marker, followed by a read of expected purchase session IDs and a separate `report_purchases.insert`. The duplicate-event branch can continue when the event marker exists but entitlement rows are incomplete, and the final entitlement insert is not coupled atomically to the marker. The `report_purchases` uniqueness contract is not established by any active migration, so duplicate prevention depends on an unproven deployed index plus application reads. The `20260210100140` RPC is authoritative only for consuming an already-created entitlement and creating a job; it does not fix webhook completion idempotency. Remediation boundary: one database-owned idempotent purchase-completion operation keyed by Stripe event/session identity, with an explicit unique contract and atomic entitlement creation, then runtime callers reduced to that authority. No remediation was applied.

## F-001 / F-002 database contribution

`api/checkout-session.js` returns Stripe metadata, including `userId`, without authentication or ownership binding. The database is not involved in that read, so the remediation boundary begins at route authorization and response minimization, not RLS.

`api/legal-acceptance.js` uses a service-role client for both GET and POST and accepts arbitrary `userId` plus client-supplied `policyTextHash`. RLS cannot protect these calls because service role bypasses it. The exact boundary is authenticated actor binding (`userId = auth.uid()` or an equivalent server-derived identity), canonical server-side policy hash, and owner-scoped reads before the service-role write. No policy migration can compensate for the current service-role route behavior.

## Additional proven findings

### F-061 - BLOCKER - Active migrations do not establish the base schema or storage/RLS authority needed by runtime

Only function/policy deltas are present. The repository cannot prove keys, foreign keys, status constraints, legal/purchase uniqueness, triggers, bucket policies, or compatibility of the deployed schema with current callers. A production schema may contain them, but that is outside this repository evidence and must not be treated as proven.

### F-062 - HIGH - Purchase completion idempotency is split across marker, lookup, and insert operations

`webhook.js` writes `stripe_events`, reads existing purchase rows, and inserts missing rows separately. There is no active migration proving a unique purchase key. A marker can commit without entitlements, and a retry can race another retry.

### F-063 - HIGH - Legacy and current claim authorities remain simultaneously reachable

The current worker calls `claim_and_consume_job`, while `api/admin/run-eligible-jobs-once.js` calls `claim_next_job`. The repository has no active migration defining `claim_next_job`, its return shape, ownership, or lease semantics. Migration ordering can leave an old RPC callable beside the newer RPC.

### F-064 - HIGH - Publication and report history are not transactionally bound to the job terminal state

PDF/object persistence, report-row resolution, job status publication, quality-manifest artifacts, and credit reconciliation occur in separate calls. Heuristic existing-report lookup plus non-unique artifact paths leaves duplicate publication and object/history divergence possible.

### F-065 - HIGH - Premium job-start receipt persistence is read-then-write without a database uniqueness guard

The receipt helper rejects multiple rows after reading, but no unique constraint or atomic insert-if-absent contract is shown. Concurrent worker lanes can create competing surface assignments.

## Finding statuses carried forward

F-001 and F-002 remain `PROVEN` and `BLOCKER`. F-009 remains `PROVEN` and `MEDIUM`, with its database authority explicitly resolved above. F-012, F-013, F-014, F-018, F-023, F-031, F-041, F-049, and F-050 remain unchanged; Stage 8 adds database evidence and does not clear any prior finding.

## Stage conclusion

The database layer is not launch-proven from the repository. The preliminary V2/base Underwriting lane remains the only candidate lane, but Stage 8 adds a schema-authority blocker and preserves the existing core/identity/worker blockers. Next stage is frontend and active customer-surface inspection.
