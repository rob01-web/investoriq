# Stage 03: Worker, Queue, and Revision Paths

**Repository:** `rob01-web/investoriq`  
**Branch:** `investigation/full-repo-underwriting-audit`  
**Baseline inspected:** `main` HEAD `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
**Scope:** read-only audit. No production code, environment, customer data, jobs, deployment, or live RETEST changed.

## Inventory closure

The previous `tests/qa` listing was truncated. A repository-scoped GitHub code search returned **151 tracked files** under `tests/qa`: **144 QA harness files plus 7 fixture files**. The fixture directory is `tests/qa/fixtures/` and contains:

- `acquisition-memo-v2-retest19-analysis-artifacts-rows.json`
- `institutional-gate-7-chain.js`
- `institutional-gate-8-chain.js`
- `institutional-gate-9-chain.js`
- `institutional-gate-10-report.js`
- `retest24-sanitized-permanent-replay.json`
- `stonebridge-retest21-source-authority.json`

The complete 151-entry inventory is anchored by the repository tree/search result (`total_count: 151`, no incomplete results), not chat memory. The QA checklist in the canonical index is updated from incomplete to complete inventory status.

## Files inspected

- `api/admin-run-worker.js` (131,631 bytes)
- `api/admin/queue-metrics.js` (51,581 bytes)
- `api/admin/run-eligible-jobs-once.js` (10,921 bytes)
- `api/jobs/request-revision.js` (1,439 bytes)
- `api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js` (4,598 bytes)
- `supabase/migrations/20260216_0001_claim_and_consume_job.sql` (1,024 bytes)
- `supabase/migrations/20260210100140_consume_purchase_and_create_job.sql` (5,043 bytes)
- `.github/workflows/worker-kick.yml` and `vercel.json` re-read for timeout comparison

## Proven findings

### F-012 - BLOCKER - Worker timeout policy kills jobs before the worker's own timeout guard

`admin-run-worker.js` runs an internal loop with `maxSeconds = 55`, while Vercel grants the function 300 seconds. The scheduled GitHub workflow has `timeout-minutes: 2`, but the worker can invoke downstream parsing/report endpoints serially and does not impose a timeout on those `fetch()` calls. A downstream call can hang until the platform/workflow kills the invocation, leaving a job in an in-progress status. The worker's database timeout sweep only runs when a later invocation successfully reaches it. This is a proven abandonment path.

**Status:** PROVEN. **Severity:** BLOCKER. **Owner:** worker/queue. **Doctrine impact:** no paid valid-core job may become invisible or stranded after claim.

### F-013 - BLOCKER - Claim and processing are split across two incompatible worker paths

`api/admin-run-worker.js` claims queued jobs with the atomic `claim_and_consume_job` RPC, then processes them. Separately, `api/admin/run-eligible-jobs-once.js` claims with `claim_next_job` and returns immediately after writing a start-surface receipt. The GitHub workflow calls both endpoints every five minutes, in sequence. The second path can claim a job into `extracting` and stop, while the first worker later handles it, but both are active claimers with different contracts, auth logic, and observability. A claim can therefore succeed without actual processing in the invoking request. This makes worker invocation and job ownership non-canonical.

**Status:** PROVEN. **Severity:** BLOCKER. **Owner:** worker/queue. **Doctrine impact:** exactly one authoritative claim-to-process lane is required.

### F-014 - HIGH - Queue processing has no lease expiry or owner token

`claim_and_consume_job` changes `queued` to `extracting` and sets `started_at`, but stores no worker invocation ID, lease token, lease expiry, or heartbeat. The worker later selects all jobs by status and age. A timed-out invocation and a second invocation have no ownership proof. The 60-minute sweep can mark the job failed, but it is a coarse age rule, not a lease protocol, and it can race with a still-running original worker.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** worker/queue. **Doctrine impact:** retry safety and exactly-once processing are not established.

### F-015 - HIGH - Internal downstream fetches have no timeout or cancellation

The worker calls `extract-job-text`, `parse-doc`, and `generate-client-report` with bare `fetch()` promises. There is no `AbortSignal`, deadline, or `Promise.race` around these calls. A provider, parser, PDF renderer, or network request can consume the remaining invocation budget. The worker only checks its 55-second loop budget between some stages, not while awaiting a downstream call.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** worker/queue and ingest/rendering. **Doctrine impact:** a valid-core job can become abandoned rather than terminally classified.

### F-016 - HIGH - Parse dispatch failures can leave the job stranded in `extracting`

For supporting documents and structured core documents, several non-2xx downstream responses are logged as worker events or file-level parse failures, then the loop continues. The worker later re-queries parse states; if the required artifacts never appear it eventually fails the job, but a hanging or repeatedly non-terminal downstream condition can leave it in `extracting` until the 60-minute sweep. Supporting-document failure is explicitly degraded rather than terminal, so the job can advance with incomplete support evidence and depend on later QA gates.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** ingest/worker. **Doctrine impact:** support evidence must be visible as degraded, never silently absent.

### F-017 - HIGH - Timeout sweep can overwrite legitimate long-running work

The timeout sweep marks every non-admin-held job in `queued`, `extracting`, `underwriting`, `scoring`, `rendering`, `pdf_generating`, or `publishing` as failed when `started_at` or `created_at` is at least 60 minutes old. There is no heartbeat or lease check, and no proof that the worker is not still running. A valid report generation or PDF operation exceeding 60 minutes is therefore converted to `TIMEOUT` and entitlement restoration is attempted while work may still be active.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** worker/queue. **Doctrine impact:** terminal failure requires proof that processing is no longer active.

### F-018 - HIGH - Failure restoration is non-transactional and can leave paid state ambiguous

`applyTerminalFailureOutcome` first updates the job to `failed`, then attempts entitlement restoration, then writes artifacts. Restoration is explicitly `strict: false` for generic worker failures and timeouts. If restoration fails, the job remains failed and the worker records an error, but the customer-facing state can be a failed job with an unrecovered consumed entitlement. The worker returns an error in some artifact-write cases after the status mutation has already happened.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** worker/entitlement. **Doctrine impact:** failed work must have a durable, auditable credit outcome.

### F-019 - HIGH - Revision endpoint is a deliberate dead end for authenticated customers

`api/jobs/request-revision.js` authenticates a bearer token but always returns HTTP 403 with a support instruction. It does not validate job ownership, persist a revision request, create an admin issue, or enqueue any work. A customer with a valid-core report needing correction has no executable revision path through this endpoint.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** revision/customer remediation. **Doctrine impact:** remediation must be actionable and traceable, not merely a message.

### F-020 - MEDIUM - Admin requeue bypasses the atomic claim contract and lacks retry bounds

`admin-run-worker.js` can set a failed job back to `queued` and clears failure fields, but does not increment or cap an attempt counter, reset `started_at`, or record a retry budget. `run-eligible-jobs-once.js` can force-requeue any selected job through `admin_requeue_job`. Repeated retries are therefore not bounded by code inspected in this stage.

**Status:** PROVEN. **Severity:** MEDIUM. **Owner:** worker/queue. **Doctrine impact:** retries need explicit classification and bounded remediation.

### F-021 - MEDIUM - `queue-metrics` hides database errors as healthy zeroes

Status counts return `[status, 0]` when a count query errors. Recent jobs, issues, and several panels similarly fall back to empty arrays while returning a successful HTTP response. Operators can see an apparently empty or healthy queue when the data query actually failed.

**Status:** PROVEN. **Severity:** MEDIUM. **Owner:** admin observability. **Doctrine impact:** failed/blocked/abandoned jobs must be visible; telemetry failure cannot look like zero workload.

### F-022 - MEDIUM - `run-eligible-jobs-once` has a duplicated auth guard and a dangerous forced requeue surface

The endpoint checks `if (!token)` twice, with different error strings, which is harmless but signals drift. More importantly, any caller with the admin key can supply `job_id` and invoke the `admin_requeue_job` RPC without checking the current status, error class, ownership, or retry count in this handler. The safety contract is therefore delegated to an uninspected database function.

**Status:** PROVEN for the missing handler-side controls; RPC behavior remains UNINSPECTED. **Severity:** MEDIUM. **Owner:** worker/admin. **Doctrine impact:** controlled requeue must be evidence-based and bounded.

### F-023 - HIGH - Start-surface receipt persistence is read-then-write and can fail a claimed job

Both worker paths claim a job, then resolve/persist a premium underwriting start-surface receipt. The helper reads existing receipts, rejects more than one, and inserts a new receipt without an atomic uniqueness guard. Any insert failure or multiple-receipt condition causes the caller to return an error after the job has already moved out of `queued`. In `run-eligible-jobs-once.js`, that leaves the job claimed but not processed by that request.

**Status:** PROVEN. **Severity:** HIGH. **Owner:** worker/underwriting surface assignment. **Doctrine impact:** metadata assignment failure must not strand a paid job.

## Timeout and lease comparison

| Layer | Observed policy | Audit result |
| --- | --- | --- |
| GitHub workflow | 2-minute job timeout; every 5 minutes; `curl -sS` | Shorter than Vercel; HTTP 500s do not fail the workflow |
| Vercel | `admin-run-worker.js` 300 seconds; generic `api/**/*.js` 60 seconds | Worker budget and downstream budgets differ |
| Worker internal | 55-second loop cap, 10 passes, batch limit default 25 | No deadline around awaited fetches |
| Database timeout | 60 minutes from `started_at` or `created_at` | Coarse failure sweep, no lease/heartbeat |
| Claim | atomic queued->extracting update | Claim is atomic, ownership is not leased |
| Retry | manual requeue / RPC paths | No attempt cap established in inspected code |

## Complete path map

`consume_purchase_and_create_job` atomically consumes purchase + creates queued job -> workflow calls `run-eligible-jobs-once` and `admin-run-worker` -> either `claim_next_job` or `claim_and_consume_job` -> `extracting` -> parse/extract dispatch -> required artifact checks -> `underwriting` -> `scoring` -> `rendering` -> report generation/PDF/publication -> `published`, or `failed`/blocked with attempted restoration. Revision requests terminate at HTTP 403. Timeout sweep can convert any in-progress status to `failed`.

## Stage conclusion

Worker/queue paths are not launch-safe for paid volume. The clearest blocker is not a single parser bug: it is the combination of two active claimers, no lease token, no downstream fetch deadline, and a scheduler that hides HTTP failures. The full-repository audit continues; no code patch is authorized or made here.
