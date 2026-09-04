# InvestorIQ Phase 8B Cross-Product Publication Certification

**Date:** 2026-09-04  
**Branch:** `internal-phase8b-cross-product-publication-system-20260904`  
**Production actions:** None

## Governing baselines verified

| Artifact | Pages | SHA-256 |
|---|---:|---|
| Phase 8A Harbourstone Screening | 5 | `98064be89c0287a8e4a2e6a845f5daabe2ef9bcc6953f552b1ddac8c8146f36d` |
| Phase 8A Stonebridge Underwriting | 20 | `da4cbb3b310f1e2129fe30878a0186861de9c6b41ccebb3046722aea2ba22a9e` |

The supplied PDFs matched both governing hashes and page counts before Phase 8B work began.

## Phase 8B slice checkpoints

| Slice | Result | Commit |
|---|---|---|
| 8B-A | Canonical publication design system extracted from Underwriting | `24a33453b09262783262a1281f52cd7400404489` |
| 8B-B | Screening cover aligned to canonical cover system | `3ebfe09` |
| 8B-C | Screening decision page rebuilt from canonical decision cockpit | `2bdc7a1` |
| 8B-D | Screening evidence, observations, reconciliation, and diligence pages unified | `e93f07d` |
| 8B-E | Screening governance ending unified | `4a150f3` |
| 8B-F | Exact report regeneration and visual certification | This document's commit |

## Final certification artifacts

| Artifact | Pages | Page size | SHA-256 |
|---|---:|---|---|
| `phase8b-screening-harbourstone.pdf` | 5 | US Letter | `049e111bf1728e080b9b8cab5bc2ffeb82f1fbc45569974a6c3bf2a0e4766127` |
| `phase8b-underwriting-stonebridge.pdf` | 20 | US Letter | `cfe6346dcc64fa8425fcfcc17afca99ae235834ae1b33c06432e24930de9b9b1` |

The final PDFs were rendered with WeasyPrint 66.0. Local Chromium binaries could not start inside the managed execution sandbox because Unix socket creation is blocked. The repository retains a Chromium-capable certification renderer path, and the WeasyPrint adapter changes pagination and containment only. It does not change customer content or analytical authority.

## Automated certification

Passed:

- exact source-bound Harbourstone and Stonebridge HTML generation;
- Phase 8A Slice A, B, C, and D artifact validators;
- decision snapshot validation;
- Phase 8 visual authority validation;
- permanent Phase 8B cross-product publication-system smoke test;
- canonical publication-system extraction smoke test;
- Phase 8A owner-acceptance, executive-summary, and HOLD DSCR regressions;
- publication authority boundary regression;
- production build;
- rendered PDF identity validation;
- rendered PDF page-continuity validation;
- rendered Screening semantic firewall;
- diff safety.

## Visual certification

Full-resolution raster inspection covered every page of both PDFs.

- Harbourstone page 1 and Stonebridge page 1 share the same white-first cover geometry, brand tokens, classification band, metadata row, and footer system.
- Harbourstone page 2 and Stonebridge page 2 share the same decision-first hierarchy, dark decision band, metric grammar, and three-panel decision structure.
- Harbourstone page 3 and Stonebridge page 3 share the same evidence-map and key-metric grammar.
- Harbourstone page 4 and Stonebridge page 4 share the same observation and reconciliation grammar.
- Harbourstone page 5 belongs visibly to the same source, methodology, and quality-governance family as the Stonebridge closing pages.
- Stonebridge pages 6 through 20 preserve the certified Underwriting content family with no blank, clipped, or stranded pages.
- No Screening page exposes an Underwriting-only concept.

Final cross-product test:

> If property names, numbers, and report-type labels are blurred, the two reports still read immediately as the same InvestorIQ publication system.

**Result: YES.**

## Isolation lock

No merge to `main`, Vercel deployment, migration, scheduler change, or other production action was performed. Owner visual acceptance remains the gate before any synchronization or deployment decision.
