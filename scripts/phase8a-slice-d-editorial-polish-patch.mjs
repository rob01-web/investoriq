import fs from "node:fs";

const target = "api/_lib/phase8a-owner-acceptance-authority.js";
let source = fs.readFileSync(target, "utf8");

const humanizeTail = `    .replace(/\\b64-Unit\\b/gi, "64 Unit")\n    .replace(/\\b48-Unit\\b/gi, "48 Unit");`;
if (!source.includes(humanizeTail)) {
  throw new Error("PHASE8A_SLICE_D_HUMANIZE_TAIL_MISSING");
}

const polishedHumanizeTail = `    .replace(/\\b64-Unit\\b/gi, "64 Unit")\n    .replace(/\\b48-Unit\\b/gi, "48 Unit")\n    .replace(/(<div class="cover-prop-sub">)\\s*Underwriting Report\\s*(<\\/div>)/i, "$1Investment Committee Memorandum$2")\n    .replace(/Evidence Conviction Matrix/gi, "Decision Evidence Map")\n    .replace(/Decision evidence already presented in this report, organized by decision domain\\./gi, "Where the report supports each core committee question.")\n    .replace(/<th>report sections<\\/th>/gi, "<th>Report Sections</th>")\n    .replace(/This matrix organizes existing report evidence only\\. It does not independently score source quality, infer missing evidence, or create new underwriting assumptions\\./gi, "This map points to existing report sections only. It does not score source quality, fill evidence gaps, or add underwriting assumptions.");`;
source = source.replace(humanizeTail, polishedHumanizeTail);

const cssMarker = `.iq-phase8a-underwriting .phase8a-exec-boundary { margin-top:6px; font-size:5.7pt; line-height:1.25; }\n\n/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */`;
if (!source.includes(cssMarker)) {
  throw new Error("PHASE8A_SLICE_D_EDITORIAL_CSS_MARKER_MISSING");
}

const cssReplacement = `.iq-phase8a-underwriting .phase8a-exec-boundary { margin-top:6px; font-size:5.7pt; line-height:1.25; }\n\n/* Final owner-acceptance editorial treatment for the decision evidence map. */\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix { margin-top:10px !important; padding:10px 12px !important; border:1px solid var(--iq8a-rule) !important; border-top:2px solid var(--iq8a-forest) !important; background:#fff !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix .subsection-title { margin-bottom:3px !important; font-size:10pt !important; color:var(--iq8a-ink) !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix > p.small { margin:0 0 6px !important; color:#6e7771 !important; font-size:5.9pt !important; line-height:1.3 !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix table { width:100% !important; table-layout:fixed !important; margin-top:5px !important; border-collapse:collapse !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th { padding:5px 6px !important; color:#68716b !important; font-size:5.5pt !important; letter-spacing:.065em !important; text-transform:uppercase !important; vertical-align:bottom !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td { padding:5px 6px !important; font-size:5.9pt !important; line-height:1.32 !important; vertical-align:top !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th:nth-child(1),\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td:nth-child(1) { width:21% !important; font-weight:600 !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th:nth-child(2),\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td:nth-child(2) { width:11% !important; text-align:center !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix th:nth-child(3),\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix td:nth-child(3) { width:68% !important; }\n.iq-phase8a-underwriting .phase7-evidence-conviction-matrix tbody tr:nth-child(even) td { background:#fbfaf7 !important; }\n\n/* Underwriting cover must retain the same family geometry without the Phase 7 gold-square collision. */`;
source = source.replace(cssMarker, cssReplacement);

fs.writeFileSync(target, source, "utf8");
console.log("phase8a-slice-d-editorial-polish-patch: PATCHED");
