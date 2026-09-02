import "./phase8-apply-repair.mjs";
import fs from "node:fs";

const rel = "api/_lib/full-underwriting-final-surgical-polish.js";
const source = fs.readFileSync(rel, "utf8");
const before = [
  "  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });",
  "  const phase8Authorized = applyPhase8CustomerFacingVisualAuthority(decisionSupported, { reportMode, sourceTruthPackage });",
  "  return phase8Authorized",
  "    .split(/(<style\\b[^>]*>[\\s\\S]*?<\\/style>|<script\\b[^>]*>[\\s\\S]*?<\\/script>)/gi)",
  "    .map((part) => (/^<(?:style|script)\\b/i.test(part) ? part : sanitizeMarkupText(part)))",
  "    .join(\"\");",
].join("\n");
const after = [
  "  const decisionSupported = applyPhase7DecisionSupport(elitePresented, { reportMode });",
  "  const legacySanitized = decisionSupported",
  "    .split(/(<style\\b[^>]*>[\\s\\S]*?<\\/style>|<script\\b[^>]*>[\\s\\S]*?<\\/script>)/gi)",
  "    .map((part) => (/^<(?:style|script)\\b/i.test(part) ? part : sanitizeMarkupText(part)))",
  "    .join(\"\");",
  "  return applyPhase8CustomerFacingVisualAuthority(legacySanitized, { reportMode, sourceTruthPackage });",
].join("\n");
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_UNDERWRITING_ORDER_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(rel, source.replace(before, after), "utf8");
console.log("phase8-apply-repair-v2: PATCHED");
