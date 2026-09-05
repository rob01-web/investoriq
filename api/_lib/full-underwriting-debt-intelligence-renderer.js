import { publicationMoney as money, publicationPercent as percent } from "./publication-format.js";
import {
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  validateFullUnderwritingDebtIntelligenceV1,
} from "./full-underwriting-debt-intelligence-v1.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function customerCopy(value) {
  return String(value ?? "")
    .replace(/\bELITE-07\b/gi, "This debt analysis")
    .replace(/\bv1\b/gi, "current methodology")
    .replace(/\bversioned\b/gi, "defined")
    .replace(/governed lender-style deterministic metrics/gi, "deterministic lender-style metrics")
    .replace(/\bgoverned\b/gi, "defined");
}





function surfacePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  const rounded = Math.round(pct * 100) / 100;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  const rendered = Number.isInteger(normalized) ? normalized.toFixed(1) : normalized.toFixed(2);
  return `${rendered.replace(/\.00$/, ".0").replace(/(\.\d)0$/, "$1")}%`;
}

function multiple(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}x` : "";
}

function integer(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "";
}

function display(receipt, { ratioFormatter = null } = {}) {
  if (!receipt?.displayReady) return "";
  const value = receipt.value;
  if (value !== null && typeof value === "object") return "";
  if (String(value ?? "").trim() === "[object Object]") return "";
  if (receipt.units === "currency") return money(value);
  if (receipt.units === "ratio") return ratioFormatter ? ratioFormatter(value) : percent(value, 2);
  if (receipt.units === "multiple") return multiple(value);
  if (receipt.units === "years") return `${integer(value)} years`;
  if (receipt.units === "days") return `${integer(value)} days`;
  return String(value ?? "");
}

function collapsed(disposition) {
  return ["collapse", "omit"].includes(disposition?.disposition || disposition);
}

function row(receipt, marker, options = {}) {
  if (!receipt?.displayReady) return "";
  const rendered = display(receipt, options);
  if (!rendered) return "";
  return `<tr data-iq-elite07-metric="${escapeHtml(marker || receipt.key)}" data-iq-evidence-class="${escapeHtml(receipt.evidenceClass)}"><td>${escapeHtml(receipt.label)}</td><td>${escapeHtml(rendered)}</td></tr>`;
}

function renderCoverageHeadroom(contract) {
  if (collapsed(contract?.sectionDispositions?.coverageHeadroom)) return "";
  const current = contract?.baseProfiles?.currentDebt || {};
  const proposed = contract?.baseProfiles?.proposedFinancing || {};
  if (!current.displayReady && !proposed.displayReady) return "";

  const currentRows = [
    row(current.balance),
    row(current.rate),
    row(current.amortizationRemainingYears),
    row(current.monthlyDebtService),
    row(current.annualDebtService),
    row(current.dscr),
    row(current.noiCushionToOneX),
  ].filter(Boolean).join("");
  const proposedRows = [
    row(proposed.loanAmount),
    row(proposed.ltv, null, { ratioFormatter: surfacePercent }),
    row(proposed.rate),
    row(proposed.amortizationYears),
    row(proposed.lenderFeePercent),
    row(proposed.lenderFeeDollars),
    row(proposed.monthlyDebtService),
    row(proposed.annualDebtService),
    row(proposed.dscr),
    row(proposed.noiCushionToOneX),
  ].filter(Boolean).join("");

  return `<div class="subsection-block" data-iq-elite07-surface="coverage-headroom">
    <p class="subsection-title">Debt Service and Coverage</p>
    <div class="grid-2-balanced">
      ${currentRows ? `<div class="card no-break iq-debt-profile"><p class="subsection-title">Current Debt</p><table class="detail-table"><tbody>${currentRows}</tbody></table></div>` : ""}
      ${proposedRows ? `<div class="card no-break iq-debt-profile"><p class="subsection-title">Proposed Financing</p><table class="detail-table"><tbody>${proposedRows}</tbody></table></div>` : ""}
    </div>
    <p class="footer-note">NOI cushion is the mathematical amount above 1.00x DSCR. It is not a lender covenant or approval threshold.</p>
  </div>`;
}

function renderRateSensitivity(contract) {
  const sensitivity = contract?.proposedRateSensitivity || {};
  if (!sensitivity.displayReady || collapsed(contract?.sectionDispositions?.proposedRateSensitivity)) return "";
  const rows = (Array.isArray(sensitivity.rows) ? sensitivity.rows : []).map((item) =>
    `<tr data-iq-elite07-rate-stress="${escapeHtml(item.scenarioInputs.rateStressBasisPoints)}" data-iq-evidence-class="scenario"><td>${escapeHtml(item.label)}</td><td>${escapeHtml(percent(item.scenarioInputs.scenarioRate, 2))}</td><td>${escapeHtml(money(item.outputs.annualDebtService))}</td><td>${escapeHtml(multiple(item.outputs.dscr))}</td><td>${escapeHtml(money(item.outputs.annualDebtServiceDeltaVsBase))}</td><td>${escapeHtml(money(item.outputs.noiCushionToOneX))}</td></tr>`
  ).join("");
  return `<div class="subsection-block" data-iq-elite07-surface="proposed-rate-sensitivity">
    <p class="subsection-title">Proposed Rate / DSCR Sensitivity</p>
    <span class="iq-scenario-label" data-iq-evidence-class="scenario">Scenario Analysis - Not Source Evidence</span>
    <table class="detail-table iq-numeric-table"><thead><tr><th>Scenario</th><th>Rate</th><th>Annual Debt Service</th><th>DSCR</th><th>Change in Debt Service</th><th>NOI Cushion to 1.00x</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="footer-note">${escapeHtml(sensitivity.rows?.[0]?.qualification || "Hypothetical proposed-financing rate sensitivity only.")}</p>
  </div>`;
}

function maturityPositionLabel(value) {
  const labels = {
    future: "Scheduled after the analysis date",
    matured: "Maturity date has passed",
    due_on_analysis_date: "Due on the analysis date",
  };
  return labels[value] || String(value || "").replace(/_/g, " ");
}

function renderMaturity(contract) {
  const maturity = contract?.maturityContext || {};
  if (!maturity.displayReady || collapsed(contract?.sectionDispositions?.maturityContext)) return "";
  const rows = [
    row(maturity.maturityDate),
    row(maturity.asOfDate),
    row(maturity.daysToMaturity),
    maturity.maturityPosition?.displayReady
      ? `<tr data-iq-elite07-metric="maturity_position" data-iq-evidence-class="deterministic_calculated"><td>Maturity Status</td><td>${escapeHtml(maturityPositionLabel(maturity.maturityPosition.value))}</td></tr>`
      : "",
  ].filter(Boolean).join("");
  return `<div class="subsection-block" data-iq-elite07-surface="maturity-context"><p class="subsection-title">Debt Term and Maturity Analysis</p><table class="detail-table"><tbody>${rows}</tbody></table><p class="footer-note">${escapeHtml(customerCopy(maturity.qualification))}</p></div>`;
}

function renderCapacity(contract) {
  const capacity = contract?.capacityInterpretation || {};
  if (!capacity.displayReady || collapsed(contract?.sectionDispositions?.capacityInterpretation)) return "";
  const preferred = [
    "proposedDebtYield",
    "proposedMortgageConstant",
    "currentDebtInclusiveBreakEvenOccupancy",
    "proposedDebtInclusiveBreakEvenOccupancy",
    "currentDebtInclusiveBreakEvenMonthlyRentPerUnit",
    "proposedDebtInclusiveBreakEvenMonthlyRentPerUnit",
    "governedCapacityResult",
    "governedBindingConstraint",
  ];
  const rows = preferred
    .map((key) => row(capacity.metrics?.[key], key, { ratioFormatter: (value) => percent(value, 1) }))
    .filter(Boolean)
    .join("");
  const observations = (Array.isArray(capacity.observations) ? capacity.observations : [])
    .map((item) => `<li data-iq-elite07-observation="${escapeHtml(item.key)}" data-iq-evidence-class="${escapeHtml(item.evidenceClass)}" style="margin-bottom:5px;">${escapeHtml(customerCopy(item.text))}</li>`)
    .join("");
  return `<div class="subsection-block" data-iq-elite07-surface="capacity-interpretation"><p class="subsection-title">Debt Capacity and Coverage</p>${rows ? `<table class="detail-table"><tbody>${rows}</tbody></table>` : ""}${observations ? `<div class="subsection-block"><p class="subsection-title">Decision-Relevant Debt Observations</p><ul style="margin:0;padding-left:18px;">${observations}</ul></div>` : ""}<p class="footer-note">${escapeHtml(customerCopy(capacity.qualification))}</p></div>`;
}

export function renderFullUnderwritingDebtIntelligenceV1Html(contract = null) {
  const validation = validateFullUnderwritingDebtIntelligenceV1(contract);
  if (!validation.ok) {
    if (!contract || contract?.version !== FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION) return "";
    throw new Error(`ELITE_DEBT_INTELLIGENCE_CONTRACT_INVALID:${validation.issues.join("|")}`);
  }
  if (!contract?.availability?.chapterDisplayReady) return "";
  const body = [
    renderCoverageHeadroom(contract),
    renderRateSensitivity(contract),
    renderMaturity(contract),
    renderCapacity(contract),
  ].filter(Boolean).join("");
  if (!body) return "";
  return `<section class="section" data-iq-elite="debt-intelligence-v1">
    <div class="section-header"><span class="section-header-title">Debt Intelligence</span></div>
    <div class="card allow-break">
      <p class="body-copy">Coverage, debt-service burden, maturity timing, and proposed-rate sensitivity are summarized from accepted debt and operating inputs. Scenario rows are clearly separated from accepted and deterministic base analysis.</p>
      ${body}
      <p class="footer-note">This debt analysis does not establish lender covenants, future financing replacement terms or proceeds, risk grades, or investment advice.</p>
    </div>
  </section>`;
}

export default { renderFullUnderwritingDebtIntelligenceV1Html };
