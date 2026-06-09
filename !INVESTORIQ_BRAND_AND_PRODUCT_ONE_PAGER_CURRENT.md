# InvestorIQ Brand and Product One-Pager Current

**Current as of:** June 9, 2026  
**Purpose of this file:** Preserve the company, brand, visual identity, product ladder, report philosophy, and product-positioning details for InvestorIQ so they do not get lost inside patch-history / doctrine / engineering checkpoint files.

---

# 1. Company Snapshot

## Company name

**InvestorIQ**

## Core category

**Document-driven real estate intelligence and underwriting platform.**

InvestorIQ turns uploaded real estate source documents into professional property reports for investors, brokers, lenders, and operators.

InvestorIQ is not positioned as a generic AI tool, a casual calculator, or a speculative investment recommender. It is a document-backed real estate analysis platform built around source discipline, deterministic validation, and professional report presentation.

## Core promise

```text
InvestorIQ does not invent missing deal facts.
It extracts, validates, organizes, and presents what the uploaded documents support.
Unsupported or incomplete items are omitted, qualified, disclosed, or marked as not modeled.
```

## One-line description

```text
InvestorIQ transforms property documents like T12s, rent rolls, and supporting deal files into professional Screening, Acquisition Memo, and Full Underwriting reports for real estate investors.
```

## Short pitch

```text
InvestorIQ helps real estate investors move faster and make cleaner decisions by turning uploaded property documents into professional, source-backed reports. The platform supports fast deal screening, lender-facing acquisition memo preparation, and eventually full institutional underwriting packages with advanced debt, DCF, waterfall, capital stack, integrations, and investor/lender-ready outputs.
```

---

# 2. Brand Positioning

## Brand essence

```text
Institutional real estate intelligence built from the documents, not guesswork.
```

## Primary positioning

InvestorIQ is for serious property investors who need credible, document-backed deal analysis without manually rebuilding every report from scratch.

It helps users answer:

```text
Is this property worth pursuing?
What does the T12 say?
What does the rent roll say?
Where is the upside?
What are the source limitations?
What can be shown to a lender, broker, partner, or investment committee?
```

## Brand personality

InvestorIQ should feel:

```text
institutional
premium
sharp
trustworthy
analytical
conservative with unsupported data
modern but not gimmicky
founder-led but professional
lender/investor credible
```

## Brand should avoid

```text
generic AI hype
casual calculator language
BUY / SELL / HOLD recommendations
unsupported certainty
loan approval promises
fabricated narratives
speculative market claims
consumer-app fluff
```

## Preferred language themes

```text
document-driven
source-backed
underwriting discipline
verified operating evidence
source transparency
data coverage
financing readiness
lender-facing diligence
institutional-grade property intelligence
```

---

# 3. Product Ladder

InvestorIQ currently has three internal/product concepts to preserve:

```text
1. Screening Report
2. Acquisition Memo
3. Full Underwriting
```

Important: The public/marketing ladder may choose to show only Screening + Full Underwriting in some one-pagers or outreach material. That does not erase the current Acquisition Memo work or product doctrine.

---

## 3.1 InvestorIQ Screening Report

### Purpose

Fast first-pass deal triage.

The Screening Report helps investors quickly decide whether a property is worth deeper diligence.

### Best use case

```text
Investor has multiple potential properties and needs to narrow the list to the few deals worth pursuing.
```

### Primary inputs

```text
T12 / operating statement
Rent roll
```

### Key outputs

```text
Property operating snapshot
T12 income / expense / NOI summary
Rent roll occupancy and rent-positioning summary
Annual in-place rent
Annual market rent
Annual rent upside
Rent gap percentage
Expense ratio
NOI margin
Break-even occupancy
Source coverage and document reliability notes
```

### Should not include

```text
full debt sizing
refinance proceeds
DCF
waterfall
equity returns
capital stack
loan approval language
BUY / SELL / HOLD
```

### Current status

```text
Launchable / founder-beta ready.
```

---

## 3.2 InvestorIQ Acquisition Memo

### Purpose

Financing-ready acquisition memo for serious lender discussions on approximately 1-150/200 unit properties.

The Acquisition Memo is the current launch-product workstream that converts the former underwriting/v1_core path into a safer, lender-conversation-ready report without reopening unstable Full Underwriting V2 surfaces.

### Best use case

```text
Smaller and mid-market investors preparing a credible acquisition package for lender conversations.
```

### Primary inputs

```text
T12 / operating statement
Rent roll
Purchase assumptions
Current debt or financing documents, if available
Property tax support, if available
Appraisal, market, environmental, CapEx, broker, or diligence documents, if available
```

### Key outputs

```text
Acquisition Memo Summary
Operating Snapshot
Rent Positioning / Rent Upside
Cap-Rate Value Indication
Preliminary Financing Readiness Summary
Uploaded Existing Debt Context, if verified
Lender Diligence Checklist
T12 reconstruction
Data Coverage / Source Reliability
Document Treatment Summary
Clear source limitation / not modeled disclosure
```

### Preliminary Financing Readiness Summary structure

```text
1. Acquisition Request Context
   - Purchase Price
   - NOI Basis
   - Going-In Cap Rate
   - Units
   - Price per Unit
   - NOI per Unit

2. Operating Support
   - Effective Gross Income
   - Operating Expenses
   - NOI
   - Expense Ratio
   - NOI Margin
   - Occupancy
   - Break-Even Occupancy

3. Rent / Value Support
   - Annual In-Place Rent
   - Annual Market Rent
   - Annual Rent Upside
   - Rent Gap %
   - Implied Value at 5.0%, 6.0%, 7.0% cap rates
   - Document-derived cap-rate reference, if available

4. Debt / Financing Context
   - Uploaded Existing Debt Context, when verified:
     - Outstanding Balance
     - Interest Rate
     - Amortization
     - LTV
   - Proposed Acquisition Financing:
     - shown only if explicitly source-complete
     - otherwise: Not source-complete / not modeled

5. Lender Diligence Checklist
   - T12 verified: Yes / No
   - Rent Roll verified: Yes / No
   - Purchase assumptions provided: Yes / No
   - Property tax support: Yes / No
   - Current debt context uploaded: Yes / No
   - Proposed acquisition loan terms complete: Yes / No
   - Environmental / Phase I support: Context only / not modeled, when present
   - Appraisal support: Context only unless structured value exists, when present
   - CapEx / renovation plan: Context only unless verified budget and rent-lift assumptions exist, when present
```

### Required caution language

```text
Shown for lender discussion and acquisition diligence support only. This Acquisition Memo organizes verified operating evidence, rent-positioning support, acquisition context, and uploaded financing context. It does not represent loan approval, lender commitment, refinance proceeds, full debt sizing, DCF, equity waterfall, or institutional credit-committee underwriting.
```

### Boundaries

```text
No loan approval promises.
No lender commitment language.
No refinance proceeds.
No full debt sizing unless source-complete and intentionally bounded.
No DCF.
No waterfall.
No equity returns.
No BUY / SELL / HOLD.
No institutional credit-committee claim.
```

### Current status

```text
Founder-beta / customer-deliverable direction materially validated.
One controlled retest remains after June 8 financing-section polish and cap-rate QA rounding fix.
```

---

## 3.3 InvestorIQ Full Underwriting

### Purpose

Full Underwriting is the premium InvestorIQ product vision.

It is intended to serve the full range of serious property investors: from smaller operators and newer investors who need a professional underwriting package, all the way to sophisticated operators, family offices, brokers, private lenders, and institutional users evaluating major assets and portfolios.

### Target range

```text
Small investors just starting out
1-50 unit properties
50-150/200 unit properties
250+ unit properties
multi-building portfolios
$50M-$500M+ transactions
Ken Dunn / family office / institutional-grade users
```

### Future scope

```text
Full DSCR stack
Current debt analysis
Proposed acquisition financing analysis
Refinance analysis
Debt sizing
Capital stack
DCF
Waterfall
Equity returns
Sensitivity analysis
Lender/investor package
Credit-committee-style outputs
Portfolio / multi-building support
Integrations galore
```

### Integration vision

Full Underwriting should eventually connect with or support workflows around:

```text
Document storage
CRM / investor pipeline
lender package workflows
broker deal-room workflows
property management data
accounting / operating statement sources
rent roll sources
market data sources
valuation/comparable data
Stripe/payment/user entitlement system
Supabase job/report history
admin diagnostics and QA visibility
future lender/investor portal features
```

### Current status

```text
Deferred as the full premium/institutional-grade product while the safer launch path is stabilized.
Do not launch the full advanced version until debt/refi/DCF/waterfall/capital stack/integrations are fully hardened.
```

---

# 4. Report Philosophy

InvestorIQ is designed around trust.

## Core doctrine

```text
Bad core documents cannot generate a report.
Valid core documents should publish.
Unsupported sections should collapse, qualify, omit, disclose, or render Not Assessed.
Optional/support docs should not kill a core-valid report.
Advisory AI is not the boss.
Deterministic validation and final rendering contracts control customer output.
```

## Source treatment doctrine

InvestorIQ should clearly show:

```text
What was used quantitatively.
What was used as context only.
What was listed for auditability.
What was not modeled.
What was missing or source-constrained.
```

## Customer promise

```text
If the uploaded documents support a fact, InvestorIQ can use it.
If the documents are incomplete, InvestorIQ qualifies or omits the affected section.
If required core documents are unusable, InvestorIQ does not produce a misleading report.
```

---

# 5. Brand / Visual Identity

## Visual direction

```text
premium
institutional
clean
real-estate finance oriented
quietly luxurious
data-driven
report-grade
lender/investor credible
```

## Report identity language found in report template

```text
INVESTORIQ
Institutional Real Estate Analysis
Institutional Grade Property Intelligence
```

## Color palette from report template

```text
Deep cover green / primary authority: #0F2318
Gold accent: #C9A84C
Dark gold: #9A7A2C
White: #FFFFFF
Warm paper / subtle background: #FAFAF8
Primary ink: #0C0C0C
Secondary ink: #363636
Tertiary gray: #606060
Muted gray: #9A9A9A
Hairline border: #E8E5DF
Mid hairline border: #D0CCC4
Alternate row background: #FAFAF8
```

## Font system from report template

```text
Display font: Cormorant Garamond, Georgia, serif
Body font: DM Sans, system-ui, sans-serif
Mono / metadata font: DM Mono, Courier New, monospace
```

## Report typography / size references from template

```text
Base body/report text: approximately 11px
Cover brand mark: approximately 13pt display serif
Cover main title: approximately 38pt display serif
Cover verdict/value: approximately 22pt display serif
Section headings: approximately 18pt display serif
KPI values: approximately 16px display serif
Table/body rows: approximately 10-11px
Metadata / eyebrow labels: approximately 6-8pt mono/body
Footer / small metadata: approximately 6.5-8px
```

## Layout direction

```text
Strong cover page
Deep green cover field
Gold accent linework
White / warm-paper report pages
High-contrast black ink text
Clean institutional tables
Metric cards / KPI cards
Hairline borders
Conservative whitespace
No loud consumer-app styling
No cartoonish visuals
No generic AI sparkle branding
```

---

# 6. Taglines / Copy Bank

## Primary tagline candidates

```text
Document-driven underwriting for smarter property investors.
Turn property documents into investor-ready reports.
Screen faster. Underwrite smarter. Trust the source.
Real estate intelligence built from the documents, not guesswork.
Institutional-grade property intelligence from uploaded deal documents.
```

## Short description

```text
InvestorIQ turns uploaded T12s, rent rolls, and supporting deal documents into professional real estate reports for faster screening, cleaner underwriting, and stronger lender/investor conversations.
```

## Longer description

```text
InvestorIQ helps real estate investors move from raw property documents to clear investment intelligence. The platform extracts and organizes operating data, rent roll evidence, rent upside, NOI, valuation context, financing readiness, and document reliability into professional reports built for investor and lender review.
```

---

# 7. Target Customers

```text
Independent real estate investors
Small multifamily buyers
Mid-market property investors
Mortgage brokers
Private lenders
Commercial real estate agents
Real estate analysts
Family offices
Larger operators
Portfolio buyers
Institutional users
Users reviewing 1 deal or 50+ deals per month
```

---

# 8. Pricing / Commercial Notes

Pricing has changed throughout the build and should be verified before public release.

Previously discussed / current working concepts include:

```text
Screening as the lower-priced report / first-pass triage product.
Acquisition Memo as the current launch-product workstream / founder-beta product.
Full Underwriting as the premium product for advanced/institutional use.
Bundles / subscriptions / high-volume pricing may be required for users screening many deals per month.
```

Do not treat old prices in archived files as final without checking the current Stripe/pricing implementation.

---

# 9. Public Positioning Guardrails

Do not use public-facing copy that implies:

```text
AI makes the final decision.
InvestorIQ guarantees financing.
InvestorIQ gives loan approval.
InvestorIQ gives BUY / SELL / HOLD advice.
InvestorIQ fabricates missing values.
InvestorIQ replaces professional legal, appraisal, lender, or engineering diligence.
```

Do use public-facing copy that emphasizes:

```text
document-backed analysis
source transparency
professional reports
faster screening
cleaner underwriting
lender/investor conversation support
verified source coverage
clear disclosure of unsupported items
```

---

# 10. Current Working Notes

This brand/product one-pager does not replace the active engineering master context, ledger files, Codex patch history, or report-core doctrine files.

Use this file for:

```text
company identity
brand identity
visual identity
product overview
one-pager / pitch-deck input
website brand consistency
future deck / Canva / outreach copy
```

Use the active master context and ledgers for:

```text
current bugs
patch history
Codex prompts
report-core doctrine
live testing state
launch blockers
engineering guardrails
```
