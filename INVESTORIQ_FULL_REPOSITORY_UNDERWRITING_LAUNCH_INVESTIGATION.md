# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical index.** Scope: `rob01-web/investoriq` only. Branch: `investigation/full-repo-underwriting-audit`. Baseline: `main` at `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`. `main` remains untouched. No production code, live configuration, customer data, credits, jobs, deployments, migrations, or RETESTs changed.

## Investigation constitution

Read before every stage. Append bounded evidence. Never delete or renumber findings. Findings are `PROVEN`, `SUSPECTED`, or `CLEARED`. Detailed evidence is stored in linked stage files. No production patching during the audit.

## Repository census and checklist status

Remote Git tree enumeration is the authoritative tracked-file listing, equivalent to `git ls-files`; no local clone was available. The complete `tests/qa` inventory is closed at **151 tracked files**, 144 harness files plus 7 fixture files. The full path-level human-authored checklist remains controlling: `[ ]` uninspected, `[x]` inspected, `[~]` partial.

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
| S10 doctrine/archive | `[ ]` | 0 | Stage 10 |

**Cumulative behavior files inspected: 109.** Census-only listings are not counted. Full path-level checklist remains controlling.

## Finding register

Previously recorded findings F-001 through F-065 remain unchanged and `PROVEN`; their descriptions and evidence are preserved in Stages 2 through 8. Stage 9 adds:

| ID | Status | Severity | Owner | Finding | Doctrine impact | Evidence |
|---|---|---|---|---|---|---|
| F-066 | PROVEN | BLOCKER | frontend/customer-surface | Frontend collapses published-with-limitations, publication hold, and clean publication into Ready/Failed | Customer outcomes must distinguish blocked, limited, and clean publication | [Stage 09](investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md) |
| F-067 | PROVEN | HIGH | frontend/history | Active report history is split from dead ReportHistory page and dead page cannot download reports | One active history authority and working tenant-bound downloads are required | [Stage 09](investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md) |
| F-068 | PROVEN | HIGH | frontend/auth/admin | Dashboard has no explicit authentication route guard and admin routing depends on client-visible email comparison | Customer/admin boundaries need explicit authorization | [Stage 09](investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md) |
| F-069 | PROVEN | HIGH | frontend/state | Customer state is refresh-driven and can remain stale across purchase, failure, restoration, and publication | Paid and credit state must converge visibly | [Stage 09](investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md) |
| F-070 | PROVEN | HIGH | frontend/auth/billing/legal | Purchase and legal UI sends user-controlled identity fields | Actor identity must be server-derived | [Stage 09](investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md) |
| F-071 | PROVEN | HIGH | frontend/remediation | No active corrected-rerun, replacement-document, or revision-request customer path exists | Terminal failures need owned, linked remedies | [Stage 09](investigation/STAGE-09-FRONTEND-AND-CUSTOMER-SURFACES.md) |

## Authority graph, customer-journey map, and remedy matrix

`pricing/dashboard selector` -> checkout API -> Stripe/webhook entitlement -> Dashboard entitlement count -> client upload gate -> staged object -> atomic job/file/consumption RPC -> queue -> worker -> canonical delivery decision/artifacts -> Dashboard active/failure/history surface -> signed report download. The active customer journey matrix, all 15 requested journeys, and remedy matrix are recorded in Stage 09.

Customer outcome authority is not yet fully represented at the frontend boundary: canonical backend delivery decisions can be reduced to Ready/Failed, while restoration, limited publication, replacement, and revision state are separate or absent.

## Core-blocker matrix

The constitutionally valid whole-report core blocker count remains **3 families**: missing/unusable T12, missing/unusable Rent Roll, and true core contradiction/system contract failure. Technical causes must retain distinct ownership and remedy.

## Launch-blocker summary

**Current blocker count: 9:** F-001, F-002, F-012, F-013, F-041, F-049, F-050, F-061, F-066. F-009 remains `PROVEN`, not cleared. This is not launch approval.

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
| 9 | S5 frontend | COMPLETE | 14 | 109 |
| 10 | S10 doctrine/archive | NEXT | - | - |
| 11 | Final 12-deliverable synthesis | PLANNED | - | - |

## F-009 status

**PROVEN, explicitly resolved at the database-contract level.** The webhook runtime remains the authority for purchase completion, but its event marker and entitlement inserts are separate operations. The job-creation RPC is atomic only after entitlement creation and does not resolve webhook idempotency. No active repository migration proves the base purchase uniqueness contract. See Stage 08.

## Preliminary launch lane

**Do not make Premium Acquisition Underwriting V1 the base Full Underwriting lane yet.** Preliminary base remains the existing **V2/base Underwriting lane**, pending Stage 10 doctrine/archive proof. Premium remains feature-flagged and externally certified.

## Final conclusions

Not yet available. Do not produce the final 12-deliverable report until all scheduled stages are complete and findings are classified.
