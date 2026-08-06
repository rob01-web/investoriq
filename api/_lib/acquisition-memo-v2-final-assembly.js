/**
 * Gate 3 elite Full Underwriting customer synthesis + final assembly.
 * Synthesis may contain only: sourced fact | deterministic calculation | limitation | unresolved question.
 * No BUY/SELL, recommendation, thesis, invented severity, or fabricated financing.
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
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

function insertAfterOpeningBody(html, block) {
  const source = String(html || "");
  const content = String(block || "");
  if (!source || !content) return source;
  if (/<body[^>]*>/i.test(source)) {
    return source.replace(/<body[^>]*>/i, (m) => `${m}${content}`);
  }
  return `${content}${source}`;
}

function factDisplay(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object" && value !== null) {
    if (value.displayReady === false) return null;
    if ("result" in value) {
      if (value.displayReady === true || Number.isFinite(Number(value.result))) {
        return value.result;
      }
      return null;
    }
  }
  if (Number.isFinite(Number(value))) return Number(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function sectionOf(model, key) {
  return model?.sections?.[key] || model?.customerSections?.[key] || null;
}

function dispositionOf(section) {
  return String(section?.disposition || section?.sectionDisposition?.disposition || section?.status || "").toLowerCase();
}

export function buildExecutiveUnderwritingSynthesis({
  customerSurfaceModel = null,
  financialIntelligence = null,
} = {}) {
  const sections = customerSurfaceModel?.sections || {};
  const ops = sectionOf(customerSurfaceModel, "operatingStatementTTMSummary");
  const unitMix = sectionOf(customerSurfaceModel, "unitMix");
  const debtCap = sectionOf(customerSurfaceModel, "debtCapacityAndCoverage");
  const currentDebt = sectionOf(customerSurfaceModel, "currentDebtContext");
  const proposed = sectionOf(customerSurfaceModel, "proposedFinancingContext");
  const recon = sectionOf(customerSurfaceModel, "coreReconciliation") ||
    financialIntelligence?.customerSections?.coreReconciliation;
  const appraisal = sectionOf(customerSurfaceModel, "appraisalContext");
  const capRate = sectionOf(customerSurfaceModel, "capRateValueIndication");

  const statements = [];
  const limitations = [];
  const unresolved = [];

  const noi = factDisplay(ops?.facts?.noi || ops?.facts?.netOperatingIncome || ops?.facts?.NOI);
  if (noi != null) {
    statements.push({
      kind: "sourced_fact",
      topic: "current_earnings",
      text: "Accepted T12 net operating income is available as a governed operating result.",
      value: noi,
    });
  } else {
    unresolved.push({
      topic: "current_earnings",
      missing: "Accepted T12 NOI",
      whyItMatters: "Current earnings underpin coverage, capacity, and valuation comparisons.",
      documentNeeded: "T12 operating statement with accepted NOI",
    });
  }

  if (recon?.displayReady === true || dispositionOf(recon) === "include" || recon?.facts?.differenceAmount != null) {
    const diff = factDisplay(recon?.facts?.differenceAmount ?? recon?.facts?.difference_amount);
    statements.push({
      kind: "deterministic_calculation",
      topic: "t12_rent_roll_reconciliation",
      text: "T12 and Rent Roll reconciliation has been calculated from accepted core inputs.",
      value: diff,
    });
  } else if (recon && (dispositionOf(recon) === "collapse" || recon?.status === "collapsed")) {
    limitations.push({
      topic: "t12_rent_roll_reconciliation",
      text: "Core T12/Rent Roll reconciliation is not display-ready; reconciliation detail is limited or collapsed.",
    });
  }

  const units = factDisplay(unitMix?.facts?.total_units || unitMix?.facts?.totalUnits);
  if (units != null) {
    statements.push({
      kind: "sourced_fact",
      topic: "unit_economics",
      text: "Unit count is accepted from governed Rent Roll / unit-mix evidence.",
      value: units,
    });
  }

  if (currentDebt && dispositionOf(currentDebt) !== "omit") {
    statements.push({
      kind: "sourced_fact",
      topic: "current_debt",
      text: "Current debt context is present and kept separate from proposed acquisition financing.",
    });
  } else {
    unresolved.push({
      topic: "current_debt",
      missing: "Current debt schedule or note terms",
      whyItMatters: "Without current debt, coverage and refinance comparisons cannot be completed.",
      documentNeeded: "Current mortgage statement or debt schedule",
    });
  }

  const hasProposedEvidence =
    proposed &&
    dispositionOf(proposed) !== "omit" &&
    dispositionOf(proposed) !== "collapse" &&
    (proposed?.factAvailability?.sourceBacked === true ||
      Object.keys(proposed?.facts || {}).length > 0);

  if (hasProposedEvidence) {
    statements.push({
      kind: "sourced_fact",
      topic: "proposed_financing",
      text: "Proposed acquisition financing is shown only from governed purchase-assumption / proposed-debt evidence.",
    });
  } else {
    limitations.push({
      topic: "proposed_financing",
      text: "Proposed acquisition financing is omitted because governed proposed-debt evidence is not available.",
    });
  }

  const debtFacts = debtCap?.facts || {};
  for (const [key, label] of [
    ["proposedMortgageConstant", "Proposed mortgage constant"],
    ["proposedDebtYield", "Proposed debt yield"],
    ["dscr", "Proposed DSCR"],
    ["ltv", "Proposed LTV"],
    ["debtCapacityResult", "Debt-capacity result"],
    ["bindingConstraint", "Binding financing constraint"],
  ]) {
    const v = factDisplay(debtFacts[key]);
    if (v != null) {
      statements.push({
        kind: "deterministic_calculation",
        topic: key,
        text: `${label} is supported by governed operands.`,
        value: v,
      });
    }
  }

  if (capRate && dispositionOf(capRate) !== "omit") {
    statements.push({
      kind: "sourced_fact",
      topic: "valuation",
      text: "Cap-rate value indication uses accepted operating evidence where available; appraisal NOI is not substituted for T12 NOI.",
    });
  }
  if (appraisal && dispositionOf(appraisal) === "omit") {
    unresolved.push({
      topic: "appraisal",
      missing: "Accepted appraisal value or summary",
      whyItMatters: "Appraisal support is required to reconcile operating value indications to third-party valuation evidence.",
      documentNeeded: "Appraisal summary with accepted value basis",
    });
  }

  for (const [key, section] of Object.entries(sections)) {
    const d = dispositionOf(section);
    if (d === "include_qualified") {
      limitations.push({
        topic: key,
        text: `${section.visibleLabel || key} is included with qualification; see limitations and Quality Manifest.`,
      });
    }
  }

  return {
    version: "gate3_executive_underwriting_synthesis_v1",
    statements,
    limitations,
    unresolved,
    forbiddenContentPresent: false,
  };
}

export function buildUnresolvedQuestionsRegister({
  customerSurfaceModel = null,
  executiveSynthesis = null,
} = {}) {
  const items = [];
  const seen = new Set();
  const push = (item) => {
    const id = `${item.missing}|${item.documentNeeded}`;
    if (seen.has(id)) return;
    seen.add(id);
    items.push(item);
  };
  for (const u of executiveSynthesis?.unresolved || []) push(u);
  for (const [key, section] of Object.entries(customerSurfaceModel?.sections || {})) {
    const missing = Array.isArray(section?.missingFacts) ? section.missingFacts : [];
    const d = dispositionOf(section);
    if (missing.length && (d === "include_qualified" || d === "collapse" || d === "omit" || section?.status === "collapsed")) {
      for (const m of missing) {
        push({
          topic: key,
          missing: String(m),
          whyItMatters: `${section.visibleLabel || key} cannot present this fact without accepted source evidence.`,
          documentNeeded: `Source document that establishes ${m}`,
        });
      }
    }
  }
  return {
    version: "gate3_unresolved_questions_register_v1",
    items,
    empty: items.length === 0,
  };
}

export function buildDeterministicRiskRegister({
  customerSurfaceModel = null,
  financialIntelligence = null,
} = {}) {
  const signals = [];
  const recon =
    sectionOf(customerSurfaceModel, "coreReconciliation") ||
    financialIntelligence?.customerSections?.coreReconciliation;
  const variance = factDisplay(recon?.facts?.varianceRatioToT12Gpr ?? recon?.facts?.variance_ratio);
  if (variance != null && Number.isFinite(Number(variance)) && Math.abs(Number(variance)) > 0) {
    signals.push({
      condition: "T12 and Rent Roll reconciliation variance observed",
      sourceBasis: "coreReconciliation deterministic calculation",
      underwritingImplication: "Operating rent bases differ; coverage and capacity use accepted T12 NOI only.",
      requiredFollowUp: "Confirm which rent basis is authoritative for underwriting.",
    });
  }
  const dscrSection =
    sectionOf(customerSurfaceModel, "debtServiceCoverage") ||
    financialIntelligence?.customerSections?.debtServiceCoverage;
  const proposedDscr = factDisplay(dscrSection?.facts?.proposedFinancing?.dscr);
  if (proposedDscr != null && Number.isFinite(Number(proposedDscr)) && Number(proposedDscr) < 1.25) {
    signals.push({
      condition: `Proposed acquisition DSCR observed below 1.25x (${Number(proposedDscr).toFixed(2)}x)`,
      sourceBasis: "deterministic DSCR from accepted NOI and proposed debt service",
      underwritingImplication: "Coverage is thin relative to a common institutional coverage screen.",
      requiredFollowUp: "Confirm NOI basis and proposed debt service terms.",
    });
  }
  const debtTerms =
    sectionOf(customerSurfaceModel, "debtTermAnalysis") ||
    financialIntelligence?.customerSections?.debtTermAnalysis;
  if (debtTerms?.status === "collapsed" || dispositionOf(debtTerms) === "collapse") {
    signals.push({
      condition: "Debt maturity / term analysis not display-ready",
      sourceBasis: "debtTermAnalysis section disposition",
      underwritingImplication: "Maturity and rate-structure exposure cannot be certified from accepted inputs.",
      requiredFollowUp: "Provide current note terms including maturity date and rate structure.",
    });
  }
  const proposed = sectionOf(customerSurfaceModel, "proposedFinancingContext");
  if (!proposed || dispositionOf(proposed) === "omit" || dispositionOf(proposed) === "collapse") {
    signals.push({
      condition: "Proposed acquisition financing evidence missing or collapsed",
      sourceBasis: "proposedFinancingContext disposition",
      underwritingImplication: "Acquisition leverage metrics cannot be fully certified.",
      requiredFollowUp: "Provide purchase assumptions with proposed loan amount and terms.",
    });
  }
  const appraisal = sectionOf(customerSurfaceModel, "appraisalContext");
  if (!appraisal || dispositionOf(appraisal) === "omit") {
    signals.push({
      condition: "Appraisal support not present as accepted evidence",
      sourceBasis: "appraisalContext disposition",
      underwritingImplication: "Operating value indications cannot be reconciled to third-party appraisal.",
      requiredFollowUp: "Provide appraisal summary with accepted value basis.",
    });
  }
  const reno = sectionOf(customerSurfaceModel, "renovationContext") ||
    sectionOf(customerSurfaceModel, "capitalPlanAnalysis");
  if (reno && (dispositionOf(reno) === "collapse" || reno?.status === "collapsed")) {
    signals.push({
      condition: "Renovation / CapEx evidence collapsed",
      sourceBasis: "renovation or capital plan disposition",
      underwritingImplication: "Capital-plan claims are not treated as accepted underwriting inputs.",
      requiredFollowUp: "Provide structured CapEx / renovation schedule with accepted amounts.",
    });
  }
  const env = sectionOf(customerSurfaceModel, "environmentalContext");
  if (env && (dispositionOf(env) === "omit" || dispositionOf(env) === "collapse")) {
    signals.push({
      condition: "Environmental / diligence evidence omitted or collapsed",
      sourceBasis: "environmentalContext disposition",
      underwritingImplication: "Environmental risk cannot be assessed from accepted evidence.",
      requiredFollowUp: "Provide Phase I ESA or equivalent accepted environmental report.",
    });
  }
  return {
    version: "gate3_deterministic_risk_register_v1",
    signals,
    empty: signals.length === 0,
    severityInvented: false,
  };
}

export function buildMethodologyAssumptionsLimitationsChapter({
  customerSurfaceModel = null,
} = {}) {
  const dispositions = [];
  const sourcesUsed = [];
  const contextOnly = [];
  for (const [key, section] of Object.entries(customerSurfaceModel?.sections || {})) {
    const d = dispositionOf(section) || section?.status || "include";
    dispositions.push({
      sectionKey: key,
      disposition: d,
      classification: section?.classification || section?.sectionDisposition?.classification || null,
      disclosure: section?.sectionDisposition?.manifestDisclosure || section?.manifestDisclosure || null,
    });
    if (d === "omit" || d === "collapse") contextOnly.push(key);
    else sourcesUsed.push(key);
  }
  return {
    version: "gate3_methodology_assumptions_limitations_v1",
    principles: [
      "Source facts are accepted only from governed document authority.",
      "Deterministic calculations use locked formulas and collapse when operands are missing.",
      "Assumptions are shown only when accepted; unavailable assumptions remain null.",
      "Missing optional or analytical evidence produces qualification, collapse, or omission—not invention.",
      "Detailed machine lineage and UUIDs are excluded from primary customer cells and retained in the Quality Manifest.",
    ],
    dispositions,
    sourcesUsed,
    contextOnly,
    qualityManifestDispositionOutcomes: dispositions.filter((d) =>
      ["compact", "collapse", "omit", "include_qualified"].includes(String(d.disposition))
    ),
  };
}

function renderSynthesisHtml(synthesis) {
  if (!synthesis?.statements?.length && !synthesis?.limitations?.length) return "";
  const rows = (synthesis.statements || [])
    .map(
      (s) =>
        `<tr data-iq-synthesis-kind="${escapeHtml(s.kind)}"><td>${escapeHtml(s.topic)}</td><td>${escapeHtml(s.text)}</td></tr>`
    )
    .join("");
  const limits = (synthesis.limitations || [])
    .map((l) => `<li data-iq-limitation-topic="${escapeHtml(l.topic)}">${escapeHtml(l.text)}</li>`)
    .join("");
  return `<section class="section page-break" data-iq-section="executiveUnderwritingSynthesis"><div class="section-header"><span class="section-header-title">Executive Underwriting Synthesis</span></div><div class="card no-break"><p class="small" style="margin:0 0 8px 0;color:#374151;">This synthesis is limited to sourced facts, deterministic calculations, explicit limitations, and unresolved questions. It does not contain recommendations, BUY/SELL language, or an investment thesis.</p><table class="source-table" data-iq-disposition="include"><thead><tr><th>Topic</th><th>Governed finding</th></tr></thead><tbody>${rows}</tbody></table>${limits ? `<p class="subsection-title">Limitations</p><ul>${limits}</ul>` : ""}</div></section>`;
}

function renderUnresolvedHtml(register) {
  if (!register || register.empty) return "";
  const rows = register.items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.missing)}</td><td>${escapeHtml(i.whyItMatters)}</td><td>${escapeHtml(i.documentNeeded)}</td></tr>`
    )
    .join("");
  return `<section class="section" data-iq-section="unresolvedQuestionsRegister"><div class="section-header"><span class="section-header-title">Unresolved Underwriting Questions</span></div><div class="card no-break"><table class="source-table"><thead><tr><th>Missing or unresolved fact</th><th>Why it matters</th><th>Document needed</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderRiskHtml(register) {
  if (!register || register.empty) return "";
  const rows = register.signals
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.condition)}</td><td>${escapeHtml(s.sourceBasis)}</td><td>${escapeHtml(s.underwritingImplication)}</td><td>${escapeHtml(s.requiredFollowUp)}</td></tr>`
    )
    .join("");
  return `<section class="section" data-iq-section="deterministicRiskRegister"><div class="section-header"><span class="section-header-title">Risk Register: Observed Conditions</span></div><div class="card no-break"><p class="small" style="margin:0 0 8px 0;color:#374151;">Conditions are observed from governed evidence only. Severity is not invented.</p><table class="source-table"><thead><tr><th>Observed condition</th><th>Source basis</th><th>Underwriting implication</th><th>Required follow-up</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderMethodologyHtml(chapter) {
  if (!chapter) return "";
  const principles = (chapter.principles || []).map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  const disp = (chapter.qualityManifestDispositionOutcomes || [])
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.sectionKey)}</td><td>${escapeHtml(d.disposition)}</td><td>${escapeHtml(d.disclosure || "")}</td></tr>`
    )
    .join("");
  return `<section class="section page-break" data-iq-section="methodologyAssumptionsLimitations"><div class="section-header"><span class="section-header-title">Methodology, Assumptions Boundary, Limitations, and Source Register</span></div><div class="card no-break"><p class="subsection-title">Methodology</p><ul>${principles}</ul><p class="subsection-title">Disposition outcomes (Quality Manifest)</p><table class="source-table"><thead><tr><th>Section</th><th>Disposition</th><th>Disclosure</th></tr></thead><tbody>${disp || "<tr><td colspan=\"3\">No compact/collapse/omit outcomes recorded.</td></tr>"}</tbody></table><p class="footer-note">Detailed machine lineage remains in the Quality Manifest. Primary customer cells exclude raw UUIDs and parser receipts.</p></div></section>`;
}

export function buildGate3EliteUnderwritingCustomerBlocks({
  customerSurfaceModel = null,
  financialIntelligence = null,
} = {}) {
  const synthesis = buildExecutiveUnderwritingSynthesis({
    customerSurfaceModel,
    financialIntelligence,
  });
  const unresolved = buildUnresolvedQuestionsRegister({
    customerSurfaceModel,
    executiveSynthesis: synthesis,
  });
  const risk = buildDeterministicRiskRegister({
    customerSurfaceModel,
    financialIntelligence,
  });
  const methodology = buildMethodologyAssumptionsLimitationsChapter({
    customerSurfaceModel,
  });
  const html = [
    renderSynthesisHtml(synthesis),
    renderUnresolvedHtml(unresolved),
    renderRiskHtml(risk),
    renderMethodologyHtml(methodology),
  ]
    .filter(Boolean)
    .join("\n");
  return { synthesis, unresolved, risk, methodology, html };
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
    : `<p class="small" style="margin:0;color:#64748b;">${escapeHtml("Shown for lender discussion and underwriting diligence support only.")}</p>`;
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
  customerSurfaceModel = null,
  financialIntelligence = null,
} = {}) {
  const sourceHtml = String(html || "");
  if (!sourceHtml) return sourceHtml;

  const surfaceModel =
    customerSurfaceModel ||
    renderedAcquisitionMemo?.customerSurfaceModel ||
    renderedAcquisitionMemo?.customer_surface_model ||
    null;
  const fi =
    financialIntelligence ||
    renderedAcquisitionMemo?.financialIntelligence ||
    surfaceModel?.financialIntelligence ||
    null;

  const elite = buildGate3EliteUnderwritingCustomerBlocks({
    customerSurfaceModel: surfaceModel,
    financialIntelligence: fi,
  });

  let nextHtml = sourceHtml;
  nextHtml = nextHtml.replace(/Acquisition Memorandum/gi, "Underwriting Report");
  nextHtml = nextHtml.replace(/Acquisition Memo(?!randum)/gi, "Underwriting Report");

  if (elite.html && !/Executive Underwriting Synthesis/i.test(nextHtml)) {
    nextHtml = insertAfterOpeningBody(nextHtml, elite.html);
  }

  const readinessBlock = buildFinancingReadinessBlock(renderedAcquisitionMemo, acquisitionMemoProjection);
  const expectedCurrentDebtChecklistValue = acquisitionMemoProjection?.financingReadinessSignals?.hasCurrentDebtContext === true ? "Yes" : "No";
  const expectedCurrentDebtChecklistRowRe = new RegExp(
    `<td[^>]*>\\s*Current debt context uploaded\\s*<\\/td><td[^>]*>\\s*${expectedCurrentDebtChecklistValue}\\s*<\\/td>`,
    "i"
  );
  nextHtml = replaceAll(nextHtml, "{{PRELIMINARY_FINANCING_READINESS_SUMMARY_BLOCK}}", readinessBlock);
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
    const currentDebtChecklistRowRe = /<td[^>]*>\\s*Current debt context uploaded\\s*<\\/td><td[^>]*>[^<]*<\\/td>/i;
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
  if (documentTreatmentBlock && !(/Source Context \\/ Support Document Treatment/i.test(nextHtml) && /Debt Support Received \\/ Contextual/i.test(nextHtml))) {
    nextHtml = insertBeforeClosingBody(nextHtml, documentTreatmentBlock);
  }

  nextHtml = stripDuplicateV2DocumentTreatmentBlocks(nextHtml);
  return nextHtml;
}

export default {
  buildExecutiveUnderwritingSynthesis,
  buildUnresolvedQuestionsRegister,
  buildDeterministicRiskRegister,
  buildMethodologyAssumptionsLimitationsChapter,
  buildGate3EliteUnderwritingCustomerBlocks,
  applyAcquisitionMemoV2FinalAssembly,
};
