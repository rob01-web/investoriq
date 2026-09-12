# InvestorIQ Underwriting: complete editorial and visual audit

Reviewed September 6, 2026. Property: Stonebridge Lofts.

## Verdict

**This PDF does not yet meet the institutional presentation standard the owner has set.** The cover, restrained green and gold palette, and earnings bridge establish a promising direction. However, inconsistent metric styling, tiny text, repetitive content, weak page transitions, visible collisions, and several analytical communication defects prevent customer-facing acceptance of this version.

The problem is not a shortage of content or a need for more decoration. The report needs a consistent design system, accurate and useful interpretation, and disciplined editing. Preserve the useful analysis and all source evidence while repairing its presentation.

This is my independent institutional-review judgment. It is not a representation of Ken Dunn's personal opinion or Blackstone's internal standards.

## Review scope and evidence

- Exact file: `Stonebridge_Underwriting_Visual_ELITE_DocRaptor_TEST(1).pdf`.
- SHA-256: `ebf59fbb538a2114fe543d839a3df93e283c33e2694f1d13d0bcc921453f620b`.
- All 21 physical PDF pages were rendered and visually inspected. All extracted report text was read. The source-register, final-page columns, and small charts were inspected at higher magnification.
- Page references below use the PDF's physical page numbers, which match the displayed numbering from page 2 onward.
- The supplied PDF is portrait US Letter, 612 by 792 points, produced by Prince 15.1. It has 30 bookmarks and is not tagged.
- Embedded type families are Cormorant Garamond, DM Sans, and DM Mono. This identifies the actual fonts; it does not establish whether they match the latest approved font tokens in the repository.
- Two independent text extractions found zero U+2014 em dashes and zero U+2013 en dashes. No such punctuation was identified in the visual review. Ordinary hyphens and negative signs remain, as do drawn horizontal rules and dashed chart connectors.
- Calculations below were recomputed from figures printed in this PDF. The eight underlying source documents, report renderer, current Screening PDF, and current canonical handoff files were not supplied for this review. Consequently, this is a complete review of the supplied artifact, not a source-file certification or a new audit of both production pipelines.
- DocRaptor TEST DOCUMENT bands visibly cross several headings. Treat these as test-output overlays, separately from genuine layout defects. Do not infer clipping in the unwatermarked report solely from these bands.
- No application changes, renaming, deployment, production operations, or changes to the original PDF were performed.

## Direct answers to the owner's six questions

| Concern | Recommendation | Reason |
| --- | --- | --- |
| Gold dot after InvestorIQ | Remove it from the wordmark unless it is an explicitly approved brand element. | It reads like stray punctuation, appears on the cover but not in the running wordmark, and adds little identity. Gold can remain in deliberate accents. |
| RECONCILIATION REQUIRED | Replace the prominent label with **SOURCE DIFFERENCES REQUIRE REVIEW**, followed by the actual differences and an action. | Some experienced readers will understand reconciliation, but the label alone does not explain what differs, whether an error is proven, or what the reader should do. |
| Investment Committee Memorandum | My recommendation for the current product is **Underwriting Report**, with **Prepared for investment review** as an optional subtitle. | This artifact provides substantial underwriting analysis, but its front page is not yet a clear committee decision brief. A grander title cannot resolve the missing decision framing. This is a recommendation to reconsider the earlier naming choice, not an implemented reversal. |
| Top of page 2 | Yes, simplify it. | Running title, INVESTMENT COMMITTEE OVERVIEW, and Investment Decision Snapshot compete to introduce essentially the same material. Keep a quiet running header and one main title. |
| Em dashes throughout | Not in the searchable text of this PDF, and none identified visually. | The two text scans found zero em or en dashes. Preserve subtraction/negative notation and meaningful hyphens; remove redundant decorative rules separately. |
| Three lines under Key Metrics Snapshot | Yes, remove the stacked treatment across the report. | Page 3 combines the heading's accent rule, another divider, and a heavy black grid border. Similar layering recurs elsewhere. Use one visual separator at a section boundary. |

Suggested first-page review-status wording:

> **Source differences require review**
>
> T12 gross potential rent is $180,000 higher than annualized in-place rent in the Rent Roll. These measures cover different bases and periods; the report does not establish the reason for the difference. Listed expense lines also total $20,000 less than stated operating expenses. Obtain the supporting schedules before relying on conclusions affected by these differences.

This wording identifies two separate issues. It does not declare the rent comparison a proven accounting error, invent its cause, or replace accepted financial inputs.

## Priority register

Priority definitions: **P1** = correct before customer acceptance of this artifact; **P2** = required editorial/design work for the owner's premium standard; **P3** = refinement. Source questions remain open until verified; do not turn a hypothesis into a code change.

| ID | Priority | Location | Finding and required outcome |
| --- | --- | --- | --- |
| A01 | P1 | 7-8 | 2BR in-place rent changes from $1,881.25 to $1,881.00; page 8's $544.00 gap fails to reproduce the printed annual total. Use consistent source precision and calculation inputs. |
| A02 | P1 | 7 | 1BR is called the largest unit category despite a 32/32 tie. Correct the tie-handling language. |
| A03 | P1 | 11, 13, 15-16 | Rate stress is called deferred but is provided in the debt section. Replace stale scope statements with accurate cross-references. |
| A04 | P1 | 20 | Source filenames overlap the document-role column. Wrap long filenames safely and preserve complete identities. |
| A05 | P1 | 21 | Adjacent manifest columns touch; report identity and evidence text run together. Establish a real gutter or stack these blocks. |
| A06 | P1 | 2, 4-6, 19 | The principal status does not adequately distinguish a cross-basis rent comparison from the separate $20,000 expense discrepancy. Explain both with affected conclusions and actions. |
| A07 | P1 | 3, 7, 10, 16 | Break-even occupancy labels conceal different revenue bases. The displayed GPR ratios do not equal break-even under the report's own occupancy-stress model. Publish formulas and qualify their meaning. |
| A08 | P1 | 13-14, 17, 21 | Document-count and coverage language can imply completeness despite missing reserve inputs and expressly excluded analyses. State exactly what was checked. |
| A09 | P1 | 14 | Environmental status says “None identified in this summary” without naming what is absent or linking to a source conclusion. Make the subject and limitations explicit. |
| A10 | P1 | 1-2, 20-21 | Data dates, source periods, and currency are insufficiently apparent. Recover and display them from sources; mark unknowns as unknown. |
| V01 | P2 | Throughout | Repeated stacked rules and mixed black/green/gold border hierarchies. Establish one rule system. |
| V02 | P2 | 2-3, 5, 20 | KPI numbers change family, weight, and color between modules. Use one approved metric treatment. |
| V03 | P2 | Throughout | Key supporting text is very small; measured examples include 5.2-point labels on page 2, 5.8-point chart values on page 8, and 5-point evidence labels on page 18. Reflow for readable text. |
| V04 | P2 | 6-7, 10, 12, 15-16, 19, 21 | Unlabeled continuations and short stranded table fragments weaken page flow. Keep short tables together and clearly label necessary continuations. |
| E01 | P2 | 2-4, 9, 11-14, 19-21 | Repeated metrics, warnings, scope inventories, and production-language explanations bury the investment questions. Consolidate without losing evidence. |
| E02 | P2 | 2-4, 7, 11-13, 21 | Grammar, vague labels, and system-facing terminology require a full copy pass. Use the replacement examples below. |
| D01 | P2 | 1-2, 12-19 | Title and decision framing need alignment. Make material risks, financing effects, capital needs, and unresolved questions visible before detailed schedules. |

## Page-by-page findings

### Page 1: Cover

**Keep:** The dark green field, large property name, restrained palette, and generous opening space create a strong first impression. The cover has no printed page number, which is appropriate for the current treatment.

1. **Remove the gold wordmark dot.** Its separation from the name makes it look incidental; it is inconsistent with the interior wordmark.
2. **Resolve the title deliberately.** Use “Underwriting Report” for the current product recommendation. If retaining “Investment Committee Memorandum,” rebuild the decision brief so the title describes an actual decision document.
3. **Replace the generic status label.** Use the plain-language status above. Put its full explanation on page 2, not a paragraph on the cover.
4. **Improve the evidence block.** “2 core sources + 6 supporting” is an incomplete phrase and wraps awkwardly. Use “2 core documents” and “6 supporting documents” as two intentional lines.
5. **Simplify labels.** “Property scale” can become “Property”; “64 units” is sufficient. “Evidence basis” can become “Documents reviewed.”
6. **Separate preparation date from source dates.** September 6 is the report-generation date. It should not imply that the operating statements or appraisal are current to that date.
7. **Review the subtitle spacing.** Word spacing in “Investment Committee Memorandum” is conspicuously open. Keep natural spacing and apply typography consistently.
8. **Improve footer contrast.** The bottom-right descriptor is very faint. Remove it if it adds no useful information, or give it readable contrast.
9. **Check brand-level facts.** Confirm the displayed legal entity and approved wordmark casing against current authority during implementation. The PDF alone is not proof of the official brand specification.
10. **Orientation is unresolved at authority level.** This artifact is portrait. Earlier project context discussed landscape institutional layouts; check the current approved prototype and canonical handoff before changing orientation. Portrait is not inherently defective.

### Page 2: Investment Decision Snapshot

**Keep:** The attempt to lead with transaction facts and conditions for proceeding. The purchase price, current NOI, debt comparison, and capital program are useful ingredients.

1. **Remove the redundant eyebrow.** “INVESTMENT COMMITTEE OVERVIEW” adds little above “Investment Decision Snapshot.” The quiet running header can remain.
2. **Replace the status echo.** “RECONCILIATION REQUIRED” followed by “Primary source reconciliation required” explains nothing new. State the $180,000 comparison, $20,000 expense discrepancy, and required evidence.
3. **Remove internal label instructions.** “Only source-supported transaction, capital, and debt facts may establish this label” belongs in product logic, not beneath Strategy Fit. Explain the strategy using actual facts.
4. **Validate “LIGHT VALUE-ADD HOLD.”** The report shows a $1.28 million program affecting 59.4% of units, but does not show the rule or source statement supporting “light” and “hold.” Use “Documented renovation program” if the strategy classification cannot be substantiated. Do not infer a hold period from a 24-month renovation schedule.
5. **Correct “64 Unit” to “64 units.”**
6. **Reduce front-page metric competition.** Sixteen metrics receive space before the decision narrative. Give priority to acquisition price, NOI, proposed DSCR, capital budget, and the principal unresolved issues. Move duplicate consistency ratios to detail.
7. **Remove the duplicate 7.00% headline.** Going-in cap rate and NOI / Purchase Price are the same displayed ratio here; the “Consistency view” does not deserve another executive metric slot.
8. **Shorten labels and clarify them.** “Appraised Value Context” can be “Appraised value.” “Gross Rent Gap” can be “Annual rent difference to stated market.” Keep the basis caveat nearby.
9. **Replace the middle-column heading.** “What can kill or reprice it” is forceful but too colloquial for the intended client document. Use “Principal risks and repricing factors.”
10. **Separate thesis from risk.** The DSCR reduction appears in both the investment thesis and risk column. State it once, with its consequence. A fact inventory is not yet an investment thesis.
11. **Fix parallel construction.** “What must be true” mixes conditions with questions ending in periods. Use action verbs: “Explain the income-basis difference”; “Substantiate achievable rents”; “Confirm financing terms and lender requirements.”
12. **Elevate the expense issue.** The $20,000 unresolved expense subtotal difference deserves executive visibility, particularly when stated NOI supports valuation and debt metrics.
13. **Explain the two rent figures.** The $285,600 market gap and $124,200 renovation lift are different measures. Do not imply they are additive, equally achievable, or interchangeable.
14. **Provide page references for actions.** A reader should be able to move directly from each issue to its detail. Critical small labels on this page are approximately 5.2 points; increase their size rather than packing more into the grid.

### Page 3: Decision Evidence Map and Key Metrics Snapshot

1. **Remove the product slogan from report flow.** “Decision first. Facts before prose.” is a good internal doctrine. Here it is stranded above a large table and duplicate metrics.
2. **Turn the map into useful navigation.** Every Coverage cell says “Presented,” so the column conveys little. Replace it with page references, or move the coverage inventory to the appendix. The PDF already has bookmarks; retain them.
3. **Use investor questions as navigation labels.** For example: “What supports current NOI?” and “How does proposed financing change coverage?” Avoid long semicolon-separated lists of nearly every section.
4. **Consolidate the KPI snapshot with page 2.** Preserve unique detail metrics, but do not reprint six major headline numbers in another design language immediately afterward.
5. **Remove the triple rule.** Keep one section separator; eliminate the extra green divider and heavy black top border.
6. **Standardize number typography.** Page 2 uses green sans-serif KPI figures; page 3 switches to black serif figures, then bold mono-style table numbers. This looks like separate templates assembled together.
7. **Correct the break-even label.** “Break-Even Occupancy” omits that the displayed ratio excludes debt and uses T12 GPR. This is material, not a stylistic preference.
8. **Explain rounding.** 93.8% and 34.4% visually imply 59.4 percentage points, while the printed 59.3 uses unrounded inputs. Keep full-precision calculations and a standard rounding note; do not change correct results to match subtraction of rounded labels.

### Page 4: Underwriting Observations and Primary Source Reconciliation Alert

1. **Replace availability statements with observations.** “Current NOI is established from verified operating inputs” says the data exists. “T12 NOI is $945,000, representing a 63.0% margin” tells the reader something useful.
2. **Correct the lowercase opening.** “a source-supported going-in cap-rate reference is available” starts with an uncapitalized letter.
3. **Use the actual DSCR results.** “At or above 1.00x” is a very broad mathematical condition. Display current 2.01x and proposed 1.40x with the relevant basis. Do not imply 1.00x is lender approval.
4. **Avoid overclaiming verification.** “Verified operating inputs” can sound like independent verification of source truth. Describe what was actually checked, and distinguish uploaded facts from calculations.
5. **Consolidate the reconciliation copy.** The same “has not reconciled ... does not infer the cause” wording appears repeatedly on this page and later. Replace the alert with amounts, basis, limitations, and action.
6. **Explain comparability immediately.** T12 gross potential rent and a point-in-time annualized in-place rent measure need not be equal. Their $180,000 difference is real arithmetic, but its cause and significance require a bridge between dates and definitions.
7. **Balance the layout.** The large alert title and repeated rule treatments outweigh the modest amount of interpretation. Remove redundant decoration and use the space for the source question.

### Page 5: Operating Performance Overview, Revenue Quality, Expense Structure

1. **Compress the repeated KPI strip.** This is the third substantial presentation of occupancy and NOI. Retain it only if it introduces a focused operating discussion.
2. **Remove methodology narration from the opening.** “Defined operating facts and deterministic calculations” is not useful introductory copy for an investor.
3. **Qualify “Revenue Quality.”** The section shows revenue amounts and ratios, but little collection-quality evidence. “Revenue reconciliation” or “Revenue composition” better fits the displayed analysis unless arrears, concessions, collection loss, or other supported quality facts are added.
4. **Keep definitions distinct.** EGI / GPR of 93.0% is not the same as physical occupancy of 93.8%. Do not visually imply a single occupancy measure.
5. **Handle the $112,800 label consistently.** Here it is “Gross Potential Rent less EGI”; page 9 calls it “Vacancy Allowance.” Confirm the source actually states the latter. Arithmetic alone cannot establish whether the whole difference is vacancy.
6. **Elevate the $20,000 discrepancy.** Six expense categories sum to $535,000 while total expenses are $555,000. Give the difference its own clear reconciliation row. Do not invent a new expense category or change stated NOI.
7. **Reduce excessive vertical gaps.** The gap before Revenue Quality and before Expense Structure consumes space that could keep the expense analysis together.
8. **Prevent the expense section from becoming an unlabeled continuation.** Its concluding metrics start page 6 under a different running title.

### Page 6: Expense Continuation and NOI & Margin Analysis

**Keep:** The earnings bridge is one of the strongest visuals in the report. It communicates $1.5 million less $555,000 equals $945,000 directly.

1. **Add “Expense structure, continued” where necessary.** The page begins with “Largest Listed Expense Category” without a local title explaining the continuation.
2. **Complete the subtotal bridge.** Show listed lines $535,000, unexplained difference $20,000, and stated total $555,000. Describe the difference as unreconciled, not as a source-stated category.
3. **Use a meaningful expense heading.** “Accepted expense lines” is process language. “Reported expense categories” is clearer.
4. **Keep the waterfall's explanatory connectors.** Dashed connectors in this chart serve a real function. They are not em dashes or decorative rules to delete indiscriminately.
5. **Consolidate chart and duplicate schedule.** The table below repeats the bridge almost verbatim. Keep unique measures such as NOI per unit and margin; avoid another full three-line income statement unless needed for accessibility or precision.
6. **Remove the double boundary below the chart.** Gold plus green rules at the chart/table transition add clutter.
7. **Keep short NOI detail together.** Three concluding rows move to page 7. Rebalance spacing or move the whole compact group.

### Page 7: NOI Continuation, Unit / Rent Concentration, Operating Interpretation

1. **Correct the largest-category error.** Both 1BR and 2BR contain 32 units, or 50.0%. Write “Unit mix is evenly split between 1BR and 2BR.” The error occurs in both the summary row and interpretation bullet.
2. **Preserve the precise 2BR rent.** This page prints $1,881.25, which reproduces the total annual in-place rent with the displayed unit counts. Page 8 does not.
3. **Replace the unexplained QA identity.** “EGI less OpEx less NOI: $0; Within deterministic reconciliation tolerance” is an internal arithmetic check. If retained, use “Income statement arithmetic reconciles” and disclose the separate expense-line issue.
4. **Correct the scope of break-even.** Show the formula and exclusions. “Debt service is not included here unless separately analyzed” is ambiguous; this displayed operating ratio excludes debt, full stop.
5. **Fix awkward grammar.** Replace “Property Taxes is the largest listed expense line” with “Property taxes are the largest listed expense category.”
6. **Remove repeated table narration.** Several bullets restate the preceding tables. Favor supported implications: the mix is evenly split, but 2BR contributes $208,800, or about 73.1%, of the $285,600 annual rent gap.
7. **Simplify conditional boilerplate.** Replace “Occupancy concentration by unit type is not inferred unless accepted unit-level occupancy evidence establishes it” with “Occupancy by unit type is not shown” plus the actual missing evidence, if verified.

### Page 8: Operating Visuals, Unit Mix, Market Survey

1. **Repair the precision inconsistency.** The 2BR chart/table show $1,881.00 and a $544.00 monthly gap. Page 7 shows $1,881.25, implying $543.75. The page 8 displayed rows imply $285,696 annual gap, not $285,600. Preserve precise arithmetic; use whole-dollar presentation only with an explicit consistent rounding policy.
2. **Give chart labels room.** Amounts touch bar endpoints and the right chart's boundary. Use allocated label columns, comfortable padding, and readable chart text.
3. **Use stable color semantics.** Market rent is gold for 1BR but dark green for 2BR. In-place and market should retain their meaning across series.
4. **Clarify “composition.”** EGI, expenses, and NOI are related through subtraction; they are not three additive components. The waterfall already explains this better.
5. **Remove the technical section title.** “Operating Evidence Visuals” describes a rendering module. Use the specific analytical subject, such as “Income and rent profile.”
6. **Consolidate repeated rent tables.** Pages 7 and 8 show overlapping unit-mix information. One complete table with precise values can carry the detail; put the chart beside that analysis.
7. **Replace “Annual Gross Rent Upside.”** “Annual rent difference to stated market” avoids implying realizable upside. Explain that costs, downtime, and achievability are not incorporated.
8. **Preserve the good market distinction.** The survey ranges are separately identified and do not replace Rent Roll market rents. Add source dates and comparison context if available.
9. **Do not overstate market support.** Being $50 or $75 below the survey low does not by itself establish achievable rents. Address comparability, condition, concessions, dates, and sample coverage only where supported.

### Page 9: Operating Statement / TTM Summary and Scenario Basis

1. **Standardize T12 versus TTM.** Use one main label, for example “Trailing 12-month operating statement,” and show the actual period from the source.
2. **Remove repeated acceptance rows.** Operating Statement Evidence and Rent Roll Evidence belong in the appendix unless an exception directly changes this schedule.
3. **Use a proper income-statement hierarchy.** This page lists vacancy and selected expenses, then repeats EGI, expenses, and NOI. Consolidate with pages 5-6 or present a complete statement with totals and the unresolved subtotal difference.
4. **Verify “Vacancy Allowance.”** Do not promote the $112,800 residual to a source fact without its source label.
5. **Simplify the scenario transition.** The black chapter rule, large title, paired rules, badge, paragraph, and evidence column stack too many elements around a simple methodology introduction.
6. **Use a human-readable scenario qualifier.** “Illustrative downside scenarios” with a concise explanation is clearer than “SCENARIO ANALYSIS: NOT SOURCE EVIDENCE.” Preserve the analytical distinction.
7. **Keep the six-row base-input table together.** Purchase Price alone moves to page 10. There is no reason to strand one row of such a short schedule.

### Page 10: Scenario Rules, Occupancy Stress, Expense Stress

1. **Resolve the stranded base-input row.** Begin this page with an intentional section, not a lone purchase-price continuation.
2. **Keep the useful mechanics.** Linear scaling of EGI with occupancy and fixed expenses are stated clearly enough to reproduce the scenarios. Make the assumption prominent and concise.
3. **Define pp and bps once.** Use “Occupancy down 5 percentage points” in user-facing labels where space allows. State that calculations use unrounded base occupancy of 93.75%.
4. **Remove repeated disclaimers.** A clear common scenario note can carry shared limitations; individual schedules need only their distinct assumptions.
5. **Improve scenario labels and row widths.** “Operating expenses +10%” wraps unnecessarily. Make scenario labels concise and keep units in headers.
6. **Add the decision consequence.** The 10-point occupancy case lowers NOI by $160,000; the 10% expense case lowers it by $55,500. These are useful comparisons for these selected shocks, not a universal ranking of risk.

### Page 11: Cap-Rate Sensitivity, Combined NOI Matrix, Scenario Boundaries

1. **Keep the sensitivity arithmetic.** The displayed 7.5% and 8.0% cap-rate values reconcile to $945,000 NOI.
2. **Add percentage losses alongside dollars if helpful.** The 100-basis-point case is $1,687,500, or 12.5%, below purchase price. Distinguish this illustrative pricing case from a market valuation or exit forecast.
3. **Make the matrix earn its visual space.** A restrained tonal scale and a clearly indicated base cell would make the worst modeled result easier to find. Preserve numbers and avoid implying probabilities.
4. **Fix grammar and jargon.** “It does not add a probability, forecast, or investment decisions” has a number mismatch. “Perturbations” is unnecessary. Use “The matrix combines the occupancy and expense assumptions above. Results are illustrative.”
5. **Correct the rate-stress scope statement.** It is excluded from this operating matrix but included on pages 15-16. Say that explicitly.
6. **Remove development-roadmap language.** “Current sensitivity set,” “this packet,” and “dedicated driver analysis” are not useful client explanations.
7. **Keep Sensitivity Reference with its table.** Its heading and introduction are on page 11, while the actual table starts page 12.

### Page 12: Sensitivity Reference and Interpretation

1. **Rejoin the table with its heading.** Alternatively, label the continuation explicitly.
2. **Widen and left-align the first column.** Centered driver labels wrap into tall, awkward stacks and consume space without improving comprehension.
3. **Use a clearer column label.** Replace “Relative movement within target” with “Change from base (%)” and identify whether each row measures NOI or value.
4. **Make direction explicit.** Positive percentages currently describe negative outcomes. Use “NOI decline: 16.9%,” “Value decline: 12.5%,” and “NOI decline: 5.9%,” or a consistent signed format.
5. **Remove empty ranking claims.** “Cap Rate produces the largest ... movement in Implied Value” adds little when cap rate is the only displayed value driver. State its actual effect.
6. **Lead with the combined downside result.** “At 83.75% occupancy and 10% higher expenses, modeled NOI is $729,500, down 22.8%.” This is more useful than repeated instructions about output families.
7. **Consider linking the compound result to proposed debt.** The printed $729,500 NOI and modeled $676,249 annual debt service imply about 1.08x DSCR, holding proposed financing fixed. This is an additional derived scenario, not currently printed. It needs proper scenario integration and validation before publication.

### Page 13: Scope Exclusions and Transaction Context

1. **Remove the repeated scope inventory from the top.** Rent, rates, and price were already discussed on page 11. The page begins with production limitations before returning to the transaction.
2. **Correct false or ambiguous cross-references.** Rate stress exists later. The report does not display a debt-amount sensitivity schedule, despite language deferring it to debt analysis. Clearly distinguish a missing test from one located elsewhere.
3. **Replace “No defined ... exists yet.”** This exposes unfinished implementation. Describe this report's actual analytical boundary and any missing inputs without pretending unavailable functionality exists.
4. **Simplify the transaction heading.** “Transaction & Diligence Intelligence” is inflated relative to the schedule. “Transaction terms and diligence” is precise.
5. **Consolidate the three LTV checks.** 70.00%, 70.00%, and a 0.00% difference do not need three prominent rows. Show the ratio and a concise reconciliation note. If a difference is shown, use percentage points.
6. **Label the $4,050,000 carefully.** It is purchase price less proposed loan, before other uses. It is not total equity required. Keep capital, fees, reserves, closing costs, timing, and funding allocation separate unless established.
7. **Humanize the maturity date.** “November 1, 2029” is easier to read than an ISO timestamp-style date in the client report.
8. **Qualify the document score.** “Documented 6 / Not Provided 0” applies to six tracked supporting categories, not all acquisition diligence. Reserve inputs are explicitly absent later. Rename this to “Supporting documents received” and define its scope.

### Page 14: Diligence Details and Financing Readiness

1. **Use a local continuation title.** The page begins with a detailed table while its running header names a section that appears near the bottom.
2. **Shorten the repeated treatment text.** Every row explains how a source cannot replace another source. Use a common evidence-policy note and retain only source-specific exceptions.
3. **Repair the environmental statement.** “Environmental / Phase I Status: None identified in this summary” does not tell us whether it means no recognized conditions, no findings extracted, or no conclusion available. Verify the source's wording, subject, date, and limitations before rewriting.
4. **Avoid “InvestorIQ valuation” overreach.** The table says an appraisal does not replace “InvestorIQ valuation,” while page 18 properly calls the calculation a consistency cross-check, not an independent opinion. Align those descriptions.
5. **Do not equate receipt with financing readiness.** The section contains a source-availability checklist. Rename it “Financing information available” unless lender requirements, open conditions, and actual readiness criteria are supported.
6. **Replace the publication-policy paragraph.** Optional diligence not invalidating sufficient core underwriting is a system rule. State the actual missing information and affected analysis for this property.
7. **Keep the short checklist together.** One final checklist row spills onto page 15 and interrupts the debt chapter.

### Page 15: Debt Intelligence and Rate Sensitivity

**Keep:** Separating existing debt from proposed acquisition financing is valuable and essential. The proposed payment and DSCR arithmetic reproduce from the printed terms under a standard monthly level-payment model.

1. **Start the debt chapter cleanly.** Remove the inherited checklist fragment through better pagination.
2. **Align comparable debt metrics by row.** The current two-column lists have different row orders and lengths. A common metric column with Current and Proposed values would make comparison faster, with distinct rows for source-specific inputs.
3. **Shorten repeated prefixes.** Within a Proposed Financing column, “Proposed Acquisition Financing Annual Debt Service” can be “Annual debt service.”
4. **Label the payment basis.** Current debt service uses the stated $39,250 monthly payment. Proposed payments are modeled from rate, amount, and amortization. Preserve that distinction and show the payment convention.
5. **Do not silently reconcile loan terms.** Source-stated current payments need not exactly equal a new model based on rounded rate and remaining amortization. Source review is required before changing them.
6. **Keep rate sensitivities together.** The +200-basis-point row is stranded on page 16. This short table can be moved intact.
7. **Include the base rate in the sensitivity table.** Showing 5.95% and 1.40x beside the stresses makes the deltas easier to interpret without scanning another table.
8. **Label the cushion accurately.** It is NOI less annual debt service at 1.00x coverage, not lender covenant headroom or distributable cash flow after all capital needs.

### Page 16: Debt Continuation, Maturity, Capacity

1. **Rejoin the +200-basis-point row.** Preserve its note with the table.
2. **Name the relevant debt.** “Maturity Date” should be “Current loan maturity” so it cannot be mistaken for the proposed facility's term.
3. **Replace the tautological status.** “Scheduled after the analysis date” says little. The stated maturity is November 1, 2029, 1,152 days after September 6, 2026. An approximate years/months display is more useful beside the exact date.
4. **Define occupancy coverage formulas.** The printed 63.6% and 76.3% reproduce as expenses plus debt service divided by T12 GPR. They do not match break-even under the EGI/occupancy relationship used in the stress tables. Do not present them as universal physical occupancy thresholds.
5. **Qualify monthly rent per unit.** The displayed $1,336 and $1,603 spread costs over all 64 units. Label that basis so they are not confused with required rent per occupied unit.
6. **Check the resulting headroom claim.** The 17.4-percentage-point comparison inherits the GPR-basis qualification and combines it with point-in-time physical occupancy. Make that limitation visible, or use a consistently defined model.
7. **Consolidate repeated caveats.** One concise note can distinguish calculations from lender covenants, quotes, and refinancing forecasts.

### Page 17: Capital Plan and Reserve Position

**Keep:** The page separates capital costs, interior program coverage, rent-lift arithmetic, and timing. The reported $1.28 million total and $124,200 gross annual lift reconcile to the displayed components.

1. **Show the total budget in this section.** It is stated elsewhere but not displayed as a total row in the capital economics table. Add $1,280,000 and reconcile interior $802,000 plus other capital $478,000.
2. **Make the missing reserve information visible.** “Reserve balance and contributions not provided” deserves a concise labeled item, not only an introductory sentence under a title promising reserve analysis.
3. **Shorten the stacked subheadings.** “Renovation / CapEx Context” and “Capital Program Economics” are redundant in this arrangement.
4. **Use a real execution visual.** The two source-stated interior timelines can be shown as simple aligned bars from Month 1 to Months 18 and 24. Do not invent calendar dates or phasing for other work.
5. **Clarify the lift time basis.** The $124,200 is an annualized gross lift based on stated unit counts and monthly increases, not necessarily cash collected in the first year of a phased program.
6. **Do not add the lift to the full rent gap.** The $124,200 program lift and $285,600 market gap may overlap; their relationship is not reconciled here. State that and request unit-level matching if needed.
7. **Qualify payback prominently.** 10.31 and 6.46 years are capital divided by gross annual rent lift. They exclude operating costs, downtime, financing, and rollout timing. Consider whether the figures add enough decision value to merit their prominence.
8. **Distinguish unknown from not applicable.** For common-area projects, “Units not stated” may be less useful than a deliberately applicable scope field. Do not blanket-fill cells with “Not stated” when the dimension does not apply.

### Page 18: Valuation Position & Reconciliation

1. **Consolidate repeated identities.** The page calculates $13.5 million, shows it in a three-reference table, then calculates a zero difference to $13.5 million again. One comparison schedule and one explanation are enough.
2. **Preserve the important caveat.** T12 NOI divided by the supplied going-in cap rate is a consistency calculation, not independent confirmation of market value or purchase attractiveness.
3. **Rename “Valuation Bridge.”** It is a reference comparison rather than a decomposition of value changes. “Valuation references” is more accurate unless an actual bridge is constructed.
4. **Reduce label length.** “NOI / Cap-Rate Cross-Check Value” can become “Value implied by stated cap rate,” with the formula in a note.
5. **Improve evidence-label readability.** The right column uses approximately 5-point text. Short source references and a legend can be readable without repeating “Calculated from report inputs” in every row.
6. **Do not let appraisal context imply an automatic bargain.** The $700,000 spread is a comparison of different inputs and possibly different dates and valuation premises. Present those bases beside the figures.
7. **Keep the appraisal comparison together.** A final $700,000 difference row is carried to page 19.

### Page 19: Appraisal Continuation and Core Source Reconciliation

1. **Name the comparison basis.** “5.2% above the comparison basis” should say “5.2% above the purchase price” where that is the denominator.
2. **Avoid promoting the cross-check into a valuation opinion.** “The whole-property value indication remains anchored...” is stronger than the careful qualification on page 18. Use consistent terminology.
3. **Remove repeated zero-variance observations.** They repeat page 18's arithmetic without new interpretation.
4. **Move the strongest rent-basis explanation forward.** The note correctly distinguishes a point-in-time annualized Rent Roll measure from a trailing T12 measure. Readers need that explanation where the alert first appears.
5. **Standardize amount precision.** “$180,000.00 below” adds cents to a report otherwise using whole-dollar aggregate amounts. Use $180,000.
6. **Standardize variance precision.** The report alternates between -11.2% and -11.16%. Choose a consistent display policy and label the T12 denominator.
7. **Add a concrete reconciliation request.** Ask for a bridge covering source dates, unit coverage, rent definitions, and any supported vacancy/concession changes. These are items to investigate, not asserted causes.

### Page 20: Data Coverage and Source Register

1. **Repair the visible filename collisions.** The T12 and Rent Roll filenames extend into the Document Role column. This is a confirmed rendered defect, not an extraction artifact.
2. **Preserve complete original filenames.** Break long strings safely at separators or provide a two-line document entry. A short friendly source label can precede the full filename; do not silently truncate source identity.
3. **Reduce repeated acceptance language.** “Core Quantitative Source” appears in more than one column. Use simpler Role, Used for, and Limitations fields.
4. **Consolidate repeated coverage blocks.** The same six source-availability items appeared on pages 14-15. Let the appendix own the complete inventory and cross-reference it from the body.
5. **Do not label availability as reliability.** “Source Reliability Snapshot” currently reports only “Source facts available.” Availability does not establish accuracy, currency, independence, or completeness.
6. **Improve source traceability.** Add source date/period and usable worksheet/page references where obtainable. The current register lists files but does not let a reader readily locate the exact basis of a major claim.
7. **Retain clear continuation headers.** The register continues onto page 21 and repeats column labels. Preserve that behavior while adding a recognizable “Source register, continued” title if needed.

### Page 21: Methodology and Quality Manifest

**Keep:** Methodology & Data Transparency is present. It has not disappeared; it is a small three-column block on the last page. Preserve its substance and the required Quality Manifest.

1. **Fix the manifest gutter.** The left identity values and right evidence paragraphs meet at the same boundary. “T12 + Rent Roll” visually runs into “plan support” on the adjacent side. Reflow or stack the panels.
2. **Align top edges consistently.** The paired panels have staggered rule and heading positions. Apply one block layout with predictable internal spacing.
3. **Simplify the introduction.** Calling the manifest a “reader-facing trust summary” describes the feature rather than helping the reader. State what was reviewed and what remains unresolved.
4. **Keep the required manifest, translate its labels.** “29 full | 1 qualified | 1 compact” is an unexplained internal count. Provide named topics and what their limitations mean, or clearly define the categories while preserving technical records separately.
5. **Correct the coverage overstatement.** “No analytical topic was omitted without an integrated replacement surface” is opaque and invites conflict with the excluded sensitivities and missing returns/reserves. Distinguish report-section treatment from analyses that were not performed.
6. **Make unresolved items explicit.** “Core reconciliation: Reconciliation disclosure presented” records that a warning exists, not whether reconciliation is resolved. State the open rent comparison and expense subtotal issue.
7. **Expose useful traceability.** If a report ID and revision are available, show them. Saying certification identity is retained elsewhere does not help a recipient identify the actual file. Do not invent these identifiers for a test PDF or imply a test artifact has production certification.
8. **Preserve the distinction between accepted and verified.** Methodology says “verified source documents.” Describe validation accurately and avoid implying independent verification of every source fact.
9. **Give the final page a deliberate close.** A readable limitations and methodology summary with report identity would be a stronger ending than crowded production terminology. Content-driven pagination may require another page; that is acceptable.

## Internal arithmetic and interpretation checks

These checks establish agreement with the figures printed in the report, not the accuracy of the original uploaded source documents.

| Check | Recalculation | Result |
| --- | --- | --- |
| Occupancy | 60 / 64 = 93.75% | 60 occupied units is inferred from 64 units and rounded 93.8% under a unit-count occupancy model; verify against the original Rent Roll. |
| NOI | $1,500,000 - $555,000 = $945,000 | Consistent. |
| Expense ratio / NOI margin | $555,000 / $1,500,000 = 37.0%; complement = 63.0% | Consistent. |
| Expense categories | $185,000 + $104,000 + $86,000 + $72,000 + $60,000 + $28,000 = $535,000 | $20,000 below stated expenses; report discloses it but underemphasizes it. |
| Annual rent difference | $1,718,400 - $1,432,800 = $285,600 | Consistent at total level. |
| Page 7 in-place rent | (32 × $1,850 + 32 × $1,881.25) × 12 = $1,432,800 | Consistent. |
| Page 8 in-place rent | (32 × $1,850 + 32 × $1,881.00) × 12 = $1,432,704 | Printed details are $96 below printed total; formatting precision is inconsistent. |
| Page 8 rent gap | (32 × $200 + 32 × $544) × 12 = $285,696 | Printed details are $96 above printed total. |
| Current DSCR | $945,000 / $471,000 = 2.00637x | Consistent with 2.01x. |
| Proposed debt service | $9,450,000 at 5.95%, 360 monthly level payments | $676,249.24 annualized; consistent with $676,249. |
| Proposed DSCR | $945,000 / $676,249.24 = 1.39741x | Consistent with 1.40x. |
| Proposed debt yield | $945,000 / $9,450,000 = 10.0% | Consistent. |
| Cap-rate values | $945,000 / 7.5% = $12,600,000; / 8.0% = $11,812,500 | Consistent. |
| Compound downside | $1,340,000 - $610,500 = $729,500 | Consistent; $215,500 or 22.8% below base NOI. |
| Interior capital | 20 × $18,500 + 18 × $24,000 = $802,000 | Consistent. |
| Total capital | $802,000 + $210,000 + $115,000 + $153,000 = $1,280,000 | Consistent. |
| Annual program lift | (20 × $225 + 18 × $325) × 12 = $124,200 | Consistent as gross annualized arithmetic. |
| Maturity interval | September 6, 2026 to November 1, 2029 | 1,152 days, consistent. |

### Break-even basis needs an explicit decision

The report prints operating break-even of 34.4%, which reproduces as:

`$555,000 / $1,612,800 T12 GPR = 34.4122%`.

The 93.75% base is inferred from the displayed unit count, rounded occupancy, and scenario arithmetic; original source verification remains required. Its occupancy scenarios reproduce using `EGI = $1,500,000 × scenario occupancy / 93.75%`. Under that same model, zero NOI occurs at:

`93.75% × $555,000 / $1,500,000 = 34.6875%`, or 34.7%.

Similarly, proposed debt-inclusive coverage is printed as 76.3%, reproducing from costs plus debt service divided by GPR. Under the occupancy-stress model, the corresponding zero cash remainder after debt service is:

`93.75% × ($555,000 + $676,249.24) / $1,500,000 = 76.9531%`, or 77.0%.

**Required resolution:** Either retain the GPR ratios with precise labels, formulas, and limitations, or adopt a consistent explicitly defined occupancy model across the relevant sections. Do not silently swap inputs to make numbers agree. The PDF proves a difference in basis; source and code review must establish the governing method.

## Copy replacement sheet

| Current text | Proposed replacement or treatment |
| --- | --- |
| RECONCILIATION REQUIRED | Source differences require review |
| Primary source reconciliation required | State the amounts, basis difference, expense discrepancy, and next action. |
| 64 Unit | 64 units |
| Only source-supported ... facts may establish this label. | Replace with the property's supported strategy facts; delete label-governance instructions. |
| What can kill or reprice it | Principal risks and repricing factors |
| What must be true | Conditions to resolve before proceeding |
| What explains the difference ... . | Explain the difference between T12 gross potential rent and annualized in-place rent. |
| What evidence supports achievability ... . | Substantiate the achievable rent assumptions. |
| a source-supported going-in cap-rate reference is available. | The supplied transaction assumptions state a 7.00% going-in cap rate. |
| Property Taxes is ... | Property taxes are ... |
| 1BR is the largest accepted unit category ... | The unit mix is evenly split: 32 one-bedroom and 32 two-bedroom units. |
| Operating Evidence Visuals | Income and rent profile |
| Rent positioning anchor | Annual in-place rent vs. stated market rent |
| Annual Gross Rent Upside | Annual rent difference to stated market |
| Interest Rate Stress: Deferred ... | Proposed interest-rate sensitivity appears in the debt section. |
| No defined ... stress family exists yet | State this report's actual scope and verified missing inputs; omit implementation-roadmap language. |
| Relative movement within target | Change from base (%) |
| Scheduled after the analysis date | Current loan matures November 1, 2029. |
| Source Reliability Snapshot | Source information available |
| Reconciliation disclosure presented | Unresolved source differences: see the identified issues and required evidence. |
| No analytical topic was omitted without an integrated replacement surface. | List actual scope limitations and missing inputs in plain language. |

## Design and publishing specification for the repair

1. **One typography system.** Use the current approved fonts and map headings, prose, metrics, labels, and footers consistently. Do not let one KPI module use serif black numerals while another uses sans-serif green numerals for the same purpose. Numeric tables should use aligned, stable-width figures without making every number look like code.
2. **Readable minimums.** As design targets, aim for approximately 10-11 point body copy, 9-10 point table text, and 8-9 point notes at intended print size. Validate against the approved typeface and actual output. Essential meaning should not depend on 5-point text. Reflow content rather than shrinking it to hit a page count.
3. **One boundary, one separator.** A heading accent, a table top border, and a container border must not all render at the same boundary. Keep row separators light and consistent. Reserve stronger rules for totals or major structural transitions. Preserve meaningful chart connectors.
4. **Color has a job.** Use the approved deep green and restrained accent consistently. Assign stable colors to current versus market rent and to income versus expenses. Avoid arbitrary color rotation.
5. **A deliberate hierarchy.** Keep one major heading per section, short subheadings, compact labels, and quiet running headers. Section headings should not dwarf the small figures they introduce.
6. **Enough space between columns.** Establish explicit gutters for tables, two-column blocks, and the manifest. Test long source filenames, long property names, and longer disclosure text. Never solve collision with truncation that removes evidence.
7. **Content-driven page flow.** No hard page caps. Keep a heading with its first meaningful content, short scenario tables intact, and totals with their schedules. Allow long tables to continue with repeated headers and accurate continuation labels. Do not force whole long sections to stay together and create blank pages.
8. **Navigation that works.** Preserve PDF bookmarks. Give the front-page issue references and contents/navigation actual final page destinations. Recompute them after pagination. The current cover has no visible number and the next page says Page 2 of 21; this is internally coherent. Change the convention only if current approved authority requires it.
9. **Source dates and currency.** Show reporting period, Rent Roll as-of date, appraisal date, and the currency designation from the source record. If unavailable, disclose that rather than borrowing dates from a previous fixture or the report-generation timestamp.
10. **Preserve evidence while editing.** Consolidating duplicate customer-facing presentation must not delete uploaded files, historical records, section-treatment evidence, methodology, or the required Quality Manifest.
11. **Cross-product continuity.** Apply shared typography, rule, label, numeric-format, status, and footer changes through shared components where appropriate. This review does not certify Screening parity because its current PDF was not inspected.
12. **Keep test overlays separate.** Do not attempt to erase provider test marks from this PDF. Continue using the authorized test workflow and existing production holds. Final acceptance will need the permitted final-render pathway when authorized.
13. **Accessible document structure.** This PDF is untagged. Add accessible reading order and table structure where the publication system supports it, preserving searchable text and useful bookmarks. This is a usability recommendation, not a legal compliance determination.

## Title recommendation and the committee-memo question

**My choice for this version: InvestorIQ Underwriting Report.** Optional subtitle: **Prepared for investment review**.

The report contains meaningful operating analysis, financing comparisons, scenario tests, capital details, valuation references, and source treatment. Calling it an Underwriting Report is accurate and can still feel premium.

For me to endorse Investment Committee Memorandum as the principal title, the front of the document should clearly establish the decision requested, supported investment rationale, material risks, conditions requiring resolution, capital/funding picture where supported, and the evidence needed for the next decision. A conditional recommendation or a clearly documented inability to reach one can be legitimate. It must not manufacture a buy/sell grade, IRR, equity multiple, forecast, or missing assumptions.

This particular artifact primarily presents metrics, evidence availability, and repeated analytical boundaries. Its “current decision state” is really a source-review state. Improving that distinction matters more than choosing the more impressive title. The title does not require an arbitrary page count, and no single metric by itself determines whether a document is a committee memorandum.

## Recommended implementation sequence

1. **Confirm current authority and reproduce this artifact.** Read the current handoff files, confirm the approved fonts/title/orientation, locate the shared report components, and retain this PDF as the audit baseline. Preserve all existing production holds.
2. **Repair factual presentation and cross-section contradictions.** Fix rent precision, tied-category logic, rate-scope statements, coverage wording, and environmental ambiguity. Resolve break-even definitions against source and calculation authority. Keep unresolved source questions explicit.
3. **Repair the shared layout foundation.** Address stacked borders, metric typography, font sizes, spacing, long filenames, manifest gutters, and short-table pagination across both report products where shared.
4. **Rewrite the decision opening and remove duplication.** Present the actual material issues and actions, then organize detailed operating, financing, capital, valuation, and source material behind them. Preserve all unique supported content.
5. **Improve selected visuals.** Retain the earnings bridge; repair rent-chart labels and colors; present capital timing and scenario outcomes more clearly. Add only visuals that answer a real question using available data.
6. **Render and inspect both products.** Review every final page at full-page and reading scale, check numeric precision and source references, and compare shared surfaces between Screening and Underwriting. Use meaningful regression checks for the discovered errors, not just cosmetic smoke tests.
7. **Close only the verified scope.** Record each resolved finding against the generated PDF and code revision. Any unresolved source or method question stays open. No production change is implied by completing an editorial audit.

## Acceptance checklist

- [ ] Every page of the new PDFs has been visually inspected at normal reading size.
- [ ] No source filenames, table labels, or manifest paragraphs collide or clip.
- [ ] Short tables and section headings are not stranded across pages.
- [ ] Shared KPI figures, headings, footers, and labels use the same approved design in both products.
- [ ] No redundant stacked rules remain at section boundaries.
- [ ] Source-period and currency information is explicit or accurately marked unavailable.
- [ ] Page 7 and page 8 rent details reproduce the same annual totals using retained calculation precision.
- [ ] Tied unit categories are described as tied.
- [ ] Rate-sensitivity availability statements match the analysis actually included.
- [ ] The $20,000 expense discrepancy and cross-basis $180,000 rent comparison are clearly distinguished.
- [ ] Break-even formulas, revenue bases, and debt exclusions are understandable and internally governed.
- [ ] Environmental wording and diligence coverage do not overstate what the source material establishes.
- [ ] Status text tells the reader what matters and what evidence is needed next.
- [ ] No unsupported investment recommendation, strategy label, returns, or source explanation is introduced.
- [ ] Methodology, original source identities, historical evidence, and the Quality Manifest are preserved.
- [ ] Em/en-dash scans remain clear for customer-facing prose; mathematical signs and useful chart connectors are preserved.
- [ ] Pagination remains content-driven with no hard page cap.
- [ ] Title and visual acceptance are recorded against the current authority; all production holds remain in force.
