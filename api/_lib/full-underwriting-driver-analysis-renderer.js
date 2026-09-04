import { validateFullUnderwritingDriverAnalysisV1 } from "./full-underwriting-driver-analysis-v1.js";

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
    .replace(/\bNo governed ELITE-04(?:\s+v1)?\b/gi, "No defined sensitivity")
    .replace(/\bcurrent governed ELITE-04(?:\s+v1)?\b/gi, "current defined sensitivity framework")
    .replace(/\bgoverned ELITE-04(?:\s+v1)?\b/gi, "defined sensitivity framework")
    .replace(/\bversioned by ELITE-04 policy\b/gi, "defined by the sensitivity policy")
    .replace(/\bELITE-04(?:\s+v1)?\b/gi, "the defined sensitivity framework")
    .replace(/\blater governed driver analysis\b/gi, "the dedicated driver analysis")
    .replace(/\bgoverned scenario framework\b/gi, "defined sensitivity framework")
    .replace(/\bgoverned scenario policy\b/gi, "defined sensitivity policy")
    .replace(/\bgoverned Debt Intelligence upgrade\b/gi, "dedicated debt analysis")
    .replace(/\bgoverned capital-burden stress family\b/gi, "defined capital-burden sensitivity")
    .replace(/\bgoverned tax-expense stress family\b/gi, "defined tax-expense sensitivity")
    .replace(/\bgoverned deterministic stress family\b/gi, "defined deterministic sensitivity")
    .replace(/\bversioned\b/gi, "defined")
    .replace(/\binvestment recommendations?\b/gi, "investment decisions")
    .replace(/\bscenario authority\b/gi, "scenario scope")
    .replace(/\bgoverned\b/gi, "defined");
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Not available";
  const normalized = Object.is(n, -0) ? 0 : n;
  const absolute = Math.abs(normalized).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return normalized < 0 ? `($${absolute})` : `$${absolute}`;
}

function percent(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Not available";
  const pct = Math.abs(n) <= 1.5 ? n * 100 : n;
  return `${pct.toFixed(digits)}%`;
}

function multiple(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}x` : "Not available";
}

function formatValue(value, units) {
  if (String(units || "").startsWith("currency")) return money(value);
  if (units === "ratio" || units === "percent" || units === "percentage") return percent(value, units === "ratio" ? 2 : 1);
  if (units === "multiple") return multiple(value);
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "Not available";
}

function dispositionValue(record) {
  return String(record?.disposition || "include");
}

function isCollapsed(record) {
  return ["collapse", "omit"].includes(dispositionValue(record));
}

function section(title, key, body, disposition = "include", { keepTogether = false } = {}) {
  return `<section class="section" data-iq-elite-driver-section="${escapeHtml(key)}" data-iq-disposition="${escapeHtml(disposition)}"><div class="section-header"><span class="section-header-title">${escapeHtml(title)}</span></div><div class="card ${keepTogether ? "no-break" : "allow-break"}">${body}</div></section>`;
}

function driverEvidenceLabel(driver) {
  const familyLabels = {
    occupancy_stress: "Occupancy stress",
    operating_expense_stress: "Operating-expense stress",
    cap_rate_value_sensitivity: "Cap-rate sensitivity",
  };
  return familyLabels[driver?.scenarioFamily] || "Scenario analysis";
}

function renderDriverTable(contract) {
  const disposition = contract.sectionDispositions?.underwritingDriverAnalysis;
  if (!contract.availability?.chapterContributionDisplayReady || isCollapsed(disposition)) return "";
  const rows = contract.rankedDrivers.map((driver) => {
    const target = driver.targetOutput || {};
    const baseText = formatValue(driver.baseInput?.value, driver.baseInput?.units);
    const stressText = driver.stressInput?.label || formatValue(driver.stressInput?.value, driver.stressInput?.units);
    const outputText = `${target.label}: ${formatValue(target.outputChange, target.units)}`;
    return `<tr data-iq-driver-key="${escapeHtml(driver.driverKey)}" data-iq-evidence-class="scenario">
      <td><strong>${escapeHtml(driver.label)}</strong><span class="iq-table-subtext">Base ${escapeHtml(baseText)} | ${escapeHtml(driverEvidenceLabel(driver))}</span></td>
      <td>${escapeHtml(stressText)}</td>
      <td>${escapeHtml(outputText)}</td>
      <td>${escapeHtml(percent(target.relativeImpactRatio, 1))}</td>
    </tr>`;
  }).join("");
  return section(
    "Sensitivity Reference",
    "underwriting-driver-analysis",
    `<p class="body-copy">These downside cases are shown side by side for reference. They are not ranked against one another because the shock magnitudes and target outputs differ.</p><table class="detail-table iq-driver-table" data-iq-driver-table="v2"><thead><tr><th>Driver &amp; Base</th><th>Stress</th><th>Output Change</th><th>Relative Movement Within Target</th></tr></thead><tbody>${rows}</tbody></table><p class="footer-note">Each row should be read within its own output family. Occupancy and operating-expense cases change NOI; cap-rate cases change implied value.</p>`,
    dispositionValue(disposition)
  );
}

function renderDecisionInterpretation(contract) {
  const decision = contract.decisionInterpretation || null;
  const disposition = contract.sectionDispositions?.decisionInterpretation;
  if (!decision?.displayReady || isCollapsed(disposition)) return "";
  const targetNotes = (Array.isArray(decision.targetNotes) ? decision.targetNotes : [])
    .map((note) => `<li style="margin-bottom:5px;">${escapeHtml(customerCopy(note))}</li>`)
    .join("");
  const combined = decision.combinedDownsideContext
    ? `<div class="subsection-block" data-iq-driver-combined-context="true" data-iq-evidence-class="scenario"><p class="subsection-title">Compound Downside Context</p><table class="detail-table"><tbody><tr><td>Scenario Occupancy</td><td>${escapeHtml(percent(decision.combinedDownsideContext.scenarioOccupancy))}</td></tr><tr><td>Operating-Expense Stress</td><td>${escapeHtml(percent(decision.combinedDownsideContext.operatingExpenseStressRate))}</td></tr><tr><td>Scenario NOI</td><td>${escapeHtml(money(decision.combinedDownsideContext.scenarioNoi))}</td></tr><tr><td>NOI Change vs Base</td><td>${escapeHtml(money(decision.combinedDownsideContext.noiDeltaVsBase))}</td></tr><tr><td>Relative NOI Movement</td><td>${escapeHtml(percent(decision.combinedDownsideContext.relativeNoiImpactRatio))}</td></tr></tbody></table><p class="footer-note">${escapeHtml(customerCopy(decision.combinedDownsideContext.interpretation))}</p></div>`
    : "";
  return section(
    "Sensitivity Interpretation",
    "driver-decision-interpretation",
    `<p class="body-copy"><strong>Read each case against the output it changes; the report does not assign a cross-output rank.</strong></p>${targetNotes ? `<ul style="margin:8px 0 0 0;padding-left:18px;">${targetNotes}</ul>` : ""}${combined}<p class="footer-note">Sensitivity cases are conditional tests, not probabilities, forecasts, or investment decisions.</p>`,
    dispositionValue(disposition)
  );
}

function renderDeferredDrivers(contract) {
  const disposition = contract.sectionDispositions?.deferredDrivers;
  if (!Array.isArray(contract.deferredDrivers) || !contract.deferredDrivers.length || isCollapsed(disposition)) return "";
  const items = contract.deferredDrivers
    .map((driver) => `<li style="margin-bottom:5px;"><strong>${escapeHtml(driver.label)}:</strong> ${escapeHtml(customerCopy(driver.reason))}</li>`)
    .join("");
  return `<div class="iq-boundary-list allow-break" data-iq-elite-driver-boundaries="true" data-iq-disposition="${escapeHtml(dispositionValue(disposition))}"><p class="subsection-title">Drivers Outside Current Sensitivity Scope</p><ul style="margin:0;padding-left:18px;">${items}</ul><p class="footer-note">These drivers remain outside the current sensitivity set until a defined test is available.</p></div>`;
}

export function renderFullUnderwritingDriverAnalysisV1Html(contract) {
  const validation = validateFullUnderwritingDriverAnalysisV1(contract);
  if (!validation.ok) {
    throw new Error(`ELITE_DRIVER_ANALYSIS_CONTRACT_INVALID:${validation.issues.join(",")}`);
  }
  if (!contract.availability?.chapterContributionDisplayReady) return "";
  return [
    renderDriverTable(contract),
    renderDecisionInterpretation(contract),
    renderDeferredDrivers(contract),
  ].filter(Boolean).join("\n");
}
