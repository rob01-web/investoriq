# InvestorIQ Legacy Pointer to Clean-Room Continuation

**Updated:** 2026-09-13

This legacy repository is no longer the active build repository.

## Active build authority

Use the clean repository:

- GitHub: `rob01-web/investoriq-clean-v1`
- Local path: `C:\Users\robmc\Desktop\InvestorIQ\InvestorIQ-Clean-v1`
- Branch: `main`
- visibility: PRIVATE

Read these clean-repo handoff files first:

1. `docs/03_FRESH_CHAT_PROMPT.md`
2. `docs/00_CURRENT_HANDOFF.md`
3. `docs/01_MASTER_PLAN.md`
4. `docs/CLEAN_ROOM_CONSTITUTION.md`
5. `docs/MIGRATION_LEDGER.md`
6. `docs/migration-receipts/001-product-constitution.md`
7. `docs/migration-receipts/002-strict-intake-admission.md`
8. `docs/migration-receipts/003-parser-routing-boundary.md`

## Exact certified clean runtime checkpoint

`6f9fcb8d0d15a90a69d0bd24c5a389bc96176595`

Local clean certification at that checkpoint:

- tests: 30
- pass: 30
- fail: 0
- final worktree: CLEAN

## Clean clusters closed

- Cluster 001: Product Constitution
- Cluster 002: Strict Intake Admission
- Cluster 003: Parser Routing Boundary

## Next work

Start Cluster 004 only:

**Parser Candidate Contracts**

Do not build Source Truth yet.

Do not restart the legacy `api/` census.

Do not resume broad repair-in-place.

Use this legacy repository only as reference/evidence for bounded clean-room migrations.

## Clean-room doctrine

One responsibility cluster at a time:

`inspect -> decide -> design clean responsibility -> implement/migrate -> tests -> residual scan -> exact diff -> runtime commit -> certification receipt -> local sync/test`

No bulk copying.

Every production-relevant legacy responsibility must be explicitly classified as `MIGRATE`, `MIGRATE AFTER REPAIR`, `REWRITE`, or `DO NOT MIGRATE` before crossing.

The clean target architecture remains:

`Intake -> Parsing Candidates -> Source Truth -> Canonical Calculations -> Screening / Investment Committee Memorandum -> Publication Certification -> Delivery`

## Production hold

The clean repository is isolated from production.

Do not deploy it, connect it to live Vercel, change DNS, apply Supabase migrations, mutate live Supabase/Stripe, activate schedulers, replay historical jobs, change DocRaptor production mode or cut over production without explicit owner authorization after independent clean-system certification.

## Legacy preservation

Keep this legacy branch and all archived/history material intact. Do not delete the verified external backups.
