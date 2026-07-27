# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical index.** Scope: `rob01-web/investoriq` only. Branch: `investigation/full-repo-underwriting-audit`. Baseline: `main` at `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`. `main` remains untouched. No production code, live configuration, customer data, credits, jobs, deployments, or RETESTs changed.

## Investigation constitution

Read this file before every stage. Append evidence after every bounded batch. Never delete or renumber findings. Findings are `PROVEN`, `SUSPECTED`, or `CLEARED`. Detailed evidence is stored in linked stage files. No production patching during the audit.

## Repository census

Remote Git tree enumeration was used as the authoritative tracked-file listing, equivalent to `git ls-files`; no local clone was available. Initial classification covered human-authored source, tests/QA, configuration/build, migrations, doctrine/docs, legacy/archive, and generated/vendor/binary/artifacts. The complete `tests/qa` inventory is closed at **151 tracked files**, 144 harness files plus 7 fixture files.

## Durable checklist status

The complete path-level human-authored checklist was established in Stage 1. `[ ]` means uninspected, `[x]` inspected, `[~]` partial. Files are marked inspected only after contents were read.

| Subsystem | Status | Behavior files inspected | Notes |
|---|---:|---:|---|
| S1 entrypoints/routing | `[x]` | 8 | Stage 2 |
| S2 underwriting core | `[~]` | 18 | Stage 4 contract layer; deterministic/memo layers remain |
| S3 ingest/parsing | `[ ]` | 0 | Stage 7 |
| S4 worker/queue/revision | `[x]` | 7 | Stage 3 |
| S5 frontend | `[ ]` | 0 | Stage 9 |
| S6 shared runtime | `[ ]` | 0 | Stage 5/7 as relevant |
| S7 migrations/RLS | `[~]` | 2 support migrations | Full stage pending |
| S8 tests/QA | `[~]` | inventory complete | Behavior not executed; 151 entries inventoried |
| S9 config/build | `[~]` | routing/timeouts | Full config stage pending |
| S10 doctrine/archive | `[ ]` | 0 | Stage 10 |

**Cumulative behavior files inspected: 35.** Stage 1 census files are not counted as behavior inspections. The full path-level checklist remains in the Stage 1 record and is controlling.

## Finding register

Severity: `BLOCKER`, `HIGH`, `MEDIUM`, `LOW`. Every finding includes stable ID, status, owning subsystem, doctrine impact, and evidence link.

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
| F-009 | PROVEN | MEDIUM | billing/db | Webhook purchase completion is read-then-write | Idempotency must be atomic | Stage 2; DB resolution pending |
| F-010 | PROVEN | LOW | runtime | Module-scope env initialization is inconsistent | Misconfiguration should fail closed clearly | Stage 2 record |
| F-011 | PROVEN | LOW | routing/admin | Redundant API route plus multiplexed queue-metrics surface | Operational surfaces should be explicit | Stage 2 record |
| F-012 | PROVEN | BLOCKER | worker/queue | Scheduler can kill invocation before downstream work finishes; fetches have no deadline | Valid paid jobs cannot be abandoned | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-013 | PROVEN | BLOCKER | worker/queue | Two active claimers use incompatible claim-to-process contracts | One authoritative worker lane is required | [Stage 03](investigation/STAGE-03-WORKER-QUEUE-AND-REVISION-PATHS.md) |
| F-014 | PROVEN | HIGH | worker/queue | Atomic claim has no lease token, owner, expiry, or heartbeat | Exactly-once ownership is unproven | Stage 3 |
| F-015 | PROVEN | HIGH | worker/ingest | Internal fetch calls lack timeout/cancellation | Stalls must reach a durable terminal state | Stage 3 |
| F-016 | PROVEN | HIGH | ingest/worker | Parse dispatch failure can leave jobs extracting or support-degraded | Evidence degradation must be visible and bounded | Stage 3 |
| F-017 | PROVEN | HIGH | worker/queue | Coarse 60-minute sweep can fail legitimate still-running work | Timeout requires lease/heartbeat proof | Stage 3 |
| F-018 | PROVEN | HIGH | worker/entitlement | Failure status and entitlement restoration are non-transactional | Credit outcome must be durable and auditable | Stage 3 |
| F-019 | PROVEN | HIGH | revision/remediation | Customer revision endpoint always ends HTTP 403 and persists nothing | Remediation must be actionable and traceable | Stage 3 |
| F-020 | PROVEN | MEDIUM | worker/admin | Requeue paths have no attempt cap established in inspected code | Retry must be bounded and classified | Stage 3 |
| F-021 | PROVEN | MEDIUM | observability | Queue metrics convert query errors into zero/empty successful responses | Telemetry failure cannot look healthy | Stage 3 |
| F-022 | PROVEN | MEDIUM | worker/admin | Forced requeue delegates safety to uninspected RPC behavior | Admin actions need visible guardrails | Stage 3 |
| F-023 | PROVEN | HIGH | worker/surface | Start-surface receipt read-then-write can fail after claim | Metadata failure cannot strand paid work | Stage 3 |
| F-024 | PROVEN | HIGH | identity/routing | Resolver accepts `ic`, but canonical identity has no IC identity | Every promised surface needs one representable identity | [Stage 04](investigation/STAGE-04-UNDERWRITING-CORE-CONTRACT-LAYER.md) |
| F-025 | PROVEN | HIGH | identity/routing | Acquisition Memo and legacy Underwriting share one canonical identity | Product surface lineage must not drift | Stage 4 |
| F-026 | PROVEN | HIGH | authority graph | Multiple components independently decide identity, mode, readiness, and aliases | One immutable surface receipt must cross boundaries | Stage 4 |
| F-027 | PROVEN | HIGH | coverage/eligibility | Legacy fallback reconstruction remains authoritative when canonical state is absent | Compatibility heuristics must not become second truth | Stage 4 |
| F-028 | PROVEN | HIGH | premium activation | Premium model is contractually disconnected but reachable code can render it when enabled | Activation state must distinguish staged vs promised surface | Stage 4 |
| F-029 | PROVEN | HIGH | premium/worker | Premium generation failure has no local base-surface fallback | Optional expansion failure must not erase a valid base path without explicit policy | Stage 4 |
| F-030 | PROVEN | MEDIUM | identity/PDF | Legacy visible-title aliases remain accepted at PDF identity boundaries | Compatibility aliases should be input-only and normalize output | Stage 4 |
| F-031 | PROVEN | MEDIUM | worker/surface | Premium receipt is only immutable after successful first write; persistence is read-then-write | Surface assignment must be exactly once at job start | Stage 4 |

## Authority graph

`request body/job report_type` -> `resolveReportTypeAndTier` -> `reportType/reportTier/effectiveReportMode` -> report implementation dispatch -> canonical Source Truth -> canonical Institutional Financial Intelligence + Underwriting Input Contract -> Screening sealed lane or Acquisition Memo V2 sealed lane -> customer-surface model/renderer -> deterministic QA and delivery decision -> canonical identity at PDF certification -> publication/storage.

Premium overlays the Underwriting branch: job-start surface receipt -> premium external generation -> validated model -> premium renderer/observation -> external certification -> worker publication enforcement. Premium does not own source, delivery, publication, billing, or remedy authority.

## Launch-blocker summary

**Current blocker count: 4:** F-001, F-002, F-012, F-013. This is not launch approval. High-severity identity, fallback, Premium, and worker findings remain open. F-009 and full migrations/RLS remain open for Stage 8.

## Stage log

| Stage | Scope | Status | New behavior files/entries | Cumulative behavior files |
|---|---|---|---:|---:|
| 1 | Census and durable checklist | COMPLETE | 0 behavior files; full tree census | 0 |
| 2 | S1 entrypoints/routing | COMPLETE | 8 | 8 |
| 3 | QA inventory + S4 worker/queue/revision | COMPLETE | 7 target + 2 migration-support; 151 QA entries | 17 |
| 4 | S2 underwriting core contract layer | COMPLETE | 18 | 35 |
| 5 | S2 deterministic analysis layer | NEXT | - | - |
| 6 | Memo V1 vs V2 lane resolution | PLANNED | - | - |
| 7 | S3 ingest/parsing | PLANNED | - | - |
| 8 | S7 migrations/RLS, including F-009 | PLANNED | - | - |
| 9 | S5 frontend | PLANNED | - | - |
| 10 | S10 doctrine reconciliation | PLANNED | - | - |
| 11 | Final 12-deliverable synthesis | PLANNED | - | - |

## Final conclusions

Not yet available. Do not produce the final 12-deliverable report until every scheduled stage is complete and every finding is classified.
