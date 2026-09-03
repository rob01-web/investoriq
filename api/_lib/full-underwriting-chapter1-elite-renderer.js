import { FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION } from "./full-underwriting-chapter1-elite-contract.js";

const HIDDEN_DISPOSITIONS = new Set(["omit", "collapse"]);

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
    .replace(/canonical reconciliation basis/gi, "source reconciliation basis")
    .replace(/canonical source variance/gi, "source variance")
    .replace(/canonical rent roll/gi, "accepted Rent Roll")
    .replace(/canonical T12/gi, "accepted T12")
    .replace(/governed operating inputs/gi, "verified operating inputs")
    .replace(/governed Rent Roll basis/gi, "accepted Rent Roll basis")
    .replace(/a governed going-in cap-rate reference/gi, "a source-supported going-in cap-rate reference")
    .replace(/Governed current debt DSCR/gi, "Current debt DSCR")
    .replace(/Governed proposed financing DSCR/gi, "Proposed financing DSCR")
    .replace(/governed annual debt-service amount/gi, "accepted annual debt-service amount")
    .replace(/current governed calculation/gi, "current deterministic calculation")
    .replace(/governed inputs/gi, "accepted inputs")
    .replace(/\bgoverned\b/gi, "verified");
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMoney(value) {
  const number = finite(value);
  if (number === null) return "Not available";
  const normalized = Object.is(number, -0) ? 0 : number;
  const absolute = Math.abs(normalized).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return normalized < 0 ? `($${absolute})` : `$${absolute}`;
}

function formatPercent(value, digits = 1) {
  const number = finite(value);
  if (number === null) return "Not available";
  return `${(number * 100).toFixed(digits)}%`;
}

function formatMetricValue(receipt = null) {
  if (receipt?.displayReady !== true) return "Not available";
  const value = finite(receipt?.value);
  if (value === null) return "Not available";
  switch (String(receipt?.units || "")) {
    case "count":
      return Math.round(value).toLocaleString("en-US");
    case "currency":
    case "currency_per_year":
    case "currency_per_unit":
    case "currency_per_unit_per_year":
      return formatMoney(value);
    case "ratio":
      return formatPercent(value, 1);
    case "ratio_delta":
      return `${(value * 100).toFixed(1)} pp`;
    case "ratio_x":
      return `${value.toFixed(2)}x`;
    default:
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

function sectionDisposition(contract, sectionKey) {
  return contract?.sectionDispositions?.[sectionKey]?.disposition ||
    contract?.[sectionKey]?.disposition ||
    null;
}

function shouldRender(contract, sectionKey) {
  const disposition = sectionDisposition(contract, sectionKey);
  return Boolean(disposition && !HIDDEN_DISPOSITIONS.has(disposition));
}

function renderSection({
  title,
  sectionKey,
  disposition,
  bodyHtml,
  legacySectionLabel = null,
  allowBreak = false,
  bodyClass = "",
}) {
  if (!bodyHtml) return "";
  const bodyClasses = ["card", allowBreak ? "allow-break" : "no-break", bodyClass].filter(Boolean).join(" ");
  return `<section class="section" data-iq-elite-section="${escapeHtml(sectionKey)}" data-iq-disposition="${escapeHtml(disposition || "include")}"${legacySectionLabel ? ` data-iq-boss-section="${escapeHtml(legacySectionLabel)}"` : ""}>
    <div class="section-header"><span class="section-header-title">${escapeHtml(title)}</span></div>
    <div class="${bodyClasses}">${bodyHtml}</div>
  </section>`;
}

function renderSignalList(items = []) {
  const valid = (Array.isArray(items) ? items : []).filter((item) => item?.statement);
  if (!valid.length) return "";
  return `<ul class="iq-ic-signal-list">${valid.map((item) => {
    const qualification = item?.qualification
      ? `<div class="small iq-ic-signal-qualification">${escapeHtml(customerCopy(item.qualification))}</div>`
      : "";
    return `<li data-iq-elite-signal="${escapeHtml(item?.code || "")}">${escapeHtml(customerCopy(item.statement))}${qualification}</li>`;
  }).join("")}</ul>`;
}

function executiveMetric(contract, key) {
  const receipt = contract?.metrics?.[key];
  return receipt?.displayReady === true ? receipt : null;
}

function renderExecutiveMetric(contract, key, label = null) {
  const receipt = executiveMetric(contract, key);
  if (!receipt) return "";
  return `<div class="phase8a-exec-metric" data-iq-phase8a-exec-metric="${escapeHtml(key)}"><span>${escapeHtml(label || receipt.label || key)}</span><strong>${escapeHtml(formatMetricValue(receipt))}</strong></div>`;
}

function executiveDecisionState(primary = null) {
  const code = String(primary?.code || "");
  if (code === "PRIMARY_SOURCE_RECONCILIATION_REQUIRED") return "RECONCILIATION REQUIRED";
  if (code === "CURRENT_DEBT_DSCR_BELOW_1X" || code === "PROPOSED_FINANCING_DSCR_BELOW_1X") return "FINANCING REVIEW REQUIRED";
  if (primary?.statement) return "DILIGENCE REQUIRED";
  return "UNDERWRITING REVIEW READY";
}

function executiveThesisPoints(contract) {
  const metrics = contract?.metrics || {};
  const points = [];
  const occupancy = executiveMetric(contract, "occupancy");
  const noiMargin = executiveMetric(contract, "noiMargin");
  const grossRentDifference = executiveMetric(contract, "annualGrossRentDifference");
  const currentDscr = executiveMetric(contract, "currentDebtDscr");
  const proposedDscr = executiveMetric(contract, "proposedFinancingDscr");
  const purchasePrice = executiveMetric(contract, "purchasePrice");
  const goingInCapRate = executiveMetric(contract, "goingInCapRate");

  if (occupancy && noiMargin) {
    points.push(`Current operations show ${formatMetricValue(occupancy)} occupancy and a ${formatMetricValue(noiMargin)} NOI margin.`);
  }
  if (purchasePrice && goingInCapRate) {
    points.push(`The transaction is presented at ${formatMetricValue(purchasePrice)} with a ${formatMetricValue(goingInCapRate)} going-in cap rate.`);
  }
  if (grossRentDifference) {
    points.push(`The Rent Roll documents ${formatMetricValue(grossRentDifference)} of annual gross rent difference versus market rent. This is rent evidence, not NOI.`);
  }
  if (currentDscr && proposedDscr) {
    const current = finite(currentDscr.value);
    const proposed = finite(proposedDscr.value);
    const change = current !== null && proposed !== null ? current - proposed : null;
    points.push(change !== null && change > 0
      ? `Proposed financing tightens DSCR from ${formatMetricValue(currentDscr)} currently to ${formatMetricValue(proposedDscr)}, a ${change.toFixed(2)}x reduction in coverage.`
      : `Current and proposed debt coverage are ${formatMetricValue(currentDscr)} and ${formatMetricValue(proposedDscr)}, respectively.`);
  }
  return points.slice(0, 4);
}

function executiveConditions(contract, primary = null) {
  const conditions = [];
  const code = String(primary?.code || "");
  if (code === "PRIMARY_SOURCE_RECONCILIATION_REQUIRED") {
    conditions.push("The T12 and Rent Roll income bases must be reconciled before variance-sensitive conclusions are relied upon.");
  } else if (primary?.statement) {
    conditions.push(customerCopy(primary.statement));
  }

  const diligence = Array.isArray(contract?.executiveInvestmentSummary?.unresolvedDiligence)
    ? contract.executiveInvestmentSummary.unresolvedDiligence.filter((item) => item?.question)
    : [];
  for (const item of diligence) {
    const question = customerCopy(item.question);
    if (question && !conditions.some((existing) => existing.toLowerCase() === question.toLowerCase())) {
      conditions.push(question.endsWith("?") ? question.slice(0, -1) + "." : question);
    }
  }

  const proposedDscr = executiveMetric(contract, "proposedFinancingDscr");
  if (proposedDscr) {
    conditions.push(`Proposed financing terms must remain acceptable after lender diligence; modeled DSCR at the stated terms is ${formatMetricValue(proposedDscr)}.`);
  }
  return conditions.slice(0, 4);
}

function renderExecutiveInvestmentSummary(contract) {
  const section = contract?.executiveInvestmentSummary || {};
  const disposition = sectionDisposition(contract, "executiveInvestmentSummary");
  if (!shouldRender(contract, "executiveInvestmentSummary")) return "";

  const primary = section?.primaryConstraint;
  const decisionState = executiveDecisionState(primary);
  const thesisPoints = executiveThesisPoints(contract);
  const conditions = executiveConditions(contract, primary);
  const propertyName = contract?.identity?.propertyName || section?.assetStatement || "Property";
  const assetStatement = section?.assetStatement || contract?.identity?.assetIdentity || null;
  const assetDescriptor = assetStatement && assetStatement !== propertyName ? assetStatement : null;

  const metricsHtml = [
    renderExecutiveMetric(contract, "purchasePrice", "Purchase Price"),
    renderExecutiveMetric(contract, "noi", "T12 NOI"),
    renderExecutiveMetric(contract, "occupancy", "Occupancy"),
    renderExecutiveMetric(contract, "goingInCapRate", "Going-In Cap Rate"),
    renderExecutiveMetric(contract, "proposedLoanAmount", "Proposed Loan"),
    renderExecutiveMetric(contract, "proposedFinancingDscr", "Proposed DSCR"),
  ].filter(Boolean).join("");

  const thesisHtml = thesisPoints.length
    ? `<div class="phase8a-exec-panel"><p class="subsection-title">Investment Thesis</p><ul>${thesisPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul></div>`
    : "";
  const conditionsHtml = conditions.length
    ? `<div class="phase8a-exec-panel"><p class="subsection-title">What Must Be True</p><ul>${conditions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`
    : "";

  const primaryHtml = primary?.statement
    ? `<div class="phase8a-exec-gate"><span>Primary Decision Gate</span><strong>${escapeHtml(primary?.title || "Diligence item")}</strong><p>${escapeHtml(customerCopy(primary.statement))}</p>${primary?.investorImpact ? `<p><b>Why it matters:</b> ${escapeHtml(customerCopy(primary.investorImpact))}</p>` : ""}</div>`
    : "";

  return renderSection({
    title: "Executive Investment Summary",
    sectionKey: "executiveInvestmentSummary",
    disposition,
    bodyHtml: `<div class="phase8a-exec-header"><div><p class="phase8a-exec-property">${escapeHtml(propertyName)}</p>${assetDescriptor ? `<p class="phase8a-exec-asset">${escapeHtml(assetDescriptor)}</p>` : ""}</div><div class="phase8a-exec-state"><span>Current Decision State</span><strong>${escapeHtml(decisionState)}</strong></div></div>
      ${metricsHtml ? `<div class="phase8a-exec-metrics">${metricsHtml}</div>` : ""}
      ${primaryHtml}
      <div class="phase8a-exec-columns">${thesisHtml}${conditionsHtml}</div>
      <p class="phase8a-exec-boundary">This page frames the current underwriting decision from the documents provided. Scenario cases and detailed source treatment appear in the sections that follow.</p>`,
    legacySectionLabel: "Executive Summary",
    bodyClass: "iq-ic-summary-card phase8a-executive-summary",
  });
}

const KEY_METRIC_ORDER = Object.freeze([
  "units",
  "occupancy",
  "annualInPlaceRent",
  "annualMarketRent",
  "annualGrossRentDifference",
  "egi",
  "operatingExpenses",
  "noi",
  "expenseRatio",
  "noiMargin",
  "breakEvenOccupancy",
  "occupancyBreakEvenSpread",
  "purchasePrice",
  "pricePerUnit",
  "goingInCapRate",
  "currentDebtDscr",
  "proposedFinancingDscr",
]);

const PRIMARY_METRIC_ORDER = Object.freeze([
  "units",
  "occupancy",
  "noi",
  "purchasePrice",
  "goingInCapRate",
  "proposedFinancingDscr",
  "currentDebtDscr",
  "annualGrossRentDifference",
  "expenseRatio",
]);

function renderMetricCell(receipt) {
  return `<div class="iq-ic-metric" data-iq-elite-metric="${escapeHtml(receipt.key)}" data-iq-evidence-class="${escapeHtml(receipt.evidenceClass || "")}">
    <span class="iq-ic-metric-label">${escapeHtml(receipt.label || receipt.key)}</span>
    <span class="iq-ic-metric-value">${escapeHtml(formatMetricValue(receipt))}</span>
  </div>`;
}

function renderKeyMetricsSnapshot(contract) {
  const disposition = sectionDisposition(contract, "keyMetricsSnapshot");
  if (!shouldRender(contract, "keyMetricsSnapshot")) return "";
  const metrics = contract?.metrics || {};
  const displayReady = KEY_METRIC_ORDER
    .map((key) => metrics?.[key])
    .filter((receipt) => receipt?.displayReady === true);

  if (!displayReady.length) {
    return renderSection({
      title: "Key Metrics Snapshot",
      sectionKey: "keyMetricsSnapshot",
      disposition,
      bodyHtml: `<p class="body-copy">No display-ready committee metrics are available.</p>`,
      legacySectionLabel: "Key Metrics Snapshot",
    });
  }

  const primary = PRIMARY_METRIC_ORDER
    .map((key) => metrics?.[key])
    .filter((receipt) => receipt?.displayReady === true)
    .slice(0, 6);
  const primaryKeys = new Set(primary.map((receipt) => receipt.key));
  const secondary = displayReady.filter((receipt) => !primaryKeys.has(receipt.key));
  const secondaryItems = secondary
    .map((receipt) => `<div class="iq-ic-secondary-metric" data-iq-elite-metric="${escapeHtml(receipt.key)}" data-iq-evidence-class="${escapeHtml(receipt.evidenceClass || "")}">
      <span class="iq-ic-secondary-label">${escapeHtml(receipt.label || receipt.key)}</span>
      <strong class="iq-ic-secondary-value">${escapeHtml(formatMetricValue(receipt))}</strong>
    </div>`)
    .join("");

  return renderSection({
    title: "Key Metrics Snapshot",
    sectionKey: "keyMetricsSnapshot",
    disposition,
    bodyHtml: `<div class="iq-ic-metric-grid">${primary.map(renderMetricCell).join("")}</div>
      ${secondaryItems ? `<div class="iq-ic-secondary-grid">${secondaryItems}</div>` : ""}
      <p class="footer-note iq-ic-lineage-note">Metrics reflect verified source facts and deterministic calculations. Detailed lineage is retained in the report quality record.</p>`,
    legacySectionLabel: "Key Metrics Snapshot",
    allowBreak: true,
    bodyClass: "iq-ic-metrics-card",
  });
}

function renderInvestmentCase(contract) {
  const section = contract?.investmentCase || {};
  const disposition = sectionDisposition(contract, "investmentCase");
  if (!shouldRender(contract, "investmentCase")) return "";
  const groups = [
    ["Opportunity Signals", section.opportunitySignals],
    ["Operating Signals", section.operatingSignals],
    ["Value Signals", section.valueSignals],
    ["Financing Signals", section.financingSignals],
    ["Constraint Signals", section.constraintSignals],
  ].map(([label, items]) => {
    const html = renderSignalList(items);
    return html ? `<div class="iq-ic-signal-panel"><p class="subsection-title">${escapeHtml(label)}</p>${html}</div>` : "";
  }).filter(Boolean).join("");
  if (!groups) return "";
  return renderSection({
    title: "Underwriting Observations",
    sectionKey: "investmentCase",
    disposition,
    bodyHtml: `<div class="iq-ic-signal-grid">${groups}</div><p class="footer-note iq-ic-lineage-note">These observations are mathematical or document-supported only. No discretionary investment grade is assigned.</p>`,
    legacySectionLabel: "Underwriting Observations",
    allowBreak: true,
    bodyClass: "iq-ic-observations-card",
  });
}

function renderPrincipalRisks(contract) {
  const section = contract?.principalRisksAndConstraints || {};
  const disposition = sectionDisposition(contract, "principalRisksAndConstraints");
  if (!shouldRender(contract, "principalRisksAndConstraints")) return "";
  const primaryCode = contract?.executiveInvestmentSummary?.primaryConstraint?.code || null;
  const items = (Array.isArray(section.items) ? section.items : [])
    .filter((item) => item?.statement)
    .filter((item) => !primaryCode || item?.code !== primaryCode);
  if (!items.length) return "";
  const html = items.map((item) => `<div class="iq-ic-risk-item" data-iq-elite-risk="${escapeHtml(item?.code || "")}">
    <p class="subsection-title">${escapeHtml(item?.title || "Constraint")}</p>
    <p class="body-copy">${escapeHtml(customerCopy(item.statement))}</p>
    ${item?.investorImpact ? `<p class="body-copy"><strong>Investor impact:</strong> ${escapeHtml(customerCopy(item.investorImpact))}</p>` : ""}
    ${item?.followUp ? `<p class="body-copy"><strong>Follow-up:</strong> ${escapeHtml(customerCopy(item.followUp))}</p>` : ""}
  </div>`).join("");
  return renderSection({
    title: "Principal Risks & Constraints",
    sectionKey: "principalRisksAndConstraints",
    disposition,
    bodyHtml: `<div class="iq-ic-risk-list">${html}</div>`,
    legacySectionLabel: "Underwriting Observations",
    allowBreak: true,
    bodyClass: "iq-ic-risks-card",
  });
}

function renderInvestorQuestions(contract) {
  const section = contract?.investorQuestions || {};
  const disposition = sectionDisposition(contract, "investorQuestions");
  if (!shouldRender(contract, "investorQuestions")) return "";
  const surfacedQuestionCodes = new Set(
    (Array.isArray(contract?.executiveInvestmentSummary?.unresolvedDiligence)
      ? contract.executiveInvestmentSummary.unresolvedDiligence
      : [])
      .filter((item) => item?.question)
      .slice(0, 2)
      .map((item) => item?.code)
      .filter(Boolean)
  );
  const items = (Array.isArray(section.items) ? section.items : [])
    .filter((item) => item?.question)
    .filter((item) => !surfacedQuestionCodes.has(item?.code));
  if (!items.length) return "";
  const questionItems = items.map((item) => `<div class="iq-ic-question-item" data-iq-elite-question="${escapeHtml(item?.code || "")}">
      <p class="body-copy iq-ic-question-copy">${escapeHtml(customerCopy(item.question))}</p>
      <p class="small iq-ic-question-why"><strong>Why it matters:</strong> ${escapeHtml(customerCopy(item.whyItMatters || "Evidence-triggered diligence question."))}</p>
    </div>`).join("");
  return renderSection({
    title: "Additional Investor Questions",
    sectionKey: "investorQuestions",
    disposition,
    bodyHtml: `<div class="iq-ic-question-grid">${questionItems}</div>`,
    allowBreak: true,
    bodyClass: "iq-ic-questions-card",
  });
}

function renderSourceReconciliationAlert(contract) {
  const section = contract?.sourceReconciliationAlert || {};
  const disposition = sectionDisposition(contract, "sourceReconciliationAlert");
  if (!shouldRender(contract, "sourceReconciliationAlert") || section?.displayReady !== true) return "";
  const reconciliationMetrics = [
    ["T12 Gross Potential Rent", formatMoney(section.t12GrossPotentialRent)],
    ["Rent Roll Annual In-Place Rent", formatMoney(section.rentRollAnnualInPlaceRent)],
    ["Rent Roll less T12", formatMoney(section.differenceAmount)],
    ["Variance", formatPercent(section.varianceRatio, 2)],
  ].map(([label, value]) => `<div class="iq-ic-reconciliation-metric">
      <span class="iq-ic-secondary-label">${escapeHtml(label)}</span>
      <strong class="iq-ic-secondary-value">${escapeHtml(value)}</strong>
    </div>`).join("");
  return renderSection({
    title: "Primary Source Reconciliation Alert",
    sectionKey: "sourceReconciliationAlert",
    disposition,
    bodyHtml: `<div class="iq-callout iq-ic-reconciliation-callout" data-iq-tone="constraint">
        <p class="iq-callout-title">Source Reconciliation Required</p>
        <p class="iq-callout-copy">${escapeHtml(customerCopy(section.disclosure || ""))}</p>
      </div><div class="iq-ic-reconciliation-grid">${reconciliationMetrics}</div>`,
    legacySectionLabel: "Primary Constraint / Review Disclosure",
    allowBreak: true,
    bodyClass: "iq-ic-reconciliation-card",
  });
}

export function renderFullUnderwritingChapter1EliteHtml(contract = null) {
  if (!contract || contract.version !== FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION) return "";
  return `<div data-iq-elite-chapter1="true" data-iq-elite-chapter1-version="${escapeHtml(contract.version)}" data-iq-elite10b2="investment-committee-opening-v1">
    ${renderExecutiveInvestmentSummary(contract)}
    ${renderKeyMetricsSnapshot(contract)}
    ${renderInvestmentCase(contract)}
    ${renderPrincipalRisks(contract)}
    ${renderInvestorQuestions(contract)}
    ${renderSourceReconciliationAlert(contract)}
  </div>`;
}

export default renderFullUnderwritingChapter1EliteHtml;
