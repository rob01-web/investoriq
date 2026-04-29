# 03 Positive Dual AI Recovery Underwriting

- Intended report type: Underwriting
- Property: Lakeside Commons
- Expected outcome: PASS / publish

## Upload Files

- `t12_ai_recovery_source.txt`
- `rent_roll_ai_recovery_source.txt`
- `loan_terms_simple_source.txt`

## AI Path Stressed

- AI T12 Recovery
- AI Rent Roll Recovery
- This is the strongest positive Underwriting control in the package set

## Expected Anchor Values

- Units: `32`
- Occupied: `30`
- Vacant: `2`
- Occupancy: `93.75%`
- Monthly In-Place Rent: `54,000`
- Annual In-Place Rent: `648,000`
- Monthly Market Rent: `59,200`
- Annual Market Rent: `710,400`
- EGI: `648,000`
- OpEx: `246,000`
- NOI: `402,000`
- Loan Amount: `5,950,000`
- Interest Rate: `4.95%`
- Amortization: `35 years`
- LTV: `74%`

## Safety Expectation

- Publish only if deterministic validation accepts both recovered artifacts.
- No report should publish if T12 or rent-roll artifacts are missing or materially inconsistent.
- Supporting loan terms should not override core financial truth.
