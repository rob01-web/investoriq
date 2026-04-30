# 04 Long AI Rent Roll Stress Underwriting

- Intended report type: Underwriting
- Property: Riverside Heights
- Expected outcome: PASS if AI recovery completes and validates
- Acceptable fail: timeout or fail-closed with no report published and credit restored

## Upload Files

- `t12_clean_control.csv`
- `rent_roll_long_ai_recovery_source.txt`
- `loan_terms_simple_source.txt`

## AI Path Stressed

- AI Rent Roll Recovery with a long narrative rent roll
- This is not the primary dual-AI positive control
- This is a long rent-roll AI stress test

## Expected Anchor Values

- Units: `64`
- Occupied: `61`
- Vacant: `3`
- Occupancy: `95.3%`
- Monthly In-Place Rent: `113,400`
- Annual In-Place Rent: `1,360,800`
- Monthly Market Rent: `124,800`
- Annual Market Rent: `1,497,600`
- EGI: `1,360,800`
- OpEx: `503,500`
- NOI: `857,300`
- Loan Amount: `12,000,000`
- Interest Rate: `4.95%`
- Amortization: `35 years`
- LTV: `72%`

## Safety Expectation

- Publish only if deterministic validation accepts recovered artifacts.
- No report should publish if required artifacts are missing, unsupported, or materially inconsistent.
- If this fails by timeout, future product work may require chunking, shorter prompt construction, or steering users toward CSV/XLSX for large rent rolls.
