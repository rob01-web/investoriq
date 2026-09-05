import { publicationMoney as money, publicationPercent as percent } from "./publication-format.js";
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&(?:mdash|ndash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, " - ")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}





function surfacePercent(value) {
  if (!Number.isFinite(value)) return "Not available";
  const pct = Math.abs(value) <= 1 ? value * 100 : value;
  const rounded = Math.round(pct * 100) / 100;
  const text = Number.isInteger(rounded) ? rounded.toFixed(1) : rounded.toFixed(2);
  return `${text.replace(/\.00$/, ".0").replace(/(\.\d)0$/, "$1")}%`;
}

function evidenceLabel(evidenceClass) {
  if (evidenceClass === "source_backed") return "Accepted evidence";
  if (evidenceClass === "third_party_context") return "Third-party context";
  if (evidenceClass === "scenario") return "Scenario";
  if (evidenceClass === "deterministic_calculated") return "Deterministic calculated";
  return "Unavailable";
}

function badge(evidenceClass) {
  return `<span class="iq-evidence-label" data-iq-evidence-class="${escapeHtml(evidenceClass || "unsupported")}">${escapeHtml(evidenceLabel(evidenceClass))}</span>`;
}

function comparisonSentence(label, comparison) {
  if (!comparison?.supported || !Number.isFinite(comparison?.delta)) return "";
  const direction = comparison.direction || comparison.directionVsInvestorIq || "aligned";
  if (direction === "aligned") return `${label} is effectively aligned on the displayed dollar basis.`;
  const pct = Number.isFinite(comparison.deltaPct) ? ` (${percent(Math.abs(comparison.deltaPct), 1)})` : Number.isFinite(comparison.deltaPctVsInvestorIq) ? ` (${percent(Math.abs(comparison.deltaPctVsInvestorIq), 1)})` : "";
  return `${label} is ${money(Math.abs(comparison.delta))}${pct} ${direction} the comparison basis.`;
}

function renderBridge(model) {
  const rows = (Array.isArray(model?.valuationBridge) ? model.valuationBridge : []).map((row) => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td style="font-weight:600;">${money(row.value)}</td>
      <td>${Number.isFinite(row.valuePerUnit) ? money(row.valuePerUnit) : "Not available"}</td>
      <td>${badge(row.evidenceClass)}</td>
    </tr>`).join("");
  if (!rows) return "";
  return `<div class="subsection-block" data-iq-subsection="valuation-bridge">
    <p class="subsection-title">Valuation Bridge</p>
    <table class="detail-table iq-numeric-table"><thead><tr><th>Reference</th><th>Whole-Property Value</th><th>Per Unit</th><th>Evidence Class</th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}

function renderPurchaseComparison(model) {
  const row = model?.purchasePriceComparison;
  if (!row?.supported) return "";
  return `<div class="subsection-block" data-iq-subsection="purchase-price-reconciliation">
    <p class="subsection-title">Purchase Price Reconciliation</p>
    <table class="detail-table iq-numeric-table"><tbody>
      <tr><td>Purchase Price</td><td>${money(row.purchasePrice)}</td><td>${badge("source_backed")}</td></tr>
      <tr><td>NOI / Cap-Rate Cross-Check Less Purchase Price</td><td>${money(row.delta)}</td><td>${badge("deterministic_calculated")}</td></tr>
      <tr><td>Variance vs Purchase Price</td><td>${percent(row.deltaPct, 1)}</td><td>${badge("deterministic_calculated")}</td></tr>
      <tr><td>Accepted NOI / Purchase Price</td><td>${percent(row.purchasePriceImpliedCapRate, 2)}</td><td>${badge("deterministic_calculated")}</td></tr>
    </tbody></table>
    <p class="footer-note">${escapeHtml(comparisonSentence("NOI / cap-rate cross-check value", row))} The purchase-price ratio is a deterministic cross-check using accepted T12 NOI; it does not create a new transaction assumption.</p>
  </div>`;
}

function renderAppraisalComparison(model) {
  const row = model?.appraisalComparison;
  if (!row?.supported) return "";
  const comparison = {
    supported: true,
    delta: row.deltaVsInvestorIq,
    deltaPctVsInvestorIq: row.deltaPctVsInvestorIq,
    directionVsInvestorIq: row.directionVsInvestorIq,
  };
  return `<div class="subsection-block" data-iq-subsection="appraisal-reconciliation">
    <p class="small" data-iq-appraisal-surface-label="canonical" style="margin:0 0 4px 0;">${escapeHtml(row.visibleLabel || "Appraisal / Valuation Context")}</p>
    <p class="subsection-title">Appraisal Reconciliation</p>
    <table class="detail-table iq-numeric-table"><tbody>
      <tr><td>Appraised Value</td><td>${money(row.appraisalValue)}</td><td>${badge("third_party_context")}</td></tr>
      ${Number.isFinite(row.appraisalStabilizedNoi) ? `<tr><td>Appraisal Stabilized NOI</td><td>${money(row.appraisalStabilizedNoi)}</td><td>${badge("third_party_context")}</td></tr>` : ""}
      ${Number.isFinite(row.appraisalStabilizedCapRate) ? `<tr><td>Appraisal Stabilized Cap Rate</td><td>${surfacePercent(row.appraisalStabilizedCapRate)}</td><td>${badge("third_party_context")}</td></tr>` : ""}
      <tr><td>Appraised Value Less NOI / Cap-Rate Cross-Check</td><td>${money(row.deltaVsInvestorIq)}</td><td>${badge("deterministic_calculated")}</td></tr>
      ${Number.isFinite(row.deltaVsPurchasePrice) ? `<tr><td>Appraised Value Less Purchase Price</td><td>${money(row.deltaVsPurchasePrice)}</td><td>${badge("deterministic_calculated")}</td></tr>` : ""}
    </tbody></table>
    <p class="footer-note">${escapeHtml(comparisonSentence("Appraised value", comparison))} Appraisal information remains uploaded third-party context and cannot replace accepted T12 NOI or accepted transaction facts.</p>
  </div>`;
}

function renderCoreReconciliationImpact(model) {
  const reconciliation = model?.coreReconciliationContext || {};
  if (!reconciliation.supported || !Number.isFinite(reconciliation.differenceAmount)) return "";
  const varianceText = Number.isFinite(reconciliation.varianceRatioToT12Gpr)
    ? ` (${percent(reconciliation.varianceRatioToT12Gpr, 2)} of T12 Gross Potential Rent)`
    : "";
  const relationship = Math.abs(reconciliation.differenceAmount) < 0.5
    ? "The T12 and Rent Roll revenue bases are aligned at the displayed precision."
    : `The Rent Roll annual in-place rent differs from T12 Gross Potential Rent by ${money(reconciliation.differenceAmount)}${varianceText}.`;
  return `<div class="subsection-block" data-iq-subsection="core-reconciliation-impact">
    <p class="subsection-title">Core Evidence Reconciliation Impact</p>
    <p class="body-copy">${escapeHtml(relationship)} This revenue-base difference is not capitalized. The whole-property value indication remains anchored to accepted T12 NOI and the accepted going-in cap rate.</p>
  </div>`;
}

function renderSensitivity(model) {
  const sensitivity = model?.valueSensitivity;
  if (!sensitivity?.supported) return "";
  const rows = sensitivity.rows.map((row) => `
    <tr data-iq-valuation-sensitivity-row="${row.evidenceClass === "scenario" ? "scenario" : "accepted"}">
      <td>${percent(row.capRate, 2)}</td>
      <td style="font-weight:600;">${money(row.impliedValue)}</td>
      <td>${Number.isFinite(row.valuePerUnit) ? money(row.valuePerUnit) : "Not available"}</td>
      <td>${Number.isFinite(row.deltaVsPurchasePrice) ? money(row.deltaVsPurchasePrice) : "Not available"}</td>
      <td>${badge(row.evidenceClass)}</td>
    </tr>`).join("");
  return `<div class="subsection-block" data-iq-subsection="governed-cap-rate-value-sensitivity">
    <p class="subsection-title">Cap-Rate Value Sensitivity</p>
    <p class="body-copy">Scenario rates are drawn from the defined sensitivity set. This valuation section does not create additional cap-rate assumptions.</p>
    <table class="detail-table iq-numeric-table"><thead><tr><th>Cap Rate</th><th>Implied Value</th><th>Per Unit</th><th>Value Less Purchase Price</th><th>Evidence Class</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="footer-note">Scenario values are sensitivity outputs, not source evidence or appraisal conclusions.</p>
  </div>`;
}

function renderObservations(model) {
  const lines = [];
  for (const observation of Array.isArray(model?.observations) ? model.observations : []) {
    if (observation.code === "IMPLIED_VALUE_VS_PURCHASE_PRICE" && Number.isFinite(observation.delta)) {
      const direction = observation.direction === "aligned" ? "is effectively aligned with" : `is ${money(Math.abs(observation.delta))} ${observation.direction}`;
      lines.push(`NOI / cap-rate cross-check value ${direction} the accepted purchase-price basis${Number.isFinite(observation.deltaPct) ? ` (${percent(Math.abs(observation.deltaPct), 1)})` : ""}.`);
    }
    if (observation.code === "PURCHASE_PRICE_IMPLIED_CAP_RATE_CROSSCHECK" && Number.isFinite(observation.purchasePriceImpliedCapRate)) {
      lines.push(`Accepted T12 NOI divided by the accepted purchase price equals ${percent(observation.purchasePriceImpliedCapRate, 2)}, compared with the accepted going-in cap rate of ${percent(observation.acceptedGoingInCapRate, 2)}.`);
    }
    if (observation.code === "APPRAISAL_VS_INVESTORIQ_VALUE" && Number.isFinite(observation.delta)) {
      const direction = observation.direction === "aligned" ? "is effectively aligned with" : `is ${money(Math.abs(observation.delta))} ${observation.direction}`;
      lines.push(`The uploaded appraisal value ${direction} the NOI / cap-rate cross-check${Number.isFinite(observation.deltaPct) ? ` (${percent(Math.abs(observation.deltaPct), 1)})` : ""}.`);
    }
    if (observation.code === "GOVERNED_CAP_RATE_SCENARIO_RANGE" && Number.isFinite(observation.lowValue) && Number.isFinite(observation.highValue)) {
      lines.push(`Cap-rate scenarios produce an implied-value range of ${money(observation.lowValue)} to ${money(observation.highValue)} across ${observation.scenarioCount} scenario points.`);
    }
  }
  if (!lines.length) return "";
  return `<div class="subsection-block" data-iq-subsection="valuation-interpretation">
    <p class="subsection-title">Reconciliation Interpretation</p>
    <ul style="margin:0;padding-left:18px;">${lines.map((line) => `<li style="margin-bottom:5px;">${escapeHtml(line)}</li>`).join("")}</ul>
  </div>`;
}

function renderMissing(model, { reportCapRateSensitivityRendered = false } = {}) {
  const missing = Array.isArray(model?.missing) ? model.missing : [];
  const labels = {
    NO_ACCEPTED_PURCHASE_PRICE: "purchase-price comparison",
    NO_SOURCE_BACKED_APPRAISAL_VALUE: "appraisal comparison",
    NO_GOVERNED_CAP_RATE_SCENARIO_ROWS: "cap-rate sensitivity",
  };
  const omitted = missing
    .filter((item) => !(reportCapRateSensitivityRendered && item?.code === "NO_GOVERNED_CAP_RATE_SCENARIO_ROWS"))
    .map((item) => labels[item?.code])
    .filter(Boolean);
  if (!omitted.length) return "";
  return `<p class="footer-note" data-iq-subsection="valuation-collapsed-surfaces">Not shown because supporting evidence is unavailable: ${escapeHtml(omitted.join(", "))}.</p>`;
}

export function renderFullUnderwritingValuationReconciliation(
  model = null,
  { reportCapRateSensitivityRendered = false } = {}
) {
  if (!model || model.disposition === "collapsed" || model?.baseValue?.supported !== true) return "";
  const base = model.baseValue;
  return `<section class="section" data-iq-section="eliteValuationReconciliation" data-iq-disposition="${escapeHtml(model.disposition)}">
    <div class="section-header"><span class="section-header-title">${escapeHtml(model.visibleLabel || "Valuation Position & Reconciliation")}</span></div>
    <div class="card no-break" data-iq-subsection="accepted-value-indication">
      <p class="subsection-title">NOI / Cap-Rate Cross-Check</p>
      <table class="detail-table iq-numeric-table"><tbody>
        <tr><td>Accepted T12 NOI</td><td>${money(base.noi)}</td><td>${badge("source_backed")}</td></tr>
        <tr><td>Accepted Going-In Cap Rate</td><td>${percent(base.acceptedGoingInCapRate, 2)}</td><td>${badge("source_backed")}</td></tr>
        <tr><td>NOI / Cap-Rate Cross-Check Value</td><td style="font-weight:600;">${money(base.impliedValue)}</td><td>${badge("deterministic_calculated")}</td></tr>
        ${Number.isFinite(base.valuePerUnit) ? `<tr><td>Implied Value Per Unit</td><td>${money(base.valuePerUnit)}</td><td>${badge("deterministic_calculated")}</td></tr>` : ""}
      </tbody></table>
      <p class="footer-note">NOI / cap-rate cross-check value equals T12 NOI divided by the stated going-in cap rate. Because the cap rate is itself a transaction input, this is a consistency cross-check, not an independent valuation opinion.</p>
    </div>
    ${renderBridge(model)}
    ${renderPurchaseComparison(model)}
    ${renderAppraisalComparison(model)}
    ${renderCoreReconciliationImpact(model)}
    ${renderSensitivity(model)}
    ${renderObservations(model)}
    ${renderMissing(model, { reportCapRateSensitivityRendered })}
  </section>`;
}
