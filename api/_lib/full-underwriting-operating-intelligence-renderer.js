import { publicationMoney as money, publicationPercent as percent } from "./publication-format.js";
import { validateFullUnderwritingOperatingIntelligenceContract } from "./full-underwriting-operating-intelligence-contract.js";
import { renderVisualEliteOperatingEarningsBridge } from "./investoriq-visual-elite-exhibits.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function customerCopy(value) {
  return String(value ?? "")
    .replace(/this operating-intelligence contract/gi, "this operating analysis")
    .replace(/operating-intelligence contract/gi, "operating analysis")
    .replace(/\bgoverned\b/gi, "accepted");
}

function dispositionValue(section) {
  return String(section?.disposition?.disposition || section?.disposition || "include");
}

function isCollapsed(section) {
  return ["collapse", "omit"].includes(dispositionValue(section));
}

function section(title, key, body, disposition, { keepTogether = false } = {}) {
  if (!body || ["collapse", "omit"].includes(disposition)) return "";
  return `<section class="section" data-iq-elite-operating="${escapeHtml(key)}" data-iq-disposition="${escapeHtml(disposition)}"><div class="section-header"><span class="section-header-title">${escapeHtml(title)}</span></div><div class="card ${keepTogether ? "no-break" : "allow-break"}">${body}</div></section>`;
}

function row(label, value) {
  return `<tr><td>${escapeHtml(label)}</td><td style="font-weight:600;">${escapeHtml(value)}</td></tr>`;
}

function noteRow(label, value, note = "") {
  return `<tr><td>${escapeHtml(label)}</td><td style="font-weight:600;">${escapeHtml(value)}</td><td>${note ? escapeHtml(note) : ""}</td></tr>`;
}

function tiedLeaders(rows, metricKey) {
  const candidates = (Array.isArray(rows) ? rows : [])
    .filter((candidate) => Number.isFinite(Number(candidate?.[metricKey])))
    .map((candidate) => ({ ...candidate, __metric: Number(candidate[metricKey]) }));
  if (!candidates.length) return [];
  const maximum = Math.max(...candidates.map((candidate) => candidate.__metric));
  const tolerance = Math.max(1e-12, Math.abs(maximum) * 1e-10);
  return candidates
    .filter((candidate) => Math.abs(candidate.__metric - maximum) <= tolerance)
    .sort((left, right) => String(left?.label || "").localeCompare(String(right?.label || "")));
}

function joinedCategoryLabels(rows) {
  return rows.map((candidate) => String(candidate?.label || "Unit Mix")).filter(Boolean).join(" and ");
}

function renderOverview(contract) {
  const m = contract.metrics;
  const cards = [
    m.occupancy?.displayReady ? `<div><span>Occupancy</span><strong>${escapeHtml(percent(m.occupancy.value))}</strong></div>` : "",
    m.egi?.displayReady ? `<div><span>Effective Gross Income</span><strong>${escapeHtml(money(m.egi.value))}</strong></div>` : "",
    m.noi?.displayReady ? `<div><span>NOI</span><strong>${escapeHtml(money(m.noi.value))}</strong></div>` : "",
    m.noiMargin?.displayReady ? `<div><span>NOI Margin</span><strong>${escapeHtml(percent(m.noiMargin.value))}</strong></div>` : "",
  ].filter(Boolean).join("");
  return section(
    "Operating Performance Overview",
    "overview",
    `${cards ? `<div class="summary-strip">${cards}</div>` : ""}<p class="footer-note">Overview metrics are limited to accepted operating facts and deterministic calculations. Detailed interpretation appears below without introducing hypothetical assumptions.</p>`,
    dispositionValue(contract.sectionDispositions.operatingPerformanceOverview),
    { keepTogether: true }
  );
}

function renderRevenueQuality(contract) {
  const s = contract.revenueQuality;
  if (isCollapsed(s)) return "";
  const rows = [
    s.grossPotentialRent.displayReady ? noteRow("T12 Gross Potential Rent", money(s.grossPotentialRent.value), "Operating-statement basis") : "",
    s.effectiveGrossIncome.displayReady ? noteRow("T12 Effective Gross Income", money(s.effectiveGrossIncome.value), "Operating-statement basis") : "",
    s.revenueRealizationGap.displayReady ? noteRow("T12 GPR less EGI", money(s.revenueRealizationGap.value), "Operating-statement arithmetic") : "",
    s.revenueRealizationRatio.displayReady ? noteRow("EGI / T12 GPR", percent(s.revenueRealizationRatio.value), "Operating-statement relationship") : "",
    s.annualInPlaceRent.displayReady ? noteRow("Rent Roll Annual In-Place Rent", money(s.annualInPlaceRent.value), "Rent Roll basis") : "",
    s.annualMarketRent.displayReady ? noteRow("Rent Roll Annual Stated Market Rent", money(s.annualMarketRent.value), "Rent Roll basis") : "",
    s.annualGrossRentDifference.displayReady ? noteRow("Annual Rent Difference to Stated Market", money(s.annualGrossRentDifference.value), "Gross rent evidence only; not NOI") : "",
    s.annualGrossRentGapRatio.displayReady ? noteRow("Rent Difference / In-Place Rent", percent(s.annualGrossRentGapRatio.value), "Gross rent relationship; not NOI") : "",
  ].filter(Boolean).join("");
  return section(
    "Revenue Reconciliation & Rent Positioning",
    "revenue-quality",
    `<table class="detail-table metric-note-table"><tbody>${rows}</tbody></table><p class="footer-note">T12 revenue and Rent Roll rent totals are different evidence bases and are not presented as interchangeable. Rent differences are gross rent evidence only; this operating analysis does not convert them to NOI or capitalize them into value.</p>`,
    dispositionValue(s)
  );
}

function renderExpenseStructure(contract) {
  const s = contract.expenseStructure;
  if (isCollapsed(s)) return "";
  const rows = [
    s.operatingExpenses.displayReady ? noteRow("Stated Total Operating Expenses", money(s.operatingExpenses.value), "Accepted T12 total") : "",
    s.expenseRatio.displayReady ? noteRow("Expense Ratio", percent(s.expenseRatio.value), "Operating expenses / EGI") : "",
    s.sourceReconciliation?.requiresReconciliation ? noteRow("Reported Expense Line Total", money(s.sourceReconciliation.lineTotal), "Sum of accepted detailed lines") : "",
    s.sourceReconciliation?.requiresReconciliation ? noteRow("Stated Total less Reported Lines", money(s.sourceReconciliation.difference), "Separate source discrepancy; stated NOI unchanged") : "",
    s.largestExpenseCategory ? noteRow("Largest Reported Expense Category", `${s.largestExpenseCategory.label} - ${money(s.largestExpenseCategory.amount)}`, s.largestExpenseCategory.shareOfOperatingExpenses !== null ? percent(s.largestExpenseCategory.shareOfOperatingExpenses) : "") : "",
    Number.isFinite(Number(s.topThreeExpenseShare)) ? noteRow("Top Three Expense Share", percent(s.topThreeExpenseShare), "Share of stated operating expenses") : "",
  ].filter(Boolean).join("");
  const detailRows = (Array.isArray(s.rows) ? s.rows : [])
    .filter((expense) => expense.shareOfOperatingExpenses !== null)
    .sort((a, b) => b.amount - a.amount)
    .map((expense) => `<tr><td>${escapeHtml(expense.label)}</td><td>${escapeHtml(money(expense.amount))}</td><td>${escapeHtml(percent(expense.shareOfOperatingExpenses))}</td>${expense.amountPerUnit !== null ? `<td>${escapeHtml(money(expense.amountPerUnit))}</td>` : "<td>Not available</td>"}</tr>`)
    .join("");
  return section(
    "Expense Structure",
    "expense-structure",
    `<table class="detail-table metric-note-table"><tbody>${rows}</tbody></table>${detailRows ? `<div class="subsection-block"><p class="subsection-title">Reported Expense Categories</p><table class="detail-table iq-numeric-table"><thead><tr><th>Expense</th><th>Amount</th><th>Share</th><th>Per Unit</th></tr></thead><tbody>${detailRows}</tbody></table></div>` : ""}${s.qualification ? `<p class="footer-note">${escapeHtml(customerCopy(s.qualification))}</p>` : ""}`,
    dispositionValue(s)
  );
}

function renderNoiAnalysis(contract) {
  const s = contract.noiAnalysis;
  if (isCollapsed(s)) return "";
  const rows = [
    s.egi.displayReady ? noteRow("Effective Gross Income", money(s.egi.value)) : "",
    s.operatingExpenses.displayReady ? noteRow("Operating Expenses", money(s.operatingExpenses.value)) : "",
    s.noi.displayReady ? noteRow("Net Operating Income", money(s.noi.value)) : "",
    s.noiMargin.displayReady ? noteRow("NOI Margin", percent(s.noiMargin.value)) : "",
    s.noiPerUnit.displayReady ? noteRow("NOI per Unit", money(s.noiPerUnit.value)) : "",
    s.breakEvenOccupancy.displayReady ? noteRow("Operating Cost Coverage Ratio", percent(s.breakEvenOccupancy.value), "Operating expenses / T12 gross potential rent") : "",
    s.noiIdentityDifference.displayReady ? noteRow("EGI less OpEx less NOI", money(s.noiIdentityDifference.value), s.noiIdentityReconciles === true ? "Reconciles within deterministic tolerance" : "Review accepted totals") : "",
  ].filter(Boolean).join("");
  const earningsBridge = renderVisualEliteOperatingEarningsBridge(s);
  const supportingBody = `<table class="detail-table metric-note-table"><tbody>${rows}</tbody></table><p class="footer-note"><strong>Operating cost coverage basis:</strong> total operating expenses / T12 gross potential rent. This is a revenue-basis ratio, not a point-in-time physical occupancy threshold. It is therefore not directly comparable to occupancy sensitivity cases. Debt service is excluded here and is analyzed separately in the debt chapter.</p>`;
  const disposition = dispositionValue(s);
  if (!earningsBridge) {
    return section(
      "NOI & Margin Analysis",
      "noi-margin-analysis",
      supportingBody,
      disposition
    );
  }
  return `<section class="section" data-iq-elite-operating="noi-margin-analysis" data-iq-disposition="${escapeHtml(disposition)}">
    <div class="iq-ve-noi-heading-bridge-lock no-break">
      <div class="section-header"><span class="section-header-title">NOI &amp; Margin Analysis</span></div>
      ${earningsBridge}
    </div>
    <div class="card allow-break iq-ve-noi-supporting-metrics">${supportingBody}</div>
  </section>`;
}

function renderConcentration(contract) {
  const s = contract.unitRentConcentration;
  if (isCollapsed(s)) return "";
  const rows = Array.isArray(s.rows) ? s.rows : [];
  const unitLeaders = tiedLeaders(rows, "unitShare");
  const rentContributionLeaders = tiedLeaders(rows, "inPlaceRentContributionShare");
  const positiveGapLeaders = tiedLeaders(rows.filter((candidate) => Number(candidate?.annualRentGapContribution) > 0), "annualRentGapContribution");
  const summaryRows = [
    unitLeaders.length === 1
      ? row("Largest Unit Category", `${unitLeaders[0].label} - ${percent(unitLeaders[0].unitShare)}`)
      : unitLeaders.length > 1
        ? row("Largest Unit Categories", `${joinedCategoryLabels(unitLeaders)} - ${percent(unitLeaders[0].unitShare)} each (tie)`)
        : "",
    rentContributionLeaders.length === 1
      ? row("Largest In-Place Rent Contribution", `${rentContributionLeaders[0].label} - ${percent(rentContributionLeaders[0].inPlaceRentContributionShare)}`)
      : rentContributionLeaders.length > 1
        ? row("Largest In-Place Rent Contributions", `${joinedCategoryLabels(rentContributionLeaders)} - ${percent(rentContributionLeaders[0].inPlaceRentContributionShare)} each (tie)`)
        : "",
    positiveGapLeaders.length === 1
      ? row("Largest Positive Rent Difference Category", `${positiveGapLeaders[0].label} - ${money(positiveGapLeaders[0].annualRentGapContribution)}`)
      : positiveGapLeaders.length > 1
        ? row("Largest Positive Rent Difference Categories", `${joinedCategoryLabels(positiveGapLeaders)} - ${money(positiveGapLeaders[0].annualRentGapContribution)} each (tie)`)
        : "",
  ].filter(Boolean).join("");
  const detailRows = rows
    .map((mix) => `<tr><td>${escapeHtml(mix.label)}</td><td>${mix.count !== null ? `${escapeHtml(String(Math.round(mix.count)))}${mix.unitShare !== null ? ` / ${escapeHtml(percent(mix.unitShare))}` : ""}` : "Not available"}</td><td>${mix.inPlaceMonthly !== null ? escapeHtml(money(mix.inPlaceMonthly, 2)) : "Not available"}</td><td>${mix.marketMonthly !== null ? escapeHtml(money(mix.marketMonthly, 2)) : "Not available"}</td><td>${mix.annualRentGapContribution !== null ? escapeHtml(money(mix.annualRentGapContribution)) : "Not available"}</td></tr>`)
    .join("");
  return section(
    "Unit / Rent Concentration",
    "unit-rent-concentration",
    `${summaryRows ? `<table class="detail-table"><tbody>${summaryRows}</tbody></table>` : ""}${detailRows ? `<div class="subsection-block"><p class="subsection-title">Accepted Unit-Mix Detail</p><table class="detail-table iq-numeric-table"><thead><tr><th>Category</th><th>Units / Share</th><th>In-Place / Mo.</th><th>Market / Mo.</th><th>Annual Rent Difference</th></tr></thead><tbody>${detailRows}</tbody></table></div>` : ""}<p class="footer-note">${escapeHtml(customerCopy(s.occupancyConcentrationQualification))}</p>`,
    dispositionValue(s)
  );
}

function renderHistorical(contract) {
  const periods = contract.ttmOperatingStatement?.historicalPeriods || [];
  if (!Array.isArray(periods) || periods.length < 2) return "";
  const rows = periods.map((period) => `<tr><td>${escapeHtml(period.period)}</td><td>${period.egi !== null ? escapeHtml(money(period.egi)) : "Not available"}</td><td>${period.operatingExpenses !== null ? escapeHtml(money(period.operatingExpenses)) : "Not available"}</td><td>${period.noi !== null ? escapeHtml(money(period.noi)) : "Not available"}</td></tr>`).join("");
  return section(
    "Historical Operating Trend",
    "historical-operating-trend",
    `<table class="detail-table iq-numeric-table"><thead><tr><th>Accepted Period</th><th>EGI</th><th>Operating Expenses</th><th>NOI</th></tr></thead><tbody>${rows}</tbody></table><p class="footer-note">Historical trend appears only because multiple accepted structured operating periods were present. No missing period is inferred.</p>`,
    "include"
  );
}

function renderInterpretation(contract) {
  const s = contract.operatingInterpretation;
  if (isCollapsed(s)) return "";
  const items = (Array.isArray(s.items) ? s.items : []).map((item) => `<li style="margin-bottom:7px;">${escapeHtml(customerCopy(item.statement))}${item.qualification ? `<div class="small" style="color:#64748b;margin-top:2px;">${escapeHtml(customerCopy(item.qualification))}</div>` : ""}</li>`).join("");
  return section(
    "Operating Interpretation",
    "operating-interpretation",
    items ? `<ul style="margin:0;padding-left:18px;">${items}</ul>` : `<p class="body-copy">No additional deterministic operating interpretation is available beyond the surviving accepted metrics.</p>`,
    dispositionValue(s)
  );
}

export function renderFullUnderwritingOperatingIntelligenceHtml(contract) {
  const validation = validateFullUnderwritingOperatingIntelligenceContract(contract);
  if (!validation.ok) {
    throw new Error(`ELITE_OPERATING_INTELLIGENCE_CONTRACT_INVALID:${validation.issues.join(",")}`);
  }
  return [
    renderOverview(contract),
    renderRevenueQuality(contract),
    renderExpenseStructure(contract),
    renderNoiAnalysis(contract),
    renderConcentration(contract),
    renderHistorical(contract),
    renderInterpretation(contract),
  ].filter(Boolean).join("\n");
}
