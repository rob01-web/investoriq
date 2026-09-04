import fs from "node:fs";
import path from "node:path";
import { analyzeFinalPdfBytes } from "../api/_lib/final-pdf-publication-quality-boss.js";

const dir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8a-artifacts");
const targets = [
  { label: "screening", file: "phase7-screening-harbourstone.pdf" },
  { label: "underwriting", file: "phase7-underwriting-stonebridge.pdf" },
];
const receiptPath = path.join(dir, "phase8a-slice-d-page-continuity.txt");
const receipt = [];
const failures = [];

for (const target of targets) {
  const pdfPath = path.join(dir, target.file);
  if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size <= 0) {
    throw new Error(`PHASE8A_SLICE_D_PDF_MISSING:${target.label}`);
  }

  const analysis = await analyzeFinalPdfBytes(fs.readFileSync(pdfPath));
  receipt.push(`${target.file} pages=${analysis.pageCount}`);

  for (const page of analysis.pages) {
    const nonspaceChars = String(page.text || "").replace(/\s+/g, "").length;
    receipt.push(`page=${page.pageNumber} nonspace_chars=${nonspaceChars}`);
    const minimum = page.pageNumber === 1 ? 20 : 80;
    if (nonspaceChars < minimum) {
      failures.push({
        report: target.label,
        page: page.pageNumber,
        nonspaceChars,
        minimum,
      });
    }
  }
}

fs.writeFileSync(receiptPath, `${receipt.join("\n")}\n`, "utf8");

if (failures.length > 0) {
  throw new Error(`PHASE8A_SLICE_D_STRANDED_PDF_PAGE:${JSON.stringify(failures)}`);
}

console.log(`phase8a-validate-pdf-page-continuity: PASS (${receiptPath})`);
