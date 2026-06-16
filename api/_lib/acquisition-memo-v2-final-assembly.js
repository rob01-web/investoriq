function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceAll(str, token, value) {
  if (!str || !token) return String(str || "");
  const source = String(str || "");
  return source.includes(token) ? source.split(token).join(value ?? "") : source;
}

function replaceMarkedSection(html, key, replacement = "") {
  const source = String(html || "");
  const token = String(key || "");
  if (!source || !token) return source;
  const begin = `<!-- BEGIN ${token} -->`;
  const end = `<!-- END ${token} -->`;
  if (!source.includes(begin) || !source.includes(end)) return source;
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<!-- BEGIN ${escapedToken} -->[\\s\\S]*?<!-- END ${escapedToken} -->`, "g");
  return source.replace(re, replacement);
}

function stripDocumentTreatmentSummaryMarkers(html) {
  return String(html || "")
    .replace(/<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->/gi, "")
    .replace(/<!-- END DOCUMENT_TREATMENT_SUMMARY -->/gi, "");
}

function stripDuplicateV2DocumentTreatmentBlocks(html) {
  const source = String(html || "");
  const title = "Source Context / Support Document Treatment";
  const firstIndex = source.indexOf(title);
  if (firstIndex < 0) return source;
  const secondIndex = source.indexOf(title, firstIndex + title.length);
  if (secondIndex < 0) return source;
  const sectionStart = source.lastIndexOf('<section class="section page-break">', secondIndex);
  if (sectionStart < 0) return source;
  const sectionEnd = source.indexOf("</section>", secondIndex);
  if (sectionEnd < 0) return source;
  return `${source.slice(0, sectionStart)}${source.slice(sectionEnd + "</section>".length)}`;
}

function insertBeforeClosingBody(html, block) {
  const source = String(html || "");
  const content = String(block || "");
  if (!source || !content) return source;
  if (/<\/body>/i.test(source)) {
    return source.replace(/<\/body>/i, `${content}</body>`);
  }
  if (/<\/html>/i.test(source)) {
    return source.replace(/<\/html>/i, `${content}</html>`);
  }
  return `${source}${content}`;
}

function buildFinancingReadinessBlock(renderedAcquisitionMemo = null, acquisitionMemoProjection = null) {
  const signals = acquisitionMemoProjection?.financingReadinessSignals || {};
  const hasCurrentDebtContext = Boolean(signals?.hasCurrentDebtContext);
  const rows = [
    `<tr><td>Current debt context uploaded</td><td style="font-weight:600;">${hasCurrentDebtContext ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions provided</td><td style="font-weight:600;">${Boolean(signals?.hasPurchaseAssumptions) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Structured renovation / CapEx plan</td><td style="font-weight:600;">${Boolean(signals?.hasStructuredRenovation) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Appraisal context</td><td style="font-weight:600;">${Boolean(signals?.hasAppraisalContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Market survey context</td><td style="font-weight:600;">${Boolean(signals?.hasMarketSurveyContext) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Environmental / Phase I ESA context</td><td style="font-weight:600;">${Boolean(signals?.hasEnvironmentalContext) ? "Yes" : "No"}</td></tr>`,
  ];
  const renderedSummaryHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.financingReadinessSummaryHtml || "").trim();
  const fallbackSummaryHtml = renderedSummaryHtml
    ? renderedSummaryHtml
    : `<p class="small" style="margin:0;color:#64748b;">${escapeHtml("Shown for lender discussion and acquisition diligence support only.")}</p>`;

  return `<section class="section page-break"><div class="section-header"><span class="section-header-title">Preliminary Financing Readiness Summary</span></div><div class="card no-break"><div>${fallbackSummaryHtml}</div><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Lender Diligence Checklist</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${rows.join("")}</tbody></table></div></div></section>`;
}

function buildDocumentTreatmentBlock(renderedAcquisitionMemo = null) {
  const documentTreatmentHtml = stripDocumentTreatmentSummaryMarkers(renderedAcquisitionMemo?.documentTreatmentSummaryHtml || "").trim();
  if (!documentTreatmentHtml) return "";
  return `<section class="section page-break"><div class="section-header"><span class="section-header-title">Source Context / Support Document Treatment</span></div><div class="card no-break"><p class="subsection-title">Document Treatment Summary</p>${documentTreatmentHtml}</div></section>`;
}

export function applyAcquisitionMemoV2FinalAssembly({
  html,
  renderedAcquisitionMemo,
  acquisitionMemoProjection,
} = {}) {
  const sourceHtml = String(html || "");
  if (!sourceHtml) return sourceHtml;

  const readinessBlock = buildFinancingReadinessBlock(renderedAcquisitionMemo, acquisitionMemoProjection);
  const expectedCurrentDebtChecklistValue = acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true ? "Yes" : "No";
  const expectedCurrentDebtChecklistRowRe = new RegExp(
    `<td[^>]*>\\s*Current debt context uploaded\\s*<\\/td><td[^>]*>\\s*${expectedCurrentDebtChecklistValue}\\s*<\\/td>`,
    "i"
  );
  let nextHtml = replaceAll(
    sourceHtml,
    "{{PRELIMINARY_FINANCING_READINESS_SUMMARY_BLOCK}}",
    readinessBlock
  );
  nextHtml = replaceMarkedSection(
    nextHtml,
    "SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY",
    `<!-- BEGIN SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->${readinessBlock}<!-- END SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->`
  );
  if (
    !/Preliminary Financing Readiness Summary/i.test(nextHtml) ||
    !/Lender Diligence Checklist/i.test(nextHtml) ||
    !expectedCurrentDebtChecklistRowRe.test(nextHtml)
  ) {
    const currentDebtChecklistRowRe = /<td[^>]*>\s*Current debt context uploaded\s*<\/td><td[^>]*>[^<]*<\/td>/i;
    if (currentDebtChecklistRowRe.test(nextHtml)) {
      nextHtml = nextHtml.replace(
        currentDebtChecklistRowRe,
        `<td>Current debt context uploaded</td><td style="font-weight:600;">${expectedCurrentDebtChecklistValue}</td>`
      );
    }

    if (!expectedCurrentDebtChecklistRowRe.test(nextHtml)) {
      nextHtml = insertBeforeClosingBody(nextHtml, readinessBlock);
    }
  }

  const documentTreatmentBlock = buildDocumentTreatmentBlock(renderedAcquisitionMemo);
  if (documentTreatmentBlock && !(/Source Context \/ Support Document Treatment/i.test(nextHtml) && /Debt Support Received \/ Contextual/i.test(nextHtml))) {
    nextHtml = insertBeforeClosingBody(nextHtml, documentTreatmentBlock);
  }

  nextHtml = stripDuplicateV2DocumentTreatmentBlocks(nextHtml);
  return nextHtml;
}
