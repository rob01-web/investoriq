import fs from "node:fs";

function patchFile(filePath, before, after) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.includes(before)) {
    throw new Error(`PHASE8A_SLICE_C_DECISION_SUPPORT_COMPAT_MISSING:${filePath}`);
  }
  fs.writeFileSync(filePath, source.replace(before, after), "utf8");
}

patchFile(
  "api/_lib/phase7-decision-support.js",
  `  const executiveHeadingIndex = source.search(/class\\s*=\\s*(["'])[^"']*\\bsection-header-title\\b[^"']*\\1[^>]*>\\s*Executive(?:\\s+Investment)?\\s+Summary\\s*<\\/span>/i);`,
  `  const executiveHeadingIndex = source.search(/class\\s*=\\s*(["'])[^"']*\\bsection-header-title\\b[^"']*\\1[^>]*>\\s*(?:Executive(?:\\s+Investment)?\\s+Summary|Investment\\s+Decision\\s+Snapshot)\\s*<\\/span>/i);`
);

patchFile(
  "api/_lib/phase8a-owner-acceptance-authority.js",
  `.iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] { page:iq-decision; break-before:page; break-after:page; }`,
  `.iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] { page:iq-decision; break-before:page; break-after:page; }\n.iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] .phase7-evidence-conviction-matrix { break-before:page; page-break-before:always; }`
);

console.log("phase8a-slice-c-decision-support-compat-patch: PATCHED");
