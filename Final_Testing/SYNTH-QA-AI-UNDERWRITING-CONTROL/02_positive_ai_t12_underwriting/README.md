# 02 Positive AI T12 Underwriting

- Intended report type: Underwriting
- Property: Northgate Manor
- Expected outcome: PASS / publish

## Upload Files

- `t12_ai_recovery_source.txt`
- `rent_roll_clean_control.csv`
- `loan_terms_simple_source.txt`

## AI Path Stressed

- AI T12 Recovery only
- Rent roll is intentionally deterministic and should not be the stress point

## Expected Anchor Values

- Units: `24`
- Occupied: `23`
- Vacant: `1`
- Occupancy: `95.8%`
- Monthly In-Place Rent: `39,600`
- Annual In-Place Rent: `475,200`
- Monthly Market Rent: `43,200`
- Annual Market Rent: `518,400`
- EGI: `475,200`
- OpEx: `181,500`
- NOI: `293,700`
- Loan Amount: `4,200,000`
- Interest Rate: `5.10%`
- Amortization: `30 years`
- LTV: `70%`

## Safety Expectation

- Publish only if deterministic validation accepts the recovered T12 artifact.
- No report should publish if the recovered T12 is missing or inconsistent.
- Supporting loan terms should not override core T12 or rent-roll truth.
