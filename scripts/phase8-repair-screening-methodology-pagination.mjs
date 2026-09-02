import fs from "node:fs";

const file = "api/_lib/phase8-customer-facing-visual-authority.js";
const source = fs.readFileSync(file, "utf8");
const before = `.iq-phase8-screening .phase8-methodology-compact { padding-top:12px; }\n.iq-phase8-screening .phase8-methodology-compact .section-header { margin-bottom:10px; }`;
const after = `.iq-phase8-screening .phase8-methodology-compact { padding-top:10px; padding-bottom:4px; }\n.iq-phase8-screening .phase8-methodology-compact .section-header { margin-bottom:7px; padding-bottom:7px; }\n.iq-phase8-screening .phase8-methodology-compact .methodology-section p { margin:2px 0 6px !important; line-height:1.38; }\n.iq-phase8-screening .phase8-methodology-compact .methodology-section h3 { margin:7px 0 2px !important; font-size:14px; line-height:1.18; }`;
const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`PHASE8_SCREENING_METHODOLOGY_PAGINATION_SEAM_MISMATCH:expected=1:actual=${count}`);
}
fs.writeFileSync(file, source.replace(before, after), "utf8");
console.log("phase8-repair-screening-methodology-pagination: PATCHED");
