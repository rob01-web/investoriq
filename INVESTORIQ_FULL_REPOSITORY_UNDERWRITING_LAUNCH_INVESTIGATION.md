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
| S5 frontend | `[x]` | 14 | Active Dashboard/admin/purchase/history/status surfaces inspected |
| S6 shared runtime | `[~]` | 2 direct | Auth/client helpers inspected |
| S7 migrations/RLS | `[x]` | 19 | Stage 8 complete; base schema/storage definitions not present in repository |
| S8 tests/QA | `[~]` | inventory complete | Behavior not executed; 151 entries inventoried |
| S9 config/build | `[~]` | routing/timeouts | Full config stage pending |
| S10 doctrine/archive | `[x]` | 84 doctrine/archive files classified | Archive semantic reachability reviewed; no runtime imports found |

**Cumulative behavior files inspected: 109.** Census-only listings are not counted. Full path-level checklist remains controlling.

## Finding register

Previously recorded findings F-001 through F-071 remain unchanged and `PROVEN`; their descriptions and evidence are preserved in Stages 2 through 9. Stage 10 adds:

| ID | Status | Severity | Owner | Finding | Doctrine impact | Evidence |
|---|---|---|---|---|---|---|
| F-072 | PROVEN | BLOCKER | doctrine/launch governance | Doctrine authority is duplicated and current operational status contradicts itself | One current authority and explicit status receipt are required | [Stage 10](investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md) |
| F-073 | PROVEN | HIGH | doctrine/archive hygiene | Archived doctrine remains semantically reachable and can pollute future authority decisions | Stale records must be explicitly non-authoritative | [Stage 10](investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md) |
| F-074 | PROVEN | HIGH | launch/SRE governance | The 99.999% publication objective has no enforceable implementation contract | Reliability objectives need denominator, SLO, error budget, and rollback rules | [Stage 10](investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md) |
| F-075 | PROVEN | HIGH | product identity/architecture | Doctrine and runtime do not share one terminology contract for report identity | One normalized identity must cross all boundaries | [Stage 10](investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md) |
| F-076 | PROVEN | HIGH | customer remediation | Remedy doctrine is ahead of executable customer remediation | Every terminal state needs an owned remedy path | [Stage 10](investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md) |

## Doctrine hierarchy, matrices, and authority graph

The controlling hierarchy, doctrine-to-runtime compliance matrix, archive reachability matrix, and six contradiction families are recorded in [Stage 10](investigation/STAGE-10-DOCTRINE-AND-ARCHIVE-RECONCILIATION.md). The single authority graph is:

`Product Doctrine` -> `Premium Doctrine` -> `Premium Activation Runbook` -> `canonical Source Truth / delivery / PDF Boss contracts` -> `worker publication enforcement` -> `customer/admin projections`. Archived ledgers and roadmaps are historical evidence only.

## Core-blocker matrix

The constitutionally valid whole-report core blocker count remains **3 families**: missing/unusable T12, missing/unusable Rent Roll, and true core contradiction/system contract failure. Optional support, reconciliation variance, missing current debt, missing appraisal/renovation, and provider outage are not independent constitutional blockers.

## Launch-blocker summary

**Current blocker count: 10:** F-001, F-002, F-012, F-013, F-041, F-049, F-050, F-061, F-066, F-072. F-009 remains `PROVEN`, not cleared. This is not launch approval.

## Stage log

| Stage | Scope | Status | New behavior files/entries | Cumulative behavior files |
|---|---|---:|---:|---:|
| 1 | Census/checklist | COMPLETE | 0 | 0 |
| 2 | S1 entrypoints/routing | COMPLETE | 8 | 8 |
| 3 | QA inventory + S4 worker/queue/revision | COMPLETE | 9 target/support entries; 151 QA entries | 17 |
| 4 | S2 contract layer | COMPLETE | 18 | 35 |
| 5 | S2 deterministic analysis | COMPLETE | 20 | 55 |
| 6 | Memo V1 vs V2 lane resolution | COMPLETE | 10 | 65 |
| 7 | S3 ingest/parsing | COMPLETE | 11 | 76 |
| 8 | S7 migrations/RLS, including F-009 | COMPLETE | 19 | 95 |
| 9 | S5 frontend | COMPLETE | 14 | 109 |
| 10 | S10 doctrine/archive | COMPLETE | 84 doctrine/archive files classified | 109 |
| 11 | Final 12-deliverable synthesis | NEXT | - | - |

## F-009 status

**PROVEN, explicitly resolved at the database-contract level.** The webhook runtime remains the authority for purchase completion, but its event marker and entitlement inserts are separate operations. The job-creation RPC is atomic only after entitlement creation and does not resolve webhook idempotency. No active repository migration proves the base purchase uniqueness contract. See Stage 08.

## Preliminary launch lane

**Do not make Premium Acquisition Underwriting V1 the base Full Underwriting lane yet.** Preliminary base remains the existing **V2/base Underwriting lane**, pending Stage 11 synthesis and explicit remediation authorization. Premium remains feature-flagged and externally certified.

## Final conclusions

Not yet available. Do not produce the final 12-deliverable report until Stage 11 synthesis is complete and findings are classified.
