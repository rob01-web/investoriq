import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const write = (rel, value) => fs.writeFileSync(path.join(root, rel), value, "utf8");

function replaceRange(rel, startNeedle, endNeedle, replacement) {
  const source = read(rel);
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`PHASE8A_SLICE_C_RANGE_MISSING:${rel}:${startNeedle}`);
  write(rel, source.slice(0, start) + replacement + "\n\n" + source.slice(end));
}
function replaceExact(rel, before, after, expected = 1) {
  const source = read(rel);
  const count = source.split(before).length - 1;
  if (count !== expected) throw new Error(`PHASE8A_SLICE_C_EXACT_MISMATCH:${rel}:expected=${expected}:actual=${count}:${before.slice(0,100)}`);
  write(rel, source.split(before).join(after));
}

// ---------------------------------------------------------------------------
// Underwriting: capital-plan economics + rent-survey synthesis + source coverage wording.
// ---------------------------------------------------------------------------
const documentPath = "api/_lib/acquisition-memo-v2-document.js";

const renovationFunction = `function renderRenovationContextSection(customerSurfaceModel = null, { suppressSummary = false } = {}) {
  const section = customerSurfaceModel?.sections?.renovationContext || null;
  if (section?.factAvailability?.sourceBacked !== true) return "";
  const facts = section?.facts || {};
  const totalBudget = Number.isFinite(toFiniteNumber(facts.total_renovation_budget)) ? Number(facts.total_renovation_budget) : null;
  const durationMonths = Number.isFinite(toFiniteNumber(facts.capital_plan_duration_months)) ? Math.round(Number(facts.capital_plan_duration_months)) : null;
  const totalUnits = Number.isFinite(Number(customerSurfaceModel?.sourceBackedFacts?.unitMix?.total_units))
    ? Number(customerSurfaceModel.sourceBackedFacts.unitMix.total_units)
    : null;
  const planRows = Array.isArray(facts.renovation_plan_rows) ? facts.renovation_plan_rows : [];

  let plannedUnits = 0;
  let interiorCapital = 0;
  let annualGrossLift = 0;
  let otherStatedCapital = 0;
  const timedRows = [];
  for (const row of planRows) {
    const unitCount = toFiniteNumber(row?.unit_count);
    const costPerUnit = toFiniteNumber(row?.cost_per_unit);
    const monthlyLift = toFiniteNumber(row?.expected_monthly_rent_lift);
    const statedAmount = toFiniteNumber(row?.stated_amount);
    if (Number.isFinite(unitCount) && unitCount > 0 && Number.isFinite(costPerUnit) && costPerUnit >= 0) {
      plannedUnits += unitCount;
      interiorCapital += unitCount * costPerUnit;
      if (Number.isFinite(monthlyLift)) annualGrossLift += unitCount * monthlyLift * 12;
    } else if (Number.isFinite(statedAmount) && statedAmount >= 0) {
      otherStatedCapital += statedAmount;
    }
    const start = toFiniteNumber(row?.start_month);
    const end = toFiniteNumber(row?.end_month);
    if (Number.isFinite(unitCount) && unitCount > 0 && Number.isFinite(start) && Number.isFinite(end)) {
      timedRows.push({ label: String(row?.category || "Interior Program"), start: Math.round(start), end: Math.round(end) });
    }
  }

  const plannedShare = Number.isFinite(totalUnits) && totalUnits > 0 ? plannedUnits / totalUnits : null;
  const grossLiftOnBudget = Number.isFinite(totalBudget) && totalBudget > 0 && annualGrossLift > 0 ? annualGrossLift / totalBudget : null;
  const totalSimplePayback = Number.isFinite(totalBudget) && totalBudget > 0 && annualGrossLift > 0 ? totalBudget / annualGrossLift : null;
  const interiorSimplePayback = interiorCapital > 0 && annualGrossLift > 0 ? interiorCapital / annualGrossLift : null;

  const summaryRows = suppressSummary ? [] : [
    totalBudget !== null ? \`<tr><td>Total Renovation Budget</td><td>\${formatMoney(totalBudget)}</td></tr>\` : "",
    durationMonths !== null ? \`<tr><td>Stated Plan Duration</td><td>\${durationMonths} months</td></tr>\` : "",
  ].filter(Boolean);

  const detailRows = planRows.map((row) => {
    const unitCount = Number.isFinite(toFiniteNumber(row?.unit_count)) ? Math.round(Number(row.unit_count)).toLocaleString("en-US") : "Not stated";
    const costBasis = Number.isFinite(toFiniteNumber(row?.cost_per_unit))
      ? \`\${formatMoney(row.cost_per_unit)} / unit\`
      : Number.isFinite(toFiniteNumber(row?.stated_amount))
        ? \`\${formatMoney(row.stated_amount)} stated\`
        : "Not stated";
    const rentLift = Number.isFinite(toFiniteNumber(row?.expected_monthly_rent_lift))
      ? \`\${formatMoney(row.expected_monthly_rent_lift)} / month\`
      : "Not stated";
    const timing = Number.isFinite(toFiniteNumber(row?.start_month)) && Number.isFinite(toFiniteNumber(row?.end_month))
      ? \`Months \${Math.round(Number(row.start_month))}-\${Math.round(Number(row.end_month))}\`
      : "Not stated";
    return \`<tr><td>\${escapeHtml(row?.category || "Stated Scope")}</td><td>\${escapeHtml(unitCount)}</td><td>\${escapeHtml(costBasis)}</td><td>\${escapeHtml(rentLift)}</td><td>\${escapeHtml(timing)}</td></tr>\`;
  }).join("");

  const synthesisRows = [
    plannedUnits > 0 ? \`<tr><td>Interior Units in Stated Program</td><td>\${Math.round(plannedUnits).toLocaleString("en-US")}\${plannedShare !== null ? \` of \${Math.round(totalUnits).toLocaleString("en-US")} (\${(plannedShare * 100).toFixed(1)}%)\` : ""}</td></tr>\` : "",
    interiorCapital > 0 ? \`<tr><td>Interior Capital</td><td>\${formatMoney(interiorCapital)}</td></tr>\` : "",
    otherStatedCapital > 0 ? \`<tr><td>Other Stated Capital</td><td>\${formatMoney(otherStatedCapital)}</td></tr>\` : "",
    annualGrossLift > 0 ? \`<tr><td>Documented Annual Gross Rent Lift</td><td>\${formatMoney(annualGrossLift)}</td></tr>\` : "",
    grossLiftOnBudget !== null ? \`<tr><td>Gross Rent Lift / Total Budget</td><td>\${(grossLiftOnBudget * 100).toFixed(1)}%</td></tr>\` : "",
    totalSimplePayback !== null ? \`<tr><td>Simple Gross Payback on Total Budget</td><td>\${totalSimplePayback.toFixed(2)} years</td></tr>\` : "",
    interiorSimplePayback !== null ? \`<tr><td>Interior-Only Simple Gross Payback</td><td>\${interiorSimplePayback.toFixed(2)} years</td></tr>\` : "",
  ].filter(Boolean).join("");

  const timelineRows = timedRows.map((row) => \`<tr><td>\${escapeHtml(row.label)}</td><td>Month \${row.start}</td><td>Month \${row.end}</td></tr>\`).join("");
  const synthesis = synthesisRows
    ? \`<div class="subsection-block phase8a-capital-synthesis" data-iq-phase8a-capital-synthesis="true"><p class="subsection-title">Capital Program Economics</p><table class="detail-table"><tbody>\${synthesisRows}</tbody></table><p class="footer-note">Gross rent lift is document-based rent arithmetic, not NOI. Simple gross payback divides stated capital by documented gross annual rent lift and is not ROI, IRR, or a value-creation forecast.</p></div>\`
    : "";
  const timeline = timelineRows
    ? \`<div class="subsection-block"><p class="subsection-title">Stated Execution Window</p><table class="detail-table"><thead><tr><th>Program</th><th>Start</th><th>End</th></tr></thead><tbody>\${timelineRows}</tbody></table></div>\`
    : "";
  const detailTable = detailRows
    ? \`<div class="subsection-block"><p class="subsection-title">Document-Stated Plan Detail</p><table class="detail-table renovation-plan-table"><thead><tr><th>Scope</th><th>Units</th><th>Cost Basis</th><th>Rent Lift</th><th>Timing</th></tr></thead><tbody>\${detailRows}</tbody></table></div>\`
    : "";
  if (!summaryRows.length && !detailRows && !synthesisRows) return "";
  const body = \`\${summaryRows.length ? \`<table class="detail-table numeric-context-table"><tbody>\${summaryRows.join("")}</tbody></table>\` : ""}\${synthesis}\${timeline}\${detailTable}\`;
  if (suppressSummary) {
    return \`<div class="subsection-block iq-renovation-detail" data-iq-section="renovationContext"><p class="subsection-title">Renovation / CapEx Context</p>\${body}</div>\`;
  }
  return renderSection(section.visibleLabel || "Renovation / CapEx Context", body, { pageBreakBefore: false, allowBreak: true });
}`;
replaceRange(documentPath, "function renderRenovationContextSection(customerSurfaceModel = null, { suppressSummary = false } = {}) {", "function renderMarketSurveyContextSection(customerSurfaceModel = null) {", renovationFunction);

const marketSurveyFunction = `function renderMarketSurveyContextSection(customerSurfaceModel = null) {
  const section = customerSurfaceModel?.sections?.marketSurveyContext || null;
  if (section?.factAvailability?.sourceBacked !== true) return "";
  const ranges = Array.isArray(section?.facts?.market_rent_ranges) ? section.facts.market_rent_ranges : [];
  const rows = ranges.map((row) => \`<tr><td>\${escapeHtml(row?.unit_type || "Unit Type")}</td><td>\${formatMoney(row?.low_monthly_rent)}</td><td>\${formatMoney(row?.high_monthly_rent)}</td></tr>\`).join("");
  if (!rows) return "";

  const unitMixFacts = customerSurfaceModel?.sourceBackedFacts?.unitMix || {};
  const unitMixRows = (Array.isArray(unitMixFacts?.unit_mix) ? unitMixFacts.unit_mix : [])
    .map(normalizeStructuredUnitMixRow)
    .filter(Boolean);
  const comparisons = [];
  for (const range of ranges) {
    const label = String(range?.unit_type || "").trim().toLowerCase();
    const match = unitMixRows.find((row) => String(row?.label || "").trim().toLowerCase() === label);
    const market = Number(match?.market);
    const low = Number(range?.low_monthly_rent);
    const high = Number(range?.high_monthly_rent);
    if (!match || !Number.isFinite(market) || !Number.isFinite(low) || !Number.isFinite(high)) continue;
    let position = "Within survey range";
    if (market < low) position = \`\${formatMoney(low - market)} below survey low\`;
    else if (market > high) position = \`\${formatMoney(market - high)} above survey high\`;
    comparisons.push({ label: range.unit_type, market, low, high, position });
  }
  const comparisonRows = comparisons.map((row) => \`<tr><td>\${escapeHtml(row.label)}</td><td>\${formatMoney(row.market)}</td><td>\${formatMoney(row.low)} to \${formatMoney(row.high)}</td><td>\${escapeHtml(row.position)}</td></tr>\`).join("");
  const allBelow = comparisons.length > 0 && comparisons.every((row) => row.market < row.low);
  const comparisonHtml = comparisonRows
    ? \`<div class="subsection-block" data-iq-phase8a-market-comparison="true"><p class="subsection-title">Rent Roll vs Market Survey</p><table class="detail-table"><thead><tr><th>Unit Type</th><th>Rent Roll Market</th><th>Survey Range</th><th>Position</th></tr></thead><tbody>\${comparisonRows}</tbody></table><p class="footer-note">\${allBelow ? "Rent Roll market rents are below the supplied survey floors for every matched unit type. The documented rent gap therefore does not depend on substituting the higher survey ranges." : "The comparison places Rent Roll market rents beside the supplied survey ranges without replacing either source."}</p></div>\`
    : "";
  return renderSection(
    section.visibleLabel || "Market Rent Survey Context",
    \`<table class="detail-table market-range-table"><thead><tr><th>Unit Type</th><th>Low Monthly Rent</th><th>High Monthly Rent</th></tr></thead><tbody>\${rows}</tbody></table>\${comparisonHtml}<p class="footer-note">Survey ranges are third-party context. Rent Roll rents remain the operating rent basis used elsewhere in this report.</p>\`,
    { pageBreakBefore: false, allowBreak: true }
  );
}`;
replaceRange(documentPath, "function renderMarketSurveyContextSection(customerSurfaceModel = null) {", "function renderEnvironmentalContextSection(customerSurfaceModel = null) {", marketSurveyFunction);

replaceExact(documentPath, `return required.length > 0 ? "Complete for this analysis" : "Accepted as context";`, `return required.length > 0 ? "Source facts available" : "Source received as context";`);
replaceExact(documentPath, `? "Partial support; dependent analysis limited"\n      : "Received as context";`, `? "Source received; dependent analysis limited"\n      : "Source received as context";`);
replaceExact(documentPath, `return "Received; detailed use limited";`, `return "Source received; detail limited";`);
replaceExact(documentPath, `<p class="body-copy">Support readiness reflects the documents provided for this review. Missing or partial optional support limits only the dependent analysis.</p>`, `<p class="body-copy">Document coverage reflects the files and usable facts provided for this review. Source presence does not by itself establish diligence sufficiency.</p>`);

// ---------------------------------------------------------------------------
// Underwriting: stop ranking incomparable sensitivity families.
// ---------------------------------------------------------------------------
const driverPath = "api/_lib/full-underwriting-driver-analysis-renderer.js";
const driverTable = `function renderDriverTable(contract) {
  const disposition = contract.sectionDispositions?.underwritingDriverAnalysis;
  if (!contract.availability?.chapterContributionDisplayReady || isCollapsed(disposition)) return "";
  const rows = contract.rankedDrivers.map((driver) => {
    const target = driver.targetOutput || {};
    const baseText = formatValue(driver.baseInput?.value, driver.baseInput?.units);
    const stressText = driver.stressInput?.label || formatValue(driver.stressInput?.value, driver.stressInput?.units);
    const outputText = \`\${target.label}: \${formatValue(target.outputChange, target.units)}\`;
    return \`<tr data-iq-driver-key="\${escapeHtml(driver.driverKey)}" data-iq-evidence-class="scenario">
      <td><strong>\${escapeHtml(driver.label)}</strong><span class="iq-table-subtext">Base \${escapeHtml(baseText)} | \${escapeHtml(driverEvidenceLabel(driver))}</span></td>
      <td>\${escapeHtml(stressText)}</td>
      <td>\${escapeHtml(outputText)}</td>
      <td>\${escapeHtml(percent(target.relativeImpactRatio, 1))}</td>
    </tr>\`;
  }).join("");
  return section(
    "Sensitivity Reference",
    "underwriting-driver-analysis",
    \`<p class="body-copy">These downside cases are shown side by side for reference. They are not ranked against one another because the shock magnitudes and target outputs differ.</p><table class="detail-table iq-driver-table" data-iq-driver-table="v2"><thead><tr><th>Driver &amp; Base</th><th>Stress</th><th>Output Change</th><th>Relative Movement Within Target</th></tr></thead><tbody>\${rows}</tbody></table><p class="footer-note">Each row should be read within its own output family. Occupancy and operating-expense cases change NOI; cap-rate cases change implied value.</p>\`,
    dispositionValue(disposition)
  );
}`;
replaceRange(driverPath, "function renderDriverTable(contract) {", "function renderDecisionInterpretation(contract) {", driverTable);

const decisionInterpretation = `function renderDecisionInterpretation(contract) {
  const decision = contract.decisionInterpretation || null;
  const disposition = contract.sectionDispositions?.decisionInterpretation;
  if (!decision?.displayReady || isCollapsed(disposition)) return "";
  const targetNotes = (Array.isArray(decision.targetNotes) ? decision.targetNotes : [])
    .map((note) => \`<li style="margin-bottom:5px;">\${escapeHtml(customerCopy(note))}</li>\`)
    .join("");
  const combined = decision.combinedDownsideContext
    ? \`<div class="subsection-block" data-iq-driver-combined-context="true" data-iq-evidence-class="scenario"><p class="subsection-title">Compound Downside Context</p><table class="detail-table"><tbody><tr><td>Scenario Occupancy</td><td>\${escapeHtml(percent(decision.combinedDownsideContext.scenarioOccupancy))}</td></tr><tr><td>Operating-Expense Stress</td><td>\${escapeHtml(percent(decision.combinedDownsideContext.operatingExpenseStressRate))}</td></tr><tr><td>Scenario NOI</td><td>\${escapeHtml(money(decision.combinedDownsideContext.scenarioNoi))}</td></tr><tr><td>NOI Change vs Base</td><td>\${escapeHtml(money(decision.combinedDownsideContext.noiDeltaVsBase))}</td></tr><tr><td>Relative NOI Movement</td><td>\${escapeHtml(percent(decision.combinedDownsideContext.relativeNoiImpactRatio))}</td></tr></tbody></table><p class="footer-note">\${escapeHtml(customerCopy(decision.combinedDownsideContext.interpretation))}</p></div>\`
    : "";
  return section(
    "Sensitivity Interpretation",
    "driver-decision-interpretation",
    \`<p class="body-copy"><strong>Read each case against the output it changes; the report does not assign a cross-output rank.</strong></p>\${targetNotes ? \`<ul style="margin:8px 0 0 0;padding-left:18px;">\${targetNotes}</ul>\` : ""}\${combined}<p class="footer-note">Sensitivity cases are conditional tests, not probabilities, forecasts, or investment decisions.</p>\`,
    dispositionValue(disposition)
  );
}`;
replaceRange(driverPath, "function renderDecisionInterpretation(contract) {", "function renderDeferredDrivers(contract) {", decisionInterpretation);
replaceExact(driverPath, `These drivers remain outside the ranking until a defined deterministic sensitivity is available.`, `These drivers remain outside the current sensitivity set until a defined test is available.`);

// ---------------------------------------------------------------------------
// Underwriting: describe the NOI/cap-rate math honestly as a cross-check.
// ---------------------------------------------------------------------------
const valuationPath = "api/_lib/full-underwriting-valuation-reconciliation-renderer.js";
const valuationReplacements = [
  ["Accepted-Basis Value Indication", "NOI / Cap-Rate Cross-Check"],
  ["InvestorIQ Implied Value Less Purchase Price", "NOI / Cap-Rate Cross-Check Less Purchase Price"],
  ["Appraised Value Less InvestorIQ Implied Value", "Appraised Value Less NOI / Cap-Rate Cross-Check"],
  ["InvestorIQ Implied Value", "NOI / Cap-Rate Cross-Check Value"],
  ["InvestorIQ implied value", "NOI / cap-rate cross-check value"],
  ["InvestorIQ's deterministic indication", "the NOI / cap-rate cross-check"],
];
for (const [before, after] of valuationReplacements) {
  const source = read(valuationPath);
  if (!source.includes(before)) throw new Error(`PHASE8A_VALUATION_LABEL_MISSING:${before}`);
  write(valuationPath, source.split(before).join(after));
}
replaceExact(
  valuationPath,
  `NOI / cap-rate cross-check value equals accepted T12 NOI divided by the accepted going-in cap rate. No additional forward-model assumptions are introduced.`,
  `NOI / cap-rate cross-check value equals T12 NOI divided by the stated going-in cap rate. Because the cap rate is itself a transaction input, this is a consistency cross-check, not an independent valuation opinion.`
);

// ---------------------------------------------------------------------------
// Screening: replace the thin administrative tail with a triage decision profile.
// ---------------------------------------------------------------------------
const phase8aPath = "api/_lib/phase8a-owner-acceptance-authority.js";
const screeningProfileHelpers = `function buildScreeningDecisionProfile(sourceTruthPackage = null) {
  const d = buildScreeningDisposition(sourceTruthPackage);
  const strengths = [];
  if (d.occupancy !== null) strengths.push(\`Occupancy is \${formatPercent(d.occupancy)}.\`);
  if (d.noiMargin !== null) strengths.push(\`NOI margin is \${formatPercent(d.noiMargin)}.\`);
  if (d.occupancy !== null && d.breakEvenOccupancy !== null) strengths.push(\`Operating occupancy cushion is \${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)} percentage points.\`);
  if (d.rentGapRatio !== null && d.rentGapRatio > 0) strengths.push(\`Rent Roll market rent is \${formatPercent(d.rentGapRatio)} above in-place rent.\`);
  const conditions = [];
  if (d.reconciliationMaterial) conditions.push("Reconcile the T12 and Rent Roll income bases.");
  if (d.rentGapRatio !== null && d.rentGapRatio > 0) conditions.push("Validate the documented path from in-place rent to market rent.");
  conditions.push("Confirm the T12 and Rent Roll remain current before full Underwriting.");
  return \`<div class="card no-break phase8a-screening-profile" data-iq-phase8a-screening-profile="true"><p class="subsection-title">Screening Decision Profile</p><div class="phase8a-profile-grid"><div><p class="phase8a-profile-label">Why the property remains competitive</p><ul>\${strengths.slice(0,4).map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("")}</ul></div><div><p class="phase8a-profile-label">Why the disposition is \${escapeHtml(d.disposition)}</p><p>\${escapeHtml(d.reason)}</p><p class="phase8a-profile-label">Conditions to advance</p><ul>\${conditions.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("")}</ul></div></div></div>\`;
}

function replaceScreeningDecisionTail(html = "", sourceTruthPackage = null) {
  let source = String(html || "");
  const profile = buildScreeningDecisionProfile(sourceTruthPackage);
  source = source.replace(/<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Summary<\\/p>[\\s\\S]*?<\\/div>/i, profile);
  source = source.replace(/<div class="card no-break phase7-evidence-conviction-matrix"([\\s\\S]*?)<p class="subsection-title">Evidence Conviction Matrix<\\/p>[\\s\\S]*?<\\/div>/i, '<div class="card no-break phase8a-evidence-coverage" data-iq-legacy-label="Evidence Conviction Matrix"><p class="subsection-title">Evidence Coverage</p><p>Core operating facts and the material T12 / Rent Roll reconciliation issue are presented in this Screening. Detailed source treatment appears on the methodology page.</p></div>');
  source = source.replace(/<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Framework Note<\\/p>[\\s\\S]*?<\\/div>/i, '<div class="card no-break phase8a-screening-scope" style="margin-top:6px;"><p class="subsection-title">Screening Scope</p><p>Screening evaluates operating strength, rent position, source consistency, and diligence burden. Debt, valuation, and return analysis belong in Full Underwriting.</p></div>');
  source = source.replace(/\\b48-Unit Multifamily\\b/gi, "48 Unit Multifamily");
  source = source.replace(/Source-bound operating facts used to decide whether deeper underwriting is warranted/gi, "Core operating facts used to decide whether deeper underwriting is warranted");
  source = source.replace(/Screening identifies operating signals and evidence gaps\. Financing, valuation, and return modeling remain outside this report unless separately authorized in the appropriate product\./gi, "Screening stops at operating triage. Financing, valuation, and return analysis belong in Full Underwriting.");
  return source;
}`;
replaceExact(phase8aPath, `function buildScreeningMethodology(sourceTruthPackage = null) {`, `${screeningProfileHelpers}\n\nfunction buildScreeningMethodology(sourceTruthPackage = null) {`);
replaceExact(
  phase8aPath,
  `    source = injectScreeningDisposition(source, sourceTruthPackage);\n    source = replaceScreeningMethodology(source, sourceTruthPackage);`,
  `    source = injectScreeningDisposition(source, sourceTruthPackage);\n    source = replaceScreeningDecisionTail(source, sourceTruthPackage);\n    source = replaceScreeningMethodology(source, sourceTruthPackage);`
);
replaceExact(
  phase8aPath,
  `/* Underwriting executive decision page. */`,
  `.iq-phase8a-screening .phase8a-screening-profile { margin-top:10px; padding:12px 14px; border-top:2px solid var(--iq8a-forest); }\n.iq-phase8a-screening .phase8a-profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }\n.iq-phase8a-screening .phase8a-profile-label { margin:0 0 5px; color:#6f7872; font-size:6.5pt; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }\n.iq-phase8a-screening .phase8a-profile-grid ul { margin:0; padding-left:16px; }\n.iq-phase8a-screening .phase8a-profile-grid li { margin-bottom:5px; }\n.iq-phase8a-screening .phase8a-evidence-coverage { margin-top:10px; padding:10px 12px; }\n\n/* Underwriting executive decision page. */`
);

console.log("phase8a-slice-c-patch: PATCHED");
