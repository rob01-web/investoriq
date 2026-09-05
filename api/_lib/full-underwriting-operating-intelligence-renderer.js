import { publicationMoney as money, publicationPercent as percent } from "./publication-format.js";
import { validateFullUnderwritingOperatingIntelligenceContract } from "./full-underwriting-operating-intelligence-contract.js";

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
    .replace(/operating-intelligence contract/gi, "operating analysis");
}





function pp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Not available";
  return `${Math.abs(n * 100).toFixed(1)} pp ${n >= 0 ? "above" : "below"}`;
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
    `${cards ? `<div class="summary-strip">${cards}</div>` : ""}<p class="footer-note">Overview metrics are limited to governed operating facts and deterministic calculations. Detailed interpretation appears below without introducing hypothetical assumptions.</p>`,
    dispositionValue(contract.sectionDispositions.operatingPerformanceOverview),
    { keepTogether: true }
  );
}

function renderRevenueQuality(contract) {
  const s = contract.revenueQuality;
  if (isCollapsed(s)) return "";
  const rows = [
    s.grossPotentialRent.displayReady ? noteRow("Gross Potential Rent", money(s.grossPotentialRent.value)) : "",
    s.effectiveGrossIncome.displayReady ? noteRow("Effective Gross Income", money(s.effectiveGrossIncome.value)) : "",
    s.revenueRealizationGap.displayReady ? noteRow("Gross Potential Rent less EGI", money(s.revenueRealizationGap.value)) : "",
    s.revenueRealizationRatio.displayReady ? noteRow("EGI / Gross Potential Rent", percent(s.revenueRealizationRatio.value)) : "",
    s.annualInPlaceRent.displayReady ? noteRow("Annual In-Place Rent", money(s.annualInPlaceRent.value)) : "",
    s.annualMarketRent.displayReady ? noteRow("Annual Market Rent", money(s.annualMarketRent.value)) : "",
    s.annualGrossRentDifference.displayReady ? noteRow("Annual Gross Rent Difference", money(s.annualGrossRentDifference.value), "Gross rent evidence only") : "",
    s.annualGrossRentGapRatio.displayReady ? noteRow("Gross Rent Difference / In-Place Rent", percent(s.annualGrossRentGapRatio.value), "Not NOI") : "",
  ].filter(Boolean).join("");
  return section(
    "Revenue Quality",
    "revenue-quality",
    `<table class="detail-table metric-note-table"><tbody>${rows}</tbody></table><p class="footer-note">Gross rent differences are displayed as accepted rent evidence only. This operating analysis does not convert them to NOI or capitalize them into value.</p>`,
    dispositionValue(s)
  );
}

function renderExpenseStructure(contract) {
  const s = contract.expenseStructure;
  if (isCollapsed(s)) return "";
  const rows = [
    s.operatingExpenses.displayReady ? noteRow("Total Operating Expenses", money(s.operatingExpenses.value)) : "",
    s.expenseRatio.displayReady ? noteRow("Expense Ratio", percent(s.expenseRatio.value)) : "",
    s.sourceReconciliation?.requiresReconciliation ? noteRow("Listed Expense Lines", money(s.sourceReconciliation.lineTotal)) : "",
    s.sourceReconciliation?.requiresReconciliation ? noteRow("Stated Total Less Listed Lines", money(s.sourceReconciliation.difference), "Requires source clarification; stated NOI unchanged") : "",
    s.largestExpenseCategory ? noteRow("Largest Listed Expense Category", `${s.largestExpenseCategory.label} - ${money(s.largestExpenseCategory.amount)}`, s.largestExpenseCategory.shareOfOperatingExpenses !== null ? percent(s.largestExpenseCategory.shareOfOperatingExpenses) : "") : "",
    Number.isFinite(Number(s.topThreeExpenseShare)) ? noteRow("Top Three Expense Share", percent(s.topThreeExpenseShare), "Share of stated operating expenses") : "",
  ].filter(Boolean).join("");
  const detailRows = (Array.isArray(s.rows) ? s.rows : [])
    .filter((expense) => expense.shareOfOperatingExpenses !== null)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map((expense) => `<tr><td>${escapeHtml(expense.label)}</td><td>${escapeHtml(money(expense.amount))}</td><td>${escapeHtml(percent(expense.shareOfOperatingExpenses))}</td>${expense.amountPerUnit !== null ? `<td>${escapeHtml(money(expense.amountPerUnit))}</td>` : "<td>Not available</td>"}</tr>`)
    .join("");
  return section(
    "Expense Structure",
    "expense-structure",
    `<table class="detail-table metric-note-table"><tbody>${rows}</tbody></table>${detailRows ? `<div class="subsection-block"><p class="subsection-title">Largest Accepted Expense Lines</p><table class="detail-table iq-numeric-table"><thead><tr><th>Expense</th><th>Amount</th><th>Share</th><th>Per Unit</th></tr></thead><tbody>${detailRows}</tbody></table></div>` : ""}${s.qualification ? `<p class="footer-note">${escapeHtml(customerCopy(s.qualification))}</p>` : ""}`,
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
    s.breakEvenOccupancy.displayReady ? noteRow("Operating Break-Even Occupancy", percent(s.breakEvenOccupancy.value)) : "",
    s.occupancyBreakEvenSpread.displayReady ? noteRow("Occupancy vs Operating Break-Even", pp(s.occupancyBreakEvenSpread.value)) : "",
    s.noiIdentityDifference.displayReady ? noteRow("EGI less OpEx less NOI", money(s.noiIdentityDifference.value), s.noiIdentityReconciles === true ? "Within deterministic reconciliation tolerance" : "Review accepted totals") : "",
  ].filter(Boolean).join("");
  return section(
    "NOI & Margin Analysis",
    "noi-margin-analysis",
    `<table class="detail-table metric-note-table"><tbody>${rows}</tbody></table><p class="footer-note">Operating break-even is a deterministic operating relationship. Debt service is not included here unless separately analyzed in the debt chapter.</p>`,
    dispositionValue(s)
  );
}

function renderConcentration(contract) {
  const s = contract.unitRentConcentration;
  if (isCollapsed(s)) return "";
  const summaryRows = [
    s.largestUnitCategory ? row("Largest Unit Category", `${s.largestUnitCategory.label} - ${percent(s.largestUnitCategory.unitShare)}`) : "",
    s.largestRentContributionCategory ? row("Largest In-Place Rent Contribution", `${s.largestRentContributionCategory.label} - ${percent(s.largestRentContributionCategory.inPlaceRentContributionShare)}`) : "",
    s.largestPositiveRentGapCategory ? row("Largest Positive Gross Rent Gap Category", `${s.largestPositiveRentGapCategory.label} - ${money(s.largestPositiveRentGapCategory.annualRentGapContribution)}`) : "",
  ].filter(Boolean).join("");
  const detailRows = (Array.isArray(s.rows) ? s.rows : [])
    .map((mix) => `<tr><td>${escapeHtml(mix.label)}</td><td>${mix.count !== null ? `${escapeHtml(String(Math.round(mix.count)))}${mix.unitShare !== null ? ` / ${escapeHtml(percent(mix.unitShare))}` : ""}` : "Not available"}</td><td>${mix.inPlaceMonthly !== null ? escapeHtml(money(mix.inPlaceMonthly, 2)) : "Not available"}</td><td>${mix.marketMonthly !== null ? escapeHtml(money(mix.marketMonthly, 2)) : "Not available"}</td><td>${mix.annualRentGapContribution !== null ? escapeHtml(money(mix.annualRentGapContribution)) : "Not available"}</td></tr>`)
    .join("");
  return section(
    "Unit / Rent Concentration",
    "unit-rent-concentration",
    `${summaryRows ? `<table class="detail-table"><tbody>${summaryRows}</tbody></table>` : ""}${detailRows ? `<div class="subsection-block"><p class="subsection-title">Accepted Unit-Mix Concentration</p><table class="detail-table iq-numeric-table"><thead><tr><th>Category</th><th>Units / Share</th><th>In-Place / Mo.</th><th>Market / Mo.</th><th>Annual Gross Gap</th></tr></thead><tbody>${detailRows}</tbody></table></div>` : ""}<p class="footer-note">${escapeHtml(customerCopy(s.occupancyConcentrationQualification))}</p>`,
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
    items ? `<ul style="margin:0;padding-left:18px;">${items}</ul>` : `<p class="body-copy">No additional deterministic operating interpretation is available beyond the surviving governed metrics.</p>`,
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
