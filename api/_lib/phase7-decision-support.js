const PHASE7_DECISION_SUPPORT_MARKER = "elite-decision-support-v1";

function normalizeMode(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function resolveLane(reportMode = "") {
  const mode = normalizeMode(reportMode);
  if (mode === "screening" || mode === "screening_v1" || mode === "screening_report") return "screening";
  if (
    mode === "v1_core" ||
    mode === "underwriting" ||
    mode === "underwriting_report" ||
    mode === "full_underwriting" ||
    mode.startsWith("full_underwriting_")
  ) return "underwriting";
  return null;
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeBasicEntities(value = "") {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function visibleText(markup = "") {
  return decodeBasicEntities(
    String(markup || "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function collectSectionHeadings(html = "") {
  const source = String(html || "");
  const headings = [];
  const seen = new Set();
  const pattern = /<span\b[^>]*class\s*=\s*(["'])[^"']*\bsection-header-title\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/gi;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const text = visibleText(match[2]);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    headings.push(text);
  }
  return headings;
}

const DOMAIN_RULES = {
  screening: [
    { label: "Decision framing", pattern: /executive|screening|decision|risk/i },
    { label: "Operating evidence", pattern: /operating|t12|income|expense|noi|financial/i },
    { label: "Rent roll evidence", pattern: /rent roll|unit mix|occupancy|rent position|leasing/i },
    { label: "Source reconciliation", pattern: /reconciliation|source register|source coverage|data transparency|methodology/i },
  ],
  underwriting: [
    { label: "Decision framing", pattern: /executive|decision|risk/i },
    { label: "Operating evidence", pattern: /operating|t12|income|expense|noi|financial/i },
    { label: "Rent roll evidence", pattern: /rent roll|unit mix|occupancy|rent position|leasing/i },
    { label: "Transaction context", pattern: /transaction|purchase|deal terms|acquisition/i },
    { label: "Debt context", pattern: /debt|financing|coverage|dscr|loan/i },
    { label: "Valuation context", pattern: /valuation|cap rate|appraisal|value/i },
    { label: "Scenario evidence", pattern: /scenario|sensitivity|stress|breakpoint/i },
    { label: "Capital context", pattern: /capital plan|capital program|renovation|capex/i },
    { label: "Diligence and source trust", pattern: /diligence|source register|source coverage|quality manifest|methodology|data transparency|reconciliation/i },
  ],
};

function groupHeadingsByDecisionDomain(headings = [], lane = null) {
  const rules = DOMAIN_RULES[lane] || [];
  return rules
    .map((rule) => ({
      label: rule.label,
      headings: headings.filter((heading) => rule.pattern.test(heading)),
    }))
    .filter((row) => row.headings.length > 0);
}

function buildEvidenceConvictionMatrix(html = "", lane = null) {
  const headings = collectSectionHeadings(html);
  const rows = groupHeadingsByDecisionDomain(headings, lane);
  if (rows.length < 2) return "";

  const rowHtml = rows
    .map((row) => {
      const surfaces = row.headings.map((heading) => escapeHtml(heading)).join("; ");
      return `<tr><td>${escapeHtml(row.label)}</td><td>Presented</td><td>${surfaces}</td></tr>`;
    })
    .join("");

  return `<div class="card no-break phase7-evidence-conviction-matrix" data-iq-phase7-evidence-matrix="${PHASE7_DECISION_SUPPORT_MARKER}" style="margin-top:12px;"><p class="subsection-title">Evidence Conviction Matrix</p><p class="small" style="margin:0 0 6px 0;">Decision evidence already presented in this report, organized by decision domain.</p><table><thead><tr><th>Decision Domain</th><th>Coverage</th><th>Evidence Surfaces</th></tr></thead><tbody>${rowHtml}</tbody></table><p class="small" style="margin-top:6px;color:#667168;">This matrix organizes existing report evidence only. It does not independently score source quality, infer missing evidence, or create new underwriting assumptions.</p></div>`;
}

function insertEvidenceMatrixAtExecutiveClose(html = "", matrixHtml = "") {
  const source = String(html || "");
  if (!matrixHtml || source.includes('data-iq-phase7-evidence-matrix="')) return source;

  if (/<!--\s*END SECTION_0_5\s*-->/i.test(source)) {
    return source.replace(/<!--\s*END SECTION_0_5\s*-->/i, `${matrixHtml}\n<!-- END SECTION_0_5 -->`);
  }

  const executiveHeadingIndex = source.search(/class\s*=\s*(["'])[^"']*\bsection-header-title\b[^"']*\1[^>]*>\s*(?:Executive(?:\s+Investment)?\s+Summary|Investment\s+Decision\s+Snapshot)\s*<\/span>/i);
  if (executiveHeadingIndex < 0) return source;
  const closeIndex = source.indexOf("</section>", executiveHeadingIndex);
  if (closeIndex < 0) return source;
  return `${source.slice(0, closeIndex)}${matrixHtml}\n${source.slice(closeIndex)}`;
}

function wrapDecisionDriverMarkup(markup = "") {
  return `<div class="phase7-what-changes-decision no-break" data-iq-phase7-decision-drivers="${PHASE7_DECISION_SUPPORT_MARKER}" style="margin-top:12px;border-top:1px solid #ddd9cf;padding-top:10px;"><p class="subsection-title">What Changes the Decision</p><p class="small" style="margin:0 0 8px 0;color:#667168;">Source-backed upside drivers and primary constraints already identified by the report.</p>${markup}</div>`;
}

function frameExistingDecisionDrivers(html = "") {
  const source = String(html || "");
  if (source.includes('data-iq-phase7-decision-drivers="')) return source;

  const pairedMarkedBlocks = /(<!--\s*BEGIN EXEC_UPSIDE_BULLETS\s*-->[\s\S]*?<!--\s*END EXEC_UPSIDE_BULLETS\s*-->\s*<!--\s*BEGIN EXEC_RISK_BULLETS\s*-->[\s\S]*?<!--\s*END EXEC_RISK_BULLETS\s*-->)/i;
  if (pairedMarkedBlocks.test(source)) {
    return source.replace(pairedMarkedBlocks, (_match, markup) => wrapDecisionDriverMarkup(markup));
  }

  const renderedBulletPair = /(<div\b[^>]*class\s*=\s*(["'])[^"']*\bexec-bullet-block\b[^"']*\2[^>]*>[\s\S]*?<p\b[^>]*class\s*=\s*(["'])[^"']*\bexec-major-heading\b[^"']*\3[^>]*>\s*Key Upside Drivers\s*<\/p>[\s\S]*?<\/div>\s*<div\b[^>]*class\s*=\s*(["'])[^"']*\bexec-bullet-block\b[^"']*\4[^>]*>[\s\S]*?<p\b[^>]*class\s*=\s*(["'])[^"']*\bexec-major-heading\b[^"']*\5[^>]*>\s*Primary Constraints\s*<\/p>[\s\S]*?<\/div>)/i;
  if (renderedBulletPair.test(source)) {
    return source.replace(renderedBulletPair, (_match, markup) => wrapDecisionDriverMarkup(markup));
  }

  return source;
}

export function applyPhase7DecisionSupport(html, { reportMode = null } = {}) {
  const lane = resolveLane(reportMode);
  const source = String(html || "");
  if (!lane || !source) return source;

  const framed = frameExistingDecisionDrivers(source);
  const matrixHtml = buildEvidenceConvictionMatrix(framed, lane);
  return insertEvidenceMatrixAtExecutiveClose(framed, matrixHtml);
}

export function phase7DecisionSupportMetadata(reportMode = null) {
  const lane = resolveLane(reportMode);
  return {
    marker: PHASE7_DECISION_SUPPORT_MARKER,
    lane,
    sourcePresentOnly: true,
    addsFinancialMetrics: false,
    addsUnderwritingAssumptions: false,
    scoresSourceQuality: false,
    infersMissingEvidence: false,
  };
}
