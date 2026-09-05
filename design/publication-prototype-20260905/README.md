# Owner approval update - 2026-09-05 UTC

Rob approved this visual composition for both reports, using the regular approved fonts. The five-page exhibit count is not a product cap. Continue the implementation sequence in CHAT_HANDOFF/archived/2026-09-05-owner-rejection-audit/VISUAL_APPROVAL_AND_IMPLEMENTATION.md. Earlier review-pending statements below are preserved history.

---

# InvestorIQ publication composition prototype - 2026-09-05

Five representative pages: matching Screening and Underwriting covers, the two decision summaries, and an Underwriting operating-analysis page. This is an isolated design study, not a production renderer, full report, or launch certification. The five-page count describes these exhibits only; it is not a product page-count requirement.

The purpose is owner review of the WHOLE visual experience: stronger property identity, consistent title case, a clear decision, four primary metrics, coherent columns, quiet tables, and a substantial inline SVG earnings bridge. The study uses the recorded Stonebridge fixture values from the September 5 audit. No new economic assumptions or production math changes are introduced. Shared core facts remain identical, and the rental-basis/expense-detail differences stay explicit.

## Fonts and rendering limitation

The approved Cormorant Garamond / DM Sans / DM Mono font download was blocked. Existing PDFs only contain incomplete subset fonts, unsuitable as reusable font assets. This study intentionally embeds local P052 Roman and Nimbus Sans Regular/Bold. They are provisional composition-study substitutes, NOT an approved brand-font replacement or a silent fallback. The HTML builder reads the installed `fonts-urw-base35` package and embeds fonts for local rendering. Generated HTML is ignored by Git; do not distribute font-containing HTML as a production asset. The supplied PDF embeds these fonts under the package's PDF font exception. Obtain the licensed approved brand files before final rendering or propagation.

Run `python3 design/publication-prototype-20260905/build.py` from the repository. Render its generated HTML with WeasyPrint 66 for a local preview. `verification.json` records the latest PDF hash and embedded study fonts. No external chart library, network font dependency, JavaScript execution, or DocRaptor request is used by this preview. The generated SVG uses a common linear dollar scale and deterministic source values.

## Review and next action

Review composition at 100% PDF scale. The final five-page local preview was personally inspected; earlier overflow and footnote collisions were repaired. This does not test arbitrary document length or certify Prince behavior. Do not propagate the composition across production templates before Rob selects the direction and the approved fonts are available. Next: owner design feedback, approved-font render, then production integration and actual provider/every-page proof with existing launch holds maintained.
