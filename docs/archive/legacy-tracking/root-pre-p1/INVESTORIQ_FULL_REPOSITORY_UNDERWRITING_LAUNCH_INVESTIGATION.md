# INVESTORIQ FULL REPOSITORY UNDERWRITING LAUNCH INVESTIGATION

**Canonical index.** Scope: `rob01-web/investoriq` only. Branch: `investigation/full-repo-underwriting-audit`. Baseline: `main` at `33dac6f9f1bce9790f7cc31c6e70e79faa62e42d`. `main` remains untouched. No production code, live configuration, customer data, credits, jobs, deployments, migrations, or RETESTs changed.

## Final audit status

**Stage 11 complete. Audit complete.** The canonical index and Stage 1 through Stage 11 evidence files are the source of truth. No production changes were made. Total findings: **76**, all classified `PROVEN`; current blocker count: **10**. Final synthesis: [Stage 11](investigation/STAGE-11-FINAL-UNDERWRITING-LAUNCH-SYNTHESIS.md).

## Executive verdict

- **Screening:** not launch-approved yet; shortest eventual paid path after P0 gates.
- **Full Underwriting:** not launchable this week.
- **Architecture:** salvageable; no rewrite required.
- **Recommended launch lane:** Screening only after P0; V2/base is the eventual Full Underwriting base.
- **Premium:** remain feature-flagged off.
- **99.999% publication objective:** not enforced or proven.

## Repository census and checklist status

Remote Git tree enumeration is the authoritative tracked-file listing, equivalent to `git ls-files`; no local clone was available. Complete `tests/qa` inventory is closed at **151 tracked files**, 144 harness files plus 7 fixtures. The full path-level human-authored checklist remains controlling.

| Subsystem | Status | Behavior files inspected | Notes |
|---|---:|---:|---|
| S1 entrypoints/routing | `[x]` | 8 | Complete |
| S2 underwriting core | `[~]` | 50 | Contracts, deterministic layer, memo lanes |
| S3 ingest/parsing | `[~]` | 11 | Stage 7 bounded ingest batch; full parser tail remains |
| S4 worker/queue/revision | `[x]` | 7 | Complete for Stage 3 scope |
| S5 frontend | `[x]` | 14 | Active Dashboard/admin/purchase/history/status surfaces inspected |
| S6 shared runtime | `[~]` | 2 direct | Auth/client helpers inspected |
| S7 migrations/RLS | `[x]` | 19 | Base schema/storage definitions not present in repository |
| S8 tests/QA | `[~]` | inventory complete | Behavior not executed; 151 entries inventoried |
| S9 config/build | `[~]` | routing/timeouts | Full config stage pending |
| S10 doctrine/archive | `[x]` | 84 doctrine/archive files classified | No archived runtime imports found |
| S11 synthesis | `[x]` | 12 deliverables | Complete |

**Final behavior count:** 109. **Doctrine/archive records classified:** 84. **Final inspected records:** 193, excluding 151 QA inventory entries counted separately. **Total findings:** 76. **Blockers:** 10.

## Finding register and blockers

Findings F-001 through F-076 are preserved in Stages 2 through 10 and Stage 11. The current blocker set is: **F-001, F-002, F-012, F-013, F-041, F-049, F-050, F-061, F-066, F-072.** F-009 remains `PROVEN` and explicitly resolved at the database-contract level.

## Recommended P0 phase summary

P0-A identity/auth; P0-B one claim and paid-state authority; P0-C core admission and blocker taxonomy; P0-D customer outcome/history projection; P0-E schema and doctrine authority gate. These are separate sequential commits with separate rollback boundaries. No giant patch.

## Authority graph and launch lane

`Product Doctrine` -> `Premium Doctrine` for Premium-only expansion -> immutable report identity/surface receipt -> canonical Source Truth -> deterministic calculations -> section eligibility -> customer surface -> renderer -> PDF Boss/certification -> Delivery Authority -> publication -> Report History -> remedy. Recommended launch is Screening only after P0. V2/base remains the eventual Full Underwriting lane. Premium stays off.

## Stage log

| Stage | Scope | Status | New entries | Cumulative behavior |
|---|---|---:|---:|---:|
| 1 | Census/checklist | COMPLETE | 0 | 0 |
| 2 | S1 entrypoints/routing | COMPLETE | 8 | 8 |
| 3 | QA inventory + S4 worker/queue/revision | COMPLETE | 9 | 17 |
| 4 | S2 contract layer | COMPLETE | 18 | 35 |
| 5 | S2 deterministic analysis | COMPLETE | 20 | 55 |
| 6 | Memo V1 vs V2 lane resolution | COMPLETE | 10 | 65 |
| 7 | S3 ingest/parsing | COMPLETE | 11 | 76 |
| 8 | S7 migrations/RLS | COMPLETE | 19 | 95 |
| 9 | S5 frontend | COMPLETE | 14 | 109 |
| 10 | S10 doctrine/archive | COMPLETE | 84 classified records | 109 |
| 11 | Final synthesis | COMPLETE | 12 deliverables | 109 |

## Exact first implementation phase

**P0-A: authenticated identity and authorization boundary.** Server-derive checkout/legal actors, block unauthenticated dashboard access, separate admin/customer routing, and add cross-user contract tests. Do not implement during the audit.
