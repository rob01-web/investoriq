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

  it("v2 bridge region in generate-client-report is gated and does not classify docs", () => {
    const bridgeSource = fs.readFileSync(path.resolve("api/generate-client-report.js"), "utf8");
    const start = bridgeSource.indexOf("// --- V2 SOURCE AUTHORITY BRIDGE START ---");
    const end = bridgeSource.indexOf("// --- V2 SOURCE AUTHORITY BRIDGE END ---", start + 1);

    assert.ok(start >= 0 && end > start, "V2 bridge markers not found in generate-client-report.js");

    const bridgeBlock = bridgeSource.slice(start, end);
    assert.ok(bridgeBlock.includes("acqMemoV2SourceAuthorityEnabled"), "Bridge gate missing from V2 bridge block");
    assert.ok(bridgeBlock.includes("buildCanonicalSourcePackage"), "Bridge block must build the canonical source package");
    assert.ok(bridgeBlock.includes("buildAcquisitionMemoProjection"), "Bridge block must build the projection");
    assert.ok(bridgeBlock.includes("renderAcquisitionMemo"), "Bridge block must render the memo");

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
