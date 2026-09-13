# InvestorIQ Clean-Room Continuation

**Date:** 2026-09-13
**Status:** CURRENT CONTINUATION AUTHORITY

Continue from legacy branch `launch-certification-20260913`.

Read first:

1. `CHAT_HANDOFF/04_PRODUCT_CONSTITUTION.md`
2. `CHAT_HANDOFF/08_CLEAN_ROOM_MIGRATION_AUTHORITY.md`
3. `CHAT_HANDOFF/09_CLEAN_ROOM_MIGRATION_LEDGER.md`
4. `CHAT_HANDOFF/05_REPOSITORY_CERTIFICATION_PLAN.md`
5. `CHAT_HANDOFF/07_REPOSITORY_TRACKED_FILE_CENSUS.md`
6. `CHAT_HANDOFF/00_CURRENT_HANDOFF.md`

Owner decision: move toward a clean-room InvestorIQ runtime while preserving the existing repository intact as evidence, history, and production reference.

Do not bulk-copy the legacy repository. Continue the deterministic legacy audit and assign every production-relevant file one migration disposition: MIGRATE, MIGRATE AFTER REPAIR, REWRITE, or DO NOT MIGRATE.

The entire `api/` runtime tree has already been traversed in the current audit. Its initial clean-room dispositions are seeded in `09_CLEAN_ROOM_MIGRATION_LEDGER.md`.

Exact legacy census restart point: `CHAT_HANDOFF/04_PRODUCT_CONSTITUTION.md` was already read. Continue with the remaining governing/census files from that checkpoint, while treating `08` and `09` as current migration authority.

Do not deploy, apply migrations, activate schedulers, mutate Supabase or Storage, mutate Stripe, replay historical jobs, or activate DocRaptor production mode.

The clean repository must begin empty except for clean-room governance/skeleton files. Nothing from legacy crosses the border until reviewed and intentionally accepted.
