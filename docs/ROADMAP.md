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

Current state (August 5, 2026):
- H0 through H10 complete (including H6 correction `9950ab0`).
- Implementation HEAD before this docs closeout: `6c5c4e8` (dead_letter status constraint).
- Ancestors: `087f97d` (fail_exact_expired_worker_job), `1bceb47` (governed-retry parser resume), `a06b897` (parser rescue).
- RETEST 39 terminal `dead_letter` (attempt 3, TIMEOUT during rendering); commercial integrity PASS.
- Governed parser-resume proof: PASS. End-to-end publication: HOLD.
- Production worker: Supabase pg_cron job 1 (`investoriq-admin-run-worker`, `*/3 * * * *`) active again.
- Legacy GitHub automatic schedule remains paused; `workflow_dispatch` retained.
- RETEST 40 must not be created.
- Premium remains false.

## Completed recent sequence

| Item | Commit / proof | Status |
|------|----------------|--------|
| Parser rescue (`sourceContentSha256`) | `a06b897` | Deployed |
| Governed requeue RPC | production verified | Complete |
| Exact-job isolation | `05ccee4` | Deployed |
| RETEST 39 attempt 2 diagnosis | MISSING_STRUCTURED_FINANCIAL_ARTIFACTS / failed T12 not reparsed | Complete |
| Legacy GH schedule pause | `worker-kick.yml` schedule commented; dispatch kept | Complete |
| Governed-retry parser resume | `1bceb47` | Deployed; attempt 3 advanced to rendering (PASS) |
| Exact expired recovery action | `087f97d` | Deployed; invoked once → dead_letter |
| Dead-letter status constraint | `6c5c4e8` + production apply | Complete |
| RETEST 39 terminal recovery | exact recovery; entitlement_restored ×1; no 4th attempt | Complete |
| Production scheduler mapping | Supabase pg_cron job 1 `*/3` via pg_net | Mapped; active |

## Remaining sequence

1. **Next packet:** read-only rendering-timeout investigation for RETEST 39 attempt 3 (where rendering stopped; partial artifacts; Vercel timeout / PDF latency / OOM / abort / exception; smallest safe source repair; zero production mutation).
2. Do not authorize another RETEST 39 requeue.
3. Do not authorize RETEST 40.
4. Do not permanently retire GitHub fallback yet.
5. Continue launch hygiene under explicit packets only.
6. Premium remains off.

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
| Post-H10 | Governed admin retry | Production RPC verified; parser-resume deployed | Complete |
| Post-H10 | Exact-job isolation | `process_exact_queued_job` + `fail_exact_expired_worker_job` deployed | Complete |
| Post-H10 | Dead-letter status constraint | Production CHECK includes `dead_letter` | Complete |
| Post-H10 | Two-worker isolation | GH schedule paused; Supabase pg_cron mapped and controlled | Complete (mapping + pause/restore proven) |
| Post-H10 | RETEST 39 commercial closeout | dead_letter; exactly-once entitlement; no 4th attempt | Complete |
| Post-H10 | End-to-end publication proof | Live published underwriting PDF under controlled recovery | HOLD — rendering timeout |
