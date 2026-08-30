# Phase 3 Worker, Renderer, Runtime and Recovery Authority

**Date:** 2026-08-30  
**Branch:** `internal-phase3-worker-runtime-recovery-20260830`  
**Base:** Phase 2 commit `e534a41721d39dfdc19dd40a28056ff23511dabe`

## Scope and freeze

This contract closes the local Phase 3 implementation. It does not activate the production scheduler, apply a migration, deploy a branch, or change production `main`.

Canonical lifecycle:

`governed admission -> exact worker claim -> certified internal renderer -> worker-owned PDF and artifact -> finalize_worker_publication_v2 -> governed customer download`

## Phase 3 defect and ownership ledger

| # | Surface | Read-only finding | Closed authority |
|---:|---|---|---|
| 1 | Scheduler | Supabase Cron was documented but inactive; GitHub is manual fallback. | `worker_scheduler_authority` declares one `supabase_cron_pg_net` authority and remains disabled pending explicit production authorization. |
| 2 | Worker entry | `/api/admin-run-worker` is the only autonomous processing entry. | Retained with a unique invocation UUID and authenticated cron/admin boundary. |
| 3 | Claim | Queue scan feeds an exact-job claim RPC. A stale comment implied a second claim owner. | Only `claim_worker_job(job_id, claimed_by)` may claim a governed admission. |
| 4 | Fencing | Attempt and claimed-by fencing already existed across transitions. | Retained for claim, lease, transition, failure, restoration and publication. |
| 5 | Lease | Thirty-minute lease existed, but long rendering had no periodic renewal. | Renderer execution renews before, every 45 seconds, and after the operation. |
| 6 | Runtime | Worker route allowed 300 seconds while the loop stopped at 55 seconds. | Worker budget is 270 seconds with a 30-second platform reserve and a bounded job batch of one by default, three maximum. |
| 7 | Screening renderer | Screening returned certified HTML and left artifact work to the worker. | Retained as the canonical content-only model. |
| 8 | Underwriting renderer | Underwriting also invoked DocRaptor, Storage and report persistence. | Underwriting now returns certified HTML, fallbacks, identity, decision and manifest candidate only. |
| 9 | Nested HTTP | Worker called the renderer through a nested short-lived HTTP function; parser fetches had no explicit abort. | Renderer is invoked in-process; remaining parser HTTP calls abort at 50 seconds. |
| 10 | PDF provider | Screening used worker artifact output while Underwriting used generator output. | `ensureReportDownloadArtifact` is the one PDF provider/test-artifact authority for both products. |
| 11 | Report and Storage | A property/time heuristic could adopt another job's report; Underwriting could create its own row and object. | Worker uses deterministic revision request and exact job lineage through `resolveOrCreateReportPublicationRecord`, then verifies the artifact. |
| 12 | Retry | Base attempts were bounded, but recovery episode budgets accumulated without a lifetime ceiling. | Lifetime ceiling is three base plus at most three authorized recovery attempts. |
| 13 | Requeue and dead letter | An exhausted requeue could return no row and wait for a later claim or lease event. | Requeue resolves exhaustion immediately to deterministic `dead_letter`. |
| 14 | Entitlement | Admission consumed `report_purchases`, but publication also decremented legacy `profiles.report_credits`. | `report_purchases` is the only worker entitlement lineage; the secondary profile decrement is removed. |
| 15 | Checkpoints | Immutable stage checkpoints existed. | Retained; requeue and recovery preserve checkpoint and original job lineage. |
| 16 | Events | Worker event and status transition receipts existed. | Retained for claims, renewals, stages, failures, retries, restoration and publication. |
| 17 | Recovery | Recovery reused the job and exact restored purchase, but lifetime attempts were not globally capped. | Recovery trigger clamps the remaining budget and rejects exhausted lifetime recovery. |
| 18 | Admin observability | File detail queried nonexistent `analysis_job_files.created_at`. | Admin queue detail uses canonical `uploaded_at`. |
| 19 | Customer failure | Internal render/storage defects could be mixed with document failure paths. | Renderer returns typed internal errors; worker alone applies governed terminal classification and safe customer state. |
| 20 | Publication | Phase 2 atomic finalizer was already authoritative. | `finalize_worker_publication_v2` remains the only path to published state, receipt, final manifest and current revision. |

## Invariants

- One exact claim and lease owner exists per attempt.
- Screening and Underwriting use the same content-only renderer ownership model.
- Generator code cannot write report rows, generated report objects, job status, publication receipts or current revision state.
- Worker artifact creation is deterministic and certified before publication.
- Re-entry uses the same job, purchase, revision request key and storage lineage.
- Exhaustion restores the exact consumed purchase once and only when no complete publication receipt exists.
- Repeated restoration, rendering, report resolution and atomic finalization are idempotent.
- Generic worker transition cannot set `published`.
- Customer download remains reachable only through the Phase 2 governed projection and signed-download API.

## Scheduler activation gate

The scheduler remains inactive in this branch. Activation requires a separately authorized production operation after Phase 1, Phase 2 and Phase 3 migrations are applied in order. The operator must verify the singleton registry, enable exactly the Supabase Cron / `pg_net` job, and prove a fresh admitted job plus a forced internal failure in production. GitHub Actions must remain manual fallback and Vercel Cron must remain absent.

## Local exit evidence

Passed from this branch:

- Phase 1 admission/core-mode regression.
- Phase 2 atomic publication/delivery and artifact-compensation regressions.
- Phase 3 worker/render/runtime/recovery contract regression.
- Worker claim/lease fencing, entitlement restoration, publication recovery, publication boundary, manifest, Screening lane, Underwriting atomicity and delivery-state regressions.
- JavaScript syntax checks, `git diff --check`, and the production build.

The broader launch suite passes 18 of 19 checks. Its sole failure is the inherited Vercel Hobby function-budget sentinel (15 deployable routes versus the test's limit of 12); the same condition exists at the Phase 2 base and Phase 3 adds no deployable function. It remains an explicit deployment-plan gate outside this phase rather than a worker/runtime regression.

Production certification remains intentionally pending because this phase is not deployed.
