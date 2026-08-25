import { FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION } from "./full-underwriting-transaction-diligence-v1.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(Object.is(n, -0) ? 0 : n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `($${abs})` : `$${abs}`;
}

function percent(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${(n * 100).toFixed(digits)}%`;
}

function displayMetric(receipt) {
  if (!receipt?.displayReady) return "";
  if (receipt.units === "currency") return money(receipt.value);
  if (receipt.units === "ratio") return percent(receipt.value, 2);
  if (receipt.units === "years") return `${Number(receipt.value).toFixed(0)} years`;
  return String(receipt.value ?? "");
}

function statusLabel(status) {
  const labels = {
    documented: "Documented",
    documented_with_limitations: "Documented with limitations",
    received_not_display_ready: "Received; quantitative use limited",
    not_provided: "Not provided",
  };
  return labels[status] || String(status || "").replace(/_/g, " ");
}

function humanizeContextValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const labels = {
    none_identified_in_summary: "None identified in this summary",
    not_stated: "Not stated",
    not_provided: "Not provided",
  };
  return labels[raw] || raw.replace(/_/g, " ");
}

function renderTransactionSnapshot(contract) {
  const disposition = contract?.sectionDispositions?.transactionSnapshot?.disposition;
  if (disposition === "omit" || disposition === "collapse") return "";
  const preferredOrder = [
    "purchasePrice",
    "goingInCapRate",
    "proposedLoanAmount",
    "statedLtv",
    "amountDerivedLtv",
    "statedVsAmountLtvDifference",
    "proposedInterestRate",
    "proposedAmortizationYears",
    "proposedLenderFeePercent",
    "proposedEquityRequirement",
    "currentDebtBalance",
    "currentDebtMaturity",
  ];
  const rows = preferredOrder
    .map((key) => contract.transactionMetrics?.[key])
    .filter((receipt) => receipt?.displayReady)
    .map(
      (receipt) =>
        `<tr data-iq-elite06-metric="${escapeHtml(receipt.key)}" data-iq-evidence-class="${escapeHtml(receipt.evidenceClass)}"><td>${escapeHtml(receipt.label)}</td><td>${escapeHtml(displayMetric(receipt))}</td></tr>`
    )
    .join("");
  if (!rows) {
    return `<div class="subsection-block"><p class="subsection-title">Transaction Snapshot</p><p class="body-copy">No display-ready transaction terms were established from the provided diligence materials.</p></div>`;
  }
  return `<div class="subsection-block" data-iq-elite06-surface="transaction-snapshot">
    <p class="subsection-title">Transaction Snapshot</p>
    <table class="detail-table"><tbody>${rows}</tbody></table>
    <p class="footer-note">Calculated transaction references are arithmetic only and do not add closing costs, reserves, CapEx funding, or other unstated assumptions.</p>
  </div>`;
}

function renderCoverage(contract) {
  const disposition = contract?.sectionDispositions?.diligenceCoverage?.disposition;
  if (disposition === "omit" || disposition === "collapse") return "";
  const summary = contract.coverageSummary || {};
  const rows = (Array.isArray(contract.diligenceCoverage) ? contract.diligenceCoverage : [])
    .map(
      (entry) => `<tr data-iq-elite06-diligence="${escapeHtml(entry.key)}" data-iq-diligence-status="${escapeHtml(entry.status)}">
        <td>${escapeHtml(entry.label)}</td>
        <td>${escapeHtml(statusLabel(entry.status))}</td>
        <td>${escapeHtml(entry.treatment)}</td>
        <td>${escapeHtml(entry.sourceLabel || "-")}</td>
      </tr>`
    )
    .join("");
  return `<div class="subsection-block" data-iq-elite06-surface="diligence-coverage">
    <p class="subsection-title">Diligence Coverage</p>
    <div class="summary-strip">
      <div><span>Documented</span><strong>${escapeHtml(summary.documented ?? 0)}</strong></div>
      <div><span>Limited / Received</span><strong>${escapeHtml((summary.documentedWithLimitations ?? 0) + (summary.receivedNotDisplayReady ?? 0))}</strong></div>
      <div><span>Not Provided</span><strong>${escapeHtml(summary.notProvided ?? 0)}</strong></div>
    </div>
    <table class="detail-table diligence-coverage-table" style="margin-top:10px;"><thead><tr><th>Diligence Area</th><th>Status</th><th>Treatment</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}

function renderThirdPartyContext(contract) {
  const ctx = contract.thirdPartyContext || {};
  const rows = [];
  if (ctx.appraisal?.displayReady) {
    if (Number.isFinite(Number(ctx.appraisal.appraisalValue))) rows.push(`<tr><td>Appraisal Value Context</td><td>${escapeHtml(money(ctx.appraisal.appraisalValue))}</td></tr>`);
    if (Number.isFinite(Number(ctx.appraisal.stabilizedNoi))) rows.push(`<tr><td>Appraisal Stabilized NOI Context</td><td>${escapeHtml(money(ctx.appraisal.stabilizedNoi))}</td></tr>`);
    if (Number.isFinite(Number(ctx.appraisal.stabilizedCapRate))) rows.push(`<tr><td>Appraisal Stabilized Cap Rate Context</td><td>${escapeHtml(percent(ctx.appraisal.stabilizedCapRate, 2))}</td></tr>`);
  }
  if (ctx.marketSurvey?.displayReady) rows.push(`<tr><td>Market Survey Ranges</td><td>${escapeHtml(ctx.marketSurvey.rangeCount)} documented range${Number(ctx.marketSurvey.rangeCount) === 1 ? "" : "s"}</td></tr>`);
  if (ctx.environmental?.displayReady) rows.push(`<tr><td>Environmental / Phase I Status</td><td>${escapeHtml(humanizeContextValue(ctx.environmental.phaseIStatus))}</td></tr>`);
  if (ctx.renovation?.displayReady) {
    if (Number.isFinite(Number(ctx.renovation.totalRenovationBudget))) rows.push(`<tr><td>Renovation / CapEx Budget Context</td><td>${escapeHtml(money(ctx.renovation.totalRenovationBudget))}</td></tr>`);
    if (Number.isFinite(Number(ctx.renovation.durationMonths))) rows.push(`<tr><td>Stated Capital Plan Duration</td><td>${escapeHtml(Math.round(Number(ctx.renovation.durationMonths)))} months</td></tr>`);
  }
  if (!rows.length) return "";
  return `<div class="subsection-block" data-iq-elite06-surface="third-party-context"><p class="subsection-title">Third-Party / Support Context</p><table class="detail-table"><tbody>${rows.join("")}</tbody></table><p class="footer-note">These items are contextual support and do not replace the accepted T12, Rent Roll, or InvestorIQ deterministic analysis.</p></div>`;
}

function renderOpenItems(contract) {
  const disposition = contract?.sectionDispositions?.openDiligenceItems?.disposition;
  const items = Array.isArray(contract.openDiligenceItems) ? contract.openDiligenceItems : [];
  if (disposition === "omit" || disposition === "collapse" || items.length === 0) return "";
  return `<div class="subsection-block" data-iq-elite06-surface="open-diligence-items"><p class="subsection-title">Open Diligence Items</p><ul style="margin:0;padding-left:18px;">${items.map((item) => `<li data-iq-diligence-code="${escapeHtml(item.code)}" style="margin-bottom:5px;">${escapeHtml(item.label)}</li>`).join("")}</ul></div>`;
}

function renderQuestions(contract) {
  const disposition = contract?.sectionDispositions?.investorQuestions?.disposition;
  const questions = Array.isArray(contract.investorQuestions) ? contract.investorQuestions : [];
  if (disposition === "omit" || disposition === "collapse" || questions.length === 0) return "";
  return `<div class="subsection-block" data-iq-elite06-surface="investor-questions"><p class="subsection-title">Key Investor Questions</p><ol style="margin:0;padding-left:20px;">${questions.map((question) => `<li style="margin-bottom:5px;">${escapeHtml(question)}</li>`).join("")}</ol></div>`;
}

export function renderFullUnderwritingTransactionDiligenceV1Html(contract = null) {
  if (!contract || contract.version !== FULL_UNDERWRITING_TRANSACTION_DILIGENCE_VERSION) return "";
  const body = [
    renderTransactionSnapshot(contract),
    renderCoverage(contract),
    renderThirdPartyContext(contract),
    renderOpenItems(contract),
    renderQuestions(contract),
  ].filter(Boolean).join("");
  if (!body) return "";
  return `<section class="section" data-iq-elite="transaction-diligence-v1">
    <div class="section-header"><span class="section-header-title">Transaction &amp; Diligence Intelligence</span></div>
    <div class="card allow-break">
      <p class="body-copy">Transaction terms, financing readiness, support-document coverage, and unresolved diligence items are summarized from governed report facts only.</p>
      ${body}
      <p class="footer-note">Missing or incomplete optional diligence limits only the dependent diligence analysis; it does not by itself invalidate otherwise sufficient core underwriting.</p>
    </div>
  </section>`;
}

export default {
  renderFullUnderwritingTransactionDiligenceV1Html,
};
