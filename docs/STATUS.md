# InvestorIQ Status

Current date: July 30, 2026

Current authority:
- Treat the uploaded `!INVESTORIQ_CURRENT_GAMEPLAN_HANDOFF_UPDATED_2026-07-28.md` file as the practical daily handoff until this structure is fully established.
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 is not authorized.
- Implementation has not begun from the merged plan.
- Audit work is not merged to main.
- Production migration is not authorized.
- Deployment is not authorized.
- Production data change is not authorized.
- Stripe configuration change is not authorized.
- Live canary is not authorized.
- Live retest is not authorized.

Current phase:
- H8 Terminal outcome, manifest, and restoration complete.

Local completion status:
- Branch: `investigation/full-repo-underwriting-audit`
- H1-A read-only identity/authorization map completed with no edits
- H1-B commit: `f59e748` - harden authenticated report identity boundaries
- Latest implementation commit: `e0ab1fd3e16e9407a037a66592a1f25dac68104f` - Complete H8 restoration event consistency
- Latest documentation commit: `fb6fe527a3327cc01504ded6fc294a2e4f23fc13` - Record H8 restoration completion
- H2-B1 migration: `20260728000100_h2b1_staged_uploads_private.sql`
- H2-B2 migration: `20260728000200_h2b2_report_purchases_update_policy_cleanup.sql`
- Deployed verification: PASS
- H3 duplicate Stripe webhook delivery is idempotently recovered
- H3 existing, partial-existing, and concurrent unique-conflict entitlement rows are validated against user_id and product_type
- H3 consume_purchase_and_create_job remains the atomic entitlement-consumption path
- H4 implementation commit: `98625f2` - Implement atomic bundle entitlement creation
- Bundle composition is exactly 2 Screening entitlements and 1 Underwriting entitlement
- Bundle entitlement identifiers are deterministic: `sessionId`, `sessionId#2`, `sessionId#3`
- Bundle quantity is fixed to exactly one per checkout
- No `bundle` value is persisted as `report_purchases.product_type`
- Duplicate, partial-existing, and concurrent bundle delivery recovery are verified
- Frozen prices are Screening `$199`, Full Underwriting `$499`, and Bundle `$699`
- H5-A read-only flow map completed
- H5-B implementation commit: `c7aea52` - Harden staged source registration
- Staged-source manifest is validated before entitlement selection or job/source creation
- Each staged path uses the authenticated `staged/{auth.uid()}/` prefix, is unique, safe, and matched against a locked `storage.objects` row in `staged_uploads`
- `doc_type` is explicit and restricted to approved aliases
- Missing, forged, duplicated, unsafe, cross-user, or materially mismatched staged sources fail closed
- Entitlement selection still uses `FOR UPDATE SKIP LOCKED`
- Job creation, source registration, and entitlement consumption remain atomic inside `consume_purchase_and_create_job`
- No migration has been applied
- No deployment occurred
- No production data changed
- No Stripe configuration changed
- Premium remains false
- RETEST 39 remains unauthorized
- H6-A read-only worker claim, lease, fencing, deadline, and dead-letter recovery map completed
- H6 correction completed
- H6-B implementation commit: `9950ab0` - Repair expired worker recovery discovery
- Claimed-by identity is part of the worker fence
- Explicit worker attempt identity added
- Lease expiry and deterministic reclaim behavior added
- Stale worker writes are fenced by the current attempt identity
- Entitlement restoration is atomic and fenced to the current attempt
- Expired leases terminalize through a dedicated current-attempt recovery RPC
- Retry exhaustion now produces an explicit dead-letter boundary
- Undefined split claim/requeue authority is replaced by repository-defined contracts
- H6 is complete only after all validations pass
- No migration has been applied
- No deployment occurred
- No production data changed
- No Stripe configuration changed
- Premium remains false
- RETEST 39 remains unauthorized
- H7-A read-only core/support classification and causal-taxonomy map completed
- H7 correction completed
- H7-B implementation commit: `c517b90` - Lock deterministic H7 support taxonomy authority
- Deterministic support taxonomy is now repository-defined
- AI hints cannot influence canonical support classification
- H5 admission and H7 semantic adjudication remain separate
- Long-tail support resolves to `other_support` and remains non-quantitative
- Existing deterministic support classifications remain unchanged
- Three-run repeatability is proven by the H7 contract smoke
- H7 complete
- H8-A read-only terminal outcome, manifest, publication-handoff, and restoration map completed
- H8-B entitlement-restoration event consistency completed
- `restoreEntitlementForFailedJob` is the sole authoritative writer of successful `entitlement_restored` events
- Failed and dead-letter restoration events record the actual terminal status
- Timeout restoration produces exactly one restoration RPC success, one restoration artifact, and one restoration database event
- Duplicate, stale, published, queued, active, and requeued restoration attempts fail safely
- Existing H6 worker-attempt, claimed-by, terminal-status, and exactly-once restoration fencing remains unchanged
- H8 implementation commits are `697d652` - Repair H8 restoration event consistency and `e0ab1fd3e16e9407a037a66592a1f25dac68104f` - Complete H8 restoration event consistency
- H8 complete
- No migration has been applied
- No deployment occurred
- No production data changed
- No Stripe configuration changed
- Premium remains false
- RETEST 39 remains unauthorized

Next boundary:
- H9 Corrected and replacement revisions

Next authorized step:
- Set next operating mode to bounded packet mode.
- Set next authorized packet to H9-A read-only corrected/replacement revision, lineage, reroute, duplicate-charge, and duplicate-report-state map.

Operating mode:
- bounded packet mode

Daily handoff instruction:
- Use this status file first in fresh chats.
- Do not implement, migrate, deploy, activate Premium, run RETEST 39, change production data, commit, push, merge, or clean archives unless the current phase explicitly authorizes it.

Frozen owner decisions:
- Screening launch price is $199.
- Full Underwriting launch price is $499.
- The launch bundle is approximately $699 for exactly two Screening entitlements and one Full Underwriting entitlement.
- Screening and Full Underwriting launch simultaneously, or neither launches.
- V2/base is the only public Full Underwriting launch foundation.
- Premium Acquisition Underwriting remains false.
