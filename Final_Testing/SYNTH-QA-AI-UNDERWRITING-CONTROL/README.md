# SYNTH-QA AI Underwriting Control

Dedicated synthetic QA package set for InvestorIQ AI-assisted extraction recovery in the Underwriting flow.

All properties are fictional. These fixtures are for pre-launch QA only.

## Run Order

1. `01_positive_ai_rent_roll_underwriting`
2. `02_positive_ai_t12_underwriting`
3. `03_positive_dual_ai_recovery_underwriting`

## Recommended Property Names

- `SYNTH-QA-AI-UW-01 Rent Roll Recovery`
- `SYNTH-QA-AI-UW-02 T12 Recovery`
- `SYNTH-QA-AI-UW-03 Dual Recovery`

## Test Intent

- `01_positive_ai_rent_roll_underwriting`
  - stresses AI Rent Roll Recovery only
  - T12 remains deterministic CSV control
- `02_positive_ai_t12_underwriting`
  - stresses AI T12 Recovery only
  - rent roll remains deterministic CSV control
- `03_positive_dual_ai_recovery_underwriting`
  - stresses both AI recovery paths in one Underwriting run

## Expected Anchor Values

### Test 01 - Cedar Park Residences
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

### Test 02 - Northgate Manor
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

### Test 03 - Lakeside Commons
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

## Safety Expectation

- Publish only if deterministic validation accepts recovered artifacts.
- No report should publish if required artifacts are missing, unsupported, or materially inconsistent.
- Supporting loan terms may inform Underwriting sections, but must not override core T12 or rent-roll financial truth.
