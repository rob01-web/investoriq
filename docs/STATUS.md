# InvestorIQ Status

Current date: August 2, 2026

Current authority:
- Treat `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md` as the practical daily handoff (with Aug 2 addendum below).
- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`.
- Premium assignment remains `false`.
- RETEST 39 has executed once after H6 production migration; it is **not authorized for requeue**.
- RETEST 40 must **not** be created.
- Production retry / live retest must wait until Vercel deployment for `a06b897` is Ready.
- No broad tests, no manual deploy, no source-code edits outside explicitly authorized packets.

## Aug 2, 2026 — Parser rescue and RETEST 39 record

Repository state (verified):
- Branch: `main`
- HEAD / origin/main: `a06b897` — `fix(parser): hash spreadsheet T12 and rent-roll sources`
- Working tree: clean
- `api/parse/parse-doc.js` restored and verified (~259 KB, exactly three `buildSourceContentSha256` sites: import + Rent Roll spreadsheet branch + T12 spreadsheet branch; Textract path untouched)

RETEST 39 incident:
- Job `084a982e-ff6e-49b0-a7f7-473ed314aada` reached worker execution after H6 production migration was applied.
- H6 production schema verified: 7 worker columns, 2 worker constraints, 10 H6 functions, service_role EXECUTE true for all 10.
- Failure outcome: `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS`.
- Root cause was **not** a customer bad-document issue.
- T12 spreadsheet parser accepted core fields, then crashed because spreadsheet branches referenced `sourceContentSha256` without defining it.
- Platform incorrectly discarded an otherwise valid T12 artifact and classified the result as missing structured financial artifacts.
- Customer-facing error guidance was inadequate (did not tell the user what to do next).
- Credit / entitlement was restored.
- RETEST 39 has **not** been requeued.
- RETEST 40 must **not** be created.
- Production retry must wait until Vercel deployment for `a06b897` is Ready.

Parser rescue:
- GitHub API / large-file tool writes temporarily corrupted `api/parse/parse-doc.js` to placeholder content.
- Local Windows repo backup preserved the full parser.
- Branch `rescue/restore-parse-doc` restored the full parser and added:
  1. `buildSourceContentSha256` import from `../_lib/recovery-content-hash-cache.js`
  2. `sourceContentSha256` definition after `Buffer.from(arrayBuffer)` in the Rent Roll spreadsheet branch
  3. `sourceContentSha256` definition after `Buffer.from(arrayBuffer)` in the T12 spreadsheet branch
- Final repair landed on `main` as `a06b897`.
- **Policy:** GitHub API / connected large-file write tools must **not** be used for future writes to `api/parse/parse-doc.js`. Use normal local git commit + push for this large file.

Next boundary:
- Wait for Vercel production deployment of `a06b897` to report Ready.
- Only then consider a separately authorized production retry of the failed RETEST 39 path (do not create RETEST 40).
- Premium remains false. No Stripe/Vercel bundle configuration change without explicit authorization.

---

Historical status body (pre-Aug 2; retained for evidence continuity):

Current phase:
- H9 Corrected and replacement revisions complete.
- H10 Publication, artifacts, and Report History complete.
- H11 Customer/admin state convergence complete.
- H12-H13 Full Underwriting identity, legacy firewall, view model, and source binding complete.
- H14-H15 Full Underwriting calculations and renderer/content contract complete.
- H16-H17 Manifest/PDF certification and controlled replays complete.
- H18 Governed canary readiness complete.
- H19 Simultaneous launch certification complete.
- Launch deployment preparation complete.
- Repository verdict: ready for separately authorized deployment/canary packet.

Local completion status:
- Branch: `investigation/full-repo-underwriting-audit`
- H1-A read-only identity/authorization map completed with no edits
- H1-B commit: `f59e748` - harden authenticated report identity boundaries
- H9 complete: corrected/replacement lineage, idempotency, no-double-charge, and current-revision authority proved
- H10 complete: publication persistence, artifact/history agreement, and current-download selection proved
- H11 complete: shared customer/admin state resolver, explicit current-authority selection, and convergence smoke proved
- H12-H13 complete: canonical public Full Underwriting identity, legacy firewall, source binding, manifest agreement, and renderer fence proved
- H14 complete: deterministic lender metrics, formula labels, provenance, and explicit unavailable states proved
- H15 complete: renderer/content contract, methodology, limitations, and prohibited-content boundaries proved
- H16 complete: manifest/PDF certification, bounded recovery, and artifact binding proved
- H17 complete: controlled replay determinism, normalized PDF equivalence, and duplicate artifact prevention proved
- H18 complete: repository-defined governed-canary readiness, explicit owner authorization gating, rollback evidence, and external prerequisite identification proved
- H19 complete: repository simultaneous-launch certification, simultaneous Screening/Full Underwriting readiness, and separate deployment/canary boundary proved
- Latest implementation commit: `4e2c043` - Prove governed canary and simultaneous launch certification
- Migration created but not applied: `20260730000100_h9_h10_report_revision_lineage.sql`
- Migration classifications: `20260728000100_h2b1_staged_uploads_private.sql` = `already_proven_applied`; `20260728000200_h2b2_report_purchases_update_policy_cleanup.sql` = `already_proven_applied`; `20260730000100_h9_h10_report_revision_lineage.sql` = `required_before_deployment`
- Latest documentation correction commit: `5906ae6` - Correct launch migration readiness record
- Latest documentation commit: `Record launch deployment preparation`
- Production/default branch: `main`
- Branch relationship: `investigation/full-repo-underwriting-audit` is ahead of `main` by 72 commits, behind 0; `main` is the ancestor and fast-forward is the safest integration method.
- Migration order: `20260728000100_h2b1_staged_uploads_private.sql` already proven applied, `20260728000200_h2b2_report_purchases_update_policy_cleanup.sql` already proven applied, `20260730000100_h9_h10_report_revision_lineage.sql` required before deployment and before the first production cutover that depends on H9/H10 schema fields.
- Vercel variables to confirm before execution: `VITE_STRIPE_PRICE_ID_SCREENING`, `VITE_STRIPE_PRICE_ID_UNDERWRITING`, `VITE_STRIPE_PRICE_ID_BUNDLE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SITE_URL`, `ADMIN_RUN_KEY`, `CRON_SECRET`, `REPORT_DOWNLOAD_ARTIFACT_MODE`, `ALLOW_PRODUCTION_PDF`, `DOCRAPTOR_MODE`, `DOCRAPTOR_API_KEY`, `REPORT_PUBLICATION_TARGET`.
- Stripe variables to confirm before execution: `STRIPE_PRICE_SCREENING`, `STRIPE_PRICE_UNDERWRITING`, `STRIPE_PRICE_BUNDLE`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Rollback target: controlled revert to the last known good release packet; rollback evidence must record branch, deployed commit, migration state, Stripe IDs, Vercel config presence, report outcomes, entitlement restoration, Premium false, RETEST 39 unauthorized, and the rollback decision.
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
- H8 read-only terminal outcome, manifest, publication-handoff, and restoration completed
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
- Separately authorized launch execution: production-branch integration, required migration application, Stripe/Vercel reconciliation, deployment, and governed simultaneous canary

Next authorized step:
- Set next operating mode to bounded packet mode.
- Set next authorized packet to Launch execution packet - perform only explicitly authorized integration, migration, configuration, deployment, and governed canary steps with a stop gate before each production-changing action.

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
