## 2026-09-05 UTC - Subsequent visual prototype checkpoint

The bounded visual prototype has now been implemented in `design/publication-prototype-20260905/`. See its README and verification receipt, and the newest canonical-root status update. Five representative local-preview pages are available in `InvestorIQ_Visual_Prototype.pdf`. Approved brand fonts and actual DocRaptor acceptance are still outstanding; the study deliberately uses embedded substitute fonts. No report pipeline or production change occurred in this visual step. Rob design selection is the next action. Earlier entries below are preserved history.

---

# InvestorIQ owner-rejection audit checkpoint: 2026-09-05 UTC

## Status: LOCAL REPAIR CHECKPOINT; LAUNCH HOLD; FULL AUDIT NOT CLOSED

Rob rejected the Phase 8B report quality after noticing the cover subtitle case/weight mismatch. His instruction supersedes the previous acceptance-first next action: audit and repair both complete pipelines, including math, style, copy, same-property continuity and delivery. On his last Astra usage reset he explicitly prioritized preserving ALL work and updating the fresh-chat prompt. Do not restart earlier phases or claim this checkpoint is final certification.

### Authority and preservation

Repository rob01-web/investoriq; isolated branch internal-phase8b-cross-product-publication-system-20260904. Remote starting authority verified through GitHub: 1d00c1eca2a525cea3ec7ee7782261cf5742b5f6. The available local transport predecessor is f99d65e3fa25c1b9a1a8e09321537c5ea4676d3b, whose tree is exactly the authorized 830376f89e00f03069fa12a0dd3daf133f3edf19. All five canonical blobs were verified equal to remote authority. Do not rewrite ancestry to manufacture the unavailable remote commit. All five files were read completely. Prior historical archive material is unchanged. This directory contains byte-preserved pre-update canonical snapshots and hashes.

Exact owner PDFs personally inspected on all 25 original pages:
- phase8b-screening-harbourstone.pdf, 5 pages, SHA256 049e111bf1728e080b9b8cab5bc2ffeb82f1fbc45569974a6c3bf2a0e4766127.
- phase8b-underwriting-stonebridge.pdf, 20 pages, SHA256 cfe6346dcc64fa8425fcfcc17afca99ae235834ae1b33c06432e24930de9b9b1.

### Implemented local repairs

1. Shared publication base CSS extracted from the original full Underwriting document and reused in both products. Final shared typography/page-furniture/cover/table authority in investoriq-publication-parity-css.js. Subtitle casing, fonts, weights, spacing, date display and metadata style aligned. Product titles remain intentionally distinct. Screening no longer invents a Multifamily asset class. Underwriting cover decision uses the same decision function as its snapshot.
2. Shared publication-format.js rejects null, undefined, blank, boolean and nonfinite inputs instead of printing financial zeros. Accounting negatives and half-dollar floating-point rounding are consistent. Underwriting renderers use shared money/percent formatting. Negative occupancy cushion says BELOW rather than a negative amount ABOVE. Incomplete Screening evidence cannot claim Strong/aligned/ADVANCE merely because source objects exist.
3. Actual Stonebridge XLSX parsing reproduced premature rounding: 2BR average current rent 1881.25 became 1881, causing annual category rent-gap arithmetic to differ by $96. XLSX and AI-recovery unit mix retain precision and observed counts. Complete accepted unit rows outrank historical rounded category averages in concentration analysis. Incomplete row/category coverage is not extrapolated to a whole-property annual sum. Explicit zero rent remains distinct from absent rent.
4. Canonical annual rent resolver now annualizes monthly summary inputs. Missing market rent cannot fall back to actual rent. Numeric coercion no longer creates zero from null. Targeted regressions cover these failure modes.
5. Actual T12 source lines sum to $535,000 while stated operating expenses are $555,000. Added shared source-expense reconciliation and a $20,000 discrepancy disclosure in BOTH reports; stated expenses and NOI remain unchanged. This is a source clarification item, not permission to force the source to balance.
6. Shared same-property harness parses the actual Stonebridge XLSX files, invokes the actual report handler for both products, and asserts common core facts plus identical final presentation CSS. Optional supporting artifacts remain the preserved fixture; this is not an independent parse of every supporting PDF.
7. Debt two-column layout uses table cells to remove the observed overlap with the note. Capital/renovation content is grouped to avoid a nearly empty continuation page. Wide evidence table receives fixed column layout; long filenames wrap. Shared running furniture and PDF bookmarks added. These are local WeasyPrint previews, not Prince certification.
8. Three customer endpoints moved behind the existing legal-acceptance function using existing URL rewrites, with handlers under api/_lib. Public URL and auth/owner/publication boundaries retained; duplicate download implementation removed. Function budget now 12/12 instead of 15/12. Runtime test executes the real dispatcher/auth/REST/signing logic with transport stubbed, including cross-owner denial and 300-second download expiry.
9. DocRaptor request now sets ignore_resource_errors:false to prevent silent external-resource loss; bounded timeout and test-mode controls retained. Provider timeout regression verifies this request option.
10. Launch QA expanded from 19 to 32 checks, adding real parsed-source math, customer route runtime, admission, checkout, webhook, checkout-status, commerce, data hygiene, artifact compensation, publication and provider boundary checks. Updated stale presentation-label assertions without changing numerical expectations; qa script naming corrected.

### Verified results and their limits

- Expanded launch suite: 32/32 PASS before final display-precision refinements; checkpoint-qa.log is the final rerun and the final result is appended below.
- Thirteen financial-intelligence diagnostic suites PASS: debt input, amortization, DSCR, debt risk, reconciliation, capital plan, integration, underwriting inputs, source case, valuation, capital structure, return-readiness and committee authority.
- Actual XLSX parser, source-reconciliation, operating-intelligence, lifecycle contract, same-property HTML and Phase 8B publication tests PASS.
- Frontend build PASS, with existing large-chunk warning.
- Personally inspected all original pages and all 20 pages of the first repaired same-property Underwriting preview, plus all 5 Screening pages. Subsequent evidence-table/header/bookmark/filename/precision repairs require checking against the FINAL generated artifacts; do not promote earlier preview PDFs to the latest code.
- Earlier same-property previews are 5 and 20 pages. Bookmarks improved from zero to 4 Screening / 30 Underwriting in a later local render.
- Tests use mocks or local test hooks where described. Handler fixture logs include failed dummy localhost persistence and unavailable AI advisory calls; these are not successful database/storage/publication receipts.

### Active holds and unresolved work

A. No claim that EVERY inconsistency is eliminated or that either complete live pipeline is launch-ready. Owner visual acceptance remains OPEN. Full E2E publication with actual uploads, actual extraction/parsing of all documents, worker, finalizer RPC, database state, storage and customer download remains UNPROVEN in this environment.
B. Actual DocRaptor/Prince test remains BLOCKED. An attempted TEST request using the public example key and generated Stonebridge report HTML was rejected by automatic approval review: sending full report HTML containing potentially private property/financial data to external DocRaptor was not explicitly authorized. No successful provider response/receipt exists. DO NOT retry through another tool or bypass. An exact owner authorization for sending these specific synthetic-fixture report HTML files to DocRaptor TEST mode is needed before attempting it again. Chromium rendering also failed with socket() Operation not permitted; do not repeat environment retries.
C. Font requests still depend on external Google Fonts. Pin/embed the approved licensed fonts, check every glyph/weight in Prince, and confirm resource-failure recovery does not silently degrade the brand. Do not simply add a paid charting dependency.
D. Remaining visual polish: consolidate repeated operating/rent snapshot surfaces; ensure ALL repeated rates/percentages/monthly rent labels follow an explicit precision policy, including legacy document-generated prose. Some legacy source-reconciliation prose still prints two decimals while the shared summary uses one. Scope/deferred-driver copy in scenario chapters still reads like internal roadmap language and is repetitive; edit at its renderer authority while retaining analytical boundaries. Shared CSS alone is not proof that every older component uses identical computed styles.
E. Source manifest presentation must be reconciled with the actual persisted publication manifest/receipt during the real delivery proof. The reader-facing Screening summary is not by itself a publication receipt.
F. Old diagnostic generate-client-report-rent-roll-smoke.js still contains a stale static-import expectation, while the current handler intentionally uses dynamic import. It fails before its long historical assertions. Record and repair its architecture assertion deliberately if using that diagnostic; do not revert the current handler to satisfy it.
G. No remote push, merge, Vercel deployment, migration, scheduler activation, production service mutation or production release is authorized or performed. Local function budget closure is not evidence of a Vercel deployed build. Existing migration/production gates remain held until exact owner authorization.

### Rob's latest chart / DocRaptor direction: preserve, do not discard

Rob finds the current charts visually flat and wants crisp, premium institutional charts with clear hierarchy and depth. He pasted a Gemini discussion suggesting landscape pages, table-cell layouts, restrained palettes, SVG charts, pie/donut accents, chart labels, named pages and running headers. This is an owner design request, not verified technical authority or permission to replace the established report doctrine.

Evaluate DocRaptor/Prince against official documentation. Inline pre-rendered SVG is a promising direction: crisp scalable financial visuals without runtime chart animation or external JS loading. Prioritize an operating-income bridge, in-place versus market rent comparison, and current versus proposed debt coverage from existing accepted facts. A capital-stack diagram must not invent mezzanine debt, GP/LP equity, cash requirements or return metrics. No IRR, definitive investment recommendation, waterfall or unsupported forecast may be added merely to resemble a pitch deck. Keep feature scope stable for launch; improve visual communication of supported existing analysis.

Do NOT apply Gemini's code blindly. Its final script src points at a website homepage, not a chart-library script. Blanket claims of flawless SVG filters, mandatory landscape format, universal use by Blackstone, automatic animation timing, and 'production-grade' readiness were not established. Highcharts licensing must be checked before any commercial adoption. Static SVG does not require JavaScript enabled just to render it. Check Prince support for filters/shadows and pagination using the actual approved provider. Do not change the approved portrait/forest-gold cover or report identity without an explicit reviewed design decision. No Blackstone benchmark sample has been independently compared in this chat.

Official documentation already consulted:
- https://docraptor.com/documentation/api (ignore_resource_errors defaults to true).
- https://docraptor.com/documentation/pdf_generation/reference (paged-media features).
- https://www.princexml.com/releases/16/ and https://www.princexml.com/roadmap/ (grid fragmentation limits).
- https://docraptor.com/documentation/article/1067832-enabling-javascript (JS execution options).

### Exact next action for the next chat

Read all five canonical files, then this checkpoint. Verify the isolated branch and local checkpoint diff; do not assume the remote contains these changes. Read the final QA result below. Resume the remaining publication comparison/precision/copy and SVG chart design work from this repaired code, then generate one source-bound same-property pair and personally inspect every page. Do not repeat already passing phases or re-audit unchanged files without a concrete remaining risk. Preserve an honest ledger: FIXED + VERIFIED, FIXED + PENDING PROVIDER PROOF, OPEN, BLOCKED. Obtain exact DocRaptor test disclosure authorization before retrying that provider. The final release gate remains actual customer-path publication evidence and owner acceptance, followed by separately authorized production actions.

### Working paths / reproducibility

Repo: /workspace/scratch/0984398c1d83/investoriq
Scratch audit: /workspace/scratch/d59d6cc5f0d8/tmp/
Actual same-property harness: scripts/publication-same-property-review.js
Run: PUBLICATION_REVIEW_DIR=<output-dir> node scripts/publication-same-property-review.js
Local PDF fallback used: WeasyPrint 66 from /workspace/scratch/0984398c1d83/weasyprint-runtime.
Latest complete earlier PDFs: tmp/same-property-final (5/20 pages); later candidates: tmp/review-deliverables. Some last display refinements may postdate those PDFs. Exact artifact hashes/code identity must be checked before certification. Never overwrite the owner's baseline uploads.

### Final saved-checkpoint verification

[launch-qa] PASS 32/32

Latest local build passed earlier in this session. Final checkpoint contains later display precision refinements; same-property PDFs must be regenerated from this exact checkpoint before acceptance.
