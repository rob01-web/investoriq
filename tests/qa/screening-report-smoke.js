import assert from "assert";
import fs from "fs";

const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");

const screeningBranchAnchor = reportSource.indexOf('outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");');
const screeningBranchStart = reportSource.lastIndexOf('if (effectiveReportMode === "screening_v1") {', screeningBranchAnchor);

assert.ok(screeningBranchAnchor >= 0, "Missing screening branch anchor");
assert.ok(screeningBranchStart >= 0, "Missing screening render branch");

function extractBracedBlock(source, startIndex) {
  const openBraceIndex = source.indexOf("{", startIndex);
  assert.ok(openBraceIndex >= 0, "Missing opening brace for screening branch");

  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingleQuote) {
      if (!escaped && char === "'") {
        inSingleQuote = false;
      }
      escaped = !escaped && char === "\\";
      continue;
    }

    if (inDoubleQuote) {
      if (!escaped && char === '"') {
        inDoubleQuote = false;
      }
      escaped = !escaped && char === "\\";
      continue;
    }

    if (inTemplate) {
      if (!escaped && char === "`") {
        inTemplate = false;
      }
      escaped = !escaped && char === "\\";
      continue;
    }

    if (char === "/" && nextChar === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      escaped = false;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      escaped = false;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      escaped = false;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex, index + 1);
      }
    }
  }

  assert.fail("Unterminated screening branch block");
}

const screeningBranchSource = extractBracedBlock(reportSource, screeningBranchStart);
assert.equal(/renderCompleteAcquisitionMemoV2Html\(/.test(screeningBranchSource), false);
assert.equal(/Preliminary Financing Readiness Summary/i.test(screeningBranchSource), false);
assert.equal(/Source Context \/ Support Document Treatment/i.test(screeningBranchSource), false);

const screeningLaneOutputAnchor = reportSource.search(/\b(?:const|let)\s+screeningLaneOutput\s*=/);
const acquisitionDocTreatmentAnchor = reportSource.indexOf("const richerDocumentTreatmentHtml = buildDocumentTreatmentSummaryHtml({");
const v2FinalizationAnchor = reportSource.indexOf('if (effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.acquisitionMemoProjection)', screeningLaneOutputAnchor);
assert.ok(screeningLaneOutputAnchor >= 0, "Missing screening lane output anchor");
assert.ok(acquisitionDocTreatmentAnchor >= 0, "Missing acquisition document-treatment anchor");
assert.ok(v2FinalizationAnchor >= 0, "Missing acquisition V2 finalization anchor");
assert.ok(screeningLaneOutputAnchor < acquisitionDocTreatmentAnchor, "Screening lane output must be established before document-treatment mutation");
assert.ok(screeningLaneOutputAnchor < v2FinalizationAnchor, "Screening lane output must be established before V2 finalization mutation");

assert.match(reportSource, /buildScreeningDataCoverageSummary\(/);
assert.match(reportSource, /buildScreeningIncomeForensicsHtml\(/);
assert.match(reportSource, /buildScreeningExpenseStructureHtml\(/);
assert.match(reportSource, /buildScreeningNoiStabilityHtml\(/);
assert.match(reportSource, /buildScreeningRentRollDistributionHtml\(/);

const screeningForbiddenPatterns = [
  /\bDSCR\b/i,
  /refinance proceeds/i,
  /\bDCF\b/i,
  /\bwaterfall\b/i,
  /equity return/i,
  /deal score/i,
  /final recommendation/i,
  /\bBUY\b/i,
  /\bSELL\b/i,
  /\bHOLD\b/i,
  /loan approval/i,
  /lender commitment/i,
];
const screeningForbiddenHit = screeningForbiddenPatterns.find((pattern) => pattern.test(screeningBranchSource));
assert.equal(Boolean(screeningForbiddenHit), false);

console.log("screening-report smoke PASS");
