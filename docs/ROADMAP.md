# InvestorIQ Roadmap

Current authority:
- `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`
- `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`
- `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md` (Aug 2 parser rescue; Aug 3–4 governed-requeue closeout)

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

Current state:
- H0 through H10 complete (including H6 correction `9950ab0`).
- Parser rescue `a06b897` is an ancestor of current main.
- Governed requeue source wiring is on main at `b86872f`.
- Production Supabase has **not** yet received migration `20260803000100_governed_requeue_worker_job.sql`.
- Exact-job worker isolation remains open.
- RETEST 39 is not requeued; RETEST 40 must not be created.

## Aug 2, 2026 — Parser rescue and RETEST 39

- Spreadsheet T12 and Rent Roll paths define `sourceContentSha256` after buffer creation; Textract path unchanged.
- RETEST 39 failed once with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` due to missing hash definitions (not a customer-document defect). Credit restored.
- **RETEST 39 is not requeued. RETEST 40 must not be created.**

## Aug 3–4, 2026 — Governed requeue closeout

- Admin Dashboard Retry already targeted exact `job_id` via `requeue_failed_job`.
- Linked failed jobs could requeue; credit-restored jobs could not complete claim (`PURCHASE_NOT_CONSUMED`).
- Source repair delivered:
  - `public.governed_requeue_worker_job(p_job_id uuid, p_claimed_by text)`
  - migration + smoke + API wiring on main (`b86872f`)
- Terminal failed/dead-letter → governed RPC; expired-lease recovery → legacy `requeue_worker_job`.
- Permanent boundary: no GitHub Contents API full-file replacement on `api/admin-run-worker.js` or `api/parse/parse-doc.js`.

## Remaining sequence

1. **Next packet:** apply and verify production migration `20260803000100_governed_requeue_worker_job.sql` only (no RPC invoke, no RETEST 39, no worker run).
2. Map and implement smallest exact-job worker isolation.
3. Only after migration + isolation proof, consider a single explicitly authorized RETEST 39 retry (never RETEST 40).
4. Continue launch hygiene under explicit packets only.
5. Premium remains off.

| Horizon | Focus | Scope | Out of scope | Exit criteria | Status |
|---|---|---|---|---|---|
| H0 | Owner and authority freeze | Decision record and single-source authority | Code, deploy, RETEST | One clear owner authority document | Complete |
| H0.5 | Product doctrine lock | Doctrine text and controlling references | Runtime changes | Doctrine files govern all product work | Complete |
| H0.75 | Launch hygiene baseline | Repo hygiene and authority map | Live retests | Authority map is explicit and current | Complete |
| H1 | Intake and document classification | Core intake paths | Premium, later phases | Intake classification is stable | Complete |
| H2 | Pricing and product surface | Pricing surfaces and SKU presentation | Premium, production data edits | Pricing surface matches doctrine | Complete |
| H3 | Receipt and entitlement binding | Receipt creation and entitlement binding | Later phase work, production data changes, Premium, RETEST 39 | Receipt and entitlement consumption are atomic, idempotent, and owner-bound | Complete |
| H4 | Bundle entitlement creation | Bundle SKU wiring, entitlement creation, and purchase-path checks | Later phase work, production changes, Premium, RETEST 39 | Bundle purchase creates exactly the required entitlements and nothing extra | Complete |
| H5 | Submission, adjudication, reservation, source registration | Intake, adjudication, reservation, and source-registration logic | Later phase work, production changes, Premium, RETEST 39 | Submission state, reservation, and source registration are deterministic and recoverable | Complete |
| H6 | Worker claim, lease, fencing, deadlines | Worker claim semantics, lease fencing, deadline handling, and dead-letter recovery | Later phase work, production changes, Premium, RETEST 39 | One claim per job, leases expire safely, and stale work cannot win | Complete |
| H7 | Core/support classification and causal taxonomy | Source/evidence classification and failure taxonomy alignment | Later phase work, production changes, Premium, RETEST 39 | Core vs support taxonomy is stable, explicit, and testable | Complete |
| H8 | Terminal outcome, manifest, restoration | Terminal states, report manifesting, and exactly-once restoration behavior | Later phase work, production changes, Premium, RETEST 39 | Terminal outcomes are explicit and restoration paths do not double-grant or duplicate work | Complete |
| H9 | Corrected and replacement revisions | Corrected reruns, replacement revisions, and lineage-preserving reroute logic | Later phase work, production changes, Premium, RETEST 39 | Corrected and replacement revisions preserve lineage and avoid duplicate charge or duplicate report state | Complete |
| H10 | Publication, artifacts, Report History | Publication persistence, artifact tracking, and report-history surfaces | Later phase work, production changes, Premium, RETEST 39 | Published artifacts and report history match the actual delivery state | Complete |
| Post-H10 | Governed admin retry for credit-restored jobs | Atomic rebind + requeue RPC, dashboard wiring, production migration | RETEST 39 execute, RETEST 40, exact-job isolation, Premium | Source wiring on main; production migration applied and verified | Source complete; production migration pending |
