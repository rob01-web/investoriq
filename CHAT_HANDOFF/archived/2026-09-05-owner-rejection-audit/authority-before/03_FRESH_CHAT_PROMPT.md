# InvestorIQ Fresh-Chat Prompt — Phase 8B Closed, Release Gate Next

Read this file first and treat it as governing authority for the continuation. Do not restart the audit, Phase 8, Phase 8A, or Phase 8B.

## What Rob should upload

For an ordinary continuation, this file is sufficient.

For owner visual acceptance or report-specific discussion, Rob should additionally upload only these exact two files:

- `phase8b-screening-harbourstone.pdf`
- `phase8b-underwriting-stonebridge.pdf`

Do not ask Rob to upload the entire `CHAT_HANDOFF` folder. Do not use an older fresh-chat prompt, recovery PDF, Phase 8 PDF, ZIP backup, JSON provenance file, or audit receipt as current authority unless a specific historical question requires it.

## Current repository authority

- Repository: `rob01-web/investoriq`
- Active isolated branch: `internal-phase8b-cross-product-publication-system-20260904`
- Certified Phase 8B product HEAD: `01dc75a1a732780a70da3eae9ed2dc1b69468756`
- Certified Phase 8B tree: `783e73559e11ac955774d4b08f37d1282bde7e1c`
- Phase 8A base: `113e5e2`
- Remote `main` observed 2026-09-04: `b69d8dd3911449b82c94770d51f22302e47adcd9`
- Phase 8B candidate branch is present on GitHub. Initial transport commit `f8a9a1034dce5b33f680b8752befa821c0d4fa89` has tree `e173e49b719995b60e2046518dc94d33e1616a71`, byte-for-byte identical to local handoff HEAD `cb5497c`.
- No Phase 8B merge, Vercel deployment, migration, scheduler action, production Storage mutation, or Stripe change has occurred.

The immutable Phase 8 artifact-integrity recovery remains:

- branch: `internal-phase8-artifact-integrity-recovery-20260903`
- HEAD: `4e9d01648aeb7a0f0616f20d8a72264cbea13443`
- tree: `fa99e62e1e67fde1bb854e59f6cf0b46e142bec7`

Never weaken request, property, source, HTML, PDF, filename, or cross-property identity gates.

## Phase 8B is closed locally

Phase 8B established one canonical InvestorIQ publication system shared by Screening and Underwriting. All slices 8B-A through 8B-F are committed and locally certified.

Governing receipt:

`docs/PHASE8B_CROSS_PRODUCT_PUBLICATION_CERTIFICATION_2026-09-04.md`

Key implementation seam:

`api/_lib/investoriq-publication-design-system.js`

Final candidate artifacts:

| Artifact | Pages | SHA-256 |
|---|---:|---|
| `phase8b-screening-harbourstone.pdf` | 5 | `049e111bf1728e080b9b8cab5bc2ffeb82f1fbc45569974a6c3bf2a0e4766127` |
| `phase8b-underwriting-stonebridge.pdf` | 20 | `cfe6346dcc64fa8425fcfcc17afca99ae235834ae1b33c06432e24930de9b9b1` |

Verified Phase 8A input baselines:

| Artifact | Pages | SHA-256 |
|---|---:|---|
| Harbourstone Screening baseline | 5 | `98064be89c0287a8e4a2e6a845f5daabe2ef9bcc6953f552b1ddac8c8146f36d` |
| Stonebridge Underwriting baseline | 20 | `da4cbb3b310f1e2129fe30878a0186861de9c6b41ccebb3046722aea2ba22a9e` |

The final Phase 8B PDFs were rendered with WeasyPrint 66 because the managed execution sandbox blocked Chromium socket creation. The adapter changed pagination/containment only, not customer content or analytical authority. Final launch acceptance should still prove the intended customer rendering path.

## Permanent product doctrine

InvestorIQ has two products:

- Screening answers whether a property deserves more investor time and a full Underwriting review.
- Underwriting answers how the investor should pursue the property, on what basis, with what strategy, and what can kill the deal.

The first analytical page answers the primary customer decision immediately. Facts precede prose. Strategy and conclusions may not exceed the uploaded evidence. Material findings bubble up. Detailed provenance remains available without dominating investor-facing pages.

Source authority remains document-specific. Do not invent facts, collapse source distinctions, use tests as product authority, or revive cross-property payload contamination.

## Current release verdict

**HOLD. Do not push, merge, deploy, migrate, activate, or mutate production merely because Phase 8B passed locally.**

The following gates remain:

1. Rob explicitly accepts the exact two Phase 8B PDFs.
2. Resolve the repository's Vercel Hobby function-budget sentinel: 15 deployable routes versus a limit of 12.
3. Re-run the authoritative launch QA and production build without weakening tests or production behavior.
4. Preserve the already-pushed isolated Phase 8B candidate branch and its verified tree identity.
5. Create a non-production preview only with explicit authorization and prove it is `READY`, tied to the expected SHA, and correctly aliased for preview.
6. Validate critical browser/API/report generation behavior, including the intended customer PDF path.
7. Ask for explicit authorization before any merge, production promotion, migration, scheduler activation, Storage mutation, Stripe/pricing action, or historical-row cleanup.
8. If production is authorized, promote the exact validated artifact once and record URL, target, state, SHA, alias, and post-deploy evidence.

Known inherited QA maintenance items must remain visible:

- `tests/qa/vercel-function-budget-smoke.js` fails at `15/12`; this is a real deployment-plan gate.
- `tests/qa/launch-critical-architecture-smoke.js` rejects the unclassified `qa:phase6:lifecycle` script name.
- `tests/qa/full-underwriting-gates-full-render-smoke.js` expects the stale label `Accepted T12 NOI`; certified output uses `T12 NOI`.

Classify each failure against current product and architecture authority before changing code or tests. Never make production behavior worse merely to make a stale assertion green.

## CHAT_HANDOFF rules

The live root contains only:

1. `00_CURRENT_HANDOFF.md`
2. `01_MASTER_PLAN.md`
3. `02_ELITE_REPORT_BLUEPRINT.md`
4. `03_FRESH_CHAT_PROMPT.md`
5. `README.md`

All prior authority remains under `CHAT_HANDOFF/archived/`. Do not delete or overwrite it. Before materially rewriting a live authority file, preserve an exact dated snapshot. Add status updates at the top of long-lived authority files; replace a fresh-chat prompt only after archiving its predecessor.

If Rob's Windows root contains many legacy files, use `scripts/maintenance/consolidate-chat-handoff.ps1`. Dry-run first, then run with `-Apply`. It must create a full ZIP backup before moving any extra root file into a timestamped archive.

## Immediate mission

Confirm whether Rob has explicitly accepted both exact Phase 8B PDFs. If not, perform or facilitate that review first. Then resolve the Vercel function-budget gate and produce a preview-deployment plan. Do not infer production authorization from enthusiasm or from the request for a readiness opinion.
