# InvestorIQ Canonical Handoff and Playbook
## Updated July 31, 2026 at 1:47 PM ET

Use this together with:
- `docs/STATUS.md` for the live snapshot.
- `docs/ROADMAP.md` for the remaining launch sequence.
- Deeper doctrine files only when the current packet explicitly needs them.

## 0. Exact current state

```text
Branch: main
Current HEAD: ae144dd0d1bda5411ab9373c92b25910a8ca98a7
Origin: https://github.com/rob01-web/investoriq.git
Remote main: pushed to ae144dd
Working tree: clean at last verification
Vercel Production: Ready
Production domain: https://investoriq.tech
Supabase project: RE Property Analysis
Supabase project ref: bcvuxtnuoidakzjqewfb
Region: us-east-2
Premium: false
RETEST 39: unauthorized
Live governed Full Underwriting canary: not yet run
Stripe/Vercel bundle configuration change: not performed
```

H0-H19 are complete at repository-proof level.

Gate status:
- Gate 1 complete.
- Gate 2 complete.
- Gate 3 complete.
- Gate 4 complete.

## 1. Gate 4 migration execution record

Authorized migration:
`supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql`

The first execution exposed a real production-schema mismatch:
- migration expected `public.reports.status`;
- production `public.reports` had no status/state/publication column;
- publication lifecycle authority is `public.analysis_jobs.status`;
- link is `public.analysis_jobs.report_id -> public.reports.id`.

The migration was repaired to use the deployed authority and relationship.

Commits:
- `6abed5e6dd2e0a7285f827c661fa42611cc3a53b` — production-schema migration repair.
- `ae144dd0d1bda5411ab9373c92b25910a8ca98a7` — H18/H19 exact two-file post-baseline allowlist correction.

Targeted proof:
- `report-surface-convergence-smoke.js` PASS.
- `h18-h19-governed-canary-simultaneous-launch-smoke.js` PASS after independent local rerun.
- Normalized working and committed migration contents proven identical.

Production application:
- Supabase returned `Success. No rows returned`.
- Nine H9-H10 columns confirmed.
- Three constraints confirmed.
- Three indexes confirmed.
- Three functions confirmed.
- Trigger confirmed.
- Twenty-five existing reports preserved.
- No silent revision metadata backfill.
- All duplicate/current-family invariant counts are zero.

## 2. Deployment record

- `git push origin main` succeeded.
- Remote advanced from `33dac6f` to `ae144dd`.
- Vercel automatically deployed `main` to Production.
- Deployment status: `Ready`.
- Live homepage and pricing page load.

## 3. Live-site findings

### Homepage

The sample-report display slots are currently blank because there is no approved successful Screening or Full Underwriting output selected for public showcase. This is not currently classified as a deployment failure.

### Pricing

Visible prices:
- Screening: `$199`.
- Full Underwriting: `$499`.
- Bundle: `$699`.

Purchase availability:
- Screening: available after login.
- Full Underwriting: available after login.
- Bundle: `PRICING UNAVAILABLE`.

Bundle copy currently exposes internal language and must be repaired after live Full Underwriting proof:
- `Frozen Launch Bundle`.
- `3 report credits`.
- `One checkout, one authenticated owner`.
- `Bundle composition is fixed server-side`.

Do not change bundle configuration or copy until the next bounded packet is authorized.

## 4. Full Underwriting standard of proof

The public `$499` Full Underwriting report must be materially more than a weak Acquisition Memo relabeled as underwriting.

Repository work H12-H17 established the intended contracts:
- canonical Full Underwriting identity and legacy firewall;
- source-bound view model;
- deterministic lender calculations;
- methodology, limitations, and prohibited-content contract;
- manifest/PDF certification;
- deterministic controlled replay.

However, a new live production PDF has not yet been run and reviewed. Therefore production output quality is not yet proven by direct customer artifact evidence.

A governed Full Underwriting canary must be judged against:
- source traceability and re-performable methodology;
- DSCR, debt yield, LTV, mortgage constant, and annual debt service;
- break-even metrics and supported sensitivities;
- rent-roll rollover/expiry analysis where supported;
- risk and diligence register;
- unresolved questions;
- explicit limitations and evidence quality;
- institutional depth and professional narrative;
- manifest/PDF agreement;
- no legacy Acquisition Memo masquerade;
- no unsupported recommendations or projections.

## 5. Exact next packet

**Governed Full Underwriting live-proof packet**

1. Update the three authority documents first.
2. Select appropriate production canary documents.
3. Explicitly authorize exactly one Full Underwriting canary.
4. Record entitlement/credit state and rollback/restoration expectations.
5. Run the report through the normal production path.
6. Review job state, manifest, PDF, customer history, and admin state.
7. Review the actual PDF against the Full Underwriting checklist.
8. PASS or HOLD before any bundle copy/configuration work.

## 6. Remaining launch sequence

After a Full Underwriting canary PASS:
1. Read-only verify Vercel bundle variable presence and scope.
2. Read-only verify Stripe bundle product/price and `$699` one-time configuration.
3. Approve polished bundle copy.
4. Apply the smallest configuration/copy change.
5. Redeploy and verify bundle purchasing availability.
6. Run simultaneous Screening + Full Underwriting launch closeout.
7. Update final docs and evidence.

## 7. Forbidden actions until separately authorized

- No additional migration.
- No direct production data edits.
- No Stripe change.
- No Vercel environment variable change.
- No Premium activation.
- No RETEST 39.
- No uncontrolled report purchase or live canary.
- No claim that Full Underwriting production output is proven until an actual PDF is reviewed.

## 8. Codex usage conservation

Every Codex prompt must include:
- read authority docs once;
- inspect only the smallest directly relevant files;
- no broad audits, repeated searches, exhaustive inventories, or long matrices;
- run only minimum targeted behavioral tests;
- stop once the smallest safe repair is proven;
- return a brief PASS/HOLD receipt with exact files, tests, commit, and status.
