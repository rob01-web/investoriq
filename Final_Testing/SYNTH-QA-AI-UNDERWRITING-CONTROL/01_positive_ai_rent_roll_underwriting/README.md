# 01 Positive AI Rent Roll Underwriting

- Intended report type: Underwriting
- Property: Cedar Park Residences
- Expected outcome: PASS / publish

## Upload Files

- `t12_clean_control.csv`
- `rent_roll_ai_recovery_source.txt`
- `loan_terms_simple_source.txt`

## AI Path Stressed

- AI Rent Roll Recovery only
- T12 is intentionally deterministic and should not be the stress point

## Expected Anchor Values

- Units: `18`
- Occupied: `17`
- Vacant: `1`
- Occupancy: `94.4%`
- Monthly In-Place Rent: `28,900`
- Annual In-Place Rent: `346,800`
- Monthly Market Rent: `32,250`
- Annual Market Rent: `387,000`
- EGI: `346,800`
- OpEx: `132,000`
- NOI: `214,800`
- Loan Amount: `2,900,000`
- Interest Rate: `4.85%`
- Amortization: `30 years`
- LTV: `72%`

## Safety Expectation

- Publish only if deterministic validation accepts the recovered rent-roll artifact.
- No report should publish if the recovered rent roll is missing or inconsistent.
- Supporting loan terms should not override core T12 or rent-roll truth.
