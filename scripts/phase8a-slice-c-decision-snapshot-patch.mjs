import fs from "node:fs";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, value) {
  fs.writeFileSync(filePath, value, "utf8");
}

function replaceExact(filePath, before, after) {
  const source = read(filePath);
  if (!source.includes(before)) throw new Error(`PHASE8A_SLICE_C_DECISION_EXACT_MISSING:${filePath}:${before.slice(0, 96)}`);
  write(filePath, source.replace(before, after));
}

function replaceRange(filePath, startMarker, endMarker, replacement) {
  const source = read(filePath);
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`PHASE8A_SLICE_C_DECISION_RANGE_MISSING:${filePath}:${startMarker}:${endMarker}`);
  }
  write(filePath, `${source.slice(0, start)}${replacement}\n\n${source.slice(end)}`);
}

// ---------------------------------------------------------------------------
// Screening: make page 2 the definitive decision cockpit and support the
// fourth locked disposition, INSUFFICIENT EVIDENCE.
// ---------------------------------------------------------------------------
const phase8aPath = "api/_lib/phase8a-owner-acceptance-authority.js";

replaceExact(
  phase8aPath,
  `function formatPercent(value, digits = 1) {\n  const n = ratio(value);\n  return n === null ? null : \`${"${(n * 100).toFixed(digits)}"}%\`;\n}`,
  `function formatPercent(value, digits = 1) {\n  const n = ratio(value);\n  return n === null ? null : \`${"${(n * 100).toFixed(digits)}"}%\`;\n}\n\nfunction formatMoney(value) {\n  const n = finite(value);\n  if (n === null) return "Not available";\n  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);\n}`
);

replaceExact(
  phase8aPath,
  `  } else if (incompleteCorePair) {\n    disposition = "HOLD";\n    reason = "Only one core operating source is available for this Screening.";\n    nextStep = \`Obtain the missing ${"${m.hasT12 ? \"Rent Roll\" : \"T12 operating statement\"}"} before full Underwriting.\`;`,
  `  } else if (incompleteCorePair) {\n    disposition = "INSUFFICIENT EVIDENCE";\n    reason = "Only one core operating source is available for this Screening.";\n    nextStep = \`Obtain the missing ${"${m.hasT12 ? \"Rent Roll\" : \"T12 operating statement\"}"} before full Underwriting.\`;`
);

replaceExact(
  phase8aPath,
  `function dispositionTone(disposition = "") {\n  if (disposition === "ADVANCE") return "advance";\n  if (disposition === "DO NOT ADVANCE") return "stop";\n  return "hold";\n}`,
  `function dispositionTone(disposition = "") {\n  if (disposition === "ADVANCE") return "advance";\n  if (disposition === "DO NOT ADVANCE") return "stop";\n  if (disposition === "INSUFFICIENT EVIDENCE") return "insufficient";\n  return "hold";\n}`
);

const screeningDisposition = `function screeningOperatingProfile(d = {}) {
  if (!d.hasT12 || !d.hasRentRoll) return "INSUFFICIENT EVIDENCE";
  if (
    (d.expenseRatio !== null && d.expenseRatio >= 0.65) ||
    (d.noiMargin !== null && d.noiMargin <= 0.30) ||
    (d.breakEvenOccupancy !== null && d.breakEvenOccupancy >= 0.95)
  ) return "OPERATING PRESSURE";
  if (
    d.rentGapRatio !== null && d.rentGapRatio >= 0.05 &&
    d.noiMargin !== null && d.noiMargin >= 0.45 &&
    d.occupancy !== null && d.occupancy >= 0.90
  ) return "LIGHT VALUE-ADD CANDIDATE";
  return "STABILIZED";
}

function screeningReadinessLabel(d = {}) {
  if (d.disposition === "ADVANCE") return "READY FOR FULL UNDERWRITING";
  if (d.disposition === "DO NOT ADVANCE") return "DO NOT PROGRESS";
  if (d.disposition === "INSUFFICIENT EVIDENCE") return "NOT ENOUGH CORE EVIDENCE";
  return "BLOCKED ON CURRENT GATE";
}

function screeningSnapshotCell(label, value) {
  return \`<td><span>\${escapeHtml(label)}</span><strong>\${escapeHtml(value || "Not available")}</strong></td>\`;
}

function screeningPanel(label, items = []) {
  const valid = items.filter(Boolean);
  if (!valid.length) return "";
  return \`<div class="phase8a-screening-action-panel"><p>\${escapeHtml(label)}</p><ul>\${valid.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("")}</ul></div>\`;
}

function injectScreeningDisposition(html = "", sourceTruthPackage = null) {
  const source = String(html || "");
  if (!source || source.includes('data-iq-phase8a-screening-disposition="true"')) return source;
  const d = buildScreeningDisposition(sourceTruthPackage);
  const tone = dispositionTone(d.disposition);
  const operatingProfile = screeningOperatingProfile(d);
  const readiness = screeningReadinessLabel(d);
  const grossRentDifference = d.annualMarket !== null && d.annualInPlace !== null
    ? d.annualMarket - d.annualInPlace
    : null;
  const cushion = d.occupancy !== null && d.breakEvenOccupancy !== null
    ? \`${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)} pp\`
    : "Not available";
  const sourceVariance = d.reconciliationVariance !== null
    ? formatPercent(d.reconciliationVariance, 1)
    : "Not available";

  const whyItMayWork = [
    d.occupancy !== null ? \`Occupancy is \${formatPercent(d.occupancy)}.\` : null,
    d.noiMargin !== null ? \`NOI margin is \${formatPercent(d.noiMargin)}.\` : null,
    grossRentDifference !== null && grossRentDifference > 0
      ? \`Rent Roll market rent exceeds in-place rent by \${formatMoney(grossRentDifference)} annually.\`
      : null,
  ];
  const killOrHold = [
    d.reconciliationMaterial ? \`T12 and Rent Roll income bases differ by \${formatPercent(Math.abs(d.reconciliationVariance), 1)}.\` : null,
    d.expenseRatio !== null && d.expenseRatio >= 0.55 ? \`Expense ratio is \${formatPercent(d.expenseRatio)}.\` : null,
    !d.hasT12 || !d.hasRentRoll ? "A core operating source is missing." : null,
  ];

  let next = source.replace(
    /(<div class="cover-verdict-value[^>]*>)[\\s\\S]*?(<\\/div>)/i,
    \`$1\${escapeHtml(d.disposition)}$2<div class="phase8a-cover-reason">\${escapeHtml(d.nextStep)}</div>\`
  );

  const rows = [
    [
      screeningSnapshotCell("Units", d.units !== null ? Math.round(d.units).toLocaleString("en-US") : "Not available"),
      screeningSnapshotCell("Occupancy", formatPercent(d.occupancy)),
      screeningSnapshotCell("T12 NOI", formatMoney(d.noi)),
    ],
    [
      screeningSnapshotCell("NOI Margin", formatPercent(d.noiMargin)),
      screeningSnapshotCell("Expense Ratio", formatPercent(d.expenseRatio)),
      screeningSnapshotCell("Break-Even Occupancy", formatPercent(d.breakEvenOccupancy)),
    ],
    [
      screeningSnapshotCell("Annual In-Place Rent", formatMoney(d.annualInPlace)),
      screeningSnapshotCell("Annual Market Rent", formatMoney(d.annualMarket)),
      screeningSnapshotCell("Gross Rent Gap", grossRentDifference !== null ? \`${formatMoney(grossRentDifference)} / \${formatPercent(d.rentGapRatio)}\` : "Not available"),
    ],
    [
      screeningSnapshotCell("T12 Gross Potential Rent", formatMoney(d.gpr)),
      screeningSnapshotCell("Rent Roll Annual In-Place", formatMoney(d.annualInPlace)),
      screeningSnapshotCell("Rent Roll vs T12 Variance", sourceVariance),
    ],
  ].map((cells) => \`<tr>\${cells.join("")}</tr>\`).join("");

  const profileRows = [
    ["Operating Strength", d.operatingStrength],
    ["Rent Position", d.rentPosition],
    ["Source Consistency", d.sourceConsistency],
    ["Operating Cushion", cushion],
    ["Diligence Burden", d.diligenceBurden],
    ["Underwriting Readiness", readiness],
  ].map(([label, value]) => \`<div class="phase8a-screening-profile-item"><span>\${escapeHtml(label)}</span><strong>\${escapeHtml(value || "Not available")}</strong></div>\`).join("");

  const newVerdict = \`<div class="verdict-block phase8a-screening-snapshot" data-iq-phase8a-screening-disposition="true" data-iq-disposition="\${tone}">
    <div class="phase8a-screening-decision-band">
      <div class="phase8a-screening-decision-main"><span>Screening Decision Snapshot</span><strong>\${escapeHtml(d.disposition)}</strong><p>\${escapeHtml(d.reason)}</p></div>
      <div class="phase8a-screening-decision-side"><span>Operating Profile</span><strong>\${escapeHtml(operatingProfile)}</strong><span>Next Action</span><b>\${escapeHtml(d.nextStep)}</b></div>
    </div>
    <table class="phase8a-screening-snapshot-table"><tbody>\${rows}</tbody></table>
    <div class="phase8a-screening-profile-strip">\${profileRows}</div>
    <div class="phase8a-screening-actions">
      \${screeningPanel("Why It May Work", whyItMayWork)}
      \${screeningPanel("What Can Kill or Hold It", killOrHold.length ? killOrHold : [d.reason])}
      \${screeningPanel("Next Action", [d.nextStep])}
    </div>
  </div>\`;

  next = next.replace(
    /<div class="verdict-block">[\\s\\S]*?<div class="verdict-rationale">[\\s\\S]*?<\\/div>\\s*<\\/div>/i,
    newVerdict
  );

  next = next
    .replace(/Decision Status:\\s*Metrics Aligned/gi, "Operating Threshold Status: Metrics Aligned")
    .replace(/Review\\s*-\\s*Source Reconciliation Disclosure/gi, "Hold: Reconciliation Required")
    .replace(/Classification is capped by source reconciliation disclosure pending reconciliation of rent roll and T12 evidence\\./gi, "The Screening disposition remains on hold until the T12 and Rent Roll income bases are reconciled.");

  return next;
}`;
replaceRange(phase8aPath, "function injectScreeningDisposition(html = \"\", sourceTruthPackage = null) {", "function buildScreeningDecisionProfile(sourceTruthPackage = null) {", screeningDisposition);

replaceExact(
  phase8aPath,
  `    screeningDispositionValues: ["ADVANCE", "HOLD", "DO NOT ADVANCE"],`,
  `    screeningDispositionValues: ["ADVANCE", "HOLD", "DO NOT ADVANCE", "INSUFFICIENT EVIDENCE"],`
);

const decisionPublishingCss = `/* Phase 8A decision-first editorial cockpit and Prince paged-media authority. */
.iq-phase8a-screening .phase8a-screening-snapshot { margin:0; padding:0; border:0; background:#fff; }
.iq-phase8a-screening .phase8a-screening-decision-band { display:grid; grid-template-columns:1.7fr .9fr; gap:18px; margin:0 0 12px; padding:14px 16px; background:var(--iq8a-forest-deep); color:#fff; }
.iq-phase8a-screening .phase8a-screening-decision-main span,
.iq-phase8a-screening .phase8a-screening-decision-side span { display:block; color:#d6c484; font-size:6.4pt; font-weight:700; letter-spacing:.11em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-decision-main strong { display:block; margin:3px 0 5px; color:#fff; font-family:var(--font-display); font-size:24pt; line-height:1; }
.iq-phase8a-screening .phase8a-screening-decision-main p { margin:0; color:#edf1ee; font-size:8pt; line-height:1.35; }
.iq-phase8a-screening .phase8a-screening-decision-side { padding-left:14px; border-left:1px solid rgba(255,255,255,.22); }
.iq-phase8a-screening .phase8a-screening-decision-side strong { display:block; margin:3px 0 10px; color:#fff; font-size:10pt; line-height:1.2; }
.iq-phase8a-screening .phase8a-screening-decision-side b { display:block; margin-top:3px; color:#fff; font-size:7.5pt; line-height:1.3; font-weight:500; }
.iq-phase8a-screening .phase8a-screening-snapshot-table { margin:0; table-layout:fixed; border-top:1px solid var(--iq8a-rule); }
.iq-phase8a-screening .phase8a-screening-snapshot-table td { width:33.333%; padding:7px 8px 7px 0; border-bottom:1px solid var(--iq8a-rule); background:#fff !important; }
.iq-phase8a-screening .phase8a-screening-snapshot-table td span { display:block; color:#777f79; font-size:5.8pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-snapshot-table td strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:12pt; line-height:1.05; }
.iq-phase8a-screening .phase8a-screening-profile-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 12px; margin-top:10px; }
.iq-phase8a-screening .phase8a-screening-profile-item { padding:5px 0; border-bottom:1px solid #ece9e1; }
.iq-phase8a-screening .phase8a-screening-profile-item span { display:block; color:#7a817c; font-size:5.7pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-profile-item strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-size:7.5pt; line-height:1.25; }
.iq-phase8a-screening .phase8a-screening-actions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:11px; }
.iq-phase8a-screening .phase8a-screening-action-panel { padding-top:7px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8a-screening .phase8a-screening-action-panel p { margin:0 0 4px; color:#69716c; font-size:6pt; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }
.iq-phase8a-screening .phase8a-screening-action-panel ul { margin:0; padding-left:14px; }
.iq-phase8a-screening .phase8a-screening-action-panel li { margin-bottom:3px; font-size:7pt; line-height:1.3; }
.iq-phase8a-screening .phase8a-screening-snapshot[data-iq-disposition="insufficient"] .phase8a-screening-decision-band { background:#4c5350; }

@page iq-body {
  size: Letter;
  margin: .46in .52in .56in .52in;
  @top-left { content: "INVESTORIQ"; font-family:'DM Sans',sans-serif; font-size:6pt; font-weight:700; letter-spacing:.08em; color:#173f2b; }
  @top-right { content: string(iq-section, first); font-family:'DM Sans',sans-serif; font-size:6pt; color:#737b76; }
  @bottom-left { content: string(iq-property, first); font-family:'DM Sans',sans-serif; font-size:5.8pt; color:#8a8f8b; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family:'DM Mono',monospace; font-size:5.8pt; color:#8a8f8b; }
}
@page iq-decision {
  size: Letter;
  margin: .40in .52in .54in .52in;
  @top-left { content: "INVESTORIQ  |  DECISION SNAPSHOT"; font-family:'DM Sans',sans-serif; font-size:6pt; font-weight:700; letter-spacing:.07em; color:#173f2b; }
  @top-right { content: string(iq-property, first); font-family:'DM Sans',sans-serif; font-size:6pt; color:#737b76; }
  @bottom-left { content: "DECISION FIRST. FACTS BEFORE PROSE."; font-family:'DM Sans',sans-serif; font-size:5.6pt; color:#8a8f8b; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family:'DM Mono',monospace; font-size:5.8pt; color:#8a8f8b; }
}
.iq-phase8a .cover-prop-name { string-set: iq-property content(); }
.iq-phase8a .section { page: iq-body; }
.iq-phase8a .section-header-title { string-set: iq-section content(); -prince-bookmark-level:1; -prince-bookmark-label:content(); }
.iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] { page:iq-decision; break-before:page; break-after:page; }
.iq-phase8a table thead { display:table-header-group; }
.iq-phase8a table tfoot { display:table-footer-group; }
.iq-phase8a table tr { break-inside:avoid; page-break-inside:avoid; }
.iq-phase8a p, .iq-phase8a li { widows:2; orphans:2; }
.iq-phase8a .section-header, .iq-phase8a .subsection-title { break-after:avoid-page; page-break-after:avoid; }
`;
replaceExact(phase8aPath, `/* Underwriting executive decision page. */`, `${decisionPublishingCss}\n/* Underwriting executive decision page. */`);

replaceExact(
  phase8aPath,
  `.iq-phase8a-underwriting .phase8a-executive-summary { padding:12px 14px !important; }`,
  `.iq-phase8a-underwriting .phase8a-executive-summary { padding:0 !important; border-top:0 !important; }`
);

const underwritingSnapshotCss = `.iq-phase8a-underwriting .phase8a-investment-decision-band { display:grid; grid-template-columns:1.45fr .8fr .9fr; gap:0; margin:0 0 11px; background:var(--iq8a-forest-deep); color:#fff; }
.iq-phase8a-underwriting .phase8a-investment-decision-band > div { min-width:0; padding:12px 14px; }
.iq-phase8a-underwriting .phase8a-investment-decision-band > div + div { border-left:1px solid rgba(255,255,255,.2); }
.iq-phase8a-underwriting .phase8a-investment-decision-band span { display:block; color:#d6c484; font-size:5.9pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.iq-phase8a-underwriting .phase8a-investment-decision-band strong { display:block; margin-top:3px; color:#fff; font-family:var(--font-display); font-size:16pt; line-height:1.02; }
.iq-phase8a-underwriting .phase8a-investment-decision-band p { margin:4px 0 0; color:#eef1ef; font-size:6.7pt; line-height:1.28; }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table { margin:0; table-layout:fixed; border-top:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td { width:25%; padding:6px 7px 6px 0; background:#fff !important; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td span { display:block; color:#767f79; font-size:5.5pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase; }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td strong { display:block; margin-top:2px; color:var(--iq8a-ink); font-family:var(--font-display); font-size:10.7pt; line-height:1.05; }
.iq-phase8a-underwriting .phase8a-investment-snapshot-table td em { display:block; margin-top:2px; color:#7a817c; font-size:5.4pt; font-style:normal; line-height:1.2; }
.iq-phase8a-underwriting .phase8a-exec-columns { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:10px; }
.iq-phase8a-underwriting .phase8a-exec-panel { padding-top:7px; border-top:2px solid var(--iq8a-forest); }
.iq-phase8a-underwriting .phase8a-exec-panel li { margin-bottom:3px; font-size:6.7pt; line-height:1.28; }
.iq-phase8a-underwriting .phase8a-exec-boundary { margin-top:6px; font-size:5.7pt; line-height:1.25; }
`;
replaceExact(phase8aPath, `/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */`, `${underwritingSnapshotCss}\n/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */`);

// ---------------------------------------------------------------------------
// Underwriting contract: carry evidence-bound capital/appraisal facts onto the
// decision page without changing source truth or recommendation authority.
// ---------------------------------------------------------------------------
const contractPath = "api/_lib/full-underwriting-chapter1-elite-contract.js";
const decisionContextHelper = `function buildPhase8ADecisionSnapshotContext(customerSurfaceModel = null, metrics = {}) {
  const renovationSection = customerSurfaceModel?.sections?.renovationContext || null;
  const renovationFacts = renovationSection?.factAvailability?.sourceBacked === true
    ? renovationSection?.facts || {}
    : {};
  const planRows = Array.isArray(renovationFacts.renovation_plan_rows)
    ? renovationFacts.renovation_plan_rows
    : [];
  let plannedInteriorUnits = 0;
  let documentedAnnualGrossRentLift = 0;
  for (const row of planRows) {
    const unitCount = finite(row?.unit_count);
    const monthlyLift = finite(row?.expected_monthly_rent_lift);
    if (unitCount !== null && unitCount > 0) plannedInteriorUnits += unitCount;
    if (unitCount !== null && unitCount > 0 && monthlyLift !== null && monthlyLift > 0) {
      documentedAnnualGrossRentLift += unitCount * monthlyLift * 12;
    }
  }
  const totalCapitalBudget = finite(renovationFacts.total_renovation_budget);
  const planDurationMonths = finite(renovationFacts.capital_plan_duration_months);
  const totalUnits = metrics?.units?.displayReady === true ? finite(metrics.units.value) : null;
  const purchasePrice = metrics?.purchasePrice?.displayReady === true ? finite(metrics.purchasePrice.value) : null;
  const proposedLoan = metrics?.proposedLoanAmount?.displayReady === true ? finite(metrics.proposedLoanAmount.value) : null;
  const proposedLtv = metrics?.proposedLtv?.displayReady === true ? finite(metrics.proposedLtv.value) : null;
  const plannedUnitShare = totalUnits && plannedInteriorUnits > 0 ? plannedInteriorUnits / totalUnits : null;
  const budgetToPurchasePrice = purchasePrice && totalCapitalBudget ? totalCapitalBudget / purchasePrice : null;

  const appraisalSection = customerSurfaceModel?.sections?.appraisalContext || null;
  const appraisalFacts = appraisalSection?.factAvailability?.sourceBacked === true
    ? appraisalSection?.facts || {}
    : {};
  const appraisalValue = finite(appraisalFacts.appraisal_value);
  const appraisalStabilizedNoi = finite(appraisalFacts.stabilized_noi);
  const appraisalStabilizedCapRate = normalizeRatio(appraisalFacts.stabilized_cap_rate);

  const strategyEvidenceReady = Boolean(
    purchasePrice && proposedLoan && proposedLtv !== null &&
    totalCapitalBudget && plannedInteriorUnits > 0 && documentedAnnualGrossRentLift > 0 &&
    totalUnits && totalUnits > 0
  );
  let strategyFit = "INSUFFICIENT EVIDENCE";
  if (strategyEvidenceReady) {
    strategyFit = budgetToPurchasePrice !== null && budgetToPurchasePrice <= 0.15 && plannedUnitShare !== null && plannedUnitShare <= 0.70
      ? "LIGHT VALUE-ADD HOLD"
      : "MAJOR VALUE-ADD / REPOSITION";
  }

  return {
    evidenceBound: true,
    strategyEvidenceReady,
    strategyFit,
    totalCapitalBudget: totalCapitalBudget ?? null,
    plannedInteriorUnits: plannedInteriorUnits > 0 ? plannedInteriorUnits : null,
    plannedUnitShare,
    documentedAnnualGrossRentLift: documentedAnnualGrossRentLift > 0 ? documentedAnnualGrossRentLift : null,
    planDurationMonths: planDurationMonths ?? null,
    budgetToPurchasePrice,
    appraisalValue: appraisalValue ?? null,
    appraisalStabilizedNoi: appraisalStabilizedNoi ?? null,
    appraisalStabilizedCapRate: appraisalStabilizedCapRate ?? null,
  };
}`;
replaceExact(contractPath, `export function buildFullUnderwritingChapter1EliteContract({`, `${decisionContextHelper}\n\nexport function buildFullUnderwritingChapter1EliteContract({`);
replaceExact(
  contractPath,
  `  const primary = primaryConstraint(surfaces.risks);`,
  `  const primary = primaryConstraint(surfaces.risks);\n  const decisionSnapshotContext = buildPhase8ADecisionSnapshotContext(customerSurfaceModel, metrics);`
);
replaceExact(
  contractPath,
  `    identity,\n    metrics,`,
  `    identity,\n    decisionSnapshotContext,\n    metrics,`
);

// ---------------------------------------------------------------------------
// Underwriting page 2: replace card-dashboard composition with an editorial
// decision band, dense fact table, and compact action panels.
// ---------------------------------------------------------------------------
const chapter1Path = "api/_lib/full-underwriting-chapter1-elite-renderer.js";
const executiveSnapshotRenderer = `function snapshotDisplayValue(value, units = "") {
  const n = finite(value);
  if (n === null) return "Not available";
  if (units === "currency") return formatMoney(n);
  if (units === "ratio") return formatPercent(n, 1);
  if (units === "ratio_x") return \`${n.toFixed(2)}x\`;
  if (units === "count") return Math.round(n).toLocaleString("en-US");
  if (units === "months") return \`${Math.round(n)} months\`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function snapshotMetricValue(contract, key) {
  const receipt = executiveMetric(contract, key);
  return receipt ? formatMetricValue(receipt) : "Not available";
}

function snapshotCell(label, value, note = "") {
  return \`<td><span>\${escapeHtml(label)}</span><strong>\${escapeHtml(value || "Not available")}</strong>\${note ? \`<em>\${escapeHtml(note)}</em>\` : ""}</td>\`;
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
  const context = contract?.decisionSnapshotContext || {};
  const strategyFit = String(context?.strategyFit || "INSUFFICIENT EVIDENCE");
  const noi = executiveMetric(contract, "noi");
  const proposedLoan = executiveMetric(contract, "proposedLoanAmount");
  const debtYield = noi && proposedLoan && finite(proposedLoan.value) > 0
    ? finite(noi.value) / finite(proposedLoan.value)
    : null;

  const capitalUnitCoverage = finite(context?.plannedInteriorUnits) !== null && executiveMetric(contract, "units")
    ? \`${snapshotDisplayValue(context.plannedInteriorUnits, "count")} of \${snapshotMetricValue(contract, "units")} units\`
    : "Not available";
  const appraisalPremium = finite(context?.appraisalValue) !== null && executiveMetric(contract, "purchasePrice")
    ? finite(context.appraisalValue) - finite(executiveMetric(contract, "purchasePrice").value)
    : null;

  const rows = [
    [
      snapshotCell("Purchase Price", snapshotMetricValue(contract, "purchasePrice"), "Transaction basis"),
      snapshotCell("Price / Unit", snapshotMetricValue(contract, "pricePerUnit"), "Calculated from units"),
      snapshotCell("T12 NOI", snapshotMetricValue(contract, "noi"), "Current operating basis"),
      snapshotCell("Occupancy", snapshotMetricValue(contract, "occupancy"), "Rent Roll basis"),
    ],
    [
      snapshotCell("Going-In Cap Rate", snapshotMetricValue(contract, "goingInCapRate"), "Stated transaction input"),
      snapshotCell("Appraised Value Context", snapshotDisplayValue(context?.appraisalValue, "currency"), appraisalPremium !== null ? \`${formatMoney(appraisalPremium)} vs purchase price\` : "Third-party context"),
      snapshotCell("Proposed Loan", snapshotMetricValue(contract, "proposedLoanAmount"), "Acquisition financing"),
      snapshotCell("Proposed LTV", snapshotMetricValue(contract, "proposedLtv"), "Stated financing input"),
    ],
    [
      snapshotCell("Current DSCR", snapshotMetricValue(contract, "currentDebtDscr"), "Existing debt context"),
      snapshotCell("Proposed DSCR", snapshotMetricValue(contract, "proposedFinancingDscr"), "Stated proposed terms"),
      snapshotCell("Proposed Debt Yield", debtYield !== null ? formatPercent(debtYield, 1) : "Not available", "T12 NOI / proposed loan"),
      snapshotCell("Gross Rent Gap", snapshotMetricValue(contract, "annualGrossRentDifference"), snapshotMetricValue(contract, "annualGrossRentGapRatio")),
    ],
    [
      snapshotCell("Capital Program", snapshotDisplayValue(context?.totalCapitalBudget, "currency"), context?.planDurationMonths ? snapshotDisplayValue(context.planDurationMonths, "months") : "Document-stated budget"),
      snapshotCell("Interior Units in Program", capitalUnitCoverage, context?.plannedUnitShare !== null && context?.plannedUnitShare !== undefined ? formatPercent(context.plannedUnitShare, 1) : "Document-stated scope"),
      snapshotCell("Documented Annual Gross Rent Lift", snapshotDisplayValue(context?.documentedAnnualGrossRentLift, "currency"), "Gross rent arithmetic, not NOI"),
      snapshotCell("NOI / Purchase Price", snapshotMetricValue(contract, "noiToPurchasePriceCapRate"), "Consistency view"),
    ],
  ].map((cells) => \`<tr>\${cells.join("")}</tr>\`).join("");

  const primaryText = primary?.statement ? customerCopy(primary.statement) : "No evidence-triggered primary gate is established.";
  const killItems = [
    primary?.statement ? primaryText : null,
    executiveMetric(contract, "proposedFinancingDscr") && executiveMetric(contract, "currentDebtDscr")
      ? \`Proposed financing tightens coverage from \${snapshotMetricValue(contract, "currentDebtDscr")} to \${snapshotMetricValue(contract, "proposedFinancingDscr")}.\`
      : null,
    context?.strategyEvidenceReady !== true ? "Strategy fit remains insufficiently evidenced by the current support package." : null,
  ].filter(Boolean).slice(0, 3);

  const thesisHtml = thesisPoints.length
    ? \`<div class="phase8a-exec-panel"><p class="subsection-title">Investment Thesis</p><ul>\${thesisPoints.map((point) => \`<li>\${escapeHtml(point)}</li>\`).join("")}</ul></div>\`
    : "";
  const killHtml = killItems.length
    ? \`<div class="phase8a-exec-panel"><p class="subsection-title">What Can Kill or Reprice It</p><ul>\${killItems.map((point) => \`<li>\${escapeHtml(point)}</li>\`).join("")}</ul></div>\`
    : "";
  const conditionsHtml = conditions.length
    ? \`<div class="phase8a-exec-panel"><p class="subsection-title">What Must Be True</p><ul>\${conditions.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("")}</ul></div>\`
    : "";

  return renderSection({
    title: "Investment Decision Snapshot",
    sectionKey: "executiveInvestmentSummary",
    disposition,
    bodyHtml: \`<div class="phase8a-investment-decision-band">
        <div><span>Current Decision State</span><strong>\${escapeHtml(decisionState)}</strong><p>\${escapeHtml(primary?.title || "Evidence-bound underwriting review")}</p></div>
        <div><span>Strategy Fit</span><strong>\${escapeHtml(strategyFit)}</strong><p>Only source-supported transaction, capital, and debt facts may establish this label.</p></div>
        <div><span>Asset</span><strong>\${escapeHtml(propertyName)}</strong>\${assetDescriptor ? \`<p>\${escapeHtml(assetDescriptor)}</p>\` : ""}</div>
      </div>
      <table class="phase8a-investment-snapshot-table"><tbody>\${rows}</tbody></table>
      <div class="phase8a-exec-columns">\${thesisHtml}\${killHtml}\${conditionsHtml}</div>
      <p class="phase8a-exec-boundary">Decision first. Facts before prose. Scenario cases and detailed source treatment remain in the sections that follow.</p>\`,
    legacySectionLabel: "Executive Summary",
    bodyClass: "iq-ic-summary-card phase8a-executive-summary",
  });
}`;
replaceRange(chapter1Path, "function renderExecutiveInvestmentSummary(contract) {", "const KEY_METRIC_ORDER = Object.freeze([", executiveSnapshotRenderer);

// Keep the inherited owner-acceptance smoke aligned with the newly locked
// four-state Screening doctrine.
const authoritySmokePath = "tests/qa/phase8a-owner-acceptance-authority-smoke.js";
replaceExact(
  authoritySmokePath,
  `assert.deepEqual(metadata.screeningDispositionValues, ["ADVANCE", "HOLD", "DO NOT ADVANCE"]);`,
  `assert.deepEqual(metadata.screeningDispositionValues, ["ADVANCE", "HOLD", "DO NOT ADVANCE", "INSUFFICIENT EVIDENCE"]);`
);

console.log("phase8a-slice-c-decision-snapshot-patch: PATCHED");
