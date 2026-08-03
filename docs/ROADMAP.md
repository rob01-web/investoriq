# InvestorIQ Roadmap

Current authority:
- `docs/INVESTORIQ_PRODUCT_DOCTRINE.md`
- `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`
- `docs/PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md`
- `!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-07-31.md` (and Aug 2 STATUS/ROADMAP addenda)

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
- H0 complete.
- H0.5 complete.
- H0.75 complete.
- H1 complete.
- H2 complete.
- H3 complete.
- H4 complete.
- H5 complete.
- H6 correction completed.
- H6 correction commit: `9950ab0` - Repair expired worker recovery discovery.

## Aug 2, 2026 — Parser rescue and RETEST 39 status

- `origin/main` source of truth is `a3dfb5f` (includes parser fix `a06b897` and docs record commits `9e12f88` / `a3dfb5f`).
- Spreadsheet T12 and Rent Roll paths define `sourceContentSha256` after buffer creation; import of `buildSourceContentSha256` is present. Textract path unchanged.
- RETEST 39 executed once and failed with `MISSING_STRUCTURED_FINANCIAL_ARTIFACTS` due to the missing hash definitions (not a customer-document defect). Credit restored.
- **RETEST 39 is not requeued.**
- **RETEST 40 must not be created.**
- Next action: verify Vercel Production deployment for `a06b897` is Ready before any governed RETEST 39 retry decision.
- No broad tests, no source-code changes outside authorized packets, no Premium activation.

Remaining sequence (unchanged policy):
- Confirm production deployment health for the parser fix.
- Only then consider a single governed RETEST 39 retry if explicitly authorized.
- Continue H-series completion hygiene only under explicit packets.
- Premium remains off.

| Horizon | Focus | Scope | Out of scope | Exit criteria | Status |
|---|---|---|---|---|---|
| H0 | Owner and authority freeze | Decision record and single-source authority | Code, deploy, RETEST | One clear owner authority document | Complete |
| H0.5 | Product doctrine lock | Doctrine text and controlling references | Runtime changes | Doctrine files govern all product work | Complete |
| H0.75 | Launch hygiene baseline | Repo hygiene and authority map | Live retests | Authority map is explicit and current | Complete |
| H1 | Intake and document classification | Core intake paths | Premium, later phases | Classification is deterministic and fail-closed | Complete |
| H2 | Screening core | Screening math and report surface | Underwriting expansion, Premium | Screening is stable and institutional | Complete |
| H3 | Receipt and entitlement atomicity | Receipt creation and entitlement binding | Later phase work, production data changes, Premium, RETEST 39 | H3-A receipt/entitlement map; H3-B smallest atomicity patch | Receipt and entitlement consumption are atomic, idempotent, and owner-bound | Complete |
| H4 | Bundle entitlement creation | Bundle SKU wiring, entitlement creation, and purchase-path checks | Later phase work, production changes, Premium, RETEST 39 | H4-A bundle map; H4-B smallest bundle creation patch | Bundle purchase creates exactly the required entitlements and nothing extra | Complete |
| H5 | Submission, adjudication, reservation, source registration | Intake, adjudication, reservation, and source-registration logic | Later phase work, production changes, Premium, RETEST 39 | H5-A flow map; H5-B smallest reservation/adjudication patch | Submission state, reservation, and source registration are deterministic and recoverable | Complete |
| H6 | Worker claim, lease, fencing, deadlines | Worker claim semantics, lease fencing, deadline handling, and dead-letter recovery | Later phase work, production changes, Premium, RETEST 39 | H6-A worker map; H6-B smallest fencing patch | One claim per job, leases expire safely, and stale work cannot win | Complete |
| H7 | Core/support classification and causal taxonomy | Source/evidence classification and failure taxonomy alignment | Later phase work, production changes, Premium, RETEST 39 | H7-A taxonomy map; H7-B smallest classifier patch | Core vs support taxonomy is stable, explicit, and testable | Complete |
| H8 | Terminal outcome, manifest, restoration | Terminal states, report manifesting, and exactly-once restoration behavior | Later phase work, production changes, Premium, RETEST 39 | Completed in the H8 restoration packet | Terminal outcomes are explicit and restoration paths do not double-grant or duplicate work | Complete |
| H9 | Corrected and replacement revisions | Corrected reruns, replacement revisions, and lineage-preserving reroute logic | Later phase work, production changes, Premium, RETEST 39 | Completed in the H9-H10 packet | Corrected and replacement revisions preserve lineage and avoid duplicate charge or duplicate report state | Complete |
| H10 | Publication, artifacts, Report History | Publication persistence, artifact tracking, and report-history surfaces | Later phase work, production changes, Premium, RETEST 39 | Completed in the H9-H10 packet | Published artifacts and report history match the actual delivery state | Complete |
