import fs from "node:fs";

const file = "api/_lib/phase8-customer-facing-visual-authority.js";
const source = fs.readFileSync(file, "utf8");
const before = `  .iq-phase8-screening .phase8-methodology-compact { break-before:page !important; page-break-before:always !important; }\n}`;
const after = `  .iq-phase8-screening .phase8-methodology-compact { break-before:page !important; page-break-before:always !important; }\n  .iq-phase8-screening .report-footer { display:none !important; }\n}`;
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_SCREENING_PRINT_FOOTER_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(file, source.replace(before, after), "utf8");
console.log("phase8-repair-screening-methodology-pagination: PRINT_FOOTER_COLLISION_PATCHED");
