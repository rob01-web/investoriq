# InvestorIQ Product Doctrine

InvestorIQ is a document-driven real estate decision engine that produces institutional-grade investment memoranda based strictly on uploaded source documents.

## Core Principles
- No assumptions unless explicitly allowed.
- Fail-closed when data is missing.
- Deterministic math.
- Institutional tone.
- No hype.
- No BUY/SELL language.
- No fabricated narratives.
- Every conclusion must be traceable to a document input.

## InvestorIQ Is Not
- A spreadsheet tool.
- A market guesser.
- A creative writing engine.
- A speculative AI narrative generator.

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
Purpose: capital allocation and refinance risk modeling.

Primary question:
- If I deploy capital, how does this deal behave under structured stress and debt constraints?

Underwriting assumes:
- Rent Roll.
- T12.
- Debt terms or mortgage statement.
- Supporting documents.
- Tax and appraisal when available.

Underwriting is not triage. It is:
- Refinance constraint modeling.
- Deterministic stress testing.
- Capital structure math.
- LTV vs DSCR binding analysis.
- Worst-case refinance coverage modeling.
- Sensitivity matrices.
- Refinance Stability Classification tiers.

Underwriting must include:
- Base and stressed implied value.
- Max proceeds (LTV constrained).
- Max proceeds (DSCR constrained).
- Binding constraint determination.
- Coverage ratios.
- Tier classification (Stable / Sensitized / Fragile / Refinance Failure Under Stress).

Underwriting is a capital risk model.
Think: lender credit memo, investment committee packet, refinance committee analysis.

## Critical Clarification
- Screening = Decision Triage.
- Underwriting = Capital Structure Stress Model.

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
- Debt model.
- Refi stability.
- Sensitivity matrix.
- Capital structure.
- Constraint binding.
- Tier classification.

They share the base financial layer.
They do not share narrative structure.

InvestorIQ produces two distinct report types:
- Screening: a capital triage memo.
- Underwriting: a deterministic refinance and capital structure stress model.

Underwriting is not Screening plus additional pages.

Underwriting includes:
- Deterministic refinance modeling.
- LTV vs DSCR constraint analysis.
- Sensitivity matrix.
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
If the refinance engine is fail-closed because debt terms are not parsed, capital structure math never activates and underwriting collapses into a base financial shell.
Once debt terms parse, underwriting pages should expand automatically.

## Final Positioning
Screening ($299):
- Should I allocate attention?

Underwriting ($999):
- If I allocate capital, where does it break?