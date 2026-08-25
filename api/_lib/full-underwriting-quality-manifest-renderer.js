function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&(?:mdash|ndash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, " - ")
    .replace(/\s*[\u2014\u2013]\s*/g, " - ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Recorded with report generation";
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function listText(values = [], fallback = "None") {
  const rows = Array.isArray(values) ? values.filter(Boolean) : [];
  return rows.length > 0 ? rows.join("; ") : fallback;
}

function supportSummary(contract) {
  const support = contract?.supportEvidence || {};
  const roles = support.usedRoleLabels?.length ? support.usedRoleLabels : support.acceptedRoleLabels;
  if (support.acceptedCount > 0) {
    const roleText = listText(roles, "Supporting document context");
    return `${support.acceptedCount} accepted supporting document${support.acceptedCount === 1 ? "" : "s"}; ${roleText}`;
  }
  return "No supporting document was accepted for analytical use.";
}

function coverageSummary(coverage = {}) {
  if (!coverage || coverage.total === 0) return "Report sections follow evidence availability and section policy.";
  const parts = [];
  if (coverage.included > 0) parts.push(`${coverage.included} full`);
  if (coverage.qualified > 0) parts.push(`${coverage.qualified} qualified`);
  if (coverage.compact > 0) parts.push(`${coverage.compact} compact`);
  if (coverage.collapsed > 0) parts.push(`${coverage.collapsed} collapsed`);
  if (coverage.omitted > 0) parts.push(`${coverage.omitted} omitted`);
  return parts.length > 0 ? parts.join(" | ") : "Report sections follow evidence availability and section policy.";
}

export function renderFullUnderwritingQualityManifestV1Html(contract = null) {
  if (!contract || contract?.authority?.authorityCreating !== false || contract?.authority?.downstreamConsumeOnly !== true) {
    return "";
  }
  const coreEvidenceText = listText(
    (contract.coreEvidence || []).map((entry) => `${entry.label}: ${entry.status}`),
    "No accepted core evidence recorded"
  );
  const reducedSections = listText(
    contract?.sectionCoverage?.reducedOrOmittedSections,
    "No analytical topic was omitted without an integrated replacement surface."
  );
  const replacementSections = listText(contract?.sectionCoverage?.replacementSections, "");
  const calculationFramework = contract?.calculations?.frameworkVersion
    ? "InvestorIQ deterministic calculation framework"
    : contract?.calculations?.label || "Deterministic calculations from accepted report inputs";
  const supportExcluded = Number(contract?.supportEvidence?.excludedCount || 0);

  return `<section class="section" id="quality-manifest-title" data-iq-section="quality-manifest" style="page-break-before:always;break-before:page;">
    <div class="section-header"><span class="section-header-title">Quality Manifest</span></div>
    <p class="body-copy">This manifest summarizes the evidence basis, report coverage, analytical boundaries, and certification traceability for this underwriting report. It is a reader-facing trust summary; detailed publication records are retained separately.</p>
    <div class="grid-2-balanced" style="margin-top:12px;">
      <div class="card no-break">
        <p class="subsection-title">Report Identity</p>
        <div class="meta-line"><span class="meta-label">Product</span><span class="meta-value">${escapeHtml(contract?.report?.productIdentity || "InvestorIQ Underwriting Report")}</span></div>
        ${contract?.report?.propertyName ? `<div class="meta-line"><span class="meta-label">Property</span><span class="meta-value">${escapeHtml(contract.report.propertyName)}</span></div>` : ""}
        <div class="meta-line"><span class="meta-label">Generated</span><span class="meta-value">${escapeHtml(displayDate(contract?.report?.generatedAt))}</span></div>
        <div class="meta-line"><span class="meta-label">Evidence basis</span><span class="meta-value">${escapeHtml(contract?.evidenceBasis?.sourceMode?.label || "Accepted core evidence")}</span></div>
      </div>
      <div class="card no-break">
        <p class="subsection-title">Evidence Treatment</p>
        <p class="body-copy" style="margin-bottom:6px;"><strong>Core evidence:</strong> ${escapeHtml(coreEvidenceText)}</p>
        <p class="body-copy" style="margin-bottom:6px;"><strong>Supporting context:</strong> ${escapeHtml(supportSummary(contract))}</p>
        <p class="body-copy" style="margin-bottom:0;"><strong>Excluded / not accepted for analytical use:</strong> ${escapeHtml(String(supportExcluded))}</p>
      </div>
    </div>
    <div class="grid-2-balanced" style="margin-top:12px;">
      <div class="card no-break">
        <p class="subsection-title">Coverage &amp; Reconciliation</p>
        <p class="body-copy" style="margin-bottom:6px;"><strong>Core reconciliation:</strong> ${escapeHtml(contract?.evidenceBasis?.coreReconciliation?.label || "Core evidence reconciliation reviewed")}</p>
        <p class="body-copy" style="margin-bottom:6px;"><strong>Section coverage:</strong> ${escapeHtml(coverageSummary(contract?.sectionCoverage))}</p>
        ${replacementSections ? `<p class="body-copy" style="margin-bottom:6px;"><strong>Integrated coverage:</strong> ${escapeHtml(replacementSections)}</p>` : ""}
        <p class="body-copy" style="margin-bottom:0;"><strong>Coverage limitations:</strong> ${escapeHtml(reducedSections)}</p>
      </div>
      <div class="card no-break">
        <p class="subsection-title">Scenario &amp; Calculation Basis</p>
        <p class="body-copy" style="margin-bottom:6px;"><strong>Scenario analysis:</strong> ${escapeHtml(contract?.scenarios?.label || "No scenario analysis was rendered from the available inputs.")}</p>
        <p class="body-copy" style="margin-bottom:6px;">${escapeHtml(contract?.scenarios?.evidenceBoundary || "Scenario outputs are analytical cases, not uploaded evidence.")}</p>
        <p class="body-copy" style="margin-bottom:0;"><strong>Calculation framework:</strong> ${escapeHtml(calculationFramework)}</p>
      </div>
    </div>
    <div class="card no-break" style="margin-top:12px;">
      <p class="subsection-title">Certification &amp; Traceability</p>
      <p class="body-copy" style="margin-bottom:0;">${escapeHtml(contract?.certification?.customerCopy || "Final PDF certification and publication traceability are retained with the report publication record.")}</p>
    </div>
  </section>`;
}

export default renderFullUnderwritingQualityManifestV1Html;
