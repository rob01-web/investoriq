import fs from "node:fs";

const target = "api/_lib/phase8a-owner-acceptance-authority.js";
const source = fs.readFileSync(target, "utf8");
const before = `  const cushion = d.occupancy !== null && d.breakEvenOccupancy !== null\n    ? \`${'${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)}'} pp\`\n    : "Not available";`;
const after = `  const cushion = d.occupancy !== null && d.breakEvenOccupancy !== null\n    ? \`${'${((d.occupancy - d.breakEvenOccupancy) * 100).toFixed(1)}'} pp above break-even\`\n    : "Not available";`;

if (!source.includes(before)) {
  throw new Error("PHASE8A_SLICE_C_OPERATING_CUSHION_SOURCE_MISSING");
}

fs.writeFileSync(target, source.replace(before, after), "utf8");
console.log("phase8a-slice-c-operating-cushion-compat-patch: PATCHED");
