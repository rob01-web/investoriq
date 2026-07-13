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

  it("v2 bridge regions in generate-client-report are Source Truth gated and do not classify docs", () => {
    const bridgeSource = fs.readFileSync(path.resolve("api/_lib/generate-client-report-impl.js"), "utf8");
    assert.ok(
      bridgeSource.includes('const acqMemoV2SourceAuthorityEnabled = effectiveReportMode === "v1_core";'),
      "Acquisition Memo must use the Source Truth authority lane unconditionally"
    );
    assert.ok(
      !bridgeSource.includes('process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY === "true"'),
      "Acquisition Memo authority must not fall back behind an environment gate"
    );

    assert.ok(bridgeSource.includes("// --- V2 SOURCE AUTHORITY BRIDGE START ---"), "Expected Source Truth bridge region");
    assert.match(
      bridgeSource,
      /if \(effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled\)/,
      "Source Truth bridge must be Acquisition Memo scoped"
    );
    assert.match(
      bridgeSource,
      /!\(effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge\?\.renderedAcquisitionMemo\)[\s\S]{0,180}DOCUMENT_TREATMENT_SUMMARY/,
      "Legacy document-treatment fallback must remain disabled for the Source Truth render"
    );

    assert.ok(bridgeSource.includes("buildCanonicalSourceTruthPackage"), "Bridge must build canonical Source Truth");
    assert.ok(bridgeSource.includes("constrainCanonicalSourcePackageToSourceTruth"), "Bridge must derive the consume-only package from Source Truth");
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
