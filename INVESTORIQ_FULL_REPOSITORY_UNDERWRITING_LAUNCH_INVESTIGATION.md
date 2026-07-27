# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical index.** Scope is `rob01-web/investoriq` only. Branch is `investigation/full-repo-underwriting-audit`. `main` is untouched. No production code, environment variables, customer data, credits, jobs, deployments, or live RETESTs were changed.

## Investigation rules

Read this file before every stage. Append evidence after every bounded batch. Never delete or renumber findings. Findings are `PROVEN`, `SUSPECTED`, or `CLEARED`. Detailed evidence lives in linked stage files. No production patching during this audit.

## Repository census

Repository root: `rob01-web/investoriq`  
Baseline: `main` at `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`  
HEAD message: `Record RETEST 38 failure and deployed repairs`  
Default branch: `main`  
Working tree: not applicable; inspection used remote Git objects at pinned HEAD.  
Tracked-file method: Git tree enumeration, equivalent to `git ls-files`; no local clone was available.

Classification: human-authored source, tests/QA, configuration/build, migrations, doctrine/docs, legacy/archive, generated/vendor/binary/artifact. Large tracked artifact and archive groups remain classified but are not inspection targets until their stage is scheduled.

## Durable checklist

The complete human-authored checklist was established in Stage 1 and remains the controlling checklist. Statuses are `[ ] UNINSPECTED`, `[x] INSPECTED`, `[~] PARTIAL`. Stage 1 inspected 0 source files for behavior; Stage 2 inspected 8 entrypoint/routing files; Stage 3 inspected 7 worker/queue/revision/migration-support files plus completed the QA inventory census.

**QA inventory closure:** `tests/qa` contains **151 tracked files**, consisting of 144 QA harness files and 7 fixture files. The inventory is complete and was verified with a repository-scoped search returning `total_count: 151` and `incomplete_results: false`. Fixture paths are recorded in `investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md`.

### Subsystem checklist status

| Subsystem | Status | Inspected this audit |
|---|---:|---:|
| S1 entrypoints/routing | `[x]` | 8 |
| S2 underwriting core | `[ ]` | 0 |
| S3 ingest/parsing | `[ ]` | 0 |
| S4 worker/queue/revision | `[x]` | 7 |
| S5 frontend | `[ ]` | 0 |
| S6 shared runtime | `[ ]` | 0 |
| S7 migrations/RLS | `[~]` | 2 support migrations read, full stage pending |
| S8 tests/QA inventory | `[~]` | inventory complete, behavior not executed |
| S9 configuration/build | `[~]` | routing/timeout config read |
| S10 doctrine/archive | `[ ]` | 0 |

The full path-level checklist from the census remains the source checklist; files are only marked inspected when their contents were read, not merely listed.

## Finding register

Severity: `BLOCKER`, `HIGH`, `MEDIUM`, `LOW`. Owner and doctrine impact are recorded for every finding. Detailed evidence links are stable stage files.

| ID | Status | Severity | Owner | Finding | Doctrine impact | Evidence |
|---|---|---|---|---|---|---|
| F-001 | PROVEN | BLOCKER | API/auth | Unauthenticated checkout-session metadata leaks internal user IDs | Customer identity must be private | Stage 2 record |
| F-002 | PROVEN | BLOCKER | API/auth | Unauthenticated legal acceptance can be forged/read for arbitrary user IDs | Legal evidence must bind to authenticated actor | Stage 2 record |
| F-003 | PROVEN | HIGH | legal | Client controls policy text hash | Acceptance must prove canonical text | Stage 2 record |
| F-004 | PROVEN | HIGH | legal | Duplicate acceptance returns current time, not stored timestamp | Audit chronology must be truthful | Stage 2 record |
| F-005 | PROVEN | HIGH | worker/ops | GitHub worker kick hides HTTP failures and times out at 2 minutes | Failed jobs cannot become invisible | Stage 2 record |
| F-006 | PROVEN | HIGH | runtime | Full report path is capped at generic 60 seconds | Report generation needs an explicit budget | Stage 2 record |
| F-007 | PROVEN | MEDIUM | billing | Checkout quantity metadata can diverge from line items | Entitlements need one source of truth | Stage 2 record |
| F-008 | PROVEN | MEDIUM | billing | Synthetic Stripe session IDs are stored for quantity > 1 | Entitlement reconciliation must use real IDs | Stage 2 record |
| F-009 | PROVEN | MEDIUM | billing/db | Webhook purchase completion is read-then-write | Idempotency must be atomic | Stage 2 record; DB resolution pending |
| F-010 | PROVEN | LOW | runtime | Module-scope env initialization is inconsistent | Misconfiguration should fail closed clearly | Stage 2 record |
| F-011 | PROVEN | LOW | routing/admin | Redundant API route plus multiplexed queue-metrics admin surface | Operational surfaces should be explicit | Stage 2 record |
| F-012 | PROVEN | BLOCKER | worker/queue | Scheduler can kill invocation before worker/downstream work finishes; downstream fetches have no deadline | Valid paid jobs cannot be abandoned | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-013 | PROVEN | BLOCKER | worker/queue | Two active claimers use incompatible claim-to-process contracts | One authoritative worker lane is required | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-014 | PROVEN | HIGH | worker/queue | Atomic claim has no lease token, owner, expiry, or heartbeat | Exactly-once ownership is unproven | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-015 | PROVEN | HIGH | worker/ingest | Internal fetch calls lack timeout/cancellation | Stalls must reach a durable terminal state | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-016 | PROVEN | HIGH | ingest/worker | Parse dispatch failure can leave jobs in extracting or degraded support state | Evidence degradation must be visible and bounded | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-017 | PROVEN | HIGH | worker/queue | Coarse 60-minute sweep can fail legitimate still-running work | Timeout requires lease/heartbeat proof | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-018 | PROVEN | HIGH | worker/entitlement | Failure status and entitlement restoration are non-transactional | Credit outcome must be durable and auditable | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-019 | PROVEN | HIGH | revision/remediation | Customer revision endpoint always ends in HTTP 403 and persists nothing | Remediation must be actionable and traceable | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-020 | PROVEN | MEDIUM | worker/admin | Requeue paths have no attempt cap established in inspected code | Retry must be bounded and classified | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-021 | PROVEN | MEDIUM | observability | Queue metrics convert query errors into zero/empty successful responses | Telemetry failure cannot look healthy | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-022 | PROVEN | MEDIUM | worker/admin | Forced requeue delegates safety to uninspected RPC behavior | Admin actions need handler-visible guardrails | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-023 | PROVEN | HIGH | worker/surface | Start-surface receipt read-then-write can fail after claim and strand work | Metadata failure cannot strand paid work | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |

## Launch-blocker summary

**Current blocker count: 4**: F-001, F-002, F-012, F-013. This is not a launch approval. F-009 and the full migration/RLS contract remain open for Stage 8. The audit is incomplete.

## Stage log

| Stage | Scope | Status | Files/entries inspected | Cumulative behavior-inspected files |
|---|---|---|---:|---:|
| 1 | Repository census and durable checklist | COMPLETE | 0 behavior files; full tree census | 0 |
| 2 | S1 entrypoints/routing | COMPLETE | 8 | 8 |
| 3 | QA inventory closure and S4 worker/queue/revision paths | COMPLETE | 7 new target files plus 2 migration-support files; 151 QA entries inventoried | 17 |
| 4 | S2 contract layer | NEXT | - | - |
| 5 | S2 deterministic analysis layer | PLANNED | - | - |
| 6 | Memo v1 vs v2 lane resolution | PLANNED | - | - |
| 7 | S3 ingest/parsing | PLANNED | - | - |
| 8 | S7 migrations/RLS, including F-009 | PLANNED | - | - |
| 9 | S5 frontend | PLANNED | - | - |
| 10 | S10 doctrine reconciliation | PLANNED | - | - |
| 11 | Final 12-deliverable synthesis | PLANNED | - | - |

## Final conclusions

Not yet available. Do not produce the final 12-deliverable report until every scheduled stage is complete and every finding is classified.
