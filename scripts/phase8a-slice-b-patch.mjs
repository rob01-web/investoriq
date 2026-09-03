import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function write(rel, value) {
  fs.writeFileSync(path.join(root, rel), value, "utf8");
}
function replaceRange(rel, startNeedle, endNeedle, replacement) {
  const source = read(rel);
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`PHASE8A_SLICE_B_SEAM_MISSING:${rel}`);
  }
  const next = source.slice(0, start) + replacement + "\n\n" + source.slice(end);
  write(rel, next);
}
function replaceExact(rel, before, after, expected = 1) {
  const source = read(rel);
  const count = source.split(before).length - 1;
  if (count !== expected) throw new Error(`PHASE8A_SLICE_B_EXACT_SEAM:${rel}:expected=${expected}:actual=${count}`);
  write(rel, source.split(before).join(after));
}

const renderer = "api/_lib/full-underwriting-chapter1-elite-renderer.js";
const executiveBlock = `function executiveMetric(contract, key) {
  const receipt = contract?.metrics?.[key];
  return receipt?.displayReady === true ? receipt : null;
}

function renderExecutiveMetric(contract, key, label = null) {
  const receipt = executiveMetric(contract, key);
  if (!receipt) return "";
  return \`<div class="phase8a-exec-metric" data-iq-phase8a-exec-metric="\${escapeHtml(key)}"><span>\${escapeHtml(label || receipt.label || key)}</span><strong>\${escapeHtml(formatMetricValue(receipt))}</strong></div>\`;
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
    points.push(\`Current operations show \${formatMetricValue(occupancy)} occupancy and a \${formatMetricValue(noiMargin)} NOI margin.\`);
  }
  if (purchasePrice && goingInCapRate) {
    points.push(\`The transaction is presented at \${formatMetricValue(purchasePrice)} with a \${formatMetricValue(goingInCapRate)} going-in cap rate.\`);
  }
  if (grossRentDifference) {
    points.push(\`The Rent Roll documents \${formatMetricValue(grossRentDifference)} of annual gross rent difference versus market rent. This is rent evidence, not NOI.\`);
  }
  if (currentDscr && proposedDscr) {
    const current = finite(currentDscr.value);
    const proposed = finite(proposedDscr.value);
    const change = current !== null && proposed !== null ? current - proposed : null;
    points.push(change !== null && change > 0
      ? \`Proposed financing tightens DSCR from \${formatMetricValue(currentDscr)} currently to \${formatMetricValue(proposedDscr)}, a \${change.toFixed(2)}x reduction in coverage.\`
      : \`Current and proposed debt coverage are \${formatMetricValue(currentDscr)} and \${formatMetricValue(proposedDscr)}, respectively.\`);
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
      conditions.push(question.replace(/\?$/, "."));
    }
  }

  const proposedDscr = executiveMetric(contract, "proposedFinancingDscr");
  if (proposedDscr) {
    conditions.push(\`Proposed financing terms must remain acceptable after lender diligence; modeled DSCR at the stated terms is \${formatMetricValue(proposedDscr)}.\`);
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
    ? \`<div class="phase8a-exec-panel"><p class="subsection-title">Investment Thesis</p><ul>\${thesisPoints.map((point) => \`<li>\${escapeHtml(point)}</li>\`).join("")}</ul></div>\`
    : "";
  const conditionsHtml = conditions.length
    ? \`<div class="phase8a-exec-panel"><p class="subsection-title">What Must Be True</p><ul>\${conditions.map((item) => \`<li>\${escapeHtml(item)}</li>\`).join("")}</ul></div>\`
    : "";

  const primaryHtml = primary?.statement
    ? \`<div class="phase8a-exec-gate"><span>Primary Decision Gate</span><strong>\${escapeHtml(primary?.title || "Diligence item")}</strong><p>\${escapeHtml(customerCopy(primary.statement))}</p>\${primary?.investorImpact ? \`<p><b>Why it matters:</b> \${escapeHtml(customerCopy(primary.investorImpact))}</p>\` : ""}</div>\`
    : "";

  return renderSection({
    title: "Executive Investment Summary",
    sectionKey: "executiveInvestmentSummary",
    disposition,
    bodyHtml: \`<div class="phase8a-exec-header"><div><p class="phase8a-exec-property">\${escapeHtml(propertyName)}</p>\${assetDescriptor ? \`<p class="phase8a-exec-asset">\${escapeHtml(assetDescriptor)}</p>\` : ""}</div><div class="phase8a-exec-state"><span>Current Decision State</span><strong>\${escapeHtml(decisionState)}</strong></div></div>
      \${metricsHtml ? \`<div class="phase8a-exec-metrics">\${metricsHtml}</div>\` : ""}
      \${primaryHtml}
      <div class="phase8a-exec-columns">\${thesisHtml}\${conditionsHtml}</div>
      <p class="phase8a-exec-boundary">This page frames the current underwriting decision from the documents provided. Scenario cases and detailed source treatment appear in the sections that follow.</p>\`,
    legacySectionLabel: "Executive Summary",
    bodyClass: "iq-ic-summary-card phase8a-executive-summary",
  });
}`;

replaceRange(renderer, "function renderExecutiveInvestmentSummary(contract) {", "const KEY_METRIC_ORDER = Object.freeze([", executiveBlock);

const authority = "api/_lib/phase8a-owner-acceptance-authority.js";
replaceExact(
  authority,
  `/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */`,
  `/* Underwriting executive decision page. */
.iq-phase8a-underwriting .phase8a-executive-summary { padding:12px 14px !important; }
.iq-phase8a-underwriting .phase8a-exec-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:9px; border-bottom:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-exec-property { margin:0; font-family:var(--font-display); font-size:20pt; line-height:1; color:var(--iq8a-ink); }
.iq-phase8a-underwriting .phase8a-exec-asset { margin:4px 0 0; color:var(--iq8a-muted); font-size:8pt; }
.iq-phase8a-underwriting .phase8a-exec-state { max-width:2.45in; padding:7px 10px; border-left:3px solid var(--iq8a-gold); background:var(--iq8a-paper); }
.iq-phase8a-underwriting .phase8a-exec-state span { display:block; color:#7a817c; font-size:6.5pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:3px; }
.iq-phase8a-underwriting .phase8a-exec-state strong { display:block; color:var(--iq8a-forest-deep); font-size:10pt; line-height:1.25; }
.iq-phase8a-underwriting .phase8a-exec-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; margin:10px 0; }
.iq-phase8a-underwriting .phase8a-exec-metric { min-width:0; padding:7px 8px; border:1px solid var(--iq8a-rule); background:#fff; }
.iq-phase8a-underwriting .phase8a-exec-metric span { display:block; color:#7a817c; font-size:6pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-bottom:2px; }
.iq-phase8a-underwriting .phase8a-exec-metric strong { display:block; color:var(--iq8a-ink); font-family:var(--font-display); font-size:13pt; line-height:1.1; }
.iq-phase8a-underwriting .phase8a-exec-gate { margin:9px 0; padding:8px 10px; border-left:3px solid var(--iq8a-gold); background:#fbfaf6; }
.iq-phase8a-underwriting .phase8a-exec-gate > span { display:block; color:#7a817c; font-size:6.5pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.iq-phase8a-underwriting .phase8a-exec-gate > strong { display:block; margin:2px 0 3px; color:var(--iq8a-ink); font-size:9pt; }
.iq-phase8a-underwriting .phase8a-exec-gate p { margin:2px 0; font-size:8pt; line-height:1.35; }
.iq-phase8a-underwriting .phase8a-exec-columns { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.iq-phase8a-underwriting .phase8a-exec-panel { min-width:0; padding-top:7px; border-top:1px solid var(--iq8a-rule); }
.iq-phase8a-underwriting .phase8a-exec-panel ul { margin:0; padding-left:15px; }
.iq-phase8a-underwriting .phase8a-exec-panel li { margin-bottom:4px; font-size:7.6pt; line-height:1.35; }
.iq-phase8a-underwriting .phase8a-exec-boundary { margin:7px 0 0; padding-top:6px; border-top:1px solid #ece9e1; color:#737b76; font-size:6.6pt; line-height:1.35; }

/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */`
);

console.log("phase8a-slice-b-patch: PATCHED");
