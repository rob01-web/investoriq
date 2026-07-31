# InvestorIQ Status

Current date: July 31, 2026 at 1:47 PM ET

## Current authority and safety boundaries

- Product and launch decisions remain governed by `docs/INVESTORIQ_H0_OWNER_AND_AUTHORITY_FREEZE.md`, `docs/ROADMAP.md`, and the canonical handoff.
- Premium remains exactly `false`.
- RETEST 39 remains unauthorized.
- Live governed Screening or Full Underwriting canary has not yet been run.
- No Stripe configuration change has been made during this launch packet.
- No Vercel environment variable change has been made during this launch packet.

## Current production state

- Production/default branch: `main`
- Current deployed commit: `ae144dd0d1bda5411ab9373c92b25910a8ca98a7`
- GitHub origin: `https://github.com/rob01-web/investoriq.git`
- Local and remote `main`: synchronized after push
- Vercel Production deployment: `Ready`
- Production domain: `https://investoriq.tech`
- Production Supabase project: `RE Property Analysis`
- Supabase project reference: `bcvuxtnuoidakzjqewfb`
- Region: `us-east-2`
- Local working tree at last verification: clean

## Gate completion

- Gate 1: complete.
- Gate 2: complete.
- Gate 3: complete.
- Gate 4: complete.
- Required migration `supabase/migrations/20260730000100_h9_h10_report_revision_lineage.sql` was repaired, committed, applied to production, and verified.

## Gate 4 production migration record

Initial certified migration execution failed because it referenced nonexistent `public.reports.status`.

Production schema truth:
- `public.reports` originally contained only `id`, `user_id`, `property_name`, `storage_path`, `created_at`, and `report_type`.
- Lifecycle status authority is `public.analysis_jobs.status`.
- `public.analysis_jobs.report_id` links to `public.reports.id`.

Repair:
- Migration repaired to enforce current-revision publication through `public.analysis_jobs.status = 'published'` joined by `analysis_jobs.report_id -> reports.id`.
- Repair commit: `6abed5e6dd2e0a7285f827c661fa42611cc3a53b`
- Certification allowlist correction commit: `ae144dd0d1bda5411ab9373c92b25910a8ca98a7`
- Repaired working-file SHA256 reported by Codex: `55bf12a93ea6b9907584feb3b900f2f3529236f1ef459dd505286e1f8d4a19b7`
- Direct Git-blob SHA256 differed only because of line-ending representation; normalized working and committed contents were proven identical.

Production post-migration verification:
- All 9 H9-H10 columns exist.
- All 3 expected constraints exist.
- All 3 expected unique/partial indexes exist.
- All 3 expected functions exist.
- Trigger `analysis_jobs_promote_report_revision_trigger` exists on `public.analysis_jobs`.
- All 25 pre-existing reports remain intact.
- Existing reports received no silent revision backfill.
- Duplicate request keys: `0`.
- Duplicate family/revision numbers: `0`.
- Multiple-current families: `0`.

## Repository phase completion

- H0, H0.5, H0.75, and H1-H19: complete at repository-proof level.
- H9-H10 production schema is now applied and verified.
- H12-H15 establish the intended public Full Underwriting identity, source binding, deterministic lender metrics, methodology, limitations, and renderer contract.
- H16-H17 establish manifest/PDF certification and controlled replay behavior.
- H18-H19 establish governed-canary and simultaneous-launch controls.

## Live-site observations after deployment

Homepage:
- Production homepage loads successfully.
- Sample-report panels are empty because no approved successful Screening or Full Underwriting report has yet been selected for public display; this is not currently classified as a deployment failure.

Pricing page:
- Screening: `$199`.
- Full Underwriting: `$499`.
- Bundle: `$699`.
- Screening and Full Underwriting show `LOG IN TO PURCHASE`.
- Bundle currently shows `PRICING UNAVAILABLE`.
- `VITE_STRIPE_PRICE_ID_BUNDLE` / related Stripe bundle configuration still requires read-only verification before any change.

Customer-facing copy issue found:
- Bundle card exposes internal/technical language including `Frozen Launch Bundle`, `3 report credits`, `One checkout, one authenticated owner`, and `Bundle composition is fixed server-side`.
- No copy change has been made yet.

## Full Underwriting proof boundary

The H01-H19 work proves repository contracts and production schema readiness, but it does not by itself prove that a newly generated live customer PDF now meets the intended institutional Full Underwriting standard.

Before customer-copy cleanup or broader launch claims, the next recommended governed action is one owner-authorized live Full Underwriting canary using suitable source documents, followed by review against the approved Full Underwriting standard:
- lender/debt metrics;
- source binding and provenance;
- methodology and limitations;
- risk and diligence register;
- unresolved questions;
- evidence quality;
- no weak Acquisition Memo masquerade;
- no Premium activation;
- no RETEST 39 unless separately authorized.

## Current stop gate

Stop before:
- running a live Full Underwriting canary;
- purchasing or consuming a report credit;
- changing bundle copy;
- changing Vercel variables;
- changing Stripe products/prices;
- activating Premium;
- running RETEST 39.

Next packet: update canonical documentation, then separately authorize and execute one governed Full Underwriting canary before final customer-facing copy and bundle-price configuration changes.
