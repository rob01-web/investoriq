# InvestorIQ Roadmap

Current date: July 31, 2026 at 1:47 PM ET

## Operating rules

- Document-driven only.
- Deterministic math and source binding.
- Core-gated Publish-or-Collapse.
- No fabricated narrative.
- No BUY/SELL language or investment recommendations.
- Premium remains exactly false until separately authorized.
- Screening and Full Underwriting launch together, or neither is considered fully launched.
- Use bounded packets with a stop gate before each production-changing action.

## Completed phases

- H0: authority freeze and handoff consolidation — complete.
- H0.5: determinism and reproducibility — complete.
- H0.75: Publish-or-Collapse tiering — complete.
- H1: authenticated identity and authorization — complete.
- H2: deployed schema/RLS/storage verification — complete.
- H3: Stripe receipt and entitlement atomicity — complete.
- H4: bundle entitlement creation — complete.
- H5: staged-source admission and registration — complete.
- H6: worker claim, lease, fencing, and recovery — complete.
- H7: deterministic core/support taxonomy — complete.
- H8: terminal outcomes and exactly-once restoration — complete.
- H9: revision lineage and corrected/replacement revisions — complete.
- H10: publication, artifacts, and Report History — complete.
- H11: customer/admin state convergence — complete.
- H12: Full Underwriting identity and legacy firewall — complete.
- H13: Full Underwriting view model and source binding — complete.
- H14: deterministic lender calculations and metrics — complete.
- H15: Full Underwriting renderer/content contract — complete.
- H16: manifest/PDF certification — complete.
- H17: controlled replay determinism — complete.
- H18: governed-canary readiness — complete.
- H19: simultaneous launch certification — complete.

## Launch execution progress

Completed:
1. Production branch integration.
2. Rollback branch and rollback commit established.
3. Gate 4 production pre-check.
4. H9-H10 migration production-schema mismatch identified.
5. Migration repaired to use `analysis_jobs.status` and `analysis_jobs.report_id -> reports.id`.
6. Targeted repository tests passed.
7. Repaired migration applied to production.
8. Post-migration schema, constraint, index, function, trigger, compatibility, and invariant checks passed.
9. `main` pushed to GitHub.
10. Vercel Production deployed commit `ae144dd0d1bda5411ab9373c92b25910a8ca98a7` successfully.
11. Live homepage and pricing page loaded successfully.

Still open:
1. Verify bundle Vercel and Stripe price variables read-only.
2. Run one governed live Full Underwriting canary.
3. Review the resulting PDF against the institutional Full Underwriting contract.
4. Decide whether any renderer/content repair is needed.
5. Correct customer-facing bundle copy.
6. Enable bundle purchasing only after exact price configuration is verified.
7. Run simultaneous launch certification/canary evidence closeout.
8. Update final launch documentation.

## Immediate next packet: Full Underwriting live proof

Goal:
- Prove that H12-H17 produce a genuine Full Underwriting deliverable in production, not a weak Acquisition Memo with a stronger label.

Preconditions:
- Owner explicitly authorizes one live Full Underwriting canary.
- Suitable T12, Rent Roll, and at least one approved support document are selected.
- Premium remains false.
- RETEST 39 remains unauthorized unless separately approved.
- Credit/entitlement and restoration behavior are documented before execution.

Required review checklist:
- Correct public identity: Full Underwriting / underwriting / approved base mode.
- No Screening or legacy Acquisition Memo masquerade.
- Source register and traceability.
- Calculation methodology appendix.
- DSCR, debt yield, LTV, mortgage constant, annual debt service.
- Break-even occupancy and break-even rent where supported.
- DSCR-constrained proceeds and sensitivities where supported.
- Rent-roll rollover/expiry concentration where evidence supports it.
- Risk and diligence register.
- Unresolved questions and explicit limitations.
- Evidence quality summary.
- Manifest/PDF agreement and certification.
- Professional institutional depth and usable narrative.
- No unsupported appraisal, legal, environmental, IRR, equity multiple, exit projection, BUY/SELL, or lender-approval claims.

Decision after canary:
- PASS: report meets Full Underwriting standard; proceed to copy/configuration closeout.
- HOLD: isolate the smallest renderer/content defect and repair before broader launch.

## Bundle configuration and copy packet

Current live state:
- Display price: `$699`.
- Purchase state: `PRICING UNAVAILABLE`.
- Internal engineering language is visible on the customer card.

Required sequence:
1. Read-only verify `VITE_STRIPE_PRICE_ID_BUNDLE` in Vercel.
2. Read-only verify `STRIPE_PRICE_BUNDLE` and the actual Stripe price/product.
3. Confirm `$699`, one-time payment, and exactly 2 Screening + 1 Full Underwriting entitlement.
4. Correct customer-facing copy.
5. Change configuration only with a separate explicit authorization.
6. Redeploy and verify the button becomes `LOG IN TO PURCHASE`.

Preferred customer-facing bundle direction:
- Eyebrow: `LAUNCH BUNDLE`.
- Title: `Investor Launch Bundle`.
- Price basis: `$699 USD | FLAT FEE | 3 REPORTS`.
- Composition: `2 Screening Reports` and `1 Full Underwriting Report`.
- Savings: `$198 compared with purchasing separately`.
- No subscription.
- Remove authentication, entitlement, server-side, frozen, and internal launch-control wording.

## Frozen safety boundaries

Until separately authorized:
- No additional migration.
- No direct production data edit.
- No Stripe or Vercel variable change.
- No Premium activation.
- No RETEST 39.
- No uncontrolled purchase or report run.
