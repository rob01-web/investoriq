# InvestorIQ Launch Certification Checklist

**Status:** PENDING FRESH PRODUCTION CERTIFICATION
**Date:** 2026-08-18

Local QA and build evidence are prerequisites/supporting evidence only. They do not satisfy this checklist.

## Security / admission

- [ ] Customer cannot directly create internal jobs/artifacts.
- [ ] Customer cannot mutate authoritative processing metadata.
- [ ] Customer cannot execute privileged worker lifecycle RPCs.
- [ ] Customer cannot write generated-report Storage.
- [ ] Customer cannot promote foreign report revisions.
- [ ] Disclosure acknowledgement is enforced transactionally.
- [ ] Staged object existence / bytes / metadata are validated by the sanctioned admission boundary.

## Worker / recovery

- [ ] Supabase Cron invokes only the sanctioned worker path.
- [ ] One claim authority is active.
- [ ] Lease / attempt identity is correct.
- [ ] Retry ceiling is enforced.
- [ ] Recoverable yield uses the governed requeue authority.
- [ ] Exhausted jobs cannot loop indefinitely.
- [ ] Governed admin recovery is bounded and lineage-preserving.

## Source / products

- [ ] Canonical source truth is trusted-producer-only.
- [ ] One-source survivor behavior is proven in production.
- [ ] Catastrophic contradiction behavior is proven in production.
- [ ] Screening completes a real publication.
- [ ] Full Underwriting strict intake is enforced.
- [ ] Full Underwriting uses current product identity; historical Acquisition / `ic` has no launch authority.
- [ ] Premium is OFF and cannot veto current products.

## Publication / visibility

- [ ] One publication lane owns artifact persistence.
- [ ] PDF generation and certification complete.
- [ ] Partial-commit/idempotency recovery is proven.
- [ ] Generated report object is service-produced.
- [ ] Report row and Quality Manifest are exact.
- [ ] Job reaches `published` before revision promotion.
- [ ] Promotion is exact-lineage fenced.
- [ ] Only the current revision is customer-downloadable.
- [ ] Signed download succeeds.

## Failure / remedy

- [ ] Internal platform failures remain internal classifications.
- [ ] Customer-document insufficiency is used only for genuine customer-document insufficiency.
- [ ] Entitlement restoration/remedy is correct and atomic.
- [ ] No infinite retry/recovery loop is possible.

## Final rule

Launch PASS may be recorded only after all required fresh production evidence is collected in one deliberate certification window.
