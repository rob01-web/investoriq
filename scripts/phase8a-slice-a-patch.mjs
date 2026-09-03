import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, value) {
  fs.writeFileSync(path.join(root, rel), value, "utf8");
}

function replaceExact(rel, before, after, expected = 1) {
  const source = read(rel);
  const count = source.split(before).length - 1;
  if (count !== expected) {
    throw new Error(`PHASE8A_PATCH_SEAM_MISMATCH:${rel}:expected=${expected}:actual=${count}:needle=${before.slice(0, 140)}`);
  }
  write(rel, source.split(before).join(after));
}

const authority = "api/_lib/phase8-customer-facing-visual-authority.js";

replaceExact(
  authority,
  `const PHASE8_MARKER = "elite-customer-facing-authority-v1";`,
  `import { applyPhase8AOwnerAcceptanceAuthority } from "./phase8a-owner-acceptance-authority.js";\n\nconst PHASE8_MARKER = "elite-customer-facing-authority-v1";`
);

replaceExact(
  authority,
  `function money(value) {\n  const n = finite(value);\n  if (n === null) return null;\n  return \`$\${Math.round(n).toLocaleString("en-CA")}\`;\n}`,
  `function money(value) {\n  const n = finite(value);\n  if (n === null) return null;\n  const normalized = Object.is(n, -0) ? 0 : n;\n  const absolute = Math.abs(Math.round(normalized)).toLocaleString("en-CA");\n  return normalized < 0 ? \`($\${absolute})\` : \`$\${absolute}\`;\n}`
);

replaceExact(
  authority,
  `  source = sanitizeVisibleMarkup(source, lane);\n  source = injectStyle(addPhase8BodyMarker(source, lane));\n  assertCustomerSurface(source, lane, sourceTruthPackage);`,
  `  source = sanitizeVisibleMarkup(source, lane);\n  source = injectStyle(addPhase8BodyMarker(source, lane));\n  source = applyPhase8AOwnerAcceptanceAuthority(source, { lane, sourceTruthPackage });\n  assertCustomerSurface(source, lane, sourceTruthPackage);`
);

const screeningRenderer = "api/_lib/screening-report-renderer.js";
replaceExact(
  screeningRenderer,
  `Multifamily - \${unitCount} Units`,
  `Multifamily | \${unitCount} Units`
);

const underwritingDocument = "api/_lib/acquisition-memo-v2-document.js";
replaceExact(
  underwritingDocument,
  `if (Number.isFinite(unitCount) && unitCount > 0 && assetClass) return \`\${Math.round(unitCount)}-Unit \${assetClass}\`;`,
  `if (Number.isFinite(unitCount) && unitCount > 0 && assetClass) return \`\${Math.round(unitCount)} Unit \${assetClass}\`;`
);
replaceExact(
  underwritingDocument,
  `if (Number.isFinite(unitCount) && unitCount > 0) return \`\${Math.round(unitCount)}-Unit\`;`,
  `if (Number.isFinite(unitCount) && unitCount > 0) return \`\${Math.round(unitCount)} Unit\`;`
);

console.log("phase8a-slice-a-patch: PATCHED");
