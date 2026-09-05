import { publicationMoney as money, publicationPercent as percent } from "./publication-format.js";
import { validateFullUnderwritingScenarioEngineV1 } from "./full-underwriting-scenario-engine-v1.js";

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
    .replace(/\bversioned by ELITE-04 policy\b/gi, "defined by the sensitivity policy")
    .replace(/\bELITE-04(?:\s+v1)?\b/gi, "the defined sensitivity framework")
    .replace(/\blater governed driver analysis\b/gi, "the dedicated driver analysis")
    .replace(/\bgoverned scenario framework\b/gi, "defined sensitivity framework")
    .replace(/\bgoverned scenario policy\b/gi, "defined sensitivity policy")
    .replace(/\bversioned\b/gi, "defined")
    .replace(/\binvestment recommendations?\b/gi, "investment decisions")
    .replace(/\bscenario authority\b/gi, "scenario scope")
    .replace(/\bgoverned\b/gi, "defined");
}





function multiple(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}x` : "Not available";
}

function dispositionValue(section) {
  return section?.disposition?.disposition || section?.disposition || "include";
}

function isCollapsed(section) {
  return ["collapse", "omit"].includes(dispositionValue(section));
}

function section(title, key, body, disposition = "include", { keepTogether = false } = {}) {
  return `<section class="section" data-iq-elite-scenario-section="${escapeHtml(key)}" data-iq-disposition="${escapeHtml(disposition)}">
    <div class="section-header"><span class="section-header-title">${escapeHtml(title)}</span></div>
    <div class="card ${keepTogether ? "no-break" : "allow-break"}">${body}</div>
  </section>`;
}

function renderEvidenceBadge() {
  return `<span class="iq-scenario-label" data-iq-evidence-class="scenario">Scenario Analysis - Not Source Evidence</span>`;
}

function renderScenarioBasis(contract) {
  if (!contract.availability?.chapterDisplayReady) return "";
  const base = contract.scenarioBasis?.base || {};
  const customerEvidenceLabel = (value) => {
    if (value === "source_backed") return "Accepted evidence";
    if (value === "deterministic_calculated") return "Deterministic calculation";
    if (value === "third_party_context") return "Third-party context";
    return "Evidence";
  };
  const baseRows = [
    base.occupancy?.displayReady ? `<tr><td>Base Occupancy</td><td>${escapeHtml(percent(base.occupancy.value))}</td><td>${escapeHtml(customerEvidenceLabel(base.occupancy.evidenceClass))}</td></tr>` : "",
    base.egi?.displayReady ? `<tr><td>Base EGI</td><td>${escapeHtml(money(base.egi.value))}</td><td>${escapeHtml(customerEvidenceLabel(base.egi.evidenceClass))}</td></tr>` : "",
    base.operatingExpenses?.displayReady ? `<tr><td>Base Operating Expenses</td><td>${escapeHtml(money(base.operatingExpenses.value))}</td><td>${escapeHtml(customerEvidenceLabel(base.operatingExpenses.evidenceClass))}</td></tr>` : "",
    base.noi?.displayReady ? `<tr><td>Base NOI</td><td>${escapeHtml(money(base.noi.value))}</td><td>${escapeHtml(customerEvidenceLabel(base.noi.evidenceClass))}</td></tr>` : "",
    base.goingInCapRate?.displayReady ? `<tr><td>Accepted Going-In Cap Rate</td><td>${escapeHtml(percent(base.goingInCapRate.value, 2))}</td><td>${escapeHtml(customerEvidenceLabel(base.goingInCapRate.evidenceClass))}</td></tr>` : "",
    base.purchasePrice?.displayReady ? `<tr><td>Accepted Purchase Price</td><td>${escapeHtml(money(base.purchasePrice.value))}</td><td>${escapeHtml(customerEvidenceLabel(base.purchasePrice.evidenceClass))}</td></tr>` : "",
  ].filter(Boolean).join("");
  const assumptions = (Array.isArray(contract.scenarioBasis?.assumptions) ? contract.scenarioBasis.assumptions : [])
    .map((item) => `<li style="margin-bottom:5px;">${escapeHtml(customerCopy(item))}</li>`).join("");
  return section(
    "Scenario Basis",
    "scenario-basis",
    `${renderEvidenceBadge()}<p class="body-copy">The scenario framework applies defined downside sensitivity adjustments to accepted base facts. These outputs are hypothetical sensitivity tests, not forecasts or source evidence.</p>${baseRows ? `<table class="detail-table"><thead><tr><th>Base Input</th><th>Value</th><th>Evidence Class</th></tr></thead><tbody>${baseRows}</tbody></table>` : ""}${assumptions ? `<div class="subsection-block"><p class="subsection-title">Scenario Rules</p><ul style="margin:0;padding-left:18px;">${assumptions}</ul></div>` : ""}`,
    dispositionValue(contract.sectionDispositions?.scenarioBasis)
  );
}

function renderOccupancyStress(contract) {
  const scenario = contract.occupancyStress;
  if (!scenario?.displayReady || isCollapsed(scenario)) return "";
  const rows = scenario.rows.map((row) => `<tr data-iq-evidence-class="scenario"><td>${escapeHtml(row.label)}</td><td>${escapeHtml(percent(row.scenarioInputs.scenarioOccupancy))}</td><td>${escapeHtml(money(row.outputs.egi))}</td><td>${escapeHtml(money(row.outputs.noi))}</td><td>${escapeHtml(percent(row.outputs.noiMargin))}</td><td>${escapeHtml(money(row.outputs.noiDeltaVsBase))}</td></tr>`).join("");
  return section(
    "Occupancy Stress",
    "occupancy-stress",
    `<table class="detail-table iq-numeric-table"><thead><tr><th>Scenario</th><th>Occupancy</th><th>EGI</th><th>NOI</th><th>NOI Margin</th><th>NOI Change vs Base</th></tr></thead><tbody>${rows}</tbody></table><p class="footer-note">${escapeHtml(customerCopy(scenario.qualification))}</p>`,
    dispositionValue(scenario)
  );
}

function renderExpenseStress(contract) {
  const scenario = contract.expenseStress;
  if (!scenario?.displayReady || isCollapsed(scenario)) return "";
  const rows = scenario.rows.map((row) => `<tr data-iq-evidence-class="scenario"><td>${escapeHtml(row.label)}</td><td>${escapeHtml(money(row.outputs.operatingExpenses))}</td><td>${escapeHtml(money(row.outputs.noi))}</td><td>${escapeHtml(percent(row.outputs.noiMargin))}</td><td>${escapeHtml(money(row.outputs.noiDeltaVsBase))}</td></tr>`).join("");
  return section(
    "Operating Expense Stress",
    "operating-expense-stress",
    `<table class="detail-table iq-numeric-table"><thead><tr><th>Scenario</th><th>Operating Expenses</th><th>NOI</th><th>NOI Margin</th><th>NOI Change vs Base</th></tr></thead><tbody>${rows}</tbody></table><p class="footer-note">${escapeHtml(customerCopy(scenario.qualification))}</p>`,
    dispositionValue(scenario),
    { keepTogether: true }
  );
}

function renderCapRateSensitivity(contract) {
  const scenario = contract.capRateValueSensitivity;
  if (!scenario?.displayReady || isCollapsed(scenario)) return "";
  const hasPurchasePrice = contract.scenarioBasis?.base?.purchasePrice?.displayReady === true;
  const rows = scenario.rows.map((row) => `<tr data-iq-evidence-class="scenario"><td>${escapeHtml(row.label)}</td><td>${escapeHtml(percent(row.scenarioInputs.scenarioCapRate, 2))}</td><td>${escapeHtml(money(row.outputs.impliedValue))}</td><td>${row.outputs.valuePerUnit !== null ? escapeHtml(money(row.outputs.valuePerUnit)) : "Not available"}</td>${hasPurchasePrice ? `<td>${row.outputs.valueDeltaVsPurchasePrice !== null ? escapeHtml(money(row.outputs.valueDeltaVsPurchasePrice)) : "Not available"}</td>` : ""}</tr>`).join("");
  return section(
    "Cap Rate / Value Sensitivity",
    "cap-rate-value-sensitivity",
    `<table class="detail-table iq-numeric-table"><thead><tr><th>Scenario</th><th>Cap Rate</th><th>Implied Value</th><th>Value / Unit</th>${hasPurchasePrice ? "<th>Change vs Purchase Price</th>" : ""}</tr></thead><tbody>${rows}</tbody></table><p class="footer-note">${escapeHtml(customerCopy(scenario.qualification))}</p>`,
    dispositionValue(scenario)
  );
}

function renderMatrix(contract) {
  const matrix = contract.occupancyExpenseMatrix;
  if (!matrix?.displayReady || isCollapsed(matrix)) return "";
  const headers = matrix.expenseLevels.map((level) => `<th>${level.stressRate === 0 ? "Base OpEx" : `OpEx +${Math.round(level.stressRate * 100)}%`}</th>`).join("");
  const rows = matrix.occupancyLevels.map((level) => {
    const cells = matrix.expenseLevels.map((expense) => {
      const cell = matrix.cells.find((candidate) => candidate.rowKey === level.key && candidate.columnKey === expense.key);
      return `<td data-iq-evidence-class="scenario">${cell ? escapeHtml(money(cell.scenarioNoi)) : "Not available"}</td>`;
    }).join("");
    const label = level.deltaPercentagePoints === 0 ? `Base Occupancy ${percent(level.occupancy)}` : `${Math.round(Math.abs(level.deltaPercentagePoints) * 100)} pp Stress ${percent(level.occupancy)}`;
    return `<tr><td>${escapeHtml(label)}</td>${cells}</tr>`;
  }).join("");
  return section(
    "Occupancy × Expense NOI Matrix",
    "occupancy-expense-noi-matrix",
    `<table class="detail-table iq-numeric-table"><thead><tr><th>Occupancy Scenario</th>${headers}</tr></thead><tbody>${rows}</tbody></table><p class="footer-note">${escapeHtml(customerCopy(matrix.qualification))}</p>`,
    dispositionValue(matrix)
  );
}

function renderDeferredFamilies(contract) {
  const items = (Array.isArray(contract.deferredScenarioFamilies) ? contract.deferredScenarioFamilies : [])
    .map((item) => {
      const key = String(item.key || "").trim().toLowerCase();
      const labels = {
        rent_stress: "Rent Stress",
        interest_rate_stress: "Interest Rate Stress",
        purchase_price_stress: "Purchase Price Stress",
        irr_moic: "Levered Return Metrics",
      };
      const reason = key === "irr_moic"
        ? "Not shown without a separately authorized complete cash-flow and equity basis."
        : customerCopy(item.reason);
      return `<li style="margin-bottom:5px;"><strong>${escapeHtml(labels[key] || String(item.key || "").replace(/_/g, " "))}:</strong> ${escapeHtml(reason)}</li>`;
    })
    .join("");
  if (!items) return "";
  return `<div class="iq-boundary-list allow-break" data-iq-elite-scenario-boundaries="true"><p class="subsection-title">Scenario Boundaries</p><ul style="margin:0;padding-left:18px;">${items}</ul></div>`;
}

export function renderFullUnderwritingScenarioEngineV1Html(contract) {
  const validation = validateFullUnderwritingScenarioEngineV1(contract);
  if (!validation.ok) {
    throw new Error(`ELITE_SCENARIO_ENGINE_CONTRACT_INVALID:${validation.issues.join(",")}`);
  }
  if (!contract.availability?.chapterDisplayReady) return "";
  return [
    renderScenarioBasis(contract),
    renderOccupancyStress(contract),
    renderExpenseStress(contract),
    renderCapRateSensitivity(contract),
    renderMatrix(contract),
    renderDeferredFamilies(contract),
  ].filter(Boolean).join("\n");
}
