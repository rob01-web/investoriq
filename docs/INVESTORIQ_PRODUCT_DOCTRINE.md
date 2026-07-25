# InvestorIQ Product Doctrine

InvestorIQ is a document-driven real estate decision engine that produces institutional-grade investment memoranda based strictly on uploaded source documents.

## Controlling Underwriting Doctrine

Premium Underwriting expansion work must also comply with [PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md](PREMIUM_ACQUISITION_UNDERWRITING_V1_DOCTRINE.md).

That document governs the launch bridge from the current Underwriting Report to Premium Acquisition Underwriting V1. This product doctrine remains controlling wherever the documents overlap.

## Core Principles
- No assumptions unless explicitly allowed.
- Fail-closed when data is missing.
- Deterministic math.
- Institutional tone.
- No hype.
- No BUY/SELL language.
- No fabricated narratives.
- Every conclusion must be traceable to a document input.
- No public or customer-visible InvestorIQ surface may contain em dash characters. This applies to the website, dashboard, status and error messages, emails, reports, PDFs, downloads, and other customer communications.
- No public or customer-visible InvestorIQ surface may mention or imply artificial intelligence, language models, prompts, parsers, recovery systems, internal authority objects, or other implementation machinery.

## Core-Gated Publish-or-Collapse Constitution

InvestorIQ must publish a report whenever the uploaded T12 and Rent Roll provide sufficient trustworthy operating evidence to produce a defensible report.

Fail-closed behavior applies at the narrowest defensible level:
- An unsupported fact must not be stated.
- A section without sufficient support must collapse, be omitted, be qualified, or carry a source limitation disclosure.
- The entire report must be blocked only when the core T12 or Rent Roll is catastrophically unusable, the core operating evidence is fundamentally irreconcilable, or a technical failure prevents safe report delivery.

Missing detail does not automatically make a core document unusable. A T12 or Rent Roll may be accepted as constrained when its trustworthy contents still support a useful report and any unsupported calculations or sections can be removed.

### Required Core Evidence

The only documents required for report-level source publication authority are:
- T12 / operating statement.
- Rent Roll.

Each core document must receive one canonical validation state:
- `accepted_complete`: the document supports all applicable core calculations and sections.
- `accepted_constrained`: the document supports a defensible report, but one or more facts, calculations, or sections must collapse, be omitted, be qualified, or be disclosed.
- `rejected_catastrophic`: the document cannot provide sufficiently trustworthy operating evidence for a defensible report.

Examples of `accepted_constrained` core evidence include:
- Missing T12 line-item detail when trustworthy operating totals remain available.
- Missing Gross Potential Rent when the remaining T12 totals support applicable analysis.
- Missing market rents, lease dates, square footage, or optional unit detail in a Rent Roll.
- Occupancy that can be derived from credible unit rows or status information.
- Missing values that can be derived deterministically from accepted source facts.
- A reconcilable T12 / Rent Roll variance that can be stated accurately with a source limitation disclosure.

Examples of `rejected_catastrophic` core evidence include:
- An unreadable, corrupted, substantially blacked-out, or materially obscured document.
- A document that cannot be validated as the required T12 or Rent Roll.
- Core operating evidence that is so incomplete that no defensible operating analysis can be produced.
- Fundamental contradictions for which no trustworthy basis can be selected, derived, qualified, or disclosed without misleading the customer.

`rejected_catastrophic` must be based on validated core evidence. A candidate classification, failed support-document parse, filename, compatibility alias, or legacy status cannot establish a core failure.

### Publication Matrix

| Evidence condition | Required customer-report behavior |
| --- | --- |
| `accepted_complete` T12 and `accepted_complete` Rent Roll | Publish the complete applicable report. |
| One or both core documents are `accepted_constrained` | Publish and collapse, omit, qualify, or disclose only the affected calculations and sections. |
| T12 and Rent Roll are usable but contain a reconcilable variance | Publish with a canonical source reconciliation disclosure. |
| Optional or supporting evidence is missing | Publish and collapse or omit dependent sections. |
| Optional or supporting evidence is ambiguous, contradictory, rejected, or fails parsing | Publish without allowing that evidence to affect accepted facts; qualify or omit dependent sections. |
| A core document is `rejected_catastrophic` | Block the report and identify the exact validated core-document limitation. |
| Core operating evidence is fundamentally irreconcilable | Block the report and identify the exact core contradiction. |
| Rendering, PDF, storage, platform, or other technical delivery fails | Do not publish an unsafe or incomplete artifact; classify the outcome as an internal system failure and do not blame customer documents. |

### Optional and Supporting Documents

Debt terms, mortgage statements, purchase assumptions, renovation plans, appraisals, market surveys, environmental reports, property-tax documents, insurance documents, and other supporting evidence can improve or expand a report but cannot independently control report-level publication when the core T12 and Rent Roll are accepted.

A supporting document may:
- Supply accepted facts to an eligible section.
- Cause its dependent section to be qualified, collapsed, or omitted when incomplete.
- Create an advisory or disclosure.

A supporting document may not:
- Invalidate an accepted T12 or Rent Roll.
- Manufacture or replace core source authority.
- Block the entire report merely because it is missing, ambiguous, contradictory, rejected, or unusable.
- Change customer delivery authority through a legacy role, alias, filename, candidate classification, or failed parser artifact.

### Source and Delivery Authority

Document understanding may propose document roles, candidate facts, evidence, and confidence. Only deterministic validation may accept a document role or fact into canonical source authority.

After canonical source authority is established:
- Screening and Underwriting must consume the same accepted core facts and core publication decision.
- Pipeline-specific report logic may decide how accepted facts are analyzed and presented, but may not reinterpret source authority.
- Renderers may render only permitted facts and sections.
- Report compliance may remove or collapse unsupported output but may not promote rejected evidence.
- The Delivery Gate may enforce canonical publication authority but may not rediscover document truth or manufacture deliverability.
- Workers, publication helpers, artifact helpers, compatibility aliases, legacy fields, and customer messaging may only mirror canonical authority.

### Failure Classification

Customer document failures and internal system failures are separate constitutional outcomes.

Customer document replacement may be requested only for:
- A validated catastrophic T12 failure.
- A validated catastrophic Rent Roll failure.
- A validated fundamental core contradiction.

Source-authority construction failures, unhandled exceptions, rendering failures, contract failures, PDF failures, storage failures, and platform failures must be recorded as internal system failures. They must not be converted into missing-document failures or customer-facing claims that a particular uploaded document was unusable.

## InvestorIQ Is Not
- A spreadsheet tool.
- A market guesser.
- A creative writing engine.
- A speculative narrative generator.

## Screening vs Underwriting
These are two different cognitive layers.

### Screening Report ($299)
Purpose: rapid capital triage.

Primary question:
- Should I spend time underwriting this deal?

Screening is a decision memo. It exists to:
- Identify primary pressure points.
- Identify structural red flags.
- Rank deterministic drivers.
- Provide a structured Pass / Caution / Fail signal.

Screening assumes:
- Limited documentation.
- Often only Rent Roll + T12.
- No confirmed debt terms.
- No full refinance model.

Screening focuses on:
- NOI integrity.
- Expense structure.
- Unit mix.
- Break-even occupancy.
- Margin resilience.
- Data sufficiency.
- Deterministic deal score.

Screening does not:
- Build refinance stress matrices.
- Model loan proceeds.
- Perform LTV/DSCR constraint math.
- Classify refinance stability tiers.

Screening is a triage memo.
Think: family office associate evaluating 40 deals per week.
It should be short, sharp, ranked, and deterministic.

### Underwriting Report ($999)
Purpose: institutional acquisition and capital-risk underwriting.

Primary question:
- What do the accepted documents prove about operations, valuation, debt burden, acquisition capitalization, and material diligence limitations?

Underwriting assumes:
- Rent Roll.
- T12.
- Supporting documents when provided and canonically accepted.
- Debt, appraisal, tax, environmental, renovation, market, and assumption evidence may expand the report but do not replace core authority.

Underwriting is not triage. It is:
- Source-aware operating analysis.
- Deterministic debt and capital structure math.
- Unit economics and expense analysis.
- Valuation and reconciliation analysis.
- Evidence and diligence treatment.
- Explicit formula, source, and limitation disclosure.

Premium Acquisition Underwriting V1 is the governed launch bridge. It is additive, feature-flagged, consume-only, and independently certified. It may use canonical accepted facts and authorized deterministic calculations, but it may not create source authority, infer missing assumptions, change publication eligibility, alter Screening, mix debt roles, or silently fall back to the base report after an external premium job has been promised.

Premium V1 has no universal page-count target. It must use accepted evidence comprehensively, present decision-useful analytical depth, and avoid filler, repeated narrative, excessive whitespace, and predominantly empty analytical pages.

Full capital-risk and refinance underwriting is a later governed phase. Once separately authorized, it may include:
- Base and stressed implied value.
- Max proceeds (LTV constrained).
- Max proceeds (DSCR constrained).
- Binding constraint determination.
- Coverage ratios.
- Tier classification (Stable / Sensitized / Fragile / Refinance Failure Under Stress).

Those later calculations require versioned formula and scenario authority. They may not be activated through hardcoded assumptions or legacy logic.

Underwriting is an institutional evidence and capital-risk model.
Think: lender credit memo, investment committee packet, refinance committee analysis.

## Critical Clarification
- Screening = Decision Triage.
- Premium Acquisition Underwriting V1 = Source-aware acquisition, operating, debt, valuation, and diligence analysis.
- Full Underwriting = Later governed capital-structure stress model.

They are not layered versions of the same product.

Underwriting should not:
- Reprint all screening narrative.
- Duplicate triage commentary.
- Be verbose.

Underwriting should:
- Be math-heavy.
- Be constraint-focused.
- Be structured.
- Be capital-risk oriented.
- Be source-aware and lineage-complete.

## Architecture Implication
Shared base layer:
- Data extraction.
- Financial rollups.
- NOI derivation.
- Expense rollups.
- Unit mix.

Then fork into separate report branches.

### Screening Branch
- Ranking drivers.
- Pressure point memo.
- Break-even.
- Margin integrity.
- Deterministic deal score.

### Underwriting Branch
- Premium V1 acquisition analysis.
- Current and proposed debt analysis.
- Unit economics and expense structure.
- Valuation and appraisal bridge.
- Evidence and diligence register.
- Later governed refinance stress analysis.

They share the base financial layer.
They do not share narrative structure.

InvestorIQ produces two distinct report types:
- Screening: a capital triage memo.
- Underwriting: a deterministic, source-aware acquisition and capital-risk report.

Underwriting is not Screening plus additional pages.

Premium Acquisition Underwriting V1 includes:
- Deterministic unit, operating, debt, valuation, and acquisition-capitalization analysis.
- Current and proposed debt-role separation.
- Source reconciliation and evidence treatment.
- Source-aware chapter collapse.
- Independent premium certification.

Later Full Underwriting may include:
- Deterministic refinance modeling.
- LTV vs DSCR constraint analysis.
- Sensitivity matrices.
- Refinance Stability Classification.
- Capital structure stress testing.

Screening includes:
- Ranked deterministic drivers.
- Primary pressure point.
- Break-even occupancy.
- Margin integrity.
- Triage signal.

The two share base financial calculations but do not share structure or purpose.
Fail-closed logic applies to both.
Do not duplicate sections across report types unless explicitly required.

## Why Underwriting Can Feel Thin
Underwriting feels thin when accepted source evidence and authorized deterministic analysis are omitted, fragmented, or presented with excessive whitespace.

The remedy is not a fixed page count, speculative filler, or automatic activation of legacy refinance logic. The remedy is comprehensive use of canonical accepted evidence through the governed Premium Expansion Model, source-aware chapter eligibility, and institutional PDF composition.

## Final Positioning
Screening ($299):
- Should I allocate attention?

Underwriting ($999):
- What do the accepted documents prove about this acquisition, its operations, debt burden, valuation, and diligence limitations?

Later Full Underwriting:
- Under governed stress and debt constraints, where does the capital structure break?
