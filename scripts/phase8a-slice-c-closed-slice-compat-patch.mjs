import fs from "node:fs";

function patchFile(filePath, before, after) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.includes(before)) {
    throw new Error(`PHASE8A_SLICE_C_CLOSED_SLICE_COMPAT_MISSING:${filePath}`);
  }
  fs.writeFileSync(filePath, source.replace(before, after), "utf8");
}

patchFile(
  "api/_lib/phase8a-owner-acceptance-authority.js",
  `function screeningReadinessLabel(d = {}) {\n  if (d.disposition === "ADVANCE") return "READY FOR FULL UNDERWRITING";\n  if (d.disposition === "DO NOT ADVANCE") return "DO NOT PROGRESS";\n  if (d.disposition === "INSUFFICIENT EVIDENCE") return "NOT ENOUGH CORE EVIDENCE";\n  return "BLOCKED ON CURRENT GATE";\n}`,
  `function screeningReadinessLabel(d = {}) {\n  if (d.disposition === "ADVANCE") return "ADVANCE";\n  if (d.disposition === "DO NOT ADVANCE") return "DO NOT ADVANCE";\n  if (d.disposition === "INSUFFICIENT EVIDENCE") return "INSUFFICIENT EVIDENCE";\n  return "HOLD";\n}`
);

patchFile(
  "scripts/phase8a-validate-slice-a-artifacts.js",
  `if (!/Screening Disposition\\s+HOLD/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_HOLD_MISSING");`,
  `if (!/Screening Decision Snapshot\\s+HOLD/i.test(screeningText)) throw new Error("PHASE8A_SCREENING_HOLD_MISSING");`
);

console.log("phase8a-slice-c-closed-slice-compat-patch: PATCHED");
