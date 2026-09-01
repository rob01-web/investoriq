# InvestorIQ Phase 6 Lifecycle Certification and Test Authority

**Date:** 2026-09-01  
**Status:** CLOSED ON ISOLATED BRANCH; PRODUCTION CERTIFICATION PENDING  
**Branch:** `internal-phase6-lifecycle-certification-20260901`  
**Phase 6 starting checkpoint:** `f4c876a2be3c94fc5a4d0c944daf19dc65f3d792`  
**Certified Phase 6 code checkpoint:** `618d786eadc952e14014ffd4267938369c102f84`  
**GitHub Actions certification run:** `33540617835`

## 1. Purpose

Phase 6 repairs InvestorIQ's lifecycle test authority so local simulations and regression harnesses cannot overrule or misrepresent the production contracts established in Phases 1 through 5.

The governing customer lifecycle remains:

`commerce -> entitlement -> admission/upload -> queue/worker -> certified renderer/artifact -> atomic publication -> governed customer listing -> governed signed download`

Phase 6 does not deploy code, apply migrations, activate the scheduler, merge `main`, mutate production data, consume a customer entitlement, create a production report, or change Stripe/Vercel production configuration.

## 2. Authority hierarchy

Phase 6 explicitly follows the forward contracts rather than historical test assumptions:

- Phase 1 controls report admission and minimum-core modes.
- Phase 2 controls atomic publication, publication receipts, current-revision promotion, customer publication projection, and governed download eligibility.
- Phase 3 controls worker/runtime ownership and keeps `finalize_worker_publication_v2` as the only publication finalizer.
- Phase 4 controls commerce and entitlement grant authority.
- Phase 5 controls customer-safe server boundaries, raw-table exposure, security hardening, and data hygiene.

Tests are evidence under those contracts. They are not allowed to redefine the product architecture.

## 3. Phase 6 defect and ownership ledger

| # | Surface | Defect found | Phase 6 closure |
|---:|---|---|---|
| 1 | Local E2E naming | The historical `tests/e2e` label could be mistaken for real customer lifecycle certification even though the harness is secret-free and simulated. | The harness is explicitly de-authorized as production E2E evidence. Forward lifecycle authority now lives in a dedicated Phase 6 contract smoke. |
| 2 | Minimum-core simulation | Historical worker-state scenarios treated a missing Rent Roll or missing T12 as automatic failure. | T12-only and Rent-Roll-only scenarios now publish under `t12_minimum_core` and `rent_roll_minimum_core`, matching Phase 1. |
| 3 | Report publication model | The fake state created `reports` rows with `status: published`, inventing a publication authority that does not exist in the Phase 2 schema. | Fake report creation now strips any report `status`; reports remain revision/storage metadata only. |
| 4 | Published transition | The simulator directly transitioned a job from `publishing` to `published`. | The published transition now occurs only inside the simulated `finalize_worker_publication_v2` authority. |
| 5 | Publication lineage | The prior simulator did not require a generated object, canonical delivery decision, final manifest, complete publication receipt, or current-revision promotion. | The simulator now models all of those lineage elements before `published` can exist. |
| 6 | Replay behavior | Ambiguous post-commit publication replay was not represented. | Replaying the simulated finalizer after a committed publication returns the existing lineage without a second receipt, transition, or write. |
| 7 | Cross-source mismatch | The old worker-state model could treat missing counterpart data as equivalent to a cross-source inconsistency. | Scale-mismatch comparison is now evaluated only when both usable core sources survived parsing. |
| 8 | Customer listing | Local lifecycle evidence did not bind publication to the current customer report projection. | Phase 6 certifies that customer listing uses authenticated owner filtering over `customer_published_report_projection`, not raw `reports`. |
| 9 | Customer download | Local lifecycle evidence did not bind download to completed publication lineage. | Phase 6 certifies owner-bound published projection lookup plus a short-lived signed URL from `generated_reports`. |
| 10 | Default QA command | `npm run test:e2e` invoked the historical broad mock runner. | The default command now invokes the Phase 6 lifecycle authority smoke; the old runner is available only as `test:e2e:legacy`. |

## 4. Forward local certification contract

Canonical command:

`npm run qa:phase6:lifecycle`

Equivalent default lifecycle command:

`npm run test:e2e`

Both execute:

`tests/qa/phase6-lifecycle-certification-contract-smoke.js`

The smoke proves the following local contracts:

- Phase 1 one-core survival for both minimum-core modes.
- No `reports.status` publication authority in the local simulator.
- One simulated `finalize_worker_publication_v2` ownership boundary.
- Generated-object presence before publication.
- Canonical delivery decision before publication.
- Final quality-manifest insertion during finalization.
- One complete publication receipt per published job.
- Revision request and storage lineage continuity.
- Current-revision promotion only at finalization.
- Idempotent replay after committed publication.
- No-core terminal failure with entitlement restoration in corrupted worker-state simulation.
- Dual-source scale mismatch terminal failure.
- Owner-bound governed customer listing.
- Owner-bound governed signed download.

## 5. Certified execution evidence

The exact certified code checkpoint is:

`618d786eadc952e14014ffd4267938369c102f84`

An isolated GitHub Actions workflow checked out that exact commit on branch `internal-phase6-lifecycle-certification-20260901` and completed the following steps successfully:

1. `npm ci` - PASS
2. `npm run qa:phase6:lifecycle` - PASS
3. `npm run build` - PASS

The lifecycle smoke emitted:

`phase6-lifecycle-certification-contract-smoke: PASS`

The Vite production build completed successfully with 1,775 modules transformed and no build failure.

The workflow job `phase6-lifecycle-certification` completed with conclusion `success` in GitHub Actions run `33540617835`.

## 6. Certified change scope

Compared with the Phase 6 starting checkpoint `f4c876a2be3c94fc5a4d0c944daf19dc65f3d792`, the certified code checkpoint is nine commits ahead, zero behind, and changes only six files:

- `.github/workflows/phase6-lifecycle-certification.yml`
- `package.json`
- `tests/e2e/README.md`
- `tests/e2e/fake-supabase.js`
- `tests/e2e/worker-state-scenarios.js`
- `tests/qa/phase6-lifecycle-certification-contract-smoke.js`

No production runtime route, renderer, database migration, commerce handler, worker implementation, customer listing route, or customer download route was changed by Phase 6.

## 7. Important limits of Phase 6 certification

Phase 6 is a local/CI contract-certification phase. It does **not** claim that the production lifecycle has been executed.

The following still require separately authorized production certification after the forward migrations and code are deliberately activated:

- real Stripe checkout and webhook entitlement grant
- real customer upload and admission transaction
- real worker claim, lease, parser, renderer, and artifact creation
- real atomic publication transaction
- real customer listing projection
- real signed report download
- real retry/recovery/entitlement-restoration behavior
- scheduler activation behavior

No local simulator may substitute for that production evidence.

## 8. Carried launch gates and warnings

Phase 6 does not silently convert unrelated warnings into success.

The following remain carried forward:

- the inherited Vercel Hobby function-budget gate of 15 deployable functions versus the certification limit of 12
- production application of the Phase 1 through Phase 5 forward migrations remains pending
- production deployment remains pending
- production lifecycle certification remains pending
- scheduler activation remains pending under its own authority
- `npm ci` reports 29 dependency audit findings: 3 low, 5 moderate, and 21 high; these require a separate dependency-security review and are not repaired by Phase 6
- the production build still warns that browser metadata is stale and that the main JavaScript chunk is larger than 500 kB after minification; these are optimization/maintenance items rather than Phase 6 lifecycle-contract failures

The dependency audit findings must not be dismissed merely because the Phase 6 contract smoke and build passed.

## 9. Production and main remain unchanged

At Phase 6 closure:

- production `main` remains `b69d8dd3911449b82c94770d51f22302e47adcd9`
- no Phase 6 code has been merged into `main`
- no Phase 1 through Phase 5 recovery migration has been applied by Phase 6
- no production deployment has been initiated by Phase 6
- no scheduler has been activated
- no production database row or Storage object has been mutated by Phase 6
- no customer report or entitlement has been consumed by Phase 6 certification

## 10. Closure state

Phase 6 is **CLOSED ON THE ISOLATED BRANCH** because the false lifecycle test authority has been repaired and the exact Phase 6 code checkpoint passed isolated CI certification plus a full production build.

This closure does not authorize production activation.

The next roadmap phase must inherit the Phase 1 through Phase 6 authorities, the unresolved deployment/security gates above, and the rule that production certification is evidence after activation, not a substitute for safe activation planning.
