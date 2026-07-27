# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical index.** Scope: `rob01-web/investoriq` only. Branch: `investigation/full-repo-underwriting-audit`. Baseline: `main` at `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`. `main` remains untouched. No production code, live configuration, customer data, credits, jobs, deployments, migrations, or RETESTs changed.

## Investigation constitution

Read before every stage. Append bounded evidence. Never delete or renumber findings. Findings are `PROVEN`, `SUSPECTED`, or `CLEARED`. Detailed evidence is stored in linked stage files. No production patching during the audit.

## Repository census and checklist status

Remote Git tree enumeration is the authoritative tracked-file listing, equivalent to `git ls-files`; no local clone was available. The complete `tests/qa` inventory is closed at **151 tracked files**, 144 harness files plus 7 fixtures. The full path-level human-authored checklist remains controlling: `[ ]` uninspected, `[x]` inspected, `[~]` partial.

| Subsystem | Status | Behavior files inspected | Notes |
|---|---:|---:|---|
| S1 entrypoints/routing | `[x]` | 8 | Complete |
| S2 underwriting core | `[~]` | 50 | Contracts, deterministic layer, memo lanes |
| S3 ingest/parsing | `[~]` | 11 | Stage 7 bounded ingest batch; full parser tail remains |
| S4 worker/queue/revision | `[x]` | 7 | Complete for Stage 3 scope |
| S5 frontend | `[ ]` | 0 | Stage 9 |
| S6 shared runtime | `[~]` | 0 direct | Imported dependencies only |
| S7 migrations/RLS | `[x]` | 19 | Stage 8 complete; base schema/storage definitions not present in repository |
| S8 tests/QA | `[~]` | inventory complete | Behavior not executed; 151 entries inventoried |
| S9 config/build | `[~]` | routing/timeouts | Full config stage pending |
| S10 doctrine/archive | `[ ]` | 0 | Stage 10 |

**Cumulative behavior files inspected: 95.** Census-only listings are not counted. Full path-level checklist remains controlling.

## Finding register

Previously recorded findings F-001 through F-060 remain unchanged and `PROVEN`; their descriptions and evidence are preserved in Stages 2 through 7. Stage 8 adds:

| ID | Status | Severity | Owner | Finding | Doctrine impact | Evidence |
|---|---|---|---|---|---|---|
| F-061 | PROVEN | BLOCKER | database/schema | Active migrations do not establish base schema or storage/RLS authority | Launch cannot assume keys, constraints, policies, buckets, or compatibility not present in repository evidence | [Stage 08](investigation/STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md) |
| F-062 | PROVEN | HIGH | billing/db | Purchase completion idempotency is split across marker, lookup, and insert | Entitlement creation needs one atomic database authority | [Stage 08](investigation/STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md) |
| F-063 | PROVEN | HIGH | worker/db | Legacy and current claim authorities remain simultaneously reachable | One claim RPC with ownership and lease semantics is required | [Stage 08](investigation/STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md) |
| F-064 | PROVEN | HIGH | publication/db | Publication and report history are not transactionally bound to terminal job state | A published object, history row, job status, and credit state need durable reconciliation | [Stage 08](investigation/STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md) |
| F-065 | PROVEN | HIGH | premium/db | Premium receipt persistence has no database uniqueness guard | Surface assignment must be exactly once | [Stage 08](investigation/STAGE-08-DATABASE-MIGRATIONS-RLS-AND-STORAGE.md) |

## Authority graph and database authority map

`request/job type` -> type/mode resolver -> report dispatch -> Source Truth -> deterministic receipt contracts -> V2 customer-surface/orchestrator -> QA/delivery -> PDF identity/certification -> publication/storage. Premium overlays Underwriting with a job-start receipt, validated model, renderer, observer, external certification, and worker enforcement.

`Stripe checkout metadata` -> `stripe_events` -> `report_purchases` entitlement -> `consume_purchase_and_create_job(auth.uid())` -> `analysis_jobs` + `analysis_job_files` -> `queue_job_for_processing` -> `claim_and_consume_job` or legacy `claim_next_job` -> processing -> artifacts -> report object/history -> published. Failure branches to terminal failure and best-effort entitlement restoration. Full authority detail is in Stage 08.

## Core-blocker matrix

The constitutionally valid whole-report core blocker count remains **3 families**: missing/unusable T12, missing/unusable Rent Roll, and true core contradiction/system contract failure. Technical causes must retain distinct ownership and remedy.

## Launch-blocker summary

**Current blocker count: 8:** F-001, F-002, F-012, F-013, F-041, F-049, F-050, F-061. F-009 remains `PROVEN`, not cleared. This is not launch approval.

## Stage log

| Stage | Scope | Status | New behavior files/entries | Cumulative behavior files |
|---|---|---:|---:|---:|
| 1 | Census/checklist | COMPLETE | 0 behavior files; full tree census | 0 |
| 2 | S1 entrypoints/routing | COMPLETE | 8 | 8 |
| 3 | QA inventory + S4 worker/queue/revision | COMPLETE | 9 target/support entries; 151 QA entries | 17 |
| 4 | S2 contract layer | COMPLETE | 18 | 35 |
| 5 | S2 deterministic analysis | COMPLETE | 20 | 55 |
| 6 | Memo V1 vs V2 lane resolution | COMPLETE | 10 | 65 |
| 7 | S3 ingest/parsing | COMPLETE | 11 | 76 |
| 8 | S7 migrations/RLS, including F-009 | COMPLETE | 19 | 95 |
| 9 | S5 frontend | NEXT | - | - |
| 10 | S10 doctrine/archive | PLANNED | - | - |
| 11 | Final 12-deliverable synthesis | PLANNED | - | - |

## F-009 status

**PROVEN, explicitly resolved at the database-contract level.** The webhook runtime remains the authority for purchase completion, but its event marker and entitlement inserts are separate operations. The job-creation RPC is atomic only after entitlement creation and does not resolve webhook idempotency. No active repository migration proves the base purchase uniqueness contract. See Stage 08.

## Preliminary launch lane

**Do not make Premium Acquisition Underwriting V1 the base Full Underwriting lane yet.** Preliminary base remains the existing **V2/base Underwriting lane**, pending Stage 9 frontend and Stage 10 doctrine/archive proof. Premium remains feature-flagged and externally certified.

## Final conclusions

Not yet available. Do not produce the final 12-deliverable report until all scheduled stages are complete and findings are classified.
