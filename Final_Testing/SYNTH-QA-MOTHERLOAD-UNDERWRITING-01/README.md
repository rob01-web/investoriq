# SYNTH-QA-MOTHERLOAD-UNDERWRITING-01

## Purpose
Synthetic QA only. This is a realistic fictitious Underwriting package designed as a final broad-system validation run before Ken Dunn outreach.

Recommended report property name: `SYNTH-QA-MOTHERLOAD-UNDERWRITING-01`

Fictional property: Harbourstone Apartments, Ottawa, ON. 48-unit multifamily asset.

## Intended Report Type
Underwriting.

## Files to Upload
- `t12_ai_recovery_source.txt`
- `rent_roll_ai_recovery_source.txt`
- `loan_terms_simple_source.txt`
- `purchase_assumptions_source.txt`
- `capex_budget_unstructured_source.txt`
- `broker_email_source.txt`
- `market_rent_survey_unstructured_source.txt`
- `property_tax_bill_source.txt`
- `unsupported_appraisal_summary_source.txt`
- `unsupported_phase_i_esa_source.txt`

## Expected Outcome
Should publish if the live system is working correctly.

## System Paths Exercised
- AI T12 Recovery from parser-unfriendly `.txt`
- AI Rent Roll Recovery from compact parser-unfriendly `.txt`
- Debt parsing from supporting loan terms
- Purchase assumption / cap-rate support
- CapEx restraint
- Unsupported-document restraint
- Uploaded files list
- Refinance, DSCR, scenario, and DCF rendering
- Dashboard, worker, DocRaptor, and Report History

## Expected Anchor Values
- Units: 48
- Occupancy: 95.83%
- Annual in-place rent: `$1,036,800`
- Annual market rent: `$1,137,600`
- Effective Gross Income: `$1,036,800`
- Operating Expenses: `$425,000`
- Net Operating Income: `$611,800`
- Debt balance: `$8,750,000`
- Interest rate: `5.25%`
- Amortization: `30 years`
- Purchase price: `$10,640,000`
- Going-in cap rate: `5.75%`

## Expected Safe Behavior
- No BUY/SELL language
- No fabricated CapEx ROI or payback
- No unsupported appraisal value modeled
- No environmental cost modeled
- No report if AI artifacts fail deterministic validation
- T12 and rent roll remain controlling source documents for income, expense, rent, and occupancy values

## Known Limitation
This is not the long 64-unit or 200-unit narrative rent-roll stress test. Long `.txt` rent-roll scale is covered separately by 04 and is not V1-proven. CSV/XLSX remains preferred for large detailed rent rolls.
