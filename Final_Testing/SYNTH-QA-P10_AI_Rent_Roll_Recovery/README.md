# SYNTH-QA-P10 AI Rent Roll Recovery

## Purpose

Manual Screening QA package for InvestorIQ Rent Roll AI Recovery v0.1.

This fixture is designed so:
- the uploaded T12 CSV is intentionally clean and deterministic-parser-friendly
- the rent roll should remain clearly human-readable
- the rent roll should be parser-unfriendly enough that deterministic structured rent-roll parsing may fail or be insufficient
- AI rent-roll recovery may extract a valid structured rent roll only when `ENABLE_AI_RENT_ROLL_RECOVERY=true`

## Files Included

- `t12_clean_source.csv`
- `rent_roll_parser_unfriendly_source.txt`
- `t12_clean_source.txt` reference only, do not upload for this test

## Intended Report Type

- Screening

## Upload Instructions

1. Start a new Dashboard Screening test.
2. Use a distinct synthetic name such as:
   - `SYNTH-QA-P10 AI Rent Roll Recovery`
3. Upload only:
   - `t12_clean_source.csv`
   - `rent_roll_parser_unfriendly_source.txt`
4. Run once with AI recovery disabled to observe deterministic failure or insufficient rent-roll coverage.
5. Run again with `ENABLE_AI_RENT_ROLL_RECOVERY=true` to verify recovery behavior.

## Expected Pass Values

- Gross Rental Income: `111,180`
- Vacancy Loss: `0`
- Effective Gross Income: `111,180`
- Total Operating Expenses: `41,250`
- Net Operating Income: `69,930`

- Total Units: `8`
- Occupied Units: `7`
- Vacant Units: `1`
- Occupancy: `87.5%`
- Monthly In-Place Rent: `9,265`
- Annual In-Place Rent: `111,180`
- Monthly Market Rent: `10,180`
- Annual Market Rent: `122,160`

## Expected AI Behavior

- The uploaded T12 CSV should pass through the normal deterministic parser path.
- Deterministic rent-roll parsing may fail or be insufficient.
- AI recovery should produce `rent_roll_parsed` only if the feature flag is enabled and deterministic validation accepts the candidate payload.
- If AI recovery validates, the Screening report should publish.
- If AI recovery is disabled or rejected, the job should remain fail-closed.

## Intended Stress Point

- The rent roll is the only intended AI recovery stress point in this package.

## Expected Report Checks

- Units: `8`
- Occupancy: `87.5%`
- Annual In-Place Rent: `$111,180`
- EGI: `$111,180`
- OpEx: `$41,250`
- NOI: `$69,930`
- T12 and Rent Roll verified

## Safety Note

AI is extraction-only and validated before use. It does not create investment conclusions or unsupported values.
