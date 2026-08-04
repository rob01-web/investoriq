# InvestorIQ Roadmap

Current authority:
- `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`
- `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`
- `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-04.md`

Operating rules:
- Document-driven only.
- Fail-closed behavior.
- Deterministic math.
- Institutional tone.
- No hype.
- No BUY/SELL language.
- No fabricated narrative.
- No unnecessary duplication between Screening and Underwriting.
- Premium remains exactly false until separately authorized.

Current state (August 4, 2026):
- H0 through H10 complete (including H6 correction `9950ab0`).
- Parser rescue `a06b897` is an ancestor of current main.
- Governed requeue production RPC installed and verified.
- Exact-job worker isolation deployed (`05ccee4`, `process_exact_queued_job`).
- Governed-retry parser resume deployed (`1bceb47`).
- Legacy GitHub automatic schedule paused; `workflow_dispatch` retained.
- RETEST 39 has two attempts (initial + one governed requeue); not authorized for a third requeue in this closeout.
- RETEST 40 must not be created.
- Premium remains false.

## Completed recent sequence

| Item | Commit / proof | Status |
|------|----------------|--------|
| Parser rescue (`sourceContentSha256`) | `a06b897` | Deployed |
| Governed requeue RPC | production verified | Complete |
| Exact-job isolation | `05ccee4` | Deployed |
| RETEST 39 attempt 2 diagnosis | MISSING_STRUCTURED_FINANCIAL_ARTIFACTS / failed T12 not reparsed | Complete |
| Two-worker mapping | GH schedule most likely claim source | Complete |
| Legacy schedule pause | `worker-kick.yml` schedule commented; dispatch kept | Complete |
| Governed-retry parser resume | `1bceb47` | Deployed Ready / Latest / Current |
| Targeted smokes | parser-resume, exact-job, H6, governed-requeue, `git diff --check` | PASS |

## Remaining sequence

1. **Next packet:** production verification only for `1bceb47` (origin/main + Vercel Production align; parser-resume gate present; GH schedule paused; `workflow_dispatch` present; no Vercel cron; zero production mutations).
2. Only after verification PASS, owner may separately authorize exactly one further governed RETEST 39 requeue + immediate exact-job invocation.
3. Retire legacy GitHub worker only after successful Vercel-controlled proof.
4. Continue launch hygiene under explicit packets only.
5. Premium remains off.

## Horizon checklist

| Horizon | Focus | Exit criteria | Status |
|---------|-------|---------------|--------|
| H0 | Owner and authority freeze | Authority docs frozen and operable | Complete |
| H1–H2 | Doctrine and product boundaries | Product doctrine stable | Complete |
| H3 | Receipt and entitlement binding | Atomic, idempotent, owner-bound | Complete |
| H4 | Bundle entitlement creation | Exact entitlements only | Complete |
| H5 | Submission, adjudication, reservation, source registration | Deterministic and recoverable | Complete |
| H6 | Worker claim, lease, fencing, deadlines | One claim per job; safe lease expiry | Complete |
| H7 | Core/support classification and causal taxonomy | Stable and testable | Complete |
| H8 | Terminal outcome, manifest, restoration | Explicit terminals; no double-grant | Complete |
| H9 | Corrected and replacement revisions | Lineage-preserving | Complete |
| H10 | Publication, artifacts, Report History | Delivery state matches artifacts | Complete |
| Post-H10 | Governed admin retry | Production RPC verified; parser-resume deployed | Complete (source + production RPC + parser-resume) |
| Post-H10 | Exact-job isolation | `process_exact_queued_job` deployed | Complete |
| Post-H10 | Two-worker isolation | GH automatic schedule paused; Vercel proof pending | Partial — schedule paused; proof next |
