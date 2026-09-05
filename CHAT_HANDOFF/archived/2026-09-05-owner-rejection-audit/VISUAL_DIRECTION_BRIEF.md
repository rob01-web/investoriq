## 2026-09-05 UTC - Subsequent visual prototype checkpoint

The bounded visual prototype has now been implemented in `design/publication-prototype-20260905/`. See its README and verification receipt, and the newest canonical-root status update. Five representative local-preview pages are available in `InvestorIQ_Visual_Prototype.pdf`. Approved brand fonts and actual DocRaptor acceptance are still outstanding; the study deliberately uses embedded substitute fonts. No report pipeline or production change occurred in this visual step. Rob design selection is the next action. Earlier entries below are preserved history.

---

# Whole-publication visual review: 2026-09-05 UTC

## Owner clarification

Rob's target is the ENTIRE visual experience of a premium professional report, not merely sharper charts or matching fonts. He wants Screening and Underwriting to feel like a coordinated institutional publication worthy of presentation to experienced $300M-$500M real estate investors. The “$5k” description is a perceived-quality ambition, not a substantiated price or market-value claim. This is a visual-only review; no analytical feature expansion is requested.

## Quick-review conclusion

DocRaptor/Prince has enough documented publishing capability for a much stronger result. InvestorIQ's remaining gap is primarily page composition, hierarchy, readable typography, meaningful visual emphasis and dependable rendering. Enabling more engine features alone will not create the desired quality.

Reviewed representative pages of the available same-property local previews alongside official DocRaptor showcase/reference material. These PDFs are WeasyPrint outputs; no new DocRaptor request was sent. The earlier provider approval rejection remains in force. Public sample PDF downloads failed or were oversized; do not claim a page-by-page visual comparison with those inaccessible samples or with an actual Blackstone memo.

## Newly confirmed font failure: immediate visual blocker

The PDF in tmp/same-property/stonebridge-underwriting.pdf contains Cormorant Garamond, DM Sans and DM Mono. The newer tmp/review-deliverables/stonebridge-underwriting.pdf instead contains DejaVu Sans, Serif and Mono families. Actual embedded font names were inspected with PyMuPDF. This is confirmed fallback-font substitution in the LOCAL preview, not evidence of a live DocRaptor failure. It changes line lengths, density, weights and the overall brand. Do not call the newer preview accepted or certified. Pin/embed licensed approved fonts and add a final-PDF font-family/weight check before making aesthetic judgments or approving a render.

## Recommended visual direction, in priority order

| Priority | Observed issue | Proposed visual improvement |
| --- | --- | --- |
| 0 | Fonts can change between renders. | Deterministic embedded fonts, approved weights, actual PDF font inspection. A mandatory release gate. |
| 1 | Repeated bordered boxes and small tables make pages feel mechanically assembled. | Define four coordinated page compositions: cover, decision summary, analysis, appendix. Use alignment and spacing for ordinary grouping; reserve panels for decisions and material exceptions. |
| 2 | Decision pages give too many metrics similar emphasis. | One clear decision line, four dominant metrics selected for the product, and a secondary evidence tier. Underwriting expands the same visual vocabulary used in Screening. Preserve all supported facts in an appropriate place. |
| 3 | Small text coexists with large unused areas, especially Screening pages 2-4. | Increase reading size before adding decoration. Prototype body around 9.5-10 pt, financial tables around 9 pt, genuine notes around 7.5-8 pt; assess at 100% PDF view. Keep display serif for property/title identity; test clean tabular numerals for financial tables. These are design targets, not blindly applied settings. |
| 4 | Page density varies; a continuation fragment can dominate an otherwise empty page. | Compose complete analysis units: headline, evidence, interpretation and source. Keep headings with useful content; repeat table headers and label continuations. Preserve intentional whitespace around a focal element, eliminate accidental whitespace caused by rigid breaks. |
| 5 | Three small bar-chart cards look like dashboard widgets. | Give one financial visual meaningful space. Prototype an EGI-to-NOI bridge, paired in-place/market rent bars and current/proposed debt coverage. Use inline SVG, direct labels and a restrained highlight. Existing Stonebridge arithmetic can support these without new assumptions. |
| 6 | Tables compete with headings and repeat the same visual weight. | Quiet horizontal rules, explicit column widths, right-aligned financial values, consistent units/precision, restrained row shading and a clearly distinguished total/result row. Place related charts and tables on the same alignment grid. |
| 7 | Cover has little property-specific visual identity beyond a name. | Retain the approved portrait/forest-gold identity while testing a stronger title composition and more deliberate metadata placement. If a real owner-supplied property photograph is available, test a restrained architectural image treatment. Do not invent property imagery or make photography a publication requirement. |
| 8 | Important interpretation is buried among repeated lists and caveats. | Add one concise existing-evidence takeaway as the focal text on each analysis page, with a consistent small source note. Reduce repeated framing text without removing material qualifications. |
| 9 | Navigation can feel like reading a long export. | Coordinated running section/property identifiers, useful PDF bookmarks, linked contents for longer reports and automatic page references. Keep Screening lighter; use the same underlying design system. |

## What the engine actually supports

Official DocRaptor samples demonstrate custom fonts, page-level styling, variable orientation, full bleed, columns, chart integration and running furniture. Its references document page floats, break control, footnotes and cross-references. Inline SVG is explicitly supported. These capabilities enable a composed report; they do not guarantee good design or universal support for every CSS filter/chart-library behavior.

- Showcase: https://docraptor.com/samples
- Paged-media reference: https://docraptor.com/documentation/pdf_generation/reference
- Page floats: https://docraptor.com/documentation/article/8370369-page-floats
- Inline SVG: https://docraptor.com/documentation/tutorial/vector-images
- Prince examples: https://www.princexml.com/samples/

The user-supplied Gemini transcript is inspiration, not implementation authority. Mandatory landscape, exaggerated 3D pies, artificial depth, unverified library scripts and an unconditional JavaScript-finished callback are not substitutes for a reliable publication design. Retain portrait for this review; only consider a wide financial exhibit if it demonstrably improves readability. No unsupported IRR, equity allocations, investment recommendations or financial assumptions are authorized by this visual task.

## Bounded next step

After preserving the math/delivery repairs, create THREE representative visual prototypes using the same Stonebridge evidence: (1) Screening decision page, (2) Underwriting decision page, (3) Underwriting operating-analysis page with one substantial SVG financial graphic and its matching table. Compare them at 100% scale with the present pages. Obtain owner design selection before propagating a new composition throughout both products. Final acceptance still requires the exact approved fonts and actual DocRaptor/Prince output, then every-page inspection. Do not launch another full pipeline audit to do this visual-only task.

## State of work

This brief is researched design guidance only. No new charts, page redesign or production changes were implemented during this quick review. Prior local code checkpoint be2f0f1 and its 32/32 QA result remain intact. All existing launch holds continue.
