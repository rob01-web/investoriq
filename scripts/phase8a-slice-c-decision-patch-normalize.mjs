import fs from "node:fs";

const filePath = "scripts/phase8a-slice-c-decision-snapshot-patch.mjs";
let source = fs.readFileSync(filePath, "utf8");

function escapeGeneratedTemplateInterpolations(declaration, closingMarker) {
  const startMarker = `const ${declaration} = \``;
  const start = source.indexOf(startMarker);
  const end = source.indexOf(closingMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`PHASE8A_DECISION_PATCH_NORMALIZE_MARKER_MISSING:${declaration}`);
  }
  const bodyStart = start + startMarker.length;
  const body = source.slice(bodyStart, end);
  const normalized = body.replace(/(^|[^\\])\$\{/g, "$1\\${");
  source = `${source.slice(0, bodyStart)}${normalized}${source.slice(end)}`;
}

escapeGeneratedTemplateInterpolations(
  "screeningDisposition",
  "`;\nreplaceRange(phase8aPath, \"function injectScreeningDisposition"
);
escapeGeneratedTemplateInterpolations(
  "executiveSnapshotRenderer",
  "`;\nreplaceRange(chapter1Path, \"function renderExecutiveInvestmentSummary"
);

fs.writeFileSync(filePath, source, "utf8");
console.log("phase8a-slice-c-decision-patch-normalize: NORMALIZED");
