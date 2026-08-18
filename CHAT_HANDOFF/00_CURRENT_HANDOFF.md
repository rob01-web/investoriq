# INVESTORIQ — CURRENT CHAT HANDOFF

**Date:** 2026-08-18
**Status:** ACTIVE IMPLEMENTATION CHECKPOINT
**Current program:** P0 Pipeline Repair
**Master plan:** `01_MASTER_PLAN.md`

## CURRENT POSITION

InvestorIQ is in the controlled architectural repair program created after the full repository / production audit.

Dominant diagnosed root cause:

> **AUTHORITY ACCUMULATION** — newer authorities were layered over stale, duplicate, historical, or future-product authorities without retiring the old ones.

## P0-A1 — CLOSED / PRODUCTION VERIFIED

P0-A1 Security / Trust-Boundary Lockdown is CLOSED.

Production-verified effective state:

- `analysis_artifacts`: customer INSERT removed; authenticated SELECT remains temporarily for Dashboard compatibility.
- `analysis_job_files`: customer INSERT/UPDATE removed; customer SELECT remains.
- `analysis_jobs`: direct customer INSERT removed; customer SELECT remains.
- `report_purchases`: direct customer UPDATE/consumption removed; customer SELECT remains.
- `generated_reports`: customer INSERT removed; owned customer SELECT remains.
- `staged_uploads`: authenticated own-path INSERT intentionally preserved as the trusted source-byte intake foundation.
- `reports`: direct customer DELETE remains temporarily pending coordinated P0-A2 cutover.
- legacy `analysis-uploads`: new authenticated upload authority removed.

Privileged worker / recovery / revision RPCs are production-verified with:

- `anon = false`
- `authenticated = false`
- `service_role = true`

This includes claim, lease, transition, failure, requeue, entitlement restoration, legacy queue, and report-revision promotion authorities.

The sanctioned customer admission RPC remains:

`consume_purchase_and_create_job(text, jsonb, jsonb)`

with authenticated + service-role execution and no anonymous execution.

## EXACT NEXT PACKET — P0-A2

P0-A2 Customer-Safe Read / Report-Removal Boundary:

1. Replace Dashboard direct reads from internal `analysis_artifacts` with a governed customer-safe server endpoint.
2. Return only customer-sanctioned status/failure/delivery/entitlement-restoration/limited-coverage information.
3. Do not expose raw source-truth, QA, recovery, Premium, or operational artifact payloads.
4. Replace direct customer report deletion with a governed server action / retention-aware policy.
5. Migrate Dashboard to the governed paths.
6. After the new UI/API path is active, remove authenticated `analysis_artifacts` SELECT.
7. Remove the direct customer report DELETE RLS policy.

Do not revoke the remaining read/delete policies before their customer-facing replacements are deployed.

## HARD BOUNDARIES

- No fresh RETEST yet.
- RETEST 48 is a regression scenario, not the repair plan.
- No manual worker kick.
- No scheduler change.
- No pricing changes.
- Bundle pricing remains deferred.
- Premium remains OFF.
- Smoke tests have no constitutional authority over the target architecture.
- Do not reopen previously closed constitutional gates absent contradictory production evidence.

## CURRENT PRODUCTION FACTS TO PRESERVE

- Production automatic scheduler: Supabase Cron / pg_net.
- Job: `investoriq-admin-run-worker`.
- Schedule: `*/3 * * * *`.
- Full Underwriting intake remains intentionally strict.
- Downstream Core-Gated Publish-or-Collapse remains distinct from intake.
- Canonical downstream source modes:
  - `dual_source_core`
  - `t12_minimum_core`
  - `rent_roll_minimum_core`
  - `insufficient_core`

## PRODUCT CONSTITUTION

Current launch products:

- Screening
- Full Underwriting

Bundle is commerce only.

Premium is future-only and OFF.

Full Underwriting admission requires usable T12 + usable Rent Roll + at least one additional readable/adjudicable supporting document.

After valid admission, weak optional/support surfaces should qualify, compact, collapse, omit, or create a quality incident rather than destroy an otherwise valid-core report.

## FRESH-CHAT FILE RULE

For every normal fresh InvestorIQ chat, upload only:

1. `00_CURRENT_HANDOFF.md`
2. `01_MASTER_PLAN.md`

Update `00_CURRENT_HANDOFF.md` at the end of every session.

Update `01_MASTER_PLAN.md` only when the overall architecture materially changes.

Historical STATUS / ROADMAP / CANONICAL_HANDOFF files are archive material and must not be treated as current authority.

Permanent H0 / Product Doctrine files remain in the repository and are consulted only when a task directly requires them.
