import assert from "assert";
import fs from "fs";
import path from "path";
import { describe, it } from "node:test";

describe("acquisition memo authority boundary smoke", () => {
  it("projection and renderer do not directly reference forbidden authority fields", () => {
    const files = [
      path.resolve("api/_lib/acquisition-memo-projection.js"),
      path.resolve("api/_lib/acquisition-memo-renderer.js"),
    ];
    const forbiddenStrings = [
      "semantic_doc_role",
      "debt_basis",
      "doc_type",
      "parse_error",
      "document_text_extracted",
      "originalFilename.toLowerCase",
      "filename.toLowerCase",
      ".includes(",
    ];

    for (const filePath of files) {
      const source = fs.readFileSync(filePath, "utf8");
      for (const forbidden of forbiddenStrings) {
        assert.ok(
          !source.includes(forbidden),
          `Forbidden string ${JSON.stringify(forbidden)} found in ${filePath}`
        );
      }
    }
  });

  it("v2 bridge regions in generate-client-report are gated and do not classify docs", () => {
    const bridgeSource = fs.readFileSync(path.resolve("api/generate-client-report.js"), "utf8");
    assert.ok(
      bridgeSource.includes("const acqMemoV2SourceAuthorityEnabled ="),
      "V2 gate variable missing from generate-client-report.js"
    );
    assert.ok(
      bridgeSource.includes('process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY === "true"'),
      "Environment gate missing from generate-client-report.js"
    );
    assert.ok(
      bridgeSource.includes("body?.__test_enable_acq_memo_v2_source_authority === true"),
      "Test-only gate missing from generate-client-report.js"
    );

    const regionStarts = [
      bridgeSource.indexOf("// --- V2 SOURCE AUTHORITY BRIDGE START ---"),
      bridgeSource.indexOf("if (effectiveReportMode === \"v1_core\" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.renderedAcquisitionMemo) {"),
      bridgeSource.indexOf("if (!(effectiveReportMode === \"v1_core\" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.renderedAcquisitionMemo) && typeof finalHtml === \"string\" && finalHtml.includes(\"<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->\")) {"),
    ];

    for (const regionStart of regionStarts) {
      assert.ok(regionStart >= 0, "Expected V2 gated region not found in generate-client-report.js");
      const region = bridgeSource.slice(Math.max(0, regionStart - 80), Math.min(bridgeSource.length, regionStart + 1200));
      assert.ok(
        region.includes("effectiveReportMode === \"v1_core\" && acqMemoV2SourceAuthorityEnabled"),
        "Every V2 bridge/injection/fallback region must be gated by effectiveReportMode and acqMemoV2SourceAuthorityEnabled"
      );
    }

    assert.ok(bridgeSource.includes("buildCanonicalSourcePackage"), "Bridge must build the canonical source package");
    assert.ok(bridgeSource.includes("buildAcquisitionMemoProjection"), "Bridge must build the projection");
    assert.ok(bridgeSource.includes("renderAcquisitionMemo"), "Bridge must render the memo");

    const bridgeBlock = bridgeSource.slice(
      bridgeSource.indexOf("// --- V2 SOURCE AUTHORITY BRIDGE START ---"),
      bridgeSource.indexOf("// --- V2 SOURCE AUTHORITY BRIDGE END ---", bridgeSource.indexOf("// --- V2 SOURCE AUTHORITY BRIDGE START ---") + 1)
    );

    const forbiddenBridgeStrings = [
      "semantic_doc_role",
      "debt_basis",
      "doc_type",
      "parse_error",
      "document_text_extracted",
      "originalFilename.toLowerCase",
      "filename.toLowerCase",
    ];

    for (const forbidden of forbiddenBridgeStrings) {
      assert.ok(!bridgeBlock.includes(forbidden), `Forbidden string ${JSON.stringify(forbidden)} found in V2 bridge block`);
    }
  });
});
