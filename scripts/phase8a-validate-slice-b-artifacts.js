import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.PHASE8_ARTIFACT_DIR || "phase8a-artifacts");
const underwritingPath = path.join(dir, "phase7-underwriting-stonebridge.html");
if (!fs.existsSync(underwritingPath)) throw new Error("PHASE8A_SLICE_B_UNDERWRITING_ARTIFACT_MISSING");
const html = fs.readFileSync(underwritingPath, "utf8");
const text = html
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ")
  .trim();

const required = [
  /Current Decision State\s+RECONCILIATION REQUIRED/i,
  /Investment Thesis/i,
  /What Must Be True/i,
  /Purchase Price\s+\$13,500,000/i,
  /T12 NOI\s+\$945,000/i,
  /Occupancy\s+93\.8%/i,
  /Going-In Cap Rate\s+7\.0%/i,
  /Proposed Loan\s+\$9,450,000/i,
  /Proposed DSCR\s+1\.40x/i,
  /\$285,600 of annual gross rent difference/i,
  /tightens DSCR from 2\.01x currently to 1\.40x, a 0\.61x reduction in coverage/i,
  /T12 and Rent Roll income bases must be reconciled/i,
];
for (const pattern of required) {
  if (!pattern.test(text)) throw new Error(`PHASE8A_SLICE_B_REQUIRED_COPY_MISSING:${pattern}`);
}

if (/Document-backed committee framing using verified source facts and deterministic calculations/i.test(text)) {
  throw new Error("PHASE8A_SLICE_B_QA_OPENING_SURVIVED");
}
if (/\bBUY\b|\bSELL\b/.test(text)) throw new Error("PHASE8A_SLICE_B_FORBIDDEN_INVESTMENT_ADVICE");
if (!/\.phase8a-exec-metrics \{ display:grid;/i.test(html)) throw new Error("PHASE8A_SLICE_B_EXEC_STYLE_MISSING");

console.log("phase8a-validate-slice-b-artifacts: PASS");
