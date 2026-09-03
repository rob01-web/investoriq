import fs from "node:fs";
import path from "node:path";

import pdfParse from "pdf-parse";

import { assertPhase8ArtifactTextIdentity } from "./phase8-artifact-identity-fingerprint.js";

const artifactDir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8-artifacts");
const artifacts = {
  screening: path.join(artifactDir, "phase7-screening-harbourstone.pdf"),
  underwriting: path.join(artifactDir, "phase7-underwriting-stonebridge.pdf"),
};

const validation = {};
for (const [report, filePath] of Object.entries(artifacts)) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error(`PHASE8_RENDERED_PDF_MISSING:${report}:${filePath}`);
  }
  const parsed = await pdfParse(fs.readFileSync(filePath));
  if (!Number.isInteger(parsed.numpages) || parsed.numpages < 1) {
    throw new Error(`PHASE8_RENDERED_PDF_PAGE_COUNT_INVALID:${report}:${parsed.numpages}`);
  }
  validation[report] = {
    file: path.basename(filePath),
    bytes: fs.statSync(filePath).size,
    pages: parsed.numpages,
    identity: assertPhase8ArtifactTextIdentity({ report, text: parsed.text }),
  };
}

const manifestPath = path.join(artifactDir, "phase8-visual-authority-manifest.json");
if (!fs.existsSync(manifestPath)) {
  throw new Error(`PHASE8_VISUAL_AUTHORITY_MANIFEST_MISSING:${manifestPath}`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.rendered_pdf_validation = validation;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`phase8-validate-rendered-pdfs: PASS (${artifactDir})`);
