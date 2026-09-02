import fs from "node:fs";

function replaceExact(file, before, after, expected = 1) {
  const source = fs.readFileSync(file, "utf8");
  const count = source.split(before).length - 1;
  if (count !== expected) {
    throw new Error(`PHASE8_SCREENING_EVIDENCE_ANCHOR_SEAM_MISMATCH:${file}:expected=${expected}:actual=${count}`);
  }
  fs.writeFileSync(file, source.replace(before, after), "utf8");
}

const authorityFile = "api/_lib/phase8-customer-facing-visual-authority.js";
const beforeAuthority = `function injectScreeningEvidence(html = "", sourceTruthPackage = null) {
  const evidence = buildScreeningEvidenceSection(sourceTruthPackage);
  if (!evidence || String(html).includes('data-iq-phase8-section="screening-operating-evidence"')) return String(html || "");
  if (String(html).includes("<!-- END SECTION_0_5 -->")) {
    return String(html).replace("<!-- END SECTION_0_5 -->", \`<!-- END SECTION_0_5 -->\\n\${evidence}\`);
  }
  return String(html || "");
}`;
const afterAuthority = `function injectScreeningEvidence(html = "", sourceTruthPackage = null) {
  const evidence = buildScreeningEvidenceSection(sourceTruthPackage);
  const source = String(html || "");
  if (!evidence || source.includes('data-iq-phase8-section="screening-operating-evidence"')) return source;

  if (source.includes("<!-- END SECTION_0_5 -->")) {
    return source.replace("<!-- END SECTION_0_5 -->", \`<!-- END SECTION_0_5 -->\\n\${evidence}\`);
  }

  const methodologyNeedles = [
    "Methodology &amp; Data Transparency",
    "Methodology & Data Transparency",
  ];
  const methodologyIndex = methodologyNeedles
    .map((needle) => source.indexOf(needle))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (Number.isInteger(methodologyIndex) && methodologyIndex >= 0) {
    const methodologySectionIndex = source.lastIndexOf("<section", methodologyIndex);
    if (methodologySectionIndex >= 0) {
      return \`\${source.slice(0, methodologySectionIndex)}\${evidence}\\n\${source.slice(methodologySectionIndex)}\`;
    }
  }

  if (/<\\/body>/i.test(source)) {
    return source.replace(/<\\/body>/i, \`\${evidence}\\n</body>\`);
  }

  return \`\${source}\\n\${evidence}\`;
}`;
replaceExact(authorityFile, beforeAuthority, afterAuthority);

const smokeFile = "tests/qa/phase8-customer-facing-visual-authority-smoke.js";
const beforeSmoke = `assert.equal(/\\bparser\\b/i.test(screeningVisible), false);
assert.equal(phase8CustomerFacingAuthorityMetadata("screening_v1").hardcodedPageCount, false);`;
const afterSmoke = `assert.equal(/\\bparser\\b/i.test(screeningVisible), false);
assert.equal(phase8CustomerFacingAuthorityMetadata("screening_v1").hardcodedPageCount, false);

const screeningWithoutExecutiveMarker = screeningInput.replace("<!-- END SECTION_0_5 -->", "");
const screeningFallback = applyPhase8CustomerFacingVisualAuthority(screeningWithoutExecutiveMarker, {
  reportMode: "screening_v1",
  sourceTruthPackage,
});
assert.match(screeningFallback, /Operating Evidence &amp; Diligence Priorities/);
assert.ok(
  screeningFallback.indexOf("Operating Evidence &amp; Diligence Priorities") <
    screeningFallback.indexOf("Methodology &amp; Data Transparency"),
  "Screening evidence fallback must insert before methodology when the executive marker is absent"
);`;
replaceExact(smokeFile, beforeSmoke, afterSmoke);

console.log("phase8-repair-screening-evidence-anchor: PATCHED");
