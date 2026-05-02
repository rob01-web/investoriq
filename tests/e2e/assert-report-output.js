import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

export function normalizeReportText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function readReportText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  if (ext === ".pdf") {
    const parsed = await pdfParse(buffer);
    return normalizeReportText(parsed.text || "");
  }
  return normalizeReportText(buffer.toString("utf8"));
}

function contains(text, needle) {
  return text.toLowerCase().includes(String(needle).toLowerCase());
}

function add(results, name, pass, notes = "") {
  results.push({
    name,
    expected: "pass",
    actual: pass ? "pass" : "fail",
    result: pass ? "PASS" : "FAIL",
    notes,
  });
}

export function assertReportOutput(text, options = {}) {
  const normalized = normalizeReportText(text);
  const compact = normalized.replace(/\s+/g, " ");
  const profile = options.profile || "generic";
  const results = [];

  add(results, "No BUY/SELL language", !/\b(BUY|SELL)\b/i.test(compact));
  add(results, "No public AI terminology", !/\b(AI|artificial intelligence|AI-assisted|AI fallback|AI QA)\b/i.test(compact));
  add(results, "No Market Rent Premium label", !contains(compact, "Market Rent Premium (Avg)"));
  add(results, "No post-reno target rent label", !contains(compact, "Target Rent (Post-Reno)"));
  add(results, "No Monthly Lift rent-positioning label", !contains(compact, "Monthly Lift"));
  add(results, "No dangling DATA NOT AVAILABLE block", !/DATA NOT AVAILABLE\s*(?:\n|\s){0,80}(?:DATA NOT AVAILABLE|Section intentionally omitted)/i.test(compact));
  add(results, "Refi sufficiency heading has no trailing period", !contains(compact, "Full Refinance Sufficiency (Deterministic)."));
  add(results, "Value sensitivity heading has no trailing period", !/IMPLIED VALUE SENSITIVITY AT STABILIZATION\./i.test(compact));
  add(results, "Top income concentration value has no dangling period", !/TOP INCOME LINE CONCENTRATION\s+\d+(?:\.\d+)?%\./i.test(compact));

  if (contains(compact, "124 Richmond")) {
    add(results, "124 Richmond rent gap regression absent", !contains(compact, "14.8%"));
    add(results, "124 Richmond rent gap expected basis present", contains(compact, "17.4%"));
  }

  if (contains(compact, "Market Rent Gap") || contains(compact, "Rent Roll Distribution")) {
    add(results, "Market Rent Gap label present", contains(compact, "Market Rent Gap (Avg)"));
  }

  if (profile === "underwriting-dscr-constrained" || contains(compact, "Review - Debt Coverage Constraint")) {
    add(results, "DSCR constrained verdict present", contains(compact, "Review - Debt Coverage Constraint"));
    add(results, "Composite score remains visible", /Composite Score:\s*\d+\s*\/\s*100/i.test(compact));
    add(results, "DSCR computed row remains visible", contains(compact, "DSCR (Computed)"));
    add(results, "Deal Score note has cap clarity", contains(compact, "Base score thresholds") && contains(compact, "mandatory Review verdict cap"));
  }

  return results;
}

export async function assertReportFile(filePath, options = {}) {
  const text = await readReportText(filePath);
  return assertReportOutput(text, options).map((row) => ({
    ...row,
    source: filePath,
  }));
}

